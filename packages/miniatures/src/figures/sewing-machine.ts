// @ts-nocheck
/* VELUN N–12 · Sewing machine. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--base-top:#cbcbc7;--base-side:#a4a4a1;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--chrome:#d4d5d2;--chrome-top:#efefec;--chrome-side:#b6b7b4;--rubber:#333331;--rubber-top:#474745;--rubber-side:#282827;--screen:#20262b;--fabric:#dccfb8;--fabric-side:#c4b597;--weave:#b3a283;--thread:#c4423a;--lamp:#ffe6a0}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--base-top:#bebeba;--base-side:#737372;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--chrome:#b3b3b1;--chrome-top:#e0e0dd;--chrome-side:#80807f;--rubber:#292928;--rubber-top:#424240;--rubber-side:#191919;--screen:#1a1e21;--fabric:#b9ae9b;--fabric-side:#a5987f;--weave:#96886d;--thread:#a5362f;--lamp:#ffe0a0;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.top.base{fill:var(--base-top)}.side.base{fill:var(--base-side)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}.side.rubber{fill:var(--rubber-side)}.screen{fill:var(--screen)}
.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.accent{fill:var(--accent);stroke:var(--accent)}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.08;filter:url(#soft)}
.rail-under{fill:none;stroke:var(--line);stroke-width:4;stroke-linejoin:round;stroke-linecap:round}.rail{fill:none;stroke:var(--chrome-top);stroke-width:2.7;stroke-linejoin:round;stroke-linecap:round}.cable-u{fill:none;stroke:var(--line);stroke-width:3.6;stroke-linecap:round;stroke-linejoin:round}.cable{fill:none;stroke:var(--rubber);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.control{cursor:pointer;outline:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .button-face{fill:var(--top)}.hit{fill:transparent;stroke:none}
.lamp{fill:var(--off);stroke:none;transition:fill .2s}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.r,.lamp.b{filter:url(#glow)}.pulse{animation:pulse .5s ease-in-out infinite alternate}
.lcd{fill:var(--accent);font:700 7px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.lcd.s{font-size:3px;letter-spacing:.4px;font-weight:600}.lcd-line{fill:none;stroke:var(--accent);stroke-width:.9;stroke-linecap:round;stroke-linejoin:round}.lcd-halo{fill:var(--accent);opacity:.16;filter:url(#bloom)}
.cloth{fill:var(--fabric);stroke:var(--weave);stroke-width:.8;vector-effect:non-scaling-stroke;stroke-linejoin:round}.cloth-tail{fill:var(--fabric-side)}.weave{fill:none;stroke:var(--weave);stroke-width:.4;opacity:.55;vector-effect:non-scaling-stroke}.seam{fill:none;stroke:var(--thread);stroke-width:1.25;stroke-linejoin:round;stroke-linecap:round;vector-effect:non-scaling-stroke}.thread{fill:none;stroke:var(--thread);stroke-width:.75;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.spool-thread{fill:var(--thread);stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke}
.worklight{opacity:0;pointer-events:none;transition:opacity .25s}.lamp-lit .worklight{opacity:1}.light-beam{fill:var(--lamp);opacity:.14;stroke:none}.light-pool{fill:var(--lamp);opacity:.32;filter:url(#bloom)}.bulb{fill:var(--off)}.lamp-lit .bulb{fill:var(--lamp);filter:url(#glow)}.foot-lift{transition:transform .2s}
@keyframes pulse{to{opacity:.45}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<clipPath id="clothClip"><rect width="84" height="104" rx="2"/></clipPath>
<clipPath id="tailClip"><path d="M0,0 H84 L82,18 Q43,24 2,18 Z"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* World coordinates: x lower-right; y lower-left; z up. 1 unit ≈ 1.5 mm.
Part                        x      y      z      w      d      h
feet (4)                22/259  18/87      0     22     18      8
base                        8      8      8    294    108     12
bed                        12     12     20    286    100     10
needle plate + slots       64     60     30     60     36    0.3
bobbin cover + bobbin      70     96     30     54     14    0.3
fabric swatch + seam       13      8   30.6     84    104      0
fabric fold                13    112      8     84      0   22.6
pillar                    226     28     30     58     58    160
arm                       108     28    148    124     58     42
head                       46     24    100     62     66     96
top cover (spine)          64     34    190    214     46      6
carry handle + posts      140     54    196     72      4     18
spool pin + spool         180     52    196    r15      –     31
bobbin winder             250     52    196    r5       –     13
thread guides             118     52    196      4      4     12
face plate + slot          50     90    104     54      0     88
take-up lever (travels 30) 60     90    150      8      4     36
tension dial               88     90    168     r9      5      –
screen + speed slider     118     86    149     64      0     34
start/stop (lit)          198     86    166    r8      3      –
brand plate               234     86    178     44      0     10
stitch dial               255     86    120    r18      4      –
light switch + lamp       245     86     70     20      3     22
hand wheel                284     29    132     17     56     56
socket, cable, pedal      284     68      0     60     52     52
work lamp + beam           72     84     30     52     40     70
needle bar · needle        82     83     40      4      4     69
presser bar + foot         76     76   31.5     23     17     74
presser lever              52     90    100     12      4     30
Front-facing controls use their parent face; the fabric folds over the bed's front lip. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: bevelled plates, knurls, smooth cables, buttons.
const f2=v=>(+v).toFixed(2);
function panel(g,x,y,w,h,b=2.2,cls=''){rect(g,x,y,w,h,1,'face '+cls);el('path',{d:`M${x},${y}H${x+w}L${x+w-b},${y+b}H${x+b}ZM${x},${y}L${x+b},${y+b}V${y+h-b}L${x},${y+h}Z`,class:'face top '+cls},g);el('path',{d:`M${x},${y+h}L${x+b},${y+h-b}H${x+w-b}L${x+w},${y+h}ZM${x+w},${y}V${y+h}L${x+w-b},${y+h-b}V${y+b}Z`,class:'face side '+cls},g);}
function knurl(g,r0,r1,n){for(let i=0;i<n;i++){const a=i*2*Math.PI/n;line(g,f2(r0*Math.cos(a)),f2(r0*Math.sin(a)),f2(r1*Math.cos(a)),f2(r1*Math.sin(a)));}}
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
const button=(t,attrs)=>group(t,root,{class:'control',role:'button',tabindex:'0',...attrs});
// Assembly: back to front.
const shadow=P(160,66,0);el('ellipse',{cx:shadow[0],cy:shadow[1]+5,rx:186,ry:52,class:'shadow stage-floor'});el('ellipse',{cx:shadow[0],cy:shadow[1]+5,rx:186,ry:52,class:'stage-contact'});
for(const[x,y]of[[22,18],[22,87],[259,18],[259,87]])box(x,y,0,22,18,8,3,'rubber');
box(8,8,8,294,108,12,5,'base');
box(12,12,20,286,100,10,6);
const bedFront=group(FRONT(12,112.3,30));line(bedFront,6,5.4,279,5.4);screw(bedFront,264,4.6);
const plate=group(TOP(64,60,30.2));rect(plate,0,0,60,36,4,'face top chrome');
for(const p of[[5,5],[55,5],[5,31],[55,31]])screw(plate,...p);
slits(plate,14,10,6,16,5,false);slits(plate,25,10,6,16,5,false);rect(plate,17.5,16,10,4,1.2,'face recess');
for(let i=0;i<4;i++){line(plate,36+i*4.5,6,36+i*4.5,30);text(plate,36+i*4.5,4.2,String(i*5+5),'etch micro center');}
const cover=group(TOP(70,96,30.2));rect(cover,0,0,54,14,4,'face recess');rect(cover,2,2,50,10,3,'face glass');
const bobbin=group(TOP(110,103,30.3));circle(bobbin,0,0,5.6,'face chrome');circle(bobbin,0,0,4.4,'spool-thread');const bobSpin=group('rotate(0)',bobbin);for(let i=0;i<3;i++){const a=i*2.094;line(bobSpin,f2(1.4*Math.cos(a)),f2(1.4*Math.sin(a)),f2(4*Math.cos(a)),f2(4*Math.sin(a)));}circle(bobbin,0,0,1.2,'face top');
const coverRim=group(TOP(70,96,30.4));rect(coverRim,2,2,50,10,3,'detail');rect(coverRim,46,4,4,6,1.5,'face recess');
const cloth=group(TOP(13,8,30.6));rect(cloth,0,0,84,104,2,'cloth');
const clothInside=el('g',{'clip-path':'url(#clothClip)'},cloth),weave=group('translate(0 0)',clothInside);
for(let y=-6;y<247;y+=12)line(weave,0,y,84,y,'weave');
for(let x=3;x<84;x+=8)line(weave,x,-6,x,247,'weave');
line(cloth,5,0,5,104,'weave');line(cloth,79,0,79,104,'weave');
const seam=el('path',{d:'M69,75 l0,-.1',class:'seam',id:'stitchedSeam'},clothInside);
const tail=group(FRONT(13,112,30.6));el('path',{d:'M0,0 H84 L82,18 Q43,24 2,18 Z',class:'cloth cloth-tail'},tail);
const tailInside=el('g',{'clip-path':'url(#tailClip)'},tail),hem=group('translate(0 0)',tailInside);
for(let y=-4;y<136;y+=12)line(hem,0,y,84,y,'weave');
for(let x=3;x<84;x+=8)line(hem,x,-5,x,135,'weave');
el('path',{d:'M3,2 Q42,7 81,2 M3,16 Q42,22 81,16',class:'weave'},tail);
// Body: arm, pillar, head, top cover.
box(46,24,100,62,66,96,10);
box(108,28,148,124,58,42,6);
box(226,28,30,58,58,160,10);
box(108,34,190,170,46,6,6);
const tc=group(TOP(108,34,196.05));for(const p of[[6,6],[164,6],[6,40],[164,40]])screw(tc,...p);slits(tc,112,10,24,26,8);
// Pillar side: vents, socket, cable to the pedal.
const ps=group(SIDE(284.2,86,190));panel(ps,6,90,46,62,2.2,'base');slits(ps,12,98,34,22,9);screw(ps,10,146);screw(ps,48,146);text(ps,29,130,'N–12 · 230 V','etch micro center');
box(284,66,40,6,10,9,2,'rubber');
const cd=smooth([[290,71,44.5],[296,72,43],[301,74,32],[306,78,16],[310,84,3],[318,92,2],[326,96,3]]);el('path',{d:cd,class:'cable-u'});el('path',{d:cd,class:'cable'});
// Foot pedal: base, treadle drawn by tilt, ribs and a lamp.
box(306,90,0,40,30,5,4,'rubber');
const pedal=el('g',{});
function drawPedal(t){pedal.textContent='';const zb=13,zf=10-4*t,q=(x,y,z)=>[x,y,z];
el('path',{d:poly([q(308,92,zb),q(344,92,zb),q(344,118,zf),q(308,118,zf)],true),class:'face top rubber'},pedal);
el('path',{d:poly([q(308,118,zf),q(344,118,zf),q(344,118,5),q(308,118,5)],true),class:'face rubber'},pedal);
el('path',{d:poly([q(344,92,zb),q(344,118,zf),q(344,118,5),q(344,92,5)],true),class:'face side rubber'},pedal);
for(let i=1;i<6;i++){const y=92+i*4.3,z=zb+(zf-zb)*(i*4.3/26);wire([[311,y,z+.1],[341,y,z+.1]],'detail',pedal);}}
drawPedal(0);
// Hand wheel on the pillar side.
cylinder(284,57,160,9,8,'x','chrome');
const wheelRim=cylinder(292,57,160,28,9,'x','base').face;
circle(wheelRim,0,0,25.6,'face top');knurl(wheelRim,25.8,27.6,48);circle(wheelRim,0,0,21,'face recess');
const wheelControl=group(SIDE(301.3,57,160),root,{id:'wheelControl',class:'control',role:'button',tabindex:'0','aria-label':'Turn hand wheel one stitch (W)'});
circle(wheelControl,0,0,31,'hit');circle(wheelControl,0,0,30.5,'focus-ring');
const wheel=group('rotate(0)',wheelControl,{id:'wheelRotor'});
for(let i=0;i<5;i++){const a=i*Math.PI*2/5,d=`M${f2(Math.cos(a)*6)},${f2(Math.sin(a)*6)} L${f2(Math.cos(a)*20.4)},${f2(Math.sin(a)*20.4)}`;el('path',{d,class:'rail-under'},wheel);el('path',{d,class:'rail'},wheel);}
circle(wheel,0,0,6.4,'face top chrome button-face');circle(wheel,0,0,2,'face base');circle(wheel,0,-23.6,1.5,'accent');
// Pillar front: brand, stitch dial, light switch with lamp.
const pf=group(FRONT(226,86.2,190));panel(pf,6,8,46,148,2.2);
const brand=group(FRONT(234,86.6,178));rect(brand,0,0,42,10,2,'face chrome');text(brand,21,7,'VELUN','label brand center');
const dialBase=cylinder(255,86.4,120,19,4,'y','chrome').face;circle(dialBase,0,0,17,'face glass');
const icons=['M-3,-12 v-6','M-1,-17 l1.5,-2 1.5,4 1.5,-4 1.5,2','M-2,-14 l1.4,-3 1.4,4 1.4,-4'];
const stitchControl=group(FRONT(255,90.6,120),root,{id:'stitchControl',class:'control',role:'button',tabindex:'0','aria-label':'Stitch type: straight. Click to cycle; keys 1, 2, 3.'});
circle(stitchControl,0,0,24,'hit');circle(stitchControl,0,0,22,'focus-ring');
[-55,0,55].forEach((a,i)=>{const g=group(`rotate(${a})`,stitchControl);el('path',{d:icons[i],class:'detail'},g);});
const dial=group('rotate(-55)',stitchControl,{id:'stitchPointer'});circle(dial,0,0,10.5,'face top chrome button-face');knurl(dial,8.6,10,24);line(dial,0,-2,0,-8,'detail');circle(dial,0,-6.6,1.2,'accent');
const lightControl=group(FRONT(245,86.6,96),root,{id:'lightControl',class:'control',role:'button',tabindex:'0','aria-label':'Toggle work light (L)','aria-pressed':'true'});
rect(lightControl,-3,-3,26,22,3,'focus-ring');rect(lightControl,0,0,20,12,3,'face recess');const lightRocker=rect(lightControl,2,2,16,5,2,'face top button-face');
el('path',{d:'M8.6,9.4 a1.6,1.6 0 1 1 2.8,0 l-.5,1 h-1.8 Z',class:'detail'},lightControl);text(lightControl,10,17,'LIGHT','etch micro center');
const pwr=group(FRONT(255,86.6,62));circle(pwr,0,0,2.4,'face recess');const powerLamp=circle(pwr,0,0,1.3,'lamp g');text(pwr,0,6.2,'POWER','etch micro center');
// Arm front: stitch screen, speed slider, lit start/stop button.
const af=group(FRONT(118,86.2,183));rect(af,0,0,66,26,4,'face recess');rect(af,2,2,62,18,3,'face screen');rect(af,5,4,56,14,2,'lcd-halo');
const lcdNum=text(af,14,15,'01','lcd center');const lcdIcon=el('path',{d:'',class:'lcd-line'},group('translate(32 11)',af));const lcdSpm=text(af,52,9,'360','lcd s center');text(af,52,14.6,'SPM','lcd s center');
const slot=group(FRONT(122,86.4,159));rect(slot,0,0,58,4,2,'face recess');for(let i=0;i<5;i++)line(slot,6+i*11.5,5.4,6+i*11.5,7);text(slot,29,10.4,'SPEED','etch micro center');
const slider=group('translate(0 0)',slot);rect(slider,0,-2.2,8,8.4,2,'face top chrome');line(slider,4,0,4,4.2);
const startBase=cylinder(206,86.2,170,9.4,2.4,'y','chrome').face;circle(startBase,0,0,8.4,'face recess');
const sewControl=group(FRONT(206,88.8,170),root,{id:'sewControl',class:'control',role:'button',tabindex:'0','aria-label':'Start or stop sewing (Space)','aria-pressed':'false'});
circle(sewControl,0,0,12,'focus-ring');const startLamp=circle(sewControl,0,0,7,'lamp g');el('path',{d:'M-1.6,-2.6 L2.6,0 L-1.6,2.6 Z M-3.4,-2.6 v5.2',class:'detail'},sewControl);
text(group(FRONT(206,86.4,157)),0,0,'START · STOP','etch micro center');
// Head front: face plate, take-up slot and lever, tension dial, thread slot.
const fp=group(FRONT(46,90.2,192));panel(fp,4,4,54,88,2.4,'chrome');for(const p of[[8,8],[54,8],[8,84],[54,84]])screw(fp,...p);
rect(fp,14,12,6,48,3,'face recess');rect(fp,25,14,3,44,1.5,'face recess');
const tension=cylinder(88,90.2,168,9,5,'y','base').face;circle(tension,0,0,7.4,'face top');knurl(tension,7.6,8.8,30);
const tDial=group('rotate(0)',tension);for(let i=0;i<10;i++){const a=(i*36-90)*Math.PI/180;text(tDial,f2(5.2*Math.cos(a)),f2(5.2*Math.sin(a)+1),String(i),'etch micro center');}circle(tension,0,0,1.4,'face base');
const lever=group('',root);
function drawLever(z){lever.textContent='';const g=group(FRONT(56,90.6,z),lever);rect(g,0,-2,10,4,2,'face top chrome');circle(g,8,0,1.3,'face recess');line(g,0,0,-1,0);}
// Top: carry handle, thread guide, spool and pin, bobbin winder.
for(const x of[140,212]){wire([[x,56,196],[x,56,212]],'rail-under');wire([[x,56,196],[x,56,212]],'rail');}
wire([[140,56,212],[146,56,216],[206,56,216],[212,56,212]],'rail-under');wire([[140,56,212],[146,56,216],[206,56,216],[212,56,212]],'rail');
cylinder(118,52,196,2.4,12,'z','chrome');ellipse(118,52,208.2,3,'y','detail');
cylinder(252,52,196,6,3,'z','chrome');cylinder(252,52,199,3,10,'z','chrome');const winder=cylinder(252,52,209,5,2.4,'z','base').face;line(winder,0,-1,0,-4);
cylinder(180,52,196,2,40,'z','chrome');cylinder(180,52,198,15,2,'z','base');
cylinder(180,52,200,12,24,'z','spool-thread');
const spoolSide=group(FRONT(168,64,224));for(let i=2.4;i<24;i+=2.4)line(spoolSide,1,i,23,i,'detail');
const spoolTop=cylinder(180,52,224,15,2,'z','base').face;circle(spoolTop,0,0,11,'spool-thread');circle(spoolTop,0,0,3,'face top');
const spool=group('rotate(0)',spoolTop,{id:'spoolRotor'});for(let i=0;i<3;i++){const a=i*Math.PI*2/3;line(spool,f2(5*Math.cos(a)),f2(5*Math.sin(a)),f2(10*Math.cos(a)),f2(10*Math.sin(a)));}circle(spool,8,0,1,'face top');
const threadTop=wire([[180,52,225],[118,52,208],[66,92,190],[88,95,170]],'thread');
const threadRun=wire([[88,95,170],[64,92,170],[82,92,104]],'thread');
// Under the head: work light, needle bar and clamp, needle, presser bar and foot, presser lever.
const light=el('g',{class:'worklight'});el('path',{d:poly([[76,88,99.6],[50,62,31],[128,112,31]],true),class:'light-beam'},light);
ellipse(86,86,31,28,'z','light-pool',light);
cylinder(76,86,98,5.2,2.2,'z','chrome');ellipse(76,86,97.9,3.6,'z','face glass bulb');
cylinder(82,83,96,5,4,'z','chrome');
const barU=wire([[82,83,96.5],[82,83,72]],'rail-under'),barT=wire([[82,83,96.5],[82,83,72]],'rail');
const needleAssembly=el('g',{id:'needleAssembly'});
needleAssembly.appendChild(box(76,79,65,11,8,9,2,'chrome'));
const clampFront=group(FRONT(76,87.3,74),needleAssembly);screw(clampFront,6,4);line(clampFront,2,7,9,7);
wire([[82,83,65],[82,83,41]],'detail',needleAssembly);ellipse(82,83,43,1,'y','detail',needleAssembly);
const needleThread=wire([[82,92,104],[83,88,75],[82,83,43]],'thread');
const pbU=wire([[94,88,99],[94,88,42],[89,85,34]],'rail-under'),pbT=wire([[94,88,99],[94,88,42],[89,85,34]],'rail');
const footAssembly=el('g',{id:'footAssembly',class:'foot-lift'});
const footPlane=group(TOP(76,76,33.5),footAssembly);el('path',{d:'M0,0 H23 V17 H14 V7 H7 V17 H0 Z',class:'face top chrome'},footPlane);line(footPlane,2,3,20,3);line(footPlane,2,15,5,15);line(footPlane,16,15,21,15);
wire([[76,93,33.5],[76,93,31.5],[83,93,31.5]],'detail',footAssembly);wire([[90,93,33.5],[90,93,31.5],[99,93,31.5]],'detail',footAssembly);
const footControl=group(FRONT(54,92,112),root,{id:'footControl',class:'control',role:'button',tabindex:'0','aria-label':'Raise or lower presser foot (F)','aria-pressed':'false'});
rect(footControl,-10,-8,20,40,5,'hit');rect(footControl,-10,-8,20,40,5,'focus-ring');
const fLever=group('rotate(0)',footControl);rect(fLever,-2.4,-1,4.8,24,2,'face chrome');rect(fLever,-5,18,10,8,3,'face rubber button-face');circle(footControl,0,0,3.6,'face top chrome');screw(footControl,0,0);
frame([[8,8,0,294,108,30],[46,24,100,238,66,96],[64,34,190,214,46,6],[284,29,132,17,56,56],[165,37,196,30,30,40],[13,8,8,84,104,22],[306,90,0,40,30,13]],22);
// Controls. Material travel is shared by the weave and the new seam.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const names=['Straight','Zigzag','Stretch'],pitch=2.5,limit=30,SPM=[120,240,360,480,600],LCD=['M-2,-4 V4','M-4,-4 L-2,4 L0,-4 L2,4 L4,-4','M-4,0 L-2,-4 L0,4 L2,-4 L4,0'];
let stitch=0,speed=2,running=false,lit=true,footUp=false,cycles=0,count=0,rows=[],jog=null,complete=false,lastTime=0,lastUI=0,lastFabric=-1,lastFabricUI=0,pedalT=0,sliderX=-1,ac=null;
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tick2(f,v=.012){if(!ac)return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.025);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.03);}
function say(message){announcement.textContent=message;}
function lamp(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
function controls(){
svg.classList.toggle('running',running);svg.classList.toggle('lamp-lit',lit);
set(sewControl,'aria-pressed',running);set(lightControl,'aria-pressed',lit);set(footControl,'aria-pressed',footUp);
set(lightRocker,'y',lit?2:5);set(dial,'transform',`rotate(${[-55,0,55][stitch]})`);
set(stitchControl,'aria-label',`Stitch type: ${names[stitch]}. Click to cycle; keys 1, 2, 3.`);
set(footAssembly,'transform',`translate(0 ${footUp?-10:0})`);const fz=footUp?10:0;for(const n of[pbU,pbT])set(n,'d',poly([[94,88,99],[94,88,42+fz],[89,85,34+fz]]));set(fLever,'transform',`rotate(${footUp?-40:0})`);
lamp(startLamp,footUp?'r':complete?'a':running?'g pulse':'g');
lcdNum.textContent='0'+(stitch+1);set(lcdIcon,'d',LCD[stitch]);lcdSpm.textContent=String(SPM[speed]);
ui();
}
function ui(){
readout.textContent=`${names[stitch]} · ${String(count).padStart(3,'0')} stitches · ${(count*pitch).toFixed(1)} mm`;
stateLabel.textContent=`${running?'SEWING':jog?'HAND TURN':footUp?'FOOT RAISED':complete?'SEAM COMPLETE':'READY'} · ${SPM[speed]} SPM · LIGHT ${lit?'ON':'OFF'}`;
}
function resetSwatch(){cycles=0;count=0;rows=[];complete=false;lastFabric=-1;drawFabric(0);}
function sew(){
audio();
if(footUp){say('Lower the presser foot with F before sewing.');ui();return;}
if(jog)return;
if(count>=limit)resetSwatch();
running=!running;if(!running)cycles=count;tick2(running?900:600);
say(running?`Sewing ${names[stitch].toLowerCase()} stitches.`:'Sewing paused. Needle parked.');controls();
}
function choose(n){audio();tick2(1500);stitch=n;say(`${names[n]} stitch selected.`);controls();}
function setSpeed(d){audio();speed=Math.max(0,Math.min(4,speed+d));tick2(1200+speed*200,.008);say(`Speed ${SPM[speed]} stitches per minute.`);controls();}
function lampToggle(){audio();tick2(700);lit=!lit;say(`Work light ${lit?'on':'off'}.`);controls();}
function foot(){audio();tick2(400);running=false;jog=null;cycles=count;footUp=!footUp;say(footUp?'Presser foot raised. Fabric released.':'Presser foot lowered. Ready to sew.');controls();}
function turn(){
audio();if(running||jog)return;
if(count>=limit)resetSwatch();
jog={start:performance.now(),from:cycles,feed:!footUp};say(footUp?'Turning the wheel with the fabric released.':'Turning the wheel one stitch.');controls();
}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(sewControl,sew);bind(stitchControl,()=>choose((stitch+1)%3));bind(lightControl,lampToggle);bind(footControl,foot);bind(wheelControl,turn);
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;
if(e.key==='ArrowUp'||e.key==='ArrowDown'){e.preventDefault();setSpeed(e.key==='ArrowUp'?1:-1);return;}
if(e.repeat)return;
const action={' ':sew,'1':()=>choose(0),'2':()=>choose(1),'3':()=>choose(2),l:lampToggle,w:turn,f:foot}[e.key.toLowerCase()];
if(action){e.preventDefault();action();}
});
function stitchX(index,type){return type===0?0:type===1?(index%2?3:-3):[0,3,0,-3][index%4];}
function addStitch(){if(count<limit){rows.push({x:stitchX(count,stitch),type:stitch});count++;}}
function drawFabric(travel){
const feed=travel*pitch;set(weave,'transform',`translate(0 ${f2(-feed)})`);set(hem,'transform',`translate(0 ${f2(-feed%12)})`);
let d=`M69,${f2(75-feed)}`;
for(let i=0;i<rows.length;i++)d+=` L${69+rows[i].x},${f2(75-feed+(i+1)*pitch)}`;
if(travel>count)d+=` L${69+stitchX(count,stitch)},75`;
set(seam,'d',d);lastFabric=travel;
}
function tick(now){
const dt=lastTime?Math.min((now-lastTime)/1000,.06):0;lastTime=now;
if(running){
cycles=Math.min(limit,cycles+dt*SPM[speed]/60);
while(count<Math.floor(cycles))addStitch();
if(cycles>=limit){running=false;complete=true;controls();say('Seam complete. Press Space for a fresh swatch.');}
}
let position=cycles;
if(jog){
const p=Math.min(1,(now-jog.start)/500);position=jog.from+p;
if(p>=1){if(jog.feed){addStitch();cycles=count;}jog=null;position=cycles;controls();}
}
const phase=(position%1)*Math.PI*2;
const down=reduced.matches?0:(1-Math.cos(phase))*6;
const lateral=reduced.matches||stitch===0?0:Math.sin(position*Math.PI)*(stitch===1?3:2);
const offset=P(lateral,0,-down);set(needleAssembly,'transform',`translate(${f2(offset[0])} ${f2(offset[1])})`);
const lz=reduced.matches?168:160+16*Math.cos(phase+.6);if(lz!==lever._z){lever._z=lz;drawLever(lz);}
for(const n of[barU,barT])set(n,'d',poly([[82,83,96.5],[82+lateral,83,72-down]]));
set(threadRun,'d',poly([[88,95,170],[64.5,92,lz],[82,92,104]]));
set(needleThread,'d',poly([[82,92,104],[83+lateral,88,75-down],[82+lateral,83,43-down]]));
if(!reduced.matches){set(wheel,'transform',`rotate(${f2(position*360)})`);set(spool,'transform',`rotate(${f2(-position*29)})`);set(bobSpin,'transform',`rotate(${f2(position*720)})`);}
const pt=running?1:0;pedalT+=reduced.matches?pt-pedalT:(pt-pedalT)*Math.min(1,dt*12);if(Math.abs(pedalT-(pedal._t??0))>.003){pedal._t=pedalT;drawPedal(pedalT);}
const sx=speed*11.5+2;if(sx!==sliderX){sliderX=sx;set(slider,'transform',`translate(${sx} 0)`);}
const travel=jog&&!jog.feed?count:position;
if(!reduced.matches||now-lastFabricUI>=500){if(lastFabric!==travel)drawFabric(reduced.matches?count:travel);lastFabricUI=now;}
if(now-lastUI>100){ui();lastUI=now;}
requestAnimationFrame(tick);
}
document.addEventListener('visibilitychange',()=>{lastTime=0;});
reduced.addEventListener('change',()=>{set(wheel,'transform','rotate(0)');set(spool,'transform','rotate(0)');lastFabric=-1;});
controls();drawFabric(0);requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], draw }
