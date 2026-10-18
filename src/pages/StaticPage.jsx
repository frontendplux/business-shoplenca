import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../services/api';
import SEO from '../components/SEO';

export default function StaticPage({ pageGroup = 'about' }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [data, setData] = useState({ page_title: '', tabs: [], current: null });
  const [loading, setLoading] = useState(true);

  const tab = searchParams.get('tab') || '';
  const pageKey = pageGroup === 'privacy' ? 'privacy-policy' : pageGroup;

  useEffect(() => {
    setLoading(true);
    api.get('/pages', { page: pageKey, tab })
      .then((res) => {
        setData({
          page_title: res.page_title || 'Information',
          tabs: res.tabs || [],
          current: res.current || null,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [pageKey, tab]);

  const activeSec = data.current || data.tabs[0];

  return (
    <div className="bg-gray-100 min-h-screen py-8 pb-16">
      <SEO title={activeSec?.title || data.page_title} />

      <div className="max-w-6xl mx-auto px-3 sm:px-4">
        {loading ? (
          <div className="bg-white rounded-2xl p-8 animate-pulse h-72" />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Sidebar Tabs */}
            <aside className="lg:col-span-4 bg-white rounded-2xl p-3 shadow-sm border border-gray-100 space-y-1">
              {data.tabs.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => setSearchParams({ tab: sec.tab_slug })}
                  className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition ${
                    activeSec?.tab_slug === sec.tab_slug
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <i className={`bi ${sec.icon || 'bi-info-circle'} ${activeSec?.tab_slug === sec.tab_slug ? 'text-amber-400' : 'text-gray-400'}`}></i>
                  <span>{sec.title}</span>
                </button>
              ))}
            </aside>

            {/* Content Area */}
            <main className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-gray-100">
              {activeSec ? (
                <>
                  <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                    {activeSec.title}
                  </h1>
                  <div
                    className="prose max-w-none text-xs sm:text-sm text-gray-700 leading-relaxed space-y-4"
                    dangerouslySetInnerHTML={{ __html: activeSec.content }}
                  />
                </>
              ) : (
                <p className="text-xs text-gray-500">Content coming soon.</p>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
