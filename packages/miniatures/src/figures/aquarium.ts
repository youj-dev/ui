// @ts-nocheck
/* TIDEWELL A–90 · Planted aquarium. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--metal:#d4d5d2;--metal-top:#efefec;--metal-side:#b6b7b4;--trim:#2f2f2d;--trim-top:#454542;--back:#eef0ef;--soil:#5c4b3d;--soil-top:#77634f;--soil-side:#4a3c31;--stone:#b8b6af;--stone-top:#d2d0c9;--stone-side:#9d9b94;--wood:#8a6b4c;--g1:#3f8f45;--g2:#69b552;--g3:#2b6e38;--red:#c8503a;--water:#bfe2ea;--wa:.32;--night:#0d2350;--moon:#5f7cff;--day:#fffbe9;--heat:#ff8a2a;--lcd:#151515}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--metal:#b3b3b1;--metal-top:#e0e0dd;--metal-side:#80807f;--trim:#262625;--trim-top:#40403d;--back:#c9caca;--soil:#4c3e32;--soil-top:#6f5c49;--soil-side:#322820;--stone:#9a9994;--stone-top:#c4c2bc;--stone-side:#6d6c6a;--wood:#73593f;--g1:#347839;--g2:#579844;--g3:#235c2e;--red:#a8422f;--water:#a1bec5;--night:#091c42;--moon:#6f88ff;--day:#fff4d8;--heat:#ff9a40;--lcd:#0b0b0b;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.trim{fill:var(--trim)}.top.trim{fill:var(--trim-top)}.side.trim{fill:var(--trim)}.base{fill:var(--base)}
.backdrop{fill:var(--back);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.soil{fill:var(--soil)}.top.soil{fill:var(--soil-top)}.side.soil{fill:var(--soil-side)}.stone{fill:var(--stone)}.top.stone{fill:var(--stone-top)}.side.stone{fill:var(--stone-side)}
.stem{fill:none;stroke:var(--g3);stroke-width:.35;stroke-linecap:round}.lf1{fill:var(--g1)}.lf2{fill:var(--g2)}.lf3{fill:var(--red)}.lf1,.lf2,.lf3,.sword{stroke:var(--line);stroke-width:.25;vector-effect:non-scaling-stroke}.sword{fill:var(--g2)}.blade{fill:none;stroke:var(--g2);stroke-width:.5;stroke-linecap:round}
.wood-u{fill:none;stroke:var(--line);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}.wood{fill:none;stroke:var(--wood);stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.water{fill:var(--water);opacity:var(--wa);stroke:none;pointer-events:none}.night{fill:var(--night);opacity:0;stroke:none;pointer-events:none}.surface{fill:#fff;opacity:.16;stroke:none}.meniscus{fill:none;stroke:#fff;stroke-width:.7;opacity:.7}
.pane{fill:#fff;opacity:.06;stroke:none;pointer-events:none}.streak{fill:#fff;opacity:.22;stroke:none;pointer-events:none}.sil{fill:none;stroke:var(--trim);stroke-width:1.4;stroke-linecap:round}
.ray{fill:var(--day);opacity:0;pointer-events:none}.glow-day{fill:var(--day);filter:url(#bloom);pointer-events:none}.glow-moon{fill:var(--moon);filter:url(#bloom);opacity:0;pointer-events:none}
.bub{fill:#fff;fill-opacity:.35;stroke:#fff;stroke-width:.35;opacity:.9}.flake{stroke:var(--line);stroke-width:.3;vector-effect:non-scaling-stroke}.ripple{fill:none;stroke:#fff;stroke-width:.5;vector-effect:non-scaling-stroke}
.fish-b{fill:#dfe6ea;stroke:var(--line);stroke-width:.25;vector-effect:non-scaling-stroke}.neon{fill:none;stroke:#2f8cff;stroke-width:.7;stroke-linecap:round}.fred{fill:#e23b30}.eye{fill:#111}.angel{fill:#e9e7df;stroke:var(--line);stroke-width:.3;vector-effect:non-scaling-stroke}.bar{fill:#2b2b2b;opacity:.75}
.led{fill:var(--off)}.lit-day .led-d{fill:#fff;filter:url(#glow)}.lit-night .led-n{fill:var(--moon);filter:url(#glow)}.heating .hled{fill:var(--heat);filter:url(#glow)}.hled{fill:var(--off)}
.lcd{fill:var(--lcd);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.lcd-t{fill:var(--accent);font:600 2.9px ui-monospace,monospace;text-anchor:middle;filter:url(#glow)}
.airline{fill:none;stroke:var(--line);stroke-width:.9;stroke-linecap:round}.airline-i{fill:none;stroke:var(--glass);stroke-width:.45;stroke-linecap:round}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = ``

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* TIDEWELL A–90 planted aquarium. World: x lower-right, y lower-left, z up; 1 unit = 1 cm.
Part                        x      y      z      w      d      h
toe kick                    3      3      0     88     38      4
cabinet                     0      0      4     94     44     42   two doors, bar handles, vents
tank base trim              2      2     46     90     40      2
backdrop + left pane        2      2     48     90     40     43   frosted
aqua soil (sloped)          2      2     48     90     40  4.6–12.4
stem plants (15)         8–86   5–10   ≈58     –      –   16–26   sway
internal filter             4      4     58      7      5     26   outflow ripples
heater                     85      6     54   r1.3     –     30   LED while heating
airstone + airline         76      9     59   r1.4     –    1.4   bubbles
driftwood               12–36  18–30  54–79     –      –      –
stones (3)              44–66  22–36  53–63     6–14   5–10   4–9
sword plant                26     24     55   r14      –     20
fish: tetras (8), angel    8–86  13–37  56–86     –      –      –   depth sorted
carpet tufts (32)        5–89  33–40   ≈53     –      –    2.5
water                       2      2     48     90     40     40   day tint, night overlay, rays
glass panes + silicone      2      2     48     90     40     43
thermometer LCD            76   42.3   49.0     12      0    4.4
light bar + legs            1     14     91     92     16    8.4   white day LEDs, blue moon LEDs */
// Isometric engine: affine face planes, solids, round parts, grille and fit.
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers.
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`;
function rpath(pts,r=3){const p=pts.map(q=>P(...q)),n=p.length;let d='';for(let i=0;i<n;i++){const b=p[i],cut=a=>{const L=Math.hypot(a[0]-b[0],a[1]-b[1])||1,k=Math.min(r,L/2)/L;return[b[0]+(a[0]-b[0])*k,b[1]+(a[1]-b[1])*k];};d+=(i?'L':'M')+cut(p[(i+n-1)%n])+'Q'+b+' '+cut(p[(i+1)%n]);}return d+'Z';}
const facePath=(pts,cls='',r=3,parent=root)=>el('path',{d:rpath(pts,r),class:'face '+cls},parent);
function panel(g,x,y,w,h,b=2.2){rect(g,x,y,w,h,1,'face');el('path',{d:`M${x},${y}H${x+w}L${x+w-b},${y+b}H${x+b}ZM${x},${y}L${x+b},${y+b}V${y+h-b}L${x},${y+h}Z`,class:'face top'},g);el('path',{d:`M${x},${y+h}L${x+b},${y+h-b}H${x+w-b}L${x+w},${y+h}ZM${x+w},${y}V${y+h}L${x+w-b},${y+h-b}V${y+b}Z`,class:'face side'},g);}
const adopt=(g,n)=>{g.appendChild(n.g||n);return n;};
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const zs=y=>60.4-(y-2)*7.8/40;
// Assembly: shadow, cabinet, tank base, backdrop, soil, back plants and gear, bubbles, the sorted middle layer, flakes, carpet, water, glass, light bar.
const sh=P(48,24,0);el('ellipse',{cx:sh[0],cy:sh[1]+3,rx:78,ry:33,class:'shadow stage-floor'});el('ellipse',{cx:sh[0],cy:sh[1]+3,rx:78,ry:33,class:'stage-contact'});
box(3,3,0,88,38,4,1,'base');box(0,0,4,94,44,42,1.6);
const CF=group(FRONT(0,44.05,46));panel(CF,2.4,2.4,44,37,1.8);panel(CF,47.6,2.4,44,37,1.8);
box(42.4,44,19,1.3,1.8,13,.6,'metal');box(50.3,44,19,1.3,1.8,13,.6,'metal');
const CSd=group(SIDE(94.05,44,46));slits(CSd,8,5,28,4,14);circle(CSd,36,34,2,'face recess');circle(CSd,36,34,1,'face base');
box(2,2,46,90,40,2,.6,'trim');
rect(group(FRONT(2,2.05,91)),0,0,90,43,0,'backdrop');rect(group(SIDE(2.05,42,91)),0,0,40,43,0,'backdrop');
const backNight=[el('path',{d:poly([[2,2.1,48],[92,2.1,48],[92,2.1,91],[2,2.1,91]],true),class:'night'}),el('path',{d:poly([[2.1,2,48],[2.1,42,48],[2.1,42,91],[2.1,2,91]],true),class:'night'})];
facePath([[92,2,48],[92,42,48],[92,42,zs(42)],[92,2,zs(2)]],'side soil',.3);
facePath([[2,2,zs(2)],[92,2,zs(2)],[92,42,zs(42)],[2,42,zs(42)]],'top soil',.3);
rect(group(FRONT(2,42,zs(42))),0,0,90,zs(42)-48,0,'face soil');
const SG=el('g',{});for(let i=0;i<140;i++){const x=3+rnd()*88,y=3+rnd()*38,p=P(x,y,zs(y)+.05);el('ellipse',{cx:p[0],cy:p[1],rx:.35+rnd()*.35,ry:.22,fill:i%3?'var(--soil-side)':'var(--stone-top)'},SG);}
for(let i=0;i<46;i++){const x=3+rnd()*88,p=P(x,42,48.6+rnd()*3.6);el('circle',{cx:p[0],cy:p[1],r:.3+rnd()*.3,fill:i%2?'var(--soil-top)':'var(--stone)'},SG);}
// Back row: stem plants (each sways about its root), internal filter, heater, airstone.
const STEMS=[];
function stem(x,y,h,red,side){const z=zs(y),g=group(side?SIDE(x,y,z):FRONT(x,y,z)),s=el('g',{},g);
el('path',{d:`M0,0 Q.8,${-h/2} .3,${-h}`,class:'stem'},s);
for(let k=1.6;k<h;k+=1.9){const t=k/h,u=.8*2*t*(1-t)+.3*t*t,cls=red&&t>.72?'lf3':k%3.8<1.9?'lf1':'lf2',sz=1.25-.35*t;
el('ellipse',{cx:u-1.15*sz,cy:-k,rx:1.3*sz,ry:.42*sz,transform:`rotate(${-24} ${u} ${-k})`,class:cls},s);el('ellipse',{cx:u+1.15*sz,cy:-k-.4,rx:1.3*sz,ry:.42*sz,transform:`rotate(${24} ${u} ${-k-.4})`,class:cls},s);}
STEMS.push({s,ph:rnd()*6,a:1.5+rnd()*2});}
box(4,4,58,7,5,26,1,'trim');const FFr=group(FRONT(4,9.05,84));slits(FFr,1,9,5,14,5);
cylinder(11,6.5,81.5,.9,2.6,'x','trim');
for(let i=0;i<15;i++){const x=13+i*5+rnd()*2.4,y=5+rnd()*5;stem(x,y,16+rnd()*10,i%4===1||i%5===3,i%2);}
const heater=cylinder(85,6,54,1.3,26,'z','metal');cylinder(85,6,80,1.6,4,'z','trim');
const HL=group(FRONT(85,7.7,83));circle(HL,0,0,.6,'hled');for(const z of[60,74]){const q=P(85,7.4,z);el('circle',{cx:q[0],cy:q[1],r:1,fill:'none',stroke:'var(--line)','stroke-width':.4},root);}
cylinder(76,9,zs(9),1.5,1.4,'z','stone');const AL=[[76,9,zs(9)+1.4],[76,4,zs(4)+3],[76,3.2,90],[76,1,91.4]];wire(AL,'airline');wire(AL,'airline-i');
const bubG=el('g',{}),BUB=[...Array(36)].map(()=>({n:el('circle',{class:'bub',r:0},bubG),live:0}));
const streamG=el('g',{}),STR=[...Array(18)].map(()=>({n:el('circle',{class:'bub',r:0},streamG),live:0}));
// Middle layer (sorted by x + y each frame): driftwood, stones, sword plant and the fish.
const mid=el('g',{}),items=[];
const dw=el('g',{},mid);for(const b of[[[12,30,zs(30)],[20,26,63],[27,21,71],[35,17,79]],[[20,26,63],[25,31,70],[24,34,75]],[[27,21,71],[24,17,77]]]){wire(b,'wood-u',dw);wire(b,'wood',dw);}items.push({n:dw,d:42});
for(const[x,y,w,d,h]of[[50,22,14,10,9],[64,29,9,8,6],[44,31,6,5,4]]){const g=el('g',{},mid);adopt(g,box(x,y,zs(y+d)-1.5,w,d,h+1.5,Math.min(w,d,h)/2.1,'stone'));items.push({n:g,d:x+y+w/2+d/2});}
const sword=el('g',{},mid),SW=[];
for(let i=0;i<10;i++){const side=i%2,g=group(side?SIDE(26,24,zs(24)):FRONT(26,24,zs(24)),sword),a=-60+i*13+rnd()*6,L=12+rnd()*9,w=1.6+rnd()*.8,s=el('g',{transform:`rotate(${a})`},g);
el('path',{d:`M0,0 Q${w},${-L*.5} 0,${-L} Q${-w},${-L*.5} 0,0Z`,class:'sword'},s);el('path',{d:`M0,0 L0,${-L*.92}`,class:'stem'},s);SW.push({s,a,ph:rnd()*6});}
items.push({n:sword,d:50});
const FISH=[];
function tetra(i){const g=el('g',{},mid),r=el('g',{},g),tail=el('path',{d:'M-1.5,0 L-2.7,-1.1 L-2.3,0 L-2.7,1.1 Z',class:'fish-b'},r);
el('path',{d:'M3,0 Q1.2,-1.15 -1.6,-.55 L-1.6,.55 Q1.2,1.15 3,0Z',class:'fish-b'},r);el('path',{d:'M-1.5,.1 Q.2,.95 1.4,.55 L1.2,.2 Q0,.4 -1.5,.1Z',class:'fred'},r);el('path',{d:'M-1.3,-.2 L2.2,-.25',class:'neon'},r);circle(r,2.2,-.25,.28,'eye');
return{g,r,tail,s:.95,x:12+i*8,y:18+rnd()*14,z:66+rnd()*14,vx:4,vy:0,vz:0,f:0,kind:0,ph:rnd()*6};}
for(let i=0;i<8;i++)FISH.push(tetra(i));
{const g=el('g',{},mid),r=el('g',{},g),tail=el('path',{d:'M-2.6,0 L-4.6,-1.8 L-4.2,0 L-4.6,1.8 Z',class:'angel'},r);
el('path',{d:'M3.6,0 Q1.6,-2.4 -.8,-1.6 L-1.4,-6.6 Q-2.6,-1.6 -2.8,0 Q-2.6,1.6 -1.4,6.6 L-.8,1.6 Q1.6,2.4 3.6,0Z',class:'angel'},r);
for(const u of[.8,-1])el('path',{d:`M${u},-1.9 L${u-.5},1.9`,class:'neon',style:'stroke:#262626;stroke-width:.8'},r);circle(r,2.4,-.4,.38,'eye');FISH.push({g,r,tail,s:1.35,x:60,y:28,z:72,vx:-3,vy:0,vz:0,f:-Math.PI,kind:1,ph:0});}
FISH.forEach(f=>items.push({n:f.g,d:0,fish:f}));
const flakeG=el('g',{}),FL=[...Array(26)].map(()=>({n:el('ellipse',{class:'flake',rx:0,ry:0},flakeG),live:0}));
const CARPET=el('g',{});for(let i=0;i<32;i++){const x=5+i*2.7+rnd()*1.4,y=33+rnd()*7,g=group(FRONT(x,y,zs(y)),CARPET);for(let k=0;k<5;k++){const a=(k-2)*.35+rnd()*.2,l=1.6+rnd()*1.3;el('path',{d:`M0,0 L${Math.sin(a)*l},${-Math.cos(a)*l}`,class:'blade'},g);}}
// Water: rays, surface glow, tint faces, ripples; then glass, silicone and the light bar.
const RAYS=[14,30,48,66].map(x=>el('path',{d:poly([[x,20,88],[x+6,20,88],[x+9,20,zs(20)],[x-1,20,zs(20)]],true),class:'ray'}));
const sp=P(47,22,88),gDay=el('ellipse',{cx:sp[0],cy:sp[1],rx:36,ry:12,class:'glow-day'}),gMoon=el('ellipse',{cx:sp[0],cy:sp[1],rx:36,ry:12,class:'glow-moon'});
const WAT=[[[2,42,48],[92,42,48],[92,42,88],[2,42,88]],[[92,2,48],[92,42,48],[92,42,88],[92,2,88]],[[2,2,88],[92,2,88],[92,42,88],[2,42,88]]];
WAT.forEach(p=>el('path',{d:poly(p,true),class:'water'}));const nightW=WAT.map(p=>el('path',{d:poly(p,true),class:'night'}));
const surf=el('path',{d:poly(WAT[2],true),class:'surface'});
const RIP=[0,1,2].map(i=>({n:circle(group(TOP(16,6.5,88.05)),0,0,1,'ripple'),t:i/3}));
const hitSurf=el('path',{d:poly(WAT[2],true),class:'hit',style:'cursor:pointer'});
wire([[2,42,88],[92,42,88],[92,2,88]],'meniscus');
el('path',{d:poly([[2,42.2,48],[92,42.2,48],[92,42.2,91],[2,42.2,91]],true),class:'pane'});el('path',{d:poly([[92.2,2,48],[92.2,42,48],[92.2,42,91],[92.2,2,91]],true),class:'pane'});
for(const[x,w]of[[12,5],[20,1.6]])el('path',{d:poly([[x,42.3,91],[x+w,42.3,91],[x+w+16,42.3,48],[x+16,42.3,48]],true),class:'streak'});
for(const p of[[2,42],[92,42],[92,2]])wire([[...p,48],[...p,91]],'sil');wire([[2,2,91],[92,2,91],[92,42,91],[2,42,91],[2,2,91]],'sil');
const LC=group(FRONT(76,42.35,53.4));rect(LC,0,0,12,4.4,.8,'lcd');const lcdT=text(LC,6,3.2,'25.0 °C','lcd-t');
box(1.8,18,91,1.6,8,6,.4,'metal');box(90.6,18,91,1.6,8,6,.4,'metal');
box(1,14,97,92,16,2.4,1.2,'metal');
const LB=group(TOP(1,14,99.4));rect(LB,4,3,84,10,1,'detail');for(let i=0;i<10;i++)line(LB,10+i*8,4.5,10+i*8,11.5,'detail');
const lb=button(group(FRONT(84,30.05,99.4)),{'aria-label':'Light: day or night (L)','aria-pressed':'false'});
rect(lb,0,.5,6,1.4,.4,'face recess');circle(lb,1.6,1.2,.45,'led led-d');circle(lb,4.4,1.2,.45,'led led-n');rect(lb,-1.2,-1,8.4,4.4,1,'focus-ring');rect(lb,-2,-2,10,6,0,'hit');
text(group(FRONT(4,30.05,99.4)),0,1.9,'TIDEWELL','label micro');
wire([[50,14,98.2],[50,6,98.6],[50,0,96]],'airline');
frame([[0,0,0,94,44,46],[1,2,46,92,40,53.4]],10);
// State: temperature, light, air, flakes, fish.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const say=t=>{announcement.textContent=t;},clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
let ac=null;
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
function tone(f,d=.15,v=.02,type='sine',when=0,f2=0){const a=ac;if(!a)return;const t=a.currentTime+when,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.03);}
let night=false,nv=0,air=true,temp=25,setT=25,last=performance.now(),bubAcc=0,strAcc=0,outKey='',fed=0,time=0;
const hint=k=>document.querySelector(`[data-k="${k}"]`);
function setNight(on){audio();night=on;svg.classList.toggle('lit-night',on);svg.classList.toggle('lit-day',!on);set(lb,'aria-pressed',on);set(hint('l'),'aria-pressed',on);tone(on?300:420,.04,.016,'square');say(on?'Night: blue moonlight on, the fish settle.':'Day: full white light.');}
function setAir(on){audio();air=on;set(hint('b'),'aria-pressed',on);tone(on?520:360,.05,.012,'triangle');say(on?'Air pump on.':'Air pump off.');}
function feed(x,y){audio();let n=0;for(const f of FL){if(f.live||n>=9)continue;n++;Object.assign(f,{live:1,x:x+(rnd()-.5)*8,y:clamp(y+(rnd()-.5)*6,6,38),z:88,float:.6+rnd()*1.2,rot:rnd()*6,c:['#e8743a','#d9452f','#f0b13a'][n%3]});set(f.n,'fill',f.c);}
fed+=n;for(let i=0;i<5;i++)tone(2000+rnd()*1600,.03,.004,'sine',i*.04);say(`${n} flakes dropped in.`);}
function heaterSet(d){audio();setT=clamp(Math.round((setT+d)*2)/2,22,30);tone(d>0?880:660,.04,.01,'triangle');say(`Heater set to ${setT.toFixed(1)} degrees.`);}
bind(lb,()=>setNight(!night));
hitSurf.addEventListener('click',e=>{const m=svg.getScreenCTM().inverse(),sx=e.clientX*m.a+e.clientY*m.c+m.e,sy=e.clientX*m.b+e.clientY*m.d+m.f,u=sx/C,v=sy+88;feed(clamp((u+2*v)/2,8,86),clamp((2*v-u)/2,6,38));});
document.querySelectorAll('.hint [data-k]').forEach(b=>b.addEventListener('click',()=>({f:()=>feed(30+rnd()*36,24),l:()=>setNight(!night),b:()=>setAir(!air)})[b.dataset.k]()));
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key;
if(k==='ArrowUp'||k==='ArrowDown'){e.preventDefault();heaterSet(k==='ArrowUp'?.5:-.5);return;}
if(e.repeat)return;const l=k.toLowerCase();
if(l==='f'){e.preventDefault();feed(30+rnd()*36,24);}else if(l==='l'){e.preventDefault();setNight(!night);}else if(l==='b'){e.preventDefault();setAir(!air);}});
function spawn(list,o){for(const b of list)if(!b.live){Object.assign(b,{live:1},o);return;}}
function tick(now){const dt=Math.min(.05,(now-last)/1000);last=now;time+=dt;const rm=reduced.matches;
nv+=((night?1:0)-nv)*(rm?1:Math.min(1,dt*1.6));
const op=(n,v)=>{n.style.opacity=v;};nightW.forEach((n,i)=>op(n,nv*(i===2?.45:.62)));backNight.forEach(n=>op(n,nv*.7));op(gDay,.55*(1-nv));op(gMoon,.5*nv);
RAYS.forEach((r,i)=>op(r,(1-nv)*(rm?.07:.05+.05*Math.sin(time*1.3+i*1.7))));
const heating=temp<setT-.05;svg.classList.toggle('heating',heating);temp+=clamp(setT-temp,-1,1)*dt*(heating?.35:.2);
// stems and sword sway; stronger near the filter outflow
STEMS.forEach((s,i)=>set(s.s,'transform',`rotate(${rm?0:Math.sin(time*.9+s.ph)*s.a*(i<4?1.7:1)})`));SW.forEach(w=>set(w.s,'transform',`rotate(${w.a+(rm?0:Math.sin(time*.7+w.ph)*2)})`));
// bubbles from the airstone and the filter stream
if(air&&!rm){bubAcc+=dt*9;while(bubAcc>1){bubAcc--;spawn(BUB,{x:76+(rnd()-.5),y:9+(rnd()-.5),z:zs(9)+1.6,r:.35+rnd()*.5,ph:rnd()*6});}}
strAcc+=dt*(rm?0:6);while(strAcc>1){strAcc--;spawn(STR,{x:12.5,y:6.5+(rnd()-.5),z:81.5+(rnd()-.5),r:.2+rnd()*.2,ph:rnd()*6});}
for(const b of BUB){if(!b.live){if(+b.n.getAttribute('r'))set(b.n,'r',0);continue;}b.z+=dt*(9+b.r*6);b.x+=Math.sin(time*7+b.ph)*dt*1.2;b.r+=dt*.05;if(b.z>87.6){b.live=0;continue;}const p=P(b.x,b.y,b.z);set(b.n,'cx',p[0]);set(b.n,'cy',p[1]);set(b.n,'r',b.r*1.2);}
for(const b of STR){if(!b.live){if(+b.n.getAttribute('r'))set(b.n,'r',0);continue;}b.x+=dt*16;b.z+=dt*1.6+Math.sin(time*9+b.ph)*dt;if(b.x>40||b.z>87.6){b.live=0;continue;}const p=P(b.x,b.y,b.z);set(b.n,'cx',p[0]);set(b.n,'cy',p[1]);set(b.n,'r',b.r*1.2);}
RIP.forEach(r=>{r.t=(r.t+dt*(rm?0:.45))%1;set(r.n,'r',2+r.t*14);r.n.style.opacity=(1-r.t)*.7;});
// flakes float, then sink and tumble; fish eat them
let live=0;for(const f of FL){if(!f.live){if(+f.n.getAttribute('rx'))set(f.n,'rx',0);continue;}live++;
if(f.float>0){f.float-=dt;f.x+=dt*2.2;}else{f.z-=dt*(2.6+Math.sin(time*3+f.rot));f.x+=Math.sin(time*2+f.rot)*dt*1.5;f.rot+=dt*3;}
if(f.z<zs(f.y)+.4){f.live=0;continue;}const p=P(f.x,f.y,f.z);set(f.n,'cx',p[0]);set(f.n,'cy',p[1]);set(f.n,'rx',.8+.6*Math.abs(Math.cos(f.rot)));set(f.n,'ry',.6);}
// fish: school target wanders, flakes attract, night slows; bodies face left or right, turning through the back
const slow=1-.65*nv,tx=48+30*Math.sin(time*.13),ty=29+5*Math.sin(time*.21),tz=70-9*nv+6*Math.sin(time*.17);
for(const f of FISH){let gx,gy,gz;const food=FL.filter(k=>k.live&&k.float<=0).sort((a,b)=>Math.hypot(a.x-f.x,a.y-f.y,a.z-f.z)-Math.hypot(b.x-f.x,b.y-f.y,b.z-f.z))[0];
if(food&&!night){gx=food.x;gy=food.y;gz=food.z;if(Math.hypot(gx-f.x,gy-f.y,gz-f.z)<1.6){food.live=0;tone(1400,.02,.004);}}
else if(f.kind){gx=70-30*Math.sin(time*.09);gy=26;gz=70-8*nv+5*Math.sin(time*.3);}
else{const i=FISH.indexOf(f);gx=tx+Math.cos(i*1.7)*6;gy=ty+Math.sin(i*2.3)*4;gz=tz+Math.sin(i*1.3)*4;}
const k=(food&&!night?2.2:.8)*slow;f.vx+=(gx-f.x)*k*dt-(f.vx*.6*dt);f.vy+=(gy-f.y)*k*dt-(f.vy*.6*dt);f.vz+=(gz-f.z)*k*dt-(f.vz*.8*dt);
for(const o of FISH)if(o!==f){const d=Math.hypot(o.x-f.x,o.y-f.y,o.z-f.z);if(d<2.6&&d>0){f.vx-=(o.x-f.x)/d*dt*8;f.vy-=(o.y-f.y)/d*dt*8;f.vz-=(o.z-f.z)/d*dt*8;}}
const sp=Math.hypot(f.vx,f.vy,f.vz),mx=(food&&!night?16:f.kind?5:9)*slow;if(sp>mx){f.vx*=mx/sp;f.vy*=mx/sp;f.vz*=mx/sp;}
if(!rm){f.x=clamp(f.x+f.vx*dt,8,86);f.y=clamp(f.y+f.vy*dt,13,37);f.z=clamp(f.z+f.vz*dt,zs(f.y)+4,86);}
const want=f.vx>=0?0:-Math.PI;f.f+=clamp(want-f.f,-dt*4,dt*4);const U=[Math.cos(f.f)*f.s,Math.sin(f.f)*f.s,0];
set(f.g,'transform',plane([f.x,f.y,f.z],U,[0,0,-f.s]));set(f.r,'transform',`rotate(${clamp(-f.vz*3,-18,18)})`);set(f.tail,'transform',`rotate(${rm?0:Math.sin(time*(14-6*nv)+f.ph)*14} ${f.kind?-2.6:-1.5} 0)`);}
items.forEach(it=>{if(it.fish)it.d=it.fish.x+it.fish.y;});[...items].sort((a,b)=>a.d-b.d).forEach(it=>mid.appendChild(it.n));
const tStr=`${temp.toFixed(1)} °C`;if(lcdT.textContent!==tStr)lcdT.textContent=tStr;
const r=`${tStr} · ${night?'NIGHT':'DAY'}`,st=`SET ${setT.toFixed(1)} °C · ${heating?'HEATING':'HOLDING'} · AIR ${air?'ON':'OFF'}${live?` · ${live} FLAKE${live>1?'S':''}`:''}`;
if(r+st!==outKey){readout.textContent=r;stateLabel.textContent=st;outKey=r+st;}
requestAnimationFrame(tick);}
svg.classList.add('lit-day');requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['f', 'l', 'b'], draw }
