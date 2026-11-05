<?php
// Compatibility layer for the modules taken from the starter kit's update package
// (AI auditor, rewriter, revision history, deep SEO scan, theme presets, RSS).
//
// WHY THIS FILE EXISTS
//   Those modules are a later generation of this very engine: the kit was renamed
//   app_* when it was de-branded, so app_graph(), app_meta(), app_resolve() and the
//   rest are the same functions this site already has under aok_*. The signatures
//   match exactly. Renaming 121 functions and 146 CSS classes here to meet the kit
//   halfway would be a large, risky migration for no gain, so the new modules keep
//   their own names and this file supplies them as thin wrappers.
//
//   Nothing here changes behaviour: each wrapper forwards, unchanged, to the
//   function the site already uses. The new modules therefore read exactly the same
//   content, routes and structured data as every page the visitor sees.
//
// ADDING MORE MODULES FROM THE KIT
//   If a module needs an app_* name that is not below, check for an aok_* twin first
//   (`grep "function aok_<name>" api/*.php`) and add a wrapper. Only port the body
//   when there is genuinely no twin, as with the four at the bottom of this file.

if (realpath((string)($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) { http_response_code(403); exit; }   // a library: never run on its own

require_once __DIR__ . '/seo-lib.php';
require_once __DIR__ . '/discovery-lib.php';

// ---------- names the new modules call, which this site already has ----------
// function_exists() guards keep this safe if a future kit file defines its own.
if (!function_exists('app_get'))          { function app_get(array $a, string $path, $fallback = null) { return aok_get($a, $path, $fallback); } }
if (!function_exists('app_text'))         { function app_text($v): string { return aok_text($v); } }
if (!function_exists('app_cut'))          { function app_cut(string $s, int $n): string { return aok_cut($s, $n); } }
if (!function_exists('app_base'))         { function app_base(array $d): string { return aok_base($d); } }
if (!function_exists('app_brand'))        { function app_brand(array $d): string { return aok_brand($d); } }
if (!function_exists('app_site'))         { function app_site(): array { return aok_site(); } }
if (!function_exists('app_meta'))         { function app_meta(array $d, array $r): array { return aok_meta($d, $r); } }
if (!function_exists('app_graph'))        { function app_graph(array $d, array $r, array $meta): array { return aok_graph($d, $r, $meta); } }
if (!function_exists('app_resolve'))      { function app_resolve(string $uri, array $d): array { return aok_resolve($uri, $d); } }
if (!function_exists('app_main_html'))    { function app_main_html(array $d, array $r): string { return aok_main_html($d, $r); } }
if (!function_exists('app_sitemap_urls')) { function app_sitemap_urls(array $d): array { return aok_sitemap_urls($d); } }
if (!function_exists('app_md_blocks'))    { function app_md_blocks(string $text): array { return aok_md_blocks($text); } }
if (!function_exists('app_llms_md'))      { function app_llms_md(string $md): string { return aok_llms_md($md); } }
if (!function_exists('app_save_sync'))    { function app_save_sync(array $d, array $prev = []) { return aok_save_sync($d, $prev); } }
if (!function_exists('app_rss_xml'))      { function app_rss_xml(array $d): string { return aok_rss_xml($d); } }

// ---------- the few with no twin here, ported from the kit ----------

// A blog post's description: its own SEO line, else the excerpt, else the first real
// paragraph. Used by the RSS feed and the discovery files.
if (!function_exists('app_post_description')) { function app_post_description(array $p): string { return aok_post_description($p); } }

// The heading for a "<service> in <city>" GEO page.
if (!function_exists('app_matrix_title')) {
    function app_matrix_title(array $d, array $s, array $c): string {
        return aok_text($s['title'] ?? '') . ' in ' . $c['name'] . (($c['region'] ?? '') !== '' ? ', ' . $c['region'] : '');
    }
}

// Is there a real social share image on disk? A missing one means every share of
// this site is a blank card, so the audit reports it.
if (!function_exists('app_social_image_ok')) {
    function app_social_image_ok(array $d, string $root): bool {
        $own = trim((string)aok_get($d, 'seo.ogImage', ''));
        if ($own !== '' && !preg_match('/\{\{[A-Z0-9_]+\}\}/', $own)) {
            if (strncmp($own, 'data:', 5) === 0 || preg_match('#^(https?:)?//#i', $own)) return true;
            $rel = ltrim((string)parse_url($own, PHP_URL_PATH), '/');
            return $rel !== '' && is_file(rtrim($root, '/\\') . '/' . rawurldecode($rel));
        }
        return is_file(rtrim($root, '/\\') . '/assets/og-image.jpg');
    }
}
