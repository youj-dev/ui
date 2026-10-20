// @ts-nocheck
/* VORLEN E–09 · Espresso machine. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--base-top:#cbcbc7;--base-side:#a4a4a1;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--chrome:#d4d5d2;--chrome-top:#efefec;--chrome-side:#b6b7b4;--rubber:#2e2e2d;--rubber-top:#474745;--cup:#fbfbf8;--cup-side:#e6e6e1;--coffee:#5b4634;--crema:#c79f6b;--steam:#9c9c98;--beam:#ffe9b0;--heat-a:.05}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--base-top:#bebeba;--base-side:#737372;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--chrome:#b3b3b1;--chrome-top:#e0e0dd;--chrome-side:#80807f;--rubber:#252524;--rubber-top:#424240;--cup:#ebebe8;--cup-side:#c2c2bf;--coffee:#4b3a2a;--crema:#a78559;--steam:#838380;--beam:#ffe2a0;--heat-a:.16;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.top.base{fill:var(--base-top)}.side.base{fill:var(--base-side)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}.cup{fill:var(--cup-side)}.top.cup{fill:var(--cup)}.coffee{fill:var(--coffee)}.crema{fill:var(--crema)}
.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.knurl{fill:none;stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke;opacity:.8}.accent{fill:var(--accent);stroke:var(--accent)}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.end{text-anchor:end}
.rail-under,.wand-under,.lever-under,.cord-under,.grip-under,.ferrule-under,.handle-under,.ceramic-under,.prong{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.rail-under{stroke-width:4}.rail{fill:none;stroke:var(--chrome-top);stroke-width:2.7;stroke-linejoin:round;stroke-linecap:round}.wand-under{stroke-width:4.6}.wand{fill:none;stroke:var(--chrome-top);stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}.grip-under{stroke-width:6.4}.grip{fill:none;stroke:var(--rubber);stroke-width:4.8;stroke-linecap:round}.lever-under{stroke-width:3.6}.lever{fill:none;stroke:var(--chrome-top);stroke-width:2.2;stroke-linecap:round}.cord-under{stroke-width:3.4}.cord{fill:none;stroke:var(--rubber);stroke-width:2.2;stroke-linecap:round;stroke-linejoin:round}.prong{stroke-width:1.5}.ferrule-under{stroke-width:6.4}.ferrule{fill:none;stroke:var(--chrome-top);stroke-width:4.8;stroke-linecap:round}.handle-under{stroke-width:10}.handle{fill:none;stroke:var(--rubber);stroke-width:8;stroke-linecap:round}.ceramic-under{stroke-width:6}.ceramic{fill:none;stroke:var(--cup);stroke-width:4.5;stroke-linecap:round}.ceramic-under.sm{stroke-width:4.2}.ceramic.sm{stroke-width:2.8}
.ball{stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke}.spec{fill:#fff;opacity:.55;stroke:none}.glare{fill:none;stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke;opacity:.4}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.lamp{fill:var(--off);stroke:none;transition:fill .25s}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.r,.lamp.b{filter:url(#glow)}.blink{animation:blink 1s steps(1) infinite}
.led-halo,.gauge-halo{opacity:0;transition:opacity .3s}.powered .led-halo{opacity:.65}.powered .gauge-halo{opacity:.09}.lit{fill:var(--muted);transition:fill .3s}.powered .lit{fill:var(--accent)}.rk{fill:var(--off);transition:fill .2s}.powered .rk{fill:var(--accent);filter:url(#glow)}
.zone{fill:none;stroke-width:1.7;opacity:.4;transition:opacity .3s}.zone.ok{stroke:var(--ok)}.zone.hot{stroke:var(--fault)}.powered .zone{opacity:.95}
.ring{fill:none;stroke:var(--off);stroke-width:1.1;transition:stroke .2s,opacity .2s}.ready .ring{stroke:var(--accent);opacity:.55}.active .ring{stroke:var(--accent);opacity:1;filter:url(#glow)}.knob-ring{fill:none;stroke:var(--warn);stroke-width:1.6;opacity:0;transition:opacity .3s}.steaming .knob-ring{opacity:1;filter:url(#glow)}
.water{fill:var(--accent);opacity:.32;stroke:none}.water-line{stroke:var(--accent);opacity:.7}.tank-line{fill:none;stroke:var(--line);stroke-width:.55;opacity:.65}.pipe{fill:none;stroke:var(--line);stroke-width:1.4;opacity:.5}.bubble{fill:#fff;stroke:var(--accent);stroke-width:.3;opacity:0}.brewing .bubble{opacity:.75}
.cuplamp{fill:var(--off);stroke:none;transition:fill .3s}.powered .cuplamp{fill:var(--beam);filter:url(#glow)}.beam{opacity:0;transition:opacity .5s;pointer-events:none}.powered .beam{opacity:.75}.powered.brewing .beam{opacity:1}.heat{fill:var(--warn);opacity:0;filter:url(#bloom);transition:opacity 1.2s;pointer-events:none}.powered .heat{opacity:var(--heat-a)}
.control{cursor:pointer;outline:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .button-face{fill:var(--top)}.control:hover .knob-face{fill:var(--rubber-top)}.press{transition:transform .1s}.pressed .press{transform:translate(1.4px,-1.4px)}.active .button-face{fill:var(--accent);fill-opacity:.22;stroke:var(--accent)}.active .button-icon{stroke:var(--accent)}.control[aria-disabled="true"]{cursor:default}
.flow{fill:none;stroke:var(--coffee);stroke-width:1.45;stroke-linecap:round;stroke-dasharray:3 2;opacity:0;animation:flow .45s linear infinite;animation-play-state:paused}.brewing .flow{opacity:.85;animation-play-state:running}.steam{opacity:0;pointer-events:none}.steaming .steam{opacity:1}.puff{fill:var(--steam);filter:url(#soft);opacity:0;animation:puff 1.65s ease-out infinite;animation-play-state:paused;transform-box:fill-box;transform-origin:center}.steaming .puff{animation-play-state:running}
.tick{stroke-width:.6}.needle{stroke:var(--line);stroke-width:1;stroke-linecap:round}.powered .needle{stroke:var(--accent)}.screen-text{font:8px ui-monospace,monospace;letter-spacing:1px;text-anchor:middle}.indicator{fill:var(--accent);opacity:0}.active .indicator{opacity:1;filter:url(#glow)}
@keyframes flow{to{stroke-dashoffset:-10}}@keyframes puff{0%{opacity:0;transform:translate(0,0) scale(.6)}20%{opacity:.48}100%{opacity:0;transform:translate(5px,-40px) scale(2.8)}}@keyframes blink{50%{opacity:.3}}
@media(prefers-reduced-motion:reduce){.steaming .puff{opacity:.3}.pressed .press{transform:none}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<clipPath id="tankClip"><rect x="43" y="30" width="32" height="76" rx="4.5"/></clipPath>
<clipPath id="cupClip"><circle r="18.3"/></clipPath>
<radialGradient id="ball" cx=".5" cy=".5" r=".6" fx=".35" fy=".3"><stop offset="0" style="stop-color:var(--chrome-top)"/><stop offset="1" style="stop-color:var(--chrome-side)"/></radialGradient>
<radialGradient id="knob" cx=".5" cy=".5" r=".6" fx=".35" fy=".3"><stop offset="0" style="stop-color:var(--rubber-top)"/><stop offset="1" style="stop-color:var(--rubber)"/></radialGradient>
<linearGradient id="cone" gradientUnits="userSpaceOnUse" x1="0" y1="-14" x2="0" y2="95"><stop offset="0" style="stop-color:var(--beam);stop-opacity:.6"/><stop offset="1" style="stop-color:var(--beam);stop-opacity:.05"/></linearGradient>
<radialGradient id="pool"><stop offset="0" style="stop-color:var(--beam);stop-opacity:.8"/><stop offset="1" style="stop-color:var(--beam);stop-opacity:0"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* World coordinates: x lower-right; y lower-left; z up. 1 unit ≈ 1.5 mm.
Part                        x      y      z      w      d      h
adjustable feet (4)     34/194  30/150     0     r8      –     10
plinth                     12     10     10    204    160     17
body                       20     16     27    184     92    165
warmer + heat              31     28  192.2    162     68      0
rail + posts               32     29    193    160     66     13
cups on warmer (2)      53/87   37/49  192.3    r13      –     21
side panel (bevelled)     204     22     42      0     80    144
reservoir window          204     28     80      0     42     88
steam knob + lamp ring    204     80    142     10     25     25
steam wand, joint, grip   204     98     58     41     14     66
power cord + plug         204     26      0     63     22     42
fascia (bevelled)          27    108     56    170      0    128
brand plate                82    109    168     56      0     10
gauge + bezel              40    108    127     43    5.5     43
shot panel + buttons      128    109    136     62    2.4     34
timer                     146    110    115     44      0     15
rocker, ON + READY lamps   37    109     82     40      3     24
splash plate               73    108     60     88      0     44
vents                      77    108     44     94      0      5
drip tray + grille         32    108     27    164     62      8
cup-light cone + pool      88    134     35     44     16     93
spouts + streams          104    141     76     12      2     25
spout block               101    135    101     18     10      6
portafilter + ear          88    107    107     47     43      9
group head                 89    103    116     42     42     12
neck + cup lamps           84    104    128     52     30     20
lever axle + bearings     102    117    148     16      8      8
lever + knob              110    121    145      –     30     30
saucer + cup + crema       87    123     35     46     46     41
cup handle                130    146     48     18      0     20
portafilter handle        110    148    100      2     62     14
steam plume               236    107     55     15     12     57
Seams, screws, labels and rings share their parent face. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: pins, bevelled plates, adopting new parts into a group, smooth cables, front arcs, spheres.
function pin(g,x,y,r=.75){circle(g,x,y,r,'face top');line(g,x-r*.5,y+r*.35,x+r*.5,y-r*.35);}
function panel(g,x,y,w,h,b=2.2){rect(g,x,y,w,h,1,'face');el('path',{d:`M${x},${y}H${x+w}L${x+w-b},${y+b}H${x+b}ZM${x},${y}L${x+b},${y+b}V${y+h-b}L${x},${y+h}Z`,class:'face top'},g);el('path',{d:`M${x},${y+h}L${x+b},${y+h-b}H${x+w-b}L${x+w},${y+h}ZM${x+w},${y}V${y+h}L${x+w-b},${y+h-b}V${y+b}Z`,class:'face side'},g);}
function into(g,fn){const n=root.childNodes.length;fn();while(root.childNodes.length>n)g.appendChild(root.childNodes[n]);return g;}
const f2=v=>(+v).toFixed(2);
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
const frontArc=(x,y,z,r,cls='detail')=>el('path',{d:`M${f2(r*.7071)},${f2(-r*.7071)} A${r},${r} 0 0 1 ${f2(-r*.7071)},${f2(r*.7071)}`,class:cls},group(TOP(x,y,z)));
function sphere(p,r,fill,parent=root){const s=P(...p);el('circle',{cx:s[0],cy:s[1],r,fill,class:'ball'},parent);el('circle',{cx:s[0]-r*.32,cy:s[1]-r*.36,r:r*.26,class:'spec'},parent);}
const lerp3=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const arc=(r,b0,b1)=>{const a=b=>(-125+b*250/12)*Math.PI/180;return`M${f2(Math.sin(a(b0))*r)},${f2(-Math.cos(a(b0))*r)} A${r},${r} 0 0 1 ${f2(Math.sin(a(b1))*r)},${f2(-Math.cos(a(b1))*r)}`;};
// Assembly: back to front, all physical parts in world coordinates.
const shadow=P(118,92,0);el('ellipse',{cx:shadow[0],cy:shadow[1]+4,rx:150,ry:58,class:'shadow stage-floor'});el('ellipse',{cx:shadow[0],cy:shadow[1]+4,rx:150,ry:58,class:'stage-contact'});
for(const[x,y]of[[34,30],[34,150],[194,30],[194,150]]){cylinder(x,y,0,8,5,'z','rubber');cylinder(x,y,5,6,5,'z','chrome');}
box(12,10,10,204,160,17,6,'base');
wire([[19,170,18.5],[209,170,18.5]]);wire([[216,17,18.5],[216,163,18.5]]);
box(20,16,27,184,92,165,8);
wire([[28,108,188],[196,108,188]]);wire([[204,24,188],[204,100,188]]);
const warmer=group(TOP(31,28,192.15));rect(warmer,-3,-3,168,74,8,'face top');rect(warmer,0,0,162,68,6,'face recess');
slits(warmer,14,11,134,41,19);text(warmer,81,61,'CUP WARMER / HOT SURFACE','etch center');
const heat=rect(warmer,6,6,150,52,6,'heat');
for(const[x,y]of[[32,29],[192,29],[32,95],[192,95]]){wire([[x,y,193],[x,y,206]],'rail-under');wire([[x,y,193],[x,y,206]],'rail');}
const rail=group(TOP(32,29,206));rect(rail,0,0,160,66,9,'rail-under');rect(rail,0,0,160,66,9,'rail');
for(const[x,y]of[[66,50],[100,62]]){
cylinder(x,y,192.3,13,21,'z','cup');ellipse(x,y,213.3,8.4,'z','detail');ellipse(x,y,213.3,5.6,'z','detail');
const h=group(FRONT(x+12.6,y,206.5));for(const c of['ceramic-under sm','ceramic sm'])el('path',{d:'M0,-6 C8.5,-8 8.5,6 0,5',class:c},h);
}
// Right side: bevelled panel, reservoir window, steam knob and wand, cord.
const sp=group(SIDE(204.2,108,192));panel(sp,6,6,80,144,2.4);
for(const[u,v]of[[10.5,10.5],[81.5,10.5],[10.5,145.5],[81.5,145.5]])pin(sp,u,v,1);
text(sp,59,20,'RESERVOIR','label center');
rect(sp,38,24,42,88,7,'face base');rect(sp,41,28,36,80,5.5,'face recess');rect(sp,43,30,32,76,4.5,'face glass');
const water=rect(sp,43,60,32,46,0,'water');set(water,'clip-path','url(#tankClip)');
const bubbles=el('g',{'clip-path':'url(#tankClip)'},sp);
const waterLine=line(sp,43,60,75,60,'detail water-line');set(waterLine,'clip-path','url(#tankClip)');
line(sp,69,32,69,98,'pipe');rect(sp,66.4,97,5.2,6.4,1.6,'face base');line(sp,66.4,100.2,71.6,100.2);
for(let i=0;i<7;i++){const v=36+i*10.33;line(sp,45.5,v,i%3?47.6:50,v,'tank-line');}
text(sp,51.6,37.1,'MAX','etch micro');text(sp,51.6,99.1,'MIN','etch micro');
const lowLamp=circle(sp,44,119,1.4,'lamp');text(sp,46.8,120.1,'LOW','etch micro');text(sp,79,120.1,'1.2 L','etch micro end');
slits(sp,40,128,40,8,12);
cylinder(204.2,92,154,12.6,2.6,'x','chrome');
const knobRing=ellipse(206.9,92,154,12.6,'x','knob-ring');
cylinder(206.8,92,154,10.6,6.8,'x','rubber');
const steamControl=group(SIDE(213.7,92,154),root,{class:'control',role:'button',tabindex:'0','aria-label':'Toggle steam (S)','aria-pressed':'false',id:'steamControl'});
circle(steamControl,0,0,10.6,'face top rubber knob-face');
for(let i=0;i<24;i++){const a=i*Math.PI/12;line(steamControl,9.1*Math.cos(a),9.1*Math.sin(a),10.3*Math.cos(a),10.3*Math.sin(a),'knurl');}
const knobWing=group('',steamControl);rect(knobWing,-2.4,-9,4.8,18,2.4,'face top chrome');circle(knobWing,0,-6.2,.95,'face recess');
circle(steamControl,0,0,14,'focus-ring');
text(group(SIDE(204.3,92,171)),0,0,'STEAM','etch center');
const wp=[[204,100,124],[216,100,124],[223,105,118],[227,110,98],[235,111,70],[243,109,66],[243,109,62]];
ellipse(204.4,100,124,5.4,'x','face top chrome');ellipse(204.5,100,124,3.4,'x','detail');
wire(wp,'wand-under');wire(wp,'wand');sphere(wp[1],3.6,'url(#ball)');
const gp=[lerp3(wp[2],wp[3],.45),wp[3],lerp3(wp[3],wp[4],.38)];wire(gp,'grip-under');wire(gp,'grip');
cylinder(243,109,58.4,2.3,3.8,'z','chrome');
cylinder(204.2,28,38,3.6,5,'x','rubber');
const cd=smooth([[209,28,38],[217,27,37],[223,26,28],[225.5,26,12],[229,29,2.6],[240,38,2.6],[251,44,2.6]]);
el('path',{d:cd,class:'cord-under'});el('path',{d:cd,class:'cord'});
box(251,40.5,0,11,7,5.4,1.6,'rubber');for(const y of[42.4,45.6])wire([[262,y,2.7],[266.5,y,2.7]],'prong');
// Front: bevelled fascia, plate, gauge, shot panel, timer, rocker, lamps, splash plate.
const fas=group(FRONT(27,108.4,184));panel(fas,0,0,170,128,2.4);
for(const p of[[6,6],[164,6],[6,122],[164,122]])screw(fas,...p);
rect(fas,46,80,88,44,4,'face base');for(const p of[[50,84],[130,84],[50,120],[130,120]])pin(fas,...p,.9);
const plate=group(FRONT(82,109.2,178));rect(plate,0,0,56,10,2,'face top');
text(plate,28,7.1,'VORLEN','label brand center');screw(plate,3,5);screw(plate,53,5);
const gauge=cylinder(61,108.4,148,21.5,5.5,'y','chrome').face;
for(let i=0;i<40;i++){const a=i*Math.PI/20;line(gauge,20*Math.cos(a),20*Math.sin(a),21.1*Math.cos(a),21.1*Math.sin(a),'knurl');}
circle(gauge,0,0,19.2,'face recess');circle(gauge,0,0,17.8,'accent gauge-halo').setAttribute('filter','url(#bloom)');
circle(gauge,0,0,17.6,'face glass');
el('path',{d:arc(15.3,8,10),class:'zone ok'},gauge);el('path',{d:arc(15.3,10.5,12),class:'zone hot'},gauge);
for(let i=0;i<=24;i++){
const b=i/2,a=(-125+b*250/12)*Math.PI/180,r=i%6===0?13:i%2===0?14.3:15.1;
line(gauge,Math.sin(a)*r,-Math.cos(a)*r,Math.sin(a)*16.4,-Math.cos(a)*16.4,'detail tick');
if(i%6===0)text(gauge,Math.sin(a)*10.6,-Math.cos(a)*10.6+1,b,'label micro center');
}
text(gauge,0,8.4,'BAR','etch micro center');
const needle=group('rotate(-125)',gauge);line(needle,0,3.6,0,-14.4,'needle');circle(gauge,0,0,2,'face top chrome');
el('path',{d:'M-12,-9 Q-4,-16.5 5,-14',class:'glare'},gauge);
text(group(FRONT(61,109,121.5)),0,0,'BREW PRESSURE','etch center');
const panelS=group(FRONT(128,109,170));rect(panelS,0,0,62,34,5,'face recess');screw(panelS,4,4);screw(panelS,58,4);line(panelS,31,8,31,26);
function shotButton(x,id,double){
cylinder(x,109,156,10.6,2.4,'y','base');
const g=group(FRONT(x,111.4,156),root,{id,class:'control',role:'button',tabindex:'0','aria-label':double?'Double espresso (2)':'Single espresso (1)','aria-disabled':'true'});
circle(g,0,0,13.4,'focus-ring');circle(g,0,0,12.2,'ring');const press=group('translate(0 0)',g,{class:'press'});
circle(press,0,0,10.5,'face top button-face');circle(press,0,0,8.2,'detail');
const icon=(cx)=>{el('path',{d:`M${cx-3},-3 v5 q3,2 6,0 v-5 M${cx-3.5},3 h7 M${cx+3},-2 q3,-1 2,2 l-2,1`,class:'detail button-icon'},press);};
if(double){icon(-3.5);icon(3.5);}else icon(0);
circle(press,0,6.2,1,'indicator');text(g,0,17.4,double?'DOUBLE':'SINGLE','etch center micro');return g;
}
const single=shotButton(143,'single',false),double=shotButton(171,'double',true);
const display=group(FRONT(146,110,130));rect(display,0,0,44,15,3,'face recess');rect(display,2,2,40,11,2,'face glass');
rect(display,5,4,34,7,1,'accent gauge-halo').setAttribute('filter','url(#bloom)');
const timer=text(display,22,11,'00','lit screen-text');text(display,22,19.6,'EXTRACTION / SEC','etch micro center');
const powerControl=group(FRONT(37,110,106),root,{id:'powerControl',class:'control',role:'button',tabindex:'0','aria-label':'Toggle power (O)','aria-pressed':'false'});
rect(powerControl,-3,-3,20,29,4,'focus-ring');rect(powerControl,0,0,14,23,3,'face recess button-face');
const rocker=rect(powerControl,2,2,10,12,2,'face rk');line(powerControl,7,5,7,8,'detail');circle(powerControl,7,18,1.6,'detail');
text(powerControl,7,29.6,'POWER','etch center micro');
const lamps=group(FRONT(58,109.6,96));
for(const u of[0,10]){circle(lamps,u,0,2.6,'face recess');}
circle(lamps,0,0,4.2,'accent led-halo').setAttribute('filter','url(#soft)');const onLamp=circle(lamps,0,0,1.5,'lamp'),readyLamp=circle(lamps,10,0,1.5,'lamp');
text(lamps,0,7,'ON','etch micro center');text(lamps,10,7,'READY','etch micro center');
const vents=group(FRONT(77,108.2,49));slits(vents,0,0,94,5,21);
// Drip tray, cup light, group: spouts, block, portafilter, head, neck, lever.
box(32,108,27,164,62,8,6,'base');
const grille=group(TOP(40,114,35.2));rect(grille,0,0,148,48,5,'face top chrome');rect(grille,4,4,140,40,3,'face recess');
slits(grille,8,7,132,34,24);for(let y=14;y<40;y+=9)line(grille,8,y,139,y);
screw(grille,2.6,24);screw(grille,145.4,24);
const lip=group(FRONT(32,170,35));rect(lip,8,2,148,2.6,1.3,'face chrome');
const beam=el('g',{class:'beam'}),pc=P(110,148,35.3),tl=P(91,134,128),tr=P(129,134,128);
el('path',{d:`M${f2(tl[0])},${f2(tl[1])}L${f2(tr[0])},${f2(tr[1])}L${f2(pc[0]+32)},${f2(pc[1])}L${f2(pc[0]-32)},${f2(pc[1])}Z`,fill:'url(#cone)',filter:'url(#soft)'},beam);
el('ellipse',{cx:pc[0],cy:pc[1],rx:36,ry:21,fill:'url(#pool)'},beam);
for(const x of[104,116]){cylinder(x,141,95,1.7,6,'z','chrome');wire([[x,141,94],[x,141,86],[x+(110-x)*.35,143,76]],'flow');}
box(101,135,101,18,10,6,2,'chrome');
cylinder(110,128,107,21.5,9,'z','chrome');frontArc(110,128,111.5,21.55);
box(130,124,108.4,5,8,5.2,1.4,'chrome');
cylinder(110,124,116,21,12,'z','chrome');frontArc(110,124,121.6,21.05);
box(84,104,128,52,30,20,5,'chrome');
const nf=group(FRONT(84,134,148));screw(nf,6,8.5);screw(nf,46,8.5);text(nf,26,10,'58 MM','etch micro center');
for(const u of[7,35])rect(nf,u,17.4,10,1.5,.75,'cuplamp');
for(const x of[102,114])box(x,117,148,4,8,4.6,1,'chrome');
cylinder(101,121,152,3,18,'x','chrome');
const lever=el('g',{});
function drawLever(t){
lever.textContent='';
const a=(-16+78*t)*Math.PI/180,pv=[110,121,152],end=[110,pv[1]+30*Math.cos(a),pv[2]+30*Math.sin(a)];
wire([pv,end],'lever-under',lever);wire([pv,end],'lever',lever);sphere(end,4.6,'url(#knob)',lever);
const h=P(...pv);el('circle',{cx:h[0],cy:h[1],r:2.4,class:'face top chrome'},lever);
}
// Cup on its saucer (a button: serve it), then the portafilter handle and the steam plume.
let crema;
const cupG=into(el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Serve the cup (C)'}),()=>{
ellipse(110,146,35.3,28.5,'z','focus-ring');
cylinder(110,146,35,23,2.4,'z','cup');ellipse(110,146,37.4,16,'z','detail');
cylinder(110,146,37.4,14,3,'z','cup');cylinder(110,146,40.4,20,35.6,'z','cup');
ellipse(110,146,76,20,'z','face top cup');ellipse(110,146,76.2,18.4,'z','face recess');
const cupTop=group(TOP(110,146,76.5));const clip=el('g',{'clip-path':'url(#cupClip)'},cupTop);
crema=group('translate(0 0)',clip);circle(crema,0,0,18.3,'coffee');circle(crema,0,0,16.7,'crema');
el('path',{d:'M-11,7 Q-5,12 1,8 T11,5 M-6,1 Q-2,-3 5,0',class:'detail',opacity:'.45'},crema);
for(const[x,y,r]of[[-9,4,.7],[5,8,.55],[10,-2,.7],[-3,-7,.4],[3,3,.4]])circle(crema,x,y,r,'coffee');
ellipse(110,146,76.5,19.2,'z','detail');
const ch=group(FRONT(129.6,146,58));for(const c of['ceramic-under','ceramic'])el('path',{d:'M0,-10 C21,-15 21,14 0,10',class:c},ch);
text(group(FRONT(109,166.1,60)),0,0,'V','label center');
});
const hp=[[110,148.6,111.5],[110.4,157.6,110.3],[111,206,103]];
wire(hp.slice(0,2),'ferrule-under');wire(hp.slice(0,2),'ferrule');wire(hp.slice(1),'handle-under');wire(hp.slice(1),'handle');
const handleEnd=group(FRONT(111,206.2,103));circle(handleEnd,0,0,3.6,'face rubber');circle(handleEnd,0,0,1.5,'detail');
const steam=el('g',{class:'steam'}),tip=P(243,109,57);
for(let i=0;i<6;i++)el('circle',{cx:tip[0]+(i%3-1)*2.8,cy:tip[1]-i*1.8,r:2.4+i*.45,class:'puff',style:`animation-delay:${-i*.28}s`},steam);
const BUB=[...Array(7)].map((_,i)=>({n:circle(bubbles,46+(i*37)%26,104,.55+(i%3)*.35,'bubble'),y:104-i*9.5,s:6+(i%4)*2.4}));
frame([[12,10,0,204,160,27],[20,16,27,184,92,179],[53,37,192,60,38,22],[204,26,0,63,22,42],[204,88,56,42,26,100],[87,123,35,46,46,42],[108,148,100,6,62,14]],22);
// Shared machine state; Web Audio is created only by a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
let on=false,steaming=false,bar=0,level=.86,cupFill=.1,warmAt=-1,brew=null,seconds=0,lastUI=-1,lev=0,levV=0,levDrawn=-1,serve=null,fill=null,note='',noteT=0,last=performance.now();
let audio,osc,gain;
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function audioGesture(){
try{
const Audio=window.AudioContext||window.webkitAudioContext;
if(!Audio)return;
if(!audio){
audio=new Audio();osc=audio.createOscillator();gain=audio.createGain();
const filter=audio.createBiquadFilter();filter.type='lowpass';filter.frequency.value=140;
osc.type='triangle';osc.frequency.value=55;gain.gain.value=0;
osc.connect(filter);filter.connect(gain);gain.connect(audio.destination);osc.start();
}
if(audio.state==='suspended')audio.resume().catch(()=>{});
}catch(_){}
}
function sound(){if(gain){gain.gain.setTargetAtTime(on?(brew?.008:steaming?.004:0):0,audio.currentTime,.06);}}
function say(message){announcement.textContent=message;}
function flash(m){note=m;noteT=performance.now()+1600;lastUI=-1;}
function lamp(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
function waterDraw(){const y=98-level*62;set(water,'y',y);set(water,'height',106-y);set(waterLine,'y1',y);set(waterLine,'y2',y);}
function cupDraw(){const h=f2((1-cupFill)*30);set(crema,'transform',`translate(${h} ${h})`);}
function controls(){
svg.classList.toggle('powered',on);svg.classList.toggle('steaming',steaming);svg.classList.toggle('brewing',!!brew);
set(powerControl,'aria-pressed',on);set(steamControl,'aria-pressed',steaming);
const ok=on&&!brew&&!serve&&level>=.08&&cupFill<.9;
for(const b of[single,double]){set(b,'aria-disabled',!ok);b.classList.toggle('ready',ok);}
set(rocker,'y',on?9:2);set(knobWing,'transform',`rotate(${steaming?90:0})`);sound();note='';noteT=0;lastUI=-1;
}
function power(){
audioGesture();on=!on;
if(on){warmAt=performance.now();if(reduced.matches){bar=9.1;warmAt=-1;}say('Power on. Warming to nine bar.');}
else{warmAt=-1;bar=0;steaming=false;brew=null;single.classList.remove('active','pressed');double.classList.remove('active','pressed');say('Power off.');}
controls();
}
function shot(kind){
audioGesture();
if(!on){say('Turn power on with O before pulling a shot.');flash('POWER ON TO BREW');return;}
if(brew)return;
if(serve){flash('PLACING A FRESH CUP');return;}
if(level<.08){say('Reservoir low. Press R to refill.');flash('REFILL / R');return;}
if(cupFill>=.9){say('The cup is full. Press C to serve it.');flash('CUP FULL · C TO SERVE');return;}
const button=kind===1?single:double,start=performance.now(),target=clamp(cupFill+(kind===1?.46:.66));
brew={start,duration:kind===1?4000:4400,total:kind===1?27:30,from:cupFill,target,water:level,used:kind===1?.055:.085,button};
seconds=0;warmAt=-1;bar=9.1;button.classList.add('pressed','active');
if(reduced.matches){cupFill=target;cupDraw();level=clamp(brew.water-brew.used);waterDraw();}
say(kind===1?'Pulling a single espresso.':'Pulling a double espresso.');controls();
}
function steamToggle(){
audioGesture();if(!on){say('Turn power on with O before steaming.');flash('POWER ON TO STEAM');return;}
steaming=!steaming;controls();say(steaming?'Steam valve open.':'Steam valve closed.');
}
function refill(){
audioGesture();fill={from:level,t0:performance.now()};if(reduced.matches){level=1;fill=null;}
if(brew)brew.water=Math.max(brew.water,level);waterDraw();controls();say('Reservoir refilled.');flash('RESERVOIR FULL');
}
function serveCup(){
audioGesture();
if(brew){say('Wait for the shot to finish.');flash('WAIT FOR THE SHOT');return;}
if(serve)return;
serve={t0:performance.now(),swapped:false};say(cupFill>.15?'Cup served. A fresh cup is in place.':'Fresh cup in place.');
if(reduced.matches){cupFill=0;cupDraw();serve=null;}
controls();
}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(powerControl,power);bind(single,()=>shot(1));bind(double,()=>shot(2));bind(steamControl,steamToggle);bind(cupG,serveCup);
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;
const action={o:power,'1':()=>shot(1),'2':()=>shot(2),s:steamToggle,r:refill,c:serveCup}[e.key.toLowerCase()];
if(action){e.preventDefault();action();}
});
function tick(now){
const dt=Math.min(.05,Math.max(0,(now-last)/1000));last=now;
if(on&&warmAt>=0){
const p=clamp((now-warmAt)/2100);bar=reduced.matches?9.1:9.1*(1-Math.exp(-5*p)*Math.cos(4.5*p));
if(p>=1||reduced.matches){warmAt=-1;bar=9.1;say('Ready. Nine bar.');lastUI=-1;}
}
if(fill){const p=clamp((now-fill.t0)/900);level=fill.from+(1-fill.from)*(1-Math.pow(1-p,2));if(brew)brew.water=Math.max(brew.water,level);waterDraw();if(p>=1){fill=null;controls();}}
if(brew){
const p=clamp((now-brew.start)/brew.duration);seconds=Math.min(brew.total,Math.floor(p*brew.total));
if(!reduced.matches){cupFill=brew.from+(brew.target-brew.from)*(1-Math.pow(1-p,1.4));level=clamp(brew.water-brew.used*p);bar=9.1+.17*Math.sin(now*.024)+.08*Math.sin(now*.053);cupDraw();waterDraw();
const wl=98-level*62;for(const b of BUB){b.y-=dt*b.s*3;if(b.y<wl+1.6)b.y=105;set(b.n,'cy',f2(b.y));}}
if(now-brew.start>180)brew.button.classList.remove('pressed');
if(p>=1){brew.button.classList.remove('active','pressed');brew=null;bar=9.1;controls();say(`Espresso ready. ${seconds} seconds. Reservoir ${Math.round(level*100)} percent full.`);}
}else if(on&&warmAt<0)bar=steaming?8.8:9.1;
if(serve){
const p=(now-serve.t0)/1100;let k=p<.42?p/.42:p<.58?1:1-(p-.58)/.42;
if(p>=.5&&!serve.swapped){serve.swapped=true;cupFill=0;cupDraw();}
k=clamp(k);const e=k*k*(3-2*k);set(cupG,'transform',`translate(0 ${f2(-e*16)})`);cupG.style.opacity=f2(1-e);
if(p>=1){serve=null;cupG.removeAttribute('transform');cupG.style.opacity='';controls();}
}
const lt=brew?1:0;if(reduced.matches){lev=lt;levV=0;}else{levV+=(110*(lt-lev)-15*levV)*dt;lev+=levV*dt;}
if(Math.abs(lev-levDrawn)>.002){levDrawn=lev;drawLever(clamp(lev,-.08,1.08));}
svg.classList.toggle('warming',on&&warmAt>=0);
set(needle,'transform',`rotate(${f2(-125+clamp(bar,0,12)*250/12)})`);
if(lastUI<0||now-lastUI>=120){
if(noteT&&now>noteT){noteT=0;note='';}
lamp(onLamp,on?'b':'');lamp(readyLamp,!on?'':warmAt>=0?'a blink':'g');lamp(lowLamp,level<.08?'r blink':level<.22?'a':'');
timer.textContent=on?String(seconds).padStart(2,'0'):'--';readout.textContent=`${bar.toFixed(1)} bar · ${String(seconds).padStart(2,'0')} s`;
stateLabel.textContent=note||(!on?'STANDBY':serve?'SERVING · FRESH CUP':brew?'EXTRACTING':fill?'FILLING RESERVOIR':warmAt>=0?'WARMING':steaming?'STEAM OPEN':level<.08?'REFILL / R':cupFill>=.9?'CUP FULL · C TO SERVE':'READY TO BREW');lastUI=now;
}
requestAnimationFrame(tick);
}
waterDraw();cupDraw();controls();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], draw }
