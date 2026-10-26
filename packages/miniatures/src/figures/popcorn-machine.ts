// @ts-nocheck
/* TOVANE K–8 · Popcorn machine. Drawn for this kit on the shared engine, in the manner of the lab files: its stylesheet,
 * defs and script. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

/* Popcorn, drawn once: a puff of lobes round a centre (the pieces in flight, the pattern every heap is filled with). */
const f1 = (v) => (+v).toFixed(2)
function puff(cx, cy, r, n, seed) {
  const q = Array.from({ length: n }, (_, i) => {
    const a = ((i + 0.3 * Math.sin(seed * 7.1 + i * 2.3)) / n) * Math.PI * 2 + seed,
      rr = r * (0.8 + 0.2 * Math.sin(seed * 3.7 + i * 5.1))
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)]
  })
  return 'M' + q[0].map(f1).join(',') + q.map((p, i) => {
    const o = q[i], e = q[(i + 1) % n], l = Math.hypot(e[0] - o[0], e[1] - o[1]) * 0.6
    return `A${f1(l)},${f1(l)} 0 0 1 ${f1(e[0])},${f1(e[1])}`
  }).join('') + 'Z'
}
const PIECES = [[2.6, 2.3, 2.3, 5, 1], [8, 1.6, 2.1, 5, 2], [5.4, 6.4, 2.5, 6, 3], [0.5, 7, 2.1, 5, 4], [10.7, 4.8, 2, 5, 5]]
const tile = (W, H, pieces = PIECES) => pieces.flatMap(([x, y, r, n, s]) => [-W, 0, W].flatMap((dx) => [-H, 0, H].map((dy) => [x + dx, y + dy, r, n, s])))
  .filter(([x, y, r]) => x + r > 0 && x - r < W && y + r > 0 && y - r < H)
  .map(([x, y, r, n, s]) => `<path d="${puff(x, y, r, n, s)}" class="pp"/><ellipse cx="${f1(x + r * 0.32)}" cy="${f1(y + r * 0.34)}" rx=".55" ry=".4" class="hull"/>`).join('')

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--chrome:#d9dad8;--chrome-top:#f4f4f2;--chrome-side:#bdbebc;--rubber:#2e2e2d;--rubber-top:#474745;--paint:#c8402f;--paint-top:#dc5a46;--paint-side:#a3321f;--enamel:#f4ecd6;--maker:#8a2a1e;--corn:#fbf1d6;--corn-shade:#e8d3a0;--corn-deep:#c9a865;--corn-line:#b0904f;--hull:#c4862a;--kernel:#e2a634;--butter:#f2c443;--card:#fbf8ef;--stripe:#d4402f;--kin:#4a4844;--lamp:#ffcf70;--heat:#ff7a2e;--burst:#ee8a2a;--pane:#dce5e8;--env-a:.42;--film:.12;--shine:.85;--glow-a:.32;--warm:.05}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--off:#9b9b99;--chrome:#b7b7b6;--chrome-top:#e4e4e2;--chrome-side:#858585;--rubber:#252524;--rubber-top:#424240;--paint:#a83426;--paint-top:#ce5441;--paint-side:#722013;--enamel:#cec7b4;--maker:#6e2016;--corn:#ebe1c8;--corn-shade:#c3b286;--corn-deep:#8e7645;--corn-line:#947941;--hull:#a57022;--kernel:#c98f27;--butter:#e2b73e;--card:#d3d1cb;--stripe:#b23426;--kin:#3d3b39;--lamp:#ffd88a;--heat:#ff8a3d;--burst:#ffd27a;--pane:#8d989c;--env-a:.3;--film:.06;--shine:.5;--glow-a:.62;--warm:.2;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.micro{font-size:2.1px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}.paint{fill:var(--paint)}.top.paint{fill:var(--paint-top)}.side.paint{fill:var(--paint-side)}.enamel{fill:var(--enamel)}.kin{fill:var(--kin)}.card{fill:var(--card)}.side.card{fill:var(--corn)}
.maker{fill:var(--maker);font:italic 700 3.9px Georgia,'Times New Roman',serif;letter-spacing:.2px;text-anchor:middle;stroke:none}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
.env{fill:var(--pane);fill-opacity:var(--env-a);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke;stroke-opacity:.45}.warm{fill:var(--lamp);opacity:var(--warm);pointer-events:none}
.film{fill:#fff;fill-opacity:var(--film);stroke:none;pointer-events:none}.shine{fill:none;stroke:#fff;stroke-linecap:round;opacity:var(--shine);pointer-events:none}.shine.dim{opacity:calc(var(--shine)*.45)}
.lumps{fill:url(#cornQ);stroke:none;pointer-events:none}.corn{fill:url(#cornP);stroke:var(--corn-line);stroke-width:.7;vector-effect:non-scaling-stroke;stroke-linejoin:round}.pp{fill:url(#puffG);stroke:var(--corn-line);stroke-width:.3}.hull{fill:var(--hull);opacity:.85}
.shade{fill:var(--corn-deep);stroke:none;pointer-events:none}.shade.f{opacity:.16}.shade.s{opacity:.36}.crest{fill:none;stroke:var(--corn-line);stroke-width:.55;vector-effect:non-scaling-stroke;opacity:.75;pointer-events:none}
.butter{fill:url(#butterG);stroke:none;opacity:0;pointer-events:none}.pool{fill:url(#lampG);opacity:var(--glow-a);pointer-events:none}
.pc{fill:url(#puffG);stroke:var(--corn-line);stroke-width:.45;vector-effect:non-scaling-stroke;pointer-events:none}.burst{fill:none;stroke:var(--burst);stroke-width:.95;stroke-linecap:round;vector-effect:non-scaling-stroke;pointer-events:none}
.kernels{fill:url(#kernP)}.heat{fill:var(--heat);opacity:0;filter:url(#bloom);pointer-events:none}.skin{fill:var(--heat);stroke:none;opacity:0;pointer-events:none}
.bulb{fill:var(--lamp);filter:url(#glow)}.bulb-b{fill:var(--off);stroke:var(--line);stroke-width:.4;vector-effect:non-scaling-stroke}.bulb-b.on{fill:var(--lamp);filter:url(#glow)}.bloom{fill:var(--lamp);opacity:calc(var(--glow-a)*1.15);filter:url(#bloom);pointer-events:none}
.lamp{fill:var(--off)}.lamp.on{fill:var(--heat);filter:url(#glow)}.lamp.lit{fill:var(--lamp);filter:url(#glow)}
.dial{fill:var(--card)}.zone{fill:none;stroke:var(--heat);stroke-width:1.2;opacity:.8}.needle{stroke:var(--paint-side);stroke-width:.7;stroke-linecap:round}
.stripes{fill:url(#stripes);stroke:none}.grip-u{fill:none;stroke:var(--line);stroke-width:2.6;stroke-linecap:round}.grip{fill:none;stroke:var(--rubber-top);stroke-width:1.5;stroke-linecap:round}.stream{fill:none;stroke:var(--butter);stroke-width:1.1;stroke-linecap:round;stroke-dasharray:2.2 1.2;opacity:0;pointer-events:none}.pour{fill:none;stroke:var(--kernel);stroke-width:1.3;stroke-linecap:round;stroke-dasharray:.8 1.6;opacity:0;pointer-events:none}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="puffG" cx=".42" cy=".38" r=".7"><stop offset="0" style="stop-color:#fffdf5"/><stop offset=".55" style="stop-color:var(--corn)"/><stop offset="1" style="stop-color:var(--corn-shade)"/></radialGradient>
<pattern id="cornP" width="11" height="9" patternUnits="userSpaceOnUse"><rect width="11" height="9" style="fill:var(--corn-deep)"/>${tile(11, 9)}</pattern>
<pattern id="cornQ" width="17" height="13" patternUnits="userSpaceOnUse">${tile(17, 13, [[4.2, 9.6, 2.4, 6, 7], [12.6, 3.4, 2.2, 5, 9]])}</pattern>
<pattern id="kernP" width="2.6" height="2.2" patternUnits="userSpaceOnUse"><rect width="2.6" height="2.2" style="fill:var(--kernel)"/><ellipse cx=".7" cy=".6" rx=".55" ry=".4" style="fill:var(--hull)"/><ellipse cx="2" cy="1.7" rx=".5" ry=".38" style="fill:var(--hull)"/></pattern>
<pattern id="stripes" width="2.8" height="4" patternUnits="userSpaceOnUse"><rect width="1.4" height="4" style="fill:var(--stripe)"/></pattern>
<radialGradient id="lampG"><stop offset="0" style="stop-color:var(--lamp)" stop-opacity=".9"/><stop offset=".55" style="stop-color:var(--lamp)" stop-opacity=".32"/><stop offset="1" style="stop-color:var(--lamp)" stop-opacity="0"/></radialGradient>
<linearGradient id="butterG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--butter)" stop-opacity=".85"/><stop offset=".4" style="stop-color:var(--butter)" stop-opacity=".55"/><stop offset="1" style="stop-color:var(--butter)" stop-opacity="0"/></linearGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* TOVANE K–8 kettle popcorn machine. World: x lower-right; y lower-left (front faces +y); z up. 1 unit ≈ 1 cm.
Part                          x      y      z      w      d      h
feet (4)                   4/56   4/38      0   r2.6      –      3
base (painted)                0      0      3     60     42     17   kernel drawer, thermometer, HEAT and LAMP rockers
deck                        1.6    1.6     20   56.8   38.8      –   the popcorn heaps up to 14.5 deep, mounded under the kettle
posts (4)                0/57.6 0/39.6     20    2.4    2.4     50   glass between them: back, left, right and the front
door (front, left half)  hinge 29 42.2 (on the mullion): 27.4 wide, z 21.6–68.6, swings out to 72°
kettle               rim c 30 27 46.5: r 9, 9 deep, two lids on a hinge bar running front to back; tips forward 56°
shaft                        30     27  46.5–70   r .8   from the stirrer motor on the roof
heat lamp                    11     35  55–58   hood r 4.2, bulb, hung from the roof
butter nozzle, kernel chute  48/37  32/32  58–70
roof (painted)             −0.8   −0.8     70   61.6   43.6    6.5   chrome band round the header
motor · kernel jar · pump  30/13/49 27/12/12 76.5  r4.8/3.8/2.8  –  3.6/8.8/9.2
marquee (on the roof)         7   38.6   76.5     46    4.2    7.4   bulbs round a cream face, the brand
box (on the counter)          3     47      0      9      7     14   striped, heaped
spill (on the counter)      9–29  43–52     0      –      –      5
The far panes, heap and kettle are drawn inside the glass; the near panes, posts and door over them; the roof last. */
const svg=document.getElementById('machine'),draw=document.getElementById('drawing');let root=draw;
const{P,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,box,cylinder,slits,frame}=kit(()=>root);
// Figure helpers: vectors, oriented planes, tubes on any axis (the bank vault's), hulls and lumpy outlines.
const{cos,sin,PI,min,max,abs}=Math,random=()=>Math.random(),RAD=PI/180,f2=v=>(+v).toFixed(2),VW=[1,1,1],into=g=>root=g,clamp=(v,a=0,b=1)=>max(a,min(b,v)),ease=t=>t*t*(3-2*t),rnd=(a,b)=>a+(b-a)*random();
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(Math.hypot(...a)||1)),lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const plane=(o,U,V)=>`matrix(${[...P(...U),...P(...V),...P(...o)].map(f2).join(' ')})`;
function axes(n){n=unit(n);const U=unit(abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U);const a=P(...U),b=P(...V);if(a[0]*b[1]-a[1]*b[0]<0)V=mul(V,-1);return[U,V];}
function stadium(n,c0,c1,r){let A=sub(c1,c0);if(dot(A,VW)<0){[c0,c1]=[c1,c0];A=mul(A,-1);}const[U,V]=axes(A),pu=P(...U),pv=P(...V),d=P(...A),det=pu[0]*pv[1]-pv[0]*pu[1]||1e-9,u=(d[0]*pv[1]-pv[0]*d[1])/det,v=(pu[0]*d[1]-d[0]*pu[1])/det,l=Math.hypot(u,v)||1,tx=-v*r/l,ty=u*r/l;
set(n,'transform',plane(c0,U,V));set(n,'d',`M${f2(tx)},${f2(ty)}A${r},${r} 0 0 1 ${f2(-tx)},${f2(-ty)}L${f2(u-tx)},${f2(v-ty)}A${r},${r} 0 0 1 ${f2(u+tx)},${f2(v+ty)}Z`);}
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const p of pts){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(const p of pts.reverse()){while(hi.length>1&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
const pt=p=>f2(p[0])+','+f2(p[1]),pd=q=>q.length?'M'+q.map(pt).join('L')+'Z':'';
// A lumpy run through screen points: each step a little arc, bulging to the left of the way it goes (out of a clockwise outline).
const lumps=(q,k=.62)=>q.slice(1).map((p,i)=>{const o=q[i],r=f2(max(.3,Math.hypot(p[0]-o[0],p[1]-o[1])*k));return`A${r},${r} 0 0 1 ${pt(p)}`;}).join('');
function blob(q,k){if(q.length<3)return'';let a=0;q.forEach((p,i)=>{const n=q[(i+1)%q.length];a+=p[0]*n[1]-n[0]*p[1];});if(a<0)q=q.slice().reverse();return'M'+pt(q[0])+lumps([...q,q[0]],k)+'Z';}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
const ctl=(g,label)=>{for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0','aria-label':label}))set(g,k,v);return g;};
const X0=1.6,X1=58.4,Y0=1.6,Y1=40.4,Z0=20.1,HM=14.5,KX=30,KY=27,KZ=46.5,KR=9,KH=9,O=[KX,KY,KZ],BATCH=120,PER=.22/BATCH;
// The heap's surface: level with the fill, mounded under the kettle where it lands, lumpy.
const hz=(x,y,f)=>{if(f<=0)return Z0;const e=min(1,f/.12),g=Math.exp(-((x-KX)**2/520+(y-KY)**2/300));return Z0+min(1.04,f)*HM+e*((3+1.5*f)*(1-.45*f)*g+.7*sin(x*1.3+y*.7)+.5*sin(x*.6-y*1.9));};

// The floor: the ground shadow (a dark-stage pool and contact copy), the feet and the painted base.
const sh=P(27,30,0);for(const c of['shadow stage-floor','stage-contact'])el('ellipse',{cx:f2(sh[0]-1),cy:f2(sh[1]+1),rx:41,ry:17,class:c});
for(const[x,y]of[[4,4],[56,4],[4,38],[56,38]])cylinder(x,y,0,2.6,3,'z','rubber');
box(0,0,3,60,42,17,1.6,'paint');
const BF=group(FRONT(0,42.05,20));rect(BF,0,0,60,1.5,0,'face top chrome');rect(BF,0,15.6,60,1.4,0,'face chrome');
rect(BF,5,3.4,21,9.6,1.2,'face side paint');rect(BF,6,4.4,19,7.6,.8,'detail');rect(BF,11.5,7.2,8,1.9,.9,'face top chrome');text(BF,15.5,14.4,'KERNELS','etch micro center');
// The thermometer: a dial with the popping zone, its needle on the kettle's temperature.
const TH=group('translate(33 8.2)',BF);circle(TH,0,0,5.4,'face chrome');circle(TH,0,0,4.5,'face dial');
const xy=(r,a)=>[r*sin(a*RAD),-r*cos(a*RAD)],arcAt=(r,a)=>xy(r,a).map(f2).join(','),ang=T=>-135+270*clamp(T/300);
el('path',{d:`M${arcAt(3.5,ang(175))}A3.5,3.5 0 0 1 ${arcAt(3.5,ang(260))}`,class:'zone'},TH);
for(let T=0;T<=300;T+=50)line(TH,...xy(3.9,ang(T)),...xy(4.4,ang(T)));
const needle=group('',TH);line(needle,0,.8,0,-3.7,'needle');circle(TH,0,0,.7,'face top chrome');text(BF,33,15.1,'KETTLE','etch micro center');
// The rockers: kettle HEAT (Space, a control) and the LAMP, always on.
const heatSw=ctl(group('',BF),'Kettle heat switch (Space)');
function rocker(g,u,lab){rect(g,u-2.6,4.2,5.2,7.8,1,'face rubber');const k=rect(g,u-2.2,4.6,4.4,3.6,.8,'face top rubber');const lamp=circle(g,u,2.75,.85,'lamp');text(g,u,14.2,lab,'etch micro center');return{k,lamp};}
const HR=rocker(heatSw,46,'HEAT');rect(heatSw,42.5,1.4,7,13.6,1,'hit');rect(heatSw,42.6,1.5,6.8,13.4,1.2,'focus-ring');
const LR=rocker(BF,53.5,'LAMP');set(LR.lamp,'class','lamp lit');
const BS=group(SIDE(60.05,42,20));rect(BS,0,0,42,1.5,0,'face top chrome');rect(BS,0,15.6,42,1.4,0,'face side chrome');slits(BS,6,4.4,30,6.6,11);text(BS,21,14.3,'K–8 · 120 V · 1300 W','etch micro center');
// Inside: the deck, the back posts and the far panes of glass, warmed by the lamp.
rect(group(TOP(0,0,20.03)),1.2,1.2,57.6,39.6,1,'face top chrome');
for(const x of[0,57.6])box(x,0,20,2.4,2.4,50,.4,'paint');
const BP=group(FRONT(2.4,.6,70));rect(BP,0,0,55.2,50,0,'env');rect(BP,0,0,55.2,50,0,'warm');
const LP=group(SIDE(.6,39.6,70));rect(LP,0,0,37.2,50,0,'env');rect(LP,0,0,37.2,50,0,'warm');
// The heap: one lumpy silhouette filled with popcorn, its faces against the glass shaded, butter and the lamp's pool on top.
const pileN=el('path',{class:'corn'}),pileQ=el('path',{class:'lumps'}),shF=el('path',{class:'shade f'}),shS=el('path',{class:'shade s'}),butN=el('path',{class:'butter'}),crest=el('path',{class:'crest'}),pool=el('ellipse',{rx:24,ry:11,class:'pool'});
function drawPile(f){
if(f<.004){for(const n of[pileN,pileQ,shF,shS,butN,crest])set(n,'d','');set(pool,'display','none');return;}
const top=[],NC=40,s0=X0-Y1,s1=X1-Y0,H=(x,y)=>P(x,y,hz(x,y,f));
for(let i=0;i<=NC;i++){const s=s0+(s1-s0)*i/NC,xa=max(X0,Y0+s),xb=min(X1,Y1+s);let best=null;for(let j=0;j<=10;j++){const x=xa+(xb-xa)*j/10,q=H(x,x-s);if(!best||q[1]<best[1])best=q;}top.push(best);}
const fr=[],rt=[];for(let i=0;i<=24;i++)fr.push(H(X0+(X1-X0)*i/24,Y1));for(let i=0;i<=18;i++)rt.push(H(X1,Y1-(Y1-Y0)*i/18));
const b0=P(X0,Y1,Z0),b1=P(X1,Y1,Z0),b2=P(X1,Y0,Z0),d=`M${pt(top[0])}${lumps(top)}L${pt(b2)}L${pt(b1)}L${pt(b0)}Z`;
set(pileN,'d',d);set(pileQ,'d',d);set(butN,'d',d);set(shF,'d',pd([b0,b1,...fr.slice().reverse()]));set(shS,'d',pd([b1,b2,...rt.slice().reverse()]));
set(crest,'d',`M${pt(fr[0])}${lumps(fr,.7)}${lumps(rt,.7)}`);
const c=H(16,30);set(pool,'display','inline');set(pool,'cx',f2(c[0]));set(pool,'cy',f2(c[1]+2));
}
// The kettle, posed on each frame from its tilt and its lids: heater glow, body, rim, lids round a dome of popcorn, the
// shaft from the stirrer, the dump lever. Its nodes are made once.
const KG=el('g',{});into(KG);
const kGlow=el('ellipse',{rx:13,ry:6.5,class:'heat'}),kBody=el('path',{class:'face chrome'}),kSkin=el('path',{class:'skin'}),kHi=el('path',{class:'shine','stroke-width':1.1});
const rimG=el('g',{});circle(rimG,0,0,KR,'face top chrome');circle(rimG,0,0,KR-1,'face kin');const kCorn=circle(rimG,0,0,KR-1.6,'corn');
const lidB=el('path',{class:'face top chrome'}),shaft=el('path',{class:'face chrome'}),dome=el('path',{class:'corn'}),hinge=el('path',{class:'face chrome'}),lidF=el('path',{class:'face top chrome'}),lever=el('path',{class:'face chrome'}),knob=el('circle',{r:1.5,class:'face rubber'});
into(draw);
function drawKettle(){
const ph=tilt*RAD,A=[0,sin(ph),cos(ph)],U=[1,0,0],V=[0,cos(ph),-sin(ph)],B=sub(O,mul(A,KH)),at=(u,v,w)=>add(O,add(add(mul(U,u),mul(V,v)),mul(A,w)));
const g=P(...at(0,0,-KH-1.2));set(kGlow,'cx',f2(g[0]));set(kGlow,'cy',f2(g[1]));
stadium(kBody,B,O,KR);stadium(kSkin,B,O,KR);set(kHi,'d',`M${pt(P(...at(-6.4,7.4,-1.4)))}L${pt(P(...at(-6.4,7.4,-KH+1.2)))}`);
set(rimG,'transform',plane(O,U,V));set(kCorn,'display',kv>.04?'inline':'none');
const al=(4+80*clamp(lidA))*RAD,lid=s=>{const W=add(mul(U,s*cos(al)),mul(A,sin(al)));return pd(Array.from({length:15},(_,i)=>P(...add(O,add(mul(V,KR*cos(i/14*PI)),mul(W,KR*sin(i/14*PI)))))));};
set(lidB,'d',lid(-1));set(lidF,'d',lid(1));
stadium(shaft,[KX,KY,70],at(0,0,.6),.8);stadium(hinge,at(0,-KR-.5,.5),at(0,KR+.5,.5),.75);
if(kv>.03){const h=1.2+7.5*kv,r=KR-1.2,q=[];for(const[k,w]of[[1,0],[.92,.4],[.72,.75],[.42,.95],[.08,1]])for(let i=0;i<14;i++){const a=i/14*2*PI;q.push(P(...at(r*k*cos(a),r*k*sin(a),h*w)));}set(dome,'d',blob(hull(q),.55));}else set(dome,'d','');
const l0=at(KR+.2,1,-3),l1=at(KR+5.2,3,-6.4);stadium(lever,l0,l1,.7);const kp=P(...l1);set(knob,'cx',f2(kp[0]));set(knob,'cy',f2(kp[1]));
}
// The heat lamp's hood and bulb at the front left, the butter nozzle and the kernel chute, the streams they pour.
stadium(el('path',{class:'face chrome'}),[11,35,70],[11,35,58],.6);const hood=cylinder(11,35,55,4.2,3.2,'z','chrome');circle(hood.face,0,0,1.2,'detail');
const bulbP=P(11,35,54.4);el('ellipse',{cx:f2(bulbP[0]),cy:f2(bulbP[1]+4),rx:13,ry:8,class:'bloom'});circle(draw,bulbP[0],bulbP[1],2.1,'bulb');
for(const[x,y,z]of[[48,32,58.4],[37,32,58]]){stadium(el('path',{class:'face chrome'}),[x,y,70],[x,y,z],.75);const q=P(x,y,z);circle(draw,q[0],q[1],.9,'face top chrome');}
const butterS=el('path',{class:'stream'}),pourS=el('path',{class:'pour'});
// Inside the glass: the scoop at rest, the pieces in flight and the little bursts of the pops, from fixed pools. Out of it
// (spilling, or on the scoop's way to the box) a piece or the scoop moves to the layer in front of the door.
const inner=el('g',{}),outer=el('g',{});
// The glass in front: the right pane, the fixed front pane, the rails, the mullion, the front posts.
const glassStreaks=(g,w,h)=>{el('path',{d:`M${f2(w*.18)},${f2(h*.92)}L${f2(w*.55)},${f2(h*.1)}`,class:'shine','stroke-width':1.3},g);el('path',{d:`M${f2(w*.32)},${f2(h*.96)}L${f2(w*.66)},${f2(h*.2)}`,class:'shine dim','stroke-width':.7},g);line(g,1.2,1.4,w-1.2,1.4,'shine dim');};
const RP=group(SIDE(60.02,39.6,70));rect(RP,0,0,37.2,50,0,'film');glassStreaks(RP,37.2,50);
const FP=group(FRONT(30.8,42.02,70));rect(FP,0,0,26.8,50,0,'film');glassStreaks(FP,26.8,50);
for(const z of[20,68.6]){box(2.4,40.4,z,55.2,1.6,1.4,.3,'paint');box(58.4,2.4,z,1.6,37.2,1.4,.3,'paint');}
box(29,40.3,21.4,1.8,1.8,47.2,.3,'paint');box(57.6,39.6,20,2.4,2.4,50,.4,'paint');box(0,39.6,20,2.4,2.4,50,.4,'paint');
// On the counter: the spill when it overflows, and the striped box the scoop fills.
const spillN=el('path',{class:'corn spill'});
const BX=el('g',{});into(BX);
{const f=group(FRONT(3,54,14));rect(f,0,0,9,14,.4,'face card');rect(f,0,0,9,14,0,'stripes');const s=group(SIDE(12,54,14));rect(s,0,0,7,14,.4,'face side card');rect(s,0,0,7,14,0,'stripes');rect(group(TOP(3,47,14)),0,0,9,7,.3,'face kin');}
const boxHeap=el('path',{class:'corn'});into(draw);
// The door: the front's left pane in its frame, hinged on the mullion; it swings out to the left. A click on it scoops a box.
const doorG=ctl(el('g',{}),'Cabinet door: scoop a box of popcorn (S)');
el('path',{d:'M0,0H27.4V47H0ZM2.2,2.2V44.8H25.2V2.2Z','fill-rule':'evenodd',class:'face paint'},doorG);rect(doorG,2.2,2.2,23,42.6,0,'film');
el('path',{d:'M5,42L15,4',class:'shine','stroke-width':1.3},doorG);el('path',{d:'M9.5,43L19,9',class:'shine dim','stroke-width':.7},doorG);
rect(doorG,23.4,19.5,2.4,8,1.2,'face top chrome');for(const v of[6,41])rect(doorG,-.6,v-2.5,1.6,5,.6,'face chrome');
rect(doorG,-1,-1,29.4,49,0,'hit');rect(doorG,-.8,-.8,29,48.6,1.2,'focus-ring');
draw.appendChild(outer);into(inner);
const SC=el('g',{});for(const c of['grip-u','grip'])el('path',{d:'M-3.2,-.4L-9.6,-3.4',class:c},SC);
el('path',{d:'M-3.6,-3.4L6.4,-5.4Q8.6,-1.6 7.8,2.4L-3.6,3.2Z',class:'face chrome'},SC);el('path',{d:'M-2.5,-2.2L5.6,-3.9Q7.1,-1.2 6.5,1.5L-2.5,2Z',class:'face top chrome'},SC);const scoopLoad=el('path',{d:puff(2.2,-1.6,3.9,8,2),class:'pc'},SC);
const PCS=[0,1,2].map(s=>puff(0,0,1.9,5,s*1.7+.4)),pcs=Array.from({length:30},(_,i)=>({n:el('path',{d:PCS[i%3],class:'pc',display:'none'}),on:0}));
const bursts=Array.from({length:10},()=>({n:el('path',{d:'M0,-1.5V-3.2M1.4,-.8L2.8,-1.6M1.4,.8L2.8,1.6M0,1.5V3.2M-1.4,.8L-2.8,1.6M-1.4,-.8L-2.8,-1.6M-.5,0A.5,.5 0 1 0 .5,0A.5,.5 0 1 0 -.5,0',class:'burst',display:'none'}),t:-1}));
into(draw);
// The roof: painted, a chrome band round its header; the stirrer motor, the kernel jar (N) and the butter pump (B) on top.
box(-.8,-.8,70,61.6,43.6,6.5,1.4,'paint');
rect(group(FRONT(-.8,42.85,76.5)),0,5.1,61.6,1.4,0,'face chrome');
const RS=group(SIDE(60.85,42.8,76.5));rect(RS,0,5.1,43.6,1.4,0,'face side chrome');text(RS,21.8,3.6,'KETTLE K–8','etch micro center');
{const g=group(TOP(-.8,-.8,76.52));rect(g,1.2,1.2,59.2,41.2,1.4,'face top chrome');rect(g,3.4,3.4,54.8,36.8,1.2,'detail');for(const u of[22,26,30,34,38])rect(g,u,6,1.6,9,.8,'face recess');for(const[u,v]of[[5.6,5.6],[56,5.6],[5.6,38.2],[56,38.2]])circle(g,u,v,.9,'face top chrome');}
const motor=cylinder(30,27,76.5,4.8,3.6,'z','chrome');circle(motor.face,0,0,3.4,'detail');circle(motor.face,0,0,1.3,'face rubber');
const jarG=ctl(el('g',{}),'Kernel jar: drop a new batch into the kettle (N)');into(jarG);
cylinder(13,12,76.5,3.8,1.4,'z','chrome');const jar=cylinder(13,12,77.9,3.4,6.2,'z','kernels');set(jar.face.firstChild,'class','face top kernels');
cylinder(13,12,84.1,3.7,1.2,'z','chrome');{const a=P(10.7,14.9,83.2),b=P(10.7,14.9,79);el('path',{d:`M${pt(a)}L${pt(b)}`,class:'shine','stroke-width':.8});}
{const c=P(13,12,80);circle(jarG,c[0],c[1],7.4,'hit');circle(jarG,c[0],c[1]-1,8,'focus-ring');}
into(draw);
const pumpG=ctl(el('g',{}),'Butter pump: drizzle butter over the popcorn (B)');into(pumpG);
cylinder(49,12,76.5,2.8,5.4,'z','chrome');const plunger=el('g',{});into(plunger);cylinder(49,12,81.9,.7,2.6,'z','chrome');const knobCap=cylinder(49,12,84.4,2,1.3,'z','paint');circle(knobCap.face,0,0,.8,'detail');into(pumpG);
{const c=P(49,12,81);circle(pumpG,c[0],c[1],6.2,'hit');circle(pumpG,c[0],c[1]-.5,6.8,'focus-ring');}
into(draw);
// The marquee: a light box along the roof's front edge, bulbs round its face (they chase while it pops), the brand small
// in the middle.
box(7,38.6,76.5,46,4.2,7.4,1,'paint');
const MQ=group(FRONT(7,42.85,83.9));rect(MQ,2.4,1.9,41.2,3.6,.9,'face enamel');text(MQ,23,4.85,'Tovane','maker');
const BULBS=Array.from({length:24},(_,i)=>{const c=i>>1,row=i&1;return{n:circle(MQ,1.5+c*3.9,row?6.4:1,.85,'bulb-b'),k:row?23-c:c};});let chased=null;
frame([[-.8,-.8,0,61.6,43.6,86],[20.5,42,21,8.5,26,47.6],[3,43,0,25,11.5,15]],10);

// State. The kettle heats (on its own, or Space switches it) and pops its charge of kernels: slow first pops, a crackling
// middle, a tail; the corn lifts the lids and tumbles out onto the heap, and an empty kettle tips to dump the rest. N drops
// a new batch, B drizzles butter, S or the door scoops a box. Past full it overflows: the door bursts open and popcorn
// spills onto the counter. As a progress indicator the heap follows the progress; done pops it to the brim and over.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
let heat=false,started=false,temp=22,charge=BATCH,bp=0,acc=0,gap=1,pops=0,fill=.55,kv=.32,lidA=.63,kick=0,tilt=0,dumpT=-1,reloadT=-1,serving=false,mode='auto',target=null,finish=0;
let butter=0,butterT=-1e9,pourT=-1e9,door=0,scoopT=-1,scoopTook=false,boxFill=1,boxA=1,spill=0,spillT=-1,spillAcc=0,rimAcc=0,note='',noteT=0,last=0,lastUI=-1,rate=0,outKey='',pileKey='',kettleKey='',boxKey='';
const say=m=>{announcement.textContent=m;},notice=(m,a)=>{note=m;noteT=performance.now()+1600;if(a)say(a);lastUI=-1;};
let ac=null,nb=null;
function audio(){try{if(!ac){const W=window.AudioContext||window.webkitAudioContext;if(!W)return;ac=new W();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,dur,v,type='sine',when=0,f1=0){const a=ac;if(!a)return;try{const t=a.currentTime+when,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+.03);}catch(_){}}
function hiss(dur,v,f,q=1,when=0){const a=ac;if(!a)return;try{if(!nb){nb=a.createBuffer(1,a.sampleRate,a.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}const t=a.currentTime+when,s=a.createBufferSource(),b=a.createBiquadFilter(),g=a.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;b.Q.value=q;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(b);b.connect(g);g.connect(a.destination);s.start(t,0,dur+.05);}catch(_){}}
const popSound=()=>{hiss(.035,.05,rnd(1400,3200),2.2);tone(rnd(380,700),.03,.012,'triangle');};
// How much the heap may hold now: the target as a progress indicator, else the brim and a little over (the spill).
const cap=()=>mode==='det'&&!finish?target:1.06;
function popAll(){const n=min(charge,Math.ceil(max(0,cap()-fill)/PER));if(n<=0)return;charge-=n;pops+=n;butter=max(0,butter-n*PER*4);fill=min(cap(),fill+n*PER);kv=.42;lidA=.45;}
function heatKey(){audio();heat=!heat;started=true;tone(heat?90:70,.25,.02,'sine',0,heat?140:50);if(heat&&!charge){charge=BATCH;bp=0;}notice(heat?'HEAT ON · KETTLE WARMING':'HEAT OFF · KETTLE COOLING',heat?'Kettle heat on. The kernels will start to pop.':'Kettle heat off.');sync();}
function batchKey(){audio();if(!charge)bp=0;charge=min(2*BATCH,charge+BATCH);pourT=performance.now();kick=1;hiss(.7,.015,5200,1.2);notice('NEW BATCH · KERNELS IN','A new batch of kernels drops into the kettle.');}
function butterKey(){audio();butterT=performance.now();if(reduced.matches)butter=1;tone(230,.35,.02,'sine',0,150);notice('BUTTER · DRIZZLING','Warm butter drizzles over the popcorn.');}
function scoopKey(){audio();if(scoopT>=0)return;if(fill<.06){notice('EMPTY · SPACE HEATS THE KETTLE','The cabinet is empty: heat the kettle to pop some corn.');return;}
if(reduced.matches){fill=max(0,fill-.12);boxFill=1;spill=0;notice('SCOOPED · A BOX TO GO','A box of popcorn, scooped.');return;}
scoopT=performance.now();scoopTook=false;tone(180,.05,.02,'square');notice('SCOOPING A BOX','The door opens and the scoop fills a box.');}
// Progress: a share fills the heap to it; null runs on its own again; done pops it to the brim and over.
function setProgress(p){finish=0;if(p==null||!isFinite(p)){mode='auto';target=null;}else{mode='det';target=clamp(+p);if(reduced.matches)fill=target;}lastUI=-1;}
function finishKey(){if(finish)return;finish=1;mode='det';target=1;serving=false;if(reduced.matches){fill=1;spill=1;finish=2;say('Complete: the cabinet is full to the brim and over.');}lastUI=-1;}
window.figure={setProgress,done:finishKey};
function sync(){set(heatSw,'aria-pressed',heat);set(HR.k,'transform',heat?'':'translate(0 3.4)');set(HR.lamp,'class',heat?'lamp on':'lamp');}
// Pieces in flight: from the rim, out of the door, from the scoop into the box. They land, bounce once, and go.
function spawn(kind,p,v){const s=pcs.find(q=>!q.on)||pcs.reduce((a,b)=>a.t<b.t?a:b);Object.assign(s,{on:1,kind,p:[...p],v:[...v],a:rnd(0,360),va:rnd(-400,400),t:performance.now(),hit:0});(kind==='in'?inner:outer).appendChild(s.n);set(s.n,'display','inline');}
function fromRim(K,lift){const a=random()<.8?rnd(.05,.95)*PI:rnd(0,2)*PI,r=KR*rnd(.6,1),d=add(mul(K.U,cos(a)),mul(K.V,sin(a)));spawn('in',K.at(r*cos(a),r*sin(a),lift),add(mul(d,rnd(7,17)),[0,0,rnd(14,30)]));}
function popOne(now,K){charge--;pops++;bp++;butter=max(0,butter-PER*4);temp-=.12;kv=min(1,kv+.022);kick=min(1,kick+.35);fill=min(cap(),fill+PER);rate+=1;
if(random()<.42)fromRim(K,1+kv*5);const b=bursts.find(q=>q.t<0);if(b){const a=rnd(.1,.9)*PI,r=KR*rnd(.15,.85),q=P(...K.at(r*cos(a),r*sin(a),1.5+kv*6*random()));b.t=now;b.x=q[0];b.y=q[1];b.r=rnd(0,60);set(b.n,'display','inline');}
if(ac&&random()<(rate>20?.45:1))popSound();}
function fly(dt,now){for(const s of pcs){if(!s.on)continue;const p=s.p,v=s.v;v[2]-=150*dt;for(let i=0;i<3;i++)p[i]+=v[i]*dt;s.a+=s.va*dt;
if(s.kind==='in'){if(p[0]<X0+1.4||p[0]>X1-1.4){v[0]=-v[0]*.4;p[0]=clamp(p[0],X0+1.4,X1-1.4);}if(p[1]<Y0+1.4||p[1]>Y1-1.4){v[1]=-v[1]*.4;p[1]=clamp(p[1],Y0+1.4,Y1-1.4);}}
const floor=s.kind==='in'?hz(p[0],p[1],fill)+.6:s.kind==='box'?14+3.5*boxFill:spillZ(p[0],p[1]);
if(p[2]<=floor&&v[2]<0){p[2]=floor;if(!s.hit&&s.kind!=='box'){s.hit=1;v[2]=-v[2]*.3;v[0]*=.45;v[1]*=.45;s.va*=.4;}else{s.on=0;set(s.n,'display','none');if(s.kind==='out')spill=min(1,spill+.035);continue;}}
if(now-s.t>2600){s.on=0;set(s.n,'display','none');continue;}
const q=P(...p);set(s.n,'transform',`translate(${f2(q[0])} ${f2(q[1])}) rotate(${f2(s.a)})`);}}
const spillZ=(x,y)=>max(0,spill*5*(1-((x-19)/11)**2-((y-47.5)/5.5)**2));
function drawSpill(){if(spill<.02){set(spillN,'d','');return;}const s=.45+.55*spill,h=1.2+4*spill,q=[];for(const[k,w]of[[1,0],[.8,.55],[.45,.9],[.1,1]])for(let i=0;i<16;i++){const a=i/16*2*PI;q.push(P(19+10*s*k*cos(a),47.5+5*s*k*sin(a),h*w));}set(spillN,'d',blob(hull(q),.5));}
function drawBox(){set(BX,'opacity',f2(boxA));if(boxFill<.02){set(boxHeap,'d','');return;}const h=1+4.6*boxFill,q=[];for(const[k,w]of[[1,0],[.75,.6],[.35,.95]])for(let i=0;i<12;i++){const a=i/12*2*PI;q.push(P(7.5+4.7*k*cos(a),50.5+3.7*k*sin(a),13.9+h*w));}for(const[x,y]of[[3,47],[12,47],[12,54],[3,54]])q.push(P(x,y,14.1));set(boxHeap,'d',blob(hull(q),.5));}
// The scoop's way: resting on the heap behind the door, digging in, lifted, out through the door, over the box, tipped
// into it, and back. Key times (share of the scoop), place and angle.
const SCOOP=[[0,'r',-30],[.18,'r',-30],[.3,'d',-6],[.42,'l',0],[.56,'o',-8],[.66,'v',-8],[.74,'v',64],[.8,'v',64],[.92,'r',-30],[1,'r',-30]];
function scoopPose(k){const r=[13,33,hz(13,33,fill)+.6],d=[15,37,hz(15,37,fill)-1.2],at={r,d,l:[15,40.6,d[2]+6],o:[11,47,29],v:[8,51,23]};
const i=max(0,SCOOP.findIndex(([t])=>t>=k)-1),[t0,a0,g0]=SCOOP[i],[t1,a1,g1]=SCOOP[min(SCOOP.length-1,i+1)],u=ease(clamp((k-t0)/((t1-t0)||1)));return{p:lerp(at[a0],at[a1],u),a:g0+(g1-g0)*u};}
// The scene, posed when it changed: the heap (with its butter and the spill), the kettle, the box.
function redraw(){
const pk=[fill.toFixed(4),butter.toFixed(2),spill.toFixed(3)].join();if(pk!==pileKey){pileKey=pk;drawPile(fill);set(butN,'style',`opacity:${f2(butter*.85)}`);drawSpill();}
const kk=[tilt.toFixed(2),lidA.toFixed(3),kv.toFixed(3)].join();if(kk!==kettleKey){kettleKey=kk;drawKettle();}
const bk=[boxFill.toFixed(3),boxA.toFixed(2)].join();if(bk!==boxKey){boxKey=bk;drawBox();}}
const frameOf=()=>{const ph=tilt*RAD,A=[0,sin(ph),cos(ph)],U=[1,0,0],V=[0,cos(ph),-sin(ph)];return{U,V,at:(u,v,w)=>add(O,add(add(mul(U,u),mul(V,v)),mul(A,w)))};};
// More corn wanted: running on its own, up to the brim; as a progress indicator, up to the progress (or over, when done).
const more=()=>!serving&&(mode==='auto'?fill<1.04:fill<target-1e-3||finish===1);
// The state line and readout.
function ui(now){const r=`KETTLE ${Math.round(temp)}°C · ${pops} POPS · ${min(100,Math.round(fill*100))}% FULL`;
const st=now<noteT?note:finish===2?'COMPLETE · FRESH POPCORN':spillT>=0?'OVERFLOWING · SPILLING OVER':scoopT>=0?'SCOOPING A BOX':serving?'SERVING · CABINET EMPTYING':dumpT>=0?'DUMPING THE KETTLE':finish?'FINISHING · POPPING TO THE BRIM':mode==='det'?(fill<target-1e-3?`POPPING TO ${Math.round(target*100)}%`:`HOLDING AT ${Math.round(target*100)}%`):!heat?(temp>60?'HEAT OFF · KETTLE COOLING':'READY · SPACE HEATS THE KETTLE'):temp<172?'HEATING · OIL WARMING':charge>0?(bp<BATCH*.12?'POPPING · FIRST POPS':charge<BATCH*.2?'POPPING · LAST FEW':rate>7?'POPPING · FULL BURST':'POPPING'):'KETTLE EMPTY · N DROPS A BATCH';
if(r+st!==outKey){outKey=r+st;readout.textContent=r;stateLabel.textContent=st;}lastUI=now;}
function finishDone(){finish=2;heat=false;sync();say('Complete: a full cabinet of fresh popcorn.');}
function tick(now){const dt=min(.05,(now-(last||now))/1000),red=reduced.matches;last=now;
// It runs on its own: the heat comes on, and while it's on a new batch drops after each dump; past full it serves.
if(mode!=='auto'||finish)started=true;else if(!started&&!red){started=true;heat=true;sync();}
if((mode==='det'&&fill<target-1e-3||finish===1)&&!heat){heat=true;sync();}
if(mode==='det'&&!finish&&fill>target+.01)serving=true;
if(serving){if(mode==='det'){if(fill>target){fill=red?target:max(target,fill-dt*.9);spill=max(0,spill-dt*1.5);}if(fill<=target+1e-4)serving=false;}else if(fill<=.45||red)serving=false;else if(scoopT<0){scoopT=now;scoopTook=false;}}
temp=red?(heat?205:22):temp+((heat?232:22)-temp)*(1-Math.exp(-dt*(heat?.9:.32)));
const K=frameOf();rate=max(0,rate-rate*dt*2.5);
if(heat&&temp>172&&charge>0&&dumpT<0&&spillT<0&&fill<cap()-1e-4){if(red)popAll();else{const k=.62*clamp((temp-172)/58)**2;acc+=charge*k*dt;let n=0;while(acc>=gap&&n<12){acc-=gap;gap=-Math.log(1-random()*.999);popOne(now,K);n++;}}}
if(!red){
// The corn in the kettle lifts the lids and tumbles over the rim; an empty kettle tips forward and dumps the rest.
if(kv>.05){rimAcc+=kv*dt*7;while(rimAcc>=1){rimAcc-=1;fromRim(K,2+kv*6);}kv=max(0,kv-kv*dt*.3);}
if(charge<=0&&dumpT<0&&reloadT<0&&heat){if(kv>.12)dumpT=now;else if(more())reloadT=now+1200;}
if(dumpT>=0){const k=(now-dumpT)/1900;tilt=56*(k<.3?ease(k/.3):k<.62?1:1-ease((k-.62)/.38));if(k>.25&&k<.62){kv=max(0,kv-dt*1.4);if(random()<dt*26)fromRim(K,1);}if(k>=1){tilt=0;dumpT=-1;kv=0;}}
if(reloadT>=0&&now>=reloadT){reloadT=-1;if(heat&&!charge&&more()){charge=BATCH;bp=0;pourT=now;kick=1;}}
lidA+=(clamp((dumpT>=0?1:.1+kv*1.05)+kick*.25)-lidA)*clamp(dt*9);kick=max(0,kick-dt*3);
}else{tilt=0;dumpT=-1;lidA=.5+.2*clamp(kv*2);}
// Over the brim: the door bursts open and the corn spills onto the counter, then the operator serves it down.
if(fill>=1.04&&spillT<0&&finish!==2){if(red){fill=finish?1:.92;spill=1;charge=0;kv=.42;if(finish)finishDone();}else{spillT=now;hiss(1.4,.02,1100,.7);say('It overflows: popcorn spills out of the door onto the counter.');}}
if(spillT>=0){const k=(now-spillT)/2400;fill=max(finish?1:.9,fill-dt*.09);spillAcc+=k<.8?dt*16:0;while(spillAcc>=1){spillAcc-=1;spawn('out',[rnd(8,27),41.4,Z0+fill*HM*rnd(.5,1)],[rnd(-3,5),rnd(12,24),rnd(2,12)]);}if(k>=1){spillT=-1;if(finish)finishDone();else if(mode==='auto')serving=true;}}
// The scoop: the door opens, it digs, fills the box (the last one served, a fresh one in its place) and comes back.
let sp={p:[13,33,hz(13,33,fill)+.6],a:-30};
if(scoopT>=0){const k=clamp((now-scoopT)/2300);if(boxFill>.5&&k>.16)boxA=max(0,1-(k-.16)/.06);if(boxA<=0){boxFill=0;}if(boxFill<.5)boxA=min(1,boxA+dt*6);
if(k>=.3&&!scoopTook){scoopTook=true;fill=max(0,fill-.12);hiss(.25,.02,900,.8);}
if(k>.66&&k<.8){boxFill=min(1,boxFill+dt*7);if(random()<dt*24)spawn('box',[rnd(5,10),rnd(48,53),20],[0,0,-6]);}
sp=scoopPose(k);if(k>=1){scoopT=-1;boxFill=1;boxA=1;spill=0;notice('SCOOPED · A BOX TO GO');}}
{const k=scoopT>=0?(now-scoopT)/2300:0,out=k>.4&&k<.9;if((SC.parentNode===outer)!==out)(out?outer:inner).appendChild(SC);set(scoopLoad,'display',(scoopT>=0?scoopTook&&k<.74:fill>.1)?'inline':'none');}{const q=P(...sp.p);set(SC,'transform',`translate(${f2(q[0])} ${f2(q[1])}) rotate(${f2(sp.a)})`);}
// The door: open while it scoops, serves or spills.
const sk=scoopT>=0?(now-scoopT)/2300:0,dw=spillT>=0?72:scoopT>=0?(sk<.9?68:68*(1-ease((sk-.9)/.1))):serving&&mode==='det'?50:0;
door=red?0:door+(dw-door)*clamp(dt*(spillT>=0?14:9));set(doorG,'transform',plane([29,42.15,68.6],[-cos(door*RAD),sin(door*RAD),0],[0,0,-1]));
// Butter and kernels: their streams, and the plunger pushed down.
const bt=red?1:(now-butterT)/1400;if(bt<1)butter=min(1,butter+dt*1.1);set(butterS,'style',`opacity:${bt>.04&&bt<1?.9:0};stroke-dashoffset:${f2(-now/40)}`);
{const a=P(48,32,57.8),b=P(48,32,hz(48,32,fill));set(butterS,'d',`M${pt(a)}L${pt(b)}`);}
set(plunger,'transform',`translate(0 ${f2(red?0:2.2*sin(PI*clamp((now-butterT)/700)))})`);
const pt2=red?1:(now-pourT)/900;set(pourS,'style',`opacity:${pt2>.02&&pt2<1?.95:0};stroke-dashoffset:${f2(-now/30)}`);
// Heat: the kettle's glow and skin, the thermometer.
const hk=clamp((temp-60)/170);kGlow.style.opacity=f2(hk*.7);kSkin.style.opacity=f2(hk*.3);set(needle,'transform',`rotate(${f2(ang(temp))})`);
if(!red)fly(dt,now);for(const b of bursts){if(b.t<0)continue;const k=(now-b.t)/260;if(k>=1||red){b.t=-1;set(b.n,'display','none');continue;}set(b.n,'transform',`translate(${f2(b.x)} ${f2(b.y)}) rotate(${f2(b.r)}) scale(${f2(.7+1.1*k)})`);b.n.style.opacity=f2(1-k*k);}
const ch=heat&&!red?Math.floor(now/150)%3:-1;if(ch!==chased){chased=ch;for(const b of BULBS)set(b.n,'class',ch<0||(b.k+ch)%3?'bulb-b on':'bulb-b');}
redraw();if(lastUI<0||now-lastUI>120)ui(now);requestAnimationFrame(tick);}
// Input: Space heats, N a new batch, B butter, S (or the door) scoops; Enter and Space on a focused part are its own.
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const k=e.key.toLowerCase();if((k===' '||k==='enter')&&e.target&&e.target.closest&&e.target.closest('[role=button]'))return;
const f={' ':heatKey,n:batchKey,b:butterKey,s:scoopKey}[k];if(f){e.preventDefault();f();}});
bind(heatSw,heatKey);bind(doorG,scoopKey);bind(jarG,batchKey);bind(pumpG,butterKey);
{const a=P(37,32,57.6),b=P(37,32,KZ+1);set(pourS,'d',`M${pt(a)}L${pt(b)}`);}
sync();redraw();ui(0);requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
