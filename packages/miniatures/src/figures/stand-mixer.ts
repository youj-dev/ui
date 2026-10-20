// @ts-nocheck
/* TAVREN M–04 · Stand mixer. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#c4c4c0;--ok:#15a65e;--warn:#e88a00;--rubber:#2c2c2b;--metal:#d4d6d3;--metal-top:#f1f2f0;--metal-side:#b2b5b2;--inside:#9ea19e;--shine:#ffffff;--batter:#e7d3a6;--batter-line:#b39a68;--lamp:#ffc561;--cone:.32}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#a5a5a2;--ok:#36d886;--warn:#ffad2b;--rubber:#232323;--metal:#b3b4b2;--metal-top:#e1e2e1;--metal-side:#7e7f7e;--inside:#858785;--shine:#d7d7d7;--batter:#c3b28b;--batter-line:#968156;--lamp:#ffc561;--cone:.42;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.08;filter:url(#soft)}
.control{cursor:pointer;outline:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .button-face{fill:var(--top)}.hit{fill:transparent;stroke:none;pointer-events:all}
.rubber{fill:var(--rubber)}.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.inside{fill:var(--inside)}.batter{fill:var(--batter);stroke:none}
.press{transition:transform .12s}.released .press{transform:translate(-3px,0)}
.cable-under{fill:none;stroke:var(--line);stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.cable{fill:none;stroke:var(--rubber);stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}
.shaft-under{fill:none;stroke:var(--line);stroke-width:6;stroke-linecap:round;stroke-linejoin:round}.shaft{fill:none;stroke:var(--metal-top);stroke-width:4.2;stroke-linecap:round;stroke-linejoin:round}.hook-under{fill:none;stroke:var(--line);stroke-width:7;stroke-linecap:round;stroke-linejoin:round}.hook{fill:none;stroke:var(--metal-top);stroke-width:5.2;stroke-linecap:round;stroke-linejoin:round}
.handle-under{fill:none;stroke:var(--line);stroke-width:6.4;stroke-linecap:round;stroke-linejoin:round}.handle{fill:none;stroke:var(--metal-top);stroke-width:4.8;stroke-linecap:round;stroke-linejoin:round}
.whisk-under{fill:none;stroke:var(--line);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.whisk-wire{fill:none;stroke:var(--shine);stroke-width:.85;stroke-linecap:round;stroke-linejoin:round}
.rim{fill:none;stroke:var(--metal-top);stroke-width:2.4;stroke-linecap:round}.rim-u{fill:none;stroke:var(--line);stroke-width:3.6;stroke-linecap:round}.reflection{fill:none;stroke:var(--shine);stroke-width:1.1;stroke-linecap:round;opacity:.6}.swirl{fill:none;stroke:var(--batter-line);stroke-width:1.1;stroke-linecap:round;opacity:.6}.eddy{fill:var(--batter-line);opacity:0;transition:opacity .3s}.running .eddy{opacity:.4}
.led{fill:var(--off);stroke:none}.led.on{fill:var(--accent);filter:url(#glow)}.led.hi{fill:var(--warn);filter:url(#glow)}
.lockring{fill:none;stroke:var(--ok);stroke-width:1.6;filter:url(#glow);transition:stroke .3s}.released .lockring{stroke:var(--warn)}.lockhalo{fill:var(--ok);opacity:.22;filter:url(#bloom);transition:fill .3s}.released .lockhalo{fill:var(--warn)}
.drive-mark{stroke:var(--accent);stroke-width:1.7;stroke-linecap:round}.arrow{fill:none;stroke:var(--muted);stroke-width:.8;stroke-linecap:round;stroke-linejoin:round}
.bowl-light{opacity:0;transition:opacity .45s;pointer-events:none}.lit .bowl-light{opacity:1}.cone{fill:url(#coneG)}.spot{fill:var(--lamp);opacity:.5;filter:url(#bloom)}.emit{fill:var(--lamp);opacity:.9;filter:url(#bloom)}.cone-s{stop-color:var(--lamp)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<linearGradient id="coneG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" class="cone-s" style="stop-opacity:var(--cone)"/><stop offset="1" class="cone-s" stop-opacity="0"/></linearGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* TAVREN M–04 tilt-head stand mixer. World: x lower-right, y lower-left, z up; units in mm.
Part                          x     y     z     w     d     h
power cord + strain relief  −14   −12     0    76    48    34
rubber feet (4)            24/136 30/196  0    18    18     8
plinth                       10    10     8   160   212     6
base body                    14    14    14   152   204    10   deck inset, toe badge
bowl socket                  59   123    24    64    64     3   bayonet tabs
column foot, column          54    24    24    71    56   147   speed panel, gate, LED ladder
neck saddle                  49    27   164    83    50    27
hinge barrel, lock          122    48   184    22    26    26   light ring: green locked, amber released
head shell (rig)             44    22   169    94   166    48   cover seam, vents, brand, service port
nose hub (rig)               76   188   182    30     0    30   chrome rings, thumb screw
drive collar + shaft (rig)   82   146   143    18    18    26
tool: whisk / paddle / hook  59   123    57    64    64    80
bowl foot                    67   131    27    48    48     9
steel bowl (9-ring profile)  29    93    36   124   124    81   rolled rim, bead, reflections
batter                       41   105    86   100   100     0
bowl light cone            ~91  ~160 86–169    52    52    83
side handle                 150   140  80–110  28    10    30
Head parts turn about (x, 48, 184). The tool paints before the head while it is down and after it when raised. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// A rigid head rig: keep the engine's face planes and re-project them as the head turns about the hinge.
const headRig=document.createElementNS(NS,'g'),planes=[],rigPaths=[];
const pivotY=48,pivotZ=184,BX=91,BY=155;
let angle=0,targetAngle=0,speed=0,tool=0,locked=true,phase=-.3,dirty=true,light=false;
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const rpm=[0,45,75,110,150,190],TOOLS=['WHISK','PADDLE','HOOK'];
function turn(x,y,z){const c=Math.cos(angle),s=Math.sin(angle),dy=y-pivotY,dz=z-pivotZ;return[x,pivotY+dy*c-dz*s,pivotZ+dy*s+dz*c];}
function TP(x,y,z){return P(...turn(x,y,z));}
function faceMatrix(axis,x,y,z){
const o=TP(x,y,z),u=axis==='x'?TP(x,y-1,z):TP(x+1,y,z),v=axis==='z'?TP(x,y+1,z):TP(x,y,z-1);
return `matrix(${u[0]-o[0]} ${u[1]-o[1]} ${v[0]-o[0]} ${v[1]-o[1]} ${o.join(' ')})`;
}
function plane(g,axis,x,y,z){planes.push({g,axis,x,y,z});return g;}
function rigBox(x,y,z,w,d,h,r=5,cls=''){
const g=box(x,y,z,w,d,h,r,cls);headRig.appendChild(g);
plane(g.children[0],'x',x+w,y+d,z+h);plane(g.children[1],'y',x,y+d,z+h);plane(g.children[2],'z',x,y,z+h);return g;
}
function rigFace(axis,x,y,z,parent=headRig,attrs={}){return plane(group({z:TOP,y:FRONT,x:SIDE}[axis](x,y,z),parent,attrs),axis,x,y,z);}
function rigWire(pts,cls,parent=headRig){const n=wire(pts,cls,parent);rigPaths.push({n,pts});return n;}
const tpPath=(pts,close=false)=>pts.map((p,i)=>(i?'L':'M')+TP(...p).join(',')).join(' ')+(close?' Z':'');
function pin(g,x,y,r=.75){circle(g,x,y,r,'face top');line(g,x-r*.5,y+r*.35,x+r*.5,y-r*.35);}
// Grounded assembly: shadow, cord, feet, plinth, base, socket, column with speed panel, saddle, hinge.
const sh=P(92,124,0);el('ellipse',{cx:sh[0],cy:sh[1]+6,rx:134,ry:58,class:'shadow stage-floor'});el('ellipse',{cx:sh[0],cy:sh[1]+6,rx:134,ry:58,class:'stage-contact'});
const cord=[[62,28,34],[56,18,26],[48,8,3],[28,-8,2],[8,-12,2],[-8,-4,2],[-8,12,2],[6,22,2],[18,24,2]];
wire(cord,'cable-under');wire(cord,'cable');box(56,22,24,8,6,10,2,'rubber');
for(const[x,y]of[[24,30],[136,30],[24,196],[136,196]])box(x,y,0,18,18,8,3,'rubber');
box(10,10,8,160,212,6,10,'base');
box(14,14,14,152,204,10,12);
const deck=group(TOP(14,14,24.1));rect(deck,6,6,140,192,10,'detail');pin(deck,12,12,1.2);pin(deck,140,12,1.2);
const toe=group(FRONT(14,218,24));line(toe,14,7.2,138,7.2);text(toe,76,5.4,'TAVREN · M–04','etch center');pin(toe,8,5,.9);pin(toe,144,5,.9);
line(group(SIDE(166,218,24)),10,7.2,194,7.2);
cylinder(BX,BY,24,32,3,'z','base');ellipse(BX,BY,27.2,28,'z','face recess');
const socket=group(TOP(BX,BY,27.3));
for(const a of[0,2.094,4.189]){const x=Math.cos(a)*28,y=Math.sin(a)*28;rect(group(`translate(${x} ${y}) rotate(${a*180/Math.PI})`,socket),-4,-2,8,4,1,'face metal');}
box(54,24,24,71,56,7,7,'base');box(58,28,31,63,48,140,10);
const colSide=group(SIDE(121.2,76,171));line(colSide,4,6,4,132);line(colSide,44,6,44,132);slits(colSide,14,124,22,7,7);
const colFront=group(FRONT(58,76,171));line(colFront,8,6,8,40);line(colFront,55,6,55,40);
const panel=group(SIDE(121.5,70,156));rect(panel,-3,-3,46,80,5,'face base');rect(panel,1,2,38,72,4,'face');
screw(panel,4,6);screw(panel,36,70);
rect(panel,17,9,6,59,2.4,'face recess');
const LEDS=[];
for(let i=0;i<=5;i++){line(panel,14,65-i*10,17,65-i*10);text(panel,4.6,66.4-i*10,String(i),'etch micro center');if(i)LEDS.push(circle(panel,10,65-i*10,1.7,'led'));}
text(panel,20,6,'SPEED','etch micro center');
const speedControl=group(SIDE(123.5,70,156),root,{id:'speedControl',class:'control',role:'button',tabindex:'0','aria-label':'Speed lever. Click a position, or press 1 to 5. Press 0 to stop.','aria-pressed':'false'});
rect(speedControl,-8,-7,55,91,6,'hit');rect(speedControl,-6,-5,51,87,6,'focus-ring');
const lever=group('translate(0 65)',speedControl);rect(lever,16,-2,10,4,1,'face side metal');rect(lever,22,-5.4,18,10.8,3.4,'face recess button-face');for(const v of[-2.2,0,2.2])line(lever,27,v,36,v);
box(49,27,164,83,50,27,7,'base');
cylinder(122,48,184,13,20,'x','base');
const hinge=group(SIDE(142.1,48,184));circle(hinge,0,0,11,'face side metal');circle(hinge,0,0,8,'face recess');
const lockControl=group(SIDE(144,48,184),root,{id:'lockControl',class:'control',role:'button',tabindex:'0','aria-label':'Release or lock the head latch','aria-pressed':'true'});
circle(lockControl,0,0,15,'lockhalo');circle(lockControl,0,0,19,'hit');circle(lockControl,0,0,16,'focus-ring');
const lockPress=group('translate(0 0)',lockControl,{class:'press'});circle(lockPress,0,0,10.6,'lockring');circle(lockPress,0,0,9,'face top button-face');circle(lockPress,0,0,6.8,'detail');
rect(lockPress,-3,0,6,4,1,'detail');const lockShackle=el('path',{d:'M-2,0 v-2 a2,2 0 0 1 4,0 v2',class:'detail'},lockPress);
// Open steel bowl, back first: foot, silhouette, rim, inside, batter and the bowl light.
const arc=(z,r,a,b,n=32)=>Array.from({length:n+1},(_,i)=>{const t=a+(b-a)*i/n;return[BX+r*Math.cos(t),BY+r*Math.sin(t),z];});
const a0=-Math.PI/4,a1=3*Math.PI/4,PROF=[[117,62],[108,61.2],[98,59],[86,55],[74,49.5],[62,42.5],[51,35],[42,29],[36,26]];
const at=(z,r,a)=>[BX+r*Math.cos(a),BY+r*Math.sin(a),z],mid=PROF.slice(1,-1);
const shell=[...arc(117,62,a0,a1),...mid.map(([z,r])=>at(z,r,a1)),...arc(36,26,a1,a0,20),...mid.slice().reverse().map(([z,r])=>at(z,r,a0))];
cylinder(BX,BY,27,24,9,'z','side metal');
el('path',{d:poly(shell,true),class:'face side metal'});
ellipse(BX,BY,117,62,'z','face top metal');ellipse(BX,BY,117.2,58.6,'z','face inside');
wire(arc(106,53,Math.PI*.87,Math.PI*1.63),'reflection');
const batterPlane=group(TOP(BX,BY,86));circle(batterPlane,0,0,51,'batter');
const batterSwirl=group('rotate(0)',batterPlane);const spiral=[];
for(let i=0;i<=125;i++){const t=i/125,r=4+t*40,a=t*Math.PI*5.5;spiral.push([r*Math.cos(a),r*Math.sin(a)]);}
el('path',{d:spiral.map((p,i)=>(i?'L':'M')+p.map(v=>v.toFixed(2)).join(',')).join(' '),class:'swirl'},batterSwirl);
el('path',{d:'M-41,-12 Q-29,-38 0,-42 M15,41 Q37,33 43,9',class:'reflection'},batterSwirl);
for(const[x,y,r]of[[-26,11,1.4],[17,-29,1.1],[32,17,1.6],[-4,-20,.8]])circle(batterSwirl,x,y,r,'swirl');
circle(batterSwirl,0,0,8,'eddy');circle(batterSwirl,0,0,4,'batter');
const bowlLight=el('g',{class:'bowl-light'}),cone=el('path',{class:'cone'},bowlLight);
circle(group(TOP(BX,BY+6,86.3),bowlLight),0,0,27,'spot');const emit=el('ellipse',{rx:10,ry:5,class:'emit'},bowlLight);
// Tools hang from an orbiting shaft; the active one is shown.
const toolRig=el('g',{id:'toolRig',class:'control',role:'button',tabindex:'0','aria-label':'Change the attachment (A)'});
const toolFocus=rigFace('y',57,163,146,toolRig);rect(toolFocus,-7,-7,81,108,8,'focus-ring');rect(toolFocus,-7,-7,81,108,8,'hit');
const toolShaftBack=el('path',{class:'shaft-under'},toolRig),toolShaft=el('path',{class:'shaft'},toolRig);
const whisk=el('g',{},toolRig),whiskPaths=[];
for(let i=0;i<8;i++)whiskPaths.push([el('path',{class:'whisk-under'},whisk),el('path',{class:'whisk-wire'},whisk)]);
const paddle=el('g',{display:'none'},toolRig),paddleFace=el('path',{class:'face metal','fill-rule':'evenodd'},paddle),paddleEdge=el('path',{class:'reflection'},paddle);
const hook=el('g',{display:'none'},toolRig),hookU=el('path',{class:'hook-under'},hook),hookW=el('path',{class:'hook'},hook);
const HOOK=[[0,136],[0,121],[3,113],[10,105],[17,95],[19,84],[16,74],[9,67],[2,66],[-3,70]];
const toolCollar=rigFace('z',BX,BY,137,toolRig);circle(toolCollar,0,0,6.4,'face side metal');circle(toolCollar,0,0,3.2,'face top metal');
// Head rig: drive under the shell first, then shell, cover, vents, brand, service port, nose hub, controls.
root.appendChild(headRig);
rigWire([[BX,BY,169],[BX,BY,143]],'shaft-under');rigWire([[BX,BY,169],[BX,BY,143]],'shaft');
const driveRing=rigFace('z',BX,BY,163);circle(driveRing,0,0,9,'face side metal');const driveMark=line(driveRing,0,-5.6,0,-8.6,'drive-mark');
rigBox(44,22,169,94,166,48,15);
const cover=rigFace('z',48,26,217.15);rect(cover,0,0,86,158,12,'detail');line(cover,6,52,80,52);screw(cover,9,9);screw(cover,77,9);
const vents=rigFace('z',62,32,217.3);slits(vents,0,0,58,16,12);
const shellSide=rigFace('x',138.2,188,217);rect(shellSide,6,23.6,154,3.6,1.8,'face metal');rect(shellSide,48,7,58,14,3,'face base');text(shellSide,77,16.6,'TAVREN','label brand center');screw(shellSide,51.6,14);screw(shellSide,102.4,14);
const service=rigFace('x',138.3,62,201);circle(service,0,0,10,'face recess');circle(service,0,0,7,'face top');line(service,-4,0,4,0);circle(service,0,0,12,'detail');
const nose=rigFace('y',44,188.2,217);rect(nose,6,23.6,82,3.6,1.8,'face metal');
const hub=rigFace('y',BX,188.4,197);circle(hub,0,0,15.6,'face metal');circle(hub,0,0,12.6,'face top metal');circle(hub,0,0,9.4,'detail');circle(hub,0,0,2.6,'face metal');
for(let i=0;i<12;i++){const a=i*Math.PI/6;line(hub,13.4*Math.cos(a),13.4*Math.sin(a),14.8*Math.cos(a),14.8*Math.sin(a));}
rect(hub,-3,-21,6,6,1.6,'face top metal');line(hub,-1.6,-18,1.6,-18);
const tiltControl=rigFace('y',44,190,217,headRig,{id:'tiltControl',class:'control',role:'button',tabindex:'0','aria-label':'Tilt the mixer head up or down (T)','aria-pressed':'false'});
rect(tiltControl,-4,-4,102,56,10,'hit');rect(tiltControl,-2,-2,98,52,14,'focus-ring');
el('path',{d:'M66,36 l5,-3.4 5,3.4 M71,32.6 v8',class:'arrow'},tiltControl);
const changeControl=rigFace('x',139,164,187,headRig,{id:'changeControl',class:'control',role:'button',tabindex:'0','aria-label':'Release and change the attachment (A)'});
circle(changeControl,0,0,15,'hit');circle(changeControl,0,0,12,'focus-ring');
circle(changeControl,0,0,8,'face recess button-face');el('path',{d:'M-4,-2 h8 l-2,-2 M4,2 H-4 l2,2',class:'detail'},changeControl);
root.appendChild(hinge);root.appendChild(lockControl);
// Bowl front: wall, bead, reflections that follow the profile, rolled rim, side handle.
el('path',{d:poly(shell,true),class:'face metal'});
wire(arc(64,44,a0+.08,a1-.08),'detail');
for(const a of[.08,.42,.98])wire(PROF.slice(1,-1).map(([z,r])=>at(z-2,r-1.2,a)),'reflection');
wire(arc(117.3,62,a0,a1),'rim-u');wire(arc(117.3,62,a0,a1),'rim');wire(arc(117.6,59.4,a0,a1),'detail');
const HA=-.18,hd=[[61,108],[72,107],[77,101],[76,90],[70,82],[54.5,80]].map(([r,z])=>at(z,r,HA));
for(const[r,z]of[[60.8,108],[54.5,80]]){const p=at(z,r,HA);el('ellipse',{cx:P(...p)[0],cy:P(...p)[1],rx:4.2,ry:3,class:'face side metal'});}
wire(hd,'handle-under');wire(hd,'handle');
const fitPts=[];for(const x of[10,170])for(const y of[10,222])fitPts.push([x,y,0],[x,y,24]);
for(const a of[0,38*Math.PI/180])for(const x of[44,138])for(const y of[22,188])for(const z of[169,217]){const c=Math.cos(a),s=Math.sin(a);fitPts.push([x,48+(y-48)*c-(z-184)*s,184+(y-48)*s+(z-184)*c]);}
{const q=[...fitPts,...cord,...hd].map(p=>P(...p)),xs=q.map(p=>p[0]),ys=q.map(p=>p[1]),pad=12,x0=Math.min(...xs)-pad,y0=Math.min(...ys)-pad;set(svg,'viewBox',`${x0} ${y0} ${Math.max(...xs)+pad-x0} ${Math.max(...ys)+pad-y0}`);}
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let ac=null,motor=null,motorG=null;
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ac=new A();motor=ac.createOscillator();const f=ac.createBiquadFilter();motorG=ac.createGain();motor.type='sawtooth';motor.frequency.value=60;f.type='lowpass';f.frequency.value=380;motorG.gain.value=0;motor.connect(f);f.connect(motorG);motorG.connect(ac.destination);motor.start();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function click(f=900){if(!ac)return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.014,t);g.gain.exponentialRampToValueAtTime(.0001,t+.04);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.05);}
function say(v){announcement.textContent=v;}
function running(){return speed>0&&angle<.007&&locked;}
function updateUI(){
const moving=Math.abs(angle-targetAngle)>.006,run=running();
svg.classList.toggle('running',run);svg.classList.toggle('lit',light&&angle<.03);lockControl.classList.toggle('released',!locked||targetAngle>0);
set(lockControl,'aria-pressed',locked);set(tiltControl,'aria-pressed',targetAngle>.1);set(speedControl,'aria-pressed',speed>0);
set(lever,'transform',`translate(0 ${65-speed*10})`);
set(lockShackle,'d',locked?'M-2,0 v-2 a2,2 0 0 1 4,0 v2':'M-2,0 v-2 a2,2 0 0 1 4,0');
set(lockControl,'transform',SIDE(locked?144:148,48,184));
readout.textContent=`${TOOLS[tool]} · ${String(rpm[speed]).padStart(3,'0')} RPM`;
stateLabel.textContent=(moving?(targetAngle>angle?'LIFTING · MOTOR STOPPED':'SEATING · LATCH ENGAGING'):angle>.35?'HEAD RAISED · MOTOR INTERLOCK':!locked?'LATCH RELEASED · MOTOR STOPPED':run?`MIXING · SPEED ${speed} / 5`:'HEAD LOCKED · STOPPED')+(light&&angle<.03?' · LIGHT':'');
}
function settle(){if(reduced.matches)angle=targetAngle;dirty=true;updateUI();}
function tilt(){
audio();click(520);speed=0;targetAngle=targetAngle>.35?0:38*Math.PI/180;locked=targetAngle===0;
say(locked?'Head lowering and locking. Motor stopped.':'Head tilting up. Motor stopped by the head interlock. The bowl light switches off while raised.');settle();
}
function changeAttachment(){
audio();click(760);speed=0;tool=(tool+1)%3;targetAngle=38*Math.PI/180;locked=false;
set(whisk,'display',tool===0?'':'none');set(paddle,'display',tool===1?'':'none');set(hook,'display',tool===2?'':'none');phase=-.3;
say(`${TOOLS[tool].toLowerCase()} fitted. Head raised. Choose a speed to lower, lock, and mix.`);settle();
}
function latch(){audio();click(420);speed=0;locked=!locked;targetAngle=locked?0:9*Math.PI/180;say(locked?'Latch engaged. Head lowering.':'Latch released. Head lifted clear of the lock pin.');settle();}
function setSpeed(value){
audio();click(620+value*80);speed=value;if(speed){targetAngle=0;locked=true;}
say(speed?`Speed ${speed}. ${rpm[speed]} RPM. ${TOOLS[tool].toLowerCase()} mixing.`:'Motor stopped.');settle();
}
function toggleLight(){audio();click(1100);light=!light;say(light?(angle>.03?'Bowl light on. It shines once the head is down.':'Bowl light on.'):'Bowl light off.');dirty=true;updateUI();}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(tiltControl,tilt);bind(toolRig,changeAttachment);bind(changeControl,changeAttachment);bind(lockControl,latch);
speedControl.addEventListener('click',e=>{
const m=speedControl.getScreenCTM();if(!m)return;const p=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse());setSpeed(clamp(Math.round((65-p.y)/10),0,5));
});
speedControl.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)setSpeed((speed+1)%6);}});
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
const k=e.key.toLowerCase();if(k==='t'){e.preventDefault();tilt();}else if(k==='a'){e.preventDefault();changeAttachment();}else if(k==='l'){e.preventDefault();toggleLight();}else if(/^[0-5]$/.test(k)){e.preventDefault();setSpeed(Number(k));}
});
function drawRig(){
for(const {g,axis,x,y,z}of planes)set(g,'transform',faceMatrix(axis,x,y,z));
for(const {n,pts}of rigPaths)set(n,'d',tpPath(pts));
const raised=angle>.12;if(raised!==drawRig.raised){drawRig.raised=raised;root.insertBefore(toolRig,raised?hinge:headRig);}
const orbit=phase*.18,cx=BX+3*Math.cos(orbit),cy=BY+3*Math.sin(orbit);
const shaft=tpPath([[BX,BY,143],[cx,cy,133]]);set(toolShaftBack,'d',shaft);set(toolShaft,'d',shaft);
const point=(q,z)=>[cx+q*Math.cos(phase),cy+q*Math.sin(phase),z];
if(tool===0){
for(let i=0;i<8;i++){
const pts=[],a=i*Math.PI/4+phase;
for(let j=0;j<=22;j++){const t=j/22,r=4*(1-t)+27*Math.sin(Math.PI*t);pts.push([cx+r*Math.cos(a),cy+r*Math.sin(a),135-t*78]);}
const d=tpPath(pts);for(const n of whiskPaths[i])set(n,'d',d);
}
}else if(tool===1){
const shape=pts=>tpPath(pts.map(([q,z])=>point(q,z)),true);
set(paddleFace,'d',shape([[-4,136],[4,136],[4,116],[23,112],[28,83],[16,61],[-16,61],[-28,83],[-23,112],[-4,116]])+' '+shape([[-17,105],[17,105],[21,86],[-21,86]])+' '+shape([[-18,80],[18,80],[11,67],[-11,67]]));
set(paddleEdge,'d',tpPath([point(-21,108),point(-25,84),point(-14,64)]));
}else{const d=tpPath(HOOK.map(([q,z])=>point(q,z)));set(hookU,'d',d);set(hookW,'d',d);}
set(driveMark,'transform',`rotate(${(phase*180/Math.PI).toFixed(1)})`);
set(batterSwirl,'transform',`rotate(${(phase*9).toFixed(1)})`);
set(batterPlane,'transform',TOP(BX,BY,86+(running()&&!reduced.matches?.45*Math.sin(phase*.3):0)));
const E=TP(BX,180,169),l=P(...at(86,27,a1).map((v,i)=>i===1?v+6:v)),r=P(...at(86,27,a0).map((v,i)=>i===1?v+6:v));
set(cone,'d',`M${E[0].toFixed(1)},${E[1].toFixed(1)} L${l[0].toFixed(1)},${l[1].toFixed(1)} L${r[0].toFixed(1)},${r[1].toFixed(1)} Z`);set(emit,'cx',E[0]);set(emit,'cy',E[1]+2);
}
let last=performance.now(),uiState='',ledKey='';
function tick(now){
const dt=Math.min((now-last)/1000,.04);last=now;const moving=Math.abs(angle-targetAngle)>.0005;
if(moving){angle=reduced.matches?targetAngle:angle+(targetAngle-angle)*(1-Math.exp(-dt*7));if(Math.abs(angle-targetAngle)<.002)angle=targetAngle;}
const run=running();
if(run&&!reduced.matches)phase+=dt*rpm[speed]*Math.PI/30;
if(dirty||moving||(run&&!reduced.matches)){if(reduced.matches)phase=-.3+speed*.19;drawRig();dirty=false;}
const blink=!reduced.matches&&Math.floor(now/180)%2;
const lk=LEDS.map((n,i)=>speed>i&&(run||blink||reduced.matches)?(i===4?'led hi':'led on'):'led').join('|');
if(lk!==ledKey){ledKey=lk;lk.split('|').forEach((c,i)=>set(LEDS[i],'class',c));}
if(motorG)motorG.gain.setTargetAtTime(run?.004+speed*.0016:0,ac.currentTime,.12),motor.frequency.setTargetAtTime(48+rpm[speed]*.35,ac.currentTime,.2);
const next=[speed,tool,locked,moving,run,targetAngle>.35,light,angle<.03].join('/');if(uiState!==next){updateUI();uiState=next;}
requestAnimationFrame(tick);
}
reduced.addEventListener('change',()=>{dirty=true;settle();});
drawRig();updateUI();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], draw }
