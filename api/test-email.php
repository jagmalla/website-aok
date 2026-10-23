<?php
require_once __DIR__ . '/db.php';
cors();

// Sends a test email so the admin can confirm delivery works.
// Optional POST body: { "to": "override@example.com" } to test an unsaved address.

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);
}

$in = json_in();
$ms = mail_settings();

// Allow testing an address typed in the admin before it's saved
$to = (!empty($in['to']) && filter_var($in['to'], FILTER_VALIDATE_EMAIL)) ? trim($in['to']) : $ms['to'];
$from = $ms['from'];

if (!filter_var($to, FILTER_VALIDATE_EMAIL)) {
    json_out(['ok' => false, 'error' => 'invalid_recipient'], 400);
}

$subject = 'Test email — Analysis of Karma';
$body  = "This is a test email from your Analysis of Karma website.\n\n";
$body .= "If you can read this, your contact-form email delivery is working correctly.\n\n";
$body .= "Sent at: " . date('r') . "\n";
$body .= "Delivered to: " . $to . "\n";
$body .= "From address: " . $from . "\n";

$headers  = "From: " . $from . "\r\n";
$headers .= "Reply-To: " . $to . "\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

$sent = @mail($to, $subject, $body, $headers);

json_out([
    'ok'   => true,
    'sent' => $sent,                 // PHP mail() accepted it for delivery
    'to'   => $to,
    'from' => $from,
]);
