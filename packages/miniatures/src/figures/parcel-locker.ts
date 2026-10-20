// @ts-nocheck
/* SELVO P–06 · Parcel locker. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--parcel:#cdb998;--parcel-top:#e3d3b2;--parcel-side:#b09977;--tape:#e6d8be;--paper:#f8f4e8;--ok:#15a65e;--amber:#e88a00;--laser:#ff3b30;--off:#c4c4c0;--screen:#1f2224;--scr-ink:#e4e6ea;--scr-key:#2e3236;--lamp:#ffe2a8;--rubber:#2c2c2b}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--parcel:#ac9b7f;--parcel-top:#d4c5a6;--parcel-side:#7b6b52;--tape:#c2b6a0;--paper:#d0cec6;--ok:#36d886;--amber:#ffad2b;--laser:#ff4c41;--off:#a5a5a2;--screen:#191b1c;--scr-ink:#d8dade;--scr-key:#1c1f22;--lamp:#fff0cc;--rubber:#232323;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.accent{fill:var(--accent);stroke:var(--accent)}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:8px;letter-spacing:2px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}.led{fill:var(--ok);stroke:none;filter:url(#glow)}.led-halo{fill:var(--ok);opacity:.35;filter:url(#bloom)}.released .led,.released .led-halo{fill:var(--accent)}.released .led-halo{opacity:.6}.busy .released .led{animation:blink .5s steps(2,end) infinite}.empty .led{fill:var(--off);filter:none}.empty .led-halo{opacity:0}.empty .number{fill:var(--muted)}.bay-glow{fill:var(--accent);opacity:0;filter:url(#bloom);transition:opacity .4s;pointer-events:none}.released .bay-glow,.lit-bay .bay-glow{opacity:.45}.number{font-size:9px;letter-spacing:1px}.control{cursor:pointer;outline:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .button-face{fill:var(--top)}.control:hover .door-face{fill:var(--top)}.pressed .button-face{fill:var(--accent);fill-opacity:.3}.control[aria-disabled="true"]{cursor:default}.screen-text{fill:var(--scr-ink);font:6px ui-monospace,monospace;letter-spacing:.4px;text-anchor:middle}.screen-code{fill:var(--accent);font-size:10px;letter-spacing:2px}.key{font-size:8px;text-anchor:middle;fill:var(--scr-ink);pointer-events:none}.hit{fill:transparent;stroke:none;pointer-events:all}.scr{fill:var(--screen)}.scr-halo{fill:var(--accent);opacity:.16;filter:url(#bloom)}.kbtn{fill:var(--scr-key);stroke:#5b6168;stroke-width:.5;vector-effect:non-scaling-stroke}.control:hover .kbtn{stroke:var(--accent)}.pressed .kbtn{fill:var(--accent);fill-opacity:.55}.parcel{fill:var(--parcel)}.top.parcel{fill:var(--parcel-top)}.side.parcel{fill:var(--parcel-side)}.rubber{fill:var(--rubber)}.sign{fill:var(--accent);font:700 6px ui-monospace,monospace;letter-spacing:2.6px;text-anchor:middle;filter:url(#glow)}.sign-halo{fill:var(--accent);opacity:.18;filter:url(#bloom)}.strip{fill:var(--lamp);filter:url(#glow)}.tape{fill:var(--tape);stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke}.paper{fill:var(--paper)}.barcode{fill:var(--line);stroke:none}.idle{fill:var(--ok);filter:url(#glow);animation:breathe 2.8s ease-in-out infinite alternate}.scan-beam{fill:var(--laser);opacity:0}.scanning .scan-beam{opacity:.8;animation:scan .7s linear 2}.error .screen-border{stroke:var(--amber)}.error .screen-code{fill:var(--amber)}.busy .idle{fill:var(--amber);animation:none}.progress{fill:var(--accent);stroke:none;filter:url(#glow)}.empty-mark{stroke:var(--line);stroke-width:.7;fill:none;opacity:.5}
@keyframes breathe{to{opacity:.4}}@keyframes blink{50%{opacity:.15}}@keyframes scan{from{transform:translateY(0)}to{transform:translateY(13px)}}
@media(prefers-reduced-motion:reduce){.scanning .scan-beam{transform:translateY(6px)}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = ``

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* World coordinates: x lower-right; y lower-left; z up. Painter's order.
Part                         x    y    z    w    d    h
rear feet (2)               18   17    0   20   18    5
front feet (2)              18   67    0   20   18    5
right feet use x=260
plinth                       4    6    5  296   81   11
cabinet                     10   10   16  284   70  244
roof cap                     7    7  260  290   76    7
roof seam                   13   13  267  278   64    0
right service inset        294   22   32    0   47  213
kiosk face                  16   81   25  108    0  226
brand plate                 29   82  231   77    0   14
touchscreen bezel           19   82  102  106    4  124
touchscreen glass           23   87  106   98    0  116
keypad (3×4 cells)           24   87  107   96    0   72
scanner housing             40   82   63   55   10   27
scanner lens                45   93   68   45    0   16
service hatch               30   82   29   76    0   27
bay rims (2×3)             129   81   12   79    0   74
bay second column x=210; row bottoms z=12,92,172
cavity back + floor        132   82   14   73   38   70
door slabs                 132   83   14   73    2   70
hinges (two per door)      131   85   22    3    0    8
upper hinges use z=68; rows use the same +80 z offset
pull handle                191   83   35    8    0   19
slider shelf (per bay)     137   42   18   63   38    3
parcel (per bay)           143   44   21   51   32   32
slider + parcel use column offset 81 and row offset 80
slide travel is +70 y; door hinges rotate 103° around z
All seams, screws, labels and lens layers share their parent faces.
*/
// Isometric engine: affine face planes, solids, round parts, grille and fit.
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Assembly: back to front; shelves support every moving parcel.
const shadow=P(152,56,0);el('ellipse',{cx:shadow[0],cy:shadow[1]+5,rx:188,ry:62,class:'shadow stage-floor'});el('ellipse',{cx:shadow[0],cy:shadow[1]+5,rx:188,ry:62,class:'stage-contact'});
for(const[x,y]of[[18,17],[260,17],[18,67],[260,67]])box(x,y,0,20,18,5,3,'recess');
box(4,6,5,296,81,11,5,'base');
const kick=group(FRONT(4,87,16));rect(kick,10,3,276,5,2,'face recess');line(group(SIDE(300,87,16)),6,5.5,75,5.5);
box(10,10,16,284,70,244,5);
box(7,7,260,290,76,7,4);
const roof=group(TOP(13,13,267.1));rect(roof,0,0,278,64,4,'detail');line(roof,112,3,112,61);for(const x of[6,272])for(const y of[6,58])screw(roof,x,y);
const capF=group(FRONT(7,83,267));rect(capF,6,5.2,278,1.2,.6,'strip');
const side=group(SIDE(294.3,69,245));rect(side,0,0,47,213,4,'face base');
rect(side,5,12,37,80,3,'detail');line(side,8,19,39,19);slits(side,10,24,27,4,8);
slits(side,9,183,29,12,6,false);screw(side,5,6);screw(side,42,6);screw(side,5,207);screw(side,42,207);
text(side,23.5,105,'P–06','etch center');line(side,7,111,40,111);
const kiosk=group(FRONT(16,81,251));rect(kiosk,0,0,108,226,5,'face');
for(const p of[[5,5],[99,5],[5,221],[99,221]])screw(kiosk,...p);
line(kiosk,101,15,101,211);line(kiosk,6,204,96,204);
const plate=group(FRONT(29,82,245));rect(plate,0,0,77,14,3,'face base');rect(plate,2.4,2.4,72.2,9.2,2,'face scr');rect(plate,6,3.6,65,6.8,2,'sign-halo');text(plate,38.5,9.4,'SELVO','sign');
box(19,82,102,106,4,124,4,'base');
const screen=group(FRONT(23,87,222));rect(screen,0,0,98,116,3,'face scr screen-border');
rect(screen,4,4,90,30,2,'scr-halo');
text(screen,49,11,'COLLECT A PARCEL','screen-text');
const screenCode=text(screen,49,25,'– – – –','screen-text screen-code');
const screenStatus=text(screen,49,35,'DEMO 2468 → 04','screen-text');
line(screen,6,40,92,40);set(screen.lastChild,'style','stroke:#5b6168');const progress=rect(screen,6,39.6,0,1.2,.6,'progress');
const controls=[];
function bind(g,fn){g.addEventListener('click',()=>{fn();g.blur?.();});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
const keyLabels=['1','2','3','4','5','6','7','8','9','CLR','0','OK'];
keyLabels.forEach((value,i)=>{
const x=1+i%3*32,y=43+Math.floor(i/3)*18;
const g=group(`translate(${x} ${y})`,screen,{class:'control',role:'button',tabindex:'0','aria-label':value==='OK'?'Open locker or collect parcel (Enter)':value==='CLR'?'Clear code or close door (Escape)':`Code digit ${value}`,id:`key-${value.toLowerCase()}`});
rect(g,2,1.5,28,15,2,'kbtn');rect(g,.5,.5,31,17,3,'focus-ring');text(g,16,11,value,'key');rect(g,0,0,32,18,0,'hit');
bind(g,()=>{if(value==='OK')submit();else if(value==='CLR')escape();else digit(value);g.classList.add('pressed');setTimeout(()=>g.classList.remove('pressed'),140);});controls.push(g);
});
const scanner=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Scan a demo pickup barcode',id:'scanner'});
scanner.appendChild(box(40,82,63,55,10,27,4,'base'));
const lens=group(FRONT(45,93,84),scanner);rect(lens,0,0,45,16,3,'face recess');rect(lens,3,3,39,10,2,'face glass');
for(let i=0;i<18;i++)rect(lens,6+i*1.85,5,i%3===0?1.2:.55,6,0,'barcode');
const beam=rect(lens,3,2,39,.8,0,'scan-beam');set(beam,'filter','url(#glow)');rect(lens,-5,-5,55,27,4,'focus-ring');
text(group(FRONT(67.5,93,60),scanner),0,0,'SCAN PICKUP BARCODE','etch center');bind(scanner,scan);
const service=group(FRONT(30,82,56));rect(service,0,0,76,27,3,'face base');slits(service,9,8,46,7,12);screw(service,4,4);screw(service,72,23);
circle(service,66,13,3,'face recess');line(service,66,11.5,66,14.5);text(service,30,23,'P–06 / POST SERVICE','etch center micro');
const online=group(FRONT(110,82,239));circle(online,0,0,2.4,'face recess');circle(online,0,0,1.5,'led idle');
// Each cavity clips its back, rails and stored parcel to the actual aperture.
const lockers=[],codes=['1234','2048','3579','2468','5800','9061'];
for(let row=0;row<3;row++)for(let col=0;col<2;col++){
const id=row*2+col+1,x=132+col*81,z=174-row*80,top=z+70;
const rim=group(FRONT(x-3,81,top+2));const halo=rect(rim,-5,-5,89,84,8,'bay-glow');rect(rim,0,0,79,74,4,'face base');
const hole=group(FRONT(x,82,top));rect(hole,0,0,73,70,3,'face recess');rect(hole,7,6,59,53,2,'face base');
el('path',{d:'M1,1 L7,6 V59 L1,69 Z',class:'face recess'},hole);
el('path',{d:'M72,1 L66,6 V59 L72,69 Z',class:'face base'},hole);
el('path',{d:'M1,69 L7,59 H66 L72,69 Z',class:'face top'},hole);
line(hole,8,48,65,48);line(hole,8,50,65,50);screw(hole,4,4);screw(hole,69,4);
const clip=el('clipPath',{id:`bay-${id}`},svg.querySelector('defs'));
el('path',{d:poly([[x,82,top],[x+73,82,top],[x+73,82,z],[x,82,z]],true)},clip);
const inside=el('g',{'clip-path':`url(#bay-${id})`});
const slider=el('g',{},inside);slider.appendChild(box(x+5,42,z+4,63,38,3,2,'base'));
const floor=group(TOP(x+6,43,z+7.15),slider);rect(floor,0,0,61,36,2,'face top');line(floor,4,3,4,33);line(floor,57,3,57,33);
const lip=group(FRONT(x+5,80,z+7),slider);line(lip,4,1.4,59,1.4);
const parcel=el('g',{class:'control',role:'button',tabindex:'-1','aria-label':`Collect parcel from locker ${String(id).padStart(2,'0')}`,id:`parcel-${id}`},slider);
parcel.appendChild(box(x+11,44,z+7,51,32,32,2,'parcel'));
const pt=group(TOP(x+11,44,z+39.1),parcel);rect(pt,22,0,7,32,0,'tape');line(pt,0,16,22,16);line(pt,29,16,51,16);line(pt,2,2,8,7);line(pt,43,25,49,30);
const pf=group(FRONT(x+11,76.2,z+39),parcel);rect(pf,22,0,7,10,0,'tape');rect(pf,6,12,28,14,1,'face paper');
for(let i=0;i<15;i++)rect(pf,9+i*1.35,16,i%4===0?1.1:.5,6,0,'barcode');line(pf,9,24,23,24);line(pf,39,27,47,27);
rect(pf,-2,-2,55,36,3,'focus-ring');bind(parcel,()=>{if(active===locker&&phase==='open')collect();});
const ps=group(SIDE(x+62.1,76,z+39),parcel);rect(ps,12,2,7,10,0,'tape');line(ps,4,26,28,26);
const door=el('g',{class:'control',role:'button',tabindex:'0','aria-label':`Locker ${String(id).padStart(2,'0')}: use its pickup code`,'aria-expanded':'false',id:`door-${id}`});
const edge=group(FRONT(x,85,top),door);rect(edge,0,0,73,70,3,'face base');
const face=group(FRONT(x,83,top),door);rect(face,0,0,73,70,3,'face door-face');rect(face,3,3,67,64,2,'detail');line(face,5,4,68,4);
text(face,13,18,String(id).padStart(2,'0'),'label number');circle(face,63,11,3,'led-halo');circle(face,63,11,2.3,'face recess');const led=circle(face,63,11,1.2,'led');
rect(face,59,30,8,19,2,'face recess');rect(face,61,31,6,17,2,'face top');line(face,63,35,63,45);circle(face,63.5,54,2,'face base');line(face,63.5,53,63.5,55);
rect(face,-1,-1,75,72,4,'focus-ring');rect(face,0,0,73,70,3,'hit');
for(const h of[8,54]){const hinge=group(FRONT(x-1,85,top-h),door);rect(hinge,0,0,3,8,1,'face base');line(hinge,1.5,1,1.5,7);}
const back=group(FRONT(x,83,top),door,{visibility:'hidden'});
rect(back,0,0,73,70,3,'face base');rect(back,4,4,65,62,2,'detail');
for(const yy of[12,55]){rect(back,8,yy,57,4,1,'face top');screw(back,11,yy+2);screw(back,62,yy+2);}
rect(back,-1,-1,75,72,4,'focus-ring');rect(back,0,0,73,70,3,'hit');
const locker={id,x,z,top,inside,slider,parcel,door,face,back,edge,led,halo,available:true,code:codes[id-1]};lockers.push(locker);
bind(door,()=>{if(active===locker&&phase==='open')collect();else if(!active){code='';message=`LOCKER ${String(id).padStart(2,'0')} / SCAN FOR CODE`;say('Use your four digit code, or click the scanner for a valid demo code.');drawUI();}});
}
const moving=el('g',{id:'moving-parts'});
frame([[4,6,0,296,81,267],[132,42,18,144,112,226]],12);
// A single explicit cycle prevents doors or shelves from colliding.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
let code='',message='READY / DEMO 2468 → 04',phase='ready',active=null,start=0,angle=0,travel=0,scanTimer=0,closingFrom=0,scanIndex=3;
const clamp=(v)=>Math.max(0,Math.min(1,v)),ease=(v)=>{v=clamp(v);return v*v*(3-2*v);};
const num=(l)=>String(l.id).padStart(2,'0');
function say(s){announcement.textContent=s;}
function drawUI(){
const entered=code.padEnd(4,'–').split('').join(' ');
readout.textContent=active?`LOCKER ${num(active)} · ${phase==='open'?'COLLECT':phase==='opening'?'OPENING':phase==='closing'?'CLOSING':'RETRACTING'}`:`CODE · ${entered}`;
stateLabel.textContent=message;screenCode.textContent=active?`BAY ${num(active)}`:entered;
screenStatus.textContent=active?(phase==='open'?'ENTER TO COLLECT':phase==='opening'?'UNLOCKING…':'PLEASE WAIT'):code.length===4?'PRESS ENTER':code.length?`${code.length} / 4 DIGITS`:'DEMO 2468 → 04';
set(progress,'width',active?phase==='open'?86:phase==='opening'?86*angle:86*travel:code.length*21.5);
svg.classList.toggle('busy',!!active&&phase!=='open');
for(const b of controls)set(b,'aria-disabled',!!active&&b.id!=='key-clr'&&b.id!=='key-ok');
}
function digit(n){
if(active){message=phase==='open'?'ENTER TO COLLECT / ESC TO RETURN':'SHELF IN MOTION';drawUI();return;}
svg.classList.remove('error');if(code.length===4)code='';code+=n;message=code.length===4?'CODE COMPLETE / ENTER':`ENTER CODE / ${code.length} OF 4`;drawUI();
}
function pose(a,t){
angle=a;travel=t;if(!active)return;
const l=active,theta=a*103*Math.PI/180,c=Math.cos(theta),s=Math.sin(theta),origin=P(l.x,83,l.top);
const plane=`matrix(${C*(c-s)} ${S*(c+s)} 0 1 ${origin.join(' ')})`;
set(l.face,'transform',plane);set(l.back,'transform',plane);
set(l.face,'visibility',c>=s?'visible':'hidden');set(l.back,'visibility',c>=s?'hidden':'visible');
const edgeOrigin=P(l.x-s*2,83+c*2,l.top);set(l.edge,'transform',`matrix(${C*(c-s)} ${S*(c+s)} 0 1 ${edgeOrigin.join(' ')})`);
const shift=P(0,t*70,0);set(l.slider,'transform',`translate(${shift.join(' ')})`);
}
function unlock(l){
active=l;phase='opening';start=performance.now();code='';message=`LOCKER ${num(l)} / LATCH RELEASED`;
l.door.classList.add('released');l.halo.parentNode.classList.add('lit-bay');set(l.door,'aria-expanded','true');set(l.door,'aria-label',`Locker ${num(l)} open: collect parcel`);
// The travelling tray paints after the bank; its left-swinging door paints last.
moving.appendChild(l.slider);moving.appendChild(l.door);set(l.parcel,'tabindex','-1');say(`Locker ${num(l)} unlocked. The door opens and the parcel shelf extends.`);pose(0,0);drawUI();
if(reduced.matches){pose(1,1);opened();}
}
function opened(){phase='open';message=`PARCEL READY / ENTER TO COLLECT`;set(active.parcel,'tabindex','0');say(`Locker ${num(active)} open. Press Enter or select the parcel to collect. Escape returns the parcel and closes the door.`);drawUI();}
function submit(){
if(active){if(phase==='open')collect();else{message='SHELF IN MOTION / PLEASE WAIT';drawUI();}return;}
if(code.length!==4){message='FOUR DIGITS REQUIRED';svg.classList.add('error');say('Enter four digits. Try demo code 2468.');drawUI();return;}
const l=lockers.find(l=>l.code===code);
if(!l||!l.available){message=l?`LOCKER ${num(l)} ALREADY COLLECTED`:'CODE NOT FOUND / TRY 2468';svg.classList.add('error');say(l?'This parcel was already collected. Scan for the next parcel.':'Code not found. Try 2468.');drawUI();return;}
svg.classList.remove('error');unlock(l);
}
function collect(){
if(!active||phase!=='open')return;
active.available=false;set(active.parcel,'visibility','hidden');set(active.parcel,'tabindex','-1');active.door.classList.add('empty');message=`PARCEL ${num(active)} COLLECTED / RETURNING SHELF`;say(`Parcel ${num(active)} collected. Shelf retracting; door closing.`);beginReturn();
}
function beginReturn(){closingFrom=travel;phase='retracting';start=performance.now();drawUI();if(reduced.matches){pose(1,0);phase='closing';finish();}}
function escape(){
svg.classList.remove('error');
if(active){if(phase==='opening'||phase==='open'){message=`LOCKER ${num(active)} / RETURNING PARCEL`;say('Returning the parcel and closing the door.');beginReturn();}else{message='DOOR CLOSING / PLEASE WAIT';drawUI();}return;}
code='';message='CODE CLEARED / DEMO 2468 → 04';say('Code cleared.');drawUI();
}
function finish(){
const l=active;pose(0,0);l.inside.appendChild(l.slider);root.insertBefore(l.door,moving);l.door.classList.remove('released');l.halo.parentNode.classList.remove('lit-bay');set(l.door,'aria-expanded','false');set(l.door,'aria-label',`Locker ${num(l)}: ${l.available?'use its pickup code':'parcel collected'}`);
set(l.parcel,'tabindex','-1');phase='ready';message=l.available?`LOCKER ${num(l)} CLOSED / PARCEL RETURNED`:`PARCEL ${num(l)} COLLECTED / DOOR CLOSED`;active=null;drawUI();say(message.toLowerCase());
}
function scan(){
if(active){message='FINISH COLLECTION BEFORE SCANNING';drawUI();return;}
const available=lockers.filter(l=>l.available);if(!available.length){message='ALL SIX PARCELS COLLECTED';code='';drawUI();say('All six parcels collected. Reload the figure to restock.');return;}
const l=lockers.slice(scanIndex).concat(lockers.slice(0,scanIndex)).find(l=>l.available);scanIndex=l.id%6;
code=l.code;message=`BARCODE READ / LOCKER ${num(l)} / ENTER`;svg.classList.remove('error');scanner.classList.remove('scanning');void scanner.getBoundingClientRect();scanner.classList.add('scanning');clearTimeout(scanTimer);scanTimer=setTimeout(()=>scanner.classList.remove('scanning'),1450);say(`Barcode read. Code ${code} for locker ${num(l)}. Press Enter to open.`);drawUI();
}
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
if(/^[0-9]$/.test(e.key)){e.preventDefault();digit(e.key);}else if(e.key==='Enter'){e.preventDefault();submit();}else if(e.key==='Escape'){e.preventDefault();escape();}
});
function tick(now){
if(active&&!reduced.matches){
if(phase==='opening'){
const elapsed=now-start;pose(ease(elapsed/850),ease((elapsed-500)/950));
if(elapsed>=1450){pose(1,1);opened();}else drawUI();
}else if(phase==='retracting'){
pose(angle,closingFrom*(1-ease((now-start)/800)));drawUI();
if(now-start>=800){pose(angle,0);phase='closing';start=now;closingFrom=angle;message=`LOCKER ${num(active)} / DOOR CLOSING`;drawUI();}
}else if(phase==='closing'){
pose(closingFrom*(1-ease((now-start)/850)),0);drawUI();if(now-start>=850)finish();
}
}
requestAnimationFrame(tick);
}
// Preference changes settle an in-flight cycle without leaving a shelf extended.
reduced.addEventListener('change',()=>{if(!active||!reduced.matches)return;if(phase==='opening'){pose(1,1);opened();}else if(phase!=='open')finish();});
drawUI();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], draw }
