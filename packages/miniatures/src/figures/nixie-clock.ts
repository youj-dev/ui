// @ts-nocheck
/* CATHODA N6 · Nixie clock. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--wood:#9a6a42;--wood-top:#b9875a;--wood-side:#7b5232;--brass:#cfa95d;--brass-top:#e8c985;--brass-side:#ab8743;--pcb:#2b2d2c;--pcb-top:#3a3d3c;--gold:#c9a24c;--bake:#2a2420;--bake-top:#3b332d;--env:#ffffff;--wire:#8b8f93;--neon:#ff7a1c;--hot:#ffd9a6;--led:#36d886;--cap:#2f5db8;--off:#b9b9b5;--spill:.28}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--wood:#815836;--wood-top:#ad7e54;--wood-side:#553720;--brass:#ae8e4d;--brass-top:#d9bc7c;--brass-side:#785e2d;--pcb:#232423;--pcb-top:#363837;--gold:#a9883f;--bake:#211d1a;--bake-top:#372f29;--env:#d7d7d7;--wire:#75787a;--neon:#ff7a1c;--hot:#ffd9a6;--led:#36d886;--cap:#264d9b;--off:#9b9b99;--spill:.45;--line:#444443}:root:not(.night) svg{--ink:#282828;--muted:#6b6b6b}}
:root.night{--bg:#050505;--ink:#bdbdbd;--muted:#5c5c5c;--top:#151515;--body:#101010;--side:#0c0c0c;--base:#0a0a0a;--recess:#070707;--glass:#050505;--line:#2a2a2a;--rule:#1a1a1a;--wood:#24170e;--wood-top:#2e1e12;--wood-side:#1b110a;--brass:#3a2f1a;--brass-top:#46391f;--brass-side:#2e2514;--pcb:#0b0b0b;--pcb-top:#111;--gold:#3a2f18;--bake:#0a0908;--bake-top:#100e0c;--env:#5a5a5a;--wire:#2e3032;--cap:#142a52;--off:#151515;--spill:.75}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:4.6px;letter-spacing:1.4px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.brass{fill:var(--brass)}.top.brass{fill:var(--brass-top)}.side.brass{fill:var(--brass-side)}.pcb{fill:var(--pcb)}.top.pcb{fill:var(--pcb-top)}.bake{fill:var(--bake)}.top.bake{fill:var(--bake-top)}.capc{fill:var(--cap)}.dark-ink{fill:#2a2118}
.grain{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.26}.trace{fill:none;stroke:var(--gold);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.8}
.env{fill:var(--env);fill-opacity:.13;stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke}.shine{fill:none;stroke:#fff;stroke-linecap:round;opacity:.5}.mesh{fill:url(#hex);opacity:.6}.night .shine{opacity:.16}
.ghost{fill:none;stroke:var(--wire);stroke-width:.5;stroke-linecap:round;stroke-linejoin:round;opacity:.55}.lit{fill:none;stroke:var(--neon);stroke-width:1.5;stroke-linecap:round;stroke-linejoin:round;filter:url(#glow)}.core{fill:none;stroke:var(--hot);stroke-width:.45;stroke-linecap:round;stroke-linejoin:round}
.bloom{fill:var(--neon);opacity:0;filter:url(#bloom);pointer-events:none}.dot{fill:var(--neon);filter:url(#glow)}.lead{fill:none;stroke:var(--wire);stroke-width:.5;vector-effect:non-scaling-stroke}
.arm-u{fill:none;stroke:var(--line);stroke-width:2.6;stroke-linecap:round}.arm{fill:none;stroke:var(--brass-top);stroke-width:1.6;stroke-linecap:round}.led{fill:var(--off)}.led.on{fill:var(--led);filter:url(#glow)}
.fade,.fade *{transition:fill .9s,stroke .9s,background-color .9s,color .9s,border-color .9s!important}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .top.brass{fill:var(--brass)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}:root.night .stage-floor,:root.night .stage-contact,:root.night .stage-pool{display:none}:root:not(.night) .tube .top{fill:var(--env);fill-opacity:.13}}`

const defs = `<pattern id="hex" width="2.4" height="2.08" patternUnits="userSpaceOnUse"><path d="M0,1.04 L.6,0 H1.8 L2.4,1.04 L1.8,2.08 H.6Z" style="fill:none;stroke:var(--wire);stroke-width:.18"/></pattern>
<radialGradient id="spillG"><stop offset="0" style="stop-color:var(--neon);stop-opacity:1"/><stop offset="1" style="stop-color:var(--neon);stop-opacity:0"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* CATHODA N6 Nixie clock. World: x lower-right; y lower-left; z up. 1 unit ≈ 2 mm.
Part x y z w d h
walnut base 0 0 0 220 64 24
brass top plate 8 10 24 168 44 0.6
tube sockets (6) 20/44/78/102/136/160 32 24 r10.5 – 3
tube envelopes + domes (6) same 32 27 r9 – 44 (+ dome)
digit stacks (front plane y 32) x−6.2…+6.2 32 40…60
anode mesh (front plane y 35) x−7…+7 35 37…65
colon bulbs (2 × 2) 61/119 32 41/53 r2 – 5
control board (PCB) 182 10 24 32 44 1.6
inductor, HV cap, IC, crystal, trimmer, LED, TEST button on the PCB
front buttons SET + DIM 186/198/210 64 12 r3.6 3 –
12/24 toggle 166 64 12 6 3 8
nameplate 70 64 8 60 0 8
Grain, print and labels share their parent face. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers and the single-stroke cathode glyphs (10 × 16).
const draw=root,into=g=>root=g,f2=v=>(+v).toFixed(2);
const DIG=['M5,0 C8.2,0 10,3.2 10,8 C10,12.8 8.2,16 5,16 C1.8,16 0,12.8 0,8 C0,3.2 1.8,0 5,0Z','M3,2.6 L5.6,0 V16','M.6,3.6 C1,1.2 2.8,0 5,0 C7.8,0 9.6,1.8 9.6,4.4 C9.6,7.6 6.2,9.8 .2,16 H10','M.6,.2 H9.4 L4.4,6.4 C7.8,6.2 10,8.4 10,11.2 C10,14.1 7.8,16 5,16 C2.8,16 1.2,15.1 .2,13.6','M7.6,16 V0 L0,11 H10','M9.4,0 H1.6 L.8,7 C2,6.1 3.4,5.6 5,5.6 C8,5.6 10,7.8 10,10.8 C10,14 7.8,16 5,16 C2.8,16 1.2,15.1 .2,13.6','M8.8,1.2 C7.9,.4 6.7,0 5.4,0 C2,0 0,3.6 0,9.4 C0,13.6 2,16 5,16 C8,16 10,13.8 10,10.8 C10,7.8 8,5.8 5,5.8 C2.6,5.8 .7,7.3 0,9.4','M0,.2 H10 L3,16','M5,7.4 C2.4,7.4 .8,5.8 .8,3.7 C.8,1.5 2.6,0 5,0 C7.4,0 9.2,1.5 9.2,3.7 C9.2,5.8 7.6,7.4 5,7.4 C2.2,7.4 0,9.2 0,11.7 C0,14.2 2.2,16 5,16 C7.8,16 10,14.2 10,11.7 C10,9.2 7.8,7.4 5,7.4Z','M10,6.6 C9.4,8.6 7.4,10.2 5,10.2 C2,10.2 0,8.2 0,5.2 C0,2.2 2,0 5,0 C8,0 10,2.4 10,6.6 C10,12.4 8,16 4.6,16 C3.4,16 2.2,15.6 1.2,14.8'];
const TX=[20,44,78,102,136,160],TY=32,R=9;
// Shadow and walnut base with grain, bevel and brass top plate.
const shp=P(110,32,0);el('ellipse',{cx:shp[0],cy:shp[1]+3,rx:150,ry:40,class:'shadow stage-floor'});el('ellipse',{cx:shp[0],cy:shp[1]+3,rx:150,ry:40,class:'stage-contact'});
box(0,0,0,220,64,24,4,'wood');
const lid=group(TOP(0,0,24));for(let i=0;i<5;i++){const v=8+i*12,w=i%2?1.6:-1.2;el('path',{d:`M6,${v} C70,${v+w} 140,${v-w} 214,${v+w*.6}`,class:'grain'},lid);}
rect(lid,3,3,214,58,4,'detail');
const fr=group(FRONT(0,64,24));for(let i=0;i<3;i++){const v=5+i*6.5;el('path',{d:`M8,${v} C80,${v+1} 150,${v-1} 212,${v+.6}`,class:'grain'},fr);}
const sd=group(SIDE(220,64,24));for(let i=0;i<3;i++){const v=5+i*6.5;el('path',{d:`M4,${v} C24,${v+.8} 40,${v-.6} 60,${v+.4}`,class:'grain'},sd);}
box(8,10,24,168,44,.6,1.6,'brass');const plate=group(TOP(8,10,24.6));rect(plate,2,2,164,40,1.2,'detail');for(const[u,v]of[[4,4],[164,4],[4,40],[164,40]])screw(plate,u,v);
const spill=TX.map(x=>el('ellipse',{cx:x,cy:TY,rx:16,ry:14,fill:'url(#spillG)',opacity:0,transform:TOP(0,0,24.7)}));
// Control board on the right: traces, inductor, HV cap, IC, crystal, trimmer, LED, TEST button.
box(182,10,24,32,44,1.6,1,'pcb');const pc=group(TOP(182,10,25.6));
for(let i=0;i<7;i++)el('path',{d:`M${3+i*4},2 V${10+i%3*6} L${6+i*3},${22+i%2*4} V42`,class:'trace'},pc);
for(const[u,v]of[[2.4,2.4],[29.6,2.4],[2.4,41.6],[29.6,41.6]])circle(pc,u,v,1.2,'face brass');
text(pc,16,40,'HV 170 V','etch micro center').style.fill='var(--gold)';
cylinder(190,18,25.6,4.2,5,'z','bake');ellipse(190,18,30.6,2.6,'z','detail');ellipse(190,18,28,4.25,'z','detail').style.stroke='#b8743a';
const hv=cylinder(204,18,25.6,3.4,10,'z','capc');ellipse(204,18,35.6,2.2,'z','detail');
box(186,30,25.6,9,6,1.6,.4,'bake');{const g=group(TOP(186,30,27.2));circle(g,1.4,1.4,.5,'face recess');}for(let i=0;i<4;i++){wire([[187+i*2.2,36,26.2],[187+i*2.2,37.2,25.6]]);}
box(199,32,25.6,6,3,2.6,1.4,'');box(205.6,40,25.6,4,4,3,.6,'capc');{const g=group(TOP(205.6,40,28.6));line(g,1,2,3,2);}
const led=ellipse(198,46,25.7,1.2,'z','led');
const testG=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Test button: run the cathode cycle (C)'});into(testG);box(186,44,25.6,6,6,2,.8,'');const tb=cylinder(189,47,27.6,1.8,1.4,'z','base');circle(tb.face,0,0,4.6,'focus-ring');into(draw);
{const g=group(TOP(182,10,25.62));text(g,7,40,'TEST','etch micro').style.fill='var(--gold)';}
// Tubes and colon bulbs, left to right.
const tubes=[];
function bulb(x,z){wire([[x-1.2,TY,24.6],[x-1.2,TY,z]],'lead');wire([[x+1.2,TY,24.6],[x+1.2,TY,z]],'lead');const c=cylinder(x,TY,z,2,5,'z','');c.g.querySelectorAll('.face').forEach(n=>n.setAttribute('class','env'));const p=P(x,TY,z+2.5);const h=el('circle',{cx:p[0],cy:p[1],r:6.5,class:'bloom'});const d=el('circle',{cx:p[0],cy:p[1],r:1.2,class:'dot'});return{h,d};}
const colons=[];
TX.forEach((x,i)=>{
cylinder(x,TY,24.6,10.5,2.6,'z','bake');ellipse(x,TY,27.2,8,'z','detail');
const pin=group(TOP(x,TY,27.25));for(let k=0;k<8;k++){const a=k*Math.PI/4;circle(pin,Math.cos(a)*6.6,Math.sin(a)*6.6,.5,'face brass');}
const env=cylinder(x,TY,27.2,R,40,'z','');set(env.g.firstChild,'class','env');env.g.classList.add('tube');
const bp=P(x,TY,50);const bloom=el('ellipse',{cx:bp[0],cy:bp[1],rx:15,ry:22,class:'bloom'});
const back=group(FRONT(x-7,TY-2.6,66));rect(back,0,0,14,30,1,'mesh');
const st=group(`${FRONT(x-6.2,TY,60)} scale(1.24)`),ghost=group('',st);DIG.forEach(d=>el('path',{d,class:'ghost'},ghost));
const prev=el('path',{class:'lit',opacity:0},st),lit=el('path',{class:'lit'},st),core=el('path',{class:'core'},st);
for(const s of[-1,1])wire([[x+s*7.2,TY,30],[x+s*7.2,TY,64]],'lead');
const fm=group(FRONT(x-7,TY+3.2,66));rect(fm,0,0,14,30,1,'mesh');
const top=P(x,TY,67.2),rx=R*1.2247;
el('path',{d:`M${f2(top[0]-rx)},${f2(top[1])} A${f2(rx)},${f2(rx*.92)} 0 0 1 ${f2(top[0]+rx)},${f2(top[1])} A${f2(rx)},${f2(R*.7071)} 0 0 1 ${f2(top[0]-rx)},${f2(top[1])}Z`,class:'env'});
el('path',{d:`M${f2(top[0]-1)},${f2(top[1]-rx*.92+.4)} l.4,-2.4 h1.2 l.4,2.4`,class:'env'});
const sh=P(x-R*.62,TY+R*.62,63);el('path',{d:`M${f2(sh[0])},${f2(sh[1])} v27`,class:'shine','stroke-width':1.1});el('path',{d:`M${f2(top[0]-rx*.6)},${f2(top[1]-rx*.45)} q${f2(rx*.35)},-${f2(rx*.36)} ${f2(rx*.8)},-${f2(rx*.38)}`,class:'shine','stroke-width':.8});
tubes.push({x,bloom,prev,lit,core,st,d:-1,fade:0,spill:spill[i]});
if(i===1||i===3){const cx=i===1?61:119;colons.push(bulb(cx,40.5),bulb(cx,52.5));}
});
// Front: nameplate, 12/24 toggle, brass buttons.
const fp=group(FRONT(0,64,24));
rect(fp,70,8,60,9,1.8,'face brass');rect(fp,71.4,9.4,57.2,6.2,1.2,'detail');text(fp,100,14.1,'CATHODA','label brand center dark-ink');
const togG=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'12 or 24 hour toggle (H)','aria-pressed':'false'});into(togG);
const tp=group(FRONT(160,64,20),togG);rect(tp,0,0,12,12,2,'face brass');rect(tp,4,3,4,6,2,'face recess');text(tp,6,-1.6,'24','etch micro center');text(tp,6,15.8,'12','etch micro center');rect(tp,-1.4,-1.4,14.8,14.8,2.6,'focus-ring');
const lever=[el('path',{class:'arm-u'},togG),el('path',{class:'arm'},togG)],lTip=el('circle',{r:1.5,class:'face top brass'},togG);into(draw);
const BTN=[['SET','s','Set button: set hours then minutes (S)'],['+','u','Plus button: adjust the selected field (Up arrow)'],['DIM','d','Dim button: day, dim, night (D)']].map(([n,k,l],i)=>{
const g=el('g',{class:'control',role:'button',tabindex:'0','aria-label':l});into(g);const x=186+i*12;
const b=cylinder(x,64,12,3.6,2.4,'y','brass');circle(b.face,0,0,2.2,'detail');circle(b.face,0,0,5.2,'focus-ring');into(draw);
text(group(FRONT(x-6,64,6),fp.parentNode),6,1.4,n,'etch micro center');return{g,k,x,o:0};});
frame([[0,0,0,220,68,24],[0,0,24,220,64,52]],12);
// State: live time with an offset, set mode, cathode cycle, 12/24 h, brightness and night.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),pad=n=>String(n).padStart(2,'0');
const MODES=['DAY','DIM','NIGHT'],BR=[1,.42,.9];
let offset=0,setMode=0,h12=false,mode=0,bri=1,cycT=-1e9,lastMin=-1,lastT=0,lastUI=0,lastSec=-1,ac=null,msg='',msgT=0;
const keyB={};document.querySelectorAll('.hint [data-k]').forEach(b=>keyB[b.dataset.k]=b);
function say(m){announcement.textContent=m;}
function note(m){msg=m;msgT=performance.now()+1600;lastUI=0;}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac)ac=new A();if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tick2(f,v=.02,d=.03,at=0){if(!ac)return;const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+at;o.type='square';o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.02);}
function press(k){const b=BTN.find(b=>b.k===k);if(b)b.o=1;}
function cycle(auto){if(!auto)audio();if(!reduced.matches)cycT=performance.now();for(let i=0;i<22;i++)tick2(900+i*30,.008,.02,i*.05);if(!auto){note('CATHODE CYCLE');say('Cathode cycle: every digit rolls through all ten cathodes.');}}
function setKey(){audio();press('s');setMode=(setMode+1)%3;tick2(1500);say(setMode===1?'Set hours with up and down.':setMode===2?'Set minutes.':'Time set.');if(!setMode)note('TIME SET');lastUI=0;}
function adjust(d){audio();press('u');if(!setMode){note('PRESS S TO SET');return;}offset+=d*(setMode===1?3600e3:60e3);tick2(d>0?1800:1200,.015);lastUI=0;}
function dim(){audio();press('d');mode=(mode+1)%3;const h=document.documentElement;if(!reduced.matches){h.classList.add('fade');clearTimeout(dim.t);dim.t=setTimeout(()=>h.classList.remove('fade'),1000);}h.classList.toggle('night',mode===2);tick2(700);say(mode===2?'Night: room lights out.':`${MODES[mode].toLowerCase()} brightness.`);lastUI=0;}
function hours(){audio();h12=!h12;tick2(400,.03,.05);set(togG,'aria-pressed',h12);set(keyB.h,'aria-pressed',h12);say(h12?'12-hour time.':'24-hour time.');lastUI=0;}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(BTN[0].g,setKey);bind(BTN[1].g,()=>adjust(1));bind(BTN[2].g,dim);bind(togG,hours);bind(testG,()=>cycle());
const act={s:setKey,c:()=>cycle(),d:dim,h:hours};Object.entries(keyB).forEach(([k,b])=>b.addEventListener('click',()=>act[k]()));
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key;
if(k==='ArrowUp'||k==='ArrowDown'){e.preventDefault();adjust(k==='ArrowUp'?1:-1);return;}
if(e.repeat)return;const f=act[k.toLowerCase()];if(f){e.preventDefault();f();}});
function tick(now){
const dt=Math.min(.05,(now-(lastT||now))/1000),red=reduced.matches;lastT=now;
const d=new Date(Date.now()+offset);let H=d.getHours();const M=d.getMinutes(),Sx=d.getSeconds(),ms=d.getMilliseconds();
if(h12)H=H%12||12;
if(M!==lastMin){if(lastMin>=0&&!setMode)cycle(true);lastMin=M;}
const digits=[...pad(H),...pad(M),...pad(Sx)].map(Number);if(h12&&H<10)digits[0]=-1;
bri+=(BR[mode]-bri)*(red?1:clamp(dt*4));
const ce=(now-cycT)/1000,blinkOff=setMode&&!red&&(now/250|0)%2===0;
tubes.forEach((t,i)=>{
let dg=digits[i];if(ce<1.6+i*.12)dg=(Math.floor(ce*26)+i*3)%10;
const hide=dg<0||(blinkOff&&((setMode===1&&i<2)||(setMode===2&&(i===2||i===3))));
const show=hide?-1:dg;
if(show!==t.d){if(t.d>=0){set(t.prev,'d',DIG[t.d]);t.fade=1;}t.d=show;if(show>=0){set(t.lit,'d',DIG[show]);set(t.core,'d',DIG[show]);}}
t.fade=red?0:Math.max(0,t.fade-dt*9);
const on=show>=0?1:0,fl=red?1:.96+Math.random()*.04;
t.lit.style.opacity=f2(on*bri*fl);t.core.style.opacity=f2(on*bri*fl*.9);t.prev.style.opacity=f2(t.fade*bri*.7);
t.bloom.style.opacity=f2(on*bri*(mode===2?.5:.3));t.spill.style.opacity=f2(on*bri*(mode===2?.75:.32));});
const colonOn=red?1:(ms<500?1:.12);colons.forEach(c=>{c.d.style.opacity=f2(colonOn*bri);c.h.style.opacity=f2(colonOn*bri*(mode===2?.9:.7));});
set(led,'class',(now/1000%1.6)<.12||setMode?'face led on':'face led');
BTN.forEach(b=>{if(b.o>0){b.o=Math.max(0,b.o-dt*5);}const k=red?0:Math.sin(Math.min(1,b.o)*Math.PI/2)*1.6;set(b.g,'transform',`translate(${f2(k*C)} ${f2(-k*S)})`);});
const ld=poly([[166,64.4,14],[166,69,h12?10:18]]);lever.forEach(n=>set(n,'d',ld));const lt=P(166,69,h12?10:18);set(lTip,'cx',f2(lt[0]));set(lTip,'cy',f2(lt[1]));
if(Sx!==lastSec||!lastUI||now-lastUI>250){lastSec=Sx;
readout.textContent=`${pad(H)}:${pad(M)}:${pad(Sx)}${h12?(d.getHours()<12?' AM':' PM'):''} · ${h12?'12H':'24H'} · ${MODES[mode]}`;
stateLabel.textContent=now<msgT?msg:ce<2.4?'CATHODE CYCLE':setMode===1?'SET HOURS · ↑ ↓':setMode===2?'SET MINUTES · ↑ ↓':`RUNNING · CYCLE IN ${60-Sx} S`;
lastUI=now;}
requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['s', 'c', 'd', 'h'], draw }
