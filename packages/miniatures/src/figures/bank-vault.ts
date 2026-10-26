// @ts-nocheck
/* HALVARD V–40 · Bank vault. Drawn for this kit on the shared engine, in the manner of the lab files: its stylesheet,
 * defs and script. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--base-top:#cbcbc7;--base-side:#a4a4a1;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--steel:#d3d4d0;--steel-top:#ebebe8;--steel-side:#b2b3af;--door:#e6e6e3;--door-top:#f6f6f4;--door-side:#c4c5c2;--chrome:#d9dad8;--chrome-top:#f4f4f2;--chrome-side:#bdbebc;--brass:#cfa95d;--brass-top:#e8c985;--brass-side:#ab8743;--rubber:#2e2e2d;--rubber-top:#474745;--rubber-side:#282827;--dial-ink:#ecebe6;--vault:#8b8b87;--vault-top:#a3a39f;--vault-side:#6f6f6c;--gold:#e0b44c;--gold-top:#f2d27d;--gold-side:#b88a2e;--cash:#9fb89a;--cash-top:#c2d4bb;--cash-side:#809a7c;--band:#f3ecd9;--velvet:#7d2f3c;--velvet-top:#9a4150;--velvet-side:#5e2230;--bell:#d4493a;--bell-side:#a83427;--lamp:#ffd27a;--socket:#2a2a29;--sheen:.55;--spill:.22}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--base-top:#bebeba;--base-side:#737372;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--steel:#b2b2b0;--steel-top:#dcdcd9;--steel-side:#7d7d7c;--door:#c2c2c0;--door-top:#e6e6e4;--door-side:#8a8b89;--chrome:#b7b7b6;--chrome-top:#e4e4e2;--chrome-side:#858585;--brass:#ae8e4d;--brass-top:#d9bc7c;--brass-side:#785e2d;--rubber:#252524;--rubber-top:#424240;--rubber-side:#191919;--dial-ink:#d9d9d6;--vault:#747472;--vault-top:#989894;--vault-side:#4c4c4b;--gold:#bd973f;--gold-top:#e2c475;--gold-side:#81601d;--cash:#859b81;--cash-top:#b5c6af;--cash-side:#596c56;--band:#cdc7b7;--velvet:#682631;--velvet-top:#903c4a;--velvet-side:#40151f;--bell:#b23c2f;--bell-side:#762218;--lamp:#ffd88a;--socket:#1c1c1b;--line:#444443;--sheen:.25;--spill:1}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.top.base{fill:var(--base-top)}.side.base{fill:var(--base-side)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
.steel{fill:var(--steel)}.top.steel{fill:var(--steel-top)}.side.steel{fill:var(--steel-side)}.door{fill:var(--door)}.top.door{fill:var(--door-top)}.side.door{fill:var(--door-side)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.brass{fill:var(--brass)}.top.brass{fill:var(--brass-top)}.side.brass{fill:var(--brass-side)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}.side.rubber{fill:var(--rubber-side)}.vault{fill:var(--vault)}.top.vault{fill:var(--vault-top)}.side.vault{fill:var(--vault-side)}.gold{fill:var(--gold)}.top.gold{fill:var(--gold-top)}.side.gold{fill:var(--gold-side)}.cash{fill:var(--cash)}.top.cash{fill:var(--cash-top)}.side.cash{fill:var(--cash-side)}.velvet{fill:var(--velvet)}.top.velvet{fill:var(--velvet-top)}.side.velvet{fill:var(--velvet-side)}.bell{fill:var(--bell)}.side.bell{fill:var(--bell-side)}
.ring{fill:none;stroke:var(--line);stroke-width:.4;vector-effect:non-scaling-stroke;opacity:.42}.ball{fill:url(#ball);stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke}.dome{fill:url(#dome);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke}.sheen{fill:#fff;opacity:var(--sheen);pointer-events:none}.socket{fill:var(--socket)}.band{fill:var(--band);stroke:var(--line);stroke-width:.4;vector-effect:non-scaling-stroke}
.num{fill:var(--dial-ink);font:600 2.4px ui-monospace,monospace;text-anchor:middle;stroke:none}.tick{fill:none;stroke:var(--dial-ink);stroke-width:.3}.index{fill:var(--ink);stroke:none}.index.g{fill:var(--ok);filter:url(#glow)}
.lamp>.core{fill:var(--off)}.lamp>.halo{opacity:0}.lamp.g{--c:var(--ok)}.lamp.a{--c:var(--warn)}.lamp.r{--c:var(--fault)}.lamp.g>.core,.lamp.a>.core,.lamp.r>.core{fill:var(--c);filter:url(#glow)}.lamp.g>.halo,.lamp.a>.halo,.lamp.r>.halo{fill:var(--c);opacity:.5;filter:url(#bloom)}
.shade{fill:#0c0c0b;pointer-events:none}.pool,.spill{opacity:0;pointer-events:none}.sparkle{fill:#fff;opacity:0;pointer-events:none}.key-glow{fill:var(--accent);opacity:.45;filter:url(#bloom);pointer-events:none}.waves{fill:none;stroke:var(--fault);stroke-width:.8;stroke-linecap:round;vector-effect:non-scaling-stroke;opacity:0}
.dial{cursor:grab;touch-action:none}.dragging,.dragging .dial{cursor:grabbing}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="ball" cx=".5" cy=".5" r=".6" fx=".36" fy=".3"><stop offset="0" style="stop-color:var(--chrome-top)"/><stop offset=".6" style="stop-color:var(--chrome)"/><stop offset="1" style="stop-color:var(--chrome-side)"/></radialGradient>
<radialGradient id="dome" cx=".5" cy=".5" r=".6" fx=".38" fy=".32"><stop offset="0" stop-color="#ff9a8a"/><stop offset=".55" style="stop-color:var(--bell)"/><stop offset="1" style="stop-color:var(--bell-side)"/></radialGradient>
<radialGradient id="lampPool"><stop offset="0" style="stop-color:var(--lamp)" stop-opacity=".9"/><stop offset=".55" style="stop-color:var(--lamp)" stop-opacity=".32"/><stop offset="1" style="stop-color:var(--lamp)" stop-opacity="0"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* HALVARD V–40 bank vault. World: x lower-right; y lower-left (front faces +y); z up. 1 unit ≈ 1 cm.
Part                          x      y      z      w      d      h
plinth                       −2      0      0    188    128     12   kick strip
body                          6      4     12    172    102    164   riveted side and roof, rating plate
alarm bell (right side)     178     82    150   r 10.5 × 4          striker, sound waves
frame (collar)                0    106     12    184     16    170   doorway r 50 at x 92 z 97, seat ring, lamp plate 72–112 × 165–177
chamber (through doorway)    14     12     20    156     86    148   lining 98–122; deposit boxes on the left wall
pedestal                     48     60     20     48     30     34   gold, cash or a key on top
lugs (8, at 22.5° + 45° k)  r 70–80 round x 92 z 97, y 122–136     the lower-left ones show their sockets
hinge pin                    28    130   74–119  r 2.2               knuckles r 5: 77–89 and 105–117 (frame), 89.5–104.5 (door)
door                  c 92 138 97: slab r 58 × 13, face plate r 55.5 × 3, plug r 49 × 4 behind; swings 104° on the pin
bolts (8)                     r 3, radial at the door's mid-depth (y 130): thrown to r 74, drawn back to the rim
dial                          door (0, −36): ring r 12.2 (0–99, counterclockwise), bezel r 14.4, knob r 6 × 4.6
handle                        door centre: hub r 6.6 × 9.4, three spokes 20.5 at w 7, ball knobs r 3.3
Depth: lower-left lugs, hinge, door, upper-right lugs; the door re-stacks its faces as it turns past 45°. */
const svg=document.getElementById('machine'),draw=document.getElementById('drawing');let root=draw;
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: vectors, oriented planes, tubes and boxes (the turntable's arm helpers), pins.
const{cos,sin,PI}=Math,RAD=PI/180,f2=v=>(+v).toFixed(2),VW=[1,1,1],into=g=>root=g,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(Math.hypot(...a)||1));
const plane=(o,U,V)=>`matrix(${[...P(...U),...P(...V),...P(...o)].map(f2).join(' ')})`;
function axes(n){n=unit(n);const U=unit(Math.abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U);const a=P(...U),b=P(...V);if(a[0]*b[1]-a[1]*b[0]<0)V=mul(V,-1);return[U,V];}
function stadium(n,c0,c1,r){let A=sub(c1,c0);if(dot(A,VW)<0){[c0,c1]=[c1,c0];A=mul(A,-1);}const[U,V]=axes(A),pu=P(...U),pv=P(...V),d=P(...A),det=pu[0]*pv[1]-pv[0]*pu[1],u=(d[0]*pv[1]-pv[0]*d[1])/det,v=(pu[0]*d[1]-d[0]*pu[1])/det,l=Math.hypot(u,v)||1,tx=-v*r/l,ty=u*r/l;
set(n,'transform',plane(c0,U,V));set(n,'d',`M${f2(tx)},${f2(ty)}A${r},${r} 0 0 1 ${f2(-tx)},${f2(-ty)}L${f2(u-tx)},${f2(v-ty)}A${r},${r} 0 0 1 ${f2(u+tx)},${f2(v+ty)}Z`);return[c1,U,V];}
function tube(g,m){return{b:el('path',{class:'face '+m},g),c:circle(el('g',{},g),0,0,1,'face top '+m).parentNode};}
function tb(t,c0,c1,r){const[e,U,V]=stadium(t.b,c0,c1,r);set(t.c,'transform',plane(e,U,V)+` scale(${r})`);}
function obox(g,m){const s=[0,1,2].map(()=>el('path',{},g));s.m=m;return s;}
function obx(s,c,a,b,h){let i=0;for(const[n,p,q]of[[a,b,h],[b,h,a],[h,a,b]])for(const k of[1,-1]){const N=mul(n,k);if(dot(N,VW)<=0)continue;const f=add(c,N),u=unit(N);set(s[i],'d',poly([add(add(f,p),q),add(sub(f,p),q),sub(sub(f,p),q),sub(add(f,p),q)],true));set(s[i++],'class','face '+(u[2]>.6?'top ':u[0]>u[1]?'side ':'')+s.m);}for(;i<3;i++)set(s[i],'d','');}
function pin(g,x,y,r=.8){circle(g,x,y,r,'face top');line(g,x-r*.5,y+r*.35,x+r*.5,y-r*.35);}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
const ctl=(g,label,extra={})=>{for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0','aria-label':label,...extra}))set(g,k,v);return g;};
// Shadow, the light an open vault spills on the floor, plinth, body: riveted side and roof, rating plate, alarm bell.
const sh=P(92,64,0);el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]+5),rx:152,ry:64,class:'shadow stage-floor'});el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]+5),rx:152,ry:64,class:'stage-contact'});
const spill=el('ellipse',{cx:0,cy:0,rx:50,ry:34,fill:'url(#lampPool)',class:'spill'},group(TOP(90,156,.05)));
box(-2,0,0,188,128,12,3,'base');
const PF=group(FRONT(-2,128.05,12));rect(PF,7,3.6,174,4.8,2,'face recess');for(const u of[3.2,184.8])pin(PF,u,6);
box(6,4,12,172,102,164,3,'steel');
const RS=group(SIDE(178.05,106,176));rect(RS,4,4,94,156,2,'detail');
for(let v=11;v<156;v+=13){pin(RS,8,v);pin(RS,94,v);}for(let u=21;u<88;u+=13){pin(RS,u,8);pin(RS,u,152);}
const RP=group(SIDE(178.07,78,76));rect(RP,0,0,56,24,1.6,'face base');rect(RP,1.6,1.6,52.8,20.8,1,'detail');text(RP,28,9.4,'HALVARD','label brand center');text(RP,28,14.8,'STRONGROOM WORKS · V–40','etch center');text(RP,28,19.6,'NO. 2617 · CLASS III · 1.6 T','etch micro center');for(const[u,v]of[[3.4,3.4],[52.6,3.4],[3.4,20.6],[52.6,20.6]])pin(RP,u,v,.7);
const RF=group(TOP(6,4,176.05));rect(RF,5,5,162,92,2,'detail');line(RF,86,5,86,97);for(let u=12;u<165;u+=15.5){pin(RF,u,9.5);pin(RF,u,92.5);}
const BL=el('g',{});into(BL);box(178,79,153,2,6,6,1,'base');
const bell=cylinder(178.1,82,150,10.5,4.2,'x','bell');circle(bell.face,0,0,10.5,'dome');circle(bell.face,0,0,9,'detail');circle(bell.face,0,0,1.9,'face top chrome');
const striker=group('',bell.face);line(striker,0,11.4,0,17,'detail');circle(striker,0,11.8,1.6,'face chrome');
const waves=[[13,6.5],[17,10.5]].flatMap(([u,r])=>[1,-1].map(k=>el('path',{d:`M${k*u},${-r} A${r*1.3},${r*1.3} 0 0 ${k>0?1:0} ${k*u},${r}`,class:'waves'},bell.face)));
into(draw);
// The chamber, seen through the doorway: its lining, the back and left walls (deposit boxes), floor, pedestal, contents.
const DF=svg.querySelector('defs');
el('circle',{r:50,transform:FRONT(92,122,97)},el('clipPath',{id:'doorway'},DF));el('circle',{r:50,transform:FRONT(92,98,97)},el('clipPath',{id:'chamber'},DF));
const TUN=el('g',{'clip-path':'url(#doorway)'});circle(group(FRONT(92,122,97),TUN),0,0,50,'face top vault');circle(group(FRONT(92,117,97),TUN),0,0,50,'detail');
const CH=ctl(el('g',{'clip-path':'url(#chamber)'},TUN),'Change what the vault holds (C)',{tabindex:'-1'});into(CH);
const BW=group(FRONT(14,12,168));rect(BW,0,0,156,148,0,'face vault');
const LW=group(SIDE(14,98,168));rect(LW,0,0,86,148,0,'face side vault');
const boxes=(g,cols,u0)=>{for(let i=0;i<cols;i++)for(let j=0;j<7;j++){const u=u0+i*13,v=67+j*11.2;rect(g,u,v,12,10.2,.8,'face brass');rect(g,u+2,v+3.6,4.2,2.8,.4,'face top brass');circle(g,u+9.2,v+5.1,.95,'face recess');}};
boxes(BW,12,0);boxes(LW,6,4);
const FL=group(TOP(14,12,20));rect(FL,0,0,156,86,0,'face vault');for(let u=26;u<156;u+=26)line(FL,u,0,u,86);for(let v=21.5;v<86;v+=21.5)line(FL,0,v,156,v);
const pool=el('ellipse',{cx:40,cy:62,rx:62,ry:42,fill:'url(#lampPool)',class:'pool'},FL);
box(30,60,20,48,30,34,2,'vault');{const g=group(FRONT(30,90.05,54));rect(g,4,4,40,26,1.5,'detail');}
function ingot(x,y,z){const W=18,D=8,H=5,i=1.9,j=1.2,b=[[x,y,z],[x+W,y,z],[x+W,y+D,z],[x,y+D,z]],t=[[x+i,y+j,z+H],[x+W-i,y+j,z+H],[x+W-i,y+D-j,z+H],[x+i,y+D-j,z+H]];
el('path',{d:poly([b[3],b[2],t[2],t[3]],true),class:'face gold'});el('path',{d:poly([b[2],b[1],t[1],t[2]],true),class:'face side gold'});el('path',{d:poly(t,true),class:'face top gold'});rect(group(TOP(x+i,y+j,z+H+.02)),2.8,1.2,W-2*i-5.6,D-2*j-2.4,.4,'detail');}
function bundle(x,y,z){box(x,y,z,13,6,2.4,.5,'cash');rect(group(TOP(x,y,z+2.42)),5,0,3,6,0,'band');const f=group(FRONT(x,y+6.02,z+2.4));rect(f,5,0,3,2.4,0,'band');line(f,1,1.2,4,1.2);line(f,9,1.2,12,1.2);}
const IN=[0,1,2].map(()=>el('g',{}));
into(IN[0]);for(const[x,y,z]of[[33,62,54],[33,71,54],[33,80,54],[53,62,54],[53,71,54],[53,80,54],[33,66.5,59],[33,75.5,59],[53,66.5,59],[53,75.5,59],[43,71,64]])ingot(x,y,z);
into(IN[1]);for(const[x,y,n]of[[38,62,5],[38,72,3],[53,62,4],[53,72,5],[45,82,2]])for(let k=0;k<n;k++)bundle(x,y,54+k*2.45);
into(IN[2]);box(41,63,54,26,22,4.6,2.6,'velvet');{const g=group(TOP(41,63,58.62));rect(g,2.4,2.4,21.2,17.2,2,'detail');}
const keyGlow=el('ellipse',{rx:24,ry:13,class:'key-glow'}),keyP=el('g',{});
el('path',{d:'M-9.4,-6.2A6.2,6.2 0 1 0 -9.4,6.2A6.2,6.2 0 1 0 -9.4,-6.2ZM-9.4,-2.6A2.6,2.6 0 1 1 -9.4,2.6A2.6,2.6 0 1 1 -9.4,-2.6Z','fill-rule':'evenodd',class:'face brass'},keyP);
rect(keyP,-3.6,-1.4,18,2.8,1,'face brass');rect(keyP,-4.4,-2.3,2.2,4.6,.7,'face top brass');el('path',{d:'M8.4,1.4V7.2H10.2V5.2H11.8V7.2H13.6V3.6H12.6V1.4Z',class:'face brass'},keyP);line(keyP,-1,0,13,0);
into(CH);
const SPARK=[[[44,72,69.2],[38,64,64.2],[68,85,59.2]],[[42,63,66.3],[58,64,63.9],[50,85,59]],[[50,74,74],[58,74,62],[44,74,66]]].map(list=>list.map(p=>{const q=P(...p),g=el('g',{transform:`translate(${f2(q[0])} ${f2(q[1])})`});el('path',{d:'M0,-3.4L.55,-.55L3.4,0L.55,.55L0,3.4L-.55,.55L-3.4,0L-.55,-.55Z',class:'sparkle'},g);return g.firstChild;}));
const shade=el('rect',{x:-50,y:-60,width:90,height:116,class:'shade'});
into(draw);
// Frame: its right side, the face with the doorway cut out, bevels, seat ring, rivets, the lamp plate; then its top.
rect(group(SIDE(184,122,182)),0,0,16,170,3,'face side steel');
const FF=group(FRONT(0,122,182));el('path',{d:'M3,0H181Q184,0 184,3V167Q184,170 181,170H3Q0,170 0,167V3Q0,0 3,0ZM42,85A50,50 0 1 0 142,85A50,50 0 1 0 42,85Z','fill-rule':'evenodd',class:'face steel'},FF);
el('path',{d:'M1.5,1.5H182.5L178.5,5.5H5.5V164.5L1.5,168.5Z',class:'face top steel'},FF);el('path',{d:'M182.5,1.5V168.5H1.5L5.5,164.5H178.5V5.5Z',class:'face side steel'},FF);rect(FF,5.5,5.5,173,159,1.5,'detail');
circle(FF,92,85,55.4,'detail');circle(FF,92,85,53,'ring');
for(let u=14;u<172;u+=13){if(u<66||u>118)pin(FF,u,10.5);pin(FF,u,159.5);}for(let v=23.5;v<150;v+=13){pin(FF,10.5,v);pin(FF,173.5,v);}
const LP=group(FRONT(72,122.06,177));rect(LP,0,0,40,12,2,'face base');rect(LP,2.4,2.4,35.2,7.2,1.6,'face recess');
const LAMPS=[0,1,2].map(i=>{const g=el('g',{class:'lamp'},LP);circle(g,10+i*10,6,3.6,'halo');circle(g,10+i*10,6,1.7,'core');return g;});
rect(group(TOP(0,106,182)),0,0,184,16,3,'face top steel');
// Lugs whose sockets face us (lower left), then the hinge: leaves on the frame, knuckles, the pin.
const lugs=[...Array(8)].map((_,k)=>{const phi=(22.5+45*k)*RAD,d=[cos(phi),0,sin(phi)];return{d,t:[-d[2],0,d[0]],c:[92+74*d[0],127.5,97+74*d[2]],front:d[0]+d[2]>0};});
function lug(L){obx(obox(el('g',{}),'base'),L.c,mul(L.d,4),mul(L.t,4.6),[0,5.5,0]);const top=group(plane(add(L.c,[0,5.52,0]),L.t,L.d));pin(top,-2.2,.6,.8);pin(top,2.2,.6,.8);line(top,-3.6,-2.6,3.6,-2.6);
if(!L.front)circle(group(plane(sub(L.c,mul(L.d,4.02)),L.t,[0,-1,0])),0,-2.5,3.5,'face socket');}
lugs.filter(L=>!L.front).forEach(lug);
for(const z of[78,106])box(18,122,z,12,3.4,10,1,'base');
cylinder(28,130,74,2.2,3,'z','chrome');for(const[z,h]of[[77,12],[89.5,15],[105,12]])cylinder(28,130,z,5,h,'z','chrome');{const c=cylinder(28,130,117,2.6,2.2,'z','chrome');circle(c.face,0,0,1.1,'detail');}
// The door: hinge leaf, slab, bolts, slab face; in front, its face plate (spun rings, sheen, nameplate, dial) and handle;
// behind, its back (bolt guides) and the plug with the lock case and the inside release.
const doorG=el('g',{}),leafG=el('g',{},doorG),leaf=obox(leafG,'chrome');
const slab=el('path',{class:'face side door'},doorG),boltG=el('g',{},doorG),bolts=lugs.map(L=>({...L,lim:L.front?99:70,t:tube(boltG,'chrome')}));
const slabCap=el('g',{},doorG);circle(slabCap,0,0,58,'face door');
const plateB=el('path',{class:'face side door'},doorG),frontG=el('g',{},doorG);
circle(frontG,0,0,55.5,'face door');for(const r of[51.5,46,39.5,32,24.5])circle(frontG,0,0,r,'ring');
for(const a of[-135,45]){const a0=(a-11)*RAD,a1=(a+11)*RAD,q=(r,t)=>`${f2(r*cos(t))},${f2(r*sin(t))}`;el('path',{d:`M${q(9,a0)}L${q(54.6,a0)}A54.6,54.6 0 0 1 ${q(54.6,a1)}L${q(9,a1)}A9,9 0 0 0 ${q(9,a0)}Z`,class:'sheen'},frontG);}
circle(frontG,0,0,53.7,'detail');
{const g=group('translate(0 37.5)',frontG);rect(g,-15,-4.6,30,9.2,1.6,'face brass');rect(g,-13.6,-3.2,27.2,6.4,1,'detail');text(g,0,1.4,'HALVARD','label center');pin(g,-12.4,0,.6);pin(g,12.4,0,.6);}
const dialCtl=group('translate(0 -36)',frontG,{class:'control dial',role:'slider',tabindex:'0','aria-label':'Combination dial: arrow keys or 0–9 turn it, Enter sets the number','aria-valuemin':'0','aria-valuemax':'99','aria-valuenow':'0','aria-valuetext':'0'});
circle(dialCtl,0,0,14.4,'face chrome');circle(dialCtl,0,0,13.3,'detail');
const dialRot=el('g',{},dialCtl);circle(dialRot,0,0,12.2,'face rubber');
for(let n=0;n<100;n+=2){const a=-n*3.6*RAD,r0=n%10?11.1:10.3;line(dialRot,f2(r0*sin(a)),f2(-r0*cos(a)),f2(12*sin(a)),f2(-12*cos(a)),'tick');if(n%10===0)text(group(`rotate(${-n*3.6})`,dialRot),0,-7.9,String(n),'num');}
const index=el('path',{d:'M-1.3,-14.3L1.3,-14.3L0,-12.1Z',class:'index'},dialCtl);circle(dialCtl,0,0,16.4,'focus-ring');circle(dialCtl,0,0,15,'hit');
const knobG=el('g',{class:'dial'},doorG),knobB=el('path',{class:'face rubber'},knobG),knobC=el('g',{},knobG);circle(knobC,0,0,6,'face top rubber');
const knobR=el('g',{},knobC);for(let i=0;i<24;i++){const a=i*15*RAD;line(knobR,f2(5*sin(a)),f2(-5*cos(a)),f2(5.9*sin(a)),f2(-5.9*cos(a)),'tick');}circle(knobR,0,0,3.2,'detail');line(knobR,0,-1.2,0,-4.4,'tick');
const wheelG=ctl(el('g',{},doorG),'Handle: open or close the door (Space)');
const spokes=[0,1,2].map(()=>({t:tube(wheelG,'chrome'),k:el('circle',{r:f2(3.5*1.2247),class:'ball'},wheelG)}));
const hubB=el('path',{class:'face chrome'},wheelG),hubC=el('g',{},wheelG);circle(hubC,0,0,6.6,'face top chrome');circle(hubC,0,0,3.5,'face brass');for(let k=0;k<3;k++){const a=(90+k*120)*RAD;pin(hubC,5*cos(a),5*sin(a),.55);}
const wheelFocus=el('g',{},wheelG);circle(wheelFocus,0,0,27,'focus-ring');circle(wheelFocus,0,0,27,'hit').setAttribute('style','pointer-events:none');
const backCtl=ctl(el('g',{},doorG),'Close the door (Space)',{tabindex:'-1'}),backG=el('g',{},backCtl);circle(backG,0,0,58,'face door');circle(backG,0,0,55.6,'detail');
for(const L of lugs){const u=-L.d[0],v=-L.d[2];rect(group(`translate(${f2(u*53)} ${f2(v*53)}) rotate(${f2(Math.atan2(v,u)/RAD)})`,backG),-3.4,-3.6,6.8,7.2,1,'face base');}
const plugB=el('path',{class:'face side door'},backCtl),plugG=el('g',{},backCtl);circle(plugG,0,0,49,'face door');circle(plugG,0,0,44,'detail');for(let k=0;k<8;k++){const a=(k*45+22.5)*RAD;pin(plugG,46.5*cos(a),46.5*sin(a),.9);}
circle(plugG,0,0,42.5,'face glass');for(const L of lugs){const u=-L.d[0],v=-L.d[2];rect(group(`rotate(${f2(Math.atan2(v,u)/RAD)})`,plugG),8,-1.3,34,2.6,1.3,'face chrome');pin(plugG,u*39,v*39,.9);}
circle(plugG,0,0,10,'face chrome');circle(plugG,0,0,6.4,'detail');for(let k=0;k<8;k++){const a=(k*45+22.5)*RAD;circle(plugG,8*cos(a),8*sin(a),.8,'face recess');}
{const g=group('translate(0 -25)',plugG);rect(g,-10,-6.5,20,13,1.4,'face base');rect(g,-8,-4.5,16,9,1,'detail');text(g,0,1,'LOCK CASE','etch micro center');}
rect(plugG,-1.8,4,3.6,15,1.8,'face top chrome');circle(plugG,0,0,3.2,'face top chrome');
for(const a of[-135,45]){const a0=(a-9)*RAD,a1=(a+9)*RAD,q=(r,t)=>`${f2(r*cos(t))},${f2(r*sin(t))}`;el('path',{d:`M${q(12,a0)}L${q(42,a0)}A42,42 0 0 1 ${q(42,a1)}L${q(12,a1)}A12,12 0 0 0 ${q(12,a0)}Z`,class:'sheen'},plugG);}
text(plugG,0,30,'HALVARD · V–40','etch center');text(plugG,0,34.4,'NO. 2617 · INSPECT YEARLY','etch micro center');circle(plugG,0,0,51,'focus-ring');
// Lugs in front of the door's sweep (upper right).
lugs.filter(L=>L.front).forEach(lug);
frame([[-2,0,0,188,128,12],[0,4,12,184,122,170],[-10,130,38,50,122,118]],14);
// State: a three-number combination on a dial (spring, pointer or a typed number), the door's sequence (bolts and
// handle, crack, a heavy swing that settles, and back), the lamps, the chamber light, the alarm after three misses.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const COMBO=[30,70,15],OPEN=104,CRACK=2.4,WHAT=['GOLD','CASH','KEY'],HOLDS=['gold bars','bundles of cash','a single key'],LOCKOUT=8000;
const pad=n=>String(n).padStart(2,'0'),mod=n=>(n%100+100)%100,eio=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2,smooth=t=>t*t*(3-2*t),out3=t=>1-(1-t)**3;
let phase='locked',t0=0,from=0,got=0,misses=0,lockUntil=0,missT=-1e9,setT=-1e9,rattleT=-1e9,alarmT=-1e9,litT=0,sparkT=-1e9;
let dialT=0,dialA=0,dialV=0,spin=null,held=0,heldT=0,drag=null,typed='',typedT=0,lastN=0,lastTk=0,lastTing=0;
let wheel=0,bolt=0,theta=0,thetaV=0,light=0,inside=0,note='',noteT=0,last=0,outKey='',drawn='',shownFront=null,lastLight=-1,ringing=false;
const say=m=>{announcement.textContent=m;},notice=(m,a)=>{note=m;noteT=performance.now()+1600;if(a)say(a);};
const num=()=>mod(Math.round(dialT));
let ac=null,nb=null;
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
function tone(f,d,v,type='sine',when=0,f1=0){const a=ac;if(!a)return;const t=a.currentTime+when,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.03);}
function hiss(d,v,f,q=1,when=0){const a=ac;if(!a)return;if(!nb){nb=a.createBuffer(1,a.sampleRate,a.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}const t=a.currentTime+when,s=a.createBufferSource(),b=a.createBiquadFilter(),g=a.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;b.Q.value=q;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(a.destination);s.start(t,0,d+.05);}
const click=()=>tone(3400,.01,.005,'square'),clunk=()=>{tone(170,.12,.05,'sine',0,80);hiss(.05,.02,1800,2);},buzz=()=>{tone(92,.15,.035,'square');tone(82,.2,.03,'square',.16);},clack=()=>{hiss(.04,.03,2600,3);tone(420,.05,.012,'square');};
const kachunk=()=>{for(let i=0;i<3;i++)hiss(.05,.025,1400+i*300,2,i*.07);tone(110,.25,.06,'sine',.2,55);},rumble=()=>hiss(2,.012,150,.6),thunk=()=>{tone(58,.4,.08,'sine',0,36);hiss(.2,.03,320,.8);},ting=()=>{tone(2300,.5,.01);tone(5700,.2,.003);};
function sync(){const open=phase==='open';set(backCtl,'tabindex',open?'0':'-1');set(CH,'tabindex',open?'0':'-1');set(CH,'aria-label',`The vault holds ${HOLDS[inside]}: change it (C)`);set(dialCtl,'aria-valuenow',num());set(dialCtl,'aria-valuetext',String(num()));}
function turn(d){audio();if(spin){dialT=spin.to;spin=null;}dialT=Math.round(dialT)+d;sync();}
function spinTo(n,turns=0,dur){const cur=Math.round(dialT);let d=mod(n-cur);if(d>50)d-=100;const to=cur+d+turns*100*Math.sign(d||1);spin={from:dialA,to,t0:performance.now(),dur:Math.max(1,dur??Math.min(700,180+Math.abs(to-dialA)*10))};dialT=to;sync();}
function digit(k){audio();const now=performance.now();typed=typed.length===1&&now-typedT<1200?typed+k:k;typedT=now;spinTo(+typed);}
function setNumber(){audio();const now=performance.now();typed='';
if(phase!=='locked'){notice(phase==='open'?'OPEN / SPACE TO CLOSE':'DOOR IN MOTION');return;}
if(now<lockUntil){notice(`LOCKED OUT / ${Math.ceil((lockUntil-now)/1000)} S`,'Locked out: wait for the alarm to stop.');return;}
const n=num();
if(n===COMBO[got]){got++;setT=now;clunk();if(got===3)unlock();else say(`${n} clicks in: number ${got} of 3. Turn to ${COMBO[got]}.`);}
else{got=0;misses++;missT=now;buzz();if(misses>=3)alarm();else say(`${n} is wrong. The door shakes: start again from the first number.`);}}
function alarm(){const now=performance.now();misses=0;alarmT=now;lockUntil=now+LOCKOUT;say('Three wrong numbers in a row: the alarm rings and the dial is locked out for eight seconds.');}
function unlock(){phase='unbolt';t0=performance.now();misses=0;say('Combination accepted. The bolts slide back, the handle turns and the door swings open.');sync();}
function opened(){phase='open';theta=OPEN;thetaV=0;wheel=120;bolt=1;sparkT=performance.now();say(`The vault is open, with ${HOLDS[inside]} inside. Space closes it.`);sync();}
function relocked(){phase='locked';got=0;theta=0;thetaV=0;wheel=0;bolt=0;say('Door shut, bolts thrown, dial scrambled: the vault is locked.');sync();}
function close(){if(phase!=='open'&&phase!=='swing'){notice(phase==='locked'?'LOCKED / DIAL THE COMBINATION':'DOOR IN MOTION');return;}audio();phase='shut';t0=performance.now();from=theta;rumble();say('Closing the door.');sync();}
function handle(){audio();if(phase==='open'||phase==='swing')return close();if(phase==='locked'){rattleT=performance.now();clack();notice('LOCKED / DIAL THE COMBINATION','Locked: the handle will not turn until the combination is dialed.');}else notice('DOOR IN MOTION');}
function escape(){audio();if(phase==='open'||phase==='swing')return close();if(phase==='locked'){got=0;typed='';notice('CLEARED / DEMO 30 · 70 · 15','Numbers cleared. Start again from the first number.');}}
function contents(){audio();inside=(inside+1)%3;IN.forEach((g,i)=>set(g,'display',i===inside?'inline':'none'));sparkT=performance.now();notice(`CONTENTS · ${WHAT[inside]}`,`The vault now holds ${HOLDS[inside]}.`);sync();}
// The door, drawn from its angle (and a sideways shake), its bolts' throw, the handle's turn and the dial.
const ORDER_F=[leafG,slab,boltG,slabCap,plateB,frontG,knobG,wheelG],ORDER_B=[leafG,slab,boltG,backCtl];
function drawDoor(th,sh,wh){const a=th*RAD,c=cos(a),s=sin(a),U=[c,s,0],V=[0,0,-1],N=[-s,c,0],F=[28+(64+sh)*c-8*s,130+(64+sh)*s+8*c,97],at=(u,v,w)=>[F[0]+u*U[0]+w*N[0],F[1]+u*U[1]+w*N[1],F[2]-v],front=c>s;
if(front!==shownFront){shownFront=front;for(const n of[...ORDER_F,...ORDER_B])set(n,'display','none');for(const n of front?ORDER_F:ORDER_B){set(n,'display','inline');doorG.appendChild(n);}}
obx(leaf,at(-59,0,-8),mul(U,3.2),[0,0,7.4],mul(N,3));stadium(slab,at(0,0,-16),at(0,0,-3),58);
const mid=at(0,0,-8);for(const b of bolts){const d=[b.d[0]*c,b.d[0]*s,b.d[2]];tb(b.t,add(mid,mul(d,57.4)),add(mid,mul(d,Math.min(b.lim,58.5+15.5*(1-bolt)))),3);}
if(front){set(slabCap,'transform',plane(at(0,0,-3),U,V));stadium(plateB,at(0,0,-3),F,55.5);set(frontG,'transform',plane(F,U,V));set(dialRot,'transform',`rotate(${f2(dialA*3.6)})`);
const dc=at(0,-36,0),dk=add(dc,mul(N,4.6));stadium(knobB,dc,dk,6);set(knobC,'transform',plane(dk,U,V));set(knobR,'transform',`rotate(${f2(dialA*3.6)})`);
const hb=add(F,mul(N,7));spokes.forEach((sp,k)=>{const r=(90+k*120+wh)*RAD,dir=add(mul(U,cos(r)),mul(V,sin(r))),q=P(...add(hb,mul(dir,22.4)));tb(sp.t,hb,add(hb,mul(dir,20.5)),2);set(sp.k,'cx',f2(q[0]));set(sp.k,'cy',f2(q[1]));});
stadium(hubB,F,add(F,mul(N,9.4)),6.6);set(hubC,'transform',plane(add(F,mul(N,9.4)),U,V)+` rotate(${f2(wh)})`);set(wheelFocus,'transform',plane(hb,U,V));}
else{const B=mul(U,-1);set(backG,'transform',plane(at(0,0,-16),B,V));stadium(plugB,at(0,0,-16),at(0,0,-20),49);set(plugG,'transform',plane(at(0,0,-20),B,V));}}
function lit(n,c){if(n._c!==c){n._c=c;n.base??=n.getAttribute('class')||'';set(n,'class',n.base+(c?' '+c:''));}}
const spring=(x,v,t,w,z,dt)=>{v+=(w*w*(t-x)-2*z*w*v)*dt;return[x+v*dt,v];};
function ui(now){const live=mod(Math.round(dialA)),r=`DIAL ${pad(live)} · ${COMBO.map((n,i)=>phase!=='locked'||i<got?pad(n):'––').join(' ')} · DOOR ${Math.round(theta)}°`;
const st=now<noteT?note:now<lockUntil?`ALARM / LOCKED OUT ${Math.ceil((lockUntil-now)/1000)} S`:phase==='locked'&&now-missT<1400?'WRONG NUMBER / START AGAIN':{locked:got?`NUMBER ${got} OF 3 SET / TURN TO ${COMBO[got]}`:'LOCKED / DEMO 30 · 70 · 15',unbolt:'UNLOCKED / BOLTS DRAWING BACK',crack:'UNLOCKED / DOOR UNSEATING',swing:'DOOR SWINGING OPEN',open:`OPEN · ${WHAT[inside]} / SPACE TO CLOSE`,shut:'DOOR CLOSING',rebolt:'SHUT / BOLTS THROWN',scramble:'RELOCKING / DIAL SCRAMBLED'}[phase];
if(r+st!==outKey){outKey=r+st;readout.textContent=r;stateLabel.textContent=st;}}
function tick(now){const dt=Math.min(.05,(now-(last||now))/1000),red=reduced.matches;last=now;
// Dial: held arrows speed up, a typed number spins to it, a drag follows the pointer, otherwise a quick spring; it clicks per number.
if(held&&!drag){heldT+=dt;if(heldT>.32)dialT+=held*Math.min(40,7+(heldT-.32)*36)*dt;}
if(spin){const q=red?1:clamp((now-spin.t0)/spin.dur);dialA=spin.from+(spin.to-spin.from)*out3(q);if(q>=1){dialA=spin.to;spin=null;dialV=0;sync();}}
else if(red||drag){dialA=dialT;dialV=0;}else[dialA,dialV]=spring(dialA,dialV,dialT,34,1,dt);
const n=Math.round(dialA);if(n!==lastN){lastN=n;if(ac&&now-lastTk>24){lastTk=now;click();}}
// The sequence: bolts and handle, the door cracks out of its seat, swings (a spring chasing an eased target, so it
// starts slow and settles with a little give), then back: swing shut, thud, bolts thrown, the dial scrambled.
const p=d=>red?1:clamp((now-t0)/d);
if(phase==='unbolt'){const q=p(950);wheel=120*eio(q);bolt=eio(clamp((q-.14)/.86));if(q>=1){phase='crack';t0=now;kachunk();}}
if(phase==='crack'){const q=p(480);theta=CRACK*eio(q);if(q>=1){phase='swing';t0=now;from=theta;rumble();}}
if(phase==='swing'){const q=p(2400),tg=from+(OPEN-from)*smooth(q);if(red)theta=OPEN;else[theta,thetaV]=spring(theta,thetaV,tg,5.2,.62,dt);if(q>=1&&Math.abs(theta-OPEN)<.06&&Math.abs(thetaV)<.4)opened();}
if(phase==='shut'){const q=p(2100),tg=from*(1-smooth(q));if(red)theta=0;else{[theta,thetaV]=spring(theta,thetaV,tg,5.6,.9,dt);if(theta<0){theta=0;thetaV=0;}}if(q>=1&&theta<.12){theta=0;thetaV=0;phase='rebolt';t0=now;thunk();}}
if(phase==='rebolt'){const q=p(900);wheel=120*(1-eio(q));bolt=1-eio(clamp(q/.86));if(q>=1){wheel=0;bolt=0;phase='scramble';spinTo(Math.floor(Math.random()*100),1,1300);}}
if(phase==='scramble'&&!spin)relocked();
// A wrong number shakes the door; the handle rattles when tried locked.
const ms=(now-missT)/1000,shake=red||ms>.6?0:1.5*Math.exp(-ms*7)*sin(ms*2*PI*7.5),rs=(now-rattleT)/1000,rattle=red||rs>.5?0:6*Math.exp(-rs*8)*sin(rs*2*PI*9);
const key=[theta,shake,bolt,wheel+rattle,dialA].map(v=>v.toFixed(3)).join('|');if(key!==drawn){drawn=key;drawDoor(theta,shake,wheel+rattle);}
// Lamps, the index, the chamber light (it flickers on as the door cracks), the spill, sparkles, the floating key, the bell.
const blink=Math.floor(now/260)%2;LAMPS.forEach((l,i)=>lit(l,now<lockUntil?(red||blink?'r':''):now-missT<720?'a':phase!=='locked'?'g':i<got?'g':''));lit(index,now-setT<450?'g':'');
const on=theta>.6;if(on&&!litT)litT=now;if(!on)litT=0;const lt=on?(red||now-litT>420?1:[.2,1,.35,1,.6,1,1][Math.floor((now-litT)/60)]??1):0;light=red||lt>light?lt:Math.max(lt,light-dt*3.5);
if(light!==lastLight){lastLight=light;shade.style.opacity=f2((1-light)*.82);pool.style.opacity=f2(light*.8);spill.style.opacity=`calc(var(--spill) * ${f2(light)})`;}
const glow=light>0&&!red;SPARK.forEach((list,i)=>list.forEach((s,k)=>{const e=((now-sparkT)/1000-k*.35)%3.4,v=glow&&i===inside&&e>=0&&e<.5?sin(e/.5*PI):0;if(s._v!==v){s._v=v;s.style.opacity=f2(v);set(s,'transform',`scale(${f2(.4+.8*v)})`);}}));
if(inside===2&&light>0){const a=red?-16:-16+18*sin(now/1400),b=red?0:1.3*sin(now/950),c=[54,74,69+b],q=P(54,74,66);set(keyP,'transform',plane(c,[1.3*cos(a*RAD),1.3*sin(a*RAD),0],[0,0,-1.3]));set(keyGlow,'cx',f2(q[0]));set(keyGlow,'cy',f2(q[1]));}
const bt=(now-alarmT)/1000,ring=bt<3.2;if(ring||ringing){ringing=ring;set(striker,'transform',ring&&!red?`translate(${f2(sin(now/16)*1.3)} 0)`:'');set(BL,'transform',ring&&!red?`translate(${f2(sin(now/23)*.45)} 0)`:'');waves.forEach((w,i)=>w.style.opacity=ring?f2(red?.8:.5+.5*sin(now/70-i)):'0');if(ring&&ac&&bt<1.8&&now-lastTing>150){lastTing=now;ting();}}
ui(now);requestAnimationFrame(tick);}
// Input: arrows turn the dial (hold to spin), 0–9 dial a number, Enter sets it, Space tries the handle or closes,
// Escape clears or closes, C changes what the vault holds. The dial drags round; a tap on it sets the number.
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key;
if(k.startsWith('Arrow')){e.preventDefault();if(!e.repeat){const d=k==='ArrowRight'||k==='ArrowUp'?1:-1;turn(d);held=d;heldT=0;}return;}
if(e.repeat)return;
if(/^[0-9]$/.test(k)){e.preventDefault();digit(k);}else if(k==='Enter'){e.preventDefault();setNumber();}else if(k===' '){e.preventDefault();handle();}else if(k==='Escape'){e.preventDefault();escape();}else if(k==='c'||k==='C'){e.preventDefault();contents();}});
document.addEventListener('keyup',e=>{if(e.key.startsWith('Arrow')&&held){held=0;dialT=Math.round(dialT);sync();}});
function dialDown(e){if(phase!=='locked'||e.button>0)return;e.preventDefault();audio();const m=svg.getScreenCTM?.();if(!m)return;const inv=m.inverse(),c=P(92,138,133),ang=ev=>{const q=new DOMPoint(ev.clientX,ev.clientY).matrixTransform(inv),u=(q.x-c[0])/C;return Math.atan2(q.y-c[1]-S*u,u);};
if(spin){dialT=spin.to;spin=null;}drag={a:ang(e),moved:0,ang};e.currentTarget.setPointerCapture?.(e.pointerId);svg.classList.add('dragging');}
function dialMove(e){if(!drag)return;const a=drag.ang(e);let d=a-drag.a;if(d>PI)d-=2*PI;if(d<-PI)d+=2*PI;drag.a=a;drag.moved+=Math.abs(d);dialT+=d/(2*PI)*100;}
function endDrag(tap){if(!drag)return;const moved=drag.moved;drag=null;svg.classList.remove('dragging');if(tap&&moved<.05)setNumber();else{dialT=Math.round(dialT);sync();}}
for(const g of[dialCtl,knobG]){g.addEventListener('pointerdown',dialDown);g.addEventListener('pointermove',dialMove);}
addEventListener('pointerup',()=>endDrag(true));addEventListener('pointercancel',()=>endDrag(false));window.addEventListener('blur',()=>{if(held){held=0;dialT=Math.round(dialT);}endDrag(false);});
bind(wheelG,handle);bind(backCtl,close);bind(CH,contents);
IN.forEach((g,i)=>set(g,'display',i===inside?'inline':'none'));sync();drawDoor(0,0,0);requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
