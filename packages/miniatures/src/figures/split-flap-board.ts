// @ts-nocheck
/* PERRON F–11 · Split-flap board. Drawn for this project on the shared engine, in the shape the ported figures
 * take: its stylesheet, defs and script. The script runs on the env, which stands in for the page; its types are
 * at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--en:#e5e2da;--en-top:#f6f4ee;--en-side:#cbc7bd;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--rubber:#2e2e2d;--rubber-top:#474745;--rubber-side:#282827;--pit:#151514;--pitw:#3a3a38;--pitf:#4a4a47;--flap:#232322;--flap-top:#2c2c2a;--glyph:#f4f0e4;--cg:#2fae6c;--ca:#eab43c;--cr:#df5546;--cb:#2f6fe0}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--en:#c0beb9;--en-top:#e6e4df;--en-side:#8e8c89;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--rubber:#252524;--rubber-top:#424240;--rubber-side:#191919;--pit:#10100f;--pitw:#262625;--pitf:#454542;--flap:#1c1c1b;--flap-top:#232322;--glyph:#cdcac3;--cg:#26925a;--ca:#c59731;--cr:#bc463a;--cb:#265cbd;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:5.4px;letter-spacing:1.8px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.end{text-anchor:end}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.en{fill:var(--en)}.top.en{fill:var(--en-top)}.side.en{fill:var(--en-side)}.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}.side.rubber{fill:var(--rubber-side)}.pit{fill:var(--pit)}.pitw{fill:var(--pitw)}.top.pitw{fill:var(--pitf)}
.flap{fill:var(--flap);stroke:none}.flap.ft{fill:var(--flap-top)}.flap.cg{fill:var(--cg)}.flap.ca{fill:var(--ca)}.flap.cr{fill:var(--cr)}.flap.cb{fill:var(--cb)}
.gl{fill:none;stroke:var(--glyph);stroke-width:1.8;stroke-linejoin:miter;stroke-miterlimit:2.6}.sheen{fill:#fff;stroke:none;opacity:.1}.dim{fill:#000;stroke:none;opacity:0}.lift{fill:#fff;stroke:none;opacity:0}.pin{fill:var(--pitf);stroke:none}.flaps{pointer-events:none}
.lamp{fill:var(--off);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.g,.lamp.a{filter:url(#glow);stroke:none}
.arm-u{fill:none;stroke:var(--line);stroke-width:2.6;stroke-linecap:round}.arm{fill:none;stroke:var(--metal-top);stroke-width:1.5;stroke-linecap:round}
.control{cursor:pointer;outline:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .top.rubber{fill:var(--rubber)}.control:hover .top.en{fill:var(--en)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<clipPath id="ht"><rect x="-6.4" y="-10.4" width="12.8" height="10.1"/></clipPath>
<clipPath id="hb"><rect x="-6.4" y=".3" width="12.8" height="10.1"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* PERRON F–11 split-flap board. World: x lower-right; y lower-left (the flaps face +y); z up. 1 unit ≈ 2 mm.
Part x y z w d h
rubber feet (2) 12 / 150 4 0 22 33 6
housing (enamel) 0 0 6 184 40 78 (front plane y 40; front-local u = x, v = 84 − z)
bezel (aluminum) 7–177 40 12–72 170 – 60
display field (recessed 3) 9 37 14–70 166 – 56
flap modules 2 × 11, 12.8 × 20.8 (pitch 14.4) 14.6–171.4 37 hinges at z 55 / 29
row rail (rubber) 10 37 41.2 164 1.2 1.6
auto switch: plate, lever (6.4, ±28°), lamp 110 15 84 18 13 1
home button r3.1 140 22 85 – – 1.8
next button r6.2 on a collar r8 161 22 84 – – 4
drive knob r7.4 (turns while the drums run) 184 20 46 3.4 – –
side vents, rating plate, screws 184 0–40 8–80 – 40 –
A module shows one character split at its hinge: the top half on the flap above, the bottom half on the back of the flap
that fell before it. Its drum turns one way only; a falling flap carries the old top half on its face and the new
bottom half on its back. Glyphs are single strokes in an 8 × 15 box. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: oriented planes, controls.
const draw=root,defs=svg.querySelector('defs'),into=g=>root=g,f2=v=>(+v).toFixed(2),D=Math.PI/180;
const plane=(o,U,V)=>`matrix(${P(...U).map(f2).join(' ')} ${P(...V).map(f2).join(' ')} ${P(...o).map(f2).join(' ')})`;
function button(g,label){set(g,'class','control');set(g,'role','button');set(g,'tabindex','0');set(g,'aria-label',label);return g;}
function bind(g,fn){g.addEventListener('click',()=>fn());g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function lit(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
// The drums: blank, A–Z, 0–9 and punctuation for the characters; blank and four colors for the first column.
const GL={' ':'',A:'M0,15L3.2,0H4.8L8,15M1.3,10.2H6.7',B:'M0,6.3H4.65A3.15,3.15 0 0 0 4.65,0H0V15H3.65A4.35,4.35 0 0 0 3.65,6.3',C:'M7.9,3.2A4,4 0 0 0 0,4V11A4,4 0 0 0 7.9,11.8',D:'M0,0H3.6A4.4,4.4 0 0 1 8,4.4V10.6A4.4,4.4 0 0 1 3.6,15H0Z',E:'M8,0H0V15H8M0,6.3H6.6',F:'M8,0H0V15M0,6.3H6.6',G:'M7.9,3.2A4,4 0 0 0 0,4V11A4,4 0 0 0 8,11V9H4.6',H:'M0,0V15M8,0V15M0,6.3H8',I:'M4,0V15M1.6,0H6.4M1.6,15H6.4',J:'M8,0V11A4,4 0 0 1 0,11V9.8',K:'M0,0V15M7.8,0L.8,8.6M3.3,6.1L8,15',L:'M0,0V15H7.6',M:'M0,15V0L4,9.6L8,0V15',N:'M0,15V0L8,15V0',O:'M0,4A4,4 0 0 1 8,4V11A4,4 0 0 1 0,11Z',P:'M0,15V0H4.85A3.15,3.15 0 0 1 4.85,6.3H0',Q:'M0,4A4,4 0 0 1 8,4V11A4,4 0 0 1 0,11ZM5,11L8.2,15.2',R:'M0,15V0H4.85A3.15,3.15 0 0 1 4.85,6.3H0M4.2,6.3L8,15',S:'M7.6,2.6C6.9,.9 5.6,0 4,0C1.8,0 .2,1.5 .2,3.7C.2,6.1 2.2,6.8 4,7.4C6,8 8,8.8 8,11.2C8,13.5 6.3,15 4,15C2.1,15 .7,14 0,12.2',T:'M0,0H8M4,0V15',U:'M0,0V11A4,4 0 0 0 8,11V0',V:'M0,0L3.3,15H4.7L8,0',W:'M0,0L1.7,15L4,5.2L6.3,15L8,0',X:'M0,0L8,15M8,0L0,15',Y:'M0,0L4,7.8L8,0M4,7.8V15',Z:'M.4,0H8L0,15H8',
0:'M4,0A4,7.5 0 0 1 4,15A4,7.5 0 0 1 4,0Z',1:'M1.2,3L4.8,0V15',2:'M.3,3.6C.6,1.4 2.1,0 4,0C6.2,0 7.8,1.5 7.8,3.8C7.8,5.6 6.9,6.8 5.4,8.2L0,15H8',3:'M.4,0H7.6L3.4,6H4C6.4,6 8,7.8 8,10.4C8,13.1 6.3,15 3.9,15C2.2,15 .8,14.1 0,12.6',4:'M6,15V0L0,10.5H8',5:'M7.4,0H1.2L.6,7C1.6,6.2 2.8,5.8 4.1,5.8C6.4,5.8 8,7.6 8,10.3C8,13.1 6.2,15 3.9,15C2.2,15 .8,14.1 0,12.6',6:'M7.2,1C6.4,.3 5.3,0 4.2,0C1.6,0 0,2.4 0,6.8V10.9C0,13.3 1.7,15 4,15C6.3,15 8,13.3 8,10.9C8,8.5 6.3,6.8 4,6.8C1.9,6.8 .4,8 0,9.6',7:'M0,0H8L2.6,15',8:'M4,6.6C2,6.6 .6,5.3 .6,3.3C.6,1.3 2,0 4,0C6,0 7.4,1.3 7.4,3.3C7.4,5.3 6,6.6 4,6.6C1.7,6.6 0,8.3 0,10.8C0,13.3 1.7,15 4,15C6.3,15 8,13.3 8,10.8C8,8.3 6.3,6.6 4,6.6Z',9:'M.8,14C1.6,14.7 2.7,15 3.8,15C6.4,15 8,12.6 8,8.2V4.1C8,1.7 6.3,0 4,0C1.7,0 0,1.7 0,4.1C0,6.5 1.7,8.2 4,8.2C6.1,8.2 7.6,7 8,5.4',
'.':'M3.2,14.1H4.8',':':'M4,3.6V5.4M4,10.4V12.2','-':'M1.6,6.3H6.4','/':'M7,0L1,15','%':'M2,.8A1.5,1.9 0 1 0 2,4.6A1.5,1.9 0 1 0 2,.8M6,10.4A1.5,1.9 0 1 0 6,14.2A1.5,1.9 0 1 0 6,10.4M7.6,0L.4,15',"'":'M4,0V3.8'};
const DRUM=[...' ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.:-/%\''],COLS=['','cg','ca','cr','cb'];
// The messages: label row, value row, the color column; the local time is live.
const MSG=[['STATUS','ALL CLEAR','cg'],['LOCAL TIME','','',1],['UPTIME','99.98%','cb'],['DEPLOY','ON TIME','cg'],["WHAT'S NEW",'DARK MODE','ca']];
const NC=11,PITCH=14.4,MW=12.8,HH=10.4,X0=21,YH=37,ZH=[55,29];
// Floor: the shadow, laid on the floor plane under the footprint, and the two rubber feet.
const flr=group(TOP(0,0,0));el('ellipse',{cx:92,cy:22,rx:112,ry:38,class:'shadow stage-floor'},flr);el('ellipse',{cx:92,cy:22,rx:112,ry:38,class:'stage-contact'},flr);
for(const x of[12,150])box(x,4,0,22,33,6,2,'rubber');
// Housing: enamel box; top vents; side vents, rating plate, screws and the drive knob.
box(0,0,6,184,40,78,5,'en');
const lid=group(TOP(0,0,84));rect(lid,3,3,178,34,3,'detail');slits(lid,12,11,68,14,18);
const sd=group(SIDE(184,40,84));rect(sd,3,3,34,72,3,'detail');slits(sd,8,9,24,16,7,false);
rect(sd,7,56,26,11.5,1.2,'face top');text(sd,9.4,61,'PERRON F–11','etch micro');text(sd,9.4,64.8,'24 V · 20 W','etch micro');
for(const[u,v]of[[6.5,5.5],[33.5,5.5],[6.5,72.5],[33.5,72.5]])screw(sd,u,v);
const kn=cylinder(184,20,46,7.4,3.4,'x','metal'),knR=group('',kn.face);
for(let k=0;k<24;k++){const a=k*15*D;line(knR,6.1*Math.cos(a),6.1*Math.sin(a),7.3*Math.cos(a),7.3*Math.sin(a));}
circle(kn.face,0,0,3.6,'face top metal');circle(knR,0,-4.8,.8,'face recess');
// Front: maker's line and run lamp in the header, the aluminum bezel around the display field.
const fr=group(FRONT(0,40,84));text(fr,10.5,9,'PERRON','label brand');text(fr,46,8.8,'FLAP WORKS · F–11','etch micro');
const led=circle(fr,172,7,1.25,'lamp');text(fr,169,7.9,'RUN','etch micro end');
el('path',{d:'M9,12H175Q177,12 177,14V70Q177,72 175,72H9Q7,72 7,70V14Q7,12 9,12ZM9,14V70H175V14Z','fill-rule':'evenodd',class:'face metal',transform:FRONT(0,40,84)});
// Display field: recessed behind the bezel (clipped to its opening), the flap modules at rest, the rail between the rows.
el('path',{d:poly([[9,40,70],[175,40,70],[175,40,14],[9,40,14]],true)},el('clipPath',{id:'field'},defs));
const fieldG=button(el('g',{}),'Split-flap board: flip to the next message (Space)');into(el('g',{'clip-path':'url(#field)'},fieldG));
rect(group(FRONT(9,37,70)),0,0,166,56,0,'face pit');
el('path',{d:poly([[9,37,70],[9,40,70],[9,40,14],[9,37,14]],true),class:'face pitw'});el('path',{d:poly([[9,37,14],[175,37,14],[175,40,14],[9,40,14]],true),class:'face top pitw'});
function face(g,top,color){const r=rect(g,-MW/2,top?-HH:.3,MW,HH-.3,.7,top?'flap ft':'flap');if(top)rect(g,-MW/2+.7,-HH+.3,MW-1.4,.4,.2,'sheen');return{r,top,i:-1,p:color?null:el('path',{class:'gl',transform:'translate(-4 -7.5)'},el('g',{'clip-path':`url(#${top?'ht':'hb'})`},g))};}
function paint(f,i){if(f.i===i)return;f.i=i;if(f.p)set(f.p,'d',GL[DRUM[i]]);else set(f.r,'class',`flap${f.top?' ft':''}${COLS[i]?' '+COLS[i]:''}`);}
const mods=[];
for(let r=0;r<2;r++)for(let c=0;c<NC;c++){const cx=X0+c*PITCH,zh=ZH[r],g=group(FRONT(cx,YH,zh)),col=c===0;
const T=face(g,1,col),Bt=face(g,0,col);rect(g,-MW/2,.3,MW,1,0,'dim').style.opacity=.3;const sh=rect(g,-MW/2,.3,MW,HH-.3,.7,'dim');
for(const s of[-1,1])rect(g,s<0?-MW/2-.75:MW/2,-.55,.75,1.1,.2,'pin');
mods.push({r,c,cx,zh,T,Bt,sh,n:col?COLS.length:DRUM.length,cur:0,goal:0,left:0,start:0,run:0,fall:null,bnc:0,th:-1});}
box(10,37,41.2,164,1.2,1.6,.3,'rubber');
into(fieldG);el('path',{d:poly([[7.4,40,71.6],[176.6,40,71.6],[176.6,40,12.4],[7.4,40,12.4]],true),class:'focus-ring'});into(draw);
// Top controls: the auto switch with its lamp, the home button and the big next button, each engraved.
const autoG=button(el('g',{}),'Auto switch: advance on its own (A)');set(autoG,'aria-pressed','true');into(autoG);
box(110,15,84,18,13,1,1,'metal');const ap=group(TOP(110,15,85));circle(ap,9,6.5,2.3,'face recess');circle(ap,9,6.5,1.2,'face side metal');const lampA=circle(ap,15,10.2,1.15,'lamp');
const lever=[el('path',{class:'arm-u'},autoG),el('path',{class:'arm'},autoG)],lTip=el('circle',{r:1.7,class:'face top metal'},autoG);rect(ap,-1.6,-1.6,21.2,16.2,2.4,'focus-ring');into(draw);
const homeG=button(el('g',{}),'Home button: run every drum home and back (H)');into(homeG);
cylinder(140,22,84,4.4,1,'z','metal');const homeCap=el('g',{},homeG);into(homeCap);const hc=cylinder(140,22,85,3.1,1.8,'z','rubber');circle(hc.face,0,0,1.4,'detail');
into(homeG);circle(group(TOP(140,22,85)),0,0,6.4,'focus-ring');into(draw);
const nextG=button(el('g',{}),'Next button: flip to the next message (Space)');into(nextG);
cylinder(161,22,84,8,1.2,'z','metal');const nextCap=el('g',{},nextG);into(nextCap);const nc=cylinder(161,22,85.2,6.2,2.6,'z','en');
circle(nc.face,0,0,4.8,'detail');el('path',{d:'M-2.9,-2.4L.2,0L-2.9,2.4ZM.3,-2.4L3.4,0L.3,2.4Z',class:'face recess'},nc.face);
into(nextG);circle(group(TOP(161,22,85.2)),0,0,10.2,'focus-ring');into(draw);
for(const[s,u]of[['AUTO',119],['HOME',140],['NEXT',161]])text(lid,u,35,s,'etch micro center');
// Falling flaps, over everything: each module's face (old top half) and back (new bottom half), lower row first.
const flapsG=el('g',{class:'flaps'});
for(const m of[...mods.filter(m=>m.r===1),...mods.filter(m=>m.r===0)]){const fl=el('g',{},flapsG),col=m.c===0;
m.ff=el('g',{visibility:'hidden'},fl);m.F=face(m.ff,1,col);m.fd=rect(m.ff,-MW/2,-HH,MW,HH-.3,.7,'dim');
m.fb=el('g',{visibility:'hidden'},fl);m.B=face(m.fb,0,col);m.bl=rect(m.fb,-MW/2,.3,MW,HH-.3,.7,'lift');}
frame([[0,0,0,187.4,40,84],[9,40,14,166,8,56],[108,12,84,62,22,8]],12);
// State: the message shown, the drums turning toward it, auto advance, homing, the live clock; audio only after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),hk={};
const FAST=32,HOMEF=28,MID=78,LAST=136,BOUNCE=180,CASCADE=26,ROWLAG=64,AUTO=7000,SPIN=[66,48];
let idx=0,auto=true,phase='',homeHold=0,moving=false,autoAt=performance.now()+3600,shown='',lastClock=0,lastT=0,lastUI=0,msg='',msgT=0,sayNext='',clicks=0,settles=0,knA=0,knS='',levA=28,levV=0,levS='',ac=null,nb=null;
const BTN=[{cap:nextCap,o:0,s:''},{cap:homeCap,o:0,s:''}];
const say=m=>{announcement.textContent=m;};
function note(m){msg=m;msgT=performance.now()+1600;lastUI=0;}
function clockText(){const d=new Date(),h=d.getHours();return`${h%12||12}:${String(d.getMinutes()).padStart(2,'0')} ${h<12?'AM':'PM'}`;}
function valueOf(i){return MSG[i][3]?clockText():MSG[i][1];}
const spoken=i=>`${MSG[i][0][0]}${MSG[i][0].slice(1).toLowerCase()}: ${MSG[i][3]?valueOf(i):valueOf(i).toLowerCase()}.`;
function rows(i,value){const ci=COLS.indexOf(MSG[i][2]);return[MSG[i][0],value].map(s=>[ci,...[...s.padEnd(NC-1,' ')].slice(0,NC-1).map(ch=>Math.max(0,DRUM.indexOf(ch)))]);}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();nb=ac.createBuffer(1,ac.sampleRate/8|0,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function noise(f,v,d,q=1.6){if(!ac)return;try{const t=ac.currentTime,s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;b.Q.value=q;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(ac.destination);s.start(t,Math.random()*.08,d+.02);}catch(_){}}
function tone(f,d,v,type='triangle'){if(!ac)return;try{const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.02);}catch(_){}}
// A module's drum: aim it, release its top flap, land it. A run spins up over its first flaps, the last two fall slower, and the last bounces.
function aim(m,to,start){const base=m.fall?(m.cur+1)%m.n:m.cur;m.goal=to;m.left=(to-base+m.n)%m.n+(m.fall?1:0);if(!m.fall){m.start=start;m.run=0;}}
function begin(m,t0){const to=(m.cur+1)%m.n,k=m.run++;paint(m.T,to);paint(m.F,m.cur);paint(m.B,to);m.bnc=0;m.fall={t0,dur:m.left===1?LAST:m.left===2?MID:k<SPIN.length?SPIN[k]:phase==='home'?HOMEF:FAST};}
function land(m){const t=m.fall.t0+m.fall.dur;m.cur=(m.cur+1)%m.n;m.left--;paint(m.Bt,m.cur);m.fall=null;clicks++;if(m.left>0)begin(m,t);else{m.bnc=t;settles++;}}
function pose(m,th){if(th===m.th)return;m.th=th;
if(th<=0){set(m.ff,'visibility','hidden');set(m.fb,'visibility','hidden');m.sh.style.opacity=0;return;}
const s=Math.sin(th*D),c=Math.cos(th*D),front=th<45,o=[m.cx,YH,m.zh];set(m.ff,'visibility',front?'visible':'hidden');set(m.fb,'visibility',front?'hidden':'visible');
if(front){set(m.ff,'transform',plane(o,[1,0,0],[0,-s,-c]));m.fd.style.opacity=f2(.7*s);}else{set(m.fb,'transform',plane(o,[1,0,0],[0,s,c]));m.bl.style.opacity=f2(.18*s);}
m.sh.style.opacity=f2(.42*s);}
function snap(m){m.cur=m.goal;m.left=0;m.fall=null;m.bnc=0;paint(m.T,m.cur);paint(m.Bt,m.cur);pose(m,0);}
function show(i,t0){const v=valueOf(i),R=rows(i,v);shown=MSG[i][3]?v:'';mods.forEach(m=>aim(m,R[m.r][m.c],t0+m.c*CASCADE+m.r*ROWLAG));moving=true;}
rows(0,MSG[0][1]).forEach((row,r)=>row.forEach((to,c)=>{const m=mods[r*NC+c];m.goal=to;snap(m);}));
// Actions: next and back, auto, home.
function go(d,quiet){const now=performance.now();if(!quiet){audio();BTN[0].o=d>0?1:0;tone(110,.09,.05);}idx=(idx+d+MSG.length)%MSG.length;phase='';homeHold=0;autoAt=Infinity;show(idx,now);sayNext=quiet?'':spoken(idx);lastUI=0;}
function toggleAuto(){audio();auto=!auto;set(autoG,'aria-pressed',auto);set(hk.a,'aria-pressed',auto);autoAt=performance.now()+AUTO;tone(auto?1500:900,.03,.02,'square');tone(160,.05,.04);note(auto?'AUTO ON':'AUTO OFF');say(auto?'Auto on: the board moves to the next message on its own.':'Auto off: the board holds this message.');}
function home(){audio();BTN[1].o=1;tone(140,.08,.05);const now=performance.now();phase='home';homeHold=0;autoAt=Infinity;moving=true;
mods.forEach(m=>{aim(m,0,now+m.c*CASCADE*.6+m.r*ROWLAG*.5);if(!m.left&&!m.fall)m.left=m.n;});sayNext='';say('Homing: every drum runs round to blank, then spells the message again.');lastUI=0;}
const act={' ':()=>go(1),arrowright:()=>go(1),arrowleft:()=>go(-1),a:toggleAuto,h:home};
document.querySelectorAll('.hint [data-k]').forEach(b=>{hk[b.dataset.k]=b;b.addEventListener('click',()=>act[b.dataset.k]());});set(hk.a,'aria-pressed',true);
bind(fieldG,()=>go(1));bind(nextG,()=>go(1));bind(autoG,toggleAuto);bind(homeG,home);
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const f=act[e.key.toLowerCase()];if(f){e.preventDefault();if(!e.repeat)f();}});
function tick(now){
const dt=Math.min(.05,(now-(lastT||now))/1000),red=reduced.matches;lastT=now;let mv=false;
for(const m of mods){
if(red){if(m.left||m.fall||m.bnc){if(m.left)settles++;snap(m);}continue;}
if(!m.fall&&m.left>0&&now>=m.start)begin(m,m.start);
while(m.fall&&now>=m.fall.t0+m.fall.dur)land(m);
if(m.fall){const q=(now-m.fall.t0)/m.fall.dur;pose(m,180*q*q);}
else if(m.bnc){const b=(now-m.bnc)/BOUNCE;if(b>=1){m.bnc=0;pose(m,0);}else pose(m,180-15*Math.abs(Math.sin(2*Math.PI*b))*(1-b)**1.5);}
if(m.left>0||m.fall||m.bnc)mv=true;}
if(ac&&clicks)noise(2400+Math.random()*1600,Math.min(.05,.012+clicks*.005),.022);if(ac&&settles)noise(1100,.035,.04,1.1);clicks=settles=0;
if(phase==='home'&&!mv){if(!homeHold)homeHold=now+(red?420:260);else if(now>=homeHold){phase='';homeHold=0;show(idx,now);sayNext=spoken(idx);}}
if(moving&&phase!=='home'&&!mods.some(m=>m.left>0||m.fall||m.bnc)){moving=false;autoAt=now+AUTO;if(sayNext){say(sayNext);sayNext='';}lastUI=0;}
if(auto&&!moving&&phase!=='home'&&now>=autoAt)go(1,true);
if(MSG[idx][3]&&!moving&&phase!=='home'&&now-lastClock>500){lastClock=now;const v=clockText();if(v!==shown){const R=rows(idx,v);shown=v;mods.forEach(m=>{if(m.r===1)aim(m,R[1][m.c],now+m.c*CASCADE);});moving=true;}}
// Controls: the auto lever on a spring, the buttons' travel, the drive knob, the run lamp.
const la=auto?28:-28;if(red){levA=la;levV=0;}else{levV+=(320*(la-levA)-26*levV)*dt;levA+=levV*dt;}
const tip=[119,21.5+6.4*Math.sin(levA*D),85.4+6.4*Math.cos(levA*D)],ld=poly([[119,21.5,85.4],tip]);if(ld!==levS){levS=ld;lever.forEach(n=>set(n,'d',ld));const tp=P(...tip);set(lTip,'cx',f2(tp[0]));set(lTip,'cy',f2(tp[1]));}
lit(lampA,auto?'g':'');
for(const b of BTN){if(b.o>0)b.o=Math.max(0,b.o-dt*6);const k=`translate(0 ${f2(red?0:Math.sin(Math.min(1,b.o)*Math.PI/2)*1.2)})`;if(k!==b.s){b.s=k;set(b.cap,'transform',k);}}
if(mv&&!red)knA=(knA+dt*420)%360;const kr=`rotate(${f2(knA)})`;if(kr!==knS){knS=kr;set(knR,'transform',kr);}
lit(led,phase==='home'?((now/160|0)%2?'a':''):mv||moving?'a':'g');
if(!lastUI||now-lastUI>200){lastUI=now;
const r=`${MSG[idx][0]} · ${MSG[idx][3]?shown||clockText():MSG[idx][1]}`;if(readout.textContent!==r)readout.textContent=r;
const st=phase==='home'?'HOMING':moving?'FLIPPING':now<msgT?msg:auto?`SETTLED · NEXT IN ${Math.max(1,Math.ceil((autoAt-now)/1000))} S`:'SETTLED · SPACE FOR NEXT';if(stateLabel.textContent!==st)stateLabel.textContent=st;}
requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['a', 'h'], draw }
