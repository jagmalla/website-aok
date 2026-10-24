<?php
// Generators for the discovery files: robots.txt, sitemap.xml, llms.txt and llms-full.txt. Used by the live
// endpoints (api/robots.php, api/sitemap.php, api/llms.php), by the static backups written after every save
// (aok_write_static_files, called from api/data.php) and by tools/build-static.php.
require_once __DIR__ . '/seo-lib.php';

function aok_robots_text(array $d): string {
$base = aok_base($d);
    $bots = (array)aok_get($d, 'ai.bots', []);
    $t  = "# robots.txt for " . aok_brand($d) . " — generated from Admin > AI & GEO\n\n";
    // A crawler with its own group ignores the "*" group, so every allowed group repeats the rules.
    // /api/ is private, except /api/data.php: Google's renderer loads it to show the live content
    // (the longer, more specific Allow wins for Google and Bing).
    $rules = "Allow: /\nAllow: /api/data.php\nDisallow: /api/\nDisallow: /admin\n";
    $t .= "User-agent: *\n" . $rules . "\n";
    $t .= "# Search engines\n";
    foreach (['Googlebot', 'Bingbot'] as $name) $t .= "User-agent: $name\n" . $rules . "\n";
    $t .= "# AI search & assistant crawlers (Admin > AI & GEO)\n";
    foreach ($bots as $name => $on) {
        if (!preg_match('/^[A-Za-z0-9._-]+$/', (string)$name)) continue;
        $t .= "User-agent: $name\n" . ($on ? $rules : "Disallow: /\n") . "\n";
    }
    $t .= "# Plain-language summary of this business for AI assistants: $base/llms.txt\n";
    $t .= "Sitemap: $base/sitemap.xml\n";
    return $t;
}

function aok_sitemap_xml(array $d): string {
    $xml = '<?xml version="1.0" encoding="UTF-8"?>' . "\n" . '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' . "\n";
    foreach (aok_sitemap_urls($d) as $u) {
        $xml .= "  <url>\n    <loc>" . htmlspecialchars($u[0], ENT_XML1) . "</loc>\n    <lastmod>" . htmlspecialchars($u[1], ENT_XML1)
              . "</lastmod>\n    <changefreq>" . $u[2] . "</changefreq>\n  </url>\n";
    }
    return $xml . "</urlset>\n";
}

// A service page's light Markdown as plain text for AI readers (headings and lists kept, ** removed)
function aok_llms_md(string $md): string {
    $t = preg_replace('/\*\*(.+?)\*\*/s', '$1', str_replace("\r", '', trim($md)));
    $t = html_entity_decode(strip_tags(preg_replace('/^>\s?/m', '', $t)), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return trim(preg_replace("/\n{3,}/", "\n\n", $t));
}

function aok_llms_text(array $d, bool $full): string {
    $override = trim((string)aok_get($d, $full ? 'ai.llmsFullOverride' : 'ai.llmsOverride', ''));
    if ($override !== '') return $override . "\n";
    $base = aok_base($d);
    $brand = aok_brand($d);
    $T = function ($v) { return trim(preg_replace('/[ \t]+/', ' ', aok_text($v))); };
    $list = function ($items) use ($T) { $o = ''; foreach ((array)$items as $x) if (($x = $T($x)) !== '') $o .= "- $x\n"; return $o; };
    $slugs = aok_service_slugs($d['services'] ?? []);
    $services = aok_live_services($d);
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
    $o .= "- Book or ask a question: $base/contact\n\n";
    
    $o .= "## Practitioner credentials\n\n";
    if ($m = trim((string)aok_get($d, 'person.mentor', ''))) $o .= "- Trained under: $m\n";
    if ($x = array_filter((array)aok_get($d, 'person.studies', []))) $o .= '- Formal studies: ' . implode('; ', $x) . "\n";
    if ($x = array_filter((array)aok_get($d, 'person.classicalTexts', []))) $o .= '- Classical texts researched: ' . implode('; ', $x) . "\n";
    if ($x = array_filter((array)aok_get($d, 'person.knowsAbout', []))) $o .= '- Areas of expertise: ' . implode('; ', $x) . "\n";
    $o .= "- About page: $base/about\n\n";
    
    $o .= "## Services\n\n";
    $len = $T(aok_get($d, 'local.sessionLength', '60 minutes'));
    foreach ($services as $s) {
        $url = "$base/services/" . $slugs[(string)($s['id'] ?? '')];
        $price = $T(($s['price'] ?? '') !== '' ? $s['price'] : aok_get($d, 'about.pricing.fee', '$100 CAD')) . ' ' . $T(($s['priceUnit'] ?? '') !== '' ? $s['priceUnit'] : aok_get($d, 'about.pricing.unit', 'per hour'));
        // booking parameters for agents: fee, session, format, how to book
        $line = $T($s['desc'] ?? '') . " Fee: $price. Session: $len, live by $channels. Book: $url#book";
        if ($full) $o .= '### ' . $T($s['title'] ?? '') . "\n\n$url\n\n$line\n\n" . (!empty($s['detail']) ? preg_replace('/^(#{2,3}) /m', '##$1 ', aok_llms_md($s['detail'])) . "\n\n" : '');
        else $o .= '- [' . $T($s['title'] ?? '') . "]($url): $line\n";
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
    return $o;
}

// After a save: refresh the static copies in the web root, so servers that still serve the files directly
// (an older .htaccess) stay in sync too. Silently skipped when the files can't be written.
function aok_write_static_files(array $d): array {
    $root = dirname(__DIR__); $done = [];
    $files = ['sitemap.xml' => aok_sitemap_xml($d), 'llms.txt' => aok_llms_text($d, false), 'llms-full.txt' => aok_llms_text($d, true), 'robots.txt' => aok_robots_text($d)];
    foreach ($files as $name => $text) {
        $f = $root . '/' . $name;
        if (strlen($text) < 100 || (is_file($f) && !is_writable($f)) || (!is_file($f) && !is_writable($root))) continue;
        if (!is_file($f) || (string)file_get_contents($f) !== $text) { if (@file_put_contents($f, $text, LOCK_EX) !== false) $done[] = $name; }
    }
    return $done;
}
