// @ts-nocheck
/* LOUVEN MT–15 · Reel-to-reel tape recorder. Drawn for this package in the lab figures' form: its stylesheet, defs and
 * script, on the engine's kit. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--recess:#9d9d99;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--screen:#1c1d1e;--alu:#e0e0dd;--alu-top:#f2f2f0;--alu-side:#c6c6c2;--wood:#9a6a42;--wood-top:#b9875a;--wood-side:#7b5232;--chrome:#d9dad8;--chrome-top:#f4f4f2;--chrome-side:#bdbebc;--rubber:#2e2e2d;--rubber-top:#474745;--rubber-side:#282827;--blk:#3a3a39;--blk-top:#4a4a48;--blk-side:#2d2d2c;--reel:#d3d4d1;--reel-top:#eeefec;--reel-side:#b1b2af;--reel-in:#a3a4a1;--pack:#3a2e27;--pack-side:#4d3c31;--pack-hi:#6e5646;--tape:#35281f;--tape-edge:#8a6c55;--key:#e6e6e3;--key-top:#f7f7f5;--key-side:#c9c9c5;--vu:#f2e8c9;--vu-ink:#2b2720;--vu-red:#d2402e;--needle:#1c1c1b;--lamp:#ffd27a;--lcd:#ffb347;--rec-off:#a7716b;--brush:.5;--glow:0}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--recess:#6e6e6c;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--screen:#161717;--alu:#bdbdbb;--alu-top:#e2e2e1;--alu-side:#8b8b8a;--wood:#815836;--wood-top:#ad7e54;--wood-side:#553720;--chrome:#b7b7b6;--chrome-top:#e4e4e2;--chrome-side:#858585;--rubber:#252524;--rubber-top:#424240;--rubber-side:#191919;--blk:#2f2f2f;--blk-top:#454543;--blk-side:#1d1d1c;--reel:#b2b3b1;--reel-top:#dfe0de;--reel-side:#7d7e7c;--reel-in:#6c6d6b;--pack:#2a211c;--pack-side:#3b2e25;--pack-hi:#5c4839;--tape:#2a2019;--tape-edge:#76604d;--key:#c3c3c1;--key-top:#e3e3e1;--key-side:#8a8a88;--vu:#f4d58e;--vu-ink:#2a2116;--vu-red:#c8392a;--needle:#151515;--lamp:#ffcf6e;--lcd:#ffb04a;--rec-off:#6f504c;--brush:.2;--glow:.55;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.recess{fill:var(--recess)}.screen{fill:var(--screen)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.alu{fill:var(--alu)}.top.alu{fill:var(--alu-top)}.side.alu{fill:var(--alu-side)}.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}.side.rubber{fill:var(--rubber-side)}.blk{fill:var(--blk)}.top.blk{fill:var(--blk-top)}.side.blk{fill:var(--blk-side)}.reel{fill:var(--reel)}.top.reel{fill:var(--reel-top)}.side.reel{fill:var(--reel-side)}.key{fill:var(--key)}.top.key{fill:var(--key-top)}.side.key{fill:var(--key-side)}
.reel-in{fill:var(--reel-in)}.pack{fill:var(--pack)}.pack-side{fill:var(--pack-side)}.pack-hi{fill:none;stroke:var(--pack-hi);stroke-width:.9;vector-effect:non-scaling-stroke}.pack-sheen{fill:#fff;opacity:.08;stroke:none}.reel-blur{fill:var(--reel);stroke:none;opacity:0}.chamfer{fill:none;stroke:#fff;stroke-width:.7;vector-effect:non-scaling-stroke;opacity:.45;transform:translate(.5px,.35px)}.ring{fill:none;stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke;opacity:.55}.hi{fill:none;stroke:#fff;stroke-width:.8;stroke-linecap:round;vector-effect:non-scaling-stroke;opacity:.7}
.tape{fill:var(--tape);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;stroke-linejoin:round}.tape-edge{fill:none;stroke:var(--tape-edge);stroke-width:.7;vector-effect:non-scaling-stroke;stroke-linejoin:round;stroke-linecap:round}
.brushed{fill:url(#brushed);stroke:none;pointer-events:none}.brush{stroke:#fff;stroke-width:.32;opacity:var(--brush)}.grain{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.28}
.arm-u{fill:none;stroke:var(--line);stroke-width:3.6;stroke-linecap:round}.arm{fill:none;stroke:var(--chrome);stroke-width:2.6;stroke-linecap:round}
.vu{fill:var(--vu)}.vu-glow{fill:var(--lamp);opacity:var(--glow);filter:url(#bloom)}.vu-ink{fill:var(--vu-ink);font:600 1.7px ui-monospace,monospace;stroke:none}.vu-big{font-size:3px;letter-spacing:.5px}.scale{fill:none;stroke:var(--vu-ink);stroke-width:.3}.zone{fill:none;stroke:var(--vu-red);stroke-width:1.1}.needle{fill:none;stroke:var(--needle);stroke-width:.9;vector-effect:non-scaling-stroke;stroke-linecap:round}
.lcd{fill:var(--lcd);font:700 5px ui-monospace,monospace;letter-spacing:.4px;stroke:none}.lcd-halo{fill:var(--lcd);opacity:calc(.1 + var(--glow) * .5);filter:url(#bloom)}
.glyph{fill:#3a3a39;stroke:none}.glyph.r{fill:var(--fault)}.brand{fill:#2b2b2b;font:600 2.7px Georgia,'Times New Roman',serif;letter-spacing:.7px;stroke:none}.plate{fill:var(--alu-top)}.cap-ink{fill:#d8d8d4;font:2.2px ui-monospace,monospace;letter-spacing:.3px;stroke:none}
.led{fill:var(--off);stroke:none}.led.g{fill:var(--ok)}.led.a{fill:var(--warn)}.led.r{fill:var(--fault)}.led.g,.led.a,.led.r{filter:url(#glow)}
.rec{fill:var(--rec-off);stroke:none;transition:fill .12s}.rec.on{fill:var(--fault);filter:url(#glow)}.rec-halo{fill:var(--fault);opacity:0;filter:url(#bloom);transition:opacity .12s}.rec-halo.on{opacity:.55}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}.control:hover .top.key{fill:var(--top)}
@media(prefers-reduced-motion:reduce){.rec,.rec-halo{transition:none}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<pattern id="brushed" width="9" height="2.4" patternUnits="userSpaceOnUse"><path d="M0,1.2H9" class="brush"/></pattern>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* LOUVEN MT–15, an upright studio deck for ½ in tape on NAB reels. World: x lower-right; y lower-left (front faces +y);
z up. 1 unit ≈ 3.3 mm. The front plate is the plane y 24, drawn in plate coordinates u = x and v = 130 − z.
Part                            x      y      z      w      d      h
feet ×4                    r 2.2 under the cheeks at x −2.5 / 152.5, y 1.5 / 23.5       4
walnut sleeve: cheeks     −5 / 150    −1      4      5     27    126   top board at x −5, y −1, z 130: 160 × 27 × 4
case, brushed front plate        0      0      4    150     24    126
reels (10½ in NAB)        c u 30 / 120, v 20, r 40: back flange y 27.4–28, tape pack 28–32.4 (r 17 to 38), front
                          flange 32.4–33 with three windows, hub adapter and knob to y 36.4
tension rollers           c u 8 / 142, v 79.5, r 4.5, y 26–34, on arms from pivots at u 20 / 130, v 91
guides · tape lifters     c u 27 / 116, v 82, r 2 · c u 40 / 92, v 82, r 1, y 26–33.6 (lifters drop 4 in a wind)
head block cover                46     24     51     46     11     13   erase, record and play heads under it, faces at v 84
capstan · pinch roller    c u 104, v 82.4, r 1.6 · c u 104, v 89.2 (92.6 released), r 5.2, y 25–32
tape (½ in)               y 28.3–32.1: off the supply's left side, around the left roller, under the guides, heads and
                          capstan along v 84, around the right roller and up to the take-up's right side; both reels turn
                          counterclockwise in play, each at the tape speed over its own pack radius
control strip             v 97–124: VU meters at u 5 / 35, tape-time counter at u 62–86, transport keys at u 97–141
                          (rewind, fast-forward, play, stop, record), the record lamp over the record key
Painter order: shadow, feet, left cheek, case and plate, right cheek, top board; arms, reel backs and packs, roller
bodies; tape; roller caps, guides, lifters, capstan, pinch roller, heads and cover; reel fronts; the reels' control. */
const base=document.getElementById('drawing');let root=base;
const{P,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,box,cylinder,screw,frame}=kit(()=>root);
const{cos,sin,PI,sqrt,hypot,atan2,max,min,abs}=Math,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>max(a,min(b,v)),into=g=>root=g;
const TZ=130,Q=(u,v,y)=>P(u,y,TZ-v),q2=p=>`${f2(p[0])},${f2(p[1])}`,shift=(x,y,z)=>{const a=P(x,y,z);return`translate(${f2(a[0])} ${f2(a[1])})`;};
const AX=sqrt(1.5),BX=sqrt(.5),RAD=PI/180;
// Circles in the plate's planes, projected: an ellipse, an arc, a cylinder's silhouette along y (back y0, front y1)
// and the crescent of its side that shows beyond its front face.
const pt=(c,y,a,r)=>Q(c.u+r*cos(a),c.v+r*sin(a),y);
const arc=(r,large,sweep,p)=>`A${f2(r*AX)},${f2(r*BX)} 60 ${large} ${sweep} ${q2(p)}`;
const ell=(c,y,r)=>`M${q2(pt(c,y,0,r))}${arc(r,0,1,pt(c,y,PI,r))}${arc(r,0,1,pt(c,y,2*PI,r))}Z`;
const cyl=(c,y0,y1,r,s=1)=>`M${q2(pt(c,y1,1.25*PI,r))}L${q2(pt(c,y0,1.25*PI,r))}${arc(r,0,1,pt(c,y0,.25*PI,r))}L${q2(pt(c,y1,.25*PI,r))}${arc(r,0,s,pt(c,y1,1.25*PI,r))}Z`;
function windows(c,y,ph){let d='';const w=4.6,r1=20.6,r2=35,i1=Math.asin(w/r1),i2=Math.asin(w/r2);for(let k=0;k<3;k++){const a=ph+k*2*PI/3,b=a+2*PI/3;
d+=`M${q2(pt(c,y,a+i1,r1))}L${q2(pt(c,y,a+i2,r2))}${arc(r2,0,1,pt(c,y,b-i2,r2))}L${q2(pt(c,y,b-i1,r1))}${arc(r1,0,0,pt(c,y,a+i1,r1))}Z`;}return d;}
const sector=(c,y,r0,r1,a0,a1)=>`M${q2(pt(c,y,a0,r0))}L${q2(pt(c,y,a0,r1))}${arc(r1,0,1,pt(c,y,a1,r1))}L${q2(pt(c,y,a1,r0))}${arc(r0,0,0,pt(c,y,a0,r0))}Z`;
function lit(n,c,b){if(n._c!==c){n._c=c;set(n,'class',b+(c?' '+c:''));}}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
// Shadow and feet; the walnut sleeve (cheeks and top board) around the case and its brushed plate.
const sh=P(75,12.5,0);el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]+3),rx:82,ry:28,class:'shadow stage-floor'});el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]+3),rx:82,ry:28,class:'stage-contact'});
for(const[x,y]of[[-2.5,1.5],[-2.5,23.5],[152.5,1.5],[152.5,23.5]])cylinder(x,y,0,2.2,4,'z','rubber');
box(-5,-1,4,5,27,126,2,'wood');box(0,0,4,150,24,126,2,'alu');
const pl=group(FRONT(0,24.02,TZ));rect(pl,0,0,150,126,2,'brushed');line(pl,3,97,147,97);for(const[u,v]of[[3.4,122.6],[146.6,122.6]])screw(pl,u,v);
box(150,-1,4,5,27,126,2,'wood');box(-5,-1,130,160,27,4,2,'wood');
{const g=group(SIDE(155.02,26,130));for(let i=0;i<4;i++){const u=4+i*6.2,w=i%2?1.4:-1.1;el('path',{d:`M${f2(u)},3 C${f2(u+w)},40 ${f2(u-w)},84 ${f2(u+w*.6)},123`,class:'grain'},g);}
const t=group(TOP(-5,-1,134.02));for(let i=0;i<4;i++){const v=4+i*6.4,w=i%2?1.2:-1;el('path',{d:`M4,${f2(v)} C50,${f2(v+w)} 110,${f2(v-w)} 156,${f2(v+w*.5)}`,class:'grain'},t);}}
// Control strip: the VU meters (backlit, red zone from 0 to +3, needles on a pivot under the lip, peak lamps).
const VUDB=[-20,-10,-7,-5,-3,-2,-1,0,1,2,3],vf=x=>(x-.1)/1.3125,vdb=db=>10**(db/20),ang=x=>-48+96*vf(x),PX=13.5,PY=18.4;
const sp=(r,a)=>`${f2(PX+r*sin(a*RAD))},${f2(PY-r*cos(a*RAD))}`;
const VU=[5,35].map((u0,i)=>{const g=group(`translate(${u0} 100)`,pl);rect(g,0,0,27,20,2.2,'face recess');rect(g,1.1,1.1,24.8,17.8,1.6,'vu-glow');rect(g,1.1,1.1,24.8,17.8,1.6,'face vu');
el('path',{d:`M${sp(12,-48)}A12,12 0 0 1 ${sp(12,ang(1))}`,class:'scale'},g);el('path',{d:`M${sp(12.6,ang(1))}A12.6,12.6 0 0 1 ${sp(12.6,48)}`,class:'zone'},g);
for(const db of VUDB){const a=ang(vdb(db)),big=[-20,-10,-5,0,3].includes(db);el('path',{d:`M${sp(12,a)}L${sp(big?14:13.3,a)}`,class:'scale'},g);if(big)text(g,...sp(15.6,a).split(',').map(Number),db>0?`+${db}`:db<0?`−${-db}`:'0','vu-ink center');}
text(g,PX,13.7,'VU','vu-ink vu-big center');text(g,21.2,13.7,i?'R':'L','vu-ink vu-big center');const pk=circle(g,23.4,3.6,.75,'led');
const nd=el('path',{d:`M${PX},${PY}V4.2`,class:'needle'},g);rect(g,1.1,15.6,24.8,3.3,.6,'face blk');circle(g,PX,17.3,1.2,'face chrome');
return{nd,pk,x:0,xv:0,a:NaN,pkT:-1e9};});
// The tape-time counter and the model.
const cg=group('translate(62 100.6)',pl);rect(cg,0,0,24,10.4,1.6,'face recess');rect(cg,1,1,22,8.4,1.2,'face screen');rect(cg,3.5,2.2,17,6,2,'lcd-halo');const ctr=text(cg,12,7.3,'','lcd center');text(cg,12,13.6,'TAPE TIME','etch micro center');
text(pl,74,121.6,'MT–15','etch center');
// Transport keys: rewind, fast-forward, play, stop, record; each a key that latches in, lamps over the moving ones and
// the record lamp, a red jewel, over its key.
const GLYPH={rew:'M3.9,3.4L1.6,5L3.9,6.6ZM6.4,3.4L4.1,5L6.4,6.6Z',ff:'M1.6,3.4L3.9,5L1.6,6.6ZM4.1,3.4L6.4,5L4.1,6.6Z',play:'M2.8,3.2L5.6,5L2.8,6.8Z',stop:'M2.6,3.4H5.4V6.6H2.6Z'};
const KEYS=[['rew','Rewind (Left arrow)'],['ff','Fast-forward (Right arrow)'],['play','Play (Space)'],['stop','Stop (Space)'],['rec','Record (R)']].map(([m,label],i)=>{const u=97+i*9,g=el('g',{class:'control',role:'button',tabindex:'0','aria-label':label});
into(g);box(u,24,13,8,2.6,10,1.2,'key');into(base);const f=group(FRONT(u,26.62,23),g);if(m==='rec')circle(f,4,5,1.6,'glyph r');else el('path',{d:GLYPH[m],class:'glyph'},f);
rect(f,-1.4,-1.4,10.8,12.8,0,'hit');rect(f,-.9,-.9,9.8,11.8,1.6,'focus-ring');return{m,g,led:i<3?circle(pl,u+4,104.4,.8,'led'):null,o:0};});
circle(pl,137,103.2,3.3,'face chrome');circle(pl,137,103.2,2.5,'face recess');const recHalo=circle(pl,137,103.2,5.6,'rec-halo'),recLamp=circle(pl,137,103.2,2,'rec');text(pl,141.4,104.3,'REC','etch micro');
// Behind the tape: the tension arms, the reels' back flanges and tape packs, the roller bodies.
for(const[pu,pv,ru,rv]of[[20,91,8,79.5],[130,91,142,79.5]]){for(const c of['arm-u','arm'])el('path',{d:`M${pu},${pv}L${ru},${rv}`,class:c},pl);circle(pl,pu,pv,3,'face chrome');circle(pl,pu,pv,1.2,'detail');}
const LB=el('g',{}),LR=el('g',{}),LT=el('g',{}),LF=el('g',{}),LV=el('g',{}),LC=el('g',{});
const REELS=[{u:30,v:20},{u:120,v:20}].map(c=>{const b=el('g',{},LB),f=el('g',{},LV);
const r={...c,b,f,bR:el('path',{d:cyl(c,27.4,28,40),class:'face side reel'},b),bF:el('path',{d:ell(c,28,40),class:'face reel-in'},b),pS:el('path',{class:'face pack-side'},b),pF:el('path',{class:'face pack'},b),pH:el('path',{class:'pack-hi'},b),pSh:el('path',{class:'pack-sheen'},b),
fE:el('path',{d:cyl(c,32.4,33,40,0),class:'face side reel'},f),fl:el('path',{class:'face reel','fill-rule':'evenodd'},f),wh:el('path',{class:'chamfer'},f),blur:el('path',{d:ell(c,33.01,34.6)+ell(c,33.01,21),class:'reel-blur','fill-rule':'evenodd'},f),
R:0,Rd:-1,ph:0,phd:NaN,bl:-1};
el('path',{d:ell(c,33.02,37.6)+ell(c,33.02,19.4),class:'ring'},f);el('path',{d:`M${q2(pt(c,33.02,1.08*PI,38.6))}${arc(38.6,0,1,pt(c,33.02,1.42*PI,38.6))}`,class:'hi'},f);
into(f);const ad=group(FRONT(c.u,33.04,TZ-c.v));circle(ad,0,0,12,'face top reel');circle(ad,0,0,9.6,'detail');r.rot=el('g',{class:'spin'},ad);for(let k=0;k<3;k++)rect(group(`rotate(${k*120})`,r.rot),-2.1,-11.4,4.2,3.2,.9,'face reel');
const kn=cylinder(c.u,33,TZ-c.v,4.2,3.4,'y','reel');circle(kn.face,0,0,2.6,'detail');r.kr=el('g',{},kn.face);line(r.kr,0,-3.4,0,3.4);into(base);return r;});
into(LR);for(const[u,v]of[[8,79.5],[142,79.5]]){const k=cylinder(u,26,TZ-v,4.5,8,'y','chrome');LF.appendChild(k.face);circle(k.face,0,0,5.2,'face top chrome');circle(k.face,0,0,3.1,'detail');circle(k.face,0,0,1.3,'face recess');}into(base);
// The tape: a ½ in ribbon along its path, recomputed as the packs grow and shrink and the lifters move.
const tape=el('path',{class:'tape'},LT),tapeEdge=el('path',{class:'tape-edge'},LT);
// Over the tape: roller caps (above), guides, lifters, capstan, pinch roller, heads and their cover with the brand plate.
into(LF);for(const u of[27,116]){const g=cylinder(u,26,TZ-82,2,7.6,'y','chrome');circle(g.face,0,0,.7,'detail');}
const LIFT=[40,92].map(u=>{const g=el('g',{});into(g);cylinder(u,26,TZ-82,1,7.4,'y','chrome');into(LF);return g;});
{const g=cylinder(104,24,TZ-82.4,1.6,9.4,'y','chrome');circle(g.face,0,0,.6,'detail');}
const PR=el('g',{});into(PR);{const g=cylinder(104,25,TZ-89.2,5.2,7,'y','rubber');circle(g.face,0,0,2.3,'face chrome');circle(g.face,0,0,.8,'detail');}into(LF);
for(const u of[53.5,65.5,77.5]){box(u,26,46,7,8,5.2,1.4,'chrome');const g=group(FRONT(u,34.02,51.2));line(g,3.5,.8,3.5,4.4);}
box(46,24,51,46,11,13,2.4,'blk');{const g=group(FRONT(46,35.02,64));rect(g,15,2.6,16,4.6,.8,'face plate');text(g,23,5.95,'LOUVEN','brand center');for(const[u,l]of[[11,'E'],[23,'R'],[35,'P']])text(g,u,11.4,l,'cap-ink center');line(g,2,.9,44,.9,'hi');}
into(base);base.appendChild(LV);base.appendChild(LC);
// The reels are one control: a click threads a fresh reel.
const reelCtl=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Thread a fresh reel (T)'},LC);for(const c of REELS){el('path',{d:ell(c,33,40.5),class:'hit'},reelCtl);el('path',{d:ell(c,33,42.4),class:'focus-ring'},reelCtl);}
frame([[-5,-1,0,160,27,134],[-10,33,60,0,0,0]],10);
// State: tape time t (seconds from the head) on a five-minute reel, a transport with inertia, tape lifters and a pinch
// roller; what's on the tape, the VU needles' ballistics, threading, and the progress a page can drive.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const LEN=300,VLIN=115,HUB=17,RMAX=38,LOOP=20,WIND=18,ROL_R=4.5,VB=84,RL=[8,79.5],RR=[142,79.5],YT=30.2,TW=3.8;
let t=72,v=1,mode='play',lift=0,pinch=1,det=false,target=0,fin=0,thr=null,auto=0,fresh=false,note='',noteT=0,last=0,lastUI=-1,ctrS='',tapeKey='';
let segs=[{a:2,b:LEN-6,k:'mix'}];
const say=m=>{announcement.textContent=m;},flash=(m,a)=>{note=m;noteT=performance.now()+1500;lastUI=-1;if(a)say(a);};
const mmss=s=>{s=max(0,Math.floor(s+1e-6));return`${String(s/60|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
const kindAt=x=>{for(const s of segs)if(x>=s.a&&x<s.b)return s.k;return'blank';};
function paint(a,b,k){if(b<=a)return;const out=[];for(const s of segs){if(s.b<=a||s.a>=b){out.push(s);continue;}if(s.a<a)out.push({a:s.a,b:a,k:s.k});if(s.b>b)out.push({a:b,b:s.b,k:s.k});}
const prev=out.find(s=>s.k===k&&abs(s.b-a)<.05);if(prev)prev.b=b;else out.push({a,b,k});segs=out.sort((x,y)=>x.a-y.a);}
// Program levels, a function of tape time so a section plays back as it was: the mix on a beat, a voice in phrases.
const hs=n=>{const s=sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s);},nz=x=>{const i=Math.floor(x),f=x-i,u=f*f*(3-2*f);return hs(i)*(1-u)+hs(i+1)*u;};
const music=(x,ch)=>{const b=x*1.6,ph=b-Math.floor(b);return-12+6.5*Math.exp(-ph*6)+(Math.floor(b)%4?0:1.6)+2*sin(x*.41+ch*.7)+3.2*(nz(x*3.3+ch*17)-.5)+2.4*(nz(x*.23)-.5);};
const voice=(x,ch)=>nz(x*1.15+5)<.34?-60:-17+12.5*(.5+.5*sin(x*29+6*nz(x*.9)))+(nz(x*.37+9)>.74?4:0)+2.4*(nz(x*7.3+ch*3)-.5)-ch*.5;
const STEADY={mix:-7,take:-6,rec:-4};
// Sound, after a gesture and only with sound on: tape hiss over the heads, an original loop for the mix (rendered
// offline, its pitch following the tape), a murmur for a voice take, and the transport's solenoid.
let ac=null,hissG=null,murG=null,musG=null,mb=null,msrc=null;
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();const sr=ac.sampleRate,nb=ac.createBuffer(1,sr*2,sr),d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
const noise=(type,f,q)=>{const s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;s.loop=true;b.type=type;b.frequency.value=f;b.Q.value=q;g.gain.value=0;s.connect(b);b.connect(g);g.connect(ac.destination);s.start();return g;};
hissG=noise('highpass',3600,.5);murG=noise('bandpass',760,1.6);musG=ac.createGain();musG.gain.value=0;musG.connect(ac.destination);render().then(b=>{mb=b;}).catch(()=>{});}
if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function render(){const O=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!O)return Promise.reject(new Error('offline audio'));const SR=22050,oc=new O(1,SR*LOOP,SR),lp=oc.createBiquadFilter();lp.frequency.value=2800;lp.connect(oc.destination);
const mf=m=>440*2**((m-69)/12),vo=(t0,f,tau,g,type='sine')=>{const o=oc.createOscillator(),a=oc.createGain();o.type=type;o.frequency.value=f;a.gain.setValueAtTime(0,t0);a.gain.linearRampToValueAtTime(g,t0+.01);a.gain.setTargetAtTime(0,t0+.01,tau);o.connect(a);a.connect(lp);o.start(t0);o.stop(t0+.03+tau*6);};
const CH=[[50,57,62,66,69],[47,57,62,64,66],[43,55,59,62,66],[45,57,61,64,67]];
for(let r=0;r<2;r++)CH.forEach((c,k)=>{const t0=(r*4+k)*2.5;vo(t0,mf(c[0]-12),.7,.2,'triangle');vo(t0+1.25,mf(c[0]-5),.45,.12,'triangle');c.slice(1).forEach((m,i)=>{vo(t0+.02+i*.03,mf(m),1.2,.032);vo(t0+1.27+i*.02,mf(m),.5,.018);});for(let q=0;q<4;q++)vo(t0+q*.625+.31,mf(c[1+(q+r+k)%4]+12),.16,.016,'triangle');});
return oc.startRendering();}
function clunk(){if(!ac)return;const T=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(150,T);o.frequency.exponentialRampToValueAtTime(52,T+.12);g.gain.setValueAtTime(.05,T);g.gain.exponentialRampToValueAtTime(.0001,T+.16);o.connect(g);g.connect(ac.destination);o.start(T);o.stop(T+.2);}
function sound(on,kind,rate,mur){if(!ac||!hissG)return;const T=ac.currentTime,mus=on&&kind==='mix'&&mb;hissG.gain.setTargetAtTime(on?.004*min(1,rate):0,T,.05);
if(mus&&!msrc){msrc=ac.createBufferSource();msrc.buffer=mb;msrc.loop=true;msrc.playbackRate.value=max(.02,rate);msrc.connect(musG);msrc.start(T,t%LOOP);}
if(!mus&&msrc){msrc.stop(T+.06);msrc=null;}if(msrc)msrc.playbackRate.setTargetAtTime(max(.02,rate),T,.03);musG.gain.setTargetAtTime(mus?.11:0,T,.04);murG.gain.setTargetAtTime(mur*.06,T,.03);}
// Transport: the keys' actions. A key takes the deck back from a page's progress.
const atEnd=()=>t>=LEN-.05,atHead=()=>t<=.05;
function go(m){if(m!==mode){mode=m;clunk();}auto=0;noteT=0;sync();}
function release(){if(det){det=false;fin=0;}}
function startPlay(){if(atEnd()){flash('END OF TAPE · ← REWINDS','End of tape. The left arrow rewinds it.');return;}go('play');say('Playing.');}
function playStop(){audio();release();if(thr)return;if(mode==='stop')startPlay();else{go('stop');say('Stopped.');}}
function play(){audio();release();if(thr||mode==='play')return;if(mode==='rec'){go('play');flash('PUNCH OUT · PLAYING','Punch out: playing.');return;}startPlay();}
function stop(){audio();release();if(!thr&&mode!=='stop'){go('stop');say('Stopped.');}}
function record(){audio();release();if(thr)return;if(mode==='rec'){go('play');flash('PUNCH OUT · PLAYING','Punch out: playing.');return;}if(atEnd()){flash('END OF TAPE · ← REWINDS','End of tape. The left arrow rewinds it.');return;}
const was=mode;go('rec');flash(was==='play'?'PUNCH IN · RECORDING':'RECORDING · 15 IPS',was==='play'?'Punch in: recording.':'Recording. The record lamp is on.');}
function wind(dir){audio();release();if(thr)return;const m=dir>0?'ff':'rew';if(mode===m){go('stop');say('Stopped.');return;}
if(dir>0?atEnd():atHead()){flash(dir>0?'END OF TAPE':'AT THE HEAD',dir>0?'The tape is at its end.':'The tape is at its head.');return;}go(m);say(dir>0?'Fast-forwarding.':'Rewinding.');
if(reduced.matches){t=dir>0?LEN:0;v=0;mode='stop';sync();say(dir>0?'Wound to the end.':'Rewound to the head.');}}
function thread(){audio();release();if(thr)return;mode='thread';v=0;noteT=0;clunk();thr={t0:performance.now(),sw:false};say('Threading a fresh reel of blank tape.');sync();if(reduced.matches)threaded();}
function swap(){t=0;segs=[];fresh=true;v=0;if(thr)thr.sw=true;}
function threaded(){if(thr&&!thr.sw)swap();thr=null;mode='stop';lift=0;pinch=0;for(const r of REELS){set(r.b,'transform','');set(r.f,'transform','');r.b.style.opacity='';r.f.style.opacity='';}tapeKey='';sync();say('A fresh reel is threaded: blank tape at the head.');}
// The progress API: tape travel is the progress; done winds the last of it through and stops.
function setProgress(p){thr&&threaded();if(p==null||!isFinite(p)){det=false;fin=0;if(mode==='rec'||mode==='stop')go('play');return;}det=true;fin=0;target=clamp(+p)*LEN;go('rec');if(reduced.matches){t=target;v=0;}sync();}
function finish(){thr&&threaded();det=true;fin=1;target=LEN;go('rec');if(reduced.matches){t=LEN;v=0;fin=2;mode='stop';say('Complete.');}sync();}
window.figure={setProgress,done:finish};
function sync(){for(const k of KEYS){k.on=k.m===mode||(k.m==='play'&&mode==='rec');if(k.led)lit(k.led,k.on?{rew:'a',ff:'a',play:'g'}[k.m]:'','led');}const r=mode==='rec';lit(recLamp,r?'on':'','rec');lit(recHalo,r?'on':'','rec-halo');lastUI=-1;}
bind(KEYS[0].g,()=>wind(-1));bind(KEYS[1].g,()=>wind(1));bind(KEYS[2].g,play);bind(KEYS[3].g,stop);bind(KEYS[4].g,record);bind(reelCtl,thread);
const act={' ':playStop,r:record,ArrowRight:()=>wind(1),ArrowLeft:()=>wind(-1),t:thread};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(k===' '&&e.target.closest&&e.target.closest('button,[role=button]'))return;const fn=act[k];if(fn){e.preventDefault();if(!e.repeat)fn();}});
// Drawing from state.
function tan(c1,r1,c2,r2){const dx=c2[0]-c1[0],dy=c2[1]-c1[1],L=hypot(dx,dy),ux=dx/L,uy=dy/L,a=(r1-r2)/L,b=sqrt(max(0,1-a*a)),nx=a*ux-b*uy,ny=a*uy+b*ux;return[[c1[0]+r1*nx,c1[1]+r1*ny],[c2[0]+r2*nx,c2[1]+r2*ny],atan2(ny,nx)];}
function path(R1,R2,l){const[s0,,aL]=tan([30,20],R1,RL,ROL_R),[,t1,aR]=tan(RR,ROL_R,[120,20],R2),pts=[s0];
for(let k=0;k<=8;k++){const a=aL+(PI/2-aL)*k/8;pts.push([RL[0]+ROL_R*cos(a),RL[1]+ROL_R*sin(a)]);}
if(l>.005)pts.push([40,VB+3*l],[92,VB+3*l]);for(let k=0;k<=8;k++){const a=PI/2+(aR-PI/2)*k/8;pts.push([RR[0]+ROL_R*cos(a),RR[1]+ROL_R*sin(a)]);}pts.push(t1);return pts;}
/* The part of a path from share s0 to s1 of its length: the tape as it unthreads and threads. */
function part(pts,s0,s1){if(s0<=0&&s1>=1)return pts;const L=[0];for(let i=1;i<pts.length;i++)L.push(L[i-1]+hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));const T=L[L.length-1],a=s0*T,b=s1*T,out=[];
const at=d=>{let i=1;while(i<L.length-1&&L[i]<d)i++;const k=(d-L[i-1])/((L[i]-L[i-1])||1);return[pts[i-1][0]+(pts[i][0]-pts[i-1][0])*k,pts[i-1][1]+(pts[i][1]-pts[i-1][1])*k];};
if(b-a<.2)return[];out.push(at(a));for(let i=0;i<pts.length;i++)if(L[i]>a&&L[i]<b)out.push(pts[i]);out.push(at(b));return out;}
function drawTape(R1,R2,l,s0,s1){const key=[R1,R2,l,s0,s1].map(x=>x.toFixed(3)).join();if(key===tapeKey)return;tapeKey=key;const pts=part(path(R1,R2,l),s0,s1);
if(!pts.length){set(tape,'d','');set(tapeEdge,'d','');return;}const F=pts.map(p=>q2(Q(p[0],p[1],YT+TW/2))),B=pts.map(p=>q2(Q(p[0],p[1],YT-TW/2))).reverse();set(tape,'d',`M${F.join('L')}L${B.join('L')}Z`);set(tapeEdge,'d',`M${F.join('L')}`);}
function drawReel(r,red){if(abs(r.R-r.Rd)>.004){r.Rd=r.R;const c=r,R=r.R;set(r.pS,'d',cyl(c,28,32.4,R));set(r.pF,'d',ell(c,32.4,R));set(r.pH,'d',ell(c,32.41,max(HUB,R-1.1)));set(r.pSh,'d',R>HUB+2?sector(c,32.42,HUB+.5,R-.4,1.12*PI,1.3*PI):'');}
if(!(abs(r.ph-r.phd)<.0005)){r.phd=r.ph;const w=windows(r,33,r.ph);set(r.fl,'d',ell(r,33,40)+w);set(r.wh,'d',w);const d=f2(r.ph/RAD);set(r.rot,'transform',`rotate(${d})`);set(r.kr,'transform',`rotate(${d})`);}
const bl=red?0:+clamp((abs(r.w)-11)/22).toFixed(2);if(bl!==r.bl){r.bl=bl;r.blur.style.opacity=f2(bl*.62);}}
function ui(now){const xm=(VU[0].x+VU[1].x)/2,db=xm<.08?'−∞':Math.round(20*Math.log10(xm)),dbs=typeof db==='string'?db:db<0?`−${-db}`:db>0?`+${db}`:'0';
const M=thr?'LOAD':det&&fin<2?'REC':{stop:'STOP',play:'PLAY',rec:'REC',ff:'FF',rew:'REW'}[mode]||'STOP',left=`${mmss(Math.ceil(LEN-t-1e-6))} LEFT`,k=kindAt(t);let st;
if(now<noteT)st=note;else if(thr)st='THREADING A FRESH REEL';else if(det)st=fin===2?'COMPLETE · TAPE AT THE END':fin?`FINISHING · ${Math.round(t/LEN*100)}%`:`PROGRESS ${Math.round(t/LEN*100)}% · ${abs(v)>.05?'RECORDING':'REC PAUSE'}`;
else if(mode==='play')st=lift>.05?'CUEING · REELS BRAKING':`PLAYING · 15 IPS · ${k==='mix'?'THE MIX':k==='take'?'YOUR TAKE':'BLANK TAPE'}`;else if(mode==='rec')st=lift>.05?'CUEING · REELS BRAKING':`RECORDING · 15 IPS · ${left}`;
else if(mode==='ff')st=`FAST-FORWARD · ${left}`;else if(mode==='rew')st=auto<0?'REWINDING TO THE HEAD':`REWINDING · ${mmss(t)} FROM THE HEAD`;
else st=atEnd()?(auto>0?'END OF TAPE · REWINDING SOON':'END OF TAPE · ← REWINDS'):atHead()?(fresh?'FRESH REEL · BLANK TAPE':'STOPPED · AT THE HEAD'):`STOPPED · ${left}`;
readout.textContent=`${mmss(t)} · ${dbs} DB · ${M}`;stateLabel.textContent=st;const c=mmss(t);if(c!==ctrS){ctrS=c;ctr.textContent=c;}}
function tick(now){const dt=last?min(.05,(now-last)/1000):0,red=reduced.matches;last=now;
// Threading: the old tape winds off the path, the old reels come off, the fresh ones go on and the leader is threaded.
let s0=0,s1=1;if(thr){const e=red?9:(now-thr.t0)/1000,ease=x=>x*x*(3-2*x);if(e>=.9&&!thr.sw)swap();
const out=e<.5?0:e<.9?ease((e-.5)/.4):e<1.3?1-ease((e-.9)/.4):0;for(const r of REELS){const sl=shift(0,out*30,0),o=f2(1-out*.85);set(r.b,'transform',sl);set(r.f,'transform',sl);r.b.style.opacity=o;r.f.style.opacity=o;}
if(!thr.sw)s0=ease(clamp(e/.5));else s1=ease(clamp((e-1.3)/1));if(e>=2.4)threaded();}
// The transport: a target speed (tape seconds per second) and how fast it gets there; the heads engage at play speed.
const wind_=mode==='ff'||mode==='rew',engage=mode==='play'||mode==='rec';let vt=0;
if(det&&!thr){const e=target-t;vt=abs(e)<.03?0:clamp(e/1.1,-WIND,WIND);if(vt&&abs(vt)<.3)vt=.3*Math.sign(vt);if(abs(vt)>1.5)vt=Math.sign(vt)*min(abs(vt),WIND);}
else if(mode==='ff')vt=min(WIND,sqrt(2*20*max(0,LEN-t))+.4);else if(mode==='rew')vt=-min(WIND,sqrt(2*20*max(0,t))+.4);else if(engage)vt=lift>.02||abs(v)>1.3?0:1;
const windNow=wind_||(det&&abs(vt)>1.5),liftT=windNow||(engage&&abs(v)>1.3)?1:0,pinchT=(engage||det)&&!windNow&&abs(v)<1.3&&lift<.05?1:0;
if(red){v=vt;lift=liftT;pinch=pinchT;}else{const acc=abs(vt)>abs(v)&&vt*v>=0?(abs(vt)>1.5?14:9):(abs(v)>1.5?24:9);v+=clamp(vt-v,-acc*dt,acc*dt);lift+=clamp(liftT-lift,-4*dt,4*dt);pinch+=clamp(pinchT-pinch,-6*dt,6*dt);}
const t0=t;t=clamp(t+v*dt,0,LEN);if(det&&!thr&&abs(target-t)<.03&&abs(v)<.5){t=target;v=0;}const heads=lift<.05&&pinch>.9&&v>.05&&!thr;
if(heads&&mode==='rec')paint(t0,t,'take');
if(t>=LEN&&v>0){v=0;if(det){if(fin===1){fin=2;go('stop');say('Complete: the tape is at its end.');}}else{const was=mode;go('stop');if(was==='play'){auto=now+1400;say('End of tape. Rewinding to the head.');}else say('End of tape.');}}
if(t<=0&&v<0){v=0;if(!det){const back=auto<0;go('stop');if(back){go('play');say('At the head: playing again.');}else say('Rewound to the head.');}}
if(auto>0&&now>auto&&mode==='stop'){if(red){t=0;go('play');}else{go('rew');auto=-1;}}
if(mode!=='stop'||abs(v)>.01)fresh=fresh&&t<.05;
// The packs: tape area moves from the supply to the take-up; each reel turns at the tape's speed over its radius.
const f=red?Math.floor(t/10)*10/LEN:t/LEN,A=RMAX*RMAX-HUB*HUB;REELS[0].R=sqrt(HUB*HUB+(1-f)*A);REELS[1].R=sqrt(HUB*HUB+f*A);
for(const r of REELS){r.w=v*VLIN/r.R;if(!red)r.ph-=r.w*dt;drawReel(r,red);}
drawTape(REELS[0].R,REELS[1].R,lift,s0,s1);
for(let i=0;i<2;i++)set(LIFT[i],'transform',shift(0,0,-4*lift));set(PR,'transform',shift(0,0,-3.4*(1-pinch)));
for(const k of KEYS){const o=k.on?1:0;if(o!==k.o){k.o=o;set(k.g,'transform',o?shift(0,-1.2,0):'');}}
// The needles: a VU ballistic (about 300 ms to the reading, a percent or so over), on the levels of what passes the heads.
const rec=heads&&mode==='rec',k=heads?(rec?'rec':kindAt(t)):'',sv=min(1,v);let mur=0;
VU.forEach((m,ch)=>{const db=!k||k==='blank'?-60:red?STEADY[k]:k==='mix'?music(t,ch):voice(t,ch)+(rec?2.5:0),V=vdb(db)*(red?1:sv);
if(red){m.x=V;m.xv=0;}else{const w=15,z=.8;m.xv+=(w*w*(V-m.x)-2*z*w*m.xv)*dt;m.x+=m.xv*dt;if(m.x<0){m.x=0;m.xv*=-.2;}if(m.x>1.5){m.x=1.5;m.xv*=-.3;}}
const a=ang(m.x);if(!(abs(a-m.a)<.05)){m.a=a;set(m.nd,'transform',`rotate(${f2(a)} ${PX} ${PY})`);}if(!red&&m.x>1.12)m.pkT=now;lit(m.pk,now-m.pkT<160?'r':'','led');if(k&&k!=='mix')mur=max(mur,clamp(V));});
sound(heads,k||'',sv,mur);
if(lastUI<0||now-lastUI>120){lastUI=now;ui(now);}requestAnimationFrame(tick);}
VU.forEach(m=>{m.x=vdb(STEADY.mix);});sync();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
