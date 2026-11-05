<?php
// The same scan the admin's Pending hub runs, from the command line — for a setup agent finishing a build, and
// as the last check before launch.   php tools/seo-scan.php [--defaults] [--json]
//
// Source: the SAVED site when api/config.php exists and its database answers, else the shipped content in
// api/defaults.json (same rule as tools/build-static.php). Exit code 1 if any blocker or important check fails,
// so it can gate a deployment script.
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }
$root = dirname(__DIR__);
$json = in_array('--json', $argv, true);
$useDb = !in_array('--defaults', $argv, true) && is_file($root . '/api/config.php');
if ($useDb) {
    try {
        require_once $root . '/api/config.php';
        new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS,
            [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_TIMEOUT => 3]);
    } catch (Throwable $e) { $useDb = false; fwrite(STDERR, "database not reachable: scanning api/defaults.json\n"); }
}
if (!$useDb) define('APP_OFFLINE', true);
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_HOST'] = 'www.{{DOMAIN}}';
require $root . '/api/db.php';
require $root . '/api/seo-scan-lib.php';

$scan = app_scan_run(app_site());
if ($json) { echo json_encode($scan, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), "\n"; }
else {
    $s = $scan['stats'];
    echo 'source         ', $useDb ? 'saved site (database)' : 'shipped defaults (api/defaults.json)', "\n";
    echo 'scanned        ', $s['routes'], ' pages · ', $s['links'], ' internal links · ', $s['redirects'], ' redirects · ',
         $s['schemaNodes'], ' schema nodes · ', $s['images'], " images\n\n";
    $rank = ['blocker' => 0, 'important' => 1, 'nice' => 2];
    $fails = array_values(array_filter($scan['checks'], function ($c) { return !$c['pass']; }));
    usort($fails, function ($a, $b) use ($rank) { return $rank[$a['sev']] <=> $rank[$b['sev']]; });
    foreach ($fails as $c) {
        printf("%-10s %-9s %s\n", strtoupper($c['sev']), $c['area'], $c['scope']['label'] . ': ' . $c['title']);
        if ($c['why'] !== '') echo str_repeat(' ', 20), $c['why'], "\n";
    }
    foreach ($scan['checks'] as $c) if ($c['pass']) echo "ok         ", $c['area'], str_repeat(' ', max(1, 10 - strlen($c['area']))), $c['title'], "\n";
    echo "\n", $fails ? count($fails) . " issue(s) found\n" : "no issues found\n";
}
$bad = 0;
foreach ($scan['checks'] as $c) if (!$c['pass'] && $c['sev'] !== 'nice') $bad++;
exit($bad > 0 ? 1 : 0);
