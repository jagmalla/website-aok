<?php
// One-time diagnostic. Visit https://yourdomain.com/api/health.php in your browser.
// It tells you exactly why saving might be failing. DELETE this file when done.
require_once __DIR__ . '/config.php';
header('Content-Type: text/plain; charset=utf-8');

echo "Analysis of Karma — health check\n";
echo "================================\n\n";
echo "PHP version : " . PHP_VERSION . "\n";
echo "DB_HOST     : " . DB_HOST . "\n";
echo "DB_NAME     : " . DB_NAME . "\n";
echo "DB_USER     : " . DB_USER . "\n";
$passSet = (DB_PASS !== '' && DB_PASS !== 'your_database_password');
echo "DB_PASS     : " . ($passSet ? "set" : "NOT SET — still the placeholder!") . "\n\n";

try {
    $pdo = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
    echo "[OK]   Connected to the database.\n";

    $hasData  = count($pdo->query("SHOW TABLES LIKE 'aok_site_data'")->fetchAll()) > 0;
    $hasLeads = count($pdo->query("SHOW TABLES LIKE 'aok_leads'")->fetchAll()) > 0;
    echo ($hasData  ? "[OK]   Table 'aok_site_data' exists.\n" : "[FAIL] Table 'aok_site_data' is MISSING.\n         -> Run install.php once (see below).\n");
    echo ($hasLeads ? "[OK]   Table 'aok_leads' exists.\n"     : "[FAIL] Table 'aok_leads' is MISSING.\n         -> Run install.php once (see below).\n");

    try {
        $pdo->exec("CREATE TABLE IF NOT EXISTS aok_health_test (id INT PRIMARY KEY)");
        $pdo->exec("INSERT INTO aok_health_test (id) VALUES (1) ON DUPLICATE KEY UPDATE id=1");
        $pdo->exec("DROP TABLE aok_health_test");
        echo "[OK]   Database WRITE permission works. Saving should work.\n";
    } catch (Exception $e) {
        echo "[FAIL] No WRITE permission: " . $e->getMessage() . "\n";
        echo "         -> In cPanel - MySQL Databases - 'Add User To Database',\n";
        echo "            add your user to the database and tick ALL PRIVILEGES.\n";
    }

    if (!$hasData || !$hasLeads) {
        $key = 'setup_' . substr(md5(DB_PASS), 0, 8);
        echo "\nTo create the missing tables, open:\n";
        echo "   https://" . ($_SERVER['HTTP_HOST'] ?? 'yourdomain.com') . "/install.php?key=" . $key . "\n";
    }
} catch (Exception $e) {
    echo "[FAIL] Cannot connect to the database:\n       " . $e->getMessage() . "\n\n";
    echo "       Fix the values in api/config.php (use the FULL cPanel-prefixed names,\n";
    echo "       e.g. cpaneluser_dbname / cpaneluser_dbuser), then reload this page.\n";
}

echo "\n(Delete this file, api/health.php, once everything shows [OK].)\n";
