// @ts-nocheck
/* VELA 9 · Portable typewriter. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--en:#df6c43;--en-top:#ee8c63;--en-side:#bf5532;--chrome:#d9dad8;--chrome-top:#f4f4f2;--chrome-side:#bdbebc;--key:#1e1e1e;--key-top:#262626;--legend:#f3f1ea;--rub:#262626;--rub-top:#363636;--rub-side:#1c1c1c;--tol:#c9c1b2;--tol-top:#d8d1c4;--tol-side:#b3ab9c;--vel:#6c1d25;--vel-top:#7a232c;--vel-side:#58171e;--nap:#8a2b35;--pit:#2b2b29;--pit-wall:#3b3b38;--felt:#4d4a46;--bar:#c4c5c3;--crk:#2c2c2b;--paper:#fdfcf8;--ink1:#161616;--ink2:#c3261d;--rb1:#1b1b1b;--rb2:#c8261c;--card:#f6f1e3;--gl:.55}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--en:#bc5a37;--en-top:#df835c;--en-side:#863a20;--chrome:#b7b7b6;--chrome-top:#e4e4e2;--chrome-side:#858585;--key:#171717;--key-top:#232323;--legend:#cccbc7;--rub:#1e1e1e;--rub-top:#323232;--rub-side:#101010;--tol:#a9a295;--tol-top:#cac3b7;--tol-side:#7e786d;--vel:#5a171d;--vel-top:#722028;--vel-side:#3c0d12;--nap:#73232b;--pit:#232321;--pit-wall:#30302e;--felt:#3f3d3a;--bar:#a5a6a4;--crk:#232323;--paper:#d5d4d2;--ink1:#111111;--ink2:#a41e17;--rb1:#151515;--rb2:#a81e16;--card:#cecbc2;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.en{fill:var(--en)}.top.en{fill:var(--en-top)}.side.en{fill:var(--en-side)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.rub{fill:var(--rub)}.top.rub{fill:var(--rub-top)}.side.rub{fill:var(--rub-side)}.tol{fill:var(--tol)}.top.tol{fill:var(--tol-top)}.side.tol{fill:var(--tol-side)}.vel{fill:var(--vel)}.top.vel{fill:url(#velvet)}.side.vel{fill:var(--vel-side)}.pit{fill:var(--pit)}.pw{fill:var(--pit-wall)}.felt{fill:var(--felt)}.crk{fill:url(#crinkle)}.kg{fill:var(--key)}.top.kg{fill:var(--key-top)}.card{fill:var(--card)}
.sk{stroke:none}.gloss{fill:none;stroke:#fff;stroke-opacity:var(--gl);stroke-width:1.3;vector-effect:non-scaling-stroke;stroke-linecap:round}.seam{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;stroke-dasharray:1.6 1.4;opacity:.7}
.stem{fill:none;stroke:var(--chrome-side);stroke-width:1.1;stroke-linecap:round}.stem-u{fill:none;stroke:var(--line);stroke-width:1.9;stroke-linecap:round}.leg{fill:var(--legend);font:600 2.5px system-ui,sans-serif;stroke:none;text-anchor:middle}.hl{fill:none;stroke:#fff;stroke-opacity:var(--gl);stroke-width:.7;stroke-linecap:round}
.brand{fill:var(--chrome-top);font:italic 700 7px Georgia,'Times New Roman',serif;letter-spacing:.8px;stroke:var(--line);stroke-width:.25;paint-order:stroke}.plate{fill:var(--line);font:600 2.2px ui-monospace,monospace;letter-spacing:.9px;stroke:none}
.bar{fill:none;stroke:var(--bar);stroke-width:.62;stroke-linecap:round}.bar-u{fill:none;stroke:var(--pit);stroke-width:1.15;stroke-linecap:round}.slug{fill:none;stroke:var(--chrome-side);stroke-width:1.5;stroke-linecap:butt}.strike .bar{stroke:var(--chrome-top)}.strike .bar-u{stroke:var(--line)}
.acr{fill:#fff;fill-opacity:.28;stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.paper{fill:var(--paper);stroke:var(--line);stroke-width:.7;vector-effect:non-scaling-stroke}.ty{font:600 3.25px 'American Typewriter','Courier New',Courier,monospace;stroke:none;fill:var(--ink1)}.ty.r{fill:var(--ink2)}
.rb1{fill:var(--rb1)}.rb2{fill:var(--rb2)}.tick{stroke:var(--line);stroke-width:.22}.sc{fill:var(--line);font:600 1.45px ui-monospace,monospace;stroke:none;text-anchor:middle}
.rod{fill:none;stroke:var(--chrome-top);stroke-width:1.1;stroke-linecap:round}.rod-u{fill:none;stroke:var(--line);stroke-width:2;stroke-linecap:round}.cu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.cb{fill:none;stroke:var(--tol-side);stroke-linecap:round;stroke-linejoin:round}
.lit{fill:var(--accent);stroke:none}.halo{fill:var(--accent);opacity:0;filter:url(#bloom);pointer-events:none}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.key{cursor:pointer;transition:transform 40ms}.key.down{transform:translate(0,1.5px)}.key:hover .kg.top{fill:var(--key)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<pattern id="velvet" width="2.4" height="2.4" patternUnits="userSpaceOnUse"><rect width="2.4" height="2.4" style="fill:var(--vel-top)"/><path d="M0,2.4L2.4,0" style="stroke:var(--nap);stroke-width:.5"/></pattern>
<pattern id="crinkle" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" style="fill:var(--crk)"/><path d="M0,1.2h1.1M1.6,2.6h1M2,.4h.8" style="stroke:var(--line);stroke-width:.25;opacity:.45"/></pattern>
<clipPath id="pclip"><rect id="pcr" x="-1" y="-60" width="86" height="60"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* VELA 9 portable typewriter. World: x lower-right; y lower-left (the keys face +y); z up. 1 unit = 2.5 mm.
Part x y z w d h
case base (tolex) + latches ×2 0 0 0 144 130 10
lid (off, upside down) −150 24 0 144 130 44 (on the base: 0 0 10)
machine plinth 11 9 10 124 116 3
body (enamel prism; profile in y–z, end cap at x 134) 12 10 13 122 112 22
carriage rail 12 8.5 35 122 3 2.4
type basket window (r27 about 73 22.2, cut at y 24) 46 24 35 54 25 –
segment ring r8.6–11.4 + felt rest r21–25.6 63–98 22–48 28–31 – – –
typebars ×42 (pivots r10 at z31, length 14.1, strike at 73 22.2 41) 49–97 22–47 29–41 – – –
spool cups ×2 + rolls r4.6–8 + flanges 20/108 29 35 18 18 7.6
ribbon guides ×2 51/95 26.5 35 r1 – 6.6
ribbon (black over red) + vibrator 29–117 23.6–45 35.6–42.6 – – –
card holder + position caret 68 23.4 36.5 10 0.6 6.2
ribbon selector slot + knob 121 42 35 4 11 1.6
keyboard well (deck slope 0.179) 17 62 18–28 112 50 –
keys ×48 r3.3 (rows y 68/77/86/95) + space bar 19–126 68–107 20–32.4 – – –
carriage truck (slides −2.4 per column) 56 10 35.4 106 14 2.6
end plates ×2 56/158 9 36 4 16 17
platen r6 + knobs r6.4 ×2 48–170 11–23 38–50 – – –
paper rest (leans 15° back, folds flat for the lid) 61 1.5–13.5 50–62 96 – 12
line strip (hides the sheet's lower edge) 61 23.9 36.5 96 – 3.2
paper (leans 15° back) 67 8–23 38–90 84 – ≤54
bail + clear margin scale + rollers 61 20.4 49–53 96 – –
return lever (pivot → tip) 57 22 53 → 52 38 54
Engravings, legends, seams and screws share their parent face. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: planes, profile prisms, polar paths on the cover, controls.
const draw=root,defs=svg.querySelector('defs'),into=g=>root=g,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,D=Math.PI/180;
const plane=(o,U,V)=>`matrix(${P(...U).map(f2).join(' ')} ${P(...V).map(f2).join(' ')} ${P(...o).map(f2).join(' ')})`;
function button(g,label){set(g,'class','control');set(g,'role','button');set(g,'tabindex','0');set(g,'aria-label',label);return g;}
function bind(g,fn){g.addEventListener('click',()=>fn());g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
const arc=(cy,cz,r,a0,a1,n=4)=>Array.from({length:n},(_,i)=>{const a=(a0+(a1-a0)*(i+1)/n)*D;return[cy+r*Math.cos(a),cz+r*Math.sin(a)];});
const PX=73,PY=22.2,PZ=41,CW=2.4,MAXC=30,LH=4.3,zd=y=>28.4-(y-59.5)*.1805;
const pol=(r,a,cx=PX,cy=PY)=>[f2(cx+r*Math.sin(a*D)),f2(cy+r*Math.cos(a*D))];
const ann=(r0,r1,a,cx,cy)=>`M${pol(r1,-a,cx,cy)}A${r1},${r1} 0 0 0 ${pol(r1,a,cx,cy)}L${pol(r0,a,cx,cy)}A${r0},${r0} 0 0 1 ${pol(r0,-a,cx,cy)}Z`;
// Enamel body: a y–z profile swept along x; each facet's tone follows its normal, from front (--en) to top (--en-top).
function prism(prof,x0,x1){const vis=[];
for(let i=0;i<prof.length-1;i++){const a=prof[i],b=prof[i+1],ny=a[1]-b[1],nz=b[0]-a[0];if(ny+nz<=.01)continue;vis.push(a,b);
const t=clamp(Math.round(Math.atan2(nz,ny)/D/.9),0,100),f=`color-mix(in srgb,var(--en-top) ${t}%,var(--en))`;
el('path',{d:poly([[x0,...a],[x1,...a],[x1,...b],[x0,...b]],true),class:'sk',style:`fill:${f};stroke:${f};stroke-width:.35`});}
el('path',{d:poly(vis.map(p=>[x0,...p])),class:'face',style:'fill:none'});
for(const p of[vis[0],prof[prof.length-1]])wire([[x0,...p],[x1,...p]],'face');
el('path',{d:poly(prof.map(p=>[x1,...p]),true),class:'face side en'});}
// Case base: tolex tray, velvet lining, stitched seam, chrome latches; the plinth and the body sit inside.
const shp=P(-2,74,0);el('ellipse',{cx:shp[0],cy:shp[1]+6,rx:200,ry:64,class:'shadow stage-floor'});el('ellipse',{cx:shp[0],cy:shp[1]+6,rx:200,ry:64,class:'stage-contact'});
const lidBack=el('g',{});
box(0,0,0,144,130,10,3,'tol');
{const t=group(TOP(0,0,10));rect(t,3.2,3.2,137.6,123.6,2,'face top vel');
const f=group(FRONT(0,130,10));line(f,3,1.6,141,1.6,'seam');line(f,3,8.6,141,8.6,'seam');
for(const u of[34,110]){box(u-4.5,130,2.6,9,1.4,6,1.2,'chrome');const l=group(FRONT(u-4.5,131.4,8.6));rect(l,1.6,1.4,5.8,2.2,.8,'face recess');circle(l,4.5,4.6,.7,'detail');}}
box(11,9,10,124,116,3,2,'base');
const PROF=[[10,13],[10,31],...arc(14,31,4,180,90),[53,35],...arc(53,30,5,90,0),[58,28.9],[59.5,28.4],[116,18.2],...arc(116,14.2,4,90,0),[120,13]];
prism(PROF,12,134);
for(const[y,z]of[[11.2,33.8],[56.6,33.6],[118.8,17]])wire([[14.5,y,z],[131.5,y,z]],'gloss');
{const s=group(SIDE(134,122,35));rect(s,6,19.4,104,1.3,.6,'face chrome');text(s,87,15.2,'Vela','brand center');text(s,103,15.2,'9','plate');
screw(s,14,17.6);screw(s,104,16.4);}
box(12,8.5,35,122,3,2.4,1,'chrome');
// Type basket under the cover: a semicircular window onto the felt rest, the slotted segment and 42 typebars.
const WIN='M46.06,24A27,27 0 0 0 99.94,24Z',BETA0=-8,BETAS=135,LB=14.14;
const bc=el('clipPath',{id:'bask'},defs);el('path',{d:WIN,transform:TOP(0,0,35)},bc);
into(el('g',{'clip-path':'url(#bask)'},draw));
rect(group(TOP(0,0,24)),40,18,66,40,0,'face pit');
const ring=z=>Array.from({length:22},(_,i)=>{const a=(-100+i*5)*D;return[PX+27*Math.sin(a),PY+27*Math.cos(a),z];});
el('path',{d:poly([...ring(35),...ring(24).reverse()],true),class:'face pw'});
rect(group(FRONT(40,24,35)),0,0,66,11,0,'face pw');
el('path',{d:ann(21,25.6,86),transform:TOP(0,0,28.2),class:'face felt'});
for(let i=0;i<9;i++)el('path',{d:`M${pol(21.4,-80+i*20).join(',')}L${pol(25.2,-80+i*20).join(',')}`,transform:TOP(0,0,28.2),class:'detail',opacity:.5});
el('path',{d:poly([...Array.from({length:19},(_,i)=>[...pol(11.4,-90+i*10).map(Number),31]),...Array.from({length:19},(_,i)=>[...pol(11.4,90-i*10).map(Number),29])],true),class:'face chrome'});
el('path',{d:ann(8.6,11.4,88),transform:TOP(0,0,31),class:'face top chrome'});
const BARS=[];
for(let i=0;i<42;i++){const ph=-82+164*i/41,g=el('g',{});BARS.push({ph,g,u:el('path',{class:'bar-u'},g),b:el('path',{class:'bar'},g),s:el('path',{class:'slug'},g)});}
BARS.slice().sort((a,b)=>Math.sin(a.ph*D)+Math.cos(a.ph*D)-Math.sin(b.ph*D)-Math.cos(b.ph*D)).forEach(b=>root.appendChild(b.g));
function barPath(b,beta){const u=[Math.sin(b.ph*D),Math.cos(b.ph*D)],pv=[PX+10*u[0],PY+10*u[1],31],c=Math.cos(beta*D),s=Math.sin(beta*D),at=l=>[pv[0]+u[0]*l*c,pv[1]+u[1]*l*c,pv[2]+l*s],m=at(LB-2.8);
set(b.u,'d',poly([pv,at(LB)]));set(b.b,'d',poly([pv,m]));set(b.s,'d',poly([m,at(LB)]));}
BARS.forEach(b=>{b.home=b.g.parentNode;barPath(b,BETA0);});
into(draw);
el('path',{d:WIN,transform:TOP(0,0,35),class:'rod-u',style:'stroke-width:2.6;vector-effect:none'});el('path',{d:WIN,transform:TOP(0,0,35),class:'rod',style:'stroke-width:1.5;vector-effect:none'});
{const t=group(TOP(0,0,35));for(const[u,v]of[[17,51],[129,51]])screw(t,u,v);rect(t,121,42,4,11,1.8,'face recess');circle(t,118.6,44.6,.9,'rb1');circle(t,118.6,50.6,.9,'rb2');}
const sel=button(el('g'),'Ribbon selector: black or red (Up and Down arrows)'),selK=el('g',{},sel);into(selK);box(121.4,42.6,35,3.2,3.4,2.2,1,'chrome');into(sel);
{const t=group(TOP(0,0,35));rect(t,119,40.5,8,14.6,2,'focus-ring');rect(t,117,40,11,16,0,'hit');}into(draw);
// Carriage (one sliding group): truck, end plates, paper table, platen, paper, bail with margin scale, knobs, return lever.
const car=el('g',{});into(car);
box(56,10,35.4,106,14,2.6,1,'en');
cylinder(48,17,44,6.4,8,'x','rub');box(56,9,36,4,16,17,2,'en');
const rest=el('g',{});rect(rest,0,0,96,12,2.4,'face top en');rect(rest,5,2,1.8,8,.6,'face chrome');line(rest,3,10,93,10);
cylinder(60,17,44,6,98,'x','rub');wire([[61,19.9,49.6],[157,19.9,49.6]],'gloss');
const paperG=group(plane([67,22.9,38.4],[1,0,0],[0,.259,-.966]));
const sheet_=rect(paperG,0,-30,84,30,.4,'paper'),textG=el('g',{'clip-path':'url(#pclip)'},paperG),pcr=document.getElementById('pcr');
{const s=group(FRONT(61,23.9,39.7));rect(s,0,0,96,3.2,.8,'face chrome');line(s,2,1,94,1);}
for(const[c,w]of[['rod-u',1.5],['rod',.8]])wire([[61,20,52.15],[157,20,52.15]],c).style.strokeWidth=w;
for(const x of[79,127])cylinder(x,20,52.15,1.1,4,'x','chrome');
{const s=group(plane([61,19.4,55.1],[1,0,0],[0,.259,-.966]));rect(s,0,0,96,2.6,.5,'acr');
for(let k=0;k<=MAXC;k++){const u=12+k*CW;line(s,u,0,u,k%5?.55:.95,'tick');if(k%10===0)text(s,u+.9,1.75,String(k),'sc');}
for(const k of[0,MAXC]){rect(s,12+k*CW-1,-1.7,2,1.9,.4,'face chrome');line(s,12+k*CW,-1.5,12+k*CW,.1);}circle(s,12+(MAXC-6)*CW,-.6,.45,'rb2');}
box(158,9,36,4,16,17,2,'en');{const t=group(TOP(0,9,53));rect(t,56.9,3,2.2,4,.6,'face chrome');rect(t,158.9,4,2.2,5,.6,'face chrome');}
const knob=cylinder(162,17,44,6.4,8,'x','rub'),knR=group('',knob.face);
for(let k=0;k<18;k++){const a=k*20*D;line(knR,4.9*Math.cos(a),4.9*Math.sin(a),6.1*Math.cos(a),6.1*Math.sin(a));}circle(knob.face,0,0,2.6,'face chrome');line(knR,0,-1.2,0,-4,'stem');
const lev=button(el('g',{}),'Carriage return and line-space lever (Enter)');
const levA_=el('path',{class:'rod-u',style:'stroke-width:3.2'},lev),levB=el('path',{class:'rod',style:'stroke-width:2'},lev),levP=el('path',{class:'face top chrome'},lev),levF=el('path',{class:'focus-ring'},lev),levR=el('path',{style:'fill:none;stroke:transparent;stroke-width:9;stroke-linecap:round'},lev);
into(draw);
// Ribbon spools: chrome cups, two-tone rolls whose radii trade as the ribbon advances, slotted flanges, hubs.
function spool(x){const y=38;cylinder(x,y,35,9.4,1.4,'z','chrome');const roll=el('g',{}),fl=cylinder(x,y,41,8.6,.6,'z','chrome'),rot=group('',fl.face);
for(let k=0;k<3;k++)el('path',{d:ann(3.4,6.6,26,0,0),transform:`rotate(${k*120})`,class:'face pit'},rot);
const hub=cylinder(x,y,41.6,2.2,1,'z','chrome'),rh=group('',hub.face);line(rh,0,-1.6,0,1.6);return{x,y,roll,rot,rh,r:0};}
const SPL=spool(PX-44),SPR=spool(PX+44);
for(const x of[51,95]){cylinder(x,26.5,35,1,7.4,'z','chrome');}
// Card holder at the printing point, with the lit position caret; the ribbon and its vibrator pass in front.
const ch=group(FRONT(67.5,23.5,45));
el('path',{d:'M0,0H11V4.6H7.4V1.7Q7.4,1.3 7,1.3H4Q3.6,1.3 3.6,1.7V4.6H0Z',class:'face chrome'},ch);line(ch,1.4,.8,1.4,4.2);line(ch,9.6,.8,9.6,4.2);
const halo=el('ellipse',{cx:5.5,cy:1,rx:6,ry:4.5,class:'halo'},ch),caret=el('path',{d:'M4.3,.15H6.7L5.5,1.25Z',class:'lit',filter:'url(#glow)'},ch);
const rib=el('g',{});
function tangent(sp,G,sg){const vx=G[0]-sp.x,vy=G[1]-sp.y,t=Math.atan2(vy,vx)+sg*Math.acos(sp.r/Math.hypot(vx,vy));return[sp.x+sp.r*Math.cos(t),sp.y+sp.r*Math.sin(t)];}
function drawRibbon(lift){rib.textContent='';const z=35.6+lift,pts=[[...tangent(SPL,[51,26.5],1),36.4],[51,26.5,36.3],[66,23.9,z],[80,23.9,z],[95,26.5,36.3],[...tangent(SPR,[95,26.5],-1),36.4]];
for(const[c,o]of[['rb2',0],['rb1',2.3]])el('path',{d:poly([...pts.map(p=>[p[0],p[1],p[2]+o]),...pts.slice().reverse().map(p=>[p[0],p[1],p[2]+o+2.3])],true),class:'face '+c,style:'stroke-width:.5'},rib);
const v=[[66.8,24.5,z+5],[66.8,24.5,z-.5],[79.2,24.5,z-.5],[79.2,24.5,z+5]];for(const c of['rod-u','rod']){const w=wire(v,c,rib);w.style.strokeWidth=c==='rod'?'.7':'1.3';const t=wire([[PX,24.5,z-.5],[PX,24.5,31]],c,rib);t.style.strokeWidth=w.style.strokeWidth;}}
// Keyboard: crinkle well on the sloped deck, stems, glass-topped keys with chrome rims, space bar.
{const k=group(plane([17,62,zd(62)],[1,0,0],[0,1,-.1805]));rect(k,0,0,112,50,3,'face crk');rect(k,-.8,-.8,113.6,51.6,3.4,'rod-u');rect(k,-.8,-.8,113.6,51.6,3.4,'rod');}
const KEYS={},CHARS='1234567890-qwertyuiopasdfghjkl;\'zxcvbnm,./';
function key(k,x,row,leg,name,r=3.3){const y=68+row*9,zt=32.4-row*2.2;wire([[x,y,zd(y)],[x,y,zt-1.4]],'stem-u');wire([[x,y,zd(y)],[x,y,zt-1.4]],'stem');
const g=el('g',{class:'key','data-k':k});into(g);const c=cylinder(x,y,zt-1.4,r,1.4,'z','chrome'),q=r-1.1;circle(c.face,0,0,r-.62,'face top kg');
if(leg)text(c.face,0,.9,leg,'leg');el('path',{d:`M${f2(-q*.87)},${f2(-q*.5)}A${q},${q} 0 0 1 ${f2(q*.5)},${f2(-q*.87)}`,class:'hl'},c.face);
if(name){circle(c.face,0,0,r+1.3,'focus-ring');button(g,name);g.classList.add('key');}into(draw);KEYS[k]={g,x,y};}
[['1234567890-',29],['qwertyuiop',33.2],["asdfghjkl;'",35.4],['zxcvbnm,./',39.6]].forEach(([s,x0],row)=>[...s].forEach((c,i)=>key(c,x0+i*8.4,row,c.toUpperCase())));
key('MR',20.6,0,'MR');key('Backspace',121.4,0,'⌫','Back space (Backspace)');key('Tab',24.8,1,'⇥');key('Lock',27,2,'⇪');key('ShiftL',31.2,3,'⇧','',3.5);key('ShiftR',123.6,3,'⇧','',3.5);
{for(const x of[50,98])wire([[x,105,zd(105)],[x,105,zd(105)+2.4]],'stem');const g=el('g',{class:'key','data-k':' '});into(g);box(45,103.4,zd(105)+2.4,58,3.2,1.6,1.3,'chrome');into(draw);KEYS[' ']={g};}
const BAR_OF={};[...CHARS].map(c=>[c,KEYS[c].x+KEYS[c].y*.01]).sort((a,b)=>a[1]-b[1]).forEach(([c],i)=>BAR_OF[c]=BARS[i]);
const strikeL=el('g',{}),topLid=el('g',{});
frame([[0,0,0,144,130,50],[-24,9,35,194,16,20],[-5,8,38,156,15,54],[-150,24,0,144,130,44]],6);
// Lid: 0 = on the base; 1 = lifted clear, slid left, turned over and set down showing its lining.
const LW=144,LD=130,LZ=44,LT=2.4,IH=LD-2*LT;
const FACES=[
{o:[LT,LT,LZ-LT],U:[1,0,0],V:[0,1,0],w:LW-2*LT,h:IH,n:[0,0,-1],c:'top vel',fl:1},
{o:[LT,LD-LT,LZ-LT],U:[1,0,0],V:[0,0,-1],w:LW-2*LT,h:LZ-LT,n:[0,-1,0],c:'vel'},
{o:[LT,LT,LZ-LT],U:[1,0,0],V:[0,0,-1],w:LW-2*LT,h:LZ-LT,n:[0,1,0],c:'vel'},
{o:[LT,LT,LZ-LT],U:[0,1,0],V:[0,0,-1],w:IH,h:LZ-LT,n:[1,0,0],c:'side vel'},
{o:[0,0,0],U:[1,0,0],V:[0,1,0],w:LW,h:LD,n:[0,0,-1],c:'top tol',rim:1},
{o:[0,0,LZ],U:[1,0,0],V:[0,1,0],w:LW,h:LD,n:[0,0,1],c:'top tol',lid:1},
{o:[0,LD,LZ],U:[1,0,0],V:[0,0,-1],w:LW,h:LZ,n:[0,1,0],c:'tol',front:1},
{o:[0,0,LZ],U:[1,0,0],V:[0,0,-1],w:LW,h:LZ,n:[0,-1,0],c:'tol',seam:1},
{o:[LW,LD,LZ],U:[0,-1,0],V:[0,0,-1],w:LD,h:LZ,n:[1,0,0],c:'side tol',seam:1}];
function lidXf(t){const A=ease(clamp(t/.28)),B=ease(clamp((t-.28)/.34)),th=Math.PI*ease(clamp((t-.5)/.42)),ca=Math.cos(th),sa=Math.sin(th);
const z=t<.62?32+52*A:84-62*ease((t-.62)/.38),c=[72-150*B,65+24*B,Math.max(z,65*Math.abs(sa)+22*Math.abs(ca))],R=v=>[v[0],v[1]*ca-v[2]*sa,v[1]*sa+v[2]*ca];
return{R,pt:q=>{const r=R([q[0]-LW/2,q[1]-LD/2,q[2]-LZ/2]);return[c[0]+r[0],c[1]+r[1],c[2]+r[2]];}};}
function drawLid(t,g){g.textContent='';const{R,pt}=lidXf(t);
for(const f of FACES){const n=R(f.n);if(n[0]+n[1]+n[2]<=.01)continue;const fg=group(plane(pt(f.o),R(f.U),R(f.V)),g);
if(f.rim){el('path',{d:`M0,0H${LW}V${LD}H0Z M${LT},${LT}V${LD-LT}H${LW-LT}V${LT}Z`,class:'face '+f.c,'fill-rule':'evenodd'},fg);continue;}
rect(fg,0,0,f.w,f.h,f.fl||f.c.includes('vel')?.4:2.4,'face '+f.c);
if(f.seam||f.front){line(fg,3,2,f.w-3,2,'seam');line(fg,3,f.h-2,f.w-3,f.h-2,'seam');}
if(f.front){text(fg,LW/2,17,'Vela','brand center');for(const u of[34,110]){rect(fg,u-4.5,LZ-6.4,9,5,1,'face chrome');line(fg,u-2.6,LZ-3.9,u+2.6,LZ-3.9);}}
if(f.lid){rect(fg,6,6,LW-12,LD-12,4,'seam');for(const u of[55,89])rect(fg,u-3,60,6,10,1.4,'face chrome');}
if(f.fl){const k=group(`matrix(1 0 0 -1 0 ${IH})`,fg);
rect(k,10,10,44,28,1.4,'face card');text(k,32,19.5,'VELA 9','plate center').style.fontSize='4px';k.append(' ');for(let i=0;i<4;i++)line(k,16,25+i*3.2,i===3?38:48,25+i*3.2);
circle(k,82,27,11,'face rb2');circle(k,82,27,9.3,'face top chrome');circle(k,82,27,7.6,'detail');text(k,82,26.6,'VELA','plate center');k.append(' ');text(k,82,30.2,'RIBBON','plate center').style.fontSize='1.7px';
rect(k,26,44,5,32,2.5,'face rub');rect(k,24.6,75,7.8,11,1.4,'face felt');for(let i=1;i<4;i++)line(k,24.6+i*1.95,75.6,24.6+i*1.95,85.4);rect(k,44,48,3.4,30,1.2,'face card');rect(k,43.6,44.6,4.2,4,1,'face rb2');
rect(k,4,58,LW-2*LT-8,7,1,'face side tol');line(k,6,59.4,LW-2*LT-6,59.4,'seam');line(k,6,63.6,LW-2*LT-6,63.6,'seam');}}
if(R([0,0,1])[2]>.2){const h=[[59,LD/2,LZ],[61,LD/2,LZ+6],[83,LD/2,LZ+6],[85,LD/2,LZ]].map(pt);el('path',{d:poly(h),class:'cu','stroke-width':4.6},g);el('path',{d:poly(h),class:'cb','stroke-width':3.4},g);}}
for(const g of[lidBack,topLid]){button(g,'VELA 9 VELA RIBBON: case lid, put on or lift off (Esc)');bind(g,()=>lid());}
// State: the letter on the sheet, carriage, ribbon, spools, lid and the idle demo. Strikes drive typebars, keys, the vibrator and escapement.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),hk={};
const LETTER=['Dear Ada,','','The VELA came today, light as','a book and quick as a sparrow.','Its keys answer like a small','piano, and the bell rings just','before the margin, as though','it knows. Write back soon.','','               Yours, Theo'],MAXL=10,TOPM=12;
let fold=0,foldD=-1,lines=[],cur=-1,col=0,red=false,caps=false,lidOn=false,lidT=1,lidDrawn=-1,carX=0,carV=0,carT=0,scroll=0,paperH=1,sheet=0,retOn=false,retT=-1e4,escT=0,levA=0,levD=-1,knA=0,knT=0,knD=-1,wind=.36,wdir=1,spA=0,spR=0,ribK='',flash=0,msg='',msgT=0,lt=0,lastUI=0,lastIn=0,ac=null,nb=null;
const demo={l:5,c:15,t:0,on:false,sync:true},strikes=[];
function say(m){announcement.textContent=m;}
function note(m,a){msg=m;msgT=performance.now()+1600;lastUI=0;if(a)say(a);}
function newLine(){cur++;lines.push({g:el('g',{},textG)});return lines[cur];}
function putChar(L,ch,k,r){const t=text(L.g,f2(6+k*CW),f2((Math.random()-.5)*.22),ch,'ty center'+(r?' r':''));t.style.opacity=f2(.8+Math.random()*.2);}
LETTER.slice(0,5).forEach(s=>{const L=newLine();[...s].forEach((ch,k)=>ch!==' '&&putChar(L,ch,k));});
{const L=newLine();[...LETTER[5].slice(0,15)].forEach((ch,k)=>ch!==' '&&putChar(L,ch,k));}
col=15;carT=carX=-col*CW;scroll=cur;
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();nb=ac.createBuffer(1,ac.sampleRate/4,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function nz(at,f,v,d,q=1.2,type='bandpass'){if(!ac)return;const t=ac.currentTime+at,s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;b.type=type;b.frequency.value=f;b.Q.value=q;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(ac.destination);s.start(t,Math.random()*.15,d+.03);}
function tn(at,f,v,d,type='sine'){if(!ac)return;const t=ac.currentTime+at,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}
const bell=()=>{tn(0,2350,.045,1.4);tn(0,6486,.012,.6);tn(0,12690,.005,.25);};
function press(k,ms=110){const o=KEYS[k];if(!o)return;o.g.classList.add('down');clearTimeout(o.to);o.to=setTimeout(()=>{if(!(k==='Lock'&&caps))o.g.classList.remove('down');},ms);}
const SHF={'!':'1','@':'2','#':'3','$':'4','%':'5','^':'6','&':'7','*':'8','(':'9',')':'0','_':'-',':':';','"':"'",'<':',','>':'.','?':'/'};
const busy=()=>lidOn||lidT<.98||sheet>0;
function refuse(q){if(!q)tn(0,300,.02,.06,'triangle');note(lidOn||lidT<.98?'LID ON · ESC TO LIFT IT':'NEW SHEET · ONE MOMENT');}
function user(){lastIn=performance.now();demo.on=false;demo.sync=false;audio();}
function type(ch,q){if(busy())return refuse(q);const now=performance.now();
if(ch===' '){press(' ');if(col<MAXC){col++;escT=now+35;if(!q){nz(0,900,.04,.03);nz(.035,5200,.025,.01,3);}}lastUI=0;return;}
if(col>=MAXC){if(!q)tn(0,300,.02,.06,'triangle');note('MARGIN · PRESS ENTER','Margin reached. Press Enter to return the carriage.');return;}
const base=SHF[ch]||ch.toLowerCase(),sh=ch!==ch.toLowerCase()||!!SHF[ch];press(base);if(sh)press('ShiftL',150);
strikes.push({b:BAR_OF[base]||BARS[ch.charCodeAt(0)*7%42],t0:now,ch,c:col,line:cur,r:red,sh});
if(!q){nz(0,1300,.025,.02);nz(.046,2600,.11,.03);tn(.046,150,.045,.05,'triangle');nz(.05,700,.05,.04,.8,'lowpass');nz(.072,5200,.03,.01,3);}
col++;escT=now+72;if(col===MAXC-6){if(!q)setTimeout(bell,70);flash=1.6;note('BELL · 6 TO THE MARGIN');}lastUI=0;}
function back(){if(busy())return refuse();press('Backspace');if(col>0){col--;escT=0;carT=-col*CW;nz(0,1600,.05,.02);}lastUI=0;}
function ret(q){if(busy())return refuse(q);if(cur+1>=MAXL)return newSheet(q);
retT=performance.now();retOn=true;escT=0;newLine();col=0;knT+=22.5;setTimeout(()=>{if(retOn)carT=0;},110);
if(!q){for(const a of[0,.03,.06])nz(a,3000,.04,.012,4);nz(.11,600,.05,.3,.5,'lowpass');}say(`Carriage returned. Line ${cur+1}.`);lastUI=0;}
function newSheet(q){sheet=1;retOn=false;escT=0;col=0;carT=0;knT+=90;if(!q)nz(0,1400,.05,.5,.6);say('The sheet rolls out and a fresh one goes in.');lastUI=0;}
function ribbon(r){if(red===r)return;red=r;nz(0,3200,.05,.015,3);say(r?'Red ribbon.':'Black ribbon.');lastUI=0;}
function tab(){if(busy())return refuse();press('Tab');if(col<MAXC){col=Math.min(MAXC,(Math.floor(col/5)+1)*5);escT=0;carT=-col*CW;nz(0,2400,.04,.02,2);nz(.04,800,.04,.08,.6,'lowpass');}lastUI=0;}
function lockKey(){caps=!caps;KEYS.Lock.g.classList.toggle('down',caps);nz(0,2000,.04,.02,2);say(caps?'Shift lock on.':'Shift lock off.');lastUI=0;}
function lid(){user();lidOn=!lidOn;demo.on=false;set(hk.escape,'aria-pressed',lidOn);nz(0,180,.08,.2,.7,'lowpass');tn(0,85,.05,.15);say(lidOn?'The sheet rolls out, the carriage centers, the paper rest folds and the lid goes on.':'Lid lifted off; the sheet rolls back in.');lastUI=0;}
bind(lev,()=>{user();ret();});bind(sel,()=>{user();ribbon(!red);});bind(KEYS.Backspace.g,()=>{user();back();});
document.querySelectorAll('.hint [data-k]').forEach(b=>{hk[b.dataset.k]=b;b.addEventListener('click',()=>{if(b.dataset.k==='enter'){user();ret();}else lid();});});
svg.addEventListener('pointerdown',e=>{const g=e.target.closest('.key');if(!g)return;const k=g.dataset.k;if(k==='Backspace')return;e.preventDefault();user();
if(k==='Tab')tab();else if(k==='Lock')lockKey();else if(k.length>1){press(k,140);nz(0,1800,.03,.02);}else type(caps?k.toUpperCase():k);});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key,onBtn=e.target.closest&&e.target.closest('button,[role=button]');
if(k==='Enter'){if(onBtn)return;e.preventDefault();user();if(!e.repeat)ret();}
else if(k==='Backspace'){e.preventDefault();user();back();}else if(k==='ArrowUp'||k==='ArrowDown'){e.preventDefault();user();ribbon(k==='ArrowDown');}
else if(k==='Escape'){e.preventDefault();if(!e.repeat)lid();}else if(k==='CapsLock'){user();lockKey();}
else if(k.length===1){if(k===' '&&onBtn)return;e.preventDefault();user();type(caps&&/[a-z]/.test(k)?k.toUpperCase():k);}});
// Idle demo: after a quiet spell the machine finishes its letter, returns, and feeds a new sheet at the end. Silent; any input takes over.
function demoStep(now){
if(!demo.on){if(reduced.matches||now-lastIn<5200||busy()||strikes.length)return;demo.on=true;demo.t=now+500;}
if(now<demo.t||busy())return;
if(!demo.sync){if(col>0){ret(true);demo.t=now+900;}if(demo.c>0){demo.l++;demo.c=0;}demo.sync=true;return;}
if(demo.l>=LETTER.length){newSheet(true);demo.l=0;demo.c=0;demo.t=now+1600;return;}
const L=LETTER[demo.l];
if(demo.c<L.length){const ch=L[demo.c++];type(ch,true);demo.t=now+(ch===' '?70:95)+Math.random()*120+(/[,.]/.test(ch)?240:0)+(demo.c===1?200:0);}
else{demo.l++;demo.c=0;if(demo.l>=LETTER.length){demo.t=now+3200;}else{ret(true);demo.t=now+1100;}}}
// Geometry per frame.
function radii(){const k=8*8-4.6*4.6;SPL.r=Math.sqrt(4.6*4.6+k*(1-wind));SPR.r=Math.sqrt(4.6*4.6+k*wind);for(const sp of[SPL,SPR]){sp.roll.textContent='';into(sp.roll);cylinder(sp.x,sp.y,36.4,sp.r,2.3,'z','rb2');cylinder(sp.x,sp.y,38.7,sp.r,2.3,'z','rb1');into(draw);}}
radii();draw.appendChild(rib);draw.appendChild(strikeL);draw.appendChild(topLid);
BARS.forEach(b=>{b.mark=document.createComment('');b.home.insertBefore(b.mark,b.g.nextSibling);});
function tick(now){
const dt=Math.min(.05,(now-(lt||now))/1000),rm=reduced.matches;lt=now;demoStep(now);
let pW=sheet===1||lidOn?0:1;const cT=lidOn?-36:carT,fW=lidOn?(paperH<.03&&Math.abs(carX+36)<.4?1:0):(lidT>.97?0:1);
fold=rm?fW:fold+clamp(fW-fold,-dt*3.2,dt*3.2);const lidW=lidOn&&fold>.97?0:1;if(!lidOn&&(lidT<.97||fold>.03))pW=0;
lidT=rm?lidW:lidT+clamp(lidW-lidT,-dt*.9,dt*.9);
paperH=rm?pW:paperH+clamp(pW-paperH,-dt*2.2,dt*1.8);
if(sheet===1&&paperH<.02){textG.textContent='';lines=[];cur=-1;newLine();scroll=0;sheet=2;}else if(sheet===2&&paperH>.98)sheet=0;
if(escT&&now>=escT){escT=0;carT=-col*CW;}
if(rm){carX=cT;carV=0;}else for(let n=Math.ceil(dt/.004),i=0;i<n;i++){const h=dt/n;carV=clamp(carV+(2600*(cT-carX)-75*carV)*h,-320,320);carX+=carV*h;}
if(retOn&&now-retT>160&&Math.abs(carX)<.5){retOn=false;if(ac&&now-lastIn<4000)tn(0,110,.06,.09,'triangle');}
levA+=((retOn&&now-retT<900?1:0)-levA)*(rm?1:clamp(dt*(retOn?30:12)));
scroll+=(cur-scroll)*(rm?1:clamp(dt*14));knA+=(knT-knA)*(rm?1:clamp(dt*12));spR+=(spA-spR)*(rm?1:clamp(dt*10));
if(Math.abs(fold-foldD)>.002){foldD=fold;const a=(15+75*fold)*D;set(rest,'transform',plane([61,13.5,50],[1,0,0],[0,-Math.sin(a),Math.cos(a)]));}
if(lidDrawn<0||Math.abs(lidT-lidDrawn)>.001){lidDrawn=lidT;const bk=lidT>.9;drawLid(lidT,bk?lidBack:topLid);(bk?topLid:lidBack).textContent='';}
let lift=0,dz=0;
for(let i=strikes.length-1;i>=0;i--){const s=strikes[i],e=now-s.t0,u=rm?0:e<46?(e/46)**2:e<120?1-ease((e-46)/74):e<175?-.07*Math.sin(Math.PI*(e-120)/55):0;
if(!s.done&&(rm||e>=46)){s.done=1;if(lines[s.line])putChar(lines[s.line],s.ch,s.c,s.r);flash=Math.max(flash,1);wind+=.004*wdir;if(wind>1||wind<0){wdir*=-1;wind=clamp(wind);}spA+=16;radii();}
if(!rm&&e<175&&s.b.g.parentNode!==strikeL){strikeL.appendChild(s.b.g);s.b.g.classList.add('strike');}
barPath(s.b,BETA0+u*(BETAS-BETA0));lift=Math.max(lift,clamp(u*1.3)*(s.r?4.3:2));if(s.sh&&u>0)dz=.9;
if(rm||e>=175){barPath(s.b,BETA0);s.b.g.classList.remove('strike');s.b.home.insertBefore(s.b.g,s.b.mark);strikes.splice(i,1);}}
set(car,'transform',`translate(${f2(carX*C)} ${f2(carX*S+dz)})`);
const H=2.7+scroll*LH+TOPM,Hv=H*paperH;set(sheet_,'y',f2(-Hv));set(sheet_,'height',f2(Math.max(.01,Hv)));set(pcr,'y',f2(-Hv));set(pcr,'height',f2(Hv));sheet_.style.display=Hv<.2?'none':'';
lines.forEach((L,i)=>set(L.g,'transform',`translate(0 ${f2(-2.7-(scroll-i)*LH+H-Hv)})`));
const rk=f2(lift)+f2(SPL.r);if(rk!==ribK){ribK=rk;drawRibbon(lift);}
for(const sp of[SPL,SPR]){set(sp.rot,'transform',`rotate(${f2(spR)})`);set(sp.rh,'transform',`rotate(${f2(spR)})`);}
if(Math.abs(knA-knD)>.05){knD=knA;set(knR,'transform',`rotate(${f2(knA)})`);}
if(Math.abs(levA-levD)>.002){levD=levA;const a=levA*.42,pv=[57,22,53],tip=[pv[0]-5*Math.cos(a)+16*Math.sin(a),pv[1]+5*Math.sin(a)+16*Math.cos(a),54],d=poly([pv,[pv[0]-1.6+3*a,pv[1]+5,53.8],tip]);
for(const p of[levA_,levB,levR])set(p,'d',d);const q=(dx,dy,dz2)=>[tip[0]+dx,tip[1]+dy,tip[2]+dz2];set(levP,'d',poly([q(-2.6,-1,0),q(2.6,-1,0),q(2.6,4,.9),q(-2.6,4,.9)],true));set(levF,'d',poly([q(-4,-2.4,0),q(4,-2.4,0),q(4,5.4,.9),q(-4,5.4,.9)],true));}
set(selK,'transform',red?`translate(${f2(-7*C)} ${f2(7*S)})`:'');
flash=Math.max(0,flash-dt*3.2);const br=rm?1:.62+.38*Math.sin(now/520),off=lidOn||paperH<.5;caret.style.opacity=f2(off?.25:Math.max(br,Math.min(1,flash)));halo.style.opacity=f2(off?0:.18*br+.5*Math.min(1,flash));
if(!lastUI||now-lastUI>140){lastUI=now;readout.textContent=`LINE ${cur+1} · COL ${col} · ${red?'RED':'BLACK'}${caps?' · CAPS':''}`;
stateLabel.textContent=now<msgT?msg:lidOn?(lidT>.02?'LID GOING ON':'LID ON · ESC TO LIFT IT'):lidT<.98?'LIFTING THE LID':sheet?'NEW SHEET':retOn?'CARRIAGE RETURN':demo.on?'DEMO · TYPE TO TAKE OVER':col>=MAXC?'MARGIN · PRESS ENTER':col>=MAXC-6?`BELL · ${MAXC-col} TO THE MARGIN`:'READY · TYPE ON YOUR KEYBOARD';}
requestAnimationFrame(tick);}
requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['enter', 'escape'], draw }
