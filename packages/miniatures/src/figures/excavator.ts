// @ts-nocheck
/* BRANTOK E–35 · Excavator. Its stylesheet, defs and script, drawn on the engine in the figures' house style (the kit's
 * projection and helpers, the shared palette, stage and filters). The script runs on the env, which stands in for the
 * page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--recess:#9d9d99;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--warn:#e88a00;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--chrome:#d9dad8;--chrome-top:#f4f4f2;--chrome-side:#bdbebc;--rubber:#2e2e2d;--rubber-top:#474745;--rubber-side:#282827;--paint:#eab13a;--paint-top:#f6cc62;--paint-side:#c98f22;--cw:#4b4b48;--cw-top:#62625e;--cw-side:#383836;--cab:#3f4446;--cab-top:#545a5c;--cab-side:#2f3335;--glass:#cfdadd;--glass-hi:#eef3f4;--dirt:#9c7652;--dirt-top:#b98f66;--dirt-side:#7c5a3c;--pit:#6e5139;--pit-top:#5e4530;--pit-side:#59412d;--cone:#ee6b2f;--cone-side:#c9531f;--band:#f6f5f1;--plate:#f6f5f1;--beacon:#ffad2b;--puff:#e6e6e2;--sheen:.3;--scuff:.16}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--recess:#6e6e6c;--off:#9b9b99;--warn:#ffad2b;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--chrome:#b7b7b6;--chrome-top:#e4e4e2;--chrome-side:#858585;--rubber:#252524;--rubber-top:#424240;--rubber-side:#191919;--paint:#c5952f;--paint-top:#e6bf5b;--paint-side:#8e6415;--cw:#3e3e3c;--cw-top:#5b5b57;--cw-side:#252524;--cab:#343839;--cab-top:#4e5456;--cab-side:#1f2122;--glass:#a9b4b7;--glass-hi:#d5dcdd;--dirt:#836244;--dirt-top:#ad855f;--dirt-side:#563d28;--pit:#5c432e;--pit-top:#57402c;--pit-side:#3d2b1d;--cone:#c95926;--cone-side:#8e3813;--band:#d4d4d1;--plate:#d4d4d1;--beacon:#ffb43d;--puff:#a9a9a6;--line:#444443;--sheen:.14;--scuff:.2}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.micro{font-size:1.9px;letter-spacing:.25px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}.side.rubber{fill:var(--rubber-side)}.paint{fill:var(--paint)}.top.paint{fill:var(--paint-top)}.side.paint{fill:var(--paint-side)}.cw{fill:var(--cw)}.top.cw{fill:var(--cw-top)}.side.cw{fill:var(--cw-side)}.cab{fill:var(--cab)}.top.cab{fill:var(--cab-top)}.side.cab{fill:var(--cab-side)}
.dirt{fill:var(--dirt)}.top.dirt{fill:var(--dirt-top)}.side.dirt{fill:var(--dirt-side)}.pit{fill:var(--pit)}.top.pit{fill:var(--pit-top)}.side.pit{fill:var(--pit-side)}.cone{fill:var(--cone)}.side.cone{fill:var(--cone-side)}.band{fill:var(--band)}.cavity{fill:var(--cw-side)}
.glass{fill:var(--glass);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke;stroke-linejoin:round}.side.glass{fill:var(--glass);filter:brightness(.88)}.gl{fill:none;stroke:var(--glass-hi);stroke-width:.8;stroke-linecap:round;opacity:.9}
.tread{fill:none;stroke:var(--rubber-top);stroke-width:1.2;stroke-dasharray:1.1 1.5}.grouser{stroke:var(--rubber-side);stroke-width:10;stroke-dasharray:.8 2.2}.strata{fill:none;stroke:var(--dirt-side);stroke-width:.5;opacity:.55;stroke-dasharray:3 1.6}.rim{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.scuff{fill:var(--dirt);opacity:var(--scuff);filter:url(#soft)}.mound{fill:url(#moundG);stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke;stroke-linejoin:round}.pebble{fill:var(--dirt-side);stroke:none}.crumb{fill:var(--dirt-side);stroke:none}.clod{fill:var(--dirt-top);stroke:none}
.ho{fill:none;stroke:var(--line);stroke-linecap:round}.hb{fill:none;stroke:var(--paint);stroke-linecap:round}.hr{fill:none;stroke:var(--chrome-top);stroke-linecap:round}.hk{fill:none;stroke:var(--cw);stroke-linecap:round}.hi{fill:none;stroke:#fff;stroke-width:.45;stroke-linecap:round;opacity:.75}
.pin{fill:var(--metal);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.pin2{fill:var(--cw);stroke:none}
.drum-shade,.cone-shade{fill:#000;opacity:.12;stroke:none;pointer-events:none}.drum-sheen{fill:#fff;opacity:var(--sheen);stroke:none;pointer-events:none}
.plate{fill:var(--plate);stroke:var(--line);stroke-width:.4;vector-effect:non-scaling-stroke}.brand{fill:#2b2b2a;font:italic 700 3.1px Georgia,'Times New Roman',serif;letter-spacing:.25px;stroke:none}.model{fill:#5a5a58;font:600 1.5px ui-monospace,monospace;letter-spacing:.3px;stroke:none}
.bl{fill:var(--off);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke}.bl.on{fill:var(--beacon);stroke:none;filter:url(#glow)}.bh{fill:var(--beacon);filter:url(#bloom);opacity:0;pointer-events:none}
.puff{fill:url(#puffG);stroke:none;pointer-events:none}.horn{fill:none;stroke:var(--ink);stroke-width:.7;stroke-linecap:round;opacity:0;pointer-events:none}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="moundG" cx=".5" cy=".55" r=".62" fx=".36" fy=".26"><stop offset="0" style="stop-color:var(--dirt-top)"/><stop offset=".55" style="stop-color:var(--dirt)"/><stop offset="1" style="stop-color:var(--dirt-side)"/></radialGradient>
<radialGradient id="puffG"><stop offset="0" style="stop-color:var(--puff);stop-opacity:.9"/><stop offset=".6" style="stop-color:var(--puff);stop-opacity:.4"/><stop offset="1" style="stop-color:var(--puff);stop-opacity:0"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* BRANTOK E–35. World: x lower-right (the tracks run along it), y lower-left (front faces look along +y), z up; 1 unit ≈
3.5 cm. The upper structure turns about the z axis at the origin; its parts are listed in its own frame (u along the arm,
v to the operator's left, w up), at swing 0 the same as x, y, z.
Part                          x      y      z      w      d      h
tracks (2)                  −32  −21/9      0     64     12     13   rubber, stadium ends, sprocket, idler, three rollers
centre frame                −14     −9      3     28     18     10   between the tracks
dozer blade                  34    −22      1    3.5     44    9.5   arms back to the frame
swing ring              r 17 at 0 0, z 13–16
house                   r 23 at 0 0, z 16–30   counterweight round the rear (u < 0), z 16–27
cab                 u −12…9, v 1…19, w 30–57   glazed on four sides, roof to 59.5, beacon on it
hood                u −16…4, v −18…−2, w 30–41 louvres, exhaust stack at u −11.5 v −13 to w 48; toolbox u 4…15, v −17…−6
swing bracket       u 20.5–29.5, v ±5.5, w 15–31
boom                foot at u 25 w 27, chord 54, bent up 10; width 7   boom cylinder under it, stick cylinder on top
stick               36 from the boom tip to the bucket pin; width 5     bucket cylinder and its two links on its outside
bucket              pin to teeth 18.5, width 13; holds one load
dig site (pit)               48    −14      0     32     28   −7…−20   battered walls, floor, strata; two cones
spoil pile          centre 0 58: radius 8–18, height 3.5–15 with what it holds
Painter: floor and shadows, pit, the bucket's shadow, tracks, frame and blade, pile, then the upper structure (the house,
then the cab, toolbox, hood and arm sorted by depth), crumbs, puffs and the horn's rings. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{P,set,el,group,rect,circle,line,text,poly,box,cylinder,frame,TOP,FRONT,SIDE}=kit(()=>root);
// Figure helpers: vectors, oriented planes, hulls, oriented boxes and extruded profiles (each a fixed set of paths), tubes.
const draw=root,into=g=>root=g,dfs=svg.querySelector('defs');
const{cos,sin,abs,max,min,sqrt,atan2,acos,hypot}=Math,RAD=Math.PI/180,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>max(a,min(b,v)),VW=[1,1,1],R=Math.random;
const add=(a,b,k=1)=>a.map((v,i)=>v+b[i]*k),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],unit=a=>mul(a,1/(hypot(...a)||1)),lerp=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const Q=p=>P(...p).map(f2).join(','),pd=q=>q.length?'M'+q.map(p=>f2(p[0])+','+f2(p[1])).join('L')+'Z':'',plane=(o,U,V)=>`matrix(${[...P(...U),...P(...V),...P(...o)].map(f2).join(' ')})`;
const shade=n=>n[2]>.6?'top ':n[0]>n[1]?'side ':'';
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const p of pts){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(const p of pts.reverse()){while(hi.length>1&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
const ring=(r,z,n,cx,cy,a0=0,a1=360)=>Array.from({length:n},(_,i)=>{const a=(a0+(a1-a0)*i/(n-1))*RAD;return[cx+r*cos(a),cy+r*sin(a),z];});
function obox(g,m){const s=[0,1,2].map(()=>el('path',{},g));s.m=m;return s;}
function obx(s,c,a,b,h){let i=0;for(const[n,p,q]of[[a,b,h],[b,h,a],[h,a,b]])for(const k of[1,-1]){const N=mul(n,k);if(dot(N,VW)<=0)continue;const f=add(c,N),u=unit(N);set(s[i],'d',poly([add(add(f,p),q),add(sub(f,p),q),sub(sub(f,p),q),sub(add(f,p),q)],true));set(s[i++],'class','face '+shade(u)+s.m);}for(;i<3;i++)set(s[i],'d','');}
// An extruded profile: a polygon in a plane (axes A, B), w thick along N. Its rim strips facing us, then its near face.
function slab(g,pts,m){let a=0;pts.forEach((p,i)=>{const q=pts[(i+1)%pts.length];a+=p[0]*q[1]-q[0]*p[1];});if(a<0)pts=pts.slice().reverse();return{pts,m,e:pts.map(()=>el('path',{},g)),f:el('path',{class:'face '+m},g)};}
function slb(s,O,A,B,N,w){const sg=dot(N,VW)>0?1:-1,W=s.pts.map(([x,y])=>add(add(O,A,x),B,y)),n=W.map(p=>add(p,N,sg*w)),f=W.map(p=>add(p,N,-sg*w));
s.pts.forEach(([x,y],i)=>{const j=(i+1)%W.length,[x2,y2]=s.pts[j],nr=add(mul(A,y2-y),B,x-x2),e=s.e[i];if(dot(nr,VW)>0){set(e,'d',poly([f[i],f[j],n[j],n[i]],true));set(e,'class','face '+shade(unit(nr))+s.m);}else set(e,'d','');});
set(s.f,'d',poly(n,true));set(s.f,'class','face '+shade(mul(N,sg))+s.m);return sg;}
// A hydraulic cylinder from a to b: its barrel (fixed length) and the chrome rod out of it, as round-capped strokes.
function hyd(g,rb,rr){const n=[['ho',rr*2+.8],['hr',rr*2],['ho',rb*2+.8],['hb',rb*2],['hi',.45]].map(([c,w])=>el('path',{class:c,'stroke-width':f2(w)},g));return{n,rb};}
function hy(h,a,b,len){const d=sub(b,a),l=hypot(...d)||1,e=add(a,d,min(len,l-1.5)/l),pa=Q(a),pe=Q(e),pb=Q(b),hiA=Q(add(a,d,1.5/l)),hiB=Q(add(e,d,-1.5/l));
set(h.n[0],'d',`M${pe}L${pb}`);set(h.n[1],'d',`M${pe}L${pb}`);set(h.n[2],'d',`M${pa}L${pe}`);set(h.n[3],'d',`M${pa}L${pe}`);set(h.n[4],'d',`M${hiA}L${hiB}`);set(h.n[4],'transform',`translate(${f2(-h.rb*.35)} ${f2(-h.rb*.55)})`);}
// Vertical tubes (exhaust, beacon base): a stadium for the body, a circle for the cap.
function vt(g,m){return{b:el('path',{class:'face '+m},g),c:circle(el('g',{},g),0,0,1,'face top '+m).parentNode};}
function vtb(t,c,h,r){const a=P(...c),b=P(c[0],c[1],c[2]+h),rx=r*1.2247,ry=r*.7071;set(t.b,'d',`M${f2(a[0]-rx)},${f2(a[1])}A${f2(rx)},${f2(ry)} 0 0 0 ${f2(a[0]+rx)},${f2(a[1])}L${f2(b[0]+rx)},${f2(b[1])}L${f2(b[0]-rx)},${f2(b[1])}Z`);set(t.c,'transform',`${TOP(c[0],c[1],c[2]+h)} scale(${f2(r)})`);}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
const put=(n,k,v)=>{const c=n._a||(n._a={});if(c[k]!==v){c[k]=v;set(n,k,v);}},op=(n,v)=>{if(n._o!==v){n._o=v;n.style.opacity=v;}},vis=(n,on)=>{const v=on?'':'none';if(n._d!==v){n._d=v;n.style.display=v;}};
// Floor: the machine's shadow (the dark stage's floor and contact), the scuffed ground round the dig.
const s0=P(12,10,0);for(const c of['shadow stage-floor','stage-contact'])el('ellipse',{cx:f2(s0[0]),cy:f2(s0[1]+2),rx:84,ry:40,class:c});
rect(group(TOP(43,-19,0)),0,0,42,38,14,'scuff');
// The dig site: battered walls (the two we see into), the floor, strata, the rim; rebuilt as it deepens.
const X0=48,X1=80,Y0=-14,Y1=14;
const wallA=el('path',{class:'face side dirt'}),wallB=el('path',{class:'face dirt'}),pitFloor=el('path',{class:'face top pit'}),strata=[0,1,2,3].map(()=>el('path',{class:'strata'}));el('path',{class:'rim',d:poly([[X0,Y0,0],[X1,Y0,0],[X1,Y1,0],[X0,Y1,0]],true)});
const pitInset=d=>.42*d;
function drawPit(d){const s=pitInset(d),a=[X0,Y0,0],b=[X1,Y0,0],e=[X0,Y1,0],fa=[X0+s,Y0+s,-d],fb=[X1-s,Y0+s,-d],fc=[X1-s,Y1-s,-d],fe=[X0+s,Y1-s,-d];
set(wallA,'d',poly([a,e,fe,fa],true));set(wallB,'d',poly([a,b,fb,fa],true));set(pitFloor,'d',poly([fa,fb,fc,fe],true));
[.36,.7].forEach((t,i)=>{set(strata[i],'d',poly([lerp(a,fa,t),lerp(e,fe,t)]));set(strata[i+2],'d',poly([lerp(a,fa,t),lerp(b,fb,t)]));});}
// Two cones at the near corners, and a couple of spoil clods on the rim.
function cone(x,y){box(x-3.4,y-3.4,0,6.8,6.8,1.2,.8,'rubber');const c=[x,y];
el('path',{d:pd(hull([...ring(3,1.2,18,...c),...ring(.7,11,18,...c)].map(p=>P(...p)))),class:'face cone'});el('path',{d:pd(hull([...ring(3,1.2,6,x,y,-45,30),...ring(.7,11,6,x,y,-45,30)].map(p=>P(...p)))),class:'cone-shade'});
const b=[...ring(2.15,4.6,10,x,y,-45,135),...ring(1.6,7,10,x,y,135,-45)];el('path',{d:pd(b.map(p=>P(...p))),class:'face band'});}
cone(86,-16.5);cone(83.5,19);
const bucketShadow=el('ellipse',{rx:9,ry:4.6,class:'shadow'});
for(const[x,y,r]of[[46,5,1.6],[50,16.4,1.2],[64,16.6,1.4]]){const p=P(x,y,.6);el('ellipse',{cx:f2(p[0]),cy:f2(p[1]),rx:f2(r*1.4),ry:f2(r*.8),class:'clod'});}
// The spoil pile: a mound round its centre that grows with what it holds, lit from the top left, a few pebbles on it.
const PX=0,PY=58;let mound;
const PEB=[[-30,.18,1.3],[10,.4,1],[60,.25,1.2],[95,.5,.9],[25,.7,.8],[-10,.55,1.1],[118,.15,1],[75,.75,.7]].map(([a,t,r])=>({a,t,r}));
const pileR=V=>8+10*V**.55,pileH=V=>3.5+11.5*V**.7,prof=[0,.28,.52,.72,.87,1];
function drawPile(V){const r=pileR(V),h=pileH(V),rad=t=>r*(1-t**1.9)**.62+.4,rings=prof.map(t=>ring(rad(t),h*t,32,PX,PY));
set(mound,'d',pd(hull(rings.flat().map(p=>P(...p)))));
for(const p of PEB){const q=P(...ring(rad(p.t)+.2,h*p.t,2,PX,PY,p.a,p.a)[0]);put(p.n,'cx',f2(q[0]));put(p.n,'cy',f2(q[1]));put(p.n,'rx',f2(p.r*min(1,.5+V)));put(p.n,'ry',f2(p.r*.6*min(1,.5+V)));}}
// Undercarriage (a control: Space digs): the far track, the frame and swing ring, the near track, the blade.
const baseCtl=button(el('g',{}),{'aria-label':'Run a dig cycle (Space)'});into(baseCtl);
function track(y0){for(const x of[-25.5,25.5])cylinder(x,y0,6.5,6.5,12,'y','rubber');const t=group(TOP(-25.5,y0,13));rect(t,0,0,51,12,0,'face top rubber');line(t,0,6,51,6,'grouser');
const f=group(FRONT(-32,y0+12,13));rect(f,0,0,64,13,6.5,'face rubber');el('rect',{x:.9,y:.9,width:62.2,height:11.2,rx:5.6,class:'tread'},f);rect(f,6.5,3.4,51,6.2,3.1,'face cw');
circle(f,7,6.5,4.9,'face cw');circle(f,7,6.5,3,'face top cw');for(let k=0;k<6;k++){const a=k*60*RAD;circle(f,f2(7+2.1*cos(a)),f2(6.5+2.1*sin(a)),.45,'pin2');}
circle(f,57,6.5,4.5,'face metal');circle(f,57,6.5,1.7,'face top metal');for(const u of[21,32,43])circle(f,u,9.7,1.6,'face metal');return f;}
track(-21);box(-14,-9,3,28,18,10,1.5,'cw');for(const y of[-12,9])box(14,y,3.5,21,3,3,.6,'cw');
track(9);
box(34,-22,1,3.5,44,9.5,1,'paint');{const s=group(SIDE(37.5,22,10.5));rect(s,0,7.4,44,2.1,.4,'face cw');for(const u of[11,22,33])line(s,u,1.2,u,6.6);}
const baseHit=P(6,0,8);el('ellipse',{cx:f2(baseHit[0]),cy:f2(baseHit[1]),rx:60,ry:30,class:'hit'},baseCtl);el('ellipse',{cx:f2(baseHit[0]),cy:f2(baseHit[1]),rx:62,ry:32,class:'focus-ring'},baseCtl);
into(draw);
rect(group(TOP(-13,43,0)),0,0,26,30,12,'scuff');mound=el('path',{class:'mound'});for(const p of PEB)p.n=el('ellipse',{class:'pebble'});
// The upper structure, which nods as the bucket bites: the house drum (its counterweight turns round it), then the
// cab, the hood and the arm, sorted by depth as it swings.
const upper=into(el('g',{}));cylinder(0,0,13,17,3,'z','cw');cylinder(0,0,16,23,14,'z','paint');
const cwBand=el('path',{class:'face cw'});
const sector=(r,z0,z1,a0,a1)=>{const n=14,lo=ring(r,z0,n,0,0,a0,a1),hi=ring(r,z1,n,0,0,a0,a1);return pd([...lo,...hi.reverse()].map(p=>P(...p)));};
el('path',{d:sector(23,16,30,-45,12),class:'drum-shade'});el('path',{d:sector(23,16.6,29.4,86,104),class:'drum-sheen'});
el('path',{d:pd(ring(23,27.6,20,0,0,-45,135).map(p=>P(...p))).slice(0,-1),class:'detail'});
const sorted=el('g',{}),items=[];function item(){const o={g:el('g',{},sorted),d:0};items.push(o);return o;}
const HOOD=item(),TOOL=item(),CAB=item(),ARM=item();into(draw);
// The hood: louvres on its lid, the exhaust stack.
const hoodBox=obox(HOOD.g,'paint'),louvre=el('g',{},HOOD.g);for(let k=0;k<5;k++)line(louvre,3+k*2.6,3,3+k*2.6,13);const stack=vt(HOOD.g,'cw'),toolBox=obox(TOOL.g,'paint');
// The cab: a frame with glass on four sides, its roof, and the beacon on top (a control: H sounds the horn).
const cabCtl=button(CAB.g,{'aria-label':'Sound the horn (H)'});
const CF=[0,1,2,3,4].map(()=>({fr:el('path',{},cabCtl),gl:el('path',{class:'glass'},cabCtl),hi:el('path',{class:'gl'},cabCtl)}));
const roof=obox(cabCtl,'cab'),bcnBase=vt(cabCtl,'cw'),bcnLamp=el('circle',{r:1.7,class:'bl'},cabCtl),bcnHalo=el('circle',{r:9,class:'bh'},cabCtl),cabRing=el('ellipse',{rx:19,ry:22,class:'focus-ring'},cabCtl);
// The arm: swing bracket, boom cylinder, stick, bucket cylinder and links, boom (with its plate), stick cylinder, bucket.
const armG=ARM.g,bracket=obox(armG,'paint'),boomCyl=hyd(armG,2.5,1.25);
const STICK=[[-10,-1],[-7,-4.6],[8,-3.9],[36,-2.6],[37.6,0],[36,2.6],[6,4.4],[-8.5,3.6]];
const BOOM=[[-2,-4.6],[10,-1.6],[24,3.4],[32,3.4],[52,-3.6],[56,-1.6],[57.2,1.4],[54,4.3],[34,10],[24,10.6],[8,6.6],[-3,4.6],[-5.6,0]];
const BUCKET=[[18.6,-.3],[16.6,2.6],[13,6.6],[8,8.7],[3,7.7],[-1,4.7],[-2.5,1],[-1.6,-2.3],[1.5,-3.3],[15.2,-1.4]];
const HEAP=[[1.5,-3.3],[3.6,-6.2],[8,-7.4],[12.6,-5.6],[15.2,-1.4]];
const stickS=slab(armG,STICK,'paint'),bucketCyl=hyd(armG,2.1,1.1),links=[0,1].map(()=>[el('path',{class:'ho','stroke-width':2.6},armG),el('path',{class:'hk','stroke-width':1.8},armG)]);
const boomS=slab(armG,BOOM,'paint'),plate=el('g',{},armG);rect(plate,-8.4,-2.5,16.8,5,.7,'plate');text(plate,0,.3,'BRANTOK','brand center');text(plate,0,1.95,'E–35 · COMPACT','model center');
const stickCyl=hyd(armG,2.3,1.15);
const bucketCtl=button(el('g',{},armG),{'aria-label':'Curl or dump the bucket (C)'}),bucketS=slab(bucketCtl,BUCKET,'paint'),heapS=slab(bucketCtl,HEAP,'dirt'),teeth=[0,1,2,3].map(()=>el('path',{class:'face metal'},bucketCtl));
const bucketHit=el('circle',{r:11,class:'hit'},bucketCtl),bucketRing=el('circle',{r:12.5,class:'focus-ring'},bucketCtl);
const PINS=[3,2.6,2.2,1.5].map(r=>{const g=el('g',{},armG);circle(g,0,0,r,'pin');circle(g,0,0,r*.42,'pin2');return g;});
// Over everything: crumbs of soil (cut off where the ground hides them), exhaust puffs, the horn's rings.
const fxClip=el('clipPath',{id:'ground'},dfs),groundCut=el('path',{},fxClip);
const crumbsG=el('g',{'clip-path':'url(#ground)'}),CRUMBS=Array.from({length:30},(_,i)=>({n:el('rect',{width:i%3?1.3:1.8,height:i%3?1:1.4,rx:.35,class:'crumb',style:'display:none'},crumbsG),life:0,age:1}));
const PUFFS=Array.from({length:7},()=>({n:el('circle',{class:'puff',r:0,style:'display:none'}),life:0,age:1}));
const hornG=el('g',{}),HORN=[0,1,2].map(i=>el('path',{class:'horn',d:`M${f2(3+i*2.4)},${f2(-3-i*1.6)}A${f2(4+i*2.6)},${f2(4+i*2.6)} 0 0 1 ${f2(3+i*2.4)},${f2(3+i*1.6)}`},hornG));
const L=[...P(X0-400,Y1,0)],N=P(X1,Y1,0),M=P(X1,Y0-400,0);set(groundCut,'d',`M${f2(L[0])},${f2(L[1])}L${f2(N[0])},${f2(N[1])}L${f2(M[0])},${f2(M[1])}L${f2(M[0])},-2000L${f2(L[0])},-2000Z`);
frame([[-32,-22,0,72,44,13],[-16,-16,0,32,32,62],[44,-19,0,44,40,12],[-18,40,0,36,36,15]],6);
// Kinematics. Joint angles in degrees: swing y, boom b (its chord from horizontal), stick k (from the boom), bucket c
// (from the stick). In the arm's plane p runs out along the arm and q is height.
const A0=[25,27],L1=54,L2=36,LIM={y:[-150,120],b:[-25,62],k:[-160,-35],c:[-150,62]},J=['y','b','k','c'];
const SPD={y:86,b:50,k:70,c:175};
function fk(q){const y=q.y*RAD,c=cos(y),s=sin(y),Rr=[c,s,0],Ll=[-s,c,0],Z=[0,0,1],W=(u,v,w)=>[u*c-v*s,u*s+v*c,w],AP=(p,h)=>[p*c,p*s,h];
const b=q.b*RAD,sg=(q.b+q.k)*RAD,ph=(q.b+q.k+q.c)*RAD,tip=[A0[0]+L1*cos(b),A0[1]+L1*sin(b)],wr=[tip[0]+L2*cos(sg),tip[1]+L2*sin(sg)],ax=a=>[add(mul(Rr,cos(a)),Z,sin(a)),add(mul(Rr,-sin(a)),Z,cos(a))];
return{c,s,R:Rr,L:Ll,W,AP,b,sg,ph,tip,wr,ax};}
const loc=(a,o,x,y)=>add(add(o,a[0],x),a[1],y);
function bucketPts(k){const o=k.AP(k.wr[0],k.wr[1]),a=k.ax(k.ph);return BUCKET.map(([x,y])=>loc(a,o,x,y));}
function ik(p,h,phi){let dx=p-A0[0],dy=h-A0[1],d=hypot(dx,dy);const lo=abs(L1-L2)+1,hi=L1+L2-.5;if(d<lo||d>hi){const t=clamp(d,lo,hi)/(d||1);dx*=t;dy*=t;d=hypot(dx,dy);}
const b=atan2(dy,dx)+acos(clamp((L1*L1+d*d-L2*L2)/(2*L1*d),-1,1)),tip=[A0[0]+L1*cos(b),A0[1]+L1*sin(b)],sg=atan2(A0[1]+dy-tip[1],A0[0]+dx-tip[0]);
return{b:b/RAD,k:(sg-b)/RAD,c:phi-sg/RAD};}
// The scene's state: what the pit has given up, what the pile holds, the load in the bucket (one load is 1/12 of the job).
const UNIT=1/12,M3=.08;let dug=0,piled=0,load=0,cycles=0;
const depth=()=>7+13*clamp(dug),inPit=(x,y)=>x>X0&&x<X1&&y>Y0&&y<Y1,onPile=(x,y)=>hypot(x-PX,y-PY)<pileR(piled)+12;
function floorAt(x,y){if(inPit(x,y)){const d=depth(),s=pitInset(d),e=min(x-X0,X1-x,y-Y0,Y1-y);return e>=s?-d:-d*e/s;}const r=hypot(x-PX,y-PY),pr=pileR(piled);return r<pr?pileH(piled)*(1-(r/pr)**1.9)**.62:0;}
let q={y:0,b:0,k:0,c:0},v={y:0,b:0,k:0,c:0},tg={y:0,b:0,k:0,c:0},vmax={...SPD};
function aim(t,spd=1,sync=true){const d=J.map(j=>abs(t[j]-q[j])),T=sync?max(...J.map((j,i)=>d[i]/SPD[j])):0;for(const[i,j]of J.entries()){tg[j]=clamp(t[j],...LIM[j]);vmax[j]=(sync&&T>0?max(4,d[i]/T):SPD[j])*spd;}}
function drive(dt,red){let moving=false;for(const j of J){const e=tg[j]-q[j];if(red){q[j]=tg[j];v[j]=0;continue;}const a=vmax[j]/.26,vd=Math.sign(e)*min(vmax[j],sqrt(2*a*abs(e)));v[j]+=clamp(vd-v[j],-a*dt,a*dt);
const nq=q[j]+v[j]*dt;if((tg[j]-nq)*e<=0||abs(e)<.02){q[j]=tg[j];v[j]=0;}else{q[j]=nq;moving=true;}}return moving;}
const home=()=>({y:0,...ik(66,26,-95)});q={...home()};aim(q,1,false);
// Drawing the upper structure and the arm from the joints.
let nod=0,nodV=0,orderKey='',clipped=null;
function render(){const k=fk(q),{W,AP,R:Rr,L:Ll}=k,Z=[0,0,1];
// Counterweight round the rear of the drum: what of it faces us.
const a0=q.y+118,pts=[];for(let i=0;i<=40;i++){const a=a0+i*3.1,w=((a%360)+360)%360;if(cos(w*RAD)+sin(w*RAD)>-.02)pts.push(a);}
if(pts.length>1){const lo=pts.map(a=>P(23*cos(a*RAD),23*sin(a*RAD),16)),hi=pts.map(a=>P(23.2*cos(a*RAD),23.2*sin(a*RAD),27));set(cwBand,'d',pd([...lo,...hi.reverse()]));}else set(cwBand,'d','');
// Hood and stack.
const hc=W(-6,-10,35.5),tc=W(9.5,-11.5,32.75);obx(hoodBox,hc,mul(Rr,10),mul(Ll,8),[0,0,5.5]);set(louvre,'transform',plane(W(-15,-17,41.02),Rr,Ll));vtb(stack,W(-11.5,-13,41),7,1.3);HOOD.d=dot(hc,VW);obx(toolBox,tc,mul(Rr,5.5),mul(Ll,5.5),[0,0,2.75]);TOOL.d=dot(tc,VW);
// Cab: each face we see, its frame and the glass in it.
const cu=[-12,9],cv=[1,19],cw=[30,57],C3=(i,j,l)=>W(cu[i],cv[j],cw[l]);
const faces=[[Rr,[C3(1,0,1),C3(1,1,1),C3(1,1,0),C3(1,0,0)]],[mul(Rr,-1),[C3(0,1,1),C3(0,0,1),C3(0,0,0),C3(0,1,0)]],[Ll,[C3(1,1,1),C3(0,1,1),C3(0,1,0),C3(1,1,0)]],[mul(Ll,-1),[C3(0,0,1),C3(1,0,1),C3(1,0,0),C3(0,0,0)]],[Z,[C3(0,0,1),C3(1,0,1),C3(1,1,1),C3(0,1,1)]]];
faces.forEach(([n,c],i)=>{const F=CF[i];if(dot(n,VW)<=0){set(F.fr,'d','');set(F.gl,'d','');set(F.hi,'d','');return;}set(F.fr,'d',poly(c,true));set(F.fr,'class','face '+shade(n)+'cab');
if(i===4){set(F.gl,'d','');set(F.hi,'d','');return;}const top=i===0?1.6:1.8,bot=i===0?4:7.5,u=unit(sub(c[1],c[0])),wd=hypot(...sub(c[1],c[0])),m=1.7,g=[add(add(c[0],u,m),Z,-top),add(add(c[0],u,wd-m),Z,-top),add(add(c[3],u,wd-m),Z,bot),add(add(c[3],u,m),Z,bot)];
set(F.gl,'d',poly(g,true));set(F.gl,'class','glass'+(shade(n)==='side '?' side':''));set(F.hi,'d',poly([lerp(g[0],g[3],.25),lerp(g[0],g[1],.45)])+poly([lerp(g[0],g[3],.55),lerp(g[0],g[1],.8)]));});
obx(roof,W(-1.5,10,58.3),mul(Rr,11.6),mul(Ll,10),[0,0,1.3]);vtb(bcnBase,W(-7,14,59.6),1,1.5);const bp=P(...W(-7,14,61.6));put(bcnLamp,'cx',f2(bp[0]));put(bcnLamp,'cy',f2(bp[1]));put(bcnHalo,'cx',f2(bp[0]));put(bcnHalo,'cy',f2(bp[1]));
const cc=P(...W(-1.5,10,44));put(cabRing,'cx',f2(cc[0]));put(cabRing,'cy',f2(cc[1]));CAB.d=dot(W(-1.5,10,44),VW);
// Arm.
const foot=AP(A0[0],A0[1]),tipW=AP(k.tip[0],k.tip[1]),wrW=AP(k.wr[0],k.wr[1]),bA=k.ax(k.b),sA=k.ax(k.sg),cA=k.ax(k.ph),bl=(x,y)=>loc(bA,foot,x,y),sl=(x,y)=>loc(sA,tipW,x,y),cl=(x,y)=>loc(cA,wrW,x,y);
obx(bracket,AP(25,23),mul(Rr,4.5),mul(Ll,5.5),[0,0,8]);
hy(boomCyl,AP(31,17.5),bl(22,2.6),21);
slb(stickS,tipW,sA[0],sA[1],Ll,2.5);
const E=cl(-2.4,3.4),S2=sl(31,3.4),dd=hypot(...sub(E,S2)),l1=6,l2=5.4;let K;{const ex=unit(sub(E,S2)),aa=(l1*l1-l2*l2+dd*dd)/(2*dd),hh=sqrt(max(0,l1*l1-aa*aa)),side=sA[1];K=add(add(S2,ex,min(aa,dd)),unit(sub(side,mul(ex,dot(side,ex)))),hh);}
hy(bucketCyl,sl(1,5.2),K,19);for(const[i,[a,b]]of[[S2,K],[K,E]].entries()){set(links[i][0],'d',`M${Q(a)}L${Q(b)}`);set(links[i][1],'d',`M${Q(a)}L${Q(b)}`);}
const sg=slb(boomS,foot,bA[0],bA[1],Ll,3.5),pu=bA[0],pv=mul(bA[1],-1),pp=P(...pu),pq=P(...pv),flip=pp[0]*pq[1]-pp[1]*pq[0]<0;set(plate,'transform',plane(add(bl(17,3.6),Ll,sg*3.55),flip?mul(pu,-1):pu,pv));
hy(stickCyl,bl(29,10.4),sl(-8.6,0),21);
const bs=slb(bucketS,wrW,cA[0],cA[1],Ll,6.5),hl=clamp(load/UNIT,0,1.4),yc=x=>-3.3+(x-1.5)/13.7*1.9;heapS.pts=HEAP.map(([x,y])=>[x,yc(x)+(y-yc(x))*min(1,hl)]);vis(heapS.f,hl>.02);heapS.e.forEach(e=>vis(e,hl>.02));if(hl>.02)slb(heapS,wrW,cA[0],cA[1],Ll,5.6);
[-4.6,-1.55,1.55,4.6].forEach((o,i)=>{const b0=add(cl(15.6,-1.2),Ll,o-.9),b1=add(cl(15.6,-1.2),Ll,o+.9),t=add(cl(19.8,.2),Ll,o);set(teeth[i],'d',poly([b0,t,b1],true));});
const bc=P(...cl(8,2.5));for(const n of[bucketHit,bucketRing]){put(n,'cx',f2(bc[0]));put(n,'cy',f2(bc[1]));}
{const c=cl(8,2.5),g=floorAt(c[0],c[1]),s=P(c[0],c[1],g),h=min(...bucketPts(k).map(p=>p[2]))-g;put(bucketShadow,'cx',f2(s[0]));put(bucketShadow,'cy',f2(s[1]));op(bucketShadow,f2(clamp(1-h/34)*(g<0?.55:1)));}
// Pins on the near faces: boom foot, boom tip, bucket pin, the link pin.
const pinAt=(g,p,off)=>set(g,'transform',plane(add(p,Ll,off),Rr,[0,0,-1]));pinAt(PINS[0],foot,sg*3.6);pinAt(PINS[1],tipW,sg*3.6);pinAt(PINS[2],wrW,bs*6.6);pinAt(PINS[3],K,sg*1.4);
ARM.d=dot(AP(42,30),VW)+(dot(Rr,VW)>0?20:-20);
// Below ground the bucket shows only through the pit's mouth.
const low=min(...bucketPts(k).map(p=>p[2]))<-.2;if(low!==clipped){clipped=low;if(low)set(armG,'clip-path','url(#ground)');else armG.removeAttribute('clip-path');}
// Painter: sort the cab, hood and arm; reorder only when it changes (and keep focus where it was).
const order=items.slice().sort((a,b)=>a.d-b.d),key=order.map(o=>items.indexOf(o)).join();if(key!==orderKey){orderKey=key;const f=document.activeElement;for(const o of order)sorted.appendChild(o.g);if(f?.matches?.('.control'))f.focus({preventScroll:true});}
return k;}
// State: one cycle at a time (scoop, swing, dump, swing back), hand control, progress; crumbs, puffs, sound.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),say=m=>{announcement.textContent=m;};
let mode='own',goal=1,target=0,fin=0,seq=null,manualT=-1e9,idleT=0,note='',noteT=0,hornT=-1e9,lastUI=-1,lt=0,now=0,drawn='',puffT=0,ac=null,nb=null,wasRed=null,lastJ='b';
const pc=v=>Math.round(clamp(v)*100),deg=v=>`${Math.round(v)<0?'−':''}${abs(Math.round(v))}°`;
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac)ac=new A();if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,v,d,w=0,type='sine',f1=0){if(!ac)return;try{const t=ac.currentTime+w,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.05);}catch(_){}}
function hiss(d,v,f,qf=1,w=0){if(!ac)return;try{if(!nb){nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}const t=ac.currentTime+w,s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;b.Q.value=qf;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(ac.destination);s.start(t,0,d+.05);}catch(_){}}
const whine=()=>tone(150,.012,.5,0,'triangle',190),thunk=()=>{tone(70,.05,.25,0,'sine',45);hiss(.18,.025,500,.8);},pour=()=>{for(let i=0;i<4;i++)hiss(.22,.02,900+i*260,1.4,i*.09);};
// Crumbs: clods in world space that fall and come to rest on the ground, the pit floor or the pile.
function crumb(p,vel,life=1.6){const c=CRUMBS.find(c=>c.age>=c.life);if(!c||reduced.matches)return;Object.assign(c,{p:p.slice(),u:vel.slice(),age:0,life,rest:0});vis(c.n,1);}
function spray(p,n,up,spread){for(let i=0;i<n;i++)crumb(add(p,[(R()-.5)*spread,(R()-.5)*spread,0]),[(R()-.5)*14,(R()-.5)*14,up*(.4+R()*.8)]);}
function stepCrumbs(dt){for(const c of CRUMBS){if(c.age>=c.life)continue;c.age+=dt;if(c.age>=c.life){vis(c.n,0);continue;}if(!c.rest){c.u[2]-=120*dt;const n=add(c.p,c.u,dt),fl=floorAt(n[0],n[1]);if(n[2]<=fl){n[2]=fl;c.rest=1;c.life=min(c.life,c.age+.5);}c.p=n;}
const s=P(...c.p);put(c.n,'x',f2(s[0]-.6));put(c.n,'y',f2(s[1]-.5));op(c.n,f2(clamp((c.life-c.age)/.35)));}}
function stepPuffs(dt,work){const st=fk(q).W(-11.5,-13,48.5);if(work>0&&!reduced.matches&&now>puffT){puffT=now+(work>1?160:420);const p=PUFFS.find(p=>p.age>=p.life);if(p){Object.assign(p,{p:st,age:0,life:1.4+R()*.5,r0:1.2+R()*.4});vis(p.n,1);}}
for(const p of PUFFS){if(p.age>=p.life)continue;p.age+=dt;if(p.age>=p.life){vis(p.n,0);continue;}const t=p.age,s=P(p.p[0]-t*4,p.p[1]-t*3,p.p[2]+t*9);put(p.n,'cx',f2(s[0]));put(p.n,'cy',f2(s[1]));put(p.n,'r',f2(p.r0+t*3.2));op(p.n,f2(.75*(1-t/p.life)));}}
const clearFx=()=>{for(const c of[...CRUMBS,...PUFFS]){c.age=c.life=1;vis(c.n,0);}};
// A cycle: from the site it digs at (the pit, or the pile when it backfills) to the one it dumps on.
const SITES={pit:{y:0,name:'THE TRENCH'},pile:{y:90,name:'THE PILE'}};
function cycle(back,amount){const from=back?'pile':'pit',to=back?'pit':'pile',S=SITES[from],D=SITES[to],surf=()=>back?pileH(piled):-depth();
const over=()=>back?ik(62,surf()+24,-80):ik(76,22,-78),bite=()=>back?ik(64,surf()+12,-112):ik(76,surf()+15.5,-112),drag=()=>back?ik(60,surf()+11,-140):ik(72,surf()+12,-140);
const lift=()=>ik(back?58:60,max(32,back?pileH(piled)+22:32),-205),dropAt=()=>back?ik(66,24,-205):ik(58,max(24,pileH(piled)+13),-205),dump=()=>{const t=dropAt();return{...t,c:t.c+163};};
const verb=back?'BACKFILLING':'DIGGING';
return[{label:`${verb} · REACHING OVER ${S.name}`,to:()=>({y:S.y,...over()})},
{label:`${verb} · BUCKET BITING`,to:()=>({y:S.y,...bite()}),hold:110,done:k=>{nod=.9;if(!reduced.matches)nodV=-14;const t=cl(k,19,0);spray(t,6,26,4);thunk();}},
{label:`${verb} · SCOOPING`,to:()=>({y:S.y,...drag()}),spd:.7,each:u=>{const was=load;load=amount*u;const d=load-was;if(back)piled=max(0,piled-d);else dug+=d;},done:k=>spray(cl(k,16,-2),3,10,3)},
{label:'LIFTING · BUCKET FULL',to:()=>({y:S.y,...lift()}),spd:.85},
{label:`SWINGING TO ${D.name}`,to:()=>({...q,y:D.y}),spd:.9},
{label:`SWINGING TO ${D.name}`,to:()=>({y:D.y,...dropAt()})},
{label:back?'BACKFILLING · DUMPING INTO THE PIT':'DUMPING ON THE PILE',to:()=>({y:D.y,...dump()}),spd:.75,hold:260,start:pour,each:(u,k)=>{const was=load;load=amount*(1-u);const d=was-load;if(back)dug=max(0,dug-d);else piled+=d;if(d>0&&R()<.9){const p=cl(k,9,-5);crumb(add(p,[(R()-.5)*7,(R()-.5)*7,0]),[(R()-.5)*8,(R()-.5)*8,-6]);}},done:()=>{load=0;cycles++;}},
{label:'SWINGING BACK',to:()=>({y:S.y,...over()}),spd:.95}];}
// The cycle's own geometry needs the bucket's points in the world.
function cl(k,x,y){const a=k.ax(k.ph);return loc(a,k.AP(k.wr[0],k.wr[1]),x,y);}
function start(steps,kind){seq={steps,i:-1,kind,t0:now,u0:0};next();}
function next(){seq.i++;const s=seq.steps[seq.i];if(!s){const kind=seq.kind;seq=null;idleT=now;if(kind==='park'){fin=2;honk(true);say('Complete. The pile is done and the excavator is parked.');}lastUI=-1;return;}
const t=s.to();s.from={...q};aim(t,(s.spd||1)*speed(),true);s.d0=max(...J.map(j=>abs(tg[j]-q[j])/SPD[j]))||0;s.arr=0;s.start?.();if(s.d0>.5)whine();lastUI=-1;}
function speed(){if(fin===1)return 1.7;if(mode==='det')return 1+min(.8,max(0,goal-piled)*3);return 1;}
function amountFor(back){if(mode==='det'||fin)return clamp(back?piled-goal:goal-piled,0,.34);return back?min(piled,.34):min(UNIT,1-piled);}
function stepSeq(dt,red,k){const s=seq.steps[seq.i],rem=max(...J.map(j=>abs(tg[j]-q[j])/SPD[j])),u=s.d0>0?clamp(1-rem/s.d0):1;s.each?.(red&&!s.arr?1:u,k);
if(rem<1e-4&&!s.arr){s.arr=now;s.each?.(1,k);s.done?.(k);}if(s.arr&&now-s.arr>=(red?520:(s.hold||40)))next();}
// What it does next on its own: dig toward the goal, backfill when the job runs back, park when it's done.
function auto(red){if(seq||fin===2)return;if(now<manualT)return;if(mode==='own'){if(red||now-idleT<(cycles?0:1200))return;if(piled>=1-1e-6)goal=0;else if(piled<=1e-6&&goal===0)goal=1;}
if(mode==='det'&&red){piled=goal;dug=goal;load=0;if(fin===1&&piled>=1-1e-6){q={...park()};aim(q,1,false);fin=2;say('Complete. The pile is done and the excavator is parked.');}lastUI=-1;return;}
if(fin===1&&piled>=1-1e-4){start(parkSteps(),'park');return;}
const back=piled>goal+1e-4;if(abs(piled-goal)<=1e-4)return;if(load>0){start(cycle(back,load).slice(3),'cycle');return;}start(cycle(back,amountFor(back)),'cycle');}
// Parked in its travel pose, facing the finished trench: the boom up, the stick tucked in, the bucket curled clear of the ground.
const park=()=>({y:0,...ik(45,17,-222)});
const parkSteps=()=>[{label:'PARKING · SWINGING BACK',to:()=>({y:0,...ik(58,30,-205)})},{label:'PARKING · BUCKET DOWN',to:park,spd:.6,hold:200}];
// Keys and parts.
function dig(){audio();if(fin===2){setProgress(mode==='det'?target:null);return;}if(seq){say('Already digging.');return;}if(mode==='det'&&piled>=goal-1e-4){note=`HOLDING AT ${pc(goal)}% · ENGINE IDLING`;noteT=now+1600;say(`Holding at ${pc(goal)} percent.`);lastUI=-1;return;}
manualT=-1e9;noteT=0;const back=mode==='own'&&piled>=1-1e-6;if(back)goal=0;else if(mode==='own')goal=1;start(load>0?cycle(back,load).slice(3):cycle(back,amountFor(back)),'cycle');say(back?'Backfilling: a scoop from the pile goes back into the trench.':'Dig cycle: the bucket scoops, the cab swings and the load goes on the pile.');}
const clear=t=>min(...bucketPts(fk(t)).map(p=>p[2]-floorAt(p[0],p[1])))>=-1;
function jog(j,dir){audio();if(fin===2)return;const step={y:9,b:5,k:7}[j],from=!seq&&now<manualT?tg[j]:q[j];seq=null;manualT=now+4200;lastJ=j;lastUI=-1;noteT=0;
let t={...q,[j]:clamp(from+dir*step,...LIM[j])};if(!clear(t)){let lo=0,hi=1;const base={...q,[j]:from};for(let i=0;i<7;i++){const m=(lo+hi)/2;if(clear({...q,[j]:from+(t[j]-from)*m}))lo=m;else hi=m;}t={...q,[j]:from+(t[j]-from)*lo};if(lo<.05||!clear(base)){note='HAND CONTROL · BUCKET AT THE GROUND';noteT=now+1200;}}
aim(t,1,false);}
function curl(){audio();if(fin===2)return;seq=null;manualT=now+4200;aim(q,1,false);const k=fk(q),open=q.c>-80,t0=bucketPts(k)[0],deep=min(...bucketPts(k).map(p=>p[2]-floorAt(p[0],p[1])))<3;
if(open){if(load<=0&&deep&&inPit(t0[0],t0[1])){const a=min(UNIT,max(0,1-dug));load=a;dug+=a;note='HAND CONTROL · SCOOPED FROM THE TRENCH';}else if(load<=0&&deep&&onPile(t0[0],t0[1])&&piled>0){const a=min(UNIT,piled);load=a;piled-=a;note='HAND CONTROL · SCOOPED FROM THE PILE';}else note='HAND CONTROL · BUCKET CURLED';tg.c=clamp(q.c-95,...LIM.c);vmax.c=SPD.c;}
else{tg.c=clamp(q.c+130,...LIM.c);vmax.c=SPD.c;if(load>0){const p=cl(k,9,-5);if(onPile(p[0],p[1])){piled+=load;cycles++;note='HAND CONTROL · DUMPED ON THE PILE';}else{dug=max(0,dug-load);note=inPit(p[0],p[1])?'HAND CONTROL · DUMPED INTO THE TRENCH':'HAND CONTROL · SPILLED, RAKED BACK';}if(!reduced.matches)for(let i=0;i<10;i++)crumb(add(p,[(R()-.5)*8,(R()-.5)*8,(R()-.5)*3]),[(R()-.5)*10,(R()-.5)*10,-4-R()*6]);load=0;pour();}else note='HAND CONTROL · BUCKET OPEN';}
noteT=now+1500;lastUI=-1;}
function honk(soft){if(!soft)audio();hornT=now;note=fin===2?'COMPLETE · PARKED':'HORN · STAND CLEAR';noteT=now+1100;tone(392,.03,.22,0,'square');tone(494,.025,.22,0,'square');tone(392,.03,.3,.28,'square');tone(494,.025,.3,.28,'square');if(!soft)say('Horn.');lastUI=-1;}
function setProgress(p){fin=0;if(p==null||!isFinite(p)){mode='own';goal=piled>=1-1e-6?0:1;}else{mode='det';target=goal=clamp(+p);}idleT=now;manualT=-1e9;lastUI=-1;}
function finish(){audio();if(fin)return;fin=1;goal=1;if(mode==='own')mode='det';target=1;manualT=-1e9;say('Finishing: the last loads go on the pile, then it parks.');lastUI=-1;}
function stepKey(){audio();setProgress(mode==='det'&&!fin?(target>=1?0:min(1,Math.floor(target*4+1e-6)/4+.25)):.25);say(`Progress ${pc(target)} percent.`);}
window.figure={setProgress,done:finish};
bind(baseCtl,dig);bind(cabCtl,()=>honk(false));bind(bucketCtl,curl);
const act={' ':dig,arrowup:()=>jog('b',1),arrowdown:()=>jog('b',-1),arrowleft:()=>jog('y',1),arrowright:()=>jog('y',-1),w:()=>jog('k',1),s:()=>jog('k',-1),c:curl,h:()=>honk(false),p:stepKey,enter:finish};
const repeats={arrowup:1,arrowdown:1,arrowleft:1,arrowright:1,w:1,s:1};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.toLowerCase();if(e.repeat&&!repeats[k])return;if((k==='enter'||k===' ')&&e.target.closest&&e.target.closest('button,[role=button]'))return;if(act[k]){e.preventDefault();act[k]();}});
// The readout: the cycle count and the load in the bucket; the job's progress when a page drives it.
function ui(){const m=v=>(v/UNIT*M3).toFixed(2);readout.textContent=fin===2?'PROGRESS 100% · COMPLETE':mode==='det'?`PROGRESS ${pc(target)}% · CYCLE ${String(cycles).padStart(2,'0')}`:`CYCLE ${String(cycles).padStart(2,'0')} · LOAD ${m(load)} M³`;
const s=seq?.steps[seq.i];stateLabel.textContent=now<noteT?note:fin===2?'COMPLETE · PARKED':s?s.label:now<manualT?`HAND CONTROL · ${{y:'SWING',b:'BOOM',k:'STICK',c:'BUCKET'}[lastJ]} ${deg(tg[lastJ])}`:fin===1?'FINISHING · LAST LOADS':mode==='det'?(piled>=goal-1e-4?`HOLDING AT ${pc(goal)}% · ENGINE IDLING`:`DIGGING TO ${pc(goal)}%`):'READY · SPACE TO DIG';lastUI=now;}
function tick(t){const dt=Math.min(.05,Math.max(0,(t-(lt||t))/1000)),red=reduced.matches;if(!lt)idleT=t;lt=now=t;if(red&&wasRed===false)clearFx();wasRed=red;
auto(red);const moving=drive(dt,red),k=fk(q);if(seq)stepSeq(dt,red,k);
// The nod: the house dips on the bite and settles, a little stiff.
if(red){nod=0;nodV=0;}else{nodV+=(-90*nod-11*nodV)*dt;nod+=nodV*dt;if(abs(nod)<.005&&abs(nodV)<.01){nod=0;nodV=0;}}
const key=J.map(j=>q[j].toFixed(2)).join()+`|${dug.toFixed(4)}|${piled.toFixed(4)}|${load.toFixed(4)}`;if(key!==drawn){drawn=key;drawPit(depth());drawPile(piled);render();}
put(upper,'transform',nod?`translate(0 ${f2(nod)})`:'');
// The beacon turns while it works; steady under reduced motion; dark when it's idle or parked.
const work=seq||moving?1:0,bk=work?(red?1:clamp(cos(t/150)**6*1.1)):0;put(bcnLamp,'class',bk>.35?'bl on':'bl');op(bcnHalo,f2(bk*.55));
stepCrumbs(dt);stepPuffs(dt,work?(seq&&seq.steps[seq.i]?.label.includes('LIFT')?2:1):0);
// The horn's rings, out from the cab's front for a moment.
const hk=(now-hornT)/700;if(hk<1){const W2=fk(q).W(9.5,10,47),p=P(...W2),a=atan2(P(...fk(q).R)[1],P(...fk(q).R)[0])/RAD;put(hornG,'transform',`translate(${f2(p[0])} ${f2(p[1])}) rotate(${f2(a)})`);HORN.forEach((h,i)=>op(h,f2(red?.8:clamp(1-abs(hk*3-i*.7-.5)*1.4)*.8)));}else HORN.forEach(h=>op(h,'0'));
if(lastUI<0||t-lastUI>120)ui();requestAnimationFrame(tick);}
drawPit(depth());drawPile(piled);render();ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [' ', 'c', 'h', 'p', 'enter'], draw }
