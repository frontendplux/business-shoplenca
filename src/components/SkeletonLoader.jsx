import React from 'react';

/**
 * Bootstrap-Style Placeholder Loading Skeletons built in Tailwind CSS
 * Supports .placeholder-glow and .placeholder-wave shimmer effects
 *
 * @param {'home' | 'product' | 'dashboard' | 'cards'} type
 * @param {number} count
 */
export default function SkeletonLoader({ type = 'cards', count = 8 }) {
  if (type === 'home') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-10 placeholder-glow" aria-hidden="true">
        {/* Hero Placeholder */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-8 rounded-3xl bg-white p-8 border border-gray-100 shadow-sm space-y-5">
            <div className="h-6 w-44 rounded-full placeholder-wave placeholder-box" />
            <div className="h-11 w-4/5 rounded-2xl placeholder-wave placeholder-box" />
            <div className="h-11 w-3/5 rounded-2xl placeholder-wave placeholder-box" />
            <div className="h-4 w-2/3 rounded-lg placeholder-wave placeholder-box" />
            <div className="flex gap-3 pt-3">
              <div className="h-12 w-40 rounded-xl placeholder-wave placeholder-box" />
              <div className="h-12 w-36 rounded-xl placeholder-wave placeholder-box" />
            </div>
          </div>
          <div className="lg:col-span-4 flex flex-col gap-5">
            <div className="flex-1 rounded-3xl bg-white p-6 border border-gray-100 shadow-sm space-y-3">
              <div className="h-5 w-32 rounded-full placeholder-wave placeholder-box" />
              <div className="h-7 w-3/4 rounded-xl placeholder-wave placeholder-box" />
              <div className="h-4 w-full rounded-lg placeholder-wave placeholder-box" />
              <div className="h-10 w-36 rounded-xl placeholder-wave placeholder-box mt-2" />
            </div>
            <div className="flex-1 rounded-3xl bg-white p-6 border border-gray-100 shadow-sm space-y-3">
              <div className="h-5 w-28 rounded-full placeholder-wave placeholder-box" />
              <div className="h-7 w-2/3 rounded-xl placeholder-wave placeholder-box" />
              <div className="h-4 w-5/6 rounded-lg placeholder-wave placeholder-box" />
            </div>
          </div>
        </div>

        {/* Circular Categories Placeholder */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="h-6 w-48 rounded-lg placeholder-wave placeholder-box mb-6" />
          <div className="grid grid-cols-3 sm:grid-cols-7 gap-4">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2.5">
                <div className="w-20 h-20 rounded-full placeholder-wave placeholder-box" />
                <div className="h-3.5 w-16 rounded placeholder-wave placeholder-box" />
              </div>
            ))}
          </div>
        </div>

        {/* Product Inventory Section Placeholder */}
        {[1, 2].map((sec) => (
          <div key={sec} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="space-y-2">
                <div className="h-6 w-56 rounded-lg placeholder-wave placeholder-box" />
                <div className="h-3.5 w-80 rounded placeholder-wave placeholder-box" />
              </div>
              <div className="h-9 w-28 rounded-xl placeholder-wave placeholder-box" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="rounded-2xl border border-gray-100 p-3.5 space-y-3">
                  <div className="h-48 w-full rounded-xl placeholder-wave placeholder-box" />
                  <div className="h-3 w-1/3 rounded placeholder-wave placeholder-box" />
                  <div className="h-4 w-11/12 rounded placeholder-wave placeholder-box" />
                  <div className="h-4 w-2/3 rounded placeholder-wave placeholder-box" />
                  <div className="flex items-center justify-between pt-2">
                    <div className="h-6 w-20 rounded-lg placeholder-wave placeholder-box" />
                    <div className="h-9 w-9 rounded-xl placeholder-wave placeholder-box" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (type === 'product') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 placeholder-glow" aria-hidden="true">
        <div className="h-4 w-64 rounded placeholder-wave placeholder-box mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-9 bg-white rounded-2xl p-6 border border-gray-100 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-5 space-y-3">
              <div className="h-80 w-full rounded-2xl placeholder-wave placeholder-box" />
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="h-16 rounded-xl placeholder-wave placeholder-box" />
                ))}
              </div>
            </div>
            <div className="md:col-span-7 space-y-4">
              <div className="h-5 w-32 rounded-full placeholder-wave placeholder-box" />
              <div className="h-8 w-4/5 rounded-xl placeholder-wave placeholder-box" />
              <div className="h-4 w-48 rounded placeholder-wave placeholder-box" />
              <div className="h-24 w-full rounded-2xl placeholder-wave placeholder-box" />
              <div className="h-12 w-full rounded-xl placeholder-wave placeholder-box" />
            </div>
          </div>
          <div className="lg:col-span-3 space-y-4">
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
              <div className="h-5 w-40 rounded placeholder-wave placeholder-box" />
              <div className="h-16 w-full rounded-xl placeholder-wave placeholder-box" />
              <div className="h-16 w-full rounded-xl placeholder-wave placeholder-box" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'dashboard') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6 placeholder-glow" aria-hidden="true">
        {/* Header Banner Skeleton */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="w-16 h-16 rounded-2xl placeholder-wave placeholder-box shrink-0" />
            <div className="space-y-2.5 flex-1">
              <div className="h-6 w-48 rounded-lg placeholder-wave placeholder-box" />
              <div className="h-4 w-72 rounded placeholder-wave placeholder-box" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-32 rounded-xl placeholder-wave placeholder-box" />
            <div className="h-10 w-32 rounded-xl placeholder-wave placeholder-box" />
          </div>
        </div>

        {/* Stat Cards Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
              <div className="w-10 h-10 rounded-xl placeholder-wave placeholder-box" />
              <div className="h-7 w-24 rounded-lg placeholder-wave placeholder-box" />
              <div className="h-3.5 w-32 rounded placeholder-wave placeholder-box" />
            </div>
          ))}
        </div>

        {/* Main Content Table/Panel Skeleton */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-4">
          <div className="h-6 w-56 rounded-lg placeholder-wave placeholder-box mb-2" />
          {[1, 2, 3, 4, 5].map((r) => (
            <div key={r} className="flex items-center justify-between gap-4 py-3 border-b border-gray-50">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-12 h-12 rounded-xl placeholder-wave placeholder-box shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-1/3 rounded placeholder-wave placeholder-box" />
                  <div className="h-3 w-1/2 rounded placeholder-wave placeholder-box" />
                </div>
              </div>
              <div className="h-8 w-28 rounded-xl placeholder-wave placeholder-box" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default: Product Cards Grid Skeleton
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 placeholder-glow" aria-hidden="true">
      {Array.from({ length: count }).map((_, idx) => (
        <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-3.5 shadow-sm space-y-3">
          <div className="h-48 w-full rounded-xl placeholder-wave placeholder-box" />
          <div className="h-3 w-1/3 rounded placeholder-wave placeholder-box" />
          <div className="h-4 w-11/12 rounded placeholder-wave placeholder-box" />
          <div className="h-4 w-2/3 rounded placeholder-wave placeholder-box" />
          <div className="flex items-center justify-between pt-2">
            <div className="h-6 w-20 rounded-lg placeholder-wave placeholder-box" />
            <div className="h-9 w-24 rounded-xl placeholder-wave placeholder-box" />
          </div>
        </div>
      ))}
    </div>
  );
}

