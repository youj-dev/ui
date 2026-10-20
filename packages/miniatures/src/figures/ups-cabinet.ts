// @ts-nocheck
/* PALISADE U20 · UPS cabinet. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b3b3af;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--bez:#3d3f40;--bez-top:#525456;--bez-side:#313334;--screen:#0d141c;--batt:#3d3f41;--batt-top:#55585a;--batt-side:#303234;--metal:#d4d6d6;--cord:#3c3c3a;--red:#d8392b;--smoke:#2e2e2e;--smoke-a:.1;--inside:#8b8e90;--inside-top:#a3a6a8;--inside-side:#7a7d7f}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#969694;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--bez:#323334;--bez-top:#4c4e50;--bez-side:#202121;--screen:#0b0f14;--batt:#323435;--batt-top:#4f5254;--batt-side:#1f2021;--metal:#b3b4b4;--cord:#313130;--red:#b62e23;--smoke:#252525;--smoke-a:.2;--inside:#757778;--inside-top:#989b9d;--inside-side:#555657;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:5px;letter-spacing:1.4px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.bz{fill:var(--bez)}.top.bz{fill:var(--bez-top)}.side.bz{fill:var(--bez-side)}.batt{fill:var(--batt)}.top.batt{fill:var(--batt-top)}.side.batt{fill:var(--batt-side)}.metal{fill:var(--metal)}.screen{fill:var(--screen)}.inside{fill:var(--inside)}.top.inside{fill:var(--inside-top)}.side.inside{fill:var(--inside-side)}.redb{fill:var(--red)}.yel{fill:#f2c230}.lbl{fill:#e8e8e2}
.mw{fill:none;stroke:var(--line);stroke-width:.35}.mesh{fill:url(#mesh);stroke:none}.trail{fill:none;stroke:var(--line);stroke-width:.8;stroke-linecap:round}.perf{fill:url(#perf)}
.cu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.cb{fill:none;stroke:var(--cord);stroke-linecap:round;stroke-linejoin:round}.cr{stroke:var(--red)}.conduit{fill:none;stroke:var(--metal);stroke-linecap:round}
.flow{fill:none;stroke-linecap:round;stroke-dasharray:2.5 7;opacity:0;transition:opacity .4s}.flow.g{stroke:var(--ok)}.flow.a{stroke:var(--warn)}.flow.b{stroke:var(--accent)}.flow.on{opacity:.95}
.led>.core{fill:var(--off)}.led>.halo{opacity:0;filter:url(#soft)}.on>.core{fill:var(--c)}.on>.halo{fill:var(--c);opacity:.6}.g{--c:var(--ok)}.b{--c:var(--accent)}.a{--c:var(--warn)}.r{--c:var(--fault)}.w{--c:#f4f1e6}
.lamp{fill:#6b6b68}.lamp.on{fill:var(--c);filter:url(#glow)}.lh{fill:var(--c);opacity:0;filter:url(#bloom)}.lh.on{opacity:.55}
.mim{fill:none;stroke:#2a3a4a;stroke-width:.8;stroke-linecap:round;stroke-linejoin:round}.mim.on{stroke:var(--c);filter:url(#glow)}.mt{fill:#8fb0d0;font:2.6px ui-monospace,monospace;letter-spacing:.15px}.mt.big{font-size:3px;font-weight:700;fill:#dbe8ff}.mt.warn{fill:var(--warn)}.mb{fill:#0f1a26;stroke:#3b5674;stroke-width:.4}.mb.on{stroke:var(--c)}.halo-s{fill:var(--accent);opacity:.12;filter:url(#bloom)}
.pane{fill:var(--smoke);fill-opacity:var(--smoke-a);pointer-events:none}.sheen{fill:#fff;opacity:.1;pointer-events:none}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .btn{fill:var(--top)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<pattern id="mesh" width="10" height="4" patternUnits="userSpaceOnUse"><path d="M0,0V4H10" class="mw"/></pattern>
<pattern id="perf" width="2.4" height="2.4" patternUnits="userSpaceOnUse"><rect width="2.4" height="2.4" style="fill:var(--bez)"/><circle cx="1.2" cy="1.2" r=".62" style="fill:var(--recess)"/></pattern>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* PALISADE U20 power room. World: x lower-right; y lower-left; z up. 1 unit ≈ 12 mm.
Part x y z w d h
ATS pedestal −42 26 0 28 32 20
ATS enclosure (lamps, transfer handle, utility isolator) −46 22 20 36 40 66
conduits (utility, generator) −36/−24 66 0 r2.4 – 20
UPS plinth + cabinet 0 0 0 56 72 150
UPS front: brand, LCD mimic, LEDs, buttons, bypass key, perforated door 0 72 6 56 0 144
battery plinth + cabinet 60 0 0 56 72 150
battery interior (4 shelves × 4 blocks) behind smoked glass 64 6 12 48 62 132
charge gauge (10 segments) 64 72 136 48 0 10
DC jumper UPS ↔ battery 50→66 18 150 – – 8
load rack posts 124/164 38 0 4 4 116
servers (4) 128 22 34–76 36 36 7
PDU on the right post 168 38 18 3 6 84
cable tray (mesh) −44 28 156 214 20 6
tray posts on the cabinet and rack tops
power cables ATS→UPS, UPS→load (flow pulses)
Seams, screws, LEDs and labels share their parent face. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: LEDs, lamps, rounded cable routes with flow overlays.
const draw=root,defs=svg.querySelector('defs'),into=g=>root=g,f2=v=>(+v).toFixed(2);
function led(g,x,y,r=.8,w=0){const l=el('g',{class:'led'},g);if(w){rect(l,x-w/2-.8,y-r*1.4,w+1.6,r*2.8,r,'halo');rect(l,x-w/2,y-r/2,w,r,.3,'core');}else{circle(l,x,y,r*2.4,'halo');circle(l,x,y,r,'core');}l.k='';return l;}
function lit(l,c){if(l.k!==c){l.k=c;set(l,'class','led'+(c?' on '+c:''));}}
function route(pts,r=3){let d='M'+P(...pts[0]);for(let i=1;i<pts.length-1;i++){const a=pts[i-1],b=pts[i],c=pts[i+1],la=Math.hypot(...b.map((v,j)=>v-a[j])),lc=Math.hypot(...c.map((v,j)=>v-b[j]));const p=b.map((v,j)=>v+(a[j]-v)*Math.min(r,la/2)/la),q=b.map((v,j)=>v+(c[j]-v)*Math.min(r,lc/2)/lc);d+='L'+P(...p)+'Q'+P(...b)+' '+P(...q);}return d+'L'+P(...pts[pts.length-1]);}
function cable(pts,w,cls='',parent=root){const d=route(pts);el('path',{d,class:'cu','stroke-width':w+.9},parent);el('path',{d,class:'cb '+cls,'stroke-width':w},parent);return el('path',{d,class:'flow','stroke-width':w*.5},parent);}
const ledsOn=(arr,c)=>arr.forEach(l=>lit(l,c));
// Floor shadow, ATS pedestal and enclosure with conduits.
const shp=P(60,40,0);el('ellipse',{cx:shp[0],cy:shp[1]+8,rx:200,ry:62,class:'shadow stage-floor'});el('ellipse',{cx:shp[0],cy:shp[1]+8,rx:200,ry:62,class:'stage-contact'});
box(-42,26,0,28,22,20,2,'base');for(const x of[-36,-24]){cylinder(x,55,0,3.6,1.2,'z','metal');cylinder(x,55,1.2,2.4,18.8,'z','metal');}
box(-46,22,20,36,40,66,2.4,'');
const af=group(FRONT(-46,62,86));rect(af,2.5,2.5,31,61,1.6,'detail');text(af,18,8.6,'ATS · 63 A','label center');
const UL=[];for(const[u,t,c]of[[9,'UTILITY','g'],[27,'GEN','a']]){const g=el('g',{class:c},af);const h=circle(g,u,16,5,'lh');circle(g,u,16,3.2,'face metal');const l=circle(g,u,16,2.3,'lamp');text(af,u,23,t,'etch micro center');UL.push({h,l});}
circle(af,18,37,9.6,'face metal');circle(af,18,37,8,'detail');text(af,8.6,30.6,'U','label micro center');text(af,27.4,30.6,'G','label micro center');
const handle=group('translate(18 37)',af);rect(handle,-1.8,-11,3.6,13,1.8,'face bz');circle(handle,0,0,3.4,'face top bz');circle(handle,0,-9.4,1.2,'face redb');
const isoG=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Utility isolator: pull or restore mains (M)','aria-pressed':'false'},af);
rect(isoG,10,47,16,13,2,'face yel');circle(isoG,18,53.5,4.4,'face redb');const isoH=group('translate(18 53.5)',isoG);rect(isoH,-1.2,-5.4,2.4,10.8,1.2,'face redb');text(af,18,62.6,'UTILITY ISOLATOR','etch micro center');rect(isoG,8.6,45.6,18.8,15.8,3,'focus-ring');
const as=group(SIDE(-10,62,86));slits(as,6,8,28,10,7);rect(as,6,48,28,10,1,'face lbl');text(as,20,52.4,'DANGER 400 V','etch micro center').style.fill='#c62d22';text(as,20,55.8,'TRANSFER SWITCH','etch micro center');
// UPS cabinet.
box(2,2,0,52,68,6,1.5,'base');box(0,0,6,56,72,144,2.4,'');
const us=group(SIDE(56,72,150));slits(us,8,14,56,8,16);slits(us,8,120,56,8,16);rect(us,22,60,28,12,1,'face lbl');text(us,36,64.6,'U20 · 20 kVA','etch micro center');text(us,36,68.4,'IN 400 V · OUT 230 V','etch micro center');
box(0,72,6,56,1.6,144,2,'bz');
const uf=group(FRONT(0,73.6,150));
text(uf,6,9,'PALISADE','label brand').style.fill='#e8e8e8';text(uf,50,9,'U20','etch end').setAttribute('text-anchor','end');
rect(uf,5,15,46,29,2,'face recess');rect(uf,8,18,40,23,1.4,'halo-s');rect(uf,7,17,42,25,1.6,'face screen');
const lcd=group('translate(7 17)',uf);
const MIM={};const mpath=(k,d)=>{MIM[k]=el('path',{d,class:'mim'},lcd);};
mpath('in','M2,9 H10');mpath('rect','M15,9 H21');mpath('inv','M21,9 H27');mpath('out','M32,9 H40');mpath('batt','M21,9 V14.5');mpath('byp','M5,9 V3.5 H36 V9');
const MB={};for(const[k,x,y,w,h,t]of[['r',10,6,5,6,'~='],['i',27,6,5,6,'=~'],['b',18,14.5,6,4.6,'']]){MB[k]=rect(lcd,x,y,w,h,.6,'mb');if(t)text(lcd,x+2.5,y+3.9,t,'mt center');}
for(let i=0;i<3;i++)rect(lcd,19+i*1.6,15.6,1.1,2.6,.2,'mb');
text(lcd,2,7,'IN','mt');const rt=text(lcd,21,3.6,'','mt center');text(lcd,40,7,'OUT','mt').setAttribute('text-anchor','end');
const LT=[text(lcd,2,23.2,'','mt big'),text(lcd,40,23.2,'','mt big')];LT[1].setAttribute('text-anchor','end');const bell=text(lcd,40,3.6,'','mt warn');bell.setAttribute('text-anchor','end');
const UL2={};[['LINE',10,'LINE'],['BATT',20,'BATT'],['BYPASS',30,'BYP'],['FAULT',40,'FAULT']].forEach(([n,u,t])=>{UL2[n]=led(uf,u,49,.9);text(uf,u,53.6,t,'etch micro center');});
const ubtn=(u,name,lab)=>{const g=el('g',{class:'control',role:'button',tabindex:'0','aria-label':lab},uf);circle(g,u,60,3.2,'face recess');circle(g,u,60,2.4,'face top btn');circle(g,u,60,4.8,'focus-ring');text(uf,u,66.4,name,'etch micro center');return g;};
const testB=ubtn(12,'TEST','Battery test (T)'),silB=ubtn(25,'SILENCE','Silence the alarm (A)');
const keyG=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Bypass key switch (B)','aria-pressed':'false'},uf);circle(keyG,42,60,4.2,'face metal');circle(keyG,42,60,3,'detail');const key=group('translate(42 60)',keyG);rect(key,-.8,-3.6,1.6,7.2,.6,'face bz');rect(key,-2,-5.6,4,2.6,1,'face top bz');text(uf,36,57.4,'N','etch micro center');text(uf,48.4,57.4,'BYP','etch micro center');circle(keyG,42,60,6,'focus-ring');text(uf,42,66.4,'BYPASS','etch micro center');
rect(uf,4,70,48,70,2,'face perf');rect(uf,4,70,48,70,2,'detail');rect(uf,47,92,2.6,22,1.3,'face metal');rect(uf,8,132,20,5,1,'face lbl');text(uf,18,135.6,'SERVICE','etch micro center');
// Battery cabinet: interior behind smoked glass, gauge on the top band.
box(62,2,0,52,68,6,1.5,'base');box(60,0,6,56,72,144,2.4,'');
const bs=group(SIDE(116,72,150));slits(bs,8,14,56,8,16);slits(bs,8,120,56,8,16);rect(bs,22,60,28,12,1,'face lbl');text(bs,36,64.6,'16 × 12 V 100 Ah','etch micro center');text(bs,36,68.4,'192 V DC STRING','etch micro center');
const bc=el('clipPath',{id:'bwin'},defs);el('polygon',{points:[[64,73.6,128],[112,73.6,128],[112,73.6,10],[64,73.6,10]].map(p=>P(...p).join(',')).join(' ')},bc);
const IN=into(el('g',{'clip-path':'url(#bwin)'},draw));
rect(group(FRONT(62,6,150)),0,0,54,150,0,'face inside');rect(group(SIDE(64,72,150)),0,0,66,150,0,'face side inside');
const SHELF=[12,44,76,108],MON=[];
for(const z of SHELF){box(64,8,z-2,48,64,2,.4,'metal');
for(let i=0;i<4;i++){const x=66+i*11.2;box(x,34,z,10.4,30,22,1,'batt');const g=group(FRONT(x,64,z+22));rect(g,1.4,6,7.6,3,.6,'face lbl');text(g,5.2,8.2,'12V','etch micro center').style.fill='#333';circle(g,2.4,2.4,1.2,'face redb');circle(g,8,2.4,1.2,'face bz');}
for(let i=0;i<3;i++)wire([[74.4+i*11.2,64.3,z+19.6],[75.6+i*11.2,64.3,z+19.6]],'cu').setAttribute('stroke-width',1.6);
const mg=group(FRONT(108,72,z+30));MON.push(led(mg,2,2,.7));}
wire([[67.2,64.3,140],[67.2,64.3,108+19.6]],'cu').setAttribute('stroke-width',1.2);
into(draw);
rect(group(TOP(60,72,150)),0,0,56,1.6,.8,'face top bz');rect(group(SIDE(116,73.6,150)),0,0,1.6,144,.8,'face side bz');
const bf=group(FRONT(60,73.6,150));el('path',{d:'M2,0H54Q56,0 56,2V142Q56,144 54,144H2Q0,144 0,142V2Q0,0 2,0ZM4,22V140H52V22Z',class:'face bz','fill-rule':'evenodd'},bf);
rect(bf,4,4,48,12,1.6,'face screen');const SEG=[...Array(10)].map((_,i)=>led(bf,8+i*4.2,10,.9,3));text(bf,28,19.6,'BATTERY STRING · CHARGE','etch micro center');
const glassG=group('',bf);el('path',{d:'M4,22 H52 V140 H4Z',class:'face pane'},glassG);el('path',{d:'M16,22h12L10,140H4V130Z M34,22h5L21,140h-5Z',class:'sheen'},glassG);rect(bf,4,22,48,118,1,'detail');rect(bf,48,70,2.6,22,1.3,'face metal');
// DC jumper between the UPS and the battery cabinet.
const dcR=cable([[50,18,150],[50,18,156],[66,18,156],[66,18,150]],1.6,'cr');const dcB=cable([[50,24,150],[50,24,154],[66,24,154],[66,24,150]],1.6,'');
// Load rack: posts, four servers, PDU.
const loadG=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Load rack: step the load (L)'});into(loadG);
box(124,38,0,4,4,156,1,'base');
const SV=[];for(let i=0;i<4;i++){const z=34+i*14;box(128,22,z,36,36,7,1,'');const g=group(FRONT(128,58,z+7));rect(g,2,1.6,9,3.8,.6,'face recess');slits(g,13,1.4,16,4.2,8);const s={p:led(g,32,3.5,.7),a:[0,1,2].map(k=>led(g,3.6+k*2.9,3.5,.55)),on:i<2};SV.push(s);for(const x of[124.5,164])rect(group(FRONT(x,58.3,z+7)),0,0,3.5,7,.6,'face metal');}
box(164,38,0,4,4,156,1,'base');box(168,38,18,3,6,84,.8,'bz');const pduF=group(SIDE(171,44,102));for(let i=0;i<6;i++)rect(pduF,1.4,8+i*12,3.2,5,.8,'face recess');const pduL=led(pduF,3,4,.6);{const r=group(FRONT(124,58,96));rect(r,-1.5,-1.5,47,66,2,'focus-ring');}into(draw);
// Overhead cable tray on posts, with the power runs.
for(const[x,z]of[[22,150],[82,150]]){box(x,34,z,3,4,156-z,.5,'base');}
const TX0=-44,TL=214;
const tb=group(TOP(TX0,28,156));rect(tb,0,0,TL,20,0,'mesh');line(tb,0,0,TL,0,'trail');line(tb,0,20,TL,20,'trail');
const inF=cable([[-28,42,86],[-28,42,158],[-20,40,158],[10,40,158],[12,40,150]],2.2,'');
const outF=cable([[44,44,150],[44,44,158],[50,44,158],[146,44,158],[150,44,150],[150,44,118],[166,44,108],[169.5,44,100]],2.2,'');
const tf=group(FRONT(TX0,48,162));rect(tf,0,0,TL,6,0,'mesh');line(tf,0,0,TL,0,'trail');line(tf,0,6,TL,6,'trail');for(let x=0;x<=TL;x+=24)line(tf,x,0,x,6,'trail');
el('path',{d:'M0,0V6H20V0',class:'trail',transform:SIDE(TX0+TL,48,162)});
const uFeed=el('path',{d:poly([[-36,55,1.2],[-36,55,20]]),class:'flow','stroke-width':1.4}),gFeed=el('path',{d:poly([[-24,55,1.2],[-24,55,20]]),class:'flow','stroke-width':1.4});
frame([[-46,22,0,36,48,86],[0,0,0,172,74,150],[-44,28,156,214,20,8]],10);
// State: utility, generator, ATS, UPS mode, charge, load, alarm.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const LOADS=[.25,.5,.75,1];
let keyA=0,lastLed=0,util=true,gen='off',genT=0,ats='U',atsT=0,hA=-45,hV=0,isoA=0,bypass=false,testUntil=0,charge=1,li=1,mode='online',prevMode='online',silenced=false,nextBeep=0,lastT=0,lastUI=0,ac=null,genG=null,msg='',msgT=0;
const keyB={};document.querySelectorAll('.hint [data-k]').forEach(b=>keyB[b.dataset.k]=b);
function say(m){announcement.textContent=m;}
function note(m){msg=m;msgT=performance.now()+1700;lastUI=0;}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();const b=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=ac.createBufferSource(),f=ac.createBiquadFilter();s.buffer=b;s.loop=true;f.type='lowpass';f.frequency.value=95;genG=ac.createGain();genG.gain.value=0;s.connect(f);f.connect(genG);genG.connect(ac.destination);s.start();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function beep(f,d=.12,v=.025,at=0){if(!ac)return;const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+at;o.type='square';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.02);}
function clunk(){if(!ac)return;const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.frequency.setValueAtTime(140,t);o.frequency.exponentialRampToValueAtTime(50,t+.15);g.gain.setValueAtTime(.08,t);g.gain.exponentialRampToValueAtTime(.0001,t+.18);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.2);}
function mains(){audio();util=!util;msgT=0;set(isoG,'aria-pressed',!util);set(keyB.m,'aria-pressed',!util);clunk();if(!util){say('Utility lost. UPS on battery; generator starting.');}else{say('Utility restored. Transfer back in a moment.');atsT=performance.now()+2500;}lastUI=0;}
function load(){audio();msgT=0;li=(li+1)%4;SV.forEach((s,i)=>s.on=i<=li);beep(1200,.04,.015);say(`Load ${LOADS[li]*100} percent.`);lastUI=0;}
function test(){audio();msgT=0;if(mode==='off'){note('NO OUTPUT · RESTORE MAINS');return;}testUntil=performance.now()+(reduced.matches?1200:4200);beep(900,.06,.02);say('Battery test: the UPS runs from its batteries for a few seconds.');lastUI=0;}
function byp(){audio();msgT=0;const inp=(ats==='U'&&util)||(ats==='G'&&gen==='on');if(!inp&&!bypass){note('NO INPUT · BYPASS UNAVAILABLE');say('No input supply, so bypass is unavailable.');return;}bypass=!bypass;set(keyG,'aria-pressed',bypass);set(keyB.b,'aria-pressed',bypass);clunk();say(bypass?'Static bypass: the load is not protected.':'Back on the inverter.');lastUI=0;}
function silence(){audio();silenced=true;beep(600,.05,.015);note('ALARM SILENCED');say('Alarm silenced.');}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(isoG,mains);bind(testB,test);bind(silB,silence);bind(keyG,byp);
const act={m:mains,l:load,t:test,b:byp,a:silence};Object.entries(keyB).forEach(([k,b])=>b.addEventListener('click',()=>act[k]()));
bind(loadG,load);
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const f=act[e.key.toLowerCase()];if(f){e.preventDefault();f();}});
function mimic(k,on,c){const n=MIM[k],cls='mim'+(on?' on '+c:'');if(n._c!==cls){n._c=cls;set(n,'class',cls);}}
function tick(now){
const dt=Math.min(.05,(now-(lastT||now))/1000),red=reduced.matches,ts=now/1000;lastT=now;
// Generator and transfer switch sequence.
if(!util&&gen==='off'){gen='starting';genT=now+(red?600:2600);}
if(util&&gen==='starting'){gen='off';}
if(gen==='starting'&&now>genT){gen='on';say('Generator running.');}
if(gen==='on'&&!util&&ats==='U'){ats='G';clunk();say('Transfer switch on generator. Batteries recharging.');}
if(util&&ats==='G'&&now>atsT){ats='U';clunk();gen='cool';genT=now+(red?600:4000);say('Back on utility. Generator cooling down.');}
if(gen==='cool'&&now>genT)gen='off';
const input=(ats==='U'&&util)||(ats==='G'&&gen==='on'),testing=now<testUntil;
if(!input&&bypass){bypass=false;set(keyG,'aria-pressed',false);set(keyB.b,'aria-pressed',false);say('Input lost: bypass cancelled, inverter on battery.');}
mode=charge<=.005&&!input?'off':testing&&input?'test':!input?'battery':bypass?'bypass':'online';
if(mode!==prevMode){if(mode==='battery'||mode==='off')silenced=false;prevMode=mode;lastUI=0;}
const lf=LOADS[li];
if(mode==='battery'||mode==='test')charge=Math.max(0,charge-dt*lf/40);else if(mode!=='off'&&input)charge=Math.min(1,charge+dt*.014);
// Alarm.
if(ac&&!silenced&&now>nextBeep){if(mode==='battery'){beep(2200);beep(2200,.12,.025,.22);nextBeep=now+2500;}else if(mode==='off'){beep(2600,.3,.03);nextBeep=now+600;}else if(mode==='bypass'){beep(1800,.08,.015);nextBeep=now+6000;}else nextBeep=now+300;}
// ATS handle and isolator.
const hT=ats==='G'?45:-45;if(red){hA=hT;hV=0;}else{hV+=(160*(hT-hA)-18*hV)*dt;hA+=hV*dt;}set(handle,'transform',`translate(18 37) rotate(${f2(hA)})`);
isoA+=((util?0:90)-isoA)*(red?1:clamp(dt*14));keyA+=((bypass?60:0)-keyA)*(red?1:clamp(dt*12));set(key,'transform',`translate(42 60) rotate(${f2(keyA)})`);set(isoH,'transform',`translate(18 53.5) rotate(${f2(isoA)})`);
const bk=(now/400|0)%2;
UL[0].l.classList.toggle('on',util);UL[0].h.classList.toggle('on',util);
const gl=gen==='on'||((gen==='starting'||gen==='cool')&&bk);UL[1].l.classList.toggle('on',!!gl);UL[1].h.classList.toggle('on',!!gl);
if(genG)genG.gain.setTargetAtTime(gen==='on'?.05:gen==='cool'?.025:0,ac.currentTime,.4);
// UPS LEDs and mimic.
const onB=mode==='battery'||mode==='test';
lit(UL2.LINE,input?'g':'');lit(UL2.BATT,onB?(bk||red?'a':''):'');lit(UL2.BYPASS,mode==='bypass'?'a':'');lit(UL2.FAULT,mode==='off'?(bk||red?'r':''):'');
mimic('in',input,'g');mimic('rect',input&&mode!=='bypass','b');mimic('inv',mode!=='bypass'&&mode!=='off','b');mimic('out',mode!=='off',mode==='bypass'?'a':'b');mimic('byp',mode==='bypass','a');mimic('batt',onB||(input&&charge<.999),onB?'a':'g');
for(const[k,on,c]of[['r',input&&mode!=='bypass','b'],['i',mode!=='bypass'&&mode!=='off','b'],['b',true,onB?'a':'g']]){const cls='mb'+(on?' on '+c:'');if(MB[k]._c!==cls){MB[k]._c=cls;set(MB[k],'class',cls);}}
// Charge gauge and string monitors.
const n=Math.ceil(charge*10-1e-6),gc=charge>.4?'g':charge>.2?'a':'r';
SEG.forEach((l,i)=>lit(l,i<n?(onB&&i===n-1&&!bk&&!red?'':gc):(!onB&&input&&i===n&&charge<.999&&bk&&!red?'g':'')));
MON.forEach((l,i)=>lit(l,onB?((bk+i)%2||red?'a':''):'g'));
// Load rack.
const powered=mode!=='off';if(now-lastLed>80){lastLed=now;SV.forEach(s=>{const on=s.on&&powered;lit(s.p,on?'g':'');s.a.forEach(l=>lit(l,on&&(red||Math.random()<.55)?'b':''));});}lit(pduL,powered?'g':'');
// Power flows.
const fl=(n2,on,c,dir,sp)=>{const cls='flow '+c+(on?' on':'');if(n2._c!==cls){n2._c=cls;set(n2,'class',cls);}if(!red)n2.style.strokeDashoffset=f2(-dir*ts*sp);};
fl(inF,input,'g',1,26);fl(outF,powered,onB?'a':mode==='bypass'?'a':'b',1,26);fl(dcR,onB||(input&&charge<.999),onB?'a':'g',onB?-1:1,18);fl(dcB,onB||(input&&charge<.999),onB?'a':'g',onB?1:-1,18);fl(uFeed,util,'g',-1,14);fl(gFeed,gen==='on','a',-1,14);
const mins=Math.round(charge*40/lf*2);
if(!lastUI||now-lastUI>200){
LT[0].textContent=`LOAD ${Math.round(lf*100)}%`;LT[1].textContent=`BATT ${Math.round(charge*100)}%`;bell.textContent=(onB||mode==='off')&&!silenced?'ALARM':silenced&&(onB||mode==='off')?'MUTED':'';rt.textContent=mode==='off'?'':`${mins} MIN`;
const M={online:'ON LINE',battery:'ON BATTERY',test:'BATTERY TEST',bypass:'BYPASS',off:'OUTPUT OFF'}[mode];
readout.textContent=`${M} · LOAD ${Math.round(lf*100)}% · BATT ${Math.round(charge*100)}% · ${mode==='off'?0:mins} MIN`;
const src=util?(ats==='G'?'UTILITY BACK · TRANSFER PENDING':'UTILITY OK'):'UTILITY LOST';
const g2={off:'GENERATOR STANDBY',starting:'GENERATOR STARTING',on:ats==='G'?'ON GENERATOR':'GENERATOR RUNNING',cool:'GENERATOR COOLING'}[gen];
stateLabel.textContent=now<msgT?msg:mode==='off'?'BATTERY EXHAUSTED · LOAD DOWN':mode==='bypass'?'LOAD NOT PROTECTED · '+src:`${src} · ${g2}${onB&&!silenced&&mode!=='test'?' · ALARM':''}`;
lastUI=now;}
requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['m', 'l', 't', 'b', 'a'], draw }
