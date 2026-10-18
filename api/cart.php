<?php
// ============================================================================
// /api/cart.php
// GET  -> Returns user cart items and computed totals
// POST -> action = add | update | remove | to_wishlist | clear
// ============================================================================

require_once __DIR__ . '/config/db.php';

$input    = req_input();
$method   = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$settings = get_site_settings($conn);
$user     = get_auth_user($conn);

function fetch_cart_data(mysqli $conn, string $uid, array $settings): array {
    $items = db_rows(
        $conn,
        "SELECT ci.id AS cart_id, ci.quantity, p.id AS pid, p.slug, p.product_name,
                p.price, p.off_price, p.final_price, p.instock, p.specification
           FROM cart_items ci
           JOIN products p ON p.id = ci.product_id
          WHERE ci.uid = ?
          ORDER BY ci.updated_at DESC, ci.id DESC",
        's',
        [$uid]
    );

    $count = 0;
    $mrp   = 0.0;
    $sell  = 0.0;
    $allOk = !empty($items);

    foreach ($items as &$i) {
        $i['pid']         = (int)$i['pid'];
        $i['quantity']    = (int)$i['quantity'];
        $i['instock']     = (int)$i['instock'];
        $i['price']       = (float)$i['price'];
        $i['off_price']   = (float)$i['off_price'];
        $i['final_price'] = (float)$i['final_price'];
        $i['available']   = ($i['instock'] >= $i['quantity'] && $i['instock'] > 0);
        if (!$i['available']) $allOk = false;
        $i['line_total']  = round($i['quantity'] * $i['final_price'], 2);
        $i['line_mrp']    = round($i['quantity'] * $i['price'], 2);
        $i['image']       = first_product_image($i['specification']);

        $count += $i['quantity'];
        $mrp   += $i['line_mrp'];
        $sell  += $i['line_total'];
    }
    unset($i);

    $freeShipMin    = (float)$settings['free_ship_min'];
    $shippingFee    = (float)$settings['shipping_fee'];
    $prepaidDiscPct = (float)$settings['prepaid_discount'];

    $shipping   = (!empty($items) && $sell < $freeShipMin) ? $shippingFee : 0.0;
    $prepaidOff = round($sell * ($prepaidDiscPct / 100), 2);
    $freeLeft   = max(0.0, $freeShipMin - $sell);
    $progress   = ($sell > 0 && $freeShipMin > 0) ? min(100, (int)round(($sell / $freeShipMin) * 100)) : 0;

    return [
        'items'   => $items,
        'all_ok'  => $allOk,
        'totals'  => [
            'count'            => $count,
            'mrp'              => round($mrp, 2),
            'sell'             => round($sell, 2),
            'savings'          => round($mrp - $sell, 2),
            'shipping'         => round($shipping, 2),
            'prepaid_discount' => $prepaidDiscPct,
            'prepaid_off'      => $prepaidOff,
            'total_cod'        => round($sell + $shipping, 2),
            'total_prepaid'    => round($sell + $shipping - $prepaidOff, 2),
            'free_ship_min'    => $freeShipMin,
            'free_left'        => round($freeLeft, 2),
            'progress'         => $progress,
        ],
    ];
}

if ($method === 'POST') {
    if (!$user) {
        json_out(['ok' => false, 'login' => true, 'message' => 'Please sign in to manage your cart.'], 401);
    }
    $uid    = $user['uid'];
    $action = $input['action'] ?? 'add';
    $pid    = (int)($input['product_id'] ?? 0);
    $qty    = max(1, (int)($input['quantity'] ?? 1));
    $msg    = 'Cart updated.';

    if ($action === 'clear') {
        db_run($conn, "DELETE FROM cart_items WHERE uid = ?", 's', [$uid]);
        $msg = 'Cart cleared.';
    } elseif ($pid > 0) {
        $prod = db_one($conn, "SELECT id, final_price, instock FROM products WHERE id = ?", 'i', [$pid]);

        if ($action === 'remove') {
            db_run($conn, "DELETE FROM cart_items WHERE uid = ? AND product_id = ?", 'si', [$uid, $pid]);
            $msg = 'Item removed from cart.';
        } elseif ($action === 'to_wishlist') {
            db_run($conn, "INSERT IGNORE INTO wishlist (uid, product_id) VALUES (?, ?)", 'si', [$uid, $pid]);
            db_run($conn, "DELETE FROM cart_items WHERE uid = ? AND product_id = ?", 'si', [$uid, $pid]);
            $msg = 'Saved to wishlist for later.';
        } elseif ($prod && (int)$prod['instock'] > 0) {
            $max = min((int)$prod['instock'], 10);
            if ($action === 'update') {
                $newQty = min($qty, $max);
            } else {
                $curRow = db_one($conn, "SELECT quantity FROM cart_items WHERE uid = ? AND product_id = ?", 'si', [$uid, $pid]);
                $cur    = (int)($curRow['quantity'] ?? 0);
                $newQty = min($cur + $qty, $max);
                $msg    = ($cur + $qty > $max) ? 'Maximum available stock reached in cart.' : 'Added to cart!';
            }
            $amount = round($newQty * (float)$prod['final_price'], 2);
            db_run(
                $conn,
                "INSERT INTO cart_items (uid, product_id, quantity, amount) VALUES (?, ?, ?, ?)
                 ON DUPLICATE KEY UPDATE quantity = VALUES(quantity), amount = VALUES(amount)",
                'siid',
                [$uid, $pid, $newQty, $amount]
            );
        } else {
            json_out(['ok' => false, 'message' => 'This item is currently out of stock.'], 400);
        }
    }

    $cartData = fetch_cart_data($conn, $uid, $settings);
    $wRow = db_one($conn, "SELECT COUNT(*) AS c FROM wishlist WHERE uid = ?", 's', [$uid]);

    json_out([
        'ok'             => true,
        'message'        => $msg,
        'count'          => $cartData['totals']['count'],
        'wishlist_count' => (int)($wRow['c'] ?? 0),
        'cart'           => $cartData,
    ]);
}

// GET request
if (!$user) {
    json_out([
        'ok'    => true,
        'login' => true,
        'cart'  => [
            'items'  => [],
            'all_ok' => false,
            'totals' => [
                'count' => 0, 'mrp' => 0, 'sell' => 0, 'savings' => 0,
                'shipping' => 0, 'prepaid_discount' => (float)$settings['prepaid_discount'],
                'prepaid_off' => 0, 'total_cod' => 0, 'total_prepaid' => 0,
                'free_ship_min' => (float)$settings['free_ship_min'], 'free_left' => (float)$settings['free_ship_min'],
                'progress' => 0,
            ],
        ],
    ]);
}

$cartData = fetch_cart_data($conn, $user['uid'], $settings);
json_out([
    'ok'   => true,
    'cart' => $cartData,
]);

