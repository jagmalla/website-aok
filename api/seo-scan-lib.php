<?php
// Site scan — the SEO/AEO/GEO checks only the server can make.
//
// The Pending hub in assets/app.js checks what the browser can see (titles, descriptions, headings, keywords).
// Four things it cannot: whether every internal link actually resolves, whether the redirects form chains or
// loops, whether the JSON-LD graph carries the fields Google requires, and whether the image files exist on
// disk. Those live here, are returned in the same shape the hub's own rules use, and are merged into the one
// list (there is never a second list of rules).
//
//   api/seo-scan.php    admin endpoint:  POST {action:'run'} -> {ok, scan:{generatedAt, checks, stats}}
//   tools/seo-scan.php  the same scan from the command line, for setup agents and launch checks
if (realpath((string)($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) { http_response_code(403); exit; }

require_once __DIR__ . '/seo-lib.php';
require_once __DIR__ . '/app-compat.php';   // app_* names map to this site's aok_* engine

const APP_SCAN_MAX_ROUTES = 300;      // a runaway sitemap shouldn't turn one click into a minute of CPU
const APP_SCAN_IMAGE_KB = 250;        // an inline data: image above this slows every page that carries it

// The hub's scope keys, so a finding lands on the right page card (mirrors auditTargets() in app.js).
function app_scan_scope(array $d, array $r): array {
    $t = (string)($r['type'] ?? '');
    $names = ['home' => 'Home', 'about' => 'About', 'services' => 'Services', 'feature' => 'Feature',
              'blog' => 'Blog', 'faq' => 'FAQ', 'contact' => 'Contact'];
    $path = (string)($r['path'] ?? '/');
    if ($t === 'service') return ['key' => 'service:' . ($r['item']['id'] ?? ''), 'label' => app_text($r['item']['title'] ?? 'Service'), 'kind' => 'service', 'route' => $path];
    if ($t === 'post')    return ['key' => 'post:' . ($r['item']['id'] ?? ''), 'label' => app_text($r['item']['title'] ?? 'Post'), 'kind' => 'post', 'route' => $path];
    if ($t === 'page')    return ['key' => 'page:' . ($r['item']['id'] ?? ''), 'label' => app_text($r['item']['title'] ?? 'Page'), 'kind' => 'page', 'route' => $path];
    if ($t === 'matrix')  return ['key' => 'site', 'label' => 'Site-wide', 'kind' => 'site', 'route' => $path];
    if (isset($names[$t])) return ['key' => $t, 'label' => $names[$t], 'kind' => 'route', 'route' => $path];
    return ['key' => 'site', 'label' => 'Site-wide', 'kind' => 'site', 'route' => $path];
}
function app_scan_site(): array { return ['key' => 'site', 'label' => 'Site-wide', 'kind' => 'site']; }

// Every indexable route, resolved once and reused by each check below.
function app_scan_routes(array $d): array {
    $out = []; $seen = [];
    foreach (app_sitemap_urls($d) as $u) {
        if (count($out) >= APP_SCAN_MAX_ROUTES) break;
        $path = (string)parse_url((string)($u[0] ?? ''), PHP_URL_PATH);
        if ($path === '') $path = '/';
        if (isset($seen[$path])) continue;
        $seen[$path] = 1;
        $r = app_resolve($path, $d);
        if (in_array((string)$r['type'], ['redirect', '404', 'admin'], true)) continue;
        $out[] = $r;
    }
    return $out;
}

// ---------------------------------------------------------------- internal links ----
// Renders the same server-side body a crawler reads and resolves every internal href. A link to a missing page
// wastes the crawl and dead-ends a reader; a link to a redirect costs an extra hop and leaks a little ranking.
function app_scan_links(array $d, array $routes, array &$checks, array &$stats): void {
    $dead = []; $hops = []; $n = 0;
    foreach ($routes as $r) {
        $html = app_main_html($d, $r);
        if (!preg_match_all('/\shref="([^"]+)"/i', $html, $m)) continue;
        foreach (array_unique($m[1]) as $href) {
            $h = html_entity_decode($href, ENT_QUOTES, 'UTF-8');
            if ($h === '' || $h[0] !== '/' || (isset($h[1]) && $h[1] === '/')) continue;   // external, anchor, mailto:, tel:
            $n++;
            $to = app_resolve($h, $d);
            $type = (string)$to['type'];
            if ($type === '404') $dead[$h][] = $r;
            elseif ($type === 'redirect') $hops[$h . ' -> ' . (string)$to['to']][] = $r;
        }
    }
    $stats['links'] = $n;
    $where = function (array $rs) use ($d) {
        $labels = []; foreach ($rs as $x) $labels[app_scan_scope($d, $x)['label']] = 1;
        $l = array_keys($labels);
        return count($l) > 3 ? implode(', ', array_slice($l, 0, 3)) . ' and ' . (count($l) - 3) . ' more' : implode(', ', $l);
    };
    foreach ($dead as $href => $rs) {
        $sc = app_scan_scope($d, $rs[0]);
        $checks[] = ['scope' => $sc, 'id' => 'link-dead-' . substr(md5($href), 0, 8), 'area' => 'SEO', 'sev' => 'important', 'pass' => false,
            'title' => 'Link to a page that does not exist: ' . $href,
            'why' => 'Linked from ' . $where($rs) . '. Point it at a real page, or remove the link.', 'fix' => 'redirects'];
    }
    foreach ($hops as $pair => $rs) {
        [$from, $to] = explode(' -> ', $pair, 2);
        $sc = app_scan_scope($d, $rs[0]);
        $checks[] = ['scope' => $sc, 'id' => 'link-hop-' . substr(md5($from), 0, 8), 'area' => 'SEO', 'sev' => 'nice', 'pass' => false,
            'title' => 'Link goes through a redirect: ' . $from,
            'why' => 'It forwards to ' . $to . '. Linked from ' . $where($rs) . '. Link straight to the final address.', 'fix' => 'redirects'];
    }
    if (!$dead && !$hops) $checks[] = ['scope' => app_scan_site(), 'id' => 'links', 'area' => 'SEO', 'sev' => 'important', 'pass' => true,
        'title' => 'Every internal link works (' . $n . ' checked)', 'why' => '', 'fix' => null];
}

// ---------------------------------------------------------------- redirects ----
// A redirect that forwards to another redirect loses a little of its value at each hop, and a loop is a dead
// page. app_save_sync() flattens the ones the editor creates; these are the hand-written ones.
function app_scan_redirects(array $d, array &$checks, array &$stats): void {
    $reds = (array)($d['redirects'] ?? []);
    $stats['redirects'] = count($reds);
    foreach ($reds as $r) {
        if (!is_array($r)) continue;
        $from = '/' . trim((string)($r['from'] ?? ''), '/');
        $to = trim((string)($r['to'] ?? ''));
        if ($from === '/' || $to === '') continue;
        if (preg_match('#^https?://#i', $to)) continue;                 // off-site: nothing to resolve here
        $seen = [$from => 1]; $cur = $to; $hops = 0; $loop = false;
        while ($hops < 6) {
            $res = app_resolve($cur, $d);
            if ((string)$res['type'] !== 'redirect') break;
            $cur = (string)$res['to']; $hops++;
            if (isset($seen[$cur])) { $loop = true; break; }
            $seen[$cur] = 1;
        }
        $id = 'redirect-' . substr(md5($from), 0, 8);
        if ($loop || $hops >= 6) {
            $checks[] = ['scope' => app_scan_site(), 'id' => $id, 'area' => 'Technical', 'sev' => 'blocker', 'pass' => false,
                'title' => 'Redirect loop from ' . $from, 'why' => 'It never reaches a real page. Point it at one directly.', 'fix' => 'redirects'];
        } elseif ($hops > 0) {
            $checks[] = ['scope' => app_scan_site(), 'id' => $id, 'area' => 'Technical', 'sev' => 'nice', 'pass' => false,
                'title' => 'Redirect chain from ' . $from, 'why' => 'It forwards ' . ($hops + 1) . ' times before reaching ' . $cur . '. Send it straight there.', 'fix' => 'redirects'];
        } elseif ((string)app_resolve($cur, $d)['type'] === '404') {
            $checks[] = ['scope' => app_scan_site(), 'id' => $id, 'area' => 'Technical', 'sev' => 'important', 'pass' => false,
                'title' => 'Redirect to a page that does not exist: ' . $from, 'why' => 'It forwards to ' . $cur . ', which is not a page on this site.', 'fix' => 'redirects'];
        }
    }
}

// ---------------------------------------------------------------- structured data ----
// What each JSON-LD type must carry before Google will use it for a rich result, and before an AI assistant can
// read a fact off it. Keep in step with Google's "structured data" requirements for each type.
function app_scan_schema_required(): array {
    return [
        'BlogPosting' => ['headline', 'image', 'datePublished', 'author'],
        'Article' => ['headline', 'image', 'datePublished', 'author'],
        'Service' => ['name', 'provider'],
        'Product' => ['name'],
        'FAQPage' => ['mainEntity'],
        'Person' => ['name'],
        'WebSite' => ['name', 'url'],
        'BreadcrumbList' => ['itemListElement'],
        'WebPage' => ['name'],
    ];
}
// The business node (LocalBusiness and every subtype) is the one local search reads.
function app_scan_schema(array $d, array $routes, array &$checks, array &$stats): void {
    $missing = []; $ph = []; $nodes = 0;
    foreach ($routes as $r) {
        $graph = app_graph($d, $r, app_meta($d, $r));
        foreach ((array)($graph['@graph'] ?? []) as $node) {
            if (!is_array($node)) continue;
            $nodes++;
            $types = (array)($node['@type'] ?? []);
            $id = (string)($node['@id'] ?? '');
            $need = [];
            foreach ($types as $t) if (isset(app_scan_schema_required()[$t])) $need = array_merge($need, app_scan_schema_required()[$t]);
            // the business: whatever local.businessType says it is (ProfessionalService, Dentist, LocalBusiness …)
            if (substr($id, -13) === '#organization') $need = array_merge($need, ['name', 'url', 'telephone', 'address']);
            foreach (array_unique($need) as $f) {
                $v = $node[$f] ?? null;
                if ($v === null || $v === '' || $v === [] || (is_string($v) && trim($v) === '')) $missing[implode('+', $types) . '|' . $f] = $types;
            }
            // an unfilled {{TOKEN}} in the graph is worse than a missing field: the data is there and it is wrong
            $flat = json_encode($node, JSON_UNESCAPED_UNICODE);
            if (preg_match_all('/\{\{[A-Z0-9_]+\}\}/', (string)$flat, $pm)) foreach ($pm[0] as $tok) $ph[$tok] = implode('+', $types);
        }
    }
    $stats['schemaNodes'] = $nodes;
    foreach ($missing as $k => $types) {
        [$t, $f] = explode('|', $k, 2);
        $human = ['telephone' => 'a phone number', 'address' => 'a postal address', 'image' => 'an image',
                  'datePublished' => 'a publication date', 'author' => 'an author', 'headline' => 'a headline',
                  'provider' => 'a provider', 'name' => 'a name', 'url' => 'a web address', 'mainEntity' => 'questions and answers',
                  'itemListElement' => 'its items'][$f] ?? $f;
        $checks[] = ['scope' => app_scan_site(), 'id' => 'schema-' . strtolower(preg_replace('/[^A-Za-z0-9]+/', '-', $k)),
            'area' => 'GEO', 'sev' => 'important', 'pass' => false,
            'title' => 'Structured data: ' . $t . ' is missing ' . $human,
            'why' => 'Google needs this field before it will show a rich result, and AI assistants read facts from it.',
            'fix' => strpos($t, 'BlogPosting') !== false ? 'blog' : (strpos($t, 'Person') !== false ? 'person' : 'local')];
    }
    if ($ph) {
        $list = array_slice(array_keys($ph), 0, 4);
        $checks[] = ['scope' => app_scan_site(), 'id' => 'schema-placeholders', 'area' => 'GEO', 'sev' => 'blocker', 'pass' => false,
            'title' => count($ph) . ' unfilled placeholder' . (count($ph) === 1 ? '' : 's') . ' in the structured data',
            'why' => implode(', ', $list) . (count($ph) > 4 ? ' and more' : '') . '. Search engines read these as the real values.', 'fix' => 'pending'];
    }
    if (!$missing && !$ph) $checks[] = ['scope' => app_scan_site(), 'id' => 'schema', 'area' => 'GEO', 'sev' => 'important', 'pass' => true,
        'title' => 'Structured data has every required field (' . $nodes . ' nodes)', 'why' => '', 'fix' => null];
}

// ---------------------------------------------------------------- images ----
// A missing file is a broken image in search results and social shares; a huge inline image slows every page it
// sits on (and Core Web Vitals is a ranking signal); an image with no alt text is invisible to search and to a
// screen reader.
function app_scan_images(array $d, array &$checks, array &$stats): void {
    $root = dirname(__DIR__);
    $found = [];   // path => [label, where]
    $addImg = function ($src, $label, $where) use (&$found) {
        $src = trim((string)$src);
        if ($src === '' || preg_match('#^(https?:)?//#i', $src)) return;   // off-site: not ours to check
        $found[] = [$src, $label, $where];
    };
    foreach ((array)($d['services'] ?? []) as $s) if (!empty($s['image'])) $addImg($s['image'], app_text($s['title'] ?? 'Service'), 'services');
    foreach ((array)($d['blog'] ?? []) as $p) if (!empty($p['image'])) $addImg($p['image'], app_text($p['title'] ?? 'Post'), 'blog');
    $addImg(app_get($d, 'person.image', ''), 'Owner photo', 'person');
    $addImg(app_get($d, 'brand.logo', ''), 'Logo', 'settings');
    // The share image every page falls back to (og:image, twitter:image, and the image in the Article and
    // Organization schema). One missing file means every share on Facebook, LinkedIn, WhatsApp and X shows a
    // blank card, and Google drops the article rich result — so it is checked on its own, by name.
    $ogOk = app_social_image_ok($d, $root);
    $own = trim((string)app_get($d, 'seo.ogImage', ''));
    $checks[] = ['scope' => app_scan_site(), 'id' => 'img-social', 'area' => 'SEO', 'sev' => 'important', 'pass' => $ogOk,
        'title' => $ogOk ? 'Social share image is in place' : 'No social share image',
        'why' => $ogOk ? '' : ($own !== '' && !preg_match('/\{\{[A-Z0-9_]+\}\}/', $own)
            ? 'The one set (' . $own . ') is not on the server. Generate or upload it again in Settings → Social share image.'
            : 'Every page points at one for Facebook, LinkedIn, WhatsApp and X, and the article schema uses it. Settings → Social share image draws a 1200×630 card from your theme and business name, or you can upload a photo.'),
        'fix' => $ogOk ? null : 'settings'];

    $noAlt = 0; $imgBlocks = 0;
    foreach ((array)($d['blocks'] ?? []) as $scope => $blocks) {
        foreach ((array)$blocks as $b) {
            if (!is_array($b)) continue;
            if (!empty($b['src'])) { $imgBlocks++; $addImg($b['src'], 'Image block', 'pages'); if (trim((string)($b['alt'] ?? '')) === '') $noAlt++; }
        }
    }
    $broken = []; $heavy = [];
    foreach ($found as [$src, $label, $where]) {
        if (strncmp($src, 'data:', 5) === 0) {
            $kb = (int)round(strlen($src) * 0.75 / 1024);
            if ($kb > APP_SCAN_IMAGE_KB) $heavy[] = $label . ' (' . $kb . ' KB)';
            continue;
        }
        $rel = ltrim((string)parse_url($src, PHP_URL_PATH), '/');
        if ($rel !== '' && !is_file($root . '/' . rawurldecode($rel))) $broken[] = $label . ' (' . $src . ')';
    }
    $stats['images'] = count($found);
    if ($broken) $checks[] = ['scope' => app_scan_site(), 'id' => 'img-missing', 'area' => 'SEO', 'sev' => 'important', 'pass' => false,
        'title' => count($broken) . ' image file' . (count($broken) === 1 ? '' : 's') . ' missing from the server',
        'why' => implode('; ', array_slice($broken, 0, 4)) . '. Upload the file again, or clear the field.', 'fix' => 'pages'];
    if ($heavy) $checks[] = ['scope' => app_scan_site(), 'id' => 'img-heavy', 'area' => 'Technical', 'sev' => 'nice', 'pass' => false,
        'title' => count($heavy) . ' image' . (count($heavy) === 1 ? ' is' : 's are') . ' pasted into the page data and over ' . APP_SCAN_IMAGE_KB . ' KB',
        'why' => implode('; ', array_slice($heavy, 0, 4)) . '. Upload them as files instead: the page loads faster, and speed is a ranking signal.', 'fix' => 'pages'];
    if ($noAlt) $checks[] = ['scope' => app_scan_site(), 'id' => 'img-alt', 'area' => 'SEO', 'sev' => 'nice', 'pass' => false,
        'title' => $noAlt . ' of ' . $imgBlocks . ' image blocks have no alt text',
        'why' => 'Alt text is what search engines and screen readers read instead of the picture. Describe what it shows.', 'fix' => 'pages'];
    if (!$broken && !$heavy && !$noAlt) $checks[] = ['scope' => app_scan_site(), 'id' => 'images', 'area' => 'SEO', 'sev' => 'nice', 'pass' => true,
        'title' => 'Images are present, sized sensibly and described (' . count($found) . ')', 'why' => '', 'fix' => null];
}

// ---------------------------------------------------------------- the scan ----
function app_scan_run(array $d): array {
    $checks = []; $stats = ['routes' => 0, 'links' => 0, 'redirects' => 0, 'schemaNodes' => 0, 'images' => 0];
    $routes = app_scan_routes($d);
    $stats['routes'] = count($routes);
    app_scan_links($d, $routes, $checks, $stats);
    app_scan_redirects($d, $checks, $stats);
    app_scan_schema($d, $routes, $checks, $stats);
    app_scan_images($d, $checks, $stats);
    return ['generatedAt' => gmdate('c'), 'checks' => $checks, 'stats' => $stats];
}
