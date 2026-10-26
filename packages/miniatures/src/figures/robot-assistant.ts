// @ts-nocheck
/* OLLEN Q–3 · Robot assistant. Drawn for this package in the lab figures' form: its stylesheet, defs and script,
 * on the engine's kit. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--shell:#e6e5e0;--shell-top:#fbfaf7;--shell-side:#c9c8c2;--coral:#ee7a4b;--coral-top:#f59c72;--coral-side:#cf5f33;--joint:#8d8e91;--joint-top:#a7a8ab;--rubber:#2e2e2d;--rubber-top:#474745;--visor:#15171a;--visor-hi:#2a3038;--visor-rim:#3a3d42;--eye:#74d8ff;--blush:#ff8a9e;--sheen:.5}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--shell:#c2c1be;--shell-top:#ebeae7;--shell-side:#8d8d8b;--coral:#c9663e;--coral-top:#e5926a;--coral-side:#924121;--joint:#6c6d70;--joint-top:#8c8d90;--rubber:#252524;--rubber-top:#424240;--visor:#111214;--visor-hi:#252a31;--visor-rim:#2c2f33;--eye:#80deff;--blush:#ff8a9e;--sheen:.3;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.shell{fill:var(--shell)}.top.shell{fill:var(--shell-top)}.side.shell{fill:var(--shell-side)}.coral{fill:var(--coral)}.top.coral{fill:var(--coral-top)}.side.coral{fill:var(--coral-side)}.joint{fill:var(--joint)}.top.joint{fill:var(--joint-top)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}
.panel{stroke-opacity:.3}.seam{fill:none;stroke:var(--line);stroke-width:.55;vector-effect:non-scaling-stroke;opacity:.5}
.visor{fill:url(#visorG);stroke:var(--visor-rim);stroke-width:1.1;vector-effect:non-scaling-stroke}.bezel{fill:var(--line);stroke:none;opacity:.55}.glint{fill:none;stroke:#fff;stroke-width:.9;stroke-linecap:round;opacity:.3}
.eye{fill:var(--eye);filter:url(#glow)}.mouth{fill:var(--eye);stroke:var(--eye);stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round;filter:url(#glow)}.cheek{fill:var(--blush);opacity:0;filter:url(#soft)}
.scr{fill:var(--eye);font:600 3.1px ui-monospace,monospace;letter-spacing:.2px;stroke:none;white-space:pre}.track{fill:var(--eye);opacity:.18}.fill{fill:var(--eye)}
.plate{fill:var(--shell-top);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.brand{fill:var(--ink);font:italic 600 2.9px Georgia,'Times New Roman',serif;letter-spacing:.35px;stroke:none;text-anchor:middle}
.rod{fill:none;stroke-linecap:round}.rod.u{stroke:var(--line)}.rod.m{stroke:var(--shell-top)}
.lamp{fill:var(--off);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.lamp.c{fill:var(--eye)}.lamp.a{fill:var(--warn)}.lamp.g{fill:var(--ok)}.lamp.p{fill:var(--blush)}.lamp.c,.lamp.a,.lamp.g,.lamp.p{filter:url(#glow)}
.halo{opacity:0;filter:url(#bloom);pointer-events:none}.halo.c{fill:var(--eye)}.halo.a{fill:var(--warn)}.halo.g{fill:var(--ok)}.halo.p{fill:var(--blush)}.spec{fill:#fff;opacity:.75;stroke:none}
.ring{fill:none;stroke:var(--recess);stroke-width:1.5;opacity:.7}.lit{fill:none;stroke:var(--off);stroke-width:1.5;stroke-linecap:round;opacity:0}.lit.c{stroke:var(--eye)}.lit.a{stroke:var(--warn)}.lit.g{stroke:var(--ok)}.lit.c,.lit.a,.lit.g{filter:url(#glow)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<linearGradient id="visorG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--visor-hi)"/><stop offset=".55" style="stop-color:var(--visor)"/><stop offset="1" style="stop-color:var(--visor)"/></linearGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame}=env;
/* OLLEN Q–3 desk robot. World: x lower-right, y lower-left (front faces +y), z up; it stands at the origin with its body
turned 30° from the front plane toward the viewer, and its head turns, nods and tilts about the neck. 1 unit ≈ 2 mm.
Part                        size                                        on it
ground shadow           the house ellipse under the base
base foot + puck        r 23 × 3 / r 21 × 7, z 0–10                  light ring r 16.5 on the puck; the waist r 8 above
torso                   42 × 32 × 38, round-edged r 10.5, z 12–50   chest screen 25.6 × 12, brand plate under it
arms                    r 4, 15.5 long from the shoulders at ±25, z 41; mitten hands r 5.2
neck                    bearing ring r 8.6 on the torso, neck r 5.6 up into the head
head                    72 × 46 × 50, round-edged r 17, z 63–113    visor 56 × 33 on its front: eyes, mouth, cheeks
ears                    r 8 discs, 3.6 proud of the head's sides     a lamp in each
antenna                 collar r 3.2, rod 19 on a spring, lamp r 3.5
Every outline is a projected path (hulls of the corner spheres, ellipses, capsules), so the drawing's box is its own.
Painter order: shadow; base, far arm, torso, neck, far ear, head and face, near ear, antenna, near arm; the control. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{P,set,el,group,rect,text}=env.kit(()=>root);
// Family helpers: vectors and frames, projected outlines (hulls, round-edged boxes, discs, capsules), lamps and controls.
const{cos,sin,PI,hypot,max,min,abs,exp,round}=Math,RAD=PI/180,K=Math.SQRT1_2,BZ=.5523,RS=1.2247,VIEW=[1,1,1];
const f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>max(a,min(b,v)),pt=q=>f2(q[0])+','+f2(q[1]);
const add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(hypot(...a)||1));
const turn=(v,ax,a)=>add(add(mul(v,cos(a)),mul(cross(ax,v),sin(a))),mul(ax,dot(ax,v)*(1-cos(a))));
/* A frame: U to the robot's left (screen right), F out of its face, Z up; yaw from the front plane, then a nod, then a tilt. */
function orient(yaw,nod=0,tilt=0){let U=[cos(yaw),-sin(yaw),0],F=[sin(yaw),cos(yaw),0],Z=[0,0,1];F=turn(F,U,nod);Z=turn(Z,U,nod);U=turn(U,F,tilt);Z=turn(Z,F,tilt);return{U,F,Z};}
const lp=(o,f,a,b,c)=>[0,1,2].map(i=>o[i]+f.U[i]*a+f.F[i]*b+f.Z[i]*c),on=(o,E1,E2)=>(s,t)=>pt(P(o[0]+E1[0]*s+E2[0]*t,o[1]+E1[1]*s+E2[1]*t,o[2]+E1[2]*s+E2[2]*t));
const plane=(o,U,V)=>`matrix(${[...P(...U),...P(...V),...P(...o)].map(f2).join(' ')})`;
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const p of pts){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(const p of pts.reverse()){while(hi.length>1&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
/* A convex outline grown by r: each corner becomes an arc, as a sphere at each corner would draw it. */
function grown(q,r){const N=q.length;let a2=0;for(let i=0;i<N;i++){const p=q[i],n=q[(i+1)%N];a2+=p[0]*n[1]-n[0]*p[1];}const R=f2(r),cw=a2>0,nr=(a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],l=hypot(dx,dy)||1;return cw?[dy/l,-dx/l]:[-dy/l,dx/l];};
let d='';for(let i=0;i<N;i++){const p=q[i],a=nr(q[(i+N-1)%N],p),b=nr(p,q[(i+1)%N]);d+=`${i?'L':'M'}${pt([p[0]+a[0]*r,p[1]+a[1]*r])}A${R},${R} 0 0 ${cw?1:0} ${pt([p[0]+b[0]*r,p[1]+b[1]*r])}`;}return d+'Z';}
/* A rounded rectangle lying in the plane through o along E1 (right) and E2 (down), projected: corner arcs as Béziers. */
function rrect(o,E1,E2,w,h,q){const m=on(o,E1,E2),k=q*(1-BZ);return`M${m(q-w,-h)}L${m(w-q,-h)}C${m(w-k,-h)} ${m(w,k-h)} ${m(w,q-h)}L${m(w,h-q)}C${m(w,h-k)} ${m(w-k,h)} ${m(w-q,h)}L${m(q-w,h)}C${m(k-w,h)} ${m(-w,h-k)} ${m(-w,h-q)}L${m(-w,q-h)}C${m(-w,k-h)} ${m(k-w,-h)} ${m(q-w,-h)}Z`;}
function disc(o,E1,E2,r){const m=on(o,E1,E2),k=r*BZ;return`M${m(r,0)}C${m(r,k)} ${m(k,r)} ${m(0,r)}C${m(-k,r)} ${m(-r,k)} ${m(-r,0)}C${m(-r,-k)} ${m(-k,-r)} ${m(0,-r)}C${m(k,-r)} ${m(r,-k)} ${m(r,0)}Z`;}
/* A sphere-swept segment between two drawing points: it projects to a capsule of radius r × 1.2247. */
function capsule(n,a,b,r){const dx=b[0]-a[0],dy=b[1]-a[1],l=hypot(dx,dy)||1e-3,nx=-dy/l*r,ny=dx/l*r,R=f2(r);set(n,'d',`M${pt([a[0]+nx,a[1]+ny])}L${pt([b[0]+nx,b[1]+ny])}A${R},${R} 0 0 0 ${pt([b[0]-nx,b[1]-ny])}L${pt([a[0]-nx,a[1]-ny])}A${R},${R} 0 0 0 ${pt([a[0]+nx,a[1]+ny])}Z`);}
/* An upright cylinder, as two ellipses and the band between them. */
function upright(g,z,r,h,cls){const a=P(0,0,z),b=P(0,0,z+h),rx=f2(r*RS),ry=f2(r*K);el('path',{d:`M${f2(a[0]-r*RS)},${f2(a[1])}A${rx},${ry} 0 0 0 ${f2(a[0]+r*RS)},${f2(a[1])}L${f2(b[0]+r*RS)},${f2(b[1])}A${rx},${ry} 0 0 1 ${f2(b[0]-r*RS)},${f2(b[1])}Z`,class:'face '+cls},g);el('ellipse',{cx:f2(b[0]),cy:f2(b[1]),rx,ry,class:'face top '+cls},g);}
/* A cylinder on any axis, from a to b: its body (the hull of its end circles) and the end that faces the viewer. */
function cylNodes(g,cls,end){return{b:el('path',{class:'face '+cls},g),e:el('path',{class:'face '+end+' '+cls},g)};}
function cyl(n,a,b,r){const ax=unit(add(b,mul(a,-1))),E1=unit(abs(ax[2])>.9?cross(ax,[1,0,0]):cross([0,0,1],ax)),E2=cross(ax,E1),pts=[];
for(const c of[a,b])for(let i=0;i<36;i++){const t=i/36*2*PI;pts.push(P(...add(c,add(mul(E1,r*cos(t)),mul(E2,r*sin(t))))));}
set(n.b,'d','M'+hull(pts).map(pt).join('L')+'Z');set(n.e,'d',disc(dot(ax,VIEW)>0?b:a,E1,E2,r));return{E1,E2};}
/* A round-edged box: its outline (the corner spheres' hull) and its face panels, each reaching the 45° line of its
 * rounded edges, the upright ones shaded by where they face (a face turning toward the side darkens as it turns). */
function boxNodes(g){return{sil:el('path',{class:'face shell'},g),pan:['','','','top '].map(c=>el('path',{class:'face panel '+c+'shell'},g))};}
const shadeOf=N=>{const t=clamp((Math.atan2(N[0],N[1])/RAD-18)/52);return t<.01?'var(--shell)':t>.99?'var(--shell-side)':`color-mix(in srgb,var(--shell-side) ${round(t*100)}%,var(--shell))`;};
function shape(n,c,f,A,B,H,r){const cs=[];for(const a of[-A,A])for(const b of[-B,B])for(const h of[-H,H])cs.push(P(...lp(c,f,a,b,h)));set(n.sil,'d',grown(hull(cs),r*RS));
const nZ=mul(f.Z,-1);[[f.F,f.U,nZ,A,H,B],[f.U,mul(f.F,-1),nZ,B,H,A],[mul(f.U,-1),f.F,nZ,B,H,A],[f.Z,f.U,f.F,A,B,H]].forEach(([N,E1,E2,p,q,d],i)=>{const node=n.pan[i];
if(dot(N,VIEW)<.03){set(node,'d','');return;}set(node,'d',rrect(add(c,mul(N,d+K*r)),E1,E2,p+K*r,q+K*r,K*r));if(i<3)node.style.fill=shadeOf(N);});}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function lit(n,c,base){if(n._c!==c){n._c=c;set(n,'class',base+(c?' '+c:''));}}
// The body's frame and the parts' sizes.
const BODY=30*RAD,TF=orient(BODY),TC=[0,0,31],TA=10.5,TB=5.5,TH=8.5,TR=10.5,HA=19,HB=6,HH=8,HR=17,HZ=88,VZ=HB+HR*.88;
// Floor: the house ground shadow, then the base: a rubber foot, the puck with its light ring, the waist.
const s0=P(0,0,0),floor=['shadow stage-floor','stage-contact'].map(c=>el('ellipse',{cx:f2(s0[0]),cy:f2(s0[1]+2),rx:40,ry:15,class:c}));
const layers=[],layer=()=>{const g=el('g',{});layers.push(g);return g;};
const baseG=layer();upright(baseG,0,23,3,'rubber');upright(baseG,3,21,7,'shell');
const rc=P(0,0,10),ringD=`M${f2(rc[0])},${f2(rc[1]+16.5*K)}A${f2(16.5*RS)},${f2(16.5*K)} 0 1 0 ${f2(rc[0])},${f2(rc[1]-16.5*K)}A${f2(16.5*RS)},${f2(16.5*K)} 0 1 0 ${f2(rc[0])},${f2(rc[1]+16.5*K)}`;
el('path',{d:ringD,class:'ring'},baseG);const ring=el('path',{d:ringD,class:'lit',pathLength:100},baseG);ring._c='';
upright(baseG,9,8,5,'joint');
// Arms: a capsule and a mitten each; the far one goes behind the torso, the near one in front of everything.
const arm=g=>({c:el('path',{class:'face shell'},g),h:el('circle',{r:f2(5.2*RS),class:'face coral'},g),s:el('circle',{r:1.2,class:'spec'},g)});
const farArm=arm(layer());
// Torso: the shell, the chest screen (two lines of type, a progress track) and the brand plate, then the near shoulder.
const torsoG=layer(),torso=boxNodes(torsoG);shape(torso,TC,TF,TA,TB,TH,TR);
const chest=group(plane(lp(TC,TF,0,TB+TR*.9,0),TF.U,mul(TF.Z,-1)),torsoG);rect(chest,-13.6,-10.6,27.2,13.6,3.6,'bezel');rect(chest,-12.8,-9.8,25.6,12,3,'visor');
const L1=text(chest,-11.2,-5.4,'','scr'),L2=text(chest,-11.2,-1.2,'','scr'),track=rect(chest,-11.2,-3.1,22.4,1.6,.8,'track'),bar=rect(chest,-11.2,-3.1,0,1.6,.8,'fill');
rect(chest,-6.6,4.4,13.2,4,1.4,'plate');text(chest,0,7.25,'Ollen','brand');
el('path',{class:'face coral',d:disc(lp(TC,TF,TA+TR+.1,0,10),mul(TF.F,-1),mul(TF.Z,-1),4.6)},torsoG);
// Neck, the far ear, the head and its face, the near ear: rebuilt in place as the head moves.
const neckG=layer();upright(neckG,49.6,8.6,1.8,'coral');upright(neckG,51.4,5.6,15,'joint');const earL=layer(),head=boxNodes(layer());
const faceG=el('g',{},layer());rect(faceG,-28.9,-17.4,57.8,34.8,12.4,'bezel');rect(faceG,-28,-16.5,56,33,11.6,'visor');el('path',{d:'M-25.6,-4Q-25.8,-14.2 -15.8,-14.6',class:'glint'},faceG);
const cheeks=[-1,1].map(s=>el('ellipse',{cx:s*16.5,cy:5.5,rx:3.6,ry:2.1,class:'cheek'},faceG)),eyes=[0,1].map(()=>el('path',{class:'eye'},faceG)),mouth=el('path',{class:'mouth'},faceG);
const earR=layer(),ears=[1,-1].map(s=>({s,n:cylNodes(earL,'coral','side'),r:el('path',{class:'detail'},earL),l:el('circle',{r:1.3,class:'lamp'},earL)}));
// Antenna: a collar, a rod on a spring, the lamp at its tip with its halo and a glint.
const antG=layer(),collar=cylNodes(antG,'coral','top'),rodU=el('path',{class:'rod u','stroke-width':2.1},antG),rodM=el('path',{class:'rod m','stroke-width':1.1},antG);
const halo=el('circle',{r:8,class:'halo'},antG),lamp=el('circle',{r:f2(3.5*RS),class:'lamp'},antG),spec=el('circle',{r:1,class:'spec'},antG);lamp._c=halo._c='';
const nearArm=arm(layer());
// The control: the whole robot is a button that says hi.
const hc=P(0,0,74),hiBtn=layer();for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0','aria-label':'Say hi: it waves back'}))set(hiBtn,k,v);
el('rect',{x:f2(hc[0]-48),y:f2(hc[1]-36),width:96,height:104,rx:20,class:'hit'},hiBtn);el('rect',{x:f2(hc[0]-50),y:f2(hc[1]-38),width:100,height:108,rx:22,class:'focus-ring'},hiBtn);
set(svg,'viewBox','-66 -156 132 188');
// State: idle, listening to the keys, thinking, replying on the chest screen, waving, and the moods; a page can drive the thinking as progress.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const say=m=>{announcement.textContent=m;};
const ROWS=['1234567890','qwertyuiop','asdfghjkl','zxcvbnm'],THINK=1600,CPS=24,HOLD=2800,QUIET=7000;
const REPLIES=[[/\b(hi|hello|hey|hiya|howdy)\b/,'HI! HOW CAN I HELP?'],[/how are you/,'ALL SYSTEMS GO!'],[/\b(name|who)\b/,'I’M OLLEN!'],[/\bthank/,'ANYTIME!'],[/\bhelp\b/,'HAPPY TO HELP!'],[/\b(bye|night)\b/,'SEE YOU SOON!'],[/\blove\b/,'BEEP BOOP ♥'],[/\b(joke|funny)\b/,'KNOCK KNOCK!'],[/\b(time|late|tired)\b/,'TIME FOR A BREAK?']];
const ANSWERS=['GOOD QUESTION!','ON IT!','SOUNDS GREAT!','LET ME CHECK…','GREAT IDEA!'];
const MOODS={1:['happy','HAPPY · ARMS UP','YAY!','Happy: it cheers with its arms up.',2600],2:['wow','SURPRISED · EYES WIDE','WHOA!','Surprised: its eyes go wide.',2400],3:['huh','PUZZLED · HEAD TILTED','HMM… ?','Puzzled: it tilts its head.',2800],4:['sleepy','SLEEPY · DOZING OFF','Z z z','Sleepy: it dozes off for a moment.',4200]};
// Faces: each eye's half-width, top, middle and bottom (an oval at rest, a crescent when it smiles, a slit when it squints),
// the mouth's width, corners, top and bottom, and the cheeks' blush.
const FACE={idle:[4.6,-7.2,0,7.2,4.6,-7.2,0,7.2,6,-.6,.5,.5,0],listen:[5,-7.8,0,7.8,5,-7.8,0,7.8,3.8,0,-.5,1.2,0],think:[4.8,-2.4,.6,4.2,4.8,-2.4,.6,4.2,4,.3,.3,.3,0],
smile:[5,-6.6,2.6,-1.4,5,-6.6,2.6,-1.4,8.4,-1.4,-.4,3.6,.6],wow:[5.6,-8.6,0,8.6,5.6,-8.6,0,8.6,3.6,.4,-1.9,3.4,0],huh:[4.6,-7.8,0,7.2,4.9,-2.6,.8,4,4.6,.2,.9,.9,0],sleepy:[4.8,-.5,1.4,3.6,4.8,-.5,1.4,3.6,2.6,.4,-.7,1.5,.25]};
let st='idle',t0=0,typed='',said='',reply='',lines=['',''],shown=0,pmode='auto',pv=0,keyAt=-1e9,turns=0,ptr=null,blinkAt=1800,blink=0,wanderAt=0,wander=[0,0],last=0,lastUI=-1,drawn='',ac=null;
const cur=FACE.idle.slice(),pose={yaw:0,nod:0,tilt:0,na:12,nb:8,fa:12,fb:8,gx:0,gy:0,hop:0},tip={p:null,v:[0,0]};
const now0=()=>performance.now(),base=()=>pmode==='auto'?'idle':'think';
function go(s,at=now0()){st=s;t0=at;lastUI=-1;}
function wrap(s){const out=[''];for(const w of s.split(' ')){const l=out[out.length-1];if(!l)out[out.length-1]=w;else if((l+' '+w).length<=12)out[out.length-1]=l+' '+w;else out.push(w);}return out.slice(0,2);}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac)ac=new A();if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,d=.06,v=.01,w=0,type='sine',f1=0){if(!ac)return;try{const t=ac.currentTime+w,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
const kick=(x,y)=>{tip.v=[tip.v[0]+x,tip.v[1]+y];};
function keyGaze(ch){for(let r=0;r<4;r++){const i=ROWS[r].indexOf(ch);if(i>=0)return[(i+r*.4-4.8)/4.8*6,-.4+r*1.2];}return[0,3.2];}
function typeKey(ch){audio();const g=keyGaze(ch.toLowerCase());if(st!=='listen'){typed='';go('listen');}if(typed.length<40)typed+=ch.toUpperCase();keyAt=now0();pose.key=g;kick((Math.random()-.5)*30,-20);lastUI=-1;tone(520+g[0]*30-g[1]*40,.035,.006,0,'triangle');}
function erase(){if(st!=='listen')return;typed=typed.slice(0,-1);keyAt=now0();kick(-12,-8);lastUI=-1;tone(300,.04,.006,0,'triangle');}
function ask(){audio();if(st==='think')return;said=typed.trim();typed='';go('think');kick(0,-40);tone(392,.12,.008,0,'sine',523);say(said?`Thinking about “${said.toLowerCase()}”.`:'Thinking.');}
function answer(s){const p=s.toLowerCase();if(!p)return'TYPE, THEN ENTER';for(const[re,a]of REPLIES)if(re.test(p))return a;return ANSWERS[turns++%ANSWERS.length];}
function speak(a,state='reply'){reply=a;lines=wrap(a);shown=0;go(state);say(a.charAt(0)+a.slice(1).toLowerCase());}
function hi(){audio();typed='';kick(-30,-30);speak('HI THERE!','wave');tone(880,.08,.012);tone(1318.5,.12,.012,.09);}
function mood(k){audio();const m=MOODS[k];typed='';go(m[0]);lines=wrap(m[2]);shown=m[2].length;kick(m[0]==='wow'?0:20,-50);say(m[3]);
if(m[0]==='happy'){tone(659,.07,.01);tone(784,.07,.01,.08);tone(1047,.1,.01,.16);}else if(m[0]==='wow')tone(440,.18,.01,0,'sine',1200);else if(m[0]==='huh'){tone(392,.09,.009);tone(330,.08,.009,.1,'sine',440);}else{tone(392,.25,.008,0,'sine',262);tone(294,.3,.006,.3,'sine',196);}}
function setProgress(p){if(p==null||!isFinite(p))pmode='ind';else{pmode='det';pv=clamp(+p);}if(st!=='think'){said='';typed='';go('think');}lastUI=-1;}
function finish(){if(st==='done')return;pmode='auto';pv=1;speak('ALL DONE!','done');tone(784,.08,.01);tone(1175,.12,.01,.09);}
window.figure={setProgress,done:finish};
bind(hiBtn,hi);
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key;if((k===' '||k==='Enter')&&e.target.closest&&e.target.closest('[role=button]'))return;
if(k==='Enter'){e.preventDefault();if(!e.repeat)ask();}else if(k==='Backspace'){e.preventDefault();erase();}else if(/^[1-4]$/.test(k)){e.preventDefault();if(!e.repeat)mood(+k);}else if(k.length===1&&!e.repeat){e.preventDefault();typeKey(k);}});
function local(e){const m=svg.getScreenCTM?.();if(!m)return null;const det=m.a*m.d-m.b*m.c;if(!det)return null;const x=e.clientX-m.e,y=e.clientY-m.f;return[(m.d*x-m.c*y)/det,(-m.b*x+m.a*y)/det];}
svg.addEventListener('pointermove',e=>{ptr=local(e);});svg.addEventListener('pointerdown',e=>{ptr=local(e);});svg.addEventListener('pointerleave',()=>{ptr=null;});
// The pose a state asks for at time t (seconds into it): head turn, nod and tilt (degrees), arms (out and forward), gaze.
function target(t,red){const w=red?0:sin(t*PI*2*1.7),gz=pose.key||[0,3.2];
switch(st){
case'listen':return{f:'listen',yaw:gz[0]*1.6,nod:-7,tilt:5,na:22,nb:34,fa:22,fb:34,gx:gz[0],gy:gz[1],lamp:'c',ring:'c'};
case'think':{const s=red?0:t*3.2;return{f:'think',yaw:6,nod:6,tilt:-5,na:32+(red?0:6*sin(t*5)),nb:14,fa:28-(red?0:6*sin(t*5)),fb:10,gx:red?2.6:3*cos(s),gy:red?-3:-2.6+1.2*sin(s),lamp:'a',ring:'a'};}
case'reply':case'done':return{f:'smile',yaw:0,nod:2,tilt:3,na:46+(red||shown>=reply.length?0:8*w),nb:26,fa:16,fb:10,gx:0,gy:0,lamp:'g',ring:'g'};
case'wave':return{f:'smile',yaw:-4,nod:3,tilt:red?4:4*w,na:118+(red?0:22*w),nb:22,fa:14,fb:8,gx:0,gy:-.5,lamp:'g',ring:'g'};
case'happy':return{f:'smile',yaw:0,nod:4,tilt:0,na:126+(red?0:8*w),nb:18,fa:126+(red?0:8*w),fb:18,gx:0,gy:-1,lamp:'p',ring:'c',hop:red||t>1.4?0:abs(sin(t*PI*2.2))*5};
case'wow':return{f:'wow',yaw:0,nod:8,tilt:0,na:72,nb:30,fa:72,fb:30,gx:0,gy:-1.2,lamp:'a',ring:'c',hop:red||t>.5?0:sin(t/.5*PI)*3};
case'huh':return{f:'huh',yaw:-5,nod:0,tilt:-11,na:56,nb:28,fa:52,fb:20,gx:-2,gy:-2,lamp:'c',ring:''};
case'sleepy':return{f:'sleepy',yaw:0,nod:-13+(red?0:2*sin(t*1.6)),tilt:6,na:4,nb:0,fa:4,fb:0,gx:0,gy:1.5,lamp:'',ring:''};
default:{let g=wander;if(ptr){const c=P(...lp([0,0,HZ],TF,0,HB+HR,0));g=[clamp((ptr[0]-c[0])/50,-1,1)*6,clamp((ptr[1]-c[1])/50,-1,1)*3.2];}return{f:'idle',yaw:g[0]*2.4,nod:-g[1]*2,tilt:0,na:12,nb:8,fa:12,fb:8,gx:g[0],gy:g[1],lamp:'g',ring:'c'};}}}
// Redraws the robot in its pose: everything is moved, nothing is added.
function render(T,breath){const fh=orient(BODY+T.yaw*RAD,T.nod*RAD,T.tilt*RAD),C=[0,0,HZ+breath];
shape(head,C,fh,HA,HB,HH,HR);
set(faceG,'transform',plane(lp(C,fh,0,VZ,0),fh.U,mul(fh.Z,-1)));
const near=dot(fh.U,VIEW)>=0?1:-1;
for(const e of ears){const o=lp(C,fh,e.s*(HA+HR-1.2),0,1),b=lp(C,fh,e.s*(HA+HR+3.6),0,1),{E1,E2}=cyl(e.n,o,b,8),f=dot(mul(fh.U,e.s),VIEW)>0;set(e.r,'d',disc(f?b:o,E1,E2,5));const q=P(...(f?b:o));set(e.l,'cx',f2(q[0]));set(e.l,'cy',f2(q[1]));
const into=e.s===near?earR:earL;for(const n of[e.n.b,e.n.e,e.r,e.l])into.appendChild(n);}
const top=lp(C,fh,0,0,HH+HR-.4),cTop=lp(C,fh,0,0,HH+HR+2.2);cyl(collar,top,cTop,3.2);
const rb=P(...cTop),rest=P(...lp(C,fh,0,0,HH+HR+21));
if(!tip.p||reduced.matches)tip.p=rest.slice();
const tx=tip.p[0],ty=tip.p[1],mid=P(...lp(C,fh,0,0,HH+HR+11.6)),d=`M${pt(rb)}Q${pt(mid)} ${f2(tx)},${f2(ty)}`;set(rodU,'d',d);set(rodM,'d',d);
for(const n of[halo,lamp]){set(n,'cx',f2(tx));set(n,'cy',f2(ty));}set(spec,'cx',f2(tx-1.4));set(spec,'cy',f2(ty-1.5));
return rest;}
function arms(T){for(const[a,s,al,be]of[[farArm,-1,T.fa,T.fb],[nearArm,1,T.na,T.nb]]){const S=lp(TC,TF,s*25,0,10),d=unit(add(mul(TF.Z,-cos(al*RAD)),mul(TF.U,s*sin(al*RAD)))),d2=unit(add(mul(d,cos(be*RAD)),mul(TF.F,sin(be*RAD)))),H=add(S,mul(d2,15.5)),p=P(...S),q=P(...H);
capsule(a.c,p,q,4*RS);set(a.h,'cx',f2(q[0]));set(a.h,'cy',f2(q[1]));set(a.s,'cx',f2(q[0]-2.4));set(a.s,'cy',f2(q[1]-2.6));}}
// The face: eyes, mouth and cheeks from the current expression, the gaze and a blink.
function eyeD(x,y,a,t,m,b){const k=BZ,u=(v,w)=>`${f2(x+v)},${f2(y+w)}`;return`M${u(-a,m)}C${u(-a,m+(t-m)*k)} ${u(-a*k,t)} ${u(0,t)}C${u(a*k,t)} ${u(a,m+(t-m)*k)} ${u(a,m)}C${u(a,m+(b-m)*k)} ${u(a*k,b)} ${u(0,b)}C${u(-a*k,b)} ${u(-a,m+(b-m)*k)} ${u(-a,m)}Z`;}
function face(gx,gy,bl,talk){const v=cur,sh=(y,m)=>m+(y-m)*(1-.9*bl);
for(const[i,x]of[[0,-11],[1,11]]){const o=i*4,m=v[o+2];set(eyes[i],'d',eyeD(x+gx,-2.6+gy,v[o],sh(v[o+1],m),m,sh(v[o+3],m)));}
const mx=gx*.6+(st==='huh'?3:0),my=9+gy*.5,w=v[8]/2;set(mouth,'d',`M${f2(mx-w)},${f2(my+v[9])}Q${f2(mx)},${f2(my+2*(v[10]-talk*.7)-v[9])} ${f2(mx+w)},${f2(my+v[9])}Q${f2(mx)},${f2(my+2*(v[11]+talk*2.6)-v[9])} ${f2(mx-w)},${f2(my+v[9])}Z`);
set(mouth,'transform',st==='huh'?`rotate(-9 ${f2(mx)} ${f2(my)})`:'');cheeks.forEach(c=>{c.style.opacity=f2(v[12]);set(c,'transform',`translate(${f2(gx*.5)} ${f2(gy*.4)})`);});}
// The chest screen: what you type, the thinking, the reply typing out.
function screen(now,red){let a='',b='',p=-1;
if(st==='listen'){const s=typed.slice(max(0,((typed.length/11)|0)-1)*11),c=red||now%900<520?'_':'';a=s.slice(0,11);b=s.slice(11);if(s.length<11)a+=c;else b+=c;}
else if(st==='think'){a='THINKING'+(red?'…':'.'.repeat(1+((now/380)|0)%3));if(pmode==='det'){p=pv;b='';}else p=-2;}
else if(st==='idle'){a='ASK ME';b='ANYTHING';}
else{let n=shown;[a,b]=[lines[0]||'',lines[1]||''];if(n<a.length+b.length+1){const c1=min(n,a.length),c2=max(0,n-a.length-1);a=a.slice(0,c1);b=b.slice(0,c2);}}
if(L1.textContent!==a)L1.textContent=a;if(L2.textContent!==b)L2.textContent=b;
const show=p!==-1;track.style.opacity=show?'':'0';bar.style.opacity=show?'':'0';
if(p>=0){set(bar,'x',-11.2);set(bar,'width',f2(22.4*p));}else if(p===-2){const k=red?.5:.5-.5*cos((now/1100)%1*2*PI);set(bar,'x',f2(-11.2+16.4*k));set(bar,'width',6);}
return p;}
function ui(){const R=reply.length?`OLLEN · ${reply}`:'ASK ME ANYTHING';
readout.textContent=st==='listen'?`YOU · ${typed||'…'}`:st==='think'?(pmode==='det'?`PROGRESS ${round(pv*100)}%`:said?`YOU · ${said.toUpperCase()}`:'THINKING…'):MOODS_BY[st]?`MOOD · ${MOODS_BY[st]}`:R;
stateLabel.textContent=st==='listen'?'LISTENING · EYES ON THE KEYS':st==='think'?'THINKING · ANTENNA PULSING':st==='reply'?(shown<reply.length?'REPLYING · TYPING IT OUT':'REPLIED · SMILING'):st==='done'?'DONE · ANSWER READY':st==='wave'?'WAVING · SAYING HI':MOODS_LABEL[st]||'READY · TYPE TO TALK';}
const MOODS_BY={},MOODS_LABEL={};for(const m of Object.values(MOODS)){MOODS_BY[m[0]]=m[0]==='wow'?'SURPRISED':m[0]==='huh'?'PUZZLED':m[0].toUpperCase();MOODS_LABEL[m[0]]=m[1];}
function tick(now){const dt=last?min((now-last)/1000,.05):0,red=reduced.matches;last=now;const t=(now-t0)/1000;
// Timers: listening lapses, thinking turns into a reply, a reply and a mood run out.
if(st==='listen'&&now-keyAt>QUIET){typed='';go(base(),now);}
else if(st==='think'&&pmode==='auto'&&now-t0>THINK)speak(answer(said));
else if(st==='reply'||st==='done'||st==='wave'){const n=red?reply.length:min(reply.length,((now-t0)/1000*CPS)|0);if(n>shown&&ac&&n%2)tone(900+(n*137)%500,.03,.004,0,'square');shown=n;if(shown>=reply.length&&now-t0>reply.length/CPS*1000+(st==='wave'?1800:HOLD))go(base(),now);}
else{const m=Object.values(MOODS).find(m=>m[0]===st);if(m&&now-t0>m[4])go(base(),now);}
const T=target(t,red);const F=FACE[T.f],k=red?1:1-exp(-dt*(st==='listen'?16:10));for(let i=0;i<F.length;i++)cur[i]+=(F[i]-cur[i])*k;
const g=red?1:1-exp(-dt*(st==='listen'?20:7));for(const n of['yaw','nod','tilt','na','nb','fa','fb','gx','gy'])pose[n]+=(T[n]-pose[n])*g;pose.hop=T.hop||0;
// Idle life: blinks, a wandering glance, breathing; none of it under reduced motion.
if(!red&&st==='idle'&&now>wanderAt){wanderAt=now+2200+Math.random()*2600;wander=Math.random()<.35?[0,0]:[(Math.random()-.5)*8,(Math.random()-.5)*4];}
if(red)wander=[0,0];
let bl=0;if(!red&&st!=='sleepy'&&st!=='think'){if(now>blinkAt){blink=now;blinkAt=now+2200+Math.random()*3000;}const e=(now-blink)/150;bl=e<1?sin(e*PI):0;}
const breath=red?0:sin(now/1000*PI*2/3.4)*.7;
const key=[pose.yaw,pose.nod,pose.tilt,breath].map(f2).join();let rest;if(key!==drawn||!red){drawn=key;rest=render(pose,breath);}
// The antenna's lamp on its spring: it lags behind the head and bobs back.
if(rest){if(red){tip.p=rest.slice();tip.v=[0,0];}else{const ax=180*(rest[0]-tip.p[0])-9*tip.v[0],ay=180*(rest[1]-tip.p[1])-9*tip.v[1];tip.v=[tip.v[0]+ax*dt,tip.v[1]+ay*dt];tip.p=[tip.p[0]+tip.v[0]*dt,tip.p[1]+tip.v[1]*dt];const ox=tip.p[0]-rest[0],oy=tip.p[1]-rest[1],l=hypot(ox,oy);if(l>6)tip.p=[rest[0]+ox/l*6,rest[1]+oy/l*6];}}
const talk=!red&&(st==='reply'||st==='done'||st==='wave')&&shown<reply.length?abs(sin(now/1000*15)):0;arms(pose);face(pose.gx,pose.gy,bl,talk);
const hop=pose.hop?`translate(0 ${f2(-pose.hop)})`:'';for(const g of layers)set(g,'transform',hop);for(const n of floor){set(n,'rx',f2(40*(1-pose.hop*.025)));set(n,'ry',f2(15*(1-pose.hop*.025)));}
// Lights: the antenna lamp (it pulses while thinking), the ear lamps and the base ring (progress, or a chasing arc).
const lc=T.lamp,pulse=lc==='a'&&!red?.5+.5*sin(now/1000*PI*2*1.4):lc?(st==='idle'?.35:.6):0;lit(lamp,lc,'lamp');lit(halo,lc,'halo');halo.style.opacity=f2(lc?pulse*.7:0);
for(const e of ears)lit(e.l,lc==='a'&&!red?(sin(now/1000*PI*2*1.4)>0?'a':''):lc,'lamp');
const p=screen(now,red);lit(ring,T.ring,'lit');ring.style.opacity=T.ring?'1':'0';
if(st==='think'&&p>=0)set(ring,'stroke-dasharray',`${f2(p*100)} 100`);else if(st==='think'&&!red){set(ring,'stroke-dasharray','22 78');set(ring,'stroke-dashoffset',f2(-(now/1000*60)%100));}else{set(ring,'stroke-dasharray','');set(ring,'stroke-dashoffset','');if(st==='idle')ring.style.opacity=f2(red?.5:.35+.25*sin(now/1000*PI*2/3.4));}
if(lastUI<0||now-lastUI>120){lastUI=now;ui();}
requestAnimationFrame(tick);}
render(pose,0);arms(pose);face(0,0,0,0);screen(0,reduced.matches);ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
