// @ts-nocheck
/* HARROWAY MK·50 · Valve amplifier. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--tol:#2f2e2c;--tol-top:#41403d;--tol-side:#262523;--pipe:#f2ecdc;--gold:#d4b15f;--gold-top:#e9cc85;--gold-side:#b5944b;--brush:#b89651;--chrome:#d9dad8;--chrome-top:#f4f4f2;--chrome-side:#bdbebc;--knob:#1f1f1f;--knob-top:#2c2c2c;--knob-side:#171717;--thr1:#cdbf96;--thr2:#8c805d;--baffle:#191919;--cone:#6a6157;--cav:#232323;--cav-top:#2c2c2c;--cav-side:#1d1d1d;--metal:#b9bcbd;--metal-top:#d3d5d6;--metal-side:#9fa3a4;--iron:#4a4d50;--iron-top:#5c6064;--iron-side:#3c3f42;--bake:#3b2f27;--bake-top:#4d3e33;--bake-side:#2e241e;--env:#fff;--heat:#ff7a1c;--hot:#ffc27a;--jewel:#e8261d;--ok:#22b864;--fault:#ff3b30;--blue:#3f7bff;--cord:#232323;--off:#3a3a38;--print:#2a2116}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--tol:#262524;--tol-top:#3c3b38;--tol-side:#171716;--pipe:#ccc7b9;--gold:#b2954f;--gold-top:#dabf7c;--gold-side:#7f6732;--brush:#9b7e43;--chrome:#b7b7b6;--chrome-top:#e4e4e2;--chrome-side:#858585;--knob:#181818;--knob-top:#282828;--knob-side:#0d0d0d;--thr1:#aca17e;--thr2:#756b4d;--baffle:#131313;--cone:#57514b;--cav:#1c1c1c;--cav-top:#282828;--cav-side:#111111;--metal:#9c9e9f;--metal-top:#c5c7c8;--metal-side:#707272;--iron:#3d3f41;--iron-top:#56595d;--iron-side:#282a2b;--bake:#2e2622;--bake-top:#47392f;--bake-side:#1b1715;--env:#d7d7d7;--heat:#ff7a1c;--hot:#ffc27a;--jewel:#e8261d;--ok:#36d886;--fault:#ff4c41;--blue:#5f8fff;--cord:#1c1c1c;--off:#2f2f2e;--print:#201a14;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.tol{fill:var(--tol)}.top.tol{fill:var(--tol-top)}.side.tol{fill:var(--tol-side)}.gold{fill:var(--gold)}.top.gold{fill:var(--gold-top)}.side.gold{fill:var(--gold-side)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.knob{fill:var(--knob)}.top.knob{fill:var(--knob-top)}.side.knob{fill:var(--knob-side)}
.cav{fill:var(--cav)}.top.cav{fill:var(--cav-top)}.side.cav{fill:var(--cav-side)}.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.iron{fill:var(--iron)}.top.iron{fill:var(--iron-top)}.side.iron{fill:var(--iron-side)}.bake{fill:var(--bake)}.top.bake{fill:var(--bake-top)}.side.bake{fill:var(--bake-side)}
.pipe{fill:none;stroke:var(--pipe);stroke-width:1.1}.pipe-u{fill:none;stroke:var(--line);stroke-width:1.9}.weave{fill:url(#weave);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.baffle{fill:var(--baffle)}.cone{fill:var(--cone)}.rib{fill:none;stroke:#000;stroke-width:.4;opacity:.35}.cap{fill:#857b6e}.capg{fill:#fff;opacity:0}
.pr{fill:var(--print);font:600 1.75px ui-monospace,monospace;letter-spacing:.2px;stroke:none}.logo{font:italic 700 6.4px Georgia,'Times New Roman',serif;letter-spacing:.2px;stroke:none}.brushl{stroke:var(--brush);stroke-width:.25;opacity:.6}.tick{stroke:var(--print);stroke-width:.3}
.env{fill:var(--env);fill-opacity:.16;stroke:var(--line);stroke-width:.7;vector-effect:non-scaling-stroke}.getter{fill:#8c9095;opacity:.85}.plate{fill:#5a5d61;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}
.fil{fill:var(--heat);opacity:0;filter:url(#glow)}.fh{fill:var(--heat);opacity:0;filter:url(#bloom);pointer-events:none}.bl{fill:var(--blue);opacity:0;filter:url(#bloom);pointer-events:none}
.jewel{fill:#5a1410}.jewel.on{fill:var(--jewel);filter:url(#glow)}.jh{fill:var(--jewel);opacity:0;filter:url(#bloom);pointer-events:none}.facet{fill:none;stroke:#fff;stroke-width:.25;opacity:.45}
.led{fill:var(--off)}.led.g{fill:var(--ok);filter:url(#glow)}.led.r{fill:var(--fault);filter:url(#glow)}.led.b{fill:var(--blue);filter:url(#glow)}
.cu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.cb{fill:none;stroke:var(--cord);stroke-linecap:round;stroke-linejoin:round}.lev{fill:none;stroke:var(--chrome-top);stroke-width:1.3;stroke-linecap:round}.lev-u{fill:none;stroke:var(--line);stroke-width:2.2;stroke-linecap:round}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .top.knob{fill:#3a3a3a}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}.stage-floor{transform:scale(1.8)}}`

const defs = `<pattern id="weave" width="2" height="2" patternUnits="userSpaceOnUse"><path d="M0,.5H2" style="stroke:var(--thr1);stroke-width:.7;opacity:.85"/><path d="M1.5,0V2" style="stroke:var(--thr2);stroke-width:.65;opacity:.8"/></pattern>
<radialGradient id="coneG"><stop offset=".25" style="stop-color:var(--cone)"/><stop offset="1" style="stop-color:#000;stop-opacity:.9"/></radialGradient>`

// The lab uses `env` for its pluck envelope; name the injected environment separately.
function draw(figureEnv: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=figureEnv;
/* HARROWAY MK·50 valve head on a 2×12 cabinet. World: x lower-right; y lower-left (fronts face +y); z up. 1 unit = 5 mm.
Part x y z w d h
cabinet feet ×4 8/136 6/46 0 6 6 4
cabinet 0 0 4 150 58 80
baffle + speakers ×2 (behind the cloth) 41/109 57.6 44 r27 – –
grille cloth + piping 7 58 11 136 0 66
corner caps (front) 0/145 58 4/79 5 0 5
side handle 150 19–39 56–66 0 20 10
head feet ×4 6/138 10/42 84 6 6 2
head 2 6 86 146 44 46
gold panel 7 50 113 136 0 14
inputs ×2 12/21 50 119 r2.2 – –
knobs ×6 34–99 50 119.5 r4.2 3.6 –
channel LED · jewel lamp 110/119 50 120 r1/3.2 – –
standby + power toggles 129/138 50 120 – 5 ±2.6
head cloth + logo plate 7 50 91 136 0 19
rear side vent (valves inside) 148 10–40 94–124 0 30 30
chassis · transformers · valves (inside) 96–143 9–47 88 47 38 8 / r2–3.1 – 13–24
handle 62–88 29 132 26 0 5
guitar cable: plug → floor → coil 12 50 119 → −46 118 0.8
footswitch + stomps + cable 116 70 0 36 16 5 → 120 −4 0.8
Grain, print and screws share their parent face. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers.
const draw=root,defs=svg.querySelector('defs'),into=g=>root=g,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
const sp=(x,y,z,rx,ry,cls)=>{const p=P(x,y,z);return el('ellipse',{cx:f2(p[0]),cy:f2(p[1]),rx,ry,class:cls});};
function cord(pts,w){const d=smooth(pts);el('path',{d,class:'cu','stroke-width':w+1.1});el('path',{d,class:'cb','stroke-width':w});}
function button(g,label){set(g,'class','control');set(g,'role','button');set(g,'tabindex','0');set(g,'aria-label',label);return g;}
function bind(g,fn){g.addEventListener('click',e=>fn(e.shiftKey?-1:1));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn(e.shiftKey?-1:1);}});}
function corners(g,w,h){for(const[u,v]of[[0,0],[w-5,0],[0,h-5],[w-5,h-5]]){rect(g,u-.4,v-.4,5.8,5.8,1.2,'face chrome');circle(g,u+(u?1.6:3.6),v+(v?1.6:3.6),.55,'detail');}}

// Shadow; the footswitch cable runs behind the cabinet, so it goes first.
const sh0=P(74,32,0);el('ellipse',{cx:sh0[0]-4,cy:sh0[1]+8,rx:132,ry:52,class:'shadow stage-floor'});el('ellipse',{cx:sh0[0]-4,cy:sh0[1]+8,rx:132,ry:52,class:'stage-contact'});
cord([[133,70,2],[136,64,.8],[150,60,.8],[160,48,.8],[162,22,.8],[156,4,.8],[136,-4,.8],[118,-4,.8]],1.6);
// Cabinet: feet, tolex box, baffle with speakers behind a see-through weave, piping, corners, handle.
for(const[x,y]of[[8,6],[136,6],[8,46],[136,46]])box(x,y,0,6,6,4,1.5,'knob');
box(0,0,4,150,58,80,2.5,'tol');
const cf=group(FRONT(0,57.6,84));rect(cf,7,7,136,66,1.6,'face baffle');
const SPK=[41,109].map(u=>{circle(cf,u,40,27,'face knob');circle(cf,u,40,25.4,'face').style.fill='#0d0d0d';const m=group('',cf),g=group(`translate(${u} 40)`,m);
circle(g,0,0,24,'face').style.fill='url(#coneG)';for(const r of[19,14.5,10.5])circle(g,0,0,r,'rib');const cp=circle(g,0,0,7,'cap');const gl=circle(g,0,0,7,'capg');return{m,g,cp,gl};});
const cl=group(FRONT(0,58,84));rect(cl,7,7,136,66,1.6,'weave');rect(cl,5.4,5.4,139.2,69.2,2.4,'pipe-u');rect(cl,5.4,5.4,139.2,69.2,2.4,'pipe');
text(cl,15,18,'Harroway','logo').style.fill='var(--pipe)';corners(cl,150,80);
const cs=group(SIDE(150,58,84));rect(cs,18,17,22,11,2.4,'face recess');rect(cs,20,20.5,18,3.6,1.8,'face knob');for(const u of[16.5,41.5])screw(cs,u,22.5);
for(const[u,v]of[[-.4,-.4],[52.6,-.4],[-.4,74.6],[52.6,74.6]])rect(cs,u,v,5.8,5.8,1.2,'face side chrome');
{const t=group(TOP(0,0,84));for(const[u,v]of[[-.4,-.4],[144.6,-.4]])rect(t,u,v,5.8,5.8,1.2,'face top chrome');}
// Head: feet, tolex box, rear side vent with the valves glowing inside.
for(const[x,y]of[[6,10],[138,10],[6,42],[138,42]])box(x,y,84,6,4,2,1,'knob');
box(2,6,86,146,44,46,2.5,'tol');
const VENT=[8,8,32,30],vc=el('clipPath',{id:'vent'},defs);rect(vc,...VENT,2.4,'').setAttribute('transform',SIDE(148,50,132));
into(el('g',{'clip-path':'url(#vent)'},draw));
rect(group(FRONT(4,8,130)),0,0,144,42,0,'face cav');rect(group(TOP(4,8,88)),0,0,144,40,0,'face top cav');
box(96,9,88,47,38,8,1,'metal');box(100,11,96,13,13,13,1.2,'iron');box(100,30,96,13,15,15,1.2,'iron');
const FIL=[],PWR=[];
function valve(x,y,r,h,pw){cylinder(x,y,96,r+.7,2.6,'z','bake');const z0=98.6;box(x-r*.55,y-r*.3,z0+2,r*1.1,r*.6,h*.55,.3,'plate');
FIL.push(sp(x,y,z0+h*.42,r*.5,h*.2,'fil'),sp(x,y,z0+h*.45,r*2.2,h*.55,'fh'));if(pw)PWR.push(sp(x,y,z0+h*.4,r*1.6,h*.4,'bl'));
const e=cylinder(x,y,z0,r,h,'z','env');set(e.g.firstChild,'class','env');circle(e.face,0,0,r*.75,'getter');set(e.face.firstChild,'class','env');}
for(const y of[14,22,30])valve(127,y,2,13,0);
for(const y of[12,19.5,27,34.5])valve(139.5,y,3.1,24,1);
into(draw);
const hs=group(SIDE(148,50,132));for(let i=0;i<8;i++)rect(hs,VENT[0]+2.4+i*3.9,VENT[1],.95,VENT[3],.45,'face side chrome');
rect(hs,VENT[0]-1.2,VENT[1]-1.2,VENT[2]+2.4,VENT[3]+2.4,3,'detail');text(hs,24,43,'HT 450 V · 50 W RMS','pr center').style.fill='var(--pipe)';
const ventHalo=sp(150,22,110,26,22,'fh');
for(const[u,v]of[[-.4,-.4],[38.6,-.4],[-.4,40.6],[38.6,40.6]])rect(hs,u,v,5.8,5.8,1.2,'face side chrome');
// Head front: gold panel (inputs, knobs, LED, jewel, toggles), cloth with logo plate.
const hf=group(FRONT(2,50,132));rect(hf,3.6,3.6,138.8,38.8,2,'pipe-u');rect(hf,3.6,3.6,138.8,38.8,2,'pipe');corners(hf,146,46);
rect(hf,5,5,136,14,1.2,'face gold');line(hf,5.6,5.8,140.4,5.8);for(let i=0;i<6;i++)line(hf,6,8+i*1.8,140,8+i*1.8,'brushl');
rect(hf,5,22,136,19,1.2,'weave');rect(hf,51,26,44,11,1.6,'face gold');rect(hf,52.2,27.2,41.6,8.6,1,'detail');text(hf,73,33.4,'Harroway','logo center').style.fill='var(--print)';
for(const[u,t]of[[10,'HIGH'],[19,'LOW']]){circle(hf,u,13,2.3,'face chrome');circle(hf,u,13,1.2,'face knob');text(hf,u,8.6,t,'pr center');}
const KN=[['PRESENCE',.55],['BASS',.6],['MIDDLE',.5],['TREBLE',.6],['MASTER',.45],['GAIN',.65]].map(([t,v],i)=>{const x=34+i*13,u=x-2;text(hf,u,8,t,'pr center');
for(let k=0;k<11;k++){const a=(-150+30*k)*Math.PI/180;line(hf,u+Math.sin(a)*5.4,13-Math.cos(a)*5.4,u+Math.sin(a)*6.1,13-Math.cos(a)*6.1,'tick');}
const ctl=i===5||i===3,g=ctl?button(el('g'),i===5?'Gain knob (G)':'Tone knob (T)'):el('g');into(g);const c=cylinder(x,50,119,4.2,3.6,'y','knob');
circle(c.face,0,0,2.9,'face gold top');const r=group('',c.face);line(r,0,-.6,0,-4,'detail').style.stroke='var(--pipe)';if(ctl)circle(c.face,0,0,5.6,'focus-ring');into(draw);return{g,r,v,o:-1};});
text(hf,110,8.6,'CH','pr center');const chL=circle(hf,110,13,1.1,'led');
const jw=cylinder(121,50,119,3.4,1.6,'y','chrome').face;const jewel=circle(jw,0,0,2.5,'jewel');for(const a of[0,60,120])line(jw,-2.4*Math.cos(a*Math.PI/180),-2.4*Math.sin(a*Math.PI/180),2.4*Math.cos(a*Math.PI/180),2.4*Math.sin(a*Math.PI/180),'facet');circle(jw,0,0,1.2,'facet');const jh=circle(jw,0,0,9,'jh');
const TG=[['STANDBY',129],['POWER',138]].map(([t,u])=>{text(hf,u,8.6,t,'pr center').style.fontSize='1.45px';const g=button(el('g'),`${t.toLowerCase()} switch (${t[0]})`);
cylinder(u+2,50,119,1.9,1,'y','chrome');const a=el('path',{class:'lev-u'},g),b=el('path',{class:'lev'},g),tip=el('circle',{r:1.05,class:'face top chrome'},g);const p=P(u+2,52.5,119);for(const c of['hit','focus-ring']){const n=el('circle',{r:4.6,class:c},g);set(n,'cx',f2(p[0]));set(n,'cy',f2(p[1]));}return{g,a,b,tip,x:u+2,o:-2};});
// Head top: leather handle with chrome end caps.
box(60,26.5,132,4,5,1.6,.6,'chrome');box(86,26.5,132,4,5,1.6,.6,'chrome');
cord([[62,29,133.4],[64,29,137],[75,29,138.6],[86,29,137],[88,29,133.4]],3.2);
{const t=group(TOP(2,6,132));for(const[u,v]of[[-.4,-.4],[140.6,-.4],[-.4,38.6],[140.6,38.6]])rect(t,u,v,5.8,5.8,1.2,'face top chrome');}
// Guitar cable: plug in HIGH, down the cabinet front, a loose coil on the floor.
cylinder(12,50,119,1.5,4.4,'y','chrome');cylinder(12,54.4,119,1.3,5,'y','knob');
cord([[12,59.4,119],[12,63,116],[11.5,65,104],[10.5,65.5,60],[9.5,66,18],[8.5,68,2.6],[6,76,.9],[-4,86,.9],[-18,88,.9],[-24,98,.9],[-16,106,.9],[-4,101,.9],[-8,93,.9],[-22,100,.9],[-40,112,.9],[-52,118,.9]],1.8);
// Footswitch on the floor: two chrome stomps with LEDs.
box(116,70,0,36,16,5,2,'knob');const fsT=group(TOP(116,70,5));text(fsT,9,14.4,'CHANNEL','pr center').style.fill='var(--pipe)';text(fsT,27,14.4,'REVERB','pr center').style.fill='var(--pipe)';
const ledCh=circle(fsT,9,3.2,1.1,'led'),ledRv=circle(fsT,27,3.2,1.1,'led');
const ST=[125,143].map((x,i)=>{const g=button(el('g'),i?'Reverb footswitch (V)':'Channel footswitch (F)');into(g);const m=el('g',{},g);into(m);cylinder(x,78,5,3.2,1.2,'z','chrome');const c=cylinder(x,78,6.2,2.4,2.2,'z','chrome');circle(c.face,0,0,1.6,'detail');into(g);ellipse(x,78,5,5.4,'z','focus-ring');into(draw);return{g,m,p:0};});
frame([[0,0,0,150,58,139],[-48,62,0,60,58,2],[116,-6,0,48,92,8]],6);

// State: power → valves warm → standby lifted = live. Audio: plucked strings → drive → tone → cab → reverb.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),keys={};
const CH=['CLEAN','LEAD'],CHORDS=[[['E',[40,47,52,56,59,64]],['A',[45,52,57,61,64]],['D',[50,57,62,66]],['G',[43,47,50,55,59,67]]],[['E5',[40,47,52]],['G5',[43,50,55]],['A5',[45,52,57]],['D5',[50,57,62]]]];
let power=true,standby=true,heat=1,ch=1,gain=.65,tone=.6,verb=false,ci=0,lastChord='',level=0,env=0,lt=0,lastUI=0,msg='',msgT=0,ac=null,inG,pre,shp,post,treb,bass,cab,cab2,dry,wet,conv,master,an,buf,humG;
const bufs=new Map();
function say(m){announcement.textContent=m;}
function note(m,a){msg=m;msgT=performance.now()+1700;lastUI=0;if(a)say(a);}
function curve(){const k=ch?3+gain*70:.8+gain*3,n=1024,c=new Float32Array(n);for(let i=0;i<n;i++){const x=i/(n-1)*2-1;c[i]=Math.tanh(k*x)/Math.tanh(k);}return c;}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();const t=ac.currentTime;
inG=ac.createGain();pre=ac.createGain();shp=ac.createWaveShaper();post=ac.createGain();treb=ac.createBiquadFilter();bass=ac.createBiquadFilter();cab=ac.createBiquadFilter();cab2=ac.createBiquadFilter();dry=ac.createGain();wet=ac.createGain();conv=ac.createConvolver();master=ac.createGain();an=ac.createAnalyser();
treb.type='highshelf';treb.frequency.value=2600;bass.type='lowshelf';bass.frequency.value=180;bass.gain.value=3;cab.type='lowpass';cab.frequency.value=4600;cab.Q.value=.9;cab2.type='highpass';cab2.frequency.value=85;shp.oversample='2x';master.gain.value=0;an.fftSize=512;
const L=ac.sampleRate*1.8|0,ir=ac.createBuffer(2,L,ac.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<L;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/L,3.2);}conv.buffer=ir;
inG.connect(pre);pre.connect(shp);shp.connect(post);post.connect(bass);bass.connect(treb);treb.connect(cab);cab.connect(cab2);cab2.connect(dry);cab2.connect(conv);conv.connect(wet);dry.connect(master);wet.connect(master);master.connect(an);an.connect(ac.destination);buf=new Float32Array(an.fftSize);
const h=ac.createOscillator();h.frequency.value=100;humG=ac.createGain();humG.gain.value=0;h.connect(humG);humG.connect(ac.destination);h.start();voiceAmp();}
if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function voiceAmp(){if(!ac)return;const t=ac.currentTime;shp.curve=curve();pre.gain.setTargetAtTime(ch?.9+gain*1.4:.7+gain*.8,t,.03);post.gain.setTargetAtTime(ch?.32:.5,t,.03);treb.gain.setTargetAtTime(-14+tone*22,t,.04);wet.gain.setTargetAtTime(verb?.38:0,t,.08);dry.gain.value=1;}
function pluck(m){const f=440*2**((m-69)/12),key=m;if(bufs.has(key))return bufs.get(key);const sr=ac.sampleRate,n=Math.round(sr/f),len=sr*2.2|0,b=ac.createBuffer(1,len,sr),d=b.getChannelData(0),s=new Float32Array(n);
for(let i=0;i<n;i++)s[i]=(Math.random()*2-1)*(1-.5*i/n);let p=0;for(let i=0;i<len;i++){const a=s[p],q=s[(p+1)%n];s[p]=(a+q)*.4985;d[i]=a;p=(p+1)%n;}bufs.set(key,b);return b;}
function click(f,v){if(!ac)return;const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.03);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.04);}
const live=()=>power&&standby&&heat>.85;
function strum(){audio();const set_=CHORDS[ch],c=set_[ci%set_.length];ci++;lastChord=c[0];env=1;
if(!power){note('NO SOUND · AMP OFF','The amp is off.');}else if(!live()){note(standby?'VALVES STILL WARMING':'NO SOUND · STANDBY','No sound: lift standby once the valves are warm.');}
else say(`${c[0]} chord.`);
if(ac){const t=ac.currentTime+.01;c[1].forEach((m,i)=>{const s=ac.createBufferSource(),g=ac.createGain();s.buffer=pluck(m);g.gain.value=.55-i*.03;s.connect(g);g.connect(inG);s.start(t+i*.016);});}lastUI=0;}
function setPower(){audio();power=!power;if(!power)standby=false;click(power?180:140,.04);say(power?'Power on. The valves are warming; lift standby in a few seconds.':'Power off.');sync();}
function setStandby(){audio();if(!power){note('POWER IS OFF','Switch the power on first.');click(220,.02);return;}standby=!standby;click(240,.04);say(standby?(heat>.85?'Standby lifted. The amp is live.':'Standby lifted. Still warming.'):'Back on standby.');sync();}
function knobT(i,d){audio();const k=KN[i];k.v=clamp(Math.round((k.v+d*.05)*20)/20);if(i===5)gain=k.v;else tone=k.v;voiceAmp();lastUI=0;}
function channel(){audio();ch=1-ch;ST[0].p=1;voiceAmp();click(900,.012);say(`${CH[ch].toLowerCase()} channel.`);sync();}
function reverb(){audio();verb=!verb;ST[1].p=1;voiceAmp();click(700,.012);say(verb?'Reverb on.':'Reverb off.');sync();}
function sync(){set(TG[1].g,'aria-pressed',power);set(TG[0].g,'aria-pressed',standby);set(keys.p,'aria-pressed',power);set(keys.s,'aria-pressed',standby);set(keys.v,'aria-pressed',verb);set(ST[1].g,'aria-pressed',verb);lastUI=0;}
bind(TG[1].g,setPower);bind(TG[0].g,setStandby);bind(KN[5].g,d=>knobT(5,d));bind(KN[3].g,d=>knobT(3,d));bind(ST[0].g,channel);bind(ST[1].g,reverb);
const cabHit=button(el('g'),'Speaker cabinet: strum a chord (Space)');el('path',{d:poly([[7,58,77],[143,58,77],[143,58,11],[7,58,11]],true),class:'hit'},cabHit);bind(cabHit,strum);
const act={p:setPower,s:setStandby,space:strum,f:channel,v:reverb};document.querySelectorAll('.hint [data-k]').forEach(b=>{keys[b.dataset.k]=b;b.addEventListener('click',()=>act[b.dataset.k]());});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented||e.repeat)return;const k=e.key.toLowerCase(),d=e.shiftKey?-1:1;
if(k===' '){if(e.target.closest&&e.target.closest('button,[role=button]'))return;e.preventDefault();strum();}else if(k==='g'){e.preventDefault();knobT(5,d);}else if(k==='t'){e.preventDefault();knobT(3,d);}else if(act[k]){e.preventDefault();act[k]();}});
function tick(now){
const dt=Math.min(.05,(now-(lt||now))/1000),red=reduced.matches;lt=now;
heat=red?(power?1:0):clamp(heat+(power?dt/4.2:-dt/2.6));
const L=live();
if(ac){master.gain.setTargetAtTime(L?.55:0,ac.currentTime,.06);humG.gain.setTargetAtTime(power?(L?.0016:.0007)*heat:0,ac.currentTime,.3);an.getFloatTimeDomainData(buf);let s=0;for(let i=0;i<buf.length;i+=4)s+=buf[i]*buf[i];level+=(Math.min(1,Math.sqrt(s/(buf.length/4))*3.2)-level)*clamp(dt*(18));}
else{env=Math.max(0,env-dt*.8);level=L?env:0;}
const lv=L?level:0;
FIL.forEach((n,i)=>n.style.opacity=f2(i%2?heat*.42:heat*(.85+.1*Math.sin(now/170+i))));PWR.forEach(n=>n.style.opacity=f2(L?.12+lv*.7:0));ventHalo.style.opacity=f2(heat*.3+lv*.25);
set(jewel,'class',power?'jewel on':'jewel');jh.style.opacity=power?.45:0;set(chL,'class','led'+(L?ch?' r':' g':''));set(ledCh,'class','led'+(power?ch?' r':' g':''));set(ledRv,'class','led'+(power&&verb?' b':''));
SPK.forEach((s,i)=>{const d=red?0:lv*1.4*Math.sin(now/(i?23:19))*.5+lv*.9;set(s.m,'transform',`translate(${f2(-d*C)} ${f2(d*S)})`);s.gl.style.opacity=f2(lv*.35);});
KN.forEach(k=>{if(k.o!==k.v){k.o=red?k.v:k.o<0?k.v:k.o+(k.v-k.o)*clamp(dt*14);if(Math.abs(k.o-k.v)<.002)k.o=k.v;set(k.r,'transform',`rotate(${f2(-150+300*k.o)})`);}});
TG.forEach((t,i)=>{const on=i?power:standby,to=on?1:-1;t.o=red||t.o<-1.5?to:t.o+(to-t.o)*clamp(dt*22);const a=P(t.x,50.6,119),b=P(t.x,55,119+t.o*2.6);const d=`M${f2(a[0])},${f2(a[1])}L${f2(b[0])},${f2(b[1])}`;set(t.a,'d',d);set(t.b,'d',d);set(t.tip,'cx',f2(b[0]));set(t.tip,'cy',f2(b[1]));});
ST.forEach(s=>{s.p=Math.max(0,s.p-dt*6);set(s.m,'transform',`translate(0 ${f2(red?0:Math.sin(s.p*Math.PI)*.9)})`);});
if(!lastUI||now-lastUI>150){lastUI=now;
readout.textContent=`${CH[ch]} · GAIN ${(gain*10).toFixed(1)} · TONE ${(tone*10).toFixed(1)}${verb?' · REVERB':''}`;
stateLabel.textContent=now<msgT?msg:!power?(heat>.05?'OFF · VALVES COOLING':'OFF · P TO POWER'):!standby?(heat<.85?`STANDBY · WARMING ${Math.round(heat/.85*100)}%`:'STANDBY · READY · S TO PLAY'):heat<.85?`WARMING ${Math.round(heat/.85*100)}% · HT ON`:lv>.05?`PLAYING ${lastChord} · ${String(Math.round(20*Math.log10(Math.max(lv,.001)))).replace('-','−')} dB`:`LIVE · SPACE TO STRUM`;}
requestAnimationFrame(tick);}
sync();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['p', 's', 'space', 'f', 'v'], draw }
