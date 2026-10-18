import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useStore } from '../../context/StoreContext';

export default function Header() {
  const {
    company,
    categories,
    unlinkedBrands,
    currencies,
    currency,
    setCurrency,
    user,
    logout,
    cartCount,
    wishlistCount,
    notifications = [],
    unreadNotifCount = 0,
    pushPermission,
    enablePushNotifications,
    markNotificationsRead,
    moneyFromNgn,
  } = useStore();

  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');

  useEffect(() => {
    setSearchQuery(searchParams.get('q') || '');
  }, [searchParams]);

  useEffect(() => {
    setDrawerOpen(false);
    setNotifOpen(false);
  }, [location.pathname, location.search]);

  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    navigate(q ? `/category?q=${encodeURIComponent(q)}` : '/category');
  };

  const badge = (n) => (n > 99 ? '99+' : String(n));
  const loggedIn = Boolean(user);
  const userName = loggedIn
    ? user.display_name || user.username || user.firstname || 'Account'
    : 'Account';
  const initial = userName.charAt(0).toUpperCase();

  const barCats = categories.slice(0, 4);
  const moreCats = categories.slice(4);
  const activeSlug = searchParams.get('slug') || '';
  const isHome = location.pathname === '/' || location.pathname === '/home';

  const linkBase =
    'block py-3 border-b-2 border-transparent hover:text-pink-600 hover:border-pink-300 transition-colors whitespace-nowrap';
  const linkActive =
    'block py-3 border-b-2 border-pink-600 text-pink-600 whitespace-nowrap';

  return (
    <>
      {/* Announcement Bar */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-700 to-pink-500 text-white text-[11px] sm:text-xs font-semibold py-1.5 px-3 tracking-wide">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="truncate text-center flex-1">
            <i className="bi bi-truck mr-1" />
            {company?.announcement_text ||
              'Free shipping above $99 · Extra 10% off on prepaid orders · 7-day easy returns'}
            <Link
              to="/members?tab=domain"
              className="hidden md:inline-block ml-3 px-2 py-0.5 rounded-full bg-amber-400 text-gray-900 font-extrabold text-[10px] hover:bg-amber-300"
            >
              <i className="bi bi-globe2 mr-1" />
              Own Subdomain + Custom Domain @ {moneyFromNgn ? moneyFromNgn(500) : '₦500'}/mo
            </Link>
          </div>
          {currencies?.length > 0 && (
            <div className="flex items-center gap-1.5 shrink-0">
              <label htmlFor="curSelect" className="text-[10px] text-white/80 hidden sm:inline">
                Currency:
              </label>
              <select
                id="curSelect"
                value={currency?.code || 'USD'}
                onChange={(e) => setCurrency(e.target.value)}
                className="bg-white/15 hover:bg-white/25 text-white text-[11px] font-bold rounded px-1.5 py-0.5 border border-white/25 focus:outline-none cursor-pointer"
              >
                {currencies.map((c) => (
                  <option key={c.code} value={c.code} className="text-gray-900">
                    {c.code} ({c.symbol})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Main Sticky Header */}
      <header className="border-b border-gray-100 shadow-sm bg-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          {/* Top Row */}
          <div className="flex flex-wrap items-center gap-x-2 sm:gap-x-4 gap-y-2.5 py-2.5 lg:py-4">
            {/* Mobile Menu Button */}
            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              className="lg:hidden w-10 h-10 -ml-1 rounded-full flex items-center justify-center text-gray-800 hover:bg-pink-50 hover:text-pink-600 transition-colors"
            >
              <i className="bi bi-list text-3xl leading-none" />
            </button>

            {/* Brand Logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              {company?.logo ? (
                <>
                  <img
                    src={company.logo}
                    alt={company?.name || 'Logo'}
                    className="h-8 sm:h-9 w-auto max-w-[120px] sm:max-w-[140px] object-contain sm:hidden"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.logo-fallback-text');
                      if (fallback) fallback.classList.remove('hidden');
                    }}
                  />
                  <span className="logo-fallback-text hidden sm:inline text-2xl sm:text-3xl uppercase font-extrabold tracking-wider bg-gradient-to-r from-indigo-900 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                    {company?.name || 'Shoplenca'}
                  </span>
                </>
              ) : (
                <span className="text-2xl sm:text-3xl uppercase font-extrabold tracking-wider bg-gradient-to-r from-indigo-900 via-purple-600 to-pink-500 bg-clip-text text-transparent">
                  {company?.name || 'Shoplenca'}
                </span>
              )}
            </Link>

            {/* Search Bar */}
            <form
              onSubmit={handleSearch}
              role="search"
              className="order-last basis-full w-full lg:order-none lg:basis-auto lg:w-auto lg:flex-1 lg:max-w-xl lg:mx-auto relative flex items-center"
            >
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for products, brands and more..."
                className="w-full h-10 lg:h-11 pl-4 pr-14 text-[15px] sm:text-sm text-gray-700 bg-gray-50 focus:bg-white rounded-full border border-pink-300 focus:outline-none focus:border-pink-500 focus:ring-2 focus:ring-pink-100 transition-all placeholder:text-gray-400"
              />
              <button
                type="submit"
                aria-label="Search"
                className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-r-full flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
              >
                <i className="bi bi-search text-sm" />
              </button>
            </form>

            {/* Action Icons */}
            <div className="ml-auto lg:ml-0 flex items-center gap-0.5 sm:gap-3">
              {/* Admin Quick Pill (if admin logged in) */}
              {loggedIn && user.is_admin && (
                <Link
                  to="/admin"
                  className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gradient-to-r from-amber-500 to-pink-600 text-white shadow-sm hover:opacity-90 transition-opacity"
                >
                  <i className="bi bi-shield-lock-fill" /> Admin
                </Link>
              )}

              {/* Push Notifications Bell */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setNotifOpen((o) => !o)}
                  aria-label="Notifications"
                  className="relative flex flex-col items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-2 group cursor-pointer"
                >
                  <span className="relative">
                    <i className="bi bi-bell text-xl text-gray-700 group-hover:text-pink-600 transition-colors" />
                    {unreadNotifCount > 0 && (
                      <span className="absolute -top-1.5 -right-2.5 bg-orange-500 text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                        {badge(unreadNotifCount)}
                      </span>
                    )}
                  </span>
                  <span className="hidden sm:block text-[10px] font-medium text-gray-600 mt-0.5">
                    Alerts
                  </span>
                </button>

                {notifOpen && (
                  <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                    <div className="px-4 py-3 bg-gradient-to-r from-indigo-900 via-purple-700 to-pink-500 text-white flex items-center justify-between">
                      <div>
                        <p className="text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                          <i className="bi bi-bell-fill text-amber-300" /> Push Notifications
                        </p>
                        <p className="text-[10px] text-white/80">
                          {unreadNotifCount} unread alert(s)
                        </p>
                      </div>
                      {unreadNotifCount > 0 && (
                        <button
                          type="button"
                          onClick={() => markNotificationsRead(0)}
                          className="text-[10px] font-bold bg-white/20 hover:bg-white/30 px-2.5 py-1 rounded-full cursor-pointer"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>

                    {pushPermission !== 'granted' && (
                      <div className="px-4 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] font-semibold text-amber-900">
                          <i className="bi bi-broadcast mr-1 text-amber-600" />
                          Enable live browser push alerts
                        </span>
                        <button
                          type="button"
                          onClick={enablePushNotifications}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-extrabold uppercase cursor-pointer shrink-0"
                        >
                          Enable Push
                        </button>
                      </div>
                    )}

                    <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-xs text-gray-400">
                          No notifications yet.
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              markNotificationsRead(n.id);
                              setNotifOpen(false);
                              if (n.link) {
                                navigate(n.link.replace('/member?', '/members?'));
                              }
                            }}
                            className={`p-3.5 hover:bg-pink-50/60 transition-colors cursor-pointer flex items-start gap-3 ${
                              !n.is_read ? 'bg-purple-50/40' : ''
                            }`}
                          >
                            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5">
                              <i className={`bi ${n.icon || 'bi-bell-fill'} text-sm`} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-bold text-gray-900 truncate">
                                  {n.title}
                                </p>
                                {!n.is_read && (
                                  <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0" />
                                )}
                              </div>
                              <p className="text-[11px] text-gray-600 mt-0.5 line-clamp-2">
                                {n.message}
                              </p>
                              <span className="text-[9px] text-gray-400 mt-1 block">
                                {n.created_at}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <Link
                to="/members?tab=wishlist"
                aria-label="Wishlist"
                className="relative flex flex-col items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-2 group"
              >
                <span className="relative">
                  <i className="bi bi-heart text-xl text-gray-700 group-hover:text-pink-600 transition-colors" />
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-pink-500 text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                      {badge(wishlistCount)}
                    </span>
                  )}
                </span>
                <span className="hidden sm:block text-[10px] font-medium text-gray-600 mt-0.5">
                  Wishlist
                </span>
              </Link>

              {/* Account Dropdown */}
              <div className="relative group/acct">
                <Link
                  to={loggedIn ? '/members' : '/login'}
                  aria-label="Account"
                  className="flex flex-col items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-2 group"
                >
                  <i className="bi bi-person text-2xl text-gray-700 group-hover:text-pink-600 transition-colors leading-none" />
                  <span className="hidden sm:block text-[10px] font-medium text-gray-600 max-w-[78px] truncate">
                    {userName}
                  </span>
                </Link>

                <div className="hidden lg:group-hover/acct:block lg:group-focus-within/acct:block absolute right-0 top-full pt-2 w-64 z-50">
                  <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {loggedIn ? (
                      <>
                        <div className="px-4 py-3 bg-gradient-to-r from-indigo-900 via-purple-700 to-pink-500 text-white">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-bold truncate">{userName}</p>
                            {user.is_admin && (
                              <span className="text-[9px] font-extrabold uppercase bg-amber-400 text-gray-900 px-1.5 py-0.5 rounded">
                                Admin
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-white/80 truncate">{user.email}</p>
                        </div>
                        <ul className="py-1.5 text-sm text-gray-700">
                          {user.is_admin && (
                            <li>
                              <Link
                                to="/admin"
                                className="flex items-center gap-3 px-4 py-2 font-bold text-pink-600 bg-pink-50/60 hover:bg-pink-100"
                              >
                                <i className="bi bi-speedometer2" /> Go to Admin
                              </Link>
                            </li>
                          )}
                          <li>
                            <Link
                              to="/members"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-pink-50 hover:text-pink-600"
                            >
                              <i className="bi bi-grid" /> My Account
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/members?tab=orders"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-pink-50 hover:text-pink-600"
                            >
                              <i className="bi bi-box-seam" /> My Orders
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/members?tab=vendor"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-pink-50 hover:text-pink-600"
                            >
                              <i className="bi bi-shop" />{' '}
                              {user.is_vendor ? 'Vendor Hub' : 'Become a Vendor'}
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/members?tab=domain"
                              className="flex items-center gap-3 px-4 py-2 font-semibold text-purple-700 hover:bg-purple-50"
                            >
                              <i className="bi bi-globe2" /> Own Subdomain Store ({moneyFromNgn ? moneyFromNgn(500) : '₦500'}/mo)
                            </Link>
                          </li>
                          <li>
                            <Link
                              to="/members?tab=wishlist"
                              className="flex items-center gap-3 px-4 py-2 hover:bg-pink-50 hover:text-pink-600"
                            >
                              <i className="bi bi-heart" /> Wishlist
                            </Link>
                          </li>
                          <li className="border-t border-gray-100 mt-1 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                logout();
                                navigate('/login');
                              }}
                              className="w-full text-left flex items-center gap-3 px-4 py-2 hover:bg-red-50 hover:text-red-600 cursor-pointer"
                            >
                              <i className="bi bi-box-arrow-right" /> Log out
                            </button>
                          </li>
                        </ul>
                      </>
                    ) : (
                      <div className="p-4 space-y-2">
                        <Link
                          to="/login"
                          className="block text-center py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:opacity-90"
                        >
                          Log in
                        </Link>
                        <Link
                          to="/register"
                          className="block text-center py-2 rounded-xl text-xs font-bold uppercase tracking-wider text-pink-600 border border-pink-300 hover:bg-pink-50"
                        >
                          Create account
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Cart */}
              <Link
                to="/cart"
                aria-label="Cart"
                className="relative flex flex-col items-center justify-center w-10 h-10 sm:w-auto sm:h-auto sm:px-2 group"
              >
                <span className="relative">
                  <i className="bi bi-bag text-xl text-gray-700 group-hover:text-pink-600 transition-colors" />
                  {cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 bg-pink-500 text-white text-[10px] font-bold min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center">
                      {badge(cartCount)}
                    </span>
                  )}
                </span>
                <span className="hidden sm:block text-[10px] font-medium text-gray-600 mt-0.5">
                  Cart
                </span>
              </Link>
            </div>
          </div>

          {/* Desktop Category Nav with Mega Menus */}
          <nav className="hidden lg:block relative border-t border-gray-100" aria-label="Main">
            <ul className="flex items-center justify-center gap-6 xl:gap-8 text-xs font-bold text-gray-800">
              <li>
                <Link to="/" className={isHome ? linkActive : linkBase}>
                  HOME
                </Link>
              </li>
              <li>
                <Link to="/category?sort=new" className={linkBase}>
                  NEW ARRIVALS
                </Link>
              </li>

              {barCats.map((cat) => {
                const on =
                  location.pathname === '/category' && activeSlug === cat.slug;
                return (
                  <li key={cat.id} className="group/mega">
                    <Link
                      to={`/category?slug=${encodeURIComponent(cat.slug)}`}
                      className={`${on ? linkActive : linkBase} uppercase`}
                    >
                      {cat.name}
                      {cat.sub_categories?.length > 0 && (
                        <i className="bi bi-chevron-down text-[9px] ml-1" />
                      )}
                    </Link>

                    {cat.sub_categories?.length > 0 && (
                      <div className="hidden group-hover/mega:block absolute inset-x-0 top-full z-50">
                        <div className="bg-white rounded-b-2xl shadow-2xl border border-gray-100 border-t-0 p-6 grid grid-cols-12 gap-6">
                          <div className="col-span-9 grid grid-cols-3 gap-x-6 gap-y-5 text-left font-normal">
                            {cat.sub_categories.map((sub) => (
                              <div key={sub.id}>
                                <Link
                                  to={`/category?slug=${encodeURIComponent(cat.slug)}&sub[]=${sub.id}`}
                                  className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-900 hover:text-pink-600"
                                >
                                  {sub.name}
                                </Link>
                                {sub.brands?.length > 0 && (
                                  <ul className="mt-1.5 space-y-1">
                                    {sub.brands.slice(0, 5).map((b) => (
                                      <li key={b.id}>
                                        <Link
                                          to={`/category?slug=${encodeURIComponent(cat.slug)}&brand[]=${b.id}`}
                                          className="text-xs text-gray-500 hover:text-pink-600 transition-colors"
                                        >
                                          {b.name}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            ))}
                          </div>
                          <Link
                            to={`/category?slug=${encodeURIComponent(cat.slug)}`}
                            className="col-span-3 relative rounded-xl overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-700 to-pink-500 text-white p-4 flex flex-col justify-end min-h-[140px] group/promo"
                          >
                            {cat.image && (
                              <img
                                src={cat.image}
                                alt=""
                                className="absolute inset-0 w-full h-full object-cover object-top opacity-40 group-hover/promo:scale-105 transition-transform duration-500"
                              />
                            )}
                            <span className="relative text-[10px] font-bold uppercase tracking-widest text-amber-200">
                              Explore
                            </span>
                            <span className="relative text-lg font-extrabold uppercase leading-tight">
                              {cat.name}
                            </span>
                            <span className="relative text-[11px] font-semibold mt-1">
                              Shop all <i className="bi bi-arrow-right" />
                            </span>
                          </Link>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}

              {moreCats.length > 0 && (
                <li className="relative group/more">
                  <Link to="/category" className={linkBase}>
                    MORE <i className="bi bi-chevron-down text-[9px]" />
                  </Link>
                  <div className="hidden group-hover/more:block absolute left-1/2 -translate-x-1/2 top-full z-50 w-56">
                    <ul className="bg-white rounded-b-2xl shadow-xl border border-gray-100 py-2 text-sm font-medium max-h-80 overflow-y-auto">
                      {moreCats.map((cat) => (
                        <li key={cat.id}>
                          <Link
                            to={`/category?slug=${encodeURIComponent(cat.slug)}`}
                            className="block px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-pink-600"
                          >
                            {cat.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              )}

              {unlinkedBrands.length > 0 && (
                <li className="relative group/brands">
                  <Link to="/category" className={linkBase}>
                    BRANDS <i className="bi bi-chevron-down text-[9px]" />
                  </Link>
                  <div className="hidden group-hover/brands:block absolute left-1/2 -translate-x-1/2 top-full z-50 w-56">
                    <ul className="bg-white rounded-b-2xl shadow-xl border border-gray-100 py-2 text-sm font-medium">
                      {unlinkedBrands.map((b) => (
                        <li key={b.id}>
                          <Link
                            to={`/category?brand[]=${b.id}`}
                            className="block px-4 py-2 text-gray-700 hover:bg-pink-50 hover:text-pink-600"
                          >
                            {b.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              )}

              <li className="relative">
                <span className="absolute -top-0.5 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[8px] font-extrabold px-1.5 rounded-full uppercase tracking-tighter pointer-events-none">
                  HOT
                </span>
                <Link
                  to="/category?discount=25&sort=discount"
                  className={`${linkBase} pt-4`}
                >
                  SALE
                </Link>
              </li>
              <li>
                <Link
                  to="/readbooks"
                  className={
                    location.pathname.startsWith('/readbooks') ||
                    location.pathname.startsWith('/book')
                      ? linkActive
                      : linkBase
                  }
                >
                  BOOKS
                </Link>
              </li>
              <li>
                <Link
                  to="/blog"
                  className={location.pathname === '/blog' ? linkActive : linkBase}
                >
                  BLOG
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className={location.pathname === '/contact' ? linkActive : linkBase}
                >
                  CONTACT
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* Mobile / Tablet Navigation Drawer */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 bg-black/50 z-50 lg:hidden"
          aria-hidden="true"
        />
      )}
      <aside
        className={`fixed top-0 left-0 bottom-0 w-[86%] max-w-sm bg-white shadow-2xl flex flex-col z-50 lg:hidden transition-transform duration-300 ${
          drawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Mobile Menu"
      >
        <div className="bg-gradient-to-r from-indigo-900 via-purple-700 to-pink-500 text-white p-4 pt-5">
          <div className="flex items-start justify-between">
            {loggedIn ? (
              <Link to="/members" className="flex items-center gap-3 min-w-0">
                <span className="w-11 h-11 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-lg font-extrabold">
                  {initial}
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] text-white/80">Hello,</span>
                  <span className="block font-bold truncate">{userName}</span>
                </span>
              </Link>
            ) : (
              <div>
                {company?.logo ? (
                  <div className="flex items-center gap-2 mb-1.5">
                    <img
                      src={company.logo}
                      alt={company?.name || 'Logo'}
                      className="h-7 w-auto max-w-[100px] object-contain brightness-0 invert"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <p className="font-bold text-sm">Welcome to {company?.name || 'Shoplenca'}</p>
                  </div>
                ) : (
                  <p className="font-bold">Welcome to {company?.name || 'Shoplenca'}</p>
                )}
                <div className="flex gap-2 mt-2.5">
                  <Link
                    to="/login"
                    className="px-4 py-1.5 rounded-lg bg-white text-gray-900 text-[11px] font-bold uppercase tracking-wider"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-1.5 rounded-lg border border-white/70 text-white text-[11px] font-bold uppercase tracking-wider"
                  >
                    Sign up
                  </Link>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close menu"
              className="w-9 h-9 -mr-1 -mt-1 rounded-full flex items-center justify-center hover:bg-white/15"
            >
              <i className="bi bi-x-lg text-lg" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Quick Links Grid */}
          <div className="grid grid-cols-3 gap-2 p-3 border-b border-gray-100 text-center">
            {[
              ['bi-house', 'Home', '/'],
              ['bi-stars', 'New', '/category?sort=new'],
              ['bi-tag', 'Sale', '/category?discount=25&sort=discount'],
              ['bi-heart', 'Wishlist', '/members?tab=wishlist', wishlistCount],
              ['bi-bag', 'Cart', '/cart', cartCount],
              ['bi-person', 'Account', loggedIn ? '/members' : '/login'],
            ].map(([icon, label, href, cnt]) => (
              <Link
                key={label}
                to={href}
                className="relative rounded-xl bg-gray-50 hover:bg-pink-50 hover:text-pink-600 py-2.5 text-gray-700 transition-colors"
              >
                <i className={`bi ${icon} text-lg`} />
                <span className="block text-[10px] font-bold uppercase tracking-wider mt-0.5">
                  {label}
                </span>
                {cnt > 0 && (
                  <span className="absolute top-1 right-2 bg-pink-500 text-white text-[9px] font-bold min-w-[15px] h-[15px] px-1 rounded-full flex items-center justify-center">
                    {badge(cnt)}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Admin / Vendor Quick Actions */}
          {loggedIn && (
            <div className="p-3 border-b border-gray-100 space-y-1.5">
              {user.is_admin && (
                <Link
                  to="/admin"
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-pink-600 text-white text-xs font-extrabold uppercase tracking-wider"
                >
                  <span>
                    <i className="bi bi-speedometer2 mr-2" /> Go to Admin Panel
                  </span>
                  <i className="bi bi-arrow-right" />
                </Link>
              )}
              <Link
                to="/members?tab=vendor"
                className="flex items-center justify-between px-3 py-2 rounded-xl bg-pink-50 text-pink-700 text-xs font-bold"
              >
                <span>
                  <i className="bi bi-shop mr-2" />
                  {user.is_vendor ? 'Vendor Hub & Products' : 'Become a Vendor'}
                </span>
                <i className="bi bi-chevron-right text-[10px]" />
              </Link>
            </div>
          )}

          {/* Categories Accordion */}
          <div className="p-3">
            <p className="px-1 pb-2 text-[11px] font-extrabold uppercase tracking-widest text-gray-400">
              Shop by category
            </p>
            {categories.map((cat) =>
              cat.sub_categories?.length > 0 ? (
                <details key={cat.id} className="border-b border-gray-100 group">
                  <summary className="flex items-center justify-between px-1 py-3 text-sm font-bold uppercase tracking-wide text-gray-800 cursor-pointer list-none">
                    {cat.name}
                    <i className="bi bi-chevron-down text-xs text-gray-400 group-open:rotate-180 transition-transform" />
                  </summary>
                  <ul className="pb-2 pl-2 space-y-0.5">
                    <li>
                      <Link
                        to={`/category?slug=${encodeURIComponent(cat.slug)}`}
                        className="block px-3 py-2 rounded-lg text-sm font-semibold text-pink-600 hover:bg-pink-50"
                      >
                        View all {cat.name}
                      </Link>
                    </li>
                    {cat.sub_categories.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          to={`/category?slug=${encodeURIComponent(cat.slug)}&sub[]=${sub.id}`}
                          className="block px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-pink-50 hover:text-pink-600"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : (
                <Link
                  key={cat.id}
                  to={`/category?slug=${encodeURIComponent(cat.slug)}`}
                  className="flex items-center justify-between px-1 py-3 border-b border-gray-100 text-sm font-bold uppercase tracking-wide text-gray-800 hover:text-pink-600"
                >
                  {cat.name}
                  <i className="bi bi-chevron-right text-xs text-gray-400" />
                </Link>
              )
            )}
          </div>

          {/* More Links */}
          <div className="px-3 pb-4 text-sm font-semibold text-gray-700 space-y-0.5">
            <Link
              to="/readbooks"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-pink-50 hover:text-pink-600"
            >
              <i className="bi bi-book" /> Read Books
            </Link>
            <Link
              to="/blog"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-pink-50 hover:text-pink-600"
            >
              <i className="bi bi-journal-text" /> Blog
            </Link>
            <Link
              to="/contact"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-pink-50 hover:text-pink-600"
            >
              <i className="bi bi-headset" /> Contact us
            </Link>
            {loggedIn && (
              <button
                type="button"
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-50 hover:text-red-600 cursor-pointer"
              >
                <i className="bi bi-box-arrow-right" /> Log out
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

