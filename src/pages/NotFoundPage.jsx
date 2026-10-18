import React from 'react';
import { Link } from 'react-router-dom';
import SEO from '../components/SEO';

export default function NotFoundPage() {
  return (
    <div className="bg-gray-100 min-h-[70vh] flex items-center justify-center px-4 py-16">
      <SEO title="404 — Page Not Found" />
      <div className="bg-white rounded-2xl p-8 sm:p-12 text-center shadow-sm border border-gray-100 max-w-md w-full">
        <span className="text-4xl font-extrabold text-amber-500">404</span>
        <h1 className="text-xl font-extrabold text-gray-900 mt-2 mb-2">Page Not Found</h1>
        <p className="text-xs text-gray-500 mb-6">
          The page you are looking for might have been moved or is temporarily unavailable.
        </p>
        <Link
          to="/"
          className="inline-block bg-gray-900 hover:bg-amber-500 hover:text-gray-950 text-white font-extrabold text-xs px-6 py-3 rounded-xl transition"
        >
          Back to Homepage
        </Link>
      </div>
    </div>
  );
}

