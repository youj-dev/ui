// @ts-nocheck
/* NALDEN R–10 · Rotary phone. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--slope:#f1f1ee;--bevel:#e8e8e4;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#c9c9c5;--metal:#d8d9d6;--metal-top:#f3f3f1;--metal-side:#bdbebb;--rubber:#2c2c2b;--cord-edge:#626260;--paper:#fbf8ef;--print:#3a3a38;--plate-lit:#edf0ff;--halo:.34;--cap:#f1f1ed;--cap-top:#fbfbf9;--cap-side:#d2d2ce;--lamp:#f0961c;--hold:#e3372d;--smoke:#2e2e2e;--smoke-a:.07;--shine:.6}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--slope:#cbcbc9;--bevel:#c3c3c1;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#a9a9a6;--metal:#b6b7b5;--metal-top:#e3e3e1;--metal-side:#858584;--rubber:#232323;--cord-edge:#515150;--paper:#d3d1cb;--print:#2f2f2e;--plate-lit:#c8cad4;--halo:.6;--cap:#cbcbc9;--cap-top:#ebebe9;--cap-side:#949493;--lamp:#ffad3d;--hold:#ff4c41;--smoke:#252525;--smoke-a:.22;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
.slope{fill:var(--slope)}.bevel{fill:var(--bevel)}.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.rubber{fill:var(--rubber)}.paper{fill:var(--paper)}.print{fill:var(--print);stroke:none}
.digit{font:7px ui-monospace,monospace;transition:fill .5s}.number{font:5.6px ui-monospace,monospace;letter-spacing:.5px}.card{font:5px ui-monospace,monospace;letter-spacing:.4px}
.shine{fill:none;stroke:#fff;stroke-width:.8;stroke-linecap:round;opacity:var(--shine);pointer-events:none}.pane{fill:var(--smoke);fill-opacity:var(--smoke-a);stroke:none;pointer-events:none}.sheen{fill:#fff;opacity:calc(var(--shine)*.25);pointer-events:none}
.plate{transition:fill .5s}.powered .plate{fill:var(--plate-lit)}.powered .digit{fill:var(--accent)}.dial-halo{fill:var(--accent);opacity:0;filter:url(#bloom);transition:opacity .6s;pointer-events:none}.powered .dial-halo{opacity:var(--halo)}
.control:hover .hole-rim,.control:focus-visible .hole-rim,.control.active .hole-rim{stroke:var(--accent);stroke-width:1.25}
.cap{fill:var(--cap)}.top.cap{fill:var(--cap-top)}.side.cap{fill:var(--cap-side)}.key{--c:var(--lamp);transition:transform .08s}.key.hold{--c:var(--hold)}.key.down{transform:translate(1.73px,-1px)}
.key.on .cap{fill:var(--c)}.key.on .side.cap{fill:color-mix(in srgb,var(--c) 72%,#000)}.key.on .cap:not(.side){filter:url(#glow)}.khalo{fill:var(--c);opacity:0;filter:url(#bloom);pointer-events:none}.key.on .khalo{opacity:.5}.kt{fill:var(--print);font:2.5px ui-monospace,monospace;letter-spacing:.2px;text-anchor:middle;stroke:none}
.lens{fill:var(--off)}.ringlamp.on .lens{fill:var(--lamp);filter:url(#glow)}.lhalo{fill:var(--lamp);opacity:0;filter:url(#bloom)}.ringlamp.on .lhalo{opacity:.65}
.arm{fill:none;stroke:var(--line);stroke-width:1.5;stroke-linecap:round;vector-effect:non-scaling-stroke}
.cord-under{fill:none;stroke:var(--cord-edge);stroke-width:5;stroke-linecap:round;stroke-linejoin:round}.cord{fill:none;stroke:var(--rubber);stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = ``

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* NALDEN R–10 key telephone. World: x lower-right, y lower-left, z up; 1 unit ≈ 1 mm.
Part                          x       y      z      w      d      h
rubber feet (4)          16/200  16/180      0     r7      –      5
base pan                      2       2      5    212    192      5
housing (side profile)        0       0     10    216    196     70   flat top y 0–78, 21° slope to y 190, chamfer, apron y 196
cradle bridge                16      10     80    184     62     10   saddles, handle channel, plunger pockets, brand
prongs (4)               70/132   16/60     90     14     10     20
hook plungers (2)        72/134      37     90     10      9      8   rise 7 with the handset
handset handle               40      30     98    136     26     14   grip, parting line
handset caps (2)         40/176      43     90    r24      –     22   collar, cup, cord grommet at x 200
dial (on the slope)         108   133.8     58    r55      –     10   bezel, lit number plate, wheel r46, card r19, stop at 64°
ringer window (side)        216  102–168  16–42     0     66     26   twin gongs, clapper
thumbwheel, grommet (side)  216  20–78  18–28      0     58     10
apron keys (4)           13–75      196     15     17      5     11   L1 L2 L3 HOLD
number card, ringer lamp  104/200    196  13–27     82      0     14
coiled cord             200–272   43–150   4–143      –      –      –
Handset lift 40. Seams, screws, digits and labels share their parent face. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: draw into a group, oriented planes, rounded outlines, pins, discs on any plane.
function into(g,fn){const n=root.childNodes.length;fn();while(root.childNodes.length>n)g.appendChild(root.childNodes[n]);return g;}
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`;
const add3=(a,b,k=1)=>a.map((v,i)=>v+b[i]*k);
function rp(q,r){const n=q.length;let d='';for(let i=0;i<n;i++){const b=q[i],cut=a=>{const L=Math.hypot(a[0]-b[0],a[1]-b[1])||1,k=Math.min(r,L/2)/L;return[b[0]+(a[0]-b[0])*k,b[1]+(a[1]-b[1])*k];};d+=(i?'L':'M')+cut(q[(i+n-1)%n])+'Q'+b+' '+cut(q[(i+1)%n]);}return d+'Z';}
function pin(g,x,y,r=.75){circle(g,x,y,r,'face top');line(g,x-r*.5,y+r*.35,x+r*.5,y-r*.35);}
function tube(o,U,V,N,r,h,cls='',band=false){
const g=el('g',{}),a=P(...U),b=P(...V),q=P(...N.map(k=>k*h)),det=a[0]*b[1]-b[0]*a[1];
const u=(b[1]*q[0]-b[0]*q[1])/det,v=(a[0]*q[1]-a[1]*q[0])/det,l=Math.hypot(u,v)||1,tx=-v*r/l,ty=u*r/l;
el('path',{d:`M${tx},${ty} A${r},${r} 0 0 1 ${-tx},${-ty} L${u-tx},${v-ty} A${r},${r} 0 0 ${band?0:1} ${u+tx},${v+ty} Z`,transform:plane(o,U,V),class:'face '+cls},g);
const face=group(plane(add3(o,N,h),U,V),g);if(!band)circle(face,0,0,r,'face top '+cls);return{g,face};
}
// Assembly: shadow, feet, pan, housing faces and their fittings, cradle, handset, dial, apron keys, cord.
const HX=216,YC=78,ZT=80,YS=190,ZS=40,YF=196,ZF=34,ZB=10,LS=Math.hypot(YS-YC,ZT-ZS),LIFT=40;
const U=[1,0,0],V=[0,(YS-YC)/LS,(ZS-ZT)/LS],N=[0,-V[2],V[1]];
const g0=P(116,104,0);el('ellipse',{cx:g0[0],cy:g0[1]+6,rx:160,ry:78,class:'shadow stage-floor'});el('ellipse',{cx:g0[0],cy:g0[1]+6,rx:160,ry:78,class:'stage-contact'});
for(const[x,y]of[[16,16],[200,16],[16,180],[200,180]])cylinder(x,y,0,7,5,'z','rubber');
box(2,2,5,212,192,5,4,'base');
const pan=group(FRONT(2,194,10));pin(pan,10,2.5,.9);pin(pan,202,2.5,.9);
const SD=group(SIDE(HX,YF,ZT));
el('path',{d:rp([[YF,ZT-ZB],[YF,0],[YF-YC,0],[YF-YS,ZT-ZS],[0,ZT-ZF],[0,ZT-ZB]],5),class:'face side'},SD);
const AP=group(FRONT(0,YF,ZF));rect(AP,0,0,HX,ZF-ZB,4,'face');
rect(group(plane([0,YS,ZS],U,[0,.7071,-.7071])),0,0,HX,6*Math.SQRT2,2,'face bevel');
const SL=group(plane([0,YC,ZT],U,V));rect(SL,0,0,HX,LS,4,'face slope');
const TP=group(TOP(0,0,ZT));rect(TP,0,0,HX,YC,6,'face top');
rect(SL,5,5,HX-10,LS-10,4,'detail');
// Side: seam, ringer window with twin gongs and clapper, volume thumbwheel, screws.
line(SD,4,66.5,YF-4,66.5);for(const u of[8,188])pin(SD,u,62,1);
const RW=group('',SD,{class:'control',role:'button',tabindex:'0','aria-label':'Incoming call / quiet the ringer (R)','aria-pressed':'false'});
rect(RW,44,31,82,34,6,'face recess');rect(RW,46.8,33.8,76.4,28.4,4.4,'face glass');
for(const u of[68,102]){circle(RW,u+1.4,49.2,12,'face side metal');circle(RW,u,48,12,'face metal');circle(RW,u,48,8.8,'detail');circle(RW,u,48,4,'face top metal');pin(RW,u,48,1.1);}
rect(RW,81,59.4,8,2.8,1,'face base');
const striker=group('',RW);line(striker,85,60.6,85,42.6,'arm');circle(striker,85,41.4,2.7,'face base');
rect(RW,46.8,33.8,76.4,28.4,4.4,'pane');el('path',{d:'M60,33.8 L53,62.2 H57 L64,33.8Z M70,33.8 L63,62.2 H65 L72,33.8Z',class:'sheen'},RW);
for(const[u,v]of[[48.6,35.6],[121.4,35.6],[48.6,60.4],[121.4,60.4]])pin(RW,u,v,.7);
rect(RW,42,29,86,38,7,'focus-ring');rect(RW,42,29,86,38,7,'hit');
rect(SD,148,51,32,12,3.4,'face recess');rect(SD,152,52.6,24,8.8,2.6,'face metal');for(let i=0;i<11;i++)line(SD,154+i*2,53.6,154+i*2,60.4);
text(SD,164,48.6,'RING VOL','etch micro center');
// Cradle bridge with saddles, channel and plunger pockets; rear prongs and plungers sit under the handset.
box(16,10,ZT,184,62,10,8);
const BT=group(TOP(16,10,90));
for(const u of[24,160])circle(BT,u,33,21,'face recess');
rect(BT,24,21,136,24,9,'face recess');for(const u of[54,116])rect(BT,u,25,14,15,2.4,'face base');
const BF=group(FRONT(16,72,90));text(BF,92,6.8,'NALDEN','label brand center');pin(BF,8,5,.8);pin(BF,176,5,.8);
const prong=y=>{for(const x of[70,132]){box(x,y,90,14,10,20,5);line(group(TOP(x,y,110)),3,5,11,5);}};
prong(16);
const plungers=[70,132].map(x=>into(el('g',{}),()=>box(x+2,37,90,10,9,15,2,'metal')));
// Handset: handle under two cups, grip, parting line and the cord grommet; lifts as one group.
const handset=el('g',{id:'handset',class:'control',role:'button',tabindex:'0','aria-label':'Lift handset (H)','aria-pressed':'false'});
into(handset,()=>{
for(const x of[40,176]){cylinder(x,43,90,21,3,'z','base');const c=cylinder(x,43,93,23,15,'z');circle(c.face,0,0,18.6,'detail');el('path',{d:'M-17,-6 Q-9,-15.5 2,-17.4',class:'shine'},c.face);}
box(30,31,108,156,24,12,10);
const gp=group(TOP(60,34,120));rect(gp,0,0,96,18,8,'detail');for(let i=0;i<11;i++)line(gp,28+i*4,4.5,28+i*4,13.5);
line(group(FRONT(56,55,120)),2,6.4,104,6.4);
const cg=cylinder(199,43,100,3.8,4.4,'x','rubber');circle(cg.face,0,0,2,'detail');
const ht=group(TOP(16,19,120));rect(ht,0,0,186,48,20,'hit');rect(ht,-2,-2,190,52,21,'focus-ring');
rect(group(FRONT(16,67,120)),0,0,186,30,6,'hit');
});
prong(60);
// Dial on the slope: halo, bezel, number plate, wheel rim, turning finger wheel, centre card, finger stop.
const DC=[108,YC+V[1]*59.5,ZT+V[2]*59.5],DP=n=>group(plane(add3(DC,N,n),U,V));
circle(DP(0),0,0,60,'dial-halo');
const bz=tube(DC,U,V,N,55,2.5,'base'),plate=bz.face;
circle(plate,0,0,53.6,'detail');circle(plate,0,0,51.4,'face paper plate');circle(plate,0,0,47.6,'detail');
const HOLES=[];
for(let i=0;i<10;i++){const a=(18-i*30)*Math.PI/180,d=String((i+1)%10),x=37*Math.cos(a),y=37*Math.sin(a);HOLES.push({d,x,y});
text(plate,x,y+2.5,d,'print digit center');line(plate,48.6*Math.cos(a),48.6*Math.sin(a),50.6*Math.cos(a),50.6*Math.sin(a));}
const rim=tube(add3(DC,N,2.5),U,V,N,46,3.5,'side metal',true);
const wheel=group('rotate(0)',rim.face);
let ws='M46,0A46,46 0 1 0 -46,0A46,46 0 1 0 46,0Z';for(const h of HOLES)ws+=`M${h.x+7},${h.y}A7,7 0 1 0 ${h.x-7},${h.y}A7,7 0 1 0 ${h.x+7},${h.y}Z`;
el('path',{d:ws,'fill-rule':'evenodd',class:'face metal'},wheel);
circle(wheel,0,0,44.4,'detail');circle(wheel,0,0,25.6,'detail');
for(let i=0;i<36;i++){const a=i*Math.PI/18;line(wheel,22.6*Math.cos(a),22.6*Math.sin(a),24.4*Math.cos(a),24.4*Math.sin(a));}
const holes=new Map();
for(const h of HOLES){const g=group('',wheel,{class:'control',role:'button',tabindex:'0','aria-label':`Dial ${h.d} (${h.d} key)`});circle(g,h.x,h.y,7,'detail hole-rim');circle(g,h.x,h.y,10,'hit');circle(g,h.x,h.y,9.2,'focus-ring');holes.set(h.d,g);}
const cd=tube(add3(DC,N,6),U,V,N,19,1.6,'metal').face;
circle(cd,0,0,16.2,'face paper');circle(cd,0,0,14.6,'detail');text(cd,0,-5.6,'NALDEN','print micro center');text(cd,0,2,'44·17','print card center');text(cd,0,8,'R–10','etch micro center');
el('path',{d:'M-11,-9.6 A14.6,14.6 0 0 1 3.6,-14.2',class:'shine'},cd);
const SA=64*Math.PI/180;tube(add3(add3(add3(DC,U,50.6*Math.cos(SA)),V,50.6*Math.sin(SA)),N,2.5),U,V,N,2.6,7.6,'metal');
const fs=group('rotate(64)',DP(10.1));rect(fs,39.6,-2.7,13.6,5.4,2.7,'face top metal');line(fs,42.4,0,50.6,0);
// Apron: key bezel, seam, number card and ringer lamp; then the four keys.
rect(AP,9,2.8,92,18.4,3.6,'face recess');line(AP,4,21.6,HX-4,21.6);
rect(AP,110,3.6,78,16,2.8,'face recess');rect(AP,111.6,5.2,74.8,12.8,1.8,'face paper');line(AP,115,8.6,183,8.6);text(AP,115,7.8,'DIALLED','print micro');
const cardNumber=text(AP,149,15.4,'— — — —','print number center');el('path',{d:'M113,6.4H122',class:'shine'},AP);
const RL=group('',AP,{class:'ringlamp'});circle(RL,201,11.6,9.4,'lhalo');circle(RL,201,11.6,5,'face recess');circle(RL,201,11.6,3.4,'face lens');circle(RL,200,10.6,.9,'sheen');
const KEYS=['L1','L2','L3','HOLD'].map((t,i)=>{const x=12+i*22,g=el('g',{class:'key'+(i===3?' hold':'')});
into(g,()=>{rect(group(FRONT(x,YF,32)),-4,-3,26,22,6,'khalo');box(x,YF,15,18,5,14,2.4,'cap');text(group(FRONT(x,YF+5,29)),9,8.4,t,'kt');
if(i===3){rect(group(FRONT(x,YF+5,29)),-1.6,-1.6,21.2,17.2,3,'focus-ring');rect(group(FRONT(x,YF,31)),-2,-2,22,19,3,'hit');}});return g;});
const holdKey=KEYS[3];for(const[k,v]of Object.entries({class:'key hold control',role:'button',tabindex:'0','aria-label':'Hold (K)','aria-pressed':'false'}))set(holdKey,k,v);
// Coiled cord, redrawn while the handset moves.
const cordBack=wire([],'cord-under'),cord=wire([],'cord');
frame([[0,0,0,HX,YF,120],[16,19,120,190,48,LIFT],[200,30,0,74,128,100],[0,YF,15,90,6,14]],12);
// State: hook switch, governed pulse dial, ringer cadence, hold, call progress, lamps and quiet sound.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
let lifted=false,lift=0,ringing=false,ringT0=0,connected=false,callAt=0,calling=false,callT0=0,hold=false,number='',queue=[],dial=null,pulses=0,idleAt=0;
let angle=0,note='',noteUntil=0,lastTime=0,lastCord=-1,lastJit=false,lastUI=-1,flick=0,lastBell=0,nextBusy=performance.now()+4000,ac=null,toneG=null;
const busy=[0,0];
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ac=new A();toneG=ac.createGain();toneG.gain.value=0;toneG.connect(ac.destination);for(const f of[350,440]){const o=ac.createOscillator();o.frequency.value=f;o.connect(toneG);o.start();}}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function blip(f,d,v,type='square'){if(!ac)return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.02);}
function say(m){announcement.textContent=m;}
function flash(m){note=m;noteUntil=performance.now()+1400;}
function updateUI(now=performance.now()){
svg.classList.toggle('powered',lifted);
set(handset,'aria-pressed',lifted);set(handset,'aria-label',lifted?'Replace handset (H)':'Lift handset (H)');set(holdKey,'aria-pressed',hold);set(RW,'aria-pressed',ringing);
const ls=ringing?'INCOMING':hold?'ON HOLD':calling?'RINGING OUT':connected?`${Math.floor((now-callAt)/1000)} s CONNECTED`:lifted?'LINE OPEN':'ON HOOK';
readout.textContent=`${number||'— — —'} · ${ls}${queue.length?' · +'+queue.length:''}`;
stateLabel.textContent=dial?`DIAL ${dial.digit} · ${pulses}/${dial.count} PULSES${queue.length?' · QUEUED '+queue.length:''}`:note&&now<noteUntil?note:ringing?'INCOMING CALL · LIFT TO ANSWER':hold?(lifted?'LINE 1 HELD · K TO RESUME':'LINE 1 HELD · LIFT TO RESUME'):calling?'RINGBACK · WAITING FOR AN ANSWER':connected?'CALL CONNECTED · K TO HOLD':lifted?'DIAL TONE · READY':number?'NUMBER STORED · LIFT HANDSET':'READY FOR A CALL';
cardNumber.textContent=number?number.replace(/(\d{3})(?=\d)/g,'$1 '):'— — — —';
set(cardNumber,'font-size',number.length>9?'4.6':'5.6');
lastUI=now;
}
function hook(){
audio();const now=performance.now(),was=ringing;lifted=!lifted;lastCord=-1;
if(lifted){
if(was){ringing=false;connected=true;callAt=now;say('Handset lifted. Incoming call answered.');}
else if(hold){hold=false;say('Handset lifted. Held call resumed.');}
else say(number?'Handset lifted. Calling the stored number.':'Handset lifted. Dial tone.');
}else if(hold)say('Handset replaced. Line 1 stays on hold.');
else{connected=false;calling=false;number='';queue=[];idleAt=0;flash('CALL ENDED · NUMBER CLEARED');say(ringing?'Handset replaced. Incoming call is ringing. Lift to answer.':'Handset replaced. Line closed and number cleared.');}
if(reduced.matches)lift=lifted?1:0;
updateUI();
}
function startDial(now){
if(!queue.length)return;
const digit=queue.shift(),count=digit==='0'?10:Number(digit);
dial={digit,count,start:now,travel:count*30+4,out:230+count*19,hold:85,back:count*100+170};
pulses=0;holes.get(digit).classList.add('active');
}
function dialDigit(digit){
audio();const now=performance.now();ringing=false;connected=false;calling=false;hold=false;note='';idleAt=0;lastCord=-1;number=(number+digit).slice(-14);
if(reduced.matches){pulses=digit==='0'?10:Number(digit);flash(`DIALED ${digit} · ${pulses} PULSES`);idleAt=now;}
else{queue.push(digit);if(!dial)startDial(now);}
say(`Dial ${digit}. Number ${number.split('').join(' ')}.`);updateUI();
}
function ring(){
audio();ringing=!ringing;lastCord=-1;
if(ringing){ringT0=performance.now();calling=false;say(lifted?'Incoming call waiting. Replace and lift the handset to answer.':'Incoming call. Lift the handset to answer. Press R to quiet.');}
else{flash('RINGER QUIET');say('Ringer stopped.');}
updateUI();
}
function holdCall(){
audio();holdKey.classList.add('down');setTimeout(()=>holdKey.classList.remove('down'),170);blip(900,.03,.012,'triangle');
if(hold){if(lifted){hold=false;say('Call resumed.');}else flash('LIFT HANDSET TO RESUME');}
else if(connected&&lifted){hold=true;say('Line 1 on hold. Replace the handset, then lift it or press K to resume.');}
else flash('NO CALL TO HOLD');
updateUI();
}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(handset,hook);bind(RW,ring);bind(holdKey,holdCall);for(const[digit,g]of holes)bind(g,()=>dialDigit(digit));
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
const k=e.key.toLowerCase();
if(k==='h'){e.preventDefault();hook();}else if(k==='r'){e.preventDefault();ring();}else if(k==='k'){e.preventDefault();holdCall();}else if(/^[0-9]$/.test(k)){e.preventDefault();dialDigit(k);}
});
// Sample a helix along a cubic centreline; both leads meet their grommets.
function bez(a,b,c,d,t){const s=1-t;return a.map((v,i)=>s*s*s*v+3*s*s*t*b[i]+3*s*t*t*c[i]+t*t*t*d[i]);}
function cordDraw(z,jx,jy){
const a=[203+jx,43+jy,100+z],b=[256,42,62+z*.7],c=[268,128,4],d=[238,134,5],pts=[];
const n=520,loops=27,r=3.3-lift*.55;
for(let i=0;i<=n;i++){
const t=i/n,p=bez(a,b,c,d,t),q=bez(a,b,c,d,Math.min(1,t+.001)),q0=bez(a,b,c,d,Math.max(0,t-.001));
const tg=q.map((v,k)=>v-q0[k]),len=Math.hypot(...tg)||1,[tx,ty,tz]=tg.map(v=>v/len),nl=Math.hypot(tx,ty)||1,nx=-ty/nl,ny=tx/nl;
const bx=-tz*ny,by=tz*nx,bz2=tx*ny-ty*nx,ph=t*loops*Math.PI*2,amp=r*Math.min(1,t*22,(1-t)*22),co=Math.cos(ph)*amp,si=Math.sin(ph)*amp;
pts.push([p[0]+co*nx+si*bx,p[1]+co*ny+si*by,p[2]+si*bz2]);
}
for(let i=1;i<=22;i++)pts.push(bez(d,[228,146,5],[222,166,10],[219.4,168,20],i/22));
const data=poly(pts);set(cordBack,'d',data);set(cord,'d',data);
}
cylinder(HX,168,20,4.6,3.4,'x','rubber');circle(group(SIDE(HX+3.4,168,20)),0,0,2.6,'detail');
root.appendChild(cordBack);root.appendChild(cord);
function lamp(n,on){on=!!on;if(n._on!==on){n._on=on;n.classList.toggle('on',on);}}
function tick(now){
const dt=lastTime?Math.min(50,now-lastTime):16,red=reduced.matches;lastTime=now;
const target=lifted?1:0;lift=red?target:lift+(target-lift)*(1-Math.exp(-dt/120));
if(Math.abs(target-lift)<.001)lift=target;
const ringOn=ringing&&(red||(now-ringT0)%3000<1300),jit=ringOn&&!lifted&&!red;
let jx=0,jy=0;if(jit){jx=Math.sin(now*.052)*1.1;jy=Math.sin(now*.077)*.5;}
if(jit!==lastJit){lastJit=jit;lastCord=-1;}
const tr=P(jx,jy,lift*LIFT);set(handset,'transform',`translate(${tr[0].toFixed(2)} ${tr[1].toFixed(2)})`);
for(const p of plungers)set(p,'transform',`translate(0 ${(-7*lift).toFixed(2)})`);
set(striker,'transform',`rotate(${ringOn?(red?13:Math.sin(now*.12)*16):0} 85 60.6)`);
if(ringOn&&!red&&ac&&now-lastBell>52){lastBell=now;blip(1240,.07,.007,'sine');blip(1910,.05,.004,'sine');}
if(lastCord<0||((jit||lift!==target)&&now-lastCord>32)){cordDraw(lift*LIFT,jx,jy);lastCord=now;}
if(dial&&red){holes.get(dial.digit).classList.remove('active');pulses=dial.count;dial=null;queue=[];angle=0;idleAt=now;set(wheel,'transform','rotate(0)');}
if(dial){
const t=now-dial.start;
if(t<dial.out)angle=dial.travel*(1-Math.pow(1-t/dial.out,3));
else if(t<dial.out+dial.hold)angle=dial.travel;
else{
const p=clamp((t-dial.out-dial.hold)/dial.back),np=Math.min(dial.count,Math.floor(p*dial.count));angle=dial.travel*(1-p);
if(np>pulses){pulses=np;if(lifted){flick=now+45;blip(170,.018,.02);}}
if(p>=1){holes.get(dial.digit).classList.remove('active');say(`Digit ${dial.digit} sent. ${dial.count} pulses.`);dial=null;angle=0;if(queue.length)startDial(now);else idleAt=now;}
}
set(wheel,'transform',`rotate(${angle.toFixed(2)})`);
}
if(lifted&&!dial&&!queue.length&&!calling&&!connected&&!hold&&!ringing&&idleAt&&number.length>=3&&now-idleAt>1500){calling=true;callT0=now;idleAt=0;say(`Calling ${number.split('').join(' ')}.`);}
if(calling&&now-callT0>(red?800:4300)){calling=false;connected=true;callAt=now;say('Call connected.');}
if(now>nextBusy){const i=Math.random()<.5?0:1;busy[i]=busy[i]>now?0:now+4000+Math.random()*7000;nextBusy=now+5000+Math.random()*8000;}
lamp(KEYS[0],ringing?(red||Math.floor((now-ringT0)/500)%2===0):hold?(red||now%460>80):lifted&&!(now<flick));
lamp(KEYS[1],busy[0]>now);lamp(KEYS[2],busy[1]>now);lamp(KEYS[3],hold);lamp(RL,ringOn);
if(toneG)toneG.gain.setTargetAtTime(lifted&&!dial&&!queue.length&&!hold&&!connected&&(!calling&&!number||calling&&(now-callT0)%3000<1200)?.004:0,ac.currentTime,.015);
if(now-lastUI>100)updateUI(now);
requestAnimationFrame(tick);
}
updateUI();cordDraw(0,0,0);requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], draw }
