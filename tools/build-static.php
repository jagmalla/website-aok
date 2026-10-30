<?php
// Writes the static fallback copies of robots.txt, sitemap.xml, llms.txt and llms-full.txt into the site
// root, from the shipped content (api/defaults.json), using the same generators as the live endpoints.
// The live site serves the generated versions (see .htaccess); these files are only used if rewriting
// is unavailable.  Run after `node tools/build-defaults.js`:   php tools/build-static.php
if (PHP_SAPI !== 'cli') { http_response_code(403); exit; }
define('AOK_OFFLINE', true);   // no database: everything comes from api/defaults.json
$_SERVER['REQUEST_METHOD'] = 'GET';
$_SERVER['HTTP_HOST'] = 'www.analysisofkarma.com';
$root = dirname(__DIR__);

$build = function (string $script, array $get = []) use ($root): string {
    $_GET = $get;
    ob_start();
    include $root . '/api/' . $script;
    return (string)ob_get_clean();
};
$files = [
    'robots.txt' => $build('robots.php'),
    'sitemap.xml' => $build('sitemap.php'),
    'llms.txt' => $build('llms.php'),
    'llms-full.txt' => $build('llms.php', ['full' => '1']),
];
foreach ($files as $name => $text) {
    if (strlen($text) < 100) { fwrite(STDERR, "refusing to write a near-empty $name\n"); exit(1); }
    file_put_contents($root . '/' . $name, $text);
    echo str_pad($name, 15), strlen($text), " bytes\n";
}

// index.html is served as-is when render.php isn't in front of it (no .htaccess yet), so its script links
// carry a version from each file's content: any change to app.js / hero3d.js gives browsers a new URL.
$idx = $root . '/index.html';
$html = (string)file_get_contents($idx);
$html = preg_replace_callback('#/assets/([a-z0-9_-]+\.js)\?v=[A-Za-z0-9]*#i', function ($m) use ($root) {
    $f = $root . '/assets/' . $m[1];
    return '/assets/' . $m[1] . '?v=' . (is_file($f) ? substr(md5_file($f), 0, 10) : '1');
}, $html);
file_put_contents($idx, $html);
echo "index.html     script versions updated\n";
