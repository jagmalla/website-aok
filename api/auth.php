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

const AOK_MAX_FAILS = 8;          // failed attempts allowed per visitor (IPv6: per /64 network) ...
const AOK_LOCK_MINUTES = 15;      // ... within this window
const AOK_ALERT_FAILS = 40;       // this many failed logins site-wide within an hour emails the owner (once an hour)

function auth_tables(): void {
    aok_ensure_tables();
    db()->exec("CREATE TABLE IF NOT EXISTS aok_auth (id INT PRIMARY KEY, pass_hash VARCHAR(255) NOT NULL, updated_at DATETIME)");
    db()->exec("CREATE TABLE IF NOT EXISTS aok_login_attempts (ip VARCHAR(64) PRIMARY KEY, fails INT NOT NULL DEFAULT 0, last_at DATETIME)");
    aok_auth_columns();
}

// must_change: the password has to be replaced before the admin can change anything. Set for a password carried
// over from the old public site data, and once for any password set before this security update (the old
// site published its password, so it can't be trusted).
function aok_auth_columns(): void {
    $cols = array_column(db()->query("SHOW COLUMNS FROM aok_auth")->fetchAll(), 'Field');
    if (!in_array('must_change', $cols, true)) {
        db()->exec("ALTER TABLE aok_auth ADD COLUMN must_change TINYINT NOT NULL DEFAULT 0");
        db()->exec("UPDATE aok_auth SET must_change = 1");
    }
}

function stored_hash(): ?string {
    $row = db()->query("SELECT pass_hash FROM aok_auth WHERE id = 1")->fetch();
    return $row ? $row['pass_hash'] : null;
}

function save_hash(string $plain, int $mustChange = 0): void {
    $stmt = db()->prepare("INSERT INTO aok_auth (id, pass_hash, updated_at, must_change) VALUES (1, :h1, NOW(), :m1)
                           ON DUPLICATE KEY UPDATE pass_hash = :h2, updated_at = NOW(), must_change = :m2");
    $h = password_hash($plain, PASSWORD_DEFAULT);
    $stmt->execute([':h1' => $h, ':h2' => $h, ':m1' => $mustChange, ':m2' => $mustChange]);
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

// The visitor, for the lockout: the IP address, or for IPv6 its /64 network (one connection owns a whole /64)
function client_ip(): string {
    $ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
    if (strpos($ip, ':') !== false && ($bin = @inet_pton($ip)) !== false && strlen($bin) === 16) {
        return substr(bin2hex(substr($bin, 0, 8)), 0, 16) . '::/64';
    }
    return substr($ip, 0, 64);
}

function locked_out(): bool {
    $st = db()->prepare("SELECT fails, last_at FROM aok_login_attempts WHERE ip = :ip");
    $st->execute([':ip' => client_ip()]);
    $r = $st->fetch();
    return $r && (int)$r['fails'] >= AOK_MAX_FAILS && strtotime($r['last_at']) > time() - AOK_LOCK_MINUTES * 60;
}

// Counts the attempt *before* the password is checked (so parallel guesses can't slip past the limit);
// a correct password clears the count again.
function count_attempt(): void {
    db()->prepare("INSERT INTO aok_login_attempts (ip, fails, last_at) VALUES (:ip, 1, NOW())
                   ON DUPLICATE KEY UPDATE fails = IF(last_at < NOW() - INTERVAL " . AOK_LOCK_MINUTES . " MINUTE, 1, fails + 1), last_at = NOW()")
        ->execute([':ip' => client_ip()]);
}
function clear_attempts(): void {
    db()->prepare("DELETE FROM aok_login_attempts WHERE ip = :ip")->execute([':ip' => client_ip()]);
}

function owner_mail(string $subject, string $body): void {
    $ms = mail_settings();
    @mail(AOK_RECOVERY_EMAIL, $subject, $body, "From: " . $ms['from'] . "\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n");
}

// Many failed logins across the whole site within an hour (someone trying passwords from many addresses):
// tell the owner, at most once an hour.
function watch_failures(): void {
    if (aok_rate_ok('loginfail', AOK_ALERT_FAILS, 3600)) return;
    if (!aok_rate_ok('loginalert', 1, 3600)) return;
    owner_mail('Analysis of Karma: many failed admin logins',
        "In the last hour there were more than " . AOK_ALERT_FAILS . " failed attempts to log in to your website's admin.\n\n"
        . "Each address is locked out after " . AOK_MAX_FAILS . " wrong passwords, so a strong password stays safe. If you didn't do this,\n"
        . "no action is needed; if your password is short or used elsewhere, change it in Admin -> Settings -> Security.\n");
}

// A sign-in from a device/network not seen in the last 90 days: tell the owner, so a stranger's login is noticed.
function note_login(): void {
    try {
        db()->exec("CREATE TABLE IF NOT EXISTS aok_known_logins (k CHAR(32) PRIMARY KEY, last_at DATETIME NOT NULL)");
        $k = substr(hash('sha256', 'aok-login|' . client_ip() . '|' . (string)($_SERVER['HTTP_USER_AGENT'] ?? '')), 0, 32);
        $st = db()->prepare("SELECT 1 FROM aok_known_logins WHERE k = :k AND last_at > NOW() - INTERVAL 90 DAY"); $st->execute([':k' => $k]);
        $known = (bool)$st->fetchColumn();
        db()->prepare("REPLACE INTO aok_known_logins (k, last_at) VALUES (:k, NOW())")->execute([':k' => $k]);
        if ($known) return;
        owner_mail('Analysis of Karma: new admin sign-in',
            "Someone just signed in to your website's admin from a device or network not used in the last 90 days.\n\n"
            . 'When: ' . date('r') . "\nNetwork: " . client_ip() . "\nBrowser: " . substr((string)($_SERVER['HTTP_USER_AGENT'] ?? 'unknown'), 0, 200) . "\n\n"
            . "If this was you, ignore this email. If not, use \"Forgot password?\" on the admin login now: choosing a new\n"
            . "password signs every other session out.\n");
    } catch (Throwable $e) {}
}

function must_change(): bool { return aok_must_change(); }

// True when the given password is correct. Performs the one-time migration from adminPass.
// No password has been set yet (fresh install): there is no default password any more. The owner sets the first
// one with "Forgot password?", whose link only goes to the private recovery address.
// A password carried over from the old site data is accepted once more, but must be changed straight away.
function check_password(string $pw): bool {
    $hash = stored_hash();
    if ($hash !== null) return password_verify($pw, $hash);
    // emergency access without email: a one-time password written into api/config.php (needs cPanel access)
    if (defined('ADMIN_SETUP_PASSWORD') && strlen((string)ADMIN_SETUP_PASSWORD) >= 10 && hash_equals((string)ADMIN_SETUP_PASSWORD, $pw)) {
        save_hash($pw, 1);   // must be replaced straight away
        return true;
    }
    $site = site_data();
    $legacy = (is_array($site) && isset($site['adminPass'])) ? (string)$site['adminPass'] : '';
    if ($legacy === '' || $legacy === 'admin123' || !hash_equals($legacy, $pw)) return false;
    save_hash($pw, 1);
    strip_legacy_password();
    return true;
}

function start_admin_session(): string {
    aok_session_start();
    session_regenerate_id(true);
    $_SESSION['aok_admin'] = true;
    $_SESSION['aok_csrf'] = bin2hex(random_bytes(24));
    $_SESSION['aok_t0'] = $_SESSION['aok_seen'] = time();
    $_SESSION['aok_pwv'] = aok_pw_stamp();   // a later password change or reset ends this session
    return $_SESSION['aok_csrf'];
}

try {
    auth_tables();
} catch (Exception $e) {
    json_out(['ok' => false, 'error' => 'database_unavailable'], 503);
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $authed = is_admin();
    json_out(['ok' => true, 'authed' => $authed, 'csrf' => $authed ? ($_SESSION['aok_csrf'] ?? '') : null, 'mustChange' => $authed && must_change(),
              'setup' => !$authed && stored_hash() === null]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);

$in = json_in_limited(8192);
$action = (string)($in['action'] ?? '');

if ($action === 'login') {
    if (locked_out()) json_out(['ok' => false, 'error' => 'locked', 'minutes' => AOK_LOCK_MINUTES], 429);
    count_attempt();
    if (stored_hash() === null && !defined('ADMIN_SETUP_PASSWORD') && (string)((site_data() ?? [])['adminPass'] ?? '') === '') json_out(['ok' => false, 'error' => 'setup_required'], 401);
    $ok = check_password((string)($in['password'] ?? ''));
    if (!$ok) { watch_failures(); json_out(['ok' => false, 'error' => 'wrong_password'], 401); }
    clear_attempts();
    strip_legacy_password();   // an old plain-text password left in the site data is removed on every login
    $csrf = start_admin_session();
    note_login();
    json_out(['ok' => true, 'csrf' => $csrf, 'mustChange' => must_change()]);
}

if ($action === 'logout') {
    if (session_status() === PHP_SESSION_ACTIVE || !empty($_COOKIE['aok_admin'])) { aok_session_start(); aok_end_session(); }
    else setcookie('aok_admin', '', ['expires' => time() - 3600, 'path' => '/', 'secure' => aok_https(), 'httponly' => true, 'samesite' => 'Lax']);
    json_out(['ok' => true]);
}

if ($action === 'change') {
    require_admin(true);   // allowed while a new password is required
    $next = (string)($in['next'] ?? '');
    if (!password_verify((string)($in['current'] ?? ''), (string)stored_hash())) json_out(['ok' => false, 'error' => 'wrong_password'], 401);
    if (($weak = aok_password_problem($next)) !== '') json_out(['ok' => false, 'error' => 'weak_password', 'message' => $weak], 400);
    if (hash_equals((string)($in['current'] ?? ''), $next)) json_out(['ok' => false, 'error' => 'weak_password', 'message' => 'Choose a password different from the current one.'], 400);
    save_hash($next, 0);
    session_regenerate_id(true);
    $_SESSION['aok_pwv'] = aok_pw_stamp();   // this session stays in; every other one (another device, a stolen cookie) is ended
    json_out(['ok' => true]);
}

if ($action === 'forgot') {
    // The link only ever goes to the fixed recovery address, so asking for one reveals nothing and changes
    // nothing until the owner clicks it. At most one email every 3 minutes; a link works once, for 30 minutes.
    db()->exec("CREATE TABLE IF NOT EXISTS aok_reset (id INT PRIMARY KEY, token_hash CHAR(64) NOT NULL, expires_at DATETIME NOT NULL, sent_at DATETIME NOT NULL)");
    // a link that is still valid stays valid (a stranger asking again can't cancel the owner's link), and at most
    // 6 emails a day, so the form can't be used to flood the recovery inbox
    $pending = db()->query("SELECT 1 FROM aok_reset WHERE id = 1 AND expires_at > NOW()")->fetch();
    if ($pending) json_out(['ok' => true, 'sent' => true, 'cooldown' => true]);
    if (!aok_rate_ok('forgot', 6, 86400)) json_out(['ok' => true, 'sent' => true, 'cooldown' => true]);
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
