<?php
// Admin -> Leads. Enquiries live in their own table (aok_leads), never in the site data, so a save can't
// overwrite one that just arrived, they never reach a visitor's browser, and spam can't make the pages heavier.
//   GET                          -> {ok, leads: [newest first]}      (admin)
//   POST {action:'read', id}     -> marks one as read                 (admin + CSRF)
//   POST {action:'readAll'}      -> marks all as read
//   POST {action:'delete', id}   -> deletes it for good
require_once __DIR__ . '/db.php';
cors();
header('Cache-Control: no-store');
require_admin();

try {
    aok_ensure_tables();
    aok_leads_migrate();
} catch (Throwable $e) {
    json_out(['ok' => false, 'error' => 'database_unavailable'], 503);
}

// [rowId, lead] for every stored enquiry, newest first
function leads_all(int $limit = 1000): array {
    $out = [];
    foreach (db()->query("SELECT id, payload FROM aok_leads ORDER BY id DESC LIMIT " . (int)$limit)->fetchAll() as $r) {
        $p = json_decode((string)$r['payload'], true);
        if (!is_array($p)) continue;
        // plain text values only (an older enquiry could hold anything the form was sent), flags as true/false
        foreach ($p as $k => $v) $p[$k] = in_array($k, ['read', 'restored'], true) ? (bool)$v : (is_scalar($v) ? (string)$v : '');
        $out[] = [(int)$r['id'], $p];
    }
    return $out;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    json_out(['ok' => true, 'leads' => array_map(function ($x) { return $x[1]; }, leads_all())]);
}
if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);

$in = json_in_limited(4096);
$action = (string)($in['action'] ?? '');
$id = (string)($in['id'] ?? '');
$enc = function ($p) { return json_encode($p, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES); };

if ($action === 'read' || $action === 'readAll' || $action === 'delete') {
    $n = 0;
    foreach (leads_all(100000) as [$rowId, $p]) {
        if ($action !== 'readAll' && (string)($p['id'] ?? '') !== $id) continue;
        if ($action === 'delete') db()->prepare("DELETE FROM aok_leads WHERE id = :id")->execute([':id' => $rowId]);
        elseif (empty($p['read'])) { $p['read'] = true; db()->prepare("UPDATE aok_leads SET payload = :p WHERE id = :id")->execute([':p' => $enc($p), ':id' => $rowId]); }
        $n++;
    }
    json_out(['ok' => true, 'count' => $n]);
}

json_out(['ok' => false, 'error' => 'unknown_action'], 400);
