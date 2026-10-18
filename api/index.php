<?php
// ============================================================================
// /api/index.php
// Central API router: routes /api/<endpoint> or /api/?endpoint=<endpoint>
// ============================================================================

$uriPath  = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
$endpoint = $_GET['endpoint'] ?? '';

if ($endpoint === '' && preg_match('#/api/([a-zA-Z0-9_-]+)#', (string)$uriPath, $m)) {
    $endpoint = strtolower($m[1]);
}

$allowed = [
    'bootstrap' => __DIR__ . '/bootstrap.php',
    'home'      => __DIR__ . '/home.php',
    'products'  => __DIR__ . '/products.php',
    'auth'      => __DIR__ . '/auth.php',
    'cart'      => __DIR__ . '/cart.php',
    'wishlist'  => __DIR__ . '/wishlist.php',
    'checkout'  => __DIR__ . '/checkout.php',
    'member'    => __DIR__ . '/member.php',
    'blog'      => __DIR__ . '/blog.php',
    'books'     => __DIR__ . '/books.php',
    'contact'       => __DIR__ . '/contact.php',
    'pages'         => __DIR__ . '/pages.php',
    'admin'         => __DIR__ . '/admin.php',
    'notifications' => __DIR__ . '/notifications.php',
    'upload'        => __DIR__ . '/upload.php',
];

if (isset($allowed[$endpoint]) && file_exists($allowed[$endpoint])) {
    require $allowed[$endpoint];
    exit;
}

require_once __DIR__ . '/config/db.php';
json_out([
    'ok'        => true,
    'service'   => 'Shoplenca E-Commerce REST API',
    'version'   => '2.0.0',
    'endpoints' => array_keys($allowed),
]);

