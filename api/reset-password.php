<?php
// Admin password reset: the page the emailed link opens (api/auth.php, action "forgot", sends it).
//   GET  ?token=…                    -> form for a new password (if the link is valid and unused)
//   POST token, password, confirm    -> saves the new password, ends the link, clears login lockouts
// A link works once, for 30 minutes. Self-contained HTML, so it works with or without .htaccess.
require_once __DIR__ . '/db.php';
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-store');
header('X-Robots-Tag: noindex, nofollow');
header('X-Frame-Options: DENY');
header('Referrer-Policy: no-referrer');   // the token never leaves this page in a Referer header

$token = (string)($_POST['token'] ?? $_GET['token'] ?? '');
$state = 'invalid'; $error = '';

function reset_valid(string $token): bool {
    if (!preg_match('/^[a-f0-9]{64}$/', $token)) return false;
    try {
        $row = db()->query("SELECT token_hash FROM aok_reset WHERE id = 1 AND expires_at > NOW()")->fetch();
    } catch (Throwable $e) { return false; }   // no reset was ever requested (table missing)
    return $row && hash_equals((string)$row['token_hash'], hash('sha256', $token));
}

if (reset_valid($token)) {
    $state = 'form';
    if ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $pw = (string)($_POST['password'] ?? ''); $pw2 = (string)($_POST['confirm'] ?? '');
        if (strlen($pw) < 8) $error = 'The new password needs at least 8 characters.';
        elseif ($pw !== $pw2) $error = 'The two passwords do not match.';
        else {
            db()->exec("CREATE TABLE IF NOT EXISTS aok_auth (id INT PRIMARY KEY, pass_hash VARCHAR(255) NOT NULL, updated_at DATETIME)");
            $h = password_hash($pw, PASSWORD_DEFAULT);
            db()->prepare("INSERT INTO aok_auth (id, pass_hash, updated_at) VALUES (1, :h1, NOW()) ON DUPLICATE KEY UPDATE pass_hash = :h2, updated_at = NOW()")
                ->execute([':h1' => $h, ':h2' => $h]);
            db()->exec("DELETE FROM aok_reset");
            try { db()->exec("DELETE FROM aok_login_attempts"); } catch (Throwable $e) {}
            $state = 'done';
        }
    }
}

$e = function ($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); };
?><!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Reset admin password · Analysis of Karma</title>
<style>
body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;
  background:radial-gradient(900px 600px at 70% 30%,#fff,#FAF8F5 50%,#EFE6D4);font:16px/1.55 system-ui,-apple-system,"Segoe UI",sans-serif;color:#3A3D42}
.card{width:100%;max-width:420px;background:rgba(255,255,255,.88);border:1px solid rgba(166,132,70,.35);border-radius:22px;padding:38px 34px;box-shadow:0 30px 70px rgba(110,84,38,.14)}
h1{font:600 30px/1.15 Georgia,"Cormorant Garamond",serif;color:#1E2022;margin:0 0 8px}
.kick{font:600 12px system-ui,sans-serif;letter-spacing:.2em;text-transform:uppercase;color:#8C6D33;margin-bottom:14px}
p{margin:0 0 18px;color:#5A5D63}
label{display:block;font-weight:600;font-size:14px;margin:0 0 6px;color:#3A3D42}
input{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:12px;border:1px solid #D8CDB8;background:#fff;font-size:16px;margin-bottom:16px}
input:focus{outline:2px solid #C9A35E;border-color:#C9A35E}
button,.btn{display:inline-block;width:100%;box-sizing:border-box;text-align:center;padding:13px 18px;border:0;border-radius:999px;cursor:pointer;
  background:linear-gradient(135deg,#D9B97A,#B8904A);color:#1E2022;font-weight:700;font-size:15px;text-decoration:none}
.err{background:#FBEDEA;color:#9B2C1F;border-radius:10px;padding:10px 12px;margin-bottom:16px;font-size:14px}
</style></head><body><main class="card">
<div class="kick">Analysis of Karma · Admin</div>
<?php if ($state === 'done'): ?>
  <h1>Password changed</h1>
  <p>Your new admin password is saved. Any lockout from wrong attempts has been cleared.</p>
  <a class="btn" href="/#admin">Go to the admin login</a>
<?php elseif ($state === 'form'): ?>
  <h1>Choose a new password</h1>
  <p>At least 8 characters. This link works once and expires 30 minutes after it was sent.</p>
  <?php if ($error): ?><div class="err"><?= $e($error) ?></div><?php endif; ?>
  <form method="post" action="reset-password.php" autocomplete="off">
    <input type="hidden" name="token" value="<?= $e($token) ?>">
    <label for="pw">New password</label><input id="pw" type="password" name="password" minlength="8" required autocomplete="new-password" autofocus>
    <label for="pw2">Repeat the new password</label><input id="pw2" type="password" name="confirm" minlength="8" required autocomplete="new-password">
    <button type="submit">Save new password</button>
  </form>
<?php else: ?>
  <h1>This link has expired</h1>
  <p>Reset links work once and only for 30 minutes. Go back to the admin login and click “Forgot password?” to get a new one.</p>
  <a class="btn" href="/#admin">Back to the admin login</a>
<?php endif; ?>
</main></body></html>
