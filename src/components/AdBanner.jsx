import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../context/StoreContext';
import {
  isCapacitorNative,
  getCapacitorPlatform,
  showCapacitorAdMobBanner,
  syncCapacitorServerUrl,
} from '../utils/capacitorBridge';

/**
 * Global AdSense & Capacitor AdMob Initializer
 * Mounted once inside Layout.jsx:
 * - On Web: Injects Google AdSense `adsbygoogle.js` or Admin's custom `adsense_head_script` into `<head>`
 * - On Native Capacitor App: Syncs `capacitor_server_url` and initializes AdMob if enabled
 */
export function AdSenseGlobalHead() {
  const { company } = useStore();
  const isNative = isCapacitorNative();

  useEffect(() => {
    if (!company) return;

    if (company.capacitor_server_url) {
      syncCapacitorServerUrl(company.capacitor_server_url);
    }

    // Native Capacitor App -> Initialize AdMob instead of Web AdSense
    if (isNative) {
      if (company.admob_enabled) {
        showCapacitorAdMobBanner({
          androidAppId: company.admob_app_id_android,
          iosAppId: company.admob_app_id_ios,
          bannerId: company.admob_banner_id,
          interstitialId: company.admob_interstitial_id,
          rewardedId: company.admob_rewarded_id,
        });
      }
      return;
    }

    // Web Browser -> Inject Google AdSense Head Script if enabled
    if (!company.adsense_enabled) return;

    const clientId = (company.adsense_client_id || '').trim();
    const isRealPublisherId =
      clientId.startsWith('ca-pub-') && clientId !== 'ca-pub-0000000000000000';

    if (isRealPublisherId && !document.getElementById('google-adsense-head-js')) {
      const script = document.createElement('script');
      script.id = 'google-adsense-head-js';
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
        clientId
      )}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }

    // If Admin pasted raw custom AdSense/Ad Network head script
    const rawHead = (company.adsense_head_script || '').trim();
    if (rawHead && !document.getElementById('custom-adsense-head-container')) {
      const wrapper = document.createElement('div');
      wrapper.id = 'custom-adsense-head-container';
      wrapper.innerHTML = rawHead;
      const scripts = wrapper.querySelectorAll('script');
      scripts.forEach((oldScript) => {
        const newScript = document.createElement('script');
        Array.from(oldScript.attributes).forEach((attr) =>
          newScript.setAttribute(attr.name, attr.value)
        );
        if (oldScript.innerHTML) {
          newScript.appendChild(document.createTextNode(oldScript.innerHTML));
        }
        document.head.appendChild(newScript);
      });
    }
  }, [
    company?.adsense_enabled,
    company?.adsense_client_id,
    company?.adsense_head_script,
    company?.admob_enabled,
    company?.admob_banner_id,
    company?.capacitor_server_url,
    isNative,
  ]);

  return null;
}

const PLACEMENT_META = {
  header: {
    label: 'Top Leaderboard Ad (728×90 / Responsive)',
    promoTitle: 'Own Your Subdomain & Custom Domain Store for NGN 500/mo',
    promoSub: 'Zero company interference or Company Wallet payouts · Instant activation',
    promoLink: '/members?tab=domain',
    cta: 'Launch Store',
  },
  home: {
    label: 'Homepage In-Feed Banner Ad',
    promoTitle: 'Publish & Sell Your Digital Books — Set Your Own Book Price!',
    promoSub: 'Write with our Studio Rich Editor, set your book price, and earn on every sale & read',
    promoLink: '/members?tab=books',
    cta: 'Start Publishing',
  },
  product: {
    label: 'Product Page Sponsored Ad Slot',
    promoTitle: 'Become a Verified Marketplace Seller Today',
    promoSub: 'Get the Official Verified Seller Badge + Your Own Subdomain for just NGN 500/mo',
    promoLink: '/members?tab=vendor',
    cta: 'Get Verified',
  },
  category: {
    label: 'Category Listing Ad Slot',
    promoTitle: 'Flash Deals Up to 60% Off + Extra 10% Off Prepaid Orders',
    promoSub: 'Shop verified sellers with nationwide express delivery',
    promoLink: '/category',
    cta: 'Explore Deals',
  },
  article: {
    label: 'Reader / In-Article AdSense Slot',
    promoTitle: 'Read & Earn Rewards or Publish Your Own Paid Book',
    promoSub: 'Authors keep up to 100% in Self-Managed Mode or use Company Wallet settlement',
    promoLink: '/book',
    cta: 'Browse Bookstore',
  },
  footer: {
    label: 'Footer Wide Banner Ad Slot',
    promoTitle: 'Web + Native Android/iOS Capacitor App Ready Marketplace',
    promoSub: 'Seamless Google AdSense on Web & Google AdMob on Mobile Apps',
    promoLink: '/members?tab=domain',
    cta: 'Learn More',
  },
};

/**
 * Reusable AdSense (Web) & AdMob (Capacitor Native) Placement Component
 * @param {Object} props
 * @param {'header'|'home'|'product'|'category'|'article'|'footer'} [props.placement='home']
 * @param {string} [props.className='']
 */
export default function AdBanner({ placement = 'home', className = '' }) {
  const { company, user, moneyFromNgn } = useStore();
  const customHtmlRef = useRef(null);
  const adsenseInsRef = useRef(null);
  const isNative = isCapacitorNative();
  const platform = getCapacitorPlatform();

  const adsEnabled = isNative
    ? Boolean(company?.admob_enabled ?? true)
    : Boolean(company?.adsense_enabled ?? true);

  const clientId = (company?.adsense_client_id || '').trim();
  const isRealPublisherId =
    clientId.startsWith('ca-pub-') && clientId !== 'ca-pub-0000000000000000';

  const slotId = (company?.[`adsense_slot_${placement}`] || '').trim();
  const customHtml = (company?.[`adsense_html_${placement}`] || '').trim();

  // Execute custom HTML/JS ad code if Admin pasted one for this placement
  useEffect(() => {
    if (isNative || !adsEnabled || !customHtml || !customHtmlRef.current) return;
    const container = customHtmlRef.current;
    container.innerHTML = customHtml;

    const scripts = container.querySelectorAll('script');
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) =>
        newScript.setAttribute(attr.name, attr.value)
      );
      if (oldScript.innerHTML) {
        newScript.appendChild(document.createTextNode(oldScript.innerHTML));
      }
      oldScript.parentNode?.replaceChild(newScript, oldScript);
    });
  }, [customHtml, adsEnabled, isNative]);

  // Push Google AdSense `<ins>` unit if Publisher ID + Slot ID are configured
  useEffect(() => {
    if (isNative || !adsEnabled || customHtml || !isRealPublisherId || !slotId) return;
    try {
      if (typeof window !== 'undefined' && adsenseInsRef.current) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      // Ignore duplicate push in React strict mode
    }
  }, [adsEnabled, customHtml, isRealPublisherId, slotId, isNative]);

  if (!adsEnabled) return null;

  const meta = PLACEMENT_META[placement] || PLACEMENT_META.home;

  // 1. Native Capacitor App Mode (AdMob Bridge)
  if (isNative) {
    return (
      <div className={`my-3 ${className}`}>
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-xl p-3.5 border border-indigo-500/30 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="px-2 py-0.5 rounded bg-amber-400 text-gray-950 text-[10px] font-black uppercase tracking-wider shrink-0">
              AdMob · {platform.toUpperCase()}
            </span>
            <div>
              <p className="text-xs font-extrabold text-white">{meta.promoTitle}</p>
              <p className="text-[11px] text-indigo-200">{meta.promoSub}</p>
            </div>
          </div>
          <Link
            to={meta.promoLink}
            className="bg-amber-400 hover:bg-amber-300 text-gray-950 font-extrabold text-xs px-3.5 py-1.5 rounded-lg shrink-0 transition"
          >
            {meta.cta} &rarr;
          </Link>
        </div>
      </div>
    );
  }

  // 2. Web Mode: Custom pasted AdSense / HTML Ad Code for this placement
  if (customHtml) {
    return (
      <div className={`my-4 ${className}`}>
        <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold text-center mb-1">
          Advertisement
        </div>
        <div
          ref={customHtmlRef}
          className="bg-white rounded-xl border border-gray-200/80 p-2 overflow-hidden flex justify-center items-center min-h-[70px]"
        />
      </div>
    );
  }

  // 3. Web Mode: Standard Google AdSense `<ins class="adsbygoogle">` unit
  if (isRealPublisherId && slotId) {
    return (
      <div className={`my-4 ${className}`}>
        <div className="text-[10px] uppercase tracking-widest text-gray-400 font-semibold text-center mb-1">
          Advertisement
        </div>
        <div className="bg-white rounded-xl border border-gray-200/80 p-2 overflow-hidden text-center min-h-[90px]">
          <ins
            ref={adsenseInsRef}
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={clientId}
            data-ad-slot={slotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      </div>
    );
  }

  // 4. Web Mode: AdSense Active Placeholder / House Promo Banner (shows where ad renders until live code is pasted)
  return (
    <div className={`my-4 ${className}`}>
      <div className="relative overflow-hidden rounded-xl border border-dashed border-indigo-200 bg-gradient-to-r from-indigo-50/90 via-white to-amber-50/80 p-3.5 sm:px-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex flex-col items-center justify-center bg-white border border-indigo-200 rounded-lg px-2.5 py-1.5 shadow-2xs shrink-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-700">
                Google AdSense
              </span>
              <span className="text-[10px] font-bold text-gray-500">{placement.toUpperCase()}</span>
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                  Sponsored · {meta.label}
                </span>
                <span className="text-[11px] font-extrabold text-indigo-700">
                  Subdomain Store: {moneyFromNgn ? moneyFromNgn(500) : 'NGN 500'}/mo
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 mt-1">
                {meta.promoTitle}
              </h4>
              <p className="text-[11px] text-gray-600 mt-0.5">{meta.promoSub}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {user?.is_admin && (
              <Link
                to="/admin?tab=adsense"
                className="text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg shadow-xs transition flex items-center gap-1"
              >
                <i className="bi bi-code-square"></i>
                <span>Paste AdSense Code</span>
              </Link>
            )}
            <Link
              to={meta.promoLink}
              className="text-[11px] font-extrabold bg-gray-900 hover:bg-gray-800 text-white px-3.5 py-1.5 rounded-lg transition"
            >
              {meta.cta} &rarr;
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

