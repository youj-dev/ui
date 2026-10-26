// @ts-nocheck
/* LOFTRA LC–7 · Rocket launch pad. Its stylesheet, defs and script, drawn on the engine in the figures' house style (the
 * kit's projection and helpers, the shared palette, stage and filters). The script runs on the env, which stands in for
 * the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--pad:#d3d3cf;--pad-top:#e6e6e2;--pad-side:#c0c0bc;--dk:#3a3a39;--dk-top:#4a4a48;--dk-side:#2d2d2c;--void:#2c2d2e;--wall:#9a9a96;--hull:#f6f5f1;--hull-top:#fbfaf7;--hull-side:#dddcd7;--tw:#c65d40;--tw-top:#d8775b;--tw-side:#a64a31;--tank:#e9e8e3;--screen:#1c1d1e;--card:#2c2c2b;--digit:#f2eee4;--unlit:#3b3b3a;--decal:#2e2e2d;--hz:#e9b832;--fire:#ff8a2b;--fl0:#fffbe8;--fl1:#ffd76e;--fl2:#ff9b3d;--fl3:#ff5f1f;--water:#8fb9ca;--sm-hi:#fbfbf9;--sm:#e8e8e4;--sm-lo:#c6c6c1}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--pad:#b2b2af;--pad-top:#d7d7d3;--pad-side:#878786;--dk:#2f2f2f;--dk-top:#454543;--dk-side:#1d1d1c;--void:#1e1f20;--wall:#6c6c6a;--hull:#cfcfcc;--hull-top:#ebeae7;--hull-side:#9c9b99;--tw:#a74d34;--tw-top:#ca6f55;--tw-side:#743220;--tank:#c4c3c0;--screen:#161717;--card:#232322;--digit:#e4e0d6;--unlit:#2e2e2d;--decal:#232322;--hz:#c49b28;--water:#7d9fad;--sm-hi:#e3e3e1;--sm:#c9c9c6;--sm-lo:#a3a3a0;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.micro{font-size:2.4px;letter-spacing:.2px}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.pad{fill:var(--pad)}.top.pad{fill:var(--pad-top)}.side.pad{fill:var(--pad-side)}.dk{fill:var(--dk)}.top.dk{fill:var(--dk-top)}.side.dk{fill:var(--dk-side)}.hull{fill:var(--hull)}.top.hull{fill:var(--hull-top)}.side.hull{fill:var(--hull-side)}.tw{fill:var(--tw)}.top.tw{fill:var(--tw-top)}.side.tw{fill:var(--tw-side)}.hz,.top.hz,.side.hz{fill:var(--hz)}.tank{fill:url(#tankG)}.void{fill:var(--void);stroke:none}.wall{fill:var(--wall)}.lip{fill:#000;opacity:.28;stroke:none}.hzs{fill:url(#hzP);stroke:none}
.joint{fill:none;stroke:var(--line);stroke-width:.5;opacity:.35}.tie{stroke:var(--line);stroke-width:.6;opacity:.32}.paint{fill:var(--line);opacity:.18;font:700 10px ui-monospace,monospace;letter-spacing:3px;stroke:none}
.su{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.su.dim{opacity:.5}.bar{fill:none;stroke:var(--tw);stroke-linecap:round;stroke-linejoin:round}.bar.dim{stroke:var(--tw-side)}.bar.steel{stroke:var(--metal)}.bar.steel.dim{stroke:var(--metal-side)}.truss{fill:none;stroke:var(--tw-side);stroke-width:.5;stroke-linejoin:round}.pipe{fill:none;stroke:var(--metal-top);stroke-linecap:round}
.shade{fill:#000;opacity:.07;stroke:none;pointer-events:none}.shine{fill:none;stroke:#fff;stroke-linecap:round;opacity:.75}.decal{fill:var(--decal);font:700 4.4px ui-monospace,monospace;letter-spacing:1.5px;stroke:none}
.screen{fill:var(--screen)}.card{fill:var(--card);stroke:none}.digit{fill:var(--digit);font:700 8.4px ui-monospace,monospace;text-anchor:middle;stroke:none}.split{stroke:#000;stroke-width:.45;opacity:.55}.seg{fill:var(--unlit)}.seg.a{fill:var(--warn)}.seg.g{fill:var(--ok)}.seg.b{fill:var(--accent)}.seg.a,.seg.g,.seg.b{filter:url(#glow)}
.lamp{fill:var(--off);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke}.lamp.r{fill:var(--fault)}.lamp.a{fill:var(--warn)}.lamp.r,.lamp.a{filter:url(#glow);stroke:none}.halo{opacity:0;filter:url(#bloom);pointer-events:none}.halo.r{fill:var(--fault);opacity:.45}.halo.a{fill:var(--warn);opacity:.5}
.puff{fill:url(#puffG);stroke:none;pointer-events:none}.smoke{filter:url(#vapor)}.fe{fill:url(#flameO);opacity:.35;filter:url(#bloom)}.fo{fill:url(#flameO);filter:url(#glow)}.fi{fill:url(#flameI)}.fc{fill:url(#flameC)}.dia{fill:#fff}.fhalo{fill:var(--fire);filter:url(#bloom)}.fire{fill:url(#fireG)}.hot{fill:var(--fire);filter:url(#glow)}.jet{fill:url(#jetG);filter:url(#glow)}.fe,.fo,.fi,.fc,.dia,.fhalo,.fire,.hot,.jet{stroke:none;pointer-events:none}
.water{fill:none;stroke:var(--water);stroke-width:.75;stroke-linecap:round;stroke-dasharray:.3 1.5}.fuel{fill:none;stroke:var(--accent);stroke-width:.7;stroke-linecap:round;stroke-dasharray:1.4 2.2}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="puffG" cx=".5" cy=".5" r=".5" fx=".4" fy=".34"><stop offset="0" style="stop-color:var(--sm-hi)"/><stop offset=".25" style="stop-color:var(--sm-hi);stop-opacity:.9"/><stop offset=".5" style="stop-color:var(--sm);stop-opacity:.62"/><stop offset=".75" style="stop-color:var(--sm-lo);stop-opacity:.3"/><stop offset=".9" style="stop-color:var(--sm-lo);stop-opacity:.1"/><stop offset="1" style="stop-color:var(--sm-lo);stop-opacity:0"/></radialGradient>
<radialGradient id="fireG"><stop offset="0" style="stop-color:var(--fire);stop-opacity:.8"/><stop offset=".4" style="stop-color:var(--fire);stop-opacity:.32"/><stop offset="1" style="stop-color:var(--fire);stop-opacity:0"/></radialGradient>
<linearGradient id="flameO" x2="0" y2="1"><stop offset="0" style="stop-color:var(--fl1)"/><stop offset=".42" style="stop-color:var(--fl2);stop-opacity:.92"/><stop offset="1" style="stop-color:var(--fl3);stop-opacity:0"/></linearGradient>
<linearGradient id="flameI" x2="0" y2="1"><stop offset="0" style="stop-color:var(--fl0)"/><stop offset=".55" style="stop-color:var(--fl1)"/><stop offset="1" style="stop-color:var(--fl2);stop-opacity:0"/></linearGradient>
<linearGradient id="flameC" x2="0" y2="1"><stop offset="0" style="stop-color:#fff"/><stop offset="1" style="stop-color:var(--fl0);stop-opacity:0"/></linearGradient>
<linearGradient id="jetG"><stop offset="0" style="stop-color:var(--fl0)"/><stop offset=".35" style="stop-color:var(--fl1)"/><stop offset="1" style="stop-color:var(--fl3);stop-opacity:0"/></linearGradient>
<radialGradient id="tankG" cx=".5" cy=".5" r=".5" fx=".34" fy=".28"><stop offset="0" style="stop-color:var(--hull-top)"/><stop offset=".72" style="stop-color:var(--tank)"/><stop offset="1" style="stop-color:var(--hull-side)"/></radialGradient>
<pattern id="hzP" width="2.6" height="2.6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="1.3" height="2.6" style="fill:var(--hz)"/><rect x="1.3" width="1.3" height="2.6" style="fill:var(--dk)"/></pattern>
<filter id="vapor" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.5"/></filter>
<clipPath id="holeClip"><path d="M-400,-500H400V-21H12.25A12.25,7.07 0 0 1 -12.25,-21H-400Z"/></clipPath>
<clipPath id="cardT"><rect x="-.3" y="-.3" width="7.2" height="5.8"/></clipPath><clipPath id="cardB"><rect x="-.3" y="5.5" width="7.2" height="5.8"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* LOFTRA LC–7. World: x lower-right, y lower-left (front faces look along +y), z up; 1 unit ≈ 40 cm. The rocket stands
on a mobile platform over the pad's centre, which rolls along −y on the crawlerway's rails.
Part                          x      y      z      w      d      h
pad (concrete)              −60    −60      0    120    120      9   open flame trench x −11…60, y ±7; its mouth in the +x face
crawlerway                  −22   −132      0     44     72      9   rails at x ±13 out to the buffers at y 24
service tower               −43     −7      9     14     14    154   lattice, 11 bays of 14; deck at 163, mast and beacon to 201
swing arms (2)          hinge −29 0, at z 65 and 107: 19 long, 4.4 wide, 3.6 deep; a clamp r 8.3–10.5 round the rocket
mobile platform             −20    −20     14     40     40      7   four bogies on the rails, exhaust hole r 10, four clamps
rocket            axis 0 0, base at 24, r 8: first stage to 90, interstage to 96, second stage to 118, fairing to the tip at 152
 fins (4)           at 45° + 90°·k: root 26–49, tip 17.5 out at 22.5–33.5; three engine bells under the base, to 18.5
water tower         axis 86 −30: four legs to 39, a sphere r 10 at 48, a deluge main to the pad
countdown board             −58     48     22     38      3     21   on two posts: T, sign and two flip digits, ten lamps
Painter: floor, crawlerway, pad and trench, water tower, tower, back smoke, arms, platform, flame and rocket, front clamps
and sprays, trench jet, front smoke, fire light, board. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{P,set,el,group,rect,circle,line,text,poly,wire,box,cylinder,frame,TOP,FRONT,SIDE}=kit(()=>root);
// Figure helpers: polar points, surfaces of revolution, tangent planes, outlined bars, lamps, controls.
const draw=root,into=g=>root=g,dfs=svg.querySelector('defs');
const f2=v=>(+v).toFixed(2),RAD=Math.PI/180,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=p=>(p=clamp(p),p*p*(3-2*p)),out3=p=>1-(1-clamp(p))**3,R=Math.random;
const add=(a,b,k=1)=>a.map((v,i)=>v+b[i]*k),at=(r,a,z,cx=0,cy=0)=>[cx+r*Math.cos(a*RAD),cy+r*Math.sin(a*RAD),z];
const Q=(...p)=>P(...p).map(f2).join(','),pd=q=>'M'+q.map(p=>f2(p[0])+','+f2(p[1])).join('L')+'Z',seg=(a,b)=>`M${Q(...a)}L${Q(...b)}`;
const plane=(o,U,V)=>`matrix(${P(...U).map(f2).join(' ')} ${P(...V).map(f2).join(' ')} ${P(...o).map(f2).join(' ')})`,tan=a=>[Math.sin(a*RAD),-Math.cos(a*RAD),0];
const arc=(r,a1,z,sw,cx=0,cy=0)=>`A${f2(r*1.2247)},${f2(r*.7071)} 0 0 ${sw} ${Q(...at(r,a1,z,cx,cy))}`;
const band=(r,z0,z1,cls,a0=-45,a1=135,cx=0,cy=0)=>el('path',{d:`M${Q(...at(r,a0,z0,cx,cy))}${arc(r,a1,z0,1,cx,cy)}L${Q(...at(r,a1,z1,cx,cy))}${arc(r,a0,z1,0,cx,cy)}Z`,class:cls});
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const p of pts){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(const p of pts.reverse()){while(hi.length>1&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
const rim=(r,z,n=24,cx=0,cy=0)=>Array.from({length:n},(_,i)=>P(...at(r,i*360/n,z,cx,cy)));
const solid=(rings,cls)=>el('path',{d:pd(hull(rings.flat())),class:'face '+cls});
function sk(d,w,cls){el('path',{d,class:'su'+(cls.includes('dim')?' dim':''),'stroke-width':f2(w+.7)});return el('path',{d,class:cls,'stroke-width':w});}
const put=(n,k,v)=>{const c=n._a||(n._a={});if(c[k]!==v){c[k]=v;if(v==null)n.removeAttribute(k);else set(n,k,v);}},op=(n,v)=>{if(n._o!==v){n._o=v;n.style.opacity=v;}},vis=(n,on)=>{const v=on?'':'none';if(n._d!==v){n._d=v;n.style.display=v;}};
function lamp(g,x,y,r=1){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c,base='lamp'){if(n._c!==c){n._c=c;set(n,'class',base+(c?' '+c:''));}}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
// Floor; the crawlerway, fading out where the platform goes for a fresh rocket.
const s0=P(10,-4,0);for(const c of['shadow stage-floor','stage-contact'])el('ellipse',{cx:f2(s0[0]),cy:f2(s0[1]+5),rx:128,ry:72,class:c});
{const a=P(0,-84,9),b=P(0,-128,9),g=el('linearGradient',{id:'cwG',gradientUnits:'userSpaceOnUse',x1:f2(a[0]),y1:f2(a[1]),x2:f2(b[0]),y2:f2(b[1])},dfs);el('stop',{offset:0,'stop-color':'#fff'},g);el('stop',{offset:1,'stop-color':'#000'},g);const m=el('mask',{id:'cwFade',maskUnits:'userSpaceOnUse',x:-300,y:-400,width:700,height:700},dfs);el('rect',{x:-300,y:-400,width:700,height:700,fill:'url(#cwG)'},m);}
into(el('g',{mask:'url(#cwFade)'}));box(-22,-132,0,44,72,9,2,'pad');{const t=group(TOP(-22,-132,9.02));for(let v=3;v<72;v+=5)line(t,6,v,38,v,'tie');}for(const x of[-13,13])box(x-.8,-132,9,1.6,72,1.2,.3,'metal');into(draw);
// Pad: concrete with joints and its painted number; the trench's mouth and open slot with the far wall and the deflector.
box(-60,-60,0,120,120,9,3,'pad');const padTop=group(TOP(-60,-60,9.02));for(const u of[30,90]){line(padTop,u,3,u,117,'joint');line(padTop,3,u,117,u,'joint');}text(padTop,72,111,'LC–7','paint');
el('path',{d:poly([[60,7,9],[60,-7,9],[60,-7,0],[60,7,0]],true),class:'void'});el('path',{d:poly([[-11,-7,9],[60,-7,9],[60,7,9],[-11,7,9]],true),class:'void'});
const tw0=group(FRONT(-11,-7,9));rect(tw0,0,0,71,9,0,'face wall');rect(tw0,0,0,71,2.2,0,'lip');el('path',{d:'M0,0C4,0 10,4 17,9L0,9Z',class:'face metal'},tw0);const slotGlow=rect(tw0,0,0,71,9,0,'hot');slotGlow.style.opacity=0;
for(const x of[-13,13]){box(x-.8,-60,9,1.6,84,1.2,.3,'metal');box(x-2.2,24,9,4.4,2.6,3,.6,'hz');}
const poolL=circle(group(TOP(0,0,9.05)),0,0,54,'fire');poolL.style.opacity=0;
// Water tower: shadow, deluge main, legs and braces, riser, the sphere with its catwalk.
const WX=86,WY=-30,lg=(a,z)=>at(9-3.6*z/39,a,z,WX,WY);{const s=P(WX,WY,0);el('ellipse',{cx:f2(s[0]),cy:f2(s[1]+1),rx:18,ry:9,class:'shadow'});}
cylinder(60,WY,1.6,1.4,WX-66,'x','metal');
const xb=(a,b,cls)=>{for(const[z0,z1]of[[3,20],[20,37]])sk(seg(lg(a,z0),lg(b,z1))+seg(lg(b,z0),lg(a,z1)),.5,cls);};
sk(seg(lg(225,0),lg(225,39)),1.5,'bar steel dim');xb(135,225,'bar steel dim');xb(225,315,'bar steel dim');cylinder(WX,WY,0,1.5,39,'z','metal');
for(const a of[135,315])sk(seg(lg(a,0),lg(a,39)),1.5,'bar steel');xb(135,45,'bar steel');xb(45,315,'bar steel');sk(seg(lg(45,0),lg(45,39)),1.5,'bar steel');
{const c=P(WX,WY,48);circle(draw,c[0],c[1],12.25,'face tank');el('path',{d:`M${f2(c[0]-7.6)},${f2(c[1]-6.2)}A9.4,9.4 0 0 1 ${f2(c[0]+1.8)},${f2(c[1]-9.6)}`,class:'shine','stroke-width':1.1});band(10.6,47.2,48.4,'face metal',-45,135,WX,WY);cylinder(WX,WY,57.7,1.6,1.3,'z','metal');}
// Service tower: back leg and bracing, the arm decks, side legs, front bracing, front leg; the deck, mast and beacon.
const LV=[...Array(12)].map((_,k)=>9+k*14),legBox=(x,y)=>box(x-1.1,y-1.1,9,2.2,2.2,154,.5,'tw');
const face={back:z=>[[-42,-7.1,z],[-30,-7.1,z]],left:z=>[[-43.1,6,z],[-43.1,-6,z]],front:z=>[[-42,7.1,z],[-30,7.1,z]],side:z=>[[-28.9,6,z],[-28.9,-6,z]]};
const brace=f=>{let d='';for(let k=0;k<LV.length-1;k++){const[a0,b0]=face[f](LV[k]),[a1,b1]=face[f](LV[k+1]);d+=seg(a0,b1)+seg(b0,a1);if(k)d+=seg(a0,b0);}return d;};
legBox(-42,-6);sk(brace('back')+brace('left'),.75,'bar dim');for(const z of[65,107])box(-43.1,-7.1,z-1.2,14.2,14.2,1.2,.3,'tw');
legBox(-42,6);legBox(-30,-6);sk(brace('front')+brace('side'),.85,'bar');legBox(-30,6);
box(-45,-9,163,18,18,3,1,'tw');cylinder(-36,0,166,1.3,26,'z','hull');for(const z of[171,180])band(1.3,z,z+3.5,'face tw',-45,135,-36,0);
cylinder(-36,0,192,1.8,1.4,'z','dk');const bcn=cylinder(-36,0,193.4,1.3,1.6,'z','glass'),bLamp=lamp(bcn.face,0,0,1),bp=P(-36,0,194.4),bHalo=el('circle',{cx:f2(bp[0]),cy:f2(bp[1]),r:8,class:'halo'});wire([[-36,0,195],[-36,0,201]],'detail');
const smB=el('g',{class:'smoke'});
// Swing arms, rebuilt as they turn: a beam with its truss and umbilical line, a pin at the tower, a clamp round the rocket.
const armsG=el('g',{}),ARMZ=[107,65],fuels=[];let armKey='';
function drawArms(){const key=arm.map(a=>a.toFixed(3)).join();if(key===armKey)return;armKey=key;armsG.replaceChildren();fuels.length=0;const was=root;into(armsG);drawArm(ARMZ[1],90*ease(arm[1]));drawArm(ARMZ[0],90*ease(arm[0]));into(was);}
function drawArm(z,th){const T=th*RAD,U=[Math.cos(T),Math.sin(T),0],V=[-Math.sin(T),Math.cos(T),0],c=(u,v,w)=>[-28.9+u*U[0]+v*V[0],u*U[1]+v*V[1],z+w],L=19,W=2.2,D=3.6,sv=V[0]+V[1]>=0?1:-1,cls=n=>n[0]>n[1]+.15?'face side tw':'face tw';
cylinder(-28.6,0,z-1.4,1.3,D+2.8,'z','metal');
el('path',{d:poly([c(0,sv*W,0),c(L,sv*W,0),c(L,sv*W,D),c(0,sv*W,D)],true),class:cls(V.map(v=>v*sv))});
let t='';for(let i=0;i<=13;i++)t+=(i?'L':'M')+f2(.8+i*1.34)+','+(i%2?'.5':'3.1');el('path',{d:t,class:'truss'},group(plane(c(0,sv*W,D),U,[0,0,-1])));
el('path',{d:poly([c(L,-W,0),c(L,W,0),c(L,W,D),c(L,-W,D)],true),class:cls(U)});el('path',{d:poly([c(0,-W,D),c(L,-W,D),c(L,W,D),c(0,W,D)],true),class:'face top tw'});
const pp=seg(c(.6,0,D+.8),c(L+1.5,0,D+.8));sk(pp,.8,'pipe');fuels.push(el('path',{d:pp,class:'fuel',style:'opacity:0'}));
const ra=(r,w)=>Array.from({length:9},(_,i)=>c(29+r*Math.cos((140+i*10)*RAD),r*Math.sin((140+i*10)*RAD),w));
el('path',{d:poly([...ra(10.5,0),...ra(10.5,D).reverse()],true),class:'face metal'});el('path',{d:poly([...ra(8.3,0),...ra(8.3,D).reverse()],true),class:'face side metal'});el('path',{d:poly([...ra(10.5,D),...ra(8.3,D).reverse()],true),class:'face top metal'});}
// The mobile platform: bogies, deck, exhaust hole, the clamps and deluge nozzles behind the rocket.
const mlpG=into(el('g',{}));for(const[x,y]of[[-13,-13],[13,-13],[-13,13],[13,13]])box(x-3,y-6,10.2,6,12,3.8,1,'dk');for(const y of[-13,13]){const g=group(SIDE(16,y+6,14));for(const u of[3,9])circle(g,u,2,1.4,'face metal');}
box(-20,-20,14,40,40,7,1.6,'metal');{const f=group(FRONT(-20,20,21));rect(f,0,5.4,40,1.6,0,'hzs');text(f,3,3.8,'LOFTRA · MLP–2','etch micro');const s=group(SIDE(20,20,21));rect(s,0,5.4,40,1.6,0,'hzs');text(s,3,3.8,'LC–7','etch micro');}
const dk=group(TOP(-20,-20,21.02));for(const u of[7,33]){line(dk,u,2,u,38,'joint');line(dk,2,u,38,u,'joint');}circle(dk,20,20,11.6,'face recess');circle(dk,20,20,10,'void');const holeGlow=circle(dk,20,20,9.4,'hot');holeGlow.style.opacity=0;
const CL=[];const clampAt=(x,y)=>{const was=root,g=into(el('g',{},root));box(x-1.6,y-1.6,21,3.2,3.2,4.6,.6,'dk');into(was);CL.push({g,x,y});};clampAt(-11.8,0);clampAt(0,-11.8);
const SP=[],nozzle=(x,y)=>{cylinder(x,y,21,.9,2.2,'z','metal');const g=el('g',{style:'opacity:0'});for(const k of[-1,0,1]){const e=[x*.42+k*2.4*Math.sign(y),y*.42-k*2.4*Math.sign(x),24],m=[(x+e[0])/2,(y+e[1])/2,34+k*1.5],a=P(x,y,23.4),b=P(...m),q=P(...e);el('path',{d:`M${f2(a[0])},${f2(a[1])}Q${f2(b[0])},${f2(b[1])} ${f2(q[0])},${f2(q[1])}`,class:'water'},g);}SP.push(g);};nozzle(-16.5,-16.5);
into(draw);
// Flame and rocket, which fly together; the flame is cut where the deck hides it.
const flight=el('g',{}),flameG=el('g',{},el('g',{'clip-path':'url(#holeClip)'},flight)),fHalo=el('ellipse',{class:'fhalo',rx:15,ry:22,style:'opacity:0'},flameG);
const fE=el('path',{class:'fe'},flameG),fO=el('path',{class:'fo'},flameG),fI=el('path',{class:'fi'},flameG),fC=el('path',{class:'fc'},flameG),DIA=[0,1,2].map(()=>el('path',{class:'dia'},flameG));
const vehG=into(el('g',{},flight)),rn=x=>Math.sqrt(1600-x*x)-32,rAt=z=>z<=128?8:rn(z-128);
function vane(a){const n=at(1,a+90,0),F=[[8,25],[8,48],[17,34],[17,25.5]],w=s=>F.map(([r,z])=>add(at(r,a,z),n,s)),A=w(.7),B=w(-.7),s=n[0]+n[1];el('path',{d:pd(hull([...A,...B].map(p=>P(...p)))),class:'face side dk'});if(Math.abs(s)>.01)el('path',{d:pd((s>0?A:B).map(p=>P(...p))),class:'face dk'});}
for(const a of[165,285,45]){const c=at(4.3,a,0);solid([rim(1.7,24,16,c[0],c[1]),rim(2.9,18.5,16,c[0],c[1])],'dk');}
vane(-45);vane(135);solid([24,128,131,134,137,140,143,146,149,151].map(z=>rim(rAt(z),z,32)).concat([[P(0,0,152)]]),'hull');
band(8,90,96,'face dk');band(8,118,123.5,'face dk',0,90);el('path',{d:`M${Q(...at(8,-45,118))}${arc(8,135,118,1)}`,class:'detail'});
set(text(group(plane(at(8.05,45,84),tan(45),[0,0,-1])),0,1.6,'LOFTRA','decal'),'transform','rotate(90)');circle(group(plane(at(8.05,20,110),tan(20),[0,0,-1])),0,0,.9,'face dk');
const ZS=[24,90,128,131,134,137,140,143,146,149,151.5],shadeD=(a0,a1)=>pd([...ZS.map(z=>P(...at(rAt(z),a0,z))),...ZS.slice().reverse().map(z=>P(...at(rAt(z),a1,z)))]);
el('path',{d:shadeD(-45,-14),class:'shade'});el('path',{d:shadeD(-45,12),class:'shade',style:'opacity:.035'});set(wire([at(8,114,30),at(8,114,125)],'shine'),'stroke-width','.8');vane(45);
into(draw);
// In front of the rocket: the near clamps, nozzles and sprays; the jet from the trench mouth.
const mlpF=into(el('g',{}));clampAt(11.8,0);clampAt(0,11.8);nozzle(16.5,-16.5);nozzle(-16.5,16.5);nozzle(16.5,16.5);into(draw);
const jetG=group(FRONT(60,0,4.4)),jet=el('path',{class:'jet'},jetG),jetHalo=el('ellipse',{cx:14,cy:0,rx:18,ry:9,class:'fhalo',style:'opacity:0'},jetG);
const smF=el('g',{class:'smoke'}),glowF=el('ellipse',{class:'fire',style:'opacity:0'});{const c=P(14,4,20);set(glowF,'cx',f2(c[0]));set(glowF,'cy',f2(c[1]));set(glowF,'rx',78);set(glowF,'ry',46);}
// Countdown board: posts, cabinet, four flip cards (T, sign, two digits), ten lamps, a range beacon.
for(const x of[-52,-27])box(x,49,9,2,2,13,.5,'dk');box(-58,48,22,38,3,21,1.6,'dk');const bd=group(FRONT(-58,51,43));rect(bd,1.4,1.4,35.2,18.2,1.2,'face screen');
function half(g,clip){const h=el('g',{'clip-path':`url(#${clip})`},g);rect(h,0,0,6.6,11,.9,'card');return{h,t:text(h,3.3,8.6,'','digit')};}
const CARDS=[0,1,2,3].map(i=>{const g=group(`translate(${f2(4.45+i*7.5)} 2.6)`,bd),c={a:half(g,'cardT'),b:half(g,'cardB'),fa:half(g,'cardT'),fb:half(g,'cardB'),cur:'',to:'',q:null,k:1};line(g,0,5.5,6.6,5.5,'split');return c;});
const SEG=[...Array(10)].map((_,i)=>{const n=rect(bd,4.75+i*2.9,15.4,2.4,1.9,.4,'seg');n._c='';return n;});
cylinder(-23,49.5,43,1.4,1.2,'z','dk');const bb=cylinder(-23,49.5,44.2,1.1,1.5,'z','glass'),rLamp=lamp(bb.face,0,0,.9),rp=P(-23,49.5,45.2),rHalo=el('circle',{cx:f2(rp[0]),cy:f2(rp[1]),r:7,class:'halo'});
frame([[-60,-60,0,120,120,9],[-45,-9,9,18,18,192],[-36,0,214,0,0,0],[-58,48,0,38,3,45],[76,-40,0,20,20,60],[-22,-112,0,44,52,9],[60,-6,0,62,12,12]],6);
const VB=svg.getAttribute('viewBox').split(' ').map(Number);
{const g=el('linearGradient',{id:'skyG',gradientUnits:'userSpaceOnUse',x1:0,y1:f2(VB[1]+2),x2:0,y2:f2(VB[1]+60)},dfs);el('stop',{offset:0,'stop-color':'#000'},g);el('stop',{offset:1,'stop-color':'#fff'},g);const m=el('mask',{id:'sky',maskUnits:'userSpaceOnUse',x:f2(VB[0]-60),y:f2(VB[1]-600),width:f2(VB[2]+120),height:f2(VB[3]+700)},dfs);el('rect',{x:f2(VB[0]-60),y:f2(VB[1]-600),width:f2(VB[2]+120),height:f2(VB[3]+700),fill:'url(#skyG)'},m);}
// Controls: the rocket launches; the board launches, or aborts a count.
const rocketBtn=button(el('g',{}),{'aria-label':'Launch the rocket (Space)'});{const a=P(0,0,22),b=P(0,0,154);rect(rocketBtn,-23,b[1]-4,46,a[1]-b[1]+12,6,'hit');rect(rocketBtn,-24.5,b[1]-5.5,49,a[1]-b[1]+15,7,'focus-ring');}
const boardBtn=button(el('g',{}),{'aria-label':'Launch (Space)'});{const q=[[-58.6,51.2,43.6],[-19.4,51.2,43.6],[-19.4,51.2,21.4],[-58.6,51.2,21.4]];el('path',{d:poly(q,true),class:'hit'},boardBtn);el('path',{d:poly(q,true),class:'focus-ring'},boardBtn);}
// State: the count, ignition, flight, the pad clearing, the rollout; progress, finishing; smoke; audio after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),dark=matchMedia('(prefers-color-scheme: dark)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),say=m=>{announcement.textContent=m;};
let trailZ=null,mode='own',fin=0,target=0,ph='pad',pt=0,cT0=null,igT0=0,liftT=0,thrust=0,veh=1,dist=0,clampOpen=0,arm=[0,0],armT=[0,0],del=0,delA=0,bv=10,bt=10,fast=0,H=0,VS=0,PHI=0,FX=0,note='',noteT=0,lastUI=-1,lt=0,now=0,nextVent=0,ac=null,roar=null,wasRed=null;
const fmt=v=>`T${v<0?'+':'–'}${String(Math.abs(v)).padStart(2,'0')}`;
// Smoke: a pool of puffs living in world space, each a lit soft sphere that grows, drifts on the wind and fades.
const WIND=[5,-5,0],POOL=Array.from({length:150},()=>({n:el('circle',{class:'puff',r:0,style:'display:none'},smF),age:1,life:0}));let pf=0;const acc={};
function spawn(x,y,z,vx,vy,vz,r0,gr,life,a,drag=1.6,lift=5){let p=null;for(let k=0;k<POOL.length&&!p;k++){const q=POOL[(pf+k)%POOL.length];if(q.age>=q.life){p=q;pf=(pf+k+1)%POOL.length;}}if(!p)return;Object.assign(p,{x,y,z,vx,vy,vz,r0,gr,life,a,drag,lift,age:0});(x+y>0?smF:smB).appendChild(p.n);p.n.style.display='';}
function emit(key,rate,dt,fn){acc[key]=(acc[key]||0)+rate*dt;while(acc[key]>=1){acc[key]--;fn();}}
const jetPuff=k=>spawn(61,(R()-.5)*10,2+R()*6,(45+R()*35)*k,(R()-.5)*30,R()*12,3.4+R()*2.5,10+R()*5,3.6+R()*2,.95);
const basePuff=()=>{const a=R()*360,p=at(21+R()*3,a,21+R()*3),v=at(22+R()*26,a,0);spawn(p[0],p[1],p[2],v[0],v[1],5+R()*10,5+R()*3,9+R()*4,4.2+R()*2.4,.95,1.3);};
const trailPuff=(x,y,z)=>spawn(x+(R()-.5)*4,y+(R()-.5)*4,z,(R()-.5)*7,(R()-.5)*7,-3-R()*6,4.6+R()*1.8,5.5+R()*2.5,4.2+R()*2.4,.62+R()*.18,1.2,1.5);
const ventPuff=()=>spawn(7.6+R(),2.8+R(),110+R()*2,7+R()*4,(R()-.5)*3,-1.5-R()*2,1.1,2.4+R(),2+R(),.75,1.4,-1);
const linger=k=>spawn(58+R()*8,(R()-.5)*8,3+R()*4,6+R()*8,(R()-.5)*5,3+R()*4,3,4.5,3.5+R()*1.5,.38*k,1.2,2.5);
function stepPuffs(dt){for(const p of POOL){if(p.age>=p.life)continue;p.age+=dt;if(p.age>=p.life){p.n.style.display='none';continue;}const k=Math.exp(-p.drag*dt);p.vx=p.vx*k+WIND[0]*(1-k);p.vy=p.vy*k+WIND[1]*(1-k);p.vz=p.vz*k+p.lift*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z=Math.max(6,p.z+p.vz*dt);}}
function drawPuffs(){for(const p of POOL){if(p.age>=p.life)continue;const s=P(p.x,p.y,p.z),r=(p.r0+p.gr*Math.pow(p.age,.65))*1.2247,o=p.a*Math.min(1,p.age/.18)*Math.pow(1-p.age/p.life,1.4)*clamp((s[1]-VB[1]-4)/46);set(p.n,'cx',f2(s[0]));set(p.n,'cy',f2(s[1]));set(p.n,'r',f2(r));p.n.style.opacity=f2(o);}}
const clearPuffs=()=>{for(const p of POOL){p.age=p.life=1;p.n.style.display='none';}};
// Reduced motion: the cloud of a moment, simulated once and held still.
function still(kind){clearPuffs();for(let i=0;i<48;i++){const dt=1/30;if(kind==='ign')emit('j',20,dt,()=>jetPuff(1));else{emit('j',12,dt,()=>jetPuff(1));emit('b',14,dt,basePuff);}stepPuffs(dt);}drawPuffs();}
const flying=()=>ph==='flight'||ph==='clear';
function go(p){ph=p;pt=now;lastUI=-1;set(boardBtn,'aria-label',p==='ign'||p==='pad'&&(cT0!=null||fin===1)?'Abort the countdown (Esc)':'Launch (Space)');if(reduced.matches&&(p==='ign'||p==='flight'))still(p);}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac)ac=new A();if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,v,d,w=0,type='sine'){if(!ac)return;try{const t=ac.currentTime+w,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.05);}catch(_){}}
function rumble(v){if(!ac)return;try{if(!roar){const n=ac.sampleRate*2,b=ac.createBuffer(1,n,ac.sampleRate),d=b.getChannelData(0);let l=0;for(let i=0;i<n;i++){l=(l+.02*(Math.random()*2-1))/1.02;d[i]=l*3.5;}const s=ac.createBufferSource(),f=ac.createBiquadFilter();s.buffer=b;s.loop=true;f.type='lowpass';f.frequency.value=320;roar=ac.createGain();roar.gain.value=0;s.connect(f);f.connect(roar);roar.connect(ac.destination);s.start();}roar.gain.setTargetAtTime(v,ac.currentTime,.25);}catch(_){}}
const counting=()=>ph==='ign'||ph==='pad'&&(cT0!=null||fin===1);
function sync(){set(boardBtn,'aria-label',counting()?'Abort the countdown (Esc)':'Launch (Space)');lastUI=-1;}
function reset(){if(reduced.matches){veh=1;dist=0;clampOpen=0;clearPuffs();go('pad');}else go('out');}
function launch(){audio();if(ph==='rest'){fin=0;mode='own';reset();say('A fresh rocket rolls out to the pad.');sync();return;}
if(ph!=='pad'||fin||mode==='own'&&cT0!=null)return;cT0=now-(mode==='own'?0:(10-clamp(bv,0,10))*1000);mode='own';tone(880,.012,.08);say(`Countdown started. T minus ${clamp(bv,0,10)}.`);sync();}
function abort(){audio();if(ph==='ign'||ph==='pad'&&(cT0!=null||fin===1||mode!=='own')){const hot=ph==='ign';cT0=null;mode='own';fin=0;if(hot)go('pad');note=hot?'ABORT · ENGINES SAFE · ARMS IN':'ABORT · ARMS SWINGING BACK';noteT=now+2400;tone(330,.014,.12);tone(220,.014,.3,.12);say(hot?'Abort. Engines shut down, the arms swing back.':'Abort. The arms swing back.');sync();}else if(flying())say('Too late to abort: the rocket has left the pad.');}
function setProgress(p){fin=0;if(ph==='ign')go('pad');cT0=null;if(p==null||!isFinite(p))mode='ind';else{mode='det';target=clamp(+p);}if(ph==='rest')reset();sync();}
function finish(){audio();if(fin)return;fin=1;say('Go for launch: the count runs out and the rocket lifts off.');sync();}
function stepKey(){audio();setProgress(mode==='det'&&!fin?(target>=1?0:Math.min(1,Math.floor(target*4+1e-6)/4+.25)):.25);say(`Progress ${Math.round(target*100)} percent: T minus ${10-Math.floor(9*target+1e-9)}.`);}
window.figure={setProgress,done:finish};
bind(rocketBtn,launch);bind(boardBtn,()=>counting()?abort():launch());
const act={' ':launch,escape:abort,p:stepKey,enter:finish};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const k=e.key.toLowerCase();if((k==='enter'||k===' ')&&e.target.closest&&e.target.closest('button,[role=button]'))return;if(act[k]){e.preventDefault();act[k]();}});
// The board: a card flips its top half down onto the new top, then the new bottom half down over the old.
function paint(c){const k=c.k;if(k>=1){c.a.t.textContent=c.b.t.textContent=c.cur;c.fa.h.style.display=c.fb.h.style.display='none';return;}c.a.t.textContent=c.to;c.b.t.textContent=c.cur;c.fa.t.textContent=c.cur;c.fb.t.textContent=c.to;
c.fa.h.style.display=k<.5?'':'none';c.fb.h.style.display=k<.5?'none':'';set(c.fa.h,'transform',`translate(0 5.5) scale(1 ${f2(Math.max(.01,1-2*k))}) translate(0 -5.5)`);set(c.fb.h,'transform',`translate(0 5.5) scale(1 ${f2(Math.max(.01,2*k-1))}) translate(0 -5.5)`);}
function show(v,instant){const n=Math.abs(v),ch=['T',v<0?'+':'–',String(Math.floor(n/10)%10),String(n%10)];CARDS.forEach((c,i)=>{if(ch[i]===(c.k<1?c.to:c.cur))return;if(instant||!c.cur){c.cur=c.to=ch[i];c.k=1;c.q=null;}else if(c.k<1)c.q=ch[i];else{c.to=ch[i];c.k=0;}paint(c);});}
show(10,true);
function ui(){const T=fmt(bv),pc=Math.round(target*100);
readout.textContent=ph==='rest'?'PROGRESS 100% · IN ORBIT':flying()?`${T} · ALT ${Math.round(H*.4)} M · ${Math.round(VS*1.44)} KM/H`:ph!=='pad'?`${T} · ALT 0 M · 0 KM/H`:fin?`PROGRESS 100% · ${T}`:mode==='det'?`PROGRESS ${pc}% · ${T}`:mode==='ind'?`${T} · HOLD · FUELING`:`${T} · ALT 0 M · 0 KM/H`;
const c=cT0==null?0:(now-cT0)/1000,swing=Math.abs(arm[0]-armT[0])+Math.abs(arm[1]-armT[1])>.01;
stateLabel.textContent=now<noteT?note:ph==='rest'?'COMPLETE · IN ORBIT':ph==='ign'?'IGNITION · THRUST BUILDING':ph==='flight'?(H<150?'LIFTOFF · CLEARING THE TOWER':'ASCENT · PITCHING DOWNRANGE'):ph==='clear'?'PAD CLEAR · VEHICLE IN FLIGHT':ph!=='pad'?'ROLLOUT · NEXT VEHICLE':fin?'FINISHING · GO FOR LAUNCH':mode==='ind'?'FUELING · HOLD AT T–10':mode==='det'?(target>=1?'HOLDING · AWAITING GO':bv!==bt?`COUNTING DOWN TO ${fmt(bt)}`:`HOLDING AT ${T} · ${pc}%`):cT0!=null?(c<2?'COUNTDOWN · GO FOR LAUNCH':swing?'COUNTDOWN · ARMS SWINGING AWAY':c<7?'COUNTDOWN · ARMS CLEAR':'COUNTDOWN · WATER DELUGE ON'):swing?'ARMS SWINGING IN':'READY · SPACE TO LAUNCH';
lastUI=now;}
const plume=(w,y0,L)=>`M${f2(-w)},${f2(y0)}C${f2(-w*1.24)},${f2(y0+L*.28)} ${f2(-w*.78)},${f2(y0+L*.62)} 0,${f2(y0+L)}C${f2(w*.78)},${f2(y0+L*.62)} ${f2(w*1.24)},${f2(y0+L*.28)} ${f2(w)},${f2(y0)}Z`;
function tick(t){const dt=Math.min(.05,Math.max(0,(t-(lt||t))/1000)),red=reduced.matches,glowK=dark.matches?1:.72;if(!lt)nextVent=t+1400;lt=now=t;const age=()=>(now-pt)/1000,c=cT0==null?0:(now-cT0)/1000;
if(wasRed!==red){if(wasRed!==null&&red){clearPuffs();if(ph==='ign'||ph==='flight')still(ph);}wasRed=red;}
// Targets for the pad: the count, the arms, the deluge; ignition when the count or the finish calls for it.
if(ph==='pad'){fast=fin===1;if(fin===1){bt=0;armT=[1,1];del=1;if(bv===0&&!CARDS.some(k=>k.k<1)&&arm[0]>.98&&arm[1]>.98){igT0=now;cT0=null;go('ign');say('Ignition.');}}
else if(mode==='det'){bt=10-Math.floor(9*target+1e-9);armT=[target>=.25?1:0,target>=.55?1:0];del=target>=.85?1:0;}
else if(mode==='ind'){bt=10;armT=[0,0];del=0;}
else if(cT0!=null){bt=Math.max(0,10-Math.floor(c));armT=[c>=2?1:0,c>=4?1:0];del=c>=7?1:0;if(c>=8.2){igT0=cT0+8200;go('ign');say('Ignition.');}}
else{bt=10;armT=[0,0];del=0;}}
if(ph==='ign'){armT=[1,1];del=1;bt=cT0!=null?Math.max(0,10-Math.floor(c)):0;if(now-igT0>=1800){liftT=now;FX=0;cT0=null;trailZ=null;clampOpen=red?1:0;go('flight');tone(1320,.014,.4);say('Liftoff.');}}
if(flying()){const ft=(now-liftT)/1000;H=4*ft*ft+2.2*ft**3;VS=8*ft+6.6*ft*ft;PHI=5*ease((ft-1.4)/2.6);if(!red)FX+=VS*Math.sin(PHI*RAD)*dt;bt=-Math.floor(ft);armT=[1,1];del=ft<3?1:0;
if(ph==='flight'&&ft>=5.2){veh=0;thrust=0;if(fin){fin=2;go('rest');say('Complete. The rocket is on its way to orbit.');}else go('clear');}else if(ph==='clear'&&age()>=3){if(fin){fin=2;go('rest');say('Complete. The rocket is on its way to orbit.');}else reset();}}
if(ph==='out'){dist=95*ease(age()/1.8);bt=10;if(age()>=1.8){veh=1;clampOpen=0;go('in');}}
if(ph==='in'){dist=95*(1-out3(age()/3));bt=10;if(age()>=3){dist=0;go('pad');say(fin?'Fresh rocket on the pad. Go for launch.':'A fresh rocket is on the pad.');}}
if(ph==='rest'){armT=[1,1];del=0;}
// Thrust, arms, deluge, clamps.
const thr=ph==='ign'?(red?1:ease((now-igT0)/1500)):ph==='flight'?1:0;thrust=red?thr:thr>=thrust?thr:Math.max(thr,thrust-dt*2.6);
for(const i of[0,1])arm[i]=red?armT[i]:arm[i]+clamp(armT[i]-arm[i],-dt/(fast?.7:1.3),dt/(fast?.7:1.3));
delA=red?del:delA+clamp(del-delA,-dt*1.5,dt*3);if(ph==='flight')clampOpen=red?1:Math.min(1,clampOpen+dt/.3);
// The board chases its target: a step at a time counting down, in one flip otherwise.
if(!CARDS.some(k=>k.k<1)&&bv!==bt){const step=!red&&bt<bv&&bv-bt<=12;bv=step?bv-1:bt;show(bv,red);if(cT0!=null&&ph!=='flight')tone(bv?660:990,.01,.07);}
for(const k of CARDS)if(k.k<1){k.k=Math.min(1,k.k+dt/(fast?.11:.24));if(k.k>=1){k.cur=k.to;if(k.q!=null){k.to=k.q;k.q=null;k.k=0;}}paint(k);}
// The vehicle: on the pad, rolling out and back, or climbing out of the frame on its flame.
let vt='';if(ph==='flight'){const h=red?56:H,phi=red?1.5:PHI,x=red?2:FX;vt=`translate(${f2(x)} ${f2(-h)}) rotate(${f2(phi)} 0 -24)`;}else if(dist>0){const o=P(0,-dist,0);vt=`translate(${f2(o[0])} ${f2(o[1])})`;}
if(ph==='ign'&&!red&&thrust>.05){const j=.4*thrust;vt=`translate(${f2((R()-.5)*j)} ${f2((R()-.5)*j)})`;}
put(vehG,'transform',vt);put(flameG,'transform',vt);vis(vehG,veh);put(flight,'mask',ph==='flight'&&!red?'url(#sky)':null);
const mt=dist>0?`translate(${f2(P(0,-dist,0)[0])} ${f2(P(0,-dist,0)[1])})`:'',fade=f2(1-clamp((dist-40)/50));for(const g of[mlpG,mlpF]){put(g,'transform',mt);op(g,fade);}op(flight,fade);
for(const k of CL)put(k.g,'transform',`translate(${f2(P(k.x*.16*clampOpen,k.y*.16*clampOpen,-.6*clampOpen)[0])} ${f2(P(k.x*.16*clampOpen,k.y*.16*clampOpen,-.6*clampOpen)[1])})`);
// Flame: a plume under the bells with its core and shock diamonds, long in flight, short and buried in the hole on the pad.
const lo=ph==='flight'?clamp(1-(red?56:H)/90):1;if(thrust>.01){const fl=red?0:Math.sin(t/23)*.05+Math.sin(t/7.3+1)*.035+(R()-.5)*.05,L=(ph==='flight'?34+Math.min(36,(red?56:H)*.3):8+22*thrust)*(1+fl),W=7.4*(.82+.18*thrust)*(1+fl*.4);
set(fE,'d',plume(W*1.3,-20.5,L*1.12));set(fO,'d',plume(W,-19.5,L));set(fI,'d',plume(W*.66,-19.5,L*.72));set(fC,'d',plume(W*.42,-19.5,L*.46));DIA.forEach((d,i)=>{const y=-19.5+L*(.13+.11*i),s=1.7-.35*i;set(d,'d',`M0,${f2(y-s*1.5)}L${f2(s)},${f2(y)}L0,${f2(y+s*1.5)}L${f2(-s)},${f2(y)}Z`);d.style.opacity=f2((ph==='flight'?.85:.4)*(red?1:.75+.25*Math.sin(t/31+i*2)));});
set(fHalo,'cy',f2(-19.5+L*.4));op(fHalo,f2(.55*thrust*glowK));vis(flameG,1);}else vis(flameG,0);
const burn=thrust*lo;op(poolL,f2(burn*.85*glowK));op(slotGlow,f2(burn*.7));op(holeGlow,f2(thrust*(ph==='flight'?lo:1)*.9));op(glowF,f2(thrust*clamp(1-(ph==='flight'?(red?56:H):0)/130)*.5*glowK));
const jk=thrust*(ph==='flight'?clamp(1-(red?56:H)/70):1),jl=(10+26*jk)*(red?1:1+Math.sin(t/19)*.08);put(jet,'d',jk>.01?`M0,-3.3C7,-4.8 ${f2(jl*.6)},-3.4 ${f2(jl)},0C${f2(jl*.6)},3.4 7,4.8 0,3.3Z`:'');op(jetHalo,f2(jk*.6*glowK));
// Smoke: the trench jet, the cloud rolling off the deck, the trail, vents on the pad, steam lingering after.
if(!red){if(thrust>.05&&ph!=='rest')emit('j',17*jk,dt,()=>jetPuff(Math.max(.35,jk)));
if(ph==='flight'){const h=H,z=h+19.5-.72*(34+Math.min(36,h*.3));if(h>2&&h<75)emit('b',20*(1-h/75),dt,basePuff);if(h>6&&-z>VB[1]-20){if(trailZ==null)trailZ=z;while(trailZ<z){trailPuff(FX/1.732,-FX/1.732,trailZ);trailZ+=4.2;}}}
{const a=ph==='clear'?age():ph==='out'?3+age():ph==='rest'?age():9;if(a<6)emit('l',5*Math.exp(-a/2.2),dt,()=>linger(Math.exp(-a/3)));}
if(ph==='pad'&&veh&&thrust<.05&&now>=nextVent){nextVent=now+(mode==='ind'?850:1700+R()*1100);const n=mode==='ind'?4:3;for(let i=0;i<n;i++)ventPuff();}
stepPuffs(dt);drawPuffs();}
else if(ph==='pad'&&thrust<=0&&POOL.some(p=>p.age<p.life))clearPuffs();
// Sprays, fuel flow, lamps and the board's lamps.
for(const g of SP){op(g,f2(delA));if(!red&&delA>0)for(const p of g.children)set(p,'stroke-dashoffset',f2(-t/60%18));}
if(fuels.length){const on=ph==='pad'&&mode==='ind'&&!fin;for(const f of fuels){op(f,on?'1':'0');if(on&&!red)set(f,'stroke-dashoffset',f2(-t/45%36));}}
const blink=red||t%1600<520;lit(bLamp,blink?'r':'');put(bHalo,'class','halo'+(blink?' r':''));const hotRange=counting()||ph==='flight',rb=hotRange&&(red||t%700<350);lit(rLamp,rb?'a':'');put(rHalo,'class','halo'+(rb?' a':''));
const on=ph==='rest'||flying()?10:ph!=='pad'&&ph!=='ign'?0:mode==='det'&&!fin?Math.round(target*10):cT0!=null||fin||ph==='ign'?10-clamp(bv,0,10):0,col=ph==='rest'||flying()?'g':'a',ch=red?0:(t/110)%18,cp=ch<9?ch:18-ch;
SEG.forEach((s,i)=>lit(s,ph==='pad'&&mode==='ind'&&!fin?(red?(i%2?'':'b'):Math.abs(i-cp)<1.3?'b':''):i<on?(mode==='det'&&!fin&&target>=1&&i===9&&!red&&t%1000<400?'':col):'','seg'));
// Arms: rebuilt only when they turn.
drawArms();
if(ac)rumble(thrust>.05?(.02+.03*thrust)*(ph==='flight'?clamp(1-(now-liftT)/6000):1):0);
if(lastUI<0||t-lastUI>120)ui();
requestAnimationFrame(tick);}
drawArms();sync();ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [' ', 'escape', 'p', 'enter'], draw }
