// @ts-nocheck
/* ASKELD T–2 · Campfire and tent. Drawn for this package in the lab figures' form: its stylesheet, defs and script,
 * on the engine's kit. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--grass:#c2cb9c;--grass-hi:#d3daaf;--blade:#86955f;--rim:#a08863;--dirt:#dacdab;--ash:#aba49b;--stone:#b1aba0;--stone-top:#d1ccc3;--stone-side:#8a857c;--wood:#8d6947;--wood-end:#d8b783;--ring:#b18a59;--bark:#5f452e;--char:#4b3b31;--char-end:#5e4639;--canvas:#e5d6b6;--canvas-top:#f3ead4;--canvas-side:#d1bb93;--under:#b39c74;--inside:#4a3f37;--lining:#eadbb9;--rust:#b65a3a;--rope:#988770;--bag:#a54d3d;--enamel:#4e6957;--enamel-top:#62816d;--globe:#ece7da;--stick:#d9c39e;--grip:#7a5a3c;--smoke:#a29f99;--star:#fff;--tag:#f7f0e0;--tag-ink:#6b3f2a}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--line:#444443;--grass:#353c2e;--grass-hi:#434b38;--blade:#58644a;--rim:#27231e;--dirt:#463d33;--ash:#3c3834;--stone:#766d63;--stone-top:#ab937c;--stone-side:#4a4642;--wood:#5a432f;--wood-end:#a3825a;--ring:#7a6142;--bark:#33261a;--char:#2e2520;--char-end:#3b2e27;--canvas:#776d59;--canvas-top:#887e69;--canvas-side:#645b49;--under:#3d372e;--inside:#1d1915;--lining:#776b56;--rust:#7c3b28;--rope:#5e5546;--bag:#6a3128;--enamel:#384b3f;--enamel-top:#48604f;--globe:#7d796f;--stick:#a8916f;--grip:#4a3624;--smoke:#6b6863;--tag:#9d917b;--tag-ink:#2f2219}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.grass{fill:url(#turfG)}.rim{fill:var(--rim)}.dirt{fill:var(--dirt);stroke:none}.ash{fill:var(--ash)}.blade{fill:none;stroke:var(--blade);stroke-width:.6;stroke-linecap:round}.stone{fill:url(#stoneG)}
.wood{fill:var(--wood)}.top.wood{fill:var(--wood-end)}.char{fill:var(--char)}.top.char{fill:var(--char-end)}.ring{fill:none;stroke:var(--ring);stroke-width:.45;vector-effect:non-scaling-stroke}.bark{fill:none;stroke:var(--bark);stroke-width:.55;stroke-linecap:round;opacity:.55}
.gable{fill:var(--canvas-side)}.slope{fill:url(#slopeG)}.under{fill:var(--under)}.inside{fill:var(--inside)}.rust{fill:var(--rust)}.bag{fill:var(--bag)}.tag{fill:var(--tag);stroke-width:.5}.serif{font:italic 700 1.75px Georgia,'Times New Roman',serif;letter-spacing:.2px;fill:var(--tag-ink);stroke:none}
.seam{fill:none;stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke;opacity:.32}.stitch{fill:none;stroke:#000;stroke-opacity:.28;stroke-width:.35;stroke-dasharray:1 .8}.rope{fill:none;stroke:var(--rope);stroke-width:.55;stroke-linecap:round}.peg{fill:none;stroke:var(--line);stroke-width:.8;stroke-linecap:round}.pole{fill:none;stroke:var(--line);stroke-width:1.1;stroke-linecap:round}.roll{fill:none;stroke:var(--lining);stroke-linecap:round}.roll-u{fill:none;stroke:var(--line);stroke-linecap:round}
.enamel{fill:var(--enamel)}.top.enamel{fill:var(--enamel-top)}.globe{fill:var(--globe);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.globe.lit{fill:url(#globeG)}.wire{fill:none;stroke:var(--line);stroke-width:.45;stroke-linecap:round}
.stick{fill:var(--stick)}.grip{fill:var(--grip)}.mallow{stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.tongue{stroke:none}.tongue.o{fill:url(#flameO)}.tongue.m{fill:url(#flameM)}.tongue.c{fill:url(#flameC)}.halo{fill:url(#haloG)}.bedglow{fill:url(#bedG)}.coal{fill:url(#coalG)}.crack{fill:none;stroke:#ff8f33;stroke-width:.7;stroke-linecap:round;filter:url(#glow)}.ember-ring{fill:none;stroke:#ff8f33;stroke-width:.5}
.spark{fill:url(#sparkG)}.smoke{fill:url(#smokeG)}.pool{fill:url(#poolG)}.air{fill:url(#airG);display:none}.spill{fill:url(#spillG)}.glow-in{fill:url(#lanIn)}.fabric{fill:url(#fabricG)}.lamp-halo{fill:url(#lanHalo)}.rimlit{fill:none;stroke:#ffa452;stroke-width:1.2;stroke-linecap:round;opacity:0}
.star{fill:var(--star);display:none;animation:twinkle 4.2s ease-in-out infinite}@keyframes twinkle{0%,100%{opacity:.85}50%{opacity:.3}}
.tongue,.halo,.bedglow,.coal,.crack,.ember-ring,.spark,.smoke,.pool,.air,.spill,.glow-in,.fabric,.lamp-halo,.rimlit,.star{pointer-events:none}
@media(prefers-color-scheme:dark){.air,.star{display:inline}}
@media(prefers-reduced-motion:reduce){.star{animation:none}}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.hit-line{fill:none;stroke:transparent;stroke-width:10;stroke-linecap:round}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}.grab{cursor:grab;touch-action:none}.dragging,.dragging .grab{cursor:grabbing}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}.stage-floor{transform:none}}`

const defs = `<radialGradient id="turfG" cx=".46" cy=".42" r=".62"><stop offset="0" style="stop-color:var(--grass-hi)"/><stop offset="1" style="stop-color:var(--grass)"/></radialGradient>
<radialGradient id="stoneG" cx=".36" cy=".3" r=".78"><stop offset="0" style="stop-color:var(--stone-top)"/><stop offset=".55" style="stop-color:var(--stone)"/><stop offset="1" style="stop-color:var(--stone-side)"/></radialGradient>
<linearGradient id="slopeG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--canvas-top)"/><stop offset="1" style="stop-color:var(--canvas)"/></linearGradient>
<linearGradient id="flameO" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ff9a2e"/><stop offset=".38" stop-color="#ff6a1f" stop-opacity=".95"/><stop offset=".72" stop-color="#e2401b" stop-opacity=".7"/><stop offset="1" stop-color="#c42a17" stop-opacity="0"/></linearGradient>
<linearGradient id="flameM" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#ffd25c"/><stop offset=".5" stop-color="#ffa22d" stop-opacity=".92"/><stop offset="1" stop-color="#ff7a1f" stop-opacity="0"/></linearGradient>
<linearGradient id="flameC" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fffbea"/><stop offset=".45" stop-color="#fff0b2" stop-opacity=".95"/><stop offset="1" stop-color="#ffd36a" stop-opacity="0"/></linearGradient>
<radialGradient id="haloG"><stop offset="0" stop-color="#ffb24a" stop-opacity=".6"/><stop offset=".3" stop-color="#ff9a3c" stop-opacity=".3"/><stop offset=".65" stop-color="#ff7a2a" stop-opacity=".09"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></radialGradient>
<radialGradient id="poolG"><stop offset="0" stop-color="#ffae55" stop-opacity=".62"/><stop offset=".22" stop-color="#ff9c45" stop-opacity=".4"/><stop offset=".5" stop-color="#ff8a3a" stop-opacity=".16"/><stop offset=".78" stop-color="#ff7a30" stop-opacity=".05"/><stop offset="1" stop-color="#ff7a30" stop-opacity="0"/></radialGradient>
<radialGradient id="airG"><stop offset="0" stop-color="#ffa54f" stop-opacity=".34"/><stop offset=".3" stop-color="#ff9443" stop-opacity=".17"/><stop offset=".62" stop-color="#ff8a3a" stop-opacity=".05"/><stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></radialGradient>
<radialGradient id="coalG"><stop offset="0" stop-color="#fff0b0"/><stop offset=".4" stop-color="#ff9a2e"/><stop offset="1" stop-color="#b8300f" stop-opacity=".2"/></radialGradient>
<radialGradient id="bedG"><stop offset="0" stop-color="#ffb347" stop-opacity=".95"/><stop offset=".5" stop-color="#ff6a1f" stop-opacity=".55"/><stop offset="1" stop-color="#9a2a10" stop-opacity="0"/></radialGradient>
<radialGradient id="sparkG"><stop offset="0" stop-color="#fffbe0"/><stop offset=".35" stop-color="#ffcf5a" stop-opacity=".9"/><stop offset="1" stop-color="#ff7a1a" stop-opacity="0"/></radialGradient>
<radialGradient id="smokeG"><stop offset="0" style="stop-color:var(--smoke)" stop-opacity=".55"/><stop offset="1" style="stop-color:var(--smoke)" stop-opacity="0"/></radialGradient>
<radialGradient id="lanIn" cx=".5" cy=".42" r=".7"><stop offset="0" stop-color="#ffe6a8"/><stop offset=".3" stop-color="#ffc062" stop-opacity=".92"/><stop offset=".75" stop-color="#d9772e" stop-opacity=".55"/><stop offset="1" stop-color="#8f4a1f" stop-opacity=".3"/></radialGradient>
<radialGradient id="lanHalo"><stop offset="0" stop-color="#ffd27a" stop-opacity=".75"/><stop offset=".45" stop-color="#ffb65c" stop-opacity=".25"/><stop offset="1" stop-color="#ffb65c" stop-opacity="0"/></radialGradient>
<radialGradient id="globeG" cx=".5" cy=".55" r=".6"><stop offset="0" stop-color="#fffbe6"/><stop offset=".55" stop-color="#ffd98a"/><stop offset="1" stop-color="#f5a24a"/></radialGradient>
<radialGradient id="spillG"><stop offset="0" stop-color="#ffc56b" stop-opacity=".6"/><stop offset=".5" stop-color="#ffb25a" stop-opacity=".2"/><stop offset="1" stop-color="#ffb25a" stop-opacity="0"/></radialGradient>
<radialGradient id="fabricG" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="40"><stop offset="0" stop-color="#ffcf78" stop-opacity=".85"/><stop offset=".45" stop-color="#ffb35c" stop-opacity=".38"/><stop offset="1" stop-color="#ff9f4a" stop-opacity=".06"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* ASKELD T–2 campsite. World: x lower-right, y lower-left (front faces +y), z up. 1 unit ≈ 4 cm.
Part                          x      y      z      w      d      h
turf                   a rounded patch 54 × 32 round (5, −5), 1.8 thick; a cleared ring of earth r 19 round the fire
tent (ridge along x)        −40    −25      0     40     36     31   fly 4 proud of the door gable at the ridge, 1 at the ground
door + lantern              gable u 8–28, to z 25.6; the storm lantern hangs in it from the ridge, a bedroll inside
guys + pegs                 door and back ends of the ridge, two off the front slope; pegs where the eave scallops dip
fire ring              eleven stones r 13 round (26, −8)                       ash bed r 10.8, coals, glow
logs                        two crossed (along x, along y) r 2.5 / 2.3; up to three more lean in as the fuel allows
log seat               r 5.2 along y at x 47, from y −10 to 12
roasting stick              rests along the seat from (47, −7, 10.9), its tip 21 out at z 14; swings round the ring's front to the fire
Painter: shadow, sky, turf, light pools, tent (gable, door, lantern, flaps, fly), firelight, fire (back stones, bed, logs,
flames, front stones), seat, stick, smoke, sparks; then the controls. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{C,S,P,set,SIDE,el,group,rect,circle,line,text,poly,cylinder}=kit(()=>root);
// Figure helpers: vectors and oriented planes, smooth curves through drawing points, round parts on any axis, flame tongues.
const{cos,sin,PI,hypot,atan2,min,max,exp,round}=Math,RAD=PI/180,clamp=(v,a=0,b=1)=>max(a,min(b,v)),f2=v=>(+v).toFixed(2),pt=q=>`${f2(q[0])},${f2(q[1])}`;
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(hypot(...a)||1)),VIEW=[1,1,1];
const plane=(o,U,V)=>`matrix(${[...P(...U),...P(...V),...P(...o)].map(v=>+v.toFixed(3)).join(' ')})`,iso=(x,y,z,r)=>{const c=P(x,y,z);return{cx:f2(c[0]),cy:f2(c[1]),rx:f2(r*1.2247),ry:f2(r*.7071)};};
function axes(n){const U=unit(Math.abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U);const a=P(...U),b=P(...V);if(a[0]*b[1]-a[1]*b[0]<0)V=mul(V,-1);return[U,V];}
let seed=29;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
/* Catmull-Rom through drawing points as cubic Béziers: `bend` continues a path from its first point, `curve` starts one. */
function bend(q,close=false){const n=q.length,at=i=>close?q[(i+n)%n]:q[max(0,min(n-1,i))];let d='';for(let i=0;i<(close?n:n-1);i++){const a=at(i-1),b=at(i),c=at(i+1),e=at(i+2);d+=`C${pt([b[0]+(c[0]-a[0])/6,b[1]+(c[1]-a[1])/6])} ${pt([c[0]-(e[0]-b[0])/6,c[1]-(e[1]-b[1])/6])} ${pt(c)}`;}return d;}
const curve=(q,close=false)=>`M${pt(q[0])}${bend(q,close)}${close?'Z':''}`;
/* A round part from a to b: its outline in the cross-section plane and the plane of its near end. */
function tubeAt(a,b,r){let ax=sub(b,a);if(dot(ax,VIEW)<0){[a,b]=[b,a];ax=mul(ax,-1);}const[U,V]=axes(unit(ax)),pu=P(...U),pv=P(...V),pd=P(...ax),det=pu[0]*pv[1]-pv[0]*pu[1]||1e-9,u=(pd[0]*pv[1]-pv[0]*pd[1])/det,v=(pu[0]*pd[1]-pd[0]*pu[1])/det,l=hypot(u,v)||1,tx=-v*r/l,ty=u*r/l;
return{d:`M${f2(tx)},${f2(ty)}A${r},${r} 0 0 1 ${f2(-tx)},${f2(-ty)}L${f2(u-tx)},${f2(v-ty)}A${r},${r} 0 0 1 ${f2(u+tx)},${f2(v+ty)}Z`,t:plane(a,U,V),cap:plane(b,U,V)};}
function tube(g,a,b,r,cls){const t=tubeAt(a,b,r);el('path',{d:t.d,transform:t.t,class:'face '+cls},g);circle(group(t.cap,g),0,0,r,'face top '+cls);}
/* A flame tongue: a teardrop from a round base to a sharp tip, its centerline swaying. */
function tongue(bx,by,hw,h,sway,wob,ph){const L=[],R=[];for(let i=0;i<=6;i++){const s=i/6,x=bx+sway*s**1.6+wob*sin(ph+s*3.6)*s,y=by-h*s,w=hw*(1-s)**.85*(1+.25*sin(PI*s));L.push([x-w,y]);R.unshift([x+w,y]);}const k=hw*.8;
return`M${pt(L[0])}${bend(L)}${bend(R)}C${pt([R[6][0],by+k])} ${pt([L[0][0],by+k])} ${pt(L[0])}Z`;}
// Floor: the house ground shadow, then the sky (its stars are placed once the frame is known).
const GX=5,GY=-5,FX=26,FY=-8;
const turf=[...Array(44)].map((_,i)=>{const a=i/44*2*PI,k=1+.035*sin(3*a+.7)+.02*sin(5*a+2.1),c=cos(a),s=sin(a);return P(GX+54*k*Math.sign(c)*Math.abs(c)**.83,GY+32*k*Math.sign(s)*Math.abs(s)**.83,0);});
for(const cls of['shadow stage-floor','stage-contact'])el('path',{d:curve(turf.map(q=>[q[0]+1.5,q[1]+3.6]),true),class:cls});
const SKY=el('g',{});
// Turf: its earth rim, the grass, a cleared ring of earth round the fire, tufts.
el('path',{d:curve(turf.map(q=>[q[0],q[1]+1.8]),true),class:'face rim'});el('path',{d:curve(turf,true),class:'face grass'});
el('path',{d:curve([...Array(22)].map((_,i)=>{const a=i/22*2*PI,r=19+1.6*sin(3*a+1)+.9*sin(7*a+.4);return P(FX+r*cos(a),FY+r*sin(a),0);}),true),class:'dirt'});
for(const[x,y,s]of[[-44,4,1],[-34,16,1.1],[-18,22,.9],[2,20,1],[8,-28,.9],[40,-26,.9],[52,0,.8],[34,22,1.1],[18,24,.9],[-6,24,.8]]){const[X,Y]=P(x,y,0);el('path',{d:`M${f2(X-1.5*s)},${f2(Y)}Q${f2(X-1.4*s)},${f2(Y-2.2*s)} ${f2(X-2.4*s)},${f2(Y-3.4*s)}M${f2(X)},${f2(Y)}Q${f2(X+.3*s)},${f2(Y-2.8*s)} ${f2(X-.2*s)},${f2(Y-4.4*s)}M${f2(X+1.5*s)},${f2(Y)}Q${f2(X+1.6*s)},${f2(Y-2*s)} ${f2(X+2.7*s)},${f2(Y-3*s)}`,class:'blade'});}
// Light on the ground: the fire's pool (it carries the night) and the lantern's spill from the door.
const X0=-40,X1=0,YF=11,YB=-25,YC=-7,H=31,W=YF-YB;
const pool=el('ellipse',{...iso(FX,FY,0,30),class:'pool'}),spill=el('ellipse',{...iso(X1+9,YC+2,0,12),class:'spill'});
// The tent. Its door gable, drawn in its plane (u back along −y from the front corner, v down): the dark inside, the
// lantern's warmth in it, a bedroll; the lantern hung from the ridge; the flaps rolled back and tied; the fly over it all.
const GB=group(SIDE(X1,YF,0));el('path',{d:`M0,0L${W},0L${YF-YC},${-H}Z`,class:'face gable'},GB);
const DOOR='M8,0C8,-10 12.6,-19.4 18,-25.6C23.4,-19.4 28,-10 28,0Z';el('path',{d:DOOR,class:'face inside'},GB);const glowIn=el('path',{d:DOOR,class:'glow-in'},GB);
rect(GB,10.8,-4.4,14.4,4.2,2,'face bag');line(GB,12.8,-2.3,23.4,-2.3,'stitch');
const LQ=P(X1,YC,12.4),LG=group(`translate(${f2(LQ[0])} ${f2(LQ[1])}) scale(1.15)`),lanHalo=circle(LG,0,-1,11,'lamp-halo');
el('path',{d:'M0,-10.2V-11.7M-2.5,-5.2C-2.5,-10.4 2.5,-10.4 2.5,-5.2',class:'wire'},LG);el('path',{d:'M-1.1,-6.2V-7.4H1.1V-6.2Z',class:'face enamel'},LG);el('path',{d:'M-3,-4.4Q0,-7.4 3,-4.4Z',class:'face top enamel'},LG);
const globe=el('path',{d:'M-2.1,-4.4C-3.3,-3 -3.3,1.6 -2.1,3L2.1,3C3.3,1.6 3.3,-3 2.1,-4.4Z',class:'globe'},LG);const wick=el('path',{d:tongue(0,1.6,.9,4,.2,.15,0),class:'tongue c'},LG);
el('path',{d:'M-1.2,-4.4C-1.9,-1.6 -1.9,.4 -1.2,3M1.2,-4.4C1.9,-1.6 1.9,.4 1.2,3',class:'wire'},LG);
el('path',{d:'M-3.2,3V5.4Q0,7.1 3.2,5.4V3Q0,4.4 -3.2,3Z',class:'face enamel'},LG);el('path',{d:'M-3.2,3Q0,1.6 3.2,3Q0,4.4 -3.2,3Z',class:'face top enamel'},LG);
const GB2=group(SIDE(X1,YF,0));for(const d of['M6.3,-.5C6.5,-9.2 10.8,-18.2 16.1,-24.2','M29.7,-.5C29.5,-9.2 25.2,-18.2 19.9,-24.2']){el('path',{d,class:'roll-u','stroke-width':3.8},GB2);el('path',{d,class:'roll','stroke-width':2.5},GB2);}
for(const u of[5.7,26.7])rect(GB2,u,-11.8,3.6,1.4,.5,'face rust');
const gableD=poly([[X1,YF,0],[X1,YB,0],[X1,YC,H]],true),fabG=el('path',{d:gableD,class:'fabric'});
el('path',{d:poly([[X1,YC,H],[X1+4,YC,H],[X1+1,YB,0],[X1,YB,0]],true),class:'face under'});
const PEGS=[X0-1,(X0+X1)/2,X1+1],RC=[(X0+X1)/2+.5,YC,H-3],R0=[X1+4,YC,H],R1=[X0-3,YC,H];
const slopeD=`M${pt(P(PEGS[0],YF,0))}Q${pt(P((PEGS[0]+PEGS[1])/2,YF,2.6))} ${pt(P(PEGS[1],YF,0))}Q${pt(P((PEGS[1]+PEGS[2])/2,YF,2.6))} ${pt(P(PEGS[2],YF,0))}L${pt(P(...R0))}Q${pt(P(...RC))} ${pt(P(...R1))}Z`;
el('path',{d:slopeD,class:'face slope'});const fabS=el('path',{d:slopeD,class:'fabric'});
const ridgeZ=x=>{const t=(R0[0]-x)/(R0[0]-R1[0]);return H-6*t*(1-t);},eaveZ=x=>{const[a,b]=x<PEGS[1]?[PEGS[0],PEGS[1]]:[PEGS[1],PEGS[2]],t=(x-a)/(b-a);return 5.2*t*(1-t);};
for(const x of[X0+10,X0+20,X0+30])el('path',{d:`M${pt(P(x,YC,ridgeZ(x)))}L${pt(P(x,YF,eaveZ(x)))}`,class:'seam'});
{const o=[0,1.3,-2.25];el('path',{d:`M${pt(P(...R0))}Q${pt(P(...RC))} ${pt(P(...R1))}L${pt(P(...add(R1,o)))}Q${pt(P(...add(RC,o)))} ${pt(P(...add(R0,o)))}Z`,class:'face rust'});}
{const g=group(plane([X1-9,YF-.28*18,.28*H],[1,0,0],[0,.502,-.865]));rect(g,-5.2,-1.5,10.4,3,.7,'face tag');text(g,0,.65,'ASKELD','serif center');}
const guy=(a,b)=>{el('path',{d:`M${pt(P(...a))}L${pt(P(...b))}`,class:'rope'});const q=P(...b);el('path',{d:`M${f2(q[0])},${f2(q[1]+.6)}V${f2(q[1]-2.2)}`,class:'peg'});};
guy(R0,[X1+9,YC-9,0]);guy(R1,[X0-7,YC,0]);for(const x of[X0+9,X0+31])guy([x,YF-.46*18,.46*H],[x+2,YF+10,0]);
for(const x of PEGS){const q=P(x,YF+.4,0);el('path',{d:`M${f2(q[0])},${f2(q[1]+.5)}V${f2(q[1]-1.8)}`,class:'peg'});}
for(const p of[R0,R1]){const q=P(...p);el('path',{d:`M${pt(q)}V${f2(q[1]-3)}`,class:'pole'});circle(root,q[0],q[1]-3.3,.8,'face top');}
// Firelight over the tent and the ground in front of it (the night's; nothing by day).
const air=el('ellipse',{class:'air'});
// The fire: the stones behind, the ash bed with its glow and coals, two crossed logs with their glowing cracks, up to
// three more leaning in, the halo, the flames, then the stones in front.
const stones=[...Array(11)].map((_,k)=>{const a=(k/11*360+8+rnd()*12-6)*RAD,r=13+rnd()*1.4-.7;return{x:FX+r*cos(a),y:FY+r*sin(a),s:3.4+rnd()*1.4,k:rnd()-.5};}).sort((p,q)=>p.x+p.y-q.x-q.y);
function stone(o){const c=P(o.x,o.y,0),w=o.s*1.32,h=o.s*1.08,b=o.s*.46,k=o.k*w*.5;el('path',{d:`M${pt([c[0]-w,c[1]])}C${pt([c[0]-w,c[1]-h*.95])} ${pt([c[0]-w*.3+k,c[1]-h*1.25])} ${pt([c[0]+w*.2+k,c[1]-h*1.08])}C${pt([c[0]+w*.8+k,c[1]-h*.9])} ${pt([c[0]+w,c[1]-h*.5])} ${pt([c[0]+w,c[1]])}C${pt([c[0]+w,c[1]+b])} ${pt([c[0]-w,c[1]+b])} ${pt([c[0]-w,c[1]])}Z`,class:'face stone'});}
for(const o of stones)if(o.x+o.y<FX+FY)stone(o);
el('ellipse',{...iso(FX,FY,0,10.8),class:'face ash'});const bedGlow=el('ellipse',{...iso(FX,FY,.3,9.5),class:'bedglow'});
const coals=[...Array(10)].map(()=>{const a=rnd()*2*PI,r=2+rnd()*7.4,c=P(FX+r*cos(a),FY+r*sin(a),.5);return{n:el('ellipse',{cx:f2(c[0]),cy:f2(c[1]),rx:f2(1.2+rnd()*.9),ry:f2(.7+rnd()*.45),class:'coal'}),ph:rnd()*6.3};});
const LA=cylinder(FX-10.5,FY+.8,2.5,2.5,21,'x','char'),LB=cylinder(FX-.8,FY-10.5,7,2.3,21,'y','char');for(const f of[LA.face,LB.face])circle(f,0,0,1.4,'ember-ring');
const cracks=el('g',{});for(const c of[[[FX-9,FY+.2,4.9],[FX-7.4,FY+.9,5],[FX-5.6,FY+.3,4.9],[FX-4,FY+1,5]],[[FX+3.6,FY+.4,4.9],[FX+5.4,FY+1,5],[FX+7.2,FY+.3,4.9],[FX+9.2,FY+.9,4.95]],[[FX-1.3,FY-9.4,9.2],[FX-.6,FY-7.6,9.3],[FX-1.4,FY-5.8,9.2],[FX-.7,FY-4,9.3]],[[FX-1.2,FY+3.6,9.2],[FX-.5,FY+5.4,9.3],[FX-1.3,FY+7.4,9.2],[FX-.6,FY+9.2,9.3]]])el('path',{d:curve(c.map(p=>P(...p))),class:'crack'},cracks);
const EXTRA=[[200,1.9,.5],[270,1.8,.72],[330,2,.9]].map(([deg,r,th])=>{const a=deg*RAD,b=[FX+9.6*cos(a),FY+9.6*sin(a),1.6],t=[FX-1.8*cos(a),FY-1.8*sin(a),12.5],g=el('g',{}),w=el('g',{},g),c=el('g',{},g);tube(w,b,t,r,'wood');tube(c,b,t,r,'char');return{g,c,th,shown:-1,char:-1,tr:''};});
const halo=el('circle',{class:'halo'}),FB=P(FX,FY,8.4);
const TONGUES=[['o',-6.6,3.6,.56,.3],['o',-2.4,5.4,1,1.9],['o',2.6,5,.8,3.2],['o',6.6,3.4,.5,4.4],['m',-3.6,3.2,.62,.8],['m',.4,4,.84,2.6],['m',3.9,2.8,.54,4],['c',-1,2.4,.48,1.4],['c',1.7,2,.4,3.1]].map(([k,dx,hw,rel,ph])=>({n:el('path',{class:'tongue '+k}),k,dx,hw,rel,ph}));
for(const o of stones)if(o.x+o.y>=FX+FY)stone(o);
// The log seat: its cut end ringed, bark along it, and the edge the fire lights at night.
const SEAT=cylinder(47,-10,5.2,5.2,22,'y','wood');for(const r of[3.7,2.1,.6])circle(SEAT.face,0,0,r,'ring');
for(const[f,y0,y1]of[[25,-7,4],[62,-2,10],[96,-8,-1],[110,2,10]]){const a=f*RAD,q=y=>P(47+5.2*cos(a),y,5.2+5.2*sin(a));el('path',{d:`M${pt(q(y0))}L${pt(q(y1))}`,class:'bark'});}
const seatLit=el('path',{d:`M${pt(P(47-3.68,-9,8.88))}L${pt(P(47-3.68,11.4,8.88))}`,class:'rimlit'});
// The roasting stick, resting on the seat, and its marshmallow; rebuilt from its angle as it swings.
const HX=47,HY=-7,HZ=10.9,TZ=14,LH=hypot(FX-HX,FY-HY),PF=(atan2(FY-HY,FX-HX)/RAD+360)%360,PR=95,PT=PF-2*Math.asin(9/(2*LH))/RAD,PMIN=PR-6,PMAX=PF+12;
const STK=el('g',{}),stickB=el('path',{class:'face stick'},STK),gripB=el('path',{class:'face grip'},STK),mallB=el('path',{class:'mallow'},STK),mallC=el('g',{},STK),mallCap=circle(mallC,0,0,2.1,'mallow'),mallFlame=el('path',{class:'tongue m',style:'opacity:0'},STK);
const tipAt=a=>[HX+LH*cos(a*RAD),HY+LH*sin(a*RAD),TZ],reach=a=>{const t=tipAt(a);return hypot(t[0]-FX,t[1]-FY);};
// Smoke and sparks (a fixed pool of each), then the controls.
const SMK=el('g',{}),puffs=[...Array(5)].map((_,i)=>({n:el('circle',{class:'smoke'},SMK),p:i/5}));
const SPK=el('g',{}),sparks=[...Array(16)].map(()=>({n:el('circle',{cx:f2(FB[0]),cy:f2(FB[1]),r:1,class:'spark',style:'opacity:0'},SPK),x:0,y:0,vx:0,vy:0,life:0,max:1,ph:rnd()*6.3}));
function button(g,label,extra={}){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0','aria-label':label,...extra}))set(g,k,v);return g;}
const outline=poly([R1,R0,[X1+1,YB,0],[X1+1,YF,0],[PEGS[0],YF,0]],true),tentBtn=button(el('g',{}),'Tent: light or dim the lantern (L)',{'aria-pressed':'true'});el('path',{d:outline,class:'hit'},tentBtn);el('path',{d:outline,class:'focus-ring'},tentBtn);
const fq=P(FX,FY,9),fireBtn=button(el('g',{}),'Campfire: add a log (Space)');el('circle',{cx:f2(fq[0]),cy:f2(fq[1]),r:19,class:'hit'},fireBtn);el('circle',{cx:f2(fq[0]),cy:f2(fq[1]),r:20.5,class:'focus-ring'},fireBtn);
const stickBtn=button(el('g',{}),'Roasting stick: drag it to the fire, or press T to toast',{class:'control grab','aria-pressed':'false'}),stickHit=el('path',{class:'hit-line'},stickBtn),mallHit=el('circle',{r:6,class:'hit'},stickBtn),stickRing=el('circle',{r:7.4,class:'focus-ring'},stickBtn);
// The frame: the turf, the tent and the smoke's reach above the fire; the stars in the sky it leaves.
const xs=turf.map(q=>q[0]),VX=min(...xs)-6,VY=-72,VW=max(...xs)-min(...xs)+12,VH=max(...turf.map(q=>q[1]))+10-VY;set(svg,'viewBox',[VX,VY,VW,VH].map(v=>+f2(v)).join(' '));
for(let i=0;i<22;i++){let x=0,y=0;for(let k=0;k<24;k++){x=VX+6+rnd()*(VW-12);y=VY+3+rnd()*28;if(!(x<20&&y>-63))break;}el('circle',{cx:f2(x),cy:f2(y),r:f2(rnd()<.22?.8:.32+rnd()*.32),class:'star',style:`animation-delay:${f2(-rnd()*4.2)}s`},SKY);}
{const g=svg.querySelector('#fabricG');set(g,'cx',f2(LQ[0]));set(g,'cy',f2(LQ[1]));set(g,'r',46);}
// State: the fuel burns down (a log adds to it and makes it flare), the lantern, the stick and its marshmallow.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),dark=matchMedia('(prefers-color-scheme: dark)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const RATE=160,LOG=.34,FIRES=['EMBERS','LOW','STEADY','ROARING'],STILL={EMBERS:.12,LOW:.38,STEADY:.68,ROARING:.95,FLARING:1.25},TOASTS=['RAW','GOLDEN','TOASTED','BURNT'],SHADE=[[0,[251,248,241]],[.3,[243,205,122]],[.55,[201,138,69]],[.8,[122,74,42]],[1,[46,34,28]]];
const base=f=>.1+.9*f**.9,toastOf=t=>t<.15?0:t<.45?1:t<.75?2:3;
let fuel=.62,flare=0,flareT=-1e9,level=base(fuel),lan=1,lanOn=true,psi=PR,psiV=0,want=PR,drag=null,skipClick=false,toast=0,onFire=false,cool=0,note='',noteT=0,last=0,lastUI=-1,fireName='',drawnFlames='',drawnStick='',drawnLan='',shade='',near=false,spawn=0,burst=0,dropI=-1,dropT=-1e9;
const fireOf=()=>flare>.3?'FLARING':fuel>=.8?'ROARING':fuel>=.42?'STEADY':fuel>=.14?'LOW':'EMBERS';fireName=fireOf();
const say=m=>{announcement.textContent=m;},flash=(m,ms=1800)=>{note=m;noteT=performance.now()+ms;lastUI=-1;};
let ac=null,nb=null;
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
function noise(dur,v,f,q=1,when=0){const a=ac;if(!a)return;try{if(!nb){nb=a.createBuffer(1,a.sampleRate,a.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}const t=a.currentTime+when,s=a.createBufferSource(),b=a.createBiquadFilter(),g=a.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;b.Q.value=q;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(b);b.connect(g);g.connect(a.destination);s.start(t,rnd()*.5,dur+.05);}catch(_){}}
function tone(f,dur,v,type='sine',when=0,f1=0){const a=ac;if(!a)return;try{const t=a.currentTime+when,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+.03);}catch(_){}}
const crackle=()=>noise(.01+rnd()*.03,.006+rnd()*.016,1600+rnd()*3000,3),thump=()=>{tone(88,.32,.05,'sine',0,46);noise(.6,.016,420,.7);for(let i=0;i<6;i++)noise(.025,.014,2000+rnd()*2000,3,.12+rnd()*.6);},click=on=>{tone(on?1800:1400,.018,.01,'square');if(on)noise(.25,.006,700,.9,.02);},pop=()=>tone(620,.07,.012,'sine',0,380),sizzle=()=>noise(.09,.004,5600,2);
function addLog(){audio();const was=fuel;fuel=min(1,fuel+LOG);flare=1;flareT=performance.now();burst+=12;dropI=-1;EXTRA.forEach((x,i)=>{if(was<=x.th&&fuel>x.th)dropI=i;});dropT=flareT;thump();flash('LOG ON · FLARING');say('A log on the fire. It flares up, then settles.');}
function lantern(){audio();lanOn=!lanOn;set(tentBtn,'aria-pressed',String(lanOn));click(lanOn);flash(lanOn?'LANTERN LIT':'LANTERN DIMMED');say(lanOn?'The lantern in the tent is lit.':'The lantern in the tent is dimmed.');}
function hold(to){want=to;near=reach(to)<16;set(stickBtn,'aria-pressed',String(near));lastUI=-1;}
function toastKey(){audio();const back=reach(want)<16;hold(back?PR:PT);say(back?`The marshmallow is back from the fire, ${TOASTS[toastOf(toast)].toLowerCase()}.`:'Holding the marshmallow over the fire.');}
function fresh(){audio();toast=0;onFire=false;cool=0;pop();flash('FRESH MARSHMALLOW');say('A fresh marshmallow on the stick.');}
// Drawing: the stick from its angle; the flames, glow, coals and light from the fire's level; sparks and smoke.
function drawStick(){const T=tipAt(psi),Hb=[HX,HY,HZ],u=unit(sub(T,Hb)),E=add(Hb,mul(u,-3.5));let t=tubeAt(E,add(T,mul(u,.6)),.7);set(stickB,'d',t.d);set(stickB,'transform',t.t);t=tubeAt(E,add(Hb,mul(u,1.5)),.85);set(gripB,'d',t.d);set(gripB,'transform',t.t);
t=tubeAt(add(T,mul(u,-4.4)),add(T,mul(u,-1)),2.1);set(mallB,'d',t.d);set(mallB,'transform',t.t);set(mallC,'transform',t.cap);
const m=P(...add(T,mul(u,-2.7))),e=P(...E),tp=P(...T);set(stickHit,'d',`M${pt(e)}L${pt(tp)}`);for(const n of[mallHit,stickRing]){set(n,'cx',f2(m[0]));set(n,'cy',f2(m[1]));}drawStick.m=m;}
function mallowShade(red,dk){const v=red?[0,.3,.6,.9][toastOf(toast)]:toast;let i=1;while(i<SHADE.length-1&&SHADE[i][0]<v)i++;const[a,ca]=SHADE[i-1],[b,cb]=SHADE[i],k=clamp((v-a)/(b-a)),c=ca.map((x,j)=>x+(cb[j]-x)*k).map(x=>x*(dk?.84:1));
const hex=c=>'#'+c.map(x=>round(clamp(x,0,255)).toString(16).padStart(2,'0')).join('');return[hex(c),hex(c.map(x=>x+(255-x)*.14))];}
const op=(n,v)=>{const s=f2(v);if(n._o!==s){n._o=s;n.style.opacity=s;}};
function paint(now,dt,red,dk){const t=red?1.3:now/1000,name=fireName,q=red?STILL[name]:min(1.25,level*(1+.06*sin(t*7.7)+.04*sin(t*13.3))),Hf=5+35*q,key=red?name+dk:'';
if(!red||key!==drawnFlames){drawnFlames=key;const wide=.55+.45*min(1,q/.7);for(const g of TONGUES){const lay=g.k==='o'?1:g.k==='m'?.78:.6,ph=g.ph,h=Hf*g.rel*lay*(1+.13*sin(t*6.3+ph*2)+.08*sin(t*11.7+ph*3.3)+.05*sin(t*19.1+ph));
set(g.n,'d',tongue(FB[0]+g.dx*wide,FB[1],g.hw*wide,h,1.4+2.2*sin(t*1.9+ph),1.2+.8*sin(t*2.3+ph*1.7),ph+t*2.4));op(g.n,g.k==='o'?.85+.15*min(1,q/.3):g.k==='m'?clamp((q-.08)/.2):clamp((q-.2)/.25));}
const hr=9+Hf*.95;set(halo,'cx',f2(FB[0]));set(halo,'cy',f2(FB[1]-Hf*.42));set(halo,'r',f2(hr));op(halo,min(1,q)*(dk?.95:.55));
const rg=20+14*min(1,q);set(pool,'rx',f2(rg*1.2247));set(pool,'ry',f2(rg*.7071));op(pool,min(1,q*1.1)*(dk?1:.22));
const ar=30+10*min(1,q);set(air,'cx',f2(FB[0]-8));set(air,'cy',f2(FB[1]-8));set(air,'rx',f2(ar));set(air,'ry',f2(ar*.8));op(air,min(1,q*1.1));
op(bedGlow,.55+.45*min(1,q));op(cracks,(.55+.45*(1-min(1,q)))*(.8+.2*sin(t*3.1)));op(seatLit,dk?min(1,q)*.75:0);
for(const c of coals)op(c.n,clamp(.4+.6*(1-q*.6))*(red?.9:.75+.25*sin(t*2.3+c.ph)));}
for(const[i,x]of EXTRA.entries()){const on=fuel>x.th?1:0,s=red?on:x.shown<0?on:clamp(x.shown+(on?dt/.25:-dt/.9)),ch=clamp((x.th+.22-fuel)/.22),c=red?round(ch*2)/2:ch;if(s!==x.shown){x.shown=s;op(x.g,s);set(x.g,'display',s>0?'inline':'none');}if(c!==x.char){x.char=c;op(x.c,c);}
const k=(now-dropT)/350,tr=!red&&i===dropI&&k<1?`translate(0 ${f2(-7*(1-k)**2)})`:'';if(tr!==x.tr){x.tr=tr;set(x.g,'transform',tr);}}
if(red)for(const s of sparks){if(s.life>0||s.n._o!=='0'){s.life=0;op(s.n,0);}}
else{spawn=min(4,spawn+dt*max(0,(q-.12)*10))+burst;burst=0;for(const s of sparks){if(s.life<=0&&spawn>=1){spawn-=1;s.max=s.life=1+rnd()*1.4;s.x=FB[0]+(rnd()-.5)*9;s.y=FB[1]-rnd()*Hf*.35;s.vx=(rnd()-.5)*8+3;s.vy=-(16+rnd()*20)*(.7+.4*min(1,q));}
if(s.life>0){s.life-=dt;s.vy*=exp(-dt*.5);s.x+=(s.vx+4*sin(t*2.6+s.ph))*dt;s.y+=s.vy*dt;const k=clamp(s.life/s.max);set(s.n,'cx',f2(s.x));set(s.n,'cy',f2(s.y));set(s.n,'r',f2(.45+.75*k));op(s.n,s.life>0?k**.6*(.65+.35*sin(t*31+s.ph)):0);}}spawn=min(spawn,4);}
const smk=.45+.55*(1-min(1,q));if(!red||key!==paint.smoke){paint.smoke=key;puffs.forEach((p,i)=>{if(!red)p.p=(p.p+dt/6.5)%1;const k=red?(i+1)/6:p.p;set(p.n,'cx',f2(FB[0]+2+k*20+sin(k*5+i)*1.6));set(p.n,'cy',f2(FB[1]-Hf*.8-k*38));set(p.n,'r',f2(1.6+k*5));op(p.n,sin(k*PI)*.3*smk);});}
const lf=lan*(red?1:1+.035*sin(t*8.3)+.025*sin(t*21.7)),lk=red?`${lan}${dk}`:'';if(!red||lk!==drawnLan){drawnLan=lk;op(glowIn,lf);op(lanHalo,lf*(dk?.9:.55));op(wick,lf);set(globe,'class',lan>.5?'globe lit':'globe');op(fabG,lf*(dk?.78:.18));op(fabS,lf*(dk?.66:.14));op(spill,lf*(dk?.85:.3));}
const sk=f2(psi);if(sk!==drawnStick){drawnStick=sk;drawStick();}
const[fill,cap]=mallowShade(red,dk),sh=fill+cap;if(sh!==shade){shade=sh;mallB.style.fill=fill;mallCap.style.fill=cap;}
if(onFire){const m=drawStick.m;set(mallFlame,'d',tongue(m[0],m[1]+.8,1.9,(red?7:7*(1+.18*sin(t*9)+.1*sin(t*17)))+2*toast,.6,.5,t*3));op(mallFlame,1);}else op(mallFlame,0);}
function ui(){const temp=round((420+560*min(1.2,level))/10)*10;readout.textContent=`${fireName} · ${temp} °C · FUEL ${round(fuel*100)}%`;
stateLabel.textContent=performance.now()<noteT?note:`${near?`TOASTING · ${toast<.15?'WARMING UP':TOASTS[toastOf(toast)]}`:`MARSHMALLOW ${TOASTS[toastOf(toast)]}`}${onFire?' · ON FIRE':''} · LANTERN ${lanOn?'ON':'OFF'}`;}
function tick(now){const dt=last?min((now-last)/1000,.05):0,red=reduced.matches,dk=dark.matches;last=now;
fuel=max(0,fuel-dt/RATE);flare=red?(now-flareT<2400?1:0):flare*exp(-dt/1.5);const target=base(fuel)*(1+.55*flare);level=red?target:level+(target-level)*(1-exp(-dt/(target>level?.18:.7)));
const name=fireOf();if(name!==fireName){const down=FIRES.indexOf(name)>=0&&FIRES.indexOf(name)<FIRES.indexOf(fireName);if(down&&name==='LOW')say('The fire is burning low.');if(down&&name==='EMBERS')say('The fire is down to embers. Space adds a log.');fireName=name;lastUI=-1;}
// The stick swings to where it's held (the pointer, while dragging); the marshmallow toasts by the heat at its tip.
const goal=drag&&drag.moved?drag.target:want;if(red){psi=goal;psiV=0;}else{const w=drag?16:6.5;psiV+=(w*w*(goal-psi)-2*w*psiV)*dt;psi+=psiV*dt;}
const d=reach(psi),inFl=d<4.8&&level>.18,heat=inFl?2.3*level:level*clamp((16-d)/10)**1.5,was=toastOf(toast);near=d<16;toast=min(1,toast+heat*dt/9);
if(inFl&&toast>.5&&!onFire){onFire=true;flash('ON FIRE · PULL IT BACK');say('The marshmallow caught fire. Pull it back.');}
if(onFire){toast=min(1,max(toast,.78)+dt*.3);if(d>10){cool+=dt;if(cool>.8||red){onFire=false;cool=0;say('The flame on the marshmallow went out.');}}else cool=0;}
const is=toastOf(toast);if(is!==was){if(!onFire){say(['A fresh marshmallow.','The marshmallow is golden.','The marshmallow is toasted brown.','The marshmallow is burnt. M puts on a fresh one.'][is]);if(is===3)flash('BURNT · M FOR A FRESH ONE');}lastUI=-1;}
if(ac){if(rnd()<dt*(1.5+9*level))crackle();if(heat>.35&&rnd()<dt*3)sizzle();}
paint(now,dt,red,dk);if(lastUI<0||now-lastUI>150){lastUI=now;ui();}requestAnimationFrame(tick);}
// Input: Space adds a log, L the lantern, T toasts, M a fresh marshmallow; the tent, the fire and the stick are buttons,
// and the stick drags round toward the fire (its pointer is captured, so a drag can end anywhere).
const act={' ':addLog,l:lantern,t:toastKey,m:fresh};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented||e.repeat)return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(k===' '&&e.target&&e.target.closest&&e.target.closest('[role=button]'))return;const fn=act[k];if(fn){e.preventDefault();fn();}});
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(tentBtn,lantern);bind(fireBtn,addLog);stickBtn.addEventListener('click',()=>{if(skipClick){skipClick=false;return;}toastKey();});stickBtn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)toastKey();}});
function local(e){const m=svg.getScreenCTM?.();if(!m)return null;const det=m.a*m.d-m.b*m.c;if(!det)return null;const x=e.clientX-m.e,y=e.clientY-m.f;return[(m.d*x-m.c*y)/det,(-m.b*x+m.a*y)/det];}
/* The angle that puts the tip under a drawing point: the point on the tip's plane (z = TZ) it shows, seen from the pivot. */
function aim(q){const a=q[0]/C,b=(q[1]+TZ)/S,c=(PMIN+PMAX)/2,ang=atan2((b-a)/2-HY,(a+b)/2-HX)/RAD;return clamp(c+((ang-c+540)%360)-180,PMIN,PMAX);}
stickBtn.addEventListener('pointerdown',e=>{if(e.button>0)return;audio();skipClick=false;drag={x:e.clientX,y:e.clientY,moved:false,target:psi};try{stickBtn.setPointerCapture?.(e.pointerId);}catch(_){}svg.classList.add('dragging');});
stickBtn.addEventListener('pointermove',e=>{if(!drag)return;if(!drag.moved&&hypot(e.clientX-drag.x,e.clientY-drag.y)<3)return;drag.moved=true;const q=local(e);if(q)drag.target=aim(q);});
function endDrag(){if(!drag)return;const g=drag;drag=null;svg.classList.remove('dragging');if(!g.moved)return;skipClick=true;hold(g.target);say(near?'Holding the marshmallow over the fire.':'The marshmallow is back from the fire.');}
for(const type of['pointerup','pointercancel','lostpointercapture'])stickBtn.addEventListener(type,endDrag);
paint(0,0,reduced.matches,dark.matches);ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
