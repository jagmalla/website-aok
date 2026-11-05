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
// Version 10:
//   The seven geo hubs (/locations/...), their index page, and the cities they name added to the
//   service areas. Hubs the owner has edited or deleted are left alone.
// Version 11:
//   The five written geo hubs (Surrey, Canada, the USA, the UK, India) get their full page text
//   from api/content/locations/<slug>.md: the direct-answer box, the question headings, the
//   comparison table and the FAQ. Also their Google titles and descriptions, and the short labels
//   used in the footer. A hub whose text the owner has edited keeps it.
// Version 12:
//   The last two geo hubs \u2014 Vancouver and the Lower Mainland, and British Columbia \u2014 get their
//   written pages, Google titles and descriptions, like the other five did in version 11.
// Version 13:
//   The phone number written as +1-236-660-2000 inside page text becomes +1 (236) 660-2000, the
//   form used everywhere else on the site. This one is applied to edited pages too: it changes
//   only how the owner's own number is punctuated, never any of their words.
// Version 14:
//   The business name is "Analysis of Karma | Vedic astrologer", the owner's choice. Version 6 had
//   copied the Google listing's long name ("... - Vedic astrology & Meditation | Vedic Astrologer Jag
//   Mallah") into the footer, the contact page and the structured data; the site now states the
//   owner's name everywhere instead. Only the exact long value version 6 wrote is replaced.
// Version 15:
//   The Jupiter-Ketu article the owner wrote in the admin had stayed a draft at its temporary address
//   /blog/new-post-xmxoobh6, so visitors and Google saw "page not found". It is published at
//   /blog/jupiter-ketu-conjunction-leo-2026 with its title, Google title, description, focus keyword
//   and finished text, and the temporary address forwards to it. Found by that address or its title;
//   added if it is not there at all.
// Version 16:
//   The hours note the owner asked for in Phase 1, "Online consultations available 7 days a week by
//   appointment". Version 6 only filled an empty note, but live sites already carried the note this
//   project shipped earlier ("Pacific Time, by appointment ..."), so the request never reached them.
//   Replaced only while it is still exactly that shipped text.
// Version 17:
//   The owner's single source of truth. The business name becomes "Analysis of Karma - Vedic
//   astrologer", matching the Google Business Profile; the Google Maps link everywhere becomes
//   https://share.google/qMDfkFkxgAA3NY9Nk; the formal training reads "Advanced Parashari Jyotish,
//   Tajika Varshaphala, Prashna Shastra, Muhurta and Medical Astrology". Each one only replaces the
//   exact value this project shipped earlier.
// Version 18:
//   The service pages' last two generic headings, "Classical Vedic Methodology & Texts Used" and "Key
//   Life Questions & Chart Factors Analyzed", become the question a visitor would ask, each with a
//   40-60 word direct answer under it, as version 7 did for the first heading on five pages. Only a
//   heading still exactly as shipped is replaced; the bullet points under it are kept as they are.
// Version 19:
//   The blog articles' three generic section headings ("Classical Foundations in Jyotish", "House,
//   Planetary & Dasha Dynamics", "Conscious Karma & Practical Vedic Remedies") become the question each
//   section answers, specific to the article. Only the heading line changes, and only while it is still
//   exactly as shipped; the text under it is untouched.
// Version 20:
//   The seven location pages' Google titles (all 60 characters or fewer) and six of their descriptions
//   (now 152-157 characters), short enough for Google to show in full. Each keeps its keyword, the
//   main cities and the fee. Also: the /services page title, a Google title for four articles whose
//   headline is longer than Google shows, and a Google description for eight services whose card text
//   was too short to serve as one (only where none was written). Only a value still exactly as
//   shipped, or empty, is changed.
// Version 21:
//   A line edit of the site's own writing, so it reads like a person talking rather than a template: a
//   phrase repeated over and over on one page is said in different words, stiff forms ("do not", "it is")
//   become what people say, and long runs of same-length sentences are broken up. Facts, headings, prices
//   and the direct-answer boxes are unchanged. The edits are sentence-for-sentence pairs in
//   api/content/v21-edits.json; a sentence is replaced only where it is still exactly as shipped.
// Only text that is still exactly as first shipped is replaced. Text you have edited is kept. Nothing is deleted.

const AOK_CONTENT_VERSION = 21;

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
    if ($v < 10) $d = aok_upgrade_v10($d, $def);
    $d = aok_upgrade_v11($d, $def);
    if ($v < 13) $d = aok_upgrade_v13($d);
    if ($v < 14) $d = aok_upgrade_v14($d);
    if ($v < 15) $d = aok_upgrade_v15($d);
    if ($v < 16) $d = aok_upgrade_v16($d);
    if ($v < 17) $d = aok_upgrade_v17($d);
    if ($v < 18) $d = aok_upgrade_v18($d, $def);
    if ($v < 19) $d = aok_upgrade_v19($d);
    if ($v < 20) $d = aok_upgrade_v20($d, $def);
    if ($v < 21) $d = aok_upgrade_v21($d);
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
    // the content file's first section heading (since version 19 a question, so the old marker is gone)
    if (preg_match('/^## .+$/m', $md, $h) && strpos($text, trim($h[0])) !== false) return true;
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

// v10: the geo hubs. One page per place people search from, each answering the question they type
// there. Added by slug, so a hub the owner has deleted stays deleted and one they have edited is
// left exactly as they left it.
function aok_upgrade_v10(array $d, array $def): array {
    if (!isset($d['locations']) || !is_array($d['locations'])) $d['locations'] = [];
    $have = [];
    foreach ($d['locations'] as $l) if (is_array($l) && ($sl = strtolower(trim((string)($l['slug'] ?? '')))) !== '') $have[$sl] = 1;
    foreach ((array)($d['deletedLocations'] ?? []) as $sl) $have[strtolower((string)$sl)] = 1;
    foreach ((array)aok_get($def, 'locations', []) as $l) {
        $sl = strtolower(trim((string)($l['slug'] ?? '')));
        if ($sl !== '' && empty($have[$sl])) { $d['locations'][] = $l; $have[$sl] = 1; }
    }
    if (!isset($d['locationsPage']) || !is_array($d['locationsPage'])) $d['locationsPage'] = (array)aok_get($def, 'locationsPage', []);

    // the cities the hubs name, added to the service areas so the structured data covers them too
    foreach (['areasServed', 'nearbyCities'] as $k) {
        $cur = array_values(array_filter((array)aok_get($d, 'local.' . $k, [])));
        $seen = [];
        foreach ($cur as $x) $seen[mb_strtolower(aok_norm($x), 'UTF-8')] = 1;
        foreach ((array)aok_get($def, 'local.' . $k, []) as $x) {
            $n = mb_strtolower(aok_norm($x), 'UTF-8');
            if ($n !== '' && empty($seen[$n])) { $cur[] = $x; $seen[$n] = 1; }
        }
        if (!isset($d['local']) || !is_array($d['local'])) $d['local'] = [];
        $d['local'][$k] = $cur;
    }
    return $d;
}

// v11: the geo hubs' page text, and the fields that go with it. Runs on every load like v5, because
// a fresh install starts with the text empty: the pages ship in api/content/locations/, not in the
// data. Only an untouched page is filled, so an owner's own wording is never replaced.
function aok_upgrade_v11(array $d, array $def): array {
    if (!isset($d['locations']) || !is_array($d['locations'])) return $d;
    require_once __DIR__ . '/seo-lib.php';
    $defBySlug = [];
    foreach ((array)aok_get($def, 'locations', []) as $l) if (!empty($l['slug'])) $defBySlug[strtolower((string)$l['slug'])] = $l;

    foreach ($d['locations'] as $i => $l) {
        if (!is_array($l)) continue;
        $slug = strtolower(trim((string)($l['slug'] ?? '')));
        if ($slug === '') continue;
        $o = $defBySlug[$slug] ?? null;

        // the page text: only when it is empty, or still exactly the version shipped before this one
        $md = aok_content_md('locations', $slug);
        if ($md !== '') {
            $cur = trim((string)($l['detail'] ?? ''));
            if ($cur === '' || aok_norm($cur) === aok_norm($md)) $d['locations'][$i]['detail'] = $md;
        }
        // the short label, the Google title and the description, where the owner has set none
        foreach (['navLabel', 'seoTitle', 'seoDescription'] as $f) {
            if ($o !== null && trim((string)($o[$f] ?? '')) !== '' && trim((string)($l[$f] ?? '')) === '') $d['locations'][$i][$f] = $o[$f];
        }
        // the heading, its answer and the typed places, while they are still as shipped
        foreach (['title', 'question', 'answer', 'areas', 'cities', 'cityLabel', 'format', 'timezones', 'scope'] as $f) {
            if ($o === null || !isset($o[$f])) continue;
            $cur = $l[$f] ?? null;
            if ($cur === null || $cur === '' || $cur === []) { $d['locations'][$i][$f] = $o[$f]; continue; }
            // a value still equal to what version 10 shipped takes the new one. Lists are compared
            // as JSON, because areas is a list of lists and would not implode.
            $was = AOK_PAST_LOCATIONS[$slug][$f] ?? null;
            if ($was === null) continue;
            foreach ((array)$was as $v) {
                $same = is_array($cur) ? json_encode($cur) === json_encode($v) : aok_norm($cur) === aok_norm((string)$v);
                if ($same) { $d['locations'][$i][$f] = $o[$f]; break; }
            }
        }
    }
    return $d;
}

// Every value these hub fields have had in an earlier release, so version 12 can tell a page the
// owner has never touched from one they have rewritten. A field is replaced only when what is
// stored still equals one of these. Lists are compared as JSON, because areas is a list of lists.
const AOK_PAST_LOCATIONS = [
    'vedic-astrologer-surrey-bc' => [
        'title' => [
            'Vedic Astrologer in Surrey, BC',
        ],
        'answer' => [
            'Independent Vedic Astrologer Jag Mallah provides 60-minute 1-on-1 Kundli readings, marriage matching (Kundli Milan), Dosha analysis, and Vedic meditation guidance in Surrey, BC from 15450 92a Ave (Fleetwood) and online via Zoom or WhatsApp. Consultations are offered in English, Hindi, and Punjabi for $100 CAD/hr, with payment after satisfaction.',
        ],
        'areas' => [
            [['City', 'Surrey, BC, Canada']],
        ],
    ],
    'vedic-astrologer-vancouver-lower-mainland' => [
        'title' => [
            'Vedic Astrologer for Vancouver & the Lower Mainland',
        ],
        'answer' => [
            'Clients across Metro Vancouver and the Fraser Valley—including Vancouver, Burnaby, Richmond, Delta, Langley, Abbotsford, and Chilliwack—can book live 60-minute Zoom or WhatsApp screen-share consultations or schedule an appointment at our Surrey office. Every session ($100 CAD/hr, pay after satisfaction) examines your Sidereal Lagna, Navamsha, and Vimshottari Dasha.',
        ],
        'cities' => [
            ['Vancouver', 'Burnaby', 'Richmond', 'Delta', 'North Delta', 'Ladner', 'Tsawwassen', 'New Westminster', 'Coquitlam', 'Langley', 'Abbotsford', 'Chilliwack', 'Maple Ridge'],
        ],
        'cityLabel' => [
            'Cities served',
        ],
    ],
    'vedic-astrologer-british-columbia' => [
        'title' => [
            'Vedic Astrologer for British Columbia',
        ],
        'answer' => [
            'Yes. Analysis of Karma serves clients throughout British Columbia—including Victoria, Nanaimo, Kelowna, Kamloops, and Prince George—through live 60-minute Zoom, WhatsApp, and phone sessions on Pacific Time. Jag Mallah delivers classical Parashari birth chart readings, career timing, and unbiased gemstone guidance ($100 CAD/hr) with zero travel required.',
        ],
        'areas' => [
            [['AdministrativeArea', 'British Columbia, Canada'], ['City', 'Victoria, BC, Canada'], ['City', 'Nanaimo, BC, Canada'], ['City', 'Kelowna, BC, Canada'], ['City', 'Kamloops, BC, Canada'], ['City', 'Prince George, BC, Canada']],
        ],
        'cities' => [
            ['Victoria', 'Saanich', 'Nanaimo', 'Kelowna', 'Vernon', 'Penticton', 'Kamloops', 'Prince George', 'Vancouver Island', 'the Okanagan', 'the BC Interior', 'the BC coast'],
        ],
    ],
    'online-vedic-astrologer-canada' => [
        'title' => [
            'Online Vedic Astrologer for Canada',
        ],
        'answer' => [
            'Clients across Canada—including Brampton, Toronto, Mississauga, Calgary, Edmonton, Winnipeg, Ottawa, and Montreal—connect live with Surrey-based Vedic Astrologer Jag Mallah via Zoom or WhatsApp. Sessions last 60 minutes ($100 CAD/hr via Interac e-Transfer after you are satisfied) and accommodate Mountain, Central, Eastern, and Atlantic time zones.',
        ],
        'cities' => [
            ['Brampton', 'Mississauga', 'Toronto', 'Markham', 'Ottawa', 'Hamilton', 'Kitchener–Waterloo', 'Calgary', 'Edmonton', 'Red Deer', 'Winnipeg', 'Saskatoon', 'Regina', 'Montreal', 'Halifax'],
        ],
    ],
    'online-vedic-astrologer-usa' => [
        'title' => [
            'Online Vedic Astrologer for the United States',
        ],
        'answer' => [
            'Yes. Clients across the United States—from Seattle and California to New York, New Jersey, Texas, and Chicago—book live 60-minute 1-on-1 consultations via Zoom or WhatsApp. Operating on Pacific Time, Jag Mallah provides convenient daytime and evening slots for US time zones ($100 CAD/hr, paid only after satisfaction).',
        ],
        'cities' => [
            ['Seattle', 'Bellevue', 'Bellingham', 'Tacoma', 'Kent', 'San Francisco Bay Area', 'San Jose', 'Fremont', 'Sacramento', 'Fresno', 'Los Angeles', 'San Diego', 'New York', 'New Jersey (Edison, Jersey City)', 'Dallas', 'Houston', 'Austin', 'Chicago', 'Atlanta', 'Virginia', 'Michigan'],
        ],
    ],
    'online-vedic-astrologer-uk' => [
        'title' => [
            'Online Vedic Astrologer for the United Kingdom',
        ],
        'answer' => [
            'Clients throughout the United Kingdom—including London, Southall, Wembley, Birmingham, Leicester, Manchester, and Glasgow—consult live with Jag Mallah via WhatsApp or Zoom. Morning appointments in British Columbia align seamlessly with UK late-afternoon and evening hours (5:00 PM to 11:00 PM GMT/BST), conducted in English, Hindi, or Punjabi.',
        ],
        'cities' => [
            ['London', 'Southall', 'Wembley', 'Hounslow', 'Harrow', 'Ilford', 'Croydon', 'Birmingham', 'Wolverhampton', 'Coventry', 'Leicester', 'Manchester', 'Leeds', 'Bradford', 'Glasgow', 'Edinburgh'],
        ],
    ],
    'online-vedic-astrologer-india' => [
        'title' => [
            'Online Vedic Astrologer for India',
        ],
        'answer' => [
            'Clients across India—including Chandigarh, Ludhiana, Amritsar, Jalandhar, Delhi NCR, Haryana, and Mumbai—can book 1-on-1 WhatsApp or Zoom consultations directly in Punjabi, Hindi, or English. Early-morning and evening IST time slots allow seamless live Kundli readings, NRI marriage matching, and career consultations with Jag Mallah.',
        ],
    ],
];

// v13: one written form of the phone number. Search engines read digits and do not mind the
// punctuation, but a site that writes its own number two ways is a site that has stopped checking.
function aok_upgrade_v13(array $d): array {
    $phone = trim((string)($d['contact']['phone'] ?? ''));
    $digits = preg_replace('/\D/', '', $phone);
    if ($phone === '' || strlen($digits) < 10) return $d;
    $n = substr($digits, -10);
    // +1-236-660-2000, 1-236-660-2000, 236-660-2000 and 236.660.2000, but not the canonical form itself
    $rx = '/(?<![\d(])(?:\+?1[-.\s])?' . substr($n, 0, 3) . '[-.]' . substr($n, 3, 3) . '[-.]' . substr($n, 6) . '(?!\d)/';
    foreach (['services', 'locations'] as $k) {
        foreach ((array)($d[$k] ?? []) as $i => $x) {
            if (is_array($x) && isset($x['detail']) && is_string($x['detail'])) $d[$k][$i]['detail'] = preg_replace($rx, $phone, $x['detail']);
        }
    }
    return $d;
}

// v14: the owner's chosen business name, everywhere the site states one.
function aok_upgrade_v14(array $d): array {
    $long = 'Analysis of Karma - Vedic astrology & Meditation | Vedic Astrologer Jag Mallah';
    $addr = '15450 92a Ave, Surrey, BC V3R 9B1, Canada';
    if (isset($d['local']) && is_array($d['local']) && aok_norm($d['local']['listingName'] ?? '') === aok_norm($long))
        $d['local']['listingName'] = 'Analysis of Karma | Vedic astrologer';
    if (isset($d['contact']) && is_array($d['contact']) && aok_norm($d['contact']['mapQuery'] ?? '') === aok_norm($long . ', ' . $addr))
        $d['contact']['mapQuery'] = 'Analysis of Karma, ' . $addr;
    return $d;
}

// v15: publish the Jupiter-Ketu article properly.
function aok_upgrade_v15(array $d): array {
    $slug = 'jupiter-ketu-conjunction-leo-2026';
    $old  = 'new-post-xmxoobh6';
    $body = aok_content_md('new-posts', $slug);
    if ($body === '') return $d;
    $post = [
        'title' => 'Major Astrological Transit 2026: Jupiter-Ketu Conjunction and Neechbhang Raj Yoga (Impact on All 12 Ascendants)',
        'seoTitle' => 'Jupiter-Ketu Conjunction in Leo 2026: All 12 Ascendants',
        'excerpt' => 'Jupiter and Ketu meet in Leo from 31 October to 25 November 2026, with a Neechbhang Raj Yoga in Libra. What this rare transit brings for all 12 ascendants.',
        'focusKeyword' => 'Jupiter Ketu conjunction 2026',
    ];
    if (!isset($d['blog']) || !is_array($d['blog'])) $d['blog'] = [];

    // the owner's draft: by its temporary address, or by its title if the address was changed
    $at = null;
    foreach ($d['blog'] as $i => $p) {
        if (!is_array($p)) continue;
        $sl = (string)($p['slug'] ?? '');
        if ($sl === $slug || $sl === $old) { $at = $i; break; }
        if ($at === null && stripos(aok_norm($p['title'] ?? ''), 'Jupiter-Ketu Conjunction') !== false) $at = $i;
    }
    if ($at === null) {
        array_unshift($d['blog'], ['id' => 'jupiter-ketu-2026', 'slug' => $slug, 'date' => '2026-11-05', 'published' => true,
            'image' => null, 'robots' => 'index, follow', 'body' => $body] + $post);
    } else {
        $p = $d['blog'][$at];
        // if the owner had already published it under an address of their own, that one forwards too
        $own = (string)($p['slug'] ?? '');
        if (!empty($p['published']) && $own !== '' && $own !== $slug && $own !== $old) $alsoFrom = $own;
        $p['slug'] = $slug;
        $p['published'] = true;
        unset($p['redirectTo']);
        if (trim((string)($p['robots'] ?? '')) === '' || stripos((string)$p['robots'], 'noindex') !== false) $p['robots'] = 'index, follow';
        foreach ($post as $k => $v) $p[$k] = $v;
        // the finished text, unless it is already there
        if (strpos((string)($p['body'] ?? ''), '## Frequently Asked Questions') === false) $p['body'] = $body;
        // a picture pasted into the editor is stored inline and weighs down every page load; the same
        // picture now ships in assets/img/posts/ under the post's address, in all three shapes
        if (empty($p['image']) || preg_match('#^data:#i', (string)$p['image'])) $p['image'] = null;
        if (trim((string)($p['date'] ?? '')) === '') $p['date'] = '2026-11-05';
        $d['blog'][$at] = $p;
    }

    // the temporary address was shared: it forwards to the article
    $reds = (isset($d['redirects']) && is_array($d['redirects'])) ? $d['redirects'] : [];
    $have = false;
    foreach ($reds as $r) if (strtolower(trim((string)($r['from'] ?? ''), '/')) === 'blog/' . $old) $have = true;
    if (!$have) $reds[] = ['from' => '/blog/' . $old, 'to' => '/blog/' . $slug];
    if (!empty($alsoFrom)) $reds[] = ['from' => '/blog/' . $alsoFrom, 'to' => '/blog/' . $slug];
    $d['redirects'] = array_values($reds);
    return $d;
}

// v16: the hours note as the owner asked for it.
function aok_upgrade_v16(array $d): array {
    $shipped = "Pacific Time, by appointment \u{2014} early-morning and evening slots available for clients in India, the UK and across North America.";
    if (isset($d['local']) && is_array($d['local']) && aok_norm($d['local']['hoursNote'] ?? '') === aok_norm($shipped))
        $d['local']['hoursNote'] = 'Online consultations available 7 days a week by appointment';
    return $d;
}

// v17: the owner's single source of truth for the name, the Maps link and the training.
function aok_upgrade_v17(array $d): array {
    $oldMap = 'https://maps.app.goo.gl/XrwSpDBGaVsFQ5dV8';
    $newMap = 'https://share.google/qMDfkFkxgAA3NY9Nk';
    if (isset($d['local']) && is_array($d['local'])) {
        if (aok_norm($d['local']['listingName'] ?? '') === 'Analysis of Karma | Vedic astrologer')
            $d['local']['listingName'] = 'Analysis of Karma - Vedic astrologer';
        foreach (['mapsCidUrl', 'reviewUrl'] as $k)
            if (trim((string)($d['local'][$k] ?? '')) === $oldMap) $d['local'][$k] = $newMap;
    }
    if (isset($d['person']) && is_array($d['person'])) {
        $p = $d['person'];
        if (isset($p['studies']) && is_array($p['studies'])
            && array_map('aok_norm', $p['studies']) === ['Advanced Astrology', 'Tajika (Varshaphala and Prashna Shastra)', 'Muhurta', 'Medical Astrology'])
            $p['studies'] = ['Advanced Parashari Jyotish', 'Tajika Varshaphala', 'Prashna Shastra', 'Muhurta', 'Medical Astrology'];
        if (isset($p['shortBio']) && is_string($p['shortBio']))
            $p['shortBio'] = str_replace('He completed formal studies in Advanced Astrology, Tajika (Varshaphala and Prashna Shastra), Muhurta and Medical Astrology under his mentor',
                'He trained in Advanced Parashari Jyotish, Tajika Varshaphala, Prashna Shastra, Muhurta and Medical Astrology under his mentor', $p['shortBio']);
        $d['person'] = $p;
    }
    return $d;
}

// v18: question headings with a direct answer under each, replacing the two generic headings on the
// service pages that still had them (heading line => [question heading, 40-60 word answer])
const AOK_V18_HEADINGS = [
    'birth-chart-generation' => [
        ['## Classical Vedic Methodology & Texts Used',
         '## How Is an Accurate Vedic Birth Chart Calculated?',
         'An accurate Vedic birth chart is calculated from your exact birth date, time and place using Swiss Ephemeris astronomy, the Lahiri (Chitrapaksha) Ayanamsha, and the correct latitude, longitude and Daylight Saving adjustments. Jag Mallah then generates all 16 divisional charts (Shodashvarga) and the Shadbala planetary strengths, so every later reading rests on precise mathematics.'],
        ['## Key Life Questions & Chart Factors Analyzed',
         '## What Does Your Vedic Birth Chart Report Include?',
         'Your birth chart report verifies the exact rising sign (Lagna), including births near a sign boundary, and records each planet\'s degree and Nakshatra Pada. It sets out the full 120-year Vimshottari Dasha calendar and the special ascendants (Arudha, Ghati and Hora Lagna), giving you a reliable reference chart for every future consultation.'],
    ],
    'child-naming-astrology-report' => [
        ['## Classical Vedic Methodology & Texts Used',
         '## How Does Vedic Astrology Choose an Auspicious Name for a Baby?',
         'Vedic astrology chooses a baby\'s name from the child\'s birth star (Nama Nakshatra) and its quarter (Pada), which give the classical starting syllables (Aksharas). Jag Mallah checks that the name\'s sound harmonises with the child\'s Moon and Lagna. The reading is always encouraging: no lifespan, medical or fear-based predictions are ever made for children.'],
        ['## Key Life Questions & Chart Factors Analyzed',
         '## What Will Parents Learn From a Child Astrology Report?',
         'Parents receive a list of verified auspicious name letters and a gentle picture of their child\'s temperament: emotional needs, comfort patterns, and natural learning strengths in science, arts, analysis or sport. The report also offers practical nursery guidance on light, colour and elemental balance to support restful sleep and a peaceful home.'],
    ],
    'horoscopes-daily-weekly-monthly' => [
        ['## Classical Vedic Methodology & Texts Used',
         '## How Are Personalised Vedic Horoscopes Different From Sun-Sign Horoscopes?',
         'Personalised Vedic horoscopes are read from your Moon sign (Chandra Rashi) and birth star, not a generic Sun sign. Jag Mallah measures real-time transits of Saturn, Jupiter and Rahu-Ketu against your natal Moon, scores them with Ashtakavarga bindus and checks daily Tara Bala, so each forecast reflects your own chart rather than a twelfth of the population.'],
        ['## Key Life Questions & Chart Factors Analyzed',
         '## What Can a Daily, Weekly or Monthly Horoscope Help You Plan?',
         'A personalised horoscope helps you plan peak days for meetings, pitches and creative work, favourable windows for investments and expected spending spikes, calmer times for important conversations, and rest during challenging 6th or 8th house lunar transits. It turns planetary movements into a practical calendar for your week or month.'],
    ],
    'karmic-past-life-astrology' => [
        ['## Classical Vedic Methodology & Texts Used',
         '## How Does Vedic Astrology Read Past-Life Karma?',
         'Vedic astrology reads past-life karma mainly through the Rahu-Ketu axis: Ketu shows accumulated mastery and old attachments, while Rahu shows the desires your soul is growing toward. Jag Mallah adds the Shashtiamsha (D-60) chart, retrograde planets, and the 5th and 9th houses of Poorva Punya, as described in Brihat Parashara Hora Shastra.'],
        ['## Key Life Questions & Chart Factors Analyzed',
         '## Which Life Patterns Can a Karmic Astrology Reading Explain?',
         'A karmic reading can explain unexplained fears, phobias and compulsions, sudden and intense soul connections, and repeating cycles that keep pulling you back to old comfort zones (Ketu). It then shows how to step into your present life mission (Rahu) with confidence, using practical, ethical remedies rather than fear.'],
    ],
    'live-astrologer-consultation' => [
        ['## Classical Vedic Methodology & Texts Used',
         '## What Happens in a Live Vedic Astrology Consultation?',
         'In a live consultation you speak directly with Jag Mallah, with no intermediaries, scripts or junior readers. He combines your birth chart (Kundli), dasha periods and Prashna Shastra (horary astrology for the moment you ask) in real time, checking details as you share them, so career, health, money and relationships are read together.'],
        ['## Key Life Questions & Chart Factors Analyzed',
         '## What Questions Can You Ask in a Live Astrologer Session?',
         'You can ask about any area of life in complete privacy: pressing decisions on relocation, investments, partnerships or career changes, and quick comparisons with a spouse\'s or child\'s chart where relevant. Every 60-minute session ($100 CAD per hour) ends with a practical lifestyle and remedy plan, and new clients pay only if satisfied.'],
    ],
    'love-or-arranged-marriage-astrology' => [
        ['## Classical Vedic Methodology & Texts Used',
         '## How Does Vedic Astrology Show a Love or Arranged Marriage?',
         'Vedic astrology shows a love marriage when the 5th lord of romance and the 7th lord of commitment connect by aspect, conjunction or sign exchange (Parivartana). Involvement of the 9th and 2nd lords points to a family-supported arranged match, while Rahu or Venus on the 7th house suggests an unconventional union. The Navamsha (D-9) confirms long-term sustainability.'],
        ['## Key Life Questions & Chart Factors Analyzed',
         '## What Marriage Questions Does This Reading Answer?',
         'This reading answers whether a love or arranged marriage is likely to bring you greater fulfilment, when favourable dasha windows activate marriage, and the probable nature, temperament and background of your partner. Where Saturn or Ketu delay marriage through the 7th house, Jag Mallah explains the timing and suggests classical remedies.'],
    ],
    'medical-astrology-holistic' => [
        ['## Classical Vedic Methodology & Texts Used',
         '## How Does Vedic Medical Astrology Assess Health Tendencies?',
         'Vedic medical astrology assesses your elemental constitution (Vata, Pitta, Kapha) from the Lagna, Moon and planets, maps the body through the 12 signs of the Kaal Purusha, and reads the Sun and Moon for vitality and mental balance. Insights are complementary and preventive only: this consultation never diagnoses illness or replaces professional healthcare.'],
        ['## Key Life Questions & Chart Factors Analyzed',
         '## What Health Questions Can Medical Astrology Help With?',
         'Medical astrology can point to stress-prone body systems, such as digestion, nerves or inflammation, and to dasha periods of lower vitality linked to the 6th house, when rest and nutrition matter most. It suggests gentle balancing through diet, daily routine, meditation and Swarodaya breath practice, always alongside your doctor\'s advice.'],
    ],
    'muhurat-auspicious-timing' => [
        ['## Classical Vedic Methodology & Texts Used',
         '## How Is an Auspicious Muhurat Selected in Vedic Astrology?',
         'An auspicious Muhurat is selected by checking the five limbs of the Panchanga (Tithi, Vara, Nakshatra, Yoga and Karana), then matching the time to your own birth chart: a favourable Janma Tara, no Chandra Ashtama and a protective rising sign. Rahu Kaal, Gulika, Bhadra, eclipses and Gandanta are excluded, and activity-specific classical rules are applied.'],
        ['## Key Life Questions & Chart Factors Analyzed',
         '## Which Events Benefit Most From a Muhurat?',
         'A Muhurat is most valuable for weddings and engagements, where both partners\' charts are harmonised, and for business or website launches, property registrations, housewarmings (Griha Pravesh), contract signings and major purchases. Each time is chosen to strengthen the houses that matter for that event, such as the 4th for property or the 10th and 11th for business.'],
    ],
    'personalized-year-ahead-forecast' => [
        ['## Classical Vedic Methodology & Texts Used',
         '## How Does a Tajika Solar Return Chart Forecast Your Year?',
         'A Tajika solar return (Varshaphala) chart is cast for the exact moment the Sun returns to its natal degree each year. Following Tajika Neelakanthi, Jag Mallah finds the Muntha, the year\'s focal house, crowns the Year Lord (Varsheshwara) from the five office-bearers, and times events with Ithasala, Ishrafa and Muthashila yogas.'],
        ['## Key Life Questions & Chart Factors Analyzed',
         '## What Does a Year-Ahead Forecast Cover?',
         'A year-ahead forecast shows the year\'s main theme, whether expansion, relationships or introspection, then breaks it into quarters so you know when to push forward and when to be patient. It tracks your energy and vitality, and cross-checks every annual promise against your Vimshottari Dasha, so the forecast fits your longer life cycle.'],
    ],
    'vedic-astrology-jyotish-deep-dives' => [
        ['## Classical Vedic Methodology & Texts Used',
         '## What Makes a Jyotish Deep-Dive Different From a Standard Reading?',
         'A Jyotish deep-dive combines three classical systems in one reading: Parashari principles from Brihat Parashara Hora Shastra, Jaimini Chara Karakas such as the Atmakaraka (soul planet), and Bhrigu Nandi Nadi linkages. It examines the D-1, D-9, D-10, D-12 and D-60 charts and Argala influences, so hidden supports and karmic blocks become visible.'],
        ['## Key Life Questions & Chart Factors Analyzed',
         '## What Life Questions Does a Deep-Dive Reading Explore?',
         'A deep-dive explores your soul\'s purpose and dharma, the recurring themes in your relationships, finances and family, and a long-range dasha roadmap for the next decade. It also shows how to balance the four purusharthas, Dharma (duty), Artha (wealth), Kama (desire) and Moksha (liberation), across your material and spiritual life.'],
    ],
    'vedic-meditation-guidance' => [
        ['## Classical Vedic Methodology & Texts Used',
         '## How Is Meditation Personalised Using Your Vedic Chart?',
         'Meditation is personalised by reading your Moon (emotional mind) and Mercury (intellect) to choose a style that suits your temperament. Jag Mallah draws on Shiva Swarodaya breath science (Ida, Pingala and Sushumna), selects a seed (Beej) mantra linked to your Ishta Devata, and balances the five elements (Pancha Mahabhuta) through grounding or calming practice.'],
        ['## Key Life Questions & Chart Factors Analyzed',
         '## What Can Personalised Vedic Meditation Help With?',
         'Personalised meditation can ease a restless mind and anxiety patterns linked to Moon-Rahu or Moon-Saturn signatures, strengthen intuition through contemplative silence, and build a realistic 15–20 minute daily routine that fits your work. It also deepens your other astrological remedies, such as charity and personal contemplation, through steady focus.'],
    ],
    'kundli-milan-marriage-matching' => [
        ['## Key Life Questions & Chart Factors Analyzed',
         '## What Does Kundli Milan Reveal About Married Life?',
         'Kundli Milan reveals emotional bonding through Moon-to-Moon factors (Graha Maitri and Bhakoot), physical and family harmony through Yoni and Nadi, and the couple\'s financial growth through the 2nd and 11th houses across both charts. It also checks the 4th and 9th houses for how smoothly each partner settles in with in-laws and extended family.'],
    ],
    'dosha-analysis-remedies' => [
        ['## Key Life Questions & Chart Factors Analyzed',
         '## How Do You Know If a Dosha Is Really Affecting Your Life?',
         'A dosha only matters when it creates a functional obstacle, not just a nominal placement. Jag Mallah checks which life area it actually touches (marriage, career, health or peace of mind), which dasha and transit periods activate it and when relief arrives, and the discipline and wisdom the combination can build when handled consciously.'],
    ],
    'gemstone-recommendation' => [
        ['## Key Life Questions & Chart Factors Analyzed',
         '## Which Gemstones Suit Your Chart, and How Should They Be Worn?',
         'The right gemstones depend on your functional benefic lords: the Lagna lord\'s stone (Jeevan Ratna) for health and confidence, and the 9th and 10th lords\' stones for fortune and career. Stones that could amplify health, legal or emotional troubles are flagged to avoid, and you receive exact guidance on metal, finger, day, hora and consecration mantra.'],
    ],
    'career-finance-consultation' => [
        ['## Key Life Questions & Chart Factors Analyzed',
         '## What Career and Money Decisions Can Your Chart Clarify?',
         'Your chart can clarify whether employment (6th house) or an independent business (7th and 10th houses) suits you, when dasha shifts favour resigning or changing roles, and when 12th-house activations call for investment caution. It also assesses whether a business partner or co-founder is likely to bring growth or dispute, before you commit.'],
    ],
];

function aok_upgrade_v18(array $d, array $def): array {
    if (!isset($d['services']) || !is_array($d['services'])) return $d;
    require_once __DIR__ . '/seo-lib.php';
    foreach ($d['services'] as $i => $s) {
        if (!is_array($s)) continue;
        $detail = (string)($s['detail'] ?? '');
        if ($detail === '') continue;
        foreach (AOK_V18_HEADINGS[aok_service_content_key($s, $def)] ?? [] as [$from, $to, $answer]) {
            if (strpos($detail, $to) !== false) continue;   // already done
            $lines = explode("\n", str_replace("\r\n", "\n", $detail));
            foreach ($lines as $k => $line) {
                if (trim($line) !== $from) continue;   // a heading the owner renamed is kept
                array_splice($lines, $k, 1, [$to, $answer, '']);
                $detail = implode("\n", $lines);
                break;
            }
        }
        if ($detail !== (string)($s['detail'] ?? '')) { $d['services'][$i]['detail'] = $detail; $d['services'][$i]['updatedAt'] = gmdate('c'); }
    }
    return $d;
}

// v19: the blog articles' three generic section headings become the question the section answers
const AOK_V19_POST_HEADINGS = [
    '12-astrological-houses-explained' => ['## What Do the Classical Texts Say About the 12 Houses?', '## How Are the Houses Judged and Timed in a Vedic Chart?', '## How Can You Work With the Karma Each House Shows?'],
    'auspicious-dates-marriage-business' => ['## What Is Muhurta, and Which Periods Should You Avoid?', '## How Is a Muhurta Chosen for Marriage, Business or Property?', '## How Do You Make the Most of an Auspicious Date?'],
    'best-gemstones-zodiac-sign' => ['## Why Does Your Ascendant Matter More Than Your Sun Sign for Gemstones?', '## Which Gemstone Suits Your Ascendant, and When Should You Avoid One?', '## Do You Need a Gemstone at All, or Is Another Remedy Better?'],
    'career-astrology-midheaven' => ['## What Do the Classical Texts Say About Career in a Birth Chart?', '## How Do the 10th House, D-10 Chart and Dashas Shape Your Career?', '## Which Practical Remedies Support Career Growth?'],
    'full-moon-new-moon-vedic-astrology' => ['## What Do the Classical Texts Say About the Full Moon and New Moon?', '## How Do Lunar Phases Work Through Your Own Birth Chart?', '## How Can You Work With Full and New Moons in Daily Life?'],
    'mangal-dosha-myths-facts-remedies' => ['## What Do the Classical Texts Actually Say About Mangal Dosha?', '## When Does Mars Really Cause Mangal Dosha, and When Is It Cancelled?', '## Which Remedies Genuinely Help With Mangal Dosha?'],
    'medical-astrology-body' => ['## What Do the Classical Texts Say About Astrology and the Body?', '## How Do Houses, Dashas and Transits Point to Health Tendencies?', '## Which Practical Remedies Support Health Alongside Medical Care?'],
    'meditation-and-remedies' => ['## What Do the Classical Texts Say About the Mind, Karma and Remedies?', '## How Does Your Chart Guide the Right Meditation?', '## How Do You Build a Daily Meditation and Remedy Practice?'],
    'mercury-retrograde-survival-guide' => ['## What Do the Classical Texts Say About Mercury Retrograde?', '## Whose Chart Feels Mercury Retrograde Most, and Where?', '## What Should You Do During Mercury Retrograde?'],
    'north-and-south-nodes-karmic-path' => ['## What Do the Classical Texts Say About Rahu and Ketu?', '## How Do Rahu and Ketu Work Through Houses and Dashas?', '## How Can You Direct the Energy of Rahu and Ketu?'],
    'saturn-return-explained' => ['## What Do the Classical Texts Say About Saturn and the Saturn Return?', '## How Do Your Natal Saturn, Sade Sati and Dasha Shape a Saturn Return?', '## How Can You Work Consciously With Your Saturn Return?'],
    'solar-return-charts' => ['## How Did the Solar Return Become the Tajika Varshaphala?', '## How Is a Varshaphala Annual Chart Read?', '## How Can You Use Your Annual Chart in Practice?'],
    'sun-moon-rising-signs' => ['## Why Does Vedic Astrology Put the Rising Sign and Moon First?', '## How Do the Sun, Moon and Lagna Work Together in Your Chart?', '## How Can You Keep Your Sun, Moon and Rising Sign in Balance?'],
    'ultimate-guide-birth-chart' => ['## What Are the Building Blocks of a Vedic Birth Chart?', '## How Do Dignity, Lordship, Yogas and Dashas Work Together?', '## How Do You Turn Your Birth Chart Into Practical Action?'],
    'vedic-vs-western-astrology' => ['## What Classical Texts and Tools Set Vedic Astrology Apart?', '## How Do Vedic Houses, Aspects and Timing Differ From Western Astrology?', '## How Does Vedic Astrology Turn Insight Into Practical Remedies?'],
    'zodiac-compatibility-best-worst-matches' => ['## Why Does Vedic Compatibility Start From the Moon Sign?', '## Which Sign Pairs Match Best, and What Else Matters?', '## What Practical Remedies Help a Relationship Thrive?'],
];

function aok_upgrade_v19(array $d): array {
    if (!isset($d['blog']) || !is_array($d['blog'])) return $d;
    $from = ['## Classical Foundations in Jyotish', '## House, Planetary & Dasha Dynamics', '## Conscious Karma & Practical Vedic Remedies'];
    foreach ($d['blog'] as $i => $p) {
        if (!is_array($p) || !isset(AOK_V19_POST_HEADINGS[(string)($p['slug'] ?? '')])) continue;
        $body = (string)($p['body'] ?? '');
        if ($body === '') continue;
        $to = AOK_V19_POST_HEADINGS[(string)$p['slug']];
        $lines = explode("\n", str_replace("\r\n", "\n", $body));
        foreach ($lines as $k => $line) {
            $at = array_search(trim($line), $from, true);   // a heading the owner renamed is kept
            if ($at !== false) $lines[$k] = $to[$at];
        }
        $new = implode("\n", $lines);
        if ($new !== str_replace("\r\n", "\n", $body)) { $d['blog'][$i]['body'] = $new; $d['blog'][$i]['updatedAt'] = gmdate('c'); }
    }
    return $d;
}

// v20: the location pages' Google titles and descriptions, at lengths Google shows in full (field => [shipped, new])
const AOK_V20_LOCATION_SEO = [
    'vedic-astrologer-surrey-bc' => [
        'seoTitle' => ['Vedic Astrologer in Surrey, BC | Kundli & Marriage Matching | Jag Mallah', 'Vedic Astrologer in Surrey, BC | Kundli Reading | Jag Mallah'],
        'seoDescription' => ['Book a 1-on-1 Kundli birth chart reading, Kundli Milan marriage matching, or Dosha consultation in Surrey, BC (15450 92a Ave, Fleetwood) or via Zoom. $100 CAD/hr, pay after satisfaction.', 'Kundli reading, Kundli Milan and dosha consultations in Surrey, BC (Fleetwood, 15450 92a Ave) or on Zoom. $100 CAD/hr; new clients pay only if satisfied.'],
    ],
    'vedic-astrologer-vancouver-lower-mainland' => [
        'seoTitle' => ['Vedic Astrologer in Vancouver, Burnaby, Langley & Abbotsford | Jag Mallah', 'Vedic Astrologer in Vancouver & Lower Mainland | Jag Mallah'],
        'seoDescription' => ['Book a 1-on-1 Kundli birth chart reading, marriage matching (Kundli Milan), or career consultation across Vancouver, Burnaby, Richmond, Delta, Langley & Abbotsford. $100 CAD/hr.', 'Kundli reading, Kundli Milan and career consultations for Vancouver, Burnaby, Richmond, Delta, Langley and Abbotsford. $100 CAD/hr, in person or online.'],
    ],
    'vedic-astrologer-british-columbia' => [
        'seoTitle' => ['Online Vedic Astrologer in British Columbia | Victoria, Kelowna & Kamloops', 'Online Vedic Astrologer in British Columbia | Jag Mallah'],
        'seoDescription' => ['Live 1-on-1 online Vedic astrology and meditation consultations across British Columbia — including Victoria, Nanaimo, Kelowna, Kamloops & Prince George. $100 CAD/hr, pay after satisfaction.', 'Online Vedic astrology and meditation sessions across BC, from Victoria and Nanaimo to Kelowna, Kamloops and Prince George. $100 CAD/hr, pay if satisfied.'],
    ],
    'online-vedic-astrologer-canada' => [
        'seoTitle' => ['Online Vedic Astrologer in Canada | Zoom & WhatsApp Kundli Reading', 'Online Vedic Astrologer in Canada | Zoom & WhatsApp Kundli'],
        'seoDescription' => ['Consult live with Canadian Vedic Astrologer Jag Mallah across Toronto, Brampton, Calgary, Edmonton, Winnipeg, Ottawa & Montreal via Zoom or WhatsApp. $100 CAD/hr, pay after satisfaction.', 'Consult Vedic astrologer Jag Mallah live on Zoom or WhatsApp from Toronto, Brampton, Calgary, Edmonton, Ottawa or Montreal. $100 CAD/hr, pay if satisfied.'],
    ],
    'online-vedic-astrologer-usa' => [
        'seoTitle' => ['Online Vedic Astrologer in the USA | Live Zoom Kundli Consultations', 'Online Vedic Astrologer in the USA | Zoom Kundli Reading'],
        'seoDescription' => ['Book a 60-minute 1-on-1 online Vedic astrology reading from Seattle, California, New York, New Jersey, Texas, or Chicago with Jag Mallah. $100 CAD/hr, pay after satisfaction.', '60-minute online Vedic astrology readings with Jag Mallah from Seattle, California, New York, New Jersey, Texas or Chicago. $100 CAD/hr, pay if satisfied.'],
    ],
    'online-vedic-astrologer-uk' => [
        'seoTitle' => ['Online Vedic Astrologer in the UK | London, Birmingham & Leicester', 'Online Vedic Astrologer in the UK | London & Birmingham'],
        'seoDescription' => ['Consult live via WhatsApp or Zoom with Vedic Astrologer Jag Mallah from London, Southall, Wembley, Birmingham, Leicester, or Manchester. UK evening appointments available.', 'Consult Vedic astrologer Jag Mallah live on WhatsApp or Zoom from London, Southall, Wembley, Birmingham, Leicester or Manchester. UK evening slots available.'],
    ],
    'online-vedic-astrologer-india' => [
        'seoTitle' => ['Online Vedic Astrologer for India & NRI Families | Punjab, Delhi & Mumbai', 'Online Vedic Astrologer for India & NRIs | Jag Mallah'],
    ],
];

// v20: Google descriptions for eight services whose card text was too short (filled only while empty)
const AOK_V20_SERVICE_DESC = [
    'birth-chart-generation' => 'An accurate Vedic birth chart (Kundli) from your exact birth time and place: Lahiri Ayanamsha, all 16 divisional charts and your dasha timeline. $100 CAD/hr.',
    'love-or-arranged-marriage-astrology' => 'Will your marriage be love or arranged, and when? Jag Mallah reads your 5th, 7th and 9th houses, Venus and the Navamsha in a 60-minute session. $100 CAD/hr.',
    'live-astrologer-consultation' => 'Live 1-on-1 Vedic astrology with Jag Mallah on Zoom, WhatsApp, phone or in person in Surrey. Ask anything in English, Hindi or Punjabi. $100 CAD per hour.',
    'personalized-year-ahead-forecast' => 'Your year ahead from a Tajika solar return (Varshaphala) chart: the year\'s theme, quarter-by-quarter timing and dasha cross-checks. 60 minutes, $100 CAD/hr.',
    'muhurat-auspicious-timing' => 'Auspicious dates and times (Muhurat) for weddings, launches, housewarmings and property, matched to your own birth chart. $100 CAD/hr, pay if satisfied.',
    'vedic-astrology-jyotish-deep-dives' => 'A classical Jyotish deep-dive combining Parashari, Jaimini and Bhrigu Nandi Nadi methods: soul purpose, life themes and a 10-year dasha roadmap. $100 CAD/hr.',
    'karmic-past-life-astrology' => 'Understand the karmic and past-life patterns in your chart through Rahu, Ketu, the D-60 chart and retrograde planets, with practical remedies. $100 CAD/hr.',
    'child-naming-astrology-report' => 'Auspicious baby names from your child\'s birth nakshatra, plus a gentle report on temperament and learning strengths. No fear-based predictions. $100 CAD/hr.',
];
// v20: Google titles for four articles whose headline is longer than Google shows (shipped headline => title)
const AOK_V20_POST_TITLES = [
    'ultimate-guide-birth-chart' => ['The Ultimate Guide to Understanding Your Birth Chart (Natal Chart)', 'The Ultimate Guide to Your Vedic Birth Chart (Natal Chart)'],
    'saturn-return-explained' => ['Saturn Return: What It Is, When It Happens, and How to Navigate It', 'Saturn Return: When It Happens and How to Navigate It'],
    'career-astrology-midheaven' => ['Career Astrology: Finding Your True Calling Based on Your Midheaven', 'Career Astrology: Find Your True Calling From Your Midheaven'],
    'medical-astrology-body' => ['Medical Astrology: How the Zodiac Signs Relate to the Physical Body', 'Medical Astrology: How the Zodiac Signs Relate to the Body'],
];

function aok_upgrade_v20(array $d, array $def): array {
    // the /services page title, while it is still as shipped
    if (isset($d['seo']['services']) && is_array($d['seo']['services']) && aok_norm($d['seo']['services']['title'] ?? '') === 'Vedic Astrology Services | Kundli, Matching & Remedies')
        $d['seo']['services']['title'] = 'Vedic Astrology Services | Kundli & Remedies';
    // services: a Google description where none was written
    if (isset($d['services']) && is_array($d['services'])) {
        require_once __DIR__ . '/seo-lib.php';
        foreach ($d['services'] as $i => $s) {
            if (!is_array($s) || trim((string)($s['seoDescription'] ?? '')) !== '') continue;
            $txt = AOK_V20_SERVICE_DESC[aok_service_content_key($s, $def)] ?? '';
            if ($txt !== '') $d['services'][$i]['seoDescription'] = $txt;
        }
    }
    // articles: a shorter Google title, while the headline is as shipped and no Google title was written
    if (isset($d['blog']) && is_array($d['blog'])) {
        foreach ($d['blog'] as $i => $p) {
            if (!is_array($p) || trim((string)($p['seoTitle'] ?? '')) !== '') continue;
            $t = AOK_V20_POST_TITLES[(string)($p['slug'] ?? '')] ?? null;
            if ($t && aok_norm($p['title'] ?? '') === aok_norm($t[0])) $d['blog'][$i]['seoTitle'] = $t[1];
        }
    }
    if (!isset($d['locations']) || !is_array($d['locations'])) return $d;
    foreach ($d['locations'] as $i => $l) {
        if (!is_array($l)) continue;
        $changed = false;
        foreach (AOK_V20_LOCATION_SEO[(string)($l['slug'] ?? '')] ?? [] as $f => [$from, $to]) {
            if (aok_norm($l[$f] ?? '') !== aok_norm($from)) continue;   // text the owner changed is kept
            $d['locations'][$i][$f] = $to; $changed = true;
        }
        if ($changed) $d['locations'][$i]['updatedAt'] = gmdate('c');
    }
    return $d;
}

// v21: sentence-for-sentence line edits (api/content/v21-edits.json: [[shipped, new], ...]). Every text
// field of the site is checked; a field changes only where it still contains a shipped sentence exactly.
function aok_upgrade_v21(array $d): array {
    $f = __DIR__ . '/content/v21-edits.json';
    $pairs = is_file($f) ? json_decode((string)file_get_contents($f), true) : null;
    if (!is_array($pairs) || !$pairs) return $d;
    $from = []; $to = [];
    foreach ($pairs as $p) if (is_array($p) && isset($p[0], $p[1]) && is_string($p[0]) && is_string($p[1]) && mb_strlen($p[0]) >= 20) { $from[] = $p[0]; $to[] = $p[1]; }
    if (!$from) return $d;
    $skip = ['redirects' => 1, 'id' => 1, 'slug' => 1, 'image' => 1, 'banner' => 1, 'updatedAt' => 1, 'date' => 1, 'schema' => 1];
    $walk = function (&$x, $key = '') use (&$walk, $from, $to, $skip) {
        if (isset($skip[(string)$key])) return false;
        if (is_string($x)) {
            if (mb_strlen($x) < 20) return false;
            $n = str_replace($from, $to, $x);
            if ($n !== $x) { $x = $n; return true; }
            return false;
        }
        if (!is_array($x)) return false;
        $hit = false;
        foreach ($x as $k => &$v) if ($walk($v, $k)) $hit = true;
        unset($v);
        return $hit;
    };
    foreach ($d as $k => &$v) {
        if (isset($skip[(string)$k])) continue;
        if (in_array($k, ['services', 'blog', 'locations', 'pages'], true) && is_array($v)) {
            foreach ($v as &$item) if (is_array($item) && $walk($item)) $item['updatedAt'] = gmdate('c');   // a real change of what readers see
            unset($item);
        } else $walk($v, $k);
    }
    unset($v);
    return $d;
}
