import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useStore } from '../context/StoreContext';

export function StarRating({ avg = 0, count = null, sizeClass = 'text-[10px]' }) {
  const rounded = Math.round(Number(avg) || 0);
  return (
    <div className={`flex items-center gap-0.5 text-amber-400 ${sizeClass}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <i key={i} className={`bi ${i <= rounded ? 'bi-star-fill' : 'bi-star'}`} />
      ))}
      {count !== null && <span className="text-gray-400 ml-0.5">({count})</span>}
    </div>
  );
}

export default function ProductCard({ product, variant = 'trending' }) {
  const { money, addToCart, toggleWishlist, wishlistIds } = useStore();
  const navigate = useNavigate();
  const [adding, setAdding] = useState(false);

  const pid = product.id;
  const inWish = wishlistIds.includes(pid);
  const outOfStock = Number(product.instock ?? 1) <= 0;
  const img =
    product.image || 'https://placehold.co/300x400/f3e8ff/7b1d8e?text=Product';

  const handleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const res = await toggleWishlist(pid);
    if (res?.login) navigate('/login');
  };

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (outOfStock || adding) return;
    setAdding(true);
    const res = await addToCart(pid, 1);
    setAdding(false);
    if (res?.login) navigate('/login');
  };

  if (variant === 'new') {
    return (
      <Link
        to={`/product?slug=${encodeURIComponent(product.slug)}`}
        className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow p-2 flex flex-col justify-between h-full group"
      >
        <div className="relative rounded-lg overflow-hidden bg-rose-50/40 aspect-[3/4]">
          <span className="absolute top-2 left-2 z-10 bg-orange-500 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded uppercase">
            New
          </span>
          <img
            src={img}
            alt={product.product_name}
            loading="lazy"
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="mt-2 text-center">
          <h3 className="text-[11px] font-medium text-gray-700 truncate group-hover:text-pink-600">
            {product.product_name}
          </h3>
          <p className="text-xs font-bold text-gray-900 mt-0.5">
            {money(product.final_price)}
          </p>
        </div>
      </Link>
    );
  }

  if (variant === 'best') {
    return (
      <Link
        to={`/product?slug=${encodeURIComponent(product.slug)}`}
        className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow p-2 flex flex-col justify-between h-full group"
      >
        <div className="relative rounded-lg overflow-hidden bg-rose-50/50 aspect-[3/4]">
          {product.off_price > 0 && (
            <span className="absolute top-2 left-2 z-10 bg-pink-600 text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded">
              -{Math.round(product.off_price)}%
            </span>
          )}
          <img
            src={img}
            alt={product.product_name}
            loading="lazy"
            className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="mt-2 text-center">
          <h3 className="text-[11px] font-semibold text-gray-700 truncate group-hover:text-pink-600">
            {product.product_name}
          </h3>
          <p className="text-xs font-bold text-gray-900 mt-0.5">
            {money(product.final_price)}
          </p>
          <div className="flex justify-center mt-0.5">
            <StarRating avg={product.avg_star} count={product.review_count} />
          </div>
        </div>
      </Link>
    );
  }

  // Default: 'trending' or 'catalog'
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 hover:shadow-md transition-shadow flex flex-col justify-between p-2 h-full group">
      <div className="relative rounded-lg overflow-hidden bg-pink-50/50 aspect-[3/4]">
        {product.off_price > 0 && (
          <span className="absolute top-2 left-2 z-10 bg-pink-600 text-white text-[10px] font-extrabold px-1.5 py-0.5 rounded">
            -{Math.round(product.off_price)}%
          </span>
        )}
        <button
          type="button"
          onClick={handleWishlist}
          aria-label="Save to wishlist"
          className={`absolute top-2 right-2 z-10 w-7 h-7 bg-white/90 rounded-full flex items-center justify-center transition-colors shadow-sm ${
            inWish ? 'text-pink-600' : 'text-gray-600 hover:text-pink-600'
          }`}
        >
          <i className={`bi ${inWish ? 'bi-heart-fill' : 'bi-heart'} text-xs`} />
        </button>
        <Link to={`/product?slug=${encodeURIComponent(product.slug)}`}>
          <img
            src={img}
            alt={product.product_name}
            loading="lazy"
            className={`w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-300 ${
              outOfStock ? 'opacity-50' : ''
            }`}
          />
        </Link>
        {outOfStock ? (
          <span className="absolute bottom-2 left-2 z-10 bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded">
            Out of stock
          </span>
        ) : (
          product.instock !== undefined &&
          product.instock <= 5 && (
            <span className="absolute bottom-2 left-2 z-10 bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">
              {product.instock} left
            </span>
          )
        )}
      </div>

      <div className="mt-2 flex flex-col flex-grow justify-between">
        <div>
          <Link
            to={`/product?slug=${encodeURIComponent(product.slug)}`}
            className="block text-[12px] font-semibold text-gray-700 hover:text-pink-600 truncate"
          >
            {product.product_name}
          </Link>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-gray-900">
              {money(product.final_price)}
            </span>
            {product.off_price > 0 && (
              <span className="text-[10px] text-gray-400 line-through">
                {money(product.price)}
              </span>
            )}
          </div>
          {product.avg_star !== undefined && (
            <div className="mt-1">
              <StarRating avg={product.avg_star} count={product.review_count || 0} />
            </div>
          )}
        </div>

        <button
          type="button"
          disabled={outOfStock || adding}
          onClick={handleAddToCart}
          className={`w-full mt-3 py-1.5 border rounded-md text-[10px] font-bold uppercase transition-colors ${
            outOfStock
              ? 'border-gray-200 text-gray-400 cursor-not-allowed'
              : 'border-pink-500 text-pink-600 hover:bg-pink-600 hover:text-white cursor-pointer'
          }`}
        >
          {outOfStock ? 'Unavailable' : adding ? 'Adding...' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}

