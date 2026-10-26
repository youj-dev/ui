// @ts-nocheck
/* CORVELLE R–24 · Ferris wheel. Drawn for this kit on the shared engine, in the manner of the lab files: its stylesheet,
 * defs and script. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--base-top:#cbcbc7;--base-side:#a4a4a1;--recess:#9d9d99;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--steel:#efede6;--steel-top:#faf9f5;--steel-side:#d2cfc6;--wood:#9a6a42;--wood-top:#b9875a;--wood-side:#7b5232;--brass:#cfa95d;--kiosk:#f1e7d3;--kiosk-top:#faf4e8;--kiosk-side:#d8ccb3;--trim:#d24a3a;--trim-top:#e2705f;--trim-side:#a8392c;--board:#2c2a27;--board-ink:#f6eedb;--paper:#fbfbf7;--inside:#4a4540;--fringe:#fbf6ea;--fringe-side:#e2dccd;--rider:#3b3a37;--tube:#faf9f5;--c0:#e0533c;--c0-top:#ec7a63;--c0-side:#b4402e;--c1:#efb534;--c1-top:#f6cd68;--c1-side:#c48f24;--c2:#3d6fd4;--c2-top:#6a92e3;--c2-side:#2e55a8;--c3:#2ea36a;--c3-top:#59bd89;--c3-side:#228155;--c4:#ee8530;--c4-top:#f4a766;--c4-side:#c2661f;--c5:#cf4b8c;--c5-top:#e078ab;--c5-side:#a7386e;--bulb-off:#e3dccb;--bulb-dim:#f3d27f;--bulb:#ffbd2e;--bulb-hot:#fff1c4;--halo:#ffb22e;--halo-a:.5;--halo-b:.16;--r0:#ff5a4a;--r1:#ff9f2e;--r2:#ffd93d;--r3:#3fcf78;--r4:#4d8bff;--r5:#bf68ff}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--base-top:#bebeba;--base-side:#737372;--recess:#6e6e6c;--line:#444443;--steel:#c9c8c3;--steel-top:#eae9e5;--steel-side:#93928f;--wood:#815836;--wood-top:#ad7e54;--wood-side:#553720;--brass:#ae8e4d;--kiosk:#cbc3b2;--kiosk-top:#eae4d9;--kiosk-side:#98907e;--trim:#b13d2f;--trim-top:#d36858;--trim-side:#76251c;--board:#232220;--board-ink:#e9dfc8;--paper:#d4d4d1;--inside:#2b2825;--fringe:#d6d1c6;--fringe-side:#a29e93;--rider:#8a857b;--tube:#bdbcb6;--c0:#bd4531;--c0-top:#dd725c;--c0-side:#7e2a1d;--c1:#c9982a;--c1-top:#e6c061;--c1-side:#8a6416;--c2:#325cb2;--c2-top:#6388d4;--c2-side:#1d3a76;--c3:#258958;--c3-top:#53b180;--c3-side:#15593a;--c4:#c96f27;--c4-top:#e49c5f;--c4-side:#884613;--c5:#ae3e75;--c5-top:#d270a0;--c5-side:#75254c;--bulb-off:#6e6656;--bulb-dim:#c9a24e;--bulb:#ffd166;--bulb-hot:#fff6dc;--halo-a:1;--halo-b:.42}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.top.base{fill:var(--base-top)}.side.base{fill:var(--base-side)}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.micro{font-size:2.2px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
.steel{fill:var(--steel)}.top.steel{fill:var(--steel-top)}.side.steel{fill:var(--steel-side)}.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.brass{fill:var(--brass)}.kiosk{fill:var(--kiosk)}.top.kiosk{fill:var(--kiosk-top)}.side.kiosk{fill:var(--kiosk-side)}.trim{fill:var(--trim)}.top.trim{fill:var(--trim-top)}.side.trim{fill:var(--trim-side)}.board{fill:var(--board)}.plate{fill:var(--paper)}.inside{fill:var(--inside)}.inside.car{fill:var(--ks)}.fringe{fill:var(--fringe)}.fringe.side{fill:var(--fringe-side)}.rider{fill:var(--rider);stroke:none}
.k0{--k:var(--c0);--kt:var(--c0-top);--ks:var(--c0-side)}.k1{--k:var(--c1);--kt:var(--c1-top);--ks:var(--c1-side)}.k2{--k:var(--c2);--kt:var(--c2-top);--ks:var(--c2-side)}.k3{--k:var(--c3);--kt:var(--c3-top);--ks:var(--c3-side)}.k4{--k:var(--c4);--kt:var(--c4-top);--ks:var(--c4-side)}.k5{--k:var(--c5);--kt:var(--c5-top);--ks:var(--c5-side)}.car{fill:var(--k)}.top.car{fill:var(--kt)}.side.car{fill:var(--ks)}
.tu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.tb{fill:none;stroke:var(--tube);stroke-linecap:round;stroke-linejoin:round}.lace{fill:none;stroke:var(--line);stroke-width:.55;vector-effect:non-scaling-stroke;stroke-linejoin:round}.plank{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.45}
.serif{font:600 2.2px Georgia,'Times New Roman',serif;letter-spacing:.4px;stroke:none}.small{font-size:2.05px;letter-spacing:.3px}.ink{fill:var(--ink)}.sign-t{fill:var(--board-ink)}.num{fill:var(--ink);font:700 2.5px ui-monospace,monospace;text-anchor:middle;stroke:none}
.bulb{fill:var(--bulb-off);pointer-events:none}.bulb.dim{fill:var(--bulb-dim)}.bulb.on{fill:var(--bulb)}.bulb.hot{fill:var(--bulb-hot)}.bulb.r0{fill:var(--r0)}.bulb.r1{fill:var(--r1)}.bulb.r2{fill:var(--r2)}.bulb.r3{fill:var(--r3)}.bulb.r4{fill:var(--r4)}.bulb.r5{fill:var(--r5)}
.halo{fill:url(#halo);pointer-events:none}.halo.r0{fill:url(#halo0)}.halo.r1{fill:url(#halo1)}.halo.r2{fill:url(#halo2)}.halo.r3{fill:url(#halo3)}.halo.r4{fill:url(#halo4)}.halo.r5{fill:url(#halo5)}.spark{fill:#fff;display:none;pointer-events:none}
@media(prefers-color-scheme:dark){.spark{display:inline}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const glow = (id: string, color: string, a: string, b: string) =>
  `<radialGradient id="${id}"><stop offset="0" style="stop-color:var(${color});stop-opacity:var(${a})"/><stop offset=".42" style="stop-color:var(${color});stop-opacity:var(${b})"/><stop offset="1" style="stop-color:var(${color});stop-opacity:0"/></radialGradient>`
const defs = glow('halo', '--halo', '--halo-a', '--halo-b') + [0, 1, 2, 3, 4, 5].map((i) => glow(`halo${i}`, `--r${i}`, '--halo-a', '--halo-b')).join('')

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* CORVELLE R–24 Ferris wheel. World: x lower-right; y lower-left (front faces +y); z up. 1 unit ≈ 20 cm.
Part                          x      y      z      w      d      h
footings (4)            ±54 · ±21      0      6      6    1.8
A-frames (2)        feet ±54 · ±21 → bearing 0 · ±13 · 87: lattice legs, a tie at z 44, the bearing drum r 3.6
axle                          0  ±10.6     87   r1.9      –      –   from the bearings to the hub
hub                           0     −8     87   r5.6     16      –   a rosette cap on the front, r 5.8
rims (2)              r 52 / 60 in the x–z plane at y ±8, laced between; twelve spokes each to r 60
cars (12)             pins on r 60, 30° apart; each hangs 19.4 below its pin: tub 13.2 × 10.4 × 6.8, hip roof, fringe
rim lights            48 on the front rim at r 61.6, three on each front spoke (r 20 / 31 / 42), one on the front bearing
boarding deck              −15    −10      0     30     20      6   railing at the back, three steps up at the front left,
                                                                    brand plate beside them (cars pass low over the ends)
ticket booth               −24     32      0     14     12     16   window and attendant, striped awning, gable roof to 20,
                                                                    TICKETS board to 25.8 with marquee lights
Motion: the wheel turns clockwise as seen from the front, by A degrees; car k's pin is at −90° + 30°k − A, so car 1
starts at the platform and car 7 at the top. The cars only translate, so they hang level; a swing about the pin answers
the wheel's acceleration. Painter: floor, back frame, back rim, hub, deck, cars (sorted by x + z), front rim and lights,
hub cap, front frame, booth, sparks, the cars' hit areas. */
const svg=document.getElementById('machine'),draw=document.getElementById('drawing');let root=draw;
const{C,S,P,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,box,cylinder}=kit(()=>root);
// Figure helpers: points on the wheel's plane, projected polylines, iso rings (true circles in the x–z plane), tubes,
// a convex hull, controls and a seeded random.
const{cos,sin,PI,abs,min,max,round,floor,exp,hypot,sign}=Math,RAD=PI/180,f2=v=>(+v).toFixed(2),f3=v=>(+v).toFixed(3),clamp=(v,a=0,b=1)=>max(a,min(b,v)),into=g=>root=g,pad2=n=>String(n).padStart(2,'0');
const HZ=87,R=60,RI=52,WY=8,N=12,SP=30;
const W=(r,a,y=0)=>[r*cos(a*RAD),y,HZ+r*sin(a*RAD)],Q=p=>{const q=P(...p);return f2(q[0])+','+f2(q[1]);},pl=(pts,z)=>'M'+pts.map(Q).join('L')+(z?'Z':'');
function ring(r,y){const c=P(0,y,HZ),pt=(u,v)=>f2(c[0]+u)+','+f2(c[1]+v),a=`A${f2(r*1.2247)},${f2(r*.7071)} 60 0 0 `;return`M${pt(r*C,r*S)}${a}${pt(0,-r)}${a}${pt(-r*C,-r*S)}${a}${pt(0,r)}${a}${pt(r*C,r*S)}Z`;}
function tube(d,w,b,parent=root){return[el('path',{d,class:'tu','stroke-width':w},parent),el('path',{d,class:'tb','stroke-width':b},parent)];}
const retube=(t,d)=>{set(t[0],'d',d);set(t[1],'d',d);};
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const p of pts){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(const p of pts.reverse()){while(hi.length>1&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}return'M'+lo.slice(0,-1).concat(hi.slice(0,-1)).map(p=>f2(p[0])+','+f2(p[1])).join('L')+'Z';}
const corners=(x0,x1,y0,y1,z0,z1)=>[x0,x1].flatMap(x=>[y0,y1].flatMap(y=>[z0,z1].map(z=>P(x,y,z))));
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
const ctl=(g,label)=>{for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0','aria-label':label}))set(g,k,v);return g;};
let seed=52;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const L={};for(const k of['floor','backFrame','backWheel','hub','deck','cars','frontWheel','cap','frontFrame','booth','sparks','hits'])L[k]=el('g',{});
// The floor: the house ground shadow, a world ellipse projected (so it frames tight), and the booth's own.
into(L.floor);
const ell=(cx,cy,a,b)=>hull([...Array(48)].map((_,i)=>P(cx+a*cos(i*PI/24),cy+b*sin(i*PI/24),0)));
el('path',{d:ell(0,4,50,28),class:'shadow stage-floor'});el('path',{d:ell(0,4,50,28),class:'stage-contact'});el('path',{d:ell(-16,39,11,9),class:'shadow'});
// The A-frames: lattice legs (laced between two rails), a tie, the bearing drum the axle rests in.
function leg(a,b){const d=[b[0]-a[0],b[1]-a[1],b[2]-a[2]],l=hypot(d[0],d[2]),nx=d[2]/l,nz=-d[0]/l,at=(t,s)=>{const w=(4.6-2.6*t)/2*s;return[a[0]+d[0]*t+nx*w,a[1]+d[1]*t,a[2]+d[2]*t+nz*w];};
el('path',{d:pl([...Array(15)].map((_,i)=>at(i/14,i%2?1:-1))),class:'lace'});for(const s of[-1,1])tube(pl([at(0,s),at(1,s)]),1.7,.85);}
function frameA(y,yf){const top=s=>[s*3,y,HZ-3.2],foot=s=>[s*54,yf,1.8],on=(s,z)=>{const a=foot(s),b=top(s),t=(z-a[2])/(b[2]-a[2]);return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,z];};
for(const s of[-1,1])box(s*54-3,yf-3,0,6,6,1.8,.6,'base');for(const s of[-1,1])leg(foot(s),top(s));tube(pl([on(-1,44),on(1,44)]),1.5,.7);
const b=cylinder(0,y-2.4,HZ,3.6,4.8,'y','steel');circle(b.face,0,0,1.9,'face top steel');}
into(L.backFrame);frameA(-13,-21);
// A rim: the inner and outer rings (static: a ring turned is the same ring), the lacing and spokes (posed as it turns).
function face(y){tube(ring(RI,y),1.2,.5);const lace=el('path',{class:'lace'}),spokes=tube('',1.25,.55);tube(ring(R,y),2.8,1.5);return{y,lace,spokes};}
into(L.backWheel);const FACES=[face(-WY)];
into(L.hub);cylinder(0,-10.6,HZ,1.9,2.6,'y','steel');{const h=cylinder(0,-WY,HZ,5.6,WY*2,'y','base');circle(h.face,0,0,3.8,'detail');}
// The boarding deck: planks, the brand plate, a railing at the back (the cars swing low over the open ends), steps.
into(L.deck);
box(-15,-10,0,30,20,6,1.2,'wood');{const g=group(TOP(-15,-10,6));for(let v=2.5;v<20;v+=2.5)line(g,.6,v,29.4,v,'plank');}
{const g=group(FRONT(-15,10,6));rect(g,13.4,1.3,14.6,3.4,.8,'face brass');text(g,20.7,3.78,'CORVELLE','serif ink center');}
{const pts=[-14,-7,0,7,14].map(x=>[x,-9,6]);for(const p of pts)tube(pl([p,[p[0],p[1],11]]),1,.45);tube(pl(pts.map(p=>[p[0],p[1],11])),1.2,.55);}
for(let i=0;i<3;i++)box(-14,10+i*2.6,0,9,2.6,4.5-i*1.5,.4,'wood');
// The cars: built once around their pin (world origin), then only moved, so they always hang level. Each: the pin
// between the rims, two hangers, a hip roof with a scalloped fringe, posts, an open tub with its riders and number.
const CW=6.6,CD=5.2,CT=-12.6,CB=-19.4,OCC=[2,1,0,1,2,0,1,2,1,0,2,1];
const scallop=(n,w)=>{let d=`M0,0H${w}V.7`;for(let i=n;i>0;i--)d+=`A${f2(w/n/2)},.8 0 0 1 ${f2(w*(i-1)/n)},.7`;return d+'Z';};
const CARS=[...Array(N)].map((_,k)=>{const g=el('g',{class:'k'+k%6},L.cars);into(g);
tube(poly([[0,-WY,0],[0,WY,0]]),2.1,1.1);for(const y of[-4.4,4.4])tube(poly([[0,y,0],[0,y,-4.8]]),1.2,.5);
const post=(x,y)=>tube(poly([[x,y,-6.4],[x,y,CT]]),.9,.4);post(-6.1,-4.7);post(6.1,-4.7);
rect(group(TOP(-CW,-CD,CT)),0,0,CW*2,CD*2,1.4,'face top car');rect(group(TOP(-CW+1,-CD+1,CT)),0,0,CW*2-2,CD*2-2,1,'face inside car');
const riders=[[-2.7,-.4],[2.6,.5]].map(([x,y])=>{const r=el('g',{}),s=P(x,y,CT-.2),h=P(x,y,CT+2.3);el('ellipse',{cx:f2(s[0]),cy:f2(s[1]),rx:2.3,ry:1.4,class:'rider'},r);circle(r,f2(h[0]),f2(h[1]),1.45,'rider');return r;});
rect(group(SIDE(CW,CD,CT)),0,0,CD*2,CT-CB,1.6,'face side car');rect(group(FRONT(-CW,CD,CT)),0,0,CW*2,CT-CB,1.6,'face car');
{const p=group(FRONT(-CW,CD+.03,CT));rect(p,CW-2.3,1.9,4.6,3.4,.7,'face plate');text(p,CW,4.5,String(k+1),'num');}
post(-6.1,4.7);post(6.1,4.7);
el('path',{d:poly([[-7.2,5.8,-5.4],[7.2,5.8,-5.4],[2.6,0,-2.7],[-2.6,0,-2.7]],true),class:'face top car'});el('path',{d:poly([[7.2,5.8,-5.4],[7.2,-5.8,-5.4],[2.6,0,-2.7]],true),class:'face car'});
el('path',{d:scallop(6,14.4),class:'face fringe'},group(FRONT(-7.2,5.8,-5.4)));el('path',{d:scallop(5,11.6),class:'face fringe side'},group(SIDE(7.2,5.8,-5.4)));
into(draw);return{k,g,riders,n:OCC[k],phi:0,om:0,x:0,z:0,hit:null,lab:''};});
const showRiders=c=>c.riders.forEach((r,i)=>set(r,'display',i<c.n?'inline':'none'));CARS.forEach(showRiders);
// The front rim, then its lights: on the rim and on each spoke. Each light is a halo and a bulb.
into(L.frontWheel);FACES.push(face(WY));
const BL=[];
function bulb(kind,n,o,r=1.15){const b={kind,n,h:el('circle',{r:r*3.4,class:'halo'}),c:el('circle',{r,class:'bulb'}),v:-1,cls:null,ph:rnd()*PI*2,w:1.3+rnd()*2.6,sp:2.6+rnd()*5,so:rnd()*9,x:0,y:0,...o};BL.push(b);return b;}
const place=(b,p)=>{b.x=p[0];b.y=p[1];const x=f2(p[0]),y=f2(p[1]);set(b.c,'cx',x);set(b.c,'cy',y);set(b.h,'cx',x);set(b.h,'cy',y);};
const MOVING=[];for(let j=0;j<48;j++)MOVING.push(bulb('rim',j,{a0:-90+7.5*j,r0:R+1.6}));
for(let s=0;s<N;s++)for(let k=0;k<3;k++)MOVING.push(bulb('spoke',s,{a0:-90+SP*s,r0:20+k*11,k}));
// The hub cap: a rosette in the cars' colors that turns with the wheel. In front, the axle and the front frame, with a
// light on the bearing's cap at the wheel's heart.
into(L.cap);const capG=group(FRONT(0,WY+.7,HZ));circle(capG,0,0,5.8,'face top steel');const ros=group('',capG);
for(let i=0;i<12;i++)el('path',{d:'M0,0L-1.2,-4.7A4.85,4.85 0 0 1 1.2,-4.7Z',class:'face car k'+(i%6),transform:`rotate(${i*30})`},ros);
circle(capG,0,0,1.9,'face top steel');
into(L.frontFrame);cylinder(0,WY+.7,HZ,1.9,2.1,'y','steel');frameA(13,21);place(bulb('hub',0,{},.95),P(0,15.5,HZ));
// The ticket booth: plinth, body, window with its attendant, awning, gable roof, TICKETS board with marquee lights.
const BX=-24,BY=32,booth=ctl(L.booth,'Ticket booth: board the next car (B)');into(booth);
box(BX,BY,0,14,12,1.6,.6,'trim');box(BX+.3,BY+.3,1.6,13.4,11.4,14.4,1,'kiosk');
{const f=group(FRONT(BX+.3,BY+11.7,16));rect(f,2,3.4,9.4,6.6,.8,'face inside');circle(f,6.7,6.6,1.55,'rider');el('path',{d:'M4.3,10Q4.5,8 6.7,8Q8.9,8 9.1,10Z',class:'rider'},f);rect(f,1.4,9.6,10.6,1.1,.4,'face trim');
const s=group(SIDE(BX+13.7,BY+11.7,16));rect(s,3.2,2.8,5.2,11.6,.8,'face kiosk');circle(s,7.3,9,.45,'face brass');}
for(let i=0;i<6;i++){const x0=BX+.9+i*2.1,x1=x0+2.1;el('path',{d:poly([[x0,BY+11.7,13.2],[x1,BY+11.7,13.2],[x1,BY+15,11],[x0,BY+15,11]],true),class:i%2?'face fringe':'face trim'});}
el('path',{d:poly([[BX+14.6,BY+12.6,16],[BX+14.6,BY-.6,16],[BX+14.6,BY+6,20]],true),class:'face side kiosk'});
el('path',{d:poly([[BX-.6,BY+12.6,16],[BX+14.6,BY+12.6,16],[BX+14.6,BY+6,20],[BX-.6,BY+6,20]],true),class:'face top trim'});
for(const x of[BX+3,BX+11])tube(poly([[x,BY+6,20],[x,BY+6,20.8]]),.9,.4);
{const g=group(FRONT(BX+.4,BY+6.05,25.8));rect(g,0,0,13.2,5,.8,'face board');text(g,6.6,3.2,'TICKETS','serif sign-t center small');}
{const pts=[];for(let i=0;i<7;i++)pts.push([BX+1.3+i*1.9,25.25]);pts.push([BX+13.1,23.3]);for(let i=0;i<7;i++)pts.push([BX+12.7-i*1.9,21.35]);pts.push([BX+.9,23.3]);
pts.forEach(([x,z],i)=>place(bulb('sign',i,{},.5),P(x,BY+6.15,z)));}
el('path',{d:hull(corners(BX-.6,BX+14.6,BY-.6,BY+15,0,25.8)),class:'focus-ring'});
// Sparks: in the dark a few lights catch and flash a star.
into(L.sparks);const SPARKS=[0,1,2].map(i=>({n:el('path',{d:'M0,-3.6L.5,-.5L3.6,0L.5,.5L0,3.6L-.5,.5L-3.6,0L-.5,-.5Z',class:'spark',opacity:0}),t0:i*.71,cyc:-1,b:null}));
// Hit areas on top, in car order (so Tab goes 1 to 12 however the cars are stacked), and the hub's.
into(L.hits);
const carHull=hull(corners(-7.4,7.4,-6.2,6.2,-20,.6)),carRing=hull(corners(-8.6,8.6,-7.2,7.2,-21,1.6));
for(const c of CARS){c.hit=ctl(el('g',{}),`Car ${c.k+1}: bring it to the platform`);el('path',{d:carHull,class:'hit'},c.hit);el('path',{d:carRing,class:'focus-ring'},c.hit);}
const hubBtn=ctl(el('g',{}),'Wheel hub: start or stop the wheel (Space)');{const h=P(0,WY+.7,HZ);circle(hubBtn,f2(h[0]),f2(h[1]),9,'hit');circle(hubBtn,f2(h[0]),f2(h[1]),10.4,'focus-ring');}
// The frame: every drawn extreme, the cars at every angle, the shadow; fixed, so the miniature never resizes.
{const pts=[];for(let a=0;a<360;a+=3){for(const y of[-WY,WY])pts.push(P(...W(R+2.9,a,y)));const p=W(R,a);for(const q of corners(-8.6,8.6,-WY-1,WY+1,-21,1.6))pts.push([q[0]+P(...p)[0],q[1]+P(...p)[1]]);}
for(const s of[-1,1])for(const y of[-24,24])pts.push(P(s*57,y,0));pts.push(...corners(BX-.6,BX+15,BY-.6,BY+15,0,26.5),...corners(-15,15,-10,18,0,11));
for(let i=0;i<48;i++)pts.push(P(50*cos(i*PI/24),4+28*sin(i*PI/24),0));
const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),pd=8,x0=min(...xs)-pd,y0=min(...ys)-pd,n=v=>String(+v.toFixed(2));set(svg,'viewBox',`${n(x0)} ${n(y0)} ${n(max(...xs)+pd-x0)} ${n(max(...ys)+pd-y0)}`);}
// State: the wheel's angle A (degrees, clockwise from the front) and how it's driven: free (running or coasting to a
// stop), on a trip (taking a car to the platform or the top), holding there, or following a progress.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const RPM=[1,1.5,2,3,4],PATS=['TWINKLE','CHASE','STARBURST','RAINBOW'];
let A=0,drive='free',run=true,si=2,vel=12,spd=12,stepT=0,trip=null,hold=null,prog=null,fin=0,finT=0,pat=0,boardAt=0,note='',noteT=0,last=0,vS=12,vSP=12,posed=NaN,sorted=[],outKey='';
const say=m=>{announcement.textContent=m;},notice=m=>{note=m;noteT=performance.now()+1600;};
const off=(a,b)=>((a-b)%360+540)%360-180,atRest=()=>drive==='hold'||(drive==='free'&&!run&&abs(vel)<.05),atPlatform=k=>atRest()&&abs(off(A,SP*k))<.5;
// Sound, opt-in: clicks and chimes, and while it runs a little organ waltz written for this wheel.
let ac=null,mg=null,mus=null;
function audio(){try{if(!ac){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;ac=new AC();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
const hz=m=>440*2**((m-69)/12);
function tone(f,d,v,type='sine',at=0,out){const a=ac;if(!a)return;const t=a.currentTime+at,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(out||a.destination);o.start(t);o.stop(t+d+.03);}
const MEL=[65,69,72,77,0,76,74,72,70,67,0,0,64,67,70,74,0,72,69,67,69,65,0,0,72,74,72,69,70,72,74,0,70,77,0,0,72,69,65,67,70,76,77,0,72,65,0,0];
const BAR=[[53,57,60],[53,57,60],[48,58,64],[48,58,64],[48,58,64],[48,58,64],[53,57,60],[53,57,60],[53,57,60],[53,57,63],[46,62,65],[46,62,65],[48,57,60],[48,58,64],[53,57,60],[53,57,60]];
function waltz(){const a=ac;if(!a)return;const on=drive==='free'&&run;
if(!mg){mg=a.createGain();mg.gain.value=0;const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=2600;mg.connect(lp);lp.connect(a.destination);}
if(!on){if(mus){mg.gain.setTargetAtTime(0,a.currentTime,.3);mus=null;}return;}
if(!mus){mg.gain.setTargetAtTime(1,a.currentTime,.2);mus={t:a.currentTime+.08,b:0};}else if(mus.t<a.currentTime)mus.t=a.currentTime+.05;
const beat=60/(138+12*si);while(mus.t<a.currentTime+.2){const b=mus.b%48,ch=BAR[floor(b/3)],m=MEL[b];
if(m){let n=1;while(b+n<48&&MEL[b+n]===0)n++;tone(hz(m),beat*n*.95,.035,'square',mus.t-a.currentTime,mg);tone(hz(m+12),beat*n*.6,.01,'triangle',mus.t-a.currentTime,mg);}
if(b%3===0)tone(hz(ch[0]),beat*.9,.05,'triangle',mus.t-a.currentTime,mg);else for(const c of[ch[1],ch[2]])tone(hz(c),beat*.4,.012,'square',mus.t-a.currentTime,mg);
mus.b++;mus.t+=beat;}}
// Actions.
const busy=()=>{notice('PROGRESS · THE PAGE TURNS THE WHEEL');say('The wheel is showing a progress, so the page turns it.');};
function toggleRun(){audio();if(drive==='prog'){busy();return;}
if(drive==='free')run=!run;else{drive='free';run=true;vel=spd;trip=hold=null;boardAt=0;}
if(run){tone(98,.45,.03,'triangle');tone(196,.25,.012,'sine',.06);say(`The wheel turns at ${RPM[si]} turns a minute.`);}else{tone(147,.5,.025,'triangle');say('The wheel is stopping.');}}
function speed(d){audio();if(drive==='prog'){busy();return;}const n=clamp(si+d,0,RPM.length-1);
if(n===si){notice(`${d>0?'TOP':'LOWEST'} SPEED · ${RPM[si].toFixed(1)} RPM`);return;}si=n;tone(420+si*80,.07,.016,'triangle');
const going=drive==='free'&&run;notice(`SPEED ${RPM[si].toFixed(1)} RPM${going?'':' · SPACE RUNS IT'}`);say(`Speed ${RPM[si]} turns a minute${going?'':', when it runs'}.`);}
function cycleLights(){audio();pat=(pat+1)%PATS.length;tone(2400,.012,.012,'square');tone(1800,.014,.01,'square',.05);notice(`LIGHTS · ${PATS[pat]}`);say(`Lights: ${PATS[pat].toLowerCase()}.`);}
function send(k,dest,to){audio();if(drive==='prog'){busy();return;}
if(to===undefined)to=A+off(dest==='top'?SP*k-180:SP*k,A);
if(abs(to-A)<.01){A=to;trip={k,dest};arrive();return;}
trip={from:A,to,t0:performance.now(),dur:clamp(abs(to-A)/45+.8,1.2,5)*1000,k,dest};drive='trip';run=false;hold=null;boardAt=0;tone(660,.08,.012,'triangle');
say(`Car ${k+1} is on its way to the ${dest==='top'?'top':'platform'}.`);}
const pick=k=>send(k,atPlatform(k)?'top':'platform');
function nextCar(){const to=(floor(A/SP+1e-6)+1)*SP;send(((round(to/SP)%N)+N)%N,'platform',to);}
function arrive(){const{k,dest}=trip;drive='hold';hold={k,dest};trip=null;vel=0;tone(1318.5,.9,.022);tone(2637,.5,.006,'sine',.01);
if(dest==='platform'){boardAt=performance.now()+(reduced.matches?0:700);say(`Car ${k+1} is at the platform.`);}else say(`Car ${k+1} is at the top, with the best view.`);}
function board(c){const had=c.n>0;c.n=had?0:1+floor(rnd()*2);showRiders(c);tone(988,.3,.016);tone(1318.5,.4,.016,'sine',.12);say(`Car ${c.k+1}: ${had?'the riders step off':c.n===1?'a rider boards':'two riders board'}.`);}
// Progress: a share turns the wheel that far round from car 1 at the platform; null runs it again; done finishes the
// turn, brings car 1 home and lights everything.
function setProgress(p){fin=0;if(p==null||!isFinite(p)){if(drive==='prog'){drive='free';run=true;vel=0;}prog=null;return;}
const target=clamp(+p);if(drive!=='prog'){prog={base:360*round((A-360*target)/360),target};drive='prog';trip=hold=null;run=false;boardAt=0;}else prog.target=target;}
function finish(){audio();if(fin)return;if(drive!=='prog'){const base=floor(A/360)*360;prog={base,target:clamp((A-base)/360)};drive='prog';trip=hold=null;run=false;boardAt=0;}fin=1;say('Finishing: the wheel makes its last turn.');}
function complete(now){fin=2;finT=now/1000;prog.base=A;prog.target=0;[72,76,79,84].forEach((m,i)=>tone(hz(m),.6,.022,'triangle',i*.13));say('Complete. Car 1 is back at the platform.');}
window.figure={setProgress,done:finish};
// The lights: a level and a color for each, by pattern; still patterns under reduced motion.
function lvl(b,t,red){const T=red?0:t,n=b.n;
if(fin===2){const q=t-finT;return!red&&q<2.6?[(n+floor(q*7))%2?1:.2,'']:[1,''];}
if(drive==='prog'&&b.kind!=='sign'&&b.kind!=='hub'){const p=clamp((A-prog.base)/360)*360,d=((A-b.a0-90)%360+360)%360;return d<=p+.01?(d>p-8?[1,'hot']:[.85,'']):[.1,''];}
if(pat===0){if(red)return[n%2?.8:1,''];if((T+b.so)%b.sp<.12)return[1,'hot'];return[.6+.4*sin(b.w*T+b.ph),''];}
if(pat===1){const s=floor(T*6.5),i=b.kind==='spoke'?b.k-s:n+s;return[(i%3+3)%3===0?1:.12,''];}
if(pat===2){if(red)return[b.kind==='spoke'?1:.55,''];const q=(T/1.9)%1;return[b.kind==='spoke'?.12+.88*exp(-(((q-.08-b.k*.15)/.08)**2)):.36+.64*exp(-(((q-.6)/.1)**2)),''];}
const i=b.kind==='rim'?floor(n/3+T*2.4):b.kind==='spoke'?n+floor(T*1.6):n+floor(T*2.4);return[.95,'r'+(i%6+6)%6];}
function lights(t,red){for(const b of BL){const[v,key]=lvl(b,t,red),q=round(clamp(v)*10)/10,cls=(key?key+' ':'')+(q>.62?'on':q>.3?'dim':'off');
if(cls!==b.cls){b.cls=cls;set(b.c,'class','bulb '+cls);set(b.h,'class',key[0]==='r'?'halo '+key:'halo');}if(q!==b.v){b.v=q;b.h.style.opacity=f2(q*q);}}}
function sparks(t,red){const on=!red&&(fin===2?t-finT<2.6:pat===0&&drive!=='prog');for(const s of SPARKS){const u=(t+s.t0)/1.9,cyc=floor(u),q=(u-cyc)/.26;
if(on&&cyc!==s.cyc){s.cyc=cyc;s.b=MOVING[floor(rnd()*MOVING.length)];}const v=on&&q<1&&s.b?sin(q*PI):0;
if(v!==s.v){s.v=v;set(s.n,'opacity',f2(v));if(v)set(s.n,'transform',`translate(${f2(s.b.x)} ${f2(s.b.y)}) scale(${f2(.35+.65*v)})`);}}}
// The pose: rims, lacing and spokes at A, each car moved to its pin (and swung), the stack re-sorted, lights moved.
function pose(){for(const f of FACES){let s='',z='';for(let k=0;k<N;k++){const a=-90+SP*k-A;s+='M'+Q(W(6.4,a,f.y))+'L'+Q(W(R,a,f.y));z+=(k?'L':'M')+Q(W(R,a,f.y))+'L'+Q(W(RI,a+15,f.y));}retube(f.spokes,s);set(f.lace,'d',z+'Z');}
for(const c of CARS){const a=(-90+SP*c.k-A)*RAD;c.x=R*cos(a);c.z=HZ+R*sin(a);const p=P(c.x,0,c.z),cs=cos(c.phi),sn=sin(c.phi);
set(c.g,'transform',`matrix(${f3(cs-S*sn)} ${f3(-(1+S*S)*sn/C)} ${f3(C*sn)} ${f3(cs+S*sn)} ${f2(p[0])} ${f2(p[1])})`);set(c.hit,'transform',`translate(${f2(p[0])} ${f2(p[1])})`);}
const order=[...CARS].sort((u,v)=>u.x+u.z-v.x-v.z);if(order.some((c,i)=>c!==sorted[i])){for(const c of order)L.cars.appendChild(c.g);sorted=order;}
for(const b of MOVING)place(b,P(...W(b.r0,b.a0-A,WY+.7)));set(ros,'transform',`rotate(${f2(A)})`);}
function ui(now){const top=((round((180+A)/SP)%N)+N)%N+1;
const r=fin===2?'PROGRESS 100% · COMPLETE':drive==='prog'?`PROGRESS ${round(clamp((A-prog.base)/360)*100)}% · TOP · CAR ${pad2(top)}`:`TOP · CAR ${pad2(top)} · ${(abs(spd)/6).toFixed(1)} RPM`;
let st;if(now<noteT)st=note;else if(fin===2)st='COMPLETE · CAR 01 AT THE PLATFORM';else if(fin===1)st='FINISHING · LAST TURN';
else if(drive==='prog'){const p=round(prog.target*100);st=abs(prog.base+360*prog.target-A)>.05?`PROGRESS · TURNING TO ${p}%`:`PROGRESS · HOLDING AT ${p}%`;}
else if(drive==='trip')st=`SENDING CAR ${pad2(trip.k+1)} TO THE ${trip.dest==='top'?'TOP':'PLATFORM'}`;
else if(drive==='hold')st=hold.dest==='top'?`CAR ${pad2(hold.k+1)} AT THE TOP · SPACE RUNS IT`:`BOARDING · CAR ${pad2(hold.k+1)} AT THE PLATFORM`;
else{const want=run?RPM[si]*6:0;st=`${run?vel<want-.05?'STARTING':'RUNNING':vel>.05?'STOPPING':'STOPPED'} · ${PATS[pat]} LIGHTS`;}
if(r+st!==outKey){outKey=r+st;readout.textContent=r;stateLabel.textContent=st;}
for(const c of CARS){const lab=`Car ${c.k+1}: ${atPlatform(c.k)?'send it to the top':'bring it to the platform'}`;if(lab!==c.lab){c.lab=lab;set(c.hit,'aria-label',lab);}}}
function tick(now){const dt=last?min(.05,(now-last)/1000):0,red=reduced.matches,t=now/1000,A0=A;last=now;
if(drive==='free'){const want=run?RPM[si]*6:0;
if(red){vel=want;if(want){stepT+=dt;const T=SP/want;while(stepT>=T){stepT-=T;A+=SP;}}else stepT=0;}
else{vel+=(want-vel)*(1-exp(-dt/(abs(want)>abs(vel)?.85:.6)));if(abs(want-vel)<.02)vel=want;A+=vel*dt;}spd=vel;}
else if(drive==='trip'){const k=red?1:clamp((now-trip.t0)/trip.dur);A=trip.from+(trip.to-trip.from)*k*k*k*(k*(k*6-15)+10);if(k>=1){A=trip.to;arrive();}}
else if(drive==='prog'){const to=prog.base+360*(fin===1?1:prog.target),d=to-A;if(red||abs(d)<.02)A=to;else A+=sign(d)*min(abs(d),clamp(abs(d)*1.4,10,48)*dt);if(fin===1&&A===to)complete(now);}
if(drive!=='free')spd=dt?(A-A0)/dt:0;
if(boardAt&&now>=boardAt){boardAt=0;if(hold)board(CARS[hold.k]);}
let swing=false;
if(red)for(const c of CARS){c.phi=0;c.om=0;}
else if(dt){const vs=vS+((A-A0)/dt-vS)*(1-exp(-dt/.25)),acc=clamp((vs-vSP)/dt,-40,40)*RAD;vSP=vS=vs;
for(const c of CARS){const a=(-90+SP*c.k-A)*RAD;c.om+=(-9*c.phi-.9*c.om-.03*R*sin(a)*acc)*dt;c.phi=clamp(c.phi+c.om*dt,-.3,.3);if(abs(c.phi)>1e-4||abs(c.om)>1e-4)swing=true;}}
if(A!==posed||swing){posed=A;pose();}
lights(t,red);sparks(t,red);waltz();ui(now);requestAnimationFrame(tick);}
// Input: Space runs or stops it, the arrows set the speed, L the lights, B the next car; a car, the hub and the booth
// are buttons too.
CARS.forEach(c=>bind(c.hit,()=>pick(c.k)));bind(hubBtn,toggleRun);bind(booth,nextCar);
const act={' ':toggleRun,ArrowUp:()=>speed(1),ArrowDown:()=>speed(-1),l:cycleLights,b:nextCar};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(k===' '&&e.target.closest&&e.target.closest('button,[role=button]'))return;const fn=act[k];if(fn){e.preventDefault();if(!e.repeat||k.startsWith('Arrow'))fn();}});
pose();lights(0,reduced.matches);ui(performance.now());requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
