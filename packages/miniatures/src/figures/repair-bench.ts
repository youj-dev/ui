// @ts-nocheck
/* OSTRA B–3 · Repair bench. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--wood:#c39a6b;--wood-top:#d8b385;--wood-side:#a87f52;--peg:#d9cdb6;--peg-top:#e8dfcc;--peg-side:#c2b69f;--pcb:#3f7a60;--trace:#7cb497;--gold:#d0a94e;--chip:#2d2d2c;--grip:#3a3a39;--hot:#ff8a2a;--smoke:#7a7a76;--rubber:#2e2e2d;--sponge:#e3c95a;--pool:#fff4d6;--pool-a:.55;--red:#d94436;--blk:#2a2a2a;--amber:#ffad2b;--green:#36d886}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--wood:#a48159;--wood-top:#caa77c;--wood-side:#765837;--peg:#b7ac99;--peg-top:#d9d1bf;--peg-side:#88806f;--pcb:#346650;--trace:#68977f;--gold:#af8e40;--chip:#242424;--grip:#2f2f2f;--hot:#ff8a2a;--smoke:#666663;--rubber:#252524;--sponge:#bfa94b;--pool:#ffe7b0;--red:#b7382c;--blk:#222222;--amber:#ffad2b;--green:#2cb670;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:4.6px;letter-spacing:1.3px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.peg{fill:var(--peg)}.top.peg{fill:var(--peg-top)}.side.peg{fill:var(--peg-side)}.grain{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.22}
.pcb{fill:var(--pcb)}.trace{fill:none;stroke:var(--trace);stroke-width:.55;stroke-linecap:round;stroke-linejoin:round}.gold{fill:var(--gold)}.chip{fill:var(--chip)}.top.chip{fill:var(--chip)}.side.chip{fill:var(--chip)}.grip{fill:var(--grip)}.top.grip,.side.grip{fill:var(--grip)}.rubber{fill:var(--rubber)}.sponge{fill:var(--sponge)}.top.sponge{fill:var(--sponge)}
.joint{fill:#b9bcbd}.joint.shine{fill:#f4f6f6}.joint.hot{fill:var(--hot);filter:url(#glow)}.tip{fill:var(--hot);filter:url(#glow)}.smoke{fill:none;stroke:var(--smoke);stroke-linecap:round}
.lens{fill:#fff;fill-opacity:.18;stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.pool{fill:url(#poolG);opacity:0;pointer-events:none}.cone{fill:url(#coneG);opacity:0;pointer-events:none}.ringlit{fill:none;stroke:var(--pool);stroke-width:1.6;opacity:0;filter:url(#glow)}
.cu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.cb{fill:none;stroke-linecap:round;stroke-linejoin:round}.kr{stroke:var(--red)}.redf{fill:var(--red)}.kk{stroke:var(--blk)}.kg{stroke:var(--grip)}
.lamp{fill:var(--off);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.r,.lamp.b{filter:url(#glow);stroke:none}
.dome{fill:var(--amber);fill-opacity:.55}.g .dome{fill:var(--green)}.dcore{fill:var(--amber);filter:url(#glow)}.g .dcore{fill:var(--green)}.sweep{fill:url(#beamA);pointer-events:none}.g .sweep{display:none}.bh{fill:var(--amber);opacity:.35;filter:url(#bloom);pointer-events:none}.g .bh{fill:var(--green)}
.seg7{fill:var(--fault);font:600 4.6px ui-monospace,monospace;letter-spacing:.4px;filter:url(#glow);stroke:none}.needle{stroke:var(--red);stroke-width:.55;stroke-linecap:round}.scale{fill:none;stroke:var(--ink);stroke-width:.35}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<pattern id="holes" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2.5" cy="2.5" r=".7" style="fill:var(--line);opacity:.45"/></pattern>
<radialGradient id="poolG"><stop offset="0" style="stop-color:var(--pool);stop-opacity:var(--pool-a)"/><stop offset=".6" style="stop-color:var(--pool);stop-opacity:calc(var(--pool-a)*.5)"/><stop offset="1" style="stop-color:var(--pool);stop-opacity:0"/></radialGradient>
<linearGradient id="coneG" x2="0" y2="1"><stop offset="0" style="stop-color:var(--pool);stop-opacity:.5"/><stop offset="1" style="stop-color:var(--pool);stop-opacity:0"/></linearGradient>
<radialGradient id="beamA" cx="0" cy="0" r="60" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:var(--amber);stop-opacity:.6"/><stop offset="1" style="stop-color:var(--amber);stop-opacity:0"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* OSTRA B–3 repair bench. World: x lower-right; y lower-left; z up. 1 unit ≈ 1 cm.
Part x y z w d h
legs ×4 3/172 3/75 16 5 5 18 (floor z 16) · shelf 5 5 20 170 74 2 · bins
bench top (beech) 0 0 34 180 84 6 (work surface z 40)
pegboard 4 −6 40 172 4 78 · hanging tools · service panel 116 −2 72 46 3 38 · beacon 166 −4 118 r4.4 – 12
tool chest 10 8 40 36 26 30 · top drawer slides 0…16 in +y
lamp clamp 58 2 40 8 6 6 · post r1.6 to 70 · arms 62 5 70 → 64 18 106 → 79 35 92.6 · head r15 at 88 46 90
device housing 64 32 40 48 34 10 (cavity 66.5 34.5 46 43 29 4) · board 68 36 46 40 26 · lid hinge y 32 z 50, opens to 105°
soldering station 132 8 40 30 22 14 · iron stand 122 46 40 24 16 3 + coil · iron 36 long, tip rests at 134 56 47
multimeter (upright) 150 64 40 26 9 22 · probes to pads 104 46 / 104 52
robot arm base 54 66 40 r6.5 · upper arm 30 · forearm 30 · driver bit 8
Grain, print, holes and screws share their parent face. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: vectors, rods on any axis, slabs, splines, lamps, controls.
const draw=root,into=g=>root=g,defs=svg.querySelector('defs'),f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=p=>p*p*(3-2*p),RAD=Math.PI/180;
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(Math.hypot(...a)||1)),lerp=(a,b,k)=>a.map((v,i)=>v+(b[i]-v)*k);
const plane=(o,U,V)=>`matrix(${P(...U).map(f2).join(' ')} ${P(...V).map(f2).join(' ')} ${P(...o).map(f2).join(' ')})`,tr=(x,y,z)=>`translate(${P(x,y,z).map(f2).join(' ')})`;
const ring=(n,f)=>Array.from({length:n},(_,i)=>f(i/n*Math.PI*2)),pd=q=>'M'+q.map(p=>f2(p[0])+','+f2(p[1])).join('L')+'Z';
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const p of pts){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(const p of pts.reverse()){while(hi.length>1&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
const frameOf=n=>{const U=unit(Math.abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));return[U,cross(n,U)];};
function rod(a,b,r,cls=''){const ax=sub(b,a),n=unit(ax),[U,V]=frameOf(n),e=dot(n,[1,1,1])>0?b:a,c0=ring(r>4?36:14,t=>add(a,add(mul(U,r*Math.cos(t)),mul(V,r*Math.sin(t))))),c1=c0.map(p=>add(p,ax));
el('path',{d:pd(hull([...c0,...c1].map(p=>P(...p)))),class:'face '+cls});el('path',{d:pd((e===b?c1:c0).map(p=>P(...p))),class:'face top '+cls});return group(plane(e,U,V));}
function slab(o,A,B,N,cls=''){const F=[[o,A,B,mul(N,-1)],[add(o,N),A,B,N],[o,A,N,mul(B,-1)],[add(o,B),A,N,B],[o,B,N,mul(A,-1)],[add(o,A),B,N,A]];
for(const[p,u,v,n]of F){if(dot(n,[1,1,1])<=1e-6)continue;const a=n.map(Math.abs);el('path',{d:pd([p,add(p,u),add(add(p,u),v),add(p,v)].map(q=>P(...q))),class:`face ${a[2]>=a[0]&&a[2]>=a[1]?'top':a[0]>a[1]?'side':''} ${cls}`});}}
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
function lamp(g,x,y,r=1){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c,base='lamp'){if(n._c!==c){n._c=c;set(n,'class',base+(c?' '+c:''));}}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,label){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0','aria-label':label}))set(g,k,v);return g;}
function cord(pts,w,cls){const d=smooth(pts);const a=el('path',{d,class:'cu','stroke-width':w+.9}),b=el('path',{d,class:'cb '+cls,'stroke-width':w});return[a,b];}
// Floor shadow, bench frame and shelf, beech top with grain.
const s0=P(90,42,16);el('ellipse',{cx:s0[0],cy:s0[1]+4,rx:120,ry:40,class:'shadow stage-floor'});el('ellipse',{cx:s0[0],cy:s0[1]+4,rx:120,ry:40,class:'stage-contact'});
for(const[x,y]of[[3,3],[172,3],[3,75]])box(x,y,16,5,5,18,1,'metal');
box(5,5,20,170,74,2,1,'metal');box(18,14,22,26,20,10,2,'');box(48,16,22,20,16,7,2,'');{const sf=group(FRONT(18,34,32));rect(sf,3,3,20,3.4,1,'face recess');}
box(172,75,16,5,5,18,1,'metal');
box(0,0,34,180,84,6,2,'wood');{const bt=group(TOP(0,0,40));for(let v=10;v<84;v+=10.4)el('path',{d:`M2,${v}C50,${v+.8} 120,${v-.7} 178,${v+.3}`,class:'grain'},bt);const bf=group(FRONT(0,84,40));line(bf,0,1.2,180,1.2);}
// Pegboard with hanging tools, the service checklist and the beacon.
box(4,-6,40,172,4,78,1.5,'peg');const pg=group(FRONT(4,-2,118));rect(pg,0,0,172,78,1.5,'').style.fill='url(#holes)';
const TOOL=(x,y,h,c)=>{rect(pg,x-1.6,y,3.2,h*.42,1.2,'face '+c);rect(pg,x-.5,y+h*.42,1,h*.58,.4,'face metal');circle(pg,x,y-1.6,.9,'face recess');};
TOOL(70,14,26,'rubber');TOOL(76,14,30,'redf');TOOL(82,14,22,'rubber');TOOL(88,14,28,'grip');
el('path',{d:'M96,12l4,0l1,4l-2,26l-2,0l-1,-26ZM104,12l4,0l-1,4l-1,26l-2,0l-1,-26Z',class:'face rubber'},pg);
el('path',{d:'M14,10h7l-1,3h-1.6v34h-1.8v-34h-1.6ZM14,47a3.5,3.5 0 1 0 7,0Z',class:'face metal'},pg);el('path',{d:'M26,12a4,4 0 1 1 6,0l-1.6,0l0,36l-2.8,0l0,-36Z',class:'face metal'},pg);
box(116,-2,72,46,3,38,1.5,'');const sp=group(FRONT(116,1,110));rect(sp,2,2,42,34,1.2,'detail');text(sp,4.5,7.6,'SERVICE','label brand');
const STEPS=['INSPECT','SOLDER','FASTEN','TEST','CLOSE'],ROWS=STEPS.map((n,i)=>{const y=12.6+i*4.9;text(sp,8.4,y+1.3,n,'etch');rect(sp,31,y-.4,10,1.6,.8,'face recess');const bar=rect(sp,31,y-.4,0,1.6,.8,'face');bar.style.fill='var(--warn)';bar.style.stroke='none';return{l:lamp(sp,5.2,y+.4,1),bar};});
for(const u of[4,42])screw(sp,u,34);
cylinder(166,-4,118,4.4,2.6,'z','metal');const BC=el('g',{});into(BC);const bh=P(166,-4,123.6);el('circle',{cx:bh[0],cy:bh[1],r:9,class:'bh'});
const bsw=group(TOP(166,-4,123.6));const sweep=group('',bsw);for(const a of[0,180])el('path',{d:'M0,0L60,-8A60,60 0 0 1 60,8Z',class:'sweep',transform:`rotate(${a})`},sweep);
const dome=cylinder(166,-4,120.6,3.6,6,'z','dome');set(dome.g.firstChild,'class','face dome');set(dome.face.firstChild,'class','face dome');const dc=el('ellipse',{cx:bh[0],cy:bh[1],rx:1.8,ry:2.8,class:'dcore'});ellipse(166,-4,126.6,2.4,'z','face top metal');into(draw);
// Tool chest with a sliding top drawer.
box(10,8,40,36,26,30,2,'');{const cf=group(FRONT(10,34,70));for(const v of[11,20]){rect(cf,2,v,32,8,1.2,'face');rect(cf,13,v+3,10,2,1,'face recess');}text(cf,18,28.6,'OSTRA','etch micro center');}
box(22,16,70,12,8,2,1,'metal');
const DR=el('g',{});let drawer=0,drTo=0;
function drawDrawer(k){DR.replaceChildren();into(DR);const e=16*k;if(e>.3){box(12,34,61,32,e,8,1,'');const dt=group(TOP(12,34,69.02));rect(dt,1.6,0,28.8,Math.max(0,e-1.6),.8,'face recess');
if(e>7)for(const[u,c]of[[6,'redf'],[11,'rubber'],[16,'grip'],[21,'redf'],[26,'rubber']]){rect(dt,u-1.3,1,2.6,Math.min(6,e-3),1.1,'face '+c);}}
const df=group(FRONT(12,34+e,69));rect(df,0,0,32,8,1.2,'face');rect(df,11,3,10,2,1,'face recess');rect(df,-1,-1,34,10,2,'focus-ring');into(draw);}
button(DR,'Tool chest drawer: open or close (D)');set(DR,'aria-pressed','false');drawDrawer(0);
// Magnifier lamp: clamp, post, two arms, head; the light falls on the board.
box(58,2,40,8,6,6,1.5,'metal');cylinder(62,5,46,1.6,24,'z','metal');
const LP=[[62,5,70],[64,18,106],[79,35,92.6]];rod(LP[0],LP[1],1.4,'metal');for(const k of[.3,.5,.7])rod(lerp(LP[0],LP[1],k-.04),lerp(LP[0],LP[1],k+.04),1.9,'metal');
// The device: housing with a cavity, the board inside, the lid on its hinge.
box(64,32,40,48,34,10,2.5,'');{const hf=group(FRONT(64,66,50));text(hf,4,6.4,'MODEL 7','etch micro');slits(hf,30,3,14,4,7);}
const devLed=lamp(group(FRONT(64,66,50)),24,5,1);
el('path',{d:pd([[66.5,34.5],[109.5,34.5],[109.5,63.5],[66.5,63.5]].map(([x,y])=>P(x,y,50))),class:'face recess'});
const cav=el('clipPath',{id:'cav'},defs);el('path',{d:pd([[66.5,34.5],[109.5,34.5],[109.5,63.5],[66.5,63.5]].map(([x,y])=>P(x,y,50)))},cav);
const CV=into(el('g',{'clip-path':'url(#cav)'},draw));
el('path',{d:pd([[66.5,34.5,50],[109.5,34.5,50],[109.5,34.5,46],[66.5,34.5,46]].map(p=>P(...p))),class:'face base'});el('path',{d:pd([[66.5,34.5,50],[66.5,63.5,50],[66.5,63.5,46],[66.5,34.5,46]].map(p=>P(...p))),class:'face side base'});
const pc=group(TOP(68,36,46.02));rect(pc,0,0,40,26,1.2,'face pcb');
for(const d of['M3,6H12V14H20','M6,20H16L22,14','M22,4V10H34','M24,20H33V12','M14,3H30','M4,12H8V22'])el('path',{d,class:'trace'},pc);
for(const[u,v]of[[35,10],[35,16]])rect(pc,u,v,3,2.4,.4,'face gold');
box(80,42,46.02,11,11,1.6,.8,'chip');{const ct=group(TOP(80,42,47.64));circle(ct,2,2,.6,'detail');for(let i=1;i<10;i++){line(ct,i*1.1,-.8,i*1.1,0);line(ct,-.8,i*1.1,0,i*1.1);}}
box(95,39,46.02,7,5,1.4,.6,'chip');box(95,49,46.02,7,5,1.4,.6,'chip');box(70,55,46.02,10,4,3,.8,'');
for(const[x,y]of[[73,44],[73,50]]){const c=cylinder(x,y,46.02,2,3.8,'z','rubber');circle(c.face,0,0,1.2,'detail');}
const JTS=[[76.5,40.5],[78.5,40.5],[90,58.5],[92,58.5],[100,46]],JE=JTS.map(([x,y])=>circle(group(TOP(x,y,46.4)),0,0,.95,'joint'));
const SCR=[[71,39],[105,39],[71,59],[105,59]],SE=SCR.map(([x,y])=>{const g=group(TOP(x,y,46.6));circle(g,0,0,1.7,'face metal');const s=group('',g);line(s,-1.2,0,1.2,0);return{g,s,x,y,a:0,tight:0};});
into(draw);
const pool=el('ellipse',{class:'pool'});{const p=P(88,47,46.5);set(pool,'cx',p[0]);set(pool,'cy',p[1]);set(pool,'rx',34);set(pool,'ry',20);}
const LID=el('g',{});let lidA=105;
function drawLid(a){LID.replaceChildren();into(LID);const t=a*RAD,B=[0,34*Math.cos(t),34*Math.sin(t)],N=[0,-2.6*Math.sin(t),2.6*Math.cos(t)],o=[64,32,50];slab(o,[48,0,0],B,N,'');
if(dot(mul(N,-1),[1,1,1])>0){const g=group(plane(add(o,B),[1,0,0],mul(unit(B),-1)));rect(g,3,3,42,28,1.6,'detail');rect(g,13,9,22,14,1.6,'face base');text(g,24,17.4,'Li-ion 3.7 V','etch micro center');line(g,15,20,33,20);for(const[u,v]of[[5,5],[43,5],[5,29],[43,29]])circle(g,u,v,1.6,'face recess');}
else{const g=group(plane(add(o,N),[1,0,0],unit(B)));text(g,24,18,'OSTRA','label brand center');slits(g,8,5,32,4,12);}into(draw);}
drawLid(lidA);
// Soldering station, iron stand with sponge and coil.
box(132,8,40,30,22,14,2,'');const st=group(FRONT(132,30,54));rect(st,3,3,13,7,1,'face recess');rect(st,3.5,3.5,12,6,.8,'face glass');const TD=text(st,5,8.4,'350','seg7');text(st,17.4,8.3,'°C','etch micro');text(st,4,12.4,'SOLDA','etch micro');
const kn=cylinder(156,30,47,3,2.4,'y','grip');line(kn.face,0,-2.4,0,-.8);
box(122,46,40,24,16,3,1.5,'metal');box(124,48,43,9,8,2,1,'metal');box(125,49,45,7,6,1.6,.8,'sponge');
const D=unit([.55,-.1,.85]),R0=[134,56,47.2];rod([139,56,43],add(R0,mul(D,10)),.7,'metal');
// The device's robot driver: base, turntable; arms follow.
cylinder(54,66,40,6.5,3,'z','metal');const ROB=el('g',{});
// The iron (drawn tip at 0 0 0, moved as one), probes and leads, multimeter.
const IR=el('g',{});into(IR);rod([0,0,0],mul(D,3.2),.6,'metal');rod(mul(D,3),mul(D,15),.9,'metal');rod(mul(D,15),mul(D,17),1.7,'metal');const gr=rod(mul(D,17),mul(D,33),2.5,'grip');rod(mul(D,33),mul(D,36),1.9,'grip');for(const s of[20,23,26,29]){const[U,V]=frameOf(D);el('path',{d:pd(ring(16,t=>P(...add(mul(D,s),add(mul(U,2.55*Math.cos(t)),mul(V,2.55*Math.sin(t))))))),class:'detail'});}
const tipG=circle(IR,0,0,1.1,'tip');into(draw);
const COIL=el('g',{});for(let s=8;s<=26;s+=3.6){const[U,V]=frameOf(D),c=add(R0,mul(D,s));el('path',{d:pd(ring(18,t=>P(...add(c,add(mul(U,3.8*Math.cos(t)),mul(V,3.8*Math.sin(t))))))),class:'detail'},COIL).style.strokeWidth='1.1';}
const ironCord=cord([[0,0,0],[0,0,0]],1.3,'kg');
box(150,64,40,26,9,22,2.5,'');const mf=group(FRONT(150,73,62));rect(mf,2,2,22,12.4,1.2,'face recess');rect(mf,2.8,2.8,20.4,10.8,.8,'face top');
for(let i=0;i<=10;i++){const a=(-50+10*i)*RAD;line(mf,13+Math.sin(a)*8.6,13-Math.cos(a)*8.6,13+Math.sin(a)*(i%5?9.5:10.2),13-Math.cos(a)*(i%5?9.5:10.2),'scale');}
el('path',{d:`M${f2(13-Math.sin(50*RAD)*7.2)},${f2(13-Math.cos(50*RAD)*7.2)}A7.2,7.2 0 0 1 ${f2(13+Math.sin(50*RAD)*7.2)},${f2(13-Math.cos(50*RAD)*7.2)}`,class:'scale'},mf);text(mf,13,9.6,'Ω · V','etch micro center');
const NDL=group('translate(13 13)',mf);line(NDL,0,0,0,-9.4,'needle');circle(mf,13,13,.9,'face metal');
const rg=cylinder(163,73,46,3.2,2,'y','grip');const RK=group('',rg.face);line(RK,0,-2.6,0,-.6);text(mf,4,18.6,'OSTRA M3','etch micro');
for(const[x,c]of[[154.5,'kr'],[171.5,'kk']]){const j=cylinder(x,73,44,1.3,1.6,'y',c==='kr'?'':'grip');if(c==='kr'){set(j.g.firstChild,'class','face redf');set(j.face.firstChild,'class','face redf');}}
const PADS=[[104.6,47,46.5],[104.6,52.2,46.5]];
// Probe leads: clipped to the board's pads, or parked on the bench (k = 1) before the case closes.
const LEAD=[[[[154.5,74.6,44],[154,80,41.2],[136,80,41.2],[120,70,41.2],[115,60,52],[110,52,50.6]],PADS[0],[[154.5,74.6,44],[154,80,41.2],[136,80,41.2],[128,78,41.2],[124,77,41.4],[122,76,41.6]],[113,72,41.6],'kr',''],[[[171.5,74.6,44],[171,82,41.2],[140,83,41.2],[121,73,41.2],[116,62,52.6],[110,57,51]],PADS[1],[[171.5,74.6,44],[171,82,41.2],[140,83,41.2],[132,82,41.2],[128,81.5,41.4],[126,81,41.6]],[117,78,41.6],'kk','grip']].map(l=>({l,c:cord(l[0],1.1,l[4])}));
const PRB=el('g',{});let pk=0,pkD=-1;
function probes(k){if(Math.abs(k-pkD)<.002)return;pkD=k;PRB.replaceChildren();into(PRB);const e=ease(k);for(const{l,c}of LEAD){const pts=l[0].map((p,i)=>lerp(p,l[2][i],e)),d=smooth(pts);c.forEach(n=>set(n,'d',d));rod(pts[5],lerp(l[1],l[3],e),.8,l[5]);}into(draw);}
probes(0);
// Lamp head, light cone and smoke above everything on the bench.
const CONE=el('path',{class:'cone'});
rod(LP[1],LP[2],1.3,'metal');const hd=cylinder(88,46,90,15,3.4,'z','metal');circle(hd.face,0,0,11.6,'lens');const ringL=circle(hd.face,0,0,13.2,'ringlit');el('path',{d:'M-8,-4.4A9,9 0 0 1 -2,-9',class:'detail',style:'stroke:#fff;stroke-width:1.2;opacity:.7'},hd.face);
const lampBtn=button(el('g',{}),'Magnifier lamp: switch the light (L)');set(lampBtn,'aria-pressed','true');circle(group(TOP(88,46,93.4),lampBtn),0,0,17,'hit');circle(group(TOP(88,46,93.4),lampBtn),0,0,17.5,'focus-ring');
const SMOKE=el('g',{}),PUFF=[...Array(10)].map(()=>({p:el('path',{class:'smoke'},SMOKE),t:-1e9}));
frame([[0,-6,16,180,90,24],[4,-6,40,172,4,90],[48,2,40,56,60,70]],8);
// State: activities (inspect, solder, fasten, test), tools easing to their poses, checklist, lid, beacon.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),keys={};
const DUR=[3,5.8,5.6,2.6],NM=['INSPECT','SOLDER','FASTEN','TEST'];
let msg='',msgT=0,mode='ind',prog=0,done=0,act=1,at=2.4,cycle=1,lampOn=true,lampK=1,needle=0,nv=0,nT=0,nNext=0,beacon=0,iron=R0.slice(),wrist=[80,52,76],lt=0,lastUI=-1,temp=350,closeT=0,ac=null,lastPuff=0,touchJ=-1,spinS=-1;
const say=m=>{announcement.textContent=m;},note=(m,a)=>{msg=m;msgT=performance.now()+1800;say(a);lastUI=-1;};
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac)ac=new A();if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,v,d,at=0,type='sine'){if(!ac)return;try{const t=ac.currentTime+at,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.05);}catch(_){}}
// Scripts: the iron visits three joints; the driver visits four screws.
const above=(p,h)=>[p[0],p[1],p[2]+h],J3=c=>[0,1,2,3,4].filter((_,i)=>(i+c)%5<3).map(i=>[...JTS[i],46.6]);
function ironTarget(t,c){const J=J3(c),K=[[0,R0],[.5,above(R0,16)],[1.1,above(J[0],10)]];J.forEach((j,i)=>{const t0=1.3+i*1.3;K.push([t0,j,i],[t0+.8,j,i],[t0+1.05,above(j,9)]);});K.push([5,above(R0,16)],[5.6,R0]);
for(let i=1;i<K.length;i++)if(t<=K[i][0]){const[a,p]=K[i-1],[b,q,ji]=K[i],k=ease(clamp((t-a)/(b-a)));return{p:lerp(p,q,k),j:K[i-1][2]===ji&&ji!==undefined?J.indexOf(q):-1,jp:q};}return{p:R0,j:-1};}
const HOMEW=[80,52,76];
function wristTarget(t){const K=[[0,HOMEW]];SCR.forEach(([x,y],i)=>{const t0=.5+i*1.25;K.push([t0,[x,y,64]],[t0+.25,[x,y,56.6],i],[t0+.95,[x,y,56.6],i],[t0+1.15,[x,y,64]]);});K.push([5.6,HOMEW]);
for(let i=1;i<K.length;i++)if(t<=K[i][0]){const[a,p,ia]=K[i-1],[b,q,ib]=K[i],k=ease(clamp((t-a)/(b-a)));return{p:lerp(p,q,k),s:ia!==undefined&&ia===ib?ia:-1};}return{p:HOMEW,s:-1};}
// Robot arm: planar two-link IK about its base, rebuilt each frame it moves.
function drawRobot(w,spin){ROB.replaceChildren();into(ROB);const B=[54,66,47],h=sub(w,B),yaw=Math.atan2(h[1],h[0]),r=Math.hypot(h[0],h[1]),z=h[2],L=30,dd=Math.min(59.5,Math.hypot(r,z)),q2=Math.acos(clamp((dd*dd-2*L*L)/(2*L*L),-1,1)),q1=Math.atan2(z,r)+Math.atan2(L*Math.sin(q2),L+L*Math.cos(q2)),dir=[Math.cos(yaw),Math.sin(yaw),0],E=add(B,add(mul(dir,L*Math.cos(q1)),[0,0,L*Math.sin(q1)]));
rod([54,66,43],[54,66,47],5,'');const nrm=[-Math.sin(yaw),Math.cos(yaw),0];rod(add(B,mul(nrm,-3.2)),add(B,mul(nrm,3.2)),3.6,'metal');rod(B,E,2,'');const eg=rod(add(E,mul(nrm,-2.6)),add(E,mul(nrm,2.6)),2.8,'metal');circle(eg,0,0,1.4,'lamp b');rod(E,w,1.6,'');rod(w,add(w,[0,0,-3]),1.8,'metal');const bit=rod(add(w,[0,0,-3]),add(w,[0,0,-9.6]),.55,'metal');
if(spin>=0){const p=P(...add(w,[0,0,-6]));el('ellipse',{cx:f2(p[0]),cy:f2(p[1]),rx:2.4,ry:1.4,class:'detail',style:'stroke:var(--accent);opacity:.8'});}into(draw);}
// Smoke: wisps rise from the hot tip; denser while it touches a joint.
function puff(t,x,y,s){const q=PUFF.find(p=>t-p.t>2400)||PUFF[0];q.t=t;q.x=x;q.y=y;q.s=s;q.r=Math.random()*6;}
function smoke(t){for(const q of PUFF){const k=(t-q.t)/2400;if(k<0||k>1){if(q.on){q.on=0;set(q.p,'d','');}continue;}q.on=1;const pts=[0,.25,.5,.75,1].map(u=>{const h=u*k*30;return[q.x+Math.sin(q.r+u*3+t/900)*u*k*5,q.y-h];});set(q.p,'d','M'+pts.map(p=>p.map(f2).join(',')).join('L'));q.p.style.opacity=f2((1-k)*(q.s?.55:.3));q.p.style.strokeWidth=f2(.5+k*1.6);}}
function goal(){return done?4:mode==='det'?Math.min(4,Math.floor(prog*4+1e-6)):-1;}
function sync(){lastUI=-1;set(keys.i,'aria-pressed',mode==='ind'&&!done);set(keys.l,'aria-pressed',lampOn);set(lampBtn,'aria-pressed',lampOn);set(keys.d,'aria-pressed',drTo>0);set(DR,'aria-pressed',drTo>0);lastUI=-1;}
function setProgress(p){done=0;closeT=0;if(p==null||!isFinite(p))mode='ind';else{mode='det';prog=clamp(+p);const g=goal();if(g<4&&act!==g){act=g;at=0;}}sync();}
function finish(){audio();if(done)return;done=1;closeT=0;say('Finishing: tools return, the case closes.');sync();}
function stepKey(){audio();setProgress(mode==='det'&&!done?(prog>=1?0:Math.min(1,Math.floor(prog*4+1e-6)/4+.25)):.25);say(`Progress ${Math.round(prog*100)} percent: ${goal()} of 4 checks done.`);}
function indKey(){audio();if(mode==='ind'&&!done){setProgress(act/4);say(`Determinate at step ${act+1} of 4.`);}else{setProgress(null);say('Indeterminate: the repair cycle runs by itself.');}}
function lampKey(){audio();lampOn=!lampOn;tone(lampOn?900:500,.012,.05);note(lampOn?'LAMP ON · 5× LENS':'LAMP OFF',lampOn?'Lamp on.':'Lamp off.');sync();}
function drawerKey(){audio();drTo=drTo?0:1;tone(220,.012,.08,0,'triangle');note(drTo?'DRAWER OPEN · SCREWDRIVERS':'DRAWER CLOSED',drTo?'Drawer open: screwdrivers.':'Drawer closed.');sync();}
window.figure={setProgress,done:finish};
bind(lampBtn,lampKey);bind(DR,drawerKey);
const actK={p:stepKey,i:indKey,enter:finish,l:lampKey,d:drawerKey};
document.querySelectorAll('.hint [data-k]').forEach(b=>{keys[b.dataset.k]=b;b.addEventListener('click',()=>actK[b.dataset.k]());});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const k=e.key.toLowerCase();if((k==='enter'||k===' ')&&e.target.closest&&e.target.closest('button,[role=button]'))return;if(actK[k]){e.preventDefault();actK[k]();}});
function tick(t){
const dt=Math.min(.05,(t-(lt||t))/1000),red=reduced.matches;lt=t;
const g=goal();
// Activity clock: indeterminate loops all four; determinate holds the current step; done parks the tools.
if(!red){if(mode==='ind'&&!done){at+=dt;if(at>=DUR[act]){at=0;act=(act+1)%4;if(!act){cycle++;JE.forEach(j=>j.sh=0);SE.forEach(s=>s.tight=0);}}}
else if(!done&&g<4){if(act!==g){act=g;at=0;}at=(at+dt)%DUR[act];}}
const working=!done&&(mode==='ind'||g<4),A=working?act:-1;
const it=A===1?ironTarget(red?3.2:at,cycle):{p:R0,j:-1},wt=A===2?wristTarget(red?.8:at):{p:HOMEW,s:-1};
const k=red?1:clamp(dt*9);iron=lerp(iron,it.p,k);wrist=lerp(wrist,wt.p,k);
const touching=it.j>=0&&Math.hypot(...sub(iron,it.jp))<.8;
if(touching){const J=JE[[0,1,2,3,4].filter((_,i)=>(i+cycle)%5<3)[it.j]];if(J&&!J.sh){J.sh=1;tone(1400,.004,.08);}}
JE.forEach((j,i)=>set(j,'class','joint'+(touching&&JE[[0,1,2,3,4].filter((_,q)=>(q+cycle)%5<3)[it.j]]===j?' hot':j.sh||mode==='det'&&g>1||done?' shine':'')));
if(wt.s>=0&&Math.hypot(...sub(wrist,wt.p))<.8){const s=SE[wt.s];s.a+=dt*900;s.tight=Math.min(1,s.tight+dt*1.3);}
SE.forEach(s=>{const tg=s.tight||mode==='det'&&g>2||done;set(s.s,'transform',`rotate(${f2(tg&&!s.a?40:s.a%180)})`);});
// Done: tools home, then the lid closes and the beacon turns green.
pk+=((done?1:0)-pk)*(red?1:clamp(dt*5));probes(pk);
if(done===1){const parked=Math.hypot(...sub(iron,R0))<1&&Math.hypot(...sub(wrist,HOMEW))<1&&pk>.97;if(parked||red)closeT+=red?9:dt;if(closeT>.2){lidA=Math.max(0,105-105*ease(clamp((closeT-.2)/1.3)));drawLid(lidA);if(closeT>1.5){done=2;tone(784,.02,.5);tone(1175,.016,.9,.12);say('Maintenance complete. Case closed, beacon green.');sync();}}}
if(!done&&lidA<105){lidA=Math.min(105,lidA+(red?105:dt*90));drawLid(lidA);}
// Iron, cord, tip glow, smoke, station temperature.
set(IR,'transform',tr(...iron));set(ironCord[0],'d',smooth([add(iron,mul(D,36)),add(iron,mul(D,44)),[150,40,41.2],[156,31.5,46]]));set(ironCord[1],'d',ironCord[0].getAttribute('d'));
tipG.style.opacity=f2(touching?1:.62+.08*Math.sin(t/300));set(tipG,'r',touching?1.6:1.1);
const tp=P(...iron);if(!red&&t-lastPuff>(touching?140:900)){lastPuff=t;puff(t,tp[0],tp[1]-1,touching);}if(red&&A===1&&!PUFF[0].on){puff(t-900,tp[0],tp[1]-1,1);}smoke(red?PUFF[0].t+900:t);
temp+=((touching?338:350)-temp)*clamp(dt*(touching?4:1.5));
// Robot, needle (a damped spring with twitch), beacon, lamp, drawer, checklist.
const ws=wrist.map(f2).join()+(wt.s>=0?1:0);if(ws!==drawRobot.k){drawRobot.k=ws;drawRobot(wrist,wt.s>=0&&Math.hypot(...sub(wrist,wt.p))<.8?1:-1);}
if(t>nNext){nNext=t+(A===0?650:1100);nT=pk>.5?-50:A===0?(red?12:-30+Math.random()*60):A===3||g>=4?24:A===1?6:A===2?-4:0;}
const nt=nT+(touching?14:0)+(red?0:Math.sin(t/97)*1.2+Math.sin(t/41)*.6);if(red){needle=nt;nv=0;}else{nv+=((nt-needle)*60-nv*7.5)*dt;needle+=nv*dt;}set(NDL,'transform',`translate(13 13) rotate(${f2(clamp(needle,-50,50))})`);set(RK,'transform',`rotate(${A===0?f2((t/12)%360):0})`);
const green=done===2;BC.classList.toggle('g',green);if(!red&&!green)beacon+=dt*3.6;set(sweep,'transform',`rotate(${f2(red?25:beacon/RAD%360)})`);dc.style.opacity=f2(green?1:.55+.45*Math.max(0,Math.cos(beacon-45*RAD)));
lampK+=((lampOn?1:0)-lampK)*(red?1:clamp(dt*8));pool.style.opacity=f2(lampK);CONE.style.opacity=f2(lampK*.75);ringL.style.opacity=f2(lampK);
if(!CONE.d){CONE.d=1;const pts=[...ring(24,a=>P(88+14*Math.cos(a),46+14*Math.sin(a),89.5)),...ring(24,a=>P(88+24*Math.cos(a),47+24*Math.sin(a),48))];set(CONE,'d',pd(hull(pts)));}
const dk=drawer;drawer+=(drTo-drawer)*(red?1:clamp(dt*9));if(Math.abs(drawer-dk)>.001||Math.abs(drawer-drTo)>.001&&red)drawDrawer(drawer);
const blink=red||Math.floor(t/450)%2===0;
ROWS.forEach((r,i)=>{const st=done===2?'g':i===4?(done?(blink?'a':''):''):done||i<(mode==='det'?g:act)?'g':i===A?(blink?'a':''):'';lit(r.l,st);set(r.bar,'width',f2(i===A?10*clamp(at/DUR[A]):st==='g'?10:0));r.bar.style.fill=st==='g'?'var(--ok)':'var(--warn)';});
lit(devLed,done===2||A===3||g>=4?'g':A===0?(blink?'r':''):'a');
if(lastUI<0||t-lastUI>140){lastUI=t;TD.textContent=String(Math.round(temp));
const n=done?4:mode==='det'?g:act;
readout.textContent=mode==='det'||done?`PROGRESS ${done===2?100:Math.round((done?1:prog)*100)}% · ${done===2?'CASE CLOSED':n+'/4 CHECKS'}`:`CYCLE ${String(cycle).padStart(2,'0')} · ${NM[act]} · STEP ${act+1}/4`;
stateLabel.textContent=t<msgT?msg:done===2?'MAINTENANCE COMPLETE · BEACON GREEN':done?(lidA<104?'CLOSING THE CASE':'PARKING THE TOOLS'):mode==='ind'?'UNDER MAINTENANCE · INDETERMINATE':g>=4?'ALL CHECKS PASSED · AWAITING CLOSE':`${NM[act]} · STEP ${act+1} OF 4`;}
requestAnimationFrame(tick);
}
sync();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['p', 'i', 'enter', 'l', 'd'], draw }
