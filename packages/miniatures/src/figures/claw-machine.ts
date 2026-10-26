// @ts-nocheck
/* LARKWELL CR–3 · Claw machine. Drawn for this kit on the shared engine, in the manner of the lab files: its stylesheet,
 * defs and script. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--base-top:#cbcbc7;--base-side:#a4a4a1;--recess:#9d9d99;--line:#626260;--accent:#3b5bfd;--shadow:#262626;--off:#b9b9b5;--chrome:#d9dad8;--chrome-top:#f4f4f2;--chrome-side:#bdbebc;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--rubber:#2e2e2d;--rubber-top:#474745;--gr:#55575a;--gr-top:#6a6c70;--gr-side:#45474a;--void:#3a3a38;--amber:#f0961c;--pink:#e23d86;--teal:#0e9f80;--bulb:#ffc94a;--back:#e4e2f5;--back-side:#d3d0ea;--bed:#d9d6ee;--disp:#141414;--led:#ff8a2b;--pane:.07;--streak:.32;--acryl:.22;--glow:0;--bear:#c98d5a;--cream:#f1dcc0;--bun:#f4efe6;--ear:#f3a6b8;--nose:#ef7f98;--frog:#6cc06a;--chick:#ffd23f;--beak:#f08a24;--cat:#f2a65a;--panda:#f7f6f2;--patch:#2e2e2e;--pig:#f6a9b8;--snout:#ee8aa0;--blue:#7aa6f0;--lilac:#b9a6ec;--eye:#262626;--cheek:#ff7f98}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--base-top:#bebeba;--base-side:#737372;--recess:#6e6e6c;--off:#9b9b99;--chrome:#b7b7b6;--chrome-top:#e4e4e2;--chrome-side:#858585;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--rubber:#252524;--rubber-top:#424240;--gr:#47484a;--gr-top:#636568;--gr-side:#2f2f31;--void:#262625;--amber:#ffad3d;--pink:#ff5ea8;--teal:#2fd6ae;--bulb:#ffd36b;--back:#d5d3e5;--back-side:#b4b1cc;--bed:#c4c1dc;--pane:.035;--streak:.11;--acryl:.12;--glow:.55;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.top.base{fill:var(--base-top)}.side.base{fill:var(--base-side)}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}text{font-family:ui-monospace,monospace;stroke:none}.etch{fill:var(--muted);font-size:3.2px;letter-spacing:.45px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}.gr{fill:var(--gr)}.top.gr{fill:var(--gr-top)}.side.gr{fill:var(--gr-side)}.void{fill:var(--void)}
.back{fill:var(--back)}.side.back{fill:var(--back-side)}.bed{fill:var(--bed)}.deco{fill:#fff;opacity:.8;stroke:none}.lamp-glow{fill:url(#lampG);opacity:var(--glow);pointer-events:none}
.acrylic{fill:#fff;fill-opacity:var(--acryl);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.rim{fill:none;stroke:#fff;stroke-width:.9;stroke-linecap:round;opacity:.85}.sticker{fill:var(--accent);font-size:2.6px;font-weight:700;letter-spacing:.5px;text-anchor:middle}
.pane{fill:#fff;opacity:var(--pane);pointer-events:none}.streak{fill:#fff;opacity:var(--streak);pointer-events:none}.edge{fill:none;stroke:#fff;stroke-width:.9;opacity:.75;pointer-events:none}.steer{cursor:crosshair}
.stripe{fill:var(--accent);stroke:none}.stripe2{fill:var(--amber);stroke:none}.plate-t{fill:var(--ink);font-size:3.6px;font-weight:600;letter-spacing:.9px;text-anchor:middle}.tiny{font-size:1.9px;letter-spacing:.4px;fill:var(--muted)}
.sign{fill:url(#signG)}.marq{font-size:8.4px;font-weight:700;letter-spacing:1.6px;text-anchor:middle}.m1{fill:var(--accent)}.m2{fill:var(--pink)}.m3{fill:var(--amber)}.m4{fill:var(--teal)}.crest-x{fill:var(--side);stroke:none}.ray{opacity:.22;stroke:none}
.bulb .core{fill:var(--off);stroke:var(--line);stroke-width:.4;vector-effect:non-scaling-stroke}.bulb .halo{fill:url(#bulbG);opacity:0}.bulb.on .core{fill:var(--bulb);stroke:none}.bulb.on .halo{opacity:1}
.star-lit{fill:var(--bulb);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.star-halo{fill:url(#bulbG)}
.disp{fill:var(--disp)}.led{fill:var(--led);font-size:6.6px;font-weight:700;text-anchor:middle}.led.s{font-size:2.6px;font-weight:600;letter-spacing:.3px;text-anchor:end}.led-glow{opacity:.6;filter:url(#bloom)}.ge{fill:#fff;opacity:.62;font-size:2.8px;font-weight:600;letter-spacing:.8px;text-anchor:middle}
.btn{fill:var(--accent)}.top.btn{fill:color-mix(in srgb,var(--accent) 76%,#fff)}.side.btn{fill:color-mix(in srgb,var(--accent) 68%,#000)}.btn-ring{fill:none;stroke:var(--accent);stroke-width:1.1;opacity:.3}.armed .btn-ring{opacity:1;filter:url(#glow)}.chev{fill:none;stroke:#fff;stroke-width:.9;stroke-linecap:round;stroke-linejoin:round;opacity:.92}
.ball{fill:url(#ball);stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke}.ball-hi{fill:#fff;opacity:.7}.stick{fill:var(--rubber);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}
.slot-lit{fill:#e5392b;opacity:.3}.slot-lit.on{opacity:1;filter:url(#glow)}.coin{fill:#e0b44c;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.coin-in{fill:none;stroke:#f2d27d;stroke-width:.6}
.flap{fill:#1d1d1c;fill-opacity:.42;stroke:var(--line);stroke-width:.7;vector-effect:non-scaling-stroke}.flap-t{fill:#fff;opacity:.78;font-size:2.5px;font-weight:700;letter-spacing:1px;text-anchor:middle}
.cable{fill:none;stroke:var(--line);stroke-width:.75;vector-effect:non-scaling-stroke}.fo{fill:none;stroke:var(--line);stroke-width:3.1;stroke-linecap:round;stroke-linejoin:round}.fi{fill:none;stroke:var(--chrome-top);stroke-width:1.75;stroke-linecap:round;stroke-linejoin:round}.tip{fill:var(--rubber)}.claw-shadow{fill:var(--shadow);opacity:.2;filter:url(#soft)}
.pf{fill:var(--c);stroke:var(--line);stroke-width:.75;vector-effect:non-scaling-stroke;stroke-linejoin:round}.pd{fill:var(--patch)}.pb{fill:var(--l)}.pl{fill:var(--l)}.pe{fill:var(--eye)}.ph{fill:#fff}.pn{fill:var(--nose)}.pk{fill:var(--cheek);opacity:.5}.pm{fill:none;stroke:var(--eye);stroke-width:.55;stroke-linecap:round;stroke-linejoin:round}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.15);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="ball" cx=".5" cy=".5" r=".55" fx=".36" fy=".3"><stop offset="0" stop-color="#ff9b8c"/><stop offset=".55" stop-color="#e5392b"/><stop offset="1" stop-color="#9e2216"/></radialGradient>
<radialGradient id="bulbG"><stop offset="0" style="stop-color:var(--bulb)" stop-opacity=".95"/><stop offset=".42" style="stop-color:var(--bulb)" stop-opacity=".38"/><stop offset="1" style="stop-color:var(--bulb)" stop-opacity="0"/></radialGradient>
<radialGradient id="lampG"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<linearGradient id="signG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffdf6"/><stop offset="1" stop-color="#fbf3df"/></linearGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* LARKWELL CR–3 claw machine. World: x lower-right, y lower-left (front faces look along +y), z up; 1 unit ≈ 1 cm.
Part                          x        y        z       w      d      h
plinth                        3        3        0      74     66      5
cabinet                       0        0        5      80     72     65   stripes, brand and vents down the side
prize door (bay)            6–32    63–72     8–34     26      9     26   smoked flap hinged at its top
coin door                  50–72      72     10–36     22      –     26   lit slot, return button
control desk                6–74    72–86    50–69     68     14     19   sloped top: joystick, display, drop button
glass case rail + bed         0        0       70      80     72      3   prize bed at z 73
backdrop (back, left)         2        2       73      76     68     87   printed stars, a lamp glow at night
chute (hole, acrylic)       3–27    47–69    73–84     24     22     11   down to the prize door
plushes                    11–65    11–58    73–109      –      –      –   a hex-packed floor, a top layer in its hollows
gantry rails            1.5/75.5      2      147       3     68      3
bridge                        2    gy±2.5    150      76      5    3.5   rides the rails in y
trolley                    gx±5    gy±4.5   153.5     10      9    5.5   rides the bridge in x
claw: head r 5.6 × 9 on a cable from the bridge; three fingers 17 long, hinged on r 4.6
glass, posts, top rail     front y 71, right x 79; posts 3 × 3, the near one 1.6; rail z 160–163
header (marquee)             −1       −1      163      82     74     24   lit signs, chase bulbs, vents
crest                      12–68    69–72   187–211     56      3     24   arched topper: sunburst, star, bulbs
The gantry follows the keys or the pointer and the claw hangs from it as a damped pendulum: lowered on its cable, it
closes, lifts and carries home to the chute, where it opens. How far off the plush's centre it closed decides the grab:
close holds, further out it slips partway home, further still it misses. Everything inside the glass is re-sorted by
x + y + z as it moves. */
const svg=document.getElementById('machine'),drawing=document.getElementById('drawing');let root=drawing;
const{C,S,P,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,box,cylinder,slits,frame}=kit(()=>root);
// Figure helpers: vectors, oriented planes and cylinders (the vault's), rounded outlines, pins, controls.
const{cos,sin,PI,hypot,max,min,abs,sqrt,floor,ceil,random}=Math,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>max(a,min(b,v)),into=g=>root=g,VW=[1,1,1];
const add=(a,b,k=1)=>[a[0]+b[0]*k,a[1]+b[1]*k,a[2]+b[2]*k],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(hypot(...a)||1));
const plane=(o,U,V)=>`matrix(${[...P(...U),...P(...V),...P(...o)].map(f2).join(' ')})`,move=(n,x,y,z)=>{const p=P(x,y,z);set(n,'transform',`translate(${f2(p[0])} ${f2(p[1])})`);};
function axes(n){n=unit(n);const U=unit(abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U);const a=P(...U),b=P(...V);if(a[0]*b[1]-a[1]*b[0]<0)V=mul(V,-1);return[U,V];}
function stadium(n,c0,c1,r){let A=sub(c1,c0);if(dot(A,VW)<0){[c0,c1]=[c1,c0];A=mul(A,-1);}const[U,V]=axes(A),pu=P(...U),pv=P(...V),d=P(...A),det=pu[0]*pv[1]-pv[0]*pu[1]||1e-9,u=(d[0]*pv[1]-pv[0]*d[1])/det,v=(pu[0]*d[1]-d[0]*pu[1])/det,l=hypot(u,v)||1,tx=-v*r/l,ty=u*r/l;
set(n,'transform',plane(c0,U,V));set(n,'d',`M${f2(tx)},${f2(ty)}A${r},${r} 0 0 1 ${f2(-tx)},${f2(-ty)}L${f2(u-tx)},${f2(v-ty)}A${r},${r} 0 0 1 ${f2(u+tx)},${f2(v+ty)}Z`);}
function rp(pts,r){const q=pts.map(p=>P(...p)),n=q.length;let d='';for(let i=0;i<n;i++){const a=q[(i+n-1)%n],b=q[i],c=q[(i+1)%n],la=hypot(b[0]-a[0],b[1]-a[1])||1,lc=hypot(c[0]-b[0],c[1]-b[1])||1,s=min(r,la/2)/la,t=min(r,lc/2)/lc;
d+=(i?'L':'M')+f2(b[0]+(a[0]-b[0])*s)+','+f2(b[1]+(a[1]-b[1])*s)+'Q'+f2(b[0])+','+f2(b[1])+' '+f2(b[0]+(c[0]-b[0])*t)+','+f2(b[1]+(c[1]-b[1])*t);}return d+'Z';}
const shape=(pts,cls,r=1.4)=>el('path',{d:rp(pts,r),class:'face '+cls});
function pin(g,x,y,r=.7){circle(g,x,y,r,'face top');line(g,x-r*.5,y+r*.35,x+r*.5,y-r*.35);}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
const ctl=(g,label)=>{for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0','aria-label':label}))set(g,k,v);return g;};
const star=(u,v,r1,r2,n=5)=>{let d='';for(let i=0;i<2*n;i++){const a=i*PI/n-PI/2,r=i%2?r2:r1;d+=(i?'L':'M')+f2(u+cos(a)*r)+','+f2(v+sin(a)*r);}return d+'Z';},spark=(g,u,v,r,c='deco')=>el('path',{d:star(u,v,r,r*.42,4),class:c},g);
const W=80,D=72,ZC=70,FL=73,ZT=160,ZH=163,HZ=24,CZ=150,HOME=[15,58],STEP=5,BX=[12,68],BY=[12,62],ZH0=128,OPEN=.62,REST=.2,SHUT=-.08,GRIP=.14,TIMER=15,IDLE=9000,G=520;
// Ground: one soft shadow (light), the lit floor and its contact (dark).
const sh=P(40,36,0);for(const c of['shadow stage-floor','stage-contact'])el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]+3),rx:70,ry:31,class:c});
// Plinth and cabinet: stripes, brand and vents down the side; the prize door and the coin door in front.
box(3,3,0,74,66,5,1.2,'base');box(0,0,5,W,D,ZC-5,2,'');
const CS=group(SIDE(W+.05,D,ZC));rect(CS,3,6,66,3.6,1.8,'stripe');rect(CS,3,11.4,66,1,.5,'stripe2');{const g=group('translate(9 22)',CS);rect(g,0,0,28,10,1.6,'face chrome');rect(g,1.2,1.2,25.6,7.6,1,'detail');text(g,14,5.4,'LARKWELL','plate-t');text(g,14,8,'CR–3','plate-t tiny');}slits(CS,46,51,19,6,9,true);for(const[u,v]of[[3,3],[69,3],[3,61],[69,61]])pin(CS,u,v);
const CF=group(FRONT(0,D+.05,ZC));rect(CF,2,58.4,76,4.6,1,'face base');
const bayG=el('g',{'clip-path':'url(#bayClip)'});rect(group(FRONT(6,63,34),bayG),0,0,26,26,0,'face void');rect(group(TOP(6,63,8.02),bayG),0,0,26,9,0,'face top recess');rect(group(SIDE(6.02,D,34),bayG),0,0,9,26,0,'face side recess');
const DR=group(FRONT(6,D+.06,34));el('path',{d:'M-2.4,-2.4H28.4V28.4H-2.4ZM0,0V26H26V0Z','fill-rule':'evenodd',class:'face chrome'},DR);
const door=ctl(el('g',{}),'Prize door: take the prize (P)'),flap=el('g',{},door);rect(flap,0,0,26,26,1.2,'flap');rect(flap,8,19.6,10,2,1,'face chrome');text(flap,20.6,3.6,'PUSH','flap-t');
{const g=group(FRONT(6,D+.07,34),door);rect(g,-3.4,-3.4,32.8,32.8,2,'focus-ring');rect(g,-2.4,-2.4,30.8,30.8,0,'hit');}
const outG=el('g',{});
const CD=group(FRONT(50,D+.05,36));rect(CD,0,0,22,26,1.6,'face metal');rect(CD,1.4,1.4,19.2,23.2,1.1,'detail');const slotLit=rect(CD,7.6,3.4,6.8,9.2,1.4,'slot-lit');rect(CD,10.2,4.6,1.6,6.8,.6,'face void');text(CD,11,16.8,'1 PLAY','etch center');rect(CD,8,19.4,6,2.8,1,'face top metal');for(const[u,v]of[[3,3],[19,3],[3,23],[19,23]])pin(CD,u,v,.6);
const coinG=el('g',{'clip-path':'url(#coinClip)',display:'none'}),coinS=el('g',{},coinG);circle(coinS,0,0,3.4,'coin');circle(coinS,0,0,2.5,'coin-in');
const coinCtl=ctl(el('g',{}),'Coin slot: insert a coin (C)');{const g=group(FRONT(50,D+.07,36),coinCtl);rect(g,-1.2,-1.2,24.4,28.4,2.4,'focus-ring');rect(g,0,0,22,26,0,'hit');}
// The glass case: its rail and prize bed, the printed backdrop, the chute's hole and back pane, the far rail.
box(0,0,ZC,W,D,3,1,'chrome');rect(group(TOP(2,2,FL+.02)),0,0,76,68,0,'face bed');
const BK=group(FRONT(2,2.02,ZT)),LK=group(SIDE(2.02,70,ZT));rect(BK,0,0,76,ZT-FL,0,'face back');rect(LK,0,0,68,ZT-FL,0,'face side back');
el('ellipse',{cx:38,cy:4,rx:46,ry:34,class:'lamp-glow'},BK);el('ellipse',{cx:34,cy:4,rx:42,ry:30,class:'lamp-glow'},LK);
for(let i=0;i<18;i++)spark(i<11?BK:LK,(i*29)%64+7,(i*17)%48+6,1.2+(i%4)*.4);
rect(group(TOP(3,47,FL+.04)),0,0,24,22,1,'face void');
{const g=group(FRONT(3,47,FL+11));rect(g,0,0,24,11,.8,'acrylic');line(g,.4,.3,23.6,.3,'rim');}
box(1.5,2,CZ-3,3,68,3,.8,'metal');
// Inside the glass, re-sorted by depth as things move: the plushes, the chute's side pane, the claw's head on its cable
// and its three fingers (each its own item, so a plush they close on sits between them), the claw's shadow.
const IN=el('g',{}),CW=el('g',{},IN);{const g=group(SIDE(27,69,FL+11),CW);rect(g,0,0,22,11,.8,'acrylic');line(g,.3,.3,21.7,.3,'rim');text(g,11,7,'WIN ▾','sticker');}
const shadowI=el('g',{},IN),shadowN=el('ellipse',{rx:6.4,ry:3.7,class:'claw-shadow'},shadowI);
const headI=el('g',{},IN),cableN=el('path',{class:'cable'},headI),headG=el('g',{},headI);into(headG);
cylinder(0,0,0,5.6,6,'z','chrome');el('path',{d:'M-6.86,-1.7A6.86,3.96 0 0 0 6.86,-1.7V-3.4A6.86,3.96 0 0 1 -6.86,-3.4Z',class:'stripe'});
el('path',{d:'M-6.86,-6A6.86,3.96 0 0 0 6.86,-6L2.57,-9A2.57,1.48 0 0 0 -2.57,-9Z',class:'face chrome'});circle(group(TOP(0,0,9)),0,0,2.1,'face top chrome');into(drawing);
const FING=[0,1,2].map(i=>{const g=el('g',{},IN);return{i,g,o:el('path',{class:'fo'},g),n:el('path',{class:'fi'},g),t:circle(g,0,0,1.45,'tip'),k:0};}),FP=[[0,0],[1.8,-3.4],[3.2,-8],[3,-12.5],[1.2,-15.9],[-1,-17.2]];
// The plushes: round heads (a sphere draws as a circle here), told apart by their ears, faces and colours.
const KIND={bear:['bear','cream'],bunny:['bun','ear'],frog:['frog','cream'],chick:['chick','beak'],cat:['cat','cream'],panda:['panda','patch'],pig:['pig','snout']};
function art(g,kind,f){
const n=f2,pd=kind==='panda',limb=pd?'pf pd':'pf',E=(x,y,rx,ry,c,a,p=g)=>el('ellipse',Object.assign({cx:x,cy:y,rx,ry,class:c},a?{transform:`rotate(${a} ${x} ${y})`}:{}),p),
O=(x,y,r,c,p=g,d=0)=>el('path',{d:[d-x,d+x].map(u=>`M${n(u-r)},${y}a${r},${r} 0 1 0 ${n(2*r)},0a${r},${r} 0 1 0 ${n(-2*r)},0`).join(''),class:c},p),
L=(d,c,p=g)=>el('path',{d,class:c},p),sub=k=>el('g',{transform:`translate(${n(f*k)} 0)`},g);
if(kind==='chick'){O(0,.6,8,'pf');E(-7.2,2,1.7,2.9,'pf',24);E(7.2,2,1.7,2.9,'pf',-24);O(2.6,8.6,1.3,'pf pb');L('M-.8,-7.2q-1.2,-3 1.6,-3.4q-.4,1.8 .8,3.2Z','pf');
const F=sub(1.92);O(1.87,-1.2,.55,'pe',F);O(1.87,-1.4,.22,'ph',F,-.16);L('M-1.14,.26L0,-.58L1.14,.26L0,1.4Z','pf pb',F);O(3.43,.67,.78,'pk',F);return;}
E(0,5,5,4.2,'pf');O(2.7,8.6,1.5,limb);E(-4.7,4,1.4,2.2,limb,28);E(4.7,4,1.4,2.2,limb,-28);if(kind==='bear'||kind==='cat'||kind==='frog')E(0,5.6,2.7,2.1,'pl');
const A=sub(.77);
if(kind==='bear'){O(4.2,-6.56,2.04,'pf',A);O(4.2,-6.56,1.02,'pl',A);}
else if(kind==='bunny')for(const s of[-1,1]){E(s*2.4,-9.68,1.5,3.72,'pf',s*10,A);E(s*2.4,-9.44,.66,2.52,'pl',s*10,A);}
else if(kind==='cat'||kind==='pig')for(const s of[-1,1]){L(`M${s*5.28},-4.4L${s*3.72},${kind==='cat'?-9.44:-8.48}L${s*.96},-7.64Z`,'pf',A);if(kind==='cat')L(`M${s*4.44},-5.24L${s*3.6},-8.24L${s*2.04},-7.4Z`,'pl',A);}
else if(pd)O(4.32,-6.56,1.86,'pf pd',A);
O(0,-2.6,6,'pf');const F=sub(1.92);
if(kind==='frog'){O(2.88,-6.8,2.22,'pf',F);O(2.88,-6.92,1.5,'ph',F);O(2.76,-6.8,.72,'pe',F);L('M-2.64,-1.4Q0,1.12 2.64,-1.4','pm',F);}
else{if(pd){E(-2.16,-2.3,1.2,1.62,'pd',28,F);E(2.16,-2.3,1.2,1.62,'pd',-28,F);}O(2.16,-2.48,.63,pd?'ph':'pe',F);O(2.16,-2.71,.25,pd?'pe':'ph',F,-.19);
if(kind==='pig'){E(0,-.62,1.8,1.2,'pf pl',0,F);O(.6,-.62,.3,'pe',F);}
else{if(kind!=='bunny')E(0,-.44,2.04,1.5,pd?'ph':'pl',0,F);E(0,-1.1,.66,.45,kind==='bunny'||kind==='cat'?'pn':'pe',0,F);L('M-.78,-.32q.39,.54 .78,0q.39,.54 .78,0','pm',F);}}
if(!pd)O(3.72,-.8,.78,'pk',F);}
const LAYOUT=[[11,11,'bunny',.3,-8],[29,11,'bear',-.2,6],[47,11,'cat',.1,-5],[65,12,'frog',-.3,8],[19,27,'pig',.4,-10],[37,27,'panda',0,4],[55,27,'chick',-.4,-6],[46,43,'frog',-.1,5],[64,42,'bunny',-.5,9],[38,58,'chick',.3,7],[56,58,'pig',-.2,-8],[24,35,'bear',.3,-6,'blue'],[20,16,'cat',.2,-12],[38,16,'pig',-.3,10],[56,17,'bunny',.35,9,'lilac'],[45,33,'panda',.1,-7],[56,48,'bear',-.3,-4]];
const pile=LAYOUT.map(([x,y,kind,f,tilt,c])=>{const o=el('g',{style:`--c:var(--${c||KIND[kind][0]});--l:var(--${KIND[kind][1]})`},IN),g=el('g',{},o),r=kind==='chick'?10:kind==='bear'||kind==='panda'||kind==='frog'?11:10.5;art(g,kind,f);
return{o,g,kind,k:r*.12247,name:((c?c+' ':'')+kind).toUpperCase(),x,y,x0:x,y0:y,z:0,r,tilt,t0:tilt,st:'pile',vx:0,vy:0,vz:0,spin:0,sq:0,tf:'',t:0,fade:0,hx:0,hy:0,hz:0,ox:0,oy:0,demo:false};});
// Over the pile: the near rail, the bridge riding both rails, the trolley riding the bridge.
box(75.5,2,CZ-3,3,68,3,.8,'metal');
const bridgeG=el('g',{});into(bridgeG);box(2,-2.5,CZ,76,5,3.5,1,'metal');rect(group(TOP(2,-2.5,CZ+3.52)),5,1.8,66,1.4,.7,'face recess');into(drawing);
const trolleyG=el('g',{});into(trolleyG);box(-5,-4.5,CZ+3.5,10,9,5.5,1.5,'gr');const mo=cylinder(5,-1,CZ+6.6,2,2.6,'x','chrome');circle(mo.face,0,0,.9,'detail');into(drawing);
// The glass: a faint tint, streaks of reflection and bright edges; the pointer steers over it. Posts and the top rail.
const GH=ZT-FL,FG=group(FRONT(2,71,ZT)),RG=group(SIDE(79,70,ZT));rect(FG,0,0,77,GH,0,'pane');rect(RG,0,0,68,GH,0,'pane');
for(const[g,u,w,k]of[[FG,9,7,26],[FG,19,2.4,26],[FG,44,4.5,26],[RG,7,5,22],[RG,15,1.8,22],[RG,40,3.4,22]])el('path',{d:`M${u},0H${u+w}L${u+w+k},${GH}H${u+k}Z`,class:'streak'},g);
line(FG,0,.6,77,.6,'edge');line(RG,0,.6,68,.6,'edge');
const glassHit=el('path',{d:poly([[2,71,ZT],[79,71,ZT],[79,2,ZT],[79,2,FL],[79,71,FL],[2,71,FL]],true),class:'hit steer'});
box(0,69,FL,3,3,ZT-FL,.6,'chrome');box(77,0,FL,3,3,ZT-FL,.6,'chrome');box(78.4,70.4,FL,1.6,1.6,ZT-FL,.4,'chrome');box(0,0,ZT,W,D,3,1,'chrome');
// The header: lit signs, chase bulbs round them, vents on top; the arched crest with its star.
box(-1,-1,ZH,82,74,HZ,2,'');
const HF=group(FRONT(-1,73.05,ZH+HZ)),HS=group(SIDE(81.05,73,ZH+HZ));rect(HF,5,4.6,72,14.8,2,'face sign');rect(HS,5,4.6,64,14.8,2,'face sign');slits(group(TOP(-1,-1,ZH+HZ)),26,6,30,10,10,true);
const word=(g,u,v,s)=>{const t=el('text',{x:u,y:v,class:'marq'},g);[...s].forEach((ch,i)=>{el('tspan',{class:'m'+(i%4+1)},t).textContent=ch===' '?' ':ch;});};
word(HF,41,15.3,'LARKWELL');word(HS,37,15.3,'PRIZES');
const BULBS=[],bulb=(g,u,v)=>{const b=el('g',{class:'bulb'},g);circle(b,u,v,3.2,'halo');circle(b,u,v,1.15,'core');BULBS.push(b);};
for(const[g,n,u,du,v]of[[HF,13,4.2,6.13,2.3],[HS,12,4,6,2.3],[HS,-12,4,6,21.7],[HF,-13,4.2,6.13,21.7]])for(let i=0;i<abs(n);i++)bulb(g,u+(n>0?i:-n-1-i)*du,v);
const CRP='M0,0V-9A28,15 0 0 1 56,-9V0Z';for(let k=0;k<4;k++)el('path',{d:CRP,transform:FRONT(12,69+k*.75,ZH+HZ),class:k?'crest-x':'face side'});
const CR=group(FRONT(12,72,ZH+HZ)),INNER='M3.5,0V-9A24.5,11.8 0 0 1 52.5,-9V0Z';el('path',{d:CRP,class:'face'},CR);el('path',{d:INNER,class:'face sign'},CR);
for(let i=0;i<9;i++){const a=PI*(1+i/9),b=a+PI/18;el('path',{d:`M28,-8.6L${f2(28+cos(a)*22)},${f2(-9+sin(a)*10.6)}L${f2(28+cos(b)*22)},${f2(-9+sin(b)*10.6)}Z`,class:'ray m'+(i%4+1)},CR);}
const crestHalo=circle(CR,28,-9,11,'star-halo');el('path',{d:star(28,-8.6,7,3),class:'star-lit'},CR);
for(let i=0;i<11;i++){const a=PI*(1-(i+.5)/11);bulb(CR,28+cos(a)*26.2,-9-sin(a)*13.4);}
// The control desk: a sloped graphite top with the joystick, the display and the big drop button; stripes in front.
shape([[74,72,69],[74,86,64],[74,86,55],[74,72,50]],'side gr',1.2);shape([[6,86,64],[74,86,64],[74,86,55],[6,86,55]],'gr',1.2);shape([[6,72,69],[74,72,69],[74,86,64],[6,86,64]],'top gr');
{const g=group(FRONT(6,86.05,64));text(g,16,3.7,'MOVE','ge');text(g,56,3.7,'DROP','ge');rect(g,1.5,4.9,65,1.9,.95,'stripe');rect(g,1.5,7.4,65,.6,.3,'stripe2');}
const D0=[6,72,69],DV=unit([0,14,-5]),DN=cross([1,0,0],DV),dk=(u,v,h=0)=>add(add(D0,[u,v*DV[1],v*DV[2]]),DN,h),DP=(u,v,h=0)=>plane(dk(u,v,h),[1,0,0],DV),DF=group(DP(0,0));
rect(DF,26.4,1.6,21.2,11.2,1.6,'face gr');rect(DF,27.6,2.8,18.8,8.8,1,'disp');
const LG=el('g',{class:'led-glow'},DF),LED=[LG,DF].map(g=>({b:text(g,37,10,'','led'),s:text(g,45.4,4.8,'','led s')}));
const JB=dk(16,7.2,.4);circle(group(DP(16,7.2)),0,0,4.6,'face rubber');circle(group(DP(16,7.2,.25)),0,0,2.4,'face top rubber');
const joy=el('g',{}),stickN=el('path',{class:'stick'},joy),ballN=circle(joy,0,0,4.04,'ball'),ballH=el('ellipse',{rx:1.3,ry:.85,class:'ball-hi'},joy);
const btn=ctl(el('g',{}),'Drop button: drop the claw (Space)');circle(group(DP(56,7.2),btn),0,0,7.4,'face rubber');circle(group(DP(56,7.2,.3),btn),0,0,6.5,'btn-ring');
const capB=el('path',{class:'face side btn'},btn),capT=el('g',{},btn);circle(capT,0,0,5.4,'face top btn');el('path',{d:'M-3.6,-1.2A3.8,3.8 0 0 1 -.6,-3.8',class:'chev'},capT);
{const g=group(DP(56,7.2),btn);circle(g,0,0,8.8,'focus-ring');circle(g,0,0,9,'hit');}
frame([[-1,-1,0,82,74,ZH+HZ],[12,69,ZH+HZ,56,3,24],[6,72,50,68,16,19]],14);
const DEFS=svg.querySelector('defs');
el('path',{d:poly([[6,D,34],[32,D,34],[32,D,8],[6,D,8]],true)},el('clipPath',{id:'bayClip'},DEFS));
{const c=el('clipPath',{id:'chuteClip'},DEFS);el('rect',{x:-400,y:-500,width:800,height:f2(500+P(15,58,FL)[1])},c);el('path',{d:poly([[3,47,FL],[27,47,FL],[27,69,FL],[3,69,FL]],true)},c);}
el('rect',{x:-400,y:-400,width:f2(400+P(61,D,0)[0]),height:800},el('clipPath',{id:'coinClip'},DEFS));
// State: credits, the timer, the gantry and its pendulum, the drop sequence, the plushes, the door and the lights.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),say=m=>{announcement.textContent=m;};
let credits=3,won=0,timer=TIMER,phase='idle',pt0=performance.now(),last=pt0,gx=HOME[0],gy=HOME[1],vx=0,vy=0,tx=gx,ty=gy,ox=0,oy=0,wox=0,woy=0,cx=gx,cy=gy,zh=ZH0,z0=ZH0,th=REST,tht=REST,phi=.5;
let held=null,weak=false,slipAt=9,prog=0,grab=null,dist0=1,dropHere=false,demoPlay=false,lastIn=pt0-IDLE+2600,holdT=0,beep=99,note='',noteUntil=0,winT=-1e9,bay=null,btnDown=0,btnH=-1,coinT=0,slotT=-1e9,flapKick=-1e9,flapOpen=-1e9,flapA=-1,jx=0,jy=0,jKey='',clawKey='',outKey='',lit='',ledKey='',headK=0,shK=0;
const keys={ArrowLeft:0,ArrowRight:0,ArrowUp:0,ArrowDown:0},DIR={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]},demo={on:false,step:0,t:0,aim:null};
let ac=null,nb=null;
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
function tone(f,d,v,type='sine',when=0,f1=0){if(!ac||demo.on)return;try{const t=ac.currentTime+when,g=ac.createGain();let o;if(type==='noise'){if(!nb){nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=random()*2-1;}o=ac.createBufferSource();o.buffer=nb;const b=ac.createBiquadFilter();b.type='bandpass';b.frequency.value=f;b.Q.value=f1||1;o.connect(b);b.connect(g);}
else{o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+d);o.connect(g);}g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+d);g.connect(ac.destination);o.start(t);o.stop(t+d+.05);}catch(_){}}
const hiss=(d,v,f,q=1,when=0)=>tone(f,d,v,'noise',when,q);
const lc=q=>q.name.toLowerCase(),pad=n=>String(n).padStart(2,'0'),secs=()=>ceil(timer-1e-6);
function go(p){phase=p;pt0=performance.now();}
function notice(m,ms=1600){note=m;noteUntil=performance.now()+ms;}
function user(){lastIn=performance.now();if(demo.on){demo.on=false;if(phase==='play'&&demoPlay){go('idle');tx=gx;ty=gy;timer=TIMER;demoPlay=false;}}audio();}
// The pile: where a plush comes to rest (on the bed or nestled on the plushes under it), and what the claw meets.
const hole=(x,y)=>x>3&&x<27&&y>47&&y<69;
function restZ(x,y,r,self){let z=FL+r*.92;for(const q of pile)if(q!==self&&q.st==='pile'&&q.z){const d=hypot(x-q.x,y-q.y),s=(r+q.r)*.8;if(d<s)z=max(z,q.z+sqrt(s*s-d*d));}return z;}
function surface(x,y){let z=FL;for(const q of pile)if(q.st==='pile'){const d=hypot(x-q.x,y-q.y);if(d<q.r)z=max(z,q.z+sqrt(q.r*q.r-d*d));}return z;}
const stopZ=()=>max(FL+15.5,surface(cx,cy)+1);
function settle(){for(const q of pile)if(q.st==='pile'&&q.z>restZ(q.x,q.y,q.r,q)+.6){q.st='fall';q.vz=0;}}
function clear(q){const m=q.r*.75;if(q.x<27+m&&q.y>47-m&&!hole(q.x,q.y)){if(27+m-q.x<q.y-(47-m))q.x=27+m;else q.y=47-m;}}
for(const q of pile)q.z=restZ(q.x,q.y,q.r,q);
// Play: a credit buys a timed turn; the arrows step the gantry (and keep it going while held), Space drops.
function deny(){notice('INSERT COIN · C ADDS A CREDIT');slotT=performance.now();tone(196,.16,.025,'square');say('No credits: press C for a coin.');}
function begin(isDemo){if(phase==='play')return true;if(phase!=='idle'){notice('WAIT FOR THE CLAW',1000);return false;}if(!isDemo){if(credits<1){deny();return false;}credits--;}
demoPlay=!!isDemo;timer=TIMER;beep=99;dropHere=false;go('play');if(!isDemo){tone(523,.08,.02,'square');tone(784,.1,.02,'square',.08);say(`Game on: ${TIMER} seconds. Steer, then press Space to drop.`);}return true;}
function arrow(k){if(phase==='idle'&&!begin())return;if(phase!=='play'){notice('WAIT FOR THE CLAW',1000);return;}keys[k]=1;holdT=0;const[a,b]=DIR[k];tx=clamp(tx+a*STEP,...BX);ty=clamp(ty+b*STEP,...BY);if(reduced.matches){gx=tx;gy=ty;}hiss(.06,.008,700,.9);}
function dropBtn(){btnDown=performance.now()+150;hiss(.025,.02,3200,2);if(phase==='idle'&&!begin())return;if(phase==='play')startDrop();}
function startDrop(){dropHere=false;go('settle');tone(260,1.1,.012,'sawtooth',0,130);say('Dropping the claw.');}
function coin(){if(credits>=9){notice('CREDITS FULL',1200);return;}credits++;coinT=slotT=performance.now();notice(`COIN IN · ${credits} CREDIT${credits>1?'S':''}`,1400);tone(1568,.06,.03,'triangle');tone(2093,.12,.025,'triangle',.07);hiss(.18,.02,4200,2,.03);say(`Coin in: ${credits} credit${credits>1?'s':''}.`);}
function take(){if(!bay){notice('NO PRIZE AT THE DOOR',1200);return;}const q=bay;eject(q);notice(`ENJOY THE ${q.name}`,1800);tone(880,.06,.015);tone(1175,.1,.015,'sine',.06);say(`You took the ${lc(q)}.`);}
function eject(q){bay=null;q.st='out';q.t=flapOpen=performance.now();outG.appendChild(q.o);}
// The grab: where the claw stops it closes on the highest plush under it; the offset from that plush's centre decides
// a firm hold, a hold that slips partway home (the further off, the sooner), or a miss.
function arrive(){go('grip');hiss(.05,.03,2400,3);tone(150,.08,.03,'triangle');grab=null;let best=null;
for(const q of pile)if(q.st==='pile'){const d=hypot(q.x-cx,q.y-cy);if(d<q.r*1.15&&zh-q.z-q.r<5&&(!best||d<best.d))best={q,d};}
if(best&&best.d<=best.q.r*.84){grab=best;tht=GRIP+(best.d>best.q.r*.4?.1:0);}else{tht=SHUT;if(best)best.q.sq=.7;}}
function attach(){const{q,d}=grab;held=q;q.st='held';q.demo=demoPlay;weak=d>q.r*.4;slipAt=weak?clamp(1.2*(q.r*.84-d)/(q.r*.44)-.12,0,1.1):9;q.hx=q.ox=q.x-cx;q.hy=q.oy=q.y-cy;q.hz=zh-q.z;z0=zh;prog=0;settle();
tone(weak?330:440,.08,.02,'triangle');say(weak?`Got the ${lc(q)}, barely.`:`Got the ${lc(q)}!`);}
function slip(){const q=held;held=null;q.st='fall';q.vx=vx+wox;q.vy=vy+woy;q.vz=phase==='lift'?18:0;q.spin=(q.ox-q.oy>0?1:-1)*140;tht=SHUT;notice('IT SLIPPED · SO CLOSE',2400);tone(700,.35,.02,'triangle',0,180);say(`The ${lc(q)} slipped.`);}
function slipCheck(p){prog=p;if(held&&weak&&p>=slipAt)slip();}
function toCarry(red){go('carry');if(!red){tx=HOME[0];ty=HOME[1];}dist0=max(.01,hypot(HOME[0]-gx,HOME[1]-gy));}
function win(q){winT=performance.now();if(!q.demo)won++;notice(`WINNER · THE ${q.name}`,2600);[523,659,784,1047,1319].forEach((f,i)=>tone(f,.14,.022,'triangle',i*.08));say(`You won the ${lc(q)}! Press P to take it.`);}
function toChute(q){q.st='chute';q.vx=q.vy=0;q.x=clamp(q.x,3+q.r*.55,27-q.r*.55);q.y=clamp(q.y,47+q.r*.55,69-q.r*.55);set(q.o,'clip-path','url(#chuteClip)');win(q);}
function toDoor(q,now){if(bay)eject(bay);bay=q;q.st='door';q.o.removeAttribute('clip-path');set(q.o,'display','inline');bayG.appendChild(q.o);q.x=19;q.y=67.5;q.z=31;q.vz=0;q.tilt=q.t0*.5;flapKick=now;tone(95,.16,.04);hiss(.1,.02,350,.7);}
function restock(q,now,red){q.x=q.x0;q.y=q.y0;q.vx=q.vy=q.vz=q.spin=0;q.tilt=q.t0;q.st='fall';q.z=red?restZ(q.x,q.y,q.r,q):126;q.fade=red?0:now;IN.appendChild(q.o);set(q.o,'display','inline');set(q.o,'opacity',red?1:0);}
// One plush's step: falling (onto the pile, off the walls and the chute's panes, or into the chute), down the chute,
// into the door's bay, out of it when taken, and back in from above.
function step(q,now,dt,red){q.sq=max(0,q.sq-dt*4);
if(q.st==='fall'){if(q.fade)set(q.o,'opacity',f2(clamp((now-q.fade)/260)));
if(red){if(hole(q.x,q.y)){toChute(q);return;}clear(q);q.z=restZ(q.x,q.y,q.r,q);q.st='pile';q.vx=q.vy=q.vz=q.spin=0;q.tilt=q.t0;settle();return;}
q.vz-=G*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z+=q.vz*dt;q.tilt+=q.spin*dt;const m=q.r*.72;
if(q.x<2+m){q.x=2+m;q.vx=abs(q.vx)*.4;}if(q.x>78-m){q.x=78-m;q.vx=-abs(q.vx)*.4;}if(q.y<2+m){q.y=2+m;q.vy=abs(q.vy)*.4;}if(q.y>70-m){q.y=70-m;q.vy=-abs(q.vy)*.4;}
if(hole(q.x,q.y)){if(q.z<FL+11+q.r*.4)toChute(q);return;}clear(q);
const rz=restZ(q.x,q.y,q.r,q);if(q.z<=rz){q.z=rz;if(q.vz<-80){q.vz*=-.3;q.vx*=.45;q.vy*=.45;q.spin*=.4;q.sq=1;}else{q.st='pile';q.vx=q.vy=q.vz=q.spin=0;q.tilt=clamp(q.tilt,-60,60);q.fade=0;set(q.o,'opacity',1);settle();}}}
else if(q.st==='chute'){if(!red){q.vz-=G*dt;q.z+=q.vz*dt;}if(red||q.z<FL-q.r*1.4){q.st='slide';q.t=now;set(q.o,'display','none');}}
else if(q.st==='slide'){if(red||now-q.t>420)toDoor(q,now);}
else if(q.st==='door'){const fz=8+q.r*.85;if(red)q.z=fz;else{q.vz-=G*dt;q.z+=q.vz*dt;if(q.z<fz){q.z=fz;if(q.vz<-60){q.vz*=-.3;q.sq=1;}else q.vz=0;}}}
else if(q.st==='out'){const t=(now-q.t)/1000,e=min(1,t/.45);if(red||t>.8){q.st='gone';q.t=now;set(q.o,'display','none');}else{q.y=67.5+16*e;q.z=8+q.r*.85+6*sin(e*PI/2);set(q.o,'opacity',f2(clamp((.8-t)/.3)));}}
else if(q.st==='gone'&&now-q.t>(red?0:900)&&(phase==='idle'||phase==='play'))restock(q,now,red);}
// A held plush hangs under the head between the fingers: a firm grip centres it; a weak one hangs off to the side,
// tilts and works loose as the carry goes on.
function hang(now,dt,red){const q=held;if(!q)return;const k=red?1:min(1,dt*7),p=weak?clamp(prog/slipAt):0;
q.hx+=((weak?q.ox*(1+.25*p):0)-q.hx)*k;q.hy+=((weak?q.oy*(1+.25*p):0)-q.hy)*k;q.hz+=(q.r*(weak?1.25:1.1)-q.hz)*k;q.x=cx+q.hx;q.y=cy+q.hy;q.z=zh-q.hz;
q.tilt=q.t0*.4+(weak?(q.ox-q.oy>0?1:-1)*(10+18*p)+(red?0:sin(now/85)*(2+7*p)):(red?0:-(wox-woy)*2));}
// The gantry: P-control toward its target, limited acceleration; the claw swings under it as a damped pendulum whose
// length is the cable's (reduced motion: it jumps and hangs straight).
function steer(dt,red){
if(phase==='play'){if(red){holdT+=dt;if(holdT>=.14){holdT=0;for(const k in keys)if(keys[k]){tx=clamp(tx+DIR[k][0]*STEP,...BX);ty=clamp(ty+DIR[k][1]*STEP,...BY);}}}
else for(const k in keys)if(keys[k]){const[a,b]=DIR[k];if(a&&(tx-gx)*a<STEP*.8)tx=clamp(tx+a*STEP,...BX);if(b&&(ty-gy)*b<STEP*.8)ty=clamp(ty+b*STEP,...BY);}}
const pvx=vx,pvy=vy,go2=phase==='play'||phase==='carry';
if(red){if(go2){gx=tx;gy=ty;}vx=vy=0;}
else{const sp=phase==='carry'?20:24,A=150*dt,wx=go2?clamp((tx-gx)*6,-sp,sp):0,wy=go2?clamp((ty-gy)*6,-sp,sp):0;vx+=clamp(wx-vx,-A,A);vy+=clamp(wy-vy,-A,A);gx+=vx*dt;gy+=vy*dt;
if(gx<BX[0]||gx>BX[1]){gx=clamp(gx,...BX);vx=0;}if(gy<BY[0]||gy>BY[1]){gy=clamp(gy,...BY);vy=0;}}
if(red){ox=oy=wox=woy=0;}else if(dt>0){const ax=(vx-pvx)/dt,ay=(vy-pvy)/dt,w2=700/(max(2,CZ-zh-9)+8),c=2*sqrt(w2)*(phase==='grip'||(phase==='drop'&&zh<stopZ()+3)?1.2:.12),h=dt/4;
for(let i=0;i<4;i++){wox+=(-w2*ox-ax-c*wox)*h;woy+=(-w2*oy-ay-c*woy)*h;ox+=wox*h;oy+=woy*h;}ox=clamp(ox,-7,7);oy=clamp(oy,-7,7);}
cx=gx+ox;cy=gy+oy;if(!red)phi+=dt*hypot(vx,vy)*.02;
th=red?tht:th+clamp(tht-th,-3.2*dt,3.2*dt);}
// The drop sequence: settle, drop, grip, lift, carry home, release over the chute; reduced motion steps through it.
function sequence(now,dt,red){const e=now-pt0;
if(phase==='play'){timer=max(0,timer-dt);const s=secs();if(s<=5&&s>0&&s!==beep){beep=s;tone(1046,.05,.015,'square');}if(timer<=0){notice('TIME UP · DROPPING',1200);startDrop();}else if(dropHere&&hypot(tx-gx,ty-gy)<.6&&hypot(vx,vy)<1.5)startDrop();}
else if(phase==='settle'){tht=OPEN;if(red||hypot(vx,vy)<1)go('drop');}
else if(phase==='drop'){tht=OPEN;const s=stopZ();if(red){if(e>280){zh=s;arrive();}}else{zh-=22*dt;if(zh<=s){zh=s;arrive();}}}
else if(phase==='grip'){if(e>(red?300:520)){if(grab)attach();else{tone(392,.14,.02,'triangle');tone(311,.22,.02,'triangle',.14);notice('MISSED · RETURNING',2600);say('Missed.');}go('lift');tone(150,1,.012,'sawtooth',0,280);}}
else if(phase==='lift'){if(red){if(e>300){zh=ZH0;slipCheck(.35);toCarry(red);}}else{zh=min(ZH0,zh+18*dt);slipCheck(.35*clamp((zh-z0)/(ZH0-z0||1)));if(zh>=ZH0)toCarry(red);}}
else if(phase==='carry'){if(red){if(e>300){slipCheck(1);gx=tx=HOME[0];gy=ty=HOME[1];go('release');}}else{const d=hypot(HOME[0]-gx,HOME[1]-gy);slipCheck(.35+.65*clamp(1-d/dist0));if(d<.4&&hypot(vx,vy)<1.2)go('release');}}
else if(phase==='release'){tht=OPEN;if(held&&e>(red?0:160)){const q=held;held=null;q.x=cx+q.hx;q.y=cy+q.hy;q.z=zh-q.hz;q.st='fall';q.vx=red?0:wox;q.vy=red?0:woy;q.vz=0;q.spin=red?0:(q.hx>0?160:-160);}if(e>(red?300:700)){tht=REST;go('idle');timer=TIMER;demoPlay=false;tx=gx;ty=gy;}}}
// Left alone, it plays itself (silently): picks a plush, steers over it along y then x, drops; any input takes over.
function demoStep(now,red){
if(!demo.on){if(red||phase!=='idle'||bay||now-lastIn<IDLE)return;demo.on=true;demo.step=0;demo.t=now+500;}
if(now<demo.t)return;
if(demo.step===0){const free=pile.filter(q=>q.st==='pile'&&q.x>14&&q.x<66&&q.y>26&&q.y<60).sort((a,b)=>b.z-a.z).slice(0,4);
if(!free.length||phase!=='idle'){demo.t=now+2000;return;}const q=free[floor(random()*free.length)],roll=random(),off=roll<.6?random()*1.4:roll<.85?q.r*.5+random()*q.r*.25:q.r*.95+random()*2,a=random()*2*PI;
demo.aim=[clamp(q.x+cos(a)*off,...BX),clamp(q.y+sin(a)*off,...BY)];begin(true);ty=demo.aim[1];demo.step=1;}
else if(phase!=='play'&&demo.step<4){demo.step=4;}
else if(demo.step===1){if(abs(gy-ty)<.5&&abs(vy)<1){tx=demo.aim[0];demo.step=2;}}
else if(demo.step===2){if(abs(gx-tx)<.5&&abs(vx)<1){demo.t=now+450;demo.step=3;}}
else if(demo.step===3){startDrop();demo.step=4;}
else if(demo.step===4){if(phase==='idle'&&!pile.some(q=>q.st==='fall'||q.st==='chute'||q.st==='slide')){demo.step=bay?5:0;demo.t=now+(bay?1500:2600);}}
else if(demo.step===5){if(bay)eject(bay);demo.step=0;demo.t=now+2600;}}
// Drawing the moving parts: the claw (head, cable, fingers, shadow), gantry, joystick, button, coin, flap, lights.
function render(now,red){
const ck=[gx,gy,cx,cy,zh,th,phi].map(f2).join();if(ck!==clawKey){clawKey=ck;move(headG,cx,cy,zh);const a=P(gx,gy,CZ),b=P(cx,cy,zh+9);set(cableN,'d',`M${f2(a[0])},${f2(a[1])}L${f2(b[0])},${f2(b[1])}`);headK=cx+cy+zh+4;
const ct=cos(th),st=sin(th);for(const F of FING){const ph=phi+F.i*2*PI/3,ca=cos(ph),sa=sin(ph),pts=FP.map(([r,z])=>{const rr=4.6+r*ct-z*st;return P(cx+rr*ca,cy+rr*sa,zh+r*st+z*ct);}),d='M'+pts.map(p=>f2(p[0])+','+f2(p[1])).join('L'),tp=pts[pts.length-1];
set(F.o,'d',d);set(F.n,'d',d);set(F.t,'cx',f2(tp[0]));set(F.t,'cy',f2(tp[1]));F.k=cx+cy+7.6*(ca+sa)+zh-8.5;}
const sz=surface(cx,cy),sp=P(cx,cy,sz+.3);set(shadowN,'cx',f2(sp[0]));set(shadowN,'cy',f2(sp[1]));shK=cx+cy+sz+.5;
move(bridgeG,0,gy,0);move(trolleyG,gx,gy,0);}
for(const q of pile)if(q.st!=='gone'&&q.st!=='slide'){const p=P(q.x,q.y,q.z),t=`translate(${f2(p[0])} ${f2(p[1])}) rotate(${f2(q.tilt)}) scale(${f2(q.k*(1+q.sq*.1))} ${f2(q.k*(1-q.sq*.14))})`;if(t!==q.tf){q.tf=t;set(q.g,'transform',t);}}
const L=[{n:CW,k:163.5},{n:headI,k:headK},{n:shadowI,k:shK},...FING.map(F=>({n:F.g,k:F.k})),...pile.filter(q=>q.o.parentNode===IN).map(q=>({n:q.o,k:q.x+q.y+q.z}))].sort((p,q)=>p.k-q.k);
L.forEach((it,i)=>{if(IN.children[i]!==it.n)IN.insertBefore(it.n,IN.children[i]||null);});
// The joystick leans the way the gantry is driven; the button sinks when pressed.
let wx=0,wy=0;for(const k in keys)if(keys[k]){wx+=DIR[k][0];wy+=DIR[k][1];}if(!wx&&!wy&&phase==='play'){wx=clamp(vx/24,-1,1);wy=clamp(vy/24,-1,1);}
jx+=red?wx-jx:(wx-jx)*min(1,.25);jy+=red?wy-jy:(wy-jy)*min(1,.25);const jk=f2(jx)+f2(jy);
if(jk!==jKey){jKey=jk;const tip=add(JB,[jx*3,jy*3,9]);stadium(stickN,JB,tip,.85);const bp=P(...add(tip,[0,0,1.4]));set(ballN,'cx',f2(bp[0]));set(ballN,'cy',f2(bp[1]));set(ballH,'cx',f2(bp[0]-1.3));set(ballH,'cy',f2(bp[1]-1.5));}
const bh=now<btnDown?.8:2.6;if(bh!==btnH){btnH=bh;stadium(capB,dk(56,7.2,.3),dk(56,7.2,bh),5.4);set(capT,'transform',DP(56,7.2,bh));}btn.classList.toggle('armed',phase==='play');
if(coinT&&!red){const q=clamp((now-coinT)/380);if(q>=1){coinT=0;set(coinG,'display','none');}else{set(coinG,'display','inline');set(coinS,'transform',SIDE(61,84-14*q*q,28));}}else coinT=0;
slotLit.classList.toggle('on',now-slotT<500||(credits<1&&phase==='idle'&&(red||floor(now/500)%2===0)));
const ft=now-flapOpen,fa=red?0:max(now-flapKick<360?.3*sin((now-flapKick)/360*PI):0,ft<0||ft>950?0:ft<200?ft/200*1.05:ft<700?1.05:1.05*(1-(ft-700)/250));
if(fa!==flapA){flapA=fa;set(flap,'transform',plane([6,71.6,34],[1,0,0],[0,sin(fa),-cos(fa)]));}
const w=now-winT<3400;
// Lights: attract chases round the marquee, play holds them lit, a win flashes them; reduced motion holds a pattern.
const att=(phase==='idle'&&!bay)||demo.on;const s=red?(w?'w':att?'a':'p'):w?'w'+floor(now/90)%2:att?'a'+floor(now/120)%BULBS.length:'p';
if(s!==lit){lit=s;const k=+s.slice(1)||0;BULBS.forEach((bb,i)=>bb.classList.toggle('on',s==='p'||s==='w'||(s==='a'?i%2===0:s[0]==='w'?(i+k)%2===0:(i-k+BULBS.length*9)%5<2)));}
crestHalo.style.opacity=f2(w?(red?1:.6+.4*sin(now/70)):.55);
LG.style.opacity=w&&!red?f2(.25+.6*(floor(now/250)%2)):'';let big;if(w)big='WIN!';else if(phase!=='idle')big=pad(secs());else if(demo.on)big='DEMO';else if(credits<1)big=red||floor(now/500)%2?'COIN':'';else big='PLAY';
const lk=big+credits;if(lk!==ledKey){ledKey=lk;for(const l of LED){l.b.textContent=big;l.s.textContent=`CR ${credits}`;}}}
// The caption: credits, timer and wins; the state line names what the machine is doing.
function ui(now){const r=`CREDITS ${credits} · TIMER ${pad(secs())} · WON ${won}`;let s;
if(now<noteUntil)s=note;
else if(phase==='idle')s=bay?'PRIZE AT THE DOOR · P TAKES IT':credits>0?'READY · STEER, THEN SPACE DROPS':'INSERT COIN · C ADDS A CREDIT';
else if(phase==='play')s=demo.on?'AIMING':timer<=5?`HURRY · ${secs()} S LEFT`:'STEERING · SPACE DROPS';
else if(phase==='settle'||phase==='drop')s='DROPPING THE CLAW';
else if(phase==='grip')s='GRABBING';
else if(phase==='release')s=held?'OVER THE CHUTE · RELEASING':'RELEASING';
else s=held?(weak?`BARELY HOLDING THE ${held.name}`:`GOT THE ${held.name}`):'RETURNING';
if(demo.on)s=`DEMO · ${s}`;if(r+s!==outKey){outKey=r+s;readout.textContent=r;stateLabel.textContent=s;}}
function tick(now){const dt=min(.05,max(0,(now-last)/1000)),red=reduced.matches;last=now;
demoStep(now,red);steer(dt,red);sequence(now,dt,red);hang(now,dt,red);for(const q of pile)step(q,now,dt,red);render(now,red);ui(now);requestAnimationFrame(tick);}
// Input: arrows (held, they keep going), Space, C and P; the button, the coin slot and the prize door. A click on the
// glass starts a play and drops the claw where it points; while a play is under way the pointer over the glass steers.
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key;
if(DIR[k]){e.preventDefault();if(!e.repeat){user();arrow(k);}return;}if(e.repeat)return;
if(k===' '){e.preventDefault();user();dropBtn();}else if(k==='c'||k==='C'){e.preventDefault();user();coin();}else if(k==='p'||k==='P'){e.preventDefault();user();take();}});
document.addEventListener('keyup',e=>{if(DIR[e.key])keys[e.key]=0;});
window.addEventListener('blur',()=>{for(const k in keys)keys[k]=0;});
bind(btn,()=>{user();dropBtn();});bind(coinCtl,()=>{user();coin();});bind(door,()=>{user();take();});
const floorAt=e=>{const m=svg.getScreenCTM?.();if(!m)return null;const q=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse()),a=q.x/C,b=(q.y+92)/S;return[clamp((a+b)/2,...BX),clamp((b-a)/2,...BY)];};
glassHit.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||phase!=='play')return;const p=floorAt(e);if(!p)return;user();tx=p[0];ty=p[1];});
glassHit.addEventListener('click',e=>{const p=floorAt(e);user();if(phase==='idle'&&!begin())return;if(phase!=='play')return;if(p){tx=p[0];ty=p[1];}dropHere=true;hiss(.025,.02,3200,2);});
render(performance.now(),reduced.matches);ui(performance.now());requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
