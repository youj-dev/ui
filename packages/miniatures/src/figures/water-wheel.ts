// @ts-nocheck
/* OSSENFORD M–3 · Water wheel mill. Drawn for this kit on the shared engine, in the manner of the lab files: its
 * stylesheet, defs and script. The script runs on the env, which stands in for the page; its types are at the
 * boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--wood:#9a6a42;--wood-top:#b9875a;--wood-side:#7b5232;--plank:#cdb08c;--plank-top:#e0c9a8;--plank-side:#b0916c;--stone:#dcd6cb;--stone-top:#ebe7df;--stone-side:#c0b9ac;--stone-dk:#a39b8d;--slate:#8e939b;--slate-top:#a9aeb5;--slate-side:#71767e;--mill:#c6c3bc;--mill-top:#dcd9d2;--mill-side:#a5a29b;--iron:#4a4744;--iron-top:#646059;--iron-side:#383532;--sack:#d8c196;--sack-top:#e8d6b1;--sack-side:#bca578;--flour:#f8f6ef;--grain:#d9b25e;--brass:#cfa95d;--brass-top:#e8c985;--water:#7db4dc;--water-top:#a6d0ee;--water-deep:#4f8fc4;--foam:#fff;--glint:.75;--tex:.5}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--off:#9b9b99;--wood:#815836;--wood-top:#ad7e54;--wood-side:#553720;--plank:#ae9372;--plank-top:#d3b896;--plank-side:#7d664b;--stone:#bab4aa;--stone-top:#dcd8cf;--stone-side:#89837a;--stone-dk:#615c54;--slate:#787d85;--slate-top:#9ea3aa;--slate-side:#50545a;--mill:#a7a59f;--mill-top:#cecbc4;--mill-side:#75736e;--iron:#3c3a39;--iron-top:#5d5953;--iron-side:#242322;--sack:#b8a37f;--sack-top:#dac8a5;--sack-side:#857253;--flour:#dcd9d1;--grain:#bf9a4c;--brass:#ae8e4d;--brass-top:#d9bc7c;--water:#5b93c2;--water-top:#86b7de;--water-deep:#3a6d9e;--foam:#e6eef5;--line:#444443;--glint:.5;--tex:.42}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.plate{fill:var(--ink);font:600 2.2px Georgia,'Times New Roman',serif;letter-spacing:.3px;text-anchor:middle;stroke:none}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.plank{fill:var(--plank)}.top.plank{fill:var(--plank-top)}.side.plank{fill:var(--plank-side)}.stone{fill:var(--stone)}.top.stone{fill:var(--stone-top)}.side.stone{fill:var(--stone-side)}.stone.dk{fill:var(--stone-side)}.top.stone.dk{fill:var(--stone)}.side.stone.dk{fill:var(--stone-dk)}.slate{fill:var(--slate)}.top.slate{fill:var(--slate-top)}.side.slate{fill:var(--slate-side)}
.mill{fill:var(--mill)}.top.mill{fill:var(--mill-top)}.side.mill{fill:var(--mill-side)}.iron{fill:var(--iron)}.top.iron{fill:var(--iron-top)}.side.iron{fill:var(--iron-side)}.sack{fill:var(--sack)}.top.sack{fill:var(--sack-top)}.side.sack{fill:var(--sack-side)}.brass{fill:var(--brass)}.top.brass{fill:var(--brass-top)}
.tex{stroke:none;pointer-events:none;opacity:var(--tex)}.t-planks{fill:url(#planks)}.t-boards{fill:url(#boards)}.t-stone{fill:url(#masonry)}.t-shingle{fill:url(#shingles)}.t-hatch{fill:url(#hatch)}
.seam{fill:none;stroke:var(--line);stroke-width:.4}.grainl{fill:none;stroke:var(--line);stroke-width:.22;opacity:.6}.hl{stroke:var(--line);stroke-width:.5;opacity:.45}.profile{fill:none;stroke:var(--wood-side);stroke-width:.8;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke;pointer-events:none}.rim{fill:none;stroke:#fff;stroke-width:.9;stroke-linecap:round;opacity:calc(var(--glint)*.7);vector-effect:non-scaling-stroke;pointer-events:none}.grainr{fill:none;stroke:var(--wood-side);stroke-width:.45;vector-effect:non-scaling-stroke;opacity:.7;pointer-events:none}.joint{fill:none;stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke;opacity:.45}.furrow{fill:none;stroke:var(--mill-side);stroke-width:.9;stroke-linecap:round;vector-effect:non-scaling-stroke}
.water{fill:url(#waterTop);stroke:none}.water-s{fill:url(#waterSide);stroke:none}.water-b{fill:var(--water);stroke:var(--water-deep);stroke-width:.5;vector-effect:non-scaling-stroke}.pool{fill:url(#poolG);stroke:var(--water-deep);stroke-width:.4;vector-effect:non-scaling-stroke}.glint{fill:none;stroke:#fff;stroke-width:.8;stroke-linecap:round;opacity:var(--glint);pointer-events:none}.ripple{fill:none;stroke:#fff;stroke-width:.6;stroke-linecap:round;pointer-events:none}.foam{fill:var(--foam);opacity:0;filter:url(#soft);pointer-events:none}
.flour{fill:var(--flour);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke}.stream{fill:none;stroke:var(--flour);stroke-width:1.1;stroke-linecap:round;stroke-dasharray:1.4 1.1}.grain{fill:var(--grain);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke}.trickle{fill:none;stroke:var(--grain);stroke-width:.7;stroke-dasharray:.8 .9}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<pattern id="planks" width="5" height="48" patternUnits="userSpaceOnUse"><path d="M0,0V48" class="seam"/><path d="M2.3,2C2.8,10 1.9,17 2.5,26S2.1,40 2.6,47" class="grainl"/></pattern>
<pattern id="boards" width="46" height="4.6" patternUnits="userSpaceOnUse"><path d="M0,0H46" class="seam"/><path d="M2,2.2C12,1.7 20,2.8 30,2.1S42,2.6 45,2.3" class="grainl"/></pattern>
<pattern id="masonry" width="12" height="7" patternUnits="userSpaceOnUse"><path d="M0,0H12M0,3.5H12M4.5,0V3.5M10.5,3.5V7" class="seam"/></pattern>
<pattern id="shingles" width="7" height="6" patternUnits="userSpaceOnUse"><path d="M0,0V6M3.5,0V6M0,3H3.5M3.5,0H7" class="seam"/></pattern>
<pattern id="hatch" width="3.4" height="3.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0,0V3.4" class="hl"/></pattern>
<linearGradient id="waterTop" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--water-top)"/><stop offset=".55" style="stop-color:var(--water)"/><stop offset="1" style="stop-color:var(--water-top)"/></linearGradient>
<linearGradient id="waterSide" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--water-top)"/><stop offset=".45" style="stop-color:var(--water)"/><stop offset="1" style="stop-color:var(--water-deep)"/></linearGradient>
<linearGradient id="poolG" x1="1" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--water-deep)"/><stop offset=".5" style="stop-color:var(--water)"/><stop offset="1" style="stop-color:var(--water-top)"/></linearGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* OSSENFORD M–3 overshot water mill. World: x lower-right, y lower-left (front faces +y), z up; 1 unit ≈ 5 cm.
Part                          x      y      z      w      d      h
millhouse walls               0      0      0     60     58     72   back, left (4 thick), cut open at y 58
right wall                   56      0      0      4     40     72   stepped down to z 30 in front, so the shaft shows
roof (slate)                 −4     −3   68.8     68     64   27.2   ridge along y at x 30, z 96; right slope cut at y 22
bridge beam                33.5      4   70.4    2.6     54    2.4   the upright shaft's top bearing, cut at y 58
hurst (stone platform)        6     33      3     25     22     13
bed + runner stones      c 18.75 44: r 11, z 16–21 / 21.6–26.4       the runner turns with the stone nut
hopper + shoe            c 10.5 35: z 35–44, 11 square at the top    shoe to the eye; it shakes as the stone turns
meal spout, sack           27.4   50.4   18.6     →  36 52 (sack r 3.3–4.4, h 13)
pit wheel                plane x 40, c 44 45: r 14, 32 cogs           on the wheel shaft
wallower                 c 34.75 44: r 5.25, 12 cogs, z 60.6–62      upright shaft z 3–70
great spur wheel         c 34.75 44: r 12, 30 cogs, z 66–67.6        stone nut c 18.75 44: r 4, 10 cogs
shaft                    r 3.2 at y 44 z 45, x 41–102.7              bearing pedestal 70 39.5 0 · 6 9 40
water wheel              shrouds x 80.5 / 98.5, c 44 45: r 30–40.5    20 elbow buckets, clasp arms
tailrace                     76     −6      0     28     98      7   water z 5, cut at y 92
head-race wall (cut)         79    −42      0     19     12    100   culvert at the flume floor
trestle                      80  −14.5      0     17      3     88
flume (launder)              81    −30     91     15     73      8   water from z 93; sluice at y 42–44, rack, hand wheel
sacks outside            x 6/15.5/25 y 66                            filled sacks, one by one
Gearing: pit 32 : wallower 12, spur 30 : stone nut 10, so the stone turns 8 times for each turn of the wheel. */
const draw=document.getElementById('drawing');let root=draw;
const{C,S,P,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,box,cylinder,frame}=kit(()=>root);
const{cos,sin,PI,abs,max,min,floor,round,atan2,exp}=Math,RAD=PI/180,TAU=2*PI,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>max(a,min(b,v)),into=g=>root=g;
// Figure helpers: screen paths through world points, iso ellipses as arcs (no plane transform, so the frame stays
// tight), textured faces, oriented slabs, controls.
const sp=p=>{const q=P(...p);return f2(q[0])+','+f2(q[1]);};
const pd=(pts,close=true)=>'M'+pts.map(sp).join('L')+(close?'Z':'');
const EA={x:-60,y:60,z:0};
function ell(c,r,ax){const q=P(...c),rx=r*1.2247,ry=r*.7071,a=EA[ax]*RAD,dx=rx*cos(a),dy=rx*sin(a),A=`A${f2(rx)},${f2(ry)} ${EA[ax]} 1 1 `;return`M${f2(q[0]+dx)},${f2(q[1]+dy)}${A}${f2(q[0]-dx)},${f2(q[1]-dy)}${A}${f2(q[0]+dx)},${f2(q[1]+dy)}Z`;}
const ring=(c,r0,r1,ax)=>ell(c,r1,ax)+ell(c,r0,ax);
const at=(c,ax,r,a)=>ax==='x'?[c[0],c[1]+r*cos(a),c[2]+r*sin(a)]:[c[0]+r*cos(a),c[1]+r*sin(a),c[2]];
function gear(c,r,n,th,ax,d=1.2){const k=TAU/n,pts=[];for(let i=0;i<n;i++)for(const[o,rr]of[[0,r-d],[.2,r],[.5,r],[.7,r-d]])pts.push(at(c,ax,rr,th+(i+o)*k));return pd(pts);}
function tex(g,x,y,w,h,t){rect(g,x,y,w,h,0,'tex '+t);}
// A cylinder in screen space (the kit's, without its plane transform, so a tall one doesn't inflate the frame).
function cyl(x,y,z,r,h,ax,cls){const g=el('g',{}),[a,b,c,d]={x:[C,-S,0,1],y:[C,S,0,1],z:[C,S,-C,S]}[ax],e=[x,y,z];e[{x:0,y:1,z:2}[ax]]+=h;
const p=P(x,y,z),q=P(...e),dx=q[0]-p[0],dy=q[1]-p[1],det=a*d-b*c,u=(d*dx-c*dy)/det,v=(-b*dx+a*dy)/det,l=Math.hypot(u,v)||1,tx=-v*r/l,ty=u*r/l,m=(U,V)=>f2(p[0]+a*U+c*V)+','+f2(p[1]+b*U+d*V),A=`A${f2(r*1.2247)},${f2(r*.7071)} ${EA[ax]} 0 1 `;
el('path',{d:`M${m(tx,ty)}${A}${m(-tx,-ty)}L${m(u-tx,v-ty)}${A}${m(u+tx,v+ty)}Z`,class:'face '+cls},g);el('path',{d:ell(e,r,ax),class:'face top '+cls},g);return g;}
const plane=(o,U,V)=>`matrix(${[...P(...U),...P(...V),...P(...o)].map(f2).join(' ')})`;
const ctl=(g,label)=>{for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0','aria-label':label}))set(g,k,v);return g;};
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
// Ground shadow, a projected ellipse under the house, wheel and race.
const sh=P(64,36,0);el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]),rx:62,ry:30,class:'shadow stage-floor'});el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]),rx:62,ry:30,class:'stage-contact'});
// Stone pier with the culvert, and the trestle: behind the wheel.
box(79,-42,0,19,12,100,0,'stone dk');{const f=group(FRONT(79,-30,100));tex(f,0,0,19,100,'t-stone');el('path',{d:'M3.6,9V4.6A5.9,3.2 0 0 1 15.4,4.6V9Z',class:'face recess'},f);for(const v of[14,40,66,92])line(f,0,v,19,v);const s=group(SIDE(98,-30,100));tex(s,0,0,12,100,'t-hatch');const t=group(TOP(79,-42,100));tex(t,0,0,19,12,'t-hatch');}
for(const x of[81,94])box(x,-14,0,2,2,88,.4,'wood');box(80,-14.5,85,17,3,3,.6,'wood');box(80,-14.5,40,17,3,2.4,.6,'wood');
el('path',{d:pd([[82,-12,42],[82,-12,44.4],[95,-12,84],[95,-12,81.6]]),class:'face wood'});
// The millhouse: back and left walls (inner faces planked over a stone footing), floor, then the works inside.
box(0,0,0,60,4,72,.4,'plank');{const f=group(FRONT(0,4,72));tex(f,0,0,60,56,'t-planks');rect(f,0,56,60,16,0,'face stone');tex(f,0,56,60,16,'t-stone');rect(f,40,18,11,13,.6,'face recess');rect(f,41,19,9,11,.4,'face top');line(f,45.5,19,45.5,30);line(f,41,24.5,50,24.5);
}
box(0,4,0,4,54,72,.4,'plank');{const s=group(SIDE(4,58,72));tex(s,0,0,54,56,'t-planks');rect(s,0,56,54,16,0,'face stone');tex(s,0,56,54,16,'t-stone');const f=group(FRONT(0,58,72));tex(f,0,0,4,72,'t-hatch');}
box(4,4,0,52,54,3,0,'plank');{const t=group(TOP(4,4,3));tex(t,0,0,52,54,'t-boards');const f=group(FRONT(4,58,3));tex(f,0,0,52,3,'t-hatch');}
// Hurst and stones; the runner's furrows and rynd turn with it.
box(6,33,3,25,22,13,.6,'stone');{const f=group(FRONT(6,55,16));tex(f,0,0,25,13,'t-stone');const s=group(SIDE(31,55,16));tex(s,0,0,22,13,'t-stone');}
const SX=18.75,SY=44;cylinder(SX,SY,16,11,5,'z','mill');cylinder(SX,SY,21.2,11.2,.4,'z','wood');const runner=cylinder(SX,SY,21.6,11,4.8,'z','mill');circle(runner.face,0,0,2.6,'face recess');
const FUR=[...Array(8)].map(()=>el('line',{class:'furrow'})),rynd=el('line',{class:'detail',style:'stroke-width:1.6;stroke:var(--iron)'});
// Hopper (on cleats to the left wall), its grain, the shoe and the trickle into the eye.
const HX=10.5,HY=35,hz0=35,hz1=44,ht=[[HX-5.5,HY-5.5],[HX+5.5,HY-5.5],[HX+5.5,HY+5.5],[HX-5.5,HY+5.5]],hb=[[HX-1.5,HY-1.5],[HX+1.5,HY-1.5],[HX+1.5,HY+1.5],[HX-1.5,HY+1.5]];
for(const z of[40,44.5])box(4,HY-.8,z,2,1.6,1.4,.3,'wood');
el('path',{d:pd([[...ht[3],hz1],[...ht[2],hz1],[...hb[2],hz0],[...hb[3],hz0]]),class:'face plank'});el('path',{d:pd([[...ht[1],hz1],[...ht[2],hz1],[...hb[2],hz0],[...hb[1],hz0]]),class:'face side plank'});
el('path',{d:pd(ht.map(p=>[...p,hz1])),class:'face top plank'});el('path',{d:pd(ht.map(([x,y])=>[HX+(x-HX)*.82,HY+(y-HY)*.82,hz1-.3])),class:'grain'});
const shoe=el('path',{class:'face plank'}),trickle=el('path',{class:'trickle'}),shoeAt=k=>set(shoe,'d',pd([[HX-1.4,HY+1.4,hz0],[HX+1.4,HY+1.4,hz0],[SX-2.6+k,SY-1.6,28.4],[SX-4.4+k,SY-3,28.4]]));
// Stone spindle, upright shaft, the gears and the bridge beam that carries the shaft's top.
cyl(SX,SY,26.4,.9,40,'z','iron');const UX=34.75;cyl(UX,SY,3,1.7,67,'z','wood');
const PIT={c:[40,SY,45],r:14,n:32},WAL={c:[UX,SY,60.6],r:5.25,n:12},SPUR={c:[UX,SY,66],r:12,n:30},NUT={c:[SX,SY,66],r:4,n:10};
const pitB=el('path',{class:'face side wood'}),pitF=el('path',{class:'face wood'}),pitA=[0,1].map(()=>el('path',{class:'face top wood'}));
circle(cylinder(41.2,SY,45,4.4,1.2,'x','iron').face,0,0,3.3,'detail');
const walB=el('path',{class:'face side wood'}),walT=el('path',{class:'face top wood'});
const spurB=el('path',{class:'face side wood'}),spurT=el('path',{class:'face top wood'}),spurA=[0,1].map(()=>el('path',{class:'face wood'}));
const nutB=el('path',{class:'face side iron'}),nutT=el('path',{class:'face top iron'});
for(const g of[SPUR,NUT])cylinder(g.c[0],g.c[1],g.c[2]+1.6,g===SPUR?2.6:1.6,1.2,'z','iron');
box(33.5,4,70.4,2.6,54,2.4,.4,'wood');tex(group(FRONT(33.5,58,72.8)),0,0,2.6,2.4,'t-hatch');
// Meal spout, the sack under it filling with flour, the flour stream.
el('path',{d:pd([[27.4,50.4,18.6],[29.4,50.4,18.6],[35,51,15.6],[33,51,15.6]]),class:'face side wood'});el('path',{d:pd([[27.4,50.4,18.6],[29.4,50.4,18.6],[29.4,50.4,17.2],[27.4,50.4,17.2]]),class:'face wood'});
const sackB=el('path',{class:'face sack'}),sackS=el('path',{class:'face side sack'}),sackM=el('path',{class:'face recess'}),sackF=el('path',{class:'flour'}),stream=el('path',{class:'stream'});
// Right wall, stepped down in front so the shaft and the pit wheel show, then the roof, cut back over the works.
box(56,0,0,4,40,72,.4,'plank');{const s=group(SIDE(60,40,72));tex(s,0,0,40,56,'t-planks');rect(s,0,56,40,16,0,'face stone');tex(s,0,56,40,16,'t-stone');tex(group(FRONT(56,40,72)),0,0,4,42,'t-hatch');}
box(56,40,0,4,18,30,.4,'plank');{const s=group(SIDE(60,58,30));tex(s,0,0,18,14,'t-planks');rect(s,0,14,18,16,0,'face stone');tex(s,0,14,18,16,'t-stone');tex(group(FRONT(56,58,30)),0,0,4,30,'t-hatch');tex(group(TOP(56,40,30)),0,0,4,18,'t-hatch');}
const RZ=68.8,RT=2.6,RL=Math.hypot(34,27.2),UL=[34/RL,0,27.2/RL],UR=[34/RL,0,-27.2/RL],NL=[-27.2/RL,0,34/RL],NR=[27.2/RL,0,34/RL],Y0=-3;
// A roof slope from y0 to y1: shingled top, and its end at y1, hatched where the cutaway cuts it, else a bargeboard.
function slab(o,U,N,cls,y1,cut){const L=RL,D=y1-Y0,add=(a,b,k)=>a.map((v,i)=>v+b[i]*k),o2=add(o,N,RT),e=[o[0],y1,o[2]];
el('path',{d:pd([o2,add(o2,U,L),add(add(o2,U,L),[0,1,0],D),add(o2,[0,1,0],D)]),class:'face '+cls});const g=group(plane(o2,U,[0,1,0]));tex(g,0,0,L,D,'t-shingle');
if(cut){el('path',{d:pd([e,add(e,U,L),add(add(e,U,L),N,RT),add(e,N,RT)]),class:'face side slate'});tex(group(plane(e,U,N)),0,0,L,RT,'t-hatch');}
else{const b=[e[0],y1+.3,e[2]];el('path',{d:pd([add(b,N,-1.6),add(add(b,U,L),N,-1.6),add(add(b,U,L),N,RT+.8),add(b,N,RT+.8)]),class:'face wood'});}}
slab([-4,Y0,RZ],UL,NL,'top slate',61,false);box(28.4,Y0-.6,95.6,3.2,64.6,2.4,.6,'slate');slab([30,Y0,96],UR,NR,'slate',22,true);
// The shaft runs from the pit wheel over the cut wall to a bearing on a stone pedestal, then to the wheel.
box(70,39.5,0,6,9,40,.6,'stone');{const f=group(FRONT(70,48.5,40));tex(f,0,0,6,40,'t-stone');}box(69.4,39,40,7.2,10,2.6,.4,'iron');
cyl(41,SY,45,3.2,39.5,'x','iron');
// Tailrace: back wall, left wall, the water (ripples run downstream).
box(76,-6,0,28,3,7,.4,'stone');box(76,-3,0,3.5,95,7,.4,'stone');{const t=group(SIDE(79.5,92,7));tex(t,0,0,95,7,'t-stone');}
const WZ=5;el('path',{d:pd([[79.5,-3,WZ],[100.5,-3,WZ],[100.5,92,WZ],[79.5,92,WZ]]),class:'pool'});
const RIP=[...Array(7)].map(()=>el('path',{class:'ripple'}));
// The wheel: far shroud and arms, the buckets (depth-sorted every frame), the shaft, near shroud, arms and joints.
const YC=44,ZC=45,X0=80.5,X1=98.5,N=20,DA=TAU/N,RS=31,RE=36,RO=40,KE=2*RAD,KL=13*RAD,C0=[X0,YC,ZC],C1=[X1,YC,ZC];
const W=(x,y,z)=>[x,YC+y,ZC+z],pol=(r,a)=>[r*cos(a),r*sin(a)];
el('path',{d:ring(C0,30,40.5,'x'),'fill-rule':'evenodd',class:'face side wood'});
const armF=[...Array(4)].map(()=>el('path',{class:'face side wood'}));
const BK=el('g',{}),BUCKETS=[...Array(N)].map((_,i)=>{const g=el('g',{},BK);return{i,g,sole:el('path',{},g),s1:el('path',{},g),s2:el('path',{},g),wat:el('path',{class:'water-b'},g),v:0,out:null};});
cyl(X0-.5,YC,ZC,3.2,X1-X0+.5,'x','iron');
el('path',{d:ring([X1-1.4,YC,ZC],30,40.5,'x'),'fill-rule':'evenodd',class:'face side wood'});
const armN=[...Array(4)].map(()=>el('path',{class:'face wood'}));
el('path',{d:ring(C1,30,40.5,'x'),'fill-rule':'evenodd',class:'face wood'});el('path',{d:ell(C1,RS,'x'),class:'grainr'});el('path',{d:pd([...Array(13)].map((_,k)=>W(X1+.05,...pol(39.6,(58+k*7)*RAD))),false),class:'rim'});el('path',{d:ell(C1,39.2,'x'),class:'grainr'});const PROF=BUCKETS.map(()=>el('path',{class:'profile'}));
const JOINTS=[...Array(8)].map(()=>el('line',{class:'joint'})),BOLTS=[...Array(8)].map(()=>el('circle',{r:.75,class:'face top iron'}));
cyl(X1,YC,ZC,3.6,4.2,'x','iron');const gud=el('line',{class:'detail',style:'stroke:var(--iron-top);stroke-width:1.2'});
// The spill from the lower buckets into the race, and its foam.
const spill=el('path',{class:'water-s',style:'opacity:0'}),spillG=el('path',{class:'glint',style:'opacity:0;stroke-dasharray:2 3'}),foam=el('ellipse',{class:'foam'});
// The race's right wall over the wheel's foot, its cut end and the water's section.
box(100.5,-3,0,3.5,95,7,.4,'stone');{const s=group(SIDE(104,92,7));tex(s,0,0,95,7,'t-stone');const f=group(FRONT(76,92,7));tex(f,0,0,3.5,7,'t-hatch');tex(f,24.5,0,3.5,7,'t-hatch');rect(f,3.5,2,21,5,0,'face water-s');}
// The flume: floor, near and far sides, its water; the sluice gate at its end with a rack and a hand wheel; the jet.
const FX0=82.6,FX1=94.4,FY0=-30,FY1=43,FZ=93;
box(81,FY0,91,15,FY1-FY0,2,.4,'wood');box(81,FY0,93,1.6,FY1-FY0,6,.4,'wood');
const fw=el('path',{class:'water'}),FRIP=[...Array(5)].map(()=>el('path',{class:'ripple'}));
box(94.4,FY0,93,1.6,FY1-FY0,6,.4,'wood');{const s=group(SIDE(96,FY1,99));tex(s,0,0,FY1-FY0,6,'t-boards');const s2=group(SIDE(96,FY1,93));tex(s2,0,0,FY1-FY0,2,'t-boards');const pl=group(SIDE(96.05,FY1-6,98.6));rect(pl,0,0,17,4.4,.8,'face brass');rect(pl,.6,.6,15.8,3.2,.5,'detail');text(pl,8.5,3.05,'OSSENFORD','plate');}
for(const x of[80,96.4])box(x,FY1-1,93,1.6,2.2,19,.4,'wood');box(80,FY1-1,110,18,2.2,2.6,.5,'wood');
const gateG=el('g',{});into(gateG);box(FX0,FY1-.6,FZ,FX1-FX0,1.4,12,.5,'wood');{const f=group(FRONT(FX0,FY1+.8,FZ+12),gateG);tex(f,0,0,FX1-FX0,12,'t-boards');}box(87.6,FY1+.8,FZ+4,1.6,.8,21,.3,'iron');into(draw);
const HW=[98,FY1,111.3];cyl(96.4,FY1,111.3,1,1.6,'x','iron');
el('path',{d:ring(HW,3.6,4.6,'x'),'fill-rule':'evenodd',class:'face iron'});const SPK=[0,1].map(()=>el('path',{class:'detail',style:'stroke:var(--iron);stroke-width:1.1'}));
const jetT=el('path',{class:'water'}),jetS=el('path',{class:'water-s'}),jetG=el('path',{class:'glint',style:'stroke-dasharray:3 2.5'});
// Sacks set outside the door as they fill.
const OUT=[6,15.5,25].map(x=>{const g=el('g',{class:'sackout',style:'display:none'});into(g);sackShape(g,[x,66,0],4.3,12.5,1);into(draw);return g;});
function sackShape(g,[x,y,z],r,h,full){const b=P(x,y,z),t=P(x,y,z+h),rx=r*1.2247,ry=r*.7071,tw=r*(full?.55:.85)*1.2247;
el('path',{d:`M${f2(b[0]-rx)},${f2(b[1])}C${f2(b[0]-rx*1.08)},${f2(b[1]-h*.55)} ${f2(t[0]-tw*1.3)},${f2(t[1]+h*.2)} ${f2(t[0]-tw)},${f2(t[1])}L${f2(t[0]+tw)},${f2(t[1])}C${f2(t[0]+tw*1.3)},${f2(t[1]+h*.2)} ${f2(b[0]+rx*1.08)},${f2(b[1]-h*.55)} ${f2(b[0]+rx)},${f2(b[1])}A${f2(rx)},${f2(ry)} 0 0 1 ${f2(b[0]-rx)},${f2(b[1])}Z`,class:'face sack'},g);
el('path',{d:`M${f2(b[0]+rx*.2)},${f2(b[1]+ry*.98)}C${f2(b[0]+rx*.9)},${f2(b[1]-h*.3)} ${f2(t[0]+tw*.9)},${f2(t[1]+h*.25)} ${f2(t[0]+tw)},${f2(t[1])}`,class:'detail'},g);
el('ellipse',{cx:f2(t[0]),cy:f2(t[1]),rx:f2(tw),ry:f2(tw*.45),class:'face top sack'},g);el('path',{d:`M${f2(t[0]-1)},${f2(t[1]-.6)}l1,-2.2l1,2.2`,class:'detail'},g);
const m=P(x,y+r*.72,z+h*.45);el('path',{d:`M${f2(m[0]-2.2)},${f2(m[1]-1.6)}h4.4M${f2(m[0]-2.2)},${f2(m[1]+.4)}h4.4`,class:'detail',style:'stroke:var(--wood-side)'},g);}
// The control: the sluice gate and its hand wheel (Space).
const sluice=ctl(el('g',{}),'Sluice gate: open or close it (Space)');{const hit=pd([[80,FY1-1,90],[98,FY1-1,90],[98,FY1+1.2,116],[80,FY1+1.2,116]]);el('path',{d:hit,class:'hit'},sluice);el('path',{d:hit,class:'focus-ring'},sluice);el('path',{d:ell(HW,6,'x'),class:'hit'},sluice);}
frame([[2,71,0,0,0,0],[98,-42,0,0,0,0],[29,-3,99,0,0,0],[104,92,0,0,0,0]],10);
// State: the sluice and the flow setting, the wheel's speed (it gathers way and coasts), the buckets' water, the
// flour. Progress: the four sacks of a batch fill with it; done fills the last, shuts the sluice and lets it rest.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const say=m=>{announcement.textContent=m;};
const RATIO=8,KG=1.6,SACKS=4,REST=-.37;
let open=true,flow=.6,gopen=.6,rpm=2+6.5*.6,th=REST,tw=0,tn=0,flour=1.4,mode='ind',target=0,done=0,fullT=0,spillR=0,last=0,note='',noteT=0,outKey='',drawn='',shook=0,ac=null,nb=null,wn=null,wg=null,lastClack=0;
const goal=()=>open?flow:0,want=g=>g>.01?2+6.5*g:0;
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function rush(level){const a=ac;if(!a)return;try{if(!wn){nb=a.createBuffer(1,a.sampleRate*2,a.sampleRate);const d=nb.getChannelData(0);let b=0;for(let i=0;i<d.length;i++){b=b*.96+(Math.random()*2-1)*.2;d[i]=b;}wn=a.createBufferSource();wn.buffer=nb;wn.loop=true;const f=a.createBiquadFilter();f.type='bandpass';f.frequency.value=700;f.Q.value=.7;wg=a.createGain();wg.gain.value=0;wn.connect(f);f.connect(wg);wg.connect(a.destination);wn.start();}wg.gain.setTargetAtTime(level,a.currentTime,.25);}catch(_){}}
function tone(f,d,v,type='sine',f1=0){const a=ac;if(!a)return;try{const t=a.currentTime,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
function notice(m,a){note=m;noteT=performance.now()+1600;if(a)say(a);}
function sync(){set(sluice,'aria-pressed',open);set(sluice,'aria-label',`Sluice gate: ${open?'shut it':'open it'} (Space)`);outKey='';}
function setSluice(o){audio();if(done===2&&o){done=0;flour=0;mode='ind';}open=o;tone(o?220:150,.18,.03,'triangle',o?330:90);say(o?`Sluice open at ${round(flow*100)} percent: water runs down the flume and fills the buckets.`:'Sluice shut: the wheel runs on until its buckets are empty, then comes to rest.');sync();}
function toggle(){setSluice(!open);}
function setFlow(d){audio();if(d>0&&!open){setSluice(true);return;}if(d<0&&!open){notice('SLUICE SHUT · ↑ OR SPACE OPENS IT','The sluice is already shut.');return;}const f=round(clamp(flow+d*.2,.2,1)*10)/10;if(d<0&&flow<=.2){setSluice(false);return;}if(f===flow){notice('FULL FLOW · SLUICE 100%','The sluice is fully open.');return;}flow=f;tone(260+flow*200,.08,.02,'triangle');say(`Flow ${round(flow*100)} percent.`);sync();}
function setProgress(p){if(p==null||!isFinite(p)){mode='ind';done=0;}else{const t=clamp(+p)*SACKS;if(mode!=='det'||done||t<flour-1e-6){flour=0;}mode='det';done=0;target=t;}if(!open)open=true;if(reduced.matches)settle();sync();}
function finish(){audio();if(done)return;done=1;mode='det';target=SACKS;if(!open)open=true;say('Finishing: the last sack fills, then the sluice shuts.');if(reduced.matches)settle();sync();}
function settle(){if(mode==='det')flour=done?SACKS:target;if(done&&flour>=SACKS){done=2;open=false;}}
function stepKey(){audio();const t=mode==='det'&&!done?floor(target/SACKS*4+1e-6)/4+.25:.25;if(t>1){setProgress(null);say('Indeterminate: the mill runs on its own and the sacks are carted away when full.');}else{setProgress(t);say(`Progress ${round(t*100)} percent: ${round(t*SACKS)} of ${SACKS} sacks.`);}}
window.figure={setProgress,done:finish};
bind(sluice,toggle);
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented||e.repeat)return;const k=e.key.length===1?e.key.toLowerCase():e.key;
const act={' ':toggle,ArrowUp:()=>setFlow(1),ArrowDown:()=>setFlow(-1),p:stepKey,Enter:finish}[k];if(act){if((k===' '||k==='Enter')&&e.target.closest&&e.target.closest('[role=button]'))return;e.preventDefault();act();}});
// Bucket geometry, in the wheel's plane (y, z from the shaft): bucket i lies between board i (sole at a, elbow,
// lip) and board i + 1. Its water is the cavity clipped at a level; it spills over the lower lip.
function cav(a){const b=a+DA;return[pol(RS,a),pol(RS,b),pol(RE,b+KE),pol(RO,b+KL),pol(RO,a+KL),pol(RE,a+KE)];}
function clip(Q,L){const o=[];for(let i=0;i<Q.length;i++){const p=Q[i],q=Q[(i+1)%Q.length],pi=p[1]<=L,qi=q[1]<=L;if(pi)o.push(p);if(pi!==qi){const t=(L-p[1])/(q[1]-p[1]);o.push([p[0]+(q[0]-p[0])*t,L]);}}return o;}
const area=Q=>{let s=0;for(let i=0;i<Q.length;i++){const p=Q[i],q=Q[(i+1)%Q.length];s+=p[0]*q[1]-q[0]*p[1];}return abs(s)/2;};
const capOf=Q=>area(clip(Q,min(Q[3][1],Q[4][1])));
function level(Q,v){let lo=min(...Q.map(p=>p[1])),hi=min(Q[3][1],Q[4][1]);for(let k=0;k<14;k++){const m=(lo+hi)/2;if(area(clip(Q,m))<v)lo=m;else hi=m;}return lo;}
const face=(p,q)=>{let ny=-(q[1]-p[1]),nz=q[0]-p[0];if(ny+nz<0){ny=-ny;nz=-nz;}const l=Math.hypot(ny,nz)||1;nz/=l;return nz>.55?'face top wood':nz<-.3?'face side wood':'face wood';};
const quad=(p,q)=>pd([W(X0,...p),W(X1,...p),W(X1,...q),W(X0,...q)]);
const lit=(n,c)=>{if(n._c!==c){n._c=c;set(n,'class',c);}};
// The jet under the gate: a sheet that leaves the flume at the flow's speed and falls onto the top buckets.
function jet(g){const h=1+4.2*g,v=12+20*g,G=260,pts=(z0,x)=>{const o=[];let land=0;for(let k=0;k<=10;k++){const t=k*.016,y=FY1+.8+v*t,z=z0-G*t*t/2;o.push([x,y,z]);if((y-YC)**2+(z-ZC)**2<(RO-1.5)**2){land=1;break;}}return{o,land};};
const top=pts(FZ+h,FX0),topR=pts(FZ+h,FX1),bot=pts(FZ,FX1);return{top,topR,bot};}
// Steady fill for a still wheel (reduced motion): the descending side's buckets hold water by the flow.
function steady(g){for(const b of BUCKETS){const a=th+b.i*DA,Q=cav(a),m=((a+DA/2)%TAU+TAU)%TAU,mid=m>PI?m-TAU:m;b.v=g>.01&&mid>-70*RAD&&mid<100*RAD?capOf(Q)*(.45+.4*g):0;}}
function drawWheel(){const order=BUCKETS.map(b=>{const a=th+b.i*DA,Q=cav(a),key=sin(a+DA/2+PI/4);return{b,a,Q,key};}).sort((p,q)=>p.key-q.key);
const ok=order.map(o=>o.b.i).join();if(ok!==drawWheel.ok){drawWheel.ok=ok;for(const o of order)BK.appendChild(o.b.g);}
for(const{b,a,Q,key}of order){const s=Q[0],e=Q[5],l=Q[4],n=Q[1];set(b.sole,'d',quad(s,n));set(b.s1,'d',quad(s,e));set(b.s2,'d',quad(e,l));lit(b.sole,face(s,n));lit(b.s1,face(s,e));lit(b.s2,face(e,l));
const out=key>0;if(out!==b.out){b.out=out;const kids=out?[b.sole,b.s1,b.s2,b.wat]:[b.wat,b.s2,b.s1,b.sole];for(const k of kids)b.g.appendChild(k);}
if(b.v>.5){const L=level(Q,b.v),cq=clip(Q,L),ys=cq.filter(p=>abs(p[1]-L)<1e-6).map(p=>p[0]);if(ys.length>1){const y0=min(...ys),y1=max(...ys);set(b.wat,'d',pd([W(X0+.6,y0,L),W(X1-.6,y0,L),W(X1-.6,y1,L),W(X0+.6,y1,L)]));}else set(b.wat,'d','');}else set(b.wat,'d','');}
const arm=(ns,x,ang)=>ns.forEach((n,k)=>{const d=ang+(k>1?PI/2:0),o=k%2?5:-5,c=cos(d),s=sin(d),pc=-s,ps=c,p=(t,w)=>W(x,t*c+(o+w)*pc,t*s+(o+w)*ps);set(n,'d',pd([p(-30,-1.5),p(30,-1.5),p(30,1.5),p(-30,1.5)]));});
arm(armF,X0+.8,th);arm(armN,X1-1.1,th);
PROF.forEach((n,i)=>{const a=th+i*DA;set(n,'d',pd([W(X1,...pol(RS,a)),W(X1,...pol(RE,a+KE)),W(X1,...pol(RO-.4,a+KL))],false));});
JOINTS.forEach((n,k)=>{const a=th+(k+.5)*PI/4,p=P(...W(X1,...pol(30.2,a))),q=P(...W(X1,...pol(40.3,a)));set(n,'x1',f2(p[0]));set(n,'y1',f2(p[1]));set(n,'x2',f2(q[0]));set(n,'y2',f2(q[1]));});
BOLTS.forEach((n,k)=>{const d=th+(k>3?PI/2:0)+(k%2?PI:0),o=(k>>1)%2?5:-5,q=P(...W(X1+.1,28*cos(d)-o*sin(d),28*sin(d)+o*cos(d)));set(n,'cx',f2(q[0]));set(n,'cy',f2(q[1]));});
const a=P(...W(X1+4.25,...pol(2.4,th))),b=P(...W(X1+4.25,...pol(-2.4,th)));set(gud,'x1',f2(a[0]));set(gud,'y1',f2(a[1]));set(gud,'x2',f2(b[0]));set(gud,'y2',f2(b[1]));
// The works inside turn with it: pit wheel (same shaft), wallower and spur (×32/12), stone nut and runner (×8).
set(pitB,'d',gear([38.8,SY,45],PIT.r,PIT.n,th,'x'));set(pitF,'d',gear([41.2,SY,45],PIT.r,PIT.n,th,'x'));
pitA.forEach((n,k)=>{const d=th+k*PI/2,c=cos(d),s=sin(d),p=(t,w)=>[41.25,SY+t*c-w*s,45+t*s+w*c];set(n,'d',pd([p(-12.5,-1.2),p(12.5,-1.2),p(12.5,1.2),p(-12.5,1.2)]));});
set(walB,'d',gear([UX,SY,60.6],WAL.r,WAL.n,tw,'z'));set(walT,'d',gear([UX,SY,62],WAL.r,WAL.n,tw,'z'));
set(spurB,'d',gear([UX,SY,66],SPUR.r,SPUR.n,tw,'z'));set(spurT,'d',gear([UX,SY,67.6],SPUR.r,SPUR.n,tw,'z'));
spurA.forEach((n,k)=>{const d=tw+k*PI/2,c=cos(d),s=sin(d),p=(t,w)=>[UX+t*c-w*s,SY+t*s+w*c,67.65];set(n,'d',pd([p(-10.8,-1),p(10.8,-1),p(10.8,1),p(-10.8,1)]));});
set(nutB,'d',gear([SX,SY,66],NUT.r,NUT.n,tn,'z',.9));set(nutT,'d',gear([SX,SY,67.6],NUT.r,NUT.n,tn,'z',.9));
FUR.forEach((n,k)=>{const d=tn+k*PI/4,p=P(SX+3.6*cos(d)+1.4*cos(d+PI/2),SY+3.6*sin(d)+1.4*sin(d+PI/2),26.45),q=P(SX+10.2*cos(d-.18),SY+10.2*sin(d-.18),26.45);set(n,'x1',f2(p[0]));set(n,'y1',f2(p[1]));set(n,'x2',f2(q[0]));set(n,'y2',f2(q[1]));});
{const p=P(SX+2.4*cos(tn),SY+2.4*sin(tn),26.5),q=P(SX-2.4*cos(tn),SY-2.4*sin(tn),26.5);set(rynd,'x1',f2(p[0]));set(rynd,'y1',f2(p[1]));set(rynd,'x2',f2(q[0]));set(rynd,'y2',f2(q[1]));}}
function drawWater(now,red){const g=gopen,run=g>.01,t=red?0:now/1000,wl=FZ+(run?4.4-1.2*g:5.4);
set(fw,'d',pd([[FX0,FY0,wl],[FX1,FY0,wl],[FX1,FY1-.6,wl],[FX0,FY1-.6,wl]]));
FRIP.forEach((n,k)=>{const y=FY0+3+((k*13.4+(run?t*(10+20*g):0))%62),x0=FX0+1.5+(k%2)*2,x1=FX1-1.5-(k%3);set(n,'d',`M${sp([x0,y,wl])}Q${sp([(x0+x1)/2,y+1.6,wl])} ${sp([x1,y,wl])}`);n.style.opacity=f2(run?.55*sin(PI*clamp((y-FY0)/(FY1-FY0))):.18);});
set(gateG,'transform',`translate(0 ${f2(-g*9)})`);SPK.forEach((n,k)=>{const d=g*12.6+k*PI/2,c=4*cos(d),s=4*sin(d);set(n,'d',pd([[98.05,FY1+c,111.3+s],[98.05,FY1-c,111.3-s]],false));});
if(run){const j=jet(g),cut=(o,b)=>o.concat(b.slice().reverse());set(jetT,'d',pd(cut(j.top.o,j.topR.o)));set(jetS,'d',pd(cut(j.topR.o,j.bot.o)));const mid=j.top.o.map(p=>[89,p[1],p[2]+.05]);set(jetG,'d',pd(mid,false));jetG.style.strokeDashoffset=f2(-t*40);}else for(const n of[jetT,jetS,jetG])set(n,'d','');
const sv=red?(run?.85:0):clamp(spillR/90);spill.style.opacity=f2(sv);spillG.style.opacity=f2(sv*.8);foam.style.opacity=f2(sv*.55);
if(sv>0){const a=-27*RAD,ty=40.2*cos(a),tz=40.2*sin(a),Q=(x,y,z)=>sp(W(x,y,z));set(spill,'d',`M${Q(82,ty,tz)}L${Q(97,ty,tz)}Q${Q(97,ty+4.6,tz-6)} ${Q(97,ty+4,WZ-ZC)}L${Q(82,ty+4,WZ-ZC)}Q${Q(82,ty+4.6,tz-6)} ${Q(82,ty,tz)}Z`);set(spillG,'d',`M${Q(90,ty+.6,tz-.6)}Q${Q(90,ty+5,tz-6)} ${Q(90,ty+4.4,WZ-ZC+.5)}`);spillG.style.strokeDashoffset=f2(-t*30);const q=P(...W(89.5,36,-ZC+WZ));set(foam,'cx',f2(q[0]));set(foam,'cy',f2(q[1]));set(foam,'rx',f2(10+(red?0:sin(t*7)*.8)));set(foam,'ry',f2(4.2));}
RIP.forEach((n,k)=>{const y=-1+((k*13.6+(run||rpm>.2?t*(6+10*g):0))%92),x0=80.5+(k%3)*1.4,x1=99.5-(k%2)*1.6;set(n,'d',`M${sp([x0,y,WZ])}Q${sp([(x0+x1)/2,y+2.2,WZ])} ${sp([x1,y,WZ])}`);n.style.opacity=f2((run?.5:.22)*sin(PI*clamp((y+1)/92)));});}
function drawSacks(){const n=min(3,floor(flour+1e-6)),f=flour>=SACKS-1e-6?1:flour-floor(flour+1e-6);OUT.forEach((g,k)=>g.style.display=k<n?'':'none');
const x=36,y=52,z=3,h=13,r=3.3+1.1*f,b=P(x,y,z),t=P(x,y,z+h),rx=r*1.2247,ry=r*.7071,lv=P(x,y,z+h*max(.08,f)*.92),mr=3*1.2247;
set(sackB,'d',`M${f2(b[0]-rx)},${f2(b[1])}C${f2(b[0]-rx*1.1)},${f2(lv[1])} ${f2(t[0]-mr*1.2)},${f2(t[1]+3)} ${f2(t[0]-mr)},${f2(t[1])}L${f2(t[0]+mr)},${f2(t[1])}C${f2(t[0]+mr*1.2)},${f2(t[1]+3)} ${f2(b[0]+rx*1.1)},${f2(lv[1])} ${f2(b[0]+rx)},${f2(b[1])}A${f2(rx)},${f2(ry)} 0 0 1 ${f2(b[0]-rx)},${f2(b[1])}Z`);
set(sackS,'d',`M${f2(b[0]+rx*.15)},${f2(b[1]+ry)}C${f2(b[0]+rx*.95)},${f2(lv[1])} ${f2(t[0]+mr*.95)},${f2(t[1]+3)} ${f2(t[0]+mr)},${f2(t[1])}L${f2(t[0]+mr*.4)},${f2(t[1])}C${f2(t[0]+mr*.5)},${f2(t[1]+4)} ${f2(b[0]+rx*.2)},${f2(lv[1]+2)} ${f2(b[0]+rx*.15)},${f2(b[1]+ry)}Z`);
set(sackM,'d',`M${f2(t[0]-mr)},${f2(t[1])}A${f2(mr)},${f2(mr*.42)} 0 1 0 ${f2(t[0]+mr)},${f2(t[1])}A${f2(mr)},${f2(mr*.42)} 0 1 0 ${f2(t[0]-mr)},${f2(t[1])}Z`);
const fl=P(x,y,z+h*f*.96),fr=mr*.92;set(sackF,'d',f>.8?`M${f2(fl[0]-fr)},${f2(fl[1])}A${f2(fr)},${f2(fr*.42)} 0 1 0 ${f2(fl[0]+fr)},${f2(fl[1])}A${f2(fr)},${f2(fr*.42)} 0 1 0 ${f2(fl[0]-fr)},${f2(fl[1])}Z`:'');}
function ui(now){const s=round(rpm*RATIO),kg=round(rpm*RATIO*KG),r=rpm.toFixed(1),pct=round(flour/SACKS*100),k=min(SACKS,floor(flour+1e-6)+1);
const ro=done===2?'PROGRESS 100% · COMPLETE':mode==='det'?`PROGRESS ${pct}% · ${r} RPM`:`${r} RPM · STONE ${s} RPM · ${kg} KG/H`;
const st=now<noteT?note:done===2?(rpm>.05?'COMPLETE · WHEEL COASTING':'COMPLETE · SACKS FULL'):done===1?`FINISHING · SACK ${k} OF ${SACKS}`:!open?(rpm>.05?'SLUICE SHUT · WHEEL COASTING':'SLUICE SHUT · SPACE OPENS IT'):gopen<goal()-.02?`SLUICE OPENING · ${round(flow*100)}%`:rpm<want(goal())-.35?`WHEEL STARTING · SLUICE ${round(flow*100)}%`:mode==='det'&&flour>=target-1e-6?`WAITING · ${pct}% MILLED`:`MILLING · SLUICE ${round(flow*100)}% · SACK ${k}`;
if(ro+st!==outKey){outKey=ro+st;readout.textContent=ro;stateLabel.textContent=st;}}
function tick(now){const dt=Math.min(.05,(now-(last||now))/1000),red=reduced.matches;last=now;
// Gate, then the wheel's speed: it gathers way slowly and coasts longer; reduced motion jumps to the steady state.
const G=goal();if(red)gopen=G;else gopen+=clamp(G-gopen,-dt*.7,dt*.7);const tg=want(gopen);
if(red)rpm=tg;else{rpm+=(tg-rpm)*(1-exp(-dt*(tg>rpm?.42:.26)));if(tg===0&&rpm<.25)rpm=max(0,rpm-dt*.35);if(abs(tg-rpm)<.015)rpm=tg;}
const om=rpm*TAU/60;if(!red){th-=om*dt;tw+=om*32/12*dt;tn-=om*RATIO*dt;}
// Buckets: water in under the jet's landing, out over the lower lip.
if(red)steady(gopen);else{let spilt=0;const land=jet(gopen).top.o.at(-1),la=atan2(land[2]-ZC,land[1]-YC);
for(const b of BUCKETS){const a=th+b.i*DA,Q=cav(a),c=capOf(Q);if(b.v>c){spilt+=b.v-c;b.v=c;}const m0=a+KL,d=((la-m0)%TAU+TAU)%TAU;if(gopen>.01&&d<DA)b.v+=170*gopen*dt;}
spillR+=(spilt/(dt||1)-spillR)*(1-exp(-dt*3));}
// Flour: the stone's speed fills the sack; full sacks go outside; a full batch is carted away.
const mill=rpm*RATIO/480*dt;
if(mode==='ind'){if(flour>=SACKS){fullT+=dt;if(fullT>1.4||red){flour=0;fullT=0;}}else flour=min(SACKS,flour+(red?0:mill));}
else{const tgt=done?SACKS:target;if(red)flour=tgt;else if(flour<tgt)flour=min(tgt,flour+mill*(1+2*clamp(tgt-flour)));if(done===1&&flour>=SACKS-1e-6){done=2;open=false;tone(784,.3,.02);tone(1175,.6,.016);say('Complete: four sacks of flour. The sluice is shut and the wheel comes to rest.');sync();}}
if(red&&done===1)settle();
// Draw what changed.
const key=[th,tw,tn,gopen,red?1:0].map(v=>(+v).toFixed(4)).join('|')+BUCKETS.map(b=>b.v.toFixed(1)).join();if(key!==drawn){drawn=key;drawWheel();}
const wk=[gopen.toFixed(3),red?0:round(now/16),spillR.toFixed(0),rpm>.2].join();if(wk!==drawWater.k){drawWater.k=wk;drawWater(now,red);}if(flour!==drawSacks.f){drawSacks.f=flour;drawSacks();}
const sk=red||rpm<.05?0:sin(tn*4)*.45;if(sk!==shook){shook=sk;shoeAt(sk);set(trickle,'d',rpm>.05&&!red?pd([[SX-3.4+sk,SY-2.2,28.2],[SX-1.8,SY-1.2,26.6]],false):'');}
const fl=rpm>.05;set(stream,'d',fl?pd([[35.4,51.2,15.4],[36,52,13.4]],false):'');stream.style.strokeDashoffset=red?'0':f2(-now/40);
if(ac){rush(gopen*.05);const c=floor(-tn/(PI/2));if(c!==lastClack){lastClack=c;if(rpm>.3)tone(1900,.012,.006,'square');}}
ui(now);requestAnimationFrame(tick);}
for(const b of BUCKETS){const a=th+b.i*DA,m=((a+DA/2)%TAU+TAU)%TAU,mid=m>PI?m-TAU:m;b.v=mid>-60*RAD&&mid<95*RAD?capOf(cav(a))*.7:0;}
spillR=60;sync();drawWheel();drawWater(0,true);drawSacks();shoeAt(0);ui(0);requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
