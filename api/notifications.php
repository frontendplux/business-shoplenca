<?php
// ============================================================================
// /api/notifications.php
// Web Push & In-App Notification API:
// - GET: List notifications for current user + broadcast alerts + unread count
// - POST:
//   * mark_read (mark one or all notifications as read)
//   * subscribe (register browser Web Push endpoint/keys)
//   * broadcast (Admin only: send broadcast or targeted push notification)
// ============================================================================

require_once __DIR__ . '/config/db.php';

$input  = req_input();
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$user   = get_auth_user($conn);
$uid    = $user['uid'] ?? null;

if ($method === 'POST') {
    $action = $input['action'] ?? '';

    // 1. Register Browser Push Subscription
    if ($action === 'subscribe') {
        $endpoint = trim((string)($input['endpoint'] ?? ''));
        $p256dh   = trim((string)($input['p256dh'] ?? ''));
        $authKey  = trim((string)($input['auth_key'] ?? ''));
        $ua       = substr((string)($_SERVER['HTTP_USER_AGENT'] ?? ''), 0, 250);

        if ($endpoint !== '') {
            db_run(
                $conn,
                "INSERT INTO push_subscriptions (uid, endpoint, p256dh, auth_key, user_agent) VALUES (?, ?, ?, ?, ?)",
                'sssss',
                [$uid, $endpoint, $p256dh, $authKey, $ua]
            );
        }
        json_out(['ok' => true, 'message' => 'Push notifications enabled for this browser!']);
    }

    // 2. Mark Notifications as Read
    if ($action === 'mark_read') {
        if (!$uid) {
            json_out(['ok' => true]);
        }
        $notifId = (int)($input['id'] ?? 0);
        if ($notifId > 0) {
            db_run($conn, "UPDATE push_notifications SET is_read = 1 WHERE id = ? AND (target_uid = ? OR target_uid IS NULL)", 'is', [$notifId, $uid]);
        } else {
            db_run($conn, "UPDATE push_notifications SET is_read = 1 WHERE target_uid = ? OR target_uid IS NULL", 's', [$uid]);
        }
        json_out(['ok' => true, 'message' => 'Notifications marked as read.']);
    }

    // 3. Admin Broadcast / Targeted Push Notification
    if ($action === 'broadcast') {
        $admin     = require_admin($conn);
        $targetUid = trim((string)($input['target_uid'] ?? '')) ?: null;
        $title     = trim((string)($input['title'] ?? ''));
        $message   = trim((string)($input['message'] ?? ''));
        $type      = in_array($input['type'] ?? 'promo', ['info', 'success', 'warning', 'promo', 'order', 'domain', 'verification'], true) ? $input['type'] : 'promo';
        $link      = trim((string)($input['link'] ?? '/'));
        $icon      = trim((string)($input['icon'] ?? 'bi-bell-fill'));

        if ($title === '' || $message === '') {
            json_out(['ok' => false, 'message' => 'Notification title and message are required.'], 400);
        }

        $nid = send_push_notification($conn, $targetUid, $title, $message, $type, $link, $icon);
        json_out([
            'ok'      => true,
            'id'      => $nid,
            'message' => $targetUid ? "Push notification sent to user ($targetUid)!" : 'Broadcast push notification sent to all users!',
        ]);
    }

    json_out(['ok' => false, 'message' => 'Invalid notification action.'], 400);
}

// ============================================================================
// GET: Fetch Notifications & Unread Count
// ============================================================================
if ($uid) {
    $notifications = db_rows(
        $conn,
        "SELECT id, target_uid, title, message, type, link, icon, is_read, created_at
           FROM push_notifications
          WHERE target_uid IS NULL OR target_uid = ?
          ORDER BY created_at DESC, id DESC
          LIMIT 25",
        's',
        [$uid]
    );
    $unreadRow = db_one(
        $conn,
        "SELECT COUNT(*) AS c FROM push_notifications WHERE (target_uid IS NULL OR target_uid = ?) AND is_read = 0",
        's',
        [$uid]
    );
} else {
    $notifications = db_rows(
        $conn,
        "SELECT id, target_uid, title, message, type, link, icon, is_read, created_at
           FROM push_notifications
          WHERE target_uid IS NULL
          ORDER BY created_at DESC, id DESC
          LIMIT 15"
    );
    $unreadRow = db_one($conn, "SELECT COUNT(*) AS c FROM push_notifications WHERE target_uid IS NULL AND is_read = 0");
}

foreach ($notifications as &$n) {
    $n['id']      = (int)$n['id'];
    $n['is_read'] = (bool)$n['is_read'];
}
unset($n);

json_out([
    'ok'            => true,
    'unread_count'  => (int)($unreadRow['c'] ?? 0),
    'notifications' => $notifications,
]);

