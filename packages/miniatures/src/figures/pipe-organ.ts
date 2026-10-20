// @ts-nocheck
/* HALVARD OP–4 · Chamber organ. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--base-top:#cbcbc7;--base-side:#a4a4a1;--wood:#d3ab80;--wood-top:#e7cba6;--wood-side:#b88c60;--leather:#a98b6b;--leather-dk:#8b6f53;--tin:#d3d4d1;--tin-top:#efefec;--sheen:#fff;--ebony:#3b3936;--ebony-top:#4e4b47;--ebony-side:#2c2a28;--bone:#f4f0e6;--bone-top:#fffdf7;--bone-side:#d8d2c4;--keylit:#93a5ff;--lamp:#f29a2e;--r1:#ec8a22;--r2:#10a07f;--r3:#3b5bfd;--r4:#d6418a;--water:#3b5bfd}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--base-top:#bebeba;--base-side:#737372;--wood:#b2906b;--wood-top:#d8be9b;--wood-side:#816142;--leather:#8e7459;--leather-dk:#745c45;--tin:#b2b2b0;--tin-top:#e0e0dd;--sheen:#d7d7d7;--ebony:#302f2d;--ebony-top:#484642;--ebony-side:#1b1b1a;--bone:#cdcac4;--bone-top:#efede7;--bone-side:#96948f;--keylit:#899aef;--lamp:#ffaa40;--r1:#ffa340;--r2:#36d3aa;--r3:#6f88ff;--r4:#ff6db0;--water:#617cff;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
.top.base{fill:var(--base-top)}.side.base{fill:var(--base-side)}.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.tin{fill:var(--tin)}.top.tin{fill:var(--tin-top)}.ebony{fill:var(--ebony)}.top.ebony{fill:var(--ebony-top)}.side.ebony{fill:var(--ebony-side)}.bone{fill:var(--bone)}.top.bone{fill:var(--bone-top)}.side.bone{fill:var(--bone-side)}.leather{fill:var(--leather)}.leather-dk{fill:var(--leather-dk)}
.rk1{--rc:var(--r1)}.rk2{--rc:var(--r2)}.rk3{--rc:var(--r3)}.rk4{--rc:var(--r4)}
.sheen{stroke:var(--sheen);stroke-width:.8;opacity:.8;stroke-linecap:round;vector-effect:non-scaling-stroke}
.tint{fill:var(--rc);stroke:none;opacity:0;transition:opacity .16s}.lit .tint{opacity:.45}
.halo{fill:var(--rc);opacity:0;pointer-events:none;transition:opacity .2s}.lit .halo{opacity:.7;filter:url(#bloom)}
.mouth{fill:var(--recess);stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke}.armed .mouth{fill:color-mix(in srgb,var(--rc) 60%,var(--recess))}.lit .mouth{fill:var(--rc);filter:url(#glow)}
.lip{fill:var(--tin-top);stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke;stroke-linejoin:round}.rk1 .lip{fill:var(--wood-top)}
.key{cursor:pointer;transition:transform .07s}.key.down{transform:translateY(1.1px)}.key.down .face{fill:var(--accent)}.key.down .top{fill:var(--keylit)}
.ring{fill:none;stroke:var(--rc);stroke-width:1;vector-effect:non-scaling-stroke;opacity:.5}.stop.on .ring{opacity:1;filter:url(#glow)}.stop:hover .ring{opacity:1}.ft{fill:#333;font:2.4px ui-monospace,monospace;font-weight:600;stroke:none}
.lamp{fill:var(--off);stroke:none}.lamp-halo{fill:var(--lamp);opacity:0;transition:opacity .4s}.wind .lamp{fill:var(--lamp);filter:url(#glow)}.wind .lamp-halo{opacity:.55;filter:url(#bloom)}
.led{fill:var(--off);stroke:none}.wind .led{fill:var(--r2);filter:url(#glow)}
.water{fill:var(--water);opacity:.7;stroke:none}.tube{fill:none;stroke:var(--water);stroke-width:1.3;opacity:.7;stroke-linecap:round}.tick{stroke-width:.5}
.blade{fill:var(--base-side);stroke:var(--line);stroke-width:.4;vector-effect:non-scaling-stroke}
.cable-under{fill:none;stroke:var(--line);stroke-width:3.2;stroke-linecap:round;stroke-linejoin:round}.cable{fill:none;stroke:var(--ebony);stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.button-face{transition:fill .15s}.control:hover .button-face{fill:var(--glass)}
@media(prefers-reduced-motion:reduce){.key.down{transform:none}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = ``

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* HALVARD OP–4 chamber organ. World: x lower-right, y lower-left, z up; 1 unit ≈ 0.45 cm.
Part                         x      y      z      w      d      h
plinth                       0      0      0    112     56      6
case                         2      2      6    108     52     58   raised door + side panels
door turn buttons        50/62     54     30    r1.2     1.8      –
key well (clipped)          12     46     42     88      8     20   nameboard, wind lamp
manometer                110.2     38     40      0     12     21   U-tube, water column
moulding                     0      0     64    112     56      3
windchest                    6      6     67    100     44      5
slider ends (4)            106  11–45   68.6   1–4.2      3    1.4   slide out with their stop
gedackt 8′ (25, wood)    8–106  11–15     72  2.1–3.6   2.1–3.6  21–64  V layout, stoppers
rohrflöte 4′ (25)        8–106     23     72  r.95–1.65    –   15–55  mitre, caps, chimneys
prinzipal 2′ (25)        8–106   32.5     72  r.8–1.45     –   11–40  mitre, open
mixtur II (50)           8–106  41/46     72  r.5–.85      –    6–19  mitre, two rows
drawstops (4)         7 / 105     54  48.5/57   r3   2.5–7     –    pull 4.5 out
key cheeks (2)      12 / 95.6     54     41      4     18     10
key bed                     16     51     42   79.6     19      3
naturals (15, ebony)  17+5.2i     51     45    4.8     19    2.2
sharps (10, bone)                 51     47      3     10    2.6
key slip                    16     70     41   79.6    1.8      5
reservoir base             116     10      0     26     36      6
reservoir top + ribs       116     10      6     26     36   2–12   hinged at the back, two weights
duct                       128     46    2.6   r1.7      4      –
blower                     116     50      0     24     14     11   fan grille, rocker, LED, motor
motor + cable              140     40      0     20     24      9
Mouths, lips, sheens, screws and labels share their parent faces. */
// Isometric engine: affine face planes, solids, round parts, grille and fit.
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: oriented planes and boxes, rounded world polygons, tapered round parts, raised panels.
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`;
function rpath(pts,r=3){const p=pts.map(q=>P(...q)),n=p.length;let d='';for(let i=0;i<n;i++){const b=p[i],cut=a=>{const L=Math.hypot(a[0]-b[0],a[1]-b[1])||1,k=Math.min(r,L/2)/L;return[b[0]+(a[0]-b[0])*k,b[1]+(a[1]-b[1])*k];};d+=(i?'L':'M')+cut(p[(i+n-1)%n])+'Q'+b+' '+cut(p[(i+1)%n]);}return d+'Z';}
const facePath=(pts,cls='',r=3,parent=root)=>el('path',{d:rpath(pts,r),class:'face '+cls},parent);
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],add=(...v)=>v.reduce((s,q)=>[s[0]+q[0],s[1]+q[1],s[2]+q[2]]),mul=(a,k)=>a.map(c=>c*k);
function obox(o,A,B,V,a,b,c,r=2,cls='',parent=root){const g=el('g',{},parent),E=[[A,a],[B,b],[V,c]];for(let i=0;i<3;i++){const[n,l]=E[i],[U,lu]=E[(i+1)%3],[W,lw]=E[(i+2)%3],pos=dot(n,[1,1,1])>0,m=pos?n:mul(n,-1),t=Math.abs(m[2])>=Math.max(Math.abs(m[0]),Math.abs(m[1]))?(m[2]>0?'top':'side'):m[0]>m[1]?'side':'';rect(el('g',{transform:plane(pos?add(o,mul(n,l)):o,U,W)},g),0,0,lu,lw,r,`face ${t} ${cls}`);}return g;}
function cone(x,y,z,r1,r2,h,cls,parent=root){const p=P(x,y,z),q=P(x,y,z+h),k=Math.SQRT2,a1=r1*k*C,b1=r1*k*S,a2=r2*k*C,b2=r2*k*S;return el('path',{d:`M${p[0]-a1},${p[1]} A${a1},${b1} 0 0 0 ${p[0]+a1},${p[1]} L${q[0]+a2},${q[1]} A${a2},${b2} 0 0 1 ${q[0]-a2},${q[1]} Z`,class:'face '+cls},parent);}
function panel(g,x,y,w,h,b=2.2){rect(g,x,y,w,h,1,'face');el('path',{d:`M${x},${y}H${x+w}L${x+w-b},${y+b}H${x+b}ZM${x},${y}L${x+b},${y+b}V${y+h-b}L${x},${y+h}Z`,class:'face top'},g);el('path',{d:`M${x},${y+h}L${x+b},${y+h-b}H${x+w-b}L${x+w},${y+h}ZM${x+w},${y}V${y+h}L${x+w-b},${y+h-b}V${y+b}Z`,class:'face side'},g);}
function pin(g,x,y,r=.75){circle(g,x,y,r,'face top');line(g,x-r*.5,y+r*.35,x+r*.5,y-r*.35);}
const adopt=(g,n)=>{g.appendChild(n.g||n);return n;};
// Assembly: shadow, plinth, case and its faces, key well, moulding, windchest, ranks back to front,
// left stops, keydesk, right stops, reservoir, blower.
const defs=svg.querySelector('defs');
const sh=P(78,40,0);el('ellipse',{cx:sh[0],cy:sh[1]+2,rx:104,ry:40,class:'shadow stage-floor'});el('ellipse',{cx:sh[0],cy:sh[1]+2,rx:104,ry:40,class:'stage-contact'});
box(0,0,0,112,56,6,2,'base');line(group(FRONT(0,56,6)),3,1.8,109,1.8);line(group(SIDE(112,56,6)),3,1.8,53,1.8);
box(2,2,6,108,52,58,2);
const CF=group(FRONT(2,54,64));
for(const u of[6,56])panel(CF,u,24,46,30,2.6);
line(CF,2,58.6,106,58.6);
for(const x of[50,62]){const k=cylinder(x,54,30,1.25,1.8,'y','ebony');circle(k.face,0,0,.55,'detail');}
for(const x of[7.4,104.6])for(const z of[13,33]){cylinder(x,54.6,z,.75,4.6,'z','base');}
const STOPS=[{r:0,x:7,z:57},{r:1,x:7,z:48.5},{r:2,x:105,z:57},{r:3,x:105,z:48.5}];
for(const s of STOPS){const f=group(FRONT(s.x,54.02,s.z));circle(f,0,0,4.3,'face top');circle(f,0,0,3.4,'detail');circle(f,0,0,1.7,'face recess');}
const CS=group(SIDE(110,54,64));panel(CS,20,5,30,27,2.4);panel(CS,4,36,46,18,2.4);
const MN=group(SIDE(110.2,50,61));rect(MN,-.8,-.8,13.6,22.6,1.8,'face base');rect(MN,0,0,12,21,1.2,'face top');
rect(MN,2.3,2.3,2.4,16,1.2,'face glass');rect(MN,7.3,2.3,2.4,16,1.2,'face glass');
el('path',{d:'M3.5,17.6 V18.8 Q3.5,20 6,20 Q8.5,20 8.5,18.8 V17.6',class:'tube'},MN);
const wL=rect(MN,2.8,9,1.4,9,.7,'water'),wR=rect(MN,7.8,9,1.4,9,.7,'water');
for(let i=0;i<8;i++)line(MN,5.2,3.4+i*2,i%2?5.9:6.8,3.4+i*2,'detail tick');pin(MN,1.2,1.2,.5);pin(MN,10.8,1.2,.5);
text(group(SIDE(110.1,50,38.4)),6,0,'WIND · MM','etch micro center');
// Key well: interior clipped to the opening in the case front.
el('path',{d:'M'+[P(12,54,62),P(100,54,62),P(100,54,42),P(12,54,42)].join(' L')+' Z'},el('clipPath',{id:'wellClip'},defs));
const WG=el('g',{'clip-path':'url(#wellClip)'});
rect(group(TOP(12,46,42),WG),0,0,88,8,0,'face recess');
const NB=group(FRONT(12,46,62),WG);rect(NB,0,0,88,20,0,'face base');
line(NB,6,2.6,82,2.6);line(NB,6,13,82,13);text(NB,40,8.6,'HALVARD','label brand center');text(NB,40,11.8,'OPUS 4 · CHAMBER ORGAN','etch micro center');
const LP=group(FRONT(84,46.1,55.6),WG);circle(LP,0,0,3.4,'lamp-halo');circle(LP,0,0,2,'face base');circle(LP,0,0,1.25,'lamp');
rect(group(SIDE(12,54,62),WG),0,0,8,20,0,'face recess');
rect(group(FRONT(12,54.02,62)),0,0,88,20,1.2,'detail');
box(0,0,64,112,56,3,1.2);line(group(FRONT(0,56,67)),2,1.5,110,1.5);line(group(SIDE(112,56,67)),2,1.5,54,1.5);
box(6,6,67,100,44,5,1,'wood');
const CHF=group(FRONT(6,50,72));for(let i=0;i<10;i++)pin(CHF,5+i*10,2.5);line(CHF,1,4.2,99,4.2);
const CHS=group(SIDE(106,50,72));line(CHS,1,4.2,43,4.2);
// Ranks: back to front; inside a rank, pipes by x. Gedackt bass at both ends, the others mitred.
const CH=72,mitre=n=>12+(n%2?-1:1)*Math.ceil(n/2),vee=n=>n%2?(n-1)/2:24-n/2,geo=(a,b,n)=>a*Math.pow(b/a,n/24),SX=s=>10+s*3.9;
const RANKS=[
{name:'GEDACKT 8′',ft:'8′',y:13,lay:vee,h:[58,17],w:[3.6,2.1],kind:'wood',voice:[[1,'triangle',.5],[3,'sine',.05]]},
{name:'ROHRFLÖTE 4′',ft:'4′',y:23,lay:mitre,h:[50,15],w:[1.65,.95],kind:'chimney',voice:[[2,'sine',.36],[6,'sine',.04]]},
{name:'PRINZIPAL 2′',ft:'2′',y:32.5,lay:mitre,h:[40,11],w:[1.45,.8],kind:'open',voice:[[4,'triangle',.24],[8,'sine',.05]]},
{name:'MIXTUR II',ft:'II',y:41,lay:mitre,h:[19,7],w:[.85,.55],kind:'mix',voice:[[6,'sine',.1],[8,'sine',.08]]}];
for(const R of RANKS)R.sg=el('g',{});
function woodPipe(parent,x,y,w,h){
const g=el('g',{class:'pipe'},parent),z0=CH+4,zt=z0+h;
adopt(g,cylinder(x,y,CH,w*.2,4,'z','wood'));
const b=adopt(g,box(x-w/2,y-w/2,z0,w,w,h,.45,'wood'));
const t=b.cloneNode(true);t.querySelectorAll('rect').forEach(n=>set(n,'class','tint'));g.appendChild(t);
const m=P(x,y+w/2,z0+4.4);el('ellipse',{cx:m[0],cy:m[1],rx:w*1.5,ry:w*1.1,class:'halo'},g);
const f=group(FRONT(x-w/2,y+w/2,zt),g);line(f,.3,h-3,w-.3,h-3);
el('path',{d:`M${w*.18},${h-4.6}L${w*.3},${h-6.8}H${w*.7}L${w*.82},${h-4.6}Z`,class:'lip'},f);rect(f,w*.18,h-4.6,w*.64,1.4,.2,'mouth');
rect(group(TOP(x-w/2,y-w/2,zt),g),.45,.45,w-.9,w-.9,.3,'detail');adopt(g,cylinder(x,y,zt,w*.17,2,'z','wood'));
return g;
}
function tinPipe(parent,x,y,r,h,kind){
const g=el('g',{class:'pipe'},parent),foot=kind==='mix'?3.6:5+h*.08,zm=CH+foot,zt=CH+h;
cone(x,y,CH,r*.28,r*.9,foot,'tin',g);
const b=adopt(g,cylinder(x,y,zm,r,h-foot,'z','tin'));
const a=P(x,y,zm),q=P(x,y,zt),sx=-.45*r*Math.SQRT2*C,sy=.89*r*Math.SQRT2*S;
el('line',{x1:a[0]+sx,y1:a[1]+sy-.8,x2:q[0]+sx,y2:q[1]+sy,class:'sheen'},g);
const t=b.g.cloneNode(true);t.querySelectorAll('path,circle').forEach(n=>set(n,'class','tint'));g.appendChild(t);
if(kind==='chimney'){adopt(g,cylinder(x,y,zt,r*1.14,1.3,'z','tin'));const ch=adopt(g,cylinder(x,y,zt+1.3,r*.34,Math.max(2,h*.1),'z','tin'));circle(ch.face,0,0,r*.2,'face recess');}
else circle(b.face,0,0,r*.7,'face recess');
const m=P(x,y+r,zm+r*.3);el('ellipse',{cx:m[0],cy:m[1],rx:r*2+1.2,ry:r*1.6+1,class:'halo'},g);
const f=group(FRONT(x,y+r,zm),g),mw=r*1.15,mh=Math.max(.42,r*.4);
el('path',{d:`M${-mw/2},${-mh}Q0,${-mh-mw*.7} ${mw/2},${-mh}`,class:'lip'},f);rect(f,-mw/2,-mh,mw,mh,.15,'mouth');
return g;
}
RANKS.forEach((R,i)=>{
R.on=i===0;R.pipes=[...Array(25)].map(()=>[]);R.g=el('g',{class:`rank rk${i+1}${R.on?' armed':''}`});
const order=[...Array(25).keys()].sort((a,b)=>R.lay(a)-R.lay(b));
const rows=R.kind==='mix'?[[41,1],[46,.8]]:[[R.y,1]];
for(const[y,k]of rows)for(const n of order){
const x=SX(R.lay(n)),w=geo(R.w[0],R.w[1],n)*(k<1?.9:1),h=geo(R.h[0],R.h[1],n)*k;
R.pipes[n].push(R.kind==='wood'?woodPipe(R.g,x,y,w,h):tinPipe(R.g,x,y,w,h,R.kind));
}
});
// Drawstops and keydesk. Stops are rebuilt as they travel; the slider end on the chest follows.
function makeStop(s,i){const R=RANKS[s.r];s.p=R.on?1:0;s.g=button(el('g'),{class:`control stop rk${s.r+1}${R.on?' on':''}`,'aria-label':`${R.name} drawstop (${i+1})`,'aria-pressed':String(R.on)});bind(s.g,()=>toggleStop(i));drawStop(s);}
function drawStop(s){
const R=RANKS[s.r],g=s.g,out=2.5+4.5*s.p;g.textContent='';
adopt(g,box(s.x-1.25,54,s.z-1.25,2.5,out,2.5,.4,'ebony'));
const k=adopt(g,cylinder(s.x,54+out,s.z,3,2.4,'y','ebony'));
circle(k.face,0,0,2.2,'face bone');text(k.face,0,.85,R.ft,'ft center');circle(k.face,0,0,2.65,'ring');
circle(k.face,0,0,4.6,'focus-ring');circle(k.face,0,0,5.2,'hit');
R.sg.textContent='';adopt(R.sg,box(106,R.y-1.5,68.6,1+3.2*s.p,3,1.4,.3,'wood'));
}
const KX=17,KP=5.2,NAT=[0,2,4,5,7,9,11,12,14,16,17,19,21,23,24],keys=[];
STOPS.slice(0,2).forEach(makeStop);
box(12,54,41,4,18,10,1);
box(16,51,42,79.6,19,3,.6,'base');
NAT.forEach((n,j)=>{const g=el('g',{class:'key'});adopt(g,box(KX+j*KP,51,45,4.8,19,2.2,.6,'ebony'));keys[n]=g;});
NAT.forEach((n,j)=>{if(j<14&&[0,2,5,7,9].includes(n%12)){const g=el('g',{class:'key'});adopt(g,box(KX+(j+1)*KP-1.7,51,47,3,10,2.6,.45,'bone'));keys[n+1]=g;}});
box(16,70,41,79.6,1.8,5,.5,'wood');
box(95.6,54,41,4,18,10,1);
STOPS.slice(2).forEach((s,i)=>makeStop(s,i+2));
// Wind: wedge reservoir (rebuilt as it rises), duct and blower with a fan behind its grille.
box(116,10,0,26,36,6,1.2,'wood');const RBF=group(FRONT(116,46,6));pin(RBF,2.5,3);pin(RBF,23.5,3);
const resG=el('g',{});
adopt(el('g'),cylinder(128,46,2.6,1.7,4,'y','base'));
box(116,50,0,24,14,11,1.8,'base');
const BF=group(FRONT(116,64,11));circle(BF,7,5.5,4.3,'face recess');
const fanG=group('translate(7 5.5)',BF);for(let i=0;i<5;i++)el('path',{d:'M0,0 Q1.2,-2.2 3.6,-1.7 Q3.4,.2 0,0Z',class:'blade',transform:`rotate(${i*72})`},fanG);
for(const r of[1.6,2.9,4.1])circle(BF,7,5.5,r,'detail');line(BF,2.9,5.5,11.1,5.5);line(BF,7,1.4,7,9.6);circle(BF,7,5.5,.8,'face top');
const sw=button(group(FRONT(131.5,64.1,9),root,{id:'blower'}),{'aria-label':'Blower (B)','aria-pressed':'false'});
rect(sw,-1.6,-1.6,9.2,9.6,2,'focus-ring');rect(sw,-2.5,-2.5,11,11.4,0,'hit');rect(sw,0,0,6,6.4,1.4,'face recess');
const rock=rect(sw,.8,.8,4.4,2.6,.8,'face top button-face');text(sw,3,8.6,'0 / I','etch micro center');
const BL=group(FRONT(116,64.1,11));circle(BL,22,2.6,.9,'led');pin(BL,1.6,1.6,.55);pin(BL,22.4,9.4,.55);
const BS=group(SIDE(140,64,11));slits(BS,2.5,2.2,9,3,6);
const motor=cylinder(140,57,5.2,3.4,5.5,'x','base');for(let i=0;i<4;i++)line(motor.face,-2,-1.5+i,2,-1.5+i);ellipse(142.6,57,5.2,3.45,'x','detail');
wire([[145.5,57,3.4],[148,57.5,1],[152,56,.6],[156,46,.6],[157,32,.6]],'cable-under');wire([[145.5,57,3.4],[148,57.5,1],[152,56,.6],[156,46,.6],[157,32,.6]],'cable');
frame([[0,0,0,112,72,67],[8,10,72,98,40,64],[112,6,0,46,60,22]],12);
// Organ state. Web Audio is created on the first gesture; voices are additive per drawn stop.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const say=t=>{announcement.textContent=t;},clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
const NAMES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const held=new Array(25).fill(0),voices={},hintB=document.querySelector('[data-k="b"]');
let ac=null,bus=null,noise=null,windGain=null,wind=false,lift=1.5,drawn=-1,water=0,fan=0,last=performance.now(),cadT=null,cad=[],shown='';
function audio(){
try{
if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();
const comp=ac.createDynamicsCompressor();comp.connect(ac.destination);
const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=3600;lp.connect(comp);bus=ac.createGain();bus.gain.value=.8;bus.connect(lp);
const len=ac.sampleRate*1.8|0,ir=ac.createBuffer(2,len,ac.sampleRate);for(let c=0;c<2;c++){const d=ir.getChannelData(c);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6);}
const conv=ac.createConvolver(),wet=ac.createGain();conv.buffer=ir;wet.gain.value=.18;bus.connect(conv);conv.connect(wet);wet.connect(comp);
noise=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const nd=noise.getChannelData(0);for(let i=0;i<nd.length;i++)nd[i]=Math.random()*2-1;
const src=ac.createBufferSource(),wl=ac.createBiquadFilter();src.buffer=noise;src.loop=true;wl.type='lowpass';wl.frequency.value=170;windGain=ac.createGain();windGain.gain.value=0;src.connect(wl);wl.connect(windGain);windGain.connect(comp);src.start();}
if(ac.state==='suspended')ac.resume().catch(()=>{});
}catch(_){ac=null;}
return ac;
}
function voice(n){
const a=audio();if(!a||!bus)return;const f0=130.81*Math.pow(2,n/12),t=a.currentTime,nodes=[],vg=a.createGain();
vg.gain.setValueAtTime(0,t);vg.gain.linearRampToValueAtTime(.045,t+.04);vg.connect(bus);
for(const R of RANKS)if(R.on)for(const[m,type,v]of R.voice){const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=f0*m;g.gain.value=v;o.connect(g);g.connect(vg);o.start(t);nodes.push(o);}
if(nodes.length){const s=a.createBufferSource(),bp=a.createBiquadFilter(),g=a.createGain();s.buffer=noise;bp.type='bandpass';bp.frequency.value=Math.min(7000,f0*6);bp.Q.value=2.5;g.gain.setValueAtTime(.0001,t);g.gain.linearRampToValueAtTime(.4,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.08);s.connect(bp);bp.connect(g);g.connect(vg);s.start(t,Math.random(),.1);}
voices[n]={vg,nodes};
}
function mute(n){const v=voices[n];if(!v||!ac)return;const t=ac.currentTime;v.vg.gain.cancelScheduledValues(t);v.vg.gain.setValueAtTime(v.vg.gain.value,t);v.vg.gain.linearRampToValueAtTime(0,t+.12);for(const o of v.nodes)o.stop(t+.16);delete voices[n];}
function light(n){const on=held[n]>0&&wind;for(const R of RANKS)for(const g of R.pipes[n])g.classList.toggle('lit',on&&R.on);}
function press(n){if(n<0||n>24)return;if(held[n]++>0)return;if(!wind)setWind(true);keys[n].classList.add('down');light(n);voice(n);}
function release(n){if(!held[n])return;if(--held[n]>0)return;keys[n].classList.remove('down');light(n);mute(n);}
function setWind(on){
audio();wind=on;svg.classList.toggle('wind',on);set(hintB,'aria-pressed',on);set(sw,'aria-pressed',on);set(rock,'y',on?2.9:.8);
if(windGain)windGain.gain.setTargetAtTime(on?.012:0,ac.currentTime,.25);
if(!on){stopCadence();for(let n=0;n<25;n++){held[n]=0;keys[n].classList.remove('down');light(n);mute(n);}kb.clear();}
say(on?'Blower on. Wind rising to 55 millimetres.':'Blower off. The reservoir settles.');
}
function toggleStop(i){
const s=STOPS[i],R=RANKS[s.r];audio();R.on=!R.on;R.g.classList.toggle('armed',R.on);s.g.classList.toggle('on',R.on);set(s.g,'aria-pressed',R.on);
for(let n=0;n<25;n++)if(held[n]){light(n);mute(n);voice(n);}
say(`${R.name} ${R.on?'drawn':'pushed in'}.`);
}
function stopCadence(){clearTimeout(cadT);cadT=null;cad.forEach(release);cad=[];}
function cadence(){
if(cadT){stopCadence();say('Cadence stopped.');return;}
const chords=[[0,4,7,12],[5,9,12,17],[7,11,14,19],[0,4,7,12,16]];let i=0;
const step=()=>{cad.forEach(release);cad=[];if(i>=chords.length){cadT=null;return;}cad=chords[i++];cad.forEach(press);cadT=setTimeout(step,i===chords.length?1500:780);};
say('Playing a cadence: C, F, G, C.');step();
}
// Keys: the home row plays naturals, the row above plays sharps; the drawn keys take pointer glissandi.
const KB={a:0,w:1,s:2,e:3,d:4,f:5,t:6,g:7,y:8,h:9,u:10,j:11,k:12,o:13,l:14,p:15,';':16,"'":17},kb=new Set(),ptr=new Set();let dragging=false;
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.length===1?e.key.toLowerCase():e.key;
if(k in KB){e.preventDefault();if(!e.repeat&&!kb.has(k)){kb.add(k);press(KB[k]);}return;}
if(e.defaultPrevented||e.repeat)return;
if(k>='1'&&k<='4'){e.preventDefault();toggleStop(+k-1);}
else if(k==='b'){e.preventDefault();setWind(!wind);}
else if(k===' '){if(e.target.closest&&e.target.closest('button,[role=button]'))return;e.preventDefault();cadence();}
});
document.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;if(kb.has(k)){kb.delete(k);release(KB[k]);}});
window.addEventListener('blur',()=>{for(const k of kb)release(KB[k]);kb.clear();});
keys.forEach((g,n)=>{
g.addEventListener('pointerdown',e=>{e.preventDefault();dragging=true;if(!ptr.has(n)){ptr.add(n);press(n);}});
g.addEventListener('pointerenter',()=>{if(dragging&&!ptr.has(n)){ptr.add(n);press(n);}});
g.addEventListener('pointerleave',()=>{if(ptr.has(n)){ptr.delete(n);release(n);}});
});
const up=()=>{dragging=false;for(const n of ptr)release(n);ptr.clear();};window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up);
bind(sw,()=>setWind(!wind));
document.querySelectorAll('.hint [data-k]').forEach(b=>b.addEventListener('click',()=>b.dataset.k==='b'?setWind(!wind):cadence()));
function drawRes(L){
resG.textContent='';const th=Math.atan2(L,36),cs=Math.cos(th),sn=Math.sin(th),o=[116,10,8],A=[1,0,0],B=[0,cs,sn],V=[0,-sn,cs];
const fy=10+36*cs,fz=8+36*sn,my=(46+fy)/2-1.6,mz=(6+fz)/2;
facePath([[142,10,6],[142,46,6],[140.4,my,mz],[140.4,10,7]],'side leather-dk',.3,resG);facePath([[140.4,10,7],[140.4,my,mz],[142,fy,fz],[142,10,8]],'side leather',.3,resG);
facePath([[116,46,6],[142,46,6],[140.4,my,mz],[116,my,mz]],'leather-dk',.3,resG);facePath([[116,my,mz],[140.4,my,mz],[142,fy,fz],[116,fy,fz]],'leather',.3,resG);
obox(o,A,B,V,26,36,2.5,1,'wood',resG);
for(const ax of[2.5,14.5]){const w=add(o,mul(V,2.5),mul(B,16),mul(A,ax));obox(w,A,B,V,9,7,3.2,.7,'base',resG);circle(el('g',{transform:plane(add(w,mul(V,3.2),mul(B,3.5),mul(A,4.5)),A,B)},resG),0,0,1.3,'detail');}
}
function status(){
const notes=[];for(let n=0;n<25;n++)if(held[n])notes.push(NAMES[n%12]+(3+Math.floor(n/12)));
const on=RANKS.filter(R=>R.on),mm=wind?Math.round(55*clamp((lift-1.5)/8.5)):0;
const r=`${notes.length?notes.join(' '):'—'} · ${on.length} STOP${on.length===1?'':'S'}`,st=`${wind?`WIND ${mm} MM`:'WIND OFF'} · ${on.length?on.map(R=>R.ft).join(' + '):'NO STOPS'}`;
if(r+st!==shown){readout.textContent=r;stateLabel.textContent=st;shown=r+st;}
}
function tick(now){
const dt=Math.min(.05,(now-last)/1000);last=now;
let sounding=0;for(let n=0;n<25;n++)if(held[n])sounding+=RANKS.filter(R=>R.on).length;
const target=wind?10.5-Math.min(4,sounding*.3)+(sounding?0:.3*Math.sin(now/850)):1.5;
lift=reduced.matches?target:lift+(target-lift)*Math.min(1,dt*(wind?3:1.4));
if(Math.abs(lift-drawn)>.015){drawRes(lift);drawn=lift;}
const wt=wind?3.4*clamp((lift-1.5)/8.5):0;water+=(wt-water)*(reduced.matches?1:Math.min(1,dt*5));
const jit=wind&&sounding&&!reduced.matches?.18*Math.sin(now/45):0;set(wL,'y',9+water+jit);set(wL,'height',9-water-jit);set(wR,'y',9-water-jit);set(wR,'height',9+water+jit);
if(wind&&!reduced.matches){fan=(fan+dt*820)%360;set(fanG,'transform',`translate(7 5.5) rotate(${fan})`);}
for(const s of STOPS){const tp=RANKS[s.r].on?1:0;if(s.p!==tp){s.p=reduced.matches?tp:(Math.abs(tp-s.p)<.02?tp:s.p+(tp-s.p)*Math.min(1,dt*12));drawStop(s);}}
status();requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['b', 'space'], draw }
