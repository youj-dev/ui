// @ts-nocheck
/* VESPERA H–12 · Hourglass. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--wood:#9a6a42;--wood-top:#b9875a;--wood-side:#7b5232;--brass:#cfa95d;--brass-top:#e8c985;--brass-side:#ab8743;--env:#d3d3ce;--env-a:.46;--film:.12;--shine:.9;--sand:#dbbb88;--sand-top:#f3e2c0;--sand-lo:#b48c55;--pit:#94703d;--glow:#ffb547;--wheel:#2a2622;--num:#f3ecdc;--jewel:#6b4a1c}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--wood:#815836;--wood-top:#ad7e54;--wood-side:#553720;--brass:#ae8e4d;--brass-top:#d9bc7c;--brass-side:#785e2d;--env:#b2b2ae;--sand:#b89d72;--sand-top:#cdbea1;--sand-lo:#977546;--pit:#7c5d32;--glow:#ffb547;--wheel:#211e1c;--num:#cdc7b9;--jewel:#593d16;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:3.4px;letter-spacing:1px;font-weight:600}.micro{font-size:2.2px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.brass{fill:var(--brass)}.top.brass{fill:var(--brass-top)}.side.brass{fill:var(--brass-side)}.dark-ink{fill:#2a2118}
.grain{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.26}
.env{fill:var(--env);fill-opacity:var(--env-a);stroke:none}.film{fill:#fff;fill-opacity:var(--film);stroke:var(--line);stroke-width:.9;vector-effect:non-scaling-stroke;stroke-linejoin:round}.rim{fill:none;stroke:var(--line);stroke-width:3.4;opacity:.2}.shine{fill:none;stroke:#fff;stroke-linecap:round;opacity:var(--shine)}.shine.dim{opacity:calc(var(--shine)*.45)}
.sand{fill:url(#sandG);stroke:none}.sandt{fill:var(--sand-top)}.sandl{fill:var(--sand-lo)}.pit{fill:var(--pit)}.pitw{fill:url(#pitG)}.pile{fill:url(#pileG);stroke:var(--sand-lo);stroke-width:.5;vector-effect:non-scaling-stroke;stroke-opacity:.55}.stream{fill:none;stroke:var(--sand-lo);stroke-linecap:round}
.halo{fill:var(--glow);opacity:0;filter:url(#bloom);pointer-events:none}.caustic{fill:var(--glow);opacity:.16;filter:url(#bloom)}
.wheel{fill:var(--wheel)}.num{fill:var(--num);font:600 4.4px ui-monospace,monospace;text-anchor:middle;stroke:none}.jewel{fill:var(--jewel)}.jewel.on{fill:var(--glow);filter:url(#glow)}
.control{cursor:pointer;outline:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<linearGradient id="sandG"><stop offset="0" style="stop-color:var(--sand)"/><stop offset=".35" style="stop-color:var(--sand)"/><stop offset="1" style="stop-color:var(--sand-lo)"/></linearGradient><linearGradient id="pileG"><stop offset="0" style="stop-color:var(--sand-top)"/><stop offset=".42" style="stop-color:var(--sand-top)"/><stop offset=".62" style="stop-color:var(--sand)"/><stop offset="1" style="stop-color:var(--sand-lo)"/></linearGradient><linearGradient id="pitG" x2="0" y2="1"><stop offset="0" style="stop-color:var(--sand)"/><stop offset="1" style="stop-color:var(--pit)"/></linearGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* VESPERA H–12 hourglass on a turning cradle. World: x lower-right; y lower-left; z up. 1 unit ≈ 1.5 mm.
Part x y z w d h
feet ×4 14/96 22/48 0 r3.4 – 3
plinth 6 16 3 98 38 10
moulding 10 20 13 90 30 4
brass plate · counter · jewel (front) 31 54 4 48 0 8.6
posts ×2 24/86 35 17 r3.1 – 76 (base rings r5.4, finials r3.2 at 97)
bearings ×2 (along x) 21.4/83.4 35 86 5.2 r3.8 –
pivot pins (along x) 26.6→31.3 / 78.7→83.4 35 86 – r1.5 –
Hourglass, local u v t around the pivot 55 35 86; t runs along the glass, the cradle turns it about x:
glass bulbs (ellipsoids, cut by the caps) 0 0 ±27 r19 – 55 (t 0…±48)
neck collar 0 0 −3…3 r4.6 – 6
caps: three turned discs 0 0 ±48…±58 r21.5/24/20.5 – –
columns ×4 at u v 21.5 · 0/90/180/270° t −56…56 r1.4, beads at t ±14/±38, bosses at t 0
finials ×8 t ±58…±62.5 r1.8/2.2
Grain, rings, print and screws share their parent face. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: vectors, oriented planes, rods on any axis, convex hull.
const draw=root,into=g=>root=g,defs=svg.querySelector('defs'),f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=p=>p*p*(3-2*p);
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(Math.hypot(...a)||1));
const plane=(o,U,V)=>`matrix(${P(...U).map(f2).join(' ')} ${P(...V).map(f2).join(' ')} ${P(...o).map(f2).join(' ')})`;
function rod(a,b,r,cls=''){
const ax=sub(b,a),n=unit(ax),U=unit(Math.abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n)),V=cross(n,U),e=dot(n,[1,1,1])>0?b:a;
const c0=ring(r>6?44:14,t=>add(a,add(mul(U,r*Math.cos(t)),mul(V,r*Math.sin(t))))),c1=c0.map(p=>add(p,ax));
el('path',{d:pd(hull([...c0,...c1].map(p=>P(...p)))),class:'face '+cls});el('path',{d:pd((e===b?c1:c0).map(p=>P(...p))),class:'face top '+cls});
return group(plane(e,U,V));
}
const ring=(n,f)=>Array.from({length:n},(_,i)=>f(i/n*Math.PI*2)),pd=q=>q.length?'M'+q.map(p=>f2(p[0])+','+f2(p[1])).join('L')+'Z':'';
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const p of pts){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(const p of pts.reverse()){while(hi.length>1&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
// Glass geometry: each bulb is an ellipsoid (r 19, half-length 27.5, centre t ±27) cut by its cap at t ±48.
const RQ=19,LQ=27.5,CQ=27,TQ=48,RT=RQ*Math.sqrt(1-((TQ-CQ)/LQ)**2),DZ=.0386,FILL=.62;
let ph=0,cs=1,sn=0;
const LW=p=>[55+p[0],35+p[1]*cs-p[2]*sn,86+p[1]*sn+p[2]*cs],LS=p=>P(...LW(p));
const solveH=F=>{let lo=0,hi=2;for(let i=0;i<24;i++){const m=(lo+hi)/2;m*m*(3-m)/4<F?lo=m:hi=m;}return(lo+hi)/2;};
function sil(σ){const wq=unit([1/RQ,(cs+sn)/RQ,(cs-sn)/LQ]),f=unit(cross(wq,[1,0,0])),g=cross(wq,f);return{wq,pts:ring(40,a=>{const q=add(mul(f,Math.cos(a)),mul(g,Math.sin(a)));return[RQ*q[0],RQ*q[1],LQ*q[2]+σ*CQ];})};}
const trunc=σ=>ring(24,a=>[RT*Math.cos(a),RT*Math.sin(a),σ*TQ]);
const glassPts=σ=>hull([...sil(σ).pts.filter(p=>σ*p[2]<=TQ),...trunc(σ)].map(LS));
// Sand in one bulb: level free surface, volume from the ellipsoid cap; the cut-off pole fills first when the cap is down.
function sandPts(σ,Fb){
const ul=[0,sn,cs],w=clamp((1-σ*cs)/2),δ=solveH(w*DZ+Fb*(1-DZ))-1,np=[0,RQ*sn,LQ*cs],m=Math.hypot(np[1],np[2]),nh=mul(np,1/m),d=m*δ+σ*CQ*cs,ρ=Math.sqrt(Math.max(0,1-δ*δ)),e2=[0,nh[2],-nh[1]];
const Q=q=>[RQ*q[0],RQ*q[1],LQ*q[2]+σ*CQ],below=p=>dot(ul,p)<=d+1e-6;
const surf=ring(32,a=>Q(add(mul(nh,δ),add([ρ*Math.cos(a),0,0],mul(e2,ρ*Math.sin(a))))));
return{d,rw:RQ*ρ,c:LW(Q(mul(nh,δ))),surf,body:[...sil(σ).pts.filter(p=>σ*p[2]<=TQ&&below(p)),...surf.filter(p=>σ*p[2]<=TQ),...trunc(σ).filter(below)]};
}
// Floor shadow, brass feet, walnut plinth and moulding, brass plate with the turn counter.
const s0=P(55,35,0);el('ellipse',{cx:s0[0]+2,cy:s0[1]+4,rx:74,ry:27,class:'shadow stage-floor'});el('ellipse',{cx:s0[0]+2,cy:s0[1]+4,rx:74,ry:27,class:'stage-contact'});
for(const[x,y]of[[14,22],[96,22],[14,48],[96,48]])cylinder(x,y,0,3.4,3.4,'z','brass');
box(6,16,3,98,38,10,2,'wood');
const pf=group(FRONT(6,54,13)),psd=group(SIDE(104,54,13));
for(const v of[2.6,7.4]){el('path',{d:`M3,${v}C30,${v+.7} 62,${v-.6} 95,${v+.3}`,class:'grain'},pf);el('path',{d:`M3,${v}C14,${v-.5} 26,${v+.5} 35,${v}`,class:'grain'},psd);}
box(10,20,13,90,30,4,1.5,'wood');
const mt=group(TOP(10,20,17));rect(mt,2.4,2.4,85.2,25.2,1.2,'detail');for(const v of[8,15,22])el('path',{d:`M5,${v}C30,${v-1.2} 58,${v+1} 85,${v-.4}`,class:'grain'},mt);
const pl=group(FRONT(31,54.05,12.6));rect(pl,0,0,48,8.6,1.4,'face brass');rect(pl,1,1,46,6.6,1,'detail');
text(pl,3.2,4.6,'VESPERA','label brand dark-ink');text(pl,3.2,7.1,'H–12 · 12 S','etch micro');
rect(pl,27.4,1.5,15.6,5.6,1,'face recess');const cpw=el('clipPath',{id:'win'},defs);rect(cpw,28,1.9,14.4,4.8,.6,'');
const WH=[0,1,2].map(i=>{const x=30.4+i*4.8;rect(pl,x-2.15,1.9,4.3,4.8,.5,'face wheel');const g=group('',pl,{'clip-path':'url(#win)'});return{g,a:text(g,x,5.85,'0','num'),b:text(g,x,10.85,'0','num'),v:'0',t:-1};});
const jewel=circle(pl,45.2,4.3,1.3,'jewel');circle(pl,45.2,4.3,1.9,'detail');
const sh1=P(55,35,17);el('ellipse',{cx:sh1[0],cy:sh1[1],rx:30,ry:13,class:'shadow',style:'opacity:.1'});
const caus=P(55,38,17.1);el('ellipse',{cx:caus[0]+4,cy:caus[1]-1,rx:9,ry:4,class:'caustic'});
const halo=el('ellipse',{cx:P(55,35,86)[0],cy:P(55,35,86)[1],rx:46,ry:70,class:'halo'});
// Posts: base ring, shaft, bearing (along x), pivot pin, ball finial. The left one sits behind the glass.
function post(x,side){
if(side>0)cylinder(78.7,35,86,1.5,x-81.3,'x','brass');
cylinder(x,35,17,5.4,2.6,'z','brass');cylinder(x,35,19.6,3.1,74,'z','brass');
for(const z of[30,62])cylinder(x,35,z,3.7,1.4,'z','brass');
cylinder(x-2.6,35,86,3.8,5.2,'x','brass');ellipse(x+2.6,35,86,2,'x','detail');
if(side<0)cylinder(x+2.6,35,86,1.5,31.3-x-2.6,'x','brass');
const b=P(x,35,96.8);circle(draw,b[0],b[1],3.9,'face top brass');el('path',{d:`M${f2(b[0]-2.6)},${f2(b[1]-.4)}A2.7,2.7 0 0 1 ${f2(b[0]-.5)},${f2(b[1]-2.6)}`,class:'shine','stroke-width':.8},draw);
}
post(24,-1);
// The turning glass: rebuilt on each pose. Sand, stream and highlights keep their nodes.
const HG=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Turn the hourglass over (F)'});
const gcp=el('clipPath',{id:'gl'},defs),glp=[el('path',{},gcp),el('path',{},gcp)];
const sandL=el('g',{'clip-path':'url(#gl)'}),SB=[0,1].map(()=>{const g=el('g',{},sandL);return{g,body:el('path',{class:'sand'},g),surf:el('path',{class:'sandt'},g),a:el('path',{},g),b:el('path',{},g)};});
const strL=el('g',{'clip-path':'url(#gl)'}),strA=el('path',{class:'stream','stroke-width':.9,opacity:.55},strL),strB=el('path',{class:'stream','stroke-width':1.35},strL);
const CAPS=[[48,50.5,21.5],[50.5,56,24],[56,58,20.5]],COL=[[21.5,0],[0,21.5],[-21.5,0],[0,-21.5]];
function fin(σ){for(const[u,v]of COL){rod(LW([u,v,σ*58]),LW([u,v,σ*60.4]),1.8,'brass');const b=LS([u,v,σ*61.8]);circle(root,b[0],b[1],2.6,'face top brass');}}
function cap(σ){const vis=σ*(cs-sn)>0;if(!vis)fin(σ);for(const[a,b,r]of vis?CAPS:[...CAPS].reverse()){const g=rod(LW([0,0,σ*a]),LW([0,0,σ*b]),r,'wood');if(r>23)circle(g,0,0,r*.93,'grain');if(r<21&&vis){for(const k of[.8,.56])circle(g,0,0,r*k,'grain');circle(g,0,0,5.6,'face brass');circle(g,0,0,3.4,'detail');}}if(vis)fin(σ);}
function column([u,v]){rod(LW([u,v,-56]),LW([u,v,56]),1.4,'brass');for(const t of[-38,-14,14,38])rod(LW([u,v,t-.9]),LW([u,v,t+.9]),2.1,'brass');if(!v)rod(LW([u-2.2*Math.sign(u),0,0]),LW([u+2.2*Math.sign(u),0,0]),2.6,'brass');}
function highlight(σ){
const s=sil(σ),sp=s.pts.map(LS);let i0=0;sp.forEach((p,i)=>{if(p[0]<sp[i0][0])i0=i;});
for(const[off,al,k,wd]of[[0,.34,.95,1.7],[Math.PI,.2,.6,.8]]){const pts=[];for(let j=-8;j<=8;j++){const q0=s.pts[(i0+j+(off?20:0)+40)%40],q=[q0[0]/RQ,q0[1]/RQ,(q0[2]-σ*CQ)/LQ],h=add(mul(q,Math.cos(al)),mul(s.wq,Math.sin(al))),p=[RQ*h[0],RQ*h[1],LQ*h[2]+σ*CQ];if(σ*p[2]<=TQ-3&&σ*p[2]>=2)pts.push(LS(p));}
if(pts.length>2)el('path',{d:'M'+pts.slice(0,Math.ceil(pts.length*k)).map(p=>p.map(f2).join(',')).join('L'),class:off?'shine dim':'shine','stroke-width':wd});}
}
function drawFrame(){
cs=Math.cos(ph);sn=Math.sin(ph);HG.replaceChildren();into(HG);
const front=σ=>σ*(cs-sn)>0,bk=front(1)?-1:1,G=[1,-1].map(glassPts),order=cs-sn>0?[1,0]:[0,1];
glp.forEach((p,i)=>set(p,'d',pd(G[i])));
cap(bk);for(const c of COL)if(c[0]+c[1]*(cs+sn)<0)column(c);
for(const i of order)el('path',{d:pd(G[i]),class:'env'});
for(const i of order)sandL.appendChild(SB[i].g);HG.appendChild(sandL);HG.appendChild(strL);
for(const i of order){el('path',{d:pd(G[i]),class:'film'});el('path',{d:pd(G[i]),class:'rim','clip-path':'url(#gl)'});}
for(const i of order)highlight(i?-1:1);
const ca=rod(LW([0,0,-3]),LW([0,0,3]),4.6,'brass');circle(ca,0,0,3,'detail');
for(const c of COL)if(c[0]+c[1]*(cs+sn)>=0)column(c);
cap(-bk);for(const i of[0,1])el('path',{d:pd(G[i]),class:'focus-ring'});
into(draw);dirty=1;
}
// Sand: body + level surface in each bulb; near upright a crater drains above and a cone piles below.
let dirty=1,lastSand='';
function drawSand(t,flow){
const U=clamp((Math.abs(cs)-.94)/.06),tσ=cs>0?1:-1,fr=[sA,1-sA];let apex=null,bot=null;
for(const k of[0,1]){
const σ=k?-1:1,F=fr[k],E=SB[k];
if(F<.004){for(const n of[E.body,E.surf,E.a,E.b])set(n,'d','');continue;}
const s=sandPts(σ,F*FILL),c2=P(...s.c);
const rp=s.rw*Math.cbrt(clamp(F/.12)),only=σ!==tσ&&U>.01&&rp<s.rw*.97;
set(E.body,'d',only?'':pd(hull(s.body.map(LS))));set(E.surf,'d',only?'':pd(s.surf.map(LS)));
if(σ===tσ&&U>0){const rc=s.rw*.74*U,Dc=Math.min(.64*rc,s.c[2]-86)*U,rx=rc*1.2247,ry=rc*.7071,L=f2(c2[0]-rx)+','+f2(c2[1]),R=f2(c2[0]+rx)+','+f2(c2[1]),A=f2(c2[0])+','+f2(c2[1]+Dc);
set(E.a,'class','pitw');set(E.a,'d',`M${L}A${f2(rx)},${f2(ry)} 0 0 1 ${R}L${A}Z`);set(E.b,'class','sandl');set(E.b,'d',`M${L}A${f2(rx)},${f2(ry)} 0 0 0 ${R}L${A}Z`);}
else if(σ!==tσ&&U>0){const Hp=Math.max(0,Math.min(rp,81.5-s.c[2]))*U,a3=P(s.c[0],s.c[1],s.c[2]+Hp);
set(E.a,'class','pile');set(E.a,'d',pd(hull([...ring(28,a=>P(s.c[0]+rp*Math.cos(a),s.c[1]+rp*Math.sin(a),s.c[2])),a3])));set(E.b,'class','pit');set(E.b,'d',Hp>.5?`M${f2(a3[0]-1.3)},${f2(a3[1]+.2)}a1.3,.6 0 1 0 2.6,0a1.3,.6 0 1 0 -2.6,0Z`:'');apex=a3;}
else{set(E.a,'d','');set(E.b,'d','');}
if(σ!==tσ)bot=c2;
}
const show=flow&&U>.5;
if(show){const e0=LS([0,0,-3*tσ]),e1=apex||bot||LS([0,0,-tσ*TQ]),d=`M${f2(e0[0])},${f2(e0[1])}L${f2(e0[0])},${f2(e1[1])}`;set(strA,'d',flow>0?d:'');set(strB,'d',d);set(strB,'stroke-dasharray',flow>0?'1.1 1.3':'.8 7');set(strB,'stroke-dashoffset',f2(reduced.matches?0:-t*(flow>0?.034:.022)));}
else{set(strA,'d','');set(strB,'d','');}
}
drawFrame();
post(86,1);
frame([[6,16,0,98,38,17],[31,11,23,48,48,127],[20,31,17,70,8,84]],12);
// State: indeterminate loop, determinate progress, finishing; the cradle turns the glass about x.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),keys={};
const FLOW=12,dark=matchMedia('(prefers-color-scheme: dark)');let haloA=.34;const hz=()=>{haloA=dark.matches?.55:.34;};hz();dark.addEventListener?.('change',hz);
let sA=.44,mode='ind',target=.25,done=0,turns=1,flip=null,now=performance.now(),lt=0,lastUI=-1,glow=0,flowing=1,ac=null;
const topA=()=>cs>0,topF=()=>topA()?sA:1-sA,setTop=v=>{sA=topA()?v:1-v;},say=m=>{announcement.textContent=m;};
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac)ac=new A();if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,v,d,at=0,type='sine'){if(!ac)return;try{const t=ac.currentTime+at,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.05);}catch(_){}}
// after: the share of sand the bulb now on top should hold once it lands at the bottom.
function turn(after){
if(flip)return;const a1=topA()?after:1-after;
if(reduced.matches){ph+=Math.PI;sA=a1;drawFrame();landed();return;}
flip={t0:now,p0:ph,a0:sA,a1};
}
function landed(){tone(150,.012,.08,0,'triangle');if(done===2){done=3;glow=reduced.matches?1:glow;tone(1318.5,.02,2.6,.05);tone(1975.5,.012,2.2,.2);tone(2637,.006,1.6,.32);say('Complete. The glass has run out and come to rest.');}sync();}
function flipKey(){audio();if(flip||done===1||done===2)return;turn(done?1:mode==='det'?target:topF());say('Turning the glass over.');}
function finish(){audio();if(done)return;done=1;if(reduced.matches){setTop(0);done=2;landed();return;}say('Finishing: the last sand runs through.');sync();}
function setProgress(p){done=0;if(p==null||!isFinite(p)){mode='ind';}else{mode='det';target=clamp(+p);}sync();}
function stepKey(){audio();setProgress(mode==='det'&&!done?(target>=1?0:Math.min(1,Math.floor(target*4+1e-6)/4+.25)):.25);say(`Progress ${Math.round(target*100)} percent.`);}
function indKey(){audio();if(mode==='ind'&&!done){setProgress(Math.round((1-topF())*100)/100);say(`Determinate at ${Math.round(target*100)} percent.`);}else{setProgress(null);say('Indeterminate: the glass runs and turns by itself.');}}
window.figure={setProgress,done:finish};
function sync(){set(keys.i,'aria-pressed',mode==='ind'&&!done);lastUI=-1;}
bind(HG,flipKey);
const act={f:flipKey,p:stepKey,i:indKey,enter:finish};
document.querySelectorAll('.hint [data-k]').forEach(b=>{keys[b.dataset.k]=b;b.addEventListener('click',()=>act[b.dataset.k]());});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const k=e.key.toLowerCase();if((k==='enter'||k===' ')&&e.target.closest&&e.target.closest('button,[role=button]'))return;if(act[k]){e.preventDefault();act[k]();}});
const pct=()=>done>1?100:Math.round((flip?(mode==='det'?target:1-topF()):1-topF())*100);
function digits(s,t){WH.forEach((w,i)=>{const c=s[i];if(c===w.v)return;if(w.t<0){w.n=c;w.t=t;set(w.b,'y',10.85);w.b.textContent=c;}});
WH.forEach(w=>{if(w.t<0)return;const k=reduced.matches?1:clamp((t-w.t)/260);set(w.g,'transform',`translate(0 ${f2(-5*ease(k))})`);if(k>=1){w.v=w.n;w.a.textContent=w.n;set(w.g,'transform','');w.t=-1;}});}
function ui(){
const tf=topF();
readout.textContent=done===3?'PROGRESS 100% · COMPLETE':mode==='det'||done?`PROGRESS ${pct()}%`:`TURN ${turns+(flip?1:0)} · ${flip?FLOW:Math.ceil(tf*FLOW-.01)} S LEFT`;
stateLabel.textContent=done===3?'COMPLETE · SAND AT REST':done?(flip?'FINISHING · FINAL TURN':'FINISHING · RUNNING THROUGH'):flip?(mode==='ind'?'INDETERMINATE · TURNING OVER':'RESETTING · TURNING OVER'):mode==='ind'?'INDETERMINATE · SAND RUNNING':flowing>0?`SETTLING TO ${Math.round(target*100)}%`:'WAITING · TRICKLE';
lastUI=now;
}
function tick(t){
const dt=Math.min(.05,(t-(lt||t))/1000),red=reduced.matches;lt=now=t;let flow=0;
if(flip){
const k=(t-flip.t0)/1600,e=k<1?(k<.5?4*k*k*k:1-(-2*k+2)**3/2):1+.02*Math.sin((k-1)*21)*Math.max(0,1-(k-1)/.32);
ph=flip.p0+Math.PI*e;sA=flip.a0+(flip.a1-flip.a0)*ease(clamp((k-.52)/.62));flow=flip.a0!==flip.a1&&k>.84&&k<1.12?1:0;
drawFrame();if(k>=1.32){ph=flip.p0+Math.PI;sA=flip.a1;flip=null;drawFrame();if(mode==='ind'&&!done)turns++;landed();}
}else{
const tf=topF(),bt=1-tf;
if(done===1){const d=red?tf:Math.min(tf,dt/1.1);setTop(tf-d);flow=1;if(tf-d<=1e-4){done=2;turn(1);}}
else if(done===3)flow=0;
else if(mode==='ind'){flow=1;if(!red){const d=Math.min(tf,dt/FLOW);setTop(tf-d);if(tf-d<=1e-4){flow=0;turn(0);}}}
else if(target<bt-.01)turn(target);
else if(target>bt+.0005){const d=red?target-bt:Math.min(target-bt,dt*Math.max(1/FLOW,(target-bt)*1.6));setTop(tf-d);flow=1;}
else flow=-1;
}
flowing=flow;
glow+=((done===3?1:0)-glow)*(red?1:clamp(dt*2.2));halo.style.opacity=f2(glow*haloA);set(jewel,'class',glow>.5?'jewel on':'jewel');
const key=[sA.toFixed(4),ph.toFixed(4),flow].join();if(dirty||key!==lastSand||flow&&!red){lastSand=key;dirty=0;drawSand(t,flow);}
digits(String(done||mode==='det'?pct():turns%1000).padStart(3,'0'),t);
if(lastUI<0||t-lastUI>150)ui();
requestAnimationFrame(tick);
}
sync();ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['f', 'p', 'i', 'enter'], draw }
