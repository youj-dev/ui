// @ts-nocheck
/* SOLRAN PX–6 · Mars rover. Drawn for this package in the lab figures' form: its stylesheet, defs and script, on the
 * engine's kit. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--base-top:#cbcbc7;--base-side:#a4a4a1;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--wheel:#d3d3cf;--wheel-top:#ebebe8;--wheel-side:#b0b0ad;--tread:#a3a39f;--hubdk:#55554f;--cell:#2c3548;--cell-line:#4b5976;--foil:#d6ae62;--foil-top:#ebcd8c;--foil-side:#b48c45;--soil:#dcc8b6;--soil-in:#d3baa4;--track:#c3a48c;--rock:#c7a68f;--rock-top:#dcc2ad;--rock-side:#a9876f;--dust:#f3e9de;--lens:#14171b;--lens-in:#22303a;--lens-rim:#30363d;--coat:#4f9fc4;--flash:#fffdf2}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--base-top:#bebeba;--base-side:#737372;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--wheel:#b2b2af;--wheel-top:#dcdcd9;--wheel-side:#7b7b7a;--tread:#898986;--hubdk:#464642;--cell:#232b3b;--cell-line:#3d4862;--foil:#b49251;--foil-top:#dcc083;--foil-side:#7e612e;--soil:#463d37;--soil-in:#51463e;--track:#332c27;--rock:#a78b78;--rock-top:#ceb5a2;--rock-side:#765e4c;--dust:#d9c8b8;--lens:#101215;--lens-in:#1d2830;--lens-rim:#2a2f35;--coat:#5fb0d4;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.top.base{fill:var(--base-top)}.side.base{fill:var(--base-side)}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.brand.tiny{font-size:3px;letter-spacing:.9px}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.wheel{fill:var(--wheel)}.top.wheel{fill:var(--wheel-top)}.side.wheel{fill:var(--wheel-side)}.tread{fill:var(--tread)}.hubdk{fill:var(--hubdk)}.foil{fill:var(--foil)}.top.foil{fill:var(--foil-top)}.side.foil{fill:var(--foil-side)}.rock{fill:var(--rock)}.top.rock{fill:var(--rock-top)}.side.rock{fill:var(--rock-side)}.drill{fill:var(--hubdk)}
.soil{fill:url(#soilG);stroke:none}.trk{fill:none;stroke:var(--track);stroke-width:6.2;stroke-linecap:round;stroke-linejoin:round;opacity:.42}.grouse{fill:none;stroke:var(--track);stroke-width:.9;stroke-linecap:round;opacity:.9}.pebble{fill:var(--track);stroke:none;opacity:.75}
.cells{fill:url(#cells);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.spine{fill:none;stroke:var(--metal);stroke-width:.9}.spoke{fill:none;stroke:var(--wheel);stroke-width:1;stroke-linecap:round}.grouser{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.55}.grouser.band{opacity:.5;stroke-width:.6}
.lensg{fill:url(#lensG);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.coat{fill:none;stroke:var(--coat);stroke-width:.6;stroke-linecap:round;opacity:.8}.spec{fill:#fff;opacity:.75;stroke:none}.crinkle{fill:none;stroke:var(--foil-side);stroke-width:.4;opacity:.8}.hole{fill:var(--lens);stroke:none;opacity:0}.hole.on{opacity:.85}
.lamp{fill:var(--off);stroke:none}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.b{filter:url(#glow)}
.puff{fill:var(--dust);stroke:var(--track);stroke-width:.4;vector-effect:non-scaling-stroke;opacity:0}.flash{fill:var(--flash);opacity:0;filter:url(#bloom);pointer-events:none}.flashcore{fill:#fff;opacity:0;pointer-events:none}.ray{fill:none;stroke:#fff;stroke-width:1.1;stroke-linecap:round;opacity:0;pointer-events:none}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="soilG"><stop offset="0" style="stop-color:var(--soil-in)"/><stop offset=".6" style="stop-color:var(--soil)"/><stop offset=".8" style="stop-color:var(--soil);stop-opacity:.78"/><stop offset=".93" style="stop-color:var(--soil);stop-opacity:.26"/><stop offset="1" style="stop-color:var(--soil);stop-opacity:0"/></radialGradient>
<radialGradient id="lensG" cx=".4" cy=".36" r=".72"><stop offset="0" style="stop-color:var(--lens-in)"/><stop offset=".7" style="stop-color:var(--lens)"/><stop offset="1" style="stop-color:var(--lens-rim)"/></radialGradient>
<pattern id="cells" width="5.4" height="5" patternUnits="userSpaceOnUse"><rect width="5.4" height="5" style="fill:var(--cell)"/><path d="M0,.2H5.4M.2,0V5" style="fill:none;stroke:var(--cell-line);stroke-width:.45"/></pattern>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* SOLRAN PX–6 on a patch of dusty ground. World: x lower-right (the rover's forward), y lower-left (its left flank faces
the viewer), z up. The rover stays at the origin and the ground moves under it: driving rolls the rocks, pebbles and
tracks past, a point turn swings them around it.
Part                          x      y      z      w      d      h
ground patch              r 55 around the origin, fading out; tracks, pebbles and rocks ride on it
body (warm box)             −24    −15     22     46     30     16   foil panel and brand plate on the flank, hazcams on the nose
deck                        −30    −21     38     54     42    2.5   solar array x −28…4, equipment bay in front
mast                     r 2.2 at 14 −12 from the deck to z 75; head 9 × 18 × 8 at z 79.5, pans and tilts
dish · whip                  12 11 on a post · −27 17 up to z 64
rocker (each side)       pivot 4 ±21 32 on the body; forward to the front wheel's steering actuator, back to the bogie pivot
bogie                    pivot −15 ±19 24; forward to the middle hub, back to the rear wheel's steering actuator
wheels                   r 8.5 × 7 at x −30 0 30, y ±28, hubs at z 8.5 plus the ground under them; corner wheels steer
arm                      shoulder 27 8 31 on the nose; links 22 + 20, a turret with a coring drill
The body hangs on the two rocker pivots: it rises by their mean and rolls by their difference, and a differential
pitches it by the mean of the rocker angles. Painter order: ground, then the rocks among the rover's parts by depth: far
wheels, far links, body (deck, mast, head), near links, near wheels, arm (its parts sorted as it moves). */
const svg=document.getElementById('machine'),draw0=document.getElementById('drawing');let root=draw0;
const{C,S,P,set,el,rect,circle,text,frame}=kit(()=>root);
const{cos,sin,PI,abs,hypot,atan2,min,max,sqrt}=Math,RAD=PI/180,VW=[1,1,1],f2=v=>(+v).toFixed(2);
const clamp=(v,a=0,b=1)=>max(a,min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,ease=t=>t*t*(3-2*t),sgn=v=>v<0?-1:1;
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(hypot(...a)||1));
const plane=(o,U,V)=>`matrix(${[...P(...U),...P(...V),...P(...o)].map(f2).join(' ')})`,shade=n=>n[2]>.6?'top':n[0]>n[1]?'side':'';
const q2=p=>P(...p).map(f2).join(','),pth=(pts,close)=>pts.map((p,i)=>(i?'L':'M')+q2(p)).join('')+(close?'Z':'');
function axes(n){n=unit(n);const U=unit(abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U);const a=P(...U),b=P(...V);if(a[0]*b[1]-a[1]*b[0]<0)V=mul(V,-1);return[U,V];}
/* A round part between two points: its outline on the drawing (the two ends' ellipses and the lines that touch both,
drawn straight on the page, so no end-on plane ever stretches its bounds) and the end that faces the viewer. */
function stadium(n,c0,c1,r){let A=sub(c1,c0);if(dot(A,VW)<0){[c0,c1]=[c1,c0];A=mul(A,-1);}const[U,V]=axes(A),p0=P(...c0),p1=P(...c1),d=[p1[0]-p0[0],p1[1]-p0[1]],pu=mul(P(...U),r),pv=mul(P(...V),r),cr=(a,b)=>a[0]*b[1]-a[1]*b[0];
const E=(t,k=0)=>[pu[0]*cos(t+k)+pv[0]*sin(t+k),pu[1]*cos(t+k)+pv[1]*sin(t+k)],t0=atan2(cr(d,pv),cr(d,pu)),m=E(t0,PI/2),s=m[0]*d[0]+m[1]*d[1]>0?1:-1,K=.5523,at=(c,t)=>{const q=E(t);return[c[0]+q[0],c[1]+q[1]];},pt=q=>`${f2(q[0])},${f2(q[1])}`;
const arc=(c,t)=>{let o='';for(let i=0;i<2;i++){const a=t+s*i*PI/2,b=a+s*PI/2,A0=at(c,a),B0=at(c,b),da=E(a,PI/2),db=E(b,PI/2);o+=`C${pt([A0[0]+s*K*da[0],A0[1]+s*K*da[1]])} ${pt([B0[0]-s*K*db[0],B0[1]-s*K*db[1]])} ${pt(B0)}`;}return o;};
set(n,'d',`M${pt(at(p0,t0))}L${pt(at(p1,t0))}${arc(p1,t0)}L${pt(at(p0,t0+s*PI))}${arc(p0,t0+s*PI)}Z`);return[c1,U,V,unit(A)];}
function tube(g,cls){const t={b:el('path',{class:'face '+cls},g),g:el('g',{},g),cls,sh:null};t.c=circle(t.g,0,0,1,'face '+cls);return t;}
function tb(t,c0,c1,r){const[e,U,V,n]=stadium(t.b,c0,c1,r);set(t.g,'transform',plane(e,U,V)+` scale(${f2(r)})`);const s=shade(n);if(s!==t.sh){t.sh=s;set(t.c,'class','face '+s+' '+t.cls);}}
/* A box on any three axes, its six faces made once: each frame shows the ones that face the viewer. */
function fbox(g,cls,L,r=1.2){const F=[];for(const[i,s]of[[0,1],[0,-1],[1,1],[1,-1],[2,1],[2,-1]]){const f=el('g',{},g);F.push({f,i,s,r:rect(f,0,0,L[(i+1)%3],L[(i+2)%3],r,'face '+cls),sh:null,vis:null});}return{F,cls,L};}
function obx(B,c,ax){for(const fc of B.F){const n=mul(ax[fc.i],fc.s),vis=dot(n,VW)>.01;if(vis!==fc.vis){fc.vis=vis;set(fc.f,'display',vis?'inline':'none');}if(!vis)continue;const b=ax[(fc.i+1)%3],e=ax[(fc.i+2)%3],o=add(add(add(c,mul(n,B.L[fc.i]/2)),mul(b,-B.L[(fc.i+1)%3]/2)),mul(e,-B.L[(fc.i+2)%3]/2));
set(fc.f,'transform',plane(o,b,e));const s=shade(n);if(s!==fc.sh){fc.sh=s;set(fc.r,'class','face '+s+' '+B.cls);}}}
function lamp(g,x,y,r=1){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
let seed=94;const rnd=()=>{seed=seed+0x6d2b79f5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};
// The body's pose: pitch (nose up), roll (near side up) and heave, about the middle of the rocker pivots. Everything on
// the body is drawn once in its rest place and posed by these.
const CB=[4,0,32];let RM=[[1,0,0],[0,1,0],[0,0,1]],HV=0;
const BV=v=>RM.map(r=>r[0]*v[0]+r[1]*v[1]+r[2]*v[2]),BP=p=>add(add(CB,BV(sub(p,CB))),[0,0,HV]),BI=p=>{const q=sub(p,[CB[0],CB[1],CB[2]+HV]);return add(CB,[0,1,2].map(i=>RM[0][i]*q[0]+RM[1][i]*q[1]+RM[2][i]*q[2]));};
function setPose(pi,ro,hv){const cp=cos(pi),sp=sin(pi),cr=cos(ro),sr=sin(ro);RM=[[cp,-sp*sr,-sp*cr],[0,cr,-sr],[sp,cp*sr,cp*cr]];HV=hv;}
const BF=[],BT=[],BW=[];
function bface(o,U,V,parent=root){const g=el('g',{},parent);BF.push({g,o,U,V});return g;}
function bbox(x,y,z,w,d,h,r,cls){const g=el('g',{});return{g,s:rect(bface([x+w,y+d,z+h],[0,-1,0],[0,0,-1],g),0,0,d,h,r,'face side '+cls).parentNode,f:rect(bface([x,y+d,z+h],[1,0,0],[0,0,-1],g),0,0,w,h,r,'face '+cls).parentNode,t:rect(bface([x,y,z+h],[1,0,0],[0,1,0],g),0,0,w,d,r,'face top '+cls).parentNode};}
function btube(a,b,r,cls){const t=tube(root,cls);BT.push({t,a,b,r});return t;}
function bwire(a,b,cls){const n=el('path',{class:cls});BW.push({n,a,b});return n;}
function poseBody(){for(const b of BF)set(b.g,'transform',plane(BP(b.o),BV(b.U),BV(b.V)));for(const b of BT)tb(b.t,BP(b.a),BP(b.b),b.r);for(const w of BW)set(w.n,'d',pth([BP(w.a),BP(w.b)]));}

// Ground: the patch of dusty soil (a projected outline, fading at its edge), the house shadow under the rover, the
// wheel tracks with their grouser marks, and pebbles. Rocks stand among the rover's parts in the scene below.
const RR=55;
{const pts=[...Array(40)].map((_,i)=>{const a=i/40*2*PI,k=1+.045*sin(3*a+.7)+.03*sin(7*a+2.1)+.018*sin(12*a+.4);return P(RR*k*cos(a),RR*k*sin(a),0);}),n=pts.length;let d=`M${f2(pts[0][0])},${f2(pts[0][1])}`;
for(let i=0;i<n;i++){const a=pts[(i-1+n)%n],b=pts[i],c=pts[(i+1)%n],e=pts[(i+2)%n];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}el('path',{d:d+'Z',class:'soil'});}
el('ellipse',{cx:0,cy:2,rx:48,ry:24,class:'shadow stage-floor'});el('ellipse',{cx:0,cy:2,rx:48,ry:24,class:'stage-contact'});
const trk=[el('path',{class:'trk'}),el('path',{class:'trk'})],marks=el('path',{class:'grouse'}),peb=el('path',{class:'pebble'});
// The scene: the rover's parts in a fixed order, the rocks slotted in among them by depth.
const scene=el('g',{}),FW=[0,1,2].map(()=>el('g',{},scene)),FL=el('g',{},scene),BODY=el('g',{},scene),NL=el('g',{},scene),NW=[0,1,2].map(()=>el('g',{},scene)),ARM=el('g',{},scene),fx=el('g',{});
const WX=[-30,0,30],WR=8.5,WW=7,TRACK=28;
// Wheels: a grousered tread, the rim, a dark well with six flexure spokes that turn as it rolls, and the hub.
function wheel(g){const w={band:el('path',{class:'face tread'},g),gr:el('path',{class:'grouser band'},g),cap:el('g',{},g),sh:null};w.rim=circle(w.cap,0,0,WR,'face wheel');circle(w.cap,0,0,WR-1.8,'face hubdk');w.spin=el('g',{},w.cap);
for(let k=0;k<6;k++){const a=k*60*RAD,b=a+34*RAD;el('path',{d:`M${f2(2*cos(a))},${f2(2*sin(a))}Q${f2(5.4*cos(a+.2))},${f2(5.4*sin(a+.2))} ${f2(6.7*cos(b))},${f2(6.7*sin(b))}`,class:'spoke'},w.spin);}
for(let k=0;k<12;k++){const a=k*30*RAD;el('path',{d:`M${f2(7.1*cos(a))},${f2(7.1*sin(a))}L${f2(8.5*cos(a))},${f2(8.5*sin(a))}`,class:'grouser'},w.spin);}circle(w.cap,0,0,2.3,'face metal');circle(w.cap,0,0,.8,'face recess');return w;}
const WH=[];for(const s of[-1,1])WX.forEach((x,i)=>WH.push({x,y:s*TRACK,s,i,w:wheel((s<0?FW:NW)[i]),z:WR,st:0,spin:0,key:''}));
// The suspension, each side: bogie arms and pin, rocker arms and cap, the corner wheels' steering brackets and
// actuators. The far side is drawn outside in, the near side inside out.
function suspension(g,s){const L={};const mk=(...k)=>k.forEach(n=>L[n]=tube(g,['pin','cap','fa','ra'].includes(n)?'base':'metal'));
if(s<0)mk('fa','ra','fb','rb','rr','rf','br','bf','pin');else mk('br','bf','pin','rr','rf','cap','fb','fa','rb','ra');return L;}
const SUS={'-1':suspension(FL,-1),'1':suspension(NL,1)};
// The body: the warm box, its flank (foil panel, brand plate) and nose (hazcams, status lamp), the arm's
// shoulder bracket, the near rocker's differential boss, then the deck: solar array, mast, head, dish and whip.
root=BODY;
const hull=bbox(-24,-15,22,46,30,16,2.4,'');BODY.appendChild(hull.g);let noseLamp=null;
{const f=hull.f;rect(f,31.4,5,12.8,9,1,'face foil');for(const[a,b,c,d]of[[34,5.8,36.2,13.2],[38.4,5.4,40.2,13.4],[42,6.2,43.2,10.4]])el('path',{d:`M${a},${b}L${c},${d}`,class:'crinkle'},f);
rect(f,2.4,6.6,16.6,4.6,1,'face metal');text(f,10.7,9.95,'SOLRAN','label brand tiny center');
const n=hull.s;rect(n,1.6,2.4,10.6,10.8,1.2,'face metal');for(const u of[13.4,20.6]){circle(n,u,4,2.1,'face recess');circle(n,u,4,1.4,'lensg');circle(n,u-.5,3.5,.4,'spec');}noseLamp=lamp(n,26.4,4,.9);}
const shoulder=bbox(22,3.4,25.6,3.2,9.6,8.6,1,'metal');BODY.appendChild(shoulder.g);
btube([4,15,32],[4,21.6,32],3.6,'base');
const deck=bbox(-30,-21,38,54,42,2.5,1.1,'metal');BODY.appendChild(deck.g);
{const t=deck.t;rect(t,2,1.8,32.4,38.4,.8,'cells');el('path',{d:'M2,21H34.4M18.2,1.8V40.2',class:'spine'},t);rect(t,36.6,2.6,15.2,36.8,1,'face top');circle(t,40.5,8,1,'face recess');}
btube([14,-12,40.5],[14,-12,43.4],3.6,'base');btube([14,-12,43.4],[14,-12,73.6],2.2,'metal');btube([14,-12,73.6],[14,-12,75.6],3.1,'base');
const HEAD=el('g',{}),headBox=fbox(HEAD,'',[9,16.6,8],1.4),headFront=headBox.F[0].f;
for(const u of[4.1,12.5]){circle(headFront,u,4.1,2.9,'face recess');circle(headFront,u,4.1,2.1,'lensg');el('path',{d:`M${f2(u-1.5)},${f2(4.7)}A1.6,1.6 0 0 0 ${f2(u-.2)},${f2(5.8)}`,class:'coat'},headFront);circle(headFront,u-.7,3.4,.45,'spec');}
circle(headFront,8.3,4.8,1.1,'lensg');const headLamp=lamp(headFront,8.3,1.9,.6);
btube([12,11,40.5],[12,11,45.6],1.1,'metal');
{const nd=unit([-.35,.45,.82]),[U,V]=axes(nd),dg=bface([12,11,47.4],U,V);circle(dg,0,0,6.2,'face top metal');circle(dg,0,0,4.2,'detail');circle(dg,0,0,1.3,'face base');el('path',{d:'M-5.9,0L0,0M5.9,0L0,0',class:'detail'},dg);}
bwire([-28.6,19.4,40.5],[-28.6,19.4,64],'detail');const whipTip=circle(BODY,0,0,.9,'face base');
// The arm: shoulder turret, pitch joint, upper arm, elbow, forearm, wrist and the turret with its coring drill.
root=ARM;
const AP={j0:tube(ARM,'base'),j1:tube(ARM,'base'),up:tube(ARM,''),j2:tube(ARM,'base'),fo:tube(ARM,''),j3:tube(ARM,'base'),tu:el('g',{},ARM),dr:tube(ARM,'drill')};
const turret=fbox(AP.tu,'metal',[5.6,5.6,5.6],1);
const S1=[27.2,8,31],L1=22,L2=20,L3=9.6;
// Effects (the drill's dust, the camera's flash) and the two parts that are buttons: the mast head and the arm.
root=draw0;
const puffs=[...Array(6)].map(()=>el('circle',{r:2,class:'puff'},fx)),flash=el('circle',{r:15,class:'flash'},fx),flashCore=el('circle',{r:3.2,class:'flashcore'},fx),rays=el('path',{d:'M-9,0H-4.5M4.5,0H9M0,-9V-4.5M0,4.5V9M-5,-5L-3,-3M5,5L3,3M5,-5L3,-3M-5,5L-3,3',class:'ray'},fx);
const hBtn=button(el('g',{}),{'aria-label':'Take a panorama (P)'}),hHit=el('circle',{r:13,class:'hit'},hBtn),hRing=el('circle',{r:14,class:'focus-ring'},hBtn);
const aq=P(28,0,24),aBtn=button(el('g',{}),{'aria-label':'Sample the nearest rock (Space)'});el('circle',{cx:f2(aq[0]),cy:f2(aq[1]),r:13,class:'hit'},aBtn);el('circle',{cx:f2(aq[0]),cy:f2(aq[1]),r:14,class:'focus-ring'},aBtn);
// Rocks: low faceted stones, made once around their own center and moved by translation; a cored one shows its hole.
const ROCKS=[[45,4,5.4,4.4],[44,27,4.2,3.4],[-31,28,5,4.4],[-44,-22,5,4],[6,46,4.6,3.4],[-30,40,3.8,2.8],[28,-40,5.4,4.2],[-12,-46,4.2,3.2]].map(([x,y,r,h])=>{
const g=el('g',{},scene),n=7,a0=rnd()*PI,base=[],tp=[];for(let i=0;i<n;i++){const a=a0+i/n*2*PI+(rnd()-.5)*.5,k=r*(.8+rnd()*.3);base.push([k*cos(a),k*sin(a)*.9,0]);const kt=k*(.38+rnd()*.26);tp.push([kt*cos(a)+r*.1,kt*sin(a)*.9-r*.08,h*(.8+rnd()*.32)]);}
const faces=[];for(let i=0;i<n;i++){const b0=base[i],b1=base[(i+1)%n],t1=tp[(i+1)%n],t0=tp[i],nn=unit(cross(sub(b1,b0),sub(t0,b0)));if(dot(nn,VW)>0)faces.push({d:pth([b0,b1,t1,t0],true),z:dot(add(b0,b1),VW),c:shade(nn)});}
faces.sort((p,q)=>p.z-q.z).forEach(f=>el('path',{d:f.d,class:'face rock '+f.c},g));el('path',{d:pth(tp,true),class:'face top rock'},g);el('path',{d:pth([tp[0],tp[3]]),class:'detail',opacity:.5},g);
const hc=tp.reduce((s,p)=>add(s,mul(p,1/n)),[0,0,0]),hq=P(...hc),hole=el('ellipse',{cx:f2(hq[0]),cy:f2(hq[1]),rx:1.15,ry:.66,class:'hole'},g);
return{g,gx:x,gy:y,r,h,lx:x,ly:y,hole,top:hc[2],o:-1,cored:false};});
const PEB=[...Array(16)].map(()=>{const a=rnd()*2*PI,d=10+rnd()*41;return{gx:d*cos(a),gy:d*sin(a),r:.55+rnd()*.7};});
frame([[-38.9,-38.9,0,77.8,77.8,0],[8,-18,0,12,12,90]],9);
// State. The rover in the ground's frame (X, Y, heading H); a queue of drives and point turns; the arm's moves; the
// mast's pan and tilt; the panorama; the autopilot that drives, samples and looks around when it is left alone.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const say=m=>{announcement.textContent=m;},U_M=20,SPD=22,ACC=40,TURN=42*RAD,STEER_T=.32,HOME=[36,-8];
let X=0,Y=0,H=0,odo=0,v=0,queue=[],pending=false,steer=0,lastDir=1,T=0,last=0,samples=0,frames=0,note='',noteT=-1,arm=null,pano=null,ptr=null,lostT=-1,userT=-9,autoI=0,autoWait=1.4,autoTry=0,scanI=0,scanT=0;
let hy=HOME[0],ht=HOME[1],vy=0,vt=0,q=[-90,0,-163,-90],drawn='',lastUI='',order='',trackG=[],lastFlash=-1,flashAt=[0,0];
const QS=[-90,0,-163,-90],QU=[-38,42,-92,-90];
for(let x=-74;x<=30;x+=2)trackG.push([[x,TRACK],[x,-TRACK]]);
// Sound: a motor whir while the wheels turn, a servo blip, the drill, the shutter; only after a gesture with sound on.
let ac=null,whir=null,nb=null;
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();const o=ac.createOscillator(),fl=ac.createBiquadFilter();o.type='sawtooth';o.frequency.value=58;fl.type='lowpass';fl.frequency.value=300;whir=ac.createGain();whir.gain.value=0;o.connect(fl);fl.connect(whir);whir.connect(ac.destination);o.start();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){}}
function tone(f,d=.07,vol=.012,w=0,type='sine'){if(!ac)return;try{const t=ac.currentTime+w,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
function hiss(d,vol,f,qq=1){if(!ac)return;try{if(!nb){nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}const t=ac.currentTime,s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;b.Q.value=qq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.02);g.gain.setValueAtTime(vol,t+d-.1);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(ac.destination);s.start(t,0,d+.05);}catch(_){}}
const plural=(n,w)=>`${n} ${w}${n===1?'':'S'}`,pad=n=>String(n).padStart(2,'0'),noteFor=(m,s=1.6)=>{note=m;noteT=T+s;};
// The ground's frame to the rover's; the height of the ground under a point (a cosine bump over each rock).
function local(o){const dx=o.gx-X,dy=o.gy-Y;o.lx=dx*cos(H)+dy*sin(H);o.ly=-dx*sin(H)+dy*cos(H);return o;}
function toGround(lx,ly){return[X+lx*cos(H)-ly*sin(H),Y+lx*sin(H)+ly*cos(H)];}
function lift(x,y){let z=0;for(const r of ROCKS){const w=r.r+4.6,d=hypot(x-r.lx,y-r.ly);if(d<w)z=max(z,r.h*.94*.5*(1+cos(PI*d/w)));}return z;}
// A rock or pebble that leaves the patch comes back at its far edge, ahead of the rover or behind it.
function respawn(o,dir,rock){for(let k=0;k<8;k++){const ly=rock&&rnd()<.3?(rnd()<.5?-1:1)*(TRACK+(rnd()-.5)*6):(rnd()*2-1)*(rock?54:58),lx=dir*sqrt(max(0,(RR-4)**2-ly*ly));[o.gx,o.gy]=toGround(lx,ly);local(o);if(!rock||ROCKS.every(r=>r===o||hypot(r.lx-o.lx,r.ly-o.ly)>r.r+o.r+9))break;}if(rock){o.cored=false;set(o.hole,'class','hole');}}
function moveGround(ds,dh){X+=ds*cos(H);Y+=ds*sin(H);H+=dh;odo+=abs(ds);if(ds)lastDir=sgn(ds);
for(const w of WH){const roll=[cos(w.st),sin(w.st),0],dp=[ds-dh*w.y,dh*w.x,0];w.spin+=dot(dp,roll)/WR;}
for(const r of ROCKS){local(r);if(hypot(r.lx,r.ly)>RR+1)respawn(r,lastDir,true);}for(const p of PEB){local(p);if(hypot(p.lx,p.ly)>RR-3)respawn(p,lastDir,false);}
if(ds){const n=toGround(30,TRACK),f=toGround(30,-TRACK),lst=trackG[trackG.length-1];if(!lst||hypot(n[0]-lst[0][0],n[1]-lst[0][1])>2){trackG.push([n,f]);if(trackG.length>90)trackG.shift();}}}
// Kinematics: hubs from the ground under each wheel, the bogie and rocker pivots as rigid links from their ends, the
// body from the two rocker pivots and the mean rocker angle.
const rig=(a,b,p)=>{const d=[b[0]-a[0],b[2]-a[2]],l=hypot(...d),u=[d[0]/l,d[1]/l],r=[p[0]-a[0],p[2]-a[2]];return[(r[0]*u[0]+r[1]*u[1])/l,r[0]*-u[1]+r[1]*u[0]];};
const place=(a,b,[t,h],y)=>{const d=[b[0]-a[0],b[2]-a[2]],l=hypot(...d),u=[d[0]/l,d[1]/l];return[a[0]+d[0]*t-u[1]*h,y,a[2]+d[1]*t+u[0]*h];};
const RIG_B=rig([-30,0,20.5],[0,0,8.5],[-15,0,24]),RIG_R=rig([-15,0,24],[30,0,20.5],[4,0,32]),ANG0=atan2(-3.5,45);
let LK={};
function kinematics(){for(const w of WH)w.z=WR+lift(w.x,w.y);const side={};
for(const s of[-1,1]){const z=i=>WH.find(w=>w.s===s&&w.i===i).z,Ar=[-30,s*19,z(0)+12],Am=[0,s*19,z(1)],Af=[30,s*21,z(2)+12],B=place(Ar,Am,RIG_B,s*19),R=place([B[0],0,B[2]],Af,RIG_R,s*21);side[s]={Ar,Am,Af,B,R,a:atan2(Af[2]-B[2],Af[0]-B[0])-ANG0,z0:z(0),z2:z(2)};}
const pi=(side[1].a+side[-1].a)/2,ro=atan2(side[1].R[2]-side[-1].R[2],42),hv=(side[1].R[2]+side[-1].R[2])/2-32;LK=side;return[pi,ro,hv];}
// The arm: forward kinematics in the body's frame, and the inverse for a wrist point (elbow up, turret straight down).
function fk(qq){const[a,b,g,t]=qq.map(x=>x*RAD),dir=[cos(a),sin(a),0],k=[-sin(a),cos(a),0],E=add(S1,add(mul(dir,L1*cos(b)),[0,0,L1*sin(b)])),W=add(E,add(mul(dir,L2*cos(b+g)),[0,0,L2*sin(b+g)])),Tt=add(mul(dir,cos(t)),[0,0,sin(t)]);return{E,W,T:Tt,k,dir};}
function ik(W){const d=sub(W,S1),r=hypot(d[0],d[1]),h=d[2],D=min(hypot(r,h),L1+L2-.6),c=clamp((D*D-L1*L1-L2*L2)/(2*L1*L2),-1,1),g=-Math.acos(c),b=atan2(h,r)-atan2(L2*sin(g),L1+L2*cos(g));return[atan2(d[1],d[0])/RAD,b/RAD,g/RAD,-90];}
/* The nearest rock the arm can core: ahead of the nose and within its reach; else a patch of soil in front. */
function target(){let best=null,bd=1e9;for(const r of ROCKS){if(r.cored||r.o<.6)continue;const p=BI([r.lx,r.ly,r.h*.9]),d=sub(p,S1),hd=hypot(d[0],d[1]),a=atan2(d[1],d[0])/RAD;if(hd<38&&hd>12&&abs(a)<75&&d[0]>4&&hd<bd){bd=hd;best={rock:r,p};}}return best||{rock:null,p:BI([48,6,0])};}
function sample(auto){if(auto!==true){audio();userT=T;}if(arm){noteFor('ARM BUSY · CORING');return;}if(queue.length||abs(v)>.01){pending=true;noteFor('SAMPLE NEXT · STOPPING FIRST',.9);return;}pending=false;const tg=target(),up=add(tg.p,[0,0,L3+7]),at=add(tg.p,[0,0,L3-1]),QR=ik(up),QC=ik(at);
const what=tg.rock?'ROCK':'SOIL';noteT=-1;arm={tg,what,i:0,t:0,from:q.slice(),steps:[[QU,.8,'ARM · UNSTOWING'],[QR,.75,'ARM · REACHING'],[QC,.5,'ARM · PLACING'],[QC,1.4,`DRILLING · ${what}`],[QR,.45,'ARM · LIFTING'],[QU,.75,'ARM · STOWING'],[QS,.75,'ARM · STOWING']]};
if(reduced.matches){q=QC.slice();arm.i=3;arm.t=0;arm.from=QC.slice();hiss(1,.02,950,2.5);}tone(330,.12,.008,0,'triangle');say(`The arm unfolds to the nearest ${tg.rock?'rock':'patch of soil'} and cores it.`);}
function cored(){samples++;if(arm.tg.rock){arm.tg.rock.cored=true;set(arm.tg.rock.hole,'class','hole on');}tone(880,.08,.01);tone(1320,.1,.01,.09);say(`Sample ${samples} cored and cached.`);}
function panorama(){audio();userT=T;if(pano)return;if(reduced.matches){frames++;pano={t:0,red:true};noteFor(`PANORAMA · FRAME ${pad(frames)}`,1.8);say(`Panorama taken, frame ${frames}.`);tone(2600,.02,.012,0,'square');return;}pano={t:0};noteT=-1;say('The mast sweeps for a panorama.');}
function drive(m){audio();userT=T;if(arm){noteFor('ARM OUT · DRIVE HELD');say('The arm is out. It stows before the rover drives.');return;}if(reduced.matches){jump(m*U_M,0);return;}noteT=-1;const lq=queue[queue.length-1];if(lq&&lq.k==='d'&&sgn(lq.v)===sgn(m))lq.v=clamp(lq.v+m*U_M,-80,80);else queue.push({k:'d',v:m*U_M});tone(180,.05,.006,0,'triangle');}
function turn(deg){audio();userT=T;if(arm){noteFor('ARM OUT · TURN HELD');say('The arm is out. It stows before the rover turns.');return;}if(reduced.matches){jump(0,deg*RAD);return;}noteT=-1;const lq=queue[queue.length-1];if(lq&&lq.k==='t'&&sgn(lq.v)===sgn(deg))lq.v=clamp(lq.v+deg*RAD,-PI,PI);else queue.push({k:'t',v:deg*RAD});tone(420,.08,.006,0,'triangle');}
/* Reduced motion: a drive or turn lands at once (the tracks filled in), with the wheels straight. */
function jump(ds,dh){const n=max(1,Math.ceil(abs(ds)/2));for(let i=0;i<n;i++)moveGround(ds/n,0);if(dh)moveGround(0,dh);steer=0;noteFor(ds?(ds>0?'DROVE · 1 M FORWARD':'DROVE · 1 M BACK'):dh>0?'TURNED · 15° LEFT':'TURNED · 15° RIGHT',1.2);say(ds?`Drove one meter ${ds>0?'forward':'back'}.`:`Turned fifteen degrees ${dh>0?'left':'right'} on the spot.`);}
// Pointer: the head turns to face the pointer on the drawing (the way it would look at it from its own height) and
// nods toward it; when the pointer leaves it looks a moment longer, then goes back.
function svgPoint(e){const m=svg.getScreenCTM?.();if(!m)return null;const det=m.a*m.d-m.b*m.c;if(!det)return null;const x=e.clientX-m.e,y=e.clientY-m.f;return[(m.d*x-m.c*y)/det,(-m.b*x+m.a*y)/det];}
function onPointer(e){const p=svgPoint(e);if(!p)return;const hc=P(...BP([14,-12,79.5])),dx=p[0]-hc[0],dy=p[1]-hc[1];if(hypot(dx,dy)<3)return;ptr=[clamp(atan2(dy/S-dx/C,dx/C+dy/S)/RAD,-170,170),clamp(-dy*.2-4,-30,22)];}
svg.addEventListener('pointermove',onPointer);svg.addEventListener('pointerdown',onPointer);svg.addEventListener('pointerleave',()=>{if(ptr){ptr=null;lostT=T+1.1;}});
bind(hBtn,panorama);bind(aBtn,sample);
const act={' ':sample,p:panorama,ArrowUp:()=>drive(1),ArrowDown:()=>drive(-1),ArrowLeft:()=>turn(15),ArrowRight:()=>turn(-15)};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(k===' '&&e.target.closest&&e.target.closest('button,[role=button]'))return;const fn=act[k];if(fn){e.preventDefault();if(!e.repeat||k.startsWith('Arrow'))fn();}});
// The autopilot: when nobody has touched it for a while, a short loop of drives, turns, a core and a panorama.
const AUTO=[['d',2],['w',.8],['s'],['w',1.2],['t',30],['d',1],['p'],['w',.6],['t',-30],['d',2],['w',1]];
function autopilot(dt){if(reduced.matches||T-userT<9||arm||pano||queue.length||abs(v)>.01)return;if((autoWait-=dt)>0)return;const[k,a]=AUTO[autoI];autoI=(autoI+1)%AUTO.length;autoWait=.5;
if(k==='w')autoWait=a;else if(k==='d')queue.push({k:'d',v:a*U_M});else if(k==='t')queue.push({k:'t',v:a*RAD});else if(k==='p')pano={t:0};else if(k==='s'){if(target().rock||autoTry>1){autoTry=0;sample(true);}else{autoTry++;autoI=(autoI+AUTO.length-1)%AUTO.length;queue.push({k:'d',v:U_M});}}}
// Drawing it: the wheels and links from the kinematics, the body from its pose, the head, the arm, rocks and tracks.
function drawWheels(){for(const w of WH){const key=[w.z,w.st,w.spin].map(f2).join();if(key===w.key)continue;w.key=key;const hub=[w.x,w.y,w.z],ax=[-sin(w.st),cos(w.st),0],[e,U,V,n]=stadium(w.w.band,sub(hub,mul(ax,WW/2)),add(hub,mul(ax,WW/2)),WR);
set(w.w.cap,'transform',plane(e,U,V));const s=shade(n);if(s!==w.w.sh){w.w.sh=s;set(w.w.rim,'class','face '+s+' wheel');}const sp=w.spin*(dot(cross(U,V),ax)>0?1:-1);set(w.w.spin,'transform',`rotate(${f2(sp/RAD)})`);
let gd='';for(let k=0;k<16;k++){const t=sp+k*PI/8,dv=add(mul(U,cos(t)),mul(V,sin(t)));if(dot(dv,VW)<.12)continue;const o=add(hub,mul(dv,WR));gd+=`M${q2(sub(o,mul(ax,WW/2)))}L${q2(add(o,mul(ax,WW/2)))}`;}set(w.w.gr,'d',gd);}}
function drawLinks(){for(const s of[-1,1]){const L=SUS[s],k=LK[s],R=BP([4,s*21,32]),Rb=[k.B[0],s*21,k.B[2]];tb(L.br,k.Ar,k.B,1.5);tb(L.bf,k.B,k.Am,1.5);tb(L.pin,[k.B[0],s*17.6,k.B[2]],[k.B[0],s*22.4,k.B[2]],2.2);tb(L.rr,R,Rb,1.8);tb(L.rf,R,k.Af,1.8);if(L.cap)tb(L.cap,R,add(R,[0,s*2.4,0]),2.5);
for(const[a,b,x,z]of[['fa','fb',30,k.z2],['ra','rb',-30,k.z0]]){tb(L[b],[x,s*(x>0?21:19),z+12],[x,s*TRACK,z+12],1.2);tb(L[a],[x,s*TRACK,z+9.2],[x,s*TRACK,z+15.4],2.6);}}}
function drawHead(){const a=hy*RAD,t=ht*RAD,f=BV([cos(a)*cos(t),sin(a)*cos(t),sin(t)]),s=BV([-sin(a),cos(a),0]),u=cross(f,s),c=BP([14,-12,79.5]);obx(headBox,c,[f,s,mul(u,-1)]);
const hc=P(...c);for(const n of[hHit,hRing]){set(n,'cx',f2(hc[0]));set(n,'cy',f2(hc[1]));}const fc=P(...add(c,mul(f,5.2)));for(const n of[flash,flashCore]){set(n,'cx',f2(fc[0]));set(n,'cy',f2(fc[1]));}flashAt=fc;lastFlash=-1;}
function drawArm(){const K=fk(q),E=BP(K.E),W=BP(K.W),Tt=BV(K.T),k=BV(K.k),s1=BP(S1),up=BV([0,0,1]),tc=add(W,mul(Tt,2.9));tb(AP.j0,add(s1,mul(up,-4.6)),add(s1,mul(up,1)),2.7);tb(AP.j1,add(s1,mul(k,-2.9)),add(s1,mul(k,2.9)),2.4);
tb(AP.up,s1,E,1.8);tb(AP.j2,add(E,mul(k,-2.5)),add(E,mul(k,2.5)),2.2);tb(AP.fo,E,W,1.6);tb(AP.j3,add(W,mul(k,-2.1)),add(W,mul(k,2.1)),1.9);obx(turret,tc,[Tt,k,cross(Tt,k)]);tb(AP.dr,add(W,mul(Tt,5.5)),add(W,mul(Tt,L3)),.75);
const parts=[[AP.j0,s1],[AP.j1,s1],[AP.up,mul(add(s1,E),.5)],[AP.j2,E],[AP.fo,mul(add(E,W),.5)],[AP.j3,W],[{tu:1},tc],[AP.dr,add(W,mul(Tt,7))]].map(([p,c])=>({p,d:dot(c,VW)})).sort((a,b)=>a.d-b.d);
for(const{p}of parts){if(p.tu)ARM.appendChild(AP.tu);else{ARM.appendChild(p.b);ARM.appendChild(p.g);}}return{W,Tt};}
function drawGround(){const pts=j=>{const out=[];for(let i=trackG.length-1;i>=0;i--){const[gx,gy]=trackG[i][j],o=local({gx,gy});if(hypot(o.lx,o.ly)>RR-5)break;out.unshift([o.lx,o.ly]);}out.push([30,j?-TRACK:TRACK]);return out;};
let md='';for(const j of[0,1]){const p=pts(j);set(trk[j],'d',p.length>1?pth(p.map(([x,y])=>[x,y,0])):'');for(let i=0;i<p.length;i+=1){const[x,y]=p[i],nx=p[min(i+1,p.length-1)],pv=p[max(i-1,0)],dx=nx[0]-pv[0],dy=nx[1]-pv[1],l=hypot(dx,dy)||1,ux=-dy/l*3,uy=dx/l*3;md+=`M${q2([x+ux,y+uy,0])}L${q2([x-ux,y-uy,0])}`;}}set(marks,'d',md);
let pd='';for(const p of PEB){local(p);const c=P(p.lx,p.ly,0),r=p.r;pd+=`M${f2(c[0]-r*1.22)},${f2(c[1])}a${f2(r*1.22)},${f2(r*.7)} 0 1 0 ${f2(r*2.44)},0a${f2(r*1.22)},${f2(r*.7)} 0 1 0 ${f2(-r*2.44)},0`;}set(peb,'d',pd);
for(const r of ROCKS){local(r);const c=P(r.lx,r.ly,0);set(r.g,'transform',`translate(${f2(c[0])} ${f2(c[1])})`);const o=+clamp((RR+2-hypot(r.lx,r.ly))/9).toFixed(2);if(o!==r.o){r.o=o;set(r.g,'opacity',o);}}}
/* The scene's order: rocks behind the rover first, then far wheels with the rocks in their lane, the rocks under the
rover, far links, body, near links, the near wheels with the rocks in theirs, the rocks in front, the arm. */
function reorder(){const slot=r=>{const d=r.lx+r.ly;if(abs(r.lx)<=42&&abs(r.ly)<=24)return['u',0];if(r.ly<-24)return['f',WX.filter(x=>x-TRACK+1<d).length];if(r.ly>24)return['n',WX.filter(x=>x+TRACK+1<d).length];return[r.lx>0?'x':'b',0];};
const S={};for(const r of ROCKS){const[k,i]=slot(r);(S[k+i]??=[]).push(r);}for(const k in S)S[k].sort((a,b)=>a.lx+a.ly-b.lx-b.ly);const g=k=>(S[k]||[]).map(r=>r.g);
const seq=[...g('b0'),...[0,1,2].flatMap(i=>[...g('f'+i),FW[i]]),...g('f3'),...g('u0'),FL,BODY,NL,...[0,1,2].flatMap(i=>[...g('n'+i),NW[i]]),...g('n3'),...g('x0'),ARM];
const key=seq.map(n=>n===ARM?'A':ROCKS.findIndex(r=>r.g===n)).join();if(key!==order){order=key;for(const n of seq)scene.appendChild(n);}}
function ui(){const m=Math.floor(odo/U_M+1e-6),r=`SOL ${214+Math.floor(m/25)} · ${m} M · ${plural(samples,'SAMPLE')} · ${plural(frames,'FRAME')}`;
const cmd=queue[0],climbing=WH.some(w=>w.z>WR+1.2);let st=T<noteT?note:arm?arm.steps[arm.i]?.[2]||'ARM · STOWING':pano&&!pano.red?'PANORAMA · SWEEPING':cmd?(cmd.k==='d'?`DRIVING · ${cmd.v>0?'FORWARD':'REVERSE'}${climbing?' · CLIMBING':''}`:`POINT TURN · ${cmd.v>0?'LEFT':'RIGHT'}`):ptr?'READY · MAST TRACKING':'READY · ARM STOWED';
if(r+st!==lastUI){lastUI=r+st;readout.textContent=r;stateLabel.textContent=st;}}
const SCAN=[[36,-8],[-24,-4],[64,-14],[8,-2],[-58,-7],[30,-16]];
function tick(now){const dt=last?min((now-last)/1000,.05):0,red=reduced.matches;last=now;T+=dt;autopilot(dt);
// Drives and turns: wheels straight to drive, toed in around the center to turn; a speed that eases in and out.
const cmd=queue[0];let ds=0,dh=0;const want=cmd?.k==='t'?1:0;steer=red?want:want>steer?min(want,steer+dt/STEER_T):max(want,steer-dt/STEER_T);
if(cmd&&cmd.k==='d'&&steer===0){const vmax=min(SPD,sqrt(2*ACC*abs(cmd.v))),tv=sgn(cmd.v)*vmax;v+=clamp(tv-v,-ACC*dt,ACC*dt);ds=v*dt;if(abs(ds)>=abs(cmd.v)||sgn(ds)!==sgn(cmd.v)&&abs(v)<1){ds=abs(ds)>=abs(cmd.v)?cmd.v:0;queue.shift();v=0;}else cmd.v-=ds;}
else if(cmd&&cmd.k==='t'&&steer===1){dh=sgn(cmd.v)*min(abs(cmd.v),TURN*dt);cmd.v-=dh;if(abs(cmd.v)<1e-4)queue.shift();}else v=0;
for(const w of WH){const p=hypot(w.x,w.y);w.st=w.i===1?0:-Math.asin(w.x/p)*sgn(w.y)*ease(steer);}
if(ds||dh)moveGround(ds,dh);
if(pending&&!queue.length&&!arm&&abs(v)<.01)sample(true);
// The arm runs its steps, joint by joint; with reduced motion it holds the drill pose a moment and then stows.
let drilling=0;if(arm){const s=arm.steps[arm.i];if(red){arm.t+=dt;if(arm.t>1.1){cored();q=QS.slice();arm=null;noteFor(`SAMPLE ${pad(samples)} · CACHED`);}else drilling=.5;}
else{arm.t+=dt;const k=clamp(arm.t/s[1]),e=ease(k);q=arm.from.map((x,i)=>lerp(x,s[0][i],e));if(arm.i===3)drilling=k;if(k>=1){if(arm.i===3)cored();arm.i++;arm.t=0;arm.from=q.slice();if(arm.i===3){hiss(1.4,.02,950,2.5);tone(118,1.35,.006,0,'square');}if(arm.i>=arm.steps.length){arm=null;noteFor(`SAMPLE ${pad(samples)} · CACHED`);}}}}
// The mast: the pointer, a panorama sweep, a slow look around when idle, or home.
let ty=HOME[0],tt=HOME[1],flashA=0;if(pano){pano.t+=dt;if(pano.red){ty=62;tt=-6;if(pano.t>1.8)pano=null;}else{const pt=pano.t;if(pt<.6){ty=-76;tt=-4;}else if(pt<2.3){ty=lerp(-76,74,ease((pt-.6)/1.7));tt=-4;}else{ty=74;tt=-4;}
if(pt>=2.3&&!pano.shot){pano.shot=true;frames++;noteFor(`PANORAMA · FRAME ${pad(frames)}`,1.8);tone(2600,.02,.012,0,'square');tone(1700,.03,.01,.05,'square');say(`Panorama taken, frame ${frames}.`);}
flashA=pt>=2.3&&pt<2.6?sin((pt-2.3)/.3*PI):0;if(pt>3.1)pano=null;}}
else if(ptr)[ty,tt]=ptr;else if(T<lostT){ty=hy;tt=ht;}else if(!red&&T-userT>2){scanT+=dt;if(scanT>3.4){scanT=0;scanI=(scanI+1)%SCAN.length;}[ty,tt]=SCAN[scanI];}
if(red||pano?.red){hy=ty;ht=tt;vy=vt=0;}else{const W=pano?9:6.5,ay=W*W*(ty-hy)-2*W*vy,at=W*W*(tt-ht)-2*W*vt;vy=clamp(vy+ay*dt,-260,260);vt=clamp(vt+at*dt,-160,160);hy+=vy*dt;ht+=vt*dt;}
// Pose and draw what changed.
const[pi,ro,hv]=kinematics(),vib=drilling>0&&drilling<1&&!red?sin(T*90)*.25:0,key=[pi,ro,hv,hy,ht,...q,vib,X,Y,H,steer].map(f2).join();
if(key!==drawn){drawn=key;setPose(pi,ro,hv);poseBody();for(const w of BW)if(w.b[2]===64){const tq=P(...BP(w.b));set(whipTip,'cx',f2(tq[0]));set(whipTip,'cy',f2(tq[1]));}drawLinks();drawWheels();drawHead();const{W,Tt}=drawArm();drawGround();reorder();
const tip=add(W,mul(Tt,L3+vib));puffs.forEach((p,i)=>{const a=i/puffs.length*2*PI+(red?0:T*.8),k=drilling>0?(red?.55:(drilling*2.6+i*.17)%1):0,o=drilling>0?(red?.8:sin(k*PI)*.95):0,c=P(...add(tip,[cos(a)*(2.4+k*6.5),sin(a)*(2.4+k*6.5),1+k*6]));set(p,'cx',f2(c[0]));set(p,'cy',f2(c[1]));set(p,'r',f2(1.4+k*2.8));p.style.opacity=f2(o);});}
if(flashA!==lastFlash){lastFlash=flashA;flash.style.opacity=f2(flashA);flashCore.style.opacity=f2(flashA);rays.style.opacity=f2(flashA*.9);set(rays,'transform',`translate(${f2(flashAt[0])} ${f2(flashAt[1])}) scale(${f2(.7+flashA*.6)})`);}
lit(noseLamp,arm?'a':queue.length?'b':'g');lit(headLamp,pano&&!pano.red?'a':pano?.red?'a':'');
if(whir)whir.gain.setTargetAtTime(min(1,abs(v)/SPD+(dh?.6:0))*.006,ac.currentTime,.06);ui();requestAnimationFrame(tick);}
{const[pi,ro,hv]=kinematics();setPose(pi,ro,hv);}poseBody();drawLinks();drawWheels();drawHead();drawArm();drawGround();reorder();ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
