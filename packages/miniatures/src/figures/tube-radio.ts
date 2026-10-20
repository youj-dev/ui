// @ts-nocheck
/* ALDERVOSS W–58 · Valve radio. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--wood:#b98a5c;--wood-top:#d4a876;--wood-side:#97693f;--slab:#a87a4e;--cloth:#e2d2aa;--weave:#c2ad80;--brass:#cfa95d;--brass-top:#e8c985;--brass-side:#ab8743;--ivory:#efe7d2;--ivory-top:#fbf6e8;--ivory-side:#d6ccb2;--dial:#efe6cd;--print:#5e5240;--print-act:#1e170e;--lamp:#ffb03e;--needle:#d2361c;--eye:#2ee07f;--heat:#ff7a1c;--inner:#6f5b45;--inner-top:#806a52;--metal:#c9cbcb;--metal-top:#e1e2e2;--metal-side:#b2b5b5;--plate:#7d8186;--env:#ffffff;--getter:#8c9095;--cord:#6b4a30;--off:#b3b3af;--bake:#5b3a24;--bake-top:#74503a;--bake-side:#45291a}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--wood:#9b734c;--wood-top:#c69d6e;--wood-side:#69482a;--slab:#8d6640;--cloth:#beb18f;--weave:#a3916b;--brass:#ae8e4d;--brass-top:#d9bc7c;--brass-side:#785e2d;--ivory:#c9c3b1;--ivory-top:#ebe6d9;--ivory-side:#97907d;--dial:#c9c2ac;--print:#4e4434;--print-act:#16120c;--lamp:#ffa933;--needle:#b12c16;--eye:#3dff95;--heat:#ff7a1c;--inner:#5c4b39;--inner-top:#77634c;--metal:#a9abab;--metal-top:#d2d3d3;--metal-side:#7e7f7f;--plate:#696c6f;--env:#d7d7d7;--getter:#76787c;--cord:#593d27;--off:#969694;--bake:#4b2f1d;--bake-top:#6c4a36;--bake-side:#2e1a0f;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:4.4px;letter-spacing:1.1px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.slab{fill:var(--slab)}.top.slab{fill:var(--wood-top)}.side.slab{fill:var(--wood-side)}.brass{fill:var(--brass)}.top.brass{fill:var(--brass-top)}.side.brass{fill:var(--brass-side)}.ivory{fill:var(--ivory)}.top.ivory{fill:var(--ivory-top)}.side.ivory{fill:var(--ivory-side)}.inner{fill:var(--inner)}.top.inner{fill:var(--inner-top)}.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.plate{fill:var(--plate)}.bake{fill:var(--bake)}.top.bake{fill:var(--bake-top)}.side.bake{fill:var(--bake-side)}.ridge{stroke:var(--brass-top);stroke-width:.5;opacity:.55}.env{fill:var(--env);fill-opacity:.2}.getter{fill:var(--getter);stroke:none;opacity:.9}
.grain{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.28}.cloth{fill:url(#weave)}.dial{fill:var(--dial)}.dark-ink{fill:#2a2118}
.print{fill:var(--print);font:2.35px ui-monospace,monospace;letter-spacing:.1px;stroke:none;transition:fill .6s}.print.act{fill:var(--print-act);font-weight:700}.tick{stroke:var(--print);stroke-width:.3;fill:none;transition:stroke .6s}.lit .print{fill:#5a4122}.lit .print.act{fill:#1c1206}.lit .tick{stroke:#5a4122}
.backlight{fill:url(#dialG);opacity:0}.halo{fill:var(--lamp);opacity:0;filter:url(#bloom);pointer-events:none}.bulb{fill:var(--lamp);opacity:0;filter:url(#glow)}.needle{fill:var(--needle);stroke:none}
.eyeg{fill:var(--eye);opacity:0;filter:url(#glow)}.eyeh{fill:var(--eye);opacity:0;filter:url(#bloom);pointer-events:none}.wedge{fill:#0b0d0b;stroke:none}.eyeglass{fill:#0c0f0d}
.fil{fill:var(--heat);opacity:0;filter:url(#glow)}.fh{fill:var(--heat);opacity:0;filter:url(#bloom);pointer-events:none}
.cu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.cb{fill:none;stroke:var(--cord);stroke-linecap:round;stroke-linejoin:round}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.key:hover .top.ivory{fill:#fff}.knob:hover .top.bake{fill:var(--bake-side)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<pattern id="weave" width="2.2" height="2.2" patternUnits="userSpaceOnUse"><rect width="2.2" height="2.2" style="fill:var(--cloth)"/><path d="M0,1.1H2.2M1.1,0V2.2" style="stroke:var(--weave);stroke-width:.45"/><path d="M0,0L2.2,2.2" style="stroke:var(--weave);stroke-width:.2;opacity:.6"/></pattern>
<linearGradient id="dialG"><stop offset="0" style="stop-color:var(--lamp);stop-opacity:1"/><stop offset=".14" style="stop-color:var(--lamp);stop-opacity:.62"/><stop offset=".5" style="stop-color:var(--lamp);stop-opacity:.48"/><stop offset=".86" style="stop-color:var(--lamp);stop-opacity:.62"/><stop offset="1" style="stop-color:var(--lamp);stop-opacity:1"/></linearGradient>
<radialGradient id="eyeR"><stop offset=".3" style="stop-color:var(--eye)"/><stop offset="1" style="stop-color:var(--eye);stop-opacity:.55"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* ALDERVOSS W–58 valve radio. World: x lower-right; y lower-left; z up. 1 unit ≈ 2.5 mm.
Part x y z w d h
feet (4) 16/184 12/74 0 r4.5 – 6
cabinet 0 0 6 200 86 126
front slab 6 86 12 188 3 112 (face plane y 89; slab-local u = x−6, v = 124−z)
dial bezel + glass 14 89 85 172 0 32
brass trim 14 89 79.4 172 0 1.6
grille frame + cloth 14 89 25 106 0 50
key well 12.5 89 13 109 0 10.6
band keys (5) 14–112.4 89 14 19.6 4.5 7.4
right panel 128 89 14 58 0 61
magic eye 157 89 63 r9 2.4 –
volume knob 142 89 32 r9 7 –
tuning knob 172 89 32 r10.5 7 –
rear side vent 200 14–64 34 0 50 64
back panel (inside) 100 3 30 100 0 100
chassis (inside) 112 3 26 85 80 4
transformer (inside) 138 4 30 22 20 20
filter can (inside) 172 28 30 r5 – 22
valves (inside) x 170/186 y 8–41 30 r4–4.6 – 22–30
mains cord + plug 200 10 34 → 272 −30 0
Grain, screws, print and labels share their parent face. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers.
const draw=root,defs=svg.querySelector('defs'),into=g=>root=g;
const f2=v=>v.toFixed(2);
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
const sp=(x,y,z,rx,ry,cls)=>{const p=P(x,y,z);return el('ellipse',{cx:f2(p[0]),cy:f2(p[1]),rx,ry,class:cls});};
const BANDS=[
{k:'LW',lo:150,hi:285,dp:0,u:'kHz',st:[[.12,'KALUNDBORG'],[.33,'MOTALA'],[.53,'LUXEMBOURG'],[.73,'DROITWICH'],[.9,'ALLOUIS']]},
{k:'MW',lo:520,hi:1610,dp:0,u:'kHz',st:[[.08,'WIEN'],[.25,'ROMA'],[.43,'PARIS'],[.6,'PRAHA'],[.77,'HILVERSUM'],[.93,'OSLO']]},
{k:'SW',lo:5.9,hi:21.8,dp:2,u:'MHz',st:[[.1,'LISBOA'],[.29,'CAIRO'],[.5,'DELHI'],[.69,'QUITO'],[.88,'TOKYO']]},
{k:'FM',lo:87.5,hi:108,dp:1,u:'MHz',st:[[.11,'KIEL'],[.3,'BREMEN'],[.49,'HAMBURG'],[.68,'HANNOVER'],[.87,'LÜBECK']]}];
// Shadow, mains cord on the table, feet, cabinet.
const shp=P(112,46,0);el('ellipse',{cx:shp[0]+6,cy:shp[1]+4,rx:150,ry:52,class:'shadow stage-floor'});el('ellipse',{cx:shp[0]+6,cy:shp[1]+4,rx:150,ry:52,class:'stage-contact'});
for(const[x,y]of[[16,12],[184,12],[16,74],[184,74]])cylinder(x,y,0,4.5,6,'z','recess');
box(0,0,6,200,86,126,8,'wood');
const lid=group(TOP(0,0,132));
for(let i=0;i<7;i++){const v=10+i*10.6,w=i%2?2.4:-1.8;el('path',{d:`M8,${v} C60,${v+w} 110,${v-w*1.4} 192,${v+w*.6}`,class:'grain'},lid);}
rect(lid,4,4,192,78,8,'detail');
// Rear vent on the +x side: interior (back panel, chassis, transformer, valves) clipped to the opening.
const sideF=group(SIDE(200,86,132));
for(let i=0;i<5;i++){const v=14+i*22,w=i%2?1.8:-1.4;el('path',{d:`M4,${v} C30,${v+w} 52,${v-w} 82,${v+w*.5}`,class:'grain'},sideF);}
const VENT=[22,34,50,64];
const vc=el('clipPath',{id:'vent'},defs);rect(vc,...VENT,5,'').setAttribute('transform',SIDE(200,86,132));
const IN=into(el('g',{'clip-path':'url(#vent)'},draw));
rect(group(FRONT(100,3,130)),0,0,100,100,0,'face inner');
const bp=group(FRONT(100,3,130));for(let r=0;r<6;r++)for(let c=0;c<9;c++)circle(bp,8+c*10.5+(r%2)*5,8+r*11,1.6,'face recess');
box(112,3,26,85,80,4,1,'metal');
box(138,4,30,22,20,20,1.5,'plate');const tf=group(FRONT(138,24,50));for(let k=1;k<10;k++)line(tf,1,k*2,21,k*2);box(141,6,50,16,16,3,1,'bake');
const ht=[];
function valve(x,y,h,r){
ellipse(x,y,30.1,r+1.4,'z','face base');
cylinder(x,y,30,r*.92,3,'z','base');
ht.push({h:sp(x,y,33+h*.42,9,9,'fh'),k:.85+Math.random()*.3});
box(x-r*.42,y-r*.5,35,r*.84,r*1,h*.42,.4,'plate');
ht.push({h:sp(x+r*.2,y+r*.2,35+h*.24,1.1,2.4,'fil'),k:.9+Math.random()*.2});
const env=cylinder(x,y,33,r,h-3,'z','env');
circle(env.face,0,0,r*.72,'getter');circle(env.face,0,0,r*.2,'face top');
el('path',{d:poly([[x+r*.5,y+r*.86,35],[x+r*.5,y+r*.86,30+h-4]]),class:'detail',opacity:.5});
}
valve(170,12,22,4);
cylinder(172,28,30,5,22,'z','metal');ellipse(172,28,52,3.4,'z','detail');
for(const[y,h,r]of[[8,26,4.4],[19,30,4.6],[30,24,4.2],[41,25,4.2]])valve(186,y,h,r);
into(draw);
const sideV=group(SIDE(200,86,132));
const vf=rect(sideV,...VENT,5,'detail');vf.style.strokeWidth='2.6';vf.style.stroke='var(--brass-side)';
rect(sideV,VENT[0]-1.4,VENT[1]-1.4,VENT[2]+2.8,VENT[3]+2.8,6,'detail');
for(let i=1;i<5;i++){rect(sideV,VENT[0]+i*10-.8,VENT[1],1.6,VENT[3],.8,'face brass');}
const ventHalo=el('ellipse',{cx:0,cy:0,rx:40,ry:30,class:'fh'});{const p=P(200,40,66);set(ventHalo,'cx',f2(p[0]));set(ventHalo,'cy',f2(p[1]));}
rect(sideF,8,104,28,12,1.2,'face ivory');text(sideF,22,108.6,'W–58 · 220 V~','etch micro center');text(sideF,22,112.4,'45 W · 50 Hz','etch micro center');
for(const[u,v]of[[6,6],[80,6],[6,120],[80,120]])screw(sideF,u,v);
circle(sideF,74,102,3.2,'face recess');circle(sideF,74,102,1.9,'face base');
// Front slab: dial, trim, grille, key well, control panel.
box(6,86,12,188,3,112,6,'slab');
const fs=group(FRONT(6,89,124));
rect(fs,2.5,2.5,183,107,4.5,'detail');
const halo=rect(fs,10,9,168,28,6,'halo');
rect(fs,8,7,172,32,5,'face brass');rect(fs,9.6,8.6,168.8,28.8,4,'detail');
const DG=group('',fs);rect(DG,10.5,9.5,167,27,3.5,'face dial');
const back=rect(DG,10.5,9.5,167,27,3.5,'backlight');
const bulbs=[13.6,174.4].map(u=>circle(DG,u,23,1.6,'bulb'));
const rows=[];
BANDS.forEach((b,bi)=>{const r=3-bi,v=15.6+r*6.2,g=group('',DG);
text(g,13.2,v+.8,b.k,'print');line(g,24,v+1.2,172,v+1.2,'tick');
for(let k=0;k<=20;k++)line(g,24+k*7.4,v+1.2,24+k*7.4,v+(k%5?.5:-.2),'tick');
const ns=b.st.map(([p,n])=>text(g,24+p*148,v-.7,n,'print center'));
rows.push({g,ns,lab:g.firstChild});});
text(DG,98,35.4,'ALDERVOSS · W–58','print center');
const needle=group('',DG);rect(needle,-.45,10.6,.9,24.6,.3,'needle');rect(needle,-1.2,9.6,2.4,1.6,.4,'face base');
rect(DG,10.5,9.5,167,27,3.5,'detail');el('path',{d:'M30,9.8 L44,9.8 L36,36.2 L22,36.2Z',fill:'#fff',opacity:.18},DG);
rect(fs,8,43.4,172,1.6,.8,'face brass');
rect(fs,8,49,106,50,4,'face recess');rect(fs,10.5,51.5,101,45,3,'face cloth');
for(const v of[62,85.5])rect(fs,10.5,v,101,1.1,.5,'face brass');
rect(fs,38,69.6,46,8.8,1.8,'face brass');rect(fs,39.4,71,43.2,6,1.2,'detail');text(fs,61,75.7,'ALDERVOSS','label brand center dark-ink');
rect(fs,6.5,101,109,10.6,2,'face recess');
rect(fs,122,49,58,61,4,'face ivory');rect(fs,124,51,54,57,3,'detail');
text(fs,136,78.4,'VOLUME','etch micro center');text(fs,166,77.4,'TUNING','etch micro center');
for(const u of[126.5,175.5])screw(fs,u,53.5);
// Magic eye.
const eyeB=cylinder(157,89,63,10,2.6,'y','brass').face;
circle(eyeB,0,0,8.5,'face recess');circle(eyeB,0,0,7.8,'eyeglass');
const eyeH=circle(eyeB,0,0,10,'eyeh');const eyeG=circle(eyeB,0,0,7.1,'eyeg');set(eyeG,'fill','url(#eyeR)');
const wedge=el('path',{class:'wedge'},eyeB);circle(eyeB,0,0,2.7,'face base');circle(eyeB,0,0,1.3,'detail');
el('path',{d:'M-5.4,-4 A6.8,6.8 0 0 1 -1.3,-6.6',class:'detail',stroke:'#fff',opacity:.5},eyeB);
// Band keys: OFF, LW, MW, SW, FM. Interlocking: one band key stays down.
const KEYS=['OFF','LW','MW','SW','FM'].map((n,i)=>{
const g=el('g',{class:'control key',role:'button',tabindex:'0'});into(g);
const x=14+i*21.2;box(x,89,14,19.6,4.5,7.4,1.6,'ivory');
const kf=group(FRONT(x,93.5,21.4));text(kf,9.8,4.9,n,'label micro center');if(i===0)circle(kf,3.2,3.7,.9,'face recess');
rect(kf,-1.2,-1.2,22,9.8,2,'focus-ring');rect(kf,0,-6,19.6,13.4,0,'hit');into(draw);
return{g,i,o:0,to:0,v:0};});
// Knobs: volume (also cycles on click) and tuning (click seeks).
function knob(x,r,name){
const g=el('g',{class:'control knob',role:'button',tabindex:'0'});into(g);
const k=cylinder(x,89,32,r,7,'y','bake');
const rot=group('',k.face);for(let i=0;i<28;i++){const a=i*Math.PI/14;line(rot,Math.cos(a)*(r-1.8),Math.sin(a)*(r-1.8),Math.cos(a)*(r-.4),Math.sin(a)*(r-.4),'detail ridge');}
line(rot,0,-r*.36,0,-r*.78,'detail ridge');circle(rot,0,-r*.64,.8,'face ivory');
circle(k.face,0,0,r*.34,'face brass top');circle(k.face,0,0,r*.34+1.2,'detail');
circle(k.face,0,0,r+1.6,'focus-ring');into(draw);set(g,'aria-label',name);return{g,rot};}
const VOL=knob(142,9,'Volume knob: step the volume up (Up and Down arrows)'),TUNE=knob(172,10.5,'Tuning knob: seek the next station (S); tune with Left and Right arrows');
// Mains cord out of the side grommet to a plug on the table.
const cordD=smooth([[200,16,30],[207,16,28],[213,14,18],[215,10,6],[222,4,1.2],[238,-8,1.2],[252,-12,1.2],[262,-22,1.2]]);
el('path',{d:cordD,class:'cu','stroke-width':3.4});el('path',{d:cordD,class:'cb','stroke-width':2.2});
box(258,-34,0,8,12,5,1.6,'base');for(const y of[-37,-31])box(259.8,y,1.4,1,1,1.6,.3,'metal');
const plf=group(FRONT(258,-22,5));line(plf,1.6,1.4,6.4,1.4);line(plf,1.6,2.8,6.4,2.8);
frame([[0,0,0,200,97,132],[200,-38,0,72,54,8]],10);
// State: power keys, warm-up, tuning, AFC, magic eye, audio.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
let on=false,band=1,lastBand=1,f=.39,vol=6,heat=0,lamp=0,aud=0,tDir=0,seek=null,lastT=0,lastUI=0,lastFx=0,locked=-1,flick=0,ac=null,master,sG,nG,wO,wG,hG,prog=null;
function say(m){announcement.textContent=m;}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
if(!ac){ac=new A();master=ac.createGain();master.gain.value=0;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;master.connect(lp);lp.connect(ac.destination);
const b=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*(Math.random()<.003?3.5:1);
const n=ac.createBufferSource(),bp=ac.createBiquadFilter();n.buffer=b;n.loop=true;bp.type='bandpass';bp.frequency.value=1700;bp.Q.value=.45;nG=ac.createGain();nG.gain.value=0;n.connect(bp);bp.connect(nG);nG.connect(master);n.start();
sG=ac.createGain();sG.gain.value=0;sG.connect(master);wO=ac.createOscillator();wG=ac.createGain();wG.gain.value=0;wO.connect(wG);wG.connect(master);wO.start();
const h=ac.createOscillator();h.frequency.value=100;hG=ac.createGain();hG.gain.value=0;h.connect(hG);hG.connect(ac.destination);h.start();}
if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
const mf=m=>440*2**((m-69)/12);
function note(fr,t,d,v,type){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=fr;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(sG);o.start(t);o.stop(t+d+.05);}
function program(bi,si){
const id=bi*10+si;if(!prog||prog.id!==id)prog={id,t:ac.currentTime+.06,b:0};
const root=48+(bi*7+si*5)%12,spb=60/(92+(si*13%5)*12)/2,sc=[0,2,4,7,9,12,14];
while(prog.t<ac.currentTime+.2){const b=prog.b,t=prog.t;
if(bi===2&&si%2===0){if(b%16<11&&(b*7+si)%3)note(740,t,spb*.7,.3,'sine');}
else if((bi+si)%3===1){if(b%2===0)note(mf(root+12+[0,4,7,12,7,4,0,-5][(b>>1)%8]),t,spb*4,.38,'sine');}
else{const h=(b*5+si*3+(b>>3))%7;if(b%2===0||h<3)note(mf(root+12+sc[h]),t,spb*1.8,.3,'triangle');if(b%4===0)note(mf(root-12+[0,5,7,0][(b>>4)%4]),t,spb*3.5,.45,'sine');}
prog.b++;prog.t+=spb;}}
function signal(){let s=0,best=0;BANDS[band].st.forEach(([p],i)=>{const v=Math.exp(-(((f-p)/.016)**2));if(v>s){s=v;best=i;}});return{s,best,p:BANDS[band].st[best][0]};}
const freq=()=>{const b=BANDS[band],v=b.lo+(b.hi-b.lo)*f;return b.dp?v.toFixed(b.dp):Math.round(v).toLocaleString('en-US').replace(',',' ');};
function press(i){
audio();
if(i===0){if(!on)return;on=false;KEYS.forEach(k=>k.to=0);KEYS[0].to=1;KEYS[0].pop=performance.now()+260;say('Off. The valves cool down.');}
else{const was=on;band=i-1;lastBand=band;on=true;KEYS.forEach((k,j)=>k.to=j===i?1:0);locked=-1;prog=null;say(was?`${BANDS[band].k} band.`:`On, ${BANDS[band].k} band. Valves warming.`);}
lastUI=0;
}
const power=()=>press(on?0:lastBand+1);
function doSeek(){audio();if(!on){power();}const st=BANDS[band].st.map(s=>s[0]);let n=st.find(p=>p>f+.02);if(n===undefined)n=st[0];seek=n;locked=-1;lastUI=0;}
function volume(d){audio();vol=clamp(vol+d,0,10);say(`Volume ${vol}.`);lastUI=0;}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
KEYS.forEach(k=>{bind(k.g,()=>press(k.i));set(k.g,'aria-label',k.i?`${['Long','Medium','Short','FM'][k.i-1]} wave key (${k.i})`:'Off key (O)');});
bind(VOL.g,()=>volume(vol>=10?-10:2));bind(TUNE.g,doSeek);
document.querySelectorAll('.hint [data-k]').forEach(b=>b.addEventListener('click',()=>b.dataset.k==='o'?power():doSeek()));
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key;
if(k==='ArrowLeft'||k==='ArrowRight'){e.preventDefault();audio();const d=k==='ArrowLeft'?-1:1;if(!e.repeat){f=clamp(f+d*.004);seek=null;locked=-1;lastUI=0;}tDir=d;return;}
if(k==='ArrowUp'||k==='ArrowDown'){e.preventDefault();volume(k==='ArrowUp'?1:-1);return;}
if(e.repeat)return;const lk=k.toLowerCase();
if(/^[1-4]$/.test(k)){e.preventDefault();press(+k);}else if(lk==='o'){e.preventDefault();power();}else if(lk==='s'){e.preventDefault();doSeek();}
});
document.addEventListener('keyup',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight')tDir=0;});
addEventListener('blur',()=>tDir=0);
function tick(now){
const dt=Math.min(.05,(now-(lastT||now))/1000),red=reduced.matches;lastT=now;
if(tDir){f=clamp(f+tDir*.16*dt);seek=null;locked=-1;}
if(seek!==null){const d=seek-f,st=.3*dt;if(red||Math.abs(d)<=st){f=seek;seek=null;}else f+=Math.sign(d)*st;}
let{s,best,p}=signal();
if(!tDir&&seek===null&&s>.2&&on){f+=(p-f)*clamp(dt*(red?60:3));({s,best,p}=signal());}
lamp+=((on?1:0)-lamp)*(red?1:clamp(dt/(on?.18:.12)));
heat+=((on?1:0)-heat)*(red?1:clamp(dt/(on?1.25:2.4)));
const live=clamp((heat-.45)/.5);aud+=(live-aud)*clamp(dt*6);
if(on&&s>.92&&locked!==best&&live>.6){locked=best;say(`Tuned to ${BANDS[band].st[best][1].toLowerCase()}.`);}
for(const k of KEYS){if(k.pop&&now>k.pop){k.pop=0;k.to=0;}k.v=red?k.to:k.v+(k.to-k.v)*clamp(dt*22);if(Math.abs(k.v-k.o)>.002){k.o=k.v;set(k.g,'transform',`translate(${f2(k.v*2.4*C)} ${f2(-k.v*2.4*S+k.v*.7)})`);}}
if(now-lastFx>60||red){lastFx=now;flick=red?0:(Math.random()-.5);}
const th=(on?(1-s)*44+3+flick*(1-s)*6:46)*Math.PI/180,R=7.4;
set(wedge,'d',`M0,0 L${f2(-R*Math.sin(th))},${f2(-R*Math.cos(th))} A${R},${R} 0 0 1 ${f2(R*Math.sin(th))},${f2(-R*Math.cos(th))} Z`);
const eb=clamp((heat-.3)/.7);eyeG.style.opacity=f2(eb*(.88+flick*.06));eyeH.style.opacity=f2(eb*.32);
back.style.opacity=f2(lamp*.85);halo.style.opacity=f2(lamp*.42);bulbs.forEach(b=>b.style.opacity=f2(lamp));DG.classList.toggle('lit',lamp>.5);
for(const h of ht)h.h.style.opacity=f2(heat*h.k*(h.h.classList.contains('fh')?.5:1)*(1+flick*.05));ventHalo.style.opacity=f2(heat*.32);
set(needle,'transform',`translate(${f2(24+f*148)} 0)`);
set(TUNE.rot,'transform',`rotate(${f2(f*900)})`);set(VOL.rot,'transform',`rotate(${-140+vol*28})`);
rows.forEach((r,bi)=>{const a=bi===band;if(r.a!==a){r.a=a;r.lab.classList.toggle('act',a);r.ns.forEach(n=>n.classList.toggle('act',a));}});
if(ac){const t=ac.currentTime,A=aud;master.gain.setTargetAtTime(vol/10*.085,t,.05);sG.gain.setTargetAtTime(A*s*s,t,.05);nG.gain.setTargetAtTime(A*(1-s)*(band===3?.32:.42)*(1+(tDir||seek!==null?.3:0)),t,.04);
const dd=Math.abs(f-p);if(band<3){wO.frequency.setTargetAtTime(Math.max(45,dd*52000),t,.02);wG.gain.setTargetAtTime(A*Math.exp(-((dd/.035)**2))*(1-s)*.14,t,.04);}else wG.gain.setTargetAtTime(0,t,.04);
hG.gain.setTargetAtTime(heat*.0025,t,.2);if(A>.05&&s>.05)program(band,best);else prog=null;}
if(!lastUI||now-lastUI>140){
readout.textContent=`${BANDS[band].k} ${freq()} ${BANDS[band].u} · VOL ${vol}`;
const nm=BANDS[band].st[best][1];
stateLabel.textContent=!on?(heat>.06?'OFF · VALVES COOLING':'OFF · PRESS O'):heat<.85?`WARMING · ${Math.round(heat/.85*100)}%`:s>.75?`TUNED · ${nm}`:s>.18?`TUNING · ${nm}`:seek!==null||tDir?'SWEEPING · STATIC':'STATIC · NO STATION';
lastUI=now;}
requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['o', 's'], draw }
