<?php
// Live RSS 2.0 feed of recent blog posts, served at /rss.xml (see .htaccess). Always reflects the
// saved site. A static copy is also written to the web root on every save, as a fallback for a
// server whose rewrite rules are not active.
require_once __DIR__ . '/discovery-lib.php';

header('Content-Type: application/rss+xml; charset=utf-8');
header('X-AOK-Generated: rss');   // lets Admin -> SEO Health tell the live feed from the static backup
echo aok_rss_xml(aok_site());
