// @ts-nocheck
/* VORLEN B–18 · Coffee grinder. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#e9ecea;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#c4c4c0;--ok:#15a65e;--metal:#d4d6d3;--metal-top:#f0f1ef;--metal-side:#b3b6b3;--rubber:#2c2c2b;--screen:#232526;--coffee:#76604a;--bean:#69513c;--bean-light:#9a7b58;--lamp:#ffd27a;--cone:.3;--glass-a:.2}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c5c7c5;--off:#a5a5a2;--ok:#36d886;--metal:#b3b4b2;--metal-top:#e1e1e0;--metal-side:#7e807e;--rubber:#232323;--screen:#1c1d1e;--coffee:#62503d;--bean:#574331;--bean-light:#816749;--lamp:#ffd27a;--cone:.42;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.08;filter:url(#soft)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .button-face{fill:var(--top)}.control[aria-disabled="true"]{cursor:default}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.rubber{fill:var(--rubber)}.screen{fill:var(--screen)}.coffee{fill:var(--coffee)}.mouth{fill:#111}
.rail-under{fill:none;stroke:var(--line);stroke-width:5;stroke-linejoin:round;stroke-linecap:round}.cable{fill:none;stroke:var(--rubber);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}
.press{transition:transform .1s}.pressed .press{transform:translateY(2px)}.dose-ring{fill:none;stroke:var(--off);stroke-width:1.3}.dosing .dose-ring{stroke:var(--accent);filter:url(#glow)}
.glass-shell{fill:var(--glass);fill-opacity:var(--glass-a)}.glass-film{fill:var(--glass);fill-opacity:calc(var(--glass-a)*.8)}.bean{fill:var(--bean);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.bean-cut{fill:none;stroke:var(--bean-light);stroke-width:.85;stroke-linecap:round;vector-effect:non-scaling-stroke}.grain{fill:var(--coffee);stroke:none}.reflection{fill:none;stroke:#fff;stroke-width:1.2;stroke-linecap:round;opacity:.55;vector-effect:non-scaling-stroke}
.lid,.cup-motion{transition:transform .22s ease-in-out}.running-mark{stroke:var(--accent);stroke-width:1.2}.index{fill:var(--accent);stroke:none}
.scr{fill:var(--accent);font:600 7px ui-monospace,monospace;letter-spacing:.4px;stroke:none}.scr-s{fill:var(--accent);font:2.8px ui-monospace,monospace;letter-spacing:.3px;stroke:none;opacity:.85}.scr-halo{fill:var(--accent);opacity:.12;filter:url(#bloom)}.grinding .scr-halo{opacity:.3}
.rled{fill:var(--off)}.ready .rled{fill:var(--ok);filter:url(#glow)}.grinding .rled{fill:var(--accent);filter:url(#glow)}
.cuplight{opacity:0;transition:opacity .5s;pointer-events:none}.lit .cuplight{opacity:1}.cone{fill:url(#coneG)}.cone-s{stop-color:var(--lamp)}.pool{fill:var(--lamp);fill-opacity:.55;filter:url(#bloom)}.strip{fill:var(--off);transition:fill .3s}.lit .strip{fill:var(--lamp);filter:url(#glow)}
@media(prefers-reduced-motion:reduce){.pressed .press{transform:none}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<clipPath id="hopperClip"><path id="hopperMask"/></clipPath>
<clipPath id="cupClip"><path id="cupMask"/></clipPath>
<linearGradient id="coneG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="cone-s" style="stop-opacity:var(--cone)"/><stop offset="1" class="cone-s" stop-opacity=".02"/></linearGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* VORLEN B–18 single-dose grinder. World: x lower-right, y lower-left, z up; 1 unit ≈ 1 mm.
Part                     x    y    z    w    d    h
power cable             −8  −6    2   38   34   33
feet (4)             23/121 22/145 0  16   16    8
plinth                  14   14    8  132  156   13   brand, seam
tray + grille           41  109   21   78   56    4
tower                   30   22   21  100   80  146   side service panel, vents
front plate             34  102   40   92    2  124   brand, dial, display, dose, READY lamp
grind dial              57  104  128  r19    –    5   numbers 1–12, FINE / COARSE halves
dose display            84  104  139   36    0   16   grams, timer, state
dose button            103  104  119  r10    –    5   ring lights while dosing
burr collar             80   61  167  r45    –   12   rotating scale, fixed index
hopper neck             80   61  180  r23    –    7
glass hopper            80   61  185  r23–42 –   66   beans behind the wall
hopper rim + lid        80   61  249  r44    –   17   lid lifts to refill
chute                   66  104   89   28   26   15   mouth, light strip
cup light cone          80  117   72  r27    –   17
catch cup               80  142   28  r27    –   44   grounds mound, marks
Seams, screws, vents, engravings share their parent faces. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: adopt drawn parts into controls, glass vessels as screen paths, smooth cable, pins.
const adopt=(n,p)=>{const a=n.tagName==='circle'&&n.parentNode.getAttribute('transform')?n.parentNode:n;p.appendChild(a);return a;};
const control=(name,label,transform='')=>group(transform,root,{id:name,class:'control',role:'button',tabindex:'0','aria-label':label});
const screenPath=(d,cls,parent=root)=>el('path',{d,class:cls},parent);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const ex=r=>r*Math.sqrt(1.5),ey=r=>r/Math.sqrt(2);
function vessel(x,y,z,r,zt,rt){
const b=P(x,y,z),t=P(x,y,zt);
return `M${b[0]-ex(r)},${b[1]} L${t[0]-ex(rt)},${t[1]} A${ex(rt)},${ey(rt)} 0 0 1 ${t[0]+ex(rt)},${t[1]} L${b[0]+ex(r)},${b[1]} A${ex(r)},${ey(r)} 0 0 1 ${b[0]-ex(r)},${b[1]} Z`;
}
const f2=v=>v.toFixed(2);
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
function pin(g,x,y,r=.75){circle(g,x,y,r,'face top');line(g,x-r*.5,y+r*.35,x+r*.5,y-r*.35);}
// Base: shadow, cable, feet, plinth, tray.
const shadow=P(82,92,0);el('ellipse',{cx:shadow[0],cy:shadow[1]+5,rx:104,ry:46,class:'shadow stage-floor'});el('ellipse',{cx:shadow[0],cy:shadow[1]+5,rx:104,ry:46,class:'stage-contact'});
const cablePts=[[30,30,36],[20,30,30],[14,26,6],[8,10,2],[-6,2,2],[-8,-8,2]];
el('path',{d:smooth(cablePts),class:'rail-under'});el('path',{d:smooth(cablePts),class:'cable'});box(26,26,28,5,8,10,2,'rubber');
for(const[x,y]of[[23,22],[121,22],[23,145],[121,145]])box(x,y,0,16,16,8,3,'rubber');
box(14,14,8,132,156,13,6,'base');
const plinthF=group(FRONT(14,170,21));line(plinthF,6,9.4,126,9.4);text(plinthF,12,6.2,'VORLEN','etch');pin(plinthF,124,5,.8);
line(group(SIDE(146,170,21)),6,9.4,150,9.4);
// Tower: body, proud front plate, side service panel, deck.
box(30,22,21,100,80,146,9);
const service=group(SIDE(130.2,93,152));rect(service,0,0,61,108,5,'face side');
line(service,7,15,54,15);line(service,7,92,54,92);slits(service,14,25,33,43,9);
for(const p of[[5,6],[56,6],[5,102],[56,102]])screw(service,...p);
rect(service,18,78,25,8,2,'face recess');text(service,30.5,83.5,'B–18','label center');
box(34,102,40,92,2,124,6);
const FP=group(FRONT(34,104,164));
for(const p of[[4.5,4.5],[87.5,4.5],[4.5,119.5],[87.5,119.5]])pin(FP,...p,1);
line(FP,6,104,86,104);slits(FP,10,108,72,6,18);
const brandP=group(FRONT(38,104.2,160));rect(brandP,0,0,40,8,2,'face top');text(brandP,20,6,'VORLEN','label brand center');
const deck=group(TOP(36,28,167.2));rect(deck,0,0,88,68,5,'face top');for(const p of[[5,5],[83,5],[5,63],[83,63]])screw(deck,...p);
// Burr collar with a scale ring that turns with the setting, fixed index, hopper neck.
const collar=cylinder(80,61,167.4,45,12,'z','metal');
const scale=group('rotate(0)',collar.face);circle(collar.face,0,0,38.6,'face recess');
for(let i=0;i<60;i++){const a=i*Math.PI/30,r0=i%5?42:40.4;line(scale,r0*Math.cos(a),r0*Math.sin(a),44*Math.cos(a),44*Math.sin(a));}
ellipse(80,61,179.8,33,'z','face top');cylinder(80,61,179.9,23,7,'z','base');
const idx=group(TOP(80,61,179.6));el('path',{d:'M31.4,31.4 l3.2,-.6 -.6,3.2 Z',class:'index'},idx);
// Glass hopper: shell, beans behind the wall, film, reflections, rim and lid.
const hopperShape=vessel(80,61,185,23,251,42);set(document.getElementById('hopperMask'),'d',vessel(80,61,188,21,249,40));
screenPath(hopperShape,'face glass-shell');
const beanBed=el('g',{'clip-path':'url(#hopperClip)'}),beanCore=screenPath('','bean',beanBed),beanSurface=group('',beanBed);
let seed=18;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
const beans=[];
for(let i=0;i<94;i++){
const a=rand()*Math.PI*2,r=Math.sqrt(rand())*.91,u=Math.cos(a)*r,v=Math.sin(a)*r,g=group('',beanSurface);
el('ellipse',{cx:0,cy:0,rx:3+rand()*1.4,ry:2+rand()*.5,class:'bean'},g);screenPath('M-2.4,-.8 Q-.7,.5 .1,0 T2.4,.8','bean-cut',g);
beans.push({g,u,v,front:i<58,depth:rand(),turn:rand()*180});
}
screenPath(hopperShape,'face glass-film');
wire([[48,50,204],[39,47,239],[40,47,247]],'reflection');wire([[108,73,200],[117,77,240]],'reflection');
ellipse(80,61,186,23,'z','detail');
cylinder(80,61,249,43,5,'z','base');ellipse(80,61,254.2,40,'z','face recess');
const lid=control('refillControl','Refill the bean hopper. Lift lid and refill to 220 grams.');lid.classList.add('lid');
adopt(cylinder(80,61,254.4,44,4,'z').g,lid);adopt(ellipse(80,61,258.6,39,'z','detail'),lid);
adopt(cylinder(80,61,258.8,9,7,'z','metal').g,lid);adopt(ellipse(80,61,266,7.2,'z','face top metal'),lid);
adopt(ellipse(80,61,259,47,'z','focus-ring'),lid);adopt(ellipse(80,61,259,45,'z','hit'),lid);
// Front plate controls: grind dial with FINE / COARSE halves, dose display, dose button.
const bezel=cylinder(57,104,128,21,4,'y','base').face;
circle(bezel,0,0,19.6,'face recess');circle(bezel,0,0,18.2,'face top');
for(let i=0;i<36;i++){const a=i*Math.PI/18;line(bezel,Math.sin(a)*20,-Math.cos(a)*20,Math.sin(a)*21,-Math.cos(a)*21);}
for(let i=0;i<12;i++){const a=(-135+i*270/11)*Math.PI/180;line(bezel,Math.sin(a)*15.4,-Math.cos(a)*15.4,Math.sin(a)*17,-Math.cos(a)*17);if(i%2===0||i===11)text(bezel,Math.sin(a)*12.6,-Math.cos(a)*12.6+1,i+1,'label center micro');}
const dialRotor=group('',bezel);circle(dialRotor,0,0,8.6,'face base');rect(dialRotor,-1.6,-6,3.2,12,1.4,'face top');line(dialRotor,0,-9,0,-16.6,'detail running-mark');
circle(bezel,0,0,1.6,'face recess');
const finer=control('finerControl','Finer grind. Arrow down.',FRONT(57,108.2,128));
el('path',{d:'M0,-23 A23,23 0 0 0 0,23 Z',class:'hit'},finer);el('path',{d:'M-2.6,-23 A23,23 0 0 0 -2.6,23',class:'focus-ring'},finer);
const coarser=control('coarserControl','Coarser grind. Arrow up.',FRONT(57,108.3,128));
el('path',{d:'M0,-23 A23,23 0 0 1 0,23 Z',class:'hit'},coarser);el('path',{d:'M2.6,-23 A23,23 0 0 1 2.6,23',class:'focus-ring'},coarser);
const disp=group(FRONT(84,104.2,155));rect(disp,0,0,36,17,2.6,'face recess');rect(disp,1.6,1.6,32.8,13.8,1.8,'face screen');rect(disp,3,3,30,11,1.4,'scr-halo');
const dG=text(disp,24,10.6,'0.0','scr');set(dG,'text-anchor','end');text(disp,25.4,10.6,'g','scr-s');const dL=text(disp,3.6,14.2,'READY','scr-s');const dT=text(disp,32.6,5.4,'18','scr-s');set(dT,'text-anchor','end');
const rl=group(FRONT(84,104.2,135));circle(rl,3,0,2.2,'face recess');circle(rl,3,0,1.3,'rled');text(rl,7,1,'READY','etch micro');
cylinder(103,104,119,11.4,4,'y','base');
const doseControl=control('doseControl','Grind one 18 gram dose. D.',FRONT(103,108.2,119));
circle(doseControl,0,0,13.6,'focus-ring');const dosePress=group('translate(0 0)',doseControl,{class:'press'});
circle(dosePress,0,0,9.8,'dose-ring');circle(dosePress,0,0,8.6,'face top button-face');circle(dosePress,0,0,6.6,'detail');text(dosePress,0,1.6,'DOSE','label micro center');
circle(doseControl,0,0,13,'hit');
// Tray, chute with light strip, the cup light and the moving catch cup.
box(41,109,21,78,56,4,5,'base');
const tray=group(TOP(44,112,25.2));rect(tray,0,0,72,50,4,'face top');rect(tray,5,5,62,40,3,'face recess');for(let y=10;y<44;y+=6)line(tray,9,y,63,y);
box(66,104,89,28,26,15,4,'metal');
const mouth=group(FRONT(66,130,104));rect(mouth,4,3.4,20,6.4,2,'face recess');rect(mouth,7,5.6,14,2.8,1,'face mouth');const strip=rect(mouth,5,11.6,18,1.6,.8,'strip');
screw(group(SIDE(94.2,126,100)),3,3);
const cupLight=el('g',{class:'cuplight'});
const ca=P(72,124,89),cb=P(88,116,89),cl=P(80-27*Math.SQRT1_2,142+27*Math.SQRT1_2,72),cr=P(80+27*Math.SQRT1_2,142-27*Math.SQRT1_2,72);
el('path',{d:`M${ca}L${cb}L${cr}L${cl}Z`,class:'cone'},cupLight);
const cupControl=control('cupControl','Empty the catch cup.');cupControl.classList.add('cup-motion');
adopt(cylinder(80,142,25,20,3,'z','base').g,cupControl);
const cupShape=vessel(80,142,28,27,72,27);set(document.getElementById('cupMask'),'d',vessel(80,142,30,24,70,24));
screenPath(cupShape,'face glass-shell',cupControl);
const cupContents=el('g',{'clip-path':'url(#cupClip)'},cupControl);
const mound=screenPath('','coffee',cupContents),moundTop=group('',cupContents);
const specks=[];
for(let i=0;i<92;i++){const a=rand()*Math.PI*2,r=Math.sqrt(rand())*.96;const n=circle(moundTop,0,0,.5,'grain');specks.push({n,u:Math.cos(a)*r,v:Math.sin(a)*r});}
const poolG=group(TOP(80,142,40),cupContents);circle(poolG,0,0,20,'pool cuplight');
screenPath(cupShape,'face glass-film',cupControl);
const rim=group(TOP(80,142,72.4),cupControl);
el('path',{d:'M27,0 A27,27 0 1 1 -27,0 A27,27 0 1 1 27,0 Z M24,0 A24,24 0 1 1 -24,0 A24,24 0 1 1 24,0 Z',class:'face top','fill-rule':'evenodd'},rim);
adopt(ellipse(80,142,72.7,24,'z','detail'),cupControl);
const marks=group(FRONT(73,168,60),cupControl);
for(let i=0;i<4;i++){line(marks,0,i*7,4,i*7);if(i%2===0)text(marks,6,i*7+1,i===0?'40':'20','etch micro');}
wire([[61,149,35],[60,151,59]],'reflection',cupControl);
adopt(ellipse(80,142,73,30,'z','focus-ring'),cupControl);screenPath(cupShape,'hit',cupControl);
const flow=el('g',{'aria-hidden':'true',opacity:0});const particles=[];
for(let i=0;i<21;i++){const n=circle(flow,0,0,.7,'grain');particles.push({n,lane:rand(),phase:rand()});}
frame([[14,14,0,132,156,21],[30,22,21,100,80,146],[36,17,167,88,88,100],[-8,-8,0,40,40,36]],12);
// State: the mass leaving the hopper is the mass entering the cup; the display and cup light follow it.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
let size=5,hopper=180,grounds=0,run=null,previous=0,lidUntil=0,cupUntil=0,noticeUntil=0,notice='',pressUntil=0,lightUntil=0,runT0=0,lastSecs=0;
let audio,osc,gain;
function audioGesture(){
try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
if(!audio){audio=new A();osc=audio.createOscillator();gain=audio.createGain();const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=180;osc.type='triangle';osc.frequency.value=72;gain.gain.value=0;osc.connect(filter);filter.connect(gain);gain.connect(audio.destination);osc.start();}
if(audio.state==='suspended')audio.resume().catch(()=>{});}catch(_){}
}
function sound(){if(gain){gain.gain.setTargetAtTime(run?.006:0,audio.currentTime,.07);osc.frequency.setTargetAtTime(68+size*1.6,audio.currentTime,.08);}}
function say(message){announcement.textContent=message;}
function status(message,duration=1800){notice=message;noticeUntil=performance.now()+duration;update();}
function update(){
const now=performance.now();
readout.textContent=`${String(size).padStart(2,'0')} / 12 · ${grounds.toFixed(1)} g`;
stateLabel.textContent=run?(run.mode==='dose'?`DOSING · ${Math.min(18,grounds-run.start).toFixed(1)} / 18 G`:'GRINDING · SPACE TO STOP'):now<noticeUntil?notice:grounds>=40?'CUP FULL · CLICK TO EMPTY':hopper<=0?'HOPPER EMPTY · CLICK LID':'READY · 18 G DOSE';
svg.classList.toggle('grinding',!!run);svg.classList.toggle('ready',!run&&hopper>0&&grounds<40);svg.classList.toggle('dosing',!!run&&run.mode==='dose');svg.classList.toggle('lit',!!run||now<lightUntil);
const disabled=!!run||hopper<=0||grounds>22||now<cupUntil||now<lidUntil;set(doseControl,'aria-disabled',disabled);set(doseControl,'aria-pressed',!!run&&run.mode==='dose');
set(lid,'aria-label',`Refill hopper. ${Math.round(hopper)} of 220 grams remaining.`);set(cupControl,'aria-label',`Empty catch cup. ${grounds.toFixed(1)} grams collected.`);
const secs=run?(now-runT0)/1000:lastSecs;
dG.textContent=(run&&run.mode==='dose'?Math.min(18,grounds-run.start):grounds).toFixed(1);
dT.textContent=run||lastSecs?secs.toFixed(1)+' s':'18 g';
dL.textContent=run?(run.mode==='dose'?'DOSE':'GRIND'):hopper<=0?'REFILL':grounds>=40?'EMPTY CUP':`GRIND ${String(size).padStart(2,'0')}`;
}
function beanDraw(){
const level=clamp(hopper/220),z=190+level*55,r=23+(z-185)/66*19;
set(beanCore,'d',vessel(80,61,188,21,z,r));set(beanBed,'opacity',hopper>0?1:0);
for(const b of beans){const bz=b.front?190+(z-190)*b.depth:z+(1-b.u*b.u-b.v*b.v)*3,br=b.front?(23+(bz-185)/66*19)*.9:r,a=Math.PI/4+b.u*1.45;const p=P(80+(b.front?Math.cos(a):b.u)*br,61+(b.front?Math.sin(a):b.v)*br,bz);set(b.g,'transform',`translate(${p.join(' ')}) rotate(${b.turn})`);}
}
function groundsDraw(){
const fill=clamp(grounds/40),r=fill===0?0:Math.min(24,8+fill*23),h=fill*31;
const p=P(80,142,31),peak=P(80,142,31+h);
set(mound,'d',`M${p[0]-ex(r)},${p[1]} Q${peak[0]-r*.8},${peak[1]-4} ${peak[0]},${peak[1]} Q${peak[0]+r*.8},${peak[1]-4} ${p[0]+ex(r)},${p[1]} A${ex(r)},${ey(r)} 0 0 1 ${p[0]-ex(r)},${p[1]} Z`);
set(poolG,'transform',TOP(80,142,31+h*.7));set(cupContents,'opacity',grounds>0?1:0);
const grain=.28+size*.07;
for(let i=0;i<specks.length;i++){const s=specks[i],z=31+h*(1-s.u*s.u-s.v*s.v),q=P(80+s.u*r,142+s.v*r,z);set(s.n,'cx',q[0]);set(s.n,'cy',q[1]);set(s.n,'r',grain*(.6+(i%4)*.2));set(s.n,'style',`fill:${i%3===0?'var(--bean-light)':'var(--bean)'}`);}
}
function sizeDraw(){
set(dialRotor,'transform',`rotate(${-135+(size-1)*270/11})`);set(scale,'transform',`rotate(${(size-1)*9})`);
set(finer,'aria-disabled',size===1);set(coarser,'aria-disabled',size===12);
set(finer,'aria-label',`Finer grind. Setting ${size} of 12. Arrow down.`);set(coarser,'aria-label',`Coarser grind. Setting ${size} of 12. Arrow up.`);
for(const p of particles)set(p.n,'r',.32+size*.07);
}
function stop(message='GRIND PAUSED'){
if(!run)return;lastSecs=(performance.now()-runT0)/1000;run=null;lightUntil=performance.now()+(reduced.matches?0:2600);set(flow,'opacity',0);sound();status(message);say(`${message.toLowerCase()}. ${grounds.toFixed(1)} grams in the cup.`);
}
function start(mode){
audioGesture();const now=performance.now();if(now<cupUntil||now<lidUntil){status('WAIT FOR CUP / LID');return;}
if(run){if(mode==='manual')stop();return;}
if(hopper<=0){status('HOPPER EMPTY · CLICK LID');say('Click the lid to refill the bean hopper.');return;}
if(grounds>=40||(mode==='dose'&&grounds>22)){status('EMPTY CUP BEFORE DOSING');say('Click the catch cup to empty it before grinding.');return;}
if(mode==='dose'&&hopper<18){status('REFILL FOR AN 18 G DOSE');say('Click the lid to refill for a complete dose.');return;}
run={mode,start:grounds,target:mode==='dose'?grounds+18:40};runT0=now;noticeUntil=0;previous=now;pressUntil=now+180;doseControl.classList.toggle('pressed',mode==='dose');set(flow,'opacity',reduced.matches?0:1);update();sound();say(mode==='dose'?'Grinding an 18 gram dose.':'Grinding. Press Space again to stop.');
}
function changeSize(delta){
audioGesture();const next=clamp(size+delta,1,12);if(next===size){status(size===1?'FINE LIMIT · 01':'COARSE LIMIT · 12');say(`Grind setting ${size}, limit reached.`);return;}
size=next;sizeDraw();groundsDraw();sound();status(`GRIND ${size<5?'FINE':size>8?'COARSE':'MEDIUM'} · ${Math.round(200+size*55)} µM`);say(`Grind setting ${size} of 12. ${size<5?'Fine':size>8?'Coarse':'Medium'}.`);
}
function refill(){
audioGesture();if(performance.now()<lidUntil)return;stop('GRIND STOPPED');hopper=220;beanDraw();lidUntil=performance.now()+950;
set(lid,'transform',reduced.matches?'':'translate(0 -15)');status('HOPPER FULL · 220 G');say('Lid opened. Hopper refilled to 220 grams.');
}
function emptyCup(){
audioGesture();if(performance.now()<cupUntil)return;stop('GRIND STOPPED');grounds=0;lastSecs=0;groundsDraw();cupUntil=performance.now()+750;
const p=P(80,142,28);set(cupControl,'transform',reduced.matches?'':`translate(30 -3) rotate(12 ${p.join(' ')})`);status('CUP EMPTIED · 0.0 G');say('Catch cup emptied.');
}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(finer,()=>changeSize(-1));bind(coarser,()=>changeSize(1));bind(doseControl,()=>start('dose'));bind(lid,refill);bind(cupControl,emptyCup);
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
const action={' ':()=>start('manual'),ArrowUp:()=>changeSize(1),ArrowDown:()=>changeSize(-1),d:()=>start('dose')}[e.key.length===1?e.key.toLowerCase():e.key];
if(action){e.preventDefault();action();}
});
// The whole chute is a generous target for continuous grinding.
const grindControl=control('grindControl','Start or stop continuous grinding. Space.',FRONT(66,130,104));
rect(grindControl,-3,-8,34,25,4,'focus-ring');rect(grindControl,-3,-8,34,25,4,'hit');set(grindControl,'aria-pressed','false');bind(grindControl,()=>start('manual'));
function tick(now){
const dt=previous?Math.min(.1,(now-previous)/1000):0;previous=now;
if(run){
const amount=Math.min((4.2+size*.08)*dt,hopper,40-grounds,run.target-grounds);
hopper=Math.max(0,hopper-amount);grounds=Math.min(40,grounds+amount);beanDraw();groundsDraw();
for(const p of particles){const t=(now*.0017+p.phase)%1,q=P(74+p.lane*12,120+t*16,89-t*24);set(p.n,'cx',q[0]);set(p.n,'cy',q[1]);}
if(grounds>=run.target-.0001)stop(run.mode==='dose'?'DOSE COMPLETE · 18.0 G':'CUP FULL · CLICK TO EMPTY');
else if(hopper<=.0001){hopper=0;stop('HOPPER EMPTY · CLICK LID');}
}
if(lidUntil&&now>=lidUntil){lidUntil=0;set(lid,'transform','');}
if(cupUntil&&now>=cupUntil){cupUntil=0;set(cupControl,'transform','');}
if(now>=pressUntil)doseControl.classList.remove('pressed');
set(grindControl,'aria-pressed',!!run);update();requestAnimationFrame(tick);
}
beanDraw();groundsDraw();sizeDraw();update();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], draw }
