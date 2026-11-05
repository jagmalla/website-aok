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
// Version 6:
//   The business's real street address, Monday-Friday opening hours, the Google Business Profile
//   listing name and Punjabi consultations, from the owner's Profile. Empty values only.
// Version 7:
//   1. The generic middle headings of five service pages become the questions people actually ask,
//      each followed by a 40-60 word answer: an assistant quotes a question heading with its answer
//      directly beneath it, and quotes nothing from "Classical Vedic Methodology & Texts Used".
//      Only the heading line is replaced, so anything the owner wrote under it is untouched.
//   2. The /services comparison table: every shipped consultation gains the chart factors, session
//      format and duration the table needs. Services the owner added keep theirs empty and stay out
//      of the table until they are filled in (Admin -> Services).
// Version 8:
//   1. Claude-Web joins the AI crawler list in Admin -> AI & GEO, so robots.txt names it. It is an
//      older Anthropic crawler name that some tools still send; the newer ones were already there.
//   2. The ethical policy line (confidentiality, and that nothing is sold) is added where it is
//      empty, so llms.txt states it outright rather than leaving it to be inferred.
// Version 9:
//   The map pin, the currencies and two more Google links for the entity graph. The shipped
//   coordinates were the middle of Surrey, not the Business Profile's pin at 92 Ave and 154 St.
// Only text that is still exactly as first shipped is replaced. Text you have edited is kept. Nothing is deleted.

const AOK_CONTENT_VERSION = 9;

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
    if ($v < 6) $d = aok_upgrade_v6($d);
    if ($v < 7) $d = aok_upgrade_v7($d, $def);
    if ($v < 8) $d = aok_upgrade_v8($d, $def);
    if ($v < 9) $d = aok_upgrade_v9($d, $def);
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

// v6: the business's real street address, opening hours and spoken languages, from the owner's
// Google Business Profile. Search engines match a business on its name, address and phone being
// byte-identical everywhere, and this site was still set up as a service-area business with the
// street hidden, so Maps and the website disagreed.
//
// Only values still exactly as this project shipped them are replaced; anything the owner has
// since edited is left alone.
function aok_upgrade_v6(array $d): array {
    $L = isset($d['local']) && is_array($d['local']) ? $d['local'] : [];

    // the street address was never set, so there is nothing of the owner's to overwrite
    if (trim((string)($L['streetAddress'] ?? '')) === '') {
        $L['streetAddress'] = '15450 92a Ave';
        $L['postalCode'] = 'V3R 9B1';
        $L['serviceAreaBusiness'] = false;   // show it: it is public on Google Business Profile
    }
    if (trim((string)($L['listingName'] ?? '')) === '') {
        $L['listingName'] = 'Analysis of Karma - Vedic astrology & Meditation | Vedic Astrologer Jag Mallah';
    }
    if (trim((string)($L['hoursNote'] ?? '')) === '') {
        $L['hoursNote'] = 'Online consultations available 7 days a week by appointment';
    }
    // opening hours: replace only the shipped Mon-Sun 10:00-20:00
    $shipped = true;
    foreach (['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'] as $day) {
        $h = $L['hours'][$day] ?? null;
        if (!is_array($h) || ($h['o'] ?? '') !== '10:00' || ($h['c'] ?? '') !== '20:00') { $shipped = false; break; }
    }
    if ($shipped) {
        $hours = [];
        foreach (['Mo', 'Tu', 'We', 'Th', 'Fr'] as $day) $hours[$day] = ['o' => '10:00', 'c' => '17:00'];
        $L['hours'] = $hours;
    }
    $d['local'] = $L;

    // the contact page's address line and map pin
    $full = '15450 92a Ave, Surrey, BC V3R 9B1, Canada';
    if (!isset($d['contact']) || !is_array($d['contact'])) $d['contact'] = [];
    if (trim((string)($d['contact']['address'] ?? '')) === '') $d['contact']['address'] = $full;
    if (trim((string)($d['contact']['mapQuery'] ?? '')) === '') {
        $d['contact']['mapQuery'] = ($L['listingName'] ?? '') . ', ' . $full;
    }

    // "Consultations in English & Hindi" predates Punjabi being offered on every service page
    if (isset($d['home']['about']['credentials']) && is_array($d['home']['about']['credentials'])) {
        foreach ($d['home']['about']['credentials'] as $i => $c) {
            if (aok_norm($c) === aok_norm('Consultations in English & Hindi')) {
                $d['home']['about']['credentials'][$i] = 'Consultations in English, Hindi & Punjabi';
            }
        }
    }

    // a text block the owner added in the editor but never typed into: drop it rather than
    // publish the placeholder. The renderers skip it as well, so this only tidies the data.
    $ph = aok_norm("Write your text here. Click to edit \u{2014} use the toolbar above for bold, colour, size, lists and links.");
    foreach ((array)($d['blocks'] ?? []) as $route => $blocks) {
        if (!is_array($blocks)) continue;
        $keep = [];
        foreach ($blocks as $b) {
            $isEmpty = is_array($b) && ($b['type'] ?? '') === 'text'
                && trim((string)($b['title'] ?? '')) === '' && aok_norm($b['text'] ?? '') === $ph;
            if (!$isEmpty) $keep[] = $b;
        }
        $d['blocks'][$route] = array_values($keep);
    }
    return $d;
}

// v7, part 1: the question headings. api/content/services/<key>.md already ships them, but a live
// site's page text came from an earlier release, so the heading line is replaced in place: the
// question takes over from the label and the answer paragraph is inserted directly beneath it.
// Keyed by the page's shipped address, as aok_service_content_key() resolves it.
const AOK_V7_HEADINGS = [
    'kundli-birth-chart-reading' => [
        ['## Classical Vedic Methodology & Texts Used',
         '## How Does Jag Mallah Analyze a Vedic Birth Chart (Kundli)?',
         'Jag Mallah analyzes your Vedic birth chart using classical Parashari Jyotish principles from the Brihat Parashara Hora Shastra. Every 60-minute reading evaluates your Sidereal Ascendant (Lagna), 27 lunar Nakshatras, divisional charts (Navamsha D-9 and Dashamsha D-10), Vimshottari Dasha timelines, and live planetary transits (Gochar) to deliver accurate life predictions.'],
        ['## Key Life Questions & Chart Factors Analyzed',
         '## What Life Questions Are Answered in a 1-on-1 Kundli Consultation?',
         'A 1-on-1 Kundli consultation answers specific questions regarding career trajectory (10th House Karma Bhava), marriage compatibility and timing (7th House), wealth cycles (Dhana Yogas), health vulnerabilities, and life purpose. Sessions cost $100 CAD per hour via Zoom or WhatsApp, and new clients pay only after the session if satisfied.'],
    ],
    'kundli-milan-marriage-matching' => [
        ['## Classical Vedic Methodology & Texts Used',
         '## How Does Vedic Kundli Milan Evaluate Marriage Compatibility Beyond the 36 Points?',
         "Authentic Kundli Milan goes beyond automated 36-point Ashtakoota Guna scores by examining both partners' Navamsha (D-9) charts, 7th house lord strengths, emotional Moon-Venus synastry, Mangal Dosha cancellations, and synchronised Vimshottari Dasha periods. This 60-minute session (\$100 CAD, pay after satisfaction) identifies real marital harmony and communication remedies."],
    ],
    'career-finance-consultation' => [
        ['## Classical Vedic Methodology & Texts Used',
         '## How Can Vedic Astrology Predict Career Changes and Financial Growth?',
         'Vedic career and finance consultations evaluate the 10th house (Karma Bhava), 2nd and 11th wealth houses (Dhana Yogas), and the specialized Dashamsha (D-10) divisional chart. By tracking active Mahadasha periods alongside Saturn and Jupiter transits, Jag Mallah pinpoints optimal windows for job transitions, promotions, or business launches.'],
    ],
    'dosha-analysis-remedies' => [
        ['## Classical Vedic Methodology & Texts Used',
         '## How Are Mangal Dosha, Kaal Sarp Dosha, and Pitra Dosha Verified and Remedied?',
         "Many online software reports trigger false Dosha alarms without checking classical cancellation rules (Dosha Bhanga). Jag Mallah inspects exact planetary degrees, Shadbala strength, and benefic aspects before confirming any affliction. When a Dosha is active, we prescribe practical mantra sadhana, meditation, and behavioral karma adjustments \u{2014} never expensive rituals."],
    ],
    'gemstone-recommendation' => [
        ['## Classical Vedic Methodology & Texts Used',
         '## How Are Astrological Gemstones Selected Without Commercial Sales Bias?',
         'Gemstones act as planetary amplifiers and must only be prescribed for functional benefic lords (Lagna, 5th, and 9th houses) after auditing planetary dignity and Dasha timing. Because Analysis of Karma never sells gemstones or jewelry, every $100 CAD consultation gives you completely unbiased guidance on exact carat weight and wearing rituals.'],
    ],
];

function aok_upgrade_v7(array $d, array $def): array {
    if (!isset($d['services']) || !is_array($d['services'])) return $d;
    require_once __DIR__ . '/seo-lib.php';   // aok_service_content_key, aok_default_service

    foreach ($d['services'] as $i => $s) {
        if (!is_array($s)) continue;
        $o = aok_default_service($s, $def);

        // 1. the question headings, on the five pages that have them
        $detail = (string)($s['detail'] ?? '');
        foreach (AOK_V7_HEADINGS[aok_service_content_key($s, $def)] ?? [] as [$from, $to, $answer]) {
            if ($detail === '' || strpos($detail, $to) !== false) continue;   // already done
            $lines = explode("\n", str_replace("\r\n", "\n", $detail));
            foreach ($lines as $k => $line) {
                if (trim($line) !== $from) continue;
                // the blank line matters: without it the markdown parser folds the bullets that
                // follow into the answer paragraph instead of keeping them a list
                array_splice($lines, $k, 1, [$to, $answer, '']);
                $detail = implode("\n", $lines);
                break;
            }
        }
        if ($detail !== (string)($s['detail'] ?? '')) $d['services'][$i]['detail'] = $detail;

        // 2. the comparison table's columns, where this service ships them and has none of its own
        foreach (['chartFactors', 'sessionFormat', 'duration'] as $f) {
            if ($o !== null && trim((string)($o[$f] ?? '')) !== '' && trim((string)($s[$f] ?? '')) === '')
                $d['services'][$i][$f] = $o[$f];
        }
    }
    return $d;
}

// v8: the crawler list and the ethical policy. Both are additive -- a bot the owner has switched off
// stays off, and a policy they have written stays theirs.
function aok_upgrade_v8(array $d, array $def): array {
    // Claude-Web: an older Anthropic crawler name. Added only when it has never been decided either
    // way, so an owner who deliberately blocked it is not overruled.
    if (!isset($d['ai']) || !is_array($d['ai'])) $d['ai'] = [];
    if (!isset($d['ai']['bots']) || !is_array($d['ai']['bots'])) $d['ai']['bots'] = [];
    foreach ((array)aok_get($def, 'ai.bots', []) as $name => $on) {
        if (!array_key_exists($name, $d['ai']['bots'])) $d['ai']['bots'][$name] = $on;
    }

    if (!isset($d['local']) || !is_array($d['local'])) $d['local'] = [];
    if (trim((string)($d['local']['ethicsPolicy'] ?? '')) === '')
        $d['local']['ethicsPolicy'] = (string)aok_get($def, 'local.ethicsPolicy', '');

    return $d;
}

// The coordinates this project first shipped: the middle of Surrey, picked before the street
// address was known. Replaced only where they are still exactly these.
const AOK_V8_GEO = ['lat' => '49.1913', 'lng' => '-122.8490'];

// v9: the structured data's map pin, currencies and Google profile links.
function aok_upgrade_v9(array $d, array $def): array {
    if (!isset($d['local']) || !is_array($d['local'])) $d['local'] = [];
    $L = &$d['local'];

    // the pin: only when it is still the shipped placeholder, or has never been set
    $isShipped = true;
    foreach (AOK_V8_GEO as $k => $old) {
        $cur = trim((string)($L[$k] ?? ''));
        if ($cur !== '' && $cur !== $old) { $isShipped = false; break; }
    }
    if ($isShipped) foreach (['lat', 'lng'] as $k) $L[$k] = (string)aok_get($def, 'local.' . $k, '');

    if (trim((string)($L['currency'] ?? '')) === 'CAD') $L['currency'] = (string)aok_get($def, 'local.currency', 'CAD');

    // more places this same business is listed: added to what is there, never replacing it
    foreach ([['local.directories', 'directories'], ['person.sameAs', null]] as [$path, $key]) {
        $add = array_values(array_filter((array)aok_get($def, $path, [])));
        if (!$add) continue;
        if ($key === null) { $cur = (array)aok_get($d, 'person.sameAs', []); }
        else { $cur = (array)($L[$key] ?? []); }
        $seen = [];
        foreach ($cur as $u) $seen[aok_url_key((string)$u)] = 1;
        foreach ($add as $u) if (empty($seen[aok_url_key($u)])) { $cur[] = $u; $seen[aok_url_key($u)] = 1; }
        if ($key === null) { if (!isset($d['person']) || !is_array($d['person'])) $d['person'] = []; $d['person']['sameAs'] = array_values($cur); }
        else $L[$key] = array_values($cur);
    }
    unset($L);
    return $d;
}
