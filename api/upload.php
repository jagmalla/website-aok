<?php
require_once __DIR__ . '/db.php';
cors();
require_admin();   // admin only

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

// Accepts either a multipart file upload OR a JSON body with a base64 data URL
$maxBytes = MAX_UPLOAD_MB * 1024 * 1024;

if (!empty($_FILES['file']['tmp_name'])) {
    // Multipart upload
    $tmp  = $_FILES['file']['tmp_name'];
    $mime = mime_content_type($tmp);
    $size = $_FILES['file']['size'];
} else {
    // JSON body: { "data": "data:image/jpeg;base64,..." }
    $body = json_in();
    $raw  = $body['data'] ?? '';
    if (!preg_match('#^data:(image/[a-z]+);base64,#', $raw, $m)) {
        json_out(['ok' => false, 'error' => 'invalid_data_url'], 400);
    }
    $mime    = $m[1];
    $decoded = base64_decode(substr($raw, strpos($raw, ',') + 1));
    if (!$decoded) {
        json_out(['ok' => false, 'error' => 'decode_failed'], 400);
    }
    $size = strlen($decoded);
    $tmp  = tempnam(sys_get_temp_dir(), 'aok_');
    file_put_contents($tmp, $decoded);
    $cleanup = true;
}

// Validate
$allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
if (!in_array($mime, $allowed, true)) {
    json_out(['ok' => false, 'error' => 'unsupported_type'], 400);
}
if ($size > $maxBytes) {
    json_out(['ok' => false, 'error' => 'file_too_large'], 400);
}

// Save with a unique name
$ext  = explode('/', $mime)[1];
$name = uniqid('img_', true) . '.' . $ext;
$dest = UPLOAD_DIR . $name;

if (!is_dir(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

if (isset($cleanup)) {
    rename($tmp, $dest);
} else {
    move_uploaded_file($tmp, $dest);
}

chmod($dest, 0644);

json_out(['ok' => true, 'url' => UPLOAD_URL . $name]);
