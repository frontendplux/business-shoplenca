# Shoplenca — React + Vite E-Commerce, Vendor Marketplace & E-Book Platform

A responsive, SEO-ready **React + Vite** e-commerce marketplace and digital bookstore powered by a modular **PHP + MySQL REST API (`/api`)**. Designed with a clean separation between frontend (`src/`) and backend (`api/`) so it can be easily customized or packaged into a native Android/iOS mobile app.

---

## ✨ Key Features

- **Modern React + Vite + Tailwind v4 Frontend**:
  - Jumia-inspired responsive homepage with category flyout mega-menu, hero slider, flash sales, horizontal product carousels, verified buyer reviews, and newsletter signup.
  - Dynamic SEO metadata (`<SEO />`) with OpenGraph, Twitter Cards, canonical tags, and JSON-LD structured data on every route.
  - Multi-currency switcher with live price conversion across the entire store.
- **Unified `/api` Backend (Web & Mobile Ready)**:
  - All backend data, authentication, cart, wishlist, checkout, member/vendor actions, and admin operations live inside `/api`.
  - Supports both **PHP session cookies** (for web) and **`Authorization: Bearer <token>`** headers (for mobile apps).
- **Members Hub (`/members`) & Flexible Vendor Mode**:
  - **Choose to Become a Vendor or Not**: Any registered user can opt in to become a Vendor or switch back to a regular shopper account with a single click on the Members page.
  - **Vendor Storefront & Product Manager**: Active vendors can customize their store name, description, business contact, bank payout details, and add/edit/delete their own products.
  - **Admin Quick-Switch**: When an Administrator signs in to the Members page, a **"Go to Admin"** button appears prominently in both the top header and the sidebar navigation menu.
- **Full Admin Control Center (`/admin`)**:
  - **Multi-Gateway Payment & API Key Manager**: Configure **Paystack**, **Flutterwave**, **Stripe**, **PayPal**, **Razorpay**, **Crypto / USDT Wallet**, **Manual Bank Transfer**, **Cash on Delivery (COD)**, or add custom payment gateways.
  - Place your **Public Key**, **Secret Key**, **Webhook Secret**, **Merchant ID**, switch between **Test/Sandbox** and **Live** modes, and toggle gateways on/off. Active gateways automatically appear on `/checkout`.
  - Full CRUD for **Orders**, **Products**, **Categories / Subcategories / Brands**, **Homepage Inventories**, **Users & Vendors**, **Blog Articles**, **Digital Books**, **Customer Messages**, and **Store Settings**.
- **Jumia-Style Product Page (`/product`)**:
  - 3-column Jumia layout featuring interactive image gallery with thumbnails & social share, Official Store & Verified Seller badges, Flash Sales countdown & stock progress bar, size/color variation selectors, Delivery & Return location estimator, Seller performance scorecard, and verified customer feedback histogram.
  - Built-in **Subdomain & Custom Domain Ownership Promo Card** advertising self-owned vendor stores for **`NGN 500/month`** (dynamically converted to any active currency).
- **Premium Subdomain & Custom Domain Store Ownership (`NGN 500/month` in All Currencies)**:
  - **Flexible Multi-Month & Multi-Year Billing**: Payable monthly (`1m`), quarterly (`3m`), bi-annually (`6m`), or multi-year (`1 Year`, `2 Years`, `3 Years`, `5 Years`) at `NGN 500/month` converted to all supported currencies.
  - **2-Day Extra Grace Period & Instant Reopen**: Stores receive an automatic **2-day extra grace period** after expiration before closing (`closed_overdue`), and **automatically reopen the instant the vendor pays** to renew.
  - **Two Settlement & Control Modes**:
    1. **Self-Managed Direct Mode (`0%` Company Interference)**: Store owner controls their own products, custom payment gateway API keys/bank details, and shipping/handling charges with zero company interference.
    2. **Company Wallet Mode (Database Payouts + Company Charges)**: Store owner uses the Company Wallet; customer payments settle into the vendor's database wallet (`users.wallet_balance`) with a full ledger (`vendor_wallet_transactions`) showing Gross Sale, Company Charge %, Company Charge Amount, and Net Vendor Payout.
- **Admin Vendor Verification (`/admin` & `/members`)**:
  - Vendors submit business registration / CAC details and verification documents in `/members?tab=vendor`.
  - Admins can **Verify & Approve**, **Reject with Note**, or **Revoke** vendor verification in `/admin`, awarding a **"Verified Seller"** badge across product and store pages.
- **Web Push Notifications (`public/sw.js` + `/api/notifications.php`)**:
  - Browser Service Worker (`public/sw.js`) + Notification Bell Inbox in Header with one-click browser push opt-in, Admin Push Broadcaster (`/admin`), and automated notifications on order checkout, vendor verification, and subdomain renewals.
- **Rich WYSIWYG Content Editor (`src/components/RichTextEditor.jsx`)**:
  - Full-featured visual editor (headings, font sizes, bold/italic/underline/strikethrough, text/highlight colors, alignments, lists, links, images, 2-column specification table builder, callout boxes, HTML source toggle, and fullscreen mode) integrated into **Book & Chapter writing**, **Product descriptions**, and **Blog posts**.
- **Digital Bookstore & Read-to-Earn (`/book`)**:
  - Interactive chapter reader with reading progress tracking, rich HTML chapter formatting, and wallet rewards.

---

## 📁 Project Structure

```text
shopping/
├── api/                        # All backend PHP + MySQL REST endpoints
│   ├── config/
│   │   ├── db.php              # MySQL connection, CORS, Bearer/session auth & auto-schema
│   │   ├── mailer.php          # PHPMailer wrapper for transactional emails
│   │   └── schema.sql          # Full SQL schema reference
│   ├── index.php               # Central API router
│   ├── bootstrap.php           # Initial app state (company, categories, currencies, user, counts)
│   ├── home.php                # Homepage inventories, featured categories & site reviews
│   ├── products.php            # Product catalog, facet filters, search, detail & reviews
│   ├── cart.php                # Cart items, quantities, free-shipping progress & totals
│   ├── wishlist.php            # Saved wishlist items
│   ├── checkout.php            # Active payment gateways & order creation
│   ├── auth.php                # Sign in, Sign up, Logout & 3-step password reset
│   ├── member.php              # Member profile, orders, vendor toggle & vendor product CRUD
│   ├── admin.php               # Full Admin dashboard & Payment Gateway API key management
│   ├── blog.php                # Editorial blog posts & categories
│   ├── books.php               # Digital bookstore & chapter reader with rewards
│   ├── contact.php             # Support cards & contact form handler
│   └── pages.php               # Static pages (/about, /privacy-policy)
├── src/                        # React + Vite frontend source
│   ├── components/
│   │   ├── Layout/             # Header.jsx, Footer.jsx, Layout.jsx
│   │   ├── ProductCard.jsx     # Reusable product card with discount badge & quick cart
│   │   └── SEO.jsx             # Dynamic document title, meta tags & JSON-LD schema
│   ├── config/
│   │   └── appConfig.js        # Central API URL & app constants (edit for mobile app builds)
│   ├── context/
│   │   └── StoreContext.jsx    # Global store state (auth, currency, cart, wishlist, toasts)
│   ├── pages/                  # Route views
│   │   ├── HomePage.jsx
│   │   ├── CategoryPage.jsx
│   │   ├── ProductPage.jsx
│   │   ├── CartPage.jsx
│   │   ├── CheckoutPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── MemberPage.jsx
│   │   ├── AdminPage.jsx
│   │   ├── BlogPage.jsx
│   │   ├── BooksPage.jsx
│   │   ├── ContactPage.jsx
│   │   ├── StaticPage.jsx
│   │   └── NotFoundPage.jsx
│   ├── services/
│   │   └── api.js              # Unified fetch client with Bearer token & currency headers
│   ├── App.jsx                 # React Router v7 routes
│   ├── main.jsx                # Application entry point
│   └── index.css               # Tailwind v4 styles & custom utilities
├── dist/                       # Production build output (generated by `npm run build`)
├── .htaccess                   # Apache/cPanel rewrite rules for `/api` and SPA routing
├── index.html                  # Vite HTML entry template
├── package.json                # Node scripts & dependencies
└── vite.config.js              # Vite config + automatic PHP `/api` dev server proxy
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** `v18+` (tested with `v22.20.0`)
- **PHP** `v8.0+` (in your system `PATH`)
- **MySQL / MariaDB** (e.g. via XAMPP, Laragon, or WAMP)

### 1. Database Setup
1. Ensure MySQL is running on `localhost` with database name **`bluestore`** (configurable in [`api/config/db.php`](file:///c:/Users/HP/Desktop/air9tv/shopping/api/config/db.php)).
2. If setting up on a fresh MySQL instance, import [`api/config/schema.sql`](file:///c:/Users/HP/Desktop/air9tv/shopping/api/config/schema.sql).
3. On the first API request, [`api/config/db.php`](file:///c:/Users/HP/Desktop/air9tv/shopping/api/config/db.php) automatically runs `ensure_extended_schema()` to ensure `payment_gateways`, `site_settings`, `vendors`, `orders`, and `order_items` tables exist and are seeded.

### 2. Install Dependencies & Run Development Server
```bash
npm install
npm run dev
```
- Vite starts on `http://localhost:5173`.
- [`vite.config.js`](file:///c:/Users/HP/Desktop/air9tv/shopping/vite.config.js) automatically spawns `php -S 127.0.0.1:8088` in the background and proxies all `/api/*` calls to PHP.

### 3. Build for Production
```bash
npm run build
```
- Generates optimized static assets in `dist/`.
- The included [`.htaccess`](file:///c:/Users/HP/Desktop/air9tv/shopping/.htaccess) routes `/api/*` requests directly to the PHP backend and serves `dist/` for all frontend SPA routes.

---

## 🔐 Default Admin & Member Access

- **Login URL**: `/login`
- **Default Admin Account**:
  - **Username / Email**: `admin` (or `tunde.adebayo1@demo.com`)
  - **Password**: `ChangeMe123!`
- Once signed in:
  - Visit **`/members`** to view the Member Dashboard, toggle **"Become a Vendor"**, or click **"Go to Admin"** in the menu.
  - Visit **`/admin`** directly to manage Payment Gateways & API keys, Orders, Products, Categories, Inventories, Users/Vendors, and Store Settings.

---

## 💳 Configuring Payment Gateways & API Keys

1. Sign in as an Admin and navigate to **`/admin`**.
2. Click the **"Payment Gateways & API Keys"** tab.
3. Choose any gateway (**Paystack**, **Flutterwave**, **Stripe**, **PayPal**, **Razorpay**, **Crypto / USDT**, **Manual Bank Transfer**, or **Cash on Delivery**):
   - Toggle **Enabled / Disabled**.
   - Select **Test / Sandbox Mode** or **Live Production Mode**.
   - Enter your **Public Key**, **Secret Key**, **Webhook Secret**, and **Merchant ID**.
   - Click **Save Keys**.
4. Any enabled gateway immediately appears on **`/checkout`**.

---

## 📱 Turning This Project into a Mobile App (Capacitor / React Native)

Because all backend logic lives in `/api` and authentication uses `Authorization: Bearer <token>` stored by [`src/services/api.js`](file:///c:/Users/HP/Desktop/air9tv/shopping/src/services/api.js):

1. Set your production API URL in an `.env` file before building:
   ```env
   VITE_API_BASE_URL=https://your-live-domain.com/api
   ```
2. Build the web assets:
   ```bash
   npm run build
   ```
3. Initialize Capacitor (for Android & iOS):
   ```bash
   npm install @capacitor/core @capacitor/cli
   npx cap init "Shoplenca" "com.shoplenca.app" --web-dir=dist
   npm install @capacitor/android @capacitor/ios
   npx cap add android
   npx cap sync
   ```


ssh root@162.0.230.28
M2z0OUBrpv53cbKE31



git add .
git commit -m "new"
git push -u origin main