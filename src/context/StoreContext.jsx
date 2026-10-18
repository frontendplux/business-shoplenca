import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { api, setAuthToken, setSavedCurrency, getSavedCurrency } from '../services/api';
import { APP_CONFIG } from '../config/appConfig';

const StoreContext = createContext(null);

export function StoreProvider({ children }) {
  const [company, setCompany] = useState(APP_CONFIG.DEFAULT_COMPANY);
  const [categories, setCategories] = useState([]);
  const [unlinkedBrands, setUnlinkedBrands] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [currency, setCurrencyState] = useState({
    code: 'USD',
    name: 'US Dollar',
    symbol: '$',
    exchange_rate: 1,
  });
  const [user, setUser] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [wishlistIds, setWishlistIds] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [pushPermission, setPushPermission] = useState(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState([]);
  const lastSeenNotifId = useRef(0);

  const showToast = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  // Register Service Worker for Web Push Notifications
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
  }, []);

  const triggerBrowserPush = useCallback((title, body, url = '/') => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready
        .then((reg) => {
          reg.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            data: { url },
          });
        })
        .catch(() => {
          try {
            new Notification(title, { body });
          } catch {}
        });
    } else {
      try {
        new Notification(title, { body });
      } catch {}
    }
  }, []);

  const enablePushNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      showToast('Push notifications are not supported by this browser.', 'error');
      return false;
    }

    try {
      const perm = await Notification.requestPermission();
      setPushPermission(perm);
      if (perm === 'granted') {
        await api.notificationAction('subscribe', {
          endpoint: window.location.origin + '/web-push-client',
          p256dh: 'browser-granted',
          auth_key: 'active',
        });
        triggerBrowserPush(
          `${company?.name || 'Shoplenca'} Push Alerts Enabled!`,
          'You will now receive instant order, vendor verification, and domain renewal alerts.',
          '/members'
        );
        showToast('Browser Push Notifications enabled!', 'success');
        return true;
      } else {
        showToast('Notification permission was declined.', 'info');
        return false;
      }
    } catch {
      showToast('Could not enable push notifications.', 'error');
      return false;
    }
  }, [company?.name, showToast, triggerBrowserPush]);

  const refreshBootstrap = useCallback(
    async (overrideCurrency = null) => {
      const curParam = overrideCurrency || getSavedCurrency() || undefined;
      const res = await api.getBootstrap(curParam);
      if (res && res.ok) {
        if (res.company) setCompany(res.company);
        setCategories(res.categories || []);
        setUnlinkedBrands(res.unlinked_brands || []);
        setCurrencies(res.currencies || []);
        if (res.currency) {
          setCurrencyState(res.currency);
          setSavedCurrency(res.currency.code);
        }
        setUser(res.user || null);
        setCartCount(res.cart_count || 0);
        setWishlistCount(res.wishlist_count || 0);
        setWishlistIds(res.wishlist_ids || []);
        if (Array.isArray(res.notifications)) {
          setNotifications(res.notifications);
          if (res.notifications.length > 0) {
            const newest = res.notifications[0];
            if (lastSeenNotifId.current > 0 && newest.id > lastSeenNotifId.current && !newest.is_read) {
              triggerBrowserPush(newest.title, newest.message, newest.link || '/');
            }
            lastSeenNotifId.current = Math.max(lastSeenNotifId.current, newest.id);
          }
        }
        setUnreadNotifCount(res.unread_notifications || 0);
      }
      setLoading(false);
      return res;
    },
    [triggerBrowserPush]
  );

  useEffect(() => {
    refreshBootstrap();
  }, [refreshBootstrap]);

  const markNotificationsRead = useCallback(async (id = 0) => {
    await api.notificationAction('mark_read', { id });
    if (id > 0) {
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
      setUnreadNotifCount((c) => Math.max(0, c - 1));
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadNotifCount(0);
    }
  }, []);

  const setCurrency = useCallback(
    async (code) => {
      setSavedCurrency(code);
      await refreshBootstrap(code);
      showToast(`Currency switched to ${code}`, 'info');
    },
    [refreshBootstrap, showToast]
  );

  // Format amount in active currency (base prices in DB are USD)
  const money = useCallback(
    (amount) => {
      const rate = parseFloat(currency?.exchange_rate || 1);
      const sym = currency?.symbol || '$';
      const converted = (parseFloat(amount) || 0) * rate;
      const decimals = rate >= 100 ? 0 : 2;
      return (
        sym +
        converted.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      );
    },
    [currency]
  );

  // Convert an NGN amount (such as NGN 500 subdomain fee) into the active selected currency
  const moneyFromNgn = useCallback(
    (amountNgn = 500) => {
      const ngnVal = parseFloat(amountNgn) || 0;
      if (currency?.code === 'NGN') {
        return (
          (currency?.symbol || '₦') +
          ngnVal.toLocaleString(undefined, {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
          })
        );
      }
      const ngnRow = currencies.find((c) => c.code === 'NGN');
      const ngnRate = parseFloat(company?.ngn_rate || ngnRow?.exchange_rate || 1550);
      const usdAmount = ngnRate > 0 ? ngnVal / ngnRate : ngnVal / 1550;
      const activeRate = parseFloat(currency?.exchange_rate || 1);
      const converted = usdAmount * activeRate;
      const sym = currency?.symbol || '$';
      const decimals = converted >= 100 ? 0 : 2;
      return (
        sym +
        converted.toLocaleString(undefined, {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      );
    },
    [currency, currencies, company?.ngn_rate]
  );

  const loginSuccess = useCallback(
    async (token, userObj) => {
      if (token) setAuthToken(token);
      if (userObj) setUser(userObj);
      await refreshBootstrap();
    },
    [refreshBootstrap]
  );

  const setAuthSession = useCallback(
    async (userObj, token) => {
      if (token) setAuthToken(token);
      if (userObj) setUser(userObj);
      await refreshBootstrap();
    },
    [refreshBootstrap]
  );

  const logout = useCallback(async () => {
    await api.auth('logout');
    setAuthToken('');
    setUser(null);
    setCartCount(0);
    setWishlistCount(0);
    setWishlistIds([]);
    showToast('Signed out successfully.', 'info');
  }, [showToast]);

  const addToCart = useCallback(
    async (productOrId, quantity = 1) => {
      let productId = productOrId;
      let qty = quantity;
      let extra = {};
      if (productOrId && typeof productOrId === 'object') {
        productId = productOrId.product_id || productOrId.id;
        qty = productOrId.quantity || 1;
        if (productOrId.size) extra.size = productOrId.size;
        if (productOrId.color) extra.color = productOrId.color;
      }

      const res = await api.updateCart('add', productId, qty, extra);
      if (res?.login) {
        showToast('Please sign in to add items to your cart.', 'info');
        return { ok: false, login: true };
      }
      if (res?.ok) {
        setCartCount(res.cart_count ?? res.count ?? 0);
        showToast(res.message || 'Added to cart!', 'success');
      } else {
        showToast(res?.message || 'Could not add to cart.', 'error');
      }
      return res;
    },
    [showToast]
  );

  const toggleWishlist = useCallback(
    async (productId) => {
      const res = await api.toggleWishlist(productId, 'toggle');
      if (res?.login) {
        showToast('Please sign in to save items to your wishlist.', 'info');
        return { ok: false, login: true };
      }
      if (res?.ok) {
        setWishlistCount(res.wishlist_count ?? 0);
        setWishlistIds(res.wishlist_ids || []);
        showToast(res.message || 'Wishlist updated.', 'success');
      } else {
        showToast(res?.message || 'Could not update wishlist.', 'error');
      }
      return res;
    },
    [showToast]
  );

  const isWishlisted = useCallback(
    (productId) => {
      return wishlistIds.map(Number).includes(Number(productId));
    },
    [wishlistIds]
  );

  const value = {
    company,
    categories,
    unlinkedBrands,
    currencies,
    currency,
    setCurrency,
    money,
    formatPrice: money,
    moneyFromNgn,
    user,
    setUser,
    loginSuccess,
    setAuthSession,
    logout,
    cartCount,
    setCartCount,
    wishlistCount,
    setWishlistCount,
    wishlistIds,
    isWishlisted,
    addToCart,
    toggleWishlist,
    notifications,
    unreadNotifCount,
    pushPermission,
    enablePushNotifications,
    markNotificationsRead,
    triggerBrowserPush,
    refreshBootstrap,
    showToast,
    toasts,
    loading,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}
