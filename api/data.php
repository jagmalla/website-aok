<?php
require_once __DIR__ . '/db.php';
cors();

// GET  /api/data.php  → return saved site JSON
// POST /api/data.php  → save site JSON, return {ok:true}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $row = db()->query("SELECT payload FROM aok_site_data WHERE id = 1")->fetch();
        if ($row) {
            header('Content-Type: application/json; charset=utf-8');
            echo $row['payload'];   // already stored as JSON string
        } else {
            json_out(['ok' => false, 'error' => 'no_data']);
        }
    } catch (Exception $e) {
        json_out(['ok' => false, 'error' => $e->getMessage()], 500);
    }
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $body = file_get_contents('php://input');
    // Validate it is real JSON
    $test = json_decode($body, true);
    if ($test === null) {
        json_out(['ok' => false, 'error' => 'invalid_json'], 400);
    }
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
