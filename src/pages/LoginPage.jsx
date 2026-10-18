import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../services/api';
import { useStore } from '../context/StoreContext';
import SEO from '../components/SEO';

export default function LoginPage({ defaultTab = 'signin' }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { setAuthSession, showToast } = useStore();

  const [tab, setTab] = useState(location.pathname === '/register' ? 'signup' : defaultTab);
  const [loading, setLoading] = useState(false);

  // Sign In form
  const [signinForm, setSigninForm] = useState({
    user: '',
    pass: '',
  });

  // Sign Up form
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    phone: '',
    pass: '',
    pass2: '',
    is_vendor: false,
  });

  // Forgot Password Modal
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotData, setForgotData] = useState({
    email: '',
    code: '',
    demo_code: '',
    pass: '',
    pass2: '',
  });

  const handleSignIn = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth', {
        action: 'signin',
        user: signinForm.user,
        pass: signinForm.pass,
      });
      await setAuthSession(res.user, res.token);
      showToast(res.msg || 'Welcome back!', 'success');
      navigate('/members');
    } catch (err) {
      showToast(err.message || 'Invalid login credentials', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    if (signupForm.pass !== signupForm.pass2) {
      showToast('Passwords do not match.', 'error');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth', {
        action: 'signup',
        ...signupForm,
      });
      await setAuthSession(res.user, res.token);
      showToast(res.msg || 'Account created!', 'success');
      navigate('/members');
    } catch (err) {
      showToast(err.message || 'Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSend = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth', {
        action: 'forgot_send',
        email: forgotData.email,
      });
      setForgotData((prev) => ({ ...prev, demo_code: res.demo_code || '' }));
      setForgotStep(2);
      showToast(res.msg || 'Reset code sent', 'info');
    } catch (err) {
      showToast(err.message || 'Error sending code', 'error');
    }
  };

  const handleForgotVerify = async (e) => {
    e.preventDefault();
    try {
      await api.post('/auth', {
        action: 'forgot_verify',
        email: forgotData.email,
        code: forgotData.code,
      });
      setForgotStep(3);
    } catch (err) {
      showToast(err.message || 'Invalid code', 'error');
    }
  };

  const handleForgotReset = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/auth', {
        action: 'forgot_reset',
        email: forgotData.email,
        code: forgotData.code,
        pass: forgotData.pass,
        pass2: forgotData.pass2,
      });
      showToast(res.msg || 'Password updated!', 'success');
      setForgotOpen(false);
      setForgotStep(1);
    } catch (err) {
      showToast(err.message || 'Reset failed', 'error');
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen py-10 px-4">
      <SEO title={tab === 'signin' ? 'Sign In to Your Account' : 'Create an Account'} />

      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        {/* Left Brand Banner */}
        <div className="md:col-span-5 bg-gradient-to-br from-gray-900 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <span className="inline-block bg-amber-500 text-gray-950 text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-1 rounded-full mb-4">
              Member & Vendor Portal
            </span>
            <h1 className="text-2xl font-extrabold leading-snug mb-3">
              One Account for Shopping, Selling & E-Books
            </h1>
            <p className="text-xs text-gray-300 leading-relaxed">
              Track orders in real time, manage your wishlist, publish books, or activate your Vendor Storefront with one click inside the Members Hub.
            </p>
          </div>

          <div className="space-y-3 pt-6 border-t border-white/10 text-xs text-gray-300 mt-6">
            <div className="flex items-center gap-2.5">
              <i className="bi bi-shop text-amber-400"></i>
              <span>Choose to become a Vendor anytime</span>
            </div>
            <div className="flex items-center gap-2.5">
              <i className="bi bi-book-half text-emerald-400"></i>
              <span>Read & monetize digital books</span>
            </div>
            <div className="flex items-center gap-2.5">
              <i className="bi bi-shield-check text-blue-400"></i>
              <span>Encrypted multi-gateway checkout</span>
            </div>
          </div>
        </div>

        {/* Right Auth Form */}
        <div className="md:col-span-7 p-6 sm:p-8">
          <div className="flex border-b border-gray-100 mb-6">
            <button
              type="button"
              onClick={() => setTab('signin')}
              className={`flex-1 pb-3 text-xs sm:text-sm font-extrabold border-b-2 transition ${
                tab === 'signin'
                  ? 'border-amber-500 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => setTab('signup')}
              className={`flex-1 pb-3 text-xs sm:text-sm font-extrabold border-b-2 transition ${
                tab === 'signup'
                  ? 'border-amber-500 text-gray-900'
                  : 'border-transparent text-gray-400 hover:text-gray-700'
              }`}
            >
              Create Account
            </button>
          </div>

          {tab === 'signin' ? (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  Email, Username, or Phone
                </label>
                <input
                  type="text"
                  required
                  value={signinForm.user}
                  onChange={(e) => setSigninForm({ ...signinForm, user: e.target.value })}
                  placeholder="e.g. admin or tunde.adebayo1@demo.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700">Password</label>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className="text-[11px] font-semibold text-amber-600 hover:underline"
                  >
                    Forgot Password?
                  </button>
                </div>
                <input
                  type="password"
                  required
                  value={signinForm.pass}
                  onChange={(e) => setSigninForm({ ...signinForm, pass: e.target.value })}
                  placeholder="Enter your password"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-600 text-gray-950 font-extrabold text-xs sm:text-sm py-3 rounded-xl shadow transition"
              >
                {loading ? 'Signing In...' : 'Sign In to Account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignUp} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Full Name (First & Last Name) *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={signupForm.email}
                    onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+2348012345678"
                    value={signupForm.phone}
                    onChange={(e) => setSignupForm({ ...signupForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Password (min 8 chars) *</label>
                  <input
                    type="password"
                    required
                    value={signupForm.pass}
                    onChange={(e) => setSignupForm({ ...signupForm, pass: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    value={signupForm.pass2}
                    onChange={(e) => setSignupForm({ ...signupForm, pass2: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs"
                  />
                </div>
              </div>

              {/* Optional Become a Vendor choice during Sign Up */}
              <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/80">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={signupForm.is_vendor}
                    onChange={(e) => setSignupForm({ ...signupForm, is_vendor: e.target.checked })}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span className="text-xs font-bold text-gray-900">
                    I also want to become a Vendor & sell products (can be toggled anytime on Members page)
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 hover:bg-amber-500 hover:text-gray-950 text-white font-extrabold text-xs sm:text-sm py-3 rounded-xl shadow transition"
              >
                {loading ? 'Creating Account...' : 'Create My Account'}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-gray-900">Reset Your Password</h3>
              <button onClick={() => setForgotOpen(false)} className="text-gray-400 hover:text-gray-700">
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            {forgotStep === 1 && (
              <form onSubmit={handleForgotSend} className="space-y-4">
                <p className="text-xs text-gray-500">Enter your registered email address to receive a 4-digit verification code.</p>
                <input
                  type="email"
                  required
                  placeholder="Email address"
                  value={forgotData.email}
                  onChange={(e) => setForgotData({ ...forgotData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                />
                <button type="submit" className="w-full bg-amber-500 text-gray-950 font-bold text-xs py-2.5 rounded-xl">
                  Send Reset Code
                </button>
              </form>
            )}

            {forgotStep === 2 && (
              <form onSubmit={handleForgotVerify} className="space-y-4">
                {forgotData.demo_code && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    Demo Code: <strong>{forgotData.demo_code}</strong>
                  </div>
                )}
                <input
                  type="text"
                  required
                  placeholder="Enter 4-digit code"
                  value={forgotData.code}
                  onChange={(e) => setForgotData({ ...forgotData, code: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                />
                <button type="submit" className="w-full bg-amber-500 text-gray-950 font-bold text-xs py-2.5 rounded-xl">
                  Verify Code
                </button>
              </form>
            )}

            {forgotStep === 3 && (
              <form onSubmit={handleForgotReset} className="space-y-3">
                <input
                  type="password"
                  required
                  placeholder="New password (min 8 chars)"
                  value={forgotData.pass}
                  onChange={(e) => setForgotData({ ...forgotData, pass: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                />
                <input
                  type="password"
                  required
                  placeholder="Confirm new password"
                  value={forgotData.pass2}
                  onChange={(e) => setForgotData({ ...forgotData, pass2: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-xs"
                />
                <button type="submit" className="w-full bg-emerald-600 text-white font-bold text-xs py-2.5 rounded-xl">
                  Save New Password
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
