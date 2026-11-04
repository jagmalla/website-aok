<?php
// 90-day revision history for the AI → Humanize workflow.
//
// Every applied rewrite archives the exact text it replaced, so the owner can put it back. The archive lives in
// its own table, app_text_history, and nothing else in the engine reads it: it is never merged into
// app_site_data, never rendered by render.php, never reaches llms.txt, the XML/HTML sitemaps or any SSR output.
// It is admin-only history, for the same reason enquiries live in app_leads and not in the page JSON (AR-22):
// data that is not page content has no business inside the document the editor saves.
//
// Retention is 90 days, enforced on every write and on every audit run.
if (realpath((string)($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) { http_response_code(403); exit; }

const APP_HISTORY_DAYS = 90;

function app_history_table(): void {
    db()->exec("CREATE TABLE IF NOT EXISTS app_text_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        route_key VARCHAR(190) NOT NULL,
        block_id VARCHAR(190) NOT NULL DEFAULT '',
        field_path VARCHAR(190) NOT NULL DEFAULT '',
        original_text LONGTEXT,
        humanized_text LONGTEXT,
        ai_score_before INT NOT NULL DEFAULT 0,
        ai_score_after INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL,
        INDEX idx_route (route_key),
        INDEX idx_created (created_at)
    ) DEFAULT CHARSET=utf8mb4");
}

// Drop anything past the retention window. Cheap, and called on every write and audit run so the table can never
// quietly grow into a liability.
function app_history_purge(): int {
    $st = db()->prepare("DELETE FROM app_text_history WHERE created_at < DATE_SUB(NOW(), INTERVAL " . APP_HISTORY_DAYS . " DAY)");
    $st->execute();
    return $st->rowCount();
}

function app_history_add(string $routeKey, string $blockId, string $fieldPath, string $original, string $humanized, int $before, int $after): int {
    app_history_table();
    $st = db()->prepare("INSERT INTO app_text_history
        (route_key, block_id, field_path, original_text, humanized_text, ai_score_before, ai_score_after, created_at)
        VALUES (:r, :b, :f, :o, :h, :sb, :sa, NOW())");
    $st->execute([':r' => substr($routeKey, 0, 190), ':b' => substr($blockId, 0, 190), ':f' => substr($fieldPath, 0, 190),
                  ':o' => $original, ':h' => $humanized, ':sb' => $before, ':sa' => $after]);
    $id = (int)db()->lastInsertId();
    app_history_purge();
    return $id;
}

// Snapshots for one route, newest first. The text itself is included so the UI can preview a revert.
function app_history_for(string $routeKey, int $limit = 50): array {
    app_history_table();
    $limit = max(1, min(200, $limit));
    $st = db()->prepare("SELECT id, route_key, block_id, field_path, original_text, humanized_text,
                                ai_score_before, ai_score_after, created_at
                         FROM app_text_history WHERE route_key = :r ORDER BY id DESC LIMIT $limit");
    $st->execute([':r' => $routeKey]);
    $out = [];
    foreach ($st->fetchAll() as $r) {
        $out[] = [
            'id' => (int)$r['id'], 'routeKey' => (string)$r['route_key'], 'blockId' => (string)$r['block_id'],
            'fieldPath' => (string)$r['field_path'], 'original' => (string)$r['original_text'],
            'humanized' => (string)$r['humanized_text'], 'before' => (int)$r['ai_score_before'],
            'after' => (int)$r['ai_score_after'], 'createdAt' => (string)$r['created_at'],
        ];
    }
    return $out;
}

function app_history_get(int $id): ?array {
    app_history_table();
    $st = db()->prepare("SELECT id, route_key, block_id, field_path, original_text, humanized_text,
                                ai_score_before, ai_score_after, created_at
                         FROM app_text_history WHERE id = :i");
    $st->execute([':i' => $id]);
    $r = $st->fetch();
    if (!$r) return null;
    return ['id' => (int)$r['id'], 'routeKey' => (string)$r['route_key'], 'blockId' => (string)$r['block_id'],
            'fieldPath' => (string)$r['field_path'], 'original' => (string)$r['original_text'],
            'humanized' => (string)$r['humanized_text'], 'before' => (int)$r['ai_score_before'],
            'after' => (int)$r['ai_score_after'], 'createdAt' => (string)$r['created_at']];
}
