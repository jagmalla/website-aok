<?php
// /llms.txt and /llms-full.txt (see .htaccess): a clean Markdown profile of the business for AI assistants
// (ChatGPT, Claude, Perplexity …), generated from the site content. Admin -> AI & GEO can replace either
// file with hand-written text.
require_once __DIR__ . '/seo-lib.php';

$d = aok_site();
$full = !empty($_GET['full']);
header('Content-Type: text/plain; charset=utf-8');

$override = trim((string)aok_get($d, $full ? 'ai.llmsFullOverride' : 'ai.llmsOverride', ''));
if ($override !== '') { echo $override . "\n"; exit; }

$base = aok_base($d);
$brand = aok_brand($d);
$T = function ($v) { return trim(preg_replace('/[ \t]+/', ' ', aok_text($v))); };
$list = function ($items) use ($T) { $o = ''; foreach ((array)$items as $x) if (($x = $T($x)) !== '') $o .= "- $x\n"; return $o; };
$slugs = aok_service_slugs($d['services'] ?? []);
$services = array_values(array_filter($d['services'] ?? [], function ($s) { return empty($s['redirectTo']); }));
$fee = $T(aok_get($d, 'about.pricing.fee', '$100 CAD')) . ' ' . $T(aok_get($d, 'about.pricing.unit', 'per hour'));
$channels = implode(' & ', (array)aok_get($d, 'local.onlineChannels', ['Zoom', 'WhatsApp']));
$person = aok_get($d, 'person.name', 'Jag Mallah');

$o  = "# $brand\n\n";
$o .= '> ' . $T(aok_get($d, 'seo.home.metaDescription', aok_get($d, 'brand.tagline', ''))) . "\n\n";
$o .= $T(aok_get($d, 'person.shortBio', '')) . "\n\n";
$o .= "- Website: $base\n";
$o .= '- Practitioner: ' . $person . ' — ' . aok_get($d, 'person.jobTitle', 'Vedic Astrologer') . "\n";
$o .= '- Location: ' . aok_get($d, 'local.locality', 'Surrey') . ', ' . aok_get($d, 'local.region', 'British Columbia') . ', Canada'
    . (aok_get($d, 'local.serviceAreaBusiness', true) ? ' (service-area business; no walk-in office)' : '') . "\n";
$o .= '- Areas served: ' . implode(', ', array_filter((array)aok_get($d, 'local.areasServed', []))) . (aok_get($d, 'local.onlineWorldwide', true) ? "; worldwide online via $channels" : '') . "\n";
$o .= '- Languages: ' . implode(', ', (array)aok_get($d, 'local.languages', ['English', 'Hindi'])) . "\n";
$o .= "- Consultation fee: $fee ($channels calls)\n";
if ($pol = $T(aok_get($d, 'local.paymentPolicy', ''))) $o .= "- Payment policy: $pol\n";
if ($ph = trim((string)aok_get($d, 'contact.phone', ''))) $o .= "- Phone: $ph\n";
if ($em = trim((string)aok_get($d, 'contact.email', ''))) $o .= "- Email: $em\n";
$o .= "- Book or ask a question: $base/contact\n\n";

$o .= "## Practitioner credentials\n\n";
if ($m = trim((string)aok_get($d, 'person.mentor', ''))) $o .= "- Trained under: $m\n";
if ($x = array_filter((array)aok_get($d, 'person.studies', []))) $o .= '- Formal studies: ' . implode('; ', $x) . "\n";
if ($x = array_filter((array)aok_get($d, 'person.classicalTexts', []))) $o .= '- Classical texts researched: ' . implode('; ', $x) . "\n";
if ($x = array_filter((array)aok_get($d, 'person.knowsAbout', []))) $o .= '- Areas of expertise: ' . implode('; ', $x) . "\n";
$o .= "- About page: $base/about\n\n";

$o .= "## Services\n\n";
foreach ($services as $s) {
    $o .= '- [' . $T($s['title'] ?? '') . "]($base/services/" . $slugs[(string)($s['id'] ?? '')] . '): ' . $T($s['desc'] ?? '') . (!empty($s['price']) ? ' (' . $T($s['price']) . ')' : '') . "\n";
    if ($full && !empty($s['detail'])) $o .= '  ' . str_replace("\n", "\n  ", $T($s['detail'])) . "\n";
}

$o .= "\n## How booking works\n\n";
foreach ((array)aok_get($d, 'about.process.steps', []) as $i => $st) $o .= ($i + 1) . '. ' . $T($st['t'] ?? '') . ' — ' . $T($st['d'] ?? '') . "\n";
$o .= "\n## Pricing\n\n" . $T(aok_get($d, 'about.pricing.body', '')) . "\n";

$o .= "\n## Honesty, boundaries and privacy\n\n" . $T(aok_get($d, 'about.boundaries.intro', '')) . "\n\nWhat the astrologer can do:\n" . $list(aok_get($d, 'about.boundaries.can', []))
    . "\nWhat the astrologer cannot do:\n" . $list(aok_get($d, 'about.boundaries.cannot', [])) . "\nPrivacy:\n";
foreach ((array)aok_get($d, 'about.privacy.points', []) as $p) $o .= '- ' . $T($p['t'] ?? '') . ': ' . $T($p['d'] ?? '') . "\n";
$o .= "\nDisclaimer: " . $T(aok_get($d, 'disclaimer', '')) . "\n";

$o .= "\n## Key pages\n\n";
foreach ([['', 'Home'], ['about', 'About'], ['services', 'Services'], ['meditation', 'Meditation'], ['faq', 'FAQ'], ['blog', 'Blog'], ['contact', 'Contact']] as $p) {
    $r = $p[0] === '' ? 'home' : $p[0];
    $o .= "- [{$p[1]}]($base/{$p[0]}): " . $T(aok_get($d, 'seo.' . $r . '.metaDescription', '')) . "\n";
}

if ($full) {
    $o .= "\n## About " . $person . "\n\n" . $T(aok_get($d, 'about.hero.sub', '')) . "\n\n" . $T(aok_get($d, 'about.story.body', '')) . "\n";
    $o .= "\n## Meditation\n\n" . $T(aok_get($d, 'meditation.intro.body', '')) . "\n\n";
    foreach ((array)aok_get($d, 'meditation.offerings', []) as $x) $o .= '- ' . $T($x['t'] ?? '') . ': ' . $T($x['d'] ?? '') . "\n";
}

$o .= "\n## Frequently asked questions\n\n";
foreach ((array)aok_get($d, 'faqPage.items', []) as $it) {
    $o .= $full ? '### ' . $T($it['q'] ?? '') . "\n\n" . $T($it['a'] ?? '') . "\n\n" : '- ' . $T($it['q'] ?? '') . "\n";
}
if (!$full) $o .= "\nFull answers: $base/faq\n";

$o .= "\n## " . ($full ? 'Articles' : 'Optional: articles') . "\n\n";
foreach ($d['blog'] ?? [] as $p) {
    if (empty($p['published']) || empty($p['slug']) || !empty($p['redirectTo'])) continue;
    $url = $base . '/blog/' . rawurlencode($p['slug']);
    if ($full) $o .= '### ' . $T($p['title'] ?? '') . "\n\n$url" . (!empty($p['date']) ? ' · ' . substr($p['date'], 0, 10) : '') . "\n\n" . $T($p['body'] ?? '') . "\n\n";
    else $o .= '- [' . $T($p['title'] ?? '') . "]($url): " . $T($p['excerpt'] ?? '') . "\n";
}
if (!$full) $o .= "\nEverything above in one file, with full answers and articles: $base/llms-full.txt\n";

echo $o;
