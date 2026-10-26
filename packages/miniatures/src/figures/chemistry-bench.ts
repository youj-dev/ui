// @ts-nocheck
/* ALEMVER DS–7 · Chemistry bench. Drawn for this package in the lab figures' form: its stylesheet, defs and script,
 * on the engine's kit. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--shadow:#262626;--off:#b9b9b5;--chrome:#d9dad8;--chrome-top:#f4f4f2;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--dk:#3a3a39;--dk-top:#4a4a48;--rubber:#2e2e2d;--rubber-top:#474745;--wood:#b5845a;--wood-top:#d1a679;--wood-side:#92653f;--can:#45607a;--can-top:#5b7894;--plate:#f1f0eb;--env:#d5e0df;--env-a:.4;--film:.14;--shine:.92;--vap:.9;--pot:#e08a2e;--pot-hi:#f5c27c;--pot-lo:#b4601c;--dist:#acdde6;--dist-hi:#e4f6f8;--dist-lo:#7cc0ce;--water:#c4e4ec;--water-a:.42;--b0:#c6e0e5;--r1:#f0a539;--r2:#3f78e6;--r3:#31bd8a;--r4:#ec6b95;--x1:#cf3346;--x2:#1d9f69;--x3:#7b52d8;--x4:#e9b220;--fo:#8aaeff;--fi:#2e5cf2;--fc:#eef3ff;--fg:#6c8fff;--fl:.32;--frost-a:.5;--vap-c:#dbe7ee;--therm:#de3b2b;--clip1:#2f80d9;--clip2:#efbf2c;--cork:#c99d66;--rip:#5a9caf}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--chrome:#b7b7b6;--chrome-top:#e4e4e2;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--dk:#2f2f2f;--dk-top:#454543;--rubber:#252524;--rubber-top:#424240;--wood:#986e4b;--wood-top:#c39b71;--wood-side:#66452a;--can:#395066;--can-top:#55708a;--plate:#d6d6d1;--env:#a3b2b1;--env-a:.26;--film:.07;--shine:.62;--vap:.55;--pot:#c97b28;--pot-hi:#e3aa62;--pot-lo:#8c4a15;--dist:#8cc4cd;--dist-hi:#c9e9ed;--dist-lo:#5d9cab;--water:#8db1ba;--water-a:.34;--b0:#9ab6ba;--x1:#c02f42;--x2:#20a06a;--x3:#8a62e6;--x4:#d7a41f;--fl:.9;--frost-a:.16;--cork:#a6814e;--rip:#e6f6f9;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:2.2px ui-monospace,monospace;letter-spacing:.2px;stroke:none}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.serif{fill:var(--ink);font:italic 600 2.5px Georgia,'Times New Roman',serif;letter-spacing:.25px;stroke:none}.etch-l{fill:#d6d6d2;font:1.7px ui-monospace,monospace;letter-spacing:.2px;stroke:none}
.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.dk{fill:var(--dk)}.top.dk{fill:var(--dk-top)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.can{fill:var(--can)}.top.can{fill:var(--can-top)}.plate{fill:var(--plate)}.cork{fill:var(--cork)}
.env{fill:var(--env);fill-opacity:var(--env-a);stroke:none}.film{fill:#fff;fill-opacity:var(--film);stroke:var(--line);stroke-width:.9;vector-effect:non-scaling-stroke;stroke-linejoin:round}.gtube{fill:var(--glass);fill-opacity:.6;stroke:var(--line);stroke-width:.9;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.ring{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.5}.dimple{fill:var(--line);fill-opacity:.1;stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke;stroke-opacity:.45}.rim{fill:none;stroke:var(--line);stroke-width:2.4;opacity:.13}.frost{fill:url(#frost);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}
.shine{fill:none;stroke:#fff;stroke-linecap:round;opacity:var(--shine)}.shine.dim{opacity:calc(var(--shine)*.45)}.gu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.gt{fill:none;stroke:var(--glass);stroke-linecap:round;stroke-linejoin:round}
.pot{fill:url(#potG)}.pot-s{fill:var(--pot-hi);stroke:#fff;stroke-width:.35;stroke-opacity:.55}.dist{fill:url(#distG);fill-opacity:.92}.dist-s{fill:var(--dist-hi);stroke:#fff;stroke-width:.3;stroke-opacity:.6}.lshade{fill:url(#shadeG)}.lsurf{fill:#fff;opacity:.2}.liq{fill-opacity:.86}
.bub{fill:url(#bubG);stroke:#fff;stroke-width:.35;stroke-opacity:.85}.frost-a{fill:#fff;fill-opacity:var(--frost-a)}.dew-a{fill:var(--vap-c);fill-opacity:.85}.pop{fill:none;stroke:#fff;stroke-width:.35;opacity:0}.ripple{fill:none;stroke:var(--rip);stroke-width:.45;opacity:0}.mist{fill:url(#mistG);opacity:0}
.vapor{fill:url(#dew);opacity:0}.reflux{fill:none;stroke:#fff;stroke-width:.8;opacity:0}.reflux-u{fill:none;stroke:var(--line);stroke-width:1.4;opacity:0}.drop{fill:var(--dist);stroke:#fff;stroke-width:.3;stroke-opacity:.9}
.water{fill:var(--water);fill-opacity:var(--water-a);stroke:none}.coil-u{fill:none;stroke:var(--line);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.coil{fill:none;stroke:var(--glass);stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}.back{opacity:.45}.trickle{fill:none;stroke:var(--dist-hi);stroke-width:.8;stroke-linecap:round;stroke-dasharray:.5 2.2;opacity:0}
.flame-e{fill:var(--fo);opacity:.28}.flame-o{fill:var(--fo);opacity:.7}.flame-i{fill:var(--fi);opacity:.92}.flame-c{fill:var(--fc);opacity:.85}.flame-h{fill:var(--fg);opacity:0;filter:url(#bloom)}.fglow{fill:url(#glowG);opacity:0}
.therm{fill:none;stroke:var(--therm);stroke-width:.75;stroke-linecap:round}.bulb{fill:var(--therm)}.tick{fill:none;stroke:var(--line);stroke-width:.22;opacity:.8}
.clip1{fill:var(--clip1)}.clip2{fill:var(--clip2)}.r1{fill:var(--r1)}.r2{fill:var(--r2)}.r3{fill:var(--r3)}.r4{fill:var(--r4)}
.bar{fill:#fff;fill-opacity:.74;stroke:var(--line);stroke-opacity:.6;stroke-width:.5;vector-effect:non-scaling-stroke}.vortex{fill:#000;opacity:0}.swirl{fill:none;stroke:#fff;stroke-width:.45;stroke-linecap:round;opacity:0}.bloomc{opacity:0}
.stream{fill:none;stroke-linecap:round;stroke-width:1.25}.stream-h{fill:none;stroke:#fff;stroke-width:.35;stroke-linecap:round;opacity:.7}
.lamp{fill:var(--off);stroke:none}.lamp.b{fill:var(--accent);filter:url(#glow)}.halo{fill:var(--dist-hi);opacity:0;filter:url(#bloom)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<linearGradient id="potG" x2="0" y2="1"><stop offset="0" style="stop-color:var(--pot-hi)"/><stop offset=".4" style="stop-color:var(--pot)"/><stop offset="1" style="stop-color:var(--pot-lo)"/></linearGradient>
<linearGradient id="distG" x2="0" y2="1"><stop offset="0" style="stop-color:var(--dist-hi)"/><stop offset=".45" style="stop-color:var(--dist)"/><stop offset="1" style="stop-color:var(--dist-lo)"/></linearGradient>
<linearGradient id="shadeG" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".3"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
<radialGradient id="mistG"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<radialGradient id="glowG"><stop offset="0" style="stop-color:var(--fg);stop-opacity:.8"/><stop offset="1" style="stop-color:var(--fg);stop-opacity:0"/></radialGradient>
<pattern id="frost" width="1.1" height="1.1" patternUnits="userSpaceOnUse"><rect width="1.1" height="1.1" class="frost-a"/><circle cx=".55" cy=".55" r=".3" class="frost-a"/></pattern>
<pattern id="dew" width="2.2" height="2.6" patternUnits="userSpaceOnUse"><rect width="2.2" height="2.6" class="dew-a"/><circle cx=".6" cy=".7" r=".34" fill="#fff"/><circle cx="1.7" cy="2" r=".26" fill="#fff"/></pattern>
<radialGradient id="bubG" cx=".36" cy=".32" r=".75"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".35" stop-color="#fff" stop-opacity=".28"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* ALEMVER DS–7 distillation bench. World: x lower-right, y lower-left, z up; 1 unit ≈ 2 mm. The glass train runs along
the bench at 45° to the floor's axes, so it reads across the picture: T(u, w, z) puts u across and w toward the viewer.
Part                            u      w      z      size
stand: cast base · rod        −66    −10      0      r 13 × 3.4 · r 1.7 to 150; boss and fork clamp at 90 on the neck
burner: cartridge · barrel    −36      0      0      r 10 × 7.5, shoulder r 6.8 to 9.6, valve knob in front · r 2.5 to 31
flame                         −36      0   31.4      up to 17.5 tall by the heat (1–5), a faint envelope round it
boiling flask (round)         −36      0     66      r 21; neck r 5.4 to 90, frosted socket r 6.2 to 96, blue clip
Vigreux column · still head   −36      0     96      r 4.8 to 124 · to 136; screw cap; thermometer, bulb at 127, to 166
side arm, condenser                                  along d, 22° down from the head at 131: jacket r 8 from 16 to 82
                                                     round a glass coil r 4.6; water nozzles; yellow clip at the foot
bent adapter                                         from the jacket's foot down to a drip tip at u 62 z 47
receiving flask (conical)      62      0      0      r 17 → 6.2 at 38, neck to 52; marking spot
Floor axes (x, y z, w d h): hot plate 24 8 0, 34 32 11 with a beaker r 10.5 × 27 and a stir bar; beech test tube rack
−40 60 0, 46 12 26.6 with tubes r 3.1 × 40 at x −32/−22/−12/−2. Painter order: shadow, stand, burner and flame, flask,
clamp, column and head, condenser, adapter, receiver, rack and tubes, hot plate and beaker, a tube in flight. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{P,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,box}=kit(()=>root);
// Family helpers: vectors, the bench frame, projected outlines of round parts (never inside a face plane), hulls.
const f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>t*t*(3-2*t),RAD=Math.PI/180,R2=Math.SQRT1_2,KX=Math.sqrt(1.5),KY=R2;
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(Math.hypot(...a)||1));
const T=(u,w,z)=>[(u+w)*R2,(w-u)*R2,z],Q=(u,w,z)=>P(...T(u,w,z)),VIEW=unit([1,1,1]);
const ring=(n,f)=>Array.from({length:n},(_,i)=>f(i/n*Math.PI*2)),pd=q=>'M'+q.map(p=>f2(p[0])+','+f2(p[1])).join('L')+'Z',pt=p=>f2(p[0])+','+f2(p[1]);
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const p of pts){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(const p of pts.reverse()){while(hi.length>1&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
function axes(n){n=unit(n);const a=unit(Math.abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));return[a,cross(n,a)];}
const circ=(c,n,r,k=28)=>{const[a,b]=axes(n);return ring(k,t=>add(c,add(mul(a,r*Math.cos(t)),mul(b,r*Math.sin(t)))));};
const flat=(c,r,k=28)=>ring(k,t=>add(c,[r*Math.cos(t),r*Math.sin(t),0]));
const rodD=(a,b,r,k=24)=>pd(hull([...circ(a,sub(b,a),r,k),...circ(b,sub(b,a),r,k)].map(p=>P(...p))));
const ringD=(c,n,r,k=32)=>pd(circ(c,n,r,k).map(p=>P(...p)));
/* A vertical round part between screen points q0 (its foot) and q1 (its top), radius r; its front band; a level disc. */
const vcyl=(q0,q1,r,front=0)=>{const x=KX*r,a=`A${f2(x)},${f2(KY*r)} 0 0 `;return`M${pt([q1[0]-x,q1[1]])}L${pt([q0[0]-x,q0[1]])}${a}0 ${pt([q0[0]+x,q0[1]])}L${pt([q1[0]+x,q1[1]])}${a}${front} ${pt([q1[0]-x,q1[1]])}Z`;},op=(n,v)=>{n.style.opacity=f2(v);};
function disc(q,r,cls,parent=root){return el('ellipse',{cx:f2(q[0]),cy:f2(q[1]),rx:f2(KX*r),ry:f2(KY*r),class:cls},parent);}
function setDisc(n,q,r,k=1){set(n,'cx',f2(q[0]));set(n,'cy',f2(q[1]));set(n,'rx',f2(KX*r*k));set(n,'ry',f2(KY*r*k));}
function post(q0,q1,r,cls){el('path',{d:vcyl(q0,q1,r),class:'face '+cls});return disc(q1,r,'face top '+cls);}
const arc=(q,r,a0,a1)=>{const p=a=>[q[0]+r*Math.cos(a*RAD),q[1]+r*Math.sin(a*RAD)];return`M${pt(p(a0))}A${f2(r)},${f2(r)} 0 ${Math.abs(a1-a0)>180?1:0} ${a1>a0?1:0} ${pt(p(a1))}`;};
function smooth(q){let d=`M${pt(q[0])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${pt(c)}`;}return d;}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,label){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0','aria-label':label}))set(g,k,v);return g;}
// Floor: a soft shadow under the whole bench and the house floor under its middle (the dark pool spans the bench); the flame's light.
const sh=P(16,16,0);for(const[rx,ry,c]of[[100,33,'shadow'],[66,22,'shadow stage-floor'],[66,22,'stage-contact']])el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]),rx,ry,class:c});
const BU=[-36,0],fq=Q(...BU,31.4),floorGlow=el('ellipse',{cx:f2(fq[0]),cy:f2(Q(...BU,0)[1]),rx:30,ry:12,class:'fglow'});
// Stand: a cast base and a chrome rod; the boss for the clamp comes after the flask.
const ST=[-66,-10];post(Q(...ST,0),Q(...ST,3.4),13,'dk');disc(Q(...ST,3.45),9.6,'ring');post(Q(...ST,3.4),Q(...ST,150),1.7,'chrome');
const sp=T(...ST,0);box(sp[0]-2.9,sp[1]-2.9,86,5.8,5.8,8,1,'metal');
// The clamp's arm, its jaw bar, the back finger and its cork pad sit behind the neck.
const CZ=90,pad=w=>{const c=T(-36,w,0);box(c[0]-1.2,c[1]-1.2,CZ-2,2.4,2.4,4,.6,'cork');};
el('path',{d:rodD(T(-64.5,-9.2,CZ),T(-46.5,-1,CZ),1.15),class:'face chrome'});el('path',{d:rodD(T(-46.5,-6.2,CZ),T(-46.5,6.2,CZ),1.3),class:'face chrome'});
el('path',{d:rodD(T(-46.5,-6.2,CZ),T(-37,-6.2,CZ),1.05),class:'face chrome'});pad(-5.9);
// Burner: a gas cartridge with its valve, the barrel, air collar and mouth; then the flame and its halo.
post(Q(...BU,0),Q(...BU,7.5),10,'can');disc(Q(...BU,7.52),8.6,'ring');post(Q(...BU,7.5),Q(...BU,9.6),6.8,'can');
const valveN=unit([R2,R2,0]),valveC=T(BU[0],BU[1]+12.6,4.2);el('path',{d:rodD(T(BU[0],BU[1]+9.4,4.2),valveC,2.3),class:'face rubber'});
el('path',{d:ringD(valveC,valveN,2.3,24),class:'face top rubber'});const valvePtr=el('path',{class:'detail',style:'stroke:#e8e8e4'});
post(Q(...BU,9.6),Q(...BU,31),2.5,'chrome');post(Q(...BU,12.6),Q(...BU,17),3.15,'chrome');
{const h=Q(BU[0],BU[1]+3.2,14.8);el('ellipse',{cx:f2(h[0]),cy:f2(h[1]),rx:1.1,ry:1.5,class:'face recess'});}
post(Q(...BU,29.4),Q(...BU,31.4),3,'chrome');disc(Q(...BU,31.42),2.1,'face recess');
const flameH=el('ellipse',{cx:f2(fq[0]),cy:f2(fq[1]-9),rx:10,ry:15,class:'flame-h'}),flameE=el('path',{class:'flame-e'}),flameO=el('path',{class:'flame-o'}),flameI=el('path',{class:'flame-i'}),flameC=el('path',{class:'flame-c'});
// Boiling flask: back glass, the charge (gradient body, level, boiling stones), bubbles, mist, front glass, highlights.
const FZ=66,FR=21,FQ=Q(...BU,FZ),FS=KX*FR,NR=5.4,FC=T(...BU,FZ);
const nx=KX*NR,ny=KY*NR,jy=FQ[1]-Math.sqrt(FS*FS-nx*nx),nt=Q(...BU,90)[1];
const flaskD=`M${f2(FQ[0]-nx)},${f2(nt)}L${f2(FQ[0]-nx)},${f2(jy)}A${f2(FS)},${f2(FS)} 0 1 0 ${f2(FQ[0]+nx)},${f2(jy)}L${f2(FQ[0]+nx)},${f2(nt)}A${f2(nx)},${f2(ny)} 0 0 0 ${f2(FQ[0]-nx)},${f2(nt)}Z`;
el('path',{d:flaskD,class:'env'});
const potBody=el('path',{class:'pot'}),potShade=el('path',{class:'lshade'});
for(const[a,b,r]of[[-2,1.5,1.1],[3,-1,.9],[.5,3.5,.8]]){const q=Q(BU[0]+a,BU[1]+b,FZ-FR+1.4);el('ellipse',{cx:f2(q[0]),cy:f2(q[1]),rx:f2(r*1.3),ry:f2(r*.75),fill:'#6b4a2a',opacity:.55});}
const potSurf=el('ellipse',{class:'pot-s'}),potHi=el('ellipse',{class:'lsurf'});
const mist=el('ellipse',{cx:f2(FQ[0]),cy:f2(FQ[1]-FS*.42),rx:f2(FS*.5),ry:f2(FS*.22),class:'mist'});
const bubG=el('g',{}),BUB=[...Array(18)].map(()=>({n:el('circle',{class:'bub',r:0},bubG),live:0})),POP=[...Array(5)].map(()=>({n:el('ellipse',{class:'pop'},bubG),t:1}));
const flaskGlow=el('ellipse',{cx:f2(FQ[0]),cy:f2(FQ[1]+FS*.82),rx:f2(FS*.5),ry:f2(FS*.2),class:'fglow'});
el('path',{d:flaskD,class:'film'});el('path',{d:arc(FQ,FS-1.3,-62,242),class:'rim'});
el('path',{d:arc(FQ,FS*.8,196,244),class:'shine','stroke-width':1.7});el('path',{d:arc(FQ,FS*.86,18,62),class:'shine dim','stroke-width':.9});
{const g=Q(BU[0]-9,BU[1],FZ+10);el('ellipse',{cx:f2(g[0]-2),cy:f2(g[1]-4),rx:2.1,ry:1.2,transform:`rotate(-38 ${f2(g[0]-2)} ${f2(g[1]-4)})`,fill:'#fff',opacity:.8});}
// The neck's frosted socket and its blue clip; the clamp's front finger and cork pads over the neck.
el('path',{d:vcyl(Q(...BU,90),Q(...BU,96),6.2),class:'frost'});el('path',{d:vcyl(Q(...BU,93.4),Q(...BU,95.6),6.9,1),class:'face clip1'});
pad(5.9);el('path',{d:rodD(T(-46.5,6.2,CZ),T(-37,6.2,CZ),1.05),class:'face chrome'});{const q=Q(-42,6.2,CZ+1.4);el('circle',{cx:f2(q[0]),cy:f2(q[1]),r:1.5,class:'face top chrome'});}
// Column and still head: the vapor inside (a band from the neck up to its front, with the reflux ring); then glass.
const CR=4.8,colD=vcyl(Q(...BU,96),Q(...BU,136),CR);
el('path',{d:rodD(T(BU[0]+3,0,131),add(T(BU[0],0,131),mul(unit([Math.cos(22*RAD)*R2,-Math.cos(22*RAD)*R2,-Math.sin(22*RAD)]),16)),2.5),class:'gtube'});
el('path',{d:colD,class:'env'});const vapor=el('path',{class:'vapor'}),refluxU=el('ellipse',{class:'reflux-u'}),reflux=el('ellipse',{class:'reflux'});
const TB=127,TT=166;el('path',{d:`M${pt(Q(...BU,TB+1))}L${pt(Q(...BU,136))}`,class:'therm'});el('path',{d:vcyl(Q(...BU,TB-2.6),Q(...BU,TB+1.6),1.25),class:'face bulb'});
el('path',{d:colD,class:'film'});
for(const[z,s]of[[101,1],[107,-1],[113,1],[119,-1]]){const q=Q(...BU,z),x=KX*CR;el('path',{d:`M${pt([q[0]-x+.4,q[1]-1.5])}l1.8,1.5l-1.8,1.5M${pt([q[0]+x-.4,q[1]-1.5])}l-1.8,1.5l1.8,1.5`,class:'ring'});el('ellipse',{cx:f2(q[0]+s*1.2),cy:f2(q[1]+1.2),rx:.9,ry:1.6,class:'dimple'});}
for(const z of[124,136])disc(Q(...BU,z),CR,'ring');
{const q0=Q(...BU,98),q1=Q(...BU,134);el('path',{d:`M${f2(q0[0]-KX*CR+1.3)},${f2(q0[1])}L${f2(q1[0]-KX*CR+1.3)},${f2(q1[1])}`,class:'shine','stroke-width':1});}
post(Q(...BU,136),Q(...BU,139.6),3.7,'rubber');for(let i=0;i<7;i++){const a=(i/7)*Math.PI,q=Q(...BU,137.8),x=q[0]-KX*3.7*Math.cos(a);el('path',{d:`M${f2(x)},${f2(q[1]-1.5+KY*3.7*Math.sin(a))}v2.6`,class:'ring',style:'stroke:#8a8a86'});}
// Thermometer: the stem above the cap with its scale; the red column runs from the bulb.
el('path',{d:vcyl(Q(...BU,139.6),Q(...BU,TT),1.15),class:'gtube'});disc(Q(...BU,TT),1.15,'face top');const thermCol=el('path',{class:'therm'});
for(let z=143;z<=163;z+=2.5){const q=Q(...BU,z);el('path',{d:`M${f2(q[0]-1.4)},${f2(q[1])}h${(z-143)%10?.8:1.3}`,class:'tick'});}
// Condenser: jacket, cooling water, a glass coil (its back turns behind the water), the condensate trickle, nozzles.
const DV=unit([Math.cos(22*RAD)*R2,-Math.cos(22*RAD)*R2,-Math.sin(22*RAD)]),A0=T(BU[0],0,131),NV=unit(cross(DV,cross([0,0,1],DV))),J0=add(A0,mul(DV,16)),J1=add(A0,mul(DV,82)),JR=8;
const jacketD=pd(hull([...circ(J0,DV,JR,36),...circ(J1,DV,JR,36),...circ(add(J0,mul(DV,-4.2)),DV,2.6),...circ(add(J1,mul(DV,4.2)),DV,2.6)].map(p=>P(...p))));
el('path',{d:jacketD,class:'env'});
const[CA,CB]=axes(DV),CL=add(J0,mul(DV,2.5)),CLEN=61,TURNS=7.5,coil={f:'',b:''},lastSeg={f:-1,b:-1},cp=[];
for(let i=0;i<=240;i++){const s=i/240,ph=s*TURNS*2*Math.PI,o=add(mul(CA,4.6*Math.cos(ph)),mul(CB,4.6*Math.sin(ph)));cp.push({q:P(...add(add(CL,mul(DV,s*CLEN)),o)),o});}
for(let i=1;i<cp.length;i++){const k=dot(add(cp[i].o,cp[i-1].o),VIEW)>=0?'f':'b';coil[k]+=(lastSeg[k]===i-1?'':'M'+pt(cp[i-1].q))+'L'+pt(cp[i].q);lastSeg[k]=i;}
el('path',{d:coil.b,class:'coil-u back'});el('path',{d:coil.b,class:'coil back'});
el('path',{d:pd(hull([...circ(J0,DV,JR-.8,36),...circ(J1,DV,JR-.8,36)].map(p=>P(...p)))),class:'water'});
el('path',{d:coil.f,class:'coil-u'});el('path',{d:coil.f,class:'coil'});const trickle=el('path',{d:coil.f+coil.b,class:'trickle'});
el('path',{d:jacketD,class:'film'});for(const c of[J0,J1])el('path',{d:ringD(c,DV,JR),class:'ring'});
{const a=add(add(J0,mul(DV,3)),mul(NV,JR*.72)),b=add(add(J1,mul(DV,-3)),mul(NV,JR*.72));el('path',{d:`M${pt(P(...a))}L${pt(P(...b))}`,class:'shine','stroke-width':1.3});
const c=add(add(J0,mul(DV,8)),mul(NV,-JR*.8)),d=add(add(J1,mul(DV,-8)),mul(NV,-JR*.8));el('path',{d:`M${pt(P(...c))}L${pt(P(...d))}`,class:'shine dim','stroke-width':.8});}
for(const[k,s]of[[7,1],[59,-1]]){const b=add(add(J0,mul(DV,k)),mul(NV,s*JR*.9)),e=add(b,mul(NV,s*6.5));el('path',{d:rodD(b,e,1.5),class:'gtube'});el('path',{d:ringD(add(b,mul(NV,s*4.6)),NV,1.95,20),class:'face top',style:'fill:var(--glass)'});}
// Joint at the jacket's foot (frosted, yellow clip), the bent adapter down into the receiver, its drip tip.
const AJ=add(J1,mul(DV,4.2)),AE=add(J1,mul(DV,11));el('path',{d:rodD(AJ,AE,3.1),class:'frost'});el('path',{d:rodD(add(J1,mul(DV,6.4)),add(J1,mul(DV,8.6)),3.8),class:'face clip2'});
const RX=62,TIPZ=47,ad=[AE,add(AE,mul(DV,5)),T(RX-1.6,0,92.4),T(RX,0,85),T(RX,0,70),T(RX,0,TIPZ)].map(p=>P(...p)),adD=smooth(ad);
el('path',{d:adD,class:'gu','stroke-width':5});el('path',{d:adD,class:'gt','stroke-width':4.1});el('path',{d:adD,class:'shine dim','stroke-width':.7,transform:'translate(-.9 -.6)'});
// Receiving flask: back glass, the distillate (level, ripples), falling drops, the forming drop, front glass, marks.
const RB=17,RN=6.2,RZ1=38,RZ2=52,RQ=Q(RX,0,0),coneR=z=>RB+(RN-RB)*clamp(z/RZ1);
const coneP=[...flat(T(RX,0,0),RB-1.7,40),...flat(T(RX,0,1.7),RB,40),...flat(T(RX,0,RZ1-2.4),RN+1.3,28),...flat(T(RX,0,RZ1),RN,24)].map(p=>P(...p));
const recvD=pd(hull(coneP).reverse())+vcyl(Q(RX,0,RZ1),Q(RX,0,RZ2),RN);
const halo=el('ellipse',{cx:f2(RQ[0]),cy:f2(RQ[1]-14),rx:26,ry:24,class:'halo'});
el('path',{d:recvD,class:'env'});
const distBody=el('path',{class:'dist'}),distShade=el('path',{class:'lshade'}),distSurf=el('ellipse',{class:'dist-s'});
const RIP=[...Array(4)].map(()=>({n:el('ellipse',{class:'ripple'}),t:1}));
const dropG=el('g',{}),DROPS=[...Array(4)].map(()=>({n:el('ellipse',{class:'drop',rx:0,ry:0},dropG),live:0,z:0,v:0})),tipDrop=el('path',{class:'drop'},dropG);
el('path',{d:recvD,class:'film'});
{const q=Q(RX-4.5,coneR(15)*.96,15);el('rect',{x:f2(q[0]-3.2),y:f2(q[1]-4.2),width:6.4,height:8.4,rx:1.1,class:'face top'});for(let i=0;i<4;i++)el('path',{d:`M${f2(q[0]-2)},${f2(q[1]-2.4+i*1.7)}h${i%2?2:3.6}`,class:'tick'});}
el('path',{d:smooth([Q(RX-RB+2.5,0,4),Q(RX-RN-1.6,0,30),Q(RX-RN+.9,0,49)]),class:'shine','stroke-width':1.3});el('path',{d:smooth([Q(RX+RB-4,0,5),Q(RX+RN+1.5,0,28)]),class:'shine dim','stroke-width':.8});
disc(Q(RX,0,RZ2),RN+.6,'ring');
// Test tube rack (wood) with its tubes; numbers on the base match the keys.
const RACKX=[-32,-22,-12,-2],RY=66,TR=3.1,TL=40;
box(-40,60,0,46,12,3,1,'wood');{const g=group(FRONT(-40,72,3));for(const[i,x]of RACKX.entries())text(g,x+40,2.25,String(i+1),'etch center');}
box(-40,60,3,3,12,21,.8,'wood');
const tb=group(TOP(-40,60,26.6));rect(tb,0,0,46,12,1,'face top wood');for(const x of RACKX)circle(tb,x+40,6,TR+.5,'face recess');
const tubeL=el('g',{}),flyL=el('g',{});
const NAME=['AMBER','COBALT','JADE','ROSE'],RESULT=['CRIMSON','EMERALD','VIOLET','GOLD'];
const TUBES=RACKX.map((x,i)=>{const g=el('g',{},tubeL),t={i,x,g,fill:1};t.back=el('path',{class:'env'},g);t.liq=el('path',{class:`r${i+1} liq`},g);t.surf=el('path',{class:`r${i+1}`,style:'filter:brightness(1.18)'},g);t.film=el('path',{class:'film'},g);t.lip=el('path',{class:'ring',style:'opacity:.9'},g);t.hi=el('path',{class:'shine','stroke-width':.7},g);return t;});
{const g=group(FRONT(-40,72,26.6));rect(g,0,0,46,2.6,1,'face wood');}rect(group(SIDE(6,72,26.6)),0,0,12,2.6,1,'face side wood');
box(3,60,3,3,12,21,.8,'wood');
// Hot plate stirrer: enamel body, ceramic top, the control strip (heat and stir knobs, stir lamp, the maker's plate).
box(24,8,0,34,32,11,2.2,'');{const g=group(TOP(24,8,11.02));rect(g,2.6,2.6,28.8,26.8,2.6,'face plate');}
const hf=group(FRONT(24,40.02,11));rect(hf,2.6,2,28.8,6.8,1.4,'face dk');
const knobs=[8,26].map((u,i)=>{circle(hf,u,5.4,2.3,'face rubber');const p=line(hf,u,5.4,u,3.3,'detail');p.setAttribute('style','stroke:#e8e8e4');text(hf,u+(i?-4:4),6.2,i?'STIR':'HEAT','etch-l center');return p;});
const stirLamp=circle(hf,21.6,3.6,.7,'lamp');
{const g=group(SIDE(58.02,40,9.2));rect(g,9,2,14,4.4,.9,'face metal');text(g,16,5,'Alemver','serif center');}
// Beaker on the plate: the stir bar under the charge, its two color layers, surface, vortex, bloom, fizz, glass.
const BK=[41,24],BZ=11.6,BR=10.5,BH=27,bq0=P(...BK,BZ),bq1=P(...BK,BZ+BH),beakerD=vcyl(bq0,bq1,BR);
el('path',{d:beakerD,class:'env'});
const bkA=el('path',{class:'liq'}),bkB=el('path',{class:'liq',opacity:0}),bkShade=el('path',{class:'lshade'});
const barG=group(TOP(...BK,BZ+.5)),bar=el('g',{},barG);rect(bar,-4.8,-1.35,9.6,2.7,1.35,'bar');
const bkSA=el('ellipse',{}),bkSB=el('ellipse',{opacity:0}),bkHi=el('ellipse',{class:'lsurf'}),bloom=el('ellipse',{class:'bloomc'}),vortex=el('ellipse',{class:'vortex'});
const swG=el('g',{}),swirl=[0,1].map(()=>el('path',{class:'swirl'},swG));
const FIZ=[...Array(8)].map(()=>({n:el('circle',{class:'bub',r:0}),live:0}));
el('path',{d:beakerD,class:'film'});disc(bq1,BR,'ring');disc(bq1,BR-.7,'ring');
{const q=bq1,x=KX*BR,y=KY*BR;el('path',{d:`M${f2(q[0]-x)},${f2(q[1])}A${f2(x)},${f2(y)} 0 0 0 ${f2(q[0]+x)},${f2(q[1])}`,class:'detail'});const s=P(BK[0]-BR*.72,BK[1]+BR*.72,BZ+BH);el('path',{d:`M${f2(s[0]-1.6)},${f2(s[1]+.6)}q1.6,-1.6 3.4,-.3`,class:'detail'});}
{const g=group(FRONT(BK[0]-4,BK[1]+BR,BZ+BH-5));for(let i=0;i<5;i++)line(g,0,i*4.2,i%2?2.2:3.6,i*4.2,'tick');}
el('path',{d:`M${f2(bq0[0]-KX*BR+1.6)},${f2(bq0[1]-1.5)}V${f2(bq1[1]+1.2)}`,class:'shine','stroke-width':1.2});el('path',{d:`M${f2(bq0[0]+KX*BR-2.6)},${f2(bq0[1]-3)}V${f2(bq1[1]+4)}`,class:'shine dim','stroke-width':.8});
// A tube in flight (re-parented here while it pours), and its stream.
root.appendChild(flyL);const stream=el('path',{class:'stream'},flyL),streamH=el('path',{class:'stream-h'},flyL);
// Controls: the burner, each tube, the stirrer.
const burnerBtn=button(el('g',{}),'Burner: light it or put it out (Space)');
{const a=Q(...BU,0),b=Q(...BU,48);rect(burnerBtn,a[0]-14,b[1],28,a[1]-b[1]+9,3,'hit');rect(burnerBtn,a[0]-15,b[1]-1,30,a[1]-b[1]+11,4,'focus-ring');}
for(const t of TUBES){t.btn=button(el('g',{}),`Pour the ${NAME[t.i].toLowerCase()} tube into the beaker (${t.i+1})`);const a=P(t.x,RY,2),b=P(t.x,RY,46);rect(t.btn,a[0]-4.6,b[1],9.2,a[1]-b[1],2,'hit');rect(t.btn,a[0]-5.4,b[1]-1,10.8,a[1]-b[1]+2,3,'focus-ring');}
const stirBtn=button(el('g',{}),'Stir the beaker (S)');
{const a=P(24,40,0),b=P(...BK,BZ+BH+2),r=P(58,8,0)[0],y=P(58,40,0)[1];rect(stirBtn,a[0]-1,b[1],r-a[0]+2,y-b[1]+1,3,'hit');rect(stirBtn,a[0]-2,b[1]-1,r-a[0]+4,y-b[1]+3,4,'focus-ring');}
set(svg,'viewBox','-106 -176 212 240');
// State: the burner and heat, the charge's temperature, boiling, the vapor front, drips into the receiver, the beaker's
// color and stir bar, a pour in flight; as a progress indicator the distillate fills to the progress.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const FLAME=[0,6.5,10,12.5,15,17.5],DRIP=[9,9,1.5,1,.7,.48],DROP=1/34,PLAT=h=>99.2+h*.12,COL=['b0','x1','x2','x3','x4'];
let lit=true,heat=3,temp=PLAT(3),fh=FLAME[3],boil=1,vf=1.12,acc=.32,lv=.32,tipP=.45,mode='ind',target=0,done=0,batch=1,drain=null,glow=0;
let stirT=-1e9,stirW=0,barA=12,col=0,colTo=0,mix=1,bloomAt=null,pour=null,flash='',flashT=0,last=0,now=0,lastUI=-1,swirlA=0,bubAcc=0,fizzAcc=0,popT=0,flowO=0,trickleO=0,streamO=0,drawnKey='';
const say=m=>{announcement.textContent=m;},note=(m,ms=1500)=>{flash=m;flashT=now+ms;lastUI=-1;};
let ac=null,nb=null,hiss=null,hum=null;
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;
const s=ac.createBufferSource(),bp=ac.createBiquadFilter();s.buffer=nb;s.loop=true;bp.type='bandpass';bp.frequency.value=1500;bp.Q.value=.6;hiss=ac.createGain();hiss.gain.value=0;s.connect(bp);bp.connect(hiss);hiss.connect(ac.destination);s.start();
const o=ac.createOscillator(),lp=ac.createBiquadFilter();o.type='triangle';o.frequency.value=118;lp.type='lowpass';lp.frequency.value=320;hum=ac.createGain();hum.gain.value=0;o.connect(lp);lp.connect(hum);hum.connect(ac.destination);o.start();}
if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,d=.1,v=.01,type='sine',w=0,f1=0){if(!ac)return;try{const t=ac.currentTime+w,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
function noise(d,v,f,q=1,w=0){if(!ac||!nb)return;try{const t=ac.currentTime+w,s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;b.Q.value=q;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(ac.destination);s.start(t,0,d+.05);}catch(_){}}
const level=(n,v)=>{if(n&&ac&&Math.abs(v-(n._v??-1))>1e-4){n._v=v;n.gain.setTargetAtTime(v,ac.currentTime,.08);}};
// Geometry that moves: liquids by volume, the knob, the flame, a tube's pose.
function capH(F){let lo=0,hi=2;for(let i=0;i<22;i++){const m=(lo+hi)/2;m*m*(3-m)/4<F?lo=m:hi=m;}return(lo+hi)/2*FR;}
const potPts=circ(FC,VIEW,FR,56);
function drawPot(F,wob){const zl=FZ-FR+capH(F),rho=Math.sqrt(Math.max(0,FR*FR-(zl-FZ)**2)),pts=[...potPts.filter(p=>p[2]<=zl),...flat(T(...BU,zl),rho,32)].map(p=>P(...p)),d=pd(hull(pts));
set(potBody,'d',d);set(potShade,'d',d);const q=Q(...BU,zl);setDisc(potSurf,[q[0],q[1]+wob],rho);setDisc(potHi,[q[0]-1.2,q[1]-.5+wob],rho,.55);return zl;}
const coneV=h=>{let v=0;for(let i=0;i<24;i++){const r=coneR((i+.5)/24*h);v+=r*r;}return v*h/24;},VFULL=coneV(34);
function recvZ(F){let lo=0,hi=34;for(let i=0;i<20;i++){const m=(lo+hi)/2;coneV(m)<F*VFULL?lo=m:hi=m;}return(lo+hi)/2;}
function drawRecv(F){const h=Math.max(.6,recvZ(clamp(F))),r=coneR(h),pts=[...flat(T(RX,0,.25),RB-2.3,36),...flat(T(RX,0,1.5),RB-.6,36),...flat(T(RX,0,h),r-.55,36)].map(p=>P(...p)),d=pd(hull(pts));
set(distBody,'d',F>.004?d:'');set(distShade,'d',F>.004?d:'');setDisc(distSurf,Q(RX,0,h),F>.004?r-.55:0);return h;}
function knob(){const a=(-140+heat*56)*RAD,[A,B]=axes(valveN),e=add(valveC,add(mul(A,1.8*Math.cos(a)),mul(B,1.8*Math.sin(a))));set(valvePtr,'d',`M${pt(P(...valveC))}L${pt(P(...e))}`);}
function flamePath(x,y,w,h,s){return`M${f2(x-w)},${f2(y)}C${f2(x-w*1.08)},${f2(y-h*.4)} ${f2(x-w*.42+s*.4)},${f2(y-h*.8)} ${f2(x+s)},${f2(y-h)}C${f2(x+w*.42+s*.4)},${f2(y-h*.8)} ${f2(x+w*1.08)},${f2(y-h*.4)} ${f2(x+w)},${f2(y)}A${f2(w)},${f2(w*.5)} 0 0 1 ${f2(x-w)},${f2(y)}Z`;}
function tubePose(t,M,phi,fill){const a=[Math.sin(phi)*R2,-Math.sin(phi)*R2,Math.cos(phi)],tip=sub(M,mul(a,TL)),B=add(tip,mul(a,TR)),bq=P(...B),mouth=circ(M,a,TR,24);
const out=pd(hull([...ring(24,s=>[bq[0]+KX*TR*Math.cos(s),bq[1]+KX*TR*Math.sin(s)]),...mouth.map(p=>P(...p))]));set(t.back,'d',out);set(t.film,'d',out);set(t.lip,'d',pd(mouth.map(p=>P(...p))));
const L=fill*(TL-7),k=clamp((phi/RAD-70)/40),s0=(TL-TR-L-1.5)*k,s1=s0+L,c0=add(B,mul(a,s0)),c1=add(B,mul(a,s1)),r=TR-.55,q0=P(...c0);
if(L>.3){const end=circ(c1,a,r,20).map(p=>P(...p));set(t.liq,'d',pd(hull([...ring(20,s=>[q0[0]+KX*r*Math.cos(s),q0[1]+KX*r*Math.sin(s)]),...end])));set(t.surf,'d',pd(end));}else{set(t.liq,'d','');set(t.surf,'d','');}
const h0=P(...add(add(B,mul(a,2)),mul(cross(a,VIEW),-1.6))),h1=P(...add(add(M,mul(a,-2)),mul(cross(a,VIEW),-1.6)));set(t.hi,'d',`M${pt(h0)}L${pt(h1)}`);}
const homeM=t=>[t.x,RY,44];
// The beaker's charge: two layers so a reaction can bloom from where it was poured.
function drawBeaker(){const zl=BZ+BH*.52,q=P(...BK,zl),d=vcyl(bq0,q,BR-.6);for(const n of[bkA,bkB,bkShade])set(n,'d',d);for(const n of[bkSA,bkSB])setDisc(n,q,BR-.6);setDisc(bkHi,[q[0]-1.5,q[1]-.6],BR-.6,.5);return zl;}
const BZL=drawBeaker();
function paint(){set(bkA,'fill',`var(--${COL[col]})`);set(bkSA,'fill',`var(--${COL[col]})`);set(bkB,'fill',`var(--${COL[colTo]})`);set(bkSB,'fill',`var(--${COL[colTo]})`);set(bloom,'fill',`var(--${COL[colTo]})`);}
// Actions: Space lights the burner or puts it out; arrows set the heat; S stirs; 1–4 pour a tube; progress from the page.
function ignite(page){lit=true;if(done>=2){done=0;mode='ind';drain={from:acc,to:.04,t0:now,ms:reduced.matches?0:1200};}if(page)return;note(`BURNER LIT · HEAT ${heat}`);say(`Burner lit at heat ${heat}.`);noise(.35,.03,420,.8);tone(90,.3,.02,'sine',0,55);}
function burner(){audio();if(lit){lit=false;note('BURNER OUT');say('Burner out. The flask cools and the drips stop.');noise(.18,.02,900,.7);}else ignite();}
function heatStep(d){audio();const h=clamp(heat+d,1,5);if(h===heat){note(`HEAT ${heat} · ${d>0?'FULL':'LOWEST'}`);return;}heat=h;knob();note(`HEAT ${heat}`+(lit?'':' · SPACE LIGHTS IT'));say(`Heat ${heat}.`);tone(700+heat*90,.04,.008,'square');}
function stir(){audio();const e=(now-stirT)/1000;stirT=e>0&&e<4.6?now-Math.min(e,.6)*1000:now;note('STIRRING · BAR SPINNING');say('The stir bar spins and mixes the beaker.');tone(240,.12,.008,'triangle');}
function pourTube(i){audio();const t=TUBES[i];if(pour){note('POURING · ONE AT A TIME');return;}if(t.fill<.96){note(`${NAME[i]} TUBE REFILLING`);return;}
pour={t,t0:now,hit:false};paint();note(`POURING · ${NAME[i]}`,1800);say(`Pouring the ${NAME[i].toLowerCase()} tube into the beaker.`);tone(520,.06,.008,'triangle');}
function react(i){colTo=i+1;mix=0;paint();bloomAt=now;fizzAcc=0;note(`REACTION · ${RESULT[i]}`,1800);say(`The beaker turns ${RESULT[i].toLowerCase()}.`);tone(880,1.1,.008,'sine',.05);tone(1318.5,.9,.006,'sine',.18);}
function setProgress(p){if(p==null||!isFinite(p)){mode='ind';done=0;}else{const v=clamp(+p);if(done||v<acc-.01)drain={from:acc,to:reduced.matches?v:Math.min(v,.04),t0:now,ms:reduced.matches?0:900};mode='det';target=v;done=0;if(!lit)ignite(true);}lastUI=-1;}
function finish(){if(done)return;mode='det';target=1;done=1;if(!lit){lit=true;}say('Finishing: the last drops run into the receiver.');lastUI=-1;}
window.figure={setProgress,done:finish};
bind(burnerBtn,burner);bind(stirBtn,stir);for(const t of TUBES)bind(t.btn,()=>pourTube(t.i));
const act={' ':burner,ArrowUp:()=>heatStep(1),ArrowRight:()=>heatStep(1),ArrowDown:()=>heatStep(-1),ArrowLeft:()=>heatStep(-1),s:stir,'1':()=>pourTube(0),'2':()=>pourTube(1),'3':()=>pourTube(2),'4':()=>pourTube(3)};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(k===' '&&e.target.closest&&e.target.closest('button,[role=button]'))return;const fn=act[k];if(fn){e.preventDefault();if(!e.repeat||k.startsWith('Arrow'))fn();}});
// The readout: temperature and yield; the state line says what the bench is doing.
function stateNow(){const pc=Math.round(lv*100);if(done===3)return'COMPLETE · BURNER OUT';if(done)return'FINISHING · LAST DROPS';if(drain)return mode==='ind'?'RECEIVER FULL · NEW BATCH':'NEW RUN · FRESH RECEIVER';
if(!lit)return temp>32?'BURNER OUT · COOLING':'STANDBY · SPACE LIGHTS IT';if(heat<2)return`WARMING · HEAT 1 · BELOW BOILING`;if(boil<.5)return`HEATING · HEAT ${heat}`;if(vf<1)return mode==='det'&&acc>=target-.002?`HOLDING AT ${pc}% · REFLUX`:'BOILING · VAPOR RISING';
return mode==='det'?`DISTILLING TO ${Math.round(target*100)}%`:`DISTILLING · HEAT ${heat} · BATCH ${batch}`;}
function ui(){set(burnerBtn,'aria-pressed',String(lit));readout.textContent=`${temp.toFixed(1)} °C · YIELD ${Math.round(lv*100)}%`;stateLabel.textContent=now<flashT?flash:stateNow();lastUI=now;}
// Bubbles rise from the hot spot, wobble and grow, and pop at the level; held still, a few sit where they would.
const STILL=[[-1,1,3,1.3],[2.4,-.5,8,1.1],[-3,0,13,1],[1.2,2,17,.9],[-1.8,-1.5,21,.8],[3,1,24,.75],[0,-2.4,6,.7],[-4,2,10,.6]];
function bubbles(dt,zl,red,t){const n0=FZ-FR;
if(red){BUB.forEach((b,i)=>{const s=STILL[i];if(s&&boil>.5&&n0+s[2]<zl-1.5){const q=Q(BU[0]+s[0],BU[1]+s[1],n0+s[2]);set(b.n,'cx',f2(q[0]));set(b.n,'cy',f2(q[1]));set(b.n,'r',f2(KX*s[3]));}else set(b.n,'r',0);b.live=0;});POP.forEach(p=>{p.t=1;op(p.n,0);});return;}
bubAcc+=dt*boil*(heat>1?2+heat*3.2:0);while(bubAcc>1){bubAcc--;const b=BUB.find(b=>!b.live);if(!b)break;Object.assign(b,{live:1,u:BU[0]+(Math.random()-.5)*9,w:BU[1]+(Math.random()-.5)*9,z:n0+2+Math.random()*2.5,r:.45+Math.random()*.5,v:14+Math.random()*12+heat*4,ph:Math.random()*6});}
for(const b of BUB){if(!b.live){if(+b.n.getAttribute('r'))set(b.n,'r',0);continue;}b.z+=b.v*dt;b.r=Math.min(1.9,b.r+dt*.9);b.u+=Math.sin(t*.011+b.ph)*dt*3;b.w+=Math.cos(t*.013+b.ph)*dt*3;
const lim=Math.sqrt(Math.max(0,FR*FR-(b.z-FZ)**2))-b.r-1,du=b.u-BU[0],dw=b.w-BU[1],dd=Math.hypot(du,dw);if(dd>lim&&dd>0){b.u=BU[0]+du/dd*lim;b.w=BU[1]+dw/dd*lim;}
if(b.z+b.r>=zl){b.live=0;set(b.n,'r',0);const p=POP.find(p=>p.t>=1);if(p){p.t=0;p.q=Q(b.u,b.w,zl);p.s=b.r;}if(ac&&now-popT>90){popT=now;tone(180+Math.random()*160,.05,.0025);}continue;}
const q=Q(b.u,b.w,b.z);set(b.n,'cx',f2(q[0]));set(b.n,'cy',f2(q[1]));set(b.n,'r',f2(KX*b.r));}
for(const p of POP){if(p.t>=1)continue;p.t=Math.min(1,p.t+dt/.35);setDisc(p.n,p.q,p.s*(1+p.t*1.6));op(p.n,(1-p.t)*.8);}}
// Drips: the drop swells at the tip, lets go, falls and lands in the receiver with a ripple.
function drips(dt,want,red,zr){const tq=Q(RX,0,TIPZ),gap=want-acc,flowing=vf>=1&&boil>.5&&lit&&!drain&&gap>.0005,need=mode==='ind'?DROP:Math.min(Math.max(DROP,gap/4),gap);
if(red){tipP=flowing?.7:0;}else if(flowing){tipP+=dt/(mode==='ind'?DRIP[heat]:gap>.05?.24:Math.min(DRIP[heat],.9));if(tipP>=1){tipP=0;const d=DROPS.find(d=>!d.live);if(d)Object.assign(d,{live:1,z:TIPZ-2.6,v:0,vol:need});}}else tipP=Math.max(0,tipP-dt*.6);
const rd=.55+1.7*Math.cbrt(tipP),nk=.4+1.3*tipP*tipP;set(tipDrop,'d',tipP>.02?`M${f2(tq[0]-1.05)},${f2(tq[1])}C${f2(tq[0]-1.05)},${f2(tq[1]+nk*.6)} ${f2(tq[0]-rd)},${f2(tq[1]+nk)} ${f2(tq[0]-rd)},${f2(tq[1]+nk+rd)}A${f2(rd)},${f2(rd)} 0 0 0 ${f2(tq[0]+rd)},${f2(tq[1]+nk+rd)}C${f2(tq[0]+rd)},${f2(tq[1]+nk)} ${f2(tq[0]+1.05)},${f2(tq[1]+nk*.6)} ${f2(tq[0]+1.05)},${f2(tq[1])}Z`:'');
for(const d of DROPS){if(!d.live){if(+d.n.getAttribute('rx'))set(d.n,'rx',0);continue;}d.v+=1500*dt;d.z-=d.v*dt;if(d.z<=zr+.5){d.live=0;set(d.n,'rx',0);acc=Math.min(1,acc+d.vol);let k=0;for(const r of RIP)if(r.t>=1&&k<2)r.t=-.22*k++;tone(1150+lv*820+Math.random()*50,.16,.013,'sine',0,(1150+lv*820)*.78);continue;}
const q=Q(RX,0,d.z),s=1+Math.min(.5,d.v/900);set(d.n,'cx',f2(q[0]));set(d.n,'cy',f2(q[1]));set(d.n,'rx',f2(1.75/Math.sqrt(s)));set(d.n,'ry',f2(1.75*s));}
const sq=Q(RX,0,zr),rr=coneR(zr)-1;for(const r of RIP){if(r.t>=1){op(r.n,0);continue;}r.t=Math.min(1,r.t+dt/.7);const k=Math.max(0,r.t);setDisc(r.n,sq,Math.min(rr,.8+k*rr*.85));op(r.n,r.t<0?0:(1-k)*.9);}}
// A pour: lift, carry over the beaker, tip, pour (the stream and the reaction), right it, carry it home, set it down.
const PH=[.3,.65,.4,1,.35,.65,.3],PT=PH.reduce((a,b)=>a+b,0),M_PRE=T(4,46,BZ+BH+17),M_POUR=T(8,46,BZ+BH+5.5),TILT=132*RAD;
function pouring(dt,red){if(!pour){streamO=0;return;}const t=pour.t,e=(now-pour.t0)/1000,H=homeM(t),lift=add(H,[0,0,30]);let M=H,phi=0,fill=1,sOn=false,up=false;
if(red){up=e<1.4;if(up){M=M_POUR;phi=TILT;fill=.5;sOn=true;}if(!pour.hit){pour.hit=true;react(t.i);mix=1;col=colTo;paint();}}
else{let k=e,i=0;while(i<PH.length&&k>PH[i]){k-=PH[i];i++;}const s=i<PH.length?ease(clamp(k/PH[i])):1;up=i>=1&&i<=5;
if(i===0)M=add(H,[0,0,30*s]);else if(i===1)M=add(add(lift,mul(sub(M_PRE,lift),s)),[0,0,10*Math.sin(Math.PI*s)]);else if(i===2){M=add(M_PRE,mul(sub(M_POUR,M_PRE),s));phi=TILT*s;}
else if(i===3){M=M_POUR;phi=TILT;fill=1-clamp(k/PH[3]);sOn=k<PH[3]*.92;if(!pour.hit&&k>.12){pour.hit=true;react(t.i);}}
else if(i===4){M=add(M_POUR,mul(sub(M_PRE,M_POUR),s));phi=TILT*(1-s);fill=0;}else if(i===5){M=add(add(M_PRE,mul(sub(lift,M_PRE),s)),[0,0,10*Math.sin(Math.PI*s)]);fill=0;}else if(i===6){M=add(lift,mul(sub(H,lift),s));fill=0;}else fill=0;}
const layer=up?flyL:tubeL;if(t.g.parentNode!==layer)layer.insertBefore(t.g,up?stream:null);
streamO+=((sOn?1:0)-streamO)*(red?1:clamp(dt*14));t.fill=fill;tubePose(t,M,phi,fill);
if(streamO>.02){const a=[Math.sin(phi)*R2,-Math.sin(phi)*R2,Math.cos(phi)],m=P(...add(M,mul(a,.6))),s=P(...T(10.5,46,BZL)),c=[m[0]+3,m[1]+2];const d=`M${pt(m)}Q${pt(c)} ${pt(s)}`;for(const n of[stream,streamH])set(n,'d',d);set(stream,'stroke',`var(--r${t.i+1})`);op(stream,streamO);op(streamH,streamO*.7);flowO=(flowO+dt*36)%40;set(stream,'stroke-dasharray',red?'':'2.4 .9');set(stream,'stroke-dashoffset',f2(-flowO));}
else{set(stream,'d','');set(streamH,'d','');}
if(red?e>=1.4:e>=PT){tubeL.appendChild(t.g);t.fill=red?1:0;tubePose(t,H,0,t.fill);pour=null;set(stream,'d','');set(streamH,'d','');}}
// One frame.
function tick(ts){const dt=last?Math.min(.05,(ts-last)/1000):0,red=reduced.matches;last=now=ts;
// heat, temperature, boiling, the vapor front
const tg=lit?(heat<2?88:PLAT(heat)):21;if(red)temp=tg;else if(temp<tg)temp=Math.min(tg,temp+dt*(4+heat*5));else temp=Math.max(tg,temp-dt*Math.max(.9,(temp-21)*.09));
const boiling=lit&&heat>1&&temp>=PLAT(heat)-.3;boil+=((boiling?1:0)-boil)*(red?1:clamp(dt*3));
const holding=mode==='det'&&!done&&acc>=target-.0005,vt=boiling?(holding?.86:1.12):0;if(red)vf=vt;else if(vf<vt)vf=Math.min(vt,vf+dt*(.18+.09*heat));else vf=Math.max(vt,vf-dt*.32);
// the receiver: a fresh one (drained), the drips, the level eased toward what has landed
if(drain){const k=drain.ms?clamp((now-drain.t0)/drain.ms):1;acc=drain.from+(drain.to-drain.from)*ease(k);lv=acc;if(k>=1){drain=null;if(mode==='ind')batch++;}}
const want=mode==='ind'||done?1:target;if(red&&mode==='det'&&!drain){acc=want;}
const zr=recvZ(clamp(lv));drips(dt,want,red,zr);lv+=(acc-lv)*(red?1:clamp(dt*7));
if(mode==='ind'&&!done&&acc>=1&&!drain&&!red)drain={from:1,to:.04,t0:now,ms:1600};
if(done===1&&acc>=1-1e-4){done=2;lit=false;say('Complete. The receiver is full and the burner is out.');tone(1046.5,1.4,.012,'sine',.05);tone(1568,1.1,.008,'sine',.2);}
if(done===2&&(red||fh<.3))done=3;
// flame
const ft=lit?FLAME[heat]:0;if(red)fh=ft;else fh+=(ft-fh)*clamp(dt*(ft>fh?9:6));
const fl=red?0:Math.sin(ts*.031)*.5+Math.sin(ts*.057+1)*.3+Math.sin(ts*.113)*.2,H=fh*(1+.06*fl),sw=.35*fl*fh/16;
if(H>.3){const w=Math.min(1,H/6);set(flameE,'d',flamePath(fq[0],fq[1],5.2*w,H*1.18,sw*1.3));set(flameO,'d',flamePath(fq[0],fq[1],4.1*w,H,sw));set(flameI,'d',flamePath(fq[0],fq[1],2.5*w,H*.5,sw*.4));set(flameC,'d',flamePath(fq[0],fq[1],1*w,H*.22,0));}else for(const n of[flameE,flameO,flameI,flameC])set(n,'d','');
const fo=clamp(fh/17.5);op(flameH,fo*.55);floorGlow.style.opacity=`calc(var(--fl) * ${f2(fo)})`;flaskGlow.style.opacity=`calc(var(--fl) * ${f2(fo*.8)})`;
// the charge in the flask (it runs down as the receiver fills), bubbles, mist; vapor in the column; the condenser
const potF=.6-.27*lv,wob=red||boil<.2?0:Math.sin(ts*.023)*.22*boil*(heat/3);const key=potF.toFixed(4)+wob.toFixed(2);let zl;if(key!==drawnKey){drawnKey=key;zl=drawPot(potF,wob);}else zl=FZ-FR+capH(potF);
bubbles(dt,zl,red,ts);op(mist,boil*.55);
const vz=90+vf*(TB+2-90),vq0=Q(...BU,90),vq1=Q(...BU,Math.min(136,vz));if(vf>.02){set(vapor,'d',vcyl(vq0,vq1,CR-.6));vapor.style.opacity=`calc(var(--vap) * ${f2(clamp(vf*3))})`;const ro=vf<1?boil:.4*boil;setDisc(reflux,vq1,CR-.7);setDisc(refluxU,[vq1[0],vq1[1]+.5],CR-.7);op(reflux,ro);op(refluxU,ro*.22);}else{set(vapor,'d','');op(reflux,0);op(refluxU,0);}
const tz=140+clamp((temp-15)/(110-15))*(TT-141.6);set(thermCol,'d',`M${pt(Q(...BU,140))}L${pt(Q(...BU,tz))}`);
const distilling=vf>=1&&boil>.5;trickleO+=((distilling?.9:0)-trickleO)*(red?1:clamp(dt*2));op(trickle,trickleO);if(!red)set(trickle,'stroke-dashoffset',f2(-(ts*.006*(1+heat*.4))%27));
drawRecv(lv);
// the beaker: stir bar, vortex and swirl, the reaction blooming from the pour, fizz
const st=(now-stirT)/1000,sw0=st<0?0:st<.6?st/.6:st<3.6?1:st<4.6?1-(st-3.6):0;stirW=red?(sw0>0?1:0):ease(sw0);
if(red)barA=sw0>0?102:12;else barA=(barA+dt*stirW*1150)%360;set(bar,'transform',`rotate(${f2(barA)})`);
const bq=P(...BK,BZL);setDisc(vortex,[bq[0],bq[1]+stirW*1.2],2+stirW*4.6);op(vortex,stirW*.16);
swirlA=red?40:(swirlA+dt*stirW*260)%360;set(swG,'transform',TOP(...BK,BZL)+` rotate(${f2(swirlA)})`);swirl.forEach((n,i)=>{set(n,'d',arc([0,0],5+i*2.8,i*180,i*180+110));op(n,stirW*.8);});
set(knobs[1],'transform',stirW>.05?'rotate(80 26 5.4)':'');set(stirLamp,'class',stirW>.05?'lamp b':'lamp');level(hum,stirW*.006);
if(mix<1){mix=Math.min(1,mix+dt*(stirW>.3?1.7:.42));if(red)mix=1;}op(bkB,ease(mix));op(bkSB,ease(mix));if(mix>=1&&col!==colTo){col=colTo;paint();op(bkB,0);op(bkSB,0);}
if(bloomAt!=null){const k=clamp((now-bloomAt)/1600),pq=P(...T(10.5,46,BZL));setDisc(bloom,[pq[0]+(bq[0]-pq[0])*k*.6,pq[1]+(bq[1]-pq[1])*k*.6],1.5+(BR-2)*Math.min(1,k*1.4));op(bloom,red?0:(1-k)*.85);if(k>=1)bloomAt=null;}
if(!red&&mix<.7){fizzAcc+=dt*14;while(fizzAcc>1){fizzAcc--;const f=FIZ.find(f=>!f.live);if(!f)break;Object.assign(f,{live:1,x:BK[0]+(Math.random()-.5)*14,y:BK[1]+(Math.random()-.5)*14,z:BZ+1+Math.random()*6,v:18+Math.random()*16});}}
for(const f of FIZ){if(!f.live){if(+f.n.getAttribute('r'))set(f.n,'r',0);continue;}f.z+=f.v*dt;if(f.z>=BZL-.3){f.live=0;set(f.n,'r',0);continue;}const q=P(f.x,f.y,f.z);set(f.n,'cx',f2(q[0]));set(f.n,'cy',f2(q[1]));set(f.n,'r',.55);}
// tubes: the pour in flight, and refills back in the rack
pouring(dt,red);for(const t of TUBES)if(t!==pour?.t&&t.fill<1){t.fill=red?1:Math.min(1,t.fill+dt/1.4);tubePose(t,homeM(t),0,t.fill);}
// completion glow, sound beds, the readout
glow+=((done===3?1:0)-glow)*(red?1:clamp(dt*2));op(halo,glow*.5);level(hiss,lit?.0018+heat*.0009:0);
if(lastUI<0||now-lastUI>120)ui();
requestAnimationFrame(tick);}
knob();paint();for(const t of TUBES)tubePose(t,homeM(t),0,1);drawRecv(lv);ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
