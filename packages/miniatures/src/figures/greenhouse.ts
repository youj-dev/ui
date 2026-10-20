// @ts-nocheck
/* VERDA G–14 · Greenhouse. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--pane:#d3e6e9;--pane-a:.3;--sheen:.55;--brick:#b8664b;--brick-s:#99523b;--mortar:#e3d3c6;--stone:#ebe6dd;--stone-s:#cfc8bc;--terra:#cf7a52;--terra-top:#e39470;--terra-side:#ad5f3b;--soil:#5c4535;--lf1:#69a74d;--lf2:#8fc26c;--lf3:#3d7b3a;--lfl:#2d5528;--fl:#e85a73;--fl2:#f2c03f;--fruit:#e2502e;--citrus:#f29a2c;--wood:#cfa676;--wood-top:#e1bf93;--wood-side:#ad8659;--tray:#3c3c3b;--tray-top:#4d4d4b;--butt:#4c5a4f;--butt-top:#5d6c60;--cane:#c7a067;--grow:#ff3ccf;--drop:#7fb0ff;--lamp:#ffb648;--scr:#3b5bfd;--gl:.22;--gp:.32;--fr:#ededea;--fr-s:#d3d3cf}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--pane:#b2c2c4;--brick:#9b553e;--brick-s:#804430;--mortar:#bfb2a7;--stone:#c5c2bc;--stone-s:#908d89;--terra:#ae6644;--terra-top:#d48a68;--terra-side:#794127;--soil:#4c392b;--lf1:#578c3f;--lf2:#78a35a;--lf3:#32672f;--lfl:#244620;--fl:#c34b60;--fl2:#cca134;--fruit:#be4225;--citrus:#cc8123;--wood:#ae8b62;--wood-top:#d2b389;--wood-side:#795d3d;--tray:#313130;--tray-top:#474746;--butt:#414a43;--butt-top:#566559;--cane:#a78656;--grow:#ff3ccf;--drop:#8fb2ff;--lamp:#ffb648;--scr:#617cff;--gl:.3;--gp:.5;--fr:#c8c8c6;--fr-s:#959593;--line:#444443}:root:not(.night) svg{--ink:#282828;--muted:#6b6b6b}}
:root.night .lit .inside{--lf1:#5a3a63;--lf2:#74497f;--lf3:#432a4b;--lfl:#24132a;--terra:#6a3046;--terra-top:#7e3a54;--terra-side:#55263a;--soil:#2a1424;--wood:#2e2229;--wood-top:#3a2a34;--wood-side:#241a20;--tray:#161014;--tray-top:#1d151a;--fl:#ff6fae;--fruit:#ff5f6f;--citrus:#ff9f7a;--stone:#3a2436}
:root.night{--bg:#060606;--ink:#cfcfcf;--muted:#5c5c5c;--top:#1c1c1c;--body:#151515;--side:#111;--base:#0d0d0d;--recess:#090909;--glass:#070707;--line:#3a3a3a;--rule:#1a1a1a;--shadow:#000;--off:#161616;--pane:#2a2a2a;--pane-a:.16;--sheen:.05;--brick:#3a2119;--brick-s:#2c1913;--mortar:#221a16;--stone:#222;--stone-s:#1a1a1a;--terra:#4a2a1d;--terra-top:#573222;--terra-side:#3a2016;--soil:#140f0b;--lf1:#24401d;--lf2:#2f5026;--lf3:#1a3317;--lfl:#0f1f0d;--fl:#5e2630;--fl2:#5e4c1c;--fruit:#5e2416;--citrus:#5e3d15;--wood:#2e261d;--wood-top:#372d22;--wood-side:#241d16;--tray:#0b0b0b;--tray-top:#101010;--butt:#141414;--butt-top:#1a1a1a;--cane:#3a2f20;--gl:.42;--gp:.45;--fr:#181818;--fr-s:#121212}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.micro{font-size:2.4px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.fr{fill:var(--fr)}.top.fr{fill:var(--top)}.side.fr{fill:var(--fr-s)}.brick{fill:url(#brick)}.side.brick{fill:url(#brickS)}.stone{fill:var(--stone)}.side.stone{fill:var(--stone-s)}.top.stone{fill:var(--stone)}.terra{fill:var(--terra)}.top.terra{fill:var(--terra-top)}.side.terra{fill:var(--terra-side)}.soil{fill:var(--soil)}.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.tray{fill:var(--tray)}.top.tray{fill:var(--tray-top)}.butt{fill:var(--butt)}.top.butt{fill:var(--butt-top)}.brk{fill:var(--brick)}.brkS{fill:var(--brick-s)}.mortar{fill:none;stroke:var(--mortar);stroke-width:.5}
.pane{fill:var(--pane);fill-opacity:calc(var(--pane-a) + var(--fog,0));stroke:none}.sheen{fill:#fff;opacity:var(--sheen);stroke:none}.bu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.bb{fill:none;stroke:var(--top);stroke-linecap:round;stroke-linejoin:round}.cane{stroke:var(--cane)}.pipe{stroke:var(--body)}.hose{stroke:var(--tray)}
.leaf{stroke:var(--lfl);stroke-width:.35;vector-effect:non-scaling-stroke;stroke-linejoin:round}.stem{fill:none;stroke:var(--lfl);stroke-width:.5;stroke-linecap:round}.fl{fill:var(--fl);stroke:none}.fl2{fill:var(--fl2);stroke:none}.fruit{fill:var(--fruit);stroke:var(--lfl);stroke-width:.3;vector-effect:non-scaling-stroke}.citrus{fill:var(--citrus);stroke:var(--lfl);stroke-width:.3;vector-effect:non-scaling-stroke}
.shaft{opacity:0;transition:opacity .6s;filter:url(#soft)}.lit .shaft{opacity:var(--gl)}.pool{fill:var(--grow);opacity:0;filter:url(#bloom);transition:opacity .6s}.lit .pool{opacity:var(--gp)}.bar-glow{fill:var(--off)}.lit .bar-glow{fill:var(--grow);filter:url(#glow)}
.drop{fill:var(--drop);stroke:none}.haze{fill:var(--drop);opacity:0;filter:url(#bloom);transition:opacity .8s}.misting .haze{opacity:.22}
.lamp{fill:var(--off);stroke:var(--line);stroke-width:.3;vector-effect:non-scaling-stroke}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.b{filter:url(#glow);stroke:none}
.lan{fill:var(--glass)}.night .lan{fill:var(--lamp);filter:url(#glow)}.lanhalo{fill:var(--lamp);opacity:0;filter:url(#bloom);transition:opacity .8s}.night .lanhalo{opacity:.55}
.scr{fill:var(--scr);font:2.6px ui-monospace,monospace;stroke:none}.screen{fill:#17181a}.blade{fill:var(--top);stroke:var(--line);stroke-width:.4;vector-effect:non-scaling-stroke}.blur{fill:var(--line);opacity:0}.air{fill:none;stroke:var(--line);stroke-width:.5;stroke-dasharray:3 9;stroke-linecap:round;opacity:0;transition:opacity .5s}.fanning .air{opacity:.5}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
.bu,.bb,.shaft,.pool,.drop,.haze,.sheen,.air,.lanhalo{pointer-events:none}
.fade,.fade *{transition:fill .9s,stroke .9s,background-color .9s,color .9s,border-color .9s,opacity .9s!important}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}:root.night .stage-floor,:root.night .stage-contact,:root.night .stage-pool{display:none}}`

const defs = `<pattern id="brick" width="8" height="6" patternUnits="userSpaceOnUse"><rect width="8" height="6" class="brk"/><path d="M0,3H8M0,6H8M2,0V3M6,3V6" class="mortar"/></pattern>
<pattern id="brickS" width="8" height="6" patternUnits="userSpaceOnUse"><rect width="8" height="6" class="brkS"/><path d="M0,3H8M0,6H8M2,0V3M6,3V6" class="mortar"/></pattern>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* VERDA G–14. World: x lower-right, y lower-left, z up; 1 unit ≈ 3 cm. Ridge along x at y 48.
Part                         x      y      z      w      d      h
plinth (stone)              -3     -3      0    196    102      2
dwarf walls (brick)     0/184   0/90      2   6/190   96/6     18   coping to z 22.5; door gap y 34–62 in the near gable
glass walls             z 22.5–70; 10 bays of 19 along x, transom z 48; gables glazed to the roof line
roof                    eaves z 70, ridge z 104 at y 48; rafters every 19; 4 hinged vents on the front slope
ridge, cresting, finials     -2     46    102    194      4      4
gutters + downpipe      y −4 / 99.5, z 66; downpipe at x 191 to the water butt
benches (2)                 12   8 / 68      0    164     20     28   slatted top, lower shelf
plants                  trays, ferns, succulents, geraniums, herbs, snake plants, tomatoes on canes, citrus, baskets
mist line                    4     48     93    182      –      –   7 nozzles
grow bars (2)               20  22 / 74     84    150      2      2   shafts and pools on the benches
fan                     x 24, y 48, z 84, r 9, faces +x
controller                 104      6     40     12      2      8   back wall, inner face
door                    x 190, y 34–62, z 2–66   glazed, kick plate, handle, lantern
water butt              r 8.5 at 201 84             2      –      –     24
Painter: far glass, floor, benches and plants by depth, overhead kit, light, near walls, near glass, frame, outside. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: oriented planes, glazing bars, panes with sheen, plants drawn in screen space at a projected anchor.
const RAD=Math.PI/180,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),draw=root,into=g=>root=g;
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`;
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
function bar(segs,w=1.4,parent=root){const d=segs.map(s=>poly(s)).join(' ');el('path',{d,class:'bu','stroke-width':w+1.1},parent);el('path',{d,class:'bb','stroke-width':w},parent);}
function pane(pts,sheen=true){const n=el('path',{d:poly(pts,true),class:'pane'});if(sheen){const[a,b,c,d]=pts,m=(p,q,t)=>p.map((v,i)=>v+(q[i]-v)*t);for(const[t0,w]of[[.15,.045],[.215,.018],[.6,.028]])el('path',{d:poly([m(a,b,t0),m(a,b,t0+w),m(d,c,t0+w+.06),m(d,c,t0+.06)],true),class:'sheen'});}return n;}
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const p of pts){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(const p of pts.reverse()){while(hi.length>1&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
function route(pts,r=4){let d='M'+P(...pts[0]);for(let i=1;i<pts.length-1;i++){const a=pts[i-1],b=pts[i],c=pts[i+1],la=Math.hypot(...b.map((v,j)=>v-a[j])),lc=Math.hypot(...c.map((v,j)=>v-b[j])),p=b.map((v,j)=>v+(a[j]-v)*Math.min(r,la/2)/la),q=b.map((v,j)=>v+(c[j]-v)*Math.min(r,lc/2)/lc);d+='L'+P(...p)+'Q'+P(...b)+' '+P(...q);}return d+'L'+P(...pts[pts.length-1]);}
function lamp(g,x,y,r=.8){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
const LC=['var(--lf1)','var(--lf2)','var(--lf3)'];
function leaf(g,x,y,len,ang,w,c=LC[(rnd()*3)|0]){const a=ang*RAD,dx=Math.cos(a)*len,dy=Math.sin(a)*len,nx=-Math.sin(a)*w,ny=Math.cos(a)*w;
el('path',{d:`M${x.toFixed(2)},${y.toFixed(2)}Q${(x+dx/2+nx).toFixed(2)},${(y+dy/2+ny).toFixed(2)} ${(x+dx).toFixed(2)},${(y+dy).toFixed(2)}Q${(x+dx/2-nx).toFixed(2)},${(y+dy/2-ny).toFixed(2)} ${x.toFixed(2)},${y.toFixed(2)}Z`,class:'leaf',style:`fill:${c}`},g);}
const plants=[];
function plant(x,y,z,kind,s0=.5){const q=P(x,y,z),g=el('g',{}),b=el('g',{},g),late=el('g',{},g);
({fern(){for(let i=0;i<9;i++){const a=-168+i*19.5+rnd()*6;leaf(b,0,0,9+rnd()*4,a,1.5);}},
rosette(){for(let r=0;r<2;r++)for(let i=0;i<8;i++){const a=i*45+r*22;leaf(b,0,-1.4*r,4.2-r*1.2,a<180?a-180:a,1.4,r?'var(--lf2)':'var(--lf3)');}leaf(b,0,-2,1.8,-90,1,'var(--lf2)');},
bush(){for(const[dx,dy,r]of[[-3.5,-2.5,3.2],[3.2,-2.8,3],[0,-5.6,3.4],[-2,-7.6,2.6],[2.4,-7.4,2.6],[0,-2,3]])circle(b,dx,dy,r,'leaf').style.fill=LC[(rnd()*3)|0];for(const[dx,dy]of[[-2.6,-8.8],[2.8,-8.4],[0,-9.6],[-4.6,-4.2],[4.4,-5]])circle(late,dx,dy,1.05,'fl');},
herb(){for(let i=0;i<12;i++){const a=-150+i*10+rnd()*8,l=4+rnd()*3.6;leaf(b,0,0,l,a,1.8);}for(let i=0;i<4;i++)circle(late,-3+i*2,-6.4-rnd()*1.6,.6,'fl2');},
spike(){for(let i=0;i<7;i++)leaf(b,-2.4+i*.8,0,10+rnd()*5,-90+(i-3)*7,1.1,i%2?'var(--lf3)':'var(--lf1)');},
tree(){el('path',{d:'M0,0C.6,-5 -.6,-9 0,-13',class:'stem',style:'stroke-width:1.2;stroke:var(--wood-side)'},b);for(const[dx,dy,r]of[[0,-16,5],[-4.6,-14,3.6],[4.6,-14.4,3.8],[-2.8,-19.6,3.6],[3,-19.6,3.6],[0,-21.6,3]])circle(b,dx,dy,r,'leaf').style.fill=LC[(rnd()*3)|0];for(const[dx,dy]of[[-3.6,-12.6],[3.4,-15.6],[-1,-18.2],[4.6,-11.8],[-5,-16.4]])circle(late,dx,dy,1.25,'citrus');},
vine(){el('path',{d:'M0,0V-44',class:'stem',style:'stroke:var(--cane);stroke-width:.7'},b);let d='M0,0';for(let i=1;i<=9;i++)d+=`L${(i%2?1.4:-1.4)},${-i*4.6}`;el('path',{d,class:'stem',style:'stroke-width:.8'},b);for(let i=1;i<9;i++){const y=-i*4.6;leaf(b,i%2?1.4:-1.4,y,5.2+rnd()*2,i%2?-20:200,2.1);leaf(b,i%2?1.4:-1.4,y-1.4,4.2,i%2?-70:250,1.6);leaf(b,i%2?-1.4:1.4,y-2.4,3.4,i%2?205:-25,1.3);}for(const[dx,dy]of[[2,-11],[-2.2,-17],[2.4,-24],[-1.8,-29],[1.2,-15.4]])circle(late,dx,dy,1.35,'fruit');},
trail(){for(let i=0;i<9;i++){const a=10+i*20,l=5+rnd()*5;leaf(b,(i-4)*1.2,0,l,a+rnd()*12,1.4);}for(let i=0;i<5;i++)circle(late,-4+i*2,2+rnd()*3,.7,'fl');}})[kind]();
plants.push({g,b,late,q,s0,s:-1,k:.8+rnd()*.35,ph:rnd()*6.28,m:1.55});return g;}
function pot(x,y,z,r,h,kind,s0){cylinder(x,y,z,r*.82,h-1.6,'z','terra');cylinder(x,y,z+h-1.6,r,1.6,'z','terra');ellipse(x,y,z+h-.4,r-.7,'z','face soil');plant(x,y,z+h-.4,kind,s0);}
function tray(x,y,w,d,z=28){box(x,y,z,w,d,2.6,.8,'tray');const t=group(TOP(x,y,z+2.65));for(let i=1;i<6;i++)line(t,i*w/6,.6,i*w/6,d-.6);for(let j=1;j<4;j++)line(t,.6,j*d/4,w-.6,j*d/4);
for(let j=3;j>=0;j--)for(let i=0;i<6;i++){const q=P(x+(i+.5)*w/6,y+(j+.5)*d/4,z+2.6),g=el('g',{});el('path',{d:'M0,0V-2',class:'stem'},g);leaf(g,0,-2,2.4,-30,.9,'var(--lf2)');leaf(g,0,-2,2.4,210,.9,'var(--lf1)');plants.push({g,b:g,late:null,q,s0:.4,s:-1,k:.85+rnd()*.3,ph:rnd()*6.28,m:1.5});}}
function bench(x0,x1,y0,y1){const w=x1-x0,d=y1-y0;for(const x of[x0+1,x0+w/2-1.5,x1-4])for(const y of[y0+1,y1-4])box(x,y,0,3,3,25.4,.6,'wood');
box(x0+1,y0+1,7,w-2,d-2,1.6,.6,'wood');box(x0+1,y0+1,23.6,w-2,d-2,1.8,.4,'tray');for(let i=0;i<5;i++)box(x0,y0+i*d/5+.35,25.4,w,d/5-.7,2.6,.5,'wood');
wire([[x0+2,y0+2.5,28.3],[x1-2,y0+2.5,28.3]],'detail');}
// Assembly: plinth, far walls and glass, floor, benches, plants, overhead kit, near walls and glass, frame, outside.
const L=190,W=96,CAP=22.5,EH=70,RH=104,YM=48,BAY=19,zr=y=>EH+(RH-EH)*(1-Math.abs(y-YM)/YM);
{const s=P(L/2+8,W/2+4,0);el('ellipse',{cx:s[0],cy:s[1]+6,rx:150,ry:70,class:'shadow stage-floor'});el('ellipse',{cx:s[0],cy:s[1]+6,rx:150,ry:70,class:'stage-contact'});}
box(-3,-3,0,L+6,W+6,2,1,'stone');
box(0,0,2,L,6,18,.6,'brick');box(0,0,2,6,W,18,.6,'brick');box(-1,-1,20,L+2,8,2.5,.6,'stone');box(-1,-1,20,8,W+2,2.5,.6,'stone');
box(-1.5,-1.5,CAP,3,3,EH-CAP,.5,'fr');box(-2,-4.5,EH-4,L+4,3.5,3,1,'fr');box(0,-1.5,EH-3,L,3,3,.5,'fr');box(-1.5,0,EH-3,3,W,3,.5,'fr');
pane([[0,0,CAP],[L,0,CAP],[L,0,EH],[0,0,EH]],false);pane([[0,0,CAP],[0,W,CAP],[0,W,EH],[0,YM,RH],[0,0,EH]],false);pane([[0,0,EH],[L,0,EH],[L,YM,RH],[0,YM,RH]],false);
bar([...Array(9)].map((_,k)=>[[BAY*(k+1),0,CAP],[BAY*(k+1),0,EH]]).concat([[[0,0,48],[L,0,48]],[[0,0,EH],[L,0,EH]]]),1.1);
bar([16,32,YM,64,80].map(y=>[[0,y,CAP],[0,y,zr(y)]]).concat([[[0,0,48],[0,W,48]],[[0,0,EH],[0,YM,RH],[0,W,EH]]]),1.1);
bar([...Array(9)].map((_,k)=>[[BAY*(k+1),0,EH],[BAY*(k+1),YM,RH]]).concat([[[0,22,zr(22)],[L,22,zr(22)]]]),1.1);
// Controller on the back wall's inner face, then the floor and the path.
box(108,1,38,12,2,9,1,'');const cs=group(FRONT(108,3.05,47));rect(cs,1.2,1.2,7,5.4,.8,'face screen');const ctT=text(cs,4.7,3.8,'','scr center'),ctH=text(cs,4.7,6.2,'','scr center');const ctL=lamp(cs,10,2.4,.6);
const fl=group(TOP(6,6,2.05));rect(fl,0,0,L-12,W-12,.5,'face recess');for(let x=0;x<L-12;x+=6)for(let y=26;y<58;y+=4)rect(fl,x+(y%8?3:0),y,5.6,3.6,.4,'face stone');
// Benches with their plants, far bench first; tomatoes on canes at the far end; citrus by the door.
const IN=el('g',{class:'inside'});into(IN);
function fill(y0,seq){const it=[];let x=14;for(const q of seq){if(q==='t'){const X=x;it.push([X+y0+10,()=>tray(X,y0+1,22,18)]);x+=23.5;}else{const[a,ra,b,rb]=q,X=x;it.push([X+ra+y0+5.5,()=>pot(X+ra,y0+5.6,28,ra,ra+1.4,a,.55)],[X+ra*.9+rb+1.5+y0+14.5,()=>pot(X+ra*.9+rb+1.5,y0+14.6,28,rb,rb+1.2,b,.55)]);x+=Math.max(ra*2,ra*.9+rb*2+1.5)+1.2;}}it.sort((p,q)=>p[0]-q[0]).forEach(i=>i[1]());}
bench(12,176,8,28);fill(8,['t',['fern',6.2,'rosette',4],['spike',4.6,'herb',5],'t',['bush',5.6,'rosette',4.2],['fern',6,'spike',4.4],'t',['herb',5,'bush',5.4]]);
for(const[x,y]of[[12,40],[12,55]]){box(x-7,y-6,2,14,12,4,2.4,'face wood');for(const dy of[-2.8,2.8])plant(x,y+dy,6,'vine',.5);}
pot(170,38,2,8,10,'tree',.6);
bench(12,176,68,88);fill(68,[['bush',5.6,'rosette',4],'t',['fern',6.4,'herb',4.8],['spike',4.6,'rosette',4.2],'t',['herb',5,'bush',5.6],['fern',6.2,'rosette',4],['spike',4.4,'bush',4.8]]);
pot(170,58,2,7.4,9,'fern',.65);
// Drip line along both benches.
for(const y of[10.5,70.5])el('path',{d:poly([[8,y,30.2],[178,y,30.2]]),class:'bu','stroke-width':1.3}),el('path',{d:poly([[8,y,30.2],[178,y,30.2]]),class:'bb hose','stroke-width':.8});
// Overhead: fan at the far gable, mist line under the ridge, grow bars with shafts and pools, hanging baskets.
const fan=group(SIDE(26,YM,84));circle(fan,0,0,9.6,'face base');circle(fan,0,0,8.4,'face recess');const rot=el('g',{},fan);for(let i=0;i<5;i++)el('path',{d:'M0,-1.6C2.6,-2.6 5,-5 3.6,-8C1.4,-7.6 .2,-5 0,-1.6Z',class:'blade',transform:`rotate(${i*72})`},rot);const blur=circle(fan,0,0,8,'blur');for(const r of[8.8,6,3.4])circle(fan,0,0,r,'detail');line(fan,-8.8,0,8.8,0);line(fan,0,-8.8,0,8.8);circle(fan,0,0,1.8,'face top');
cylinder(18,YM,84,4,8,'x','base');wire([[22,YM,93],[22,YM,RH-2]],'detail');
for(const x of[60,130]){wire([[x,YM,RH-2],[x,YM,96]],'detail');const q=P(x,YM,84);const g=group(`translate(${q[0]} ${q[1]}) scale(1.35)`);el('path',{d:'M-5,0Q0,3.4 5,0',class:'face terra'},g);el('path',{d:'M-5,0Q0,-1.8 5,0Q0,1.6 -5,0Z',class:'face soil'},g);for(const s of[-4,-1.5,1.5,4])line(g,s,-.4,0,-12/1.35);into(g);plant(0,0,0,'trail',.55);into(draw);}
const glow=el('g',{});
for(const y of[22,74]){const pts=[[20,y,82.6],[170,y,82.6],[14,y-9,30],[176,y-9,30],[176,y+9,30],[14,y+9,30]].map(p=>P(...p)),o=P(95,y,82.6),gr=el('linearGradient',{id:'sh'+y,gradientUnits:'userSpaceOnUse',x1:o[0],y1:o[1],x2:o[0]-26,y2:o[1]+45},svg.querySelector('defs'));for(const[f,a]of[[0,.85],[.45,.3],[1,0]])el('stop',{offset:f,style:`stop-color:var(--grow);stop-opacity:${a}`},gr);el('path',{d:'M'+hull(pts).map(p=>p.map(v=>v.toFixed(1)).join(',')).join('L')+'Z',class:'shaft',fill:`url(#sh${y})`},glow);rect(group(TOP(16,y-9,30.6),glow),0,0,158,18,9,'pool');}
for(const y of[22,74]){for(const x of[40,150])wire([[x,y+1,84],[x,y+1,zr(y+1)-1]],'detail');box(20,y,82.6,150,2.2,1.8,.6,'');const u=group(FRONT(20,y+2.2,82.6));rect(u,1,.5,148,.9,.4,'bar-glow');}
const NZ=[...Array(7)].map((_,k)=>8+k*28);wire([[4,YM,93],[186,YM,93]],'bu').setAttribute('stroke-width',2);wire([[4,YM,93],[186,YM,93]],'bb pipe').setAttribute('stroke-width',1.2);
const hazeG=el('g',{class:'hz'});for(const x of NZ){cylinder(x,YM,91.2,.9,1.8,'z','base');const q=P(x,YM,80);el('ellipse',{cx:q[0],cy:q[1],rx:10,ry:7,class:'haze'},hazeG);}
const dropG=el('g',{});
into(draw);
// Near walls, near glass with the hinged roof vents, frame, ridge cresting and finials.
box(0,W-6,2,L,6,18,.6,'brick');box(L-6,0,2,6,34,18,.6,'brick');box(L-6,62,2,6,34,18,.6,'brick');box(-1,W-7,20,L+2,8,2.5,.6,'stone');box(L-7,-1,20,8,35,2.5,.6,'stone');box(L-7,61,20,8,36,2.5,.6,'stone');
pane([[0,YM,RH],[L,YM,RH],[L,W,EH],[0,W,EH]]);
bar([...Array(9)].map((_,k)=>[[BAY*(k+1),YM,RH],[BAY*(k+1),W,EH]]).concat([[[0,74,zr(74)],[L,74,zr(74)]]]),1.4);
const vents=[1,3,6,8].map(k=>({x:BAY*k,g:el('g',{})}));
pane([[0,W,CAP],[L,W,CAP],[L,W,EH],[0,W,EH]]);pane([[L,0,CAP],[L,34,CAP],[L,34,66],[L,0,66]],false);pane([[L,62,CAP],[L,W,CAP],[L,W,66],[L,62,66]],false);pane([[L,0,66],[L,W,66],[L,W,EH],[L,YM,RH],[L,0,EH]],false);
bar([...Array(9)].map((_,k)=>[[BAY*(k+1),W,CAP],[BAY*(k+1),W,EH]]).concat([[[0,W,48],[L,W,48]]]),1.4);
bar([16,80].map(y=>[[L,y,CAP],[L,y,EH]]).concat([[[L,0,48],[L,34,48]],[[L,62,48],[L,W,48]],[[L,34,CAP],[L,34,66],[L,62,66],[L,62,CAP]],[[L,YM,66],[L,YM,RH]],[[L,32,66],[L,32,zr(32)]],[[L,64,66],[L,64,zr(64)]]]),1.4);
const dg=group(SIDE(L+.15,61.5,65.5));rect(dg,0,0,27,63.5,.6,'face fr');rect(dg,3,3,21,26,.4,'pane');rect(dg,3,32,21,13,.4,'pane');rect(dg,3,48,21,12.5,.4,'face top');for(const[a,b]of[[3,3],[3,32]])line(dg,a+10.5,b,a+10.5,b+(b<10?26:13));circle(dg,23.6,36,1.1,'face base');rect(dg,22.8,33.6,1.6,1.2,.3,'face base');
box(L,32,0,6,32,2,.6,'stone');
for(const[x,y]of[[L,0],[0,W],[L,W]])box(x-1.5,y-1.5,CAP,3,3,EH-CAP,.5,'fr');
box(0,W-1.5,EH-3,L,3,3,.5,'fr');box(L-1.5,0,EH-3,3,W,3,.5,'fr');
bar([[[0,YM,RH],[0,W,EH]],[[L,0,EH],[L,YM,RH],[L,W,EH]]],2.4);
box(-2,46,RH-2,L+4,4,4,.8,'fr');{const t=group(FRONT(-2,50,RH+2));for(let x=4;x<L;x+=6){el('path',{d:`M${x-2.4},0Q${x},-3.4 ${x+2.4},0`,class:'detail'},t);circle(t,x,-3.2,.6,'face top');}}
for(const x of[-1,L+1]){cylinder(x,YM,RH+2,1.1,4,'z','fr');const q=P(x,YM,RH+8);el('circle',{cx:q[0],cy:q[1],r:2.6,class:'face top'});}
box(-2,W+.5,EH-4,L+4,3.5,3,1,'fr');{const t=group(TOP(-2,W+.5,EH-1));rect(t,.6,.8,L+2.8,1.9,.8,'face recess');}
el('path',{d:route([[L+.5,W+2.2,EH-4],[L+.5,W+2.2,56],[L+7,W-8,48],[L+7,W-8,26]],4),class:'bu','stroke-width':3.4});el('path',{d:route([[L+.5,W+2.2,EH-4],[L+.5,W+2.2,56],[L+7,W-8,48],[L+7,W-8,26]],4),class:'bb','stroke-width':2.4});
// Outside: water butt, lantern by the door, a watering can and stacked pots.
const wb=cylinder(201,84,2,8.5,24,'z','butt');circle(wb.face,0,0,6.2,'detail');for(const z of[8,18])ellipse(201,84,z,8.55,'z','detail');box(209,82,6,2.4,3,2,.5,'base');
const ln=group(SIDE(L+1.6,30,64));rect(ln,-1.6,-1,3.2,1,.4,'face fr');rect(ln,-1.3,0,2.6,4,.6,'lan');rect(ln,-1.6,4,3.2,.8,.4,'face fr');const lq=P(L+2,30,61.6),lanHalo=el('circle',{cx:lq[0],cy:lq[1],r:12,class:'lanhalo'});
cylinder(203,46,0,4.4,6,'z','terra');cylinder(203,46,6,4.8,1.4,'z','terra');cylinder(203,46,7.4,4.4,4.4,'z','terra');cylinder(203,46,11.8,4.8,1.4,'z','terra');
const can=cylinder(204,24,0,4,7,'z','base');wire([[206.5,26.5,4],[212,32,9]],'bu').setAttribute('stroke-width',1.8);wire([[206.5,26.5,4],[212,32,9]],'bb').setAttribute('stroke-width',1);el('path',{d:poly([[202,21,7],[202,21,12],[206,27,12],[206,27,7]]),class:'detail',style:'stroke-width:1'});
// Vent controls and hit areas.
const ventBtn=el('g',{class:'control',role:'button',tabindex:'0'});{const d=poly([[0,YM,RH],[L,YM,RH],[L,70,zr(70)],[0,70,zr(70)]],true);el('path',{d,class:'hit'},ventBtn);el('path',{d,class:'focus-ring'},ventBtn);}
const lightBtn=el('g',{class:'control',role:'button',tabindex:'0'});for(const y of[22,74]){const d=poly([[20,y,86],[170,y,86],[170,y+3,80],[20,y+3,80]],true);el('path',{d,class:'hit'},lightBtn);el('path',{d,class:'focus-ring'},lightBtn);}
const fanBtn=el('g',{class:'control',role:'button',tabindex:'0'});{const q=P(26,YM,84);el('circle',{cx:q[0],cy:q[1],r:12,class:'hit'},fanBtn);el('circle',{cx:q[0],cy:q[1],r:13,class:'focus-ring'},fanBtn);}
const mistBtn=el('g',{class:'control',role:'button',tabindex:'0'});{const d=poly([[4,YM,96],[186,YM,96],[186,YM,90],[4,YM,90]],true);el('path',{d,class:'hit'},mistBtn);el('path',{d,class:'focus-ring'},mistBtn);}
const lanBtn=el('g',{class:'control',role:'button',tabindex:'0'});{el('circle',{cx:lq[0],cy:lq[1],r:6,class:'hit'},lanBtn);el('circle',{cx:lq[0],cy:lq[1],r:6.5,class:'focus-ring'},lanBtn);}
frame([[-3,-6,0,216,108,112],[196,16,0,18,20,14]],12);
// State: vents, mist, lights, fan, day and night drive a small climate model; plants grow with light and humidity.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),hk={};
document.querySelectorAll('.hint [data-k]').forEach(b=>{hk[b.dataset.k]=b;});
let ventT=0,vent=0,drawnVent=-1,mist=0,lights=false,fanOn=false,night=false,T=24,RHm=58,grow=.3,fanA=0,fanV=0,note='',noteT=0,lastUI=-1,now=performance.now(),last=now,ac=null;
const drops=[],pool=[];
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,d=.1,v=.012,type='sine'){if(!ac)return;try{const t=ac.currentTime,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
let nb=null;function hiss(d,v,f){if(!ac)return;try{if(!nb){nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}const t=ac.currentTime,s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.05);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(ac.destination);s.start(t,0,Math.min(.95,d+.05));}catch(_){}}
const say=m=>{announcement.textContent=m;};
function drawVents(a){for(const v of vents){v.g.replaceChildren();into(v.g);const x=v.x,o=[x+1,YM,RH],ph=Math.atan2(RH-EH,YM),sl=24,U=[BAY-2,0,0],D=a2=>[0,Math.cos(ph-a2)*sl,-Math.sin(ph-a2)*sl],d0=D(0),d1=D(a*RAD);
if(a>.5){el('path',{d:poly([o,[o[0]+BAY-2,o[1],o[2]],[o[0]+BAY-2,o[1]+d0[1],o[2]+d0[2]],[o[0],o[1]+d0[1],o[2]+d0[2]]],true),class:'face recess',style:'opacity:.55'});const m=[x+BAY/2,o[1]+d1[1],o[2]+d1[2]],b=[x+BAY/2,YM+(sl+8)*Math.cos(ph),RH-(sl+8)*Math.sin(ph)];bar([[m,b]],.9);}
const g=group(plane(o,[1,0,0],d1.map(v=>v/sl)));rect(g,0,0,BAY-2,sl,.6,'pane');rect(g,0,0,BAY-2,sl,.6,'detail');el('path',{d:`M0,0H${BAY-2}V${sl}H0Z`,class:'bu','stroke-width':2.2},g);el('path',{d:`M0,0H${BAY-2}V${sl}H0Z`,class:'bb','stroke-width':1.4},g);line(g,(BAY-2)/2,0,(BAY-2)/2,sl);into(draw);}}
function stage(){return grow<.25?'SEEDLINGS':grow<.55?'GROWING':grow<.8?'FLOWERING':'FRUITING';}
function stateText(){if(now<noteT)return note;const on=[vent>.5&&`VENTS ${Math.round(vent)}°`,mist>0&&'MISTING',lights&&'GROW LIGHTS',fanOn&&'FAN'].filter(Boolean);return`${stage()} · ${on.length?on.join(' · '):'ALL CLOSED'}`;}
function sync(){set(hk.v,'aria-pressed',ventT>0);set(hk.m,'aria-pressed',mist>0);set(hk.l,'aria-pressed',lights);set(hk.f,'aria-pressed',fanOn);set(hk.n,'aria-pressed',night);
set(ventBtn,'aria-label',`${ventT?'Close':'Open'} the roof vents (V)`);set(lightBtn,'aria-label',`Grow lights ${lights?'off':'on'} (L)`);set(fanBtn,'aria-label',`Fan ${fanOn?'off':'on'} (F)`);set(mistBtn,'aria-label','Mist (M)');set(lanBtn,'aria-label',`${night?'Day':'Night'} (N)`);
svg.classList.toggle('lit',lights);svg.classList.toggle('misting',mist>0);svg.classList.toggle('fanning',fanOn);lastUI=-1;}
function ventsT(){audio();ventT=ventT?0:32;hiss(.7,.01,320);say(ventT?'Roof vents opening.':'Roof vents closing.');sync();}
function mistT(){audio();mist=mist>0?0:6;if(mist)hiss(1.4,.008,5200);say(mist?'Misting for six seconds.':'Misting stopped.');sync();}
function lightsT(){audio();lights=!lights;tone(lights?1300:900,.05,.01,'square');say(lights?'Grow lights on.':'Grow lights off.');sync();}
function fanT(){audio();fanOn=!fanOn;hiss(.5,.01,800);say(fanOn?'Fan on.':'Fan off.');sync();}
function nightT(){audio();night=!night;const h=document.documentElement;if(!reduced.matches){h.classList.add('fade');clearTimeout(nightT.t);nightT.t=setTimeout(()=>h.classList.remove('fade'),1000);}h.classList.toggle('night',night);tone(night?330:520,.12,.01);say(night?(lights?'Night. Grow lights on.':'Night. Press L for the grow lights.'):'Day.');sync();}
const act={v:ventsT,m:mistT,l:lightsT,f:fanT,n:nightT};
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(ventBtn,ventsT);bind(lightBtn,lightsT);bind(fanBtn,fanT);bind(mistBtn,mistT);bind(lanBtn,nightT);
for(const[k,b]of Object.entries(hk))b.addEventListener('click',()=>act[k]());
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const k=e.key.toLowerCase();if(act[k]){e.preventDefault();act[k]();}});
function ui(){readout.textContent=`${T.toFixed(1)} °C · ${Math.round(RHm)} % RH · ${night?'NIGHT':'DAY'}`;stateLabel.textContent=stateText();ctT.textContent=T.toFixed(1)+'°';ctH.textContent=Math.round(RHm)+'%';lit(ctL,mist>0?'b':vent>.5?'g':T>29?'a':'g');}
function tick(t){const dt=Math.min(.05,Math.max(0,(t-last)/1000)),red=reduced.matches;last=now=t;
if(vent!==ventT){vent=red?ventT:vent+clamp(ventT-vent,-dt*22,dt*22);}const vr=+vent.toFixed(2);if(vr!==drawnVent){drawnVent=vr;drawVents(vr);}
fanV+=((fanOn?1:0)-fanV)*(1-Math.exp(-dt*(fanOn?1.4:.7)));if(red)fanV=+fanOn;if(!red){fanA=(fanA+fanV*1300*dt)%360;set(rot,'transform',`rotate(${fanA.toFixed(1)})`);}rot.style.opacity=(1-.65*fanV).toFixed(2);blur.style.opacity=(.4*fanV).toFixed(2);
if(mist>0){mist=Math.max(0,mist-dt);if(!mist){say('Misting stopped.');sync();}if(!red)for(let i=0;i<dt*90;i++){const x=mist_x(),n=pool.pop()||el('circle',{class:'drop'},dropG);n.style.display='';drops.push({n,x:x+rnd()*2-1,y:YM+rnd()*2-1,z:90.5,vx:(rnd()-.5)*5+(fanOn?6:0),vy:(rnd()-.5)*12,vz:-4-rnd()*7,life:1.6});}}
for(let i=drops.length;i--;){const d=drops[i];d.life-=dt;d.vz-=dt*14;d.x+=d.vx*dt;d.y+=d.vy*dt;d.z+=d.vz*dt;if(d.life<=0||d.z<31){d.n.style.display='none';pool.push(d.n);drops.splice(i,1);continue;}const q=P(d.x,d.y,d.z);set(d.n,'cx',q[0].toFixed(1));set(d.n,'cy',q[1].toFixed(1));set(d.n,'r',(.45+.25*d.life).toFixed(2));d.n.style.opacity=Math.min(.8,d.life).toFixed(2);}
const sun=night?0:1,tT=(night?15:27)+(lights?2.2:0)-vent/32*(night?2:7.5)-(fanOn?1.5:0)-(mist>0?2.2:0),hT=55+(night?12:0)+(mist>0?32:0)-vent/32*13-(fanOn?5:0);
T+=(tT-T)*(1-Math.exp(-dt/(red?.01:2.4)));RHm=Math.min(97,RHm+(hT-RHm)*(1-Math.exp(-dt/(red?.01:2))));
const fog=clamp((RHm-68)/24)*.32;if(Math.abs(fog-(tick.f||0))>.005){tick.f=fog;svg.style.setProperty('--fog',fog.toFixed(3));}
grow=Math.min(1,grow+dt*(.004*sun+(lights?.012:0))*(RHm>62?1.25:1)*(T>30?.5:1));
for(const p of plants){const s=+(p.s0+(1-p.s0)*Math.min(1,grow*p.k)).toFixed(3),sw=fanOn&&!red?(Math.sin(t/260+p.ph)*4*fanV).toFixed(1):0;if(s!==p.s||sw!==p.sw){p.s=s;p.sw=sw;set(p.g,'transform',`translate(${p.q[0].toFixed(2)} ${p.q[1].toFixed(2)}) rotate(${sw}) scale(${(s*p.m).toFixed(3)})`);if(p.late)p.late.style.opacity=clamp((grow*p.k-.45)/.3).toFixed(2);}}
if(lastUI<0||t-lastUI>150){lastUI=t;ui();}
requestAnimationFrame(tick);}
const mist_x=()=>NZ[(rnd()*NZ.length)|0];
sync();drawVents(0);drawnVent=0;ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['v', 'm', 'l', 'f', 'n'], draw }
