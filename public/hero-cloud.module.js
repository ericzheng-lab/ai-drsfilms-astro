import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass }     from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { ShaderPass }     from 'three/addons/postprocessing/ShaderPass.js';
import { OutputPass }     from 'three/addons/postprocessing/OutputPass.js';

/* ════════════════════════════════════════════════════════════════
   HERO · POINT-CLOUD MORPH
   One particle system, continuously reassembled between three forms:
     0 · FRAME   — camera aperture iris + cinemascope film gate
     1 · FIELD   — generative flow-field nebula (the "AI" state)
     2 · NETWORK — multi-agent node-link constellation (the "systems" state)
   Auto-cycles (ping-pong); the bottom state labels jump forms on click;
   the cursor repels particles; scroll dollies the camera + fades out.

   To use a real portrait later: replace buildFrame()'s targets with
   image-luminance sampling — the whole morph rig stays identical.
═════════════════════════════════════════════════════════════════ */

const rm  = matchMedia('(prefers-reduced-motion: reduce)').matches;
const mob = matchMedia('(max-width: 860px)').matches;
const N   = mob ? 4200 : 12000;

const COL = {
  amber: new THREE.Color('#e3a868'),
  amberD:new THREE.Color('#b07a42'),
  cyan:  new THREE.Color('#7fb5c8'),
  cyanD: new THREE.Color('#4f7e8f'),
  cream: new THREE.Color('#fff4dc'),
  bg:    new THREE.Color('#0c0a08'),
};
const TAU  = Math.PI * 2;
const cl   = (v,a,b) => Math.max(a, Math.min(b, v));
const lerp = (a,b,t) => a + (b-a)*t;
const smooth = (e0,e1,x) => { const t = cl((x-e0)/(e1-e0),0,1); return t*t*(3-2*t); };
const rnd   = () => Math.random();
const gauss = () => (rnd()+rnd()+rnd()-1.5) / 1.5;

// group offset so the lower-left HUD copy keeps breathing room — but centre it when the hero stands alone (no copy block)
const hasCopy = !!document.querySelector('.hud__copy');
const OFF = new THREE.Vector3((mob || !hasCopy) ? 0 : 0.82, 0.04, 0);

function setC(arr,i,c){ arr[i*3]=c.r; arr[i*3+1]=c.g; arr[i*3+2]=c.b; }

/* ── FORM 0 · THE LENS — an eye that is a camera aperture ────────── */
function buildFrame(){
  const p = new Float32Array(N*3), c = new Float32Array(N*3);
  const Riris = 0.52, Rpup = 0.19, cornerX = 1.55, cy = 0.14;  // cy = vertical centre of the eye opening
  const upper = u => 0.82*Math.pow(Math.max(0,1-u*u),0.60);   // upper lid almond
  const lower = u => -0.54*Math.pow(Math.max(0,1-u*u),0.82);  // lower lid (shallower)
  for(let i=0;i<N;i++){
    let x, y, z=(rnd()-0.5)*0.10, col;
    const r = rnd();
    if(r < 0.20){
      // upper eyelid — bright crisp stroke (+ a softer crease line above)
      const u = rnd()*2-1;
      x = u*cornerX;
      const crease = rnd()<0.32;
      y = upper(u) + (crease ? 0.13 + gauss()*0.03 : gauss()*0.011);
      col = crease ? COL.amberD.clone() : COL.cream.clone().lerp(COL.amber, rnd()*0.4);
    } else if(r < 0.33){
      // lower eyelid — dimmer stroke
      const u = rnd()*2-1;
      x = u*cornerX; y = lower(u) + gauss()*0.011;
      col = COL.amber.clone().lerp(COL.amberD, rnd()*0.6);
    } else if(r < 0.39){
      // eye corners (tear duct + outer canthus)
      const side = rnd()<0.5?1:-1;
      const u = side*(0.85 + rnd()*0.14);
      x = u*cornerX; y = (upper(u)+lower(u))*0.5 + gauss()*0.04;
      col = COL.amberD.clone();
    } else if(r < 0.70){
      // iris fibres — radial striations pupil → limbus
      const a = rnd()*TAU;
      const rr = Rpup + Math.pow(rnd(),0.85)*(Riris-Rpup);
      const wob = (rnd()-0.5)*0.03;
      x = Math.cos(a)*rr + Math.cos(a+1.57)*wob;
      y = cy + Math.sin(a)*rr + Math.sin(a+1.57)*wob;
      col = COL.amber.clone().lerp(COL.amberD, ((rr-Rpup)/(Riris-Rpup))*0.7);
    } else if(r < 0.80){
      // limbal ring (bright outer iris edge) + one mid ring
      const isLimbus = rnd()<0.66;
      const ring = isLimbus ? Riris : Riris*0.64;
      const a = rnd()*TAU;
      x = Math.cos(a)*ring + gauss()*0.011;
      y = cy + Math.sin(a)*ring + gauss()*0.011;
      col = isLimbus ? COL.cream.clone() : COL.amber.clone();
    } else if(r < 0.88){
      // pupil rim — the aperture opening (bright thin ring, hollow centre)
      const a = rnd()*TAU;
      x = Math.cos(a)*Rpup + gauss()*0.010;
      y = cy + Math.sin(a)*Rpup + gauss()*0.010;
      col = COL.cream.clone();
    } else if(r < 0.93){
      // catchlight — specular highlight, upper-left of iris
      x = -0.16 + gauss()*0.06; y = cy + 0.17 + gauss()*0.06;
      col = COL.cream.clone();
    } else {
      // sparse sclera body inside the almond (skip the iris disc for legibility)
      const u = (rnd()*2-1)*0.95;
      const lo = lower(u), hi = upper(u);
      x = u*cornerX; y = lo + rnd()*(hi-lo);
      if(x*x + (y-cy)*(y-cy) < (Riris*1.10)*(Riris*1.10)){ i--; continue; }
      col = COL.amberD.clone().multiplyScalar(0.5);
    }
    p[i*3]=x; p[i*3+1]=y; p[i*3+2]=z; setC(c,i,col);
  }
  return {p,c};
}

/* ── FORM 1 · APERTURE — mechanical iris diaphragm ──────────────── */
function buildField(){
  const p = new Float32Array(N*3), c = new Float32Array(N*3);
  const blades = 8, seg = TAU/blades, Rop = 0.58, Rbarrel = 1.34;
  for(let i=0;i<N;i++){
    let x, y, z=(rnd()-0.5)*0.10, col;
    const r = rnd();
    if(r < 0.34){
      // octagon opening — 8 straight bright edges (the aperture hole)
      const k = Math.floor(rnd()*blades);
      const a0=k*seg, a1=(k+1)*seg, t=rnd();
      x = lerp(Math.cos(a0)*Rop, Math.cos(a1)*Rop, t) + gauss()*0.012;
      y = lerp(Math.sin(a0)*Rop, Math.sin(a1)*Rop, t) + gauss()*0.012;
      col = COL.cream.clone().lerp(COL.amber, rnd()*0.5);
    } else if(r < 0.70){
      // 8 blades sweeping out from each vertex (pinwheel diaphragm)
      const k = Math.floor(rnd()*blades);
      const a = k*seg;
      const vx=Math.cos(a)*Rop, vy=Math.sin(a)*Rop;
      const t = Math.pow(rnd(),0.9), ang = a + 1.15;   // tangential lean
      const push = 1 + t*0.18;
      x = (vx + Math.cos(ang)*t*0.95)*push + gauss()*0.02;
      y = (vy + Math.sin(ang)*t*0.95)*push + gauss()*0.02;
      col = COL.amber.clone().lerp(COL.amberD, t*0.8);
    } else if(r < 0.84){
      // outer barrel ring
      const a=rnd()*TAU, rr=Rbarrel+gauss()*0.03;
      x=Math.cos(a)*rr; y=Math.sin(a)*rr;
      col = COL.amberD.clone();
    } else if(r < 0.92){
      // f-stop tick marks around the barrel
      const ticks=24, k=Math.floor(rnd()*ticks), major=(k%3===0);
      const a=k/ticks*TAU, rr=Rbarrel+0.08+rnd()*0.10*(major?1.6:1);
      x=Math.cos(a)*rr; y=Math.sin(a)*rr;
      col = major ? COL.cream.clone() : COL.amber.clone();
    } else {
      // faint blade-fill between opening and barrel
      const a=rnd()*TAU, rr=Rop+rnd()*(Rbarrel-Rop);
      x=Math.cos(a)*rr; y=Math.sin(a)*rr;
      col = COL.amberD.clone().multiplyScalar(0.45);
    }
    p[i*3]=x; p[i*3+1]=y; p[i*3+2]=z; setC(c,i,col);
  }
  return {p,c};
}

/* ── FORM 2 · NETWORK — multi-agent constellation ───────────────── */
function buildNetwork(){
  const p = new Float32Array(N*3), c = new Float32Array(N*3);
  const inner = 6, outer = 11, R1 = 1.28, R2 = 2.42;
  const nodes = [[0,0,0]];
  for(let k=0;k<inner;k++){ const a=k/inner*TAU+0.2; nodes.push([Math.cos(a)*R1, Math.sin(a)*R1*0.82, (rnd()-0.5)*0.5]); }
  for(let k=0;k<outer;k++){ const a=k/outer*TAU; const rr=R2*(0.86+rnd()*0.22); nodes.push([Math.cos(a)*rr, Math.sin(a)*rr*0.78, (rnd()-0.5)*0.7]); }
  const innerStart=1, outerStart=1+inner;
  const edges=[];
  for(let k=0;k<inner;k++) edges.push([0, innerStart+k]);                          // hub → inner
  for(let k=0;k<inner;k++) edges.push([innerStart+k, innerStart+((k+1)%inner)]);    // inner ring
  for(let k=0;k<outer;k++) edges.push([innerStart+(k%inner), outerStart+k]);        // inner → outer
  for(let k=0;k<outer;k+=2) edges.push([outerStart+k, outerStart+((k+1)%outer)]);   // some outer links
  for(let i=0;i<N;i++){
    let x, y, z, col;
    if(rnd() < 0.46){
      let ni; const q=rnd();
      if(q<0.14) ni=0; else if(q<0.55) ni=innerStart+Math.floor(rnd()*inner); else ni=outerStart+Math.floor(rnd()*outer);
      const n=nodes[ni];
      const s = ni===0 ? 0.26 : (ni<outerStart ? 0.17 : 0.12);
      x=n[0]+gauss()*s; y=n[1]+gauss()*s; z=n[2]+gauss()*s;
      col = ni===0 ? COL.cream.clone()
          : ni<outerStart ? COL.cream.clone().lerp(COL.cyan, 0.4+rnd()*0.4)
          : COL.cyan.clone().lerp(COL.cyanD, rnd()*0.5);
    } else {
      const e=edges[Math.floor(rnd()*edges.length)];
      const a=nodes[e[0]], b=nodes[e[1]], t=rnd();
      x=lerp(a[0],b[0],t)+gauss()*0.04;
      y=lerp(a[1],b[1],t)+gauss()*0.04;
      z=lerp(a[2],b[2],t)+gauss()*0.04;
      col = COL.cyan.clone().lerp(COL.cyanD, 0.3+rnd()*0.5);
    }
    p[i*3]=x; p[i*3+1]=y; p[i*3+2]=z; setC(c,i,col);
  }
  return {p,c};
}

/* ── FORM 2 · REEL — film strip + sprockets ─────────────────────── */
function buildReel(){
  const p = new Float32Array(N*3), c = new Float32Array(N*3);
  const halfW = 2.45, railY = 0.62, frameTop = 0.42;
  const dividers = [-2.45,-1.47,-0.49,0.49,1.47,2.45];
  for(let i=0;i<N;i++){
    let x, y, z=(rnd()-0.5)*0.10, col;
    const r = rnd();
    if(r < 0.18){
      // top & bottom rails — bright edges
      const side = rnd()<0.5?1:-1;
      x = (rnd()*2-1)*halfW; y = side*railY + gauss()*0.012;
      col = COL.cream.clone().lerp(COL.amber, rnd()*0.4);
    } else if(r < 0.48){
      // sprocket perforations — square outlines along both rails
      const side = rnd()<0.5?1:-1, holes = 14;
      const k = Math.floor(rnd()*holes);
      const hx = -halfW + (k+0.5)*(2*halfW/holes), hw=0.085, hh=0.07;
      if(rnd()<0.5){ x = hx+(rnd()*2-1)*hw; y = side*0.5 + (rnd()<0.5?hh:-hh); }
      else         { x = hx+(rnd()<0.5?hw:-hw); y = side*0.5 + (rnd()*2-1)*hh; }
      col = COL.amber.clone().lerp(COL.amberD, rnd()*0.5);
    } else if(r < 0.62){
      // vertical frame dividers
      const dx = dividers[Math.floor(rnd()*dividers.length)];
      x = dx + gauss()*0.012; y = (rnd()*2-1)*frameTop;
      col = COL.amberD.clone();
    } else {
      // faint image content inside the frame cells
      x = (rnd()*2-1)*halfW; y = (rnd()*2-1)*frameTop*0.92;
      col = COL.amberD.clone().multiplyScalar(0.40+rnd()*0.35);
    }
    p[i*3]=x; p[i*3+1]=y; p[i*3+2]=z; setC(c,i,col);
  }
  return {p,c};
}

/* ── FORM 3 · SIGNAL — audio waveform / spectrogram ─────────────── */
function buildWave(){
  const p = new Float32Array(N*3), c = new Float32Array(N*3);
  const halfW = 2.45, nbars = 74;
  const amp = k => {
    const w = Math.pow(Math.max(0,1-k*k), 0.4);   // taper toward the edges
    return w*(0.16 + 0.84*Math.abs(Math.sin(k*7.0)*0.6 + Math.sin(k*17.0+1.0)*0.3 + Math.sin(k*3.0)*0.4));
  };
  for(let i=0;i<N;i++){
    let x, y, z=(rnd()-0.5)*0.10, col;
    if(rnd() < 0.11){
      // centre axis
      x = (rnd()*2-1)*halfW; y = gauss()*0.012;
      col = COL.cream.clone();
    } else {
      const bk = Math.floor(rnd()*nbars);
      const kx = (bk+0.5)/nbars*2-1;
      const A = amp(kx)*1.18;
      x = kx*halfW + gauss()*0.012;
      const yy = (rnd()*2-1)*A; y = yy;
      const tip = Math.abs(yy)/(A+0.0001);
      col = COL.amber.clone().lerp(COL.cyan, cl(kx*0.5+0.5,0,1)*0.7).lerp(COL.cream, tip*0.45);
    }
    p[i*3]=x; p[i*3+1]=y; p[i*3+2]=z; setC(c,i,col);
  }
  return {p,c};
}

const F0 = buildFrame(), F1 = buildField(), F2 = buildReel(), F3 = buildWave(), F4 = buildNetwork();
// scale all form geometry up so the settled shapes fill the frame
const SCALE = 1.45;
[F0,F1,F2,F3,F4].forEach(F=>{ for(let i=0;i<F.p.length;i++) F.p[i]*=SCALE; });
const seeds = new Float32Array(N);
for(let i=0;i<N;i++) seeds[i] = rnd();

/* ── Renderer / scene / camera ──────────────────────────────────── */
const canvas = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({canvas, antialias:!mob, alpha:false, powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(devicePixelRatio, mob?1.3:1.75));
renderer.setSize(innerWidth, innerHeight, false);
renderer.setClearColor(COL.bg, 1);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(38, innerWidth/innerHeight, 0.1, 60);
camera.position.set(0, 0.12, 5.7);
camera.lookAt(0,0,0);

const cloud = new THREE.Group(); cloud.position.copy(OFF); scene.add(cloud);

/* ── Points geometry + shader ───────────────────────────────────── */
const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(F0.p.slice(), 3));
geo.setAttribute('p0', new THREE.BufferAttribute(F0.p, 3));
geo.setAttribute('p1', new THREE.BufferAttribute(F1.p, 3));
geo.setAttribute('p2', new THREE.BufferAttribute(F2.p, 3));
geo.setAttribute('p3', new THREE.BufferAttribute(F3.p, 3));
geo.setAttribute('p4', new THREE.BufferAttribute(F4.p, 3));
geo.setAttribute('c0', new THREE.BufferAttribute(F0.c, 3));
geo.setAttribute('c1', new THREE.BufferAttribute(F1.c, 3));
geo.setAttribute('c2', new THREE.BufferAttribute(F2.c, 3));
geo.setAttribute('c3', new THREE.BufferAttribute(F3.c, 3));
geo.setAttribute('c4', new THREE.BufferAttribute(F4.c, 3));
geo.setAttribute('seed', new THREE.BufferAttribute(seeds, 1));
geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(0,0,0), 9);

const uniforms = {
  uForm:{value:0}, uTime:{value:0}, uPR:{value:renderer.getPixelRatio()},
  uReveal:{value:0}, uBillow:{value:0.85},
  uMouse:{value:new THREE.Vector3(999,999,0)}, uMouseR:{value:0.72}, uMouseS:{value:0},
  uFade:{value:1},
};

const ptsMat = new THREE.ShaderMaterial({
  uniforms, transparent:true, depthWrite:false, depthTest:false,
  blending:THREE.NormalBlending,
  vertexShader:`
    attribute vec3 p0,p1,p2,p3,p4,c0,c1,c2,c3,c4; attribute float seed;
    uniform float uForm,uTime,uPR,uReveal,uBillow,uMouseR,uMouseS,uFade;
    uniform vec3 uMouse;
    varying vec3 vColor; varying float vA;
    float ss(float a,float b,float x){float t=clamp((x-a)/(b-a),0.,1.);return t*t*(3.-2.*t);}
    vec3 pick(float idx, vec3 a0,vec3 a1,vec3 a2,vec3 a3,vec3 a4){
      vec3 r=a0;
      r=mix(r,a1,step(0.5,idx));
      r=mix(r,a2,step(1.5,idx));
      r=mix(r,a3,step(2.5,idx));
      r=mix(r,a4,step(3.5,idx));
      return r;
    }
    void main(){
      float NF=5.0;
      float lo=floor(uForm); float hi=min(lo+1.0,NF-1.0); float bl=ss(0.0,1.0,uForm-lo);
      vec3 pa = pick(lo,p0,p1,p2,p3,p4);
      vec3 pb = pick(hi,p0,p1,p2,p3,p4);
      vec3 ca = pick(lo,c0,c1,c2,c3,c4);
      vec3 cb = pick(hi,c0,c1,c2,c3,c4);
      vec3 pos = mix(pa,pb,bl);
      vColor = mix(ca,cb,bl);
      // billow outward during the transition, settle at the ends
      float bw = sin(3.14159*bl);
      vec3 dir = normalize(vec3(sin(seed*91.7),cos(seed*47.3),sin(seed*13.1))+0.0001);
      pos += dir*bw*(0.35+seed*1.1)*uBillow;
      // intro: drift in from the billow direction
      pos += dir*(1.0-uReveal)*1.4;
      // gentle shimmer
      pos.x += sin(uTime*0.55+seed*30.0)*0.022;
      pos.y += cos(uTime*0.47+seed*22.0)*0.022;
      // cursor field — behaviour changes with the active form (cloud-local space)
      vec2 d = pos.xy-uMouse.xy; float dl=length(d);
      float fall = exp(-(dl*dl)/(uMouseR*uMouseR));
      vec2 dn = d/(dl+0.0001);
      vec2 perp = vec2(-dn.y, dn.x);
      float mode = floor(uForm+0.5);
      if(mode < 0.5){
        // LENS — concentric ripple + lens bulge toward camera
        float ripple = sin(dl*15.0 - uTime*5.0);
        pos.xy += dn*fall*ripple*uMouseS*0.34;
        pos.z  += fall*uMouseS*1.15;
      } else if(mode < 1.5){
        // APERTURE — swirling vortex + radial wave
        float ripple = sin(dl*9.0 - uTime*3.2 + seed*6.28);
        pos.xy += perp*fall*uMouseS*1.35;
        pos.xy -= dn*fall*uMouseS*0.30;
        pos.z  += fall*ripple*uMouseS*0.5;
      } else if(mode < 2.5){
        // REEL — film transport: parts horizontally with a flicker judder
        float judder = sin(uTime*9.0 + seed*6.28);
        pos.x += sign(d.x)*fall*uMouseS*(0.7 + judder*0.22);
        pos.z += fall*uMouseS*0.30;
      } else if(mode < 3.5){
        // SIGNAL — vertical travelling-wave pump
        float w = sin(pos.x*6.0 - uTime*6.0);
        pos.y += fall*uMouseS*w*1.1;
        pos.z += fall*uMouseS*0.30;
      } else {
        // NETWORK — magnetic gather + electric jitter
        pos.xy -= dn*fall*uMouseS*0.95;
        pos.xy += vec2(sin(seed*99.0+uTime*6.0),cos(seed*55.0+uTime*5.0))*fall*uMouseS*0.20;
        pos.z  += fall*uMouseS*0.45;
      }
      vec4 mv = modelViewMatrix*vec4(pos,1.0);
      float sz = 0.085+seed*0.30;
      if(seed>0.93) sz*=1.9;
      gl_PointSize = sz*uPR*(110.0/-mv.z)*(0.5+0.5*uReveal);
      vA = (0.4+0.5*uReveal)*uFade;
      gl_Position = projectionMatrix*mv;
    }`,
  fragmentShader:`
    varying vec3 vColor; varying float vA;
    void main(){
      vec2 uv = gl_PointCoord-0.5; float d=length(uv);
      float core = smoothstep(0.5,0.0,d);
      float a = core*vA;
      if(a<0.01) discard;
      gl_FragColor = vec4(vColor*1.18, a);
    }`,
});
const points = new THREE.Points(geo, ptsMat);
points.frustumCulled = false;
cloud.add(points);

/* ── Post-processing ────────────────────────────────────────────── */
const composer = new EffectComposer(renderer);
composer.setPixelRatio(renderer.getPixelRatio());
composer.setSize(innerWidth, innerHeight);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth,innerHeight), 0.5, 0.5, 0.5);
composer.addPass(bloom);
const finalShader = {
  uniforms:{tDiffuse:{value:null},uTime:{value:0},uAb:{value:0.0018},uVig:{value:1.0},uGrain:{value:0.024},uRes:{value:new THREE.Vector2(innerWidth,innerHeight)}},
  vertexShader:`varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
  fragmentShader:`
    uniform sampler2D tDiffuse;uniform float uTime,uAb,uVig,uGrain;uniform vec2 uRes;varying vec2 vUv;
    float rand(vec2 c){return fract(sin(dot(c,vec2(12.9898,78.233)))*43758.5453);}
    void main(){
      vec2 uv=vUv; vec2 c=uv-0.5; float d=length(c);
      float ab=uAb*smoothstep(0.25,0.9,d);
      vec3 col;
      col.r=texture2D(tDiffuse,uv+c*ab).r;
      col.g=texture2D(tDiffuse,uv).g;
      col.b=texture2D(tDiffuse,uv-c*ab).b;
      float vig=1.0-smoothstep(0.42,1.05,d)*0.55*uVig;
      col*=vig;
      float lum=dot(col,vec3(0.299,0.587,0.114));
      col+=(rand(uv*uRes+uTime*47.0)-0.5)*uGrain*mix(1.3,0.5,smoothstep(0.0,0.5,lum));
      gl_FragColor=vec4(col,1.0);
    }`,
};
const fpass = new ShaderPass(finalShader); composer.addPass(fpass);
composer.addPass(new OutputPass());

/* ── Input · scroll, pointer ────────────────────────────────────── */
const heroEl = document.getElementById('top');
let sp = 0;
function updateSP(){ if(!heroEl){ sp=0; return; } const r=heroEl.getBoundingClientRect(); const total=heroEl.offsetHeight-innerHeight; sp=cl(-r.top/Math.max(total,1),0,1); }
updateSP(); addEventListener('scroll', updateSP, {passive:true});

const ndc = new THREE.Vector2(-2,-2);
let pointerIn = false;
addEventListener('pointermove', e=>{ ndc.x=e.clientX/innerWidth*2-1; ndc.y=-(e.clientY/innerHeight*2-1); pointerIn=true; }, {passive:true});
addEventListener('pointerleave', ()=>{ pointerIn=false; });
addEventListener('blur', ()=>{ pointerIn=false; });
const mx = {x:0,y:0};

addEventListener('resize', ()=>{
  const w=innerWidth, h=innerHeight;
  camera.aspect=w/h; camera.updateProjectionMatrix();
  renderer.setSize(w,h,false); composer.setSize(w,h);
  finalShader.uniforms.uRes.value.set(w,h);
  uniforms.uPR.value = renderer.getPixelRatio();
});

// pointer → cloud-local point on the z=0 plane
const _ray = new THREE.Ray(), _plane = new THREE.Plane(new THREE.Vector3(0,0,1),0), _hit = new THREE.Vector3();
function projectPointer(){
  _ray.origin.setFromMatrixPosition(camera.matrixWorld);
  _ray.direction.set(ndc.x, ndc.y, 0.5).unproject(camera).sub(_ray.origin).normalize();
  if(_ray.intersectPlane(_plane,_hit)) uniforms.uMouse.value.set(_hit.x-OFF.x, _hit.y-OFF.y, 0);
}

/* ── Form state · auto ping-pong + clickable labels ─────────────── */
const SEQ = [0,1,2,3,4,3,2,1];
let seqIdx = 0, targetForm = 0, formF = 0, lastSwitch = performance.now();
const DWELL = mob ? 5200 : 4400;
const stateEls = [...document.querySelectorAll('.hero-state')];
function setForm(n, manual){
  targetForm = n; lastSwitch = performance.now();
  if(manual){ const at = SEQ.indexOf(n); if(at>=0) seqIdx = at; }
  stateEls.forEach(el => el.classList.toggle('is-active', +el.dataset.form === n));
}
stateEls.forEach(el => el.addEventListener('click', ()=> setForm(+el.dataset.form, true)));
let lastActive = 0;

/* ── HUD scroll dressing ────────────────────────────────────────── */
const copyEl    = document.querySelector('.hud__copy');
const titleEl   = document.querySelector('.hud__title');
const scrollHint= document.getElementById('scrollHint');
const statesWrap= document.getElementById('heroStates');

/* ── Loop ───────────────────────────────────────────────────────── */
const clock = new THREE.Clock();
let rafId = 0, running = true, started = performance.now(), lastT = started;
function frame(){
  if(!running) return;
  rafId = requestAnimationFrame(frame);
  const t = clock.getElapsedTime();
  const now = performance.now();
  const dt = Math.min((now-lastT)/1000, 0.05); lastT = now;

  // intro reveal
  const reveal = smooth(0,1,(now-started)/1700);
  uniforms.uReveal.value = reveal;
  if(reveal>0.5 && statesWrap && !statesWrap.classList.contains('is-ready')) statesWrap.classList.add('is-ready');

  // auto ping-pong cycle
  if(now-lastSwitch > DWELL){ seqIdx=(seqIdx+1)%SEQ.length; setForm(SEQ[seqIdx], false); }
  formF += (targetForm-formF)*Math.min(1, dt*2.4);
  uniforms.uForm.value = formF;

  const near = Math.round(formF);
  if(near!==lastActive){ lastActive=near; stateEls.forEach(el=>el.classList.toggle('is-active', +el.dataset.form===near)); }

  // pointer repel strength + reproject
  mx.x += ((pointerIn?ndc.x:0)-mx.x)*0.05;
  mx.y += ((pointerIn?ndc.y:0)-mx.y)*0.05;
  uniforms.uMouseS.value = lerp(uniforms.uMouseS.value, pointerIn?0.62:0, 0.06);
  projectPointer();

  // camera: parallax + slow drift + scroll dolly
  const dolly = lerp(5.7, 5.0, smooth(0,1,sp));
  const cx = mx.x*0.55 + Math.sin(t*0.08)*0.12;
  const cy = 0.15 + mx.y*0.4 + Math.cos(t*0.06)*0.07;
  camera.position.x += (cx-camera.position.x)*0.04;
  camera.position.y += (cy-camera.position.y)*0.04;
  camera.position.z += (dolly-camera.position.z)*0.04;
  camera.lookAt(OFF.x*0.6 + mx.x*0.18, OFF.y*0.5 + mx.y*0.12, 0);

  cloud.scale.setScalar(1 + Math.sin(t*0.5)*0.012);
  uniforms.uTime.value = t;

  // form-tinted bloom + scroll fade
  const apAmt  = cl(1 - Math.abs(formF-1), 0, 1);
  const netAmt = cl(1 - Math.abs(formF-4), 0, 1);
  bloom.strength = lerp(bloom.strength, 0.45 + apAmt*0.14 + netAmt*0.05, 0.05);
  fpass.uniforms.uTime.value = t;
  uniforms.uFade.value = lerp(uniforms.uFade.value, 1 - smooth(0.55,1,sp)*0.55, 0.06);

  // HUD dressing on scroll
  const rise = smooth(0.35, 0.8, sp);
  if(copyEl){ copyEl.style.setProperty('--copy-bg-opacity',(rise*0.6).toFixed(3)); copyEl.style.setProperty('--copy-blur',(rise*6).toFixed(1)+'px'); }
  if(titleEl && rise>0.01){ const sz=Math.round(rise*16); titleEl.style.textShadow=`0 0 ${sz}px rgba(8,6,4,${(rise*0.7).toFixed(2)}),0 2px ${sz*2}px rgba(8,6,4,${(rise*0.6).toFixed(2)})`; }
  if(scrollHint) scrollHint.style.opacity = String(cl(1-sp*4,0,1));

  composer.render();
}

if(rm){
  uniforms.uReveal.value = 1; uniforms.uForm.value = 0;
  if(statesWrap) statesWrap.classList.add('is-ready');
  projectPointer(); composer.render();
} else {
  frame();
}
document.addEventListener('visibilitychange', ()=>{
  if(document.hidden){ running=false; cancelAnimationFrame(rafId); }
  else if(!rm){ running=true; lastT=performance.now(); frame(); }
});

// debug hook
window.__hero = {
  uniforms, camera, renderer, composer, scene, points, N,
  render: ()=>composer.render(),
  setForm: (n)=>setForm(n,true),
  get formF(){ return formF; },
  get target(){ return targetForm; },
  get reveal(){ return uniforms.uReveal.value; },
  snap(form){
    uniforms.uForm.value=form; uniforms.uReveal.value=1; uniforms.uFade.value=1; uniforms.uMouseS.value=0;
    composer.render();
    const src=renderer.domElement, gl=src.getContext('webgl2')||src.getContext('webgl');
    const w=src.width, ht=src.height, buf=new Uint8Array(w*ht*4);
    gl.readPixels(0,0,w,ht,gl.RGBA,gl.UNSIGNED_BYTE,buf);
    const cv=document.createElement('canvas'); cv.width=w; cv.height=ht;
    const ctx=cv.getContext('2d'), im=ctx.createImageData(w,ht);
    for(let yy=0;yy<ht;yy++){const sy=ht-1-yy;for(let xx=0;xx<w;xx++){const si=(sy*w+xx)*4,di=(yy*w+xx)*4;im.data[di]=buf[si];im.data[di+1]=buf[si+1];im.data[di+2]=buf[si+2];im.data[di+3]=255;}}
    ctx.putImageData(im,0,0);
    let el=document.getElementById('__heroSnap');
    if(!el){el=document.createElement('img');el.id='__heroSnap';el.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;object-fit:cover;z-index:99999;';document.body.appendChild(el);}
    el.src=cv.toDataURL('image/png');
    return 'snapped '+form;
  },
  unsnap(){ const el=document.getElementById('__heroSnap'); if(el) el.remove(); },
};
