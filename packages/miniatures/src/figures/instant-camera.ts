// @ts-nocheck
/* ORLUN F–08 · Instant camera. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--base-top:#cbcbc7;--base-side:#a4a4a1;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--chrome:#d4d5d2;--chrome-top:#efefec;--chrome-side:#b6b7b4;--rubber:#3a3a38;--rubber-top:#4d4d4b;--rubber-side:#2c2c2b;--grain:#000;--grain-a:.22;--optics:#1d2226;--flash:#fbfaf2;--paper:#fffdf5;--blank:#39414a;--lens-a:#7d97a3;--lens-b:#24363f;--lens-c:#0d1519;--coat-a:#d68be6;--coat-b:#7fe0bd}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--base-top:#bebeba;--base-side:#737372;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--chrome:#b3b3b1;--chrome-top:#e0e0dd;--chrome-side:#80807f;--rubber:#2f2f2e;--rubber-top:#474746;--rubber-side:#1c1c1c;--grain:#000000;--optics:#181b1d;--flash:#d3d3ce;--paper:#d7d5d0;--blank:#30353b;--lens-a:#687f89;--lens-b:#1d2c34;--lens-c:#0b1012;--coat-a:#b474c2;--coat-b:#6abd9f;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.top.base{fill:var(--base-top)}.side.base{fill:var(--base-side)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}.side.rubber{fill:var(--rubber-side)}.optics{fill:var(--optics)}.flash{fill:var(--flash)}.grain{fill:url(#grain);stroke:none;pointer-events:none}
.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.knurl{fill:none;stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke;opacity:.85}.accent{fill:var(--accent);stroke:var(--accent)}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.6px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.08;filter:url(#soft)}
.control{cursor:pointer;outline:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .button-face{fill:var(--top)}.press{transition:transform .1s}.pressed .press{transform:translate(1.4px,1.4px)}.control[aria-disabled="true"]{cursor:default}.hit{fill:transparent;stroke:none}
.strap-under{fill:none;stroke:var(--line);stroke-width:4.4;stroke-linejoin:round;stroke-linecap:round}.strap{fill:none;stroke:var(--rubber);stroke-width:3;stroke-linejoin:round;stroke-linecap:round}.stitch{fill:none;stroke:var(--muted);stroke-width:.5;stroke-dasharray:1 1.2;vector-effect:non-scaling-stroke}
.lamp{fill:var(--off);stroke:none;transition:fill .2s}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.r,.lamp.b{filter:url(#glow)}.blink{animation:blink .7s steps(1) infinite}
.seg{fill:var(--accent);font:700 8px ui-monospace,monospace;letter-spacing:1px;text-anchor:middle;stroke:none}.seg-halo{fill:var(--accent);opacity:.18;filter:url(#bloom)}.door-open .seg{opacity:.35}
.flash-lit{fill:var(--flash);opacity:0;transition:opacity .3s}.charged .flash-lit{opacity:.75;filter:url(#soft)}.flash-switch{fill:var(--top)}.flash-enabled .flash-switch{fill:var(--accent)}
.flash-burst{fill:#fffff2;filter:url(#bloom);opacity:0;pointer-events:none}.beam{opacity:0;pointer-events:none}.shut{fill:var(--accent);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}
.paper{fill:var(--paper);stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke;stroke-linejoin:round}.blank{fill:var(--blank)}.photo-ink{fill:#778071;font:3px ui-monospace,monospace;letter-spacing:.5px}.printer-shadow{fill:var(--shadow);opacity:.12;filter:url(#soft);pointer-events:none}.print-control:hover .paper{stroke:var(--accent)}.slot-line{stroke:var(--rubber);stroke-width:1.2}
.coat{fill:none;stroke-width:1;stroke-linecap:round;opacity:.55}
@keyframes blink{50%{opacity:.25}}
@media(prefers-reduced-motion:reduce){.pressed .press{transform:none}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<pattern id="grain" width="2.4" height="2.4" patternUnits="userSpaceOnUse"><circle cx=".6" cy=".7" r=".42" style="fill:var(--grain);fill-opacity:var(--grain-a)"/><circle cx="1.8" cy="1.9" r=".34" style="fill:var(--grain);fill-opacity:var(--grain-a)"/></pattern>
<radialGradient id="lensGlass" cx="32%" cy="25%" r="80%"><stop offset="0" style="stop-color:var(--lens-a)"/><stop offset=".45" style="stop-color:var(--lens-b)"/><stop offset="1" style="stop-color:var(--lens-c)"/></radialGradient>
<linearGradient id="sky" x2="0" y2="1"><stop stop-color="#ebbc9f"/><stop offset="1" stop-color="#f6dfbd"/></linearGradient>
<linearGradient id="beamG" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fffbe6" stop-opacity=".8"/><stop offset="1" stop-color="#fffbe6" stop-opacity="0"/></linearGradient>
<clipPath id="paperSlot"><rect x="-2" y="0" width="110" height="160"/></clipPath>
<clipPath id="photoClip"><rect x="8" y="8" width="90" height="96" rx=".8"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* World coordinates: x lower-right; y lower-left; z up. 1 unit ≈ 0.8 mm.
Part                        x      y      z      w      d      h
feet (4)                29/177  27/103     0     16     14      6
film chassis               16     17      6    194    105     31
camera body                20     20     37    186     94    102
top plate                  24     24    139    178     86      4
counter window             38     36    143     34     17      0
exposure dial             146     54    143     r9      –      4
shutter collar + button   176     84    143    r13      –    6.6
side grip (leatherette)   206     26     44      0     82     62
strap lug + wrist strap   206     34     44     30     16     78
front leatherette + trim   24    114     44    178      0     64
flash housing + switch     28    114    106     56      4     30
self-timer lamp           118    114    124     r3      –      –
light meter cell          134    114    124     r5      –      –
viewfinder                150    114    112     36      4     22
ready lamp                194    114    124     r3      –      –
brand plate               160    114     61     36      0     12
lens mount                100    114     78    r34      4      –
fixed sleeve + scale      100    118     78  r28.5     10      –
moving barrel + ring      100    124     78  r26.5     12      –
zoom travel                 0      0      0      0      6      0
film door (hinged)         25    122      9    176      0     25
cassette + rollers         39    122     11    146      1     19
print (slides out)         55    122     25    106    132     .6
flash beam                 28    118    106    112    130     60
Seams, screws, glass and labels share their parent face. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: knurled rings, smooth strap, convex hull for the flash beam.
const f2=v=>(+v).toFixed(2);
function knurl(g,r0,r1,n){for(let i=0;i<n;i++){const a=i*2*Math.PI/n;line(g,f2(r0*Math.cos(a)),f2(r0*Math.sin(a)),f2(r1*Math.cos(a)),f2(r1*Math.sin(a)),'knurl');}}
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];for(const p of pts){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(const p of pts.reverse()){while(up.length>1&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p);}return lo.slice(0,-1).concat(up.slice(0,-1));}
// Assembly: shadow, feet, chassis, body, top plate, side, strap, front, lens, film door, print.
const sh=P(117,82,0);el('ellipse',{cx:sh[0],cy:sh[1]+4,rx:144,ry:50,class:'shadow stage-floor'});el('ellipse',{cx:sh[0],cy:sh[1]+4,rx:144,ry:50,class:'stage-contact'});
for(const[x,y]of[[29,27],[29,103],[177,27],[177,103]])box(x,y,0,16,14,6,3,'rubber');
box(16,17,6,194,105,31,5,'base');
wire([[210,23,14],[210,116,14]]);wire([[21,122,14],[205,122,14]]);
const cs=group(SIDE(210.2,112,33));slits(cs,15,6,48,7,11);screw(cs,5,19);screw(cs,88,19);text(cs,78,10.5,'ISO 640','etch micro center');
box(20,20,37,186,94,102,8);
box(24,24,139,178,86,4,4,'');
const tp=group(TOP(24,24,143.05));
for(const[u,v]of[[5,5],[173,5],[5,81],[173,81]])screw(tp,u,v);
rect(tp,14,12,34,17,3,'face recess');rect(tp,16,14,30,13,2,'face glass');rect(tp,18,16,26,9,1.5,'seg-halo');
const countText=text(tp,31,23.6,'08','seg');text(tp,31,32.6,'EXPOSURES','etch micro center');
text(tp,64,22,'ORLUN · F–08','etch');line(tp,64,25,104,25);
const dial=cylinder(146,54,143,9,4,'z','chrome').face;knurl(dial,7.6,8.8,30);circle(dial,0,0,5.4,'detail');line(dial,0,-1.5,0,-5.2);
for(const[t,a]of[['L',-130],['·',-90],['D',-50]]){const r=a*Math.PI/180;text(group(TOP(146+12.4*Math.cos(r),54+12.4*Math.sin(r),143.1)),0,1,t,'etch micro center');}
cylinder(176,84,143,12.6,1.8,'z','chrome');cylinder(176,84,144.8,9.6,2.2,'z','rubber');
const shutterControl=group(TOP(176,84,147.05),root,{id:'shutterControl',class:'control',role:'button',tabindex:'0','aria-label':'Release shutter (Space)','aria-disabled':'false'});
rect(shutterControl,-22,-22,44,44,8,'hit');circle(shutterControl,0,0,15,'focus-ring');
const shutterPress=group('translate(0 0)',shutterControl,{class:'press'});
circle(shutterPress,0,0,9.6,'face top chrome button-face');circle(shutterPress,0,0,6.6,'shut');circle(shutterPress,-1.8,-2,1.3,'face top');
text(group(TOP(176,84,143.1)),0,19,'SHUTTER','etch micro center');
// Right side: leatherette grip, lug and wrist strap.
const sd=group(SIDE(206.2,114,139));
rect(sd,5,33,84,62,3,'face rubber');rect(sd,5,33,84,62,3,'grain');line(sd,5,31,89,31);
for(const[u,v]of[[6,6],[88,6]])screw(sd,u,v);rect(sd,10,9,14,15,2.5,'face rubber');line(sd,13,13,21,13);text(sd,17,29,'USB','etch micro center');
box(206,34,116,4,9,10,2,'chrome');const lugF=group(SIDE(210.2,43,126));rect(lugF,2,2.5,5,5,2.5,'face recess');
const strapD=smooth([[209,38.5,121],[214,40,110],[218,41,94],[226,43,76],[229,45,58],[223,45,46],[215,43,52],[214,41,72],[217,40,92],[212,39,112],[209,38.5,120]]);
el('path',{d:strapD,class:'strap-under'});el('path',{d:strapD,class:'strap'});el('path',{d:strapD,class:'stitch'});
box(214.5,38.5,88,6,4,7,2,'chrome');
// Front: aluminium band, leatherette, flash, viewfinder, meter, lamps, brand.
const fr=group(FRONT(20,114.2,139));
rect(fr,4,33,178,62,3,'face rubber');rect(fr,4,33,178,62,3,'grain');rect(fr,4,30.6,178,2.6,1.3,'face chrome');
const plate=group(FRONT(160,114.4,73));rect(plate,0,0,36,12,2,'face chrome');text(plate,18,6,'ORLUN','label brand center');text(plate,18,10.2,'INSTANT OPTICS','etch micro center');
box(28,114,106,56,4,30,3,'chrome');
const flashControl=group(FRONT(28,118.2,136),root,{id:'flashControl',class:'control',role:'button',tabindex:'0','aria-label':'Toggle flash (F)','aria-pressed':'true'});
rect(flashControl,-2,-2,60,34,4,'hit');rect(flashControl,-2.5,-2.5,61,35,4,'focus-ring');
rect(flashControl,3,3,50,17,2,'face flash');for(let i=0;i<12;i++)line(flashControl,6+i*4.1,4.4,6+i*4.1,18.6);line(flashControl,4,8.6,52,8.6);line(flashControl,4,14.4,52,14.4);
rect(flashControl,3,3,50,17,2,'face glass').setAttribute('fill-opacity','.2');rect(flashControl,4,4,48,15,2,'flash-lit');
rect(flashControl,3,23,22,5,2.5,'face recess');const flashSwitch=rect(flashControl,15,23.6,9,3.8,1.9,'face flash-switch');
text(flashControl,30,27.1,'FLASH','etch micro');const chargeLamp=circle(flashControl,50.5,25.5,1.3,'lamp');
box(150,114,112,36,4,22,4,'chrome');
const vf=group(FRONT(150,118.1,134));rect(vf,3,3,30,16,2.5,'face optics');rect(vf,6,5.4,24,11.2,1.5,'detail');el('path',{d:'M8,3.4 L13,3.4 L22,18.6 L17,18.6 Z',fill:'#fff',opacity:'.14'},vf);line(vf,9,7,15,7);line(vf,9,7,9,11);
const meter=group(FRONT(134,114.3,124));circle(meter,0,0,5.4,'face chrome');circle(meter,0,0,4.1,'face optics');
for(const[u,v]of[[0,0],[1.8,0],[-1.8,0],[.9,1.6],[-.9,1.6],[.9,-1.6],[-.9,-1.6]])circle(meter,u,v,.78,'detail');
const tl=group(FRONT(118,114.3,124));circle(tl,0,0,2.8,'face recess');const timerLamp=circle(tl,0,0,1.6,'lamp');
const rl=group(FRONT(194,114.3,124));circle(rl,0,0,2.8,'face recess');const readyLamp=circle(rl,0,0,1.6,'lamp');text(rl,0,7.2,'READY','etch micro center');
// Lens: mount, fixed sleeve with distance scale, telescoping barrel with the knurled focus ring.
const mount=cylinder(100,114.4,78,34,4,'y','chrome');circle(mount.face,0,0,31,'face base');
for(const a of[45,135,225,315])screw(mount.face,32.4*Math.cos(a*Math.PI/180),32.4*Math.sin(a*Math.PI/180));
const sleeve=cylinder(100,118.4,78,28.5,10,'y','rubber');circle(sleeve.face,0,0,27.6,'face recess');
for(let i=0;i<9;i++){const a=(-150+i*15)*Math.PI/180;line(sleeve.face,f2(25.4*Math.cos(a)),f2(25.4*Math.sin(a)),f2(27*Math.cos(a)),f2(27*Math.sin(a)));}
const indexMark=group(FRONT(100,118.6,108.2));el('path',{d:'M-2,0 L2,0 L0,3 Z',class:'accent'},indexMark);
const lensTravel=group('translate(0 0)',root,{id:'lensTravel'});
const moving=cylinder(100,124,78,26.5,12,'y','chrome');lensTravel.appendChild(moving.g);
const focusControl=group(FRONT(100,136.2,78),lensTravel,{id:'focusControl',class:'control',role:'button',tabindex:'0','aria-label':'Turn focus and zoom ring (Z)'});
circle(focusControl,0,0,30,'hit');circle(focusControl,0,0,29.4,'focus-ring');circle(focusControl,0,0,26.5,'face top chrome button-face');circle(focusControl,0,0,24.6,'face rubber');
const ring=group('rotate(0)',focusControl,{id:'focusRing'});knurl(ring,24.8,26.3,56);el('path',{d:'M-2,-26.2 L2,-26.2 L0,-22.6 Z',class:'accent'},ring);
for(let i=0;i<3;i++){const a=(-90+i*32)*Math.PI/180;line(ring,f2(21.6*Math.cos(a)),f2(21.6*Math.sin(a)),f2(23.6*Math.cos(a)),f2(23.6*Math.sin(a)));}
circle(focusControl,0,0,21.4,'face base');circle(focusControl,0,0,19.6,'face recess');circle(focusControl,0,0,18.4,'face optics');
const optic=circle(focusControl,0,0,17,'face');optic.style.fill='url(#lensGlass)';
const iris=group('rotate(0)',focusControl,{id:'iris'});
for(let i=0;i<6;i++)el('path',{d:'M0,-10 L8.7,-5 L5.1,2.9 L0,5.9 L-5.1,2.9 Z',transform:`rotate(${i*60})`,class:'detail',opacity:'.35'},iris);
circle(focusControl,0,0,6.2,'face optics');circle(focusControl,0,0,3.4,'detail');
el('path',{d:'M-13,-3 Q-12.5,-12 -3,-13.4',class:'coat',style:'stroke:var(--coat-a)'},focusControl);el('path',{d:'M-10,-2 Q-9.6,-9 -3,-10.2',class:'coat',style:'stroke:var(--coat-b)'},focusControl);
el('path',{d:'M6,11 Q10,9.5 11.6,5.6',class:'coat',style:'stroke:var(--coat-b)'},focusControl);
// Access door hinges about its lower edge; the cassette is behind it.
const compartment=group(FRONT(25,122.3,34));rect(compartment,0,0,176,25,4,'face recess');rect(compartment,6,3,164,19,2,'face rubber');
const pack=group(FRONT(39,122.6,30));rect(pack,0,0,146,19,2,'face base');rect(pack,5,3,136,13,1.5,'face top');
text(pack,73,11.5,'ORLUN / 8 INTEGRAL EXPOSURES','etch center');line(pack,11,5,23,5);line(pack,11,7,19,7);
for(const x of[9,166]){circle(compartment,x,11,3,'face base');circle(compartment,x,11,1.6,'face rubber');}
const rollerPlane=group(FRONT(51,123,30));rect(rollerPlane,0,0,124,5,2,'face chrome');
const rollers=group('translate(0 0)',rollerPlane,{id:'rollers'});for(let i=0;i<25;i++)line(rollers,2+i*4.8,.7,2+i*4.8,4.3);
const doorControl=group(FRONT(25,122.9,9),root,{id:'doorControl',class:'control',role:'button',tabindex:'0','aria-label':'Open film door (D); closing an empty camera loads a fresh pack','aria-expanded':'false'});
rect(doorControl,-2,-27,180,29,4,'hit');rect(doorControl,0,-25,176,25,4,'face base');rect(doorControl,4,-22,168,18,3,'detail');
for(const x of[7,169])screw(doorControl,x,-5);
rect(doorControl,29,-16,108,5,1.5,'face recess');line(doorControl,32,-13.5,134,-13.5,'detail slot-line');
rect(doorControl,151,-17,12,10,2,'face recess');rect(doorControl,153,-15,8,6,1.3,'face top chrome button-face');line(doorControl,155,-12,159,-12);
rect(doorControl,-3,-28,182,31,4,'focus-ring');
for(const x of[38,172]){box(x,121.9,7,17,3,3,1,'chrome');line(group(FRONT(x,125,10)),5,0,5,3);}
// The sheet stays gripped by the slot until it is collected.
const printPlane=group(TOP(55,122,25),root,{id:'printPlane'});
const printClip=el('g',{'clip-path':'url(#paperSlot)'},printPlane);
const printControl=group('translate(0 -132)',printClip,{id:'printControl',class:'control print-control',role:'button',tabindex:'-1','aria-label':'Collect the developing print','aria-disabled':'true',visibility:'hidden'});
rect(printControl,1,1,106,132,2,'printer-shadow');rect(printControl,0,0,106,132,2,'paper');
line(printControl,1,131,105,131);rect(printControl,8,8,90,96,.8,'blank');
const photoArt=el('g',{'clip-path':'url(#photoClip)',opacity:'0',id:'photoArt'},printControl);
el('rect',{x:8,y:8,width:90,height:96,fill:'url(#sky)'},photoArt);
const landscape=group('translate(0 0)',photoArt);
el('circle',{cx:66,cy:30,r:10,fill:'#fff5d2'},landscape);
el('path',{d:'M-12,74 L17,41 L32,58 L48,33 L83,77 L122,68 V115 H-12 Z',fill:'#899c91'},landscape);
el('path',{d:'M-12,84 L15,70 L30,76 L56,57 L75,69 L97,59 L125,82 V115 H-12 Z',fill:'#456b73'},landscape);
el('path',{d:'M8,88 Q38,78 61,88 T104,89 V106 H8 Z',fill:'#273e51'},landscape);
el('path',{d:'M55,89 Q65,91 79,90 M42,96 Q68,98 89,96',fill:'none',stroke:'#a1b8ae','stroke-width':'.8',opacity:'.5'},landscape);
const dusk=el('rect',{x:8,y:8,width:90,height:96,fill:'#14202e',opacity:'0'},photoArt);
const photoSerial=text(printControl,53,119,'ORLUN / 01','photo-ink center');
rect(printControl,2,2,102,128,2,'focus-ring');
const slotLip=group(FRONT(58,123.3,27));line(slotLip,0,0,100,0,'detail slot-line');
// Flash: bloom at the window and a beam thrown forward (hull of the window and a far rectangle).
const burst=P(56,118,121);const flashBloom=el('ellipse',{cx:burst[0],cy:burst[1],rx:52,ry:38,class:'flash-burst'});
const bp=hull([[32,118,133],[80,118,133],[80,118,110],[32,118,110],[-6,250,176],[118,250,176],[118,250,104],[-6,250,104]].map(p=>P(...p)));
const g0=P(56,118,121),g1=P(56,250,125),bg=document.getElementById('beamG');set(bg,'x1',g0[0]);set(bg,'y1',g0[1]);set(bg,'x2',g1[0]);set(bg,'y2',g1[1]);
const beam=el('path',{d:'M'+bp.map(p=>p.map(f2).join(',')).join('L')+'Z',fill:'url(#beamG)',class:'beam'});
frame([[16,17,0,194,105,37],[20,20,37,186,94,110],[206,34,44,26,12,82],[55,122,24.4,106,132,.6],[66,114,44,68,22,68]],20);
// Six interactions: shutter, self-timer, flash, ring, door, collecting the print. Audio only after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ease=p=>1-Math.pow(1-clamp(p),3);
let flash=true,zoom=0,film=8,serial=0,doorOpen=false,doorAngle=0,ringAngle=0,lensOffset=0,charge=1,chargeAt=0,timer=null,lastBeep=0;
let shot=null,printPresent=false,collecting=null,zoomMove=null,doorMove=null,notice='',noticeUntil=0,lastUI=0,ac=null;
const focal=[60,75,90];
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
function tone(f,d,v,type='sine',f2v=0){if(!ac)return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2v)o.frequency.exponentialRampToValueAtTime(f2v,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}
function say(m){announcement.textContent=m;}
function message(value){notice=value;noticeUntil=performance.now()+1600;update(performance.now());}
function lamp(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
function blocked(){return doorOpen?['CLOSE FILM DOOR / D','Close the film door before taking a photograph.']:printPresent?['COLLECT PRINT FIRST / P','Collect the print with P, or click it.']:!film?['FILM EMPTY · OPEN DOOR / D','Open and close the film door with D to load a fresh eight exposure pack.']:null;}
function readyState(now){return timer?`SELF-TIMER · ${Math.max(1,Math.ceil((3000-(now-timer.start))/1000))}`:doorOpen?'FILM DOOR OPEN':shot?(shot.phase==='exposing'?'EXPOSING':shot.phase==='ejecting'?'EJECTING PRINT':`DEVELOPING · ${Math.round(shot.development*100)}%`):printPresent?'PRINT READY · P TO COLLECT':film===0?'FILM EMPTY · OPEN DOOR / D':flash&&charge<1?'FLASH CHARGING':`FLASH ${flash?'ON':'OFF'} · READY`;}
function update(now){
readout.textContent=`${focal[zoom]} mm · ${String(film).padStart(2,'0')} left`;
stateLabel.textContent=now<noticeUntil?notice:readyState(now);countText.textContent=String(film).padStart(2,'0');
svg.classList.toggle('door-open',doorOpen);svg.classList.toggle('flash-enabled',flash);svg.classList.toggle('charged',flash&&charge>=1);
set(flashControl,'aria-pressed',flash);set(doorControl,'aria-expanded',doorOpen);
set(focusControl,'aria-label',`Turn focus and zoom ring (Z), currently ${focal[zoom]} millimetres`);
set(shutterControl,'aria-disabled',!!shot||doorOpen||printPresent||film===0||!!collecting||!!doorMove);
set(doorControl,'aria-disabled',!!shot||printPresent||!!collecting);set(printControl,'aria-disabled',!!shot||!!collecting);
set(flashSwitch,'x',flash?15:4);
lamp(readyLamp,doorOpen?'':shot?'a blink':printPresent?'b':film===0?'r':'g');
lamp(chargeLamp,!flash?'':charge<1?'a blink':'g');
}
function shutter(){
audio();if(timer)timer=null;
if(shot||collecting||doorMove)return;
const b=blocked();if(b){message(b[0]);say(b[1]);return;}
film--;serial++;printPresent=true;noticeUntil=0;
const now=performance.now();
shot={start:now,phase:'exposing',development:0,flash,zoom};
if(flash){charge=0;chargeAt=now;tone(1800,2.2,.004,'sine',5200);}
if(ac){const t=ac.currentTime,n=ac.createBufferSource(),b2=ac.createBuffer(1,ac.sampleRate*.05,ac.sampleRate),d=b2.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(1-i/d.length);const g=ac.createGain();g.gain.value=.05;n.buffer=b2;n.connect(g);g.connect(ac.destination);n.start(t);}
set(printControl,'visibility','visible');set(printControl,'tabindex','-1');set(printControl,'transform','translate(0 -132)');set(photoArt,'opacity','0');
set(landscape,'transform',`translate(${-zoom*5} ${zoom*2}) scale(${1+zoom*.07})`);set(dusk,'opacity',flash?'0':'.42');
photoSerial.textContent=`ORLUN / ${String(serial).padStart(2,'0')}`;
shutterControl.classList.add('pressed');say('Shutter released. The print is feeding out and will develop in eight seconds.');update(now);
}
function selfTimer(){
audio();
if(timer){timer=null;message('SELF-TIMER CANCELLED');say('Self-timer cancelled.');return;}
if(shot||collecting||doorMove)return;
const b=blocked();if(b){message(b[0]);say(b[1]);return;}
timer={start:performance.now()};lastBeep=0;noticeUntil=0;say('Self-timer running. The shutter fires in three seconds.');update(performance.now());
}
function flashToggle(){audio();flash=!flash;tone(flash?1400:900,.04,.02,'square');message(`FLASH ${flash?'ON':'OFF'}`);say(`Flash ${flash?'on':'off'}.`);}
function zoomTurn(){
audio();zoom=(zoom+1)%3;const now=performance.now();
zoomMove={start:now,from:ringAngle,to:ringAngle+40,offset:lensOffset,target:zoom*3};noticeUntil=0;
if(reduced.matches){ringAngle=zoomMove.to;lensOffset=zoomMove.target;zoomMove=null;drawLens();}
tone(2600,.02,.012,'square');message(`${focal[zoom]} MM · RING SET`);say(`Focus ring turned to ${focal[zoom]} millimetres.`);
}
function drawLens(){set(ring,'transform',`rotate(${f2(ringAngle)})`);set(iris,'transform',`rotate(${f2(ringAngle*.18)})`);set(lensTravel,'transform',`translate(${f2(-lensOffset*C)} ${f2(lensOffset*S)})`);}
function drawDoor(){
const a=doorAngle*Math.PI/180;set(doorControl,'transform',matrix(C,S,C*Math.sin(a),Math.cos(a)-S*Math.sin(a),25,122.9,9));
set(slotLip,'opacity',doorOpen?'0':'1');
}
function doorToggle(){
audio();timer=null;
if(shot||printPresent||collecting){message(shot?'DOOR LOCKED · PRINT FEED':'COLLECT PRINT BEFORE OPENING');say('Collect the print before opening the film door.');return;}
const now=performance.now();doorOpen=!doorOpen;noticeUntil=0;
doorMove={start:now,from:doorAngle,to:doorOpen?80:0};tone(doorOpen?320:420,.06,.02,'triangle');
if(!doorOpen&&film===0){film=8;say('Fresh film pack seated. Eight exposures available.');message('FRESH PACK · 08 EXPOSURES');}
else say(doorOpen?'Film door open. The cassette and rollers are visible.':'Film door closed.');
if(reduced.matches){doorAngle=doorMove.to;doorMove=null;drawDoor();}
update(now);
}
function collect(){
audio();
if(!printPresent||shot||collecting){if(shot){message('PRINT STILL DEVELOPING');say('The print is still developing.');}else if(!printPresent){message('NO PRINT TO COLLECT');}return;}
const now=performance.now();collecting={start:now};set(printControl,'tabindex','-1');say('Print collected. Ready for another exposure.');
if(reduced.matches)finishCollect(now);else message('PRINT COLLECTED');
}
function finishCollect(now){
collecting=null;printPresent=false;set(printControl,'visibility','hidden');set(printControl,'opacity','1');set(printPlane,'transform',TOP(55,122,25));
if(document.activeElement===printControl)shutterControl.focus();message('PRINT COLLECTED');update(now);
}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(shutterControl,shutter);bind(flashControl,flashToggle);bind(focusControl,zoomTurn);bind(doorControl,doorToggle);bind(printControl,collect);
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;
const action={' ':shutter,t:selfTimer,f:flashToggle,z:zoomTurn,d:doorToggle,p:collect}[e.key.toLowerCase()];
if(action){e.preventDefault();action();}
});
function tick(now){
if(zoomMove){const p=reduced.matches?1:clamp((now-zoomMove.start)/470),t=ease(p);ringAngle=zoomMove.from+(zoomMove.to-zoomMove.from)*t;lensOffset=zoomMove.offset+(zoomMove.target-zoomMove.offset)*t;drawLens();if(p===1)zoomMove=null;}
if(doorMove){const p=reduced.matches?1:clamp((now-doorMove.start)/520);doorAngle=doorMove.from+(doorMove.to-doorMove.from)*ease(p);drawDoor();if(p===1)doorMove=null;}
if(timer){
const e=now-timer.start,period=e<2000?500:160,on=reduced.matches||Math.floor(e/period)%2===0;lamp(timerLamp,on?'r':'');
if(Math.floor(e/period)!==lastBeep){lastBeep=Math.floor(e/period);if(on)tone(e<2000?1500:2100,.05,.018,'square');}
if(e>=3000){timer=null;shutter();}
}else lamp(timerLamp,'');
if(charge<1){charge=reduced.matches?1:clamp((now-chargeAt)/2400);}
if(shot){
const elapsed=now-shot.start;
if(elapsed>180)shutterControl.classList.remove('pressed');
const fl=!reduced.matches&&shot.flash&&elapsed<200?Math.sin(Math.PI*clamp(elapsed/200)):0;flashBloom.style.opacity=f2(fl*.95);beam.style.opacity=f2(fl*.9);
set(iris,'transform',`rotate(${f2(ringAngle*.18+(elapsed<160&&!reduced.matches?Math.sin(Math.PI*elapsed/160)*24:0))})`);
const feed=clamp((elapsed-320)/1450);set(printControl,'transform',`translate(0 ${f2(-132+128*(reduced.matches?(feed>0?1:0):ease(feed)))})`);
set(rollers,'transform',`translate(${feed>0&&feed<1?f2((elapsed*.018)%4.8):0} 0)`);
shot.phase=elapsed<320?'exposing':feed<1?'ejecting':'developing';
shot.development=clamp((elapsed-1850)/6200);set(photoArt,'opacity',reduced.matches?(shot.development===1?1:0):f2(Math.pow(shot.development,1.15)));
if(shot.development===1){shot=null;set(printControl,'tabindex','0');set(printControl,'aria-label',`Collect print ${serial} (P, Enter or Space)`);say('Photograph developed. Press P or click the print to collect it.');noticeUntil=0;}
}
if(collecting){const p=clamp((now-collecting.start)/420);set(printPlane,'transform',TOP(55,122+24*ease(p),25+9*ease(p)));set(printControl,'opacity',f2(1-ease(p)));if(p===1)finishCollect(now);}
if(now-lastUI>90){update(now);lastUI=now;}
requestAnimationFrame(tick);
}
drawLens();drawDoor();update(performance.now());requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], draw }
