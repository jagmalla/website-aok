<?php
// /llms.txt and /llms-full.txt (see .htaccess): a clean Markdown profile of the business for AI assistants
// (ChatGPT, Claude, Perplexity …), generated from the site content. Admin -> AI & GEO can replace either
// file with hand-written text.
require_once __DIR__ . '/discovery-lib.php';

header('Content-Type: text/plain; charset=utf-8');
header('X-AOK-Generated: llms');
echo aok_llms_text(aok_site(), !empty($_GET['full']));
