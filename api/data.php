<?php
require_once __DIR__ . '/db.php';
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
    json_out(is_admin() ? $d : public_payload($d));   // full data (incl. leads) for the logged-in admin only
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_admin();   // only the logged-in admin may change the site
    // Validate it is real JSON
    $test = json_decode(file_get_contents('php://input'), true);
    if (!is_array($test)) {
        json_out(['ok' => false, 'error' => 'invalid_json'], 400);
    }
    unset($test['adminPass']);   // passwords live hashed in aok_auth, never in the site data
    $test = aok_upgrade_payload($test);   // an editor opened before this release still gets the content upgrades
    // keep the IndexNow key the server created, if this save came from an editor opened before it existed
    $old = site_data();
    if (empty($test['ai']['indexNowKey']) && !empty($old['ai']['indexNowKey']) && isset($test['ai']) && is_array($test['ai'])) {
        $test['ai']['indexNowKey'] = $old['ai']['indexNowKey'];
    }
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
        json_out(['ok' => true]);
    } catch (Exception $e) {
        json_out(['ok' => false, 'error' => $e->getMessage()], 500);
    }
    exit;
}

json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);
