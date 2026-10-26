// @ts-nocheck
/* MORVELLE L–14 · Lava lamp. Drawn for this package in the lab figures' form: its stylesheet, defs and script. The
 * script runs on the env, which stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--metal-hi:#fbfbf9;--metal-lo:#9fa09c;--brass:#cfa95d;--brass-top:#e8c985;--brass-side:#ab8743;--cork:#c49b70;--cork-top:#d8b48a;--cork-side:#a98258;--cork-dot:#9a7148;--rocker:#2e2e2d;--rocker-top:#474745;--vent:#3a3633;--warm:#ffb54a;--sheen:.62;--round:.2;--shade:.12;--halo:.2;--glint:.55;--pane:.28}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--line:#444443;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--metal-hi:#d4d4d2;--metal-lo:#6f706e;--brass:#ae8e4d;--brass-top:#d9bc7c;--brass-side:#785e2d;--cork:#a5825d;--cork-top:#caa881;--cork-side:#765a3c;--cork-dot:#815e3b;--rocker:#252524;--rocker-top:#424240;--vent:#2f2c2a;--sheen:.3;--round:.12;--shade:.66;--halo:.5;--glint:.42;--pane:.12}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:url(#metalG)}.top.metal{fill:var(--metal-top)}.bead{fill:none;stroke:#fff;stroke-width:.6;vector-effect:non-scaling-stroke;opacity:var(--sheen)}.brass{fill:var(--brass)}.cork{fill:var(--cork-side)}.top.cork{fill:var(--cork-top)}.dots{fill:url(#corkDots);stroke:none;pointer-events:none}.rocker{fill:var(--rocker)}.top.rocker{fill:var(--rocker-top)}
.p0{--wax:#ea4a2e;--wax-hi:#ff8f55;--wax-lo:#b72d1b;--wax-edge:#8a2214;--liq:#f2bd44;--liq-hi:#ffeaa8;--liq-lo:#d38f25}
.p1{--wax:#f3efe5;--wax-hi:#ffffff;--wax-lo:#d0c8b6;--wax-edge:#8a8270;--liq:#3b79d5;--liq-hi:#93bdf3;--liq-lo:#214f9e}
.p2{--wax:#f3679f;--wax-hi:#ffa6ca;--wax-lo:#c13e78;--wax-edge:#882552;--liq:#7449c5;--liq-hi:#b294ee;--liq-lo:#4a2a8e}
.p3{--wax:#ff8b1f;--wax-hi:#ffc06a;--wax-lo:#d6620d;--wax-edge:#934208;--liq:#dbe4e2;--liq-hi:#f9fcfb;--liq-lo:#b3c3c0}
@media(prefers-color-scheme:dark){.p0{--liq:#f0b43c;--liq-hi:#ffe49a;--liq-lo:#c47f1c;--wax-edge:#6e1a0f}.p1{--liq:#2f6cc8;--liq-hi:#86b3f0;--liq-lo:#183f85;--wax-edge:#6f6858}.p2{--liq:#6a3fbb;--liq-hi:#a888ea;--liq-lo:#3d2178;--wax-edge:#6e1c42}.p3{--liq:#c9d3d1;--liq-hi:#fbefd8;--liq-lo:#8fa29f;--wax-edge:#763506}}
.pane{fill:#fff;fill-opacity:var(--pane);stroke:none}.liquid{fill:url(#liqG);stroke:none}.round{fill:url(#roundG);stroke:none;pointer-events:none}.bulb{fill:url(#bulbG);stroke:none;opacity:0;pointer-events:none;transition:opacity .5s}.lit .bulb{opacity:1}
.wax{fill:url(#waxG);fill-rule:evenodd;stroke:var(--wax-edge);stroke-width:.7;vector-effect:non-scaling-stroke;stroke-linejoin:round}.wax-glow{fill:var(--wax-hi);fill-rule:evenodd;stroke:none;filter:url(#bloom);opacity:0;display:none;pointer-events:none}.glint{fill:#fff;fill-opacity:var(--glint);opacity:0;pointer-events:none}
.surface{fill:var(--liq-hi);fill-opacity:.6;stroke:#fff;stroke-opacity:.7;stroke-width:.6;vector-effect:non-scaling-stroke}.shade{fill:#120d0a;opacity:var(--shade);stroke:none;pointer-events:none;transition:opacity .5s}.lit .shade{opacity:0}
.streak{fill:#fff;opacity:var(--sheen);stroke:none;pointer-events:none}.outline{fill:none;stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round;pointer-events:none}
.vent{fill:var(--vent);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.lit .vent{fill:var(--warm);filter:url(#glow)}
.halo{fill:var(--liq-hi);filter:url(#bloom);opacity:0;pointer-events:none;transition:opacity .6s}.lit .halo{opacity:var(--halo)}.spill{fill:url(#spillG);opacity:0;display:none;pointer-events:none;transition:opacity .6s}
.brand{fill:#3b2a14;font:600 1.85px Georgia,'Times New Roman',serif;letter-spacing:.32px;text-anchor:middle;stroke:none}
.pip{fill:var(--off);stroke:none}.lit .pip{fill:var(--warm);filter:url(#glow)}.pad{fill:#6b6b68;stroke:none}.pad-on{opacity:0}.lit .pad-on{opacity:1}.lit .pad-off{opacity:0}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
@media(prefers-color-scheme:dark){.wax-glow{display:inline;transition:opacity .6s}.lit .wax-glow{opacity:.5}.spill{display:inline}.lit .spill{opacity:1}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<linearGradient id="metalG" x1="0" x2="1"><stop offset="0" style="stop-color:var(--metal)"/><stop offset=".17" style="stop-color:var(--metal-hi)"/><stop offset=".36" style="stop-color:var(--metal)"/><stop offset=".74" style="stop-color:var(--metal-side)"/><stop offset="1" style="stop-color:var(--metal-lo)"/></linearGradient>
<linearGradient id="liqG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--liq-lo)"/><stop offset=".6" style="stop-color:var(--liq)"/><stop offset="1" style="stop-color:var(--liq-hi)"/></linearGradient>
<linearGradient id="roundG" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".2"/><stop offset=".22" stop-color="#fff" stop-opacity=".32"/><stop offset=".44" stop-color="#fff" stop-opacity="0"/><stop offset=".66" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" style="stop-opacity:var(--round)"/></linearGradient>
<radialGradient id="bulbG" cx=".5" cy="1" r=".42"><stop offset="0" stop-color="#fff6dc" stop-opacity=".9"/><stop offset=".5" stop-color="#ffe2a0" stop-opacity=".38"/><stop offset="1" stop-color="#ffe2a0" stop-opacity="0"/></radialGradient>
<linearGradient id="waxG" gradientUnits="userSpaceOnUse" x1="0" y1="-122" x2="0" y2="-40"><stop offset="0" style="stop-color:var(--wax-lo)"/><stop offset=".55" style="stop-color:var(--wax)"/><stop offset="1" style="stop-color:var(--wax-hi)"/></linearGradient>
<radialGradient id="spillG"><stop offset="0" stop-color="#ffb54a" stop-opacity=".34"/><stop offset=".5" stop-color="#ffb54a" stop-opacity=".12"/><stop offset="1" stop-color="#ffb54a" stop-opacity="0"/></radialGradient>
<pattern id="corkDots" width="2.6" height="2.2" patternUnits="userSpaceOnUse"><circle cx=".6" cy=".6" r=".34" style="fill:var(--cork-dot)"/><circle cx="1.9" cy="1.5" r=".26" style="fill:var(--cork-dot)"/><circle cx="1.5" cy=".25" r=".17" style="fill:var(--cork-dot)"/></pattern>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* MORVELLE L–14 lava lamp on a cork coaster. World: x lower-right, y lower-left, z up; 1 unit ≈ 2.6 mm. The lamp is
round about the z axis at x = y = 0, so it's drawn from its profile: a circle of radius r at height z projects to an
ellipse of 1.2247 r by 0.7071 r about (0, −z), and a body's outline is the envelope of those ellipses.
Part                         z            r
cork coaster                 0–2          31
base: foot band              2–5          25.6
base: cone                   5–46         25 → 13.4    vents (12) at z 34.5–41.5, brand plate z 12.5–16.5, rocker z 7–10.4
collar (holds the globe)     45.5–50      14
glass globe                  48–128       12 → 19.5 (z 66) → 7.5   liquid to z 124
cap: skirt, cone, top        126–143.5    9.4; 9 → 4.3
The wax: a field of soft blobs (a head and a trailing tail each) and the pool on the bottom, drawn as one smooth
outline from a marching-squares contour, every frame into the same path. Wax heated at the bottom rises, cools under
the cap and sinks; the bulb in the base warms it, and the lamp warms up and cools down slowly. */
const svg=document.getElementById('machine'),draw=document.getElementById('drawing');let root=draw;
const{set,el,group,rect,circle,text}=kit(()=>root);
const into=g=>root=g,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),sm=t=>{t=clamp(t);return t*t*(3-2*t);};
const K=Math.sqrt(1.5),Q=Math.SQRT1_2,RAD=Math.PI/180,pt=p=>f2(p[0])+','+f2(p[1]);
// Profiles: radius by height.
const rBase=z=>25-11.6*clamp((z-5)/41);
const rGlass=z=>{if(z<=66){const t=clamp((z-48)/18);return 12+7.5*(1-(1-t)*(1-t));}const t=clamp((z-66)/62);return 19.5-12*(t+(Math.exp(-6*t)-1)/6)/(1+(Math.exp(-6)-1)/6);};
const rIn=z=>rGlass(z)-.7,rCap=z=>9-4.7*clamp((z-129.5)/14);
// Round bodies: Catmull-Rom curves through the points; the outline of a body of revolution; bands, rims, surface planes.
function cr(p,closed){const n=p.length;let d='';for(let i=0;i<(closed?n:n-1);i++){const a=p[closed?(i-1+n)%n:Math.max(0,i-1)],b=p[i],c=p[(i+1)%n],e=p[closed?(i+2)%n:Math.min(n-1,i+2)];
d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${pt(c)}`;}return d;}
const slope=(f,z,z0,z1)=>{const a=Math.max(z0,z-.05),b=Math.min(z1,z+.05);return(f(b)-f(a))/(b-a);};
const turn=(f,z,z0,z1)=>Math.asin(clamp(Q*slope(f,z,z0,z1),-.95,.95));
function solid(f,z0,z1,n){const R=[],L=[];for(let i=0;i<=n;i++){const z=z0+(z1-z0)*i/n,a=turn(f,z,z0,z1),r=f(z);R.push([K*r*Math.cos(a),-z+Q*r*Math.sin(a)]);L.push([-K*r*Math.cos(a),-z+Q*r*Math.sin(a)]);}
const arc=(r,to,large)=>`A${f2(K*r)},${f2(Q*r)} 0 ${large} 0 ${pt(to)}`;
return'M'+pt(R[0])+cr(R)+arc(f(z1),L[n],turn(f,z1,z0,z1)>0?1:0)+cr(L.reverse())+arc(f(z0),R[0],turn(f,z0,z0,z1)<0?1:0)+'Z';}
const band=(r,z0,z1)=>`M${pt([-K*r,-z0])}A${f2(K*r)},${f2(Q*r)} 0 0 0 ${pt([K*r,-z0])}L${pt([K*r,-z1])}A${f2(K*r)},${f2(Q*r)} 0 0 1 ${pt([-K*r,-z1])}Z`;
const rim=(r0,r1,z)=>`M${pt([-K*r1,-z])}A${f2(K*r1)},${f2(Q*r1)} 0 0 0 ${pt([K*r1,-z])}L${pt([K*r0,-z])}A${f2(K*r0)},${f2(Q*r0)} 0 0 1 ${pt([-K*r0,-z])}Z`;
const disc=(r,z,cls,attrs={})=>el('ellipse',{cx:0,cy:f2(-z),rx:f2(K*r),ry:f2(Q*r),class:cls,...attrs});
// A plane on a round body at height z and angle a (0 right, 90° front): u runs round it to the right, v down its face.
function tangent(f,z,a){const r=f(z),d=(f(z+.05)-f(z-.05))/.1,l=Math.sqrt(1+d*d),s=Math.sin(a),c=Math.cos(a);
return`matrix(${f2(K*s)} ${f2(-Q*c)} ${f2(-K*d*c/l)} ${f2((1-Q*d*s)/l)} ${f2(K*r*c)} ${f2(-z+Q*r*s)})`;}
function slot(a,z0,z1,w){const p=[];for(let i=0;i<=8;i++){const t=Math.PI*i/8;p.push([w*Math.cos(t),z1-w+w*Math.sin(t)]);}for(let i=0;i<=8;i++){const t=Math.PI+Math.PI*i/8;p.push([w*Math.cos(t),z0+w+w*Math.sin(t)]);}
const q=p.map(([u,z])=>{const r=rBase(z),t=a-u/r;return[K*r*Math.cos(t),-z+Q*r*Math.sin(t)];});return'M'+pt(q[0])+cr(q,true)+'Z';}
function streak(s0,s1,z0,z1){const A=[],B=[];for(let i=0;i<=16;i++){const t=i/16,z=z0+(z1-z0)*t,r=rIn(z),m=(s0+s1)/2,h=(s1-s0)/2*Math.sin(Math.PI*t)**.6;
A.push([K*r*(m-h),-z+Q*r*Math.sqrt(1-(m-h)**2)]);B.push([K*r*(m+h),-z+Q*r*Math.sqrt(1-(m+h)**2)]);}return'M'+pt(A[0])+cr(A)+cr([A[16],B[16]])+cr(B.reverse())+'Z';}
// A spun groove round a body's front at height z: a fine line and the light catching the bead under it.
function groove(f,z){const r=f(z),arc=y=>`M${pt([-K*r,y])}A${f2(K*r)},${f2(Q*r)} 0 0 0 ${pt([K*r,y])}`;el('path',{d:arc(-z),class:'detail'});el('path',{d:arc(-z+.55),class:'bead'});}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
// The floor: the ground shadow (and the dark floor's contact), the vents' warm spill, the cork coaster.
el('ellipse',{cx:2,cy:3,rx:47,ry:19,class:'shadow stage-floor'});el('ellipse',{cx:2,cy:3,rx:47,ry:19,class:'stage-contact'});
el('ellipse',{cx:0,cy:-1,rx:60,ry:25,class:'spill'});
el('path',{d:band(31,0,2),class:'face cork'});disc(31,2,'face top cork');disc(31,2,'dots');disc(28.6,2,'detail',{style:'opacity:.3'});
el('ellipse',{cx:1.5,cy:-1.2,rx:f2(K*26.6),ry:f2(Q*26.6),class:'shadow',style:'opacity:.16'});
// The lamp, which rocks a little when the glass is nudged (its parts all carry .rock): the glow behind it, the base.
el('ellipse',{cx:0,cy:-86,rx:31,ry:46,class:'halo rock'});
into(el('g',{class:'rock'}));
el('path',{d:band(25.6,2,5),class:'face metal'});el('path',{d:rim(25,25.6,5),class:'face top metal'});
el('path',{d:solid(rBase,5,46,24),class:'face metal'});groove(rBase,29.5);groove(rBase,43.6);
for(let k=0;k<12;k++){const a=(15+30*k)*RAD;if(Math.sin(a)>.12)el('path',{d:slot(a,34.5,41.5,1.25),class:'vent'});}
{const g=group(tangent(rBase,16.4,90*RAD));rect(g,-7.6,0,15.2,3.8,1.1,'face brass');rect(g,-6.8,.65,13.6,2.5,.6,'detail');text(g,0,2.6,'MORVELLE','brand');}
into(draw);
const rocker=el('g',{class:'control rock',role:'button',tabindex:'0','aria-label':'Switch: on or off (Space)','aria-pressed':'true'});
{const g=group(tangent(rBase,10.4,58*RAD),rocker);rect(g,-3.4,0,6.8,3.6,1,'face rocker');rect(g,-2.7,.65,5.4,2.3,.7,'face top rocker');rect(g,-2.45,.9,2.3,1.8,.5,'pad pad-on');rect(g,.15,.9,2.3,1.8,.5,'pad pad-off');
circle(g,4.6,1.8,.7,'pip');rect(g,-4.6,-1.2,10.6,6,1.6,'focus-ring');rect(g,-5,-2,12,8,0,'hit');}
// The globe: the glass, the water (shaded round, lit from below), the wax, its surface, the shade when it's off,
// reflections and the outline. A control: a click or Enter nudges the flow.
const glassG=el('g',{class:'control rock',role:'button',tabindex:'0','aria-label':'Glass: nudge the flow (Enter)'});into(glassG);
const gOut=solid(rGlass,50,128,40),gIn=solid(rIn,50,124,38);
el('path',{d:gOut,class:'pane'});el('path',{d:gIn,class:'liquid'});el('path',{d:gIn,class:'round'});el('path',{d:gIn,class:'bulb'});
const waxGlow=el('path',{class:'wax-glow'}),wax=el('path',{class:'wax'});
const BL=[{r:7.8,k:.4},{r:6.4,k:1.9},{r:5.4,k:1.1},{r:4,k:.7},{r:4.2,k:1.5},{r:5,k:.5},{r:4.6,k:.9}];
const glints=BL.map(()=>el('ellipse',{class:'glint',rx:0,ry:0}));
disc(rIn(124),124,'surface');
el('path',{d:gIn,class:'shade'});
el('path',{d:streak(-.66,-.46,53,118),class:'streak'});el('path',{d:streak(-.4,-.34,60,108),class:'streak',style:'opacity:calc(var(--sheen)*.6)'});el('path',{d:streak(.6,.7,72,112),class:'streak',style:'opacity:calc(var(--sheen)*.5)'});
el('path',{d:gOut,class:'outline'});el('path',{d:solid(z=>rGlass(z)+1.5,47,129,40),class:'focus-ring'});
into(draw);into(el('g',{class:'rock'}));
// The collar over the foot of the globe, then the cap.
el('path',{d:band(14,45.5,50),class:'face metal'});el('path',{d:rim(rGlass(50)-.45,14,50),class:'face top metal'});
el('path',{d:band(9.4,126,129.6),class:'face metal'});el('path',{d:rim(9,9.4,129.6),class:'face top metal'});
el('path',{d:solid(rCap,129.5,143.5,12),class:'face metal'});groove(rCap,133.4);disc(4.3,143.5,'face top metal');disc(2.2,143.5,'detail');
into(draw);
set(svg,'viewBox','-54 -153 108 183');
const ROCK=[...svg.querySelectorAll('.rock')];
// The wax field, on a grid over the globe's inside (x across, h up from the glass's foot at z 48): the walls fade it
// out, so every contour closes inside the glass.
const g=1.2,X0=-24,H0=-10,NX=41,NY=73,TH=.42,F=new Float32Array(NX*NY),WALL=new Float32Array(NX*NY),HT=72;
// The inside of the glass as drawn: its half-width at each height of the drawing, from the outline's envelope (where
// the glass flares, that's well below the widest point of each circle). The floor runs behind the collar's lip.
const SIL=[];for(let z=48;z<=124.01;z+=.25){const a=turn(rIn,z,48,124),r=rIn(z);SIL.push([K*r*Math.cos(a),z-48-Q*r*Math.sin(a)]);}
const Wi=h=>{let i=1;while(i<SIL.length-1&&SIL[i][1]<h)i++;const[a,b]=SIL[i-1],[c,e]=SIL[i];return a+(c-a)*clamp((h-b)/(e-b))-.9;};
for(let j=0;j<NY;j++){const h=H0+j*g,wi=Wi(h);for(let i=0;i<NX;i++){const x=X0+i*g,hb=.6-Q*13.6*Math.sqrt(Math.max(0,1-(x/(K*13.6))**2));
WALL[j*NX+i]=sm((wi-Math.abs(x))/2.2)*sm((h-hb)/1.6)*sm((73-h)/3);}}
function blob(cx,ch,ax,ay,w){const RX=2*ax,RY=2*ay,i0=Math.max(0,Math.ceil((cx-RX-X0)/g)),i1=Math.min(NX-1,Math.floor((cx+RX-X0)/g)),j0=Math.max(0,Math.ceil((ch-RY-H0)/g)),j1=Math.min(NY-1,Math.floor((ch+RY-H0)/g));
for(let j=j0;j<=j1;j++){const dy=(H0+j*g-ch)/RY,d2=dy*dy;if(d2>=1)continue;for(let i=i0;i<=i1;i++){const dx=(X0+i*g-cx)/RX,q=dx*dx+d2;if(q<1){const u=1-q;F[j*NX+i]+=w*u*u*u;}}}}
// Marching squares: edges are numbered (across, then up); each crossing links to its neighbours, and the loops are
// walked and drawn as closed Catmull-Rom curves.
const EH=NY*(NX-1),NE=EH+(NY-1)*NX,ex=new Float32Array(NE),ey=new Float32Array(NE),n1=new Int32Array(NE),n2=new Int32Array(NE),stamp=new Int32Array(NE),used=new Int32Array(NE),done=new Int32Array(NE);let frameNo=0,nUsed=0;
function cross(e){if(stamp[e]===frameNo)return;stamp[e]=frameNo;n1[e]=n2[e]=-1;used[nUsed++]=e;
if(e<EH){const j=Math.floor(e/(NX-1)),i=e-j*(NX-1),a=F[j*NX+i],b=F[j*NX+i+1];ex[e]=X0+(i+(TH-a)/(b-a))*g;ey[e]=H0+j*g;}
else{const k=e-EH,j=Math.floor(k/NX),i=k-j*NX,a=F[j*NX+i],b=F[(j+1)*NX+i];ex[e]=X0+i*g;ey[e]=H0+(j+(TH-a)/(b-a))*g;}}
function link(a,b){cross(a);cross(b);if(n1[a]<0)n1[a]=b;else n2[a]=b;if(n1[b]<0)n1[b]=a;else n2[b]=a;}
function contour(){frameNo++;nUsed=0;
for(let j=0;j<NY-1;j++)for(let i=0;i<NX-1;i++){const va=F[j*NX+i],vb=F[j*NX+i+1],vc=F[(j+1)*NX+i+1],vd=F[(j+1)*NX+i],c=(va>TH?1:0)|(vb>TH?2:0)|(vc>TH?4:0)|(vd>TH?8:0);if(c===0||c===15)continue;
const e0=j*(NX-1)+i,e2=(j+1)*(NX-1)+i,e3=EH+j*NX+i,e1=e3+1,mid=(va+vb+vc+vd)/4>TH;
switch(c){case 1:case 14:link(e3,e0);break;case 2:case 13:link(e0,e1);break;case 3:case 12:link(e3,e1);break;case 4:case 11:link(e1,e2);break;case 6:case 9:link(e0,e2);break;case 7:case 8:link(e3,e2);break;
case 5:if(mid){link(e0,e1);link(e2,e3);}else{link(e3,e0);link(e1,e2);}break;case 10:if(mid){link(e3,e0);link(e1,e2);}else{link(e0,e1);link(e2,e3);}break;}}
let d='';for(let k=0;k<nUsed;k++){const s=used[k];if(done[s]===frameNo)continue;const p=[];let prev=-1,cur=s,lx=1e9,ly=1e9;
while(cur>=0&&done[cur]!==frameNo){done[cur]=frameNo;const x=ex[cur],y=-48-ey[cur];if(Math.abs(x-lx)+Math.abs(y-ly)>.45){p.push([x,y]);lx=x;ly=y;}const nx=n1[cur]!==prev?n1[cur]:n2[cur];prev=cur;cur=nx;}
if(p.length>3&&!hole(p))d+='M'+pt(p[0])+cr(p,true)+'Z';}return d;}
// A loop with no wax inside is a gap between blobs: wax has no holes seen through it, so it's filled.
function hole(p){let A=0;for(let k=0;k<p.length;k++){const a=p[k],b=p[(k+1)%p.length];A+=a[0]*b[1]-b[0]*a[1];}
const tx=p[1][0]-p[0][0],ty=p[1][1]-p[0][1],l=Math.hypot(tx,ty)||1,s=A>0?1:-1,x=(p[0][0]+p[1][0])/2-ty/l*.6*s,y=(p[0][1]+p[1][1])/2+tx/l*.6*s;
const u=clamp((x-X0)/g,0,NX-1.001),v=clamp((-48-y-H0)/g,0,NY-1.001),i=Math.floor(u),j=Math.floor(v),fu=u-i,fv=v-j,o=j*NX+i;
return F[o]*(1-fu)*(1-fv)+F[o+1]*fu*(1-fv)+F[o+NX]*(1-fu)*fv+F[o+NX+1]*fu*fv<TH;}
// The wax's moves. Each blob carries its own warmth: by the bulb it warms, under the cap it cools, between them it
// keeps what it has, so it rises all the way up and sinks all the way down. Warm wax runs freely; cold wax is set.
// Poses: the flowing picture reduced motion shows (and the first frame), two more a nudge steps through, and cold.
// x, h, stretch, tail (in radii), warmth.
const POSES=[[[-3,60,.9,0,0,.2],[5,35,1.35,-.1,-1,1.1],[-2,12,1.3,0,-1.1,1.1],[-11,44,1.15,.1,1,.3],[7.5,65.5,1,0,0,.25],[7,3,.9,0,0,.8],[-8,2,.9,0,0,.6]],
[[4,49,1.2,0,1,.3],[-6,62,.9,0,0,.25],[3,24,1.4,0,-1.1,1.1],[9,64,1,0,0,.3],[-10,37,1.15,0,1,.35],[-3,9,1.3,0,-1.1,1],[8,2,.9,0,0,.6]],
[[0,29,1.3,0,-1,1.1],[-7,57,1.1,0,1,.3],[6,64,.95,0,0,.25],[11,46,1.2,0,1,.3],[-9,10,1.2,0,-1.1,1],[5,3,.9,0,0,.7],[-3,2,.9,0,0,.6]]];
const COLD=[[-2,5,.8,0,0,0],[6,3.5,.85,0,0,0],[1,7,.8,0,0,0],[-9,2,.9,0,0,0],[10,1.5,.9,0,0,0],[4,1,.9,0,0,0],[-6,1,.9,0,0,0]];
function place(pose){BL.forEach((b,i)=>{const[x,h,s,tx,th,T]=pose[i];Object.assign(b,{x,h,sy:s,sx:1/Math.sqrt(s),tx:tx*b.r,th:th*b.r,T,vx:0,vh:0,ph:h,p:i*1.7+.4});});}
let on=true,heat=1,pi=0,pose=0,stirT=-1e9,note='',noteT=0,last=0,time=0,wa=0,wv=0,outKey='',drawn='',bloopT=0;
function physics(dt){const melt=on?sm((heat-.3)/.55):sm((heat-.02)/.3),stirred=performance.now()-stirT<2600?sm((heat-.18)/.3):0,mv=Math.max(melt,stirred);
for(const b of BL){const hot=1.18-1.32*sm((b.h-6)/(HT-26)),k=(.04+.22*b.k*(1-sm(b.h/14))+.3*sm((b.h-HT+24)/18))*6/b.r;b.T+=(heat*hot-b.T)*Math.min(1,k*dt);
let vt=(b.T-.55)*b.r*1.35*melt;if(!on)vt=Math.min(vt,-(1.5+b.r/3)*melt);b.vh+=(vt-b.vh)*Math.min(1,dt*1.4);
const drift=(Math.sin(time*.23+b.p)*1.1+Math.sin(time*.117+b.p*2.3)*.7)*melt;b.vx+=(drift-b.vx)*Math.min(1,dt*.9);}
for(let i=0;i<BL.length;i++)for(let j=i+1;j<BL.length;j++){const a=BL[i],c=BL[j],dx=c.x-a.x,dh=c.h-a.h,d=Math.hypot(dx,dh)||.01,m=(a.r+c.r)*.78;
if(d<m){const f=(m-d)/m*9*dt*mv,ux=dx/d,uh=on&&Math.min(a.h,c.h)>14?dh/d*.6:0;a.vx-=ux*f*1.6;c.vx+=ux*f*1.6;a.vh-=uh*f;c.vh+=uh*f;}}
for(const b of BL){b.ph=b.h;b.x+=b.vx*dt*mv;b.h+=b.vh*dt*mv;
const top=HT-b.r*b.sy*.9,rest=b.r*.45-1.5;if(b.h>top){b.h=top;b.vh=Math.min(0,b.vh);}if(b.h<rest){b.h=rest;b.vh=Math.max(0,b.vh);}
const w=Wi(b.h)-b.r*b.sx*.92;if(Math.abs(b.x)>w){b.x=Math.sign(b.x)*Math.max(0,w);b.vx*=-.2;}
const sy=1+.5*Math.min(1,Math.abs(b.vh*mv)/6)-(b.h>=top-.5?.12:0);b.sy+=(sy-b.sy)*Math.min(1,dt*1.6*mv);b.sx=1/Math.sqrt(b.sy);
let tx=-b.vx*mv*.5,th=-b.vh*mv*.8;const l=Math.hypot(tx,th),lm=b.r*1.05;if(l>lm){tx*=lm/l;th*=lm/l;}b.tx+=(tx-b.tx)*Math.min(1,dt*1.8*mv);b.th+=(th-b.th)*Math.min(1,dt*1.8*mv);
if(ac&&b.ph<14&&b.h>=14&&b.vh>1&&performance.now()-bloopT>1500){bloopT=performance.now();tone(170,.32,.012,'sine',0,105);}}}
function renderWax(){const melt=on?sm((heat-.3)/.55):sm((heat-.02)/.3),pa=Math.sin(time*.31)*1.3*melt,pb=Math.sin(time*.23+1.3)*1.1*melt,key=pa.toFixed(2)+pb.toFixed(2)+heat.toFixed(2)+BL.map(b=>[b.x,b.h,b.sy,b.tx,b.th].map(v=>v.toFixed(2)).join(',')).join(';');
if(key===drawn)return;drawn=key;F.fill(0);blob(-4.5+pa,-1.5,9,6+heat,1);blob(5+pb,-1.8,8.5,5.6+heat,1);
for(const b of BL){blob(b.x,b.h,b.r*b.sx,b.r*b.sy,1);blob(b.x+b.tx,b.h+b.th,b.r*.6,b.r*.6,.8);}
for(let i=0;i<F.length;i++)F[i]*=WALL[i];
const d=contour();set(wax,'d',d);set(waxGlow,'d',d);
// A glint on each blob that shows on its own: none deep in the pool, by the glass, or inside a bigger blob.
BL.forEach((b,i)=>{let alone=1;for(const c of BL)if(c!==b&&c.r>=b.r)alone=Math.min(alone,sm((Math.hypot(c.x-b.x,c.h-b.h)/(b.r+c.r)-.5)/.35));
const n=glints[i],cx=b.x-.36*b.r*b.sx,cy=-48-b.h-.44*b.r*b.sy;set(n,'transform',`translate(${f2(cx)} ${f2(cy)}) rotate(-32)`);set(n,'rx',f2(.27*b.r*b.sx));set(n,'ry',f2(.14*b.r*b.sy));
n.style.opacity=f2(alone*sm((b.h-5)/6)*sm((Wi(b.h)-Math.abs(b.x)-b.r*.8)/3));});}
// State, sound and input.
const PAIRS=[['RED IN YELLOW','Red wax in yellow water'],['WHITE IN BLUE','White wax in blue water'],['PINK IN PURPLE','Pink wax in purple water'],['ORANGE IN CLEAR','Orange wax in clear water']];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const say=m=>{announcement.textContent=m;},notice=(m,a)=>{note=m;noteT=performance.now()+1600;say(a);};
let ac=null;
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
function tone(f,d=.15,v=.02,type='sine',when=0,f1=0){const a=ac;if(!a)return;const t=a.currentTime+when,o=a.createOscillator(),gn=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+d);
gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(v,t+.005);gn.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(gn);gn.connect(a.destination);o.start(t);o.stop(t+d+.03);}
const classes=()=>set(svg,'class',`${on?'lit ':''}p${pi}`);
function power(){audio();on=!on;classes();set(rocker,'aria-pressed',on);tone(on?1500:1100,.03,.018,'square');tone(on?150:120,.09,.03,'sine',0,80);
say(on?'On: the bulb lights and warms the wax. In a while it starts to flow.':'Off: the wax cools and settles to the bottom.');
if(reduced.matches){heat=on?1:0;pose=0;place(on?POSES[0]:COLD);}}
function colors(d){audio();pi=(pi+d+PAIRS.length)%PAIRS.length;classes();tone(660,.12,.01,'triangle');tone(880,.14,.009,'triangle',.08);notice(`COLORS · ${PAIRS[pi][0]}`,`${PAIRS[pi][1]}.`);}
function nudge(x=0,h=36){audio();tone(2350,.2,.012);tone(1180,.28,.01,'sine',.005);if(!reduced.matches)wv+=(x>=0?-1:1)*10;
if(heat<.2){notice('COLD WAX · SPACE WARMS IT','The wax is cold and set. Switch the lamp on to warm it.');return;}
stirT=performance.now();say('Nudged: the wax swirls.');
if(reduced.matches){if(on){pose=(pose+1)%POSES.length;place(POSES[pose]);}return;}
BL.forEach((b,i)=>{const dx=b.x-x,dh=b.h-h,d=Math.hypot(dx,dh)||1,f=9*Math.exp(-((d/22)**2)),s=i%2?1:-1;b.vx+=(dx/d)*f-(dh/d)*f*.5*s;b.vh+=(dh/d)*f*.8+(dx/d)*f*.4*s;});}
function local(e){try{const m=svg.getScreenCTM?.();if(!m||e.clientX==null)return[0,36];const q=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());return[q.x,-q.y-48];}catch(_){return[0,36];}}
glassG.addEventListener('click',e=>nudge(...local(e)));
glassG.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)nudge();}});
bind(rocker,power);
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key;
if(k.startsWith('Arrow')){e.preventDefault();if(!e.repeat)colors(k==='ArrowRight'||k==='ArrowUp'?1:-1);return;}
if(e.repeat)return;if(k===' '){e.preventDefault();power();}else if(k==='Enter'){e.preventDefault();nudge();}});
function ui(now){const stirred=now-stirT<2600&&heat>=.2,mood=stirred?'STIRRED':!on?(heat>.1?'SETTLING':'ASLEEP'):heat<.45?'WAKING':heat<.8?'SLUGGISH':'DREAMY';
const r=`${Math.round(21+39*heat)} °C · ${mood}`,st=now<noteT?note:!on?(heat>.1?`COOLING · ${PAIRS[pi][0]}`:'OFF · SPACE TURNS IT ON'):heat<.8?`WARMING UP · ${PAIRS[pi][0]}`:`FLOWING · ${PAIRS[pi][0]}`;
if(r+st!==outKey){outKey=r+st;readout.textContent=r;stateLabel.textContent=st;}}
function tick(t){const dt=Math.min(.05,(t-(last||t))/1000),red=reduced.matches,now=performance.now();last=t;
if(red){heat=on?1:0;wa=0;wv=0;}else{time+=dt;heat=on?heat+(1-heat)*Math.min(1,dt/8):heat-heat*Math.min(1,dt/9);if(on&&heat>.9995)heat=1;if(!on&&heat<.03)heat=0;physics(dt);wv+=(-60*wa-5.5*wv)*dt;wa+=wv*dt;}
const rock=Math.abs(wa)>.002?`rotate(${f2(wa)} 0 -2)`:'';for(const n of ROCK)set(n,'transform',rock);
renderWax();ui(now);requestAnimationFrame(tick);}
place(POSES[0]);classes();renderWax();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
