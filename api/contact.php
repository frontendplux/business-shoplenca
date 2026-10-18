<?php
// ============================================================================
// /api/contact.php
// GET  -> Returns active contact_info cards, map URL, and inquiry topics
// POST -> Submits contact message with validation & rate limiting
// ============================================================================

require_once __DIR__ . '/config/db.php';

$input  = req_input();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$topics = ['General Inquiry', 'Order Support', 'Returns & Refunds', 'Vendor / Selling', 'Partnership', 'Feedback'];

if ($method === 'POST') {
    $user    = get_auth_user($conn);
    $name    = trim((string)($input['name'] ?? ''));
    $email   = trim((string)($input['email'] ?? ''));
    $phone   = trim((string)($input['phone'] ?? ''));
    $subject = trim((string)($input['subject'] ?? ''));
    $message = trim((string)($input['message'] ?? ''));
    $website = trim((string)($input['website'] ?? '')); // honeypot

    if ($website !== '') {
        json_out(['ok' => true, 'message' => 'Message sent! Thank you for reaching out.']);
    }

    $errors = [];
    if (mb_strlen($name) < 2 || mb_strlen($name) > 100) $errors[] = 'Please enter your name.';
    if (!filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 100) $errors[] = 'Please enter a valid email address.';
    if ($phone !== '' && !preg_match('/^[0-9+()\-\s]{6,20}$/', $phone)) $errors[] = 'Phone number looks invalid.';
    if (!in_array($subject, $topics, true)) $errors[] = 'Please choose a subject.';
    if (mb_strlen($message) < 10 || mb_strlen($message) > 2000) $errors[] = 'Message must be between 10 and 2000 characters.';

    if (!empty($errors)) {
        json_out(['ok' => false, 'errors' => $errors, 'message' => $errors[0]], 400);
    }

    $ip = $_SERVER['REMOTE_ADDR'] ?? '';
    $recentRow = db_one(
        $conn,
        "SELECT COUNT(*) AS c FROM contact_messages WHERE ip_address = ? AND created_at > (NOW() - INTERVAL 1 HOUR)",
        's',
        [$ip]
    );
    if ((int)($recentRow['c'] ?? 0) >= 8) {
        json_out(['ok' => false, 'message' => 'Too many messages sent recently. Please try again later.'], 429);
    }

    $uid   = $user['uid'] ?? null;
    $phVal = $phone !== '' ? $phone : null;
    $agent = substr($_SERVER['HTTP_USER_AGENT'] ?? '', 0, 255);

    $ins = db_run(
        $conn,
        "INSERT INTO contact_messages (uid, name, email, phone, subject, message, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        'ssssssss',
        [$uid, $name, $email, $phVal, $subject, $message, $ip, $agent]
    );

    if (!$ins['ok']) {
        json_out(['ok' => false, 'message' => 'Sorry, we could not send your message. Please try again.'], 500);
    }

    json_out(['ok' => true, 'message' => 'Message sent! Thank you for reaching out. We will reply shortly.']);
}

// GET contact info
$info = db_rows($conn, "SELECT id, type, label, value, icon, link FROM contact_info WHERE status = 'active' ORDER BY sort_order ASC, id ASC");
$mapUrl = '';
$cards  = [];
foreach ($info as $i) {
    if ($i['type'] === 'map' && strpos((string)$i['value'], 'https://') === 0) {
        $mapUrl = $i['value'];
    } else {
        $cards[] = $i;
    }
}

json_out([
    'ok'      => true,
    'cards'   => $cards,
    'map_url' => $mapUrl,
    'topics'  => $topics,
]);

