#!/usr/bin/env node
// 3D Pearl & Gold banner for each of the 16 service pages, built from the "Hero Image Spec" in the owner's
// Services specification: a procedural Three.js scene per service (gold, pearl, glass and ivory over pearl silk),
// rendered in the three shapes Google asks for and written to assets/img/services/<page address>-16x9|4x3|1x1
// (.jpg and .webp). Used as the service page banner, the /services card image, og:image and in the structured data.
//
// Usage: node tools/build-service-banners.js [address ...]     (needs Playwright + Chromium and python3 with Pillow)
//        AOK_THREE_BASE=<url>  folder with three.module.min.js and addons/ (default: the jsDelivr CDN, three@0.160.0)
const fs = require('fs'), path = require('path'), os = require('os'), { execFileSync } = require('child_process');
let chromium; try { ({ chromium } = require('playwright')); } catch (e) { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const root = path.resolve(__dirname, '..');
const BASE = (process.env.AOK_THREE_BASE || 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/').replace(/\/?$/, '/');
const ADDONS = process.env.AOK_THREE_BASE ? BASE + 'addons/' : 'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/';
const ALL = ['kundli-birth-chart-reading', 'kundli-milan-marriage-matching', 'career-finance-consultation', 'dosha-analysis-remedies',
  'gemstone-recommendation', 'vedic-meditation-guidance', 'horoscopes-daily-weekly-monthly', 'birth-chart-generation',
  'love-or-arranged-marriage-astrology', 'live-astrologer-consultation', 'personalized-year-ahead-forecast', 'muhurat-auspicious-timing',
  'vedic-astrology-jyotish-deep-dives', 'karmic-past-life-astrology', 'child-naming-astrology-report', 'medical-astrology-holistic'];
const only = process.argv.slice(2), todo = only.length ? ALL.filter(k => only.includes(k)) : ALL;
const SIZES = [['16x9', 1200, 675], ['4x3', 1200, 900], ['1x1', 1200, 1200]], SS = 2;   // rendered at 2x, then downsampled

const SCENES = String.raw`
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const TAU = Math.PI * 2, V = (x, y, z) => new THREE.Vector3(x, y, z);
let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;

// ---------- materials ----------
const M = {
  gold: () => new THREE.MeshPhysicalMaterial({ color: 0xD9B56C, metalness: .92, roughness: .2, clearcoat: .5, clearcoatRoughness: .15 }),
  brushed: () => new THREE.MeshPhysicalMaterial({ color: 0xC9A35E, metalness: .88, roughness: .36 }),
  rose: () => new THREE.MeshPhysicalMaterial({ color: 0xE7B79A, metalness: .85, roughness: .24, clearcoat: .6 }),
  ivory: () => new THREE.MeshPhysicalMaterial({ color: 0xF4EEE4, roughness: .38, clearcoat: .55, clearcoatRoughness: .2, sheen: .4, sheenColor: new THREE.Color(0xFFF4E0) }),
  marble: () => new THREE.MeshPhysicalMaterial({ color: 0xF6F1E8, roughness: .22, clearcoat: .9, clearcoatRoughness: .08 }),
  pearl: (c) => new THREE.MeshPhysicalMaterial({ color: c || 0xF1E6D4, roughness: .15, clearcoat: .9, clearcoatRoughness: .06, iridescence: 1, iridescenceIOR: 1.25,
    iridescenceThicknessRange: [260, 640], sheen: .55, sheenRoughness: .4, sheenColor: new THREE.Color(0xF2D9B4), envMapIntensity: .85 }),
  glass: (c) => new THREE.MeshPhysicalMaterial({ color: c || 0xFFFFFF, metalness: 0, roughness: .06, transmission: 1, thickness: 1.2, ior: 1.5, clearcoat: 1, attenuationColor: new THREE.Color(0xFFF2DA), attenuationDistance: 3 }),
  frost: () => new THREE.MeshPhysicalMaterial({ color: 0xFFFFFF, roughness: .42, transmission: .92, thickness: .25, ior: 1.45, clearcoat: .6, clearcoatRoughness: .3 }),
  silver: () => new THREE.MeshPhysicalMaterial({ color: 0xE4E6EA, metalness: .9, roughness: .3, clearcoat: .4 }),
  bronze: () => new THREE.MeshPhysicalMaterial({ color: 0x6E5426, metalness: .8, roughness: .32, clearcoat: .7, clearcoatRoughness: .2 }),
  dark: () => new THREE.MeshPhysicalMaterial({ color: 0x3A3632, metalness: .3, roughness: .35, clearcoat: .8, transparent: true, opacity: .85 }),
  glow: (c, i) => new THREE.MeshStandardMaterial({ color: c || 0xFFE9B0, emissive: c || 0xFFD98A, emissiveIntensity: i || 1.6, roughness: .4 }),
};
function glowSprite(size, color, alpha) {
  const c = document.createElement('canvas'); c.width = c.height = 256; const x = c.getContext('2d'); const g = x.createRadialGradient(128, 128, 0, 128, 128, 128);
  const col = color || '232,190,110'; g.addColorStop(0, 'rgba(' + col + ',' + (alpha || .55) + ')'); g.addColorStop(.35, 'rgba(' + col + ',' + (alpha || .55) * .45 + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
  x.fillStyle = g; x.fillRect(0, 0, 256, 256); const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(c), depthWrite: false, transparent: true }));
  s.scale.set(size, size, 1); s.renderOrder = -1; return s;
}
const mesh = (geo, mat, f) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; if (f) f(m); return m; };
const torus = (r, t, mat, f) => mesh(new THREE.TorusGeometry(r, t, 24, 220), mat, f);
const sphere = (r, mat, f) => mesh(new THREE.SphereGeometry(r, 64, 48), mat, f);
const cyl = (r1, r2, h, mat, f, seg) => mesh(new THREE.CylinderGeometry(r1, r2, h, seg || 96), mat, f);
const box = (w, h, d, mat, f) => mesh(new THREE.BoxGeometry(w, h, d), mat, f);
const tube = (pts, r, mat, closed, f) => mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, !!closed), Math.max(64, pts.length * 8), r, 10, !!closed), mat, f);
const bar = (a, b, r, mat) => { const d = b.clone().sub(a), m = cyl(r, r, d.length(), mat, null, 12); m.position.copy(a).addScaledVector(d, .5); m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize()); return m; };
const ringPts = (r, n, y) => Array.from({ length: n }, (_, i) => V(Math.cos(i / n * TAU) * r, y || 0, Math.sin(i / n * TAU) * r));
function stars(n, r, y0, mat) { const g = new THREE.Group(); for (let i = 0; i < n; i++) { const u = rnd() * TAU, v = rnd() * .9 + .05, R = r * (.7 + rnd() * .5);
  const s = sphere(.012 + rnd() * .03, mat || M.glow(0xFFF3D0, 2.2)); s.castShadow = false; s.position.set(Math.cos(u) * R * Math.sin(v * Math.PI), y0 + Math.cos(v * Math.PI) * R * .55 + R * .35, Math.sin(u) * R * Math.sin(v * Math.PI) - R * .2); g.add(s); } g.userData.noFrame = true; return g; }
function petal(len, wid, mat) { const s = new THREE.Shape(); s.moveTo(0, 0); s.bezierCurveTo(wid, len * .25, wid * .8, len * .75, 0, len); s.bezierCurveTo(-wid * .8, len * .75, -wid, len * .25, 0, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: .02, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 3, curveSegments: 24 });
  const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, p.getZ(i) + Math.pow(y / len, 2) * len * .35); } g.computeVertexNormals(); return mesh(g, mat); }
function lotus(r, layers, mat, inner) { const g = new THREE.Group(); for (let L = 0; L < layers; L++) { const n = 8, len = r * (1 - L * .2), tilt = 1.15 - L * .38;
  for (let i = 0; i < n; i++) { const p = petal(len, len * .42, L === layers - 1 && inner ? inner : mat), a = (i + L * .5) / n * TAU; const holder = new THREE.Group(); holder.rotation.y = a; p.rotation.x = tilt; holder.add(p); g.add(holder); } }
  g.add(cyl(r * .16, r * .2, r * .12, M.gold(), m => m.position.y = r * .05)); return g; }
function gear(rOut, teeth, depth, mat) { const s = new THREE.Shape(), rIn = rOut * .86; for (let i = 0; i <= teeth * 4; i++) { const a = i / (teeth * 4) * TAU, r = (i % 4 === 1 || i % 4 === 2) ? rOut : rIn; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const h = new THREE.Path(); h.absarc(0, 0, rOut * .45, 0, TAU, true); s.holes.push(h); for (let k = 0; k < 6; k++) { const hp = new THREE.Path(), a = k / 6 * TAU; hp.absarc(Math.cos(a) * rOut * .66, Math.sin(a) * rOut * .66, rOut * .1, 0, TAU, true); s.holes.push(hp); }
  return mesh(new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 2, curveSegments: 48 }), mat, m => m.geometry.center()); }
function canvasTex(draw, size) { const c = document.createElement('canvas'); c.width = c.height = size || 1024; draw(c.getContext('2d'), c.width); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; }

// ---------- the 16 scenes ----------
const B = {};
B['kundli-birth-chart-reading'] = () => { const g = new THREE.Group(), gold = M.gold(), br = M.brushed();
  g.add(torus(1.55, .045, gold, m => m.rotation.x = Math.PI / 2), torus(1.55, .045, gold), torus(1.55, .035, br, m => { m.rotation.y = Math.PI / 2; }), torus(1.42, .03, br, m => { m.rotation.x = Math.PI / 2; m.rotation.y = .41; }));
  const band = new THREE.Group(); band.rotation.set(Math.PI / 2 - .41, 0, .2); g.add(band);
  band.add(mesh(new THREE.RingGeometry(1.72, 2.02, 180), M.brushed(), m => { m.material.side = THREE.DoubleSide; }), torus(1.72, .02, gold), torus(2.02, .028, gold));
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; band.add(box(.035, .3, .05, gold, m => { m.position.set(Math.cos(a) * 1.87, Math.sin(a) * 1.87, .02); m.rotation.z = a + Math.PI / 2; }), sphere(.05, M.pearl(), m => m.position.set(Math.cos(a + .26) * 1.87, Math.sin(a + .26) * 1.87, .06))); }
  g.add(sphere(.32, M.pearl()), bar(V(0, -1.9, 0), V(0, 1.9, 0), .025, gold), sphere(.07, gold, m => m.position.y = 1.92));
  g.add(cyl(.12, .2, .7, gold, m => m.position.y = -2.15), cyl(.75, .85, .12, gold, m => m.position.y = -2.52), cyl(.6, .75, .1, M.ivory(), m => m.position.y = -2.42));
  g.rotation.set(.12, -.5, .1); g.add(stars(60, 3.4, .5)); return { g, float: .0 }; };
B['kundli-milan-marriage-matching'] = () => { const g = new THREE.Group(), gold = M.gold();
  const r1 = torus(.95, .16, gold, m => { m.position.set(-.48, .35, 0); m.rotation.set(.2, .45, .1); }), r2 = torus(.95, .16, M.rose(), m => { m.position.set(.48, .35, 0); m.rotation.set(-.15, -.45, Math.PI / 2 + .25); });
  g.add(r1, r2, sphere(.12, M.glass(0xFFF6E8), m => m.position.set(-.48, 1.35, .05)));
  const y = new THREE.Group(); y.position.set(0, .35, -1.1); g.add(y); y.add(torus(1.9, .018, M.brushed()), torus(1.72, .012, M.brushed()));
  [0, Math.PI].forEach(o => { const p = [0, 1, 2].map(i => V(Math.cos(o + Math.PI / 2 + i * TAU / 3) * 1.6, Math.sin(o + Math.PI / 2 + i * TAU / 3) * 1.6, 0)); for (let i = 0; i < 3; i++) y.add(bar(p[i], p[(i + 1) % 3], .016, M.brushed())); });
  const l = lotus(.62, 3, M.pearl(0xF0D2C4), M.gold()); l.position.set(0, -.95, .75); g.add(l);
  g.add(cyl(1.25, 1.35, .14, M.marble(), m => m.position.y = -1.18), torus(1.3, .03, M.gold(), m => { m.rotation.x = Math.PI / 2; m.position.y = -1.11; }), glowSprite(4.5, '236,200,140', .4)); return { g }; };
B['career-finance-consultation'] = () => { const g = new THREE.Group(), gold = M.gold(), br = M.brushed();
  g.add(box(3.6, .2, 1.6, M.marble(), m => m.position.y = -1.9), cyl(.5, .62, .2, gold, m => m.position.y = -1.7), cyl(.06, .08, 2.9, gold, m => m.position.y = -.25), sphere(.12, gold, m => m.position.y = 1.25));
  const beam = new THREE.Group(); beam.position.y = 1.08; beam.rotation.z = .07; g.add(beam); beam.add(box(2.7, .07, .09, gold), sphere(.08, gold));
  [-1.3, 1.3].forEach(x => { const bowl = mesh(new THREE.LatheGeometry([V(0, 0, 0), V(.32, .02, 0), V(.5, .12, 0), V(.56, .2, 0)].map(v => new THREE.Vector2(v.x, v.y)), 64), br, m => { m.material.side = THREE.DoubleSide; m.position.set(x, -1.1, 0); });
    beam.add(bowl); [0, 1, 2].forEach(k => { const a = k / 3 * TAU; beam.add(bar(V(x, 0, 0), V(x + Math.cos(a) * .52, -.92, Math.sin(a) * .52), .007, gold)); }); });
  const gr = gear(1.05, 18, .14, br); gr.position.set(1.6, .2, -1.2); gr.rotation.set(0, -.4, 0); g.add(gr); const g2 = gear(.6, 12, .12, gold); g2.position.set(.55, 1.05, -1.5); g2.rotation.set(0, -.4, .2); g.add(g2);
  g.add(torus(2.3, .01, br, m => { m.rotation.x = Math.PI / 2.3; m.position.y = .2; }));
  [0, 1.7, 3.6, 5].forEach((a, i) => g.add(sphere(.09 + (i % 2) * .05, M.glow(0xFFE2A0, 1.8), m => m.position.set(Math.cos(a) * 2.3, .2 + Math.sin(a) * 2.3 * Math.cos(Math.PI / 2.3), Math.sin(a) * 2.3 * Math.sin(Math.PI / 2.3) * -1))));
  g.rotation.y = .35; return { g }; };
B['dosha-analysis-remedies'] = () => { const g = new THREE.Group();
  const l = lotus(1.25, 3, M.pearl(0xF4E3D2), M.gold()); l.position.y = -.5; g.add(l, glowSprite(5.2, '242,196,108', .62), sphere(.22, M.glow(0xFFE7A8, 2.4), m => m.position.y = -.2));
  g.add(torus(1.45, .022, M.gold(), m => { m.rotation.x = Math.PI / 2; m.position.y = -.6; }));
  // dark orbital shadows drifting up and away from the light, fading as they go
  [[1.55, .3, -.3, .15, .62], [-1.5, .5, -.5, .13, .5], [1.1, .9, -1.0, .1, .38], [-.9, 1.1, -1.1, .08, .28], [.3, 1.25, -1.3, .06, .2]].forEach(([x, y, z, r, o]) =>
    g.add(sphere(r, M.dark(), m => { m.position.set(x, y, z); m.material.opacity = o; m.castShadow = false; m.userData.noFrame = true; })));
  return { g, water: true }; };
B['gemstone-recommendation'] = () => { const g = new THREE.Group();
  const prof = [[0, -1.05], [.92, .02], [1.0, .12], [.66, .46], [0, .46]].map(([x, y]) => new THREE.Vector2(x, y));
  const gem = mesh(new THREE.LatheGeometry(prof, 16), new THREE.MeshPhysicalMaterial({ color: 0xF7C75A, metalness: 0, roughness: 0, transmission: .62, thickness: 1.4, ior: 1.77, specularIntensity: 1, clearcoat: 1,
    iridescence: .6, iridescenceIOR: 1.6, iridescenceThicknessRange: [200, 500], attenuationColor: new THREE.Color(0xE9A22F), attenuationDistance: .9, flatShading: true, envMapIntensity: 1.5 }), m => { m.position.y = .55; m.rotation.set(.12, .3, .04); m.scale.setScalar(1.15); });
  g.add(gem, glowSprite(3.4, '246,214,150', .5));
  [[-.9, 1.25, .4], [.95, .95, .5], [.15, 1.55, .3], [-.55, .2, .7]].forEach(([x, y, z]) => { const s = glowSprite(.5, '255,250,235', .95); s.position.set(x, y, z); g.add(s); });
  g.add(cyl(.5, .66, .55, M.ivory(), m => m.position.y = -.82), torus(.51, .035, M.gold(), m => { m.rotation.x = Math.PI / 2; m.position.y = -.55; }), cyl(.88, .95, .12, M.gold(), m => m.position.y = -1.14));
  const co = new THREE.Group(); co.position.y = -1.2; co.userData.noFrame = true; g.add(co); [1.5, 2.0, 2.5].forEach(r => co.add(torus(r, .008, M.brushed(), m => m.rotation.x = Math.PI / 2)));
  for (let i = 0; i < 24; i++) { const a = i / 24 * TAU; co.add(bar(V(Math.cos(a) * 2.0, 0, Math.sin(a) * 2.0), V(Math.cos(a) * (i % 2 ? 2.12 : 2.25), 0, Math.sin(a) * (i % 2 ? 2.12 : 2.25)), .008, M.brushed())); }
  return { g }; };
B['vedic-meditation-guidance'] = () => { const g = new THREE.Group(), body = M.bronze();
  const fig = new THREE.Group(); fig.position.y = -1.0; g.add(fig);
  fig.add(mesh(new THREE.TorusGeometry(.55, .17, 24, 80, Math.PI * 1.05), body, m => { m.rotation.set(Math.PI / 2, 0, Math.PI * -.02); m.scale.set(1.15, .85, 1); m.position.y = .12; }));
  fig.add(mesh(new THREE.CapsuleGeometry(.36, .55, 12, 32), body, m => { m.position.y = .82; m.scale.set(1, 1, .72); }), sphere(.24, body, m => m.position.y = 1.62), cyl(.09, .11, .16, body, m => m.position.y = 1.36));
  [-1, 1].forEach(s => { fig.add(mesh(new THREE.CapsuleGeometry(.09, .55, 8, 16), body, m => { m.position.set(s * .44, .78, .05); m.rotation.z = s * .35; }), mesh(new THREE.CapsuleGeometry(.08, .42, 8, 16), body, m => { m.position.set(s * .38, .34, .25); m.rotation.set(1.2, 0, -s * .9); })); });
  const crown = lotus(.32, 2, M.gold(), M.gold()); crown.position.y = 1.95; fig.add(crown, glowSprite(2.2, '255,214,130', .7)); fig.children[fig.children.length - 1].position.y = 2.05;
  fig.add(torus(.5, .012, M.glow(0xFFE2A0, 1.6), m => { m.position.set(0, 1.65, -.25); }));
  const dome = new THREE.Group(); dome.position.y = -1.0; g.add(dome);
  for (let i = 0; i < 6; i++) dome.add(mesh(new THREE.TorusGeometry(2.35, .01, 8, 160, Math.PI), M.brushed(), m => m.rotation.y = i / 6 * Math.PI));
  [.9, 1.6, 2.1].forEach(h => dome.add(torus(Math.sqrt(2.35 * 2.35 - h * h), .008, M.brushed(), m => { m.rotation.x = Math.PI / 2; m.position.y = h; })));
  g.add(stars(80, 2.6, .3), cyl(1.2, 1.3, .08, M.marble(), m => m.position.y = -1.04)); return { g }; };
B['horoscopes-daily-weekly-monthly'] = () => { const g = new THREE.Group(), gold = M.gold();
  const dial = new THREE.Group(); dial.rotation.set(-1.05, 0, .1); g.add(dial);
  dial.add(mesh(new THREE.RingGeometry(1.8, 2.25, 200), M.brushed(), m => m.material.side = THREE.DoubleSide), torus(1.8, .025, gold), torus(2.25, .035, gold), torus(1.2, .015, gold));
  for (let i = 0; i < 27; i++) { const a = i / 27 * TAU; dial.add(sphere(i % 9 === 0 ? .07 : .045, M.glow(0xFFF0C8, 2.6), m => m.position.set(Math.cos(a) * 2.02, Math.sin(a) * 2.02, .05))); }
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; dial.add(bar(V(Math.cos(a) * 1.2, Math.sin(a) * 1.2, 0), V(Math.cos(a) * 1.8, Math.sin(a) * 1.8, 0), .01, gold)); }
  const tex = canvasTex((x, s) => { x.fillStyle = '#D8DADF'; x.fillRect(0, 0, s, s); for (let i = 0; i < 160; i++) { const r = 6 + rnd() * 40, cx = rnd() * s, cy = rnd() * s; const gr = x.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, 'rgba(150,152,158,.28)'); gr.addColorStop(.7, 'rgba(180,182,188,.14)'); gr.addColorStop(1, 'rgba(230,232,236,0)'); x.fillStyle = gr; x.beginPath(); x.arc(cx, cy, r, 0, TAU); x.fill(); } }, 1024);
  const moon = sphere(.62, M.silver(), m => { m.material.map = tex; m.material.bumpMap = tex; m.material.bumpScale = .8; m.material.metalness = .55; m.material.roughness = .45; m.position.set(1.15, .75, .7); }); g.add(moon, glowSprite(2.4, '235,238,244', .5)); g.children[g.children.length - 1].position.copy(moon.position);
  g.add(cyl(2.4, 2.4, .02, M.ivory(), m => { m.position.y = -1.5; m.castShadow = false; m.userData.noFrame = true; })); return { g }; };
B['birth-chart-generation'] = () => { const g = new THREE.Group(), gold = M.brushed();
  const tab = new THREE.Group(); tab.rotation.set(-1.0, 0, .08); g.add(tab);
  const rr = new THREE.Shape(), w = 1.9, r = .18; rr.moveTo(-w + r, -w); rr.lineTo(w - r, -w); rr.quadraticCurveTo(w, -w, w, -w + r); rr.lineTo(w, w - r); rr.quadraticCurveTo(w, w, w - r, w); rr.lineTo(-w + r, w); rr.quadraticCurveTo(-w, w, -w, w - r); rr.lineTo(-w, -w + r); rr.quadraticCurveTo(-w, -w, -w + r, -w);
  tab.add(mesh(new THREE.ExtrudeGeometry(rr, { depth: .22, bevelEnabled: true, bevelThickness: .05, bevelSize: .05, bevelSegments: 4, curveSegments: 16 }), M.marble(), m => m.position.z = -.22));
  const s = 1.55, c = [V(-s, -s, .04), V(s, -s, .04), V(s, s, .04), V(-s, s, .04)], mid = [V(0, -s, .04), V(s, 0, .04), V(0, s, .04), V(-s, 0, .04)];
  for (let i = 0; i < 4; i++) { tab.add(bar(c[i], c[(i + 1) % 4], .035, gold), bar(mid[i], mid[(i + 1) % 4], .03, gold)); } tab.add(bar(c[0], c[2], .03, gold), bar(c[1], c[3], .03, gold));
  [[0, .78], [.78, 0], [0, -.78], [-.78, 0], [.95, .95], [-.95, -.95], [.5, 1.25], [-1.25, .5], [1.25, -.5]].forEach(([x, y], i) => tab.add(sphere(.07, i % 3 ? M.gold() : M.pearl(), m => m.position.set(x, y, .1))));
  g.add(stars(40, 3, .8)); return { g }; };
B['love-or-arranged-marriage-astrology'] = () => { const g = new THREE.Group();
  const path = s => Array.from({ length: 40 }, (_, i) => { const t = i / 39; return V(s * (2.3 - t * 2.1) * Math.cos(t * 1.4), .3 + Math.sin(t * Math.PI) * 1.1 * s * .5 + t * .2, -1.6 + t * 1.6 + s * Math.sin(t * 3) * .3); });
  g.add(tube(path(1), .022, M.gold()), tube(path(-1), .022, M.brushed()));
  const venus = sphere(.62, M.pearl(0xF4DED0), m => m.position.set(-.5, .55, .05)), jup = sphere(.8, M.gold(), m => { m.position.set(.65, .68, -.25); });
  jup.material.map = canvasTex((x, s) => { for (let i = 0; i < s; i += 8) { x.fillStyle = 'hsl(' + (36 + Math.sin(i * .05) * 6) + ',' + (45 + Math.sin(i * .11) * 15) + '%,' + (62 + Math.sin(i * .07) * 14) + '%)'; x.fillRect(0, i, s, 8); } }, 512);
  g.add(venus, jup, glowSprite(3.4, '245,205,150', .55), torus(1.6, .014, M.brushed(), m => { m.rotation.x = Math.PI / 2.4; m.position.y = .6; }), cyl(1.3, 1.4, .1, M.marble(), m => m.position.y = -.55));
  g.add(stars(50, 3.2, .4)); return { g }; };
B['live-astrologer-consultation'] = () => { const g = new THREE.Group();
  const panel = (w, h, x, y, z, ry, rz) => { const s = new THREE.Shape(), r = .16; s.moveTo(-w / 2 + r, -h / 2); s.lineTo(w / 2 - r, -h / 2); s.quadraticCurveTo(w / 2, -h / 2, w / 2, -h / 2 + r); s.lineTo(w / 2, h / 2 - r); s.quadraticCurveTo(w / 2, h / 2, w / 2 - r, h / 2); s.lineTo(-w / 2 + r, h / 2); s.quadraticCurveTo(-w / 2, h / 2, -w / 2, h / 2 - r); s.lineTo(-w / 2, -h / 2 + r); s.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + r, -h / 2);
    const p = new THREE.Group(); p.position.set(x, y, z); p.rotation.set(0, ry, rz); p.add(mesh(new THREE.ExtrudeGeometry(s, { depth: .05, bevelEnabled: true, bevelThickness: .02, bevelSize: .02, bevelSegments: 3 }), M.frost()));
    for (let i = 0; i < 3; i++) p.add(box(w * (.7 - i * .15), .06, .02, M.gold(), m => m.position.set(-w * .1 + i * .02, h * .22 - i * .2, .1))); p.add(sphere(.08, M.gold(), m => m.position.set(-w / 2 + .25, h / 2 - .25, .1))); g.add(p); };
  panel(1.9, 1.2, -1.15, .75, -.6, .35, .04); panel(1.6, 1.0, 1.25, 1.25, -.9, -.4, -.05); panel(1.4, .85, 1.05, -.15, .3, -.25, .03);
  const cp = new THREE.Group(); cp.position.set(-.25, -.55, .55); cp.rotation.set(-1.1, 0, .2); g.add(cp);
  cp.add(cyl(.62, .62, .12, M.gold(), m => m.rotation.x = Math.PI / 2), cyl(.54, .54, .13, M.ivory(), m => m.rotation.x = Math.PI / 2), torus(.62, .045, M.gold()));
  const nd = new THREE.Shape(); nd.moveTo(0, .45); nd.lineTo(.07, 0); nd.lineTo(0, -.45); nd.lineTo(-.07, 0); nd.closePath(); cp.add(mesh(new THREE.ExtrudeGeometry(nd, { depth: .03, bevelEnabled: false }), M.bronze(), m => { m.position.z = .08; m.rotation.z = .5; }));
  for (let i = 0; i < 4; i++) cp.add(box(.03, .12, .02, M.bronze(), m => { const a = i / 4 * TAU; m.position.set(Math.cos(a) * .45, Math.sin(a) * .45, .08); m.rotation.z = a + Math.PI / 2; }));
  g.add(glowSprite(5, '255,226,170', .35)); return { g }; };
B['personalized-year-ahead-forecast'] = () => { const g = new THREE.Group(), gold = M.gold();
  g.add(sphere(.62, new THREE.MeshPhysicalMaterial({ color: 0xF2B84B, emissive: 0xE8A43A, emissiveIntensity: .55, metalness: .5, roughness: .25, clearcoat: 1 })), glowSprite(3.4, '250,190,90', .6));
  for (let i = 0; i < 3; i++) g.add(torus(1.75, .02, M.brushed(), m => { m.rotation.y = i / 3 * Math.PI; }));
  const eq = new THREE.Group(); eq.rotation.x = Math.PI / 2 - .25; g.add(eq); eq.add(torus(1.95, .05, gold), torus(2.15, .015, gold));
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; eq.add(box(.06, .34, .1, gold, m => { m.position.set(Math.cos(a) * 2.05, Math.sin(a) * 2.05, 0); m.rotation.z = a + Math.PI / 2; }), sphere(.06, M.glow(0xFFF0C0, 2), m => m.position.set(Math.cos(a) * 2.45, Math.sin(a) * 2.45, 0)), bar(V(Math.cos(a) * .75, Math.sin(a) * .75, 0), V(Math.cos(a) * 1.25, Math.sin(a) * 1.25, 0), .012, M.glow(0xFFE2A0, 1.4))); }
  g.add(cyl(1.0, 1.25, .35, M.marble(), m => m.position.y = -2.1), cyl(.08, .14, .55, gold, m => m.position.y = -1.7)); return { g }; };
B['muhurat-auspicious-timing'] = () => { const g = new THREE.Group(), gold = M.gold();
  const a = new THREE.Group(); a.rotation.set(-.25, .35, .05); g.add(a);
  const plate = canvasTex((x, s) => { x.fillStyle = '#EFE3C8'; x.fillRect(0, 0, s, s); x.strokeStyle = 'rgba(120,88,36,.55)'; x.lineWidth = 2; const c = s / 2;
    for (let r = 60; r < c; r += 46) { x.beginPath(); x.arc(c, c, r, 0, TAU); x.stroke(); } for (let i = 0; i < 36; i++) { const t = i / 36 * TAU; x.beginPath(); x.moveTo(c, c); x.lineTo(c + Math.cos(t) * c, c + Math.sin(t) * c); x.stroke(); }
    for (let i = 0; i < 9; i++) { x.beginPath(); x.ellipse(c, c + i * 18, 80 + i * 40, 50 + i * 30, 0, 0, TAU); x.stroke(); } }, 1024);
  a.add(cyl(1.65, 1.65, .12, M.gold(), m => m.rotation.x = Math.PI / 2), cyl(1.48, 1.48, .13, new THREE.MeshPhysicalMaterial({ map: plate, metalness: .55, roughness: .35, clearcoat: .6 }), m => m.rotation.x = Math.PI / 2), torus(1.65, .06, gold));
  for (let i = 0; i < 72; i++) { const t = i / 72 * TAU; a.add(box(.012, i % 6 ? .07 : .14, .02, M.bronze(), m => { m.position.set(Math.cos(t) * 1.56, Math.sin(t) * 1.56, .08); m.rotation.z = t + Math.PI / 2; })); }
  const rete = new THREE.Group(); rete.position.z = .1; a.add(rete); rete.add(torus(1.0, .025, gold, m => m.position.y = .25), torus(1.4, .02, gold));
  for (let i = 0; i < 8; i++) { const t = i / 8 * TAU; rete.add(bar(V(Math.cos(t) * .2, Math.sin(t) * .2, 0), V(Math.cos(t) * 1.4, Math.sin(t) * 1.4, 0), .015, gold), mesh(new THREE.ConeGeometry(.05, .22, 12), gold, m => { m.position.set(Math.cos(t + .2) * 1.15, Math.sin(t + .2) * 1.15, 0); m.rotation.z = t - Math.PI / 2; })); }
  a.add(box(3.1, .07, .04, M.bronze(), m => { m.position.z = .16; m.rotation.z = .6; }), cyl(.08, .08, .1, gold, m => { m.rotation.x = Math.PI / 2; m.position.z = .18; }));
  a.add(torus(.24, .04, gold, m => m.position.y = 1.95), box(.24, .2, .1, gold, m => m.position.y = 1.72));
  for (let i = 0; i < 4; i++) g.add(mesh(new THREE.ConeGeometry(.35 + i * .1, 5.5, 32, 1, true), new THREE.MeshBasicMaterial({ color: 0xFFE7B0, transparent: true, opacity: .07, depthWrite: false, side: THREE.DoubleSide }), m => { m.castShadow = false; m.userData.noFrame = true; m.position.set(-1.6 + i * .8, 3.0, -1.6); m.rotation.z = -.35 + i * .05; }));
  return { g }; };
B['vedic-astrology-jyotish-deep-dives'] = () => { const g = new THREE.Group(), gold = M.gold();
  const md = new THREE.Group(); md.rotation.set(-1.0, 0, 0); g.add(md);
  const eng = canvasTex((x, s) => { x.fillStyle = '#F2EADB'; x.fillRect(0, 0, s, s); const c = s / 2; x.strokeStyle = 'rgba(150,112,48,.65)'; x.fillStyle = 'rgba(150,112,48,.7)';
    for (let r = 120; r < c - 10; r += 70) { x.lineWidth = 3; x.beginPath(); x.arc(c, c, r, 0, TAU); x.stroke(); }
    for (let i = 0; i < 27; i++) { const t = i / 27 * TAU; for (let k = 0; k < 5; k++) { x.beginPath(); x.arc(c + Math.cos(t + k * .02) * (c - 60), c + Math.sin(t + k * .02) * (c - 60), 3 + (k % 2) * 2, 0, TAU); x.fill(); } x.lineWidth = 2; x.beginPath(); x.moveTo(c + Math.cos(t) * 190, c + Math.sin(t) * 190); x.lineTo(c + Math.cos(t) * (c - 90), c + Math.sin(t) * (c - 90)); x.stroke(); } }, 1024);
  md.add(cyl(2.2, 2.2, .06, new THREE.MeshPhysicalMaterial({ map: eng, roughness: .3, clearcoat: .8, metalness: .2, emissive: 0x6E5426, emissiveIntensity: .12 }), m => m.rotation.x = Math.PI / 2));
  [[.55, 8, .5], [1.0, 12, .45], [1.5, 16, .4], [1.92, 18, .3]].forEach(([r, n, len], L) => { const ring = new THREE.Group(); ring.position.z = .08 + (3 - L) * .14; md.add(ring); ring.add(torus(r, .02, gold));
    for (let i = 0; i < n; i++) { const p = petal(len, len * .45, L % 2 ? M.gold() : M.pearl()), h = new THREE.Group(); h.rotation.z = i / n * TAU; p.position.y = r; p.rotation.x = .2; h.add(p); ring.add(h); } });
  md.add(sphere(.22, M.pearl(), m => m.position.z = .75), glowSprite(5, '240,200,120', .4)); return { g }; };
B['karmic-past-life-astrology'] = () => { const g = new THREE.Group(), gold = M.brushed();
  const portal = torus(1.15, .2, M.pearl(), m => { m.position.y = .35; }); g.add(portal);
  const disc = mesh(new THREE.CircleGeometry(1.0, 96), new THREE.MeshBasicMaterial({ map: canvasTex((x, s) => { const c = s / 2, gr = x.createRadialGradient(c, c, 0, c, c, c); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(.5, '#FFF2D4'); gr.addColorStop(1, '#E8C88A'); x.fillStyle = gr; x.fillRect(0, 0, s, s); }, 512), transparent: true, opacity: .9 }), m => { m.position.set(0, .35, -.02); m.castShadow = false; });
  g.add(disc, glowSprite(4, '250,220,160', .55));
  const pts = Array.from({ length: 140 }, (_, i) => { const t = i / 139, a = t * TAU * 1.15 + .4; return V(Math.cos(a) * (1.55 + .25 * Math.sin(t * 9)), .35 + Math.sin(a) * (1.55 + .25 * Math.sin(t * 9)), Math.sin(t * TAU * 2) * .45); });
  pts.forEach((p, i) => { const t = i / 139, r = .16 * Math.sin(Math.min(1, t * 1.15) * Math.PI * .5 + .05) * (1 - t * .6) + .025; g.add(sphere(r, i % 9 === 0 ? M.gold() : gold, m => m.position.copy(p))); });
  const h = pts[pts.length - 1]; g.add(mesh(new THREE.SphereGeometry(.17, 32, 24), M.gold(), m => { m.position.copy(h); m.scale.set(1.5, .8, .9); }));
  g.add(cyl(1.6, 1.7, .1, M.marble(), m => m.position.y = -1.55)); return { g }; };
B['child-naming-astrology-report'] = () => { const g = new THREE.Group(), gold = M.gold();
  const cr = new THREE.Group(); cr.rotation.y = -.55; g.add(cr);
  cr.add(mesh(new THREE.CylinderGeometry(.85, .85, 2.0, 64, 1, true, Math.PI, Math.PI), gold, m => { m.material.side = THREE.DoubleSide; m.rotation.z = Math.PI / 2; }));
  cr.add(mesh(new THREE.CylinderGeometry(.79, .79, 1.92, 64, 1, true, Math.PI, Math.PI), M.ivory(), m => { m.material.side = THREE.DoubleSide; m.rotation.z = Math.PI / 2; }));
  cr.add(torus(.85, .035, gold, m => { m.rotation.y = Math.PI / 2; m.position.x = 1.0; }), torus(.85, .035, gold, m => { m.rotation.y = Math.PI / 2; m.position.x = -1.0; }));
  [-1, 1].forEach(s => { cr.add(mesh(new THREE.CircleGeometry(.85, 64, Math.PI, Math.PI), gold, m => { m.material.side = THREE.DoubleSide; m.rotation.y = Math.PI / 2; m.position.x = s * 1.0; }));
    const rk = Array.from({ length: 24 }, (_, i) => { const z = -1.15 + i / 23 * 2.3; return V(s * .78, -1.12 + .2 * z * z, z); }); cr.add(tube(rk, .045, M.brushed()));
    cr.add(bar(V(s * .78, -.6, -.55), V(s * .78, -1.07, -.55), .035, gold), bar(V(s * .78, -.6, .55), V(s * .78, -1.07, .55), .035, gold)); });
  cr.add(mesh(new THREE.CapsuleGeometry(.3, 1.0, 12, 24), M.pearl(0xF6EEE6), m => { m.rotation.z = Math.PI / 2; m.position.y = -.38; m.scale.set(1, 1, .85); }));
  cr.add(sphere(.2, M.pearl(0xF8EFE6), m => m.position.set(.62, -.25, 0)));
  const cons = [[-1.5, 1.35, -.6], [-.85, 1.75, -.8], [-.15, 1.5, -.7], [.6, 1.9, -.9], [1.25, 1.55, -.6], [1.8, 1.95, -1.0]]; cons.forEach((p, i) => { g.add(sphere(.07, M.glow(0xFFF3D0, 2.6), m => m.position.set(...p))); if (i) g.add(bar(V(...cons[i - 1]), V(...p), .006, M.glow(0xFFE6B0, 1.2))); });
  g.add(stars(70, 3, .8), glowSprite(4, '245,215,165', .35)); return { g, pearlFloor: true }; };
B['medical-astrology-holistic'] = () => { const g = new THREE.Group(), gold = M.gold();
  g.add(cyl(.06, .07, 3.6, gold, m => m.position.y = .1), sphere(.16, gold, m => m.position.y = 1.98));
  [0, Math.PI].forEach((o, k) => { const pts = Array.from({ length: 60 }, (_, i) => { const t = i / 59; return V(Math.sin(t * TAU * 2.25 + o) * (.32 - t * .06), -1.5 + t * 3.0, Math.cos(t * TAU * 2.25 + o) * (.32 - t * .06)); }); g.add(tube(pts, .055, k ? M.brushed() : gold)); g.add(sphere(.09, gold, m => { m.position.copy(pts[59]); m.scale.set(1.4, .8, 1); })); });
  [-1, 1].forEach(s => { for (let i = 0; i < 6; i++) g.add(mesh(new THREE.SphereGeometry(.5, 32, 16), M.brushed(), m => { m.scale.set(.75 - i * .08, .1, .22); m.position.set(s * (.42 + i * .1), 1.72 + i * .07, 0); m.rotation.z = s * (.5 - i * .06); })); });
  const leafMat = new THREE.MeshPhysicalMaterial({ color: 0xB9A55A, metalness: .6, roughness: .32, clearcoat: .6 });
  const stem = Array.from({ length: 20 }, (_, i) => { const t = i / 19; return V(.6 + t * 1.6, -1.45 + Math.sin(t * 2) * .9, .6 - t * .4); }); g.add(tube(stem, .03, leafMat));
  stem.forEach((p, i) => { if (i % 3 || i < 2) return; [-1, 1].forEach(s => g.add(mesh(new THREE.SphereGeometry(.22, 24, 12), leafMat, m => { m.scale.set(1, .16, .45); m.position.copy(p).add(V(0, .08, s * .18)); m.rotation.set(s * .6, 0, .3); }))); });
  g.add(torus(1.55, .035, M.glow(0xFFE2A0, 1.5), m => { m.rotation.x = Math.PI / 2 - .3; m.position.y = .2; }), glowSprite(4.4, '245,210,140', .4));
  g.add(cyl(1.1, 1.2, .14, M.marble(), m => m.position.y = -1.62)); return { g }; };

// ---------- stage: pearl silk, light, camera ----------
// A pearl-white studio for reflections: warm white dome, cream horizon and soft-box panels (gold reads warm, not grey).
function pearlEnv() { const e = new THREE.Scene();
  const tex = canvasTex((x, s) => { const gr = x.createLinearGradient(0, 0, 0, s); gr.addColorStop(0, '#FFFFFF'); gr.addColorStop(.42, '#FBF5EA'); gr.addColorStop(.52, '#EAD9B8'); gr.addColorStop(.62, '#F3E8D4'); gr.addColorStop(1, '#C9B48C'); x.fillStyle = gr; x.fillRect(0, 0, s, s); }, 512);
  e.add(new THREE.Mesh(new THREE.SphereGeometry(20, 48, 24), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide })));
  [[-6, 8, 6, 7, 3], [7, 5, -4, 5, 2.5], [0, 10, -8, 9, 2], [-8, 2, -2, 3, 6]].forEach(([x, y, z, w, h]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: 0xFFFFFF, side: THREE.DoubleSide })); m.material.color.multiplyScalar(3); m.position.set(x, y, z); m.lookAt(0, 0, 0); e.add(m); });
  return e; }
let renderer;
window.renderBanner = async (key, w, h) => {
  seed = [...key].reduce((a, c) => a + c.charCodeAt(0) * 7, 11);
  if (!renderer) { renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true }); document.body.appendChild(renderer.domElement);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02; renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap; renderer.outputColorSpace = THREE.SRGBColorSpace; }
  renderer.setPixelRatio(1); renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px'; renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(), pmrem = new THREE.PMREMGenerator(renderer); scene.environment = pmrem.fromScene(pearlEnv(), .02).texture;
  const { g, water, pearlFloor } = B[key](); scene.add(g); g.updateMatrixWorld(true);
  // frame the piece itself (not the stars, glows or helper surfaces around it)
  const bb = new THREE.Box3(), tmp = new THREE.Box3();
  g.traverse(o => { if (!o.isMesh || o.isSprite) return; for (let q = o; q; q = q.parent) if (q.userData && q.userData.noFrame) return; o.geometry.computeBoundingBox(); tmp.copy(o.geometry.boundingBox).applyMatrix4(o.matrixWorld); bb.union(tmp); });
  const ctr = bb.getCenter(new THREE.Vector3()), size = bb.getSize(new THREE.Vector3());
  const floorY = bb.min.y - .18;
  // silk: concentric ripples around the piece plus a soft swell
  const geo = new THREE.PlaneGeometry(60, 60, 360, 360), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), r = Math.hypot(x - ctr.x, y + ctr.z); p.setZ(i, Math.sin(r * 2.4 - 1.2) * .16 * Math.exp(-r * .16) + Math.sin(x * .45 + y * .2) * .06 + Math.sin(y * .7 - x * .15) * .04); }
  geo.computeVertexNormals();
  const silk = new THREE.Mesh(geo, new THREE.MeshPhysicalMaterial({ color: pearlFloor ? 0xF3EAE2 : 0xEFE9E0, roughness: water ? .12 : .3, metalness: 0, sheen: .9, sheenRoughness: .3, sheenColor: new THREE.Color(0xFFFFFF), clearcoat: water ? 1 : .6, clearcoatRoughness: water ? .05 : .2, iridescence: pearlFloor ? .5 : 0, envMapIntensity: .7 }));
  silk.rotation.x = -Math.PI / 2; silk.position.y = floorY; silk.receiveShadow = true; scene.add(silk);
  scene.add(new THREE.HemisphereLight(0xFFFFFF, 0xE9DFCC, .45));
  const keyL = new THREE.DirectionalLight(0xFFE6BE, 2.0); keyL.position.set(-5, 9, 6); keyL.castShadow = true; keyL.shadow.mapSize.set(2048, 2048);
  Object.assign(keyL.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 30 }); keyL.shadow.bias = -.0003; keyL.shadow.normalBias = .02; keyL.shadow.radius = 6; scene.add(keyL);
  const rim = new THREE.DirectionalLight(0xFFF4E6, 1.1); rim.position.set(6, 4, -6); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xFFFFFF, .5); fill.position.set(2, 2, 9); scene.add(fill);
  const rake = new THREE.DirectionalLight(0xFFF6EA, .9); rake.position.set(9, 1.6, 2); scene.add(rake);   // low grazing light carves the silk ripples
  // camera: frame the piece's bounding sphere, slightly from above
  const cam = new THREE.PerspectiveCamera(30, w / h, .1, 200), tanV = Math.tan(THREE.MathUtils.degToRad(15)), asp = w / h, fillK = asp > 1.5 ? 1.3 : 1.24;
  const dist = Math.max(size.y * .5 * fillK / tanV, size.x * .5 * fillK / (tanV * asp)) + size.z * .55, dir = new THREE.Vector3(0, .42, 1).normalize();
  cam.position.copy(ctr).addScaledVector(dir, dist); cam.lookAt(ctr.x, ctr.y - size.y * .04, ctr.z);
  scene.fog = new THREE.Fog(0xF6F0E6, dist * 1.25, dist * 3.2);
  renderer.render(scene, cam);
  scene.traverse(o => { if (o.geometry) o.geometry.dispose(); }); pmrem.dispose();
  return true;
};
window.__ready = true;
`;

const html = `<!doctype html><html><head><meta charset="utf-8">
<script type="importmap">{"imports":{"three":"${BASE}three.module.min.js","three/addons/":"${ADDONS}"}}</script>
<style>html,body{margin:0;overflow:hidden;background:radial-gradient(120% 120% at 50% 38%,#FFFFFF 0%,#FAF6EF 42%,#EFE5D3 100%)}canvas{display:block}</style>
</head><body><script type="module">${SCENES}</script></body></html>`;

(async () => {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'aok-banner-'));
  const exe = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const b = await chromium.launch({ ...(fs.existsSync(exe) ? { executablePath: exe } : {}), args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const jobs = [];
  for (const key of todo) for (const [ratio, w, h] of SIZES) {
    const p = await b.newPage({ viewport: { width: w * SS, height: h * SS } });
    p.on('pageerror', e => console.error(key, e.message));
    if (process.env.AOK_THREE_BASE) await p.goto(new URL(BASE).origin + '/robots.txt', { waitUntil: 'commit' });   // same origin as the modules
    await p.setContent(html, { waitUntil: 'load' });
    await p.waitForFunction(() => window.__ready === true, null, { timeout: 60000 });
    await p.evaluate(([k, w, h]) => window.renderBanner(k, w, h), [key, w * SS, h * SS]);
    const png = path.join(tmp, `${key}-${ratio}.png`); await p.screenshot({ path: png }); await p.close();
    jobs.push([png, path.join(root, 'assets/img/services', `${key}-${ratio}`), w, h]); process.stdout.write('.');
  }
  await b.close(); fs.mkdirSync(path.join(root, 'assets/img/services'), { recursive: true });
  fs.writeFileSync(path.join(tmp, 'jobs.json'), JSON.stringify(jobs));
  execFileSync('python3', ['-c', `import json,sys
from PIL import Image
for png,out,w,h in json.load(open(sys.argv[1])):
    im=Image.open(png).convert('RGB').resize((w,h),Image.LANCZOS)
    im.save(out+'.jpg',quality=84,optimize=True,progressive=True)
    im.save(out+'.webp',quality=82,method=6)`, path.join(tmp, 'jobs.json')], { stdio: 'inherit' });
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${todo.length} services, ${jobs.length * 2} images written to assets/img/services/`);
})();
