/* Hero 3D scene (Three.js via import map): pearl silk, a golden astronomical clock and pearls revolving on
   elliptical gold orbits. Drag the clock to spin it, click or tap it for a twirl; it follows the cursor. */
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

  // stage: the clock and its orbits, pivoting on the dial's centre (parallax and dragging rotate the stage, never the silk)
  const stage=new THREE.Group(); stage.position.set(0,.75,0); scene.add(stage);
  const gold=new THREE.MeshPhysicalMaterial({color:0xD2AE68,metalness:.85,roughness:.2,clearcoat:.5,clearcoatRoughness:.15});
  const brushed=new THREE.MeshPhysicalMaterial({color:0xC9A35E,metalness:.85,roughness:.34,side:THREE.DoubleSide});
  const steel=new THREE.MeshPhysicalMaterial({color:0x23262B,metalness:.9,roughness:.28,clearcoat:1,clearcoatRoughness:.1});
  const dialTex=dialTexture(MOBILE?1024:2048);
  const faceMat=new THREE.MeshPhysicalMaterial({map:dialTex,color:0xEFE8DC,roughness:.34,clearcoat:.6,clearcoatRoughness:.12,iridescence:.22,iridescenceIOR:1.3,envMapIntensity:.8});
  const tilt=new THREE.Group(); stage.add(tilt);   // the clock's resting pose: ~25° pitch, -15° yaw
  const dial=new THREE.Group(); dial.rotation.set(THREE.MathUtils.degToRad(-25),THREE.MathUtils.degToRad(-15),.06); tilt.add(dial);
  const hitTargets=[];
  const add=(geo,mat,setup)=>{ const m=new THREE.Mesh(geo,mat); m.castShadow=true; if(setup) setup(m); dial.add(m); return m; };
  hitTargets.push(add(new THREE.CircleGeometry(1.62,128),faceMat));
  add(new THREE.TorusGeometry(1.64,.05,24,220),gold,m=>m.position.z=.02);
  add(new THREE.RingGeometry(1.64,1.84,160),brushed,m=>m.position.z=-.01);
  hitTargets.push(add(new THREE.TorusGeometry(1.84,.09,32,240),gold));
  hitTargets.push(add(new THREE.CylinderGeometry(1.86,1.78,.24,128),gold,m=>{ m.rotation.x=Math.PI/2; m.position.z=-.14; }));
  add(new THREE.CylinderGeometry(.075,.075,.2,24),gold,m=>m.position.y=2.02);
  add(new THREE.SphereGeometry(.11,24,24),gold,m=>m.position.y=2.14);
  [1,3,5,7].forEach(q=>add(new THREE.SphereGeometry(.065,20,20),gold,m=>m.position.set(Math.cos(q*Math.PI/4)*1.84,Math.sin(q*Math.PI/4)*1.84,.07)));
  const hHour=hand(.86,.075,steel),hMin=hand(1.26,.055,steel),hSec=hand(1.36,.018,gold);
  hHour.position.z=.03; hMin.position.z=.06; hSec.position.z=.09; dial.add(hHour,hMin,hSec);
  add(new THREE.CylinderGeometry(.07,.07,.1,24),gold,m=>{ m.rotation.x=Math.PI/2; m.position.z=.11; });

  // three elliptical gold wire orbits carrying four mother-of-pearl spheres
  // nacre: a cream base, a glossy clearcoat and a thin-film shimmer that shifts pink/green at the edges
  const pearlMat=tint=>new THREE.MeshPhysicalMaterial({ color:tint, metalness:0, roughness:.15, clearcoat:.9, clearcoatRoughness:.06,
    iridescence:1, iridescenceIOR:1.25, iridescenceThicknessRange:[260,640], sheen:.55, sheenRoughness:.4, sheenColor:new THREE.Color(0xF2D9B4),
    specularIntensity:.7, envMapIntensity:.8, emissive:new THREE.Color(0xE8C47A), emissiveIntensity:0 });
  const ellipse=(a,b)=>{ const pts=[]; for(let i=0;i<160;i++){ const u=i/160*TAU; pts.push(new THREE.Vector3(Math.cos(u)*a,Math.sin(u)*b,0)); } return new THREE.CatmullRomCurve3(pts,true); };
  // [semi-axes a,b], tilt of the orbit plane, speed (rad/s, sign = direction), pearls [phase, radius, tint]
  const ORBITS=[
    [[2.95,2.3],[1.28,.22,.18],.34,[[0,.42,0xEFE2CC],[3.3,.28,0xF4EBDD]]],
    [[3.2,2.55],[.98,-.5,.62],-.23,[[1.6,.46,0xF1E5D2]]],
    [[2.4,2.12],[.3,.95,-.35],.29,[[4.4,.24,0xF2E2DA]]] ];
  const orbits=[], pearls=[];
  ORBITS.forEach(([[A,B],rot,speed,list],oi)=>{
    const g=new THREE.Group(); g.rotation.set(...rot); stage.add(g);
    g.add(new THREE.Mesh(new THREE.TubeGeometry(ellipse(A,B),MOBILE?260:420,oi===2?.006:.009,6,true),gold));
    [.55,2.35+oi].forEach(u=>{ const bead=new THREE.Mesh(new THREE.SphereGeometry(.042,16,16),gold); bead.position.set(Math.cos(u)*A,Math.sin(u)*B,0); g.add(bead); });
    list.forEach(([phase,rad,tint])=>{
      const m=new THREE.Mesh(new THREE.SphereGeometry(rad,MOBILE?40:64,MOBILE?28:48),pearlMat(tint)); m.castShadow=true; g.add(m);
      const p={m,A,B,speed,phase,rad,glow:0}; pearls.push(p); hitTargets.push(m); m.userData.pearl=p;
    });
    orbits.push(g);
  });
  const placePearl=(p,u)=>{ const th=u+.24*Math.sin(u);   // faster near the ends of the orbit, like a planet near perihelion
    p.m.position.set(Math.cos(th)*p.A,Math.sin(th)*p.B,0); };

  // a few motes of gold dust drifting around the orbits (desktop)
  let dust=null;
  if(!MOBILE){
    const N=90, pos=new Float32Array(N*3);
    for(let i=0;i<N;i++){ const u=Math.random()*TAU, v=Math.acos(Math.random()*2-1), R=2.2+Math.random()*1.6;
      pos.set([Math.sin(v)*Math.cos(u)*R,Math.cos(v)*R*.6,Math.sin(v)*Math.sin(u)*R],i*3); }
    const geo=new THREE.BufferGeometry(); geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
    const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'); const gr=x.createRadialGradient(32,32,0,32,32,32);
    gr.addColorStop(0,'rgba(214,170,92,1)'); gr.addColorStop(.35,'rgba(214,170,92,.55)'); gr.addColorStop(1,'rgba(214,170,92,0)'); x.fillStyle=gr; x.fillRect(0,0,64,64);
    const tex=new THREE.CanvasTexture(c);
    dust=new THREE.Points(geo,new THREE.PointsMaterial({map:tex,size:.07,transparent:true,opacity:.75,depthWrite:false,sizeAttenuation:true}));
    stage.add(dust);
  }

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
  const ptr={x:innerWidth/2,y:innerHeight/2,t:-1e9,moved:false}, cur={x:0,y:0,s:0};
  // spin: the user's extra rotation of the clock (yaw/pitch), its velocity, and a pearl speed boost
  const spin={yaw:0,pitch:0,vy:0,vp:0,boost:0,idle:1e9}, drag={on:false,id:null,x:0,y:0,dist:0,lastT:0};
  const section=el.parentElement||el; let hover=null, overClock=false;
  // the clock only reacts where nothing else wants the pointer (buttons, links, text, the visual editor)
  const busy=t=>!t||!t.closest||!!t.closest('a,button,input,textarea,select,label,[contenteditable="true"],h1,h2,h3,p,li,.aok-ed-ui');
  const pick=(cx,cy)=>{ const b=el.getBoundingClientRect(); if(cx<b.left||cx>b.right||cy<b.top||cy>b.bottom) return null;
    ndc.set((cx-b.left)/b.width*2-1,-(cy-b.top)/b.height*2+1); ray.setFromCamera(ndc,cam); return ray.intersectObjects(hitTargets,false)[0]||null; };
  const onMove=e=>{ ptr.x=e.clientX; ptr.y=e.clientY; ptr.t=performance.now(); ptr.moved=true;
    if(drag.on&&e.pointerId===drag.id){ const dx=e.clientX-drag.x, dy=e.clientY-drag.y, dt=Math.max(8,ptr.t-drag.lastT)/1000;
      drag.x=e.clientX; drag.y=e.clientY; drag.lastT=ptr.t; drag.dist+=Math.abs(dx)+Math.abs(dy);
      spin.yaw+=dx*.0075; spin.pitch=Math.max(-.7,Math.min(.7,spin.pitch+dy*.005)); spin.vy=dx*.0075/dt*.6; spin.vp=dy*.005/dt*.6; spin.idle=0; } };
  const twirl=()=>{ spin.vy+=5.2*(Math.random()<.5?-1:1)*(.8+Math.random()*.4); spin.boost=2.4; spin.idle=0; };
  const onDown=e=>{ if(e.button>0||busy(e.target)) return; const h=pick(e.clientX,e.clientY); if(!h) return;
    if(e.pointerType==='touch'){ drag.tap={x:e.clientX,y:e.clientY,t:performance.now()}; return; }   // touch: tap to twirl, never block scrolling
    drag.on=true; drag.id=e.pointerId; drag.x=e.clientX; drag.y=e.clientY; drag.dist=0; drag.lastT=performance.now();
    spin.vy=spin.vp=0; section.style.cursor='grabbing'; e.preventDefault(); };
  const onUp=e=>{
    if(drag.tap){ const tp=drag.tap; drag.tap=null; if(Math.hypot(e.clientX-tp.x,e.clientY-tp.y)<12&&performance.now()-tp.t<500) twirl(); return; }
    if(!drag.on||e.pointerId!==drag.id) return; drag.on=false; section.style.cursor=overClock?'grab':'';
    if(drag.dist<6) twirl(); else if(performance.now()-drag.lastT>90){ spin.vy=spin.vp=0; } };
  if(!REDUCE){ addEventListener('pointermove',onMove,{passive:true}); addEventListener('pointerdown',onDown); addEventListener('pointerup',onUp); addEventListener('pointercancel',onUp); }

  let prev=performance.now(), t=0; const born=performance.now();
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
    // intro: the clock settles in, the hands sweep from XII to the real time, the pearls glide into place
    const ip=REDUCE?1:Math.min(1,(now-born)/2400), ie=1-Math.pow(1-ip,3);   // wall-clock, so slow devices don't drag it out
    // the dial keeps real time
    const d=new Date(), s=d.getSeconds()+d.getMilliseconds()/1000, m=d.getMinutes()+s/60, hr=(d.getHours()%12)+m/60;
    hSec.rotation.z=-s/60*TAU*ie; hMin.rotation.z=-m/60*TAU*ie; hHour.rotation.z=-hr/12*TAU*ie;
    tilt.position.y=Math.sin(t*.8)*.06; stage.scale.setScalar(.82+.18*ie);
    // spin: inertia while free, then a gentle spring back to the resting pose
    if(!drag.on){ spin.idle+=dt; spin.yaw+=spin.vy*dt; spin.pitch+=spin.vp*dt; const damp=Math.exp(-dt*1.6); spin.vy*=damp; spin.vp*=damp;
      if(spin.idle>1.2&&Math.abs(spin.vy)<.6){ const tgt=Math.round(spin.yaw/TAU)*TAU; spin.yaw+=(tgt-spin.yaw)*(1-Math.exp(-dt*1.4)); spin.pitch+=(0-spin.pitch)*(1-Math.exp(-dt*1.4)); } }
    spin.boost*=Math.exp(-dt*.9);
    tilt.rotation.set(spin.pitch,spin.yaw+Math.sin(t*.23)*.07,0);
    orbits.forEach((g,i)=>{ g.rotation.z+=dt*(i===1?-.05:.04); });
    // hover: the pearl (or clock) under the cursor; the hovered pearl swells and warms
    if(ptr.moved&&!MOBILE&&!drag.on){ ptr.moved=false; const target=document.elementFromPoint(ptr.x,ptr.y); const h=busy(target)?null:pick(ptr.x,ptr.y);
      hover=h&&h.object.userData.pearl||null; const over=!!h; if(over!==overClock){ overClock=over; section.style.cursor=over?'grab':''; } }
    pearls.forEach(p=>{ const u=p.phase+t*p.speed*(1+spin.boost)-(1-ie)*2.2*Math.sign(p.speed); placePearl(p,u);
      p.m.rotation.y+=dt*.5; p.glow+=((hover===p?1:0)-p.glow)*k*1.6;
      p.m.scale.setScalar(ie*(1+p.glow*.16)); p.m.material.emissiveIntensity=p.glow*.22; });
    if(dust){ dust.rotation.y=t*.03; dust.material.opacity=.55+Math.sin(t*.7)*.2; }
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
    try{ io.disconnect(); ro.disconnect(); removeEventListener('pointermove',onMove); removeEventListener('pointerdown',onDown); removeEventListener('pointerup',onUp); removeEventListener('pointercancel',onUp); section.style.cursor=''; }catch(e){}
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
