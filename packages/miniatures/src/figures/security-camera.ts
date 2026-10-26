// @ts-nocheck
/* KEVRA PT–4 · Security camera. Drawn for this package in the lab figures' form: its stylesheet, defs and script,
 * on the engine's kit. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--rubber:#2e2e2d;--dk:#3a3a39;--dk-top:#4a4a48;--dk-side:#2d2d2c;--conc:#c9c8c3;--conc-top:#dfdeda;--conc-side:#b3b2ad;--plinth:#a9a8a4;--roof:#a3a29e;--pave:#d3d3cf;--pave-top:#e6e6e2;--pave-side:#c0c0bc;--front:#20252b;--lens:#14171b;--lens-in:#22303a;--lens-rim:#30363d;--coat:#4f9fc4;--ir:#d02a5a;--ir-off:#6b5a5e;--warm:#ffb347;--white:#f4f6ff;--pool:#5f8dff}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--rubber:#252524;--dk:#2f2f2f;--dk-top:#454543;--dk-side:#1d1d1c;--conc:#a9a8a5;--conc-top:#d1d0cc;--conc-side:#7d7d7b;--plinth:#8e8d8a;--roof:#8d8c89;--pave:#b2b2af;--pave-top:#d7d7d3;--pave-side:#878786;--front:#1a1d21;--lens:#101215;--lens-in:#1d2830;--lens-rim:#2a2f35;--coat:#5fb0d4;--ir:#ff4d76;--ir-off:#5a4c50;--warm:#ffb04a;--pool:#8aa8ff;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.night{--lens-in:#2c1a33;--coat:#c45bd8;--pool:var(--ir)}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.brand.tiny{font-size:3px;letter-spacing:.9px}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.dk{fill:var(--dk)}.top.dk{fill:var(--dk-top)}.side.dk{fill:var(--dk-side)}.rubber{fill:var(--rubber)}.conc{fill:var(--conc)}.top.conc{fill:var(--conc-top)}.side.conc{fill:var(--conc-side)}.pave{fill:var(--pave)}.top.pave{fill:var(--pave-top)}.side.pave{fill:var(--pave-side)}.plinth{fill:var(--plinth)}
.crease{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.45}.seam{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.55}.tie{fill:var(--recess);stroke:none;opacity:.6}
.su,.sr,.sm{fill:none;stroke-linecap:round;stroke-linejoin:round}.su{stroke:var(--line)}.sr{stroke:var(--rubber)}.sm{stroke:var(--metal)}
.irled{fill:var(--ir-off);stroke:none}.night .irled{fill:var(--ir);filter:url(#glow)}.priv .irled{fill:var(--ir-off);filter:none}.irhalo{fill:var(--ir);opacity:0;filter:url(#bloom)}.night .irhalo{opacity:.55}.priv .irhalo{opacity:0}
.lensg{fill:url(#glassG);stroke:none;opacity:var(--cut,1)}.coat{fill:none;stroke:var(--coat);stroke-width:.9;stroke-linecap:round;opacity:.75}.spec{fill:#fff;opacity:.75;stroke:none}.iris{fill:#050607;stroke:none}.shutter{fill:var(--top);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.grip{fill:none;stroke:var(--recess);stroke-width:.7;stroke-linecap:round}
.beam{fill:url(#fovG);stroke:none}.beamedge{fill:none;stroke:var(--pool);stroke-width:.6;stroke-dasharray:2 2.6;vector-effect:non-scaling-stroke;opacity:.3}.priv .beam,.priv .beamedge,.priv .aim{opacity:0}
.aim{fill:none;stroke:var(--pool);stroke-width:.7;stroke-linecap:round;vector-effect:non-scaling-stroke;opacity:.55}.det{fill:none;stroke:var(--warn);stroke-width:1.2;stroke-linecap:round;vector-effect:non-scaling-stroke;opacity:0}
.lamp{fill:var(--off);stroke:none}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.w{fill:var(--warm)}.lamp.i{fill:var(--ir)}.lamp.g,.lamp.a,.lamp.r,.lamp.b,.lamp.w,.lamp.i{filter:url(#glow)}.halo{opacity:0;filter:url(#bloom)}.halo.w{fill:var(--warm);opacity:.6}.halo.r{fill:var(--fault);opacity:.45}
.sring{fill:var(--off);stroke:none}.sring.g{fill:var(--ok)}.sring.b{fill:var(--accent)}.sring.a{fill:var(--warn)}.sring.w{fill:var(--white)}.sring.g,.sring.b,.sring.a,.sring.w{filter:url(#glow)}
.pool{opacity:0}.flood{fill:var(--glass);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.flood.w{fill:var(--warm);filter:url(#glow)}.glassfront{fill:var(--front);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.glint{fill:#fff;opacity:.12;stroke:none}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="glassG" cx=".4" cy=".36" r=".72"><stop offset="0" style="stop-color:var(--lens-in)"/><stop offset=".7" style="stop-color:var(--lens)"/><stop offset="1" style="stop-color:var(--lens-rim)"/></radialGradient>
<radialGradient id="fovG"><stop offset="0" style="stop-color:var(--pool);stop-opacity:.4"/><stop offset=".5" style="stop-color:var(--pool);stop-opacity:.2"/><stop offset="1" style="stop-color:var(--pool);stop-opacity:0"/></radialGradient>
<radialGradient id="warmG"><stop offset="0" style="stop-color:var(--warm);stop-opacity:.6"/><stop offset="1" style="stop-color:var(--warm);stop-opacity:0"/></radialGradient>
<clipPath id="frontClip"><rect x="1.2" y="1.2" width="16.6" height="18.6" rx="2.6"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* KEVRA PT–4 on a wall section. World: x lower-right, y lower-left, z up; pan from the diagonal (+x+y), tilt from the horizon.
Part                        x      y      z      w      d      h
floor light            a soft pool where the camera points, scaled to the frame; the house shadow under the wall
wall section                0      0      0     14     44     30   panel seam, tie holes, plinth, coping; floodlight at y 30
wall plate                 14      4     10    1.6     14     16   four screws; drip loop to the junction box at y 26
arm + brace            r 3.4  15.6 → 44 at y 11, z 18             day/night sensor on top at x 23
pan unit               r 10    44     11   23.6      –      –     10   on a mounting disc; status ring
yoke                    crossbar 27.6 × 10 × 2.8 above the pan unit, arms up to the tilt axis at 44 11 52, flush pivot caps
housing                 50 × 19 × 21 along the look axis; dark glass front with lens, IR ring and shutter; sun shield 55 × 23 on standoffs
Painter order: shadow, floor light, wall, floodlight, plate, junction box, arm, pan unit; crossbar, far arm, housing, sun shield, near arm; controls. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: vectors, oriented planes, round parts on any axis, oriented boxes, outlined strokes, lamps and controls.
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>mul(a,1/(Math.hypot(...a)||1)),VIEW=[1,1,1],RAD=Math.PI/180,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ramp=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);},f2=v=>v.toFixed(2),f3=v=>+v.toFixed(3);
const plane=(o,U,V)=>`matrix(${[...P(...U),...P(...V),...P(...o)].map(f3).join(' ')})`,shade=n=>n[2]>.6?'top':n[0]>n[1]?'side':'',draw=root,into=g=>root=g;
function axes(n){const U=unit(Math.abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U);const a=P(...U),b=P(...V);if(a[0]*b[1]-a[1]*b[0]<0)V=mul(V,-1);return[U,V];}
function tube(g,a,b,r,cls='',cap=true){const ax=sub(b,a),n=unit(ax),[U,V]=axes(n),pu=P(...U),pv=P(...V),pd=P(...ax),det=pu[0]*pv[1]-pv[0]*pu[1];if(Math.abs(det)<1e-4)return tube(g,a,add(b,[.02,-.01,0]),r,cls,cap);const u=(pd[0]*pv[1]-pv[0]*pd[1])/det,v=(pu[0]*pd[1]-pd[0]*pu[1])/det,l=Math.hypot(u,v)||1,tx=-v*r/l,ty=u*r/l;
el('path',{d:`M${f2(tx)},${f2(ty)}A${r},${r} 0 0 1 ${f2(-tx)},${f2(-ty)}L${f2(u-tx)},${f2(v-ty)}A${r},${r} 0 0 1 ${f2(u+tx)},${f2(v+ty)}Z`,transform:plane(a,U,V),class:'face '+cls},g);
const f=dot(n,VIEW)>0,c=group(plane(f?b:a,U,V),g);c.front=f;c.U=U;c.V=V;if(cap)circle(c,0,0,r,'face '+shade(f?n:mul(n,-1))+' '+cls);return c;}
function band(g,a,b,R,cls=''){const ax=sub(b,a),n=unit(ax),[U,V]=axes(n),pu=P(...U),pv=P(...V),pd=P(...ax),det=pu[0]*pv[1]-pv[0]*pu[1];if(Math.abs(det)<1e-4)return band(g,a,add(b,[.02,-.01,0]),R,cls);const u=(pd[0]*pv[1]-pv[0]*pd[1])/det,v=(pu[0]*pd[1]-pd[0]*pu[1])/det,w=sub(VIEW,mul(n,dot(VIEW,n))),t=Math.atan2(dot(w,V),dot(w,U)),s=[R*Math.cos(t-1.5708),R*Math.sin(t-1.5708)],e=[R*Math.cos(t+1.5708),R*Math.sin(t+1.5708)];
return el('path',{d:`M${s.map(f2)}A${R},${R} 0 0 1 ${e.map(f2)}L${f2(e[0]+u)},${f2(e[1]+v)}A${R},${R} 0 0 0 ${f2(s[0]+u)},${f2(s[1]+v)}Z`,transform:plane(a,U,V),class:'face '+cls},g);}
function obox(g,c,U,V,N,w,d,h,cls='',r=1.5){const ax=[[U,w],[V,d],[N,h]],out=[];for(let i=0;i<3;i++)for(const s of[1,-1]){const n=mul(ax[i][0],s);if(dot(n,VIEW)<=.01)continue;const[B,lb]=ax[(i+1)%3],[E,le]=ax[(i+2)%3],o=add(add(add(c,mul(n,ax[i][1]/2)),mul(B,-lb/2)),mul(E,-le/2)),f=group(plane(o,B,E),g);rect(f,0,0,lb,le,r,'face '+shade(n)+' '+cls);out.push({n,f,i,s});}return out;}
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
function sk(d,w,cls,parent=root){el('path',{d,class:'su','stroke-width':w+.7},parent);return el('path',{d,class:cls,'stroke-width':w},parent);}
function lamp(g,x,y,r=1){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c,base='lamp'){if(n&&n._c!==c){n._c=c;set(n,'class',base+(c?' '+c:''));}}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
// Floor: the house ground shadow under the wall and the camera, then the light the camera throws where it points (a soft
// pool along its look, cool by day and magenta in infrared), the aim mark at its center, and the floodlight's warm pool.
const sh=P(26,24,0);el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]+3),rx:46,ry:15,class:'shadow stage-floor'});el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]+3),rx:46,ry:15,class:'stage-contact'});
const fovG=el('g',{}),pool=el('ellipse',{cx:30,cy:34,rx:15,ry:10,fill:'url(#warmG)',class:'pool'},group(TOP(0,0,.04),fovG)),lightG=el('g',{},fovG),beam=el('ellipse',{class:'beam'},lightG),edge=el('ellipse',{class:'beamedge'},lightG);
const aimG=el('g',{},lightG);circle(aimG,0,0,2.2,'aim');for(const[a,b,c,d]of[[-4.8,0,-3.2,0],[3.2,0,4.8,0],[0,-4.8,0,-3.2],[0,3.2,0,4.8]])line(aimG,a,b,c,d,'aim');
const detG=el('g',{class:'det'},aimG);for(const[sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1]])el('path',{d:`M${sx*9},${sy*5.5}L${sx*9},${sy*9}L${sx*5.5},${sy*9}`},detG);
// Wall: one low concrete section with tie holes, plinth and coping; a floodlight near its end.
box(0,0,0,14,44,30,1.2,'conc');const rw=group(SIDE(14,44,30)),ew=group(FRONT(0,44,30));for(const[g,w]of[[rw,44],[ew,14]])rect(g,0,25,w,5,.8,'face plinth');
line(rw,22,0,22,25,'seam');for(const[u,v]of[[4,8],[4,18],[19,13],[42,8],[42,18]])circle(rw,u,v,.85,'tie');box(-.6,-.6,30,15.2,45.2,1.8,.6,'metal');
box(14,30,20,3.2,8,4.4,1,'dk');const flood=el('rect',{x:.8,y:.8,width:6.4,height:2.8,rx:.8,class:'flood'},group(SIDE(17.2,38,24.4)));flood._c='';const fq=P(17.4,34,22.2),floodHalo=el('circle',{cx:f2(fq[0]),cy:f2(fq[1]),r:9,class:'halo'});
// Bracket: the wall plate, a drip loop down to the junction box with the privacy key switch, the arm and its brace, the day/night sensor.
box(14,4,10,1.6,14,16,1.4,'metal');const mp=group(SIDE(15.6,18,26));for(const[u,v]of[[2.2,2.2],[11.8,2.2],[2.2,13.8],[11.8,13.8]])screw(mp,u,v);
box(14,26,2,3.6,10,9,1.3,'');const jb=group(SIDE(17.6,36,11));circle(jb,5,3.6,2,'face metal');circle(jb,5,3.6,1.1,'face recess');line(jb,5,2.9,5,4.3);const boxLamp=lamp(jb,2.6,7.1,.55);text(jb,4,7.8,'REC','etch micro');tube(root,[15.8,31,0],[15.8,31,2],1,'metal');
sk(smooth([[15.6,17.4,11.4],[18.4,20,6.4],[18.2,24.6,6.4],[16.4,30,10.8]]),1.1,'sr');
tube(root,[15.6,11,11.6],[26,11,16.6],1.1,'metal');tube(root,[15.6,11,18],[44,11,18],3.4,'metal');const sens=cylinder(23,11,21.3,2.1,1.1,'z','glass'),photo=lamp(sens.face,0,0,1.2);
// Pan unit with its status ring on a mounting disc; above it the yoke, the housing and its sun shield, rebuilt in painter order as it moves.
cylinder(44,11,21.4,8.4,2.2,'z','metal');const pu=cylinder(44,11,23.6,10,10,'z','');const ring=band(root,[44,11,29.8],[44,11,31.6],10.1,'sring');set(ring,'class','sring');ring._c='';cylinder(44,11,33.6,8.4,1.2,'z','dk');
const L={yoke:el('g',{}),far:el('g',{}),head:el('g',{}),hood:el('g',{}),near:el('g',{})};
const PIV=[44,11],TZ=52,HOME=45,Z=[1,2,4],LB=[0,1,2.6],REST=[45,-20],P0=5.27,TILT=[-38,20],HV=26;
let[pan,tilt]=REST,vp=0,vt=0,[tp,tt]=REST,zi=0,lb=LB[0],zNow=1,shut=0,iris=1.4,night=false,privacy=false,events=0;
let ptr=null,lostUntil=0,manual=null,manualAt=-1e9,lastMove=null,speed=0,patrolT=P0,twitchT=-1e9,motionT=-1e9,snapT=-1e9,cutT=-1e9,lampT=-1e9,flash='',flashT=0,last=0,lastUI=-1,drawn='',mode='PATROL',rec=null,cutV='1';
function pose(){const p=(HOME+pan)*RAD,t=tilt*RAD,g=[Math.cos(p),Math.sin(p),0],s=[-Math.sin(p),Math.cos(p),0],f=[Math.cos(t)*g[0],Math.cos(t)*g[1],Math.sin(t)],u=[-Math.sin(t)*g[0],-Math.sin(t)*g[1],Math.cos(t)];return{g,s,f,u,T:[PIV[0],PIV[1],TZ]};}
/* The text frame on a face: reads left to right and upright on screen whichever way the head turns. */
function upright(o,a,b,parent){const Y=P(...b)[1]>0?b:mul(b,-1),pa=P(...a),py=P(...Y),X=pa[0]*py[1]-pa[1]*py[0]>0?a:mul(a,-1);return group(plane(o,X,Y),parent);}
function assemble(){const{g,s,f,u,T}=pose(),near=dot(s,VIEW)>=0?1:-1;for(const k in L)L[k].replaceChildren();
obox(L.yoke,[T[0],T[1],36.2],s,g,[0,0,1],27.6,10,2.8,'',1.2);
for(const side of[-near,near])for(const fc of obox(side===near?L.near:L.far,[T[0]+s[0]*side*12.4,T[1]+s[1]*side*12.4,45.4],g,s,[0,0,1],10,2.8,21.2,'',5))if(fc.i===1&&fc.s===side){circle(fc.f,17.2,5,3.3,'face '+shade(fc.n));circle(fc.f,17.2,5,1.4,'detail');}
const gl=4.8+lb*.35;for(const fc of obox(L.head,add(T,mul(f,-2)),f,s,u,50,19,21,'',3)){
if(fc.i===0&&fc.s>0){const e=fc.f;rect(e,1.2,1.2,16.6,18.6,2.6,'glassfront');circle(e,9.5,10.5,8.2,'irhalo');for(let i=0;i<12;i++){const a=(i*30+15)*RAD;circle(e,9.5+7.2*Math.cos(a),10.5+7.2*Math.sin(a),.6,'irled');}
circle(e,9.5,10.5,gl+.9,'face dk');circle(e,9.5,10.5,gl,'lensg');el('path',{d:`M${f2(9.5-gl*.75)},${f2(10.5+gl*.3)}A${f2(gl*.8)},${f2(gl*.8)} 0 0 0 ${f2(9.5-gl*.1)},${f2(10.5+gl*.78)}`,class:'coat'},e);circle(e,9.5,10.5,iris,'iris');circle(e,9.5-gl*.32,10.5-gl*.35,.6,'spec');
const cl=el('g',{'clip-path':'url(#frontClip)'},e);el('path',{d:'M2,19.8H6.4L12,1.2H7.6Z',class:'glint'},cl);const x0=1.2-(1-shut)*16.6;rect(cl,x0,1.2,16.6,18.6,2.4,'shutter');for(const k of[13.4,14.9])line(cl,x0+k,4,x0+k,17,'grip');}
else if(fc.i===0){circle(fc.f,9.5,5.4,1.9,'face rubber');circle(fc.f,9.5,5.4,.8,'face dk');}
else if(fc.i===1){const pl=upright(add(add(T,mul(fc.n,9.56)),mul(f,-16)),f,mul(u,-1),L.head);rect(pl,-8.3,-2.8,16.6,5.6,1.3,'face metal');rect(pl,-7.6,-2.1,15.2,4.2,.8,'detail');text(pl,0,1.1,'KEVRA','label brand tiny center');}}
for(const k of[-12,12])obox(L.hood,add(add(T,mul(f,k)),mul(u,11.35)),f,s,u,5,11,1.7,'dk',.6);
const top=obox(L.hood,add(add(T,mul(f,2)),mul(u,12.9)),f,s,u,55,23,1.4,'metal',2).find(h=>h.i===2&&h.s>0);rec=null;if(top){line(top.f,4,11.5,51,11.5,'crease');rec=lamp(top.f,49.5,4,1.05);}
const hc=P(...add(T,mul(f,2)));for(const n of[hHit,hRing]){set(n,'cx',f2(hc[0]));set(n,'cy',f2(hc[1]));}
}
// Controls on top: the head takes a snapshot, the sensor switches night vision, the junction box closes the shutter.
const hBtn=button(el('g',{}),{'aria-label':'Take a snapshot (Space)'}),hHit=el('circle',{r:20,class:'hit'},hBtn),hRing=el('circle',{r:21.5,class:'focus-ring'},hBtn);
const pq=P(23,11,22.4),nBtn=button(el('g',{}),{'aria-label':'Night vision (N)','aria-pressed':'false'});el('circle',{cx:f2(pq[0]),cy:f2(pq[1]),r:6.5,class:'hit'},nBtn);el('circle',{cx:f2(pq[0]),cy:f2(pq[1]),r:7.5,class:'focus-ring'},nBtn);
const bBtn=button(el('g',{}),{'aria-label':'Privacy shutter (P)','aria-pressed':'false'}),bq=group(SIDE(17.6,36,11),bBtn);rect(bq,-1.5,-1.5,13,12,2,'hit');rect(bq,-1,-1,12,11,2,'focus-ring');
frame([[0,0,0,14,44,32],[16,-17,30,56,56,40],[10,38,0,92,40,0]],8);const vb=svg.getAttribute('viewBox').split(/[\s,]+/).map(Number),YMAX=vb[1]+vb[3]-14;
// State: pointer tracking, patrol, manual jogs, zoom, night, privacy and snapshots; audio after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const say=m=>{announcement.textContent=m;},pad=n=>String(n).padStart(2,'0'),sg=v=>{const r=Math.round(v*10)/10;return(r<0?'−':'+')+Math.abs(r).toFixed(1);},hush=v=>Math.abs(Math.round(v));
const note=(m,ms=1500)=>{flash=m;flashT=performance.now()+ms;lastUI=-1;};
let ac=null,whir=null;
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();const o=ac.createOscillator(),fl=ac.createBiquadFilter();o.type='sawtooth';o.frequency.value=96;fl.type='lowpass';fl.frequency.value=380;whir=ac.createGain();whir.gain.value=0;o.connect(fl);fl.connect(whir);whir.connect(ac.destination);o.start();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){}}
function tone(f,d=.07,v=.012,w=0,type='sine'){if(!ac)return;try{const t=ac.currentTime+w,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
/* Where to look for a point on the drawing: the spot on the floor under it, at the floor scale the light pool uses (HV). A spot behind the line across the pivot
 * (the wall's side) is pushed out onto that line and the head tilts up with it, so it turns toward the pointer
 * and never into its own wall; right below the pivot the pan eases home. */
function aimAt(x,y){const gx=(x/C+y/S)/2,gy=(y/S-x/C)/2,push=Math.max(0,PIV[0]+PIV[1]-gx-gy),dx=gx+push/2-PIV[0],dy=gy+push/2-PIV[1],rh=Math.hypot(dx,dy);
let a=((Math.atan2(dy,dx)/RAD-HOME+540)%360)-180;a*=ramp(0,24,rh);return[clamp(a,-92,92),clamp(Math.atan2(-HV,rh)/RAD+push*.5,...TILT)];}
function patrolAt(t){const k=((t%17)+17)%17,e=x=>(1-Math.cos(Math.PI*x))/2,a=k<7?-1+2*e(k/7):k<8.5?1:k<15.5?1-2*e((k-8.5)/7):-1;return[20+a*35,-26+6*Math.cos((t-P0)*.55)];}
function local(e){const m=svg.getScreenCTM?.();if(!m)return null;const det=m.a*m.d-m.b*m.c;if(!det)return null;const x=e.clientX-m.e,y=e.clientY-m.f;return[(m.d*x-m.c*y)/det,(-m.b*x+m.a*y)/det];}
function onPointer(e){const q=local(e);if(!q)return;const now=performance.now();
if(lastMove){const dt=(now-lastMove.t)/1000;if(dt>.004)speed=speed*.45+Math.hypot(q[0]-lastMove.x,q[1]-lastMove.y)/dt*.55;}lastMove={x:q[0],y:q[1],t:now};
ptr=aimAt(q[0],q[1]);manualAt=-1e9;if(speed>720&&now-motionT>1600&&!privacy)detect(now);}
function release(e){lastMove=null;speed=0;if(ptr){ptr=null;lostUntil=performance.now()+(e.pointerType==='touch'?2600:1200);}}
svg.addEventListener('pointermove',onPointer);svg.addEventListener('pointerdown',onPointer);svg.addEventListener('pointerleave',release);svg.addEventListener('pointercancel',release);svg.addEventListener('pointerup',e=>{if(e.pointerType==='touch')release(e);});
function detect(now){motionT=now;lampT=now;twitchT=reduced.matches?-1e9:now;events++;note(`MOTION · EVENT ${pad(events)}`,1600);tone(880,.06,.01);tone(1175,.08,.01,.08);say(`Motion detected, event ${events} logged. The lens snaps to focus.`);}
function shot(){audio();if(privacy){note('SHUTTER CLOSED · NO SNAPSHOT');say('The privacy shutter is closed. Press P to open it.');return;}events++;snapT=performance.now();note(`SNAPSHOT · EVENT ${pad(events)}`);tone(2400,.03,.012,0,'square');tone(1600,.04,.01,.05,'square');say(`Snapshot saved, event ${events}.`);}
function zoomStep(){audio();if(privacy){note('SHUTTER CLOSED · ZOOM HELD');return;}zi=(zi+1)%3;note(`ZOOM ${Z[zi]}× · ${[52,26,13][zi]}° VIEW`);tone(520+zi*160,.09,.01,0,'triangle');say(`Zoom ${Z[zi]} times.`);}
function nightToggle(){audio();night=!night;cutT=performance.now();svg.classList.toggle('night',night);set(nBtn,'aria-pressed',String(night));note(night?'IR NIGHT · CUT FILTER OUT':'DAY · CUT FILTER IN');tone(1900,.025,.012,0,'square');tone(night?640:880,.06,.008,.04);say(night?'Night vision. The infrared ring is on and the cut filter is out.':'Day mode. Infrared off, cut filter in.');}
function privacyToggle(){audio();privacy=!privacy;svg.classList.toggle('priv',privacy);set(bBtn,'aria-pressed',String(privacy));if(privacy){zi=0;manualAt=-1e9;}note(privacy?'PRIVACY · SHUTTER CLOSED':'SHUTTER OPEN · RECORDING');tone(privacy?300:420,.12,.012,0,'triangle');say(privacy?'Privacy shutter closed. The camera is parked and not recording.':'Shutter open. Recording again.');}
function jog(dp,dt){audio();if(privacy){note('PRIVACY · P TO OPEN');say('The privacy shutter is closed. Press P to open it.');return;}const base=performance.now()-manualAt<5000?manual:[pan,tilt];manual=[clamp(Math.round(base[0]+dp),-90,90),clamp(Math.round(base[1]+dt),...TILT)];manualAt=performance.now();ptr=null;tone(300,.05,.008,0,'triangle');say(`Pan ${hush(manual[0])} degrees ${manual[0]>0?'left':manual[0]<0?'right':'center'}, tilt ${hush(manual[1])} degrees ${manual[1]<0?'down':'up'}.`);}
bind(hBtn,shot);bind(nBtn,nightToggle);bind(bBtn,privacyToggle);
const act={' ':shot,z:zoomStep,n:nightToggle,p:privacyToggle,ArrowLeft:()=>jog(10,0),ArrowRight:()=>jog(-10,0),ArrowUp:()=>jog(0,5),ArrowDown:()=>jog(0,-5)};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(k===' '&&e.target.closest&&e.target.closest('button,[role=button]'))return;const fn=act[k];if(fn){e.preventDefault();if(!e.repeat||k.startsWith('Arrow'))fn();}});
function ui(){readout.textContent=`PAN ${sg(-pan)}° · TILT ${sg(tilt)}° · ${zNow.toFixed(1)}×`;stateLabel.textContent=performance.now()<flashT?flash:privacy?'PRIVACY · SHUTTER CLOSED':`${mode} · REC · ${night?'IR NIGHT':'DAY'}`;}
/* The light pool on the floor where the camera points: along its pan, as far out as its tilt reaches at the floor scale
 * HV (kept inside the frame), narrower as it zooms. */
function light(){const p=(HOME+pan)*RAD,cp=Math.cos(p),sp=Math.sin(p),k=Math.pow(zNow,-.6);let D=tilt<-3?clamp(HV/Math.tan(-tilt*RAD),30,96):96;if(cp+sp>0)D=Math.min(D,(YMAX-(PIV[0]+PIV[1])/2)*2/(cp+sp));
set(lightG,'transform',`${TOP(PIV[0]+cp*D,PIV[1]+sp*D,.05)} rotate(${f2(HOME+pan)})`);for(const[n,m]of[[beam,1],[edge,.78]]){set(n,'rx',f2(25*k*m));set(n,'ry',f2(16*k*m));}}
function tick(now){const dt=last?Math.min((now-last)/1000,.05):0,red=reduced.matches;last=now;
if(privacy){mode='PRIVACY';tp=REST[0];tt=-10;}else if(ptr){mode='TRACKING';[tp,tt]=ptr;}else if(now-manualAt<5000){mode='MANUAL';[tp,tt]=manual;}else if(now<lostUntil)mode='TARGET LOST';else if(red){mode='HOME';[tp,tt]=REST;}else{mode='PATROL';patrolT+=dt;[tp,tt]=patrolAt(patrolT);}
if(red){pan=tp;tilt=tt;vp=vt=0;}else{const W=8,ap=W*W*(tp-pan)-2*W*vp,at=W*W*(tt-tilt)-2*W*vt;vp=clamp(vp+ap*dt,-240,240);vt=clamp(vt+at*dt,-180,180);pan+=vp*dt;tilt+=vt*dt;}
const tw=(now-twitchT)/1000,kick=red||tw>1.1?0:Math.exp(-tw*4.2)*Math.sin(tw*15);lb+=(LB[zi]-lb)*(red?1:1-Math.exp(-dt*9));zNow=Z[zi]*(1+.8*Math.max(0,kick))+(lb-LB[zi])*.9;
shut=red?+privacy:clamp(shut+(privacy?dt:-dt)*3.2);const si=(now-snapT)/1000;iris=si<.22&&!red?1.6+3.4*Math.sin(Math.PI*si/.22):1.6-.5*Math.max(0,kick);
const key=[pan,tilt,lb+kick*3.2,shut,iris].map(f2).join();if(key!==drawn){drawn=key;const keep=lb;lb+=kick*3.2;assemble();lb=keep;}
const blink=red||now%1200<760;if(rec)lit(rec,!privacy&&blink?'r':'');lit(boxLamp,privacy?'a':'g');lit(photo,night?'i':'');
lit(ring,privacy?'':now-motionT<1300?'a':now-snapT<260?'w':mode==='TRACKING'||mode==='MANUAL'?'b':'g','sring');
const lampOn=now-lampT<4000;lit(flood,lampOn?'w':'','flood');set(floodHalo,'class','halo'+(lampOn?' w':''));pool.style.opacity=lampOn?'.85':'0';
const da=(now-motionT)/1000;detG.style.opacity=da<1.1?f2(red?1:Math.min(1,da*8)*(1-da/1.1)):'0';if(!red)set(detG,'transform',`scale(${f2(1.25-.25*Math.min(1,da*5))})`);
light();const cut=(now-cutT)/1000,cv=cut<.14&&!red?'.35':'1';if(cv!==cutV){cutV=cv;svg.style.setProperty('--cut',cv);}
if(whir)whir.gain.setTargetAtTime(Math.min(1,(Math.abs(vp)+Math.abs(vt))/160)*.006,ac.currentTime,.06);
if(lastUI<0||now-lastUI>120){lastUI=now;ui();}requestAnimationFrame(tick);}
assemble();light();ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
