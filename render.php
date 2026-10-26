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

// a missing image / script / font: a plain 404, no page needed
if (($_SERVER['REDIRECT_STATUS'] ?? '') === '404'
    && preg_match('#\.(png|jpe?g|gif|webp|avif|svg|ico|css|js|mjs|map|woff2?|ttf|json|xml|pdf|zip)$#i', (string)parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH))) {
    http_response_code(404);
    header('Content-Type: text/plain; charset=utf-8');
    echo "Not found\n";
    exit;
}

// Content-Security-Policy for a page: scripts only from this site and React's pinned CDN, plus the page's own
// inline scripts by hash (any script injected into the content would run nowhere). Inline event handlers
// (onerror=…) and javascript: links are blocked too. Pictures, fonts, video/map embeds keep working.
function aok_csp(string $html): string {
    $hashes = [];
    if (preg_match_all('#<script\b([^>]*)>(.*?)</script>#is', $html, $m, PREG_SET_ORDER)) {
        foreach ($m as $x) {
            if (preg_match('#\bsrc\s*=#i', $x[1]) || preg_match('#\btype\s*=\s*["\']?application/(ld\+)?json#i', $x[1])) continue;
            $hashes[] = "'sha256-" . base64_encode(hash('sha256', $x[2], true)) . "'";
        }
    }
    $p = [
        "default-src 'self'",
        "script-src 'self' https://unpkg.com " . implode(' ', array_unique($hashes)),
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' data: https://fonts.gstatic.com",
        "img-src 'self' data: blob: https:",
        "media-src 'self' data: blob: https:",
        "connect-src 'self' https://translate.googleapis.com",
        "frame-src https:",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'self'",
    ];
    if (aok_https()) $p[] = 'upgrade-insecure-requests';
    return implode('; ', $p);
}

try {
    require_once __DIR__ . '/api/seo-lib.php';
    $tpl = file_get_contents($tplFile);
    if ($tpl === false || strpos($tpl, '<div id="root"></div>') === false) aok_fallback($tplFile);

    $d = aok_site();
    aok_canonical_redirect($d);   // http:// or no-www -> 301 to the one https://www… address
    $uri = $_SERVER['REQUEST_URI'] ?? '/';
    // reached through ErrorDocument 404 (a missing file): render the not-found page
    $r = (($_SERVER['REDIRECT_STATUS'] ?? '') === '404' && !preg_match('#^/(index\.html|render\.php)?$#', parse_url($uri, PHP_URL_PATH)))
        ? ['type' => '404', 'path' => parse_url($uri, PHP_URL_PATH)]
        : aok_resolve($uri, $d);

    if ($r['type'] === 'redirect') {
        $to = $r['to'];
        // absolute Location on the requested host (https + www on the live site, via .htaccess)
        if (!preg_match('#^https?://#i', $to)) $to = (aok_https() ? 'https' : 'http') . '://' . preg_replace('/[^a-z0-9.:\-\[\]]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'www.analysisofkarma.com')) . '/' . ltrim($to, '/');
        header('Location: ' . $to, true, 301);
        exit;
    }

    $m = aok_meta($d, $r);
    $graph = aok_graph($d, $r, $m);
    $e = 'aok_e';

    $head = '<title>' . $e($m['title']) . "</title>\n"
        . '<meta name="description" content="' . $e($m['description']) . '" data-aok="1">' . "\n"
        . '<meta name="robots" content="' . $e(aok_robots_full($m['robots'])) . '" data-aok="1">' . "\n"
        . ($m['canonical'] !== '' ? '<link rel="canonical" href="' . $e($m['canonical']) . '">' . "\n" : '')
        . '<meta property="og:site_name" content="' . $e(aok_brand($d)) . '">' . "\n"
        . '<meta property="og:locale" content="en_CA">' . "\n"
        . '<meta property="og:type" content="' . $e($m['ogType']) . '">' . "\n"
        . '<meta property="og:title" content="' . $e($m['title']) . '">' . "\n"
        . '<meta property="og:description" content="' . $e($m['description']) . '">' . "\n"
        . ($m['canonical'] !== '' ? '<meta property="og:url" content="' . $e($m['canonical']) . '">' . "\n" : '')
        . '<meta property="og:image" content="' . $e($m['image']) . '">' . "\n"
        . (!empty($m['imageSize']) ? '<meta property="og:image:width" content="' . (int)$m['imageSize'][0] . '">' . "\n" . '<meta property="og:image:height" content="' . (int)$m['imageSize'][1] . '">' . "\n" : '')
        . (!empty($m['imageAlt']) ? '<meta property="og:image:alt" content="' . $e($m['imageAlt']) . '">' . "\n" : '')
        . '<meta name="twitter:card" content="summary_large_image">' . "\n"
        . '<meta name="twitter:title" content="' . $e($m['title']) . '">' . "\n"
        . '<meta name="twitter:description" content="' . $e($m['description']) . '">' . "\n"
        . '<meta name="twitter:image" content="' . $e($m['image']) . '">' . "\n"
        . (($xh = aok_x_handle($d)) !== '' ? '<meta name="twitter:site" content="' . $e($xh) . '">' . "\n" . '<meta name="twitter:creator" content="' . $e($xh) . '">' . "\n" : '')
        . '<meta name="geo.region" content="' . $e(aok_get($d, 'local.country', 'CA') . '-' . aok_get($d, 'local.regionCode', 'BC')) . '">' . "\n"
        . '<meta name="geo.placename" content="' . $e(aok_get($d, 'local.locality', 'Surrey')) . '">' . "\n";
    $lat = trim((string)aok_get($d, 'local.lat', '')); $lng = trim((string)aok_get($d, 'local.lng', ''));
    // Search Console / Bing Webmaster verification codes (Admin -> AI & GEO)
    foreach (['google-site-verification' => 'ai.googleVerification', 'msvalidate.01' => 'ai.bingVerification'] as $mn => $path) {
        $code = preg_replace('/[^A-Za-z0-9_\-]/', '', (string)aok_get($d, $path, ''));
        if ($code !== '') $head .= '<meta name="' . $mn . '" content="' . $code . '">' . "\n";
    }
    if (is_numeric($lat) && is_numeric($lng)) $head .= '<meta name="geo.position" content="' . $e($lat . ';' . $lng) . '">' . "\n" . '<meta name="ICBM" content="' . $e($lat . ', ' . $lng) . '">' . "\n";
    $head .= '<link rel="alternate" type="text/plain" href="/llms.txt" title="llms.txt">' . "\n"
        . '<script type="application/ld+json" id="aok-graph">' . json_encode($graph, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG) . "</script>\n"
        // the server-rendered copy is for crawlers and no-JS visitors; while the interactive page starts
        // it stays invisible (with a safety reveal after 4s in case scripts are blocked)
        . "<script>document.documentElement.className+=' aok-js'</script>\n"
        . '<style>.aok-ssr{max-width:1100px;margin:0 auto;padding:24px;font:16px/1.7 system-ui,sans-serif;color:#3A3D42;overflow-wrap:break-word}.aok-ssr img{max-width:100%;height:auto}.aok-ssr h1,.aok-ssr h2,.aok-ssr h3{font-family:Georgia,serif;color:#1E2022}.aok-ssr ul{padding-left:20px}.aok-ssr header ul,.aok-ssr footer ul{list-style:none;padding:0;display:flex;flex-wrap:wrap;gap:6px 18px}.aok-ssr a{color:#8A6A2E}.aok-ssr-btn{display:inline-block;margin:4px 8px 4px 0;padding:10px 18px;border:1px solid #C5A869;border-radius:999px;text-decoration:none}'
        . '.aok-js .aok-ssr{visibility:hidden;animation:aokssr 0s 4s forwards}@keyframes aokssr{to{visibility:visible}}'
        // service pages: page text beside a sticky booking card, then one centred full-width column (as in the app)
        . '.aok-ssr-top{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:40px;align-items:start}.aok-ssr-main{min-width:0}'
        . '.aok-ssr-side{position:sticky;top:96px;padding:20px 22px;border:1px solid rgba(212,175,55,.3);border-radius:16px;background:#FFFDF8}'
        . '.aok-ssr-wide{max-width:1100px;margin:0 auto}.aok-ssr-wide>h2,.aok-ssr-wide>section>h2{text-align:center}'
        . '.aok-ssr-wide ol{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;padding:0;list-style-position:inside}'
        . '.aok-ssr-wide h3,.aok-ssr-wide h3+p{max-width:900px;margin-left:auto;margin-right:auto}'
        . '.aok-ssr #about-the-astrologer{max-width:960px;margin:60px auto 40px;padding:28px;border:1px solid rgba(212,175,55,.3);border-radius:20px}'
        . '@media (max-width:1023px){.aok-ssr-top{grid-template-columns:minmax(0,1fr)}.aok-ssr-side{position:static;order:-1}.aok-ssr-wide ol{grid-template-columns:repeat(2,minmax(0,1fr))}}'
        . '@media (max-width:767px){.aok-ssr{padding:16px}.aok-ssr-wide ol{grid-template-columns:minmax(0,1fr)}}</style>' . "\n";

    // one title + description: replace the template's static ones
    $html = preg_replace('#<title>.*?</title>\s*#s', '', $tpl, 1);
    $html = preg_replace('#<meta name="description"[^>]*>\s*#', '', $html, 1);
    $html = str_replace('</head>', $head . '</head>', $html);
    // cache-busting versions for the scripts: /assets/app.js?v=<last change>, /assets/hero3d.js?v=…
    $html = preg_replace_callback('#/assets/([a-z0-9_-]+\.js)\?v=[^"\']*#i', function ($m) {
        $f = __DIR__ . '/assets/' . $m[1];
        return '/assets/' . $m[1] . '?v=' . (is_file($f) ? filemtime($f) : '1');
    }, $html);
    $ssr = '<div class="aok-ssr">' . aok_html_header($d) . aok_main_html($d, $r) . aok_html_footer($d) . '</div>';
    $html = str_replace('<div id="root"></div>', '<div id="root">' . $ssr . '</div>', $html);

    if ($r['type'] === '404') http_response_code(404);
    if ($m['robots'] !== '' && stripos($m['robots'], 'noindex') !== false) header('X-Robots-Tag: ' . $m['robots']);
    header('Content-Type: text/html; charset=utf-8');
    header('Cache-Control: no-cache');
    header('Content-Security-Policy: ' . aok_csp($html));
    if ($_SERVER['REQUEST_METHOD'] !== 'HEAD') echo $html;
    // service changes queued for IndexNow go out after the page has been sent (at most every 10 minutes)
    if (!defined('AOK_OFFLINE')) { require_once __DIR__ . '/api/sync.php'; aok_finish_response(); aok_indexnow_flush($d); }
} catch (Throwable $err) {
    error_log('render.php: ' . $err->getMessage());
    aok_fallback($tplFile);
}
