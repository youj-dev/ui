// @ts-nocheck
/* KARREG POINT · Lighthouse. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--warn:#e88a00;--sea:#d3e3e6;--sea-l:#a9c5cc;--foam:#fff;--rock:#b1aca3;--rock-top:#d2cec6;--rock-side:#928d85;--stone:#e3ded4;--stone-top:#efebe3;--stone-side:#c8c2b6;--wall:#f6f4ee;--band:#c8473a;--roof:#5d6168;--roof-top:#70757c;--iron:#3d3d3c;--iron-top:#4e4e4c;--iron-side:#2f2f2e;--dome:#80a89b;--dome-l:#a4c4b9;--lens:#f1e6c2;--pane:#e2eef0;--pane-a:.4;--wood:#b98c5c;--wood-top:#cfa576;--wood-side:#9a7148;--hull:#3f6f9f;--hull-in:#e9e2d2;--beam:#fff1bf;--winlit:#ffc35a;--fog:#fff;--fog-a:.6;--beam-a:.3;--smoke:#9a9a96;--star:#fff;--sheen:.6}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--warn:#ffad2b;--sea:#b4bfc1;--sea-l:#8ea6ac;--foam:#d7d7d7;--rock:#94908b;--rock-top:#c4c1b9;--rock-side:#646260;--stone:#bebbb5;--stone-top:#e0dcd4;--stone-side:#8b8984;--wall:#cfceca;--band:#a83a2f;--roof:#4e5055;--roof-top:#686d74;--iron:#323231;--iron-top:#484847;--iron-side:#1e1e1e;--dome:#6b8d82;--dome-l:#8aa59b;--lens:#cbc2a3;--pane:#c0c8c9;--wood:#9b754c;--wood-top:#c29a6e;--wood-side:#6c4e30;--hull:#345c85;--hull-in:#c4beb1;--beam:#fff1bf;--winlit:#ffc35a;--fog:#d7d7d7;--beam-a:.42;--smoke:#81817e;--star:#fff;--line:#444443}:root:not(.night) svg{--ink:#282828;--muted:#6b6b6b}}
:root.night{--bg:#050505;--ink:#cfcfcf;--muted:#5c5c5c;--top:#1a1a1a;--body:#131313;--side:#0f0f0f;--base:#0b0b0b;--recess:#080808;--glass:#060606;--line:#363636;--rule:#1a1a1a;--off:#141414;--sea:#090909;--sea-l:#161616;--foam:#3c3c3c;--rock:#161616;--rock-top:#1d1d1d;--rock-side:#121212;--stone:#1b1b1b;--stone-top:#212121;--stone-side:#151515;--wall:#2b2b2b;--band:#3b1a15;--roof:#0e0e0e;--roof-top:#121212;--iron:#0c0c0c;--iron-top:#111;--iron-side:#0a0a0a;--dome:#151515;--dome-l:#1c1c1c;--lens:#3a3626;--pane:#3a3a3a;--pane-a:.14;--wood:#1f1912;--wood-top:#251e16;--wood-side:#19140e;--hull:#151515;--hull-in:#1e1e1e;--fog:#8a8a8a;--fog-a:.2;--beam-a:.9;--smoke:#2c2c2c;--sheen:.04}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.micro{font-size:2.4px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.07;filter:url(#soft)}
.rock{fill:var(--rock)}.top.rock{fill:var(--rock-top)}.side.rock{fill:var(--rock-side)}.stone{fill:var(--stone)}.top.stone{fill:var(--stone-top)}.side.stone{fill:var(--stone-side)}.wall{fill:var(--wall)}.band{fill:var(--band)}.iron{fill:var(--iron)}.top.iron{fill:var(--iron-top)}.side.iron{fill:var(--iron-side)}.dome{fill:var(--dome)}.lens{fill:var(--lens)}.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.roof{fill:var(--roof)}.top.roof{fill:var(--roof-top)}.hull{fill:var(--hull)}.hull-in{fill:var(--hull-in)}
.shade{fill:#000;opacity:.07;stroke:none}.sea{fill:var(--sea);stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke}.ripple{fill:none;stroke:var(--sea-l);stroke-width:.9;stroke-linecap:round}.foam{fill:none;stroke:var(--foam);stroke-width:1.5;stroke-linecap:round;stroke-dasharray:16 3 4 3}.wave{fill:none;stroke:var(--foam);stroke-width:1;stroke-linecap:round;stroke-dasharray:38 10 8 12}
.pane{fill:var(--pane);fill-opacity:var(--pane-a);stroke:none}.sheen{fill:#fff;opacity:var(--sheen);stroke:none}.astr{fill:none;stroke:var(--iron);stroke-width:.75;stroke-linecap:round}.rail{fill:none;stroke:var(--iron);stroke-width:.6;stroke-linecap:round}.rail-u{fill:none;stroke:var(--line);stroke-width:1.1;stroke-linecap:round}
.win{fill:var(--glass)}:root.night .win{fill:var(--winlit);filter:url(#glow)}.winhalo{fill:var(--winlit);opacity:0;filter:url(#bloom);transition:opacity .9s}:root.night .winhalo{opacity:.5}
.beam{stroke:none;filter:url(#bloom)}.core{stroke:none;filter:url(#soft)}.glare{fill:var(--beam);opacity:0;filter:url(#bloom)}.lamp{fill:var(--beam);opacity:0;filter:url(#glow)}
.fogp{fill:var(--fog);filter:url(#fogb);opacity:0}.smoke{fill:var(--smoke);stroke:none;filter:url(#soft)}.ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;stroke-linecap:round}.star{fill:var(--star);opacity:0;transition:opacity 1s}:root.night .star{opacity:.75}.moon{fill:#f3efe2;opacity:0;transition:opacity 1s}:root.night .moon{opacity:.9}.moon-cut{fill:var(--bg)}
.led{fill:var(--off)}.led.on{fill:var(--warn);filter:url(#glow)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
.beam,.core,.glare,.lamp,.fogp,.smoke,.ring,.star,.moon,.winhalo,.foam,.wave,.ripple,.sheen,.shade{pointer-events:none}
.fade,.fade *{transition:fill .9s,stroke .9s,background-color .9s,color .9s,border-color .9s!important}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}:root.night .stage-floor,:root.night .stage-contact,:root.night .stage-pool{display:none}}`

const defs = `<filter id="fogb" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="9"/></filter>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* KARREG POINT. World: x lower-right, y lower-left, z up; tower axis (0, 0); 1 unit ≈ 20 cm.
Part                          x      y      z      w      d      h
sea (narrow ring)        r ≈ 80 around (6, 14)    0      –      –      –   foam on the rocks, waves washing in
granite island           14 boulders, −60…70 × −50…66                    up to 18
platform (2 steps)       r 30 / 24               12      –      –     13
tower (masonry)          r 17 → 11.5            25      –      –    145   granite skirt, red bands 62–82 / 112–132, 5 stair windows, door
corbels + gallery        r 12 → 16.4, deck r 17  170      –      –      8   railing r 16.3
watch room               r 10.8                 178      –      –     11   portholes, gallery door
lantern                  r 9.8                  190      –      –     18   diagonal astragals, Fresnel lens r 6 with two bullseye panels
dome + vent ball + rod   r 10.6                 210      –      –     26   wind vane
keeper's cottage           20    −16     21     42     26     16   slate roof to z 47, chimney, windows
fog-signal hut            −16     22     14     22     18     12   twin trumpets toward +y, fog detector
jetty + boat              −38     38      4     10     44      4   posts into the sea; boat moored at −22 74
beams (2, opposite)      from the lens at z 200, 260 long, ±4°
Painter: sky, sea, foam, back fog, back rocks, platform, front rocks, back beam, tower, cottage, gallery and lantern, hut, jetty, smoke, rings, front beam, front fog. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: polar points, iso arcs, frustum bands, tangent planes, smooth closed curves.
const RAD=Math.PI/180,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),draw=root,into=g=>root=g,defs=svg.querySelector('defs');
const at=(r,a,z,cx=0,cy=0)=>[cx+r*Math.cos(a*RAD),cy+r*Math.sin(a*RAD),z],Q=(...p)=>P(...p).map(v=>+v.toFixed(2)),fx=p=>p.map(v=>v.toFixed(1)).join(',');
const arc=(r,a0,a1,z)=>`A${(r*1.2247).toFixed(2)},${(r*.7071).toFixed(2)} 0 0 ${a1>a0?1:0} ${Q(...at(r,a1,z))}`;
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`,tan=a=>[Math.sin(a*RAD),-Math.cos(a*RAD),0],face=a=>Math.cos(a*RAD)+Math.sin(a*RAD);
const frust=(z0,r0,z1,r1,cls,a0=-45,a1=135,parent=root)=>el('path',{d:`M${Q(...at(r0,a0,z0))}${arc(r0,a0,a1,z0)}L${Q(...at(r1,a1,z1))}${arc(r1,a1,a0,z1)}Z`,class:'face '+cls},parent);
const rAt=z=>17-5.5*(z-25)/150,tw=(z0,z1,cls,a0,a1)=>frust(z0,rAt(z0),z1,rAt(z1),cls,a0,a1);
function blob(f,z,n=36,cx=0,cy=0){const pts=[...Array(n)].map((_,i)=>{const a=i/n*360;return P(...at(f(a*RAD),a,z,cx,cy));});let d=`M${fx(pts[0])}`;for(let i=0;i<n;i++){const p0=pts[(i+n-1)%n],p1=pts[i],p2=pts[(i+1)%n],p3=pts[(i+2)%n];d+=`C${fx([p1[0]+(p2[0]-p0[0])/6,p1[1]+(p2[1]-p0[1])/6])} ${fx([p2[0]-(p3[0]-p1[0])/6,p2[1]-(p3[1]-p1[1])/6])} ${fx(p2)}`;}return d+'Z';}
let seed=7;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
const SKY=el('g',{});
// Sea, waves washing in, foam on the rocks.
const seaR=a=>80+7*Math.sin(3*a+.6)+4*Math.sin(5*a),isl=a=>63+8*Math.sin(2*a+1)+5*Math.sin(5*a+.4);
el('path',{d:blob(seaR,0,40,6,14),class:'stage-pool'});el('path',{d:blob(seaR,0,40,6,14),class:'sea'});
for(let i=0;i<9;i++){const a=rnd()*360,r=70+rnd()*8,p=at(r,a,0,6,14),q=P(...p);if(face(a)>.2)el('path',{d:`M${fx([q[0]-5,q[1]])}h10`,class:'ripple'});}
const waves=[0,1].map(()=>el('path',{class:'wave'})),foam=el('path',{d:blob(isl,.6,36,4,8),class:'foam'});
const FOGB=el('g',{});
// Granite island: boulders behind the platform, the platform, boulders in front.
const RK=[[-46,-42,0,28,24,15],[-16,-50,0,34,24,17],[20,-46,0,30,26,13],[46,-30,0,24,30,11],[-56,-14,0,26,28,12],[-52,14,0,24,24,10],[52,2,0,20,26,9],[16,-26,0,40,22,16],[-30,-24,0,28,24,14],[-40,34,0,24,22,8],[-6,36,0,26,22,10],[24,30,0,28,22,9],[50,28,0,18,18,6],[-60,46,0,10,9,4],[62,50,0,9,8,3],[10,62,0,8,7,3]];
const rocks=RK.map(([x,y,z,w,d,h])=>({x,y,z,w,d,h,dep:x+w/2+y+d/2})).sort((a,b)=>a.dep-b.dep);
const rock=(r,i)=>{const k=Math.min(r.w,r.d,r.h),a=i%2?.58:.46,h2=r.h*(i%3?.66:.8),w1=r.w*a+1;box(r.x,r.y,r.z,w1,r.d,r.h,k*.26,'rock');box(r.x+w1-2,r.y+r.d*.16,r.z,r.w-w1+2,r.d*.84,h2,k*.22,'rock');const t=group(TOP(r.x,r.y,r.z+r.h));line(t,w1*.18,r.d*.62,w1*.55,r.d*.88);const f=group(FRONT(r.x,r.y+r.d,r.z+r.h));line(f,w1*.35,r.h*.2,w1*.5,r.h*.75);};
rocks.forEach((r,i)=>{if(r.dep<16)rock(r,i);});
box(18,-18,6,46,30,15,2,'stone');{const f=group(FRONT(18,12,21));for(let x=3;x<46;x+=7.5)line(f,x,1,x,14);line(f,0,7,46,7);}
cylinder(0,0,12,30,5,'z','stone');cylinder(0,0,17,24,8,'z','stone');{const g=group(TOP(0,0,25));circle(g,0,0,21,'detail');for(let k=0;k<24;k++){const a=k*15*RAD;line(g,Math.cos(a)*21,Math.sin(a)*21,Math.cos(a)*24,Math.sin(a)*24);}}
rocks.forEach((r,i)=>{if(r.dep>=16)rock(r,i);});
// Steps from the platform down to the jetty.
for(let i=0;i<4;i++)box(-30+i*.5,30+i*4,12-i*3,8,4,2.6,.6,'stone');
const BB=el('g',{});
// Tower: masonry with a granite skirt, red bands, courses, a shading band, stair windows and a door.
tw(25,170,'wall');tw(25,34,'stone');tw(62,82,'band');tw(112,132,'band');
for(let z=40;z<170;z+=7.5)el('path',{d:`M${Q(...at(rAt(z),-45,z))}${arc(rAt(z),-45,135,z)}`,class:'detail',style:'opacity:.35'});
tw(25,170,'shade',-45,-8);frust(25,rAt(25),170,rAt(170),'shade',-45,12).style.opacity=.035;
const towerWins=[];for(const[a,z]of[[62,44],[34,72],[64,98],[30,124],[60,150]]){const r=rAt(z),g=group(plane(at(r+.1,a,z),tan(a),[0,0,-1]));rect(g,-3,-1.2,6,10.4,1.2,'face stone');el('path',{d:'M-1.9,8V1.6A1.9,1.9 0 0 1 1.9,1.6V8Z',class:'face win'},g);line(g,0,1,0,8);rect(g,-3.4,8.6,6.8,1.4,.4,'face stone');towerWins.push(at(r+1,a,z+4));}
{const a=52,z=25,g=group(plane(at(rAt(z)+.1,a,z+14),tan(a),[0,0,-1]));rect(g,-5,-1.5,10,15.5,1.5,'face stone');el('path',{d:'M-3.6,14V3A3.6,3.6 0 0 1 3.6,3V14Z',class:'face iron'},g);circle(g,2.2,8.6,.5,'face top');rect(g,-6,-2.6,12,1.6,.5,'face stone');}
// Keeper's cottage with a passage to the tower.
box(13,-6,25,9,12,11,1,'wall');
box(20,-16,21,42,26,16,1.2,'wall');const cf=group(FRONT(20,10,37)),cs=group(SIDE(62,10,37)),cw=[];
for(const u of[7,30]){rect(cf,u-3.6,4,7.2,8,.6,'face stone');rect(cf,u-3,4.6,6,6.8,.4,'face win');line(cf,u,4.6,u,11.4);line(cf,u-3,8,u+3,8);cw.push(P(20+u,10,29));}
rect(cf,15,3.6,6.4,12.4,.8,'face stone');rect(cf,15.7,4.4,5,11.6,.5,'face wood');circle(cf,19.8,10.4,.45,'face top');rect(cs,8,4,8,8,.6,'face stone');rect(cs,8.6,4.6,6.8,6.8,.4,'face win');line(cs,12,4.6,12,11.4);cw.push(P(62,-2,29));
el('path',{d:poly([[62,-16,37],[62,10,37],[62,-3,47.6]],true),class:'face side wall'});el('path',{d:poly([[18,-3,49],[64,-3,49],[64,13,36.6],[18,13,36.6]],true),class:'face top roof'});
for(let x=24;x<64;x+=6)wire([[x,-2.6,48.6],[x,12.6,36.9]],'detail').style.opacity=.45;for(let k=1;k<4;k++)wire([[18.6,-3+k*4,49-k*3.1],[63.4,-3+k*4,49-k*3.1]],'detail').style.opacity=.3;
box(48,-11,47,6,6,8,.8,'stone');box(47.4,-11.6,55,7.2,7.2,1.6,.5,'stone');cylinder(50,-9,56.6,1.3,2.4,'z','iron');cylinder(52.6,-7,56.6,1.3,2,'z','iron');
const winHalo=el('g',{});for(const p of[...cw,...towerWins.map(p=>P(...p))])el('circle',{cx:p[0],cy:p[1],r:7,class:'winhalo'},winHalo);
// Corbels and gallery, watch room, lantern with the lens, dome, vane.
frust(170,rAt(170)+.4,175.5,16.4,'wall');for(let a=-40;a<=130;a+=15)wire([at(rAt(170)+.4,a,170),at(16.4,a,175.5)],'detail');
cylinder(0,0,175.5,17,2.6,'z','iron');const RR=16.3,railHalf=(a0,a1)=>{for(const z of[181.5,185.2]){const d=`M${Q(...at(RR,a0,z))}${arc(RR,a0,a1,z)}`;el('path',{d,class:'rail-u'});el('path',{d,class:'rail'});}for(let a=a0;a<=a1+.01;a+=12){const d=poly([at(RR,a,178.1),at(RR,a,185.2)]);el('path',{d,class:'rail-u'});el('path',{d,class:'rail'});}};
railHalf(135,315);
cylinder(0,0,178.1,10.8,11,'z','iron');for(const a of[22,76]){const g=group(plane(at(10.85,a,184),tan(a),[0,0,-1]));circle(g,0,0,1.9,'face stone');circle(g,0,0,1.3,'face win');}{const g=group(plane(at(10.85,50,188),tan(50),[0,0,-1]));rect(g,-2.4,0,4.8,9.6,.6,'face iron');rect(g,-1.6,1,3.2,3.4,.4,'face win');}
cylinder(0,0,189.1,11.2,1.4,'z','iron');
const LZ0=190.5,LZ1=208.5,LR=9.8;el('path',{d:`M${Q(...at(LR,135,LZ1))}${arc(LR,135,315,LZ1)}L${Q(...at(LR,315,LZ0))}${arc(LR,315,495,LZ0)}Z`,class:'face glass',style:'opacity:.85'});
const helix=(a0,dir,front)=>{let d='',pen=false;for(let i=0;i<=24;i++){const t=i/24,a=a0+dir*t*60,z=LZ0+t*(LZ1-LZ0),f=face(a)>0;if(front&&!f){pen=false;continue;}const p=Q(...at(LR,a,z));d+=(pen?'L':'M')+p;pen=true;}return d;};
for(let k=0;k<8;k++)for(const s of[1,-1])el('path',{d:helix(k*45,s,false),class:'astr'});
cylinder(0,0,LZ0,3.2,2.6,'z','iron');const LENS=el('g',{}),lampGlow=el('circle',{cx:P(0,0,199.5)[0],cy:P(0,0,199.5)[1],r:7.5,class:'lamp'});
frust(LZ0,LR,LZ1,LR,'',-45,135).setAttribute('class','pane');el('path',{d:`M${Q(...at(LR,-20,LZ1-1))}L${Q(...at(LR,-20,LZ0+1))}L${Q(...at(LR,-8,LZ0+1))}L${Q(...at(LR,-8,LZ1-1))}Z`,class:'sheen'});
for(let k=0;k<8;k++)for(const s of[1,-1])el('path',{d:helix(k*45,s,true),class:'astr'});
for(const z of[LZ0+.2,(LZ0+LZ1)/2,LZ1-.2])el('path',{d:`M${Q(...at(LR,-45,z))}${arc(LR,-45,135,z)}`,class:'astr'});
cylinder(0,0,LZ1,11.2,1.6,'z','iron');
{const z0=LZ1+1.6,R=10.6,rx=R*1.2247,ry=R*.7071,rt=Math.hypot(ry,7.6),c=P(0,0,z0);el('path',{d:`M${fx([c[0]-rx,c[1]])}A${rx.toFixed(2)},${rt.toFixed(2)} 0 0 1 ${fx([c[0]+rx,c[1]])}A${rx.toFixed(2)},${ry.toFixed(2)} 0 0 1 ${fx([c[0]-rx,c[1]])}Z`,class:'face dome'});
for(const a of[-10,25,60,95]){const e=Q(...at(R,a,z0)),m=Q(...at(R*.62,a,z0+6.2));el('path',{d:`M${fx([c[0],c[1]-rt+ry*.0])}Q${fx(m)} ${fx(e)}`,class:'detail',style:'opacity:.6'});}}
cylinder(0,0,LZ1+8.8,1.3,2.2,'z','iron');{const b=P(0,0,LZ1+13.4);el('circle',{cx:b[0],cy:b[1],r:2.9,class:'face top iron'});}wire([[0,0,LZ1+15.6],[0,0,LZ1+27]],'detail').style.strokeWidth='1.1';
const vane=group('',group(TOP(0,0,LZ1+24.5)));el('path',{d:'M-6,0L5,0M5,0L3.4,-1.4M5,0L3.4,1.4M-6,0L-7.6,-1.6M-6,0L-7.6,1.6',class:'detail',style:'stroke-width:1'},vane);
railHalf(-45,135);
// Fog-signal hut with twin trumpets and a fog detector.
box(-16,22,14,22,18,12,1,'wall');box(-17,21,26,24,20,1.6,.6,'stone');const hf=group(FRONT(-16,40,26));rect(hf,3,3,5.4,9,.6,'face wood');rect(hf,12,3,6,4.6,.5,'face win');const hornLed=circle(hf,15,10,.8,'led');
const HORN=el('g',{});into(HORN);box(-10,28,27.6,14,6,2.4,.6,'iron');for(const x of[-6,2.5]){cylinder(x,30,31.8,1.3,8,'y','iron');cylinder(x,38,31.8,2.4,3,'y','iron');cylinder(x,41,31.8,3.4,2,'y','iron');cylinder(x,43,31.8,4.8,1.2,'y','iron');ellipse(x,44.25,31.8,3.9,'y','face recess');}into(draw);
box(4,25,27.6,2,2,9,.4,'iron');box(1.6,24.4,36.6,7,3.2,3.4,.8,'iron');{const g=group(FRONT(1.6,27.6,40));circle(g,2,1.7,.9,'face win');circle(g,5,1.7,.9,'face win');}
// Jetty and the moored boat.
for(const[x,y]of[[-37,44],[-29,44],[-37,62],[-29,62],[-37,80],[-29,80]])cylinder(x,y,-2,1.1,8.6,'z','wood');
box(-38,38,6.6,10,44,1.6,.4,'wood');{const t=group(TOP(-38,38,8.25));for(let y=3;y<44;y+=3)line(t,.5,y,9.5,y);}
const BOAT=el('g',{});into(BOAT);{const g=group(TOP(-22,74,1.6)),h=group(TOP(-22,74,-.6));const hull='M-10,0Q-7,-4.4 4,-4.2Q10,-3 12,0Q10,3 4,4.2Q-7,4.4 -10,0Z';el('path',{d:hull,class:'face hull',transform:'rotate(90)'},h);el('path',{d:hull,class:'face hull',transform:'rotate(90)'},g);el('path',{d:'M-8.4,0Q-6,-3.2 4,-3Q8.6,-2.2 10,0Q8.6,2.2 4,3Q-6,3.2 -8.4,0Z',class:'face hull-in',transform:'rotate(90)'},g);line(g,-3,-2,-3,2);line(g,-2.4,4,2.4,4);}
into(draw);el('path',{d:`M${fx(P(-29,62,8))}Q${fx(P(-26,68,2))} ${fx(P(-22,64.5,1.6))}`,class:'detail'});
// Smoke, horn rings, the front beam and glare, front fog; then the hit areas.
const SMOKE=el('g',{}),RINGS=el('g',{}),BF=el('g',{}),glare=el('circle',{cx:P(0,0,199.5)[0],cy:P(0,0,199.5)[1],r:26,class:'glare'}),FOGF=el('g',{});
const puffs=[...Array(7)].map((_,i)=>({n:el('circle',{class:'smoke'},SMOKE),t:i/7}));
const beams=[0,1].map(k=>{const gr=el('linearGradient',{id:'bg'+k,gradientUnits:'userSpaceOnUse'},defs),gc=el('linearGradient',{id:'bc'+k,gradientUnits:'userSpaceOnUse'},defs);for(const[o,a]of[[0,.95],[.35,.45],[1,0]])el('stop',{offset:o,style:`stop-color:var(--beam);stop-opacity:${a}`},gr);for(const[o,a]of[[0,1],[.25,.5],[.7,0]])el('stop',{offset:o,style:`stop-color:var(--beam);stop-opacity:${a}`},gc);return{w:el('path',{class:'beam',fill:`url(#bg${k})`}),c:el('path',{class:'core',fill:`url(#bc${k})`}),gr,gc};});
const hot=(label,cx,cy,r,fn)=>{const g=el('g',{class:'control',role:'button',tabindex:'0','aria-label':label});el('circle',{cx,cy,r,class:'hit'},g);el('circle',{cx,cy,r:r+1.5,class:'focus-ring'},g);g.fn=fn;return g;};
{const pts=[...Array(48)].map((_,i)=>P(...at(seaR(i/48*2*Math.PI),i*7.5,0,6,14))).concat([P(0,0,LZ1+27)]),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),pd=12;set(svg,'viewBox',`${Math.min(...xs)-pd} ${Math.min(...ys)-pd} ${Math.max(...xs)-Math.min(...xs)+pd*2} ${Math.max(...ys)-Math.min(...ys)+pd*2}`);}
const vb=svg.viewBox.baseVal;
// Sky: stars and a crescent moon for the night.
for(let i=0;i<34;i++){const x=vb.x+rnd()*vb.width,y=vb.y+rnd()*vb.height*.55;el('circle',{cx:x,cy:y,r:.35+rnd()*.55,class:'star'},SKY);}
{const mx=vb.x+vb.width*.14,my=vb.y+vb.height*.14;el('circle',{cx:mx,cy:my,r:9,class:'moon'},SKY);el('circle',{cx:mx+4.4,cy:my-2.4,r:8,class:'moon-cut'},SKY);}
const fogs=[...Array(10)].map((_,i)=>({n:el('ellipse',{rx:60+rnd()*50,ry:9+rnd()*7,class:'fogp'},i%2?FOGF:FOGB),x:rnd(),y:.5+rnd()*.42,v:.008+rnd()*.012}));
// State: lamp, horn, fog and night; the lens turns at 18°/s, two panels give one flash every 10 s.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),hk={};
document.querySelectorAll('.hint [data-k]').forEach(b=>{hk[b.dataset.k]=b;});
let lamp=false,night=false,fog=false,fogA=0,lit=0,spin=0,phi=45,horn=0,nextHorn=0,note='',noteT=0,lastUI=-1,now=performance.now(),last=now,ac=null,vaneA=30;const blasts=[];
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,d=.15,v=.02,type='sine',when=0){if(!ac)return;try{const t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.06);g.gain.setValueAtTime(v,t+d-.25);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.05);}catch(_){}}
const say=m=>{announcement.textContent=m;};
function drawLens(){LENS.replaceChildren();into(LENS);const z0=193.1,z1=206.2,R=6.1;
const back=[phi,phi+180].filter(a=>face(a)<=0),front=[phi,phi+180].filter(a=>face(a)>0);
el('path',{d:`M${Q(...at(R,135,z1))}${arc(R,135,315,z1)}L${Q(...at(R,315,z0))}${arc(R,315,495,z0)}Z`,class:'face lens'});
for(let i=1;i<6;i++){const z=z0+i*(z1-z0)/6;el('path',{d:`M${Q(...at(R,-45,z))}${arc(R,-45,135,z)}`,class:'detail',style:'opacity:.5'});}
for(const a of front){const g=group(plane(at(R+.05,a,(z0+z1)/2),tan(a),[0,0,-1]));for(const r of[4.6,3.3,2])circle(g,0,0,r,'detail');circle(g,0,0,1.1,'face top');}
into(draw);}
function setBeam(b,a,vis){const o=[0,0,199.5],d=[Math.cos(a*RAD),Math.sin(a*RAD),0],w=[-d[1],d[0],0],L=205,hw=L*Math.tan(4*RAD),f=[o[0]+d[0]*L,o[1]+d[1]*L,o[2]],p=(v,s)=>Q(o[0]+d[0]*v+w[0]*s,o[1]+d[1]*v+w[1]*s,o[2]);
set(b.w,'d',`M${p(0,4.4)}L${p(0,-4.4)}L${p(L,-hw)}L${p(L,hw)}Z`);set(b.c,'d',`M${p(0,2)}L${p(0,-2)}L${p(L*.6,-hw*.35)}L${p(L*.6,hw*.35)}Z`);const A=Q(...o),F=Q(...f);for(const g of[b.gr,b.gc]){set(g,'x1',A[0]);set(g,'y1',A[1]);set(g,'x2',F[0]);set(g,'y2',F[1]);}
const par=face(a)>0?BF:BB;if(b.w.parentNode!==par){par.appendChild(b.w);par.appendChild(b.c);}const side=.35+.65*Math.abs(Math.sin((a-45)*RAD));b.w.style.opacity=(vis*side).toFixed(3);b.c.style.opacity=(vis*side*.9).toFixed(3);}
function blast(auto){audio();if(now<horn){if(!auto){note='FOG HORN · SOUNDING';noteT=horn;lastUI=-1;}return;}horn=now+2200;tone(170,1.9,.03,'sawtooth');tone(85,1.9,.022);tone(172,1.9,.016,'triangle');blasts.push({t0:now,arcs:[0,1,2].map(()=>el('path',{class:'ring'},RINGS))});note='FOG HORN · 2 S BLAST';noteT=now+2200;say(auto?'Fog horn.':'Fog horn sounded.');lastUI=-1;}
function lampT(){audio();lamp=!lamp;tone(lamp?660:440,.12,.012);say(lamp?'Lamp on. The lens turns: one white flash every ten seconds.':'Lamp off.');sync();}
function fogT(){audio();fog=!fog;if(fog)nextHorn=now+1200;say(fog?'Fog rolling in. The horn sounds every twenty seconds.':'Fog clearing.');sync();}
function dayT(){audio();night=!night;const h=document.documentElement;if(!reduced.matches){h.classList.add('fade');clearTimeout(dayT.t);dayT.t=setTimeout(()=>h.classList.remove('fade'),1000);}h.classList.toggle('night',night);say(night?(lamp?'Night.':'Night. Press L to light the lamp.'):'Day.');sync();}
function sync(){set(hk.l,'aria-pressed',lamp);set(hk.f,'aria-pressed',fog);set(hk.d,'aria-pressed',night);for(const g of HITS)set(g,'aria-pressed',g===HITS[0]?lamp:g===HITS[2]?fog:g===HITS[3]?night:'false');lastUI=-1;}
const bearing=a=>String(Math.round(((90-(a-45))%360+360)%360)).padStart(3,'0');
function ui(){readout.textContent=`${night?'NIGHT':'DAY'} · LAMP ${lamp?'ON':'OFF'} · ${fog?'FOG':'CLEAR'}`;stateLabel.textContent=now<noteT?note:`BEAM ${bearing(phi)}° · VIS ${fog?2:night?18:24} NM${fog?' · HORN EVERY 20 S':''}${lamp&&lit<.98?' · LENS SPINNING UP':''}`;}
const act={l:lampT,' ':()=>blast(false),f:fogT,d:dayT};
const HITS=[hot('Lamp on or off (L)',...P(0,0,199),17,lampT),hot('Sound the fog horn (Space)',...P(-2,40,31.8),10,()=>blast(false)),hot('Fog on or off (F)',...P(5,26,39),5,fogT),hot('Day or night (D)',...P(41,-3,34),18,dayT)];
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
for(const g of HITS)bind(g,g.fn);for(const[k,b]of Object.entries(hk))b.addEventListener('click',()=>act[k]());
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const k=e.key.toLowerCase();if(k===' '&&e.target.closest&&e.target.closest('button,[role=button]'))return;if(act[k]){e.preventDefault();act[k]();}});
function tick(t){const dt=Math.min(.05,Math.max(0,(t-last)/1000)),red=reduced.matches;last=now=t;
lit+=((lamp?1:0)-lit)*(1-Math.exp(-dt/(red?.001:1.1)));spin=red?0:18*lit;phi=(phi+spin*dt)%360;if(red)phi=-12;
if(!(t-tick.cs<400)){tick.cs=t;const cs=getComputedStyle(svg);tick.ba=+cs.getPropertyValue('--beam-a')||.3;tick.fa=+cs.getPropertyValue('--fog-a')||.5;}if(phi!==tick.ph){tick.ph=phi;drawLens();}const vis=lit*tick.ba*(1+fogA*.8);beams.forEach((b,k)=>setBeam(b,phi+k*180,vis));
const gl=Math.max(...[phi,phi+180].map(a=>Math.pow(Math.max(0,Math.cos((a-45)*RAD)),10)));glare.style.opacity=(lit*gl*(night?1:.7)).toFixed(3);lampGlow.style.opacity=(lit*.95).toFixed(2);
fogA+=((fog?1:0)-fogA)*(1-Math.exp(-dt/(red?.001:1.6)));fogs.forEach(f=>{if(!red)f.x=(f.x+f.v*dt)%1;set(f.n,'cx',(vb.x-80+f.x*(vb.width+160)).toFixed(1));set(f.n,'cy',(vb.y+vb.height*f.y).toFixed(1));f.n.style.opacity=(fogA*tick.fa).toFixed(3);});
if(fog&&now>=nextHorn){nextHorn=now+20000;blast(true);}
for(let i=blasts.length;i--;){const b=blasts[i],k=(now-b.t0)/2600;if(k>=1){b.arcs.forEach(a=>a.remove());blasts.splice(i,1);continue;}b.arcs.forEach((a,j)=>{const q=red?(j+1)/4:clamp(k*1.3-j*.22),r=6+q*58,pt=an=>fx(P(...at(r,an,31.5,-2,44)));set(a,'d',`M${pt(48)}A${(r*1.2247).toFixed(1)},${(r*.7071).toFixed(1)} 0 0 1 ${pt(132)}`);a.style.opacity=q>0?((1-q)*.85).toFixed(2):0;});}
const blow=now<horn;HORN.setAttribute('transform',blow&&!red?`translate(${(Math.sin(t/14)*.25).toFixed(2)} ${(Math.cos(t/11)*.2).toFixed(2)})`:'');hornLed.setAttribute('class',blow?'led on':'led');
const wt=red?.5:(t/5600)%1;waves.forEach((w,i)=>{const q=(wt+i*.5)%1,s=1.32-.3*q;set(w,'d',blob(a=>isl(a)*s,0,36,4,8));w.style.opacity=(Math.sin(q*Math.PI)*.85).toFixed(2);});if(!red)set(foam,'stroke-dashoffset',(-t/90).toFixed(1));
if(!red){BOAT.setAttribute('transform',`translate(0 ${(Math.sin(t/900)*.7).toFixed(2)}) rotate(${(Math.sin(t/1300)*1.2).toFixed(2)} ${fx(P(-22,74,0))})`);vaneA+=Math.sin(t/7000)*dt*6;}set(vane,'transform',`rotate(${vaneA.toFixed(1)})`);
const ch=P(51.3,-9,58);puffs.forEach((p,i)=>{if(!red)p.t=(p.t+dt/7)%1;const q=red?(i+1)/8:p.t;set(p.n,'cx',(ch[0]+q*16+Math.sin(q*6+i)*1.6).toFixed(1));set(p.n,'cy',(ch[1]-q*30).toFixed(1));set(p.n,'r',(1.4+q*4.6).toFixed(2));p.n.style.opacity=(Math.sin(q*Math.PI)*.5).toFixed(2);});
if(lastUI<0||t-lastUI>150){lastUI=t;ui();}
requestAnimationFrame(tick);}
sync();ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['l', ' ', 'f', 'd'], draw }
