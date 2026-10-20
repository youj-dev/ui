// @ts-nocheck
/* VEKTA M–3 · Cell tower. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--rubber:#2e2e2d;--dk:#3a3a39;--dk-top:#4a4a48;--dk-side:#2d2d2c;--slab:#d6d6d2;--slab-top:#e9e9e5;--slab-side:#c4c4c0;--gravel:#d0d0cb;--road:#bdbdb9;--steel:#f2f2ef;--warm:#ffb347;--mesh:#7a7a77;--car:#e7e7e3;--car-top:#f7f7f4;--car-side:#cdcdc9}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--rubber:#252524;--dk:#2f2f2f;--dk-top:#454543;--dk-side:#1d1d1c;--slab:#b4b4b2;--slab-top:#dadad6;--slab-side:#8a8a88;--gravel:#afafac;--road:#9f9f9c;--steel:#ccccca;--warm:#ffb04a;--mesh:#666664;--car:#c3c3c0;--car-top:#e7e7e4;--car-side:#90908f;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.dk{fill:var(--dk)}.top.dk{fill:var(--dk-top)}.side.dk{fill:var(--dk-side)}.slab{fill:var(--slab)}.top.slab{fill:var(--slab-top)}.side.slab{fill:var(--slab-side)}.car{fill:var(--car)}.top.car{fill:var(--car-top)}.side.car{fill:var(--car-side)}.rubber{fill:var(--rubber)}.road{fill:var(--road)}.gravel{fill:url(#gravel)}.hole{fill-rule:evenodd}
.su,.leg,.sm,.sr{fill:none;stroke-linecap:round;stroke-linejoin:round}.su{stroke:var(--line)}.leg{stroke:var(--steel)}.sm{stroke:var(--metal)}.sr{stroke:var(--rubber)}.br{fill:none;stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke;stroke-linecap:round}.br.back{opacity:.4}.feeder{fill:none;stroke:var(--rubber);stroke-width:.42;stroke-linecap:round}.rung{fill:none;stroke:var(--line);stroke-width:.55;vector-effect:non-scaling-stroke}.lane{fill:none;stroke:var(--top);stroke-width:.7;stroke-dasharray:5 5}
.mesh{fill:url(#mesh);stroke:none}.wire{fill:none;stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}
.lamp{fill:var(--off);stroke:none}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.w{fill:var(--warm)}.lamp.g,.lamp.a,.lamp.r,.lamp.b,.lamp.w{filter:url(#glow)}.halo{opacity:0;filter:url(#bloom)}.halo.r{fill:var(--fault);opacity:.65}.halo.w{fill:var(--warm);opacity:.5}.halo.b{fill:var(--accent);opacity:.5}
.wave{fill:none;stroke:var(--accent);stroke-width:1;stroke-linecap:round;opacity:0}.ring{fill:none;stroke:var(--accent);stroke-width:.8;stroke-linecap:round;opacity:0}.wedge{fill:var(--accent);stroke:none;opacity:0}.edge{fill:none;stroke:var(--accent);stroke-width:.7;stroke-dasharray:2 3;opacity:.35}.edge.sel{opacity:1;stroke-dasharray:none;stroke-width:1}.ph{fill:var(--accent);opacity:0}.link{fill:none;stroke:var(--accent);stroke-width:.9;stroke-dasharray:2.4 3.2;opacity:0}.glow{fill:var(--accent);opacity:0;filter:url(#glow)}.beam{fill:var(--warm);opacity:0;filter:url(#bloom)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<pattern id="mesh" width="2.4" height="2.4" patternUnits="userSpaceOnUse"><path d="M0,0L2.4,2.4M2.4,0L0,2.4" style="fill:none;stroke:var(--mesh);stroke-width:.22"/></pattern>
<pattern id="gravel" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" style="fill:var(--gravel)"/><circle cx=".8" cy=".9" r=".32" style="fill:var(--recess)"/><circle cx="2.2" cy="2.1" r=".26" style="fill:var(--recess)"/></pattern>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* VEKTA M–3. World: x lower-right, y lower-left, z up; 1 unit ≈ 20 cm. Tower axis at 75 75; sector azimuths from +x toward +y.
Part                        x      y      z      w      d      h
site slab                   0      0     −5    150    150      5   road 0 118 0.02 150 14
coverage rings          r 36–70 around the axis, 3 × 120° wedges A 45° · B 165° · C 285°, phones
fence + gate               44     44      0     62     62     16   12 posts, mesh, barbed wire, gate at x 58–70
gravel                     44     44      0     62     62      –
equipment cabinet          62     96      0     18      9     20   doors, vents, PWR SYNC LINK ALM, GPS
battery cabinet            85     97      0     12      8     14
ice bridge                 73     84     21      4     13    1.4   2 posts, cables into the tower
tower legs          base ±13 → top ±5.5 at z 184   13 panels of X-bracing, splice plates, step bolts
cable ladder               70     79      4      –      –    176   rungs, 3 feeders
microwave dish     r 4.6 at 85 66 146, facing −20°
head frame + arms     r 13.8 at z 184 / 198, pipes z 180.5–202.5
panels (2 per sector)   1.8 × 3.4 × 16 at r 15.5, z 184–200
radios (2 per sector)   2.6 × 3.2 × 5.2 at r 12, z 182.4–187.6   jumpers, trunks to the ladder
aviation lights         top 75 75 214 (flashing), mid z 100 on two legs
car                     12 × 6 × 5.4, x 6 → 136 at y 122   head and tail lamps
Painter order: slab, coverage, road, back fence, cabinets, back lattice, ladder, far sectors, front lattice, near sector, front fence, car, links. */
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
function obox(c,U,V,N,w,d,h,cls='',r=1.5){const ax=[[U,w],[V,d],[N,h]],out=[];for(let i=0;i<3;i++)for(const s of[1,-1]){const n=mul(ax[i][0],s);if(dot(n,[1,1,1])<=.01)continue;const[B,lb]=ax[(i+1)%3],[C2,lc]=ax[(i+2)%3],o=add(add(add(c,mul(n,ax[i][1]/2)),mul(B,-lb/2)),mul(C2,-lc/2)),g=group(plane(o,B,C2));rect(g,0,0,lb,lc,r,'face '+(n[2]>.6?'top':n[0]>n[1]?'side':'')+' '+cls);out.push([n,g,lb,lc]);}return out;}
// Site slab, the three sector footprints with ripples and phones, the road.
const T=[75,75],SECT=[{n:'A',az:45,k:1.15},{n:'B',az:165,k:.9},{n:'C',az:285,k:.7}];
const sp=P(75,75,-5);el('ellipse',{cx:sp[0],cy:sp[1]+8,rx:140,ry:80,class:'shadow stage-floor'});el('ellipse',{cx:sp[0],cy:sp[1]+8,rx:140,ry:80,class:'stage-contact'});box(0,0,-5,150,150,5,4,'slab');
const cov=group(TOP(0,0,.03)),pa=(r,a)=>`${f2(T[0]+r*Math.cos(a*RAD))},${f2(T[1]+r*Math.sin(a*RAD))}`,arc=(r,a0,a1)=>`M${pa(r,a0)}A${r},${r} 0 0 1 ${pa(r,a1)}`;
for(const s of SECT){const a0=s.az-60,a1=s.az+60;s.w=el('path',{d:`M${pa(70,a0)}A70,70 0 0 1 ${pa(70,a1)}L${pa(36,a1)}A36,36 0 0 0 ${pa(36,a0)}Z`,class:'wedge'},cov);s.e=el('path',{d:`M${pa(36,a0)}L${pa(70,a0)}A70,70 0 0 1 ${pa(70,a1)}`,class:'edge'},cov);s.rp=[0,1].map(()=>el('path',{class:'ring'},cov));
s.ph=[...Array(8)].map((_,i)=>{const r=40+(i*37)%27,a=(s.az-52+(i*53+s.az)%104)*RAD;return circle(cov,T[0]+r*Math.cos(a),T[1]+r*Math.sin(a),1,'ph');});}
const rd=group(TOP(0,118,.05));rect(rd,0,0,150,14,0,'face road');line(rd,0,7,150,7,'lane');
// Back fence, gravel, cabinets and the ice bridge.
const post=(x,y)=>rod([x,y,0],[x,y,17],.45,'metal');
const fb=group(FRONT(44,44,16));rect(fb,0,0,62,16,0,'mesh');line(fb,0,0,62,0,'wire');line(fb,0,1.4,62,1.4,'wire');for(let i=0;i<=6;i++)post(44+i*62/6,44);
const fs=group(SIDE(44,106,16));rect(fs,0,0,62,16,0,'mesh');line(fs,0,0,62,0,'wire');line(fs,0,1.4,62,1.4,'wire');for(let i=1;i<=6;i++)post(44,106-i*62/6);
rect(group(TOP(44,44,.06)),0,0,62,62,0,'face gravel');
// Tower: footings, back faces, cable ladder with feeders, far sectors, front faces and legs, splices, step bolts, platform, microwave dish, lights, near sector.
const H=184,hw=z=>13-7.5*z/H,LV=[0,24,46,66,84,100,114,127,139,150,160,169,177,184],cn=(sx,sy,z)=>[T[0]+sx*hw(z),T[1]+sy*hw(z),z];
const face=(a,b,cls)=>{for(let i=0;i<LV.length-1;i++){const z0=LV[i],z1=LV[i+1];wire([cn(...a,z0),cn(...b,z1)],cls);wire([cn(...b,z0),cn(...a,z1)],cls);wire([cn(...a,z1),cn(...b,z1)],cls);}};
const leg=(sx,sy)=>{sk(poly([cn(sx,sy,1.6),cn(sx,sy,H+1)]),1.9,'leg');for(const z of[46,100,139])sk(poly([cn(sx,sy,z-1.6),cn(sx,sy,z+1.6)]),3,'sm');};
for(const[sx,sy]of[[-1,-1],[1,-1],[-1,1],[1,1]])box(T[0]+sx*13-3.5,T[1]+sy*13-3.5,0,7,7,1.6,1.2,'');
face([-1,-1],[1,-1],'br back');face([-1,-1],[-1,1],'br back');leg(-1,-1);
const LX=70,LY=79.4;for(const dx of[-1,1])wire([[LX+dx,LY,4],[LX+dx,LY,181]],'rung');for(let z=8;z<180;z+=5)wire([[LX-1,LY,z],[LX+1,LY,z]],'rung');for(const dx of[-.5,.3,1.1])el('path',{d:poly([[LX+dx,LY+1,30],[LX+dx,LY+1,183]]),class:'feeder'});
function sect(s,i){const a=s.az*RAD,d=[Math.cos(a),Math.sin(a),0],t=[-Math.sin(a),Math.cos(a),0],at=(r,o,z)=>[T[0]+d[0]*r+t[0]*o,T[1]+d[1]*r+t[1]*o,z],front=d[0]+d[1]>0;s.c=at(15.5,0,192);s.lamps=[];s.glow=[];
const pipe=()=>{for(const z of[184,198])sk(poly([at(5,0,z),at(13.8,0,z)]),1,'sm');sk(poly([at(13.8,0,180.5),at(13.8,0,202.5)]),1.1,'sm');for(const z of[185,199])sk(poly([at(14.2,-6,z),at(14.2,6,z)]),.8,'sm');};
const panels=()=>{for(const o of[-3.2,3.2])for(const[n,g]of obox(at(15.5,o,192),d,t,[0,0,1],1.8,3.4,16,'',1)){if(dot(n,d)>.9){s.glow.push(rect(g,.5,.8,2.4,14.4,.8,'glow'));for(const v of[4,8,12])line(g,.5,v,2.9,v);}else if(dot(n,d)<-.9)for(const v of[3,11])rect(g,.9,v,1.6,1.6,.4,'face metal');}};
const rrus=()=>{for(const o of[-3.2,3.2]){for(const[n,g]of obox(at(12,o,185),d,t,[0,0,1],2.6,3.2,5.2,'dk',.7))if(dot(n,d)<-.9){slits(g,.5,.7,2.2,2.4,4);s.lamps.push(lamp(g,1,4.1,.42),lamp(g,2.2,4.1,.42));}el('path',{d:smooth([at(12,o,182.4),at(13.6,o,181.4),at(15.5,o,183.4)]),class:'feeder'});}};
const trunks=()=>{for(const o of[-3.2,3.2])el('path',{d:smooth([at(12,o,185),at(8,o*.5,184.6),[LX+.3,LY+1,183]]),class:'feeder'});};
if(front){rrus();trunks();pipe();panels();}else{panels();pipe();rrus();trunks();}
const q=P(...s.c);s.q=q;s.fx=el('circle',{cx:f2(q[0]),cy:f2(q[1]),r:10,class:'halo'});}
sect(SECT[2],2);sect(SECT[1],1);
face([1,-1],[1,1],'br');face([-1,1],[1,1],'br');leg(1,-1);leg(-1,1);leg(1,1);for(let z=8;z<182;z+=3.2)wire([cn(1,1,z),add(cn(1,1,z),[.9,.9,0])],'rung');
const tri=SECT.map(s=>[T[0]+13.8*Math.cos(s.az*RAD),T[1]+13.8*Math.sin(s.az*RAD),184]);sk(poly([...tri,tri[0]]),1,'sm');sk(poly([...tri.map(p=>[p[0],p[1],192]),[tri[0][0],tri[0][1],192]]),.7,'sm');
const mw=[85.6,66.4,146],mn=[.94,-.34,0];sk(poly([cn(1,-1,146),mw]),1.2,'sm');const mwc=rod(mw,add(mw,mul(mn,3.4)),4.6,'base');if(mwc){circle(mwc,0,0,4.6,'face top');circle(mwc,0,0,3.4,'detail');}
const AV=[];for(const[sx,sy]of[[-1,1],[1,-1]]){const c=add(cn(sx,sy,100),[sx*1.6,sy*1.6,0]);cylinder(c[0],c[1],c[2],1,1.6,'z','dk');const g=group(TOP(c[0],c[1],c[2]+1.6));AV.push(lamp(g,0,0,.9));const q=P(c[0],c[1],c[2]+1.8);AV.push(el('circle',{cx:f2(q[0]),cy:f2(q[1]),r:6,class:'halo'}));}
rod([75,75,184],[75,75,210],.45,'metal');cylinder(75,75,209.6,1.7,1.2,'z','dk');const bc=cylinder(75,75,210.8,1.3,2.4,'z','glass'),topL=lamp(bc.face,0,0,1),tq=P(75,75,212.4),topH=el('circle',{cx:f2(tq[0]),cy:f2(tq[1]),r:11,class:'halo'});
sect(SECT[0],0);
// Cabinets and the ice bridge in front of the tower.
box(62,96,0,18,9,20,1.5,'');const cab=group(FRONT(62,105,20));for(const u of[1,9.2])rect(cab,u,4,7.8,15,.8,'detail');for(const u of[7.6,10.4])rect(cab,u,9,.8,3.2,.4,'face dk');slits(cab,1.4,.8,15,2,10);
const CL=['PWR','SYNC','LINK','ALM'].map((n,i)=>{text(cab,2+i*4,18.6,n,'etch micro');return lamp(cab,3+i*4,16.6,.55);});
const cs=group(SIDE(80,105,20));slits(cs,1.5,3,6,12,6);circle(cs,6,12,.5,'face dk');cylinder(66,99,20,1.6,1.2,'z','');
box(85,97,0,12,8,14,1.5,'');const bat=group(FRONT(85,105,14));rect(bat,1.4,2.4,9.2,3.6,.6,'face top');text(bat,6,5,'48 V','etch micro center');slits(bat,2,9,8,3,6);
post(75,90.5);box(73,84,21,4,13,1.4,.6,'metal');for(const dx of[-.9,0,.9])el('path',{d:smooth([[75+dx,97,22.8],[75+dx,85,22.8],[71.2+dx*.4,80.6,27],[70.4+dx*.4,79.2,34]]),class:'feeder'});
// Front fence with the gate, the car, then light and links on top.
const fr=group(SIDE(106,106,16));rect(fr,0,0,62,16,0,'mesh');line(fr,0,0,62,0,'wire');line(fr,0,1.4,62,1.4,'wire');for(let i=0;i<6;i++)post(106,44+i*62/6);
const fw=group(FRONT(44,106,16));el('path',{d:'M0,0H14V16H0ZM26,0H62V16H26Z',class:'mesh'},fw);for(const v of[0,1.4]){line(fw,0,v,14,v,'wire');line(fw,26,v,62,v,'wire');}
rect(fw,14.4,1.8,11.2,14.2,.6,'mesh');rect(fw,14.4,1.8,11.2,14.2,.6,'wire');line(fw,20,1.8,20,16,'wire');rect(fw,15.4,6.2,9.2,3.4,.4,'face top');text(fw,20,8.6,'VEKTA M–3','etch micro center');for(let i=0;i<=6;i++)post(44+i*62/6,106);
const carG=into(el('g',{}));box(0,121.5,1.3,12,6,3,1.6,'car');box(2.6,122.1,4.3,6.4,4.8,2.4,1.4,'glass');const cw=group(FRONT(0,127.5,4.3));for(const u of[2.6,9.4])circle(cw,u,3.1,1.4,'face rubber');const tail=lamp(cw,.7,1.1,.5);
const cf=group(SIDE(12,127.5,4.3));const heads=[lamp(cf,1.1,1.1,.55),lamp(cf,4.9,1.1,.55)];into(draw);const hq=P(17,124.5,1.5),beamL=el('ellipse',{cx:f2(hq[0]),cy:f2(hq[1]),rx:7,ry:3.4,class:'beam'},carG);
const WV=group(TOP(0,0,192)),link=el('path',{class:'link'});SECT.forEach(s=>{s.wv=[0,1,2].map(()=>el('path',{class:'wave'},WV));});
frame([[0,0,-5,150,150,5],[64,64,0,22,22,218]],12);
// State: traffic, selected sector, the car's serving sector and handover, outage with staged recovery; audio after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),hk={};
document.querySelectorAll('.hint [data-k]').forEach(b=>{hk[b.dataset.k]=b;});
let load=40,sel=0,serving=1,handFrom=1,carX=6,driving=false,handT=0,outage=0,recoverT=0,last=0,lastUI=-1,ac=null;const up=[1,1,1],fl=[0,0,0];
const sLoad=i=>up[i]?clamp(load/100*SECT[i].k+(serving===i?.05:0)):0,users=i=>Math.round(sLoad(i)*120),say=m=>{announcement.textContent=m;};
const sectorAt=x=>{const a=(Math.atan2(50,x+6-T[0])/RAD+360)%360;return a>=345||a<105?0:a<225?1:2;};
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac)ac=new A();if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){}}
function tone(f,d=.12,v=.012,w=0,type='sine'){if(!ac)return;try{const t=ac.currentTime+w,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
function setLoad(d){audio();load=clamp(load+d,0,100);tone(420+load*6,.05,.008);say(`Traffic ${load} percent. Sector ${SECT[sel].n} serves ${users(sel)} users.`);lastUI=-1;}
function pick(i){audio();sel=i;tone(700+i*120,.06,.01);say(`Sector ${SECT[i].n}, ${up[i]?users(i)+' users':'down'}.`);sync();}
function drive(){audio();if(outage){say('No service during the outage.');return;}if(driving)return;if(carX>130)carX=6;driving=true;tone(520,.08);say('The car drives along the road across the sector boundary.');lastUI=-1;}
function fault(){audio();if(recoverT)return;if(outage){outage=0;recoverT=performance.now();say('Power restored. Radios restarting.');sync();return;}outage=performance.now();up.fill(0);tone(110,.5,.03,0,'sawtooth');[0,.35,.7].forEach(t=>tone(880,.12,.008,t+.3,'square'));say('Outage. All three sectors are down; the cabinet is on battery and raises an alarm.');sync();}
const btn=(label,x,y,r,fn,extra={})=>{const g=button(el('g',{}),{'aria-label':label,...extra});el('circle',{cx:f2(x),cy:f2(y),r,class:'hit'},g);el('circle',{cx:f2(x),cy:f2(y),r:r+1.4,class:'focus-ring'},g);bind(g,fn);return g;};
const HB=SECT.map((s,i)=>btn(`Select sector ${s.n} (${i+1})`,s.q[0],s.q[1],13,()=>pick(i),{'aria-pressed':String(i===sel)})),cq=P(71,100.5,11),cabBtn=btn('Cut or restore the power (O)',cq[0],cq[1],14,fault,{'aria-pressed':'false'});
const carBtn=button(el('g',{}),{'aria-label':'Drive the car for a handover (H)'}),carHit=el('ellipse',{rx:12,ry:8,class:'hit'},carBtn),carRing=el('ellipse',{rx:13.4,ry:9.4,class:'focus-ring'},carBtn);bind(carBtn,drive);
function sync(){HB.forEach((b,i)=>set(b,'aria-pressed',i===sel));SECT.forEach((s,i)=>set(s.e,'class','edge'+(i===sel?' sel':'')));set(cabBtn,'aria-pressed',!!outage);set(hk.o,'aria-pressed',!!outage);lastUI=-1;}
const act={h:drive,o:fault};for(const[k,b]of Object.entries(hk))b.addEventListener('click',()=>act[k]());
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.length===1?e.key.toLowerCase():e.key;
const fn={ArrowUp:()=>setLoad(10),ArrowDown:()=>setLoad(-10),h:drive,o:fault,'1':()=>pick(0),'2':()=>pick(1),'3':()=>pick(2)}[k];if(fn){e.preventDefault();if(!e.repeat||k.startsWith('Arrow'))fn();}});
function ui(){const s=SECT[sel],n=up.filter(Boolean).length;readout.textContent=`LOAD ${load}% · ${users(sel)} USERS · SECTOR ${s.n}`;
stateLabel.textContent=outage?'OUTAGE · ON BATTERY · ALARM RAISED':recoverT?`RECOVERING ${n}/3`:handT?`HANDOVER ${SECT[handFrom].n} → ${SECT[serving].n}`:driving?`CAR ON ${SECT[serving].n} · DRIVING`:`ALL SECTORS UP · CAR ON ${SECT[serving].n}`;}
function tick(now){const dt=last?Math.min((now-last)/1000,.05):0,red=reduced.matches;last=now;
if(driving){carX=red?136:Math.min(136,carX+dt*30);if(carX>=136)driving=false;}const cp=P(carX,0,0);set(carG,'transform',`translate(${f2(cp[0])} ${f2(cp[1])})`);const cc=P(carX+6,124.5,4);for(const n of[carHit,carRing]){set(n,'cx',f2(cc[0]));set(n,'cy',f2(cc[1]));}
const want=sectorAt(carX);if(want!==serving&&up[want]){handFrom=serving;serving=want;handT=now;fl[want]=1;tone(1200,.08);tone(1600,.1,.01,.08);say(`Handover from sector ${SECT[handFrom].n} to sector ${SECT[serving].n}.`);}if(handT&&now-handT>1500)handT=0;
if(outage&&now-outage>2600){outage=0;recoverT=now;sync();}
if(recoverT){[2,0,1].forEach((i,k)=>{if(!up[i]&&now-recoverT>500+k*650){up[i]=1;fl[i]=1;tone(520+k*180,.16);}});if(up.every(Boolean)){recoverT=0;say('All sectors restored.');sync();}}
SECT.forEach((s,i)=>{const L=sLoad(i),on=up[i];s.w.style.opacity=f2(on?.03+.13*L:0);s.e.style.opacity=on?'':'.15';s.rp.forEach((p,k)=>{const ph=red?(k+1)/3:(now/2600+k/2)%1,r=36+ph*34;set(p,'d',arc(r,s.az-58,s.az+58));p.style.opacity=f2(on?(1-ph)*(.15+.6*L):0);});
s.ph.forEach((p,k)=>{p.style.opacity=on&&k<Math.round(L*8)?(red||(now/90+k*7)%23>2?'.85':'.25'):'0';});
const c=s.c;s.wv.forEach((w,k)=>{const ph=red?(k+1)/4:(now/1500+k/3)%1,r=3+ph*19,p=a=>`${f2(c[0]+r*Math.cos(a*RAD))},${f2(c[1]+r*Math.sin(a*RAD))}`;set(w,'d',`M${p(s.az-50)}A${f2(r)},${f2(r)} 0 0 1 ${p(s.az+50)}`);w.style.opacity=f2(on?(1-ph)*(.25+.75*L):0);});
s.glow.forEach(g=>{g.style.opacity=f2(on?.08+.32*L:0);});const bl=(now/(650-450*L)|0)%2;s.lamps.forEach((l,k)=>lit(l,on?(k%2?(bl||red?'g':''):'g'):outage&&!red&&(now/400|0)%2?'r':''));
fl[i]=Math.max(0,fl[i]-dt*1.4);set(s.fx,'class','halo'+(fl[i]>.05?' b':''));s.fx.style.opacity=fl[i]>.05?f2(fl[i]*.6):'';});
if(up[serving]&&!outage){const a=P(...SECT[serving].c),b=P(carX+6,124.5,5.6);set(link,'d',`M${f2(a[0])},${f2(a[1])}L${f2(b[0])},${f2(b[1])}`);link.style.opacity='.8';if(!red)set(link,'stroke-dashoffset',f2(-(now/40)%5.6));}else link.style.opacity='0';
const blink=red||now%1500<380;lit(topL,blink?'r':'');set(topH,'class','halo'+(blink?' r':''));for(let k=0;k<AV.length;k+=2){lit(AV[k],'r');set(AV[k+1],'class','halo r');AV[k+1].style.opacity='.35';}
lit(CL[0],outage?'a':'g');lit(CL[1],!outage&&(red||now%1000<500)?'g':'');lit(CL[2],!outage&&Math.random()<.25+load/140?'b':'');lit(CL[3],outage?(red||now%600<300?'r':''):recoverT?'a':'');
heads.forEach(h=>lit(h,'w'));lit(tail,'r');beamL.style.opacity=driving?'.55':'.3';
if(lastUI<0||now-lastUI>150){lastUI=now;ui();}requestAnimationFrame(tick);}
sync();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['h', 'o'], draw }
