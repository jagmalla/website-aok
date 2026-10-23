<?php
if (!is_file(__DIR__ . '/config.php')) {
    // render.php catches this and serves the plain page; API calls answer with a clear error
    throw new RuntimeException('api/config.php is missing: copy api/config.sample.php to api/config.php and fill in the database details.');
}
require_once __DIR__ . '/config.php';

function db(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;
    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ]);
    return $pdo;
}

function cors(): void {
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    // Allow the configured domain, or any localhost for local dev
    if ($origin === ALLOWED_ORIGIN || preg_match('#^https?://localhost(:\d+)?$#', $origin)) {
        header('Access-Control-Allow-Origin: ' . $origin);
    }
    header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-Requested-With');
    header('Access-Control-Max-Age: 86400');
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') { http_response_code(204); exit; }
}

function json_out(array $data, int $code = 200): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function json_in(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

// Creates the database tables if they don't exist yet (called on admin login, so a fresh install
// needs no separate setup script).
function aok_ensure_tables(): void {
    db()->exec("CREATE TABLE IF NOT EXISTS aok_site_data (id INT PRIMARY KEY, payload LONGTEXT, updated_at DATETIME) DEFAULT CHARSET=utf8mb4");
    db()->exec("CREATE TABLE IF NOT EXISTS aok_leads (id INT AUTO_INCREMENT PRIMARY KEY, payload LONGTEXT, created_at DATETIME) DEFAULT CHARSET=utf8mb4");
}

// Load the saved site-data payload as an array (or null if none saved yet)
function site_data(): ?array {
    try {
        $row = db()->query("SELECT payload FROM aok_site_data WHERE id = 1")->fetch();
        if ($row && !empty($row['payload'])) {
            $d = json_decode($row['payload'], true);
            return is_array($d) ? $d : null;
        }
    } catch (Exception $e) {}
    return null;
}

// ---------- Admin session (server-side login; see api/auth.php) ----------
// Sessions are only started when the admin cookie is present, so ordinary visitors never get one.
function aok_https(): bool {
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https';
}

function aok_session_start(): void {
    if (session_status() === PHP_SESSION_ACTIVE) return;
    session_name('aok_admin');
    session_set_cookie_params(['lifetime' => 0, 'path' => '/', 'secure' => aok_https(), 'httponly' => true, 'samesite' => 'Lax']);
    session_start();
}

function is_admin(): bool {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        if (empty($_COOKIE['aok_admin'])) return false;
        aok_session_start();
    }
    return !empty($_SESSION['aok_admin']);
}

// Stops the request with 401/403 unless the caller is the logged-in admin.
// Any non-GET request must also carry the session's CSRF token in the X-AOK-CSRF header.
function require_admin(): void {
    if (!is_admin()) json_out(['ok' => false, 'error' => 'not_logged_in'], 401);
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        $sent = $_SERVER['HTTP_X_AOK_CSRF'] ?? '';
        if ($sent === '' || !hash_equals((string)($_SESSION['aok_csrf'] ?? ''), $sent)) {
            json_out(['ok' => false, 'error' => 'bad_csrf'], 403);
        }
    }
}

// What the public (and search engines) may see of the site data: never credentials or client leads.
function public_payload(array $d): array {
    unset($d['adminPass'], $d['leads']);
    return $d;
}

// Resolve the recipient + from address: admin-managed values win, config constants are the fallback
function mail_settings(?array $site = null): array {
    if ($site === null) $site = site_data();
    $c = $site['contact'] ?? [];
    $to   = (!empty($c['email'])    && filter_var($c['email'],    FILTER_VALIDATE_EMAIL)) ? $c['email']    : MAIL_TO;
    $from = (!empty($c['mailFrom']) && filter_var($c['mailFrom'], FILTER_VALIDATE_EMAIL)) ? $c['mailFrom'] : MAIL_FROM;
    return ['to' => $to, 'from' => $from];
}
