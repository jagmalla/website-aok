<?php
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/sync.php';           // services, addresses and search engines kept in step on save
require_once __DIR__ . '/discovery-lib.php';
cors();

// GET  /api/data.php  → saved site JSON (public copy without credentials/leads; full copy for the admin)
// POST /api/data.php  → save site JSON (admin session + CSRF required), return {ok:true}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $d = site_data();   // includes the one-time content upgrades (api/upgrades.php)
    header('Cache-Control: no-store');
    if ($d === null) {   // nothing saved yet: the defaults with the content upgrades applied
        require_once __DIR__ . '/seo-lib.php';
        json_out(aok_site());
    }
    if (!is_admin()) json_out(public_payload($d));
    try { aok_leads_migrate(); } catch (Throwable $e) {}   // enquiries are fetched separately (api/leads.php)
    unset($d['leads']);
    json_out($d);   // the full site data (with private settings) for the logged-in admin only
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_admin();   // only the logged-in admin may change the site
    // Validate it is real JSON (the whole site, images included, stays far below 20 MB)
    $test = json_in_limited(20 * 1024 * 1024);
    if (!$test) {
        json_out(['ok' => false, 'error' => 'invalid_json'], 400);
    }
    unset($test['adminPass']);   // passwords live hashed in aok_auth, never in the site data
    // enquiries live in their own table (api/leads.php): move any older copy across first, then never save one here
    try { aok_leads_migrate(); } catch (Throwable $e) {}
    unset($test['leads']);
    $test = aok_upgrade_payload($test);   // an editor opened before this release still gets the content upgrades
    // keep the IndexNow key the server created, if this save came from an editor opened before it existed
    $old = site_data();
    if (empty($test['ai']['indexNowKey']) && !empty($old['ai']['indexNowKey']) && isset($test['ai']) && is_array($test['ai'])) {
        $test['ai']['indexNowKey'] = $old['ai']['indexNowKey'];
    }
    $changed = aok_save_sync($old, $test);   // service timestamps, 301s for moved/deleted services
    $body = json_encode($test, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    try {
        // Use two distinct placeholders — native prepared statements don't allow
        // reusing the same named placeholder twice.
        $stmt = db()->prepare(
            "INSERT INTO aok_site_data (id, payload, updated_at)
             VALUES (1, :p1, NOW())
             ON DUPLICATE KEY UPDATE payload = :p2, updated_at = NOW()"
        );
        $stmt->execute([':p1' => $body, ':p2' => $body]);
        // answer the editor first, then refresh the static copies and tell the search engines
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => true, 'sync' => aok_sync_patch($test), 'changed' => $changed], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        aok_finish_response();
        try {
            $site = aok_site();
            aok_write_static_files($site);
            aok_indexnow_queue($changed, aok_base($site));
            aok_indexnow_flush($site);
        } catch (Throwable $e) {}
        exit;
    } catch (Exception $e) {
        json_out(['ok' => false, 'error' => $e->getMessage()], 500);
    }
    exit;
}

json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);
