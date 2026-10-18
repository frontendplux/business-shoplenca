import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useStore } from '../context/StoreContext';
import SEO from '../components/SEO';
import RichTextEditor from '../components/RichTextEditor';
import SkeletonLoader from '../components/SkeletonLoader';

const SUBSCRIPTION_DURATIONS = [
  { months: 1, label: '1 Month (Monthly)' },
  { months: 3, label: '3 Months (Quarterly)' },
  { months: 6, label: '6 Months (Half-Year)' },
  { months: 12, label: '1 Year (12 Months)' },
  { months: 24, label: '2 Years (24 Months)' },
  { months: 36, label: '3 Years (36 Months)' },
  { months: 60, label: '5 Years (60 Months)' },
];

export default function MemberPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const {
    user,
    currency,
    money,
    moneyFromNgn,
    logout,
    refreshBootstrap,
    showToast,
    pushPermission,
    enablePushNotifications,
  } = useStore();

  const activeTab = searchParams.get('tab') || 'overview';
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Vendor Store Form
  const [vendorForm, setVendorForm] = useState({
    store_name: '',
    title: '',
    description: '',
    keywords: '',
    store_address: '',
    business_phone: '',
    logo: '',
    banner: '',
  });

  // Vendor Verification Application Form
  const [verifForm, setVerifForm] = useState({
    business_reg_no: '',
    id_doc_url: '',
  });

  // Subdomain & Custom Domain Store Ownership Form
  const [domainForm, setDomainForm] = useState({
    subdomain: '',
    custom_domain: '',
    months: 1,
    payment_mode: 'self_managed',
    payment_method: 'paystack',
    own_gateway_config: {
      gateway_name: 'Paystack / Direct Bank',
      public_key: '',
      secret_key: '',
      bank_name: '',
      account_number: '',
      account_name: '',
      custom_shipping: 0,
      custom_charge_pct: 0,
    },
  });
  const [subscribingDomain, setSubscribingDomain] = useState(false);

  // Vendor Product Modal (with Multiple Images Upload & Gallery)
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [productForm, setProductForm] = useState({
    id: 0,
    product_name: '',
    price: '',
    off_price: 0,
    instock: 20,
    product_category_id: '',
    product_sub_category_id: '',
    brand_category_id: '',
    image: '',
    images: [],
    sizes: '',
    colors: '',
    keywords: '',
    description: '',
  });

  // Order Delivery & Good Condition Confirmation State (per order ID)
  const [sealChecks, setSealChecks] = useState({});
  const [sealingOrderId, setSealingOrderId] = useState(null);

  // Personal Store Gift Cards State
  const [redeemCode, setRedeemCode] = useState('');
  const [redeemingCard, setRedeemingCard] = useState(false);
  const [creatingCard, setCreatingCard] = useState(false);
  const [giftCardForm, setGiftCardForm] = useState({
    amount_usd: 25,
    title: 'Shoplenca VIP Personal Gift Card',
    design_theme: 'royal_gold',
    recipient_name: '',
    recipient_email: '',
    personal_message: 'Enjoy shopping on Shoplenca! Redeem this code directly into your Member Wallet.',
    payment_method: 'paystack',
  });

  // Currency Exchange Calculator State
  const [calcAmount, setCalcAmount] = useState(100);
  const [calcFrom, setCalcFrom] = useState('USD');
  const [calcTo, setCalcTo] = useState('NGN');

  // Book Authoring Modal
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [bookForm, setBookForm] = useState({
    id: 0,
    title: '',
    author: '',
    category: 'Fiction',
    cover_image: '',
    description: '',
    is_monetized: true,
    price: 0,
    compare_price: 0,
    free_preview_chapters: 1,
    chapters: [{ title: 'Chapter 1', content: '' }],
  });

  // Profile & Security Forms
  const [profileForm, setProfileForm] = useState({
    firstname: '',
    lastname: '',
    phone: '',
  });
  const [pwdForm, setPwdForm] = useState({
    old: '',
    new: '',
    confirm: '',
  });

  const loadMemberData = () => {
    setLoading(true);
    api
      .get('/member')
      .then((res) => {
        setData(res);
        if (res.user) {
          setProfileForm({
            firstname: res.user.firstname || '',
            lastname: res.user.lastname || '',
            phone: res.user.phone || '',
          });
        }
        if (res.vendor_profile) {
          const vp = res.vendor_profile;
          setVendorForm({
            store_name: vp.store_name || '',
            title: vp.title || '',
            description: vp.description || '',
            keywords: vp.keywords || '',
            store_address: vp.store_address || '',
            business_phone: vp.business_phone || '',
            logo: vp.logo || '',
            banner: vp.banner || '',
          });
          setVerifForm({
            business_reg_no: vp.business_reg_no || '',
            id_doc_url: vp.id_doc_url || '',
          });
          const ownGw = vp.own_gateway_config || vp.own_gateway || {};
          setDomainForm((prev) => ({
            ...prev,
            subdomain: vp.subdomain || vp.store_slug || '',
            custom_domain: vp.custom_domain || '',
            payment_mode: vp.payment_mode || 'self_managed',
            own_gateway_config: {
              gateway_name: ownGw.gateway_name || 'Paystack / Direct Bank',
              public_key: ownGw.public_key || '',
              secret_key: ownGw.secret_key || '',
              bank_name: ownGw.bank_name || '',
              account_number: ownGw.account_number || '',
              account_name: ownGw.account_name || '',
              custom_shipping: ownGw.custom_shipping ?? 0,
              custom_charge_pct: ownGw.custom_charge_pct ?? 0,
            },
          }));
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    loadMemberData();
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-gray-100 min-h-screen py-6 pb-16">
        <SEO title="Member Dashboard — Loading..." />
        <SkeletonLoader type="dashboard" />
      </div>
    );
  }

  if (!loading && !data?.user && !user) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <SEO title="Member Area — Sign In Required" />
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <i className="bi bi-person-lock text-4xl text-amber-500 mb-3 block"></i>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Sign In to Access Member Portal</h1>
          <p className="text-xs text-gray-500 mb-6">
            Manage your orders, wishlist, digital books, vendor verification, or launch your own subdomain store.
          </p>
          <Link to="/login" className="bg-amber-500 text-gray-950 font-bold text-xs px-6 py-3 rounded-xl">
            Go to Sign In
          </Link>
        </div>
      </div>
    );
  }

  const memberUser = data?.user || user || {};
  const vp = data?.vendor_profile || null;
  const isAdmin = Boolean(memberUser.is_admin);
  const isVendor = Boolean(memberUser.is_vendor);
  const isVerifiedVendor = Boolean(vp?.is_verified);
  const verifStatus = vp?.verification_status || 'unverified';
  const domainPlan = data?.subdomain_plan || {
    fee_ngn: 500,
    grace_days: 2,
    company_charge_pct: 2.5,
  };

  const setTab = (t) => {
    setSearchParams({ tab: t });
  };

  // Toggle Vendor Status (User can choose to become a vendor or not!)
  const handleToggleVendor = async (wantVendor) => {
    try {
      const res = await api.post('/member', {
        action: 'toggle_vendor',
        is_vendor: wantVendor ? 1 : 0,
        store_name: vendorForm.store_name || `${memberUser.firstname || memberUser.username} Store`,
        description: vendorForm.description,
      });
      showToast(res.message, 'success');
      refreshBootstrap();
      loadMemberData();
    } catch (err) {
      showToast(err.message || 'Could not update vendor status', 'error');
    }
  };

  const handleSaveVendorStore = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/member', {
        action: 'update_vendor_store',
        ...vendorForm,
      });
      showToast(res.message || 'Vendor store saved!', 'success');
      loadMemberData();
    } catch (err) {
      showToast(err.message || 'Failed to save store', 'error');
    }
  };

  const handleRequestVerification = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/member', {
        action: 'request_verification',
        business_reg_no: verifForm.business_reg_no,
        id_doc_url: verifForm.id_doc_url,
        store_name: vendorForm.store_name,
      });
      showToast(res.message || 'Verification request sent to Admin!', 'success');
      refreshBootstrap();
      loadMemberData();
    } catch (err) {
      showToast(err.message || 'Failed to submit verification request', 'error');
    }
  };

  const handleSubscribeDomain = async (e) => {
    e.preventDefault();
    setSubscribingDomain(true);
    try {
      const res = await api.post('/member', {
        action: 'subscribe_domain',
        subdomain: domainForm.subdomain,
        custom_domain: domainForm.custom_domain,
        months: domainForm.months,
        payment_mode: domainForm.payment_mode,
        payment_method: domainForm.payment_method,
        own_gateway_config: domainForm.own_gateway_config,
      });
      showToast(res.message || 'Subdomain store activated!', 'success');
      refreshBootstrap();
      loadMemberData();
    } catch (err) {
      showToast(err.message || 'Subscription failed', 'error');
    } finally {
      setSubscribingDomain(false);
    }
  };

  const handleSaveDomainConfig = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/member', {
        action: 'update_domain_config',
        subdomain: domainForm.subdomain,
        custom_domain: domainForm.custom_domain,
        payment_mode: domainForm.payment_mode,
        own_gateway_config: domainForm.own_gateway_config,
      });
      showToast(res.message || 'Domain configuration saved!', 'success');
      loadMemberData();
    } catch (err) {
      showToast(err.message || 'Could not update domain settings', 'error');
    }
  };

  // Multi-Image Device Upload Handler for Vendor Products
  const handleUploadProductImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingImages(true);
    try {
      const base64Promises = files.map(
        (file) =>
          new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          })
      );
      const base64List = await Promise.all(base64Promises);
      const res = await api.post('/upload', { base64_images: base64List });
      if (res.urls?.length) {
        setProductForm((prev) => {
          const merged = [...(prev.images || []), ...res.urls];
          return {
            ...prev,
            images: merged,
            image: merged[0] || prev.image,
          };
        });
        showToast(`${res.urls.length} product image(s) uploaded!`, 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to upload product images', 'error');
    } finally {
      setUploadingImages(false);
      e.target.value = '';
    }
  };

  const handleAddImageUrl = () => {
    const url = newImageUrl.trim();
    if (!url) return;
    setProductForm((prev) => {
      const merged = [...(prev.images || []), url];
      return {
        ...prev,
        images: merged,
        image: merged[0] || prev.image,
      };
    });
    setNewImageUrl('');
  };

  const handleSaveVendorProduct = async (e) => {
    e.preventDefault();
    try {
      const finalImages =
        productForm.images?.length > 0
          ? productForm.images
          : productForm.image
          ? [productForm.image]
          : [];
      const res = await api.post('/member', {
        action: 'save_product',
        ...productForm,
        image: finalImages[0] || productForm.image,
        images: finalImages,
      });
      showToast(res.message || 'Product saved!', 'success');
      setProductModalOpen(false);
      loadMemberData();
    } catch (err) {
      showToast(err.message || 'Error saving product', 'error');
    }
  };

  const handleDeleteVendorProduct = async (id) => {
    try {
      await api.post('/member', { action: 'delete_product', product_id: id });
      showToast('Product removed.', 'info');
      loadMemberData();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  // Customer Confirms Receipt + Good Condition -> SEALS ORDER for Admin Fund Release
  const handleConfirmOrderDelivery = async (orderId) => {
    const chk = sealChecks[orderId] || {};
    if (!chk.received || !chk.goodCondition) {
      showToast(
        'Please check BOTH boxes confirming (1) you received the product and (2) it is in good condition to seal the order.',
        'error'
      );
      return;
    }
    setSealingOrderId(orderId);
    try {
      const res = await api.post('/member', {
        action: 'confirm_order_delivery',
        order_id: orderId,
        buyer_received: chk.received ? 1 : 0,
        buyer_good_condition: chk.goodCondition ? 1 : 0,
        buyer_condition_note: chk.note || 'Received product in good condition.',
      });
      showToast(res.message || 'Order sealed! Admin can now release funds to the vendor wallet.', 'success');
      refreshBootstrap();
      loadMemberData();
    } catch (err) {
      showToast(err.message || 'Could not confirm order delivery', 'error');
    } finally {
      setSealingOrderId(null);
    }
  };

  // Redeem Personal Store Gift Card Directly to Member Wallet
  const handleRedeemGiftCard = async (e, codeOverride) => {
    if (e) e.preventDefault();
    const targetCode = (codeOverride || redeemCode || '').trim().toUpperCase();
    if (!targetCode) {
      showToast('Please enter a Gift Card code to redeem.', 'error');
      return;
    }
    setRedeemingCard(true);
    try {
      const res = await api.post('/member', {
        action: 'redeem_gift_card',
        code: targetCode,
      });
      showToast(res.message || 'Gift Card redeemed directly to your wallet!', 'success');
      setRedeemCode('');
      refreshBootstrap();
      loadMemberData();
    } catch (err) {
      showToast(err.message || 'Failed to redeem Gift Card', 'error');
    } finally {
      setRedeemingCard(false);
    }
  };

  // Create / Buy Personal Store Gift Card
  const handleCreateGiftCard = async (e) => {
    e.preventDefault();
    setCreatingCard(true);
    try {
      const res = await api.post('/member', {
        action: 'create_gift_card',
        ...giftCardForm,
      });
      showToast(res.message || 'Personal Gift Card created!', 'success');
      refreshBootstrap();
      loadMemberData();
    } catch (err) {
      showToast(err.message || 'Failed to create Gift Card', 'error');
    } finally {
      setCreatingCard(false);
    }
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/member', {
        action: 'save_book',
        ...bookForm,
      });
      showToast(res.message || 'Book saved!', 'success');
      setBookModalOpen(false);
      loadMemberData();
    } catch (err) {
      showToast(err.message || 'Error saving book', 'error');
    }
  };

  const handleDeleteBook = async (book_id) => {
    try {
      await api.post('/member', { action: 'delete_book', book_id });
      showToast('Book deleted.', 'info');
      loadMemberData();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/member', {
        action: 'update_profile',
        ...profileForm,
      });
      showToast(res.message || 'Profile updated', 'success');
      refreshBootstrap();
      loadMemberData();
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/member', {
        action: 'change_password',
        ...pwdForm,
      });
      showToast(res.message || 'Password updated', 'success');
      setPwdForm({ old: '', new: '', confirm: '' });
    } catch (err) {
      showToast(err.message || 'Password error', 'error');
    }
  };

  const monthlyFeeDisplay = moneyFromNgn ? moneyFromNgn(domainPlan.fee_ngn || 500) : '₦500';
  const selectedTotalNgn = (domainPlan.fee_ngn || 500) * Number(domainForm.months || 1);
  const selectedTotalDisplay = moneyFromNgn ? moneyFromNgn(selectedTotalNgn) : `₦${selectedTotalNgn}`;

  const navItems = [
    { key: 'overview', label: 'Account Overview', icon: 'bi-speedometer2' },
    {
      key: 'orders',
      label: 'My Orders & Seal Delivery',
      icon: 'bi-box-seam',
      count: data?.stats?.orders,
    },
    {
      key: 'giftcards',
      label: 'Personal Gift Cards & Wallet',
      icon: 'bi-gift-fill',
      badge: 'Redeem',
    },
    {
      key: 'rates',
      label: 'Our Currency Exchange Rates',
      icon: 'bi-currency-exchange',
      badge: 'Live',
    },
    {
      key: 'domain',
      label: 'Own Subdomain & Domain',
      icon: 'bi-globe2',
      badge: vp?.domain_store_status === 'active' ? 'Live' : `${monthlyFeeDisplay}/mo`,
    },
    {
      key: 'vendor',
      label: isVendor ? 'Vendor Store & Verification' : 'Become a Vendor',
      icon: 'bi-shop',
      badge: isVerifiedVendor ? 'Verified' : isVendor ? 'Vendor' : 'Join',
    },
    { key: 'wishlist', label: 'Saved Wishlist', icon: 'bi-heart', count: data?.stats?.wishlist },
    { key: 'books', label: 'Write Books & Studio', icon: 'bi-book-half', count: data?.stats?.books },
    { key: 'profile', label: 'Profile Settings', icon: 'bi-person-gear' },
    { key: 'security', label: 'Security & Password', icon: 'bi-shield-lock' },
  ];

  return (
    <div className="bg-gray-100 min-h-screen py-6 pb-16">
      <SEO title="Member Dashboard, Vendor Verification & Subdomain Store Hub" />

      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* Top Member Welcome Banner */}
        <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-sm mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-amber-500 text-gray-950 font-extrabold text-xl flex items-center justify-center border-2 border-amber-300">
              {(memberUser.firstname || memberUser.username || 'U')[0].toUpperCase()}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold">
                  Hello, {memberUser.firstname || memberUser.username}!
                </h1>
                {isAdmin && (
                  <span className="bg-amber-500 text-gray-950 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                    Administrator
                  </span>
                )}
                {isVerifiedVendor ? (
                  <span className="bg-emerald-500 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <i className="bi bi-patch-check-fill" /> Verified Seller
                  </span>
                ) : isVendor ? (
                  <span className="bg-blue-500/30 border border-blue-400 text-blue-200 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                    Unverified Vendor
                  </span>
                ) : null}
                {vp?.domain_plan_active && vp?.subdomain && (
                  <span className="bg-purple-500/30 border border-purple-300 text-purple-100 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full">
                    <i className="bi bi-globe2 mr-1" />
                    {vp.custom_domain || `${vp.subdomain}.shoplenca.com`}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-300 mt-0.5">{memberUser.email}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {pushPermission !== 'granted' && (
              <button
                type="button"
                onClick={enablePushNotifications}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs px-3.5 py-2.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <i className="bi bi-bell-fill text-amber-300" />
                <span>Enable Push Alerts</span>
              </button>
            )}
            {/* IF ADMIN SIGNS IN TO MEMBERS PAGE -> PROMINENT "GO TO ADMIN" BUTTON */}
            {isAdmin && (
              <Link
                to="/admin"
                className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 transition"
              >
                <i className="bi bi-shield-lock-fill"></i>
                <span>Go to Admin</span>
              </Link>
            )}
            <button
              onClick={async () => {
                await logout();
                navigate('/');
              }}
              className="bg-white/10 hover:bg-red-500/20 text-white border border-white/15 text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-2 cursor-pointer"
            >
              <i className="bi bi-box-arrow-right"></i>
              <span>Sign Out</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT SIDEBAR MENU */}
          <aside className="lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 p-3 space-y-1">
            {/* IF ADMIN SIGNED IN -> SHOW "GO TO ADMIN" IN THE MENU */}
            {isAdmin && (
              <Link
                to="/admin"
                className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-orange-500 text-gray-950 shadow-sm mb-2 hover:opacity-95 transition"
              >
                <span className="flex items-center gap-2.5">
                  <i className="bi bi-speedometer2 w-4 text-center"></i>
                  <span>Go to Admin</span>
                </span>
                <i className="bi bi-arrow-right text-[10px]"></i>
              </Link>
            )}

            {navItems.map((item) => (
              <button
                key={item.key}
                onClick={() => setTab(item.key)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  activeTab === item.key
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="flex items-center gap-2.5 text-left">
                  <i
                    className={`bi ${item.icon} w-4 text-center ${
                      activeTab === item.key ? 'text-amber-400' : 'text-gray-400'
                    }`}
                  ></i>
                  <span>{item.label}</span>
                </span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                      item.key === 'domain'
                        ? 'bg-purple-100 text-purple-800'
                        : isVerifiedVendor
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {item.count !== undefined && (
                  <span className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">
                    {item.count}
                  </span>
                )}
              </button>
            ))}
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="lg:col-span-9 space-y-6">
            {/* ==============================================================
                TAB: OVERVIEW
               ============================================================== */}
            {activeTab === 'overview' && (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <span className="text-[11px] text-gray-400 font-semibold">Total Orders</span>
                    <p className="text-2xl font-extrabold text-gray-900 mt-1">{data?.stats?.orders || 0}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <span className="text-[11px] text-gray-400 font-semibold">Wishlist Items</span>
                    <p className="text-2xl font-extrabold text-gray-900 mt-1">{data?.stats?.wishlist || 0}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <span className="text-[11px] text-gray-400 font-semibold">Vendor Products</span>
                    <p className="text-2xl font-extrabold text-amber-600 mt-1">{data?.stats?.products || 0}</p>
                  </div>
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <span className="text-[11px] text-gray-400 font-semibold">Database Wallet</span>
                    <p className="text-2xl font-extrabold text-emerald-600 mt-1">
                      {money(data?.stats?.wallet || memberUser.wallet_balance || 0)}
                    </p>
                  </div>
                </div>

                {/* OWN YOUR SUBDOMAIN & CUSTOM DOMAIN PROMO BANNER */}
                <div className="rounded-2xl p-5 sm:p-6 shadow-md bg-gradient-to-r from-indigo-950 via-purple-900 to-pink-900 text-white border border-purple-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-2xl">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-gray-950 text-[10px] font-extrabold uppercase tracking-wider">
                      <i className="bi bi-globe2" /> Premium Self-Owned Storefront
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold">
                      Own Your Subdomain & Custom Domain Store for Just {monthlyFeeDisplay}/Month (NGN {domainPlan.fee_ngn || 500})!
                    </h2>
                    <p className="text-xs text-white/85 leading-relaxed">
                      Control your own products, payment gateways, and charges with <strong>zero company interference</strong> — or select <strong>Company Wallet</strong> to receive customer payments directly in your database wallet with transparent company charges ({domainPlan.company_charge_pct || 2.5}%). Payable monthly or for 1+ years with a <strong>{domainPlan.grace_days || 2}-day extra grace period</strong> and instant reopening anytime!
                    </p>
                  </div>
                  <button
                    onClick={() => setTab('domain')}
                    className="px-5 py-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold text-xs uppercase tracking-wider shrink-0 shadow cursor-pointer"
                  >
                    <i className="bi bi-rocket-takeoff-fill mr-1.5" />
                    {vp?.domain_plan_active ? 'Manage My Domain Store' : 'Launch Domain Store'}
                  </button>
                </div>

                {/* CHOOSE TO BECOME A VENDOR OR NOT CARD */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border-2 border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <i className="bi bi-shop text-amber-500"></i>
                      <h2 className="text-base font-extrabold text-gray-900">
                        Vendor Account Mode: {isVendor ? 'Active Vendor' : 'Standard Shopper'}
                      </h2>
                      {isVerifiedVendor && (
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          <i className="bi bi-patch-check-fill mr-1" /> Admin Verified
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 max-w-xl">
                      You can choose to become a vendor to list products and books on our marketplace, apply for official Admin Verification, or switch back to a standard customer account at any time.
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    {isVendor ? (
                      <>
                        <button
                          onClick={() => setTab('vendor')}
                          className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                        >
                          Manage Store & Verification
                        </button>
                        <button
                          onClick={() => handleToggleVendor(false)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 font-bold text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
                        >
                          Opt Out of Vendor
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleToggleVendor(true)}
                        className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold text-xs px-5 py-2.5 rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
                      >
                        <i className="bi bi-rocket-takeoff-fill"></i>
                        <span>Become a Vendor Now</span>
                      </button>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ==============================================================
                TAB: SUBDOMAIN & CUSTOM DOMAIN STORE OWNERSHIP (NGN 500/MO)
               ============================================================== */}
            {activeTab === 'domain' && (
              <div className="space-y-6">
                {/* Status Banner (Active, 2-Day Grace Period, Closed Overdue, or Inactive) */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                  <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-gray-100">
                    <div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[10px] font-extrabold uppercase tracking-wider">
                        <i className="bi bi-globe2" /> Premium Subdomain & Custom Domain Ownership
                      </span>
                      <h2 className="text-lg font-extrabold text-gray-900 mt-1">
                        Own Your Self-Managed Storefront ({monthlyFeeDisplay} / Month)
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Base rate: <strong>NGN {domainPlan.fee_ngn || 500}/month</strong> (automatically converted to{' '}
                        <strong>{currency?.code}</strong> & all supported currencies). Includes a{' '}
                        <strong>{domainPlan.grace_days || 2}-day extra grace period</strong> before closure and instant reopening anytime upon payment.
                      </p>
                    </div>

                    {/* Live Status Pill */}
                    <div>
                      {vp?.domain_store_status === 'active' && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-2.5 rounded-xl text-xs">
                          <div className="font-extrabold flex items-center gap-1.5">
                            <i className="bi bi-check-circle-fill text-emerald-600" /> STORE ACTIVE
                          </div>
                          <div className="text-[11px] mt-0.5">
                            Expires: <strong>{vp.subscription_expires_at}</strong> ({vp.days_remaining} days left)
                          </div>
                          <div className="text-[10px] text-emerald-700">
                            +2-Day Extra Grace until: {vp.grace_ends_at}
                          </div>
                        </div>
                      )}
                      {vp?.domain_store_status === 'grace_period' && (
                        <div className="bg-amber-50 border-2 border-amber-400 text-amber-900 px-4 py-2.5 rounded-xl text-xs">
                          <div className="font-extrabold flex items-center gap-1.5 text-amber-700">
                            <i className="bi bi-exclamation-triangle-fill" /> IN 2-DAY EXTRA GRACE PERIOD!
                          </div>
                          <div className="text-[11px] mt-0.5">
                            Grace ends: <strong>{vp.grace_ends_at}</strong> ({vp.grace_hours_remaining}h left before store closes)
                          </div>
                        </div>
                      )}
                      {vp?.domain_store_status === 'closed_overdue' && (
                        <div className="bg-red-50 border-2 border-red-300 text-red-900 px-4 py-2.5 rounded-xl text-xs">
                          <div className="font-extrabold flex items-center gap-1.5 text-red-700">
                            <i className="bi bi-lock-fill" /> STORE CLOSED (PAST 2-DAY GRACE)
                          </div>
                          <div className="text-[11px] mt-0.5">
                            Pay below to <strong>reopen your store immediately!</strong>
                          </div>
                        </div>
                      )}
                      {(!vp || vp.domain_store_status === 'inactive') && (
                        <span className="inline-block bg-gray-100 text-gray-700 font-bold text-xs px-3.5 py-2 rounded-xl">
                          Not Subscribed Yet
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Subscription & Payment Form */}
                  <form onSubmit={handleSubscribeDomain} className="mt-5 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-extrabold text-gray-800 mb-1">
                          Your Subdomain Name *
                        </label>
                        <div className="flex items-center rounded-xl border border-gray-300 overflow-hidden focus-within:border-purple-600 bg-white">
                          <input
                            type="text"
                            required
                            placeholder="yourbrand"
                            value={domainForm.subdomain}
                            onChange={(e) =>
                              setDomainForm({
                                ...domainForm,
                                subdomain: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''),
                              })
                            }
                            className="flex-1 px-3.5 py-2.5 text-xs font-bold focus:outline-none"
                          />
                          <span className="bg-gray-100 px-3 py-2.5 text-xs font-bold text-gray-600 border-l border-gray-200">
                            .shoplenca.com
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-gray-800 mb-1">
                          Attach Your Own Custom Domain (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="www.yourcompany.com"
                          value={domainForm.custom_domain}
                          onChange={(e) => setDomainForm({ ...domainForm, custom_domain: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:border-purple-600"
                        />
                      </div>
                    </div>

                    {/* Choose Payment & Control Mode */}
                    <div>
                      <label className="block text-xs font-extrabold text-gray-800 mb-2">
                        Choose Store Control & Payment Settlement Mode
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {/* Mode 1: Self-Managed Direct (0% Company Interference) */}
                        <div
                          onClick={() => setDomainForm({ ...domainForm, payment_mode: 'self_managed' })}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                            domainForm.payment_mode === 'self_managed'
                              ? 'border-purple-600 bg-purple-50/40'
                              : 'border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                              <i className="bi bi-shield-check text-purple-600 text-base" />
                              1. Self-Managed Direct Mode (0% Company Interference)
                            </span>
                            <input
                              type="radio"
                              checked={domainForm.payment_mode === 'self_managed'}
                              onChange={() => setDomainForm({ ...domainForm, payment_mode: 'self_managed' })}
                            />
                          </div>
                          <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed">
                            You control your own products, your own payment gateway keys/bank account, and your own shipping & charges. <strong>No company interference and 0% commission deducted!</strong>
                          </p>
                        </div>

                        {/* Mode 2: Company Wallet Mode (Database Payouts + Company Charges) */}
                        <div
                          onClick={() => setDomainForm({ ...domainForm, payment_mode: 'company_wallet' })}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition ${
                            domainForm.payment_mode === 'company_wallet'
                              ? 'border-emerald-600 bg-emerald-50/40'
                              : 'border-gray-200 hover:border-emerald-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                              <i className="bi bi-wallet2 text-emerald-600 text-base" />
                              2. Use Company Wallet (Database Settlement)
                            </span>
                            <input
                              type="radio"
                              checked={domainForm.payment_mode === 'company_wallet'}
                              onChange={() => setDomainForm({ ...domainForm, payment_mode: 'company_wallet' })}
                            />
                          </div>
                          <p className="text-[11px] text-gray-600 mt-1.5 leading-relaxed">
                            Use the platform’s payment gateways. After customer payment, <strong>you receive your money directly in your database wallet</strong> with a dedicated ledger column for <strong>Company Charges ({domainPlan.company_charge_pct || 2.5}%)</strong>.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Self-Managed Payment & Charges Configuration */}
                    {domainForm.payment_mode === 'self_managed' && (
                      <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-200 space-y-3">
                        <h4 className="text-xs font-extrabold uppercase tracking-wider text-purple-900">
                          <i className="bi bi-sliders mr-1.5" />
                          Your Own Payment Gateway & Custom Charges (Zero Company Interference)
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Your Gateway Name</label>
                            <input
                              type="text"
                              value={domainForm.own_gateway_config.gateway_name}
                              onChange={(e) =>
                                setDomainForm({
                                  ...domainForm,
                                  own_gateway_config: {
                                    ...domainForm.own_gateway_config,
                                    gateway_name: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Your Public API Key</label>
                            <input
                              type="text"
                              placeholder="pk_live_..."
                              value={domainForm.own_gateway_config.public_key}
                              onChange={(e) =>
                                setDomainForm({
                                  ...domainForm,
                                  own_gateway_config: {
                                    ...domainForm.own_gateway_config,
                                    public_key: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Your Direct Bank / Account</label>
                            <input
                              type="text"
                              placeholder="Bank Name & Account No"
                              value={domainForm.own_gateway_config.account_number}
                              onChange={(e) =>
                                setDomainForm({
                                  ...domainForm,
                                  own_gateway_config: {
                                    ...domainForm.own_gateway_config,
                                    account_number: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Your Custom Shipping ($)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={domainForm.own_gateway_config.custom_shipping}
                              onChange={(e) =>
                                setDomainForm({
                                  ...domainForm,
                                  own_gateway_config: {
                                    ...domainForm.own_gateway_config,
                                    custom_shipping: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block font-bold text-gray-700 mb-1">Your Handling Charge (%)</label>
                            <input
                              type="number"
                              step="0.1"
                              value={domainForm.own_gateway_config.custom_charge_pct}
                              onChange={(e) =>
                                setDomainForm({
                                  ...domainForm,
                                  own_gateway_config: {
                                    ...domainForm.own_gateway_config,
                                    custom_charge_pct: e.target.value,
                                  },
                                })
                              }
                              className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Duration Selection: Monthly or Multi-Year (1 Year, 2 Years, 3 Years, 5 Years) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div>
                        <label className="block text-xs font-extrabold text-gray-800 mb-1">
                          Subscription Duration (Monthly or Multi-Year)
                        </label>
                        <select
                          value={domainForm.months}
                          onChange={(e) => setDomainForm({ ...domainForm, months: Number(e.target.value) })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-white"
                        >
                          {SUBSCRIPTION_DURATIONS.map((d) => (
                            <option key={d.months} value={d.months}>
                              {d.label} — {moneyFromNgn ? moneyFromNgn((domainPlan.fee_ngn || 500) * d.months) : `₦${500 * d.months}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-extrabold text-gray-800 mb-1">
                          Pay Subscription Via
                        </label>
                        <select
                          value={domainForm.payment_method}
                          onChange={(e) => setDomainForm({ ...domainForm, payment_method: e.target.value })}
                          className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-bold bg-white"
                        >
                          <option value="paystack">Paystack (Card / Bank / USSD)</option>
                          <option value="flutterwave">Flutterwave</option>
                          <option value="stripe">Stripe (Global Card)</option>
                          <option value="wallet">My Database Wallet ({money(memberUser.wallet_balance || 0)})</option>
                        </select>
                      </div>

                      <div className="text-right">
                        <div className="text-[11px] text-gray-500">
                          Total for {domainForm.months} month(s):
                        </div>
                        <div className="text-xl font-black text-purple-700">
                          {selectedTotalDisplay}{' '}
                          {currency?.code !== 'NGN' && (
                            <span className="text-xs text-gray-500 font-normal">
                              (NGN {selectedTotalNgn.toLocaleString()})
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="submit"
                        disabled={subscribingDomain}
                        className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-900 via-purple-700 to-pink-600 hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider shadow-md cursor-pointer"
                      >
                        <i className="bi bi-lightning-charge-fill mr-1.5" />
                        {subscribingDomain
                          ? 'Processing...'
                          : vp?.domain_store_status === 'closed_overdue'
                          ? `Pay ${selectedTotalDisplay} & Reopen Store Immediately`
                          : vp?.domain_plan_active
                          ? `Extend Subscription (+${domainForm.months} Months) for ${selectedTotalDisplay}`
                          : `Activate My Subdomain Store (${selectedTotalDisplay})`}
                      </button>

                      {vp && (
                        <button
                          type="button"
                          onClick={handleSaveDomainConfig}
                          className="px-5 py-3 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs cursor-pointer"
                        >
                          Save Domain & Payment Mode Settings Only
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                {/* DATABASE WALLET & COMPANY CHARGES LEDGER */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <i className="bi bi-database-fill-check text-emerald-600" />
                        Vendor Database Payouts & Company Charges Ledger
                      </h3>
                      <p className="text-xs text-gray-500">
                        When using Company Wallet mode, customer payments are credited directly to your database wallet with a dedicated column showing Company Charges ({domainPlan.company_charge_pct || 2.5}%). In Self-Managed mode, Company Charge is 0%.
                      </p>
                    </div>
                    <div className="flex gap-3 text-xs">
                      <div className="bg-gray-50 px-3.5 py-2 rounded-xl border border-gray-200">
                        <span className="text-[10px] text-gray-500 block">Gross Sales</span>
                        <strong className="text-gray-900">{money(data?.wallet_totals?.gross_sales || 0)}</strong>
                      </div>
                      <div className="bg-red-50 px-3.5 py-2 rounded-xl border border-red-100">
                        <span className="text-[10px] text-red-600 block">Company Charges</span>
                        <strong className="text-red-700">-{money(data?.wallet_totals?.company_charges || 0)}</strong>
                      </div>
                      <div className="bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
                        <span className="text-[10px] text-emerald-700 block">Net Credited to DB</span>
                        <strong className="text-emerald-800">{money(data?.wallet_totals?.net_earnings || 0)}</strong>
                      </div>
                    </div>
                  </div>

                  {!data?.wallet_transactions || data.wallet_transactions.length === 0 ? (
                    <p className="text-xs text-gray-400 py-6 text-center">
                      No wallet settlement transactions recorded yet. When customers buy your products, your payouts and any company charges will appear here in real time.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="border-b border-gray-200 text-gray-500 uppercase text-[10px]">
                            <th className="py-2.5 px-2">Date / Order</th>
                            <th className="py-2.5 px-2">Mode</th>
                            <th className="py-2.5 px-2">Gross Amount</th>
                            <th className="py-2.5 px-2 text-red-600">Company Charge</th>
                            <th className="py-2.5 px-2 text-emerald-700">Net Credited (DB)</th>
                            <th className="py-2.5 px-2">Details</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {data.wallet_transactions.map((tx) => (
                            <tr key={tx.id} className="hover:bg-gray-50">
                              <td className="py-2.5 px-2">
                                <div className="font-bold text-gray-900">{tx.order_number || tx.tx_type}</div>
                                <div className="text-[10px] text-gray-400">{tx.created_at}</div>
                              </td>
                              <td className="py-2.5 px-2">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                    tx.payment_mode === 'self_managed'
                                      ? 'bg-purple-100 text-purple-800'
                                      : 'bg-blue-100 text-blue-800'
                                  }`}
                                >
                                  {tx.payment_mode === 'self_managed' ? 'Self-Managed (0%)' : 'Company Wallet'}
                                </span>
                              </td>
                              <td className="py-2.5 px-2 font-semibold">{money(tx.gross_amount)}</td>
                              <td className="py-2.5 px-2 text-red-600 font-semibold">
                                -{money(tx.company_charge_amount)} ({tx.company_charge_percent}%)
                              </td>
                              <td className="py-2.5 px-2 font-extrabold text-emerald-700">
                                {money(tx.net_vendor_amount)}
                              </td>
                              <td className="py-2.5 px-2 text-gray-600 max-w-xs truncate">{tx.description}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==============================================================
                TAB: VENDOR HUB (OPT IN/OUT + ADMIN VERIFICATION + PRODUCTS)
               ============================================================== */}
            {activeTab === 'vendor' && (
              <div className="space-y-6">
                {/* 1. Vendor Participation Toggle & Store Profile */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
                    <div>
                      <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                        <i className="bi bi-shop text-amber-500"></i>
                        Vendor Participation Choice
                      </h2>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Choose whether you want your account to operate as a Vendor Storefront or a regular Buyer account.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleVendor(true)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                          isVendor
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-gray-100 text-gray-600 hover:bg-amber-50'
                        }`}
                      >
                        <i className="bi bi-check-lg mr-1.5"></i>
                        Yes, I am a Vendor
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleVendor(false)}
                        className={`px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                          !isVendor
                            ? 'bg-gray-900 text-white shadow'
                            : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                        }`}
                      >
                        No, Regular Member Only
                      </button>
                    </div>
                  </div>

                  {isVendor ? (
                    <form onSubmit={handleSaveVendorStore} className="mt-5 space-y-4">
                      <h3 className="text-sm font-extrabold text-gray-900">Storefront Profile</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Store Name *</label>
                          <input
                            type="text"
                            required
                            value={vendorForm.store_name}
                            onChange={(e) => setVendorForm({ ...vendorForm, store_name: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Store Tagline / Title</label>
                          <input
                            type="text"
                            value={vendorForm.title}
                            onChange={(e) => setVendorForm({ ...vendorForm, title: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Business Phone</label>
                          <input
                            type="text"
                            value={vendorForm.business_phone}
                            onChange={(e) => setVendorForm({ ...vendorForm, business_phone: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Store Address</label>
                          <input
                            type="text"
                            value={vendorForm.store_address}
                            onChange={(e) => setVendorForm({ ...vendorForm, store_address: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-gray-700 mb-1">Store Description</label>
                          <textarea
                            rows={2}
                            value={vendorForm.description}
                            onChange={(e) => setVendorForm({ ...vendorForm, description: e.target.value })}
                            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold text-xs px-5 py-2.5 rounded-xl transition cursor-pointer"
                      >
                        Save Vendor Profile
                      </button>
                    </form>
                  ) : (
                    <div className="py-8 text-center">
                      <p className="text-xs text-gray-500 mb-4">
                        Activate Vendor Mode above to start listing products and earning on every sale.
                      </p>
                      <button
                        onClick={() => handleToggleVendor(true)}
                        className="bg-amber-500 text-gray-950 font-extrabold text-xs px-6 py-2.5 rounded-xl cursor-pointer"
                      >
                        Activate Vendor Account
                      </button>
                    </div>
                  )}
                </div>

                {/* 2. Official Admin Vendor Verification Application Card */}
                {isVendor && (
                  <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                      <div>
                        <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                          <i className="bi bi-patch-check-fill text-emerald-600" />
                          Official Vendor Verification Badge
                        </h3>
                        <p className="text-xs text-gray-500">
                          Submit your Business Registration / CAC or National ID so Admin can verify your vendor account and display the "Verified Seller" badge on all your product pages.
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase ${
                          verifStatus === 'verified'
                            ? 'bg-emerald-100 text-emerald-800'
                            : verifStatus === 'pending'
                            ? 'bg-amber-100 text-amber-800'
                            : verifStatus === 'rejected'
                            ? 'bg-red-100 text-red-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        Status: {verifStatus}
                      </span>
                    </div>

                    {vp?.verification_note && (
                      <div className="mb-4 p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900">
                        <strong>Admin Note:</strong> {vp.verification_note}
                      </div>
                    )}

                    <form onSubmit={handleRequestVerification} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          CAC / Business Reg No or National ID *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. RC-1928374 or NIN"
                          value={verifForm.business_reg_no}
                          onChange={(e) => setVerifForm({ ...verifForm, business_reg_no: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1">
                          Certificate / ID Document URL (Optional)
                        </label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={verifForm.id_doc_url}
                          onChange={(e) => setVerifForm({ ...verifForm, id_doc_url: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                        />
                      </div>
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                      >
                        <i className="bi bi-send-check-fill mr-1.5" />
                        {verifStatus === 'verified' ? 'Update Verification Info' : 'Submit for Admin Verification'}
                      </button>
                    </form>
                  </div>
                )}

                {/* 3. Vendor Products Manager */}
                {isVendor && (
                  <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-base font-extrabold text-gray-900">
                          My Listed Products ({data?.vendor_products?.length || 0})
                        </h3>
                        <p className="text-[11px] text-gray-500">
                          Upload multiple product images from your device or paste multiple image URLs for a full Jumia-style gallery.
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setProductForm({
                            id: 0,
                            product_name: '',
                            price: '',
                            off_price: 0,
                            instock: 25,
                            product_category_id: data?.taxonomies?.categories?.[0]?.id || 1,
                            product_sub_category_id: '',
                            brand_category_id: '',
                            image: '',
                            images: [],
                            sizes: '',
                            colors: '',
                            keywords: '',
                            description: '',
                          });
                          setProductModalOpen(true);
                        }}
                        className="bg-gray-900 hover:bg-amber-500 hover:text-gray-950 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <i className="bi bi-images"></i>
                        <span>Add Product (Multi-Image)</span>
                      </button>
                    </div>

                    {!data?.vendor_products || data.vendor_products.length === 0 ? (
                      <p className="text-xs text-gray-500 py-4">
                        No products listed yet. Click "Add Product" to upload multiple photos and publish with our Rich Content Editor.
                      </p>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {data.vendor_products.map((prod) => {
                          const galleryCount = (prod.spec?.images || []).length || 1;
                          return (
                            <div key={prod.id} className="py-3.5 flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div className="relative">
                                  <img
                                    src={prod.image}
                                    alt={prod.product_name}
                                    className="w-14 h-14 rounded-xl object-cover border border-gray-200"
                                  />
                                  <span className="absolute -bottom-1 -right-1 bg-purple-700 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                    {galleryCount} img
                                  </span>
                                </div>
                                <div>
                                  <Link
                                    to={`/product?slug=${encodeURIComponent(prod.slug)}`}
                                    className="text-xs font-extrabold text-gray-900 hover:text-amber-600"
                                  >
                                    {prod.product_name}
                                  </Link>
                                  <p className="text-[11px] text-gray-500 mt-0.5">
                                    {money(prod.final_price || prod.price)} &bull; Stock: {prod.instock} &bull; Gallery:{' '}
                                    <strong>{galleryCount} photo(s)</strong>
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    const existingImgs =
                                      prod.spec?.images?.length > 0
                                        ? prod.spec.images
                                        : prod.image
                                        ? [prod.image]
                                        : [];
                                    setProductForm({
                                      ...prod,
                                      images: existingImgs,
                                      sizes: (prod.spec?.sizes || []).join(', '),
                                      colors: (prod.spec?.colors || []).join(', '),
                                    });
                                    setProductModalOpen(true);
                                  }}
                                  className="text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 px-3 py-1.5 rounded-lg cursor-pointer"
                                >
                                  <i className="bi bi-pencil-square mr-1"></i> Edit & Photos
                                </button>
                                <button
                                  onClick={() => handleDeleteVendorProduct(prod.id)}
                                  className="text-xs font-bold text-red-600 hover:underline px-2 py-1 cursor-pointer"
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ==============================================================
                TAB: ORDERS & SEALED ESCROW BUYER CONFIRMATION
               ============================================================== */}
            {activeTab === 'orders' && (
              <div className="space-y-5">
                {/* Escrow Protection Explainer Banner */}
                <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 rounded-2xl p-5 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <span className="inline-flex items-center gap-1.5 bg-amber-400 text-gray-950 text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                      <i className="bi bi-shield-lock-fill"></i> 100% Sealed Escrow Buyer Protection
                    </span>
                    <h2 className="text-base sm:text-lg font-extrabold">
                      Your Payment Is Held Safely Until You Receive & Confirm Good Condition
                    </h2>
                    <p className="text-xs text-emerald-100 leading-relaxed">
                      When you buy a product, your payment stays in Escrow until the product arrives and you click BOTH{' '}
                      <strong>"I have received the product"</strong> and{' '}
                      <strong>"I have received the product and it is in good condition"</strong>. Only after your order is{' '}
                      <strong>SEALED</strong> can Admin verify and release funds to the vendor's wallet.
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                  <h3 className="text-base font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                    <i className="bi bi-box-seam text-purple-700"></i>
                    My Orders & Delivery Seal Status ({data?.orders?.length || 0})
                  </h3>

                  {!data?.orders || data.orders.length === 0 ? (
                    <div className="py-10 text-center">
                      <i className="bi bi-bag-x text-3xl text-gray-300 block mb-2"></i>
                      <p className="text-xs text-gray-500 mb-4">You haven't placed any orders yet.</p>
                      <Link
                        to="/category"
                        className="inline-flex items-center gap-1.5 bg-amber-500 text-gray-950 font-extrabold text-xs px-5 py-2.5 rounded-xl"
                      >
                        <span>Start Shopping</span>
                        <i className="bi bi-arrow-right"></i>
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {data.orders.map((ord) => {
                        const isSealed = Boolean(ord.is_sealed);
                        const isReleased = Boolean(ord.admin_funds_released);
                        const chk = sealChecks[ord.id] || {
                          received: Boolean(ord.buyer_received),
                          goodCondition: Boolean(ord.buyer_good_condition),
                          note: ord.buyer_condition_note || '',
                        };

                        return (
                          <div
                            key={ord.id}
                            className={`rounded-2xl p-4 sm:p-5 border-2 transition ${
                              isReleased
                                ? 'border-emerald-200 bg-emerald-50/20'
                                : isSealed
                                ? 'border-purple-200 bg-purple-50/20'
                                : 'border-amber-200 bg-white'
                            }`}
                          >
                            {/* Order Top Header */}
                            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-gray-100">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs sm:text-sm font-black text-gray-900">
                                  Order #{ord.order_number}
                                </span>
                                <span className="text-[11px] text-gray-400">{ord.created_at}</span>
                                {isReleased ? (
                                  <span className="bg-emerald-600 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <i className="bi bi-patch-check-fill"></i> Sealed & Vendor Paid
                                  </span>
                                ) : isSealed ? (
                                  <span className="bg-purple-700 text-white text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <i className="bi bi-lock-fill"></i> Product Sealed • Awaiting Admin Release
                                  </span>
                                ) : (
                                  <span className="bg-amber-100 text-amber-900 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full flex items-center gap-1">
                                    <i className="bi bi-shield-lock"></i> Held in Escrow • Confirm Delivery Below
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700">
                                  {ord.payment_gateway_name || ord.payment_method}
                                </span>
                                <span className="text-sm font-black text-gray-900">
                                  {money(ord.total_amount)}
                                </span>
                              </div>
                            </div>

                            {/* 3-Step Escrow & Seal Progress Stepper */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 my-3.5 text-[11px]">
                              <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-2">
                                <i className="bi bi-check-circle-fill text-emerald-600 text-sm"></i>
                                <div>
                                  <div className="font-extrabold">1. Paid into Escrow</div>
                                  <div className="text-[10px] text-emerald-700">Funds secured by platform</div>
                                </div>
                              </div>
                              <div
                                className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                  isSealed
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                    : 'bg-amber-50 border-amber-300 text-amber-900'
                                }`}
                              >
                                <i
                                  className={`bi ${
                                    isSealed ? 'bi-lock-fill text-emerald-600' : 'bi-box2-heart text-amber-600'
                                  } text-sm`}
                                ></i>
                                <div>
                                  <div className="font-extrabold">
                                    2. {isSealed ? 'Buyer Sealed Product' : 'Confirm Receipt & Condition'}
                                  </div>
                                  <div className="text-[10px] opacity-80">
                                    {isSealed ? `Sealed at ${ord.sealed_at || 'Confirmed'}` : 'Customer must confirm both checks'}
                                  </div>
                                </div>
                              </div>
                              <div
                                className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                                  isReleased
                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                    : 'bg-gray-50 border-gray-200 text-gray-500'
                                }`}
                              >
                                <i
                                  className={`bi ${
                                    isReleased ? 'bi-cash-coin text-emerald-600' : 'bi-hourglass-split text-gray-400'
                                  } text-sm`}
                                ></i>
                                <div>
                                  <div className="font-extrabold">
                                    3. {isReleased ? 'Admin Released Funds' : 'Admin Fund Release'}
                                  </div>
                                  <div className="text-[10px] opacity-80">
                                    {isReleased
                                      ? `Released to vendor (${ord.funds_released_at || 'Done'})`
                                      : 'Unlocks only after Step 2 Seal'}
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Ordered Items List */}
                            <div className="py-2 space-y-2 border-b border-gray-100">
                              {(ord.items || []).map((it) => (
                                <div key={it.id} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2.5">
                                    {it.product_image && (
                                      <img
                                        src={it.product_image}
                                        alt={it.product_name}
                                        className="w-10 h-10 rounded-lg object-cover border border-gray-200"
                                      />
                                    )}
                                    <span className="font-semibold text-gray-800">
                                      {it.product_name} <strong className="text-gray-500">(x{it.quantity})</strong>
                                    </span>
                                  </div>
                                  <span className="font-bold text-gray-900">{money(it.line_total)}</span>
                                </div>
                              ))}
                            </div>

                            {/* CUSTOMER DELIVERY & GOOD CONDITION SEAL ACTION BOX */}
                            {!isSealed ? (
                              <div className="mt-4 p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-3">
                                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-950">
                                  <i className="bi bi-patch-check-fill text-amber-600 text-base"></i>
                                  <span>
                                    Have you received your product? Confirm both items below to SEAL this order:
                                  </span>
                                </div>

                                <div className="space-y-2 text-xs">
                                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-amber-200 cursor-pointer hover:border-purple-500 transition">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(chk.received)}
                                      onChange={(e) =>
                                        setSealChecks({
                                          ...sealChecks,
                                          [ord.id]: { ...chk, received: e.target.checked },
                                        })
                                      }
                                      className="mt-0.5 w-4 h-4 accent-emerald-600"
                                    />
                                    <span className="font-bold text-gray-800">
                                      1. I have received the product(s) in this order.
                                    </span>
                                  </label>

                                  <label className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white border border-amber-200 cursor-pointer hover:border-purple-500 transition">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(chk.goodCondition)}
                                      onChange={(e) =>
                                        setSealChecks({
                                          ...sealChecks,
                                          [ord.id]: { ...chk, goodCondition: e.target.checked },
                                        })
                                      }
                                      className="mt-0.5 w-4 h-4 accent-emerald-600"
                                    />
                                    <span className="font-bold text-gray-800">
                                      2. I have received the product(s) and it is in good condition (Seal Product for Vendor Payout).
                                    </span>
                                  </label>
                                </div>

                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                                  <input
                                    type="text"
                                    placeholder="Optional feedback note (e.g., Delivered intact and working great!)"
                                    value={chk.note || ''}
                                    onChange={(e) =>
                                      setSealChecks({
                                        ...sealChecks,
                                        [ord.id]: { ...chk, note: e.target.value },
                                      })
                                    }
                                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white text-xs"
                                  />
                                  <button
                                    type="button"
                                    disabled={sealingOrderId === ord.id || !chk.received || !chk.goodCondition}
                                    onClick={() => handleConfirmOrderDelivery(ord.id)}
                                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer ${
                                      chk.received && chk.goodCondition
                                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                                    }`}
                                  >
                                    <i className="bi bi-lock-fill"></i>
                                    <span>
                                      {sealingOrderId === ord.id
                                        ? 'Sealing Order...'
                                        : 'Confirm Receipt & Seal Product'}
                                    </span>
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
                                <div className="flex items-center gap-2">
                                  <i className="bi bi-shield-fill-check text-emerald-600 text-base"></i>
                                  <span>
                                    <strong>Order Sealed by You:</strong> You confirmed receipt & good condition
                                    {ord.buyer_condition_note ? ` ("${ord.buyer_condition_note}")` : ''}.
                                  </span>
                                </div>
                                <span className="font-extrabold text-[11px] uppercase">
                                  {isReleased
                                    ? '✓ Admin Verified & Released Funds to Vendor'
                                    : '⏳ Ready for Admin Fund Release'}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ==============================================================
                TAB: PERSONAL STORE GIFT CARDS & DIRECT WALLET REDEMPTION
               ============================================================== */}
            {activeTab === 'giftcards' && (
              <div className="space-y-6">
                {/* 1. Redeem Gift Card Directly to Member Wallet */}
                <div className="bg-gradient-to-r from-[#3b0764] via-[#7b1d8e] to-[#ea580c] rounded-2xl p-6 text-white shadow-md">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
                    <div className="lg:col-span-7 space-y-2">
                      <span className="inline-flex items-center gap-1.5 bg-amber-400 text-gray-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
                        <i className="bi bi-gift-fill"></i> Direct Wallet Redemption
                      </span>
                      <h2 className="text-xl sm:text-2xl font-black">
                        Redeem Personal Store Gift Card Directly to Your Wallet
                      </h2>
                      <p className="text-xs text-purple-100 leading-relaxed">
                        Enter any active Shoplenca Personal Gift Card code below to credit the full balance directly into your Member Database Wallet ({money(memberUser.wallet_balance || 0)}). Use your wallet to shop products, unlock books, or pay subdomain fees!
                      </p>
                      <form onSubmit={(e) => handleRedeemGiftCard(e)} className="pt-2 flex flex-col sm:flex-row gap-2.5">
                        <input
                          type="text"
                          placeholder="Enter Gift Card Code (e.g. BG-GIFT-25USD)"
                          value={redeemCode}
                          onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                          className="flex-1 px-4 py-3 rounded-xl bg-white text-gray-900 font-black tracking-wider text-xs sm:text-sm uppercase placeholder-gray-400 focus:outline-none"
                        />
                        <button
                          type="submit"
                          disabled={redeemingCard}
                          className="bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-xs sm:text-sm px-6 py-3 rounded-xl shadow-lg shrink-0 transition cursor-pointer"
                        >
                          <i className="bi bi-wallet2 mr-1.5"></i>
                          {redeemingCard ? 'Redeeming...' : 'Redeem to Wallet Now'}
                        </button>
                      </form>
                    </div>

                    {/* Live Wallet Balance Box */}
                    <div className="lg:col-span-5 bg-black/25 backdrop-blur-md rounded-2xl p-5 border border-white/15 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-purple-200 font-bold">Your Current Wallet Balance</span>
                        <i className="bi bi-wallet-fill text-amber-300 text-lg"></i>
                      </div>
                      <div className="text-3xl font-black text-white">
                        {money(data?.stats?.wallet ?? memberUser.wallet_balance ?? 0)}
                      </div>
                      <div className="text-[11px] text-purple-200">
                        Try a pre-seeded active Gift Card below with 1 click:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {(data?.gift_cards || [])
                          .filter((gc) => gc.status === 'active' && Number(gc.remaining_balance) > 0)
                          .slice(0, 4)
                          .map((gc) => (
                            <button
                              key={gc.id}
                              type="button"
                              onClick={() => handleRedeemGiftCard(null, gc.code)}
                              className="text-[10px] font-black bg-white/15 hover:bg-amber-400 hover:text-gray-950 text-white px-2.5 py-1.5 rounded-lg border border-white/20 transition cursor-pointer"
                            >
                              {gc.code} ({money(gc.remaining_balance)})
                            </button>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Create / Buy Personal Store Gift Card */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <form
                    onSubmit={handleCreateGiftCard}
                    className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-4 text-xs"
                  >
                    <div>
                      <h3 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <i className="bi bi-plus-circle-fill text-purple-700"></i>
                        Create Your Own Personal Store Gift Card
                      </h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Generate a custom branded Gift Card code to gift friends, family, or customers — redeemable directly to any Member Wallet.
                      </p>
                    </div>

                    {/* Quick Amount Pills */}
                    <div>
                      <label className="block font-bold text-gray-700 mb-1.5">Select Gift Card Value (USD) *</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {[10, 25, 50, 100, 250, 500].map((amt) => (
                          <button
                            key={amt}
                            type="button"
                            onClick={() => setGiftCardForm({ ...giftCardForm, amount_usd: amt })}
                            className={`px-3.5 py-2 rounded-xl font-extrabold text-xs transition cursor-pointer ${
                              Number(giftCardForm.amount_usd) === amt
                                ? 'bg-purple-700 text-white shadow'
                                : 'bg-gray-100 text-gray-700 hover:bg-purple-50'
                            }`}
                          >
                            ${amt} ({money(amt)})
                          </button>
                        ))}
                      </div>
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        required
                        value={giftCardForm.amount_usd}
                        onChange={(e) => setGiftCardForm({ ...giftCardForm, amount_usd: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-bold"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Card Title / Occasion</label>
                        <input
                          type="text"
                          value={giftCardForm.title}
                          onChange={(e) => setGiftCardForm({ ...giftCardForm, title: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Card Visual Theme</label>
                        <select
                          value={giftCardForm.design_theme}
                          onChange={(e) => setGiftCardForm({ ...giftCardForm, design_theme: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-semibold"
                        >
                          <option value="royal_gold">Royal Gold & Amber</option>
                          <option value="purple_vip">Purple Executive VIP</option>
                          <option value="emerald_festive">Emerald Festive</option>
                          <option value="midnight_black">Midnight Black Platinum</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Recipient Name (Optional)</label>
                        <input
                          type="text"
                          placeholder="e.g. Sarah Johnson"
                          value={giftCardForm.recipient_name}
                          onChange={(e) => setGiftCardForm({ ...giftCardForm, recipient_name: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-gray-700 mb-1">Fund Gift Card Via</label>
                        <select
                          value={giftCardForm.payment_method}
                          onChange={(e) => setGiftCardForm({ ...giftCardForm, payment_method: e.target.value })}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-200 font-semibold"
                        >
                          <option value="paystack">Paystack / Card / Bank</option>
                          <option value="flutterwave">Flutterwave</option>
                          <option value="wallet">My Member Wallet ({money(memberUser.wallet_balance || 0)})</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-gray-700 mb-1">Personal Message</label>
                      <textarea
                        rows={2}
                        value={giftCardForm.personal_message}
                        onChange={(e) => setGiftCardForm({ ...giftCardForm, personal_message: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-gray-200"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={creatingCard}
                      className="w-full bg-gray-900 hover:bg-purple-800 text-white font-extrabold py-3 rounded-xl shadow transition cursor-pointer"
                    >
                      <i className="bi bi-magic mr-1.5"></i>
                      {creatingCard
                        ? 'Generating Gift Card...'
                        : `Create Personal Gift Card (${money(giftCardForm.amount_usd || 0)})`}
                    </button>
                  </form>

                  {/* Live Interactive Gift Card Preview */}
                  <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
                    <div
                      className={`rounded-3xl p-6 text-white shadow-xl relative overflow-hidden min-h-[230px] flex flex-col justify-between ${
                        giftCardForm.design_theme === 'royal_gold'
                          ? 'bg-gradient-to-br from-amber-500 via-orange-600 to-yellow-900'
                          : giftCardForm.design_theme === 'emerald_festive'
                          ? 'bg-gradient-to-br from-emerald-700 via-teal-800 to-slate-900'
                          : giftCardForm.design_theme === 'midnight_black'
                          ? 'bg-gradient-to-br from-gray-900 via-slate-900 to-black border border-amber-400/40'
                          : 'bg-gradient-to-br from-[#3b0764] via-[#7b1d8e] to-[#be185d]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest bg-white/20 px-2.5 py-1 rounded-full">
                            OFFICIAL STORE GIFT CARD
                          </span>
                          <h4 className="text-base font-black mt-2">{giftCardForm.title || 'Personal Gift Card'}</h4>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-black">{money(giftCardForm.amount_usd || 0)}</div>
                          <div className="text-[10px] opacity-80">${Number(giftCardForm.amount_usd || 0).toFixed(2)} USD</div>
                        </div>
                      </div>

                      <p className="text-xs italic text-white/90 my-3 line-clamp-2">
                        "{giftCardForm.personal_message}"
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-white/20 text-[11px]">
                        <div>
                          <span className="opacity-75">For: </span>
                          <strong>{giftCardForm.recipient_name || 'Any Member Wallet'}</strong>
                        </div>
                        <span className="font-mono font-black tracking-widest bg-black/30 px-3 py-1 rounded-lg">
                          BG-GIFT-XXXX
                        </span>
                      </div>
                    </div>

                    {/* Available & Past Gift Cards List */}
                    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex-1">
                      <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-3">
                        Available & Redeemed Gift Cards ({data?.gift_cards?.length || 0})
                      </h4>
                      <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                        {(data?.gift_cards || []).map((gc) => (
                          <div
                            key={gc.id}
                            className="p-3 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-between gap-2 text-xs"
                          >
                            <div>
                              <div className="font-mono font-black text-purple-900 flex items-center gap-2">
                                <span>{gc.code}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard?.writeText(gc.code);
                                    showToast(`Copied code ${gc.code}!`, 'info');
                                  }}
                                  className="text-[10px] text-gray-500 hover:text-purple-700 cursor-pointer"
                                  title="Copy Code"
                                >
                                  <i className="bi bi-clipboard"></i>
                                </button>
                              </div>
                              <div className="text-[11px] text-gray-500">
                                {gc.title} &bull; Value: <strong>{money(gc.amount_usd)}</strong>
                              </div>
                            </div>
                            <div>
                              {gc.status === 'active' && Number(gc.remaining_balance) > 0 ? (
                                <button
                                  type="button"
                                  onClick={() => handleRedeemGiftCard(null, gc.code)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] px-3 py-1.5 rounded-lg cursor-pointer"
                                >
                                  Redeem {money(gc.remaining_balance)}
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full bg-gray-200 text-gray-600">
                                  Redeemed
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ==============================================================
                TAB: OFFICIAL COMPANY CURRENCY EXCHANGE RATES & CALCULATOR
               ============================================================== */}
            {activeTab === 'rates' && (
              <div className="space-y-6">
                <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-indigo-950 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1 max-w-2xl">
                    <span className="inline-flex items-center gap-1.5 bg-amber-400 text-gray-950 text-[10px] font-black uppercase tracking-widest px-3 py-0.5 rounded-full">
                      <i className="bi bi-currency-exchange"></i> Official Treasury Desk
                    </span>
                    <h2 className="text-lg sm:text-xl font-black">
                      Our Official Company Currency Exchange Rates
                    </h2>
                    <p className="text-xs text-gray-300 leading-relaxed">
                      All product prices, subdomain subscriptions (NGN {domainPlan.fee_ngn || 500}/mo), gift cards, and vendor wallet payouts are converted transparently using our official company exchange rates below.
                    </p>
                  </div>
                  <div className="bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-xs">
                    <div className="text-gray-300 text-[10px] uppercase font-bold">Active Display Currency</div>
                    <div className="text-lg font-black text-amber-400">
                      {currency?.code} ({currency?.symbol}) — 1 USD = {currency?.symbol}
                      {Number(currency?.exchange_rate || 1).toLocaleString()}
                    </div>
                  </div>
                </div>

                {/* Live Interactive Currency Converter Calculator */}
                {(() => {
                  const curList = data?.currencies?.length
                    ? data.currencies
                    : [{ code: 'USD', name: 'US Dollar', symbol: '$', exchange_rate: 1 }];
                  const fromObj = curList.find((c) => c.code === calcFrom) || curList[0];
                  const toObj = curList.find((c) => c.code === calcTo) || curList[0];
                  const fromRate = Number(fromObj?.exchange_rate || 1) || 1;
                  const toRate = Number(toObj?.exchange_rate || 1) || 1;
                  const amountInUsd = Number(calcAmount || 0) / fromRate;
                  const convertedAmt = amountInUsd * toRate;

                  return (
                    <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-4">
                      <h3 className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-2">
                        <i className="bi bi-calculator-fill text-purple-700"></i>
                        Interactive Company Exchange Rate Calculator
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-purple-50/50 p-4 rounded-2xl border border-purple-100">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Amount to Convert</label>
                          <input
                            type="number"
                            step="any"
                            value={calcAmount}
                            onChange={(e) => setCalcAmount(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white font-black text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">From Currency</label>
                          <select
                            value={calcFrom}
                            onChange={(e) => setCalcFrom(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white font-bold text-xs"
                          >
                            {curList.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.code} ({c.symbol}) — {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">To Currency</label>
                          <select
                            value={calcTo}
                            onChange={(e) => setCalcTo(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white font-bold text-xs"
                          >
                            {curList.map((c) => (
                              <option key={c.code} value={c.code}>
                                {c.code} ({c.symbol}) — {c.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 text-xs">
                        <span className="text-gray-500">
                          Base Reference: <strong>$1.00 USD = {fromObj?.symbol}{fromRate.toLocaleString()} {fromObj?.code}</strong> &bull;{' '}
                          <strong>$1.00 USD = {toObj?.symbol}{toRate.toLocaleString()} {toObj?.code}</strong>
                        </span>
                        <div className="text-base sm:text-lg font-black text-purple-900 bg-amber-100 px-4 py-2 rounded-xl">
                          {fromObj?.symbol}
                          {Number(calcAmount || 0).toLocaleString()} {fromObj?.code} ={' '}
                          <span className="text-emerald-700">
                            {toObj?.symbol}
                            {convertedAmt.toLocaleString(undefined, {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{' '}
                            {toObj?.code}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Official Exchange Rate Table */}
                <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                  <h3 className="text-sm sm:text-base font-extrabold text-gray-900 mb-4">
                    All Supported Store Currencies & Live Exchange Rates
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gray-200 text-gray-500 uppercase text-[10px]">
                          <th className="py-3 px-3">Currency</th>
                          <th className="py-3 px-3">Symbol</th>
                          <th className="py-3 px-3">Official Rate (Per $1.00 USD)</th>
                          <th className="py-3 px-3">$100 USD Equivalent</th>
                          <th className="py-3 px-3">Subdomain Fee (NGN 500/mo)</th>
                          <th className="py-3 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(data?.currencies || []).map((c) => {
                          const rate = Number(c.exchange_rate || 1);
                          const ngnRate = Number(domainPlan.ngn_rate || 1550);
                          const subFeeInCur = ((domainPlan.fee_ngn || 500) / ngnRate) * rate;
                          return (
                            <tr key={c.id || c.code} className="hover:bg-gray-50">
                              <td className="py-3 px-3 font-extrabold text-gray-900">
                                {c.code} — <span className="font-normal text-gray-600">{c.name}</span>
                              </td>
                              <td className="py-3 px-3 font-black text-purple-700 text-sm">{c.symbol}</td>
                              <td className="py-3 px-3 font-bold text-gray-900">
                                1 USD = {c.symbol}
                                {rate.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                              </td>
                              <td className="py-3 px-3 font-semibold text-emerald-700">
                                {c.symbol}
                                {(100 * rate).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </td>
                              <td className="py-3 px-3 font-semibold text-purple-800">
                                {c.symbol}
                                {subFeeInCur.toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}{' '}
                                / mo
                              </td>
                              <td className="py-3 px-3">
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 uppercase">
                                  {c.status || 'active'}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ==============================================================
                TAB: WISHLIST
               ============================================================== */}
            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-extrabold text-gray-900 mb-4">Saved Wishlist</h2>
                {!data?.wishlist || data.wishlist.length === 0 ? (
                  <p className="text-xs text-gray-500">Your wishlist is empty.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {data.wishlist.map((w) => (
                      <div key={w.id} className="border border-gray-100 rounded-xl p-3.5 flex items-center gap-3.5">
                        <img src={w.image} alt={w.product_name} className="w-16 h-16 rounded-lg object-cover" />
                        <div className="flex-1 min-w-0">
                          <Link
                            to={`/product?slug=${encodeURIComponent(w.slug || '')}`}
                            className="text-xs font-bold text-gray-900 hover:text-amber-600 line-clamp-1"
                          >
                            {w.product_name}
                          </Link>
                          <p className="text-xs font-extrabold text-amber-600 mt-0.5">
                            {money(w.final_price || w.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==============================================================
                TAB: BOOKS & RICH WRITER STUDIO
               ============================================================== */}
            {activeTab === 'books' && (
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-extrabold text-gray-900">
                      My Books & Rich Writer Studio
                    </h2>
                    <p className="text-xs text-gray-500">
                      Write and edit books effortlessly with our full WYSIWYG Rich Content Editor and earn wallet rewards when readers advance chapters.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setBookForm({
                        id: 0,
                        title: '',
                        author:
                          `${memberUser.firstname || ''} ${memberUser.lastname || ''}`.trim() ||
                          memberUser.username,
                        category: 'Fiction',
                        cover_image: '',
                        description: '',
                        is_monetized: true,
                        price: 4.99,
                        compare_price: 9.99,
                        free_preview_chapters: 1,
                        chapters: [{ title: 'Chapter 1', content: '' }],
                      });
                      setBookModalOpen(true);
                    }}
                    className="bg-gray-900 hover:bg-amber-500 hover:text-gray-950 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="bi bi-pencil-square"></i>
                    <span>Write & Price New Book</span>
                  </button>
                </div>

                {!data?.my_books || data.my_books.length === 0 ? (
                  <p className="text-xs text-gray-500">You have not published any books yet.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {data.my_books.map((bk) => (
                      <div key={bk.id} className="py-3.5 flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/book?slug=${encodeURIComponent(bk.slug)}`}
                              className="text-xs font-extrabold text-gray-900 hover:text-amber-600"
                            >
                              {bk.title}
                            </Link>
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                Number(bk.price) > 0
                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-700'
                              }`}
                            >
                              {Number(bk.price) > 0 ? `Paid: ${money(bk.price)}` : 'Free Book'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {bk.category} &bull; Chapters: {bk.chapters?.length || 0} &bull; Free Sample:{' '}
                            {bk.free_preview_chapters ?? 1} ch &bull; Sales: <strong>{bk.sales_count || 0}</strong> &bull;
                            Views: {bk.views} &bull; Total Earnings:{' '}
                            <strong className="text-emerald-700">{money(bk.writer_earnings || 0)}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setBookForm({
                                ...bk,
                                price: bk.price ?? 0,
                                compare_price: bk.compare_price ?? 0,
                                free_preview_chapters: bk.free_preview_chapters ?? 1,
                                chapters: bk.chapters?.length
                                  ? bk.chapters
                                  : [{ title: 'Chapter 1', content: '' }],
                              });
                              setBookModalOpen(true);
                            }}
                            className="text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg cursor-pointer"
                          >
                            <i className="bi bi-pencil-square mr-1" />
                            Edit Price & Chapters
                          </button>
                          <button
                            onClick={() => handleDeleteBook(bk.id)}
                            className="text-xs font-bold text-red-600 hover:underline px-2 py-1 cursor-pointer"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ==============================================================
                TAB: PROFILE
               ============================================================== */}
            {activeTab === 'profile' && (
              <form
                onSubmit={handleSaveProfile}
                className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-4"
              >
                <h2 className="text-base font-extrabold text-gray-900">Personal Profile</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">First Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.firstname}
                      onChange={(e) => setProfileForm({ ...profileForm, firstname: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={profileForm.lastname}
                      onChange={(e) => setProfileForm({ ...profileForm, lastname: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-amber-500 text-gray-950 font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Save Profile Changes
                </button>
              </form>
            )}

            {/* ==============================================================
                TAB: SECURITY
               ============================================================== */}
            {activeTab === 'security' && (
              <form
                onSubmit={handleChangePassword}
                className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-4"
              >
                <h2 className="text-base font-extrabold text-gray-900">Change Password</h2>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Current Password</label>
                  <input
                    type="password"
                    required
                    value={pwdForm.old}
                    onChange={(e) => setPwdForm({ ...pwdForm, old: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    New Password (min 8 chars)
                  </label>
                  <input
                    type="password"
                    required
                    value={pwdForm.new}
                    onChange={(e) => setPwdForm({ ...pwdForm, new: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={pwdForm.confirm}
                    onChange={(e) => setPwdForm({ ...pwdForm, confirm: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-gray-900 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Update Password
                </button>
              </form>
            )}
          </main>
        </div>
      </div>

      {/* ====================================================================
          ADD / EDIT VENDOR PRODUCT MODAL (WITH MULTIPLE IMAGE UPLOADS & GALLERY)
         ==================================================================== */}
      {productModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  {productForm.id ? 'Edit Vendor Product & Multi-Photo Gallery' : 'Add New Vendor Product'}
                </h3>
                <p className="text-[11px] text-gray-500">
                  Upload multiple product photos from your device or add multiple image URLs.
                </p>
              </div>
              <button
                onClick={() => setProductModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form onSubmit={handleSaveVendorProduct} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.product_name}
                  onChange={(e) => setProductForm({ ...productForm, product_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Base Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Discount %</label>
                  <input
                    type="number"
                    value={productForm.off_price}
                    onChange={(e) => setProductForm({ ...productForm, off_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Stock Qty</label>
                  <input
                    type="number"
                    value={productForm.instock}
                    onChange={(e) => setProductForm({ ...productForm, instock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={productForm.product_category_id || ''}
                    onChange={(e) =>
                      setProductForm({ ...productForm, product_category_id: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  >
                    {(data?.taxonomies?.categories || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Sizes (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="S, M, L, XL"
                    value={productForm.sizes || ''}
                    onChange={(e) => setProductForm({ ...productForm, sizes: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Colors (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="Black, Gold, Blue"
                    value={productForm.colors || ''}
                    onChange={(e) => setProductForm({ ...productForm, colors: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              {/* MULTIPLE PRODUCT IMAGES UPLOADER & GALLERY MANAGER */}
              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <label className="block font-extrabold text-purple-950">
                      <i className="bi bi-images mr-1.5"></i>
                      Multiple Product Images Gallery ({productForm.images?.length || 0} uploaded)
                    </label>
                    <p className="text-[11px] text-gray-600">
                      Select multiple image files from your computer/phone or add multiple image URLs below.
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-sm cursor-pointer transition">
                    <i className="bi bi-cloud-arrow-up-fill"></i>
                    <span>{uploadingImages ? 'Uploading...' : 'Upload Multiple Images'}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleUploadProductImages}
                      disabled={uploadingImages}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Add Image via URL */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Or paste an image URL (https://...) and click Add Photo"
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-gray-300 bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white font-bold cursor-pointer"
                  >
                    + Add Photo URL
                  </button>
                </div>

                {/* Gallery Thumbnails Preview & Reordering */}
                {productForm.images?.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 pt-1">
                    {productForm.images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className={`relative group rounded-xl overflow-hidden border-2 bg-white ${
                          idx === 0 ? 'border-amber-500' : 'border-gray-200'
                        }`}
                      >
                        <img src={imgUrl} alt={`Photo ${idx + 1}`} className="w-full h-20 object-cover" />
                        {idx === 0 && (
                          <span className="absolute top-1 left-1 bg-amber-500 text-gray-950 text-[9px] font-black px-1.5 py-0.5 rounded">
                            Main Cover
                          </span>
                        )}
                        <div className="absolute inset-x-0 bottom-0 bg-black/75 p-1 flex items-center justify-between opacity-0 group-hover:opacity-100 transition">
                          {idx > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                const imgs = [...productForm.images];
                                const [picked] = imgs.splice(idx, 1);
                                imgs.unshift(picked);
                                setProductForm({ ...productForm, images: imgs, image: imgs[0] });
                              }}
                              className="text-[9px] text-amber-300 font-bold hover:underline cursor-pointer"
                            >
                              Set Main
                            </button>
                          ) : (
                            <span className="text-[9px] text-gray-300">#1</span>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              const imgs = productForm.images.filter((_, i) => i !== idx);
                              setProductForm({ ...productForm, images: imgs, image: imgs[0] || '' });
                            }}
                            className="text-[10px] text-red-400 hover:text-red-300 font-bold cursor-pointer"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <RichTextEditor
                  label="Product Description & Rich Specifications"
                  value={productForm.description || ''}
                  onChange={(html) => setProductForm({ ...productForm, description: html })}
                  placeholder="Write detailed product highlights, features, and specifications..."
                  minHeight={180}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold py-3 rounded-xl cursor-pointer"
              >
                Save & Publish Product
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          WRITE / EDIT BOOK MODAL (WITH RICH WYSIWYG STUDIO EDITOR)
         ==================================================================== */}
      {bookModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full p-6 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-extrabold text-gray-900">
                  {bookForm.id ? 'Edit Book & Chapters in Rich Studio' : 'Write & Publish New Book'}
                </h3>
                <p className="text-[11px] text-gray-500">
                  Use the formatting toolbar below to style chapters with headings, quotes, images, and rich typography.
                </p>
              </div>
              <button
                onClick={() => setBookModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form onSubmit={handleSaveBook} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Book Title *"
                  value={bookForm.title}
                  onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold"
                />
                <input
                  type="text"
                  placeholder="Author Name"
                  value={bookForm.author}
                  onChange={(e) => setBookForm({ ...bookForm, author: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
                <input
                  type="text"
                  placeholder="Genre / Category"
                  value={bookForm.category}
                  onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>
              <input
                type="text"
                placeholder="Cover Image URL (https://...)"
                value={bookForm.cover_image || ''}
                onChange={(e) => setBookForm({ ...bookForm, cover_image: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200"
              />
              <textarea
                rows={2}
                placeholder="Short Book Synopsis / Blurb"
                value={bookForm.description || ''}
                onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200"
              />

              {/* Book Writer Pricing & Free Preview Chapters Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-white to-purple-50 border border-amber-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                      <i className="bi bi-tag-fill text-amber-600" />
                      <span>Set Book Price & Reader Access</span>
                    </h4>
                    <p className="text-[11px] text-gray-600">
                      Place a price on your book (or set to 0 for a Free Book). Readers pay to unlock full chapters and earnings credit your wallet.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setBookForm({ ...bookForm, price: 0, compare_price: 0 })}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        Number(bookForm.price) <= 0
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-700'
                      }`}
                    >
                      Free Book ($0)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setBookForm({
                          ...bookForm,
                          price: Number(bookForm.price) > 0 ? bookForm.price : 4.99,
                          compare_price: Number(bookForm.compare_price) > 0 ? bookForm.compare_price : 9.99,
                        })
                      }
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        Number(bookForm.price) > 0
                          ? 'bg-amber-500 text-gray-950 font-black'
                          : 'bg-white border border-gray-200 text-gray-700'
                      }`}
                    >
                      Paid Book
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Selling Price (USD) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={bookForm.price ?? 0}
                      onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-extrabold text-gray-900"
                    />
                    <span className="text-[10px] text-purple-700 font-bold mt-0.5 block">
                      Displays as: {Number(bookForm.price) > 0 ? money(bookForm.price) : 'FREE'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Original / Compare Price (USD)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={bookForm.compare_price ?? 0}
                      onChange={(e) => setBookForm({ ...bookForm, compare_price: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                    />
                    <span className="text-[10px] text-gray-500 mt-0.5 block">
                      Optional strikethrough price
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Free Sample Chapters
                    </label>
                    <select
                      value={bookForm.free_preview_chapters ?? 1}
                      onChange={(e) =>
                        setBookForm({ ...bookForm, free_preview_chapters: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-semibold"
                    >
                      <option value={0}>0 — Lock All Chapters Until Paid</option>
                      <option value={1}>1 Free Sample Chapter (Ch. 1 Free)</option>
                      <option value={2}>2 Free Sample Chapters (Ch. 1–2 Free)</option>
                      <option value={3}>3 Free Sample Chapters (Ch. 1–3 Free)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-gray-100 pt-3">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-sm text-gray-900">
                    Book Chapters ({bookForm.chapters.length})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setBookForm({
                        ...bookForm,
                        chapters: [
                          ...bookForm.chapters,
                          { title: `Chapter ${bookForm.chapters.length + 1}`, content: '' },
                        ],
                      })
                    }
                    className="px-3 py-1.5 rounded-lg bg-purple-100 text-purple-800 font-extrabold cursor-pointer"
                  >
                    + Add Another Chapter
                  </button>
                </div>

                {bookForm.chapters.map((ch, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        placeholder={`Chapter ${idx + 1} Title`}
                        value={ch.title}
                        onChange={(e) => {
                          const next = [...bookForm.chapters];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setBookForm({ ...bookForm, chapters: next });
                        }}
                        className="flex-1 px-3 py-2 rounded-lg border border-gray-300 bg-white font-bold"
                      />
                      {bookForm.chapters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const next = bookForm.chapters.filter((_, i) => i !== idx);
                            setBookForm({ ...bookForm, chapters: next });
                          }}
                          className="text-red-600 font-bold px-2 py-1 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <RichTextEditor
                      label={`Chapter ${idx + 1} Content`}
                      value={ch.content || ''}
                      onChange={(html) => {
                        const next = [...bookForm.chapters];
                        next[idx] = { ...next[idx], content: html };
                        setBookForm({ ...bookForm, chapters: next });
                      }}
                      placeholder={`Start writing Chapter ${idx + 1}...`}
                      minHeight={220}
                    />
                  </div>
                ))}
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold py-3 rounded-xl cursor-pointer"
              >
                Save & Publish Book + Chapters
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
