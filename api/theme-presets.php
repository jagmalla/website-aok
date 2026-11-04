<?php
require_once __DIR__ . '/app-compat.php';   // app_* names map to this site's aok_* engine
// Theme presets — the single server-side source of the kit's colour palettes.
//
// The engine has always carried TWO palettes that must agree (CLAUDE.md §2): the CSS custom properties in
// index.html's :root, and the P object in assets/app.js that every inline style reads. A preset defines one
// coherent set of semantic roles and is projected onto BOTH, so switching a preset restyles the whole site
// without touching a single component.
//
// The same table is mirrored in assets/app.js (THEMES) because the browser needs it for the live admin preview
// and for P. Change one, change the other — the same rule the Markdown renderer and app_matrix_* live under (AR-12).
//
// Roles -> kit tokens:
//   primary      -> P.maroon  / --charcoal     (headings, brand dark)
//   primaryHover -> P.maroonD / (hover/deep)
//   secondary    -> P.red     / CTA + action    (buttons, CTA band)
//   secondaryDeep-> P.redD
//   accent       -> P.gold    / --gold          (kickers, rules, marks)
//   accentLight  -> P.goldL   / --gold-hi
//   bg/surface/card -> P.bg / P.bgAlt / P.card  (--pearl / --alabaster)
//   textMain/textMuted -> P.ink / P.muted       (--slate / --muted)
//   border       -> P.line    / --app-line
//   onPrimary    -> P.cream                     (text that sits on primary/secondary)
if (realpath((string)($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) { http_response_code(403); exit; }

const APP_THEME_DEFAULT = 'luxury-editorial';

function app_theme_presets(): array {
    return [
        'modern-minimal' => [
            'name' => 'Modern Minimal', 'hint' => 'Slate & charcoal — architecture, photography, tech consultancies',
            'primary' => '#18181B', 'primaryHover' => '#09090B', 'secondary' => '#27272A', 'secondaryDeep' => '#18181B',
            'accent' => '#52525B', 'accentLight' => '#A1A1AA', 'bg' => '#FAFAFA', 'surface' => '#F4F4F5', 'card' => '#FFFFFF',
            'textMain' => '#3F3F46', 'textMuted' => '#71717A', 'border' => 'rgba(24,24,27,.14)', 'onPrimary' => '#FFFFFF',
        ],
        'corporate-trust' => [
            'name' => 'Corporate Trust', 'hint' => 'Navy & cobalt — legal, accounting, finance, B2B services',
            'primary' => '#0F2E5C', 'primaryHover' => '#0A2244', 'secondary' => '#1D4ED8', 'secondaryDeep' => '#1E40AF',
            'accent' => '#2563EB', 'accentLight' => '#93C5FD', 'bg' => '#F8FAFC', 'surface' => '#EEF2F7', 'card' => '#FFFFFF',
            'textMain' => '#334155', 'textMuted' => '#64748B', 'border' => 'rgba(15,46,92,.16)', 'onPrimary' => '#FFFFFF',
        ],
        'tech-vibrant' => [
            'name' => 'Tech Vibrant', 'hint' => 'Electric indigo & violet — SaaS, digital agencies, mobile apps',
            'primary' => '#312E81', 'primaryHover' => '#1E1B4B', 'secondary' => '#6D28D9', 'secondaryDeep' => '#5B21B6',
            'accent' => '#7C3AED', 'accentLight' => '#C4B5FD', 'bg' => '#FAFAFF', 'surface' => '#F1F0FE', 'card' => '#FFFFFF',
            'textMain' => '#3F3D56', 'textMuted' => '#6B7280', 'border' => 'rgba(109,40,217,.18)', 'onPrimary' => '#FFFFFF',
        ],
        'clean-healthcare' => [
            'name' => 'Clean Healthcare', 'hint' => 'Teal & cyan — clinics, wellness, health tech, therapists',
            'primary' => '#115E59', 'primaryHover' => '#0F3F3C', 'secondary' => '#0F766E', 'secondaryDeep' => '#115E59',
            'accent' => '#0D9488', 'accentLight' => '#99F6E4', 'bg' => '#F7FBFB', 'surface' => '#ECF5F4', 'card' => '#FFFFFF',
            'textMain' => '#374151', 'textMuted' => '#6B7280', 'border' => 'rgba(13,148,136,.20)', 'onPrimary' => '#FFFFFF',
        ],
        'warm-artisan' => [
            'name' => 'Warm Artisan', 'hint' => 'Terracotta & sand — cafés, boutique studios, interiors, culinary',
            'primary' => '#4A2E22', 'primaryHover' => '#38231A', 'secondary' => '#A9512F', 'secondaryDeep' => '#8C4327',
            'accent' => '#B5633C', 'accentLight' => '#F0C7A8', 'bg' => '#FBF7F2', 'surface' => '#F3EADF', 'card' => '#FFFDFA',
            'textMain' => '#4A3B32', 'textMuted' => '#7A6757', 'border' => 'rgba(74,46,34,.18)', 'onPrimary' => '#FFF8F2',
        ],
        'luxury-editorial' => [
            'name' => 'Luxury Editorial', 'hint' => 'Champagne & obsidian — luxury brands, real estate, advisory',
            'primary' => '#1E2022', 'primaryHover' => '#141517', 'secondary' => '#8C6D33', 'secondaryDeep' => '#6E5426',
            'accent' => '#A68446', 'accentLight' => '#DFC286', 'bg' => '#FAF8F5', 'surface' => '#F3EFE6', 'card' => '#FFFCF7',
            'textMain' => '#3A3D42', 'textMuted' => '#6B6E73', 'border' => 'rgba(166,132,70,.22)', 'onPrimary' => '#FFFDF8',
        ],
        'high-energy' => [
            'name' => 'High-Energy Action', 'hint' => 'Crimson & slate — fitness, repair shops, trades, sports',
            'primary' => '#1F2937', 'primaryHover' => '#111827', 'secondary' => '#C81E1E', 'secondaryDeep' => '#991B1B',
            'accent' => '#DC2626', 'accentLight' => '#FCA5A5', 'bg' => '#FAFAFA', 'surface' => '#F1F3F5', 'card' => '#FFFFFF',
            'textMain' => '#374151', 'textMuted' => '#6B7280', 'border' => 'rgba(31,41,55,.16)', 'onPrimary' => '#FFFFFF',
        ],
    ];
}

// "#A68446" + .18 -> "rgba(166,132,70,.18)" (used for the hairlines derived from the accent)
function app_theme_rgba(string $hex, string $alpha): string {
    $h = ltrim(trim($hex), '#');
    if (strlen($h) === 3) $h = $h[0] . $h[0] . $h[1] . $h[1] . $h[2] . $h[2];
    if (!preg_match('/^[0-9a-f]{6}$/i', $h)) return 'rgba(0,0,0,' . $alpha . ')';
    return 'rgba(' . hexdec(substr($h, 0, 2)) . ',' . hexdec(substr($h, 2, 2)) . ',' . hexdec(substr($h, 4, 2)) . ',' . $alpha . ')';
}

// The active palette: the chosen preset, with the owner's manual primary/accent overrides applied only when
// theme.allowCustomOverride is on (so a preset stays predictable unless the owner opts out of it).
function app_theme_active(array $d): array {
    $all = app_theme_presets();
    $id = (string)app_get($d, 'theme.preset', APP_THEME_DEFAULT);
    if (!isset($all[$id])) $id = APP_THEME_DEFAULT;
    $p = $all[$id];
    $p['id'] = $id;
    if (app_get($d, 'theme.allowCustomOverride', false)) {
        $pc = trim((string)app_get($d, 'theme.primaryColor', ''));
        $ac = trim((string)app_get($d, 'theme.accentColor', ''));
        if (preg_match('/^#[0-9a-f]{3,8}$/i', $pc)) { $p['primary'] = $pc; $p['primaryHover'] = $pc; }
        if (preg_match('/^#[0-9a-f]{3,8}$/i', $ac)) { $p['accent'] = $ac; $p['secondary'] = $ac; }
        $p['id'] = 'custom';
    }
    return $p;
}

// The :root override block for the active theme. Emitted by render.php into <head> so the server copy and the
// no-JS copy already carry the right colours (no flash of the default palette before React boots).
function app_theme_css(array $d, string $tpl = ''): string {
    $p = app_theme_active($d);
    $v = [
        // the kit's original token names (every existing rule in index.html keeps working)
        '--pearl' => $p['bg'], '--alabaster' => $p['surface'], '--charcoal' => $p['primary'],
        '--slate' => $p['textMain'], '--muted' => $p['textMuted'],
        '--gold' => $p['accent'], '--gold-deep' => $p['secondaryDeep'], '--gold-hi' => $p['accentLight'],
        '--gold-lo' => $p['secondary'], '--champagne' => $p['accentLight'],
        '--hair' => app_theme_rgba($p['accent'], '.35'), '--line-art' => app_theme_rgba($p['accent'], '.18'),
        '--app-line' => $p['border'], '--app-gold-label' => $p['secondaryDeep'],
        // the public, self-describing API asked for by the theme system
        '--theme-primary' => $p['primary'], '--theme-primary-hover' => $p['primaryHover'],
        '--theme-secondary' => $p['secondary'], '--theme-accent' => $p['accent'],
        '--theme-bg' => $p['bg'], '--theme-surface' => $p['card'],
        '--theme-text-main' => $p['textMain'], '--theme-text-muted' => $p['textMuted'],
        '--theme-border' => $p['border'], '--theme-on-primary' => $p['onPrimary'],
    ];
    $css = '';
    foreach ($v as $k => $val) $css .= $k . ':' . $val . ';';
    // The decorative constellation texture carries its gold baked into the SVG data URI, so it would stay gold on
    // every palette. Re-tint it to the preset's accent. $tpl is index.html, which render.php already holds in
    // memory, so this costs one regex and no extra read — and the default preset skips it (its gold is already there).
    if ($tpl !== '' && $p['id'] !== APP_THEME_DEFAULT && preg_match('/--starmap:(url\("data:image\/svg\+xml,.*?"\));/s', $tpl, $m))
        $css .= '--starmap:' . str_replace('rgba(197,160,89,.18)', app_theme_rgba($p['accent'], '.18'), $m[1]) . ';';
    return ':root{' . $css . '}';
}
