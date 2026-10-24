<?php
if (realpath((string)($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) { http_response_code(403); exit; }   // a library: never run on its own
// One-time content upgrades for sites saved before this release.
//
// site_data() (api/db.php) runs aok_upgrade_payload() on the saved site data. If anything changes it
// is saved back once, together with the new contentVersion, so it never runs again — and a merge you
// undo later in Admin -> Redirects stays undone. The defaults in assets/app.js / api/defaults.json are
// content version 2; version 3 is applied to them on the server (data.php, render.php, the static files).
//
// Version 2:
//   1. FAQ: the 7 short answers become the expanded 45–55-word versions.
//   2. SEO: the /services and /faq titles and the /meditation description become the shorter versions.
//   3. Duplicates: 3 duplicate services and 2 duplicate blog posts get a 301 redirect to their primary
//      page, and the primary absorbs the duplicate's text.
// Version 3:
//   1. Business details: phone, WhatsApp, hours, the 17 service areas, categories, languages, map and
//      review links, socials and the practitioner profile — wherever they are empty or still as first shipped.
//   2. Content: the classical sections in api/content/services|posts/<slug>.md are added after the
//      existing text of every service and post whose text is still as shipped. Edited pages are left
//      alone; Admin -> SEO Health -> "Apply Full 32-Page Classical Content Upgrade" adds them there too
//      (api/upgrade-content.php).
// Version 4:
//   Contact-form enquiries go to the owner's inbox (AOK_CONTACT_EMAIL in api/db.php). Email addresses are
//   never shown on the website any more (see public_payload in api/db.php).
// Version 5:
//   The 16 services get their own page addresses (/services/career-finance-consultation …); the old
//   addresses 301 to them. Their page text becomes the owner's Services specification
//   (api/content/services/<address>.md), replacing the version 3 sections (kept in api/content/v3/ only
//   to recognise them). Pages whose text the owner edited keep it; the SEO Health button adds the new
//   sections after it.
// Only text that is still exactly as first shipped is replaced. Text you have edited is kept. Nothing is deleted.

const AOK_CONTENT_VERSION = 5;

// fingerprints (md5 of the normalised text) of the originally shipped FAQ answers, by question
const AOK_OLD_FAQ = [
    'What information do I need for a birth chart reading?' => '53dd573a01f53af5614f23299c724a1d',
    'What is a “Rising Sign” or Ascendant?' => '57a1c4957a973f414d7e12582ecc296e',
    'Are my personal data and consultation private?' => '14d803d2fb0996a3a6de5ee46ec0e961',
    'Do you offer refunds if I am not satisfied with a live reading?' => 'cbaf72c0571328d83de1b3014d7f749a',
    'How does astrology determine relationship compatibility?' => 'cb1acbd8e28343ea379d0b7d8e47efdc',
    'What is a Moon sign and why does it matter?' => 'b197f59e139227a021c2e78980f834bd',
    'Can astrology predict health issues?' => '3c5414004902189b7a58939e95481632',
];

// SEO texts as first shipped
const AOK_OLD_SEO = [
    'services.title' => 'Vedic Astrology Services | Kundli, Matching & Remedies — Jag Mallah',
    'faq.title' => 'Vedic Astrology FAQ | Common Questions Answered — Jag Mallah',
    'meditation.metaDescription' => 'Jag Mallah is a professional meditation guide offering guided meditation, breathwork and mantra practice to calm the mind, steady the breath and deepen your spiritual path. Learn more.',
];

// duplicate service (seedKey) => primary service (title)
const AOK_SERVICE_MERGES = [
    'career-finance-reports' => 'Career & Finance Consultation',
    'gemstone-services' => 'Gemstone Recommendation',
    'dosha-remedies' => 'Dosha Analysis & Remedies',
];

// duplicate post slug => primary post slug, and the primary's original body fingerprint
const AOK_POST_MERGES = [
    'understanding-your-kundli' => 'ultimate-guide-birth-chart',
    'mangal-dosha-truth' => 'mangal-dosha-myths-facts-remedies',
];
const AOK_OLD_POST_BODY = [
    'ultimate-guide-birth-chart' => '6c056512f971efd50cf96f1a486fd6c2',
    'mangal-dosha-myths-facts-remedies' => '7cec63d86fadcea758fb8ee4e9dbc8bc',
];

// v3: business details as first shipped (a value still equal to these, or empty, takes the new default)
const AOK_V2_SETTINGS = [
    'contact.phone' => '',
    'contact.whatsapp' => '',
    'contact.instagram' => 'https://www.instagram.com/analysisofkarma/',
    'local.gbpAdditionalCategories' => ['Psychic', 'Spiritual consultant'],
    'local.areasServed' => ['Surrey, BC', 'Greater Vancouver', 'British Columbia', 'Canada'],
    'local.nearbyLabel' => 'Greater Vancouver & Fraser Valley',
    'local.nearbyCities' => ['Burnaby', 'Richmond', 'Delta', 'Langley', 'Abbotsford'],
    'local.mapsCidUrl' => '',
    'local.reviewUrl' => '',
    'local.languages' => ['English', 'Hindi'],
    'local.paymentPolicy' => 'Satisfaction-based payment: new clients do not pay if they are not satisfied with their consultation.',
    'person.shortBio' => 'Jag Mallah is an independent Vedic astrologer and professional meditation guide based in Surrey, British Columbia, consulting worldwide over Zoom and WhatsApp in English and Hindi. He completed formal studies in Advanced Astrology, Tajika (Varshaphala and Prashna Shastra), Muhurta and Medical Astrology under his mentor Sh. Sharawan Jha, and researches the classical texts Brihat Parashara Hora Shastra, Phaladeepika, Tajika Neelakanthi, Bhrigu Nandi Nadi, Jaimini Sutras and Swarodaya Shastra.',
    'person.traditions' => 'Parashari and Nadi astrology',
    'person.classicalTexts' => ['Brihat Parashara Hora Shastra', 'Phaladeepika', 'Tajika Neelakanthi', 'Bhrigu Nandi Nadi', 'Jaimini Sutras', 'Swarodaya Shastra'],
    'person.knowsAbout' => ['Vedic astrology', 'Jyotish', 'Kundli (birth chart) reading', 'Kundli Milan (marriage matching)', 'Dasha and transit analysis', 'Mangal Dosha and other doshas', 'Muhurta (auspicious timing)', 'Tajika / Varshaphala (annual charts)', 'Prashna Shastra (horary astrology)', 'Medical astrology', 'Gemstone recommendation', 'Meditation', 'Pranayama (breathwork)', 'Mantra practice'],
];
// the first heading of each added section, so text that already has it is never added twice
const AOK_CONTENT_MARKERS = ['## Classical Vedic Methodology & Texts Used', '## Classical Foundations in Jyotish'];

function aok_norm($s): string {
    return trim(preg_replace('/\s+/u', ' ', html_entity_decode(strip_tags((string)$s), ENT_QUOTES | ENT_HTML5, 'UTF-8')));
}

// Adds the paragraphs of $extra that $text doesn't already contain, so no point is lost.
function aok_merge_paragraphs(string $text, string $extra): string {
    $have = mb_strtolower(aok_norm($text), 'UTF-8');
    foreach (preg_split('/\n\s*\n/', $extra) as $p) {
        $n = mb_strtolower(aok_norm($p), 'UTF-8');
        if ($n !== '' && mb_strpos($have, $n, 0, 'UTF-8') === false) { $text = rtrim($text) . "\n\n" . trim($p); $have .= ' ' . $n; }
    }
    return $text;
}

function aok_upgrade_payload(array $d): array {
    $v = (int)($d['contentVersion'] ?? 0);
    if ($v >= AOK_CONTENT_VERSION) return $d;
    $def = is_file(__DIR__ . '/defaults.json') ? json_decode((string)file_get_contents(__DIR__ . '/defaults.json'), true) : null;
    if (!is_array($def)) return $d;   // can't upgrade without the defaults; tried again on the next request
    if ($v < 2) $d = aok_upgrade_v2($d, $def);
    if ($v < 3) $d = aok_upgrade_v3($d, $def);
    if ($v < 4) $d = aok_upgrade_v4($d);
    $d = aok_upgrade_v5($d, $def);
    $d['contentVersion'] = AOK_CONTENT_VERSION;
    return $d;
}

function aok_upgrade_v2(array $d, array $def): array {
    // 1. FAQ answers still exactly as shipped -> expanded versions
    if (isset($d['faqPage']['items']) && is_array($d['faqPage']['items'])) {
        $new = [];
        foreach ($def['faqPage']['items'] ?? [] as $it) $new[aok_norm($it['q'] ?? '')] = $it['a'] ?? '';
        $old = [];
        foreach (AOK_OLD_FAQ as $q => $h) $old[aok_norm($q)] = $h;
        foreach ($d['faqPage']['items'] as $i => $it) {
            $q = aok_norm($it['q'] ?? '');
            if (isset($old[$q], $new[$q]) && md5(aok_norm($it['a'] ?? '')) === $old[$q]) $d['faqPage']['items'][$i]['a'] = $new[$q];
        }
    }

    // 2. SEO texts still as shipped -> shorter versions
    foreach (AOK_OLD_SEO as $path => $oldText) {
        [$page, $field] = explode('.', $path);
        if (isset($d['seo'][$page][$field]) && aok_norm($d['seo'][$page][$field]) === aok_norm($oldText) && isset($def['seo'][$page][$field]))
            $d['seo'][$page][$field] = $def['seo'][$page][$field];
    }

    // 3a. seeded services / posts that were never saved (the admin adds them the same way)
    if (isset($d['services']) && is_array($d['services'])) {
        $have = [];
        foreach ($d['services'] as $s) if (!empty($s['seedKey'])) $have[$s['seedKey']] = 1;
        // (added without their shipped 301, so the merge below also moves their text into the primary)
        foreach ($def['_seedServices'] ?? [] as $s) if (empty($have[$s['seedKey'] ?? ''])) { unset($s['redirectTo']); $d['services'][] = $s; }
    }
    if (isset($d['blog']) && is_array($d['blog'])) {
        $have = []; $add = [];
        foreach ($d['blog'] as $p) if (!empty($p['slug'])) $have[$p['slug']] = 1;
        foreach ($def['_seedPosts'] ?? [] as $p) if (empty($have[$p['slug'] ?? ''])) $add[] = $p;
        $d['blog'] = array_merge($add, $d['blog']);
    }

    // 3b. duplicate services -> 301 to the primary, which absorbs the duplicate's text
    if (isset($d['services']) && is_array($d['services'])) {
        require_once __DIR__ . '/seo-lib.php';   // aok_service_slugs
        $slugs = aok_service_slugs($d['services']);
        $defDetail = [];
        foreach ($def['services'] ?? [] as $s) $defDetail[mb_strtolower(aok_norm($s['title'] ?? ''), 'UTF-8')] = (string)($s['detail'] ?? '');
        foreach (AOK_SERVICE_MERGES as $dupKey => $primTitle) {
            $di = $pi = null;
            foreach ($d['services'] as $i => $s) {
                if (($s['seedKey'] ?? '') === $dupKey) $di = $i;
                if (mb_strtolower(aok_norm($s['title'] ?? ''), 'UTF-8') === mb_strtolower($primTitle, 'UTF-8') && empty($s['redirectTo'])) $pi = $i;
            }
            if ($di === null || $pi === null || !empty($d['services'][$di]['redirectTo']) || !empty($d['services'][$di]['canonical'])) continue;
            $prim = &$d['services'][$pi];
            $detail = trim((string)($prim['detail'] ?? ''));
            $merged = $defDetail[mb_strtolower($primTitle, 'UTF-8')] ?? '';
            $dup = $d['services'][$di];
            if ($detail === '') $prim['detail'] = $merged !== '' ? $merged : (string)($dup['detail'] ?? '');
            else $prim['detail'] = aok_merge_paragraphs($detail, (string)($dup['detail'] ?? ''));
            unset($prim);
            $d['services'][$di]['redirectTo'] = '/services/' . $slugs[(string)($d['services'][$pi]['id'] ?? '')];
        }
    }

    // 3c. duplicate posts -> 301 to the primary, which absorbs the duplicate's text
    if (isset($d['blog']) && is_array($d['blog'])) {
        $defBody = [];
        foreach ($def['_seedPosts'] ?? [] as $p) $defBody[$p['slug'] ?? ''] = (string)($p['body'] ?? '');
        foreach (AOK_POST_MERGES as $dupSlug => $primSlug) {
            $di = $pi = null;
            foreach ($d['blog'] as $i => $p) {
                if (($p['slug'] ?? '') === $dupSlug) $di = $i;
                if (($p['slug'] ?? '') === $primSlug && !empty($p['published']) && empty($p['redirectTo'])) $pi = $i;
            }
            if ($di === null || $pi === null || !empty($d['blog'][$di]['redirectTo']) || !empty($d['blog'][$di]['canonical'])) continue;
            $body = (string)($d['blog'][$pi]['body'] ?? '');
            if (md5(aok_norm($body)) === (AOK_OLD_POST_BODY[$primSlug] ?? '') && !empty($defBody[$primSlug])) $d['blog'][$pi]['body'] = $defBody[$primSlug];
            elseif (aok_norm($body) !== aok_norm($defBody[$primSlug] ?? '')) $d['blog'][$pi]['body'] = aok_merge_paragraphs($body, (string)($d['blog'][$di]['body'] ?? ''));
            $d['blog'][$di]['redirectTo'] = '/blog/' . $primSlug;
        }
    }

    $d['contentVersion'] = 2;
    return $d;
}

function aok_upgrade_v3(array $d, array $def): array {
    require_once __DIR__ . '/seo-lib.php';   // aok_get, aok_url_key, aok_slugify
    $norm = function ($v) { return is_array($v) ? array_map('aok_norm', $v) : aok_norm($v); };

    // 1. business details that are empty or still as first shipped -> the owner's details
    foreach (AOK_V2_SETTINGS as $path => $old) {
        $cur = aok_get($d, $path);
        $new = aok_get($def, $path);
        if ($new === null || ($cur !== null && $cur !== '' && $cur !== [] && $norm($cur) !== $norm($old))) continue;
        [$a, $b] = explode('.', $path);
        if (!isset($d[$a]) || !is_array($d[$a])) $d[$a] = [];
        $d[$a][$b] = $new;
    }
    // opening hours: only when no day has hours yet
    $hours = aok_get($d, 'local.hours');
    $set = false;
    if (is_array($hours)) foreach ($hours as $h) if (!empty($h['o']) || !empty($h['c'])) $set = true;
    if (!$set && isset($def['local']['hours'])) { if (!isset($d['local']) || !is_array($d['local'])) $d['local'] = []; $d['local']['hours'] = $def['local']['hours']; }
    // social profiles and the practitioner's profile links: add the missing ones, keep the rest
    if (isset($def['socials']) && is_array($def['socials'])) {
        $cur = (isset($d['socials']) && is_array($d['socials'])) ? $d['socials'] : [];
        $have = [];
        foreach ($cur as $x) if (!empty($x['url'])) $have[aok_url_key($x['url'])] = 1;
        foreach ($def['socials'] as $x) if (!empty($x['url']) && empty($have[aok_url_key($x['url'])])) { $cur[] = $x; $have[aok_url_key($x['url'])] = 1; }
        $d['socials'] = $cur;
    }
    $sameAs = aok_get($def, 'person.sameAs');
    if (is_array($sameAs) && isset($d['person']) && is_array($d['person'])) {
        $cur = is_array($d['person']['sameAs'] ?? null) ? $d['person']['sameAs'] : [];
        $have = [];
        foreach ($cur as $u) $have[aok_url_key((string)$u)] = 1;
        foreach ($sameAs as $u) if (empty($have[aok_url_key($u)])) { $cur[] = $u; $have[aok_url_key($u)] = 1; }
        $d['person']['sameAs'] = $cur;
    }

    // 2. services and posts: make sure the shipped ones are there (as the browser adds them), then add the content
    if (!isset($d['services']) || !is_array($d['services'])) $d['services'] = $def['services'] ?? [];
    if (!isset($d['blog']) || !is_array($d['blog'])) $d['blog'] = $def['blog'] ?? [];
    $have = [];
    foreach ($d['services'] as $s) if (!empty($s['seedKey'])) $have[$s['seedKey']] = 1;
    foreach ($def['_seedServices'] ?? [] as $s) if (empty($have[$s['seedKey'] ?? ''])) $d['services'][] = $s;
    $have = []; $add = [];
    foreach ($d['blog'] as $p) if (!empty($p['slug'])) $have[$p['slug']] = 1;
    foreach ($def['_seedPosts'] ?? [] as $p) if (empty($have[$p['slug'] ?? ''])) $add[] = $p;
    $d['blog'] = array_merge($add, $d['blog']);
    aok_apply_content($d, $def, false, ['posts']);   // services: version 5
    return $d;
}

// The added section text for a service or post, or '' if there is none.
function aok_content_md(string $kind, string $key): string {
    if ($key === '' || !preg_match('/^[a-z0-9-]+$/', $key)) return '';
    $f = __DIR__ . '/content/' . $kind . '/' . $key . '.md';
    return is_file($f) ? trim(str_replace("\r\n", "\n", (string)file_get_contents($f))) : '';
}

// true if $text already contains the added sections (or their first line)
function aok_has_content(string $text, string $md): bool {
    foreach (AOK_CONTENT_MARKERS as $m) if (strpos($text, $m) !== false) return true;
    $first = trim(strtok($md, "\n"));
    return $first !== '' && strpos(aok_norm($text), aok_norm($first)) !== false;
}

// Adds the api/content sections after the existing text. $force = false: only where the text is still as
// shipped; $force = true (the admin button): also where it was edited. Returns what changed and what was skipped.
function aok_apply_content(array &$d, array $def, bool $force, array $kinds = ['services', 'posts']): array {
    require_once __DIR__ . '/seo-lib.php';
    $out = ['services' => [], 'posts' => [], 'skipped' => []];
    if (in_array('services', $kinds, true)) { $r = aok_apply_service_content($d, $def, $force); $out['services'] = $r['services']; $out['skipped'] = $r['skipped']; }
    if (!in_array('posts', $kinds, true)) return $out;
    $defP = [];
    foreach (array_merge($def['blog'] ?? [], $def['_seedPosts'] ?? []) as $p) if (!empty($p['slug'])) $defP[$p['slug']] = $p;
    foreach ($d['blog'] ?? [] as $i => $p) {
        if (!is_array($p) || !empty($p['redirectTo'])) continue;
        $key = (string)($p['slug'] ?? '');
        $md = aok_content_md('posts', $key);
        if ($md === '') continue;
        $body = (string)($p['body'] ?? '');
        if (aok_has_content($body, $md)) continue;
        if (!$force && (!isset($defP[$key]) || aok_norm($body) !== aok_norm($defP[$key]['body'] ?? ''))) { $out['skipped'][] = (string)($p['title'] ?? $key); continue; }
        $d['blog'][$i]['body'] = trim(rtrim($body) . "\n\n" . $md);
        $out['posts'][] = (string)($p['title'] ?? $key);
    }
    return $out;
}

function aok_upgrade_v4(array $d): array {
    if (!isset($d['contact']) || !is_array($d['contact'])) $d['contact'] = [];
    $d['contact']['email'] = AOK_CONTACT_EMAIL;   // the owner's enquiry inbox (private; stripped from public data)
    return $d;
}

// The shipped default a saved service started from. Saved ids are random (made in the browser), so match by
// seed key, then by title, then by id.
function aok_default_service(array $s, array $def): ?array {
    static $by = null;
    if ($by === null) {
        $by = ['seed' => [], 'title' => [], 'id' => []];
        foreach (array_merge($def['services'] ?? [], $def['_seedServices'] ?? []) as $x) {
            if (!empty($x['seedKey'])) $by['seed'][$x['seedKey']] = $x;
            $by['title'][mb_strtolower(aok_norm($x['title'] ?? ''), 'UTF-8')] = $x;
            if (!empty($x['id'])) $by['id'][$x['id']] = $x;
        }
    }
    if (!empty($s['seedKey']) && isset($by['seed'][$s['seedKey']])) return $by['seed'][$s['seedKey']];
    $t = mb_strtolower(aok_norm($s['title'] ?? ''), 'UTF-8');
    if ($t !== '' && isset($by['title'][$t])) return $by['title'][$t];
    return $by['id'][$s['id'] ?? ''] ?? null;
}

// The api/content/services file of a service: its shipped page address, else its own address.
function aok_service_content_key(array $s, array $def): string {
    $o = aok_default_service($s, $def);
    if ($o && !empty($o['slug'])) return (string)$o['slug'];
    return aok_slugify((string)(($s['slug'] ?? '') !== '' ? $s['slug'] : ($s['title'] ?? '')));
}

// true when $detail already has these sections (their direct-answer line)
function aok_has_service_content(string $detail, string $md): bool {
    $first = trim(strtok($md, "\n"));
    return $first !== '' && strpos(aok_norm($detail), aok_norm($first)) !== false;
}

// Puts the specification's sections on every service page. $force = false: only where the text is still as
// shipped (the version 3 sections are recognised and replaced); $force = true (the SEO Health button): also
// where the owner edited it, keeping their text first.
function aok_apply_service_content(array &$d, array $def, bool $force): array {
    require_once __DIR__ . '/seo-lib.php';
    $out = ['services' => [], 'skipped' => []];
    foreach ($d['services'] ?? [] as $i => $s) {
        if (!is_array($s) || !empty($s['redirectTo'])) continue;
        $md = aok_content_md('services', aok_service_content_key($s, $def));
        if ($md === '') continue;
        $detail = (string)($s['detail'] ?? '');
        if (aok_has_service_content($detail, $md)) continue;
        $o = aok_default_service($s, $def);
        $old = aok_content_md('v3/services', aok_slugify((string)($o['title'] ?? $s['title'] ?? '')));
        $rest = ($old !== '' && strpos($detail, $old) !== false) ? trim(str_replace($old, '', $detail)) : trim($detail);
        $asShipped = aok_norm($rest) === '' || ($o !== null && aok_norm($rest) === aok_norm($o['detail'] ?? ''));
        if (!$asShipped && !$force) { $out['skipped'][] = (string)($s['title'] ?? ''); continue; }
        $d['services'][$i]['detail'] = $asShipped ? $md : $rest . "\n\n" . $md;
        $out['services'][] = (string)($s['title'] ?? '');
    }
    return $out;
}

function aok_upgrade_v5(array $d, array $def): array {
    if (!isset($d['services']) || !is_array($d['services'])) return $d;
    require_once __DIR__ . '/seo-lib.php';
    // 1. page addresses from the specification (an address the owner set themselves is kept)
    $before = aok_service_slugs($d['services']);
    foreach ($d['services'] as $i => $s) {
        $o = aok_default_service((array)$s, $def);
        if ($o && !empty($o['slug']) && trim((string)($s['slug'] ?? '')) === '') $d['services'][$i]['slug'] = $o['slug'];
    }
    $after = aok_service_slugs($d['services']);
    // 2. the old addresses forward to the new ones, and anything pointing at an old address follows
    $map = [];
    foreach ($before as $id => $old) if (isset($after[$id]) && $after[$id] !== $old) $map['/services/' . $old] = '/services/' . $after[$id];
    if ($map) {
        $reds = (isset($d['redirects']) && is_array($d['redirects'])) ? $d['redirects'] : [];
        foreach ($reds as $k => $r) if (isset($map['/' . trim((string)($r['to'] ?? ''), '/')])) $reds[$k]['to'] = $map['/' . trim((string)$r['to'], '/')];
        $have = [];
        foreach ($reds as $r) $have[strtolower('/' . trim((string)($r['from'] ?? ''), '/'))] = 1;
        foreach ($map as $from => $to) if (empty($have[strtolower($from)])) $reds[] = ['from' => $from, 'to' => $to];
        $d['redirects'] = array_values($reds);
        foreach (['services', 'blog'] as $kind) foreach ($d[$kind] ?? [] as $i => $x) {
            foreach (['redirectTo', 'canonical'] as $f) if (!empty($x[$f]) && isset($map['/' . trim((string)$x[$f], '/')])) $d[$kind][$i][$f] = $map['/' . trim((string)$x[$f], '/')];
        }
    }
    // 3. the specification's page text
    aok_apply_service_content($d, $def, false);
    return $d;
}
