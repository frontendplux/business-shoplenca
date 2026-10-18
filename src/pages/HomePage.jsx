import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useStore } from '../context/StoreContext';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';
import AdBanner from '../components/AdBanner';
import SkeletonLoader from '../components/SkeletonLoader';

const HERO_SLIDES = [
  {
    badge: 'Mega Flash Event • Escrow Protected',
    title: 'Up to 60% Off Luxury Fashion, Tech & Books',
    subtitle: 'Shop with 100% Escrow Peace of Mind — Vendor funds are only released after you receive & seal your order in good condition.',
    ctaText: 'Shop Deals Now',
    ctaLink: '/category',
    bgClass: 'from-slate-950 via-purple-950 to-slate-900',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1000&q=80',
  },
  {
    badge: 'Personal Store Gift Cards',
    title: 'Send & Redeem Instant Wallet Gift Cards',
    subtitle: 'Buy personal store gift cards for friends or redeem gift codes directly into your Member Wallet in 1 click.',
    ctaText: 'Explore Gift Cards',
    ctaLink: '/members?tab=giftcards',
    bgClass: 'from-amber-950 via-purple-900 to-slate-950',
    image: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=1000&q=80',
  },
  {
    badge: 'Own Your Subdomain • NGN 500/mo',
    title: 'Launch Your Own Self-Managed Storefront',
    subtitle: 'Control your products, custom domain, and payment gateway with 0% company interference or use our Database Wallet.',
    ctaText: 'Launch Your Store',
    ctaLink: '/members?tab=domain',
    bgClass: 'from-emerald-950 via-teal-900 to-slate-950',
    image: 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1000&q=80',
  },
];

const SHORTCUTS = [
  { label: 'Flash Deals', sub: 'Up to 60% Off', icon: 'bi-lightning-charge-fill', color: 'bg-amber-100 text-amber-600', link: '/category?discount=25' },
  { label: 'Store Gift Cards', sub: 'Redeem to Wallet', icon: 'bi-gift-fill', color: 'bg-rose-100 text-rose-600', link: '/members?tab=giftcards' },
  { label: 'Exchange Rates', sub: 'Live Currency Desk', icon: 'bi-currency-exchange', color: 'bg-emerald-100 text-emerald-600', link: '/members?tab=rates' },
  { label: 'Books & E-Read', sub: 'Read & Earn', icon: 'bi-book-half', color: 'bg-blue-100 text-blue-600', link: '/book' },
  { label: 'Own Subdomain', sub: 'NGN 500 / Mo', icon: 'bi-globe2', color: 'bg-purple-100 text-purple-600', link: '/members?tab=domain' },
  { label: 'Escrow Verified', sub: 'Sealed Protection', icon: 'bi-shield-lock-fill', color: 'bg-indigo-100 text-indigo-600', link: '/members?tab=orders' },
];

export default function HomePage() {
  const { categories, company, formatPrice, showToast } = useStore();
  const [data, setData] = useState({ inventories: [], promo_ads: [], site_reviews: [], home_categories: [] });
  const [loading, setLoading] = useState(true);
  const [slideIdx, setSlideIdx] = useState(0);
  const [hoveredCat, setHoveredCat] = useState(null);
  const [newsletterEmail, setNewsletterEmail] = useState('');

  useEffect(() => {
    let mounted = true;
    api.get('/home')
      .then((res) => {
        if (mounted) {
          const sortedInvs = [...(res.inventories || [])].sort(
            (a, b) => Number(a.inv_position || 99) - Number(b.inv_position || 99)
          );
          setData({
            inventories: sortedInvs,
            promo_ads: res.promo_ads || [],
            site_reviews: res.site_reviews || [],
            home_categories: res.home_categories || res.featured_categories || [],
          });
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIdx((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5500);
    return () => clearInterval(timer);
  }, []);

  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim()) return;
    showToast('Subscribed! Welcome to our VIP insider list.', 'success');
    setNewsletterEmail('');
  };

  if (loading) {
    return (
      <div className="bg-gray-100 min-h-screen pb-14">
        <SEO
          title="Shop Online — Fashion, Electronics, Books & Gift Cards"
          description={company?.description || 'Shop verified products, books, and vendor deals with Escrow buyer protection.'}
        />
        <SkeletonLoader type="home" />
      </div>
    );
  }

  const heroTopAds = data.promo_ads.filter((a) => a.position_key === 'hero_top');
  const afterFirstAds = data.promo_ads.filter((a) => a.position_key === 'after_first_inv');
  const midPageAds = data.promo_ads.filter((a) => a.position_key === 'mid_page');
  const bottomAds = data.promo_ads.filter((a) => a.position_key === 'bottom_banner');

  return (
    <div className="bg-gray-100 min-h-screen pb-14">
      <SEO
        title="Shop Online — Fashion, Electronics, Books & Gift Cards"
        description={company?.description || 'Shop verified products, books, and vendor deals with fast delivery and Escrow buyer protection.'}
      />

      {/* PREMIUM HERO SECTION */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 pt-3 pb-4">
        <div
          className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch relative"
          onMouseLeave={() => setHoveredCat(null)}
        >
          {/* Left Category Sidebar (Desktop) */}
          <div className="hidden lg:flex lg:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 flex-col justify-between py-2.5 relative z-20">
            <div>
              <div className="px-4 pb-2 mb-1 border-b border-gray-100 flex items-center justify-between">
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-900 flex items-center gap-1.5">
                  <i className="bi bi-grid-fill text-amber-500"></i> Categories
                </span>
                <span className="text-[10px] bg-purple-50 text-purple-700 font-bold px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>
              <ul className="divide-y divide-gray-50">
                {categories.slice(0, 9).map((cat) => (
                  <li
                    key={cat.id}
                    onMouseEnter={() => setHoveredCat(cat)}
                    className="px-4 py-2 hover:bg-purple-50/70 transition flex items-center justify-between cursor-pointer group"
                  >
                    <Link
                      to={`/category?slug=${encodeURIComponent(cat.slug)}`}
                      className="flex items-center gap-2.5 text-xs font-semibold text-gray-700 group-hover:text-purple-800 truncate w-full"
                    >
                      <i className="bi bi-tag-fill w-4 text-center text-gray-400 group-hover:text-amber-500 transition"></i>
                      <span className="truncate">{cat.name}</span>
                    </Link>
                    <i className="bi bi-chevron-right text-[10px] text-gray-300 group-hover:text-purple-700"></i>
                  </li>
                ))}
              </ul>
            </div>
            <div className="px-4 pt-2 border-t border-gray-100">
              <Link to="/category" className="text-[11px] font-bold text-purple-700 hover:text-amber-600 flex items-center justify-between">
                <span>Browse All Departments</span>
                <i className="bi bi-arrow-right text-[10px]"></i>
              </Link>
            </div>

            {/* Flyout Subcategories Mega Panel */}
            {hoveredCat && (hoveredCat.sub_categories || hoveredCat.subs || hoveredCat.subcategories)?.length > 0 && (
              <div className="absolute left-full top-0 ml-1.5 w-[540px] min-h-full bg-white rounded-2xl shadow-2xl border border-gray-100 p-5 z-30">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
                  <Link
                    to={`/category?slug=${encodeURIComponent(hoveredCat.slug)}`}
                    className="font-extrabold text-gray-900 hover:text-purple-700 text-sm flex items-center gap-2"
                  >
                    <i className="bi bi-grid-fill text-amber-500"></i>
                    {hoveredCat.name}
                  </Link>
                  <Link
                    to={`/category?slug=${encodeURIComponent(hoveredCat.slug)}`}
                    className="text-xs text-purple-700 font-bold hover:underline"
                  >
                    See All &rarr;
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(hoveredCat.sub_categories || hoveredCat.subs || hoveredCat.subcategories || []).map((sub) => (
                    <div key={sub.id}>
                      <Link
                        to={`/category?slug=${encodeURIComponent(hoveredCat.slug)}&sub=${sub.id}`}
                        className="text-xs font-bold text-gray-800 hover:text-purple-700 block mb-1.5"
                      >
                        {sub.name}
                      </Link>
                      {sub.brands?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {sub.brands.slice(0, 5).map((b) => (
                            <Link
                              key={b.id}
                              to={`/category?slug=${encodeURIComponent(hoveredCat.slug)}&brand=${b.id}`}
                              className="text-[11px] text-gray-500 hover:text-purple-700 bg-gray-50 hover:bg-purple-50 px-2 py-0.5 rounded"
                            >
                              {b.name}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Center Hero Slider */}
          <div className="lg:col-span-6 relative rounded-2xl overflow-hidden shadow-md min-h-[280px] sm:min-h-[360px] bg-slate-950 flex">
            {HERO_SLIDES.map((s, idx) => (
              <div
                key={idx}
                className={`absolute inset-0 transition-opacity duration-700 flex items-center bg-gradient-to-r ${s.bgClass} ${
                  idx === slideIdx ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <img
                  src={s.image}
                  alt={s.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-35 mix-blend-luminosity"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="relative z-10 p-6 sm:p-10 max-w-xl text-white">
                  <span className="inline-flex items-center gap-1.5 bg-amber-400 text-gray-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-3 shadow">
                    <i className="bi bi-stars"></i> {s.badge}
                  </span>
                  <h1 className="text-2xl sm:text-4xl font-black leading-tight mb-3 drop-shadow">
                    {s.title}
                  </h1>
                  <p className="text-xs sm:text-sm text-gray-200 mb-6 leading-relaxed">
                    {s.subtitle}
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to={s.ctaLink}
                      className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg transition transform hover:-translate-y-0.5"
                    >
                      <span>{s.ctaText}</span>
                      <i className="bi bi-arrow-right text-xs"></i>
                    </Link>
                    <Link
                      to="/members?tab=giftcards"
                      className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-bold text-xs px-4 py-3 rounded-xl border border-white/20 transition"
                    >
                      <i className="bi bi-gift-fill text-amber-300"></i>
                      <span>Gift Cards</span>
                    </Link>
                  </div>
                </div>
              </div>
            ))}

            {/* Slider Controls */}
            <button
              onClick={() => setSlideIdx((slideIdx - 1 + HERO_SLIDES.length) % HERO_SLIDES.length)}
              className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition"
              aria-label="Previous slide"
            >
              <i className="bi bi-chevron-left text-xs"></i>
            </button>
            <button
              onClick={() => setSlideIdx((slideIdx + 1) % HERO_SLIDES.length)}
              className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white flex items-center justify-center transition"
              aria-label="Next slide"
            >
              <i className="bi bi-chevron-right text-xs"></i>
            </button>

            {/* Dots */}
            <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5">
              {HERO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIdx(i)}
                  className={`h-1.5 rounded-full transition-all ${
                    i === slideIdx ? 'w-7 bg-amber-400' : 'w-2 bg-white/50'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Executive Spotlight Column */}
          <div className="hidden lg:flex lg:col-span-3 flex-col gap-3.5">
            {/* Gift Card & Wallet Direct Redeem Promo Card */}
            <Link
              to="/members?tab=giftcards"
              className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#3b0764] via-[#7b1d8e] to-[#ea580c] text-white p-4 shadow-sm flex-1 flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-400 text-gray-950 px-2.5 py-0.5 rounded-full">
                    Instant Wallet Credit
                  </span>
                  <i className="bi bi-gift-fill text-amber-300 text-lg"></i>
                </div>
                <h3 className="text-sm font-black mt-2 group-hover:text-amber-200 transition leading-snug">
                  Personal Store Gift Cards
                </h3>
                <p className="text-[11px] text-purple-100 mt-1 leading-relaxed">
                  Buy or redeem gift cards directly into your Member Wallet in 1 click.
                </p>
              </div>
              <span className="text-xs font-extrabold text-amber-300 flex items-center gap-1 mt-2">
                Redeem or Buy Gift Card <i className="bi bi-arrow-right text-[10px] group-hover:translate-x-1 transition-transform"></i>
              </span>
            </Link>

            {/* Escrow Sealed Protection & Exchange Rate Desk Card */}
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex-1 flex flex-col justify-center gap-2.5">
              <Link to="/members?tab=orders" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <i className="bi bi-shield-lock-fill text-sm"></i>
                </div>
                <div>
                  <p className="text-xs font-extrabold text-gray-800 group-hover:text-emerald-700">SEALED ESCROW PAY</p>
                  <p className="text-[11px] text-gray-500">Vendor paid after you confirm good condition</p>
                </div>
              </Link>
              <Link to="/members?tab=rates" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:bg-amber-500 group-hover:text-white transition">
                  <i className="bi bi-currency-exchange text-sm"></i>
                </div>
                <div>
                  <p className="text-xs font-extrabold text-gray-800 group-hover:text-amber-600">OUR EXCHANGE RATES</p>
                  <p className="text-[11px] text-gray-500">View live company currency conversion rates</p>
                </div>
              </Link>
              <Link to="/members?tab=domain" className="flex items-center gap-3 group">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 group-hover:bg-purple-700 group-hover:text-white transition">
                  <i className="bi bi-globe2 text-sm"></i>
                </div>
                <div>
                  <p className="text-xs font-extrabold text-gray-800 group-hover:text-purple-700">OWN A SUBDOMAIN</p>
                  <p className="text-[11px] text-gray-500">Just {formatPrice(0.32)} (NGN 500)/mo + 2-day grace</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Shortcut Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 mt-3.5">
          {SHORTCUTS.map((sc, i) => (
            <Link
              key={i}
              to={sc.link}
              className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100 hover:shadow-md hover:border-purple-200 transition flex items-center gap-3 group"
            >
              <div className={`w-10 h-10 rounded-xl ${sc.color} flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                <i className={`bi ${sc.icon} text-base`}></i>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-extrabold text-gray-900 group-hover:text-purple-700 truncate">
                  {sc.label}
                </p>
                <p className="text-[10px] text-gray-500 truncate">{sc.sub}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Admin Custom Hero-Top Promo Ads */}
        {heroTopAds.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {heroTopAds.map((ad) => (
              <PromoAdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}

        {/* Google AdSense / AdMob Homepage Slot */}
        <AdBanner placement="home" />
      </section>

      {/* SHOP BY CATEGORY */}
      {data.home_categories.length > 0 && (
        <section className="max-w-7xl mx-auto px-3 sm:px-4 mb-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                  <i className="bi bi-grid-3x3-gap-fill text-purple-700"></i>
                  Shop by Department
                </h2>
                <p className="text-xs text-gray-500">Explore our curated categories with multi-angle product galleries</p>
              </div>
              <Link to="/category" className="text-xs font-bold text-purple-700 hover:underline">
                See All Categories &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-3.5">
              {data.home_categories.map((cat) => (
                <Link
                  key={cat.id}
                  to={`/category?slug=${encodeURIComponent(cat.slug)}`}
                  className="group flex flex-col items-center text-center p-2.5 rounded-2xl hover:bg-purple-50/60 transition"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden bg-gray-100 border-2 border-gray-100 group-hover:border-purple-600 transition mb-2 shadow-sm">
                    <img
                      src={cat.image || 'https://placehold.co/200x200/f3e8ff/7b1d8e?text=Category'}
                      alt={cat.name}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <span className="text-xs font-bold text-gray-800 group-hover:text-purple-800 line-clamp-1">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* DYNAMIC INVENTORY SECTIONS (Ordered by Admin's inv_position) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-6">
        {data.inventories.map((inv, idx) => (
          <React.Fragment key={inv.id}>
            <InventorySection
              inventory={inv}
              index={idx}
              reviews={idx === 1 ? data.site_reviews : []}
            />

            {/* Admin Promo Ad Banner after 1st Inventory */}
            {idx === 0 && afterFirstAds.length > 0 && (
              <div className={`grid grid-cols-1 ${afterFirstAds.length > 1 ? 'lg:grid-cols-2' : ''} gap-4`}>
                {afterFirstAds.map((ad) => (
                  <PromoAdCard key={ad.id} ad={ad} />
                ))}
              </div>
            )}

            {/* Admin Promo Ad Banner Mid-Page (after 2nd Inventory) */}
            {idx === 1 && midPageAds.length > 0 && (
              <div className={`grid grid-cols-1 ${midPageAds.length > 1 ? 'lg:grid-cols-2' : ''} gap-4`}>
                {midPageAds.map((ad) => (
                  <PromoAdCard key={ad.id} ad={ad} />
                ))}
              </div>
            )}

            {/* If Admin enabled "show_ads_next" on this Inventory Section */}
            {inv.show_ads_next && (
              <AdBanner placement="home" />
            )}
          </React.Fragment>
        ))}

        {/* Bottom Promo Ad Banners */}
        {bottomAds.length > 0 && (
          <div className={`grid grid-cols-1 ${bottomAds.length > 1 ? 'lg:grid-cols-2' : ''} gap-4`}>
            {bottomAds.map((ad) => (
              <PromoAdCard key={ad.id} ad={ad} />
            ))}
          </div>
        )}
      </div>

      {/* ESCROW & MARKETPLACE TRUST BAR */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 mt-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <i className="bi bi-shield-lock-fill text-lg"></i>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-gray-900">Sealed Escrow Protection</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Your payment is held safely until you confirm you received the product in good condition.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <i className="bi bi-gift-fill text-lg"></i>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-gray-900">Personal Store Gift Cards</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Generate personal gift cards or redeem gift codes directly to your wallet balance.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <i className="bi bi-currency-exchange text-lg"></i>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-gray-900">Transparent Exchange Rates</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Check our live official currency exchange rate board & calculator anytime in your dashboard.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
              <i className="bi bi-patch-check-fill text-lg"></i>
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-gray-900">Verified Vendors & Domains</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Every vendor is screened by Admin with optional self-owned subdomain storefronts.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER BANNER */}
      <section className="max-w-7xl mx-auto px-3 sm:px-4 mt-8">
        <div className="bg-gradient-to-r from-gray-900 via-purple-950 to-indigo-950 rounded-2xl p-6 sm:p-10 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="max-w-xl">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400">
              VIP Club, Gift Drops & Flash Alerts
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold mt-1">
              Get 15% Off & Exclusive Gift Card Drops
            </h3>
            <p className="text-xs sm:text-sm text-gray-300 mt-1">
              Subscribe for early access to flash sales, new book chapters, and exclusive vendor drops.
            </p>
          </div>
          <form onSubmit={handleNewsletter} className="flex w-full md:w-auto gap-2">
            <input
              type="email"
              required
              value={newsletterEmail}
              onChange={(e) => setNewsletterEmail(e.target.value)}
              placeholder="Enter your email address..."
              className="w-full md:w-72 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-gray-400 text-sm focus:outline-none focus:border-amber-400"
            />
            <button
              type="submit"
              className="bg-amber-500 hover:bg-amber-400 text-gray-950 font-extrabold text-xs sm:text-sm px-5 py-2.5 rounded-xl shrink-0 transition"
            >
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

function PromoAdCard({ ad }) {
  const grad = ad.bg_gradient || 'from-[#3b0764] via-[#7b1d8e] to-[#ea580c]';
  return (
    <div className={`relative rounded-2xl overflow-hidden bg-gradient-to-r ${grad} text-white p-6 sm:p-8 shadow-md flex flex-col sm:flex-row items-center justify-between gap-6 group`}>
      {ad.image_url && (
        <img
          src={ad.image_url}
          alt={ad.title}
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity group-hover:scale-105 transition-transform duration-700 pointer-events-none"
        />
      )}
      <div className="relative z-10 max-w-xl">
        {ad.badge_text && (
          <span className="inline-flex items-center gap-1.5 bg-amber-400 text-gray-950 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mb-2.5 shadow-sm">
            <i className="bi bi-megaphone-fill"></i> {ad.badge_text}
          </span>
        )}
        <h3 className="text-lg sm:text-2xl font-black leading-tight">
          {ad.title}
        </h3>
        {ad.subtitle && (
          <p className="text-xs sm:text-sm text-white/90 mt-1.5 leading-relaxed">
            {ad.subtitle}
          </p>
        )}
      </div>
      <div className="relative z-10 shrink-0 self-start sm:self-center">
        <Link
          to={ad.cta_link || '/category'}
          className="inline-flex items-center gap-2 bg-white text-gray-950 hover:bg-amber-300 font-extrabold text-xs sm:text-sm px-5 py-3 rounded-xl shadow-lg transition transform group-hover:-translate-y-0.5"
        >
          <span>{ad.cta_text || 'Explore Now'}</span>
          <i className="bi bi-arrow-right"></i>
        </Link>
      </div>
    </div>
  );
}

function InventorySection({ inventory, index, reviews }) {
  const scrollRef = useRef(null);
  const styleType = Number(inventory.style_type || 0);
  const products = inventory.products || [];
  const title = inventory.name || inventory.title || 'Featured Collection';

  const headerShaders = [
    'from-[#7b1d8e] via-rose-600 to-orange-500 text-white',
    'from-slate-900 via-purple-950 to-indigo-900 text-white',
    'from-amber-500 via-orange-500 to-rose-500 text-gray-950',
    'from-emerald-800 via-teal-700 to-cyan-800 text-white',
  ];
  const headerClass = headerShaders[index % headerShaders.length];

  const scroll = (dir) => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir * 320, behavior: 'smooth' });
  };

  return (
    <>
      <section className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Inventory Header Bar */}
        <div className={`bg-gradient-to-r ${headerClass} px-4 sm:px-6 py-3.5 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-xs">
              #{index + 1}
            </span>
            <div>
              <h2 className="text-sm sm:text-lg font-black tracking-tight flex items-center gap-2">
                <i className={`bi ${styleType === 1 ? 'bi-lightning-charge-fill' : styleType === 2 ? 'bi-stars' : 'bi-fire'}`}></i>
                {title}
              </h2>
              {inventory.description && (
                <p className="text-[11px] opacity-90 hidden sm:block">{inventory.description}</p>
              )}
            </div>
          </div>
          <Link
            to={`/category?inv=${encodeURIComponent(inventory.slug || '')}`}
            className="text-xs font-extrabold bg-white/20 hover:bg-white/30 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 transition shrink-0"
          >
            <span>See All</span>
            <i className="bi bi-chevron-right text-[10px]"></i>
          </Link>
        </div>

        {/* Style 2: Horizontal Carousel */}
        {styleType === 2 ? (
          <div className="relative p-4 sm:p-5">
            <button
              onClick={() => scroll(-1)}
              className="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 items-center justify-center text-gray-700 hover:bg-gray-900 hover:text-white transition"
              aria-label="Scroll left"
            >
              <i className="bi bi-chevron-left text-xs"></i>
            </button>
            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto no-scrollbar scroll-smooth pb-1"
            >
              {products.map((prod) => (
                <div key={prod.id} className="w-48 sm:w-56 shrink-0">
                  <ProductCard product={prod} variant="new" />
                </div>
              ))}
            </div>
            <button
              onClick={() => scroll(1)}
              className="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white shadow-md border border-gray-200 items-center justify-center text-gray-700 hover:bg-gray-900 hover:text-white transition"
              aria-label="Scroll right"
            >
              <i className="bi bi-chevron-right text-xs"></i>
            </button>
          </div>
        ) : (
          /* Style 1 & Default Grid */
          <div className="p-4 sm:p-5 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 sm:gap-4">
            {products.slice(0, 8).map((prod) => (
              <ProductCard key={prod.id} product={prod} variant={styleType === 1 ? 'trending' : 'best'} />
            ))}
          </div>
        )}
      </section>

      {/* Customer Reviews Interlude after 2nd inventory */}
      {reviews && reviews.length > 0 && (
        <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900 flex items-center gap-2">
              <i className="bi bi-heart-fill text-rose-500"></i>
              Verified Customer Reviews
            </h3>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              <i className="bi bi-patch-check-fill mr-1"></i> 4.9 / 5.0 Sealed Delivery Rating
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {reviews.slice(0, 3).map((rev, i) => (
              <div key={rev.id || i} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-xs mb-2">
                    {Array.from({ length: Number(rev.star || rev.rating || 5) }).map((_, s) => (
                      <i key={s} className="bi bi-star-fill"></i>
                    ))}
                  </div>
                  <p className="text-xs text-gray-700 italic leading-relaxed mb-3">
                    "{rev.msg || rev.comment}"
                  </p>
                </div>
                <div className="flex items-center justify-between border-t border-gray-200/70 pt-2.5">
                  <p className="text-xs font-bold text-gray-900">
                    {[rev.firstname, rev.lastname].filter(Boolean).join(' ') || rev.reviewer_name || 'Verified Shopper'}
                  </p>
                  <span className="text-[10px] bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">
                    Sealed Order Buyer
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
