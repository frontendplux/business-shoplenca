<?php
// ============================================================================
// /api/checkout.php
// GET  -> Active payment gateways (configured in Admin) + cart summary + user info
// POST -> Places order into `orders` and `order_items`, updates stock & clears cart
// ============================================================================

require_once __DIR__ . '/config/db.php';

$input    = req_input();
$method   = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$user     = require_auth($conn);
$settings = get_site_settings($conn);
$uid      = $user['uid'];

// Fetch active payment gateways (safe public fields only - never expose secret_key)
$gatewaysRaw = db_rows(
    $conn,
    "SELECT id, code, name, gateway_type, description, icon, mode, public_key, merchant_id,
            supported_currencies, extra_config, prepaid_discount, is_active, sort_order
       FROM payment_gateways
      WHERE is_active = 1
      ORDER BY sort_order ASC, id ASC"
);

$gateways = [];
foreach ($gatewaysRaw as $gw) {
    $gw['id']               = (int)$gw['id'];
    $gw['prepaid_discount'] = (bool)$gw['prepaid_discount'];
    $gw['is_active']        = (bool)$gw['is_active'];
    $gw['extra']            = json_decode($gw['extra_config'] ?? '{}', true) ?: [];
    unset($gw['extra_config']);
    $gateways[] = $gw;
}

// Fetch user's cart
$items = db_rows(
    $conn,
    "SELECT ci.quantity, p.id AS pid, p.uid AS vendor_uid, p.slug, p.product_name,
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

$totals = [
    'count'            => $count,
    'mrp'              => round($mrp, 2),
    'sell'             => round($sell, 2),
    'savings'          => round($mrp - $sell, 2),
    'shipping'         => round($shipping, 2),
    'prepaid_discount' => $prepaidDiscPct,
    'prepaid_off'      => $prepaidOff,
    'total_cod'        => round($sell + $shipping, 2),
    'total_prepaid'    => round($sell + $shipping - $prepaidOff, 2),
];

// Last used address from previous orders if any
$lastOrder = db_one(
    $conn,
    "SELECT full_name, phone, address, landmark, city, state, pincode FROM orders WHERE uid = ? ORDER BY id DESC LIMIT 1",
    's',
    [$uid]
);

if ($method === 'GET') {
    json_out([
        'ok'           => true,
        'items'        => $items,
        'all_ok'       => $allOk,
        'totals'       => $totals,
        'gateways'     => $gateways,
        'last_address' => $lastOrder,
        'user'         => $user,
    ]);
}

// ============================================================================
// POST: Place Order
// ============================================================================
if (empty($items)) {
    json_out(['ok' => false, 'message' => 'Your cart is empty.'], 400);
}
if (!$allOk) {
    json_out(['ok' => false, 'message' => 'Some items in your cart are out of stock. Please update your cart.'], 400);
}

$fullName   = trim((string)($input['full_name'] ?? ''));
$phone      = trim((string)($input['phone'] ?? ''));
$address    = trim((string)($input['address'] ?? ''));
$landmark   = trim((string)($input['landmark'] ?? ''));
$city       = trim((string)($input['city'] ?? ''));
$state      = trim((string)($input['state'] ?? ''));
$pincode    = trim((string)($input['pincode'] ?? ''));
$notes      = trim((string)($input['notes'] ?? ''));
$payCode    = trim((string)($input['payment_method'] ?? 'cod'));
$payRef     = trim((string)($input['payment_reference'] ?? ''));

if ($fullName === '' || $phone === '' || $address === '' || $city === '' || $state === '' || $pincode === '') {
    json_out(['ok' => false, 'message' => 'Please complete all required delivery address fields.'], 400);
}

// Find chosen payment gateway (or Member Wallet)
$chosenGw = null;
if ($payCode === 'wallet') {
    $chosenGw = [
        'code'             => 'wallet',
        'name'             => 'Member Wallet (Gift Card / Balance)',
        'gateway_type'     => 'online',
        'prepaid_discount' => true,
    ];
} else {
    foreach ($gateways as $gw) {
        if ($gw['code'] === $payCode) {
            $chosenGw = $gw;
            break;
        }
    }
}
if (!$chosenGw) {
    $chosenGw = [
        'code'             => $payCode,
        'name'             => strtoupper($payCode),
        'gateway_type'     => $payCode === 'cod' ? 'cod' : 'online',
        'prepaid_discount' => $payCode !== 'cod',
    ];
}

$isPrepaid  = !empty($chosenGw['prepaid_discount']) && $chosenGw['gateway_type'] !== 'cod';
$discAmount = $isPrepaid ? $totals['prepaid_off'] : 0.0;
$finalTotal = $isPrepaid ? $totals['total_prepaid'] : $totals['total_cod'];

// If paying with Member Wallet, verify & deduct balance
if ($chosenGw['code'] === 'wallet') {
    $uBalRow = db_one($conn, "SELECT COALESCE(wallet_balance, 0) AS bal FROM users WHERE uid = ?", 's', [$uid]);
    $curBal  = (float)($uBalRow['bal'] ?? 0);
    if ($curBal < $finalTotal) {
        json_out([
            'ok'      => false,
            'message' => 'Insufficient Member Wallet balance for this order. Redeem a Gift Card or choose another payment gateway.',
        ], 400);
    }
    db_run($conn, "UPDATE users SET wallet_balance = wallet_balance - ? WHERE uid = ?", 'ds', [$finalTotal, $uid]);
}

if ($payRef === '') {
    $payRef = strtoupper($chosenGw['code']) . '-' . strtoupper(bin2hex(random_bytes(4)));
}

$payStatus = ($chosenGw['gateway_type'] === 'online') ? 'paid' : 'pending';
$orderNo   = 'ORD-' . date('ymd') . '-' . strtoupper(substr(bin2hex(random_bytes(3)), 0, 5));

$curCode = $_SESSION['currency'] ?? 'USD';
$curRow  = db_one($conn, "SELECT exchange_rate FROM currencies WHERE code = ? LIMIT 1", 's', [$curCode]);
$exRate  = (float)($curRow['exchange_rate'] ?? 1.0);

$insOrder = db_run(
    $conn,
    "INSERT INTO orders
        (order_number, uid, full_name, phone, email, address, landmark, city, state, pincode, notes,
         payment_method, payment_gateway_name, payment_status, payment_reference, order_status,
         buyer_received, buyer_good_condition, is_sealed, admin_funds_released, escrow_status,
         currency_code, exchange_rate, subtotal, shipping_fee, discount_amount, total_amount)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 0, 0, 0, 0, 'held_in_escrow', ?, ?, ?, ?, ?, ?)",
    'ssssssssssssssssddddd',
    [
        $orderNo, $uid, $fullName, $phone, $user['email'], $address, $landmark, $city, $state, $pincode, $notes,
        $chosenGw['code'], $chosenGw['name'], $payStatus, $payRef,
        $curCode, $exRate, $totals['sell'], $totals['shipping'], $discAmount, $finalTotal
    ]
);

if (!$insOrder['ok']) {
    json_out(['ok' => false, 'message' => 'Could not place order: ' . $insOrder['error']], 500);
}

$orderId = (int)$insOrder['insert_id'];

$companyChargePct = (float)($settings['company_wallet_charge_pct'] ?? 2.5);

foreach ($items as $item) {
    db_run(
        $conn,
        "INSERT INTO order_items
            (order_id, product_id, vendor_uid, product_name, product_slug, product_image, quantity, unit_price, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        'iissssidd',
        [
            $orderId, $item['pid'], $item['vendor_uid'], $item['product_name'],
            $item['slug'], $item['image'], $item['quantity'], $item['final_price'], $item['line_total']
        ]
    );
    // Decrement product stock safely
    db_run($conn, "UPDATE products SET instock = GREATEST(0, instock - ?) WHERE id = ?", 'ii', [$item['quantity'], $item['pid']]);

    // Vendor Escrow & Settlement Processing:
    // Funds are held in Escrow (`status = 'escrow_pending'`) until:
    // 1. Customer confirms they received the product AND confirms it is in good condition (sealing the product/order)
    // 2. Admin verifies and releases funds to the vendor's wallet!
    $vUid = $item['vendor_uid'] ?? '';
    if ($vUid !== '') {
        $vRow = db_one($conn, "SELECT domain_plan_active, payment_mode, domain_store_status FROM vendors WHERE uid = ? LIMIT 1", 's', [$vUid]);
        $isSelfManaged = $vRow
            && (int)($vRow['domain_plan_active'] ?? 0) === 1
            && ($vRow['payment_mode'] ?? '') === 'self_managed'
            && in_array($vRow['domain_store_status'] ?? '', ['active', 'grace_period'], true);

        $grossUsd = (float)$item['line_total'];
        if ($isSelfManaged) {
            // Self-Managed Subdomain/Domain Owner: 0% company interference
            $chargePct = 0.0;
            $chargeAmt = 0.0;
            $netAmt    = $grossUsd;
            $descText  = "Escrow Sale (Self-Managed 0% Fee): {$item['product_name']} (x{$item['quantity']}) — Releases after Buyer Seals & Admin Verifies";
        } else {
            // Company Wallet Mode: Transparent company charge
            $chargePct = $companyChargePct;
            $chargeAmt = round($grossUsd * ($chargePct / 100), 4);
            $netAmt    = round(max(0, $grossUsd - $chargeAmt), 4);
            $descText  = "Escrow Sale (Company Wallet {$chargePct}% Charge): {$item['product_name']} (x{$item['quantity']}) — Releases after Buyer Seals & Admin Verifies";
        }

        // Record detailed ledger row in 'escrow_pending' status (funds release to users.wallet_balance when Admin verifies sealed order)
        db_run(
            $conn,
            "INSERT INTO vendor_wallet_transactions
                (vendor_uid, order_id, order_number, product_id, product_name, tx_type, payment_mode,
                 gross_amount, company_charge_percent, company_charge_amount, net_vendor_amount, currency_code, status, description)
             VALUES (?, ?, ?, ?, ?, 'sale_credit', ?, ?, ?, ?, ?, 'USD', 'escrow_pending', ?)",
            'sisissdddds',
            [
                $vUid, $orderId, $orderNo, $item['pid'], $item['product_name'],
                $isSelfManaged ? 'self_managed' : 'company_wallet',
                $grossUsd, $chargePct, $chargeAmt, $netAmt, $descText
            ]
        );

        if ($vUid !== $uid) {
            send_push_notification(
                $conn,
                $vUid,
                "New Escrow Order #{$orderNo}!",
                "Sold {$item['quantity']}x {$item['product_name']}. Net payout ($" . number_format($netAmt, 2) . ") is held in Escrow until buyer confirms delivery in good condition (seals order) & Admin releases funds.",
                'order',
                '/member?tab=domain',
                'bi-shield-check'
            );
        }
    }
}

// Clear user's cart
db_run($conn, "DELETE FROM cart_items WHERE uid = ?", 's', [$uid]);

// Send push notification to customer
send_push_notification(
    $conn,
    $uid,
    "Order {$orderNo} Placed (Escrow Protected)!",
    "Your payment is protected in Escrow! Once you receive your items in good condition, click 'Confirm Receipt & Good Condition' in My Orders to seal the order.",
    'order',
    '/member?tab=orders',
    'bi-bag-check-fill'
);

json_out([
    'ok'      => true,
    'message' => 'Order placed with 100% Buyer Escrow Protection!',
    'order'   => [
        'id'                   => $orderId,
        'order_number'         => $orderNo,
        'payment_method'       => $chosenGw['code'],
        'payment_gateway_name' => $chosenGw['name'],
        'payment_status'       => $payStatus,
        'payment_reference'    => $payRef,
        'total_amount'         => $finalTotal,
        'escrow_status'        => 'held_in_escrow',
    ],
]);


