// @ts-nocheck
/* CARILLON M–100 · Jukebox. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--base-top:#cbcbc7;--base-side:#a4a4a1;--chrome:#dcdddb;--chrome-top:#f6f6f5;--chrome-side:#bfc0be;--vinyl:#1d1d1d;--groove:#3c3c3c;--inside:#2a2a2a;--inside-side:#222;--card:#fbf8ef;--t1:#f0961c;--t2:#e23d86;--t3:#3b5bfd;--t4:#0fa383;--coin:#e5392b;--sheet:.2}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--base-top:#bebeba;--base-side:#737372;--chrome:#b9bab9;--chrome-top:#e6e6e5;--chrome-side:#878786;--vinyl:#171717;--groove:#313131;--inside:#222222;--inside-side:#151515;--card:#d3d1cb;--t1:#ffad3d;--t2:#ff5ea8;--t3:#6f88ff;--t4:#2fd6ae;--coin:#ff5245;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
.top.base{fill:var(--base-top)}.side.base{fill:var(--base-side)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.inside{fill:var(--inside)}.side.inside{fill:var(--inside-side)}
.cu{fill:none;stroke:var(--line);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.cr{fill:none;stroke:var(--chrome-top);stroke-width:1.1;stroke-linecap:round;stroke-linejoin:round}.trim{fill:none;stroke:var(--chrome-top);stroke-width:1.2;vector-effect:non-scaling-stroke}.trim-u{fill:none;stroke:var(--line);stroke-width:2.4;vector-effect:non-scaling-stroke}
.vinyl{fill:var(--vinyl);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.groove{fill:none;stroke:var(--groove);stroke-width:.35}.lab{stroke:none}.sheen{fill:none;stroke:#fff;stroke-width:.5;opacity:.25}
.tube{fill:url(#tubeG);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.tube-l{filter:url(#glow)}.glowband{fill:url(#tubeG);opacity:.25;filter:url(#bloom);pointer-events:none}.div{stroke:var(--line);stroke-width:.5;opacity:.6}
.liquid{stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.bubble{fill:#fff;fill-opacity:.55;stroke:none}
.ray{opacity:.5}.backglow{opacity:.5;filter:url(#bloom);pointer-events:none}
.card{fill:var(--card);stroke:var(--line);stroke-width:.4;vector-effect:non-scaling-stroke}.title{fill:#2b2b2b;font:600 1.75px ui-monospace,monospace;letter-spacing:.12px}.num{fill:#2b2b2b;font:700 2px ui-monospace,monospace}
.key .cap{fill:var(--chrome-top)}.key.on .cap{fill:var(--accent);filter:url(#glow)}.key-t{fill:var(--ink);font:700 2.1px ui-monospace,monospace;text-anchor:middle;pointer-events:none}.key.on .key-t{fill:#fff}
.coin{fill:var(--off)}.empty .coin{fill:var(--coin);filter:url(#glow)}.has .coin{fill:#ffb648;filter:url(#glow)}.lens{fill:url(#tubeG);opacity:.85}
.plate-t{font-size:3.3px;letter-spacing:.9px;font-weight:600}.pane{fill:#fff;opacity:var(--sheet);pointer-events:none}.cloth{fill:var(--inside)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<linearGradient id="tubeG" x1="0" y1="0" x2="1" y2="0"><stop offset="0" style="stop-color:var(--t1)"/><stop offset=".33" style="stop-color:var(--t2)"/><stop offset=".66" style="stop-color:var(--t3)"/><stop offset="1" style="stop-color:var(--t4)"/></linearGradient>
<linearGradient id="liqA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--t1)"/><stop offset="1" style="stop-color:var(--t2)"/></linearGradient>
<linearGradient id="liqB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--t4)"/><stop offset="1" style="stop-color:var(--t3)"/></linearGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* CARILLON M–100 jukebox. World: x lower-right, y lower-left, z up; 1 unit = 1 cm.
Part                        x      y      z      w      d      h
plinth + kick plate         2      2      0     72     44      6
cabinet                     0      0      6     76     48     98
arched top (half cylinder)  0      0    104     76     48     38   chrome ribs
arch light pipe            3–73     48  104–139   r29–35      –      –   segmented, colour cycles
bubble tubes (2)       3 / 67     48   8–100      6      0     92
window (arched)          12–64     48  60–130     52      0     70   clipped view inside, glass
interior walls + floor      2     10     58     72     38     82   sunburst, backlight
record magazine (10)    20–58     26  75–93    r8.8     –      –   standing on edge, tray
turntable                  38     40     58   r10.5     –      6   mat, spindle
moving record + gripper      –      –  64–100   r8.8     –      –   lift, flip, lower
tone arm                   53     44     62     14      –    3.5
title strips (10)       14–62     48  42–57     50      0     15
selection keys (10)     13–57     48  35–40    3.6      0      5   lit when chosen
coin + reject plate     57–63     48  34–41      6      0      7
speaker grille          12–64     48  10–32     52      0     22   bars, emblem
side panel + lens          76   4–46   10–100     0     42     90 */
// Isometric engine: affine face planes, solids, round parts, grille and fit.
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers.
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`;
function pin(g,x,y,r=.75){circle(g,x,y,r,'face top');line(g,x-r*.5,y+r*.35,x+r*.5,y-r*.35);}
const adopt=(g,n)=>{g.appendChild(n.g||n);return n;};
const add=(...v)=>v.reduce((s,q)=>[s[0]+q[0],s[1]+q[1],s[2]+q[2]]),mul=(a,k)=>a.map(c=>c*k),lerp=(a,b,t)=>a+(b-a)*t,mix=(a,b,t)=>a.map((v,i)=>lerp(v,b[i],t));
const SONGS=[['COSMIC MILKSHAKE',132,45,'#e2563f'],['PARKING LOT MOON',96,50,'#f0b13a'],['TWIST OF LIME',148,52,'#3b5bfd'],['ROCKET SOCKS',140,47,'#2fbf9b'],['VELVET RADIO',88,43,'#f2e6c8'],['CHERRY SODA',124,48,'#d6418a'],['HOPSCOTCH HOP',156,53,'#8a6cf0'],['ORBIT TWIST',118,46,'#ff8c3a'],['LATE BUS HOME',84,41,'#7ac943'],['NEON NOODLE',136,49,'#e8e8e8']].map(([t,bpm,root,c],i)=>({t,bpm,root,c,key:String((i+1)%10)}));
// Assembly: shadow, plinth, arched cabinet (curved top, side, front), the clipped interior, glass, then lights and controls.
const sh=P(40,26,0);el('ellipse',{cx:sh[0],cy:sh[1]+2,rx:62,ry:27,class:'shadow stage-floor'});el('ellipse',{cx:sh[0],cy:sh[1]+2,rx:62,ry:27,class:'stage-contact'});
box(2,2,0,72,44,6,1.5,'base');const KP=group(FRONT(2,46.05,6));rect(KP,2,1.2,68,3.6,1,'face chrome');for(let i=0;i<9;i++)line(KP,6+i*7.5,1.6,6+i*7.5,4.4,'detail');
const CT=group(FRONT(38,48,104)),T1=-38/Math.SQRT2;
el('path',{d:`M-38,0 A38,38 0 0 1 ${T1},${T1} L${T1+48},${T1-48} A38,38 0 0 1 86,-48 L38,0 Z`,class:'face top'},CT);
const tp=(a,r=38)=>[r*Math.cos(a*Math.PI/180),-r*Math.sin(a*Math.PI/180)],[q1,q2]=[tp(70),tp(82)];
const topPipe=el('path',{d:`M${q1}L${q2}L${q2[0]+48},${q2[1]-48}L${q1[0]+48},${q1[1]-48}Z`,class:'tube tube-l'},CT);
for(const a of[25,50,100,122]){const r=a*Math.PI/180,x=38*Math.cos(r),y=-38*Math.sin(r);line(CT,x,y,x+48,y-48,'trim-u');line(CT,x,y,x+48,y-48,'trim');}
const SF=group(SIDE(76,48,104));rect(SF,0,0,48,98,1.5,'face side');rect(SF,5,5,38,86,2,'detail');rect(SF,7,7,34,82,1.6,'detail');
const lensS=rect(SF,1.4,8,2.4,82,1.2,'lens tube-l');line(SF,5,48,43,48,'trim-u');line(SF,5,48,43,48,'trim');for(const[u,v]of[[3,3],[45,3],[3,95],[45,95]])pin(SF,u,v,.6);
const FF=group(FRONT(0,48,104));el('path',{d:'M0,98 V0 A38,38 0 0 1 76,0 V98 Z',class:'face'},FF);
// Interior, clipped to the arched window.
const WIN='M12,44 V0 A26,26 0 0 1 64,0 V44 Z';
el('path',{d:WIN,transform:FRONT(0,48,104)},el('clipPath',{id:'win'},svg.querySelector('defs')));
const IN=el('g',{'clip-path':'url(#win)'});
rect(group(FRONT(0,10,150),IN),0,0,76,92,0,'face inside');
const BK=group(FRONT(0,10.05,150),IN),RC=['--t1','--t2','--t3','--t4'];
for(let i=0;i<18;i++){const a=Math.PI*(1+i/17),r1=60;el('path',{d:`M38,46 L${38+Math.cos(a-.05)*r1},${46+Math.sin(a-.05)*r1} L${38+Math.cos(a+.05)*r1},${46+Math.sin(a+.05)*r1}Z`,class:'ray',style:`fill:var(${RC[i%4]})`},BK);}
const backGlow=el('ellipse',{cx:38,cy:46,rx:30,ry:22,class:'backglow',style:'fill:var(--t1)'},BK);circle(BK,38,46,5,'face chrome');
rect(group(SIDE(2.05,48,150),IN),0,0,38,92,0,'face side inside');rect(group(TOP(2,10,58),IN),0,0,72,38,0,'face inside');
adopt(IN,box(15,20,72,48,12,2.4,.8,'chrome'));for(let i=0;i<11;i++){adopt(IN,box(17.9+i*4.2,21,74.4,.5,10,1.6,.2,'chrome'));}
const XI=i=>20+i*4.2,MAG=SONGS.map((s,i)=>{const g=el('g',{},IN);return{g,i};});
function disc(g,o,A,B,s,spin=0){const d=el('g',{transform:plane(o,A,B)},g);circle(d,0,0,8.8,'vinyl');for(const r of[7.8,6.6,5.4,4.4])circle(d,0,0,r,'groove');
const lb=circle(d,0,0,3.3,'lab');set(lb,'fill',s.c);const m=el('g',{transform:`rotate(${spin})`},d);line(m,0,-1.2,0,-3,'detail');text(m,0,2.4,s.key,'num center');circle(d,0,0,.45,'face recess');el('path',{d:'M-6.6,-3.4 A7.4,7.4 0 0 1 -3.4,-6.6',class:'sheen'},d);return d;}
const A0=[0,1,0],B0=[0,0,1];
MAG.forEach(m=>disc(m.g,[XI(m.i),26,84],A0,B0,SONGS[m.i]));
adopt(IN,box(26,30,58,24,18,3,.8,'base'));const plat=adopt(IN,cylinder(38,40,61,10.5,2,'z','chrome'));circle(plat.face,0,0,10,'face inside');for(const r of[8.5,6.4])circle(plat.face,0,0,r,'groove');
const platMark=el('g',{},plat.face);line(platMark,0,-7,0,-9.5,'trim');adopt(IN,cylinder(38,40,63,.5,1.6,'z','chrome'));
const moving=el('g',{},IN),grip=el('g',{},IN);adopt(IN,cylinder(53,44,58,2.4,4.6,'z','chrome'));const arm=el('g',{},IN);
el('path',{d:'M14,44 V0 A24,24 0 0 1 62,0 V44 Z',transform:FRONT(0,48.1,104),class:'pane'});
el('path',{d:'M16,40 L28,-14 L32,-15.5 L20,40 Z M38,40 L46,4 L48,3.6 L40,40 Z',transform:FRONT(0,48.12,104),class:'pane'});
// Front: window chrome, arch light pipe, bubble tubes, title strips, keys, coin plate, grille.
const FD=group(FRONT(0,48.1,104));
el('path',{d:WIN,class:'trim-u',fill:'none'},FD);el('path',{d:WIN,class:'trim',fill:'none'},FD);
const band=el('path',{d:'M3,0 A35,35 0 0 1 73,0 L67,0 A29,29 0 0 0 9,0 Z',class:'tube tube-l'},FD);
const bandGlow=el('path',{d:'M3,0 A35,35 0 0 1 73,0 L67,0 A29,29 0 0 0 9,0 Z',class:'glowband'},FD);
for(let a=15;a<180;a+=15){const r=a*Math.PI/180;line(FD,38+Math.cos(r)*29,-Math.sin(r)*29,38+Math.cos(r)*35,-Math.sin(r)*35,'div');}
for(const r of[35.6,28.4]){el('path',{d:`M${38-r},0 A${r},${r} 0 0 1 ${38+r},0`,class:'trim-u'},FD);el('path',{d:`M${38-r},0 A${r},${r} 0 0 1 ${38+r},0`,class:'trim'},FD);}
const TUBES=[[3,'liqA'],[67,'liqB']].map(([u,g])=>{rect(FD,u-.6,2.6,7.2,95,1.6,'face chrome');const l=rect(FD,u,4,6,92,2.6,'liquid');set(l,'fill',`url(#${g})`);l.classList.add('tube-l');
const b=[...Array(9)].map((_,k)=>({n:circle(FD,u+3,90,0,'bubble'),y:96-k*10.5,s:1.2+((k*37)%10)/12}));rect(FD,u-.8,1.6,7.6,3,1,'face chrome');rect(FD,u-.8,95,7.6,3,1,'face chrome');return{u,b,l};});
rect(FD,12.4,45.4,51.2,17.2,1.4,'face chrome');rect(FD,13.4,46.4,49.2,15.2,1,'face inside');
SONGS.forEach((s,i)=>{const c=i<5?0:1,r=i%5,u=14.4+c*24.6,v=47.4+r*2.82;rect(FD,u,v,23.4,2.42,.4,'card');text(FD,u+1.2,v+1.85,s.key,'num');text(FD,u+3.6,v+1.75,s.t,'title');});
const KEYS=SONGS.map((s,i)=>{const g=button(group(FRONT(13.6+i*4.3,48.2,40.2)),{class:'control key','aria-label':`Play ${s.key}: ${s.t.toLowerCase()}`});
rect(g,0,0,3.6,4.6,.8,'face chrome');const cap=rect(g,.4,.4,2.8,3.4,.6,'cap');cap.classList.add('face');text(g,1.8,3,s.key,'key-t');rect(g,-.8,-.8,5.2,6.2,1,'focus-ring');rect(g,-.4,-.4,4.4,5.4,0,'hit');return g;});
const CP=group(FRONT(57.4,48.2,41));rect(CP,0,0,6.4,7.4,1,'face chrome');rect(CP,2.6,1.2,1.2,3.4,.4,'face recess');circle(CP,3.2,6,.85,'coin');
const coinBtn=button(el('g',{},CP),{'aria-label':'Insert a coin (C)'});rect(coinBtn,-.6,-.6,7.6,8.6,1,'focus-ring');rect(coinBtn,0,0,6.4,7.4,0,'hit');
const rej=button(group(FRONT(57.4,48.2,33.6)),{'aria-label':'Reject the record (Space)'});rect(rej,0,0,6.4,2.4,.8,'face chrome');text(rej,3.2,1.75,'REJECT','title center');rect(rej,-.6,-.6,7.6,3.6,1,'focus-ring');
rect(FD,12,72,52,22,1.6,'face chrome');rect(FD,13.2,73.2,49.6,19.6,1,'cloth face');
for(let i=0;i<13;i++){rect(FD,14.4+i*3.75,73.2,1.4,19.6,.6,'face chrome');}
circle(FD,38,86.6,5,'face chrome');circle(FD,38,86.6,3.8,'face inside');el('path',{d:'M38,83.4 L39,85.6 L41.4,85.8 L39.5,87.3 L40.2,89.8 L38,88.4 L35.8,89.8 L36.5,87.3 L34.6,85.8 L37,85.6 Z',class:'lens'},FD);
rect(FD,25,74.2,26,5.2,1.2,'face chrome');text(FD,38,77.95,'CARILLON','label plate-t center');for(const[u,v]of[[2,100],[74,100]])pin(FD,u,v-4,.7);
frame([[0,0,0,76,48,104],[0,0,104,76,48,38]],10);
// State: credits, volume, the transfer timeline, music and lights.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const say=t=>{announcement.textContent=t;},clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
let ac=null,master=null,nb=null,music=null;
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3200;master=ac.createGain();master.connect(lp);lp.connect(ac.destination);vol(0);}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
function note(f,t,d,v,type){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(master);o.start(t);o.stop(t+d+.02);}
function noise(t,d,v,f){if(!nb){nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}const s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;b.type='highpass';b.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(master);s.start(t,Math.random()*.5,d+.02);}
function blip(f,d=.06,v=.03,type='triangle'){if(!audio()||!master)return;note(f,ac.currentTime,d,v,type);}
const mf=m=>440*Math.pow(2,(m-69)/12);
function schedule(){if(!music||!ac)return;const s=SONGS[music.i],spb=60/s.bpm/2,sc=[0,3,5,7,10,12];
while(music.t<ac.currentTime+.2){const b=music.b,t=music.t,bar=Math.floor(b/8)%4,prog=[0,5,7,0][bar],r=s.root+prog;
if(b%2===0){note(mf(r+(b%8===4?7:0)),t,spb*1.6,.5,'triangle');music.beats.push(t);}
if(b%8===2||b%8===6)noise(t,.12,.18,1800);noise(t,.03,.05,7000);
if(b%4===3)[0,4,7].forEach(k=>note(mf(r+24+k),t,spb*.7,.07,'square'));
const h=(music.i*7+b*5+bar*3)%11;if(h<6)note(mf(s.root+24+sc[(h+bar)%6]),t,spb*.9,.13,'triangle');
if(Math.random()<.04)noise(t,.01,.08,3000);music.b++;music.t+=spb;}}
let credits=3,volume=6,state='idle',cur=-1,queue=-1,t0=performance.now(),spin=0,hue=0,pulse=0,outKey='',last=performance.now(),bub=0;
function vol(d){volume=clamp(volume+d,0,10);if(master)master.gain.setTargetAtTime(volume/10*.05,ac.currentTime,.05);}
const RD=reduced.matches?.01:1,DUR={fetch:2300*RD,armin:650*RD,armout:550*RD,ret:2100*RD,play:16000};
function go(s){state=s;t0=performance.now();}
function pick(i){audio();if(credits<=0){svg.classList.add('empty');setTimeout(()=>svg.classList.remove('empty'),900);blip(220,.12,.03,'square');say('Insert a coin first: press C.');return;}
if(i===cur&&state!=='idle')return;credits--;KEYS.forEach((k,n)=>k.classList.toggle('on',n===i));blip(660,.05,.03);say(`Selected ${SONGS[i].key}: ${SONGS[i].t.toLowerCase()}.`);
if(state==='idle'){cur=i;go('fetch');}else{queue=i;if(state==='play'||state==='armin')go('armout');}}
function reject(){audio();if(state==='play'||state==='armin'){queue=-1;go('armout');say('Record rejected.');blip(300,.08,.03,'square');}}
function coin(){audio();credits=Math.min(9,credits+1);svg.classList.add('has');setTimeout(()=>svg.classList.remove('has'),700);blip(1320,.05,.025);blip(990,.08,.02);say(`${credits} credit${credits>1?'s':''}.`);}
KEYS.forEach((k,i)=>bind(k,()=>pick(i)));bind(coinBtn,coin);bind(rej,reject);
document.querySelectorAll('.hint [data-k]').forEach(b=>b.addEventListener('click',()=>b.dataset.k==='c'?coin():reject()));
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key;
if(k==='ArrowUp'||k==='ArrowDown'){e.preventDefault();audio();vol(k==='ArrowUp'?1:-1);blip(500+volume*60,.03,.02);return;}
if(e.repeat)return;if(/^[0-9]$/.test(k)){e.preventDefault();pick((+k+9)%10);}
else if(k===' '){if(e.target.closest&&e.target.closest('button,[role=button]'))return;e.preventDefault();reject();}else if(k.toLowerCase()==='c'){e.preventDefault();coin();}});
// Record path: in its slot (vertical) → lifted → flipped flat over the platter → lowered. Returns run it backwards.
function recordAt(i,p){const slot=[XI(i),26,84],up=[XI(i),26,98],over=[38,40,76],on=[38,40,63.3];
if(p<.2)return{c:mix(slot,up,ease(p/.2)),th:0};if(p<.75){const q=ease((p-.2)/.55);return{c:[lerp(up[0],over[0],q),lerp(up[1],over[1],q),lerp(up[2],over[2],q)+Math.sin(q*Math.PI)*6],th:q*Math.PI/2};}return{c:mix(over,on,ease((p-.75)/.25)),th:Math.PI/2};}
function drawMoving(i,p,sp){moving.textContent='';grip.textContent='';let hand=[60,22,98];if(i>=0){const{c,th}=recordAt(i,p),B=[Math.sin(th),0,Math.cos(th)];disc(moving,c,A0,B,SONGS[i],sp);hand=add(c,mul(B,9.4));}
const sh=[66,16,104],h2=hand,el2=[(sh[0]+h2[0])/2+2,(sh[1]+h2[1])/2,Math.max(sh[2],h2[2])+5];
for(const cls of['cu','cr'])wire([sh,el2,h2],cls,grip);for(const q of[sh,el2]){const s=P(...q);el('circle',{cx:s[0],cy:s[1],r:1.4,class:'face chrome'},grip);}
const hs=P(...h2);el('path',{d:`M${hs[0]-1.6},${hs[1]-1.2} l1.6,2.2 l1.6,-2.2`,class:'detail'},grip);}
function drawArm(a){arm.textContent='';const pv=[53,44,64.2],ang=lerp(-Math.PI/2,-2.42,a),hd=[pv[0]+14*Math.cos(ang),pv[1]+14*Math.sin(ang),64.2+(a>.98?.5:1.6)],cw=[pv[0]-4*Math.cos(ang),pv[1]-4*Math.sin(ang),65];
for(const cls of['cu','cr'])wire([cw,pv,hd],cls,arm);const s=P(...cw);el('circle',{cx:s[0],cy:s[1],r:1.7,class:'face chrome'},arm);const h=P(...hd);el('rect',{x:h[0]-1.4,y:h[1]-1,width:2.8,height:1.8,rx:.4,class:'face base'},arm);}
for(const m of MAG)m.g.style.display='';
let lastP=-2,lastA=-1;
function tick(now){const dt=Math.min(.05,(now-last)/1000);last=now;const e=now-t0;let p=-1,a=0;
if(state==='fetch'){p=clamp(e/DUR.fetch);if(p>=1)go('armin');}
else if(state==='armin'){p=1;a=clamp(e/DUR.armin);if(a>=1&&queue>=0)go('armout');else if(a>=1){go('play');if(audio()&&master){music={i:cur,t:ac.currentTime+.05,b:0,beats:[]};}say(`Now playing ${SONGS[cur].t.toLowerCase()}.`);}}
else if(state==='play'){p=1;a=1;if(e>DUR.play){queue=-1;go('armout');}}
else if(state==='armout'){p=1;a=1-clamp(e/DUR.armout);music=null;if(a<=0)go('ret');}
else if(state==='ret'){p=1-clamp(e/DUR.ret);if(p<=0){const nx=queue;queue=-1;MAG[cur].g.style.display='';KEYS[cur].classList.remove('on');cur=-1;if(nx>=0){cur=nx;KEYS[nx].classList.add('on');go('fetch');}else go('idle');}}
if(cur>=0&&state!=='idle')MAG[cur].g.style.display=p>0||state!=='ret'?'none':'';
schedule();
const playing=state==='play';if(playing&&!reduced.matches)spin=(spin+dt*270)%360;
if(p!==lastP||playing){drawMoving(state==='idle'?-1:cur,Math.max(0,p),spin);lastP=p;}if(a!==lastA){drawArm(a);lastA=a;}
set(platMark,'transform',`rotate(${spin})`);
if(music&&music.beats.length&&ac){while(music.beats.length>1&&music.beats[1]<=ac.currentTime)music.beats.shift();if(music.beats[0]<=ac.currentTime){pulse=1;music.beats.shift();}}
pulse=Math.max(0,pulse-dt*4);const beatish=playing&&!music?Math.max(0,Math.sin(now/230)):0;
hue=(hue+dt*(playing?60:6)*(reduced.matches?0:1))%360;const f=`hue-rotate(${hue}deg)`;
[band,bandGlow,lensS,topPipe,...TUBES.map(t=>t.l)].forEach(n=>n.style.filter=`${f} url(#${n===bandGlow?'bloom':'glow'})`);
bandGlow.style.opacity=.18+.4*Math.max(pulse,beatish)*(playing?1:0);set(backGlow,'style',`fill:var(${RC[Math.floor(hue/90)%4]});opacity:${.35+.35*Math.max(pulse,beatish)*(playing?1:0)}`);
bub+=dt;for(const t of TUBES)for(const b of t.b){if(!reduced.matches)b.y-=dt*b.s*7;if(b.y<6)b.y=95;set(b.n,'cy',b.y);set(b.n,'cx',t.u+3+Math.sin(bub*3+b.y)*.6);set(b.n,'r',.45+b.s*.25);}
const secs=state==='play'?Math.floor(e/1000):0;
const r=cur>=0?`${SONGS[cur].key} · ${SONGS[cur].t}`:'SELECT 1–0',st=(state==='idle'?'IDLE':state==='fetch'?`LOADING ${SONGS[cur].key}`:state==='armin'?'CUEING':state==='play'?`PLAYING 0:${String(secs).padStart(2,'0')}`:'RETURNING')+` · VOL ${volume} · ${credits} CREDIT${credits===1?'':'S'}`;
if(r+st!==outKey){readout.textContent=r;stateLabel.textContent=st;outKey=r+st;}
requestAnimationFrame(tick);}
drawArm(0);requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['space', 'c'], draw }
