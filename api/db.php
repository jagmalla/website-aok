<?php
if (realpath((string)($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) { http_response_code(403); exit; }   // a library: never run on its own
require_once __DIR__ . '/upgrades.php';
// AOK_OFFLINE (tools/build-static.php): no database; everything falls back to api/defaults.json
if (defined('AOK_OFFLINE')) {
    // no config needed
} elseif (!is_file(__DIR__ . '/config.php')) {
    // render.php catches this and serves the plain page; API calls answer with a clear error
    throw new RuntimeException('api/config.php is missing: copy api/config.sample.php to api/config.php and fill in the database details.');
} else {
    require_once __DIR__ . '/config.php';
}

// Private email addresses. They live only here on the server: never in the site data, the page HTML, the
// structured data or llms.txt, so spam harvesters can't find them. config.php may override them.
//   AOK_CONTACT_EMAIL  receives contact-form enquiries (unless Admin -> Settings names another inbox)
//   AOK_RECOVERY_EMAIL receives admin password-reset links
define('AOK_CONTACT_EMAIL', defined('CONTACT_EMAIL') ? CONTACT_EMAIL : 'analysisofkarma@gmail.com');
define('AOK_RECOVERY_EMAIL', defined('ADMIN_RECOVERY_EMAIL') ? ADMIN_RECOVERY_EMAIL : 'jagmanmeet@gmail.com');

// ---------- Hardening shared by every request ----------
// PHP errors go to the server log, never to the visitor (they can reveal file paths and settings).
@ini_set('display_errors', '0');
@ini_set('log_errors', '1');
// a session id the server didn't create is refused (stops session fixation)
@ini_set('session.use_strict_mode', '1');
@ini_set('session.use_only_cookies', '1');
if (PHP_SAPI !== 'cli' && !headers_sent()) aok_security_headers();

// Security headers, sent by PHP so they apply even where the server's .htaccess is older.
// The page's Content-Security-Policy is added by render.php (it needs the page's inline-script hashes).
function aok_security_headers(): void {
    header_remove('X-Powered-By');   // don't advertise the PHP version
    header('X-Content-Type-Options: nosniff');
    header('X-Frame-Options: SAMEORIGIN');
    header('Referrer-Policy: strict-origin-when-cross-origin');
    header('Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()');
    header('Cross-Origin-Opener-Policy: same-origin');
    // HTTPS only from now on (the live domain over https only, so test copies are never pinned)
    if (aok_https() && aok_is_production_host()) header('Strict-Transport-Security: max-age=31536000');
}

// True on the site's own domain (www or not), as configured in api/config.php (ALLOWED_ORIGIN)
function aok_is_production_host(): bool {
    $want = strtolower((string)parse_url(defined('ALLOWED_ORIGIN') ? ALLOWED_ORIGIN : 'https://www.analysisofkarma.com', PHP_URL_HOST));
    $host = strtolower(preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? '')));
    return $host !== '' && preg_replace('/^www\./', '', $host) === preg_replace('/^www\./', '', $want);
}

// Why a new admin password is too weak ('' when it is fine): at least 10 characters, not a well-known one,
// not the site's name or the old default
function aok_password_problem(string $pw): string {
    if (mb_strlen($pw) < 10) return 'Use at least 10 characters — a short sentence you can remember works well.';
    $l = strtolower(preg_replace('/[^a-z0-9]/i', '', $pw));
    foreach (['password', 'admin123', 'qwerty', '123456', 'analysisofkarma', 'jagmallah', 'letmein', 'welcome', 'astrology'] as $bad) {
        if (strpos($l, $bad) !== false && strlen($l) < strlen($bad) + 6) return 'That password is too easy to guess — avoid common words and the site’s name.';
    }
    if (count(array_unique(str_split($pw))) < 5) return 'Use more different characters.';
    return '';
}

// A random secret this site keeps in its own database (made on first use), e.g. to sign the contact form's question
function aok_secret(string $name): string {
    db()->exec("CREATE TABLE IF NOT EXISTS aok_secrets (name VARCHAR(40) PRIMARY KEY, value CHAR(64) NOT NULL) DEFAULT CHARSET=utf8mb4");
    $st = db()->prepare("SELECT value FROM aok_secrets WHERE name = :n"); $st->execute([':n' => $name]);
    $v = $st->fetchColumn();
    if ($v) return (string)$v;
    db()->prepare("INSERT IGNORE INTO aok_secrets (name, value) VALUES (:n, :v)")->execute([':n' => $name, ':v' => bin2hex(random_bytes(32))]);
    $st->execute([':n' => $name]);
    return (string)$st->fetchColumn();
}

// The visitor's address, hashed: enough to count requests per visitor without keeping IP addresses
function aok_client_key(): string {
    return substr(hash('sha256', 'aok|' . (string)($_SERVER['REMOTE_ADDR'] ?? '')), 0, 32);
}

// Counts one hit for $key and says whether it is still within $limit hits per $seconds.
// Used for the contact form, the verification question and the login.
function aok_rate_ok(string $key, int $limit, int $seconds): bool {
    try {
        db()->exec("CREATE TABLE IF NOT EXISTS aok_rate (k VARCHAR(120) PRIMARY KEY, n INT NOT NULL, reset_at DATETIME NOT NULL) DEFAULT CHARSET=utf8mb4");
        db()->prepare("INSERT INTO aok_rate (k, n, reset_at) VALUES (:k, 1, NOW() + INTERVAL :s1 SECOND)
                       ON DUPLICATE KEY UPDATE n = IF(reset_at < NOW(), 1, n + 1), reset_at = IF(reset_at < NOW(), NOW() + INTERVAL :s2 SECOND, reset_at)")
            ->execute([':k' => substr($key, 0, 120), ':s1' => $seconds, ':s2' => $seconds]);
        $st = db()->prepare("SELECT n FROM aok_rate WHERE k = :k"); $st->execute([':k' => substr($key, 0, 120)]);
        if (random_int(1, 50) === 1) db()->exec("DELETE FROM aok_rate WHERE reset_at < NOW() - INTERVAL 1 DAY");
        return (int)$st->fetchColumn() <= $limit;
    } catch (Throwable $e) {
        return true;   // never block real visitors because the counter failed
    }
}

// The request body as JSON, refusing anything larger than $maxBytes (a form never needs megabytes)
function json_in_limited(int $maxBytes): array {
    $len = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($len > $maxBytes) json_out(['ok' => false, 'error' => 'too_large'], 413);
    $raw = (string)file_get_contents('php://input', false, null, 0, $maxBytes + 1);
    if (strlen($raw) > $maxBytes) json_out(['ok' => false, 'error' => 'too_large'], 413);
    $d = json_decode($raw, true);
    return is_array($d) ? $d : [];
}

function db(): PDO {
    static $pdo = null;
    if ($pdo !== null) return $pdo;
    if (defined('AOK_OFFLINE')) throw new RuntimeException('offline');
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
    // Allow the configured domain (and localhost origins only on a local test copy)
    $local = preg_match('#^(localhost|127\.0\.0\.1)(:\d+)?$#', (string)($_SERVER['HTTP_HOST'] ?? ''));
    if ($origin === ALLOWED_ORIGIN || ($local && preg_match('#^https?://localhost(:\d+)?$#', $origin))) {
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
    header("Content-Security-Policy: default-src 'none'; frame-ancestors 'none'");
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

// Enquiries live only in aok_leads (Admin -> Leads, api/leads.php). Earlier versions also kept a copy inside the
// site data; this moves anything only that copy had into the table (with its read mark) and removes the copy, once.
// Older rows the copy no longer listed (deleted in the admin then, or dropped by a save that overlapped an
// enquiry) are kept, marked read and "restored", so nothing is lost; the owner can delete them again.
function aok_leads_migrate(): void {
    $row = db()->query("SELECT payload FROM aok_site_data WHERE id = 1")->fetch();
    if (!$row || strpos((string)$row['payload'], '"leads"') === false) return;
    $d = json_decode((string)$row['payload'], true);
    if (!is_array($d) || !array_key_exists('leads', $d)) return;
    $copy = is_array($d['leads']) ? $d['leads'] : [];
    $inCopy = []; foreach ($copy as $l) if (is_array($l) && !empty($l['id'])) $inCopy[(string)$l['id']] = $l;
    $have = [];
    foreach (db()->query("SELECT id, payload FROM aok_leads")->fetchAll() as $r) {
        $p = json_decode((string)$r['payload'], true);
        if (is_array($p) && !empty($p['id'])) $have[(string)$p['id']] = [(int)$r['id'], $p];
    }
    $upd = db()->prepare("UPDATE aok_leads SET payload = :p WHERE id = :id");
    $ins = db()->prepare("INSERT INTO aok_leads (payload, created_at) VALUES (:p, :c)");
    $enc = function ($p) { return json_encode($p, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); };
    foreach ($have as $id => [$rowId, $p]) {
        if (isset($inCopy[$id])) { if (!empty($inCopy[$id]['read']) && empty($p['read'])) { $p['read'] = true; $upd->execute([':p' => $enc($p), ':id' => $rowId]); } }
        elseif ((int)($p['v'] ?? 0) < 2) { $p['read'] = true; $p['restored'] = true; $upd->execute([':p' => $enc($p), ':id' => $rowId]); }   // (new enquiries are never in the copy)
    }
    foreach (array_reverse($copy) as $l) {   // oldest first, so newer enquiries keep higher ids
        if (!is_array($l)) continue;
        $id = (string)($l['id'] ?? '');
        if ($id !== '' && isset($have[$id])) continue;
        if ($id === '') $l['id'] = 'm' . bin2hex(random_bytes(4));
        $t = strtotime((string)($l['at'] ?? '')) ?: time();
        $ins->execute([':p' => $enc($l), ':c' => date('Y-m-d H:i:s', $t)]);
    }
    unset($d['leads']);
    db()->prepare("UPDATE aok_site_data SET payload = :p WHERE id = 1")->execute([':p' => $enc($d)]);
}

// Load the saved site-data payload as an array (or null if none saved yet)
function site_data(): ?array {
    try {
        $row = db()->query("SELECT payload FROM aok_site_data WHERE id = 1")->fetch();
        if ($row && !empty($row['payload'])) {
            $d = json_decode($row['payload'], true);
            if (!is_array($d)) return null;
            // one-time content upgrades (api/upgrades.php), saved back so they run only once
            if ((int)($d['contentVersion'] ?? 0) < AOK_CONTENT_VERSION) {
                $d = aok_upgrade_payload($d);
                if ((int)($d['contentVersion'] ?? 0) >= AOK_CONTENT_VERSION) {
                    db()->prepare("UPDATE aok_site_data SET payload = :p, updated_at = NOW() WHERE id = 1")
                        ->execute([':p' => json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
                }
            }
            return $d;
        }
    } catch (Throwable $e) {}
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

const AOK_IDLE_HOURS = 8;   // an admin session ends after this long without activity …
const AOK_MAX_DAYS = 7;     // … and after a week in any case

// A fingerprint of the current password hash: a session made before the password changed (or was reset) stops working
function aok_pw_stamp(): string {
    try {
        $h = db()->query("SELECT pass_hash FROM aok_auth WHERE id = 1")->fetchColumn();
        return $h ? substr(hash('sha256', (string)$h), 0, 16) : '';
    } catch (Throwable $e) { return ''; }
}

function aok_end_session(): void {
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) session_destroy();
    if (!headers_sent()) setcookie('aok_admin', '', ['expires' => time() - 3600, 'path' => '/', 'secure' => aok_https(), 'httponly' => true, 'samesite' => 'Lax']);
}

function is_admin(): bool {
    static $ok = null;
    if ($ok !== null) return $ok;
    if (session_status() !== PHP_SESSION_ACTIVE) {
        if (empty($_COOKIE['aok_admin'])) return $ok = false;
        aok_session_start();
    }
    if (empty($_SESSION['aok_admin'])) return $ok = false;
    $now = time();
    $fresh = $now - (int)($_SESSION['aok_seen'] ?? 0) < AOK_IDLE_HOURS * 3600
          && $now - (int)($_SESSION['aok_t0'] ?? 0) < AOK_MAX_DAYS * 86400
          && hash_equals(aok_pw_stamp(), (string)($_SESSION['aok_pwv'] ?? '-'));
    if (!$fresh) { aok_end_session(); return $ok = false; }
    if ($now - (int)$_SESSION['aok_seen'] > 60) $_SESSION['aok_seen'] = $now;
    return $ok = true;
}

// True while the admin password has to be replaced (see api/auth.php): nothing can be changed until it is
function aok_must_change(): bool {
    static $m = null;
    if ($m !== null) return $m;
    try { return $m = ((int)db()->query("SELECT must_change FROM aok_auth WHERE id = 1")->fetchColumn() === 1); } catch (Throwable $e) { return $m = false; }
}

// Stops the request with 401/403 unless the caller is the logged-in admin.
// Any non-GET request must also carry the session's CSRF token in the X-AOK-CSRF header, and is refused while
// a new password is required (except the password change itself).
function require_admin(bool $passwordChange = false): void {
    if (!is_admin()) json_out(['ok' => false, 'error' => 'not_logged_in'], 401);
    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
        $sent = $_SERVER['HTTP_X_AOK_CSRF'] ?? '';
        if ($sent === '' || !hash_equals((string)($_SESSION['aok_csrf'] ?? ''), $sent)) {
            json_out(['ok' => false, 'error' => 'bad_csrf'], 403);
        }
        if (!$passwordChange && aok_must_change()) json_out(['ok' => false, 'error' => 'password_change_required'], 403);
    }
}

// What the public (and search engines) may see of the site data: never credentials or client leads.
function public_payload(array $d): array {
    unset($d['adminPass'], $d['leads']);
    // draft blog posts: only their address stays public (so the page knows the post exists), never their text
    if (isset($d['blog']) && is_array($d['blog'])) {
        foreach ($d['blog'] as $i => $p) {
            if (is_array($p) && array_key_exists('published', $p) && $p['published'] === false) $d['blog'][$i] = ['id' => $p['id'] ?? '', 'slug' => $p['slug'] ?? '', 'published' => false, 'title' => '', 'excerpt' => '', 'body' => ''];
        }
    }
    // email addresses are private (spam): the contact form is the only way to write in
    $priv = array_filter([trim((string)($d['contact']['email'] ?? '')), trim((string)($d['contact']['mailFrom'] ?? '')), AOK_CONTACT_EMAIL, AOK_RECOVERY_EMAIL,
        defined('MAIL_TO') ? MAIL_TO : '', defined('MAIL_FROM') ? MAIL_FROM : '']);
    if (isset($d['contact']) && is_array($d['contact'])) unset($d['contact']['email'], $d['contact']['mailFrom']);
    return aok_scrub_emails($d, array_values(array_unique($priv)));
}

// Replaces the private addresses wherever they were typed into page text: links go to /contact,
// plain mentions become "the contact form".
function aok_scrub_emails($v, array $addrs) {
    if (is_array($v)) { foreach ($v as $k => $x) $v[$k] = aok_scrub_emails($x, $addrs); return $v; }
    if (!is_string($v) || $v === '' || strpos($v, '@') === false) return $v;
    foreach ($addrs as $a) {
        $q = preg_quote($a, '/');
        $v = preg_replace('/mailto:' . $q . '(\?[^"\'\s>]*)?/i', '/contact', $v);
        $v = preg_replace('/' . $q . '/i', 'the contact form', $v);
    }
    return $v;
}

// Resolve the recipient + from address: the admin's private settings win, then AOK_CONTACT_EMAIL / MAIL_FROM
function mail_settings(?array $site = null): array {
    if ($site === null) $site = site_data();
    $c = $site['contact'] ?? [];
    $to   = (!empty($c['email'])    && filter_var($c['email'],    FILTER_VALIDATE_EMAIL)) ? $c['email']    : AOK_CONTACT_EMAIL;
    $from = (!empty($c['mailFrom']) && filter_var($c['mailFrom'], FILTER_VALIDATE_EMAIL)) ? $c['mailFrom'] : (defined('MAIL_FROM') ? MAIL_FROM : 'noreply@analysisofkarma.com');
    return ['to' => $to, 'from' => $from];
}
