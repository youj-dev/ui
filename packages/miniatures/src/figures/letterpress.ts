// @ts-nocheck
/* ARDEN & VOSS No. 5 · Letterpress. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--iron:#3a3a38;--iron-top:#4b4b48;--iron-side:#2d2d2b;--wood:#c39a6b;--wood-top:#d8b385;--wood-side:#a67c50;--paper:#fffef9;--rubber:#2c2c2b;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--glyph:#3a3a38;--gold:#caa24e;--gold-hi:#e6c57a;--inkc:#cf3b26;--sheen:.75}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--iron:#2f2f2e;--iron-top:#464643;--iron-side:#1d1d1c;--wood:#a48159;--wood-top:#caa77c;--wood-side:#745636;--paper:#d7d6d3;--rubber:#232323;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--glyph:#2f2f2e;--gold:#aa8840;--gold-hi:#c2a666;--inkc:#ae301e;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.side{fill:var(--side,var(--body))}.top{fill:var(--top)}.iron{fill:var(--iron)}.iron.side{fill:var(--iron-side)}.iron.top{fill:var(--iron-top)}.wood{fill:var(--wood)}.wood.side{fill:var(--wood-side)}.wood.top{fill:var(--wood-top)}.metal{fill:var(--metal)}.metal.side{fill:var(--metal-side)}.metal.top{fill:var(--metal-top)}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.paper{fill:var(--paper)}.rubber{fill:var(--rubber)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.accent{fill:var(--accent);stroke:var(--accent)}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:5.4px;letter-spacing:1.4px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.08;filter:url(#soft)}
.gold{fill:none;stroke:var(--gold);stroke-width:.55;stroke-linecap:round;stroke-linejoin:round}.goldfill{fill:var(--gold);stroke:none}.gtext{fill:var(--gold-hi);stroke:none}.bar-under{fill:none;stroke:var(--line);stroke-width:5.4;stroke-linecap:round;stroke-linejoin:round}.bar{fill:none;stroke:var(--iron-top);stroke-width:3.6;stroke-linecap:round;stroke-linejoin:round}.grain{fill:none;stroke:var(--wood-side);stroke-width:.5;vector-effect:non-scaling-stroke}
.display{font-family:Rockwell,"Rockwell Nova","Roboto Slab",Clarendon,Georgia,serif;font-weight:700;stroke:none;white-space:pre}.glyph{fill:var(--glyph);font-size:11px;text-anchor:middle;transition:fill .5s,fill-opacity .5s}.inked .glyph{fill:var(--inkc);fill-opacity:var(--io,1)}.sort{transition:transform .26s cubic-bezier(.2,.8,.2,1),opacity .2s}.sort.out{opacity:0}.caret{stroke:var(--accent);stroke-width:1.2;vector-effect:non-scaling-stroke;animation:blink 1s steps(1) infinite}.locked .caret{display:none}
.film{fill:url(#inkG);opacity:0;transition:opacity .5s}.rolled .film{opacity:1}.streak{fill:none;stroke:#fff;stroke-width:1.1;stroke-linecap:round;opacity:0;transition:opacity .5s}.rolled .streak{opacity:calc(var(--sheen)*.45)}.spec{fill:#fff;opacity:0;filter:url(#soft);transition:opacity .5s;pointer-events:none}.rolled .spec{opacity:calc(var(--sheen)*.6)}.shine{fill:none;stroke:#fff;stroke-width:1.2;vector-effect:non-scaling-stroke;stroke-linecap:round;opacity:0;transition:opacity .4s}.rolled .shine{opacity:.75}.rolled .shine2{opacity:.3}.rolled .rubber{fill:color-mix(in srgb,var(--inkc) 48%,var(--rubber))}.gl{opacity:0;transition:opacity .4s}.rolled .gl{opacity:1}.glint{fill:none;stroke:#fff;stroke-opacity:var(--sheen);stroke-width:1.4;vector-effect:non-scaling-stroke;stroke-linecap:round;animation:glint 4.5s ease-in-out infinite}
.print{fill:var(--inkc);filter:url(#inkTex)}.blind{fill:none;stroke:var(--line);stroke-width:.35;opacity:.45}.tympan{display:none}.fed .tympan{display:inline}.turn{transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.hitline{fill:none;stroke:transparent;stroke-width:14;pointer-events:stroke}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .button-face{fill:var(--top)}.key .button-face{transition:fill .15s}.key.hit-flash .button-face{fill:var(--accent);fill-opacity:.25}.lock-pip{fill:var(--muted);transition:fill .2s}.locked .lock-pip{fill:var(--accent)}
@keyframes blink{50%{opacity:0}}@keyframes glint{0%,100%{opacity:.15}50%{opacity:.8}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="inkG" cx=".42" cy=".38" r=".7"><stop offset="0" style="stop-color:var(--inkc);stop-opacity:.72"/><stop offset=".55" style="stop-color:var(--inkc);stop-opacity:.92"/><stop offset="1" style="stop-color:var(--inkc)"/></radialGradient>
<filter id="inkTex" x="-5%" y="-20%" width="110%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="2.2" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 -3.4 2.75" result="m"/><feComposite in="SourceGraphic" in2="m" operator="in"/></filter>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* World coordinates: x lower-right; y lower-left; z up. Units ≈ 3 mm.
Part x y z w d h
feed board + blank sheets 70 -52 54 72 58 6
feed brackets 80 -6 34 14 22 21
base plate 46 12 0 110 112 10
far cheek (cast iron) 50 16 10 74 10 192
bed 60 26 10 22 82 118
chase + furniture + quoins 82 32 40 2 68 68
type line (≤12 sorts, 4.8 set) 82 38 70 4 58 12
roller rails 82 26 40 4 82 146
disc bracket 66 58 128 14 16 30
ink disc 80 36 128 6 60 60
roller carriage (2 rollers + trucks) 86 26 150 12 82 32
top crossbeam 58 26 192 30 82 10
platen (hinged at x100 z26) 86 30 26 15 72 96
near cheek (cast iron) 50 108 10 74 10 192
bosses, platen crank, link 74 118 26 34 3 44
pull handle + grip 38 121 58 120 18 112
delivery tray + prints 4 128 0 80 58 11
type cabinet + composing stick 166 -52 0 114 70 46
open caps drawer (7 × 4) 168 18 28 112 56 12
Seams, screws, pins and labels share their parent face. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: draw into a group, free planes for the swinging platen, in-plane relief.
function into(g,fn){const n=root.childNodes.length;fn();while(root.childNodes.length>n)g.appendChild(root.childNodes[n]);return g;}
const proj=(x,y,z)=>[(x-y)*C,(x+y)*S-z];
const plane=(o,u,v)=>{const a=proj(...u),b=proj(...v);return`matrix(${a[0]} ${a[1]} ${b[0]} ${b[1]} ${P(...o).join(' ')})`;};
function lift(g,x,y,w,h,dx,dy,cls='face side',band=['face top','face'],r=1){
const X=dx>0?x:x+w,Y=dy>0?y:y+h;
el('path',{d:`M${x},${Y}h${w}l${dx},${dy}h${-w}Z`,class:band[0]},g);
el('path',{d:`M${X},${y}v${h}l${dx},${dy}v${-h}Z`,class:band[1]},g);
return rect(g,x+dx,y+dy,w,h,r,cls);
}
function extrude(g,d,k,mat){for(let i=k;i>=0;i--)el('path',{d,transform:`translate(${i} ${-i})`,class:i===k||i===0?`face ${i?'side ':''}${mat}`:`side ${mat}`},g);}
const R=Math.PI/180,SET=4.8,MAX=12;
const arc=(r,a,b)=>{const p=t=>[(r*Math.sin(t*R)).toFixed(2),(-r*Math.cos(t*R)).toFixed(2)];const[x0,y0]=p(a),[x1,y1]=p(b);return`M${x0},${y0}A${r},${r} 0 ${b-a>180?1:0} 1 ${x1},${y1}`;};
// Assembly, back to front: feed board, press, type cabinet, delivery tray.
const sh=(x,y,rx,ry)=>{const p=P(x,y,0);el('ellipse',{cx:p[0],cy:p[1]+3,rx,ry,class:'shadow stage-floor'});el('ellipse',{cx:p[0],cy:p[1]+3,rx,ry,class:'stage-contact'});};
sh(100,68,112,46);sh(224,6,104,44);sh(44,158,62,26);
for(const x of[80,94]){wire([[x,6,55],[x,16,55]],'bar-under');wire([[x,6,55],[x,16,55]],'bar');wire([[x,16,34],[x,-6,54]],'bar-under');wire([[x,16,34],[x,-6,54]],'bar');}
const feedCtl=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Feed a sheet (N)'});
let feedSheet;
into(feedCtl,()=>{
box(70,-52,54,72,58,3,2,'wood');
const feedPad=group(TOP(70,-52,57));line(feedPad,3,3,69,3,'grain');line(feedPad,3,55,69,55,'grain');
for(const[u,v]of[[2,47],[2,5]])rect(feedPad,u,v,2.4,6,.6,'face metal');
for(let i=0;i<3;i++)rect(group(TOP(74-i*.6,-48-i*.6,57.2+i*.6)),0,0,64,44,.6,'face paper');
feedSheet=group(TOP(72.2,-49.8,59.2));rect(feedSheet,0,0,64,44,.6,'face paper');
for(const x of[8,56])circle(feedSheet,x,2.4,.9,'face metal');
rect(feedPad,-3,-3,78,64,4,'focus-ring');
});
// Press: base plate, far cheek, bed and locked form.
const CHEEK='M46,-10H71C75,-23 101,-23 105,-10H128V-18C121,-23 112,-27 106,-35C98,-46 94,-59 94,-78V-190C94,-199 88,-204 80,-204H68C60,-204 54,-199 54,-190V-54C54,-37 50,-26 46,-22Z';
const PIN='M50,-13.5H68.5C73,-27 103,-27 107.5,-13.5H124.5V-16.5C118,-21 110,-25 103.5,-33C95,-45 90.5,-58 90.5,-78V-189C90.5,-196 86,-200.5 80,-200.5H68C62,-200.5 57.5,-196 57.5,-189V-54C57.5,-36 54,-26 50,-20.5Z';
const rosette=(g,u,v,r=2)=>{circle(g,u,v,r,'face iron top');circle(g,u,v,r*.45,'goldfill');};
box(46,12,0,110,112,10,5,'iron');
const basePlate=group(TOP(46,12,10));for(const[u,v]of[[104,6],[104,104],[6,109]])screw(basePlate,u,v);
line(basePlate,80,14,80,94);rect(basePlate,94,30,6,52,3,'face recess');rect(basePlate,3.5,3.5,103,105,4,'gold');
{const fa=group(FRONT(0,26,0));extrude(fa,CHEEK,10,'iron');el('path',{d:PIN,class:'gold'},fa);}
box(60,26,10,22,82,118,4,'iron');
const bf=group(SIDE(82,102,108)),steel=['face top metal','face metal'],woodB=['face top wood','face wood'];
for(const u of[-5,72.4])lift(bf,u,-78,3.6,146,4,4,'face side metal',steel,1);
for(const u of[1,74])for(const v of[-60,-30,80])screw(bf,u,v);
rect(bf,6,4,60,60,1,'face recess');
lift(bf,38,40,28,24,2,2,'face side wood',woodB,1);lift(bf,6,40,32,24,2,2,'face side wood',woodB,1);
for(const[a,b,v]of[[10,38,49],[10,38,58],[42,66,52],[42,66,60]])line(bf,a,v,b,v,'grain');
lift(bf,6.6,38.2,58.8,1.2,2.6,2.6,'face side metal',steel,.3);
lift(bf,6.6,25.8,58.8,12,2.6,2.6,'face side metal',steel,.3);
for(let u=18.8;u<66;u+=9.6)line(bf,u,28.8,u,40);
const form=group('',bf);
lift(bf,6.6,24.4,58.8,1.2,2.6,2.6,'face side metal',steel,.3);
lift(bf,52.6,4,13.4,20,2,2,'face side metal',steel,1);line(bf,56,24.6,66.6,7.4);circle(bf,61.3,16,2.5,'face recess');
const keyG=el('g',{class:'turn'},bf);rect(keyG,-.7,-2.3,1.4,4.6,.5,'face metal');circle(bf,65.6,8.4,.9,'lock-pip');
lift(bf,30,4,22.6,20,2,2,'face side wood',woodB,1);lift(bf,6,4,24,20,2,2,'face side wood',woodB,1);
for(const[a,b,v]of[[10,30,12],[10,30,19],[34,52,14],[34,52,21]])line(bf,a,v,b,v,'grain');
el('path',{d:'M2,0h68l2,2h-68Z',class:'face top iron'},bf);el('path',{d:'M2,0v68l2,2v-68Z',class:'face iron'},bf);
el('path',{d:'M4,2h68v68h-68Z M8,6v60h60v-60Z','fill-rule':'evenodd',class:'face side iron'},bf);
text(bf,38,68.9,'5 × 8 CHASE','etch micro center');
const caret=line(bf,38.6,29.8,38.6,41.8,'caret');
// Ink disc on its bracket, crossbeam, roller carriage.
box(66,58,128,14,16,30,3,'iron');
const discCtl=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Ink the form (I)'});
let spin;
into(discCtl,()=>{
const df=cylinder(80,66,158,30,6,'x','iron').face;
circle(df,0,0,30,'face metal');circle(df,0,0,28.4,'detail');
spin=group('rotate(0)',df);circle(spin,0,0,27,'film');circle(spin,0,0,21,'detail');circle(spin,0,0,11,'detail');
for(const[r,a,b]of[[24,-40,70],[18,130,235],[14,15,95],[24,170,250]])el('path',{d:arc(r,a,b),class:'streak'},spin);
line(spin,0,-27,0,-30);for(let i=0;i<3;i++)screw(spin,6*Math.sin(i*2.094),-6*Math.cos(i*2.094));
el('ellipse',{cx:-8,cy:-11,rx:11,ry:4.5,transform:'rotate(-38 -8 -11)',class:'spec'},df);el('path',{d:arc(18.5,-62,-14),class:'streak',style:'stroke-width:.8'},df);
circle(df,0,0,3,'face top metal');circle(df,0,0,1.1,'detail');
el('path',{d:arc(25.5,-160,-118),class:'glint'},group('',df,{class:'gl'}));
circle(df,0,0,33,'focus-ring');
});
box(58,26,192,30,82,10,4,'iron');
const beam=group(TOP(58,26,202));rect(beam,3,3,24,76,2,'gold');line(beam,4,41,26,41);for(const v of[10,72])circle(beam,15,v,1.6,'face recess');
const carriage=el('g',{}),notch=[];
into(carriage,()=>{
for(const z of[160,174]){
cylinder(92,26,z,6.2,2.6,'y','metal');cylinder(92,28.6,z,5.4,74.8,'y','rubber');
wire([[95.8,31,z+3.8],[95.8,101,z+3.8]],'shine');wire([[93.4,31,z+5.2],[93.4,101,z+5.2]],'shine shine2');
const t=cylinder(92,103.4,z,6.2,2.6,'y','metal').face;circle(t,0,0,2.2,'face base');notch.push(line(t,0,-2.6,0,-5.4));
}
box(86,106,150,12,2,32,3,'iron');
const cp=group(FRONT(86,108,182));for(const v of[8,22])circle(cp,6,v,2.3,'face metal');line(cp,6,10.3,6,19.7);
});
// Platen: back, end and top faces on a free plane hinged at x100 z26.
const platenBack=el('g',{}),platenEnd=el('g',{}),platenTop=el('g',{});
rect(platenBack,0,0,72,88,4,'face side iron');rect(platenBack,5,5,62,78,3,'detail');
line(platenBack,9,9,63,79);line(platenBack,63,9,9,79);circle(platenBack,36,44,7,'face side iron');circle(platenBack,36,44,2.6,'detail');
for(const[u,v]of[[9,9],[63,9],[9,79],[63,79]])screw(platenBack,u,v);
rect(platenEnd,-5,-12,9,14,3,'face iron');rect(platenEnd,-13.4,-96,14.4,88,3,'face iron');line(platenEnd,-10.4,-92,-10.4,-12);
circle(platenEnd,0,0,3.4,'face metal');circle(platenEnd,0,0,1.2,'detail');rect(platenEnd,-14.8,-90,1.4,76,.4,'face paper tympan');
rect(platenTop,0,0,72,14.4,2,'face top iron');for(const u of[5,62])rect(platenTop,u,1,5,12.4,1,'face metal');
rect(platenTop,3,13,66,1.8,.3,'face paper tympan');
function platen(th){
const s=Math.sin(th*R),c=Math.cos(th*R),o=[100+96*s+c,102,26+96*c-s];
set(platenBack,'transform',plane(o,[0,-1,0],[-s,0,-c]));
set(platenEnd,'transform',FRONT(100,102,26)+` rotate(${th})`);
set(platenTop,'transform',plane(o,[0,-1,0],[-c,0,s]));
}
// Near cheek, bosses, brand, then the linkage and pull handle outside it.
const fc=group(FRONT(0,118,0));extrude(fc,CHEEK,10,'iron');el('path',{d:PIN,class:'gold'},fc);
el('path',{d:'M63,-76V-186Q63,-190 67,-190H81Q85,-190 85,-186V-76Q85,-66 74,-66Q63,-66 63,-76Z',class:'gold',style:'stroke-width:.9'},fc);el('path',{d:'M65,-78V-184.5Q65,-188 68,-188H80Q83,-188 83,-184.5V-78Q83,-69.5 74,-69.5Q65,-69.5 65,-78Z',class:'gold'},fc);
set(text(fc,77,-128,'ARDEN & VOSS','label brand center gtext'),'transform','rotate(-90 77 -128)');for(const v of[-80,-176])rosette(fc,74,v,1.6);for(const[u,v]of[[52,-15],[121,-14]])rosette(fc,u,v);
rect(fc,65,-186,18,8,1.5,'face metal');text(fc,74,-180.6,'No 5','label center');
for(const x of[66,82])screw(fc,x,-197);
for(const[x,z,r]of[[100,26,7.5],[74,58,8.5]]){const b=cylinder(x,118,z,r,2,'y','iron').face;circle(b,0,0,r-1.8,'gold');for(let i=0;i<8;i++){const a=i*Math.PI/4;circle(b,(r-1.8)*Math.cos(a),(r-1.8)*Math.sin(a),.45,'goldfill');}}
const mech=group(FRONT(0,121,0));
const crank=group('',mech);
el('path',{d:'M0,0L-15.76,-2.78',class:'bar-under'},crank);el('path',{d:'M0,0L-15.76,-2.78',class:'bar'},crank);circle(crank,0,0,4.4,'face iron');circle(crank,0,0,1.5,'detail');
const rodU=el('path',{class:'bar-under'},mech),rodB=el('path',{class:'bar'},mech),pinQ=circle(mech,0,0,2.1,'face metal');
const handle=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Pull the press (P)'});
const lever=group('',group(FRONT(0,121,0),handle));
el('line',{x1:0,y1:0,x2:0,y2:-118,class:'hitline'},lever);
el('path',{d:'M0,-6V-110',class:'bar-under',style:'stroke-width:7.4'},lever);el('path',{d:'M0,-6V-110',class:'bar',style:'stroke-width:5.4'},lever);
line(lever,-1.2,-20,-1.2,-104);circle(lever,0,0,8,'face iron');circle(lever,0,0,4.6,'detail');circle(lever,0,0,1.6,'face metal');circle(lever,2.08,-11.82,2.1,'face metal');
const grip=into(el('g',{},handle),()=>{const g=cylinder(74,121,58,5.2,18,'y','wood');circle(g.face,0,0,2.2,'face metal');circle(g.face,0,0,9.5,'focus-ring');});
function linkage(th,ph){
const H=[74+12*Math.sin((ph+10)*R),-58-12*Math.cos((ph+10)*R)],Q=[100+16*Math.sin((th-80)*R),-26-16*Math.cos((th-80)*R)];
const d=`M${H[0].toFixed(2)},${H[1].toFixed(2)}L${Q[0].toFixed(2)},${Q[1].toFixed(2)}`;set(rodU,'d',d);set(rodB,'d',d);set(pinQ,'cx',Q[0]);set(pinQ,'cy',Q[1]);
set(crank,'transform',`translate(100 -26) rotate(${th})`);set(lever,'transform',`translate(74 -58) rotate(${ph})`);
const t=proj(112*Math.sin(ph*R),0,112*Math.cos(ph*R));set(grip,'transform',`translate(${t[0].toFixed(2)} ${t[1].toFixed(2)})`);platen(th);
}
// Type cabinet with the open caps drawer.
for(const[x,y]of[[170,-48],[266,-48],[170,8],[266,8]])box(x,y,0,10,8,4,2,'base');
box(166,-52,4,114,70,40,4,'wood');
const cabTop=group(TOP(166,-52,44));for(const[v,w]of[[8,0],[20,1.2],[33,-1],[47,.8],[62,0]])el('path',{d:`M6,${v}C40,${v+w} 70,${v-w} 108,${v+w*.5}`,class:'grain'},cabTop);
box(190,-42,44,58,8,1.2,.6,'metal');box(190,-42,45.2,58,1.6,3.4,.4,'metal');box(236,-40.4,45.2,3,6.4,3.8,.5,'metal');for(let i=0;i<6;i++)box(192+i*2.9,-40.2,45.2,2.6,4.6,2.6,.3,'metal');
const cabSide=group(SIDE(280,18,44));rect(cabSide,22,10,26,8,1,'face metal');rect(cabSide,24,11.5,22,5,.5,'face paper');text(cabSide,35,15.3,'TITLING','etch micro center');
const cf=group(FRONT(166,18,44));rect(cf,3,2.5,108,14,1.5,'face recess');
for(const v of[18,29]){rect(cf,4,v,106,10,1.5,'detail');rect(cf,49,v+2.2,16,5,1,'face metal');line(cf,52,v+4.7,62,v+4.7);}
box(168,18,28,112,56,12,2,'wood');
const dfront=group(FRONT(168,74,40));rect(dfront,42,2.4,28,6.4,1,'face metal');rect(dfront,44,3.6,24,4,.5,'face paper');text(dfront,56,6.6,'CAPS · 36 PT','etch micro center');
el('path',{d:'M50,9.6 Q56,13.4 62,9.6',class:'bar-under'},dfront);el('path',{d:'M50,9.6 Q56,13.4 62,9.6',class:'bar'},dfront);
const tray=group(TOP(168,18,40)),LAY='ABCDEFGHIJKLMNOPQRSTUVWXYZ& ',cw=108/7,ch=13.5,keys={};
rect(tray,2,0,108,54,1,'face recess');
for(let i=0;i<28;i++){
const c=i%7,r=i/7|0,x=2+c*cw,y=r*ch,L=LAY[i];
const g=el('g',{class:'control key',role:'button',tabindex:'-1','aria-label':L===' '?'Set a space':`Set ${L}`},tray);
rect(g,x+.6,y+.6,cw-1.2,ch-1.2,1,'face side wood');rect(g,x+2.6,y+2.6,cw-3.2,ch-3.2,.8,'face recess button-face');
if(L===' '){for(let j=0;j<3;j++)lift(g,x+4+j*3.4,y+5,2.6,5.6,-1,-1,'face top metal',['face metal','face side metal'],.4);}
else{lift(g,x+cw-10,y+ch-9.2,4.2,4.6,-1.2,-1.2,'face top metal',['face metal','face side metal'],.4);lift(g,x+4.6,y+4.6,6.6,6.6,-1.6,-1.6,'face top metal',['face metal','face side metal'],.6);
set(text(g,x+6.3,y+8.9,L,'display center'),'style','font-size:5.4px;fill:var(--glyph)');}
rect(g,x,y,cw,ch,0,'hit');rect(g,x+.4,y+.4,cw-.8,ch-.8,1.5,'focus-ring');keys[L]=g;
}
// Delivery tray, print stack and the travelling sheet.
box(4,128,0,80,58,5,3,'wood');box(4,128,5,80,3,4,1,'wood');
const trayTop=group(TOP(4,128,5));line(trayTop,4,54,76,54,'grain');
const stack=el('g',{}),outL=el('g',{});
frame([[70,-52,54,72,58,6],[46,12,0,110,112,202],[36,121,150,16,20,24],[145,121,128,14,20,20],[166,-52,0,114,126,44],[4,128,0,80,58,10]],12);

// State: compose → lock → ink → feed → pull → deliver.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
let chars=[],sorts=[],locked=true,ink=0,prints=0,fed=true,carrying=false,busy=null,anim=null,flashMsg='',flashUntil=0,spinA=0,stackN=0,audio=null;
const ease=t=>t<=0?0:t>=1?1:t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const JIT=[[0,0],[1.2,-.8],[-.8,.6],[.6,1],[-1,-.4],[.9,.3],[-.5,-.9],[.3,.8]],stackAt=k=>[12+JIT[k][0],135+JIT[k][1],5.2+.7*k];
function ac(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!audio)audio=new A();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch(_){}}
function tone(f,d,g,type){if(!audio)return;try{const o=audio.createOscillator(),v=audio.createGain(),t=audio.currentTime;o.type=type;o.frequency.setValueAtTime(f,t);v.gain.setValueAtTime(g,t);v.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(v);v.connect(audio.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
const click=()=>tone(1800,.03,.012,'triangle'),thunk=()=>{tone(90,.2,.05,'sine');tone(170,.07,.014,'triangle');};
function say(m){announcement.textContent=m;}
function flash(m){flashMsg=m;flashUntil=performance.now()+1600;ui();}
function ui(){
const w=ink>=.5?'INKED':ink>=.2?'INK LOW':'DRY';
readout.textContent=`SET ${chars.length} · ${w} · ${prints} PRINT${prints===1?'':'S'}`;
stateLabel.textContent=flashUntil?flashMsg:busy||(!locked?'COMPOSING · ⏎ LOCKS FORM':!fed?'NO SHEET · N TO FEED':ink<.2?'FORM LOCKED · I TO INK':'READY TO PULL');
svg.classList.toggle('locked',locked);svg.classList.toggle('inked',ink>=.2);svg.classList.toggle('rolled',ink>=.2||busy==='INKING');svg.classList.toggle('fed',fed||carrying);
svg.style.setProperty('--io',(.3+.7*Math.min(1,ink)).toFixed(2));keyG.style.transform=`translate(61.3px,16px) rotate(${locked?90:0}deg)`;
}
function makeSort(L){
const g=el('g',{class:'sort'},form),k=L===' '?2.6:4;
lift(g,0,0,SET,12,k,k,'face side metal',steel,.4);
if(L!==' ')set(text(g,0,0,L,'display glyph'),'transform',`translate(${SET/2+k} ${9.9+k}) scale(-.55 1)`);
return g;
}
function layout(){
const n=sorts.length;sorts.forEach((g,i)=>{g._u=35.2+(n/2-1-i)*SET;g.style.transform=`translate(${g._u}px,25.8px)`;});
const u=35.2-n/2*SET+3.4;set(caret,'x1',u);set(caret,'x2',u);
}
function addSort(L,instant){
if(chars.length>=MAX){flash('LINE FULL · 12 SORTS');return false;}
const g=makeSort(L);chars.push(L);sorts.push(g);
if(!instant){g.classList.add('out');g.style.transform=`translate(${35.2-chars.length/2*SET+6}px,31.8px)`;g.getBoundingClientRect();g.classList.remove('out');click();}
layout();return true;
}
function dropSort(g){g.classList.add('out');g.style.transform=`translate(${g._u+6}px,31.8px)`;setTimeout(()=>g.remove(),reduced.matches?0:300);}
function removeSort(){if(!chars.length){flash('LINE EMPTY');return;}chars.pop();dropSort(sorts.pop());layout();click();}
function setType(L){
if(busy==='PRESSING'||busy==='INKING'){flash('WAIT · PRESS IN MOTION');return;}
if(locked){locked=false;for(const g of sorts)dropSort(g);sorts=[];chars=[];}
if(addSort(L)){const k=keys[L];if(k){k.classList.add('hit-flash');setTimeout(()=>k.classList.remove('hit-flash'),220);}}
ui();
}
function lock(){if(!chars.join('').trim()){flash('SET TYPE FIRST');return false;}if(!locked){locked=true;say('Form locked. I inks, P pulls, N feeds a sheet.');ui();}return true;}
function inkUp(){
ac();if(busy||!lock())return;
if(reduced.matches){ink=1;spinTo(spinA+30);ui();say('Form inked.');return;}
busy='INKING';anim={kind:'ink',t0:performance.now(),a0:spinA};ui();
}
function pull(){
ac();if(busy||!lock())return;
if(reduced.matches){const rec=impress();if(rec){toStack(rec);carrying=false;}spinTo(spinA+30);ui();return;}
busy='PRESSING';anim={kind:'pull',t0:performance.now(),a0:spinA,hit:false,rec:null};ui();
}
function feed(){
ac();if(busy)return;if(fed||carrying){flash('SHEET ALREADY ON PLATEN');return;}
if(reduced.matches){fed=true;ui();say('Sheet on the platen.');return;}
busy='FEEDING';anim={kind:'feed',t0:performance.now()};ui();
}
function impress(){
thunk();
if(!fed){flash('NO SHEET · N TO FEED');say('No sheet on the platen.');return null;}
const rec={text:chars.join(''),ink};fed=false;carrying=true;prints++;ink*=.7;ui();
say(rec.ink<.2?'Blind impression. The form was dry.':`Print ${prints} pulled.`);return rec;
}
function printSheet(rec,g){
rect(g,0,0,64,44,.6,'face paper');
const s=[...rec.text],n=s.length,t=el('text',{y:27,transform:'scale(.55 1)','font-size':11,class:rec.ink>=.2?'display print center':'display blind center'},g);
set(t,'x',s.map((_,i)=>((32+(i-(n-1)/2)*SET)/.55).toFixed(2)).join(' '));t.textContent=rec.text;
if(rec.ink>=.2)t.style.fillOpacity=(.35+.65*Math.min(1,rec.ink)).toFixed(2);
line(g,26,36,38,36);text(g,32,40,`No ${prints}`,'etch micro center');
}
function toStack(rec){
if(stackN>=8){stack.firstChild.remove();[...stack.children].forEach((g,i)=>set(g,'transform',TOP(...stackAt(i))));}
printSheet(rec,group(TOP(...stackAt(Math.min(stackN,7))),stack));stackN++;
}
function spinTo(a){spinA=a;set(spin,'transform',`rotate(${a.toFixed(1)})`);}
const DA=[104,44,116],DB=[130,126,70];
function tick(now){
if(anim){
const t=now-anim.t0;
if(anim.kind==='ink'){
const p=Math.min(1,t/1500),dz=52*(1-Math.cos(2*Math.PI*p));
set(carriage,'transform',`translate(0 ${dz.toFixed(2)})`);for(const n of notch)set(n,'transform',`rotate(${(dz*10.6).toFixed(1)})`);
spinTo(anim.a0+30*ease(p));if(p>=.4&&ink<1){ink=1;ui();}
if(p>=1){anim=null;busy=null;set(carriage,'transform','');ui();say('Form inked.');}
}else if(anim.kind==='pull'){
const e=t<520?ease(t/520):t<680?1:t<1160?1-ease((t-680)/480):0;
linkage(34*(1-e),-16+60*e);spinTo(anim.a0+30*ease(t/1160));
if(t>=520&&!anim.hit){anim.hit=true;anim.rec=impress();}
if(t>=1160){
if(anim.rec){const c=stackAt(Math.min(stackN,7)),g=el('g',{},outL);printSheet(anim.rec,g);g.style.opacity=0;
anim={kind:'deliver',t0:now,rec:anim.rec,g,c,k:c.map((v,i)=>(4*DB[i]-DA[i]-v)/2)};busy='DELIVERING';ui();}
else{anim=null;busy=null;ui();}
}
}else if(anim.kind==='deliver'){
const p=Math.min(1,t/720),q=ease(p),pos=DA.map((a,i)=>(1-q)*(1-q)*a+2*q*(1-q)*anim.k[i]+q*q*anim.c[i]);
set(anim.g,'transform',TOP(...pos));anim.g.style.opacity=Math.min(1,p/.15);
if(p>=1){anim.g.remove();toStack(anim.rec);carrying=false;anim=null;busy=null;ui();}
}else if(anim.kind==='feed'){
const p=t/600;
if(p<1){set(feedSheet,'transform',TOP(72.2,-49.8+54*ease(p),59.2));feedSheet.style.opacity=1-p;}
else{if(!fed){fed=true;ui();say('Sheet on the platen.');}set(feedSheet,'transform',TOP(72.2,-49.8,59.2));feedSheet.style.opacity=Math.min(1,(t-600)/220);
if(t>=820){feedSheet.style.opacity=1;anim=null;busy=null;ui();}}
}
}
if(flashUntil&&now>flashUntil){flashUntil=0;ui();}
requestAnimationFrame(tick);
}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)fn();}});}
bind(handle,pull);bind(discCtl,inkUp);bind(feedCtl,feed);for(const L of LAY)bind(keys[L],()=>{ac();setType(L);});
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;
const k=e.key;
if(k==='Enter'){e.preventDefault();if(e.repeat)return;ac();if(locked)flash('FORM LOCKED · I INK · P PULL');else lock();return;}
if(k==='Backspace'){e.preventDefault();ac();if(busy==='PRESSING'||busy==='INKING')return;locked=false;removeSort();ui();return;}
if(k.length!==1)return;
const L=k.toUpperCase();
if(locked&&'IPN'.includes(L)){e.preventDefault();if(!e.repeat)({I:inkUp,P:pull,N:feed})[L]();return;}
if(L===' '){e.preventDefault();if(!locked&&!e.repeat){ac();setType(' ');}return;}
if(e.repeat||!/^[A-Z0-9&.,!?'-]$/.test(L))return;
e.preventDefault();ac();setType(L);
});
for(const L of'PRESS ON')addSort(L,true);
for(const k of[.95,.8,.66]){prints++;toStack({text:'PRESS ON',ink:k});}ink=.34;
linkage(34,-16);ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], draw }
