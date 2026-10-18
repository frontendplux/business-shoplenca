import React, { useState, useEffect } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useStore } from '../context/StoreContext';
import SEO from '../components/SEO';
import AdBanner from '../components/AdBanner';

export default function BooksPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, showToast, money, refreshBootstrap } = useStore();

  const slug = searchParams.get('slug') || '';
  const chapterNo = searchParams.get('chapter') || '';
  const category = searchParams.get('category') || '';
  const q = searchParams.get('q') || '';

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(false);
  const [payMethod, setPayMethod] = useState('paystack');
  const [showBuyModal, setShowBuyModal] = useState(false);

  const loadBooks = () => {
    setLoading(true);
    if (slug) {
      api
        .get('/books', { slug, chapter: chapterNo || undefined })
        .then((res) => {
          setData(res);
          if (res.reward_earned && res.reward_earned > 0) {
            showToast(`You earned ${money(res.reward_earned)} reading reward!`, 'success');
            refreshBootstrap();
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      api
        .get('/books', { category, q })
        .then((res) => {
          setData(res);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  };

  useEffect(() => {
    loadBooks();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug, chapterNo, category, q]);

  const handleBuyBook = async (e) => {
    if (e) e.preventDefault();
    if (!user) {
      showToast('Please sign in to purchase and unlock this book.', 'info');
      navigate('/login');
      return;
    }
    if (!data?.book) return;
    setBuying(true);
    try {
      const res = await api.post('/books', {
        action: 'buy_book',
        book_id: data.book.id,
        slug: data.book.slug,
        payment_method: payMethod,
      });
      if (res.ok) {
        showToast(res.message || 'Book unlocked! All chapters are now available.', 'success');
        setShowBuyModal(false);
        await refreshBootstrap();
        loadBooks();
      } else {
        showToast(res.message || 'Could not complete book purchase.', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Purchase failed.', 'error');
    } finally {
      setBuying(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="bg-white rounded-2xl p-8 animate-pulse h-80" />
      </div>
    );
  }

  // ============================================================================
  // Book Detail or Chapter Reader Mode
  // ============================================================================
  if (slug && data?.book) {
    const book = data.book;
    const chapters = data.chapters || [];
    const activeChapter = data.chapter;
    const gateways = data.gateways || [];
    const isPaidBook = Number(book.price) > 0;
    const isUnlocked = Boolean(book.is_purchased);

    return (
      <div className="bg-gray-100 min-h-screen py-6 pb-16">
        <SEO
          title={`${book.title} — Digital Bookstore`}
          description={book.description}
          image={book.cover_image}
        />

        <div className="max-w-6xl mx-auto px-3 sm:px-4 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 hover:underline"
            >
              <i className="bi bi-arrow-left" />
              <span>Back to Digital Bookstore</span>
            </Link>

            <Link
              to="/members?tab=books"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-purple-700 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-xl hover:bg-purple-100 transition"
            >
              <i className="bi bi-vector-pen" />
              <span>Write & Sell Your Own Book</span>
            </Link>
          </div>

          {/* Book Info & Purchase Header */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row gap-6">
            <div className="relative w-32 sm:w-40 aspect-[3/4] rounded-xl overflow-hidden shadow-md shrink-0 mx-auto md:mx-0">
              <img
                src={book.cover_image}
                alt={book.title}
                className="w-full h-full object-cover"
              />
              <span
                className={`absolute top-2 left-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shadow ${
                  !isPaidBook
                    ? 'bg-emerald-500 text-white'
                    : isUnlocked
                    ? 'bg-indigo-600 text-white'
                    : 'bg-amber-400 text-gray-950'
                }`}
              >
                {!isPaidBook ? 'Free Book' : isUnlocked ? 'Unlocked ✓' : money(book.price)}
              </span>
            </div>

            <div className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full">
                    {book.category}
                  </span>
                  {book.is_monetized && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full">
                      <i className="bi bi-coin mr-1" />
                      Read & Earn Enabled
                    </span>
                  )}
                  {isPaidBook && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full">
                      {book.free_preview_chapters > 0
                        ? `${book.free_preview_chapters} Free Sample Chapter(s)`
                        : 'Premium Paid Edition'}
                    </span>
                  )}
                </div>

                <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-2">
                  {book.title}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">
                  By <strong className="text-gray-800">{book.author}</strong> &bull; {book.views}{' '}
                  reads
                  {book.sales_count > 0 && ` • ${book.sales_count} copies sold`}
                </p>

                {/* Book Price Display */}
                <div className="mt-3 flex flex-wrap items-baseline gap-3">
                  {isPaidBook ? (
                    <>
                      <span className="text-2xl font-black text-gray-900">
                        {money(book.price)}
                      </span>
                      {Number(book.compare_price) > Number(book.price) && (
                        <>
                          <span className="text-sm text-gray-400 line-through font-semibold">
                            {money(book.compare_price)}
                          </span>
                          <span className="text-[11px] font-extrabold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">
                            Save{' '}
                            {Math.round(
                              ((book.compare_price - book.price) / book.compare_price) * 100
                            )}
                            %
                          </span>
                        </>
                      )}
                      {isUnlocked && (
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <i className="bi bi-unlock-fill mr-1" />
                          {book.is_author ? 'Your Published Book' : 'Purchased & Unlocked'}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-lg font-extrabold text-emerald-600">
                      Free to Read ($0.00)
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-gray-600 mt-3 leading-relaxed">
                  {book.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex flex-wrap items-center gap-3">
                {chapters.length > 0 && (
                  <button
                    onClick={() =>
                      setSearchParams({ slug: book.slug, chapter: chapters[0].chapter_no })
                    }
                    className="bg-gray-900 hover:bg-gray-800 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-xs transition cursor-pointer"
                  >
                    {isPaidBook && !isUnlocked && book.free_preview_chapters > 0
                      ? 'Read Free Preview (Ch. 1) →'
                      : 'Start Reading Chapter 1 →'}
                  </button>
                )}

                {isPaidBook && !isUnlocked && (
                  <button
                    onClick={() => setShowBuyModal(true)}
                    className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-black text-xs px-5 py-2.5 rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <i className="bi bi-unlock-fill" />
                    <span>Buy & Unlock Full Book ({money(book.price)})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Instant Book Unlock / Purchase Modal Box */}
          {showBuyModal && isPaidBook && !isUnlocked && (
            <div className="bg-gradient-to-br from-indigo-950 via-purple-950 to-slate-900 text-white rounded-2xl p-5 sm:p-6 shadow-xl border border-purple-500/30">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
                    Instant Digital Unlock
                  </span>
                  <h3 className="text-lg font-extrabold mt-0.5">
                    Unlock &ldquo;{book.title}&rdquo; — {money(book.price)}
                  </h3>
                  <p className="text-xs text-purple-200 mt-0.5">
                    Get lifetime access to all {chapters.length} chapters + earn reading rewards on
                    every chapter you complete.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowBuyModal(false)}
                  className="text-gray-300 hover:text-white text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleBuyBook} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-purple-200 mb-1.5">
                    Select Payment Method:
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label
                      className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                        payMethod === 'wallet'
                          ? 'bg-amber-400/20 border-amber-400 text-white'
                          : 'bg-white/5 border-white/15 text-gray-200 hover:bg-white/10'
                      }`}
                    >
                      <input
                        type="radio"
                        name="book_pay_method"
                        value="wallet"
                        checked={payMethod === 'wallet'}
                        onChange={(e) => setPayMethod(e.target.value)}
                      />
                      <div>
                        <p className="text-xs font-extrabold">
                          My Member Wallet ({money(user?.wallet_balance || 0)})
                        </p>
                        <p className="text-[10px] text-purple-200">Instant 1-click deduction</p>
                      </div>
                    </label>

                    {(gateways.length > 0
                      ? gateways
                      : [
                          { code: 'paystack', name: 'Paystack (Card / Bank / USSD)' },
                          { code: 'flutterwave', name: 'Flutterwave (Global Cards & Mobile)' },
                        ]
                    ).map((gw) => (
                      <label
                        key={gw.code}
                        className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer transition ${
                          payMethod === gw.code
                            ? 'bg-amber-400/20 border-amber-400 text-white'
                            : 'bg-white/5 border-white/15 text-gray-200 hover:bg-white/10'
                        }`}
                      >
                        <input
                          type="radio"
                          name="book_pay_method"
                          value={gw.code}
                          checked={payMethod === gw.code}
                          onChange={(e) => setPayMethod(e.target.value)}
                        />
                        <div>
                          <p className="text-xs font-extrabold">{gw.name}</p>
                          <p className="text-[10px] text-purple-200">Instant online unlock</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={buying}
                  className="w-full bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-xs sm:text-sm py-3.5 px-5 rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {buying ? 'Unlocking Book...' : `Pay ${money(book.price)} & Unlock Now →`}
                </button>
              </form>
            </div>
          )}

          {/* Google AdSense / AdMob Reader Slot */}
          <AdBanner placement="article" />

          {/* Chapter Selector + Reader Canvas */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <aside className="lg:col-span-4 bg-white rounded-2xl p-4 shadow-sm border border-gray-100 space-y-1.5">
              <div className="flex items-center justify-between px-2 pb-2 border-b border-gray-100">
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-500">
                  Chapters ({chapters.length})
                </h3>
                {isPaidBook && !isUnlocked && (
                  <span className="text-[10px] font-bold text-amber-700">
                    <i className="bi bi-lock-fill mr-1" />
                    {money(book.price)}
                  </span>
                )}
              </div>

              {chapters.map((ch) => {
                const isActive = Number(activeChapter?.chapter_no) === Number(ch.chapter_no);
                return (
                  <button
                    key={ch.chapter_no}
                    onClick={() => setSearchParams({ slug: book.slug, chapter: ch.chapter_no })}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between gap-2 cursor-pointer ${
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate flex items-center gap-1.5">
                      {ch.is_locked ? (
                        <i className="bi bi-lock-fill text-amber-500" />
                      ) : (
                        <i className="bi bi-book text-emerald-500" />
                      )}
                      <span>
                        Ch. {ch.chapter_no}: {ch.title}
                      </span>
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {isPaidBook && !isUnlocked && !ch.is_locked && (
                        <span className="text-[9px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                          Free Sample
                        </span>
                      )}
                      <span className="text-[10px] opacity-70">{ch.read_min || 5}m</span>
                    </div>
                  </button>
                );
              })}
            </aside>

            <div className="lg:col-span-8 bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-gray-100">
              {activeChapter ? (
                <>
                  <div className="border-b border-gray-100 pb-4 mb-6 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span className="text-xs font-bold text-amber-600">
                        Chapter {activeChapter.chapter_no}
                      </span>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 mt-0.5">
                        {activeChapter.title}
                      </h2>
                    </div>

                    {isPaidBook && !isUnlocked && !activeChapter.is_locked && (
                      <span className="text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full">
                        Free Sample Chapter &bull; Full Book: {money(book.price)}
                      </span>
                    )}
                  </div>

                  {/* Chapter Content */}
                  <div
                    className="rich-html-content max-w-none text-base text-gray-800 leading-relaxed font-serif"
                    dangerouslySetInnerHTML={{ __html: activeChapter.content }}
                  />

                  {/* Locked Chapter Paywall Box */}
                  {activeChapter.is_locked && (
                    <div className="mt-6 rounded-2xl bg-gradient-to-br from-amber-50 via-white to-purple-50 border-2 border-amber-300 p-6 text-center shadow-sm">
                      <div className="w-12 h-12 rounded-2xl bg-amber-400 text-gray-950 flex items-center justify-center mx-auto text-xl mb-3 shadow">
                        <i className="bi bi-lock-fill" />
                      </div>
                      <h3 className="text-base sm:text-lg font-extrabold text-gray-900">
                        This Chapter is Locked (Paid Book)
                      </h3>
                      <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto mt-1">
                        Purchase <strong>{book.title}</strong> by <strong>{book.author}</strong> for
                        just <strong>{money(book.price)}</strong> to unlock all {chapters.length}{' '}
                        chapters immediately.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowBuyModal(true)}
                        className="mt-4 bg-amber-500 hover:bg-amber-600 text-gray-950 font-black text-xs sm:text-sm px-6 py-3 rounded-xl shadow transition cursor-pointer"
                      >
                        <i className="bi bi-unlock-fill mr-1.5" />
                        Buy & Unlock Full Book ({money(book.price)})
                      </button>
                    </div>
                  )}

                  <div className="mt-8 pt-5 border-t border-gray-100 flex items-center justify-between">
                    {data.prev_chapter ? (
                      <button
                        onClick={() =>
                          setSearchParams({
                            slug: book.slug,
                            chapter: data.prev_chapter.chapter_no,
                          })
                        }
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs px-4 py-2.5 rounded-xl cursor-pointer"
                      >
                        &larr; Previous Chapter
                      </button>
                    ) : (
                      <span />
                    )}

                    {data.next_chapter && (
                      <button
                        onClick={() =>
                          setSearchParams({
                            slug: book.slug,
                            chapter: data.next_chapter.chapter_no,
                          })
                        }
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow transition cursor-pointer"
                      >
                        {data.next_chapter.is_locked
                          ? `Next Chapter (Locked 🔒)`
                          : `Next Chapter & Claim Reward →`}
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-xs text-gray-500 mb-4">
                    Select a chapter from the left menu to begin reading.
                  </p>
                  {chapters.length > 0 && (
                    <button
                      onClick={() =>
                        setSearchParams({ slug: book.slug, chapter: chapters[0].chapter_no })
                      }
                      className="bg-gray-900 text-white font-bold text-xs px-5 py-2.5 rounded-xl cursor-pointer"
                    >
                      Open Chapter 1
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // Bookstore Library View
  // ============================================================================
  const books = data?.books || [];
  const cats = data?.cats || [];

  return (
    <div className="bg-gray-100 min-h-screen py-8 pb-16">
      <SEO title="Digital Bookstore — Buy, Read & Publish Books" />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 space-y-6">
        <div className="bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-900 rounded-2xl p-6 sm:p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-400">
              Read, Publish & Monetize Ecosystem
            </span>
            <h1 className="text-2xl sm:text-4xl font-extrabold mt-1">
              Digital Bookstore & Author Marketplace
            </h1>
            <p className="text-xs sm:text-sm text-gray-300 mt-1.5 max-w-xl">
              Explore free & premium books, earn rewards as you read chapters, or write and set a
              price on your own books using our Publishing Studio Editor.
            </p>
            <div className="flex flex-wrap gap-2 mt-5">
              <button
                onClick={() => setSearchParams({})}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                  !category
                    ? 'bg-amber-500 text-gray-950'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                All Genres
              </button>
              {cats.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setSearchParams({ category: c.category })}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    category === c.category
                      ? 'bg-amber-500 text-gray-950'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  {c.category} ({c.total})
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 sm:p-5 max-w-xs shrink-0">
            <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-gray-950 px-2 py-0.5 rounded">
              For Book Writers
            </span>
            <h3 className="text-sm font-extrabold mt-2">
              Publish & Price Your Own Books
            </h3>
            <p className="text-[11px] text-purple-200 mt-1">
              Write chapters with our Studio Editor, set your own book price (or offer free sample
              chapters), and receive direct earnings in your wallet.
            </p>
            <Link
              to="/members?tab=books"
              className="mt-3 inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-gray-950 font-black text-xs px-4 py-2 rounded-xl transition"
            >
              <i className="bi bi-journal-plus" />
              <span>Write & Price a Book &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Google AdSense / AdMob Bookstore Slot */}
        <AdBanner placement="article" />

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {books.map((b) => {
            const isPaid = Number(b.price) > 0;
            return (
              <Link
                key={b.id}
                to={`/book?slug=${encodeURIComponent(b.slug)}`}
                className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition flex flex-col group"
              >
                <div className="relative aspect-[3/4] bg-gray-100 overflow-hidden">
                  <img
                    src={b.cover_image}
                    alt={b.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <span
                    className={`absolute top-2 right-2 px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow ${
                      !isPaid
                        ? 'bg-emerald-500 text-white'
                        : b.is_purchased
                        ? 'bg-indigo-600 text-white'
                        : 'bg-amber-400 text-gray-950'
                    }`}
                  >
                    {!isPaid ? 'FREE' : b.is_purchased ? 'OWNED ✓' : money(b.price)}
                  </span>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600">{b.category}</span>
                    <h2 className="text-xs font-extrabold text-gray-900 group-hover:text-amber-600 line-clamp-2 mt-0.5">
                      {b.title}
                    </h2>
                    <p className="text-[11px] text-gray-500 mt-0.5 truncate">{b.author}</p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                    {isPaid ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-xs font-black text-gray-900">{money(b.price)}</span>
                        {Number(b.compare_price) > Number(b.price) && (
                          <span className="text-[10px] text-gray-400 line-through">
                            {money(b.compare_price)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[11px] font-extrabold text-emerald-600">Free</span>
                    )}
                    <span className="text-[10px] font-bold text-amber-600">
                      {b.chapters} ch &rarr;
                    </span>
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
