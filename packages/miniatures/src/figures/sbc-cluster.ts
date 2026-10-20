// @ts-nocheck
/* ORCHARD C4 · Board cluster. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b3b3af;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--pcb:#2f6b4f;--pcb-top:#3c8562;--pcb-side:#255740;--hs:#cfd2d2;--hs-top:#e6e8e8;--hs-side:#b3b7b7;--chip:#2c2e30;--chip-top:#3d4043;--metal:#d4d6d6;--metal-top:#eceeee;--metal-side:#b8bbbb;--brass:#cfa95d;--acr:#ffffff;--acr-a:.28;--hdr:#232323;--sw:#e7e8e6;--sw-top:#f6f6f5;--sw-side:#cfd0ce;--rub:#4a4a48;--c1:#4e74ff;--c2:#2fbf7b;--c3:#f0a020;--c4:#e2508c;--c5:#9a6cf0}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#969694;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--pcb:#265941;--pcb-top:#377c5b;--pcb-side:#173b2a;--hs:#afb1b1;--hs-top:#d7d9d9;--hs-side:#7f8080;--chip:#242526;--chip-top:#383b3e;--metal:#b3b4b4;--metal-top:#dddfdf;--metal-side:#828383;--brass:#ae8e4d;--acr:#d7d7d7;--hdr:#1c1c1c;--sw:#c3c3c2;--sw-top:#e6e6e5;--sw-side:#929292;--rub:#3d3d3c;--c1:#6f8aff;--c2:#36d886;--c3:#ffad2b;--c4:#ff6aa3;--c5:#b28bff;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:4.4px;letter-spacing:1.3px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.pcb{fill:var(--pcb)}.top.pcb{fill:var(--pcb-top)}.side.pcb{fill:var(--pcb-side)}.hs{fill:var(--hs)}.top.hs{fill:var(--hs-top)}.side.hs{fill:var(--hs-side)}.chip{fill:var(--chip)}.top.chip{fill:var(--chip-top)}.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.brass{fill:var(--brass)}.hdr{fill:var(--hdr)}.sw{fill:var(--sw)}.top.sw{fill:var(--sw-top)}.side.sw{fill:var(--sw-side)}.rub{fill:var(--rub)}
.acr{fill:var(--acr);fill-opacity:var(--acr-a);stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke}.edge{fill:none;stroke:var(--accent);stroke-width:1.1;stroke-linecap:round;opacity:0;filter:url(#glow);transition:opacity .6s}.powered .edge{opacity:.55}
.silk{fill:#e9efe9;font:2.4px ui-monospace,monospace;letter-spacing:.2px;stroke:none;opacity:.8}.trace{fill:none;stroke:#7fb79a;stroke-width:.35;opacity:.55}
.cu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.cb{fill:none;stroke-linecap:round;stroke-linejoin:round}
.led>.core{fill:var(--off)}.led>.halo{opacity:0;filter:url(#soft)}.on>.core{fill:var(--c)}.on>.halo{fill:var(--c);opacity:.6}.g{--c:var(--ok)}.b{--c:var(--accent)}.a{--c:var(--warn)}.r{--c:var(--fault)}
.blade{fill:var(--top);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.blur{fill:var(--line);opacity:0;stroke:none}
.pod{filter:url(#glow)}.pod .face{stroke-width:.7}.podh{opacity:.35;filter:url(#bloom)}
.ring{fill:none;stroke:var(--off);stroke-width:1}.powered .ring{stroke:var(--accent);filter:url(#glow)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = ``

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* ORCHARD C4 cluster. World: x lower-right; y lower-left; z up. 1 unit ≈ 1.6 mm.
Part x y z w d h
rubber feet (4) 3/63 3/43 0 r2.6 – 2
acrylic plates (5) 0 0 2/26/50/74/98 66 46 2
brass standoffs (corners) 3/63 3/43 4…98 r1.4 – 22
boards (4: three workers, control plane on top) 6 5 8/32/56/80 54 36 1.2
  SoC heatsink 26 17 b+1.2 14 14 6 · RAM 42 19 b+1.2 6 10 1.2 · GPIO header 8 6 b+1.2 38 3 2.4
  USB + Ethernet jacks (right edge) 51 6/26 b+1.2 9 18/14 7–9 · LEDs PWR ACT 9 38 b+1.2
  pod slots (4) 10/18/26/34 30 b+1.2 5 5 5
top fan (on the lid) 18 8 100 30 30 4
power button + LED ring (base front) 54 46 3 r2.4 – –
switch 76 8 0 44 28 12 (5 ports on the front, link/activity LEDs)
patch cables board jacks → switch ports
Pending pods hover above the lid; moving pods fly out of the stack front. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers.
const draw=root,into=g=>root=g,f2=v=>(+v).toFixed(2);
function led(g,x,y,r=.7){const l=el('g',{class:'led'},g);circle(l,x,y,r*2.4,'halo');circle(l,x,y,r,'core');l.k='';return l;}
function lit(l,c){if(l.k!==c){l.k=c;set(l,'class','led'+(c?' on '+c:''));}}
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
const PLATE=[2,26,50,74,98],BOARD=[8,32,56,80],SLOT=[9,17,25,33],SY=29.5;
const APPS=[['api','--c1'],['db','--c2'],['cache','--c3'],['queue','--c4'],['web','--c5']];
// Shadow, feet.
const shp=P(56,26,0);el('ellipse',{cx:shp[0],cy:shp[1]+3,rx:96,ry:34,class:'shadow stage-floor'});el('ellipse',{cx:shp[0],cy:shp[1]+3,rx:96,ry:34,class:'stage-contact'});
for(const[x,y]of[[3,3],[63,3],[3,43],[63,43]])cylinder(x,y,0,2.6,2,'z','rub');
// Stack: plate, back standoffs, board, parts, pod layer, front standoffs, next plate.
const layers=[],edges=[];
function plate(z,k){box(0,0,z,66,46,2,2.4,'acr');const e=el('path',{d:poly([[0,46,z+2],[66,46,z+2],[66,0,z+2]]),class:'edge'});edges.push(e);}
function standoffs(z0,z1,front){for(const[x,y]of front?[[3,43],[63,43]]:[[3,3],[63,3]])cylinder(x,y,z0,1.4,z1-z0,'z','brass');}
for(let k=0;k<4;k++){
plate(PLATE[k],k);standoffs(PLATE[k]+2,PLATE[k+1],false);
const b=BOARD[k];for(const[x,y]of[[9,8],[57,8],[9,38],[57,38]])cylinder(x,y,PLATE[k]+2,1,b-PLATE[k]-2,'z','brass');
box(6,5,b,54,36,1.2,1.2,'pcb');const t=group(TOP(6,5,b+1.2));
for(let i=0;i<6;i++)el('path',{d:`M${4+i*3},34 V${26-i%3*3} L${12+i*2},${18-i%2*3} H${20}`,class:'trace'},t);
for(const[u,v]of[[3,3],[51,3],[3,33],[51,33]])circle(t,u,v,1.6,'face brass');
text(t,6,33.6,k===3?'CONTROL':'NODE '+(k+1),'silk');
box(8,6,b+1.2,38,3,2.4,.4,'hdr');{const h=group(TOP(8,6,b+3.6));for(let i=0;i<19;i++)for(const v of[.8,2.2])circle(h,1+i*2,v,.35,'face brass');}
box(42,19,b+1.2,6,10,1.2,.4,'chip');
box(26,17,b+1.2,14,14,1.6,.6,'chip');box(26.5,17.5,b+2.8,13,13,4.4,.6,'hs');{const h=group(TOP(26.5,17.5,b+7.2));for(let i=1;i<7;i++)line(h,i*1.86,.6,i*1.86,12.4);}
box(51,6,b+1.2,9,18,7.4,.8,'metal');{const s=group(SIDE(60,24,b+8.6));for(const v of[1.4,4.6])rect(s,2,v,14,2,.5,'face recess');}
box(51,26,b+1.2,9,14,9,.8,'metal');{const s=group(SIDE(60,40,b+10.2));rect(s,2,2,10,6,.6,'face recess');rect(s,5,7.4,4,1.4,.3,'face recess');}
const lt=group(TOP(6,5,b+1.25)),pwr=led(lt,4,32,.7),act=led(lt,4,29.4,.7);
const podL=el('g',{});const L={b,pwr,act,podL,pods:[],st:'ready',t:0,cp:k===3,temp:40};layers.push(L);
standoffs(PLATE[k]+2,PLATE[k+1],true);
}
plate(PLATE[4],4);
// Top fan on the lid.
const fz=PLATE[4]+2;box(18,8,fz,30,30,4,2,'base');const ft=group(TOP(33,23,fz+4));circle(ft,0,0,13.4,'face recess');const blades=group('',ft);for(let i=0;i<7;i++)el('path',{d:'M0,-2 Q6,-5.6 4.8,-12.4 Q-.6,-12.8 -1.4,-2.2Z',class:'blade',transform:`rotate(${i*51.4})`},blades);const fblur=circle(ft,0,0,12.6,'blur');for(const r of[13.4,9,5])circle(ft,0,0,r,'detail');for(const a of[45,135]){const t=a*Math.PI/180;line(ft,13.4*Math.cos(t),13.4*Math.sin(t),-13.4*Math.cos(t),-13.4*Math.sin(t));}circle(ft,0,0,3,'face base');text(ft,0,1,'C4','etch micro center');for(const[u,v]of[[-13,-13],[13,-13],[-13,13],[13,13]])circle(ft,u,v,1.2,'face brass');
// Power button on the base plate front.
const pwrG=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Cluster power (B)','aria-pressed':'true'});into(pwrG);const pb=group(FRONT(0,46,4));circle(pb,54,-1,2.6,'face metal');circle(pb,54,-1,1.9,'ring');circle(pb,54,-1,4.2,'focus-ring');into(draw);
// Switch with five ports.
box(76,8,0,44,28,12,2,'sw');const sf=group(FRONT(76,36,12));text(sf,5,4.4,'ORCHARD SW5','etch micro');
const SWP=[],SWL=[];for(let i=0;i<5;i++){const u=6+i*7.4;rect(sf,u,6,6,4.6,.6,'face recess');line(sf,u+1.2,7.4,u+4.8,7.4);SWL.push([led(sf,u+1.4,11.2,.5),led(sf,u+4.6,11.2,.5)]);SWP.push(76+u+3);}
const sw=group(TOP(76,8,12));slits(sw,20,6,20,16,10);const swPwr=led(group(FRONT(76,36,12)),40,4,.6);
// Patch cables, board jacks → switch ports.
const CC=['#4e74ff','#2fbf7b','#f0a020','#e2508c'];
layers.forEach((L,k)=>{const b=L.b,d=smooth([[60,33,b+6],[66,33,b+6],[70,36,b+2],[72,42,Math.max(10,b-12)],[SWP[k],42,10],[SWP[k],38,6.5]]);el('path',{d,class:'cu','stroke-width':2.4});el('path',{d,class:'cb','stroke-width':1.5,style:`stroke:${CC[k]}`});});
{const d=smooth([[SWP[4],38,6.5],[SWP[4],46,6],[SWP[4]+4,54,1],[132,58,1]]);el('path',{d,class:'cu','stroke-width':2.4});el('path',{d,class:'cb','stroke-width':1.5,style:'stroke:#d6d6d0'});}
const FLY=el('g',{});
frame([[0,0,0,124,48,106],[132,58,0,1,1,1],[0,0,120,66,46,1],[0,58,30,1,1,1]],8);
// Pods: small glowing containers; they live in a layer group and fly in the overlay.
function makePod(app){const g=el('g',{class:'pod'},FLY);into(g);const v=`var(${APPS[app][1]})`;box(-3,-3,0,6,6,6,1.1,'');const fs=g.querySelectorAll('.face');fs[0].style.fill=`color-mix(in srgb,${v} 70%,#000)`;fs[1].style.fill=v;fs[2].style.fill=`color-mix(in srgb,${v} 55%,#fff)`;const h=P(0,0,3);el('circle',{cx:h[0],cy:h[1],r:7,class:'podh',style:`fill:${v}`},g);into(draw);return g;}
// State.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
let on=true,pods=[],pending=[],moving=[],gone=[],nextId=1,drainIdx=0,fan=.4,fanA=0,lastT=0,lastUI=0,lastLed=0,ac=null,msg='',msgT=0,flash=0;
function say(m){announcement.textContent=m;}
function note(m){msg=m;msgT=performance.now()+1800;lastUI=0;}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac)ac=new A();if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function blip(f0,f1,d=.12,v=.02){if(!ac)return;const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.type='triangle';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.02);}
const workers=()=>layers.filter(L=>!L.cp);
const slotPos=(L,s)=>[SLOT[s]+3,SY+3,L.b+1.2];
const free=L=>[0,1,2,3].find(s=>!L.pods.some(p=>p.slot===s));
function target(except){const c=workers().filter(L=>L!==except&&L.st==='ready'&&L.pods.length<4);c.sort((a,b)=>a.pods.length-b.pods.length||a.b-b.b);return c[0];}
function place(p,pos){set(p.g,'transform',`translate(${P(...pos).map(f2).join(' ')})`);p.pos=pos;}
function fly(p,from,to,L,slot,delay=0){FLY.appendChild(p.g);moving.push({p,from,to,L,slot,t0:performance.now()+delay,dur:reduced.matches?1:1150});}
function park(p,i){const pos=[20+(i%6)*5.6,26-(i/6|0)*5.6,PLATE[4]+16];p.g.style.opacity=.55;FLY.appendChild(p.g);place(p,pos);}
function schedule(p,origin){const L=target();if(!L){if(!pending.includes(p))pending.push(p);park(p,pending.indexOf(p));return false;}
const slot=free(L);L.pods.push(p);p.slot=slot;p.node=L;p.g.style.opacity=1;pending=pending.filter(q=>q!==p);fly(p,origin||slotPos(layers[3],(p.id%4)),slotPos(L,slot),L,slot);return true;}
function deploy(){audio();msgT=0;if(!on){note('POWER ON FIRST · B');return;}const app=(nextId-1)%5,p={id:nextId++,app,g:makePod(app)};pods.push(p);const cpPos=slotPos(layers[3],p.id%4);place(p,cpPos);
if(schedule(p,cpPos)){blip(500,900);say(`Pod ${APPS[app][0]}-${p.id} scheduled to node ${layers.indexOf(p.node)+1}.`);note(`SCHEDULING ${APPS[app][0].toUpperCase()}-${p.id} → NODE ${layers.indexOf(p.node)+1}`);}else{blip(300,220);say('No capacity. Pod pending.');note('NO CAPACITY · POD PENDING');}lastUI=0;}
function drain(){audio();msgT=0;if(!on){note('POWER ON FIRST · B');return;}const W=workers(),L=W[drainIdx%W.length];
if(L.st==='cordon'){L.st='ready';drainIdx++;blip(600,800);say(`Node ${layers.indexOf(L)+1} uncordoned.`);note(`NODE ${layers.indexOf(L)+1} UNCORDONED`);const pend=[...pending];pend.forEach((p,i)=>setTimeout(()=>schedule(p,p.pos),i*160));lastUI=0;return;}
L.st='cordon';const moved=[...L.pods];L.pods=[];blip(800,300,.2);moved.forEach((p,i)=>{const from=p.pos;setTimeout(()=>schedule(p,from),reduced.matches?0:i*180);});
say(`Draining node ${layers.indexOf(L)+1}: ${moved.length} pod${moved.length===1?'':'s'} rescheduling.`);note(`DRAINING NODE ${layers.indexOf(L)+1} · ${moved.length} PODS MOVING`);lastUI=0;}
function del(){audio();msgT=0;const p=pods[pods.length-1];if(!p){note('NO PODS');return;}pods.pop();if(p.node)p.node.pods=p.node.pods.filter(q=>q!==p);pending=pending.filter(q=>q!==p);moving=moving.filter(m=>m.p!==p);p.dying=performance.now();gone.push(p);FLY.appendChild(p.g);blip(500,200);say(`Pod ${APPS[p.app][0]}-${p.id} deleted.`);note(`DELETED ${APPS[p.app][0].toUpperCase()}-${p.id}`);lastUI=0;}
function power(){audio();msgT=0;on=!on;svg.classList.toggle('powered',on);set(pwrG,'aria-pressed',on);const now=performance.now();
if(!on){layers.forEach(L=>{L.st='off';L.pods=[];});moving=[];pods.forEach((p,i)=>{pending.includes(p)||pending.push(p);park(p,i);p.g.style.opacity=.18;});blip(400,120,.3);say('Cluster powered off. Workloads will be rescheduled after boot.');}
else{layers.forEach((L,k)=>{L.st='boot';L.t=now+(reduced.matches?0:k*450);});blip(300,600,.25);say('Booting four nodes.');}lastUI=0;}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(pwrG,power);
const act={d:deploy,n:drain,x:del,b:power};document.querySelectorAll('.hint [data-k]').forEach(b=>b.addEventListener('click',()=>act[b.dataset.k]()));
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const f=act[e.key.toLowerCase()];if(f){e.preventDefault();f();}});
// Seed: five pods spread across the workers.
for(let i=0;i<5;i++){const app=i%5,p={id:nextId++,app,g:makePod(app)};pods.push(p);const L=target(),slot=free(L);L.pods.push(p);p.slot=slot;p.node=L;L.podL.appendChild(p.g);place(p,slotPos(L,slot));}
function tick(now){
const dt=Math.min(.05,(now-(lastT||now))/1000),red=reduced.matches;lastT=now;
for(let i=moving.length;i--;){const m=moving[i],t=clamp((now-m.t0)/m.dur);if(now<m.t0)continue;const e=ease(t),a=m.from,b=m.to,out=58;
let pos;if(t<.2){const q=t/.2;pos=[a[0],a[1]+(out-a[1])*ease(q),a[2]+4*q];}else if(t<.8){const q=ease((t-.2)/.6);pos=[a[0]+(b[0]-a[0])*q,out,a[2]+4+(b[2]+4-a[2]-4)*q];}else{const q=(t-.8)/.2;pos=[b[0],out+(b[1]-out)*ease(q),b[2]+4*(1-q)];}
place(m.p,red?b:pos);if(t>=1){moving.splice(i,1);m.L.podL.appendChild(m.p.g);place(m.p,b);flash=now;blip(900,1200,.06,.012);}}
for(const L of layers){if(L.st==='boot'&&now>L.t+(red?0:1800)){L.st='ready';if(layers.every(K=>K.st!=='boot'&&K.st!=='off')){say('All nodes ready.');const pend=[...pending];pend.forEach((p,i)=>setTimeout(()=>{p.g.style.opacity=1;schedule(p,p.pos);},red?0:i*200));}}
L.temp+=((on&&L.st!=='off'?38+L.pods.length*6+(L.cp?4:0):24)-L.temp)*clamp(dt*.6);}
const load=layers.reduce((s,L)=>s+L.pods.length,0);fan+=((on?.35+load*.06:0)-fan)*clamp(dt*1.2);if(!red){fanA=(fanA+fan*900*dt)%360;set(blades,'transform',`rotate(${f2(fanA)})`);}fblur.style.opacity=f2(clamp((fan-.5)*.8,0,.3));
if(now-lastLed>90){lastLed=now;const bk=(now/300|0)%2;
layers.forEach((L,k)=>{lit(L.pwr,on?'r':'');lit(L.act,L.st==='boot'?(Math.random()<.6?'g':''):L.st==='cordon'?(bk?'a':''):L.st==='ready'?(Math.random()<.12+L.pods.length*.12||now-flash<200?'g':''):'');
lit(SWL[k][0],on&&L.st!=='off'&&L.st!=='boot'?'g':L.st==='boot'&&bk?'a':'');lit(SWL[k][1],on&&L.st==='ready'&&(Math.random()<.2+L.pods.length*.1||moving.length)?'a':'');});
lit(SWL[4][0],on?'g':'');lit(SWL[4][1],on&&Math.random()<.4?'a':'');lit(swPwr,on?'b':'');}
for(let i=gone.length;i--;){const p=gone[i],t=red?1:clamp((now-p.dying)/420);p.g.style.opacity=f2(1-t);const c=P(...p.pos);set(p.g,'transform',`translate(${f2(c[0])} ${f2(c[1]-t*6)}) scale(${f2(1-t*.6)})`);if(t>=1){p.g.remove();gone.splice(i,1);}}
if(!lastUI||now-lastUI>200){
const ready=layers.filter(L=>L.st==='ready').length,avg=layers.reduce((s,L)=>s+L.temp,0)/4;
readout.textContent=`${ready}/4 NODES READY · ${pods.length} POD${pods.length===1?'':'S'} · ${Math.round(avg)}°C`;
const cord=layers.find(L=>L.st==='cordon'),boot=layers.some(L=>L.st==='boot');
stateLabel.textContent=now<msgT?msg:!on?'OFF · PRESS B':boot?'BOOTING NODES':moving.length?`RESCHEDULING · ${moving.length} MOVING`:pending.length?`${pending.length} PENDING · NO CAPACITY`:cord?`NODE ${layers.indexOf(cord)+1} CORDONED · N TO UNCORDON`:'BALANCED · '+workers().map(L=>L.pods.length).join(' / ');
lastUI=now;}
requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['d', 'n', 'x', 'b'], svgClass: 'powered', draw }
