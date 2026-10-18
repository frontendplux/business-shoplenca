<?php
// ============================================================================
// /api/config/db.php
// Central database connection, schema auto-migrations, auth & query helpers
// Designed for both Web (Session Cookies) and Mobile App (Bearer Token) usage
// ============================================================================

if (session_status() === PHP_SESSION_NONE) {
    @session_start();
}

// CORS & JSON Headers (allows Vite dev server & future Mobile App WebViews)
$origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
header("Access-Control-Allow-Origin: " . ($origin !== '*' ? $origin : '*'));
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, X-Currency");

if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

define("DB_HOST", getenv("DB_HOST") ?: "localhost");
define("DB_USER", getenv("DB_USER") ?: "root");
define("DB_PASS", getenv("DB_PASS") !== false ? getenv("DB_PASS") : "");
define("DB_NAME", getenv("DB_NAME") ?: "bluestore");

mysqli_report(MYSQLI_REPORT_OFF);
$conn = @new mysqli(DB_HOST, DB_USER, DB_PASS);
if ($conn->connect_error) {
    header('Content-Type: application/json');
    http_response_code(500);
    echo json_encode(['ok' => false, 'message' => 'Database connection failed: ' . $conn->connect_error]);
    exit;
}

$conn->query("CREATE DATABASE IF NOT EXISTS `" . DB_NAME . "` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
$conn->select_db(DB_NAME);
$conn->set_charset("utf8mb4");

// ============================================================================
// Query Helpers
// ============================================================================

function db_rows(mysqli $conn, string $sql, string $types = '', array $params = []): array {
    $stmt = $conn->prepare($sql);
    if (!$stmt) return [];
    if ($types !== '' && !empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    if (!$stmt->execute()) {
        $stmt->close();
        return [];
    }
    $res = $stmt->get_result();
    $rows = $res ? $res->fetch_all(MYSQLI_ASSOC) : [];
    $stmt->close();
    return $rows;
}

function db_one(mysqli $conn, string $sql, string $types = '', array $params = []): ?array {
    $rows = db_rows($conn, $sql, $types, $params);
    return $rows[0] ?? null;
}

function db_run(mysqli $conn, string $sql, string $types = '', array $params = []): array {
    $stmt = $conn->prepare($sql);
    if (!$stmt) {
        return ['ok' => false, 'rows' => 0, 'insert_id' => 0, 'errno' => $conn->errno, 'error' => $conn->error];
    }
    if ($types !== '' && !empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    $ok = $stmt->execute();
    $res = [
        'ok'        => $ok,
        'rows'      => $stmt->affected_rows,
        'insert_id' => $stmt->insert_id,
        'errno'     => $stmt->errno,
        'error'     => $stmt->error,
    ];
    $stmt->close();
    return $res;
}

function json_out(array $payload, int $status = 200): void {
    header('Content-Type: application/json; charset=utf-8');
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function req_input(): array {
    static $cached = null;
    if ($cached !== null) return $cached;
    $raw = file_get_contents('php://input');
    $json = $raw ? json_decode($raw, true) : null;
    if (is_array($json)) {
        $cached = array_merge($_GET, $_POST, $json);
    } else {
        $cached = array_merge($_GET, $_POST);
    }
    return $cached;
}

function slugify(string $text): string {
    $text = strtolower(trim($text));
    $text = preg_replace('/[^a-z0-9]+/', '-', $text);
    $text = trim($text, '-');
    return $text !== '' ? $text : ('item-' . substr(bin2hex(random_bytes(4)), 0, 6));
}

function first_product_image(?string $json): string {
    $fallback = 'https://placehold.co/400x500/f3e8ff/7b1d8e?text=Product';
    if (!$json) return $fallback;
    $spec = json_decode($json, true);
    if (!is_array($spec)) return $fallback;
    if (!empty($spec['image'])) return $spec['image'];
    if (!empty($spec['images'][0])) return $spec['images'][0];
    return $fallback;
}

// ============================================================================
// Auto-Ensure Extended Schema (Payment Gateways, Orders, Vendors, Settings)
// ============================================================================

function ensure_extended_schema(mysqli $conn): void {
    $check = $conn->query("SHOW TABLES LIKE 'payment_gateways'");
    if (!$check || $check->num_rows === 0) {
        // 1. Site Settings
        $conn->query("CREATE TABLE IF NOT EXISTS site_settings (
            setting_key VARCHAR(64) PRIMARY KEY,
            setting_value TEXT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) DEFAULT CHARSET=utf8mb4");

        $defaultSettings = [
            ['company_name', 'Shoplenca'],
            ['company_title', 'Shoplenca - Buy, sell, and launch your own custom domain store'],
            ['company_desc', 'Create your own subdomain store or attach a custom domain. Buy, sell, and grow your e-commerce business effortlessly with Shoplenca.'],
            ['company_keywords', 'e-commerce, buy and sell, online store, custom domain, subdomain, shoplenca, start online store'],
            ['company_logo', '/logo.png'],
            ['shipping_fee', '99'],
            ['free_ship_min', '999'],
            ['prepaid_discount', '10'],
            ['announcement_text', 'Free shipping above $99 · Own your own Subdomain/Domain Store for just NGN 500/mo!'],
            ['writer_reward_per_read', '0.50'],
            ['reader_reward_per_chapter', '0.10'],
            ['subdomain_fee_ngn', '500'],
            ['subdomain_grace_days', '2'],
            ['company_wallet_charge_pct', '2.5'],
        ];
        $stmtSet = $conn->prepare("INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES (?, ?)");
        if ($stmtSet) {
            foreach ($defaultSettings as [$k, $v]) {
                $stmtSet->bind_param("ss", $k, $v);
                $stmtSet->execute();
            }
            $stmtSet->close();
        }

        // 2. Payment Gateways
        $conn->query("CREATE TABLE IF NOT EXISTS payment_gateways (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            name VARCHAR(100) NOT NULL,
            gateway_type ENUM('online', 'crypto', 'manual', 'cod') NOT NULL DEFAULT 'online',
            description VARCHAR(255) NULL,
            icon VARCHAR(50) DEFAULT 'bi-credit-card',
            mode ENUM('test', 'live') DEFAULT 'test',
            public_key VARCHAR(255) NULL,
            secret_key VARCHAR(255) NULL,
            webhook_secret VARCHAR(255) NULL,
            merchant_id VARCHAR(255) NULL,
            supported_currencies VARCHAR(255) DEFAULT 'USD,NGN,EUR,GBP,INR',
            extra_config JSON NULL,
            prepaid_discount BOOLEAN DEFAULT TRUE,
            is_active BOOLEAN DEFAULT TRUE,
            sort_order INT DEFAULT 0,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) DEFAULT CHARSET=utf8mb4");

        // 3. Vendors Table
        $conn->query("CREATE TABLE IF NOT EXISTS vendors (
            id INT AUTO_INCREMENT PRIMARY KEY,
            uid VARCHAR(64) UNIQUE NOT NULL,
            store_name VARCHAR(150) NOT NULL,
            store_slug VARCHAR(150) UNIQUE NOT NULL,
            title VARCHAR(255) NULL,
            logo VARCHAR(255) NULL,
            banner VARCHAR(255) NULL,
            description TEXT NULL,
            keywords TEXT NULL,
            store_address VARCHAR(255) NULL,
            business_phone VARCHAR(30) NULL,
            status ENUM('active', 'pending', 'suspended') DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) DEFAULT CHARSET=utf8mb4");

        // 4. Orders & Order Items Tables
        $conn->query("CREATE TABLE IF NOT EXISTS orders (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_number VARCHAR(32) UNIQUE NOT NULL,
            uid VARCHAR(64) NOT NULL,
            full_name VARCHAR(120) NOT NULL,
            phone VARCHAR(30) NOT NULL,
            email VARCHAR(120) NULL,
            address TEXT NOT NULL,
            landmark VARCHAR(255) NULL,
            city VARCHAR(100) NOT NULL,
            state VARCHAR(100) NOT NULL,
            pincode VARCHAR(20) NOT NULL,
            notes TEXT NULL,
            payment_method VARCHAR(50) NOT NULL,
            payment_gateway_name VARCHAR(100) NULL,
            payment_status ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
            payment_reference VARCHAR(150) NULL,
            order_status ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
            currency_code CHAR(3) DEFAULT 'USD',
            exchange_rate DECIMAL(18,6) DEFAULT 1.000000,
            subtotal DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            shipping_fee DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            total_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) DEFAULT CHARSET=utf8mb4");

        $conn->query("CREATE TABLE IF NOT EXISTS order_items (
            id INT AUTO_INCREMENT PRIMARY KEY,
            order_id INT NOT NULL,
            product_id INT NULL,
            vendor_uid VARCHAR(64) NULL,
            product_name VARCHAR(255) NOT NULL,
            product_slug VARCHAR(255) NULL,
            product_image VARCHAR(255) NULL,
            size VARCHAR(50) NULL,
            color VARCHAR(50) NULL,
            quantity INT NOT NULL DEFAULT 1,
            unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
            line_total DECIMAL(12,2) NOT NULL DEFAULT 0.00
        ) DEFAULT CHARSET=utf8mb4");
    }

    // ========================================================================
    // V2 Schema Upgrades: Push Notifications, Vendor Verification,
    // Subdomain/Custom Domain Ownership (NGN 500/mo, 2-day grace, multi-year,
    // Self-Managed vs Company Wallet + Company Charges ledger)
    // ========================================================================
    $v2Check = $conn->query("SHOW COLUMNS FROM push_notifications LIKE 'message'");
    if (!$v2Check || $v2Check->num_rows === 0) {
        // Ensure new site settings exist
        $extraSettings = [
        ['subdomain_fee_ngn', '500'],
        ['subdomain_grace_days', '2'],
        ['company_wallet_charge_pct', '2.5'],
    ];
    foreach ($extraSettings as [$sk, $sv]) {
        db_run($conn, "INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES (?, ?)", 'ss', [$sk, $sv]);
    }

    // Upgrade vendors table with Verification + Subdomain/Custom Domain + Payment Mode
    $vendorCols = [
        'is_verified'             => "ALTER TABLE vendors ADD COLUMN is_verified BOOLEAN DEFAULT FALSE AFTER status",
        'verification_status'     => "ALTER TABLE vendors ADD COLUMN verification_status ENUM('unverified', 'pending', 'verified', 'rejected') DEFAULT 'unverified' AFTER is_verified",
        'verification_note'       => "ALTER TABLE vendors ADD COLUMN verification_note TEXT NULL AFTER verification_status",
        'business_reg_no'         => "ALTER TABLE vendors ADD COLUMN business_reg_no VARCHAR(100) NULL AFTER verification_note",
        'id_doc_url'              => "ALTER TABLE vendors ADD COLUMN id_doc_url VARCHAR(255) NULL AFTER business_reg_no",
        'verified_at'             => "ALTER TABLE vendors ADD COLUMN verified_at DATETIME NULL AFTER id_doc_url",
        'subdomain'               => "ALTER TABLE vendors ADD COLUMN subdomain VARCHAR(100) NULL AFTER verified_at",
        'custom_domain'           => "ALTER TABLE vendors ADD COLUMN custom_domain VARCHAR(190) NULL AFTER subdomain",
        'domain_plan_active'      => "ALTER TABLE vendors ADD COLUMN domain_plan_active BOOLEAN DEFAULT FALSE AFTER custom_domain",
        'payment_mode'            => "ALTER TABLE vendors ADD COLUMN payment_mode ENUM('self_managed', 'company_wallet') DEFAULT 'self_managed' AFTER domain_plan_active",
        'own_gateway_config'      => "ALTER TABLE vendors ADD COLUMN own_gateway_config JSON NULL AFTER payment_mode",
        'subscription_starts_at'  => "ALTER TABLE vendors ADD COLUMN subscription_starts_at DATETIME NULL AFTER own_gateway_config",
        'subscription_expires_at' => "ALTER TABLE vendors ADD COLUMN subscription_expires_at DATETIME NULL AFTER subscription_starts_at",
        'grace_ends_at'           => "ALTER TABLE vendors ADD COLUMN grace_ends_at DATETIME NULL AFTER subscription_expires_at",
        'domain_store_status'     => "ALTER TABLE vendors ADD COLUMN domain_store_status ENUM('inactive', 'active', 'grace_period', 'closed_overdue') DEFAULT 'inactive' AFTER grace_ends_at",
    ];
    foreach ($vendorCols as $colName => $alterSql) {
        $c = $conn->query("SHOW COLUMNS FROM vendors LIKE '$colName'");
        if ($c && $c->num_rows === 0) {
            $conn->query($alterSql);
        }
    }

    // Mark first few seeded vendors as verified for realistic display
    $conn->query("UPDATE vendors SET is_verified = 1, verification_status = 'verified', verified_at = NOW() WHERE id <= 3");

    // Create / recreate domain_subscriptions table
    $conn->query("DROP TABLE IF EXISTS domain_subscriptions");
    $conn->query("CREATE TABLE IF NOT EXISTS domain_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uid VARCHAR(64) NOT NULL,
        subdomain VARCHAR(100) NOT NULL,
        custom_domain VARCHAR(190) NULL,
        months INT NOT NULL DEFAULT 1,
        amount_ngn DECIMAL(12,2) NOT NULL DEFAULT 500.00,
        amount_usd DECIMAL(12,4) NOT NULL DEFAULT 0.3200,
        currency_paid VARCHAR(10) DEFAULT 'NGN',
        amount_paid DECIMAL(12,2) NOT NULL DEFAULT 500.00,
        payment_mode ENUM('self_managed', 'company_wallet') DEFAULT 'self_managed',
        payment_method VARCHAR(50) DEFAULT 'paystack',
        payment_reference VARCHAR(120) NULL,
        starts_at DATETIME NOT NULL,
        expires_at DATETIME NOT NULL,
        grace_ends_at DATETIME NOT NULL,
        status VARCHAR(30) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_dom_sub_uid (uid)
    ) DEFAULT CHARSET=utf8mb4");

    // Create / recreate vendor_wallet_transactions table (for Company Wallet settlements + Company Charges)
    $conn->query("DROP TABLE IF EXISTS vendor_wallet_transactions");
    $conn->query("CREATE TABLE IF NOT EXISTS vendor_wallet_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vendor_uid VARCHAR(64) NOT NULL,
        order_id INT NULL,
        order_number VARCHAR(32) NULL,
        product_id INT NULL,
        product_name VARCHAR(255) NULL,
        tx_type VARCHAR(40) DEFAULT 'sale_credit',
        payment_mode VARCHAR(40) DEFAULT 'company_wallet',
        gross_amount DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
        company_charge_percent DECIMAL(6,2) NOT NULL DEFAULT 2.50,
        company_charge_amount DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
        net_vendor_amount DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
        currency_code VARCHAR(10) DEFAULT 'USD',
        status VARCHAR(30) DEFAULT 'completed',
        description VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vwt_uid (vendor_uid)
    ) DEFAULT CHARSET=utf8mb4");

    // Create / recreate push_notifications table
    $conn->query("DROP TABLE IF EXISTS push_notifications");
    $conn->query("CREATE TABLE IF NOT EXISTS push_notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        target_uid VARCHAR(64) NULL,
        title VARCHAR(180) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(40) DEFAULT 'info',
        link VARCHAR(255) DEFAULT '/',
        icon VARCHAR(100) DEFAULT 'bi-bell-fill',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_push_uid (target_uid)
    ) DEFAULT CHARSET=utf8mb4");

    // Create push_subscriptions table
    $conn->query("CREATE TABLE IF NOT EXISTS push_subscriptions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        uid VARCHAR(64) NULL,
        endpoint TEXT NOT NULL,
        p256dh VARCHAR(255) NULL,
        auth_key VARCHAR(255) NULL,
        user_agent VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) DEFAULT CHARSET=utf8mb4");

    // Seed welcome push notifications
    db_run(
        $conn,
        "INSERT INTO push_notifications (target_uid, title, message, type, link, icon)
         VALUES (NULL, 'Own Your Own Subdomain & Custom Domain!', 'Launch your self-managed store under our platform for just NGN 500/month (converted to all currencies). Zero company interference or choose Company Wallet settlement!', 'promo', '/member?tab=domain', 'bi-globe2')"
    );
        db_run(
            $conn,
            "INSERT INTO push_notifications (target_uid, title, message, type, link, icon)
             VALUES (NULL, 'Verified Vendor Badges Now Live', 'Vendors can now apply for official verification in the Member Hub to earn the Verified Seller badge on all product pages.', 'verification', '/member?tab=vendor', 'bi-patch-check-fill')"
        );
    }

    // ========================================================================
    // V3 Schema Upgrades: Book Pricing & Purchases, Google AdSense & Ad Slots,
    // and Native Capacitor / AdMob Mobile App Configuration
    // ========================================================================
    $v3Check = $conn->query("SHOW TABLES LIKE 'book_purchases'");
    if (!$v3Check || $v3Check->num_rows === 0) {
        $bookCols = [
            'price'                 => "ALTER TABLE books ADD COLUMN price DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER is_monetized",
            'compare_price'         => "ALTER TABLE books ADD COLUMN compare_price DECIMAL(12,2) NOT NULL DEFAULT 0.00 AFTER price",
            'free_preview_chapters' => "ALTER TABLE books ADD COLUMN free_preview_chapters INT NOT NULL DEFAULT 1 AFTER compare_price",
            'sales_count'           => "ALTER TABLE books ADD COLUMN sales_count INT NOT NULL DEFAULT 0 AFTER free_preview_chapters",
        ];
        foreach ($bookCols as $colName => $alterSql) {
            $c = $conn->query("SHOW COLUMNS FROM books LIKE '$colName'");
            if ($c && $c->num_rows === 0) {
                $conn->query($alterSql);
            }
        }

        // Seed sample paid prices on some books so the bookstore shows both Free & Paid books
        $conn->query("UPDATE books SET price = 4.99, compare_price = 9.99, free_preview_chapters = 1, sales_count = 14 WHERE id = 1 AND price = 0");
        $conn->query("UPDATE books SET price = 6.50, compare_price = 12.00, free_preview_chapters = 1, sales_count = 9 WHERE id = 2 AND price = 0");

        $conn->query("CREATE TABLE IF NOT EXISTS book_purchases (
            id INT AUTO_INCREMENT PRIMARY KEY,
            book_id INT NOT NULL,
            buyer_uid VARCHAR(64) NOT NULL,
            author_uid VARCHAR(64) NULL,
            amount_paid DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
            company_charge_percent DECIMAL(6,2) NOT NULL DEFAULT 2.50,
            company_charge_amount DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
            writer_net_amount DECIMAL(12,4) NOT NULL DEFAULT 0.0000,
            payment_method VARCHAR(50) DEFAULT 'wallet',
            payment_reference VARCHAR(120) NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE KEY uq_book_buyer (book_id, buyer_uid),
            INDEX idx_bp_buyer (buyer_uid),
            INDEX idx_bp_author (author_uid)
        ) DEFAULT CHARSET=utf8mb4");

        $v3Settings = [
            ['adsense_enabled', '1'],
            ['adsense_client_id', 'ca-pub-0000000000000000'],
            ['adsense_auto_ads', '1'],
            ['adsense_head_script', ''],
            ['adsense_slot_header', ''],
            ['adsense_html_header', ''],
            ['adsense_slot_home', ''],
            ['adsense_html_home', ''],
            ['adsense_slot_product', ''],
            ['adsense_html_product', ''],
            ['adsense_slot_category', ''],
            ['adsense_html_category', ''],
            ['adsense_slot_article', ''],
            ['adsense_html_article', ''],
            ['adsense_slot_footer', ''],
            ['adsense_html_footer', ''],
            ['capacitor_app_id', 'com.shoplenca.marketplace'],
            ['capacitor_app_name', 'Shoplenca Marketplace'],
            ['capacitor_server_url', ''],
            ['admob_enabled', '1'],
            ['admob_app_id_android', 'ca-app-pub-3940256099942544~3347511713'],
            ['admob_app_id_ios', 'ca-app-pub-3940256099942544~1458002511'],
            ['admob_banner_id', 'ca-app-pub-3940256099942544/6300978111'],
            ['admob_interstitial_id', 'ca-app-pub-3940256099942544/1033173712'],
            ['admob_rewarded_id', 'ca-app-pub-3940256099942544/5224354917'],
        ];
        foreach ($v3Settings as [$sk, $sv]) {
            db_run($conn, "INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES (?, ?)", 'ss', [$sk, $sv]);
        }
    }

    // Seed sample prices on top popular books once so the bookstore shows both Paid & Free books
    $seededBookCheck = db_one($conn, "SELECT setting_value FROM site_settings WHERE setting_key = 'books_price_seeded' LIMIT 1");
    if (!$seededBookCheck) {
        $conn->query("UPDATE books SET price = 4.99, compare_price = 9.99, free_preview_chapters = 1, sales_count = 28 WHERE id IN (1, 14, 19) AND price = 0");
        $conn->query("UPDATE books SET price = 7.50, compare_price = 15.00, free_preview_chapters = 1, sales_count = 19 WHERE id IN (2, 17, 21) AND price = 0");
        db_run($conn, "INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('books_price_seeded', '1')");
    }

    // ========================================================================
    // V4 Schema Upgrades:
    // 1. Order Escrow & Buyer Delivery + Good Condition Seal -> Admin Fund Release
    // 2. Personal Store Gift Cards & Direct Wallet Redemption (gift_cards)
    // 3. Homepage Custom Promo Ad Banners (home_promo_ads)
    // 4. Expanded Company Information Settings
    // ========================================================================
    $v4Check = $conn->query("SHOW TABLES LIKE 'gift_cards'");
    if (!$v4Check || $v4Check->num_rows === 0) {
        // 1. Upgrade orders table with Buyer Confirmation, Good Condition Seal & Admin Fund Release
        $orderEscrowCols = [
            'buyer_received'       => "ALTER TABLE orders ADD COLUMN buyer_received BOOLEAN DEFAULT FALSE AFTER order_status",
            'buyer_good_condition' => "ALTER TABLE orders ADD COLUMN buyer_good_condition BOOLEAN DEFAULT FALSE AFTER buyer_received",
            'is_sealed'            => "ALTER TABLE orders ADD COLUMN is_sealed BOOLEAN DEFAULT FALSE AFTER buyer_good_condition",
            'sealed_at'            => "ALTER TABLE orders ADD COLUMN sealed_at DATETIME NULL AFTER is_sealed",
            'admin_funds_released' => "ALTER TABLE orders ADD COLUMN admin_funds_released BOOLEAN DEFAULT FALSE AFTER sealed_at",
            'funds_released_at'    => "ALTER TABLE orders ADD COLUMN funds_released_at DATETIME NULL AFTER admin_funds_released",
            'escrow_status'        => "ALTER TABLE orders ADD COLUMN escrow_status VARCHAR(40) DEFAULT 'held_in_escrow' AFTER funds_released_at",
            'buyer_condition_note' => "ALTER TABLE orders ADD COLUMN buyer_condition_note TEXT NULL AFTER escrow_status",
        ];
        foreach ($orderEscrowCols as $colName => $alterSql) {
            $c = $conn->query("SHOW COLUMNS FROM orders LIKE '$colName'");
            if ($c && $c->num_rows === 0) {
                $conn->query($alterSql);
            }
        }

        // 2. Create Personal Store Gift Cards table
        $conn->query("CREATE TABLE IF NOT EXISTS gift_cards (
            id INT AUTO_INCREMENT PRIMARY KEY,
            code VARCHAR(50) UNIQUE NOT NULL,
            title VARCHAR(150) NOT NULL DEFAULT 'Shoplenca Official Gift Card',
            design_theme VARCHAR(40) DEFAULT 'royal_gold',
            amount_usd DECIMAL(12,2) NOT NULL DEFAULT 10.00,
            initial_balance DECIMAL(12,2) NOT NULL DEFAULT 10.00,
            remaining_balance DECIMAL(12,2) NOT NULL DEFAULT 10.00,
            created_by_uid VARCHAR(64) NULL,
            recipient_name VARCHAR(120) NULL,
            recipient_email VARCHAR(150) NULL,
            personal_message VARCHAR(255) NULL,
            redeemed_by_uid VARCHAR(64) NULL,
            redeemed_at DATETIME NULL,
            expires_at DATETIME NULL,
            status VARCHAR(30) DEFAULT 'active',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_gc_code (code),
            INDEX idx_gc_redeemed (redeemed_by_uid)
        ) DEFAULT CHARSET=utf8mb4");

        // Seed 4 Official Personal Store Gift Cards ready for testing & redemption
        $seedCards = [
            ['BG-GIFT-10USD', 'Shoplenca Starter Gift Card', 'emerald_festive', 10.00, 'Welcome to Shoplenca! Redeem directly into your Member Wallet.'],
            ['BG-GIFT-25USD', 'Shoplenca Gold Shopping Card', 'royal_gold', 25.00, 'Enjoy $25 instant wallet credit for shopping, books, or subdomain plans!'],
            ['BG-GIFT-50USD', 'Shoplenca Premium Purple Card', 'purple_vip', 50.00, 'VIP Gift Card — Redeemable 100% into your personal store wallet.'],
            ['BG-VIP-100USD', 'Shoplenca Executive Black Card', 'midnight_black', 100.00, 'Executive $100 Gift Card for store shopping & vendor services.'],
        ];
        foreach ($seedCards as [$gcCode, $gcTitle, $gcTheme, $gcAmt, $gcMsg]) {
            db_run(
                $conn,
                "INSERT IGNORE INTO gift_cards (code, title, design_theme, amount_usd, initial_balance, remaining_balance, personal_message, status, expires_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, 'active', DATE_ADD(NOW(), INTERVAL 2 YEAR))",
                'sssddds',
                [$gcCode, $gcTitle, $gcTheme, $gcAmt, $gcAmt, $gcAmt, $gcMsg]
            );
        }

        // 3. Create Homepage Custom Promo Banner Ads table
        $conn->query("CREATE TABLE IF NOT EXISTS home_promo_ads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            title VARCHAR(180) NOT NULL,
            subtitle VARCHAR(255) NULL,
            badge_text VARCHAR(60) DEFAULT 'Sponsored Promo',
            image_url VARCHAR(255) NULL,
            cta_text VARCHAR(60) DEFAULT 'Shop Now',
            cta_link VARCHAR(255) DEFAULT '/category',
            bg_gradient VARCHAR(120) DEFAULT 'from-purple-900 via-indigo-900 to-slate-900',
            placement_zone VARCHAR(50) DEFAULT 'top_strip',
            sort_order INT DEFAULT 1,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) DEFAULT CHARSET=utf8mb4");

        // Seed 3 Premium Homepage Promo Banner Ads
        $seedPromos = [
            [
                'Own Your Subdomain & Custom Domain Store for NGN 500/mo',
                'Full control over your products, payments & shipping with 0% company interference or choose Company Wallet settlement.',
                'Premium Storefront · NGN 500/mo',
                'https://picsum.photos/seed/promo-domain-store/900/400',
                'Launch Your Store',
                '/members?tab=domain',
                'from-indigo-950 via-purple-900 to-fuchsia-900',
                'top_strip',
                1,
            ],
            [
                'Buy & Redeem Official Store Gift Cards to Your Wallet',
                'Send personal gift cards to friends or redeem gift codes directly into your Member Wallet in any currency.',
                'Instant Wallet Credit',
                'https://picsum.photos/seed/promo-gift-cards/900/400',
                'Redeem or Buy Gift Card',
                '/members?tab=giftcards',
                'from-amber-600 via-orange-600 to-rose-700',
                'mid_page',
                2,
            ],
            [
                '100% Buyer Escrow Protection on Every Order',
                'Your payment is safely held until you receive your product and confirm it is in good condition before vendor funds are released.',
                'Escrow Protected',
                'https://picsum.photos/seed/promo-escrow-safe/900/400',
                'Shop With Confidence',
                '/category',
                'from-emerald-900 via-teal-900 to-slate-900',
                'bottom_strip',
                3,
            ],
        ];
        foreach ($seedPromos as [$pTitle, $pSub, $pBadge, $pImg, $pCta, $pLink, $pBg, $pZone, $pSort]) {
            db_run(
                $conn,
                "INSERT INTO home_promo_ads (title, subtitle, badge_text, image_url, cta_text, cta_link, bg_gradient, placement_zone, sort_order, is_active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)",
                'ssssssssi',
                [$pTitle, $pSub, $pBadge, $pImg, $pCta, $pLink, $pBg, $pZone, $pSort]
            );
        }

        // 4. Seed Expanded Company Information settings
        $v4Settings = [
            ['company_email', 'support@shoplenca.com'],
            ['company_phone', '+234 800 SHOPLENCA (289-4457)'],
            ['company_whatsapp', '+2348002894457'],
            ['company_address', 'Plot 42 Admiralty Way, Lekki Phase 1, Lagos & Global Fulfillment Hubs'],
            ['company_working_hours', 'Mon – Sat: 8:00 AM – 8:00 PM (24/7 Online Escrow & Support)'],
            ['company_mission', 'To empower every entrepreneur and author to own their own custom domain storefront, sell globally across all currencies, and protect every shopper with verified escrow delivery.'],
            ['company_vision', 'Building the most trusted borderless e-commerce, digital publishing, and self-owned subdomain marketplace in Africa and beyond.'],
            ['company_founded_year', '2024'],
            ['company_rc_number', 'RC-1948205'],
            ['social_facebook', 'https://facebook.com/shoplenca'],
            ['social_instagram', 'https://instagram.com/shoplenca'],
            ['social_twitter', 'https://x.com/shoplenca'],
            ['social_tiktok', 'https://tiktok.com/@shoplenca'],
            ['social_youtube', 'https://youtube.com/@shoplenca'],
            ['footer_copyright', '© 2026 Shoplenca Marketplace. All Rights Reserved. Escrow Protected & Multi-Currency Enabled.'],
            ['escrow_policy_text', 'When a customer buys and pays for a product, funds are held safely in Escrow until the customer clicks "I have received the product" AND "It is in good condition" to seal the order, after which Admin verifies and releases the payout to the vendor\'s wallet.'],
        ];
        foreach ($v4Settings as [$sk, $sv]) {
            db_run($conn, "INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES (?, ?)", 'ss', [$sk, $sv]);
        }
    }

    // V5 Brand Rename Migration: Ensure existing DB rows referencing Buygils / BlueStore are updated to Shoplenca
    $v5BrandSync = db_one($conn, "SELECT setting_value FROM site_settings WHERE setting_key = 'shoplenca_brand_synced' LIMIT 1");
    if (!$v5BrandSync) {
        $conn->query("UPDATE site_settings SET setting_value = REPLACE(REPLACE(REPLACE(REPLACE(setting_value, 'Buygils', 'Shoplenca'), 'buygils', 'shoplenca'), 'BUYGILS', 'SHOPLENCA'), 'BlueStore', 'Shoplenca')");
        $conn->query("UPDATE company_info SET name = 'Shoplenca', title = REPLACE(REPLACE(title, 'Buygils', 'Shoplenca'), 'BlueStore', 'Shoplenca'), description = REPLACE(REPLACE(description, 'Buygils', 'Shoplenca'), 'BlueStore', 'Shoplenca')");
        $conn->query("UPDATE gift_cards SET title = REPLACE(title, 'Buygils', 'Shoplenca'), personal_message = REPLACE(personal_message, 'Buygils', 'Shoplenca')");
        $conn->query("UPDATE static_pages SET title = REPLACE(REPLACE(title, 'Buygils', 'Shoplenca'), 'BlueStore', 'Shoplenca'), content = REPLACE(REPLACE(content, 'Buygils', 'Shoplenca'), 'BlueStore', 'Shoplenca')");
        db_run($conn, "INSERT IGNORE INTO site_settings (setting_key, setting_value) VALUES ('shoplenca_brand_synced', '1')");
    }
}

ensure_extended_schema($conn);

// ============================================================================
// Helper: NGN Conversion & Subdomain Grace Period Evaluation
// ============================================================================

function get_ngn_rate(mysqli $conn): float {
    static $rate = null;
    if ($rate !== null) return $rate;
    $row = db_one($conn, "SELECT exchange_rate FROM currencies WHERE code = 'NGN' LIMIT 1");
    $rate = ($row && (float)$row['exchange_rate'] > 0) ? (float)$row['exchange_rate'] : 1600.0;
    return $rate;
}

function ngn_to_usd(mysqli $conn, float $amountNgn): float {
    $ngnRate = get_ngn_rate($conn);
    return round($amountNgn / $ngnRate, 4);
}

/**
 * Evaluates a vendor's subdomain/custom domain subscription status in real time:
 * - Before expires_at -> 'active'
 * - Between expires_at and grace_ends_at (2-day extra grace) -> 'grace_period'
 * - After grace_ends_at -> 'closed_overdue' (automatically closed until renewed!)
 */
function evaluate_vendor_domain_status(mysqli $conn, ?array $vendor): ?array {
    if (!$vendor) return null;
    $vendor['is_verified']        = (bool)($vendor['is_verified'] ?? false);
    $vendor['domain_plan_active'] = (bool)($vendor['domain_plan_active'] ?? false);
    $vendor['own_gateway']        = json_decode($vendor['own_gateway_config'] ?? '{}', true) ?: [];

    if (!empty($vendor['subscription_expires_at'])) {
        $now      = time();
        $expTs    = strtotime($vendor['subscription_expires_at']);
        $graceTs  = !empty($vendor['grace_ends_at']) ? strtotime($vendor['grace_ends_at']) : ($expTs + (2 * 86400));
        $newState = 'active';
        $isActive = 1;

        if ($now <= $expTs) {
            $newState = 'active';
            $isActive = 1;
        } elseif ($now <= $graceTs) {
            $newState = 'grace_period';
            $isActive = 1; // Still open during the 2-day extra grace period!
        } else {
            $newState = 'closed_overdue';
            $isActive = 0; // Closed after 2-day grace expires; can reopen anytime when paid
        }

        if ($vendor['domain_store_status'] !== $newState || (int)$vendor['domain_plan_active'] !== $isActive) {
            db_run(
                $conn,
                "UPDATE vendors SET domain_store_status = ?, domain_plan_active = ? WHERE id = ?",
                'sii',
                [$newState, $isActive, (int)$vendor['id']]
            );
            $vendor['domain_store_status'] = $newState;
            $vendor['domain_plan_active'] = (bool)$isActive;
        }

        $vendor['days_remaining']       = max(0, (int)ceil(($expTs - $now) / 86400));
        $vendor['grace_hours_remaining'] = max(0, (int)ceil(($graceTs - $now) / 3600));
    } else {
        $vendor['days_remaining'] = 0;
        $vendor['grace_hours_remaining'] = 0;
    }

    return $vendor;
}

function send_push_notification(
    mysqli $conn,
    ?string $targetUid,
    string $title,
    string $message,
    string $type = 'info',
    string $link = '/',
    string $icon = 'bi-bell-fill'
): int {
    $r = db_run(
        $conn,
        "INSERT INTO push_notifications (target_uid, title, message, type, link, icon)
         VALUES (?, ?, ?, ?, ?, ?)",
        'ssssss',
        [$targetUid, $title, $message, $type, $link, $icon]
    );
    return (int)($r['insert_id'] ?? 0);
}

// ============================================================================
// Authentication & Authorization Helpers
// ============================================================================

function get_auth_user(mysqli $conn): ?array {
    static $cachedUser = false;
    if ($cachedUser !== false) return $cachedUser;

    $uid = null;
    $token = null;

    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? $_SERVER['REDIRECT_HTTP_AUTHORIZATION'] ?? '';
    if (preg_match('/Bearer\s+([^\s]+)/i', $authHeader, $m)) {
        $parts = explode(':', base64_decode($m[1]) ?: $m[1], 2);
        if (count($parts) === 2) {
            [$uid, $token] = $parts;
        }
    }

    if (!$uid || !$token) {
        $uid = $_SESSION['suid'] ?? null;
        $token = $_SESSION['tid'] ?? null;
    }

    if (!$uid || !$token) {
        $cachedUser = null;
        return null;
    }

    $user = db_one(
        $conn,
        "SELECT id, uid, username, firstname, lastname, email, phone, email_is_verified, phone_is_verified,
                status, is_admin, is_vendor, is_sub_domain_owner, COALESCE(wallet_balance, 0) AS wallet_balance, created_at
           FROM users WHERE uid = ? AND token = ? LIMIT 1",
        'ss',
        [$uid, $token]
    );

    if ($user) {
        $user['is_admin']  = (bool)$user['is_admin'];
        $user['is_vendor'] = (bool)$user['is_vendor'];
        $user['is_sub_domain_owner'] = (bool)$user['is_sub_domain_owner'];
        $user['email_is_verified'] = (bool)$user['email_is_verified'];
        $user['phone_is_verified'] = (bool)$user['phone_is_verified'];
        $user['wallet_balance'] = (float)$user['wallet_balance'];
        $user['display_name'] = !empty($user['username'])
            ? $user['username']
            : (!empty($user['firstname']) ? $user['firstname'] : $user['email']);
    }

    $cachedUser = $user ?: null;
    return $cachedUser;
}

function require_auth(mysqli $conn): array {
    $user = get_auth_user($conn);
    if (!$user) {
        json_out(['ok' => false, 'login' => true, 'message' => 'Authentication required. Please sign in.'], 401);
    }
    return $user;
}

function require_admin(mysqli $conn): array {
    $user = require_auth($conn);
    if (empty($user['is_admin'])) {
        json_out(['ok' => false, 'message' => 'Admin access required.'], 403);
    }
    return $user;
}

function get_site_settings(mysqli $conn): array {
    $rows = db_rows($conn, "SELECT setting_key, setting_value FROM site_settings");
    $map = [];
    foreach ($rows as $r) {
        $map[$r['setting_key']] = $r['setting_value'];
    }
    $ngnRate = get_ngn_rate($conn);
    $subFeeNgn = (float)($map['subdomain_fee_ngn'] ?? 500);
    return [
        'name'                      => $map['company_name'] ?? 'Shoplenca',
        'title'                     => $map['company_title'] ?? 'Shoplenca - Buy, sell, and launch your own custom domain store',
        'desc'                      => $map['company_desc'] ?? 'Create your own subdomain store or attach a custom domain. Buy, sell, and grow your e-commerce business effortlessly with Shoplenca.',
        'keywords'                  => $map['company_keywords'] ?? 'e-commerce, buy and sell, online store, custom domain, subdomain, shoplenca',
        'logo'                      => $map['company_logo'] ?? '/logo.png',
        'shipping_fee'              => (float)($map['shipping_fee'] ?? 99),
        'free_ship_min'             => (float)($map['free_ship_min'] ?? 999),
        'prepaid_discount'          => (float)($map['prepaid_discount'] ?? 10),
        'announcement_text'         => $map['announcement_text'] ?? 'Free shipping above $99 · Own your own Subdomain/Domain Store for just NGN 500/mo!',
        'writer_reward_per_read'    => (float)($map['writer_reward_per_read'] ?? 0.50),
        'reader_reward_per_chapter' => (float)($map['reader_reward_per_chapter'] ?? 0.10),
        'subdomain_fee_ngn'         => $subFeeNgn,
        'subdomain_fee_usd'         => round($subFeeNgn / $ngnRate, 4),
        'ngn_rate'                  => $ngnRate,
        'subdomain_grace_days'      => (int)($map['subdomain_grace_days'] ?? 2),
        'company_wallet_charge_pct' => (float)($map['company_wallet_charge_pct'] ?? 2.5),
        // AdSense & Web Ads
        'adsense_enabled'           => ($map['adsense_enabled'] ?? '1') === '1',
        'adsense_client_id'         => $map['adsense_client_id'] ?? '',
        'adsense_auto_ads'          => ($map['adsense_auto_ads'] ?? '1') === '1',
        'adsense_head_script'       => $map['adsense_head_script'] ?? '',
        'adsense_slot_header'       => $map['adsense_slot_header'] ?? '',
        'adsense_html_header'       => $map['adsense_html_header'] ?? '',
        'adsense_slot_home'         => $map['adsense_slot_home'] ?? '',
        'adsense_html_home'         => $map['adsense_html_home'] ?? '',
        'adsense_slot_product'      => $map['adsense_slot_product'] ?? '',
        'adsense_html_product'      => $map['adsense_html_product'] ?? '',
        'adsense_slot_category'     => $map['adsense_slot_category'] ?? '',
        'adsense_html_category'     => $map['adsense_html_category'] ?? '',
        'adsense_slot_article'      => $map['adsense_slot_article'] ?? '',
        'adsense_html_article'      => $map['adsense_html_article'] ?? '',
        'adsense_slot_footer'       => $map['adsense_slot_footer'] ?? '',
        'adsense_html_footer'       => $map['adsense_html_footer'] ?? '',
        // Capacitor Native App & AdMob
        'capacitor_app_id'          => $map['capacitor_app_id'] ?? 'com.shoplenca.marketplace',
        'capacitor_app_name'        => $map['capacitor_app_name'] ?? 'Shoplenca Marketplace',
        'capacitor_server_url'      => $map['capacitor_server_url'] ?? '',
        'admob_enabled'             => ($map['admob_enabled'] ?? '1') === '1',
        'admob_app_id_android'      => $map['admob_app_id_android'] ?? '',
        'admob_app_id_ios'          => $map['admob_app_id_ios'] ?? '',
        'admob_banner_id'           => $map['admob_banner_id'] ?? '',
        'admob_interstitial_id'     => $map['admob_interstitial_id'] ?? '',
        'admob_rewarded_id'         => $map['admob_rewarded_id'] ?? '',
        // Expanded Company Info
        'email'                     => $map['company_email'] ?? 'support@shoplenca.com',
        'phone'                     => $map['company_phone'] ?? '+234 800 SHOPLENCA (289-4457)',
        'whatsapp'                  => $map['company_whatsapp'] ?? '+2348002894457',
        'address'                   => $map['company_address'] ?? 'Plot 42 Admiralty Way, Lekki Phase 1, Lagos',
        'working_hours'             => $map['company_working_hours'] ?? 'Mon – Sat: 8:00 AM – 8:00 PM',
        'mission'                   => $map['company_mission'] ?? '',
        'vision'                    => $map['company_vision'] ?? '',
        'founded_year'              => $map['company_founded_year'] ?? '2024',
        'rc_number'                 => $map['company_rc_number'] ?? 'RC-1948205',
        'social_facebook'           => $map['social_facebook'] ?? '',
        'social_instagram'          => $map['social_instagram'] ?? '',
        'social_twitter'            => $map['social_twitter'] ?? '',
        'social_tiktok'             => $map['social_tiktok'] ?? '',
        'social_youtube'            => $map['social_youtube'] ?? '',
        'footer_copyright'          => $map['footer_copyright'] ?? '© 2026 Shoplenca Marketplace. All Rights Reserved.',
        'escrow_policy_text'        => $map['escrow_policy_text'] ?? '',
    ];
}
