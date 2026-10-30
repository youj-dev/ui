// @ts-nocheck
/* HALCYON N4 · NAS. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--screen:#1f2122;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b3b3af;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--metal:#d4d6d6;--metal-side:#bfc2c2;--bezel:#3f4142;--bezel-top:#57595a;--bezel-side:#333536;--paper:#fbfbf7;--rubber:#4a4a48;--cavity:#1b1c1d}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--screen:#191a1b;--off:#969694;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--metal:#b3b4b4;--metal-side:#878888;--bezel:#343536;--bezel-top:#515354;--bezel-side:#222223;--paper:#d4d4d1;--rubber:#3d3d3c;--cavity:#151616;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.screen{fill:var(--screen)}.metal{fill:var(--metal)}.metal.side{fill:var(--metal-side)}.bz{fill:var(--bezel)}.bz.top{fill:var(--bezel-top)}.bz.side{fill:var(--bezel-side)}.paper{fill:var(--paper)}.cav{fill:var(--cavity)}.rubber{fill:var(--rubber)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}.dark-ink{fill:#323232}
.lamp{fill:var(--off);stroke:none}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.r,.lamp.b{filter:url(#glow)}
.oled{fill:var(--accent);font:600 3.6px ui-monospace,monospace;letter-spacing:.35px;stroke:none}.oled.dim{opacity:.6;font-weight:400}.ob{fill:none;stroke:var(--accent);stroke-width:.5;vector-effect:non-scaling-stroke}.of{fill:var(--accent);stroke:none}.halo{fill:var(--accent);opacity:0;filter:url(#bloom);transition:opacity .5s}.powered .halo{opacity:.22}.alarm .halo{fill:var(--fault)}.alarm .oled,.alarm .of{fill:var(--fault)}.alarm .ob{stroke:var(--fault)}
.pring{fill:none;stroke:var(--off);stroke-width:1.1;transition:stroke .3s}.powered .pring{stroke:var(--accent);filter:url(#glow)}.booting .pring{animation:breathe .7s ease-in-out infinite alternate}
.tab{fill:var(--top);transition:fill .2s}.out .tab{fill:var(--warn)}
.blade{fill:var(--top);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.fan{animation:spin var(--fd,.9s) linear infinite;animation-play-state:paused}.powered .fan{animation-play-state:running}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .button-face{fill:var(--top)}.sled:hover .grip{fill:var(--accent);fill-opacity:.3}
@keyframes spin{to{transform:rotate(360deg)}}@keyframes breathe{to{opacity:.35}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = ``

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* World coordinates: x lower-right; y lower-left; z up. Units ≈ 2 mm.
Part x y z w d h
rubber feet (4) 7.5 7.5 0 71 91 4
aluminium shell 0 0 4 86 104 100
top vents + brand 16 8 104 54 82 0
side fan grille + screws 86 26 24 0 52 52
front bezel 2 104 6 82 4 96
OLED strip + halo 6 108 85 60 0 13
power button + ring 70 108 86 11 0 11
bay openings (4) 5.4 108 13.4 65 0 67
status column (LEDs, USB-C, copy) 70 108 20 10 0 62
sled bodies (pulled, 0–46 out) 7 108 19 63 46 56
sled fronts (4) 6 108 14 64.2 3 66
Seams, screws, LEDs, labels and the drive label share their parent face. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helper: draw into a group.
function into(g,fn){const n=root.childNodes.length;fn();while(root.childNodes.length>n)g.appendChild(root.childNodes[n]);return g;}
// Shell: feet, aluminium wrap, top vents, side fan.
const sp=P(43,70,0);el('ellipse',{cx:sp[0],cy:sp[1]+4,rx:98,ry:42,class:'shadow stage-floor'});el('ellipse',{cx:sp[0],cy:sp[1]+4,rx:98,ry:42,class:'stage-contact'});
for(const[x,y]of[[12,12],[74,12],[12,94],[74,94]])cylinder(x,y,0,4.5,4,'z','rubber');
box(0,0,4,86,104,100,7,'');
const lid=group(TOP(0,0,104));slits(lid,17,10,52,28,20);line(lid,6,46,80,46);text(lid,43,90,'HALCYON','etch center');for(const[u,v]of[[6,6],[80,6],[6,98],[80,98]])circle(lid,u,v,1.1,'face recess');
const flank=group(SIDE(86,104,104));
circle(flank,52,50,27,'face base');circle(flank,52,50,24.5,'face recess');
const fan=el('g',{class:'fan'},group('translate(52 50)',flank));
for(let i=0;i<7;i++)el('path',{d:'M0,-4.5 Q9,-9 6.4,-22.6 Q-1,-23.4 -2.4,-5Z',class:'blade',transform:`rotate(${i*51.43})`},fan);
for(const r of[24.5,19,13.5,8])circle(flank,52,50,r,'detail');for(const a of[45,135])line(flank,52+24.5*Math.cos(a*Math.PI/180),50+24.5*Math.sin(a*Math.PI/180),52-24.5*Math.cos(a*Math.PI/180),50-24.5*Math.sin(a*Math.PI/180));
circle(flank,52,50,4.8,'face base');circle(flank,52,50,1.6,'detail');for(const[u,v]of[[29,27],[75,27],[29,73],[75,73]])screw(flank,u,v);
slits(flank,10,86,40,4,16);rect(flank,70,82,26,10,1,'face paper');text(flank,83,86.6,'N4 · SN 24-0917','etch micro center');for(let i=0;i<14;i++)line(flank,72+i*1.6,88.2,72+i*1.6,90.6);
// Bezel: OLED strip, power button, bay openings, status column.
box(2,104,6,82,4,96,4,'bz');
const bez=group(FRONT(2,108,102));
rect(bez,4,4,60,13,2,'face recess');rect(bez,5.2,5.2,57.6,10.6,1.4,'face screen');rect(bez,8,7,52,7,2,'halo');
const L1=text(bez,8,10.2,'','oled'),L2=text(bez,8,14.4,'','oled dim');
const barBox=rect(bez,32,12,26,2.2,.6,'ob'),barFill=rect(bez,32.4,12.4,0,1.4,.3,'of');
const pwr=group('',bez,{class:'control',role:'button',tabindex:'0','aria-label':'Toggle power (O)','aria-pressed':'true'});
circle(pwr,73,10.5,5.6,'face recess');circle(pwr,73,10.5,4.5,'pring');circle(pwr,73,10.5,3.5,'face button-face');
el('path',{d:'M71.6,9.2 A2,2 0 1 0 74.4,9.2 M73,8 V10.4',class:'detail'},pwr);circle(pwr,73,10.5,7.6,'focus-ring');
for(let i=0;i<4;i++)rect(bez,3.4+16.4*i,21.4,16.2,67.2,2.4,'face cav');
const statusL=circle(bez,74,25.5,1.1,'lamp'),lanL=circle(bez,74,34,1.1,'lamp');
text(bez,74,29.6,'STATUS','etch micro center');text(bez,74,38.1,'LAN','etch micro center');
rect(bez,71.2,64,5.6,2.6,1.3,'face base');text(bez,74,70,'USB-C','etch micro center');
const copy=rect(bez,70.4,74,7.2,4.4,1.6,'face button-face');text(bez,74,81.6,'COPY','etch micro center');
text(bez,36,95.4,'HALCYON · N4','etch center');
// Sleds: dynamic body (clipped at the bezel plane) and a sliding front plate.
const sleds=[];
for(let i=0;i<4;i++){
const bx=6+16.4*i,g=el('g',{class:'control sled',role:'button',tabindex:'0','aria-label':`Pull or insert drive ${i+1} (${i+1})`,'aria-pressed':'false'});
const topG=group(TOP(bx+1,108,75),g),topR=rect(topG,0,0,13,0,1,'face top base'),ridges=[3,6.5,10].map(u=>line(topG,u,2,u,2));
const sideG=group('',g),sideR=rect(sideG,0,0,0,56,1,'face side metal');
const cp=el('clipPath',{id:`clip${i}`},svg.querySelector('defs')),cpR=rect(cp,0,0,0,56,0,'');
const lab=group('',sideG,{'clip-path':`url(#clip${i})`}),labT=group('',g.parentNode,{'clip-path':`url(#clip${i})`,'pointer-events':'none'});
rect(lab,5,8,40,38,1.6,'face paper');text(labT,25,15.4,'HALCYON','label center dark-ink');text(labT,25,25.6,'8 TB','label brand center dark-ink');text(labT,25,30.6,'NAS 7200 RPM · SATA 6 Gb/s','etch micro center');
for(let k=0;k<22;k++)rect(lab,10+k*1.38,34,k%3?.5:.9,6,0,'face dark-ink');text(labT,25,43.6,`S/N HN8T-${4071+i*13}`,'etch micro center');
for(const v of[3,50])rect(lab,47,v,10,3,1,'face recess');
const railT=rect(sideG,0,0,0,3.4,.5,'face base'),railB=rect(sideG,0,52.6,0,3.4,.5,'face base');
const plate=into(group('',g),()=>{box(bx,108,14,15,3,66,2.4,'');});
const pf=group(FRONT(bx,111,80),plate);
const led=rect(pf,5.4,3.2,4.2,1.5,.5,'lamp');
rect(pf,3,8,9,15,4,'face recess');rect(pf,4.4,9.6,6.2,11.8,3,'face base grip');
for(let v=28;v<52;v+=3)rect(pf,3.5,v,8,1.1,.5,'face recess');
rect(pf,4,55.4,7,4.6,1.2,'face top');rect(pf,5.4,56.6,4.2,2.2,.6,'tab');text(pf,7.5,64.2,String(i+1),'etch micro center');
rect(pf,0,0,15,66,0,'hit');rect(pf,-1.2,-1.2,17.4,68.4,3,'focus-ring');
sleds.push({i,bx,g,topR,ridges,sideG,labT,sideR,cpR,railT,railB,plate,led,st:'ok',s:0,from:0,to:0,t0:0});
}
frame([[0,0,0,86,104,104],[2,104,6,82,4,96],[6,108,14,64,49,66]],24);
// State: power, hot-swap sleds, RAID 5 health and rebuild, transfers.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const OUT=46;
let on=true,bootUntil=0,busy=false,prog=0,mbps=0,lastUI=0,flashMsg='',flashUntil=0,audio=null,wasMissing=0;
function ac(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!audio)audio=new A();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch(_){}}
function beep(f,d,g,at=0){if(!audio)return;try{const o=audio.createOscillator(),v=audio.createGain(),t=audio.currentTime+at;o.type='square';o.frequency.setValueAtTime(f,t);v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(g,t+.005);v.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(v);v.connect(audio.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
function say(m){announcement.textContent=m;}
function flash(m){flashMsg=m;flashUntil=performance.now()+1600;lastUI=0;}
function lamp(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
const ease=t=>t<=0?0:t>=1?1:t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function place(d){
const s=d.s,bx=d.bx;
set(d.topR,'height',s);for(const n of d.ridges)set(n,'y2',Math.max(2,s-3));set(d.sideG,'transform',SIDE(bx+14,108+s,75));set(d.labT,'transform',SIDE(bx+14,108+s,75));for(const n of[d.sideR,d.cpR,d.railT,d.railB])set(n,'width',s);
set(d.plate,'transform',`translate(${(-s*C).toFixed(2)} ${(s*S).toFixed(2)})`);
}
function swap(i){
ac();const d=sleds[i],now=performance.now();if(d.to!==d.s&&!reduced.matches&&now-d.t0<560)return;
if(d.st==='out'){d.from=d.s;d.to=0;d.t0=now;d.g.classList.remove('out');flash(`INSERTING DRIVE ${i+1}`);say(`Drive ${i+1} inserted.`);}
else{d.st='out';d.from=d.s;d.to=OUT;d.t0=now;d.g.classList.add('out');say(`Drive ${i+1} pulled.`);beep(1300,.04,.012);}
set(d.g,'aria-pressed',d.st==='out');if(reduced.matches){d.s=d.to;place(d);if(d.to===0)seat(d);}lastUI=0;
}
function seat(d){d.st='sync';if(missing()===0)prog=Math.min(prog,0);beep(900,.03,.012);flash(`DRIVE ${d.i+1} SEATED`);}
const missing=()=>sleds.filter(d=>d.st==='out').length;
function power(){ac();on=!on;const now=performance.now();svg.classList.toggle('powered',on);set(pwr,'aria-pressed',on);if(on){bootUntil=now+(reduced.matches?0:2300);say('Power on. Booting.');}else{busy=false;say('Power off.');}lastUI=0;}
function transfer(){ac();if(!on||performance.now()<bootUntil){flash('POWER ON FIRST');return;}if(missing()>=2){flash('VOLUME OFFLINE');return;}busy=!busy;flash(busy?'TRANSFER STARTED':'TRANSFER DONE');say(busy?'File transfer started.':'File transfer finished.');}
function tick(now){
for(const d of sleds)if(d.s!==d.to){const p=reduced.matches?1:Math.min(1,(now-d.t0)/(d.to?560:520));d.s=d.from+(d.to-d.from)*ease(p);place(d);if(p>=1){d.s=d.to;place(d);if(d.to===0&&d.st==='out')seat(d);}}
const booting=on&&now<bootUntil,miss=missing(),failed=miss>=2,syncing=sleds.some(d=>d.st==='sync');
if(on&&!booting&&miss!==wasMissing){if(miss>wasMissing){beep(1900,.12,.02);beep(1900,.12,.02,.22);flash(miss>=2?'VOLUME FAILED':'ARRAY DEGRADED');say(miss>=2?'Two drives missing. Volume offline.':'Drive missing. Array degraded.');}wasMissing=miss;}
if(failed)busy=false;
if(on&&!booting&&miss===0&&syncing){prog+=(reduced.matches?1:(now-(tick.last||now))/7200);if(prog>=1){prog=0;for(const d of sleds)if(d.st==='sync')d.st='ok';flash('REBUILD COMPLETE');say('Rebuild complete. Array healthy.');}}
tick.last=now;
const io=on&&!booting&&!failed&&(busy||(syncing&&miss===0));
svg.style.setProperty('--fd',(io?.38:.9)+'s');svg.classList.toggle('booting',booting);svg.classList.toggle('alarm',on&&!booting&&failed);
sleds.forEach((d,k)=>{
let c='';
if(on&&d.st!=='out'){
if(booting)c=now-bootUntil+2300>500+k*350?'g':'';
else if(failed)c=(now/600|0)%2?'r':'';
else if(d.st==='sync')c=miss?'a':((now/180|0)%2||reduced.matches?'a':'');
else c=io&&!reduced.matches&&Math.random()<.35?'':'g';
}
lamp(d.led,c);
});
lamp(statusL,!on?'':booting?((now/300|0)%2?'g':''):failed?'r':miss||syncing?((now/400|0)%2||reduced.matches?'a':''):'g');
lamp(lanL,on&&!booting?(busy&&!reduced.matches&&Math.random()<.4?'':'g'):'');
if(flashUntil&&now>flashUntil){flashUntil=0;lastUI=0;}
if(!lastUI||now-lastUI>200){
const target=io?(busy?(miss?190:syncing?240:420)*(.9+.2*Math.random()):38*(.8+.4*Math.random())):0;mbps+=(target-mbps)*.45;if(target===0&&mbps<1)mbps=0;
const present=4-miss,out=sleds.filter(d=>d.st==='out').map(d=>d.i+1).join(' + ');
readout.textContent=`${present}/4 DRIVES · ${Math.round(mbps)} MB/s`;
const pct=Math.round(prog*100);
const st=!on?'STANDBY · O TO POWER':booting?'BOOTING · SPINNING UP':failed?'FAILED · VOLUME OFFLINE':miss?`DEGRADED · BAY ${out} OUT`:syncing?`REBUILDING ${pct}%`:`HEALTHY · ${busy?'TRANSFER':'IDLE'}`;
stateLabel.textContent=flashUntil?flashMsg:st;
const ol=!on?['','']:booting?['HALCYON OS 7','STARTING SERVICES'+'.'.repeat((now/300|0)%4)]:failed?['VOLUME FAILED',`BAYS ${out} OUT`]:miss?[`DEGRADED · BAY ${out}`,'INSERT DRIVE']:syncing?[`REBUILD ${pct}%`,'']:['RAID 5 · HEALTHY',busy?`▲ ${Math.round(mbps)} MB/s`:'21.8 TB FREE · 34°C'];
L1.textContent=ol[0];L2.textContent=ol[1];
const bar=on&&!booting&&syncing&&!miss;set(barBox,'opacity',bar?1:0);set(barFill,'width',bar?25.2*prog:0);
lastUI=now;
}
requestAnimationFrame(tick);
}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)fn();}});}
bind(pwr,power);sleds.forEach((d,i)=>bind(d.g,()=>swap(i)));copy.addEventListener('click',transfer);
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;
const k=e.key.toLowerCase(),n=parseInt(k,10);
const action=n>=1&&n<=4?()=>swap(n-1):{o:power,t:transfer}[k];
if(action){e.preventDefault();action();}
});
sleds.forEach(place);requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], svgClass: 'powered', draw }
