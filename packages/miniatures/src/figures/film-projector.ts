// @ts-nocheck
/* NALVEN P–35 · Film projector. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--base-top:#cbcbc7;--base-side:#a4a4a1;--chrome:#d9dad8;--chrome-top:#f6f6f5;--chrome-side:#bdbebc;--rubber:#2e2e2d;--rubber-top:#3d3d3c;--rubber-side:#242423;--brass:#cfa95d;--brass-top:#e8c985;--brass-side:#ab8743;--film:#2b2724;--perf:#d9d2c2;--pack:#3a332c;--screen:#ecebe4;--mask:#2a2a29;--beam:#fff0c8;--ba:.5;--lamp:#ffb347;--hot:#fff4d8;--port:#4a3418}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--base-top:#bebeba;--base-side:#737372;--chrome:#b7b7b6;--chrome-top:#e6e6e5;--chrome-side:#858585;--rubber:#252524;--rubber-top:#383837;--rubber-side:#161616;--brass:#ae8e4d;--brass-top:#d9bc7c;--brass-side:#785e2d;--film:#221f1d;--perf:#b7b1a3;--pack:#2e2a25;--screen:#c7c6c2;--mask:#222221;--beam:#ffe8b0;--ba:.62;--lamp:#ffa933;--hot:#fff0cc;--port:#3d2a12;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.top.base{fill:var(--base-top)}.side.base{fill:var(--base-side)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}.side.rubber{fill:var(--rubber-side)}.brass{fill:var(--brass)}.top.brass{fill:var(--brass-top)}.side.brass{fill:var(--brass-side)}
.fu{fill:none;stroke:var(--line);stroke-width:6;stroke-linecap:round;stroke-linejoin:round}.fm{fill:none;stroke:var(--film);stroke-width:4.8;stroke-linecap:round;stroke-linejoin:round}.pf{fill:none;stroke:var(--perf);stroke-width:1;stroke-dasharray:1.1 2.9;opacity:.6}.pack{fill:var(--pack);stroke:var(--line);stroke-width:.7;vector-effect:non-scaling-stroke}.pk{fill:none;stroke:var(--line);stroke-width:.5;opacity:.4;vector-effect:non-scaling-stroke}
.ru{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.rd{fill:none;stroke:var(--chrome-top);stroke-linecap:round;stroke-linejoin:round}.belt{fill:none;stroke:var(--rubber);stroke-width:1.6;stroke-dasharray:5 1.2;stroke-linejoin:round}.bu{fill:none;stroke:var(--line);stroke-width:2.6;stroke-linejoin:round}.cu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.cb{fill:none;stroke:var(--rubber);stroke-linecap:round;stroke-linejoin:round}
.screen{fill:var(--screen)}.mask{fill:var(--mask)}.beam{pointer-events:none}.bf{fill:url(#bg)}.bb{fill:var(--beam);opacity:.16;filter:url(#bloom)}.mote{fill:var(--hot)}.gl{fill:var(--hot);filter:url(#glow)}.amb{fill:var(--lamp);filter:url(#glow)}.halo{fill:var(--lamp);filter:url(#bloom);pointer-events:none}.hhalo{fill:var(--beam);filter:url(#bloom);pointer-events:none}.port{fill:var(--port)}
.led{fill:var(--off)}.led.g{fill:var(--ok);filter:url(#glow)}.led.a{fill:var(--warn);filter:url(#glow)}.seg{fill:var(--accent);font:700 5px ui-monospace,monospace;letter-spacing:.8px;text-anchor:middle;stroke:none}
.cd-bg{fill:#d9d2c1}.cd-sw{fill:#a79c86}.cd-l{fill:none;stroke:#2f281f;stroke-width:1.4}.cd-n{fill:#211b13;font:700 40px Georgia,'Times New Roman',serif;text-anchor:middle}.s0{fill:#e9dcbf}.s1{fill:#fff4dc}.s2{fill:#c4b292}.s3{fill:#9a8564}.s4{fill:#5a4a35}.s5{fill:#2a2219}.s6{fill:#b19f7d}.sm{fill:#f7efdf}.rl{fill:none;stroke:#efe4cb;stroke-width:.6;opacity:.7}.en{fill:#1d1813}.ent{fill:#efe4cb;font:italic 15px Georgia,'Times New Roman',serif;letter-spacing:2px;text-anchor:middle}.gr{fill:#1b160f}.scr{stroke:#f6efdf;stroke-width:.5;opacity:.6}.vig{fill:url(#vg);pointer-events:none}.cue{fill:none;stroke:#f2ead8;stroke-width:1.2}.haze{fill:none;stroke:var(--line);stroke-width:.9;stroke-linecap:round;opacity:0;pointer-events:none}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}.control:hover .top.chrome{fill:var(--top)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<filter id="fb" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur id="fbs" stdDeviation="0"/></filter>
<linearGradient id="bg" gradientUnits="userSpaceOnUse"><stop offset="0" style="stop-color:var(--beam);stop-opacity:var(--ba)"/><stop offset="1" style="stop-color:var(--beam);stop-opacity:.05"/></linearGradient>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cdbb97"/><stop offset=".7" stop-color="#efe5cc"/></linearGradient>
<radialGradient id="vg" cx=".5" cy=".5" r=".72"><stop offset=".55" stop-color="#1b150d" stop-opacity="0"/><stop offset="1" stop-color="#1b150d" stop-opacity=".42"/></radialGradient>
<clipPath id="rc"><circle r="60"/></clipPath><clipPath id="ic"><rect x="11" y="8" width="128" height="92"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* NALVEN P–35 cinema projector. World: x lower-right; y lower-left (operator side faces +y); z up. Optical axis y 123, z 160, firing toward −x.
Part · x y z · w d h
screen frame + silver screen (picture 154 × 110, drawn at 1.2) · -46 33 95.2 · 6 180 129.6
screen tripod (post + 3 legs) · -43 123 0 · r34 – 96
film can (floor) · 214 176 0 · r22 – 5.5
pedestal base · step · column · 298 28 0 · 156 108 14 / r18 – 70
motor + pulley (column front) · 376 100–133 56 · r12.5 33 –
tilt block + crank · deck plate · 340 50 84 · 72 64 8 / 250 36 92 · 240 94 6
projector head · 262 44 98 · 118 74 130
gate block · pressure door · 268 116 128 · 24 15 64
sprockets (feed 218, hold-back 110) · 306 118 · r10 8 –
sound drum · exciter lamp · 336 118 130 · r11 9 – / 350 118 134 · 14 8 12
snubber · idler rollers · 358/372 118 116/152 · r4.5 8 –
framing knob · drive pulley · 318/322 118 170/104 · r6.5/5 7/15 –
lens (collar, barrel, focus ring, telescoping front) · 176–268 123 160 · r13–17 – –
lamphouse · chimney · 380 48 98 · 90 66 146 / 456 68 244 · r14.5 – 31
control box (motor, lamp, rewind) · 392 116 98 · 74 12 26
reel arms · drive pulleys · belts · 281–438 113 226 · 157 5 105
feed / take-up reels · 288/432 120.5 336 · r66 8 –
film runs in the plane y 126; beam from the lens front to the picture corners */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: rods, cords, arms, bevels, belts, tangents, hull.
const{cos,sin}=Math,draw=root,into=g=>root=g,f2=v=>(+v).toFixed(2),RAD=Math.PI/180,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),defs=svg.querySelector('defs');
function rod(pts,w=2.6,g=root){const d=poly(pts);el('path',{d,class:'ru','stroke-width':w+1.4},g);el('path',{d,class:'rd','stroke-width':w},g);}
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
function cord(pts,w){const d=smooth(pts);el('path',{d,class:'cu','stroke-width':w+1});el('path',{d,class:'cb','stroke-width':w});}
function bevel(g,x,y,w,h,b,m=''){rect(g,x,y,w,h,1.2,'face '+m);el('path',{d:`M${x},${y}H${x+w}L${x+w-b},${y+b}H${x+b}ZM${x},${y}L${x+b},${y+b}V${y+h-b}L${x},${y+h}Z`,class:'face top '+m},g);el('path',{d:`M${x},${y+h}L${x+b},${y+h-b}H${x+w-b}L${x+w},${y+h}ZM${x+w},${y}V${y+h}L${x+w-b},${y+h-b}V${y+b}Z`,class:'face side '+m},g);}
function slab(pts,y,t,m){for(const[k,c]of[[y-t,'face side '+m],[y,'face '+m]])el('path',{d:'M'+pts.map(([x,z])=>x+','+(-z)).join('L')+'Z',class:c},group(FRONT(0,k,0)));}
function beltD(a,ra,b,rb){const dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy),nx=-dy/l,ny=dx/l,q=(p,r,s)=>`${f2(p[0]+nx*r*s)},${f2(p[1]+ny*r*s)}`;return`M${q(a,ra,1)}L${q(b,rb,1)}A${rb},${rb} 0 1 1 ${q(b,rb,-1)}L${q(a,ra,-1)}A${ra},${ra} 0 1 1 ${q(a,ra,1)}Z`;}
function tang(c,R,q,right){const a=Math.atan2(q[1]-c[1],q[0]-c[0]),b=Math.acos(Math.min(1,R/Math.hypot(q[0]-c[0],q[1]-c[1]))),p=[a+b,a-b].map(t=>[c[0]+R*cos(t),c[1]+R*sin(t)]);return(p[0][0]>p[1][0])===right?p[0]:p[1];}
function hull(p){p=p.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const x=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),h=[];for(const s of[p,p.slice().reverse()]){const k=h.length;for(const q of s){while(h.length>=k+2&&x(h[h.length-2],h[h.length-1],q)<=0)h.pop();h.push(q);}h.pop();}return h;}
const ctl=(label,extra={})=>el('g',{class:'control',role:'button',tabindex:'0','aria-label':label,...extra},draw);
const EM='etch micro center';
// Floor shadows, the screen on its tripod, the beam layer.
for(const[x,y,rx,ry]of[[376,82,150,52],[-43,123,46,18],[214,176,26,10]]){const p=P(x,y,0);el('ellipse',{cx:f2(p[0]),cy:f2(p[1]+3),rx,ry,class:'shadow stage-floor'});el('ellipse',{cx:f2(p[0]),cy:f2(p[1]+3),rx,ry,class:'stage-contact'});}
const legs=[0,120,240].map(a=>[[-43,123,30],[-43+34*cos(a*RAD),123+34*sin(a*RAD),0]]);
rod(legs[2]);cylinder(-43,123,0,2.4,96,'z','chrome');rod(legs[0]);rod(legs[1]);for(const l of legs)ellipse(...l[1],2.6,'z','face rubber');
box(-48,114,80,9,18,8,1.5,'base');box(-46,33,95.2,6,180,129.6,3,'base');
const SC=group(SIDE(-39.95,213,224.8)+' scale(1.2)');rect(SC,4,3,142,102,2,'face mask');rect(SC,11,8,128,92,0,'screen');for(const[u,v]of[[2.6,2.6],[147.4,2.6],[2.6,105.4],[147.4,105.4]])screw(SC,u,v);text(SC,75,107.2,'NALVEN · SILVER SCREEN','etch micro center');
// Picture: a clipped stack (frame lines, neighbouring frames, weave, focus blur) inside a light layer.
const IMG=el('g',{'clip-path':'url(#ic)'},SC),ILIT=el('g',{},IMG),ISTK=el('g',{},ILIT),IBL=el('g',{},ISTK),FR=el('g',{id:'fr',transform:'translate(11 8)'},IBL);
for(const y of[-98,98])el('use',{href:'#fr',y},IBL);for(const y of[2,100])rect(IBL,11,y,128,6,0,'gr');
const CD=el('g',{},FR);rect(CD,0,0,128,92,0,'cd-bg');const SW=el('path',{class:'cd-sw'},CD);circle(CD,64,46,33,'cd-l');circle(CD,64,46,27,'cd-l');line(CD,0,46,128,46,'cd-l');line(CD,64,0,64,92,'cd-l');const NUM=text(CD,64,60,'5','cd-n');
const SN=el('g',{},FR);el('rect',{width:128,height:92,fill:'url(#sky)'},SN);el('circle',{cx:96,cy:26,r:16,class:'s1',opacity:.35},SN);circle(SN,96,26,9.5,'s1');
const CLD=[0,1].map(i=>el('path',{d:'M0,0c4,-5 12,-5 15,0c4,-1 7,2 6,4h-24c-2,-2 0,-4 3,-4z',class:'s1',opacity:.75},SN));
el('path',{d:'M0,56C14,46 26,50 40,43C54,36 70,46 84,41C98,36 112,42 128,37V92H0Z',class:'s2'},SN);el('path',{d:'M0,64C16,57 36,61 54,55C72,49 92,59 110,55C118,53 124,54 128,53V92H0Z',class:'s3'},SN);
rect(SN,0,71,128,21,0,'s6');const RL=[0,1,2,3].map(()=>line(SN,0,0,0,0,'rl'));
let vd='M0,55H128V71.5H0Z';for(let i=0;i<8;i++){const x=i*17-3;vd+=`M${x},71.5V66A6.5,6.5 0 0 1 ${x+13},66V71.5Z`;}el('path',{d:vd,class:'s4','fill-rule':'evenodd'},SN);
const TRN=el('g',{},SN);for(const[x,y,w,h]of[[-12,-6.6,12,4.8],[-17,-9.8,6,8.4],[-6,-10,2.2,3.6],[-36,-8.4,17,7],[-55,-8.4,17,7],[-1,-3.2,2,1.6]])rect(TRN,x,y,w,h,.6,'s5');for(const x of[-15,-9,-4,-33,-22,-52,-41])circle(TRN,x,-1.2,1.4,'s5');
const PUF=[0,1,2,3,4,5].map(()=>circle(SN,0,0,1,'sm'));
const EN=el('g',{},FR);rect(EN,0,0,128,92,0,'en');const ENT=el('g',{},EN);text(ENT,64,51,'THE END','ent');line(ENT,46,58,82,58,'scr');
const GRN=[0,1,2,3,4,5,6].map(()=>circle(ISTK,0,0,.5,'gr')),SCR=line(ISTK,0,8,0,100,'scr'),CUE=circle(ISTK,128,17,3,'cue');
rect(ILIT,11,8,128,92,0,'vig');const SGL=el('ellipse',{cx:75,cy:54,rx:72,ry:54,class:'hhalo'},SC);
const BEAM=el('g',{class:'beam'}),BB=el('path',{class:'bb'},BEAM),BF=el('path',{class:'bf'},BEAM),MOTE=Array.from({length:18},(_,i)=>({n:circle(BEAM,0,0,.5+(i%3)*.3,'mote'),t:(i*.618)%1,y:((i*37)%21)/10.5-1,z:((i*53)%21)/10.5-1,v:.012+(i%5)*.006,ph:i}));
// Floor props: a film can and the mains cord; then the cast pedestal with the motor on its column.
{const k=cylinder(214,176,0,22,5.5,'z','base').face;circle(k,0,0,18,'detail');circle(k,0,0,3,'face recess');text(k,0,-8,'NALVEN · 35 MM','etch center');text(k,0,12,'REEL 2 · 600 M','etch micro center');}
cord([[452,96,4],[466,100,1.4],[492,110,1.4],[516,126,1.4],[530,150,1.4]],2);
for(const[x,y]of[[306,36],[446,36],[306,128],[446,128]])cylinder(x,y,0,4.6,2,'z','rubber');box(298,28,1.5,156,108,6.5,3,'base');box(314,42,8,124,80,6,3,'base');text(group(FRONT(298,136.05,8)),78,4.6,'NALVEN · MOTION WORKS',EM);cylinder(376,82,14,18,70,'z','base');
{const m=cylinder(376,100,56,12.5,24,'y','base').face;circle(m,0,0,9.6,'detail');for(let i=0;i<12;i++){const a=i*30*RAD;line(m,f2(4*cos(a)),f2(4*sin(a)),f2(9*cos(a)),f2(9*sin(a)));}}
const MP=cylinder(376,124,56,4.6,9,'y','chrome').face;
box(340,50,84,72,64,8,2,'base');cylinder(412,82,88,6,3,'x','chrome');box(250,36,92,240,94,6,2,'base');
// Projector head: casting, counter, labels, sprockets, sound drum, exciter lamp, rollers, framing knob, drive pulley, gate.
box(262,44,98,118,74,130,4);
const HF=group(FRONT(262,118.05,228));rect(HF,3,3,112,124,3,'detail');for(const[u,v]of[[6,6],[112,6],[6,124],[112,124]])screw(HF,u,v);
rect(HF,78,10,32,13,2,'face recess');rect(HF,80,12,28,9,1.5,'face glass');const CNT=text(HF,94,18.6,'0000','seg');text(HF,94,28,'FRAMES',EM);
text(HF,56,72,'FRAMING',EM);text(HF,74,119,'SOUND',EM);for(const[u,v]of[[40,8],[104,42]])circle(HF,u,v,1.8,'face brass');
box(268,116,128,24,8,64,2,'base');
const ROT=[];function wheel(x,z,r,h,m,teeth){const c=cylinder(x,118,z,r,h,'y',m),g=group('',c.face);if(teeth){for(let i=0;i<12;i++)rect(group(`rotate(${i*30})`,g),r-1.4,-.8,2.2,1.6,.4,'face recess');for(let i=0;i<4;i++)circle(g,f2(r*.45*cos(i*Math.PI/2)),f2(r*.45*sin(i*Math.PI/2)),r*.16,'face recess');}else{line(g,-r*.7,0,r*.7,0);line(g,0,-r*.7,0,r*.7);}circle(g,0,0,r*.22,'face top '+m);ROT.push({g,r});return g;}
wheel(306,218,10,8,'chrome',1);wheel(306,110,10,8,'chrome',1);wheel(336,130,11,9,'chrome');wheel(358,116,4.5,8,'chrome');wheel(372,152,4.5,8,'chrome');
box(350,118,134,14,8,12,1.5,'base');const EXC=circle(group(FRONT(350,126.05,146)),3.4,6,1.8,'amb');
const HP=wheel(322,104,5,15,'chrome');
const FKN=ctl('Framing knob: re-centre the frame (Up and Down arrows)');into(FKN);const fk=cylinder(318,118,170,6.5,7,'y','rubber').face;into(draw);const FKR=group('',fk);for(let i=0;i<16;i++)line(group(`rotate(${i*22.5})`,FKR),5.2,0,6.3,0);line(FKR,0,-1.4,0,-5,'detail');circle(fk,0,0,9,'focus-ring');circle(fk,0,0,10,'hit');
// Film: three runs (feed reel to the sprocket, the threaded path, idler to the take-up reel) share one moving perforation phase.
const FP=group(FRONT(0,126,0)),FPD='M316,-218A10,10 0 0 1 306,-208C292,-208 264,-214 264,-200C264,-190 280,-196 280,-188V-132C280,-122 261,-126 261,-115C261,-103 296,-122 296,-110A10,10 0 0 0 316,-110C316,-126 324,-141 336,-141A11,11 0 0 1 347,-130C347,-118 351,-111.5 358,-111.5A4.5,4.5 0 0 0 362.5,-116C362.5,-134 367.5,-138 367.5,-152';
const FST=['fu','fm','pf'].map(c=>el('path',{d:FPD,class:c},FP)),FLEN=FST[0].getTotalLength();
box(270,126.6,136,20,4.4,48,1.6,'chrome');cylinder(280,131,176,2.2,2.4,'y','chrome');const GGL=el('ellipse',{rx:7,ry:20,class:'hhalo'});{const p=P(280,131,160);set(GGL,'cx',f2(p[0]));set(GGL,'cy',f2(p[1]));}
// Lens: telescoping front barrel (focus), knurled focus ring, barrel and mount collar; the front glows when the lamp is on.
const FOC=ctl('Lens: toggle sharp and soft focus (Left and Right arrows)'),FL=el('g',{},FOC);into(FL);cylinder(176,123,160,14.4,4,'x','rubber');cylinder(180,123,160,13,52,'x','chrome');const LGL=el('ellipse',{rx:10,ry:17,class:'hhalo'});{const p=P(176,123,160);set(LGL,'cx',f2(p[0]));set(LGL,'cy',f2(p[1]));}
into(FOC);cylinder(222,123,160,14.6,10,'x','chrome');const fr=cylinder(232,123,160,16.2,12,'x','rubber').face;cylinder(244,123,160,14.6,14,'x','chrome');cylinder(256,123,160,17,12,'x','base');into(draw);const FRR=group('',fr);for(let i=0;i<36;i++)line(group(`rotate(${i*10})`,FRR),14.9,0,16,0);circle(fr,0,0,20,'focus-ring');text(group(SIDE(268.1,140,172)),8.5,-2,'f/1.9 · 85 MM','etch micro center');
// Lamphouse: door with louvres, viewing port, handle and plate; side vents and a cooling fan; chimney.
box(380,48,98,90,66,146,4,'base');
const LF=group(FRONT(380,114.05,244));bevel(LF,6,8,78,92,2,'base');slits(LF,14,14,62,24,6,false);circle(LF,28,62,9.5,'face chrome');circle(LF,28,62,7,'port');const PGL=circle(LF,28,62,7,'amb');el('path',{d:'M23,58A6,6 0 0 1 29,56',class:'detail',stroke:'#fff'},LF);
rect(LF,70,48,5,24,2.5,'face chrome');for(const v of[22,72])rect(LF,3.5,v,4,12,1.5,'face chrome');rect(LF,24,104,42,10,1.5,'face brass');text(LF,45,111,'NALVEN','label brand center');
const LS=group(SIDE(470.05,114,244));slits(LS,8,18,50,42,8);const VGL=[...LS.querySelectorAll('rect')].map(r=>{const n=r.cloneNode();set(n,'class','amb');LS.appendChild(n);return n;});
circle(LS,33,98,15,'face recess');const FAN=group('translate(33 98)',LS);for(let i=0;i<5;i++)el('path',{d:'M0,0Q-3,-12 7,-13Q13,-4 2,1Z',transform:`rotate(${i*72})`,class:'face base'},FAN);for(const r of[13.5,9,4.5])circle(LS,33,98,r,'detail');line(LS,18,98,48,98);line(LS,33,83,33,113);for(const[u,v]of[[4,4],[62,4],[4,142],[62,142]])screw(LS,u,v);
cylinder(456,68,244,9,24,'z','base');cylinder(456,68,268,12,3,'z','base');cylinder(456,68,273,14.5,2.4,'z','base');const HZ=[0,1,2].map(()=>el('path',{class:'haze'}));
// Control box: motor and lamp rockers with pilot lamps, the rewind lever; main belt from the motor to the head.
box(392,116,98,74,12,26,2,'base');const CB=group(FRONT(392,128.05,124)),CT=group(TOP(392,116,124.05));
const LM=circle(CB,13,3.8,1.2,'led'),LL=circle(CB,33,3.8,1.2,'led');for(const[u,t]of[[13,'MOTOR'],[33,'LAMP'],[56,'REWIND']])text(CT,u,8.4,t,EM);
function rocker(u,label){const g=ctl(label,{'aria-pressed':'false'}),p=group(FRONT(392,128.05,124),g);rect(p,u-7,7,14,15,2,'face recess');const r=rect(p,u-5,9,10,6,1.5,'face top chrome');rect(p,u-9,5,18,19,3,'focus-ring');rect(p,u-10,1,20,25,3,'hit');return{g,r};}
const RUN=rocker(13,'Motor switch: run or stop the transport (Space)'),LMP=rocker(33,'Lamp switch (L)');
const REW=ctl('Rewind lever (R)',{'aria-pressed':'false'}),rwU=el('path',{class:'ru','stroke-width':3},REW),rwC=el('path',{class:'rd','stroke-width':1.8},REW),rwK=el('circle',{r:2.4,class:'face top chrome'},REW);{const p=group(FRONT(392,128.05,124),REW);rect(p,47,4,18,20,3,'focus-ring');rect(p,47,4,18,20,3,'hit');}
const MB=group(FRONT(0,131.5,0)),MBD=beltD([376,-56],4.6,[322,-104],5);el('path',{d:MBD,class:'bu'},MB);const MBT=el('path',{d:MBD,class:'belt'},MB);
// Reel arms with drive pulleys and belts, then the two reels (back flange, film pack, film run, spoked front flange, spindle).
slab([[281,226],[299,226],[294,330],[282,330]],118,5,'base');slab([[359,226],[377,226],[438,331],[426,331]],118,5,'base');
for(const x of[288,432])cylinder(x,113,336,11,5,'y','base');for(const x of[290,369])cylinder(x,113,234,4.4,7,'y','chrome');
const AB=group(FRONT(0,119.5,0)),BLT=[[[290,-234],[288,-336]],[[369,-234],[432,-336]]].map(([a,b])=>{const d=beltD(a,4.4,b,7);el('path',{d,class:'bu'},AB);return el('path',{d,class:'belt'},AB);});
function reel(cx){const g=el('g',{}),run=group(FRONT(0,126,0),g);into(g);cylinder(cx,120.5,336,66,8,'y','base');const pk=group(FRONT(cx,128.4,336),g),pack=circle(pk,0,0,40,'pack'),rings=[0,1].map(()=>circle(pk,0,0,20,'pk')),inr=group(`translate(${-cx} 336)`,el('g',{'clip-path':'url(#rc)'},pk));
const seg=['fu','fm','pf'].flatMap(c=>[el('path',{class:c},run),el('path',{class:c},inr)]),rot=group('',group(FRONT(cx,128.6,336),g));
el('path',{d:'M66,0A66,66 0 1 1 -66,0A66,66 0 1 1 66,0ZM60,0A60,60 0 1 0 -60,0A60,60 0 1 0 60,0Z',class:'face chrome','fill-rule':'evenodd'},rot);for(let i=0;i<5;i++){const s=group(`rotate(${i*72})`,rot);rect(s,9,-3.2,52,6.4,3,'face chrome');circle(s,63,0,.9,'detail');}
circle(rot,0,0,13,'face chrome');circle(rot,0,0,9,'detail');line(rot,-4,0,4,0);cylinder(cx,128.6,336,3.4,4.4,'y','chrome');into(draw);return{rot,pack,rings,seg,a:0};}
const RF=reel(288),RT=reel(432);
frame([[-48,30,0,10,186,225],[-77,89,0,68,68,0],[250,28,0,240,108,276],[222,120,270,276,9,132],[530,150,0,0,0,0],[192,154,0,44,44,6]],8);
// State: transport with inertia (24 fps forward, 8× rewind), lamp heat, focus and framing springs, the reel programme, the encore loop.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),FBS=document.getElementById('fbs'),BGR=document.getElementById('bg');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),HK={};
document.querySelectorAll('.hint [data-k]').forEach(b=>HK[b.dataset.k]=b);
const TOTAL=1440,PITCH=3,RM=56,R0=13;
let run=true,rev=false,lamp=true,rate=24,s=0,heat=1,fstep=0,fo=0,foV=0,frs=0,fy=0,fyV=0,cue=false,endT=0,film=0,lf=0,lastR=-1,lastF=-1,last=0,lastUI=0,note='',noteT=0,wx=0,wy=0,fanA=0,mbo=0;
if(reduced.matches){run=false;rate=0;s=420;}
const say=m=>{announcement.textContent=m;};
function notice(m,a){note=m;noteT=performance.now()+1500;lastUI=0;if(a)say(a);}
function sync(){set(RUN.g,'aria-pressed',run);set(LMP.g,'aria-pressed',lamp);set(REW,'aria-pressed',rev);set(HK[' '],'aria-pressed',run);set(HK.l,'aria-pressed',lamp);set(HK.r,'aria-pressed',rev);lastUI=0;noteT=0;}
function runT(){audio();click();endT=0;if(rev){rev=false;say('Rewind stopped.');}else if(!run&&s>=TOTAL){notice('END OF REEL · R TO REWIND','End of reel. Press R to rewind.');return;}else{run=!run;cue=false;say(run?'Transport running at 24 frames per second.':'Transport stopped. The frame holds on the screen.');}sync();}
function lampT(){audio();click(900);lamp=!lamp;say(lamp?'Lamp on. The filament warms up.':'Lamp off.');sync();}
function focusT(d){audio();fstep=d===undefined?(fstep?0:2):clamp(fstep+d,-3,3);notice(fstep?`FOCUS ${fstep>0?'+':'−'}${Math.abs(fstep)} · SOFT`:'FOCUS · SHARP',fstep?'The picture is soft.':'Sharp focus.');}
function frameT(d){audio();frs=d===undefined?(frs?0:3):clamp(frs+d,-8,8);notice(frs?`FRAMING ${frs>0?'+':'−'}${Math.abs(frs)}`:'FRAMING · CENTRED',frs?'The frame line shows on the screen.':'The frame is centred.');}
function rewT(){audio();click(700);endT=0;cue=false;if(s<=0&&!rev){notice('REEL AT START','The reel is already at the start.');return;}rev=!rev;if(rev)run=false;say(rev?'Rewinding at eight times speed.':'Rewind stopped.');sync();}
function cueT(){audio();click(1300);lamp=true;endT=0;if(s>0){cue=true;rev=true;run=false;say('Rewinding to the countdown leader.');}else{run=true;say('Countdown.');}notice('CUEING COUNTDOWN');sync();}
function bind(g,fn){g.addEventListener('click',()=>fn());g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(RUN.g,runT);bind(LMP.g,lampT);bind(REW,rewT);bind(FOC,()=>focusT());bind(FKN,()=>frameT());SC.addEventListener('click',runT);SC.style.cursor='pointer';
const ACT={' ':runT,l:lampT,r:rewT,c:cueT};for(const[k,b]of Object.entries(HK))b.addEventListener('click',()=>ACT[k]());
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key,d={ArrowLeft:-1,ArrowRight:1,ArrowUp:1,ArrowDown:-1}[k];
if(d){e.preventDefault();k==='ArrowLeft'||k==='ArrowRight'?focusT(d):frameT(d);return;}
if(e.repeat)return;const f=ACT[k.toLowerCase()];if(f){if(k===' '&&e.target.closest&&e.target.closest('button'))return;e.preventDefault();f();}});
addEventListener('pointerdown',()=>audio(),{once:true});addEventListener('keydown',()=>audio(),{once:true});
// Sound: intermittent clatter that follows the frame rate, motor hum, lamp fan, a small piano score from the optical track, the 2-pop.
let ac=null,out,clat,hum,cg,hg,fg,mg,mt=0,mb=0,pop=-1;
const MEL=[76,79,84,83,81,79,77,76,74,77,81,79,77,76,74,72,71,74,79,77,76,74,72,72],BAS=[48,43,41,43,48,45,43,48],mf=m=>440*2**((m-69)/12);
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();const R=ac.sampleRate,bp=ac.createBiquadFilter(),lp=ac.createBiquadFilter(),fl=ac.createBiquadFilter(),ml=ac.createBiquadFilter();out=ac.createGain();out.gain.value=.6;out.connect(ac.destination);
const b=ac.createBuffer(1,R,R),d=b.getChannelData(0);for(let k=0;k<24;k++){const i=k*R/24|0;for(let j=0;j<240;j++)d[i+j]+=(Math.random()*2-1)*Math.exp(-j/36)*(k%2?.55:1);}
clat=ac.createBufferSource();clat.buffer=b;clat.loop=true;bp.type='bandpass';bp.frequency.value=1700;bp.Q.value=.8;cg=ac.createGain();cg.gain.value=0;clat.connect(bp);bp.connect(cg);cg.connect(out);clat.start();
hum=ac.createOscillator();hum.type='sawtooth';hum.frequency.value=48;lp.frequency.value=170;hg=ac.createGain();hg.gain.value=0;hum.connect(lp);lp.connect(hg);hg.connect(out);hum.start();
const nb=ac.createBuffer(1,R,R),nd=nb.getChannelData(0);for(let i=0;i<R;i++)nd[i]=Math.random()*2-1;const ns=ac.createBufferSource();ns.buffer=nb;ns.loop=true;fl.frequency.value=480;fg=ac.createGain();fg.gain.value=0;ns.connect(fl);fl.connect(fg);fg.connect(out);ns.start();
mg=ac.createGain();mg.gain.value=0;ml.frequency.value=2400;mg.connect(ml);ml.connect(out);}
if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,t,d,g,type='triangle',dest=mg){const o=ac.createOscillator(),a=ac.createGain();o.type=type;o.frequency.value=f;a.gain.setValueAtTime(0,t);a.gain.linearRampToValueAtTime(g,t+.01);a.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(a);a.connect(dest);o.start(t);o.stop(t+d+.05);}
const click=(f=1900)=>{if(ac)tone(f,ac.currentTime,.03,.02,'square',out);};
const tgt=(p,v,c=.08)=>{if(Math.abs((p._v??-9)-v)>.002){p._v=v;p.setTargetAtTime(v,ac.currentTime,c);}};
function sound(f){if(!ac||!clat)return;const r=Math.abs(rate)/24,t=ac.currentTime,show=rate>20&&heat>.8&&f>=132&&f<TOTAL-72;
tgt(clat.playbackRate,Math.max(.05,Math.min(r,2.5)));tgt(cg.gain,r>.02?(rev?.02:.05*Math.min(1,r)):0);tgt(hg.gain,.012*Math.min(1,r)+(rev?.008:0));tgt(hum.frequency,48*clamp(r,.4,2));tgt(fg.gain,heat*.012);tgt(mg.gain,show?.55:0,.25);
if(show){const spb=.42*24/rate;if(mt<t)mt=t+.05;while(mt<t+.2){const b=mb%24,c=BAS[b/3|0];tone(mf(MEL[b]),mt,.5,.05);tone(mf(b%3?c+16:c),mt,b%3?.25:.7,b%3?.022:.06);if(b%3)tone(mf(c+19),mt,.25,.018);mt+=spb;mb++;}}else mt=0;
if(f>=72&&f<75&&rate>0&&heat>.5&&pop!==72){pop=72;tone(1000,t,.045,.07,'sine',out);}if(f<70)pop=-1;}
// Drawing from state.
function segs(){const q=s/TOTAL,k=RM*RM-R0*R0,Rf=Math.sqrt(R0*R0+k*(1-q)),Rt=Math.sqrt(R0*R0+k*q);
for(const[r,R]of[[RF,Rf],[RT,Rt]]){set(r.pack,'r',f2(R));r.rings.forEach((c,i)=>{const v=R*(.62+.2*i);set(c,'r',f2(v));c.style.display=v>R0+2?'':'none';});}
const a=tang([288,-336],Rf,[316,-240],true),b=tang([432,-336],Rt,[367.5,-176],false);
RF.seg.forEach(p=>set(p,'d',`M${f2(a[0])},${f2(a[1])}Q316,-240 316,-218`));RT.seg.forEach(p=>set(p,'d',`M367.5,-152Q367.5,-176 ${f2(b[0])},${f2(b[1])}`));lf=RF.seg[0].getTotalLength();return[Rf,Rt];}
function beam(){const lx=176+fo,pts=[];for(let i=0;i<16;i++){const a=i*Math.PI/8;pts.push(P(lx,123+11*cos(a),160+11*sin(a)));}for(const[y,z]of[[199.8,215.2],[46.2,215.2],[46.2,104.8],[199.8,104.8]])pts.push(P(-40,y,z));
const d='M'+hull(pts).map(p=>p.map(f2).join(',')).join('L')+'Z',a=P(lx,123,160),b=P(-40,123,160);set(BF,'d',d);set(BB,'d',d);set(BGR,'x1',f2(a[0]));set(BGR,'y1',f2(a[1]));set(BGR,'x2',f2(b[0]));set(BGR,'y2',f2(b[1]));}
function frameDraw(f){const lead=f<120,blk=f>=120&&f<132,end=f>=TOTAL-72,rn=k=>((Math.sin(f*12.9898+k*78.233)*43758.5453)%1+1)%1;
CD.style.display=lead?'':'none';SN.style.display=lead||blk||end?'none':'';EN.style.display=blk||end?'':'none';ENT.style.display=end?'':'none';
if(lead){const a=(f%24)/24*2*Math.PI;NUM.textContent=5-Math.floor(f/24);set(SW,'d',a<.01?'':`M64,46V-34A80,80 0 ${a>Math.PI?1:0} 1 ${f2(64+80*sin(a))},${f2(46-80*cos(a))}Z`);}
else if(!blk&&!end){const t=(f-132)/24,x=-56+(t*21)%250;set(TRN,'transform',`translate(${f2(x)} 55)`);
PUF.forEach((p,i)=>{const k=(t*1.3+i/6)%1;set(p,'cx',f2(x-4-k*24));set(p,'cy',f2(44-k*16));set(p,'r',f2(1.2+k*4.4));p.style.opacity=f2((1-k)*.85);});
CLD.forEach((c,i)=>set(c,'transform',`translate(${f2((i*70+t*1.6)%170-25)} ${10+i*9})`));RL.forEach((l,i)=>{const y=75+i*4.5,x0=(i*37+t*6)%140-10;set(l,'x1',f2(x0));set(l,'x2',f2(x0+8+i*3));set(l,'y1',y);set(l,'y2',y);});}
GRN.forEach((g,i)=>{set(g,'cx',f2(11+rn(i)*128));set(g,'cy',f2(8+rn(i+9)*92));set(g,'r',f2(.25+rn(i+20)*.6));});const sx=f2(11+rn(41)*128);SCR.style.display=rn(40)<.22?'':'none';set(SCR,'x1',sx);set(SCR,'x2',sx);
CUE.style.display=(f>=TOTAL-200&&f<TOTAL-196)||(f>=TOTAL-90&&f<TOTAL-86)?'':'none';CNT.textContent=String(f).padStart(4,'0');}
function lit(n,c){if(n._c!==c){n._c=c;set(n,'class','led'+(c?' '+c:''));}}
function spring(x,v,t,w,dt){v+=(w*w*(t-x)-2*w*v)*dt;return[x+v*dt,v];}
function ui(now,f){const fn=fstep?`SOFT ${fstep>0?'+':'−'}${Math.abs(fstep)}`:'SHARP';let st;
readout.textContent=`${rate<-1?'REW ×8':String(Math.round(rate)).padStart(2,'0')+' fps'} · ${String(f).padStart(4,'0')} · ${fn}${frs?` · FRAME ${frs>0?'+':'−'}${Math.abs(frs)}`:''}`;
if(now<noteT)st=note;else if(rev)st=cue?'CUEING · REWINDING TO LEADER':'REWINDING · 8×';else if(s>=TOTAL)st=endT?'END OF REEL · ENCORE SOON':'END OF REEL · R TO REWIND';else if(!run)st=lamp?(heat<.9?'LAMP WARMING · STANDBY':'STANDBY · STILL FRAME'):heat>.05?'LAMP COOLING':'STANDBY · LAMP OFF';
else if(!lamp)st='RUNNING DARK · LAMP OFF';else if(heat<.9)st='RUNNING · LAMP WARMING';else st=f<120?`PROJECTING · COUNTDOWN ${5-Math.floor(f/24)}`:f<132?'PROJECTING · LEADER':f>=TOTAL-72?'PROJECTING · THE END':'PROJECTING · THE VIADUCT';stateLabel.textContent=st;}
function tick(now){
const dt=Math.min(.05,(now-(last||now))/1000),red=reduced.matches;last=now;
const tg=rev?-192:run?24:0,acc=rev||rate<-1?260:tg>rate?60:40;rate=red?tg:rate+clamp(tg-rate,-acc*dt,acc*dt);
s=clamp(s+rate*dt,0,TOTAL);
if(s>=TOTAL&&run){run=false;endT=now;say('End of reel. The projector rewinds for the next show.');sync();}
if(s<=0&&rev){rev=false;if(cue||endT){cue=false;endT=0;run=true;lamp=true;say('Rewound. The countdown begins.');}else notice('REWOUND · SPACE TO RUN','Rewound.');sync();}
if(endT&&!rev&&!run&&now-endT>2600){rev=true;sync();}
heat+=((lamp?1:0)-heat)*(red?1:clamp(dt*(lamp?1.4:2.6)));
if(red){fo=fstep*2;fy=frs*6;}else{[fo,foV]=spring(fo,foV,fstep*2,7,dt);[fy,fyV]=spring(fy,fyV,frs*6,9,dt);}
const v=rate*PITCH,f=Math.floor(s);if(!red)film=(film+v*dt)%4000;
if(Math.abs(s-lastR)>.4||lastR<0){lastR=s;segs();}const q=s/TOTAL,Rf=Math.sqrt(R0*R0+(RM*RM-R0*R0)*(1-q)),Rt=Math.sqrt(R0*R0+(RM*RM-R0*R0)*q);
if(!red){RF.a+=v/Rf*dt/RAD;RT.a+=v/Rt*dt/RAD;for(const w of ROT){w.a=(w.a||0)+v/w.r*dt/RAD;set(w.g,'transform',`rotate(${f2(w.a%360)})`);}
set(MBT,'stroke-dashoffset',f2((mbo-=Math.abs(rate)*.9*dt)%6.2));if(rate>0)BLT[1].o=(BLT[1].o||0)-v/Rt*7*dt;if(rate<0)BLT[0].o=(BLT[0].o||0)+v/Rf*7*dt;for(const b of BLT)set(b,'stroke-dashoffset',f2((b.o||0)%6.2));fanA+=heat*600*dt;HZ.forEach((h,i)=>{const t=now/1000+i*1.7,k=(t*.45)%1,b=P(456+(i-1)*5,68,277+k*30),w=2.2+k*2;set(h,'d',`M${f2(b[0])},${f2(b[1])}c${f2(w)},-3 ${f2(-w)},-5 0,-8c${f2(w)},-3 ${f2(-w)},-5 0,-8`);h.style.opacity=f2(heat*heat*(1-k)*k*1.6);});set(FAN,'transform',`translate(33 98) rotate(${f2(fanA%360)})`);}
for(const r of[RF,RT])set(r.rot,'transform',`rotate(${f2(r.a%360)})`);
const o=-film;for(const k of[4,5]){set(RF.seg[k],'stroke-dashoffset',f2(o%4));set(RT.seg[k],'stroke-dashoffset',f2((o+lf+FLEN)%4));}set(FST[2],'stroke-dashoffset',f2((o+lf)%4));
if(f!==lastF&&(!red||lastF<0||!run)){lastF=f;frameDraw(f);if(!red&&Math.abs(rate)>1){wx=(Math.random()-.5)*.5;wy=(Math.random()-.5)*.6;}}
set(ISTK,'transform',`translate(${f2(wx)} ${f2(wy+fy)})`);set(FL,'transform',`translate(${f2(fo*C)} ${f2(fo*S)})`);set(FRR,'transform',`rotate(${f2(fo*30)})`);set(FKR,'transform',`rotate(${f2(fy*7)})`);
if(Math.abs(fo-(beam.fo??99))>.02){beam.fo=fo;beam();}const bl=Math.abs(fo)*.6;if(bl>.06){set(IBL,'filter','url(#fb)');set(FBS,'stdDeviation',f2(bl));}else IBL.removeAttribute('filter');
const ar=Math.abs(rate),sh=red||ar<.5?1:ar<18?.5+.5*Math.abs(sin(now/1000*Math.PI*ar/2)):.93+.07*Math.random(),li=heat*heat*sh;
ILIT.style.opacity=f2(clamp(li*1.05));BEAM.style.opacity=f2(li);SGL.style.opacity=f2(li*.16);GGL.style.opacity=f2(li*.8);LGL.style.opacity=f2(li*.6);
PGL.style.opacity=f2(Math.sqrt(heat));for(const g of VGL)g.style.opacity=f2(heat*.8);EXC.style.opacity=f2(heat);
if(!red&&li>.02){const lx=176+fo;MOTE.forEach(m=>{m.t=(m.t+m.v*dt*(m.ph%2?1:-.6)+1)%1;m.y=clamp(m.y+(Math.random()-.5)*dt*.7,-1,1);m.z=clamp(m.z+(Math.random()-.5)*dt*.7-dt*.03,-1,1);if(m.z<=-1)m.z=1;
const t=m.t,p=P(lx+(-40-lx)*t,123+m.y*(11+66*t)*.9,160+m.z*(11+44*t)*.9);set(m.n,'cx',f2(p[0]));set(m.n,'cy',f2(p[1]));m.n.style.opacity=f2(.45+.55*Math.abs(sin(now/900+m.ph)));});}
lit(LM,run||rev?'g':'');lit(LL,lamp?'a':'');set(RUN.r,'transform',`translate(0 ${run?7:0})`);set(LMP.r,'transform',`translate(0 ${lamp?7:0})`);
{const tp=[446,137,rev?119:105],d=poly([[446,128.5,112],tp]),k=P(...tp);set(rwU,'d',d);set(rwC,'d',d);set(rwK,'cx',f2(k[0]));set(rwK,'cy',f2(k[1]));}
sound(f);if(!lastUI||now-lastUI>150){lastUI=now;ui(now,f);}
requestAnimationFrame(tick);}
sync();segs();beam();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [' ', 'l', 'r', 'c'], draw }
