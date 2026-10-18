import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import SEOHead from '../components/SEO';
import ProductCard from '../components/ProductCard';
import AdBanner from '../components/AdBanner';
import SkeletonLoader from '../components/SkeletonLoader';

const DELIVERY_LOCATIONS = [
  { state: 'Lagos', cities: ['Ikeja', 'Lekki / Ajah', 'Victoria Island', 'Surulere', 'Yaba', 'Ikorodu'] },
  { state: 'Abuja (FCT)', cities: ['Wuse / Maitama', 'Garki', 'Gwarinpa', 'Kubwa', 'Lugbe'] },
  { state: 'Rivers', cities: ['Port Harcourt GRA', 'Trans-Amadi', 'Choba', 'Eleme'] },
  { state: 'Oyo', cities: ['Ibadan North', 'Bodija', 'Ring Road', 'Challenge'] },
  { state: 'Kano', cities: ['Nassarawa', 'Fagge', 'Tarauni', 'Sabon Gari'] },
  { state: 'Global / International', cities: ['Express Air DHL/FedEx', 'Standard Priority Hub'] },
];

export default function ProductPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const slug = searchParams.get('slug') || '';
  const starFilter = Number(searchParams.get('star') || 0);
  const revPage = Number(searchParams.get('rp') || 1);

  const {
    user,
    company,
    currency,
    formatPrice,
    moneyFromNgn,
    addToCart,
    toggleWishlist,
    isWishlisted,
    showToast,
  } = useStore();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Delivery estimator state (Jumia sidebar)
  const [selectedState, setSelectedState] = useState(DELIVERY_LOCATIONS[0].state);
  const [selectedCity, setSelectedCity] = useState(DELIVERY_LOCATIONS[0].cities[0]);

  // Review state
  const [reviewStar, setReviewStar] = useState(5);
  const [reviewMsg, setReviewMsg] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [replyOpenId, setReplyOpenId] = useState(null);
  const [replyText, setReplyText] = useState('');

  const fetchProduct = async () => {
    if (!slug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getProductDetail(slug, {
        star: starFilter || undefined,
        rp: revPage > 1 ? revPage : undefined,
      });
      setData(res);
      const imgs = res?.product?.images || [];
      setActiveImage(imgs[0] || '');
      const sizes = res?.product?.sizes || [];
      const colors = res?.product?.colors || [];
      setSelectedSize(sizes[0] || '');
      setSelectedColor(colors[0] || '');
      setQuantity(1);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProduct();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, starFilter, revPage]);

  const handleStateChange = (newState) => {
    setSelectedState(newState);
    const found = DELIVERY_LOCATIONS.find((l) => l.state === newState);
    if (found && found.cities.length > 0) {
      setSelectedCity(found.cities[0]);
    }
  };

  const handleAddToCart = async (buyNow = false) => {
    if (!data?.product) return;
    const ok = await addToCart({
      product_id: data.product.id,
      quantity,
      size: selectedSize,
      color: selectedColor,
    });
    if (ok?.ok && buyNow) {
      navigate('/checkout');
    }
  };

  const handleReviewSubmit = async (e, parentId = null) => {
    e.preventDefault();
    if (!user) {
      showToast('Please sign in to post a review', 'error');
      navigate(`/login?redirect=${encodeURIComponent(`/product?slug=${slug}`)}`);
      return;
    }
    const msg = parentId ? replyText.trim() : reviewMsg.trim();
    if (!msg) return;

    setSubmittingReview(true);
    try {
      const res = await api.submitReview({
        product_id: data.product.id,
        star: parentId ? 5 : reviewStar,
        msg,
        parent_id: parentId,
      });
      if (res?.ok) {
        showToast(parentId ? 'Reply posted!' : 'Thank you! Your review has been published.', 'success');
        if (parentId) {
          setReplyText('');
          setReplyOpenId(null);
        } else {
          setReviewMsg('');
          setReviewStar(5);
        }
        fetchProduct();
      } else {
        showToast(res?.message || 'Could not post review', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Could not post review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <SkeletonLoader type="product" />
      </div>
    );
  }

  if (!data?.product) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <SEOHead title="Product Not Found" />
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10">
          <i className="bi bi-Bag-x text-5xl text-orange-400" />
          <h1 className="text-2xl font-extrabold mt-3 text-gray-800">Product Not Found</h1>
          <p className="text-sm text-gray-500 mt-1">
            This item may have been removed or is no longer available.
          </p>
          <Link
            to="/category"
            className="inline-block mt-5 px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider text-white bg-orange-500 hover:bg-orange-600 shadow"
          >
            Browse All Products
          </Link>
        </div>
      </div>
    );
  }

  const p = data.product;
  const rating = data.rating || { avg: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }, pages: 1 };
  const reviews = data.reviews || [];
  const related = data.related || [];
  const fromSeller = data.from_seller || [];
  const promo = data.subdomain_promo || {
    fee_ngn: 500,
    grace_days: 2,
    company_charge_pct: 2.5,
  };

  const inWish = isWishlisted(p.id);
  const savings = Math.max(0, Number(p.price) - Number(p.final_price));
  const feeInActiveCurrency = moneyFromNgn ? moneyFromNgn(promo.fee_ngn || 500) : '₦500';
  const currentCities =
    DELIVERY_LOCATIONS.find((l) => l.state === selectedState)?.cities || ['Central City'];

  return (
    <div className="bg-[#f1f1f2] min-h-screen pb-14">
      <SEOHead
        title={p.product_name}
        description={p.bullets?.[0] || p.product_name}
        keywords={p.keywords || p.product_name}
        ogImage={p.images?.[0]}
      />

      {/* Breadcrumb Bar (Jumia style compact breadcrumb) */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 text-xs text-gray-500 flex flex-wrap items-center gap-1.5">
        <Link to="/" className="hover:text-orange-500">
          Home
        </Link>
        <i className="bi bi-chevron-right text-[10px]" />
        {p.cat_name && (
          <>
            <Link to={`/category?slug=${encodeURIComponent(p.cat_slug)}`} className="hover:text-orange-500">
              {p.cat_name}
            </Link>
            <i className="bi bi-chevron-right text-[10px]" />
          </>
        )}
        {p.sub_name && (
          <>
            <Link
              to={`/category?slug=${encodeURIComponent(p.cat_slug)}&sub[]=${p.product_sub_category_id}`}
              className="hover:text-orange-500"
            >
              {p.sub_name}
            </Link>
            <i className="bi bi-chevron-right text-[10px]" />
          </>
        )}
        <span className="text-gray-800 font-semibold truncate max-w-xs">{p.product_name}</span>
      </div>

      {/* ====================================================================
          JUMIA 3-COLUMN MAIN PRODUCT CONTAINER
         ==================================================================== */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          {/* LEFT + CENTER WHITE CARD (9 COLS ON DESKTOP) */}
          <div className="lg:col-span-9 bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* COLUMN 1: GALLERY & SHARE (5 of 12 inside left card) */}
              <div className="md:col-span-5">
                <div className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                  <img
                    src={activeImage || p.images?.[0]}
                    alt={p.product_name}
                    className="w-full h-full object-contain p-2 transition-transform duration-300 hover:scale-105"
                  />
                  {Number(p.off_price) > 0 && (
                    <span className="absolute top-2.5 left-2.5 bg-orange-100 text-orange-600 text-xs font-extrabold px-2.5 py-1 rounded">
                      -{Math.round(Number(p.off_price))}%
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleWishlist(p.id)}
                    aria-label="Save to Wishlist"
                    className={`absolute top-2.5 right-2.5 w-9 h-9 rounded-full shadow flex items-center justify-center transition-colors cursor-pointer ${
                      inWish
                        ? 'bg-orange-500 text-white'
                        : 'bg-white text-orange-500 hover:bg-orange-50'
                    }`}
                  >
                    <i className={`bi ${inWish ? 'bi-heart-fill' : 'bi-heart'} text-base`} />
                  </button>
                  {p.instock <= 0 && (
                    <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                      <span className="bg-red-600 text-white text-xs font-extrabold uppercase tracking-widest px-4 py-2 rounded-lg">
                        Out of Stock
                      </span>
                    </div>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {p.images?.length > 1 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                    {p.images.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveImage(imgUrl)}
                        className={`w-14 h-14 rounded-lg overflow-hidden border-2 flex-shrink-0 cursor-pointer p-0.5 bg-white ${
                          activeImage === imgUrl
                            ? 'border-orange-500'
                            : 'border-gray-200 opacity-75 hover:opacity-100'
                        }`}
                      >
                        <img src={imgUrl} alt="" className="w-full h-full object-contain" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Share This Product */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                    Share This Product
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard?.writeText(window.location.href);
                        showToast('Product link copied to clipboard!', 'success');
                      }}
                      className="w-8 h-8 rounded-full border border-gray-300 hover:border-orange-500 hover:text-orange-500 flex items-center justify-center text-gray-600 cursor-pointer"
                      title="Copy Link"
                    >
                      <i className="bi bi-link-45deg" />
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(p.product_name + ' - ' + window.location.href)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 rounded-full border border-gray-300 hover:border-green-500 hover:text-green-600 flex items-center justify-center text-gray-600"
                      title="Share on WhatsApp"
                    >
                      <i className="bi bi-whatsapp text-xs" />
                    </a>
                    <a
                      href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(p.product_name)}&url=${encodeURIComponent(window.location.href)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-8 h-8 rounded-full border border-gray-300 hover:border-sky-500 hover:text-sky-500 flex items-center justify-center text-gray-600"
                      title="Share on X"
                    >
                      <i className="bi bi-twitter-x text-xs" />
                    </a>
                  </div>
                </div>
              </div>

              {/* COLUMN 2: JUMIA PRODUCT INFO, PRICE, VARIATIONS & CTA (7 of 12 inside left card) */}
              <div className="md:col-span-7 flex flex-col">
                {/* Official / Verified Store Badges Row */}
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-extrabold bg-[#264996] text-white">
                    <i className="bi bi-award-fill text-amber-300" /> Official Store
                  </span>
                  {p.vendor_verified ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[11px] font-extrabold bg-emerald-600 text-white shadow-xs">
                      <i className="bi bi-patch-check-fill" /> Verified Seller
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-gray-100 text-gray-700">
                      <i className="bi bi-shop" /> Marketplace Seller
                    </span>
                  )}
                  {p.domain_plan_active && p.subdomain && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      <i className="bi bi-globe2" /> {p.custom_domain || `${p.subdomain}.shoplenca.com`}
                    </span>
                  )}
                </div>

                {/* Product Title */}
                <h1 className="text-lg sm:text-xl font-bold text-gray-900 leading-snug">
                  {p.product_name}
                </h1>

                {/* Brand & Seller Line */}
                <div className="text-xs text-gray-600 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                  {p.brand_name && (
                    <span>
                      Brand:{' '}
                      <Link
                        to={`/category?brand[]=${p.brand_category_id}`}
                        className="text-blue-600 hover:underline font-semibold"
                      >
                        {p.brand_name}
                      </Link>{' '}
                      |{' '}
                      <Link
                        to={`/category?brand[]=${p.brand_category_id}`}
                        className="text-blue-600 hover:underline"
                      >
                        Similar products from {p.brand_name}
                      </Link>
                    </span>
                  )}
                </div>

                {/* Rating Row */}
                <div className="flex items-center gap-2 mt-2 pb-3 border-b border-gray-100">
                  <div className="flex items-center text-amber-400 text-sm">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <i
                        key={s}
                        className={`bi ${
                          s <= Math.round(rating.avg || 4.5) ? 'bi-star-fill' : 'bi-star text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <a href="#reviews" className="text-xs text-blue-600 hover:underline font-medium">
                    ({rating.count} verified rating{rating.count === 1 ? '' : 's'})
                  </a>
                </div>

                {/* Jumia Flash Sale / Price Banner */}
                <div className="mt-3 rounded-xl border border-orange-200 overflow-hidden">
                  {Number(p.off_price) > 0 && (
                    <div className="bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white px-3.5 py-1.5 flex items-center justify-between text-xs font-extrabold">
                      <span>
                        <i className="bi bi-lightning-charge-fill mr-1" /> Flash Deal · Special Offer
                      </span>
                      <span>Save {formatPrice(savings)}</span>
                    </div>
                  )}
                  <div className="p-3.5 bg-orange-50/40">
                    <div className="flex items-baseline flex-wrap gap-2.5">
                      <span className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                        {formatPrice(p.final_price)}
                      </span>
                      {Number(p.off_price) > 0 && (
                        <>
                          <span className="text-sm text-gray-400 line-through font-medium">
                            {formatPrice(p.price)}
                          </span>
                          <span className="bg-orange-100 text-orange-600 text-xs font-extrabold px-2 py-0.5 rounded">
                            -{Math.round(Number(p.off_price))}%
                          </span>
                        </>
                      )}
                    </div>

                    {/* Stock meter */}
                    <div className="mt-2 flex items-center gap-2 text-xs">
                      {p.instock > 0 ? (
                        <>
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                            <i className="bi bi-check-circle-fill" /> In stock ({p.instock} units available)
                          </span>
                          <div className="flex-1 max-w-[140px] h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 rounded-full"
                              style={{ width: `${Math.min(100, Math.max(20, p.instock * 5))}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-red-600 font-bold">
                          <i className="bi bi-x-circle-fill mr-1" /> Currently Out of Stock
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      + shipping from {formatPrice(company?.shipping_fee || 9.99)} (Free delivery on orders above{' '}
                      {formatPrice(company?.free_ship_min || 99)})
                    </p>
                  </div>
                </div>

                {/* Variations: Sizes */}
                {p.sizes?.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-extrabold uppercase text-gray-700">
                        Variation Available (Size): <span className="text-orange-600">{selectedSize}</span>
                      </label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {p.sizes.map((sz) => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedSize(sz)}
                          className={`px-3.5 py-1.5 rounded border text-xs font-bold transition-all cursor-pointer ${
                            selectedSize === sz
                              ? 'border-orange-500 bg-orange-50 text-orange-600'
                              : 'border-gray-300 text-gray-700 hover:border-orange-400'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variations: Colors */}
                {p.colors?.length > 0 && (
                  <div className="mt-3">
                    <label className="block text-xs font-extrabold uppercase text-gray-700 mb-1.5">
                      Colour: <span className="text-orange-600">{selectedColor}</span>
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {p.colors.map((clr) => (
                        <button
                          key={clr}
                          type="button"
                          onClick={() => setSelectedColor(clr)}
                          className={`px-3.5 py-1.5 rounded border text-xs font-bold transition-all cursor-pointer ${
                            selectedColor === clr
                              ? 'border-orange-500 bg-orange-50 text-orange-600'
                              : 'border-gray-300 text-gray-700 hover:border-orange-400'
                          }`}
                        >
                          {clr}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quantity + Jumia Orange ADD TO CART Button */}
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="w-9 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-200 cursor-pointer font-bold"
                    >
                      -
                    </button>
                    <span className="w-10 text-center text-sm font-extrabold">{quantity}</span>
                    <button
                      type="button"
                      onClick={() => setQuantity((q) => Math.min(p.instock || 10, q + 1))}
                      className="w-9 h-11 flex items-center justify-center text-gray-700 hover:bg-gray-200 cursor-pointer font-bold"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    disabled={p.instock <= 0}
                    onClick={() => handleAddToCart(false)}
                    className="flex-1 min-w-[180px] h-12 rounded-lg bg-[#f68b1e] hover:bg-[#e07912] text-white font-extrabold text-sm uppercase tracking-wider shadow-md flex items-center justify-center gap-2 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <i className="bi bi-cart-plus-fill text-lg" />
                    Add to Cart
                  </button>

                  <button
                    type="button"
                    disabled={p.instock <= 0}
                    onClick={() => handleAddToCart(true)}
                    className="h-12 px-5 rounded-lg bg-gradient-to-r from-indigo-900 via-purple-700 to-pink-600 hover:opacity-95 text-white font-extrabold text-xs uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-40"
                  >
                    <i className="bi bi-lightning-fill" /> Buy Now
                  </button>
                </div>

                {/* Jumia Promotions Section */}
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-gray-800 mb-2">
                    Promotions
                  </p>
                  <ul className="space-y-1.5 text-xs text-gray-700">
                    <li className="flex items-start gap-2">
                      <i className="bi bi-shield-fill-check text-orange-500 mt-0.5" />
                      <span>
                        Extra <strong>{company?.prepaid_discount || 10}% instant discount</strong> when you pay online via Paystack, Flutterwave, Stripe, or Wallet.
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <i className="bi bi-globe2 text-purple-600 mt-0.5" />
                      <span>
                        <Link to="/members?tab=domain" className="text-purple-700 font-bold hover:underline">
                          Own your own Subdomain & Custom Domain Store for just {feeInActiveCurrency}/month (NGN 500)
                        </Link>{' '}
                        — 100% control of your products, payments & charges with 0% company interference!
                      </span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* ================================================================
              COLUMN 3: JUMIA RIGHT SIDEBAR (3 COLS ON DESKTOP)
              1. Delivery & Returns
              2. Seller Information + Verified Badge
              3. Own Your Subdomain & Custom Domain Promo Box (NGN 500 converted)
             ================================================================ */}
          <div className="lg:col-span-3 space-y-4">
            {/* 1. DELIVERY & RETURNS CARD */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 font-extrabold text-xs uppercase tracking-wider text-gray-800">
                Delivery & Returns
              </div>
              <div className="p-4 space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 mb-1">
                    Choose your location
                  </label>
                  <select
                    value={selectedState}
                    onChange={(e) => handleStateChange(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-gray-300 text-xs font-semibold text-gray-800 mb-2 focus:outline-none focus:border-orange-500"
                  >
                    {DELIVERY_LOCATIONS.map((loc) => (
                      <option key={loc.state} value={loc.state}>
                        {loc.state}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full h-9 px-2.5 rounded-lg border border-gray-300 text-xs text-gray-700 focus:outline-none focus:border-orange-500"
                  >
                    {currentCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                    <i className="bi bi-truck text-base" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-gray-900">Door Delivery ({selectedCity})</p>
                    <p className="text-gray-500 text-[11px]">
                      Delivery Fee {formatPrice(company?.shipping_fee || 9.99)} (Free above{' '}
                      {formatPrice(company?.free_ship_min || 99)})
                    </p>
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      Ready for delivery between 24–48 hours when you order today
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2 border-t border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                    <i className="bi bi-arrow-counterclockwise text-base" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-gray-900">Return Policy</p>
                    <p className="text-gray-500 text-[11px]">
                      Free return within 7 days for all eligible items.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. SELLER INFORMATION CARD */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-gray-100 flex items-center justify-between">
                <span className="font-extrabold text-xs uppercase tracking-wider text-gray-800">
                  Seller Information
                </span>
                {p.vendor_verified && (
                  <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <i className="bi bi-patch-check-fill mr-1" />
                    Verified
                  </span>
                )}
              </div>
              <div className="p-4 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <p className="font-extrabold text-sm text-gray-900">{p.seller_display}</p>
                </div>
                {p.subdomain && (
                  <p className="text-[11px] text-purple-700 font-semibold">
                    <i className="bi bi-globe2 mr-1" />
                    Storefront: {p.custom_domain || `${p.subdomain}.shoplenca.com`}
                  </p>
                )}
                <div className="pt-2 border-t border-gray-100 space-y-1.5 text-[11px] text-gray-600">
                  <div className="flex justify-between">
                    <span>Seller Score:</span>
                    <strong className="text-emerald-600">96% Positive</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Order Fulfillment Rate:</span>
                    <strong className="text-emerald-600">Excellent</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Verification Status:</span>
                    <strong className={p.vendor_verified ? 'text-emerald-600' : 'text-gray-700'}>
                      {p.vendor_verified ? 'Admin Verified Seller' : 'Standard Seller'}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. PREMIUM SUBDOMAIN & CUSTOM DOMAIN OWNERSHIP PROMO CARD (NGN 500 converted to all currencies) */}
            <div className="rounded-xl shadow-lg overflow-hidden border-2 border-amber-400 bg-gradient-to-br from-indigo-950 via-purple-900 to-pink-900 text-white p-4 relative">
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-400 text-gray-950 text-[10px] font-extrabold uppercase tracking-wider mb-2">
                <i className="bi bi-stars" /> Premium Store Ownership
              </div>
              <h3 className="text-sm font-extrabold leading-snug">
                Own Your Own Subdomain & Add Your Custom Domain!
              </h3>
              <div className="mt-2 bg-white/10 border border-white/20 rounded-lg p-2.5">
                <div className="text-[11px] text-amber-200 font-semibold">Starting at just</div>
                <div className="text-xl font-black text-amber-300 leading-tight">
                  {feeInActiveCurrency} <span className="text-xs font-normal text-white/85">/ month</span>
                </div>
                {currency?.code !== 'NGN' && (
                  <div className="text-[10px] text-white/75">
                    (Base price: <strong>NGN {promo.fee_ngn || 500}/mo</strong> auto-converted to {currency?.code})
                  </div>
                )}
              </div>

              <ul className="mt-3 space-y-1.5 text-[11px] text-white/90">
                <li className="flex items-start gap-1.5">
                  <i className="bi bi-check-circle-fill text-amber-300 mt-0.5 shrink-0" />
                  <span>
                    Get <strong>yourname.shoplenca.com</strong> + attach your own{' '}
                    <strong>custom domain (www.yourbrand.com)</strong> under our product.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <i className="bi bi-check-circle-fill text-amber-300 mt-0.5 shrink-0" />
                  <span>
                    <strong>Zero Company Interference:</strong> Company owners control their own products, payments & charges directly.
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <i className="bi bi-check-circle-fill text-amber-300 mt-0.5 shrink-0" />
                  <span>
                    <strong>Company Wallet Option:</strong> Or use our Company Wallet & receive payouts in your database wallet with transparent company charges ({promo.company_charge_pct || 2.5}%).
                  </span>
                </li>
                <li className="flex items-start gap-1.5">
                  <i className="bi bi-clock-history text-amber-300 mt-0.5 shrink-0" />
                  <span>
                    Pay monthly or for <strong>1+ years</strong>. Includes a{' '}
                    <strong>{promo.grace_days || 2}-day extra grace period</strong> before closure &{' '}
                    <strong>reopens anytime you pay!</strong>
                  </span>
                </li>
              </ul>

              <Link
                to="/members?tab=domain"
                className="mt-3.5 w-full py-2.5 px-3 rounded-lg bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-gray-950 font-extrabold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-md"
              >
                <i className="bi bi-rocket-takeoff-fill" /> Own Your Store ({feeInActiveCurrency}/mo)
              </Link>
            </div>
          </div>
        </div>

        {/* ====================================================================
            PRODUCT DETAILS (RICH HTML) & SPECIFICATIONS (JUMIA CARDS)
           ==================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mt-5">
          {/* Product Details & Rich Description */}
          <div className="lg:col-span-7 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 font-extrabold text-sm uppercase tracking-wider text-gray-900">
              Product Details
            </div>
            <div className="p-5">
              {p.description && /<[a-z][\s\S]*>/i.test(p.description) ? (
                <div
                  className="rich-html-content text-sm text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: p.description }}
                />
              ) : (
                <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                  {p.description || 'Authentic quality product backed by our 7-day buyer protection policy.'}
                </div>
              )}

              {p.bullets?.length > 0 && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-700 mb-2">
                    Key Highlights
                  </h4>
                  <ul className="space-y-1.5 text-sm text-gray-700">
                    {p.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <i className="bi bi-check2-circle text-orange-500 mt-0.5" />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Specifications Box */}
          <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-100 font-extrabold text-sm uppercase tracking-wider text-gray-900">
              Specifications
            </div>
            <div className="p-5">
              {p.spec_rows && Object.keys(p.spec_rows).length > 0 ? (
                <dl className="divide-y divide-gray-100 text-sm">
                  {Object.entries(p.spec_rows).map(([k, v]) => (
                    <div key={k} className="py-2.5 flex justify-between gap-4">
                      <dt className="text-gray-500 font-medium">{k}</dt>
                      <dd className="text-gray-900 font-bold text-right">{v}</dd>
                    </div>
                  ))}
                  <div className="py-2.5 flex justify-between gap-4">
                    <dt className="text-gray-500 font-medium">SKU</dt>
                    <dd className="text-gray-900 font-mono text-xs font-bold">
                      BG-{String(p.id).padStart(5, '0')}
                    </dd>
                  </div>
                </dl>
              ) : (
                <p className="text-sm text-gray-500">Standard manufacturer specifications apply.</p>
              )}
            </div>
          </div>
        </div>

        {/* Google AdSense / AdMob Product Placement */}
        <AdBanner placement="product" />

        {/* ====================================================================
            VERIFIED CUSTOMER FEEDBACK & REVIEWS
           ==================================================================== */}
        <section id="reviews" className="mt-5 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-900">
              Verified Customer Feedback ({rating.count})
            </h2>
            {starFilter > 0 && (
              <button
                type="button"
                onClick={() => setSearchParams({ slug })}
                className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
              >
                Show all reviews
              </button>
            )}
          </div>

          <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left: Rating Histogram + Write Review */}
            <div className="lg:col-span-4 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-4">
                  <div className="text-center bg-white rounded-xl p-3 border border-gray-100 min-w-[90px]">
                    <div className="text-3xl font-black text-orange-500">{rating.avg || '0.0'}/5</div>
                    <div className="text-[11px] text-gray-500 mt-0.5">{rating.count} ratings</div>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((s) => {
                      const cnt = rating.distribution?.[s] || 0;
                      const pct = rating.count > 0 ? Math.round((cnt / rating.count) * 100) : 0;
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() =>
                            setSearchParams(
                              starFilter === s ? { slug } : { slug, star: String(s) }
                            )
                          }
                          className={`w-full flex items-center gap-2 text-xs cursor-pointer ${
                            starFilter === s ? 'font-bold text-orange-600' : 'text-gray-600'
                          }`}
                        >
                          <span className="w-8 text-right">
                            {s} <i className="bi bi-star-fill text-amber-400" />
                          </span>
                          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="w-7 text-left text-[11px]">({cnt})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Write a Review Form */}
              <form
                onSubmit={(e) => handleReviewSubmit(e, null)}
                className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-100"
              >
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-800">
                  Rate & Review This Product
                </h3>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setReviewStar(s)}
                      className="text-xl cursor-pointer"
                    >
                      <i
                        className={`bi ${
                          s <= reviewStar ? 'bi-star-fill text-amber-400' : 'bi-star text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-gray-600 ml-2">{reviewStar} / 5</span>
                </div>
                <textarea
                  rows={3}
                  value={reviewMsg}
                  onChange={(e) => setReviewMsg(e.target.value)}
                  placeholder="Share your honest experience with this product..."
                  required
                  className="w-full p-3 rounded-lg bg-white border border-gray-200 text-sm focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="w-full py-2.5 rounded-lg text-xs font-extrabold uppercase tracking-wider text-white bg-[#f68b1e] hover:bg-[#e07912] cursor-pointer"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>

            {/* Right: Reviews List */}
            <div className="lg:col-span-8">
              {reviews.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <i className="bi bi-chat-square-quote text-4xl" />
                  <p className="mt-2 text-sm">No customer reviews yet. Be the first to review this product!</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {reviews.map((rv) => (
                    <div key={rv.id} className="py-4 first:pt-0">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-amber-400 text-xs gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <i key={s} className={`bi ${s <= rv.star ? 'bi-star-fill' : 'bi-star text-gray-300'}`} />
                          ))}
                        </div>
                        <span className="text-[11px] text-gray-400">{rv.created_at}</span>
                      </div>
                      <p className="text-sm text-gray-800 mt-1.5 leading-relaxed">{rv.msg}</p>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-gray-500">
                          by <strong className="text-gray-700">{rv.firstname} {rv.lastname}</strong>{' '}
                          <span className="text-emerald-600 font-semibold ml-1">
                            <i className="bi bi-patch-check-fill" /> Verified Purchase
                          </span>
                        </span>
                        {user && (
                          <button
                            type="button"
                            onClick={() => setReplyOpenId(replyOpenId === rv.id ? null : rv.id)}
                            className="text-xs font-bold text-orange-600 hover:underline cursor-pointer"
                          >
                            Reply
                          </button>
                        )}
                      </div>

                      {rv.replies?.length > 0 && (
                        <div className="mt-2.5 pl-4 border-l-2 border-orange-200 space-y-2">
                          {rv.replies.map((rep) => (
                            <div key={rep.id} className="bg-orange-50/50 rounded-lg p-2.5 text-xs">
                              <div className="flex justify-between font-bold text-gray-800">
                                <span>
                                  <i className="bi bi-shop text-orange-500 mr-1" />
                                  {rep.firstname} {rep.lastname}
                                </span>
                                <span className="text-[10px] text-gray-400">{rep.created_at}</span>
                              </div>
                              <p className="text-gray-600 mt-1">{rep.msg}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {replyOpenId === rv.id && (
                        <form onSubmit={(e) => handleReviewSubmit(e, rv.id)} className="mt-2.5 flex gap-2">
                          <input
                            type="text"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder="Write a reply..."
                            className="flex-1 h-9 px-3 rounded-lg border border-gray-200 text-xs focus:outline-none focus:border-orange-500"
                          />
                          <button
                            type="submit"
                            className="px-4 h-9 rounded-lg bg-orange-500 text-white text-xs font-bold cursor-pointer"
                          >
                            Post
                          </button>
                        </form>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* MORE FROM SELLER */}
        {fromSeller.length > 0 && (
          <section className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 mb-4">
              More From {p.seller_display}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {fromSeller.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}

        {/* RELATED PRODUCTS */}
        {related.length > 0 && (
          <section className="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h2 className="text-sm font-extrabold uppercase tracking-wider text-gray-900 mb-4">
              Customers Who Viewed This Also Viewed
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
