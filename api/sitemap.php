<?php
require_once __DIR__ . '/db.php';

// Dynamic sitemap — always reflects the CURRENT pages + published blog posts in the database.
// Served at /sitemap.xml (via .htaccess rewrite) so search engines always get the latest.
// POST (admin, ?action=write) also saves a static sitemap.xml snapshot to disk.

$site = site_data() ?: [];
$base = rtrim(($site['siteUrl'] ?? 'https://www.analysisofkarma.com'), '/');
$base = preg_replace('#^http://#', 'https://', $base);

$pages = [
    ['',           'monthly'],
    ['about',      'monthly'],
    ['services',   'monthly'],
    ['meditation', 'monthly'],
    ['blog',       'weekly'],
    ['contact',    'monthly'],
];

$xml  = '<?xml version="1.0" encoding="UTF-8"?>' . "\n";
$xml .= '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";

foreach ($pages as $p) {
    $loc = $base . ($p[0] ? '/' . $p[0] : '/');
    $xml .= "  <url>\n    <loc>" . htmlspecialchars($loc, ENT_XML1) . "</loc>\n    <changefreq>{$p[1]}</changefreq>\n  </url>\n";
}

$postCount = 0;
foreach (($site['blog'] ?? []) as $post) {
    if (empty($post['published'])) continue;          // only published posts
    $slug = $post['slug'] ?? '';
    if (!$slug) continue;
    $loc = $base . '/blog/' . rawurlencode($slug);
    $lastmod = '';
    if (!empty($post['date']) && preg_match('/^\d{4}-\d{2}-\d{2}/', $post['date'])) {
        $lastmod = "    <lastmod>" . htmlspecialchars(substr($post['date'], 0, 10)) . "</lastmod>\n";
    }
    $xml .= "  <url>\n    <loc>" . htmlspecialchars($loc, ENT_XML1) . "</loc>\n{$lastmod}    <changefreq>monthly</changefreq>\n  </url>\n";
    $postCount++;
}

$xml .= '</urlset>' . "\n";

// Admin action: also write a static snapshot to /sitemap-static.xml and return JSON
if ($_SERVER['REQUEST_METHOD'] === 'POST' || (($_GET['action'] ?? '') === 'write')) {
    cors();
    $written = @file_put_contents(__DIR__ . '/../sitemap-static.xml', $xml) !== false;
    json_out([
        'ok'        => true,
        'written'   => $written,
        'pages'     => count($pages),
        'posts'     => $postCount,
        'total'     => count($pages) + $postCount,
        'updatedAt' => date('c'),
        'url'       => $base . '/sitemap.xml',
    ]);
}

// Default: serve the live XML
header('Content-Type: application/xml; charset=utf-8');
header('X-Robots-Tag: noindex');
echo $xml;
