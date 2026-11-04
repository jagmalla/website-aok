<?php
// Admin -> AI → Humanize. Preview a rewrite, archive the original when one is applied, list the 90-day history,
// and hand back an archived original to restore.
//
//   POST {action:'preview', text, variant, tone}                 -> {ok, result:{original, humanized, before, after, changes, engine, tone}}
//        tone: 'direct' (default) | 'plain' | 'editorial' — see app_humanize_tones()
//        strength: 'light' | 'standard' (default) | 'strong' — see app_humanize_strengths()
//   POST {action:'apply', routeKey, blockId, fieldPath, original, humanized, scoreBefore, scoreAfter}
//                                                                -> {ok, id}        (archives the original)
//   GET  ?action=history&routeKey=…                              -> {ok, history:[…]}
//   POST {action:'revert', id}                                   -> {ok, record}    (hands back the original text)
//
// WHO WRITES THE PAGE: not this file. 'apply' and 'revert' only move history rows; the browser puts the text into
// the content model through its own commit/save path. The admin's browser holds the live copy of app_site_data and
// usually has unsaved edits, so a server-side write into it would overwrite them — the failure AR-22 exists for.
// Keeping one writer also means a revert restores the archived string byte for byte, with nothing re-encoding it.
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/ai-audit-lib.php';
require_once __DIR__ . '/ai-humanize-lib.php';
require_once __DIR__ . '/text-history-lib.php';
cors();
header('Cache-Control: no-store');
require_admin();

const APP_HUMANIZE_MAX_CHARS = 60000;

try {
    app_history_table();

    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        if ((string)($_GET['action'] ?? '') !== 'history') json_out(['ok' => false, 'error' => 'unknown_action'], 400);
        $routeKey = trim((string)($_GET['routeKey'] ?? ''));
        if ($routeKey === '') json_out(['ok' => false, 'error' => 'missing_route'], 400);
        app_history_purge();
        json_out(['ok' => true, 'history' => app_history_for($routeKey), 'retentionDays' => APP_HISTORY_DAYS]);
    }

    if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_out(['ok' => false, 'error' => 'method_not_allowed'], 405);

    $in = json_in();
    $action = (string)($in['action'] ?? '');

    if ($action === 'preview') {
        $text = (string)($in['text'] ?? '');
        if (trim($text) === '') json_out(['ok' => false, 'error' => 'empty_text'], 400);
        if (strlen($text) > APP_HUMANIZE_MAX_CHARS) json_out(['ok' => false, 'error' => 'text_too_long'], 413);
        // a model rewrite is up to two API calls; shared hosts often stop scripts at 30 s
        if (app_humanize_provider() !== 'rules') @set_time_limit(300);
        json_out(['ok' => true, 'result' => app_humanize_run($text, (int)($in['variant'] ?? 0), (string)($in['tone'] ?? 'direct'),
            (string)($in['strength'] ?? 'standard'))]);
    }

    if ($action === 'apply') {
        $original = (string)($in['original'] ?? '');
        $humanized = (string)($in['humanized'] ?? '');
        if (trim($original) === '' || trim($humanized) === '') json_out(['ok' => false, 'error' => 'empty_text'], 400);
        if (strlen($original) > APP_HUMANIZE_MAX_CHARS || strlen($humanized) > APP_HUMANIZE_MAX_CHARS)
            json_out(['ok' => false, 'error' => 'text_too_long'], 413);
        $id = app_history_add(
            (string)($in['routeKey'] ?? ''), (string)($in['blockId'] ?? ''), (string)($in['fieldPath'] ?? ''),
            $original, $humanized,
            (int)($in['scoreBefore'] ?? 0), (int)($in['scoreAfter'] ?? 0)
        );
        json_out(['ok' => true, 'id' => $id]);
    }

    if ($action === 'revert') {
        $rec = app_history_get((int)($in['id'] ?? 0));
        if (!$rec) json_out(['ok' => false, 'error' => 'not_found'], 404);
        json_out(['ok' => true, 'record' => $rec]);   // the browser writes record.original back into the page
    }

    json_out(['ok' => false, 'error' => 'unknown_action'], 400);
} catch (Throwable $e) {
    error_log('ai-humanize.php: ' . $e->getMessage());
    json_out(['ok' => false, 'error' => 'humanize_failed'], 500);
}
