import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import SEO from '../components/SEO';
import AdBanner from '../components/AdBanner';

export default function BlogPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const slug = searchParams.get('slug') || '';
  const category = searchParams.get('category') || '';
  const q = searchParams.get('q') || '';
  const page = Number(searchParams.get('page') || 1);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    if (slug) {
      api.get('/blog', { slug })
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      api.get('/blog', { category, q, page })
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, category, q, page]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl p-8 animate-pulse h-80" />
      </div>
    );
  }

  // Single Blog Article View
  if (slug && data?.post) {
    const post = data.post;
    const author = [post.firstname, post.lastname].filter(Boolean).join(' ') || 'Editorial Team';
    return (
      <div className="bg-gray-100 min-h-screen py-8 pb-16">
        <SEO title={post.title} description={post.excerpt} image={post.image} type="article" />

        <div className="max-w-4xl mx-auto px-4">
          <Link to="/blog" className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 hover:underline mb-4">
            <i className="bi bi-arrow-left"></i>
            <span>Back to Editorial Journal</span>
          </Link>

          <article className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100">
            {post.image && (
              <div className="aspect-[16/8] bg-gray-900">
                <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="p-6 sm:p-10">
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                <span className="bg-amber-50 text-amber-700 font-extrabold px-2.5 py-0.5 rounded-full">
                  {post.category}
                </span>
                <span>By <strong>{author}</strong></span>
                <span>&bull;</span>
                <span>{post.read_min || 5} min read</span>
                <span>&bull;</span>
                <span>{post.views || 1} views</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight mb-6">
                {post.title}
              </h1>

              <AdBanner placement="article" />

              <div
                className="rich-html-content max-w-none text-sm sm:text-base text-gray-700 leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{ __html: post.content || post.excerpt }}
              />
            </div>
          </article>
        </div>
      </div>
    );
  }

  // Blog Listing View
  const featured = data?.featured;
  const posts = data?.posts || [];
  const categories = data?.blog_cats || [];

  return (
    <div className="bg-gray-100 min-h-screen py-8 pb-16">
      <SEO title="Editorial Journal & Shopping Guides" />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-6">
        <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-10 text-white">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
            Editorial Journal
          </span>
          <h1 className="text-2xl sm:text-4xl font-extrabold mt-1">
            Style Guides, Tech Reviews & Insider Stories
          </h1>
          <div className="flex flex-wrap gap-2 mt-5">
            <button
              onClick={() => setSearchParams({})}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                !category ? 'bg-amber-500 text-gray-950' : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              All Topics
            </button>
            {categories.map((c, idx) => (
              <button
                key={idx}
                onClick={() => setSearchParams({ category: c.category })}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                  category === c.category ? 'bg-amber-500 text-gray-950' : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {c.category} ({c.total})
              </button>
            ))}
          </div>
        </div>

        {/* Featured Post */}
        {featured && (
          <Link
            to={`/blog?slug=${encodeURIComponent(featured.slug)}`}
            className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 grid grid-cols-1 lg:grid-cols-12 group hover:shadow-md transition"
          >
            <div className="lg:col-span-7 aspect-[16/9] bg-gray-100 overflow-hidden">
              <img
                src={featured.image || 'https://placehold.co/1000x600/f3e8ff/7b1d8e?text=Blog'}
                alt={featured.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            </div>
            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-center">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 mb-2">
                Featured &bull; {featured.category}
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 group-hover:text-amber-600 mb-3">
                {featured.title}
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">
                {featured.excerpt}
              </p>
              <span className="text-xs font-bold text-amber-600">
                Read Full Story &rarr;
              </span>
            </div>
          </Link>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => {
            const author = [post.firstname, post.lastname].filter(Boolean).join(' ') || 'Editorial Team';
            return (
              <Link
                key={post.id}
                to={`/blog?slug=${encodeURIComponent(post.slug)}`}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col group"
              >
                <div className="aspect-[16/10] bg-gray-100 overflow-hidden">
                  <img
                    src={post.image || 'https://placehold.co/1000x600/f3e8ff/7b1d8e?text=Blog'}
                    alt={post.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-600">
                      {post.category}
                    </span>
                    <h2 className="text-sm sm:text-base font-extrabold text-gray-900 group-hover:text-amber-600 mt-1 mb-2 line-clamp-2">
                      {post.title}
                    </h2>
                    <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed">
                      {post.excerpt}
                    </p>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-gray-400 pt-4 mt-4 border-t border-gray-100">
                    <span>{author}</span>
                    <span>{post.read_min || 5} min read</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
