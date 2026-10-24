<?php
// Admin login, done on the server.
//   POST {action:'login', password}            -> starts an admin session, returns {ok, csrf}
//   POST {action:'change', current, next}      -> changes the password (logged in + CSRF)
//   POST {action:'logout'}                     -> ends the session
//   POST {action:'forgot'}                     -> emails a password-reset link to the owner's recovery
//                                                 address (AOK_RECOVERY_EMAIL in api/db.php); see reset-password.php
//   GET  ?action=status                        -> {ok, authed, csrf?}
//
// Passwords are stored only as a hash (table aok_auth). On the very first login the existing
// password saved in the site data (adminPass) is accepted, hashed, and removed from the public
// data — so the current password keeps working and nobody is locked out.
require_once __DIR__ . '/db.php';
cors();
header('Cache-Control: no-store');

const AOK_MAX_FAILS = 8;          // failed attempts allowed per IP ...
const AOK_LOCK_MINUTES = 15;      // ... within this window

function auth_tables(): void {
    aok_ensure_tables();
    db()->exec("CREATE TABLE IF NOT EXISTS aok_auth (id INT PRIMARY KEY, pass_hash VARCHAR(255) NOT NULL, updated_at DATETIME)");
    db()->exec("CREATE TABLE IF NOT EXISTS aok_login_attempts (ip VARCHAR(64) PRIMARY KEY, fails INT NOT NULL DEFAULT 0, last_at DATETIME)");
}

function stored_hash(): ?string {
    $row = db()->query("SELECT pass_hash FROM aok_auth WHERE id = 1")->fetch();
    return $row ? $row['pass_hash'] : null;
}

function save_hash(string $plain): void {
    $stmt = db()->prepare("INSERT INTO aok_auth (id, pass_hash, updated_at) VALUES (1, :h1, NOW())
                           ON DUPLICATE KEY UPDATE pass_hash = :h2, updated_at = NOW()");
    $h = password_hash($plain, PASSWORD_DEFAULT);
    $stmt->execute([':h1' => $h, ':h2' => $h]);
}

// Remove the legacy plain-text password from the saved site data.
function strip_legacy_password(): void {
    $site = site_data();
    if (is_array($site) && array_key_exists('adminPass', $site)) {
        unset($site['adminPass']);
        db()->prepare("UPDATE aok_site_data SET payload = :p WHERE id = 1")
            ->execute([':p' => json_encode($site, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
    }
}

function client_ip(): string { return substr((string)($_SERVER['REMOTE_ADDR'] ?? 'unknown'), 0, 64); }

function locked_out(): bool {
    $st = db()->prepare("SELECT fails, last_at FROM aok_login_attempts WHERE ip = :ip");
    $st->execute([':ip' => client_ip()]);
    $r = $st->fetch();
    return $r && (int)$r['fails'] >= AOK_MAX_FAILS && strtotime($r['last_at']) > time() - AOK_LOCK_MINUTES * 60;
}

function record_attempt(bool $ok): void {
    if ($ok) {
        db()->prepare("DELETE FROM aok_login_attempts WHERE ip = :ip")->execute([':ip' => client_ip()]);
        return;
    }
    // reset the counter once the lock window has passed
    db()->prepare("INSERT INTO aok_login_attempts (ip, fails, last_at) VALUES (:ip, 1, NOW())
                   ON DUPLICATE KEY UPDATE fails = IF(last_at < NOW() - INTERVAL " . AOK_LOCK_MINUTES . " MINUTE, 1, fails + 1), last_at = NOW()")
        ->execute([':ip' => client_ip()]);
}

// True when the given password is correct. Performs the one-time migration from adminPass.
function check_password(string $pw): bool {
    $hash = stored_hash();
    if ($hash !== null) return password_verify($pw, $hash);
    $site = site_data();
    $legacy = (is_array($site) && isset($site['adminPass']) && $site['adminPass'] !== '') ? (string)$site['adminPass'] : 'admin123';
    if (!hash_equals($legacy, $pw)) return false;
    save_hash($pw);
    strip_legacy_password();
    return true;
}

function start_admin_session(): string {
    aok_session_start();
    session_regenerate_id(true);
    $_SESSION['aok_admin'] = true;
    $_SESSION['aok_csrf'] = bin2hex(random_bytes(24));
    return $_SESSION['aok_csrf'];
}

try {
    auth_tables();
} catch (Exception $e) {
    json_out(['ok' => false, 'error' => 'database_unavailable'], 503);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $authed = is_admin();
    json_out(['ok' => true, 'authed' => $authed, 'csrf' => $authed ? ($_SESSION['aok_csrf'] ?? '') : null]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);

$in = json_in();
$action = $in['action'] ?? '';

if ($action === 'login') {
    if (locked_out()) json_out(['ok' => false, 'error' => 'locked', 'minutes' => AOK_LOCK_MINUTES], 429);
    $ok = check_password((string)($in['password'] ?? ''));
    record_attempt($ok);
    if (!$ok) { usleep(400000); json_out(['ok' => false, 'error' => 'wrong_password'], 401); }
    $csrf = start_admin_session();
    json_out(['ok' => true, 'csrf' => $csrf, 'defaultPassword' => password_verify('admin123', (string)stored_hash())]);
}

if ($action === 'logout') {
    if (is_admin()) { $_SESSION = []; session_destroy(); }
    setcookie('aok_admin', '', ['expires' => time() - 3600, 'path' => '/', 'secure' => aok_https(), 'httponly' => true, 'samesite' => 'Lax']);
    json_out(['ok' => true]);
}

if ($action === 'change') {
    require_admin();
    $next = (string)($in['next'] ?? '');
    if (!password_verify((string)($in['current'] ?? ''), (string)stored_hash())) json_out(['ok' => false, 'error' => 'wrong_password'], 401);
    if (strlen($next) < 8) json_out(['ok' => false, 'error' => 'too_short'], 400);
    save_hash($next);
    json_out(['ok' => true]);
}

if ($action === 'forgot') {
    // The link only ever goes to the fixed recovery address, so asking for one reveals nothing and changes
    // nothing until the owner clicks it. At most one email every 3 minutes; a link works once, for 30 minutes.
    db()->exec("CREATE TABLE IF NOT EXISTS aok_reset (id INT PRIMARY KEY, token_hash CHAR(64) NOT NULL, expires_at DATETIME NOT NULL, sent_at DATETIME NOT NULL)");
    $recent = db()->query("SELECT 1 FROM aok_reset WHERE id = 1 AND sent_at > NOW() - INTERVAL 3 MINUTE")->fetch();
    if ($recent) json_out(['ok' => true, 'sent' => true, 'cooldown' => true]);
    $token = bin2hex(random_bytes(32));
    db()->prepare("REPLACE INTO aok_reset (id, token_hash, expires_at, sent_at) VALUES (1, :h, NOW() + INTERVAL 30 MINUTE, NOW())")
        ->execute([':h' => hash('sha256', $token)]);
    require_once __DIR__ . '/seo-lib.php';
    $link = aok_base(aok_site()) . '/api/reset-password.php?token=' . $token;   // the configured site address, never the request's Host
    $ms = mail_settings();
    $body = "Someone asked to reset the admin password of your Analysis of Karma website.\n\n"
          . "To choose a new password, open this link within 30 minutes (it works once):\n\n$link\n\n"
          . "If this wasn't you, ignore this email: your password stays as it is.\n\n"
          . 'Requested ' . date('r') . ' from IP ' . client_ip() . "\n";
    $headers = "From: " . $ms['from'] . "\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n";
    $sent = @mail(AOK_RECOVERY_EMAIL, 'Reset your Analysis of Karma admin password', $body, $headers);
    json_out(['ok' => true, 'sent' => (bool)$sent]);
}

json_out(['ok' => false, 'error' => 'unknown_action'], 400);
