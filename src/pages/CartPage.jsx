import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useStore } from '../context/StoreContext';
import SEO from '../components/SEO';

export default function CartPage() {
  const navigate = useNavigate();
  const { money, refreshBootstrap, showToast } = useStore();
  const [cart, setCart] = useState({
    items: [],
    all_ok: true,
    totals: {
      count: 0,
      mrp: 0,
      sell: 0,
      savings: 0,
      shipping: 0,
      prepaid_discount: 5,
      prepaid_off: 0,
      total_cod: 0,
      total_prepaid: 0,
      free_ship_min: 99,
      free_left: 99,
      progress: 0,
    },
  });
  const [needsLogin, setNeedsLogin] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCart = () => {
    setLoading(true);
    api.get('/cart')
      .then((res) => {
        if (res.login) {
          setNeedsLogin(true);
        } else {
          setNeedsLogin(false);
        }
        if (res.cart) {
          setCart(res.cart);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    loadCart();
  }, []);

  const mutateCart = async (payload) => {
    try {
      const res = await api.post('/cart', payload);
      if (res.cart) {
        setCart(res.cart);
      }
      refreshBootstrap();
    } catch (err) {
      showToast(err.message || 'Cart error', 'error');
    }
  };

  const { items, totals } = cart;
  const freeShipPct = totals.progress ?? 0;

  return (
    <div className="bg-gray-100 min-h-screen py-6 pb-16">
      <SEO title="Your Shopping Cart" />

      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2.5">
            <i className="bi bi-cart3 text-amber-500"></i>
            Shopping Cart ({totals.count || 0})
          </h1>
          <Link to="/category" className="text-xs font-bold text-amber-600 hover:underline">
            &larr; Continue Shopping
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-8 animate-pulse h-64" />
        ) : needsLogin ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <i className="bi bi-person-lock text-2xl"></i>
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-1">Sign in to view your cart</h2>
            <p className="text-xs text-gray-500 mb-6">
              Sign in to sync your shopping cart and saved items across all your devices.
            </p>
            <Link
              to="/login"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold text-xs px-6 py-3 rounded-xl shadow transition"
            >
              Sign In to Account
            </Link>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-gray-100">
            <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-4">
              <i className="bi bi-bag text-2xl"></i>
            </div>
            <h2 className="text-lg font-extrabold text-gray-900 mb-1">Your cart is currently empty</h2>
            <p className="text-xs text-gray-500 mb-6">
              Explore our flash deals and top categories to find something you love.
            </p>
            <Link
              to="/category"
              className="inline-block bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold text-xs px-6 py-3 rounded-xl shadow transition"
            >
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Cart Items List */}
            <div className="lg:col-span-8 space-y-4">
              {/* Free Shipping Progress */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  {totals.free_left > 0 ? (
                    <span className="font-semibold text-gray-700">
                      Add <strong className="text-amber-600">{money(totals.free_left)}</strong> more to unlock <strong className="text-emerald-600">FREE Shipping!</strong>
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-600 flex items-center gap-1.5">
                      <i className="bi bi-check-circle-fill"></i>
                      Your order qualifies for FREE Standard Shipping!
                    </span>
                  )}
                  <span className="text-[11px] font-bold text-gray-400">{freeShipPct}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${freeShipPct}%` }}
                  />
                </div>
              </div>

              {/* Items */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
                {items.map((item) => (
                  <div key={item.cart_id || item.pid} className="p-4 sm:p-5 flex gap-4">
                    <Link
                      to={`/product?slug=${encodeURIComponent(item.slug || '')}`}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 shrink-0"
                    >
                      <img src={item.image} alt={item.product_name} className="w-full h-full object-cover" />
                    </Link>

                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <Link
                            to={`/product?slug=${encodeURIComponent(item.slug || '')}`}
                            className="text-xs sm:text-sm font-bold text-gray-900 hover:text-amber-600 line-clamp-2"
                          >
                            {item.product_name}
                          </Link>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            Unit Price: {money(item.final_price)}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <p className="text-sm sm:text-base font-extrabold text-gray-900">
                            {money(item.line_total)}
                          </p>
                          {item.line_mrp > item.line_total && (
                            <p className="text-[11px] text-emerald-600 font-semibold">
                              Saved {money(item.line_mrp - item.line_total)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => mutateCart({ action: 'remove', product_id: item.pid })}
                            className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1 transition"
                          >
                            <i className="bi bi-trash"></i>
                            <span>Remove</span>
                          </button>
                          <button
                            onClick={() => mutateCart({ action: 'to_wishlist', product_id: item.pid })}
                            className="text-xs text-gray-400 hover:text-amber-600 flex items-center gap-1 transition"
                          >
                            <i className="bi bi-heart"></i>
                            <span>Save for Later</span>
                          </button>
                        </div>

                        <div className="flex items-center border border-gray-200 rounded-lg bg-gray-50">
                          <button
                            onClick={() => {
                              if (item.quantity <= 1) {
                                mutateCart({ action: 'remove', product_id: item.pid });
                              } else {
                                mutateCart({ action: 'update', product_id: item.pid, quantity: item.quantity - 1 });
                              }
                            }}
                            className="w-7 h-7 text-xs font-bold text-gray-700 hover:bg-gray-200 rounded-l-lg"
                          >
                            -
                          </button>
                          <span className="w-8 text-center text-xs font-bold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() => mutateCart({ action: 'update', product_id: item.pid, quantity: item.quantity + 1 })}
                            className="w-7 h-7 text-xs font-bold text-gray-700 hover:bg-gray-200 rounded-r-lg"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Order Summary Box */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-base font-extrabold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                Order Summary
              </h2>
              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Items Subtotal ({totals.count})</span>
                  <span className="font-bold text-gray-900">{money(totals.sell)}</span>
                </div>
                {totals.savings > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Discount Savings</span>
                    <span className="font-bold">-{money(totals.savings)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Estimated Shipping</span>
                  <span className="font-bold text-gray-900">
                    {totals.shipping === 0 ? 'FREE' : money(totals.shipping)}
                  </span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex justify-between items-baseline text-sm">
                  <span className="font-extrabold text-gray-900">Estimated Total</span>
                  <span className="text-xl font-extrabold text-gray-900">
                    {money(totals.total_cod)}
                  </span>
                </div>
              </div>

              <button
                onClick={() => navigate('/checkout')}
                className="w-full mt-5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold text-sm py-3.5 rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <span>Proceed to Checkout</span>
                <i className="bi bi-lock-fill text-xs"></i>
              </button>

              <p className="text-[11px] text-gray-400 text-center mt-3">
                Save an extra {totals.prepaid_discount || 5}% ({money(totals.prepaid_off)}) when paying online at checkout!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
