// @ts-nocheck
/* ORYNT T–12 · Oscilloscope. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#1c1e1d;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#c4c4c0;--ok:#15a65e;--warn:#e88a00;--phosphor:#8ff0b8;--grid:#6c8f80;--rubber:#2c2c2b;--metal:#d6d8d5;--metal-top:#f2f3f1;--amber:#ffb648}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#161717;--off:#a5a5a2;--ok:#36d886;--warn:#ffad2b;--phosphor:#a4f6c8;--grid:#5a786b;--rubber:#232323;--metal:#b4b6b4;--metal-top:#e2e3e1;--amber:#ffbe55;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.accent{fill:var(--accent);stroke:var(--accent)}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.08;filter:url(#soft)}
.control{cursor:pointer;outline:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .button-face{fill:var(--top)}.active .button-face{fill:var(--accent);fill-opacity:.2;stroke:var(--accent)}.active .button-icon{stroke:var(--accent)}.hit{fill:transparent;stroke:none;pointer-events:all}.rotor{transition:transform .23s cubic-bezier(.2,.8,.3,1)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.rubber{fill:var(--rubber)}
.cable-under{fill:none;stroke:var(--line);stroke-width:4.9;stroke-linecap:round}.cable{fill:none;stroke:var(--rubber);stroke-width:3.5;stroke-linecap:round}.cable-shine{fill:none;stroke:#fff;stroke-width:.55;stroke-linecap:round;opacity:.22}.sync.cable{stroke-width:2.6}.sync.cable-under{stroke-width:3.9}
.flow{fill:none;stroke:var(--accent);stroke-width:1.3;stroke-linecap:round;stroke-dasharray:1.6 15;opacity:0;transition:opacity .3s;animation:dash 1.1s linear infinite;pointer-events:none}.live .flow{opacity:.95}.sync.flow{stroke:var(--amber);animation-duration:1.6s}
@keyframes dash{to{stroke-dashoffset:-16.6}}
.grid-line{stroke:var(--grid);stroke-width:.4;fill:none;opacity:.32}.axis{stroke:var(--grid);stroke-width:.55;opacity:.62}.trace{fill:none;stroke:var(--phosphor);stroke-width:.8;stroke-linejoin:round;stroke-linecap:round}.trace-soft{stroke-width:2.2;opacity:.24;filter:url(#soft)}.beam{fill:var(--phosphor);filter:url(#glow)}.screen-ink{fill:var(--phosphor);font:4px ui-monospace,monospace;letter-spacing:.3px;stroke:none}.screen-lit{transition:opacity .25s}.screen-lit.off{opacity:0}.reflection{fill:#fff;opacity:.07;pointer-events:none}.screen-bloom{fill:var(--phosphor);opacity:.04;filter:url(#bloom)}.crt-halo{fill:var(--phosphor);opacity:0;filter:url(#bloom);transition:opacity .4s;pointer-events:none}.powered .crt-halo{opacity:.12}
.seg7{fill:var(--amber);font:700 6px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.seg7-s{fill:var(--amber);font:3px ui-monospace,monospace;letter-spacing:.3px;stroke:none;opacity:.8}.disp-halo{fill:var(--amber);opacity:.1;filter:url(#bloom)}
.lamp{fill:var(--off);stroke:none}.lamp.g{fill:var(--ok);filter:url(#glow)}.lamp.b{fill:var(--accent);filter:url(#glow)}.lamp.a{fill:var(--amber);filter:url(#glow)}
.press{transition:transform .12s}.pressed .press{transform:translateY(1.5px)}
@media(prefers-reduced-motion:reduce){.live .flow{opacity:.45}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<clipPath id="crtClip"><rect x="5" y="5" width="126" height="83" rx="7"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* ORYNT T–12 bench oscilloscope + G–03 generator. World: x lower-right, y lower-left, z up.
Part                         x    y    z     w    d    h
scope feet (4)          40/266 31/143  0    23   21   13
scope chassis, enclosure    24   20   13   284  154  158   top hatch + vents + hinges, side panel + handle
front frame (bevelled)      32  174   29   268    0  134   brand, model
CRT bezel + sunshade        38  174   42   151   16  112   glass, graticule, trace, beam
volts / time dials     221/271 175   129   r19    11    –   knurled rotors
Y position, trigger level 221/271 176  81    r9     7    –   TRIG'D lamp at 292
power, pilot, inten, focus  49–160 176 23–45  –     –    –
CH1 + SYNC BNC          220/248 176   41    r7    17    –
hold button                276  182   40    r9     4    –
generator feet (4)    355/457 106/184 0     20   17    9
generator chassis, case    341   97    9   149  112   74   top vents, brand, side vents
generator front            348  209   16   135    0   60   amber display, wave keys + LEDs, FREQ knob, OUT lamp
OUT + SYNC BNC             470  210   42/21  r7   17    –
signal + sync cables  205–479 195–260 2–42   –     –    –   pulses travel while output is live
All feet rest on z=0; seams, screws, legends and index marks share their parent face. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: bevelled panel (light top/left, dark bottom/right), small knob, lamp.
function panel(g,x,y,w,h,b=2.4){rect(g,x,y,w,h,1,'face');el('path',{d:`M${x},${y}H${x+w}L${x+w-b},${y+b}H${x+b}ZM${x},${y}L${x+b},${y+b}V${y+h-b}L${x},${y+h}Z`,class:'face top'},g);el('path',{d:`M${x},${y+h}L${x+b},${y+h-b}H${x+w-b}L${x+w},${y+h}ZM${x+w},${y}V${y+h}L${x+w-b},${y+h-b}V${y+b}Z`,class:'face side'},g);}
function knob(x,y,z,r,label){const f=cylinder(x,y,z,r,6,'y','base').face;circle(f,0,0,r*.8,'face top');circle(f,0,0,r*.62,'detail');line(f,0,-r*.25,0,-r*.62);if(label)text(group(FRONT(x,y,z-r-6)),0,0,label,'etch center');return f;}
function lamp(x,y,z,label){const g=group(FRONT(x,y,z));circle(g,0,0,2.6,'face recess');const l=circle(g,0,0,1.5,'lamp');if(label)text(g,0,7,label,'etch micro center');return l;}
function light(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
// Scope: shadow, feet, chassis, enclosure, top hatch, side panel and handle.
for(const[x,y,rx,ry]of[[167,109,186,62],[415,154,98,40]]){const p=P(x,y,0);el('ellipse',{cx:p[0],cy:p[1]+4,rx,ry,class:'shadow stage-floor'});el('ellipse',{cx:p[0],cy:p[1]+4,rx,ry,class:'stage-contact'});}
for(const[x,y]of[[40,31],[266,31],[40,143],[266,143]])box(x,y,0,23,21,13,3,'rubber');
box(24,20,13,284,154,9,5,'base');box(24,20,22,284,154,149,7);
const hatch=group(TOP(54,37,171.2));rect(hatch,0,0,224,105,4,'face top');
rect(hatch,15,8,194,64,3,'detail');slits(hatch,19,12,187,58,29);
for(const p of[[6,6],[218,6],[6,99],[218,99]])screw(hatch,...p);
for(const x of[12,184]){rect(hatch,x,0,28,5,1,'face base');line(hatch,x+4,2.5,x+24,2.5);}
line(hatch,17,81,207,81);text(hatch,112,96,'T–12 / SERVICE ACCESS','etch center');
const side=group(SIDE(308.2,156,148));rect(side,0,0,119,105,5,'face base');
rect(side,8,14,79,68,3,'detail');slits(side,41,28,64,38,9,false);
for(const p of[[5,5],[114,5],[5,100],[114,100]])screw(side,...p);line(side,8,90,111,90);
for(const y of[56,136])cylinder(308.4,y,135,5,5,'x','base');
const handle=[[313.4,56,135],[318,56,135],[318,63,142],[318,129,142],[318,136,135],[313.4,136,135]];wire(handle,'cable-under');wire(handle,'cable');
// Front: bevelled frame, brand, CRT bezel and sunshade, glass with graticule and phosphor trace.
const front=group(FRONT(32,174.3,163));panel(front,0,0,268,134,3.4);
for(const p of[[6,6],[262,6],[6,128],[262,128]])screw(front,...p);
line(front,161,15,161,118);line(front,172,68,257,68);line(front,172,110,257,110);
const plate=group(FRONT(40,175,164));rect(plate,0,0,54,9,2,'face top');text(plate,27,6.6,'ORYNT','label brand center');screw(plate,3,4.5);screw(plate,51,4.5);
text(front,121,9.4,'T–12','label');text(front,253,9.4,'20 MHz','etch center');
box(38,174,42,151,6,112,6,'base');
const bezel=group(FRONT(41,180.4,151));rect(bezel,0,0,145,106,6,'face top');
rect(bezel,3,3,139,100,6,'face recess');rect(bezel,6,6,133,94,7,'face base');for(const p of[[3,53],[142,53]])screw(bezel,...p);
const crt=group(FRONT(46,182,143));rect(crt,-6,-6,148,105,10,'crt-halo');rect(crt,0,0,136,93,8,'face glass');
const screen=el('g',{'clip-path':'url(#crtClip)',class:'screen-lit'},crt);
rect(screen,0,0,136,93,8,'screen-bloom');
const grid=el('g',{},screen),X=6,Y=6,W=124,H=80;
for(let i=0;i<=10;i++)line(grid,X+i*W/10,Y,X+i*W/10,Y+H,'grid-line');
for(let i=0;i<=8;i++)line(grid,X,Y+i*H/8,X+W,Y+i*H/8,'grid-line');
line(grid,X,Y+H/2,X+W,Y+H/2,'grid-line axis');line(grid,X+W/2,Y,X+W/2,Y+H,'grid-line axis');
for(let i=0;i<50;i++)line(grid,X+i*W/50,Y+H/2-1,X+i*W/50,Y+H/2+1,'grid-line axis');
const traceGlow=el('path',{class:'trace trace-soft'},screen),trace=el('path',{class:'trace'},screen),beam=circle(screen,0,0,1.2,'beam');
const screenMode=text(screen,9,13,'CH1 · SINE','screen-ink');
const screenScale=text(screen,127,82,'1 V  0.2 ms','screen-ink');set(screenScale,'text-anchor','end');
const holdBadge=text(screen,127,13,'','screen-ink');set(holdBadge,'text-anchor','end');
el('path',{d:'M7,20 Q7,8 20,7 L122,7 Q83,10 57,28 Z',class:'reflection'},crt);
box(38,180,150,151,11,4,1.6,'base');const visor=group(TOP(38,180,154.1));line(visor,4,8,147,8);
// Dials: fixed graduation ring, moving knurled grip, live value.
function dial(x,z,id,label){
const base=cylinder(x,175,z,19,4,'y','base').face;circle(base,0,0,17.5,'face top');
for(let i=0;i<16;i++){const a=(i*22.5-135)*Math.PI/180;line(base,16*Math.sin(a),-16*Math.cos(a),17.4*Math.sin(a),-17.4*Math.cos(a));}
cylinder(x,179,z,15,7,'y','recess');
const g=group(FRONT(x,186.2,z),root,{id,class:'control',role:'button',tabindex:'0','aria-label':label+'; click to increase, Shift-click to decrease'});
circle(g,0,0,20,'focus-ring');circle(g,0,0,15,'face top button-face');circle(g,0,0,12.4,'detail');
const rotor=group('rotate(0)',g,{class:'rotor'});
for(let i=0;i<24;i++){const a=i*Math.PI/12;line(rotor,13.2*Math.cos(a),13.2*Math.sin(a),14.4*Math.cos(a),14.4*Math.sin(a));}
line(rotor,0,-6,0,-11,'detail');circle(rotor,0,-11,1,'accent');circle(g,0,0,2.2,'face base');circle(g,0,0,22,'hit');
text(group(FRONT(x,176,156)),0,0,label.toUpperCase(),'etch center');
const value=text(group(FRONT(x,187,105)),0,0,'','label center');return{g,rotor,value};
}
const voltsDial=dial(221,129,'voltsControl','Volts / div'),timeDial=dial(271,129,'timeControl','Time / div');
knob(221,176,81,9,'Y POSITION');knob(271,176,81,9,'TRIG LEVEL');
const trig=lamp(292,176.2,84,"TRIG'D");
knob(128,176,34,6,'INTEN');knob(152,176,34,6,'FOCUS');
const powerControl=group(FRONT(49,179,38),root,{id:'powerControl',class:'control',role:'button',tabindex:'0','aria-label':'Toggle power (O)','aria-pressed':'true'});
rect(powerControl,-4,-4,28,23,4,'focus-ring');rect(powerControl,0,0,20,15,3,'face recess button-face');
const rocker=rect(powerControl,10,2,8,11,2,'face top');line(powerControl,14,5,14,9);circle(powerControl,5,7.5,1.5,'detail');rect(powerControl,-4,-4,28,23,4,'hit');
text(powerControl,10,21,'POWER','etch micro center');
const pilot=lamp(83.5,176,30.5,'');
const holdControl=group(FRONT(276,182,40),root,{id:'holdControl',class:'control',role:'button',tabindex:'0','aria-label':'Hold or resume trace (Space)','aria-pressed':'false'});
circle(holdControl,0,0,14,'focus-ring');const holdPress=group('translate(0 0)',holdControl,{class:'press'});
circle(holdPress,0,0,9,'face top button-face');line(holdPress,-2,-3,-2,3,'detail button-icon');line(holdPress,2,-3,2,3,'detail button-icon');const holdLight=circle(holdPress,0,6,1,'lamp');circle(holdControl,0,0,14,'hit');text(holdControl,0,18,'HOLD','etch center');
// Generator: feet, chassis, case, top, side, front panel with display, keys, knob and lamps.
for(const[x,y]of[[355,106],[457,106],[355,184],[457,184]])box(x,y,0,20,17,9,3,'rubber');
box(341,97,9,149,112,7,5,'base');box(341,97,16,149,112,67,6);
const genTop=group(TOP(353,107,83.2));rect(genTop,0,0,125,86,4,'face top');slits(genTop,10,9,105,27,19);line(genTop,10,43,115,43);
for(const p of[[5,5],[120,5],[5,81],[120,81]])screw(genTop,...p);
text(genTop,63,64,'ORYNT','label brand center');text(genTop,63,74,'G–03 / SIGNAL GENERATOR','etch center');
const genSide=group(SIDE(490.2,192,73));rect(genSide,0,0,77,48,4,'face base');slits(genSide,10,10,57,19,6,false);line(genSide,8,37,69,37);screw(genSide,5,5);screw(genSide,72,43);
const genFront=group(FRONT(348,209.4,76));panel(genFront,0,0,135,60,2.6);
for(const p of[[5,5],[130,5],[5,55],[130,55]])screw(genFront,...p);line(genFront,107,8,107,52);
const genDisplay=group(FRONT(356,211,70));rect(genDisplay,0,0,91,19,3,'face recess');rect(genDisplay,2,2,87,15,2,'face glass');
const genScreen=el('g',{class:'screen-lit'},genDisplay);rect(genScreen,4,4,83,11,2,'disp-halo');
const genFreq=text(genScreen,9,12.6,'1.000','seg7');text(genScreen,44,12.6,'kHz','seg7-s');const genShape=text(genScreen,83,12.6,'SIN','seg7-s');set(genShape,'text-anchor','end');
const freqKnob=knob(468,209.4,63,7,'');text(group(FRONT(468,209.6,52)),0,0,'FREQ','etch center');
const outLamp=lamp(459,209.6,47,'');text(group(FRONT(463,209.6,46)),0,0,'OUT','etch micro');
function shapeIcon(g,kind){el('path',{d:['M-6,0 C-4,-7 -2,-7 0,0 S4,7 6,0','M-6,3 v-6 h6 v6 h6 v-6','M-6,3 L0,-3 V3 L6,-3'][kind],class:'detail button-icon'},g);}
const keyLamps=[];
const waveButtons=[366,399,432].map((x,i)=>{
const g=group(FRONT(x,212,39),root,{id:'wave'+i,class:'control',role:'button',tabindex:'0','aria-label':['Sine (1)','Square (2)','Saw (3)'][i],'aria-pressed':i===0?'true':'false'});
circle(g,0,0,13,'focus-ring');const press=group('translate(0 0)',g,{class:'press'});circle(press,0,0,10.4,'face recess');circle(press,0,0,8.6,'face top button-face');shapeIcon(press,i);circle(g,0,0,13,'hit');
keyLamps.push(circle(g,0,14.6,1.4,'lamp'));return g;
});
// BNC sockets and the two shielded cables; pulses ride the cables while the output is live.
function bnc(x,y,z,label){
const flange=cylinder(x,y,z,7,3,'y','base').face;circle(flange,0,0,5.8,'face metal');
const socket=cylinder(x,y+3,z,4.8,7,'y','metal').face;circle(socket,0,0,3.3,'face recess');circle(socket,0,0,1.1,'face metal');for(const a of[-1,1])circle(socket,a*4.5,0,1,'face top');
cylinder(x,y+10,z,3.2,7,'y','rubber');const ribs=group(FRONT(x,y+17.2,z));circle(ribs,0,0,2.8,'face rubber');circle(ribs,0,0,1.7,'detail');
if(label)text(group(FRONT(x,y+.2,z+12)),0,0,label,'etch center');
}
bnc(220,176,41,'CH1');bnc(248,176,41,'SYNC');bnc(470,210,36,'');bnc(470,210,19,'');
const cables=el('g',{});
function cable(start,segments,cls=''){
const d='M'+P(...start).join(',')+segments.map(seg=>' C'+seg.map(p=>P(...p).join(',')).join(' ')).join('');
el('path',{d,class:cls+' cable-under'},cables);el('path',{d,class:cls+' cable'},cables);el('path',{d,class:'cable-shine'},cables);el('path',{d,class:cls+' flow'},cables);
}
cable([470,227,19],[[[477,244,3],[427,211,3],[362,214,3]],[[302,224,3],[251,211,15],[248,193,41]]],'sync');
cable([470,227,36],[[[479,260,7],[417,255,3],[337,241,3]],[[246,248,2],[205,213,9],[220,193,41]]]);
frame([[24,20,0,294,154,171],[341,97,0,149,130,83],[205,193,0,274,67,42]],12);
// Seven purposeful controls: waveform, volts, time, frequency, output, hold, power.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const waveNames=['Sine','Square','Saw'],vSteps=[.2,.5,1,2,5],tSteps=[.02,.05,.1,.2,.5,1,2],fSteps=[.5,1,2,5];
let wave=0,vi=2,ti=3,fi=1,out=true,on=true,held=false,phase=0,last=0,lastDraw=-1,scan=0,trigAt=-1e9;
function say(value){announcement.textContent=value;}
function update(){
const v=vSteps[vi],t=tSteps[ti],f=fSteps[fi];
svg.classList.toggle('powered',on);svg.classList.toggle('holding',held);svg.classList.toggle('live',on&&out);holdControl.classList.toggle('active',held);
set(powerControl,'aria-pressed',on);set(holdControl,'aria-pressed',held);set(rocker,'x',on?10:2);
screen.classList.toggle('off',!on);genScreen.classList.toggle('off',!on);
set(voltsDial.rotor,'transform',`rotate(${-70+vi*35})`);set(timeDial.rotor,'transform',`rotate(${-105+ti*35})`);set(freqKnob,'transform',freqKnob.getAttribute('transform').replace(/ rotate\(.*\)$/,'')+` rotate(${-90+fi*60})`);
voltsDial.value.textContent=v+' V';timeDial.value.textContent=t+' ms';
set(voltsDial.g,'aria-label',`Volts per division: ${v} volts. Click to increase; Shift-click to decrease.`);
set(timeDial.g,'aria-label',`Time per division: ${t} milliseconds. Click to increase; Shift-click to decrease.`);
waveButtons.forEach((g,i)=>{g.classList.toggle('active',i===wave);set(g,'aria-pressed',i===wave);light(keyLamps[i],on&&i===wave?'b':'');});
light(pilot,on?'b':'');light(outLamp,on&&out?'a':'');light(holdLight,on&&held?'b':'');
screenMode.textContent='CH1 · '+(out?waveNames[wave].toUpperCase():'NO SIGNAL');screenScale.textContent=v+' V  '+t+' ms';holdBadge.textContent=held?'HOLD':'';
genFreq.textContent=f.toFixed(3);genShape.textContent=out?['SIN','SQR','SAW'][wave]:'OFF';
readout.textContent=`${waveNames[wave]} · ${v} V/div · ${t} ms/div`;
stateLabel.textContent=!on?'POWER OFF':!out?'OUTPUT OFF · FLAT TRACE':held?`HELD · ${f} kHz · 4 Vpp`:2/v>4?`LIVE · CLIPPED · ${f} kHz`:`LIVE · ${f} kHz · 4 Vpp`;
draw();
}
function choose(i){wave=i;phase=0;scan=0;update();say(waveNames[i]+' waveform selected. '+stateLabel.textContent);}
function adjust(type,direction,wrap=false){
const values=type==='v'?vSteps:tSteps,index=type==='v'?vi:ti;
let next=index+direction;if(wrap)next=(next+values.length)%values.length;else next=Math.max(0,Math.min(values.length-1,next));
if(type==='v')vi=next;else ti=next;
update();say((type==='v'?'Volts':'Time')+' per division: '+values[next]+(type==='v'?' volts.':' milliseconds.')+(next===index?' Scale limit.':''));
}
function freq(){fi=(fi+1)%fSteps.length;update();say(`Generator frequency ${fSteps[fi]} kilohertz.`);}
function output(){out=!out;update();say(out?'Generator output on.':'Generator output off. The trace falls flat.');}
function power(){on=!on;last=0;update();say(on?'Power on. '+(held?'Trace held.':'Live trace.'):'Power off.');}
function hold(){held=!held;last=0;update();say(held?'Trace held. Scales and waveform can still be adjusted.':'Live trace resumed.');}
function press(g){g.classList.add('pressed');setTimeout(()=>g.classList.remove('pressed'),160);}
function bind(g,fn){g.addEventListener('click',e=>{fn(e);press(g);});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat){fn(e);press(g);}}});}
bind(powerControl,power);bind(holdControl,hold);waveButtons.forEach((g,i)=>bind(g,()=>choose(i)));
bind(voltsDial.g,e=>adjust('v',e.shiftKey?-1:1,true));bind(timeDial.g,e=>adjust('t',e.shiftKey?-1:1,true));
for(const[type,dial]of[['v',voltsDial],['t',timeDial]])dial.g.addEventListener('wheel',e=>{e.preventDefault();adjust(type,e.deltaY<0?1:-1);},{passive:false});
const fk=group('',freqKnob.parentNode,{class:'control',role:'button',tabindex:'0','aria-label':'Generator frequency (F)'});circle(group(FRONT(468,215.6,63),fk),0,0,10,'hit');circle(group(FRONT(468,215.6,63),fk),0,0,9.4,'focus-ring');bind(fk,freq);
const ok=group(FRONT(459,209.8,47),root,{class:'control',role:'button',tabindex:'0','aria-label':'Generator output on or off (G)'});circle(ok,0,0,6,'hit');circle(ok,0,0,5,'focus-ring');bind(ok,output);
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey)return;
const action={'1':()=>choose(0),'2':()=>choose(1),'3':()=>choose(2),ArrowUp:()=>adjust('v',1),ArrowDown:()=>adjust('v',-1),ArrowLeft:()=>adjust('t',-1),ArrowRight:()=>adjust('t',1),' ':hold,o:power,O:power,f:freq,F:freq,g:output,G:output}[e.key];
if(action){e.preventDefault();if(!e.repeat||e.key.startsWith('Arrow'))action();}
});
function sample(p){const f=p-Math.floor(p);return wave===0?Math.sin(f*Math.PI*2):wave===1?(f<.5?1:-1):2*f-1;}
function draw(){
const amplitude=out?2/vSteps[vi]*H/8:0,cycles=10*tSteps[ti]*fSteps[fi],steps=520;
let d='',previous=0,previousY=0;
for(let i=0;i<=steps;i++){
const x=X+i/steps*W,p=i/steps*cycles+phase,value=sample(p),y=Y+H/2-amplitude*value;
if(i===0)d=`M${x.toFixed(2)},${y.toFixed(2)}`;
else{if(wave!==0&&out&&Math.abs(value-previous)>1)d+=` L${x.toFixed(2)},${previousY.toFixed(2)}`;d+=` L${x.toFixed(2)},${y.toFixed(2)}`;}
previous=value;previousY=y;
}
set(trace,'d',d);set(traceGlow,'d',d);
const u=scan,x=X+u*W,y=Y+H/2-amplitude*sample(u*cycles+phase);set(beam,'cx',x);set(beam,'cy',y);set(beam,'opacity',held||reduced.matches?0:1);
}
function tick(now){
if(!last)last=now;
const dt=Math.min((now-last)/1000,.1);last=now;
if(on&&!held&&!reduced.matches){phase=(phase+dt*.085)%1;const s=scan+dt*.35;if(s>=1)trigAt=now;scan=s%1;if(now-lastDraw>33){draw();lastDraw=now;}}
light(trig,!on||!out?'':held||reduced.matches?'g':now-trigAt<140?'g':now-trigAt<260?'':'g');
requestAnimationFrame(tick);
}
reduced.addEventListener('change',()=>{last=0;draw();});
update();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], draw }
