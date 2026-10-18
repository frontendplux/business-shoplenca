import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import AdBanner, { AdSenseGlobalHead } from '../AdBanner';
import { useStore } from '../../context/StoreContext';

export default function Layout({ children }) {
  const { toasts } = useStore();

  const mapType = {
    success: ['bg-emerald-600', 'bi-check-circle-fill'],
    error: ['bg-rose-600', 'bi-exclamation-triangle-fill'],
    info: ['bg-purple-700', 'bi-bell-fill'],
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 text-gray-800">
      <AdSenseGlobalHead />

      {/* Toast Notifications */}
      <div className="fixed top-5 right-5 z-50 flex flex-col gap-2.5 pointer-events-none">
        {toasts.map((t) => {
          const [bg, icon] = mapType[t.type] || ['bg-gray-900', 'bi-info-circle-fill'];
          return (
            <div
              key={t.id}
              className={`${bg} text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 pointer-events-auto max-w-xs animate-bounce`}
            >
              <i className={`bi ${icon} text-base`} />
              <span className="flex-1">{t.message}</span>
            </div>
          );
        })}
      </div>

      <Header />
      <main className="flex-grow">{children || <Outlet />}</main>
      <div className="max-w-7xl w-full mx-auto px-3 sm:px-4">
        <AdBanner placement="footer" />
      </div>
      <Footer />
    </div>
  );
}
