import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useStore } from '../context/StoreContext';
import SEO from '../components/SEO';
import RichTextEditor from '../components/RichTextEditor';
import SkeletonLoader from '../components/SkeletonLoader';

export default function AdminPage() {
  const { user, money, moneyFromNgn, refreshBootstrap, showToast, triggerBrowserPush } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSecrets, setShowSecrets] = useState({});

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) setActiveTab(t);
  }, [searchParams]);

  const switchTab = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  // Product Modal State (with Multiple Images Upload & Gallery)
  const [prodModal, setProdModal] = useState(false);
  const [uploadingAdminImages, setUploadingAdminImages] = useState(false);
  const [uploadingCompanyLogo, setUploadingCompanyLogo] = useState(false);
  const [newAdminImgUrl, setNewAdminImgUrl] = useState('');
  const [prodForm, setProdForm] = useState({
    id: 0,
    product_name: '',
    price: 49.99,
    off_price: 10,
    instock: 25,
    product_category_id: 1,
    product_sub_category_id: '',
    brand_category_id: '',
    image: '',
    images: [],
    sizes: '',
    colors: '',
    description: '',
  });

  // Category Form
  const [catForm, setCatForm] = useState({ id: 0, name: '', slug: '', image: '', description: '' });

  // Inventory Form (with Priority Position & Show Ads Next)
  const [invForm, setInvForm] = useState({
    id: 0,
    name: '',
    description: '',
    style_type: 1,
    inv_position: 1,
    show_ads_next: true,
  });

  // Homepage Promo Banner Ad Form
  const [promoAdForm, setPromoAdForm] = useState({
    id: 0,
    title: '',
    subtitle: '',
    badge_text: 'FEATURED PROMO',
    cta_text: 'Shop Now',
    cta_link: '/category',
    image_url: '',
    bg_gradient: 'from-[#3b0764] via-[#7b1d8e] to-[#ea580c]',
    position_key: 'after_first_inv',
    sort_order: 1,
    is_active: true,
  });

  // Admin Personal Store Gift Card Generator Form
  const [adminGiftForm, setAdminGiftForm] = useState({
    code: '',
    title: 'Shoplenca Official Store Gift Card',
    design_theme: 'royal_gold',
    amount_usd: 25,
    quantity: 1,
    recipient_name: '',
    recipient_email: '',
    personal_message: 'Official Shoplenca Gift Card — Redeem directly to your Member Wallet!',
  });

  // Currency Exchange Rate Form
  const [curForm, setCurForm] = useState({
    id: 0,
    code: '',
    name: '',
    symbol: '$',
    exchange_rate: 1.0,
    status: 'active',
  });

  // Static Page Content Form
  const [pageForm, setPageForm] = useState({
    id: 0,
    page: 'about',
    tab_slug: 'overview',
    title: '',
    icon: 'bi-building',
    content: '',
    status: 'active',
  });

  // Blog Form
  const [blogForm, setBlogForm] = useState({
    id: 0,
    title: '',
    category: 'Style Guide',
    image: '',
    excerpt: '',
    content: '',
  });

  // Book Form (with Book Pricing & Free Preview Chapters)
  const [bookForm, setBookForm] = useState({
    id: 0,
    title: '',
    author: 'Editorial Team',
    category: 'Selling Online',
    cover_image: '',
    description: '',
    is_monetized: true,
    price: 4.99,
    compare_price: 9.99,
    free_preview_chapters: 1,
    chapters: [{ title: 'Chapter 1', content: '' }],
  });

  // Settings Form (includes Company Info, AdSense & Native Capacitor / AdMob settings)
  const [settingsForm, setSettingsForm] = useState({});

  // Push Notification Broadcast Form
  const [pushForm, setPushForm] = useState({
    target_uid: '',
    title: '',
    message: '',
    type: 'promo',
    link: '/',
    icon: 'bi-megaphone-fill',
  });

  // Vendor Verification Note state map
  const [verifNotes, setVerifNotes] = useState({});

  // New Gateway Modal
  const [newGwOpen, setNewGwOpen] = useState(false);
  const [newGwForm, setNewGwForm] = useState({
    code: '',
    name: '',
    gateway_type: 'online',
    description: '',
    icon: 'bi-credit-card',
    is_active: 1,
    mode: 'test',
    public_key: '',
    secret_key: '',
    webhook_secret: '',
    merchant_id: '',
  });

  const loadAdmin = () => {
    setLoading(true);
    api
      .get('/admin')
      .then((res) => {
        setData(res);
        setSettingsForm({
          subdomain_fee_ngn: '500',
          subdomain_grace_days: '2',
          company_wallet_charge_pct: '2.5',
          company_email: 'support@shoplenca.com',
          company_phone: '+234 800 SHOPLENCA',
          company_whatsapp: '+2348000000000',
          company_address: 'Victoria Island, Lagos, Nigeria & Global Operations',
          company_working_hours: 'Mon - Sat: 8:00 AM - 8:00 PM (24/7 Online Support)',
          company_mission: 'Empowering vendors, book writers, and shoppers with secure escrow commerce and self-owned storefronts.',
          company_vision: 'To be the most trusted multi-currency digital & physical marketplace across Africa and beyond.',
          company_founded_year: '2024',
          company_rc_number: 'RC-8849201',
          social_facebook: 'https://facebook.com/shoplenca',
          social_instagram: 'https://instagram.com/shoplenca',
          social_twitter: 'https://x.com/shoplenca',
          social_tiktok: 'https://tiktok.com/@shoplenca',
          social_youtube: 'https://youtube.com/@shoplenca',
          footer_copyright: '© 2026 Shoplenca Marketplace. All Rights Reserved. Escrow Protected.',
          escrow_policy_text: 'Buyer funds are held securely in Escrow until the customer confirms both delivery receipt and good product condition (Order Sealed), after which Admin verifies and releases funds to the vendor wallet.',
          adsense_enabled: '1',
          adsense_client_id: 'ca-pub-0000000000000000',
          adsense_auto_ads: '1',
          adsense_head_script: '',
          adsense_slot_header: '',
          adsense_html_header: '',
          adsense_slot_home: '',
          adsense_html_home: '',
          adsense_slot_product: '',
          adsense_html_product: '',
          adsense_slot_category: '',
          adsense_html_category: '',
          adsense_slot_article: '',
          adsense_html_article: '',
          adsense_slot_footer: '',
          adsense_html_footer: '',
          capacitor_app_id: 'com.shoplenca.marketplace',
          capacitor_app_name: 'Shoplenca Marketplace',
          capacitor_server_url: '',
          admob_enabled: '1',
          admob_app_id_android: 'ca-app-pub-3940256099942544~3347511713',
          admob_app_id_ios: 'ca-app-pub-3940256099942544~1458002511',
          admob_banner_id: 'ca-app-pub-3940256099942544/6300978111',
          admob_interstitial_id: 'ca-app-pub-3940256099942544/1033173712',
          admob_rewarded_id: 'ca-app-pub-3940256099942544/5224354917',
          ...(res.settings || {}),
        });
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        showToast(err.message || 'Admin access required', 'error');
      });
  };

  useEffect(() => {
    loadAdmin();
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-gray-100 min-h-screen py-6 pb-16">
        <SEO title="Admin Control Center — Loading..." />
        <SkeletonLoader type="dashboard" />
      </div>
    );
  }

  if (!loading && (!user || !user.is_admin) && !data?.stats) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center">
        <SEO title="Admin Control Center — Restricted" />
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
          <i className="bi bi-shield-lock-fill text-4xl text-amber-500 mb-3 block"></i>
          <h1 className="text-xl font-extrabold text-gray-900 mb-2">Administrator Access Required</h1>
          <p className="text-xs text-gray-500 mb-6">
            Please sign in with an administrator account to manage payment gateways, API keys, vendor verifications, subdomain stores, and push notifications.
          </p>
          <Link to="/login" className="bg-amber-500 text-gray-950 font-extrabold text-xs px-6 py-3 rounded-xl">
            Sign In as Admin
          </Link>
        </div>
      </div>
    );
  }

  // Save Payment Gateway & API Keys
  const handleSaveGateway = async (gw) => {
    try {
      const res = await api.post('/admin', {
        action: 'save_gateway',
        ...gw,
      });
      showToast(res.message || `${gw.name} API keys saved!`, 'success');
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Failed to save gateway', 'error');
    }
  };

  const updateGatewayField = (id, field, value) => {
    setData((prev) => ({
      ...prev,
      gateways: (prev.gateways || []).map((g) => (g.id === id ? { ...g, [field]: value } : g)),
    }));
  };

  const updateGatewayExtra = (id, extraKey, value) => {
    setData((prev) => ({
      ...prev,
      gateways: (prev.gateways || []).map((g) =>
        g.id === id ? { ...g, extra: { ...(g.extra || {}), [extraKey]: value } } : g
      ),
    }));
  };

  const handleAddNewGateway = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin', {
        action: 'save_gateway',
        ...newGwForm,
      });
      showToast(res.message || 'Gateway added!', 'success');
      setNewGwOpen(false);
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Error adding gateway', 'error');
    }
  };

  // Order Status Update
  const handleUpdateOrder = async (id, order_status, payment_status) => {
    try {
      await api.post('/admin', {
        action: 'update_order',
        id,
        order_status,
        payment_status,
      });
      showToast('Order updated & push notification sent to customer.', 'success');
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  // Admin Verify Sealed Order & Release Funds to Vendor Wallet
  const handleReleaseOrderFunds = async (orderId) => {
    try {
      const res = await api.post('/admin', {
        action: 'release_order_funds',
        id: orderId,
      });
      showToast(res.message || 'Funds released to vendor wallet!', 'success');
      refreshBootstrap();
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Cannot release funds yet', 'error');
    }
  };

  // Admin Verify / Reject / Revoke Vendor
  const handleVerifyVendor = async (vendorUid, verification_status) => {
    try {
      const note = verifNotes[vendorUid] ?? '';
      const res = await api.post('/admin', {
        action: 'verify_vendor',
        uid: vendorUid,
        verification_status,
        verification_note: note,
      });
      showToast(res.message || 'Vendor verification updated!', 'success');
      refreshBootstrap();
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Verification action failed', 'error');
    }
  };

  // Admin Manage Subdomain Store (Reopen, Close, Extend Months, Switch Mode)
  const handleManageDomainStore = async (vendorUid, domain_store_status, payment_mode, extend_months = 0) => {
    try {
      const res = await api.post('/admin', {
        action: 'manage_domain_store',
        uid: vendorUid,
        domain_store_status,
        payment_mode,
        extend_months,
      });
      showToast(res.message || 'Subdomain store updated!', 'success');
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Could not update subdomain store', 'error');
    }
  };

  // Admin Send Broadcast / Targeted Push Notification
  const handleSendPush = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin', {
        action: 'send_push',
        ...pushForm,
      });
      showToast(res.message || 'Push notification sent!', 'success');
      if (triggerBrowserPush) {
        triggerBrowserPush(pushForm.title, pushForm.message, pushForm.link || '/');
      }
      setPushForm({
        target_uid: '',
        title: '',
        message: '',
        type: 'promo',
        link: '/',
        icon: 'bi-megaphone-fill',
      });
      refreshBootstrap();
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Could not send push notification', 'error');
    }
  };

  const handleDeletePush = async (id) => {
    try {
      await api.post('/admin', { action: 'delete_push', id });
      showToast('Notification deleted.', 'info');
      refreshBootstrap();
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  // Multi-Image Device Upload Handler for Admin Products
  const handleUploadAdminImages = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setUploadingAdminImages(true);
    try {
      const base64List = await Promise.all(
        files.map(
          (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        )
      );
      const res = await api.post('/upload', { base64_images: base64List });
      if (res.urls?.length) {
        setProdForm((prev) => {
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
      setUploadingAdminImages(false);
      e.target.value = '';
    }
  };

  // Company Logo Upload Handler
  const handleUploadCompanyLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCompanyLogo(true);
    try {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await api.post('/upload', { base64_images: [base64] });
      if (res.urls?.length) {
        setSettingsForm((prev) => ({
          ...prev,
          company_logo: res.urls[0],
        }));
        showToast('Company logo uploaded successfully!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Failed to upload company logo', 'error');
    } finally {
      setUploadingCompanyLogo(false);
      e.target.value = '';
    }
  };

  const handleAddAdminImageUrl = () => {
    const url = newAdminImgUrl.trim();
    if (!url) return;
    setProdForm((prev) => {
      const merged = [...(prev.images || []), url];
      return {
        ...prev,
        images: merged,
        image: merged[0] || prev.image,
      };
    });
    setNewAdminImgUrl('');
  };

  // Product Save / Delete
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    try {
      const finalImages =
        prodForm.images?.length > 0
          ? prodForm.images
          : prodForm.image
          ? [prodForm.image]
          : [];
      const res = await api.post('/admin', {
        action: 'save_product',
        ...prodForm,
        image: finalImages[0] || prodForm.image,
        images: finalImages,
      });
      showToast(res.message || 'Product saved', 'success');
      setProdModal(false);
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Save failed', 'error');
    }
  };

  const handleDeleteProduct = async (id) => {
    try {
      await api.post('/admin', { action: 'delete_product', id });
      showToast('Product deleted.', 'info');
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  // Category Save
  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin', { action: 'save_category', ...catForm });
      showToast('Category saved!', 'success');
      setCatForm({ id: 0, name: '', slug: '', image: '', description: '' });
      refreshBootstrap();
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Error', 'error');
    }
  };

  // Inventory Save & Reorder
  const handleSaveInventory = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin', { action: 'save_inventory', ...invForm });
      showToast('Inventory section saved!', 'success');
      setInvForm({ id: 0, name: '', description: '', style_type: 1, inv_position: 1, show_ads_next: true });
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Error', 'error');
    }
  };

  const handleReorderInventory = async (id, direction) => {
    try {
      const res = await api.post('/admin', {
        action: 'reorder_inventory',
        id,
        direction,
      });
      showToast(res.message || 'Homepage inventory order updated!', 'success');
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Reorder failed', 'error');
    }
  };

  // Homepage Promo Ad Save / Delete
  const handleSavePromoAd = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin', {
        action: 'save_promo_ad',
        ...promoAdForm,
      });
      showToast(res.message || 'Homepage Promo Ad saved!', 'success');
      setPromoAdForm({
        id: 0,
        title: '',
        subtitle: '',
        badge_text: 'FEATURED PROMO',
        cta_text: 'Shop Now',
        cta_link: '/category',
        image_url: '',
        bg_gradient: 'from-[#3b0764] via-[#7b1d8e] to-[#ea580c]',
        position_key: 'after_first_inv',
        sort_order: 1,
        is_active: true,
      });
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Failed to save Promo Ad', 'error');
    }
  };

  const handleDeletePromoAd = async (id) => {
    try {
      await api.post('/admin', { action: 'delete_promo_ad', id });
      showToast('Promo Ad deleted.', 'info');
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  // Admin Create / Delete Personal Store Gift Cards
  const handleCreateAdminGiftCard = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin', {
        action: 'create_gift_card',
        ...adminGiftForm,
      });
      showToast(res.message || 'Gift Card(s) created!', 'success');
      setAdminGiftForm((prev) => ({ ...prev, code: '' }));
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Failed to create Gift Card', 'error');
    }
  };

  const handleDeleteAdminGiftCard = async (id) => {
    try {
      await api.post('/admin', { action: 'delete_gift_card', id });
      showToast('Gift Card deleted.', 'info');
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  // Save Currency Exchange Rate
  const handleSaveCurrency = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin', {
        action: 'save_currency',
        ...curForm,
      });
      showToast(res.message || 'Currency exchange rate saved!', 'success');
      setCurForm({ id: 0, code: '', name: '', symbol: '$', exchange_rate: 1.0, status: 'active' });
      refreshBootstrap();
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Failed to save currency', 'error');
    }
  };

  // Save Static Page Content
  const handleSaveSitePage = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin', {
        action: 'save_site_page',
        ...pageForm,
      });
      showToast(res.message || 'Company page content saved!', 'success');
      setPageForm({ id: 0, page: 'about', tab_slug: 'overview', title: '', icon: 'bi-building', content: '', status: 'active' });
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Failed to save page content', 'error');
    }
  };

  // User Role Toggle
  const handleUpdateUserRole = async (u, is_admin, is_vendor) => {
    try {
      await api.post('/admin', {
        action: 'update_user',
        uid: u.uid,
        status: u.status || 'active',
        is_admin,
        is_vendor,
      });
      showToast(`Updated roles for ${u.username}`, 'success');
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Update failed', 'error');
    }
  };

  // Save Site, Company Info, AdSense & Capacitor Settings
  const handleSaveSettings = async (e) => {
    if (e) e.preventDefault();
    try {
      await api.post('/admin', {
        action: 'save_settings',
        ...settingsForm,
      });
      if (settingsForm.capacitor_server_url) {
        localStorage.setItem('shoplenca_capacitor_server_url', settingsForm.capacitor_server_url);
      }
      showToast('Company Information, Store Settings, AdSense & Capacitor configuration saved!', 'success');
      refreshBootstrap();
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Error saving settings', 'error');
    }
  };

  // Save Book & Price
  const handleSaveBook = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/admin', {
        action: 'save_book',
        ...bookForm,
      });
      showToast(res.message || 'Book & price saved!', 'success');
      setBookForm({
        id: 0,
        title: '',
        author: 'Editorial Team',
        category: 'Selling Online',
        cover_image: '',
        description: '',
        is_monetized: true,
        price: 4.99,
        compare_price: 9.99,
        free_preview_chapters: 1,
        chapters: [{ title: 'Chapter 1', content: '' }],
      });
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Error saving book', 'error');
    }
  };

  const handleDeleteBook = async (id) => {
    try {
      await api.post('/admin', { action: 'delete_book', book_id: id });
      showToast('Book deleted.', 'info');
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Delete failed', 'error');
    }
  };

  // Save Blog
  const handleSaveBlog = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin', { action: 'save_blog', ...blogForm });
      showToast('Blog post saved!', 'success');
      setBlogForm({ id: 0, title: '', category: 'Style Guide', image: '', excerpt: '', content: '' });
      loadAdmin();
    } catch (err) {
      showToast(err.message || 'Error', 'error');
    }
  };

  const stats = data?.stats || {};
  const activeGatewaysCount = (data?.gateways || []).filter((g) => g.is_active).length;

  const tabs = [
    { key: 'overview', label: 'Overview', icon: 'bi-pie-chart-fill' },
    {
      key: 'orders',
      label: `Orders & Sealed Escrow Release (${stats.sealed_awaiting_release || 0} Sealed)`,
      icon: 'bi-shield-check',
    },
    {
      key: 'inventories',
      label: 'Home Inventories Order & Promo Ads',
      icon: 'bi-collection-fill',
    },
    {
      key: 'giftcards',
      label: `Personal Store Gift Cards (${stats.active_gift_cards || 0})`,
      icon: 'bi-gift-fill',
    },
    {
      key: 'settings',
      label: 'Company Info, Exchange Rates & Pages',
      icon: 'bi-building-gear',
    },
    {
      key: 'adsense',
      label: 'Google AdSense & Capacitor App',
      icon: 'bi-badge-ad-fill',
    },
    {
      key: 'vendors',
      label: `Verify Vendors (${stats.pending_verifications || 0} Pending)`,
      icon: 'bi-patch-check-fill',
    },
    {
      key: 'domains',
      label: 'Subdomain Stores & Company Charges',
      icon: 'bi-globe2',
    },
    {
      key: 'push',
      label: 'Push Notifications',
      icon: 'bi-bell-fill',
    },
    { key: 'gateways', label: 'Payment Gateways & API Keys', icon: 'bi-key-fill' },
    { key: 'books', label: 'Books & Author Pricing', icon: 'bi-book-half' },
    { key: 'products', label: 'Products (Multi-Image)', icon: 'bi-boxes' },
    { key: 'categories', label: 'Categories', icon: 'bi-diagram-3-fill' },
    { key: 'users', label: 'Users & Roles', icon: 'bi-people-fill' },
    { key: 'blogs', label: 'Rich Blog Studio', icon: 'bi-journal-richtext' },
  ];

  return (
    <div className="bg-gray-100 min-h-screen py-6 pb-16">
      <SEO title="Admin Control Center — AdSense, Capacitor App, Vendor Verification & Subdomain Stores" />

      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* Top Admin Header */}
        <div className="bg-gradient-to-r from-gray-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-6 shadow-md mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="inline-block bg-amber-500 text-gray-950 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-1.5">
              Master Admin Control Panel
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold">
              Storefront, Google AdSense, Capacitor App, Vendor Verification & Gateways
            </h1>
            <p className="text-xs text-gray-300 mt-0.5">
              Paste your Google AdSense codes, configure Native Capacitor / AdMob settings, verify vendors, manage NGN 500/mo subdomain stores, and set book prices.
            </p>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Link
              to="/members"
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-white/15 transition"
            >
              <i className="bi bi-person mr-1.5"></i>
              Member View
            </Link>
            <Link
              to="/"
              className="bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-extrabold px-4 py-2.5 rounded-xl shadow transition"
            >
              View Live Store &rarr;
            </Link>
          </div>
        </div>

        {/* Navigation Pills */}
        <div className="flex gap-2 overflow-x-auto pb-3 mb-5 no-scrollbar">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => switchTab(t.key)}
              className={`px-4 py-2.5 rounded-xl text-xs font-extrabold whitespace-nowrap flex items-center gap-2 transition cursor-pointer ${
                activeTab === t.key
                  ? 'bg-gray-900 text-white shadow'
                  : 'bg-white text-gray-700 hover:bg-amber-50 border border-gray-200/80'
              }`}
            >
              <i className={`bi ${t.icon} ${activeTab === t.key ? 'text-amber-400' : 'text-gray-400'}`}></i>
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ================================================================
            TAB 1: OVERVIEW
           ================================================================ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <span className="text-[11px] font-semibold text-gray-400">Total Order Revenue</span>
                <p className="text-xl font-extrabold text-emerald-600 mt-1">
                  {money(stats.revenue || 0)}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <span className="text-[11px] font-semibold text-gray-400">Verified Vendors</span>
                <p className="text-xl font-extrabold text-emerald-700 mt-1">
                  {stats.verified_vendors || 0} / {stats.vendors || 0}
                  {stats.pending_verifications > 0 && (
                    <span className="ml-2 text-xs text-amber-600">
                      ({stats.pending_verifications} pending)
                    </span>
                  )}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <span className="text-[11px] font-semibold text-gray-400">Active Subdomain Stores</span>
                <p className="text-xl font-extrabold text-purple-700 mt-1">
                  {stats.active_domain_stores || 0}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <span className="text-[11px] font-semibold text-gray-400">Company Wallet Charges Earned</span>
                <p className="text-xl font-extrabold text-pink-600 mt-1">
                  {money(stats.company_charges_earned || 0)}
                </p>
              </div>
            </div>

            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-emerald-200 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <i className="bi bi-patch-check-fill text-emerald-600" />
                    Vendor Verification Queue
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Approve or reject vendor verification requests so verified sellers display the official badge on Jumia-style product pages.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('vendors')}
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Review & Verify Vendors &rarr;
                </button>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-purple-200 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <i className="bi bi-globe2 text-purple-600" />
                    Subdomain Stores & Company Charges
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Manage NGN 500/mo subdomain stores, 2-day extra grace periods, Self-Managed vs Company Wallet modes, and database settlement charges.
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('domains')}
                  className="mt-4 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                >
                  Manage Subdomain Stores &rarr;
                </button>
              </div>

              <div className="bg-white rounded-2xl p-5 shadow-sm border-2 border-amber-200 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <i className="bi bi-bell-fill text-amber-500" />
                    Push Notifications & Gateways ({activeGatewaysCount} Active)
                  </h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Broadcast push notifications to all shoppers or configure Paystack, Flutterwave, Stripe, and Crypto API keys.
                  </p>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => switchTab('adsense')}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-3 py-2.5 rounded-xl cursor-pointer"
                  >
                    AdSense & App
                  </button>
                  <button
                    onClick={() => switchTab('push')}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold text-xs px-3 py-2.5 rounded-xl cursor-pointer"
                  >
                    Send Push
                  </button>
                  <button
                    onClick={() => switchTab('gateways')}
                    className="flex-1 bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-xs px-3 py-2.5 rounded-xl cursor-pointer"
                  >
                    API Keys
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            TAB: GOOGLE ADSENSE & NATIVE CAPACITOR / ADMOB APP MANAGER
           ================================================================ */}
        {activeTab === 'adsense' && (
          <form onSubmit={handleSaveSettings} className="space-y-6">
            {/* 1. Google AdSense Global Configuration (Web) */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-indigo-100 text-indigo-800 px-2.5 py-0.5 rounded-full">
                    Web Monetization
                  </span>
                  <h2 className="text-lg font-extrabold text-gray-900 mt-1 flex items-center gap-2">
                    <i className="bi bi-badge-ad-fill text-indigo-600" />
                    <span>Google AdSense & Custom Ad Code Manager</span>
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Paste your Google AdSense Publisher ID, Global Auto-Ads <code className="bg-gray-100 px-1 rounded">&lt;head&gt;</code> script, or individual Ad Unit <code className="bg-gray-100 px-1 rounded">&lt;ins&gt;</code> codes below. On Native Capacitor Android/iOS builds, the app automatically switches to Google AdMob so everything works together cleanly.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <label className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-200 px-3.5 py-2 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={String(settingsForm.adsense_enabled ?? '1') === '1'}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          adsense_enabled: e.target.checked ? '1' : '0',
                        })
                      }
                    />
                    <span className="text-xs font-extrabold text-indigo-900">
                      Enable Website Ads
                    </span>
                  </label>

                  <button
                    type="submit"
                    className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-black text-xs px-5 py-2.5 rounded-xl shadow transition cursor-pointer"
                  >
                    <i className="bi bi-check2-circle mr-1.5" />
                    Save AdSense & App Settings
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">
                    Google AdSense Publisher ID (<code className="text-indigo-600">ca-pub-...</code>)
                  </label>
                  <input
                    type="text"
                    placeholder="ca-pub-1234567890123456"
                    value={settingsForm.adsense_client_id || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, adsense_client_id: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-mono font-bold"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Automatically loads <code className="bg-gray-100 px-1 rounded">adsbygoogle.js?client=ca-pub-...</code> in the site header on Web.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-extrabold text-gray-800 mb-1">
                    Paste Full Google AdSense <code className="text-indigo-600">&lt;head&gt;</code> Script / Verification Code
                  </label>
                  <textarea
                    rows={3}
                    placeholder={'<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXX" crossorigin="anonymous"></script>'}
                    value={settingsForm.adsense_head_script || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, adsense_head_script: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Placement Slot IDs & Custom HTML/AdSense Snippet Boxes */}
              <div className="pt-3 border-t border-gray-100">
                <h3 className="text-sm font-extrabold text-gray-900 mb-1">
                  Ad Placement Slots (Paste Slot ID or Full AdSense / Custom HTML Code)
                </h3>
                <p className="text-xs text-gray-500 mb-4">
                  For each placement, you can either enter your numeric <strong>AdSense Data-Ad-Slot ID</strong> OR paste the <strong>entire AdSense <code className="bg-gray-100 px-1 rounded">&lt;ins class="adsbygoogle"&gt;...&lt;/script&gt;</code> / custom banner HTML code</strong> directly.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    {
                      key: 'header',
                      title: '1. Header / Top Banner Slot',
                      desc: 'Appears at top of pages (728×90 Leaderboard or Responsive)',
                    },
                    {
                      key: 'home',
                      title: '2. Homepage In-Feed Banner Slot',
                      desc: 'Appears below Hero Shortcuts on Homepage',
                    },
                    {
                      key: 'product',
                      title: '3. Jumia-Style Product Page Ad Slot',
                      desc: 'Appears between Product Specifications & Customer Feedback',
                    },
                    {
                      key: 'category',
                      title: '4. Category & Search Listing Slot',
                      desc: 'Appears on Category & Product Filter pages',
                    },
                    {
                      key: 'article',
                      title: '5. Digital Bookstore & Blog Reader Slot',
                      desc: 'Appears inside Book Details, Chapter Reader & Blog Articles',
                    },
                    {
                      key: 'footer',
                      title: '6. Footer Global Banner Slot',
                      desc: 'Appears above the site footer across all pages',
                    },
                  ].map((slot) => (
                    <div
                      key={slot.key}
                      className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-extrabold text-gray-900">{slot.title}</h4>
                        <span className="text-[10px] font-mono bg-white border border-gray-200 px-2 py-0.5 rounded text-indigo-700 font-bold">
                          placement=&quot;{slot.key}&quot;
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500">{slot.desc}</p>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          AdSense Slot ID (<code className="text-indigo-600">data-ad-slot</code>)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 9876543210"
                          value={settingsForm[`adsense_slot_${slot.key}`] || ''}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              [`adsense_slot_${slot.key}`]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-mono"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Or Paste Full AdSense / Custom Ad HTML Code Here:
                        </label>
                        <textarea
                          rows={3}
                          placeholder={`Paste <ins class="adsbygoogle" ...></ins> or custom ad HTML for ${slot.key}...`}
                          value={settingsForm[`adsense_html_${slot.key}`] || ''}
                          onChange={(e) =>
                            setSettingsForm({
                              ...settingsForm,
                              [`adsense_html_${slot.key}`]: e.target.value,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Native Capacitor App (Android / iOS) & Google AdMob Configuration */}
            <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-md space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-400 text-gray-950 px-2.5 py-0.5 rounded-full">
                    Native Mobile App Ready (Capacitor + AdMob)
                  </span>
                  <h2 className="text-lg font-extrabold mt-1 flex items-center gap-2">
                    <i className="bi bi-phone-fill text-amber-400" />
                    <span>Native Capacitor App & Google AdMob Integration</span>
                  </h2>
                  <p className="text-xs text-indigo-200 mt-0.5 max-w-3xl">
                    When you package this React + Vite project into a Native Android APK or iOS IPA with Capacitor (<code className="bg-white/10 px-1.5 py-0.5 rounded">capacitor.config.json</code>), the app automatically uses your Production API URL and switches web AdSense slots to Native AdMob banners.
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-3.5 py-2 rounded-xl cursor-pointer">
                  <input
                    type="checkbox"
                    checked={String(settingsForm.admob_enabled ?? '1') === '1'}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        admob_enabled: e.target.checked ? '1' : '0',
                      })
                    }
                  />
                  <span className="text-xs font-extrabold text-amber-300">
                    Enable Native Mobile AdMob
                  </span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-indigo-200 mb-1">
                    Capacitor App ID (Bundle ID)
                  </label>
                  <input
                    type="text"
                    placeholder="com.shoplenca.marketplace"
                    value={settingsForm.capacitor_app_id || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, capacitor_app_id: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-indigo-200 mb-1">
                    Native App Name
                  </label>
                  <input
                    type="text"
                    placeholder="Shoplenca Marketplace"
                    value={settingsForm.capacitor_app_name || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, capacitor_app_name: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-300 mb-1">
                    Production Backend URL (for Native APK/IPA)
                  </label>
                  <input
                    type="text"
                    placeholder="https://yourdomain.com/api"
                    value={settingsForm.capacitor_server_url || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, capacitor_server_url: e.target.value })
                    }
                    className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-amber-400/50 text-white text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-bold text-indigo-200 mb-1">
                    AdMob Android App ID
                  </label>
                  <input
                    type="text"
                    value={settingsForm.admob_app_id_android || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, admob_app_id_android: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-[11px] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-200 mb-1">
                    AdMob iOS App ID
                  </label>
                  <input
                    type="text"
                    value={settingsForm.admob_app_id_ios || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, admob_app_id_ios: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-[11px] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-200 mb-1">
                    AdMob Banner Unit ID
                  </label>
                  <input
                    type="text"
                    value={settingsForm.admob_banner_id || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, admob_banner_id: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-[11px] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-200 mb-1">
                    AdMob Interstitial ID
                  </label>
                  <input
                    type="text"
                    value={settingsForm.admob_interstitial_id || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, admob_interstitial_id: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-[11px] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-indigo-200 mb-1">
                    AdMob Rewarded Unit ID
                  </label>
                  <input
                    type="text"
                    value={settingsForm.admob_rewarded_id || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, admob_rewarded_id: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-white/10 border border-white/20 text-white text-[11px] font-mono"
                  />
                </div>
              </div>

              <div className="bg-black/30 rounded-xl p-4 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="text-xs space-y-1">
                  <p className="font-extrabold text-amber-300">
                    <i className="bi bi-terminal-fill mr-1.5" />
                    Ready to Convert to Native Android / iOS Capacitor App Anytime:
                  </p>
                  <p className="text-[11px] text-gray-300 font-mono">
                    npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios &amp;&amp; npm run build &amp;&amp; npx cap sync
                  </p>
                </div>
                <button
                  type="submit"
                  className="bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-xs px-5 py-2.5 rounded-xl shadow shrink-0 cursor-pointer"
                >
                  Save All AdSense &amp; Capacitor Settings
                </button>
              </div>
            </div>
          </form>
        )}

        {/* ================================================================
            TAB: DIGITAL BOOKS & AUTHOR PRICING STUDIO
           ================================================================ */}
        {activeTab === 'books' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveBook}
              className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-4 h-fit"
            >
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    {bookForm.id ? `Edit Book #${bookForm.id} & Pricing` : 'Publish & Price New Digital Book'}
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Set book price (or $0 for Free), choose free preview sample chapters, and write chapters with the Studio Rich Editor.
                  </p>
                </div>
                {bookForm.id > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      setBookForm({
                        id: 0,
                        title: '',
                        author: 'Editorial Team',
                        category: 'Selling Online',
                        cover_image: '',
                        description: '',
                        is_monetized: true,
                        price: 4.99,
                        compare_price: 9.99,
                        free_preview_chapters: 1,
                        chapters: [{ title: 'Chapter 1', content: '' }],
                      })
                    }
                    className="text-xs font-bold text-gray-500 hover:text-gray-800 cursor-pointer"
                  >
                    + New Book
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
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
                  placeholder="Category / Genre"
                  value={bookForm.category}
                  onChange={(e) => setBookForm({ ...bookForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200"
                />
              </div>

              <input
                type="text"
                placeholder="Book Cover Image URL (https://...)"
                value={bookForm.cover_image || ''}
                onChange={(e) => setBookForm({ ...bookForm, cover_image: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
              />

              <textarea
                rows={2}
                placeholder="Book Synopsis / Description"
                value={bookForm.description || ''}
                onChange={(e) => setBookForm({ ...bookForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
              />

              {/* Book Price & Free Sample Chapters */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Book Price (USD) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bookForm.price ?? 0}
                    onChange={(e) => setBookForm({ ...bookForm, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-extrabold"
                  />
                  <span className="text-[10px] text-purple-700 font-bold mt-0.5 block">
                    {Number(bookForm.price) > 0 ? `Paid (${money(bookForm.price)})` : 'Free Book ($0)'}
                  </span>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Compare Price (USD)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={bookForm.compare_price ?? 0}
                    onChange={(e) => setBookForm({ ...bookForm, compare_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">
                    Free Preview Chapters
                  </label>
                  <select
                    value={bookForm.free_preview_chapters ?? 1}
                    onChange={(e) =>
                      setBookForm({ ...bookForm, free_preview_chapters: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 bg-white font-semibold"
                  >
                    <option value={0}>0 Free (All Locked)</option>
                    <option value={1}>1 Free Chapter</option>
                    <option value={2}>2 Free Chapters</option>
                    <option value={3}>3 Free Chapters</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-gray-900">
                    Chapters ({bookForm.chapters?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setBookForm({
                        ...bookForm,
                        chapters: [
                          ...(bookForm.chapters || []),
                          { title: `Chapter ${(bookForm.chapters?.length || 0) + 1}`, content: '' },
                        ],
                      })
                    }
                    className="text-xs font-extrabold bg-purple-100 text-purple-800 px-3 py-1 rounded-lg cursor-pointer"
                  >
                    + Add Chapter
                  </button>
                </div>

                {(bookForm.chapters || []).map((ch, idx) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={ch.title}
                        onChange={(e) => {
                          const next = [...bookForm.chapters];
                          next[idx] = { ...next[idx], title: e.target.value };
                          setBookForm({ ...bookForm, chapters: next });
                        }}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-xs font-bold"
                      />
                      {bookForm.chapters.length > 1 && (
                        <button
                          type="button"
                          onClick={() =>
                            setBookForm({
                              ...bookForm,
                              chapters: bookForm.chapters.filter((_, i) => i !== idx),
                            })
                          }
                          className="text-xs font-bold text-rose-600 cursor-pointer"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    <RichTextEditor
                      label={`Chapter ${idx + 1}`}
                      value={ch.content || ''}
                      onChange={(html) => {
                        const next = [...bookForm.chapters];
                        next[idx] = { ...next[idx], content: html };
                        setBookForm({ ...bookForm, chapters: next });
                      }}
                      minHeight={200}
                    />
                  </div>
                ))}
              </div>

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-gray-950 font-black text-xs py-3 rounded-xl shadow cursor-pointer"
              >
                Save Book, Pricing &amp; Chapters
              </button>
            </form>

            <div className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3 max-h-[750px] overflow-y-auto">
              <h3 className="text-sm font-extrabold text-gray-900">
                All Marketplace Books ({data?.books?.length || 0})
              </h3>
              {(data?.books || []).map((bk) => (
                <div
                  key={bk.id}
                  className="p-3 rounded-xl border border-gray-100 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-extrabold text-gray-900">{bk.title}</p>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          Number(bk.price) > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {Number(bk.price) > 0 ? money(bk.price) : 'FREE'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500">
                      By {bk.author} &bull; {bk.chapters?.length || 0} ch &bull; Sales:{' '}
                      {bk.sales_count || 0} &bull; Views: {bk.views}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() =>
                        setBookForm({
                          ...bk,
                          price: bk.price ?? 0,
                          compare_price: bk.compare_price ?? 0,
                          free_preview_chapters: bk.free_preview_chapters ?? 1,
                          chapters: bk.chapters?.length
                            ? bk.chapters
                            : [{ title: 'Chapter 1', content: '' }],
                        })
                      }
                      className="text-xs font-bold text-purple-700 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBook(bk.id)}
                      className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 2: ADMIN VENDOR VERIFICATION MANAGER
           ================================================================ */}
        {activeTab === 'vendors' && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                  <i className="bi bi-patch-check-fill text-emerald-600" />
                  Admin Vendor Verification & Approval Center
                </h2>
                <p className="text-xs text-gray-500">
                  Verify vendors to grant the official "Verified Seller" badge on their store and product pages. Vendors receive an instant Push Notification when verified or updated.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase text-[10px]">
                    <th className="py-2.5 px-3">Store & Owner</th>
                    <th className="py-2.5 px-3">CAC / Reg No & ID Doc</th>
                    <th className="py-2.5 px-3">Current Status</th>
                    <th className="py-2.5 px-3">Admin Verification Note</th>
                    <th className="py-2.5 px-3 text-right">Verify / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(data?.vendors || []).map((v) => (
                    <tr key={v.id} className="hover:bg-gray-50">
                      <td className="py-3 px-3">
                        <div className="font-extrabold text-gray-900 flex items-center gap-1.5">
                          {v.store_name}
                          {v.is_verified && (
                            <i className="bi bi-patch-check-fill text-emerald-600" title="Verified Vendor" />
                          )}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {v.firstname} {v.lastname} (@{v.username}) &bull; {v.email}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-mono font-bold text-gray-800">
                          {v.business_reg_no || 'Not submitted yet'}
                        </div>
                        {v.id_doc_url && (
                          <a
                            href={v.id_doc_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-blue-600 hover:underline"
                          >
                            <i className="bi bi-file-earmark-check mr-1" />
                            View ID Document
                          </a>
                        )}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                            v.verification_status === 'verified'
                              ? 'bg-emerald-100 text-emerald-800'
                              : v.verification_status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : v.verification_status === 'rejected'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {v.verification_status || 'unverified'}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          placeholder={v.verification_note || 'Add note to vendor...'}
                          value={verifNotes[v.uid] ?? v.verification_note ?? ''}
                          onChange={(e) => setVerifNotes({ ...verifNotes, [v.uid]: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-gray-200 text-xs"
                        />
                      </td>
                      <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleVerifyVendor(v.uid, 'verified')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] cursor-pointer"
                        >
                          <i className="bi bi-check-circle-fill mr-1" />
                          Verify
                        </button>
                        <button
                          type="button"
                          onClick={() => handleVerifyVendor(v.uid, 'rejected')}
                          className="px-2.5 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-bold text-[11px] cursor-pointer"
                        >
                          Reject
                        </button>
                        {v.is_verified && (
                          <button
                            type="button"
                            onClick={() => handleVerifyVendor(v.uid, 'unverified')}
                            className="px-2.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-[11px] cursor-pointer"
                          >
                            Revoke
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 3: SUBDOMAIN STORES, 2-DAY GRACE & COMPANY WALLET CHARGES
           ================================================================ */}
        {activeTab === 'domains' && (
          <div className="space-y-6">
            {/* Global Subdomain Fee (NGN 500), 2-Day Grace & Company Charge % Settings */}
            <form
              onSubmit={handleSaveSettings}
              className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border-2 border-purple-200"
            >
              <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <i className="bi bi-globe2 text-purple-600" />
                    Subdomain Ownership Pricing, 2-Day Grace & Company Wallet Charges
                  </h2>
                  <p className="text-xs text-gray-500">
                    Configure the base NGN monthly fee (auto-converted to all currencies), the extra grace days before store closure, and the Company Wallet charge %.
                  </p>
                </div>
                <button
                  type="submit"
                  className="bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Save Domain & Charge Rules
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="bg-purple-50/50 p-3.5 rounded-xl border border-purple-100">
                  <label className="block font-extrabold text-gray-800 mb-1">
                    Monthly Subdomain Fee (NGN)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.subdomain_fee_ngn || 500}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, subdomain_fee_ngn: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white font-bold"
                  />
                  <span className="text-[10px] text-purple-700 mt-1 block">
                    Currently converts to {moneyFromNgn ? moneyFromNgn(settingsForm.subdomain_fee_ngn || 500) : '₦500'}/mo in active currency
                  </span>
                </div>

                <div className="bg-amber-50/50 p-3.5 rounded-xl border border-amber-100">
                  <label className="block font-extrabold text-gray-800 mb-1">
                    Due Extra Grace Period (Days)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.subdomain_grace_days || 2}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, subdomain_grace_days: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white font-bold"
                  />
                  <span className="text-[10px] text-amber-800 mt-1 block">
                    Days allowed after expiry before store auto-closes (reopens anytime upon payment)
                  </span>
                </div>

                <div className="bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
                  <label className="block font-extrabold text-gray-800 mb-1">
                    Company Wallet Charge (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={settingsForm.company_wallet_charge_pct || 2.5}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, company_wallet_charge_pct: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 bg-white font-bold"
                  />
                  <span className="text-[10px] text-emerald-800 mt-1 block">
                    Deducted when store owner selects Company Wallet mode (0% in Self-Managed mode)
                  </span>
                </div>
              </div>
            </form>

            {/* Vendor Subdomain Stores Table */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900 mb-3">
                Vendor Subdomain & Custom Domain Stores
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-500 uppercase text-[10px]">
                      <th className="py-2.5 px-3">Store / Owner</th>
                      <th className="py-2.5 px-3">Subdomain & Custom Domain</th>
                      <th className="py-2.5 px-3">Settlement Mode</th>
                      <th className="py-2.5 px-3">Expires / 2-Day Grace</th>
                      <th className="py-2.5 px-3">Store Status</th>
                      <th className="py-2.5 px-3 text-right">Admin Controls</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(data?.vendors || []).map((v) => (
                      <tr key={v.id} className="hover:bg-gray-50">
                        <td className="py-3 px-3">
                          <div className="font-bold text-gray-900">{v.store_name}</div>
                          <div className="text-[10px] text-gray-500">
                            @{v.username} &bull; Wallet: {money(v.wallet_balance || 0)}
                          </div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-mono font-bold text-purple-700">
                            {v.subdomain ? `${v.subdomain}.shoplenca.com` : '—'}
                          </div>
                          {v.custom_domain && (
                            <div className="text-[11px] text-blue-600 font-semibold">
                              <i className="bi bi-link-45deg" /> {v.custom_domain}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              v.payment_mode === 'self_managed'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {v.payment_mode === 'self_managed'
                              ? 'Self-Managed (0% Interference)'
                              : 'Company Wallet (DB Payout)'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-[11px]">
                          <div>Exp: {v.subscription_expires_at || '—'}</div>
                          <div className="text-gray-400">Grace: {v.grace_ends_at || '—'}</div>
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              v.domain_store_status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : v.domain_store_status === 'grace_period'
                                ? 'bg-amber-100 text-amber-800'
                                : v.domain_store_status === 'closed_overdue'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {v.domain_store_status || 'inactive'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleManageDomainStore(v.uid, 'active', v.payment_mode, 1)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] cursor-pointer"
                            title="Reopen & Extend +1 Month"
                          >
                            Reopen (+1M)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleManageDomainStore(v.uid, 'closed_overdue', v.payment_mode, 0)}
                            className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 font-bold text-[10px] cursor-pointer"
                          >
                            Close Store
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Database Wallet Settlements & Company Charges Ledger */}
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900 mb-1">
                Database Wallet Settlements & Company Charges Ledger
              </h3>
              <p className="text-xs text-gray-500 mb-4">
                Every vendor sale settled into the database wallet, showing Gross Sale, Company Charge deducted, and Net Vendor Payout.
              </p>
              {!data?.wallet_transactions || data.wallet_transactions.length === 0 ? (
                <p className="text-xs text-gray-400 py-4">No vendor wallet transactions recorded yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 uppercase text-[10px]">
                        <th className="py-2 px-2">Vendor / Store</th>
                        <th className="py-2 px-2">Order / Product</th>
                        <th className="py-2 px-2">Mode</th>
                        <th className="py-2 px-2">Gross</th>
                        <th className="py-2 px-2 text-red-600">Company Charge</th>
                        <th className="py-2 px-2 text-emerald-700">Net Credited (DB)</th>
                        <th className="py-2 px-2">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.wallet_transactions.map((wt) => (
                        <tr key={wt.id}>
                          <td className="py-2.5 px-2 font-bold">
                            {wt.store_name || wt.username || wt.vendor_uid}
                          </td>
                          <td className="py-2.5 px-2">
                            <div className="font-semibold">{wt.order_number || wt.tx_type}</div>
                            <div className="text-[10px] text-gray-500">{wt.product_name}</div>
                          </td>
                          <td className="py-2.5 px-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-gray-100">
                              {wt.payment_mode}
                            </span>
                          </td>
                          <td className="py-2.5 px-2 font-bold">{money(wt.gross_amount)}</td>
                          <td className="py-2.5 px-2 font-bold text-red-600">
                            {money(wt.company_charge_amount)} ({wt.company_charge_percent}%)
                          </td>
                          <td className="py-2.5 px-2 font-extrabold text-emerald-700">
                            {money(wt.net_vendor_amount)}
                          </td>
                          <td className="py-2.5 px-2 text-[10px] text-gray-400">{wt.created_at}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 4: PUSH NOTIFICATIONS BROADCAST MANAGER
           ================================================================ */}
        {activeTab === 'push' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSendPush}
              className="lg:col-span-5 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-3.5 h-fit"
            >
              <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                <i className="bi bi-broadcast text-amber-500" />
                Send Push Notification
              </h2>
              <p className="text-xs text-gray-500">
                Leave Target User empty to broadcast to all shoppers and vendors, or select a specific user.
              </p>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Target Recipient</label>
                <select
                  value={pushForm.target_uid}
                  onChange={(e) => setPushForm({ ...pushForm, target_uid: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold"
                >
                  <option value="">All Users (Global Broadcast)</option>
                  {(data?.users || []).map((u) => (
                    <option key={u.uid} value={u.uid}>
                      {u.firstname} {u.lastname} (@{u.username})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Notification Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Flash Sale Live! 50% Off + Own Your Subdomain Store"
                  value={pushForm.title}
                  onChange={(e) => setPushForm({ ...pushForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Message Body *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Write your push notification message..."
                  value={pushForm.message}
                  onChange={(e) => setPushForm({ ...pushForm, message: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Click Link URL</label>
                  <input
                    type="text"
                    value={pushForm.link}
                    onChange={(e) => setPushForm({ ...pushForm, link: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={pushForm.type}
                    onChange={(e) => setPushForm({ ...pushForm, type: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  >
                    <option value="promo">Promo / Deal</option>
                    <option value="domain">Subdomain Store</option>
                    <option value="verification">Verification</option>
                    <option value="order">Order Alert</option>
                    <option value="info">General Info</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:opacity-95 text-gray-950 font-extrabold text-xs py-3 rounded-xl shadow cursor-pointer"
              >
                <i className="bi bi-send-fill mr-1.5" />
                Send Push Notification Now
              </button>
            </form>

            <div className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
              <h3 className="text-base font-extrabold text-gray-900 mb-3">
                Recent Push Notifications ({data?.push_notifications?.length || 0})
              </h3>
              <div className="divide-y divide-gray-100 max-h-[540px] overflow-y-auto">
                {(data?.push_notifications || []).map((n) => (
                  <div key={n.id} className="py-3 flex items-start justify-between gap-3 text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-gray-900">{n.title}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 font-bold">
                          {n.target_uid ? `User: ${n.target_uid}` : 'Broadcast'}
                        </span>
                      </div>
                      <p className="text-gray-600 mt-0.5">{n.message}</p>
                      <span className="text-[10px] text-gray-400">{n.created_at}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeletePush(n.id)}
                      className="text-red-600 hover:underline font-bold text-[11px] shrink-0 cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 5: PAYMENT GATEWAYS & API KEYS
           ================================================================ */}
        {activeTab === 'gateways' && (
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-gray-900">
                  Payment Gateways & API Keys Manager
                </h2>
                <p className="text-xs text-gray-500">
                  Place your Public Key, Secret Key, Webhook Secret, and Merchant ID for each payment provider. Active gateways appear automatically on Checkout.
                </p>
              </div>
              <button
                onClick={() => setNewGwOpen(true)}
                className="bg-gray-900 hover:bg-amber-500 hover:text-gray-950 text-white font-bold text-xs px-4 py-2.5 rounded-xl shrink-0 transition flex items-center gap-2 cursor-pointer"
              >
                <i className="bi bi-plus-lg"></i>
                <span>Add Custom Gateway</span>
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {(data?.gateways || []).map((gw) => {
                const isActive = Boolean(gw.is_active);
                const showSecret = !!showSecrets[gw.id];

                return (
                  <div
                    key={gw.id}
                    className={`bg-white rounded-2xl p-5 shadow-sm border-2 transition ${
                      isActive ? 'border-emerald-200' : 'border-gray-100 opacity-80'
                    }`}
                  >
                    {/* Gateway Header */}
                    <div className="flex items-start justify-between gap-3 pb-4 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                            isActive ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-400'
                          }`}
                        >
                          <i className={`bi ${gw.icon || 'bi-credit-card'} text-base`}></i>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm font-extrabold text-gray-900">{gw.name}</h3>
                            <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {gw.code}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500">{gw.description}</p>
                        </div>
                      </div>

                      <label className="flex items-center gap-2 cursor-pointer shrink-0">
                        <input
                          type="checkbox"
                          checked={isActive}
                          onChange={(e) =>
                            updateGatewayField(gw.id, 'is_active', e.target.checked ? 1 : 0)
                          }
                          className="rounded text-emerald-600 focus:ring-emerald-500"
                        />
                        <span
                          className={`text-xs font-extrabold ${
                            isActive ? 'text-emerald-600' : 'text-gray-400'
                          }`}
                        >
                          {isActive ? 'Enabled' : 'Disabled'}
                        </span>
                      </label>
                    </div>

                    {/* API Key Inputs */}
                    <div className="space-y-3 pt-4 text-xs">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Environment Mode
                          </label>
                          <select
                            value={gw.mode || 'test'}
                            onChange={(e) => updateGatewayField(gw.id, 'mode', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-gray-50 font-bold"
                          >
                            <option value="test">Test / Sandbox Mode</option>
                            <option value="live">Live Production Mode</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-gray-700 mb-1">
                            Merchant / App ID
                          </label>
                          <input
                            type="text"
                            placeholder="Optional Merchant ID"
                            value={gw.merchant_id || ''}
                            onChange={(e) =>
                              updateGatewayField(gw.id, 'merchant_id', e.target.value)
                            }
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono text-[11px]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Public / Publishable Key / Client ID
                        </label>
                        <input
                          type="text"
                          placeholder={`Enter ${gw.name} Public API Key (e.g. pk_live_...)`}
                          value={gw.public_key || ''}
                          onChange={(e) => updateGatewayField(gw.id, 'public_key', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-[11px] font-bold text-gray-700">
                            Secret / Private API Key
                          </label>
                          <button
                            type="button"
                            onClick={() =>
                              setShowSecrets({ ...showSecrets, [gw.id]: !showSecret })
                            }
                            className="text-[10px] font-bold text-amber-600 hover:underline cursor-pointer"
                          >
                            {showSecret ? 'Hide Secret' : 'Show Secret'}
                          </button>
                        </div>
                        <input
                          type={showSecret ? 'text' : 'password'}
                          placeholder={`Enter ${gw.name} Secret API Key (e.g. sk_live_...)`}
                          value={gw.secret_key || ''}
                          onChange={(e) => updateGatewayField(gw.id, 'secret_key', e.target.value)}
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono text-[11px]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Webhook Secret / Encryption Key
                        </label>
                        <input
                          type={showSecret ? 'text' : 'password'}
                          placeholder="whsec_... or FLWSECK_..."
                          value={gw.webhook_secret || ''}
                          onChange={(e) =>
                            updateGatewayField(gw.id, 'webhook_secret', e.target.value)
                          }
                          className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono text-[11px]"
                        />
                      </div>

                      {/* Special Extra Fields for Bank Transfer & Crypto */}
                      {gw.code === 'bank_transfer' && (
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                          <p className="text-[11px] font-extrabold text-gray-800">
                            Bank Account Details
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                            <input
                              type="text"
                              placeholder="Bank Name"
                              value={gw.extra?.bank_name || ''}
                              onChange={(e) =>
                                updateGatewayExtra(gw.id, 'bank_name', e.target.value)
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Account Name"
                              value={gw.extra?.account_name || ''}
                              onChange={(e) =>
                                updateGatewayExtra(gw.id, 'account_name', e.target.value)
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Account Number"
                              value={gw.extra?.account_number || ''}
                              onChange={(e) =>
                                updateGatewayExtra(gw.id, 'account_number', e.target.value)
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-mono"
                            />
                          </div>
                        </div>
                      )}

                      {gw.code === 'crypto_usdt' && (
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 space-y-2">
                          <p className="text-[11px] font-extrabold text-gray-800">
                            Crypto Wallet Settings
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            <input
                              type="text"
                              placeholder="Network (e.g. USDT TRC20)"
                              value={gw.extra?.network || ''}
                              onChange={(e) => updateGatewayExtra(gw.id, 'network', e.target.value)}
                              className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs"
                            />
                            <input
                              type="text"
                              placeholder="Wallet Address"
                              value={gw.extra?.wallet_address || ''}
                              onChange={(e) =>
                                updateGatewayExtra(gw.id, 'wallet_address', e.target.value)
                              }
                              className="px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white text-xs font-mono"
                            />
                          </div>
                        </div>
                      )}

                      <div className="pt-2 flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSaveGateway(gw)}
                          className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold text-xs px-5 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                        >
                          <i className="bi bi-check2-circle"></i>
                          <span>Save {gw.name} Keys</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 6: ORDERS & ESCROW SEAL VERIFICATION / FUND RELEASE
           ================================================================ */}
        {activeTab === 'orders' && (
          <div className="space-y-5">
            {/* Escrow Policy Summary Banner */}
            <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border border-amber-500/30">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-amber-500 text-gray-950 flex items-center justify-center shrink-0">
                  <i className="bi bi-shield-lock-fill text-xl" />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-400/30">
                    Buyer-Sealed Escrow Verification Protocol
                  </span>
                  <h2 className="text-sm sm:text-base font-black mt-1">
                    Order Seal & Vendor Wallet Fund Release Desk
                  </h2>
                  <p className="text-xs text-gray-300 mt-0.5">
                    Vendor funds remain locked in Escrow until the customer confirms both{' '}
                    <strong>&ldquo;I have received the products&rdquo;</strong> and{' '}
                    <strong>&ldquo;I have received the products and is in good condition&rdquo;</strong>.
                    Once sealed, click <strong>Verify &amp; Release Funds</strong> below to credit the vendor wallet.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-white/10 rounded-xl px-3.5 py-2 text-center border border-white/10">
                  <p className="text-[10px] uppercase text-amber-300 font-bold">Sealed &amp; Awaiting Release</p>
                  <p className="text-lg font-black text-white">
                    {(data?.orders || []).filter((o) => Boolean(Number(o.is_sealed)) && !Boolean(Number(o.admin_funds_released))).length}
                  </p>
                </div>
                <div className="bg-emerald-500/20 rounded-xl px-3.5 py-2 text-center border border-emerald-400/30">
                  <p className="text-[10px] uppercase text-emerald-300 font-bold">Funds Released</p>
                  <p className="text-lg font-black text-emerald-300">
                    {(data?.orders || []).filter((o) => Boolean(Number(o.admin_funds_released))).length}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
              <h2 className="text-base font-extrabold text-gray-900 mb-4">
                Customer Orders &amp; Escrow Seal Status ({data?.orders?.length || 0})
              </h2>
              {!data?.orders || data.orders.length === 0 ? (
                <p className="text-xs text-gray-500">No orders placed yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-gray-200 text-gray-500 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Order #</th>
                        <th className="py-2.5 px-3">Customer</th>
                        <th className="py-2.5 px-3">Total &amp; Gateway</th>
                        <th className="py-2.5 px-3">Payment / Delivery</th>
                        <th className="py-2.5 px-3">Buyer Checkboxes &amp; Seal</th>
                        <th className="py-2.5 px-3">Admin Escrow Fund Release</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {data.orders.map((ord) => {
                        const isSealed = Boolean(Number(ord.is_sealed));
                        const fundsReleased = Boolean(Number(ord.admin_funds_released));
                        const buyerRec = Boolean(Number(ord.buyer_received));
                        const buyerGood = Boolean(Number(ord.buyer_good_condition));
                        return (
                          <tr key={ord.id} className={isSealed && !fundsReleased ? 'bg-amber-50/40' : ''}>
                            <td className="py-3 px-3">
                              <p className="font-extrabold text-gray-900">{ord.order_number}</p>
                              <p className="text-[10px] text-gray-400">{ord.created_at}</p>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-bold text-gray-800">{ord.full_name}</p>
                              <p className="text-[11px] text-gray-400">{ord.email}</p>
                            </td>
                            <td className="py-3 px-3">
                              <p className="font-extrabold text-gray-900">{money(ord.total_amount)}</p>
                              <p className="text-[10px] uppercase font-bold text-amber-700">
                                {ord.payment_gateway_name || ord.payment_method}
                              </p>
                            </td>
                            <td className="py-3 px-3 space-y-1.5">
                              <select
                                value={ord.payment_status}
                                onChange={(e) =>
                                  handleUpdateOrder(ord.id, ord.order_status, e.target.value)
                                }
                                className="block w-full border border-gray-200 rounded-lg px-2 py-1 text-[11px] font-semibold"
                              >
                                <option value="pending">Pay: Pending</option>
                                <option value="paid">Pay: Paid</option>
                                <option value="failed">Pay: Failed</option>
                                <option value="refunded">Pay: Refunded</option>
                              </select>
                              <select
                                value={ord.order_status}
                                onChange={(e) =>
                                  handleUpdateOrder(ord.id, e.target.value, ord.payment_status)
                                }
                                className="block w-full border border-gray-200 rounded-lg px-2 py-1 text-[11px] font-semibold"
                              >
                                <option value="pending">Ship: Pending</option>
                                <option value="processing">Ship: Processing</option>
                                <option value="shipped">Ship: Shipped</option>
                                <option value="delivered">Ship: Delivered</option>
                                <option value="cancelled">Ship: Cancelled</option>
                              </select>
                            </td>
                            <td className="py-3 px-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <i
                                    className={`bi ${
                                      buyerRec
                                        ? 'bi-check-circle-fill text-emerald-600'
                                        : 'bi-circle text-gray-300'
                                    }`}
                                  />
                                  <span className={buyerRec ? 'font-bold text-gray-800' : 'text-gray-400'}>
                                    1. Product Received
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <i
                                    className={`bi ${
                                      buyerGood
                                        ? 'bi-check-circle-fill text-emerald-600'
                                        : 'bi-circle text-gray-300'
                                    }`}
                                  />
                                  <span className={buyerGood ? 'font-bold text-gray-800' : 'text-gray-400'}>
                                    2. Good Condition
                                  </span>
                                </div>
                                {isSealed ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    <i className="bi bi-patch-check-fill" /> Product Sealed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                    <i className="bi bi-hourglass-split" /> Awaiting Buyer Seal
                                  </span>
                                )}
                                {ord.buyer_condition_note && (
                                  <p className="text-[10px] italic text-gray-500 max-w-[180px] truncate">
                                    &ldquo;{ord.buyer_condition_note}&rdquo;
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              {fundsReleased ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-600 text-white text-[11px] font-black">
                                    <i className="bi bi-check2-all" /> Funds Released to Vendor
                                  </span>
                                  {ord.funds_released_at && (
                                    <p className="text-[10px] text-gray-400">{ord.funds_released_at}</p>
                                  )}
                                </div>
                              ) : isSealed ? (
                                <button
                                  type="button"
                                  onClick={() => handleReleaseOrderFunds(ord.id)}
                                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] px-3.5 py-2 rounded-xl shadow-sm transition flex items-center gap-1.5 cursor-pointer"
                                >
                                  <i className="bi bi-unlock-fill" />
                                  <span>Verify &amp; Release Funds to Vendor</span>
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  disabled
                                  title="Locked until customer confirms receipt and good condition"
                                  className="bg-gray-100 text-gray-400 font-bold text-[11px] px-3 py-2 rounded-xl border border-gray-200 flex items-center gap-1.5 cursor-not-allowed"
                                >
                                  <i className="bi bi-lock-fill" />
                                  <span>Locked (Wait for Buyer Seal)</span>
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 7: PRODUCTS (WITH MULTI-IMAGE UPLOAD & RICH TEXT EDITOR)
           ================================================================ */}
        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-extrabold text-gray-900">
                  Store Products ({data?.products?.length || 0})
                </h2>
                <p className="text-xs text-gray-500">
                  Supports multiple product image uploads, gallery ordering, and rich HTML specifications.
                </p>
              </div>
              <button
                onClick={() => {
                  setProdForm({
                    id: 0,
                    product_name: '',
                    price: 49.99,
                    off_price: 10,
                    instock: 30,
                    product_category_id: data?.categories?.[0]?.id || 1,
                    product_sub_category_id: '',
                    brand_category_id: '',
                    image: '',
                    images: [],
                    description: '',
                  });
                  setNewImageUrl('');
                  setProdModal(true);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 cursor-pointer"
              >
                <i className="bi bi-plus-lg"></i>
                <span>Add New Product</span>
              </button>
            </div>

            <div className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
              {(data?.products || []).map((p) => {
                let galleryList = [];
                try {
                  const spec =
                    typeof p.specification === 'string'
                      ? JSON.parse(p.specification || '{}')
                      : p.specification || {};
                  if (Array.isArray(spec.images) && spec.images.length > 0) {
                    galleryList = spec.images;
                  } else if (p.image) {
                    galleryList = [p.image];
                  }
                } catch {
                  if (p.image) galleryList = [p.image];
                }
                return (
                  <div key={p.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={p.image}
                        alt={p.product_name}
                        className="w-12 h-12 rounded-lg object-cover border shrink-0"
                      />
                      <div className="min-w-0">
                        <Link
                          to={`/product?slug=${encodeURIComponent(p.slug)}`}
                          className="text-xs font-extrabold text-gray-900 hover:text-amber-600 truncate block"
                        >
                          {p.product_name}
                        </Link>
                        <p className="text-[11px] text-gray-500">
                          {p.category_name} &bull; {money(p.final_price || p.price)} &bull; Stock:{' '}
                          {p.instock} &bull;{' '}
                          <span className="text-amber-700 font-bold">
                            <i className="bi bi-images mr-1" />
                            {galleryList.length} Photo{galleryList.length === 1 ? '' : 's'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => {
                          setProdForm({
                            ...p,
                            images: galleryList,
                          });
                          setNewImageUrl('');
                          setProdModal(true);
                        }}
                        className="text-xs font-bold text-amber-600 hover:underline px-2 py-1 cursor-pointer"
                      >
                        Edit Photos &amp; Details
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(p.id)}
                        className="text-xs font-bold text-red-600 hover:underline px-2 py-1 cursor-pointer"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 8: CATEGORIES
           ================================================================ */}
        {activeTab === 'categories' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveCategory}
              className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3 h-fit"
            >
              <h3 className="text-sm font-extrabold text-gray-900">
                {catForm.id ? 'Edit Category' : 'Add Category'}
              </h3>
              <input
                type="text"
                required
                placeholder="Category Name"
                value={catForm.name}
                onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
              />
              <input
                type="text"
                placeholder="Image URL"
                value={catForm.image || ''}
                onChange={(e) => setCatForm({ ...catForm, image: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
              />
              <textarea
                rows={2}
                placeholder="Description"
                value={catForm.description || ''}
                onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
              />
              <button
                type="submit"
                className="w-full bg-amber-500 text-gray-950 font-extrabold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                Save Category
              </button>
            </form>

            <div className="lg:col-span-8 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-extrabold text-gray-900 mb-3">
                Categories ({data?.categories?.length || 0})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto">
                {(data?.categories || []).map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl border border-gray-100 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <i className="bi bi-folder-fill text-amber-500"></i>
                      <span className="text-xs font-bold text-gray-800">{c.name}</span>
                    </div>
                    <button
                      onClick={() => setCatForm(c)}
                      className="text-[11px] font-bold text-amber-600 hover:underline cursor-pointer"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 9: HOMEPAGE INVENTORY ORDERING & PROMO ADS MANAGER
           ================================================================ */}
        {activeTab === 'inventories' && (
          <div className="space-y-6">
            {/* Section 1: Homepage Inventory Ordering & Creation */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleSaveInventory}
                className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3 h-fit"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-gray-900">
                    {invForm.id ? 'Edit Inventory Section' : 'Create Homepage Inventory'}
                  </h3>
                  {invForm.id > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setInvForm({
                          id: 0,
                          name: '',
                          description: '',
                          style_type: 0,
                          inv_position: 1,
                          show_ads_next: 1,
                        })
                      }
                      className="text-[11px] text-gray-500 hover:underline cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>
                <input
                  type="text"
                  required
                  placeholder="Section Name (e.g. Flash Sales)"
                  value={invForm.name}
                  onChange={(e) => setInvForm({ ...invForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="Subtitle / Description"
                  value={invForm.description || ''}
                  onChange={(e) => setInvForm({ ...invForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Layout Style
                    </label>
                    <select
                      value={invForm.style_type}
                      onChange={(e) => setInvForm({ ...invForm, style_type: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold"
                    >
                      <option value={0}>Best-Seller Grid</option>
                      <option value={1}>Flash Deal Red Header</option>
                      <option value={2}>Horizontal Carousel</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Priority Order (#1 = First)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={invForm.inv_position ?? 1}
                      onChange={(e) =>
                        setInvForm({ ...invForm, inv_position: Number(e.target.value) })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-extrabold"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={Boolean(invForm.show_ads_next)}
                    onChange={(e) =>
                      setInvForm({ ...invForm, show_ads_next: e.target.checked ? 1 : 0 })
                    }
                    className="rounded text-amber-500"
                  />
                  <span>Inject Promo / AdSense Banner Immediately After This Section</span>
                </label>
                <button
                  type="submit"
                  className="w-full bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold text-xs py-2.5 rounded-xl cursor-pointer"
                >
                  {invForm.id ? 'Update Inventory Section' : 'Save Inventory Section'}
                </button>
              </form>

              <div className="lg:col-span-8 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900">
                      Homepage Inventory Sequence (Controls Which Section Comes First)
                    </h3>
                    <p className="text-xs text-gray-500">
                      Use the Move Up (&uarr;) and Move Down (&darr;) buttons to set which product inventory appears first on the homepage.
                    </p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  {(data?.inventories || []).map((inv, idx) => (
                    <div
                      key={inv.id}
                      className="p-3.5 rounded-xl border border-gray-100 hover:border-amber-300 bg-gray-50/60 flex flex-wrap items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-xl bg-gray-900 text-amber-400 font-black text-xs flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-xs font-extrabold text-gray-900">{inv.name}</p>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                              Pos: {inv.inv_position}
                            </span>
                            {Number(inv.show_ads_next) === 1 && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                                + Ad Slot After
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500">{inv.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleReorderInventory(inv.id, 'up')}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-amber-50 text-xs font-black text-gray-700 cursor-pointer"
                          title="Move Section Higher"
                        >
                          <i className="bi bi-arrow-up" /> Move Up
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorderInventory(inv.id, 'down')}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 hover:bg-amber-50 text-xs font-black text-gray-700 cursor-pointer"
                          title="Move Section Lower"
                        >
                          <i className="bi bi-arrow-down" /> Move Down
                        </button>
                        <button
                          type="button"
                          onClick={() => setInvForm(inv)}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/15 text-amber-800 font-bold text-xs hover:bg-amber-500/25 cursor-pointer"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2: Homepage Promo Banner Ads Manager */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleSavePromoAd}
                className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3 h-fit"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <i className="bi bi-megaphone-fill text-amber-500" />
                    <span>{promoAdForm.id ? 'Edit Homepage Promo Ad' : 'Add Homepage Promo Banner Ad'}</span>
                  </h3>
                  {promoAdForm.id > 0 && (
                    <button
                      type="button"
                      onClick={() =>
                        setPromoAdForm({
                          id: 0,
                          title: '',
                          subtitle: '',
                          badge_text: 'SPONSORED',
                          cta_text: 'Shop Now',
                          cta_link: '/category',
                          image_url: '',
                          bg_gradient: 'from-amber-500 via-orange-600 to-red-600',
                          placement: 'after_first_inv',
                          sort_order: 1,
                          is_active: 1,
                        })
                      }
                      className="text-[11px] text-gray-500 hover:underline cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    required
                    placeholder="Banner Headline *"
                    value={promoAdForm.title}
                    onChange={(e) => setPromoAdForm({ ...promoAdForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold"
                  />
                  <input
                    type="text"
                    placeholder="Badge (e.g. MEGA DEAL)"
                    value={promoAdForm.badge_text}
                    onChange={(e) => setPromoAdForm({ ...promoAdForm, badge_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Subtitle / Offer Description"
                  value={promoAdForm.subtitle || ''}
                  onChange={(e) => setPromoAdForm({ ...promoAdForm, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="CTA Button Text"
                    value={promoAdForm.cta_text || ''}
                    onChange={(e) => setPromoAdForm({ ...promoAdForm, cta_text: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Target Link (e.g. /category)"
                    value={promoAdForm.cta_link || ''}
                    onChange={(e) => setPromoAdForm({ ...promoAdForm, cta_link: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Optional Banner Image URL"
                  value={promoAdForm.image_url || ''}
                  onChange={(e) => setPromoAdForm({ ...promoAdForm, image_url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Homepage Placement Slot
                    </label>
                    <select
                      value={promoAdForm.placement}
                      onChange={(e) =>
                        setPromoAdForm({ ...promoAdForm, placement: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold"
                    >
                      <option value="hero_top">Hero Top Spotlight</option>
                      <option value="after_first_inv">After 1st Inventory</option>
                      <option value="mid_page">Mid-Page Interstitial</option>
                      <option value="bottom_banner">Bottom Homepage Banner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">
                      Color Theme
                    </label>
                    <select
                      value={promoAdForm.bg_gradient}
                      onChange={(e) =>
                        setPromoAdForm({ ...promoAdForm, bg_gradient: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold"
                    >
                      <option value="from-amber-500 via-orange-600 to-red-600">
                        Amber Sunset
                      </option>
                      <option value="from-gray-900 via-indigo-950 to-gray-900">
                        Midnight Luxury
                      </option>
                      <option value="from-emerald-700 via-teal-800 to-gray-900">
                        Emerald Vault
                      </option>
                      <option value="from-purple-800 via-fuchsia-800 to-rose-700">
                        Royal Velvet
                      </option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full bg-gray-900 hover:bg-gray-800 text-amber-400 font-extrabold text-xs py-2.5 rounded-xl cursor-pointer"
                >
                  {promoAdForm.id ? 'Update Promo Ad Banner' : 'Publish Promo Ad Banner'}
                </button>
              </form>

              <div className="lg:col-span-7 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3">
                <h3 className="text-sm font-extrabold text-gray-900">
                  Active Homepage Promotional Banners ({data?.home_promo_ads?.length || 0})
                </h3>
                <div className="space-y-3 max-h-[420px] overflow-y-auto">
                  {(data?.home_promo_ads || []).map((ad) => (
                    <div
                      key={ad.id}
                      className={`rounded-2xl p-4 bg-gradient-to-r ${
                        ad.bg_gradient || 'from-gray-900 to-gray-800'
                      } text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-black/30 text-amber-300">
                            {ad.badge_text}
                          </span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white/15">
                            Slot: {ad.placement}
                          </span>
                        </div>
                        <p className="text-sm font-black mt-1">{ad.title}</p>
                        <p className="text-xs text-white/80">{ad.subtitle}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPromoAdForm(ad)}
                          className="px-3 py-1.5 rounded-xl bg-white text-gray-900 font-extrabold text-xs cursor-pointer"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePromoAd(ad.id)}
                          className="px-3 py-1.5 rounded-xl bg-red-600 text-white font-extrabold text-xs cursor-pointer"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 10: PERSONAL STORE GIFT CARDS MANAGER
           ================================================================ */}
        {activeTab === 'giftcards' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleCreateAdminGiftCard}
              className="lg:col-span-4 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3.5 h-fit"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-gray-950 flex items-center justify-center font-black">
                  <i className="bi bi-gift-fill text-lg" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900">
                    Issue Official Store Gift Card
                  </h3>
                  <p className="text-[11px] text-gray-500">
                    Redeemable 1-click directly into Member Wallet
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Card Title / Occasion
                </label>
                <input
                  type="text"
                  required
                  value={adminGiftForm.title}
                  onChange={(e) => setAdminGiftForm({ ...adminGiftForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Amount (USD Base $)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    value={adminGiftForm.amount_usd}
                    onChange={(e) =>
                      setAdminGiftForm({ ...adminGiftForm, amount_usd: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-extrabold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    Custom Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto-generated if blank"
                    value={adminGiftForm.custom_code}
                    onChange={(e) =>
                      setAdminGiftForm({
                        ...adminGiftForm,
                        custom_code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <input
                  type="email"
                  placeholder="Recipient Email (Optional)"
                  value={adminGiftForm.recipient_email}
                  onChange={(e) =>
                    setAdminGiftForm({ ...adminGiftForm, recipient_email: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
                <select
                  value={adminGiftForm.card_theme}
                  onChange={(e) =>
                    setAdminGiftForm({ ...adminGiftForm, card_theme: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-semibold"
                >
                  <option value="gold">Royal Gold</option>
                  <option value="emerald">Emerald Cash</option>
                  <option value="obsidian">Obsidian VIP</option>
                  <option value="royal">Purple Platinum</option>
                </select>
              </div>

              <textarea
                rows={2}
                placeholder="Personal Message on Gift Card"
                value={adminGiftForm.message}
                onChange={(e) => setAdminGiftForm({ ...adminGiftForm, message: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
              />

              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-gray-950 font-black text-xs py-2.5 rounded-xl shadow-sm cursor-pointer"
              >
                <i className="bi bi-magic mr-1.5" />
                Generate Gift Card Code
              </button>
            </form>

            <div className="lg:col-span-8 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="text-sm font-extrabold text-gray-900 mb-3">
                All Personal Store Gift Cards ({data?.gift_cards?.length || 0})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 max-h-[560px] overflow-y-auto">
                {(data?.gift_cards || []).map((gc) => (
                  <div
                    key={gc.id}
                    className="rounded-2xl p-4 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-950 text-white border border-amber-500/30 flex flex-col justify-between gap-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            gc.status === 'active'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                              : 'bg-gray-700 text-gray-300'
                          }`}
                        >
                          {gc.status === 'active' ? 'ACTIVE - READY TO REDEEM' : 'REDEEMED'}
                        </span>
                        <h4 className="text-xs font-extrabold mt-1.5 text-amber-300">{gc.title}</h4>
                        <p className="text-[11px] text-gray-300 line-clamp-1">{gc.message}</p>
                      </div>
                      <p className="text-lg font-black text-white">{money(gc.amount_usd)}</p>
                    </div>

                    <div className="bg-black/40 rounded-xl px-3 py-2 flex items-center justify-between border border-white/10">
                      <code className="text-xs font-mono font-black tracking-wider text-amber-400">
                        {gc.code}
                      </code>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(gc.code);
                            notify(`Copied Gift Card Code: ${gc.code}`, 'info');
                          }}
                          className="text-[11px] font-bold text-gray-300 hover:text-white cursor-pointer"
                        >
                          <i className="bi bi-clipboard" /> Copy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGiftCard(gc.id)}
                          className="text-[11px] font-bold text-red-400 hover:text-red-300 cursor-pointer"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 11: USERS & ROLES
           ================================================================ */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
            <h2 className="text-base font-extrabold text-gray-900 mb-4">
              Registered Users & Vendors ({data?.users?.length || 0})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-500 uppercase text-[10px]">
                    <th className="py-2.5 px-3">User</th>
                    <th className="py-2.5 px-3">Email</th>
                    <th className="py-2.5 px-3">Wallet Balance</th>
                    <th className="py-2.5 px-3">Vendor Status</th>
                    <th className="py-2.5 px-3">Verified Seller Badge</th>
                    <th className="py-2.5 px-3">Admin Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(data?.users || []).map((u) => {
                    const uAdmin = Boolean(u.is_admin);
                    const uVendor = Boolean(u.is_vendor);
                    return (
                      <tr key={u.id}>
                        <td className="py-3 px-3 font-bold text-gray-900">
                          {u.firstname} {u.lastname} (@{u.username})
                        </td>
                        <td className="py-3 px-3 text-gray-600">{u.email}</td>
                        <td className="py-3 px-3 font-extrabold text-emerald-700">
                          {money(u.wallet_balance || 0)}
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() =>
                              handleUpdateUserRole(u, uAdmin ? 1 : 0, uVendor ? 0 : 1)
                            }
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                              uVendor
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {uVendor ? 'Vendor (Click to Revoke)' : 'Make Vendor'}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() =>
                              handleVerifyVendor(
                                u.uid,
                                u.vendor_verified ? 'unverified' : 'verified'
                              )
                            }
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                              u.vendor_verified
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-emerald-50'
                            }`}
                          >
                            {u.vendor_verified ? (
                              <>
                                <i className="bi bi-patch-check-fill mr-1" /> Verified Seller
                              </>
                            ) : (
                              'Click to Verify Vendor'
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3">
                          <button
                            onClick={() =>
                              handleUpdateUserRole(u, uAdmin ? 0 : 1, uVendor ? 1 : 0)
                            }
                            className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                              uAdmin ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {uAdmin ? 'Admin' : 'Standard'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 12: RICH BLOG STUDIO (WITH RICH TEXT EDITOR)
           ================================================================ */}
        {activeTab === 'blogs' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <form
              onSubmit={handleSaveBlog}
              className="lg:col-span-7 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3 h-fit"
            >
              <h3 className="text-sm font-extrabold text-gray-900">
                Publish / Edit Blog Article in Rich Studio
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  placeholder="Article Title *"
                  value={blogForm.title}
                  onChange={(e) => setBlogForm({ ...blogForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold"
                />
                <input
                  type="text"
                  placeholder="Category"
                  value={blogForm.category}
                  onChange={(e) => setBlogForm({ ...blogForm, category: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>
              <input
                type="text"
                placeholder="Cover Image URL"
                value={blogForm.image || ''}
                onChange={(e) => setBlogForm({ ...blogForm, image: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
              />
              <RichTextEditor
                label="Article Body Content"
                value={blogForm.content || ''}
                onChange={(html) => setBlogForm({ ...blogForm, content: html })}
                placeholder="Write your blog post with rich headings, images, quotes, and links..."
                minHeight={240}
              />
              <button
                type="submit"
                className="w-full bg-amber-500 text-gray-950 font-extrabold text-xs py-2.5 rounded-xl cursor-pointer"
              >
                Save & Publish Blog Article
              </button>
            </form>

            <div className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3 max-h-[600px] overflow-y-auto">
              <h3 className="text-sm font-extrabold text-gray-900">
                Published Blog Posts ({data?.blogs?.length || 0})
              </h3>
              {(data?.blogs || []).map((b) => (
                <div
                  key={b.id}
                  className="p-3 rounded-xl border border-gray-100 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-gray-900">{b.title}</p>
                    <p className="text-[11px] text-gray-400">
                      {b.category} &bull; {b.published_at}
                    </p>
                  </div>
                  <button
                    onClick={() => setBlogForm(b)}
                    className="text-xs font-bold text-amber-600 cursor-pointer"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================================================================
            TAB 13: COMPANY INFO, EXCHANGE RATES & STATIC PAGES
           ================================================================ */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Full Company Information Form */}
              <form
                onSubmit={handleSaveSettings}
                className="lg:col-span-7 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 space-y-3.5"
              >
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h3 className="text-base font-extrabold text-gray-900">
                      Company Information &amp; Corporate Profile
                    </h3>
                    <p className="text-xs text-gray-500">
                      Displayed across the storefront header, footer, contact pages, and buyer receipts.
                    </p>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                    Global Store Identity
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Company / Store Name
                    </label>
                    <input
                      type="text"
                      value={settingsForm.company_name || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, company_name: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Store Tagline / Title
                    </label>
                    <input
                      type="text"
                      value={settingsForm.company_title || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, company_title: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                </div>

                {/* Company Logo Manager */}
                <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-amber-950">
                      Company Logo (Used on Small Screens &amp; Header/SEO)
                    </label>
                    <span className="text-[10px] text-amber-700 font-medium">PNG, JPG, SVG, WebP</span>
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    {settingsForm.company_logo ? (
                      <div className="relative group shrink-0">
                        <img
                          src={settingsForm.company_logo}
                          alt="Logo Preview"
                          className="h-10 w-24 object-contain bg-white rounded-lg p-1 border border-gray-200 shadow-sm"
                          onError={(e) => { e.currentTarget.src = '/logo.png'; }}
                        />
                        <button
                          type="button"
                          onClick={() => setSettingsForm({ ...settingsForm, company_logo: '' })}
                          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center hover:bg-red-700 shadow"
                          title="Remove Logo"
                        >
                          <i className="bi bi-x" />
                        </button>
                      </div>
                    ) : (
                      <div className="h-10 w-24 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs shrink-0 bg-white">
                        <i className="bi bi-image text-lg" />
                      </div>
                    )}
                    <div className="flex-1 w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <input
                        type="text"
                        placeholder="Or enter logo URL (e.g. /logo.png or https://...)"
                        value={settingsForm.company_logo || ''}
                        onChange={(e) =>
                          setSettingsForm({ ...settingsForm, company_logo: e.target.value })
                        }
                        className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs bg-white"
                      />
                      <label className="shrink-0 px-3 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-bold text-xs cursor-pointer text-center transition flex items-center justify-center gap-1.5">
                        <i className={`bi ${uploadingCompanyLogo ? 'bi-arrow-repeat animate-spin' : 'bi-cloud-arrow-up-fill'}`} />
                        <span>{uploadingCompanyLogo ? 'Uploading...' : 'Upload Logo'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleUploadCompanyLogo}
                          disabled={uploadingCompanyLogo}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Support Email
                    </label>
                    <input
                      type="email"
                      value={settingsForm.company_email || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, company_email: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Hotline / Phone
                    </label>
                    <input
                      type="text"
                      value={settingsForm.company_phone || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, company_phone: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      WhatsApp Number
                    </label>
                    <input
                      type="text"
                      value={settingsForm.company_whatsapp || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, company_whatsapp: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Headquarters Address
                    </label>
                    <input
                      type="text"
                      value={settingsForm.company_address || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, company_address: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Working Hours
                    </label>
                    <input
                      type="text"
                      value={settingsForm.company_working_hours || ''}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          company_working_hours: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Company Mission Statement
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.company_mission || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, company_mission: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      Company Vision Statement
                    </label>
                    <textarea
                      rows={2}
                      value={settingsForm.company_vision || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, company_vision: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Founded Year
                    </label>
                    <input
                      type="text"
                      value={settingsForm.company_founded || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, company_founded: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      RC / Reg Number
                    </label>
                    <input
                      type="text"
                      value={settingsForm.company_rc_number || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, company_rc_number: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Shipping Fee ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={settingsForm.shipping_fee || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, shipping_fee: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      Free Ship Min ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={settingsForm.free_ship_min || ''}
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, free_ship_min: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <input
                    type="text"
                    placeholder="Facebook URL"
                    value={settingsForm.facebook_url || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, facebook_url: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Instagram URL"
                    value={settingsForm.instagram_url || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, instagram_url: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="Twitter / X URL"
                    value={settingsForm.twitter_url || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, twitter_url: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                  <input
                    type="text"
                    placeholder="YouTube URL"
                    value={settingsForm.youtube_url || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, youtube_url: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Escrow Buyer Protection Policy Notice
                  </label>
                  <textarea
                    rows={2}
                    value={settingsForm.escrow_policy_text || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, escrow_policy_text: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Footer Copyright Notice
                  </label>
                  <input
                    type="text"
                    value={settingsForm.footer_copyright || ''}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, footer_copyright: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold text-xs px-6 py-2.5 rounded-xl cursor-pointer"
                >
                  Save All Company Information
                </button>
              </form>

              {/* Official Company Currency Exchange Rates Manager */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3.5">
                  <h3 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
                    <i className="bi bi-currency-exchange text-amber-500" />
                    <span>Official Company Currency Exchange Rates</span>
                  </h3>
                  <p className="text-xs text-gray-500">
                    Rates configured here are shown live in the Member Exchange Rate Desk and power multi-currency prices across the store (1 USD Base).
                  </p>

                  <form onSubmit={handleSaveCurrency} className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <input
                      type="text"
                      required
                      placeholder="Code (NGN)"
                      value={curForm.code}
                      onChange={(e) =>
                        setCurForm({ ...curForm, code: e.target.value.toUpperCase() })
                      }
                      className="px-2.5 py-2 rounded-xl border border-gray-200 font-bold uppercase"
                    />
                    <input
                      type="text"
                      required
                      placeholder="Symbol (₦)"
                      value={curForm.symbol}
                      onChange={(e) => setCurForm({ ...curForm, symbol: e.target.value })}
                      className="px-2.5 py-2 rounded-xl border border-gray-200 font-bold"
                    />
                    <input
                      type="number"
                      step="0.0001"
                      required
                      placeholder="Rate vs $1"
                      value={curForm.exchange_rate}
                      onChange={(e) => setCurForm({ ...curForm, exchange_rate: e.target.value })}
                      className="px-2.5 py-2 rounded-xl border border-gray-200 font-mono"
                    />
                    <button
                      type="submit"
                      className="bg-gray-900 text-amber-400 font-extrabold rounded-xl px-3 py-2 cursor-pointer"
                    >
                      {curForm.id ? 'Update' : 'Add Rate'}
                    </button>
                  </form>

                  <div className="divide-y divide-gray-100 max-h-56 overflow-y-auto">
                    {(data?.currencies || []).map((c) => (
                      <div key={c.id} className="py-2 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-black text-gray-900">
                            {c.code} ({c.symbol})
                          </span>{' '}
                          <span className="text-gray-500">{c.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-extrabold text-emerald-700">
                            1 USD = {c.symbol}
                            {Number(c.exchange_rate).toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => setCurForm(c)}
                            className="text-amber-600 font-bold hover:underline cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Customer Contact Messages */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-3">
                    Customer Contact Messages ({data?.messages?.length || 0})
                  </h3>
                  <div className="space-y-2.5 max-h-60 overflow-y-auto">
                    {(data?.messages || []).map((m) => (
                      <div
                        key={m.id}
                        className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-xs"
                      >
                        <div className="flex justify-between font-bold text-gray-900 mb-1">
                          <span>{m.subject}</span>
                          <span className="text-[10px] text-gray-400">{m.created_at}</span>
                        </div>
                        <p className="text-gray-600 mb-1">{m.message}</p>
                        <p className="text-[11px] text-amber-700 font-semibold">
                          {m.name} ({m.email})
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Static Company Information Pages Editor (About Us, Privacy, Terms, Shipping) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <form
                onSubmit={handleSaveSitePage}
                className="lg:col-span-7 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-3"
              >
                <h3 className="text-sm font-extrabold text-gray-900">
                  Edit Company Information Pages (About Us, Terms, Privacy, Shipping)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <input
                    type="text"
                    required
                    placeholder="Page Slug (e.g. about, privacy-policy, terms)"
                    value={pageForm.slug}
                    onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-mono"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Page Title"
                    value={pageForm.title}
                    onChange={(e) => setPageForm({ ...pageForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-bold"
                  />
                </div>
                <RichTextEditor
                  label="Page Content"
                  value={pageForm.content || ''}
                  onChange={(html) => setPageForm({ ...pageForm, content: html })}
                  placeholder="Write official company page content..."
                  minHeight={200}
                />
                <button
                  type="submit"
                  className="bg-gray-900 text-amber-400 font-extrabold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                >
                  Save Company Page
                </button>
              </form>

              <div className="lg:col-span-5 bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-2.5">
                <h3 className="text-sm font-extrabold text-gray-900">
                  Published Company Pages ({data?.site_pages?.length || 0})
                </h3>
                {(data?.site_pages || []).map((sp) => (
                  <div
                    key={sp.id}
                    className="p-3 rounded-xl border border-gray-100 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900">{sp.title}</p>
                      <p className="text-[11px] text-gray-400 font-mono">/page/{sp.slug}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPageForm(sp)}
                      className="text-xs font-bold text-amber-600 hover:underline cursor-pointer"
                    >
                      Edit Page
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Custom Payment Gateway Modal */}
      {newGwOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-gray-900">Add Payment Gateway</h3>
              <button
                onClick={() => setNewGwOpen(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form onSubmit={handleAddNewGateway} className="space-y-3 text-xs">
              <input
                type="text"
                required
                placeholder="Gateway Code (e.g. monnify, korapay, square)"
                value={newGwForm.code}
                onChange={(e) => setNewGwForm({ ...newGwForm, code: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200"
              />
              <input
                type="text"
                required
                placeholder="Display Name (e.g. Monnify Checkout)"
                value={newGwForm.name}
                onChange={(e) => setNewGwForm({ ...newGwForm, name: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200"
              />
              <input
                type="text"
                placeholder="Description"
                value={newGwForm.description}
                onChange={(e) => setNewGwForm({ ...newGwForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200"
              />
              <input
                type="text"
                placeholder="Public API Key"
                value={newGwForm.public_key}
                onChange={(e) => setNewGwForm({ ...newGwForm, public_key: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono"
              />
              <input
                type="text"
                placeholder="Secret API Key"
                value={newGwForm.secret_key}
                onChange={(e) => setNewGwForm({ ...newGwForm, secret_key: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 font-mono"
              />
              <button
                type="submit"
                className="w-full bg-amber-500 text-gray-950 font-extrabold py-2.5 rounded-xl cursor-pointer"
              >
                Add Gateway
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Product Edit/Create Modal (With Multi-Image Upload & RichTextEditor) */}
      {prodModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-xl max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-gray-900">
                {prodForm.id ? 'Edit Product & Multi-Photo Gallery' : 'Create Product'}
              </h3>
              <button
                onClick={() => setProdModal(false)}
                className="text-gray-400 hover:text-gray-700 cursor-pointer"
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>
            <form onSubmit={handleSaveProduct} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={prodForm.product_name}
                  onChange={(e) => setProdForm({ ...prodForm, product_name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 font-bold"
                />
              </div>
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={prodForm.price}
                    onChange={(e) => setProdForm({ ...prodForm, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Discount %</label>
                  <input
                    type="number"
                    value={prodForm.off_price}
                    onChange={(e) => setProdForm({ ...prodForm, off_price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Stock</label>
                  <input
                    type="number"
                    value={prodForm.instock}
                    onChange={(e) => setProdForm({ ...prodForm, instock: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={prodForm.product_category_id || 1}
                    onChange={(e) =>
                      setProdForm({ ...prodForm, product_category_id: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  >
                    {(data?.categories || []).map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Primary Cover Image URL</label>
                  <input
                    type="text"
                    value={prodForm.image || ''}
                    onChange={(e) => setProdForm({ ...prodForm, image: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200"
                  />
                </div>
              </div>

              {/* Multiple Product Image Upload & Gallery Manager */}
              <div className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-extrabold text-gray-900">
                      <i className="bi bi-images text-amber-600 mr-1.5" />
                      Multiple Product Images Gallery ({(prodForm.images || []).length} photos)
                    </p>
                    <p className="text-[11px] text-gray-500">
                      Upload multiple images from your device or paste image URLs.
                    </p>
                  </div>
                  <label className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold text-xs px-3.5 py-2 rounded-xl cursor-pointer inline-flex items-center gap-1.5">
                    <i className="bi bi-cloud-arrow-up-fill" />
                    <span>
                      {uploadingImages ? 'Uploading...' : 'Upload Multiple Images'}
                    </span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleUploadAdminImages}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Or paste an additional image URL here..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddAdminImageUrl}
                    className="px-3.5 py-1.5 rounded-xl bg-gray-900 text-amber-400 font-bold text-xs cursor-pointer"
                  >
                    + Add URL
                  </button>
                </div>

                {(prodForm.images || []).length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 pt-1">
                    {(prodForm.images || []).map((imgUrl, idx) => (
                      <div
                        key={`${imgUrl}-${idx}`}
                        className={`relative group rounded-xl overflow-hidden border-2 ${
                          prodForm.image === imgUrl ? 'border-amber-500' : 'border-gray-200'
                        } bg-white`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Gallery ${idx + 1}`}
                          className="w-full h-20 object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/75 text-white text-[9px] px-1.5 py-1 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => setProdForm({ ...prodForm, image: imgUrl })}
                            className="font-bold text-amber-300 hover:underline cursor-pointer"
                          >
                            {prodForm.image === imgUrl ? 'Cover' : 'Set Cover'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRemoveAdminImage(idx)}
                            className="text-red-300 hover:text-red-400 cursor-pointer"
                          >
                            <i className="bi bi-trash" />
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
                  value={prodForm.description || ''}
                  onChange={(html) => setProdForm({ ...prodForm, description: html })}
                  placeholder="Write product description, features, and specification tables..."
                  minHeight={200}
                />
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 text-gray-950 font-extrabold py-3 rounded-xl cursor-pointer"
              >
                Save Product &amp; Gallery
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
