// @ts-nocheck
/* VINDRA W–36 · Wind turbine. Drawn for this package in the lab figures' form: its stylesheet, defs and script, on the
 * engine's kit. The script runs on the env, which stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--dk:#3a3a39;--conc:#c9c8c3;--conc-top:#dfdeda;--conc-side:#b3b2ad;--kiosk:#c3cbc0;--kiosk-top:#d9dfd6;--kiosk-side:#a9b2a6;--grass:#b9c493;--grass-top:#cdd6ab;--grass-side:#a5b17f;--tuft:#8f9d68;--gravel:#dcd8ce;--gravel-side:#c4bfb3;--tip:#d9493b;--bcn-off:#8c3a33;--bcn:#ff3b30;--grid:#5b7cff;--air:#7f9db3;--screen:#1c1d1e;--lcd:#8fe0ad;--warm:#ffc35a;--hz:#e9b832;--tk:.205;--air-a:.5}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--dk:#2f2f2f;--conc:#a9a8a5;--conc-top:#d1d0cc;--conc-side:#7d7d7b;--kiosk:#a5aaa3;--kiosk-top:#cbd1c8;--kiosk-side:#797c78;--grass:#9ba57b;--grass-top:#c0c8a0;--grass-side:#747c58;--tuft:#788456;--gravel:#cecac1;--gravel-side:#a4a199;--tip:#b73c30;--bcn-off:#752f29;--grid:#7b95ff;--air:#8fa9bd;--screen:#161717;--line:#444443;--tk:.4;--air-a:.65}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:1.5px ui-monospace,monospace;letter-spacing:.2px;stroke:none}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.dk{fill:var(--dk)}.conc{fill:var(--conc)}.top.conc{fill:var(--conc-top)}.side.conc{fill:var(--conc-side)}.kiosk{fill:var(--kiosk)}.top.kiosk{fill:var(--kiosk-top)}.side.kiosk{fill:var(--kiosk-side)}.gravel,.top.gravel{fill:var(--gravel)}.side.gravel{fill:var(--gravel-side)}
.skin{fill:var(--top)}.tone{fill:#000;stroke:none;pointer-events:none}.spin{fill:url(#spinG)}.tipband{fill:var(--tip);stroke:none;pointer-events:none}.outline{fill:none;stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.seam{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.45}.rod{fill:none;stroke:var(--metal-top);stroke-linecap:round}.rod-u{fill:none;stroke:var(--line);stroke-linecap:round}
.rise{fill:url(#riseS);stroke:var(--line);stroke-width:.8;stroke-opacity:.55;vector-effect:non-scaling-stroke}.plat{fill:url(#riseG);stroke:none}.tuft{fill:none;stroke:var(--tuft);stroke-width:.4;stroke-linecap:round}.path{fill:var(--gravel);stroke:var(--gravel-side);stroke-width:.5;vector-effect:non-scaling-stroke}
.brandp{font:600 1.25px Georgia,'Times New Roman',serif;letter-spacing:.28px;fill:var(--ink);text-anchor:middle;stroke:none}
.air{fill:none;stroke:var(--air);stroke-width:.8;stroke-linecap:round;vector-effect:non-scaling-stroke;stroke-dasharray:26 400;pointer-events:none}.still .air{stroke-dasharray:none}
.flow{fill:none;stroke:var(--grid);stroke-width:.6;stroke-linecap:round;stroke-dasharray:1.3 2.4;opacity:0;filter:url(#glow);pointer-events:none}
.lamp{fill:var(--off);stroke:none}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.g,.lamp.a{filter:url(#glow)}.halo{opacity:0;filter:url(#lampb);pointer-events:none}.halo.g{fill:var(--ok);opacity:.35}.halo.a{fill:var(--warn);opacity:.35}
.bcn{fill:var(--bcn-off);stroke:none}.bcnh{fill:var(--bcn);opacity:0;filter:url(#lampb);pointer-events:none}.seam.ring{opacity:.6}.warm{fill:var(--off);stroke:none}.warmh{fill:var(--warm);opacity:0;filter:url(#lampb);pointer-events:none}
.screen{fill:var(--screen)}.lcd{fill:var(--lcd);font:700 1.25px ui-monospace,monospace;text-anchor:middle;stroke:none}.hz{fill:var(--hz);stroke:var(--dk);stroke-width:.25}.bolt{fill:var(--dk);stroke:none}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
@media(prefers-color-scheme:dark){.bcn.on{fill:var(--bcn);filter:url(#glow)}.bcnh.on{opacity:.5}.warm{fill:var(--warm);filter:url(#glow)}.warmh{opacity:.42}.lcd{filter:url(#glow)}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="spinG" cx=".38" cy=".32" r=".78"><stop offset="0" style="stop-color:var(--top)"/><stop offset=".42" style="stop-color:var(--top)"/><stop offset=".82" style="stop-color:var(--body)"/><stop offset="1" style="stop-color:var(--side)"/></radialGradient>
<radialGradient id="riseG" cx=".46" cy=".42" r=".62"><stop offset="0" style="stop-color:var(--grass-top)"/><stop offset=".7" style="stop-color:var(--grass-top)"/><stop offset="1" style="stop-color:var(--grass)"/></radialGradient>
<filter id="lampb" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="1.3"/></filter>
<linearGradient id="riseS" x2="0" y2="1"><stop offset=".55" style="stop-color:var(--grass)"/><stop offset="1" style="stop-color:var(--grass-side)"/></linearGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* VINDRA W–36. World: x lower-right, y lower-left (front faces look along +y), z up; the tower's axis at (0, 0); 1 unit ≈ 1.1 m.
The head yaws: f runs along the nacelle toward the rotor, s across it.
Part                          x      y      z      w      d      h
ground shadow, grassy rise  centre 5 −1, r 20 × 15.5: a flat top at 2.4 falling away to the floor; tufts
gravel path                 from the stair to the substation's door; the export cable glows along it
substation                   11     −7     2.75   7      5.5    5.1    gravel pad, roof, door, sign, meter, lamp, louvres
plinth, base flange         r 5 / 4 on the axis       2.4      –      –   1.05
tower (tapered steel)       r 3.7 → 2.3               3.45     –      –   76.55   flanges at 28, 52, 70; door on +x, lamp, 07
stair block, steps           3.3   −1.5    2.4    4.1    3.0    1.95   railing
yaw ring                    r 2.5                     80       –      –    0.6
nacelle                     f −11.6…8.4, s ±3.7       80.6     –      –    7.2   seams, brand plate, a louvred tail; cooler on top
met mast, aviation light    f −10.3 / −7 on the cooler; a vane that trails down the wind
rotor                       axis from f 8.4 at z 84.5, tilted up 5°: neck r 2.9, spinner r 3.7 to its nose at 8.6
blades (3)                  r 2.2 → 54 in the rotor plane, 2.35 along the axis; twist 16° → 0°; pitch 0°, 90° feathered
wind                        ribbons along the wind across the rotor's height, either side of the tower, in gusts
Painter: floor, rise, path, substation, back ribbons, [rotor when it faces away], tower, stair, yaw ring, nacelle and its
mast, [rotor when it faces the viewer], front ribbons, controls. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{P,set,el,group,rect,circle,line,text,box,cylinder,slits,wire}=kit(()=>root);
// Figure helpers: vectors, oriented planes, hulls and smooth curves, light, cached writes, lamps and controls.
const draw=root,into=g=>root=g,RAD=Math.PI/180,VIEW=[1,1,1],f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>(t=clamp(t),t*t*(3-2*t));
const add=(a,b,k=1)=>a.map((v,i)=>v+b[i]*k),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const plane=(o,U,V)=>`matrix(${[...P(...U),...P(...V),...P(...o)].map(f2).join(' ')})`,Q=p=>P(...p).map(f2).join(','),pd=q=>'M'+q.map(p=>f2(p[0])+','+f2(p[1])).join('L')+'Z';
function hull(q){q=q.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const p of q){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(let i=q.length;i--;){const p=q[i];while(hi.length>1&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
/* A Catmull-Rom curve through screen points, open or closed. */
function curve(q,close){const n=q.length,g=i=>close?q[(i+n)%n]:q[Math.max(0,Math.min(n-1,i))];let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<(close?n:n-1);i++){const a=g(i-1),b=g(i),c=g(i+1),e=g(i+2);d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return close?d+'Z':d;}
/* How dark a face reads under the studio's key light, from the top left: 0 for a top, ½ for a front (+y), 1 for a side (+x).
 * --tk scales it per scheme, so a tone overlay matches the house's three face fills and turns smoothly in between. */
function tone(n){if(dot(n,VIEW)<0)n=mul(n,-1);const h=Math.hypot(n[0],n[1]);if(h<1e-6)return 0;return clamp(.5+.433*(.985-Math.cos(Math.atan2(n[1],n[0])-100*RAD)),0,1.2)*h*h;}
const op=(n,v)=>{if(n._o!==v){n._o=v;n.style.opacity=v;}},dim=(n,k)=>op(n,`calc(var(--tk) * ${k.toFixed(3)})`),put=(n,k,v)=>{const c=n._a||(n._a={});if(c[k]!==v){c[k]=v;set(n,k,v);}};
function lamp(g,x,y,r,cls='lamp'){const n=circle(g,x,y,r,cls);n._c='';n._b=cls;return n;}
function lit(n,c){if(n._c!==c){n._c=c;set(n,'class',n._b+(c?' '+c:''));}}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
let seed=11;const rnd=()=>(seed=(seed*16807)%2147483647)/2147483647;
// Floor: the house ground shadow; the grassy rise, its flank (the hull of three rings) under a flat, lit top; tufts.
const MC=[5,-1],MR=[20,15.5],G=2.4,rim=a=>1+.05*Math.sin(3*a+.7)+.035*Math.sin(5*a+2.1),rise=(k,a,z)=>[MC[0]+MR[0]*k*rim(a)*Math.cos(a),MC[1]+MR[1]*k*rim(a)*Math.sin(a),z];
const sp=P(MC[0],MC[1],0),SH={cx:f2(sp[0]),cy:f2(sp[1]+2.6),rx:31,ry:12.5};for(const c of['shadow stage-floor','stage-contact'])el('ellipse',{...SH,class:c});
{const ring=(k,z)=>Array.from({length:60},(_,i)=>P(...rise(k,i/60*2*Math.PI,z)));el('path',{d:pd(hull([...ring(1,0),...ring(.87,G*.62),...ring(.74,G)])),class:'rise'});el('path',{d:curve(ring(.74,G),true),class:'plat'});
let d='';for(let i=0;i<26;i++){const a=rnd()*2*Math.PI,k=.42+.52*Math.sqrt(rnd()),p=P(...rise(k,a,k>.74?G*(1-ease((k-.74)/.26)):G)),s=.5+rnd()*.4;if(Math.hypot(p[0]-1,p[1]+2)<8||Math.hypot(p[0]-15,p[1]-1)<8)continue;d+=`M${f2(p[0]-.45*s)},${f2(p[1])}l${f2(.15*s)},${f2(-1*s)}M${f2(p[0]+.4*s)},${f2(p[1])}l${f2(-.1*s)},${f2(-1.3*s)}`;}el('path',{d,class:'tuft'});}
// The gravel path from the stair round to the substation's door, and the export cable glowing along it.
const PATH=[[7.4,0],[9.6,.4],[11.8,.5],[13.6,-.1],[14.5,-.9]];
{const pt=(i,s)=>{const a=PATH[Math.max(0,i-1)],b=PATH[Math.min(PATH.length-1,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1,p=PATH[i];return P(p[0]-dy/l*s,p[1]+dx/l*s,G+.03);};el('path',{d:pd([...PATH.map((_,i)=>pt(i,1)),...PATH.map((_,i)=>pt(i,-1)).reverse()]),class:'path'});}
const flow=el('path',{d:curve(PATH.map(p=>P(p[0],p[1],G+.06))),class:'flow'});
// Substation: a gravel pad, the kiosk and its roof; a door, a sign, the meter and the export lamp in front, louvres on the side.
box(10.3,-7.7,G,8.4,7.2,.35,.4,'gravel');box(11,-7,G+.35,7,5.5,5.1,.8,'kiosk');box(10.6,-7.4,G+5.45,7.8,6.3,.45,.3,'kiosk');
const kf=group(plane([11,-1.5,G+5.45],[1,0,0],[0,0,-1]));rect(kf,2.4,.7,2.2,4.4,.3,'face metal');line(kf,3.5,.9,3.5,4.9,'seam');circle(kf,4.15,2.9,.16,'face top');
el('path',{d:'M1.2,1.15L2,2.5H.4Z',class:'hz'},kf);el('path',{d:'M1.28,1.6L.98,2.1H1.22L1.1,2.4L1.46,1.9H1.2Z',class:'bolt'},kf);
rect(kf,5.15,1,1.5,.95,.2,'face screen');const meter=text(kf,5.9,1.75,'1.8 MW','lcd'),kLamp=lamp(kf,5.9,2.7,.32),kq=P(16.9,-1.5,G+2.75),kHalo=el('circle',{cx:f2(kq[0]),cy:f2(kq[1]),r:1.6,class:'halo'});
slits(group(plane([18,-1.5,G+5.45],[0,-1,0],[0,0,-1])),1,1,3.5,3.6,6,false);
const AIRB=el('g',{}),BACK=el('g',{});
// Plinth, base flange, the tower: tone bands round it for the light, flanges between its sections; the door on +x and its stair.
cylinder(0,0,G,5,.7,'z','conc');cylinder(0,0,G+.7,4,.35,'z','metal');
const TZ0=G+1.05,TZ1=80,TR0=3.7,TR1=2.3,rAt=z=>TR0+(TR1-TR0)*(z-TZ0)/(TZ1-TZ0),at=(r,a,z)=>[r*Math.cos(a*RAD),r*Math.sin(a*RAD),z];
const arc=(r,a1,z,sw)=>`A${f2(r*1.2247)},${f2(r*.7071)} 0 0 ${sw} ${Q(at(r,a1,z))}`,band=(z0,z1,a0,a1,cls)=>el('path',{d:`M${Q(at(rAt(z0),a0,z0))}${arc(rAt(z0),a1,z0,1)}L${Q(at(rAt(z1),a1,z1))}${arc(rAt(z1),a0,z1,0)}Z`,class:cls});
band(TZ0,TZ1,-45,135,'face skin tower');for(let a=-45;a<135;a+=10)dim(band(TZ0,TZ1,a,a+10.4,'tone'),tone([Math.cos((a+5)*RAD),Math.sin((a+5)*RAD),0]));
for(const z of[28,52,70])el('path',{d:`M${Q(at(rAt(z),-45,z))}${arc(rAt(z),135,z,1)}`,class:'seam'});
{const g=group(plane([rAt(7.6)+.04,0,7.6],[0,-1,0],[0,0,-1]));rect(g,-1.05,0,2.1,3.2,.3,'face metal');rect(g,-1.35,-.55,2.7,.5,.2,'face dk');circle(g,.62,1.75,.14,'face top');text(g,0,-1.6,'07','etch center');circle(g,0,-.95,.22,'warm');
const q=P(rAt(8.4),0,8.4);el('circle',{cx:f2(q[0]),cy:f2(q[1]),r:1.7,class:'warmh'});}
box(3.3,-1.5,G,2.6,3,4.35-G,.5,'conc');box(5.9,-1.2,G,.75,2.4,1.3,.3,'conc');box(6.65,-1.2,G,.75,2.4,.65,.3,'conc');
for(const x of[3.9,5.8])wire([[x,1.45,4.35],[x,1.45,5.7]]);wire([[3.9,1.45,5.7],[5.8,1.45,5.7],[7.3,1.3,3.9]]);
cylinder(0,0,TZ1,2.5,.6,'z','metal');
// The head, which yaws. Nacelle and cooler: rounded boxes posed along f and s, each face toned for the light.
/* A rounded box posed along (F, S, up): its five outer faces as rounded rects on their planes, a tone overlay on each, the
 * sides and ends upright so their text reads. Built once; pose() moves it. */
function solid(g,L,W,H,r){return{faces:[['u',1],['f',1],['f',-1],['s',1],['s',-1]].map(([ax,sg])=>{const f=el('g',{},g),w=ax==='f'?W:L,h=ax==='u'?W:H;return{ax,sg,f,w,h,n:rect(f,0,0,w,h,r,'face skin'),t:rect(f,0,0,w,h,r,'tone')};}),
pose(c,F,S){for(const q of this.faces){const N=q.ax==='u'?[0,0,1]:mul(q.ax==='f'?F:S,q.sg),vis=dot(N,VIEW)>.004;put(q.f,'display',vis?'inline':'none');if(!vis)continue;let A,B;
if(q.ax==='u'){A=F;B=S;}else{A=q.ax==='f'?S:F;if(P(...A)[0]<0)A=mul(A,-1);B=[0,0,-1];}put(q.f,'transform',plane(add(add(add(c,N,q.ax==='u'?H/2:q.ax==='f'?L/2:W/2),A,-q.w/2),B,-q.h/2),A,B));dim(q.t,tone(N));}}};}
const HEAD=into(el('g',{})),NL=20,NW=7.4,NH=7.2,NF=8.4,NZ=TZ1+.6,CZ=NZ+NH+1.4,AXZ=NZ+NH/2+.3,nac=solid(HEAD,NL,NW,NH,1.7),cool=solid(HEAD,5,6.4,1.4,.4);
for(const q of nac.faces){if(q.ax==='s'){for(const u of[.3,.7])line(q.f,q.w*u,1.8,q.w*u,q.h-.6,'seam');line(q.f,.9,1.8,q.w-.9,1.8,'seam');rect(q.f,q.w/2-4.1,3.1,8.2,1.75,.4,'face metal');text(q.f,q.w/2,4.38,'VINDRA','brandp');}
else if(q.ax==='f'&&q.sg<0){rect(q.f,1.3,2.2,q.w-2.6,3.6,.4,'face metal');for(let i=1;i<8;i++)line(q.f,1.7,2.2+i*.45,q.w-1.7,2.2+i*.45,'seam');}else if(q.ax==='u')line(q.f,1.4,q.h/2,q.w-7,q.h/2,'seam');}
for(const q of cool.faces)if(q.ax==='u')for(let i=1;i<7;i++)line(q.f,q.w*i/7,.5,q.w*i/7,q.h-.5,'seam');
const mast=[el('path',{class:'rod-u','stroke-width':.95}),el('path',{class:'rod','stroke-width':.5})],sensor=el('ellipse',{rx:.95,ry:.55,class:'face top metal'}),vane=el('path',{class:'face metal vane'});
const bPost=[el('path',{class:'rod-u','stroke-width':.95}),el('path',{class:'rod','stroke-width':.5})],bcn=lamp(HEAD,0,0,.62,'bcn'),bcnH=el('circle',{r:2.2,class:'bcnh'});
into(draw);
// The rotor, in front of the head when it faces the viewer: the neck, three blades (a body, a tone for the light, the
// trailing half a shade darker, a red tip band, the outline) and the spinner.
const FRONT=el('g',{}),AIRF=el('g',{}),ROTOR=el('g',{},FRONT),neck=el('path',{class:'face skin'},ROTOR);
const BL=[0,1,2].map(()=>({b:el('path',{class:'skin'},ROTOR),t:el('path',{class:'tone'},ROTOR),h:el('path',{class:'tone'},ROTOR),x:el('path',{class:'tipband'},ROTOR),o:el('path',{class:'outline'},ROTOR)})),spin=el('path',{class:'face spin'},ROTOR),seamR=el('path',{class:'seam ring'},ROTOR);
/* The blade, root to tip: radius, chord, thickness, twist (°), and how far the section's middle sits behind the pitch axis (a share of the chord). */
const SPAN=[[2.2,2.6,2.6,16,0],[4.6,2.75,2.7,16,0],[7.2,4.25,2.5,14,.12],[10.5,5.45,1.9,11.5,.18],[15,5.35,1.4,9,.2],[21,4.7,1.05,6.6,.2],[28,3.95,.8,4.4,.2],[35,3.3,.62,2.8,.2],[42,2.6,.47,1.5,.2],[48,1.95,.35,.7,.2],[52,1.32,.26,.25,.2],[54,.6,.15,0,.2]];
const sec=r=>{let i=1;while(i<SPAN.length-1&&SPAN[i][0]<r)i++;const a=SPAN[i-1],b=SPAN[i],k=clamp((r-a[0])/(b[0]-a[0]));return a.map((v,j)=>v+(b[j]-v)*k);};
const RT=54,TILT=5,RP=2.35,SPIN=[[1,3.3],[1.9,3.7],[2.8,3.7],[4,3.45],[5.2,2.9],[6.3,2.15],[7.3,1.35],[8.1,.6],[8.6,0]];
// Wind: a few ribbons along it that sweep past with a gust (and in a strong wind), behind the tower or in front by their side.
const AIR=[[-27,58,0],[31,40,140],[-9,100,260]].map(([l,z,o])=>({l,z,o,n:el('path',{class:'air'},AIRB)}));
// Controls: the rotor sends a gust, the tower door is the brake.
const rotorBtn=button(el('g',{}),{'aria-label':'Rotor: send a gust (Space)'}),rHit=el('circle',{r:12,class:'hit'},rotorBtn),rRing=el('circle',{r:13.5,class:'focus-ring'},rotorBtn);
const doorBtn=button(el('g',{}),{'aria-label':'Tower door: brake the rotor (B)'});{const g=group(plane([rAt(7.6)+.1,0,8.3],[0,-1,0],[0,0,-1]),doorBtn);rect(g,-2.6,-.4,5.2,8.6,1,'hit');rect(g,-3,-.8,6,9.4,1.2,'focus-ring');}
// Frame: the rotor can face any way, so the sphere its blades sweep round the yaw axis; the floor and its pool below.
const OVH=NF+RP*Math.cos(TILT*RAD),HZ=AXZ+RP*Math.sin(TILT*RAD);
{const x=1.2247*(RT+OVH)+5,top=-HZ-.7071*OVH-1.2247*RT-5,bottom=+SH.cy+1.25*SH.ry+3;set(svg,'viewBox',`${f2(-x)} ${f2(top)} ${f2(2*x)} ${f2(bottom-top)}`);}
// State: the wind (speed, direction, gusts, a little turbulence), the yaw drive, pitch, rotor speed and power; the brake and
// the storm cut-out; progress; lamps, beacon and the export flow; audio after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const say=m=>{announcement.textContent=m;};
const RATED=3.6,CUTIN=3,VR=12.5,CUTOUT=25,RERUN=22,RPMR=14,HOLD=4000;
const pc=v=>v<CUTIN?0:v>=VR?1:(v**3-CUTIN**3)/(VR**3-CUTIN**3),vOf=p=>Math.cbrt(clamp(p)*(VR**3-CUTIN**3)+CUTIN**3),rpmOf=v=>v<1?0:v<CUTIN?1.2*v/CUTIN:Math.min(RPMR,7*v/60*60/(2*Math.PI));
const PT='N NNE NE ENE E ESE SE SSE S SSW SW WSW W WNW NW NNW'.split(' '),SAY=['north','north-northeast','northeast','east-northeast','east','east-southeast','southeast','south-southeast','south','south-southwest','southwest','west-southwest','west','west-northwest','northwest','north-northwest'];
const wrap=a=>((a%360)+540)%360-180,pt=b=>Math.round((((b%360)+360)%360)/22.5)%16;
let bearing=202.5,vSet=10,gustT=-1e9,yaw=bearing-135,yawV=0,waitT=0,yawing=false,rot=0,pitch=0,rpm=rpmOf(10),power=RATED*pc(10),phase='run',opT=0,mode='own',target=0,fin=0,note='',noteT=0,last=0,lastUI=-1,now=0,tv=0,headKey='',bladeKey='',vaneKey='';
const gustAt=t=>{const s=(t-gustT)/1000;return reduced.matches?(s>=0&&s<3.2?1:0):s<0?0:s<.5?ease(s/.5):s<1.9?1:s<4.5?1-ease((s-1.9)/2.6):0;};
let ac=null,swishG=null,humG=null,whirG=null,nb=null;
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();nb=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;
const s=ac.createBufferSource(),bp=ac.createBiquadFilter();s.buffer=nb;s.loop=true;bp.type='bandpass';bp.frequency.value=420;bp.Q.value=.7;swishG=ac.createGain();swishG.gain.value=0;s.connect(bp);bp.connect(swishG);swishG.connect(ac.destination);s.start();
const o=ac.createOscillator();o.frequency.value=62;humG=ac.createGain();humG.gain.value=0;o.connect(humG);humG.connect(ac.destination);o.start();
const w=ac.createOscillator(),lp=ac.createBiquadFilter();w.type='sawtooth';w.frequency.value=118;lp.type='lowpass';lp.frequency.value=360;whirG=ac.createGain();whirG.gain.value=0;w.connect(lp);lp.connect(whirG);whirG.connect(ac.destination);w.start();}
if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function beep(f,d=.08,v=.01,w=0,type='sine',f1=0){if(!ac)return;try{const t=ac.currentTime+w,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
function hiss(d,v,f,q=1,w=0){if(!ac||!nb)return;try{const t=ac.currentTime+w,s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;b.Q.value=q;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+d*.3);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(ac.destination);s.start(t,0,d+.05);}catch(_){}}
const flash=(m,ms=1600)=>{note=m;noteT=now+ms;lastUI=-1;},steered=()=>mode==='det'||mode==='done';
function gust(){audio();gustT=now;hiss(3.2,.03,600,.6);flash(`GUST · ${Math.round(vSet+6)} M/S`);say(`A gust: the wind rises to ${Math.round(vSet+6)} meters per second and the rotor spins up.`);}
function turn(d){audio();bearing=(bearing+d*22.5+360)%360;beep(d>0?740:620,.05,.008);flash(`WIND FROM ${PT[pt(bearing)]}`);say(`Wind from the ${SAY[pt(bearing)]}. The nacelle yaws to face it.`);}
function speed(d){audio();if(steered()){flash('WIND FOLLOWS THE PROGRESS');say('The progress sets the wind and the power.');return;}vSet=clamp(vSet+d,0,30);beep(520+vSet*18,.05,.008);flash(`WIND ${vSet} M/S`);say(`Wind ${vSet} meters per second${vSet>=CUTOUT?': above cut-out, the blades feather.':vSet<CUTIN?': below cut-in.':'.'}`);}
function brake(){audio();if(phase==='stop'){phase='start';opT=now;beep(300,.12,.012,0,'triangle');flash('BRAKE RELEASED');say('Brake released. The blades pitch in and the rotor spins up.');return;}
if(phase==='brake')return;phase='brake';opT=now;noteT=0;beep(140,.3,.02,0,'triangle',70);hiss(1.6,.02,900,1.2,.05);say('Brake: the blades feather and the rotor comes to a stop.');lastUI=-1;}
window.figure={setProgress(p){fin=0;if(p==null||!isFinite(p))mode='ind';else{mode='det';target=clamp(+p);}lastUI=-1;},done(){mode='done';fin=1;lastUI=-1;}};
bind(rotorBtn,gust);bind(doorBtn,brake);
const act={' ':gust,b:brake,ArrowLeft:()=>turn(-1),ArrowRight:()=>turn(1),ArrowUp:()=>speed(1),ArrowDown:()=>speed(-1)};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(k===' '&&e.target.closest&&e.target.closest('button,[role=button]'))return;const fn=act[k];if(fn){e.preventDefault();if(!e.repeat||k.startsWith('Arrow'))fn();}});
// The head posed at the yaw: nacelle, cooler, mast and beacon; the neck and spinner; the rotor's layer and the gust button.
function poseHead(){const F=[Math.cos(yaw*RAD),Math.sin(yaw*RAD),0],S=[-F[1],F[0],0],W=(f,s,z)=>[F[0]*f+S[0]*s,F[1]*f+S[1]*s,z];
nac.pose(W(NF-NL/2,0,NZ+NH/2),F,S);cool.pose(W(-8.5,0,CZ-.7),F,S);
const m0=W(-10.3,-2.2,CZ),m1=add(m0,[0,0,3.6]),md=`M${Q(m0)}L${Q(m1)}`;for(const n of mast)put(n,'d',md);const sq=P(...m1);put(sensor,'cx',f2(sq[0]));put(sensor,'cy',f2(sq[1]));
const b0=W(-7,2.3,CZ),b1=add(b0,[0,0,1.6]),bd=`M${Q(b0)}L${Q(b1)}`;for(const n of bPost)put(n,'d',bd);const bq=P(...add(b1,[0,0,.45]));for(const n of[bcn,bcnH]){put(n,'cx',f2(bq[0]));put(n,'cy',f2(bq[1]));}
const a=add(mul(F,Math.cos(TILT*RAD)),[0,0,1],Math.sin(TILT*RAD)),e=S,zp=add(mul(F,-Math.sin(TILT*RAD)),[0,0,1],Math.cos(TILT*RAD)),O=W(NF,0,AXZ),rad=u=>add(mul(e,Math.cos(u)),zp,Math.sin(u));
const ring=(t,r)=>Array.from({length:24},(_,i)=>P(...add(add(O,a,t),rad(i/24*2*Math.PI),r)));
put(neck,'d',pd(hull([...ring(-.6,2.9),...ring(1.3,2.9)])));put(spin,'d',pd(hull(SPIN.flatMap(([t,r])=>r?ring(t,r):[P(...add(O,a,t))]))));
// The spinner's seam ahead of the blades: the half of the ring that faces the viewer (hidden when the nose points away).
{const q=Array.from({length:37},(_,i)=>i/36*2*Math.PI),k=q.findIndex(u=>dot(rad(u),VIEW)<=0),vis=[...q.slice(k),...q.slice(0,k)].filter(u=>dot(rad(u),VIEW)>0);put(seamR,'d','M'+vis.map(u=>Q(add(add(O,a,3.05),rad(u),3.62))).join('L'));}
const hq=P(...add(O,a,RP+1));for(const n of[rHit,rRing]){put(n,'cx',f2(hq[0]));put(n,'cy',f2(hq[1]));}
const faces=dot(F,VIEW)>0,slot=faces?FRONT:BACK;put(seamR,'display',faces?'inline':'none');if(ROTOR.parentNode!==slot)slot.appendChild(ROTOR);if(faces&&ROTOR.firstChild!==neck)ROTOR.insertBefore(neck,ROTOR.firstChild);else if(!faces&&ROTOR.lastChild!==neck)ROTOR.appendChild(neck);
return{a,e,zp,H:add(O,a,RP),m1};}
let head=poseHead();
// The vane on the met mast trails down the wind, whichever way the nacelle faces.
function poseVane(){const w=(bearing-135)*RAD,D=[-Math.cos(w),-Math.sin(w),0],p0=add(head.m1,[0,0,.35]),q=(k,z)=>P(...add(add(p0,D,k),[0,0,z])),n=q(-1.1,0),b=q(1.6,0);
put(vane,'d',`M${f2(n[0])},${f2(n[1])}L${f2(b[0])},${f2(b[1])}L${Q(add(add(p0,D,3),[0,0,1.1]))}L${Q(add(add(p0,D,3),[0,0,-.25]))}L${f2(b[0])},${f2(b[1])}Z`);}
// The blades at the rotor's angle and pitch: each section's ellipse (chord by thickness) projected across the blade's axis.
function poseBlades(){const{a,e,zp,H}=head;for(let k=0;k<3;k++){const th=(rot+k*120)*RAD,b=add(mul(zp,Math.cos(th)),e,Math.sin(th)),mo=add(mul(zp,Math.sin(th)),e,-Math.cos(th)),pb=P(...b),l=Math.hypot(...pb);
const T=l>.12?[pb[0]/l,pb[1]/l]:[1,0],N=[-T[1],T[0]],cut=r=>{const[R,c,t,tw,off]=sec(r),ph=(tw+pitch)*RAD,ch=add(mul(mo,Math.cos(ph)),a,Math.sin(ph)),nn=cross(b,ch),C=P(...add(add(H,b,R),ch,-off*c)),pc2=P(...ch),pn=P(...nn),cn=pc2[0]*N[0]+pc2[1]*N[1],tn=pn[0]*N[0]+pn[1]*N[1];return{C,w:Math.hypot(c/2*cn,t/2*tn),cn,c,nn};};
const side=(s,k2)=>[s.C[0]+N[0]*s.w*k2,s.C[1]+N[1]*s.w*k2],S=SPAN.map(s=>cut(s[0])),tip=S[S.length-1],tp=[tip.C[0]+T[0]*.5,tip.C[1]+T[1]*.5],mid=S[6],sg=mid.cn>=0?1:-1,B=BL[k];
const d=curve([...S.map(s=>side(s,1)),tp,...S.map(s=>side(s,-1)).reverse()])+'Z';for(const n of[B.b,B.t,B.o])put(n,'d',d);dim(B.t,tone(mid.nn)*.9);
put(B.h,'d',curve([...S.map(s=>s.C),tp,...S.map(s=>side(s,-sg)).reverse()])+'Z');dim(B.h,.42*clamp(Math.abs(mid.cn)*mid.c/2/Math.max(mid.w,.01)));
const tb=[46.5,48.5,50.5].map(cut);put(B.x,'d',pd([...tb.map(s=>side(s,1)),...tb.map(s=>side(s,-1)).reverse()]));}}
// The wind's ribbons, from upwind to down along the wind with a lazy wave, on their side of the tower.
function poseAir(){const w=(bearing-135)*RAD,W=[Math.cos(w),Math.sin(w),0],S=[-W[1],W[0],0];for(const s of AIR){const p=t=>P(...add(add(mul(S,s.l+2.2*Math.sin(t/11+s.o)),W,t),[0,0,s.z+1.6*Math.sin(t/15+s.o/2)]));put(s.n,'d',curve(Array.from({length:9},(_,i)=>p(36-i*9))));const g=dot(S,VIEW)*s.l>0?AIRF:AIRB;if(s.n.parentNode!==g)g.appendChild(s.n);}}
function ui(){const v=vSet+gustAt(now)*6,goal=RATED*(mode==='done'?1:target),err=wrap(bearing-135-yaw);readout.textContent=`${power.toFixed(1)} MW · ${Math.round(v+tv)} M/S`;meter.textContent=`${power.toFixed(1)} MW`;
stateLabel.textContent=now<noteT?note:phase==='brake'?'BRAKING · BLADES FEATHERING':phase==='stop'?'STOPPED · BRAKE ON':phase==='start'?'RESTARTING · BLADES PITCHING IN':phase==='storm'?'STORM · CUT-OUT · BLADES FEATHERED':yawing&&Math.abs(err)>=1?`YAWING · ${Math.round(Math.abs(err))}° TO THE WIND`:
mode==='det'?`PROGRESS ${Math.round(target*100)}% · ${Math.abs(power-goal)>.05?'RAMPING':'HOLDING'}`:mode==='done'?(fin===2?'COMPLETE · RATED POWER':'FINISHING · RAMPING TO RATED'):mode==='ind'?'INDETERMINATE · GENERATING':v<1?'CALM · ROTOR AT REST':v<CUTIN?'BELOW CUT-IN · IDLING':gustAt(now)>.3?'GUST · ROTOR SPINNING UP':v>=VR?`RATED POWER · PITCH ${Math.round(pitch)}°`:`GENERATING · WIND ${PT[pt(bearing)]} · ${Math.round(rpm)} RPM`;lastUI=now;}
function tick(t){const dt=Math.min(.05,Math.max(0,(t-(last||t))/1000)),red=reduced.matches;last=now=t;
// The wind: what's set (or what the progress asks for), a gust, a little turbulence.
if(steered())vSet=+vOf(mode==='done'?1:target).toFixed(2);const g=gustAt(t);tv=red?0:.24*Math.sin(t/1300)+.17*Math.sin(t/530+1.3);const v=Math.max(0,vSet+g*6+tv);
// Yaw: once the wind has stayed off the nose for a moment, the drive turns the nacelle until it faces it (a few degrees off is let be).
const err=wrap(bearing-135-yaw);if(red){yaw=bearing-135;yawV=0;yawing=false;}else{if(!yawing){waitT=Math.abs(err)>6?waitT+dt:0;yawing=waitT>.5;}const want=yawing?clamp(err*2,-30,30):0;yawV+=(want-yawV)*clamp(dt*8);yaw+=yawV*dt;if(yawing&&Math.abs(err)<.3&&Math.abs(yawV)<1){yawing=false;waitT=0;}}const m=Math.max(0,Math.cos(wrap(bearing-135-yaw)*RAD));
// The operating state: the brake, the hold, the restart; the storm cut-out.
if(phase==='run'&&vSet>=CUTOUT){phase='storm';opT=t;say('Storm: above cut-out the blades feather and the rotor idles.');}else if(phase==='storm'&&vSet<=RERUN){phase='start';opT=t;}
if(phase==='brake'&&(red||rpm<.35)){phase='stop';opT=t;rpm=0;beep(90,.25,.03,0,'sine',50);}else if(phase==='stop'&&t-opT>HOLD){phase='start';opT=t;say('The brake releases. The blades pitch in and the rotor spins up.');}
const runPitch=v>VR?Math.min(24,(v-VR)*1.7):0,runRpm=rpmOf(v)*m,feathered=phase==='brake'||phase==='stop'||phase==='storm',pitchT=feathered?90:runPitch,rpmT=phase==='storm'?.8:feathered?0:runRpm,rate=phase==='brake'?30:14;
pitch=red?pitchT:pitch+clamp(pitchT-pitch,-dt*rate,dt*rate);
if(phase==='stop')rpm=0;else if(red)rpm=rpmT;else rpm+=(rpmT-rpm)*clamp(dt/(phase==='brake'?.9+1.6*(1-pitch/90):rpmT>rpm?2.4:3.2));
if(phase==='start'&&(red||pitch<=runPitch+.5&&rpm>=.92*runRpm))phase='run';
const live=phase==='run'||phase==='start',spun=runRpm>.01?clamp(rpm/runRpm):0,pT=!live?0:(steered()?RATED*(mode==='done'?1:target):RATED*pc(v))*m**3*(phase==='start'?spun**3:1);
power=feathered||red?pT:power+(pT-power)*clamp(dt/.9);if(power<.005)power=0;if(mode==='done'&&fin===1&&phase==='run'&&power>=RATED*.995){fin=2;say('Complete: the turbine runs at its rated power.');}
// Draw: the head when it turns, the blades when they turn or pitch, the vane and ribbons when the wind turns; lamps and flow.
if(!red)rot=(rot-rpm*6*dt)%360;const hk=yaw.toFixed(2);if(hk!==headKey){headKey=hk;head=poseHead();bladeKey=vaneKey='';}
const bk=rot.toFixed(2)+'|'+pitch.toFixed(1);if(bk!==bladeKey){bladeKey=bk;poseBlades();}
const vk=bearing+'|'+hk;if(vk!==vaneKey){vaneKey=vk;poseVane();poseAir();}
const windy=Math.max(g,clamp((v-14)/12)*.7);if(svg.classList.contains('still')!==red)svg.classList.toggle('still',red);for(const s of AIR){op(s.n,windy<.02?'0':`calc(var(--air-a) * ${windy.toFixed(2)})`);if(!red&&windy>=.02)set(s.n,'stroke-dashoffset',f2(26-(t/1000*(40+v*5)+s.o)%426));}
const exp=power>.05,ok=exp||mode==='done'&&fin===2;op(flow,exp?'.9':'0');if(exp&&!red)set(flow,'stroke-dashoffset',f2(-(t/1000*(1.5+power*1.4))%3.7));lit(kLamp,ok?'g':'a');put(kHalo,'class','halo '+(ok?'g':'a'));
const blink=red||t%2000<700;lit(bcn,blink?'on':'');put(bcnH,'class','bcnh'+(blink?' on':''));
if(ac){const pass=[0,1,2].reduce((s,k)=>s+Math.pow(Math.max(0,-Math.cos((rot+k*120)*RAD)),6),0);swishG.gain.setTargetAtTime(clamp(rpm/RPMR)*(.002+.012*pass),ac.currentTime,.06);humG.gain.setTargetAtTime(power/RATED*.004,ac.currentTime,.3);whirG.gain.setTargetAtTime(Math.abs(yawV)>.5?.004:0,ac.currentTime,.1);}
if(lastUI<0||t-lastUI>150)ui();
requestAnimationFrame(tick);}
poseBlades();poseVane();poseAir();ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
