// @ts-nocheck
/* AUVEN H–21 · Thermostat & boiler. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--wall:#e6e5e0;--wall-top:#f1f0ec;--wall-side:#d2d1cc;--floor:#dddcd6;--floor-top:#e9e8e3;--plank:#cfcec8;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--screen:#1c1d1e;--cu:#d39a6c;--cu-hi:#f0c6a2;--brass:#d8b45f;--heat:#ff7a2f;--flame:#ffad4a;--flame-core:#fff2c4;--red:#e0584b;--blue:#5277e8;--yel:#e9bd3f;--steam:#9a9a96}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--wall:#c2c1be;--wall-top:#e1e1dd;--wall-side:#949392;--floor:#bab9b5;--floor-top:#dad9d4;--plank:#aeada9;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--screen:#161717;--cu:#b2815a;--cu-hi:#caa788;--brass:#b6974f;--heat:#ff8a3d;--flame:#ffad4a;--flame-core:#fff0bc;--red:#bd493e;--blue:#4463c3;--yel:#c49f34;--steam:#81817e;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.wall{fill:var(--wall)}.top.wall{fill:var(--wall-top)}.side.wall{fill:var(--wall-side)}.floor{fill:var(--floor)}.top.floor{fill:var(--floor-top)}.plank{stroke:var(--plank);stroke-width:.8;fill:none}.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.screen{fill:var(--screen)}.brass{fill:var(--brass)}.red{fill:var(--red)}.blue{fill:var(--blue)}.yel{fill:var(--yel)}.cuf{fill:var(--cu)}
.pu{fill:none;stroke:var(--line);stroke-width:5.6;stroke-linecap:round;stroke-linejoin:round}.pb{fill:none;stroke:var(--cu);stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.ps{fill:none;stroke:var(--cu-hi);stroke-width:1;stroke-linecap:round;stroke-linejoin:round;opacity:.8}.ph{fill:none;stroke:var(--heat);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round;filter:url(#glow)}.pp{fill:none;stroke:var(--flame-core);stroke-width:1.2;stroke-linecap:round;stroke-dasharray:1 11;opacity:0;animation:circ 1.4s linear infinite;animation-play-state:paused}.firing .pp{opacity:.8;animation-play-state:running}
.trunk{fill:none;stroke:var(--line);stroke-width:4.4;stroke-linejoin:round}.trunk2{fill:none;stroke:var(--top);stroke-width:3;stroke-linejoin:round}
.fire{fill:var(--flame);stroke:none;transform-box:fill-box;transform-origin:center bottom;animation:flick .42s ease-in-out infinite alternate;animation-play-state:paused}.fcore{fill:var(--flame-core);stroke:none}.flames{opacity:0;transition:opacity .35s}.firing .flames{opacity:1}.firing .fire{animation-play-state:running}.fhalo{fill:var(--heat);opacity:0;filter:url(#bloom);transition:opacity .4s}.firing .fhalo{opacity:.45}
.warm{fill:var(--heat);stroke:none;pointer-events:none;opacity:0}.haze{fill:none;stroke:var(--heat);stroke-width:1;opacity:0;stroke-linecap:round}.warming .haze{animation:rise 2.4s ease-in-out infinite}.steam{fill:none;stroke:var(--steam);stroke-width:1.2;stroke-linecap:round;opacity:0}.venting .steam{animation:bleed 1.2s ease-out infinite}
.lamp{fill:var(--off);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.h{fill:var(--heat)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.h,.lamp.b{filter:url(#glow);stroke:none}
.lring{fill:none;stroke:var(--off);stroke-width:1.4}.lring.h{stroke:var(--heat);filter:url(#glow)}.lring.g{stroke:var(--ok);filter:url(#glow)}.lring.a{stroke:var(--warn);filter:url(#glow)}.ringhalo{fill:none;stroke:var(--heat);stroke-width:4;opacity:0;filter:url(#bloom)}
.scr{fill:var(--accent);font:600 7px ui-monospace,monospace;letter-spacing:.2px;text-anchor:middle;stroke:none}.scr.s{font:3px ui-monospace,monospace;letter-spacing:.4px}.scrh{fill:var(--heat)}.halo{fill:var(--accent);opacity:.14;filter:url(#bloom)}.needle{stroke:var(--fault);stroke-width:.9;stroke-linecap:round}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
@keyframes circ{to{stroke-dashoffset:-24}}@keyframes flick{to{transform:scaleY(.8) scaleX(1.07)}}@keyframes rise{0%{transform:translateY(0);opacity:0}35%{opacity:.5}100%{transform:translateY(-12px);opacity:0}}@keyframes bleed{0%{transform:translate(0,0);opacity:0}25%{opacity:.7}100%{transform:translate(5px,-12px);opacity:0}}
@media(prefers-reduced-motion:reduce){.pp,.haze{display:none}.venting .steam{opacity:.6}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<clipPath id="fireClip"><rect x="22" y="58" width="40" height="24" rx="5"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* AUVEN H–21. World: x lower-right, y lower-left, z up; 1 unit ≈ 5 mm.
Part                        x      y      z      w      d      h
floor                       0      0      0    320     64      4   planks
wall + skirting             0      0      4    320      6    246   skirting y 6–9, z 4–16
cable trunking        102–132      6  190–202     –      3      –   boiler → thermostat
boiler casing              18     10     96     84     36    128   display, flame window, gauge, boost, LED
flue                       60  6–28  224–253   r 6.5     –      –   collar, segmented elbow into the wall
valve manifold         30–86     32   72–96      –      –      –   flow, hot, gas, cold, return
copper flow / return   y 14 z 30 / y 11 z 18 → radiator                heat travels along them
thermostat plate          132      6    140     52      3     66
thermostat dial      r 20  158 9→17  178      –      8      –   knurled ring, LED ring, display; eco button
radiator                  196     12     24    108     18     86   12 columns, headers, feet
TRV + lockshield     190 / 310   21  26–56     –      –      –   numbered head
bleed valve               304     21    102   r 3.4      4      –   on the right end
Seams, screws, ticks, LEDs and legends share their parent faces. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: bevelled panels, LEDs, rounded pipe runs.
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function panel(g,x,y,w,h,b,inset=false,cls=''){rect(g,x,y,w,h,1,'face '+cls);el('path',{d:`M${x},${y}H${x+w}L${x+w-b},${y+b}H${x+b}ZM${x},${y}L${x+b},${y+b}V${y+h-b}L${x},${y+h}Z`,class:`face ${inset?'side':'top'} ${cls}`},g);el('path',{d:`M${x},${y+h}L${x+b},${y+h-b}H${x+w-b}L${x+w},${y+h}ZM${x+w},${y}V${y+h}L${x+w-b},${y+h-b}V${y+b}Z`,class:`face ${inset?'top':'side'} ${cls}`},g);}
function lamp(g,x,y,r=1){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c,base='lamp'){if(n._c!==c){n._c=c;set(n,'class',base+(c?' '+c:''));}}
function route(pts,r=4){let d='M'+P(...pts[0]);for(let i=1;i<pts.length-1;i++){const a=pts[i-1],b=pts[i],c=pts[i+1],la=Math.hypot(...b.map((v,j)=>v-a[j])),lc=Math.hypot(...c.map((v,j)=>v-b[j])),p=b.map((v,j)=>v+(a[j]-v)*Math.min(r,la/2)/la),q=b.map((v,j)=>v+(c[j]-v)*Math.min(r,lc/2)/lc);d+='L'+P(...p)+'Q'+P(...b)+' '+P(...q);}return d+'L'+P(...pts[pts.length-1]);}
function pipe(pts,heat=false){const d=route(pts);for(const c of['pu','pb','ps'])el('path',{d,class:c});if(!heat)return null;const h=el('path',{d,class:'ph'}),L=h.getTotalLength();set(h,'stroke-dasharray',`${L} ${L}`);set(h,'stroke-dashoffset',L);h.L=L;el('path',{d,class:'pp'});return h;}
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(Math.hypot(...a)||1));
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`;
function tube(a,b,r,cls){const ax=sub(b,a),n=unit(ax);const U=unit(Math.abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U);let pu=P(...U),pv=P(...V);if(pu[0]*pv[1]-pu[1]*pv[0]<0){V=mul(V,-1);pv=P(...V);}const pd=P(...ax),det=pu[0]*pv[1]-pv[0]*pu[1],u=(pd[0]*pv[1]-pv[0]*pd[1])/det,v=(pu[0]*pd[1]-pd[0]*pu[1])/det,l=Math.hypot(u,v)||1,tx=-v*r/l,ty=u*r/l;el('path',{d:`M${tx},${ty}A${r},${r} 0 0 1 ${-tx},${-ty}L${u-tx},${v-ty}A${r},${r} 0 0 1 ${u+tx},${v+ty}Z`,transform:plane(a,U,V),class:'face '+cls});}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
// Room: floor with planks, wall with skirting and screws, cable trunking.
const sp=P(160,40,0);el('ellipse',{cx:sp[0],cy:sp[1]+10,rx:178,ry:46,class:'shadow stage-floor'});el('ellipse',{cx:sp[0],cy:sp[1]+10,rx:178,ry:46,class:'stage-contact'});
box(0,0,0,320,64,4,3,'floor');const fl=group(TOP(0,0,4.02));for(const v of[22,38,54])line(fl,8,v,312,v,'plank');for(const[u,v]of[[60,22],[150,38],[230,22],[96,54],[270,54],[200,38]])line(fl,u,v-15.6,u,v,'plank');
box(0,0,4,320,6,246,3,'wall');box(0,6,4,320,3,12,1.5,'wall');const wf=group(FRONT(0,6.02,250));for(const[u,v]of[[8,8],[312,8]])screw(wf,u,v);
for(const c of['trunk','trunk2'])wire([[102,7.5,200],[118,7.5,200],[118,7.5,192],[133,7.5,192]],c);
// Plumbing under the boiler: wall runs first, then the five drops with their valves.
const ret=pipe([[86,32,72],[86,32,18],[86,11,18],[312,11,18],[312,21,18],[312,21,26]],true);
const flow=pipe([[30,32,72],[30,32,30],[30,14,30],[184,14,30],[190,14,30],[190,21,30],[190,21,36]],true);
pipe([[44,32,72],[44,32,58],[44,7,58]]);pipe([[72,32,72],[72,32,50],[72,7,50]]);pipe([[58,32,72],[58,32,4]]);
const VALVES=[[30,'red'],[44,'red'],[58,'yel'],[72,'blue'],[86,'blue']];
for(const[x,c]of VALVES){cylinder(x,32,90,3.2,6,'z','cuf');box(x-3,29,74,6,6,8,1.5,'brass');const lv=group(FRONT(x-3,35,80));rect(lv,-1,-1.4,9,2.6,1.3,'face '+c);}
for(const x of[60,130,240])box(x-3,7,11,6,5,9,1.5,'metal');for(const x of[60,130])box(x-3,7,24,6,9,10,1.5,'metal');
// Boiler: casing, flue, display, flame window, gauge, boost rocker, LED, grille.
let flowText,statusL,boostG,boostL,needle,fireIcon;
box(18,10,96,84,36,128,6);
const bt=group(TOP(18,10,224.05));rect(bt,6,4,72,28,4,'detail');slits(bt,12,9,30,18,10);
cylinder(60,28,224,8.5,3,'z','metal');{const pts=[[60,6,246],[60,20,246]];for(const a of[67.5,45,22.5,0]){const t=a*Math.PI/180;pts.push([60,20+8*Math.cos(t),238+8*Math.sin(t)]);}pts.push([60,28,227]);cylinder(60,6,246,8.6,4,'y','metal');for(let i=0;i<pts.length-1;i++)tube(pts[i],pts[i+1],6.5,'metal');}
const bs=group(SIDE(102,46,224));rect(bs,4,6,28,116,3,'detail');slits(bs,9,98,18,18,6,false);rect(bs,10,14,16,22,1.2,'face top');text(bs,12,19,'AUVEN','etch micro');text(bs,12,23,'H–21 24 kW','etch micro');text(bs,12,27,'G20 · 230 V','etch micro');
const bf=group(FRONT(18,46,224));
rect(bf,4,4,76,120,4,'detail');text(bf,42,15,'AUVEN','label brand center');text(bf,42,21,'CONDENSING · H–21','etch micro center');
rect(bf,14,26,56,26,3,'face recess');rect(bf,17,29,50,20,2,'halo');rect(bf,16,28,52,22,2,'face screen');
flowText=text(bf,36,43,'21°','scr');text(bf,36,47.4,'FLOW','scr s');fireIcon=el('path',{d:'M58,44C55,41 56,37 59,34C59,37 62,38 62,41C62,43 60,44 58,44Z',class:'scrh',style:'opacity:.25'},bf);text(bf,60,47.4,'BURNER','scr s');
panel(bf,18,54,48,32,2,true,'base');rect(bf,22,58,40,24,5,'face glass');
const fw=el('g',{'clip-path':'url(#fireClip)'},bf);rect(fw,22,62,40,22,5,'fhalo');const flames=el('g',{class:'flames'},fw);
for(let i=0;i<6;i++){const x=26.5+i*6.2,y=79;el('path',{d:`M${x-2.6},${y}Q${x-4.4},${y-7} ${x},${y-15-i%3*3}Q${x+1},${y-8} ${x+2.6},${y-6}Q${x+4.4},${y-1} ${x},${y}Z`,class:'fire',style:`animation-delay:${-i*.11}s`},flames);el('path',{d:`M${x-1.5},${y}Q${x-1.7},${y-4.5} ${x},${y-8}Q${x+2.6},${y-1} ${x+1},${y}Z`,class:'fcore'},flames);}
rect(fw,24,79.5,36,3,1,'face base');el('path',{d:'M25,61L33,61M25,63L29,63',class:'detail',style:'stroke:#fff;opacity:.6'},bf);
const gauge=group('',bf);circle(gauge,22,102,9,'face base');circle(gauge,22,102,7.4,'face glass');for(let i=0;i<9;i++){const a=(-120+i*30)*Math.PI/180;line(gauge,22+Math.sin(a)*5.4,102-Math.cos(a)*5.4,22+Math.sin(a)*6.6,102-Math.cos(a)*6.6);}needle=group('',gauge);line(needle,22,103.4,22,96.6,'needle');circle(gauge,22,102,1,'face top');text(bf,22,114.6,'BAR','etch micro center');
statusL=lamp(bf,42,102,1.3);text(bf,42,107.6,'STATUS','etch micro center');
boostG=button(group('',bf),{'aria-label':'Burner boost (F)','aria-pressed':'false'});rect(boostG,52,92,20,22,3,'face recess');const rock=rect(boostG,54.5,94.5,15,9,2,'face top');boostL=lamp(boostG,62,109,1.1);text(boostG,62,119.4,'BOOST','etch micro center');rect(boostG,50,90,24,26,4,'focus-ring');rect(boostG,48,88,28,32,0,'hit');
slits(bf,14,119,56,3,18);
// Thermostat: wall plate, round dial with knurled ring, LED ring and display; eco button.
let setText,roomText,ringLed,ringHalo,ticks,ecoG,ecoL,heatIcon;
box(132,6,140,52,3,66,4,'base');const tp=group(FRONT(132,9,206));for(const[u,v]of[[5,5],[47,5],[5,61],[47,61]])screw(tp,u,v);
const dial=cylinder(158,9,178,20,8,'y','');const dc=dial.face;
ringHalo=circle(dc,0,0,17.4,'ringhalo');ticks=group('',dc);for(let i=0;i<40;i++){const a=i*Math.PI/20;line(ticks,Math.cos(a)*18.2,Math.sin(a)*18.2,Math.cos(a)*19.6,Math.sin(a)*19.6);}
ringLed=circle(dc,0,0,16.6,'lring');ringLed._c='';circle(dc,0,0,14.4,'face recess');circle(dc,0,0,13.2,'face screen');
setText=text(dc,0,2.4,'19.0','scr');roomText=text(dc,0,7.6,'ROOM 19.2°','scr s');heatIcon=el('path',{d:'M0,-6.4C-2,-8.4 -1.4,-10.8 .6,-12.4C.6,-10.6 2.4,-9.8 2.2,-8C2,-6.8 1,-6.4 0,-6.4Z',class:'scrh',style:'opacity:0'},dc);
const dialControl=button(group(FRONT(158,17.2,178)),{'aria-label':'Thermostat dial, 19 degrees. Drag, or use the up and down arrows.'});circle(dialControl,0,0,26,'hit');circle(dialControl,0,0,22.6,'focus-ring');
ecoG=button(group(FRONT(146,9.1,155)),{'aria-label':'Eco mode, lowers the target by two degrees (E)','aria-pressed':'false'});rect(ecoG,0,0,24,8,4,'face top');ecoL=lamp(ecoG,5,4,1.1);text(ecoG,14.5,5.4,'ECO','etch micro center');rect(ecoG,-2,-2,28,12,5,'focus-ring');rect(ecoG,-4,-4,32,16,0,'hit');
// Radiator: feet, twelve columns, headers; TRV, lockshield, bleed valve; heat haze.
const warmCols=[];
for(const x of[200,292]){box(x,14,4,8,14,6,2,'metal');box(x+2,16,10,4,10,14,1.5,'metal');}
cylinder(196,21,30,5,108,'x','');cylinder(196,21,104,5,108,'x','');
for(let i=0;i<12;i++){const x=196+i*9;box(x+.6,12,24,7.8,18,86,3.4);const f=group(FRONT(x+.6,30.05,110));line(f,2.4,8,2.4,78);line(f,5.4,8,5.4,78);warmCols.push(rect(f,0,0,7.8,86,3.4,'warm'));}
const warmHalo=rect(group(FRONT(196,30.5,112)),0,0,108,88,10,'warm');set(warmHalo,'filter','url(#bloom)');
cylinder(190,21,36,4,8,'z','brass');cylinder(190,21,44,5.4,13,'z','');const trv=group(TOP(190,21,57.05));circle(trv,0,0,3.4,'detail');const tn=group(FRONT(190,26.4,55));for(let i=0;i<5;i++)line(tn,-3+i*1.5,1,-3+i*1.5,3.2);
cylinder(191,21,32,2.8,6,'x','brass');cylinder(304,21,32,2.8,8,'x','brass');cylinder(312,21,26,3.8,8,'z','brass');cylinder(312,21,34,4.2,6,'z','metal');
cylinder(304,21,102,3.4,4,'x','metal');const bleedG=button(group(SIDE(308.1,21,102)),{'aria-label':'Radiator bleed valve (V)','aria-pressed':'false'});circle(bleedG,0,0,3.4,'face top metal');const slot=group('rotate(-30)',bleedG);line(slot,-2.4,0,2.4,0,'detail');circle(bleedG,0,0,7,'focus-ring');circle(bleedG,0,0,12,'hit');
const vp=P(309,21,106);for(let i=0;i<3;i++)el('path',{d:`M${vp[0]},${vp[1]}q${3+i},-5 0,-9t-2,-9`,class:'steam',style:`animation-delay:${-i*.4}s`});
for(const x of[216,248,280]){const q=P(x,22,116);el('path',{d:`M${q[0]},${q[1]}q-3,-4 0,-8t0,-8`,class:'haze',style:`animation-delay:${-(x%7)*.3}s`});}
frame([[0,0,0,320,64,250],[18,10,96,84,40,150]],14);
// Thermal loop: demand → flame → flow → radiator → room → return.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),hk={};
document.querySelectorAll('.hint [data-k]').forEach(b=>{hk[b.dataset.k]=b;});
let setpoint=19,room=19.2,eco=false,boost=false,bleeding=false,heating=false,flowP=0,warmth=0,retP=0,water=21,pressure=1.35,last=performance.now(),lastUI=0,ac=null,roar=null;
const target=()=>Math.max(16,setpoint-(eco?2:0)),demand=()=>!bleeding&&(boost||room<target()-.03);
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();const b=ac.createBuffer(1,ac.sampleRate,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const n=ac.createBufferSource(),f=ac.createBiquadFilter();n.buffer=b;n.loop=true;f.type='lowpass';f.frequency.value=260;roar=ac.createGain();roar.gain.value=0;n.connect(f);f.connect(roar);roar.connect(ac.destination);n.start();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){}}
function click(f=1400){if(!ac)return;try{const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type='square';o.frequency.value=f;g.gain.setValueAtTime(.012,t);g.gain.exponentialRampToValueAtTime(.0001,t+.03);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.04);}catch(_){}}
const say=m=>{announcement.textContent=m;};
function controls(){heating=demand();svg.classList.toggle('firing',heating);svg.classList.toggle('venting',bleeding);
for(const[g,v,k]of[[ecoG,eco,'e'],[boostG,boost,'f'],[bleedG,bleeding,'v']]){set(g,'aria-pressed',v);set(hk[k],'aria-pressed',v);}
set(rock,'y',boost?101:94.5);set(slot,'transform',`rotate(${bleeding?60:-30})`);set(ticks,'transform',`rotate(${(setpoint-16)*27})`);
set(dialControl,'aria-label',`Thermostat dial, ${setpoint.toFixed(1)} degrees. Drag, or use the up and down arrows.`);}
function ui(){setText.textContent=target().toFixed(1);roomText.textContent='ROOM '+room.toFixed(1)+'°';flowText.textContent=Math.round(water)+'°';
readout.textContent=`${room.toFixed(1)} °C → ${target().toFixed(1)} °C`;
stateLabel.textContent=bleeding?'BLEED OPEN · FLAME PAUSED':boost?'BOOST · FLAME ON':heating?(eco?'ECO · HEATING':'HEATING · FLAME ON'):warmth>.18?'COASTING · STORED HEAT':eco?'ECO · AT TEMPERATURE':'AT TEMPERATURE';}
function adjust(a){audio();setpoint=Math.round(clamp(setpoint+a,16,26)*2)/2;click();controls();ui();say(`Setpoint ${setpoint.toFixed(1)} degrees. ${eco?'Eco target '+target().toFixed(1)+' degrees. ':''}${heating?'Boiler firing.':'Boiler standing by.'}`);}
function toggleEco(){audio();eco=!eco;click(900);controls();ui();say(`Eco ${eco?'on':'off'}. Target ${target().toFixed(1)} degrees.`);}
function toggleFlame(){audio();boost=!boost;click(700);controls();ui();say(boost?'Burner boost on. The flame fires unless the bleed valve is open.':'Burner boost off. The thermostat controls the flame.');}
function toggleBleed(){audio();bleeding=!bleeding;click(500);controls();ui();say(bleeding?'Bleed valve open. Air hisses out; the flame pauses.':'Bleed valve closed. Circulation resumes.');}
bind(ecoG,toggleEco);bind(boostG,toggleFlame);bind(bleedG,toggleBleed);
const act={e:toggleEco,f:toggleFlame,v:toggleBleed};for(const[k,b]of Object.entries(hk))b.addEventListener('click',()=>act[k]());
const localX=e=>new DOMPoint(e.clientX,e.clientY).matrixTransform(dialControl.getScreenCTM().inverse()).x;
let drag=null,suppress=false;
dialControl.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={id:e.pointerId,y:e.clientY,base:setpoint,moved:false};suppress=false;dialControl.setPointerCapture(e.pointerId);dialControl.focus({preventScroll:true});});
dialControl.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;const dy=drag.y-e.clientY;if(Math.abs(dy)>5)drag.moved=true;if(drag.moved){const next=clamp(drag.base+Math.round(dy/12)*.5,16,26);if(next!==setpoint)adjust(next-setpoint);}});
const endDrag=e=>{if(!drag||drag.id!==e.pointerId)return;suppress=drag.moved;drag=null;if(dialControl.hasPointerCapture(e.pointerId))dialControl.releasePointerCapture(e.pointerId);};
dialControl.addEventListener('pointerup',endDrag);dialControl.addEventListener('pointercancel',endDrag);
dialControl.addEventListener('click',e=>{if(suppress){suppress=false;return;}adjust(e.detail===0||localX(e)>=0?.5:-.5);});
dialControl.addEventListener('wheel',e=>{e.preventDefault();adjust(e.deltaY<0?.5:-.5);},{passive:false});
dialControl.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)adjust(.5);}});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.toLowerCase(),a={arrowup:()=>adjust(.5),arrowdown:()=>adjust(-.5),...act}[k];if(a){e.preventDefault();if(!e.repeat||k.startsWith('arrow'))a();}});
function tick(now){const dt=Math.min((now-last)/1000,.1),red=reduced.matches;last=now;
heating=demand();svg.classList.toggle('firing',heating);
flowP=clamp(flowP+dt*(heating?.26:-.13));warmth=clamp(warmth+dt*(heating&&flowP>.94?.19:bleeding?-.2:-.055));retP=clamp(retP+dt*(warmth>.25?.13:-.08));
water+=((heating?64:21)-water)*dt*(heating?.45:.12);pressure+=((bleeding?.7:heating?1.65:1.35)-pressure)*dt*2;room=clamp(room+dt*(warmth*.042-(room-18.5)*.004),16,27);
if(boost&&room>=Math.min(26,setpoint+1)){boost=false;controls();say('Boost complete. The thermostat resumes control.');}
const fp=red?(heating?1:flowP):flowP;set(flow,'stroke-dashoffset',(flow.L*(1-fp)).toFixed(1));flow.style.opacity=flowP>.002?1:0;set(ret,'stroke-dashoffset',(ret.L*(1-retP)).toFixed(1));ret.style.opacity=(retP*.65).toFixed(2);
warmCols.forEach((c,i)=>c.style.opacity=(clamp(warmth*1.4-i*.03)*.3).toFixed(3));warmHalo.style.opacity=(warmth*.12).toFixed(3);svg.classList.toggle('warming',warmth>.25);
set(needle,'transform',`rotate(${(-120+(pressure/2.5)*240).toFixed(1)} 22 102)`);
const blink=red||Math.floor(now/450)%2===0,at=!heating&&room>=target()-.15;
lit(statusL,bleeding?(blink?'a':''):heating?'h':'g');lit(boostL,boost?'h':'');lit(ecoL,eco?'g':'');
lit(ringLed,bleeding?(blink?'a':''):heating?'h':at?'g':'','lring');ringHalo.style.opacity=heating?(red?.5:(.35+.2*Math.sin(now/300)).toFixed(2)):0;heatIcon.style.opacity=heating?1:0;fireIcon.style.opacity=heating?1:.25;
if(roar)roar.gain.setTargetAtTime(heating?.012:0,ac.currentTime,.25);
if(now-lastUI>120){ui();lastUI=now;}requestAnimationFrame(tick);}
controls();ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['e', 'f', 'v'], draw }
