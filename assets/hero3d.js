/* Hero 3D scene (Three.js via import map): pearl silk, golden astronomical dial, glass & pearl orbs */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const MOBILE=matchMedia('(max-width:860px),(pointer:coarse)').matches;
const REDUCE=matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAU=Math.PI*2;

/* Silk height field, shared by the vertex shader (displacement + analytic normal):
   concentric ripples under the dial, a slow silk swell, and a ripple that follows the cursor. */
const SILK_H=`
uniform float uTime; uniform vec2 uMouse; uniform float uMouseAmt; uniform vec2 uCenter; varying vec2 vSilk;
float silkH(vec2 p){
  float r=length(p-uCenter);
  float h=sin(r*3.0-uTime*1.3)*.24*exp(-r*.065);
  h+=sin(p.x*.42+uTime*.45)*.07+sin(p.y*.63-uTime*.38+p.x*.21)*.05+sin((p.x+p.y)*.9+uTime*.7)*.035;
  float m=length(p-uMouse);
  return h+sin(m*3.6-uTime*3.2)*.09*exp(-m*.55)*uMouseAmt;
}`;
/* Procedural water caustics, tinted gold — the light "focused" by the dial onto the silk. */
const CAUSTIC=`
uniform vec2 uCaustic; uniform float uCausticAmt;
float caustic(vec2 uv,float t){
  vec2 p=mod(uv*6.28318,6.28318)-250.; vec2 i=p; float c=1.; const float inten=.005;
  for(int n=0;n<4;n++){ float tt=t*(1.-(3.5/float(n+1)));
    i=p+vec2(cos(tt-i.x)+sin(tt+i.y),sin(tt-i.y)+cos(tt+i.x));
    c+=1./length(vec2(p.x/(sin(i.x+tt)/inten),p.y/(cos(i.y+tt)/inten))); }
  c/=4.; c=1.17-pow(c,1.4); return clamp(pow(abs(c),4.),0.,1.);
}`;

function silkMaterial(uniforms){
  const m=new THREE.MeshPhysicalMaterial({ color:0xEEE9E1, roughness:.32, metalness:0, sheen:.8, sheenRoughness:.3, envMapIntensity:.7,
    sheenColor:new THREE.Color(0xFFFFFF), clearcoat:.65, clearcoatRoughness:.18 });
  m.onBeforeCompile=sh=>{
    Object.assign(sh.uniforms,uniforms);
    sh.vertexShader=SILK_H+'\n'+sh.vertexShader
      .replace('#include <beginnormal_vertex>',`float se=.06; vec2 sp=position.xy; float sh0=silkH(sp);
        vec3 objectNormal=normalize(vec3(-(silkH(sp+vec2(se,0.))-sh0)/se,-(silkH(sp+vec2(0.,se))-sh0)/se,1.));
        #ifdef USE_TANGENT
          vec3 objectTangent=vec3(tangent.xyz);
        #endif`)
      .replace('#include <begin_vertex>','vec3 transformed=vec3(position.xy,position.z+sh0); vSilk=position.xy;');
    sh.fragmentShader='uniform float uTime; varying vec2 vSilk;\n'+CAUSTIC+'\n'+sh.fragmentShader
      // warm the silk's albedo inside the pool, then add saturated gold caustic lines (kept below the
      // tone-mapping shoulder so they read as gold rather than blowing out to white)
      .replace('#include <color_fragment>',`#include <color_fragment>
        vec2 cq=(vSilk-uCaustic)*vec2(.3,.4); float pool=exp(-dot(cq,cq)); float cst=caustic(vSilk*.34,uTime*.35);
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.93,.76,.46),pool*.7*uCausticAmt);`)
      .replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        totalEmissiveRadiance+=vec3(.95,.6,.16)*cst*pool*1.5*uCausticAmt;`);
  };
  return m;
}

/* Pearl dial face: guilloché rosette, minute track, Roman numerals, 12 rashi divisions, 27 nakshatra marks. */
function dialTexture(size){
  const c=document.createElement('canvas'); c.width=c.height=size; const x=c.getContext('2d'); const C=size/2,k=size/1024;
  const g=x.createRadialGradient(C*.78,C*.7,0,C,C,C); g.addColorStop(0,'#FFFFFF'); g.addColorStop(.62,'#F7F2EA'); g.addColorStop(1,'#E8DDC8');
  x.fillStyle=g; x.beginPath(); x.arc(C,C,C,0,TAU); x.fill();
  x.strokeStyle='rgba(166,132,70,.15)'; x.lineWidth=1.1*k;
  for(let i=0;i<72;i++){ const a=i/72*TAU; x.beginPath(); x.arc(C+Math.cos(a)*112*k,C+Math.sin(a)*112*k,196*k,0,TAU); x.stroke(); }
  const ring=(r,w,col)=>{ x.strokeStyle=col; x.lineWidth=w*k; x.beginPath(); x.arc(C,C,r*k,0,TAU); x.stroke(); };
  const P=(r,a)=>[C+Math.sin(a)*r*k,C-Math.cos(a)*r*k];
  ring(500,7,'rgba(166,132,70,.55)'); ring(470,2,'rgba(166,132,70,.6)'); ring(372,2,'rgba(166,132,70,.6)'); ring(350,1.2,'rgba(166,132,70,.45)'); ring(128,1.5,'rgba(166,132,70,.45)');
  for(let i=0;i<60;i++){ const a=i/60*TAU,L=i%5?14:30; x.strokeStyle='rgba(96,70,26,.85)'; x.lineWidth=(i%5?2.2:5)*k;
    x.beginPath(); x.moveTo(...P(496-L,a)); x.lineTo(...P(496,a)); x.stroke(); }
  const R=['XII','I','II','III','IV','V','VI','VII','VIII','IX','X','XI'];
  x.fillStyle='#5A4216'; x.textAlign='center'; x.textBaseline='middle'; x.font=`700 ${68*k}px 'Cormorant Garamond',Georgia,serif`;
  for(let i=0;i<12;i++){ const a=i/12*TAU; x.save(); x.translate(...P(421,a)); x.rotate(a); x.fillText(R[i],0,0); x.restore(); }
  x.strokeStyle='rgba(166,132,70,.34)'; x.lineWidth=1.5*k;
  for(let i=0;i<12;i++){ const a=(i+.5)/12*TAU; x.beginPath(); x.moveTo(...P(132,a)); x.lineTo(...P(348,a)); x.stroke(); }
  x.fillStyle='rgba(166,132,70,.62)';
  for(let i=0;i<27;i++){ x.beginPath(); x.arc(...P(330,i/27*TAU),5*k,0,TAU); x.fill(); }
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;
}

function hand(len,w,mat){
  const s=new THREE.Shape(); s.moveTo(-w*.5,-len*.16); s.lineTo(w*.5,-len*.16); s.lineTo(w*.3,len*.8); s.lineTo(0,len); s.lineTo(-w*.3,len*.8); s.closePath();
  const m=new THREE.Mesh(new THREE.ExtrudeGeometry(s,{depth:.022,bevelEnabled:true,bevelThickness:.008,bevelSize:.008,bevelSegments:1}),mat);
  m.castShadow=true; return m;
}

/* Build one scene bound to a container. Returns { el, dispose } so SPA route changes can tear it down. */
async function createHero(el){
  let r;
  try{ r=new THREE.WebGLRenderer({alpha:true,antialias:!MOBILE,powerPreference:'high-performance'}); }catch(e){ return null; }
  if(!r.getContext()) return null;
  // fonts first, so the numerals are drawn in Cormorant (never wait more than 1.5s)
  try{ await Promise.race([document.fonts.load("600 66px 'Cormorant Garamond'",'XII'),new Promise(res=>setTimeout(res,1500))]); }catch(e){}
  if(!el.isConnected){ r.dispose(); return null; }

  r.setPixelRatio(Math.min(window.devicePixelRatio||1,MOBILE?1.5:2));
  r.setClearColor(0x000000,0); r.toneMapping=THREE.ACESFilmicToneMapping; r.toneMappingExposure=1.0;
  r.shadowMap.enabled=!MOBILE; r.shadowMap.type=THREE.PCFSoftShadowMap;
  el.appendChild(r.domElement); el.classList.add('is-live');

  const scene=new THREE.Scene();
  const pmrem=new THREE.PMREMGenerator(r); const envTex=pmrem.fromScene(new RoomEnvironment(),.04).texture; scene.environment=envTex;
  const cam=new THREE.PerspectiveCamera(32,1,.1,120);

  scene.add(new THREE.HemisphereLight(0xFFFFFF,0xE9DFCC,.4));
  const rake=new THREE.DirectionalLight(0xFFF6EA,.95); rake.position.set(9,2.2,3); scene.add(rake); // low grazing light carves the silk ripples
  const key=new THREE.DirectionalLight(0xFFE2B4,1.7); key.position.set(-4.5,9,-4); key.castShadow=!MOBILE;
  key.shadow.mapSize.set(1024,1024); Object.assign(key.shadow.camera,{left:-7,right:7,top:7,bottom:-7,near:1,far:30});
  key.shadow.bias=-.0004; key.shadow.normalBias=.02; scene.add(key);
  const fill=new THREE.DirectionalLight(0xFFFFFF,.55); fill.position.set(2,3,9); scene.add(fill);

  // silk
  const uniforms={ uTime:{value:0}, uMouse:{value:new THREE.Vector2(99,99)}, uMouseAmt:{value:0}, uCenter:{value:new THREE.Vector2(0,0)},
    uCaustic:{value:new THREE.Vector2(1.1,-.4)}, uCausticAmt:{value:1.0} };
  const silk=new THREE.Mesh(new THREE.PlaneGeometry(64,60,MOBILE?150:300,MOBILE?140:280),silkMaterial(uniforms));
  silk.rotation.x=-Math.PI/2; silk.position.y=-1.7; silk.receiveShadow=true; scene.add(silk);

  // stage: dial + orbits (parallax rotates the stage, never the silk)
  const stage=new THREE.Group(); scene.add(stage);
  const gold=new THREE.MeshPhysicalMaterial({color:0xD2AE68,metalness:.85,roughness:.2,clearcoat:.5,clearcoatRoughness:.15});
  const brushed=new THREE.MeshPhysicalMaterial({color:0xC9A35E,metalness:.85,roughness:.34,side:THREE.DoubleSide});
  const steel=new THREE.MeshPhysicalMaterial({color:0x23262B,metalness:.9,roughness:.28,clearcoat:1,clearcoatRoughness:.1});
  const dialTex=dialTexture(MOBILE?1024:2048);
  const faceMat=new THREE.MeshPhysicalMaterial({map:dialTex,color:0xEFE8DC,roughness:.34,clearcoat:.6,clearcoatRoughness:.12,iridescence:.22,iridescenceIOR:1.3,envMapIntensity:.8});
  const dial=new THREE.Group(); dial.position.set(0,.75,0); dial.rotation.set(-.92,-.42,.14); stage.add(dial);
  const add=(geo,mat,setup)=>{ const m=new THREE.Mesh(geo,mat); m.castShadow=true; if(setup) setup(m); dial.add(m); return m; };
  add(new THREE.CircleGeometry(1.62,128),faceMat);
  add(new THREE.TorusGeometry(1.64,.05,24,220),gold,m=>m.position.z=.02);
  add(new THREE.RingGeometry(1.64,1.84,160),brushed,m=>m.position.z=-.01);
  add(new THREE.TorusGeometry(1.84,.09,32,240),gold);
  add(new THREE.CylinderGeometry(1.86,1.78,.24,128),gold,m=>{ m.rotation.x=Math.PI/2; m.position.z=-.14; });
  add(new THREE.CylinderGeometry(.075,.075,.2,24),gold,m=>m.position.y=2.02);
  add(new THREE.SphereGeometry(.11,24,24),gold,m=>m.position.y=2.14);
  [1,3,5,7].forEach(q=>add(new THREE.SphereGeometry(.065,20,20),gold,m=>m.position.set(Math.cos(q*Math.PI/4)*1.84,Math.sin(q*Math.PI/4)*1.84,.07)));
  const hHour=hand(.86,.075,steel),hMin=hand(1.26,.055,steel),hSec=hand(1.36,.018,gold);
  hHour.position.z=.03; hMin.position.z=.06; hSec.position.z=.09; dial.add(hHour,hMin,hSec);
  add(new THREE.CylinderGeometry(.07,.07,.1,24),gold,m=>{ m.rotation.x=Math.PI/2; m.position.z=.11; });

  // five glass / mother-of-pearl orbs on thin gold wire orbits
  const orbMat=(pearly)=>new THREE.MeshPhysicalMaterial({ color:pearly?0xFBF5EC:0xFFFFFF, metalness:0, roughness:pearly?.24:.05,
    transmission:MOBILE?0:.9, ior:1.5, thickness:1.2, iridescence:.8, iridescenceIOR:1.3, iridescenceThicknessRange:[120,420],
    clearcoat:1, clearcoatRoughness:.05, sheen:pearly?1:0, sheenColor:new THREE.Color(0xFFF2E0),
    attenuationColor:new THREE.Color(pearly?0xF0E2CA:0xFFF6E8), attenuationDistance:pearly?.9:2.6 });
  const orbits=[];
  [[2.75,[1.3,.25,0],[[0,.46,0],[2.2,.36,1],[4.3,.30,0]]],[3.1,[1.05,-.35,.35],[[1.1,.40,1],[3.9,.52,0]]]].forEach(([R,rot,orbs])=>{
    const g=new THREE.Group(); g.position.copy(dial.position); g.rotation.set(...rot); stage.add(g);
    const wire=new THREE.Mesh(new THREE.TorusGeometry(R,.008,8,320),gold); g.add(wire);
    const spin=new THREE.Group(); g.add(spin);
    orbs.forEach(([a,rad,pearly])=>{ const s=new THREE.Mesh(new THREE.SphereGeometry(rad,MOBILE?40:64,MOBILE?28:48),orbMat(pearly));
      s.position.set(Math.cos(a)*R,Math.sin(a)*R,0); s.castShadow=true; spin.add(s); });
    orbits.push(spin);
  });

  // framing: fit the stage to whatever shape the container has
  const look=new THREE.Vector3(), base=new THREE.Vector3();
  const ray=new THREE.Raycaster(), ndc=new THREE.Vector2(), hit=new THREE.Vector3(), floor=new THREE.Plane(new THREE.Vector3(0,1,0),1.7);
  function resize(){
    const w=el.clientWidth||1,hh=el.clientHeight||1; r.setSize(w,hh,false); cam.aspect=w/hh;
    const tan=Math.tan(THREE.MathUtils.degToRad(cam.fov/2)), dist=MOBILE?Math.max(3.9/(tan*cam.aspect),3.1/tan):Math.max(4.9/(tan*cam.aspect),3.7/tan);
    const shift=MOBILE?0:-.35; look.set(shift,.1,0); base.set(shift,0,0).addScaledVector(new THREE.Vector3(0,.6,1).normalize(),dist);
    scene.fog=new THREE.Fog(0xF7F3EC,dist*1.45,dist*2.8); cam.updateProjectionMatrix();
    cam.position.copy(base); cam.lookAt(look); cam.updateMatrixWorld();
    ndc.set(MOBILE?.3:.66,MOBILE?-.45:-.22); ray.setFromCamera(ndc,cam);
    if(ray.ray.intersectPlane(floor,hit)) uniforms.uCaustic.value.set(hit.x,-hit.z);
  }

  // input: damped cursor parallax + ripple source on the silk, plus scroll response
  const ptr={x:innerWidth/2,y:innerHeight/2,t:-1e9}, cur={x:0,y:0,s:0};
  const onMove=e=>{ ptr.x=e.clientX; ptr.y=e.clientY; ptr.t=performance.now(); };
  if(!REDUCE) addEventListener('pointermove',onMove,{passive:true});

  let prev=performance.now(), t=0;
  function frame(now){
    const dt=Math.min(.05,Math.max(0,(now-prev)/1000)); prev=now; t+=dt; const k=1-Math.exp(-dt*3.2);
    const rect=el.getBoundingClientRect();
    const sp=Math.min(1,Math.max(0,-rect.top/Math.max(rect.height,1)));
    cur.x+=((ptr.x/innerWidth-.5)*2-cur.x)*k; cur.y+=((ptr.y/innerHeight-.5)*2-cur.y)*k; cur.s+=(sp-cur.s)*k;
    uniforms.uTime.value=t;
    // ripple where the cursor meets the silk; it fades out shortly after the cursor stops
    ndc.set((ptr.x-rect.left)/rect.width*2-1,-(ptr.y-rect.top)/rect.height*2+1); ray.setFromCamera(ndc,cam);
    if(ray.ray.intersectPlane(floor,hit)) uniforms.uMouse.value.lerp(new THREE.Vector2(hit.x,-hit.z),k);
    const active=now-ptr.t<1400&&Math.abs(ndc.x)<1.2&&Math.abs(ndc.y)<1.2;
    uniforms.uMouseAmt.value+=((active?1:0)-uniforms.uMouseAmt.value)*k*.8;
    // the dial keeps real time
    const d=new Date(), s=d.getSeconds()+d.getMilliseconds()/1000, m=d.getMinutes()+s/60, hr=(d.getHours()%12)+m/60;
    hSec.rotation.z=-s/60*TAU; hMin.rotation.z=-m/60*TAU; hHour.rotation.z=-hr/12*TAU;
    dial.position.y=.75+Math.sin(t*.8)*.06;
    orbits[0].rotation.z=t*.16; orbits[1].rotation.z=-t*.11;
    stage.rotation.set(cur.y*.12+cur.s*.18,cur.x*.28,0);
    cam.position.set(base.x+cur.x*.5,base.y-cur.y*.3-cur.s*.9,base.z); cam.lookAt(look);
    r.render(scene,cam);
  }

  const ro=new ResizeObserver(()=>{ resize(); if(REDUCE) frame(performance.now()); }); ro.observe(el); resize();

  // render loop: FPS cap (30 on phones, 60 elsewhere), paused when off-screen or the tab is hidden
  const interval=1000/(MOBILE?30:60); let last=-1e9, raf=0, inView=true, dead=false;
  const io=new IntersectionObserver(es=>{ inView=es.some(x=>x.isIntersecting); },{threshold:0}); io.observe(el);
  function loop(now){ if(dead) return; raf=requestAnimationFrame(loop);
    if(!inView||document.hidden||!el.isConnected) { prev=now; return; }
    if(now-last<interval) return; last=now; frame(now); }
  if(REDUCE) frame(performance.now()); else raf=requestAnimationFrame(loop);

  return { el, dispose(){
    dead=true; cancelAnimationFrame(raf);
    try{ io.disconnect(); ro.disconnect(); removeEventListener('pointermove',onMove); }catch(e){}
    scene.traverse(o=>{ if(o.geometry) o.geometry.dispose(); if(o.material){ (Array.isArray(o.material)?o.material:[o.material]).forEach(mt=>{ if(mt.map) mt.map.dispose(); mt.dispose(); }); } });
    envTex.dispose(); pmrem.dispose(); r.dispose(); el.classList.remove('is-live');
    if(r.domElement.parentNode) r.domElement.parentNode.removeChild(r.domElement);
  }};
}

/* Keep exactly one scene alive for the current #aok-hero3d node: mount when React renders the home
   hero, dispose when the visitor navigates away (no leaked WebGL contexts). */
let inst=null, pending=false;
async function sync(){
  const el=document.getElementById('aok-hero3d');
  if(inst&&(inst.el!==el||!inst.el.isConnected)){ inst.dispose(); inst=null; }
  if(el&&!inst&&!pending){ pending=true; try{ inst=await createHero(el); }finally{ pending=false; } if(inst&&!inst.el.isConnected) sync(); }
}
new MutationObserver(()=>requestAnimationFrame(sync)).observe(document.getElementById('root')||document.body,{childList:true,subtree:true});
sync();

/* ===== Subtle 3D hover tilt for .aok-tilt cards (pointer devices only; off while editing) ===== */
(function(){
  if(REDUCE||matchMedia('(pointer:coarse)').matches) return;
  const MAX=5;
  document.addEventListener('pointermove',e=>{
    const card=e.target.closest&&e.target.closest('.aok-tilt'); if(!card||card.querySelector('[contenteditable="true"]')) return;
    const b=card.getBoundingClientRect(); const px=(e.clientX-b.left)/b.width-.5, py=(e.clientY-b.top)/b.height-.5;
    card.style.transform='perspective(1000px) rotateX('+(-py*MAX).toFixed(2)+'deg) rotateY('+(px*MAX).toFixed(2)+'deg) translateY(-4px)';
  },{passive:true});
  document.addEventListener('pointerout',e=>{
    const card=e.target.closest&&e.target.closest('.aok-tilt'); if(!card||(e.relatedTarget&&card.contains(e.relatedTarget))) return;
    card.style.transform='';
  },{passive:true});
})();
