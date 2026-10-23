<?php
// Live robots.txt, served at /robots.txt (see .htaccess). Search engines are always allowed; AI crawlers
// are allowed or blocked individually from Admin -> AI & GEO. /api/ and /admin are closed to all.
require_once __DIR__ . '/seo-lib.php';

$d = aok_site();
$base = aok_base($d);
$bots = (array)aok_get($d, 'ai.bots', []);
$t  = "# robots.txt for " . aok_brand($d) . " — generated from Admin > AI & GEO\n\n";
// A crawler with its own group ignores the "*" group, so every allowed group repeats the rules.
// /api/ is private, except /api/data.php: Google's renderer loads it to show the live content
// (the longer, more specific Allow wins for Google and Bing).
$rules = "Allow: /\nAllow: /api/data.php\nDisallow: /api/\nDisallow: /admin\n";
$t .= "User-agent: *\n" . $rules . "\n";
$t .= "# Search engines\n";
foreach (['Googlebot', 'Bingbot'] as $name) $t .= "User-agent: $name\n" . $rules . "\n";
$t .= "# AI search & assistant crawlers (Admin > AI & GEO)\n";
foreach ($bots as $name => $on) {
    if (!preg_match('/^[A-Za-z0-9._-]+$/', (string)$name)) continue;
    $t .= "User-agent: $name\n" . ($on ? $rules : "Disallow: /\n") . "\n";
}
$t .= "# Plain-language summary of this business for AI assistants: $base/llms.txt\n";
$t .= "Sitemap: $base/sitemap.xml\n";

header('Content-Type: text/plain; charset=utf-8');
header('X-AOK-Generated: robots');   // lets Admin -> SEO Health tell the live file from the static backup
echo $t;
