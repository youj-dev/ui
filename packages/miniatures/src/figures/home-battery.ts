// @ts-nocheck
/* HEARTHCELL HC–13 · Home battery. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b3b3af;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--wall:#d9d4c8;--wall-top:#e8e4da;--wall-side:#c2bcae;--cell:#22324f;--cell-line:#4a6290;--alu:#d4d6d6;--alu-top:#eceeee;--alu-side:#b8bbbb;--pad:#c9c8c3;--pad-top:#dadad6;--pad-side:#b3b2ad;--conduit:#b9bbbb;--screen:#0f1720;--pv:#f2b705;--bat:#2fbf7b;--grid:#5b7cff;--load:#ff7f3a;--lamp:#ffcf7a;--win:#3a4048;--wire:#2e2e2e}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#969694;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--wall:#b6b2ab;--wall-top:#d9d5cc;--wall-side:#86847f;--cell:#1b2841;--cell-line:#3d5179;--alu:#b3b4b4;--alu-top:#dddfdf;--alu-side:#828383;--pad:#a9a8a5;--pad-top:#ccccc8;--pad-side:#7d7d7b;--conduit:#9c9d9d;--screen:#0c1117;--pv:#ffc933;--bat:#36d886;--grid:#7b95ff;--load:#ff9452;--lamp:#ffcf7a;--win:#313439;--wire:#252525;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:4.2px;letter-spacing:1.2px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.wall{fill:var(--wall)}.top.wall{fill:var(--wall-top)}.side.wall{fill:var(--wall-side)}.alu{fill:var(--alu)}.top.alu{fill:var(--alu-top)}.side.alu{fill:var(--alu-side)}.pad{fill:var(--pad)}.top.pad{fill:var(--pad-top)}.side.pad{fill:var(--pad-side)}.cell{fill:var(--cell)}.screen{fill:var(--screen)}.win{fill:var(--win)}
.siding{fill:none;stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke;opacity:.45}.cl{fill:none;stroke:var(--cell-line);stroke-width:.4}
.cu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.cd{fill:none;stroke:var(--conduit);stroke-linecap:round;stroke-linejoin:round}.drop{fill:none;stroke:var(--wire);stroke-width:.8;stroke-linecap:round}
.flow{fill:none;stroke-linecap:round;stroke-dasharray:2.2 5.6;opacity:0;filter:url(#glow)}.pv{stroke:var(--pv)}.bat{stroke:var(--bat)}.grid{stroke:var(--grid)}.load{stroke:var(--load)}
.led>.core{fill:var(--off)}.led>.halo{opacity:0;filter:url(#soft)}.on>.core{fill:var(--c)}.on>.halo{fill:var(--c);opacity:.6}.g{--c:var(--ok)}.b{--c:var(--accent)}.a{--c:var(--warn)}.r{--c:var(--fault)}
.strip{opacity:.25}.striph{opacity:0;filter:url(#bloom)}.lt{fill:#9fd4ff;font:2.7px ui-monospace,monospace;letter-spacing:.1px}.lt.pv{fill:var(--pv)}.lt.bat{fill:var(--bat)}.lt.grid{fill:var(--grid)}.lt.load{fill:var(--load)}
.warm{fill:var(--lamp);opacity:0}.warmh{fill:var(--lamp);opacity:0;filter:url(#bloom)}.sun{fill:#ffcf3a;filter:url(#glow)}.sunh{fill:#ffcf3a;opacity:.35;filter:url(#bloom)}.moon{fill:#9fb0cc}@media(prefers-color-scheme:dark){.moon{fill:#dfe6f2}}
.blade{fill:var(--top);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.blur{fill:var(--line);opacity:0;stroke:none}.sheen{fill:#fff;opacity:0;pointer-events:none}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = ``

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* HEARTHCELL HC–13. World: x lower-right; y lower-left; z up. 1 unit ≈ 25 mm.
Part x y z w d h
house wall (siding) + coping 0 0 0 200 8 120
window (4 panes, warm light at night) + porch lamp 118 8 58 44 0 40
service mast + weatherhead + drop wire 102 10 74 r1.6 – 66
battery HC–13 (status strip, 5-segment bar) 12 8 10 34 14 74
hybrid inverter (display) 56 8 52 30 10 34
backup gateway (GRID / BACKUP lamps, contactor) 56 8 16 30 10 28
utility meter (glass dome, disc) 96 8 46 14 8 24
conduits on the wall: inverter↔battery, inverter↔gateway, gateway↔meter, gateway→house
solar panel on a tilted ground mount −78 30 8 62 42 30 (tilt 28°)
solar cable along the ground → inverter
air conditioner on a pad 150 34 0 38 30 34 (top fan)
Flows: solar yellow, battery green, grid blue, house orange. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers.
const draw=root,into=g=>root=g,f2=v=>(+v).toFixed(2);
function led(g,x,y,r=.8){const l=el('g',{class:'led'},g);circle(l,x,y,r*2.4,'halo');circle(l,x,y,r,'core');l.k='';return l;}
function lit(l,c){if(l.k!==c){l.k=c;set(l,'class','led'+(c?' on '+c:''));}}
function route(pts,r=3){let d='M'+P(...pts[0]);for(let i=1;i<pts.length-1;i++){const a=pts[i-1],b=pts[i],c=pts[i+1],la=Math.hypot(...b.map((v,j)=>v-a[j])),lc=Math.hypot(...c.map((v,j)=>v-b[j]));const p=b.map((v,j)=>v+(a[j]-v)*Math.min(r,la/2)/la),q=b.map((v,j)=>v+(c[j]-v)*Math.min(r,lc/2)/lc);d+='L'+P(...p)+'Q'+P(...b)+' '+P(...q);}return d+'L'+P(...pts[pts.length-1]);}
const FL={};function conduit(key,pts,cls,w=2.4){const d=route(pts);el('path',{d,class:'cu','stroke-width':w+.9});el('path',{d,class:'cd','stroke-width':w});const f=el('path',{d,class:'flow '+cls,'stroke-width':w*.5});FL[key]={n:f,o:0};return f;}
const planeT=(o,A,B)=>{const a=P(...A),b=P(...B),p=P(...o);return`matrix(${f2(a[0])} ${f2(a[1])} ${f2(b[0])} ${f2(b[1])} ${f2(p[0])} ${f2(p[1])})`;};
// Ground: shadow, wall with siding, coping, window, porch lamp.
const shp=P(70,40,0);el('ellipse',{cx:shp[0],cy:shp[1]+8,rx:200,ry:62,class:'shadow stage-floor'});el('ellipse',{cx:shp[0],cy:shp[1]+8,rx:200,ry:62,class:'stage-contact'});
box(0,0,0,200,8,120,1,'wall');box(-2,-1,120,204,10,3,1,'wall');
const wf=group(FRONT(0,8,120));for(let v=6;v<118;v+=6)line(wf,1,v,199,v,'siding');
rect(wf,117,20,46,44,1.2,'face wall');const winG=group('',wf);rect(winG,119.5,22.5,41,39,.6,'face win');const warm=rect(winG,119.5,22.5,41,39,.6,'warm');
el('path',{d:'M121,24 C126,34 124,48 128,60 H121Z M159,24 C154,34 156,48 152,60 H159Z',fill:'#e9d7b5',opacity:.55},winG);
line(winG,140,22.5,140,61.5);line(winG,119.5,42,160.5,42);rect(wf,115,62,50,3,.8,'face top wall');
el('path',{d:'M124,26 L132,26 L123,40Z',fill:'#fff',opacity:.12},winG);
const warmH=el('ellipse',{class:'warmh'});{const p=P(140,9,78);set(warmH,'cx',f2(p[0]));set(warmH,'cy',f2(p[1]));set(warmH,'rx',34);set(warmH,'ry',26);}
box(168,8,74,4,4,8,1,'base');cylinder(170,12,71,2.4,3,'z','glass');const pl=P(170,12,72.6);const porchH=el('circle',{cx:pl[0],cy:pl[1],r:12,class:'warmh'}),porch=el('circle',{cx:pl[0],cy:pl[1],r:2.2,class:'warm'});
// Service mast with weatherhead and drop wire; meter.
cylinder(103,12,70,1.6,62,'z','alu');cylinder(103,12,132,2.6,3,'z','base');
const drop=el('path',{d:route([[103,12,134],[118,4,140],[150,-30,152]],10),class:'drop'});FL.drop={n:el('path',{d:drop.getAttribute('d'),class:'flow grid','stroke-width':1}),o:0};
box(94,8,44,18,7,28,2,'alu');const mf=group(FRONT(94,15,72));rect(mf,2,2,14,24,1.4,'detail');text(mf,9,24,'kWh','etch micro center');
const dome=cylinder(103,15,58,6.6,5,'y','glass');circle(dome.face,0,0,5.6,'detail');const disc=group('',dome.face);el('ellipse',{cx:0,cy:2.6,rx:4.6,ry:1.1,class:'face alu'},disc);const dMark=el('rect',{x:-.6,y:1.8,width:1.2,height:1.6,class:'face',style:'fill:#1e1e1e'},disc);const kwh=text(dome.face,0,-1.4,'04172','etch micro center');
// Battery, inverter, gateway on the wall.
box(12,8,10,34,14,74,3,'');const bf=group(FRONT(12,22,84));
text(bf,17,9,'HEARTHCELL','label brand center').style.letterSpacing='.45px';text(bf,17,13,'HC–13 · 13.5 kWh','etch micro center');
const strip=rect(bf,15.4,18,3.2,44,1.6,'strip'),stripH=rect(bf,13,16,8,48,4,'striph');
const SEG=[0,1,2,3,4].map(i=>led(bf,8,58-i*8,.9));text(bf,8,64,'SOC','etch micro center');
rect(bf,26,66,6,4,1,'face recess');const bs=group(SIDE(46,22,84));slits(bs,3,6,8,62,14);
box(56,8,52,30,10,34,2,'');const inf=group(FRONT(56,18,86));text(inf,15,5.6,'HYBRID 5 kW','etch micro center');
rect(inf,3,8,24,17,1.2,'face recess');rect(inf,4.2,9.2,21.6,14.6,.8,'face screen');
const LT=[['PV','pv'],['BAT','bat'],['HOME','load'],['GRID','grid']].map(([n,c],i)=>{text(inf,5.4,12.6+i*3.3,n,'lt '+c);return text(inf,24.8,12.6+i*3.3,'','lt '+c);});LT.forEach(t=>t.setAttribute('text-anchor','end'));
const INV=led(inf,6,29.6,.8);text(inf,10,30.6,'RUN','etch micro');slits(inf,17,27,10,5,5);
box(56,8,16,30,10,28,2,'');const gf=group(FRONT(56,18,44));text(gf,15,5.4,'BACKUP GATEWAY','etch micro center');
const GL=led(gf,7,11,1),BL=led(gf,7,18,1);text(gf,10.4,12,'GRID','etch micro');text(gf,10.4,19,'BACKUP','etch micro');
rect(gf,19,8,8,13,1,'face recess');const relay=group('translate(23 14.5)',gf);rect(relay,-1,-5,2,7,.8,'face alu');circle(relay,0,0,1.6,'face base');text(gf,23,24.6,'RELAY','etch micro center');
// Conduits and flows on the wall.
conduit('bat',[[56,10,74],[50,10,74],[46,12,74]],'bat',2.2);
conduit('inv',[[71,10,52],[71,10,44]],'bat',2.2);
conduit('grid',[[103,10,44],[103,10,30],[92,10,30],[86,12,30]],'grid',2.2);
conduit('house',[[66,12,16],[66,10,8],[118,10,8],[140,9,8],[140,6,10]],'load',2.2);
conduit('ac',[[118,10,8],[150,10,8],[156,26,4],[158,36,6]],'load',1.8);
// Solar panel on a tilted ground mount, cable to the inverter.
const T=28*Math.PI/180,PX=-78,PY=36,PZ=36,PW=62,PD=42,U=[1,0,0],V=[0,Math.cos(T),-Math.sin(T)];
const pp=(u,v)=>[PX+u,PY+v*Math.cos(T),PZ-v*Math.sin(T)];
for(const u of[4,PW-4]){const b=pp(u,0),f=pp(u,PD);box(b[0]-1,b[1]-1,0,2,2,b[2]-1,.5,'alu');box(f[0]-1,f[1]-1,0,2,2,f[2]-1,.5,'alu');wire([[b[0],b[1],2],[f[0],f[1],f[2]-2]],'detail');}
box(PX+2,PY-2,0,PW-4,PD+4,0.8,.6,'pad');
const panel=group(planeT(pp(0,0),U,V));rect(panel,0,0,PW,PD,1.2,'face alu');rect(panel,2,2,PW-4,PD-4,.6,'face cell');
for(let i=1;i<10;i++)line(panel,2+i*(PW-4)/10,2,2+i*(PW-4)/10,PD-2,'cl');for(let j=1;j<6;j++)line(panel,2,2+j*(PD-4)/6,PW-2,2+j*(PD-4)/6,'cl');
const sheen=el('path',{d:`M14,2 h10 L12,${PD-2} h-10Z M30,2 h4 L22,${PD-2} h-4Z`,class:'sheen'},panel);
{const e=pp(0,PD);rect(group(FRONT(e[0],e[1],e[2])),0,0,PW,1.6,.4,'face side alu');}
{const jb=pp(PW-10,PD);box(jb[0],jb[1]-4,jb[2]-5,6,3,4,.6,'base');}
conduit('pv',[[PX+PW-7,PY+PD*Math.cos(T)-2,PZ-PD*Math.sin(T)-5],[PX+PW-7,PY+PD*Math.cos(T)+2,2],[-12,82,1],[30,60,1],[51,24,1],[51,10,2],[51,10,50],[58,10,52]],'pv',2);
// Air conditioner on a pad with a top fan.
box(146,30,0,46,38,2,1.5,'pad');box(150,34,2,38,30,32,2,'');
const af=group(FRONT(150,64,34));for(let i=0;i<14;i++)line(af,3,3+i*2,35,3+i*2);text(af,19,31,'COOLAIR 3','etch micro center');
const asd=group(SIDE(188,64,34));for(let i=0;i<14;i++)line(asd,3,3+i*2,27,3+i*2);
const at=group(TOP(169,49,34));circle(at,0,0,12.6,'face recess');const ablades=group('',at);for(let i=0;i<4;i++)el('path',{d:'M0,-1.6 Q5.2,-4.4 4.4,-11 Q-.6,-11.4 -1.2,-1.8Z',class:'blade',transform:`rotate(${i*90})`},ablades);const ablur=circle(at,0,0,11.6,'blur');for(const r of[12.6,8.4,4.2])circle(at,0,0,r,'detail');for(let i=0;i<8;i++){const a=i*Math.PI/4;line(at,Math.cos(a)*4.2,Math.sin(a)*4.2,Math.cos(a)*12.6,Math.sin(a)*12.6);}circle(at,0,0,2.4,'face base');
const acG=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Air conditioner: switch on or off (L)','aria-pressed':'false'});{const p=P(169,49,30);el('ellipse',{cx:p[0],cy:p[1],rx:30,ry:26,class:'hit'},acG);el('ellipse',{cx:p[0],cy:p[1],rx:30,ry:26,class:'focus-ring'},acG);}
// Sky: sun and moon glyphs on an arc above the wall.
const SA=P(-50,-6,128),SB=P(170,-6,128),sky=el('g',{}),sunH=el('circle',{r:10,class:'sunh'},sky),sun=el('circle',{r:4.4,class:'sun'},sky),moon=el('path',{d:'M1.2,-4.8 A5,5 0 1 0 1.2,4.8 A6.2,6.2 0 0 1 1.2,-4.8Z',class:'moon'},sky);
const gwG=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Backup gateway: cut or restore the grid (G)','aria-pressed':'false'});{const p=P(71,18,30),q=P(103,15,58);el('ellipse',{cx:p[0],cy:p[1],rx:18,ry:18,class:'hit'},gwG);el('ellipse',{cx:p[0],cy:p[1],rx:18,ry:18,class:'focus-ring'},gwG);el('ellipse',{cx:q[0],cy:q[1],rx:10,ry:10,class:'hit'},gwG);}
frame([[-80,0,0,280,90,124],[150,-30,152,0,0,0],[-50,-6,158,0,0,0],[170,-6,158,0,0,0]],8);
// State: 24 h clock, solar curve, loads, battery dispatch, grid, flows.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const CAP=13.5,MAXB=5;
let hour=10,paused=false,grid=true,ac=false,soc=.52,pv=0,home=0,bat=0,imp=0,shed=false,discA=0,relayA=0,acSpin=0,acA=0,lastT=0,lastUI=0,lastLed=0,audioC=null,humG=null,msg='',msgT=0;
const keyB={};document.querySelectorAll('.hint [data-k]').forEach(b=>keyB[b.dataset.k]=b);
function say(m){announcement.textContent=m;}
function note(m){msg=m;msgT=performance.now()+1600;lastUI=0;}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!audioC){audioC=new A();const o=audioC.createOscillator(),f=audioC.createBiquadFilter();o.type='sawtooth';o.frequency.value=58;f.type='lowpass';f.frequency.value=180;humG=audioC.createGain();humG.gain.value=0;o.connect(f);f.connect(humG);humG.connect(audioC.destination);o.start();}if(audioC.state==='suspended')audioC.resume().catch(()=>{});}catch(_){audioC=null;}}
function clack(f=160){if(!audioC)return;const o=audioC.createOscillator(),g=audioC.createGain(),t=audioC.currentTime;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.4,t+.12);g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.0001,t+.14);o.connect(g);g.connect(audioC.destination);o.start(t);o.stop(t+.16);}
const hh=h=>{const H=Math.floor(h)%24,M=Math.floor((h%1)*60);return`${String(H).padStart(2,'0')}:${String(M).padStart(2,'0')}`;};
function skip(){audio();msgT=0;hour=(hour+6)%24;clack(900);say(`Skipped to ${hh(hour)}.`);lastUI=0;}
function gridT(){audio();msgT=0;grid=!grid;clack();set(gwG,'aria-pressed',!grid);set(keyB.g,'aria-pressed',!grid);say(grid?'Grid restored. Gateway reconnects.':'Grid outage. The gateway islands the house on the battery.');lastUI=0;}
function acT(){audio();msgT=0;ac=!ac;clack(400);set(acG,'aria-pressed',ac);set(keyB.l,'aria-pressed',ac);say(ac?'Air conditioner on: 3 kW.':'Air conditioner off.');lastUI=0;}
function pause(){audio();msgT=0;paused=!paused;set(keyB.p,'aria-pressed',paused);note(paused?'CLOCK PAUSED':'CLOCK RUNNING');}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(acG,acT);bind(gwG,gridT);
const act={n:skip,g:gridT,l:acT,p:pause};Object.entries(keyB).forEach(([k,b])=>b.addEventListener('click',()=>act[k]()));
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const f=act[e.key.toLowerCase()];if(f){e.preventDefault();f();}});
function flow(k,on,dir,speed){const f=FL[k];f.n.style.opacity=on?'.95':'0';if(on&&!reduced.matches){f.o+=dir*speed;f.n.style.strokeDashoffset=f2(-f.o);}}
function tick(now){
const dt=Math.min(.05,(now-(lastT||now))/1000),red=reduced.matches;lastT=now;
if(!paused)hour=(hour+dt/4)%24;
const sunUp=clamp(Math.sin((hour-6)/14*Math.PI)),night=hour<6.2||hour>19.8;
pv=sunUp>0&&hour>6&&hour<20?6*Math.pow(sunUp,1.25):0;
const evening=hour>=18&&hour<23;
home=.45+(evening?.9:hour<6?.25:.35)+(ac?3:0);
// Dispatch: solar first, then battery, then grid; islanded without the grid.
let net=pv-home;let b=0,g=0;
if(net>0){b=Math.min(net,MAXB,soc<1?MAXB:0);g=-(net-b);if(!grid){g=0;}}
else{b=-Math.min(-net,MAXB,soc>.05?MAXB:0);g=-net+b;if(!grid&&g>.01){shed=true;}}
if(grid||net>=0||soc>.05)shed=false;
bat+=(b-bat)*clamp(dt*(red?60:3));imp+=(g-imp)*clamp(dt*(red?60:3));
if(!paused)soc=clamp(soc+bat*dt/4/CAP);
// Visuals: sun/moon, panel sheen, window, porch, AC fan, meter disc, relay.
const arc=f=>{f=clamp(f);return[SA[0]+(SB[0]-SA[0])*f,SA[1]+(SB[1]-SA[1])*f-Math.sin(f*Math.PI)*26];};
const s1=arc((hour-6)/14);set(sun,'cx',f2(s1[0]));set(sun,'cy',f2(s1[1]));set(sunH,'cx',f2(s1[0]));set(sunH,'cy',f2(s1[1]));sun.style.opacity=night?0:1;sunH.style.opacity=night?0:.35;
const m1=arc((((hour+12)%24)-6)/14);set(moon,'transform',`translate(${f2(m1[0])} ${f2(m1[1])})`);moon.style.opacity=night?.9:0;
sheen.style.opacity=f2(sunUp*.22);
const wl=shed?0:clamp((evening||hour<6.5?1:0)*(1-sunUp*1.5)+(ac?.0:0));warm.style.opacity=f2(wl*.85);warmH.style.opacity=f2(wl*.45);
const porchOn=night&&!shed;porch.style.opacity=porchOn?1:0;porchH.style.opacity=porchOn?.6:0;
acSpin+=((ac&&!shed?1:0)-acSpin)*clamp(dt*1.5);if(!red){acA=(acA+acSpin*1200*dt)%360;set(ablades,'transform',`rotate(${f2(acA)})`);}ablur.style.opacity=f2(clamp((acSpin-.5)*.6,0,.3));
if(!red)discA=(discA+imp*90*dt)%360;set(dMark,'transform',`translate(${f2(Math.sin(discA*Math.PI/180)*3.6)} 0)`);
relayA+=((grid?0:50)-relayA)*clamp(dt*(red?60:10));set(relay,'transform',`translate(23 14.5) rotate(${f2(relayA)})`);
// Flows.
const k=6*dt*10;
flow('pv',pv>.05,1,pv*k);flow('bat',Math.abs(bat)>.05,bat>0?-1:1,Math.abs(bat)*k);flow('inv',Math.abs(bat)>.05||pv>.05,1,Math.max(Math.abs(bat),pv)*k*.6);
flow('grid',Math.abs(imp)>.05,imp>0?1:-1,Math.abs(imp)*k);flow('drop',grid&&Math.abs(imp)>.05,imp>0?1:-1,Math.abs(imp)*k);flow('house',!shed,1,home*k);flow('ac',ac&&!shed,1,3*k);
const sc=bat>.05?'var(--bat)':bat<-.05?'var(--grid)':'var(--line)';strip.style.fill=sc;strip.style.opacity=Math.abs(bat)>.05?'1':'.3';stripH.style.fill=sc;stripH.style.opacity=f2(Math.min(.55,Math.abs(bat)*.12));
if(humG)humG.gain.setTargetAtTime(Math.abs(bat)>.05||pv>.05?.003+Math.abs(bat)*.001:0,audioC.currentTime,.3);
if(now-lastLed>80){lastLed=now;const bk=(now/400|0)%2,n=Math.ceil(soc*5-1e-6);
SEG.forEach((l,i)=>lit(l,i<n?(i===n-1&&Math.abs(bat)>.05&&!bk&&!red?'':soc>.2?'g':'a'):''));lit(INV,'g');lit(GL,grid?'g':(bk||red?'r':''));lit(BL,!grid?'a':'');}
if(!lastUI||now-lastUI>180){
const kw=v=>`${v>=0?'+':'−'}${Math.abs(v).toFixed(1)}`;
LT[0].textContent=`${pv.toFixed(1)} kW`;LT[1].textContent=`${kw(bat)} kW`;LT[2].textContent=`${home.toFixed(1)} kW`;LT[3].textContent=grid?`${kw(imp)} kW`:'OFF';
kwh.textContent=String(4172+Math.floor(discA/360)).padStart(5,'0');
readout.textContent=`${hh(hour)} · SOLAR ${pv.toFixed(1)} kW · HOME ${home.toFixed(1)} kW · BATTERY ${Math.round(soc*100)}%`;
const parts=[];if(!grid)parts.push(shed?'GRID OUTAGE · BATTERY EMPTY · LOAD SHED':'GRID OUTAGE · BACKUP POWER');
parts.push(bat>.05?`CHARGING +${bat.toFixed(1)} kW`:bat<-.05?`DISCHARGING ${Math.abs(bat).toFixed(1)} kW`:soc>.99?'BATTERY FULL':'BATTERY IDLE');
if(grid&&imp<-.05)parts.push(`EXPORTING ${Math.abs(imp).toFixed(1)} kW`);else if(grid&&imp>.05)parts.push(`IMPORTING ${imp.toFixed(1)} kW`);
if(paused)parts.push('PAUSED');
stateLabel.textContent=now<msgT?msg:parts.join(' · ');
lastUI=now;}
requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['n', 'g', 'l', 'p'], draw }
