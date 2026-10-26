// @ts-nocheck
/* TALMIRA CS–7 · Communications satellite. Drawn for this package in the lab figures' form: its stylesheet, defs and script,
 * on the engine's kit. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--recess:#9d9d99;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--dk:#3a3a39;--dk-top:#4a4a48;--dk-side:#2d2d2c;--brass:#cfa95d;--brass-ink:#4a3a17;--foil:#dba63d;--foil-top:#efc560;--foil-side:#b9862b;--crease:#8a5f16;--glint:#fff6d8;--rad:#eceeed;--rad-line:#c3c8c9;--cell:#263160;--cell-line:#56679f;--cell-hi:#8fa2e6;--frame:#e8e8e4;--pback:#dcdcd7;--pback-line:#b5b5b0;--dishin:#fbfbf9;--dish-edge:#e2e2de;--dback:#d6d6d2;--link:#3b5bfd;--puff:#aeb4bb;--star:#f4f3ef}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--recess:#6e6e6c;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--dk:#2f2f2f;--dk-top:#454543;--dk-side:#1d1d1c;--brass:#ae8e4d;--foil:#b88b32;--foil-top:#e0b859;--foil-side:#825d1b;--crease:#734f11;--rad:#c7c8c8;--rad-line:#a5a8a9;--cell:#1e2850;--cell-line:#475685;--cell-hi:#7a8ccc;--frame:#c3c3c1;--pback:#b9b9b6;--pback-line:#989895;--dishin:#d4d4d2;--dish-edge:#bebebc;--dback:#b4b4b2;--link:#7f95ff;--puff:#f2f3f5;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.dk{fill:var(--dk)}.top.dk{fill:var(--dk-top)}.side.dk{fill:var(--dk-side)}.brass{fill:var(--brass)}
.maker{fill:var(--brass-ink);font:600 1.5px Georgia,'Times New Roman',serif;letter-spacing:.34px;text-anchor:middle;stroke:none}
.foil{fill:var(--foil)}.top.foil{fill:var(--foil-top)}.side.foil{fill:var(--foil-side)}.facet{fill:var(--glint);stroke:none;opacity:.26}.facet.dk2{fill:var(--crease);opacity:.17}.glint{fill:none;stroke:var(--glint);stroke-width:.26;stroke-linecap:round;opacity:.42}.foilsheen{fill:url(#foilG);stroke:none}
.tape{fill:none;stroke:var(--crease);stroke-width:.55;vector-effect:non-scaling-stroke;opacity:.4}.rad{fill:var(--rad)}.osr{fill:url(#osrP);stroke:none}
.pframe{fill:var(--frame)}.pback{fill:var(--pback)}.cells{fill:url(#cellP);stroke:none}.ribs{fill:url(#ribP);stroke:none}.psheen{fill:url(#cellG);stroke:none}.psheen.off{display:none}
.su,.sm{fill:none;stroke-linecap:round;stroke-linejoin:round}.su{stroke:var(--line)}.sm{stroke:var(--metal)}
.dishin{fill:url(#dishG)}.dback{fill:var(--dback)}.seam{fill:none;stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke;opacity:.6}
.beam{fill:none;stroke:var(--link);stroke-width:.8;stroke-dasharray:2.2 2.8;stroke-linecap:round;vector-effect:non-scaling-stroke;opacity:.6}
.pkt{fill:var(--link);stroke:none;filter:url(#dot)}.pkt.up{fill:var(--bg);stroke:var(--link);stroke-width:.6;filter:none}.fin .pkt{opacity:0}.fin .beam{opacity:.25}
.spot{fill:url(#spotG);stroke:none}.spotedge{fill:none;stroke:var(--link);stroke-width:.6;stroke-dasharray:1.4 2.2;vector-effect:non-scaling-stroke;opacity:.45}.aim{fill:none;stroke:var(--link);stroke-width:.7;stroke-linecap:round;vector-effect:non-scaling-stroke;opacity:.65}
.ripple{fill:none;stroke:var(--link);stroke-width:.7;vector-effect:non-scaling-stroke;opacity:0}.track{fill:none;stroke:var(--link);stroke-width:.6;vector-effect:non-scaling-stroke;opacity:0}.arc{fill:none;stroke:var(--link);stroke-width:1.7;stroke-linecap:round;vector-effect:non-scaling-stroke;opacity:0}
.prog .track{opacity:.25}.prog .arc{opacity:.95}.fin .arc,.fin .track{stroke:var(--ok)}.fin .spot{opacity:.45}
.lamp{fill:var(--off);stroke:none}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.b{filter:url(#dot)}
.puff{fill:url(#puffG);stroke:none;opacity:0}
.stars{display:none}.star{fill:var(--star);opacity:.8;stroke:none}.tw{animation:tw 5.2s ease-in-out infinite}.tw2{animation:tw 6.8s ease-in-out -2.4s infinite}@keyframes tw{0%,100%{opacity:.8}50%{opacity:.2}}
@media(prefers-color-scheme:dark){.stars{display:inline}}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<pattern id="cellP" patternUnits="userSpaceOnUse" width="3.9" height="3.15"><rect width="3.9" height="3.15" style="fill:var(--cell)"/><path d="M0,.16H3.9M.16,0V3.15" style="fill:none;stroke:var(--cell-line);stroke-width:.32"/></pattern>
<pattern id="ribP" patternUnits="userSpaceOnUse" width="7.8" height="6.3"><path d="M0,.2H7.8M.2,0V6.3" style="fill:none;stroke:var(--pback-line);stroke-width:.3"/></pattern>
<pattern id="osrP" patternUnits="userSpaceOnUse" width="4.14" height="4.2"><rect width="4.14" height="4.2" style="fill:var(--rad)"/><path d="M0,.15H4.14M.15,0V4.2" style="fill:none;stroke:var(--rad-line);stroke-width:.3"/><path d="M.9,3.3L3.2,1" style="fill:none;stroke:#fff;stroke-width:.35;opacity:.55"/></pattern>
<linearGradient id="foilG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:#fff;stop-opacity:.32"/><stop offset=".38" style="stop-color:#fff;stop-opacity:0"/><stop offset=".64" style="stop-color:#5a3c00;stop-opacity:0"/><stop offset="1" style="stop-color:#5a3c00;stop-opacity:.18"/></linearGradient>
<linearGradient id="cellG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--cell-hi);stop-opacity:.42"/><stop offset=".42" style="stop-color:var(--cell-hi);stop-opacity:0"/><stop offset=".78" style="stop-color:#fff;stop-opacity:0"/><stop offset="1" style="stop-color:#fff;stop-opacity:.1"/></linearGradient>
<radialGradient id="dishG" cx=".5" cy=".5" r=".5"><stop offset=".2" style="stop-color:var(--dishin)"/><stop offset="1" style="stop-color:var(--dish-edge)"/></radialGradient>
<radialGradient id="spotG"><stop offset="0" style="stop-color:var(--link);stop-opacity:.34"/><stop offset=".55" style="stop-color:var(--link);stop-opacity:.14"/><stop offset="1" style="stop-color:var(--link);stop-opacity:0"/></radialGradient>
<filter id="dot" x="-250%" y="-250%" width="600%" height="600%"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<radialGradient id="puffG"><stop offset="0" style="stop-color:var(--puff);stop-opacity:.9"/><stop offset=".55" style="stop-color:var(--puff);stop-opacity:.45"/><stop offset="1" style="stop-color:var(--puff);stop-opacity:0"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* TALMIRA CS–7 on a display stand. World: x lower-right, y lower-left, z up; one unit is one user unit.
Part                        x      y      z      w      d      h
foot                      -10    -10      0     20     20    3.6   brass maker plate on its +y face
stand                   r 1.1      0      0      ·      ·     34   a collar at the foot, up into the bus
bus                       -13    -13     34     26     26     32   foil on +x and the top deck, an OSR radiator on +y
solar drives            r 2.4    0, ±13 → ±16 at z 50
wings                   a yoke 9 long, then panels 16 × 26 (z 37–63) on vertical hinges, stowed in a Z against the bus
dish                    a boom from 13 2 44 out to 19 2 44; reflector r 14, focus 10.5, the feed on three struts
top deck                thruster pods on the corners, the omni mast at -6 5, a whip at 7 -8, the beacon at 5 4
floor                   the house shadow under the stand; the ground point where the beam lands, with its ripples and sync ring
Painter order: stars, shadow, ground point, foot, stand, far wing, bus, top deck, dish, beam, near wing, puffs, controls. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{P,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,box,cylinder,frame}=kit(()=>root);
// Family helpers: vectors, oriented planes, movable round parts and struts, lamps and controls.
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>mul(a,1/(Math.hypot(...a)||1)),lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),VIEW=[1,1,1],RAD=Math.PI/180,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),f2=v=>v.toFixed(2),f3=v=>+v.toFixed(3);
const plane=(o,U,V)=>`matrix(${[...P(...U),...P(...V),...P(...o)].map(f3).join(' ')})`,shade=n=>n[2]>.6?'top':n[0]>n[1]?'side':'',pt=q=>f2(q[0])+','+f2(q[1]);
function axes(n){const U=unit(Math.abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U);const a=P(...U),b=P(...V);if(a[0]*b[1]-a[1]*b[0]<0)V=mul(V,-1);return[U,V];}
/* A round part that moves: its body and the end cap that faces the viewer, made once and set in place by put(). */
function tube(parent,cls='',cap=true){const w=el('g',{},parent),t={w,cls,p:el('path',{class:'face '+cls},w)};if(cap){t.g=el('g',{},w);t.c=circle(t.g,0,0,1,'face '+cls);}return t;}
function put(t,a,b,r){const ax=sub(b,a),n=unit(ax),[U,V]=axes(n),pu=P(...U),pv=P(...V),pd=P(...ax),det=pu[0]*pv[1]-pv[0]*pu[1];if(Math.abs(det)<1e-4)return put(t,a,add(b,[.02,-.01,0]),r);
const u=(pd[0]*pv[1]-pv[0]*pd[1])/det,v=(pu[0]*pd[1]-pd[0]*pu[1])/det,l=Math.hypot(u,v)||1,tx=-v*r/l,ty=u*r/l;
set(t.p,'d',`M${f2(tx)},${f2(ty)}A${r},${r} 0 0 1 ${f2(-tx)},${f2(-ty)}L${f2(u-tx)},${f2(v-ty)}A${r},${r} 0 0 1 ${f2(u+tx)},${f2(v+ty)}Z`);set(t.p,'transform',plane(a,U,V));
if(t.c){const f=dot(n,VIEW)>0;set(t.g,'transform',plane(f?b:a,U,V));set(t.c,'r',r);set(t.c,'class','face '+shade(f?n:mul(n,-1))+' '+t.cls);}return t;}
/* An outlined strut between world points, made once and moved by its points. */
function strut(parent,w,cls='sm'){const g=el('g',{},parent);return{g,o:el('path',{class:'su','stroke-width':w+.7},g),s:el('path',{class:cls,'stroke-width':w},g)};}
function aimStrut(s,pts){const d=pts.map((p,i)=>(i?'L':'M')+pt(P(...p))).join('');set(s.o,'d',d);set(s.s,'d',d);}
function lamp(g,x,y,r=1){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
/* Foil: a crumpled skin. A jittered grid of facets, some a shade lighter and some darker, a glint on a few of their edges;
 * from a fixed seed, so every copy crinkles alike. */
let seed=57;const rnd=()=>(seed=seed*16807%2147483647)/2147483647;
function crinkle(g,w,h){const nx=Math.round(w/5),ny=Math.round(h/5),p=[];let lt='',dk='',gl='';const v=(i,j)=>p[j*(nx+1)+i],tri=(a,b,c)=>`M${f2(a[0])},${f2(a[1])}L${f2(b[0])},${f2(b[1])}L${f2(c[0])},${f2(c[1])}Z`;
for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const ix=i>0&&i<nx,iy=j>0&&j<ny;p.push([.4+(w-.8)*(i+(ix?(rnd()-.5)*.7:0))/nx,.4+(h-.8)*(j+(iy?(rnd()-.5)*.7:0))/ny]);}
for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=v(i,j),b=v(i+1,j),c=v(i+1,j+1),d=v(i,j+1),ts=rnd()<.5?[[a,b,c],[a,c,d]]:[[a,b,d],[b,c,d]];
for(const t of ts){const r=rnd();if(r<.3)lt+=tri(...t);else if(r>.7)dk+=tri(...t);}if(rnd()<.35){const[q,s]=rnd()<.5?[a,c]:[b,d];gl+=`M${f2(q[0])},${f2(q[1])}L${f2(s[0])},${f2(s[1])}`;}}
el('path',{d:lt,class:'facet'},g);el('path',{d:dk,class:'facet dk2'},g);el('path',{d:gl,class:'glint'},g);}
// Stars, for the night studio only: a few still points and two slow twinkles.
const stars=el('g',{class:'stars'});for(const[x,y,r,c]of[[-52,-86,1.5,'tw'],[-33,-97,.9,''],[-62,-58,1,'tw2'],[-22,-74,.7,''],[58,-30,1.3,'tw2'],[44,-12,.8,''],[-46,-30,.75,'']]){if(c)el('path',{d:`M${x},${y-r*1.7}L${x+r*.32},${y-r*.32}L${x+r*1.7},${y}L${x+r*.32},${y+r*.32}L${x},${y+r*1.7}L${x-r*.32},${y+r*.32}L${x-r*1.7},${y}L${x-r*.32},${y-r*.32}Z`,class:'star '+c},stars);else circle(stars,x,y,r*.6,'star');}
// Floor: the house shadow under the stand, then the ground point the dish beams to: a soft pool, its dashed edge, the aim mark,
// ripples as packets land, and the sync ring. A floor circle of radius r draws as an ellipse r·KX by r·KY.
el('ellipse',{cx:3,cy:5,rx:38,ry:12.5,class:'shadow stage-floor'});el('ellipse',{cx:3,cy:5,rx:38,ry:12.5,class:'stage-contact'});
const KX=Math.SQRT2*Math.sqrt(3)/2,KY=Math.SQRT2/2,gnd=el('g',{}),fl=(r,cls,parent=gnd)=>el('ellipse',{cx:0,cy:0,rx:f2(r*KX),ry:f2(r*KY),class:cls},parent);
fl(10,'spot');fl(10,'spotedge');const rips=[0,1].map(()=>fl(3,'ripple'));fl(13,'track');const arc=el('path',{class:'arc',d:'M0,0'},gnd);
const aimG=el('g',{},gnd);fl(1.9,'aim',aimG);for(const[a,b,c,d]of[[3,0,4.4,0],[-3,0,-4.4,0],[0,3,0,4.4],[0,-3,0,-4.4]]){const p=P(a,b,0),q=P(c,d,0);line(aimG,f2(p[0]),f2(p[1]),f2(q[0]),f2(q[1]),'aim');}
// Display stand: the foot with its maker plate, a collar and the rod up into the bus.
box(-10,-10,0,20,20,3.6,.6,'dk');const pf=group(FRONT(-10,10,3.6));rect(pf,4.4,.7,11.2,2.2,.5,'face brass');text(pf,10.17,2.33,'TALMIRA','maker');
cylinder(0,0,3.6,2.5,1.4,'z','metal');put(tube(root,'metal',false),[0,0,5],[0,0,34],1.1);
// Far wing first, then the bus: foil with taped seams on +x and the top deck, the OSR radiator between foil bands on +y, the solar drives.
const farL=el('g',{});put(tube(root,'metal'),[0,-13,50],[0,-16,50],2.4);
const sf=group(SIDE(13,13,66)),tf=group(TOP(-13,-13,66)),ff=group(FRONT(-13,13,66));
for(const[g,w,h,cls]of[[sf,26,32,'side foil'],[tf,26,26,'top foil']]){rect(g,0,0,w,h,1.2,'face '+cls);crinkle(g,w,h);rect(g,.3,.3,w-.6,h-.6,1,'foilsheen');}
for(const v of[10.5,21.5])line(sf,.7,v,25.3,v,'tape');line(sf,9,10.5,9,21.5,'tape');line(tf,13,.7,13,25.3,'tape');
rect(ff,0,0,26,32,1.2,'face rad');rect(ff,.5,3.3,25,25.4,.4,'osr');rect(ff,0,0,26,3.2,1,'face foil');rect(ff,0,28.8,26,3.2,1,'face foil');
circle(group(FRONT(0,13,50)),0,0,4.4,'face metal');put(tube(root,'metal'),[0,13,50],[0,16,50],2.4);
// Top deck: the thruster pods on its corners (their nozzles point out along the diagonals), the omni mast, a whip and the beacon.
const NZ=[];for(const[sx,sy]of[[-1,-1],[1,-1],[-1,1],[1,1]]){box(sx*10.6-1.7,sy*10.6-1.7,66,3.4,3.4,1.8,.5,'metal');const o=[sx*10.6+sx*1.2,sy*10.6+sy*1.2,66.9],d=unit([sx,sy,.25]);put(tube(root,'dk'),o,add(o,mul(d,2.2)),.75);NZ.push({o:add(o,mul(d,2.6)),d});}
put(tube(root,'metal'),[-6,5,66],[-6,5,76],.5);const oq=P(-6,5,76);el('ellipse',{cx:f2(oq[0]),cy:f2(oq[1]),rx:2.94,ry:1.7,class:'face top metal'});circle(root,...P(-6,5,77.4),.95,'face metal');
put(tube(root,'metal'),[7,-8,66],[7,-8,72.5],.4);circle(root,...P(7,-8,72.9),.6,'face dk');
const bq=P(5,4,66.4);circle(root,bq[0],bq[1],1.5,'face metal');const beacon=lamp(root,bq[0],bq[1]-.35,.85);
// Dish: a boom from the +x face to the hub, the reflector as rings at their depth with gores, the feed horn on three struts.
// Made once and set in place as it slews; drawn hollow side out when it faces the viewer, its back otherwise.
const NR=5,R=14,FOC=10.5,M=[13,2,44],H=[19,2,44],KN=.78,dishL=el('g',{}),arm=tube(dishL,'metal'),fills=[],seams=[];
for(let k=1;k<=NR;k++){const g=el('g',{},dishL);fills.push({g,c:circle(g,0,0,R*k/NR,'face dback')});}
for(let k=1;k<NR;k++){const g=el('g',{},dishL);seams.push({g,c:circle(g,0,0,R*k/NR,'seam')});}
const gores=el('path',{class:'seam'},dishL),hubG=el('g',{},dishL);circle(hubG,0,0,2.3,'face metal');circle(hubG,0,0,.9,'face dk');
const legs=[0,1,2].map(()=>strut(dishL,.42)),feed=tube(dishL,'dk');let E=[30,8,40],G=[40,10,0];
function dish(N){const[U,V]=axes(N),Vx=add(H,mul(N,1.2)),at=r=>add(Vx,mul(N,r*r/(4*FOC))),F=add(Vx,mul(N,FOC)),toward=dot(N,VIEW)>0,ring=(r,t)=>add(add(at(r),mul(U,r*Math.cos(t))),mul(V,r*Math.sin(t)));
put(arm,M,Vx,1.5);for(let k=1;k<=NR;k++){const f=fills[k-1];set(f.g,'transform',plane(at(R*k/NR),U,V));set(f.c,'class','face '+(toward&&k===NR?'dishin':'dback'));}
for(let k=1;k<NR;k++)set(seams[k-1].g,'transform',plane(at(R*k/NR),U,V));
let d='';for(let i=0;i<12;i++){const t=(i*30+15)*RAD;for(let k=1;k<=NR;k++)d+=(k>1?'L':'M')+pt(P(...ring(R*k/NR,t)));}set(gores,'d',d);
set(hubG,'transform',plane(at(R*.2),U,V));for(let i=0;i<3;i++)aimStrut(legs[i],[ring(R-.5,(90+i*120)*RAD),add(F,mul(N,-1.8))]);put(feed,add(F,mul(N,-2.6)),add(F,mul(N,.5)),1.35);
const seq=toward?[arm.w,...fills.map(f=>f.g),...seams.map(s=>s.g),gores,hubG,...legs.map(s=>s.g),feed.w]:[feed.w,...legs.map(s=>s.g),...fills.map(f=>f.g).reverse(),...seams.map(s=>s.g),gores,hubG,arm.w];
for(const n of seq)dishL.appendChild(n);E=at(R);}
// The beam from the dish to the ground point, with packets running down and replies running up.
const beamG=el('g',{}),beam=el('path',{class:'beam'},beamG),downs=[0,1,2].map(()=>circle(beamG,0,0,1.15,'pkt')),ups=[0,1].map(()=>circle(beamG,0,0,.95,'pkt up'));
// Near wing, then the thruster puffs over everything.
const nearL=el('g',{}),puffG=el('g',{}),puffs=NZ.flatMap(()=>[0,1].map(()=>el('ellipse',{rx:1,ry:1,class:'puff'},puffG)));
/* Wings: a yoke and three panels per side on vertical hinges. Stowed, the yoke lies along the bus and the panels fold in a Z
 * against it; deploying swings the yoke out with the stack parallel to the bus, then opens the panels in turn from the root,
 * each landing on its latch with a small overshoot. Seen from the front a panel shows its cells, from behind its ribbed back. */
const ZP=63,HP=26,LY=9,LP=16,GAP=1.2,DLT=3,BOUNDS=[0,.25,.5,.75,1];
const latch=t=>{if(t<=0)return 0;if(t>=1)return 1;const x=t-1;return 1+1.8*x*x*x+.8*x*x;};
const W=[{sg:-1,L:farL},{sg:1,L:nearL}];
for(const w of W){w.yg=el('g',{},w.L);w.ys=[0,1,2].map(()=>strut(w.yg,.8));w.p=[0,1,2].map(()=>{const g=el('g',{},w.L),p={g,cells:null,b:rect(g,0,0,LP,HP,.6,'face pframe'),o:rect(g,.7,.7,LP-1.4,HP-1.4,.3,'cells'),s:rect(g,.7,.7,LP-1.4,HP-1.4,.3,'psheen')};for(const v of[3.5,HP-6.5])rect(g,-.7,v,1.4,3,.3,'face dk');return p;});}
function wings(u){const e=[0,1,2,3].map(k=>latch((u-BOUNDS[k])/(BOUNDS[k+1]-BOUNDS[k]))),th=[90*(1-e[0]),-90*(1-e[1])];th[2]=th[1]+(180-2*DLT)*(1-e[2]);th[3]=th[2]-(180-2*DLT)*(1-e[3]);
for(const w of W){const sg=w.sg,segs=[];let A=[0,sg*16];
for(let k=0;k<4;k++){const t=th[k]*RAD,dk=[Math.sin(t),sg*Math.cos(t)],L=k?LP:LY,B=[A[0]+dk[0]*L,A[1]+dk[1]*L];segs.push({A,B,dk,t});A=k?[B[0]+dk[0]*GAP,B[1]+dk[1]*GAP]:B;}
const y=segs[0],a=y.A,b=y.B;aimStrut(w.ys[0],[[a[0],a[1],53],[b[0],b[1],ZP-.6]]);aimStrut(w.ys[1],[[a[0],a[1],47],[b[0],b[1],ZP-HP+.6]]);aimStrut(w.ys[2],[[a[0],a[1],47],[b[0],b[1],ZP-.6]]);
const order=[{n:w.yg,t:y.t,c:[(a[0]+b[0])/2,(a[1]+b[1])/2,0]}];
for(let k=1;k<4;k++){const s=segs[k],p=w.p[k-1],n=[Math.cos(s.t),-sg*Math.sin(s.t),0],cells=dot(n,VIEW)>0;set(p.g,'transform',plane([s.A[0],s.A[1],ZP],[s.dk[0],s.dk[1],0],[0,0,-1]));
if(p.cells!==cells){p.cells=cells;set(p.b,'class','face '+(cells?'pframe':'pback'));set(p.o,'class',cells?'cells':'ribs');set(p.s,'class',cells?'psheen':'psheen off');}
order.push({n:p.g,t:s.t,c:[(s.A[0]+s.B[0])/2,(s.A[1]+s.B[1])/2,0]});}
// Parallel neighbours (a folded stack) by which side of the other they lie on, the rest by depth.
order.sort((p,q)=>{if(Math.abs(Math.sin(p.t-q.t))<.5){const n=[Math.cos(p.t),-sg*Math.sin(p.t),0],o=dot(sub(q.c,p.c),n)*(dot(n,VIEW)<0?-1:1);if(Math.abs(o)>.05)return o>0?-1:1;}return p.c[0]+p.c[1]-q.c[0]-q.c[1];});for(const o of order)w.L.appendChild(o.n);}}
// Controls on top: the wings deploy or stow, the bus fires the thrusters.
const wBtn=button(el('g',{}),{'aria-label':'Deploy or stow the solar wings (Space)','aria-pressed':'true'});for(const sg of[-1,1]){const c=[[0,sg*16,ZP+1],[0,sg*75.4,ZP+1],[0,sg*75.4,ZP-HP-1],[0,sg*16,ZP-HP-1]].map(p=>pt(P(...p))).join('L');el('path',{d:'M'+c+'Z',class:'hit'},wBtn);el('path',{d:'M'+c+'Z',class:'focus-ring'},wBtn);}
const tBtn=button(el('g',{}),{'aria-label':'Fire the thrusters (T)'}),tq=P(0,0,60);el('circle',{cx:f2(tq[0]),cy:f2(tq[1]),r:17,class:'hit'},tBtn);el('circle',{cx:f2(tq[0]),cy:f2(tq[1]),r:18.5,class:'focus-ring'},tBtn);
frame([[0,-76,37,0,152,26],[-13,-13,34,26,26,45],[24,-10,0,30,34,0],[-20,-20,0,40,40,4]],8);
// State: the wings, the dish's aim, the link and its packets, the sync progress, the thrusters; sound after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const say=m=>{announcement.textContent=m;},pad=n=>String(n).padStart(2,'0'),AZ0=22,EL0=62,AZ=[-8,52],EL=[57,72];
let dep=1,u=1,az=AZ0,elv=EL0,azN=AZ0,elN=EL0,mode='ind',target=0,pr=0,fin=false,complete=false,burns=0,burnT=-1e9,flash='',flashT=0,last=0,lastUI=-1,drawnW='',drawnD='',drawnA='',ripN=0,ripT=[-1e9,-1e9],sPrev=[0,0,0];
const note=(m,ms=1500)=>{flash=m;flashT=performance.now()+ms;lastUI=-1;};
let ac=null,noise=null;
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac)ac=new A();if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){}}
function tone(f,d=.07,v=.012,w=0,type='sine'){if(!ac)return;try{const t=ac.currentTime+w,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
function hiss(w=0,d=.16){if(!ac)return;try{if(!noise){const n=Math.floor((ac.sampleRate||44100)*.3);noise=ac.createBuffer(1,n,ac.sampleRate||44100);const c=noise.getChannelData(0);for(let i=0;i<c.length;i++)c[i]=Math.random()*2-1;}
const t=ac.currentTime+w,s=ac.createBufferSource(),f=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noise;f.type='bandpass';f.frequency.value=2600;f.Q.value=.8;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.02,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(f);f.connect(g);g.connect(ac.destination);s.start(t);s.stop(t+d+.02);}catch(_){}}
/* The link: its quality falls off as the beam leans away from straight down (a longer path), and on battery the payload drops
 * to a beacon. The rate follows; in full motion it breathes a little. */
const quality=()=>Math.min(99,Math.round(98+.6*(elN-EL0)));
function rate(now,red){const q=quality(),r=12.65*q/100*(.06+.94*u)*(red?1:1+.008*Math.sin(now/1000*1.7)+.005*Math.sin(now/1000*4.3));return r.toFixed(1);}
function ui(now,red){const L=Math.round(quality()*(.2+.8*u));readout.textContent=complete?'SYNC 100% · COMPLETE':mode==='det'?`SYNC ${Math.round(pr*100)}% · ${rate(now,red)} MB/S`:`LINK ${L}% · ${rate(now,red)} MB/S`;
const moving=u!==dep,panel=u<.25?'YOKE':`PANEL ${Math.min(3,Math.floor((u-.25)/.25)+1)}`;
stateLabel.textContent=now<flashT?flash:moving?(dep?`DEPLOYING WINGS · ${panel}`:'STOWING WINGS'):`${complete?'SYNC COMPLETE':mode==='det'?'SYNCING':'LINK UP'} · ${u>=1?'SOLAR POWER':'ON BATTERY'}`;}
// The progress API: a share makes it a sync the page drives, null a plain link again; done runs the last of it through.
function setProgress(p){fin=false;complete=false;if(p==null||!isFinite(p))mode='ind';else{mode='det';target=clamp(+p);}lastUI=-1;}
function done(){mode='det';fin=true;target=1;lastUI=-1;}
window.figure={setProgress,done};
function aim(){const a=azN*RAD,e=elN*RAD,B=[Math.cos(e)*Math.cos(a),Math.cos(e)*Math.sin(a),-Math.sin(e)];dish(unit(add(B,[0,0,KN])));G=add(H,mul(B,H[2]/Math.sin(e)));G[2]=0;const g=P(...G);set(gnd,'transform',`translate(${f2(g[0])} ${f2(g[1])})`);
const d=`M${pt(P(...E))}L${pt(g)}`;set(beam,'d',d);}
function wingsKey(){audio();dep=dep?0:1;set(wBtn,'aria-pressed',String(!!dep));lastUI=-1;tone(dep?520:390,.09,.01,0,'triangle');say(dep?'Deploying the solar wings, panel by panel.':'Stowing the solar wings. The satellite runs on its battery.');}
function slew(da,de){audio();const a=clamp(az+da,...AZ),e=clamp(elv+de,...EL);if(a===az&&e===elv){note('SLEW · AT LIMIT');tone(180,.06,.008,0,'triangle');return;}az=a;elv=e;note(`SLEW · AZ ${az<0?'−':''}${Math.abs(az)}° · EL −${elv}°`);tone(330+elv*3,.05,.008,0,'triangle');say(`Dish slewed to azimuth ${az} degrees, ${elv} degrees down.`);}
function thrust(){audio();burns++;burnT=performance.now();note(`THRUSTERS · BURN ${pad(burns)}`,1400);for(const w of[0,.32])hiss(w);say(`Thrusters fired, burn ${burns}. The satellite holds its station.`);}
function stepSync(){audio();setProgress(mode==='det'&&!complete?(target>=1?0:Math.min(1,Math.floor(target*4+1e-6)/4+.25)):.25);tone(660+target*440,.08,.009);say(`Sync ${Math.round(target*100)} percent.`);}
bind(wBtn,wingsKey);bind(tBtn,thrust);
const act={' ':wingsKey,t:thrust,p:stepSync,ArrowLeft:()=>slew(10,0),ArrowRight:()=>slew(-10,0),ArrowUp:()=>slew(0,5),ArrowDown:()=>slew(0,-5)};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(k===' '&&e.target.closest&&e.target.closest('button,[role=button]'))return;const fn=act[k];if(fn){e.preventDefault();if(!e.repeat||k.startsWith('Arrow'))fn();}});
function tick(now){const dt=last?Math.min((now-last)/1000,.05):0,red=reduced.matches;last=now;
const was=u;u=red?dep:dep>u?Math.min(dep,u+dt/2.8):Math.max(dep,u-dt/2.8);if(!red&&u!==was)for(const b of BOUNDS.slice(1))if((was<b)!==(u<b)||u===b&&was!==b)tone(b===1?1500:1900,.03,.009,0,'square');
const wk=f3(u);if(wk!==drawnW){drawnW=wk;wings(u);}
if(red){azN=az;elN=elv;}else{const k=1-Math.exp(-dt*4.5);azN+=(az-azN)*k;elN+=(elv-elN)*k;if(Math.abs(az-azN)<.02)azN=az;if(Math.abs(elv-elN)<.02)elN=elv;}
const dk=f2(azN)+','+f2(elN);if(dk!==drawnD){drawnD=dk;aim();}
if(mode==='det'){const tg=fin?1:target;pr=red?tg:pr+(tg-pr)*(1-Math.exp(-dt*3.2))+Math.sign(tg-pr)*Math.min(Math.abs(tg-pr),dt*.05);if(Math.abs(tg-pr)<.002)pr=tg;
if(fin&&pr>=1&&!complete){complete=true;lastUI=-1;tone(1320,.12,.01);tone(1760,.16,.01,.12);say('Sync complete. The link goes quiet.');}}
const ak=mode==='det'?f3(pr):'';if(ak!==drawnA){drawnA=ak;const p=mode==='det'?pr:0;let d='M0,0';if(p>0){const n=Math.max(2,Math.ceil(48*p)),t0=-135*RAD;d='';for(let i=0;i<=n;i++){const t=t0+2*Math.PI*p*i/n;d+=(i?'L':'M')+pt(P(13*Math.cos(t),13*Math.sin(t),0));}}set(arc,'d',d);}
svg.classList.toggle('prog',mode==='det');svg.classList.toggle('fin',complete);
// Packets: down the beam and back up, landing with a ripple; held still under reduced motion.
const e0=P(...E),g0=P(...G),at=s=>lerp(e0,g0,s),sp=.42*(.35+.65*u),show=(n,s,o)=>{const q=at(s);set(n,'cx',f2(q[0]));set(n,'cy',f2(q[1]));n.style.opacity=o;};
if(complete){for(const n of[...downs,...ups])n.style.opacity='0';}
else if(red){downs.forEach((n,i)=>i?n.style.opacity='0':show(n,.4,'1'));ups.forEach((n,i)=>i?n.style.opacity='0':show(n,.72,'1'));}
else{const ph=now/1000*sp;downs.forEach((n,i)=>{const s=(ph+i/3)%1;if(s<sPrev[i]){ripT[ripN]=now;ripN=(ripN+1)%2;}sPrev[i]=s;show(n,s,f2(Math.min(1,s/.08,(1-s)/.08)));});ups.forEach((n,i)=>{const s=1-((ph*.8+i/2+.17)%1);show(n,s,f2(Math.min(1,s/.1,(1-s)/.1)));});}
rips.forEach((n,i)=>{const a=(now-ripT[i])/900;if(red||a>=1||complete){if(n.style.opacity!=='0')n.style.opacity='0';return;}const r=2+10*a;set(n,'rx',f2(r*KX));set(n,'ry',f2(r*KY));n.style.opacity=f2(.6*(1-a));});
// Thrusters: two pulses of cold gas from every pod; under reduced motion one still puff, then gone.
const bt=(now-burnT)/1000;puffs.forEach((n,i)=>{const z=NZ[i>>1],j=i&1,a=red?(bt<.8&&!j?.3:-1):(bt-j*.32)/.62;if(a<0||a>=1){if(n.style.opacity!=='0')n.style.opacity='0';return;}
const q=P(...add(z.o,mul(z.d,1+7*a))),r=1.1+4.2*a;set(n,'cx',f2(q[0]));set(n,'cy',f2(q[1]));set(n,'rx',f2(r));set(n,'ry',f2(r*.82));n.style.opacity=f2(red?.8:Math.min(1,a*6)*(1-a));});
lit(beacon,now<flashT&&flash.startsWith('SLEW')?'b':u<1?'a':(red||now%1600<900)?'g':'');
if(lastUI<0||now-lastUI>120){lastUI=now;ui(now,red);}requestAnimationFrame(tick);}
wings(u);drawnW=f3(u);aim();drawnD=f2(azN)+','+f2(elN);ui(0,reduced.matches);requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
