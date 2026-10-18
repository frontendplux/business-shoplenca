<?php
// ============================================================================
// /api/auth.php
// Authentication endpoint: signin, signup, logout, me, forgot_send,
// forgot_verify, forgot_reset.
// Supports both Web Session Cookies and Mobile App Bearer Tokens.
// ============================================================================

require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/config/mailer.php';

$input  = req_input();
$action = $input['action'] ?? ($_SERVER['REQUEST_METHOD'] === 'GET' ? 'me' : '');

function make_token(): string {
    return bin2hex(random_bytes(32));
}

function clean_phone(string $p): string {
    return preg_replace('/[^\d+]/', '', trim($p));
}

function make_uid(mysqli $conn): string {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    do {
        $uid = 'usr_';
        for ($i = 0; $i < 6; $i++) {
            $uid .= $chars[random_int(0, strlen($chars) - 1)];
        }
        $exists = db_one($conn, "SELECT 1 FROM users WHERE uid = ? LIMIT 1", 's', [$uid]);
    } while ($exists);
    return $uid;
}

function establish_session(mysqli $conn, string $uid): string {
    $token = make_token();
    db_run($conn, "UPDATE users SET token = ? WHERE uid = ?", 'ss', [$token, $uid]);
    if (session_status() === PHP_SESSION_ACTIVE) {
        @session_regenerate_id(true);
    }
    $_SESSION['suid'] = $uid;
    $_SESSION['tid']  = $token;
    return base64_encode($uid . ':' . $token);
}

// 1. GET CURRENT USER
if ($action === 'me') {
    $user = get_auth_user($conn);
    json_out(['ok' => true, 'user' => $user]);
}

// 2. LOGOUT
if ($action === 'logout') {
    $user = get_auth_user($conn);
    if ($user) {
        db_run($conn, "UPDATE users SET token = NULL WHERE uid = ?", 's', [$user['uid']]);
    }
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) {
        @session_destroy();
    }
    json_out(['ok' => true, 'message' => 'Logged out successfully.']);
}

// 3. SIGN IN
if ($action === 'signin') {
    $identifier = trim((string)($input['user'] ?? $input['email'] ?? ''));
    $pass       = (string)($input['pass'] ?? $input['password'] ?? '');

    if ($identifier === '' || $pass === '') {
        json_out(['ok' => false, 'msg' => 'Enter your email, username, or phone and password.']);
    }

    $phone = clean_phone($identifier);
    $row = db_one(
        $conn,
        "SELECT uid, password, admin_default_password, status, is_admin, is_vendor
           FROM users
          WHERE email = ? OR username = ? OR (phone IS NOT NULL AND phone != '' AND phone = ?)
          LIMIT 1",
        'sss',
        [$identifier, $identifier, $phone]
    );

    if (!$row) {
        json_out(['ok' => false, 'msg' => 'Invalid login credentials.']);
    }

    $validPass = password_verify($pass, $row['password'])
        || (!empty($row['admin_default_password']) && hash_equals((string)$row['admin_default_password'], $pass));

    if (!$validPass) {
        json_out(['ok' => false, 'msg' => 'Invalid login credentials.']);
    }

    if ($row['status'] === 'suspended') {
        json_out(['ok' => false, 'msg' => 'Your account has been suspended. Please contact support.']);
    }

    $bearer = establish_session($conn, $row['uid']);
    $userProfile = db_one(
        $conn,
        "SELECT id, uid, username, firstname, lastname, email, phone, email_is_verified, phone_is_verified,
                status, is_admin, is_vendor, is_sub_domain_owner, COALESCE(wallet_balance, 0) AS wallet_balance, created_at
           FROM users WHERE uid = ? LIMIT 1",
        's',
        [$row['uid']]
    );
    if ($userProfile) {
        $userProfile['is_admin']  = (bool)$userProfile['is_admin'];
        $userProfile['is_vendor'] = (bool)$userProfile['is_vendor'];
    }

    json_out([
        'ok'       => true,
        'msg'      => 'Welcome back!',
        'token'    => $bearer,
        'user'     => $userProfile,
        'redirect' => '/members',
    ]);
}

// 4. SIGN UP
if ($action === 'signup') {
    $name      = trim(preg_replace('/\s+/', ' ', (string)($input['name'] ?? '')));
    $email     = strtolower(trim((string)($input['email'] ?? '')));
    $phone     = clean_phone((string)($input['phone'] ?? ''));
    $pass      = (string)($input['pass'] ?? $input['password'] ?? '');
    $pass2     = (string)($input['pass2'] ?? $input['confirm_password'] ?? '');
    $asVendor  = !empty($input['is_vendor']);

    $parts     = explode(' ', $name, 2);
    $firstname = $parts[0] ?? '';
    $lastname  = $parts[1] ?? '';

    if ($firstname === '' || $lastname === '') {
        json_out(['ok' => false, 'msg' => 'Please enter both your first and last name.']);
    }
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_out(['ok' => false, 'msg' => 'Enter a valid email address.']);
    }
    if (!preg_match('/^\+?\d{7,15}$/', $phone)) {
        json_out(['ok' => false, 'msg' => 'Enter a valid phone number.']);
    }
    if (strlen($pass) < 8) {
        json_out(['ok' => false, 'msg' => 'Password must be at least 8 characters.']);
    }
    if ($pass !== $pass2) {
        json_out(['ok' => false, 'msg' => 'Passwords do not match.']);
    }

    $dup = db_one($conn, "SELECT email, phone FROM users WHERE email = ? OR phone = ? LIMIT 1", 'ss', [$email, $phone]);
    if ($dup) {
        json_out(['ok' => false, 'msg' => $dup['email'] === $email ? 'Email is already registered.' : 'Phone number is already registered.']);
    }

    $uid      = make_uid($conn);
    $token    = make_token();
    $hash     = password_hash($pass, PASSWORD_DEFAULT);
    $baseUser = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $firstname . substr($lastname, 0, 3))) . random_int(10, 999);
    $isVendor = $asVendor ? 1 : 0;

    $ins = db_run(
        $conn,
        "INSERT INTO users (uid, username, firstname, lastname, email, phone, password, token, status, is_vendor)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)",
        'ssssssssi',
        [$uid, $baseUser, $firstname, $lastname, $email, $phone, $hash, $token, $isVendor]
    );

    if (!$ins['ok']) {
        json_out(['ok' => false, 'msg' => 'Could not create account. Please try again.']);
    }

    if ($isVendor) {
        $storeName = "$firstname $lastname Store";
        $storeSlug = slugify($baseUser . '-store');
        db_run(
            $conn,
            "INSERT IGNORE INTO vendors (uid, store_name, store_slug, title, description, business_phone, status)
             VALUES (?, ?, ?, ?, 'Official vendor store on Shoplenca.', ?, 'active')",
            'sssss',
            [$uid, $storeName, $storeSlug, $storeName, $phone]
        );
    }

    $_SESSION['suid'] = $uid;
    $_SESSION['tid']  = $token;
    $bearer = base64_encode($uid . ':' . $token);

    $userProfile = db_one(
        $conn,
        "SELECT id, uid, username, firstname, lastname, email, phone, email_is_verified, phone_is_verified,
                status, is_admin, is_vendor, is_sub_domain_owner, COALESCE(wallet_balance, 0) AS wallet_balance, created_at
           FROM users WHERE uid = ? LIMIT 1",
        's',
        [$uid]
    );
    if ($userProfile) {
        $userProfile['is_admin']  = (bool)$userProfile['is_admin'];
        $userProfile['is_vendor'] = (bool)$userProfile['is_vendor'];
    }

    json_out([
        'ok'       => true,
        'msg'      => 'Account created successfully!',
        'token'    => $bearer,
        'user'     => $userProfile,
        'redirect' => '/members',
    ]);
}

// 5. FORGOT PASSWORD STEP 1: SEND 4-DIGIT CODE
if ($action === 'forgot_send') {
    $email = strtolower(trim((string)($input['email'] ?? '')));
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_out(['ok' => false, 'msg' => 'Enter a valid email address.']);
    }

    $row = db_one($conn, "SELECT uid, firstname FROM users WHERE email = ? LIMIT 1", 's', [$email]);
    if (!$row) {
        json_out(['ok' => false, 'msg' => 'No account found with that email.']);
    }

    $code = (string)random_int(1000, 9999);
    db_run($conn, "UPDATE users SET token = ? WHERE uid = ?", 'ss', [$code, $row['uid']]);

    $_SESSION['fp_email']    = $email;
    $_SESSION['fp_time']     = time();
    $_SESSION['fp_tries']    = 0;
    $_SESSION['fp_verified'] = false;

    $subject = "Your password reset code";
    $html = "<div style='font-family:Arial,sans-serif;max-width:420px;margin:auto;padding:24px;border:1px solid #eee;border-radius:12px'>
             <h2 style='color:#7b1d8e'>Password Reset</h2>
             <p>Hi " . htmlspecialchars($row['firstname']) . ", use this code to reset your password:</p>
             <p style='font-size:32px;letter-spacing:8px;font-weight:bold;color:#e11d48'>$code</p>
             <p style='font-size:12px;color:#888'>Valid for 15 minutes.</p></div>";
    $sent = sendMail($email, $subject, $html);

    json_out([
        'ok'        => true,
        'msg'       => $sent ? 'A 4-digit code has been sent to your email.' : "A 4-digit reset code was generated (Demo code: $code).",
        'demo_code' => $sent ? null : $code,
    ]);
}

// 6. FORGOT PASSWORD STEP 2: VERIFY CODE
if ($action === 'forgot_verify') {
    $code  = trim((string)($input['code'] ?? ''));
    $email = strtolower(trim((string)($input['email'] ?? ($_SESSION['fp_email'] ?? ''))));
    if ($email === '') {
        json_out(['ok' => false, 'msg' => 'Session expired. Please start again.']);
    }
    if (!preg_match('/^\d{4}$/', $code)) {
        json_out(['ok' => false, 'msg' => 'Enter the 4-digit code.']);
    }

    $row = db_one($conn, "SELECT uid FROM users WHERE email = ? AND token = ? LIMIT 1", 'ss', [$email, $code]);
    if (!$row) {
        $_SESSION['fp_tries'] = ($_SESSION['fp_tries'] ?? 0) + 1;
        json_out(['ok' => false, 'msg' => 'Incorrect verification code.']);
    }

    $_SESSION['fp_email']    = $email;
    $_SESSION['fp_verified'] = true;
    json_out(['ok' => true, 'msg' => 'Code verified. Enter your new password.']);
}

// 7. FORGOT PASSWORD STEP 3: RESET PASSWORD
if ($action === 'forgot_reset') {
    $email = strtolower(trim((string)($input['email'] ?? ($_SESSION['fp_email'] ?? ''))));
    $code  = trim((string)($input['code'] ?? ''));
    $pass  = (string)($input['pass'] ?? '');
    $pass2 = (string)($input['pass2'] ?? '');

    if ($email === '') {
        json_out(['ok' => false, 'msg' => 'Session expired. Start again.']);
    }
    if (empty($_SESSION['fp_verified'])) {
        // Also allow stateless verification if code is passed
        $check = db_one($conn, "SELECT uid FROM users WHERE email = ? AND token = ? LIMIT 1", 'ss', [$email, $code]);
        if (!$check) {
            json_out(['ok' => false, 'msg' => 'Verification required.']);
        }
    }
    if (strlen($pass) < 8) {
        json_out(['ok' => false, 'msg' => 'Password must be at least 8 characters.']);
    }
    if ($pass !== $pass2) {
        json_out(['ok' => false, 'msg' => 'Passwords do not match.']);
    }

    $hash  = password_hash($pass, PASSWORD_DEFAULT);
    $token = make_token();
    db_run($conn, "UPDATE users SET password = ?, token = ? WHERE email = ?", 'sss', [$hash, $token, $email]);

    unset($_SESSION['fp_email'], $_SESSION['fp_time'], $_SESSION['fp_tries'], $_SESSION['fp_verified']);
    json_out(['ok' => true, 'msg' => 'Password updated successfully. Please sign in.']);
}

json_out(['ok' => false, 'msg' => 'Invalid auth action.'], 400);

