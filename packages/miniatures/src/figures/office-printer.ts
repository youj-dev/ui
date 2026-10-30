// @ts-nocheck
/* QUIRE MF–45 · Office printer. Drawn in the same form as the figures ported from the lab prototypes: its
 * stylesheet, defs and script, run on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--rubber:#2e2e2d;--rubber-top:#474745;--rubber-side:#282827;--tread:#7a7a75;--void:#4a4a48;--screen:#1c1d1e;--scr:#8ea0ff;--cab:#c4c4c0;--cab-top:#d8d8d4;--cab-side:#adada9;--in:#cfcfcb;--in-top:#dadad6;--in-side:#bcbcb8;--paper:#f3f2ec;--paper-top:#fdfdfa;--paper-side:#e2e1da;--print:#2c2c2c;--pad:#f2f2ef;--lever:#3a9c84;--lever-top:#56b39a;--lever-side:#2f8670;--bin:#454544;--bin-top:#6a6a67;--bin-in:#2b2b2a;--bed:#3e4347;--scan:#7fd3ff;--scan-core:#f2fbff;--tc:#36b2d4;--tm:#d4498c;--ty:#eec03c;--tk:#2e2e2d}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--rubber:#252524;--rubber-top:#424240;--rubber-side:#191919;--tread:#62625e;--void:#3d3d3c;--screen:#161717;--scr:#7f93ff;--cab:#a5a5a2;--cab-top:#cacac6;--cab-side:#797978;--in:#aeaeac;--in-top:#ccccc8;--in-side:#848483;--paper:#cdccc8;--paper-top:#ededea;--paper-side:#9f9f9c;--print:#232323;--pad:#e2e2e0;--lever:#2f836e;--lever-top:#50a790;--lever-side:#1e5d4d;--bin:#393938;--bin-top:#5e5e5b;--bin-in:#1f1f1e;--bed:#343739;--tc:#2e97b4;--tm:#b33e77;--ty:#c9a334;--tk:#252524;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.end{text-anchor:end}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}.side.rubber{fill:var(--rubber-side)}.void{fill:var(--void)}.screen{fill:var(--screen)}
.cab{fill:var(--cab)}.top.cab{fill:var(--cab-top)}.side.cab{fill:var(--cab-side)}.in{fill:var(--in)}.top.in{fill:var(--in-top)}.side.in{fill:var(--in-side)}.lever{fill:var(--lever)}.top.lever{fill:var(--lever-top)}.side.lever{fill:var(--lever-side)}
.ream{fill:var(--paper)}.top.ream{fill:var(--paper-top)}.side.ream{fill:var(--paper-side)}.sheets{fill:none;stroke:var(--paper-side);stroke-width:.4}
.bed{fill:var(--bed)}.pane{fill:var(--glass);fill-opacity:.3;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.refl{fill:none;stroke:#fff;stroke-width:1.4;stroke-linecap:round;opacity:.3}.pad{fill:var(--pad)}
.scanbar{fill:var(--scan-core);filter:url(#glow)}.scanhalo{fill:var(--scan);opacity:.6;filter:url(#bloom)}.leak{fill:var(--scan);opacity:0;filter:url(#bloom)}.padglow{fill:var(--scan);opacity:0;filter:url(#bloom)}
.page{fill:var(--paper-top);stroke:none}.pline{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;stroke-linejoin:round}.pedge{fill:var(--paper-side);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.ink{fill:var(--print)}.inka{fill:var(--accent);opacity:.8}.inkg{fill:#9a9a96}.inkd{fill:#5f5f5c}.inkw{fill:#e4e4e0}.inkl{fill:none;stroke:var(--print);stroke-width:.85;stroke-linecap:round;opacity:.45}.inkt{fill:none;stroke:#5f5f5c;stroke-width:.85;stroke-linecap:round;opacity:.5}
.tc{fill:var(--tc)}.tm{fill:var(--tm)}.ty{fill:var(--ty)}.tk{fill:var(--tk)}.stopk{fill:var(--fault)}
.tread{stroke:var(--tread);stroke-width:.8;stroke-linecap:round}.rib{fill:none;stroke:var(--line);stroke-width:.5;opacity:.3}.shade{fill:url(#tshade);stroke:none;pointer-events:none}
.bin{fill:var(--bin)}.binin{fill:var(--bin-in)}.binrim{fill:none;stroke:var(--bin-top);stroke-width:2.4;stroke-linecap:round}.binrib{fill:none;stroke:var(--bin-top);stroke-width:.7;opacity:.75}.crum{fill:var(--paper-top)}.fold{fill:none;stroke:var(--line);stroke-width:.45;opacity:.55;vector-effect:non-scaling-stroke}
.lamp{fill:var(--off);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.r,.lamp.b{filter:url(#glow);stroke:none}
.led{fill:var(--off)}.led.b{fill:var(--accent);filter:url(#glow)}.led.a{fill:var(--warn);filter:url(#glow)}.led.g{fill:var(--ok);filter:url(#glow)}.ledh{fill:var(--accent);opacity:0;filter:url(#bloom)}.ledh.a{fill:var(--warn)}.ledh.g{fill:var(--ok)}
.ring{fill:none;stroke:var(--off);stroke-width:1.1}.ring.on{stroke:var(--accent);filter:url(#glow)}.gauge{fill:var(--off)}.gauge.on{fill:var(--print)}
.scr{fill:var(--scr);font:2.8px ui-monospace,monospace;letter-spacing:.35px;stroke:none}.scr.big{font:600 6px ui-monospace,monospace;letter-spacing:.2px}.scr.t{font-size:2.1px}.scr.c{text-anchor:middle}.scr.e{text-anchor:end}.halo{fill:var(--accent);opacity:.14;filter:url(#bloom)}.tile{fill:none;stroke:var(--scr);stroke-width:.45;opacity:.55}.strk{stroke:var(--scr);stroke-width:.9;opacity:.25;stroke-linecap:round}.sbar{stroke:var(--scr);stroke-width:.9;stroke-linecap:round}
.warn .scr{fill:var(--warn)}.warn .sbar{stroke:var(--warn)}.ok .scr{fill:var(--ok)}.ok .sbar{stroke:var(--ok)}
.control{cursor:pointer;outline:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<linearGradient id="tshade" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".32"/><stop offset=".55" stop-color="#000" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* QUIRE MF–45, a floor-standing multifunction printer. World: x lower-right, y lower-left (its front faces +y), z up; 1 unit ≈ 4 mm.
Part                          x      y      z      w      d      h
casters (4)              12/138 14/146      0      –      –     12   wheels under swivel plates
drawer bank                   0      0     12    150    160     96   three openings in the front, rating label
drawers 1–3                   3    158  77/45/13 144      5     28   front plates; bodies 6–144 × 10–158, travel 72
reams                     38/22  98/76  +2.5   74/105  52/74   10   A4, A4, A3, on lift plates between guides
engine                        0      0    108    150    160     76   front door, toner chips, vents
side door                   150     58    112      3     88     66   hinged at y 58, swings 80°: guide, rollers, fuser
output tray                  22     22    184    128    138     52   floor, exit slot in the back wall, stopper
pages                        88     80   184.7    52     74    0.6   A4 face up, each job offset 8 in x
scanner                       0      0    236    150    160     28   bed, glass, light bar, original, LED strip
lid (document feeder)         2      4    264    146    148     16   hinged at y 4, lifts 50°: feeder hump, tray, pad
panel                         6    160    262     66     40      5   tilted 28°: screen, start, stop, LEDs
waste bin                   186    132      0   r 12–15.5    –     34
Seams, screws, slits, LEDs and print share their parent faces. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{P,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,box,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: vectors, turned planes, lamps, controls.
const draw=root,into=g=>(root=g),f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>t*t*(3-2*t),out3=t=>1-(1-t)**3,pad=(n,k)=>String(n).padStart(k,'0'),RAD=Math.PI/180;
const add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,s)=>a.map(v=>v*s),mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t),norm=a=>mul(a,1/(Math.hypot(...a)||1));
const plane=(o,U,V)=>`matrix(${P(...U).map(f2).join(' ')} ${P(...V).map(f2).join(' ')} ${P(...o).map(f2).join(' ')})`,pt=q=>P(...q).map(f2).join(','),tr=(x,y,z)=>`translate(${P(x,y,z).map(f2).join(' ')})`;
let seed=11;const rand=()=>(seed=(seed*9301+49297)%233280)/233280;
function lamp(g,x,y,r=1){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c,base='lamp'){if(n._c!==c){n._c=c;set(n,'class',base+(c?' '+c:''));}}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
const CRUM='M-5,-1.6L-3.4,-4.6L-.4,-3.6L1.6,-5.2L4.6,-3L5.2,.2L3.4,3.8L.4,5L-1.8,3.6L-4.6,4.2L-5.4,1Z',CF='M-3.4,-4.6L-1,.2L1.6,-5.2M-1,.2L3.4,3.8M-1,.2L-4.6,4.2M-1,.2L5.2,.2';
function ball(g){const r=el('g',{},g);el('path',{d:CRUM,class:'face crum'},r);el('path',{d:CF,class:'fold'},r);return r;}
// Floor shadow, casters.
const sp=P(80,86,0);el('ellipse',{cx:f2(sp[0]),cy:f2(sp[1]+5),rx:150,ry:74,class:'shadow stage-floor'});el('ellipse',{cx:f2(sp[0]),cy:f2(sp[1]+5),rx:150,ry:74,class:'stage-contact'});
const bs=P(186,132,0);el('ellipse',{cx:f2(bs[0]),cy:f2(bs[1]+2),rx:24,ry:13,class:'shadow'});
const caster=(x,y)=>{cylinder(x,y-2.5,3.4,3.4,5,'y','rubber');box(x-5,y-5,6.8,10,10,5.2,1.5,'metal');};
caster(12,14);caster(138,14);caster(12,146);caster(138,146);
// Drawer bank: side with label and vents; the front a frame around three openings, dark inside.
const cs=group(SIDE(150,160,108));rect(cs,0,0,160,96,3,'face side cab');slits(cs,116,10,36,16,9);rect(cs,114,60,38,19,1,'face top');
text(cs,117,65.6,'QUIRE PF–3','etch micro');text(cs,117,69.8,'PAPER FEED · A3/A4','etch micro');text(cs,117,74,'220–240 V ~','etch micro');for(const[u,v]of[[6,6],[154,6],[6,90],[154,90]])screw(cs,u,v);
for(let i=0;i<3;i++)rect(group(FRONT(4,159.8,104-32*i)),0,0,142,26,0,'face void');
el('path',{d:'M3,0H147Q150,0 150,3V93Q150,96 147,96H3Q0,96 0,93V3Q0,0 3,0Z'+[0,1,2].map(i=>`M4,${4+32*i}V${30+32*i}H146V${4+32*i}Z`).join(''),'fill-rule':'evenodd',class:'face cab',transform:FRONT(0,160,108)});
// Engine: front door with grip, wordmark and toner chips; vents behind the side door.
box(0,0,108,150,160,76,3);
const ef=group(FRONT(0,160.1,184));rect(ef,4,4,142,68,3,'detail');rect(ef,50,7.5,50,4.4,2.2,'face recess');line(ef,52,8,98,8);
text(ef,10,19,'MF–45','label');text(ef,10.4,24.6,'PRINT · COPY · SCAN','etch micro');
['tc','tm','ty','tk'].forEach((c,i)=>rect(ef,113+i*7,17,5,2.8,1,'face '+c));text(ef,113,23.6,'TONER','etch micro');
const es=group(SIDE(150,160,184));slits(es,108,12,44,46,13);rect(es,12,4,92,70,3,'detail');
// Behind the side door: the paper path. Guide, registration rollers, fuser with its lever; the jammed sheet.
rect(group(SIDE(141,146,178)),0,0,88,66,0,'face void');rect(group(FRONT(141,58,178)),0,0,9,66,0,'face in');rect(group(TOP(141,58,112)),0,0,9,88,0,'face top in');
const rg=group(SIDE(143.5,140,174));rect(rg,0,0,76,58,1.5,'face side in');for(let u=8;u<72;u+=8)line(rg,u,4,u,54,'rib');
for(const z of[123,141])cylinder(146,68,z,2.6,70,'y','rubber');
box(141,66,156,8,72,14,2,'metal');box(146.5,94,163,4,16,5,1.4,'lever');text(group(SIDE(149.1,136,168)),2,4,'HOT · 180°C','etch micro');
const recess=el('g',{}),jamG=ball(recess);jamG.style.display='none';const JAMAT=P(147,100,150),JAMPOSE=`translate(${f2(JAMAT[0])} ${f2(JAMAT[1])}) rotate(15) scale(2.2)`;
// Output tray: floor, left wall, back wall with the exit slot and its rollers; the stack; the stopper; shade under the scanner.
const fl=group(TOP(22,22,184.06));rect(fl,0,0,128,138,1,'face top in');for(const u of[34,60,86,112])line(fl,u,40,u,128,'rib');rect(fl,50,129,30,5.4,2.7,'face recess');
box(0,0,184,22,160,52,2,'');rect(group(SIDE(22,160,236)),0,0,138,52,0,'face side in');rect(group(SIDE(150,22,236)),0,0,22,52,0,'face side');
const bw=group(FRONT(22,22,236));rect(bw,0,0,128,52,0,'face in');rect(bw,58,24,68,9,1.6,'face void');text(bw,100,20,'OUTPUT','etch micro');
const ROL=[64,80,96,112].map(u=>{rect(bw,u,25.6,9,6,1.8,'face rubber');return[0,1,2].map(()=>line(bw,u+1.6,28,u+7.4,28,'tread'));});
const stackG=el('g',{}),flyP=el('g',{});
box(80,155.4,184,66,2.4,3.4,.8,'in');
rect(group(FRONT(22,160,236)),0,0,128,52,0,'shade');rect(group(SIDE(150,160,236)),0,0,138,52,0,'shade');
// Scanner: wordmark, LED strip, vents; on top the bed, the light bar, the glass, the original and the scale.
box(0,0,236,150,160,28,3);
const sf=group(FRONT(0,160.1,264));text(sf,84,11.4,'QUIRE','label brand');rect(sf,140,7.6,5,2.6,.8,'face void');
rect(sf,77,21.6,70,2.8,1.4,'face recess');const ledH=rect(sf,74,17,76,11,5.5,'ledh'),led=rect(sf,78,22.3,68,1.4,.7,'led');led._c='';
const ss=group(SIDE(150,160,264));slits(ss,100,8,50,12,15);
const st=group(TOP(0,0,264.03));rect(st,15,13,130,134,2,'face recess');rect(st,17,15,126,130,1,'face bed');
const barG=group('',st);rect(barG,-7,-3,14,136,7,'scanhalo');rect(barG,-1.2,0,2.4,130,1.2,'scanbar');barG.style.opacity=0;
rect(st,17,15,126,130,1,'pane');el('path',{d:'M38,140L66,20M48,140L76,20',class:'refl'},st);
const og=group('',st);rect(og,20,18,52,74,.5,'face top');const ogp=group('',og,{opacity:.16});rect(ogp,26,24,40,20,.4,'inkd');for(let v=50;v<86;v+=4.5)line(ogp,26,v,v%9<4?66:58,v,'inkt');
for(let i=0;i<=12;i++)line(st,17+i*10.5,13.6,17+i*10.5,i%2?14.4:15,'detail');el('path',{d:'M17,15L22,15L17,20Z',class:'face recess'},st);
rect(st,5,18,8,124,1,'face bed');rect(st,5,18,8,124,1,'pane');
// The lid: the document feeder, turned about its back hinge; redrawn as it lifts.
const lidG=button(el('g',{}),{'aria-label':'QUIRE ORIGINALS: lift the scanner lid (L)','aria-pressed':'false'});let padGlow=null;
function drawLid(a){lidG.replaceChildren();into(lidG);const c=Math.cos(a),s=Math.sin(a),O=[0,4,264],U=[1,0,0],V=[0,c,s],N=[0,-s,c],up=c>s,at=(u,v,n)=>add(O,add(mul(U,u),add(mul(V,v),mul(N,n)))),nV=mul(V,-1),nN=mul(N,-1);
const blk=(u,v,n,w,d,h,r,cls,under)=>{const R=group(plane(at(u+w,v+d,n+h),nV,nN));rect(R,0,0,d,h,r,'face side '+cls);const F=group(plane(at(u,v+d,n+h),U,nN));rect(F,0,0,w,h,r,'face '+cls);let T=null;if(up||under){T=group(plane(at(u,v,up?n+h:n),U,V));rect(T,0,0,w,d,r,'face '+(up?'top ':'')+cls);}return{R,F,T};};
const topper=()=>{const h=blk(2,6,16,34,136,8,4,'');if(h.T){rect(h.T,6,10,22,116,3,'detail');rect(h.T,14,56,6,24,3,'face recess');}const t=blk(40,12,16,104,124,2.4,1.5,'cab');if(t.T){for(const v of[22,102])rect(t.T,30,v,44,3,1.5,'face lever');text(t.T,52,62,'ORIGINALS','etch micro center');}};
const body=()=>{const b=blk(2,0,0,146,148,16,3,'',true);rect(b.F,38,5.4,104,4.2,1.6,'face void');rect(b.F,64,12,26,2,1,'face recess');text(b.F,8,10,'QUIRE','etch micro');b.F.append(' ');rect(b.F,-2,-2,150,20,3,'focus-ring');
if(!up){rect(b.T,16,12,124,126,2,'face pad');padGlow=rect(b.T,0,6,18,136,8,'padglow');}else padGlow=null;};
if(up){body();topper();}else{topper();body();}into(draw);}
const leak=el('ellipse',{rx:10,ry:3.6,class:'leak'});
// Panel: a tilted slab on a mount; screen (print), start (copy), stop, LEDs.
const AL=28*RAD,PU=[1,0,0],PV=[0,Math.cos(AL),-Math.sin(AL)],PN=[0,Math.sin(AL),Math.cos(AL)],PO=[6,160,262],pa=(u,v)=>add(PO,add(mul(PU,u),mul(PV,v))),nPN=mul(PN,-1);
box(26,156,240,24,16,12,2,'');
rect(group(plane(pa(66,40),mul(PV,-1),nPN)),0,0,40,5,1.6,'face side');rect(group(plane(pa(0,40),PU,nPN)),0,0,66,5,1.6,'face');
const pnl=group(plane(PO,PU,PV));rect(pnl,0,0,66,40,3.6,'face top');
const scrV=group('',pnl,{id:'printScreen'}),scr=button(group('',pnl),{'aria-label':'Print a report (P)'});rect(scrV,3.8,3.8,46.4,32.4,2.6,'face recess');rect(scrV,5.6,5.6,42.8,28.8,2,'halo');const disp=group('',scrV);rect(disp,4.8,4.8,44.4,30.4,2,'face screen');
text(disp,7,9.4,'QUIRE MF–45','scr t');text(disp,47,9.4,'09:30','scr t e');line(disp,7,11,47,11,'strk');
const sTitle=text(disp,7,18.6,'READY','scr big'),sSub=text(disp,7,23.6,'TRAY 1 · A4 · 45 PPM','scr');line(disp,7,29.4,47,29.4,'strk');const sBar=line(disp,7,29.4,7,29.4,'sbar');
const tiles=group('',disp);['COPY','SCAN','PRINT'].forEach((s,i)=>{rect(tiles,7+i*13.7,26.4,12.3,6.4,1.2,'tile');text(tiles,13.15+i*13.7,30.4,s,'scr t c');});set(rect(scr,3.8,3.8,46.4,32.4,2.6,'hit'),'fill','transparent');rect(scr,1.8,1.8,50.4,36.4,3.6,'focus-ring');
const startB=button(group('',pnl),{'aria-label':'Copy the original on the glass (C)'});circle(startB,58.4,12.6,5.4,'face recess');const sRing=circle(startB,58.4,12.6,4.4,'ring');circle(startB,58.4,12.6,3.5,'face top');el('path',{d:'M57.2,11V14.2L59.9,12.6Z',class:'detail'},startB);circle(startB,58.4,12.6,7.2,'focus-ring');
text(pnl,58.4,20.4,'START','etch micro center');circle(pnl,58.4,26,3.2,'face recess');circle(pnl,58.4,26,2.4,'face stopk');
const pl1=lamp(pnl,55.6,34.2,.9),pl2=lamp(pnl,61.2,34.2,.9);
// Side door: a 3-deep panel swung about its hinge at y 58; outer face (grip, jam lamp) or inner face (transfer roller, levers).
const doorG=button(el('g',{}),{'aria-label':'JAM PAPER PATH: open the side door and clear the paper path (D)'});let doorLamp=null;
function drawDoor(th){doorG.replaceChildren();into(doorG);const c=Math.cos(th),s=Math.sin(th),U=[s,c,0],N=[c,-s,0],H=[150,58,178],Z=[0,0,-1],FR=add(H,mul(U,88)),IN=add(H,mul(N,-3));
if(th<Math.PI/4){const g=group(plane(FR,mul(U,-1),Z));rect(g,0,0,88,66,2.4,'face side');rect(g,4,4,80,58,2,'detail');rect(g,3,22,4.6,20,2.3,'face recess');doorLamp=lamp(g,12,9,1.1);text(g,16,10,'JAM','etch micro');g.append(' ');text(g,44,60,'PAPER PATH','etch micro center');rect(g,-2,-2,92,70,3,'focus-ring');}
else{const g=group(plane(IN,U,Z));rect(g,0,0,88,66,2.4,'face in');rect(g,10,24,68,6,3,'face rubber');for(let u=8;u<84;u+=7)line(g,u,36,u,60,'rib');rect(g,36,8,16,5,2,'face lever');rect(g,6,44,5,14,2,'face lever');rect(g,-2,-2,92,70,3,'focus-ring');doorLamp=null;}
rect(group(plane(FR,mul(N,-1),Z)),0,0,3,66,1,'face');rect(group(plane(IN,U,N)),0,0,88,3,1,'face top');into(draw);}
// Paper drawers, lowest first: a front plate (grip, level gauge, size, number) and, pulled out, the tray, its guides and ream.
const TRAYS=[{z:77,size:'A4',w:74,d:52,lvl:3},{z:45,size:'A4',w:74,d:52,lvl:4},{z:13,size:'A3',w:105,d:74,lvl:2}];
const DR=TRAYS.map((T,i)=>({...T,i,open:false,t:0,v:0,last:-1}));
for(const D of[...DR].reverse()){D.body=el('g',{});D.plate=button(el('g',{}),{'aria-label':`Pull out paper drawer ${D.size} ${D.i+1} (${D.i+1})`,'aria-pressed':'false'});into(D.plate);box(3,158,D.z,144,5,28,2.4,'cab');
const pf=group(FRONT(3,163,D.z+28));rect(pf,46,3,52,5,2.5,'face recess');line(pf,48,3.4,96,3.4);rect(pf,9,9,13,11,1.6,'face recess');[0,1,2,3].forEach(k=>rect(pf,10.5+k*2.85,10.4,2,8.2,.6,k<D.lvl?'gauge on':'gauge'));
rect(pf,26,9.6,15,9.8,1.4,'face top');text(pf,33.5,16.4,D.size,'label center');pf.append(' ');circle(pf,132,14.6,4.6,'detail');text(pf,132,16.2,String(D.i+1),'label center');rect(pf,-2,-2,148,32,4,'focus-ring');into(draw);}
function drawTray(D){const t=D.t,g=D.body;g.replaceChildren();if(t<1.5)return;into(g);const zb=D.z,zf=zb+2.5,zt=zb+25,y1=158+t,len=y1-160,r0=150-D.d,rx=75-D.w/2,a=Math.max(160,r0+t),b=150+t,gm=Math.max(160,r0+t+D.d/2-7);
rect(group(SIDE(8,y1,zt)),0,0,len,zt-zf,0,'face side in');rect(group(TOP(8,160,zf)),0,0,134,len,0,'face top in');
box(rx-4.5,gm,zf,2,14,13,.6,'lever');if(r0+t-4>=160)box(rx+D.w/2-9,r0+t-4,zf,18,2.4,13,.6,'lever');
if(b>a+.5){box(rx-2,a,zf,D.w+4,b-a,1.4,.4,'metal');box(rx,a,zf+1.4,D.w,b-a,10,.4,'ream');const rf=group(FRONT(rx,b,zf+11.4)),rs=group(SIDE(rx+D.w,b,zf+11.4));for(let v=2;v<10;v+=2){line(rf,1,v,D.w-1,v,'sheets');line(rs,1,v,b-a-1,v,'sheets');}}
box(rx+D.w+2.5,gm,zf,2,14,13,.6,'lever');
rect(group(SIDE(144,y1,zt)),0,0,len,zt-zb,0,'face side cab');rect(group(TOP(142,160,zt)),0,0,2,len,0,'face top cab');rect(group(TOP(6,160,zt)),0,0,2,len,0,'face top cab');into(draw);}
// Waste bin: the opening and what's in it, the flight of a sheet (clipped above the front rim), the mesh front, the rim.
const BT=P(186,132,34),BB=P(186,132,0),K=1.2247,Q=.7071,rT=[15.5*K,15.5*Q],rB=[12*K,12*Q],dfs=svg.querySelector('defs');
const arc=(c,r,dir)=>`M${f2(c[0]-r[0])},${f2(c[1])}A${f2(r[0])},${f2(r[1])} 0 0 ${dir} ${f2(c[0]+r[0])},${f2(c[1])}`;
el('ellipse',{cx:f2(BT[0]),cy:f2(BT[1]),rx:f2(rT[0]),ry:f2(rT[1])},el('clipPath',{id:'binClip'},dfs));el('path',{d:`M-999,${f2(BT[1])}H${f2(BT[0]-rT[0])}A${f2(rT[0])},${f2(rT[1])} 0 0 0 ${f2(BT[0]+rT[0])},${f2(BT[1])}H999V-999H-999Z`},el('clipPath',{id:'binFly'},dfs));
el('ellipse',{cx:f2(BT[0]),cy:f2(BT[1]),rx:f2(rT[0]),ry:f2(rT[1]),class:'face binin'});
const binC=el('g',{'clip-path':'url(#binClip)'});el('path',{d:arc(BT,rT,1)+`L${f2(BT[0]+rT[0]*.8)},${f2(BT[1]+9)}A${f2(rT[0]*.8)},${f2(rT[1]*.8)} 0 0 0 ${f2(BT[0]-rT[0]*.8)},${f2(BT[1]+9)}Z`,class:'bin'},binC);
const BALLS=[[181,127,29],[190,135,27.5],[185,138,30.5],[192,126,31],[178,135,31.5],[187,129,33]].map((q,i)=>{const b=ball(binC),s=P(...q);set(b,'transform',`translate(${f2(s[0])} ${f2(s[1])}) rotate(${i*67})`);b.style.display=i<2?'':'none';return b;});
el('path',{d:arc(BT,rT,1),class:'binrim'});const flyL=el('g',{'clip-path':'url(#binFly)'});
el('path',{d:arc(BT,rT,0)+`L${f2(BB[0]+rB[0])},${f2(BB[1])}`+`A${f2(rB[0])},${f2(rB[1])} 0 0 1 ${f2(BB[0]-rB[0])},${f2(BB[1])}Z`,class:'face bin'});
for(const a of[-30,-5,20,45,70,95,120]){const c=Math.cos(a*RAD),s=Math.sin(a*RAD);el('path',{d:`M${pt([186+12*c,132+12*s,1])}L${pt([186+15.4*c,132+15.4*s,33])}`,class:'binrib'});}
for(const z of[11,22]){const r=12+3.5*z/34,c=P(186,132,z);el('path',{d:arc(c,[r*K,r*Q],0),class:'binrib'});}
el('path',{d:arc(BT,rT,0),class:'binrim'});
// Fitting: the machine, the lifted lid, the panel, pulled drawers, the open door and the bin.
frame([[0,0,0,150,160,290],[2,80.7,392.8,146,0,0],[2,99.1,377.4,146,0,0],[6,160,236,66,36,28],[3,158,13,144,77,92],[150,58,112,87,18,66],[170,116,0,32,32,34]],14);
// Pages: 52 × 74, face up, as a ribbon through at(v), its left edge from the head (v 0) to the foot (v 74); U runs across.
const PW=52,PL=74,LN=(v,w,cls='inkl')=>[v,r=>line(r,5,0,w,0,cls)];
const ROWS={
r:[[5.4,r=>{rect(r,5,-1.6,23,3.2,.6,'ink');rect(r,40,-1.6,7,3.2,1.6,'inka');}],LN(9.6,30),[30,r=>{[8,12,9.5,15.5,12.5].forEach((h,i)=>rect(r,6+i*5.2,-h,3.4,h,.3,'inka'));line(r,5,0,33,0,'inkl');for(const[v,w]of[[-15,10],[-11,7],[-7,10],[-3,5]])line(r,37,v,37+w,v,'inkl');}],...[47,45,47,40,46,47,29].map((w,i)=>LN(36+i*4,w)),LN(68,16)],
c:[LN(5.4,26,'inkt'),[30,r=>{rect(r,5,-20,42,20,.4,'inkg');el('path',{d:'M5,0L16,-10L23,-4.5L31,-13L47,0Z',class:'inkd'},r);circle(r,38,-15,2.4,'inkw');}],...[47,44,47,39,47,31].map((w,i)=>LN(36+i*4,w,'inkt')),LN(64,18,'inkt')],
e:[[5.4,r=>rect(r,5,-1.8,42,3.6,.4,'inka')],...[0,1,2,3,4,5,6,7,8,9,10].map(i=>[11.6+i*5.4,r=>{line(r,5,0,47,0,'inkl');for(const u of[19,33])line(r,u,-2.8,u,0,'inkl');}])]};
function mkPage(kind,parent){const g=el('g',{},parent),p={g,edge:el('path',{class:'pedge'},g),fill:el('path',{class:'page'},g)};p.rows=ROWS[kind].map(([v,fn])=>{const r=el('g',{},g);fn(r);r._v=v;return r;});p.out=el('path',{class:'pline'},g);return p;}
function posePage(p,at,U,a=0,flat=false){const n=flat?1:12,L=[],R=[],W=mul(U,PW);for(let i=0;i<=n;i++){const q=at(a+(PL-a)*i/n);L.push(pt(q));R.push(pt(add(q,W)));}
const d=`M${L.join('L')}L${R.reverse().join('L')}Z`;set(p.fill,'d',d);set(p.out,'d',d);
for(const r of p.rows){const v=r._v,on=v>=a+1.5;set(r,'visibility',on?'visible':'hidden');if(on){const o=at(v);set(r,'transform',plane(o,U,norm(add(at(v+1),mul(o,-1)))));}}
if(flat){const z=[0,0,-.6],A=add(at(0),W),B=at(PL),BW=add(B,W);set(p.edge,'d',`M${pt(B)}L${pt(BW)}L${pt(add(BW,z))}L${pt(add(B,z))}ZM${pt(A)}L${pt(BW)}L${pt(add(BW,z))}L${pt(add(A,z))}Z`);}else set(p.edge,'d','');}
function restAt(f){const U=[Math.cos(f.yaw),Math.sin(f.yaw),0],V=[-U[1],U[0],0],c=[114+f.off+f.dx,117+f.dy,f.z];return{U,at:v=>add(c,add(mul(U,-PW/2),mul(V,v-PL/2)))};}
// State: jobs and pages, the lid and its light, drawers, the door and the jam, the stack, progress; audio after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const FEED=560,SETTLE=400,GAP=180,PREP=520,SWEEP=1300,TAKE=700,CAP=12,LIDMAX=50*RAD,NAME={r:'REPORT',c:'COPY',e:'EXPORT'};
let jobs=[],cur=null,ph='idle',t0=0,flight=null,STACK=[],counter=4816,rJobs=0,jobNo=0,mode='free',target=0,jam=false,doorSeq=null,taking=null,sweep=null,lidOpen=false,lidSwept=false,lidA=0,lastLid=-1,lastDoor=-1,spin=0,lastSpin=-1,binN=2,doneT=0,doneSub='',notice='',noticeT=0,last=0,lastUI=0,ac=null,nb=null;
const say=m=>{announcement.textContent=m;};
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,d=.1,v=.02,type='sine',when=0){if(!ac)return;try{const t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
function noise(d=.05,v=.02,f=3000,q=1){if(!ac)return;try{if(!nb){nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}const t=ac.currentTime,s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;b.Q.value=q;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(ac.destination);s.start(t,Math.random()*.5,d+.02);}catch(_){}}
const src=()=>DR[0].open?2:1,blocked=()=>doorSeq||DR[0].open&&DR[1].open,goal=()=>cur.kind!=='e'?cur.total:mode==='det'?Math.floor(target*10+1e-6):10;
function queue(j){j.done=0;if(j.kind==='r'){rJobs++;j.jamAt=rJobs%3?-1:2;}jobs.push(j);say(cur||jobs.length>1?`${j.kind==='r'?'Report':'Copy'} queued.`:j.kind==='r'?'Printing a six-page report.':'Copying the original on the glass.');lastUI=0;}
function printKey(){audio();queue({kind:'r',total:6,name:NAME.r});}
function copyKey(){audio();queue({kind:'c',total:1,name:NAME.c});}
function lidKey(){audio();lidOpen=!lidOpen;lidSwept=false;set(lidG,'aria-pressed',lidOpen);set(lidG,'aria-label',`QUIRE ORIGINALS: ${lidOpen?'lower':'lift'} the scanner lid (L)`);noise(.22,.014,700,.8);say(lidOpen?'Lid lifted: the light bar sweeps under the glass.':'Lid lowered.');lastUI=0;}
function drawer(i){audio();const D=DR[i];D.open=!D.open;set(D.plate,'aria-pressed',D.open);set(D.plate,'aria-label',`${D.open?'Push in':'Pull out'} paper drawer ${D.size} ${i+1} (${i+1})`);if(D.open)noise(.3,.02,480,.6);say(D.open?`Drawer ${i+1} pulled out: a ream of ${D.size} paper.`:`Drawer ${i+1} pushed in.`);lastUI=0;}
function doorKey(){audio();if(doorSeq)return;doorSeq={t0:performance.now(),jam};tone(jam?520:420,.05,.015);say(jam?'Side door open. The jammed sheet comes out and goes in the bin.':'Side door open: the paper path is clear.');if(reduced.matches)endDoor();lastUI=0;}
function endDoor(){const J=doorSeq&&doorSeq.jam;doorSeq=null;if(J){jam=false;jamG.style.display='none';recess.appendChild(jamG);if(binN<BALLS.length)BALLS[binN++].style.display='';notice='JAM CLEARED · READY';noticeT=performance.now()+1500;tone(880,.07,.02);tone(1175,.09,.02,'sine',.09);say('Jam cleared. Ready, and the job carries on.');}lastUI=0;}
function scanStart(now){sweep={t0:now};tone(220,.9,.006,'sawtooth');}
function poseSheet(q){const u=clamp(q/.18),w=clamp((q-.18)/.82),p0=add([147,100,150],mul([12,5,3],ease(u))),p=w>0?add(mix(p0,[186,131,16],w),[0,0,120*w*(1-w)]):p0,s=P(...p);set(jamG,'transform',`translate(${f2(s[0])} ${f2(s[1])}) rotate(${f2(15+560*w)}) scale(${f2(2.2-1.2*w)})`);}
function takeStack(now,red){taking={t0:now};ph='take';say('Output tray full: the stack is taken.');if(red)endTake();}
function endTake(){for(const p of STACK)p.g.remove();STACK=[];taking=null;stackG.removeAttribute('transform');stackG.style.opacity='';lastUI=0;}
function startPage(now,red){const f={k:mode==='done'?.55:1,off:cur.off,yaw:(rand()-.5)*6.4*RAD,dx:(rand()-.5)*2.8,dy:(rand()-.5)*1.6,z:184.7+STACK.length*.6};f.rest=restAt(f);f.p=mkPage(cur.kind,flyP);flight=f;t0=now;ph='feed';if(red)land(now);else if(reduced.matches)set(f.p.g,'visibility','hidden');else{noise(.4,.024,2100,.6);tone(110,.34,.006,'sawtooth');}}
function land(now){const f=flight;f.p.g.removeAttribute('visibility');posePage(f.p,f.rest.at,f.rest.U,0,true);stackG.appendChild(f.p.g);STACK.push(f.p);const old=STACK[STACK.length-4];if(old&&old.rows.length){old.rows.forEach(r=>r.remove());old.rows=[];}counter++;cur.done++;flight=null;ph='gap';t0=now;lastUI=0;}
function poseFlight(t){const f=flight,F=FEED*f.k,x0=88+f.off,Z=f.z,chute=sg=>[x0,22+sg,Z+(207-Z)*(1-ease(clamp(sg/40)))];
if(t<F){const s=PL*clamp(t/F);posePage(f.p,v=>chute(v-(PL-s)),[1,0,0],PL-s);}else{const e=out3(clamp((t-F)/(SETTLE*f.k))),R=f.rest;posePage(f.p,v=>add(mix(chute(v),R.at(v),e),[0,0,2.4*Math.sin(Math.PI*e)*v/PL]),norm(mix([1,0,0],R.U,e)),0);}}
function complete(now){const j=cur;cur=null;ph='idle';if(j.kind==='e'){mode='complete';say('Export complete: every page delivered.');}else{doneT=now+1800;doneSub=`${pad(j.total,2)} ${j.total>1?'PAGES':'PAGE'} · ${j.name}`;say(`${j.kind==='r'?'Report':'Copy'} done.`);}tone(988,.08,.02);tone(1318,.12,.02,'sine',.1);lastUI=0;}
// One step of the job: true when it moved on at once (reduced motion runs a whole job in one frame).
function step(now,red){
if(ph==='idle'){if(!jobs.length||doorSeq||taking||jam||mode==='ind'||mode==='det'||mode==='done')return false;cur=jobs.shift();cur.n=++jobNo;cur.off=jobNo%2?-4:4;ph='prep';t0=now;tone(660,.05,.015);lastUI=0;return true;}
if(ph==='prep'){if(!red&&now-t0<PREP)return false;if(cur.kind==='c'){scanStart(now);ph='scan';}else ph='next';t0=now;return true;}
if(ph==='scan'){if(!red&&sweep&&now-sweep.t0<SWEEP)return false;ph='next';return true;}
if(ph==='next'){const e=cur.kind==='e';if(e&&cur.fresh&&STACK.length){cur.fresh=false;takeStack(now,red);return red;}cur.fresh=false;
if(cur.done>=goal()){if(e&&mode!=='done'){if(mode==='ind'){cur.done=0;cur.fresh=true;return true;}ph='wait';return false;}complete(now);return true;}
if(blocked()){ph='hold';lastUI=0;return false;}if(STACK.length>=CAP){takeStack(now,red);return red;}
if(cur.jamAt===cur.done&&!cur.jammed){cur.jammed=true;jam=true;ph='jam';jamG.style.display='';set(jamG,'transform',JAMPOSE);tone(330,.18,.03,'square');tone(262,.24,.03,'square',.2);say('Paper jam. Open the side door with D.');lastUI=0;return false;}
startPage(now,red);return red;}
if(ph==='feed'){if(!red&&now-t0<(FEED+SETTLE)*flight.k)return false;land(now);return true;}
if(ph==='gap'){if(!red&&now-t0<GAP*(mode==='done'?.5:1))return false;ph='next';return true;}
if(ph==='take'){if(taking)return false;ph='next';return true;}
if(ph==='jam'){if(jam)return false;ph='next';return true;}
if(ph==='hold'){if(blocked())return false;ph='next';return true;}
if(ph==='wait'){if(mode==='det'&&cur.done>=goal())return false;ph='next';return true;}
return false;}
// Progress: an export of ten pages. A share prints up to it, null runs documents on, done finishes and turns the panel green.
function exportJob(){if(cur&&cur.kind==='e')return cur;if(flight)land(performance.now());if(jam){jam=false;jamG.style.display='none';}jobs=[];cur={kind:'e',total:10,done:0,name:NAME.e,off:4,fresh:true,n:++jobNo};ph='next';return cur;}
function setProgress(p){const c=exportJob();if(p==null||!isFinite(p))mode='ind';else{const g=Math.floor(clamp(+p)*10+1e-6);if(g<c.done){c.done=0;c.fresh=true;ph='next';}mode='det';target=clamp(+p);}lastUI=0;}
function finish(){if(mode==='complete')return;exportJob();mode='done';lastUI=0;}
window.figure={setProgress,done:finish};
bind(scr,printKey);bind(startB,copyKey);bind(lidG,lidKey);bind(doorG,doorKey);DR.forEach(D=>bind(D.plate,()=>drawer(D.i)));
const act={p:printKey,c:copyKey,l:lidKey,d:doorKey,'1':()=>drawer(0),'2':()=>drawer(1),'3':()=>drawer(2)};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const a=act[e.key.toLowerCase()];if(a){e.preventDefault();a();}});
function texts(now){
const e=cur&&cur.kind==='e',pp=cur?pad(cur.done,2):'00',pct=mode==='det'?Math.round(target*100):100;
const ro=e||mode==='complete'?(mode==='ind'?`EXPORTING · ${pp}/10 PAGES`:`PROGRESS ${pct}% · ${mode==='complete'?'10':pp}/10 PAGES`):cur?`PAGE ${pp}/${pad(cur.total,2)} · COUNTER ${pad(counter,5)}`:`READY · COUNTER ${pad(counter,5)}`;
const q=jobs.length?` · ${jobs.length} QUEUED`:'',open=DR.find(D=>D.open);
const stt=notice&&now<noticeT?notice:jam?(doorSeq?'CLEARING JAM · SIDE DOOR OPEN':'PAPER JAM · OPEN SIDE DOOR · D'):doorSeq?'SIDE DOOR OPEN · PATH CLEAR':taking?'OUTPUT TRAY FULL · STACK TAKEN':
cur?(ph==='hold'?'CLOSE DRAWER 1 OR 2 TO FEED':e?(mode==='ind'?'EXPORTING · INDETERMINATE':mode==='done'?'FINISHING · EXPORT':ph==='wait'?`EXPORT · WAITING AT ${pct}%`:`EXPORTING · TO ${pad(goal(),2)}/10`):ph==='prep'?`PROCESSING · ${cur.name}${q}`:ph==='scan'?`COPYING · SCANNING THE ORIGINAL${q}`:`PRINTING · ${cur.name} · TRAY ${src()}${q}`):
mode==='complete'?'COMPLETE · EXPORT DELIVERED':now<doneT?`DONE · ${doneSub}`:open?`DRAWER ${open.i+1} OUT · ${open.size} REAM`:sweep?`SCANNING · LID ${lidOpen?'OPEN':'CLOSED'}`:`READY · LID ${lidOpen?'OPEN':'CLOSED'}`;
return[ro,stt];}
function ui(now){const red=reduced.matches,blink=red||Math.floor(now/450)%2===0,breath=red?1:.55+.45*Math.sin(now/300),e=cur&&cur.kind==='e';
let ti='READY',su=`TRAY ${src()} · A4 · 45 PPM`,tn='',pr=-1;
if(jam){ti='PAPER JAM';su=doorSeq?'REMOVING THE SHEET':'OPEN SIDE DOOR · D';tn='warn';}else if(doorSeq){ti='SIDE DOOR';su='PAPER PATH CLEAR';tn='warn';}
else if(cur){if(ph==='hold'){ti='TRAY OPEN';su='CLOSE DRAWER 1 OR 2';tn='warn';}else if(ph==='prep'){ti='PROCESSING';su=cur.name;pr=0;}else if(ph==='scan'){ti='SCANNING';su='ORIGINAL ON GLASS';pr=sweep?clamp((now-sweep.t0)/SWEEP):1;}
else if(ph==='take'){ti='TRAY FULL';su='STACK TAKEN';}else{const tot=e?10:cur.total,on=cur.done+(flight?1:0);ti=e?(ph==='wait'?'WAITING':'EXPORTING'):cur.kind==='c'?'COPYING':'PRINTING';su=`${cur.name} · ${pad(Math.min(on,tot),2)}/${pad(tot,2)}`;pr=(cur.done+(flight?clamp((now-t0)/(FEED*flight.k)):0))/tot;}}
else if(mode==='complete'){ti='COMPLETE';su='EXPORT DELIVERED';tn='ok';pr=1;}else if(now<doneT){ti='DONE';su=doneSub;tn='ok';}else if(sweep){ti='SCANNING';su=lidOpen?'LID OPEN':'LID CLOSED';pr=clamp((now-sweep.t0)/SWEEP);}
if(sTitle.textContent!==ti)sTitle.textContent=ti;if(sSub.textContent!==su)sSub.textContent=su;disp.classList.toggle('warn',tn==='warn');disp.classList.toggle('ok',tn==='ok');
tiles.style.display=pr<0?'':'none';sBar.style.display=pr<0?'none':'';set(sBar,'x2',f2(7+40*clamp(pr)));
const ld=jam?(blink?'a':''):cur||sweep||doorSeq?'b':mode==='complete'||now<doneT?'g':'';lit(led,ld,'led');set(ledH,'class','ledh'+(ld?' '+ld:''));ledH.style.opacity=ld?f2(ld==='b'?.5*breath:.32):0;
set(sRing,'class',cur?'ring on':'ring');lit(pl1,cur?'b':'');lit(pl2,jam||ph==='hold'&&cur?(blink?'a':''):'');if(doorLamp)lit(doorLamp,jam&&blink?'a':'');
const[ro,stt]=texts(now);if(readout.textContent!==ro)readout.textContent=ro;if(stateLabel.textContent!==stt)stateLabel.textContent=stt;}
function tick(now){const dt=Math.min(.05,(now-(last||now))/1000),red=reduced.matches;last=now;
// Lid, and its light: one sweep each time it's lifted, one per copy; light leaks at the seam when it's down.
const lt=lidOpen?1:0;lidA=red?lt:lidA+(lt-lidA)*clamp(dt*6);if(Math.abs(lt-lidA)<.002)lidA=lt;if(lidA!==lastLid){lastLid=lidA;drawLid(ease(lidA)*LIDMAX);}
if(lidOpen&&lidA===1&&!lidSwept){lidSwept=true;scanStart(now);}
let xb=12,glow=0;if(sweep){const t=(now-sweep.t0)/SWEEP;if(t>=1)sweep=null;else if(red){xb=80;glow=1;}else{xb=t<.7?20+120*ease(t/.7):140-120*ease((t-.7)/.3);glow=clamp(t/.05)*clamp((1-t)/.05);}}
set(barG,'transform',`translate(${f2(xb)} 15)`);barG.style.opacity=f2(glow);const lp=P(xb,153,264.4);set(leak,'cx',f2(lp[0]));set(leak,'cy',f2(lp[1]));leak.style.opacity=f2(glow*(1-lidA)*.9);
if(padGlow){set(padGlow,'x',f2(xb-9));padGlow.style.opacity=f2(glow*.55);}
// Drawers on a damped spring, with a stop at each end.
for(const D of DR){const tg=D.open?72:0;if(red){D.t=tg;D.v=0;}else{D.v+=(150*(tg-D.t)-17*D.v)*dt;D.t+=D.v*dt;if(D.t<0){D.t=0;if(D.v<-30)tone(70,.08,.035,'square');D.v*=-.2;}if(D.t>74){D.t=74;D.v*=-.3;}if(Math.abs(tg-D.t)<.05&&Math.abs(D.v)<.2){D.t=tg;D.v=0;}}if(D.t!==D.last){D.last=D.t;drawTray(D);set(D.plate,'transform',tr(0,D.t,0));}}
// Side door: open, the jammed sheet out and into the bin, close.
let th=0;if(doorSeq){const t=now-doorSeq.t0,J=doorSeq.jam,T2=J?650:950,T3=J?1450:950;th=t<450?ease(t/450):t<T3?1:1-ease(clamp((t-T3)/450));
if(J&&t>=T2){if(!doorSeq.out){doorSeq.out=true;flyL.appendChild(jamG);}const q=clamp((t-T2)/(T3-T2));poseSheet(q);if(q>=1)jamG.style.display='none';}if(t>=T3+450)endDoor();}
th*=80*RAD;if(th!==lastDoor){lastDoor=th;drawDoor(th);}
// The stack, when it's taken: it slides out of the tray and lifts away.
if(taking&&red)endTake();else if(taking){const e=ease(clamp((now-taking.t0)/TAKE));set(stackG,'transform',tr(0,44*e,26*e));stackG.style.opacity=f2(1-e);if(e>=1)endTake();}
// Reduced motion lands each page at once; an indeterminate export still keeps its pace, so it never churns.
const inst=red&&mode!=='ind';for(let k=0;k<40&&step(now,inst);k++);
if(flight&&ph==='feed'&&!red)poseFlight(now-t0);
if(!red&&(ph==='feed'||ph==='prep'&&now-t0>240))spin+=dt*(ph==='feed'?26:9);if(spin!==lastSpin){lastSpin=spin;ROL.forEach(r=>r.forEach((l,k)=>{const y=f2(26.2+(spin+k*1.6)%4.8);set(l,'y1',y);set(l,'y2',y);}));}
if(!lastUI||now-lastUI>120){lastUI=now;ui(now);}
requestAnimationFrame(tick);}
drawLid(0);drawDoor(0);lastLid=0;lastDoor=0;requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
