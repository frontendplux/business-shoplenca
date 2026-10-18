<?php
// ============================================================================
// /api/upload.php
// Handles Multiple Product Image Uploads (supports both multipart $_FILES['images']
// and JSON base64 data URLs for Web + Native Capacitor Mobile Apps)
// ============================================================================

require_once __DIR__ . '/config/db.php';

$user = require_auth($conn);
$input = req_input();

$rootUploadDir   = dirname(__DIR__) . '/uploads/products';
$publicUploadDir = dirname(__DIR__) . '/public/uploads/products';
$distUploadDir   = dirname(__DIR__) . '/dist/uploads/products';

foreach ([$rootUploadDir, $publicUploadDir, $distUploadDir] as $dir) {
    if (!is_dir($dir)) {
        @mkdir($dir, 0775, true);
    }
}

$uploadedUrls = [];
$allowedExts  = ['jpg', 'jpeg', 'png', 'webp', 'gif'];

// 1. Handle JSON Base64 Images Array (`base64_images: ["data:image/png;base64,...", ...]`)
if (!empty($input['base64_images']) && is_array($input['base64_images'])) {
    foreach ($input['base64_images'] as $item) {
        $dataUrl = is_array($item) ? ($item['data'] ?? '') : (string)$item;
        if (preg_match('#^data:image/([a-zA-Z0-9+]+);base64,(.+)$#i', $dataUrl, $m)) {
            $ext = strtolower($m[1]);
            if ($ext === 'jpeg') $ext = 'jpg';
            if (!in_array($ext, $allowedExts, true)) $ext = 'png';

            $binary = base64_decode($m[2]);
            if ($binary === false) continue;

            $filename = 'prod-' . date('YmdHis') . '-' . substr(bin2hex(random_bytes(4)), 0, 8) . '.' . $ext;
            $saved    = @file_put_contents($rootUploadDir . '/' . $filename, $binary);
            @file_put_contents($publicUploadDir . '/' . $filename, $binary);
            if (is_dir(dirname(__DIR__) . '/dist')) {
                @file_put_contents($distUploadDir . '/' . $filename, $binary);
            }

            if ($saved !== false) {
                $uploadedUrls[] = '/uploads/products/' . $filename;
            } else {
                // Fallback to inline data URL if filesystem is read-only
                $uploadedUrls[] = $dataUrl;
            }
        }
    }
}

// 2. Handle Multipart $_FILES['images']
if (!empty($_FILES['images'])) {
    $files = $_FILES['images'];
    $count = is_array($files['name']) ? count($files['name']) : 1;

    for ($i = 0; $i < $count; $i++) {
        $name = is_array($files['name']) ? $files['name'][$i] : $files['name'];
        $tmp  = is_array($files['tmp_name']) ? $files['tmp_name'][$i] : $files['tmp_name'];
        $err  = is_array($files['error']) ? $files['error'][$i] : $files['error'];

        if ($err !== UPLOAD_ERR_OK || !is_uploaded_file($tmp)) continue;

        $ext = strtolower(pathinfo((string)$name, PATHINFO_EXTENSION));
        if (!in_array($ext, $allowedExts, true)) continue;

        $filename = 'prod-' . date('YmdHis') . '-' . substr(bin2hex(random_bytes(4)), 0, 8) . '.' . $ext;
        $target   = $rootUploadDir . '/' . $filename;

        if (@move_uploaded_file($tmp, $target)) {
            @copy($target, $publicUploadDir . '/' . $filename);
            if (is_dir(dirname(__DIR__) . '/dist')) {
                @copy($target, $distUploadDir . '/' . $filename);
            }
            $uploadedUrls[] = '/uploads/products/' . $filename;
        }
    }
}

if (empty($uploadedUrls)) {
    json_out(['ok' => false, 'message' => 'No valid images were uploaded. Supported formats: JPG, PNG, WEBP, GIF.'], 400);
}

json_out([
    'ok'      => true,
    'message' => count($uploadedUrls) . ' image(s) uploaded successfully!',
    'urls'    => $uploadedUrls,
]);

