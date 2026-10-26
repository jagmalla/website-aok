<?php
if (realpath((string)($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) { http_response_code(403); exit; }   // a library: never run on its own
// Shared SEO / AEO / GEO library: site data, routing, titles, structured data and server-rendered HTML.
// Used by render.php, sitemap.php, robots.php, llms.php and seo-health.php. Not reachable from the web.
// Keep in step with the matching JavaScript (serviceSlugs, seoTitleFor, routing) in assets/app.js.
require_once __DIR__ . '/db.php';

// ------------------------------------------------------------------ data ----

function aok_defaults(): array {
    static $d = null;
    if ($d === null) {
        $d = json_decode((string)@file_get_contents(__DIR__ . '/defaults.json'), true);
        if (!is_array($d)) $d = [];
    }
    return $d;
}

function aok_is_list($a): bool {
    return is_array($a) && ($a === [] || array_keys($a) === range(0, count($a) - 1));
}

// Same merge as the browser's fill(): saved values win, missing settings come from the defaults.
function aok_fill($def, $cur) {
    if (!is_array($def) || aok_is_list($def)) return $cur === null ? $def : $cur;
    $out = (is_array($cur) && !aok_is_list($cur)) ? $cur : [];
    foreach ($def as $k => $v) $out[$k] = aok_fill($v, array_key_exists($k, $out) ? $out[$k] : null);
    return $out;
}

// The public site data: live database merged over the defaults (exactly what visitors' browsers build).
function aok_site(): array {
    static $site = null;
    if ($site !== null) return $site;
    $def = aok_defaults();
    $seedS = $def['_seedServices'] ?? [];
    $seedP = $def['_seedPosts'] ?? [];
    unset($def['_seedServices'], $def['_seedPosts'], $def['_note']);
    $db = null;
    try { $db = site_data(); } catch (Throwable $e) { $db = null; }
    $d = is_array($db) ? aok_fill($def, $db) : $def;
    // seeded services / posts the browser adds when missing (by seedKey / slug)
    $have = [];
    foreach ($d['services'] ?? [] as $s) if (!empty($s['seedKey'])) $have[$s['seedKey']] = 1;
    foreach ((array)($d['deletedSeeds'] ?? []) as $k) $have[$k] = 1;   // shipped services the admin deleted stay deleted
    foreach ($seedS as $s) if (empty($have[$s['seedKey'] ?? ''])) $d['services'][] = $s;
    $have = [];
    foreach ($d['blog'] ?? [] as $p) if (!empty($p['slug'])) $have[$p['slug']] = 1;
    $add = [];
    foreach ($seedP as $p) if (empty($have[$p['slug'] ?? ''])) $add[] = $p;
    $d['blog'] = array_merge($add, $d['blog'] ?? []);
    // no saved site yet (fresh install, offline build): the defaults still need the version 3 content
    if ((int)($d['contentVersion'] ?? 0) < AOK_CONTENT_VERSION) $d = aok_upgrade_payload($d);
    $site = public_payload($d);
    return $site;
}

function aok_get(array $a, string $path, $fallback = null) {
    foreach (explode('.', $path) as $k) {
        if (!is_array($a) || !array_key_exists($k, $a)) return $fallback;
        $a = $a[$k];
    }
    return $a === null ? $fallback : $a;
}

function aok_base(array $d): string {
    $b = rtrim((string)($d['siteUrl'] ?? ''), '/');
    if ($b === '') $b = 'https://www.analysisofkarma.com';
    return preg_replace('#^http://#i', 'https://', $b);
}

// One address per page. A page reached on http://, or without the www, is answered with a 301 to
// the single canonical https://www… address, so search engines never see the same page twice (Bing
// reports those as duplicate titles and descriptions). The .htaccess does this as well; doing it
// here too means the site still has one address if that file was not updated on the server.
// Only the site's own domain is redirected, so a local copy or a staging host is left alone.
function aok_canonical_redirect(array $d): void {
    if (PHP_SAPI === 'cli' || defined('AOK_OFFLINE')) return;
    $method = strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET'));
    if ($method !== 'GET' && $method !== 'HEAD') return;   // never turn a form post into a GET
    $canon = strtolower((string)parse_url(aok_base($d), PHP_URL_HOST));
    $host = strtolower(preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? '')));
    if ($canon === '' || $host === '') return;
    if ($host !== $canon && $host !== preg_replace('/^www\./', '', $canon)) return;   // another host: leave it
    if ($host === $canon && aok_https()) return;                                      // already canonical
    $uri = str_replace(["\r", "\n"], '', (string)($_SERVER['REQUEST_URI'] ?? '/'));
    header('Location: https://' . $canon . ($uri === '' || $uri[0] !== '/' ? '/' . ltrim($uri, '/') : $uri), true, 301);
    exit;
}

function aok_last_modified(): string {
    static $t = null;
    if ($t === null) {
        $t = date('Y-m-d');
        try { $r = db()->query("SELECT updated_at FROM aok_site_data WHERE id = 1")->fetch(); if ($r && $r['updated_at']) $t = substr($r['updated_at'], 0, 10); } catch (Throwable $e) {}
    }
    return $t;
}

// ------------------------------------------------------------------ text helpers ----

function aok_text($html): string {   // plain text (for titles, schema, llms.txt)
    $s = str_replace(['<br>', '<br/>', '<br />', '</p>', '</li>', '</div>'], ["\n", "\n", "\n", "\n", "\n", "\n"], (string)$html);
    $s = html_entity_decode(strip_tags($s), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return trim(preg_replace("/[ \t]+/", ' ', $s));
}

function aok_e($s): string { return htmlspecialchars((string)$s, ENT_QUOTES | ENT_HTML5, 'UTF-8'); }

// A link target typed in the admin, only if it is a web, email or phone link or a path on this site
// (never javascript: or data:), else ''.
function aok_safe_url($u): string {
    $u = trim((string)$u);
    return preg_match('#^(https?://|mailto:|tel:|/(?!/)|\#)#i', $u) ? $u : '';
}

// Inline rich text written in the editor: keep simple formatting and safe links only.
function aok_rich($html): string {
    $s = strip_tags((string)$html, '<a><b><strong><i><em><u><br><ul><ol><li><p><span>');
    $s = preg_replace('#<span[^>]*>|</span>#i', '', $s);
    $s = preg_replace_callback('#<a\b[^>]*>#i', function ($m) {
        return preg_match('#href\s*=\s*["\']((?:https?:|mailto:|tel:|/)[^"\']*)["\']#i', $m[0], $h) ? '<a href="' . aok_e(html_entity_decode($h[1])) . '">' : '<a>';
    }, $s);
    return preg_replace('#<(b|strong|i|em|u|ul|ol|li|p|br)\b[^>]*>#i', '<$1>', $s);   // no attributes (event handlers, styles)
}

// Multi-paragraph text (the editor stores blank-line separated paragraphs).
// Long-form text: paragraphs, plus light Markdown used by the expanded service and blog pages.
// Mirrors mdBlocks()/mdRender() in assets/app.js. Text without these marks renders exactly as before.
//   ## Heading   ### Sub-heading   - bullet   1. numbered   > answer box   **bold**
function aok_md_blocks(string $text): array {
    $out = [];
    foreach (preg_split("/\n\s*\n/", trim(str_replace("\r", '', $text))) as $b) {
        $b = trim($b); if ($b === '') continue;
        $lines = preg_split("/\n/", $b);
        if (preg_match('/^(#{2,3})\s+(.+)$/', $lines[0], $m)) {
            $out[] = ['h' . strlen($m[1]), trim($m[2])];
            $rest = trim(implode("\n", array_slice($lines, 1)));
            if ($rest !== '') $out = array_merge($out, aok_md_blocks($rest));
            continue;
        }
        $all = function ($re) use ($lines) { foreach ($lines as $l) if (!preg_match($re, trim($l))) return false; return true; };
        if ($all('/^>\s?/')) $out[] = ['answer', trim(implode("\n", array_map(function ($l) { return preg_replace('/^>\s?/', '', trim($l)); }, $lines)))];
        elseif ($all('/^[-*]\s+/')) $out[] = ['ul', array_map(function ($l) { return preg_replace('/^[-*]\s+/', '', trim($l)); }, $lines)];
        elseif ($all('/^\d+[.)]\s+/')) $out[] = ['ol', array_map(function ($l) { return preg_replace('/^\d+[.)]\s+/', '', trim($l)); }, $lines)];
        else $out[] = ['p', $b];
    }
    return $out;
}

function aok_md_inline(string $s): string {
    $h = preg_replace('/&(?![a-zA-Z][a-zA-Z0-9]*;|#\d+;|#x[0-9a-fA-F]+;)/', '&amp;', aok_rich($s));   // bare & -> &amp;
    return preg_replace('/\*\*(.+?)\*\*/s', '<strong>$1</strong>', $h);
}

function aok_paras($html): string {
    return aok_md_html(aok_md_blocks((string)$html));
}
// Markdown blocks from aok_md_blocks() as HTML. With $h2Ids, every ## heading gets id="section-N" (N counting from $h2Ids),
// the anchors of a service page's "On this page" menu.
function aok_md_html(array $blocks, int $h2Ids = 0): string {
    $out = '';
    foreach ($blocks as $bk) {
        list($t, $v) = $bk;
        if ($t === 'h2' && $h2Ids > 0) $out .= '<h2 id="section-' . ($h2Ids++) . '">' . aok_md_inline($v) . '</h2>';
        elseif ($t === 'h2' || $t === 'h3') $out .= '<' . $t . '>' . aok_md_inline($v) . '</' . $t . '>';
        elseif ($t === 'answer') $out .= '<aside class="aok-answer"><p>' . nl2br(aok_md_inline($v), false) . '</p></aside>';
        elseif ($t === 'ul' || $t === 'ol') { $out .= '<' . $t . '>'; foreach ($v as $li) $out .= '<li>' . aok_md_inline($li) . '</li>'; $out .= '</' . $t . '>'; }
        else $out .= '<p>' . nl2br(aok_md_inline($v), false) . '</p>';
    }
    return $out;
}

// A service page's text in its two layout zones: [the part beside the booking card, the full-width part, sections].
// The full-width part starts at the first "wide" section: the consultation steps (one numbered list) or the FAQ.
// Mirrors svcIsWide()/svcSplit() in assets/app.js.
function aok_service_split(string $md): array {
    $intro = []; $secs = [];
    foreach (aok_md_blocks($md) as $b) {
        if ($b[0] === 'h2') $secs[] = ['title' => $b[1], 'blocks' => [$b]];
        elseif ($secs) $secs[count($secs) - 1]['blocks'][] = $b;
        else $intro[] = $b;
    }
    $wide = null;
    foreach ($secs as $i => $sec) {
        $body = array_slice($sec['blocks'], 1);
        $hasQ = (bool)array_filter($body, function ($b) { return $b[0] === 'h3'; });
        if ((count($body) === 1 && $body[0][0] === 'ol') || (stripos($sec['title'], 'frequently asked') !== false && $hasQ)) { $wide = $i; break; }
    }
    $top = $intro; $low = [];
    foreach ($secs as $i => $sec) {
        if ($wide !== null && $i >= $wide) $low = array_merge($low, $sec['blocks']); else $top = array_merge($top, $sec['blocks']);
    }
    return [$top, $low, $secs];
}

// "## Frequently Asked Questions" + "### Question" + answer paragraphs -> [[question, answer], …] for FAQPage schema
function aok_md_faq(string $text): array {
    $qa = []; $in = false; $q = null; $a = [];
    foreach (aok_md_blocks($text) as $bk) {
        list($t, $v) = $bk;
        if ($t === 'h2') { if ($q !== null && $a) $qa[] = [$q, implode(' ', $a)]; $q = null; $a = []; $in = stripos($v, 'frequently asked') !== false || stripos($v, 'faq') !== false; continue; }
        if (!$in) continue;
        if ($t === 'h3') { if ($q !== null && $a) $qa[] = [$q, implode(' ', $a)]; $q = aok_text($v); $a = []; continue; }
        if ($q !== null) $a[] = aok_text(is_array($v) ? implode('; ', $v) : str_replace('**', '', $v));
    }
    if ($q !== null && $a) $qa[] = [$q, implode(' ', $a)];
    return $qa;
}

function aok_cut(string $s, int $max): string {
    $s = trim(preg_replace('/\s+/', ' ', $s));
    if (mb_strlen($s) <= $max) return $s;
    $s = mb_substr($s, 0, $max - 1);
    $p = mb_strrpos($s, ' ');
    return rtrim($p > $max * 0.6 ? mb_substr($s, 0, $p) : $s, " ,;:—-") . '…';
}

// ------------------------------------------------------------------ slugs & routes ----

function aok_slugify(string $s): string {
    $s = mb_strtolower(str_replace('&', ' and ', $s), 'UTF-8');
    $s = preg_replace('/[^a-z0-9]+/', '-', $s);
    return trim($s, '-');
}

// id => URL slug for every service (custom slug if set, else from the title; duplicates get -2, -3 …)
function aok_service_slugs(array $services): array {
    $out = []; $used = [];
    foreach ($services as $s) {
        $base = aok_slugify((string)(($s['slug'] ?? '') !== '' ? $s['slug'] : ($s['title'] ?? 'service')));
        if ($base === '') $base = 'service';
        $slug = $base; $n = 2;
        while (isset($used[$slug])) $slug = $base . '-' . $n++;
        $used[$slug] = 1;
        $out[(string)($s['id'] ?? $slug)] = $slug;
    }
    return $out;
}

function aok_route_path(string $route): string {
    return $route === 'home' ? '/' : '/' . $route;
}

// True when a redirect target points back at the requested path (a redirect loop), so it is ignored.
function aok_same_path(string $to, string $path): bool {
    $t = (string)parse_url(trim($to), PHP_URL_PATH);
    $host = parse_url(trim($to), PHP_URL_HOST);
    if ($host && strcasecmp(preg_replace('/^www\./i', '', $host), preg_replace('/^www\./i', '', (string)($_SERVER['HTTP_HOST'] ?? ''))) !== 0) return false;
    return strcasecmp('/' . trim(rawurldecode($t), '/'), $path) === 0;
}

// Resolve a request path to a route. Possible types:
// home about services meditation blog contact faq service post page admin redirect 404
function aok_resolve(string $uri, array $d): array {
    $path = rawurldecode((string)parse_url($uri, PHP_URL_PATH));
    $path = '/' . trim($path, '/');
    // admin-managed redirects (used when merging duplicate services / posts)
    // (a redirect never hides a live service: an address reused by a new service wins over an old redirect)
    $livePaths = [];
    $sl = aok_service_slugs($d['services'] ?? []);
    foreach ($d['services'] ?? [] as $s) if (aok_service_is_live($s)) $livePaths['/services/' . ($sl[(string)($s['id'] ?? '')] ?? '')] = 1;
    foreach ($d['redirects'] ?? [] as $r) {
        $from = '/' . trim((string)($r['from'] ?? ''), '/');
        if (isset($livePaths[strtolower($from)])) continue;
        $to = trim((string)($r['to'] ?? ''));
        if ($from !== '/' && $to !== '' && strcasecmp($from, $path) === 0 && !aok_same_path($to, $path)) return ['type' => 'redirect', 'to' => $to];
    }
    $parts = array_values(array_filter(explode('/', $path), 'strlen'));
    if (!$parts) return ['type' => 'home', 'path' => '/'];
    $p0 = strtolower($parts[0]);
    if (count($parts) === 1 && in_array($p0, ['about', 'services', 'meditation', 'blog', 'contact', 'faq'], true)) return ['type' => $p0, 'path' => '/' . $p0];
    if ($p0 === 'admin' && count($parts) === 1) return ['type' => 'admin', 'path' => '/admin'];
    if ($p0 === 'services' && count($parts) === 2) {
        $slugs = aok_service_slugs($d['services'] ?? []);
        foreach ($d['services'] ?? [] as $s) {
            if (($slugs[(string)($s['id'] ?? '')] ?? null) === strtolower($parts[1])) {
                if (!empty($s['redirectTo']) && !aok_same_path($s['redirectTo'], $path)) return ['type' => 'redirect', 'to' => $s['redirectTo']];
                if (!empty($s['unpublished'])) return ['type' => 'redirect', 'to' => '/services'];   // unpublished without a chosen target
                return ['type' => 'service', 'item' => $s, 'slug' => $slugs[(string)$s['id']], 'path' => '/services/' . $slugs[(string)$s['id']]];
            }
        }
    }
    if ($p0 === 'blog' && count($parts) === 2) {
        foreach ($d['blog'] ?? [] as $p) {
            if (($p['slug'] ?? '') === $parts[1] && !empty($p['published'])) {
                if (!empty($p['redirectTo']) && !aok_same_path($p['redirectTo'], $path)) return ['type' => 'redirect', 'to' => $p['redirectTo']];
                return ['type' => 'post', 'item' => $p, 'path' => '/blog/' . rawurlencode($p['slug'])];
            }
        }
    }
    if (count($parts) === 1) {
        foreach ($d['pages'] ?? [] as $i => $pg) {
            if (($pg['slug'] ?? '') !== '' && $pg['slug'] === $parts[0]) return ['type' => 'page', 'item' => $pg, 'index' => $i, 'path' => '/' . rawurlencode($pg['slug'])];
        }
    }
    return ['type' => '404', 'path' => $path];
}

// ---------------------------------------------------------- topic clusters ----
// Blog posts <-> service pages, linked by shared keyword stems. The same rules live in
// assets/app.js (clusterWords / clusterScore), so the server and the browser pick the same links.
function aok_cluster_words(string $t): array {
    static $stop = null;
    if ($stop === null) $stop = array_flip(explode(' ', AOK_CLUSTER_STOP));
    $out = [];
    foreach (preg_split('/[^a-z0-9]+/', strtolower(str_replace('&', ' ', aok_text($t)))) as $w) {
        if (strlen($w) >= 3 && !isset($stop[$w])) $out[substr($w, 0, 5)] = true;
    }
    return array_keys($out);
}
const AOK_CLUSTER_STOP = 'the and for your with what how its does doesn really means each best you are why from into this that can will when where which who not but all any our out more most just than them they their there here have has had was were been about also only very much many ultimate guide clear simple look step help helps know real truly without jargon vedic astrology astrological astrologer astrologers service services report reports';
const AOK_CLUSTER_MIN = 8;

function aok_cluster_score(array $post, array $svc): int {
    $pw = []; $sw = [];
    foreach (aok_cluster_words(($post['title'] ?? '') . ' ' . ($post['focusKeyword'] ?? '')) as $k) $pw[$k] = 4;
    foreach (aok_cluster_words((string)($post['excerpt'] ?? '')) as $k) if (!isset($pw[$k])) $pw[$k] = 2;
    foreach (aok_cluster_words((string)($post['body'] ?? '')) as $k) if (!isset($pw[$k])) $pw[$k] = 1;
    foreach (aok_cluster_words((string)($svc['title'] ?? '')) as $k) $sw[$k] = 2;
    foreach (aok_cluster_words((string)($svc['desc'] ?? '')) as $k) if (!isset($sw[$k])) $sw[$k] = 1;
    $s = 0;
    foreach ($pw as $k => $w) if (isset($sw[$k])) $s += $w * $sw[$k];
    return $s;
}

// best matches first; ties keep list order (an explicit index tiebreak keeps PHP and JS identical)
// best matches first; ties keep list order (an explicit index tiebreak keeps PHP and JS identical).
// $atLeast: when fewer strong matches exist, top up with the next-best ones, then with the first items.
function aok_cluster_pick(array $items, callable $score, int $n = 3, int $atLeast = 0): array {
    $scored = [];
    foreach (array_values($items) as $i => $x) $scored[] = [$score($x), $i, $x];
    usort($scored, function ($a, $b) { return $b[0] <=> $a[0] ?: $a[1] <=> $b[1]; });
    $out = [];
    foreach ($scored as $e) if ($e[0] >= AOK_CLUSTER_MIN && count($out) < $n) $out[$e[1]] = $e[2];
    foreach ($scored as $e) if (count($out) < $atLeast && $e[0] > 0 && !isset($out[$e[1]])) $out[$e[1]] = $e[2];
    foreach (array_values($items) as $i => $x) if (count($out) < $atLeast && !isset($out[$i])) $out[$i] = $x;
    return array_values($out);
}

// A service shows on the site unless it was merged into another page (redirectTo) or unpublished.
function aok_service_is_live(array $s): bool { return empty($s['redirectTo']) && empty($s['unpublished']); }
function aok_live_services(array $d): array {
    return array_values(array_filter($d['services'] ?? [], 'aok_service_is_live'));
}

function aok_live_posts(array $d): array {
    return array_values(array_filter($d['blog'] ?? [], function ($p) { return !empty($p['published']) && !empty($p['slug']) && empty($p['redirectTo']); }));
}

function aok_related_services(array $d, array $post, int $n = 3): array {
    return aok_cluster_pick(aok_live_services($d), function ($s) use ($post) { return aok_cluster_score($post, $s); }, $n, 2);
}

function aok_related_posts(array $d, array $svc, int $n = 3): array {
    return aok_cluster_pick(aok_live_posts($d), function ($p) use ($svc) { return aok_cluster_score($p, $svc); }, $n);
}

// ------------------------------------------------------------------ titles & meta ----

function aok_location_label(array $d): string {
    $loc = trim((string)aok_get($d, 'local.locality', 'Surrey'));
    $reg = trim((string)aok_get($d, 'local.regionCode', 'BC'));
    return $loc === '' ? '' : $loc . ($reg !== '' ? ', ' . $reg : '');
}

// Adds "· Surrey, BC" to a title (before the "| Brand" part) unless it already names the city.
function aok_with_location(string $title, array $d): string {
    $label = aok_location_label($d);
    if (!aok_get($d, 'local.locationInTitles', true) || $label === '' || $title === '') return $title;
    $city = trim((string)aok_get($d, 'local.locality', 'Surrey'));
    if (stripos($title, $city) !== false) return $title;
    $pos = strpos($title, ' | ');
    if ($pos === false) return $title . ' · ' . $label;
    $t = substr($title, 0, $pos) . ' · ' . $label . substr($title, $pos);
    // too long for Google (~65 chars)? drop a trailing "| brand" segment only (Google shows the site name
    // above the result anyway); the owner's keyword text is never removed
    $j = strrpos($t, ' | ');
    if ((function_exists('mb_strlen') ? mb_strlen($t, 'UTF-8') : strlen($t)) > 65 && $j !== false && stripos(substr($t, $j + 3), aok_brand($d)) !== false) $t = substr($t, 0, $j);
    return $t;
}

// "Title | Brand", unless that is too long for Google (~65 chars): then the title alone
// (Google shows the site name above each result anyway). Mirrors fitBrand() in assets/app.js.
function aok_fit_brand(string $title, string $brand): string {
    $t = $title . ' | ' . $brand;
    return mb_strlen($t, 'UTF-8') > 65 && $title !== '' ? $title : $t;
}

// A custom page's description: its own, else its text blocks, else the site description
function aok_page_description(array $d, array $pg): string {
    $own = trim((string)($pg['metaDescription'] ?? ''));
    if ($own !== '') return $own;
    $parts = [];
    foreach ((array)aok_get($d, 'blocks', []) as $k => $blocks) {
        if ($k !== 'page:' . ($pg['id'] ?? '')) continue;
        foreach ((array)$blocks as $b) foreach (['text', 'caption'] as $f) if (!empty($b[$f]) && is_string($b[$f])) $parts[] = aok_text($b[$f]);
    }
    $t = trim(implode(' ', $parts));
    return $t !== '' ? aok_cut($t, 158) : (string)aok_get($d, 'seo.home.metaDescription', '');
}

function aok_brand(array $d): string {
    return (string)(aok_get($d, 'local.businessName') ?: aok_get($d, 'brand.name', 'Analysis of Karma'));
}

// title, description, robots, canonical, og image/type for a resolved route
function aok_meta(array $d, array $r): array {
    $base = aok_base($d); $brand = aok_brand($d);
    $t = $r['type']; $seo = (array)aok_get($d, 'seo.' . $t, []);
    $m = ['title' => '', 'description' => '', 'robots' => 'index, follow', 'canonical' => $base . ($r['path'] ?? '/'),
          'ogType' => 'website', 'image' => $base . '/assets/og-image.jpg', 'imageSize' => [1200, 630], 'imageAlt' => aok_brand($d)];
    if (in_array($t, ['home', 'about', 'services', 'meditation', 'blog', 'contact', 'faq'], true)) {
        $m['title'] = (string)($seo['title'] ?? '') ?: $brand;
        $m['description'] = (string)($seo['metaDescription'] ?? '');
        $m['robots'] = (string)($seo['robots'] ?? '') ?: 'index, follow';
        if ($t !== 'blog') $m['title'] = aok_with_location($m['title'], $d);
        if ($t === 'home' && aok_get($d, 'home.hero.image')) { $m['image'] = aok_abs($base, aok_get($d, 'home.hero.image')); $m['imageSize'] = null; }
        if ($t === 'faq' && $m['title'] === $brand) $m['title'] = aok_text(aok_get($d, 'faqPage.hero.title', 'FAQ')) . ' | ' . $brand;
    } elseif ($t === 'service') {
        $s = $r['item'];
        $m['title'] = trim((string)($s['seoTitle'] ?? '')) ?: aok_with_location(aok_text($s['title'] ?? '') . ' | ' . $brand, $d);
        $m['description'] = trim((string)($s['seoDescription'] ?? '')) ?: aok_cut(aok_text($s['desc'] ?? ''), 158);
        $m['imageAlt'] = aok_text($s['title'] ?? '') . ' — ' . aok_brand($d);
        if (!empty($s['image']) && !preg_match('#^data:#i', (string)$s['image'])) { $m['image'] = aok_abs($base, $s['image']); $m['imageSize'] = null; }
        elseif ($img = aok_service_images($d, $s)) { $m['image'] = $img[0]; $m['imageSize'] = [1200, 675]; }
        if (!empty($s['canonical'])) $m['canonical'] = aok_abs($base, $s['canonical']);
        if (!empty($s['noindex'])) $m['robots'] = 'noindex, follow';
    } elseif ($t === 'post') {
        $p = $r['item'];
        $m['title'] = aok_fit_brand(aok_text($p['title'] ?? ''), $brand);
        $m['description'] = aok_cut(aok_text($p['excerpt'] ?? ''), 158);
        $m['robots'] = (string)($p['robots'] ?? '') ?: 'index, follow';
        $m['ogType'] = 'article';
        $m['imageAlt'] = aok_text($p['title'] ?? '');
        if (!empty($p['image']) && !preg_match('#^data:#i', (string)$p['image'])) { $m['image'] = aok_abs($base, $p['image']); $m['imageSize'] = null; }
        elseif ($img = aok_post_images($d, $p)) { $m['image'] = $img[0]; $m['imageSize'] = [1200, 675]; }
        if (!empty($p['canonical'])) $m['canonical'] = aok_abs($base, $p['canonical']);
    } elseif ($t === 'page') {
        $m['title'] = aok_fit_brand(aok_text($r['item']['title'] ?? ''), $brand);
        $m['description'] = aok_page_description($d, $r['item']);
    } elseif ($t === 'admin') {
        $m['title'] = 'Admin | ' . $brand; $m['robots'] = 'noindex, nofollow'; $m['canonical'] = '';
    } else {
        $m['title'] = 'Page not found | ' . $brand; $m['robots'] = 'noindex, follow'; $m['canonical'] = '';
    }
    if ($m['description'] === '') $m['description'] = (string)aok_get($d, 'seo.home.metaDescription', '');
    return $m;
}

// indexable pages also allow large image previews (Google Discover) and full snippets
function aok_robots_full(string $robots): string {
    if ($robots === '' || stripos($robots, 'noindex') !== false || stripos($robots, 'max-image-preview') !== false) return $robots;
    return $robots . ', max-image-preview:large, max-snippet:-1, max-video-preview:-1';
}

function aok_abs(string $base, $url): string {
    $url = (string)$url;
    if ($url === '' || preg_match('#^data:#i', $url)) return $base . '/assets/og-image.jpg';
    if (preg_match('#^https?://#i', $url)) return $url;
    return $base . '/' . ltrim($url, '/');
}

// The branded images made by tools/build-images.js (assets/img/<kind>/<slug>-16x9|4x3|1x1.jpg):
// absolute URLs of the three shapes for the first slug that has them, or [] if none exist.
function aok_brand_images(string $base, string $kind, array $slugs): array {
    $dir = dirname(__DIR__) . '/assets/img/' . $kind . '/';
    foreach (array_unique(array_filter($slugs)) as $slug) {
        if (!preg_match('/^[a-z0-9-]+$/', $slug) || !is_file($dir . $slug . '-16x9.jpg')) continue;
        $out = [];
        foreach (['16x9', '4x3', '1x1'] as $r) if (is_file($dir . $slug . '-' . $r . '.jpg')) $out[] = $base . '/assets/img/' . $kind . '/' . $slug . '-' . $r . '.jpg';
        return $out;
    }
    return [];
}
// the featured image at the top of a server-rendered post (uploaded image, else the branded 16:9 one)
function aok_featured_img_html(array $d, array $p): string {
    $alt = aok_text(($p['focusKeyword'] ?? '') !== '' ? $p['focusKeyword'] : ($p['title'] ?? ''));
    if (!empty($p['image']) && !preg_match('#^data:#i', (string)$p['image'])) return '<p><img src="' . aok_e(aok_abs(aok_base($d), $p['image'])) . '" alt="' . aok_e($alt) . '" style="max-width:100%;height:auto"></p>';
    $img = aok_post_images($d, $p);
    return $img ? '<p><img src="' . aok_e($img[0]) . '" width="1200" height="675" alt="' . aok_e($alt) . '" style="max-width:100%;height:auto"></p>' : '';
}
// a service's 3D banner: kept under the first address it had (banner), else its address or title; a service
// added later has none of its own and shares the generic one ($fallback; SEO Health asks with false)
const AOK_SVC_BANNER_FALLBACK = 'vedic-astrology-jyotish-deep-dives';
function aok_service_images(array $d, array $s, bool $fallback = true): array {
    $keys = [(string)($s['banner'] ?? ''), aok_slugify((string)($s['slug'] ?? '')), aok_slugify((string)($s['title'] ?? ''))];
    if ($fallback) $keys[] = AOK_SVC_BANNER_FALLBACK;
    return aok_brand_images(aok_base($d), 'services', $keys);
}
function aok_post_images(array $d, array $p): array {
    return aok_brand_images(aok_base($d), 'posts', [(string)($p['slug'] ?? '')]);
}

// ------------------------------------------------------------------ local business ----

function aok_price(string $s): array {   // "$100 CAD" -> ['100', 'CAD']
    $num = preg_match('/(\d+(?:[.,]\d+)?)/', $s, $m) ? str_replace(',', '.', $m[1]) : '';
    $cur = preg_match('/\b([A-Z]{3})\b/', $s, $c) ? $c[1] : (string)'CAD';
    return [$num, $cur];
}

// +1 (236) 660-2000 -> +12366602000 (North American numbers without a country code get +1)
function aok_e164(string $phone): string {
    $digits = preg_replace('/\D/', '', $phone);
    if ($digits === '') return '';
    if (strpos(trim($phone), '+') === 0) return '+' . $digits;
    return strlen($digits) === 10 ? '+1' . $digits : '+' . $digits;
}

function aok_lang_codes(array $names): array {
    $map = ['english' => 'en', 'hindi' => 'hi', 'punjabi' => 'pa', 'urdu' => 'ur', 'gujarati' => 'gu', 'sanskrit' => 'sa', 'french' => 'fr'];
    $out = [];
    foreach ($names as $n) { $k = strtolower(trim((string)$n)); if ($k !== '') $out[] = $map[$k] ?? $k; }
    return array_values(array_unique($out));
}

// "+1 (236) 660-2000" -> https://wa.me/12366602000?text=…
function aok_whatsapp_url(array $d): string {
    $n = preg_replace('/\D/', '', (string)(aok_get($d, 'contact.whatsapp', '') ?: aok_get($d, 'contact.phone', '')));
    if ($n === '') return '';
    if (strlen($n) === 10) $n = '1' . $n;
    $t = trim((string)aok_get($d, 'contact.whatsappText', ''));
    return 'https://wa.me/' . $n . ($t !== '' ? '?text=' . rawurlencode($t) : '');
}

// "@analysisofkarma" from the X / Twitter profile in the social links
function aok_x_handle(array $d): string {
    foreach ($d['socials'] ?? [] as $s) {
        if (preg_match('#^https?://(www\.)?(x|twitter)\.com/([A-Za-z0-9_]{1,15})/?$#i', trim((string)($s['url'] ?? '')), $m)) return '@' . $m[3];
    }
    return '';
}

// same profile, different spelling: https://www.x.com/a/ == http://x.com/a
function aok_url_key(string $u): string {
    return rtrim(preg_replace('#^https?://(www\.)?#i', '', strtolower(trim($u))), '/');
}

function aok_same_as(array $d): array {
    $urls = [];
    foreach (['facebook', 'instagram', 'youtube', 'gmb'] as $k) $urls[] = aok_get($d, 'contact.' . $k, '');
    foreach ($d['socials'] ?? [] as $s) $urls[] = $s['url'] ?? '';
    $urls[] = aok_get($d, 'local.mapsCidUrl', '');
    $urls[] = aok_get($d, 'contact.trustpilot', '');
    foreach ((array)aok_get($d, 'local.directories', []) as $u) $urls[] = $u;
    $out = [];
    $seen = [];
    foreach ($urls as $u) { $u = trim((string)$u); $k = aok_url_key($u); if (preg_match('#^https?://#i', $u) && !isset($seen[$k])) { $out[] = $u; $seen[$k] = 1; } }
    return $out;
}

// areaServed: "Surrey, BC, Canada" -> City, "Punjab, India" -> AdministrativeArea, "Canada" -> Country
function aok_area_served(array $d): array {
    $out = []; $seen = [];
    $countries = ['canada', 'united states', 'usa', 'united kingdom', 'uk', 'india'];
    foreach ((array)aok_get($d, 'local.areasServed', []) as $a) {
        $a = trim((string)$a); if ($a === '') continue;
        $parts = array_map('trim', explode(',', $a));
        if (count($parts) === 1) $type = in_array(strtolower($a), $countries, true) ? 'Country' : 'Place';
        elseif (count($parts) >= 3 || preg_match('/^[A-Z]{2}$/', $parts[1])) $type = 'City';
        else $type = 'AdministrativeArea';
        $out[] = ['@type' => $type, 'name' => $a];
        $seen[strtolower($parts[0])] = 1;
    }
    $rc = trim((string)aok_get($d, 'local.regionCode', 'BC'));
    foreach ((array)aok_get($d, 'local.nearbyCities', []) as $c) {   // cities named on the page but not in the list above
        $c = trim((string)$c); if ($c === '' || isset($seen[strtolower($c)])) continue;
        $out[] = ['@type' => 'City', 'name' => $c . ($rc !== '' && strpos($c, ',') === false ? ', ' . $rc : '')];
    }
    if (aok_get($d, 'local.onlineWorldwide', true)) {
        $ch = implode(' & ', array_filter((array)aok_get($d, 'local.onlineChannels', ['Zoom', 'WhatsApp'])));
        $out[] = ['@type' => 'Place', 'name' => 'Worldwide (online consultations' . ($ch ? ' via ' . $ch : '') . ')'];
    }
    return $out;
}

function aok_hours(array $d): array {
    $days = ['Mo' => 'Monday', 'Tu' => 'Tuesday', 'We' => 'Wednesday', 'Th' => 'Thursday', 'Fr' => 'Friday', 'Sa' => 'Saturday', 'Su' => 'Sunday'];
    $groups = [];
    foreach ($days as $k => $name) {
        $h = (array)aok_get($d, 'local.hours.' . $k, []);
        $o = trim((string)($h['o'] ?? '')); $c = trim((string)($h['c'] ?? ''));
        if (!preg_match('/^\d{1,2}:\d{2}$/', $o) || !preg_match('/^\d{1,2}:\d{2}$/', $c)) continue;
        $groups[$o . '-' . $c]['days'][] = 'https://schema.org/' . $name;
        $groups[$o . '-' . $c]['o'] = $o; $groups[$o . '-' . $c]['c'] = $c;
    }
    $out = [];
    foreach ($groups as $g) $out[] = ['@type' => 'OpeningHoursSpecification', 'dayOfWeek' => $g['days'], 'opens' => $g['o'], 'closes' => $g['c']];
    return $out;
}

function aok_hours_text(array $d): array {   // ['Monday' => '10:00–18:00', …] for the visible footer
    $days = ['Mo' => 'Mon', 'Tu' => 'Tue', 'We' => 'Wed', 'Th' => 'Thu', 'Fr' => 'Fri', 'Sa' => 'Sat', 'Su' => 'Sun'];
    $out = [];
    foreach ($days as $k => $n) {
        $h = (array)aok_get($d, 'local.hours.' . $k, []);
        if (!empty($h['o']) && !empty($h['c'])) $out[$n] = $h['o'] . '–' . $h['c'];
    }
    return $out;
}

// ------------------------------------------------------------------ structured data (@graph) ----

function aok_graph(array $d, array $r, array $meta): array {
    $base = aok_base($d); $brand = aok_brand($d);
    $ORG = $base . '/#organization'; $PERSON = $base . '/#person'; $SITE = $base . '/#website'; $CATALOG = $base . '/#services';
    $url = $meta['canonical'] ?: $base . ($r['path'] ?? '/');
    $slugs = aok_service_slugs($d['services'] ?? []);
    $logo = $base . (is_file(__DIR__ . '/../assets/logo-512.png') ? '/assets/logo-512.png' : '/assets/logo.png');
    $sameAs = aok_same_as($d);
    $lang = array_values(array_filter((array)aok_get($d, 'local.languages', ['English', 'Hindi'])));
    $langCodes = aok_lang_codes($lang);

    $address = ['@type' => 'PostalAddress', 'addressLocality' => aok_get($d, 'local.locality', 'Surrey'),
                'addressRegion' => aok_get($d, 'local.regionCode', 'BC'), 'addressCountry' => aok_get($d, 'local.country', 'CA')];
    if (!aok_get($d, 'local.serviceAreaBusiness', true) && trim((string)aok_get($d, 'local.streetAddress', '')) !== '') $address['streetAddress'] = aok_get($d, 'local.streetAddress');
    if (trim((string)aok_get($d, 'local.postalCode', '')) !== '' && !aok_get($d, 'local.serviceAreaBusiness', true)) $address['postalCode'] = aok_get($d, 'local.postalCode');

    $org = ['@type' => aok_get($d, 'local.businessType', 'ProfessionalService') ?: 'ProfessionalService', '@id' => $ORG,
        'name' => $brand, 'url' => $base . '/', 'logo' => ['@type' => 'ImageObject', 'url' => $logo], 'image' => $logo,
        'description' => aok_text(aok_get($d, 'seo.home.metaDescription', '') ?: aok_get($d, 'brand.tagline', '')),
        'slogan' => aok_text(aok_get($d, 'brand.tagline', '')), 'address' => $address, 'areaServed' => aok_area_served($d),
        'founder' => ['@id' => $PERSON], 'employee' => ['@id' => $PERSON], 'knowsLanguage' => $langCodes, 'hasOfferCatalog' => ['@id' => $CATALOG],
        'priceRange' => aok_get($d, 'local.priceRange', ''), 'currenciesAccepted' => aok_get($d, 'local.currency', 'CAD')];
    if ($v = aok_get($d, 'local.legalName')) $org['legalName'] = $v;
    $tel = aok_e164((string)aok_get($d, 'contact.phone', ''));
    if ($tel !== '') $org['telephone'] = $tel;
    if ($pm = array_values(array_filter((array)aok_get($d, 'local.paymentMethods', [])))) $org['paymentAccepted'] = implode(', ', $pm);
    if ($tel !== '') {   // no email in the schema: addresses stay private (spam); the contact page is the channel
        $cp = ['@type' => 'ContactPoint', 'contactType' => 'customer service', 'telephone' => $tel,
               'availableLanguage' => $lang, 'areaServed' => ['CA', 'US', 'GB', 'IN'], 'url' => $base . '/contact'];
        if ($h = aok_hours($d)) $cp['hoursAvailable'] = $h;
        $org['contactPoint'] = [$cp];
    }
    $lat = trim((string)aok_get($d, 'local.lat', '')); $lng = trim((string)aok_get($d, 'local.lng', ''));
    if (is_numeric($lat) && is_numeric($lng)) $org['geo'] = ['@type' => 'GeoCoordinates', 'latitude' => (float)$lat, 'longitude' => (float)$lng];
    if ($v = trim((string)(aok_get($d, 'local.mapsCidUrl', '') ?: aok_get($d, 'contact.gmb', '')))) $org['hasMap'] = $v;
    if ($sameAs) $org['sameAs'] = $sameAs;
    if ($h = aok_hours($d)) $org['openingHoursSpecification'] = $h;
    $kn = array_values(array_filter((array)aok_get($d, 'person.knowsAbout', [])));
    if ($kn) $org['knowsAbout'] = $kn;
    $cats = array_values(array_filter(array_merge([aok_get($d, 'local.gbpPrimaryCategory', '')], (array)aok_get($d, 'local.gbpAdditionalCategories', []))));
    if ($cats) $org['keywords'] = implode(', ', $cats);

    $person = ['@type' => 'Person', '@id' => $PERSON, 'name' => aok_get($d, 'person.name', aok_get($d, 'brand.astrologer', 'Jag Mallah')),
        'jobTitle' => aok_get($d, 'person.jobTitle', 'Vedic Astrologer'), 'url' => $base . '/about', 'worksFor' => ['@id' => $ORG],
        'knowsLanguage' => $langCodes];
    if ($v = aok_text(aok_get($d, 'person.shortBio', ''))) $person['description'] = $v;
    $person['image'] = $logo;   // the Analysis of Karma emblem until a portrait is uploaded (below)
    if ($kn) $person['knowsAbout'] = $kn;
    $img = aok_get($d, 'person.image') ?: aok_get($d, 'home.about.image') ?: aok_get($d, 'home.hero.image');
    if ($img && !preg_match('#^data:#', (string)$img)) $person['image'] = aok_abs($base, $img);
    $occSkills = array_values(array_filter(array_merge((array)aok_get($d, 'person.studies', []), (array)aok_get($d, 'person.classicalTexts', []))));
    $person['hasOccupation'] = ['@type' => 'Occupation', 'name' => aok_get($d, 'person.jobTitle', 'Vedic Astrologer'),
        'occupationLocation' => ['@type' => 'City', 'name' => aok_location_label($d)]] + ($occSkills ? ['skills' => implode(', ', $occSkills)] : []);
    if ($m = trim((string)aok_get($d, 'person.mentor', ''))) $person['knows'] = ['@type' => 'Person', 'name' => $m, 'description' => 'Teacher and mentor in Vedic astrology'];
    $ps = array_values(array_unique(array_filter((array)aok_get($d, 'person.sameAs', []), function ($u) { return preg_match('#^https?://#i', (string)$u); })));
    if ($ps) $person['sameAs'] = $ps;

    $website = ['@type' => 'WebSite', '@id' => $SITE, 'url' => $base . '/', 'name' => $brand,
        'description' => aok_text(aok_get($d, 'brand.tagline', '')), 'publisher' => ['@id' => $ORG], 'inLanguage' => 'en-CA'];

    $graph = [$website, $org, $person];

    // services + catalogue (home, services overview, and the individual service page)
    $serviceNode = function ($s) use ($d, $base, $slugs, $ORG, $PERSON) {
        $slug = $slugs[(string)($s['id'] ?? '')] ?? aok_slugify($s['title'] ?? '');
        $n = ['@type' => 'Service', '@id' => $base . '/services/' . $slug . '#service', 'name' => aok_text($s['title'] ?? ''),
              'description' => aok_text($s['desc'] ?? ''), 'url' => $base . '/services/' . $slug, 'provider' => [['@id' => $ORG], ['@id' => $PERSON]],
              'serviceType' => aok_text($s['title'] ?? ''), 'category' => 'Vedic astrology', 'areaServed' => aok_area_served($d)];
        if (trim((string)($s['focusKeyword'] ?? '')) !== '') $n['keywords'] = aok_text($s['focusKeyword']);
        if (!empty($s['image']) && !preg_match('#^data:#i', (string)$s['image'])) $n['image'] = aok_abs($base, $s['image']);
        elseif ($img = aok_service_images($d, $s)) $n['image'] = $img;
        list($price, $cur) = aok_price((string)($s['price'] ?? ''));
        if ($price !== '') {
            $unit = stripos((string)(($s['priceUnit'] ?? '') !== '' ? $s['priceUnit'] : aok_get($d, 'about.pricing.unit', '')), 'hour') !== false ? 'hour' : null;
            $n['offers'] = ['@type' => 'Offer', 'price' => $price, 'priceCurrency' => $cur, 'url' => $base . '/services/' . $slug,
                'availability' => 'https://schema.org/InStock', 'seller' => ['@id' => $ORG],
                'description' => aok_text(aok_get($d, 'local.paymentPolicy', ''))]
                + ($unit ? ['priceSpecification' => ['@type' => 'UnitPriceSpecification', 'price' => $price, 'priceCurrency' => $cur, 'unitText' => $unit]] : []);
        }
        return $n;
    };
    $visibleServices = aok_live_services($d);
    if (in_array($r['type'], ['home', 'services'], true)) {
        $items = [];
        foreach ($visibleServices as $s) { $node = $serviceNode($s); $graph[] = $node; $items[] = ['@id' => $node['@id']]; }
        $graph[] = ['@type' => 'OfferCatalog', '@id' => $CATALOG, 'name' => 'Vedic astrology services', 'itemListElement' => $items];
    }

    // the page itself
    $types = ['about' => 'AboutPage', 'contact' => 'ContactPage', 'blog' => 'CollectionPage', 'services' => 'CollectionPage', 'faq' => 'FAQPage'];
    $page = ['@type' => $types[$r['type']] ?? 'WebPage', '@id' => $url . '#webpage', 'url' => $url, 'name' => $meta['title'],
        'description' => $meta['description'], 'isPartOf' => ['@id' => $SITE], 'inLanguage' => 'en-CA', 'dateModified' => aok_last_modified()];
    if ($r['type'] === 'home') $page['about'] = ['@id' => $ORG];
    if ($r['type'] === 'about') { $page['about'] = ['@id' => $PERSON]; $page['mainEntity'] = ['@id' => $PERSON]; }
    if ($r['type'] === 'contact') $page['mainEntity'] = ['@id' => $ORG];

    // breadcrumbs
    $crumbs = [['Home', $base . '/']];
    $label = ['about' => 'About', 'services' => 'Services', 'meditation' => 'Meditation', 'blog' => 'Blog', 'contact' => 'Contact', 'faq' => 'FAQ'];
    if (isset($label[$r['type']])) $crumbs[] = [$label[$r['type']], $url];
    if ($r['type'] === 'service') { $crumbs[] = ['Services', $base . '/services']; $crumbs[] = [aok_text($r['item']['title'] ?? ''), $url]; }
    if ($r['type'] === 'post') { $crumbs[] = ['Blog', $base . '/blog']; $crumbs[] = [aok_text($r['item']['title'] ?? ''), $url]; }
    if ($r['type'] === 'page') $crumbs[] = [aok_text($r['item']['title'] ?? ''), $url];
    if (count($crumbs) > 1) {
        $li = []; foreach ($crumbs as $i => $c) $li[] = ['@type' => 'ListItem', 'position' => $i + 1, 'name' => $c[0], 'item' => $c[1]];
        $graph[] = ['@type' => 'BreadcrumbList', '@id' => $url . '#breadcrumb', 'itemListElement' => $li];
        $page['breadcrumb'] = ['@id' => $url . '#breadcrumb'];
    }

    if ($r['type'] === 'faq') {
        $qs = [];
        foreach ((array)aok_get($d, 'faqPage.items', []) as $it) {
            $q = aok_text($it['q'] ?? ''); $a = aok_text($it['a'] ?? '');
            if ($q !== '' && $a !== '') $qs[] = ['@type' => 'Question', 'name' => $q, 'acceptedAnswer' => ['@type' => 'Answer', 'text' => $a]];
        }
        $page['mainEntity'] = $qs;
    }
    if ($r['type'] === 'service') {
        $node = $serviceNode($r['item']); $graph[] = $node; $page['mainEntity'] = ['@id' => $node['@id']];
        $qs = [];
        foreach (aok_md_faq((string)($r['item']['detail'] ?? '')) as $x) $qs[] = ['@type' => 'Question', 'name' => $x[0], 'acceptedAnswer' => ['@type' => 'Answer', 'text' => $x[1]]];
        if ($qs) $graph[] = ['@type' => 'FAQPage', '@id' => $url . '#faq', 'url' => $url, 'isPartOf' => ['@id' => $SITE], 'about' => ['@id' => $node['@id']], 'mainEntity' => $qs];
    }
    if ($r['type'] === 'post') {
        $p = $r['item'];
        $post = ['@type' => 'BlogPosting', '@id' => $url . '#article', 'headline' => aok_cut(aok_text($p['title'] ?? ''), 110),
            'description' => $meta['description'], 'url' => $url, 'mainEntityOfPage' => ['@id' => $url . '#webpage'],
            'author' => ['@id' => $PERSON], 'publisher' => ['@id' => $ORG], 'image' => (empty($p['image']) && ($img = aok_post_images($d, $p))) ? $img : $meta['image'], 'inLanguage' => 'en-CA',
            'wordCount' => str_word_count(aok_text($p['body'] ?? ''))];
        if (!empty($p['date'])) { $post['datePublished'] = substr($p['date'], 0, 10); $post['dateModified'] = substr($p['date'], 0, 10); }
        if (!empty($p['focusKeyword'])) $post['keywords'] = $p['focusKeyword'];
        $graph[] = $post;
    }
    $graph[] = $page;

    // the admin's "extra schema" box: business-type objects merge into the business, anything else is appended
    $extra = json_decode((string)($d['schema'] ?? ''), true);
    if (is_array($extra)) {
        $list = isset($extra['@graph']) ? (array)$extra['@graph'] : (aok_is_list($extra) ? $extra : [$extra]);
        foreach ($list as $node) {
            if (!is_array($node)) continue;
            unset($node['@context'], $node['email']);   // email addresses stay private
            $type = (array)($node['@type'] ?? []);
            if (array_intersect($type, ['ProfessionalService', 'LocalBusiness', 'Organization'])) {
                foreach (['sameAs', 'knowsAbout'] as $k) {
                    if (empty($node[$k])) continue;
                    $have = []; foreach ((array)($graph[1][$k] ?? []) as $v) $have[aok_url_key((string)$v)] = 1;
                    foreach ((array)$node[$k] as $v) if (is_string($v) && !isset($have[aok_url_key($v)])) { $graph[1][$k][] = $v; $have[aok_url_key($v)] = 1; }
                }
                foreach ($node as $k => $v) {   // only adds what the admin settings don't already provide
                    if (in_array($k, ['@type', '@id', 'sameAs', 'knowsAbout', 'founder', 'areaServed', 'url', 'name', 'email', 'contactPoint'], true)) continue;
                    if ($v === '' || $v === [] || $v === null || (isset($graph[1][$k]) && $graph[1][$k] !== '' && $graph[1][$k] !== [])) continue;
                    $graph[1][$k] = $v;
                }
            } elseif ($type) {
                $graph[] = $node;
            }
        }
    }
    return ['@context' => 'https://schema.org', '@graph' => aok_clean($graph)];
}

function aok_clean($v) {   // drop empty values so the markup stays valid and compact
    if (!is_array($v)) return $v;
    $out = [];
    foreach ($v as $k => $x) {
        $x = aok_clean($x);
        if ($x === '' || $x === null || $x === []) continue;
        $out[$k] = $x;
    }
    return aok_is_list($v) ? array_values($out) : $out;
}

// ------------------------------------------------------------------ server-rendered HTML ----
// A faithful, semantic HTML version of each page (same words as the interactive site, real links).
// Search engines and AI crawlers read this directly; browsers replace it with the interactive page.

function aok_link_for($link, array $d): string {   // button / nav targets -> href
    $link = trim((string)$link);
    if (preg_match('#^(https?:|mailto:|tel:)#i', $link)) return $link;
    if (in_array($link, ['home', 'about', 'services', 'meditation', 'blog', 'contact', 'faq'], true)) return aok_route_path($link);
    return '/contact';
}

function aok_nav_href(array $it, array $d): string {
    $t = $it['type'] ?? 'route'; $v = (string)($it['value'] ?? '');
    if ($t === 'url') return aok_safe_url($v) !== '' ? $v : '/';
    if ($t === 'page') { foreach ($d['pages'] ?? [] as $pg) if (($pg['id'] ?? '') === $v && !empty($pg['slug'])) return '/' . rawurlencode($pg['slug']); return '/'; }
    return aok_route_path($v ?: 'home');
}

function aok_btn(array $d, string $path, string $defLabel, string $defLink): string {
    $c = (array)aok_get($d, $path, []);
    $label = trim((string)($c['label'] ?? '')) ?: $defLabel;
    return '<a class="aok-ssr-btn" href="' . aok_e(aok_link_for($c['link'] ?? $defLink, $d)) . '">' . aok_e(aok_text($label)) . '</a>';
}

// "Call +1 (236) 660-2000 · WhatsApp" links (header, contact page, service pages)
function aok_contact_links_html(array $d): string {
    $ph = trim((string)aok_get($d, 'contact.phone', '')); $tel = aok_e164($ph); $wa = aok_whatsapp_url($d);
    $l = [];
    if ($tel !== '') $l[] = '<a href="tel:' . aok_e($tel) . '">Call ' . aok_e($ph) . '</a>';
    if ($wa !== '') $l[] = '<a href="' . aok_e($wa) . '" rel="noopener">WhatsApp Jag Mallah</a>';
    return $l ? '<p>' . implode(' · ', $l) . '</p>' : '';
}

function aok_review_links_html(array $d): string {
    $l = [];
    if ($u = aok_safe_url(aok_get($d, 'local.reviewUrl', '') ?: aok_get($d, 'local.mapsCidUrl', '') ?: aok_get($d, 'contact.gmb', ''))) $l[] = '<a href="' . aok_e($u) . '" rel="noopener">Review us on Google Maps</a>';
    if ($u = aok_safe_url(aok_get($d, 'contact.trustpilot', ''))) $l[] = '<a href="' . aok_e($u) . '" rel="noopener">Review us on Trustpilot</a>';
    return $l ? '<p>' . implode(' · ', $l) . '</p>' : '';
}

// "Surrey, BC, Canada" -> "Surrey" (+ nearby cities not already listed); mirrors areaShortNames() in app.js
function aok_area_short_names(array $d): array {
    $out = [];
    foreach (array_merge((array)aok_get($d, 'local.areasServed', []), (array)aok_get($d, 'local.nearbyCities', [])) as $a) {
        $n = trim(explode(',', (string)$a)[0]); if ($n !== '' && !in_array($n, $out, true)) $out[] = $n;
    }
    return $out;
}

function aok_html_header(array $d): string {
    $h = '<header><p><a href="/"><strong>' . aok_e(aok_brand($d)) . '</strong></a> — Vedic Astrology</p><nav aria-label="Main"><ul>';
    foreach ((array)aok_get($d, 'nav.items', []) as $it) $h .= '<li><a href="' . aok_e(aok_nav_href($it, $d)) . '">' . aok_e($it['label'] ?? 'Link') . '</a></li>';
    $h .= '</ul></nav>' . aok_contact_links_html($d) . '</header>';
    return $h;
}

function aok_nap_html(array $d): string {
    $o = '<address><strong>' . aok_e(aok_brand($d)) . '</strong><br>' . aok_e(aok_get($d, 'person.jobTitle', 'Vedic Astrologer')) . ' ' . aok_e(aok_get($d, 'person.name', 'Jag Mallah'));
    $street = trim((string)aok_get($d, 'local.streetAddress', ''));
    if (!aok_get($d, 'local.serviceAreaBusiness', true) && $street !== '') $o .= '<br>' . aok_e($street);
    $o .= '<br>' . aok_e(aok_get($d, 'local.locality', 'Surrey')) . ', ' . aok_e(aok_get($d, 'local.region', 'British Columbia')) . ', ' . aok_e(aok_get($d, 'local.country', 'CA') === 'CA' ? 'Canada' : aok_get($d, 'local.country'));
    if ($ph = trim((string)aok_get($d, 'contact.phone', ''))) $o .= '<br>Phone &amp; WhatsApp: <a href="tel:' . aok_e(aok_e164($ph)) . '">' . aok_e($ph) . '</a>';
    $areas = aok_area_short_names($d);
    if ($areas) $o .= '<br>Serving: ' . aok_e(implode(', ', $areas)) . (aok_get($d, 'local.onlineWorldwide', true) ? ' · Worldwide online (' . aok_e(implode(' & ', array_filter((array)aok_get($d, 'local.onlineChannels', ['Zoom', 'WhatsApp'])))) . ')' : '');
    if ($hrs = aok_hours_text($d)) {
        $p = []; foreach ($hrs as $day => $t) $p[] = $day . ' ' . $t;
        $o .= '<br>Hours: ' . aok_e(count($hrs) === 7 && count(array_unique($hrs)) === 1 ? 'Mon–Sun ' . reset($hrs) : implode(' · ', $p))
            . (aok_get($d, 'local.timezone', '') === 'America/Vancouver' ? ' (Pacific Time)' : '');
    }
    return $o . '</address>';
}

function aok_html_footer(array $d): string {
    $f = '<footer><p>' . aok_e(aok_text(aok_get($d, 'brand.tagline', ''))) . '</p>' . aok_nap_html($d) . aok_review_links_html($d) . '<nav aria-label="Footer"><ul>';
    foreach ([['/', 'Home'], ['/about', 'About Us'], ['/services', 'Services'], ['/meditation', 'Meditation'], ['/blog', 'Blog'], ['/faq', 'FAQ'], ['/contact', 'Contact']] as $l)
        $f .= '<li><a href="' . $l[0] . '">' . $l[1] . '</a></li>';
    $f .= '</ul></nav>';
    $so = aok_same_as($d);
    if ($so) { $f .= '<ul>'; foreach ($so as $u) $f .= '<li><a href="' . aok_e($u) . '" rel="noopener">' . aok_e(parse_url($u, PHP_URL_HOST)) . '</a></li>'; $f .= '</ul>'; }
    $f .= '<p><strong>Disclaimer:</strong> ' . aok_e(aok_text(aok_get($d, 'disclaimer', ''))) . '</p>';
    return $f . '<p>© ' . date('Y') . ' ' . aok_e(aok_brand($d)) . '. All rights reserved.</p></footer>';
}

function aok_join_list(array $items): string {   // "a, b and c"
    $items = array_values(array_filter(array_map('trim', array_map('strval', $items)), 'strlen'));
    if (count($items) < 2) return implode('', $items);
    return implode(', ', array_slice($items, 0, -1)) . ' and ' . end($items);
}

function aok_fee_line(array $d): string {
    $ch = implode(' & ', array_filter((array)aok_get($d, 'local.onlineChannels', ['Zoom', 'WhatsApp'])));
    return trim(aok_text(aok_get($d, 'about.pricing.fee', '$100 CAD')) . ' ' . aok_text(aok_get($d, 'about.pricing.unit', 'per hour'))) . ($ch ? ' · ' . $ch : '') . ' · New clients pay only if satisfied';
}

// Visible E-E-A-T card (matches the Person in the structured data), on service pages and blog posts
function aok_author_card_html(array $d): string {
    $name = aok_get($d, 'person.name', 'Jag Mallah');
    $o = '<aside id="about-the-astrologer" aria-labelledby="about-the-astrologer-h"><h2 id="about-the-astrologer-h">About the Astrologer — ' . aok_e($name) . '</h2>';
    $o .= '<p><strong>' . aok_e(aok_get($d, 'person.jobTitle', 'Vedic Astrologer')) . '</strong> · ' . aok_e(aok_location_label($d)) . ' · Online worldwide</p>';
    $studies = (array)aok_get($d, 'person.studies', []); $mentor = trim((string)aok_get($d, 'person.mentor', ''));
    if ($studies) $o .= '<p>Formal training in ' . aok_e(aok_join_list($studies)) . ($mentor !== '' ? ' under ' . aok_e($mentor) : '') . '.</p>';
    $texts = (array)aok_get($d, 'person.classicalTexts', []); $trad = trim((string)aok_get($d, 'person.traditions', ''));
    if ($texts) $o .= '<p>Classical research' . ($trad !== '' ? ': ' . aok_e($trad) . ', through ' : ': ') . aok_e(aok_join_list($texts)) . '.</p>';
    if ($ph = array_values(array_filter((array)aok_get($d, 'person.philosophy', [])))) $o .= '<p>Grounded in ' . aok_e(aok_join_list($ph)) . '.</p>';
    if ($ln = array_values(array_filter((array)aok_get($d, 'local.languages', [])))) $o .= '<p>Consultations in ' . aok_e(aok_join_list($ln)) . '.</p>';
    $o .= '<p>' . aok_e(aok_fee_line($d)) . '</p>';
    return $o . '<p><a href="/contact">Book a consultation with ' . aok_e($name) . '</a> · <a href="/about">More about ' . aok_e($name) . '</a></p></aside>';
}

// "Service Areas & Online Consultations": where clients are served (a service-area business, consulting online)
function aok_area_items(array $d): array {
    $loc = trim((string)aok_get($d, 'local.locality', 'Surrey')); $region = trim((string)aok_get($d, 'local.region', 'British Columbia'));
    $items = [];
    $nb = array_values(array_filter((array)aok_get($d, 'local.neighbourhoods', [])));
    $ab = array_values(array_filter((array)aok_get($d, 'local.abroad', [])));
    if ($loc !== '') $items[] = aok_location_label($d) . ' (home base)' . ($nb ? ': ' . aok_join_list($nb) : '');
    $cities = array_values(array_filter((array)aok_get($d, 'local.nearbyCities', [])));
    if ($cities) $items[] = trim((string)aok_get($d, 'local.nearbyLabel', 'Greater Vancouver')) . ': ' . aok_join_list($cities);
    if ($region !== '') $items[] = $region . ' and across ' . (aok_get($d, 'local.country', 'CA') === 'CA' ? 'Canada' : aok_get($d, 'local.country'));
    if ($ab) $items[] = 'Clients abroad: ' . aok_join_list($ab);
    if (aok_get($d, 'local.onlineWorldwide', true)) {
        $langs = array_values(array_filter((array)aok_get($d, 'local.languages', [])));
        $items[] = 'Worldwide online via ' . implode(' & ', array_filter((array)aok_get($d, 'local.onlineChannels', ['Zoom', 'WhatsApp']))) . ($langs ? ', in ' . aok_join_list($langs) : '');
    }
    return $items;
}

function aok_areas_intro(array $d): string {
    $ch = aok_join_list(array_filter((array)aok_get($d, 'local.onlineChannels', ['Zoom', 'WhatsApp'])));
    $cities = array_values(array_filter((array)aok_get($d, 'local.nearbyCities', [])));
    return 'Based in ' . aok_get($d, 'local.locality', 'Surrey') . ', ' . aok_get($d, 'local.region', 'British Columbia') . ', ' . aok_get($d, 'person.name', 'Jag Mallah')
        . ' offers Vedic astrology consultations over ' . $ch . ' to clients across ' . ($cities ? trim((string)aok_get($d, 'local.nearbyLabel', 'Greater Vancouver')) . ', ' : '')
        . aok_get($d, 'local.region', 'British Columbia') . ', Canada' . (aok_get($d, 'local.onlineWorldwide', true) ? ' and worldwide.' : '.');
}

function aok_areas_html(array $d): string {
    $o = '<section id="service-areas" aria-labelledby="service-areas-h"><h2 id="service-areas-h">Service Areas &amp; Online Consultations</h2><p>' . aok_e(aok_areas_intro($d)) . '</p><ul>';
    foreach (aok_area_items($d) as $it) $o .= '<li>' . aok_e($it) . '</li>';
    return $o . '</ul><p><a href="/contact">Book an online consultation</a></p></section>';
}

function aok_related_services_html(array $d, array $post): string {
    $rel = aok_related_services($d, $post);
    if (!$rel) return '';
    $slugs = aok_service_slugs($d['services'] ?? []);
    $o = '<section aria-labelledby="related-services-h"><h2 id="related-services-h">Related consultations</h2><ul>';
    foreach ($rel as $s) $o .= '<li><a href="/services/' . aok_e($slugs[(string)($s['id'] ?? '')] ?? '') . '">' . aok_e(aok_text($s['title'] ?? '')) . '</a> — ' . aok_e(aok_text($s['desc'] ?? '')) . '</li>';
    return $o . '</ul></section>';
}

function aok_related_posts_html(array $d, array $svc): string {
    $rel = aok_related_posts($d, $svc);
    if (!$rel) return '';
    $o = '<section aria-labelledby="related-posts-h"><h2 id="related-posts-h">Articles on ' . aok_e(aok_text($svc['title'] ?? '')) . '</h2><ul>';
    foreach ($rel as $p) $o .= '<li><a href="/blog/' . aok_e(rawurlencode($p['slug'])) . '">' . aok_e(aok_text($p['title'] ?? '')) . '</a> — ' . aok_e(aok_text($p['excerpt'] ?? '')) . '</li>';
    return $o . '</ul></section>';
}

function aok_crumbs(array $items): string {
    $o = '<nav aria-label="Breadcrumb"><ol>';
    foreach ($items as $i => $c) $o .= '<li>' . ($i < count($items) - 1 ? '<a href="' . aok_e($c[1]) . '">' . aok_e($c[0]) . '</a>' : aok_e($c[0])) . '</li>';
    return $o . '</ol></nav>';
}

function aok_faq_html(array $d, string $tag = 'h3'): string {
    $o = '';
    foreach ((array)aok_get($d, 'faqPage.items', []) as $it)
        $o .= '<' . $tag . '>' . aok_e(aok_text($it['q'] ?? '')) . '</' . $tag . '><p>' . aok_rich($it['a'] ?? '') . '</p>';
    return $o;
}

function aok_services_list(array $d, array $services, bool $withDesc = true): string {
    $slugs = aok_service_slugs($d['services'] ?? []);
    $o = '<ul>';
    foreach ($services as $s) {
        if (!aok_service_is_live($s)) continue;
        $o .= '<li><h3><a href="/services/' . aok_e($slugs[(string)($s['id'] ?? '')] ?? aok_slugify($s['title'] ?? '')) . '">' . aok_e(aok_text($s['title'] ?? '')) . '</a></h3>'
            . ($withDesc ? '<p>' . aok_rich($s['desc'] ?? '') . '</p>' : '') . '</li>';
    }
    return $o . '</ul>';
}

// Text inside editor-built blocks (headings, text, quotes, lists, FAQs …), in order.
function aok_blocks_html(array $blocks): string {
    $o = '';
    foreach ($blocks as $b) {
        if (!is_array($b)) continue;
        $t = $b['type'] ?? '';
        // a two-tone heading is two parts shown side by side, so they need the space the app puts between them
        if ($t === 'heading' || $t === 'dualheading') $o .= '<h2>' . aok_e(aok_text(implode(' ', array_filter([$b['text'] ?? '', $b['a'] ?? '', $b['accent'] ?? ''], function ($x) { return trim((string)$x) !== ''; })))) . '</h2>';
        elseif (in_array($t, ['text', 'toggle', 'alert'], true)) $o .= (!empty($b['title']) ? '<h3>' . aok_e(aok_text($b['title'])) . '</h3>' : '') . (!empty($b['q']) ? '<h3>' . aok_e(aok_text($b['q'])) . '</h3>' : '') . aok_paras($b['text'] ?? ($b['a'] ?? ''));
        elseif ($t === 'quote') $o .= '<blockquote>' . aok_paras($b['text'] ?? '') . '</blockquote>';
        elseif ($t === 'cta') $o .= '<h2>' . aok_e(aok_text($b['title'] ?? '')) . '</h2><p>' . aok_rich($b['sub'] ?? '') . '</p>';
        elseif ($t === 'iconbox' || $t === 'imagebox') $o .= '<h3>' . aok_e(aok_text($b['title'] ?? '')) . '</h3><p>' . aok_rich($b['text'] ?? '') . '</p>';
        elseif ($t === 'iconlist') { $o .= '<ul>'; foreach ((array)($b['items'] ?? []) as $x) $o .= '<li>' . aok_rich($x) . '</li>'; $o .= '</ul>'; }
        elseif ($t === 'featurelist') { $o .= '<ul>'; foreach ((array)($b['items'] ?? []) as $x) $o .= '<li>' . aok_rich($x['t'] ?? '') . '</li>'; $o .= '</ul>'; }
        elseif ($t === 'accordion') foreach ((array)($b['items'] ?? []) as $x) $o .= '<h3>' . aok_e(aok_text($x['q'] ?? '')) . '</h3><p>' . aok_rich($x['a'] ?? '') . '</p>';
        elseif ($t === 'tabs') foreach ((array)($b['items'] ?? []) as $x) $o .= '<h3>' . aok_e(aok_text($x['t'] ?? '')) . '</h3>' . aok_paras($x['c'] ?? '');
        elseif ($t === 'image' && !empty($b['caption'])) $o .= '<p>' . aok_rich($b['caption']) . '</p>';
        elseif ($t === 'columns') foreach ((array)($b['cols'] ?? []) as $c) $o .= aok_blocks_html((array)($c['items'] ?? []));
    }
    return $o;
}

function aok_hero(array $d, string $path, string $kicker = ''): string {
    return '<section>' . ($kicker !== '' ? '<p>' . aok_e($kicker) . '</p>' : '') . '<h1>' . aok_e(aok_text(aok_get($d, $path . '.title', ''))) . '</h1>'
         . aok_paras(aok_get($d, $path . '.sub', '')) . '</section>';
}

function aok_cta(array $d): string {
    return '<section><h2>' . aok_e(aok_text(aok_get($d, 'home.cta.title', ''))) . '</h2><p>' . aok_rich(aok_get($d, 'home.cta.sub', '')) . '</p>'
         . aok_btn($d, 'home.cta.btn', aok_get($d, 'home.cta.button', 'Book a Consultation'), 'contact') . '</section>';
}

// The <main> content for a resolved route.
function aok_main_html(array $d, array $r): string {
    $t = $r['type']; $g = function ($p, $f = '') use ($d) { return aok_get($d, $p, $f); };
    $o = '<main>';
    if ($t === 'home') {
        $o .= '<section><p>' . aok_e(aok_text($g('home.hero.kicker'))) . '</p><h1>' . aok_e(aok_text($g('home.hero.h1'))) . '</h1><p>' . aok_rich($g('home.hero.sub')) . '</p><p>'
            . aok_btn($d, 'home.hero.cta1', 'Book a Consultation', 'contact') . ' ' . aok_btn($d, 'home.hero.cta2', 'Explore Services', 'services') . '</p></section>';
        $o .= '<section><p>' . aok_e(aok_text($g('home.servicesIntro.kicker'))) . '</p><h2>' . aok_e(aok_text($g('home.servicesIntro.title'))) . '</h2><p>' . aok_rich($g('home.servicesIntro.sub')) . '</p>'
            . aok_services_list($d, array_slice(aok_live_services($d), 0, 6)) . '<p>' . aok_btn($d, 'home.servicesIntro.btn', 'See all services →', 'services') . '</p></section>';
        $o .= '<section><p>' . aok_e(aok_text($g('home.about.kicker'))) . '</p><h2>' . aok_e(aok_text($g('home.about.title'))) . '</h2>' . aok_paras($g('home.about.body')) . '<ul>';
        foreach ((array)$g('home.about.credentials', []) as $c) $o .= '<li>' . aok_e(aok_text($c)) . '</li>';
        $o .= '</ul><p>' . aok_btn($d, 'home.about.btn', 'About Us', 'about') . '</p></section>' . aok_cta($d);
    } elseif ($t === 'about') {
        $o .= aok_hero($d, 'about.hero', aok_text($g('seo.about.focusKeyword')));
        $o .= '<section><h2>' . aok_e(aok_text($g('about.story.title'))) . '</h2>' . aok_paras($g('about.story.body')) . '</section><section><h2>Why people trust the work</h2>';
        foreach ((array)$g('about.values', []) as $v) $o .= '<h3>' . aok_e(aok_text($v['t'] ?? '')) . '</h3><p>' . aok_rich($v['d'] ?? '') . '</p>';
        $o .= '</section><blockquote><p>' . aok_rich($g('about.quote')) . '</p><footer>— ' . aok_e($g('brand.astrologer', 'Jag Mallah')) . '</footer></blockquote>';
        $o .= '<section><p>' . aok_e(aok_text($g('about.privacy.kicker'))) . '</p><h2>' . aok_e(aok_text($g('about.privacy.title'))) . '</h2>' . aok_paras($g('about.privacy.body'));
        foreach ((array)$g('about.privacy.points', []) as $p) $o .= '<h3>' . aok_e(aok_text($p['t'] ?? '')) . '</h3><p>' . aok_rich($p['d'] ?? '') . '</p>';
        $o .= '</section><section><p>' . aok_e(aok_text($g('about.pricing.kicker'))) . '</p><h2>' . aok_e(aok_text($g('about.pricing.title'))) . '</h2><p>Consultation fee: <strong>'
            . aok_e(aok_text($g('about.pricing.fee'))) . '</strong> ' . aok_e(aok_text($g('about.pricing.unit'))) . ' — New clients: pay only if satisfied</p>' . aok_paras($g('about.pricing.body')) . '</section>';
        $o .= '<section><p>' . aok_e(aok_text($g('about.boundaries.kicker'))) . '</p><h2>' . aok_e(aok_text($g('about.boundaries.title'))) . '</h2><p>' . aok_rich($g('about.boundaries.intro')) . '</p><h3>What I can do</h3><ul>';
        foreach ((array)$g('about.boundaries.can', []) as $x) $o .= '<li>' . aok_rich($x) . '</li>';
        $o .= '</ul><h3>What I cannot do</h3><ul>';
        foreach ((array)$g('about.boundaries.cannot', []) as $x) $o .= '<li>' . aok_rich($x) . '</li>';
        $o .= '</ul></section><section><p>' . aok_e(aok_text($g('about.process.kicker'))) . '</p><h2>' . aok_e(aok_text($g('about.process.title'))) . '</h2><p>' . aok_rich($g('about.process.sub')) . '</p><ol>';
        foreach ((array)$g('about.process.steps', []) as $s) $o .= '<li><h3>' . aok_e(aok_text($s['t'] ?? '')) . '</h3><p>' . aok_rich($s['d'] ?? '') . '</p></li>';
        $o .= '</ol></section><section><h2>' . aok_e(aok_text($g('faqPage.hero.title', 'FAQ'))) . '</h2>' . aok_faq_html($d) . '<p><a href="/faq">All frequently asked questions</a></p></section>' . aok_cta($d);
    } elseif ($t === 'services') {
        $o .= aok_hero($d, 'servicesPage.hero', aok_text($g('seo.services.focusKeyword'))) . '<section>' . aok_services_list($d, $d['services'] ?? []) . '</section>' . aok_cta($d);
    } elseif ($t === 'service') {
        $s = $r['item'];
        $o .= aok_crumbs([['Home', '/'], ['Services', '/services'], [aok_text($s['title'] ?? ''), '']]);
        $title = aok_text($s['title'] ?? '');
        $img = (!empty($s['image']) && !preg_match('#^data:#i', (string)$s['image'])) ? aok_abs(aok_base($d), $s['image']) : (aok_service_images($d, $s)[0] ?? '');
        $eyebrow = aok_text(($s['eyebrow'] ?? '') !== '' ? $s['eyebrow'] : 'Vedic astrology service');
        $cta = aok_text(($s['ctaLabel'] ?? '') !== '' ? $s['ctaLabel'] : 'Book Consultation');
        $o .= '<article><header><p>' . aok_e($eyebrow) . '</p><h1>' . aok_e($title) . '</h1><p>' . aok_rich($s['desc'] ?? '') . '</p>'
            . '<p><a href="#book">' . aok_e($cta) . ' →</a></p>'
            . ($img !== '' ? '<p><img src="' . aok_e($img) . '" width="1200" height="675" alt="' . aok_e($title . ' — Vedic astrology consultation with Jag Mallah') . '" style="max-width:100%;height:auto"></p>' : '')
            . '</header>';
        // the page text beside a booking card, then (from the steps / FAQ on) one full-width column — as in the app
        [$top, $low, $secs] = aok_service_split((string)($s['detail'] ?? ''));
        $fee = aok_text(($s['price'] ?? '') !== '' ? $s['price'] : aok_get($d, 'about.pricing.fee', '$100 CAD'));
        $unit = aok_text(($s['priceUnit'] ?? '') !== '' ? $s['priceUnit'] : aok_get($d, 'about.pricing.unit', 'per hour'));
        $side = '<aside class="aok-ssr-side" aria-label="Book this consultation"><p>Consultation fee: <strong>' . aok_e($fee) . '</strong> ' . aok_e($unit) . ', for a 60-minute session. New clients pay after the consultation, only if satisfied.</p>'
            . '<p><a class="aok-ssr-btn" href="#book">' . aok_e($cta) . '</a></p>';
        if (count($secs) > 1) {
            $side .= '<nav aria-label="On this page"><p><strong>On this page</strong></p><ul>';
            foreach ($secs as $i => $sec) $side .= '<li><a href="#section-' . ($i + 1) . '">' . aok_e(aok_text(str_replace('**', '', $sec['title']))) . '</a></li>';
            $side .= '</ul></nav>';
        }
        $side .= '</aside>';
        $nTop = count(array_filter($top, function ($b) { return $b[0] === 'h2'; }));
        $o .= '<div class="aok-ssr-top"><div class="aok-ssr-main">' . aok_md_html($top, 1) . '</div>' . $side . '</div>';
        if ($low) $o .= '<div class="aok-ssr-wide">' . aok_md_html($low, $nTop + 1) . '</div>';
        $o .= '</article>';
        $o .= '<div class="aok-ssr-wide">' . aok_related_posts_html($d, $s) . aok_author_card_html($d) . '</div>';
        $o .= '<section id="book"><h2>Book: ' . aok_e($title) . '</h2><p>Send your birth details and your question through the booking form, and Jag Mallah will reply '
            . aok_e(aok_text(aok_get($d, 'contact.replyTime', 'within 12–24 hours'))) . '.</p><p>' . aok_btn($d, 'servicesPage.cardBtn', 'Book this →', 'contact') . '</p>' . aok_contact_links_html($d) . '</section>';
        $o .= aok_areas_html($d);
        $others = array_values(array_filter($d['services'] ?? [], function ($x) use ($s) { return ($x['id'] ?? '') !== ($s['id'] ?? '') && aok_service_is_live($x); }));
        $o .= '<section><h2>' . aok_e(aok_text($g('home.servicesIntro.title', 'Vedic astrology services'))) . '</h2>' . aok_services_list($d, array_slice($others, 0, 6), false) . '<p><a href="/services">See all services</a></p></section>' . aok_cta($d);
    } elseif ($t === 'meditation') {
        $o .= aok_hero($d, 'meditation.hero', aok_text($g('seo.meditation.focusKeyword')));
        $o .= '<section><p>Meditation guidance</p><h2>' . aok_e(aok_text($g('meditation.intro.title'))) . '</h2>' . aok_paras($g('meditation.intro.body')) . '</section><section><h2>What we practise</h2>';
        foreach ((array)$g('meditation.offerings', []) as $x) $o .= '<h3>' . aok_e(aok_text($x['t'] ?? '')) . '</h3><p>' . aok_rich($x['d'] ?? '') . '</p>';
        $o .= '</section>' . aok_cta($d);
    } elseif ($t === 'blog') {
        $o .= aok_hero($d, 'blogPage.hero', aok_text($g('seo.blog.focusKeyword'))) . '<section>';
        foreach ($d['blog'] ?? [] as $p) {
            if (empty($p['published']) || !empty($p['redirectTo'])) continue;
            $o .= '<article><h2><a href="/blog/' . aok_e(rawurlencode($p['slug'] ?? '')) . '">' . aok_e(aok_text($p['title'] ?? '')) . '</a></h2>'
                . (!empty($p['date']) ? '<p><time datetime="' . aok_e(substr($p['date'], 0, 10)) . '">' . aok_e(date('j F Y', strtotime($p['date']))) . '</time></p>' : '')
                . '<p>' . aok_rich($p['excerpt'] ?? '') . '</p></article>';
        }
        $o .= '</section>';
    } elseif ($t === 'post') {
        $p = $r['item'];
        $o .= aok_crumbs([['Home', '/'], ['Blog', '/blog'], [aok_text($p['title'] ?? ''), '']]);
        // the article beside a booking card (with an "In this article" menu), then the author card and related
        // services in one full-width column — the same layout as the app and the service pages
        $blocks = aok_md_blocks((string)($p['body'] ?? ''));
        $heads = array_values(array_filter($blocks, function ($b) { return $b[0] === 'h2'; }));
        $who = aok_text($g('person.name', $g('brand.astrologer', 'Jag Mallah')));
        $side = '<aside class="aok-ssr-side" aria-label="Book a consultation"><p>Consultation fee: <strong>' . aok_e(aok_text($g('about.pricing.fee', '$100 CAD'))) . '</strong> '
            . aok_e(aok_text($g('about.pricing.unit', 'per hour'))) . ', a 60-minute session with ' . aok_e($who) . '. New clients pay after the consultation, only if satisfied.</p>'
            . '<p><a class="aok-ssr-btn" href="/contact">Book a consultation</a></p>';
        if (count($heads) > 1) {
            $side .= '<nav aria-label="In this article"><p><strong>In this article</strong></p><ul>';
            foreach ($heads as $i => $hd) $side .= '<li><a href="#section-' . ($i + 1) . '">' . aok_e(aok_text(str_replace('**', '', (string)$hd[1]))) . '</a></li>';
            $side .= '</ul></nav>';
        }
        $side .= '</aside>';
        $o .= '<article><h1>' . aok_e(aok_text($p['title'] ?? '')) . '</h1><p>'
            . (!empty($p['date']) ? '<time datetime="' . aok_e(substr($p['date'], 0, 10)) . '">' . aok_e(date('j F Y', strtotime($p['date']))) . '</time> · ' : '')
            . 'By <a href="/about">' . aok_e($g('brand.astrologer', 'Jag Mallah')) . '</a>, Vedic astrologer · Analysis of Karma</p>'
            . '<div class="aok-ssr-top"><div class="aok-ssr-main">' . aok_featured_img_html($d, $p) . aok_md_html($blocks, 1) . '</div>' . $side . '</div></article>'
            . '<div class="aok-ssr-wide">' . aok_author_card_html($d) . aok_related_services_html($d, $p) . '</div>'
            . '<p><a href="/blog">← Blog</a> · <a href="/services">Services</a> · <a href="/contact">Contact</a></p>' . aok_cta($d);
    } elseif ($t === 'contact') {
        $o .= '<section><p>' . aok_e(aok_text($g('seo.contact.focusKeyword'))) . '</p><h1>' . aok_e(aok_text($g('contactPage.title'))) . '</h1><p>' . aok_rich($g('contactPage.sub')) . '</p></section>';
        $o .= '<section><h2>Send your details</h2><p>' . aok_rich($g('contactPage.note')) . '</p><p>Consultation fee: <strong>' . aok_e(aok_text($g('about.pricing.fee', '$100 CAD'))) . '</strong> ' . aok_e(aok_text($g('about.pricing.unit', 'per hour'))) . '</p>' . aok_contact_links_html($d)
            . (($rt = trim((string)$g('contact.replyTime', ''))) !== '' ? '<p>Jag Mallah replies personally, usually ' . aok_e($rt) . '. Consultations in English, Hindi and Punjabi.</p>' : '')
            . (($bk = trim((string)$g('contact.bookingUrl', ''))) !== '' && preg_match('#^https?://#i', $bk) ? '<p><a href="' . aok_e($bk) . '" rel="noopener">Book online</a></p>' : '')
            . aok_nap_html($d) . aok_review_links_html($d) . '</section>';
        $o .= aok_areas_html($d);
        $o .= '<section><h2>' . aok_e(aok_text($g('faqPage.hero.title', 'FAQ'))) . '</h2>' . aok_faq_html($d) . '</section>';
    } elseif ($t === 'faq') {
        $o .= aok_hero($d, 'faqPage.hero', 'FAQ') . '<section>' . aok_faq_html($d, 'h2') . '</section>' . aok_cta($d);
    } elseif ($t === 'page') {
        $pg = $r['item'];
        $o .= '<h1>' . aok_e(aok_text($pg['title'] ?? '')) . '</h1>' . aok_blocks_html((array)aok_get($d, 'blocks.page:' . ($pg['id'] ?? ''), []));
    } elseif ($t === 'admin') {
        $o .= '<h1>Admin</h1><p>The admin area needs JavaScript.</p>';
    } else {
        $o .= '<h1>Page not found</h1><p>Sorry — this page does not exist. <a href="/">Back home</a> · <a href="/services">Services</a> · <a href="/blog">Blog</a> · <a href="/contact">Contact</a></p>';
    }
    // blocks added with the visual editor to the built-in pages
    if (in_array($t, ['home', 'about', 'services', 'meditation', 'blog', 'contact'], true)) $o .= aok_blocks_html((array)aok_get($d, 'blocks.' . $t, []));
    if ($t === 'post') $o .= aok_blocks_html((array)aok_get($d, 'blocks.post:' . ($r['item']['id'] ?? ''), []));
    return $o . '</main>';
}

// ------------------------------------------------------------------ sitemap URL list ----
// Every indexable URL: [loc, lastmod, changefreq]. Skips noindex pages, redirected/merged items and
// items whose canonical points elsewhere. Shared by sitemap.xml, IndexNow, llms.txt and the health check.
function aok_sitemap_urls(array $d): array {
    $base = aok_base($d); $mod = aok_last_modified(); $out = [];
    $indexable = function ($robots) { return stripos((string)$robots, 'noindex') === false; };
    foreach (['home' => 'weekly', 'about' => 'monthly', 'services' => 'weekly', 'meditation' => 'monthly', 'blog' => 'weekly', 'faq' => 'monthly', 'contact' => 'monthly'] as $r => $cf)
        if ($indexable(aok_get($d, 'seo.' . $r . '.robots', 'index, follow'))) $out[] = [$base . aok_route_path($r), $mod, $cf];
    $slugs = aok_service_slugs($d['services'] ?? []);
    foreach ($d['services'] ?? [] as $s) {
        if (!aok_service_is_live($s) || !empty($s['canonical']) || !empty($s['noindex'])) continue;
        $lm = preg_match('/^\d{4}-\d{2}-\d{2}/', (string)($s['updatedAt'] ?? '')) ? substr($s['updatedAt'], 0, 10) : $mod;   // set on every save that changes it
        $out[] = [$base . '/services/' . $slugs[(string)($s['id'] ?? '')], $lm, 'monthly'];
    }
    foreach ($d['blog'] ?? [] as $p) {
        if (empty($p['published']) || empty($p['slug']) || !empty($p['redirectTo']) || !empty($p['canonical']) || !$indexable($p['robots'] ?? '')) continue;
        $out[] = [$base . '/blog/' . rawurlencode($p['slug']), preg_match('/^\d{4}-\d{2}-\d{2}/', (string)($p['date'] ?? '')) ? substr($p['date'], 0, 10) : $mod, 'monthly'];
    }
    foreach ($d['pages'] ?? [] as $pg) if (!empty($pg['slug'])) $out[] = [$base . '/' . rawurlencode($pg['slug']), $mod, 'monthly'];
    return $out;
}
