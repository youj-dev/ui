// @ts-nocheck
/* AVEL M–04 · Lab microscope. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#c4c4c0;--ok:#15a65e;--metal:#d8d9d6;--metal-top:#f3f3f1;--metal-side:#bdbebb;--plate:#4a4a47;--plate-top:#5d5d5a;--plate-side:#3b3b39;--rubber:#2c2c2b;--slide:#f7f8f6;--lens:#2d2f30;--o0:#e5392b;--o1:#f0b13a;--o2:#3fb0e6;--f0:#ffd98c;--f1:#5f7cff;--f2:#22b573;--f3:#ff9a1f;--fc:var(--f0);--field:#fdfcf8;--tint:16%;--fh:.16;--cell:#3b5bfd}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#a5a5a2;--ok:#36d886;--metal:#b6b7b5;--metal-top:#e3e3e1;--metal-side:#858584;--plate:#3d3d3b;--plate-top:#565654;--plate-side:#272726;--rubber:#232323;--slide:#d0d1d0;--lens:#252627;--o0:#c12e23;--o1:#ca952f;--o2:#3494c2;--f0:#ffe2a3;--f1:#6f88ff;--f2:#36d886;--f3:#ffad3d;--field:#d5d4d2;--fh:.34;--cell:#4a62e8;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.08;filter:url(#soft)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .button-face{stroke:var(--accent)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.plate{fill:var(--plate)}.top.plate{fill:var(--plate-top)}.side.plate{fill:var(--plate-side)}.rubber{fill:var(--rubber)}.slide{fill:var(--slide)}.lens{fill:var(--lens)}.oc0{fill:var(--o0)}.oc1{fill:var(--o1)}.oc2{fill:var(--o2)}
.filt{stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke;fill-opacity:.82}.etch-l{fill:#d6d6d2;font:3px ui-monospace,monospace;letter-spacing:.4px;stroke:none}.tick-l{fill:none;stroke:#bdbdb9;stroke-width:.5;vector-effect:non-scaling-stroke}
.glow-c{fill:var(--fc);opacity:0;filter:url(#bloom);transition:opacity .4s,fill .4s;pointer-events:none}.powered .glow-c{opacity:var(--go,.55)}
.lit-lens{fill:var(--lens);transition:fill .4s}.powered .lit-lens{fill:var(--fc);filter:url(#glow)}
.beam{opacity:0;transition:opacity .4s;pointer-events:none}.powered .beam{opacity:1}.beam-s{stop-color:var(--fc)}
.led{fill:var(--off)}.powered .led{fill:var(--ok);filter:url(#glow)}
.fieldbg{fill:var(--glass);stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke;transition:fill .4s}.powered .fieldbg{fill:color-mix(in srgb,var(--fc) var(--tint),var(--field))}.fieldhalo{fill:var(--fc);opacity:0;filter:url(#bloom);transition:opacity .4s}.powered .fieldhalo{opacity:var(--fh)}
.view-content{opacity:0;transition:opacity .25s}.powered .view-content{opacity:1}.view-off{fill:var(--muted);font:7px ui-monospace,monospace;letter-spacing:1.1px;text-anchor:middle}.powered .view-off{opacity:0}
.cell-wall{fill:var(--cell);fill-opacity:.07;stroke:var(--cell);stroke-width:1.15;stroke-linejoin:round}.cell-inner{fill:none;stroke:var(--cell);stroke-width:.5;opacity:.3}.nucleus{fill:var(--cell);fill-opacity:.3;stroke:var(--cell);stroke-width:.7}.granule{fill:var(--cell);opacity:.5}
.reticle{fill:none;stroke:#2b2b2b;stroke-width:.6;opacity:.45}.view-label{fill:var(--ink);font:7px ui-monospace,monospace;letter-spacing:.7px;text-anchor:middle}.view-small{fill:var(--muted);font:5.5px ui-monospace,monospace;letter-spacing:.8px;text-anchor:middle}.scale-t{fill:#3a3a38;font:5px ui-monospace,monospace;letter-spacing:.6px;text-anchor:middle}
.quality-track{stroke:var(--rule);stroke-width:2;stroke-linecap:round}.quality-fill{stroke:var(--accent);stroke-width:2;stroke-linecap:round}.lead{fill:none;stroke:var(--muted);stroke-width:.65;stroke-dasharray:2 4;opacity:.6}
.travel{fill:var(--accent);stroke:none}.index{stroke:var(--accent);stroke-width:1.5;stroke-linecap:round}.optic-mark{fill:var(--ink);font:3.4px ui-monospace,monospace;text-anchor:middle;stroke:none}
.clip-under{fill:none;stroke:var(--line);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}.clip-strip{fill:none;stroke:var(--metal-top);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}.view-label{fill:var(--stage-ink)}.view-small{fill:var(--stage-muted)}}`

const defs = `<filter id="defocus" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur id="focusBlur" stdDeviation="0"/></filter>
<clipPath id="fieldClip"><circle r="80"/></clipPath>
<radialGradient id="vig"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".34"/></radialGradient>
<linearGradient id="beamG" x1="0" y1="1" x2="0" y2="0"><stop offset="0" class="beam-s" stop-opacity=".7"/><stop offset="1" class="beam-s" stop-opacity=".08"/></linearGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* AVEL M–04 binocular microscope. World: x lower-right, y lower-left, z up; 1 unit ≈ 1 mm.
Part                         x      y      z      w      d      h
rubber feet (4)         24/158 23/176      0     16     16      6
plinth                      12     10      6    178    194      8
base body                   16     14     14    170    186     22   switch, LED, vents, badge
lamp port               100,141     –     36    r22      –      4
filter turret            72,141     –     40    r34      –      3   clear / blue / green / amber, one over the lamp
arm saddle                  92     27     36     68     60     20
C-arm (extrusion)          113     30     45     35     74    227   recessed web, screws, focus scale
focus rack + cover          86     51     57     17     12    143
condenser bracket, carrier  69     61     78     62    110     12
condenser + iris lever  100,141     –     90    r18      –     20
stage carriage              77     61    128     56     52      8   moves ±8 with focus
X–Y drive knobs         154,160     –    106     r7      –     30
stage plate                 41     93    136    126     76      8   dark, aperture, vernier ticks
holder rail                 56    115    144     96      5      3
slide + jaw + spring        70    119  144.6     70     30      4   moves ±18 in x
coarse / fine focus    149/162     61    106  r20/r10  13/7      –
head support                94     72    244     44     35     16
binocular head              76     85    253     58     36     30
eyepieces (2)            93/117   108    283      r8    40° tilt  42
neck, nosepiece        105,120      –    195     r27      –     58   objectives at r21 with colour rings
optical field (screen)  232,−100   –      –     r80      –      –
Painter order: feet → base → turret → arm → rack → beam → condenser → stage → knobs → head → objectives → field. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: collect drawing into a group, extruded outlines, tilted tubes, front-half rings, pins.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function collect(parent,draw){const n=root.children.length;draw();while(root.children.length>n)parent.appendChild(root.children[n]);return parent;}
function facePath(points,cls,parent=root){return el('path',{d:poly(points,true),class:cls},parent);}
function armFace(x){return [[x,30,45],[x,30,211],[x,42,250],[x,87,272],[x,104,255],[x,72,230],[x,65,207],[x,65,80],[x,85,45]];}
function tiltedTube(x,y,z,r,h,cls=''){
const g=el('g'),a=C,b=S,c=-C*.77,d=S*.77+.64;
const f=(X,Y,Z)=>matrix(a,b,c,d,X,Y,Z),end=[x,y+.64*h,z+.77*h];
const p=P(x,y,z),q=P(...end),dx=q[0]-p[0],dy=q[1]-p[1],det=a*d-b*c;
const u=(d*dx-c*dy)/det,v=(-b*dx+a*dy)/det,l=Math.hypot(u,v),tx=-v*r/l,ty=u*r/l;
el('path',{d:`M${tx},${ty} A${r},${r} 0 0 1 ${-tx},${-ty} L${u-tx},${v-ty} A${r},${r} 0 0 1 ${u+tx},${v+ty} Z`,transform:f(x,y,z),class:'face '+cls},g);
const face=group(f(...end),g);circle(face,0,0,r,'face top '+cls);return{g,face,end};
}
function arcF(x,y,z,r,cls='detail'){const k=r/Math.SQRT2;el('path',{d:`M${k},${-k}A${r},${r} 0 0 1 ${-k},${k}`,class:cls},group(TOP(x,y,z)));}
function pin(g,x,y,r=.75){circle(g,x,y,r,'face top');line(g,x-r*.5,y+r*.35,x+r*.5,y-r*.35);}
// Base: feet, plinth, body with switch, LED, vents and badge.
const sh=P(110,108,0);el('ellipse',{cx:sh[0],cy:sh[1]+4,rx:150,ry:66,class:'shadow stage-floor'});el('ellipse',{cx:sh[0],cy:sh[1]+4,rx:150,ry:66,class:'stage-contact'});
for(const x of[24,158])for(const y of[23,176])box(x,y,0,16,16,6,3,'rubber');
box(12,10,6,178,194,8,6,'base');
box(16,14,14,170,186,22,8);
const BT=group(TOP(16,14,36));rect(BT,5,5,160,176,6,'detail');for(const[u,v]of[[11,11],[159,11],[11,170],[159,170]])pin(BT,u,v,1.2);
const badge=group(TOP(124,158,36.2));rect(badge,0,0,40,18,2.4,'face top');text(badge,20,8,'AVEL','label brand center');text(badge,20,14,'M–04','etch center');
const BFr=group(FRONT(16,200,36));line(BFr,6,18.5,164,18.5);slits(BFr,96,6,52,8,13);text(BFr,122,17,'LED · TRANSMITTED','etch micro center');
const lightControl=group('',BFr,{id:'lightControl',class:'control',role:'button',tabindex:'0','aria-label':'Toggle illuminator (L)','aria-pressed':'true'});
rect(lightControl,16,4.4,30,12.6,4,'face recess button-face');const rocker=rect(lightControl,30,6,14,9.4,2.4,'face top');line(lightControl,24,8,24,13);
rect(lightControl,12,2,38,17,4,'focus-ring');rect(lightControl,12,2,38,17,4,'hit');
circle(BFr,60,10.6,2.6,'face recess');circle(BFr,60,10.6,1.5,'led');text(BFr,60,17,'ON','etch micro center');
const BSd=group(SIDE(186,200,36));line(BSd,6,18.5,180,18.5);slits(BSd,124,5,46,9,12);pin(BSd,8,10,1.1);pin(BSd,178,10,1.1);
// Lamp port and the filter turret: the active window sits over the LED.
cylinder(100,141,36,22,4,'z','base');
const FT=cylinder(72,141,40,34,3,'z','metal');
const ftHit=group('',FT.g,{class:'control',role:'button',tabindex:'0','aria-label':'Filter turret: next filter (F)'});
const FW=group('rotate(0)',FT.face);
for(let i=0;i<36;i++){const a=i*Math.PI/18;line(FW,31.6*Math.cos(a),31.6*Math.sin(a),33.4*Math.cos(a),33.4*Math.sin(a));}
const FILTERS=['CLEAR','BLUE','GREEN','AMBER'];
FILTERS.forEach((n,i)=>{const a=-i*Math.PI/2,x=27*Math.cos(a),y=27*Math.sin(a);circle(FW,x,y,10.4,'face recess');const g=circle(FW,x,y,8.6,'face filt');set(g,'style',i?`fill:var(--f${i})`:'fill:var(--glass)');});
circle(FT.face,0,0,6.5,'face top metal');pin(FT.face,0,0,1.6);
const lampG=group(TOP(100,141,43.2));circle(lampG,27-27,0,15,'glow-c');circle(lampG,0,0,8.6,'lit-lens').style.fillOpacity='.85';
const fh=group(TOP(72,141,43),ftHit);circle(fh,0,0,36,'focus-ring');circle(fh,0,0,36,'hit');
// C-arm casting with a recessed web, saddle, rack and cover.
box(92,27,36,68,60,20,5,'base');
facePath(armFace(113),'face');
for(const i of[0,1,2,3,4,8]){const a=armFace(113)[i],b=armFace(113)[(i+1)%9],c=armFace(148)[(i+1)%9],d=armFace(148)[i];facePath([a,b,c,d],i===2||i===3?'face top':'face');}
facePath(armFace(148),'face side');
facePath([[148.2,37,72],[148.2,37,207],[148.2,48,242],[148.2,86,261],[148.2,94,254],[148.2,66,231],[148.2,57,210],[148.2,57,81]],'face base');
wire([[148.5,44,85],[148.5,44,205],[148.5,55,235],[148.5,84,251]]);
const armSide=group(SIDE(148.7,65,208));screw(armSide,23,0);screw(armSide,22,116);text(group(SIDE(148.7,57,200)),2,40,'AVEL','etch');
box(86,51,57,17,12,143,3,'base');
const rack=group(FRONT(89,63.2,195));rect(rack,0,0,11,130,2,'face recess');for(let y=5;y<127;y+=4)line(rack,2,y,9,y);
box(85,48,188,20,19,13,3);screw(group(FRONT(85,67.2,201)),10,6);
// Light path: a column from the active filter to the condenser, then condenser and iris lever.
const beam=el('g',{class:'beam'});
for(const[z0,z1,r]of[[43,82,8],[110,137,6]]){const a=P(100-r*.7,141+r*.7,z0),b=P(100+r*.7,141-r*.7,z0),c=P(100+r*.7,141-r*.7,z1),d=P(100-r*.7,141+r*.7,z1);el('path',{d:`M${a}L${b}L${c}L${d}Z`,fill:'url(#beamG)'},beam);}
box(91,61,78,18,100,8,3,'base');
box(69,120,82,62,51,8,4,'base');
const carrier=group(TOP(69,120,90.2));rect(carrier,5,5,52,41,3,'face recess');
cylinder(100,141,90,18,12,'z','metal');arcF(100,141,94,18);arcF(100,141,98,18);
const cnd=cylinder(100,141,102,15,8,'z','metal');circle(cnd.face,0,0,12,'face lens');circle(cnd.face,0,0,9.5,'lit-lens');circle(cnd.face,0,0,13,'glow-c').style.setProperty('--go','.35');
wire([[113,138,100],[130,141,102],[136,147,103]],'clip-under');wire([[113,138,100],[130,141,102],[136,147,103]],'clip-strip');cylinder(136,147,101,3,3,'z','rubber');
// Stage: carriage, X–Y knobs under the corner, dark plate with aperture and vernier, rail, moving slide holder.
const stageAssembly=el('g',{id:'stageAssembly'});let slideX;
collect(stageAssembly,()=>{
box(77,61,128,56,52,8,3,'base');const car=group(FRONT(77,113.2,136));pin(car,7,4,1.1);pin(car,49,4,1.1);
cylinder(154,160,112,2,24,'z','metal');cylinder(154,160,106,6,9,'z','rubber');cylinder(154,160,118,7.6,9,'z','rubber');arcF(154,160,122.5,7.6);
box(41,93,136,126,76,8,4,'plate');
const sp=group(TOP(41,93,144.1));rect(sp,4,4,118,68,3,'detail');for(const[u,v]of[[5.5,5.5],[120.5,5.5],[5.5,70.5],[120.5,70.5]])pin(sp,u,v,1.1);
circle(sp,64,48,12,'face recess');circle(sp,64,48,9,'glow-c').style.setProperty('--go','.6');
const sf=group(FRONT(41,169,144));for(let i=0;i<=50;i++)line(sf,13+i*2,0,13+i*2,i%5?1.8:3.2,'tick-l');text(sf,13,6.6,'0','etch-l center');text(sf,63,6.6,'50','etch-l center');text(sf,113,6.6,'100','etch-l center');
const ss=group(SIDE(167,169,144));for(let i=0;i<=30;i++)line(ss,8+i*2,0,8+i*2,i%5?1.8:3.2,'tick-l');
box(56,115,144,96,5,3,1,'metal');
slideX=el('g');collect(slideX,()=>{
box(68,118,144,7,10,4.2,1.2,'metal');
box(74,124,144.6,58,25,1.2,1.5,'slide');
const sample=group(TOP(74,124,145.9));rect(sample,2,2,11,21,1,'face top');line(sample,4,7,11,7);line(sample,4,10,11,10);text(sample,7.5,18,'04','etch center');
rect(sample,21,4,20,17,1.5,'face glass');el('path',{d:'M25,8 Q31,5 37,8 Q39,13 36,18 Q30,20 25,17 Q22,12 25,8Z',class:'detail'},sample);
rect(group(TOP(94,128,146.1)),0,0,22,17,1,'detail');
wire([[134,120,146.4],[142,127,146.6],[133.6,140,146.2]],'clip-under');wire([[134,120,146.4],[142,127,146.6],[133.6,140,146.2]],'clip-strip');
box(132,117,144,6,5,4,1.2,'metal');
});
circle(group(TOP(105,141,146.4)),0,0,7,'glow-c').style.setProperty('--go','.45');
});
// Coaxial focus knobs on the visible side; the fine knob nests in the coarse one.
const coarseBody=cylinder(149,61,106,20,13,'x','rubber');
const coarse=coarseBody.g;for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',id:'coarseFocus','aria-label':'Coarse focus: click upper half to raise, lower half to lower. Enter raises; Shift Enter lowers.'}))set(coarse,k,v);
circle(coarseBody.face,0,0,23,'focus-ring');
const coarseWheel=group('rotate(0)',coarseBody.face);
for(let i=0;i<40;i++){const a=i*Math.PI/20;line(coarseWheel,16.8*Math.cos(a),16.8*Math.sin(a),19.2*Math.cos(a),19.2*Math.sin(a));}
circle(coarseBody.face,0,0,14.6,'face metal');line(coarseWheel,0,-11,0,-14.4,'index');
const fineBody=cylinder(162,61,106,10,7,'x','rubber');
const fine=fineBody.g;for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',id:'fineFocus','aria-label':'Fine focus: click upper half to raise, lower half to lower. Enter raises; Shift Enter lowers.'}))set(fine,k,v);
circle(fineBody.face,0,0,12,'focus-ring');const fineWheel=group('rotate(0)',fineBody.face);
for(let i=0;i<20;i++){const a=i*Math.PI/10;line(fineWheel,7.6*Math.cos(a),7.6*Math.sin(a),9.4*Math.cos(a),9.4*Math.sin(a));}
line(fineWheel,0,-4,0,-6.8,'index');circle(fineBody.face,0,0,4.2,'face metal');
text(fineBody.face,0,-.8,'+','optic-mark');text(fineBody.face,0,3.6,'−','optic-mark');
const focusScale=group(SIDE(148.8,58,132));rect(focusScale,0,0,7,28,1,'face top');for(let y=4;y<26;y+=4)line(focusScale,2,y,5,y);const travelMark=rect(focusScale,0,13,7,2,0,'travel');
// Binocular head: support, body with prism cover, two tilted eyepieces with lit lenses.
box(94,72,244,44,35,16,5);
box(76,85,253,58,36,30,7);
const HF=group(FRONT(76,121,283));line(HF,5,24,53,24);screw(HF,6,7);screw(HF,52,7);text(HF,29,15.5,'AVEL','label brand center');
const HS=group(SIDE(134,121,283));line(HS,5,6,31,6);slits(HS,12,12,14,7,5);screw(HS,6,24);
box(84,89,283,42,24,6,5,'metal');const HT=group(TOP(84,89,289));for(let i=0;i<=8;i++)line(HT,13+i*2,3,13+i*2,i%4?5:6.4);text(HT,21,10.4,'IPD 64','etch micro center');
const eyeLens=[];
for(const x of[94,116]){
const t=tiltedTube(x,104,286,7.6,30,'metal');
const e=tiltedTube(x,104+.64*30,286+.77*30,9.2,5,'base');
const cup=tiltedTube(x,104+.64*35,286+.77*35,10.2,7.5,'rubber');
circle(cup.face,0,0,7.6,'face recess');circle(cup.face,0,0,5.6,'lit-lens');circle(cup.face,0,0,7,'glow-c').style.setProperty('--go','.4');el('path',{d:'M-3.4,-2.6 Q0,-5 3.6,-3.2',class:'detail',opacity:.55},cup.face);
eyeLens.push(cup.face);
}
// Nosepiece: neck, then objectives re-painted back to front while the turret indexes.
cylinder(105,120,208,12,45,'z','base');arcF(105,120,243,12);arcF(105,120,249,12);
const rotor=el('g',{id:'rotor'}),magnifications=[4,10,40],lengths=[24,31,39];
function drawRotor(angle,selected){
const active=document.activeElement?.getAttribute('data-objective');
rotor.replaceChildren();collect(rotor,()=>{
const positions=magnifications.map((m,i)=>{const a=angle+i*Math.PI*2/3;return{i,m,x:105+Math.cos(a)*21,y:120+Math.sin(a)*21};}).sort((a,b)=>(a.x+a.y)-(b.x+b.y));
function objective(p){
const holder=el('g',{class:'control',role:'button',tabindex:'0','aria-label':`Select ${p.m} times objective (${p.i+1})`,'aria-pressed':p.i===selected,'data-objective':p.i});
collect(holder,()=>{
cylinder(p.x,p.y,195,8.5,7,'z','base');
const bottom=196-lengths[p.i];cylinder(p.x,p.y,bottom+7,7,lengths[p.i]-7,'z','metal');
cylinder(p.x,p.y,bottom+lengths[p.i]-11,7.15,2.2,'z','oc'+p.i);
cylinder(p.x,p.y,bottom,5.3,8,'z','base');ellipse(p.x,p.y,bottom+.2,3.8,'z','face lens');
if(p.i===selected)ellipse(p.x,p.y,bottom+.25,3,'z','lit-lens');
text(group(FRONT(p.x-5.8,p.y+6.4,bottom+lengths[p.i]-13)),5.8,4.4,p.m+'×','optic-mark');
const hit=group(FRONT(p.x,p.y+8,199));rect(hit,-12,-3,24,lengths[p.i]+9,5,'hit');rect(hit,-10,-2,20,lengths[p.i]+7,4,'focus-ring');
});bind(holder,()=>choose(p.i));
}
positions.filter(p=>p.x+p.y<225).forEach(objective);
cylinder(105,120,201,27,7,'z','base');
const disc=group(TOP(105,120,208.2));circle(disc,0,0,23,'face top');circle(disc,0,0,11.8,'face recess');screw(disc,0,0);
for(let i=0;i<18;i++){const a=angle+i*Math.PI/9;line(disc,24*Math.cos(a),24*Math.sin(a),26*Math.cos(a),26*Math.sin(a));}
for(let i=0;i<3;i++){const a=angle+i*Math.PI*2/3;circle(disc,18*Math.cos(a),18*Math.sin(a),2,'face base');}
positions.filter(p=>p.x+p.y>=225).forEach(objective);
});
if(active!==null)rotor.querySelector(`[data-objective="${active}"]`)?.focus({preventScroll:true});
}
const turret=group(TOP(105,120,209),root,{id:'turretControl',class:'control',role:'button',tabindex:'0','aria-label':'Revolve nosepiece to the next objective. Keys 1, 2 and 3 select directly.'});circle(turret,0,0,32,'hit');circle(turret,0,0,30,'focus-ring');
wire([[105,147,211],[105,152,211]],'index');
// Optical field, joined to the right eyepiece by a leader.
const FX=236,FY=-98,FR=80;
const ep=P(116,104+.64*42.5,286+.77*42.5);el('path',{d:`M${ep[0]+9},${ep[1]-2} L${FX-FR-30},${FY-26} L${FX-FR-10},${FY-26}`,class:'lead'});
const view=group(`translate(${FX} ${FY})`,root,{id:'specimenView','aria-hidden':'true'});
circle(view,0,0,FR+20,'fieldhalo');circle(view,0,0,FR+9,'face top');circle(view,0,0,FR+4.5,'face base');circle(view,0,0,FR,'fieldbg');
for(let i=0;i<48;i++){const a=i*Math.PI/24;line(view,(FR+5.6)*Math.cos(a),(FR+5.6)*Math.sin(a),(FR+(i%4?7:8.4))*Math.cos(a),(FR+(i%4?7:8.4))*Math.sin(a));}
const field=el('g',{'clip-path':'url(#fieldClip)'},view),content=el('g',{class:'view-content'},field);
const blurred=el('g',{filter:'url(#defocus)'},content),cells=group('scale(1)',blurred);
for(let row=-5;row<=5;row++)for(let col=-7;col<=7;col++){
const x=col*33+(row%2)*16,y=row*24,g=group(`translate(${x} ${y})`,cells),s=(row+6)*7+col+8;
el('path',{d:`M-14,-10 Q-1,${-13+s%3} 14,-10 Q17,0 14,10 Q0,13 -14,10 Q-17,1 -14,-10 Z`,class:'cell-wall'},g);
el('path',{d:'M-9,-5 Q0,-9 9,-6 Q13,0 8,6 Q0,9 -10,5 Q-12,0 -9,-5 Z',class:'cell-inner'},g);
el('ellipse',{cx:8-s%4,cy:-5+s%5,rx:3.2,ry:2.8,class:'nucleus'},g);circle(g,8-s%4,-5+s%5,.8,'granule');
for(let k=0;k<4;k++)circle(g,-10+(s*3+k*5)%22,-7+(s+k*7)%15,.55,'granule');
}
circle(content,0,0,FR,'').setAttribute('fill','url(#vig)');
line(content,-7,0,-2,0,'reticle');line(content,2,0,7,0,'reticle');line(content,0,-7,0,-2,'reticle');line(content,0,2,0,7,'reticle');
line(content,-20,52,20,52,'reticle');line(content,-20,49,-20,55,'reticle');line(content,20,49,20,55,'reticle');
const scaleText=text(content,0,62,'200 µm','scale-t');
text(view,0,-3,'ILLUMINATOR','view-off');text(view,0,8,'OFF / L','view-off');
const fieldTitle=text(view,0,-FR-17,'10× / OBJECTIVE 02','view-label');text(view,0,FR+22,'04 · EPIDERMIS','view-label');
const fieldStatus=text(view,0,FR+33,'IN FOCUS','view-small');line(view,-28,FR+42,28,FR+42,'quality-track');const qualityBar=line(view,-28,FR+42,28,FR+42,'quality-fill');
frame([[12,10,0,178,194,36],[76,85,253,58,60,76],[149,41,86,20,40,40],[41,93,128,126,76,25]],12);
const vb=svg.getAttribute('viewBox').split(' ').map(Number),L0=vb[0],T0=Math.min(vb[1],FY-FR-28),R0=Math.max(vb[0]+vb[2],FX+FR+16),B0=Math.max(vb[1]+vb[3],FY+FR+50);
set(svg,'viewBox',`${L0} ${T0} ${R0-L0} ${B0-T0}`);
// State: objective, focus, stage x, filter and light drive the stand, the light path and the optical field.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const focusBlur=document.getElementById('focusBlur'),targets=[44,56,68],zooms=[.6,1.5,6];
let selected=1,focus=56,focusShown=56,light=true,angle=-Math.PI/6,rotation=null,last=-1,notice='',noticeUntil=0,stageX=0,stageShown=0,filt=0,filtShown=0,ac=null;
function say(s){announcement.textContent=s;}
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tick2(f,d=.03,v=.012){if(!ac)return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.02);}
function bind(g,fn){g.addEventListener('click',e=>{e.stopPropagation();fn(e);});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn(e);}});}
function inform(s){notice=s;noticeUntil=performance.now()+1000;update();}
function choose(i){
audio();selected=i;const destination=Math.PI/2-i*Math.PI*2/3;
let turn=((destination-angle+Math.PI*3)%(Math.PI*2))-Math.PI;
if(Math.abs(turn)<.001){drawRotor(angle,selected);inform(magnifications[i]+'× INDEXED');return;}
rotation={from:angle,to:angle+turn,start:performance.now(),duration:600};tick2(520,.05);
if(reduced.matches){angle=rotation.to;rotation=null;drawRotor(angle,selected);}
inform(magnifications[i]+'× INDEXING');say(magnifications[i]+' times objective selected. Use up and down to focus.');
}
function focusBy(amount){audio();focus=clamp(focus+amount,0,100);if(reduced.matches)focusShown=focus;tick2(1400,.015,.006);inform(amount>0?'STAGE RAISED':'STAGE LOWERED');say(`Focus ${Math.round(focus)} percent. ${quality(focus)>90?'In focus.':'Adjust focus with up or down.'}`);}
function moveStage(d){audio();const was=stageX;stageX=clamp(stageX+d,-18,18);if(reduced.matches)stageShown=stageX;tick2(900,.02,.008);inform(stageX===was?'STAGE AT LIMIT':`STAGE X ${stageX>0?'+':''}${(stageX/10).toFixed(1)} mm`);say(`Slide moved to ${(stageX/10).toFixed(1)} millimetres.`);}
function nextFilter(){audio();filt=(filt+1)%4;if(reduced.matches)filtShown=filt;svg.style.setProperty('--fc',`var(--f${filt})`);tick2(700,.04,.012);inform(FILTERS[filt]+' FILTER');say(`${FILTERS[filt].toLowerCase()} filter in the light path.`);}
function toggleLight(){audio();light=!light;svg.classList.toggle('powered',light);set(lightControl,'aria-pressed',light);set(rocker,'x',light?30:18);tick2(light?330:250,.05,.015);inform(light?'ILLUMINATOR ON':'ILLUMINATOR OFF');say(light?'Illuminator on.':'Illuminator off.');}
function knob(g,face,step){bind(g,e=>{let direction=e.shiftKey?-1:1;if(e.type==='click'&&e.detail!==0){const p=svg.createSVGPoint();p.x=e.clientX;p.y=e.clientY;const local=p.matrixTransform(face.getScreenCTM().inverse());direction=local.y<0?1:-1;}focusBy(step*direction);});}
knob(coarse,coarseBody.face,8);knob(fine,fineBody.face,2);bind(turret,()=>choose((selected+1)%3));bind(lightControl,toggleLight);bind(ftHit,nextFilter);
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey)return;
const action={'1':()=>choose(0),'2':()=>choose(1),'3':()=>choose(2),ArrowUp:()=>focusBy(2),ArrowDown:()=>focusBy(-2),ArrowLeft:()=>moveStage(-3),ArrowRight:()=>moveStage(3),l:toggleLight,L:toggleLight,f:nextFilter,F:nextFilter}[e.key];
if(action){e.preventDefault();if(!e.repeat||e.key.startsWith('Arrow'))action();}
});
function quality(f){return Math.round(100*Math.exp(-Math.pow((f-targets[selected])/(selected===2?8:15),2)));}
function update(){
const q=quality(focusShown),sharp=q>=90;
set(stageAssembly,'transform',`translate(0 ${(-(focusShown-50)*.16).toFixed(2)})`);
set(slideX,'transform',`translate(${(stageShown*C).toFixed(2)} ${(stageShown*S).toFixed(2)})`);
set(coarseWheel,'transform',`rotate(${-focusShown*3.6})`);set(fineWheel,'transform',`rotate(${-focusShown*18})`);set(travelMark,'y',25-focusShown*.22);
set(FW,'transform',`rotate(${(filtShown*90).toFixed(2)})`);
const blur=Math.min(4.4,Math.abs(focusShown-targets[selected])*(selected===2?.22:.13));set(focusBlur,'stdDeviation',blur.toFixed(2));
set(cells,'transform',`scale(${zooms[selected]}) translate(${(-stageShown*2.2).toFixed(2)} 0)`);set(qualityBar,'x2',-28+56*(light?q/100:0));set(qualityBar,'opacity',light?1:0);
readout.textContent=`${magnifications[selected]}× · ${(focus*.016).toFixed(2)} mm`;
fieldTitle.textContent=`${magnifications[selected]}× / OBJECTIVE 0${selected+1}`;scaleText.textContent=['500 µm','200 µm','50 µm'][selected];
fieldStatus.textContent=!light?'NO TRANSMITTED LIGHT':sharp?`IN FOCUS · ${FILTERS[filt]}`:`FOCUS ${q}% · ${focusShown<targets[selected]?'↑':'↓'}`;
stateLabel.textContent=performance.now()<noticeUntil?notice:!light?'LIGHT OFF':rotation?'NOSEPIECE INDEXING':`${sharp?'IN FOCUS':'FOCUS '+q+'%'} · ${filt?FILTERS[filt]+' FILTER':'LIGHT ON'}`;
}
function tick(now){
const dt=last<0?16:Math.min(50,now-last),red=reduced.matches;last=now;
if(rotation){const t=clamp((now-rotation.start)/rotation.duration),ease=t*t*(3-2*t);angle=rotation.from+(rotation.to-rotation.from)*ease;drawRotor(angle,selected);if(t>=1){rotation=null;notice='';noticeUntil=0;say(magnifications[selected]+' times objective indexed.');}}
const k=1-Math.exp(-dt/100);
if(red){focusShown=focus;stageShown=stageX;filtShown=filt;}
else{focusShown+=(focus-focusShown)*k;stageShown+=(stageX-stageShown)*k;const ft=filt===0&&filtShown>2?4:filt;filtShown+=(ft-filtShown)*(1-Math.exp(-dt/130));if(Math.abs(ft-filtShown)<.002)filtShown=filt;}
update();requestAnimationFrame(tick);
}
svg.classList.add('powered');set(rocker,'x',30);drawRotor(angle,selected);update();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], draw }
