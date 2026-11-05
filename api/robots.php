<?php
// Live robots.txt, served at /robots.txt (see .htaccess). Search engines are always allowed; AI crawlers
// are allowed or blocked individually from Admin -> AI & GEO. /api/ and /admin are closed to all.
require_once __DIR__ . '/discovery-lib.php';

header('Content-Type: text/plain; charset=utf-8');
header('X-AOK-Generated: robots');   // lets Admin -> SEO Health tell the live file from the static backup
echo aok_robots_text(aok_site());
