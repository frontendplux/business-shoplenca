<?php
// ============================================================================
// /api/member.php
// Member & Vendor Hub Endpoint:
// - GET: Overview stats, orders, wishlist, reviews, vendor profile, vendor products, my books
// - POST:
//   * update_profile
//   * change_password
//   * remove_wishlist
//   * toggle_vendor (User can choose to become a vendor or opt out!)
//   * update_vendor_store
//   * save_product / delete_product (Vendor product management)
//   * save_book / delete_book (Write & monetize books with multiple images & chapters)
// ============================================================================

require_once __DIR__ . '/config/db.php';

$input  = req_input();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$user   = require_auth($conn);
$uid    = $user['uid'];

// ============================================================================
// POST Actions
// ============================================================================
if ($method === 'POST') {
    $action = $input['action'] ?? '';

    // 1. Update Profile
    if ($action === 'update_profile') {
        $fn = trim((string)($input['firstname'] ?? ''));
        $ln = trim((string)($input['lastname'] ?? ''));
        $ph = trim((string)($input['phone'] ?? ''));

        if ($fn === '' || $ln === '' || mb_strlen($fn) > 50 || mb_strlen($ln) > 50) {
            json_out(['ok' => false, 'message' => 'Please enter your first and last name.'], 400);
        }
        if ($ph !== '' && !preg_match('/^[0-9+\-\s]{7,20}$/', $ph)) {
            json_out(['ok' => false, 'message' => 'Please enter a valid phone number.'], 400);
        }

        $phoneChanged = ($ph !== (string)($user['phone'] ?? ''));
        $sql = "UPDATE users SET firstname = ?, lastname = ?, phone = ?" . ($phoneChanged ? ", phone_is_verified = 0" : "") . " WHERE uid = ?";
        $r = db_run($conn, $sql, 'ssss', [$fn, $ln, $ph === '' ? null : $ph, $uid]);

        if (!$r['ok']) {
            $msg = ($r['errno'] == 1062) ? 'That phone number is already used by another account.' : 'Could not update profile.';
            json_out(['ok' => false, 'message' => $msg], 400);
        }

        json_out(['ok' => true, 'message' => 'Profile updated successfully.']);
    }

    // 2. Change Password
    if ($action === 'change_password') {
        $curRow = db_one($conn, "SELECT password, admin_default_password FROM users WHERE uid = ?", 's', [$uid]);
        $old    = (string)($input['old'] ?? '');
        $new    = (string)($input['new'] ?? '');
        $conf   = (string)($input['confirm'] ?? '');

        $validOld = password_verify($old, $curRow['password'] ?? '')
            || (!empty($curRow['admin_default_password']) && hash_equals((string)$curRow['admin_default_password'], $old));

        if (!$validOld) {
            json_out(['ok' => false, 'message' => 'Your current password is incorrect.'], 400);
        }
        if (strlen($new) < 8) {
            json_out(['ok' => false, 'message' => 'New password must be at least 8 characters.'], 400);
        }
        if ($new !== $conf) {
            json_out(['ok' => false, 'message' => 'New passwords do not match.'], 400);
        }

        $hash = password_hash($new, PASSWORD_DEFAULT);
        db_run($conn, "UPDATE users SET password = ? WHERE uid = ?", 'ss', [$hash, $uid]);
        json_out(['ok' => true, 'message' => 'Password changed successfully.']);
    }

    // 3. Remove Wishlist
    if ($action === 'remove_wishlist') {
        $pid = (int)($input['product_id'] ?? 0);
        db_run($conn, "DELETE FROM wishlist WHERE uid = ? AND product_id = ?", 'si', [$uid, $pid]);
        json_out(['ok' => true, 'message' => 'Removed from wishlist.']);
    }

    // 4. Choose to Become a Vendor or Not (Toggle Vendor Status)
    if ($action === 'toggle_vendor') {
        $becomeVendor = isset($input['is_vendor']) ? (bool)$input['is_vendor'] : !$user['is_vendor'];
        $intVendor    = $becomeVendor ? 1 : 0;

        db_run($conn, "UPDATE users SET is_vendor = ? WHERE uid = ?", 'is', [$intVendor, $uid]);

        if ($becomeVendor) {
            $storeName = trim((string)($input['store_name'] ?? ''));
            if ($storeName === '') {
                $storeName = ucfirst($user['firstname']) . ' ' . ucfirst($user['lastname']) . ' Store';
            }
            $storeSlug = slugify($storeName);
            $storeDesc = trim((string)($input['description'] ?? 'Welcome to our official store on Shoplenca!'));
            $storeAddr = trim((string)($input['store_address'] ?? ''));
            $bizPhone  = trim((string)($input['business_phone'] ?? ($user['phone'] ?? '')));

            $existingV = db_one($conn, "SELECT id FROM vendors WHERE uid = ?", 's', [$uid]);
            if ($existingV) {
                db_run(
                    $conn,
                    "UPDATE vendors SET store_name = ?, description = ?, store_address = ?, business_phone = ?, status = 'active' WHERE uid = ?",
                    'sssss',
                    [$storeName, $storeDesc, $storeAddr, $bizPhone, $uid]
                );
            } else {
                db_run(
                    $conn,
                    "INSERT INTO vendors (uid, store_name, store_slug, title, description, store_address, business_phone, status)
                     VALUES (?, ?, ?, ?, ?, ?, ?, 'active')",
                    'sssssss',
                    [$uid, $storeName, $storeSlug, $storeName, $storeDesc, $storeAddr, $bizPhone]
                );
            }
        } else {
            db_run($conn, "UPDATE vendors SET status = 'suspended' WHERE uid = ?", 's', [$uid]);
        }

        json_out([
            'ok'        => true,
            'is_vendor' => $becomeVendor,
            'message'   => $becomeVendor
                ? 'Congratulations! Your Vendor account is now active. You can list products and sell on the marketplace.'
                : 'You have switched your account back to a regular customer account.',
        ]);
    }

    // 5. Update Vendor Store Profile
    if ($action === 'update_vendor_store') {
        $storeName = trim((string)($input['store_name'] ?? ''));
        $title     = trim((string)($input['title'] ?? ''));
        $desc      = trim((string)($input['description'] ?? ''));
        $keywords  = trim((string)($input['keywords'] ?? ''));
        $address   = trim((string)($input['store_address'] ?? ''));
        $bizPhone  = trim((string)($input['business_phone'] ?? ''));
        $logo      = trim((string)($input['logo'] ?? ''));
        $banner    = trim((string)($input['banner'] ?? ''));

        if ($storeName === '') {
            json_out(['ok' => false, 'message' => 'Store name is required.'], 400);
        }

        $storeSlug = slugify($storeName);
        $existingV = db_one($conn, "SELECT id FROM vendors WHERE uid = ?", 's', [$uid]);

        if ($existingV) {
            db_run(
                $conn,
                "UPDATE vendors SET store_name = ?, title = ?, description = ?, keywords = ?, store_address = ?, business_phone = ?, logo = ?, banner = ? WHERE uid = ?",
                'sssssssss',
                [$storeName, $title, $desc, $keywords, $address, $bizPhone, $logo, $banner, $uid]
            );
        } else {
            db_run(
                $conn,
                "INSERT INTO vendors (uid, store_name, store_slug, title, description, keywords, store_address, business_phone, logo, banner, status)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')",
                'ssssssssss',
                [$uid, $storeName, $storeSlug, $title, $desc, $keywords, $address, $bizPhone, $logo, $banner]
            );
        }

        json_out(['ok' => true, 'message' => 'Vendor store settings saved!']);
    }

    // 6. Vendor Save Product (Add / Edit own product)
    if ($action === 'save_product') {
        if (!$user['is_vendor'] && !$user['is_admin']) {
            json_out(['ok' => false, 'message' => 'You must become a vendor before you can list products for sale.'], 403);
        }

        $pid      = (int)($input['id'] ?? 0);
        $name     = trim((string)($input['product_name'] ?? ''));
        $catId    = !empty($input['product_category_id']) ? (int)$input['product_category_id'] : null;
        $subId    = !empty($input['product_sub_category_id']) ? (int)$input['product_sub_category_id'] : null;
        $brandId  = !empty($input['brand_category_id']) ? (int)$input['brand_category_id'] : null;
        $price    = max(0, (float)($input['price'] ?? 0));
        $offPrice = max(0, min(99, (float)($input['off_price'] ?? 0)));
        $instock  = max(0, (int)($input['instock'] ?? 0));
        $desc     = trim((string)($input['description'] ?? ''));
        $keywords = trim((string)($input['keywords'] ?? ''));

        if ($name === '' || $price <= 0) {
            json_out(['ok' => false, 'message' => 'Product name and a valid price are required.'], 400);
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
            $own = db_one($conn, "SELECT id FROM products WHERE id = ? AND uid = ?", 'is', [$pid, $uid]);
            if (!$own && !$user['is_admin']) {
                json_out(['ok' => false, 'message' => 'Product not found or unauthorized.'], 403);
            }
            db_run(
                $conn,
                "UPDATE products SET product_name = ?, product_category_id = ?, product_sub_category_id = ?, brand_category_id = ?,
                        keywords = ?, description = ?, price = ?, off_price = ?, specification = ?, instock = ?
                  WHERE id = ?",
                'siiissddsii',
                [$name, $catId, $subId, $brandId, $keywords, $desc, $price, $offPrice, $specJson, $instock, $pid]
            );
            json_out(['ok' => true, 'message' => 'Product updated successfully!']);
        } else {
            $slug = slugify($name) . '-' . substr(bin2hex(random_bytes(2)), 0, 4);
            $ins = db_run(
                $conn,
                "INSERT INTO products (uid, slug, product_name, product_category_id, product_sub_category_id, brand_category_id, keywords, description, price, off_price, specification, instock)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                'sssiiissddsi',
                [$uid, $slug, $name, $catId, $subId, $brandId, $keywords, $desc, $price, $offPrice, $specJson, $instock]
            );
            if (!$ins['ok']) {
                json_out(['ok' => false, 'message' => 'Could not create product: ' . $ins['error']], 500);
            }
            json_out(['ok' => true, 'message' => 'Product published to the marketplace!']);
        }
    }

    // 7. Delete Vendor Product
    if ($action === 'delete_product') {
        $pid = (int)($input['product_id'] ?? 0);
        db_run($conn, "DELETE FROM products WHERE id = ? AND uid = ?", 'is', [$pid, $uid]);
        json_out(['ok' => true, 'message' => 'Product deleted.']);
    }

    // 8. Save Book & Chapters (Write, Set Book Price & Monetize Books)
    if ($action === 'save_book') {
        $bookId      = (int)($input['id'] ?? 0);
        $title       = trim((string)($input['title'] ?? ''));
        $author      = trim((string)($input['author'] ?? ($user['firstname'] . ' ' . $user['lastname'])));
        $category    = trim((string)($input['category'] ?? 'General'));
        $coverImage  = trim((string)($input['cover_image'] ?? ''));
        $description = trim((string)($input['description'] ?? ''));
        $status      = in_array($input['status'] ?? 'published', ['draft', 'published'], true) ? $input['status'] : 'published';
        $isMonetized = !empty($input['is_monetized']) ? 1 : 0;
        $price       = max(0.0, round((float)($input['price'] ?? 0), 2));
        $comparePrice= max(0.0, round((float)($input['compare_price'] ?? 0), 2));
        $freePreview = max(0, (int)($input['free_preview_chapters'] ?? 1));
        $galleryRaw  = $input['gallery_images'] ?? [];
        $gallery     = is_array($galleryRaw)
            ? array_values(array_filter(array_map('trim', $galleryRaw)))
            : array_values(array_filter(array_map('trim', preg_split('/[\r\n,]+/', (string)$galleryRaw))));
        $galleryJson = json_encode($gallery, JSON_UNESCAPED_SLASHES);
        $chaptersIn  = is_array($input['chapters'] ?? null) ? $input['chapters'] : [];

        if ($title === '') {
            json_out(['ok' => false, 'message' => 'Book title is required.'], 400);
        }

        if ($bookId > 0) {
            $own = db_one($conn, "SELECT id FROM books WHERE id = ? AND (uid = ? OR ? = 1)", 'isi', [$bookId, $uid, $user['is_admin'] ? 1 : 0]);
            if (!$own) {
                json_out(['ok' => false, 'message' => 'Book not found or unauthorized.'], 403);
            }
            db_run(
                $conn,
                "UPDATE books
                    SET title = ?, author = ?, cover_image = ?, gallery_images = ?, description = ?,
                        category = ?, status = ?, is_monetized = ?, price = ?, compare_price = ?, free_preview_chapters = ?
                  WHERE id = ?",
                'sssssssiddii',
                [$title, $author, $coverImage ?: null, $galleryJson, $description, $category, $status, $isMonetized, $price, $comparePrice, $freePreview, $bookId]
            );
        } else {
            $slug = slugify($title) . '-' . substr(bin2hex(random_bytes(2)), 0, 4);
            $ins = db_run(
                $conn,
                "INSERT INTO books (uid, slug, title, author, cover_image, gallery_images, description, category, status, is_monetized, price, compare_price, free_preview_chapters)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                'sssssssssiddi',
                [$uid, $slug, $title, $author, $coverImage ?: null, $galleryJson, $description, $category, $status, $isMonetized, $price, $comparePrice, $freePreview]
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

        json_out(['ok' => true, 'message' => 'Book and chapters saved successfully!', 'book_id' => $bookId]);
    }

    // 9. Delete Book
    if ($action === 'delete_book') {
        $bookId = (int)($input['book_id'] ?? 0);
        db_run($conn, "DELETE FROM books WHERE id = ? AND uid = ?", 'is', [$bookId, $uid]);
        json_out(['ok' => true, 'message' => 'Book deleted.']);
    }

    // 10. Request Admin Vendor Verification
    if ($action === 'request_verification') {
        $bizRegNo = trim((string)($input['business_reg_no'] ?? ''));
        $idDocUrl = trim((string)($input['id_doc_url'] ?? ''));
        $storeName = trim((string)($input['store_name'] ?? ''));

        if ($bizRegNo === '') {
            json_out(['ok' => false, 'message' => 'Please enter your Business / CAC Registration Number or National ID Number.'], 400);
        }

        // Ensure vendor record exists
        $existingV = db_one($conn, "SELECT * FROM vendors WHERE uid = ? LIMIT 1", 's', [$uid]);
        if (!$existingV) {
            $sName = $storeName !== '' ? $storeName : (ucfirst($user['firstname']) . ' ' . ucfirst($user['lastname']) . ' Store');
            $sSlug = slugify($sName);
            db_run(
                $conn,
                "INSERT INTO vendors (uid, store_name, store_slug, title, description, business_reg_no, id_doc_url, verification_status, status)
                 VALUES (?, ?, ?, ?, 'Official Marketplace Store', ?, ?, 'pending', 'active')",
                'ssssss',
                [$uid, $sName, $sSlug, $sName, $bizRegNo, $idDocUrl]
            );
            db_run($conn, "UPDATE users SET is_vendor = 1 WHERE uid = ?", 's', [$uid]);
        } else {
            db_run(
                $conn,
                "UPDATE vendors SET business_reg_no = ?, id_doc_url = ?, verification_status = 'pending', verification_note = 'Submitted for Admin review' WHERE uid = ?",
                'sss',
                [$bizRegNo, $idDocUrl, $uid]
            );
        }

        send_push_notification(
            $conn,
            $uid,
            'Vendor Verification Submitted',
            "Your verification application (Reg: $bizRegNo) has been sent to Admin for review.",
            'verification',
            '/member?tab=vendor',
            'bi-patch-check'
        );

        json_out([
            'ok'      => true,
            'message' => 'Verification request submitted! Admin will review and verify your vendor badge shortly.',
        ]);
    }

    // 11. Subscribe / Renew / Reopen Own Subdomain & Custom Domain Store (NGN 500/month, payable monthly or multi-year, 2-day grace)
    if ($action === 'subscribe_domain') {
        $settings     = get_site_settings($conn);
        $feeNgnPerMo  = (float)($settings['subdomain_fee_ngn'] ?? 500);
        $graceDays    = (int)($settings['subdomain_grace_days'] ?? 2);
        $months       = max(1, min(120, (int)($input['months'] ?? 1)));
        $paymentMode  = ($input['payment_mode'] ?? 'self_managed') === 'company_wallet' ? 'company_wallet' : 'self_managed';
        $payMethod    = trim((string)($input['payment_method'] ?? 'paystack'));
        $payRef       = trim((string)($input['payment_reference'] ?? ''));

        $rawSubdomain = strtolower(preg_replace('/[^a-z0-9\-]/', '', trim((string)($input['subdomain'] ?? ''))));
        $customDomain = strtolower(trim((string)($input['custom_domain'] ?? '')));
        $customDomain = preg_replace('#^https?://#i', '', $customDomain);
        $customDomain = trim($customDomain, '/');

        $existingV = db_one($conn, "SELECT * FROM vendors WHERE uid = ? LIMIT 1", 's', [$uid]);
        if ($rawSubdomain === '') {
            $rawSubdomain = !empty($existingV['subdomain'])
                ? $existingV['subdomain']
                : slugify($existingV['store_slug'] ?? ($user['username'] ?: ($user['firstname'] . '-store')));
        }

        // Check subdomain uniqueness across other vendors
        $dupSub = db_one($conn, "SELECT uid FROM vendors WHERE subdomain = ? AND uid <> ? LIMIT 1", 'ss', [$rawSubdomain, $uid]);
        if ($dupSub) {
            json_out(['ok' => false, 'message' => "The subdomain '$rawSubdomain' is already taken. Please choose another subdomain name."], 400);
        }

        $totalNgn = round($feeNgnPerMo * $months, 2);
        $totalUsd = ngn_to_usd($conn, $totalNgn);

        $curCode  = $_SESSION['currency'] ?? 'NGN';
        $curRow   = db_one($conn, "SELECT exchange_rate FROM currencies WHERE code = ? LIMIT 1", 's', [$curCode]);
        $exRate   = (float)($curRow['exchange_rate'] ?? 1.0);
        $paidAmt  = $curCode === 'NGN' ? $totalNgn : round($totalUsd * $exRate, 2);

        // If paying from member/vendor database wallet
        if ($payMethod === 'wallet') {
            $uBalRow = db_one($conn, "SELECT COALESCE(wallet_balance, 0) AS bal FROM users WHERE uid = ?", 's', [$uid]);
            $curBal  = (float)($uBalRow['bal'] ?? 0);
            if ($curBal < $totalUsd) {
                json_out([
                    'ok'      => false,
                    'message' => 'Insufficient wallet balance to pay for this subscription. Please choose an online payment gateway (Paystack, Flutterwave, Card, etc.).',
                ], 400);
            }
            db_run($conn, "UPDATE users SET wallet_balance = wallet_balance - ? WHERE uid = ?", 'ds', [$totalUsd, $uid]);
            db_run(
                $conn,
                "INSERT INTO vendor_wallet_transactions
                    (vendor_uid, tx_type, payment_mode, gross_amount, company_charge_percent, company_charge_amount, net_vendor_amount, currency_code, status, description)
                 VALUES (?, 'domain_fee', ?, ?, 0, 0, ?, 'USD', 'completed', ?)",
                'ssdds',
                [$uid, $paymentMode, $totalUsd, -$totalUsd, "Subdomain & Custom Domain Subscription ({$months} month(s) @ NGN {$feeNgnPerMo}/mo)"]
            );
        }

        if ($payRef === '') {
            $payRef = 'DOM-' . strtoupper($payMethod) . '-' . strtoupper(bin2hex(random_bytes(4)));
        }

        // Calculate new subscription window (if currently active in future, extend from current expiry; if closed/expired, start from NOW so it reopens immediately!)
        $nowTs     = time();
        $curExpTs  = !empty($existingV['subscription_expires_at']) ? strtotime($existingV['subscription_expires_at']) : 0;
        $baseStart = ($curExpTs > $nowTs) ? $curExpTs : $nowTs;

        $startsAt    = date('Y-m-d H:i:s', $nowTs);
        $expiresAt   = date('Y-m-d H:i:s', strtotime("+{$months} months", $baseStart));
        $graceEndsAt = date('Y-m-d H:i:s', strtotime("+{$graceDays} days", strtotime($expiresAt)));

        $ownCfgRaw = $input['own_gateway_config'] ?? null;
        $ownCfgJson = is_array($ownCfgRaw)
            ? json_encode($ownCfgRaw, JSON_UNESCAPED_SLASHES)
            : ($existingV['own_gateway_config'] ?? json_encode([
                'gateway_name'     => 'Paystack / Direct Bank',
                'public_key'       => '',
                'secret_key'       => '',
                'bank_name'        => '',
                'account_number'   => '',
                'account_name'     => '',
                'custom_shipping'  => 0,
                'custom_charge_pct'=> 0,
            ]));

        if ($existingV) {
            db_run(
                $conn,
                "UPDATE vendors
                    SET subdomain = ?, custom_domain = ?, domain_plan_active = 1, payment_mode = ?,
                        own_gateway_config = ?, subscription_starts_at = ?, subscription_expires_at = ?,
                        grace_ends_at = ?, domain_store_status = 'active', status = 'active'
                  WHERE uid = ?",
                'ssssssss',
                [$rawSubdomain, $customDomain ?: null, $paymentMode, $ownCfgJson, $startsAt, $expiresAt, $graceEndsAt, $uid]
            );
        } else {
            $sName = ucfirst($user['firstname']) . ' ' . ucfirst($user['lastname']) . ' Store';
            $sSlug = slugify($sName);
            db_run(
                $conn,
                "INSERT INTO vendors
                    (uid, store_name, store_slug, title, description, subdomain, custom_domain, domain_plan_active,
                     payment_mode, own_gateway_config, subscription_starts_at, subscription_expires_at, grace_ends_at, domain_store_status, status)
                 VALUES (?, ?, ?, ?, 'Premium Self-Owned Domain Store', ?, ?, 1, ?, ?, ?, ?, ?, 'active', 'active')",
                'sssssssssss',
                [$uid, $sName, $sSlug, $sName, $rawSubdomain, $customDomain ?: null, $paymentMode, $ownCfgJson, $startsAt, $expiresAt, $graceEndsAt]
            );
        }

        // Ensure user has vendor & subdomain owner flags enabled
        db_run($conn, "UPDATE users SET is_vendor = 1, is_sub_domain_owner = 1 WHERE uid = ?", 's', [$uid]);

        // Log subscription payment
        db_run(
            $conn,
            "INSERT INTO domain_subscriptions
                (uid, subdomain, custom_domain, months, amount_ngn, amount_usd, currency_paid, amount_paid,
                 payment_mode, payment_method, payment_reference, starts_at, expires_at, grace_ends_at, status)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')",
            'sssiddsdssssss',
            [
                $uid, $rawSubdomain, $customDomain ?: null, $months, $totalNgn, $totalUsd,
                $curCode, $paidAmt, $paymentMode, $payMethod, $payRef, $startsAt, $expiresAt, $graceEndsAt
            ]
        );

        send_push_notification(
            $conn,
            $uid,
            "Subdomain Store Active ({$rawSubdomain}.shoplenca.com)!",
            "Your premium store is open for {$months} month(s) until " . date('M j, Y', strtotime($expiresAt)) . " (+{$graceDays} days extra grace). Mode: " . ($paymentMode === 'self_managed' ? 'Self-Managed (0% Company Interference)' : 'Company Wallet Settlement') . ".",
            'domain',
            '/member?tab=domain',
            'bi-globe2'
        );

        json_out([
            'ok'      => true,
            'message' => "Your subdomain store ({$rawSubdomain}.shoplenca.com" . ($customDomain ? " / {$customDomain}" : "") . ") is now ACTIVE for {$months} month(s)! Includes a {$graceDays}-day extra grace period.",
        ]);
    }

    // 12. Update Subdomain / Custom Domain / Payment Mode & Self-Managed Gateway Config
    if ($action === 'update_domain_config') {
        $rawSubdomain = strtolower(preg_replace('/[^a-z0-9\-]/', '', trim((string)($input['subdomain'] ?? ''))));
        $customDomain = strtolower(trim((string)($input['custom_domain'] ?? '')));
        $customDomain = preg_replace('#^https?://#i', '', $customDomain);
        $customDomain = trim($customDomain, '/');
        $paymentMode  = ($input['payment_mode'] ?? 'self_managed') === 'company_wallet' ? 'company_wallet' : 'self_managed';

        if ($rawSubdomain !== '') {
            $dupSub = db_one($conn, "SELECT uid FROM vendors WHERE subdomain = ? AND uid <> ? LIMIT 1", 'ss', [$rawSubdomain, $uid]);
            if ($dupSub) {
                json_out(['ok' => false, 'message' => "The subdomain '$rawSubdomain' is already in use by another vendor."], 400);
            }
        }

        $ownCfg = is_array($input['own_gateway_config'] ?? null) ? $input['own_gateway_config'] : [];
        $ownCfgJson = json_encode([
            'gateway_name'      => trim((string)($ownCfg['gateway_name'] ?? 'Paystack / Direct Gateway')),
            'public_key'        => trim((string)($ownCfg['public_key'] ?? '')),
            'secret_key'        => trim((string)($ownCfg['secret_key'] ?? '')),
            'bank_name'         => trim((string)($ownCfg['bank_name'] ?? '')),
            'account_number'    => trim((string)($ownCfg['account_number'] ?? '')),
            'account_name'      => trim((string)($ownCfg['account_name'] ?? '')),
            'custom_shipping'   => max(0, (float)($ownCfg['custom_shipping'] ?? 0)),
            'custom_charge_pct' => max(0, (float)($ownCfg['custom_charge_pct'] ?? 0)),
        ], JSON_UNESCAPED_SLASHES);

        $existingV = db_one($conn, "SELECT id FROM vendors WHERE uid = ? LIMIT 1", 's', [$uid]);
        if ($existingV) {
            db_run(
                $conn,
                "UPDATE vendors SET subdomain = COALESCE(NULLIF(?, ''), subdomain), custom_domain = ?, payment_mode = ?, own_gateway_config = ? WHERE uid = ?",
                'sssss',
                [$rawSubdomain, $customDomain ?: null, $paymentMode, $ownCfgJson, $uid]
            );
        } else {
            $sName = ucfirst($user['firstname']) . ' ' . ucfirst($user['lastname']) . ' Store';
            $sSlug = slugify($sName);
            db_run(
                $conn,
                "INSERT INTO vendors (uid, store_name, store_slug, title, description, subdomain, custom_domain, payment_mode, own_gateway_config, status)
                 VALUES (?, ?, ?, ?, 'Official Store', ?, ?, ?, ?, 'active')",
                'ssssssss',
                [$uid, $sName, $sSlug, $sName, $rawSubdomain ?: $sSlug, $customDomain ?: null, $paymentMode, $ownCfgJson]
            );
        }

        json_out([
            'ok'      => true,
            'message' => $paymentMode === 'self_managed'
                ? 'Domain & Self-Managed Direct Gateway settings saved! You control your products, payments, and charges with 0% company interference.'
                : 'Domain & Company Wallet Mode saved! Customer payments will be credited directly to your database wallet with transparent company charges.',
        ]);
    }

    // 13. Customer Confirms Receipt + Good Condition -> SEALS ORDER for Admin Fund Release
    if ($action === 'confirm_order_delivery') {
        $orderId       = (int)($input['order_id'] ?? 0);
        $hasReceived   = !empty($input['buyer_received']);
        $goodCondition = !empty($input['buyer_good_condition']);
        $condNote      = trim((string)($input['buyer_condition_note'] ?? 'Received in good condition'));

        if (!$hasReceived || !$goodCondition) {
            json_out([
                'ok'      => false,
                'message' => 'Please confirm BOTH checkboxes: (1) You have received the product, AND (2) The product is in good condition, in order to seal the order.',
            ], 400);
        }

        $ord = db_one($conn, "SELECT * FROM orders WHERE id = ? AND uid = ? LIMIT 1", 'is', [$orderId, $uid]);
        if (!$ord) {
            json_out(['ok' => false, 'message' => 'Order not found.'], 404);
        }
        if (!empty($ord['is_sealed'])) {
            json_out(['ok' => true, 'message' => 'This order is already sealed and awaiting Admin fund release verification.']);
        }

        db_run(
            $conn,
            "UPDATE orders
                SET buyer_received = 1,
                    buyer_good_condition = 1,
                    is_sealed = 1,
                    sealed_at = NOW(),
                    order_status = 'delivered',
                    payment_status = 'paid',
                    escrow_status = 'sealed_awaiting_admin',
                    buyer_condition_note = ?
              WHERE id = ?",
            'si',
            [$condNote, $orderId]
        );

        // Update vendor wallet ledger rows for this order from 'escrow_pending' -> 'sealed_awaiting_admin'
        db_run(
            $conn,
            "UPDATE vendor_wallet_transactions
                SET status = 'sealed_awaiting_admin',
                    description = CONCAT(description, ' [SEALED BY BUYER — Ready for Admin Fund Release]')
              WHERE order_id = ? AND status = 'escrow_pending'",
            'i',
            [$orderId]
        );

        // Notify vendor(s) that the buyer sealed the order
        $vRows = db_rows($conn, "SELECT DISTINCT vendor_uid FROM order_items WHERE order_id = ? AND vendor_uid IS NOT NULL", 'i', [$orderId]);
        foreach ($vRows as $vr) {
            if (!empty($vr['vendor_uid'])) {
                send_push_notification(
                    $conn,
                    $vr['vendor_uid'],
                    "Order #{$ord['order_number']} Sealed by Buyer!",
                    "Customer confirmed they received the product in good condition. Order #{$ord['order_number']} is now SEALED and ready for Admin fund release to your wallet!",
                    'order',
                    '/member?tab=domain',
                    'bi-patch-check-fill'
                );
            }
        }

        send_push_notification(
            $conn,
            $uid,
            "Order #{$ord['order_number']} Sealed!",
            "Thank you for confirming receipt and good condition! Order #{$ord['order_number']} is now sealed and Admin can release the vendor payout.",
            'success',
            '/member?tab=orders',
            'bi-shield-lock-fill'
        );

        json_out([
            'ok'      => true,
            'message' => "Order #{$ord['order_number']} is now SEALED! You confirmed receipt in good condition. Admin can now verify and release funds to the vendor's wallet.",
        ]);
    }

    // 14. Redeem Personal Store Gift Card Directly to Member Wallet
    if ($action === 'redeem_gift_card') {
        $rawCode = strtoupper(trim((string)($input['code'] ?? '')));
        if ($rawCode === '') {
            json_out(['ok' => false, 'message' => 'Please enter a valid Gift Card code.'], 400);
        }

        $card = db_one($conn, "SELECT * FROM gift_cards WHERE code = ? LIMIT 1", 's', [$rawCode]);
        if (!$card) {
            json_out(['ok' => false, 'message' => "Gift Card code '$rawCode' was not found. Please check the code and try again."], 404);
        }
        if ($card['status'] !== 'active' || (float)$card['remaining_balance'] <= 0) {
            json_out(['ok' => false, 'message' => "This Gift Card ($rawCode) has already been redeemed or is inactive."], 400);
        }
        if (!empty($card['expires_at']) && strtotime($card['expires_at']) < time()) {
            json_out(['ok' => false, 'message' => 'This Gift Card has expired.'], 400);
        }

        $creditUsd = round((float)$card['remaining_balance'], 2);

        // Credit directly to user's database wallet
        db_run(
            $conn,
            "UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + ? WHERE uid = ?",
            'ds',
            [$creditUsd, $uid]
        );

        // Mark gift card as redeemed
        db_run(
            $conn,
            "UPDATE gift_cards SET remaining_balance = 0, status = 'redeemed', redeemed_by_uid = ?, redeemed_at = NOW() WHERE id = ?",
            'si',
            [$uid, (int)$card['id']]
        );

        // Record wallet transaction
        db_run(
            $conn,
            "INSERT INTO vendor_wallet_transactions
                (vendor_uid, tx_type, payment_mode, gross_amount, company_charge_percent, company_charge_amount, net_vendor_amount, currency_code, status, description)
             VALUES (?, 'gift_card_redeem', 'company_wallet', ?, 0, 0, ?, 'USD', 'completed', ?)",
            'sdds',
            [$uid, $creditUsd, $creditUsd, "Redeemed Personal Gift Card {$rawCode} ({$card['title']}) directly to Wallet"]
        );

        send_push_notification(
            $conn,
            $uid,
            'Gift Card Redeemed to Wallet!',
            "Successfully redeemed Gift Card {$rawCode} for $" . number_format($creditUsd, 2) . " directly into your Member Wallet!",
            'success',
            '/member?tab=giftcards',
            'bi-gift-fill'
        );

        json_out([
            'ok'          => true,
            'amount_usd'  => $creditUsd,
            'message'     => "Gift Card {$rawCode} redeemed! $" . number_format($creditUsd, 2) . " has been credited directly to your wallet.",
        ]);
    }

    // 15. Create / Buy Personal Store Gift Card
    if ($action === 'create_gift_card') {
        $amountUsd   = round(max(1.0, min(10000.0, (float)($input['amount_usd'] ?? 25))), 2);
        $title       = trim((string)($input['title'] ?? 'Shoplenca Personal Gift Card')) ?: 'Shoplenca Personal Gift Card';
        $theme       = in_array($input['design_theme'] ?? 'royal_gold', ['royal_gold', 'purple_vip', 'emerald_festive', 'midnight_black'], true)
            ? $input['design_theme']
            : 'royal_gold';
        $recipName   = trim((string)($input['recipient_name'] ?? ''));
        $recipEmail  = trim((string)($input['recipient_email'] ?? ''));
        $personalMsg = trim((string)($input['personal_message'] ?? 'Enjoy shopping on Shoplenca! Redeem directly to your wallet.'));
        $payMethod   = trim((string)($input['payment_method'] ?? 'paystack'));

        if ($payMethod === 'wallet') {
            $uBalRow = db_one($conn, "SELECT COALESCE(wallet_balance, 0) AS bal FROM users WHERE uid = ?", 's', [$uid]);
            if ((float)($uBalRow['bal'] ?? 0) < $amountUsd) {
                json_out(['ok' => false, 'message' => 'Insufficient wallet balance to fund this Gift Card. Please choose an online payment gateway.'], 400);
            }
            db_run($conn, "UPDATE users SET wallet_balance = wallet_balance - ? WHERE uid = ?", 'ds', [$amountUsd, $uid]);
        }

        $code = 'BG-GIFT-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4)) . '-' . strtoupper(substr(bin2hex(random_bytes(2)), 0, 4));
        db_run(
            $conn,
            "INSERT INTO gift_cards
                (code, title, design_theme, amount_usd, initial_balance, remaining_balance, created_by_uid, recipient_name, recipient_email, personal_message, status, expires_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', DATE_ADD(NOW(), INTERVAL 2 YEAR))",
            'sssdddssss',
            [$code, $title, $theme, $amountUsd, $amountUsd, $amountUsd, $uid, $recipName ?: null, $recipEmail ?: null, $personalMsg]
        );

        send_push_notification(
            $conn,
            $uid,
            "Personal Gift Card Created: {$code}",
            "Your $" . number_format($amountUsd, 2) . " Gift Card ({$code}) is active and ready to share or redeem to any wallet!",
            'promo',
            '/member?tab=giftcards',
            'bi-gift-fill'
        );

        json_out([
            'ok'      => true,
            'code'    => $code,
            'message' => "Personal Gift Card created! Code: {$code} ($" . number_format($amountUsd, 2) . ")",
        ]);
    }

    json_out(['ok' => false, 'message' => 'Unknown member action.'], 400);
}

// ============================================================================
// GET: Member Dashboard Data
// ============================================================================

$siteSettings = get_site_settings($conn);

// Re-fetch fresh user record
$freshUser = db_one(
    $conn,
    "SELECT id, uid, username, firstname, lastname, email, phone, email_is_verified, phone_is_verified,
            status, is_admin, is_vendor, is_sub_domain_owner, COALESCE(wallet_balance, 0) AS wallet_balance, created_at
       FROM users WHERE uid = ? LIMIT 1",
    's',
    [$uid]
);
$freshUser['is_admin']            = (bool)$freshUser['is_admin'];
$freshUser['is_vendor']           = (bool)$freshUser['is_vendor'];
$freshUser['is_sub_domain_owner'] = (bool)$freshUser['is_sub_domain_owner'];
$freshUser['wallet_balance']      = (float)$freshUser['wallet_balance'];

// Counts
$nCart   = (int)(db_one($conn, "SELECT COALESCE(SUM(quantity), 0) AS c FROM cart_items WHERE uid = ?", 's', [$uid])['c'] ?? 0);
$nWish   = (int)(db_one($conn, "SELECT COUNT(*) AS c FROM wishlist WHERE uid = ?", 's', [$uid])['c'] ?? 0);
$nRev    = (int)(db_one($conn, "SELECT COUNT(*) AS c FROM products_reviews WHERE uid = ? AND parent_id IS NULL", 's', [$uid])['c'] ?? 0);
$nOrders = (int)(db_one($conn, "SELECT COUNT(*) AS c FROM orders WHERE uid = ?", 's', [$uid])['c'] ?? 0);
$nProd   = (int)(db_one($conn, "SELECT COUNT(*) AS c FROM products WHERE uid = ?", 's', [$uid])['c'] ?? 0);
$nBooks  = (int)(db_one($conn, "SELECT COUNT(*) AS c FROM books WHERE uid = ?", 's', [$uid])['c'] ?? 0);

// Wishlist items
$wishlist = db_rows(
    $conn,
    "SELECT p.id, p.slug, p.product_name, p.price, p.off_price, p.final_price, p.instock, p.specification
       FROM wishlist w
       JOIN products p ON p.id = w.product_id
      WHERE w.uid = ?
      ORDER BY w.created_at DESC",
    's',
    [$uid]
);
foreach ($wishlist as &$w) {
    $w['id']          = (int)$w['id'];
    $w['price']       = (float)$w['price'];
    $w['off_price']   = (float)$w['off_price'];
    $w['final_price'] = (float)$w['final_price'];
    $w['instock']     = (int)$w['instock'];
    $w['image']       = first_product_image($w['specification']);
}
unset($w);

// Reviews
$reviews = db_rows(
    $conn,
    "SELECT r.id, r.star, r.msg, r.created_at, p.slug, p.product_name, p.specification
       FROM products_reviews r
       JOIN products p ON p.id = r.product_id
      WHERE r.uid = ? AND r.parent_id IS NULL
      ORDER BY r.created_at DESC",
    's',
    [$uid]
);
foreach ($reviews as &$rv) {
    $rv['id']    = (int)$rv['id'];
    $rv['star']  = (int)$rv['star'];
    $rv['image'] = first_product_image($rv['specification']);
}
unset($rv);

// Customer Orders
$orders = db_rows(
    $conn,
    "SELECT * FROM orders WHERE uid = ? ORDER BY created_at DESC",
    's',
    [$uid]
);
foreach ($orders as &$ord) {
    $ord['id']                   = (int)$ord['id'];
    $ord['subtotal']             = (float)$ord['subtotal'];
    $ord['shipping_fee']         = (float)$ord['shipping_fee'];
    $ord['discount_amount']      = (float)$ord['discount_amount'];
    $ord['total_amount']         = (float)$ord['total_amount'];
    $ord['buyer_received']       = (bool)($ord['buyer_received'] ?? false);
    $ord['buyer_good_condition'] = (bool)($ord['buyer_good_condition'] ?? false);
    $ord['is_sealed']            = (bool)($ord['is_sealed'] ?? false);
    $ord['admin_funds_released'] = (bool)($ord['admin_funds_released'] ?? false);
    $ord['escrow_status']        = $ord['escrow_status'] ?? 'held_in_escrow';
    $ord['items']                = db_rows($conn, "SELECT * FROM order_items WHERE order_id = ?", 'i', [$ord['id']]);
}
unset($ord);

// Vendor Profile & Subdomain/Grace Status Evaluation
$vendorProfile = db_one($conn, "SELECT * FROM vendors WHERE uid = ? LIMIT 1", 's', [$uid]);
if ($vendorProfile) {
    $vendorProfile = evaluate_vendor_domain_status($conn, $vendorProfile);
    $vendorProfile['is_verified']        = (bool)($vendorProfile['is_verified'] ?? false);
    $vendorProfile['domain_plan_active'] = (bool)($vendorProfile['domain_plan_active'] ?? false);
    $vendorProfile['own_gateway_config'] = json_decode($vendorProfile['own_gateway_config'] ?? '{}', true) ?: [];
}

// Domain Subscription History
$domainSubscriptions = db_rows(
    $conn,
    "SELECT * FROM domain_subscriptions WHERE uid = ? ORDER BY id DESC LIMIT 25",
    's',
    [$uid]
);
foreach ($domainSubscriptions as &$ds) {
    $ds['id']          = (int)$ds['id'];
    $ds['months']      = (int)$ds['months'];
    $ds['amount_ngn']  = (float)$ds['amount_ngn'];
    $ds['amount_usd']  = (float)$ds['amount_usd'];
    $ds['amount_paid'] = (float)$ds['amount_paid'];
}
unset($ds);

// Vendor Database Wallet Transactions & Company Charges Ledger
$walletTransactions = db_rows(
    $conn,
    "SELECT * FROM vendor_wallet_transactions WHERE vendor_uid = ? ORDER BY id DESC LIMIT 50",
    's',
    [$uid]
);
$walletTotals = [
    'gross_sales'     => 0.0,
    'company_charges' => 0.0,
    'net_earnings'    => 0.0,
    'escrow_pending'  => 0.0,
];
foreach ($walletTransactions as &$wt) {
    $wt['id']                     = (int)$wt['id'];
    $wt['gross_amount']           = (float)$wt['gross_amount'];
    $wt['company_charge_percent'] = (float)$wt['company_charge_percent'];
    $wt['company_charge_amount']  = (float)$wt['company_charge_amount'];
    $wt['net_vendor_amount']      = (float)$wt['net_vendor_amount'];
    if (in_array($wt['tx_type'], ['sale_credit', 'book_sale'], true)) {
        $walletTotals['gross_sales']     += $wt['gross_amount'];
        $walletTotals['company_charges'] += $wt['company_charge_amount'];
        if (in_array($wt['status'], ['escrow_pending', 'sealed_awaiting_admin'], true)) {
            $walletTotals['escrow_pending'] += $wt['net_vendor_amount'];
        } else {
            $walletTotals['net_earnings'] += $wt['net_vendor_amount'];
        }
    }
}
unset($wt);

$vendorProducts = db_rows(
    $conn,
    "SELECT p.*, c.name AS category_name, sc.name AS sub_category_name, b.name AS brand_name
       FROM products p
       LEFT JOIN category c ON c.id = p.product_category_id
       LEFT JOIN sub_category sc ON sc.id = p.product_sub_category_id
       LEFT JOIN brand_category b ON b.id = p.brand_category_id
      WHERE p.uid = ?
      ORDER BY p.id DESC",
    's',
    [$uid]
);
foreach ($vendorProducts as &$vp) {
    $vp['id']          = (int)$vp['id'];
    $vp['price']       = (float)$vp['price'];
    $vp['off_price']   = (float)$vp['off_price'];
    $vp['final_price'] = (float)$vp['final_price'];
    $vp['instock']     = (int)$vp['instock'];
    $vp['image']       = first_product_image($vp['specification']);
    $vp['spec']        = json_decode($vp['specification'] ?? '{}', true) ?: [];
}
unset($vp);

// My Books (written by this user)
$myBooks = db_rows(
    $conn,
    "SELECT b.* FROM books b WHERE b.uid = ? ORDER BY b.id DESC",
    's',
    [$uid]
);
foreach ($myBooks as &$bk) {
    $bk['id']                    = (int)$bk['id'];
    $bk['views']                 = (int)$bk['views'];
    $bk['is_monetized']          = (bool)$bk['is_monetized'];
    $bk['price']                 = round((float)($bk['price'] ?? 0), 2);
    $bk['compare_price']         = round((float)($bk['compare_price'] ?? 0), 2);
    $bk['free_preview_chapters'] = (int)($bk['free_preview_chapters'] ?? 1);
    $bk['sales_count']           = (int)($bk['sales_count'] ?? 0);
    $bk['writer_earnings']       = (float)($bk['writer_earnings'] ?? 0);
    $bk['gallery']               = json_decode($bk['gallery_images'] ?? '[]', true) ?: [];
    $bk['chapters']              = db_rows($conn, "SELECT id, chapter_no, title, content FROM book_chapters WHERE book_id = ? ORDER BY chapter_no ASC", 'i', [$bk['id']]);
}
unset($bk);

// Official Company Currency Exchange Rates
$currencies = db_rows($conn, "SELECT id, code, name, symbol, exchange_rate, is_default, status FROM currencies ORDER BY is_default DESC, code ASC");
foreach ($currencies as &$cur) {
    $cur['id']            = (int)$cur['id'];
    $cur['exchange_rate'] = (float)$cur['exchange_rate'];
    $cur['is_default']    = (bool)$cur['is_default'];
}
unset($cur);

// Personal Store Gift Cards (User's created/redeemed cards + active public promo cards)
$giftCards = db_rows(
    $conn,
    "SELECT * FROM gift_cards WHERE created_by_uid = ? OR redeemed_by_uid = ? OR created_by_uid = 'admin_seed_001' ORDER BY id DESC LIMIT 40",
    'ss',
    [$uid, $uid]
);
foreach ($giftCards as &$gc) {
    $gc['id']                = (int)$gc['id'];
    $gc['amount_usd']        = (float)$gc['amount_usd'];
    $gc['initial_balance']   = (float)$gc['initial_balance'];
    $gc['remaining_balance'] = (float)$gc['remaining_balance'];
}
unset($gc);

// Taxonomies for vendor product form
$allCategories    = db_rows($conn, "SELECT id, name, slug FROM category ORDER BY name ASC");
$allSubCategories = db_rows($conn, "SELECT id, category_id, name, slug FROM sub_category ORDER BY name ASC");
$allBrands        = db_rows($conn, "SELECT id, sub_category_id, name, slug FROM brand_category ORDER BY name ASC");

json_out([
    'ok'                   => true,
    'user'                 => $freshUser,
    'stats'                => [
        'cart'     => $nCart,
        'wishlist' => $nWish,
        'reviews'  => $nRev,
        'orders'   => $nOrders,
        'products' => $nProd,
        'books'    => $nBooks,
        'wallet'   => $freshUser['wallet_balance'],
    ],
    'recent_wishlist'      => array_slice($wishlist, 0, 4),
    'wishlist'             => $wishlist,
    'reviews'              => $reviews,
    'orders'               => $orders,
    'vendor_profile'       => $vendorProfile,
    'vendor_products'      => $vendorProducts,
    'domain_subscriptions' => $domainSubscriptions,
    'wallet_transactions'  => $walletTransactions,
    'wallet_totals'        => $walletTotals,
    'currencies'           => $currencies,
    'gift_cards'           => $giftCards,
    'subdomain_plan'       => [
        'fee_ngn'            => (float)$siteSettings['subdomain_fee_ngn'],
        'fee_usd'            => (float)$siteSettings['subdomain_fee_usd'],
        'ngn_rate'           => (float)$siteSettings['ngn_rate'],
        'grace_days'         => (int)$siteSettings['subdomain_grace_days'],
        'company_charge_pct' => (float)$siteSettings['company_wallet_charge_pct'],
    ],
    'my_books'             => $myBooks,
    'taxonomies'           => [
        'categories'     => $allCategories,
        'sub_categories' => $allSubCategories,
        'brands'         => $allBrands,
    ],
]);



