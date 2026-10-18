<?php
// ============================================================================
// /api/books.php
// POST action=buy_book       -> Purchase & unlock a paid book (credits book writer wallet)
// GET ?slug=...&chapter=...  -> Chapter reader + progress tracking + monetization reward
// GET ?slug=...              -> Book detail + chapter list + pricing & purchase status
// GET                        -> Books catalogue list (with Free & Paid prices)
// ============================================================================

require_once __DIR__ . '/config/db.php';

$method        = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
$input         = req_input();
$coverFallback = 'https://placehold.co/600x800/f3e8ff/7b1d8e?text=Book';
$user          = get_auth_user($conn);
$uid           = $user['uid'] ?? null;
$settings      = get_site_settings($conn);

// ============================================================================
// POST: Purchase & Unlock a Paid Book
// ============================================================================
if ($method === 'POST') {
    $action = $input['action'] ?? 'buy_book';

    if ($action === 'buy_book') {
        $authUser  = require_auth($conn);
        $buyerUid  = $authUser['uid'];
        $bookId    = (int)($input['book_id'] ?? 0);
        $bookSlug  = trim((string)($input['slug'] ?? ''));
        $payMethod = trim((string)($input['payment_method'] ?? 'wallet'));
        $payRef    = trim((string)($input['payment_reference'] ?? ''));

        $book = $bookId > 0
            ? db_one($conn, "SELECT * FROM books WHERE id = ? LIMIT 1", 'i', [$bookId])
            : db_one($conn, "SELECT * FROM books WHERE slug = ? LIMIT 1", 's', [$bookSlug]);

        if (!$book) {
            json_out(['ok' => false, 'message' => 'Book not found.'], 404);
        }

        $bId        = (int)$book['id'];
        $bookPrice  = round((float)($book['price'] ?? 0), 2);
        $authorUid  = $book['uid'] ?? null;

        if ($bookPrice <= 0) {
            json_out(['ok' => true, 'message' => 'This book is already free to read!']);
        }

        // Check if already purchased
        $existingPurchase = db_one(
            $conn,
            "SELECT id FROM book_purchases WHERE book_id = ? AND buyer_uid = ? LIMIT 1",
            'is',
            [$bId, $buyerUid]
        );
        if ($existingPurchase) {
            json_out(['ok' => true, 'message' => 'You already own this book! All chapters are unlocked.']);
        }

        // If paying with Member Wallet, check and deduct balance
        if ($payMethod === 'wallet') {
            $balRow = db_one($conn, "SELECT COALESCE(wallet_balance, 0) AS bal FROM users WHERE uid = ?", 's', [$buyerUid]);
            $curBal = (float)($balRow['bal'] ?? 0);
            if ($curBal < $bookPrice) {
                json_out([
                    'ok'      => false,
                    'message' => 'Insufficient wallet balance to buy this book. Please select an online payment gateway (Paystack, Flutterwave, Card, etc.).',
                ], 400);
            }
            db_run($conn, "UPDATE users SET wallet_balance = wallet_balance - ? WHERE uid = ?", 'ds', [$bookPrice, $buyerUid]);
        }

        if ($payRef === '') {
            $payRef = 'BOOK-' . strtoupper($payMethod) . '-' . strtoupper(bin2hex(random_bytes(4)));
        }

        // Calculate Writer Earnings & Company Charge
        // If writer owns an active Self-Managed Subdomain store -> 0% company interference!
        // Otherwise apply company_wallet_charge_pct
        $chargePct = (float)($settings['company_wallet_charge_pct'] ?? 2.5);
        $payMode   = 'company_wallet';
        if ($authorUid) {
            $vRow = db_one($conn, "SELECT * FROM vendors WHERE uid = ? LIMIT 1", 's', [$authorUid]);
            if ($vRow) {
                $vRow = evaluate_vendor_domain_status($conn, $vRow);
                if (!empty($vRow['domain_plan_active']) && ($vRow['payment_mode'] ?? '') === 'self_managed') {
                    $chargePct = 0.0;
                    $payMode   = 'self_managed';
                }
            }
        }

        $chargeAmt    = round($bookPrice * ($chargePct / 100), 4);
        $writerNetAmt = round($bookPrice - $chargeAmt, 4);

        // Record purchase
        db_run(
            $conn,
            "INSERT INTO book_purchases
                (book_id, buyer_uid, author_uid, amount_paid, company_charge_percent, company_charge_amount, writer_net_amount, payment_method, payment_reference)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            'issddddss',
            [$bId, $buyerUid, $authorUid, $bookPrice, $chargePct, $chargeAmt, $writerNetAmt, $payMethod, $payRef]
        );

        // Increment book sales count & writer earnings, and credit writer's database wallet
        db_run(
            $conn,
            "UPDATE books SET sales_count = COALESCE(sales_count, 0) + 1, writer_earnings = COALESCE(writer_earnings, 0) + ? WHERE id = ?",
            'di',
            [$writerNetAmt, $bId]
        );

        if ($authorUid) {
            db_run(
                $conn,
                "UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + ? WHERE uid = ?",
                'ds',
                [$writerNetAmt, $authorUid]
            );
            db_run(
                $conn,
                "INSERT INTO vendor_wallet_transactions
                    (vendor_uid, product_id, product_name, tx_type, payment_mode, gross_amount, company_charge_percent, company_charge_amount, net_vendor_amount, currency_code, status, description)
                 VALUES (?, ?, ?, 'book_sale', ?, ?, ?, ?, ?, 'USD', 'completed', ?)",
                'sissdddds',
                [
                    $authorUid,
                    $bId,
                    $book['title'],
                    $payMode,
                    $bookPrice,
                    $chargePct,
                    $chargeAmt,
                    $writerNetAmt,
                    "Book sale: '{$book['title']}' (Ref: {$payRef})",
                ]
            );

            send_push_notification(
                $conn,
                $authorUid,
                'New Book Sale: ' . $book['title'],
                "A reader purchased your book '{$book['title']}'! Net payout credited to your wallet: $" . number_format($writerNetAmt, 2),
                'order',
                '/member?tab=books',
                'bi-journal-check'
            );
        }

        send_push_notification(
            $conn,
            $buyerUid,
            'Book Unlocked: ' . $book['title'],
            "You now have full lifetime access to all chapters of '{$book['title']}'. Happy reading!",
            'success',
            '/book?slug=' . urlencode($book['slug']),
            'bi-book-half'
        );

        json_out([
            'ok'                => true,
            'message'           => "Book unlocked! You now have full access to all chapters of '{$book['title']}'.",
            'is_purchased'      => true,
            'payment_reference' => $payRef,
        ]);
    }

    json_out(['ok' => false, 'message' => 'Unknown book action.'], 400);
}

// ============================================================================
// GET: Book Detail / Reader or Catalogue List
// ============================================================================
$slug      = trim((string)($input['slug'] ?? ''));
$chapterNo = (int)($input['chapter'] ?? 0);

if ($slug !== '') {
    $book = db_one($conn, "SELECT * FROM books WHERE slug = ? AND status = 'published' LIMIT 1", 's', [$slug]);
    if (!$book) {
        json_out(['ok' => false, 'mode' => 'missing', 'message' => 'Book not found.'], 404);
    }

    $bookId                        = (int)$book['id'];
    $book['id']                    = $bookId;
    $book['views']                 = (int)$book['views'];
    $book['is_monetized']          = (bool)($book['is_monetized'] ?? true);
    $book['price']                 = round((float)($book['price'] ?? 0), 2);
    $book['compare_price']         = round((float)($book['compare_price'] ?? 0), 2);
    $book['free_preview_chapters'] = max(0, (int)($book['free_preview_chapters'] ?? 1));
    $book['sales_count']           = (int)($book['sales_count'] ?? 0);
    $book['is_free']               = $book['price'] <= 0;
    $book['cover_image']           = $book['cover_image'] ?: $coverFallback;
    $book['gallery']               = json_decode($book['gallery_images'] ?? '[]', true) ?: [];

    // Determine if current user has unlocked this book
    $isAuthor    = $uid && !empty($book['uid']) && $uid === $book['uid'];
    $isAdmin     = !empty($user['is_admin']);
    $isPurchased = $book['is_free'] || $isAuthor || $isAdmin;

    if (!$isPurchased && $uid) {
        $purRow = db_one(
            $conn,
            "SELECT id FROM book_purchases WHERE book_id = ? AND buyer_uid = ? LIMIT 1",
            'is',
            [$bookId, $uid]
        );
        if ($purRow) {
            $isPurchased = true;
        }
    }

    $book['is_purchased'] = $isPurchased;
    $book['is_author']    = $isAuthor;

    $chapters = db_rows(
        $conn,
        "SELECT chapter_no, title, GREATEST(1, CEIL(CHAR_LENGTH(content) / 1000)) AS read_min
           FROM book_chapters WHERE book_id = ? ORDER BY chapter_no ASC",
        'i',
        [$bookId]
    );

    $totalMin = 0;
    foreach ($chapters as $idxKey => &$c) {
        $c['chapter_no'] = (int)$c['chapter_no'];
        $c['read_min']   = (int)$c['read_min'];
        $c['is_locked']  = !$isPurchased && ($idxKey >= $book['free_preview_chapters']);
        $totalMin       += $c['read_min'];
    }
    unset($c);

    $progress = null;
    if ($uid) {
        $progress = db_one($conn, "SELECT chapter_no FROM book_progress WHERE uid = ? AND book_id = ? LIMIT 1", 'si', [$uid, $bookId]);
    }

    // Active payment gateways for book purchase modal
    $gateways = db_rows(
        $conn,
        "SELECT id, code, name, gateway_type, icon, description FROM payment_gateways WHERE is_active = 1 AND gateway_type <> 'cod' ORDER BY sort_order ASC"
    );

    if ($chapterNo > 0) {
        $idx = -1;
        foreach ($chapters as $i => $c) {
            if ($c['chapter_no'] === $chapterNo) {
                $idx = $i;
                break;
            }
        }

        if ($idx >= 0) {
            $isChapterLocked = !empty($chapters[$idx]['is_locked']);
            $chapter = db_one(
                $conn,
                "SELECT chapter_no, title, content FROM book_chapters WHERE book_id = ? AND chapter_no = ? LIMIT 1",
                'ii',
                [$bookId, $chapterNo]
            );

            $rewardEarned = 0.0;
            if ($chapter) {
                $chapter['is_locked'] = $isChapterLocked;
                if ($isChapterLocked) {
                    // Return only a short teaser snippet if chapter is locked behind book price
                    $plainText = trim(strip_tags((string)$chapter['content']));
                    $teaser    = mb_substr($plainText, 0, 280) . '...';
                    $chapter['content'] = "<p>{$teaser}</p>";
                } elseif ($uid) {
                    $prevProg = $progress ? (int)$progress['chapter_no'] : 0;
                    db_run(
                        $conn,
                        "INSERT INTO book_progress (uid, book_id, chapter_no) VALUES (?, ?, ?)
                         ON DUPLICATE KEY UPDATE chapter_no = GREATEST(chapter_no, VALUES(chapter_no))",
                        'sii',
                        [$uid, $bookId, $chapterNo]
                    );

                    // Monetization: reward reader & writer when advancing to a new unlocked chapter
                    if ($book['is_monetized'] && $chapterNo > $prevProg) {
                        $readerReward = (float)$settings['reader_reward_per_chapter'];
                        $writerReward = (float)$settings['writer_reward_per_read'];
                        db_run($conn, "UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + ? WHERE uid = ?", 'ds', [$readerReward, $uid]);
                        if (!empty($book['uid'])) {
                            db_run($conn, "UPDATE users SET wallet_balance = COALESCE(wallet_balance, 0) + ? WHERE uid = ?", 'ds', [$writerReward, $book['uid']]);
                            db_run($conn, "UPDATE books SET writer_earnings = COALESCE(writer_earnings, 0) + ? WHERE id = ?", 'di', [$writerReward, $bookId]);
                        }
                        $rewardEarned = $readerReward;
                    }
                }
            }

            json_out([
                'ok'            => true,
                'mode'          => 'reader',
                'book'          => $book,
                'chapters'      => $chapters,
                'chapter'       => $chapter,
                'chapter_index' => $idx,
                'prev_chapter'  => $idx > 0 ? $chapters[$idx - 1] : null,
                'next_chapter'  => $idx < count($chapters) - 1 ? $chapters[$idx + 1] : null,
                'progress_pct'  => (int)round((($idx + 1) / max(1, count($chapters))) * 100),
                'reward_earned' => $rewardEarned,
                'gateways'      => $gateways,
            ]);
        }
    }

    // Detail view
    db_run($conn, "UPDATE books SET views = views + 1 WHERE id = ?", 'i', [$bookId]);
    $book['views']++;

    json_out([
        'ok'        => true,
        'mode'      => 'detail',
        'book'      => $book,
        'chapters'  => $chapters,
        'total_min' => $totalMin,
        'progress'  => $progress ? (int)$progress['chapter_no'] : null,
        'gateways'  => $gateways,
    ]);
}

// Catalogue list view
$cat     = trim((string)($input['category'] ?? ''));
$q       = trim((string)($input['q'] ?? ''));
$page    = max(1, (int)($input['page'] ?? 1));
$perPage = 12;

$cats = db_rows($conn, "SELECT category, COUNT(*) AS total FROM books WHERE status = 'published' GROUP BY category ORDER BY category");

$where  = "b.status = 'published'";
$types  = '';
$params = [];

if ($cat !== '') {
    $where .= " AND b.category = ?";
    $types .= 's';
    $params[] = $cat;
}
if ($q !== '') {
    $where .= " AND (b.title LIKE ? OR b.author LIKE ? OR b.description LIKE ?)";
    $types .= 'sss';
    $like = '%' . $q . '%';
    array_push($params, $like, $like, $like);
}

$totalRow = db_one($conn, "SELECT COUNT(*) AS total FROM books b WHERE $where", $types, $params);
$total    = (int)($totalRow['total'] ?? 0);
$pages    = max(1, (int)ceil($total / $perPage));
$page     = min($page, $pages);
$offset   = ($page - 1) * $perPage;

$books = db_rows(
    $conn,
    "SELECT b.id, b.uid, b.slug, b.title, b.author, b.cover_image, b.category, b.views, b.is_monetized,
            COALESCE(b.price, 0) AS price, COALESCE(b.compare_price, 0) AS compare_price,
            COALESCE(b.free_preview_chapters, 1) AS free_preview_chapters, COALESCE(b.sales_count, 0) AS sales_count,
            (SELECT COUNT(*) FROM book_chapters c WHERE c.book_id = b.id) AS chapters
       FROM books b
      WHERE $where
      ORDER BY b.views DESC, b.id ASC
      LIMIT ? OFFSET ?",
    $types . 'ii',
    array_merge($params, [$perPage, $offset])
);

// Fetch user's purchased book IDs if signed in
$purchasedMap = [];
if ($uid) {
    $pRows = db_rows($conn, "SELECT book_id FROM book_purchases WHERE buyer_uid = ?", 's', [$uid]);
    foreach ($pRows as $pr) {
        $purchasedMap[(int)$pr['book_id']] = true;
    }
}

foreach ($books as &$b) {
    $b['id']                    = (int)$b['id'];
    $b['chapters']              = (int)$b['chapters'];
    $b['views']                 = (int)$b['views'];
    $b['is_monetized']          = (bool)($b['is_monetized'] ?? true);
    $b['price']                 = round((float)($b['price'] ?? 0), 2);
    $b['compare_price']         = round((float)($b['compare_price'] ?? 0), 2);
    $b['free_preview_chapters'] = (int)($b['free_preview_chapters'] ?? 1);
    $b['sales_count']           = (int)($b['sales_count'] ?? 0);
    $b['is_free']               = $b['price'] <= 0;
    $b['is_purchased']          = $b['is_free'] || !empty($purchasedMap[$b['id']]) || ($uid && $uid === ($b['uid'] ?? ''));
    $b['cover_image']           = $b['cover_image'] ?: $coverFallback;
}
unset($b);

json_out([
    'ok'    => true,
    'mode'  => 'list',
    'books' => $books,
    'cats'  => $cats,
    'total' => $total,
    'page'  => $page,
    'pages' => $pages,
]);
