import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useStore } from '../context/StoreContext';
import SEO from '../components/SEO';

export default function ContactPage() {
  const { showToast } = useStore();
  const [info, setInfo] = useState({ cards: [], topics: [] });
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'General Inquiry',
    message: '',
  });

  useEffect(() => {
    api.get('/contact')
      .then((res) => {
        setInfo({ cards: res.cards || [], topics: res.topics || [] });
        if (res.topics?.length > 0) {
          setForm((prev) => ({ ...prev, subject: res.topics[0] }));
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/contact', form);
      showToast(res.message || 'Message sent!', 'success');
      setForm({
        name: '',
        email: '',
        phone: '',
        subject: info.topics?.[0] || 'General Inquiry',
        message: '',
      });
    } catch (err) {
      showToast(err.message || 'Failed to send message', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen py-8 pb-16">
      <SEO title="Contact Customer Support" />

      <div className="max-w-6xl mx-auto px-3 sm:px-4 space-y-6">
        <div className="bg-gradient-to-r from-gray-900 via-slate-900 to-indigo-950 rounded-2xl p-6 sm:p-10 text-white">
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
            24/7 Concierge & Vendor Support
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mt-1">How Can We Help You Today?</h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-1">
            Reach out for order tracking, vendor onboarding, payment inquiries, or returns.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Contact Info Cards */}
          <div className="lg:col-span-5 space-y-3.5">
            {info.cards.map((c, idx) => (
              <div key={c.id || idx} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <i className={`bi ${c.icon || 'bi-headset'}`}></i>
                </div>
                <div>
                  <h3 className="text-xs font-extrabold text-gray-900">{c.label}</h3>
                  <p className="text-xs font-bold text-amber-700 mt-0.5">{c.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 bg-white rounded-2xl p-6 shadow-sm border border-gray-100 space-y-4">
            <h2 className="text-base font-extrabold text-gray-900">Send Us a Direct Message</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Subject *</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs bg-white"
                >
                  {(info.topics.length ? info.topics : ['General Inquiry', 'Order Support', 'Returns & Refunds', 'Vendor / Selling', 'Partnership', 'Feedback']).map((t, i) => (
                    <option key={i} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Message (min 10 characters) *</label>
              <textarea
                rows={4}
                required
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="How can our team assist you?"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold text-xs px-6 py-3 rounded-xl shadow transition"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
