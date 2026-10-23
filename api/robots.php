<?php
// Live robots.txt, served at /robots.txt (see .htaccess). AI crawlers are allowed or blocked
// individually from Admin -> AI & GEO. Private endpoints are closed; /api/data.php stays open
// because Google's renderer needs it to show the live content.
require_once __DIR__ . '/seo-lib.php';

$d = aok_site();
$base = aok_base($d);
$bots = (array)aok_get($d, 'ai.bots', []);
$t  = "# robots.txt for " . aok_brand($d) . " — generated from Admin > AI & GEO\n\n";
// a crawler with its own group ignores the "*" group, so every allowed group repeats the private paths
$private = "Disallow: /admin\nDisallow: /api/auth.php\nDisallow: /api/upload.php\nDisallow: /api/test-email.php\nDisallow: /api/health.php\nDisallow: /api/seo-health.php\nDisallow: /api/contact.php\n";
$t .= "User-agent: *\nAllow: /\n" . $private . "\n";
$t .= "# AI search & assistant crawlers\n";
foreach ($bots as $name => $on) {
    if (!preg_match('/^[A-Za-z0-9._-]+$/', (string)$name)) continue;
    $t .= "User-agent: $name\n" . ($on ? "Allow: /\n" . $private : "Disallow: /\n") . "\n";
}
$t .= "# Plain-language summary of this business for AI assistants: $base/llms.txt\n";
$t .= "Sitemap: $base/sitemap.xml\n";

header('Content-Type: text/plain; charset=utf-8');
header('X-AOK-Generated: robots');   // lets Admin -> SEO Health tell the live file from the static backup
echo $t;
