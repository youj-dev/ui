// @ts-nocheck
/* MAKIRO K–8 · Sushi conveyor. Drawn for this kit on the shared engine, in the manner of the lab files: its stylesheet,
 * defs and script. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--recess:#9d9d99;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--wood:#9a6a42;--wood-top:#b9875a;--wood-side:#7b5232;--steel:#d3d4d0;--steel-top:#ebebe8;--steel-side:#b2b3af;--kick:#3e3d3b;--kick-side:#2e2d2c;--hinoki:#dcc196;--hinoki-top:#efdfbf;--hinoki-side:#c4a679;--belt:#3a3a39;--seam:#5c5c5a;--plw:#dad7cd;--plw-top:#f8f6f0;--plw-in:#fefdf9;--plw-ring:#7f9bd6;--plb:#2f5fbf;--plb-top:#4a7bd8;--plb-in:#e4ecfa;--plg:#c4922f;--plg-top:#e2b955;--plg-in:#f9eecb;--plg-ring:#c4922f;--plr:#c2412f;--plr-top:#dc5b45;--plr-in:#f8e2dc;--rice:#fbf9f2;--rice-w:#e6e1d3;--salmon:#f59466;--salmon-w:#de7248;--stripe:#ffdcc8;--tuna:#d9414c;--tuna-w:#b52f3a;--egg:#f6cf55;--egg-w:#deaf33;--nori:#37443b;--nori-w:#232b25;--ebi:#fde9dc;--ebi-w:#f2b08d;--ebi-s:#ef7a4f;--tail:#e2532f;--cuke:#76b55c;--ikura:#f26a2c;--roof:#55565b;--roof-top:#6c6d72;--roof-side:#45464b;--noren:#2f4c7e;--mark:#f4f0e4;--room:#2e2620;--cup:#7f9572;--cup-top:#9cb08e;--tea:#b4bf62;--stick:#b07a4a;--gari:#f3b9b4;--soy:#3d2219;--soy-top:#5a3426;--lantern:#d8452f;--lantern-top:#e86a52;--glow:#ffc56b;--screen:#1c1d1e;--scr:#8ea6ff;--rubber:#2e2e2d;--rubber-top:#474745;--lit:.16;--halo:0}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--recess:#6e6e6c;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--wood:#815836;--wood-top:#ad7e54;--wood-side:#553720;--steel:#b2b2b0;--steel-top:#dcdcd9;--steel-side:#7d7d7c;--kick:#2a2a29;--kick-side:#1d1d1c;--hinoki:#b9a27e;--hinoki-top:#e0d1b3;--hinoki-side:#8a7454;--belt:#363635;--seam:#585856;--plw:#b7b5af;--plw-top:#e8e6e1;--plw-in:#eeede9;--plw-ring:#7691c8;--plb:#264fa1;--plb-top:#4573ca;--plb-in:#d5ddea;--plg:#a57a26;--plg-top:#d3ad4f;--plg-in:#e9dfbe;--plg-ring:#b7882b;--plr:#a33526;--plr-top:#ce5540;--plr-in:#e8d3ce;--rice:#ebe9e2;--rice-w:#c1beb5;--salmon:#e58a5f;--salmon-w:#bb5f3b;--stripe:#efcebb;--tuna:#cb3c47;--tuna-w:#98262f;--egg:#e6c24f;--egg-w:#bb9329;--nori:#333f37;--nori-w:#1d221e;--ebi:#eddace;--ebi-w:#cc9476;--ebi-s:#e07249;--tail:#d34d2b;--cuke:#6ea956;--ikura:#e26328;--roof:#47474a;--roof-top:#65666a;--roof-side:#2e2f31;--noren:#263f69;--mark:#cdcac3;--room:#241f1b;--cup:#6a7d5f;--cup-top:#92a484;--tea:#a8b35b;--stick:#a47245;--gari:#e3aca7;--soy:#2c1812;--soy-top:#512e22;--lantern:#e0533a;--lantern-top:#f07a5e;--glow:#ffc56b;--screen:#161717;--scr:#9fb3ff;--rubber:#252524;--rubber-top:#424240;--line:#444443;--lit:.55;--halo:.6}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.micro{font-size:2.3px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.brand{fill:#3a2a1c;font:600 3px Georgia,'Times New Roman',serif;letter-spacing:.9px;text-anchor:middle;stroke:none}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
.band{stroke-width:.7;vector-effect:non-scaling-stroke;stroke-linejoin:round}.edge{fill:none;stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.steel{fill:var(--steel)}.top.steel{fill:var(--steel-top)}.side.steel{fill:var(--steel-side)}.hinoki{fill:var(--hinoki)}.top.hinoki{fill:var(--hinoki-top)}.side.hinoki{fill:var(--hinoki-side)}.roof{fill:var(--roof)}.top.roof{fill:var(--roof-top)}.side.roof{fill:var(--roof-side)}.cup{fill:var(--cup)}.top.cup{fill:var(--cup-top)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}
.belt{fill:var(--belt)}.seams{fill:none;stroke:var(--seam);stroke-width:.75;vector-effect:non-scaling-stroke;stroke-linecap:round}.slat{fill:none;stroke:var(--wood-side);stroke-width:.7;vector-effect:non-scaling-stroke}.tile{fill:none;stroke:var(--roof-side);stroke-width:.6;vector-effect:non-scaling-stroke}.under{fill:url(#under);stroke:none;pointer-events:none}.hi{fill:none;stroke:#fff;stroke-width:.8;stroke-linecap:round;opacity:.65;vector-effect:non-scaling-stroke;pointer-events:none}
.plw{--p:var(--plw);--pt:var(--plw-top);--pi:var(--plw-in);--pg:var(--plw-ring)}.plb{--p:var(--plb);--pt:var(--plb-top);--pi:var(--plb-in);--pg:var(--plb-top)}.plg{--p:var(--plg);--pt:var(--plg-top);--pi:var(--plg-in);--pg:var(--plg-ring)}.plr{--p:var(--plr);--pt:var(--plr-top);--pi:var(--plr-in);--pg:var(--plr-top)}
.rim{fill:var(--p)}.dish{fill:var(--pt)}.well{fill:var(--pi);stroke:var(--pg);stroke-width:.55;vector-effect:non-scaling-stroke}.gloss{fill:none;stroke:#fff;stroke-width:.9;stroke-linecap:round;opacity:.5;vector-effect:non-scaling-stroke}.plate{cursor:pointer}.s{stroke-width:.6}
.stripe{fill:none;stroke:var(--stripe);stroke-width:.85;stroke-linecap:round;vector-effect:non-scaling-stroke}.ebs{fill:none;stroke:var(--ebi-s);stroke-width:1.05;stroke-linecap:round;vector-effect:non-scaling-stroke}.sheen{fill:none;stroke:#fff;stroke-width:.7;stroke-linecap:round;opacity:.45;vector-effect:non-scaling-stroke}.roe{fill:#fff;opacity:.75;stroke:none}
.noren{fill:var(--noren);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.mark{fill:var(--mark);stroke:none}.room{fill:var(--room)}.room-lit{fill:var(--glow);opacity:var(--lit);stroke:none}
.lantern{fill:var(--lantern)}.top.lantern{fill:var(--lantern-top)}.rib{fill:none;stroke:#7d2618;stroke-width:.4;opacity:.55;vector-effect:non-scaling-stroke}.lantern-halo{fill:var(--glow);opacity:var(--halo);filter:url(#bloom);pointer-events:none}
.screen{fill:var(--screen)}.scr{fill:var(--scr);font:600 2.9px ui-monospace,monospace;letter-spacing:.25px;stroke:none}.scr.s{font-size:1.8px;font-weight:400;letter-spacing:.2px}.scr.b{font-size:4.1px;letter-spacing:.1px}.scr.m{font-size:2.3px;letter-spacing:.1px}.scr-bar{fill:var(--scr)}.halo{fill:var(--scr);opacity:.14;filter:url(#bloom)}.lamp{fill:var(--off);stroke:none}.lamp.g{fill:var(--ok);filter:url(#glow)}.lamp.a{fill:var(--warn);filter:url(#glow)}
.price{font:600 2px ui-monospace,monospace;fill:var(--ink);text-anchor:middle;stroke:none}.acrylic{fill:#fff;fill-opacity:.55;stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<linearGradient id="under" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* MAKIRO K–8 conveyor sushi counter. World: x lower-right (the belt's front run); y lower-left (front faces +y); z up.
1 unit ≈ 1.5 cm.
Part                          x      y      z      w      d      h
counter body (stadium)      −66.5  −36.5    0    133     73     30   ends r 36.5 round x ±30; toe kick r 33 × 3.6; slats
diner's counter (hinoki)    −36     36    27.2     72     16    2.8   corners r 4: order screen, tea, chopsticks, your stacks
                                                                      of plates (x 9 and 27)
belt (crescent slats)         r 10–33 round the island, top 28 (2 below the rim); seams every 6.4; loop 255
island                        r 10, top 30: the price board, soy and ginger
kitchen hutch               −24    −57      0     48     20     54   window 31–44 under a noren, sign board, roof to 61, lantern
plates                        r 9 on a foot r 7, 1.9 high: white $2, blue $3, gold $4, red $5
Motion: the belt runs at 16 units/s times its speed; the plates ride it. A plate taken flies to your stack; a fresh one
slides out of the kitchen window onto the back run. Plates are drawn once and re-posed; nothing is added after the first
frame. */
const svg=document.getElementById('machine'),draw=document.getElementById('drawing');let root=draw;
const{P,set,FRONT,SIDE,el,group,rect,circle,line,text,box}=kit(()=>root);
const{cos,sin,PI,max,min,round,hypot,atan2}=Math,C30=Math.sqrt(3)/2,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>max(a,min(b,v)),ease=t=>t*t*(3-2*t),into=g=>root=g;
const H=30,RB=21.5,RI=10,RO=33,RM=36.5,ZT=30,ZB=28,A=PI*RB,LOOP=4*H+2*A,PR=9,PH=1.9,GAP=26,V0=16,SEAT=H,DROP=3*H+A,REACH=70,NS=40;
// Plan shapes and their projections: a stadium round the belt's ends, a rounded rectangle, world points to paths.
const xy=p=>P(...p).map(f2).join(','),pd=(pts,close=true)=>'M'+pts.map(xy).join('L')+(close?'Z':''),at=(o,z)=>o.map(([x,y])=>[x,y,z]);
function stad(r,n=24){const o=[];for(let i=0;i<=n;i++){const a=-PI/2+PI*i/n;o.push([H+r*cos(a),r*sin(a)]);}for(let i=0;i<=n;i++){const a=PI/2+PI*i/n;o.push([-H+r*cos(a),r*sin(a)]);}return o;}
function rrect(x0,y0,x1,y1,r,n=4){const o=[];for(const[cx,cy,a0]of[[x1-r,y0+r,-PI/2],[x1-r,y1-r,0],[x0+r,y1-r,PI/2],[x0+r,y0+r,PI]])for(let i=0;i<=n;i++){const a=a0+PI/2*i/n;o.push([cx+r*cos(a),cy+r*sin(a)]);}return o;}
// The walls of an upright prism on a plan outline (z0…z1) that face the viewer, shaded by bearing from the front tone
// to the side tone in bands, under one outline. inner: the outline's inside faces (a trough's far wall).
function walls(o,z0,z1,m,inner,g=root){const n=o.length,s=inner?-1:1,nrm=i=>{const a=o[i],b=o[(i+1)%n];return[(b[1]-a[1])*s,(a[0]-b[0])*s];},vis=i=>{const[nx,ny]=nrm(i);return nx+ny>1e-6;};
let i0=0;while(i0<n&&vis(i0))i0++;const runs=[];let run=null;
for(let j=1;j<=n;j++){const i=(i0+j)%n;if(!vis(i)){run=null;continue;}const a=o[i],b=o[(i+1)%n],[nx,ny]=nrm(i),t=round(clamp(atan2(ny,nx)/(PI/2))*8)/8;
if(!run){run={pts:[a,b],bands:[{t,pts:[a,b]}]};runs.push(run);}else{run.pts.push(b);const B=run.bands[run.bands.length-1];if(B.t===t)B.pts.push(b);else run.bands.push({t,pts:[a,b]});}}
for(const r of runs){for(const B of r.bands){const c=B.t>=1?`var(--${m})`:B.t<=0?`var(--${m}-side)`:`color-mix(in srgb,var(--${m}) ${round(B.t*100)}%,var(--${m}-side))`;el('path',{d:pd([...at(B.pts,z1),...at(B.pts,z0).reverse()]),class:'band',style:`fill:${c};stroke:${c}`},g);}
el('path',{d:pd([...at(r.pts,z1),...at(r.pts,z0).reverse()]),class:'edge'},g);}}
// Small round and rounded parts, in screen space round a point: an upright disc or cup (its side and top), a soft block
// (its walls as one hull, and its top).
const ex=r=>r*1.2247,ey=r=>r*.7071;
function cup(g,r0,r1,z0,z1,cls,tcls){const a0=f2(ex(r0)),b0=f2(ey(r0)),a1=f2(ex(r1)),b1=f2(ey(r1)),y0=f2(-z0),y1=f2(-z1);
el('path',{d:`M${-a1},${y1}A${a1},${b1} 0 0 0 ${a1},${y1}L${a0},${y0}A${a0},${b0} 0 0 1 ${-a0},${y0}Z`,class:cls},g);return el('ellipse',{cx:0,cy:y1,rx:a1,ry:b1,class:tcls},g);}
function hull(q){q=q.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];
for(const p of q){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}
for(const p of q.reverse()){while(up.length>1&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p);}return lo.slice(0,-1).concat(up.slice(0,-1));}
function lump(g,o,z0,z1,wall,top){el('path',{d:'M'+hull([...o.map(p=>P(p[0],p[1],z0)),...o.map(p=>P(p[0],p[1],z1))]).map(p=>p.map(f2).join(',')).join('L')+'Z',class:'face s',style:`fill:var(--${wall})`},g);return el('path',{d:pd(at(o,z1)),class:'face s',style:`fill:var(--${top})`},g);}
const rr=(cx,cy,w,d,r)=>rrect(cx-w/2,cy-d/2,cx+w/2,cy+d/2,r,3);
// The belt's centre line: the front run (+x) from s 0, round the right end, back along the far run, round the left end.
function loop(s,r=RB){s=((s%LOOP)+LOOP)%LOOP;if(s<2*H)return[-H+s,r];s-=2*H;if(s<A){const a=PI/2-s/RB;return[H+r*cos(a),r*sin(a)];}s-=A;if(s<2*H)return[H-s,-r];s-=2*H;const a=-PI/2-s/RB;return[-H+r*cos(a),r*sin(a)];}
const cdist=(a,b)=>{const d=(((a-b)%LOOP)+LOOP)%LOOP;return min(d,LOOP-d);};
// Sushi, very simply: nigiri (rice under a slab of fish), maki (nori round rice and a filling), gunkan (nori round roe).
function nigiri(g,cx,cy,fish,wall,deco){const z=PH;lump(g,rr(cx,cy,8.2,4,1.6),z,z+2.5,'rice-w','rice');lump(g,rr(cx+.2,cy,9.2,4.7,1.9),z+2.5,z+3.5,wall,fish);const t=z+3.5,q=(u,v)=>xy([cx+u,cy+v,t]);
if(deco==='stripes')el('path',{d:[-2.6,-.2,2.2].map(u=>`M${q(u-.9,-1.6)}L${q(u+.9,1.6)}`).join(''),class:'stripe'},g);
if(deco==='sheen')el('path',{d:`M${q(-3,-1)}L${q(1.6,-1)}`,class:'sheen'},g);
if(deco==='band'){el('path',{d:pd([[cx-1.2,cy-2.4,t+.05],[cx+1.2,cy-2.4,t+.05],[cx+1.2,cy+2.4,t+.05],[cx-1.2,cy+2.4,t+.05]]),class:'face s',style:'fill:var(--nori)'},g);el('path',{d:pd([[cx-1.2,cy+2.4,t],[cx+1.2,cy+2.4,t],[cx+1.2,cy+2.05,z+.2],[cx-1.2,cy+2.05,z+.2]]),class:'face s',style:'fill:var(--nori-w)'},g);}
if(deco==='ebi'){el('path',{d:[-2.7,-.6,1.5].map(u=>`M${q(u,-2)}L${q(u+.5,2)}`).join(''),class:'ebs'},g);const e=cx+4.6;el('path',{d:pd([[e,cy,t-.6],[e+2.6,cy-2.3,t+.6],[e+3.1,cy+.2,t+.9],[e+2.4,cy+2.4,t+.5]]),class:'face s',style:'fill:var(--tail)'},g);}}
function roll(g,cx,cy,r,h,top,fill){const p=P(cx,cy,0),c=group(`translate(${f2(p[0])} ${f2(p[1])})`,g);cup(c,r,r,PH,PH+h,'face s nori-w','face s rice-top');set(c.lastChild,'style',`fill:var(--${top})`);set(c.firstChild,'style','fill:var(--nori-w)');
if(fill==='cuke')el('ellipse',{cx:0,cy:f2(-PH-h),rx:f2(ex(1.15)),ry:f2(ey(1.15)),style:'fill:var(--cuke)',class:'face s'},c);
if(fill==='roe')el('path',{d:[[-1.2,-.5],[.9,-.9],[.1,.7],[1.5,.6],[-1.4,.9]].map(([u,v])=>{const x=(u-v)*.866,y=(u+v)*.5-PH-h-.35;return`M${f2(x-.32)},${f2(y)}a.32,.32 0 1 0 .64,0a.32,.32 0 1 0 -.64,0`;}).join(''),class:'roe'},c);}
const KIND=[{n:'SALMON',p:'plb',$:3},{n:'TUNA',p:'plg',$:4},{n:'TAMAGO',p:'plw',$:2},{n:'CUCUMBER ROLL',p:'plw',$:2},{n:'SALMON ROE',p:'plr',$:5},{n:'SHRIMP',p:'plb',$:3}];
function food(g,k){if(k===0){nigiri(g,0,-2.45,'salmon','salmon-w','stripes');nigiri(g,0,2.45,'salmon','salmon-w','stripes');}
else if(k===1){nigiri(g,0,-2.45,'tuna','tuna-w','sheen');nigiri(g,0,2.45,'tuna','tuna-w','sheen');}
else if(k===2){nigiri(g,0,-2.45,'egg','egg-w','band');nigiri(g,0,2.45,'egg','egg-w','band');}
else if(k===3){for(const[u,v]of[[-2.2,-2.6],[2.9,-1.7],[-.6,2.9]])roll(g,u,v,2.55,3.3,'rice','cuke');}
else if(k===4){for(const[u,v]of[[-1.3,-2.6],[1.3,2.6]])roll(g,u,v,2.9,3.4,'ikura','roe');}
else{nigiri(g,-.8,-2.45,'ebi','ebi-w','ebi');nigiri(g,-.8,2.45,'ebi','ebi-w','ebi');}}
// A plate (its foot on z 0) in its own group: side, dish, well, a gloss on the far rim.
function dish(g){cup(g,7,PR,0,PH,'face rim','face dish');el('ellipse',{cx:0,cy:f2(-PH),rx:f2(ex(6.6)),ry:f2(ey(6.6)),class:'well'},g);
const arc=(a0,a1,r)=>{const p=a=>[f2(ex(r)*cos(a)),f2(ey(r)*sin(a)-PH)];return`M${p(a0).join(',')}A${f2(ex(r))},${f2(ey(r))} 0 0 1 ${p(a1).join(',')}`;};el('path',{d:arc(3.5,4.3,7.9),class:'gloss'},g);}
const tr=(x,y,z)=>`translate(${P(x,y,z).map(f2).join(' ')})`;
function bind(g,fn){g.addEventListener('click',e=>{e.stopPropagation();fn();});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
const ctl=(g,label)=>{for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0','aria-label':label}))set(g,k,v);return g;};
// Layers, back to front: floor, kitchen hutch, counter body and the diner's counter, the belt deck, plates, what's on
// the counter, a plate in the air.
const L={floor:draw,hutch:draw,body:draw},layer=k=>L[k]=el('g',{},draw);
// Floor: the house ground shadow, a flat ellipse traced in floor points (so the dark stage's pool, at 1.5×, fades
// out above the caption), and its contact copy.
into(L.floor);{const fl=(X,Y)=>{const u=X/C30;return[(u+2*Y)/2,(2*Y-u)/2,0];},o=Array.from({length:48},(_,i)=>fl(78*cos(i*PI/24),8+34*sin(i*PI/24)));el('path',{d:pd(o),class:'shadow stage-floor'});el('path',{d:pd(o),class:'stage-contact'});}
// The kitchen hutch behind the counter: its walls, the lit window under a noren, the sign board, the roof, a lantern.
into(L.hutch);
{const X0=-24,Y1=-RM-.5;const E=ZT+24,K=ZT+31;const sd=group(SIDE(24,Y1,E));rect(sd,0,0,20,E,1.4,'face side wood');for(let v=6;v<E;v+=6.2)line(sd,0,v,20,v,'slat');
const fr=group(FRONT(X0,Y1,E));rect(fr,0,0,48,E,1.4,'face wood');for(let u=4;u<48;u+=4)line(fr,u,24,u,E,'slat');
rect(fr,5,10,38,13.4,1,'face room');rect(fr,6,11,36,3.2,.6,'room-lit');rect(fr,6,17.8,36,.9,.3,'room-lit');
rect(fr,4,22.8,40,1.2,.4,'face hinoki');
rect(fr,15,3.6,18,4.8,.9,'face hinoki');rect(fr,15.7,4.3,16.6,3.4,.6,'detail');text(fr,24,7.05,'MAKIRO','brand');
const nr=group(FRONT(X0,Y1+.06,E));for(let i=0;i<3;i++){rect(nr,5.6+i*12.4,10,11.8,5.6,.4,'noren');}circle(nr,24,12.9,1.5,'mark');el('path',{d:'M10.5,12.8c1,-1 2,1 3,0M35,12.8c1,-1 2,1 3,0',class:'detail',style:'stroke:var(--mark);stroke-width:.5'},nr);
const RF=[-27,27],ry=Y1-10,OV=2.5;el('path',{d:pd([[RF[0],ry-10-OV,E],[RF[1],ry-10-OV,E],[RF[1],ry,K],[RF[0],ry,K]]),class:'face roof'});
el('path',{d:pd([[24,Y1-20,E],[24,Y1,E],[24,ry,K-1.6]]),class:'face side wood'});
el('path',{d:pd([[RF[1],Y1+OV,E],[RF[1],ry,K],[RF[1],ry-10-OV,E],[RF[1],ry-10-OV,E-1.6],[RF[1],ry,K-1.6],[RF[1],Y1+OV,E-1.6]]),class:'face side roof'});
el('path',{d:pd([[RF[0],Y1+OV,E],[RF[1],Y1+OV,E],[RF[1],ry,K],[RF[0],ry,K]]),class:'face top roof'});
el('path',{d:Array.from({length:14},(_,i)=>RF[0]+2+i*3.85).map(x=>`M${xy([x,Y1+OV-.4,E+.2])}L${xy([x,ry+.4,K-.2])}`).join(''),class:'tile'});
el('path',{d:pd([[RF[0],Y1+OV,E],[RF[1],Y1+OV,E],[RF[1],Y1+OV,E-1.6],[RF[0],Y1+OV,E-1.6]]),class:'face roof'});
el('path',{d:`M${xy([RF[0],ry,K+.5])}L${xy([RF[1],ry,K+.5])}`,class:'detail',style:'stroke:var(--roof-side);stroke-width:2.2'});
const lp=P(25.5,Y1+1.8,E-7.5);const lg=group(`translate(${f2(lp[0])} ${f2(lp[1])})`);el('path',{d:'M0,-7.2V-5',class:'detail'},lg);el('ellipse',{cx:0,cy:0,rx:9,ry:9,class:'lantern-halo'},lg);
el('ellipse',{cx:0,cy:0,rx:3.1,ry:4.1,class:'face lantern'},lg);el('path',{d:'M-2.9,-1.6Q0,-.9 2.9,-1.6M-3.1,0.2Q0,.9 3.1,.2M-2.8,1.9Q0,2.6 2.8,1.9',class:'rib'},lg);rect(lg,-1.9,-5.2,3.8,1.4,.4,'face rubber');rect(lg,-1.9,3.8,3.8,1.4,.4,'face rubber');}
// The counter body: toe kick, wooden walls with their slats, the shade under the diner's counter, the counter itself.
into(L.body);
walls(stad(RM-3.5),0,3.6,'kick');walls(stad(RM),3.6,ZT,'wood');
{const o=stad(RM),pts=[];let acc=0;for(let i=0;i<o.length;i++){const a=o[i],b=o[(i+1)%o.length],nx=b[1]-a[1],ny=a[0]-b[0],l=hypot(nx,ny);if(!l)continue;const k=(nx+ny)/l;
for(;acc<l;acc+=5.2){if(k>.18){const t=acc/l,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;pts.push(`M${xy([x,y,4.6])}L${xy([x,y,ZT-1])}`);}}acc-=l;}
el('path',{d:pts.join(''),class:'slat'});}
{const us=group(FRONT(-H,RM,ZT-2.8));rect(us,0,0,2*H,8,0,'under');}
{const o=rrect(-H-6,RM-.5,H+6,RM+15.5,4);walls(o,ZT-2.8,ZT,'hinoki');el('path',{d:pd(at(o,ZT)),class:'face top hinoki'});el('path',{d:`M${xy([-H-1,RM+14.9,ZT])}L${xy([H+1,RM+14.9,ZT])}`,class:'hi',style:'opacity:.4'});}
// The deck: the belt in its trough (seams drawn each frame), the trough's far wall and the island's near wall, the rim,
// the island with its price board. The belt is a button: Space or a click takes the plate in front.
into(layer('deck'));
const beltCtl=ctl(el('g',{}),'Conveyor belt: take the plate in front of you (Space)');into(beltCtl);
el('path',{d:pd(at(stad(RO),ZB))+pd(at(stad(RI),ZB)),'fill-rule':'evenodd',class:'face belt'});
const seams=el('path',{class:'seams'});
walls(stad(RO),ZB,ZT,'steel',true,beltCtl);walls(stad(RI),ZB,ZT,'steel',false,beltCtl);
el('path',{d:pd(at(stad(RM),ZT))+pd(at(stad(RO),ZT)),'fill-rule':'evenodd',class:'face top steel'});
el('path',{d:pd(at(stad(RO+1.6),ZT+.05)),class:'focus-ring'});
into(L.deck);el('path',{d:pd(at(stad(RI),ZT)),class:'face top steel'});
el('path',{d:`M${xy([-H,RO+.9,ZT])}L${xy([H,RO+.9,ZT])}`,class:'hi'});
{box(-14.5,1.8,ZT,23,1.6,.9,.4,'steel');const B=group(FRONT(-14,3,ZT+6.6));rect(B,0,0,22,6,1,'acrylic');const PL=['plw','plb','plg','plr'];PL.forEach((c,i)=>{const g=el('g',{class:c},B);circle(g,3.2+i*5.2,2.4,1.55,'face dish');text(B,3.2+i*5.2,5.3,'$'+(i+2),'price');});
const gb=el('g',{});lump(gb,rr(17,-1.5,7,5,1.2),ZT,ZT+2.6,'wood','wood-top');el('path',{d:pd(at(rr(17,-1.5,5.6,3.6,.9),ZT+2.65)),class:'face s',style:'fill:var(--gari)'},gb);
{const c=group(tr(23,3,ZT));cup(c,1.7,1.7,0,4.4,'face s',' face s');set(c.firstChild,'style','fill:var(--soy)');set(c.lastChild,'style','fill:var(--soy-top)');const k=group('translate(0 -4.4)',c);cup(k,.9,.9,0,1.6,'face s','face s');set(k.firstChild,'style','fill:var(--lantern)');set(k.lastChild,'style','fill:var(--lantern-top)');}}
// The plates: a fixed set, two of each kind, drawn once each; the ones in the kitchen are hidden.
layer('plates');const POOL=[0,0,1,1,2,2,3,3,4,4,5,5].map((k,id)=>{const g=el('g',{class:'plate '+KIND[k].p,style:'display:none'},L.plates);dish(g);const f=el('g',{},g);food(f,k);const p={id,k,g,f,st:'kitchen',s:0,x:0,y:0,z:ZB,t:0};g._p=p;return p;});
// What's on the counter: the order screen, tea, chopsticks at your seat, two stacks for your empty plates.
into(layer('counter'));
const TILT=24*PI/180,SX=-35,SY=42,SZ=ZT+3,SH=10,SW=14.5,U=[1,0,0],V=[0,sin(TILT),-cos(TILT)],O=[SX,SY-SH*sin(TILT),SZ+SH*cos(TILT)],N=[0,-cos(TILT)*1.4,-sin(TILT)*1.4];
const plane=(o,u,v)=>`matrix(${[...P(...u),...P(...v),...P(...o)].map(f2).join(' ')})`;
const scr=ctl(el('g',{}),'Order screen: order a fresh plate (O)');into(scr);
{const ft=group(tr(SX+8,SY-2,ZT));cup(ft,3.6,3.6,0,.8,'face rubber','face top rubber');const st=group(tr(SX+8,SY-3.2,ZT));cup(st,1,1,0,5.6,'face rubber','face top rubber');
const add=(a,b)=>a.map((v,i)=>v+b[i]),C1=add(O,[SW,0,0]),C2=add(C1,V.map(v=>v*SH));
el('path',{d:pd([O,C1,add(C1,N),add(O,N)]),class:'face top rubber'});el('path',{d:pd([C1,C2,add(C2,N),add(C1,N)]),class:'face side rubber'});}
const sf=group(plane(O,U,V));rect(sf,0,0,SW,SH,1.2,'face rubber');rect(sf,1.1,1.1,SW-2.2,SH-2.6,.8,'halo');rect(sf,1,1,SW-2,SH-2.4,.7,'face screen');
const H1=text(sf,2,3.2,'PLATES','scr s'),H2=text(sf,2,7,'00','scr b'),H3=text(sf,SW-1.8,6.9,'$0','scr m'),HB=rect(sf,2,7.6,0,.45,.22,'scr-bar'),lampS=circle(sf,SW-2.3,2.5,.55,'lamp');set(H3,'text-anchor','end');
text(sf,SW/2,SH-.35,'ORDER · O','etch micro center').style.fontSize='1.5px';
into(L.counter);
{const c=group(tr(-15.5,45.5,ZT));cup(c,2.6,3.3,0,5.6,'face cup','face top cup');el('ellipse',{cx:0,cy:f2(-5.3),rx:f2(ex(2.7)),ry:f2(ey(2.7)),class:'face',style:'fill:var(--tea)'},c);}
{const g=group(tr(0,0,0));const rest=group(tr(-9,48.3,ZT));cup(rest,1.1,1.1,0,1,'face hinoki','face top hinoki');
for(const dy of[-.9,.9])el('path',{d:`M${xy([-11,48.3+dy,ZT+1.6])}L${xy([1,47.6+dy*.6,ZT+.4])}`,class:'detail',style:'stroke:var(--stick);stroke-width:1.3'},g);}
const stackCtl=ctl(el('g',{},L.counter),'Your plates: ask for the check (C)');{const g=group(tr(9,44,ZT),stackCtl);el('ellipse',{cx:0,cy:0,rx:f2(ex(11)),ry:f2(ey(11)),class:'focus-ring'},g);}
const STACK=[9,27].flatMap(x=>Array.from({length:12},(_,i)=>{const g=el('g',{class:'plw',style:'display:none',transform:tr(x,44,ZT+i*1.75)},stackCtl);dish(g);return g;}));
layer('air');into(draw);
// The frame: the counter, the hutch's ridge and the dark stage's floor pool (its ground shadow at 1.5×), centred.
set(svg,'viewBox','-88 -108.5 176.7 160.5');
// State: belt offset and speed; plates on the belt, being served or in the air; your stack, tally and bill; the progress.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const SPEEDS=[0,.5,1,1.5,2],T_SERVE=1.3,T_FLY=.62;
let sp=2,speed=1,belt=0,last=0,now=0,tally=0,bill=0,stackN=0,msg='',msgT=0,shown='',zkey='',lastScr='',ac=null,orders=0,nextServe=0,paid=0,paidT=-1e9,clearT=-1,mode='free',target=0,done=0,boost=1,orderedT=-1e9;
const say=m=>{announcement.textContent=m;},note=(m,a)=>{msg=m;msgT=now+1800;if(a)say(a);};
function audio(){try{const W=window.AudioContext||window.webkitAudioContext;if(!W)return;if(!ac)ac=new W();if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,v,d,at=0,type='sine'){if(!ac)return;try{const t=ac.currentTime+at,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.05);}catch(_){}}
const clink=()=>{tone(2093,.016,.09);tone(3136,.009,.07,.012);},clack=()=>{tone(1480,.014,.06,0,'triangle');tone(980,.01,.05,.01,'triangle');},bell=()=>{tone(1318,.022,.7);tone(1976,.01,.5,.004);},tick=()=>tone(700,.012,.04,0,'triangle');
// The first plates on the belt, and the kitchen's three.
[[6,2],[0,33],[2,64],[4,96],[8,128],[10,160],[3,192],[1,224]].forEach(([id,s])=>{const p=POOL[id];p.st='belt';p.s=s;p.g.style.display='';});
const onBelt=()=>POOL.filter(p=>p.st==='belt');
function front(){let best=null,d=1e9;for(const p of onBelt()){const e=cdist(p.s+belt,SEAT);if(e<d){d=e;best=p;}}return best&&(reduced.matches||d<=REACH)?best:null;}
function slot(n){const i=min(n,23);return[i<12?9:27,44,ZT+(i%12)*1.75];}
function take(p,auto){if(!auto)audio();if(!p){if(!auto)note(onBelt().length?'NO PLATE IN REACH · WAIT FOR ONE':'BELT EMPTY · O ORDERS A PLATE',onBelt().length?'No plate within reach yet.':'The belt is empty. Press O to order a plate.');return;}
if(p.st!=='belt')return;if(clearT>=0)clearStack();const k=KIND[p.k],n=stackN+POOL.filter(q=>q.st==='fly').length;p.st='fly';p.t=0;p.from=[p.x,p.y,ZB];p.to=slot(n);p.n=n;L.air.appendChild(p.g);clink();
if(!auto)note(`TAKEN · ${k.n} · $${k.$}`,`You took a ${k.p==='plw'?'white':k.p==='plb'?'blue':k.p==='plg'?'gold':'red'} plate of ${k.n.toLowerCase()}, ${k.$} dollars.`);if(reduced.matches)land(p);}
function land(p){const k=KIND[p.k];p.st='kitchen';p.g.style.display='none';p.f.style.opacity='';L.plates.appendChild(p.g);if(p.n<24){const s=STACK[p.n];set(s,'class',k.p);s.style.display='';s.style.opacity='';}stackN++;tally++;bill+=k.$;clack();}
function order(){audio();const free=POOL.some(p=>p.st==='kitchen');if(!free){note('KITCHEN BUSY · ALL PLATES OUT','Every plate is out: take one first.');return;}orders++;orderedT=now;bell();note('ORDER IN · A FRESH PLATE IS COMING','Order in: the kitchen sends a fresh plate out.');if(reduced.matches)serveNow();}
// Serving: a kitchen plate slides out under the noren onto the far run, when it would land in a gap.
function gapAt(s,ahead){return onBelt().every(p=>cdist(p.s+belt+ahead,s)>=GAP);}
function pick(){const free=POOL.filter(p=>p.st==='kitchen');return free.length?free[(tally+orders+free.length)%free.length]:null;}
function serveNow(){const p=pick();if(!p)return;let s=DROP,ok=false;for(let d=0;d<LOOP/2&&!ok;d+=2)for(const c of[DROP+d,DROP-d])if(!ok&&gapAt(c,0)){s=c;ok=true;}
if(!ok){note('BELT FULL · TAKE A PLATE FIRST','The belt is full.');orders=0;return;}p.st='belt';p.s=s-belt;p.g.style.display='';p.g.style.opacity='';orders=max(0,orders-1);note(`FRESH · ${KIND[p.k].n}`,`A fresh plate of ${KIND[p.k].n.toLowerCase()} is on the belt.`);}
function serve(){const p=pick();if(!p)return false;const ahead=speed*V0*T_SERVE*.35;if(!gapAt(DROP,ahead))return false;p.st='serve';p.t=0;p.g.style.display='';p.g.style.opacity='0';orders=max(0,orders-1);return true;}
function check(){audio();for(const p of POOL)if(p.st==='fly')land(p);if(!tally){note('NOTHING TO PAY · SPACE TAKES A PLATE','Nothing to pay yet.');return;}paid=bill;paidT=now;
say(`The check: ${tally} ${tally===1?'plate':'plates'}, ${bill} dollars. Thank you.`);note(`PAID $${bill} · THANK YOU`);tally=0;bill=0;clearT=reduced.matches?-1:now;if(reduced.matches)clearStack();tone(988,.018,.12);tone(1319,.018,.3,.1);}
function clearStack(){stackN=0;STACK.forEach(s=>{s.style.display='none';s.style.opacity='';});clearT=-1;}
function setSpeed(d){audio();const n=clamp(sp+d,0,SPEEDS.length-1);if(n===sp){note(d<0?'BELT STOPPED · → STARTS IT':'BELT AT FULL SPEED');return;}sp=n;tick();
note(sp?`BELT ${SPEEDS[sp].toFixed(1)}× · ${d>0?'FASTER':'SLOWER'}`:'BELT STOPPED · → STARTS IT',sp?`Belt speed ${SPEEDS[sp]} times.`:'The belt is stopped.');}
// Progress: your stack is the order; the diner takes plates as they come round until it holds the progress.
const goal=()=>done?12:mode==='det'?round(target*12):0;
function settle(fresh){const n=goal();if(fresh&&stackN>n)clearStack();while(stackN<n){const k=(stackN*5+1)%6,s=STACK[stackN];set(s,'class',KIND[k].p);s.style.display='';stackN++;tally++;bill+=KIND[k].$;}if(done&&stackN>=12)complete();}
function complete(){if(done===2)return;done=2;tone(784,.02,.4);tone(1175,.016,.8,.12);say('Complete: the order is in, and the check is on its way.');}
function setProgress(p){done=0;if(p==null||!isFinite(p)){mode='free';}else{mode='det';target=clamp(+p);if(round(target*12)<stackN){for(const q of POOL)if(q.st==='fly')land(q);clearStack();}}if(reduced.matches)settle(true);}
function finish(){if(done)return;if(mode!=='det'){mode='det';target=1;}done=1;say('Finishing: the last plates are coming round.');if(reduced.matches)settle();}
window.figure={setProgress,done:finish};
// Input: Space takes the plate in front, a click takes the one clicked; the arrows set the belt speed; O orders; C pays.
bind(beltCtl,()=>take(front()));bind(scr,order);bind(stackCtl,check);
L.plates.addEventListener('click',e=>{const g=e.target.closest&&e.target.closest('.plate');if(g&&g._p){e.stopPropagation();take(g._p);}});
const act={' ':()=>take(front()),arrowleft:()=>setSpeed(-1),arrowright:()=>setSpeed(1),o:order,c:check};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented||e.repeat)return;const k=e.key.toLowerCase();if(act[k]){e.preventDefault();act[k]();}});
// One frame: belt, serving, flights, the stack clearing, the auto diner, then the pose and the readouts.
function frameTick(t){const dt=min(.05,(t-(last||t))/1000),red=reduced.matches;last=now=t;
const behind=mode==='det'?goal()-stackN-POOL.filter(p=>p.st==='fly').length:0;boost=red?1:done?2.5:1+min(1.5,max(0,behind-1)*.5);
const want=SPEEDS[sp]*boost;speed=red?want:speed+(want-speed)*clamp(dt*3.5);if(Math.abs(speed-want)<.02)speed=want;if(!red&&speed>0)belt=(belt+speed*V0*dt)%LOOP;
// The kitchen keeps the belt stocked, and sends what was ordered.
if(!red&&now>=nextServe&&!POOL.some(p=>p.st==='serve')&&(orders>0||onBelt().length<6)){if(serve())nextServe=now+900;else nextServe=now+120;}
if(red&&orders>0)serveNow();
for(const p of POOL){if(p.st==='serve'){p.t+=dt;const u=clamp(p.t/T_SERVE),e=ease(u);p.x=0;p.y=-RM-3+(RM+3-RB)*e;p.z=ZT+1.2-(ZT+1.2-ZB)*clamp((p.y+RO+1.5)/5);p.g.style.opacity=f2(clamp(u/.22));
if(u>=1){p.st='belt';p.s=DROP-belt;p.g.style.opacity='';tick();note(`FRESH · ${KIND[p.k].n}`);}}
if(p.st==='fly'){p.t+=dt;const u=clamp(p.t/T_FLY),e=ease(u);for(let i=0;i<3;i++)p[['x','y','z'][i]]=p.from[i]+(p.to[i]-p.from[i])*e;p.z+=14*sin(PI*u);p.f.style.opacity=f2(1-clamp(u/.45));if(u>=1)land(p);}}
if(clearT>=0){const k=(now-clearT)/450;STACK.forEach(s=>{s.style.opacity=f2(1-clamp(k));});if(k>=1)clearStack();}
// The auto diner (progress): takes the plate passing the seat while the stack is short of the order.
if(mode==='det'&&!red){if(behind>0&&clearT<0){const p=front();if(p&&cdist(p.s+belt,SEAT)<(done?9:4.5))take(p,true);}if(done===1&&stackN>=12&&!POOL.some(p=>p.st==='fly'))complete();}
if(mode==='det'&&red&&(stackN<goal()||done===1))settle();
pose();
ui();requestAnimationFrame(frameTick);}
function pose(){const segs=[];for(let i=0;i<NS;i++){const s=i*LOOP/NS+belt,a=loop(s,RI+.8),b=loop(s,RO-.8);segs.push(`M${xy([a[0],a[1],ZB])}L${xy([b[0],b[1],ZB])}`);}set(seams,'d',segs.join(''));
for(const p of POOL){if(p.st==='belt'){const q=loop(p.s+belt);p.x=q[0];p.y=q[1];p.z=ZB;}if(p.st!=='kitchen')set(p.g,'transform',tr(p.x,p.y,p.z));}
const vis=POOL.filter(p=>p.st==='belt'||p.st==='serve').sort((a,b)=>a.x+a.y-b.x-b.y),key=vis.map(p=>p.id).join();if(key!==zkey){zkey=key;for(const p of vis)L.plates.appendChild(p.g);}}
function ui(){const det=mode==='det',n=goal(),pc=String(stackN).padStart(2,'0'),spd=sp?`${SPEEDS[sp].toFixed(1)}×`:'STOPPED';
const r=det?`PROGRESS ${done===2?100:round((done?1:target)*100)}% · ${pc}/12`:`PLATES ${String(tally).padStart(2,'0')} · $${bill} · BELT ${spd}`;
const st=now<msgT?msg:det?(done===2?'COMPLETE · CHECK, PLEASE':done?`FINISHING · ${max(0,12-stackN)} TO GO`:sp===0?'BELT STOPPED · → STARTS IT':stackN>=n?`WAITING · ${pc}/12 FOR ${round(target*100)}%`:boost>1.2?`CATCHING UP · ${boost.toFixed(1)}×`:`SERVING · TO ${String(n).padStart(2,'0')}/12`):sp===0?'BELT STOPPED · → STARTS IT':onBelt().length?'SERVING · SPACE TAKES THE FRONT PLATE':'BELT EMPTY · O ORDERS A PLATE';
if(r+st!==shown){shown=r+st;readout.textContent=r;stateLabel.textContent=st;}
const paying=now-paidT<2400,ordering=now-orderedT<1400;
const scr=[paying?'CHECK':ordering?'ORDER':det?(done===2?'DONE':`${round((done?1:target)*100)}%`):'PLATES',paying?`$${paid}`:det?`${pc}/12`:String(tally).padStart(2,'0'),paying||det?'':`$${bill}`,f2(det?12*clamp(stackN/12):0),'lamp'+(det&&done===2||paying?' g':ordering?' a':'')].join('|');
if(scr!==lastScr){lastScr=scr;const[a,b,c,w,l]=scr.split('|');H1.textContent=a;H2.textContent=b;H3.textContent=c;set(HB,'width',w);set(lampS,'class',l);}}
pose();ui();requestAnimationFrame(frameTick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
