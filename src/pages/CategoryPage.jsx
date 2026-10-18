import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useStore } from '../context/StoreContext';
import SEO from '../components/SEO';
import ProductCard from '../components/ProductCard';
import AdBanner from '../components/AdBanner';
import SkeletonLoader from '../components/SkeletonLoader';

export default function CategoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currency } = useStore();

  const [data, setData] = useState({
    title: 'All Products',
    description: '',
    products: [],
    total: 0,
    page: 1,
    pages: 1,
    sub_facets: [],
    brand_facets: [],
    all_categories: [],
  });
  const [loading, setLoading] = useState(true);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const [minPriceInput, setMinPriceInput] = useState(searchParams.get('min') || '');
  const [maxPriceInput, setMaxPriceInput] = useState(searchParams.get('max') || '');

  useEffect(() => {
    setMinPriceInput(searchParams.get('min') || '');
    setMaxPriceInput(searchParams.get('max') || '');

    let mounted = true;
    setLoading(true);
    const paramsObj = Object.fromEntries(searchParams.entries());
    api.get('/products', paramsObj)
      .then((res) => {
        if (mounted) {
          setData({
            title: res.title || 'All Products',
            description: res.description || '',
            products: res.products || [],
            total: res.total || 0,
            page: res.page || 1,
            pages: res.pages || 1,
            sub_facets: res.sub_facets || [],
            brand_facets: res.brand_facets || [],
            all_categories: res.all_categories || [],
          });
          setLoading(false);
        }
      })
      .catch(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [searchParams]);

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value === '' || value === null || value === undefined || value === false) {
      next.delete(key);
    } else {
      next.set(key, String(value));
    }
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  };

  const toggleMultiValue = (key, id) => {
    const current = (searchParams.get(key) || '').split(',').filter(Boolean);
    const strId = String(id);
    const exists = current.includes(strId);
    const updated = exists ? current.filter((x) => x !== strId) : [...current, strId];
    updateFilter(key, updated.join(','));
  };

  const applyPriceFilter = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (minPriceInput) next.set('min', minPriceInput);
    else next.delete('min');
    if (maxPriceInput) next.set('max', maxPriceInput);
    else next.delete('max');
    next.delete('page');
    setSearchParams(next);
  };

  const clearAllFilters = () => {
    const next = new URLSearchParams();
    if (searchParams.get('slug')) next.set('slug', searchParams.get('slug'));
    if (searchParams.get('q')) next.set('q', searchParams.get('q'));
    if (searchParams.get('inv')) next.set('inv', searchParams.get('inv'));
    setSearchParams(next);
  };

  const selectedSubs = (searchParams.get('sub') || '').split(',').filter(Boolean);
  const selectedBrands = (searchParams.get('brand') || '').split(',').filter(Boolean);
  const activeRating = Number(searchParams.get('rating') || 0);
  const activeDiscount = Number(searchParams.get('discount') || 0);
  const inStockOnly = searchParams.get('stock') === '1';
  const currentSort = searchParams.get('sort') || 'popular';

  return (
    <div className="bg-gray-100 min-h-screen py-6">
      <SEO
        title={data.title || 'Shop Products'}
        description={data.description || `Browse ${data.title} with verified reviews and fast shipping.`}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-500 mb-4 flex-wrap">
          <Link to="/" className="hover:text-amber-600">Home</Link>
          <i className="bi bi-chevron-right text-[10px] text-gray-400"></i>
          <span className="font-semibold text-gray-800">{data.title}</span>
        </nav>

        {/* Title Header */}
        <div className="bg-white rounded-xl p-4 sm:p-5 shadow-sm border border-gray-100 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg sm:text-2xl font-extrabold text-gray-900">
              {data.title} <span className="text-xs font-normal text-gray-400">({data.total} items)</span>
            </h1>
            {data.description && (
              <p className="text-xs text-gray-500 mt-0.5">{data.description}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="lg:hidden inline-flex items-center gap-2 bg-gray-900 text-white text-xs font-bold px-3.5 py-2 rounded-lg"
            >
              <i className="bi bi-sliders"></i>
              <span>Filters</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 hidden sm:inline">Sort by:</span>
              <select
                value={currentSort}
                onChange={(e) => updateFilter('sort', e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-gray-800 focus:outline-none focus:border-amber-500"
              >
                <option value="popular">Popularity</option>
                <option value="new">Newest Arrivals</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating">Customer Rating</option>
                <option value="discount">Biggest Discount</option>
              </select>
            </div>
          </div>
        </div>

        {/* Google AdSense / AdMob Category Slot */}
        <AdBanner placement="category" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT FILTER SIDEBAR */}
          <aside
            className={`${
              mobileFilterOpen
                ? 'fixed inset-0 z-50 bg-black/50 flex justify-end lg:static lg:bg-transparent lg:block'
                : 'hidden lg:block'
            } lg:col-span-3`}
          >
            <div className="bg-white w-80 lg:w-full h-full lg:h-auto overflow-y-auto lg:rounded-xl shadow-sm border border-gray-100 p-4 space-y-5">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h2 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <i className="bi bi-funnel-fill text-amber-500"></i>
                  Filters
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={clearAllFilters}
                    className="text-[11px] font-semibold text-amber-600 hover:underline"
                  >
                    Reset
                  </button>
                  <button
                    onClick={() => setMobileFilterOpen(false)}
                    className="lg:hidden text-gray-400 hover:text-gray-700"
                  >
                    <i className="bi bi-x-lg text-base"></i>
                  </button>
                </div>
              </div>

              {/* Categories Facet */}
              {data.all_categories?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gray-800 uppercase mb-2">Department</h3>
                  <ul className="space-y-1 max-h-48 overflow-y-auto pr-1">
                    {data.all_categories.map((c) => (
                      <li key={c.id}>
                        <button
                          onClick={() => updateFilter('slug', c.slug)}
                          className={`w-full text-left text-xs py-1 px-2 rounded flex items-center justify-between transition ${
                            searchParams.get('slug') === c.slug
                              ? 'bg-amber-50 text-amber-700 font-bold'
                              : 'text-gray-600 hover:bg-gray-50'
                          }`}
                        >
                          <span className="truncate">{c.name}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Subcategories Facet */}
              {data.sub_facets?.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-bold text-gray-800 uppercase mb-2">Subcategory</h3>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {data.sub_facets.map((sub) => (
                      <label key={sub.id} className="flex items-center justify-between text-xs text-gray-700 cursor-pointer">
                        <span className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={selectedSubs.includes(String(sub.id))}
                            onChange={() => toggleMultiValue('sub', sub.id)}
                            className="rounded text-amber-500 focus:ring-amber-400"
                          />
                          <span className="truncate">{sub.name}</span>
                        </span>
                        <span className="text-[10px] text-gray-400">{sub.c}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Brands Facet */}
              {data.brand_facets?.length > 0 && (
                <div className="border-t border-gray-100 pt-4">
                  <h3 className="text-xs font-bold text-gray-800 uppercase mb-2">Brand</h3>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                    {data.brand_facets.map((b) => (
                      <label key={b.id} className="flex items-center justify-between text-xs text-gray-700 cursor-pointer">
                        <span className="flex items-center gap-2 truncate">
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(String(b.id))}
                            onChange={() => toggleMultiValue('brand', b.id)}
                            className="rounded text-amber-500 focus:ring-amber-400"
                          />
                          <span className="truncate">{b.name}</span>
                        </span>
                        <span className="text-[10px] text-gray-400">{b.c}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Price Filter */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase mb-2">
                  Price ({currency.symbol})
                </h3>
                <form onSubmit={applyPriceFilter} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      placeholder="Min"
                      value={minPriceInput}
                      onChange={(e) => setMinPriceInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg"
                    />
                    <span className="text-gray-400">-</span>
                    <input
                      type="number"
                      min="0"
                      placeholder="Max"
                      value={maxPriceInput}
                      onChange={(e) => setMaxPriceInput(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs border border-gray-200 rounded-lg"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-gray-900 hover:bg-amber-500 hover:text-gray-950 text-white font-bold text-xs py-1.5 rounded-lg transition"
                  >
                    Apply Price
                  </button>
                </form>
              </div>

              {/* Rating Filter */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase mb-2">Customer Rating</h3>
                <div className="space-y-1.5">
                  {[4, 3].map((stars) => (
                    <button
                      key={stars}
                      onClick={() => updateFilter('rating', activeRating === stars ? '' : stars)}
                      className={`w-full flex items-center gap-2 text-xs py-1 px-2 rounded ${
                        activeRating === stars ? 'bg-amber-50 font-bold text-amber-800' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <span className="flex text-amber-400">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <i key={idx} className={`bi ${idx < stars ? 'bi-star-fill' : 'bi-star'}`}></i>
                        ))}
                      </span>
                      <span>& Up</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount Filter */}
              <div className="border-t border-gray-100 pt-4">
                <h3 className="text-xs font-bold text-gray-800 uppercase mb-2">Discount Percentage</h3>
                <div className="space-y-1">
                  {[50, 25, 10].map((disc) => (
                    <button
                      key={disc}
                      onClick={() => updateFilter('discount', activeDiscount === disc ? '' : disc)}
                      className={`w-full text-left text-xs py-1 px-2 rounded ${
                        activeDiscount === disc ? 'bg-amber-50 font-bold text-amber-700' : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {disc}% or more
                    </button>
                  ))}
                </div>
              </div>

              {/* Availability */}
              <div className="border-t border-gray-100 pt-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStockOnly}
                    onChange={(e) => updateFilter('stock', e.target.checked ? '1' : '')}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>In Stock Only</span>
                </label>
              </div>
            </div>
          </aside>

          {/* MAIN PRODUCT GRID */}
          <div className="lg:col-span-9">
            {loading ? (
              <SkeletonLoader type="cards" count={8} />
            ) : data.products.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow-sm border border-gray-100">
                <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
                  <i className="bi bi-box-seam text-2xl"></i>
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-1">No matching products found</h3>
                <p className="text-xs text-gray-500 mb-5">
                  Try clearing some filters or searching for another keyword.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs px-5 py-2.5 rounded-lg transition"
                >
                  Clear All Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-4">
                  {data.products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {data.pages > 1 && (
                  <div className="mt-8 flex items-center justify-center gap-1.5">
                    {Array.from({ length: data.pages }).map((_, idx) => {
                      const p = idx + 1;
                      return (
                        <button
                          key={p}
                          onClick={() => updateFilter('page', p)}
                          className={`w-9 h-9 rounded-lg text-xs font-bold transition ${
                            data.page === p
                              ? 'bg-gray-900 text-white shadow'
                              : 'bg-white text-gray-700 hover:bg-amber-50 border border-gray-200'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
