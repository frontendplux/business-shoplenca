<?php
// ============================================================================
// /api/home.php
// Returns homepage dynamic inventories & products, categories, and site reviews
// ============================================================================

require_once __DIR__ . '/config/db.php';

// 1. Active inventories ordered by inv_position
$invRows = db_rows(
    $conn,
    "SELECT id, inv_position, style_type, show_ads_next, ads_id, ads_id2, name, slug, image, description
       FROM inventories
      WHERE (time_start IS NULL OR time_start <= NOW())
        AND (time_end   IS NULL OR time_end   >= NOW())
      ORDER BY inv_position ASC"
);

// If time windows in demo DB expired relative to current date, fallback to all inventories
if (empty($invRows)) {
    $invRows = db_rows(
        $conn,
        "SELECT id, inv_position, style_type, show_ads_next, ads_id, ads_id2, name, slug, image, description
           FROM inventories
          ORDER BY inv_position ASC"
    );
}

$inventories = [];
foreach ($invRows as $inv) {
    $invId = (int)$inv['id'];
    $products = db_rows(
        $conn,
        "SELECT p.id, p.slug, p.product_name, p.price, p.off_price, p.final_price, p.specification, p.instock,
                COALESCE(r.avg_star, 0) AS avg_star, COALESCE(r.review_count, 0) AS review_count
           FROM product_inventories pi
           JOIN products p ON p.id = pi.product_id
           LEFT JOIN (
               SELECT product_id, AVG(star) AS avg_star, COUNT(*) AS review_count
                 FROM products_reviews WHERE parent_id IS NULL GROUP BY product_id
           ) r ON r.product_id = p.id
          WHERE pi.inventory_id = ?
            AND p.instock > 0
          ORDER BY pi.is_paid DESC, pi.created_at DESC
          LIMIT 8",
        'i',
        [$invId]
    );

    if (!empty($products)) {
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

        $inv['id']            = $invId;
        $inv['inv_position']  = (int)$inv['inv_position'];
        $inv['style_type']    = (int)$inv['style_type'];
        $inv['show_ads_next'] = (bool)$inv['show_ads_next'];
        $inv['products']      = $products;
        $inventories[]        = $inv;
    }
}

// 2. Customer site reviews
$siteReviews = db_rows(
    $conn,
    "SELECT sr.id, sr.star, sr.msg, u.firstname, u.lastname
       FROM site_reviews sr
       JOIN users u ON u.uid = sr.uid
      WHERE sr.parent_id IS NULL AND sr.star >= 4
      ORDER BY sr.created_at DESC
      LIMIT 3"
);

// 3. Featured categories for circular Shop By Category section
$homeCategories = db_rows($conn, "SELECT id, slug, name, image FROM category LIMIT 7");

// 4. Active Homepage Promo Ad Banners configured by Admin
$promoAds = db_rows(
    $conn,
    "SELECT id, title, subtitle, badge_text, cta_text, cta_link, image_url, bg_gradient, position_key, sort_order
       FROM home_promo_ads
      WHERE is_active = 1
      ORDER BY sort_order ASC, id ASC"
);
foreach ($promoAds as &$ad) {
    $ad['id']         = (int)$ad['id'];
    $ad['sort_order'] = (int)$ad['sort_order'];
}
unset($ad);

json_out([
    'ok'              => true,
    'inventories'     => $inventories,
    'promo_ads'       => $promoAds,
    'site_reviews'    => $siteReviews,
    'home_categories' => $homeCategories,
]);


