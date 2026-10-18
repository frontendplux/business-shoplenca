<?php
// ============================================================================
// /api/admin.php
// Full Admin Management API (Protected by require_admin)
// Manages: Overview Stats, Payment Gateways & API Keys, Orders, Products,
// Categories/Subcategories/Brands, Inventories, Users/Vendors, Blog Posts,
// Books & Chapters, Contact Messages & Info, Currencies, Site Settings & Pages
// ============================================================================

require_once __DIR__ . '/config/db.php';

$admin  = require_admin($conn);
$input  = req_input();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

// ============================================================================
// POST Actions
// ============================================================================
if ($method === 'POST') {
    $action = $input['action'] ?? '';

    // 1. PAYMENT GATEWAYS: Save / Update API Keys & Config
    if ($action === 'save_gateway') {
        $id           = (int)($input['id'] ?? 0);
        $code         = strtolower(preg_replace('/[^a-zA-Z0-9_]/', '_', trim((string)($input['code'] ?? ''))));
        $name         = trim((string)($input['name'] ?? ''));
        $gatewayType  = in_array($input['gateway_type'] ?? 'online', ['online', 'crypto', 'manual', 'cod'], true) ? $input['gateway_type'] : 'online';
        $description  = trim((string)($input['description'] ?? ''));
        $icon         = trim((string)($input['icon'] ?? 'bi-credit-card'));
        $mode         = ($input['mode'] ?? 'test') === 'live' ? 'live' : 'test';
        $publicKey    = trim((string)($input['public_key'] ?? ''));
        $secretKey    = trim((string)($input['secret_key'] ?? ''));
        $webhookSec   = trim((string)($input['webhook_secret'] ?? ''));
        $merchantId   = trim((string)($input['merchant_id'] ?? ''));
        $currencies   = trim((string)($input['supported_currencies'] ?? 'USD,NGN,EUR,GBP,INR'));
        $prepaidDisc  = !empty($input['prepaid_discount']) ? 1 : 0;
        $isActive     = !empty($input['is_active']) ? 1 : 0;
        $sortOrder    = (int)($input['sort_order'] ?? 0);

        $extra = is_array($input['extra'] ?? null) ? $input['extra'] : [];
        $extraJson = json_encode($extra, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        if ($name === '' || $code === '') {
            json_out(['ok' => false, 'message' => 'Gateway name and code are required.'], 400);
        }

        if ($id > 0) {
            $r = db_run(
                $conn,
                "UPDATE payment_gateways
                    SET name = ?, gateway_type = ?, description = ?, icon = ?, mode = ?,
                        public_key = ?, secret_key = ?, webhook_secret = ?, merchant_id = ?,
                        supported_currencies = ?, extra_config = ?, prepaid_discount = ?, is_active = ?, sort_order = ?
                  WHERE id = ?",
                'sssssssssssiiii',
                [$name, $gatewayType, $description, $icon, $mode, $publicKey, $secretKey, $webhookSec, $merchantId, $currencies, $extraJson, $prepaidDisc, $isActive, $sortOrder, $id]
            );
            json_out(['ok' => $r['ok'], 'message' => "Payment gateway '$name' updated successfully!"]);
        } else {
            $r = db_run(
                $conn,
                "INSERT INTO payment_gateways
                    (code, name, gateway_type, description, icon, mode, public_key, secret_key, webhook_secret, merchant_id, supported_currencies, extra_config, prepaid_discount, is_active, sort_order)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                'ssssssssssssiii',
                [$code, $name, $gatewayType, $description, $icon, $mode, $publicKey, $secretKey, $webhookSec, $merchantId, $currencies, $extraJson, $prepaidDisc, $isActive, $sortOrder]
            );
            if (!$r['ok']) {
                json_out(['ok' => false, 'message' => 'Could not add gateway (code may already exist).'], 400);
            }
            json_out(['ok' => true, 'message' => "Payment gateway '$name' created!"]);
        }
    }

    if ($action === 'toggle_gateway') {
        $id       = (int)($input['id'] ?? 0);
        $isActive = !empty($input['is_active']) ? 1 : 0;
        $mode     = ($input['mode'] ?? 'test') === 'live' ? 'live' : 'test';
        db_run($conn, "UPDATE payment_gateways SET is_active = ?, mode = ? WHERE id = ?", 'isi', [$isActive, $mode, $id]);
        json_out(['ok' => true, 'message' => 'Gateway status updated.']);
    }

    if ($action === 'delete_gateway') {
        $id = (int)($input['id'] ?? 0);
        db_run($conn, "DELETE FROM payment_gateways WHERE id = ?", 'i', [$id]);
        json_out(['ok' => true, 'message' => 'Payment gateway deleted.']);
    }

    // 2. ORDERS: Update Order & Payment Status
    if ($action === 'update_order') {
        $orderId       = (int)($input['id'] ?? 0);
        $orderStatus   = $input['order_status'] ?? 'pending';
        $paymentStatus = $input['payment_status'] ?? 'pending';
        db_run($conn, "UPDATE orders SET order_status = ?, payment_status = ? WHERE id = ?", 'ssi', [$orderStatus, $paymentStatus, $orderId]);

        $ordRow = db_one($conn, "SELECT uid, order_number FROM orders WHERE id = ?", 'i', [$orderId]);
        if ($ordRow && !empty($ordRow['uid'])) {
            send_push_notification(
                $conn,
                $ordRow['uid'],
                "Order #{$ordRow['order_number']} Updated",
                "Your order status is now '" . strtoupper($orderStatus) . "' (Payment: " . strtoupper($paymentStatus) . ").",
                'order',
                '/member?tab=orders',
                'bi-truck'
            );
        }

        json_out(['ok' => true, 'message' => 'Order status updated and customer notified via push notification.']);
    }

    // 2b. ORDERS: Verify Sealed Order & Release Funds to Vendor Wallet
    if ($action === 'release_order_funds') {
        $orderId = (int)($input['id'] ?? $input['order_id'] ?? 0);
        $ord = db_one($conn, "SELECT * FROM orders WHERE id = ? LIMIT 1", 'i', [$orderId]);
        if (!$ord) {
            json_out(['ok' => false, 'message' => 'Order not found.'], 404);
        }

        if (empty($ord['is_sealed']) || empty($ord['buyer_received']) || empty($ord['buyer_good_condition'])) {
            json_out([
                'ok'      => false,
                'message' => 'Cannot release funds yet! The customer must first click "I have received the product" AND "Received in good condition" to SEAL this order.',
            ], 400);
        }

        if (!empty($ord['admin_funds_released'])) {
            json_out(['ok' => false, 'message' => 'Funds for this sealed order have already been verified and released to the vendor wallet.'], 400);
        }

        // Release held escrow transactions for this order
        $txRows = db_rows(
            $conn,
            "SELECT * FROM vendor_wallet_transactions WHERE order_id = ? AND status IN ('escrow_pending', 'sealed_awaiting_admin')",
            'i',
            [$orderId]
        );

        $totalReleased = 0.0;
        $releasedVendors = [];

        if (!empty($txRows)) {
            foreach ($txRows as $tx) {
                $vUid   = $tx['vendor_uid'];
                $netAmt = round((float)$tx['net_vendor_amount'], 2);
                if ($tx['payment_mode'] === 'company_wallet' && $netAmt > 0) {
                    db_run(
                        $conn,
                        "UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + ? WHERE uid = ?",
                        'ds',
                        [$netAmt, $vUid]
                    );
                }
                db_run(
                    $conn,
                    "UPDATE vendor_wallet_transactions
                        SET status = 'completed',
                            description = CONCAT(description, ' [FUNDS RELEASED TO VENDOR WALLET BY ADMIN]')
                      WHERE id = ?",
                    'i',
                    [(int)$tx['id']]
                );
                $totalReleased += $netAmt;
                $releasedVendors[$vUid] = ($releasedVendors[$vUid] ?? 0) + $netAmt;
            }
        } else {
            // Fallback for older orders created before escrow ledger rows
            $siteSettings = get_site_settings($conn);
            $chargePct = (float)($siteSettings['company_wallet_charge_pct'] ?? 5.0);
            $items = db_rows($conn, "SELECT * FROM order_items WHERE order_id = ?", 'i', [$orderId]);
            $byVendor = [];
            foreach ($items as $it) {
                $vUid = $it['vendor_uid'] ?: 'admin_seed_001';
                $byVendor[$vUid] = ($byVendor[$vUid] ?? 0.0) + (float)$it['line_total'];
            }
            foreach ($byVendor as $vUid => $gross) {
                $fee = round($gross * ($chargePct / 100), 2);
                $net = round($gross - $fee, 2);
                db_run($conn, "UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + ? WHERE uid = ?", 'ds', [$net, $vUid]);
                db_run(
                    $conn,
                    "INSERT INTO vendor_wallet_transactions
                        (vendor_uid, order_id, order_number, tx_type, payment_mode, gross_amount, company_charge_percent, company_charge_amount, net_vendor_amount, currency_code, status, description)
                     VALUES (?, ?, ?, 'sale_credit', 'company_wallet', ?, ?, ?, ?, 'USD', 'completed', ?)",
                    'sisdddds',
                    [$vUid, $orderId, $ord['order_number'], $gross, $chargePct, $fee, $net, "Order #{$ord['order_number']} — Verified & Released by Admin after Buyer Seal"]
                );
                $totalReleased += $net;
                $releasedVendors[$vUid] = ($releasedVendors[$vUid] ?? 0) + $net;
            }
        }

        db_run(
            $conn,
            "UPDATE orders
                SET admin_funds_released = 1,
                    funds_released_at = NOW(),
                    escrow_status = 'released',
                    order_status = 'delivered',
                    payment_status = 'paid'
              WHERE id = ?",
            'i',
            [$orderId]
        );

        foreach ($releasedVendors as $vUid => $amt) {
            send_push_notification(
                $conn,
                $vUid,
                "Escrow Funds Released: $" . number_format($amt, 2) . "!",
                "Admin verified sealed Order #{$ord['order_number']} and released $" . number_format($amt, 2) . " directly to your Vendor Wallet!",
                'success',
                '/member?tab=domain',
                'bi-cash-coin'
            );
        }

        if (!empty($ord['uid'])) {
            send_push_notification(
                $conn,
                $ord['uid'],
                "Order #{$ord['order_number']} Completed & Settled",
                "Admin has verified your sealed delivery confirmation and finalized vendor settlement for Order #{$ord['order_number']}.",
                'order',
                '/member?tab=orders',
                'bi-shield-check'
            );
        }

        json_out([
            'ok'      => true,
            'message' => "Verified! $" . number_format($totalReleased, 2) . " has been released from Escrow into the vendor's wallet for Sealed Order #{$ord['order_number']}.",
        ]);
    }

    // 3. USERS & VENDORS: Update Role / Status
    if ($action === 'update_user') {
        $targetUid = trim((string)($input['uid'] ?? ''));
        $status    = in_array($input['status'] ?? 'active', ['active', 'pending', 'suspended'], true) ? $input['status'] : 'active';
        $isVendor  = !empty($input['is_vendor']) ? 1 : 0;
        $isAdmin   = !empty($input['is_admin']) ? 1 : 0;

        db_run($conn, "UPDATE users SET status = ?, is_vendor = ?, is_admin = ? WHERE uid = ?", 'siis', [$status, $isVendor, $isAdmin, $targetUid]);

        if ($isVendor) {
            $uRow = db_one($conn, "SELECT username, firstname, lastname, phone FROM users WHERE uid = ?", 's', [$targetUid]);
            if ($uRow) {
                $sName = ucfirst($uRow['firstname']) . ' ' . ucfirst($uRow['lastname']) . ' Store';
                $sSlug = slugify($uRow['username'] . '-store');
                db_run(
                    $conn,
                    "INSERT IGNORE INTO vendors (uid, store_name, store_slug, title, description, business_phone, status)
                     VALUES (?, ?, ?, ?, 'Verified Marketplace Vendor', ?, 'active')",
                    'sssss',
                    [$targetUid, $sName, $sSlug, $sName, $uRow['phone']]
                );
                db_run($conn, "UPDATE vendors SET status = 'active' WHERE uid = ?", 's', [$targetUid]);
            }
        } else {
            db_run($conn, "UPDATE vendors SET status = 'suspended' WHERE uid = ?", 's', [$targetUid]);
        }

        json_out(['ok' => true, 'message' => 'User account updated.']);
    }

    if ($action === 'delete_user') {
        $targetUid = trim((string)($input['uid'] ?? ''));
        if ($targetUid === $admin['uid']) {
            json_out(['ok' => false, 'message' => 'You cannot delete your own admin account.'], 400);
        }
        db_run($conn, "DELETE FROM users WHERE uid = ?", 's', [$targetUid]);
        json_out(['ok' => true, 'message' => 'User deleted.']);
    }

    // 4. PRODUCTS: Create / Edit / Delete
    if ($action === 'save_product') {
        $pid       = (int)($input['id'] ?? 0);
        $ownerUid  = trim((string)($input['uid'] ?? $admin['uid'])) ?: $admin['uid'];
        $name      = trim((string)($input['product_name'] ?? ''));
        $catId     = !empty($input['product_category_id']) ? (int)$input['product_category_id'] : null;
        $subId     = !empty($input['product_sub_category_id']) ? (int)$input['product_sub_category_id'] : null;
        $brandId   = !empty($input['brand_category_id']) ? (int)$input['brand_category_id'] : null;
        $price     = max(0, (float)($input['price'] ?? 0));
        $offPrice  = max(0, min(99, (float)($input['off_price'] ?? 0)));
        $instock   = max(0, (int)($input['instock'] ?? 0));
        $desc      = trim((string)($input['description'] ?? ''));
        $keywords  = trim((string)($input['keywords'] ?? ''));

        if ($name === '' || $price <= 0) {
            json_out(['ok' => false, 'message' => 'Product name and price are required.'], 400);
        }

        $imagesRaw = $input['images'] ?? ($input['image'] ?? '');
        $images = is_array($imagesRaw)
            ? array_values(array_filter(array_map('trim', $imagesRaw)))
            : array_values(array_filter(array_map('trim', preg_split('/[\r\n,]+/', (string)$imagesRaw))));

        $sizesRaw = $input['sizes'] ?? '';
        $sizes = is_array($sizesRaw)
            ? array_values(array_filter(array_map('trim', $sizesRaw)))
            : array_values(array_filter(array_map('trim', explode(',', (string)$sizesRaw))));

        $colorsRaw = $input['colors'] ?? '';
        $colors = is_array($colorsRaw)
            ? array_values(array_filter(array_map('trim', $colorsRaw)))
            : array_values(array_filter(array_map('trim', explode(',', (string)$colorsRaw))));

        $spec = [
            'image'  => $images[0] ?? 'https://placehold.co/600x800/f3e8ff/7b1d8e?text=Product',
            'images' => !empty($images) ? $images : ['https://placehold.co/600x800/f3e8ff/7b1d8e?text=Product'],
            'sizes'  => $sizes,
            'colors' => $colors,
        ];
        $specJson = json_encode($spec, JSON_UNESCAPED_SLASHES);

        if ($pid > 0) {
            db_run(
                $conn,
                "UPDATE products SET product_name = ?, product_category_id = ?, product_sub_category_id = ?, brand_category_id = ?,
                        keywords = ?, description = ?, price = ?, off_price = ?, specification = ?, instock = ?
                  WHERE id = ?",
                'siiissddsii',
                [$name, $catId, $subId, $brandId, $keywords, $desc, $price, $offPrice, $specJson, $instock, $pid]
            );
            json_out(['ok' => true, 'message' => 'Product updated!']);
        } else {
            $slug = slugify($name) . '-' . substr(bin2hex(random_bytes(2)), 0, 4);
            db_run(
                $conn,
                "INSERT INTO products (uid, slug, product_name, product_category_id, product_sub_category_id, brand_category_id, keywords, description, price, off_price, specification, instock)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                'sssiiissddsi',
                [$ownerUid, $slug, $name, $catId, $subId, $brandId, $keywords, $desc, $price, $offPrice, $specJson, $instock]
            );
            json_out(['ok' => true, 'message' => 'Product created!']);
        }
    }

    if ($action === 'delete_product') {
        $pid = (int)($input['id'] ?? 0);
        db_run($conn, "DELETE FROM products WHERE id = ?", 'i', [$pid]);
        json_out(['ok' => true, 'message' => 'Product deleted.']);
    }

    // 5. CATEGORIES, SUB-CATEGORIES & BRANDS
    if ($action === 'save_category') {
        $id    = (int)($input['id'] ?? 0);
        $name  = trim((string)($input['name'] ?? ''));
        $slug  = trim((string)($input['slug'] ?? '')) ?: slugify($name);
        $desc  = trim((string)($input['description'] ?? ''));
        $image = trim((string)($input['image'] ?? ''));

        if ($name === '') json_out(['ok' => false, 'message' => 'Category name is required.'], 400);

        if ($id > 0) {
            db_run($conn, "UPDATE category SET name = ?, slug = ?, description = ?, image = ? WHERE id = ?", 'ssssi', [$name, $slug, $desc, $image, $id]);
        } else {
            db_run($conn, "INSERT INTO category (name, slug, description, image) VALUES (?, ?, ?, ?)", 'ssss', [$name, $slug, $desc, $image]);
        }
        json_out(['ok' => true, 'message' => 'Category saved!']);
    }

    if ($action === 'delete_category') {
        $id = (int)($input['id'] ?? 0);
        db_run($conn, "DELETE FROM category WHERE id = ?", 'i', [$id]);
        json_out(['ok' => true, 'message' => 'Category deleted.']);
    }

    if ($action === 'save_sub_category') {
        $id    = (int)($input['id'] ?? 0);
        $catId = (int)($input['category_id'] ?? 0);
        $name  = trim((string)($input['name'] ?? ''));
        $slug  = trim((string)($input['slug'] ?? '')) ?: slugify($name);
        $desc  = trim((string)($input['description'] ?? ''));

        if ($name === '' || $catId <= 0) json_out(['ok' => false, 'message' => 'Subcategory name and parent category are required.'], 400);

        if ($id > 0) {
            db_run($conn, "UPDATE sub_category SET category_id = ?, name = ?, slug = ?, description = ? WHERE id = ?", 'isssi', [$catId, $name, $slug, $desc, $id]);
        } else {
            db_run($conn, "INSERT INTO sub_category (category_id, name, slug, description) VALUES (?, ?, ?, ?)", 'isss', [$catId, $name, $slug, $desc]);
        }
        json_out(['ok' => true, 'message' => 'Subcategory saved!']);
    }

    if ($action === 'delete_sub_category') {
        $id = (int)($input['id'] ?? 0);
        db_run($conn, "DELETE FROM sub_category WHERE id = ?", 'i', [$id]);
        json_out(['ok' => true, 'message' => 'Subcategory deleted.']);
    }

    if ($action === 'save_brand') {
        $id    = (int)($input['id'] ?? 0);
        $subId = !empty($input['sub_category_id']) ? (int)$input['sub_category_id'] : null;
        $name  = trim((string)($input['name'] ?? ''));
        $slug  = trim((string)($input['slug'] ?? '')) ?: slugify($name);

        if ($name === '') json_out(['ok' => false, 'message' => 'Brand name is required.'], 400);

        if ($id > 0) {
            db_run($conn, "UPDATE brand_category SET sub_category_id = ?, name = ?, slug = ? WHERE id = ?", 'issi', [$subId, $name, $slug, $id]);
        } else {
            db_run($conn, "INSERT INTO brand_category (sub_category_id, name, slug) VALUES (?, ?, ?)", 'iss', [$subId, $name, $slug]);
        }
        json_out(['ok' => true, 'message' => 'Brand saved!']);
    }

    if ($action === 'delete_brand') {
        $id = (int)($input['id'] ?? 0);
        db_run($conn, "DELETE FROM brand_category WHERE id = ?", 'i', [$id]);
        json_out(['ok' => true, 'message' => 'Brand deleted.']);
    }

    // 6. INVENTORIES (Homepage Collections)
    if ($action === 'save_inventory') {
        $id          = (int)($input['id'] ?? 0);
        $name        = trim((string)($input['name'] ?? ''));
        $slug        = trim((string)($input['slug'] ?? '')) ?: slugify($name);
        $invPosition = (int)($input['inv_position'] ?? 1);
        $styleType   = (int)($input['style_type'] ?? 1);
        $showAds     = !empty($input['show_ads_next']) ? 1 : 0;
        $desc        = trim((string)($input['description'] ?? ''));

        if ($name === '') json_out(['ok' => false, 'message' => 'Inventory name is required.'], 400);

        if ($id > 0) {
            db_run(
                $conn,
                "UPDATE inventories SET name = ?, slug = ?, inv_position = ?, style_type = ?, show_ads_next = ?, description = ? WHERE id = ?",
                'ssiiisi',
                [$name, $slug, $invPosition, $styleType, $showAds, $desc, $id]
            );
        } else {
            db_run(
                $conn,
                "INSERT INTO inventories (name, slug, inv_position, style_type, show_ads_next, description) VALUES (?, ?, ?, ?, ?, ?)",
                'ssiiis',
                [$name, $slug, $invPosition, $styleType, $showAds, $desc]
            );
        }
        json_out(['ok' => true, 'message' => 'Inventory section saved!']);
    }

    if ($action === 'reorder_inventory') {
        $id        = (int)($input['id'] ?? 0);
        $direction = $input['direction'] ?? '';
        $newPos    = isset($input['inv_position']) ? (int)$input['inv_position'] : null;

        $curr = db_one($conn, "SELECT id, inv_position FROM inventories WHERE id = ? LIMIT 1", 'i', [$id]);
        if (!$curr) {
            json_out(['ok' => false, 'message' => 'Inventory not found.'], 404);
        }

        if ($newPos !== null) {
            db_run($conn, "UPDATE inventories SET inv_position = ? WHERE id = ?", 'ii', [max(1, $newPos), $id]);
        } elseif ($direction === 'up') {
            $prev = db_one($conn, "SELECT id, inv_position FROM inventories WHERE inv_position < ? ORDER BY inv_position DESC LIMIT 1", 'i', [(int)$curr['inv_position']]);
            if ($prev) {
                db_run($conn, "UPDATE inventories SET inv_position = ? WHERE id = ?", 'ii', [(int)$prev['inv_position'], $id]);
                db_run($conn, "UPDATE inventories SET inv_position = ? WHERE id = ?", 'ii', [(int)$curr['inv_position'], (int)$prev['id']]);
            } else {
                db_run($conn, "UPDATE inventories SET inv_position = GREATEST(1, inv_position - 1) WHERE id = ?", 'i', [$id]);
            }
        } elseif ($direction === 'down') {
            $next = db_one($conn, "SELECT id, inv_position FROM inventories WHERE inv_position > ? ORDER BY inv_position ASC LIMIT 1", 'i', [(int)$curr['inv_position']]);
            if ($next) {
                db_run($conn, "UPDATE inventories SET inv_position = ? WHERE id = ?", 'ii', [(int)$next['inv_position'], $id]);
                db_run($conn, "UPDATE inventories SET inv_position = ? WHERE id = ?", 'ii', [(int)$curr['inv_position'], (int)$next['id']]);
            } else {
                db_run($conn, "UPDATE inventories SET inv_position = inv_position + 1 WHERE id = ?", 'i', [$id]);
            }
        }

        json_out(['ok' => true, 'message' => 'Homepage inventory order updated!']);
    }

    // 6b. HOMEPAGE PROMO AD BANNERS
    if ($action === 'save_promo_ad') {
        $id       = (int)($input['id'] ?? 0);
        $title    = trim((string)($input['title'] ?? ''));
        $subtitle = trim((string)($input['subtitle'] ?? ''));
        $badge    = trim((string)($input['badge_text'] ?? 'FEATURED PROMO'));
        $ctaText  = trim((string)($input['cta_text'] ?? 'Shop Now'));
        $ctaLink  = trim((string)($input['cta_link'] ?? '/'));
        $imgUrl   = trim((string)($input['image_url'] ?? ''));
        $bgGrad   = trim((string)($input['bg_gradient'] ?? 'from-[#3b0764] via-[#7b1d8e] to-[#ea580c]'));
        $posKey   = in_array($input['position_key'] ?? 'after_first_inv', ['hero_top', 'after_first_inv', 'mid_page', 'bottom_banner'], true)
            ? $input['position_key']
            : 'after_first_inv';
        $sortOrd  = (int)($input['sort_order'] ?? 1);
        $isActive = !empty($input['is_active']) ? 1 : 0;

        if ($title === '') {
            json_out(['ok' => false, 'message' => 'Promo Ad title is required.'], 400);
        }

        if ($id > 0) {
            db_run(
                $conn,
                "UPDATE home_promo_ads
                    SET title = ?, subtitle = ?, badge_text = ?, cta_text = ?, cta_link = ?,
                        image_url = ?, bg_gradient = ?, position_key = ?, sort_order = ?, is_active = ?
                  WHERE id = ?",
                'ssssssssiii',
                [$title, $subtitle, $badge, $ctaText, $ctaLink, $imgUrl, $bgGrad, $posKey, $sortOrd, $isActive, $id]
            );
        } else {
            db_run(
                $conn,
                "INSERT INTO home_promo_ads
                    (title, subtitle, badge_text, cta_text, cta_link, image_url, bg_gradient, position_key, sort_order, is_active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                'ssssssssii',
                [$title, $subtitle, $badge, $ctaText, $ctaLink, $imgUrl, $bgGrad, $posKey, $sortOrd, $isActive]
            );
        }
        json_out(['ok' => true, 'message' => 'Homepage Promo Banner Ad saved!']);
    }

    if ($action === 'delete_promo_ad') {
        $id = (int)($input['id'] ?? 0);
        db_run($conn, "DELETE FROM home_promo_ads WHERE id = ?", 'i', [$id]);
        json_out(['ok' => true, 'message' => 'Promo Ad deleted.']);
    }

    // 6c. PERSONAL STORE GIFT CARDS (Admin Create / Delete)
    if ($action === 'create_gift_card') {
        $amountUsd   = round(max(1.0, min(50000.0, (float)($input['amount_usd'] ?? 25))), 2);
        $customCode  = strtoupper(preg_replace('/[^A-Z0-9\-]/', '', trim((string)($input['code'] ?? ''))));
        $code        = $customCode !== '' ? $customCode : ('BG-GIFT-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4)) . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4)));
        $title       = trim((string)($input['title'] ?? 'Shoplenca Official Gift Card')) ?: 'Shoplenca Official Gift Card';
        $theme       = in_array($input['design_theme'] ?? 'royal_gold', ['royal_gold', 'purple_vip', 'emerald_festive', 'midnight_black'], true)
            ? $input['design_theme']
            : 'royal_gold';
        $recipName   = trim((string)($input['recipient_name'] ?? ''));
        $recipEmail  = trim((string)($input['recipient_email'] ?? ''));
        $personalMsg = trim((string)($input['personal_message'] ?? 'Official Store Gift Card — Redeem directly to your Member Wallet!'));
        $qty         = max(1, min(20, (int)($input['quantity'] ?? 1)));

        $createdCodes = [];
        for ($i = 0; $i < $qty; $i++) {
            $thisCode = ($i === 0 && $customCode !== '') ? $customCode : ('BG-GIFT-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4)) . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4)));
            db_run(
                $conn,
                "INSERT IGNORE INTO gift_cards
                    (code, title, design_theme, amount_usd, initial_balance, remaining_balance, created_by_uid, recipient_name, recipient_email, personal_message, status, expires_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', DATE_ADD(NOW(), INTERVAL 2 YEAR))",
                'sssdddssss',
                [$thisCode, $title, $theme, $amountUsd, $amountUsd, $amountUsd, $admin['uid'], $recipName ?: null, $recipEmail ?: null, $personalMsg]
            );
            $createdCodes[] = $thisCode;
        }

        json_out([
            'ok'      => true,
            'codes'   => $createdCodes,
            'message' => count($createdCodes) === 1
                ? "Gift Card {$createdCodes[0]} ($" . number_format($amountUsd, 2) . ") created!"
                : count($createdCodes) . " Gift Cards ($" . number_format($amountUsd, 2) . " each) generated!",
        ]);
    }

    if ($action === 'delete_gift_card') {
        $id = (int)($input['id'] ?? 0);
        db_run($conn, "DELETE FROM gift_cards WHERE id = ?", 'i', [$id]);
        json_out(['ok' => true, 'message' => 'Gift card deleted.']);
    }

    if ($action === 'delete_inventory') {
        $id = (int)($input['id'] ?? 0);
        db_run($conn, "DELETE FROM inventories WHERE id = ?", 'i', [$id]);
        json_out(['ok' => true, 'message' => 'Inventory deleted.']);
    }

    if ($action === 'assign_inventory_product') {
        $invId = (int)($input['inventory_id'] ?? 0);
        $prodId = (int)($input['product_id'] ?? 0);
        db_run($conn, "INSERT IGNORE INTO product_inventories (inventory_id, product_id, is_paid) VALUES (?, ?, 1)", 'ii', [$invId, $prodId]);
        json_out(['ok' => true, 'message' => 'Product added to collection!']);
    }

    if ($action === 'remove_inventory_product') {
        $invId  = (int)($input['inventory_id'] ?? 0);
        $prodId = (int)($input['product_id'] ?? 0);
        db_run($conn, "DELETE FROM product_inventories WHERE inventory_id = ? AND product_id = ?", 'ii', [$invId, $prodId]);
        json_out(['ok' => true, 'message' => 'Product removed from collection.']);
    }

    // 7. BLOG POSTS
    if ($action === 'save_blog') {
        $id       = (int)($input['id'] ?? 0);
        $title    = trim((string)($input['title'] ?? ''));
        $slug     = trim((string)($input['slug'] ?? '')) ?: slugify($title);
        $category = trim((string)($input['category'] ?? 'General'));
        $excerpt  = trim((string)($input['excerpt'] ?? ''));
        $content  = trim((string)($input['content'] ?? ''));
        $image    = trim((string)($input['image'] ?? ''));
        $tags     = trim((string)($input['tags'] ?? ''));
        $status   = in_array($input['status'] ?? 'published', ['draft', 'published', 'archived'], true) ? $input['status'] : 'published';

        if ($title === '' || $content === '') {
            json_out(['ok' => false, 'message' => 'Title and content are required.'], 400);
        }

        if ($id > 0) {
            db_run(
                $conn,
                "UPDATE blog_posts SET title = ?, slug = ?, category = ?, excerpt = ?, content = ?, image = ?, tags = ?, status = ?,
                        published_at = COALESCE(published_at, NOW())
                  WHERE id = ?",
                'ssssssssi',
                [$title, $slug, $category, $excerpt, $content, $image, $tags, $status, $id]
            );
        } else {
            db_run(
                $conn,
                "INSERT INTO blog_posts (uid, title, slug, category, excerpt, content, image, tags, status, published_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())",
                'sssssssss',
                [$admin['uid'], $title, $slug, $category, $excerpt, $content, $image, $tags, $status]
            );
        }
        json_out(['ok' => true, 'message' => 'Blog post saved!']);
    }

    if ($action === 'delete_blog') {
        $id = (int)($input['id'] ?? 0);
        db_run($conn, "DELETE FROM blog_posts WHERE id = ?", 'i', [$id]);
        json_out(['ok' => true, 'message' => 'Blog post deleted.']);
    }

    // 8. MESSAGES & CONTACT INFO
    if ($action === 'update_message') {
        $id     = (int)($input['id'] ?? 0);
        $status = in_array($input['status'] ?? 'read', ['new', 'read', 'replied', 'archived'], true) ? $input['status'] : 'read';
        $note   = trim((string)($input['admin_note'] ?? ''));
        db_run(
            $conn,
            "UPDATE contact_messages SET status = ?, admin_note = ?, replied_at = IF(? = 'replied', NOW(), replied_at) WHERE id = ?",
            'sssi',
            [$status, $note, $status, $id]
        );
        json_out(['ok' => true, 'message' => 'Message updated.']);
    }

    if ($action === 'delete_message') {
        $id = (int)($input['id'] ?? 0);
        db_run($conn, "DELETE FROM contact_messages WHERE id = ?", 'i', [$id]);
        json_out(['ok' => true, 'message' => 'Message deleted.']);
    }

    if ($action === 'save_contact_info') {
        $id     = (int)($input['id'] ?? 0);
        $type   = trim((string)($input['type'] ?? 'info'));
        $label  = trim((string)($input['label'] ?? ''));
        $value  = trim((string)($input['value'] ?? ''));
        $icon   = trim((string)($input['icon'] ?? 'bi-info-circle'));
        $link   = trim((string)($input['link'] ?? ''));
        $status = ($input['status'] ?? 'active') === 'inactive' ? 'inactive' : 'active';

        if ($id > 0) {
            db_run($conn, "UPDATE contact_info SET type = ?, label = ?, value = ?, icon = ?, link = ?, status = ? WHERE id = ?", 'ssssssi', [$type, $label, $value, $icon, $link ?: null, $status, $id]);
        } else {
            db_run($conn, "INSERT INTO contact_info (type, label, value, icon, link, status) VALUES (?, ?, ?, ?, ?, ?)", 'ssssss', [$type, $label, $value, $icon, $link ?: null, $status]);
        }
        json_out(['ok' => true, 'message' => 'Contact info saved.']);
    }

    // 8b. DIGITAL BOOKS (Admin Save & Price Books)
    if ($action === 'save_book') {
        $bookId      = (int)($input['id'] ?? 0);
        $title       = trim((string)($input['title'] ?? ''));
        $author      = trim((string)($input['author'] ?? 'Editorial Team'));
        $category    = trim((string)($input['category'] ?? 'General'));
        $coverImage  = trim((string)($input['cover_image'] ?? ''));
        $description = trim((string)($input['description'] ?? ''));
        $status      = in_array($input['status'] ?? 'published', ['draft', 'published'], true) ? $input['status'] : 'published';
        $isMonetized = !empty($input['is_monetized']) ? 1 : 0;
        $price       = max(0.0, round((float)($input['price'] ?? 0), 2));
        $comparePrice= max(0.0, round((float)($input['compare_price'] ?? 0), 2));
        $freePreview = max(0, (int)($input['free_preview_chapters'] ?? 1));
        $chaptersIn  = is_array($input['chapters'] ?? null) ? $input['chapters'] : [];

        if ($title === '') {
            json_out(['ok' => false, 'message' => 'Book title is required.'], 400);
        }

        if ($bookId > 0) {
            db_run(
                $conn,
                "UPDATE books
                    SET title = ?, author = ?, cover_image = ?, description = ?,
                        category = ?, status = ?, is_monetized = ?, price = ?, compare_price = ?, free_preview_chapters = ?
                  WHERE id = ?",
                'ssssssiddii',
                [$title, $author, $coverImage ?: null, $description, $category, $status, $isMonetized, $price, $comparePrice, $freePreview, $bookId]
            );
        } else {
            $slug = slugify($title) . '-' . substr(bin2hex(random_bytes(2)), 0, 4);
            $ins = db_run(
                $conn,
                "INSERT INTO books (uid, slug, title, author, cover_image, description, category, status, is_monetized, price, compare_price, free_preview_chapters)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                'ssssssssiddi',
                [$admin['uid'], $slug, $title, $author, $coverImage ?: null, $description, $category, $status, $isMonetized, $price, $comparePrice, $freePreview]
            );
            $bookId = (int)$ins['insert_id'];
        }

        if ($bookId > 0 && !empty($chaptersIn)) {
            db_run($conn, "DELETE FROM book_chapters WHERE book_id = ?", 'i', [$bookId]);
            $chNo = 1;
            foreach ($chaptersIn as $ch) {
                $chTitle   = trim((string)($ch['title'] ?? ("Chapter $chNo")));
                $chContent = trim((string)($ch['content'] ?? ''));
                if ($chContent === '') continue;
                db_run(
                    $conn,
                    "INSERT INTO book_chapters (book_id, chapter_no, title, content) VALUES (?, ?, ?, ?)",
                    'iiss',
                    [$bookId, $chNo, $chTitle, $chContent]
                );
                $chNo++;
            }
        }
        json_out(['ok' => true, 'message' => 'Book, price & chapters saved!']);
    }

    if ($action === 'delete_book') {
        $bookId = (int)($input['book_id'] ?? $input['id'] ?? 0);
        db_run($conn, "DELETE FROM books WHERE id = ?", 'i', [$bookId]);
        json_out(['ok' => true, 'message' => 'Book deleted.']);
    }

    // 9. SITE SETTINGS, COMPANY INFORMATION, ADSENSE, CAPACITOR / ADMOB, CURRENCIES & STATIC PAGES
    if ($action === 'save_settings') {
        $keys = [
            'company_name', 'company_title', 'company_desc', 'company_keywords',
            'company_logo', 'shipping_fee', 'free_ship_min', 'prepaid_discount',
            'announcement_text', 'writer_reward_per_read', 'reader_reward_per_chapter',
            'subdomain_fee_ngn', 'subdomain_grace_days', 'company_wallet_charge_pct',
            // Expanded Company Information & Social Links
            'company_email', 'company_phone', 'company_whatsapp', 'company_address',
            'company_working_hours', 'company_mission', 'company_vision',
            'company_founded_year', 'company_rc_number',
            'social_facebook', 'social_instagram', 'social_twitter', 'social_tiktok', 'social_youtube',
            'footer_copyright', 'escrow_policy_text',
            // AdSense & Custom Ad Slot Codes
            'adsense_enabled', 'adsense_client_id', 'adsense_auto_ads', 'adsense_head_script',
            'adsense_slot_header', 'adsense_html_header',
            'adsense_slot_home', 'adsense_html_home',
            'adsense_slot_product', 'adsense_html_product',
            'adsense_slot_category', 'adsense_html_category',
            'adsense_slot_article', 'adsense_html_article',
            'adsense_slot_footer', 'adsense_html_footer',
            // Native Capacitor App & AdMob Configuration
            'capacitor_app_id', 'capacitor_app_name', 'capacitor_server_url',
            'admob_enabled', 'admob_app_id_android', 'admob_app_id_ios',
            'admob_banner_id', 'admob_interstitial_id', 'admob_rewarded_id',
        ];
        foreach ($keys as $k) {
            if (array_key_exists($k, $input)) {
                $val = trim((string)$input[$k]);
                db_run(
                    $conn,
                    "INSERT INTO site_settings (setting_key, setting_value) VALUES (?, ?)
                     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
                    'ss',
                    [$k, $val]
                );
            }
        }
        json_out(['ok' => true, 'message' => 'Company Information, Store Settings, AdSense & Capacitor configuration saved!']);
    }

    // 10. ADMIN VENDOR VERIFICATION (Verify / Reject / Revoke Vendor)
    if ($action === 'verify_vendor') {
        $targetUid  = trim((string)($input['uid'] ?? ''));
        $vStatus    = in_array($input['verification_status'] ?? 'verified', ['verified', 'rejected', 'pending', 'unverified'], true)
            ? $input['verification_status']
            : 'verified';
        $isVerified = ($vStatus === 'verified') ? 1 : 0;
        $note       = trim((string)($input['verification_note'] ?? ''));

        if ($targetUid === '') {
            json_out(['ok' => false, 'message' => 'Vendor UID is required.'], 400);
        }

        // Ensure vendor record exists
        $vRow = db_one($conn, "SELECT * FROM vendors WHERE uid = ? LIMIT 1", 's', [$targetUid]);
        if (!$vRow) {
            $uRow = db_one($conn, "SELECT username, firstname, lastname, phone FROM users WHERE uid = ?", 's', [$targetUid]);
            if ($uRow) {
                $sName = ucfirst($uRow['firstname']) . ' ' . ucfirst($uRow['lastname']) . ' Store';
                $sSlug = slugify($uRow['username'] . '-store');
                db_run(
                    $conn,
                    "INSERT INTO vendors (uid, store_name, store_slug, title, description, business_phone, is_verified, verification_status, verification_note, verified_at, status)
                     VALUES (?, ?, ?, ?, 'Official Marketplace Vendor', ?, ?, ?, ?, IF(? = 1, NOW(), NULL), 'active')",
                    'sssssissi',
                    [$targetUid, $sName, $sSlug, $sName, $uRow['phone'], $isVerified, $vStatus, $note, $isVerified]
                );
            }
        } else {
            db_run(
                $conn,
                "UPDATE vendors
                    SET is_verified = ?,
                        verification_status = ?,
                        verification_note = ?,
                        verified_at = IF(? = 1, NOW(), verified_at)
                  WHERE uid = ?",
                'issis',
                [$isVerified, $vStatus, $note, $isVerified, $targetUid]
            );
        }

        db_run($conn, "UPDATE users SET is_vendor = 1 WHERE uid = ?", 's', [$targetUid]);

        // Notify vendor via Push Notification
        if ($vStatus === 'verified') {
            send_push_notification(
                $conn,
                $targetUid,
                'Congratulations! You Are Now a Verified Vendor!',
                'Admin has verified your vendor store. Your products now carry the Official Verified Seller badge!' . ($note ? " Note: $note" : ''),
                'verification',
                '/member?tab=vendor',
                'bi-patch-check-fill'
            );
        } elseif ($vStatus === 'rejected') {
            send_push_notification(
                $conn,
                $targetUid,
                'Vendor Verification Update',
                'Your vendor verification application requires attention.' . ($note ? " Reason: $note" : ' Please update your business details and resubmit.'),
                'warning',
                '/member?tab=vendor',
                'bi-exclamation-triangle-fill'
            );
        }

        json_out([
            'ok'      => true,
            'message' => $isVerified
                ? 'Vendor verified and badge activated! Push notification sent.'
                : "Vendor verification status updated to '$vStatus'.",
        ]);
    }

    // 11. ADMIN SUBDOMAIN STORE MANAGEMENT (Reopen, Close, Extend Grace/Months, Change Payment Mode)
    if ($action === 'manage_domain_store') {
        $targetUid   = trim((string)($input['uid'] ?? ''));
        $storeStatus = in_array($input['domain_store_status'] ?? 'active', ['active', 'grace_period', 'closed_overdue', 'inactive'], true)
            ? $input['domain_store_status']
            : 'active';
        $paymentMode = ($input['payment_mode'] ?? 'self_managed') === 'company_wallet' ? 'company_wallet' : 'self_managed';
        $extendMo    = (int)($input['extend_months'] ?? 0);

        $vRow = db_one($conn, "SELECT * FROM vendors WHERE uid = ? LIMIT 1", 's', [$targetUid]);
        if (!$vRow) {
            json_out(['ok' => false, 'message' => 'Vendor store not found.'], 404);
        }

        $expiresAt   = $vRow['subscription_expires_at'];
        $graceEndsAt = $vRow['grace_ends_at'];
        $planActive  = ($storeStatus === 'active' || $storeStatus === 'grace_period') ? 1 : 0;

        if ($extendMo > 0) {
            $baseTs      = (!empty($expiresAt) && strtotime($expiresAt) > time()) ? strtotime($expiresAt) : time();
            $expiresAt   = date('Y-m-d H:i:s', strtotime("+{$extendMo} months", $baseTs));
            $graceEndsAt = date('Y-m-d H:i:s', strtotime("+2 days", strtotime($expiresAt)));
            $storeStatus = 'active';
            $planActive  = 1;
        } elseif ($storeStatus === 'active' && (empty($expiresAt) || strtotime($expiresAt) < time())) {
            $expiresAt   = date('Y-m-d H:i:s', strtotime("+1 month"));
            $graceEndsAt = date('Y-m-d H:i:s', strtotime("+2 days", strtotime($expiresAt)));
        }

        $vendorMainStatus = ($storeStatus === 'closed_overdue') ? 'suspended' : 'active';

        db_run(
            $conn,
            "UPDATE vendors
                SET domain_plan_active = ?, payment_mode = ?, subscription_expires_at = ?,
                    grace_ends_at = ?, domain_store_status = ?, status = ?
              WHERE uid = ?",
            'issssss',
            [$planActive, $paymentMode, $expiresAt, $graceEndsAt, $storeStatus, $vendorMainStatus, $targetUid]
        );

        send_push_notification(
            $conn,
            $targetUid,
            'Subdomain Store Status Updated',
            "Admin updated your subdomain store status to '" . strtoupper($storeStatus) . "'" . ($extendMo > 0 ? " and extended your subscription by {$extendMo} month(s)." : "."),
            'domain',
            '/member?tab=domain',
            'bi-globe2'
        );

        json_out(['ok' => true, 'message' => 'Vendor subdomain store updated and vendor notified!']);
    }

    // 12. ADMIN PUSH NOTIFICATIONS (Broadcast to all or send to specific user)
    if ($action === 'send_push') {
        $targetUid = trim((string)($input['target_uid'] ?? '')) ?: null;
        $title     = trim((string)($input['title'] ?? ''));
        $message   = trim((string)($input['message'] ?? ''));
        $type      = in_array($input['type'] ?? 'promo', ['info', 'success', 'warning', 'promo', 'order', 'domain', 'verification'], true) ? $input['type'] : 'promo';
        $link      = trim((string)($input['link'] ?? '/'));
        $icon      = trim((string)($input['icon'] ?? 'bi-bell-fill'));

        if ($title === '' || $message === '') {
            json_out(['ok' => false, 'message' => 'Notification title and message are required.'], 400);
        }

        send_push_notification($conn, $targetUid, $title, $message, $type, $link, $icon);
        json_out([
            'ok'      => true,
            'message' => $targetUid ? "Push notification sent to user ($targetUid)!" : 'Broadcast push notification sent to all users!',
        ]);
    }

    if ($action === 'delete_push') {
        $id = (int)($input['id'] ?? 0);
        db_run($conn, "DELETE FROM push_notifications WHERE id = ?", 'i', [$id]);
        json_out(['ok' => true, 'message' => 'Notification deleted.']);
    }

    if ($action === 'save_currency') {
        $id      = (int)($input['id'] ?? 0);
        $code    = strtoupper(substr(trim((string)($input['code'] ?? '')), 0, 3));
        $name    = trim((string)($input['name'] ?? ''));
        $symbol  = trim((string)($input['symbol'] ?? '$'));
        $rate    = max(0.0001, (float)($input['exchange_rate'] ?? 1.0));
        $status  = ($input['status'] ?? 'active') === 'inactive' ? 'inactive' : 'active';

        if ($id > 0) {
            db_run($conn, "UPDATE currencies SET code = ?, name = ?, symbol = ?, exchange_rate = ?, status = ? WHERE id = ?", 'sssdsi', [$code, $name, $symbol, $rate, $status, $id]);
        } else {
            db_run($conn, "INSERT INTO currencies (code, name, symbol, exchange_rate, status) VALUES (?, ?, ?, ?, ?)", 'sssds', [$code, $name, $symbol, $rate, $status]);
        }
        json_out(['ok' => true, 'message' => 'Currency exchange rate saved!']);
    }

    if ($action === 'save_site_page') {
        $id      = (int)($input['id'] ?? 0);
        $page    = trim((string)($input['page'] ?? 'about'));
        $tabSlug = trim((string)($input['tab_slug'] ?? '')) ?: slugify((string)($input['title'] ?? 'section'));
        $title   = trim((string)($input['title'] ?? ''));
        $icon    = trim((string)($input['icon'] ?? 'bi-file-text'));
        $content = trim((string)($input['content'] ?? ''));
        $status  = ($input['status'] ?? 'active') === 'inactive' ? 'inactive' : 'active';

        if ($id > 0) {
            db_run($conn, "UPDATE site_pages SET page = ?, tab_slug = ?, title = ?, icon = ?, content = ?, status = ? WHERE id = ?", 'ssssssi', [$page, $tabSlug, $title, $icon, $content, $status, $id]);
        } else {
            db_run($conn, "INSERT INTO site_pages (page, tab_slug, title, icon, content, status) VALUES (?, ?, ?, ?, ?, ?)", 'ssssss', [$page, $tabSlug, $title, $icon, $content, $status]);
        }
        json_out(['ok' => true, 'message' => 'Page content saved!']);
    }

    json_out(['ok' => false, 'message' => 'Unknown admin action.'], 400);
}

// ============================================================================
// GET: Admin Dashboard Data
// ============================================================================

$revRow   = db_one($conn, "SELECT COALESCE(SUM(total_amount), 0) AS rev FROM orders WHERE order_status <> 'cancelled'");
$nOrders  = (int)(db_one($conn, "SELECT COUNT(*) AS c FROM orders")['c'] ?? 0);
$nSealedAwaiting = (int)(db_one($conn, "SELECT COUNT(*) AS c FROM orders WHERE is_sealed = 1 AND admin_funds_released = 0")['c'] ?? 0);
$nUsers   = (int)(db_one($conn, "SELECT COUNT(*) AS c FROM users")['c'] ?? 0);
$nVendors = (int)(db_one($conn, "SELECT COUNT(*) AS c FROM users WHERE is_vendor = 1")['c'] ?? 0);
$nVerifiedVendors = (int)(db_one($conn, "SELECT COUNT(*) AS c FROM vendors WHERE is_verified = 1")['c'] ?? 0);
$nPendingVerif    = (int)(db_one($conn, "SELECT COUNT(*) AS c FROM vendors WHERE verification_status = 'pending'")['c'] ?? 0);
$nActiveDomains   = (int)(db_one($conn, "SELECT COUNT(*) AS c FROM vendors WHERE domain_plan_active = 1 AND domain_store_status IN ('active','grace_period')")['c'] ?? 0);
$compChargesRow   = db_one($conn, "SELECT COALESCE(SUM(company_charge_amount), 0) AS total FROM vendor_wallet_transactions");
$nProds   = (int)(db_one($conn, "SELECT COUNT(*) AS c FROM products")['c'] ?? 0);
$nBooks   = (int)(db_one($conn, "SELECT COUNT(*) AS c FROM books")['c'] ?? 0);
$nBlogs   = (int)(db_one($conn, "SELECT COUNT(*) AS c FROM blog_posts")['c'] ?? 0);
$nMsgs    = (int)(db_one($conn, "SELECT COUNT(*) AS c FROM contact_messages WHERE status = 'new'")['c'] ?? 0);
$nGiftCards = (int)(db_one($conn, "SELECT COUNT(*) AS c FROM gift_cards WHERE status = 'active'")['c'] ?? 0);

// Payment Gateways (including API keys for Admin)
$gateways = db_rows($conn, "SELECT * FROM payment_gateways ORDER BY sort_order ASC, id ASC");
foreach ($gateways as &$gw) {
    $gw['id']               = (int)$gw['id'];
    $gw['prepaid_discount'] = (bool)$gw['prepaid_discount'];
    $gw['is_active']        = (bool)$gw['is_active'];
    $gw['sort_order']       = (int)$gw['sort_order'];
    $gw['extra']            = json_decode($gw['extra_config'] ?? '{}', true) ?: [];
}
unset($gw);

// Orders
$orders = db_rows($conn, "SELECT * FROM orders ORDER BY (is_sealed = 1 AND admin_funds_released = 0) DESC, created_at DESC LIMIT 100");
foreach ($orders as &$ord) {
    $ord['id']                   = (int)$ord['id'];
    $ord['total_amount']         = (float)$ord['total_amount'];
    $ord['subtotal']             = (float)$ord['subtotal'];
    $ord['shipping_fee']         = (float)$ord['shipping_fee'];
    $ord['buyer_received']       = (bool)($ord['buyer_received'] ?? false);
    $ord['buyer_good_condition'] = (bool)($ord['buyer_good_condition'] ?? false);
    $ord['is_sealed']            = (bool)($ord['is_sealed'] ?? false);
    $ord['admin_funds_released'] = (bool)($ord['admin_funds_released'] ?? false);
    $ord['escrow_status']        = $ord['escrow_status'] ?? 'held_in_escrow';
    $ord['items']                = db_rows($conn, "SELECT * FROM order_items WHERE order_id = ?", 'i', [$ord['id']]);
}
unset($ord);

// Users & Vendors (joined with verification & subdomain fields)
$users = db_rows(
    $conn,
    "SELECT u.id, u.uid, u.username, u.firstname, u.lastname, u.email, u.phone,
            u.status, u.is_admin, u.is_vendor, u.is_sub_domain_owner, COALESCE(u.wallet_balance, 0) AS wallet_balance, u.created_at,
            v.store_name, v.store_slug, v.business_phone, v.store_address,
            COALESCE(v.is_verified, 0) AS vendor_verified,
            COALESCE(v.verification_status, 'unverified') AS verification_status,
            v.verification_note, v.business_reg_no, v.id_doc_url, v.verified_at,
            v.subdomain, v.custom_domain,
            COALESCE(v.domain_plan_active, 0) AS domain_plan_active,
            COALESCE(v.payment_mode, 'self_managed') AS payment_mode,
            v.subscription_starts_at, v.subscription_expires_at, v.grace_ends_at,
            COALESCE(v.domain_store_status, 'inactive') AS domain_store_status
       FROM users u
       LEFT JOIN vendors v ON v.uid = u.uid
      ORDER BY u.id DESC"
);
foreach ($users as &$u) {
    $u['id']                 = (int)$u['id'];
    $u['is_admin']           = (bool)$u['is_admin'];
    $u['is_vendor']          = (bool)$u['is_vendor'];
    $u['vendor_verified']    = (bool)$u['vendor_verified'];
    $u['domain_plan_active'] = (bool)$u['domain_plan_active'];
    $u['wallet_balance']     = (float)$u['wallet_balance'];
}
unset($u);

// Dedicated Vendors list with live grace period evaluation
$vendors = db_rows(
    $conn,
    "SELECT v.*, u.username, u.firstname, u.lastname, u.email, COALESCE(u.wallet_balance, 0) AS wallet_balance
       FROM vendors v
       JOIN users u ON u.uid = v.uid
      ORDER BY (v.verification_status = 'pending') DESC, v.id DESC"
);
foreach ($vendors as &$v) {
    $v = evaluate_vendor_domain_status($conn, $v);
    $v['id']                 = (int)$v['id'];
    $v['is_verified']        = (bool)$v['is_verified'];
    $v['domain_plan_active'] = (bool)$v['domain_plan_active'];
    $v['wallet_balance']     = (float)$v['wallet_balance'];
}
unset($v);

// Domain Subscriptions & Vendor Wallet Ledger (with Company Charges)
$domainSubscriptions = db_rows(
    $conn,
    "SELECT ds.*, u.username, u.email, v.store_name
       FROM domain_subscriptions ds
       LEFT JOIN users u ON u.uid = ds.uid
       LEFT JOIN vendors v ON v.uid = ds.uid
      ORDER BY ds.id DESC LIMIT 100"
);
$walletTransactions = db_rows(
    $conn,
    "SELECT wt.*, u.username, v.store_name
       FROM vendor_wallet_transactions wt
       LEFT JOIN users u ON u.uid = wt.vendor_uid
       LEFT JOIN vendors v ON v.uid = wt.vendor_uid
      ORDER BY wt.id DESC LIMIT 100"
);
$pushNotifications = db_rows(
    $conn,
    "SELECT * FROM push_notifications ORDER BY id DESC LIMIT 50"
);

// Products
$products = db_rows(
    $conn,
    "SELECT p.*, c.name AS category_name, sc.name AS sub_category_name, b.name AS brand_name, u.username AS seller
       FROM products p
       LEFT JOIN category c ON c.id = p.product_category_id
       LEFT JOIN sub_category sc ON sc.id = p.product_sub_category_id
       LEFT JOIN brand_category b ON b.id = p.brand_category_id
       LEFT JOIN users u ON u.uid = p.uid
      ORDER BY p.id DESC"
);
foreach ($products as &$p) {
    $p['id']          = (int)$p['id'];
    $p['price']       = (float)$p['price'];
    $p['off_price']   = (float)$p['off_price'];
    $p['final_price'] = (float)$p['final_price'];
    $p['instock']     = (int)$p['instock'];
    $p['image']       = first_product_image($p['specification']);
    $p['spec']        = json_decode($p['specification'] ?? '{}', true) ?: [];
}
unset($p);

// Categories, Subcategories, Brands
$categories    = db_rows($conn, "SELECT * FROM category ORDER BY id ASC");
$subCategories = db_rows($conn, "SELECT sc.*, c.name AS category_name FROM sub_category sc LEFT JOIN category c ON c.id = sc.category_id ORDER BY sc.id ASC");
$brands        = db_rows($conn, "SELECT bc.*, sc.name AS sub_category_name FROM brand_category bc LEFT JOIN sub_category sc ON sc.id = bc.sub_category_id ORDER BY bc.id ASC");

// Inventories
$inventories = db_rows($conn, "SELECT * FROM inventories ORDER BY inv_position ASC");
foreach ($inventories as &$inv) {
    $inv['id']            = (int)$inv['id'];
    $inv['inv_position']  = (int)$inv['inv_position'];
    $inv['show_ads_next'] = (bool)$inv['show_ads_next'];
    $inv['assigned_products'] = db_rows(
        $conn,
        "SELECT p.id, p.product_name, p.final_price FROM product_inventories pi JOIN products p ON p.id = pi.product_id WHERE pi.inventory_id = ?",
        'i',
        [$inv['id']]
    );
}
unset($inv);

// Homepage Promo Ad Banners
$homePromoAds = db_rows($conn, "SELECT * FROM home_promo_ads ORDER BY sort_order ASC, id ASC");
foreach ($homePromoAds as &$ad) {
    $ad['id']         = (int)$ad['id'];
    $ad['sort_order'] = (int)$ad['sort_order'];
    $ad['is_active']  = (bool)$ad['is_active'];
}
unset($ad);

// Personal Store Gift Cards
$giftCards = db_rows($conn, "SELECT * FROM gift_cards ORDER BY id DESC LIMIT 100");
foreach ($giftCards as &$gc) {
    $gc['id']                = (int)$gc['id'];
    $gc['amount_usd']        = (float)$gc['amount_usd'];
    $gc['initial_balance']   = (float)$gc['initial_balance'];
    $gc['remaining_balance'] = (float)$gc['remaining_balance'];
}
unset($gc);

// Blogs
$blogs = db_rows($conn, "SELECT * FROM blog_posts ORDER BY id DESC");

// Books
$books = db_rows($conn, "SELECT * FROM books ORDER BY id DESC");
foreach ($books as &$bk) {
    $bk['id']                    = (int)$bk['id'];
    $bk['views']                 = (int)$bk['views'];
    $bk['is_monetized']          = (bool)($bk['is_monetized'] ?? true);
    $bk['price']                 = round((float)($bk['price'] ?? 0), 2);
    $bk['compare_price']         = round((float)($bk['compare_price'] ?? 0), 2);
    $bk['free_preview_chapters'] = (int)($bk['free_preview_chapters'] ?? 1);
    $bk['sales_count']           = (int)($bk['sales_count'] ?? 0);
    $bk['writer_earnings']       = round((float)($bk['writer_earnings'] ?? 0), 2);
    $bk['chapters']              = db_rows($conn, "SELECT id, chapter_no, title, content FROM book_chapters WHERE book_id = ? ORDER BY chapter_no ASC", 'i', [$bk['id']]);
}
unset($bk);

// Contact Messages & Info
$messages    = db_rows($conn, "SELECT * FROM contact_messages ORDER BY created_at DESC LIMIT 100");
$contactInfo = db_rows($conn, "SELECT * FROM contact_info ORDER BY sort_order ASC, id ASC");

// Settings, Currencies & Site Pages
$rawSettings = db_rows($conn, "SELECT setting_key, setting_value FROM site_settings");
$settingsMap = [];
foreach ($rawSettings as $rs) {
    $settingsMap[$rs['setting_key']] = $rs['setting_value'];
}
$currencies = db_rows($conn, "SELECT * FROM currencies ORDER BY is_default DESC, code ASC");
$sitePages  = db_rows($conn, "SELECT * FROM site_pages ORDER BY page ASC, sort_order ASC");

json_out([
    'ok'       => true,
    'stats'    => [
        'revenue'                 => round((float)($revRow['rev'] ?? 0), 2),
        'orders'                  => $nOrders,
        'sealed_awaiting_release' => $nSealedAwaiting,
        'users'                   => $nUsers,
        'vendors'                 => $nVendors,
        'verified_vendors'        => $nVerifiedVendors,
        'pending_verifications'   => $nPendingVerif,
        'active_domain_stores'    => $nActiveDomains,
        'company_charges_earned'  => round((float)($compChargesRow['total'] ?? 0), 2),
        'products'                => $nProds,
        'books'                   => $nBooks,
        'blogs'                   => $nBlogs,
        'unread_messages'         => $nMsgs,
        'active_gift_cards'       => $nGiftCards,
    ],
    'gateways'             => $gateways,
    'orders'               => $orders,
    'users'                => $users,
    'vendors'              => $vendors,
    'domain_subscriptions' => $domainSubscriptions,
    'wallet_transactions'  => $walletTransactions,
    'push_notifications'   => $pushNotifications,
    'products'             => $products,
    'categories'           => $categories,
    'sub_categories'       => $subCategories,
    'brands'               => $brands,
    'inventories'          => $inventories,
    'home_promo_ads'       => $homePromoAds,
    'gift_cards'           => $giftCards,
    'blogs'                => $blogs,
    'books'                => $books,
    'messages'             => $messages,
    'contact_info'         => $contactInfo,
    'settings'             => $settingsMap,
    'currencies'           => $currencies,
    'site_pages'           => $sitePages,
]);



