import React from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';

export default function Footer() {
  const { company } = useStore();

  return (
    <footer className="bg-[#0b0c1e] text-white pt-12 pb-8 border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Escrow Buyer Protection & Gift Card Strip */}
        <div className="mb-8 p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-gray-950 flex items-center justify-center shrink-0">
              <i className="bi bi-shield-check text-lg" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider">
                100% Buyer-Sealed Escrow Protection
              </h4>
              <p className="text-xs text-gray-300 mt-0.5 max-w-3xl">
                {company?.escrow_policy_text ||
                  'All payments are protected in Escrow until you receive your order and confirm it is in good condition. Only after your order is sealed can Admin release funds to the vendor wallet.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/members?tab=giftcards"
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-gray-950 font-extrabold text-xs transition"
            >
              <i className="bi bi-gift-fill mr-1.5" />
              Store Gift Cards
            </Link>
            <Link
              to="/members?tab=rates"
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
            >
              <i className="bi bi-currency-exchange mr-1.5" />
              Exchange Rates
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 pb-10 border-b border-white/10">
          {/* Brand Column */}
          <div className="lg:col-span-1 space-y-3">
            <div className="flex flex-col">
              {company?.logo ? (
                <div className="mb-2">
                  <img
                    src={company.logo}
                    alt={company?.name || 'Logo'}
                    className="h-9 w-auto max-w-[140px] object-contain brightness-0 invert"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                  />
                </div>
              ) : null}
              <span className="text-2xl font-black tracking-widest text-white uppercase">
                {company?.name || 'Shoplenca'}
              </span>
              <span className="text-[9px] font-bold tracking-[0.25em] text-amber-400 uppercase -mt-1">
                {company?.title || 'make your shop come to you'}
              </span>
            </div>
            <p className="text-xs text-gray-400 leading-relaxed">
              {company?.mission ||
                company?.desc ||
                'Create your own subdomain store or attach a custom domain. Buy, sell, and grow your e-commerce business effortlessly.'}
            </p>
            {(company?.rc_number || company?.founded) && (
              <p className="text-[11px] text-gray-500">
                {company?.rc_number ? `Reg: ${company.rc_number}` : ''}{' '}
                {company?.founded ? `• Est. ${company.founded}` : ''}
              </p>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              QUICK LINKS
            </h3>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link to="/" className="hover:text-amber-400 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/category?sort=new"
                  className="hover:text-amber-400 transition-colors"
                >
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link
                  to="/members?tab=giftcards"
                  className="hover:text-amber-400 transition-colors"
                >
                  Personal Gift Cards
                </Link>
              </li>
              <li>
                <Link
                  to="/members?tab=rates"
                  className="hover:text-amber-400 transition-colors"
                >
                  Official Exchange Rates
                </Link>
              </li>
              <li>
                <Link to="/readbooks" className="hover:text-amber-400 transition-colors">
                  Digital Bookstore
                </Link>
              </li>
              <li>
                <Link to="/blog" className="hover:text-amber-400 transition-colors">
                  Our Blog
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              CUSTOMER SERVICE
            </h3>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link
                  to="/members?tab=orders"
                  className="hover:text-amber-400 transition-colors"
                >
                  Track &amp; Seal Order
                </Link>
              </li>
              <li>
                <Link
                  to="/members?tab=vendor"
                  className="hover:text-amber-400 transition-colors"
                >
                  Become a Vendor
                </Link>
              </li>
              <li>
                <Link
                  to="/about?tab=returns-exchange"
                  className="hover:text-amber-400 transition-colors"
                >
                  Returns &amp; Exchange
                </Link>
              </li>
              <li>
                <Link
                  to="/about?tab=shipping-policy"
                  className="hover:text-amber-400 transition-colors"
                >
                  Shipping Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Information */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              COMPANY INFO
            </h3>
            <ul className="space-y-2 text-xs text-gray-400">
              <li>
                <Link to="/about" className="hover:text-amber-400 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy"
                  className="hover:text-amber-400 transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy-policy?tab=terms-and-condition"
                  className="hover:text-amber-400 transition-colors"
                >
                  Terms &amp; Conditions
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-amber-400 transition-colors">
                  Contact Support
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Us */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              CONTACT HEADQUARTERS
            </h3>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li className="flex items-start space-x-2">
                <i className="bi bi-geo-alt text-amber-400 mt-0.5" />
                <span>
                  {company?.address || 'Plot 1042 Victoria Island, Lagos / Global Commerce Hub'}
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="bi bi-telephone text-amber-400" />
                <span>{company?.phone || '+234 800 289 4457'}</span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="bi bi-envelope text-amber-400" />
                <span>
                  {company?.email ||
                    `support@${(company?.name || 'shoplenca').toLowerCase()}.com`}
                </span>
              </li>
              <li className="flex items-center space-x-2">
                <i className="bi bi-clock text-amber-400" />
                <span>{company?.working_hours || 'Mon - Sat: 8:00 AM - 8:00 PM'}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>
            {company?.footer_copyright ||
              `© ${new Date().getFullYear()} ${company?.name || 'Shoplenca'} Marketplace. All rights reserved.`}
          </p>
          <div className="flex space-x-4 text-sm">
            <a
              href={company?.facebook_url || '#facebook'}
              target="_blank"
              rel="noreferrer"
              aria-label="Facebook"
              className="text-gray-400 hover:text-amber-400 transition-colors"
            >
              <i className="bi bi-facebook" />
            </a>
            <a
              href={company?.instagram_url || '#instagram'}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="text-gray-400 hover:text-amber-400 transition-colors"
            >
              <i className="bi bi-instagram" />
            </a>
            <a
              href={company?.twitter_url || '#twitter'}
              target="_blank"
              rel="noreferrer"
              aria-label="Twitter"
              className="text-gray-400 hover:text-amber-400 transition-colors"
            >
              <i className="bi bi-twitter-x" />
            </a>
            <a
              href={company?.youtube_url || '#youtube'}
              target="_blank"
              rel="noreferrer"
              aria-label="YouTube"
              className="text-gray-400 hover:text-amber-400 transition-colors"
            >
              <i className="bi bi-youtube" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}


