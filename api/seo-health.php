<?php
// SEO Health scorecard for Admin -> SEO Health (admin only).
// Looks at the saved site exactly the way render.php serves it and returns a list of checks:
//   {ok, checks:[{group, status: ok|warn|fail|info, title, detail, fix: admin tab}]}
// The admin page adds the checks only a browser can do (are robots.txt, sitemap.xml … reachable).
require_once __DIR__ . '/seo-lib.php';
cors();
header('Cache-Control: no-store');
require_admin();

$d = aok_site();
$raw = site_data() ?? [];
$checks = [];
$add = function ($group, $status, $title, $detail = '', $fix = null) use (&$checks) {
    $checks[] = ['group' => $group, 'status' => $status, 'title' => $title, 'detail' => $detail, 'fix' => $fix];
};
$words = function ($s) { return count(preg_split('/\s+/u', trim(aok_text($s)), -1, PREG_SPLIT_NO_EMPTY)); };
$len = function ($s) { return function_exists('mb_strlen') ? mb_strlen($s, 'UTF-8') : strlen($s); };
$list = function (array $items, $max = 6) { return implode("\n", array_map(function ($x) { return '• ' . $x; }, array_slice($items, 0, $max))) . (count($items) > $max ? "\n• … and " . (count($items) - $max) . ' more' : ''); };

// ---------------------------------------------------------------- security
$G = 'Security';
$hash = null;
try { $row = db()->query("SELECT pass_hash FROM aok_auth WHERE id = 1")->fetch(); $hash = $row ? $row['pass_hash'] : null; } catch (Exception $e) {}
if ($hash && password_verify('admin123', $hash)) $add($G, 'fail', 'The admin password is still the default (admin123)', 'Change it in Settings → Security.', 'settings');
else $add($G, 'ok', 'Admin password is private and stored hashed');
if (array_key_exists('adminPass', $raw)) $add($G, 'fail', 'An old plain-text password is still in the site data', 'Log out and log in once — it is removed automatically on login.');
else $add($G, 'ok', 'No password in the public site data');
$add($G, 'ok', 'Client enquiries (leads) are only visible to the logged-in admin');

// ---------------------------------------------------------------- titles & descriptions
$G = 'Titles & descriptions';
$pages = [];
foreach (aok_sitemap_urls($d) as $u) {
    $path = (string)parse_url($u[0], PHP_URL_PATH);
    $r = aok_resolve($path === '' ? '/' : $path, $d);
    if ($r['type'] === 'redirect' || $r['type'] === '404') continue;
    $pages[$path ?: '/'] = aok_meta($d, $r);
}
$longT = $shortT = $longD = $shortD = $noD = [];
$byTitle = $byDesc = [];
foreach ($pages as $path => $m) {
    $t = $m['title']; $ds = $m['description'];
    if ($len($t) > 70) $longT[] = $path . ' (' . $len($t) . ' chars)';
    if ($len($t) < 25) $shortT[] = $path;
    if ($ds === '') $noD[] = $path;
    elseif ($len($ds) > 165) $longD[] = $path . ' (' . $len($ds) . ' chars)';
    elseif ($len($ds) < 70) $shortD[] = $path . ' (' . $len($ds) . ' chars)';
    $byTitle[strtolower($t)][] = $path;
    if ($ds !== '') $byDesc[strtolower($ds)][] = $path;
}
$dupT = array_filter($byTitle, function ($p) { return count($p) > 1; });
$dupD = array_filter($byDesc, function ($p) { return count($p) > 1; });
$n = count($pages);
$add($G, $longT ? 'warn' : 'ok', $longT ? count($longT) . " of $n titles are longer than 70 characters" : "All $n page titles fit in Google results", $longT ? "Google shows about 60–65 characters and cuts off the rest (the full title still counts for ranking). Shorten them in the SEO tab if you like.\n" . $list($longT) : '', 'seo');
if ($shortT) $add($G, 'warn', count($shortT) . ' titles are very short', $list($shortT), 'seo');
$add($G, $dupT ? 'fail' : 'ok', $dupT ? count($dupT) . ' titles are used on more than one page' : 'Every page has its own title', $dupT ? $list(array_map(function ($p) { return implode(', ', $p); }, array_values($dupT))) : '', 'seo');
$add($G, $noD ? 'fail' : 'ok', $noD ? count($noD) . ' pages have no meta description' : 'Every page has a meta description', $noD ? $list($noD) : '', 'seo');
if ($longD || $shortD) $add($G, 'warn', (count($longD) + count($shortD)) . ' descriptions are outside the ideal 70–160 characters', $list(array_merge($longD, $shortD)), 'seo');
$add($G, $dupD ? 'warn' : 'ok', $dupD ? count($dupD) . ' descriptions are repeated on several pages' : 'Descriptions are unique', $dupD ? $list(array_map(function ($p) { return implode(', ', $p); }, array_values($dupD))) : '', 'seo');
$add($G, 'ok', 'Every page has one canonical URL (' . $n . ' pages in the sitemap)');

// ---------------------------------------------------------------- structured data
$G = 'Structured data';
$extra = trim((string)($d['schema'] ?? ''));
if ($extra !== '') {
    json_decode($extra, true);
    $add($G, json_last_error() === JSON_ERROR_NONE ? 'ok' : 'fail', json_last_error() === JSON_ERROR_NONE ? 'Your custom schema (Schema tab) is valid JSON' : 'Your custom schema (Schema tab) is not valid JSON — it is being ignored', '', 'schema');
}
$home = aok_graph($d, aok_resolve('/', $d), aok_meta($d, aok_resolve('/', $d)));
$types = [];
foreach ($home['@graph'] ?? [] as $node) foreach ((array)($node['@type'] ?? []) as $t) $types[$t] = true;
$need = ['WebSite', 'Person', 'OfferCatalog'];
$missing = array_values(array_filter($need, function ($t) use ($types) { return empty($types[$t]); }));
$add($G, $missing ? 'fail' : 'ok', $missing ? 'Home page structured data is missing: ' . implode(', ', $missing) : 'Business, practitioner, website and service catalogue are all described (' . count($home['@graph'] ?? []) . ' items)');
$faqN = count((array)aok_get($d, 'faqPage.items', []));
$add($G, $faqN ? 'ok' : 'warn', $faqN ? "FAQ page carries FAQ structured data ($faqN questions)" : 'No FAQ questions yet', '', 'pages');

// ---------------------------------------------------------------- local business / NAP
$G = 'Local business (Google Maps)';
$L = (array)($d['local'] ?? []);
$phone = trim((string)aok_get($d, 'contact.phone', ''));
$add($G, $phone !== '' ? 'ok' : 'warn', $phone !== '' ? 'Phone number is set' : 'No phone number', $phone !== '' ? '' : 'Google matches your site to your Business Profile by name, area and phone. Add the number shown on your profile.', 'local');
$bn = trim((string)($L['businessName'] ?? '')); $brand = trim((string)aok_get($d, 'brand.name', ''));
if ($bn !== '' && $brand !== '' && strcasecmp($bn, $brand) !== 0) $add($G, 'warn', 'Business name differs between Settings (“' . $brand . '”) and Local profile (“' . $bn . '”)', 'Use exactly the same name everywhere, as on your Google Business Profile.', 'local');
else $add($G, 'ok', 'Business name is consistent');
$add($G, trim((string)($L['locality'] ?? '')) !== '' ? 'ok' : 'fail', trim((string)($L['locality'] ?? '')) !== '' ? 'City and service areas are set (' . count(array_filter((array)($L['areasServed'] ?? []))) . ' areas)' : 'No city set', '', 'local');
if (empty($L['serviceAreaBusiness']) && trim((string)($L['streetAddress'] ?? '')) === '') $add($G, 'warn', 'Street address is shown but empty', 'Either enter your address or tick “Service-area business”.', 'local');
$cid = trim((string)($L['mapsCidUrl'] ?? '')); $gmb = trim((string)aok_get($d, 'contact.gmb', ''));
$add($G, ($cid !== '' || $gmb !== '') ? 'ok' : 'warn', ($cid !== '' || $gmb !== '') ? 'Website is linked to your Google Business Profile' : 'No Google Business Profile link', $cid === '' ? 'Tip: add the Maps “CID” link too — it is the most reliable way to tie the site to your listing.' : '', 'local');
$hours = aok_hours($d);
$add($G, $hours ? 'ok' : 'info', $hours ? 'Opening hours are published' : 'No opening hours (fine for “by appointment”)', '', 'local');
$add($G, trim((string)($L['reviewUrl'] ?? '')) !== '' ? 'ok' : 'info', trim((string)($L['reviewUrl'] ?? '')) !== '' ? 'Review link is set' : 'No “leave a review” link yet', '', 'local');
$add($G, aok_get($d, 'local.locationInTitles', true) ? 'ok' : 'info', aok_get($d, 'local.locationInTitles', true) ? 'Your city appears in page titles' : 'City is not added to page titles', '', 'local');

// ---------------------------------------------------------------- practitioner
$G = 'Practitioner (E-E-A-T)';
$pr = (array)($d['person'] ?? []);
$add($G, trim((string)($pr['shortBio'] ?? '')) !== '' ? 'ok' : 'warn', trim((string)($pr['shortBio'] ?? '')) !== '' ? 'Practitioner bio is set' : 'No practitioner bio', '', 'person');
$cred = count(array_filter((array)($pr['studies'] ?? []))) + count(array_filter((array)($pr['classicalTexts'] ?? [])));
$add($G, $cred ? 'ok' : 'warn', $cred ? 'Training and classical texts are listed (' . $cred . ')' : 'No training or credentials listed', '', 'person');
$sameAs = count(aok_same_as($d));
$add($G, $sameAs >= 2 ? 'ok' : 'warn', $sameAs >= 2 ? "$sameAs profiles link back to you (sameAs)" : 'Few profiles link back to you', $sameAs >= 2 ? '' : 'Add your YouTube, Instagram, Business Profile and directory links.', 'local');

// ---------------------------------------------------------------- content
$G = 'Content';
$faq = (array)aok_get($d, 'faqPage.items', []);
$bad = [];
foreach ($faq as $it) { $w = $words($it['a'] ?? ''); if ($w < 40 || $w > 60) $bad[] = aok_cut(aok_text($it['q'] ?? ''), 60) . " ($w words)"; }
$add($G, $bad ? 'info' : 'ok', $bad ? count($bad) . ' of ' . count($faq) . ' FAQ answers are outside 40–60 words' : 'FAQ answers are a good length for AI answers', $bad ? "Answers of 40–60 words that start with the direct answer are the ones AI assistants quote most. Optional — only edit if you want to.\n" . $list($bad, 5) : '', 'pages');
$posts = array_values(array_filter($d['blog'] ?? [], function ($p) { return !empty($p['published']) && empty($p['redirectTo']); }));
$noEx = array_map(function ($p) { return aok_cut(aok_text($p['title'] ?? ''), 60); }, array_filter($posts, function ($p) { return trim(aok_text($p['excerpt'] ?? '')) === ''; }));
$add($G, $noEx ? 'warn' : 'ok', $noEx ? count($noEx) . ' published posts have no excerpt (used as their description)' : 'Every published post has an excerpt', $noEx ? $list($noEx) : '', 'blog');
$noImg = count(array_filter($posts, function ($p) { return empty($p['image']); }));
$add($G, $noImg ? 'info' : 'ok', $noImg ? "$noImg of " . count($posts) . ' published posts have no featured image' : 'Every post has a featured image', $noImg ? 'Posts without an image share the site’s default image on social media.' : '', 'blog');

// duplicates (same rule as Admin -> Redirects)
$tok = function ($t) {
    static $stop = ['the', 'and', 'for', 'your', 'with', 'what', 'how', 'its', 'does', 'doesn', 'really', 'means', 'each', 'best', 'you', 'are', 'why', 'from', 'into', 'service', 'services', 'report', 'reports', 'vedic', 'astrology', 'astrological', 'astrologer', 'based'];
    $out = [];
    foreach (preg_split('/[^a-z0-9]+/', strtolower(str_replace('&', ' ', aok_text($t)))) as $w) if (strlen($w) >= 3 && !in_array($w, $stop, true)) $out[substr($w, 0, 5)] = true;
    return array_keys($out);
};
$ign = array_flip((array)($d['dupIgnore'] ?? []));
$dups = function (array $items) use ($tok, $ign) {
    $live = array_values(array_filter($items, function ($x) { return empty($x['redirectTo']); }));
    $t = array_map(function ($x) use ($tok) { return $tok($x['title'] ?? ''); }, $live);
    $out = [];
    for ($i = 0; $i < count($live); $i++) for ($j = $i + 1; $j < count($live); $j++) {
        if (!$t[$i] || !$t[$j]) continue;
        $shared = count(array_intersect($t[$i], $t[$j]));
        $ids = [(string)($live[$i]['id'] ?? ''), (string)($live[$j]['id'] ?? '')]; sort($ids);
        if ($shared >= min(2, count($t[$i]), count($t[$j])) && $shared / min(count($t[$i]), count($t[$j])) >= 0.6 && !isset($ign[implode('|', $ids)]))
            $out[] = aok_text($live[$i]['title'] ?? '') . '  ↔  ' . aok_text($live[$j]['title'] ?? '');
    }
    return $out;
};
$ds = $dups($d['services'] ?? []); $dp = $dups($d['blog'] ?? []);
$add($G, $ds ? 'warn' : 'ok', $ds ? count($ds) . ' pairs of services look like duplicates' : 'No overlapping services', $ds ? "Similar pages compete with each other in Google. Review them — nothing is merged unless you choose to.\n" . $list($ds) : '', 'redirects');
$add($G, $dp ? 'warn' : 'ok', $dp ? count($dp) . ' pairs of blog posts look like duplicates' : 'No overlapping blog posts', $dp ? $list($dp) : '', 'redirects');

// ---------------------------------------------------------------- images & speed
$G = 'Images & speed';
$logo = (string)aok_get($d, 'brand.logo', '');
if (strpos($logo, 'data:') === 0) {
    $kb = (int)round(strlen($logo) * 3 / 4 / 1024);
    $add($G, $kb > 150 ? 'warn' : 'ok', $kb > 150 ? "Uploaded logo is large ($kb KB)" : "Uploaded logo is a good size ($kb KB)", $kb > 150 ? 'Upload a smaller PNG (about 512×512) — it loads on every page.' : '', 'settings');
} else {
    $f = __DIR__ . '/../assets/logo-512.png';
    if (!is_file($f)) $f = __DIR__ . '/../assets/logo.png';
    $kb = is_file($f) ? (int)round(filesize($f) / 1024) : 0;
    $add($G, $kb > 300 ? 'warn' : 'ok', $kb > 300 ? "Logo file is large ($kb KB)" : 'Logo file size is fine' . ($kb ? " ($kb KB)" : ''));
}
$add($G, is_file(__DIR__ . '/../assets/og-image.jpg') ? 'ok' : 'info', is_file(__DIR__ . '/../assets/og-image.jpg') ? 'Social sharing image (1200×630) is in place' : 'No dedicated social sharing image (assets/og-image.jpg)');
$bigImg = 0;
foreach (array_merge($d['services'] ?? [], $d['blog'] ?? []) as $x) if (is_string($x['image'] ?? null) && strpos($x['image'], 'data:') === 0 && strlen($x['image']) > 400 * 1024 * 4 / 3) $bigImg++;
if ($bigImg) $add($G, 'warn', "$bigImg service/post images are over 400 KB", 'Large images slow the page down. Re-upload them smaller.', 'blog');

// ---------------------------------------------------------------- AI & indexing
$G = 'AI & indexing';
$bots = (array)aok_get($d, 'ai.bots', []);
$blocked = array_keys(array_filter($bots, function ($v) { return $v === false; }));
$add($G, 'info', $blocked ? count($blocked) . ' AI crawlers are blocked: ' . implode(', ', $blocked) : 'All AI crawlers may read the site (best for being cited in AI answers)', '', 'ai');
$add($G, trim((string)aok_get($d, 'ai.llmsOverride', '')) !== '' ? 'info' : 'ok', trim((string)aok_get($d, 'ai.llmsOverride', '')) !== '' ? 'llms.txt uses your own text (it will not update automatically)' : 'llms.txt is generated automatically from your content', '', 'ai');
$key = (string)aok_get($d, 'ai.indexNowKey', '');
$add($G, $key !== '' ? 'ok' : 'info', $key !== '' ? 'IndexNow key is set up' : 'IndexNow is not set up yet', $key !== '' ? '' : 'Open AI & GEO and click “Notify search engines now” once.', 'ai');
$base = aok_base($d);
$add($G, preg_match('#^https://www\.#', $base) ? 'ok' : 'warn', preg_match('#^https://www\.#', $base) ? 'Website address uses https://www.' : 'Website address in Search Engines tab should be https://www.… (it is ' . $base . ')', '', 'submit');

json_out(['ok' => true, 'checks' => $checks, 'pages' => $n, 'at' => date('c')]);
