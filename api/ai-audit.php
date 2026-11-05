<?php
// Admin -> AI Audit -> "Run full site audit".
//
// Walks every indexable route from app_sitemap_urls(), renders the same server-side body a crawler or a
// JavaScript-less reader would get (app_main_html), and scores it with the shared heuristics engine. That is the
// point of doing this on the server: the browser can only see the content tree, while this sees the finished page.
//
//   POST {action:'run'}  ->  {ok, audit:{generatedAt, provider, summary, pages:[…]}}   (admin + CSRF)
//
// It deliberately does NOT write the cache into app_site_data itself. The admin's browser holds the live copy of
// that document and usually has unsaved edits; a server-side write into it would silently overwrite them — the
// exact failure AR-22 exists for. So the result is returned, and the editor commits it through its own save path.
// The stored cache is kept to scalars only (no sentences, no recommendations) so the page JSON stays small.
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/seo-lib.php';
require_once __DIR__ . '/ai-audit-lib.php';
require_once __DIR__ . '/text-history-lib.php';
require_once __DIR__ . '/app-compat.php';   // app_* names map to this site's aok_* engine
cors();
header('Cache-Control: no-store');
require_admin();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);

const APP_AUDIT_MAX_ROUTES = 300;   // a runaway sitemap shouldn't turn one click into a minute of CPU

// A stable id for each route that matches the keys the browser builds in auditTargets(), so the admin table can
// line the crawled score up with the live one.
function app_audit_key(array $r): string {
    $t = (string)($r['type'] ?? '');
    if ($t === 'service' || $t === 'post' || $t === 'page') return $t . ':' . (string)($r['item']['id'] ?? '');
    if ($t === 'matrix') return 'matrix:' . (string)($r['sslug'] ?? '') . '-in-' . (string)($r['city']['slug'] ?? '');
    return $t;
}
function app_audit_label(array $d, array $r): string {
    $t = (string)($r['type'] ?? '');
    if (in_array($t, ['service', 'post', 'page'], true)) return app_text((string)($r['item']['title'] ?? '')) ?: ucfirst($t);
    if ($t === 'matrix') return app_matrix_title($d, $r['service'], $r['city']);
    $names = ['home' => 'Home', 'about' => 'About', 'services' => 'Services', 'feature' => 'Feature',
              'blog' => 'Blog', 'faq' => 'FAQ', 'contact' => 'Contact'];
    return $names[$t] ?? ucfirst($t ?: 'Page');
}
// The prose of a rendered page. The business-details card (<address>: name, phone, a "Mon 09:00–17:00 · Tue …" hours
// list) and the service-areas list of place names are data, not writing: scored as prose they read as perfectly
// uniform, keyword-stuffed text and gave an untouched Contact page a 52% "AI" score. They stay on the page.
// Only the writing is scored. The address, the service-area list, navigation (breadcrumbs) and tables are
// data: a fee or a time repeated down a table column, or the page's own name in its breadcrumb, is the
// layout doing its job, not a phrase the writer repeated.
function app_audit_prose_html(string $html): string {
    $html = (string)preg_replace('#<address\b[^>]*>.*?</address>#is', ' ', $html);
    $html = (string)preg_replace('#<nav\b[^>]*>.*?</nav>#is', ' ', $html);
    $html = (string)preg_replace('#<table\b[^>]*>.*?</table>#is', ' ', $html);
    return (string)preg_replace('#<section\b[^>]*\bid="service-areas"[^>]*>.*?</section>#is', ' ', $html);
}

try {
    // a full audit is the natural moment to enforce the revision archive's 90-day window
    try { app_history_table(); app_history_purge(); } catch (Throwable $e) { error_log('ai-audit purge: ' . $e->getMessage()); }

    // the same document render.php builds pages from: the saved site, else the shipped defaults. site_data() alone
    // is null until the owner's first save, which made a fresh install's first audit fail.
    $d = app_site();
    $pages = []; $seen = []; $assessed = 0; $total = 0; $bands = ['green' => 0, 'amber' => 0, 'red' => 0];

    foreach (app_sitemap_urls($d) as $u) {
        if (count($pages) >= APP_AUDIT_MAX_ROUTES) break;
        $path = (string)parse_url((string)($u[0] ?? ''), PHP_URL_PATH);
        if ($path === '') $path = '/';
        $r = app_resolve($path, $d);
        if (in_array((string)$r['type'], ['redirect', '404', 'admin'], true)) continue;
        $key = app_audit_key($r);
        if ($key === '' || isset($seen[$key])) continue;      // a route can appear once only
        $seen[$key] = 1;

        $res = app_audit_run(app_audit_prose_html(app_main_html($d, $r)));
        $pages[] = [
            'key' => $key, 'label' => app_audit_label($d, $r), 'route' => $path,
            'words' => (int)$res['words'], 'ai' => (int)$res['ai_percentage'],
            'human' => (int)$res['human_percentage'], 'band' => (string)$res['band'],
            'reliable' => (bool)$res['reliable'],
        ];
        $total++;
        if ($res['reliable']) { $assessed++; $bands[$res['band']]++; }
    }

    $sum = 0; foreach ($pages as $p) if ($p['reliable']) $sum += $p['ai'];
    $audit = [
        'generatedAt' => gmdate('c'),
        'provider' => app_audit_provider(),
        'summary' => ['total' => $total, 'assessed' => $assessed,
                      'avgAi' => $assessed > 0 ? (int)round($sum / $assessed) : 0,
                      'green' => $bands['green'], 'amber' => $bands['amber'], 'red' => $bands['red']],
        'pages' => $pages,
    ];
    json_out(['ok' => true, 'audit' => $audit]);
} catch (Throwable $e) {
    error_log('ai-audit.php: ' . $e->getMessage());
    json_out(['ok' => false, 'error' => 'audit_failed'], 500);
}
