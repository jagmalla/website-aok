<?php
// Contact & booking form.
//   GET  ?challenge=1  -> {ok, q, token}: the verification question ("4 + 7"). The answer is checked here on the
//                         server; the token is signed and expires after 30 minutes.
//   POST {Name, Email, Reason / Question, …optional fields, _token, _answer, _hp}
//                      -> emails the enquiry to the private inbox and stores it for Admin -> Leads.
// Spam protection, all on the server: a 64 KB size limit, text-only fields with length limits, a hidden
// honeypot field, at least 3 seconds between question and answer, the signed question (each one works once),
// and rate limits (per visitor: 5 per 10 minutes and 20 a day; the whole site: 60 an hour).
require_once __DIR__ . '/db.php';
cors();
header('Cache-Control: no-store');

// The fields the form sends, in the order the email lists them, with their maximum lengths
const AOK_FORM_FIELDS = [
    'Service' => 120, 'Name' => 120, 'Email' => 254, 'WhatsApp / Phone' => 40, 'Country' => 80,
    'Preferred appointment (client local)' => 120, 'Appointment in Vancouver (PST)' => 120,
    'Date of Birth' => 40, 'Time of Birth' => 40, 'Place of Birth' => 160, 'Reason / Question' => 5000,
];
const AOK_FORM_TTL = 1800;   // seconds a verification question stays valid
const AOK_FORM_MIN = 3;      // seconds a person needs at least to read the question and answer it

// Signing key for the verification questions: a random secret kept in the site's database, never sent anywhere
function aok_form_key(): string {
    static $k = null;
    if ($k === null) { try { $k = aok_secret('contact-form'); } catch (Throwable $e) { $k = hash('sha256', 'aok-form|' . (defined('DB_PASS') ? DB_PASS : '') . '|' . __DIR__); } }
    return $k;
}
function aok_form_sign(int $issued, string $nonce, int $answer): string {
    return hash_hmac('sha256', $issued . '|' . $nonce . '|' . $answer, aok_form_key());
}

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['challenge'])) {
    if (!aok_rate_ok('q:' . aok_client_key(), 60, 600)) json_out(['ok' => false, 'error' => 'rate_limited'], 429);
    $a = random_int(2, 9); $b = random_int(2, 9); $issued = time(); $nonce = bin2hex(random_bytes(8));
    json_out(['ok' => true, 'q' => $a . ' + ' . $b, 'token' => $issued . '.' . $nonce . '.' . aok_form_sign($issued, $nonce, $a + $b)]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

$data = json_in_limited(65536);

// a filled-in hidden field means a bot: answer "sent" so it moves on, but send and store nothing
if (trim((string)($data['_hp'] ?? $data['website'] ?? '')) !== '') json_out(['ok' => true, 'mail' => true]);

// every field is plain text within its length limit
$f = [];
foreach (AOK_FORM_FIELDS as $key => $max) {
    $v = $data[$key] ?? '';
    if (!is_string($v) && !is_int($v)) json_out(['ok' => false, 'error' => 'invalid_field', 'field' => $key], 400);
    $v = trim(str_replace("\0", '', (string)$v));
    if (mb_strlen($v) > $max) json_out(['ok' => false, 'error' => 'too_long', 'field' => $key], 400);
    $f[$key] = ($v === '-') ? '' : $v;   // "-" is the form's placeholder for an empty optional field
}
if ($f['Name'] === '' || $f['Reason / Question'] === '') json_out(['ok' => false, 'error' => 'missing_fields'], 400);
if (!filter_var($f['Email'], FILTER_VALIDATE_EMAIL)) json_out(['ok' => false, 'error' => 'invalid_email'], 400);

// the verification question: signed by this server, answered correctly, not too fast, not too old, used once
$tok = explode('.', (string)($data['_token'] ?? ''));
$answer = trim((string)($data['_answer'] ?? ''));
$issued = (int)($tok[0] ?? 0);
$valid = count($tok) === 3 && preg_match('/^[a-f0-9]{16}$/', $tok[1]) && preg_match('/^\d{1,3}$/', $answer)
    && $issued <= time() && $issued > time() - AOK_FORM_TTL
    && hash_equals(aok_form_sign($issued, $tok[1], (int)$answer), (string)$tok[2]);
if (!$valid) json_out(['ok' => false, 'error' => 'verification'], 400);
if (time() - $issued < AOK_FORM_MIN) json_out(['ok' => false, 'error' => 'too_fast'], 400);
if (!aok_rate_ok('n:' . $tok[1], 1, AOK_FORM_TTL + 60)) json_out(['ok' => false, 'error' => 'verification'], 400);

// rate limits per visitor; above 60 enquiries an hour site-wide (a flood from many addresses) they are still
// stored for Admin -> Leads but no longer emailed one by one, so real visitors are never turned away
$who = aok_client_key();
if (!aok_rate_ok('c10:' . $who, 5, 600) || !aok_rate_ok('cday:' . $who, 20, 86400)) {
    json_out(['ok' => false, 'error' => 'rate_limited'], 429);
}
$flood = !aok_rate_ok('call', 60, 3600);
if (!aok_rate_ok('cstore', 2000, 86400)) json_out(['ok' => false, 'error' => 'rate_limited'], 429);   // hard cap a day

// the email: the subject is built here (never taken from the request), plain text, known fields only
$oneLine = function ($s) { return trim(preg_replace('/[\r\n\t]+/', ' ', (string)$s)); };
$subject = $f['Service'] !== ''
    ? 'Booking request: ' . $oneLine($f['Service']) . ' — ' . $oneLine($f['Name']) . ' — Analysis of Karma'
    : 'New enquiry from ' . $oneLine($f['Name']) . ' — Analysis of Karma';
$subject = '=?UTF-8?B?' . base64_encode(mb_substr($subject, 0, 200)) . '?=';
$lines = [];
foreach ($f as $key => $v) if ($v !== '') $lines[] = strtoupper($key) . ":\n" . $v . "\n";
$body = implode("\n", $lines) . "\n—\nSent from the website contact form. Reply to this email to answer " . $oneLine($f['Name']) . ".\n";

$ms = mail_settings();
$headers  = "From: " . $ms['from'] . "\r\n";
$headers .= "Reply-To: " . $f['Email'] . "\r\n";   // validated above, so it can't carry extra headers
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";
$sent = $flood ? false : @mail($ms['to'], $subject, $body, $headers);
if ($flood && aok_rate_ok('cfloodnote', 1, 3600)) {
    @mail($ms['to'], '=?UTF-8?B?' . base64_encode('Analysis of Karma: many enquiries this hour') . '?=',
        "More than 60 contact-form messages arrived in the last hour, so the rest of this hour's messages are saved in Admin -> Leads\n"
        . "without an email each. If they look like spam, nothing else is needed; real enquiries are all in the Leads tab.\n", $headers);
}

// the enquiry for Admin -> Leads (its own table: never part of the site data)
$lead = [
    'id' => 'srv' . bin2hex(random_bytes(4)), 'service' => $f['Service'], 'name' => $f['Name'], 'email' => $f['Email'],
    'country' => $f['Country'], 'phone' => $f['WhatsApp / Phone'], 'appt' => $f['Preferred appointment (client local)'],
    'apptVan' => $f['Appointment in Vancouver (PST)'], 'dob' => $f['Date of Birth'], 'tob' => $f['Time of Birth'],
    'pob' => $f['Place of Birth'], 'reason' => $f['Reason / Question'], 'at' => date('c'), 'read' => false,
    'v' => 2,   // stored by this version: only in aok_leads, never in the site data
];
$stored = false;
try {
    aok_ensure_tables();
    db()->prepare("INSERT INTO aok_leads (payload, created_at) VALUES (:p, NOW())")
        ->execute([':p' => json_encode($lead, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
    $stored = true;
} catch (Throwable $e) {
    error_log('contact.php: could not store the enquiry: ' . $e->getMessage());
}

if (!$sent && !$stored) json_out(['ok' => false, 'error' => 'not_delivered'], 500);
json_out(['ok' => true, 'mail' => (bool)$sent]);
