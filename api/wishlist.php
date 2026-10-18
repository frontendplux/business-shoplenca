<?php
// ============================================================================
// /api/wishlist.php
// GET  -> Returns wishlist products for current user
// POST -> Toggle / Add / Remove product in wishlist
// ============================================================================

require_once __DIR__ . '/config/db.php';

$input  = req_input();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$user   = get_auth_user($conn);

if (!$user) {
    json_out(['ok' => false, 'login' => true, 'message' => 'Please sign in to save items to your wishlist.'], 401);
}

$uid = $user['uid'];

if ($method === 'POST') {
    $pid    = (int)($input['product_id'] ?? 0);
    $action = $input['action'] ?? 'toggle';

    if ($pid <= 0) {
        json_out(['ok' => false, 'message' => 'Invalid product ID.'], 400);
    }

    $exists = db_one($conn, "SELECT id FROM wishlist WHERE uid = ? AND product_id = ?", 'si', [$uid, $pid]);
    $inWishlist = false;

    if ($action === 'remove' || ($action === 'toggle' && $exists)) {
        db_run($conn, "DELETE FROM wishlist WHERE uid = ? AND product_id = ?", 'si', [$uid, $pid]);
        $msg = 'Removed from wishlist.';
        $inWishlist = false;
    } else {
        db_run($conn, "INSERT IGNORE INTO wishlist (uid, product_id) VALUES (?, ?)", 'si', [$uid, $pid]);
        $msg = 'Saved to wishlist!';
        $inWishlist = true;
    }

    $wRows = db_rows($conn, "SELECT product_id FROM wishlist WHERE uid = ?", 's', [$uid]);
    $ids   = array_map(fn($r) => (int)$r['product_id'], $wRows);

    json_out([
        'ok'             => true,
        'in_wishlist'    => $inWishlist,
        'message'        => $msg,
        'wishlist_count' => count($ids),
        'wishlist_ids'   => $ids,
    ]);
}

// GET wishlist products
$items = db_rows(
    $conn,
    "SELECT p.id, p.slug, p.product_name, p.price, p.off_price, p.final_price, p.instock, p.specification, w.created_at AS saved_at
       FROM wishlist w
       JOIN products p ON p.id = w.product_id
      WHERE w.uid = ?
      ORDER BY w.created_at DESC",
    's',
    [$uid]
);

foreach ($items as &$item) {
    $item['id']          = (int)$item['id'];
    $item['price']       = (float)$item['price'];
    $item['off_price']   = (float)$item['off_price'];
    $item['final_price'] = (float)$item['final_price'];
    $item['instock']     = (int)$item['instock'];
    $item['image']       = first_product_image($item['specification']);
}
unset($item);

json_out([
    'ok'    => true,
    'items' => $items,
]);

