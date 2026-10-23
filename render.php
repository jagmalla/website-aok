<?php
// Server-side renderer for every page URL (see .htaccess).
// It takes index.html as the template and fills in, for the requested page:
//   - one <title>, meta description, robots, canonical URL, Open Graph / Twitter tags
//   - the structured-data graph (business, practitioner, services, FAQ, articles, breadcrumbs)
//   - a semantic HTML version of the page content inside #root (real text, real links)
// and answers with the right status (200 / 301 / 404). Browsers then start the interactive
// site exactly as before. If anything here fails, the plain index.html is served instead.

$tplFile = __DIR__ . '/index.html';

function aok_fallback(string $tplFile): void {
    if (!headers_sent()) header('Content-Type: text/html; charset=utf-8');
    readfile($tplFile);
    exit;
}

try {
    require_once __DIR__ . '/api/seo-lib.php';
    $tpl = file_get_contents($tplFile);
    if ($tpl === false || strpos($tpl, '<div id="root"></div>') === false) aok_fallback($tplFile);

    $d = aok_site();
    $uri = $_SERVER['REQUEST_URI'] ?? '/';
    // reached through ErrorDocument 404 (a missing file): render the not-found page
    $r = (($_SERVER['REDIRECT_STATUS'] ?? '') === '404' && !preg_match('#^/(index\.html|render\.php)?$#', parse_url($uri, PHP_URL_PATH)))
        ? ['type' => '404', 'path' => parse_url($uri, PHP_URL_PATH)]
        : aok_resolve($uri, $d);

    if ($r['type'] === 'redirect') {
        $to = $r['to'];
        if (!preg_match('#^https?://#i', $to)) $to = '/' . ltrim($to, '/');
        header('Location: ' . $to, true, 301);
        exit;
    }

    $m = aok_meta($d, $r);
    $graph = aok_graph($d, $r, $m);
    $e = 'aok_e';

    $head = '<title>' . $e($m['title']) . "</title>\n"
        . '<meta name="description" content="' . $e($m['description']) . '" data-aok="1">' . "\n"
        . '<meta name="robots" content="' . $e($m['robots']) . '" data-aok="1">' . "\n"
        . ($m['canonical'] !== '' ? '<link rel="canonical" href="' . $e($m['canonical']) . '">' . "\n" : '')
        . '<meta property="og:site_name" content="' . $e(aok_brand($d)) . '">' . "\n"
        . '<meta property="og:locale" content="en_CA">' . "\n"
        . '<meta property="og:type" content="' . $e($m['ogType']) . '">' . "\n"
        . '<meta property="og:title" content="' . $e($m['title']) . '">' . "\n"
        . '<meta property="og:description" content="' . $e($m['description']) . '">' . "\n"
        . ($m['canonical'] !== '' ? '<meta property="og:url" content="' . $e($m['canonical']) . '">' . "\n" : '')
        . '<meta property="og:image" content="' . $e($m['image']) . '">' . "\n"
        . '<meta name="twitter:card" content="summary_large_image">' . "\n"
        . '<meta name="twitter:title" content="' . $e($m['title']) . '">' . "\n"
        . '<meta name="twitter:description" content="' . $e($m['description']) . '">' . "\n"
        . '<meta name="twitter:image" content="' . $e($m['image']) . '">' . "\n"
        . '<meta name="geo.region" content="' . $e(aok_get($d, 'local.country', 'CA') . '-' . aok_get($d, 'local.regionCode', 'BC')) . '">' . "\n"
        . '<meta name="geo.placename" content="' . $e(aok_get($d, 'local.locality', 'Surrey')) . '">' . "\n";
    $lat = trim((string)aok_get($d, 'local.lat', '')); $lng = trim((string)aok_get($d, 'local.lng', ''));
    if (is_numeric($lat) && is_numeric($lng)) $head .= '<meta name="geo.position" content="' . $e($lat . ';' . $lng) . '">' . "\n" . '<meta name="ICBM" content="' . $e($lat . ', ' . $lng) . '">' . "\n";
    $head .= '<link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt">' . "\n"
        . '<script type="application/ld+json" id="aok-graph">' . json_encode($graph, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) . "</script>\n"
        // the server-rendered copy is for crawlers and no-JS visitors; while the interactive page starts
        // it stays invisible (with a safety reveal after 4s in case scripts are blocked)
        . "<script>document.documentElement.className+=' aok-js'</script>\n"
        . '<style>.aok-ssr{max-width:1100px;margin:0 auto;padding:24px;font:16px/1.7 system-ui,sans-serif;color:#3A3D42}.aok-ssr h1,.aok-ssr h2,.aok-ssr h3{font-family:Georgia,serif;color:#1E2022}.aok-ssr ul{padding-left:20px}.aok-ssr header ul,.aok-ssr footer ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:6px 18px}.aok-ssr a{color:#8A6A2E}.aok-ssr-btn{display:inline-block;margin:4px 8px 4px 0;padding:10px 18px;border:1px solid #C5A869;border-radius:999px;text-decoration:none}'
        . '.aok-js .aok-ssr{visibility:hidden;animation:aokssr 0s 4s forwards}@keyframes aokssr{to{visibility:visible}}</style>' . "\n";

    // one title + description: replace the template's static ones
    $html = preg_replace('#<title>.*?</title>\s*#s', '', $tpl, 1);
    $html = preg_replace('#<meta name="description"[^>]*>\s*#', '', $html, 1);
    $html = str_replace('</head>', $head . '</head>', $html);
    // cache-busting version for the app script (Step 8): /assets/app.js?v=<last change>
    $app = __DIR__ . '/assets/app.js';
    if (is_file($app)) $html = preg_replace('#(/assets/app\.js)\?v=[^"\']*#', '$1?v=' . filemtime($app), $html);
    $ssr = '<div class="aok-ssr">' . aok_html_header($d) . aok_main_html($d, $r) . aok_html_footer($d) . '</div>';
    $html = str_replace('<div id="root"></div>', '<div id="root">' . $ssr . '</div>', $html);

    if ($r['type'] === '404') http_response_code(404);
    if ($m['robots'] !== '' && stripos($m['robots'], 'noindex') !== false) header('X-Robots-Tag: ' . $m['robots']);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache');
    if ($_SERVER['REQUEST_METHOD'] !== 'HEAD') echo $html;
} catch (Throwable $err) {
    error_log('render.php: ' . $err->getMessage());
    aok_fallback($tplFile);
}
