<?php
require_once __DIR__ . '/db.php';
cors();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

$data = json_in();

// Basic validation
$name   = trim($data['Name'] ?? '');
$email  = trim($data['Email'] ?? '');
$reason = trim($data['Reason / Question'] ?? '');

if (!$name || !$reason) {
    json_out(['ok' => false, 'error' => 'missing_fields'], 400);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    json_out(['ok' => false, 'error' => 'invalid_email'], 400);
}

// Build the email body from all submitted fields
$lines = [];
$skip  = ['_subject', '_replyto', '_template', '_captcha'];
foreach ($data as $key => $val) {
    if (in_array($key, $skip, true)) continue;
    $lines[] = strtoupper($key) . ":\n" . $val . "\n";
}
$body = implode("\n", $lines);

$subject = $data['_subject'] ?? ('New enquiry from ' . $name . ' — Analysis of Karma');
$replyTo = filter_var($data['_replyto'] ?? $email, FILTER_VALIDATE_EMAIL) ?: $email;

// Recipient + from address come from the admin-managed settings (fall back to config)
$site = site_data();
$ms   = mail_settings($site);

$headers  = "From: " . $ms['from'] . "\r\n";
$headers .= "Reply-To: " . $replyTo . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = mail($ms['to'], $subject, $body, $headers);

// Build a lead record in the same shape the admin Leads tab expects
$lead = [
    'id'      => 'srv' . bin2hex(random_bytes(4)),
    'name'    => $name,
    'email'   => $email,
    'country' => $data['Country'] ?? '',
    'phone'   => $data['WhatsApp / Phone'] ?? '',
    'appt'    => $data['Preferred appointment (client local)'] ?? '',
    'apptVan' => $data['Appointment in Vancouver (PST)'] ?? '',
    'dob'     => $data['Date of Birth'] ?? '',
    'tob'     => $data['Time of Birth'] ?? '',
    'pob'     => $data['Place of Birth'] ?? '',
    'reason'  => $reason,
    'at'      => date('c'),
    'read'    => false,
];
// Strip the "-" placeholders the client sends for empty optional fields
foreach ($lead as $k => $v) { if ($v === '-') $lead[$k] = ''; }

try {
    // 1) Canonical backup log
    db()->prepare("INSERT INTO aok_leads (payload, created_at) VALUES (:p, NOW())")
        ->execute([':p' => json_encode($lead, JSON_UNESCAPED_UNICODE)]);

    // 2) Append into the site-data payload so it shows in the admin Leads tab
    if (is_array($site)) {
        if (!isset($site['leads']) || !is_array($site['leads'])) $site['leads'] = [];
        array_unshift($site['leads'], $lead);   // newest first
        $newPayload = json_encode($site, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        db()->prepare(
            "UPDATE aok_site_data SET payload = :p, updated_at = NOW() WHERE id = 1"
        )->execute([':p' => $newPayload]);
    }
} catch (Exception $e) {
    // Lead persistence is non-fatal — the email was already attempted
}

json_out(['ok' => true, 'mail' => $sent]);
