// @ts-nocheck
/* CIRREL Q–31 · Hot air balloon. Its stylesheet, defs and script, drawn on the engine in the figures' house style (the
 * kit's projection and helpers, the shared palette, stage and filters). The script runs on the env, which stands in for
 * the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--recess:#9d9d99;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--g1:#d65a40;--g2:#f4ede0;--crown:#33506b;--skirt:#3b3a38;--wicker:#c99a5c;--wicker-top:#ddb67c;--wicker-side:#a87b44;--weave:#7a5426;--inner:#6e5032;--hide:#74503a;--hide-top:#8d6548;--hide-side:#573a28;--grass:#a7bd8c;--grass-top:#c3d4aa;--grass-side:#8ba071;--mow:#d3e0bd;--canvas:#d8c9a8;--canvas-side:#bcab89;--rope:#a48a62;--sock:#e8743a;--cloud:#fff;--cloud-lo:#dfe5ea;--cloud-a:.95;--glow:#ffb347;--fl0:#fffbe8;--fl1:#ffd76e;--fl2:#ff9b3d;--fl3:#ff5f1f;--pilot:#4f9dff;--hi:.42;--lo:.26;--lit:.34}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--recess:#6e6e6c;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--g1:#b44b34;--g2:#ccc8c0;--crown:#294259;--skirt:#302f2e;--wicker:#a9814c;--wicker-top:#cfaa74;--wicker-side:#76552d;--weave:#4f3517;--inner:#45311e;--hide:#61422f;--hide-top:#845e43;--hide-side:#3b2619;--grass:#626f52;--grass-top:#7f8b6f;--grass-side:#444e37;--mow:#899678;--canvas:#b6a98d;--canvas-side:#84785f;--rope:#8a7555;--sock:#c3612f;--cloud:#c6c9cd;--cloud-lo:#80848a;--cloud-a:.2;--hi:.3;--lo:.4;--lit:.62;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.wicker{fill:var(--wicker)}.top.wicker{fill:var(--wicker-top)}.side.wicker{fill:var(--wicker-side)}.hide{fill:var(--hide)}.top.hide{fill:var(--hide-top)}.side.hide{fill:var(--hide-side)}.grass{fill:var(--grass)}.top.grass{fill:var(--grass-top)}.side.grass{fill:var(--grass-side)}.canvas{fill:var(--canvas)}.side.canvas{fill:var(--canvas-side)}.inner{fill:var(--inner)}.skirt{fill:var(--skirt)}.crown{fill:var(--crown)}
.weave{fill:url(#weave);stroke:none}.mow{fill:none;stroke:var(--mow);stroke-width:1.1;stroke-dasharray:5 2.5}.brand{fill:var(--canvas);font:600 1.7px Georgia,'Times New Roman',serif;letter-spacing:.25px;text-anchor:middle;stroke:none}
.g1{fill:var(--g1);stroke:none}.g2{fill:var(--g2);stroke:none}.seam{fill:none;stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke;opacity:.3}.belt{fill:var(--crown);stroke:none}.outline{fill:none;stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.shade{fill:url(#envShade);stroke:none}.sheen{fill:#fff;stroke:none;filter:url(#bloom);opacity:var(--hi)}.envlit{fill:url(#envGlow);stroke:none;opacity:0}.skirtlit{fill:var(--glow);stroke:none;opacity:0}
.su{fill:none;stroke:var(--line);stroke-linecap:round}.pole{fill:none;stroke:var(--hide);stroke-linecap:round}.cable{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;stroke-linecap:round}.hose{fill:none;stroke:var(--skirt);stroke-width:.9;stroke-linecap:round}.rope{fill:none;stroke:var(--rope);stroke-width:.8;stroke-linecap:round}.tie{fill:none;stroke:var(--rope);stroke-width:.4}
.fo{fill:url(#flameO);filter:url(#glow)}.fi{fill:url(#flameI)}.fc{fill:url(#flameC)}.fhalo{fill:var(--glow);filter:url(#bloom)}.pilot{fill:var(--pilot);filter:url(#glow)}.fo,.fi,.fc,.fhalo,.pilot,.envlit,.skirtlit,.sheen{pointer-events:none}
.cloud{fill:url(#cloudG);stroke:none;pointer-events:none}.sock{fill:var(--sock)}.sockw{fill:var(--g2)}
.control{cursor:pointer;outline:none;touch-action:none}.hit{fill:transparent;stroke:none}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="envShade" cx=".4" cy=".36" r=".72" fx=".3" fy=".24"><stop offset="0" style="stop-color:#fff;stop-opacity:var(--hi)"/><stop offset=".38" style="stop-color:#fff;stop-opacity:0"/><stop offset=".7" style="stop-color:#000;stop-opacity:.04"/><stop offset="1" style="stop-color:#000;stop-opacity:var(--lo)"/></radialGradient>
<radialGradient id="envGlow" cx=".5" cy=".98" r=".95"><stop offset="0" style="stop-color:var(--fl1)"/><stop offset=".35" style="stop-color:var(--glow);stop-opacity:.7"/><stop offset=".75" style="stop-color:var(--glow);stop-opacity:.16"/><stop offset="1" style="stop-color:var(--glow);stop-opacity:0"/></radialGradient>
<linearGradient id="flameO" x2="0" y2="1"><stop offset="0" style="stop-color:var(--fl3);stop-opacity:0"/><stop offset=".45" style="stop-color:var(--fl2);stop-opacity:.92"/><stop offset="1" style="stop-color:var(--fl1)"/></linearGradient>
<linearGradient id="flameI" x2="0" y2="1"><stop offset="0" style="stop-color:var(--fl2);stop-opacity:0"/><stop offset=".5" style="stop-color:var(--fl1)"/><stop offset="1" style="stop-color:var(--fl0)"/></linearGradient>
<linearGradient id="flameC" x2="0" y2="1"><stop offset="0" style="stop-color:var(--fl0);stop-opacity:0"/><stop offset=".6" style="stop-color:#fff"/><stop offset="1" style="stop-color:var(--pilot)"/></linearGradient>
<linearGradient id="cloudG" x2="0" y2="1"><stop offset=".25" style="stop-color:var(--cloud)"/><stop offset="1" style="stop-color:var(--cloud-lo)"/></linearGradient>
<pattern id="weave" width="2.4" height="1.6" patternUnits="userSpaceOnUse"><path d="M0,.8H2.4M.6,0V.8M1.8,.8V1.6" style="fill:none;stroke:var(--weave);stroke-width:.32;opacity:.5"/></pattern>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,addEventListener,kit}=env;
/* CIRREL Q–31. World: x lower-right, y lower-left (front faces look along +y), z up; 1 unit ≈ 15 cm. The balloon is drawn
once about its own axis and flown by one transform: drift u along (1, −1, 0), altitude h, and a pendulum sway about the
envelope's centre of lift (z 100), so its parts never redraw. In a wind the tethers hold the basket back and the
envelope leans downwind.
Part                          x      y      z      w      d      h
landing patch (turf)        r 26 around (0, 0)    0      –      –      2   mown ring; tether stakes at (−17, 9) and (9, −17)
windsock pole                −10     22      2   r .6      –     20   sock 10 long, it hangs or streams with the wind
balloon (on its own axis, basket floor at the patch top + h; h 0…40, u −12…12):
basket (wicker)               −8     −8      0     16     16     12   leather skid and padded rim to 13.8, sandbags, brand plate
flexi poles ×4      basket corners (±6.4, ±6.4, 13.8) to the burner frame (±4.6, ±4.6, 26)
burner ×2           (2, −2) and (−2, 2), r 2.2, z 20.5…25.5, coils, pilot lights; the flame rises from z 25.5
load cables ×8      skirt rim r 10.2 at z 43, to the frame corners
skirt (scoop)                r 10.2 → 11.2            43      –      –    7.5
envelope            mouth r 11 at z 50, equator r 36 at z 104 (sine flare), dome to the crown at z 144; 16 gores,
                    a belt at z 62…66, the parachute valve r 7 at the crown
clouds              two behind, one beside, one in front; they drift with the wind
The tethers pull it back over the patch as it comes down, so it always lands on the turf.
Painter: back clouds, floor, patch, the balloon's shadow, tethers, the balloon (back cables, basket, back poles, burner,
flame, front poles and cables, skirt, glow, envelope), windsock, front cloud. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{P,set,el,group,rect,circle,line,text,box,cylinder,TOP,FRONT,SIDE}=kit(()=>root);
// Figure helpers: polar points, smooth curves through projected points, surfaces of revolution, cached writes.
const draw=root,into=g=>root=g,RAD=Math.PI/180,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const at=(r,a,z,cx=0,cy=0)=>[cx+r*Math.cos(a*RAD),cy+r*Math.sin(a*RAD),z],fx=p=>f2(p[0])+','+f2(p[1]),Q=(...p)=>fx(P(...p));
const arc=(r,a1,z,sw,cx=0,cy=0)=>`A${f2(r*1.2247)},${f2(r*.7071)} 0 0 ${sw} ${Q(...at(r,a1,z,cx,cy))}`;
const frust=(z0,r0,z1,r1,cls,a0=-45,a1=135)=>el('path',{d:`M${Q(...at(r0,a0,z0))}${arc(r0,a1,z0,1)}L${Q(...at(r1,a1,z1))}${arc(r1,a0,z1,0)}Z`,class:cls});
const cr=pts=>{let d='';for(let i=0;i<pts.length-1;i++){const p0=pts[i-1]||pts[i],p1=pts[i],p2=pts[i+1],p3=pts[i+2]||p2;d+=`C${fx([p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6])} ${fx([p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6])} ${fx(p2)}`;}return d;};
const loop=pts=>{const n=pts.length;let d=`M${fx(pts[0])}`;for(let i=0;i<n;i++){const p0=pts[(i+n-1)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];d+=`C${fx([p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6])} ${fx([p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6])} ${fx(p2)}`;}return d+'Z';};
const put=(n,k,v)=>{const c=n._a||(n._a={});if(c[k]!==v){c[k]=v;set(n,k,v);}},op=(n,v)=>{v=f2(v);if(n._o!==v){n._o=v;n.style.opacity=v;}},vis=(n,on)=>{const d=on?'':'none';if(n._d!==d){n._d=d;n.style.display=d;}};
function sk(d,w,cls){el('path',{d,class:'su','stroke-width':f2(w+.7)});return el('path',{d,class:cls,'stroke-width':w});}
// The envelope's profile: a sine flare from the mouth to the equator, an elliptic dome to the crown.
const ZM=50,RM=11,ZE=104,R=36,ZT=144,HD=ZT-ZE,lowR=t=>RM+(R-RM)*Math.sin(t*Math.PI/2);
const PROF=[];for(let i=0;i<=28;i++){const t=i/28;PROF.push({z:ZM+t*(ZE-ZM),r:lowR(t),rp:(R-RM)*Math.PI/2*Math.cos(t*Math.PI/2)/(ZE-ZM)});}
for(let j=1;j<=28;j++){const b=j/28*Math.PI/2;PROF.push({z:ZE+HD*Math.sin(b),r:j<28?R*Math.cos(b):0,rp:j<28?-R*Math.sin(b)/(HD*Math.cos(b)):-1e9});}
// A surface point by its angle d from the front meridian (45°); what of a ring the eye sees: cos d > r′/√2.
const SP=(r,d,z)=>P(...at(r,45+d,z)),seen=rp=>{const c=rp/Math.SQRT2;return c<=-1?180:c>=1?-1:Math.acos(c)/RAD;};
// The silhouette: for each direction on the page, the farthest point of all the rings (the envelope is convex).
const SIL=(()=>{const rings=[];for(let i=0;i<=240;i++){const t=i/240;rings.push(t<.5?{z:ZM+2*t*(ZE-ZM),r:lowR(2*t)}:{z:ZE+HD*Math.sin((2*t-1)*Math.PI/2),r:R*Math.cos((2*t-1)*Math.PI/2)});}
return Array.from({length:120},(_,k)=>{const th=k/120*Math.PI*2,c=Math.cos(th),s=Math.sin(th);let best=-1e9,pt=null;for(const g of rings){const A=g.r*1.2247,B=g.r*.7071,q=Math.hypot(A*c,B*s)||1e-9,h=-g.z*s+q;if(h>best){best=h;pt=[A*A*c/q,-g.z+B*B*s/q];}}return pt;});})();
const silD=loop(SIL);
function gore(d0,d1){const L=[],Rr=[];let first=-1;PROF.forEach((p,i)=>{const f=Math.min(180,seen(p.rp)+3),lo=Math.max(d0,-f),hi=Math.min(d1,f);if(lo<hi||p.r===0){if(first<0)first=i;L.push(SP(p.r,lo,p.z));Rr.push(SP(p.r,hi,p.z));}});
if(L.length<2)return'';const bot=[];if(first===0){const f=seen(PROF[0].rp)+3,lo=Math.max(d0,-f),hi=Math.min(d1,f);for(let k=1;k<4;k++)bot.push(SP(RM,hi-(hi-lo)*k/4,ZM));}
Rr.reverse();return`M${fx(L[0])}${cr(L)}L${fx(Rr[0])}${cr(Rr)}${bot.map(p=>'L'+fx(p)).join('')}Z`;}
const meridian=d=>{const pts=PROF.filter(p=>seen(p.rp)>Math.abs(d)||p.r===0).map(p=>SP(p.r,d,p.z));return pts.length>1?`M${fx(pts[0])}${cr(pts)}`:'';};
const ringAt=z=>{const p=PROF.reduce((a,b)=>Math.abs(b.z-z)<Math.abs(a.z-z)?b:a),f=Math.min(179,seen(p.rp));return{pts:Array.from({length:25},(_,i)=>SP(p.r,-f+2*f*i/24,p.z))};};
function belt(z0,z1){const a=ringAt(z0),b=ringAt(z1);return`M${fx(a.pts[0])}${cr(a.pts)}L${fx(b.pts[24])}${cr(b.pts.slice().reverse())}Z`;}
// The floor, the turf patch, its mown ring, the tether stakes.
const dfs=svg.querySelector('defs'),reduced=matchMedia('(prefers-reduced-motion: reduce)'),dark=matchMedia('(prefers-color-scheme: dark)');
const VB=[-72,-202,144,234];set(svg,'viewBox',VB.join(' '));
const CLOUDS=[[-44,-142,1.5,.35,0],[50,-104,1.1,.55,0],[-58,-66,.75,.75,0],[46,-30,.95,1,1]].map(([x,y,k,v,front])=>({x,y,k,v,front}));
const cloudD='M-14,0A5.6,5.6 0 0 1 -9.4,-5.8A7.6,7.6 0 0 1 1.6,-9.6A6.4,6.4 0 0 1 10.6,-5A4.8,4.8 0 0 1 14,0Z';
const cloud=c=>{c.n=el('path',{d:cloudD,class:'cloud'});return c;};CLOUDS.filter(c=>!c.front).forEach(cloud);
const s0=P(0,0,0);for(const c of['shadow stage-floor','stage-contact'])el('ellipse',{cx:f2(s0[0]),cy:f2(s0[1]+3),rx:40,ry:21,class:c});
cylinder(0,0,0,26,2,'z','grass');{const t=group(TOP(0,0,2));circle(t,0,0,19.5,'mow');circle(t,0,0,12,'mow').style.opacity=.6;}
const bShadow=el('ellipse',{class:'shadow',rx:24,ry:13});
const STAKES=[[-17,9],[9,-17]];for(const[x,y]of STAKES)cylinder(x,y,2,.8,2.4,'z','hide');
const ropes=STAKES.map(()=>el('path',{class:'rope'}));
// The balloon, drawn once on its own axis. Its sway pivot is the envelope's centre of lift.
const BAL=el('g',{}),PIV=P(0,0,100);into(BAL);
const cables=[...Array(8)].map((_,k)=>{const a=k*45,c=at(4.6*Math.SQRT2,45+90*Math.round((a-45)/90+.001),26);return{a,top:at(10.2,a,43),c,dep:Math.cos(a*RAD)+Math.sin(a*RAD)};});
const cable=c=>el('path',{d:`M${Q(...c.top)}L${Q(...c.c)}`,class:'cable'});
cables.filter(c=>c.dep<-.01).forEach(cable);
// Basket: wicker with a leather skid, a padded rim, its dark inside; sandbags and the brand plate on its front.
box(-8,-8,0,16,16,12,1.6,'wicker');
for(const g of[group(FRONT(-8,8,12)),group(SIDE(8,8,12))]){rect(g,0,0,16,12,1.4,'weave');rect(g,0,10.4,16,1.6,.6,'face hide');for(const u of[.8,15.2])line(g,u,1,u,10.4);}
box(-8.6,-8.6,12,17.2,17.2,1.8,.9,'hide');{const t=group(TOP(-8.6,-8.6,13.8));rect(t,1.4,1.4,14.4,14.4,.7,'face inner');}
const bag=(g,u,cls)=>{line(g,u,0,u,2.4,'tie');el('path',{d:`M${u-.45},2.3C${u-2.1},3 ${u-2},6.5 ${u},6.6C${u+2},6.5 ${u+2.1},3 ${u+.45},2.3Z`,class:'face '+cls},g);line(g,u-.7,2.75,u+.7,2.75,'tie');};
{const f=group(FRONT(-8,8,12));for(const u of[2.6,13.4])bag(f,u,'canvas');rect(f,4.3,3.6,7.4,2.8,.5,'face hide');text(f,8,5.6,'CIRREL','brand');}
bag(group(SIDE(8,8,12)),8,'side canvas');
// Flexi poles and the burner frame; the two burners with their coils and pilot lights; hoses to the rim.
const PO=[[-1,-1],[1,-1],[-1,1],[1,1]].map(([i,j])=>({d:`M${Q(6.4*i,6.4*j,13.8)}L${Q(4.6*i,4.6*j,26)}`,dep:i+j}));
for(const p of PO.filter(p=>p.dep<0))sk(p.d,1,'pole');
for(const[a,b]of[[[-4.6,-4.6],[4.6,-4.6]],[[-4.6,-4.6],[-4.6,4.6]]])sk(`M${Q(...a,26)}L${Q(...b,26)}`,.7,'pole');
for(const[x,y]of[[2,-2],[-2,2]]){el('path',{d:`M${Q(x,y,20.5)}Q${Q(x*2.2,y*2.2,16)} ${Q(x*3.1,y*3.1,13.8)}`,class:'hose'});}
const PL=[];for(const[x,y]of[[2,-2],[-2,2]]){const b=cylinder(x,y,20.5,2.2,5,'z','metal');for(const z of[21.8,23,24.2])el('path',{d:`M${Q(...at(2.2,-45,z,x,y))}${arc(2.2,135,z,1,x,y)}`,class:'detail'},b.g);circle(b.face,0,0,1.2,'face recess');PL.push(P(x,y,25.6));}
for(const p of PL)el('ellipse',{cx:f2(p[0]),cy:f2(p[1]-.7),rx:.45,ry:.8,class:'pilot'});
// The flame: three tongues rising from between the burners into the mouth, cut there by the skirt and envelope.
const F0=P(0,0,25.5),flameG=group(`translate(${f2(F0[0])} ${f2(F0[1])})`),fHalo=el('ellipse',{cx:0,cy:-10,rx:12,ry:16,class:'fhalo',style:'opacity:0'},flameG);
const fO=el('path',{class:'fo'},flameG),fI=el('path',{class:'fi'},flameG),fC=el('path',{class:'fc'},flameG);
const tongue=(w,L)=>`M${f2(-w)},0C${f2(-w*1.25)},${f2(-L*.3)} ${f2(-w*.7)},${f2(-L*.65)} 0,${f2(-L)}C${f2(w*.7)},${f2(-L*.65)} ${f2(w*1.25)},${f2(-L*.3)} ${f2(w)},0C${f2(w*.5)},${f2(L*.06)} ${f2(-w*.5)},${f2(L*.06)} ${f2(-w)},0Z`;
for(const p of PO.filter(p=>p.dep>=0))sk(p.d,1,'pole');
for(const[a,b]of[[[4.6,-4.6],[4.6,4.6]],[[-4.6,4.6],[4.6,4.6]]])sk(`M${Q(...a,26)}L${Q(...b,26)}`,.7,'pole');
cables.filter(c=>c.dep>=-.01).forEach(cable);
// Skirt and envelope: gores clipped to the silhouette, seams, the belt, light and the burner's glow, the crown valve.
frust(43,10.2,50.5,11.2,'face skirt');const skirtLit=frust(43,10.2,50.5,11.2,'skirtlit');
el('path',{d:silD},el('clipPath',{id:'envClip'},dfs));
const ENV=el('g',{'clip-path':'url(#envClip)'});into(ENV);
el('path',{d:silD,class:'g2'});for(let k=0;k<16;k++)if(k%2===0)el('path',{d:gore(-180+k*22.5,-157.5+k*22.5),class:'g1'});
el('path',{d:belt(62,66),class:'belt'});
for(let k=0;k<16;k++){const d=meridian(-180+k*22.5);if(d)el('path',{d,class:'seam'});}for(const z of[80,92,118,130]){const q=ringAt(z).pts;el('path',{d:`M${fx(q[0])}${cr(q)}`,class:'seam'});}
el('path',{d:silD,class:'shade'});{const c=P(...at(14,200,118));el('ellipse',{cx:f2(c[0]),cy:f2(c[1]),rx:10,ry:15,class:'sheen',transform:`rotate(28 ${f2(c[0])} ${f2(c[1])})`});}
const envLit=el('path',{d:silD,class:'envlit'});
into(BAL);el('path',{d:silD,class:'outline'});
const crownZ=ZE+HD*Math.sin(Math.acos(7/R)),crownG=el('g',{});{const g=group(TOP(0,0,crownZ),crownG);circle(g,0,0,7,'face crown');circle(g,0,0,4.6,'detail');}
// The hit area: press and hold the balloon to fire the burner.
const hit=el('g',{class:'control'});el('path',{d:silD,class:'hit'},hit);rect(hit,-16,-48,32,58,4,'hit');
into(draw);
// The windsock and the front cloud.
cylinder(-10,22,2,.6,20,'z','metal');const ws=P(-10,22,21.4),sockG=group('',draw),sock=group('',sockG);
{const segs=[[0,1.6,2.5,1.45,'sock'],[2.5,1.45,5,1.25,'sockw'],[5,1.25,7.5,1.05,'sock'],[7.5,1.05,10,.85,'sockw']];for(const[x0,r0,x1,r1,c]of segs)el('path',{d:`M${x0},${-r0}L${x1},${-r1}A.4,${r1} 0 0 1 ${x1},${r1}L${x0},${r0}Z`,class:'face '+c},sock);el('ellipse',{cx:0,cy:0,rx:.5,ry:1.6,class:'face metal'},sock);}
CLOUDS.filter(c=>c.front).forEach(cloud);
// State: the burner, heat and lift, the wind and drift, the sway; progress. Left alone, the pilot holds a hover, and takes
// off again a while after it has been brought down.
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),say=m=>{announcement.textContent=m;};
const HMAX=40,CRU=20,DRIFT=12,TN=95,TA=15,TMAX=120,STEP=HMAX/4,ALT=h=>Math.round(h*1.5);
let h=CRU,v=0,T=TN,u=0,uv=0,w=0,th=0,thv=0,flame=0,glow=0,keyHeld=false,ptrHeld=false,burstUntil=0,pilotUntil=0,touched=-1e9,ventUntil=0,auto=true,landedAt=0,windHeld=0,windT=0,lastStep=0,lastBurnEnd=-1e9,wasBurning=false,mode='own',target=0,fin=0,indT=.8,note='',noteT=0,lastUI=-1,lt=0,now=0,ac=null,roar=null;
const CS={t:-1e9,lit:.34,ca:.9},vb=VB,rest=(px,py)=>{const c=Math.cos(th*RAD),s=Math.sin(th*RAD),dx=px-PIV[0],dy=py-PIV[1],o=P(u,-u,2+h);return[o[0]+PIV[0]+dx*c-dy*s,o[1]+PIV[1]+dx*s+dy*c];};
const ROPE=STAKES.map(([x,y],i)=>{const a=P(x,y,4.4),b=i?P(8,-8,2):P(-8,8,2),hi=[b[0]-a[0],b[1]-HMAX-2-a[1]];return{a,b,L:Math.hypot(...hi)*1.02};});
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac)ac=new A();if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,vol,d,wait=0,type='sine'){if(!ac)return;try{const t=ac.currentTime+wait,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.05);}catch(_){}}
function roarTo(vol){if(!ac)return;try{if(!roar){const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;const s=ac.createBufferSource(),f=ac.createBiquadFilter();s.buffer=b;s.loop=true;f.type='bandpass';f.frequency.value=520;f.Q.value=.7;roar=ac.createGain();roar.gain.value=0;s.connect(f);f.connect(roar);roar.connect(ac.destination);s.start();}roar.gain.setTargetAtTime(vol,ac.currentTime,.06);}catch(_){}}
const lean=()=>3*w*clamp(h/14),userBurn=()=>keyHeld||ptrHeld||now<burstUntil,landed=()=>h<=.01,pilotOn=()=>mode!=='own'||fin>0||auto;
function take(){touched=now;auto=false;if(mode!=='own'||fin){mode='own';fin=0;}}
function burnOn(src){audio();const was=userBurn();if(src==='key')keyHeld=true;else ptrHeld=true;take();burstUntil=now+700;if(!was){tone(92,.025,.18,0,'triangle');if(landed())say('Burner on. The balloon lifts off.');else say('Burner on.');}lastUI=-1;}
function burnOff(src){if(src==='key')keyHeld=false;else ptrHeld=false;lastUI=-1;}
function windStep(dir){audio();w=clamp(Math.round((w+dir/3)*3)/3,-1,1);windHeld=dir;windT=now;note=windText();noteT=now+1600;say(w?`Wind ${Math.round(Math.abs(w)*12)} knots from the ${w>0?'west':'east'}.`:'Calm.');lastUI=-1;}
const windText=()=>Math.abs(w)<.04?'WIND CALM':`WIND ${Math.round(Math.abs(w)*12)} KT ${w>0?'E':'W'}`;
function vent(){audio();take();if(landed()){say('On the ground: the vent stays shut.');return;}ventUntil=now+1600;keyHeld=ptrHeld=false;burstUntil=0;tone(300,.008,.4,0,'sawtooth');if(reduced.matches)stepDown();say('Vent open: hot air spills from the crown and the balloon sinks.');lastUI=-1;}
function stepDown(){h=Math.max(0,Math.round(h/STEP)*STEP-STEP);lastStep=now;if(!h)landedAt=now;}
function setProgress(p){fin=0;if(p==null||!isFinite(p))mode='ind';else{mode='det';target=clamp(+p);}lastUI=-1;}
function finish(){audio();if(fin)return;fin=1;say('Finishing: the balloon climbs to the top of its tether.');lastUI=-1;}
function stepKey(){audio();setProgress(mode==='det'&&!fin?(target>=1?0:Math.min(1,Math.floor(target*4+1e-6)/4+.25)):.25);say(`Progress ${Math.round(target*100)} percent.`);}
window.figure={setProgress,done:finish};
const KEYS={' ':()=>burnOn('key'),ArrowLeft:()=>windStep(-1),ArrowRight:()=>windStep(1),ArrowDown:vent,p:stepKey,Enter:finish};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.length===1&&e.key!==' '?e.key.toLowerCase():e.key,fn=KEYS[k];if(!fn)return;e.preventDefault();if(!e.repeat)fn();});
document.addEventListener('keyup',e=>{if(e.key===' ')burnOff('key');else if(e.key==='ArrowLeft'||e.key==='ArrowRight')windHeld=0;});
addEventListener('blur',()=>{keyHeld=ptrHeld=false;windHeld=0;});
hit.addEventListener('pointerdown',e=>{e.preventDefault();burnOn('ptr');try{hit.setPointerCapture(e.pointerId);}catch(_){}});
for(const t of['pointerup','pointercancel','lostpointercapture'])hit.addEventListener(t,()=>{if(ptrHeld)burnOff('ptr');});
function ui(){const m=ALT(h),pc=Math.round(target*100),burning=userBurn(),top=h>=HMAX-.5;
readout.textContent=fin||mode==='det'?`PROGRESS ${fin?100:pc}% · ALT ${m} M`:`ALT ${m} M · ENV ${Math.round(T)}°C · ${windText()}`;
stateLabel.textContent=now<noteT?note:fin===2?'COMPLETE · AT THE TOP OF THE TETHER':fin?'FINISHING · CLIMBING TO THE TOP':mode==='det'?(Math.abs(h-target*HMAX)<1?`HOLDING AT ${pc}%`:h<target*HMAX?`CLIMBING TO ${pc}%`:`DESCENDING TO ${pc}%`):mode==='ind'?'INDETERMINATE · CRUISING':now<ventUntil?'VENT OPEN · SINKING':burning?(top?'BURNER ON · TETHER TAUT':'BURNER ON · CLIMBING'):landed()?'LANDED · HOLD SPACE TO FIRE':pilotOn()?'HOVERING · HOLD SPACE TO FIRE':top&&T>=TN?'COOLING · TETHER TAUT':v>.15?'COOLING · STILL CLIMBING':v<-.15||reduced.matches?'COOLING · SINKING SLOWLY':'COOLING · FLOATING';
lastUI=now;}
function tick(t){const dt=Math.min(.05,Math.max(0,(t-(lt||t))/1000)),red=reduced.matches;lt=now=t;
if(!auto&&landed()&&now-landedAt>8000&&now-touched>8000){auto=true;say('The pilot takes off again and holds a hover.');}
const h0=h,user=userBurn(),pilot=pilotOn()&&!user;if(fin===1&&h>=HMAX-.3){fin=2;tone(784,.014,.9);tone(1175,.01,.9,.14);tone(1568,.008,1.2,.28);say('Complete. The balloon flies at the top of its tether.');}
if(mode==='ind'&&Math.abs(h-indT*HMAX)<1.5)indT=indT>.5?.25:.8;
const ht=fin?HMAX:mode==='det'?target*HMAX:mode==='ind'?indT*HMAX:CRU;let burn=user;
if(red){
// Reduced motion: no travel. The balloon jumps a quarter of the tether per burn, steps down as it cools, holds when piloted.
if(pilot){h=mode==='ind'&&!fin?CRU:ht;v=0;T=TN;}
else{if(user&&(!wasBurning||now-lastStep>=800)){h=Math.min(HMAX,Math.round(h/STEP)*STEP+STEP);lastStep=now;}
if(!user&&h>0&&now-lastStep>=3000&&now-lastBurnEnd>=3000)stepDown();}
u=w*DRIFT*clamp(h/14);uv=0;th=lean();thv=0;
}else{
// The pilot's burns: short bursts whenever the envelope runs cooler than the climb it wants.
if(pilot){const vd=fin?6:clamp((ht-h)*.35,-2.2,4.5),td=TN+vd/.3;if(T<td-2&&now>=pilotUntil)pilotUntil=now+500+Math.min(900,(td-T)*40);burn=now<pilotUntil;}
const va=clamp((T-TN)*.3,-3,6);v+=(va-v)*(1-Math.exp(-dt/.9));if(v<0)v=Math.max(v,-Math.min(2.5,.6+h*.2));
h+=v*dt;if(h<=0){if(v<-.4){thv+=v*1.2;tone(70,.03,.25);}h=0;v=Math.max(0,v);}if(h>=HMAX){h=HMAX;v=Math.min(0,v);}
if(windHeld&&now-windT>300)w=clamp(w+windHeld*.7*dt,-1,1);
const ut=landed()?u:w*DRIFT*clamp(h/14),ua=(ut-u)*.7-uv*1.7;uv+=ua*dt;u=clamp(u+uv*dt,-DRIFT,DRIFT);
const ta=-((2*Math.PI/3.4)**2)*(th-lean())-1.1*thv-ua*2.6+Math.sin(t/1300)*.35+(burn?Math.sin(t/90)*.6:0);thv+=ta*dt;th=clamp(th+thv*dt,-6,6);
}
if(h0>0&&h<=0)landedAt=now;
// Heat: the burner adds it, the air takes it, the vent spills it.
T+=((burn?16:0)-.05*(T-TA)-(now<ventUntil?20:0))*dt;T=clamp(T,TA,TMAX);if(red&&pilot)T=TN;
if(wasBurning&&!user)lastBurnEnd=now;wasBurning=user;
flame=red?(burn?1:0):burn?Math.min(1,flame+dt*9):Math.max(0,flame-dt*7);glow=red?flame:glow+(flame-glow)*clamp(dt*5);
paint(t,dt,red);if(ac)roarTo(burn?.045:0);
if(lastUI<0||t-lastUI>120)ui();
requestAnimationFrame(tick);}
// Fly it: one transform for the balloon, the ropes and shadow follow, the flame flickers, the envelope glows.
function paint(t,dt,red){
const o=P(u,-u,2+h);put(BAL,'transform',`translate(${f2(o[0])} ${f2(o[1])}) rotate(${f2(th)} ${f2(PIV[0])} ${f2(PIV[1])})`);
const sp=P(u,-u,2),k=1-h/HMAX*.45;put(bShadow,'cx',f2(sp[0]));put(bShadow,'cy',f2(sp[1]+1));put(bShadow,'rx',f2(22*k));put(bShadow,'ry',f2(12*k));op(bShadow,.1*(1-h/HMAX*.55));
ROPE.forEach((r,i)=>{const b=rest(...r.b),dx=b[0]-r.a[0],dy=b[1]-r.a[1],d=Math.hypot(dx,dy),sag=d<r.L?Math.sqrt(r.L*r.L-d*d)*.55:0,cx=(r.a[0]+b[0])/2,cy=Math.min((r.a[1]+b[1])/2+sag,Math.max(r.a[1],b[1])+5);put(ropes[i],'d',`M${fx(r.a)}Q${f2(cx)},${f2(cy)} ${fx(b)}`);});
if(flame>.01){const fl=red?0:Math.sin(t/37)*.07+Math.sin(t/13+1)*.05+(Math.random()-.5)*.06,L=(14+12*flame)*(1+fl),W=2.6*(.7+.3*flame)*(1+fl*.5);
put(fO,'d',tongue(W,L));put(fI,'d',tongue(W*.66,L*.74));put(fC,'d',tongue(W*.36,L*.42));op(fHalo,flame*(dark.matches?.7:.45));vis(flameG,1);}else vis(flameG,0);
if(t-CS.t>500){const s=getComputedStyle(svg);CS.t=t;CS.lit=+s.getPropertyValue('--lit')||.34;CS.ca=+s.getPropertyValue('--cloud-a')||.9;}op(envLit,glow*CS.lit*(1+(red?0:Math.sin(t/60)*.04)));op(skirtLit,glow*.45);
put(crownG,'transform',now<ventUntil?'translate(0 -2.6)':'');
const sa=Math.abs(w),sd=w<0?-1:1,ang=(1-sa)*72+6+(red?0:Math.sin(t/(170-sa*90))*(1+sa*3));put(sockG,'transform',`translate(${f2(ws[0])} ${f2(ws[1])}) scale(${sd} 1)`);put(sock,'transform',`rotate(${f2(ang)})`);
for(const c of CLOUDS){if(!red){c.x+=(1.2+4.5*w)*c.v*dt;const span=vb[2]+60;if(c.x>vb[0]+vb[2]+30)c.x-=span;if(c.x<vb[0]-30)c.x+=span;}const e=clamp((c.x-vb[0]+30)/26)*clamp((vb[0]+vb[2]+30-c.x)/26);put(c.n,'transform',`translate(${f2(c.x)} ${f2(c.y)}) scale(${c.k})`);op(c.n,e*CS.ca*(c.front?.9:.8+.2*c.v));}}
paint(0,0,reduced.matches);ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
