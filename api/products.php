<?php
// ============================================================================
// /api/products.php
// Handles:
// 1. GET ?mode=detail&slug=<product_slug> -> Single Product detail + reviews + related
// 2. GET (catalog / category / search / inventory) -> Filtered products + facets
// 3. POST action=review -> Add product review or seller reply
// ============================================================================

require_once __DIR__ . '/config/db.php';

$input  = req_input();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// ============================================================================
// POST: Submit product review or reply
// ============================================================================
if ($method === 'POST') {
    $user   = require_auth($conn);
    $action = $input['action'] ?? 'review';

    if ($action === 'review') {
        $pid       = (int)($input['product_id'] ?? 0);
        $star      = max(1, min(5, (int)($input['star'] ?? 5)));
        $msg       = trim((string)($input['msg'] ?? ''));
        $parentId  = !empty($input['parent_id']) ? (int)$input['parent_id'] : null;

        if ($pid <= 0 || $msg === '') {
            json_out(['ok' => false, 'message' => 'Please enter your review message.'], 400);
        }

        if ($parentId) {
            $r = db_run(
                $conn,
                "INSERT INTO products_reviews (uid, parent_id, product_id, star, msg) VALUES (?, ?, ?, ?, ?)",
                'siiis',
                [$user['uid'], $parentId, $pid, $star, $msg]
            );
        } else {
            $r = db_run(
                $conn,
                "INSERT INTO products_reviews (uid, parent_id, product_id, star, msg) VALUES (?, NULL, ?, ?, ?)",
                'siis',
                [$user['uid'], $pid, $star, $msg]
            );
        }

        if (!$r['ok']) {
            json_out(['ok' => false, 'message' => 'Could not submit review. Please try again.'], 500);
        }

        json_out(['ok' => true, 'message' => 'Review submitted successfully!']);
    }

    json_out(['ok' => false, 'message' => 'Invalid action.'], 400);
}

// ============================================================================
// GET: Single Product Detail (?mode=detail&slug=...)
// ============================================================================
$mode = $input['mode'] ?? '';
$productSlug = trim((string)($input['product_slug'] ?? ($mode === 'detail' ? ($input['slug'] ?? '') : '')));

if ($productSlug !== '') {
    $p = db_one(
        $conn,
        "SELECT p.*, c.name AS cat_name, c.slug AS cat_slug,
                sc.name AS sub_name, sc.slug AS sub_slug,
                b.name AS brand_name, b.slug AS brand_slug,
                u.username AS seller, u.firstname AS seller_first, u.lastname AS seller_last,
                v.store_name, v.store_slug,
                COALESCE(v.is_verified, 0) AS vendor_verified,
                COALESCE(v.verification_status, 'unverified') AS verification_status,
                v.subdomain, v.custom_domain,
                COALESCE(v.domain_plan_active, 0) AS domain_plan_active,
                COALESCE(v.payment_mode, 'self_managed') AS vendor_payment_mode,
                COALESCE(v.domain_store_status, 'inactive') AS domain_store_status
           FROM products p
           LEFT JOIN category c ON c.id = p.product_category_id
           LEFT JOIN sub_category sc ON sc.id = p.product_sub_category_id
           LEFT JOIN brand_category b ON b.id = p.brand_category_id
           LEFT JOIN users u ON u.uid = p.uid
           LEFT JOIN vendors v ON v.uid = p.uid
          WHERE p.slug = ?
          LIMIT 1",
        's',
        [$productSlug]
    );

    if (!$p) {
        json_out(['ok' => false, 'not_found' => true, 'message' => 'Product not found.'], 404);
    }

    $pid  = (int)$p['id'];
    $spec = json_decode($p['specification'] ?? '', true);
    $spec = is_array($spec) ? $spec : [];

    $images = !empty($spec['images']) ? (array)$spec['images'] : (!empty($spec['image']) ? [$spec['image']] : []);
    if (empty($images)) {
        $images = ['https://placehold.co/600x800/f3e8ff/7b1d8e?text=Product'];
    }
    $sizes  = array_values((array)($spec['sizes'] ?? ($spec['size'] ?? [])));
    $colors = array_values((array)($spec['colors'] ?? ($spec['color'] ?? [])));
    $extra  = array_diff_key($spec, array_flip(['image', 'images', 'sizes', 'size', 'color', 'colors']));

    $specRows = [];
    if (!empty($p['brand_name'])) $specRows['Brand'] = $p['brand_name'];
    if (!empty($p['cat_name']))   $specRows['Category'] = $p['cat_name'];
    if (!empty($p['sub_name']))   $specRows['Type'] = $p['sub_name'];
    if (!empty($colors))          $specRows['Colour'] = implode(', ', $colors);
    if (!empty($sizes))           $specRows['Sizes'] = implode(', ', $sizes);
    foreach ($extra as $k => $v) {
        $specRows[ucwords(str_replace('_', ' ', (string)$k))] = is_array($v)
            ? implode(', ', array_map('strval', $v))
            : (string)$v;
    }

    // Ratings summary
    $agg = db_one($conn, "SELECT COUNT(*) AS c, COALESCE(AVG(star), 0) AS a FROM products_reviews WHERE product_id = ? AND parent_id IS NULL", 'i', [$pid]);
    $revCount = (int)($agg['c'] ?? 0);
    $avgStar  = round((float)($agg['a'] ?? 0), 1);

    $dist = [1 => 0, 2 => 0, 3 => 0, 4 => 0, 5 => 0];
    $distRows = db_rows($conn, "SELECT star, COUNT(*) AS c FROM products_reviews WHERE product_id = ? AND parent_id IS NULL GROUP BY star", 'i', [$pid]);
    foreach ($distRows as $dr) {
        $s = (int)$dr['star'];
        if (isset($dist[$s])) $dist[$s] = (int)$dr['c'];
    }

    // Reviews pagination & filter
    $starF     = in_array((int)($input['star'] ?? 0), [1, 2, 3, 4, 5], true) ? (int)$input['star'] : 0;
    $filtCount = $starF ? $dist[$starF] : $revCount;
    $rPer      = 6;
    $rPages    = max(1, (int)ceil($filtCount / $rPer));
    $rp        = min(max(1, (int)($input['rp'] ?? 1)), $rPages);
    $offset    = ($rp - 1) * $rPer;

    $revSql = "SELECT r.id, r.uid, r.star, r.msg, r.created_at, u.firstname, u.lastname
                 FROM products_reviews r
                 JOIN users u ON u.uid = r.uid
                WHERE r.product_id = ? AND r.parent_id IS NULL" . ($starF ? " AND r.star = ?" : "") .
              " ORDER BY r.created_at DESC, r.id DESC LIMIT ? OFFSET ?";

    $reviews = $starF
        ? db_rows($conn, $revSql, 'iiii', [$pid, $starF, $rPer, $offset])
        : db_rows($conn, $revSql, 'iii', [$pid, $rPer, $offset]);

    if (!empty($reviews)) {
        $ids = implode(',', array_map(fn($r) => (int)$r['id'], $reviews));
        $repRows = db_rows(
            $conn,
            "SELECT r.id, r.parent_id, r.uid, r.msg, r.created_at, u.firstname, u.lastname
               FROM products_reviews r
               JOIN users u ON u.uid = r.uid
              WHERE r.parent_id IN ($ids)
              ORDER BY r.created_at ASC"
        );
        $repliesMap = [];
        foreach ($repRows as $rep) {
            $repliesMap[(int)$rep['parent_id']][] = $rep;
        }
        foreach ($reviews as &$rv) {
            $rv['id']      = (int)$rv['id'];
            $rv['star']    = (int)$rv['star'];
            $rv['replies'] = $repliesMap[$rv['id']] ?? [];
        }
        unset($rv);
    }

    // Related products
    $related = db_rows(
        $conn,
        "SELECT p.id, p.slug, p.product_name, p.final_price, p.price, p.off_price, p.specification, p.instock,
                COALESCE(r.avg_star, 0) AS avg_star, COALESCE(r.review_count, 0) AS review_count
           FROM products p
           LEFT JOIN (SELECT product_id, AVG(star) AS avg_star, COUNT(*) AS review_count FROM products_reviews WHERE parent_id IS NULL GROUP BY product_id) r ON r.product_id = p.id
          WHERE p.id <> ? AND p.instock > 0 AND (p.product_sub_category_id <=> ? OR p.product_category_id <=> ?)
          ORDER BY (p.product_sub_category_id <=> ?) DESC, p.id DESC LIMIT 8",
        'iiii',
        [$pid, $p['product_sub_category_id'], $p['product_category_id'], $p['product_sub_category_id']]
    );
    foreach ($related as &$rel) {
        $rel['id']          = (int)$rel['id'];
        $rel['price']       = (float)$rel['price'];
        $rel['off_price']   = (float)$rel['off_price'];
        $rel['final_price'] = (float)$rel['final_price'];
        $rel['image']       = first_product_image($rel['specification']);
    }
    unset($rel);

    // More from seller
    $fromSeller = db_rows(
        $conn,
        "SELECT p.id, p.slug, p.product_name, p.final_price, p.price, p.off_price, p.specification, p.instock,
                COALESCE(r.avg_star, 0) AS avg_star, COALESCE(r.review_count, 0) AS review_count
           FROM products p
           LEFT JOIN (SELECT product_id, AVG(star) AS avg_star, COUNT(*) AS review_count FROM products_reviews WHERE parent_id IS NULL GROUP BY product_id) r ON r.product_id = p.id
          WHERE p.uid = ? AND p.id <> ? AND p.instock > 0
          ORDER BY p.id DESC LIMIT 8",
        'si',
        [$p['uid'], $pid]
    );
    foreach ($fromSeller as &$fs) {
        $fs['id']          = (int)$fs['id'];
        $fs['price']       = (float)$fs['price'];
        $fs['off_price']   = (float)$fs['off_price'];
        $fs['final_price'] = (float)$fs['final_price'];
        $fs['image']       = first_product_image($fs['specification']);
    }
    unset($fs);

    $plainDesc = trim(strip_tags((string)$p['description']));
    $bullets = array_values(array_filter(array_map('trim', preg_split('/\r?\n|(?<=[.!?])\s+/', $plainDesc))));
    $bullets = array_slice($bullets, 0, 6);

    $p['id']              = $pid;
    $p['price']           = (float)$p['price'];
    $p['off_price']       = (float)$p['off_price'];
    $p['final_price']     = (float)$p['final_price'];
    $p['instock']         = (int)$p['instock'];
    $p['images']          = $images;
    $p['sizes']           = $sizes;
    $p['colors']          = $colors;
    $p['spec_rows']       = $specRows;
    $p['bullets']         = $bullets;
    $p['seller_display']  = $p['store_name'] ?: ($p['seller'] ?: 'Official Store');
    $p['vendor_verified'] = (bool)$p['vendor_verified'];
    $p['domain_plan_active'] = (bool)$p['domain_plan_active'];

    $siteCfg = get_site_settings($conn);

    json_out([
        'ok'          => true,
        'product'     => $p,
        'rating'      => [
            'avg'          => $avgStar,
            'count'        => $revCount,
            'distribution' => $dist,
            'star_filter'  => $starF,
            'page'         => $rp,
            'pages'        => $rPages,
        ],
        'reviews'         => $reviews,
        'related'         => $related,
        'from_seller'     => $fromSeller,
        'subdomain_promo' => [
            'fee_ngn'            => (float)$siteCfg['subdomain_fee_ngn'],
            'fee_usd'            => (float)$siteCfg['subdomain_fee_usd'],
            'ngn_rate'           => (float)$siteCfg['ngn_rate'],
            'grace_days'         => (int)$siteCfg['subdomain_grace_days'],
            'company_charge_pct' => (float)$siteCfg['company_wallet_charge_pct'],
        ],
    ]);
}

// ============================================================================
// GET: Catalog / Category / Search / Inventory Listing
// ============================================================================

$slug    = trim((string)($input['slug'] ?? ''));
$search  = trim((string)($input['q'] ?? ''));
$invSlug = trim((string)($input['inv'] ?? ''));

$rawSub   = $input['sub'] ?? [];
if (is_string($rawSub)) $rawSub = explode(',', $rawSub);
$fSub     = array_values(array_filter(array_map('intval', (array)$rawSub)));

$rawBrand = $input['brand'] ?? [];
if (is_string($rawBrand)) $rawBrand = explode(',', $rawBrand);
$fBrand   = array_values(array_filter(array_map('intval', (array)$rawBrand)));

$fMin    = ($input['min'] ?? '') !== '' ? max(0, (float)$input['min']) : null;
$fMax    = ($input['max'] ?? '') !== '' ? max(0, (float)$input['max']) : null;
$fRating = in_array((int)($input['rating'] ?? 0), [3, 4], true) ? (int)$input['rating'] : 0;
$fDisc   = in_array((int)($input['discount'] ?? 0), [10, 25, 50], true) ? (int)$input['discount'] : 0;
$fStock  = !empty($input['stock']);
$sort    = (string)($input['sort'] ?? 'popular');
$page    = max(1, (int)($input['page'] ?? 1));
$perPage = 20;

$orders = [
    'popular'    => 'review_count DESC, p.id DESC',
    'new'        => 'p.created_at DESC',
    'price_asc'  => 'p.final_price ASC',
    'price_desc' => 'p.final_price DESC',
    'discount'   => 'p.off_price DESC',
    'rating'     => 'avg_star DESC, review_count DESC',
];
if (!isset($orders[$sort])) $sort = 'popular';

$join = '';
$where = ['1=1'];
$types = '';
$params = [];
$title = 'All Products';
$desc = '';
$catMode = 'all';
$notFound = false;

if ($invSlug !== '') {
    $catMode = 'inventory';
    $inv = db_one($conn, "SELECT id, name, description FROM inventories WHERE slug = ?", 's', [$invSlug]);
    if ($inv) {
        $title = $inv['name'];
        $desc  = $inv['description'] ?? '';
        $join .= " JOIN product_inventories pi ON pi.product_id = p.id AND pi.inventory_id = ?";
        $types .= 'i';
        $params[] = (int)$inv['id'];
    } else {
        $notFound = true;
        $title = 'Collection not found';
    }
}

if ($slug !== '' && !$notFound) {
    // Check if slug matches a category first, or an inventory slug
    $cat = db_one($conn, "SELECT id, name, description FROM category WHERE slug = ?", 's', [$slug]);
    if ($cat) {
        $catMode = 'category';
        $title   = $cat['name'];
        $desc    = $cat['description'] ?? '';
        $where[] = 'p.product_category_id = ?';
        $types  .= 'i';
        $params[] = (int)$cat['id'];
    } else {
        $invFallback = db_one($conn, "SELECT id, name, description FROM inventories WHERE slug = ?", 's', [$slug]);
        if ($invFallback) {
            $catMode = 'inventory';
            $title   = $invFallback['name'];
            $desc    = $invFallback['description'] ?? '';
            $join   .= " JOIN product_inventories pi ON pi.product_id = p.id AND pi.inventory_id = ?";
            $types  .= 'i';
            $params[] = (int)$invFallback['id'];
        } else {
            $notFound = true;
            $title = 'Category not found';
        }
    }
}

if ($search !== '') {
    $catMode = 'search';
    $title   = 'Results for "' . $search . '"';
    $like    = '%' . addcslashes($search, '%_\\') . '%';
    $where[] = '(p.product_name LIKE ? OR p.keywords LIKE ? OR p.description LIKE ?)';
    $types  .= 'sss';
    array_push($params, $like, $like, $like);
}

$ctxWhere  = implode(' AND ', $where);
$ctxTypes  = $types;
$ctxParams = $params;

// Filters
$fw = [];
$ft = '';
$fp = [];
if (!empty($fSub))   $fw[] = 'p.product_sub_category_id IN (' . implode(',', $fSub) . ')';
if (!empty($fBrand)) $fw[] = 'p.brand_category_id IN (' . implode(',', $fBrand) . ')';
if ($fMin !== null)  { $fw[] = 'p.final_price >= ?'; $ft .= 'd'; $fp[] = $fMin; }
if ($fMax !== null)  { $fw[] = 'p.final_price <= ?'; $ft .= 'd'; $fp[] = $fMax; }
if ($fRating)        { $fw[] = 'COALESCE(r.avg_star, 0) >= ?'; $ft .= 'i'; $fp[] = $fRating; }
if ($fDisc)          { $fw[] = 'p.off_price >= ?'; $ft .= 'i'; $fp[] = $fDisc; }
if ($fStock)         { $fw[] = 'p.instock > 0'; }

$fullWhere = $ctxWhere . ($fw ? ' AND ' . implode(' AND ', $fw) : '');
$allTypes  = $ctxTypes . $ft;
$allParams = array_merge($ctxParams, $fp);

$rJoin = "LEFT JOIN (
    SELECT product_id, AVG(star) AS avg_star, COUNT(*) AS review_count
      FROM products_reviews WHERE parent_id IS NULL GROUP BY product_id
) r ON r.product_id = p.id";

$total       = 0;
$pages       = 1;
$products    = [];
$subFacets   = [];
$brandFacets = [];

if (!$notFound) {
    $cRow  = db_one($conn, "SELECT COUNT(*) AS c FROM products p $rJoin $join WHERE $fullWhere", $allTypes, $allParams);
    $total = (int)($cRow['c'] ?? 0);
    $pages = max(1, (int)ceil($total / $perPage));
    $page  = min($page, $pages);

    $products = db_rows(
        $conn,
        "SELECT p.id, p.slug, p.product_name, p.price, p.off_price, p.final_price, p.specification, p.instock,
                COALESCE(r.avg_star, 0) AS avg_star, COALESCE(r.review_count, 0) AS review_count
           FROM products p $rJoin $join
          WHERE $fullWhere
          ORDER BY {$orders[$sort]}
          LIMIT ? OFFSET ?",
        $allTypes . 'ii',
        array_merge($allParams, [$perPage, ($page - 1) * $perPage])
    );

    foreach ($products as &$p) {
        $p['id']           = (int)$p['id'];
        $p['price']        = (float)$p['price'];
        $p['off_price']    = (float)$p['off_price'];
        $p['final_price']  = (float)$p['final_price'];
        $p['instock']      = (int)$p['instock'];
        $p['avg_star']     = round((float)$p['avg_star'], 1);
        $p['review_count'] = (int)$p['review_count'];
        $p['image']        = first_product_image($p['specification']);
    }
    unset($p);

    $subFacets = db_rows(
        $conn,
        "SELECT sc.id, sc.name, COUNT(*) AS c
           FROM products p $join
           JOIN sub_category sc ON sc.id = p.product_sub_category_id
          WHERE $ctxWhere
          GROUP BY sc.id, sc.name
          ORDER BY sc.name",
        $ctxTypes,
        $ctxParams
    );

    $brandFacets = db_rows(
        $conn,
        "SELECT b.id, b.name, COUNT(*) AS c
           FROM products p $join
           JOIN brand_category b ON b.id = p.brand_category_id
          WHERE $ctxWhere
          GROUP BY b.id, b.name
          ORDER BY b.name",
        $ctxTypes,
        $ctxParams
    );
}

$allCats = db_rows($conn, "SELECT id, slug, name FROM category ORDER BY name ASC LIMIT 30");

json_out([
    'ok'             => true,
    'title'          => $title,
    'description'    => $desc,
    'mode'           => $catMode,
    'not_found'      => $notFound,
    'total'          => $total,
    'page'           => $page,
    'pages'          => $pages,
    'products'       => $products,
    'sub_facets'     => $subFacets,
    'brand_facets'   => $brandFacets,
    'all_categories' => $allCats,
]);

