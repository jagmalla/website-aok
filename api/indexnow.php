<?php
// IndexNow (Bing, Yandex, Seznam, Naver … and the AI search tools built on them):
// tells those engines straight away which pages changed, instead of waiting for a re-crawl.
//   GET  /<key>.txt  (via .htaccess -> ?key=<key>)  -> prints the key, proving the site owns it
//   POST /api/indexnow.php   (admin + CSRF)          -> creates the key if needed, then submits
//                                                      every sitemap URL. Returns {ok, key, status, count}
require_once __DIR__ . '/sync.php';   // aok_indexnow_submit, aok_indexnow_host_ok

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $key = (string)aok_get(aok_site(), 'ai.indexNowKey', '');
    if ($key === '' || !hash_equals($key, (string)($_GET['key'] ?? ''))) {
        http_response_code(404);
        header('Content-Type: text/plain; charset=utf-8');
        echo "Not found\n";
        exit;
    }
    header('Content-Type: text/plain; charset=utf-8');
    echo $key;
    exit;
}

cors();
header('Cache-Control: no-store');
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);
require_admin();

// The key lives in the saved site data (ai.indexNowKey) so the editor shows it and /<key>.txt can answer.
$raw = site_data() ?? [];
$key = (string)($raw['ai']['indexNowKey'] ?? '');
if (!preg_match('/^[a-f0-9]{32}$/', $key)) {
    $key = bin2hex(random_bytes(16));
    if (!isset($raw['ai']) || !is_array($raw['ai'])) $raw['ai'] = [];
    $raw['ai']['indexNowKey'] = $key;
    $body = json_encode($raw, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    db()->prepare("INSERT INTO aok_site_data (id, payload, updated_at) VALUES (1, :p1, NOW())
                   ON DUPLICATE KEY UPDATE payload = :p2, updated_at = NOW()")
        ->execute([':p1' => $body, ':p2' => $body]);
}

$d = aok_site();
$base = aok_base($d);
$host = parse_url($base, PHP_URL_HOST);
$urls = array_map(function ($u) { return $u[0]; }, aok_sitemap_urls($d));

// Engines reject submissions for hosts that are not the site's own (e.g. a local test copy)
if (!aok_indexnow_host_ok($base)) json_out(['ok' => true, 'key' => $key, 'skipped' => 'not_production_host', 'count' => count($urls)]);
['status' => $status, 'error' => $err, 'body' => $body] = aok_indexnow_submit($urls, $key, $base);
try { aok_indexnow_table(); db()->exec("UPDATE aok_indexnow_queue SET sent_at = NOW()"); } catch (Throwable $e) {}   // everything was just sent

// 200 = accepted, 202 = accepted (key check pending); anything else is reported back to the admin
json_out(['ok' => $status === 200 || $status === 202, 'key' => $key, 'status' => $status, 'error' => $err, 'body' => $body, 'count' => count($urls)]);
