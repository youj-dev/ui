// @ts-nocheck
/* KEVRA PT–4 · Security camera. Drawn for this package in the lab figures' form: its stylesheet, defs and script,
 * on the engine's kit. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--rubber:#2e2e2d;--dk:#3a3a39;--dk-top:#4a4a48;--dk-side:#2d2d2c;--conc:#c9c8c3;--conc-top:#dfdeda;--conc-side:#b3b2ad;--plinth:#a9a8a4;--roof:#a3a29e;--pave:#d3d3cf;--pave-top:#e6e6e2;--pave-side:#c0c0bc;--door:#5b6066;--pane:#40505a;--lens:#14171b;--lens-in:#22303a;--lens-rim:#30363d;--coat:#4f9fc4;--ir:#d02a5a;--ir-off:#6b5a5e;--warm:#ffb347;--white:#f4f6ff}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--rubber:#252524;--dk:#2f2f2f;--dk-top:#454543;--dk-side:#1d1d1c;--conc:#a9a8a5;--conc-top:#d1d0cc;--conc-side:#7d7d7b;--plinth:#8e8d8a;--roof:#8d8c89;--pave:#b2b2af;--pave-top:#d7d7d3;--pave-side:#878786;--door:#4c5053;--pane:#34424b;--lens:#101215;--lens-in:#1d2830;--lens-rim:#2a2f35;--coat:#5fb0d4;--ir:#ff4d76;--ir-off:#5a4c50;--warm:#ffb04a;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.night{--lens-in:#2c1a33;--coat:#c45bd8}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.brandh{font-size:3px;letter-spacing:.85px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.dk{fill:var(--dk)}.top.dk{fill:var(--dk-top)}.side.dk{fill:var(--dk-side)}.rubber{fill:var(--rubber)}.conc{fill:var(--conc)}.top.conc{fill:var(--conc-top)}.side.conc{fill:var(--conc-side)}.pave{fill:var(--pave)}.top.pave{fill:var(--pave-top)}.side.pave{fill:var(--pave-side)}.plinth{fill:var(--plinth)}.roof{fill:var(--roof)}.door{fill:var(--door)}.pane{fill:var(--pane);fill-opacity:.5}
.joint{fill:none;stroke:var(--line);stroke-width:.5;opacity:.3}.seam{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.55}.tie{fill:var(--recess);stroke:none;opacity:.6}
.su,.sr,.sm{fill:none;stroke-linecap:round;stroke-linejoin:round}.su{stroke:var(--line)}.sr{stroke:var(--rubber)}.sm{stroke:var(--metal)}
.irled{fill:var(--ir-off);stroke:none}.night .irled{fill:var(--ir);filter:url(#glow)}.priv .irled{fill:var(--ir-off);filter:none}.irhalo{fill:var(--ir);opacity:0;filter:url(#bloom)}.night .irhalo{opacity:.55}.priv .irhalo{opacity:0}
.lensg{fill:url(#glassG);stroke:none;opacity:var(--cut,1)}.coat{fill:none;stroke:var(--coat);stroke-width:.9;stroke-linecap:round;opacity:.75}.spec{fill:#fff;opacity:.75;stroke:none}.iris{fill:#050607;stroke:none}.shutter{fill:var(--top);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.grip{fill:none;stroke:var(--recess);stroke-width:.7;stroke-linecap:round}
.fov{fill:var(--accent);fill-opacity:.07;stroke:var(--accent);stroke-width:.8;stroke-dasharray:2.4 2.2;stroke-linejoin:round;vector-effect:non-scaling-stroke;opacity:.85}.night .fov{fill:var(--ir);fill-opacity:.05;stroke:var(--ir)}.priv .fov,.priv .aim{opacity:0}.irpool{fill:var(--ir);opacity:0;filter:url(#bloom)}.night .irpool{opacity:.22}.priv .irpool{opacity:0}
.aim{fill:none;stroke:var(--accent);stroke-width:.8;stroke-linecap:round;vector-effect:non-scaling-stroke}.night .aim{stroke:var(--ir)}.det{fill:none;stroke:var(--warn);stroke-width:1.2;stroke-linecap:round;vector-effect:non-scaling-stroke;opacity:0}
.lamp{fill:var(--off);stroke:none}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.w{fill:var(--warm)}.lamp.i{fill:var(--ir)}.lamp.g,.lamp.a,.lamp.r,.lamp.b,.lamp.w,.lamp.i{filter:url(#glow)}.halo{opacity:0;filter:url(#bloom)}.halo.w{fill:var(--warm);opacity:.6}.halo.r{fill:var(--fault);opacity:.45}
.sring{fill:var(--off);stroke:none}.sring.g{fill:var(--ok)}.sring.b{fill:var(--accent)}.sring.a{fill:var(--warn)}.sring.w{fill:var(--white)}.sring.g,.sring.b,.sring.a,.sring.w{filter:url(#glow)}
.pool{opacity:0}.wash{opacity:0}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="glassG" cx=".4" cy=".36" r=".72"><stop offset="0" style="stop-color:var(--lens-in)"/><stop offset=".7" style="stop-color:var(--lens)"/><stop offset="1" style="stop-color:var(--lens-rim)"/></radialGradient>
<radialGradient id="warmG"><stop offset="0" style="stop-color:var(--warm);stop-opacity:.6"/><stop offset="1" style="stop-color:var(--warm);stop-opacity:0"/></radialGradient>
<linearGradient id="washG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--warm);stop-opacity:.45"/><stop offset="1" style="stop-color:var(--warm);stop-opacity:0"/></linearGradient>
<clipPath id="lensClip"><circle r="8.2"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* KEVRA PT–4 on a building corner. World: x lower-right, y lower-left, z up; pan from the corner's diagonal (+x+y), tilt from the horizon.
Part                        x      y      z      w      d      h
yard slab                   0      0     −3    104    104      3   paving joints; the field of view lands on it
walls                       0      0      0     58     58     70   an L, 12 thick: panels, tie holes, plinth, coping
door + step                10     58      0     16      –     34   vision panel, handle; security lamp above at z 38.5
wall plate                 58     38     48    1.6     12     18   on the right face, four screws
arm + brace            r 2.8  59.6 → 74 at y 44, z 58             brace from the plate's foot
conduit + junction box     58      6     43    3.6     12     12   privacy key switch, REC lamp; drip loop from the plate
pan unit               r 7     74     44   47.4      –      –     12   status ring, day/night sensor on top
yoke                    crossbar 25 × 7 × 2.6 under the pan unit, arms to the tilt axis at 74 44 31, knobs
head                    r 8, −11 … +15 along the look axis; bezel, IR ring, REC light, lens barrel, privacy shutter
Painter order: yard, field of view, walls, door, plate, conduit and box, arm; far yoke arm, head, near arm, crossbar, pan unit; controls. */
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
// Ground: the yard's paving, then the layer the field of view, the IR flood and the lamp's pool draw on, clipped to it.
const sh=P(54,54,-3);el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]+4),rx:112,ry:62,class:'shadow stage-floor'});el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]+4),rx:112,ry:62,class:'stage-contact'});
box(0,0,-3,104,104,3,3,'pave');const yt=group(TOP(0,0,.02));for(let k=13;k<104;k+=13){line(yt,k,1.5,k,102.5,'joint');line(yt,1.5,k,102.5,k,'joint');}
el('path',{d:poly([[0,0,0],[104,0,0],[104,104,0],[0,104,0]],true)},el('clipPath',{id:'yard'},svg.querySelector('defs')));
const fovG=el('g',{'clip-path':'url(#yard)'}),pool=el('ellipse',{cx:18.5,cy:68,rx:15,ry:9.5,fill:'url(#warmG)',class:'pool'},group(TOP(0,0,.04),fovG)),irPool=el('path',{class:'irpool'},fovG),fov=el('path',{class:'fov'},fovG);
const aimG=el('g',{},fovG);circle(aimG,0,0,2.6,'aim');for(const[a,b,c,d]of[[-5,0,-3.4,0],[3.4,0,5,0],[0,-5,0,-3.4],[0,3.4,0,5]])line(aimG,a,b,c,d,'aim');
const detG=el('g',{class:'det'},aimG);for(const[sx,sy]of[[-1,-1],[1,-1],[1,1],[-1,1]])el('path',{d:`M${sx*9},${sy*5.5}L${sx*9},${sy*9}L${sx*5.5},${sy*9}`},detG);
// Building corner: two concrete walls meeting at the corner, panels with tie holes, plinth and coping; the door, its step and the security lamp.
const fw=group(FRONT(0,58,70)),rw=group(SIDE(58,58,70));for(const g of[rw,fw])rect(g,0,0,58,70,1.2,'face conc'+(g===rw?' side':''));
el('path',{d:poly([[0,45,70],[45,45,70],[45,0,70],[58,0,70],[58,58,70],[0,58,70]],true),class:'face top conc'});
el('path',{d:poly([[0,46.5,70.05],[46.5,46.5,70.05],[46.5,0,70.05]]),class:'seam'});
for(const[g,door]of[[fw,1],[rw,0]]){rect(g,0,64,58,6,1,'face plinth');rect(g,0,0,58,2.4,.8,'face metal');line(g,0,35,58,35,'seam');line(g,29,2.4,29,64,'seam');
for(const u of[7.5,21.5,36.5,50.5])for(const v of[9,26,43,58])if(!(door&&u>6&&u<29&&v>30))circle(g,u,v,.85,'tie');}
rect(fw,8.5,34.5,19,35.5,.8,'face recess');rect(fw,10,36,16,34,.5,'face door');rect(fw,12.6,39,3.2,15,.6,'pane');rect(fw,22,51,1.4,5.6,.7,'face metal');line(fw,10,66.4,26,66.4,'seam');
const wash=el('path',{d:'M16.5,34L20.5,34L27.5,69.5L9.5,69.5Z',fill:'url(#washG)',class:'wash'},fw);
box(6,58,0,24,6,2.2,.8,'conc');const lampC=cylinder(18.5,58,38.5,2.4,1.8,'y','metal');const doorLamp=lamp(lampC.face,0,0,1.7),dq=P(18.5,59.8,38.5),doorHalo=el('circle',{cx:f2(dq[0]),cy:f2(dq[1]),r:8,class:'halo'});
// Right face: the camera's wall plate, a drip loop into the conduit, the junction box with the privacy key switch.
box(58,38,48,1.6,12,18,1.4,'metal');const mp=group(SIDE(59.6,50,66));for(const[u,v]of[[2.2,2.2],[9.8,2.2],[2.2,15.8],[9.8,15.8]])screw(mp,u,v);
tube(root,[59.4,18,49],[59.4,30.5,49],1.2,'metal');tube(root,[59.4,12,0],[59.4,12,44],1.2,'metal');
box(58,6,43,3.6,12,12,1.4,'');const jb=group(SIDE(61.6,18,55));circle(jb,6,4.8,2.4,'face metal');circle(jb,6,4.8,1.3,'face recess');line(jb,6,3.9,6,5.7);const boxLamp=lamp(jb,3.6,9.6,.65);text(jb,5,10.5,'REC','etch micro');
sk(smooth([[59.6,39,50.5],[61.6,37,46.5],[61.8,33.4,46],[60.2,30.5,49]]),1.2,'sr');
tube(root,[59.6,44,51.6],[66.5,44,57.4],.85,'metal');tube(root,[59.6,44,58],[74,44,58],2.8,'metal');
// The moving head, rebuilt in painter order as it pans and tilts; the pan unit above it is static.
const L={far:el('g',{}),cab0:el('g',{}),head:el('g',{}),cab1:el('g',{}),near:el('g',{}),yoke:el('g',{})};
const panG=into(el('g',{}));cylinder(74,44,45.6,5.8,1.8,'z','dk');const pu=cylinder(74,44,47.4,7,12,'z','');circle(pu.face,0,0,4.2,'detail');const ring=band(panG,[74,44,49],[74,44,50.6],7.1,'sring');set(ring,'class','sring');ring._c='';
const sens=cylinder(74,44,59.4,2.2,1,'z','glass'),photo=lamp(sens.face,0,0,1.25);into(draw);
const PIV=[74,44],TZ=31,HOME=45,Z=[1,2,4],LB=[1.8,4,7.4],REST=[18,-46],P0=4.487;
let[pan,tilt]=REST,vp=0,vt=0,[tp,tt]=REST,zi=0,lb=LB[0],zNow=1,shut=0,iris=1.4,night=false,privacy=false,events=0;
let ptr=null,lostUntil=0,manual=null,manualAt=-1e9,lastMove=null,speed=0,patrolT=P0,twitchT=-1e9,motionT=-1e9,snapT=-1e9,cutT=-1e9,lampT=-1e9,flash='',flashT=0,last=0,lastUI=-1,drawn='',mode='PATROL',rec=null,cutV='1';
function pose(){const p=(HOME+pan)*RAD,t=tilt*RAD,g=[Math.cos(p),Math.sin(p),0],s=[-Math.sin(p),Math.cos(p),0],f=[Math.cos(t)*g[0],Math.cos(t)*g[1],Math.sin(t)],u=[-Math.sin(t)*g[0],-Math.sin(t)*g[1],Math.cos(t)];return{g,s,f,u,T:[PIV[0],PIV[1],TZ]};}
function assemble(){const{g,s,f,u,T}=pose(),F=add(T,mul(f,15)),B=add(T,mul(f,-11)),near=dot(s,VIEW)>=0?1:-1,front=dot(f,VIEW)>0;for(const k in L)L[k].replaceChildren();
for(const side of[-near,near]){const gp=side===near?L.near:L.far;obox(gp,add(add(T,mul(s,side*11.4)),[0,0,6.4]),g,s,[0,0,1],7,2.2,16.4,'',1.1);const k=tube(gp,add(T,mul(s,side*9.6)),add(T,mul(s,side*13.4)),3.4,'dk');circle(k,0,0,1.3,'face metal');}
obox(L.yoke,[T[0],T[1],TZ+13.35],s,g,[0,0,1],25,7,2.6,'',1.2);
const barrel=()=>{const c=tube(L.head,F,add(F,mul(f,lb)),4.4,'dk');if(c.front){circle(c,0,0,3.7,'lensg');el('path',{d:'M-2.5,-1.5A2.9,2.9 0 0 1 .6,-2.9',class:'coat'},c);circle(c,0,0,iris,'iris');circle(c,-1.15,-1.35,.5,'spec');circle(c,0,0,4.4,'detail');}};
if(!front)barrel();
const c=tube(L.head,B,F,8,'');if(c.front){circle(c,0,0,8,'face dk');circle(c,0,0,6.9,'detail');circle(c,0,0,7.6,'irhalo');for(let i=0;i<12;i++){const a=(i*30+15)*RAD;circle(c,5.75*Math.cos(a),5.75*Math.sin(a),.55,'irled');}const ru=[dot(u,c.U),dot(u,c.V)];rec=lamp(c,ru[0]*7.35-ru[1]*2.2,ru[1]*7.35+ru[0]*2.2,.5);}
else{circle(c,0,0,5,'detail');const q=[-dot(u,c.U)*3.4,-dot(u,c.V)*3.4];circle(c,q[0],q[1],1.6,'face rubber');circle(c,q[0],q[1],.65,'face dk');}
band(L.head,add(F,mul(f,-2.6)),F,8.25,'dk');band(L.head,add(B,mul(f,2.2)),add(B,mul(f,2.9)),8.1,'dk');
const vs=unit(sub(VIEW,mul(f,dot(VIEW,f)))),tw=P(...f)[0]>=0?f:mul(f,-1);let w2=unit(cross(tw,vs));if(P(...w2)[1]<0)w2=mul(w2,-1);const tg=group(plane(add(add(T,mul(vs,8.05)),add(mul(f,2.8),mul(tw,-6.6))),tw,w2),L.head);text(tg,0,1,'KEVRA','label brandh');rec=null;
if(front){barrel();const sp=group(plane(add(F,mul(f,lb+.35)),c.U,c.V),L.head),cl=el('g',{'clip-path':'url(#lensClip)'},sp),x0=-8.4-(1-shut)*16.8;rect(cl,x0,-8.4,16.8,16.8,1.4,'shutter');line(cl,x0+14.6,-5.6,x0+14.6,5.6,'grip');line(cl,x0+13,-5.6,x0+13,5.6,'grip');}
const back=add(B,mul(u,-3)),cab=sk(smooth([back,add(back,add(mul(f,-4.5),[0,0,-1.2])),add(add(T,mul(g,-6.5)),[0,0,7]),[T[0]-g[0]*3.5,T[1]-g[1]*3.5,TZ+12]]),1.2,'sr',front?L.cab0:L.cab1);
const hc=P(...add(T,mul(f,4)));for(const n of[hHit,hRing]){set(n,'cx',f2(hc[0]));set(n,'cy',f2(hc[1]));}
// Field of view: the four frustum rays on the yard (capped far out), the aim point at the center.
const Lp=add(T,mul(f,15+lb)),hh=Math.tan(23/zNow*RAD),vh=Math.tan(15/zNow*RAD),pts=[];for(const[a,b]of[[-1,1],[1,1],[1,-1],[-1,-1]]){const r=add(f,add(mul(s,a*hh),mul(u,b*vh))),k=r[2]<-1e-3?Math.min(-Lp[2]/r[2],170):170,q=add(Lp,mul(r,k));q[2]=0;pts.push(q);}
const ka=f[2]<-1e-3?-Lp[2]/f[2]:1e9,on=ka<170,d=on?poly(pts,true):'';set(fov,'d',d);set(irPool,'d',d);fov.style.opacity=on?'':'0';
if(on){const A=add(Lp,mul(f,ka));set(aimG,'transform',TOP(A[0],A[1],.05));aimG.style.opacity='';}else aimG.style.opacity='0';}
// Controls on top: the head takes a snapshot, the pan unit's sensor switches night vision, the junction box closes the shutter.
const hBtn=button(el('g',{}),{'aria-label':'Take a snapshot (Space)'}),hHit=el('circle',{r:14,class:'hit'},hBtn),hRing=el('circle',{r:15.5,class:'focus-ring'},hBtn);
const pq=P(74,44,54),nBtn=button(el('g',{}),{'aria-label':'Night vision (N)','aria-pressed':'false'});el('circle',{cx:f2(pq[0]),cy:f2(pq[1]),r:9,class:'hit'},nBtn);el('circle',{cx:f2(pq[0]),cy:f2(pq[1]),r:10,class:'focus-ring'},nBtn);
const bBtn=button(el('g',{}),{'aria-label':'Privacy shutter (P)','aria-pressed':'false'}),bq=group(SIDE(61.6,18,55),bBtn);rect(bq,-1.5,-1.5,15,15,2,'hit');rect(bq,-1,-1,14,14,2,'focus-ring');
frame([[0,0,-3,104,104,3],[0,0,0,58,58,70]],12);
// State: pointer tracking, patrol, manual jogs, zoom, night, privacy and snapshots; audio after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const say=m=>{announcement.textContent=m;},pad=n=>String(n).padStart(2,'0'),sg=v=>{const r=Math.round(v*10)/10;return(r<0?'−':'+')+Math.abs(r).toFixed(1);},hush=v=>Math.abs(Math.round(v));
const note=(m,ms=1500)=>{flash=m;flashT=performance.now()+ms;lastUI=-1;};
let ac=null,whir=null;
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();const o=ac.createOscillator(),fl=ac.createBiquadFilter();o.type='sawtooth';o.frequency.value=96;fl.type='lowpass';fl.frequency.value=380;whir=ac.createGain();whir.gain.value=0;o.connect(fl);fl.connect(whir);whir.connect(ac.destination);o.start();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){}}
function tone(f,d=.07,v=.012,w=0,type='sine'){if(!ac)return;try{const t=ac.currentTime+w,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
/* Where to look for a point on the drawing: the spot on the yard under it. A spot behind the line across the pivot
 * (the wall's side) is pushed out onto that line and the head tilts up with it, so it turns toward the pointer
 * and never into its own wall; right below the pivot the pan eases home. */
function aimAt(x,y){const gx=(x/C+y/S)/2,gy=(y/S-x/C)/2,push=Math.max(0,PIV[0]+PIV[1]-gx-gy),dx=gx+push/2-PIV[0],dy=gy+push/2-PIV[1],rh=Math.hypot(dx,dy);
let a=((Math.atan2(dy,dx)/RAD-HOME+540)%360)-180;a*=ramp(0,24,rh);return[clamp(a,-92,92),clamp(Math.atan2(-TZ,rh)/RAD+push*.5,-82,18)];}
function patrolAt(t){const k=((t%17)+17)%17,e=x=>(1-Math.cos(Math.PI*x))/2,a=k<7?-1+2*e(k/7):k<8.5?1:k<15.5?1-2*e((k-8.5)/7):-1;return[a*42,REST[1]+3*Math.sin((t-P0)*.8)];}
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
function jog(dp,dt){audio();if(privacy){note('PRIVACY · P TO OPEN');say('The privacy shutter is closed. Press P to open it.');return;}const base=performance.now()-manualAt<5000?manual:[pan,tilt];manual=[clamp(Math.round(base[0]+dp),-90,90),clamp(Math.round(base[1]+dt),-80,18)];manualAt=performance.now();ptr=null;tone(300,.05,.008,0,'triangle');say(`Pan ${hush(manual[0])} degrees ${manual[0]>0?'left':manual[0]<0?'right':'center'}, tilt ${hush(manual[1])} degrees ${manual[1]<0?'down':'up'}.`);}
bind(hBtn,shot);bind(nBtn,nightToggle);bind(bBtn,privacyToggle);
const act={' ':shot,z:zoomStep,n:nightToggle,p:privacyToggle,ArrowLeft:()=>jog(10,0),ArrowRight:()=>jog(-10,0),ArrowUp:()=>jog(0,5),ArrowDown:()=>jog(0,-5)};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(k===' '&&e.target.closest&&e.target.closest('button,[role=button]'))return;const fn=act[k];if(fn){e.preventDefault();if(!e.repeat||k.startsWith('Arrow'))fn();}});
function ui(){readout.textContent=`PAN ${sg(-pan)}° · TILT ${sg(tilt)}° · ${zNow.toFixed(1)}×`;stateLabel.textContent=performance.now()<flashT?flash:privacy?'PRIVACY · SHUTTER CLOSED':`${mode} · REC · ${night?'IR NIGHT':'DAY'}`;}
function tick(now){const dt=last?Math.min((now-last)/1000,.05):0,red=reduced.matches;last=now;
if(privacy){mode='PRIVACY';tp=0;tt=-16;}else if(ptr){mode='TRACKING';[tp,tt]=ptr;}else if(now-manualAt<5000){mode='MANUAL';[tp,tt]=manual;}else if(now<lostUntil)mode='TARGET LOST';else if(red){mode='HOME';[tp,tt]=REST;}else{mode='PATROL';patrolT+=dt;[tp,tt]=patrolAt(patrolT);}
if(red){pan=tp;tilt=tt;vp=vt=0;}else{const W=8,ap=W*W*(tp-pan)-2*W*vp,at=W*W*(tt-tilt)-2*W*vt;vp=clamp(vp+ap*dt,-240,240);vt=clamp(vt+at*dt,-180,180);pan+=vp*dt;tilt+=vt*dt;}
const tw=(now-twitchT)/1000,kick=red||tw>1.1?0:Math.exp(-tw*4.2)*Math.sin(tw*15);lb+=(LB[zi]-lb)*(red?1:1-Math.exp(-dt*9));zNow=Z[zi]*(1+.8*Math.max(0,kick))+(lb-LB[zi])*.3;
shut=red?+privacy:clamp(shut+(privacy?dt:-dt)*3.2);const si=(now-snapT)/1000;iris=si<.22&&!red?1.4+2.3*Math.sin(Math.PI*si/.22):1.4-.5*Math.max(0,kick);
const key=[pan,tilt,lb+kick*3.2,shut,iris].map(f2).join();if(key!==drawn){drawn=key;const keep=lb;lb+=kick*3.2;assemble();lb=keep;}
const blink=red||now%1200<760;if(rec)lit(rec,!privacy&&blink?'r':'');lit(boxLamp,privacy?'a':'g');lit(photo,night?'i':'');
lit(ring,privacy?'':now-motionT<1300?'a':now-snapT<260?'w':mode==='TRACKING'||mode==='MANUAL'?'b':'g','sring');
const lampOn=now-lampT<4000;lit(doorLamp,lampOn?'w':'');set(doorHalo,'class','halo'+(lampOn?' w':''));pool.style.opacity=lampOn?'.85':'0';wash.style.opacity=lampOn?'1':'0';
const da=(now-motionT)/1000;detG.style.opacity=da<1.1?f2(red?1:Math.min(1,da*8)*(1-da/1.1)):'0';if(!red)set(detG,'transform',`scale(${f2(1.25-.25*Math.min(1,da*5))})`);
const cut=(now-cutT)/1000,cv=cut<.14&&!red?'.35':'1';if(cv!==cutV){cutV=cv;svg.style.setProperty('--cut',cv);}
if(whir)whir.gain.setTargetAtTime(Math.min(1,(Math.abs(vp)+Math.abs(vt))/160)*.006,ac.currentTime,.06);
if(lastUI<0||now-lastUI>120){lastUI=now;ui();}requestAnimationFrame(tick);}
assemble();ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
