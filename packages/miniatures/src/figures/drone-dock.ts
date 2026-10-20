// @ts-nocheck
/* NIMBRE D–04 · Drone dock. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--mat:#4a4a48;--mat-line:#6e6e6b;--screen:#1c1d1e;--prop:#3a3a39;--lens:#20242c;--rubber:#2e2e2d;--sky:#4a6fb5;--ground:#6b7d5a}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--mat:#3d3d3c;--mat-line:#5c5c5a;--screen:#161717;--prop:#2f2f2f;--lens:#1a1d22;--rubber:#252524;--sky:#3d5c98;--ground:#59684b;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.mat{fill:var(--mat)}.matl{fill:none;stroke:var(--mat-line);stroke-width:.9}.screen{fill:var(--screen)}.lens{fill:var(--lens)}.rubber{fill:var(--rubber)}.prop{fill:var(--prop);stroke:var(--line);stroke-width:.4;vector-effect:non-scaling-stroke}.blur{fill:var(--line);opacity:0;stroke:none}.sweep{fill:none;stroke:var(--line);stroke-width:.6;opacity:0;vector-effect:non-scaling-stroke}
.lamp{fill:var(--off);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.w{fill:#fff}.lamp.g,.lamp.a,.lamp.r,.lamp.b,.lamp.w{filter:url(#glow);stroke:none}
.seg{fill:none;stroke:var(--off);stroke-width:2.2;stroke-linecap:round}.seg.b{stroke:var(--accent);filter:url(#glow)}.seg.a{stroke:var(--warn);filter:url(#glow)}.seg.g{stroke:var(--ok);filter:url(#glow)}
.rail{fill:var(--metal-top)}.railg{fill:var(--accent);opacity:0;filter:url(#glow)}.bhalo{opacity:0;filter:url(#bloom)}.bhalo.g{fill:var(--ok);opacity:.55}.bhalo.a{fill:var(--warn);opacity:.6}.bhalo.b{fill:var(--accent);opacity:.5}.bhalo.r{fill:var(--fault);opacity:.6}
.scr{fill:var(--accent);font:600 3.4px ui-monospace,monospace;letter-spacing:.4px;stroke:none}.scr.s{font-size:2.6px;font-weight:400}.sky{fill:var(--sky)}.ground{fill:var(--ground)}.hz{stroke:#fff;stroke-width:.5;opacity:.8}.halo{fill:var(--accent);opacity:.14;filter:url(#bloom)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control[aria-disabled=true]{cursor:default}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<clipPath id="liveClip"><rect x="7" y="7" width="50" height="22" rx="1.4"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* NIMBRE D–04. World: x lower-right, y lower-left, z up; 1 unit ≈ 2.5 mm. Drone parts are offsets from D = 110 100 30.
Part                        x      y      z      w      d      h
dock feet (4)            8/196  8/176     0     16     16      4
dock body                   0      0      4    220    200     26   front panel: screen, battery bar, charge button
landing mat                12     12     30    196    176      0   target rings, LED ring (20 segments)
charge rails (2)       84/128     74     30      8     52      0   glow while charging
centering bars (2)   14 / 202     60     30      4     80      5   slide 64 / 60 in x onto the skids
side fan                  220   40–60  8–26      –      –      –   spins while charging
beacon                     14    186     30   r 5      –      9
weather mast              208     10     30   r 1.8    –     84   rain sensor, anemometer (3 cups)
controller            236     70      0     64     60     14   live view, sticks, take-off key, antennas
drone skids          D ±24  D −25…25     0      3     50      3   struts to the body
drone body + shell   D −20  D −28      10     40     56     19   battery LEDs, GPS dome
arms + motors + props  D ±42 ±46    18–31   r 2.8 / 6.5 / 25        nav lights red (left) / green (right)
gimbal camera        D −7   D 22        0     14     10     10   lens forward (+y)
Hover: up to 80 above the pad; the whole drone group is translated. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: round parts on any axis, LEDs, controls.
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(Math.hypot(...a)||1)),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=p=>p*p*(3-2*p);
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`;
function tube(a,b,r,cls){const ax=sub(b,a),n=unit(ax),U=unit(Math.abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U),pu=P(...U),pv=P(...V);if(pu[0]*pv[1]-pu[1]*pv[0]<0){V=mul(V,-1);pv=P(...V);}const pd=P(...ax),det=pu[0]*pv[1]-pv[0]*pu[1],u=(pd[0]*pv[1]-pv[0]*pd[1])/det,v=(pu[0]*pd[1]-pd[0]*pu[1])/det,l=Math.hypot(u,v)||1,tx=-v*r/l,ty=u*r/l;el('path',{d:`M${tx},${ty}A${r},${r} 0 0 1 ${-tx},${-ty}L${u-tx},${v-ty}A${r},${r} 0 0 1 ${u+tx},${v+ty}Z`,transform:plane(a,U,V),class:'face '+cls});}
function lamp(g,x,y,r=1){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c,base='lamp'){if(n._c!==c){n._c=c;set(n,'class',base+(c?' '+c:''));}}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
const into=g=>root=g,draw=root;
// Dock: feet, body, front panel, side fan, landing mat with target, LED ring and rails; beacon; mast.
const s0=P(130,96,0);el('ellipse',{cx:s0[0],cy:s0[1]+6,rx:178,ry:78,class:'shadow stage-floor'});el('ellipse',{cx:s0[0],cy:s0[1]+6,rx:178,ry:78,class:'stage-contact'});
for(const[x,y]of[[8,8],[196,8],[8,176],[196,176]])box(x,y,0,16,16,4,2,'rubber');
box(0,0,4,220,200,26,6);
const fp=group(FRONT(0,200,30));rect(fp,6,4,208,18,3,'detail');text(fp,12,15.6,'NIMBRE','label brand');
rect(fp,52,6,52,15,2,'face recess');rect(fp,55,8,46,11,1.5,'halo');rect(fp,53.6,7.4,48.8,12.2,1.5,'face screen');const fs1=text(fp,57,12.4,'CHARGING','scr'),fs2=text(fp,57,17.4,'WIND 3.2 M/S · 14°C','scr s');
const BAT=[0,1,2,3,4,5].map(i=>{rect(fp,112+i*9,9.5,7.4,5,1.4,'face recess');return lamp(fp,115.7+i*9,12,1.4);});text(fp,138,19.4,'BATTERY','etch micro center');
const chgG=button(group('',fp),{'aria-label':'Charge the drone (C)','aria-pressed':'true'});circle(chgG,180,13,6.4,'face recess');const chgRing=circle(chgG,180,13,5.2,'lamp');chgRing._c='';circle(chgG,180,13,4,'face top');el('path',{d:'M180.8,10.4L178.6,13.4H181.4L179.2,16',class:'detail'},chgG);circle(chgG,180,13,8.6,'focus-ring');circle(chgG,180,13,9,'hit');slits(fp,194,7,16,12,6);
const sp=group(SIDE(220,200,30));slits(sp,14,6,60,14,20);rect(sp,96,6,38,14,1.2,'face top');text(sp,99,11.2,'NIMBRE D–04 DOCK','etch micro');text(sp,99,15.4,'IP55 · 48 V · 350 W','etch micro');
circle(sp,160,13,10.2,'face recess');const fan=group('translate(160 13)',sp);for(let i=0;i<5;i++)el('path',{d:'M0,-1.4Q3,-3 1.6,-8Q-1.2,-7.6 -1.2,-1.6Z',class:'face base',transform:`rotate(${i*72})`},fan);circle(sp,160,13,2.2,'face metal');for(const r of[10.2,7])circle(sp,160,13,r,'detail');
const mat=group(TOP(12,12,30.04));rect(mat,0,0,196,176,8,'face mat');rect(mat,4,4,188,168,6,'matl');for(const r of[58,40])circle(mat,98,88,r,'matl');line(mat,98,24,98,48,'matl');line(mat,98,128,98,152,'matl');line(mat,34,88,58,88,'matl');line(mat,138,88,162,88,'matl');
const RING=[...Array(20)].map((_,i)=>{const a0=i/20*Math.PI*2+.05,a1=(i+1)/20*Math.PI*2-.05;const s=el('path',{d:`M${98+68*Math.cos(a0)},${88+68*Math.sin(a0)}A68,68 0 0 1 ${98+68*Math.cos(a1)},${88+68*Math.sin(a1)}`,class:'seg'},mat);s._c='';return s;});
const RG=[];for(const x of[84,128]){rect(group(TOP(x,74,30.06)),0,0,8,52,1.5,'face metal');RG.push(rect(group(TOP(x,74,30.08)),1,1,6,50,1,'railg'));}
// Centering bars: two behind the drone, two in front; they slide in by 48 (x) and 40 (y).
const bar=(x,y,w,d)=>{const g=into(el('g',{}));box(x,y,30,w,d,5,1.6,'metal');into(draw);return g;};
const barLeft=bar(14,60,4,80);
// Weather mast, back right: pole, rain sensor, anemometer; beacon on the front left corner.
cylinder(208,10,30,3.6,3,'z','metal');cylinder(208,10,33,1.8,80,'z','metal');box(198,8,74,10,4,2,.6,'metal');box(192,5,70,8,8,6,1.5,'');const anemo=group(TOP(208,10,116),root);cylinder(208,10,113,2.6,4,'z','metal');
const cups=group('',anemo);for(let i=0;i<3;i++){const a=i*Math.PI*2/3;line(cups,0,0,Math.cos(a)*11,Math.sin(a)*11);circle(cups,Math.cos(a)*11,Math.sin(a)*11,2.6,'face top');}circle(anemo,0,0,2,'face top metal');
cylinder(14,186,30,5,3,'z','metal');const bc=cylinder(14,186,33,4,6,'z','glass');const bLamp=lamp(bc.face,0,0,3);const bh=P(14,186,36),bHalo=el('circle',{cx:bh[0],cy:bh[1],r:12,class:'bhalo'});
// Drone: shadow, skids, arms, body, shell, motors, props, gimbal; translated as one group.
const D=[110,100,30],d3=(x,y,z)=>[D[0]+x,D[1]+y,D[2]+z];const airShadow=el('ellipse',{class:'shadow',style:'opacity:.16'});
const droneG=into(el('g',{}));
for(const sx of[-24,24]){box(D[0]+sx-1.5,D[1]-25,D[2],3,50,3,1.4,'base');for(const sy of[-14,14])tube(d3(sx,sy,3),d3(sx*.66,sy,10),1.3,'metal');}
const MOT=[[-42,-46],[42,-46],[-42,46],[42,46]];for(const[x,y]of MOT)tube(d3(x*.38,y*.43,20),d3(x,y,20),2.8,'');
box(D[0]-20,D[1]-28,D[2]+10,40,56,16,7);const nf=group(FRONT(D[0]-20,D[1]+28,D[2]+26));slits(nf,8,4,24,4,8);text(nf,20,13,'NIMBRE','etch micro center');
box(D[0]-16,D[1]-22,D[2]+26,32,44,3,6);const sh=group(TOP(D[0]-16,D[1]-22,D[2]+29.05));const DLED=[0,1,2,3].map(i=>lamp(sh,10+i*4,36,1));cylinder(D[0],D[1]-12,D[2]+29,5,1.6,'z','');const strobe=lamp(sh,16,3.5,1.1);
const props=[],NAV=[];
for(const[x,y]of MOT){const m=cylinder(D[0]+x,D[1]+y,D[2]+18,6.5,10,'z','');circle(m.face,0,0,3.4,'face metal');if(y>0)NAV.push(lamp(group(FRONT(D[0]+x,D[1]+y+6.4,D[2]+24)),0,0,1.4));}
for(const[x,y]of MOT){const g=group(TOP(D[0]+x,D[1]+y,D[2]+31));const blur=circle(g,0,0,25,'blur'),sweep=circle(g,0,0,25,'sweep'),bl=group('',g);for(const r of[0,180])el('path',{d:'M0,-1.6C8,-3 16,-3.4 25,-1.4L25,1Q14,2.6 0,1.6Z',class:'prop',transform:`rotate(${r})`},bl);circle(g,0,0,2.2,'face top metal');props.push({bl,blur,sweep,dir:x*y>0?1:-1});}
box(D[0]-5,D[1]+20,D[2]+4,10,5,6,1.5,'base');box(D[0]-7,D[1]+22,D[2],14,10,10,2.4,'base');const lens=cylinder(D[0],D[1]+32,D[2]+5,3.8,2.6,'y','metal');circle(lens.face,0,0,2.6,'face lens');circle(lens.face,-.8,-.8,.7,'face top');
into(draw);
const barRight=bar(202,60,4,80);
// Controller: feet, body, live view, sticks, take-off key, antennas.
for(const[x,y]of[[240,74],[290,74],[240,120],[290,120]])box(x,y,0,6,6,3,1.5,'rubber');box(236,70,3,64,60,11,6);
for(const x of[242,290]){box(x,70,14,6,3,24,1.4,'base');}
const ct=group(TOP(236,70,14.05));rect(ct,5,5,54,26,2.5,'face recess');rect(ct,7,7,50,22,1.4,'face screen');const live=el('g',{'clip-path':'url(#liveClip)'},ct),horizon=group('',live);rect(horizon,-10,-20,84,38,0,'sky');rect(horizon,-10,18,84,40,0,'ground');line(horizon,-10,18,74,18,'hz');
line(ct,30,16,34,16,'hz');line(ct,32,14,32,18,'hz');const lAlt=text(ct,9,10.6,'0.0 M','scr s'),lBat=text(ct,55,10.6,'64%','scr s');set(lBat,'text-anchor','end');
for(const u of[14,50]){circle(ct,u,44,8,'face recess');circle(ct,u,44,6,'detail');}const stickL=group('translate(14 44)',ct),stickR=group('translate(50 44)',ct);for(const s of[stickL,stickR]){circle(s,0,0,3.6,'face metal');circle(s,0,0,2,'face top');}
const toG=button(group('',ct),{'aria-label':'Take off or land (T)','aria-pressed':'false'});rect(toG,26,38,12,7,2,'face top');const toL=lamp(toG,29,41.5,1);text(toG,34,42.6,'T/O','etch micro center');rect(toG,24,36,16,11,3,'focus-ring');rect(toG,23,35,18,13,0,'hit');const rthL=lamp(ct,32,52,1);text(ct,32,56.6,'RTH','etch micro center');
frame([[0,0,0,220,200,30],[30,40,30,160,120,128],[192,4,30,24,16,92],[236,70,0,64,60,40]],14);
// Flight state machine, charging, telemetry; audio only after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),hk={};
document.querySelectorAll('.hint [data-k]').forEach(b=>{hk[b.dataset.k]=b;});
const HOVER=80;let mode='docked',charging=true,battery=64,lift=0,spin=0,nx=0,ny=0,tx=0,ty=0,clampP=1,phaseAt=0,fromLift=0,fromX=0,fromY=0,lastT=0,lastUI=-1,stickUntil=0,stickX=0,stickY=0,notice='',noticeT=0,ac=null,whir=null,wind=0;
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();const o=ac.createOscillator(),f=ac.createBiquadFilter();o.type='sawtooth';o.frequency.value=110;f.type='bandpass';f.frequency.value=420;whir=ac.createGain();whir.gain.value=0;o.connect(f);f.connect(whir);whir.connect(ac.destination);o.start();whir.o=o;}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){}}
function beep(f,d=.08,v=.015){if(!ac)return;try{const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
const say=m=>{announcement.textContent=m;};
function phase(m,now=performance.now()){mode=m;phaseAt=now;lastUI=-1;}
function controls(){const flying=mode!=='docked';set(toG,'aria-pressed',flying);set(hk.t,'aria-pressed',flying);set(chgG,'aria-pressed',charging);set(hk.c,'aria-pressed',charging);}
function beginLand(){charging=false;fromLift=lift;fromX=nx;fromY=ny;tx=0;ty=0;phase('returning');beep(660);beep(520,.1,.015);if(reduced.matches){nx=ny=lift=spin=0;clampP=1;phase('docked');charging=battery<100;}controls();say('Returning to the pad. Charging resumes after landing.');ui(performance.now());}
function flight(){audio();notice='';if(mode==='docked'){charging=false;phase('opening');beep(880);if(reduced.matches){clampP=0;lift=HOVER;spin=1;phase('hovering');}controls();say('Centering bars open. Rotors spinning up. Nudge with the arrow keys.');}else beginLand();ui(performance.now());}
function charge(){audio();notice='';if(mode!=='docked'){beginLand();return;}if(battery>=100){notice='BATTERY FULL';noticeT=performance.now()+1800;controls();say('Battery full. Ready for take-off.');ui(performance.now());return;}charging=!charging;beep(charging?990:440);controls();say(charging?'Charging through the pad rails.':'Charging paused.');ui(performance.now());}
const DIRS={ArrowLeft:[-8,8,-2.4,0],ArrowRight:[8,-8,2.4,0],ArrowUp:[-8,-8,0,-2.4],ArrowDown:[8,8,0,2.4]};
const AIR=['opening','spooling','rising','hovering'];function nudge(k){audio();if(!AIR.includes(mode)){notice='TAKE OFF · T';noticeT=performance.now()+1700;say('Take off with T before nudging.');ui(performance.now());return;}const[dx,dy,sx,sy]=DIRS[k];tx=clamp(tx+dx,-32,32);ty=clamp(ty+dy,-32,32);stickX=sx;stickY=sy;stickUntil=performance.now()+240;notice='';if(reduced.matches){nx=tx;ny=ty;}say(`Hover offset ${Math.round(tx)} east, ${Math.round(ty)} south.`);ui(performance.now());}
bind(toG,flight);bind(chgG,charge);const act={t:flight,c:charge};for(const[k,b]of Object.entries(hk))b.addEventListener('click',()=>act[k]());
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key,a=DIRS[k]?()=>nudge(k):act[k.toLowerCase()];if(a){e.preventDefault();if(!e.repeat||DIRS[k])a();}});
const LABEL={docked:'',opening:'BARS OPEN',spooling:'SPINNING UP',rising:'TAKING OFF',hovering:'HOVERING',returning:'RETURNING',landing:'LANDING',settling:'TOUCHDOWN',centering:'CENTERING'};
function ui(now){const lv=Math.round(battery),h=(lift/80).toFixed(1),lab=mode==='docked'?(charging?'CHARGING':battery>=100?'CHARGED':'DOCKED'):LABEL[mode];readout.textContent=`${h} m · ${lv}%`;
stateLabel.textContent=notice&&now<noticeT?notice:lab+(AIR.includes(mode)?` · ${tx>=0?'+':''}${tx}, ${ty>=0?'+':''}${ty}`:'');fs1.textContent=`${lab} ${lv}%`;fs2.textContent=`WIND ${(3.2+wind).toFixed(1)} M/S · 14°C`;lAlt.textContent=h+' M';lBat.textContent=lv+'%';lastUI=now;}
function tick(now){const dt=lastT?Math.min((now-lastT)/1000,.05):0,red=reduced.matches;lastT=now;let p;
if(mode==='opening'){p=clamp((now-phaseAt)/500);clampP=1-ease(p);if(p>=1)phase('spooling',now);}
else if(mode==='spooling'){p=clamp((now-phaseAt)/900);spin=ease(p);if(p>=1)phase('rising',now);}
else if(mode==='rising'){p=clamp((now-phaseAt)/1500);lift=HOVER*ease(p);spin=1;nx+=(tx-nx)*Math.min(1,dt*4);ny+=(ty-ny)*Math.min(1,dt*4);if(p>=1){phase('hovering',now);controls();say('Hovering at one metre.');}}
else if(mode==='hovering'){spin=1;nx+=(tx-nx)*Math.min(1,dt*6);ny+=(ty-ny)*Math.min(1,dt*6);battery=clamp(battery-dt*.3,0,100);if(battery<=8)beginLand();}
else if(mode==='returning'){p=clamp((now-phaseAt)/800);nx=fromX*(1-ease(p));ny=fromY*(1-ease(p));spin=Math.max(spin,.65);if(p>=1)phase('landing',now);}
else if(mode==='landing'){p=clamp((now-phaseAt)/1450);lift=fromLift*(1-ease(p));spin=.85;if(p>=1){nx=ny=lift=0;phase('settling',now);}}
else if(mode==='settling'){p=clamp((now-phaseAt)/650);spin=.85*(1-ease(p));if(p>=1){spin=0;phase('centering',now);beep(520);}}
else if(mode==='centering'){p=clamp((now-phaseAt)/700);clampP=ease(p);if(p>=1){phase('docked',now);charging=battery<100;controls();beep(990);say('Landed and centred. Charging through the rails.');}}
if(mode==='docked'&&charging){battery=clamp(battery+dt*5.4,0,100);if(battery>=100){charging=false;controls();say('Battery full. Ready for take-off.');}}
const bob=mode==='hovering'&&!red?Math.sin(now*.0018)*1.6:0,o=P(nx,ny,lift+bob);set(droneG,'transform',`translate(${o[0].toFixed(2)} ${o[1].toFixed(2)})`);
const sc=P(D[0]+nx,D[1]+ny,30.1);set(airShadow,'cx',sc[0]);set(airShadow,'cy',sc[1]);set(airShadow,'rx',(44+lift*.18).toFixed(1));set(airShadow,'ry',(25+lift*.1).toFixed(1));airShadow.style.opacity=(.16-lift*.0012).toFixed(3);
for(const[g,v]of[[barLeft,P(64*clampP,0,0)],[barRight,P(-60*clampP,0,0)]])set(g,'transform',`translate(${v[0].toFixed(2)} ${v[1].toFixed(2)})`);
for(const r of props){set(r.bl,'transform',`rotate(${(r.dir*(spin&&!red?now*(.06+spin*1.3):25)%360).toFixed(1)})`);r.bl.style.opacity=(1-spin*.9).toFixed(2);r.blur.style.opacity=(spin*.22).toFixed(2);r.sweep.style.opacity=(spin*.6).toFixed(2);}
wind=red?0:.4*Math.sin(now/2600)+.2*Math.sin(now/700);if(!red)set(cups,'transform',`rotate(${(now*.12*(1+wind*.3))%360})`);if(!red&&charging)set(fan,'transform',`translate(160 13) rotate(${(now*.5)%360})`);
const flying=mode!=='docked',blink=red||Math.floor(now/500)%2===0,t=now/1000;
RING.forEach((s,i)=>{let c='';if(mode==='rising'||mode==='opening'||mode==='spooling')c=(i-Math.floor(t*14))%5===0?'a':'';else if(mode==='landing'||mode==='returning'||mode==='settling')c=(i+Math.floor(t*14))%5===0?'a':'';else if(mode==='hovering')c=i%2===0?'b':'';else if(mode==='centering')c='g';else if(charging)c=Math.abs(i-((t*6)%20))<2.5?'b':'';if(red&&c&&mode!=='centering'&&mode!=='hovering')c=i%2===0?(charging?'b':'a'):'';lit(s,c,'seg');});
RG.forEach(r=>{r.style.opacity=charging?(red?.8:(.45+.4*Math.sin(now/300)).toFixed(2)):0;});
const level=Math.min(5,Math.floor(battery/100*6));BAT.forEach((l,i)=>lit(l,i<level||battery>=100?(battery<15?'r':'g'):i===level&&charging?(blink?'b':''):''));
lit(chgRing,charging?'b':'');DLED.forEach((l,i)=>lit(l,battery>(i+1)*25-12?(flying?'g':'b'):''));
lit(NAV[0],flying?'r':'');lit(NAV[1],flying?'g':'');lit(strobe,flying&&(red||now%1000<80)?'w':'');
const beacon=battery<15?'r':flying?'a':charging?'b':'g';lit(bLamp,beacon==='a'&&!blink?'':beacon);set(bHalo,'class','bhalo '+(beacon==='a'&&!blink?'':beacon));
lit(toL,flying?'a':'g');lit(rthL,mode==='returning'||mode==='landing'?'a':'');
set(stickL,'transform',`translate(14 ${44+(mode==='rising'||mode==='spooling'?-2.4:mode==='landing'?2.4:0)})`);const sa=now<stickUntil;set(stickR,'transform',`translate(${50+(sa?stickX:0)} ${44+(sa?stickY:0)})`);
set(horizon,'transform',`translate(0 ${(lift*.12).toFixed(2)}) rotate(${((nx-tx)*.6).toFixed(1)} 32 18)`);
if(whir){whir.gain.setTargetAtTime(spin*.006,ac.currentTime,.15);whir.o.frequency.setTargetAtTime(90+spin*120,ac.currentTime,.2);}
if(lastUI<0||now-lastUI>=100)ui(now);requestAnimationFrame(tick);}
controls();ui(0);requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['t', 'c'], draw }
