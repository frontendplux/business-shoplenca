<?php
// ============================================================================
// /api/bootstrap.php
// Returns site settings, navigation tree (categories -> subcategories -> brands),
// active currencies, current selected currency, authenticated user, and badge counts
// ============================================================================

require_once __DIR__ . '/config/db.php';

$input = req_input();
$company = get_site_settings($conn);
$user = get_auth_user($conn);

// 1. Handle currency selection / detection
$reqCurrency = $input['currency'] ?? ($_SERVER['HTTP_X_CURRENCY'] ?? null);
if (!empty($reqCurrency)) {
    $_SESSION['currency'] = strtoupper(substr(trim((string)$reqCurrency), 0, 3));
} elseif (empty($_SESSION['currency'])) {
    $_SESSION['currency'] = 'USD';
}

$activeCurrencies = db_rows(
    $conn,
    "SELECT id, code, name, symbol, exchange_rate, is_default FROM currencies WHERE status = 'active' ORDER BY is_default DESC, code ASC"
);

$currentCurrency = null;
foreach ($activeCurrencies as $cur) {
    if ($cur['code'] === $_SESSION['currency']) {
        $currentCurrency = $cur;
        break;
    }
}
if (!$currentCurrency) {
    foreach ($activeCurrencies as $cur) {
        if ((int)$cur['is_default'] === 1 || $cur['code'] === 'USD') {
            $currentCurrency = $cur;
            break;
        }
    }
}
if (!$currentCurrency) {
    $currentCurrency = ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'exchange_rate' => 1.0];
}
$currentCurrency['exchange_rate'] = (float)$currentCurrency['exchange_rate'];

// 2. Navigation tree: Categories -> Subcategories -> Brands
$sqlNav = "
    SELECT 
        c.id AS cat_id, c.name AS cat_name, c.slug AS cat_slug, c.image AS cat_image, c.description AS cat_desc,
        sc.id AS sub_id, sc.name AS sub_name, sc.slug AS sub_slug, sc.image AS sub_image,
        bc.id AS brand_id, bc.name AS brand_name, bc.slug AS brand_slug, bc.image AS brand_image
    FROM category c
    LEFT JOIN sub_category sc ON sc.category_id = c.id
    LEFT JOIN brand_category bc ON bc.sub_category_id = sc.id
    ORDER BY c.id ASC, sc.id ASC, bc.id ASC
";
$navRows = db_rows($conn, $sqlNav);
$categoriesMap = [];

foreach ($navRows as $row) {
    $catId = (int)$row['cat_id'];
    $subId = $row['sub_id'] ? (int)$row['sub_id'] : null;
    $brandId = $row['brand_id'] ? (int)$row['brand_id'] : null;

    if (!isset($categoriesMap[$catId])) {
        $categoriesMap[$catId] = [
            'id'             => $catId,
            'name'           => $row['cat_name'],
            'slug'           => $row['cat_slug'],
            'image'          => $row['cat_image'],
            'description'    => $row['cat_desc'],
            'sub_categories' => [],
        ];
    }

    if ($subId && !isset($categoriesMap[$catId]['sub_categories'][$subId])) {
        $categoriesMap[$catId]['sub_categories'][$subId] = [
            'id'     => $subId,
            'name'   => $row['sub_name'],
            'slug'   => $row['sub_slug'],
            'image'  => $row['sub_image'],
            'brands' => [],
        ];
    }

    if ($subId && $brandId && !isset($categoriesMap[$catId]['sub_categories'][$subId]['brands'][$brandId])) {
        $categoriesMap[$catId]['sub_categories'][$subId]['brands'][$brandId] = [
            'id'    => $brandId,
            'name'  => $row['brand_name'],
            'slug'  => $row['brand_slug'],
            'image' => $row['brand_image'],
        ];
    }
}

$categories = [];
foreach ($categoriesMap as $cat) {
    $subs = [];
    foreach ($cat['sub_categories'] as $sub) {
        $sub['brands'] = array_values($sub['brands']);
        $subs[] = $sub;
    }
    $cat['sub_categories'] = $subs;
    $categories[] = $cat;
}

// 3. Standalone / unlinked brands
$unlinkedBrands = db_rows($conn, "SELECT id, name, slug, image FROM brand_category WHERE sub_category_id IS NULL ORDER BY name ASC");

// 4. Cart, Wishlist & Notification counts
$cartCount = 0;
$wishlistCount = 0;
$wishlistIds = [];

if ($user) {
    $uid = $user['uid'];
    $cRow = db_one($conn, "SELECT COALESCE(SUM(quantity), 0) AS total FROM cart_items WHERE uid = ?", 's', [$uid]);
    $cartCount = (int)($cRow['total'] ?? 0);

    $wRows = db_rows($conn, "SELECT product_id FROM wishlist WHERE uid = ?", 's', [$uid]);
    $wishlistIds = array_map(fn($r) => (int)$r['product_id'], $wRows);
    $wishlistCount = count($wishlistIds);

    $notifications = db_rows(
        $conn,
        "SELECT id, target_uid, title, message, type, link, icon, is_read, created_at
           FROM push_notifications
          WHERE target_uid IS NULL OR target_uid = ?
          ORDER BY created_at DESC, id DESC LIMIT 12",
        's',
        [$uid]
    );
    $unreadRow = db_one($conn, "SELECT COUNT(*) AS c FROM push_notifications WHERE (target_uid IS NULL OR target_uid = ?) AND is_read = 0", 's', [$uid]);
} else {
    $notifications = db_rows(
        $conn,
        "SELECT id, target_uid, title, message, type, link, icon, is_read, created_at
           FROM push_notifications
          WHERE target_uid IS NULL
          ORDER BY created_at DESC, id DESC LIMIT 8"
    );
    $unreadRow = db_one($conn, "SELECT COUNT(*) AS c FROM push_notifications WHERE target_uid IS NULL AND is_read = 0");
}

foreach ($notifications as &$n) {
    $n['id']      = (int)$n['id'];
    $n['is_read'] = (bool)$n['is_read'];
}
unset($n);

json_out([
    'ok'                   => true,
    'company'              => $company,
    'categories'           => $categories,
    'unlinked_brands'      => $unlinkedBrands,
    'currencies'           => $activeCurrencies,
    'currency'             => $currentCurrency,
    'user'                 => $user,
    'cart_count'           => $cartCount,
    'wishlist_count'       => $wishlistCount,
    'wishlist_ids'         => $wishlistIds,
    'notifications'        => $notifications,
    'unread_notifications' => (int)($unreadRow['c'] ?? 0),
]);


