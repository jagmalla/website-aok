<?php
// POST /api/upgrade-content.php (admin session + CSRF)
// Admin -> SEO Health -> "Apply Full 32-Page Classical Content Upgrade": adds the classical sections from
// api/content/ to every service and blog post that doesn't have them yet, including pages you have edited
// (your text is kept; the sections are added after it). The automatic upgrade (api/upgrades.php) only
// does this for pages whose text is still as first shipped.
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/seo-lib.php';
cors();
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);
require_admin();
$d = site_data();
if ($d === null) json_out(['ok' => false, 'error' => 'no_data', 'message' => 'Save the site once in the admin first.'], 409);
$def = aok_defaults();
if (!$def) json_out(['ok' => false, 'error' => 'no_defaults'], 500);
$d = aok_upgrade_payload($d);
$res = aok_apply_content($d, $def, true);
if ($res['services'] || $res['posts']) {
    try {
        db()->prepare("UPDATE aok_site_data SET payload = :p, updated_at = NOW() WHERE id = 1")
            ->execute([':p' => json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)]);
    } catch (Throwable $e) {
        json_out(['ok' => false, 'error' => 'database'], 500);
    }
}
json_out(['ok' => true, 'services' => count($res['services']), 'posts' => count($res['posts']), 'updated' => array_merge($res['services'], $res['posts'])]);
