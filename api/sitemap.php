<?php
// Live XML sitemap, served at /sitemap.xml (see .htaccess). Always reflects the current site:
// main pages, the FAQ, every service page, published blog posts and custom pages.
// POST ?action=write (admin) also saves a static snapshot to /sitemap-static.xml as a backup.
require_once __DIR__ . '/seo-lib.php';

$d = aok_site();
$urls = aok_sitemap_urls($d);

$xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
foreach ($urls as $u) {
    $xml .= "  <url>\n    <loc>" . htmlspecialchars($u[0], ENT_XML1) . "</loc>\n    <lastmod>" . htmlspecialchars($u[1], ENT_XML1)
          . "</lastmod>\n    <changefreq>" . $u[2] . "</changefreq>\n  </url>\n";
}
$xml .= "</urlset>\n";

if ($_SERVER['REQUEST_METHOD'] === 'POST' || (($_GET['action'] ?? '') === 'write')) {
    cors();
    require_admin();   // only the admin may write files
    $written = @file_put_contents(__DIR__ . '/../sitemap-static.xml', $xml) !== false;
    $posts = count(array_filter($urls, function ($u) { return strpos($u[0], '/blog/') !== false; }));
    json_out(['ok' => true, 'written' => $written, 'pages' => count($urls) - $posts, 'posts' => $posts,
              'total' => count($urls), 'updatedAt' => date('c'), 'url' => aok_base($d) . '/sitemap.xml']);
}

header('Content-Type: application/xml; charset=utf-8');
header('X-AOK-Generated: sitemap');
header('X-Robots-Tag: noindex');
echo $xml;
