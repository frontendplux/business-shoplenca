import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useStore } from '../context/StoreContext';
import SEO from '../components/SEO';

export default function CheckoutPage() {
  const { money, refreshBootstrap, showToast } = useStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    items: [],
    totals: { count: 0, sell: 0, shipping: 0, prepaid_discount: 5, prepaid_off: 0, total_cod: 0, total_prepaid: 0 },
    gateways: [],
    user: null,
  });

  const [selectedGateway, setSelectedGateway] = useState('paystack');
  const [paymentReference, setPaymentReference] = useState('');
  const [orderResult, setOrderResult] = useState(null);

  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    address: '',
    landmark: '',
    city: '',
    state: '',
    pincode: '100001',
    notes: '',
  });

  useEffect(() => {
    api.get('/checkout')
      .then((res) => {
        setCheckoutData({
          items: res.items || [],
          totals: res.totals || {},
          gateways: res.gateways || [],
          user: res.user || null,
        });
        if (res.gateways?.length > 0) {
          setSelectedGateway(res.gateways[0].code);
        }
        const addr = res.last_address || {};
        const u = res.user || {};
        setForm((prev) => ({
          ...prev,
          full_name: addr.full_name || [u.firstname, u.lastname].filter(Boolean).join(' ') || u.username || '',
          phone: addr.phone || u.phone || '',
          address: addr.address || '',
          landmark: addr.landmark || '',
          city: addr.city || '',
          state: addr.state || '',
          pincode: addr.pincode || '100001',
        }));
        setLoading(false);
      })
      .catch((err) => {
        if (err?.response?.login) {
          setNeedsLogin(true);
        }
        setLoading(false);
      });
  }, []);

  const activeGatewayObj = checkoutData.gateways.find((g) => g.code === selectedGateway) || checkoutData.gateways[0];
  const isCod = selectedGateway === 'cod' || activeGatewayObj?.gateway_type === 'cod';
  const subtotal = Number(checkoutData.totals.sell || 0);
  const shipping = Number(checkoutData.totals.shipping || 0);
  const discount = isCod ? 0 : Number(checkoutData.totals.prepaid_off || 0);
  const finalTotal = isCod ? Number(checkoutData.totals.total_cod || 0) : Number(checkoutData.totals.total_prepaid || 0);

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!form.full_name || !form.phone || !form.address || !form.city || !form.state || !form.pincode) {
      showToast('Please fill in all required delivery fields.', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/checkout', {
        ...form,
        payment_method: selectedGateway,
        payment_reference: paymentReference || `${selectedGateway.toUpperCase()}-${Date.now()}`,
      });
      setOrderResult(res.order);
      refreshBootstrap();
      showToast('Order placed successfully!', 'success');
    } catch (err) {
      showToast(err.message || 'Could not place order', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (orderResult) {
    return (
      <div className="bg-gray-100 min-h-screen py-12 px-4">
        <SEO title={`Order Confirmed #${orderResult.order_number}`} />
        <div className="max-w-xl mx-auto bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-4">
            <i className="bi bi-check-lg text-2xl"></i>
          </div>
          <span className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
            Order Confirmed
          </span>
          <h1 className="text-2xl font-extrabold text-gray-900 mt-3 mb-1">
            Thank You, {form.full_name}!
          </h1>
          <p className="text-xs text-gray-500 mb-6">
            Your order <strong>{orderResult.order_number}</strong> has been received via <strong>{orderResult.payment_gateway_name}</strong>.
          </p>

          <div className="bg-gray-50 rounded-xl p-4 text-left text-xs space-y-2 mb-6 border border-gray-100">
            <div className="flex justify-between">
              <span className="text-gray-500">Order Number:</span>
              <span className="font-bold text-gray-900">{orderResult.order_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Gateway:</span>
              <span className="font-bold text-gray-900">{orderResult.payment_gateway_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Payment Status:</span>
              <span className="font-bold uppercase text-amber-600">{orderResult.payment_status}</span>
            </div>
            <div className="flex justify-between border-t border-gray-200 pt-2 text-sm">
              <span className="font-bold text-gray-900">Total Amount:</span>
              <span className="font-extrabold text-gray-900">{money(orderResult.total_amount)}</span>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/members?tab=orders"
              className="bg-gray-900 hover:bg-gray-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
            >
              Track Order in Member Area
            </Link>
            <Link
              to="/"
              className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-bold text-xs px-5 py-2.5 rounded-xl transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 min-h-screen py-6 pb-16">
      <SEO title="Secure Checkout" />

      <div className="max-w-7xl mx-auto px-3 sm:px-4">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 flex items-center gap-2">
            <i className="bi bi-shield-check text-emerald-600"></i>
            Secure Encrypted Checkout
          </h1>
          <Link to="/cart" className="text-xs font-bold text-amber-600 hover:underline">
            &larr; Back to Cart
          </Link>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-8 animate-pulse h-80" />
        ) : needsLogin ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <p className="text-sm text-gray-600 mb-4">Please sign in to complete your order.</p>
            <Link to="/login" className="bg-amber-500 text-gray-950 font-bold text-xs px-5 py-2.5 rounded-lg">
              Sign In
            </Link>
          </div>
        ) : checkoutData.items.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center shadow-sm">
            <p className="text-sm text-gray-600 mb-4">Your cart is empty.</p>
            <Link to="/category" className="bg-amber-500 text-gray-950 font-bold text-xs px-5 py-2.5 rounded-lg">
              Browse Products
            </Link>
          </div>
        ) : (
          <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Address + Payment Gateways */}
            <div className="lg:col-span-8 space-y-6">
              {/* Step 1: Shipping Address */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                <h2 className="text-base font-extrabold text-gray-900 mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-gray-950 text-xs font-extrabold flex items-center justify-center">1</span>
                  Delivery Information
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={form.full_name}
                      onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-bold text-gray-700 mb-1">Street Address *</label>
                    <input
                      type="text"
                      required
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="House number, street name, apartment/suite"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">City *</label>
                    <input
                      type="text"
                      required
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">State / Province *</label>
                    <input
                      type="text"
                      required
                      value={form.state}
                      onChange={(e) => setForm({ ...form, state: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Postal / Zip Code *</label>
                    <input
                      type="text"
                      required
                      value={form.pincode}
                      onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Landmark (Optional)</label>
                    <input
                      type="text"
                      value={form.landmark}
                      onChange={(e) => setForm({ ...form, landmark: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Dynamic Payment Gateways (Configured in Admin) */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-amber-500 text-gray-950 text-xs font-extrabold flex items-center justify-center">2</span>
                    Select Payment Gateway
                  </h2>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    Save {checkoutData.totals.prepaid_discount || 5}% on Prepaid Gateways
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {checkoutData.gateways.map((gw) => {
                    const active = selectedGateway === gw.code;
                    return (
                      <label
                        key={gw.code}
                        onClick={() => setSelectedGateway(gw.code)}
                        className={`cursor-pointer rounded-xl p-3.5 border-2 transition flex items-start gap-3 ${
                          active
                            ? 'border-amber-500 bg-amber-50/40'
                            : 'border-gray-100 hover:border-gray-200 bg-white'
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment_method"
                          checked={active}
                          onChange={() => setSelectedGateway(gw.code)}
                          className="mt-1 text-amber-500 focus:ring-amber-400"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5">
                              <i className={`bi ${gw.icon || 'bi-credit-card'} text-amber-600`}></i>
                              {gw.name}
                            </span>
                            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
                              {gw.mode}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                            {gw.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {/* Gateway Specific Instructions */}
                {activeGatewayObj && (
                  <div className="mt-4 p-4 rounded-xl bg-gray-50 border border-gray-200/80 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-800">
                        Selected: {activeGatewayObj.name}
                      </span>
                      {activeGatewayObj.public_key && (
                        <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                          API Key Ready ({activeGatewayObj.mode})
                        </span>
                      )}
                    </div>

                    {selectedGateway === 'bank_transfer' && activeGatewayObj.extra && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1">
                        <p><strong>Bank:</strong> {activeGatewayObj.extra.bank_name || 'First Global Bank'}</p>
                        <p><strong>Account Name:</strong> {activeGatewayObj.extra.account_name || 'Shoplenca Marketplace Ltd'}</p>
                        <p><strong>Account Number:</strong> <span className="font-mono font-bold">{activeGatewayObj.extra.account_number || '0123456789'}</span></p>
                        {activeGatewayObj.extra.instructions && (
                          <p className="text-gray-500 text-[11px] pt-1">{activeGatewayObj.extra.instructions}</p>
                        )}
                      </div>
                    )}

                    {selectedGateway === 'crypto_usdt' && activeGatewayObj.extra && (
                      <div className="bg-white p-3 rounded-lg border border-gray-200 space-y-1">
                        <p><strong>Network:</strong> {activeGatewayObj.extra.network || 'USDT (TRC20 / BEP20)'}</p>
                        <p><strong>Wallet Address:</strong> <span className="font-mono font-bold break-all">{activeGatewayObj.extra.wallet_address || 'TQx9...WalletAddress'}</span></p>
                      </div>
                    )}

                    {(selectedGateway === 'bank_transfer' || selectedGateway === 'crypto_usdt') && (
                      <div className="pt-2">
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          Payment Reference / Transaction Hash (Optional)
                        </label>
                        <input
                          type="text"
                          value={paymentReference}
                          onChange={(e) => setPaymentReference(e.target.value)}
                          placeholder="Enter transfer session ID or crypto TXID"
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-xs bg-white"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Summary */}
            <div className="lg:col-span-4 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 sticky top-24">
              <h2 className="text-base font-extrabold text-gray-900 mb-4 pb-3 border-b border-gray-100">
                Order Summary ({checkoutData.totals.count} items)
              </h2>

              <div className="max-h-60 overflow-y-auto divide-y divide-gray-100 mb-4 pr-1">
                {checkoutData.items.map((item) => (
                  <div key={item.pid} className="py-2.5 flex items-center gap-3">
                    <img src={item.image} alt={item.product_name} className="w-12 h-12 rounded-lg object-cover border border-gray-100 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-gray-800 truncate">{item.product_name}</p>
                      <p className="text-[11px] text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-xs font-extrabold text-gray-900">
                      {money(item.line_total)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2 text-xs border-t border-gray-100 pt-3">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">{money(subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Fee</span>
                  <span className="font-bold text-gray-900">
                    {shipping === 0 ? 'FREE' : money(shipping)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-600">
                    <span>Prepaid Gateway Discount</span>
                    <span className="font-bold">-{money(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline text-sm font-extrabold text-gray-900 border-t border-gray-100 pt-3">
                  <span>Total Payable</span>
                  <span className="text-xl text-amber-600">{money(finalTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-5 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 text-gray-950 font-extrabold text-sm py-3.5 rounded-xl shadow transition flex items-center justify-center gap-2"
              >
                <i className="bi bi-shield-lock-fill"></i>
                <span>{submitting ? 'Processing Order...' : `Pay & Place Order (${money(finalTotal)})`}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
