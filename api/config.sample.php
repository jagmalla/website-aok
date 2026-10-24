<?php
// TEMPLATE. On a new server, copy this file to api/config.php and fill in your A2 Hosting values.
// (The real api/config.php is never part of an update, so uploading new files can't overwrite it.)

// Database credentials
define('DB_HOST', 'localhost');
define('DB_NAME', '');
define('DB_USER', '');
define('DB_PASS', '');

// Email settings. MAIL_FROM is the sender of contact-form and password-reset emails.
// Enquiries go to the inbox set in Admin -> Settings, else AOK_CONTACT_EMAIL in api/db.php; reset links go to
// AOK_RECOVERY_EMAIL. To change those defaults here, uncomment:
//   define('CONTACT_EMAIL', 'you@example.com');
//   define('ADMIN_RECOVERY_EMAIL', 'owner@example.com');
define('MAIL_TO',   'analysisofkarma@gmail.com');   // kept for older code; no longer used
define('MAIL_FROM', 'noreply@analysisofkarma.com');

// Upload settings
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('UPLOAD_URL', '/uploads/');
define('MAX_UPLOAD_MB', 5);

// CORS — change to your domain before going live
define('ALLOWED_ORIGIN', 'https://www.analysisofkarma.com');

// Emergency admin access when the reset email can't arrive (see DEPLOY.md, Troubleshooting): with no password
// stored (table aok_auth emptied), this one-time password logs in once and must be replaced at once.
// Delete the line again afterwards.
//   define('ADMIN_SETUP_PASSWORD', 'a temporary password of 10+ characters');
