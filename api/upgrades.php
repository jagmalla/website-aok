<?php
// One-time content upgrades for sites saved before this release ("content version 2").
//
// site_data() (api/db.php) runs aok_upgrade_payload() on the saved site data. If anything changes it
// is saved back once, together with contentVersion = 2, so it never runs again — and a merge you
// undo later in Admin -> Redirects stays undone. A fresh install already starts at version 2
// (the defaults in assets/app.js / api/defaults.json contain the upgraded content).
//
// What it does:
//   1. FAQ: the 7 short answers become the expanded 45–55-word versions.
//   2. SEO: the /services and /faq titles and the /meditation description become the shorter versions.
//   3. Duplicates: 3 duplicate services and 2 duplicate blog posts get a 301 redirect to their primary
//      page, and the primary absorbs the duplicate's text.
// Only text that is still exactly as first shipped is replaced. Text you have edited is kept, and the
// duplicate's missing paragraphs are added to it instead. Nothing is deleted: a merged duplicate keeps
// all its text in the admin.

const AOK_CONTENT_VERSION = 2;

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
    if ((int)($d['contentVersion'] ?? 0) >= AOK_CONTENT_VERSION) return $d;
    $def = is_file(__DIR__ . '/defaults.json') ? json_decode((string)file_get_contents(__DIR__ . '/defaults.json'), true) : null;
    if (!is_array($def)) return $d;   // can't upgrade without the defaults; tried again on the next request

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

    $d['contentVersion'] = AOK_CONTENT_VERSION;
    return $d;
}
