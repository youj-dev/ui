// @ts-nocheck
/* TAVREN R–12 · Record turntable. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--wood:#9a6a42;--wood-top:#b9875a;--wood-side:#7b5232;--alu:#e0e0dd;--alu-top:#f2f2f0;--alu-side:#c6c6c2;--chrome:#d9dad8;--chrome-top:#f6f6f5;--chrome-side:#bdbebc;--rubber:#2c2c2b;--rubber-top:#3b3b3a;--rubber-side:#222221;--brass:#cfa95d;--brass-top:#e8c985;--brass-side:#ab8743;--vinyl:#151515;--vmus:#1f1f1f;--groove:#3c3c3c;--speck:#e4e4e4;--lab:#efe7d4;--lab-ink:#2b241c;--lab-acc:#d6532c;--strobe:#ff8a2a;--dot:#a2a29e;--blur:#b9b9b5;--cover:#a3a39d;--cover-a:.14;--cs:.5;--vs:.2;--brush:.45;--sp:.6;--cable:#2e2e2d;--rca-l:#ecece8;--rca-r:#c9473a}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--wood:#815836;--wood-top:#ad7e54;--wood-side:#553720;--alu:#bdbdbb;--alu-top:#e2e2e1;--alu-side:#8b8b8a;--chrome:#b7b7b6;--chrome-top:#e6e6e5;--chrome-side:#858585;--rubber:#232323;--rubber-top:#373736;--rubber-side:#151514;--brass:#ae8e4d;--brass-top:#d9bc7c;--brass-side:#785e2d;--vinyl:#101010;--vmus:#181818;--groove:#313131;--speck:#c0c0c0;--lab:#c9c3b2;--lab-ink:#211d18;--lab-acc:#b44523;--strobe:#ff8a33;--dot:#888885;--blur:#9b9b99;--cover:#898985;--cable:#252524;--rca-l:#c7c7c4;--rca-r:#a93a2f;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.alu{fill:var(--alu)}.top.alu{fill:var(--alu-top)}.side.alu{fill:var(--alu-side)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}.side.rubber{fill:var(--rubber-side)}.brass{fill:var(--brass)}.top.brass{fill:var(--brass-top)}.side.brass{fill:var(--brass-side)}
.grain{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.26}.brush{stroke:#fff;stroke-width:.35;opacity:var(--brush)}.vinyl{fill:var(--vinyl)}.vmus{fill:none;stroke:var(--vmus)}.groove{fill:none;stroke:var(--groove);stroke-width:.4;vector-effect:non-scaling-stroke;opacity:.75}.vsh{fill:url(#vsh);opacity:var(--vs);pointer-events:none}.speck{fill:var(--speck);opacity:.55}
.lab{fill:var(--lab);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.lab-ring{fill:none;stroke:var(--lab-acc)}.lab-arc{fill:none;stroke:var(--lab-acc);stroke-width:1.5}.lab-ink{fill:var(--lab-ink);font:700 3.6px ui-monospace,monospace;letter-spacing:.9px;stroke:none}.lab-s{font-size:2px;font-weight:400;letter-spacing:.25px}
.spec{fill:#fff;opacity:var(--sp);pointer-events:none}.pshadow{fill:#000;opacity:.09;filter:url(#bloom)}.dot{fill:var(--dot)}.blurband{fill:var(--blur);opacity:0}.sd{fill:var(--strobe)}.swash{fill:var(--strobe);opacity:.34;filter:url(#bloom);pointer-events:none}.slamp{fill:var(--strobe);filter:url(#glow)}
.tu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.tc{fill:none;stroke:var(--chrome-top);stroke-linecap:round;stroke-linejoin:round}.hi{fill:none;stroke:#fff;stroke-width:.7;stroke-linecap:round;opacity:.8}.ash{fill:none;stroke:#000;stroke-linecap:round;opacity:.3;filter:url(#soft)}
.led{fill:var(--off)}.led.b{fill:var(--accent);filter:url(#glow)}.led.g{fill:var(--ok);filter:url(#glow)}.ring{fill:none;stroke:var(--off);stroke-width:1.2}.ring.b{stroke:var(--accent);filter:url(#glow)}
.cover{fill:var(--cover);fill-opacity:var(--cover-a);stroke:var(--line);stroke-opacity:.5;stroke-width:.8;vector-effect:non-scaling-stroke;stroke-linejoin:round}.cseam{fill:none;stroke:var(--line);stroke-opacity:.3;stroke-width:.6;vector-effect:non-scaling-stroke}.csh{fill:#fff;opacity:var(--cs);pointer-events:none}.cedge{fill:none;stroke:#fff;stroke-width:1.1;opacity:var(--cs);vector-effect:non-scaling-stroke}
.cu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.cb{fill:none;stroke:var(--cable);stroke-linecap:round;stroke-linejoin:round}.rca-l{fill:var(--rca-l)}.rca-r{fill:var(--rca-r)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}.control:hover .top.alu{fill:var(--top)}#lid:focus-visible .cover{stroke:var(--accent);stroke-opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="vsh" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="92"><stop offset=".32" stop-color="#fff" stop-opacity="0"/><stop offset=".72" stop-color="#fff" stop-opacity="1"/><stop offset="1" stop-color="#fff" stop-opacity=".45"/></radialGradient>
<clipPath id="lidTop"><rect width="296" height="230" rx="4"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* TAVREN R–12 turntable. World: x lower-right; y lower-left (front faces +y); z up. 1 unit ≈ 1.67 mm.
Part · x y z · w d h
feet ×4 (rubber + alu cone) · 22/278 22/212 0 · r10 – 10
walnut plinth · 0 0 10 · 300 234 48
front control panel (start ring, 33, 45, repeat, quartz lamp) · 12 234 19 · 140 0 30
front nameplate · 198 234 23 · 88 0 22
side connector plate, RCA plugs, cables to the floor · 300 6–48 24 · 0 42 24
aluminium deck · 6 6 58 · 288 222 2
hinges ×2 (lid axis y 2, z 58) · 40/240 2 59.6 · 20 r2.4 –
45 adapter puck · 26 26 60 · r8.6 – 3.4
strobe lamp (lights the rim at 100.7°) · 88 219 60 · 18 8 7
platter (strobe rows at z 67.4 / 71.2) · 117 117 63 · r100 – 13
mat · record · label · 117 117 76 · r94 / 91.4 / 29.5 – 2.2
spindle · 117 117 78.2 · r2.1 – 5.6
arm base · pillar · bearing cup · 235 63 60 · r17 – 24.6
anti-skate dial · 268 44 60 · r6.4 – 3.2
cue lever block + lever · 261 86 60 · 14 13 4.5
cue lift post + bar (rises 3.9) · 212–227 76–89 60 · 15 13 25
arm rest + cradle · 242.4 169 60 · r4.6 – 28.6
pitch fader (±8 %, knob y 122–212) · 258 110 60 · 32 114 1.2
tonearm: pivot 235 63 87.2, stylus 138.8 out, headshell offset 22°; lid 2–298 × 2–232 × 46, hinged at y 2 */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: vectors, oriented planes, oriented boxes and tubes, platter bands, bevels, cords.
const{cos,sin}=Math,draw=root,into=g=>root=g,f2=v=>(+v).toFixed(2),RAD=Math.PI/180,VW=[1,1,1],clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(Math.hypot(...a)||1));
const plane=(o,U,V)=>`matrix(${[...P(...U),...P(...V),...P(...o)].map(f2).join(' ')})`;
function axes(n){n=unit(n);const U=unit(Math.abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U);const a=P(...U),b=P(...V);if(a[0]*b[1]-a[1]*b[0]<0)V=mul(V,-1);return[U,V];}
function arcb(t0,t1,z1,z2,o,g){const q=(t,z)=>[117+100.04*cos(t*RAD),117+100.04*sin(t*RAD),z],a=[];for(let t=t0;t<=t1;t+=2)a.push(q(t,z1));for(let t=t1;t>=t0;t-=2)a.push(q(t,z2));return el('path',{d:poly(a,true),class:'spec','fill-opacity':o},g);}
function band(z1,z2,R,cls,g=root){const c=P(117,117,z1),a=R*1.2247,b=R*.7071,h=z1-z2;return el('path',{d:`M${f2(c[0]-a)},${f2(c[1])}A${f2(a)},${f2(b)} 0 0 0 ${f2(c[0]+a)},${f2(c[1])}V${f2(c[1]+h)}A${f2(a)},${f2(b)} 0 0 1 ${f2(c[0]-a)},${f2(c[1]+h)}Z`,class:cls},g);}
function obox(g,m){const s=[0,1,2].map(()=>el('path',{},g));s.m=m;return s;}
function obx(s,c,a,b,h){let i=0;for(const[n,p,q]of[[a,b,h],[b,h,a],[h,a,b]])for(const k of[1,-1]){const N=mul(n,k);if(dot(N,VW)<=0)continue;const f=add(c,N),u=unit(N);set(s[i],'d',poly([add(add(f,p),q),add(sub(f,p),q),sub(sub(f,p),q),sub(add(f,p),q)],true));set(s[i++],'class','face '+(u[2]>.6?'top ':u[0]>u[1]?'side ':'')+s.m);}for(;i<3;i++)set(s[i],'d','');}
function otube(g,m,deco){const t={b:el('path',{class:'face '+m},g),c:el('g',{},g)};circle(t.c,0,0,1,'face top '+m);if(deco)deco(t.c);return t;}
function otb(t,c0,c1,r){let A=sub(c1,c0);if(dot(A,VW)<0){[c0,c1]=[c1,c0];A=mul(A,-1);}const[U,V]=axes(A),pu=P(...U),pv=P(...V),d=P(...A),det=pu[0]*pv[1]-pv[0]*pu[1],u=(d[0]*pv[1]-pv[0]*d[1])/det,v=(pu[0]*d[1]-d[0]*pu[1])/det,l=Math.hypot(u,v)||1,tx=-v*r/l,ty=u*r/l;
set(t.b,'transform',plane(c0,U,V));set(t.b,'d',`M${f2(tx)},${f2(ty)}A${r},${r} 0 0 1 ${f2(-tx)},${f2(-ty)}L${f2(u-tx)},${f2(v-ty)}A${r},${r} 0 0 1 ${f2(u+tx)},${f2(v+ty)}Z`);set(t.c,'transform',plane(c1,U,V)+` scale(${r})`);}
function bevel(g,x,y,w,h,b,m){rect(g,x,y,w,h,1.2,'face '+m);el('path',{d:`M${x},${y}H${x+w}L${x+w-b},${y+b}H${x+b}ZM${x},${y}L${x+b},${y+b}V${y+h-b}L${x},${y+h}Z`,class:'face top '+m},g);el('path',{d:`M${x},${y+h}L${x+b},${y+h-b}H${x+w-b}L${x+w},${y+h}ZM${x+w},${y}V${y+h}L${x+w-b},${y+h-b}V${y+b}Z`,class:'face side '+m},g);}
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
function cord(pts,w){const d=smooth(pts);el('path',{d,class:'cu','stroke-width':w+1});el('path',{d,class:'cb','stroke-width':w});}
const EM='etch micro center',ctl=(label,extra={})=>el('g',{class:'control',role:'button',tabindex:'0','aria-label':label,...extra},draw);
const ring=(g,r0,r1,n,a0=0,a1=360)=>{for(let i=0;i<n;i++){const a=(a0+(a1-a0)*i/n)*RAD;line(g,f2(r0*cos(a)),f2(r0*sin(a)),f2(r1*cos(a)),f2(r1*sin(a)));}};
// Shadow, the open lid's layer, feet, walnut plinth with grain.
const sh=P(150,117,0);el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]+7),rx:214,ry:76,class:'shadow stage-floor'});el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]+7),rx:214,ry:76,class:'stage-contact'});
const lidBack=el('g',{});
for(const[x,y]of[[22,22],[278,22],[22,212],[278,212]]){cylinder(x,y,0,10,2.6,'z','rubber');cylinder(x,y,2.6,8.4,7.4,'z','alu');}
box(0,0,10,300,234,48,3,'wood');
const fp=group(FRONT(0,234.1,58)),sp=group(SIDE(300.1,234,58));
for(let i=0;i<6;i++){const v=4+i*7.7,w=i%2?1.5:-1.2;el('path',{d:`M5,${v} C84,${v+w} 196,${v-w*1.3} 295,${v+w*.5}`,class:'grain'},fp);el('path',{d:`M5,${v+2} C64,${v+2-w} 150,${v+2+w} 229,${v+2-w*.6}`,class:'grain'},sp);}
line(fp,3,.7,297,.7,'cedge');line(sp,3,.7,231,.7,'cedge');const rim=group(TOP(0,0,58.02));for(const v of[2,4])el('path',{d:`M8,${232-v} C100,${231.6-v} 200,${232.5-v} 292,${232-v}`,class:'grain'},rim);
// Front: aluminium control panel (start ring, 33, 45, repeat, quartz lock) and the nameplate.
bevel(fp,12,9,140,30,1.6,'alu');for(const[u,v]of[[15.3,12.3],[148.7,12.3],[15.3,35.7],[148.7,35.7]])circle(fp,u,v,.85,'detail');
const RING=circle(fp,30,22.5,9.2,'ring');text(fp,30,36.4,'START · STOP',EM);
const FB=[];
function fbtn(x,v,r,label,lab,gl){const g=ctl(label,{'aria-pressed':'false'}),z=58-v;circle(fp,x,v,r+1.3,'face recess');into(g);const t=otube(g,'alu',c=>{circle(c,0,0,.7,'detail');if(gl)el('path',{d:gl,class:'detail'},c);else circle(c,0,0,.18,'face recess');});into(draw);
const pl=group(FRONT(0,236.4,58),g);circle(pl,x,v,r+4.4,'hit');circle(pl,x,v,r+2.3,'focus-ring');let led=null;if(lab){led=circle(fp,x,13.4,1,'led');text(fp,x,19.4,lab,'etch center');}
const b={g,t,x,z,r,o:0,led,draw(){const k=sin(Math.min(1,b.o)*Math.PI/2)*1.3;otb(t,[x,234.1,z],[x,236.3-k,z],r);}};b.draw();FB.push(b);return b;}
const BS=fbtn(30,22.5,6.6,'Start or stop the turntable (Space)','','M.26,-.3V.3L-.24,0ZM-.36,-.3V.3'),B33=fbtn(60,27.6,4.2,'Speed 33⅓ (3)','33'),B45=fbtn(78,27.6,4.2,'Speed 45 (4)','45'),BRP=fbtn(100,27.6,4.2,'Repeat side A (R)','REPEAT');
const LQZ=circle(fp,124,13.4,1,'led');text(fp,124,19.4,'LOCK','etch center');text(fp,124,30.4,'QUARTZ',EM);line(fp,116,33.2,132,33.2);
bevel(fp,198,13,88,22,1.4,'alu');text(fp,242,24.6,'TAVREN','label brand center');text(fp,242,30.6,'R–12 · QUARTZ DIRECT DRIVE',EM);for(const u of[202,282])circle(fp,u,24,.85,'detail');
// Right flank: rating plate, RCA jacks, ground post; plugs and cables drop to the floor behind.
rect(sp,144,13,32,13,1,'face alu');text(sp,160,18.3,'R–12 · 230 V~',EM);text(sp,160,22.6,'50 Hz · 14 W',EM);
bevel(sp,184,10,44,24,1.4,'alu');
for(const[u,c]of[[194,'rca-l'],[205,'rca-r']]){circle(sp,u,21,3.5,'face recess');circle(sp,u,21,2.5,'face '+c);}
circle(sp,217,21,2.3,'face chrome');circle(sp,217,21,1,'face recess');for(const[u,t]of[[194,'L'],[205,'R'],[217,'GND']])text(sp,u,30.4,t,EM);
cord([[300.6,17,37],[306,16.6,36],[312,15.6,28],[316,14,10],[321,11,1.2],[334,-4,1.2],[346,-22,1.2]],.9);
for(const[y,c,k]of[[40,'rca-l',0],[29,'rca-r',1]]){cylinder(300.1,y,37,2.1,3,'x','chrome');cylinder(303.1,y,37,2.9,6.6,'x',c);ellipse(309.75,y,37,1.4,'x','face recess');
cord([[309.7,y,37],[316,y,34.5],[321-k,y-2,22],[324-k,y-5,7],[329-k,y-10,1.4],[343-k*2,y-26,1.4],[356-k*3,y-46,1.4],[364-k*4,y-64,1.4]],2.2);}
// Aluminium deck: brushed, screwed, engraved; hinges; 45 adapter.
box(6,6,58,288,222,2,1.6,'alu');
const dk=group(TOP(6,6,60.01));for(let i=0;i<37;i++)line(dk,2,3+i*6,286,3+i*6,'brush');
for(const[u,v]of[[4.6,4.6],[283.4,4.6],[4.6,217.4],[283.4,217.4]])screw(dk,u,v);
text(dk,262,14.6,'TAVREN','etch center');text(dk,262,18.6,'ROTARY WORKS · R–12',EM);
for(const x of[40,240])cylinder(x,2,59.6,2.4,20,'x','chrome');
ellipse(26,26,60.05,10.8,'z','face recess');const pk=cylinder(26,26,60,8.6,3.4,'z','chrome').face;circle(pk,0,0,5.6,'detail');circle(pk,0,0,1.9,'face recess');text(group(TOP(26,26,60.06)),0,15.6,'45','etch center');
// Tonearm base: plate, anti-skate dial with scale, cue lever block.
cylinder(235,63,60,17,2,'z','alu');{const g=group(TOP(235,63,62.05));for(let i=0;i<4;i++){const a=(45+i*90)*RAD;screw(g,13.8*cos(a),13.8*sin(a));}}
cylinder(235,63,62,12.6,4,'z','chrome');
{const k=cylinder(268,44,60,6.4,3.2,'z','chrome').face;ring(k,5.2,6.1,24);line(k,0,0,0,-4.6);circle(k,0,0,1.2,'face recess');const g=group(TOP(268,44,60.06));ring(g,8.2,9.4,7,-200,-60);text(g,0,15,'ANTI-SKATE',EM);}
box(261,86,60,14,13,4.5,1.6,'alu');text(group(TOP(261,86,64.56)),7,10.6,'CUE',EM);
const armB=el('g',{}),CW=otube(armB,'chrome',c=>{circle(c,0,0,.72,'detail');circle(c,0,0,.3,'face recess');ring(c,.84,.97,30);}),CW2=otube(armB,'chrome',c=>circle(c,0,0,.55,'detail')),STUB=otube(armB,'chrome');
cylinder(235,63,66,7.6,16,'z','chrome');cylinder(235,63,82,10.4,2.6,'z','alu');
// Platter: machined rim with two strobe rows (dots, motion blur, lamp-lit window), highlight, chamfer.
ellipse(117,117,60.03,104,'z','detail');{const c=P(126,121,60);el('ellipse',{cx:f2(c[0]),cy:f2(c[1]),rx:126,ry:72,class:'pshadow'});}ellipse(117,117,60.05,97.5,'z','face recess');
const PL=cylinder(117,117,63,100,13,'z','alu'),RG=el('g',{});PL.g.insertBefore(RG,PL.face);
band(76,74.9,100.02,'face top alu',RG);
const TL=100.7,ROWS=[{z:71.2,sp:2,rp:100/3},{z:67.4,sp:2.7,rp:45}];
for(const R of ROWS){R.bl=band(R.z+.8,R.z-.8,100.03,'blurband',RG);R.ag=el('g',{},RG);R.d=Array.from({length:Math.ceil(180/R.sp)+1},()=>el('ellipse',{class:'dot',ry:.75},R.ag));R.lg=el('g',{filter:'url(#glow)'},RG);R.l=Array.from({length:Math.ceil(50/R.sp)+1},()=>el('ellipse',{class:'sd',ry:.8},R.lg));R.off=0;R.ph=NaN;R.k=NaN;}
arcb(36,76,75.6,63.4,.45,RG);arcb(52,64,75.6,63.4,1,RG);{const w=P(117+100*cos(TL*RAD),117+100*sin(TL*RAD),69.5);el('ellipse',{cx:f2(w[0]),cy:f2(w[1]),rx:20,ry:8,class:'swash'},RG);}
circle(PL.face,0,0,97.6,'detail');circle(PL.face,0,0,95.8,'detail');
// Record: track bands, grooves, gaps, run-out, a fixed sheen; the label is drawn three times to blur the spin.
cylinder(117,117,76,94,1,'z','rubber');cylinder(117,117,77,91.4,1.2,'z','vinyl');
const RP=group(TOP(117,117,78.22));
for(const[a,b]of[[75.6,87],[62.6,74.4],[49.6,61.4],[36,48.4]])el('circle',{r:f2((a+b)/2),class:'vmus','stroke-width':f2(b-a)},RP);
for(let r=36.6;r<87;r+=1.24)if(![74.4,61.4,48.4].some(g=>r>g-.3&&r<g+1.5))circle(RP,0,0,f2(r),'groove');
for(const r of[88.4,89.8,31.2,33])circle(RP,0,0,r,'groove');
for(const k of[0,180])for(const[w,o]of[[18,.45],[6.5,1]]){const a=(k-12-w)*RAD,b=(k-12+w)*RAD,q=(r,t)=>`${f2(r*cos(t))},${f2(r*sin(t))}`;el('path',{d:`M${q(31.5,a)}L${q(91,a)}A91,91 0 0 1 ${q(91,b)}L${q(31.5,b)}A31.5,31.5 0 0 0 ${q(31.5,a)}Z`,class:'vsh','fill-opacity':o},RP);}
circle(RP,0,0,29.5,'lab');el('circle',{r:26.3,class:'lab-ring','stroke-width':2.6},RP);circle(RP,0,0,24.7,'detail').style.opacity=.4;
const TRK=['LOW SUN','AFTER THE RAIN','SLOW RIVER','NIGHT GLASS'];
function marks(g){for(const r of[4.6,7.8,11])el('path',{d:`M${-r},-1.4A${r},${r} 0 0 1 ${r},-1.4`,class:'lab-arc'},g);el('path',{d:'M-14.5,.2H14.5',class:'lab-arc'},g);
text(g,0,-15,'TAVREN','lab-ink center');text(g,0,5.4,'SIDE A · 33⅓','lab-ink lab-s center');TRK.forEach((t,i)=>text(g,0,8.8+i*2.7,`${i+1} ${t}`,'lab-ink lab-s center'));text(g,-21,1.2,'A','lab-ink center');text(g,21,.9,'021','lab-ink lab-s center');
for(let i=0;i<11;i++){const r=34+(i*29)%54,a=i*2.27;circle(g,f2(r*cos(a)),f2(r*sin(a)),f2(.3+(i%3)*.16),'speck');}}
const LB=[1,.42,.24].map(o=>{const g=group('',RP);marks(g);g.o=o;return g;});
cylinder(117,117,78.2,2.1,5.6,'z','chrome');ellipse(117,117,83.8,1.1,'z','detail');
{const c=P(117,117,78.2);el('ellipse',{cx:f2(c[0]),cy:f2(c[1]),rx:f2(91.4*1.2247),ry:f2(91.4*.7071)},el('clipPath',{id:'recClip'},svg.querySelector('defs')));}
const ASH=el('g',{'clip-path':'url(#recClip)'}),ashT=el('path',{class:'ash','stroke-width':3.6},ASH),ashH=el('path',{class:'ash','stroke-width':8},ASH);
// Strobe lamp in front of the rim, arm rest, pitch fader, cue lift, cue lever.
box(88,219,60,18,8,7,1.8,'alu');{const g=group(TOP(88,219,67.05));rect(g,2.4,1.2,13.2,3.6,1.6,'face recess');rect(g,3,1.7,12,2.6,1.2,'slamp');}
cylinder(242.4,169,60,4.6,2,'z','alu');cylinder(242.4,169,62,2.6,18,'z','chrome');box(237.4,166,80,10,6,5.2,1.4,'rubber');box(237.6,166,85.2,2.4,6,3.4,.8,'rubber');
box(258,110,60,32,114,1.2,1.6,'alu');const PF=group(TOP(258,110,61.25));rect(PF,13,10,6,94,3,'face recess');rect(PF,15.3,12,1.4,90,.7,'face base');
for(let i=-8;i<=8;i++){const y=f2(57+i*5.6);line(PF,i%4?7.6:5.2,y,10.6,y);}
text(PF,26,15.8,'−','etch center');text(PF,26,103.4,'+','etch center');text(PF,16,111.6,'PITCH',EM);
const ZERO=circle(PF,25.6,57,1.15,'led');
const FK=ctl('Pitch fader (Up and Down arrows)',{role:'slider','aria-valuemin':'-8','aria-valuemax':'8','aria-valuenow':'0','aria-valuetext':'0 percent'});
rect(group(TOP(258,110,61.3),FK),6,4,20,106,3,'hit');const KN=group('',FK);into(KN);box(267,163,61.2,14,8,6.4,1.8,'alu');{const g=group(TOP(267,163,67.65));line(g,1.8,4,12.2,4);rect(g,-2.4,-2.8,18.8,13.6,3,'focus-ring');}into(draw);
cylinder(226.6,88.4,60,2.6,16,'z','alu');const LIFT=el('g',{}),STEM=otube(LIFT,'chrome'),BAR=otube(LIFT,'chrome');
const CL=ctl('Cue lever: lift or lower the arm (C)',{'aria-pressed':'false'}),clU=el('path',{class:'tu','stroke-width':2.6},CL),clC=el('path',{class:'tc','stroke-width':1.5},CL),clK=el('circle',{r:2.2,class:'face top alu'},CL);
{const g=group(TOP(261,86,64.6),CL);rect(g,-4,-3,22,30,3,'hit');rect(g,-1.6,-1.6,17.2,24,3,'focus-ring');}
// Tonearm (redrawn from its pose): tube, gimbal yoke, ferrule, cartridge with brass nose and stylus, headshell, finger lift.
const armF=el('g',{style:'cursor:pointer'}),TU=el('path',{class:'tu','stroke-width':5.3},armF),TC=el('path',{class:'tc','stroke-width':3.9},armF),TH=el('path',{class:'hi',transform:'translate(-.3 -1)'},armF);
const YK=otube(armF,'alu',c=>{circle(c,0,0,.62,'detail');circle(c,0,0,.24,'face recess');}),FER=otube(armF,'chrome'),CAN=el('path',{class:'detail'},armF),BOD=obox(armF,'rubber'),NOS=obox(armF,'brass'),SHL=obox(armF,'alu'),FLU=el('path',{class:'tu','stroke-width':2.1},armF),FLC=el('path',{class:'tc','stroke-width':1.1},armF);
box(244.8,166,85.2,2.4,6,3.4,.8,'rubber');
// Dust cover: five smoked panels in hinge space, sheen streaks and polished edges; drawn behind the deck once open.
const lidFront=el('g',{}),lid=el('g',{id:'lid',class:'control',role:'button',tabindex:'0','aria-pressed':'true','aria-label':'Close the dust cover (D)'},lidBack),LF={};
for(const k of['bk','lf','rt','fr','tp'])LF[k]=el('g',{},lid);
rect(LF.bk,0,0,296,46,2,'cover');rect(LF.lf,0,0,230,46,2,'cover');rect(LF.rt,0,0,230,46,2,'cover');line(LF.rt,3,1.2,227,1.2,'cedge');
rect(LF.fr,0,0,296,46,2,'cover');line(LF.fr,3,1.2,293,1.2,'cedge');line(LF.fr,4,42.6,292,42.6,'cseam');
rect(LF.tp,0,0,296,230,4,'cover');rect(LF.tp,5,5,286,220,3,'cseam');{const c=el('g',{'clip-path':'url(#lidTop)'},LF.tp);for(const[d,o]of[['M60,0H112L64,230H12Z',.3],['M124,0H134L86,230H76Z',.55],['M236,0H296V40L268,230H190Z',.1]])el('path',{d,class:'csh','fill-opacity':o},c);}line(LF.tp,4,228.8,292,228.8,'cedge');
const LOPEN=58,lidQ=(a,x,d,h)=>{const r=a*RAD,c=cos(r),s=sin(r);return[2+x,2+d*c-h*s,58+d*s+h*c];};
function lidDraw(a){const r=a*RAD,c=cos(r),s=sin(r),D=[0,c,s],H=[0,s,-c],X=[1,0,0],Q=(x,d,h)=>lidQ(a,x,d,h);
set(LF.tp,'transform',plane(Q(0,0,46),X,D));set(LF.fr,'transform',plane(Q(0,230,46),X,H));set(LF.bk,'transform',plane(Q(0,0,46),X,H));set(LF.lf,'transform',plane(Q(0,0,46),D,H));set(LF.rt,'transform',plane(Q(296,0,46),D,H));
const to=a>35?lidBack:lidFront;if(lid.parentNode!==to)to.appendChild(lid);}
frame([[0,0,0,300,234,58],[300,-70,0,68,110,40],...[[0,230,46],[296,230,46],[0,0,46],[296,0,46]].map(([x,d,h])=>[...lidQ(LOPEN,x,d,h),0,0,0])],14);
// State: motor with inertia, an arm sequencer on critically damped springs, strobe aliasing, cover, pitch, repeat, sound.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),HK={};
document.querySelectorAll('.hint [data-k]').forEach(b=>HK[b.dataset.k]=b);
const PV=[235,63,87.2],AL=138.8,KJ=-8.24/118.4,CO=cos(22*RAD),SO=sin(22*RAD),ZR=78.2,UP=2.9,SIDE_S=84,SIDE_T=1164;
const DX=117-235,DY=117-63,DL=Math.hypot(DX,DY),DA=Math.atan2(DY,DX),RAD_=p=>88-56*p;
const phiOf=p=>(DA-Math.acos((AL*AL+DL*DL-RAD_(p)**2)/(2*AL*DL)))/RAD;
const TB=[[75.6,87],[62.6,74.4],[49.6,61.4],[36,48.4]];
function zone(p){const r=RAD_(p);if(r>87)return 0;if(r<36)return 5;for(let k=0;k<4;k++)if(r>=TB[k][0]&&r<=TB[k][1])return k+1;return-1;}
let motor=true,speed=100/3,pitch=0,rpm=100/3,rot=0,p=.18,mode='play',phi=phiOf(.18),phiV=0,tilt=0,tiltV=0,lev=0,restUp=false,coverOpen=true,lidA=LOPEN,lidV=0,repeat=true,again=0,liftAt=0,mt=0,fy=0,fyV=0;
let last=0,lastUI=0,note='',noteT=0,lastRot=0,drawn='',lidDrawn=-1,levDrawn=-1,fyDrawn=NaN;
const say=m=>{announcement.textContent=m;};
function notice(m,a){note=m;noteT=performance.now()+1500;lastUI=0;if(a)say(a);}
const armUp=()=>mode==='lift'||mode==='swing'||mode==='cue'||mode==='home'||(mode==='up'&&performance.now()>=liftAt)||(mode==='rest'&&restUp);
function sync(){set(BS.g,'aria-pressed',motor);set(B33.g,'aria-pressed',speed!==45);set(B45.g,'aria-pressed',speed===45);set(BRP.g,'aria-pressed',repeat);set(lid,'aria-pressed',coverOpen);set(lid,'aria-label',`${coverOpen?'Close':'Open'} the dust cover (D)`);
set(CL,'aria-pressed',armUp());set(FK,'aria-valuenow',pitch);set(FK,'aria-valuetext',`${pitch>0?'+':''}${pitch} percent`);set(HK[' '],'aria-pressed',motor);set(HK.d,'aria-pressed',coverOpen);set(HK.r,'aria-pressed',repeat);lastUI=0;}
function start(){motor=true;again=0;if(['rest','park','home','up'].includes(mode)){p=0;mode='lift';}sync();}
function stop(auto){motor=false;again=auto&&repeat?performance.now()+7200:0;if(!['rest','park','home','up'].includes(mode)){liftAt=performance.now()+(!reduced.matches&&(mode==='play'||mode==='out')?700:0);mode='up';}sync();}
function play(){audio();BS.o=1;click();if(motor){stop(false);say('Stopped. The platter coasts down while the arm lifts and returns.');}else{start();say('Started. The arm swings to the lead-in and lowers.');}}
function setSpeed(v){audio();(v===45?B45:B33).o=1;click();speed=v;notice(v===45?'SPEED 45':'SPEED 33⅓',`Speed ${v===45?'45':'33 and a third'}.`);sync();}
function cue(){audio();click(900);noteT=0;if(mode==='play'||mode==='out'||mode==='lift'||mode==='swing'){mode='cue';say('Cue up. The stylus lifts off the record.');}else if(mode==='cue'){mode='lower';say('Cue down. The stylus lowers into the groove.');}else if(mode==='lower'){mode='cue';say('Cue up.');}
else if(mode==='rest'){restUp=!restUp;say(restUp?'Arm lifted off its rest.':'Arm lowered onto its rest.');}else notice('ARM RETURNING','The arm is returning to its rest.');sync();}
function cover(){audio();coverOpen=!coverOpen;notice(coverOpen?'COVER OPEN':'COVER CLOSED',coverOpen?'Dust cover open.':'Dust cover closed.');sync();}
function setPitch(v){audio();const o=pitch;pitch=Math.round(clamp(v,-8,8)*10)/10;if(Math.abs(pitch)<.3)pitch=0;if(pitch!==o){click(2600);notice(pitch?`PITCH ${pitch>0?'+':'−'}${Math.abs(pitch).toFixed(1)}%`:'PITCH 0 · QUARTZ LOCK');}sync();}
function rep(){audio();BRP.o=1;click();repeat=!repeat;if(!repeat)again=0;notice(repeat?'REPEAT ON':'REPEAT OFF',repeat?'Repeat on: side A starts again after it ends.':'Repeat off.');sync();}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(BS.g,play);bind(B33.g,()=>setSpeed(100/3));bind(B45.g,()=>setSpeed(45));bind(BRP.g,rep);bind(CL,cue);bind(lid,cover);armF.addEventListener('click',cue);RP.addEventListener('click',play);RP.style.cursor='pointer';
const ACT={' ':play,c:cue,d:cover,r:rep,'3':()=>setSpeed(100/3),'4':()=>setSpeed(45),'0':()=>{setPitch(0);notice('PITCH RESET · QUARTZ LOCK','Pitch reset to zero.');}};
for(const[k,b]of Object.entries(HK))b.addEventListener('click',()=>ACT[k]());
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key;
if(k==='ArrowUp'||k==='ArrowDown'||(e.target===FK&&(k==='ArrowLeft'||k==='ArrowRight'))){e.preventDefault();setPitch(pitch+(k==='ArrowUp'||k==='ArrowRight'?.5:-.5));return;}
if(e.repeat)return;const f=ACT[k.toLowerCase()];if(f){if(k===' '&&e.target.closest&&e.target.closest('button'))return;e.preventDefault();f();}});
function drag(e){const m=svg.getScreenCTM();if(!m)return;const q=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse()),o=P(274,167,61.2);setPitch(((q.x-o[0])*-C+(q.y-o[1])*S)/(C*C+S*S)/5.6);}
FK.addEventListener('pointerdown',e=>{FK.setPointerCapture(e.pointerId);drag(e);FK.onpointermove=drag;});for(const t of['pointerup','pointercancel'])FK.addEventListener(t,()=>{FK.onpointermove=null;});
addEventListener('pointerdown',()=>audio(),{once:true});addEventListener('keydown',()=>audio(),{once:true});
// Sound: a warm four-track loop rendered offline, played at platter speed with crackle and wow.
let ac=null,out,sG,mG,lg,csrc=null,src=null,mb=null,seg=0,lastRate=-1,sgT=-1,mgT=-1;
const SR=22050,SEG=15,mf=m=>440*2**((m-69)/12);
const CH=[[[38,53,57,60,64],[43,53,57,59,64],[36,52,55,59,62],[33,55,59,61,64]],[[41,57,60,64,67],[40,55,59,62,64],[38,57,60,62,65],[36,55,59,62,64]],[[45,55,60,64,67],[38,54,57,60,64],[43,54,57,59,62],[36,55,59,62,64]],[[39,55,58,62,65],[38,53,57,60,64],[36,51,55,58,62],[34,50,53,57,60]]];
function synth(){const O=window.OfflineAudioContext||window.webkitOfflineAudioContext;if(!O)return Promise.reject();
const oc=new O(1,SR*SEG*4,SR),lp=oc.createBiquadFilter(),cp=oc.createDynamicsCompressor();lp.frequency.value=2300;lp.Q.value=.3;lp.connect(cp);cp.connect(oc.destination);
const nb=oc.createBuffer(1,SR/2,SR),nd=nb.getChannelData(0);let q=7;for(let i=0;i<nd.length;i++){q=q*16807%2147483647;nd[i]=q/1073741823.5-1;}
const v=(t,f,tau,g,type='sine')=>{const o=oc.createOscillator(),a=oc.createGain();o.type=type;o.frequency.value=f;a.gain.setValueAtTime(0,t);a.gain.linearRampToValueAtTime(g,t+.008);a.gain.setTargetAtTime(0,t+.008,tau);o.connect(a);a.connect(lp);o.start(t);o.stop(t+.01+tau*7);};
const n=(t,g)=>{const s=oc.createBufferSource(),b=oc.createBiquadFilter(),a=oc.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=5200;b.Q.value=.6;a.gain.setValueAtTime(g,t);a.gain.setTargetAtTime(0,t,.06);s.connect(b);b.connect(a);a.connect(lp);s.start(t,0,.45);};
CH.forEach((ch,k)=>{for(let b=-1;b<4;b++){const t=k*SEG+3+b*3,c=ch[(b+4)%4],odd=b%2!==0;
v(t,55,.12,.16);v(t+1.5,55,.12,.12);v(t,mf(c[0]),.5,.18,'triangle');v(t+1.5,mf(c[0]+7),.4,.12,'triangle');v(t+2.625,mf(c[0]+(odd?5:12)),.22,.08,'triangle');
c.slice(1).forEach((m,i)=>{v(t+.02+i*.015,mf(m),.9,.036);v(t+.02+i*.015,mf(m)*4,.06,.006);v(t+1.9+i*.012,mf(m),.45,.022);});
n(t+.75,.05);n(t+2.25,.05);n(t+1.875,.018);
if(odd){const m=c[4]+12-(k%2)*5;v(t+.75,mf(m),.5,.02);v(t+1.125,mf(m-3+k%3),.6,.018);v(t+2.25,mf(m-5),.9,.018);}}});
return oc.startRendering();}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();const lp=ac.createBiquadFilter(),hp=ac.createBiquadFilter(),cg=ac.createGain(),lfo=ac.createOscillator();lp.frequency.value=5000;hp.type='highpass';hp.frequency.value=900;
out=ac.createGain();out.gain.value=.13;sG=ac.createGain();sG.gain.value=0;mG=ac.createGain();mG.gain.value=0;cg.gain.value=.55;lg=ac.createGain();lg.gain.value=.0016;lfo.frequency.value=.55;lfo.connect(lg);lfo.start();
mG.connect(sG);hp.connect(cg);cg.connect(sG);sG.connect(out);out.connect(lp);lp.connect(ac.destination);
const b=ac.createBuffer(1,SR*4,SR),d=b.getChannelData(0);let h=0;for(let i=0;i<d.length;i++){h=h*.92+(Math.random()*2-1)*.08;d[i]=h*.07;}
for(let k=0;k<70;k++){const i=Math.random()*(d.length-40)|0,a=(Math.random()<.14?.55:.16)*(Math.random()<.5?-1:1);for(let j=0;j<30;j++)d[i+j]+=a*Math.exp(-j/2.4)*(j%2?-.55:1);}
csrc=ac.createBufferSource();csrc.buffer=b;csrc.loop=true;lg.connect(csrc.playbackRate);csrc.connect(hp);csrc.start();synth().then(x=>{mb=x;seg=0;}).catch(()=>{});}
if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function blip(f,d,g){if(!ac)return;const t=ac.currentTime,o=ac.createOscillator(),a=ac.createGain();o.frequency.value=f;a.gain.setValueAtTime(g,t);a.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(a);a.connect(out);o.start(t);o.stop(t+d+.02);}
const click=(f=2200)=>blip(f,.025,.012);
function sound(z,down){if(!ac||!csrc)return;const t=ac.currentTime,rate=Math.max(.0005,rpm/33.333);
if(Math.abs(rate-lastRate)>.0015){lastRate=rate;csrc.playbackRate.setTargetAtTime(rate,t,.04);if(src)src.playbackRate.setTargetAtTime(rate,t,.04);}
const sg=down?clamp(rpm/7):0;if(Math.abs(sg-sgT)>.01){sgT=sg;sG.gain.setTargetAtTime(sg,t,down?.025:.012);}
if(mb&&z>0&&z<5&&z!==seg){if(src)src.stop(t+.06);src=ac.createBufferSource();src.buffer=mb;src.loop=true;src.loopStart=(z-1)*SEG+3;src.loopEnd=src.loopStart+12;src.playbackRate.value=rate;lg.connect(src.playbackRate);src.connect(mG);src.start(t,src.loopStart);seg=z;}
const mg=z>0&&z<5?1:0;if(mg!==mgT){mgT=mg;mG.gain.setTargetAtTime(mg,t,mg?.25:.12);}}
// Drawing from state.
function drawArm(){const a=phi*RAD,t=tilt*RAD,ca=cos(a),sa=sin(a),ct=cos(t),st=sin(t),U=[ca*ct,sa*ct,st],V=[-sa,ca,0],W=[-ca*st,-sa*st,ct],A=(x,y,z)=>add(add(add(PV,mul(U,x)),mul(V,y)),mul(W,z)),T=x=>A(x,KJ*x,0);
otb(CW,T(-37),T(-22),9.6);otb(CW2,T(-22),T(-18.6),6.4);otb(STUB,T(-18.6),T(-4),2.7);
const td=poly([T(-4),T(118.4)]);set(TU,'d',td);set(TC,'d',td);set(TH,'d',poly([T(6),T(112)]));otb(YK,A(0,-7.6,.3),A(0,7.6,.3),4.3);
const HU=add(mul(U,CO),mul(V,SO)),HV=add(mul(U,-SO),mul(V,CO)),J=T(118.4),H=(x,y,z)=>add(add(add(J,mul(HU,x)),mul(HV,y)),mul(W,z));
otb(FER,H(-4,0,0),H(.8,0,0),2.9);set(CAN,'d',poly([H(20.4,0,-7.9),H(22,0,-9)]));
obx(BOD,H(14,0,-4.75),mul(HU,6.5),mul(HV,4.5),mul(W,3.15));obx(NOS,H(21.6,0,-5.4),mul(HU,1.1),mul(HV,3.2),mul(W,2.1));obx(SHL,H(11.4,0,-.6),mul(HU,12.6),mul(HV,5.8),mul(W,.75));
const fl=poly([H(14,-5.8,-.2),H(15.8,-10.4,.9),H(18.8,-13.4,2.6),H(21.6,-14.4,3.8)]);set(FLU,'d',fl);set(FLC,'d',fl);
const sp=q=>[q[0]+(q[2]-ZR)*.6,q[1]+(q[2]-ZR)*.15,ZR];set(ashT,'d',poly([T(8),T(118)].map(sp)));set(ashH,'d',poly([H(0,0,-3),H(22,0,-4)].map(sp)));}
function drawLift(){const zb=81.2+3.9*lev,a=38*lev*RAD,tp=[268,92.5+15*cos(a),64.5+15*sin(a)],d=poly([[268,92.5,64.5],tp]),k=P(...tp);
otb(STEM,[226.6,88.4,76],[226.6,88.4,zb],1.4);otb(BAR,[227.4,89.2,zb],[212.5,76,zb],1.3);set(clU,'d',d);set(clC,'d',d);set(clK,'cx',f2(k[0]));set(clK,'cy',f2(k[1]));}
function litDots(R){const a0=TL-25,s=a0+(((R.ph-a0)%R.sp)+R.sp)%R.sp;R.l.forEach((e,i)=>{const th=s+i*R.sp;if(th>TL+25){e.style.display='none';return;}const r=th*RAD,q=P(117+100.05*cos(r),117+100.05*sin(r),R.z);e.style.display='';set(e,'cx',f2(q[0]));set(e,'cy',f2(q[1]));set(e,'rx',f2(.78*Math.abs(sin(r)+cos(r))*C+.05));e.style.opacity=f2(cos((th-TL)/25*Math.PI/2)**.6);});}
function ambDots(R,op){R.ag.style.opacity=f2(op);const s=-45+(((R.k+45)%R.sp)+R.sp)%R.sp;R.d.forEach((e,i)=>{const th=s+i*R.sp;if(th>=135||Math.abs(th-TL)<23){e.style.display='none';return;}const r=th*RAD,q=P(117+100.05*cos(r),117+100.05*sin(r),R.z);e.style.display='';set(e,'cx',f2(q[0]));set(e,'cy',f2(q[1]));set(e,'rx',f2(.74*Math.abs(sin(r)+cos(r))*C+.04));});}
function lit(n,c,base){if(n._c!==c){n._c=c;set(n,'class',base+(c?' '+c:''));}}
function spring(x,v,t,w,dt){v+=(w*w*(t-x)-2*w*v)*dt;return[x+v*dt,v];}
function ui(now,z){const s=Math.round(p*SIDE_T),pt=pitch?` · ${pitch>0?'+':'−'}${Math.abs(pitch).toFixed(1)}%`:'';let st;
readout.textContent=`${rpm.toFixed(1)} rpm · ${z>0&&z<5?'A'+z:'A–'} · ${String(s/60|0).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
if(now<noteT)st=note;else if(mode==='play')st=(z>0&&z<5?`PLAYING · TRACK ${z} · ${TRK[z-1]}`:z===0?'LEAD-IN · STYLUS DOWN':z===5?'RUN-OUT':'BETWEEN TRACKS')+pt;else if(mode==='out')st='RUN-OUT · LOCK GROOVE';else if(mode==='lift'||mode==='swing')st='STARTING · ARM TO LEAD-IN';else if(mode==='lower')st='CUEING DOWN';else if(mode==='cue')st='CUE UP · PAUSED'+pt;else if(mode==='up'&&now<liftAt)st='STOPPING · PLATTER COASTING';else if(mode!=='rest')st='RETURNING · ARM TO REST';else st=again?`SIDE END · REPEAT IN ${Math.max(1,Math.ceil((again-now)/1000))} S`:rpm>.05?'COASTING · ARM AT REST':'STOPPED · ARM AT REST';
stateLabel.textContent=st;}
function tick(now){
const dt=Math.min(.05,(now-(last||now))/1000),red=reduced.matches;last=now;
const tg=motor?speed*(1+pitch/100):0;
if(red)rpm=tg;else if(motor)rpm+=clamp((tg-rpm)*3.2,-18,26)*dt;else rpm=Math.max(0,rpm-(6+.1*rpm)*dt);
if(!red)rot+=rpm*6*dt;
let pt=phi,tt=0;
switch(mode){
case'rest':pt=90;tt=restUp?UP*.6:0;break;
case'lift':tt=UP;if(red||tilt>UP-.15)mode='swing';break;
case'swing':pt=phiOf(p);tt=UP;if(red||Math.abs(phi-pt)<.25&&Math.abs(phiV)<1)mode='lower';break;
case'lower':pt=phiOf(p);if(red||tilt<.06){mode='play';blip(62,.14,.05);say('Stylus in the groove.');sync();}break;
case'play':if(!red&&rpm>.3)p=Math.min(1,p+rpm/33.333*dt/SIDE_S);pt=phiOf(p);if(p>=1){mode='out';mt=now;}break;
case'out':pt=phiOf(1);if(now-mt>1700){stop(true);say('End of side. The arm lifts and returns.');}break;
case'cue':pt=phiOf(p);tt=UP;break;
case'up':tt=now<liftAt?0:UP;if(now>=liftAt&&tilt>UP-.15){mode='home';blip(160,.05,.012);sync();}break;
case'home':pt=90;tt=UP;if(red||Math.abs(phi-90)<.5&&Math.abs(phiV)<2)mode='park';break;
case'park':pt=90;if(red||tilt<.06){mode='rest';restUp=false;sync();}break;}
if(red){phi=pt;phiV=0;tilt=tt;tiltV=0;lidA=coverOpen?LOPEN:0;fy=pitch*5.6;}
else{[phi,phiV]=spring(phi,phiV,pt,mode==='play'||mode==='out'?12:3.1,dt);[tilt,tiltV]=spring(tilt,tiltV,tt,tt>tilt?8:mode==='lower'?3.4:6,dt);[lidA,lidV]=spring(lidA,lidV,coverOpen?LOPEN:0,3.6,dt);[fy,fyV]=spring(fy,fyV,pitch*5.6,16,dt);}
lev=clamp(tilt/UP);
const key=phi.toFixed(3)+'|'+tilt.toFixed(3);if(key!==drawn){drawn=key;drawArm();}
if(Math.abs(lev-levDrawn)>.002){levDrawn=lev;drawLift();}
if(Math.abs(lidA-lidDrawn)>.02){lidDrawn=lidA;lidDraw(lidA);}
if(Math.abs(fy-fyDrawn)>.01||fyDrawn!==fyDrawn){fyDrawn=fy;set(KN,'transform',`translate(${f2(-fy*C)} ${f2(fy*S)})`);}
const b=red?0:clamp(rpm/25),dd=rpm*.1;LB.forEach((g,i)=>{set(g,'transform',`rotate(${f2((rot-dd*i/3)%360)})`);g.style.opacity=f2(i?g.o*b:1-.5*b);});
for(const R of ROWS){const w=((rpm*6/100/R.sp+.5)%1+1)%1-.5;if(!red){R.off+=(w*R.sp*100-rpm*6)*dt;if(rpm<.3)R.off+=(Math.round(R.off/R.sp)*R.sp-R.off)*Math.min(1,dt*4);}
const ph=rot+R.off;if(!(Math.abs(ph-R.ph)<.002)){R.ph=ph;litDots(R);}
const bo=red?(rpm>3?1:0):clamp((rpm-3)/9);if(bo!==R.bo){R.bo=bo;R.bl.style.opacity=f2(bo*.85);}
if(bo<.99){if(!(Math.abs(rot-R.k)<.002)||R.ao!==bo){R.k=rot;R.ao=bo;ambDots(R,1-bo);}}else if(R.ao!==bo){R.ao=bo;R.ag.style.opacity=0;}}
for(const f of FB)if(f.o>0){f.o=red?0:Math.max(0,f.o-dt*6);f.draw();}
lit(RING,motor?'b':'','ring');lit(B33.led,speed!==45?'b':'','led');lit(B45.led,speed===45?'b':'','led');lit(BRP.led,repeat?'b':'','led');lit(LQZ,motor&&Math.abs(rpm-tg)<.05?'g':'','led');lit(ZERO,pitch?'':'g','led');
const z=zone(p),down=mode==='play'||mode==='out'||(mode==='up'&&now<liftAt)||(mode==='lower'&&tilt<.06);
sound(mode==='out'?5:z,down);if(mode==='out'&&down&&Math.floor(rot/360)!==Math.floor(lastRot/360))blip(110,.05,.03);lastRot=rot;
if(again&&now>again&&mode==='rest'&&!motor){start();say('Repeat: side A starts again.');}
if(!lastUI||now-lastUI>150){lastUI=now;ui(now,z);}
requestAnimationFrame(tick);}
sync();drawArm();drawLift();lidDraw(LOPEN);requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [' ', 'c', 'd', 'r'], draw }
