// @ts-nocheck
/* KELVIN T7 · Workstation. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--screen:#1d1f20;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b3b3af;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--in:#cfd0cd;--in-top:#dcdddb;--in-side:#c2c3c0;--pcb:#3a3d3f;--pcb-line:#55595b;--hs:#c9cccb;--hs-top:#e4e6e5;--hs-side:#adb1b0;--gpu:#5b5f62;--gpu-top:#6e7276;--gpu-side:#4a4e51;--sleeve:#2f3133;--smoke:#1e2a2a;--smoke-a:.05;--mesh:#626260}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--screen:#171819;--off:#969694;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--in:#aeafad;--in-top:#cecfcd;--in-side:#898988;--pcb:#303233;--pcb-line:#474a4b;--hs:#aaabab;--hs-top:#d5d7d6;--hs-side:#7a7c7c;--gpu:#4c4f51;--gpu-top:#666a6e;--gpu-side:#333435;--sleeve:#262829;--smoke:#1a2121;--smoke-a:.14;--mesh:#515150;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.screen{fill:var(--screen)}.in{fill:var(--in)}.in.top{fill:var(--in-top)}.in.side{fill:var(--in-side)}.pcb{fill:var(--pcb)}.hs{fill:var(--hs)}.hs.top{fill:var(--hs-top)}.hs.side{fill:var(--hs-side)}.gpu{fill:var(--gpu)}.gpu.top{fill:var(--gpu-top)}.gpu.side{fill:var(--gpu-side)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.trace{fill:none;stroke:var(--pcb-line);stroke-width:.5;vector-effect:non-scaling-stroke}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.silk{fill:#9a9ea0;font:2.6px ui-monospace,monospace;letter-spacing:.3px;stroke:none}.brand{font-size:5px;letter-spacing:1.5px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.lamp{fill:var(--off);stroke:none}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.r,.lamp.b{filter:url(#glow)}
.su{fill:none;stroke:var(--line);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}.sl{fill:none;stroke:var(--sleeve);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.blade{fill:var(--top);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.blur{fill:var(--line);opacity:0;stroke:none}.rgbring{fill:none;stroke:var(--off);stroke-width:1.2}.rgb-on .rgbring{stroke:var(--accent);filter:url(#glow)}
.strip{fill:var(--off);stroke:none}.rgb-on .strip{fill:var(--accent)}.gpuglow{fill:var(--accent);opacity:0;filter:url(#bloom)}.heat{fill:var(--warn);stroke:none;opacity:0}.ramlit{fill:var(--off);stroke:none}.rgb-on .ramlit{fill:var(--accent);filter:url(#glow)}
.seg7{fill:var(--accent);font:700 4.2px ui-monospace,monospace;letter-spacing:.3px;stroke:none}.hot{fill:var(--warn)}
.pane{fill:var(--smoke);fill-opacity:var(--smoke-a);stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke;pointer-events:none}.sheen{fill:#fff;opacity:.1;pointer-events:none}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .button-face{fill:var(--top)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = ``

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* World coordinates: x lower-right; y lower-left; z up. Units ≈ 3 mm.
Part x y z w d h
feet (4) 8 8 0 134 70 4
base plate 0 0 4 150 86 4
far wall + rear wall + floor (inside) 4 4 8 142 78 120
rear exhaust fan 4 18 86 6 36 36
PCIe slot covers 4 70 46 0 10 40
tray grommets 98 4 70 12 0 32
motherboard (PCB) 12 5 44 82 0 82
PSU shroud + PSU window 4 4 8 142 78 32
drive cage (2 × SSD) 100 54 40 36 26 16
I/O cover + VRM heatsinks 12 5 94 44 10 31
graphics card + bracket 4 6 50 110 40 17
GPU power + 24-pin cables 94 5 40 26 38 60
tower cooler + fan 46 9 84 24 50 40
memory (4 DIMMs) 72 5 82 11 12 42
24-pin connector 90 5 86 4 8 22
front intake fans (2) 140 23 52 6 36 72
side glass, front glass, frame 0 0 4 150 86 128
top rim, glass, front I/O 0 0 128 150 86 4
Silkscreen, slots, LEDs, labels and screws share their parent face. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: smooth sleeved cables and a fan whose +x face sits in a SIDE plane.
const f2=v=>v.toFixed(2);
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
function cable(pts,n=3,dz=1.6){for(let k=0;k<n;k++){const d=smooth(pts.map(([x,y,z])=>[x,y+k*dz*.6,z-k*dz*.4]));el('path',{d,class:'su'});el('path',{d,class:'sl'});}}
const fans=[];
function fan(xf,yc,zc,s){
box(xf-6,yc-s/2,zc-s/2,6,s,s,3,'base');const g=group(SIDE(xf,yc,zc));
rect(g,-s/2+1,-s/2+1,s-2,s-2,3,'face base');circle(g,0,0,s/2-2,'face recess');
const blades=group('',g);for(let i=0;i<7;i++)el('path',{d:`M0,${-s*.08} Q${s*.24},${-s*.2} ${s*.13},${-s*.44} Q${-s*.04},${-s*.45} ${-s*.06},${-s*.09}Z`,class:'blade',transform:`rotate(${i*51.43})`},blades);
const blur=circle(g,0,0,s/2-2.6,'blur');circle(g,0,0,s*.13,'face top');circle(g,0,0,s/2-1.4,'rgbring');
for(const[a,b]of[[-1,-1],[1,-1],[-1,1],[1,1]])circle(g,a*(s/2-3),b*(s/2-3),1,'face recess');
fans.push({blades,blur,a:Math.random()*360});return g;
}
// Shell: feet, base, interior walls; rear fan and slot covers on the rear wall.
const sp=P(75,46,0);el('ellipse',{cx:sp[0],cy:sp[1]+4,rx:120,ry:50,class:'shadow stage-floor'});el('ellipse',{cx:sp[0],cy:sp[1]+4,rx:120,ry:50,class:'stage-contact'});
for(const[x,y]of[[8,8],[130,8],[8,70],[130,70]])box(x,y,0,12,8,4,2,'recess');
box(0,0,4,150,86,4,3,'base');
const far=group(FRONT(4,4,128));rect(far,0,0,142,120,0,'face in');
for(const v of[48,66,84])rect(far,96,v,6,12,3,'face recess');rect(far,4,40,6,10,3,'face recess');
const rw=group(SIDE(4,82,128));rect(rw,0,0,78,120,0,'face side in');
rect(group(TOP(4,4,8)),0,0,142,78,0,'face top in');
fan(10,36,104,36);
const sc=group(SIDE(4,82,128));for(let k=0;k<7;k++){rect(sc,66,42+k*5.6,10,4.6,.6,'face base');slits(sc,67,42.8+k*5.6,8,3,6);}
// Motherboard: PCB, silkscreen, slots, M.2, chipset, debug display.
const mb=group(FRONT(12,5,126));rect(mb,0,0,82,82,1.6,'face pcb');
for(let k=0;k<9;k++)el('path',{d:`M${8+k*7},82 V${70-k%3*4} L${12+k*7},${64-k%3*4} H${30+k*5}`,class:'trace'},mb);
for(const[u,v]of[[3,3],[79,3],[3,79],[79,79],[46,3],[46,79]])circle(mb,u,v,1.3,'face recess');
for(const k of[0,1,2,3])rect(mb,60+k*3,6,1.6,40,.4,'face base');
rect(mb,6,56,58,4,.6,'face base');rect(mb,6,72,40,3.4,.6,'face base');rect(mb,6,64,30,2.6,.6,'face base');
rect(mb,8,44,40,6,1.4,'face hs');text(mb,28,48.4,'M.2 · GEN5','silk center');
rect(mb,58,62,20,14,2,'face hs');text(mb,68,70.6,'KELVIN','silk center');
rect(mb,72,49,8,5.4,.8,'face screen');const post=text(mb,76,53.2,'','seg7 center');text(mb,76,57.4,'POST','silk center');
for(const k of[0,1,2,3])rect(mb,67+k*3.2,78,2.4,2.4,.4,'face base');text(mb,10,80,'T7-W PRO · LGA','silk');
// PSU shroud with its window, the drive cage on top.
box(4,4,8,142,78,32,3,'');
const sh=group(TOP(4,4,40));slits(sh,10,8,70,22,24);rect(sh,108,6,14,16,2,'face recess');rect(sh,90,4,12,10,2,'face recess');
const shf=group(FRONT(4,82,40));rect(shf,8,6,62,20,2,'face screen');rect(shf,10,8,58,16,1.4,'face base');slits(shf,12,10,30,12,14);text(shf,56,15,'1000 W','label center');text(shf,56,19.6,'TITANIUM','etch micro center');text(shf,108,17,'KELVIN','label brand center');
const shs=group(SIDE(146,82,40));slits(shs,8,8,62,14,20);
box(100,54,40,36,26,16,2,'');const cage=group(FRONT(100,80,56)),ssd=[];
for(const k of[0,1]){rect(cage,3,2+k*7,30,5.4,1,'face top');text(cage,16,5.6+k*7,`SSD ${k+1} · 4 TB`,'etch micro center');ssd.push(rect(cage,29,3.8+k*7,2.2,1.4,.4,'lamp'));}
// I/O cover, VRM heatsinks, graphics card, cables.
box(12,5,94,7,10,30,2,'hs');box(14,5,106,12,9,18,1.4,'hs');box(26,5,118,30,9,7,1.4,'hs');
const vr=group(FRONT(14,14,124));slits(vr,1,2,10,14,5);const vt=group(FRONT(26,14,125));slits(vt,2,1.4,26,4,10);
box(4,6,50,10,2,22,.6,'base');
box(14,6,50,100,40,17,3,'gpu');
const gt=group(TOP(14,6,67));rect(gt,6,4,88,32,2,'face top gpu');slits(gt,10,7,40,26,16);text(gt,72,22,'NOVA','label brand center');rect(gt,82,30,8,6,1,'face base');
const heat=rect(gt,6,4,88,32,2,'heat');
const gf=group(FRONT(14,46,67));const glow=rect(gf,12,2,76,4,2,'gpuglow');rect(gf,10,2.6,80,2.6,1.3,'strip');text(gf,20,12.6,'NOVA 9800 · 24 GB','etch');slits(gf,66,8.6,26,6,10);
const ge=group(SIDE(114,46,67));slits(ge,4,3,32,11,10);
cable([[100,40,67],[100,40,74],[104,30,80],[104,12,80],[103,5.5,80]],2,1.4);
// Tower cooler: heat pipes, fin stack, fan; memory; 24-pin and its cable.
for(const y of[14,22,30])cylinder(52+y*.1,y,108,1.6,16,'z','hs');
box(47,12,86,17,46,36,1.4,'hs');
const ft=group(TOP(47,12,122));for(let v=3;v<46;v+=3.2)line(ft,1,v,16,v);for(const[u,v]of[[5,10],[12,18],[5,26],[12,34]])circle(ft,u,v,1.5,'face recess');
const fs=group(FRONT(47,58,122));for(let v=1.6;v<36;v+=1.6)line(fs,1,v,16,v);rect(fs,3,14,11,8,1,'face top');text(fs,8.5,19,'K','label center');
fan(70,34,104,40);
const ram=[];for(const k of[0,1,2,3]){const x=72+k*3;box(x,5,82,1.8,12,42,.4,'gpu');ram.push(rect(group(FRONT(x,17,124)),.15,1,1.5,40,.6,'ramlit'));}
box(90,5,86,4,8,22,1,'base');cable([[94,9,98],[106,12,98],[114,16,86],[117,16,60],[117,15,40.5]],3,1.6);
// Front intake fans, glass panels, frame and the top with its mesh and front I/O.
fan(146,41,70,36);fan(146,41,106,36);
box(146,0,8,4,4,120,1,'');box(0,82,8,4,4,120,1,'');
const sg=group(FRONT(4,86,128));rect(sg,0,0,142,120,2,'pane');el('path',{d:'M20,120 L60,0 H74 L34,120Z M42,120 L82,0 H88 L48,120Z',class:'sheen'},sg);for(const[u,v]of[[4,4],[138,4],[4,116],[138,116]])screw(sg,u,v);
const fg=group(SIDE(150,82,128));rect(fg,0,0,78,120,2,'pane');el('path',{d:'M10,120 L44,0 H54 L20,120Z',class:'sheen'},fg);
box(146,82,8,4,4,120,1,'');
const tp=group(TOP(0,0,132));el('path',{d:'M3,0H147Q150,0 150,3V83Q150,86 147,86H3Q0,86 0,83V3Q0,0 3,0Z M10,8H136V78H10Z','fill-rule':'evenodd',class:'face top'},tp);rect(tp,10,8,126,70,1,'pane');el('path',{d:'M30,78 L70,8 H84 L44,78Z M52,78 L92,8 H97 L57,78Z',class:'sheen'},tp);
const tpf=group(FRONT(0,86,132));rect(tpf,0,0,150,4,1,'face');const tps=group(SIDE(150,86,132));rect(tps,0,0,86,4,1,'face side');
const pwr=group('',tp,{class:'control',role:'button',tabindex:'0','aria-label':'Toggle power (O)','aria-pressed':'true'});
circle(pwr,143,70,3.6,'face recess');circle(pwr,143,70,2.6,'face button-face');const pled=circle(pwr,143,70,3.1,'rgbring');circle(pwr,143,70,5,'focus-ring');
rect(tp,141.4,56,3.2,6,1,'face recess');rect(tp,141.4,46,3.2,7,.6,'face recess');rect(tp,141.4,37,3.2,7,.6,'face recess');circle(tp,143,30,1.2,'face recess');
frame([[0,0,0,150,86,132]],20);
// State: power and POST, render load, thermals, fan curve, RGB.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
let on=true,bootT=-1e9,job=null,load=0,cpuT=36,gpuT=33,watts=92,silent=false,lastT=0,lastUI=0,flashMsg='',flashUntil=0,audio=null,hum=null,humG=null;
const CODES=['00','19','A2','B4','62','79','A0'];
function ac(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!audio){audio=new A();const o=audio.createOscillator(),f=audio.createBiquadFilter();humG=audio.createGain();o.type='sawtooth';o.frequency.value=70;f.type='lowpass';f.frequency.value=220;humG.gain.value=0;o.connect(f);f.connect(humG);humG.connect(audio.destination);o.start();hum=o;}if(audio.state==='suspended')audio.resume().catch(()=>{});}catch(_){}}
function say(m){announcement.textContent=m;}
function flash(m){flashMsg=m;flashUntil=performance.now()+1500;lastUI=0;}
function lamp(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
function power(){ac();on=!on;const now=performance.now();set(pwr,'aria-pressed',on);if(on){bootT=now;say('Power on. POST.');}else{job=null;say('Shutting down.');}lastUI=0;}
function render(){ac();const now=performance.now();if(!on||now-bootT<2200){flash('POWER ON FIRST');return;}if(job){job=null;flash('RENDER CANCELLED');say('Render cancelled.');return;}job={t0:now,frames:400};say('Render started. Load ramping.');}
function profile(){ac();silent=!silent;flash(silent?'SILENT FAN PROFILE':'PERFORMANCE FAN PROFILE');say(silent?'Silent fan profile.':'Performance fan profile.');}
function lights(){ac();const v=svg.classList.toggle('rgb');flash(v?'LIGHTS ON':'LIGHTS OFF');}
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function tick(now){
const dt=Math.min(.05,(now-(lastT||now))/1000);lastT=now;
const booting=on&&now-bootT<2200,bt=now-bootT;
let target=0;
if(job){const p=(now-job.t0)/14000;if(p>=1){job=null;flash('RENDER COMPLETE · 400 FRAMES');say('Render complete.');}else target=clamp(p*8,0,1)*(.92+.08*Math.sin(now/240));}
load+=(target-load)*(reduced.matches?1:clamp(dt*1.8));
const spinUp=booting&&bt>300&&bt<1300?1:0,fanTarget=on?Math.max(spinUp,(.16+.84*load)*(silent?.62:1)):0;
for(const f of fans){f.s=f.s===undefined?fanTarget:f.s+(fanTarget-f.s)*clamp(dt*(fanTarget>f.s?2.2:.9));if(!reduced.matches){f.a=(f.a+f.s*1500*dt)%360;set(f.blades,'transform',`rotate(${f2(f.a)})`);}set(f.blur,'opacity',f2(clamp((f.s-.35)*.55,0,.32)));}
const cpuGoal=on?36+50*load+(silent?9*load+3:0):24,gpuGoal=on?33+44*load+(silent?7*load+2:0):24;
cpuT+=(cpuGoal-cpuT)*clamp(dt*(reduced.matches?60:.9));gpuT+=(gpuGoal-gpuT)*clamp(dt*(reduced.matches?60:.6));watts=on?92+560*load:0;
const rgb=svg.classList.contains('rgb')&&on&&!(booting&&bt<600);svg.classList.toggle('rgb-on',rgb);
set(glow,'opacity',f2(rgb?.18+.6*load:0));set(heat,'opacity',f2(clamp((gpuT-52)/26)*.4));
const breath=.55+.45*Math.sin(now/(job?160:900));for(const r of ram)set(r,'opacity',rgb?f2(.5+.5*breath):1);
ssd.forEach((n,k)=>lamp(n,on&&!booting?(job&&Math.random()<.35+k*.1?'':job?'b':'g'):''));
set(pled,'style',on?'stroke:var(--accent);filter:url(#glow)':'');
if(humG&&audio)humG.gain.setTargetAtTime(on?.004+.012*load:0,audio.currentTime,.3);
if(flashUntil&&now>flashUntil){flashUntil=0;lastUI=0;}
if(!lastUI||now-lastUI>180){
post.textContent=!on?'':booting?CODES[Math.min(CODES.length-1,bt/300|0)]:String(Math.round(cpuT));set(post,'class','seg7 center'+(on&&!booting&&cpuT>80?' hot':''));
readout.textContent=on||cpuT>25?`CPU ${Math.round(cpuT)}°C · GPU ${Math.round(gpuT)}°C · ${Math.round(watts)} W`:'CPU — · GPU — · 0 W';
const prof=silent?'SILENT':'PERFORMANCE';
const st=!on?'OFF · O TO POWER':booting?`BOOTING · POST ${post.textContent}`:job?`RENDERING ${Math.round(clamp((now-job.t0)/14000)*100)}% · FRAME ${String(Math.round(clamp((now-job.t0)/14000)*400)).padStart(4,'0')}/0400`:`IDLE · ${prof} FANS`;
stateLabel.textContent=flashUntil?flashMsg:st;lastUI=now;
}
requestAnimationFrame(tick);
}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)fn();}});}
bind(pwr,power);
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;
const action={o:power,r:render,s:profile,l:lights}[e.key.toLowerCase()];
if(action){e.preventDefault();action();}
});
requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], svgClass: 'rgb', draw }
