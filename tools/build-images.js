#!/usr/bin/env node
// Branded Pearl & Gold images for every blog post, in the three shapes Google asks for
// (16:9, 4:3 and 1:1, 1200px wide), written to assets/img/posts/<slug>-16x9.jpg|webp,
// -4x3.jpg and -1x1.jpg. The site uses them in the structured data, as the social-media image and on
// the blog cards whenever no image has been uploaded for that page.
//
// Usage: node tools/build-images.js [slug ...]      (needs Playwright + Chromium and python3 with Pillow)
//        AOK_FONT_CSS=<url>  use another stylesheet for the two brand fonts (default: Google Fonts)
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const root = path.resolve(__dirname, '..');
const d = JSON.parse(fs.readFileSync(path.join(root, 'api/defaults.json'), 'utf8'));
const slug = t => t.toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
const text = s => String(s || '').replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const only = process.argv.slice(2);
const items = [];
// (services have their own 3D banners: tools/build-service-banners.js)
for (const p of [...d._seedPosts, ...d.blog]) if (p.published && !p.redirectTo) items.push({ kind: 'posts', key: p.slug, title: text(p.title), kicker: 'Jyotish Journal' });
const todo = only.length ? items.filter(x => only.includes(x.key)) : items;

const logo = 'data:image/png;base64,' + fs.readFileSync(path.join(root, 'assets/logo-512.png')).toString('base64');
const fontCss = process.env.AOK_FONT_CSS || 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600&family=Cormorant+Garamond:ital,wght@0,600;1,600&display=block';
const SIZES = [['16x9', 1200, 675], ['4x3', 1200, 900], ['1x1', 1200, 1200]];

// a quiet zodiac wheel: 12 signs, 27 Nakshatra points, rotated a little differently for every page
function wheel(seed) {
  const c = 250, ticks = [], dots = [];
  for (let i = 0; i < 12; i++) { const a = (i * 30) * Math.PI / 180; ticks.push(`<line x1="${c + 168 * Math.cos(a)}" y1="${c + 168 * Math.sin(a)}" x2="${c + 238 * Math.cos(a)}" y2="${c + 238 * Math.sin(a)}"/>`); }
  for (let i = 0; i < 27; i++) { const a = (i * 360 / 27) * Math.PI / 180; dots.push(`<circle cx="${c + 222 * Math.cos(a)}" cy="${c + 222 * Math.sin(a)}" r="${i % 9 === 0 ? 4 : 2.2}"/>`); }
  return `<svg class="wheel" viewBox="0 0 500 500" style="transform:rotate(${seed % 30}deg)"><g fill="none" stroke="#A68446" stroke-opacity=".55" stroke-width="1.4">
    <circle cx="250" cy="250" r="238"/><circle cx="250" cy="250" r="206" stroke-opacity=".3"/><circle cx="250" cy="250" r="168"/>${ticks.join('')}</g>
    <g fill="#A68446" fill-opacity=".7">${dots.join('')}</g></svg>`;
}

function html(it, ratio, w, h) {
  const seed = [...it.key].reduce((a, ch) => a + ch.charCodeAt(0), 0);
  return `<!doctype html><html><head><meta charset="utf-8"><base href="${new URL(fontCss).origin}/"><link href="${fontCss}" rel="stylesheet"><style>
html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}
body{background:radial-gradient(${w * .8}px ${h * .85}px at ${ratio === '1x1' ? '50% 30%' : '76% 42%'},#fff 0%,#FAF8F5 46%,#EFE6D4 100%);font-family:'Plus Jakarta Sans',sans-serif;color:#3A3D42;position:relative}
.frame{position:absolute;inset:26px;border:1.5px solid rgba(166,132,70,.55);border-radius:28px}
.frame:after{content:'';position:absolute;inset:10px;border:1px solid rgba(166,132,70,.25);border-radius:20px}
.art{position:absolute}.art .wheel{position:absolute;inset:0;width:100%;height:100%}
.art img{position:absolute;left:18%;top:18%;width:64%;height:64%;filter:drop-shadow(0 22px 34px rgba(110,84,38,.28))}
.kick{font:600 17px 'Plus Jakarta Sans';letter-spacing:.22em;text-transform:uppercase;color:#8C6D33}
h1{font:600 64px/1.04 'Cormorant Garamond',serif;color:#1E2022;margin:20px 0 0;letter-spacing:-.005em}
.rule{width:96px;height:2px;background:linear-gradient(90deg,#A68446,#DFC286);margin:28px 0 22px}
.by{font:500 22px/1.45 'Plus Jakarta Sans';color:#3A3D42}.by b{font-weight:600;color:#8C6D33}
.foot{position:absolute;bottom:68px;font:600 17px 'Plus Jakarta Sans';color:#8C6D33;letter-spacing:.04em}
.foot span{color:#6B6E73;font-weight:500;letter-spacing:0}
.r16x9 .art{right:70px;top:${(h - 470) / 2}px;width:470px;height:470px}.r16x9 .txt{position:absolute;left:96px;top:96px;width:560px}
.r4x3 .art{right:70px;top:${(h - 520) / 2 - 20}px;width:520px;height:520px}.r4x3 .txt{position:absolute;left:96px;top:120px;width:520px}
.r1x1 .art{left:${(w - 540) / 2}px;top:96px;width:540px;height:540px}.r1x1 .txt{position:absolute;left:110px;right:110px;top:680px;text-align:center}.r1x1 .rule{margin:24px auto 20px}
.r16x9 .foot,.r4x3 .foot{left:96px}.r1x1 .foot{left:0;right:0;text-align:center}
</style></head><body class="r${ratio}"><div class="frame"></div>
<div class="art">${wheel(seed)}<img src="${logo}" alt=""></div>
<div class="txt"><div class="kick">${it.kicker}</div><h1 id="t">${it.title.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</h1><div class="rule"></div>
<div class="by">with <b>Jag Mallah</b> · Analysis of Karma</div></div>
<div class="foot">www.analysisofkarma.com <span>· Surrey, BC · Online worldwide</span></div></body></html>`;
}

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aok-img-'));
  const b = await chromium.launch(fs.existsSync('/opt/pw-browsers/chromium-1194/chrome-linux/chrome') ? { executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' } : {});
  const jobs = [];
  for (const it of todo) for (const [ratio, w, h] of SIZES) {
    const p = await b.newPage({ viewport: { width: w, height: h } });
    // a local font stylesheet is loaded same-origin (fonts from another origin need CORS headers)
    if (process.env.AOK_FONT_CSS) await p.goto(new URL(fontCss).origin + '/robots.txt', { waitUntil: 'commit' });
    await p.setContent(html(it, ratio, w, h), { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    if (!await p.evaluate(() => document.fonts.check("600 40px 'Cormorant Garamond'"))) console.warn('warning: brand fonts did not load for ' + it.key);
    // shrink long titles until they fit their space
    await p.evaluate(([max, ratio, h]) => { const t = document.getElementById('t'); let s = ratio === '4x3' ? 70 : 64; t.style.fontSize = s + 'px';
      while (t.offsetHeight > max && s > 34) { s -= 2; t.style.fontSize = s + 'px'; }
      if (ratio !== '1x1') { const x = document.querySelector('.txt'); x.style.top = Math.max(80, Math.round((h - 120 - x.offsetHeight) / 2)) + 'px'; }   // centred above the footer line
    }, [ratio === '1x1' ? 200 : ratio === '4x3' ? 380 : 300, ratio, h]);
    const png = path.join(tmp, `${it.kind}-${it.key}-${ratio}.png`);
    await p.screenshot({ path: png }); await p.close();
    jobs.push([png, path.join(root, 'assets/img', it.kind, `${it.key}-${ratio}`), ratio === '16x9' ? 1 : 0]);
  }
  await b.close();
  for (const k of ['posts']) fs.mkdirSync(path.join(root, 'assets/img', k), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'jobs.json'), JSON.stringify(jobs));
  execFileSync('python3', ['-c', `import json,sys
from PIL import Image
for png,out,webp in json.load(open(sys.argv[1])):
    im=Image.open(png).convert('RGB')
    im.save(out+'.jpg',quality=82,optimize=True,progressive=True)
    if webp: im.save(out+'.webp',quality=80,method=6)`, path.join(tmp, 'jobs.json')], { stdio: 'inherit' });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`${todo.length} pages, ${jobs.length} images written to assets/img/`);
})();
