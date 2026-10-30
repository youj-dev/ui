// @ts-nocheck
/* ORVET C–24 · Cartesian 3D printer. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--base-top:#cbcbc7;--base-side:#a4a4a1;--recess:#9d9d99;--recess-top:#b0b0ac;--recess-side:#8a8a86;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--chrome:#d4d5d2;--chrome-top:#efefec;--chrome-side:#b6b7b4;--rubber:#333331;--rubber-top:#474745;--rubber-side:#282827;--screen:#1d2226;--sheet:#3b3b39;--sheet-line:#5a5a57;--filament:#e97850;--filament-line:#ae5337;--hot:#ff6a2b;--led:#fff3d6}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--base-top:#bebeba;--base-side:#737372;--recess:#6e6e6c;--recess-top:#a4a4a1;--recess-side:#60605e;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--chrome:#b3b3b1;--chrome-top:#e0e0dd;--chrome-side:#80807f;--rubber:#292928;--rubber-top:#424240;--rubber-side:#191919;--screen:#181b1d;--sheet:#30302f;--sheet-line:#4b4b49;--filament:#c46442;--filament-line:#92452d;--hot:#ff7a3d;--led:#ffeccc;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.top.base{fill:var(--base-top)}.side.base{fill:var(--base-side)}.recess{fill:var(--recess)}.top.recess{fill:var(--recess-top)}.side.recess{fill:var(--recess-side)}.glass{fill:var(--glass)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}.side.rubber{fill:var(--rubber-side)}.screen{fill:var(--screen)}.sheet{fill:var(--sheet)}.sheet-line{fill:none;stroke:var(--sheet-line);stroke-width:.5;vector-effect:non-scaling-stroke}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.accent{fill:var(--accent);stroke:var(--accent)}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}.lamp{fill:var(--off);stroke:none;transition:fill .2s}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.r,.lamp.b{filter:url(#glow)}.strip{fill:var(--off);transition:fill .3s}.lights .strip{fill:var(--led);filter:url(#glow)}.wash{fill:url(#washG);opacity:0;transition:opacity .4s;pointer-events:none}.lights .wash{opacity:1}.hotglow{fill:var(--hot);filter:url(#bloom);opacity:0;pointer-events:none}.nozzle-pool{fill:var(--led);filter:url(#bloom);opacity:0;pointer-events:none}.led{fill:var(--muted);stroke:none}.led-halo{opacity:0;transition:opacity .3s}.powered .led{fill:var(--accent);filter:url(#glow)}.powered .led-halo{opacity:.6}.lit{fill:var(--accent)}.control{cursor:pointer;outline:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .button-face{fill:var(--top)}.active .button-face{fill:var(--accent);fill-opacity:.18;stroke:var(--accent)}.hit{fill:transparent;stroke:none}.cable-under{fill:none;stroke:var(--line);stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.cable{fill:none;stroke:var(--rubber);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}.rod-under{fill:none;stroke:var(--line);stroke-width:4;stroke-linecap:round}.rod{fill:none;stroke:var(--chrome-top);stroke-width:2.3;stroke-linecap:round}.belt{fill:none;stroke:var(--recess);stroke-width:2.2;vector-effect:non-scaling-stroke}.filament{fill:var(--filament);stroke:var(--filament-line);stroke-width:.5}.filament.top{fill:var(--filament)}.hollow{fill:var(--recess);stroke:var(--filament-line);stroke-width:.55}.feed{fill:none;stroke:var(--filament);stroke-width:1.15;stroke-linecap:round;vector-effect:non-scaling-stroke}.toolpath{fill:none;stroke:var(--filament);stroke-width:1.7;stroke-linecap:round;vector-effect:non-scaling-stroke}.heat{fill:var(--filament);stroke:none;pointer-events:none}.screen-text{font:8px ui-monospace,monospace;letter-spacing:.3px;stroke:none}.screen-small{font:3.3px ui-monospace,monospace;letter-spacing:.3px;stroke:none}.screen-track{fill:#3a3f44;stroke:none}.screen-bar{fill:var(--accent);stroke:none}.fan-rotor{transform-box:fill-box;transform-origin:center;animation:spin 2.4s linear infinite;animation-play-state:paused}.powered .fan-rotor{animation-play-state:running}.printing .fan-rotor,.cooling .fan-rotor{animation-duration:.65s}.powered .heartbeat{animation:breathe 2s ease-in-out infinite alternate}.screen-control:hover .glass{stroke:var(--accent)}
@keyframes spin{to{transform:rotate(360deg)}}@keyframes breathe{to{opacity:.35}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="washG"><stop offset="0" style="stop-color:var(--led);stop-opacity:.4"/><stop offset="1" style="stop-color:var(--led);stop-opacity:0"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* World coordinates: x lower-right; y lower-left; z up.
Part x y z w d h
rear feet 24 28 0 20 20 10 / right x 228
front feet 24 194 0 20 20 10 / right x 228
chassis 12 18 10 252 210 23
rear cross brace 44 77 33 184 19 14
left / right uprights 28 80 33 16 20 236 / right x 228
top cross member 28 80 269 216 20 17
upright caps 27 79 286 18 22 3 / right x 227
Z motor mounts 43 80 33 16 24 22 / right x 213
Z lead screws 48 96 55 4 4 213 / right x 218
Y rails 70 42 37 4 168 4 / right x 194
Y belt 135 40 36 6 173 2
bed carriage 73 81 40 128 107 7
bed springs 61 79 47 7 7 8 / x 212, y 192
bed heater 55 73 55 172 139 6
build sheet 58 76 61 166 133 1
bed leveling wheels 61 195 48 12 12 4 / right x 218
vase envelope 113 117 62 50 50 65
X beam 44 87 228 184 17 18
X motor 33 84 223 25 26 27
X idler 218 90 224 14 20 25
head backplate 37 101 220 42 9 31
head 42 105 211 32 25 37
fan bezel 47 131 224 22 3 22
heat block 52 113 205 12 13 7
nozzle 56 125 202 4 4 4
spool bracket 214 63 286 10 15 40
spool 183 63 290 72 22 72
spool axle 215 72 322 8 19 8
filament guide 173 82 291 11 12 12
control pod 173 206 33 86 36 48
screen 179 243 44 48 0 31
speed dial 236 243 51 21 5 21
home / cool buttons 97 229 14 22 0 16 / cool x 130
Head and X beam translate in X/Z; bed, springs and vase translate in Y.
Seams, screws, LEDs, ports, slits, rings and labels share their parent face.
Filament, belt and cable endpoints meet their guides and moving carriers.
*/
// Isometric engine: affine face planes, solids, round parts, grille and fit.
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Assembly: back to front, all physical parts in world coordinates.
const f2=v=>(+v).toFixed(2);
function pack(parent,build){const mark=root.childNodes.length;build();for(const n of Array.from(root.childNodes).slice(mark))parent.appendChild(n);}
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const sh=P(138,127,0);el('ellipse',{cx:sh[0],cy:sh[1]+5,rx:177,ry:65,class:'shadow stage-floor'});el('ellipse',{cx:sh[0],cy:sh[1]+5,rx:177,ry:65,class:'stage-contact'});
for(const[x,y]of[[24,28],[228,28],[24,194],[228,194]])box(x,y,0,20,20,10,3,'rubber');
box(12,18,10,252,210,23,5,'base');
const baseFront=group(FRONT(12,228.2,33));
line(baseFront,6,5,246,5);line(baseFront,6,20,246,20);
text(baseFront,13,15,'ORVET','label brand');
slits(baseFront,49,9,24,9,7);slits(baseFront,159,9,72,9,18);
for(const x of[5,246])screw(baseFront,x,12);
const baseSide=group(SIDE(264.2,213,31));rect(baseSide,0,0,54,17,3,'face side');slits(baseSide,8,5,36,6,10);
rect(baseSide,58,3,13,8,2,'face recess');rect(baseSide,61,5,7,4,1,'face glass');
screw(baseSide,3,9);screw(baseSide,50,9);
box(44,77,33,184,19,14,3,'base');
for(const x of[28,228]){
box(x,80,33,16,20,236,3);
const f=group(FRONT(x,100.2,269));
rect(f,6,8,4,220,1,'face recess');line(f,2,10,2,226);line(f,14,10,14,226);
for(const z of[7,232])screw(f,8,z);
const side=group(SIDE(x+16.2,96,263));line(side,0,0,0,220);line(side,8,0,8,220);
box(x-1,79,286,18,22,3,2,'recess');
}
box(28,80,269,216,20,17,3);
const lightControl=group(FRONT(44,100.3,272.6),root,{class:'control',role:'button',tabindex:'0','aria-label':'Toggle the frame light (L)','aria-pressed':'false'});rect(lightControl,0,0,184,2.6,1.3,'face strip');rect(lightControl,-2,-4,188,9,2,'hit');rect(lightControl,-2,-2,188,6.6,2,'focus-ring');
const topFront=group(FRONT(28,100.3,286));line(topFront,18,5,198,5);line(topFront,18,13,198,13);
text(topFront,26,11,'C–24','label');text(topFront,190,11,'XYZ','etch center');
for(const x of[8,208])screw(topFront,x,9);
const topInset=group(TOP(47,84,286.3));rect(topInset,0,0,174,12,2,'face recess');line(topInset,5,6,168,6);
for(const x of[48,218]){
box(x-5,80,33,16,24,22,3,'rubber');box(x-5,80,55,16,24,2,1.5,'chrome');
const motor=group(FRONT(x-5,104.3,55));rect(motor,2,3,12,15,2,'face chrome');screw(motor,8,10);
cylinder(x,96,57,3.4,6,'z','chrome');cylinder(x,96,55,2,213,'z','chrome');
for(let z=62;z<267;z+=5)ellipse(x,96,z,2.1,'z','detail');
box(x-5,91,263,10,10,6,2,'base');
}
// Upright spool: the spindle is bolted into the cross member.
box(214,63,286,10,15,40,3,'base');
wire([[219,72,326],[219,89,326]],'rod-under');wire([[219,72,326],[219,89,326]],'rod');
cylinder(219,63,326,36,20,'y','base');
const coil=group(FRONT(219,83.2,326));circle(coil,0,0,31,'face filament');
for(let r=10;r<31;r+=2)circle(coil,0,0,r,'detail');
const spoolRotor=group('rotate(0)',coil);
for(let i=0;i<5;i++){
const g=group(`rotate(${i*72})`,spoolRotor);
el('path',{d:'M-4,-10 L-6,-29 Q0,-33 6,-29 L4,-10 Z',class:'face top'},g);
circle(g,0,-24,2.5,'face recess');
}
circle(coil,0,0,9,'face top');circle(coil,0,0,5,'face recess');circle(coil,0,0,2,'face base');
circle(coil,0,0,35,'detail');circle(coil,0,0,32,'detail');
box(173,82,286,11,12,10,2,'base');
const guide=group(FRONT(178.5,94.2,296));circle(guide,0,-2,4,'face top');circle(guide,0,-2,2,'face recess');
// Bed rails continue under the full travel of the carriage.
for(const x of[70,194]){
wire([[x,42,39],[x,210,39]],'rod-under');wire([[x,42,39],[x,210,39]],'rod');
for(const y of[42,199]){box(x-4,y,33,8,11,9,2,'base');screw(group(TOP(x-4,y,42.2)),4,5);}
}
const beltPlane=group(TOP(135,40,37.5));rect(beltPlane,0,0,6,173,1,'face recess');
for(let y=3;y<172;y+=4)line(beltPlane,1,y,5,y);
box(128,30,33,20,20,13,3,'recess');
const bed=el('g',{id:'bed'});
pack(bed,()=>{
box(73,81,40,128,107,7,3,'recess');
for(const[x,y]of[[61,79],[218,79],[61,195],[218,195]]){
cylinder(x,y,47,3.5,8,'z','base');
for(let z=48;z<55;z+=1.5)ellipse(x,y,z,3.6,'z','detail');
cylinder(x,y,46,6,4,'z','recess');
}
box(55,73,55,172,139,6,3,'base');
box(58,76,61,166,133,1,2);
const plate=group(TOP(62,80,62.15));rect(plate,0,0,158,125,2,'face chrome');
rect(plate,2,2,154,121,2,'face sheet');
for(let x=22;x<150;x+=23)line(plate,x,8,x,117,'sheet-line');
for(let y=18;y<117;y+=23)line(plate,8,y,150,y,'sheet-line');
for(const[x,y]of[[5,5],[153,5],[5,120],[153,120]]){
line(plate,x-2,y,x+2,y);line(plate,x,y-2,x,y+2);
}
text(plate,144,120,'HOT','etch micro center');
});
const heatPlane=group(TOP(59,77,62.3),bed);
const heatBloom=rect(heatPlane,-2,-2,168,135,5,'heat');set(heatBloom,'filter','url(#bloom)');
const heatWash=rect(heatPlane,0,0,164,131,2,'heat');
const bedLip=group(FRONT(55,212.3,61),bed);line(bedLip,6,2,166,2);const hotLamp=circle(bedLip,150,3.2,1.3,'lamp');text(bedLip,143,4.4,'HOT','etch micro end');
for(const x of[8,164])screw(bedLip,x,3);
const bedCable=wire([[205,66,40],[239,68,41],[239,180,49],[222,200,55]],'cable-under');
const bedCableInner=wire([[205,66,40],[239,68,41],[239,180,49],[222,200,55]],'cable');
// Individual deposited rings make the vase a true stack, with a hollow rim.
const LAYERS=36,LH=1.8,CX=138,CY=142,PLATE=62;
function radius(p){if(p<.45)return 15+10*Math.sin(p/.45*Math.PI/2);if(p<.82)return 25-13*(.5-.5*Math.cos((p-.45)/.37*Math.PI));return 12+5*((p-.82)/.18)**2;}
const wash=el('ellipse',{rx:96,ry:54,class:'wash'},bed),pool=el('ellipse',{rx:13,ry:7.5,class:'nozzle-pool'},bed);
const vase=el('g',{id:'vase'},bed),layers=[];
for(let i=0;i<LAYERS;i++){
const layer=el('g',{'data-layer':i+1},vase);
pack(layer,()=>cylinder(CX,CY,PLATE+i*LH,radius((i+1)/LAYERS),LH,'z','filament'));
set(layer,'display','none');layers.push(layer);
}
const rim=group(TOP(CX,CY,PLATE),vase);const inside=circle(rim,0,0,13,'face hollow');
const rimGlint=el('path',{d:'',class:'detail'},rim);set(rim,'display','none');
const trace=el('path',{d:'',class:'toolpath'},bed);
// X carriage and the nozzle stay at Y=127; the bed supplies the Y axis.
const gantry=el('g',{id:'gantry'});
pack(gantry,()=>{
box(44,87,228,184,17,18,3,'base');
const beam=group(FRONT(44,104.3,246));rect(beam,5,4,174,10,2,'face recess');
line(beam,8,6,176,6,'belt');line(beam,8,12,176,12,'belt');
for(let x=10;x<175;x+=5)line(beam,x,6,x,8);
box(33,84,223,25,26,27,3,'recess');
const motor=group(FRONT(33,110.3,250));rect(motor,3,3,19,20,3,'face side');circle(motor,12.5,13,5,'face base');screw(motor,12.5,13);
for(const[x,y]of[[5,5],[20,5],[5,22],[20,22]])screw(motor,x,y);
box(218,90,224,14,20,25,3,'base');
const idler=group(FRONT(225,110.4,236));circle(idler,0,0,5,'face recess');circle(idler,0,0,2,'face top');
for(const x of[48,218]){box(x-5,94,224,10,16,25,3);screw(group(FRONT(x,110.3,243)),0,0);}
});
const head=el('g',{id:'head'},gantry);
pack(head,()=>{
box(37,101,220,42,9,31,3,'base');
for(const x of[42,74])cylinder(x,105,226,4,7,'y','recess');
box(42,105,211,32,25,37,4);
cylinder(59,122,248,2.2,5,'z','recess');
const top=group(TOP(46,109,248.3));rect(top,0,0,24,17,2,'face recess');slits(top,3,3,18,10,6);
const hf=group(FRONT(42,130.3,248));
line(hf,3,4,29,4);screw(hf,3.5,3.5);screw(hf,28.5,3.5);screw(hf,3.5,33.5);screw(hf,28.5,33.5);
const hs=group(SIDE(74.3,126,245));slits(hs,0,0,15,26,6,false);line(hs,2,30,13,30);
box(52,113,205,12,13,7,2,'chrome');
const nozzle=group(FRONT(58,128,206));
el('path',{d:'M-3,0 L3,0 L1,4 L-1,4 Z',class:'face base'},nozzle);
line(nozzle,-2,1,2,1);line(nozzle,-1.6,2,1.6,2);
});
const hg=P(58,120,208),hotGlow=el('ellipse',{cx:hg[0],cy:hg[1],rx:9,ry:6,class:'hotglow'},head);
const fan=group(FRONT(58,131.2,235),head);
circle(fan,0,0,11,'face base');circle(fan,0,0,9.4,'face recess');
const rotor=group('translate(0 0)',fan,{class:'fan-rotor'});
circle(rotor,0,0,8.2,'face recess');
for(let i=0;i<5;i++)el('path',{d:'M0,-2 Q-6,-10 -8,-3 Q-8,2 -2,2 Z',transform:`rotate(${i*72})`,class:'face top'},rotor);
circle(fan,0,0,2.4,'face base');
for(const a of[0,45,90,135])line(fan,-10*Math.cos(a*Math.PI/180),-10*Math.sin(a*Math.PI/180),10*Math.cos(a*Math.PI/180),10*Math.sin(a*Math.PI/180));
circle(fan,0,0,11.6,'detail');
const headLED=group(FRONT(67,130.8,217),head);circle(headLED,0,0,2,'accent led-halo');circle(headLED,0,0,.85,'led heartbeat');
const loom=wire([[36,93,279],[39,119,267],[59,122,253]],'cable-under');
const loomInner=wire([[36,93,279],[39,119,267],[59,122,253]],'cable');
const filament=el('path',{d:'',class:'feed'});
// Bolted control pod and front-facing controls finish the foreground.
box(173,206,33,86,36,48,4);
const podTop=group(TOP(178,211,81.3));rect(podTop,0,0,76,24,3,'face recess');slits(podTop,6,6,64,11,15);
const pod=group(FRONT(173,242.3,81));rect(pod,3,3,80,42,3,'face');
for(const[x,y]of[[5,5],[81,5],[5,43],[81,43]])screw(pod,x,y);
const printControl=group(FRONT(179,243,75),root,{id:'printControl',class:'control screen-control',role:'button',tabindex:'0','aria-label':'Print or pause vase (Space)','aria-pressed':'false'});
rect(printControl,-3,-3,54,37,4,'focus-ring');rect(printControl,0,0,48,31,3,'face recess');rect(printControl,2,2,44,27,2,'face screen');
const screenFace=group(FRONT(179,243,75),root,{id:'printScreen','pointer-events':'none'});
const screenProgress=text(screenFace,6,13,'000%','screen-text lit');
const screenTemp=text(screenFace,42,10,'23°','screen-small lit');set(screenTemp,'text-anchor','end');
const screenState=text(screenFace,6,19,'READY','screen-small lit');
rect(printControl,6,23,36,2.6,1,'screen-track');const progressBar=rect(printControl,6,23,0,2.6,1,'screen-bar');
text(group(FRONT(185,242.7,38)),0,0,'BUILD / PLA','etch micro');
cylinder(246.5,243,61.5,10.5,5,'y','chrome');
const speedControl=group(FRONT(246.5,248.2,61.5),root,{id:'speedControl',class:'control',role:'button',tabindex:'0','aria-label':'Change print speed (D)','aria-pressed':'false'});
circle(speedControl,0,0,18,'hit');circle(speedControl,0,0,14,'focus-ring');circle(speedControl,0,0,10,'face top button-face');circle(speedControl,0,0,7.5,'detail');
for(let i=0;i<16;i++){const a=i*Math.PI/8;line(speedControl,8.6*Math.cos(a),8.6*Math.sin(a),9.4*Math.cos(a),9.4*Math.sin(a));}
const dialMark=group('rotate(-40)',speedControl);line(dialMark,0,-4,0,-7,'detail');circle(dialMark,0,-7,1,'accent');
const speedText=text(group(FRONT(246.5,248.2,61.5),root,{id:'speedLabel','pointer-events':'none'}),0,19,'100%','etch center');
function baseButton(x,id,label){
const g=group(FRONT(x,229,30),root,{id,class:'control',role:'button',tabindex:'0','aria-label':label,'aria-pressed':'false'});
rect(g,-5,-6,32,28,4,'hit');rect(g,-2,-2,26,20,4,'focus-ring');rect(g,0,0,22,16,3,'face recess button-face');return g;
}
const homeControl=baseButton(97,'homeControl','Home printer axes (H)');
el('path',{d:'M5,8 L11,3 L17,8 M7,7 V12 H15 V7',class:'detail'},homeControl);
const coolControl=baseButton(130,'coolControl','Cool heated bed (C)');
for(const a of[0,60,120]){
const g=group(`translate(11 8) rotate(${a})`,coolControl);line(g,-5,0,5,0);el('path',{d:'M-4,-2 L-2,0 L-4,2 M4,-2 L2,0 L4,2',class:'detail'},g);
}
const statusLED=group(FRONT(161,229,22));circle(statusLED,0,0,3,'accent led-halo');circle(statusLED,0,0,1.2,'led heartbeat');
frame([[12,18,0,252,210,33],[28,80,33,216,20,256],[183,63,290,72,22,72],[173,206,33,86,43,48],[55,38,40,172,174,94]],28);
// Shared machine state.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
let mode='standby',temp=23,target=23,fast=false,elapsed=0,built=0,last=0,spoolAngle=0,move=null,lights=false,hot=23;
function lamp(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
let pos={x:58,z:202,b:0},lastLayer=-1,lastUI=-1;
const duration=800;
function say(message){announcement.textContent=message;}
function pose(x,z,b){pos={x,z,b};set(head,'transform',`translate(${(x-58)*C} ${(x-58)*S})`);set(gantry,'transform',`translate(0 ${202-z})`);set(bed,'transform',`translate(${-b*C} ${b*S})`);}
function drawLayers(){
if(built===lastLayer)return;
for(let i=0;i<LAYERS;i++)set(layers[i],'display',i<built?'inline':'none');
set(rim,'display',built?'inline':'none');
if(built){const r=radius(built/LAYERS);set(rim,'transform',TOP(CX,CY,PLATE+built*LH+.12));set(inside,'r',r-2.1);set(rimGlint,'d',`M${-r*.72},${-r*.3} Q${-r*.1},${-r*.85} ${r*.55},${-r*.55}`);}
lastLayer=built;
}
function labels(){
const pct=Math.min(100,Math.floor(elapsed/(LAYERS*duration)*100));
const words={standby:'STANDBY',heating:'HEATING BED',positioning:'POSITIONING',printing:'PRINTING',paused:'PAUSED',homing:'HOMING XYZ',homed:'AXES HOMED',cooling:'COOLING BED',cooled:'BED COOLED',done:'VASE COMPLETE'};
readout.textContent=`${pct}% · ${Math.round(temp)}°C`;
stateLabel.textContent=words[mode]+(mode==='printing'?` · ${built+1}/${LAYERS}`:mode==='heating'?' → 60°C':mode==='paused'?` · ${built}/${LAYERS}`:'')+` · ${fast?150:100}% SPEED`+(lights?' · LIGHT':'');
screenProgress.textContent=String(pct).padStart(3,'0')+'%';screenTemp.textContent=Math.round(hot)+'°';
screenState.textContent=mode==='printing'?`L${String(built+1).padStart(2,'0')} / ${fast?'150':'100'}%`:mode==='heating'?'HEAT → 60°':mode==='positioning'?'ALIGNING':mode==='standby'?'READY':mode.toUpperCase();
set(progressBar,'width',36*pct/100);
speedText.textContent=fast?'150%':'100%';set(dialMark,'transform',`rotate(${fast?50:-40})`);
const active=['heating','positioning','printing'].includes(mode);
set(printControl,'aria-pressed',active);set(speedControl,'aria-pressed',fast);set(homeControl,'aria-pressed',mode==='homing');set(coolControl,'aria-pressed',mode==='cooling');
printControl.classList.toggle('active',active);homeControl.classList.toggle('active',mode==='homing');coolControl.classList.toggle('active',mode==='cooling');
svg.classList.toggle('powered',active||mode==='paused'||temp>27);svg.classList.toggle('printing',mode==='printing');svg.classList.toggle('cooling',mode==='cooling');
}
function sync(){lastUI=-1;drawLayers();labels();}
function destination(){const i=Math.min(built+1,LAYERS),r=radius(i/LAYERS),a=reduced.matches?0:(elapsed%duration)/duration*Math.PI*2;return{x:CX+r*Math.cos(a),z:PLATE+i*LH+.3,b:128-CY-r*Math.sin(a)};}
function positionForPrint(){mode='positioning';move={kind:'start',from:{...pos},to:destination(),start:performance.now(),duration:850};sync();}
function printPause(){
if(['heating','positioning','printing'].includes(mode)){
mode='paused';move=null;pose(pos.x,pos.z+3,pos.b);set(trace,'d','');say('Build paused. Nozzle retracted; the bed stays warm.');
}else{
if(built===LAYERS){elapsed=0;built=0;lastLayer=-1;}
target=60;move=null;
if(temp<58){mode='heating';say('Heating the bed to sixty degrees.');}
else{positionForPrint();say('Continuing the vase build.');}
}
sync();
}
function home(){
set(trace,'d','');mode='homing';move={kind:'home',from:{...pos},to:{x:58,z:202,b:0},start:performance.now(),duration:1050};
say('Homing. Lifting the nozzle, parking X and returning the bed.');sync();
}
function cool(){
mode='cooling';target=23;move={kind:'lift',from:{...pos},to:{...pos,z:Math.min(202,pos.z+10)},start:performance.now(),duration:350};set(trace,'d','');
say('Build stopped. Cooling the bed to room temperature.');sync();
}
function speed(){fast=!fast;say(`Print speed ${fast?150:100} percent.`);sync();}
function light(){lights=!lights;svg.classList.toggle('lights',lights);set(lightControl,'aria-pressed',lights);say(lights?'Frame light on.':'Frame light off.');sync();}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(printControl,printPause);bind(homeControl,home);bind(coolControl,cool);bind(speedControl,speed);bind(lightControl,light);
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)||e.target.isContentEditable)return;
const action={' ':printPause,h:home,c:cool,d:speed,l:light}[e.key.toLowerCase()];
if(action){e.preventDefault();action();}
});
function ease(t){return t*t*(3-2*t);}
function traceLayer(fraction,i){
const r=radius((i+1)/LAYERS),z=PLATE+(i+1)*LH+.12,pts=[];
for(let s=0;s<=Math.ceil(fraction*50);s++){const a=Math.min(s/50,fraction)*Math.PI*2;pts.push([CX+r*Math.cos(a),CY+r*Math.sin(a),z]);}
set(trace,'d',fraction>.02?poly(pts):'');
}
function tick(now){
const dt=last?Math.min((now-last)/1000,.1):0;last=now;
if(temp<target)temp=Math.min(target,temp+dt*15);
else if(temp>target)temp=Math.max(target,temp-dt*(mode==='cooling'?12:4));
if(mode==='heating'&&temp>=58)positionForPrint();
if(move){
const p=clamp((now-move.start)/move.duration),f=move.from,t=move.to;
let x=f.x,z=f.z,b=f.b;
if(reduced.matches){x=t.x;z=t.z;b=t.b;}
else if(move.kind==='home'){
z=f.z+(t.z-f.z)*ease(clamp(p/.4));x=f.x+(t.x-f.x)*ease(clamp((p-.4)/.6));b=f.b+(t.b-f.b)*ease(clamp((p-.4)/.6));
}else if(move.kind==='start'){
x=f.x+(t.x-f.x)*ease(clamp(p/.45));b=f.b+(t.b-f.b)*ease(clamp(p/.45));z=f.z+(t.z-f.z)*ease(clamp((p-.45)/.55));
}else{z=f.z+(t.z-f.z)*ease(p);}
pose(x,z,b);
if(p>=1||reduced.matches){const kind=move.kind;move=null;if(kind==='home'){mode='homed';say('Axes homed. The current build is saved.');}else if(kind==='start'){mode='printing';say('Printing the vase, one layer at a time.');}sync();}
}
if(mode==='printing'){
elapsed=Math.min(LAYERS*duration,elapsed+dt*1000*(fast?1.5:1));built=Math.min(LAYERS,Math.floor(elapsed/duration));drawLayers();
const i=Math.min(built,LAYERS-1),f=(elapsed%duration)/duration,r=radius((i+1)/LAYERS),a=f*Math.PI*2;
if(!reduced.matches||built!==Math.floor((elapsed-dt*1000*(fast?1.5:1))/duration))pose(CX+r*Math.cos(reduced.matches?0:a),PLATE+(i+1)*LH+.3,128-CY-r*Math.sin(reduced.matches?0:a));
if(!reduced.matches){spoolAngle-=dt*30*(fast?1.5:1);set(spoolRotor,'transform',`rotate(${spoolAngle})`);traceLayer(f,i);}
if(built===LAYERS){mode='done';target=23;set(trace,'d','');pose(pos.x,PLATE+LAYERS*LH+14,pos.b);say('Vase complete. Thirty-six layers. Bed cooling.');sync();}
}
if(mode==='cooling'&&temp<=23.05&&!move){mode='cooled';say('Bed cooled to twenty-three degrees.');sync();}
const warmth=clamp((temp-23)/37);set(heatBloom,'opacity',f2(warmth*.3));set(heatWash,'opacity',f2(warmth*.1));lamp(hotLamp,temp>40?'r':'');
const ht=['heating','positioning','printing','paused'].includes(mode)?205:23;hot+=reduced.matches?ht-hot:(ht-hot)*Math.min(1,dt*(ht>hot?1.6:.7));hotGlow.style.opacity=f2(clamp((hot-60)/145)*.85);
const pp=P(pos.x,127-pos.b,62.4),wp=P(138,150-pos.b,62.4);set(pool,'cx',f2(pp[0]));set(pool,'cy',f2(pp[1]));set(wash,'cx',f2(wp[0]));set(wash,'cy',f2(wp[1]));pool.style.opacity=mode==='printing'||mode==='positioning'?'.6':'0';
const cablePts=[[205,66,40],[239,68,41],[239,180+pos.b*.5,49],[222,200+pos.b,55]];
set(bedCable,'d',poly(cablePts));set(bedCableInner,'d',poly(cablePts));
const top=P(36,93,279),end=P(pos.x+1,122,pos.z+51);
const cableD=`M${top} C${top[0]-24},${top[1]+24} ${end[0]-24},${end[1]-48} ${end}`;
set(loom,'d',cableD);set(loomInner,'d',cableD);
const feedPts=[[195,84,350],[178.5,94,298],[pos.x,116,pos.z+46]];set(filament,'d',poly(feedPts));
if(lastUI<0||now-lastUI>=100){labels();lastUI=now;}
requestAnimationFrame(tick);
}
pose(58,202,0);drawLayers();labels();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], draw }
