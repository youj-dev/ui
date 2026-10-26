// @ts-nocheck
/* ODALIN E–7 · Theremin. Drawn for this package in the lab figures' form: its stylesheet, defs and script,
 * on the engine's kit. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--wood:#9a6a42;--wood-top:#b9875a;--wood-side:#7b5232;--brass:#cfa95d;--brass-top:#e8c985;--brass-side:#ab8743;--chrome:#d9dad8;--chrome-top:#f4f4f2;--chrome-side:#bdbebc;--ceramic:#f3f1ea;--ceramic-side:#d9d5ca;--cloth:#e3d8bf;--weave:#c9b996;--cone:#9c8d70;--plate-ink:#4a3714;--vent:#563823;--screen:#1c1d1e;--phosphor:#8ff0b8;--grid:#6c8f80;--field:#4c62ff;--ring-a:.5;--warm:#ffb347}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--line:#444443;--wood:#815836;--wood-top:#ad7e54;--wood-side:#553720;--brass:#ae8e4d;--brass-top:#d9bc7c;--brass-side:#785e2d;--chrome:#b7b7b6;--chrome-top:#e4e4e2;--chrome-side:#858585;--ceramic:#e3e1db;--ceramic-side:#989692;--cloth:#bfb6a1;--weave:#a99b7e;--cone:#83765d;--plate-ink:#3d2d0f;--vent:#2f1e11;--screen:#161717;--phosphor:#a4f6c8;--grid:#5a786b;--field:#a7b3ff;--ring-a:1;--warm:#ffb04a}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.micro{font-size:2.1px;letter-spacing:.3px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.brass{fill:var(--brass)}.top.brass{fill:var(--brass-top)}.side.brass{fill:var(--brass-side)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.ceramic,.top.ceramic{fill:var(--ceramic)}.side.ceramic{fill:var(--ceramic-side)}
.grain{fill:none;stroke:var(--wood-side);stroke-width:.4;stroke-linecap:round;opacity:.32}.inlay{fill:none;stroke:var(--brass);stroke-width:.9;stroke-linecap:round}.string{fill:none;stroke:var(--brass);stroke-width:.6;opacity:.9}.vent .face{fill:var(--vent)}
.cloth{fill:url(#weave);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.cone{fill:var(--cone);opacity:.3;stroke:none}.cap{fill:var(--cone);opacity:.5;stroke:none}.bar{fill:none;stroke:var(--brass);stroke-width:1.15;stroke-linecap:round}.bar-edge{fill:none;stroke:var(--brass-side);stroke-width:1.6;stroke-linecap:round}
.plate{fill:var(--plate-ink);font:600 2.5px Georgia,'Times New Roman',serif;letter-spacing:.8px;stroke:none}
.scr{fill:var(--screen);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.grid{fill:none;stroke:var(--grid);stroke-width:.28;opacity:.55}.trace{fill:none;stroke:var(--phosphor);stroke-width:.55;stroke-linejoin:round;stroke-linecap:round}.trace-soft{stroke-width:1.7;opacity:.28;filter:url(#soft)}.scr-glow{fill:var(--phosphor);opacity:.06;stroke:none}.glint{fill:none;stroke:#fff;stroke-width:.7;stroke-linecap:round;opacity:.16}
.su,.sm,.shine{fill:none;stroke-linecap:round;stroke-linejoin:round}.su{stroke:var(--line)}.sm{stroke:var(--chrome)}.shine{stroke:#fff;opacity:.6}.spec{fill:#fff;opacity:.7;stroke:none}
.lamp{fill:var(--off);stroke:none}.lamp.g{fill:var(--ok);filter:url(#glow)}.lamp.w{fill:var(--warm);filter:url(#glow)}.knobmark{fill:none;stroke:var(--line);stroke-width:.75;stroke-linecap:round}
.ring{fill:url(#ringG);stroke:none}.hring{fill:none;stroke:var(--field);stroke-width:.75;vector-effect:non-scaling-stroke}.fline{fill:none;stroke:var(--field);stroke-width:.7;stroke-dasharray:1.4 1.6;stroke-linecap:round;vector-effect:non-scaling-stroke}.link{stroke-dasharray:.6 2}.hand{fill:var(--field);stroke:none}.tag{fill:var(--field);font:600 3.4px ui-monospace,monospace;letter-spacing:.3px;stroke:none}.handhalo{fill:url(#haloG);stroke:none}
.rotor{transition:transform .26s cubic-bezier(.2,.8,.3,1)}.press{transition:transform .12s}.press.down{transform:translate(.7px,-.4px)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
@media(prefers-reduced-motion:reduce){.rotor,.press{transition:none}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<pattern id="weave" width="1.5" height="1.5" patternUnits="userSpaceOnUse"><rect width="1.5" height="1.5" style="fill:var(--cloth)"/><path d="M0 .38H1.5M.38 0V1.5" style="stroke:var(--weave);stroke-width:.32"/></pattern>
<radialGradient id="ringG"><stop offset="0" style="stop-color:var(--field);stop-opacity:calc(var(--ring-a) * .14)"/><stop offset=".55" style="stop-color:var(--field);stop-opacity:calc(var(--ring-a) * .07)"/><stop offset=".84" style="stop-color:var(--field);stop-opacity:var(--ring-a)"/><stop offset=".93" style="stop-color:var(--field);stop-opacity:calc(var(--ring-a) * .45)"/><stop offset="1" style="stop-color:var(--field);stop-opacity:0"/></radialGradient>
<radialGradient id="haloG"><stop offset="0" style="stop-color:var(--field);stop-opacity:.55"/><stop offset=".45" style="stop-color:var(--field);stop-opacity:.22"/><stop offset="1" style="stop-color:var(--field);stop-opacity:0"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,addEventListener,kit}=env;
/* ODALIN E–7 theremin, seen from the audience: the player stands behind it, the pitch rod on their right (our left),
the volume loop on their left. World: x lower-right, y lower-left, z up.
Part                         x      y      z      w      d      h
legs (4), tapered       10/122  10/42     0   r 2.8 → 1.75   32   splayed 2.5 out, brass ferrules
apron                         4      4     32    124     44      4   brass
cabinet                       0      0     36    132     52     36   walnut; grille, plate, scope, vibrato knob, air button, lamp
lid                          -2     -2     72    136     56      4   grain, brass inlay under it
pitch rod                    12     14     76    r 1.1     –     93   brass disc, ceramic insulator, collar, chrome rod, ball tip
volume loop                 132     14   66.5   oval 20 × 13 around x 166, on a ceramic insulator in a brass plate
field              rings around the rod at the hand's height, rings rising from the loop to it, the hand between them
The hand lives in the plane y 14, near the player: its distance from the rod sets the pitch, its height above the loop the volume.
Painter order: shadow, legs, apron, cabinet, lid, front and side details, antenna, loop, field, hand, controls. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');const drawing=root;
const{C,P,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,box,cylinder,slits,screw,frame}=kit(()=>root);
const RX=1.2247,RY=.7071,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
// Round parts standing upright, drawn on the page plane so the drawing's box stays tight: a body tapering r0 → r1 and its top.
function post(a,b,r0,r1,cls){const w0=r0*RX,h0=r0*RY,w1=r1*RX,h1=r1*RY;
el('path',{d:`M${f2(a[0]-w0)},${f2(a[1])}A${f2(w0)},${f2(h0)} 0 0 0 ${f2(a[0]+w0)},${f2(a[1])}L${f2(b[0]+w1)},${f2(b[1])}A${f2(w1)},${f2(h1)} 0 0 0 ${f2(b[0]-w1)},${f2(b[1])}Z`,class:'face '+cls});
return el('ellipse',{cx:f2(b[0]),cy:f2(b[1]),rx:f2(w1),ry:f2(h1),class:'face top '+cls});}
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
function lit(n,c,base='lamp'){if(n._c!==c){n._c=c;set(n,'class',base+(c?' '+c:''));}}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
const ROD=12,PY=14,RZ=168.6,LZ=66.5,LX=166;
// Floor: the house ground shadow, a soft oval projected on the floor around the legs (sized so the dark pool stays in the frame).
const floor=[];for(let i=0;i<48;i++){const t=i/48*Math.PI*2;floor.push(P(66+76*Math.cos(t),26+30*Math.sin(t),0).map(f2).join(','));}
for(const c of['shadow stage-floor','stage-contact'])el('path',{d:'M'+floor.join('L')+'Z',class:c});
// Legs: tapered walnut, splayed a little, on brass ferrules; then the brass apron, the cabinet and its lid.
for(const[x,y,sx,sy]of[[10,10,-1,-1],[10,42,-1,1],[122,10,1,-1],[122,42,1,1]]){const xb=x+sx*2.5,yb=y+sy*2.5;post(P(xb,yb,0),P(xb,yb,3.6),1.55,1.7,'brass');post(P(xb,yb,3.6),P(x,y,32),1.75,2.8,'wood');}
box(4,4,32,124,44,4,1,'brass');box(0,0,36,132,52,36,2,'wood');box(-2,-2,72,136,56,4,1.6,'wood');
const lt=group(TOP(-2,-2,76));rect(lt,4.5,4.5,127,47,2.4,'string');for(const[v,b,u0,u1]of[[13,2.2,16,118],[24,-1.6,30,128],[37,1.8,8,104],[46,-1.2,40,122]])el('path',{d:`M${u0},${v}C${u0+30},${v+b} ${u1-34},${v-b*1.4} ${u1},${v+b*.4}`,class:'grain'},lt);
const fr=group(FRONT(0,52,72)),sd=group(SIDE(132,52,72));line(fr,3,1.4,129,1.4,'inlay');line(sd,3,1.4,49,1.4,'inlay');
// Front: the speaker behind a cloth grille with three brass bars, the name plate, the scope, vibrato knob, air button, lamp.
rect(fr,6.6,4.4,53,25.6,3.2,'face recess');rect(fr,8.2,6,49.8,22.4,2.4,'cloth');
const cone=group('translate(33.1 17.2)',fr);circle(cone,0,0,9.2,'cone');circle(cone,0,0,2.9,'cap');
for(const v of[10.6,17.2,23.8]){line(fr,8.6,v+.35,57.6,v+.35,'bar-edge');line(fr,8.6,v,57.6,v,'bar');}
rect(fr,21.1,30.9,24,3.9,.8,'face brass');text(fr,33.1,33.75,'ODALIN','plate center');
const sc=cylinder(86,52,54.6,12.4,1.8,'y','brass').face;circle(sc,0,0,10.9,'face recess');circle(sc,0,0,9.9,'scr');circle(sc,0,0,9.9,'scr-glow');
const gr=el('g',{},sc);line(gr,-8.6,0,8.6,0,'grid');line(gr,0,-8.6,0,8.6,'grid');for(const x of[-6,-3,3,6])line(gr,x,-.7,x,.7,'grid');for(const y of[-6,-3,3,6])line(gr,-.7,y,.7,y,'grid');
const traceSoft=el('path',{class:'trace trace-soft'},sc),trace=el('path',{class:'trace'},sc);el('path',{d:'M-7.2,-4.2A8.4,8.4 0 0 1 -3,-7.9',class:'glint'},sc);
const kb=cylinder(110,52,59.2,4.7,2.8,'y','brass').face;circle(kb,0,0,3.8,'face top brass');const rotor=group('rotate(0)',kb,{class:'rotor'});line(rotor,0,-1.1,0,-3.3,'knobmark');
text(fr,110,21.2,'VIBRATO','etch micro center');
const airG=el('g',{class:'press'});root=airG;const ab=cylinder(110,52,44.4,2.9,1.5,'y','brass').face;root=drawing;circle(ab,0,0,2.1,'face top brass');
text(fr,110,32.9,'AIR','etch micro center');
circle(fr,123.4,12.8,2.3,'face brass');const lamp=circle(fr,123.4,12.8,1.35,'lamp');lamp._c='';
// Side: vents for the little amplifier inside, the loop's brass plate and ceramic insulator.
slits(el('g',{class:'vent'},sd),6,12,15,17,5,false);rect(sd,31.4,1,13.2,9.6,1.2,'face brass');for(const[u,v]of[[33.2,2.8],[42.8,2.8],[33.2,8.8],[42.8,8.8]])screw(sd,u,v);
cylinder(132.2,PY,LZ,2.7,4.3,'x','ceramic');
// The pitch antenna on the lid: brass disc, ceramic insulator, brass collar, the chrome rod and its ball.
cylinder(ROD,PY,76,5,1.4,'z','brass');post(P(ROD,PY,77.4),P(ROD,PY,84.6),3.1,2.6,'ceramic');for(const[z,r]of[[79.8,2.95],[82.2,2.78]]){const c=P(ROD,PY,z),w=r*RX;el('path',{d:`M${f2(c[0]-w)},${f2(c[1])}A${f2(w)},${f2(r*RY)} 0 0 0 ${f2(c[0]+w)},${f2(c[1])}`,class:'detail'});}
post(P(ROD,PY,84.6),P(ROD,PY,86.8),2.15,2.15,'brass');post(P(ROD,PY,86.8),P(ROD,PY,RZ),1.15,1,'chrome');const r0=P(ROD,PY,88),r1=P(ROD,PY,RZ-1);el('path',{d:`M${f2(r0[0]-.4)},${f2(r0[1])}V${f2(r1[1])}`,class:'shine','stroke-width':.4});
const tip=P(ROD,PY,RZ+1.5);circle(root,tip[0],tip[1],1.9,'face top chrome');circle(root,tip[0]-.6,tip[1]-.6,.55,'spec');
// The volume loop: a chrome tube bent into an oval, both ends in the insulator.
const loop=[[136.4,PY-2.4,LZ],[143,PY-3.4,LZ]];for(let a=-160;a<=160;a+=16){const t=a*Math.PI/180;loop.push([LX+20*Math.cos(t),PY+13*Math.sin(t),LZ]);}loop.push([143,PY+3.4,LZ],[136.4,PY+2.4,LZ]);
const ld=smooth(loop);el('path',{d:ld,class:'su','stroke-width':3.2});el('path',{d:ld,class:'sm','stroke-width':2.4});el('path',{d:ld,class:'shine','stroke-width':.5});
// The field: soft rings around the rod at the hand's height, rings rising from the loop to it, the line from the rod to the hand.
const rings=[0,1,2,3].map(()=>el('ellipse',{class:'ring'})),cols=[0,1,2,3].map(()=>el('ellipse',{class:'ring'}));
const level=el('ellipse',{class:'hring'}),fline=el('path',{class:'fline'}),link=el('path',{class:'fline link'});
const halo=el('circle',{r:8,class:'handhalo'}),hand=el('circle',{r:1.6,class:'hand'}),handRing=el('circle',{r:3.1,class:'hring'}),tag=text(drawing,0,0,'A4','tag');tag._t='A4';
// Controls on top: the rod plays a note, the knob steps the vibrato, the button plays the air.
const rodBtn=button(el('g',{}),{'aria-label':'Play a note (Space)'}),rb=P(ROD,PY,76),rt=P(ROD,PY,RZ+4);
el('rect',{x:f2(rb[0]-6.5),y:f2(rt[1]-1),width:13,height:f2(rb[1]-rt[1]+4),rx:6.5,class:'hit'},rodBtn);el('rect',{x:f2(rb[0]-7.5),y:f2(rt[1]-2),width:15,height:f2(rb[1]-rt[1]+6),rx:7.5,class:'focus-ring'},rodBtn);
const vibBtn=button(el('g',{}),{'aria-label':'Vibrato (V)'}),vq=group(FRONT(110,54.8,59.2),vibBtn);circle(vq,0,0,6.2,'hit');circle(vq,0,0,7,'focus-ring');
const airBtn=button(el('g',{}),{'aria-label':'Play the air (M)'}),aq=group(FRONT(110,53.5,44.4),airBtn);circle(aq,0,0,4.8,'hit');circle(aq,0,0,5.6,'focus-ring');
frame([[-2,-2,0,136,56,76],[10,12,76,4,4,96],[189.9,14,66,0,0,0],[130,50,0,0,0,0]],10);

// State: the hand's pitch (semitones, C3–C6) and volume, set by the pointer, the arrows and the air; vibrato; holds.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),night=matchMedia('(prefers-color-scheme: dark)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const NAMES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'],SAID=['C','C sharp','D','D sharp','E','F','F sharp','G','G sharp','A','A sharp','B'];
const VIB=[{n:'LIGHT',d:.0045,w:.5,a:0},{n:'WIDE',d:.012,w:1,a:60},{n:'OFF',d:0,w:0,a:-60}];
// The air: an original tune in A minor, note, beats and volume; it ends where the theremin rests, on A4 at volume 60.
const TUNE=[[64,1,52],[69,1,62],[72,.5,66],[71,.5,64],[76,2,80],[74,.5,70],[72,.5,66],[71,1,60],[67,.5,54],[69,2.5,60]],BEAT=.6;
const D0=6,D1=138,S0=48,S1=84,Z0=70,ZS=96;
const hz=n=>440*Math.pow(2,(n-69)/12),dOf=n=>D0+(S1-n)/(S1-S0)*(D1-D0),sOf=d=>clamp(S1-(Math.abs(d)-D0)/(D1-D0)*(S1-S0),S0,S1),zOf=n=>Z0+n/100*ZS,vOf=z=>clamp((z-Z0)/ZS*100,0,100);
const nameOf=n=>{const m=Math.round(n);return NAMES[m%12]+(Math.floor(m/12)-1);},spoken=()=>{const m=Math.round(setS);return`${SAID[m%12]} ${Math.floor(m/12)-1}, ${Math.round(hz(setS))} hertz, volume ${Math.round(setV)}`;};
let setS=69,setV=60,s=69,v=60,side=1,vi=0,ptr=null,hold=false,holdUntil=-1e9,tapUntil=-1e9,auto=false,autoAt=0,pressT=-1e9,airDown=false,pp=.35,pv=.35,glow=.3,last=0,flash='',flashT=0,shownR='',shownS='',uiAt=-1e9,coneK='',drawn='';
const say=m=>{announcement.textContent=m;},note=(m,ms=1400)=>{flash=m;flashT=performance.now()+ms;};
// Sound, after a gesture: one sine with a vibrato LFO on its frequency, gliding to the hand.
let ac=null,osc=null,amp=null,depth=null,aF=-1,aG=-1,aD=-1;
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();osc=ac.createOscillator();osc.type='sine';osc.frequency.value=hz(s);const lfo=ac.createOscillator();lfo.frequency.value=5.6;depth=ac.createGain();depth.gain.value=0;lfo.connect(depth);depth.connect(osc.frequency);amp=ac.createGain();amp.gain.value=0;const out=ac.createGain();out.gain.value=.5;osc.connect(amp);amp.connect(out);out.connect(ac.destination);osc.start();lfo.start();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch{}}
function sound(on){if(!ac)return;try{const t=ac.currentTime,f=hz(s),g=on?.12*Math.pow(v/100,1.6):0,d=f*VIB[vi].d;if(Math.abs(f-aF)>.05){aF=f;osc.frequency.setTargetAtTime(f,t,.02);}if(Math.abs(g-aG)>.0004){aG=g;amp.gain.setTargetAtTime(g,t,on?.04:.07);}if(Math.abs(d-aD)>.02){aD=d;depth.gain.setTargetAtTime(d,t,.08);}}catch{}}
function tuneAt(t,red){let a=0;for(let i=0;i<TUNE.length;i++){const[n,b,vol]=TUNE[i],L=b*BEAT;if(t<a+L){const u=t-a,end=i===TUNE.length-1;return{s:n,v:red?vol:vol*(u<.14?.72+.28*u/.14:!end&&u>L-.09?.8:1)};}a+=L;}return null;}
function nudge(ds,dv){audio();auto=false;ptr=null;if(ds)setS=clamp(Math.round(setS)+ds,S0,S1);if(dv)setV=clamp(Math.round(setV/10)*10+dv,0,100);side=1;tapUntil=performance.now()+380;say(spoken()+'.');}
function holdOn(){audio();auto=false;if(setV<10)setV=60;hold=true;holdUntil=performance.now()+450;say(`Holding ${spoken()}.`);}
function tap(){audio();auto=false;if(setV<10)setV=60;tapUntil=performance.now()+650;say(spoken()+'.');}
function vibrato(){audio();vi=(vi+1)%3;set(rotor,'transform',`rotate(${VIB[vi].a})`);note(vi===2?'VIBRATO OFF · PURE SINE':`VIBRATO ${VIB[vi].n} · 5.6 HZ`);say(`Vibrato ${VIB[vi].n.toLowerCase()}.`);}
function air(){audio();ptr=null;hold=false;side=1;auto=true;autoAt=pressT=performance.now();say('It plays a short original air by itself.');}
bind(rodBtn,tap);bind(vibBtn,vibrato);bind(airBtn,air);
const act={ArrowLeft:()=>nudge(-1,0),ArrowRight:()=>nudge(1,0),ArrowUp:()=>nudge(0,10),ArrowDown:()=>nudge(0,-10),v:vibrato,m:air};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.length===1?e.key.toLowerCase():e.key;
if(k===' '){if(e.target&&e.target.closest&&e.target.closest('button,[role=button]'))return;e.preventDefault();if(!e.repeat)holdOn();return;}
const fn=act[k];if(fn){e.preventDefault();if(!e.repeat||k.startsWith('Arrow'))fn();}});
document.addEventListener('keyup',e=>{if(e.key===' ')hold=false;});
addEventListener('blur',()=>{hold=false;ptr=null;});
// The pointer is the hand: a point on the drawing is read in the plane y 14, as a distance from the rod and a height.
function local(e){const m=svg.getScreenCTM?.();if(!m)return null;const det=m.a*m.d-m.b*m.c;if(!det)return null;const x=e.clientX-m.e,y=e.clientY-m.f;return[(m.d*x-m.c*y)/det,(-m.b*x+m.a*y)/det];}
function onPointer(e){const q=local(e);if(!q)return;const x=q[0]/C+PY,z=(x+PY)/2-q[1],d=x-ROD;ptr={s:sOf(d),v:vOf(z)};side=d<0?-1:1;setS=ptr.s;setV=ptr.v;auto=false;}
const leave=()=>{ptr=null;};
svg.addEventListener('pointermove',onPointer);svg.addEventListener('pointerdown',e=>{audio();onPointer(e);});svg.addEventListener('pointerleave',leave);svg.addEventListener('pointercancel',leave);svg.addEventListener('pointerup',e=>{if(e.pointerType==='touch')leave();});
function ui(now,on){const vn=VIB[vi].n,st=now<flashT?flash:auto?'AIR · PLAYING BY ITSELF':hold||now<holdUntil?`HOLD · VIBRATO ${vn}`:ptr?(on?`PLAYING · VIBRATO ${vn}`:'MUTED · HAND AT THE LOOP'):now<tapUntil?`NOTE · VIBRATO ${vn}`:'READY · HOVER OR HOLD SPACE';
const ro=`${nameOf(s)} · ${Math.round(hz(s))} HZ · VOL ${Math.round(v)}`;if(st!==shownS||(ro!==shownR&&now-uiAt>90)){shownS=st;shownR=ro;uiAt=now;readout.textContent=ro;stateLabel.textContent=st;}}
function tick(now){const dt=last?clamp((now-last)/1000,0,.05):0,red=reduced.matches;last=now;let ts=setS,tv=setV,on=false;
if(auto){const n=tuneAt((now-autoAt)/1000,red);if(n){ts=n.s;tv=n.v;on=true;}else{auto=false;setS=ts=69;setV=tv=60;say('The air is over.');}}
if(!auto)on=hold||now<holdUntil||now<tapUntil||!!(ptr&&ptr.v>.5);
if(red||!dt){s=ts;v=tv;}else{s+=(ts-s)*(1-Math.exp(-dt*(auto?10:16)));v+=(tv-v)*(1-Math.exp(-dt*10));}
const want=Math.min(1,(on?.42+.58*v/100:ptr?.16:.32)*(night.matches?1.5:1));glow=red||!dt?want:glow+(want-glow)*(1-Math.exp(-dt*6));
const k=(s-S0)/(S1-S0),tsec=now/1000;if(red){pp=.35;pv=.35;}else{pp=(pp+dt*(on?.35+1.5*k:.1))%1;pv=(pv+dt*(on?.45:.08))%1;}
// With reduced motion nothing moves between states: draw only when the state changes.
const sig=red?[f2(s),f2(v),f2(glow),side,on].join():'';if(!red||sig!==drawn){drawn=sig;
const wob=on&&!red?VIB[vi].w*1.5*Math.sin(tsec*5.6*Math.PI*2):0,dh=dOf(s),xh=ROD+side*dh+wob,zh=zOf(v),H=P(xh,PY,zh),zc=clamp(zh,96,150),rc=P(ROD,PY,zc),RM=clamp(dh,12,30);
rings.forEach((n,i)=>{const t=(i+pp)/4,r=4+(RM-4)*t;set(n,'cx',f2(rc[0]));set(n,'cy',f2(rc[1]));set(n,'rx',f2(r*RX));set(n,'ry',f2(r*RY));set(n,'opacity',f2(glow*Math.sin(Math.PI*t)));});
cols.forEach((n,j)=>{const t=(j+pv)/4,c=P(LX,PY,LZ+(zh-LZ)*t),r=11.5-5*t;set(n,'cx',f2(c[0]));set(n,'cy',f2(c[1]));set(n,'rx',f2(r*RX));set(n,'ry',f2(r*RY));set(n,'opacity',f2(glow*.95*Math.sin(Math.PI*t)));});
const lc=P(LX,PY,zh);set(level,'cx',f2(lc[0]));set(level,'cy',f2(lc[1]));set(level,'rx',f2(7.5*RX));set(level,'ry',f2(7.5*RY));set(level,'opacity',f2(clamp(glow*1.5)));
set(fline,'d',`M${f2(rc[0])},${f2(rc[1])}L${f2(H[0])},${f2(H[1])}`);set(fline,'opacity',f2(clamp(glow*1.6)));set(link,'d',`M${f2(H[0])},${f2(H[1])}L${f2(lc[0]-7.5*RX)},${f2(lc[1])}`);set(link,'opacity',f2(clamp(glow*.9)));
for(const n of[halo,hand,handRing]){set(n,'cx',f2(H[0]));set(n,'cy',f2(H[1]));}set(halo,'opacity',f2(glow*.7));const nn=nameOf(s);if(tag._t!==nn){tag._t=nn;tag.textContent=nn;}set(tag,'x',f2(H[0]+(side<0?-11.5:4.4)));set(tag,'y',f2(H[1]-3.6));set(tag,'opacity',f2(clamp(.4+glow)));set(hand,'opacity',f2(clamp(.35+glow)));set(handRing,'opacity',f2(clamp(glow*1.4)));
const cyc=1.2+3.4*k,a=on?.9+4.2*v/100:.75,ph=red?0:tsec*3,vw=on&&!red?VIB[vi].w*.05*Math.sin(tsec*5.6*Math.PI*2):0;let d='';
for(let i=0;i<=40;i++){const x=-7.6+15.2*i/40;d+=(i?'L':'M')+f2(x)+','+f2(-a*Math.sin(Math.PI*2*cyc*(1+vw)*i/40+ph));}set(trace,'d',d);set(traceSoft,'d',d);set(trace,'opacity',on?'1':'.55');
const ck=on&&!red?f2(1+.05*v/100*(.5+.5*Math.sin(tsec*5.6*Math.PI*2))):'1.00';if(ck!==coneK){coneK=ck;set(cone,'transform',`translate(33.1 17.2) scale(${ck})`);}}
lit(lamp,on?'w':'g');const down=now-pressT<170;if(down!==airDown){airDown=down;airG.classList.toggle('down',down);}
sound(on);ui(now,on);requestAnimationFrame(tick);}
tick(performance.now());
}

export const figure: FigureModule = { css, defs, hints: [], draw }
