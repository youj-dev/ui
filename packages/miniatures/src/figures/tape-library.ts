// @ts-nocheck
/* STRATA A10 · Tape library. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--screen:#1f2122;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b3b3af;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--metal:#d4d6d6;--cavity:#2a2c2d;--tape:#3c3e3f;--paper:#fbfbf7;--in:#8e918f;--in-top:#a3a6a4;--in-side:#7f8280;--in-lit:#c9ccca;--in-lit-top:#dcdfdd;--in-lit-side:#b8bbb9;--smoke:#1e2a2a;--smoke-a:.08}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--screen:#191a1b;--off:#969694;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--metal:#b3b4b4;--cavity:#222324;--tape:#313333;--paper:#d4d4d1;--in:#777978;--in-top:#989b99;--in-side:#595a59;--in-lit:#aaabaa;--in-lit-top:#ced1cf;--in-lit-side:#828382;--smoke:#1a2121;--smoke-a:.16;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.screen{fill:var(--screen)}.metal{fill:var(--metal)}.cav{fill:var(--cavity)}.tape{fill:var(--tape)}.paper{fill:var(--paper)}.tab{fill:var(--warn)}.in{fill:var(--in);transition:fill .5s}.in.top{fill:var(--in-top)}.in.side{fill:var(--in-side)}.lit .in{fill:var(--in-lit)}.lit .in.top{fill:var(--in-lit-top)}.lit .in.side{fill:var(--in-lit-side)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.nano{font:1.9px ui-monospace,monospace;letter-spacing:.1px;fill:#2b2b2b;stroke:none}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}.bars{fill:#2b2b2b;stroke:none}
.lamp{fill:var(--off);stroke:none}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.r,.lamp.b{filter:url(#glow)}
.scr{fill:var(--accent);font:600 2.9px ui-monospace,monospace;letter-spacing:.2px;stroke:none}.scr.dim{opacity:.55;font-weight:400}.halo{fill:var(--accent);opacity:.22;filter:url(#bloom)}
.bar-under{fill:none;stroke:var(--line);stroke-width:3.2;stroke-linecap:round}.bar{fill:none;stroke:var(--metal);stroke-width:2;stroke-linecap:round}
.lightbar{fill:var(--off);transition:fill .4s}.lit .lightbar{fill:#fffbe9}.wash{fill:#fff6d8;opacity:0;filter:url(#bloom);transition:opacity .5s}.lit .wash{opacity:.5}
.beam{fill:none;stroke:var(--fault);stroke-width:.8;stroke-linecap:round;opacity:0;filter:url(#glow)}.beam.on{opacity:1}
.pane{fill:var(--smoke);fill-opacity:var(--smoke-a);stroke:none;pointer-events:none}.sheen{fill:#fff;opacity:.12;pointer-events:none}
.reel{animation:spin .9s linear infinite;animation-play-state:paused}.reading .reel{animation-play-state:running}.rew .reel{animation:spin .35s linear infinite reverse}
.slot .tface{transition:opacity .15s}.slot.empty .tface{opacity:0}.slot.pick .paper{fill:var(--accent);fill-opacity:.35}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.slot:hover .paper{fill:var(--accent);fill-opacity:.25}.control:hover .button-face{fill:var(--top)}
@keyframes spin{to{transform:rotate(360deg)}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<clipPath id="win"><path id="winPath"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* World coordinates: x lower-right; y lower-left; z up. Units ≈ 4 mm.
Part x y z w d h
plinth + feet 3 3 0 118 54 8
storage wall (inner, behind glass) 4 38 14 94 0 106
aisle floor + left wall 4 38 14 94 22 106
bottom + top gantry rails 6 55 14 90 5 87
tape slots (2 × 5, LTO) 9 38 47 60 0 50
tape drives (2) 9 38 17 60 0 24
picker carriage (moves x z, reaches y) 69 50 64 30 6 10
carried cartridge (0–12 out) 10 38 34 26 12 5.4
gantry column 81.5 56.5 17 5 3 81
light bar 8 57 110 86 2.4 2
cabinet side + top 0 0 8 124 60 116
front frame + window 0 60 8 124 0 116
control column (screen, LEDs, I/E slot, key) 98 60 8 26 0 116
Labels, barcodes, reels, LEDs and screws share their parent face. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: draw into a group; a cartridge face with its barcode label.
function into(g,fn){const n=root.childNodes.length;fn();while(root.childNodes.length>n)g.appendChild(root.childNodes[n]);return g;}
const shift=(x,y,z)=>{const a=P(x,y,z),o=P(0,0,0);return`translate(${(a[0]-o[0]).toFixed(2)} ${(a[1]-o[1]).toFixed(2)})`;};
function cart(g,n){rect(g,0,0,26,5.4,.8,'face tape');rect(g,3.4,1,17,3.4,.4,'face paper');for(let k=0;k<16;k++)rect(g,4.2+k*.62,1.5,k%3?.22:.4,1.6,0,'bars');text(g,11.9,4.2,`AR${String(n).padStart(4,'0')}L9`,'nano center');rect(g,22,1.4,2.4,2.4,.4,'face tab');}
const YW=38,PARK={gx:84,gz:66,r:12},COLX=[10,42],DRVX=[9,41],DZ=34.2,rowZ=k=>48+9.4*k;
// Plinth and the interior seen through the window: storage wall, aisle floor, left wall.
const sp=P(62,34,0);el('ellipse',{cx:sp[0],cy:sp[1]+4,rx:112,ry:48,class:'shadow stage-floor'});el('ellipse',{cx:sp[0],cy:sp[1]+4,rx:112,ry:48,class:'stage-contact'});
for(const[x,y]of[[5,5],[111,5],[5,47],[111,47]])box(x,y,0,8,8,3,2,'recess');box(3,3,3,118,54,5,2,'base');
const wallF=group(FRONT(4,YW,120));rect(wallF,0,0,94,106,0,'face in');
for(const u of[4,90])for(let v=8;v<100;v+=10)circle(wallF,u,v,.9,'face recess');
rect(group(TOP(4,YW,14)),0,0,94,22,0,'face top in');
const lw=group(SIDE(4,60,120));rect(lw,0,0,22,106,0,'face side in');slits(lw,5,30,12,30,6,false);
const wash=el('ellipse',{cx:P(48,46,90)[0],cy:P(48,46,90)[1],rx:60,ry:36,class:'wash'});
box(6,55,14,90,5,3,1,'metal');
// Cartridge slots (tapes 1–5 left column, 6–10 right, top to bottom) and two drives.
const slots=[];
for(let i=0;i<10;i++){
const x0=COLX[i<5?0:1],z0=rowZ(4-i%5),g=group(FRONT(x0,YW,z0+5.4),root,{class:'control slot',role:'button',tabindex:'0','aria-label':`Load tape ${i+1} (${(i+1)%10})`});
rect(g,-1.2,-1.2,28.4,7.8,1,'face cav');const f=group('',g,{class:'tface'});cart(f,i+1);
text(g,-3.4,4.2,String(i+1),'etch micro center');rect(g,-4.6,-1.6,32,8.6,0,'hit');rect(g,-1.8,-1.8,29.6,9,1.4,'focus-ring');
slots.push({i,x0,z0,g,gx:x0+13,where:'slot'});
}
const drives=[];
for(let d=0;d<2;d++){
const x0=DRVX[d],g=group(FRONT(x0,YW,41));
rect(g,0,0,28,24,1.6,'face base');rect(g,.7,1,26.6,6.8,.8,'face cav');const tf=group('',g,{opacity:0});cart(group('translate(1 1.6) scale(.98 1)',tf),0);
line(g,1.4,8.6,26.6,8.6);rect(g,3.6,10.4,18.6,10.4,1.4,'face screen');
const rg=group('',g),reels=[];for(const cx of[8.4,17.4]){const h=group(`translate(${cx} 15.6)`,rg),r=el('g',{class:'reel'},h);circle(r,0,0,3.7,'face metal');circle(r,0,0,1.3,'face recess');for(const a of[0,120,240])line(r,0,0,3.2*Math.sin(a*Math.PI/180),-3.2*Math.cos(a*Math.PI/180));reels.push(r);}
line(g,8.4,19.3,17.4,19.3);const ready=circle(g,25.2,12.2,.9,'lamp'),act=circle(g,25.2,16,.9,'lamp');
text(g,12.9,23,`LTO-9 · DRIVE ${d+1}`,'etch micro center');
drives.push({d,x0,gx:x0+14,g,rg,tf,ready,act,tape:-1,st:'empty',t0:0,prog:0,at:0});
}
// Scan beam, carried cartridge, picker carriage, arm, column, top rail, light bar.
const beam=el('path',{class:'beam'});
const carry=el('g',{opacity:0}),cSide=group('',carry),cSideR=rect(cSide,0,0,0,5.4,.6,'face side tape'),cFront=group('',carry);cart(cFront,0);const cLabel=cFront.querySelector('.nano');
const cTop=group('',carry),cTopR=rect(cTop,0,0,26,0,.6,'face top tape');
const carr=into(el('g',{}),()=>{box(-15,YW,-2.4,30,6,10,1.6,'');const f=group(FRONT(-15,YW+6,7.6));rect(f,2,2.2,6,5,1,'face cav');circle(f,5,4.7,1.4,'face screen');slits(f,11,2.6,10,4.6,5);circle(f,26.4,3.4,.8,'lamp pl');
const t=group(TOP(-15,YW,7.6));rect(t,3,1.4,24,3.2,1,'face recess');});
const pl=carr.querySelector('.pl');
const armU=el('path',{class:'bar-under'}),armB=el('path',{class:'bar'});
const col=into(el('g',{}),()=>{box(-5,55.5,17,10,4,4,1,'base');box(-2.5,56.5,21,5,3,73,1,'metal');box(-5,55.5,94,10,4,4,1,'base');});
box(6,55,98,90,5,3,1,'metal');
const lbar=group(FRONT(8,59.4,112));rect(lbar,0,0,86,2,1,'face lightbar');
// Cabinet shell: side, front frame with the window, top; glass and control column.
const sideP=group(SIDE(124,60,124));rect(sideP,0,0,60,116,4,'face side');slits(sideP,8,12,10,36,8);slits(sideP,42,12,10,36,8);rect(sideP,20,70,20,12,1.2,'face top');text(sideP,30,75.6,'STRATA A10','etch micro center');text(sideP,30,79.4,'240 V · 6 A · SN 0417','etch micro center');for(const v of[6,110])for(const u of[6,54])screw(sideP,u,v);
const fr=group(FRONT(0,60,124)),winD='M8,6H94Q96,6 96,8V100Q96,102 94,102H8Q6,102 6,100V8Q6,6 8,6Z';
el('path',{d:'M3,0H121Q124,0 124,3V113Q124,116 121,116H3Q0,116 0,113V3Q0,0 3,0Z '+winD,'fill-rule':'evenodd',class:'face'},fr);
el('path',{d:winD,class:'pane'},fr);el('path',{d:'M14,102 L50,6 H62 L26,102Z M32,102 L68,6 H72 L36,102Z',class:'sheen','clip-path':'url(#win)'},fr);set(document.getElementById('winPath'),'d',winD);
el('path',{d:winD,class:'detail'},fr);line(fr,6,106,96,106);text(fr,51,111.6,'STRATA · ARCHIVE','etch center');
for(const v of[48,58])rect(fr,1.4,v,3,6,1.2,'face top');
const screenTxt=[];rect(fr,100,6,22,22,1.6,'face recess');rect(fr,101.2,7.2,19.6,19.6,1,'face screen');rect(fr,103,9,16,16,2,'halo');
for(let k=0;k<4;k++)screenTxt.push(text(fr,102.6,11.4+k*4.1,'',k?'scr dim':'scr'));
const ledReady=circle(fr,103.4,32.6,1,'lamp'),ledAttn=circle(fr,111,32.6,1,'lamp'),ledDrv=circle(fr,118.6,32.6,1,'lamp');
text(fr,103.4,36.6,'RDY','etch micro center');text(fr,111,36.6,'ATTN','etch micro center');text(fr,118.6,36.6,'DRV','etch micro center');
rect(fr,100,44,22,9,1.4,'face recess');rect(fr,101.2,45.2,19.6,6.6,1,'face cav');line(fr,102,48.5,120,48.5);text(fr,111,57,'I / E STATION','etch micro center');
const light=group('',fr,{class:'control',role:'button',tabindex:'0','aria-label':'Toggle interior light (L)','aria-pressed':'true'});
circle(light,105.6,67,3.8,'face recess');circle(light,105.6,67,2.8,'face button-face');circle(light,105.6,67,1,'lamp lightled');circle(light,105.6,67,5.4,'focus-ring');text(light,105.6,73.6,'LIGHT','etch micro center');
const lightLed=light.querySelector('.lightled');
circle(fr,116.4,67,3.2,'face metal');rect(fr,115.9,65.2,1,3.6,.3,'face cav');text(fr,116.4,73.6,'LOCK','etch micro center');
slits(fr,100,84,22,22,9);for(const[u,v]of[[3,3],[121,3],[3,113],[121,113]])circle(fr,u,v,.9,'face recess');
const lidT=group(TOP(0,0,124));rect(lidT,0,0,124,60,4,'face top');slits(lidT,34,18,56,22,14);rect(lidT,10,24,14,12,2,'face');rect(lidT,100,24,14,12,2,'face');for(const[u,v]of[[5,5],[119,5],[5,55],[119,55]])screw(lidT,u,v);
frame([[0,0,0,124,60,124]],22);
// State: picker queue (move, reach, grab, pull, insert), drives, inventory, light.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const pick={...PARK},car={i:-1,s:0};let queue=[],step=null,op='',scan=-1,mbps=0,lastUI=0,flashMsg='',flashUntil=0,audio=null,order=0;
function ac(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!audio)audio=new A();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch(_){}}
function tone(f,d,g,type='triangle'){if(!audio)return;try{const o=audio.createOscillator(),v=audio.createGain(),t=audio.currentTime;o.type=type;o.frequency.setValueAtTime(f,t);v.gain.setValueAtTime(g,t);v.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(v);v.connect(audio.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
function say(m){announcement.textContent=m;}
function flash(m){flashMsg=m;flashUntil=performance.now()+1500;lastUI=0;}
function lamp(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
const ease=t=>t<=0?0:t>=1?1:t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,lerp=(a,b,t)=>a+(b-a)*t;
const tag=i=>`TAPE ${String(i+1).padStart(2,'0')}`;
function draw(){
set(carr,'transform',shift(pick.gx,pick.r,pick.gz));set(col,'transform',shift(pick.gx,0,0));
const a=`M${P(pick.gx,YW+6+pick.r,pick.gz+3).join(',')}L${P(pick.gx,56.5,pick.gz+3).join(',')}`;set(armU,'d',a);set(armB,'d',a);
const s=car.s,tx=pick.gx-13,tz=pick.gz;set(carry,'opacity',car.i>=0?1:0);
set(cSide,'transform',SIDE(tx+26,YW+s,tz+5.4));set(cSideR,'width',s);set(cFront,'transform',FRONT(tx,YW+s,tz+5.4));set(cTop,'transform',TOP(tx,YW,tz+5.4));set(cTopR,'height',s);
}
const mv=(gx,gz)=>({gx,gz,ms:0}),reach=()=>({r:0,ms:300}),retract=()=>({r:12,ms:280});
function fetchSteps(i,d){
const sl=slots[i],dv=drives[d];
return[{f:()=>{op=`FETCHING ${tag(i)}`;sl.g.classList.add('pick');}},mv(sl.gx,sl.z0),reach(),
{ms:140,f:()=>{car.i=i;car.s=0;cLabel.textContent=`AR${String(i+1).padStart(4,'0')}L9`;sl.g.classList.add('empty');sl.g.classList.remove('pick');sl.where='picker';tone(700,.05,.02);}},
{r:12,s:12,ms:440},{f:()=>{op=`LOADING DRIVE ${d+1}`;}},mv(dv.gx,DZ),{r:0,s:0,ms:460},
{ms:120,f:()=>{car.i=-1;dv.tape=i;dv.st='loading';dv.t0=performance.now();dv.at=++order;set(dv.tf,'opacity',1);sl.where='drive';tone(420,.08,.03);say(`${tag(i)} loading in drive ${d+1}.`);}},retract()];
}
function unloadSteps(d){
const dv=drives[d];
return[{ms:950,f:()=>{op=`REWINDING DRIVE ${d+1}`;dv.st='rewind';dv.g.classList.add('rew');}},
{f:()=>{op=`RETURNING ${tag(dv.tape)}`;dv.g.classList.remove('rew');dv.st='eject';}},mv(dv.gx,DZ),reach(),
{ms:140,f:()=>{car.i=dv.tape;car.s=0;cLabel.textContent=`AR${String(dv.tape+1).padStart(4,'0')}L9`;set(dv.tf,'opacity',0);tone(700,.05,.02);}},
{r:12,s:12,ms:440},{f:()=>{const sl=slots[car.i];queue.unshift(mv(sl.gx,sl.z0),{r:0,s:0,ms:460},{ms:120,f:()=>{sl.g.classList.remove('empty');sl.where='slot';say(`${tag(sl.i)} returned to slot ${sl.i+1}.`);car.i=-1;dv.tape=-1;dv.st='empty';tone(420,.08,.03);}},retract());}}];
}
const busy=()=>!!step||queue.length>0;
function request(i){
ac();if(busy()){flash('PICKER BUSY');return;}
const sl=slots[i];if(sl.where!=='slot'){const d=drives.findIndex(v=>v.tape===i);flash(`${tag(i)} IN DRIVE ${d+1}`);return;}
let d=drives.findIndex(v=>v.tape<0);const steps=[];
if(d<0){d=drives[0].at<drives[1].at?0:1;steps.push(...unloadSteps(d));}
queue.push(...steps,...fetchSteps(i,d),mv(PARK.gx,PARK.gz),{f:()=>{op='';}});say(`Fetching ${tag(i).toLowerCase()}.`);
}
function unload(){
ac();if(busy()){flash('PICKER BUSY');return;}
const ds=drives.filter(v=>v.tape>=0).sort((a,b)=>a.at-b.at);if(!ds.length){flash('DRIVES EMPTY');return;}
for(const v of ds)queue.push(...unloadSteps(v.d));queue.push(mv(PARK.gx,PARK.gz),{f:()=>{op='';}});say('Returning tapes.');
}
function inventory(){
ac();if(busy()){flash('PICKER BUSY');return;}
const ord=[0,1,2,3,4,9,8,7,6,5];scan=0;
for(const i of ord){const sl=slots[i];queue.push({gx:sl.gx,gz:sl.z0,ms:240},{ms:170,f:()=>{scan++;op=`INVENTORY ${scan}/10`;if(sl.where==='slot'){set(beam,'d',`M${P(sl.x0+1,YW,sl.z0+2.7).join(',')}L${P(sl.x0+25,YW,sl.z0+2.7).join(',')}`);beam.classList.add('on');tone(1600,.03,.01,'sine');}},done:()=>beam.classList.remove('on')});}
queue.push(mv(PARK.gx,PARK.gz),{f:()=>{op='';scan=-1;flash('INVENTORY OK · 10 SLOTS');say('Inventory complete.');}});
}
function lightToggle(){ac();const on=svg.classList.toggle('lit');set(light,'aria-pressed',on);flash(on?'LIGHT ON':'LIGHT OFF');}
function tick(now){
if(!step&&queue.length){step=queue.shift();step.t0=now;step.from={gx:pick.gx,gz:pick.gz,r:pick.r,s:car.s};if(step.ms===0&&step.gx!=null){const dist=Math.hypot(step.gx-pick.gx,step.gz-pick.gz);step.ms=dist<.5?0:320+dist*9;}if(step.f)step.f();lastUI=0;}
if(step){
const dur=reduced.matches?0:step.ms||0,p=dur?Math.min(1,(now-step.t0)/dur):1,e=ease(p),f=step.from;
if(step.gx!=null){pick.gx=lerp(f.gx,step.gx,e);pick.gz=lerp(f.gz,step.gz,e);}
if(step.r!=null)pick.r=lerp(f.r,step.r,e);if(step.s!=null&&car.i>=0)car.s=lerp(f.s,step.s,e);
draw();if(p>=1){if(step.done)step.done();step=null;}
}
let reading=0;
for(const v of drives){
if(v.st==='loading'&&now-v.t0>(reduced.matches?0:900)){v.st='reading';v.prog=0;v.t0=now;}
if(v.st==='reading'){v.prog=Math.min(1,(now-v.t0)/9000);reading++;if(v.prog>=1)v.st='mounted';}
v.g.classList.toggle('reading',v.st==='reading');
lamp(v.ready,v.tape>=0||v.st==='eject'?'g':'');lamp(v.act,v.st==='loading'||v.st==='rewind'?((now/150|0)%2||reduced.matches?'a':''):v.st==='reading'?(Math.random()<.3&&!reduced.matches?'':'b'):'');
}
const moving=busy();lamp(pl,moving?((now/200|0)%2||reduced.matches?'b':''):'g');lamp(ledReady,'g');lamp(ledAttn,'');lamp(ledDrv,reading?'b':'');lamp(lightLed,svg.classList.contains('lit')?'a':'');
if(flashUntil&&now>flashUntil){flashUntil=0;lastUI=0;}
if(!lastUI||now-lastUI>200){
const target=reading*(300+Math.random()*30);mbps+=(target-mbps)*.4;if(!target&&mbps<1)mbps=0;
const loaded=drives.filter(v=>v.tape>=0);
readout.textContent=`${loaded.length}/2 DRIVES · ${Math.round(mbps)} MB/s`;
const rd=drives.find(v=>v.st==='reading');
const st=op||(rd?`READING ${tag(rd.tape)} · ${Math.round(rd.prog*100)}%`:loaded.length?`MOUNTED · ${loaded.map(v=>tag(v.tape)).join(' + ')}`:'IDLE · 10 TAPES IN SLOTS');
stateLabel.textContent=flashUntil?flashMsg:st;
const lines=['STRATA A10',op||(rd?'READING':loaded.length?'MOUNTED':'READY'),...drives.map(v=>`D${v.d+1} ${v.tape>=0?tag(v.tape).slice(5)+(v.st==='reading'?` ${Math.round(v.prog*100)}%`:''):'--'}`)];
lines.forEach((t,k)=>{screenTxt[k].textContent=t.slice(0,15);});
lastUI=now;
}
requestAnimationFrame(tick);
}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)fn();}});}
slots.forEach((s,i)=>bind(s.g,()=>request(i)));bind(light,lightToggle);
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;
const k=e.key.toLowerCase(),n=parseInt(k,10);
const action=!isNaN(n)?()=>request((n+9)%10):{u:unload,s:inventory,l:lightToggle}[k];
if(action){e.preventDefault();action();}
});
draw();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], svgClass: 'lit', draw }
