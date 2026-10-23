<?php
// TEMPLATE. On a new server, copy this file to api/config.php and fill in your A2 Hosting values.
// (The real api/config.php is never part of an update, so uploading new files can't overwrite it.)

// Database credentials
define('DB_HOST', 'localhost');
define('DB_NAME', '');
define('DB_USER', '');
define('DB_PASS', '');

// Email settings (used by contact.php)
define('MAIL_TO',   'analysisofkarma@gmail.com');
define('MAIL_FROM', 'noreply@analysisofkarma.com');

// Upload settings
define('UPLOAD_DIR', __DIR__ . '/../uploads/');
define('UPLOAD_URL', '/uploads/');
define('MAX_UPLOAD_MB', 5);

// CORS — change to your domain before going live
define('ALLOWED_ORIGIN', 'https://www.analysisofkarma.com');
