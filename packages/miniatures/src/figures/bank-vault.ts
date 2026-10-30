// @ts-nocheck
/* HALVARD V–40 · Bank vault. Drawn for this kit on the shared engine, in the manner of the lab files: its stylesheet,
 * defs and script. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--base-top:#cbcbc7;--base-side:#a4a4a1;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--wall:#dedbd3;--wall-top:#efece6;--wall-side:#c6c2ba;--steel:#d3d4d0;--steel-top:#ebebe8;--steel-side:#b2b3af;--door:#e6e6e3;--door-top:#f6f6f4;--door-side:#c4c5c2;--chrome:#d9dad8;--chrome-top:#f4f4f2;--chrome-side:#bdbebc;--brass:#cfa95d;--brass-top:#e8c985;--brass-side:#ab8743;--rubber:#2e2e2d;--rubber-top:#474745;--dial-ink:#ecebe6;--vault:#8b8b87;--vault-top:#a3a39f;--vault-side:#6f6f6c;--gold:#e0b44c;--gold-top:#f2d27d;--gold-side:#b88a2e;--cash:#9fb89a;--cash-top:#c2d4bb;--cash-side:#809a7c;--band:#f3ecd9;--velvet:#7d2f3c;--velvet-top:#9a4150;--velvet-side:#5e2230;--lamp:#ffd27a;--seam:#3a3a38;--sheen:.55;--spill:.22}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--base-top:#bebeba;--base-side:#737372;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--wall:#bab8b3;--wall-top:#e0ddd7;--wall-side:#8a8986;--steel:#b2b2b0;--steel-top:#dcdcd9;--steel-side:#7d7d7c;--door:#c2c2c0;--door-top:#e6e6e4;--door-side:#8a8b89;--chrome:#b7b7b6;--chrome-top:#e4e4e2;--chrome-side:#858585;--brass:#ae8e4d;--brass-top:#d9bc7c;--brass-side:#785e2d;--rubber:#252524;--rubber-top:#424240;--dial-ink:#d9d9d6;--vault:#747472;--vault-top:#989894;--vault-side:#4c4c4b;--gold:#bd973f;--gold-top:#e2c475;--gold-side:#81601d;--cash:#859b81;--cash-top:#b5c6af;--cash-side:#596c56;--band:#cdc7b7;--velvet:#682631;--velvet-top:#903c4a;--velvet-side:#40151f;--lamp:#ffd88a;--seam:#1c1c1b;--line:#444443;--sheen:.25;--spill:1}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.top.base{fill:var(--base-top)}.side.base{fill:var(--base-side)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
.wall{fill:var(--wall)}.top.wall{fill:var(--wall-top)}.side.wall{fill:var(--wall-side)}.steel{fill:var(--steel)}.top.steel{fill:var(--steel-top)}.side.steel{fill:var(--steel-side)}.door{fill:var(--door)}.top.door{fill:var(--door-top)}.side.door{fill:var(--door-side)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.brass{fill:var(--brass)}.top.brass{fill:var(--brass-top)}.side.brass{fill:var(--brass-side)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}.vault{fill:var(--vault)}.top.vault{fill:var(--vault-top)}.side.vault{fill:var(--vault-side)}.gold{fill:var(--gold)}.top.gold{fill:var(--gold-top)}.side.gold{fill:var(--gold-side)}.cash{fill:var(--cash)}.top.cash{fill:var(--cash-top)}.side.cash{fill:var(--cash-side)}.velvet{fill:var(--velvet)}.top.velvet{fill:var(--velvet-top)}.side.velvet{fill:var(--velvet-side)}
.hatch{fill:url(#hatch);stroke:none;pointer-events:none}.hl{stroke:var(--line);stroke-width:.5;opacity:.4}.ring{fill:none;stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke;opacity:.4}.seam{fill:none;stroke:var(--seam);stroke-width:1.6;vector-effect:non-scaling-stroke}.sheen{fill:#fff;opacity:var(--sheen);pointer-events:none}.hi{fill:none;stroke:#fff;stroke-width:.9;stroke-linecap:round;opacity:.7;pointer-events:none}.band{fill:var(--band);stroke:var(--line);stroke-width:.4;vector-effect:non-scaling-stroke}
.ball{fill:url(#ball);stroke:var(--line);stroke-width:.9;vector-effect:non-scaling-stroke}.num{fill:var(--dial-ink);font:600 1.9px ui-monospace,monospace;text-anchor:middle;stroke:none}.tick{fill:none;stroke:var(--dial-ink);stroke-width:.25}
.lamp>.core{fill:var(--off)}.lamp>.halo{opacity:0}.lamp.g>.core{fill:var(--ok);filter:url(#glow)}.lamp.g>.halo{fill:var(--ok);opacity:.5;filter:url(#bloom)}
.shade{fill:#0c0c0b;pointer-events:none}.pool,.spill{opacity:0;pointer-events:none}.sparkle{fill:#fff;opacity:0;pointer-events:none}.key-glow{fill:var(--accent);opacity:.45;filter:url(#bloom);pointer-events:none}
.wheel{cursor:grab;touch-action:none}.dragging,.dragging .wheel{cursor:grabbing}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="ball" cx=".5" cy=".5" r=".6" fx=".36" fy=".3"><stop offset="0" style="stop-color:var(--chrome-top)"/><stop offset=".6" style="stop-color:var(--chrome)"/><stop offset="1" style="stop-color:var(--chrome-side)"/></radialGradient>
<radialGradient id="lampPool"><stop offset="0" style="stop-color:var(--lamp)" stop-opacity=".9"/><stop offset=".55" style="stop-color:var(--lamp)" stop-opacity=".32"/><stop offset="1" style="stop-color:var(--lamp)" stop-opacity="0"/></radialGradient>
<pattern id="hatch" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0,0V4" class="hl"/></pattern>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,addEventListener,kit}=env;
/* HALVARD V–40 vault door. World: x lower-right; y lower-left (front faces +y); z up. 1 unit ≈ 1.5 cm.
Part                          x      y      z      w      d      h
wall section (cut, hatched) −10      0      0    220     24    212   stone face, skirting, plaque 70–130 × 192–204 with a lamp
frame ring              c 100 · 104: r 67–84, y 24–32 (8 proud)       sixteen frame bolts, the seam round the door
threshold step               62     24      0     76     16     12
rails (crane carriage)        2     24  44/158     12     70      6   the hinge column rides them out 40
chamber (through doorway)    30   −110     30    140    110    150   lining 0–32; deposit boxes left and back, pedestal
door                c 100 32 104: flange r 66 × 10, bolt band r 60 × 16, back step r 54 × 12 (38 deep)
bolts (16)                    r 3, round the band at w −18: drawn back to r 66, thrown to r 75 into the frame
wheel                         hub r 10 × 13; eight spokes to r 46 and a rim r 32 in the plane w 10; ball knobs r 4.4
dial (dress)                  door (40, −40): ring r 7.6, knob r 4 × 3.4
hinge                         column r 7 at x 8 (y 39 shut, 79 drawn out), z 56–152; straps at z 76 and 132 to u −46
Motion: the wheel turns once (bolts drawn), the door is drawn straight out 40 on the rails, then swings 102° on the
column; closing runs it back. Depth: the door re-stacks its steps when it turns past 45°; while it's in the frame only
what's out of it is drawn. */
const svg=document.getElementById('machine'),draw=document.getElementById('drawing');let root=draw;
const{C,S,P,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,box,cylinder,frame}=kit(()=>root);
// Figure helpers: vectors, oriented planes, tubes and boxes (the turntable's arm helpers), pins.
const{cos,sin,PI}=Math,RAD=PI/180,f2=v=>(+v).toFixed(2),VW=[1,1,1],into=g=>root=g,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(Math.hypot(...a)||1));
const plane=(o,U,V)=>`matrix(${[...P(...U),...P(...V),...P(...o)].map(f2).join(' ')})`;
function axes(n){n=unit(n);const U=unit(Math.abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U);const a=P(...U),b=P(...V);if(a[0]*b[1]-a[1]*b[0]<0)V=mul(V,-1);return[U,V];}
function stadium(n,c0,c1,r){let A=sub(c1,c0);if(dot(A,VW)<0){[c0,c1]=[c1,c0];A=mul(A,-1);}const[U,V]=axes(A),pu=P(...U),pv=P(...V),d=P(...A),det=pu[0]*pv[1]-pv[0]*pu[1]||1e-9,u=(d[0]*pv[1]-pv[0]*d[1])/det,v=(pu[0]*d[1]-d[0]*pu[1])/det,l=Math.hypot(u,v)||1,tx=-v*r/l,ty=u*r/l;
set(n,'transform',plane(c0,U,V));set(n,'d',`M${f2(tx)},${f2(ty)}A${r},${r} 0 0 1 ${f2(-tx)},${f2(-ty)}L${f2(u-tx)},${f2(v-ty)}A${r},${r} 0 0 1 ${f2(u+tx)},${f2(v+ty)}Z`);return[c1,U,V];}
function tube(g,m){return{b:el('path',{class:'face '+m},g),c:circle(el('g',{},g),0,0,1,'face top '+m).parentNode};}
function tb(t,c0,c1,r){const[e,U,V]=stadium(t.b,c0,c1,r);set(t.c,'transform',plane(e,U,V)+` scale(${r})`);}
function obox(g,m){const s=[0,1,2].map(()=>el('path',{},g));s.m=m;return s;}
function obx(s,c,a,b,h){let i=0;for(const[n,p,q]of[[a,b,h],[b,h,a],[h,a,b]])for(const k of[1,-1]){const N=mul(n,k);if(dot(N,VW)<=0)continue;const f=add(c,N),u=unit(N);set(s[i],'d',poly([add(add(f,p),q),add(sub(f,p),q),sub(sub(f,p),q),sub(add(f,p),q)],true));set(s[i++],'class','face '+(u[2]>.6?'top ':u[0]>u[1]?'side ':'')+s.m);}for(;i<3;i++)set(s[i],'d','');}
function pin(g,x,y,r=.8){circle(g,x,y,r,'face top');line(g,x-r*.5,y+r*.35,x+r*.5,y-r*.35);}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
const ctl=(g,label,extra={})=>{for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0','aria-label':label,...extra}))set(g,k,v);return g;};
const ring=(r0,r1)=>`M${-r1},0A${r1},${r1} 0 1 0 ${r1},0A${r1},${r1} 0 1 0 ${-r1},0ZM${-r0},0A${r0},${r0} 0 1 0 ${r0},0A${r0},${r0} 0 1 0 ${-r0},0Z`;
// Shadows (the ground's, and the door's own once it's out), the warm light an open vault spills.
const sh=P(92,58,0);el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]+3),rx:158,ry:50,class:'shadow stage-floor'});el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]+3),rx:158,ry:50,class:'stage-contact'});
const spill=el('ellipse',{rx:58,ry:40,fill:'url(#lampPool)',class:'spill'},group(TOP(100,74,.05)));
// The wall section: its cut faces (right, top: hatched), the face with the doorway, skirting, plaque and lamp.
const WR=group(SIDE(210,24,212));rect(WR,0,0,24,212,0,'face side wall');rect(WR,0,0,24,212,0,'hatch');line(WR,0,6,24,6);
const WF=group(FRONT(-10,24,212));el('path',{d:`M0,0H220V212H0ZM26,108A84,84 0 1 0 194,108A84,84 0 1 0 26,108Z`,'fill-rule':'evenodd',class:'face wall'},WF);
rect(WF,0,201,220,11,0,'face base');for(const u of[18,202])line(WF,u,6,u,201);line(WF,4,6,216,6);
const PL=group(FRONT(70,24.06,205));rect(PL,0,0,60,13,1.6,'face brass');rect(PL,1.6,1.6,56.8,9.8,1,'detail');text(PL,27,8.6,'HALVARD','label brand center');pin(PL,3.6,6.5,.7);
const lamp=el('g',{class:'lamp'},PL);circle(lamp,52,6.5,3.6,'halo');circle(lamp,52,6.5,2.6,'face recess');circle(lamp,52,6.5,1.7,'core');
rect(group(TOP(-10,0,212)),0,0,220,24,0,'face top wall');rect(group(TOP(-10,0,212.02)),0,0,220,24,0,'hatch');
// The frame ring's outer side, then the chamber through the doorway, then the ring's face over both.
stadium(el('path',{class:'face side steel'}),[100,24,104],[100,32,104],84);
const DF=svg.querySelector('defs');
el('circle',{r:67,transform:FRONT(100,32,104)},el('clipPath',{id:'doorway'},DF));el('circle',{r:67,transform:FRONT(100,0,104)},el('clipPath',{id:'chamber'},DF));
const TUN=el('g',{'clip-path':'url(#doorway)'});circle(group(FRONT(100,32,104),TUN),0,0,67,'face top vault');for(const y of[22,11])circle(group(FRONT(100,y,104),TUN),0,0,67,'ring');
const CH=ctl(el('g',{'clip-path':'url(#chamber)'},TUN),'Change what the vault holds (C)',{tabindex:'-1'});into(CH);
const BW=group(FRONT(30,-110,180));rect(BW,0,0,140,150,0,'face vault');const LW=group(SIDE(30,0,180));rect(LW,0,0,110,150,0,'face side vault');
const boxes=(g,cols,u0)=>{for(let i=0;i<cols;i++)for(let j=0;j<9;j++){const u=u0+i*13,v=44+j*11.2;rect(g,u,v,12,10.2,.8,'face brass');rect(g,u+2,v+3.6,4.2,2.8,.4,'face top brass');circle(g,u+9.2,v+5.1,.95,'face recess');}};
boxes(BW,10,5);boxes(LW,8,3);
const FL=group(TOP(30,-110,30));rect(FL,0,0,140,110,0,'face vault');for(let u=28;u<140;u+=28)line(FL,u,0,u,110);for(let v=22;v<110;v+=22)line(FL,0,v,140,v);
const pool=el('ellipse',{cx:44,cy:78,rx:62,ry:44,fill:'url(#lampPool)',class:'pool'},FL);
const PX=50,PY=-38,PZ=30,TOPZ=PZ+30;box(PX,PY,PZ,46,30,30,2,'vault');{const g=group(FRONT(PX,PY+30.05,TOPZ));rect(g,4,4,38,22,1.5,'detail');}
function ingot(x,y,z){const W=18,D=8,H=5,i=1.9,j=1.2,b=[[x,y,z],[x+W,y,z],[x+W,y+D,z],[x,y+D,z]],t=[[x+i,y+j,z+H],[x+W-i,y+j,z+H],[x+W-i,y+D-j,z+H],[x+i,y+D-j,z+H]];
el('path',{d:poly([b[3],b[2],t[2],t[3]],true),class:'face gold'});el('path',{d:poly([b[2],b[1],t[1],t[2]],true),class:'face side gold'});el('path',{d:poly(t,true),class:'face top gold'});rect(group(TOP(x+i,y+j,z+H+.02)),2.8,1.2,W-2*i-5.6,D-2*j-2.4,.4,'detail');}
function bundle(x,y,z){box(x,y,z,13,6,2.4,.5,'cash');rect(group(TOP(x,y,z+2.42)),5,0,3,6,0,'band');const f=group(FRONT(x,y+6.02,z+2.4));rect(f,5,0,3,2.4,0,'band');line(f,1,1.2,4,1.2);line(f,9,1.2,12,1.2);}
const IN=[0,1,2].map(()=>el('g',{}));
into(IN[0]);for(const[i,j,k]of[[0,0,0],[0,1,0],[0,2,0],[1,0,0],[1,1,0],[1,2,0],[0,.5,1],[0,1.5,1],[1,.5,1],[1,1.5,1],[.5,1,2]])ingot(PX+3+i*20,PY+2+j*9,TOPZ+k*5);
into(IN[1]);for(const[x,y,n]of[[5,2,5],[5,12,3],[21,2,4],[21,12,5],[13,22,2]])for(let k=0;k<n;k++)bundle(PX+x,PY+y,TOPZ+k*2.45);
into(IN[2]);box(PX+10,PY+4,TOPZ,26,22,4.6,2.6,'velvet');{const g=group(TOP(PX+10,PY+4,TOPZ+4.62));rect(g,2.4,2.4,21.2,17.2,2,'detail');}
const KEY=[PX+23,PY+15,TOPZ+15],keyGlow=el('ellipse',{rx:24,ry:13,class:'key-glow'}),keyP=el('g',{});
el('path',{d:'M-9.4,-6.2A6.2,6.2 0 1 0 -9.4,6.2A6.2,6.2 0 1 0 -9.4,-6.2ZM-9.4,-2.6A2.6,2.6 0 1 1 -9.4,2.6A2.6,2.6 0 1 1 -9.4,-2.6Z','fill-rule':'evenodd',class:'face brass'},keyP);
rect(keyP,-3.6,-1.4,18,2.8,1,'face brass');rect(keyP,-4.4,-2.3,2.2,4.6,.7,'face top brass');el('path',{d:'M8.4,1.4V7.2H10.2V5.2H11.8V7.2H13.6V3.6H12.6V1.4Z',class:'face brass'},keyP);line(keyP,-1,0,13,0);
into(CH);
const SPARK=[[[PX+15,PY+12,TOPZ+15],[PX+6,PY+4,TOPZ+5.2],[PX+38,PY+26,TOPZ+5.2]],[[PX+10,PY+4,TOPZ+12.3],[PX+26,PY+4,TOPZ+9.9],[PX+18,PY+26,TOPZ+5]],[[KEY[0]-6,KEY[1],KEY[2]+5],[KEY[0]+8,KEY[1],KEY[2]-6],[KEY[0]-12,KEY[1],KEY[2]-2]]].map(list=>list.map(p=>{const q=P(...p),g=el('g',{transform:`translate(${f2(q[0])} ${f2(q[1])})`});el('path',{d:'M0,-3.4L.55,-.55L3.4,0L.55,.55L0,3.4L-.55,.55L-3.4,0L-.55,-.55Z',class:'sparkle'},g);return g.firstChild;}));
const shade=el('rect',{x:-2,y:-114,width:177,height:122,class:'shade'});
into(draw);
const RF=group(FRONT(100,32,104));el('path',{d:ring(67,84),'fill-rule':'evenodd',class:'face steel'},RF);circle(RF,0,0,80.5,'ring');circle(RF,0,0,70.5,'ring');
for(let k=0;k<16;k++){const a=(k+.5)*22.5*RAD;circle(RF,f2(75.5*cos(a)),f2(75.5*sin(a)),2,'face top steel');circle(RF,f2(75.5*cos(a)),f2(75.5*sin(a)),.9,'detail');}
circle(RF,0,0,66.6,'seam');
// The threshold step, and the crane's rails on the frame's left.
box(62,24,0,76,16,12,1.6,'base');{const g=group(TOP(62,24,12.02));for(const u of[19,38,57])line(g,u,1,u,15);}
const slides=[50,152].map(z=>{box(-1,24,z-4,18,5,14,1.2,'base');return{z,s:obox(el('g',{}),'steel'),t:obox(el('g',{}),'chrome')};});
// The door: its steps, the ring of bolts, the face (spun rings, sheen, dial) and wheel; its back with the boltwork;
// the hinge straps and column. Built once, posed from its draw-out and angle.
const doorG=el('g',{});
const backB=el('path',{class:'face side door'},doorG),boltFar=el('g',{},doorG),bandB=el('path',{class:'face side door'},doorG),boltG=el('g',{},doorG);
const BOLTS=[...Array(16)].map((_,k)=>{const a=(k+.5)*22.5*RAD;return{d:[cos(a),sin(a)],t:tube(boltG,'chrome')};});
const flangeB=el('path',{class:'face side door'},doorG),frontG=el('g',{},doorG);
const front=ctl(el('g',{},frontG),'Vault door, dial 0 20 40 60 80: open or close it (Space)');
circle(front,0,0,66,'face door');el('path',{d:ring(62.4,66),'fill-rule':'evenodd',class:'face top door'},front);circle(front,0,0,62.4,'detail');for(const r of[57,49,40])circle(front,0,0,r,'ring');
for(const a of[-135,45]){const a0=(a-10)*RAD,a1=(a+10)*RAD,q=(r,t)=>`${f2(r*cos(t))},${f2(r*sin(t))}`;el('path',{d:`M${q(14,a0)}L${q(62,a0)}A62,62 0 0 1 ${q(62,a1)}L${q(14,a1)}A14,14 0 0 0 ${q(14,a0)}Z`,class:'sheen'},front);}
const dialG=group('translate(40 -40)',front);circle(dialG,0,0,9.4,'face chrome');circle(dialG,0,0,8.6,'detail');const dialRot=el('g',{},dialG);circle(dialRot,0,0,7.6,'face rubber');
for(let n=0;n<100;n+=2){const a=-n*3.6*RAD,r0=n%10?6.9:6.4;line(dialRot,f2(r0*sin(a)),f2(-r0*cos(a)),f2(7.4*sin(a)),f2(-7.4*cos(a)),'tick');if(n%20===0){text(group(`rotate(${-n*3.6})`,dialRot),0,-4.9,String(n),'num');dialRot.append(' ');}}
el('path',{d:'M-.9,-9.1L.9,-9.1L0,-7.7Z',fill:'var(--ink)'},dialG);
const knobB=el('path',{class:'face rubber'},doorG),knobC=el('g',{},doorG);circle(knobC,0,0,4,'face top rubber');const knobR=el('g',{},knobC);for(let i=0;i<16;i++){const a=i*22.5*RAD;line(knobR,f2(3.3*sin(a)),f2(-3.3*cos(a)),f2(3.9*sin(a)),f2(-3.9*cos(a)),'tick');}line(knobR,0,-.6,0,-3,'tick');
const wheelG=ctl(el('g',{class:'wheel'},doorG),'Wheel: turn it to open or close the door (Space)');
const hubB=el('path',{class:'face chrome'},wheelG),spin=el('g',{},wheelG);
for(let k=0;k<8;k++){const g=group(`rotate(${k*45+22.5})`,spin);rect(g,9,-2.3,37.6,4.6,2.3,'face chrome');line(g,11,-.9,44.6,-.9,'hi');}
el('path',{d:ring(29.6,34.4),'fill-rule':'evenodd',class:'face chrome'},spin);el('path',{d:'M-24.6,-20.3A32,32 0 0 1 9.5,-30.6',class:'hi'},spin);
const KNOBS=[...Array(8)].map(()=>el('circle',{r:f2(4.4*1.2247),class:'ball'},wheelG));
const hubC=el('g',{},wheelG);circle(hubC,0,0,10,'face top chrome');circle(hubC,0,0,6,'face brass');circle(hubC,0,0,6,'detail');for(let k=0;k<6;k++){const a=k*60*RAD;pin(hubC,8.1*cos(a),8.1*sin(a),.7);}text(hubC,0,1.4,'H','label center');
const wheelPad=el('g',{},wheelG);circle(wheelPad,0,0,55,'hit');circle(wheelPad,0,0,57,'focus-ring');
const strapG=el('g',{},doorG),straps=[-28,28].map(v=>({v,s:obox(el('g',{},strapG),'steel'),f:el('g',{},strapG)}));
for(const s of straps)for(const u of[-11,0,11])pin(s.f,u,0,1.5);
const backCtl=ctl(el('g',{},doorG),'Close the door (Space)',{tabindex:'-1'}),backG=el('g',{},backCtl);el('path',{d:ring(60,66),'fill-rule':'evenodd',class:'face door'},backG);
const bandBackG=el('g',{},backCtl);el('path',{d:ring(54,60),'fill-rule':'evenodd',class:'face door'},bandBackG);
const capG=el('g',{},backCtl);circle(capG,0,0,54,'face door');circle(capG,0,0,48,'face glass');
for(let k=0;k<16;k++){const a=k*22.5*RAD;rect(group(`rotate(${k*22.5})`,capG),11,-1,35,2,1,'face chrome');pin(capG,46*cos(a),46*sin(a),.8);}
circle(capG,0,0,11,'face chrome');circle(capG,0,0,7,'detail');{const g=group('translate(0 -28)',capG);rect(g,-11,-7,22,14,1.4,'face base');rect(g,-9,-5,18,10,1,'detail');text(g,0,1,'LOCK CASE','etch micro center');}
rect(capG,-2,6,4,18,2,'face top chrome');circle(capG,0,0,3.4,'face top chrome');
for(const a of[-135,45]){const a0=(a-9)*RAD,a1=(a+9)*RAD,q=(r,t)=>`${f2(r*cos(t))},${f2(r*sin(t))}`;el('path',{d:`M${q(13,a0)}L${q(47,a0)}A47,47 0 0 1 ${q(47,a1)}L${q(13,a1)}A13,13 0 0 0 ${q(13,a0)}Z`,class:'sheen'},capG);}
text(capG,0,36,'HALVARD · V–40','etch center');text(capG,0,40.4,'NO. 2617 · INSPECT YEARLY','etch micro center');circle(capG,0,0,56,'focus-ring');
const slideG=el('g',{},doorG);into(slideG);for(const z of[50,152])box(1,32,z,14,14,6,1.4,'steel');const col=cylinder(8,39,56,7,96,'z','chrome');circle(col.face,0,0,3,'detail');into(draw);
// Lugs, rails and the step sit behind the door's sweep; nothing is drawn after it.
frame([[-10,0,0,220,32,212],[-26,90,36,74,162,136]],14);
// State: one sequence, run forward to open and back to close: the wheel turns once (the bolts draw back), the door is
// drawn out, then swings on its spring (it starts slow and settles with a little give). A drag on the wheel turns it by
// hand, a little behind the pointer; past three quarters it carries on and opens, short of that it springs back.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),HK={};
document.querySelectorAll('.hint [data-k]').forEach(b=>HK[b.dataset.k]=b);
const T_TURN=1150,T_DRAW=950,T_SWING=2600,T_ALL=T_TURN+T_DRAW+T_SWING,A=T_TURN/T_ALL,B=(T_TURN+T_DRAW)/T_ALL,OPEN=102,OUT=40,COMMIT=270;
const WHAT=['GOLD','CASH','KEY'],HOLDS=['gold bars','bundles of cash','a single key'];
const eio=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2,smooth=t=>t*t*(3-2*t);
let want=false,p=0,dir=-1,wheel=0,wheelV=0,bolt=0,d=0,theta=0,thetaV=0,dial=0,dialFrom=0,dialTo=0,dialT0=-1e9,drag=null,light=0,litT=0,sparkT=-1e9,inside=0,note='',noteT=0,last=0,outKey='',drawn='',shownFront=null,lastLight=-1,lastNotch=0,settled=true;
const say=m=>{announcement.textContent=m;},notice=(m,a)=>{note=m;noteT=performance.now()+1600;if(a)say(a);};
let ac=null,nb=null;
function audio(){try{if(!ac){const W=window.AudioContext||window.webkitAudioContext;if(!W)return null;ac=new W();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
function tone(f,dur,v,type='sine',when=0,f1=0){const a=ac;if(!a)return;const t=a.currentTime+when,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+.03);}
function hiss(dur,v,f,q=1,when=0){const a=ac;if(!a)return;if(!nb){nb=a.createBuffer(1,a.sampleRate,a.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}const t=a.currentTime+when,s=a.createBufferSource(),b=a.createBiquadFilter(),g=a.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;b.Q.value=q;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(b);b.connect(g);g.connect(a.destination);s.start(t,0,dur+.05);}
const notch=()=>{hiss(.03,.02,2200,3);tone(520,.04,.008,'square');},kachunk=()=>{for(let i=0;i<3;i++)hiss(.05,.025,1400+i*300,2,i*.07);tone(110,.25,.06,'sine',.2,55);},rumble=()=>hiss(2.2,.012,140,.6),thunk=()=>{tone(58,.4,.08,'sine',0,36);hiss(.2,.03,320,.8);};
function sync(){const open=want;set(HK[' '],'aria-pressed',open);set(backCtl,'tabindex',open&&p>B?'0':'-1');set(CH,'tabindex',open&&p>=1?'0':'-1');set(CH,'aria-label',`The vault holds ${HOLDS[inside]}: change it (C)`);set(wheelG,'aria-pressed',open);}
function toggle(){audio();want=!want;settled=false;if(want){if(p===0)dir=-1;say(`Opening: the wheel turns once, the bolts draw back and the door swings open on its hinge, with ${HOLDS[inside]} inside.`);}else say('Closing: the door swings shut, the wheel turns back and the bolts are thrown.');sync();}
function contents(){audio();inside=(inside+1)%3;IN.forEach((g,i)=>set(g,'display',i===inside?'inline':'none'));sparkT=performance.now();notice(`CONTENTS · ${WHAT[inside]}`,`The vault now holds ${HOLDS[inside]}.`);sync();}
// The door posed: draw-out d along the frame's axis, angle th on the hinge column, and a wheel angle wh.
const ORDER_F=[backB,boltFar,bandB,boltG,flangeB,frontG,knobB,knobC,wheelG,strapG,slideG],ORDER_B=[slideG,flangeB,backCtl];
function drawDoor(dd,th,wh){const a=th*RAD,c=cos(a),s=sin(a),U=[c,s,0],V=[0,0,-1],N=[-s,c,0],hy=39+dd,F=[8+92*c+7*s,hy+92*s-7*c,104],at=(u,v,w)=>[F[0]+u*U[0]+w*N[0],F[1]+u*U[1]+w*N[1],F[2]-v],fr=c>s,cut=th>.01?-99:-dd;
if(fr!==shownFront){shownFront=fr;for(const n of[...ORDER_F,...ORDER_B])set(n,'display','none');for(const n of fr?ORDER_F:ORDER_B){set(n,'display','inline');doorG.appendChild(n);}
if(!fr){for(const n of[boltFar,bandB,boltG])backCtl.insertBefore(n,bandBackG);backCtl.insertBefore(backB,capG);for(const n of[boltFar,bandB,boltG,backB])set(n,'display','inline');}}
set(slideG,'transform',`translate(${f2(-dd*C)} ${f2(dd*S)})`);for(const sl of slides){const y1=33+dd;obx(sl.s,[8,28.5,sl.z+3],[6,0,0],[0,3.6,0],[0,0,3]);obx(sl.t,[8,(29+y1)/2,sl.z+3],[4.4,0,0],[0,(y1-29)/2,0],[0,0,2.2]);}
const step=(n,w0,w1,r)=>{const a0=Math.max(w0,cut),a1=w1;if(a1-a0<.05){set(n,'d','');return;}stadium(n,at(0,0,a0),at(0,0,a1),r);};
step(flangeB,-10,0,66);step(bandB,-26,-10,60);step(backB,-38,-26,54);
const showBolts=th>.01||dd>18;for(const g of[boltG,boltFar])set(g,'display',showBolts?'inline':'none');
if(showBolts){const mid=at(0,0,-18),tip=66+9*(1-bolt);for(const b of BOLTS){const dv=add(mul(U,b.d[0]),mul(V,b.d[1])),g=dot(dv,VW)>0?boltG:boltFar;if(b.t.b.parentNode!==g)g.append(b.t.b,b.t.c);tb(b.t,add(mid,mul(dv,59.4)),add(mid,mul(dv,tip)),3);}}
if(fr){set(frontG,'transform',plane(F,U,V));const dc=at(40,-40,0),dk=add(dc,mul(N,3.4));stadium(knobB,dc,dk,4);set(knobC,'transform',plane(dk,U,V));set(dialRot,'transform',`rotate(${f2(dial*3.6)})`);set(knobR,'transform',`rotate(${f2(dial*3.6)})`);
stadium(hubB,F,add(F,mul(N,13)),10);const wp=add(F,mul(N,10));set(spin,'transform',plane(wp,U,V)+` rotate(${f2(wh)})`);set(wheelPad,'transform',plane(wp,U,V));
KNOBS.forEach((k,i)=>{const r=(i*45+22.5+wh)*RAD,q=P(...add(wp,add(mul(U,48.5*cos(r)),mul(V,48.5*sin(r)))));set(k,'cx',f2(q[0]));set(k,'cy',f2(q[1]));});
set(hubC,'transform',plane(add(F,mul(N,13)),U,V)+` rotate(${f2(wh)})`);
for(const st of straps){obx(st.s,at(-69,st.v,2),mul(U,23),[0,0,6],mul(N,2));set(st.f,'transform',plane(at(-62,st.v,4.02),U,V));}}
else{const Bk=mul(U,-1);set(backG,'transform',plane(at(0,0,-10),Bk,V));set(bandBackG,'transform',plane(at(0,0,-26),Bk,V));set(capG,'transform',plane(at(0,0,-38),Bk,V));}
}
function lit(n,c){if(n._c!==c){n._c=c;n.base??=n.getAttribute('class')||'';set(n,'class',n.base+(c?' '+c:''));}}
const spring=(x,v,t,w,z,dt)=>{v+=(w*w*(t-x)-2*z*w*v)*dt;return[x+v*dt,v];};
function ui(now){const r=`WHEEL ${Math.round(Math.abs(wheel))}° · BOLTS ${bolt<.01?'THROWN':bolt>.99?'DRAWN':'MOVING'} · DOOR ${Math.round(theta)}°`;
const st=now<noteT?note:drag&&drag.moved>.05?(Math.abs(drag.angle)<COMMIT?'TURNING THE WHEEL / KEEP GOING':'TURNING THE WHEEL / LET GO TO OPEN'):want?(p<A?'UNLOCKING / BOLTS DRAWING BACK':p<B?'UNLOCKED / DOOR DRAWING OUT':p<1||!settled?'DOOR SWINGING OPEN':`OPEN · ${WHAT[inside]} / SPACE CLOSES IT`):p>B?'DOOR SWINGING SHUT':p>A?'DOOR SEATING':p>0?'LOCKING / BOLTS THROWN':'LOCKED / SPACE OR THE WHEEL OPENS IT';
if(r+st!==outKey){outKey=r+st;readout.textContent=r;stateLabel.textContent=st;}}
function tick(now){const dt=Math.min(.05,(now-(last||now))/1000),red=reduced.matches;last=now;
// The sequence: forward to open, back to close; closing waits at the frame until the swing has settled shut.
if(!drag){const was=p;if(red)p=want?1:0;else if(want)p=Math.min(1,p+dt*1000/T_ALL);else{p=Math.max(0,p-dt*1000/T_ALL);if(p<B&&theta>.2)p=Math.max(p,B);}
if(was<A&&p>=A&&want)kachunk();if(was<B&&p>=B&&want)rumble();if(was>B&&p<=B&&!want)thunk();if(was>0&&p===0&&!want){kachunk();dialFrom=dial;dialTo=dial+100+Math.floor(Math.random()*100);dialT0=now;}}
const q1=clamp(p/A),q2=clamp((p-A)/(B-A)),q3=clamp((p-B)/(1-B));
if(drag){[wheel,wheelV]=spring(wheel,wheelV,drag.angle,red?60:11,.9,dt);if(red)wheel=drag.angle;bolt=clamp((Math.abs(wheel)/360-.15)/.85);}
else{const tw=dir*360*eio(q1);if(red){wheel=tw;wheelV=0;}else[wheel,wheelV]=spring(wheel,wheelV,tw,16,1,dt);bolt=clamp((q1-.15)/.85);}
d=OUT*smooth(q2);const tt=OPEN*smooth(q3);if(red){theta=tt;thetaV=0;}else{[theta,thetaV]=spring(theta,thetaV,tt,5.4,.62,dt);if(theta<0){theta=0;thetaV=0;}if(q3===0&&theta<.2){theta=0;thetaV=0;}}
if(!settled&&(want?p>=1&&Math.abs(theta-OPEN)<.3&&Math.abs(thetaV)<1.5:p===0)){settled=true;if(want){sparkT=now;say(`The vault is open, with ${HOLDS[inside]} inside. Space closes it.`);}else say('Shut and bolted: the vault is locked.');sync();}
const nn=Math.floor(Math.abs(wheel)/45);if(nn!==lastNotch){lastNotch=nn;if(ac)notch();}
dial=dialT0>0&&now-dialT0<1400&&!red?dialFrom+(dialTo-dialFrom)*(1-(1-(now-dialT0)/1400)**3):dialT0>0?dialTo:0;
const key=[d,theta,wheel,bolt,dial].map(v=>v.toFixed(3)).join('|');if(key!==drawn){drawn=key;drawDoor(d,theta,wheel);}
// The lamp, the chamber's light (it flickers on as the door swings), the spill, sparkles, the floating key.
lit(lamp,want||p>0?'g':'');
const on=theta>.6;if(on&&!litT)litT=now;if(!on)litT=0;const lt=on?(red||now-litT>420?1:[.2,1,.35,1,.6,1,1][Math.floor((now-litT)/60)]??1):0;light=red||lt>light?lt:Math.max(lt,light-dt*3.5);
if(light!==lastLight){lastLight=light;shade.style.opacity=f2((1-light)*.82);pool.style.opacity=f2(light*.8);spill.style.opacity=`calc(var(--spill) * ${f2(light)})`;}
const glow=light>0&&!red;SPARK.forEach((list,i)=>list.forEach((s,k)=>{const e=((now-sparkT)/1000-k*.35)%3.4,v=glow&&i===inside&&e>=0&&e<.5?sin(e/.5*PI):0;if(s._v!==v){s._v=v;s.style.opacity=f2(v);set(s,'transform',`scale(${f2(.4+.8*v)})`);}}));
if(inside===2&&light>0){const a=red?-16:-16+18*sin(now/1400),b=red?0:1.3*sin(now/950),q=P(KEY[0],KEY[1],KEY[2]-3);set(keyP,'transform',plane([KEY[0],KEY[1],KEY[2]+b],[1.3*cos(a*RAD),1.3*sin(a*RAD),0],[0,0,-1.3]));set(keyGlow,'cx',f2(q[0]));set(keyGlow,'cy',f2(q[1]));}
ui(now);requestAnimationFrame(tick);}
// Input: Space or Enter opens or closes it; so does a click on the wheel or the door; C changes what it holds.
// The wheel drags round (by hand it turns a little behind the pointer); the pointer's release is the real window's.
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented||e.repeat)return;const k=e.key;
if(k===' '||k==='Enter'){e.preventDefault();toggle();}else if(k==='c'||k==='C'){e.preventDefault();contents();}});
function wheelDown(e){if(e.button>0)return;e.preventDefault();audio();const m=svg.getScreenCTM?.();if(!m||want||p>0){drag={click:true,moved:0};return;}
const inv=m.inverse(),c=P(100,42,104),ang=ev=>{const q=new DOMPoint(ev.clientX,ev.clientY).matrixTransform(inv),u=(q.x-c[0])/C;return Math.atan2(q.y-c[1]-S*u,u);};
drag={a:ang(e),ang,moved:0,angle:wheel};e.currentTarget.setPointerCapture?.(e.pointerId);svg.classList.add('dragging');}
function wheelMove(e){if(!drag||!drag.ang)return;const a=drag.ang(e);let dl=a-drag.a;if(dl>PI)dl-=2*PI;if(dl<-PI)dl+=2*PI;drag.a=a;drag.moved+=Math.abs(dl);drag.angle=clamp(drag.angle+dl/RAD*.9,-380,380);}
function endDrag(tap){if(!drag)return;const g=drag;drag=null;svg.classList.remove('dragging');
if(g.moved<.06){if(tap)toggle();return;}
if(Math.abs(g.angle)>=COMMIT){dir=Math.sign(g.angle);p=Math.abs(wheel)/360*A;want=true;settled=false;say('The wheel is round: the bolts draw back and the door swings open.');sync();}else{p=0;bolt=0;notice('LOCKED / TURN THE WHEEL A FULL TURN','Turn the wheel all the way round to open the door.');}}
for(const g of[wheelG,front]){g.addEventListener('pointerdown',wheelDown);g.addEventListener('pointermove',wheelMove);}
addEventListener('pointerup',()=>endDrag(true));addEventListener('pointercancel',()=>endDrag(false));window.addEventListener('blur',()=>endDrag(false));
for(const g of[wheelG,front])g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)toggle();}});
bind(backCtl,()=>{if(want)toggle();});bind(CH,contents);
IN.forEach((g,i)=>set(g,'display',i===inside?'inline':'none'));sync();drawDoor(0,0,0);requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [' '], draw }
