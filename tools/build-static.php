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
