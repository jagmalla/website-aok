<?php
require_once __DIR__ . '/db.php';
cors();

// GET  /api/data.php  → saved site JSON (public copy without credentials/leads; full copy for the admin)
// POST /api/data.php  → save site JSON (admin session + CSRF required), return {ok:true}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $row = db()->query("SELECT payload FROM aok_site_data WHERE id = 1")->fetch();
        if ($row) {
            header('Cache-Control: no-store');
            if (is_admin()) {
                header('Content-Type: application/json; charset=utf-8');
                echo $row['payload'];   // full data (incl. leads) for the logged-in admin only
            } else {
                $d = json_decode($row['payload'], true);
                json_out(is_array($d) ? public_payload($d) : ['ok' => false, 'error' => 'corrupt_data']);
            }
        } else {
            json_out(['ok' => false, 'error' => 'no_data']);
        }
    } catch (Exception $e) {
        json_out(['ok' => false, 'error' => $e->getMessage()], 500);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    require_admin();   // only the logged-in admin may change the site
    // Validate it is real JSON
    $test = json_decode(file_get_contents('php://input'), true);
    if (!is_array($test)) {
        json_out(['ok' => false, 'error' => 'invalid_json'], 400);
    }
    unset($test['adminPass']);   // passwords live hashed in aok_auth, never in the site data
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
