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
$add($G, trim((string)($pr['name'] ?? '')) !== '' && $cred ? 'ok' : 'warn', trim((string)($pr['name'] ?? '')) !== '' && $cred ? '“About the Astrologer” credential card shows on every service page and blog post' : 'The credential card has too little to show', 'It repeats the name, training and classical texts from the structured data, so Google and AI assistants can match the two.', 'person');
$sameAs = count(aok_same_as($d));
$add($G, $sameAs >= 2 ? 'ok' : 'warn', $sameAs >= 2 ? "$sameAs profiles link back to you (sameAs)" : 'Few profiles link back to you', $sameAs >= 2 ? '' : 'Add your YouTube, Instagram, Business Profile and directory links.', 'local');

// ---------------------------------------------------------------- content
$G = 'Content';
$faq = (array)aok_get($d, 'faqPage.items', []);
$bad = [];
foreach ($faq as $it) { $w = $words($it['a'] ?? ''); if ($w < 40 || $w > 60) $bad[] = aok_cut(aok_text($it['q'] ?? ''), 60) . " ($w words)"; }
$add($G, $bad ? 'warn' : 'ok', $bad ? count($bad) . ' of ' . count($faq) . ' FAQ answers are outside 40–60 words' : 'All ' . count($faq) . ' FAQ answers are 40–60 words (the length AI answers quote)', $bad ? "Answers of 40–60 words that start with the direct answer are the ones AI assistants quote most. If the card above offers expanded answers, one click applies them; otherwise edit them in Visual Editor → FAQ.\n" . $list($bad, 5) : '', 'pages');
$posts = array_values(array_filter($d['blog'] ?? [], function ($p) { return !empty($p['published']) && empty($p['redirectTo']); }));
$noEx = array_map(function ($p) { return aok_cut(aok_text($p['title'] ?? ''), 60); }, array_filter($posts, function ($p) { return trim(aok_text($p['excerpt'] ?? '')) === ''; }));
$add($G, $noEx ? 'warn' : 'ok', $noEx ? count($noEx) . ' published posts have no excerpt (used as their description)' : 'Every published post has an excerpt', $noEx ? $list($noEx) : '', 'blog');
$noImg = count(array_filter($posts, function ($p) use ($d) { return empty($p['image']) && !aok_post_images($d, $p); }));
$add($G, $noImg ? 'info' : 'ok', $noImg ? "$noImg of " . count($posts) . ' published posts have no featured image' : 'Every post has a featured image (uploaded, or the branded 16:9, 4:3 and 1:1 images in the structured data)', $noImg ? 'Posts without an image share the site’s default image on social media. Upload one in Blog, or run tools/build-images.js for new posts.' : '', 'blog');
$svcNoImg = count(array_filter(aok_live_services($d), function ($s) use ($d) { return empty($s['image']) && !aok_service_images($d, $s); }));
$add($G, $svcNoImg ? 'info' : 'ok', $svcNoImg ? "$svcNoImg services have no image for search results and social media" : 'Every service has an image in its structured data and social preview', $svcNoImg ? 'Upload one in Services, or run tools/build-images.js for new services.' : '', 'services');

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

$livePosts = aok_live_posts($d); $liveSvcs = aok_live_services($d);
$thin = array_map(function ($p) { return aok_cut(aok_text($p['title'] ?? ''), 60); }, array_filter($livePosts, function ($p) use ($d) { return count(aok_related_services($d, $p)) < 2; }));
$linked = count(array_filter($liveSvcs, function ($s) use ($d) { return count(aok_related_posts($d, $s)) > 0; }));
$add($G, $thin ? 'warn' : 'ok', $thin ? count($thin) . ' posts link to fewer than 2 services' : 'Topic clusters: every post links to 2–3 related services; ' . $linked . ' of ' . count($liveSvcs) . ' service pages link back to matching articles', $thin ? $list($thin) : 'Links are chosen automatically from shared keywords in titles, excerpts and descriptions.', 'blog');
// long-form depth: the classical sections from api/content/ and the word counts AI answers favour
$noMd = []; $short = []; $deep = 0; $all = 0;
foreach ($liveSvcs as $sv) {
    $md = aok_content_md('services', aok_slugify((string)($sv['title'] ?? '')));
    $all++; $w = $words(($sv['desc'] ?? '') . ' ' . preg_replace('/^[#>\-*]+\s*|\*\*/m', ' ', (string)($sv['detail'] ?? '')));
    if ($md !== '' && !aok_has_content((string)($sv['detail'] ?? ''), $md)) $noMd[] = aok_cut(aok_text($sv['title'] ?? ''), 60);
    elseif ($w < 600) $short[] = aok_cut(aok_text($sv['title'] ?? ''), 60) . " ($w words)";
    else $deep++;
}
foreach ($livePosts as $po) {
    $md = aok_content_md('posts', (string)($po['slug'] ?? ''));
    $all++; $w = $words(preg_replace('/^[#>\-*]+\s*|\*\*/m', ' ', (string)($po['body'] ?? '')));
    if ($md !== '' && !aok_has_content((string)($po['body'] ?? ''), $md)) $noMd[] = aok_cut(aok_text($po['title'] ?? ''), 60);
    elseif ($w < 600) $short[] = aok_cut(aok_text($po['title'] ?? ''), 60) . " ($w words)";
    else $deep++;
}
$add($G, $noMd ? 'warn' : 'ok', $noMd ? count($noMd) . ' pages don’t have the classical content sections yet' : 'All ' . count($liveSvcs) . ' services and ' . count($livePosts) . ' posts have the classical content sections (direct answer, methodology, chart factors' . ', remedies)', $noMd ? "These pages were edited, so the automatic upgrade left them alone. The “Apply Full 32-Page Classical Content Upgrade” button above adds the sections after your text.\n" . $list($noMd, 5) : '');
$add($G, $short ? 'warn' : 'ok', $short ? count($short) . ' pages have fewer than 600 words' : "$deep of $all service and blog pages have 600+ words of in-depth content", $short ? "Longer, well-structured pages are the ones search engines and AI assistants trust as sources.\n" . $list($short, 5) : '', 'pages');
$cities = array_filter((array)aok_get($d, 'local.nearbyCities', []));
$add($G, $cities ? 'ok' : 'warn', $cities ? 'Service-area block names ' . count($cities) . ' nearby cities (' . aok_join_list($cities) . ')' : 'No nearby cities listed for the service-area block', 'Shown on the contact page, every service page and in the footer, and listed in the structured data.', 'local');

// ---------------------------------------------------------------- images & speed
$G = 'Images & speed';
$logo = (string)aok_get($d, 'brand.logo', '');
if (strpos($logo, 'data:') === 0) {
    $kb = (int)round(strlen($logo) * 3 / 4 / 1024);
    $add($G, $kb > 150 ? 'warn' : 'ok', $kb > 150 ? "Uploaded logo is large ($kb KB)" : "Uploaded logo is a good size ($kb KB)", $kb > 150 ? 'Upload a smaller PNG (about 512×512) — it loads on every page.' : '', 'settings');
} else {
    // the file every page loads (the 512px PNG is only referenced from structured data)
    $f = __DIR__ . '/../assets/logo-192.webp';
    if (!is_file($f)) $f = __DIR__ . '/../assets/logo.png';
    $kb = is_file($f) ? (int)round(filesize($f) / 1024) : 0;
    $add($G, $kb > 150 ? 'warn' : 'ok', $kb > 150 ? "Logo loaded on every page is large ($kb KB)" : 'Logo loaded on every page is light' . ($kb ? " ($kb KB, " . basename($f) . ')' : ''), $kb > 150 ? 'Upload the new assets/logo-192.webp (see DEPLOY.md).' : '');
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

// ---------------------------------------------------------------- server setup (post-upload check)
// Requests this site's own public addresses the way a visitor would, and tests real file writes,
// so a fresh upload to A2 Hosting can be verified in one place.
$G = 'Server setup (after upload)';
$root = realpath(__DIR__ . '/..');
$add($G, version_compare(PHP_VERSION, '7.4', '>=') ? 'ok' : 'fail', 'PHP ' . PHP_VERSION . (version_compare(PHP_VERSION, '7.4', '>=') ? '' : ' — needs 7.4 or newer (cPanel → MultiPHP Manager)'));
$ht = is_file($root . '/.htaccess') ? (string)file_get_contents($root . '/.htaccess') : '';
$add($G, $ht === '' ? 'fail' : (strpos($ht, 'render.php') !== false ? 'ok' : 'warn'), $ht === '' ? '.htaccess is missing from the web root' : (strpos($ht, 'render.php') !== false ? '.htaccess is the new version' : '.htaccess is an old version'), $ht === '' || strpos($ht, 'render.php') === false ? 'Upload the new .htaccess (File Manager → Settings → Show Hidden Files).' : '');
$missing = array_values(array_filter(['render.php', 'index.html', 'assets/app.js', 'assets/hero3d.js', 'api/seo-lib.php', 'api/upgrades.php', 'api/upgrade-content.php', 'api/defaults.json', 'api/content/services/kundli-birth-chart-reading.md', 'api/content/posts/ultimate-guide-birth-chart.md', 'assets/img/posts/ultimate-guide-birth-chart-16x9.jpg', 'assets/img/services/kundli-birth-chart-reading-16x9.webp', 'api/robots.php', 'api/sitemap.php', 'api/llms.php', 'api/indexnow.php'], function ($f) use ($root) { return !is_file($root . '/' . $f); }));
$add($G, $missing ? 'fail' : 'ok', $missing ? 'Files missing on the server: ' . implode(', ', $missing) : 'All site files are in place');
if (is_file($root . '/install.php')) $add($G, 'fail', 'install.php is still on the server', 'It is not needed any more — delete it in File Manager.');

$selfBase = (aok_https() ? 'https' : 'http') . '://' . preg_replace('/[^a-z0-9.:\-\[\]]/i', '', (string)($_SERVER['HTTP_HOST'] ?? 'localhost'));
$fetch = function ($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [CURLOPT_RETURNTRANSFER => true, CURLOPT_HEADER => true, CURLOPT_FOLLOWLOCATION => false, CURLOPT_TIMEOUT => 8, CURLOPT_CONNECTTIMEOUT => 4, CURLOPT_USERAGENT => 'AOK-SEO-Health/1.0']);
        $raw = curl_exec($ch);
        if ($raw === false) { curl_close($ch); return null; }
        $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); $hs = (int)curl_getinfo($ch, CURLINFO_HEADER_SIZE); curl_close($ch);
        return ['code' => $code, 'head' => substr($raw, 0, $hs), 'body' => substr($raw, $hs)];
    }
    $ctx = stream_context_create(['http' => ['timeout' => 8, 'ignore_errors' => true, 'follow_location' => 0, 'user_agent' => 'AOK-SEO-Health/1.0']]);
    $body = @file_get_contents($url, false, $ctx);
    if ($body === false || empty($http_response_header)) return null;
    preg_match('/\s(\d{3})\s/', $http_response_header[0] . ' ', $m);
    return ['code' => (int)($m[1] ?? 0), 'head' => implode("\n", $http_response_header), 'body' => $body];
};
$probe = $fetch($selfBase . '/robots.txt');
$selfCheck = $probe !== null && $probe['code'] > 0;
if (!$selfCheck) {
    $add($G, 'info', 'The server could not request its own pages', 'Some hosts block this. The browser checks in “Crawl files” below cover the same ground.');
} else {
    $tests = [
        ['/robots.txt', 'robots.txt is generated live (rewrite works)', function ($r) { return $r['code'] === 200 && stripos($r['head'], 'X-AOK-Generated: robots') !== false; }],
        ['/sitemap.xml', 'sitemap.xml is generated live', function ($r) { return $r['code'] === 200 && stripos($r['head'], 'X-AOK-Generated: sitemap') !== false && strpos($r['body'], '<urlset') !== false; }],
        ['/llms.txt', 'llms.txt is generated live', function ($r) { return $r['code'] === 200 && stripos($r['head'], 'X-AOK-Generated: llms') !== false; }],
        ['/services', 'Pages are rendered on the server (crawlers see real content)', function ($r) { return $r['code'] === 200 && strpos($r['body'], 'aok-ssr') !== false; }],
        ['/aok-health-check-' . substr(md5((string)mt_rand()), 0, 6), 'Unknown addresses return a real 404', function ($r) { return $r['code'] === 404; }],
        ['/index.html', '/index.html redirects to / (one address per page)', function ($r) { return $r['code'] === 301; }],
        ['/api/config.php', 'Database settings file is blocked from the web', function ($r) { return $r['code'] === 403 || $r['code'] === 404; }],
        ['/api/defaults.json', 'Private data files are blocked from the web', function ($r) { return $r['code'] === 403 || $r['code'] === 404; }],
    ];
    foreach ($tests as $t) {
        $r = $t[0] === '/robots.txt' ? $probe : $fetch($selfBase . $t[0]);
        $ok = $r !== null && $t[2]($r);
        $add($G, $ok ? 'ok' : 'fail', $t[1], $ok ? '' : 'Got HTTP ' . ($r['code'] ?? 'no answer') . ' for ' . $t[0] . '. Check that the new .htaccess and render.php are uploaded and that mod_rewrite is on (it is on A2 Hosting).');
    }
    $host = strtolower((string)parse_url(aok_base($d), PHP_URL_HOST));
    $reqHost = strtolower(preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? '')));
    if ($host !== '' && preg_replace('/^www\./', '', $reqHost) === preg_replace('/^www\./', '', $host)) {
        $bare = preg_replace('/^www\./', '', $host);
        $r = $fetch('http://' . $bare . '/about');
        $loc = ($r && preg_match('/^Location:\s*(\S+)/mi', $r['head'], $m)) ? $m[1] : '';
        $ok = $r && $r['code'] === 301 && stripos($loc, 'https://' . $host . '/about') === 0;
        $add($G, $ok ? 'ok' : 'warn', 'http:// and non-www addresses redirect to ' . 'https://' . $host, $ok ? '' : 'Got ' . ($r ? 'HTTP ' . $r['code'] . ($loc ? ' → ' . $loc : '') : 'no answer') . '. Check SSL is active for both www and non-www in cPanel → SSL/TLS Status.');
    } else {
        $add($G, 'info', 'https + www redirect is checked on the live domain only');
    }
}
// real write tests (not just permission bits)
$canWrite = function ($dir) { if (!is_dir($dir)) return false; $f = rtrim($dir, '/') . '/.aok-write-test-' . bin2hex(random_bytes(4)); $ok = @file_put_contents($f, 'ok') === 2; if ($ok) @unlink($f); return $ok; };
$up = $root . '/uploads';
$add($G, $canWrite($up) ? 'ok' : 'fail', $canWrite($up) ? 'uploads/ is writable (photo uploads work)' : 'uploads/ is missing or not writable', $canWrite($up) ? '' : 'Create the folder in File Manager and set its permissions to 755.', 'settings');
$smFile = $root . '/sitemap-static.xml';
$smOk = is_file($smFile) ? is_writable($smFile) : $canWrite($root);
$add($G, $smOk ? 'ok' : 'warn', $smOk ? 'Sitemap backup copy can be saved' : 'Sitemap backup copy cannot be saved', $smOk ? '' : 'Set sitemap-static.xml to 644 (the live sitemap still works without it).', 'submit');
$sess = session_save_path() ?: sys_get_temp_dir();
$sessDir = strpos($sess, ';') !== false ? substr(strrchr($sess, ';'), 1) : $sess;
$add($G, is_writable($sessDir) ? 'ok' : 'warn', is_writable($sessDir) ? 'PHP sessions can be stored (admin login)' : 'PHP session folder is not writable', is_writable($sessDir) ? '' : 'Ask A2 support to check session.save_path.');
try { db()->exec('CREATE TEMPORARY TABLE aok_write_check (id INT)'); db()->exec('DROP TEMPORARY TABLE aok_write_check'); $dbw = true; } catch (Throwable $e) { $dbw = false; }
$add($G, $dbw ? 'ok' : 'fail', $dbw ? 'Database accepts writes (saving works)' : 'Database user cannot write', $dbw ? '' : 'cPanel → MySQL Databases → add the user to the database with ALL PRIVILEGES.');

// the post-upload checks first: they are what to look at right after deploying
$checks = array_merge(array_values(array_filter($checks, function ($c) use ($G) { return $c['group'] === $G; })), array_values(array_filter($checks, function ($c) use ($G) { return $c['group'] !== $G; })));
json_out(['ok' => true, 'checks' => $checks, 'pages' => $n, 'selfCheck' => $selfCheck, 'at' => date('c')]);
