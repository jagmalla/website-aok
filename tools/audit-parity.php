<?php
// Proves the two AI-audit engines agree: api/ai-audit-lib.php (server) and the AUDIT-ENGINE block in
// assets/app.js (browser). They are the same maths written twice, which AR-12 allows but only if something
// checks them. Run after touching either:   php tools/audit-parity.php
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }
$root = dirname(__DIR__);
require $root . '/api/ai-audit-lib.php';

$cases = [
    'empty' => '',
    'tiny' => 'Hello there.',
    'generated' => "In today's fast-paced digital world, businesses must delve into the ever-evolving landscape of customer engagement. Moreover, it is important to note that a holistic approach plays a crucial role in driving measurable outcomes. Furthermore, the seamless integration of cutting-edge tools is considered a testament to operational maturity. Additionally, organisations that leverage the myriad of available platforms are positioned to unlock the potential of their data assets. Ultimately, when it comes to navigating the complexities of this rich tapestry, a robust solution is required.",
    'human' => "We replaced the gearbox on a 2011 Transit last Tuesday. It took four hours. The owner had been quoted 900 pounds elsewhere; we did it for 540 because the part came from a yard in Leeds. Most jobs are not that dramatic. Some are. What matters is that you get a straight number before we start, and we ring you if it changes. No surprises on the invoice.",
    'html' => '<p>The service <strong>is provided</strong> by our team.</p><p>It&#39;s a wide range of options &amp; more.</p><script>var x=1;</script>',
    'uniform' => 'The team builds the product well. The team ships the product fast. The team tests the product twice. The team scales the product often. The team guards the product data. The team tunes the product speed.',
    'longrun' => 'This particular sentence has been deliberately constructed so that it contains well over twenty five individual words in order to trigger the long sentence detector reliably. This second sentence has also been deliberately constructed with a great many words so that it likewise exceeds the twenty five word threshold comfortably. This third sentence continues the very same pattern with an abundance of additional words so the consecutive run counter reaches three.',
    // an unfilled kit page: placeholders must vanish in both engines, leaving only the real words
    'placeholders' => '<h1>{{HOME_HERO_H1}}</h1><p>{{HOME_HERO_SUB}}{{CTA_PRIMARY}} Serving {{PRIMARY_CITY}} and the surrounding area.</p>',
    // the structural signals: participial tails, scaffolded openers, flat cadence and stiff register
    'structural' => "With over fifteen years of clinical experience, our family practice delivers comprehensive care to patients of all ages, ensuring that every visit feels calm and unhurried. Whether managing a chronic condition or scheduling a routine check-up, patients receive attention that is tailored to their individual needs, helping them make informed decisions about their health. By combining modern diagnostic tools with a compassionate approach, the clinic creates an environment where individuals feel heard and respected. When dealing with complex symptoms, it is important to have a provider who listens carefully, taking the time to explain each option in plain language.",
    // the exceptions: a comma closing an "If …," clause, a gerund list, a gerund subject, -ing nouns, contractions
    'notails' => "If you're moving house, packing early helps. We do filing, checking, and posting for you. Parking is free behind the shop, and the entrance is step-free. Nothing is rushed, during the morning or the evening. It's quick: you don't wait — we ring you back (usually within the hour)!",
    // first-hand detail lowers the score; the same detail stuffed for SEO earns nothing
    'specifics' => "Our plumbing team provides fast, dependable repairs for homes across the region. The aim? Making sure every job meets a high standard. We have fixed boilers across Leeds since 2009. Last winter we restored heat to a care home in four hours, three days before Christmas.",
    'stuffedplace' => "Emergency Plumber in Leeds for every job. Our Emergency Plumber in Leeds team is fast. Call the Emergency Plumber in Leeds today. The Emergency Plumber in Leeds answers 24 hours a day since 2009.",
    // "H&C" is one word (the abbreviation repeated is not keyword stuffing), and ", applying X could …" is a gerund
    // subject, not a participial tail (", filing papers …" at the end still is one)
    'acronym' => "Humanitarian and Compassionate Grounds (H&C) cover people who fall outside the normal rules. The H&C provision recognises that, in some cases, applying the rules strictly could lead to real hardship. The H&C application looks at children, ties to Canada and hardship. The H&C process is discretionary, and R&D firms, B&B owners and families all use it, filing papers that set out their case.",
    // hidden characters: zero-width space and soft hyphen inside words, odd spaces, a Cyrillic "а" and Greek "ο" in
    // English words (mapped back), and a genuinely Russian word (left alone)
    'hidden' => "We re\u{200B}place boil\u{00AD}ers across Leeds\u{2009}every week. Our pаssword-free bοoking takes two minutes,\u{202F}and we say спасибо to every customer who books.",
    // an "AI detector bypass" tool's output (github.com/Oct4Pie/zero-zerogpt): every space replaced by thin space +
    // word joiner + thin space. Both engines must read it exactly as the plain sentence.
    'bypass' => str_replace(' ', "\u{2009}\u{2060}\u{2009}", "In today's fast-paced world, our firm delivers seamless solutions, ensuring that every client receives a holistic approach that plays a crucial role in their success."),
    'unicode' => "Our team doesn\u{2019}t cut corners \u{2014} ever. Café opening hours change in spring, so check first. Drawing on decades of work, the firm resolves disputes. Individuals cannot be expected to do it alone; one's family matters too.",
];

// run the browser engine: slice the marked block out of app.js and drive it with node. Outside the full kit (the
// retrofit package) there is no app.js, only the same block shipped on its own as assets/audit-engine.js.
$jsFile = is_file($root . '/assets/app.js') ? $root . '/assets/app.js' : $root . '/assets/audit-engine.js';
$js = (string)@file_get_contents($jsFile);
$a = strpos($js, '/* AUDIT-ENGINE-START'); $b = strpos($js, '/* AUDIT-ENGINE-END */');
if ($a === false || $b === false) { fwrite(STDERR, "audit engine markers not found in " . basename($jsFile) . "\n"); exit(1); }
$block = substr($js, $a, $b - $a);
$tmp = sys_get_temp_dir() . '/app_audit_parity_' . getmypid();
file_put_contents($tmp . '.js', $block . "\nconst __c=JSON.parse(require('fs').readFileSync(process.argv[2],'utf8'));\n"
    . "process.stdout.write(JSON.stringify(__c.map(function(t){ var r=auditScore(t); return {w:r.words,s:r.sentences,ai:r.ai_percentage,band:r.band,sig:r.signals,recs:r.recommendations.length,fl:r.highlighted_spans.map(function(x){ return x.i+':'+x.flags.join('+'); })}; })));\n");
file_put_contents($tmp . '.json', json_encode(array_values($cases)));
$out = shell_exec('node ' . escapeshellarg($tmp . '.js') . ' ' . escapeshellarg($tmp . '.json') . ' 2>&1');
@unlink($tmp . '.js'); @unlink($tmp . '.json');
$jsRes = json_decode((string)$out, true);
if (!is_array($jsRes)) { fwrite(STDERR, "node run failed:\n" . $out . "\n"); exit(1); }

$fail = 0; $i = 0;
foreach ($cases as $name => $text) {
    $p = app_audit_score($text);
    $php = ['w' => $p['words'], 's' => $p['sentences'], 'ai' => $p['ai_percentage'], 'band' => $p['band'],
            'sig' => array_map('intval', $p['signals']), 'recs' => count($p['recommendations']),
            'fl' => array_map(function ($x) { return $x['i'] . ':' . implode('+', $x['flags']); }, $p['highlighted_spans'])];
    $j = $jsRes[$i++];
    $j['sig'] = array_map('intval', $j['sig']);
    $same = $php === $j;
    if (!$same) { $fail++; }
    printf("%-12s php(ai=%2d w=%3d s=%2d %-5s)  js(ai=%2d w=%3d s=%2d %-5s)  %s\n",
        $name, $php['ai'], $php['w'], $php['s'], $php['band'], $j['ai'], $j['w'], $j['s'], $j['band'],
        $same ? 'MATCH' : 'DIFF');
    if (!$same) { echo "   php: ", json_encode($php), "\n   js : ", json_encode($j), "\n"; }
}
echo $fail === 0 ? "\nPARITY OK — both engines agree on all " . count($cases) . " cases\n"
                 : "\nPARITY FAILED on $fail case(s)\n";
exit($fail === 0 ? 0 : 1);
