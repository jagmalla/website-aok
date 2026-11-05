<?php
// AI Content Audit — native linguistic heuristics.
//
// WHAT THIS IS: a writing-quality inspector. It measures how strongly a piece of copy carries the patterns that
// machine-written prose tends to have — uniform sentence length, stock transitions, filler phrases, heavy passive
// voice, thin vocabulary — and turns that into a single "AI-signature density" number plus concrete rewrite advice.
//
// WHAT THIS IS NOT: an authorship detector. No heuristic (and no commercial detector either) can prove who wrote a
// text; they all produce false positives on formal, technical or non-native human writing. Treat the score as
// "how formulaic does this read", never as evidence. The UI is worded that way on purpose.
//
// The same maths lives in assets/app.js (auditScore) so the admin can score as you type without a round-trip.
// The two must agree exactly — change one, change the other (AR-12). tools/audit-parity.php checks they do.
if (realpath((string)($_SERVER['SCRIPT_FILENAME'] ?? '')) === __FILE__) { http_response_code(403); exit; }

// Stock phrases that cluster heavily in generated copy. Lower-case, matched as substrings.
function app_audit_fillers(): array {
    return [
        "in today's fast-paced", 'fast-paced digital world', 'delve into', 'delving into',
        'a testament to', 'testament to', 'plays a crucial role', 'crucial role', 'play a vital role', 'vital role',
        'navigating the complexities', 'navigate the complexities', 'tapestry', 'rich tapestry', 'ever-evolving',
        'ever-changing landscape', 'in the realm of', 'realm of', 'it is important to note', 'it is worth noting',
        'when it comes to', 'at the end of the day', 'unlock the potential', 'unlock the power', 'harness the power',
        'cutting-edge', 'state-of-the-art', 'seamless integration', 'seamlessly', 'robust solution', 'holistic approach',
        'game-changer', 'game changer', 'leverage the', 'myriad of', 'plethora of', 'a wide array of', 'wide range of',
        'elevate your', 'take your business to the next level', 'in conclusion', 'to sum up', 'embark on a journey',
        'landscape of', 'underscores the', 'pivotal role', 'paradigm shift', 'synergy', 'best-in-class',
        // flowery / overwrought diction that marks thesaurus-driven generated prose
        'stands instrumental', 'navigates the intricate', 'intricate pathways', 'invaluable guidance',
        'seeking solace', 'beacon of', 'steadfast advocate', 'labyrinthine', 'bridging the gap', 'haven for',
        'in the pursuit of', 'a deep understanding of', 'make all the difference', 'in dire need',
        'bolsters', 'a new beginning', 'stands as a', 'upholding the principles', 'a testament',
        'unwavering commitment', 'treasure trove', 'nestled in', 'boasts a', 'stands as a testament',
        'at the forefront', 'par excellence', 'the epitome of', 'a myriad', 'time and again',
    ];
}
// Transition openers. Fine in moderation; a high share of sentences starting this way reads as scaffolding.
function app_audit_transitions(): array {
    return ['however', 'moreover', 'furthermore', 'additionally', 'consequently', 'therefore', 'thus', 'overall',
            'ultimately', 'notably', 'importantly', 'essentially', 'indeed', 'conversely', 'nevertheless',
            'nonetheless', 'firstly', 'secondly', 'finally', 'crucially', 'significantly'];
}

// Structural tells. Word lists catch the vocabulary of generated copy; these catch its skeleton, which survives any
// synonym swap. Each regex is copied character for character into app.js.
// A low score here does NOT predict a commercial detector's verdict: tested 2026-11-02, rewrites scoring 5–12% here
// scored 0–51% on ZeroGPT and 100% on GPTZero, whose model reads word-level predictability, not these patterns.
//
// Participial tail: a finished clause followed by ", offering …" / ", ensuring …" / ", helping …". Lower-case only
// (a participle after a comma is never capitalised); the nouns that merely end in -ing are excluded by name.
const APP_AUDIT_TAIL_RE = '/,\s+(?!(?:during|nothing|something|anything|everything|morning|evening|string|spring|ceiling|wedding|sibling|darling|including|according|regarding|concerning|following|pending|notwithstanding)\b)([a-z]{3,}ing)\b/';
// After the -ing word: a modal in the same clause (before a comma or a "that/which/…") means the -ing phrase is the
// subject of that verb — "in some cases, applying the rules strictly could lead to …" — not a trailing participle.
const APP_AUDIT_GERUND_SUBJ_RE = '/^(?:(?!\b(?:that|which|who|where|when|so|because|if|while)\b)[^,.;!?])*?\b(?:could|can|will|would|may|might|must|should)\b/i';
// A sentence that opens with a subordinate clause: its first comma closes that clause, so an -ing word right after
// it is the subject of the main clause ("If you're moving, packing early helps"), not a tail.
const APP_AUDIT_SUBORD_RE = '/^(?:if|when|whenever|while|whilst|although|though|because|since|as|before|after|once|until|unless|whether|where|wherever)\b/i';
// Scaffolded openers: "With a …,", "Whether …", "When facing …", "By combining …", "In collaboration with …", and
// any "-ing phrase, main clause" adjunct ("Drawing on decades of experience, the firm …"). A finite verb before the
// comma means the -ing word is a plain subject ("Parking is free, and …"): ordinary writing, not scaffolding.
const APP_AUDIT_SCAFFOLD_RE = '/^(?:with\s+(?:a|an|the|our|their|its|his|her|over|more\s+than|years|decades|nearly|almost|\d+)\b|whether\b|(?:when|while)\s+[a-z]+ing\b|by\s+[a-z]+ing\b|in\s+(?:close\s+)?(?:collaboration|partnership)\s+with\b|in\s+today\'s\b|in\s+the\s+(?:world|realm|landscape)\s+of\b|as\s+an?\s+(?:trusted|leading|dedicated|skilled|seasoned|experienced|reliable|committed)\b|(?!(?:during|nothing|something|anything|everything|morning|evening|spring|string|ceiling|wedding)\b)[a-z]{3,}ing\b(?:(?!\b(?:is|are|was|were|has|have|had|can|could|will|would|should|may|might|must|does|do|did)\b)[^,.!?]){0,80},)/i';
// Stiff register: uncontracted forms a person would contract, and the impersonal nouns of encyclopedic copy.
const APP_AUDIT_STIFF_RE = '/\b(?:it is|they are|we are|you are|that is|there is|do not|does not|did not|cannot|will not|is not|are not|would not|should not|has not|have not|one\'s|oneself|individuals|those in need)\b/i';
const APP_AUDIT_CONTRACTION_RE = "/\\b(?:[A-Za-z]+(?:n't|'re|'ve|'ll|'m|'d)|(?:it|that|there|here|what|who|he|she|let|where)'s)\\b/i";
const APP_AUDIT_DIRECT_RE = "/\\b(?:you|your|yours|we|our|ours|us|i|my|me)\\b/i";

function app_audit_clamp(float $v): float { return $v < 0 ? 0.0 : ($v > 100 ? 100.0 : $v); }

// First-hand detail: numbers, names and places mid-sentence (a capital after a lower-case word, so sentence starts
// don't count), and dated examples. Counted distinct, at most six. Mirror: auditSpecifics() in app.js, which the
// Humanize checklist also uses.
const APP_AUDIT_NUMBER_RE = '/\b\d[\d,.:]*\b|\b(?:two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|fifteen|twenty|thirty|forty|fifty|hundred|dozen)\b/i';
const APP_AUDIT_NAME_RE = '/[a-z0-9,;:)]\s+([A-Z][a-z]{2,})/';
const APP_AUDIT_EXAMPLE_RE = '/\b(?:last\s+(?:week|month|year|winter|summer|spring|autumn|fall|night|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|yesterday|[a-z]+\s+(?:days|weeks|months|years)\s+ago|(?:in|since)\s+(?:19|20)\d\d|this\s+(?:week|month|morning))\b/i';
function app_audit_specifics(string $t): array {
    $u = function (array $xs) { $o = []; foreach ($xs as $x) $o[strtolower($x)] = 1; return array_keys($o); };
    preg_match_all(APP_AUDIT_NUMBER_RE, $t, $n);
    preg_match_all(APP_AUDIT_NAME_RE, $t, $p);
    preg_match_all(APP_AUDIT_EXAMPLE_RE, $t, $e);
    $out = ['numbers' => $u($n[0]), 'names' => $u($p[1]), 'examples' => $u($e[0])];
    $out['count'] = min(6, count($out['numbers']) + count($out['names']) + count($out['examples']));
    return $out;
}

// Does this sentence carry a participial tail? The same walk runs in app.js (auditHasTail).
function app_audit_has_tail(string $s): bool {
    if (!preg_match_all(APP_AUDIT_TAIL_RE, $s, $m, PREG_OFFSET_CAPTURE)) return false;
    $first = strpos($s, ',');
    $sub = (bool)preg_match(APP_AUDIT_SUBORD_RE, $s);
    foreach ($m[0] as $k => $hit) {
        $at = $hit[1];
        if ($sub && $at === $first) continue;                              // closes an opening "If …," clause
        if (count(app_audit_words(substr($s, 0, $at))) < 3) continue;      // too little before it to be a clause
        if (substr($s, $at + strlen($hit[0]), 1) === ',') continue;        // a list of gerunds, not a tail
        if (preg_match(APP_AUDIT_GERUND_SUBJ_RE, substr($s, $at + strlen($hit[0])))) continue;   // "…, applying X could lead to"
        return true;
    }
    return false;
}

// Hidden characters. Text pasted from AI tools, PDFs and word processors can carry characters a reader never sees:
// zero-width spaces and joiners, soft hyphens, direction marks, odd-width spaces, and "homoglyphs" — a Cyrillic "а"
// or Greek "ο" inside an English word. They break search, copy-paste and word counts (a zero-width space makes one
// word two). Removes the invisible ones, turns odd spaces into plain spaces, and maps look-alike letters back to
// Latin only inside words that mix scripts, so genuine Cyrillic or Greek text is untouched. $n counts the fixes.
// Mirror: cleanHidden() in app.js (AR-12).
function app_text_clean_hidden(string $t, int &$n = 0): string {
    $n = 0;
    // a run of spacing with any odd space in it becomes one plain space — "AI detector bypass" tools put two or three
    // (thin + hair, hair + zero-width + hair) where one space was; mapping each to a space left doubled gaps
    $c = 0; $r = @preg_replace('/[ \x{200B}-\x{200D}\x{2060}]*[\x{2000}-\x{200A}\x{202F}\x{205F}\x{3000}][ \x{2000}-\x{200A}\x{202F}\x{205F}\x{3000}\x{200B}-\x{200D}\x{2060}]*/u', ' ', $t, -1, $c);
    if (!is_string($r)) return $t;            // not valid UTF-8: leave it exactly as it was
    $t = $r; $n += $c;
    $t = (string)preg_replace('/[\x{200B}-\x{200D}\x{2060}\x{FEFF}\x{00AD}\x{180E}\x{202A}-\x{202E}\x{2066}-\x{2069}]/u', '', $t, -1, $c); $n += $c;
    $map = ['а' => 'a', 'е' => 'e', 'о' => 'o', 'р' => 'p', 'с' => 'c', 'у' => 'y', 'х' => 'x', 'і' => 'i', 'ј' => 'j',
        'ѕ' => 's', 'ԁ' => 'd', 'һ' => 'h', 'ӏ' => 'l', 'ԛ' => 'q', 'ԝ' => 'w', 'А' => 'A', 'В' => 'B', 'Е' => 'E', 'К' => 'K',
        'М' => 'M', 'Н' => 'H', 'О' => 'O', 'Р' => 'P', 'С' => 'C', 'Т' => 'T', 'Х' => 'X', 'У' => 'Y', 'І' => 'I', 'Ј' => 'J',
        'Ѕ' => 'S', 'α' => 'a', 'ο' => 'o', 'ρ' => 'p', 'ν' => 'v', 'υ' => 'u', 'ι' => 'i', 'κ' => 'k', 'Α' => 'A', 'Β' => 'B',
        'Ε' => 'E', 'Ζ' => 'Z', 'Η' => 'H', 'Ι' => 'I', 'Κ' => 'K', 'Μ' => 'M', 'Ν' => 'N', 'Ο' => 'O', 'Ρ' => 'P', 'Τ' => 'T',
        'Υ' => 'Y', 'Χ' => 'X'];
    $t = (string)preg_replace_callback('/\p{L}+/u', function ($m) use ($map, &$n) {
        $w = $m[0];
        if (!preg_match('/\p{Latin}/u', $w) || !preg_match('/[\p{Cyrillic}\p{Greek}]/u', $w)) return $w;
        $fixed = strtr($w, $map);
        if ($fixed !== $w) $n++;
        return $fixed;
    }, $t);
    return $t;
}

// HTML -> one line of plain text (the auditor only ever looks at words, never markup)
function app_audit_plain(string $html): string {
    $t = preg_replace('#<(script|style)\b[^>]*>.*?</\1>#is', ' ', $html);
    $t = strip_tags((string)$t);
    $t = html_entity_decode((string)$t, ENT_QUOTES, 'UTF-8');
    // curly apostrophes -> ', and NBSP -> space: PCRE's \s and JavaScript's \s disagree on NBSP, and the two
    // engines must tokenise identically (AR-12)
    $t = str_replace(["\xE2\x80\x99", "\xE2\x80\x98", "\xC2\xA0"], ["'", "'", ' '], (string)$t);
    $t = app_text_clean_hidden($t);
    // unfilled {{TOKEN}} placeholders are not prose: scoring them gave an untouched kit 50–70% "AI" pages
    $t = preg_replace('/\{\{[A-Za-z0-9_]+\}\}/', ' ', $t);
    return trim((string)preg_replace('/\s+/u', ' ', (string)$t));
}
// Sentence split without look-behind, so the PHP and JS regex engines agree on every platform.
function app_audit_sentences(string $t): array {
    if ($t === '') return [];
    preg_match_all('/[^.!?]*[.!?]+|[^.!?]+$/u', $t, $m);
    $out = [];
    foreach ($m[0] as $s) { $s = trim($s); if ($s !== '') $out[] = $s; }
    return $out;
}
// A word is letters, digits and apostrophes; "H&C", "R&D" and "B&B" are one word, not two one-letter ones (split,
// "The H&C provision … the H&C application" read as a three-word phrase hammered for SEO).
function app_audit_words(string $t): array {
    preg_match_all("/[A-Za-z0-9']+(?:&[A-Za-z0-9']+)*/", $t, $m);
    return $m[0];
}

// Moving-average type/token ratio (window 50). Plain TTR falls as text grows, which would punish long pages;
// MATTR stays comparable between a 60-word intro and a 1,500-word article.
function app_audit_mattr(array $lower): float {
    $n = count($lower);
    if ($n === 0) return 1.0;
    if ($n < 50) return count(array_unique($lower)) / $n;
    $windows = $n - 50 + 1; $sum = 0;
    for ($i = 0; $i < $windows; $i++) $sum += count(array_unique(array_slice($lower, $i, 50)));
    return $sum / $windows / 50;
}

// The full report for one piece of copy.
function app_audit_score(string $text): array {
    $t = app_audit_plain($text);
    $sentences = app_audit_sentences($t);
    $words = app_audit_words($t);
    $wordCount = count($words);
    $sc = count($sentences);
    $lower = [];
    foreach ($words as $w) $lower[] = strtolower($w);
    $lowText = strtolower($t);

    // No copy at all: every signal below would be measuring nothing, so say so instead of inventing a score.
    if ($wordCount === 0) {
        return ['words' => 0, 'sentences' => 0, 'ai_percentage' => 0, 'human_percentage' => 100, 'reliable' => false,
            'band' => 'green', 'provider' => 'native',
            'signals' => ['burstiness' => 0, 'filler' => 0, 'openers' => 0, 'passive' => 0, 'diversity' => 0, 'stuffing' => 0,
                          'tails' => 0, 'scaffold' => 0, 'cadence' => 0, 'formality' => 0],
            'metrics' => ['avgSentence' => 0, 'sentenceSd' => 0, 'cv' => 0, 'mattr' => 0, 'passiveRatio' => 0,
                          'fillerPer100' => 0, 'longSentences' => 0, 'shortSentences' => 0, 'longestRun' => 0,
                          'topPhrase' => '', 'topPhraseCount' => 0, 'tailSentences' => 0, 'scaffoldSentences' => 0,
                          'contractions' => 0, 'stiffPhrases' => 0, 'specifics' => 0],
            'filler_found' => [], 'highlighted_spans' => [],
            'recommendations' => ['No readable text on this page yet — add some copy, then audit it.']];
    }

    // 1. burstiness — spread of sentence lengths
    $lens = []; foreach ($sentences as $s) $lens[] = count(app_audit_words($s));
    $sum = 0; foreach ($lens as $l) $sum += $l;
    $mean = $sc > 0 ? $sum / $sc : 0.0;
    $var = 0.0; foreach ($lens as $l) $var += ($l - $mean) * ($l - $mean);
    $sd = $sc > 0 ? sqrt($var / $sc) : 0.0;
    $cv = $mean > 0 ? $sd / $mean : 0.0;
    // variation needs at least two sentences; one sentence is not "perfectly uniform", it is unmeasurable
    $burst = $sc >= 2 ? app_audit_clamp((0.62 - $cv) / 0.62 * 100) : 0.0;

    // 2. filler / stock phrasing
    $found = []; $fillerTotal = 0;
    foreach (app_audit_fillers() as $p) {
        $c = substr_count($lowText, $p);
        if ($c > 0) { $found[$p] = $c; $fillerTotal += $c; }
    }
    $per100 = $wordCount > 0 ? $fillerTotal / ($wordCount / 100) : 0.0;
    $filler = app_audit_clamp($per100 * 40);

    // 3. passive voice
    $passiveCount = 0;
    foreach ($sentences as $s) if (preg_match("/\b(?:is|are|was|were|be|been|being)\s+(?:[A-Za-z]+ly\s+)?[A-Za-z]+(?:ed|en)\b/i", $s)) $passiveCount++;
    $passiveRatio = $sc > 0 ? $passiveCount / $sc : 0.0;
    $passive = app_audit_clamp($passiveRatio * 285);

    // 4. repetitive / scaffolded openers
    $openers = []; $transCount = 0; $trans = app_audit_transitions();
    foreach ($sentences as $s) {
        $w = app_audit_words($s);
        $first = isset($w[0]) ? strtolower($w[0]) : '';
        $openers[] = $first;
        if ($first !== '' && in_array($first, $trans, true)) $transCount++;
    }
    $uniqueOpeners = count(array_unique($openers));
    $repeatRatio = $sc > 0 ? 1 - $uniqueOpeners / $sc : 0.0;
    $transRatio = $sc > 0 ? $transCount / $sc : 0.0;
    $tr = $transRatio * 5.5556; if ($tr > 1) $tr = 1.0;
    $opener = app_audit_clamp($repeatRatio * 70 + $tr * 30);

    // 5. vocabulary diversity
    $mattr = app_audit_mattr($lower);
    $divers = app_audit_clamp((0.78 - $mattr) / 0.25 * 100);

    // 6. keyword stuffing — the most-repeated three-word phrase. SEO-driven generated copy hammers one key
    // phrase ("Family Dentist in Springfield" seven times); human writing almost never repeats a 3-word phrase 3+ times.
    $maxGram = 1; $topPhrase = '';
    if ($wordCount >= 12) {
        $grams = [];
        for ($i = 0; $i + 2 < $wordCount; $i++) { $g = $lower[$i] . ' ' . $lower[$i + 1] . ' ' . $lower[$i + 2]; $grams[$g] = ($grams[$g] ?? 0) + 1; }
        if ($grams) { arsort($grams); $topPhrase = (string)array_key_first($grams); $maxGram = (int)$grams[$topPhrase]; }
    }
    $stuffing = $maxGram >= 3 ? app_audit_clamp(($maxGram - 2) / 4 * 100) : 0.0;

    // 7. participial tails — the share of sentences that trail off into ", offering …" / ", ensuring …"
    $tailFlags = []; $tailCount = 0;
    foreach ($sentences as $i => $s) { $tailFlags[$i] = app_audit_has_tail($s); if ($tailFlags[$i]) $tailCount++; }
    $tails = $sc > 0 ? app_audit_clamp($tailCount / $sc * 220) : 0.0;

    // 8. scaffolded openers — "With a …,", "Whether …", "When facing …", "By combining …", "-ing phrase, …"
    $scafFlags = []; $scafCount = 0;
    foreach ($sentences as $i => $s) { $scafFlags[$i] = (bool)preg_match(APP_AUDIT_SCAFFOLD_RE, $s); if ($scafFlags[$i]) $scafCount++; }
    $scaffold = $sc > 0 ? app_audit_clamp($scafCount / $sc * 200) : 0.0;

    // 9. flat cadence — most sentences inside the comfortable 10–28 word band, no short one, no punctuation beyond
    // commas and full stops. The spread (signal 1) can look fine while every sentence still lands mid-length.
    $cadence = 0.0; $midCount = 0; $hasShort = false; $varied = 0;
    if ($sc >= 3) {
        foreach ($sentences as $i => $s) {
            if ($lens[$i] >= 10 && $lens[$i] <= 28) $midCount++;
            if ($lens[$i] <= 7) $hasShort = true;
            if (preg_match('/[:;()?!]|\x{2014}|\s\x{2013}\s/u', $s)) $varied++;
        }
        $mid = $midCount / $sc;
        $cadence = app_audit_clamp(($mid > 0.5 ? ($mid - 0.5) * 120 : 0) + ($hasShort ? 0 : 25) + ($varied > 0 ? 0 : 15));
    }

    // 10. stiff register — uncontracted "it is / do not / cannot", "one's", "individuals"; no contraction at all;
    // never a "you" or "we". Measured from 40 words up: a short caption has no register to speak of.
    $stiffCount = preg_match_all(APP_AUDIT_STIFF_RE, $t);
    $contractions = preg_match_all(APP_AUDIT_CONTRACTION_RE, $t);
    $direct = (bool)preg_match(APP_AUDIT_DIRECT_RE, $t);
    $stiffPer100 = $wordCount > 0 ? $stiffCount / ($wordCount / 100) : 0.0;
    // the "none at all" penalties ramp in from 40 to 120 words: a switch at one length made a single added sentence
    // jump the score (adding first-hand detail to a 55-word block cost it 7 points)
    $ramp = $wordCount > 40 ? min(1.0, ($wordCount - 40) / 80) : 0.0;
    $formality = $wordCount >= 40
        ? app_audit_clamp($stiffPer100 * 15 + ($contractions === 0 ? 20 * $ramp : 0) + (!$direct ? 25 * $ramp : 0))
        : 0.0;

    // 11. first-hand detail — distinct numbers, names and places, and dated examples. It is the strongest sign of a
    // writer who was there, so it counts against the AI score instead of for it: up to six specifics cut the score
    // by up to 36%. Keyword-stuffed copy earns nothing (a place name hammered for SEO is not detail).
    $spec = app_audit_specifics($t);
    $credit = $stuffing >= 40 ? 0.0 : min(0.36, $spec['count'] * 0.06);

    // Aggregate by noisy-OR, not a weighted average: several independent tells combine into high confidence, and
    // one strong, near-certain signal (dense filler, heavy keyword stuffing) is not diluted by signals that happen
    // to read clean. Each weight is how much a maxed-out signal counts as evidence.
    $ev = [[$burst, 0.42], [$filler, 0.55], [$stuffing, 0.52], [$opener, 0.42], [$passive, 0.38], [$divers, 0.34],
           [$tails, 0.45], [$scaffold, 0.40], [$cadence, 0.30], [$formality, 0.30]];
    $prod = 1.0;
    foreach ($ev as $e) $prod *= (1.0 - ($e[0] / 100.0) * $e[1]);
    $ai = (int)round((1.0 - $prod) * (1.0 - $credit) * 100);
    if ($ai < 3) $ai = 3; if ($ai > 97) $ai = 97;

    // sentence-level flags, for the highlighted reading view
    $spans = []; $longCount = 0; $shortCount = 0; $runMax = 0; $run = 0;
    foreach ($sentences as $i => $s) {
        $n = $lens[$i]; $flags = [];
        if ($n >= 25) { $longCount++; $run++; if ($run > $runMax) $runMax = $run; } else { $run = 0; }
        if ($n <= 8) $shortCount++;
        if ($n >= 28) $flags[] = 'long';
        $sl = strtolower($s);
        foreach (array_keys($found) as $p) if (strpos($sl, $p) !== false) { $flags[] = 'filler'; break; }
        if (preg_match("/\b(?:is|are|was|were|be|been|being)\s+(?:[A-Za-z]+ly\s+)?[A-Za-z]+(?:ed|en)\b/i", $s)) $flags[] = 'passive';
        if ($openers[$i] !== '' && in_array($openers[$i], $trans, true)) $flags[] = 'opener';
        if ($maxGram >= 3 && $topPhrase !== '' && strpos($sl, $topPhrase) !== false) $flags[] = 'stuffing';
        if ($tailFlags[$i]) $flags[] = 'tail';
        if ($scafFlags[$i]) $flags[] = 'scaffold';
        if ($flags && count($spans) < 40) $spans[] = ['i' => $i, 'text' => $s, 'flags' => $flags];
    }

    $signals = ['burstiness' => round($burst), 'filler' => round($filler), 'openers' => round($opener),
                'passive' => round($passive), 'diversity' => round($divers), 'stuffing' => round($stuffing),
                'tails' => round($tails), 'scaffold' => round($scaffold), 'cadence' => round($cadence),
                'formality' => round($formality)];
    $metrics = ['avgSentence' => round($mean, 1), 'sentenceSd' => round($sd, 1), 'cv' => round($cv, 3),
                'mattr' => round($mattr, 3), 'passiveRatio' => round($passiveRatio, 3),
                'fillerPer100' => round($per100, 2), 'longSentences' => $longCount,
                'shortSentences' => $shortCount, 'longestRun' => $runMax,
                'topPhrase' => $topPhrase, 'topPhraseCount' => $maxGram, 'tailSentences' => $tailCount,
                'scaffoldSentences' => $scafCount, 'contractions' => $contractions, 'stiffPhrases' => $stiffCount,
                'specifics' => $spec['count']];

    return [
        'words' => $wordCount, 'sentences' => $sc,
        'ai_percentage' => $ai, 'human_percentage' => 100 - $ai,
        'reliable' => $wordCount >= 40,          // below this the sample is too small to say anything
        'band' => app_audit_band($ai),
        'signals' => $signals, 'metrics' => $metrics,
        'filler_found' => $found,
        'highlighted_spans' => $spans,
        'recommendations' => app_audit_recommendations($signals, $metrics, $found, $sc),
    ];
}

function app_audit_band(int $ai): string { return $ai >= 65 ? 'red' : ($ai >= 40 ? 'amber' : 'green'); }

// Concrete, countable advice — never "write more naturally", always "N sentences do X".
function app_audit_recommendations(array $sig, array $m, array $found, int $sc): array {
    $r = [];
    if (($sig['stuffing'] ?? 0) >= 40 && ($m['topPhrase'] ?? '') !== '')
        $r[] = 'Keyword stuffing: the phrase "' . $m['topPhrase'] . '" appears ' . (int)($m['topPhraseCount'] ?? 0)
             . ' times. Say it once, then use "we", "the firm" or a pronoun — repetition reads as machine-written SEO filler and search engines discount it.';
    if ($sig['burstiness'] >= 45)
        $r[] = 'Sentence length barely varies (average ' . $m['avgSentence'] . ' words, spread ±' . $m['sentenceSd']
             . '). Mix in some 5–10 word sentences between the long ones — uniform rhythm is the strongest tell.';
    if ($m['longestRun'] >= 3)
        $r[] = 'Break up ' . $m['longestRun'] . ' consecutive sentences of 25+ words. Split each at its first comma and let one stand alone.';
    if ($found) {
        $top = array_slice(array_keys($found), 0, 4);
        $r[] = 'Replace stock phrasing: ' . implode(', ', array_map(function ($p) use ($found) { return '"' . $p . '" (' . $found[$p] . '×)'; }, $top))
             . '. Say the specific thing instead — what, for whom, at what cost.';
    }
    if ($sig['passive'] >= 45)
        $r[] = round($m['passiveRatio'] * 100) . '% of sentences are passive. Name the actor: "we replace the part", not "the part is replaced".';
    if ($sig['openers'] >= 45)
        $r[] = 'Too many sentences open the same way or with a stock transition (However, Moreover, Additionally). Delete the transition — the sentence usually works without it.';
    if ($sig['diversity'] >= 45)
        $r[] = 'Vocabulary repeats heavily (diversity ' . $m['mattr'] . '). Swap repeated abstractions for concrete nouns a customer would recognise.';
    if (($sig['tails'] ?? 0) >= 40)
        $r[] = ($m['tailSentences'] ?? 0) . ' sentences trail off into ", offering …" / ", ensuring …" / ", helping …". End the sentence at the comma and say the second part on its own: "That means …", or name who does it.';
    if (($sig['scaffold'] ?? 0) >= 40)
        $r[] = ($m['scaffoldSentences'] ?? 0) . ' sentences open with scaffolding ("With a …,", "Whether …", "When facing …", "By …ing"). Lead with the subject and the verb, and move the rest to the end or into its own sentence.';
    if (($sig['cadence'] ?? 0) >= 45)
        $r[] = 'Every sentence lands in the same mid-length band. Add one of four to seven words, and break the rhythm with a colon, a dash or a question.';
    if (($sig['formality'] ?? 0) >= 45)
        $r[] = 'The register is stiff (' . ($m['stiffPhrases'] ?? 0) . ' uncontracted or impersonal forms, ' . ($m['contractions'] ?? 0) . ' contractions). Write ' . "\"it's\", \"don't\", \"you\" and \"people\"" . ' where a person would say them.';
    if ($m['shortSentences'] === 0 && $sc >= 6)
        $r[] = 'There is not a single short sentence. Add two or three. They reset the reader.';
    $r[] = ($m['specifics'] ?? 0) > 0
        ? ($m['specifics'] . ' first-hand specific' . ($m['specifics'] === 1 ? '' : 's') . ' found (numbers, names, dated examples) — they lower this score. One more near the top of the page helps most.')
        : 'Add one first-hand specific — a name, a number, a date, a real outcome. Nothing else moves a page from generic to credible as quickly.';
    return $r;
}

// ---------------------------------------------------------------- pluggable external detector ----
// Native heuristics are the default and need no key. Supplying AI_DETECTOR_API_KEY in api/config.php switches
// the audit to an external provider. The request/response shape differs per vendor and changes over time, so
// this hook is deliberately generic: it POSTs {"text": …} with a bearer key and reads a numeric score out of the
// JSON at AI_DETECTOR_SCORE_PATH (dot notation). Verify the exact contract against your provider's current docs
// before relying on it — and if anything fails, the audit silently falls back to the native score.
function app_audit_provider(): string {
    return (defined('AI_DETECTOR_API_KEY') && trim((string)AI_DETECTOR_API_KEY) !== '')
        ? (defined('AI_DETECTOR_PROVIDER') ? (string)AI_DETECTOR_PROVIDER : 'custom') : 'native';
}
function app_audit_dig(array $j, string $path) {
    $cur = $j;
    foreach (explode('.', $path) as $k) {
        if (!is_array($cur) || !array_key_exists($k, $cur)) return null;
        $cur = $cur[$k];
    }
    return is_numeric($cur) ? (float)$cur : null;
}
function app_audit_external(string $text): ?array {
    if (app_audit_provider() === 'native' || !defined('AI_DETECTOR_ENDPOINT')) return null;
    $body = json_encode(['text' => $text]);
    $ctx = stream_context_create(['http' => [
        'method' => 'POST', 'timeout' => 12, 'ignore_errors' => true,
        'header' => "Content-Type: application/json\r\nAuthorization: Bearer " . AI_DETECTOR_API_KEY . "\r\n",
        'content' => $body,
    ]]);
    $raw = @file_get_contents((string)AI_DETECTOR_ENDPOINT, false, $ctx);
    if ($raw === false) return null;
    $j = json_decode($raw, true);
    if (!is_array($j)) return null;
    $path = defined('AI_DETECTOR_SCORE_PATH') ? (string)AI_DETECTOR_SCORE_PATH : 'score';
    $v = app_audit_dig($j, $path);
    if ($v === null) return null;
    if ($v <= 1) $v *= 100;                      // providers return 0–1 or 0–100
    $ai = (int)round(max(0, min(100, $v)));
    return ['ai_percentage' => $ai, 'human_percentage' => 100 - $ai, 'band' => app_audit_band($ai),
            'provider' => app_audit_provider()];
}
// The audit the app actually uses: external when configured and reachable, native otherwise.
function app_audit_run(string $text): array {
    $native = app_audit_score($text);
    $native['provider'] = 'native';
    $ext = app_audit_external(app_audit_plain($text));
    if ($ext) { $native = array_merge($native, $ext); }
    return $native;
}
