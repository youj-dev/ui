// @ts-nocheck
/* CORVEL TS–3 · Traffic light. Drawn for this kit on the shared engine, in the manner of the lab files: its stylesheet,
 * defs and script. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--recess:#9d9d99;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--hs:#e6b23c;--hs-top:#f4cd68;--hs-side:#c7972d;--plate:#363635;--plate-top:#4b4b49;--plate-side:#282827;--vin:#1d1d1c;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--walk:#dcd9d1;--walk-top:#ebe8e1;--walk-side:#c4c0b7;--road:#b1b0ab;--stripe:#fbfbf7;--sign:#fbfbf7;--reflect:#f4f1e6;--red:#ff3b30;--amber:#ffab1f;--green:#12d18e;--r-off:#7c3a33;--a-off:#806737;--g-off:#33695a;--hand:#ff8a1f;--man:#f3f6f4;--wait:#ffab1f;--wait-off:#4a4a47;--halo-a:.42;--halo-w:.14;--wash-a:.05;--spec:.6;--hi:.75}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--recess:#6e6e6c;--line:#444443;--hs:#c29531;--hs-top:#e4c061;--hs-side:#8c691d;--plate:#2f2f2e;--plate-top:#474746;--plate-side:#1b1b1b;--vin:#121211;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--walk:#b9b7b2;--walk-top:#dcd9d2;--walk-side:#898784;--road:#8e8d89;--stripe:#e4e4e0;--sign:#d4d4d1;--reflect:#cfccc2;--r-off:#55241f;--a-off:#584524;--g-off:#1d4639;--wait-off:#3a3a38;--halo-a:.85;--halo-w:.34;--wash-a:.3;--spec:.32;--hi:.4}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.micro{font-size:1.5px;letter-spacing:.15px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.hs{fill:var(--hs)}.top.hs{fill:var(--hs-top)}.side.hs{fill:var(--hs-side)}.plate{fill:var(--plate)}.top.plate{fill:var(--plate-top)}.side.plate{fill:var(--plate-side)}.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.walk{fill:var(--walk)}.top.walk{fill:var(--walk-top)}.side.walk{fill:var(--walk-side)}.vin{fill:var(--vin)}.sign{fill:var(--sign)}
.road{fill:var(--road);stroke:none}.stripe{fill:var(--stripe);stroke:none}.domes{fill:url(#domes);stroke:none}.joint{fill:none;stroke:var(--walk-side);stroke-width:.5;vector-effect:non-scaling-stroke}.reflect{fill:none;stroke:var(--reflect);stroke-width:1.2}.vout{fill:url(#vout)}
.brand{fill:var(--hs-top);font:600 2.6px Georgia,'Times New Roman',serif;letter-spacing:.35px;text-anchor:middle}.sgn{fill:#2a2a29;font:700 2.3px ui-monospace,monospace;letter-spacing:.3px;text-anchor:middle}.sgn.micro{font-size:1.45px;font-weight:600;letter-spacing:.1px}.arrow{fill:#2a2a29;stroke:none}
.hi{fill:none;stroke:#fff;stroke-width:.9;stroke-linecap:round;opacity:var(--hi);pointer-events:none}.spec{fill:#fff;opacity:var(--spec);pointer-events:none}.fres{fill:none;stroke:#fff;stroke-width:.35;opacity:.18;pointer-events:none}
.lens{stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.lens.r{fill:var(--r-off)}.lens.a{fill:var(--a-off)}.lens.g{fill:var(--g-off)}
.lit{opacity:0;transition:opacity .22s ease-out;pointer-events:none}.lit.on{opacity:1;transition-duration:.07s}.lit.r{fill:url(#lr)}.lit.a{fill:url(#la)}.lit.g{fill:url(#lg)}.lit.on{filter:url(#glow)}
.tint{opacity:0;stroke:none;pointer-events:none}.tint.on{opacity:.38}.tint.r{fill:var(--red)}.tint.a{fill:var(--amber)}.tint.g{fill:var(--green)}
.halo{opacity:0;stroke:none;filter:url(#bloom);transition:opacity .22s ease-out;pointer-events:none}.halo.on{opacity:var(--halo-a);transition-duration:.07s}.halo.wide.on{opacity:var(--halo-w)}.halo.r{fill:var(--red)}.halo.a,.halo.w{fill:var(--amber)}.halo.g{fill:var(--green)}.halo.h{fill:var(--hand)}.halo.m{fill:var(--man)}
.wash{opacity:0;stroke:none;transition:opacity .3s;pointer-events:none}.wash.on{opacity:var(--wash-a)}
.led{opacity:.12}.led.on{opacity:1;filter:url(#led)}.hand{fill:var(--hand);stroke:none}.man{fill:none;stroke:var(--man);stroke-width:1.15;stroke-linecap:round;stroke-linejoin:round}.man circle{fill:var(--man);stroke:none}
.seg{fill:var(--hand);opacity:.1}.seg.on{opacity:1}.digits.on{filter:url(#led)}
.wait{fill:var(--wait-off);font:700 2.5px ui-monospace,monospace;letter-spacing:.4px;text-anchor:middle;transition:fill .15s}.wait.on{fill:var(--wait);filter:url(#glow)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
@media(prefers-reduced-motion:reduce){.lit,.halo,.wash,.wait{transition:none}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const lens = (id: string, hot: string, mid: string, rim: string) =>
  `<radialGradient id="${id}" cx=".5" cy=".5" r=".5" fx=".42" fy=".36"><stop offset="0" stop-color="#fffdf6"/><stop offset=".2" stop-color="${hot}"/><stop offset=".62" stop-color="${mid}"/><stop offset="1" stop-color="${rim}"/></radialGradient>`
const wash = (id: string, c: string) => `<radialGradient id="${id}"><stop offset="0" stop-color="${c}" stop-opacity=".9"/><stop offset=".5" stop-color="${c}" stop-opacity=".35"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`

const defs = `${lens('lr', '#ffb3a6', '#ff3b30', '#c81e14')}${lens('la', '#ffe2a3', '#ffab1f', '#d27c00')}${lens('lg', '#b8ffe2', '#12d18e', '#06905e')}
${wash('wr', '#ff3b30')}${wash('wa', '#ffab1f')}${wash('wg', '#12d18e')}
<linearGradient id="vout" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--plate-top)"/><stop offset=".5" style="stop-color:var(--plate)"/><stop offset="1" style="stop-color:var(--plate-side)"/></linearGradient>
<radialGradient id="roadFade" cx=".32" cy=".5" r=".62"><stop offset=".7" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
<mask id="roadMask" maskUnits="userSpaceOnUse" x="-4" y="-4" width="48" height="48"><rect x="0" y="0" width="38" height="40" fill="url(#roadFade)"/></mask>
<filter id="led" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation=".45" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<pattern id="domes" width="1.8" height="1.8" patternUnits="userSpaceOnUse"><rect width="1.8" height="1.8" style="fill:var(--hs)"/><circle cx=".9" cy=".9" r=".48" style="fill:var(--hs-top);stroke:var(--hs-side);stroke-width:.18"/></pattern>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* CORVEL TS–3 traffic signal. World: x lower-right; y lower-left (front faces +y); z up. 1 unit ≈ 2.5 cm.
Part                          x      y      z      w      d      h
sidewalk (concrete)         −20    −14      0     28     40      3   joints, curb line at x 4.4, tactile pad 0.6–4.4 × 4–16
road (asphalt, fading)        8    −14      0     38     40      –   crosswalk bars across y 4–16, stop line at y 20
pole                    r 3.2 at 0 0, z 4.4–94 on a base plate and collar; straps at z 25 and 42
push-button box              −6    3.2     22     12    4.2     24   sign (PUSH TO CROSS →), WAIT window, button r 3.3
pedestrian head               6    −11     60      8     22     20   faces +x: hand and walking figure, 2-digit countdown; hood
vehicle head                −14     −8    100     28     15     81   three 300 mm lamps r 9.2 at z 167.5 / 140.5 / 113.5
backplate                   −20    5.6     95     40    1.4     91   reflective border; cap visors r 10.8, 8 deep
Motion: none but the lamps; they fade on and off in a few frames (jump with reduced motion). */
const drawing=document.getElementById('drawing');
const{P,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,box,cylinder,frame}=kit(()=>drawing);
const{cos,sin,PI}=Math,RAD=PI/180,f2=v=>(+v).toFixed(2);
const pts=a=>'M'+a.map(p=>p.map(f2).join(',')).join('L')+'Z';
const rr=(x,y,w,h,r)=>`M${x+r},${y}H${x+w-r}A${r},${r} 0 0 1 ${x+w},${y+r}V${y+h-r}A${r},${r} 0 0 1 ${x+w-r},${y+h}H${x+r}A${r},${r} 0 0 1 ${x},${y+h-r}V${y+r}A${r},${r} 0 0 1 ${x+r},${y}Z`;
function pin(g,x,y,r=.7){circle(g,x,y,r,'face top metal');line(g,x-r*.5,y+r*.35,x+r*.5,y-r*.35);}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
const ctl=(g,label,extra={})=>{for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0','aria-label':label,...extra}))set(g,k,v);return g;};
const at=(x,y,z,r,cls)=>{const q=P(x,y,z);return el('circle',{cx:f2(q[0]),cy:f2(q[1]),r,class:cls});};
// The ground: its shadow, a fading patch of road with the crosswalk and stop line, the sidewalk with its curb and
// tactile pad, and the coloured light each lamp throws on it.
const sh=P(8,6,0);el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]),rx:50,ry:25,class:'shadow stage-floor'});el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]),rx:50,ry:25,class:'stage-contact'});
const RD=el('g',{mask:'url(#roadMask)'},group(TOP(8,-14,0)));rect(RD,0,0,38,40,0,'road');for(let k=0;k<5;k++)rect(RD,2.4+k*6.6,18,3.6,12,.3,'stripe');rect(RD,0,33.6,17,1.6,.2,'stripe');
box(-20,-14,0,28,40,3,1.2,'walk');
{const g=group(TOP(-20,-14,3.02));for(const v of[13,27])line(g,0,v,24.4,v,'joint');line(g,10,0,10,40,'joint');line(g,24.4,0,24.4,40,'detail');rect(g,20.6,18,3.8,12,.3,'face domes');}
const WASH=['wr','wa','wg'].map(id=>{const g=group(TOP(0,26,.08));return el('ellipse',{cx:0,cy:0,rx:30,ry:30,fill:`url(#${id})`,class:'wash'},g);});
// The pole: base plate and bolts, the collar, the shaft with its highlight, the straps for the button box.
box(-5.5,-5.5,3,11,11,1.4,.8,'metal');for(const[x,y]of[[-4,-4],[4,-4],[-4,4],[4,4]])cylinder(x,y,4.4,.9,1,'z','metal');
cylinder(0,0,4.4,4.6,6,'z','metal');cylinder(0,0,10.4,3.8,1.2,'z','metal');cylinder(0,0,11.6,3.2,82.4,'z','metal');
{const a=P(0,0,13),b=P(0,0,92);line(drawing,f2(a[0]-1.5),f2(a[1]),f2(b[0]-1.5),f2(b[1]),'hi');}
for(const z of[25,41.6])cylinder(0,0,z,3.6,1.4,'z','metal');
// The pedestrian head on two brackets, facing the crossing (+x): the hand and the walking figure overlaid in one
// cell, the countdown's two digits beside them, a hood over both.
for(const z of[63.5,74.5])box(3,-2,z,3.4,4,2.6,.6,'hs');
box(6,-11,60,8,22,20,2.4,'hs');{const g=group(SIDE(6,11,80));for(const u of[4,18])pin(g,u,1.2,.55);}
const PF=group(SIDE(14.02,11,80));rect(PF,1.3,1.6,19.4,16.8,1.4,'face plate');line(PF,11,3,11,17,'detail');
const handG=el('g',{class:'led'},PF),manG=el('g',{class:'led'},PF);
{const g=group('translate(6.2 10.6) scale(.92)',handG);for(const[x,t]of[[-2.9,-4.4],[-1.5,-5.2],[0,-5],[1.4,-4.2]])rect(g,x,t,1.25,5,.62,'hand');rect(g,-2.9,-1.6,4.3,5.2,1.3,'hand');el('path',{d:'M-2.4,1.6L-4.6,-.6Q-5.2,-1.3 -4.5,-1.7Q-3.9,-2 -3.3,-1.4L-2,-.2Z',class:'hand'},g);}
{const g=group('translate(6.4 10.4) scale(.95)',manG);circle(g,.7,-4.6,1.15,'');el('path',{d:'M.4,-2.9L-.2,.9M-.2,.9L1.4,2.4L1.7,4.9M-.2,.9L-1.5,2.9L-2.6,4.6M.3,-2.4L1.8,-.9L2.9,-.6M.3,-2.4L-1.3,-1.2L-1.9,.4'},g);set(g,'class','man');}
const SEG={a:[.5,0,2.2,.7],b:[2.5,.4,.7,3],c:[2.5,3.6,.7,3],d:[.5,6.3,2.2,.7],e:[0,3.6,.7,3],f:[0,.4,.7,3],g:[.5,3.15,2.2,.7]};
const DIG=['abcdef','bc','abged','abgcd','fgbc','afgcd','afgedc','abc','abcdefg','abcdfg'];
const digG=el('g',{class:'digits'},PF);const digits=[12.6,16.4].map(u=>{const g=group(`translate(${u} 6.6)`,digG),s={};for(const[k,[x,y,w,h]]of Object.entries(SEG))s[k]=rect(g,x,y,w,h,.3,'seg');return s;});
box(14,-11,79.2,4.4,22,.8,.3,'hs');
// The push-button box strapped to the pole: its sign, the WAIT window and the big button with a tactile arrow.
box(-6,3.2,22,12,4.2,24,1.6,'hs');const BF=group(FRONT(-6,7.42,46));
rect(BF,1.4,1.5,9.2,9.6,.7,'face sign');text(BF,6,4.6,'PUSH','sgn');el('path',{d:'M2.8,6.1H7.6V5.1L9.4,6.7L7.6,8.3V7.3H2.8Z',class:'arrow'},BF);text(BF,6,10.2,'TO CROSS','sgn micro');
rect(BF,2,12.2,8,3.5,.6,'face plate');const waitT=text(BF,6,14.85,'WAIT','wait');
circle(BF,6,19.6,3.4,'face metal');const knob=el('g',{},BF);circle(knob,6,19.6,2.55,'face top metal');circle(knob,6,19.6,1.9,'detail');el('path',{d:'M4.4,19.15H6.5V18.4L7.8,19.6L6.5,20.8V20.05H4.4Z',class:'arrow'},knob);
for(const v of[.9,23.1])pin(BF,1.2,v,.5);
// The vehicle head on its slip-fitter: the housing (its sides and top peek out behind the backplate), the plate
// with its reflective border, then each lamp: bezel, lens, its light, the Fresnel rings and glint, and the visor.
cylinder(0,0,92.6,4.4,7.6,'z','hs');
const HX=-14,HY=-8,HZ=100,HW=28,HD=15,HH=81,FY=HY+HD;
box(HX,HY,HZ,HW,HD,HH,3,'hs');{const g=group(SIDE(HX+HW,FY,HZ+HH));for(const v of[27,54])line(g,1,v,HD-1,v);rect(g,1.6,72.6,8.8,4.4,.6,'face plate');text(g,6,75.7,'CORVEL','brand');}
rect(group(TOP(-20,5.6,HZ+HH+5)),0,0,40,1.4,0,'face top plate');rect(group(SIDE(20,7,HZ+HH+5)),0,0,1.4,91,0,'face side plate');
const PL=group(FRONT(-20,7,HZ+HH+5));el('path',{d:rr(0,0,40,91,2.4)+rr(6,5,28,81,3),'fill-rule':'evenodd',class:'face plate'},PL);el('path',{d:rr(1.4,1.4,37.2,88.2,1.6),class:'reflect'},PL);for(const[u,v]of[[3,3],[37,3],[3,88],[37,88]])pin(PL,u,v,.6);
const HF=group(FRONT(HX,FY+.02,HZ+HH));for(const v of[27,54])line(HF,.6,v,27.4,v);
const VL=6,VR=10.8,band=(cx,cy,t0,t1)=>{const n=Math.max(2,Math.ceil((t1-t0)/9)),a=[],b=[];for(let i=0;i<=n;i++){const t=(t0+(t1-t0)*i/n)*RAD,x=cx+VR*cos(t),y=cy-VR*sin(t);a.push([x,y]);b.push([x-VL,y+VL]);}return pts([...a,...b.reverse()]);};
const LAMPS=['r','a','g'].map((c,i)=>{const cx=14,cy=13.5+27*i;
circle(HF,cx,cy,VR,'face hs');circle(HF,cx,cy,9.9,'face vin');circle(HF,cx,cy,9.2,'lens '+c);const lit=circle(HF,cx,cy,9.2,'lit '+c);
for(const r of[6.4,3.6])circle(HF,cx,cy,r,'fres');el('ellipse',{cx:cx-3.4,cy:cy-3.9,rx:2.7,ry:1.4,transform:`rotate(-38 ${cx-3.4} ${cy-3.9})`,class:'spec'},HF);
// Cap visor: the band of its inside the eye can see (left), lit by the lamp, then its outside over the top and right.
const inner=band(cx,cy,135,195);el('path',{d:inner,class:'face vin'},HF);const tint=el('path',{d:inner,class:'tint '+c},HF);el('path',{d:band(cx,cy,-15,135),class:'face vout'},HF);
el('path',{d:`M${f2(cx+VR*cos(-15*RAD)-VL)},${f2(cy+VR*sin(15*RAD)+VL)}A${VR},${VR} 0 1 0 ${f2(cx+VR*cos(195*RAD)-VL)},${f2(cy-VR*sin(195*RAD)+VL)}`,class:'hi'},HF);
return{c,lit,tint};});
// Top layer: the halos (a tight one at each lamp's mouth and a wide, faint one), the pedestrian head's glow.
const HALO=LAMPS.map(L=>{const z=HZ+HH-13.5-27*'rag'.indexOf(L.c);return[at(0,FY+2,z,11,'halo '+L.c),at(0,FY+2,z,26,'halo wide '+L.c)];});
const pq=(u,v)=>P(14.4,11-u,80-v),hp=pq(6.2,10.4),dp=pq(14.6,10);
const pedHalo=el('circle',{cx:f2(hp[0]),cy:f2(hp[1]),r:7,class:'halo'}),digHalo=el('circle',{cx:f2(dp[0]),cy:f2(dp[1]),r:6,class:'halo h'});
const wq=P(0,7.5,32),waitHalo=el('ellipse',{cx:f2(wq[0]),cy:f2(wq[1]),rx:5,ry:4,class:'halo w'});
// Controls: the button box, the three lamps (each holds its state), with hit areas and focus rings.
const BB=ctl(el('g',{}),'Pedestrian push button: ask to cross (Space)');{const g=group(FRONT(-6,7.5,46),BB);rect(g,-1,-1,14,26,2,'hit');rect(g,-1.6,-1.6,15.2,27.2,2.4,'focus-ring');}
const LC=['Red lamp: hold red, blocked (R)','Amber lamp: hold amber, pending (A)','Green lamp: hold green, ready (G)'].map((label,i)=>{const g=ctl(el('g',{}),label,{tabindex:'-1'}),f=group(FRONT(HX,FY+VL,HZ+HH),g);circle(f,14,13.5+27*i,12.4,'hit');circle(f,14,13.5+27*i,13.4,'focus-ring');return g;});
frame([[-20,-14,0,28,40,3],[8,-14,0,30,40,0],[-20,-8,95,40,21,91],[3,-11,60,16,22,20]],10);
// State: the cycle runs red → green → amber on a controller's timing; a push brings the walk phase into the next red
// (and shortens a green it lands in). R, A and G hold a state, as a status light; N flashes amber; C resumes.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const T={G:14,Y:3,R:10,MIN:5,ALL:1,WALK:5,CLR:8},WR=T.ALL+T.WALK+T.CLR+1;
const NAME={R:'RED',Y:'AMBER',G:'GREEN'},MEAN={R:'BLOCKED',Y:'PENDING',G:'READY'},DO={R:'STOP',Y:'PREPARE TO STOP',G:'GO'},SAY={R:'red, blocked',Y:'amber, pending',G:'green, ready'};
let ph='R',el0=T.R-4,dur=T.R,walk=false,call=false,hold=null,night=false,clock=0,pressT=-9,last=0,outKey='',drawn='',lastTick=-1,wasMan=false;
const say=m=>{announcement.textContent=m;};
let ac=null;
function audio(){try{if(!ac){const W=window.AudioContext||window.webkitAudioContext;if(!W)return null;ac=new W();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
function tone(f,d,v,type='sine',when=0,f1=0){const a=ac;if(!a)return;try{const t=a.currentTime+when,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
const relay=()=>{tone(150,.05,.02,'square');tone(2400,.012,.006,'square',.01);},beep=()=>{tone(1320,.06,.016,'square');tone(990,.08,.012,'square',.075);},chirp=()=>tone(900,.22,.018,'sine',0,2600),tickS=(f,v)=>tone(f,.014,v,'square');
const walkOn=()=>!night&&ph==='R'&&walk&&el0>=T.ALL&&el0<T.ALL+T.WALK+T.CLR,waiting=()=>!night&&(call||(ph==='R'&&walk&&el0<T.ALL));
function enter(p,d){ph=p;el0=0;dur=d;relay();}
function advance(){if(ph==='G')enter('Y',T.Y);else if(ph==='Y'){walk=call&&hold!=='R';if(walk)call=false;enter('R',walk?WR:T.R);}else{walk=false;enter('G',call?T.MIN:T.G);}}
function push(){audio();pressT=clock;beep();
if(night){say('The signal is flashing amber: there is no walk phase. C resumes the cycle.');return;}
if(walkOn()){say('The walk signal is already on.');return;}
if(waiting()){say('Wait: the walk signal is coming.');return;}
if(!hold&&ph==='R'&&!walk&&el0<=T.ALL){walk=true;dur=WR;}else{call=true;if(ph==='G'&&!hold)dur=Math.min(dur,Math.max(T.MIN,el0+3));}
say(ph==='G'&&!hold?'Wait: the green is cut short, then the walk signal comes on.':'Wait: the walk signal comes on with the next red.');}
function force(k){audio();night=false;hold=k;
if(k==='R'){if(ph==='G')enter('Y',T.Y);}else if(k==='Y'){if(ph!=='Y')enter('Y',T.Y);}else if(ph!=='G'){walk=false;enter('G',T.G);}
say(ph===k?`Held at ${SAY[k]}. C resumes the cycle.`:`Changing through amber, then held at ${SAY[k]}.`);}
function resume(){audio();if(night){night=false;walk=false;enter('R',4);say('Back to the cycle, starting from red.');return;}
if(!hold){say('The signal is already cycling.');return;}hold=null;if(!walkOn()&&!(dur-el0>0&&dur-el0<=3))el0=Math.max(0,dur-3);say(`The cycle resumes from ${NAME[ph].toLowerCase()}.`);}
function flash(){audio();if(night)return;night=true;hold=null;walk=false;call=false;relay();say('Night: the signal flashes amber and the walk signal is dark. C resumes the cycle.');}
function lit(n,on){if(n._on!==on){n._on=on;n.classList.toggle('on',on);}}
function ui(){const w=walkOn(),man=w&&el0<T.ALL+T.WALK,n=Math.ceil(T.ALL+T.WALK+T.CLR-el0),held=hold===ph;
const r=night?'AMBER · FLASHING':`${NAME[ph]} · ${held?'HELD':Math.max(1,Math.ceil(dur-el0-1e-6))+' S'}${w?(man?' · WALK ':' · DON’T WALK ')+n:''}`;
const st=night?'NIGHT · FLASHING AMBER / C RESUMES':held?`${MEAN[ph]} · HELD / C RESUMES THE CYCLE`:hold?`${MEAN[ph]} · CHANGING TO ${MEAN[hold]}`:`${MEAN[ph]} · ${DO[ph]}${waiting()?' / WAIT':man?' / WALK':w?' / FINISH CROSSING':''}`;
if(r+st!==outKey){outKey=r+st;readout.textContent=r;stateLabel.textContent=st;}}
function tick(now){const dt=last?Math.min(.1,(now-last)/1000):0,red=reduced.matches;last=now;clock+=dt;
if(!night){el0+=dt;if(el0>=dur&&hold!==ph)advance();}
const w=walkOn(),man=w&&el0<T.ALL+T.WALK,clr=w&&!man,beat=red||(clock%1)<.5;
const on={r:!night&&ph==='R',a:night?beat:ph==='Y',g:!night&&ph==='G'};
const hand=!night&&!man&&(!clr||red||((el0-T.ALL-T.WALK)%1)<.5),n=w?Math.ceil(T.ALL+T.WALK+T.CLR-el0):0;
const key=`${on.r}${on.a}${on.g}${hand}${man}${n}${waiting()}${clock-pressT<.18}`;
if(key!==drawn){drawn=key;
LAMPS.forEach((L,i)=>{const o=on[L.c];lit(L.lit,o);lit(L.tint,o);lit(HALO[i][0],o);lit(HALO[i][1],o);lit(WASH[i],o);});
lit(handG,hand);lit(manG,man);set(pedHalo,'class','halo'+(man?' m':hand?' h':''));lit(pedHalo,hand||man);
const s=n?String(n).padStart(2,' '):'  ';digits.forEach((d,i)=>{const on=DIG[+s[i]]||'';for(const k in d)lit(d[k],s[i]!==' '&&on.includes(k));});lit(digG,!!n);lit(digHalo,!!n);
lit(waitT,waiting());lit(waitHalo,waiting());set(knob,'transform',clock-pressT<.18?'translate(.35 -.35)':'');}
// Sound: the relay clicks between phases; during the walk a rapid tick, during the clearance one tick a second.
if(ac){const t=Math.floor(clock*(man?8:1));if(t!==lastTick){lastTick=t;if(man)tickS(2600,.008);else if(clr)tickS(880,.008);}}
if(man&&!wasMan){if(ac)chirp();say('Walk: cross now.');}wasMan=man;
ui();requestAnimationFrame(tick);}
// Input: Space or a click on the box pushes the button; R, A and G (or a click on a lamp) hold a state; N flashes
// amber; C resumes the cycle.
const act={' ':push,r:()=>force('R'),a:()=>force('Y'),g:()=>force('G'),c:resume,n:flash};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented||e.repeat)return;const k=e.key.length===1?e.key.toLowerCase():e.key,fn=act[k];if(fn){e.preventDefault();fn();}});
bind(BB,push);LC.forEach((g,i)=>bind(g,()=>force('RYG'[i])));
ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
