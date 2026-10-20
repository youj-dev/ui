// @ts-nocheck
/* KESTREL STARLINE · Pinball. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--base-top:#cbcbc7;--base-side:#a4a4a1;--metal:#d4d5d2;--metal-top:#efefec;--metal-side:#b6b7b4;--pf:#efede6;--pf-dk:#dedbd1;--pfl:#bcb8ac;--rubber:#2c2c2b;--skirt:#f8f8f4;--cap:#6a84ff;--cap-top:#9db0ff;--plastic:#fff;--amber:#f0961c;--mag:#de3a85;--teal:#0e9f80;--red:#e5392b;--dot:#ff8a2b;--dmd:#141414;--b0:#fff;--b1:#cdcecf;--b2:#68696b;--sheet:.2}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--base-top:#bebeba;--base-side:#737372;--metal:#b3b3b1;--metal-top:#e0e0dd;--metal-side:#80807f;--pf:#c9c8c3;--pf-dk:#bab8b2;--pfl:#9d9b93;--rubber:#232323;--skirt:#d1d1ce;--cap:#586ed7;--cap-top:#93a4ef;--plastic:#d7d7d7;--amber:#ffad3d;--mag:#ff5ea8;--teal:#2fd6ae;--red:#ff5245;--dot:#ff9440;--dmd:#0f0f0f;--b0:#d7d7d7;--b1:#adadae;--b2:#575759;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
.top.base{fill:var(--base-top)}.side.base{fill:var(--base-side)}.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.rubber{fill:var(--rubber)}.skirt{fill:var(--skirt)}.cap{fill:var(--cap)}.top.cap{fill:var(--cap-top)}
.pf{fill:var(--pf);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.pf-dk{fill:var(--pf-dk);stroke:none}.pfl{fill:none;stroke:var(--pfl);stroke-width:.7;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}
.ins{fill:color-mix(in srgb,var(--ic) 36%,var(--pf));stroke:var(--pfl);stroke-width:.5;vector-effect:non-scaling-stroke;transition:fill .12s}.ins.on{fill:var(--ic);filter:url(#glow)}
.art-blue{fill:var(--accent);opacity:.1}.art-ray{stroke:var(--amber);opacity:.45;stroke-width:.6;vector-effect:non-scaling-stroke;stroke-linecap:round}.gi{fill:var(--off);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke}.live .gi{fill:#ffd79a;filter:url(#glow)}
.amber{--ic:var(--amber)}.mag{--ic:var(--mag)}.teal{--ic:var(--teal)}.blue{--ic:var(--accent)}.red{--ic:var(--red)}
.halo{fill:var(--cap);opacity:0;transition:opacity .25s;pointer-events:none}.live .halo{opacity:.3;filter:url(#bloom)}.bumper.hit .halo{opacity:.95;filter:url(#bloom)}.bumper.hit .cap{fill:var(--cap-top)}.bumper.hit .top.cap{fill:#fff}.star{fill:#fff;opacity:.85}
.band{fill:none;stroke:var(--rubber);stroke-width:1.6;stroke-linejoin:round}.plastic{fill:var(--plastic);fill-opacity:.4}
.lamp{fill:var(--amber);opacity:.18;transition:opacity .1s}.live .lamp{opacity:.4}.sling.hit .lamp{opacity:1;filter:url(#glow)}
.tgt-face{fill:var(--mag);opacity:.4;transition:opacity .15s}.tgt.on .tgt-face{opacity:1;filter:url(#glow)}
.flip-rub{fill:var(--accent);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.flip-side{fill:color-mix(in srgb,var(--accent) 55%,#000);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.flip-bat{fill:var(--skirt)}
.rail-u{fill:none;stroke:var(--line);stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}.rail{fill:none;stroke:var(--metal-top);stroke-width:1;stroke-linecap:round;stroke-linejoin:round}
.ramp{fill:var(--plastic);fill-opacity:.3;stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke;stroke-linejoin:round}.ramp.on{fill:var(--accent);fill-opacity:.35}
.sheet{fill:url(#sheet);pointer-events:none;stroke:none}
.dmd{fill:var(--dmd);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.dmd-t{fill:var(--dot);font:700 4.4px ui-monospace,monospace;letter-spacing:.35px;text-anchor:middle}.dmd-s{font-size:2.2px;letter-spacing:.3px;font-weight:600}.dmd-glow{opacity:.5;filter:url(#bloom)}
.tl{fill:var(--glass);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.tl-light{fill:var(--amber);opacity:.07;filter:url(#bloom)}.live .tl-light{opacity:.2}
.ray{stroke:var(--amber);stroke-width:.65;stroke-linecap:round;vector-effect:non-scaling-stroke}.orbit{fill:none;stroke:var(--accent);stroke-width:.7;vector-effect:non-scaling-stroke}.tl-star{fill:var(--ink)}
.stripe{fill:var(--accent);stroke:none}.stripe2{fill:var(--amber);stroke:none}.side-brand{fill:var(--ink);font:700 8px ui-monospace,monospace;letter-spacing:3px;text-anchor:middle;opacity:.85}
.lit{fill:var(--off)}.btn-on .lit{fill:var(--amber);filter:url(#glow)}.coin{fill:var(--red);filter:url(#glow)}.flip-btn{fill:var(--accent)}
.ball-s{fill:var(--shadow);opacity:.3;filter:url(#soft)}.ball-h{fill:#fff;opacity:.9}
.zone{fill:transparent;cursor:pointer}
.shake{animation:shake .18s linear}@keyframes shake{25%{transform:translate(1.4px,-.5px)}75%{transform:translate(-1.4px,.5px)}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}.stage-floor{filter:none!important;opacity:1!important}.stage-contact{fill:#000;opacity:.5;filter:url(#bloom);transform:none}}`

const defs = `<radialGradient id="chrome" cx=".42" cy=".38" r=".62" fx=".34" fy=".28"><stop offset="0" style="stop-color:var(--b0)"/><stop offset=".45" style="stop-color:var(--b1)"/><stop offset="1" style="stop-color:var(--b2)"/></radialGradient>
<linearGradient id="sheet" x1="0" y1="0" x2="1" y2="1"><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset=".4" stop-color="#fff" style="stop-opacity:var(--sheet)"/><stop offset=".48" stop-color="#fff" stop-opacity="0"/><stop offset=".62" stop-color="#fff" stop-opacity="0"/><stop offset=".66" stop-color="#fff" style="stop-opacity:var(--sheet)"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/></linearGradient>
<pattern id="dots" width=".7" height=".7" patternUnits="userSpaceOnUse"><circle cx=".35" cy=".35" r=".29" fill="#fff"/></pattern>
<mask id="dmdMask"><rect x="20" y="50" width="31" height="12" fill="url(#dots)"/></mask>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* KESTREL STARLINE pinball. World: x lower-right (toward the player), y lower-left, z up; 1 unit = 1 cm.
Playfield coordinates: p up the field from the flippers' end (x = 132 − p), q across from the player's left (y = 67 − q).
Part                         x       y      z      w     d      h
leg levellers (4)        1/133    1/64      0    r2.2     –    1.6
legs + brackets (4)      1/133    1/64    1.6      6     6   58–72
cabinet (pitched 6.5°)       0       0  60–76    140    71     44
backbox                      0       0    117     24    71     68   translite, speakers, DMD
far rail + back strip        0       0 104–120   140     4      –
inner walls                 26       4 98–117    106    63      6
playfield (pitched)         26       4  98–111   106    63      0   inserts, lanes, arch
shooter lane wall           48    10.6     98     85    .8      3
arch guide           26–58     4–67     111    32     63      3
inlane guides (2)        96–115  11–67     99     19    16    1.2
slingshots (2)          98–108  19–59     99     10    13    3.7   posts, rubber, lit plastic
flippers (2)               116  28.5/49.5  99    9      3    2.2
pop bumpers (3)          62/74   29–49.5  103    8.6   8.6   4.9
stand-up targets (3)     68–86     12    104    4.4    .8   3.6
top lane posts (4)       38–45   27–51   111    1.6   1.6     3
ramp + wireform          31–106   15–58  100–113  75    43   12   plastic climb, wire return
plunger rod + knob       122–150   7.5    100     28   r2.2     –
glass                     26       4  104–117   106    63      –
lockdown bar             132.5   −.6    104    7.5   72.2   2.2
coin door                  140   21–50  62–91     0    29     29
start button               140     63     99    1.1  r2.1     –
flipper button             134     71   95.7   r1.9   1.5     –
Ball r = 1.6. Physics runs on the playfield plane in (p, q); the ramp is a scripted 3D path. */
// Isometric engine: affine face planes, solids, round parts, grille and fit.
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: oriented planes, rounded world polygons, small parts.
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`;
function rpath(pts,r=3){const p=pts.map(q=>P(...q)),n=p.length;let d='';for(let i=0;i<n;i++){const b=p[i],cut=a=>{const L=Math.hypot(a[0]-b[0],a[1]-b[1])||1,k=Math.min(r,L/2)/L;return[b[0]+(a[0]-b[0])*k,b[1]+(a[1]-b[1])*k];};d+=(i?'L':'M')+cut(p[(i+n-1)%n])+'Q'+b+' '+cut(p[(i+1)%n]);}return d+'Z';}
const facePath=(pts,cls='',r=3,parent=root)=>el('path',{d:rpath(pts,r),class:'face '+cls},parent);
function pin(g,x,y,r=.75){circle(g,x,y,r,'face top');line(g,x-r*.5,y+r*.35,x+r*.5,y-r*.35);}
const adopt=(g,n)=>{g.appendChild(n.g||n);return n;};
const star=(cx,cy,r1,r2,n=5)=>{let d='';for(let i=0;i<n*2;i++){const a=i*Math.PI/n-Math.PI/2,r=i%2?r2:r1;d+=(i?'L':'M')+(cx+Math.cos(a)*r).toFixed(2)+','+(cy+Math.sin(a)*r).toFixed(2);}return d+'Z';};
// Geometry of the pitched cabinet and its playfield.
const defs=svg.querySelector('defs');
const K=Math.tan(6.5*Math.PI/180),ZT=x=>104+(140-x)*K,ZB=x=>ZT(x)-44,ZP=x=>ZT(x)-6;
const W=(p,q,h=0)=>{const x=132-p;return[x,67-q,ZP(x)+h];};
const LOC=(p,q)=>[q,106-p];
// Assembly: shadow, legs, far rail, backbox, interior (playfield, toys, ramp, glass), near walls, front.
facePath([[2,4,0],[142,4,0],[142,75,0],[2,75,0]],'shadow stage-floor',6).setAttribute('style','filter:url(#bloom);opacity:.13');facePath([[2,4,0],[142,4,0],[142,75,0],[2,75,0]],'stage-contact',6);
for(const[x,y]of[[1,1],[1,64],[133,1],[133,64]]){const zb=ZB(x+3);cylinder(x+3,y+3,0,2.2,1.6,'z','base');box(x,y,1.6,6,6,zb-1.6,.8,'metal');box(x-.7,y-.7,zb-10,7.4,7.4,7,.9,'metal');const lb=group(FRONT(x-.7,y+6.75,zb-3.4));pin(lb,1.8,2,.6);pin(lb,5.6,2,.6);}
facePath([[0,0,ZT(0)],[140,0,ZT(140)],[140,4,ZT(140)],[0,4,ZT(0)]],'top metal',.4);
facePath([[22,4,ZT(22)],[26,4,ZT(26)],[26,67,ZT(26)],[22,67,ZT(22)]],'top',.3);
box(0,0,117,24,71,68,2);
const BB=group(SIDE(24.05,71,185));
rect(BB,2.5,2.5,66,42,1.6,'face base');rect(BB,4,4,63,39,1,'tl');
const tlLight=rect(BB,6,6,59,35,3,'tl-light');
for(let i=0;i<16;i++){const a=i/16*Math.PI*2,r1=i%2?8:14;line(BB,50+Math.cos(a)*3,16+Math.sin(a)*3,50+Math.cos(a)*r1,16+Math.sin(a)*r1*.8,'ray');}
circle(BB,50,16,2.3,'face top');el('ellipse',{cx:34,cy:23,rx:27,ry:7,transform:'rotate(-9 34 23)',class:'orbit'},BB);
circle(BB,18,20,5.6,'face top');el('path',{d:'M13.2,22.6 A5.6,5.6 0 0 0 23.6,19.4 A6.4,6.4 0 0 1 13.2,22.6Z',class:'face recess'},BB);el('ellipse',{cx:18,cy:20,rx:9,ry:2,transform:'rotate(-14 18 20)',class:'detail'},BB);
for(const[u,v,r]of[[8,9,1.1],[30,8,.8],[63,30,1],[40,13,.6],[60,40,.7],[9,34,.8]])el('path',{d:star(u,v,r,r*.35,4),class:'tl-star'},BB);
text(BB,35.5,36.4,'STARLINE','label brand center');text(BB,35.5,40.6,'KESTREL AMUSEMENT CO.','etch micro center');
rect(BB,2.5,46,66,19.5,1.6,'face base');
for(const u of[11,60]){circle(BB,u,55.7,6.1,'face recess');for(const r of[1.5,3,4.6])circle(BB,u,55.7,r,'detail');circle(BB,u,55.7,.7,'face top');}
rect(BB,19.4,49.4,32.2,12.7,1,'face recess');rect(BB,20.6,50.6,29.8,10.3,.6,'dmd');
const dmdGlow=el('g',{class:'dmd-glow'},BB),dmdDots=el('g',{mask:'url(#dmdMask)'},BB);
const dS=[text(dmdGlow,35.5,54.2,'','dmd-t dmd-s'),text(dmdDots,35.5,54.2,'','dmd-t dmd-s')],dB=[text(dmdGlow,35.5,59.6,'','dmd-t'),text(dmdDots,35.5,59.6,'','dmd-t')];
for(const p of[[4,4],[67,4],[4,63.5],[67,63.5]])pin(BB,...p,.6);
const BN=group(FRONT(0,71.05,185));rect(BN,1.6,47,20.8,2.6,.4,'stripe');rect(BN,1.6,50.8,20.8,.7,.2,'stripe2');pin(BN,3,64,.6);pin(BN,21,64,.6);
const BT=group(TOP(0,0,185));slits(BT,4,22,16,28,9,false);
// Interior: far and back inner walls, then the playfield plane with its art and inserts.
facePath([[26,4,ZP(26)],[132,4,ZP(132)],[132,4,ZT(132)],[26,4,ZT(26)]],'base',.3);
facePath([[26,4,ZP(26)],[26,67,ZP(26)],[26,67,ZT(26)],[26,4,ZT(26)]],'side base',.3);
const PF=group(plane(W(106,0),[0,-1,0],[1,0,-K]));
rect(PF,0,0,63,106,0,'pf');
el('path',{d:'M0,0 H63 V31.5 A31.5,31.5 0 0 0 0,31.5 Z',class:'pf-dk'},PF);
rect(PF,12,10,32,10,1.5,'pf-dk');circle(PF,28,40,17,'art-blue');for(let i=0;i<20;i++){const a=i/20*Math.PI*2;line(PF,28+Math.cos(a)*7,60+Math.sin(a)*7,28+Math.cos(a)*(i%2?11:15),60+Math.sin(a)*(i%2?11:15),'art-ray');}
for(let i=0;i<11;i++){const a=Math.PI*(1.06+i*.088);circle(PF,31.5+Math.cos(a)*28.6,31.5+Math.sin(a)*28.6,.75,'gi');}for(const[u,v]of[[11,72],[17,79],[45,72],[39,79]])circle(PF,u,v,.75,'gi');
line(PF,56,22,56,106,'pfl');circle(PF,28,40,15,'pfl').setAttribute('stroke-dasharray','1.2 1.6');circle(PF,28,40,10.5,'pfl');
el('path',{d:star(28,60,6,2.6),class:'pfl'},PF);
for(let i=0;i<5;i++){line(PF,59.5,100-i*14,59.5,94-i*14,'pfl');}
el('path',{d:'M57.5,62 L59.5,58 L61.5,62',class:'pfl'},PF);el('path',{d:'M57.5,56 L59.5,52 L61.5,56',class:'pfl'},PF);
for(const u of[16,24,32,40])line(PF,u,12.5,u,19,'pfl');
el('path',{d:'M5,80 L9,84 M9,72 L13,76 M47,84 L51,80 M43,76 L47,72',class:'pfl'},PF);
text(PF,28,83.6,'STARLINE','etch center');
const INS=[];
function insert(p,q,kind,col,lab){const[u,v]=LOC(p,q);let n;
if(kind==='dot')n=circle(PF,u,v,1.9,'ins '+col);
else if(kind==='arrow')n=el('path',{d:`M${u},${v-3.2}L${u+2.4},${v+1.8}L${u},${v+.7}L${u-2.4},${v+1.8}Z`,class:'ins '+col},PF);
else n=rect(PF,u-1.1,v-2,2.2,4,.6,'ins '+col);
if(lab)text(PF,u,v+(kind==='dot'?4.6:4.8),lab,'etch micro center');INS.push(n);return n;}
const laneIns=[20,28,36].map(q=>insert(82,q,'dot','amber'));
const rampIns=[insert(39,10,'arrow','blue','RAMP'),insert(33,10.6,'arrow','blue')];
const tgtIns=[50,56,62].map(p=>insert(p,50.4,'bar','mag'));
const multIns=[[28,'2×'],[35,'3×'],[42,'4×']].map(([p,l])=>insert(p,28,'dot','teal',l));
const saveIns=insert(9.6,28,'arrow','red');
const plungeIns=insert(30,59.5,'arrow','amber');
// Shooter lane wall, arch guide and inlane wire guides (static, under the toys).
const laneWall=[[48,11.4,ZP(48)],[133,11.4,ZP(133)],[133,11.4,ZP(133)+3],[48,11.4,ZP(48)+3]];
const plungerG=el('g',{});
facePath(laneWall,'',.3);facePath([[48,10.6,ZP(48)+3],[133,10.6,ZP(133)+3],[133,11.4,ZP(133)+3],[48,11.4,ZP(48)+3]],'top',.2);
const arc=[];for(let i=0;i<=24;i++){const f=i/24*Math.PI;arc.push([74.5+31.5*Math.sin(f),31.5+31.5*Math.cos(f)]);}
facePath([...arc.map(a=>W(...a,3)),...arc.slice().reverse().map(a=>W(...a,0))],'metal',.2);wire(arc.map(a=>W(...a,3)),'rail');
for(const g of[[[36,0],[17,15.8]],[[36,56],[17,40.2]]]){const pts=g.map(a=>W(...a,1.3));wire(pts,'rail-u');wire(pts,'rail');for(const a of g)cylinder(...W(...a),.6,1.8,'z','metal');}
// Toys layer: flippers first, then bumpers, slingshots, targets and lane posts sorted far to near; the ball slots in by depth.
const toysG=el('g',{}),toys=[],depth=(p,q)=>199-p-q;
const FL=[{pp:15,pq:17.5,dir:1},{pp:15,pq:38.5,dir:-1}];
const FPATH='M0,-1.5 L9,-.85 A.85,.85 0 0 1 9,.85 L0,1.5 A1.5,1.5 0 0 1 0,-1.5Z',FBAT='M0,-.9 L8.6,-.4 A.4,.4 0 0 1 8.6,.4 L0,.9 A.9,.9 0 0 1 0,-.9Z';
for(const f of FL){Object.assign(f,{len:9,rest:-.5,up:.48,ang:-.5,w:0,held:false});
f.s=el('g',{},toysG);el('path',{d:FPATH,class:'flip-side'},f.s);f.t=el('g',{},toysG);el('path',{d:FPATH,class:'flip-rub'},f.t);el('path',{d:FBAT,class:'flip-bat'},f.t);circle(f.t,0,0,.55,'face metal');}
const BUMP=[{p:70,q:18.5},{p:70,q:37.5},{p:58,q:28}];
for(const b of BUMP){const[x,y,z]=W(b.p,b.q),g=el('g',{class:'bumper'}),h=P(x,y,z+4.6);
el('ellipse',{cx:h[0],cy:h[1],rx:8,ry:5.5,class:'halo'},g);
adopt(g,cylinder(x,y,z,4.6,.9,'z','rubber'));adopt(g,cylinder(x,y,z+.9,3.1,2.5,'z','skirt'));const cap=adopt(g,cylinder(x,y,z+3.4,4.3,1.5,'z','cap'));
circle(cap.face,0,0,3,'detail');el('path',{d:star(0,0,2.1,.9),class:'star'},cap.face);b.g=g;b.cool=0;toys.push({n:g,d:depth(b.p,b.q)});}
const SL=[{A:[34,8.2],B:[24,21],C:[24,16.3]},{A:[34,47.8],B:[24,35],C:[24,39.7]}];
for(const s of SL){const g=el('g',{class:'sling'}),dp=s.B[0]-s.A[0],dq=s.B[1]-s.A[1],l=Math.hypot(dp,dq),n=[-dq/l,dp/l];
const cx=(s.A[0]+s.B[0]+s.C[0])/3,cq=(s.A[1]+s.B[1]+s.C[1])/3;if((cx-s.A[0])*n[0]+(cq-s.A[1])*n[1]>0){n[0]*=-1;n[1]*=-1;}s.n=n;
s.band=el('path',{class:'band'},g);for(const v of[s.A,s.B,s.C])adopt(g,cylinder(...W(...v),.75,3.7,'z','metal'));
const tri=[s.A,s.B,s.C].map(v=>W(v[0]+(cx-v[0])*.12,v[1]+(cq-v[1])*.12,3.7));facePath(tri,'plastic',.8,g);
const lc=P(...W(cx,cq,3.7));el('ellipse',{cx:lc[0],cy:lc[1],rx:2,ry:1.2,class:'lamp'},g);s.g=g;s.t=0;toys.push({n:g,d:depth(cx,cq)});}
function band(s,b){const m=[(s.A[0]+s.B[0])/2+s.n[0]*b,(s.A[1]+s.B[1])/2+s.n[1]*b];set(s.band,'d',poly([W(...s.A,1.8),W(...m,1.8),W(...s.B,1.8),W(...s.C,1.8)],true));}
SL.forEach(s=>band(s,0));
const TG=[50,56,62].map(p=>{const x=132-p,g=el('g',{class:'tgt'});adopt(g,box(x-2.2,11.6,ZP(x),4.4,.8,3.6,.4,'skirt'));rect(group(FRONT(x-2.2,12.45,ZP(x)+3.6),g),.7,.6,3,2.3,.5,'tgt-face');toys.push({n:g,d:depth(p,54.6)});return{p,g,on:0};});
for(const q of[16,24,32,40]){const g=el('g',{});adopt(g,cylinder(...W(93.5,q),.8,3,'z','rubber'));adopt(g,cylinder(...W(93.5,q,3),.45,.6,'z','metal'));wire([W(87,q,1.2),W(93.5,q,1.2)],'rail-u',g);wire([W(87,q,1.2),W(93.5,q,1.2)],'rail',g);toys.push({n:g,d:depth(90,q)});}
toys.sort((a,b)=>a.d-b.d);for(const t of toys)toysG.appendChild(t.n);
const ballG=el('g',{}),ballS=el('ellipse',{class:'ball-s'},ballG),ballC=el('circle',{fill:'url(#chrome)',stroke:'var(--line)','stroke-width':.5,'vector-effect':'non-scaling-stroke'},ballG),ballH=el('circle',{class:'ball-h'},ballG);
toysG.appendChild(ballG);
// Ramp: clear plastic climb along the left, wireform return to the right inlane.
const RP=[[46,10,0],[58,9.6,2.6],[72,9.4,6],[86,10.5,9],[96,14,11],[100.5,21,12],[99.5,29,12],[94,35.5,11.6],[82,41,10.6],[66,45.8,9],[50,48.4,6.8],[38,48.4,4.2],[31,47.8,2],[28.5,47.7,.6]];
function cr(pts,steps=8){const out=[];for(let i=0;i<pts.length-1;i++){const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)];for(let s=0;s<steps;s++){const t=s/steps,t2=t*t,t3=t2*t;out.push([0,1,2].map(k=>.5*(2*p1[k]+(p2[k]-p0[k])*t+(2*p0[k]-5*p1[k]+4*p2[k]-p3[k])*t2+(3*p1[k]-p0[k]-3*p2[k]+p3[k])*t3)));}}out.push(pts[pts.length-1]);return out;}
const RS=cr(RP),SPLIT=40,RL=[0];for(let i=1;i<RS.length;i++)RL.push(RL[i-1]+Math.hypot(RS[i][0]-RS[i-1][0],RS[i][1]-RS[i-1][1],RS[i][2]-RS[i-1][2]));
function rampAt(s){const L=s*RL[RL.length-1];let i=1;while(i<RL.length-1&&RL[i]<L)i++;const t=(L-RL[i-1])/(RL[i]-RL[i-1]||1);return[0,1,2].map(k=>RS[i-1][k]+(RS[i][k]-RS[i-1][k])*t);}
const edge=(i,o,h)=>{const a=RS[Math.max(0,i-1)],b=RS[Math.min(RS.length-1,i+1)],dp=b[0]-a[0],dq=b[1]-a[1],l=Math.hypot(dp,dq)||1;return W(RS[i][0]-dq/l*o,RS[i][1]+dp/l*o,RS[i][2]+h);};
const rampG=el('g',{});
for(const i of[24,52,72,88]){const[p,q,h]=RS[i];wire([W(p,q,0),W(p,q,h-.2)],'rail-u',rampG);wire([W(p,q,0),W(p,q,h-.2)],'rail',rampG);ellipse(...W(p,q,.05),1,'z','face metal',rampG);}
const ids=[...Array(SPLIT+1).keys()],rev=ids.slice().reverse();
const rampFloor=el('path',{d:poly([...ids.map(i=>edge(i,3,.2)),...rev.map(i=>edge(i,-3,.2))],true),class:'ramp'},rampG);
const rampWalls=[3,-3].map(o=>el('path',{d:poly([...ids.map(i=>edge(i,o,.2)),...rev.map(i=>edge(i,o,2.8))],true),class:'ramp'},rampG));
for(const o of[3,-3])wire(ids.map(i=>edge(i,o,2.8)),'rail',rampG);
for(const o of[1.1,-1.1]){const pts=RS.slice(SPLIT-1).map((_,j)=>edge(SPLIT-1+j,o,.4));wire(pts,'rail-u',rampG);wire(pts,'rail',rampG);}
const hiG=el('g',{});
facePath([[26,4,ZT(26)-.2],[132,4,ZT(132)-.2],[132,67,ZT(132)-.2],[26,67,ZT(26)-.2]],'sheet',.2);
const zones=[[0,28],[28,56]].map(([a,b])=>el('path',{d:poly([W(-6,a),W(64,a),W(64,b),W(-6,b)],true),class:'zone'}));
// Near walls, front, lockdown bar, side art and controls.
facePath([[22,67,ZT(22)],[140,67,ZT(140)],[140,71,ZT(140)],[22,71,ZT(22)]],'top metal',.3);
facePath([[132,4,ZT(132)],[140,4,ZT(140)],[140,67,ZT(140)],[132,67,ZT(132)]],'top',.3);
facePath([[0,71,ZB(0)],[140,71,ZB(140)],[140,71,ZT(140)],[0,71,ZT(0)]],'',1.2);
rect(group(SIDE(140,71,104)),0,0,71,44,1.2,'face side');
const SA=group(plane([0,71.05,ZT(0)],[1,0,-K],[0,0,-1]));
rect(SA,6,4.5,128,3.6,1.8,'stripe');rect(SA,6,9.6,128,.8,.4,'stripe2');text(SA,72,27,'STARLINE','side-brand');text(SA,72,32.6,'KESTREL AMUSEMENT CO. · MODEL 41','etch center');
for(const u of[4,136])for(const v of[4,40])pin(SA,u,v,.7);
const FF=group(SIDE(140.05,71,104));
rect(FF,21,13,29,29,1.6,'face metal');rect(FF,22.6,14.6,25.8,25.8,1.2,'detail');
for(const u0 of[25.2,37.4]){rect(FF,u0,18,8.4,10.4,1,'face top metal');rect(FF,u0+3.6,19.4,1.2,4.2,.4,'face recess');circle(FF,u0+4.2,25.2,1.35,'coin');}
circle(FF,35.5,35.6,1.7,'face recess');line(FF,35.5,34.7,35.5,36.5);text(FF,35.5,32.2,'25¢ · 1 PLAY','etch micro center');
for(const[u,v]of[[3,40],[68,40],[3,4],[68,4]])pin(FF,u,v,.7);
circle(group(SIDE(140.06,7.5,100)),0,0,3.1,'face metal');
const plunge=button(el('g',{}),{'aria-label':'Plunger (hold Space, release to launch)'});
const start=button(el('g',{class:'control'}),{'aria-label':'Start a new game (N)'});
adopt(start,cylinder(140,63,99,2.2,1.1,'x','base'));const sf=group(SIDE(141.15,63,99),start);circle(sf,0,0,1.5,'lit');circle(sf,0,0,3.8,'focus-ring');circle(sf,0,0,4,'hit');
box(132.5,-.6,104.1,7.5,72.2,2.2,.8,'metal');
const fbtn=button(el('g',{}),{'aria-label':'Left flipper (Z)'});
adopt(fbtn,cylinder(134,71,95.7,1.9,1.5,'y','flip-btn'));const ff=group(FRONT(134,72.5,95.7),fbtn);circle(ff,0,0,3.6,'focus-ring');circle(ff,0,0,4,'hit');
frame([[0,0,0,140,71,ZT(0)],[0,0,117,24,71,68],[140,4,96,10,8,8]],10);
// Game state, physics and sound.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const say=t=>{announcement.textContent=t;},clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
let ac=null,noiseBuf=null;
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
function tone(f,d=.15,v=.02,type='sine',when=0,f2=0){const a=ac;if(!a)return;const t=a.currentTime+when,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.03);}
function hiss(d=.1,v=.015,f=2400,q=.8,when=0){const a=ac;if(!a)return;if(!noiseBuf){noiseBuf=a.createBuffer(1,a.sampleRate,a.sampleRate);const x=noiseBuf.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}const t=a.currentTime+when,s=a.createBufferSource(),b=a.createBiquadFilter(),g=a.createGain();s.buffer=noiseBuf;b.type='bandpass';b.frequency.value=f;b.Q.value=q;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(a.destination);s.start(t,Math.random()*.5,d+.05);}
const R=1.6,G=92,ball={p:11.6,q:59.5,vp:0,vq:0,mode:'play',s:0};
let game=false,over=false,ballNo=1,score=0,hi=0,mult=1,tilt=false,warns=[],pull=0,shown=0,pulling=false,saveUntil=0,msg='',msgT=0,stuck=0,rampT=0,last=performance.now(),dmdKey='',outKey='',chase=0;
const lanes=[0,0,0],segs=[],seg=(a,b,o={})=>{const w={a,b,e:.32,th:.3,...o};segs.push(w);return w;};
seg([-8,0],[74.5,0]);seg([-8,63],[74.5,63]);for(let i=0;i<24;i++)seg(arc[i],arc[i+1],{th:.2});
seg([-8,56],[84,56],{th:.4});seg([84.6,55.2],[87.2,62.8],{oneway:1,th:.2});
seg([36,0],[17,15.8],{th:.4});seg([36,56],[17,40.2],{th:.4});
SL.forEach(s=>{seg(s.A,s.B,{e:.45,kick:105,kmin:22,ev:()=>slingHit(s)});seg(s.A,s.C,{th:.7});seg(s.C,s.B,{th:.7});});
for(const q of[16,24,32,40])seg([87,q],[93.5,q],{th:.8});
TG.forEach((t,i)=>seg([t.p-2.2,54.6],[t.p+2.2,54.6],{th:.3,e:.4,ev:()=>targetHit(i),evmin:14}));
seg([43,6.2],[50,6.2]);seg([43,13.8],[50,13.8]);
const tipW=seg([10,56.4],[10,62.6],{e:.05,th:0});
const fmt=n=>String(n).replace(/\B(?=(\d{3})+(?!\d))/g,' ');
function note(m,ms=900){msg=m;msgT=performance.now()+ms;}
function add(n){if(game&&!tilt)score+=n*mult;}
function serve(){Object.assign(ball,{p:11.6,q:59.5,vp:0,vq:0,mode:'play',s:0});tilt=false;}
function newGame(){audio();game=true;over=false;score=0;ballNo=1;mult=1;tilt=false;warns=[];lanes.fill(0);TG.forEach(t=>{t.on=0;t.g.classList.remove('on');});serve();note('BALL 1',1200);[523,659,784].forEach((f,i)=>tone(f,.12,.015,'triangle',i*.09));say('New game. Ball 1 of 3. Hold Space to pull the plunger.');}
function flip(i,on){const f=FL[i];if(f.held===on)return;f.held=on;if(i===0)set(fbtn,'transform',on?`translate(${C*.9} ${-S*.9})`:'');if(on&&!tilt){audio();tone(85,.06,.02,'square');hiss(.04,.012,1400);}}
function startPull(){audio();if(!pulling){pulling=true;}}
function release(){if(!pulling)return;pulling=false;const near=ball.mode==='play'&&ball.q>56.3&&ball.p<10+R+2.6;
if(near){if(!game){newGame();}ball.vp=165+200*pull;saveUntil=performance.now()+6000;hiss(.12,.02,700,.7);tone(150,.12,.02,'triangle',0,80);note('LAUNCH',600);say(`Launched at ${Math.round(pull*100)} percent.`);}
pull=0;}
function nudge(){audio();if(ball.mode!=='play')return;ball.vq+=(Math.random()-.5)*70;ball.vp+=24;hiss(.08,.02,300,.6);if(!reduced.matches){root.classList.remove('shake');void root.getBBox();root.classList.add('shake');}
const now=performance.now();warns=warns.filter(t=>now-t<5000);warns.push(now);if(warns.length>=3&&game&&!tilt){tilt=true;note('TILT',3000);say('Tilt. Flippers are dead until the ball drains.');}else note(warns.length===2?'DANGER':'NUDGE',700);}
function bumperHit(b){if(b.cool>performance.now())return;b.cool=performance.now()+90;add(100);b.g.classList.add('hit');setTimeout(()=>b.g.classList.remove('hit'),130);tone(470,.08,.016,'square',0,240);hiss(.05,.014,3200);note('+100',400);}
function slingHit(s){add(10);s.g.classList.add('hit');band(s,1.3);s.t=performance.now()+110;tone(300,.05,.014,'square');hiss(.05,.016,2200);}
function targetHit(i){const t=TG[i];add(250);t.on=1;t.g.classList.add('on');tone(880,.07,.014,'triangle');note('+250',500);if(TG.every(x=>x.on)){add(2000);note('TARGETS 2 000',1300);tone(988,.1,.014,'triangle',.08);setTimeout(()=>TG.forEach(x=>{x.on=0;x.g.classList.remove('on');}),700);}}
function laneHit(i){if(!lanes[i]){lanes[i]=1;add(50);tone(1320,.08,.012);}if(lanes.every(Boolean)){add(1000);mult=Math.min(4,mult+1);note(`BONUS ${mult}×`,1200);[784,988,1175].forEach((f,k)=>tone(f,.09,.012,'triangle',k*.07));setTimeout(()=>lanes.fill(0),600);}}
function drain(){if(performance.now()<saveUntil&&game){note('SHOOT AGAIN',1300);serve();tone(660,.1,.014,'triangle');say('Ball saved.');return;}
tone(140,.35,.02,'sine',0,55);if(!game){serve();return;}ballNo++;mult=1;
if(ballNo>3){game=false;over=true;hi=Math.max(hi,score);note('GAME OVER',2600);say(`Game over. Final score ${score}.`);ballNo=3;}else{note('BALL '+ballNo,1300);say(`Ball ${ballNo} of 3.`);}serve();}
function collide(w){const a=w.a,b=w.b,dx=b[0]-a[0],dy=b[1]-a[1],l2=dx*dx+dy*dy||1;let t=((ball.p-a[0])*dx+(ball.q-a[1])*dy)/l2;t=t<0?0:t>1?1:t;
const cx=a[0]+dx*t,cy=a[1]+dy*t,ex=ball.p-cx,ey=ball.q-cy,d=Math.hypot(ex,ey),rr=R+w.th;if(d>=rr||d<1e-6||(w.oneway&&ball.vp>0))return;
const nx=ex/d,ny=ey/d,vn=ball.vp*nx+ball.vq*ny;ball.p=cx+nx*rr;ball.q=cy+ny*rr;
if(vn<0){ball.vp-=(1+w.e)*vn*nx;ball.vq-=(1+w.e)*vn*ny;if(w.kick&&-vn>w.kmin){ball.vp+=nx*w.kick;ball.vq+=ny*w.kick;w.ev();}else if(w.ev&&!w.kick&&-vn>w.evmin)w.ev();}}
function physics(dt){const n=10,h=dt/n;
for(let i=0;i<n;i++){
for(const f of FL){const tgt=f.held&&!tilt?f.up:f.rest,prev=f.ang;f.ang+=Math.sign(tgt-f.ang)*Math.min(Math.abs(tgt-f.ang),(f.held?26:15)*h);f.w=(f.ang-prev)/h;}
ball.vp-=G*h;ball.p+=ball.vp*h;ball.q+=ball.vq*h;
for(const w of segs)collide(w);
for(const b of BUMP){const ex=ball.p-b.p,ey=ball.q-b.q,d=Math.hypot(ex,ey),rr=R+4.4;if(d<rr&&d>1e-6){const nx=ex/d,ny=ey/d,vn=ball.vp*nx+ball.vq*ny;ball.p=b.p+nx*rr;ball.q=b.q+ny*rr;if(vn<0){ball.vp-=1.5*vn*nx;ball.vq-=1.5*vn*ny;}ball.vp+=nx*80;ball.vq+=ny*80;bumperHit(b);}}
for(const f of FL){const dp=Math.sin(f.ang),dq=f.dir*Math.cos(f.ang);let t=((ball.p-f.pp)*dp+(ball.q-f.pq)*dq)/f.len;t=t<0?0:t>1?1:t;
const cp=f.pp+dp*f.len*t,cq=f.pq+dq*f.len*t,ex=ball.p-cp,ey=ball.q-cq,d=Math.hypot(ex,ey),rr=R+1.5-.65*t;if(d>=rr||d<1e-6)continue;
const nx=ex/d,ny=ey/d;ball.p=cp+nx*rr;ball.q=cq+ny*rr;const s=f.len*t,sp=s*f.w*Math.cos(f.ang),sq=-s*f.w*f.dir*Math.sin(f.ang),vn=(ball.vp-sp)*nx+(ball.vq-sq)*ny;
if(vn<0){ball.vp-=1.32*vn*nx;ball.vq-=1.32*vn*ny;}}
const sp=Math.hypot(ball.vp,ball.vq);if(sp>400){ball.vp*=400/sp;ball.vq*=400/sp;}}
ball.vp*=1-.05*dt;ball.vq*=1-.05*dt;}
// Input: keys (hold for flippers and plunger), the flipper button, playfield halves, the plunger knob and the start button.
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();
if(k==='z'||k==='arrowleft'||e.code==='ShiftLeft'){e.preventDefault();flip(0,true);return;}
if(k==='m'||k==='/'||k==='arrowright'||e.code==='ShiftRight'){e.preventDefault();flip(1,true);return;}
if(e.defaultPrevented||e.repeat)return;
if(k===' '){if(e.target.closest&&e.target.closest('button,[role=button]'))return;e.preventDefault();startPull();}
else if(k==='n'){e.preventDefault();newGame();}else if(k==='t'){e.preventDefault();nudge();}});
document.addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(k==='z'||k==='arrowleft'||e.code==='ShiftLeft')flip(0,false);else if(k==='m'||k==='/'||k==='arrowright'||e.code==='ShiftRight')flip(1,false);else if(k===' ')release();});
window.addEventListener('blur',()=>{flip(0,false);flip(1,false);release();});
const hold=(node,on,off)=>{node.addEventListener('pointerdown',e=>{e.preventDefault();on();const up=()=>{off();removeEventListener('pointerup',up);removeEventListener('pointercancel',up);};addEventListener('pointerup',up);addEventListener('pointercancel',up);});};
hold(fbtn,()=>flip(0,true),()=>flip(0,false));zones.forEach((z,i)=>hold(z,()=>flip(i,true),()=>flip(i,false)));hold(plunge,startPull,release);
fbtn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat){flip(0,true);setTimeout(()=>flip(0,false),160);}}});
plunge.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat){startPull();setTimeout(release,550);}}});
bind(start,newGame);
document.querySelectorAll('.hint [data-k]').forEach(b=>b.addEventListener('click',()=>b.dataset.k==='n'?newGame():nudge()));
function drawPlunger(){plunge.textContent='';const out=shown*3.6,tip=10-3.5*shown,[x,y,z]=W(tip,59.5,1.7);
plungerG.textContent='';adopt(plungerG,cylinder(x,y,z,1.05,1.3,'x','rubber'));adopt(plungerG,cylinder(x+1.3,y,z,.45,130.7-x,'x','metal'));
for(let i=0;i<5;i++){const a=x+1.6+i*(130.4-x)/5;wire([[a,y-.9,z-.6],[a+.6,y+.9,z+.6]],'detail',plungerG);}
adopt(plunge,cylinder(140,7.5,100,.55,2.4+out,'x','metal'));const k=adopt(plunge,cylinder(142.4+out,7.5,100,2.1,3.4,'x','rubber'));circle(k.face,0,0,1.1,'detail');circle(k.face,0,0,4,'focus-ring');circle(k.face,0,0,4.4,'hit');}
function lights(now){const live=game&&!tilt;svg.classList.toggle('live',live);start.classList.toggle('btn-on',game||Math.floor(now/450)%2===0);
if(!game&&!reduced.matches){const k=Math.floor(now/140)%INS.length;INS.forEach((n,i)=>n.classList.toggle('on',(i+INS.length-k)%INS.length<3));return;}
laneIns.forEach((n,i)=>n.classList.toggle('on',!!lanes[i]));tgtIns.forEach((n,i)=>n.classList.toggle('on',!!TG[i].on));multIns.forEach((n,i)=>n.classList.toggle('on',mult>=i+2));
const rc=now<rampT;rampIns.forEach((n,i)=>n.classList.toggle('on',rc?Math.floor(now/110+i)%2===0:false));saveIns.classList.toggle('on',now<saveUntil&&Math.floor(now/300)%2===0);plungeIns.classList.toggle('on',ball.q>56.3&&ball.p<14);
rampFloor.classList.toggle('on',rc);rampWalls.forEach(w=>w.classList.toggle('on',rc));}
function placeBall(){let x,y,z;if(ball.mode==='ramp'){const[p,q,h]=rampAt(ball.s);[x,y,z]=W(p,q,h+.25);if(ballG.parentNode!==hiG)hiG.appendChild(ballG);}
else{[x,y,z]=W(ball.p,ball.q);const d=depth(ball.p,ball.q);let ref=null;for(const t of toys)if(t.d>d){ref=t.n;break;}if(ballG.parentNode!==toysG||ballG.nextSibling!==ref)toysG.insertBefore(ballG,ref);}
const c=P(x,y,z+R),s=P(x,y,z),r=R*1.2247;set(ballC,'cx',c[0]);set(ballC,'cy',c[1]);set(ballC,'r',r);set(ballH,'cx',c[0]-r*.35);set(ballH,'cy',c[1]-r*.38);set(ballH,'r',r*.22);
set(ballS,'cx',s[0]+.9);set(ballS,'cy',s[1]+.3);set(ballS,'rx',r*1.05);set(ballS,'ry',r*.55);}
function status(now){const lane=ball.q>56.3&&ball.p<14&&ball.mode==='play',fl=FL.map(f=>f.held).join();
const st=tilt?'TILT · WAIT FOR THE DRAIN':msgT>now?msg:pulling?`PLUNGER ${Math.round(pull*100)}%`:!game?(over?'GAME OVER · PRESS N':'PULL THE PLUNGER'):lane?'BALL IN THE SHOOTER LANE':ball.mode==='ramp'?'ON THE RAMP':'BALL IN PLAY';
const flp=FL[0].held&&FL[1].held?' · BOTH FLIPPERS':FL[0].held?' · LEFT FLIPPER':FL[1].held?' · RIGHT FLIPPER':'';
const r=`${fmt(score)} · ${over&&!game?'GAME OVER':'BALL '+ballNo}${mult>1?' · '+mult+'×':''}`,key=r+st+flp+fl;
if(key!==outKey){readout.textContent=r;stateLabel.textContent=st+flp;outKey=key;}
const ph=Math.floor(now/2200)%2;let big,small;
if(msgT>now){big=msg;small=game?`BALL ${ballNo}   ${mult}×`:'STARLINE';}else if(game){big=fmt(score);small=`BALL ${ballNo}   ${mult}×`;}else{big=ph?'STARLINE':over?fmt(score):'PRESS N';small=ph?'KESTREL AMUSEMENT':`HIGH SCORE ${fmt(hi)}`;}
if(big+small!==dmdKey){dmdKey=big+small;dS.forEach(t=>t.textContent=small);dB.forEach(t=>t.textContent=big);}}
function tick(now){const dt=Math.min(1/30,(now-last)/1000);last=now;
if(pulling)pull=Math.min(1,pull+dt/.9);shown+=(pull-shown)*(pulling?1:Math.min(1,dt*30));if(Math.abs(pull-shown)<.002)shown=pull;
tipW.a[0]=tipW.b[0]=10-3.5*shown;
if(ball.mode==='ramp'){rampT=now+900;ball.s+=dt/1.35;if(ball.s>=1){Object.assign(ball,{mode:'play',p:28.5,q:47.7,vp:-42,vq:-3});}}
else{const prevP=ball.p;physics(dt);
if((prevP<89)!==(ball.p<89)){const i=ball.q>=16&&ball.q<24?0:ball.q>=24&&ball.q<32?1:ball.q>=32&&ball.q<40?2:-1;if(i>=0)laneHit(i);}
if(ball.vp>38&&ball.p>45&&ball.p<50&&ball.q>6.4&&ball.q<13.6){ball.mode='ramp';ball.s=0;add(750);note('RAMP +750',1100);[659,880,1175].forEach((f,k)=>tone(f,.1,.013,'triangle',k*.08));say('Ramp shot.');}
const sp=Math.hypot(ball.vp,ball.vq);if(sp<4&&ball.q<56&&!FL[0].held&&!FL[1].held){stuck+=dt;if(stuck>2.5){ball.vp+=55;ball.vq+=(Math.random()-.5)*40;stuck=0;}}else stuck=0;
if(ball.p<-3||ball.q<-4||ball.q>67||ball.p>112)drain();}
for(const s of SL)if(s.t&&now>s.t){s.t=0;band(s,0);s.g.classList.remove('hit');}
for(const f of FL){const dp=Math.sin(f.ang),dq=f.dir*Math.cos(f.ang),U=[-dp,-dq,K*dp],V=[dq,-dp,-K*dq];set(f.s,'transform',plane(W(f.pp,f.pq,0),U,V));set(f.t,'transform',plane(W(f.pp,f.pq,2.2),U,V));}
drawPlunger();placeBall();lights(now);status(now);requestAnimationFrame(tick);}
drawPlunger();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['n', 't'], draw }
