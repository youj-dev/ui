// @ts-nocheck
/* ORRIS S8–X · Network switch. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--screen:#2b2d2e;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b3b3af;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--jacket:#f6f6f2;--plug:#e4e8ea;--fiber:#5bb2aa;--bund:#d2d2ce;--tie:#3b3b3a;--metal:#d6d6d2}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--screen:#232425;--off:#969694;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--jacket:#cfcfcd;--plug:#c1c3c5;--fiber:#4b958f;--bund:#b1b1ae;--tie:#303030;--metal:#b4b4b2;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.screen{fill:var(--screen)}.metal{fill:var(--metal)}.plug{fill:var(--plug)}.boot{fill:var(--jacket)}.fibre{fill:var(--fiber)}.paper{fill:var(--top)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:5px;letter-spacing:1.3px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.cu{fill:none;stroke:var(--line);stroke-width:3.3;stroke-linecap:round;stroke-linejoin:round}.cm{fill:none;stroke:var(--jacket);stroke-width:2.1;stroke-linecap:round;stroke-linejoin:round}.fib .cu{stroke-width:2.7}.fib .cm{stroke:var(--fiber);stroke-width:1.5}.bund{stroke:var(--bund)}.tie{fill:none;stroke:var(--tie);stroke-width:2.6;stroke-linecap:round}.ring-under{fill:none;stroke:var(--line);stroke-width:2.9;stroke-linecap:round;stroke-linejoin:round}.ring{fill:none;stroke:var(--metal);stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.pulse{fill:none;stroke:var(--accent);stroke-width:.95;stroke-linecap:round;stroke-dasharray:1.6 14.4;opacity:0;transition:opacity .3s;animation:dash var(--pd,1s) linear infinite}.live .pulse{opacity:.9}.l1 .pulse,.l2 .pulse{stroke-dasharray:1.6 6.4}.fib .pulse{stroke-width:.9}
.cg .cu,.cg .cm{transition:stroke-dashoffset .5s cubic-bezier(.3,.7,.2,1)}.pg{transition:opacity .2s,transform .28s cubic-bezier(.2,.8,.2,1)}.pg.off{opacity:0;transform:translate(-5.2px,3px);pointer-events:none}.nt *{transition:none!important}
.lamp{fill:var(--off);stroke:none}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.r,.lamp.b{filter:url(#glow)}
.seg{fill:var(--accent);font:700 5.6px ui-monospace,monospace;letter-spacing:.4px;opacity:.12;stroke:none}.powered .seg{opacity:1}.halo{fill:var(--accent);opacity:0;filter:url(#bloom);transition:opacity .4s}.powered .halo{opacity:.3}.rk{fill:var(--off);transition:fill .2s}.powered .rk{fill:var(--accent);filter:url(#glow)}
.blade{fill:var(--top);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.fan{animation:spin var(--fd,.6s) linear infinite;animation-play-state:paused}.powered .fan{animation-play-state:running}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.port:hover .jack{fill:var(--accent);fill-opacity:.3}.control:hover .rkf{fill:var(--top)}
@keyframes dash{to{stroke-dashoffset:-16}}@keyframes spin{to{transform:rotate(360deg)}}
@media(prefers-reduced-motion:reduce){.live .pulse{opacity:.6}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = ``

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* World coordinates: x lower-right; y lower-left; z up. Units ≈ 2 mm, 1U = 22.
Part x y z w d h
feet (4) 3 3 0 123 66 4
plinth 0 0 4 129 72 7
rear posts (2) 0 0 11 129 9 92
front-left post 0 63 11 9 9 92
rear cable bundle + grommet 104 12 11 12 46 82
PDU body 9 28 13 111 44 22
switch body + side fan 9 12 35 111 60 22
patch panel body 9 58 79 111 14 22
front-right post 120 63 11 9 9 92
top plate + brush slot 0 0 103 129 72 6
PDU front (rocker, ammeter, 4 outlets) 0 72 13 129 2 22
switch front (8 ports, 2 SFP+, LEDs) 0 72 35 129 2 22
cable manager front + 4 D-rings 0 72 57 129 15 22
patch panel front (12 keystones) 0 72 79 129 2 22
plugs, boots, SFP module 13 74 41 102 7.4 53
patch cables + fiber uplink 15 74 41 98 13.6 53
Seams, screws, holes, LEDs and labels share their parent face. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: draw into a group; smooth 3D cable through points.
function into(g,fn){const n=root.childNodes.length;fn();while(root.childNodes.length>n)g.appendChild(root.childNodes[n]);return g;}
const f2=v=>v.toFixed(2);
function smooth(pts){
const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;
for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];
d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}
return d;
}
function holes(g,u,a,b){for(let v=a;v<b;v+=7.33)rect(g,u,v,2.2,2.2,.4,'face recess');}
const panel=(zb,cls)=>{box(0,72,zb+.3,129,2,21.4,2.2,cls);const g=group(FRONT(0,74,zb+21.7));screw(g,4.5,10.7);screw(g,124.5,10.7);rect(g,3,4,3,2,1,'face recess');rect(g,123,4,3,2,1,'face recess');return g;};
// Frame: feet, plinth, rear and left posts, rear cable bundle.
const sp=P(66,40,0);el('ellipse',{cx:sp[0],cy:sp[1]+4,rx:104,ry:44,class:'shadow stage-floor'});el('ellipse',{cx:sp[0],cy:sp[1]+4,rx:104,ry:44,class:'stage-contact'});
for(const[x,y]of[[3,3],[116,3],[3,59],[116,59]])box(x,y,0,10,10,4,2,'recess');
box(0,0,4,129,72,7,3,'base');
const plinth=group(FRONT(0,72,11));text(plinth,64.5,4.7,'FIELDFRAME 10 · 4U OPEN RACK','etch center');screw(plinth,6,3.5);screw(plinth,123,3.5);
ellipse(110,13,11.05,5.6,'z','face recess');
box(0,0,11,9,9,92,1.5,'');box(120,0,11,9,9,92,1.5,'');holes(group(FRONT(120,9,103)),3.4,3,90);holes(group(SIDE(129,9,103)),3.4,3,90);holes(group(FRONT(0,9,103)),3.4,3,90);
box(0,63,11,9,9,92,1.5,'');
for(const[k,x]of[[0,106],[1,110],[2,114]]){const d=smooth([[x,58,91-k*1.6],[x,34,91-k*1.6],[x,17,88-k],[x,13,72],[x,13,30],[x,13,11.4]]);el('path',{d,class:'cu'});el('path',{d,class:'cm bund'});}
// Device bodies, bottom to top; side vents, fan and labels show through the open side.
box(9,28,13,111,44,22,2,'base');
const pduSide=group(SIDE(120,72,35));rect(pduSide,14,5,26,9,1,'face top');text(pduSide,27,10.9,'16 A · 230 V~','etch micro center');slits(pduSide,14,16,30,3.4,10);
box(9,12,35,111,60,22,2,'');
const swSide=group(SIDE(120,72,57));slits(swSide,11,4,24,14,9);circle(swSide,47,11,8.8,'face recess');
const fan=el('g',{class:'fan'},group('translate(47 11)',swSide));
for(let i=0;i<5;i++)el('path',{d:'M0,-1.4 Q3.2,-3.2 1.6,-7.6 Q-1.6,-7.4 -1.2,-1.6Z',class:'blade',transform:`rotate(${i*72})`},fan);
for(const r of[8.8,6,3.2])circle(swSide,47,11,r,'detail');line(swSide,38.2,11,55.8,11);line(swSide,47,2.2,47,19.8);
circle(swSide,47,11,1.6,'face base');screw(swSide,56,3.2);screw(swSide,56,18.8);
box(9,58,79,111,14,22,2,'base');
const ppSide=group(SIDE(120,72,101));slits(ppSide,4,5,4,12,3);
box(120,63,11,9,9,92,1.5,'');holes(group(SIDE(129,72,103)),3.4,3,90);
box(0,0,103,129,72,6,3,'');
const lid=group(TOP(0,0,109));rect(lid,30,7,69,9,4.5,'face recess');for(let u=34;u<96;u+=2.4)line(lid,u,8.4,u,14.6);
for(const[u,v]of[[4.5,4.5],[124.5,4.5],[4.5,67.5],[124.5,67.5]])screw(lid,u,v);slits(lid,34,30,61,20,16);for(const u of[14,115])rect(lid,u-4,30,8,20,2,'face');
const lidF=group(FRONT(0,72,109));text(lidF,64.5,4.2,'ORRIS · FIELDFRAME','etch center');
// Front panels: power strip, switch, cable manager, patch panel.
const pdu=panel(13,'base');
const rocker=group('',pdu,{class:'control',role:'button',tabindex:'0','aria-label':'Toggle power (O)','aria-pressed':'true'});
rect(rocker,10.5,4.2,11,13,2,'face recess');const rk=rect(rocker,12,5.6,8,10.2,1.6,'face rk rkf');line(rocker,16,7.6,16,10.2);circle(rocker,16,13.3,1.3,'detail');rect(rocker,8.6,2.4,14.8,16.6,3,'focus-ring');
rect(pdu,25,5,21,11.6,1.6,'face recess');rect(pdu,26.4,6.4,18.2,8.8,1,'face screen');rect(pdu,28,8,15,5.6,1,'halo');
const amps=text(pdu,35.5,12.8,'0.00A','seg center');text(pdu,35.5,19.6,'LOAD','etch micro center');
for(let i=0;i<4;i++){const cx=57+17.2*i;circle(pdu,cx,10.7,7,'face recess');circle(pdu,cx,10.7,5.7,'face');circle(pdu,cx-2.3,10.7,.95,'face recess');circle(pdu,cx+2.3,10.7,.95,'face recess');rect(pdu,cx-1,4.4,2,1.6,.4,'face metal');rect(pdu,cx-1,15.4,2,1.6,.4,'face metal');}
const sw=panel(35,'');
text(sw,17.6,5.2,'ORRIS','label center');
const sysL=['PWR','SYS','FLT'].map((n,k)=>{text(sw,103.2+k*5.6,6.6,n,'etch micro center');return circle(sw,103.2+k*5.6,3.4,.95,'lamp');});text(sw,17.6,12.6,'S8–X','etch center');text(sw,17.6,16.4,'2.5G','etch micro center');
circle(sw,23.4,19.4,.8,'face recess');
const portCtl=[],act=[],spd=[];
for(let i=0;i<8;i++){
const x0=27.4+9*i,g=group('',sw,{class:'control port',role:'button',tabindex:'0','aria-label':`Patch port ${i+1} (${i+1})`,'aria-pressed':'false'});
rect(g,x0,7.7,8.2,8,1,'face recess');rect(g,x0+1,9.2,6.2,5.4,.6,'face glass jack');rect(g,x0+2.9,13.6,2.4,1.6,.3,'face recess');
for(let k=0;k<4;k++)line(g,x0+2.1+k*1.3,9.7,x0+2.1+k*1.3,10.9);
spd.push(rect(g,x0+.6,19.5,2.8,1.3,.4,'lamp'));act.push(rect(g,x0+4.8,19.5,2.8,1.3,.4,'lamp'));
text(g,x0+4.1,6.2,String(i+1),'etch micro center');rect(g,x0,4,8.2,16,0,'hit');rect(g,x0-1,3.6,10.2,16.6,1.6,'focus-ring');portCtl.push(g);
}
const sfpL=[];for(const u of[101,109.6]){rect(sw,u,8.7,7.6,6,.6,'face metal');rect(sw,u+.9,9.6,5.8,4.2,.4,'face recess');sfpL.push(rect(sw,u+4.4,19.5,2.8,1.3,.4,'lamp'));}
rect(sw,110.6,10.2,5.6,3,.8,'face base');
const mg=panel(57,'base'),RINGS=[26,50,74,101];
for(const x of RINGS){rect(mg,x-8,7.6,16,6.2,1.4,'face top');screw(mg,x-5.6,10.7);screw(mg,x+5.6,10.7);}
for(const x of RINGS)for(const s of[-6,6]){wire([[x+s,74,68],[x+s,81,68]],'ring-under');wire([[x+s,74,68],[x+s,81,68]],'ring');}
const pp=panel(79,'');
for(let i=0;i<12;i++){
const x0=13+8.6*i;text(pp,x0+3.6,4.3,String(i+1),'etch micro center');
const g=i<8?group('',pp,{class:'control'}):pp;
if(i===11){rect(g,x0,5.5,7.2,10,1,'face fibre');rect(g,x0+.9,8,2.4,4.4,.4,'face recess');rect(g,x0+3.9,8,2.4,4.4,.4,'face recess');}
else{rect(g,x0,5.5,7.2,10,1,'face base');rect(g,x0+1,8.2,5.2,4.8,.6,'face glass'+(i<8?' jack':''));rect(g,x0+2.4,12.4,2.4,1.3,.3,'face recess');}
if(i<8){rect(g,x0,4,7.2,13,0,'hit');g.addEventListener('click',()=>patch(i));}
}
rect(pp,12,16.6,105,3.4,.6,'face paper');for(let i=1;i<12;i++)line(pp,12.4+8.6*i,16.9,12.4+8.6*i,19.7);text(pp,64.5,19.2,'DESK 1–8 · UPLINK 12','etch micro center');
// Patch plugs and cables: one plug group (behind) and one cable group (in front) per port.
const plugLayer=el('g',{}),cableLayer=el('g',{}),plugG=[],cabG=[],cabP=[],cabL=[];
const px=i=>16.6+8.6*i,sx=i=>31.5+9*i,RING_OF=[0,0,1,1,1,2,2,2],OFF=[-1.6,1.6,-2.4,0,2.4,-2.4,0,2.4];
const route=(xp,zp,xr,xs,zs,y0=81.4,y1=81.4)=>smooth([[xp,y0,zp],[xp+(xr-xp)*.3,85.4,zp-9],[xr,83.6,68],[xs+(xr-xs)*.3,85.4,54],[xs,84.4,48.4],[xs,y1,zs]]);
function plug(x,z){box(x-3.1,74,z-3.2,6.2,4.4,6.4,1,'plug');box(x-2,78.4,z-2.2,4,3,4.4,1.2,'boot');const f=group(FRONT(x-3.1,78.4,z+3.2));line(f,1.2,1.4,5,1.4);}
function cable(g,d){const n=[el('path',{d,class:'cu'},g),el('path',{d,class:'cm'},g)];el('path',{d,class:'pulse'},g);return n;}
for(let i=0;i<8;i++){
plugG.push(into(el('g',{class:'pg off'},plugLayer),()=>{plug(px(i),90.2);plug(sx(i),45);}));
const g=el('g',{class:'cg'},cableLayer),d=route(px(i),90.2,RINGS[RING_OF[i]]+OFF[i],sx(i),45);
cabG.push(g);cabP.push(cable(g,d));
}
into(plugLayer,()=>{box(101.2,74,42.2,7.2,5,5.6,.6,'metal');box(102.4,79,42.9,4.8,3.2,4.2,.8,'fibre');box(108.7,74,87.5,5,3.6,5.4,.8,'fibre');});
const fibG=el('g',{class:'cg fib'},cableLayer);cable(fibG,route(111.2,90.2,102.6,104.8,45,77.6,82.2));
for(const x of RINGS){const pts=[];for(let a=180;a>=0;a-=15)pts.push([x+6*Math.cos(a*Math.PI/180),81+6*Math.sin(a*Math.PI/180),68]);wire(pts,'ring-under');wire(pts,'ring');}
frame([[0,0,0,129,72,109],[0,72,13,129,16,88]],20);
// State: power, patching, links, traffic and a port that fails and recovers.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const LOADS=['IDLE','BUSY','PEAK'],RATE=[.05,.95,2.2],BLINK=[1,2.6,5.5];
const ports=[1,1,1,0,1,1,0,0].map(v=>({patched:!!v,st:'up',until:0,blinkAt:0,dark:0,rec:false}));
let on=true,bootAt=-1e9,bootUntil=0,wasBooting=false,load=1,last=null,gbps=0,lastUI=0,flashMsg='',flashUntil=0,audio=null;
function ac(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!audio)audio=new A();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch(_){}}
function tone(f,d,g){if(!audio)return;try{const o=audio.createOscillator(),v=audio.createGain(),t=audio.currentTime;o.type='triangle';o.frequency.setValueAtTime(f,t);v.gain.setValueAtTime(g,t);v.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(v);v.connect(audio.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
function say(m){announcement.textContent=m;}
function flash(m){flashMsg=m;flashUntil=performance.now()+1500;lastUI=0;}
function lamp(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
function showCable(i,vis){plugG[i].classList.toggle('off',!vis);for(const n of cabP[i])n.style.strokeDashoffset=vis?0:cabL[i]+4;set(portCtl[i],'aria-pressed',vis);}
function patch(i){
ac();const p=ports[i],now=performance.now();p.patched=!p.patched;last=i;showCable(i,p.patched);
if(p.patched){p.st=on&&now>=bootUntil?'neg':'down';p.until=now+(reduced.matches?0:900);flash(`PORT ${i+1} PATCHED`);say(`Port ${i+1} patched. Negotiating link.`);tone(1500,.04,.02);}
else{p.st='down';p.rec=false;flash(`PORT ${i+1} UNPATCHED`);say(`Port ${i+1} unpatched.`);tone(900,.04,.015);}
}
function power(){
ac();on=!on;const now=performance.now();svg.classList.toggle('powered',on);set(rocker,'aria-pressed',on);
for(const p of ports){p.st='down';p.rec=false;}
if(on){bootAt=now;bootUntil=now+(reduced.matches?0:1900);wasBooting=true;say('Power on. Switch booting.');}else say('Power off.');
lastUI=0;
}
function traffic(){ac();load=(load+1)%3;svg.classList.remove('l0','l1','l2');svg.classList.add('l'+load);svg.style.setProperty('--pd',[2,1,.5][load]+'s');svg.style.setProperty('--fd',[.9,.55,.3][load]+'s');flash(`LOAD ${LOADS[load]}`);say(`Traffic ${LOADS[load].toLowerCase()}.`);}
function fault(){
ac();const now=performance.now();if(!on||now<bootUntil){flash('POWER ON FIRST');return;}
const pick=[last,0,1,2,3,4,5,6,7].find(i=>i!==null&&ports[i].st==='up');
if(pick===undefined){flash('NO LINK TO FAIL');return;}
const p=ports[pick];p.st='fault';p.until=now+(reduced.matches?600:1900);p.rec=true;last=pick;flashUntil=0;say(`Port ${pick+1} down. Link lost.`);tone(220,.18,.03);lastUI=0;
}
function tick(now){
const booting=on&&now<bootUntil;
if(wasBooting&&on&&!booting){wasBooting=false;ports.forEach((p,i)=>{if(p.patched){p.st='neg';p.until=now+(reduced.matches?0:300+i*160);}});say('Switch ready.');}
let up=0,faultAt=-1,negAt=-1;
ports.forEach((p,i)=>{
if(!p.patched)p.st='down';
else if(on&&!booting){
if(p.st==='down'){p.st='neg';p.until=now+900;}
if(p.st==='fault'&&now>p.until){p.st='neg';p.until=now+(reduced.matches?0:1300);}
if(p.st==='neg'&&now>p.until){p.st='up';if(p.rec){p.rec=false;flash(`PORT ${i+1} RECOVERED`);say(`Port ${i+1} link restored.`);}}
}
let a='',b='';
if(on){
if(booting){if(now-bootAt<650)a=b='a';}
else if(p.st==='neg')a=reduced.matches||(now/130|0)%2?'a':'';
else if(p.st==='fault')a='r';
else if(p.st==='up'){if(now>p.blinkAt){p.dark=now+45;p.blinkAt=now+(70+Math.random()*460)/BLINK[load];}a=now<p.dark&&!reduced.matches?'':'g';b='b';}
}
lamp(act[i],a);lamp(spd[i],b);cabG[i].classList.toggle('live',on&&!booting&&p.st==='up');
if(p.st==='up')up++;if(p.st==='fault')faultAt=i;if(p.st==='neg'&&p.rec)negAt=i;
});
const ready=on&&!booting;fibG.classList.toggle('live',ready);
lamp(sysL[0],on?'g':'');lamp(sysL[1],!on?'':booting?((now/160|0)%2?'b':''):(now%2400<120?'':'b'));lamp(sysL[2],faultAt>=0?'r':'');
lamp(sfpL[0],ready?(now%(900/BLINK[load])<60&&!reduced.matches?'':'g'):'');lamp(sfpL[1],'');
if(flashUntil&&now>flashUntil){flashUntil=0;lastUI=0;}
if(!lastUI||now-lastUI>220){
const target=ready?ports.reduce((s,p)=>s+(p.st==='up'?RATE[load]*(.75+.5*Math.random()):0),0):0;gbps+=(target-gbps)*.4;if(target===0&&gbps<.01)gbps=0;
readout.textContent=`${up}/8 UP · ${gbps.toFixed(2)} Gb/s`;
amps.textContent=on?`${(.24+.03*up+.08*load+Math.random()*.02).toFixed(2)}A`:'0.00A';
stateLabel.textContent=flashUntil?flashMsg:!on?'STANDBY · O TO POWER':booting?'BOOTING · SELF TEST':faultAt>=0?`PORT ${faultAt+1} DOWN · LINK LOST`:negAt>=0?`PORT ${negAt+1} RENEGOTIATING`:`FORWARDING · ${LOADS[load]}`;
lastUI=now;
}
requestAnimationFrame(tick);
}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)fn();}});}
bind(rocker,power);portCtl.forEach((g,i)=>bind(g,()=>patch(i)));
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;
const k=e.key.toLowerCase(),n=parseInt(k,10);
const action=n>=1&&n<=8?()=>patch(n-1):{o:power,t:traffic,f:fault}[k];
if(action){e.preventDefault();action();}
});
svg.classList.add('nt');
cabP.forEach((n,i)=>{cabL[i]=n[0].getTotalLength();for(const p of n){p.style.strokeDasharray=`${cabL[i]} ${cabL[i]+8}`;}showCable(i,ports[i].patched);});
svg.style.setProperty('--pd','1s');svg.style.setProperty('--fd','.55s');
requestAnimationFrame(()=>requestAnimationFrame(()=>svg.classList.remove('nt')));
requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], svgClass: 'powered l1', draw }
