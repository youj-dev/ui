// @ts-nocheck
/* HUSHFALL G–10 · Snow globe. Drawn for this project in the lab files' form: a stylesheet, its defs and a script that
 * draws the object on the kit and runs it. The script runs on the env, which stands in for the page; its types are at
 * the boundary (FigureModule). The music box plays an original waltz written for it. */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--wood:#8e5f3b;--wood-top:#b07d52;--wood-side:#6a4228;--wood-hi:#c39168;--brass:#cfa95d;--brass-top:#e8c985;--brass-side:#ab8743;--air:#cbd8e2;--air-hi:#e2eaf0;--air-edge:#afc0cd;--rim:#93abbb;--refl:.62;--snow:#fbfcfc;--snow-mid:#edf1f4;--snow-side:#d3dde4;--snow-shade:#bfccd6;--pine:#3f6e52;--pine-side:#2d5541;--trunk:#6e4b33;--log:#b04a3a;--log-side:#8e3a2e;--trim:#f1ece3;--door:#5b3b2b;--stone:#8a7b72;--stone-side:#6f625b;--fascia:#4a3326;--win:#f3d48d;--glowc:#ffbe55;--iron:#2f2f2e;--iron-top:#4a4a48;--ice:#cfe2ea;--coat:#2f4f86;--red:#cf4a3b;--skin:#f1d3bb;--wreath:#2f6a45;--flake:#fff;--flake-line:#a5b5c1}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--line:#444443;--wood:#774f30;--wood-top:#a4754c;--wood-side:#492c19;--wood-hi:#94694a;--brass:#ae8e4d;--brass-top:#d9bc7c;--brass-side:#785e2d;--air:#232b38;--air-hi:#2e394a;--air-edge:#141921;--rim:#6d8291;--refl:.24;--snow:#dfe5ea;--snow-mid:#c9d2da;--snow-side:#a5b0ba;--snow-shade:#8d99a5;--pine:#345c44;--pine-side:#1d3a2b;--trunk:#5c3e29;--log:#943d2f;--log-side:#63261d;--trim:#cac7c1;--door:#4b3023;--stone:#73675f;--stone-side:#494441;--fascia:#3d291e;--win:#ffcf6a;--glowc:#ffb547;--iron:#262625;--iron-top:#454543;--ice:#8fa9ba;--coat:#264170;--red:#ae3d30;--skin:#cbb29d;--wreath:#285a3b;--flake:#f6f9fc;--flake-line:#f6f9fc00}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.control{cursor:grab;outline:none;touch-action:none}.control.key{cursor:pointer}.control.held{cursor:grabbing}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
.woodb{fill:url(#woodG)}.top.woodb{fill:var(--wood-top)}.grain{fill:none;stroke:var(--wood-side);stroke-width:.55;vector-effect:non-scaling-stroke;stroke-linecap:round;opacity:.45}.groove{fill:none;stroke:var(--wood-side);stroke-width:.9;vector-effect:non-scaling-stroke;stroke-linecap:round}.groove-hi{fill:none;stroke:var(--wood-hi);stroke-width:.7;vector-effect:non-scaling-stroke;stroke-linecap:round;opacity:.8}
.brassb{fill:url(#brassG)}.top.brassb{fill:var(--brass-top)}.brass{fill:var(--brass)}.plate{fill:url(#plateG)}.plate-t{fill:#2a2118;font:600 3px Georgia,'Times New Roman',serif;letter-spacing:.5px;text-anchor:middle;stroke:none}.screw{fill:var(--brass-side);stroke:none}
.air{fill:url(#airG);stroke:none}.ground{fill:url(#snowG);stroke:var(--snow-shade);stroke-width:.8;vector-effect:non-scaling-stroke}.snows{fill:var(--snow-side)}.snow{fill:var(--snow)}.shade{fill:var(--snow-shade);opacity:.6;stroke:none;filter:url(#soft)}.step{fill:var(--snow-shade);opacity:.75;stroke:none}.drift{fill:var(--snow);stroke:var(--snow-shade);stroke-width:.6;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.pine{fill:var(--pine)}.pine-s{fill:var(--pine-side);stroke:none}.trunk{fill:var(--trunk)}.tip{fill:var(--snow);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.log{fill:var(--log)}.side.log{fill:var(--log-side)}.logl{fill:none;stroke:#000;stroke-opacity:.2;stroke-width:.55;vector-effect:non-scaling-stroke}.end{fill:var(--log-side);stroke:#000;stroke-opacity:.22;stroke-width:.35;vector-effect:non-scaling-stroke}
.trim{fill:var(--trim);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.door{fill:var(--door);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.stone{fill:var(--stone)}.side.stone{fill:var(--stone-side)}.fascia{fill:var(--fascia)}.roof{fill:url(#roofG)}.side.roof{fill:var(--snow-mid)}.ice-c{fill:#e8f2f7;stroke:none;opacity:.9}
.win{fill:var(--win);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.mull{fill:none;stroke:var(--trim);stroke-width:.7;vector-effect:non-scaling-stroke}.wreath{fill:none;stroke:var(--wreath);stroke-width:1.1}.berry{fill:var(--red);stroke:none}
.halo{fill:var(--glowc);opacity:0;filter:url(#bloom);pointer-events:none;stroke:none}.spill{fill:var(--glowc);opacity:0;filter:url(#bloom);pointer-events:none;stroke:none}
.iron{fill:var(--iron)}.top.iron{fill:var(--iron-top)}.lamp{fill:var(--win)}
.ice{fill:var(--ice);stroke:var(--snow-shade);stroke-width:.6;vector-effect:non-scaling-stroke}.ice-hl{fill:none;stroke:#fff;stroke-width:.7;stroke-linecap:round;opacity:.85}
.coat{fill:var(--coat);stroke:none}.red{fill:var(--red);stroke:none}.skin{fill:var(--skin);stroke:none}.leg{fill:none;stroke:#2a2a2a;stroke-width:.6;stroke-linecap:round}.arm{fill:none;stroke:var(--coat);stroke-width:.8;stroke-linecap:round}.sk-sh{fill:#1d2a3a;opacity:.18;stroke:none}
.fl{fill:var(--flake);stroke:var(--flake-line);stroke-width:.4;vector-effect:non-scaling-stroke;pointer-events:none}
.rim{fill:none;stroke:var(--rim);stroke-width:3.2;opacity:.32;pointer-events:none}.edge{fill:none;stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;pointer-events:none}.refl{fill:url(#reflG);opacity:var(--refl);stroke:none;pointer-events:none}.seat{fill:none;stroke:var(--rim);stroke-width:2.4;stroke-linecap:round;opacity:.45;pointer-events:none}.spec{fill:#fff;opacity:.92;stroke:none;pointer-events:none}.gl{fill:none;stroke:#fff;stroke-linecap:round;pointer-events:none}
.key{fill:var(--brass);stroke:var(--line);stroke-width:.7;vector-effect:non-scaling-stroke}.key-b{fill:var(--brass-side);stroke:var(--line);stroke-width:.7;vector-effect:non-scaling-stroke}.stem{fill:url(#stemG);stroke:var(--line);stroke-width:.7;vector-effect:non-scaling-stroke}.eye{fill:var(--brass-side);stroke:none}
@media(prefers-color-scheme:dark){.win,.lamp{filter:url(#glow)}.halo{opacity:.5}.spill{opacity:.42}.rim{opacity:.42}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<linearGradient id="woodG"><stop offset="0" style="stop-color:var(--wood-hi)"/><stop offset=".3" style="stop-color:var(--wood)"/><stop offset=".72" style="stop-color:var(--wood-side)"/><stop offset="1" style="stop-color:var(--wood-side)"/></linearGradient><linearGradient id="brassG"><stop offset="0" style="stop-color:var(--brass-top)"/><stop offset=".38" style="stop-color:var(--brass)"/><stop offset="1" style="stop-color:var(--brass-side)"/></linearGradient><linearGradient id="plateG" x2="0" y2="1"><stop offset="0" style="stop-color:var(--brass-top)"/><stop offset="1" style="stop-color:var(--brass)"/></linearGradient><linearGradient id="stemG" x2="0" y2="1"><stop offset="0" style="stop-color:var(--brass-top)"/><stop offset=".55" style="stop-color:var(--brass)"/><stop offset="1" style="stop-color:var(--brass-side)"/></linearGradient><radialGradient id="airG" cx=".4" cy=".34" r=".72"><stop offset="0" style="stop-color:var(--air-hi)"/><stop offset=".62" style="stop-color:var(--air)"/><stop offset="1" style="stop-color:var(--air-edge)"/></radialGradient><radialGradient id="snowG" cx=".42" cy=".3" r=".75"><stop offset="0" style="stop-color:var(--snow)"/><stop offset=".72" style="stop-color:var(--snow-mid)"/><stop offset="1" style="stop-color:var(--snow-side)"/></radialGradient><linearGradient id="roofG" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" style="stop-color:var(--snow)"/><stop offset="1" style="stop-color:var(--snow-mid)"/></linearGradient><linearGradient id="reflG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,addEventListener,kit}=env;
/* HUSHFALL G–10 snow globe on a turned walnut base with a music box. World: x lower right, y lower left, z up; 1 unit ≈ 1 mm.
The globe's axis is x = y = 0.
Part                         x        y        z        size
foot                         0        0        0        r41 · h3
turned body                  0        0        3        r39.5 → r34.5 · h16, grooves and grain
bead                         0        0       19        r35.5 · h2
brass collar                 0        0       21        r32 · h5.5 (its sides tuck behind the glass's bulge)
glass                        0        0       60        sphere R46
snow ground                  0        0       36        r39.2, mound +4.5
cabin                   −18…12   −20…0     38.5        walls 16, ridge 65.5 (eaves 2.5 / 2), chimney
pines              (10,−28) (−26,6) (−14,22)           h28 · h34 · h18
lamp post                    2       26     38.6        h17 + lantern
pond, skater                24        4     38.9        r8
brass plate (front, 45°)                  8.4…14.4     ±17°
winding key (right, −45°)                     11        stem, two-winged bow
flakes: one fixed pool, three depths                    r0.55–1.15 */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{P,set,el,group,rect,circle,line,text,FRONT,SIDE,cylinder,box,poly}=kit(()=>root);
const f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=p=>p*p*(3-2*p),RAD=Math.PI/180,KX=1.2247449,KY=.7071068;
let seed=81;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const pd=q=>'M'+q.map(p=>f2(p[0])+','+f2(p[1])).join('L')+'Z';
const ring=(n,f)=>Array.from({length:n},(_,i)=>f(i/n*Math.PI*2));
const circ=(x,y,z,r,n=64)=>ring(n,a=>P(x+r*Math.cos(a),y+r*Math.sin(a),z));
const arc=(x,y,z,r,a0,a1,n=24)=>Array.from({length:n+1},(_,i)=>{const a=(a0+(a1-a0)*i/n)*RAD;return P(x+r*Math.cos(a),y+r*Math.sin(a),z);});
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const p of pts){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(const p of pts.reverse()){while(hi.length>1&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
// Level circles on the axis: an ellipse path, a frustum's visible side (its top left open), an annulus's front.
const ellD=(z,r)=>{const a=f2(r*KX),b=f2(r*KY),y=f2(-z);return`M-${a},${y}A${a},${b} 0 1 0 ${a},${y}A${a},${b} 0 1 0 -${a},${y}Z`;};
function band(z0,r0,z1,r1,cls){const a=f2(r1*KX),b=f2(r1*KY),c=f2(r0*KX),d=f2(r0*KY),y1=f2(-z1),y0=f2(-z0);return el('path',{d:`M-${a},${y1}A${a},${b} 0 0 0 ${a},${y1}L${c},${y0}A${c},${d} 0 0 1 -${c},${y0}Z`,class:'face '+cls});}
function lip(z,ro,ri,cls){const a=f2(ro*KX),b=f2(ro*KY),c=f2(ri*KX),d=f2(ri*KY),y=f2(-z);return el('path',{d:`M-${a},${y}A${a},${b} 0 0 0 ${a},${y}L${c},${y}A${c},${d} 0 0 1 -${c},${y}Z`,class:'face top '+cls});}
const frontArc=(z,r)=>{const a=f2(r*KX),b=f2(r*KY),y=f2(-z);return`M-${a},${y}A${a},${b} 0 0 0 ${a},${y}`;};
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
const CZ=60,R=46,RI=44.4,ZG=36,RG=Math.sqrt(R*R-(CZ-ZG)**2),MOUND=4.5,RS=R*KX;
const ground=(x,y)=>ZG+MOUND*Math.max(0,1-(x*x+y*y)/(RG*RG));
const X0=-18,X1=12,Y0=-20,ZW=38.5,ZT=54.5,ZR=65.5,PITCH=1.1,roofZ=y=>ZR+1.4-PITCH*Math.abs(y+10);
// What a flake lands on: the snow, or the cabin's roof.
const floorAt=(x,y)=>x>X0-2.5&&x<X1+2&&y>Y0-2.5&&y<2.5?Math.max(ground(x,y),roofZ(y)):ground(x,y);

// Floor shadow; then the object, which a drag or a shake moves (the shadow stays on the floor).
el('ellipse',{cx:3,cy:3,rx:57,ry:31,class:'shadow stage-floor'});el('ellipse',{cx:3,cy:3,rx:57,ry:31,class:'stage-contact'});
const drawing=root;
// The base's top behind the glass's bulge is drawn first, so the glass covers it where it's in front; after the glass,
// `part` draws only what the bulge (with the snow in it) leaves visible, as azimuth ranges [z, r, from, to] per edge.
const part=(e0,e1,cls)=>el('path',{d:pd([...arc(0,0,e1[0],e1[1],e1[2],e1[3],30),...arc(0,0,e0[0],e0[1],e0[3],e0[2],30)]),class:'face '+cls});
lip(21,35.5,32,'woodb');band(21,32,26.5,32,'brassb');lip(26.5,32,31.4,'brassb');
const GL=button(el('g',{}),{'aria-label':'Shake the snow globe (Space)'});root=GL;
const gc=P(0,0,CZ);
circle(GL,gc[0],gc[1],RS,'air');
// The snow inside: its side seen through the glass above the collar, the ground's top, soft shade under the scene.
el('path',{d:pd(hull([...circ(0,0,26.5,31.5),...circ(0,0,ZG,RG)])),class:'face snows'});
el('path',{d:ellD(ZG,RG),class:'ground'});
const shade=(x,y,r,k=1)=>{const p=P(x,y,ground(x,y));el('ellipse',{cx:f2(p[0]+1.5*k),cy:f2(p[1]+.8*k),rx:f2(r*KX),ry:f2(r*KY),class:'shade'});};
shade(-3,-9,19,2);shade(10,-28,9);shade(-26,6,10.5);shade(-14,22,6.5);shade(2,26,2.6,.5);
// Light from the windows and the lamp, on the snow (at night).
const spill=(x,y,rx,ry)=>{const p=P(x,y,ground(x,y));el('ellipse',{cx:f2(p[0]),cy:f2(p[1]),rx,ry,class:'spill'});};
spill(5,6,9,4.2);spill(17,-10,7,4.6);spill(2,26,9,4.4);
// The pond: a snow bank, the ice and its glints.
const PQ=[24,4],pz=ground(...PQ)-.1;
el('path',{d:pd(circ(PQ[0],PQ[1],pz+.25,9.6,40)),class:'face snow'});el('path',{d:pd(circ(PQ[0],PQ[1],pz,8.2,40)),class:'ice'});
for(const[a,b,r]of[[200,232,5.6],[205,222,3.2]])el('path',{d:'M'+arc(PQ[0],PQ[1],pz,r,a,b,8).map(p=>p.map(f2).join(',')).join('L'),class:'ice-hl'});
// Footprints from the door down to the pond.
for(let i=0;i<9;i++){const t=i/8,x=-5.5+t*20+Math.sin(t*3)*3,y=2.6+t*6.5+Math.sin(t*2.2)*1.5,o=(i%2?1:-1)*.7,p=P(x+o*.7,y-o*.7,ground(x,y));el('ellipse',{cx:f2(p[0]),cy:f2(p[1]),rx:.75,ry:.42,class:'step'});}
const LAY=[el('g',{})];

// Pines: tiers of cones, shaded on the right, snow on the branch tips.
function pine(x,y,h,rb,n){
const z0=ground(x,y)-.6,tr=h*.13;cylinder(x,y,z0,rb*.14,tr+1.6,'z','trunk');
for(let i=0;i<n;i++){
const zb=z0+tr+i*(h-tr)*.2,r=rb*(1-i*.19),zt=i===n-1?z0+h:zb+(h-tr)*.42,ap=P(x,y,zt);
el('path',{d:pd(hull([ap,...circ(x,y,zb,r,40)])),class:'face pine'});
el('path',{d:pd([ap,...arc(x,y,zb,r,22,-45,10)]),class:'pine-s'});
const lo=arc(x,y,zb,r,135,-45,24),q=.8,hi=arc(x,y,zb,r*q,135,-45,24).map((p,k)=>[p[0],p[1]-(1-q)*(zt-zb)-.5-.8*Math.abs(Math.sin(k*Math.PI/4))]);
el('path',{d:pd([...lo,...hi.reverse()]),class:'tip'});
if(i===n-1)el('path',{d:pd(hull([ap,...circ(x,y,zt-(zt-zb)*.26,r*.26,16)])),class:'tip'});
}}
pine(10,-28,28,8.5,4);pine(-26,6,34,10,4);

// The cabin: red log walls, a snowy gable roof, a chimney, lit windows and a wreath on the door.
{
const wall=(pts,cls)=>el('path',{d:poly(pts,true),class:'face '+cls});
wall([[X0,0,ZW],[X1,0,ZW],[X1,0,ZT],[X0,0,ZT]],'log');
wall([[X1,0,ZW],[X1,Y0,ZW],[X1,Y0,ZT],[X1,0,ZT]],'side log');
wall([[X1,0,ZT],[X1,Y0,ZT],[X1,-10,ZR]],'side log');
const FF=group(FRONT(X0,.05,ZT)),FS=group(SIDE(X1+.05,0,ZR));
for(let v=2.2;v<16;v+=2.3)line(FF,0,v,X1-X0,v,'logl');
for(let v=1.6;v<27;v+=2.3){const hw=v<11?10*v/11:10;line(FS,10-hw,v,10+hw,v,'logl');}
for(let v=1.2;v<16;v+=2.3){circle(FF,-.45,v,.95,'end');circle(FF,X1-X0+.45,v,.95,'end');}
rect(FF,7.5,6,6,10,.4,'door');circle(FF,12.3,11.4,.38,'brass');circle(FF,10.5,8.6,1.45,'wreath');circle(FF,10.5,7.3,.45,'berry');
rect(FF,18.3,3.4,8.4,7.2,.4,'trim');rect(FF,19,4,7,6,.3,'win');line(FF,22.5,4,22.5,10,'mull');line(FF,19,7,26,7,'mull');rect(FF,17.8,10.2,9.4,1.2,.5,'drift');
rect(FS,6.3,14.4,8.4,7.2,.4,'trim');rect(FS,7,15,7,6,.3,'win');line(FS,10.5,15,10.5,21,'mull');line(FS,7,18,14,18,'mull');rect(FS,5.8,21.2,9.4,1.2,.5,'drift');
circle(FS,10,5.4,2,'trim');circle(FS,10,5.4,1.45,'win');line(FS,10,4,10,6.8,'mull');
// chimney, standing out of the roof's front slope
const c0=3,c1=7,cy0=-6,cy1=-2,zc=ZR+3.4;
// roof: the snow on the front slope, the slab's front edge and its end over the gable, icicles
const E0=X0-2.5,E1=X1+2,YE=2.5,YB=-22.5,zE=roofZ(YE),zB=roofZ(YB);
wall([[E0,YE,zE],[E1,YE,zE],[E1,-10,ZR+1.4],[E0,-10,ZR+1.4]],'roof');
wall([[E0,YE,zE],[E1,YE,zE],[E1,YE,zE-2.4],[E0,YE,zE-2.4]],'fascia');
wall([[E0,YE,zE],[E1,YE,zE],[E1,YE,zE-1.3],[E0,YE,zE-1.3]],'roof');
wall([[E1,YE,zE-2.4],[E1,YE,zE],[E1,-10,ZR+1.4],[E1,YB,zB],[E1,YB,zB-2.4],[E1,-10,ZR-1]],'side fascia');
wall([[E1,YE,zE-1.3],[E1,YE,zE],[E1,-10,ZR+1.4],[E1,YB,zB],[E1,YB,zB-1.3],[E1,-10,ZR+.1]],'side roof');
for(const[x,l]of[[-15.5,1.3],[-11,.9],[-.5,1.5],[6.5,1],[10.6,1.4]])el('path',{d:poly([[x-.4,YE,zE-2.4],[x+.4,YE,zE-2.4],[x,YE,zE-2.4-l]],true),class:'ice-c'});
wall([[c0,cy1,roofZ(cy1)],[c1,cy1,roofZ(cy1)],[c1,cy1,zc],[c0,cy1,zc]],'stone');wall([[c1,cy1,roofZ(cy1)],[c1,cy0,roofZ(cy0)],[c1,cy0,zc],[c1,cy1,zc]],'side stone');
wall([[c0,cy0,zc],[c1,cy0,zc],[c1,cy1,zc],[c0,cy1,zc]],'roof');
// drifts along the walls
const drift=(pts)=>el('path',{d:pd(pts),class:'drift'});
const DF=[],DS=[];for(let i=0;i<=16;i++){const x=X0-1.5+i*(X1-X0+3)/16;DF.push(P(x,.9,ground(x,.9)+1.5+.9*Math.abs(Math.sin(i*1.3))));}
for(let i=16;i>=0;i--){const x=X0-1.5+i*(X1-X0+3)/16;DF.push(P(x,1.6,ground(x,1.6)-.2));}
for(let i=0;i<=10;i++){const y=1-i*(21/10);DS.push(P(X1+.9,y,ground(X1+.9,y)+1.4+.8*Math.abs(Math.sin(i*1.7))));}
for(let i=10;i>=0;i--){const y=1-i*(21/10);DS.push(P(X1+1.6,y,ground(X1+1.6,y)-.2));}
drift(DS);drift(DF);
}
const halo=(x,y,z,r)=>{const p=P(x,y,z);el('circle',{cx:f2(p[0]),cy:f2(p[1]),r,class:'halo'});};
halo(4.5,0,47,5.5);halo(X1,-10,47,5.5);halo(X1,-10,60,3.5);
LAY.push(el('g',{}));

// In front: a small pine, the lamp post, and the skater on the pond.
pine(-14,22,18,6,3);
{
const[lx,ly]=[2,26],lz=ground(lx,ly)-.4,LZ=lz+17.4;
cylinder(lx,ly,lz,1.35,1.8,'z','iron');cylinder(lx,ly,lz+1.8,.6,15.6,'z','iron');
box(lx-1.6,ly-1.6,LZ,3.2,3.2,4,.3,'lamp');
const ap=[lx,ly,LZ+6.4],c=[[lx-2.2,ly-2.2],[lx+2.2,ly-2.2],[lx+2.2,ly+2.2],[lx-2.2,ly+2.2]].map(([x,y])=>[x,y,LZ+4]);
el('path',{d:poly([c[3],c[2],ap],true),class:'face iron'});el('path',{d:poly([c[2],c[1],ap],true),class:'face side iron'});
el('path',{d:poly([[lx-1.5,ly+1.5,LZ+4.6],[lx+1.5,ly+1.5,LZ+4.6],[lx+1.5,ly-1.5,LZ+4.6],ap],true),class:'tip'});
halo(lx,ly,LZ+2,6.5);
}
const SK=el('g',{}),SKb=el('g',{},SK);
el('ellipse',{cx:0,cy:.15,rx:1.9,ry:.6,class:'sk-sh'},SK);
el('path',{d:'M-.45,-2.7L-.8,-.05M.45,-2.7L.95,-.15M-1.5,0H.1M.2,-.1H1.8',class:'leg'},SKb);
el('path',{d:'M-1.35,-2.4C-1.2,-3.8 -1.05,-4.9 -.75,-5.45H.75C1.05,-4.9 1.2,-3.8 1.35,-2.4Z',class:'coat'},SKb);
el('path',{d:'M-.75,-5.05L-2.7,-4.1M.75,-5.05L2.75,-4.5',class:'arm'},SKb);
rect(SKb,-.95,-5.95,1.9,.75,.35,'red');el('path',{d:'M.55,-5.4L1.3,-3.9L.7,-3.8Z',class:'red'},SKb);
circle(SKb,0,-6.75,.95,'skin');el('path',{d:'M-.98,-6.9C-.9,-8 .9,-8 .98,-6.9Z',class:'red'},SKb);circle(SKb,0,-8.05,.45,'red');
LAY.push(el('g',{}));

// The glass over it all: a fresnel rim, a window's reflection, a highlight, the edge light.
const at=(a,r)=>[gc[0]+r*Math.cos(a*RAD),gc[1]+r*Math.sin(a*RAD)];
const pane=(a0,a1,r0,r1)=>{const p=at(a0,r0),q=at(a1,r0),s=at(a1,r1),t=at(a0,r1);return`M${p.map(f2)}A${f2(r0)},${f2(r0)} 0 0 1 ${q.map(f2)}L${s.map(f2)}A${f2(r1)},${f2(r1)} 0 0 0 ${t.map(f2)}Z`;};
circle(GL,gc[0],gc[1],RS-1.7,'rim');
el('path',{d:pane(226,247,RS*.7,RS*.9)+pane(250,262,RS*.7,RS*.9),class:'refl'});
const gla=(a0,a1,r,w,o)=>{const p=at(a0,r),q=at(a1,r);el('path',{d:`M${p.map(f2)}A${f2(r)},${f2(r)} 0 0 1 ${q.map(f2)}`,class:'gl','stroke-width':w,opacity:o});};
gla(150,200,RS-3,1.3,.55);gla(18,64,RS-3.2,1.6,.34);gla(272,300,RS-2.6,.9,.5);
const sp=at(222,RS*.8);el('ellipse',{cx:f2(sp[0]),cy:f2(sp[1]),rx:2.7,ry:1.5,transform:`rotate(-48 ${sp.map(f2).join(' ')})`,class:'spec'});
el('path',{d:'M'+arc(0,0,27.6,31,112,-22,24).map(p=>p.map(f2).join(',')).join('L'),class:'seat'});
circle(GL,gc[0],gc[1],RS,'edge');circle(GL,gc[0],gc[1],RS+2.6,'focus-ring');

// The base: walnut foot, turned body with grooves, a bead and the brass collar; the brass plate; the winding key.
root=drawing;
const rAt=z=>39.5-(z-3)*5/16;
band(0,41,3,41,'woodb');lip(3,41,39.5,'woodb');band(3,39.5,19,34.5,'woodb');
for(const[z,a0,a1]of[[9.6,122,40],[11.8,70,-12],[13.6,150,95],[13.9,18,-38],[17.4,104,30]])el('path',{d:'M'+arc(0,0,z,rAt(z)+.05,a0,a1,16).map((p,i)=>[p[0],p[1]+Math.sin(i*.9)*.25].map(f2).join(',')).join('L'),class:'grain'});
for(const z of[6.5,16.4]){el('path',{d:frontArc(z,rAt(z)+.1),class:'groove'});el('path',{d:frontArc(z-.8,rAt(z-.8)+.1),class:'groove-hi'});}
band(19,35.5,21,35.5,'woodb');part([21,32,131,-41],[21,35.5,141,-51],'top woodb');
part([21,32,131,-41],[26.5,32,103,-13],'brassb');part([26.5,31.4,103,-13],[26.5,32,103,-13],'top brassb');
{const pts=[],A=17;for(let i=0;i<=10;i++){const a=(45-A+2*A*i/10)*RAD,r=rAt(14.4)+.35;pts.push(P(r*Math.cos(a),r*Math.sin(a),14.4));}
for(let i=10;i>=0;i--){const a=(45-A+2*A*i/10)*RAD,r=rAt(8.4)+.35;pts.push(P(r*Math.cos(a),r*Math.sin(a),8.4));}
el('path',{d:pd(pts),class:'face plate'});const m=P(rAt(11.4)*KY,rAt(11.4)*KY,11.4);
text(drawing,m[0],m[1]+1.1,'HUSHFALL','plate-t');for(const s of[-1,1]){const a=(45+s*(A-1.7))*RAD,r=rAt(11.4)+.4,q=P(r*Math.cos(a),r*Math.sin(a),11.4);circle(drawing,q[0],q[1],.55,'screw');}}
const KEY=button(el('g',{}),{class:'control key','aria-label':'Wind the music box (W)'});
const ku=rAt(11)*KX,kv=-11;
rect(KEY,ku-1,kv-1.4,8.6,2.8,1.2,'stem');rect(KEY,ku+.4,kv-2.5,1,5,.4,'key-b');
const BL=[0,1].map(()=>({b:el('ellipse',{class:'key-b'},KEY),f:el('ellipse',{class:'key'},KEY)})),HUB=el('ellipse',{class:'key'},KEY),EYE=el('ellipse',{class:'eye'},KEY);
rect(KEY,ku-1.5,kv-8,14,16,2,'hit');rect(KEY,ku-1.2,kv-7.4,13.4,14.8,2,'focus-ring');
const BOW=ku+7.6+1.7*KX,TH0=Math.atan2(KY,-1);
// The bow's wings lie in a plane through the stem; turning it about the stem (across the view) squeezes them.
function keyPose(th){const k=-Math.cos(th)+KY*Math.sin(th),m=-KY*Math.cos(th)-Math.sin(th),near=(Math.sin(th)-Math.SQRT2*Math.cos(th))>0?1:-1,off=.5*m*near,ry=Math.max(.3,Math.abs(2.5*k));
BL.forEach((l,i)=>{const cy=kv+(i?1:-1)*2.6*k;
set(l.b,'cx',f2(BOW));set(l.b,'cy',f2(cy-off));set(l.b,'rx',f2(1.75*KX));set(l.b,'ry',f2(ry));
set(l.f,'cx',f2(BOW));set(l.f,'cy',f2(cy+off));set(l.f,'rx',f2(1.75*KX));set(l.f,'ry',f2(ry));});
set(HUB,'cx',f2(BOW));set(HUB,'cy',f2(kv+off));set(HUB,'rx',f2(1.25*KX));set(HUB,'ry',f2(Math.max(.3,Math.abs(1.25*k))));
set(EYE,'cx',f2(BOW));set(EYE,'cy',f2(kv+off));set(EYE,'rx',.55);set(EYE,'ry',f2(Math.max(.08,Math.abs(.5*k))));}
keyPose(TH0);
// Everything but the floor shadow moves together when the globe is shaken.
const MOV=[...drawing.children].slice(2);
set(svg,'viewBox','-62.84 -122.84 129.14 160.84');

// The flakes: one pool, each with its size, sink speed, flutter and tumble; a few hardly sink at all.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const say=m=>{announcement.textContent=m;};
const N=150,SINKERS=140,FL=[];
function scatter(f,bias){const z=ZG+3+(CZ+R-9-ZG-3)*rnd()**bias,rr=Math.sqrt(Math.max(0,RI*RI-(z-CZ)**2))-1.5,a=rnd()*Math.PI*2,q=rr*Math.sqrt(rnd());
f.x=q*Math.cos(a);f.y=q*Math.sin(a);f.z=Math.max(z,floorAt(f.x,f.y)+1+rnd()*3);f.st=0;f.fade=1;f.k[0]=f.k[1]=f.k[2]=0;}
function land(f){const a=rnd()*Math.PI*2,q=RG*.94*Math.sqrt(rnd());f.x=q*Math.cos(a);f.y=q*Math.sin(a);f.z=floorAt(f.x,f.y);f.st=1;f.fade=0;}
for(let i=0;i<N;i++){const floater=i>=SINKERS,r=floater?.5+rnd()*.3:.55+rnd()*.6;
const f={n:circle(LAY[0],0,0,0,'fl'),L:0,r,floater,s:floater?.22+rnd()*.25:2.8+(r-.55)*4+rnd()*1.2,ph:rnd()*6.3,ff:.5+rnd()*.9,tp:rnd()*6.3,tf:1.2+rnd()*2.6,k:[0,0,0],x:0,y:0,z:0,st:0,fade:1,vis:-1};
if(!floater&&i%10<3)land(f);else scatter(f,1.5);FL.push(f);}

// The water: a swirl about the axis, a ring vortex (up the middle, down the glass), a few eddies, and its inertia when
// the globe moves. Strengths fade with time; a shake or a drag feeds them.
let Om=.4,Kv=3,now=0,time=0,lt=0;const V=[0,0,0],VR=[0,0,0],U=[0,0,0];
const ED=[0,1,2].map(()=>({c:[0,0,CZ],a:[0,0,1],s:0}));
function stir(e){for(const d of ED){const t=rnd()*Math.PI*2,u=rnd()*2-1,q=Math.sqrt(1-u*u),rr=rnd()*24,tt=rnd()*Math.PI*2;d.a=[q*Math.cos(t),q*Math.sin(t),u];d.c=[rr*Math.cos(tt),rr*Math.sin(tt),CZ-14+rnd()*30];d.s=(rnd()<.5?-1:1)*e*(.6+rnd()*.6);}}
stir(.7);
function flow(x,y,z){const rz=z-CZ,h=x*x+y*y,w=Math.max(0,1-(h+rz*rz)/(R*R)),a2=R*R;
let ux=-y*Om*w+2*Kv*rz*x/a2,uy=x*Om*w+2*Kv*rz*y/a2,uz=2*Kv*(1-(2*h+rz*rz)/a2);
for(const d of ED){if(!d.s)continue;const dx=x-d.c[0],dy=y-d.c[1],dz=z-d.c[2],g=d.s*Math.exp(-(dx*dx+dy*dy+dz*dz)/300);ux+=g*(d.a[1]*dz-d.a[2]*dy);uy+=g*(d.a[2]*dx-d.a[0]*dz);uz+=g*(d.a[0]*dy-d.a[1]*dx);}
U[0]=ux+VR[0]*w;U[1]=uy+VR[1]*w;U[2]=uz+VR[2]*w;return U;}
const energy=()=>Math.abs(Om)*14+Math.abs(Kv)+Math.max(...ED.map(d=>Math.abs(d.s)))*5+Math.hypot(...VR);
function step(f,dt){
if(f.st){if(f.fade>0)f.fade=Math.max(0,f.fade-dt/.35);return;}
const u=flow(f.x,f.y,f.z),fw=f.floater?.35:.9;
f.x+=(u[0]+Math.sin(time*f.ff*6.3+f.ph)*fw+f.k[0])*dt;f.y+=(u[1]+Math.cos(time*f.ff*5+f.ph*1.3)*fw+f.k[1])*dt;f.z+=(u[2]-f.s+f.k[2])*dt;
const kd=Math.exp(-dt/.32);f.k[0]*=kd;f.k[1]*=kd;f.k[2]*=kd;
const rz=f.z-CZ,d=Math.hypot(f.x,f.y,rz);if(d>RI){const s=RI/d;f.x*=s;f.y*=s;f.z=CZ+rz*s;}
const fl=floorAt(f.x,f.y);if(f.z<=fl){if(Math.hypot(u[0],u[1],u[2])>9){f.z=fl+.3;f.k[2]=Math.max(f.k[2],4);}else{f.z=fl;f.st=1;f.fade=1;}}
}
// Settled flakes lift again where the water runs fast over them (a share each time it's called).
function lift(share,kick){for(const f of FL){if(!f.st||rnd()>share)continue;f.st=0;f.fade=1;f.z=floorAt(f.x,f.y)+.4;f.k[0]=(rnd()-.5)*kick*.7;f.k[1]=(rnd()-.5)*kick*.7;f.k[2]=kick*(.5+rnd()*.9);}}

// The music box: one wind plays the tune through once, slowing as the spring runs down; the key turns as it unwinds.
// An original waltz in D major, 3/4: [beat, midi note, voice] (0 melody, 1 bass, 2 the waltz's off-beats).
const BEAT=.48,BARS=16,TUNE_BEATS=BARS*3;
const MEL=[[78,81,86],[85,0,81],[83,79,83],[81,0,0],[79,78,79],[76,0,81],[79,78,76],[78,0,0],[78,81,86],[88,0,86],[85,83,81],[83,0,0],[79,83,88],[86,0,78],[76,81,85],[86,0,0]];
const BASS=[50,57,55,50,55,57,57,50,50,57,57,55,52,50,57,50],PAH={50:[66,69],57:[61,64],55:[59,62],52:[55,59]};
const EV=[];MEL.forEach((bar,i)=>{bar.forEach((m,j)=>{if(m)EV.push([i*3+j,m,0]);});EV.push([i*3,BASS[i],1]);if(i!==15)PAH[BASS[i]].forEach((m,j)=>EV.push([i*3+1+j,m,2]));});
EV.sort((a,b)=>a[0]-b[0]||a[2]-b[2]);
let spring=0,wind=null,playing=false,beat=0,ni=0,lb=0,clicks=0;
let ac=null,out=null,noise=null;
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();out=ac.createGain();out.gain.value=.9;out.connect(ac.destination);}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
function tine(m,when,v){if(!ac)return;try{const f=440*2**((m-69)/12),t=ac.currentTime+Math.max(0,when),d=clamp(2.6-(m-50)*.042,.7,2.6);
for(const[k,a,dk]of[[1,v,d],[2,v*.14,d*.4],[6.27,v*.16,.09]]){const o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f*k;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(a,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dk);o.connect(g);g.connect(out);o.start(t);o.stop(t+dk+.05);}}catch(_){}}
function tick1(f,v,d,type='square',when=0){if(!ac)return;try{const t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.002);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(out);o.start(t);o.stop(t+d+.03);}catch(_){}}
function swoosh(p){if(!ac)return;try{if(!noise){const n=Math.floor(ac.sampleRate*.9);noise=ac.createBuffer(1,n,ac.sampleRate);const ch=noise.getChannelData(0);for(let i=0;i<n;i++)ch[i]=(rnd()*2-1)*(1-i/n);}
const t=ac.currentTime,s=ac.createBufferSource(),bp=ac.createBiquadFilter(),g=ac.createGain();s.buffer=noise;bp.type='bandpass';bp.Q.value=.9;bp.frequency.setValueAtTime(420,t);bp.frequency.exponentialRampToValueAtTime(1500,t+.25);bp.frequency.exponentialRampToValueAtTime(600,t+.75);
g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05*p,t+.06);g.gain.exponentialRampToValueAtTime(.0001,t+.8);s.connect(bp);bp.connect(g);g.connect(out);s.start(t);s.stop(t+.85);tick1(2637,.006*p,.18,'sine',.05);}catch(_){}}
function schedule(rate){if(!ac)return;const bps=rate/BEAT,ahead=beat+bps*.12;while(lb+EV[ni][0]<ahead){const[b,m,v]=EV[ni];if(lb+b>=beat-.01)tine(m,(lb+b-beat)/bps,v===0?.032:v===1?.022:.011);ni++;if(ni===EV.length){ni=0;lb+=TUNE_BEATS;}}}

// State: drag and shake wobble (full motion), the water, the flakes, the tune; with reduced motion the picture jumps:
// flakes are redrawn on steps, the globe never moves, the key and the skater hold.
let lastTf='',lastSettled=-1,sloshT=-1e9,drag=null,gx=0,gy=0,gvx=0,gvy=0,pox=0,poy=0,wob=null,lastUser=-1e9,rest=0,stepT=-1.2,stepNow=1,lastR='',lastS='',sk=3.9,skv=0,settledSaid=true;
const touch=()=>{lastUser=now;};
function shake(p=1){audio();touch();swoosh(p);Om+=(rnd()<.5?-1:1)*(1.6+rnd()*.8)*p;Kv=Math.max(Kv,14*p);stir(3*p);
if(reduced.matches){for(const f of FL)scatter(f,1.1);stepNow=1;}
else{for(const f of FL){if(f.st){f.st=0;f.z=floorAt(f.x,f.y)+.4;}f.fade=1;f.k=[(rnd()-.5)*30*p,(rnd()-.5)*30*p,(18+rnd()*46)*p];}wob={t0:now,p};}
settledSaid=false;say('Shaken: the snow whirls, then slowly settles.');}
// A held arrow keeps swirling, quietly: one sound and one announcement per press.
function swirl(dir,held=false){audio();touch();if(!held)swoosh(.45);Om=clamp(Om+dir*(held?.25:1.3),-3.2,3.2);Kv=Math.max(Kv,6);stir(1.2);
if(reduced.matches){for(const f of FL)if(f.st&&rnd()<.5)scatter(f,2.2);stepNow=1;}else{lift(.55,16);wob={t0:now,p:.3*dir};}
settledSaid=false;if(!held)say(dir>0?'Swirled to the left.':'Swirled to the right.');}
function windUp(){audio();touch();if(wind)return;wind={t0:now,s0:spring};clicks=0;say('Winding the music box.');}
function local(e){const m=svg.getScreenCTM?.();if(!m)return null;const det=m.a*m.d-m.b*m.c;if(!det)return null;const x=e.clientX-m.e,y=e.clientY-m.f;return[(m.d*x-m.c*y)/det,(-m.b*x+m.a*y)/det];}
GL.addEventListener('pointerdown',e=>{if(e.button>0)return;audio();touch();const q=local(e)||[0,0];drag={x0:q[0],y0:q[1],tx:0,ty:0,moved:0};set(GL,'class','control held');try{GL.setPointerCapture?.(e.pointerId);}catch(_){}});
svg.addEventListener('pointermove',e=>{if(!drag)return;const q=local(e);if(!q)return;const dx=q[0]-drag.x0,dy=q[1]-drag.y0;drag.moved=Math.max(drag.moved,Math.hypot(dx,dy));drag.tx=clamp(dx*.45,-10,10);drag.ty=clamp(dy*.45,-10,3);touch();});
let dragEnd=-1e9;
const release=()=>{if(!drag)return;const d=drag;drag=null;set(GL,'class','control');if(d.moved>6){dragEnd=now;if(reduced.matches)shake(.8);else{settledSaid=false;say('The snow whirls, then slowly settles.');}}};
for(const t of['pointerup','pointercancel'])svg.addEventListener(t,release);
addEventListener('pointerup',release);addEventListener('pointercancel',release);
bind(GL,()=>{if(now-dragEnd<400)return;shake(1);});
bind(KEY,windUp);
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key;
if(k==='ArrowLeft'||k==='ArrowRight'){e.preventDefault();swirl(k==='ArrowLeft'?1:-1,e.repeat);return;}
if(e.repeat)return;if((k===' '||k==='Enter')&&e.target&&e.target.closest&&e.target.closest('[role=button]'))return;
if(k===' '){e.preventDefault();shake(1);}else if(k.toLowerCase()==='w'){e.preventDefault();windUp();}});

// The readout follows the snow (on the steps, with reduced motion); the state line, the music box.
function ui(snow=true){
const sink=FL.filter(f=>!f.floater),pct=Math.floor(100*sink.filter(f=>f.st).length/sink.length);
const r=`${pct>=100?'SETTLED':drag&&drag.moved>6||energy()>14?'WHIRLING':'SETTLING'} · ${pct}%`;
const s=wind?'WINDING THE MUSIC BOX':playing?`${spring<.12?'RUNNING DOWN':'PLAYING'} · SPRING ${Math.round(spring*100)}%`:'MUSIC BOX STILL · W WINDS IT';
if(snow&&r!==lastR){readout.textContent=r;lastR=r;if(pct>=100&&!settledSaid){settledSaid=true;say('The snow has settled.');}}if(s!==lastS){stateLabel.textContent=s;lastS=s;}}
function paint(red){for(const f of FL){
if(f.st&&f.fade<=0){if(f.vis!==0){set(f.n,'r',0);f.vis=0;}continue;}
const p=P(f.x,f.y,f.z),tw=red?1:.72+.28*Math.abs(Math.cos(time*f.tf+f.tp));
set(f.n,'cx',f2(p[0]));set(f.n,'cy',f2(p[1]));set(f.n,'r',f2(f.r*tw*(f.st?f.fade:1)));f.vis=1;
const L=f.x+f.y<-16?0:f.x+f.y<14?1:2;if(L!==f.L){LAY[L].appendChild(f.n);f.L=L;}}}
function skater(){const a=sk,x=PQ[0]+4.6*Math.cos(a),y=PQ[1]+4.6*Math.sin(a),p=P(x,y,pz+.1),dir=Math.sin(a)+Math.cos(a)>0?-1:1;
set(SK,'transform',`translate(${f2(p[0])} ${f2(p[1])})`);set(SKb,'transform',`scale(${dir} 1) rotate(${f2(-skv*7)})`);}
function tick(t){
const dt=Math.min(.05,(t-(lt||t))/1000),red=reduced.matches;lt=now=t;
// The globe in hand: it follows a drag on a spring and wobbles after a shake; its motion pushes the water about.
let ox=0,oy=0,ang=0;
if(!red){const tx=drag?drag.tx:0,ty=drag?drag.ty:0;gvx+=((tx-gx)*170-gvx*14)*dt;gvy+=((ty-gy)*170-gvy*14)*dt;gx+=gvx*dt;gy+=gvy*dt;
let wx=0,wy=0,wa=0;if(wob){const k=(t-wob.t0)/1000;if(k>1.4)wob=null;else{const e=Math.exp(-k/.3)*wob.p,s=Math.sin(k*20);wx=6*e*s;wy=-2.4*Math.abs(e*s);wa=3.4*e*Math.sin(k*20+.6);}}
ox=gx+wx;oy=gy+wy;ang=clamp(gvx*.03,-5,5)+wa;}else{gx=gy=gvx=gvy=0;wob=null;}
const tf=ox||oy||ang?`translate(${f2(ox)} ${f2(oy)}) rotate(${f2(ang)})`:'';if(tf!==lastTf){for(const n of MOV)set(n,'transform',tf);lastTf=tf;}
const vx=dt?(ox-pox)/dt:0,vy=dt?(oy-poy)/dt:0;pox=ox;poy=oy;
const vg=[vx*.577,-vx*.577,-vy],kf=1-Math.exp(-dt/.4);for(let i=0;i<3;i++){V[i]+=(vg[i]-V[i])*kf;VR[i]=V[i]-vg[i];}
const vr=Math.hypot(...VR);
if(drag&&vr>10&&now-sloshT>380){sloshT=now;swoosh(clamp(vr/40,.2,.8));}
if(vr>3){Kv=Math.max(Kv,Math.min(12,vr*.7));Om=clamp(Om+(gx*gvy-gy*gvx)*.0004*dt+(rnd()-.5)*vr*.02*dt,-3,3);if(rnd()<dt*6)stir(clamp(vr*.12,.6,3.2));lift(clamp((vr-3)*.03)*dt*8,12+vr*.5);}
// The water slows; the flakes ride it and sink (reduced: on a quicker, unseen clock).
const ph=red?dt*2.5:dt;time+=ph;
Om*=Math.exp(-ph/3.2);Kv*=Math.exp(-ph/2.6);for(const d of ED)d.s*=Math.exp(-ph/1.5);
for(const f of FL)step(f,ph);
// The music box.
if(wind){const k=clamp((t-wind.t0)/900);spring=wind.s0+(1-wind.s0)*ease(k);const c=Math.floor(k*3.999);while(clicks<=c&&clicks<4){tick1(2300,.012,.012,'square',0);tick1(900,.01,.02,'triangle',.004);clicks++;}
if(k>=1){wind=null;playing=true;say('Wound: the music box plays.');}}
let rate=0;
if(playing){rate=spring<.12?.45+.55*spring/.12:1;const db=dt*rate/BEAT;schedule(rate);beat+=db;if(!wind)spring=Math.max(0,spring-db/TUNE_BEATS);
if(spring<=0&&!wind){playing=false;say('The music box has run down.');}}
keyPose(red?TH0+(playing||wind?.3*Math.PI:0):TH0+spring*3*Math.PI);
if(!red&&playing){skv+=(rate-skv)*clamp(dt*3);sk+=dt*rate*1.15;}else skv+=(0-skv)*clamp(red?1:dt*3);skater();
// Flakes on screen, and the readout: every frame, or on steps with reduced motion.
// Reduced, a step repaints only while the settling changes, so once it's settled the picture holds.
if(!red){paint(false);ui();lastSettled=-1;}else{stepT+=dt;const n=stepNow||stepT>=1.8?FL.reduce((c,f)=>c+(f.floater?0:f.st),0):-1;if(stepNow||(n>=0&&n!==lastSettled)){stepNow=0;stepT=0;lastSettled=n;paint(true);ui();}else{if(n>=0)stepT=0;ui(false);}}
// Left alone and settled, it gives itself a gentle swirl now and then.
if(!red&&lastR.startsWith('SETTLED')&&!drag){rest+=dt;if(rest>7&&now-lastUser>12000){rest=0;Om+=(rnd()<.5?-1:1)*.9;Kv=Math.max(Kv,7);stir(1.1);lift(.7,22);wob={t0:now,p:.18};settledSaid=true;}}else rest=0;
requestAnimationFrame(tick);
}
paint(reduced.matches);ui();skater();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
