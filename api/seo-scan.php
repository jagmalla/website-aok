<?php
// Admin -> Pending SEO · AEO · GEO -> "Run the deep scan".
//
//   GET /api/seo-scan.php  ->  {ok, scan:{generatedAt, checks:[…], stats:{…}}}   (admin only)
//
// Renders every indexable route server-side to resolve its links and build its JSON-LD, so it is heavier than
// the other admin endpoints: the hub runs it on a button, never on every render. Read-only — it writes nothing.
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/seo-scan-lib.php';
require_once __DIR__ . '/app-compat.php';   // app_* names map to this site's aok_* engine
cors();
header('Cache-Control: no-store');
require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'GET') json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);

@set_time_limit(120);
try {
    json_out(['ok' => true, 'scan' => app_scan_run(app_site())]);
} catch (Throwable $e) {
    error_log('seo-scan.php: ' . $e->getMessage());
    json_out(['ok' => false, 'error' => 'scan_failed'], 500);
}
