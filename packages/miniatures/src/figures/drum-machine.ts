// @ts-nocheck
/* MOTRIK SQ–16 · Drum machine. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--wood:#9a6a42;--wood-top:#b9875a;--wood-side:#7b5232;--knob:#2b2b2b;--knob-top:#3c3c3c;--knob-side:#222;--chrome:#d9dad8;--chrome-top:#f4f4f2;--chrome-side:#bdbebc;--baf:#2a2a2a;--cone:#4a4a4a;--print:#3c3c3a;--oled:#0b0c0d;--g1:#d9574b;--g2:#e8913a;--g3:#e5c34a;--g4:#ece8dc;--led:#ff3b30;--amb:#ffb02e;--grn:#2fd27a;--cyan:#5ad8ff;--off:#bdbdb9;--cord:#2c2c2c}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--wood:#815836;--wood-top:#ad7e54;--wood-side:#553720;--knob:#232323;--knob-top:#373737;--knob-side:#151515;--chrome:#b7b7b6;--chrome-top:#e4e4e2;--chrome-side:#858585;--baf:#222222;--cone:#3d3d3d;--print:#313130;--oled:#080809;--g1:#b7483e;--g2:#c3792f;--g3:#c1a43d;--g4:#c6c3bc;--led:#ff3b30;--amb:#d79425;--grn:#26b166;--cyan:#4bb6d7;--off:#9f9f9c;--cord:#232323;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.knob{fill:var(--knob)}.top.knob{fill:var(--knob-top)}.side.knob{fill:var(--knob-side)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.baf{fill:var(--baf)}
.g1{fill:var(--g1)}.g2{fill:var(--g2)}.g3{fill:var(--g3)}.g4{fill:var(--g4)}.grain{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.28}
.pr{fill:var(--print);font:600 1.75px ui-monospace,monospace;letter-spacing:.2px;stroke:none}.brand{font:700 5px system-ui,sans-serif;letter-spacing:2px}.ptr{stroke:#f2f2f0;stroke-width:.5;stroke-linecap:round}.ptr.k{stroke:#222}
.lc{fill:var(--off);stroke:none}.lc.on{filter:url(#glow)}.lc.r{fill:var(--led)}.lc.a{fill:var(--amb)}.lc.g{fill:var(--grn)}.lc.w{fill:#fff6e8}.lc.c{fill:var(--cyan)}
.seg{fill:var(--led);font:700 4.6px ui-monospace,monospace;letter-spacing:.5px;filter:url(#glow)}.segh{fill:var(--led);opacity:.14;filter:url(#bloom);pointer-events:none}
.ol{fill:var(--cyan);font:600 2.4px ui-monospace,monospace;stroke:none}.od{fill:var(--cyan);opacity:.16}.od.on{opacity:.9}.od.ph{opacity:.45}.od.on.ph{opacity:1;fill:#fff}
.cone{fill:url(#coneG)}.cu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.cb{fill:none;stroke:var(--cord);stroke-linecap:round;stroke-linejoin:round}
.cap{transition:transform 50ms}.down .cap{transform:translate(0,.9px)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="coneG"><stop offset=".3" style="stop-color:var(--cone)"/><stop offset="1" style="stop-color:#000;stop-opacity:.85"/></radialGradient>`

// The lab's env() builds an audio envelope; keep that body intact by naming the wrapper parameter separately.
function draw(figureEnv: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=figureEnv;
/* MOTRIK SQ–16 drum machine with two studio monitors. World: x lower-right; y lower-left (the panel faces +y); z up. 1 unit = 2.5 mm.
Part x y z w d h
monitor pads ×2 −47/227 −13/−23 0 38 42 2.5
monitors ×2 (woofer r14.4 · tweeter r6.6 · port) −48/226 −14/−24 2.5 40 44 64
speaker cables 30/182 0 6 → −20/240 −4/−20 0.8
feet ×4 14/190 6/70 0 6 6 2
left cheek (walnut) 0 0 0 6 80 24 (24 at the back → 15.5 at the front)
upper tier 6 0 2 198 52 20
pattern screen 10 4 22 44 18 0
tempo display + knob 10–30 26–49 22 20 6 / r6.5 –
swing + volume knobs 40/54 42 22 r4.2/3.8 – 3
instrument channels ×8 (level, tune, select, LED) 66–186 4–46 22 15 42 3
accent knob + clear button 196 12–28 22 r3.4 10 3
lower tier 6 52 2 198 28 11
start/stop 9 60 13 18 12 2
step LEDs ×16 35–196 56.4 13 3.2 1.3 0
step buttons ×16 31–202 61 13 8.6 10 2
right cheek (walnut) 204 0 0 6 80 24
Prints, screws and grain share their parent face. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers.
const draw=root,into=g=>root=g,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
function cord(pts,w){const d=smooth(pts);el('path',{d,class:'cu','stroke-width':w+1.1});el('path',{d,class:'cb','stroke-width':w});}
function button(g,label){set(g,'class','control');set(g,'role','button');set(g,'tabindex','0');set(g,'aria-label',label);return g;}
function bind(g,fn){g.addEventListener('click',()=>fn());g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function led(g,x,y,w,h,c){const n=rect(g,x-w/2,y-h/2,w,h,Math.min(w,h)/2,'lc');n.c=c;n.k='';return n;}
function lit(n,c){if(n.k!==c){n.k=c;set(n,'class',c?'lc on '+c:'lc');}}
function knob(x,y,r,h,cls,ptr,name){const g=name?button(el('g'),name):el('g');into(g);const k=cylinder(x,y,22,r,h,'z',cls);circle(k.face,0,0,r*.74,'detail');const rot=group('',k.face);line(rot,0,-r*.2,0,-r*.9,'ptr'+ptr);if(name)circle(k.face,0,0,r+1.5,'focus-ring');into(draw);return{g,rot};}
const turn=(k,v)=>set(k.rot,'transform',`rotate(${f2(-135+270*v)})`);

// Shadow, speaker cables and the left monitor (the right one stands in front of the right cheek, drawn last).
const sh0=P(105,30,0);el('ellipse',{cx:sh0[0],cy:sh0[1]+4,rx:200,ry:72,class:'shadow stage-floor'});el('ellipse',{cx:sh0[0],cy:sh0[1]+4,rx:200,ry:72,class:'stage-contact'});
cord([[30,1,6],[30,-8,.8],[14,-16,.8],[-6,-14,.8],[-20,-4,.8]],1.3);
cord([[182,1,6],[182,-8,.8],[200,-18,.8],[222,-24,.8],[240,-20,.8]],1.3);
function monitor(x,y){box(x+1,y+1,0,38,42,2.5,1,'knob');box(x,y,2.5,40,44,64,3.5,'');
const f=group(FRONT(x,y+44,66.5));rect(f,2,2,36,60,3,'face baf');circle(f,20,41,14.4,'face knob');circle(f,20,41,13.2,'detail');
const cm=group('',f),cn=group('translate(20 41)',cm);circle(cn,0,0,12.2,'face cone');for(const r of[9.4,6.6])circle(cn,0,0,r,'detail');circle(cn,0,0,4.4,'face top chrome');
circle(f,20,15,6.6,'face knob');circle(f,20,15,5.2,'detail');circle(f,20,15,3,'face top chrome');rect(f,10,56.6,20,2,1,'face recess');
text(f,20,6.6,'MOTRIK','pr center').style.fill='#d8d8d6';const l=led(f,33,6.2,1.3,1.3,'w');
const sd=group(SIDE(x+40,y+44,66.5));for(const[u,v]of[[5,5],[39,5],[5,59],[39,59]])screw(sd,u,v);
return{cm,l};}
const MON=[monitor(-48,-14)];
// Unit: left cheek, upper tier with its panel, lower tier with the steps, right cheek.
for(const[x,y]of[[14,6],[190,6],[14,70],[190,70]])box(x,y,0,6,6,2,1,'knob');
const PROF=[[0,24],[46,24],[56,15.5],[80,15.5]];
function cheek(x0){const x1=x0+6,sf=group(SIDE(x1,80,24));
el('path',{d:'M0,24 V8.5 L24,8.5 L34,0 L80,0 V24Z',class:'face side wood'},sf);
for(let i=0;i<3;i++){const v=12+i*4;el('path',{d:`M3,${v} C24,${v-1} 50,${v+1} 78,${v-.5}`,class:'grain'},sf);}
for(let i=0;i<PROF.length-1;i++){const[a,za]=PROF[i],[b,zb]=PROF[i+1];el('path',{d:poly([[x0,a,za],[x1,a,za],[x1,b,zb],[x0,b,zb]],true),class:'face '+(za>zb?'wood':'top wood')});}
rect(group(FRONT(x0,80,15.5)),0,0,6,15.5,1.4,'face wood');}
cheek(0);
box(6,0,2,198,52,20,1.5,'');
const T=group(TOP(0,0,22));rect(T,8,2,194,48,1.4,'detail');for(const[u,v]of[[10.5,4.5],[199.5,4.5],[10.5,47.5],[199.5,47.5]])screw(T,u,v);
for(const x of[62,190])line(T,x,4,x,48);
// Pattern screen (8 × 16 dot grid) and the red tempo display.
rect(T,10,4,44,18,1.4,'face recess');rect(T,10.6,4.6,42.8,16.8,1,'face').style.fill='var(--oled)';
const oTxt=[text(T,12,8.8,'','ol'),text(T,12,12.6,'','ol'),text(T,12,16.4,'','ol'),text(T,12,20.2,'','ol')];
const DOT=[];for(let r=0;r<8;r++){DOT.push([]);for(let c=0;c<16;c++)DOT[r].push(rect(T,27.4+c*1.55,5.8+r*1.95,1.05,1.2,.25,'od'));}
rect(T,10,26,22,7,1,'face recess');rect(T,10.6,26.6,20.8,5.8,.8,'face').style.fill='var(--oled)';el('rect',{x:11,y:27,width:20,height:5,class:'segh'},T);const seg=text(T,21,31.5,'','seg center');
text(T,36,30.6,'TEMPO','pr');text(T,36,33,'BPM','pr').style.opacity=.6;
const tempoK=knob(21,42,6.4,4,'chrome','.k','Tempo knob (Up and Down arrows)'),swingK=knob(40,42,4.2,3,'knob','','Swing knob (Left and Right arrows)'),volK=knob(54,42,3.8,3,'knob','');
text(T,40,49,'SWING','pr center');text(T,54,49,'VOL','pr center');
// Eight instrument channels.
const INS=[['BD','KICK'],['SD','SNARE'],['LT','LOW TOM'],['HT','HI TOM'],['RS','RIM'],['CP','CLAP'],['CH','CLOSED HAT'],['OH','OPEN HAT']];
const CH=INS.map(([k,n],i)=>{const xc=69.5+i*15;text(T,xc,3.9,k,'pr center');turn(knob(xc,9,3.3,3,'knob',''),.45+((i*37)%5)*.08);turn(knob(xc,20,2.7,2.6,'knob',''),.3+((i*53)%6)*.08);
text(T,xc,46.6,n,'pr center').style.fontSize='1.35px';const l=led(T,xc,40.8,1.3,1.3,'a');
const g=button(el('g'),`Select ${n.toLowerCase()} (${i+1})`);into(g);const cp=el('g',{class:'cap'},g);into(cp);box(xc-4.6,29,22,9.2,6,1.4,1,'chrome');into(g);rect(group(TOP(xc-4.6,29,23.4),g),-.8,-.8,10.8,7.6,1.2,'focus-ring');into(draw);
return{g,l};});
turn(knob(196,12,3.3,3,'knob',''),.6);text(T,196,4.2,'ACCENT','pr center');
const clr=button(el('g'),'Clear the selected track (Backspace)');into(clr);const clrC=el('g',{class:'cap'},clr);into(clrC);box(191.4,23,22,9.2,6,1.4,1,'chrome');into(clr);rect(group(TOP(191.4,23,23.4),clr),-.8,-.8,10.8,7.6,1.2,'focus-ring');into(draw);text(T,196,32.4,'CLEAR','pr center');
text(T,196,44,'SQ–16','pr center');
// Upper tier front: step numbers and colour bands.
const uf=group(FRONT(0,52,22));const SX=i=>31+i*10.75;
for(let i=0;i<16;i++){const u=SX(i)+4.3;text(uf,u,3.8,String(i+1),'pr center');rect(uf,SX(i)-.3,5.2,10.2,1.1,.4,'face g'+(1+(i>>2)));}
text(uf,18,3.8,'STEP','pr center');
// Lower tier: start/stop, step LEDs, sixteen step buttons.
box(6,52,2,198,28,11,1.5,'');
const lf=group(FRONT(0,80,13));text(lf,32,7.4,'MOTRIK','pr brand');text(lf,72,7,'SQ–16 · STEP RHYTHM UNIT','pr').style.fontSize='2px';for(let i=0;i<4;i++)rect(lf,128+i*16,4.6,14,1.4,.6,'face g'+(i+1));
const L=group(TOP(0,0,13));
const runL=led(L,18,56.6,1.5,1.5,'g');text(L,18,77.6,'START / STOP','pr center').style.fontSize='1.45px';
const play=button(el('g'),'Start or stop (Space)');into(play);const pc=el('g',{class:'cap'},play);into(pc);box(9.4,59.6,13,17.2,12.6,2,1.4,'g1');into(play);
{const t=group(TOP(9.4,59.6,15),pc);el('path',{d:'M5,4 L5,8.6 L8.8,6.3Z M10.4,4.2 h2.6 v4.2 h-2.6Z',fill:'#fff',opacity:.85},t);rect(group(TOP(9.4,59.6,15),play),-.8,-.8,18.8,14.2,1.4,'focus-ring');}into(draw);
const STEP=[];for(let i=0;i<16;i++){const x=SX(i),l=led(L,x+4.3,56.6,3.2,1.25,'r');
const g=button(el('g'),`Step ${i+1}`);into(g);const cp=el('g',{class:'cap'},g);into(cp);box(x,61,13,8.6,10,2,1.2,'g'+(1+(i>>2)));into(g);rect(group(TOP(x,61,15),g),-.8,-.8,10.2,11.6,1.4,'focus-ring');into(draw);STEP.push({g,l});}
cheek(204);
MON.push(monitor(226,-24));
frame([[-48,-24,0,314,104,66.5]],6);

// State: pattern, transport, tempo, swing; a look-ahead scheduler on the audio clock (or the page clock).
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),hk={};
const PAT=['x...x...x...x.x.','....x.......x...','..............x.','.............x..','...x......x.....','............x...','xx.xxx.xxx.xxx.x','..x...x...x...x.'].map(s=>s.split('').map(c=>c==='x'));
const STEPK='qwertyuiasdfghjk';
let sel=0,playing=false,bpm=122,swing=.54,step=-1,nextT=0,nextS=0,clk='',ac=null,master,nb,lt=0,lastUI=0,msg='',msgT=0,kick=0,flash=-1,tv=.5,sv=.3;
const Q=[];
function say(m){announcement.textContent=m;}
function note(m,a){msg=m;msgT=performance.now()+1500;lastUI=0;if(a)say(a);}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();master=ac.createGain();master.gain.value=.4;const cp=ac.createDynamicsCompressor();master.connect(cp);cp.connect(ac.destination);nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
const live=()=>ac&&ac.state==='running';
const now=()=>live()?ac.currentTime:performance.now()/1000;
function env(t,v,d,a=.001){const g=ac.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);g.connect(master);return g;}
function osc(t,type,f0,f1,d,dest,pd=.05){const o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+pd);o.connect(dest);o.start(t);o.stop(t+d+.05);}
function noise(t,d,dest,type,f,q=1){const s=ac.createBufferSource(),b=ac.createBiquadFilter();s.buffer=nb;b.type=type;b.frequency.value=f;b.Q.value=q;s.connect(b);b.connect(dest);s.start(t,Math.random()*.5,d+.05);}
let ohG=null;
function voice(i,t){if(!live())return;
if(i===0){osc(t,'sine',150,44,.42,env(t,.95,.42),.09);noise(t,.01,env(t,.25,.01),'highpass',3000);}
else if(i===1){osc(t,'triangle',220,170,.12,env(t,.35,.12),.03);noise(t,.18,env(t,.42,.18),'bandpass',1900,.8);}
else if(i===2||i===3){const f=i===2?140:220;osc(t,'sine',f*1.5,f,.32,env(t,.6,.32),.06);}
else if(i===4){osc(t,'triangle',1700,0,.04,env(t,.3,.04));noise(t,.02,env(t,.2,.02),'bandpass',3200,2);}
else if(i===5){for(const o of[0,.011,.022])noise(t+o,.01,env(t+o,.4,.012),'bandpass',1200,1.2);noise(t+.03,.16,env(t+.03,.3,.16),'bandpass',1100,1);}
else if(i===6){if(ohG){ohG.gain.cancelScheduledValues(t);ohG.gain.setTargetAtTime(.0001,t,.008);}noise(t,.05,env(t,.22,.05),'highpass',7500);}
else{ohG=env(t,.2,.38);noise(t,.4,ohG,'highpass',7000);}}
function schedule(){if(!playing)return;const src=live()?'a':'p';if(src!==clk||nextT<now()-.25){clk=src;nextT=now()+.06;}
while(nextT<now()+.12){const s=nextS,d=60/bpm/4,t=nextT+(s%2?(swing-.5)*2*d:0);
for(let i=0;i<8;i++)if(PAT[i][s])voice(i,t);Q.push([t,s]);nextS=(s+1)%16;nextT+=d;}}
setInterval(schedule,25);
function transport(){audio();playing=!playing;if(playing){nextS=0;clk='';Q.length=0;schedule();say(`Playing at ${bpm} beats per minute.`);}else{step=-1;Q.length=0;say('Stopped.');}set(hk.space,'aria-pressed',playing);set(play,'aria-pressed',playing);press(pc);lastUI=0;}
function toggle(s){audio();PAT[sel][s]=!PAT[sel][s];press(STEP[s].g.firstChild);if(!playing&&PAT[sel][s])voice(sel,now()+.01);say(`${INS[sel][1].toLowerCase()} step ${s+1} ${PAT[sel][s]?'on':'off'}.`);lastUI=0;}
function pick(i){audio();sel=i;press(CH[i].g.firstChild);if(!playing)voice(i,now()+.01);say(`${INS[i][1].toLowerCase()} selected.`);lastUI=0;}
function tempo(d){audio();bpm=clamp(bpm+d,60,180);lastUI=0;}
function swingBy(d){audio();swing=clamp(Math.round((swing+d)*100)/100,.5,.75);lastUI=0;}
function clear(){audio();const n=PAT[sel].filter(Boolean).length;PAT[sel].fill(false);press(clrC);note(n?`${INS[sel][0]} CLEARED`:`${INS[sel][0]} ALREADY EMPTY`,`${INS[sel][1].toLowerCase()} track cleared.`);}
function press(c){const g=c.parentNode;g.classList.add('down');clearTimeout(g.t);g.t=setTimeout(()=>g.classList.remove('down'),110);}
bind(play,transport);bind(clr,clear);CH.forEach((c,i)=>bind(c.g,()=>pick(i)));STEP.forEach((s,i)=>bind(s.g,()=>toggle(i)));
document.querySelectorAll('.hint [data-k]').forEach(b=>{hk[b.dataset.k]=b;b.addEventListener('click',()=>b.dataset.k==='space'?transport():clear());});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.toLowerCase();
if(k==='arrowup'||k==='arrowdown'){e.preventDefault();tempo((k==='arrowup'?1:-1)*(e.shiftKey?5:1));return;}
if(k==='arrowleft'||k==='arrowright'){e.preventDefault();swingBy(k==='arrowright'?.02:-.02);return;}
if(e.repeat)return;
if(k===' '){if(e.target.closest&&e.target.closest('button,[role=button]'))return;e.preventDefault();transport();}
else if(/^[1-8]$/.test(k)){e.preventDefault();pick(+k-1);}else if(STEPK.includes(k)){e.preventDefault();toggle(STEPK.indexOf(k));}
else if(k==='backspace'){e.preventDefault();clear();}});
function tick(t){
const dt=Math.min(.05,(t-(lt||t))/1000),red=reduced.matches;lt=t;
const n=now();while(Q.length&&Q[0][0]<=n){step=Q.shift()[1];if(PAT[0][step])kick=1;flash=t;}
kick=Math.max(0,kick-dt*7);
MON.forEach((m,i)=>{const d=red?0:kick*2*(i?1:.96);set(m.cm,'transform',`translate(${f2(-d*C)} ${f2(d*S)})`);lit(m.l,'w');});
STEP.forEach((s,i)=>lit(s.l,playing&&i===step?'w':PAT[sel][i]?'r':''));
CH.forEach((c,i)=>lit(c.l,i===sel?'a':playing&&step>=0&&PAT[i][step]&&t-flash<90?'r':''));
lit(runL,playing&&(red||step%4<2)?'g':'');
for(let r=0;r<8;r++)for(let c=0;c<16;c++){const d=DOT[r][c],k=(PAT[r][c]?'on':'')+(playing&&c===step?' ph':'');if(d.k!==k){d.k=k;set(d,'class','od '+k);}}
tv=red?(bpm-60)/120:tv+((bpm-60)/120-tv)*clamp(dt*14);sv=red?(swing-.5)/.25:sv+((swing-.5)/.25-sv)*clamp(dt*14);turn(tempoK,tv);turn(swingK,sv);
if(!lastUI||t-lastUI>120){lastUI=t;turn(volK,.7);
const cnt=PAT[sel].filter(Boolean).length,sw=Math.round(swing*100);
seg.textContent=bpm.toFixed(1);oTxt[0].textContent='A01';oTxt[1].textContent=INS[sel][0];oTxt[2].textContent=playing?String(step+1).padStart(2,'0')+'/16':'STOP';oTxt[3].textContent='SW'+sw;
readout.textContent=`${playing?'▶':'■'} ${bpm} BPM · SWING ${sw}%${playing?` · STEP ${String(step+1).padStart(2,'0')}`:''}`;
stateLabel.textContent=t<msgT?msg:`${INS[sel][0]} · ${INS[sel][1]} · ${cnt} STEP${cnt===1?'':'S'} · PATTERN A01`;}
requestAnimationFrame(tick);}
requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['space', 'backspace'], draw }
