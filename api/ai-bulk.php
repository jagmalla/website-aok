<?php
// Admin -> AI Content -> "Rewrite what clearly improves".
//
// Walks every service and blog body, rewrites the paragraphs worth rewriting, and hands the
// result back for the browser to apply. It does NOT write anything: the admin's browser holds
// the live copy of the site with unsaved edits, so a server-side write would overwrite them
// (AR-22). Same rule as api/ai-humanize.php.
//
//   POST {dryRun:true}   -> what would change, nothing applied
//   POST {}              -> the same, plus the rewritten body for each page
//
// WHY A GATE: measured over 40 real paragraphs of this site's writing, the rewriter improved 22,
// left 10 unchanged and made 8 read WORSE. So a paragraph is only accepted when its score falls
// by at least MIN_GAIN. Headings, answer boxes, lists and short paragraphs are left alone: the
// answer boxes are tuned to 45-55 words for AI assistants and must not be reworded.
require_once __DIR__ . '/db.php';
require_once __DIR__ . '/ai-audit-lib.php';
require_once __DIR__ . '/ai-humanize-lib.php';
cors();
header('Cache-Control: no-store');
require_admin();

const AOK_BULK_MIN_GAIN = 5;     // points of AI-pattern score a rewrite must remove to be kept
const AOK_BULK_MIN_CHARS = 220;  // below this a paragraph is too short to judge

$in = json_in_limited(4096);
$dry = !empty($in['dryRun']);

// Is this block ordinary prose we may rewrite?
$eligible = function (string $b): bool {
    $t = ltrim($b);
    if ($t === '' || mb_strlen($t) < AOK_BULK_MIN_CHARS) return false;
    $c = $t[0];
    if ($c === '#' || $c === '>' || $c === '-' || $c === '|') return false;   // heading, answer box, list, table
    if (preg_match('/^\d+[.)]\s/', $t)) return false;                          // numbered step
    return true;
};

$rewriteBody = function (string $body) use ($eligible) {
    $blocks = preg_split("/(\n\s*\n)/", $body, -1, PREG_SPLIT_DELIM_CAPTURE);
    $out = ''; $tried = 0; $kept = 0; $gain = 0;
    foreach ($blocks as $b) {
        if (!$eligible($b)) { $out .= $b; continue; }
        $tried++;
        $best = null;
        foreach ([['plain', 'standard'], ['plain', 'strong'], ['direct', 'standard']] as [$tone, $str]) {
            $r = app_humanize_run($b, 0, $tone, $str);
            $d = (int)$r['before']['ai'] - (int)$r['after']['ai'];
            if ($d >= AOK_BULK_MIN_GAIN && ($best === null || $d > $best['gain'])) $best = ['gain' => $d, 'text' => $r['humanized']];
        }
        if ($best) { $out .= $best['text']; $kept++; $gain += $best['gain']; }
        else $out .= $b;
    }
    return ['body' => $out, 'tried' => $tried, 'kept' => $kept, 'gain' => $gain];
};

$d = site_data() ?? [];
$pages = []; $tot = ['tried' => 0, 'kept' => 0];

foreach (['services' => 'detail', 'blog' => 'body'] as $coll => $field) {
    foreach ($d[$coll] ?? [] as $i => $item) {
        $body = (string)($item[$field] ?? '');
        if (trim($body) === '') continue;
        $r = $rewriteBody($body);
        if ($r['kept'] === 0) continue;
        $before = app_audit_score($body); $after = app_audit_score($r['body']);
        $tot['tried'] += $r['tried']; $tot['kept'] += $r['kept'];
        $pages[] = [
            'path' => $coll . '.' . $i . '.' . $field,
            'title' => (string)($item['title'] ?? ''),
            'paragraphs' => $r['kept'], 'of' => $r['tried'],
            'before' => (int)$before['ai_percentage'], 'after' => (int)$after['ai_percentage'],
            'body' => $dry ? null : $r['body'],
        ];
    }
}
usort($pages, function ($a, $b) { return ($b['before'] - $b['after']) - ($a['before'] - $a['after']); });

json_out(['ok' => true, 'dryRun' => $dry, 'minGain' => AOK_BULK_MIN_GAIN,
    'summary' => ['pages' => count($pages), 'paragraphsChanged' => $tot['kept'], 'paragraphsChecked' => $tot['tried']],
    'pages' => $pages]);
