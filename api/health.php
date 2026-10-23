<?php
// Database diagnostic for the admin: visit https://yourdomain.com/api/health.php while logged in.
// It tells you exactly why saving might be failing. (Admin -> SEO Health covers everything else.)
require_once __DIR__ . '/db.php';
header('Content-Type: text/plain; charset=utf-8');
if (!is_admin()) { http_response_code(403); exit("Log in to the admin first, then open this page.\n"); }

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
    echo ($hasData  ? "[OK]   Table 'aok_site_data' exists.\n" : "[FAIL] Table 'aok_site_data' is MISSING.\n         -> Log in at /admin once: the tables are created automatically.\n");
    echo ($hasLeads ? "[OK]   Table 'aok_leads' exists.\n"     : "[FAIL] Table 'aok_leads' is MISSING.\n         -> Log in at /admin once: the tables are created automatically.\n");

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

} catch (Exception $e) {
    echo "[FAIL] Cannot connect to the database:\n       " . $e->getMessage() . "\n\n";
    echo "       Fix the values in api/config.php (use the FULL cPanel-prefixed names,\n";
    echo "       e.g. cpaneluser_dbname / cpaneluser_dbuser), then reload this page.\n";
}

echo "\nEverything else (rewrites, files, SEO): Admin -> SEO Health.\n";
