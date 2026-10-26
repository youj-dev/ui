// @ts-nocheck
/* KARVELL S–5 · Acoustic drum kit. Drawn for this kit on the shared engine, in the manner of the lab files: its stylesheet,
 * defs and script. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--recess:#9d9d99;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--chrome:#d9dad8;--chrome-top:#f4f4f2;--chrome-side:#bdbebc;--shell:#a8232c;--shell-top:#c63a42;--shell-side:#7a1820;--inlay:#f1e6cf;--head:#f1ede2;--head-top:#fbf9f2;--reso:#2a2a29;--port:#0e0e0e;--plate:#efe4c8;--plate-ink:#5b1a1f;--bronze:#cf9d48;--bronze-top:#e9c272;--bronze-side:#a2742c;--stand:#2e2e2d;--pedal:#a5a5a2;--seat:#2b2b2a;--seat-top:#46453f;--rug:#e6dfd0;--rug-side:#cfc6b4;--rug-band:#d7b9a1;--rug-line:#d6ccb9;--felt:#b33a3a;--wood:#dcb47c;--gloss:.65;--shade:.26}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--recess:#6e6e6c;--line:#444443;--chrome:#b7b7b6;--chrome-top:#e4e4e2;--chrome-side:#858585;--shell:#8d1c23;--shell-top:#b9363d;--shell-side:#540d13;--inlay:#cbc2ae;--head:#cac8c1;--head-top:#ebe9e2;--reso:#222221;--port:#080808;--plate:#c9c0a8;--plate-ink:#4a1418;--bronze:#ae843b;--bronze-top:#dab56a;--bronze-side:#71501c;--stand:#252524;--pedal:#7c7c7a;--seat:#383733;--seat-top:#5c5a54;--rug:#3d3a35;--rug-side:#2a2825;--rug-band:#4e3f35;--rug-line:#4a463f;--felt:#962f2f;--wood:#b99768;--gloss:.5;--shade:.34}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.shell{fill:var(--shell)}.top.shell{fill:var(--shell-top)}.side.shell{fill:var(--shell-side)}.head{fill:var(--head-top)}.inside{fill:var(--shell-side)}.reso{fill:url(#resoG)}.port{fill:var(--port)}.plate{fill:var(--plate)}
.bronze{fill:var(--bronze)}.top.bronze{fill:var(--bronze-top)}.side.bronze{fill:var(--bronze-side)}.disk{fill:url(#bronzeG)}.stand{fill:var(--stand)}.pedal{fill:var(--pedal)}.seat{fill:var(--seat)}.cushion{fill:url(#seatG)}.felt{fill:var(--felt)}.wood{fill:var(--wood)}
.rug{fill:var(--rug)}.side.rug{fill:var(--rug-side)}.band{fill:var(--rug-band);stroke:none}.weave{fill:none;stroke:var(--rug-line);stroke-width:.8;vector-effect:non-scaling-stroke}.inlay{fill:none;stroke:var(--inlay);stroke-width:1.1;vector-effect:non-scaling-stroke;stroke-linecap:round}
.gloss{fill:#fff;opacity:calc(var(--gloss)*.32);pointer-events:none}.glint{fill:#fff;opacity:var(--gloss);pointer-events:none}.dark{fill:#000;opacity:var(--shade);pointer-events:none}.hi{fill:none;stroke:#fff;stroke-width:.7;stroke-linecap:round;opacity:.8;vector-effect:non-scaling-stroke;pointer-events:none}.sheen{fill:#fff;pointer-events:none}.lathe{fill:none;stroke:var(--bronze-side);stroke-width:.4;vector-effect:non-scaling-stroke;opacity:.75;pointer-events:none}
.ring{fill:none;stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke;opacity:.4}.dimple{fill:#000;opacity:0;pointer-events:none}.ripple{fill:none;stroke:var(--line);stroke-width:.7;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.ripple.lt{stroke:#fff}
.logo{fill:var(--plate-ink);font:italic 700 4.6px Georgia,'Times New Roman',serif;letter-spacing:.15px;text-anchor:middle;stroke:none}
.control{cursor:pointer;outline:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="bronzeG" cx=".5" cy=".5" r=".62" fx=".38" fy=".3"><stop offset="0" style="stop-color:var(--bronze-top)"/><stop offset=".55" style="stop-color:var(--bronze)"/><stop offset="1" style="stop-color:var(--bronze-side)"/></radialGradient>
<radialGradient id="resoG" cx=".5" cy=".5" r=".62" fx=".32" fy=".28"><stop offset="0" stop-color="#55544f"/><stop offset=".55" style="stop-color:var(--reso)"/><stop offset="1" stop-color="#101010"/></radialGradient>
<radialGradient id="seatG" cx=".5" cy=".5" r=".62" fx=".36" fy=".3"><stop offset="0" style="stop-color:var(--seat-top)"/><stop offset="1" style="stop-color:var(--seat)"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* KARVELL S–5 acoustic drum kit, seen from the audience's side. World: x lower-right (the drummer's right); y lower-left
(toward the audience: the kick's logo head faces +y); z up. 1 unit ≈ 1 cm.
Part                        x      y      z      size
rug (round, woven)        −16    −36      0     r 88 × .8, border band r 79–86.6
hi-hat                    −62    −46     84     r 17.6 pair on a pedal stand; the top one rides the pull rod (+4.6 open)
stool                       8    −96     45     seat r 15.5 × 8 on a column and tripod
snare                     −28    −52     46     r 17.6 × 13, tilted to the drummer, on a basket stand
crash                     −66      0    117     r 22.5 on a straight stand, tilted to the drummer
kick pedal                  0    −58…−20   0     footboard, posts, beater (r 2.4 felt) on its axle at z 16
floor tom                  50    −50     14     r 20 × 34 on three legs, a pair of sticks across its hoop
kick                        0    −19…19  28.2   r 26.5 × 38, wood hoops r 28.2, lugs by each hoop with rods and claws; front head with the plate and a port
rack toms             −14/16     −6    61/60    r 12.2 × 16 / r 14.4 × 18 on the kick's holder, tilted to the drummer
ride                       42    −24     99     r 25 on a boom stand from (54, −4)
Heads dip and ring; cymbals wobble on their felts; the hi-hat opens and closes; the beater swings. */
const draw=document.getElementById('drawing');let root=draw;
const{P,set,el,group,circle,text,frame}=kit(()=>root);
// Figure helpers: vectors, oriented planes, projected rings and bands, tubes (the vault's), controls.
const{cos,sin,PI,abs,hypot,atan2}=Math,RAD=PI/180,f2=v=>{const t=(+v).toFixed(2);return t==='-0.00'?'0.00':t;},VW=[1,1,1],into=g=>root=g,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(hypot(...a)||1));
const plane=(o,U,V)=>`matrix(${[...P(...U),...P(...V),...P(...o)].map(f2).join(' ')})`;
function axes(n){n=unit(n);const U=unit(abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U);const a=P(...U),b=P(...V);if(a[0]*b[1]-a[1]*b[0]<0)V=mul(V,-1);return[U,V];}
// Rings are drawn as projected points, not circles in a plane, so the drawing's box stays its own size.
const ring=(c,U,V,r,a0=0,a1=360,n=40)=>{const q=[];for(let i=0;i<=n;i++){const a=(a0+(a1-a0)*i/n)*RAD;q.push(add(c,add(mul(U,r*cos(a)),mul(V,r*sin(a)))));}return q;};
const path=(pts,close=true)=>pts.map((p,i)=>{const q=P(...p);return(i?'L':'M')+f2(q[0])+','+f2(q[1]);}).join('')+(close?'Z':'');
// A cylinder's silhouette: the far half of one end ring, the near half of the other, and the tangents between.
function hull(c,c1,U,V,r){const pu=P(...U),pv=P(...V),p0=P(...c),p1=P(...c1),l=hypot(p1[0]-p0[0],p1[1]-p0[1])||1,dx=(p1[0]-p0[0])/l,dy=(p1[1]-p0[1])/l,f0=atan2(pv[0]*-dy+pv[1]*dx,pu[0]*-dy+pu[1]*dx)/RAD,m=(f0+90)*RAD,a0=(cos(m)*pu[0]+sin(m)*pv[0])*dx+(cos(m)*pu[1]+sin(m)*pv[1])*dy<0?f0:f0+180;
return path([...ring(c,U,V,r,a0,a0+180,24),...ring(c1,U,V,r,a0+180,a0+360,24)]);}
// A band round a cylinder's surface between two angles, from c to c1: gloss, shade, the front of a hoop.
const band=(c,c1,U,V,r,a0,a1,cls,g)=>el('path',{d:path([...ring(c,U,V,r,a0,a1,8),...ring(c1,U,V,r,a1,a0,8)]),class:cls},g);
const LT=unit([-.22,.55,.8]),HV=unit(add(unit(VW),LT));
function shine(a,b,r,g){const p=P(...a),q=P(...b),dx=q[0]-p[0],dy=q[1]-p[1],l=hypot(dx,dy)||1;let nx=-dy/l,ny=dx/l;if(nx+ny>0){nx=-nx;ny=-ny;}const o=r*.45;el('path',{d:`M${f2(p[0]+nx*o)},${f2(p[1]+ny*o)}L${f2(q[0]+nx*o)},${f2(q[1]+ny*o)}`,class:'hi'},g);}
// A thin tube is a capsule on the drawing plane (a plane through an axis that runs along the view would fold flat).
function rod(n,a,b,r){const p=P(...a),q=P(...b),dx=q[0]-p[0],dy=q[1]-p[1],l=hypot(dx,dy)||1e-6,nx=-dy/l*r,ny=dx/l*r;set(n,'d',`M${f2(p[0]+nx)},${f2(p[1]+ny)}L${f2(q[0]+nx)},${f2(q[1]+ny)}A${r},${r} 0 0 0 ${f2(q[0]-nx)},${f2(q[1]-ny)}L${f2(p[0]-nx)},${f2(p[1]-ny)}A${r},${r} 0 0 0 ${f2(p[0]+nx)},${f2(p[1]+ny)}Z`);}
function tube(a,b,r,cls,cap,g){const n=el('path',{class:'face '+cls},g);if(r<=3){rod(n,a,b,r);if(cls==='chrome'&&r>=.6)shine(a,b,r,g);return n;}const[U,V]=axes(sub(b,a));set(n,'d',hull(a,b,U,V,r));if(cap)el('path',{d:path(ring(dot(sub(b,a),VW)>0?b:a,U,V,r)),class:'face top '+cls},g);return n;}
function foot(x,y){const q=P(x,y,.6);el('ellipse',{cx:f2(q[0]),cy:f2(q[1]),rx:2,ry:1.15,class:'face stand'});}
// A stand: tripod legs (the far ones behind the tube), a collar, the tube.
function stand(x,y,hub,reach,rot,top,r=1.2){const feet=[0,120,240].map(a=>[x+reach*cos((a+rot)*RAD),y+reach*sin((a+rot)*RAD),0]),far=f=>f[0]+f[1]<x+y,leg=f=>{tube([x,y,hub],add(f,[0,0,1.4]),.6,'chrome');foot(f[0],f[1]);};
feet.filter(far).forEach(leg);tube([x,y,hub-6],[x,y,top],r,'chrome',true);tube([x,y,hub-1.6],[x,y,hub+1.6],r+.8,'chrome',true);feet.filter(f=>!far(f)).forEach(leg);}
const ctl=(g,label)=>{for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0','aria-label':label}))set(g,k,v);return g;};
function bind(g,fn){g.addEventListener('click',()=>fn());g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
const floorRing=(x,y,a,b,z=.9)=>ring([x,y,z],[1,0,0],[0,b/a,0],a);

// A drum: its shell (lacquer or chrome) with gloss and shade, lugs, hoop fronts, and its head on a group that dips.
function drum(o){const{c,n,h,r}=o,c1=add(c,mul(n,h)),[U,V]=axes(n),hw=o.hw||1.8,hr=r+(o.hd||.9),hoop=o.hoop||'chrome',g=o.g||ctl(el('g',{}),o.label),sh=el('g',{},g);into(sh);
const fv=atan2(dot(VW,V),dot(VW,U))/RAD,fh=atan2(dot(HV,V),dot(HV,U))/RAD,off=a=>abs(((a-fh)%360+540)%360-180),fe=off(fv+90)>off(fv-90)?fv+90:fv-90;
const HOOPS=[[add(c,mul(n,-.5)),add(c,mul(n,hw-.5))],[add(c1,mul(n,-hw)),add(c1,mul(n,.4))]];for(const[a,b]of HOOPS)tube(a,b,hr,hoop);
tube(c,c1,r,o.fin||'shell');
band(c,c1,U,V,r,fe,fe+(fe>fv?-42:42),'dark');band(c,c1,U,V,r,fh-28,fh+28,'gloss');band(c,c1,U,V,r,fh-5,fh+5,'glint');
const claws=[];for(let k=0;k<(o.lugs||0);k++){const a=(k+.5)/o.lugs*2*PI,w=add(mul(U,cos(a)),mul(V,sin(a)));if(dot(w,VW)<.45)continue;const s=add(c,mul(w,r+.55)),l=Math.min(h*.13,3.4),on=(d,e=r+.55)=>add(c,add(mul(n,d),mul(w,e)));
if(!o.rods){tube(add(s,mul(n,h/2-l)),add(s,mul(n,h/2+l)),.95,'chrome');continue;}
// A bass drum's lugs sit by each hoop, their tension rods running out to claws over the hoops.
for(const[m,e,f]of[[h*.24,hw-.5,hw+1.2],[h*.76,h-hw,h-hw-1.7]]){tube(on(m-2.2),on(m+2.2),1,'chrome');tube(on(m+(e>m?-2.2:2.2)),on(e),.42,'chrome');claws.push([on(e,hr+.2),on(f,hr+.2)]);}}
for(const[a,b]of HOOPS){band(a,b,U,V,hr,fv-90,fv+90,'face '+hoop);if(o.inlay)el('path',{d:path(ring(add(a,mul(n,hw/2)),U,V,hr,fv-84,fv+84,24),false),class:'inlay'});}
for(const[a,b]of claws)tube(a,b,.8,'chrome');
const tp=add(c1,mul(n,.4)),pl=plane(tp,U,V);el('path',{d:path(ring(add(c1,mul(n,-1.4)),U,V,r)),class:'face inside'});
const dip=el('g',{},sh),hd=group(pl,dip);circle(hd,0,0,r-.1,'face '+(o.head||'head'));if(!o.g)circle(hd,0,0,r*.9,'ring');
const dim=circle(hd,0,0,r*.5,'dimple'),rips=[0,1].map(()=>circle(hd,0,0,1,'ripple'+(o.head?' lt':'')));
el('path',{d:path(ring(tp,U,V,hr))+path(ring(tp,U,V,r-.7)),'fill-rule':'evenodd',class:'face top '+hoop},sh);
if(o.inlay)el('path',{d:path(ring(tp,U,V,hr-.85)),class:'inlay'},sh);
el('path',{d:path(ring(tp,U,V,hr+2.2)),class:'focus-ring'},g);into(draw);
return{g,sh,dip,hd,dim,rips,r,pn:P(...n),x:0,v:0,rt:-1e9,k:''};}

// A cymbal: a bronze disk on its pivot, drawn as projected outlines (edge, disk, lathe rings, sheen, bell, felt) and
// posed again as it wobbles. k is the cone: the edge sits k along its axis from the bell (negative: edge down).
function cymbal(o){const[U0,V0]=axes(o.n0),g=o.g,cy={...o,U0,V0,a:[0,0],v:[0,0],lift:0,key:''};
cy.rim=el('path',{class:'face side bronze'},g);cy.disk=el('path',{class:'face disk'},g);cy.lathe=el('path',{class:'lathe'},g);cy.sheen=el('path',{class:'sheen'},g);
if(o.bell){cy.bellN=el('path',{class:'face top bronze'},g);cy.nut=el('path',{class:'face felt'},g);}if(o.ring)cy.ringN=el('path',{class:'focus-ring'},g);
cy.e0=dot(unit(o.n0),HV);pose(cy);return cy;}
function pose(cy){const n=unit(add(cy.n0,add(mul(cy.U0,cy.a[0]),mul(cy.V0,cy.a[1])))),c=add(cy.c,[0,0,cy.lift]),key=[...n,c[2]].map(v=>v.toFixed(4)).join();if(key===cy.key)return;cy.key=key;
const[U,V]=axes(n),R=cy.R,at=(rho,dz=0)=>add(c,mul(n,cy.k*rho/R+dz));
set(cy.rim,'d',path(ring(at(R,-.8),U,V,R)));set(cy.disk,'d',path(ring(at(R),U,V,R)));
set(cy.lathe,'d',[.4,.56,.71,.85].map(f=>path(ring(at(R*f),U,V,R*f,0,360,30))).join(''));
const fh=atan2(dot(HV,V),dot(HV,U))/RAD,wedge=(a,w)=>path([...ring(at(R*.24,.5),U,V,R*.24,a-w*1.8,a+w*1.8,3),...ring(at(R*.96),U,V,R*.96,a+w,a-w,4)]);
set(cy.sheen,'d',wedge(fh,6)+wedge(fh+180,3.5));cy.sheen.style.opacity=f2(clamp(.42+7*(dot(n,HV)-cy.e0),.12,.9));
if(cy.bellN){set(cy.bellN,'d',path(ring(at(0,1.1),U,V,R*.2,0,360,28)));set(cy.nut,'d',path(ring(at(0,2.6),U,V,1.7,0,360,16)));}
if(cy.ringN)set(cy.ringN,'d',path(ring(at(R),U,V,R+2.4)));}

// The rug: its edge, the woven field and border band; the soft shadows the kit casts on it.
const RC=[-16,-36],RR=88,rugAt=(r,z=.8)=>ring([RC[0],RC[1],z],[1,0,0],[0,1,0],r,0,360,64);
el('path',{d:path([...ring([RC[0],RC[1],.8],[1,0,0],[0,1,0],RR,-45,135,40),...ring([RC[0],RC[1],0],[1,0,0],[0,1,0],RR,135,-45,40)]),class:'face side rug'});
el('path',{d:path(rugAt(RR)),class:'face rug'});
el('path',{d:path(rugAt(RR-1.4))+path(rugAt(RR-9)),'fill-rule':'evenodd',class:'band'});
el('path',{d:[RR-12,RR-25,RR-40,RR-56].map(r=>path(rugAt(r))).join(''),class:'weave'});
el('path',{d:path(floorRing(-10,-38,64,50)),class:'shadow stage-floor'});el('path',{d:path(floorRing(-10,-38,64,50)),class:'stage-contact'});
for(const[x,y,a,b]of[[2,0,24,34],[52,-48,23,23],[10,-94,15,15],[-26,-50,14,14],[-62,-46,11,11],[-66,0,8,8]])el('path',{d:path(floorRing(x,y,a,b,.95)),class:'shadow'});

// The hi-hat: its pedal and stand, the pull rod, the bottom cymbal and the top one on the clutch.
const hatG=ctl(el('g',{}),'Hi-hat (H, or O to open it)');into(hatG);
const HX=-62,HY=-46,hatBoard=el('path',{class:'face pedal'}),hatTread=el('path',{class:'face stand'});
stand(HX,HY,20,16,-20,80);
const HB=cymbal({g:el('g',{}),c:[HX,HY,84],n0:[.03,.06,1],R:17.6,k:1}),hatRod=el('path',{class:'face chrome'}),HT=cymbal({g:el('g',{}),c:[HX,HY,86.8],n0:[0,0,1],R:17.6,k:-1.8,bell:1,ring:1}),HAT=[HB,HT];
const rodTop=el('path',{class:'face chrome'}),clutch=el('g',{});into(clutch);tube([HX,HY,89.4],[HX,HY,92.4],1.5,'chrome',true);into(draw);
// The stool: tripod, column, padded seat. A click on it starts or stops the groove.
const stool=ctl(el('g',{}),'Drum stool: play or stop the groove (Space)');into(stool);
stand(8,-96,17,18,30,45,1.7);{const c=[8,-96,45],n=[0,0,1],[U,V]=axes(n),c1=[8,-96,53];tube(c,c1,15.5,'seat');band(c,c1,U,V,15.5,-26,26,'gloss');
el('path',{d:path(ring(c1,U,V,15.5)),class:'face cushion'});el('path',{d:path(ring(c1,U,V,14.6)),class:'ring'});el('path',{d:path(ring(c1,U,V,17.6)),class:'focus-ring'});}
into(draw);
// The snare on its basket stand: a chrome shell.
stand(-28,-52,14,15,10,42);for(const a of[40,160,280])tube([-28,-52,42],[-28+12*cos(a*RAD),-52+12*sin(a*RAD),46.6],.5,'chrome');
const SN=drum({c:[-28,-52,46],n:unit([.05,-.12,1]),h:13,r:17.6,lugs:8,label:'Snare drum (S)'});
// The crash on its stand.
const crashG=ctl(el('g',{}),'Crash cymbal (C)');into(crashG);stand(-66,0,22,18,0,112);tube([-66,0,112],[-66,0,117],.55,'chrome');
const CR=cymbal({g:el('g',{}),c:[-66,0,117],n0:[.16,-.21,1],R:22.5,k:-2.4,bell:1,ring:1});into(draw);
// The kick: its pedal behind it, the far spur, the drum, the near spur. The beater swings on its axle.
const kickG=ctl(el('g',{}),'Kick drum (K)');into(kickG);
const board=el('path',{class:'face pedal'}),tread=el('path',{class:'face stand'});
for(const x of[-6,6])tube([x,-25,0],[x,-25,19],.9,'chrome',true);tube([-6,-25,16],[6,-25,16],.6,'chrome');
const shaft=el('path',{class:'face chrome'}),ball=el('ellipse',{rx:2.6,ry:2.6,class:'face felt'});
into(kickG);tube([-25,8,13],[-37,15,1.2],.8,'chrome');foot(-37,15);
const KK=drum({g:kickG,c:[0,-19,28.2],n:[0,1,0],h:38,r:26.5,hd:1.7,hw:3.6,hoop:'shell',inlay:1,lugs:10,rods:1,head:'reso'});
// The front head's plane runs right to left and upward; the plate and port are drawn the right way round in it.
const LG=el('g',{},KK.hd);set(LG,'transform','matrix(-1 0 0 -1 0 0)');circle(LG,9.5,9,5.1,'face chrome');circle(LG,9.5,9,4.2,'face port');
el('ellipse',{cx:0,cy:-5,rx:9.6,ry:4.4,class:'face plate'},LG);el('ellipse',{cx:0,cy:-5,rx:8.6,ry:3.5,class:'ring'},LG);text(LG,0,-3.4,'Karvell','logo');
into(kickG);tube([25,8,13],[37,15,1.2],.8,'chrome');foot(37,15);into(draw);
// The floor tom on its legs (the far ones first).
const FT_LEGS=[40,160,280].map(a=>[cos(a*RAD),sin(a*RAD)]),ftLeg=([u,v])=>{tube([50+u*21.4,-50+v*21.4,40],[50+u*27,-50+v*27,1.2],.75,'chrome');foot(50+u*27,-50+v*27);};
FT_LEGS.filter(([u,v])=>u+v<0).forEach(ftLeg);
const FT=drum({c:[50,-50,14],n:[0,0,1],h:34,r:20,lugs:8,label:'Floor tom (F)'});
into(FT.g);FT_LEGS.filter(([u,v])=>u+v>=0).forEach(ftLeg);
// A pair of sticks laid across its hoop: they shake with it.
into(FT.sh);for(const[a,b]of[[[31,-41.5,49.2],[70,-53.5,49.2]],[[30.5,-45.5,49.2],[68.5,-58.5,49.2]]]){const t=add(a,mul(sub(b,a),.84));tube(a,t,.8,'wood');tube(t,b,.5,'wood');}into(draw);
// The rack toms on the kick's holder.
tube([0,-3,56],[0,-3,65],1.2,'chrome',true);
const T1=drum({c:[-14,-6,61.5],n:unit([.12,-.3,.95]),h:16,r:12.2,lugs:6,label:'High tom (T)'});
const T2=drum({c:[16,-6,60],n:unit([-.12,-.3,.95]),h:18,r:14.4,lugs:6,label:'Mid tom (Y)'});
// The ride on its boom stand.
const rideG=ctl(el('g',{}),'Ride cymbal (R)');into(rideG);stand(54,-4,20,16,90,82);tube([54,-4,82],[45,-19,96],.8,'chrome');tube([45,-19,96],[42,-24,99],.55,'chrome');
const RI=cymbal({g:el('g',{}),c:[42,-24,99],n0:[-.1,-.2,1],R:25,k:-2.2,bell:1,ring:1});into(draw);
frame([[RC[0]-RR*.7071,RC[1]+RR*.7071,0,0,0,0],[RC[0]+RR*.7071,RC[1]-RR*.7071,0,0,0,0],[RC[0]+RR*.7071,RC[1]+RR*.7071,0,0,0,0],[-66,0,137,0,0,0]],10);

// State: tempo, the groove's transport, the last hit, the hi-hat; every part's motion. Sound starts on a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const NAME=['KICK','SNARE','HIGH TOM','MID TOM','FLOOR TOM','HI-HAT','OPEN HI-HAT','CRASH','RIDE'],KEYS='kstyfhocr',DR=[SN,T1,T2,FT];
// The groove: an original two-bar pattern written for this kit, in sixteenths (X accent, x plain, g ghost): a
// crash on the top, a hi-hat lift into bar two and a fill down the toms.
const LANE={k:'X.....x.X.......X..x..x...x....x',s:'....X..g....X..g....X....g..X...',h:'..x.X.x.X.x.X...X.x.X.x.X.x.....',o:'..............x.................',c:'X...............................',t:'.............................x..',y:'..............................x.',f:'...............................x'},VEL={X:1,x:.72,g:.3};
const GROOVE=[...Array(32)].map((_,s)=>Object.entries(LANE).filter(([,l])=>l[s]!=='.').map(([k,l])=>[KEYS.indexOf(k),VEL[l[s]]]));
let bpm=96,playing=false,nextS=0,nextT=0,clk='',step=-1,lastHit=-1,hatOpen=false,hatV=0,kickT=-1e9,note='',noteT=0,last=0,outKey='',ac=null,master=null,nb=null,hatAmp=null;
const Q=[],pend=[];
const say=m=>{announcement.textContent=m;},notice=(m,a)=>{note=m;noteT=performance.now()+1300;if(a)say(a);};
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ac=new A();master=ac.createGain();master.gain.value=.5;const cp=ac.createDynamicsCompressor();master.connect(cp);cp.connect(ac.destination);nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
const live=()=>ac&&ac.state==='running',now=()=>live()?ac.currentTime:performance.now()/1000;
function amp(t,v,d,a=.002){const g=ac.createGain();g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(v,t+a);g.gain.exponentialRampToValueAtTime(.0001,t+a+d);g.connect(master);return g;}
function osc(t,type,f0,f1,d,dest,pd=.05){const o=ac.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+pd);o.connect(dest);o.start(t);o.stop(t+d+.05);}
function noise(t,d,dest,type,f,q=1){const s=ac.createBufferSource(),b=ac.createBiquadFilter();s.buffer=nb;b.type=type;b.frequency.value=f;b.Q.value=q;s.connect(b);b.connect(dest);s.start(t,Math.random()*.5,d+.05);}
// Bronze: a cluster of square waves at unrelated pitches, through a band and a high pass.
function metal(t,d,dest,f){const b=ac.createBiquadFilter(),h=ac.createBiquadFilter();b.type='bandpass';b.frequency.value=9200*f;h.type='highpass';h.frequency.value=6400*f;b.connect(h);h.connect(dest);for(const m of[263,401,422,546,587,812]){const o=ac.createOscillator();o.type='square';o.frequency.value=m*f;o.connect(b);o.start(t);o.stop(t+d+.05);}}
function choke(t){if(hatAmp){hatAmp.gain.cancelScheduledValues?.(t);hatAmp.gain.setTargetAtTime(.0001,t,.012);hatAmp=null;}}
function sound(i,v,t){if(!live())return;try{
if(i===0){osc(t,'sine',132,45,.5,amp(t,v,.5),.08);osc(t,'triangle',240,70,.04,amp(t,.32*v,.04),.03);noise(t,.012,amp(t,.3*v,.012),'highpass',2400);}
else if(i===1){osc(t,'triangle',200,172,.12,amp(t,.42*v,.12),.04);noise(t,.2,amp(t,.62*v,.2),'bandpass',2200,.75);noise(t,.14,amp(t,.3*v,.14),'highpass',5600);}
else if(i<5){const f=[0,0,212,165,110][i],d=[0,0,.34,.42,.6][i];osc(t,'sine',f*1.38,f,d,amp(t,.85*v,d),.07);noise(t,.03,amp(t,.16*v,.03),'lowpass',1700);}
else if(i===5){choke(t);noise(t,.05,amp(t,.32*v,.05),'highpass',7600);metal(t,.04,amp(t,.1*v,.04),1);}
else if(i===6){choke(t);hatAmp=amp(t,.26*v,.62);noise(t,.65,hatAmp,'highpass',7000);metal(t,.5,hatAmp,1);}
else if(i===7){noise(t,1.9,amp(t,.42*v,1.9,.003),'highpass',3600);metal(t,1.4,amp(t,.1*v,1.4),1.25);}
else{metal(t,1.5,amp(t,.11*v,1.5),1.6);osc(t,'sine',2900,0,1.2,amp(t,.035*v,1.2));noise(t,.4,amp(t,.06*v,.4),'bandpass',8800,.9);}}catch(_){}}
// A hit: its sound now (or at its time on the audio clock, for the groove), its motion on the next frame (or then).
function hit(i,vel=1,at){if(at===undefined){audio();sound(i,vel,now()+.005);pend.push([i,vel]);}else{sound(i,vel,at);Q.push([at,i,vel,-1]);}}
// What each hit moves: a head dips and rings, the beater swings, a cymbal takes a push, the hi-hat opens or closes.
const impulse=(cy,j,a)=>{cy.v[0]+=j*cos(a*RAD);cy.v[1]+=j*sin(a*RAD);};
function show(i,vel,t){lastHit=i;
if(i===0){KK.v+=48*vel;KK.rt=t;kickT=t;}
else if(i<5){const d=DR[i-1];d.v+=70*vel;d.rt=t;}
else if(i===5||i===6){const open=i===6;hatOpen=open;if(open)impulse(HAT[1],1.6*vel,200);else for(const cy of HAT)impulse(cy,.35*vel,200);}
else impulse(i===7?CR:RI,(i===7?2.8:1.1)*vel,i===7?205:220);}
function groove(){audio();playing=!playing;if(playing){nextS=0;clk='';step=-1;say(`Playing the groove at ${bpm} beats per minute. Up and down arrows change the tempo.`);}else{Q.length=0;step=-1;notice('STOPPED / SPACE PLAYS IT AGAIN','Groove stopped.');}}
function tempo(d){audio();const b=clamp(bpm+d,60,180);if(b===bpm){notice(d>0?'FASTEST · 180 BPM':'SLOWEST · 60 BPM');return;}bpm=b;say(`${bpm} beats per minute.`);}
function schedule(){if(!playing)return;const src=live()?'a':'p';if(src!==clk||nextT<now()-.25){clk=src;nextT=now()+.05;}
while(nextT<now()+.12){const s=nextS;for(const[i,v]of GROOVE[s])hit(i,v,nextT);Q.push([nextT,-1,0,s]);nextS=(s+1)%32;nextT+=60/bpm/4;}}
// Springs, stepped finely: x'' = −w²x − 2zw·x' (+ a turn for a cymbal's wobble, so it precesses as it settles).
const H=1/480;
function spring(o,w,z,dt){for(let s=dt;s>1e-6;s-=H){const h=Math.min(H,s);o.v+=(-w*w*o.x-2*z*w*o.v)*h;o.x+=o.v*h;}if(abs(o.x)<.002&&abs(o.v)<.05){o.x=0;o.v=0;}}
function wobble(cy,w,z,dt){const a=cy.a,v=cy.v;if(!a[0]&&!a[1]&&!v[0]&&!v[1])return;for(let s=dt;s>1e-6;s-=H){const h=Math.min(H,s),ax=-w*w*a[0]-2*z*w*v[0]-.5*w*v[1],ay=-w*w*a[1]-2*z*w*v[1]+.5*w*v[0];v[0]+=ax*h;v[1]+=ay*h;a[0]+=v[0]*h;a[1]+=v[1]*h;}
if(abs(a[0])+abs(a[1])<2e-4&&abs(v[0])+abs(v[1])<4e-3){a[0]=a[1]=v[0]=v[1]=0;}}
function ripple(d,t){d.rips.forEach((c,j)=>{const p=(t-d.rt-j*80)/340,on=p>=0&&p<1;const k=on?f2(p):'';if(c._k===k)return;c._k=k;set(c,'r',on?f2(d.r*(.22+.7*p)):1);c.style.opacity=on?f2((1-p)*.75):0;});}
function head(d,red,t,sign=1){const x=red?0:d.x,px=-d.pn[0]*x*sign,py=-d.pn[1]*x*sign,k=`translate(${f2(px)} ${f2(py)})`;if(k!==d.k){d.k=k;set(d.dip,'transform',k);set(d.sh,'transform',`translate(${f2(px*.22)} ${f2(py*.22)})`);d.dim.style.opacity=f2(clamp(abs(x)/1.2)*.2);}if(red){d.rt=-1e9;}ripple(d,t);}
function beater(t,red){const p=red?1:clamp((t-kickT)/40),q=red?1:clamp((t-kickT-40)/190),a=red?-38:p<1?-38+50*p:12-50*(1-(1-q)**3),b=[0,-25+17*sin(a*RAD),16+17*cos(a*RAD)],key=f2(a);if(key===beater.k)return;beater.k=key;
rod(shaft,[0,-25,16],b,.5);const q2=P(...b);set(ball,'cx',f2(q2[0]));set(ball,'cy',f2(q2[1]));
const toe=7-2.6*(a+38)/50;set(board,'d',path([[-4.5,-58,1.4],[4.5,-58,1.4],[4.5,-30,toe],[-4.5,-30,toe]]));set(tread,'d',path([[-3.5,-52,2.4+(toe-1.4)*.21],[3.5,-52,2.4+(toe-1.4)*.21],[3.5,-34,toe-.6],[-3.5,-34,toe-.6]]));}
// The hi-hat's pull rod and clutch ride with the top cymbal; its pedal's toe rises as it opens.
function hatParts(){const L=HT.lift,k=f2(L);if(k===hatParts.k)return;hatParts.k=k;const toe=2.6+L*.74,z=(y,dz=0)=>1.6+(toe-1.6)*(y-HY+30)/24+dz,quad=(w,y0,y1,dz)=>path([[HX-w,y0,z(y0,dz)],[HX+w,y0,z(y0,dz)],[HX+w,y1,z(y1,dz)],[HX-w,y1,z(y1,dz)]]);
rod(hatRod,[HX,HY,84],[HX,HY,88+L],.5);rod(rodTop,[HX,HY,88+L],[HX,HY,93+L],.5);set(clutch,'transform',`translate(0 ${f2(-L)})`);set(hatBoard,'d',quad(4,HY-30,HY-6,0));set(hatTread,'d',quad(3,HY-26,HY-11,.35));}
function ui(t){const r=`${bpm} BPM · LAST HIT ${lastHit<0?'—':NAME[lastHit]}`,s=t<noteT?note:playing?`GROOVE · BAR ${step<0?1:(step>>4)+1} · BEAT ${step<0?1:((step&15)>>2)+1}`:hatOpen?'HI-HAT OPEN / H CLOSES IT':'READY / SPACE PLAYS THE GROOVE';
if(r+s!==outKey){outKey=r+s;readout.textContent=r;stateLabel.textContent=s;}}
function tick(t){const dt=Math.min(.05,(t-(last||t))/1000),red=reduced.matches;last=t;
schedule();const n=now();while(Q.length&&Q[0][0]<=n){const[,i,vel,s]=Q.shift();if(i<0)step=s;else show(i,vel,t);}
while(pend.length){const[i,vel]=pend.shift();show(i,vel,t);}
for(const d of DR){if(red){d.x=d.v=0;}else spring(d,63,.14,dt);head(d,red,t);}
if(red){KK.x=KK.v=0;}else spring(KK,50,.2,dt);head(KK,red,t,-1);beater(t,red);
const lt=hatOpen?4.6:0;if(red){HAT[1].lift=lt;hatV=0;}else{for(let s=dt;s>1e-6;s-=H){const h=Math.min(H,s);hatV+=(-38*38*(HAT[1].lift-lt)-2*.5*38*hatV)*h;HAT[1].lift+=hatV*h;if(HAT[1].lift<0){HAT[1].lift=0;hatV=Math.abs(hatV)*.18;}}}
for(const[cy,w,z]of[[CR,13.2,.07],[RI,16.3,.08],[HAT[0],24,.2],[HAT[1],hatOpen?20:24,hatOpen?.1:.2]]){if(red){cy.a=[0,0];cy.v=[0,0];}else wobble(cy,w,z,dt);pose(cy);}
hatParts();
ui(performance.now());requestAnimationFrame(tick);}
// Input: the letters hit, Space plays or stops the groove, the arrows set its tempo; every part is a button too.
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.length===1?e.key.toLowerCase():e.key;
if(k==='ArrowUp'||k==='ArrowDown'||k==='ArrowLeft'||k==='ArrowRight'){e.preventDefault();tempo(k==='ArrowUp'?4:k==='ArrowDown'?-4:k==='ArrowRight'?1:-1);return;}
if(e.repeat)return;if(k===' '){if(e.target.closest&&e.target.closest('[role=button]'))return;e.preventDefault();groove();return;}
const i=KEYS.indexOf(k);if(i>=0&&k.length===1){e.preventDefault();hit(i);}});
bind(kickG,()=>hit(0));DR.forEach((d,i)=>bind(d.g,()=>hit(i+1)));bind(hatG,()=>hit(hatOpen?6:5));bind(crashG,()=>hit(7));bind(rideG,()=>hit(8));bind(stool,groove);
hatParts();beater(0,true);ui(performance.now());requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
