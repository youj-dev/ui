// @ts-nocheck
/* SKARN GS–2 · Ground station. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--rubber:#2e2e2d;--dk:#3a3a39;--dk-top:#4a4a48;--dk-side:#2d2d2c;--pad:#d3d3cf;--pad-top:#e6e6e2;--pad-side:#c0c0bc;--dishin:#fbfbf9;--dish-edge:#e2e2de;--dback:#d2d2ce;--void:#262728;--rk:#3d3d3c;--rk-top:#4b4b49;--rk-side:#333332;--pane:#40505a;--pane-a:.22;--warm:#ffad3b;--orbit:#9a9a96;--cell:#34436b}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--rubber:#252524;--dk:#2f2f2f;--dk-top:#454543;--dk-side:#1d1d1c;--pad:#b2b2af;--pad-top:#d7d7d3;--pad-side:#878786;--dishin:#d4d4d2;--dish-edge:#bebebc;--dback:#b1b1ae;--void:#1e1f20;--rk:#323231;--rk-top:#464644;--rk-side:#212121;--pane:#34424b;--pane-a:.3;--warm:#ffb04a;--orbit:#81817e;--cell:#2a3759;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.rubber{fill:var(--rubber)}.dk{fill:var(--dk)}.top.dk{fill:var(--dk-top)}.side.dk{fill:var(--dk-side)}.pad{fill:var(--pad)}.top.pad{fill:var(--pad-top)}.side.pad{fill:var(--pad-side)}.rk{fill:var(--rk)}.top.rk{fill:var(--rk-top)}.side.rk{fill:var(--rk-side)}.dishin{fill:url(#dishG)}.dback,.top.dback,.side.dback{fill:var(--dback)}.void{fill:var(--void);stroke:none}.hole{fill-rule:evenodd}.cell{fill:var(--cell)}
.su,.sm,.sr{fill:none;stroke-linecap:round;stroke-linejoin:round}.su{stroke:var(--line)}.sm{stroke:var(--metal)}.sr{stroke:var(--rubber)}.seam{fill:none;stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke;opacity:.7}.joint{fill:none;stroke:var(--line);stroke-width:.5;opacity:.35}
.orbit{fill:none;stroke:var(--orbit);stroke-width:.9;stroke-dasharray:1.6 3.4;stroke-linecap:round}.trail{fill:none;stroke:var(--accent);stroke-width:1;stroke-linecap:round;opacity:.5}.beam{fill:none;stroke:var(--accent);stroke-width:.9;stroke-dasharray:3 4;opacity:0}.bglow{fill:none;stroke:var(--accent);stroke-width:5;opacity:0;filter:url(#bloom)}.pkt{fill:var(--accent);stroke:none;filter:url(#glow)}
.lamp{fill:var(--off);stroke:none}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.w{fill:var(--warm)}.lamp.g,.lamp.a,.lamp.r,.lamp.b,.lamp.w{filter:url(#glow)}.halo{opacity:0;filter:url(#bloom)}.halo.r{fill:var(--fault);opacity:.6}.halo.a{fill:var(--warn);opacity:.6}.halo.w{fill:var(--warm);opacity:.55}.halo.b{fill:var(--accent);opacity:.5}
.seg{fill:var(--off);stroke:none}.seg.g{fill:var(--ok)}.seg.a{fill:var(--warn)}.seg.g,.seg.a{filter:url(#glow)}.needle{stroke:var(--fault);stroke-width:.7;stroke-linecap:round}.tick{stroke:var(--ink);stroke-width:.3}.dial{fill:var(--top)}
.pane{fill:var(--pane);fill-opacity:var(--pane-a);stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke}.sheen{fill:#fff;opacity:.16;pointer-events:none}.blade{fill:var(--metal-top);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.blur{fill:var(--line);opacity:0;stroke:none}.pool{opacity:0}.olabel{fill:var(--muted);font:3.4px ui-monospace,monospace;letter-spacing:.8px;text-anchor:middle}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}.olabel{fill:var(--stage-muted)}}`

const defs = `<radialGradient id="dishG" cx=".5" cy=".5" r=".5"><stop offset=".2" style="stop-color:var(--dishin)"/><stop offset="1" style="stop-color:var(--dish-edge)"/></radialGradient>
<radialGradient id="warmG"><stop offset="0" style="stop-color:var(--warm);stop-opacity:.6"/><stop offset="1" style="stop-color:var(--warm);stop-opacity:0"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* SKARN GS–2. World: x lower-right, y lower-left, z up; 1 unit ≈ 10 cm. Dish axes: az from +x toward +y, el from the horizon.
Part                        x      y      z      w      d      h
concrete pad               24     24      0    172     80    2.4   expansion joints
dish plinth                44     54    2.4     36     36      4
pedestal column     r 10.5    62     72    6.4      –      –     32   access hatch, cable
azimuth bearing         r 14  62     72   38.4      –      –      5   ring gear, scale
azimuth drive              73     74   31.6      7      7     10   motor, status lamp
turning head            20 × 18 × 10 around 62 72 49, turns with az   cheeks to the el axis 62 72 60
elevation jack          head front → dish back, extends with el
dish                    r 46, f 36, vertex 12 ahead of the el axis      panel rings, seams, rim, hub
feed + struts           horn r 3.4 at the focus, 4 struts, LNA, red obstruction lamp
cable tray                 80     55      9     46      6    2.4   3 posts, entry hood on the shelter
shelter                   128     30    2.4     56     40     30   roof slab 125 27 32.4 62 46 3.2
 door / window          u 6–16 / 20–42 on the front wall (y 70)    racks behind at y 58–64
 signal meter             172     70     13     10    1.6     11   dial, 10-lamp bar, lock lamp
 HVAC                     184     38      8      6     22     18   fan
 beacon, GPS, door lamp   roof / above the door
pass arc               62 72 60 + (−60 110 40) → (110 −60 40), apex +64     AOS / LOS marks, satellite
Painter order: sky, pad, tray, shelter, pedestal, then the dish assembly sorted by which side faces the viewer; beam, packets, satellite on top. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: vectors, oriented planes, rods on any axis, outlined strokes, extrusions, lamps and controls.
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(Math.hypot(...a)||1)),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),RAD=Math.PI/180,f2=v=>v.toFixed(2);
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`,draw=root,into=g=>root=g;
function rod(a,b,r,cls='',cap=true){const ax=sub(b,a),n=unit(ax),U=unit(Math.abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U),pu=P(...U),pv=P(...V);if(pu[0]*pv[1]-pu[1]*pv[0]<0){V=mul(V,-1);pv=P(...V);}const pd=P(...ax),det=pu[0]*pv[1]-pv[0]*pu[1];if(Math.abs(det)<1e-6){const p=P(...a),q=P(...b),L=Math.hypot(q[0]-p[0],q[1]-p[1])||1,nx=-(q[1]-p[1])/L*r*1.2247,ny=(q[0]-p[0])/L*r*1.2247;el('path',{d:`M${f2(p[0]+nx)},${f2(p[1]+ny)}L${f2(q[0]+nx)},${f2(q[1]+ny)}L${f2(q[0]-nx)},${f2(q[1]-ny)}L${f2(p[0]-nx)},${f2(p[1]-ny)}Z`,class:'face '+cls});return null;}
const u=(pd[0]*pv[1]-pv[0]*pd[1])/det,v=(pu[0]*pd[1]-pd[0]*pu[1])/det,l=Math.hypot(u,v)||1,tx=-v*r/l,ty=u*r/l;
el('path',{d:`M${f2(tx)},${f2(ty)}A${r},${r} 0 0 1 ${f2(-tx)},${f2(-ty)}L${f2(u-tx)},${f2(v-ty)}A${r},${r} 0 0 1 ${f2(u+tx)},${f2(v+ty)}Z`,transform:plane(a,U,V),class:'face '+cls});if(!cap)return null;const g=group(plane(dot(n,[1,1,1])>0?b:a,U,V));circle(g,0,0,r,'face top '+cls);return g;}
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
function sk(d,w,cls,parent=root){el('path',{d,class:'su','stroke-width':w+.7},parent);return el('path',{d,class:cls,'stroke-width':w},parent);}
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const p of pts){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(const p of pts.reverse()){while(hi.length>1&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
function capsule(a,b,r,n=8){const t=Math.atan2(b[1]-a[1],b[0]-a[0]),o=[];for(const[c,s]of[[a,t+Math.PI/2],[b,t-Math.PI/2]])for(let i=0;i<=n;i++)o.push([c[0]+r*Math.cos(s+Math.PI*i/n),c[1]+r*Math.sin(s+Math.PI*i/n)]);return o;}
const closed=p=>'M'+p.map(q=>q.map(f2).join(',')).join('L')+'Z';
function extrude(o,x0,x1,cls=''){const A=o.map(([y,z])=>P(x0,y,z)),B=o.map(([y,z])=>P(x1,y,z));el('path',{d:closed(hull(A.concat(B))),class:'face side '+cls});return el('path',{d:closed(B),class:'face '+cls});}
function ann(g,R,r,cls){return el('path',{d:`M${R},0A${R},${R} 0 1 0 ${-R},0A${R},${R} 0 1 0 ${R},0ZM${r},0A${r},${r} 0 1 1 ${-r},0A${r},${r} 0 1 1 ${r},0Z`,class:'face hole '+cls},g);}
function lamp(g,x,y,r=1){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c,base='lamp'){if(n._c!==c){n._c=c;set(n,'class',base+(c?' '+c:''));}}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
function obox(c,U,V,N,w,d,h,cls='',r=1.5){const ax=[[U,w],[V,d],[N,h]];for(let i=0;i<3;i++)for(const s of[1,-1]){const n=mul(ax[i][0],s);if(dot(n,[1,1,1])<=.01)continue;const[B,lb]=ax[(i+1)%3],[C2,lc]=ax[(i+2)%3],o=add(add(add(c,mul(n,ax[i][1]/2)),mul(B,-lb/2)),mul(C2,-lc/2));rect(group(plane(o,B,C2)),0,0,lb,lc,r,'face '+(n[2]>.6?'top':n[0]>n[1]?'side':'')+' '+cls);}}
// Sky: the pass arc with AOS and LOS marks and the flown part of the track.
const E=[62,72,60],S0=add(E,[-60,110,40]),S1=add(E,[110,-60,40]),satAt=t=>add(add(mul(S0,1-t),mul(S1,t)),[0,0,64*Math.sin(Math.PI*t)]);
const arcPts=[];for(let i=0;i<=48;i++)arcPts.push(satAt(-.05+i*1.1/48));el('path',{d:smooth(arcPts),class:'orbit'});const trail=el('path',{class:'trail'});
for(const[t,l]of[[0,'AOS'],[1,'LOS']]){const q=P(...satAt(t));line(root,q[0],q[1]-2.6,q[0],q[1]+2.6);text(root,q[0],q[1]+8,l,'olabel');}
// Pad: concrete with expansion joints; warm light from the door spills onto it.
const sp=P(110,64,0);el('ellipse',{cx:sp[0],cy:sp[1]+5,rx:118,ry:66,class:'shadow stage-floor'});el('ellipse',{cx:sp[0],cy:sp[1]+5,rx:118,ry:66,class:'stage-contact'});
box(24,24,0,172,80,2.4,4,'pad');const pt=group(TOP(24,24,2.4));for(const u of[16,74,126])line(pt,u,3,u,77,'joint');line(pt,3,37,169,37,'joint');
const doorPool=el('ellipse',{cx:115,cy:54,rx:16,ry:10,fill:'url(#warmG)',class:'pool'},pt);
// Cable tray from the pedestal to the shelter: posts, ladder tray, cable bundle.
for(const x of[86,102,118])box(x,56.5,2.4,2,2,7,.6,'metal');box(80,55,9.4,44,5,1.8,.8,'metal');const tt=group(TOP(80,55,11.2));for(let u=3;u<44;u+=3.4)line(tt,u,.6,u,4.4);
sk(poly([[79,57.5,11.7],[124,57.5,11.7]]),1.5,'sr');
// Shelter: body, racks seen through the window and the doorway, front wall, meter, HVAC, roof and its lamps.
box(128,30,2.4,56,40,30,3,'');
const cp=el('clipPath',{id:'inside'},svg.querySelector('defs'));for(const q of[[[148,70,23.4],[170,70,23.4],[170,70,12.4],[148,70,12.4]],[[134,70,24.4],[144,70,24.4],[144,70,2.4],[134,70,2.4]]])el('polygon',{points:q.map(p=>P(...p).map(f2).join(',')).join(' ')},cp);
const inside=into(el('g',{'clip-path':'url(#inside)'}));rect(group(FRONT(120,70,40)),0,0,70,40,0,'void');rect(group(TOP(128,34,2.6)),0,0,56,36,0,'face base');
const RL=[];for(let i=0;i<5;i++){const x=131+i*7.2;box(x,58,2.6,6.4,6,22,.6,'rk');const f=group(FRONT(x,64,24.6));rect(f,.5,.5,5.4,21,.5,'detail');for(let v=3;v<21;v+=2.2){line(f,1,v,5.4,v);RL.push(lamp(f,4.6,v-1.1,.42));}if(i===2){rect(f,1,1.2,4.4,1.6,.3,'face screen');}}
into(draw);
const sf=group(FRONT(128,70,32.4));rect(sf,5.4,7.4,11.2,22.6,.8,'detail');el('path',{d:'M19.4,8.4h23.2v12.2h-23.2zM20,9v11h22v-11z',class:'face metal hole'},sf);rect(sf,20,9,22,11,.6,'pane');el('path',{d:'M24,9h5l-5,11h-5zM31,9h2l-5,11h-2z',class:'sheen'},sf);line(sf,31,9,31,20);
rect(sf,20,2.4,22,3.8,.6,'face top');text(sf,31,5.1,'SKARN · GS–2','etch micro center');rect(sf,8.8,3.6,4.4,2.2,.8,'face dk');const doorLamp=lamp(sf,11,5.2,.75),doorHalo=circle(sf,11,6,7,'halo');slits(sf,45,23,9,4,6);for(const[u,v]of[[2.4,2.4],[53.6,2.4],[53.6,27.6]])screw(sf,u,v);
box(172,70,13,10,1.6,11,1.5,'');const mf=group(FRONT(172,71.6,24));rect(mf,1,1,8,5.6,1,'face dial');for(let i=0;i<=10;i++){const a=(-50+i*10)*RAD;line(mf,5+4.4*Math.sin(a),6.4-4.4*Math.cos(a),5+(i%5?4.9:5.2)*Math.sin(a),6.4-(i%5?4.9:5.2)*Math.cos(a),'tick');}
const needle=line(mf,5,6.4,5,2.2,'needle');circle(mf,5,6.4,.6,'face dk');const BAR=[...Array(10)].map((_,i)=>rect(mf,1.2+i*.78,7.5,.56,1.3,.2,'seg'));const lockL=lamp(mf,8.2,10,.6);text(mf,1.2,10.6,'LOCK','etch micro');
box(184,38,8,6,22,18,2,'');const hv=group(SIDE(190,60,26));circle(hv,11,9,7.3,'face recess');const fan=group('translate(11 9)',hv);for(let i=0;i<5;i++)el('path',{d:'M0,-1.2Q2.8,-2.6 1.6,-6.4Q-1,-6.2 -1,-1.4Z',class:'blade',transform:`rotate(${i*72})`},fan);circle(hv,11,9,1.4,'face metal');for(const r of[7.3,5])circle(hv,11,9,r,'detail');slits(hv,2,1.5,18,2.2,9);
const sw=group(SIDE(184,70,32.4));rect(sw,3,1.4,15,3.8,.6,'face top');text(sw,10.5,4.1,'48 V DC','etch micro center');
box(125,27,32.4,62,46,3.2,2,'base');cylinder(132,33,35.6,2.2,1.2,'z','');rod([176,33,35.6],[176,33,50],.4,'metal');box(150,40,35.6,8,6,3,1,'');
cylinder(181,32,35.6,2,1.4,'z','dk');const bcn=cylinder(181,32,37,1.5,2.6,'z','glass'),bLamp=lamp(bcn.face,0,0,1.1),bp=P(181,32,38.4),bHalo=el('circle',{cx:bp[0],cy:bp[1],r:9,class:'halo'});
const leafG=el('g',{});function drawDoor(t){leafG.replaceChildren();const a=t*RAD,U=[Math.cos(a),Math.sin(a),0],out=Math.cos(a)-Math.sin(a)>0,g=group(plane([134,70.3,24.4],U,[0,0,-1]),leafG);rect(g,0,0,10,22,.8,out?'face':'face side');rect(g,1.5,1.5,7,8,.6,'detail');if(out){rect(g,8,10.4,1,3.4,.5,'face dk');}}
// Pedestal: plinth with anchor bolts, column with an access hatch, azimuth bearing and drive, cable to the tray.
box(44,54,2.4,36,36,4,2,'');const pl0=group(TOP(44,54,6.4));for(const[u,v]of[[4,4],[32,4],[4,32],[32,32]]){circle(pl0,u,v,1.3,'face metal');circle(pl0,u,v,.5,'face recess');}
cylinder(62,72,6.4,10.5,32,'z','');const hg=group(plane([62+10.5*Math.SQRT1_2,72+10.5*Math.SQRT1_2,27],[Math.SQRT1_2,-Math.SQRT1_2,0],[0,0,-1]));rect(hg,-3.2,0,6.4,11,1.4,'face side');rect(hg,-2.4,.8,4.8,9.4,1,'detail');circle(hg,1.7,5.5,.5,'face dk');
box(73,74,31.6,7,7,7,1.5,'dk');const azLamp=lamp(group(FRONT(73,81,38.6)),3.5,2.4,.7);
const br=cylinder(62,72,38.4,14,5,'z','metal');for(let i=0;i<36;i++){const a=i*10*RAD;line(br.face,(i%3?12.8:12)*Math.cos(a),(i%3?12.8:12)*Math.sin(a),13.9*Math.cos(a),13.9*Math.sin(a));}cylinder(76.6,77.6,38.6,2.4,4.6,'z','dk');
const CABLE=[[68,81,41.4],[72,81.6,34],[72.4,81.6,18],[73,80.4,8.4],[77,66,8],[80,57.5,11.7]];sk(smooth(CABLE),1.2,'sr');
// Dish assembly, rebuilt as it moves: turning head and cheeks, elevation jack, hub, reflector, struts, feed and obstruction lamp.
const asm=el('g',{}),FOC=36,R=46,NR=7;let feedLamp=null,feedPt=E,dishC=E,BS=[0,0,1];
function drawDish(az,elv){asm.replaceChildren();into(asm);
const a=az*RAD,e=elv*RAD,B=[Math.cos(e)*Math.cos(a),Math.cos(e)*Math.sin(a),Math.sin(e)],W=[Math.cos(a),Math.sin(a),0],U=[-Math.sin(a),Math.cos(a),0],Vd=[Math.sin(e)*Math.cos(a),Math.sin(e)*Math.sin(a),-Math.cos(e)];
const V=add(E,mul(B,12)),at=r=>add(V,mul(B,r*r/(4*FOC))),F=add(V,mul(B,FOC)),toward=dot(B,[1,1,1])>0,pl=c=>group(plane(c,U,Vd)),ring=(r,t)=>add(add(at(r),mul(U,r*Math.cos(t))),mul(Vd,r*Math.sin(t)));
const head=()=>{obox([62,72,48.4],W,U,[0,0,1],20,18,10,'');for(const s of[-1,1])obox(add([62,72,57],mul(U,s*8)),W,U,[0,0,1],12,2.4,13,'',1.2);rod(add(E,mul(U,-10)),add(E,mul(U,10)),2.3,'metal');const m=add(E,mul(U,10.2));rod(m,add(m,mul(U,3.4)),3.8,'dk');const mo=add(m,mul(U,1.7));rod(add(mo,[0,0,3]),add(add(mo,[0,0,3]),mul(W,-8)),2.1,'dk');};
const jack=()=>{const A=add([62,72,44],mul(W,8)),J=add(add(E,mul(B,5)),mul(Vd,16)),d=sub(J,A),L=Math.hypot(...d),u=mul(d,1/(L||1));rod(A,add(A,mul(u,8)),2.6,'dk');if(L>8.6)rod(add(A,mul(u,8)),J,1.4,'metal');};
const hub=()=>rod(E,add(V,mul(B,1.5)),6.6,'dk');
const struts=()=>{for(const t of[45,135,225,315])sk(poly([ring(R-.8,t*RAD),add(F,mul(B,-2))]),.9,'sm');};
const feed=()=>{rod(add(F,mul(B,-5)),add(F,mul(B,1)),3.4,'metal');rod(add(F,mul(B,1)),add(F,mul(B,6)),2.4,'dk');const c=rod(add(F,mul(B,6)),add(F,mul(B,7.4)),1.3,'glass');feedLamp=c?lamp(c,0,0,1):null;};
if(toward){head();jack();hub();for(let k=1;k<=NR;k++)circle(pl(at(R*k/NR)),0,0,R*k/NR,k===NR?'face dishin':'face dback');for(let k=1;k<NR;k++)circle(pl(at(R*k/NR)),0,0,R*k/NR,'seam');
for(let i=0;i<16;i++){const t=i*22.5*RAD,p=[];for(let k=1;k<=NR;k++)p.push(ring(R*k/NR,t));wire(p,'seam');}circle(pl(at(R/NR)),0,0,4.2,'face metal');ann(pl(at(R)),R,R-1.5,'metal');struts();feed();}
else{struts();feed();for(let k=NR;k>=1;k--)circle(pl(at(R*k/NR)),0,0,R*k/NR,'face dback');for(let i=0;i<16;i++){const t=i*22.5*RAD,p=[];for(let k=1;k<=NR;k++)p.push(ring(R*k/NR,t));wire(p,'seam');}hub();jack();head();}
into(draw);feedPt=add(F,mul(B,7.4));dishC=at(R);BS=B;}
const beamG=el('g',{}),bglow=el('path',{class:'bglow'},beamG),beam=el('path',{class:'beam'},beamG),pktG=el('g',{}),satG=el('g',{display:'none'});
rect(satG,-2.4,-1.9,4.8,3.8,.7,'face top');for(const s of[-1,1]){const x=s>0?3.4:-11.4;line(satG,s*2.4,0,s*3.4,0);rect(satG,x,-1.7,8,3.4,.3,'face cell');for(let k=1;k<4;k++)line(satG,x+k*2,-1.7,x+k*2,1.7);}el('ellipse',{cx:0,cy:2.6,rx:1.6,ry:.7,class:'face metal'},satG);const satLamp=lamp(satG,0,-2.6,.55);
frame([[24,24,0,172,80,3],[16,26,40,92,92,47],[125,27,30,62,46,22],[S0[0]-6,S0[1]-6,S0[2]-8,12,12,14],[S1[0]-6,S1[1]-6,S1[2]-8,12,12,14],[...add(satAt(.5),[-4,-4,-4]),8,8,10]],16);
// State: pass clock, rate-limited az/el pointing, lock, signal, packets, door; audio after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),hk={};
document.querySelectorAll('.hint [data-k]').forEach(b=>{hk[b.dataset.k]=b;});
const PASS=18000,STOW=[45,90],pk=[],PATH=()=>[feedPt,add(E,mul(BS,12)),E,...CABLE,[126,57.5,11.7]];
let az=45,elv=90,tAz=45,tEl=90,mode='stowed',passT0=0,satT=0,snr=0,gb=0,doorA=0,doorOpen=false,locked=false,nextPkt=0,fanA=0,last=0,lastUI=-1,drawn='',limit='',ac=null,hum=null;
const dirTo=p=>{const d=sub(p,E);return[(Math.atan2(d[1],d[0])/RAD+360)%360,Math.atan2(d[2],Math.hypot(d[0],d[1]))/RAD];},say=m=>{announcement.textContent=m;};
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();const o=ac.createOscillator(),f=ac.createBiquadFilter();o.type='sawtooth';o.frequency.value=58;f.type='lowpass';f.frequency.value=240;hum=ac.createGain();hum.gain.value=0;o.connect(f);f.connect(hum);hum.connect(ac.destination);o.start();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){}}
function tone(f,d=.15,v=.012,w=0){if(!ac)return;try{const t=ac.currentTime+w,o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
function stow(msg=true){audio();locked=false;mode='stowing';[tAz,tEl]=STOW;if(msg)say(gb?`Stowing. ${gb.toFixed(2)} gigabytes received.`:'Stowing the dish at zenith.');sync();}
function pass(){audio();if(mode==='slew'||mode==='track'){say('Pass aborted.');stow(false);return;}mode='slew';gb=0;satT=0;limit='';say('Pass of NOVA–7 started. Slewing to acquisition of signal.');sync();}
function jog(da,de){audio();if(mode==='slew'||mode==='track'){say('Tracking in progress. Press Space to abort first.');return;}mode='manual';const e0=tEl;tAz=(tAz+da+360)%360;tEl=clamp(tEl+de,8,90);limit=de&&tEl===e0?` · EL LIMIT ${tEl}°`:'';if(limit)say(`Elevation limit, ${tEl} degrees.`);sync();}
function door(){audio();doorOpen=!doorOpen;tone(doorOpen?330:260,.12,.01);say(doorOpen?'Shelter door open. Racks lit.':'Shelter door closed.');sync();}
const dishBtn=button(el('g',{}),{'aria-label':'Track the next pass or abort (Space)','aria-pressed':'false'}),dHit=el('circle',{r:34,class:'hit'},dishBtn),dRing=el('circle',{r:35.5,class:'focus-ring'},dishBtn);bind(dishBtn,pass);
const doorBtn=button(el('g',{}),{'aria-label':'Open the shelter door (D)','aria-pressed':'false'}),dq=group(FRONT(132,70.5,26),doorBtn);rect(dq,0,0,14,25,1.5,'hit');rect(dq,-.6,-.6,15.2,26.2,2,'focus-ring');bind(doorBtn,door);
function sync(){const busy=mode==='slew'||mode==='track';set(dishBtn,'aria-pressed',busy);set(hk[' '],'aria-pressed',busy);set(doorBtn,'aria-pressed',doorOpen);set(hk.d,'aria-pressed',doorOpen);set(doorBtn,'aria-label',`${doorOpen?'Close':'Open'} the shelter door (D)`);lastUI=-1;}
const act={' ':pass,s:()=>stow(),d:door};for(const[k,b]of Object.entries(hk))b.addEventListener('click',()=>act[k]());
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(k===' '&&e.target.closest&&e.target.closest('button,[role=button]'))return;
const fn={' ':pass,s:()=>stow(),d:door,ArrowLeft:()=>jog(-5,0),ArrowRight:()=>jog(5,0),ArrowUp:()=>jog(0,3),ArrowDown:()=>jog(0,-3)}[k];if(fn){e.preventDefault();if(!e.repeat||k.startsWith('Arrow'))fn();}});
function ui(){readout.textContent=`AZ ${az.toFixed(1)}° · EL ${elv.toFixed(1)}° · SNR ${snr.toFixed(1)} dB`;
stateLabel.textContent=({stowed:'STOWED · SPACE FOR NEXT PASS',slew:'SLEWING TO AOS · NOVA–7',track:locked?`TRACKING NOVA–7 · ${gb.toFixed(2)} GB`:'ACQUIRING NOVA–7',stowing:gb?`LOS · ${gb.toFixed(2)} GB · STOWING`:'STOWING',manual:'MANUAL JOG'+limit})[mode]+(doorOpen?' · DOOR OPEN':'');}
function tick(now){const dt=last?Math.min((now-last)/1000,.05):0,red=reduced.matches;last=now;
if(mode==='slew'){[tAz,tEl]=dirTo(satAt(0));}else if(mode==='track'){satT=clamp((now-passT0)/PASS);if(red)satT=Math.floor(satT*10)/10;[tAz,tEl]=dirTo(satAt(satT));tEl=Math.max(8,tEl);if(now-passT0>=PASS){tone(520,.3);say(`Loss of signal. ${gb.toFixed(2)} gigabytes received.`);stow(false);}}
const dA=((tAz-az+540)%360)-180,dE=tEl-elv,sa=red?dA:clamp(dA,-40*dt,40*dt),se=red?dE:clamp(dE,-24*dt,24*dt);az=(az+sa+360)%360;elv+=se;const moving=Math.abs(sa)+Math.abs(se)>.01;
if(mode==='stowing'&&Math.abs(dA)<.05&&Math.abs(dE)<.05){mode='stowed';sync();}
const was=locked;locked=(mode==='slew'||mode==='track')&&Math.abs(dA)<1.5&&Math.abs(dE)<1.5;if(locked&&mode==='slew'){mode='track';passT0=now;sync();}if(locked&&!was){tone(880,.18);tone(1320,.3,.01,.09);say('Signal acquired. Tracking NOVA–7.');}
snr+=((locked?6+12*Math.sin(elv*RAD)+.5*Math.sin(now/310):0)-snr)*(red?1:1-Math.exp(-dt*(locked?1.4:3)));if(snr<.05)snr=0;
const key=`${az.toFixed(2)},${elv.toFixed(2)}`;if(key!==drawn){drawn=key;drawDish(az,elv);const c=P(...dishC);for(const n of[dHit,dRing]){set(n,'cx',f2(c[0]));set(n,'cy',f2(c[1]));}}
const sky=mode==='slew'||mode==='track',sp2=P(...satAt(satT)),sq=P(...satAt(Math.min(1,satT+.01)));set(satG,'display',sky?'inline':'none');set(satG,'transform',`translate(${f2(sp2[0])} ${f2(sp2[1])}) rotate(${f2(Math.atan2(sq[1]-sp2[1],sq[0]-sp2[0])/RAD)})`);
const tp=[];for(let i=0;i<=24;i++)tp.push(satAt(satT*i/24));set(trail,'d',mode==='track'&&satT>0?smooth(tp):'');
const fp=P(...feedPt),bd=locked?`M${f2(fp[0])},${f2(fp[1])}L${f2(sp2[0])},${f2(sp2[1])}`:'';for(const p of[beam,bglow])set(p,'d',bd);beam.style.opacity=locked?.8:0;bglow.style.opacity=locked?.18:0;if(!red)set(beam,'stroke-dashoffset',f2((now/40)%7));
if(locked&&now>=nextPkt){pk.push({s:0,n:circle(pktG,0,0,1.1,'pkt')});nextPkt=now+(red?600:240+220*(1-snr/18));}
const pts=PATH(),seg=[];let tot=0;for(let i=1;i<pts.length;i++){const l=Math.hypot(...sub(pts[i],pts[i-1]));seg.push(l);tot+=l;}
for(let i=pk.length-1;i>=0;i--){const k=pk[i];k.s+=dt*(red?tot:95);if(k.s>=tot){k.n.remove();pk.splice(i,1);gb+=.013;lit(RL[Math.random()*RL.length|0],'b');continue;}let s=k.s,j=0;while(j<seg.length-1&&s>seg[j]){s-=seg[j];j++;}const p=P(...add(pts[j],mul(sub(pts[j+1],pts[j]),s/seg[j])));set(k.n,'cx',f2(p[0]));set(k.n,'cy',f2(p[1]));k.n.style.opacity=f2(clamp((tot-k.s)/14));}
if(Math.random()<dt*8){const l=RL[Math.random()*RL.length|0];lit(l,Math.random()<.5?'g':'');}
doorA+=((doorOpen?100:0)-doorA)*(red?1:1-Math.exp(-dt*6));if(Math.abs(doorA-(doorOpen?100:0))<.05)doorA=doorOpen?100:0;if(doorA!==drawDoor.a){drawDoor.a=doorA;drawDoor(doorA);}
lit(doorLamp,doorOpen?'w':'');set(doorHalo,'class','halo'+(doorOpen?' w':''));doorPool.style.opacity=doorOpen?.9:0;
const bl=red||now%1400<420;lit(bLamp,bl?'r':'');set(bHalo,'class','halo'+(bl?' r':''));if(feedLamp)lit(feedLamp,bl?'r':'');lit(satLamp,sky&&(red||now%700<350)?'b':'');
lit(azLamp,moving?'a':locked?'b':'g');lit(lockL,locked?'g':sky?'a':'');BAR.forEach((s,i)=>set(s,'class','seg'+(i<snr/2?(i>7?' a':' g'):'')));set(needle,'transform',`rotate(${f2(-50+100*clamp(snr/20))} 5 6.4)`);
if(!red){fanA=(fanA+dt*260)%360;set(fan,'transform',`translate(11 9) rotate(${f2(fanA)})`);}
if(hum)hum.gain.setTargetAtTime(moving?.01:0,ac.currentTime,.08);
if(lastUI<0||now-lastUI>100){lastUI=now;ui();}requestAnimationFrame(tick);}
drawDoor(0);drawDoor.a=0;sync();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [' ', 's', 'd'], draw }
