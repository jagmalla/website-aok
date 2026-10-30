<?php
if (realpath((string)($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) { http_response_code(403); exit; }   // a library: never run on its own
// Runs on every admin save (api/data.php). Keeps services, addresses and search engines in step with the edit:
//   - each changed service gets a fresh updatedAt (the sitemap's <lastmod>);
//   - a service whose address changed, or that was deleted, leaves a 301 behind, so no URL ever 404s;
//   - a deleted shipped service stays deleted (deletedSeeds), instead of being added back as a default;
//   - the changed addresses are queued for IndexNow (Bing, Yandex … and the AI search built on them),
//     sent at most every 10 minutes, after the response has gone out (aok_indexnow_flush).
// The editor merges what this returns (aok_sync_patch) into its own copy, so the next autosave keeps it.
require_once __DIR__ . '/seo-lib.php';

const AOK_INDEXNOW_EVERY = 600;   // seconds between IndexNow submissions

function aok_save_sync(?array $old, array &$new): array {
    if (!is_array($old) || !isset($new['services']) || !is_array($new['services'])) return [];
    $oldS = []; foreach ($old['services'] ?? [] as $s) if (!empty($s['id'])) $oldS[$s['id']] = $s;
    $newS = []; foreach ($new['services'] as $s) if (!empty($s['id'])) $newS[$s['id']] = $s;
    $oldSlug = aok_service_slugs($old['services'] ?? []); $newSlug = aok_service_slugs($new['services']);
    $sig = function ($s) { unset($s['updatedAt']); return json_encode($s); };
    $now = gmdate('c'); $changed = [];
    foreach ($new['services'] as $i => $s) {
        $id = $s['id'] ?? ''; $o = $oldS[$id] ?? null;
        if ($o !== null && !empty($o['banner']) && empty($s['banner'])) $s = $new['services'][$i] = ['banner' => $o['banner']] + $s;   // set by the server: an editor copy that hasn't caught up keeps it
        if ($o !== null && $sig($o) === $sig($s)) continue;
        $new['services'][$i]['updatedAt'] = $now;
        $changed[] = '/services/' . $newSlug[$id];
        if ($o !== null && $oldSlug[$id] !== $newSlug[$id]) {
            $changed[] = '/services/' . $oldSlug[$id];
            // its 3D banner file is named after the old address: remember it, so the picture survives the move
            if (empty($s['banner']) && is_file(dirname(__DIR__) . '/assets/img/services/' . $oldSlug[$id] . '-16x9.jpg')) $new['services'][$i]['banner'] = $oldSlug[$id];
        }
    }
    $reds = (isset($new['redirects']) && is_array($new['redirects'])) ? array_values($new['redirects']) : [];
    $key = function ($p) { return strtolower('/' . trim((string)$p, '/')); };
    $add = function ($from, $to) use (&$reds, $key) {
        if ($key($from) === $key($to)) return;
        foreach ($reds as $r) if ($key($r['from'] ?? '') === $key($from)) return;   // the admin's own choice wins
        $reds[] = ['from' => $from, 'to' => $to, 'auto' => true];
    };
    // a live service that moved to a new address: the old one forwards
    foreach ($newS as $id => $s) {
        if (!isset($oldS[$id]) || $oldSlug[$id] === $newSlug[$id] || !aok_service_is_live($oldS[$id])) continue;
        $add('/services/' . $oldSlug[$id], aok_service_is_live($s) ? '/services/' . $newSlug[$id] : (string)($s['redirectTo'] ?? '/services'));
    }
    // a deleted service: its address forwards to /services (unless the admin chose another page when deleting)
    foreach ($oldS as $id => $o) {
        if (isset($newS[$id])) continue;
        if (aok_service_is_live($o)) { $add('/services/' . $oldSlug[$id], '/services'); $changed[] = '/services/' . $oldSlug[$id]; }
        if (!empty($o['seedKey'])) { $ds = (array)($new['deletedSeeds'] ?? []); if (!in_array($o['seedKey'], $ds, true)) $ds[] = $o['seedKey']; $new['deletedSeeds'] = array_values($ds); }
    }
    // a redirect never points at an address that itself forwards (one hop, no chains)
    $map = []; foreach ($reds as $r) $map[$key($r['from'] ?? '')] = (string)($r['to'] ?? '');
    foreach ($reds as $k => $r) { $to = (string)($r['to'] ?? ''); $seen = 0; while (isset($map[$key($to)]) && $seen++ < 5 && $key($map[$key($to)]) !== $key($r['from'] ?? '')) $to = $map[$key($to)]; $reds[$k]['to'] = $to; }
    $new['redirects'] = $reds;
    return array_values(array_unique($changed));
}

// What the editor merges back into its copy after a save
function aok_sync_patch(array $d): array {
    $up = []; $bn = [];
    foreach ($d['services'] ?? [] as $s) { if (!empty($s['id']) && !empty($s['updatedAt'])) $up[$s['id']] = $s['updatedAt']; if (!empty($s['id']) && !empty($s['banner'])) $bn[$s['id']] = $s['banner']; }
    return ['redirects' => array_values((array)($d['redirects'] ?? [])), 'deletedSeeds' => array_values((array)($d['deletedSeeds'] ?? [])), 'updatedAt' => (object)$up, 'banner' => (object)$bn];
}

// ---------------------------------------------------------------- IndexNow queue ----
function aok_indexnow_table(): void {
    db()->exec("CREATE TABLE IF NOT EXISTS aok_indexnow_queue (url VARCHAR(500) PRIMARY KEY, changed_at DATETIME NOT NULL, sent_at DATETIME NULL) DEFAULT CHARSET=utf8mb4");
}
function aok_indexnow_queue(array $paths, string $base): void {
    if (!$paths) return;
    aok_indexnow_table();
    $st = db()->prepare("INSERT INTO aok_indexnow_queue (url, changed_at) VALUES (:u, NOW()) ON DUPLICATE KEY UPDATE changed_at = NOW()");
    foreach ($paths as $p) $st->execute([':u' => substr($base . $p, 0, 500)]);
}

// The engines only accept submissions from the site's own address (a test copy is skipped)
function aok_indexnow_host_ok(string $base): bool {
    $host = strtolower((string)parse_url($base, PHP_URL_HOST));
    $req = strtolower(preg_replace('/:\d+$/', '', (string)($_SERVER['HTTP_HOST'] ?? '')));
    return $req !== '' && ($req === $host || 'www.' . $req === $host || $req === 'www.' . $host);
}

function aok_indexnow_submit(array $urls, string $key, string $base): array {
    $payload = json_encode(['host' => parse_url($base, PHP_URL_HOST), 'key' => $key, 'keyLocation' => $base . '/' . $key . '.txt', 'urlList' => array_values($urls)], JSON_UNESCAPED_SLASHES);
    // A real User-Agent: Bing's IndexNow front door answers 403 to requests that don't send one.
    $ua = 'Mozilla/5.0 (compatible; AnalysisOfKarma-IndexNow/1.0; +' . $base . '/)';
    $status = 0; $err = ''; $body = '';
    if (function_exists('curl_init')) {
        $ch = curl_init('https://api.indexnow.org/indexnow');
        curl_setopt_array($ch, [CURLOPT_POST => true, CURLOPT_POSTFIELDS => $payload, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => 15,
            CURLOPT_USERAGENT => $ua, CURLOPT_HTTPHEADER => ['Content-Type: application/json; charset=utf-8', 'Accept: */*']]);
        $body = (string)curl_exec($ch); $status = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE); $err = curl_error($ch); curl_close($ch);
    } else {
        $ctx = stream_context_create(['http' => ['method' => 'POST', 'timeout' => 15, 'ignore_errors' => true,
            'header' => "Content-Type: application/json; charset=utf-8\r\nAccept: */*\r\nUser-Agent: " . $ua . "\r\n", 'content' => $payload]]);
        $body = (string)@file_get_contents('https://api.indexnow.org/indexnow', false, $ctx);
        if (isset($http_response_header[0]) && preg_match('/\s(\d{3})\s/', $http_response_header[0], $m)) $status = (int)$m[1];
    }
    // IndexNow sends an explanation in the body on a rejection (e.g. 403/422) — keep it so the admin can show why.
    return ['status' => $status, 'error' => $err, 'body' => trim(mb_substr($body, 0, 300))];
}

// Sends the queued addresses when the last submission is at least AOK_INDEXNOW_EVERY seconds old.
// Called after a save and after page views, always once the visitor's response has been sent.
function aok_indexnow_flush(array $d): ?array {
    try {
        if (aok_get($d, 'ai.indexNowAuto', true) === false) return null;
        $key = (string)aok_get($d, 'ai.indexNowKey', '');
        $base = aok_base($d);
        if (!preg_match('/^[a-f0-9]{32}$/', $key) || !aok_indexnow_host_ok($base)) return null;
        $q = db()->query("SELECT url FROM aok_indexnow_queue WHERE sent_at IS NULL OR sent_at < changed_at LIMIT 200");
        $urls = $q ? array_column($q->fetchAll(), 'url') : [];
        if (!$urls) return null;
        $last = db()->query("SELECT MAX(sent_at) AS t, NOW() AS n FROM aok_indexnow_queue")->fetch();
        if (!empty($last['t']) && strtotime($last['n']) - strtotime($last['t']) < AOK_INDEXNOW_EVERY) return null;
        // one attempt per 10 minutes, successful or not (a failing IndexNow must not slow down page views)
        if (!aok_rate_ok('indexnow-try', 1, AOK_INDEXNOW_EVERY)) return null;
        $r = aok_indexnow_submit($urls, $key, $base);
        if ($r['status'] === 200 || $r['status'] === 202) {
            $st = db()->prepare("UPDATE aok_indexnow_queue SET sent_at = NOW() WHERE url = :u");
            foreach ($urls as $u) $st->execute([':u' => $u]);
        }
        return $r + ['count' => count($urls)];
    } catch (Throwable $e) { return null; }
}

// Sends the response now and keeps running (static files, IndexNow) without making the visitor wait
function aok_finish_response(): void {
    if (function_exists('fastcgi_finish_request')) { fastcgi_finish_request(); return; }
    if (function_exists('litespeed_finish_request')) { litespeed_finish_request(); return; }
    @ob_end_flush(); @flush();
}
