// @ts-nocheck
/* AEREN F–04 · Weather station. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--base-top:#cbcbc7;--base-side:#a4a4a1;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--chrome:#d4d5d2;--chrome-top:#efefec;--chrome-side:#b6b7b4;--rubber:#333331;--cell:#2a3a52;--bus:#a9b8cc;--screen:#d5d9d3;--digit:#27302a;--seg-off:#c3c7c1}
@media(prefers-color-scheme:dark){:root:not([data-day]){color-scheme:dark;--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--base-top:#bebeba;--base-side:#737372;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--chrome:#b3b3b1;--chrome-top:#e0e0dd;--chrome-side:#80807f;--rubber:#292928;--cell:#222f44;--bus:#8e9bac;--screen:#0f0f0f;--digit:#8fa2ff;--seg-off:#1d1d1d;--line:#444443}:root:not([data-day]) svg{--ink:#282828;--muted:#6b6b6b}}
:root[data-night]{color-scheme:dark;--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--base-top:#bebeba;--base-side:#737372;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--chrome:#b3b3b1;--chrome-top:#e0e0dd;--chrome-side:#80807f;--rubber:#292928;--cell:#222f44;--bus:#8e9bac;--screen:#0f0f0f;--digit:#8fa2ff;--seg-off:#1d1d1d;--line:#444443}:root[data-night] svg{--ink:#282828;--muted:#6b6b6b}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.top.base{fill:var(--base-top)}.side.base{fill:var(--base-side)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.rubber{fill:var(--rubber)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.accent{fill:var(--accent);stroke:var(--accent)}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.6px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.08;filter:url(#soft)}.control{cursor:pointer;outline:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .button-face{fill:var(--top)}.hit{fill:transparent;stroke:none}.water{fill:var(--accent);fill-opacity:.4;stroke:var(--accent);stroke-width:.65}.transparent .glass{fill-opacity:.22}.rail-under{fill:none;stroke:var(--line);stroke-width:4;stroke-linejoin:round;stroke-linecap:round}.rail{fill:none;stroke:var(--chrome-top);stroke-width:2.7;stroke-linejoin:round;stroke-linecap:round}.cable-under{fill:none;stroke:var(--line);stroke-width:3.3;stroke-linecap:round;stroke-linejoin:round}.cable{fill:none;stroke:var(--rubber);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}.cell{fill:var(--cell);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.bus{fill:none;stroke:var(--bus);stroke-width:.45;vector-effect:non-scaling-stroke}.sheen{fill:#fff;opacity:.1;stroke:none}.night .sheen{opacity:.03}.screen{fill:var(--screen);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.segment{fill:var(--seg-off);stroke:none}.segment.on{fill:var(--digit)}.night .segment.on{filter:url(#glow)}.lcdt{fill:var(--digit);font:700 4px ui-monospace,monospace;letter-spacing:.3px;stroke:none}.lamp{fill:var(--off);stroke:none;transition:fill .2s}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.b{filter:url(#glow)}.live-led{animation:ping 3s steps(1,end) infinite}.halo{fill:var(--accent);opacity:0;filter:url(#bloom)}.night .halo{opacity:.16}.drop{fill:none;stroke:var(--accent);stroke-width:1.2;stroke-linecap:round;opacity:0}.raining .drop{animation:rain .8s linear infinite}.drain-flow{fill:none;stroke:var(--accent);stroke-width:1.7;stroke-dasharray:3 4;opacity:0}.draining .drain-flow{opacity:.7;animation:flow .6s linear infinite}.wind-set{display:flex;align-items:center;gap:12px;font-size:9px;letter-spacing:.1em;color:var(--muted);justify-self:end}.wind-set input{accent-color:var(--accent);width:125px;height:20px;cursor:pointer}.wind-set output{min-width:55px;color:var(--ink);font-variant-numeric:tabular-nums}.wind-set:focus-within{color:var(--ink)}
@keyframes ping{0%,90%{opacity:1}91%,100%{opacity:.3}}@keyframes rain{0%{opacity:0;transform:translateY(-24px)}20%,80%{opacity:.7}100%{opacity:0;transform:translateY(4px)}}@keyframes flow{to{stroke-dashoffset:-14}}
@media(prefers-reduced-motion:reduce){.raining .drop{opacity:.5}.live-led{opacity:1}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}:root[data-night] .stage-floor,:root[data-night] .stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}:root[data-night] .stage-pool{display:inline}:root[data-night] .stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}:root[data-night] .night .sheen{opacity:.1}:root[data-night] .on-glass .etch{fill:var(--stage-muted)}:root[data-night] .on-glass .detail{stroke:var(--stage-muted)}@media(prefers-color-scheme:dark){:root:not([data-day]) .stage-floor,:root:not([data-day]) .stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}:root:not([data-day]) .stage-pool{display:inline}:root:not([data-day]) .stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}:root:not([data-day]) .night .sheen{opacity:.1}:root:not([data-day]) .on-glass .etch{fill:var(--stage-muted)}:root:not([data-day]) .on-glass .detail{stroke:var(--stage-muted)}}`

const defs = ``

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* Part table — world x y z w d h. Painter's order: ground, rear panel,
   mast, outriggers, sensors, front instruments. Radii 2/3/5; round sensors.
Part                         x    y    z    w    d    h
feet (four)                 25   20    0   12   12    5  (x=25/151,y=20/122)
plinth                      20   15    5  150  128   13
mast flange                 82   46   18   34   34    8
solar arm                   69   22  218   30   41    7
solar hinges                62   17  219   16   16   10
sloping solar panel         26   -8  207   88   54   34
panel rim/cells             30   -4  211   80   46   29
solar cable                 74   42  166   25   29   61
mast                        92   56   26   14   14  281
mast collars                90   54   31   18   18    8  (z=31/164/184/267/302)
display mount               93   67  120   12   37   13
rain outrigger              28   59  181   74    8    8
rain bracket                24   63  181    8   35    8
vane outrigger              99   59  269   84    8    8
vane spindle               177   60  277    6    6   19
compass plate              160   43  286.5 40   40    1.5
vane (rotates about 180,63) 134   17  296   92   92   13
rotor spindle               95   59  307    8    8   25
rotor hub                   93   57  329   12   12    9
rotor arms/cups (rotate)     56   20  323   86   86   19
rain foot                   10   74  184   36   36    7
rain glass                  9    73  191   38   38   54
water                       12   76  192   32   32   48
rain funnel                 1    65  244   54   54   11
rain scale                  15  108  194   26    0   46
drain latch                 20  113  183   24    3   11
drain hose                  28  106   23   12   25  167
display housing             61   96   92   91   27   83
display face                66  123  100   81    0   69
screen                      71  124  117   71    0   45
wind dial                   81  128  109   16    5   16
day/night button           126  128  109   15    0   15
rain drops                  10   75  257   36   34   28
Seams, segment bars, screws, labels and seals share their parent face.
*/
// Isometric engine: affine face planes, solids, round parts, grille and fit.
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
function box(x,y,z,w,d,h,r=5,cls=''){
const g=el('g',{},root);
rect(group(SIDE(x+w,y+d,z+h),g),0,0,d,h,r,'face '+cls);
rect(group(FRONT(x,y+d,z+h),g),0,0,w,h,r,'face '+cls);
rect(group(TOP(x,y,z+h),g),0,0,w,d,r,'face top '+cls);return g;
}
// Family helpers: bevelled plates, knurls.
const f2=v=>(+v).toFixed(2);
function panel(g,x,y,w,h,b=2.2,cls=''){rect(g,x,y,w,h,1,'face '+cls);el('path',{d:`M${x},${y}H${x+w}L${x+w-b},${y+b}H${x+b}ZM${x},${y}L${x+b},${y+b}V${y+h-b}L${x},${y+h}Z`,class:'face top '+cls},g);el('path',{d:`M${x},${y+h}L${x+b},${y+h-b}H${x+w-b}L${x+w},${y+h}ZM${x+w},${y}V${y+h}L${x+w-b},${y+h-b}V${y+b}Z`,class:'face side '+cls},g);}
const control=(transform,id,label,parent=root)=>group(transform,parent,{id,class:'control',role:'button',tabindex:'0','aria-label':label});
// Assembly: base, mast and outriggers back to front; sensors; the console at the front.
const shadow=P(100,83,0);el('ellipse',{cx:shadow[0],cy:shadow[1]+5,rx:118,ry:45,class:'shadow stage-floor'});el('ellipse',{cx:shadow[0],cy:shadow[1]+5,rx:118,ry:45,class:'stage-contact'});
for(const[x,y]of[[25,20],[25,122],[151,20],[151,122]])box(x,y,0,12,12,5,2,'rubber');
box(20,15,5,150,128,13,5,'base');
const deck=group(TOP(20,15,18.15));
for(const p of[[8,8],[142,8],[8,120],[142,120]]){circle(deck,...p,3.4,'face recess');screw(deck,...p);}
rect(deck,12,88,32,26,3,'face recess');slits(deck,16,92,24,18,6);text(deck,105,110,'AEREN / F–04','etch center');
wire([[23,143,11.5],[167,143,11.5]]);wire([[170,19,11.5],[170,138,11.5]]);
box(82,46,18,34,34,8,3,'chrome');
const flange=group(TOP(82,46,26.2));for(const p of[[5,5],[29,5],[5,29],[29,29]]){circle(flange,...p,2.2,'face base');screw(flange,...p);}
// Solar panel on a hinged arm behind the mast; junction box and charge lamp.
wire([[99,63,219],[69,22,224]],'rail-under');wire([[99,63,219],[69,22,224]],'rail');
cylinder(67,22,223,8,16,'x','chrome');
const panelBack=240,panelSlope=30/54;
const panelPoint=(u,v,z=0)=>[26+u,-8+v,panelBack-v*panelSlope+z];
wire([panelPoint(0,0,-4),panelPoint(88,0,-4),panelPoint(88,54,-4),panelPoint(0,54,-4)],'face chrome');
wire([panelPoint(88,0,-4),panelPoint(88,54,-4),panelPoint(88,54),panelPoint(88,0)],'face side chrome');
wire([panelPoint(0,54,-4),panelPoint(88,54,-4),panelPoint(88,54),panelPoint(0,54)],'face chrome');
const panelOrigin=P(26,-8,240),solar=group(`matrix(${C} ${S} ${-C} ${S+panelSlope} ${panelOrigin.join(' ')})`);
rect(solar,0,0,88,54,3,'face top chrome');rect(solar,4,4,80,46,2,'face recess');
for(let y=0;y<3;y++)for(let x=0;x<5;x++){
rect(solar,6+x*15.3,6+y*14.2,14,13,1,'cell');
for(let k=1;k<4;k++)line(solar,6+x*15.3+k*3.5,7+y*14.2,6+x*15.3+k*3.5,18+y*14.2,'bus');line(solar,7+x*15.3,12.5+y*14.2,19+x*15.3,12.5+y*14.2,'bus');
}
el('path',{d:'M8,50 L30,4 H44 L22,50 Z M48,50 L70,4 H75 L53,50 Z',class:'sheen'},solar);
for(const p of[[2.5,2.5],[85.5,2.5],[2.5,51.5],[85.5,51.5]])screw(solar,...p);
const solarLED=circle(solar,81,51.5,1.2,'lamp');
const cablePts=[[74,42,215],[74,48,209],[91,67,203],[99,71,193],[99,71,166]];
wire(cablePts,'cable-under');wire(cablePts,'cable');
// Mast with collars and ties; the console arm.
cylinder(99,63,26,7,281,'z','chrome');
wire([[101,69,35],[101,69,300]],'detail');
for(const z of[31,164,184,267,302]){
cylinder(99,63,z,9,8,'z','base');
const band=group(FRONT(97,72,z+5));rect(band,-3,-2,10,5,1,'face base');screw(band,2,.5);
}
wire([[99,72,160],[103,75,165],[107,80,168],[107,99,168]],'cable-under');
wire([[99,72,160],[103,75,165],[107,80,168],[107,99,168]],'cable');
box(93,67,120,12,37,13,2,'chrome');
box(28,59,181,74,8,8,2,'chrome');box(24,63,181,8,35,8,2,'chrome');
// Radiation shield: louvered stack on its own arm, sensor hidden inside.
box(99,59,214,64,8,6,2,'chrome');wire([[162,63,214],[162,63,207]],'rail-under');wire([[162,63,214],[162,63,207]],'rail');
for(let i=0;i<7;i++){const z=164+i*6.2;cylinder(162,63,z,14.5-(i===6?0:1.5),2.2,'z',i===6?'':'');}
cylinder(162,63,207.4,16,2.6,'z','');text(group(SIDE(176.6,70,190)),0,0,'T/RH','etch micro');
box(99,59,269,84,8,8,2,'chrome');
const armFront=group(FRONT(99,67.2,277));line(armFront,8,4,74,4);screw(armFront,5,4);screw(armFront,79,4);
cylinder(180,63,277,3,19,'z','chrome');
cylinder(180,63,286.5,20,1.5,'z','base');
const compass=group(TOP(180,63,288.1));circle(compass,0,0,19,'detail');
for(let i=0;i<8;i++){const a=i*Math.PI/4;line(compass,f2(Math.cos(a)*16),f2(Math.sin(a)*16),f2(Math.cos(a)*19),f2(Math.sin(a)*19));}
text(compass,0,-11,'N','etch center');
const vane=el('g'),vaneSide=el('path',{class:'face side'},vane),vaneTop=el('path',{class:'face top'},vane),vaneTail=el('path',{class:'face'},vane),vaneSeam=el('path',{class:'detail'},vane);
ellipse(180,63,297,4,'z','face top chrome');
cylinder(99,63,307,4,25,'z','chrome');
const windControl=control('', 'windControl','Increase wind; Shift-click to decrease (W / Shift W)');
const rotor=el('g',{},windControl),rotorParts=[];
for(let i=0;i<3;i++){
const g=el('g',{},rotor),under=el('path',{class:'rail-under'},g),arm=el('path',{class:'rail'},g),bowl=el('circle',{r:9.5,class:'face top'},g),rim=el('g',{},g);
circle(rim,0,0,8,'face recess');circle(rim,0,0,6.2,'detail');
rotorParts.push({g,under,arm,bowl,rim});
}
const hub=cylinder(99,63,329,6,9,'z','chrome');windControl.appendChild(hub.g);ellipse(99,63,338.2,3.6,'z','face top',windControl);
const rotorHit=P(99,63,332);el('ellipse',{cx:rotorHit[0],cy:rotorHit[1],rx:59,ry:32,class:'hit'},windControl);
el('ellipse',{cx:rotorHit[0],cy:rotorHit[1],rx:59,ry:32,class:'focus-ring'},windControl);
// Rain collector: water sits inside transparent walls, beneath an open funnel.
cylinder(28,92,184,18,7,'z','chrome');
const liquid=cylinder(28,92,192,16,.01,'z','water');
set(liquid.g,'class','water-volume');
const glass=cylinder(28,92,191,19,54,'z','glass');set(glass.g,'class','transparent');
for(const a of[-.4,1.1])wire([[28+18.5*Math.cos(a),92+18.5*Math.sin(a),196],[28+18.5*Math.cos(a),92+18.5*Math.sin(a),239]],'detail');
const scale=group(FRONT(15,108,240),root,{class:'on-glass'});
for(let i=0;i<=4;i++){line(scale,0,i*10,4,i*10);text(scale,7,i*10+1.5,String(20-i*5),'etch micro');}
text(scale,20,44,'MM','etch micro');
ellipse(28,92,244.5,20,'z','face top chrome');
const rainControl=control('', 'rainControl','Toggle rainfall (R)');
const funnelTop=P(28,92,255),funnelBottom=P(28,92,244),rx=27*Math.sqrt(1.5),ry=27/Math.sqrt(2),bx=19*Math.sqrt(1.5),by=19/Math.sqrt(2);
el('path',{d:`M${funnelTop[0]-rx},${funnelTop[1]} A${rx},${ry} 0 0 0 ${funnelTop[0]+rx},${funnelTop[1]} L${funnelBottom[0]+bx},${funnelBottom[1]} A${bx},${by} 0 0 1 ${funnelBottom[0]-bx},${funnelBottom[1]} Z`,class:'face chrome'},rainControl);
const funnel=group(TOP(28,92,255),rainControl);circle(funnel,0,0,27,'face top chrome');circle(funnel,0,0,24,'face recess');circle(funnel,0,0,21.5,'face glass');
circle(funnel,0,0,3.3,'face recess');
for(let i=0;i<8;i++){const a=i*Math.PI/4;line(funnel,f2(Math.cos(a)*5),f2(Math.sin(a)*5),f2(Math.cos(a)*20),f2(Math.sin(a)*20));}
circle(funnel,0,0,31,'focus-ring');circle(funnel,0,0,30,'hit');
const drainPts=[[28,106,189],[28,113,183],[32,123,169],[32,123,29],[40,130,23]];
wire(drainPts,'cable-under');wire(drainPts,'cable');wire(drainPts,'drain-flow');
for(const z of[45,145]){const clip=group(FRONT(30,124,z));rect(clip,0,0,4,5,1,'face chrome');screw(clip,2,2.5);}
const drainControl=control(FRONT(28,114,190),'drainControl','Empty rain collector (Shift R)');
rect(drainControl,-13,-8,29,21,4,'hit');circle(drainControl,0,0,4.5,'face recess');
const latch=group('rotate(-25)',drainControl);rect(latch,-2,-2,19,5,2,'face top chrome button-face');circle(latch,0,.5,2.1,'face base');screw(latch,0,.5);
rect(drainControl,-14,-9,30,23,4,'focus-ring');
// Console bolted to the mast: bevelled housing, hood, antenna, LCD, controls.
box(61,96,92,91,27,83,5);
box(64,96,175,85,30,3,2,'');
const housingSide=group(SIDE(152.2,119,167));slits(housingSide,0,0,20,5,5);line(housingSide,0,12,20,12);screw(housingSide,10,66);
cylinder(140,104,178,2.4,3,'z','chrome');wire([[140,104,181],[140,104,206]],'rail-under');wire([[140,104,181],[140,104,206]],'rail');const tip=P(140,104,207);el('circle',{cx:tip[0],cy:tip[1],r:1.8,class:'face top chrome'});
const front=group(FRONT(66,123.3,169));panel(front,0,0,81,69,2.2);
for(const p of[[4.4,4.4],[76.6,4.4],[4.4,64.6],[76.6,64.6]])screw(front,...p);
text(front,40.5,8,'AEREN','label brand center');
const display=group(FRONT(71,124,162));rect(display,0,0,71,45,3,'face recess');rect(display,2,2,67,41,2,'screen');rect(display,5,5,61,35,2,'halo');
text(display,5,8,'WIND','etch');text(display,5,27,'RAIN','etch');text(display,35,22,'KM/H','etch micro');text(display,35,41,'MM','etch micro');
const digitPaths=['M1,0 H6 L5,1.5 H2 Z','M6,1 L7,2 V6 L5.5,5 V2 Z','M5.5,8 L7,7 V12 L6,13 L5.5,12 Z','M2,12 H5 L6,13.5 H1 Z','M0,7 L1.5,8 V12 L1,13 L0,12 Z','M0,2 L1,1 L1.5,2 V5 L0,6 Z','M1,6 H6 L5,7.5 H2 Z'];
const digitMap={0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc',8:'abcdefg',9:'abcdfg'};
function seven(parent,x,y){
const g=group(`translate(${x} ${y})`,parent),digits=[];
for(let j=0;j<3;j++){const dg=group(`translate(${j*9+(j===2?3:0)} 0)`,g);digits.push(digitPaths.map(d=>el('path',{d,class:'segment'},dg)));}
circle(g,18.5,12.5,.9,'segment on');return digits;
}
const windDigits=seven(display,5,10),rainDigits=seven(display,5,29);
function number(digits,value){const s=value.toFixed(1).replace('.','').padStart(3,'0');digits.forEach((segments,i)=>segments.forEach((n,k)=>set(n,'class','segment'+(digitMap[s[i]].includes('abcdefg'[k])?' on':''))));}
const mini=group('translate(56 18)',display);circle(mini,0,0,7.4,'detail');line(mini,0,-8.4,0,-5.6);line(mini,-8.4,0,-5.6,0);line(mini,0,5.6,0,8.4);line(mini,5.6,0,8.4,0);
const directionArrow=el('path',{d:'M0,-6 L3,3 L0,1 L-3,3 Z',class:'accent'},mini);
text(display,56,7.6,'BEARING','etch micro center');const tempText=text(display,56,32.2,'18.4°C','lcdt center');
rect(display,51,35,11,5,1,'detail');rect(display,62,36,1,3,.2,'detail');const batt=[0,1,2].map(i=>rect(display,52+i*3,36,2,3,.3,'accent'));
const powerMark=text(display,56,43.6,'14 W','etch micro center');
const live=group(FRONT(108,125,108));circle(live,0,0,2.4,'face recess');circle(live,0,0,1.3,'lamp b live-led');text(live,0,6,'LINK','etch micro center');
const dial=cylinder(89,123,109,8,5,'y','chrome');
const dialControl=control(FRONT(89,128.3,109),'dialControl','Increase wind; Shift-click to decrease (W / Shift W)');
circle(dialControl,0,0,8,'face top chrome button-face');circle(dialControl,0,0,5.5,'detail');
for(let i=0;i<12;i++){const a=i*Math.PI/6;line(dialControl,f2(Math.cos(a)*6.7),f2(Math.sin(a)*6.7),f2(Math.cos(a)*7.6),f2(Math.sin(a)*7.6));}
const dialMark=line(dialControl,0,-3,0,-6,'detail');circle(dialControl,0,0,14,'hit');circle(dialControl,0,0,14,'focus-ring');text(dialControl,0,15,'WIND','etch micro center');
const dayControl=control(FRONT(134,128,109),'dayControl','Switch day and night (D)');
cylinder(134,123,109,7.5,5,'y','chrome');root.appendChild(dayControl);
circle(dayControl,0,0,7.5,'face recess button-face');
const sunIcon=el('g',{},dayControl);circle(sunIcon,0,0,2.1,'detail');
for(let i=0;i<8;i++){const a=i*Math.PI/4;line(sunIcon,f2(Math.cos(a)*3.4),f2(Math.sin(a)*3.4),f2(Math.cos(a)*4.7),f2(Math.sin(a)*4.7));}
const moonIcon=el('path',{d:'M2,-4 A4.5,4.5 0 1 0 3.8,3 A4,4 0 0 1 2,-4 Z',class:'accent'},dayControl);
circle(dayControl,0,0,14,'hit');circle(dayControl,0,0,14,'focus-ring');text(dayControl,0,15,'SOLAR','etch micro center');
const drops=el('g',{'aria-hidden':'true'});
for(let i=0;i<10;i++){
const a=i*2.4,p=P(28+Math.cos(a)*(9+i%3*5),92+Math.sin(a)*(8+i%4*3),259+i%3*2);
el('path',{d:`M${f2(p[0])},${f2(p[1])} l-1,4`,class:'drop',style:`animation-delay:${-i*.137}s`},drops);
}
frame([[20,15,0,150,128,26],[26,-8,207,88,54,34],[9,65,184,54,54,101],[55,19,323,88,88,19],[132,15,277,96,96,33],[61,96,92,91,32,83],[146,47,164,32,32,46]],20);
// Sensor state. Motion is suppressed when reduced motion is requested.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
let speed=8,rain=0,raining=false,night=matchMedia('(prefers-color-scheme: dark)').matches,angle=.5,bearing=45,bearingTarget=45,last=0,lastUI=0,drainAt=0,drainFrom=0,temp=night?11.2:18.4;
function lamp(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const say=s=>announcement.textContent=s;
const direction=d=>['N','NE','E','SE','S','SW','W','NW'][Math.round(d/45)%8];
function waterDraw(){
const h=Math.max(.01,rain/20*48),r=16,t=r/Math.sqrt(2),u=-h,v=-h;
set(liquid.g.firstChild,'d',`M${t},${-t} A${r},${r} 0 0 1 ${-t},${t} L${u-t},${v+t} A${r},${r} 0 0 1 ${u+t},${v-t} Z`);
set(liquid.face,'transform',TOP(28,92,192+h));set(liquid.g,'visibility',rain>.01?'visible':'hidden');
}
function rotorDraw(){
const items=rotorParts.map((p,i)=>{const a=angle+i*Math.PI*2/3,x=99+32*Math.cos(a),y=63+32*Math.sin(a),z=332,pos=P(x,y,z),tx=-Math.sin(a),ty=Math.cos(a),mouth=P(x+tx*3,y+ty*3,z);
set(p.under,'d',poly([[99,63,333],[x,y,332]]));set(p.arm,'d',p.under.getAttribute('d'));set(p.bowl,'cx',pos[0]);set(p.bowl,'cy',pos[1]);
set(p.rim,'transform',`matrix(${C*(Math.cos(a)-Math.sin(a))} ${S*(Math.cos(a)+Math.sin(a))} 0 1 ${mouth.join(' ')})`);
set(p.rim,'visibility',tx+ty>0?'visible':'hidden');return{g:p.g,depth:x+y};});
items.sort((a,b)=>a.depth-b.depth).forEach(p=>rotor.appendChild(p.g));
}
function vaneDraw(){
const a=(bearing-90)*Math.PI/180,point=(u,v,z)=>[180+u*Math.cos(a)-v*Math.sin(a),63+u*Math.sin(a)+v*Math.cos(a),z];
const outline=[[46,0],[32,-8],[32,-3],[-42,-3],[-42,3],[32,3],[32,8]];
set(vaneSide,'d',poly(outline.map(([u,v])=>point(u,v,294)),true));set(vaneTop,'d',poly(outline.map(([u,v])=>point(u,v,296)),true));
set(vaneTail,'d',poly([point(-42,0,296),point(-23,0,296),point(-23,0,307),point(-42,0,309)],true));
set(vaneSeam,'d',poly([point(-39,0,299),point(-26,0,299),point(-26,0,305)]));
set(directionArrow,'transform',`rotate(${bearing})`);
}
function update(){
svg.classList.toggle('night',night);svg.classList.toggle('raining',raining);svg.classList.toggle('draining',!!drainAt);
const doc=document.documentElement;doc.toggleAttribute('data-night',night);doc.toggleAttribute('data-day',!night);
set(dayControl,'aria-pressed',night);set(rainControl,'aria-pressed',raining);set(drainControl,'aria-pressed',!!drainAt);
set(sunIcon,'display',night?'none':'');set(moonIcon,'display',night?'':'none');powerMark.textContent=night?'00 W':'14 W';lamp(solarLED,night?'':'g');batt[2].style.opacity=night?'.2':'1';tempText.textContent=temp.toFixed(1)+'°C';
number(windDigits,speed);number(rainDigits,rain);set(dialMark,'transform',`rotate(${-130+speed/40*260})`);
readout.textContent=`${speed.toFixed(1)} km/h · ${rain.toFixed(1)} mm`;
stateLabel.textContent=`${night?'NIGHT · BATTERY':'DAY · SOLAR 14 W'} · ${drainAt?'DRAINING':raining?'RAINING':rain>=20?'GAUGE FULL':speed===0?'CALM':direction(bearingTarget)+' '+String(Math.round(bearingTarget)).padStart(3,'0')+'°'}`;
waterDraw();
}
function windChange(delta){speed=clamp(speed+delta,0,40);bearingTarget=(45+(speed-8)*6+360)%360;if(reduced.matches){bearing=bearingTarget;angle=speed/40*Math.PI*2;rotorDraw();vaneDraw();}update();say(`Wind ${speed} kilometres per hour, ${Math.round(bearingTarget)} degrees.`);}
function rainToggle(){
if(drainAt){say('Collector is draining.');return;}
if(rain>=20){say('Collector full. Use Shift R to drain.');raining=false;update();return;}
raining=!raining;if(raining)rain=Math.min(20,rain+.5);update();say(raining?'Rain started. Collector filling.':'Rain stopped.');
}
function drain(){raining=false;drainFrom=rain;drainAt=performance.now();set(latch,'transform','rotate(35)');if(reduced.matches)rain=0;update();say('Drain valve open. Emptying collector.');}
function day(){night=!night;update();say(night?'Night. Solar charging stopped; battery and display backlight on.':'Day. Solar charging at fourteen watts.');}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)fn(e);}});}
bind(windControl,e=>windChange(e.shiftKey?-2:2));bind(dialControl,e=>windChange(e.shiftKey?-2:2));bind(rainControl,rainToggle);bind(drainControl,drain);bind(dayControl,day);
/* The lab's wind slider lived in the page caption; the miniature takes the wind as a prop (km/h as a share of 40, through the handle's setProgress). */
window.figure={setProgress:p=>{if(p!=null)windChange(clamp(Math.round(p*20)*2,0,40)-speed);}};
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
const action={w:()=>windChange(e.shiftKey?-2:2),r:e.shiftKey?drain:rainToggle,d:day}[e.key.toLowerCase()];
if(action){e.preventDefault();action();}
});
function tick(now){
const dt=last?Math.min(.05,(now-last)/1000):0;last=now;
if(!reduced.matches){angle+=dt*speed*.14;rotorDraw();const diff=((bearingTarget-bearing+540)%360)-180;bearing=(bearing+diff*Math.min(1,dt*4)+360)%360;vaneDraw();}
if(drainAt){const p=clamp((now-drainAt)/1500);rain=reduced.matches?0:drainFrom*(1-p);waterDraw();if(p>=1){rain=0;drainAt=0;set(latch,'transform','rotate(-25)');update();say('Collector empty. Drain valve closed.');}}
else if(raining){rain=clamp(rain+dt*1.2,0,20);waterDraw();if(rain>=20){raining=false;update();say('Twenty millimetres collected. Gauge full.');}}
const tt=(night?11.2:18.4)-(raining||rain>0&&drainAt?2.2:0)-speed*.06;temp+=reduced.matches?tt-temp:(tt-temp)*Math.min(1,dt*.8);
if(now-lastUI>150){update();lastUI=now;}
requestAnimationFrame(tick);
}
reduced.addEventListener('change',()=>{bearing=bearingTarget;rotorDraw();vaneDraw();});
rotorDraw();vaneDraw();update();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], draw }
