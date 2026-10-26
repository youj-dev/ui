// @ts-nocheck
/* TWILLBY G–5 · Gumball machine. Drawn for this kit on the shared engine, in the manner of the lab files: its stylesheet,
 * defs and script. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--en:#d9473c;--en-top:#ea6c60;--en-side:#b3362d;--chrome:#d9dad8;--chrome-top:#f4f4f2;--chrome-side:#bdbebc;--coin:#d4a548;--coin-top:#ecc777;--plaque:#f6f0de;--script:#9c2c24;--mouth:#2a2423;--g0:#e8453c;--g1:#f39a2b;--g2:#f4c83a;--g3:#2bb784;--g4:#4d6bfe;--g5:#9a63df;--g6:#f07fb0;--g7:#f6f1e2;--glass-a:.32;--film:#ffffff;--film-a:.5;--glint:.85}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--line:#444443;--en:#b73a31;--en-top:#db6559;--en-side:#7e231d;--chrome:#b7b7b6;--chrome-top:#e4e4e2;--chrome-side:#858585;--coin:#b28a3b;--coin-top:#ddba6f;--plaque:#cfcabb;--script:#7e231d;--mouth:#121010;--g0:#d94037;--g1:#e39028;--g2:#e4bb36;--g3:#28ab7b;--g4:#4764ee;--g5:#905cd1;--g6:#e176a4;--g7:#e6e1d3;--glass-a:.12;--film:#f4f3ef;--film-a:.34;--glint:.7}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
.enamel{fill:var(--en)}.top.enamel{fill:var(--en-top)}.side.enamel{fill:var(--en-side)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.coin{fill:var(--coin)}.top.coin{fill:var(--coin-top)}.mouth{fill:var(--mouth);stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke}
.ring{fill:none;stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke;opacity:.45}.hi{fill:none;stroke:#fff;stroke-width:1.1;stroke-linecap:round;opacity:.55;pointer-events:none}.hi.soft{stroke-width:2.6;opacity:.22}
.plaque{fill:var(--plaque);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.script{fill:var(--script);font:italic 700 4.1px Georgia,'Times New Roman',serif;letter-spacing:.25px;text-anchor:middle;stroke:none}
.rail-u{fill:none;stroke:var(--line);stroke-width:2.5;stroke-linecap:round;stroke-linejoin:round}.rail{fill:none;stroke:var(--chrome-top);stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}.strut-u{fill:none;stroke:var(--line);stroke-width:1.9;stroke-linecap:round}.strut{fill:none;stroke:var(--chrome);stroke-width:.8;stroke-linecap:round}
.gum{stroke:var(--line);stroke-width:.5;stroke-opacity:.75;vector-effect:non-scaling-stroke}.g0{fill:var(--g0)}.g1{fill:var(--g1)}.g2{fill:var(--g2)}.g3{fill:var(--g3)}.g4{fill:var(--g4)}.g5{fill:var(--g5)}.g6{fill:var(--g6)}.g7{fill:var(--g7)}.shade{fill:url(#gumShade);pointer-events:none}
.glass-back{fill:var(--glass);fill-opacity:var(--glass-a);stroke:none}.glass-film{fill:url(#glassFilm);stroke:none;pointer-events:none}.rim{fill:none;stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke}.rim-in{fill:none;stroke:#fff;stroke-width:.8;opacity:.5;vector-effect:non-scaling-stroke}
.glint{fill:none;stroke:#fff;stroke-linecap:round;opacity:var(--glint);pointer-events:none}.glint.wide{stroke-width:5.5;opacity:calc(var(--glint)*.42);filter:url(#soft)}.glint.thin{stroke-width:1.5;opacity:calc(var(--glint)*.5)}.spec{fill:#fff;opacity:var(--glint);pointer-events:none}
.knob{fill:url(#knobShade);stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke}.crank{cursor:grab;touch-action:none}.dragging,.dragging .crank{cursor:grabbing}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="gumShade" cx=".5" cy=".5" r=".5" fx=".34" fy=".3"><stop offset="0" stop-color="#fff" stop-opacity=".8"/><stop offset=".22" stop-color="#fff" stop-opacity=".2"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#000" stop-opacity=".1"/><stop offset="1" stop-color="#000" stop-opacity=".26"/></radialGradient>
<radialGradient id="glassFilm" cx=".5" cy=".5" r=".5"><stop offset=".62" style="stop-color:var(--film)" stop-opacity="0"/><stop offset=".86" style="stop-color:var(--film)" stop-opacity=".1"/><stop offset=".97" style="stop-color:var(--film);stop-opacity:var(--film-a)"/><stop offset="1" style="stop-color:var(--film);stop-opacity:var(--film-a)"/></radialGradient>
<radialGradient id="knobShade" cx=".5" cy=".5" r=".6" fx=".36" fy=".3"><stop offset="0" style="stop-color:var(--chrome-top)"/><stop offset=".6" style="stop-color:var(--chrome)"/><stop offset="1" style="stop-color:var(--chrome-side)"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,addEventListener,kit}=env;
/* TWILLBY G–5 spiral gumball machine. World: x lower-right; y lower-left (front faces +y); z up. 1 unit ≈ 2 mm.
Part                          x      y      z      w      d      h
foot (cast, a step on it) c 60 · 60: r 38 × 5, r 33 × 4
centre post               c 60 · 60: r 4.5, z 9–70
spiral run (two wires)    r 24 ± 3.6 round the post, 1¾ turns from z 60 (front) down to z 22 (right), struts every quarter
straight run              84     60–103  22–13                     into the door hood, out through the flap
door hood                 73     82      0     22     18     28   flap 14 × 14 hinged at z 23.5, the opening behind it
cup                       69    100      0     30     21      7   holds the last few gumballs
housing (cast)            c 60 · 60: r 32, z 70–100; a short chute under it at (60, 84)
coin plate                45     87     71     30      7     28   coin slot on top, crank (r 13) at z 89, maker's plaque
collar                    c 60 · 60: r 27, z 100–105
globe (glass)             c 60 60 138.8: r 42, gumballs r 5.5 on the collar plate
cap (cast)                c 60 · 60: r 21 × 5, r 15 × 3.5, knob r 4 at z 190
Motion: a coin drops into the slot; a full turn of the crank lets one gumball out under the housing. It drops onto the
wires, rolls down the spiral (gravity along the slope, a little drag, riding out on the bends), runs straight into the
hood, swings the flap open and drops into the cup. Depth: the spiral is split into back and front halves around the
post, and a rolling ball is moved between them. */
const svg=document.getElementById('machine'),base=document.getElementById('drawing');let root=base;
const{C,S,P,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,wire,box,cylinder,frame}=kit(()=>root);
const{cos,sin,PI,sqrt,hypot,max,min,abs,atan2,asin}=Math,RAD=PI/180,K=sqrt(1.5),f2=v=>(+v).toFixed(2).replace(/^-(0\.0+)$/,'$1'),into=g=>root=g,clamp=(v,a=0,b=1)=>max(a,min(b,v));
const plane=(o,U,V)=>`matrix(${[...P(...U),...P(...V),...P(...o)].map(f2).join(' ')})`;
const at=(p)=>`translate(${f2(P(...p)[0])} ${f2(P(...p)[1])})`;
function pin(g,x,y,r=.8){circle(g,x,y,r,'face top chrome');line(g,x-r*.5,y+r*.35,x+r*.5,y-r*.35);}
const ctl=(g,label)=>{for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0','aria-label':label}))set(g,k,v);return g;};
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
const X=60,Y=60,BR=5.5,BS=BR*K,LIFT=sqrt(BR*BR-3.6*3.6);
// A front arc round the vertical axis (the half the viewer sees), for turned rings; a sheen streak down a turned part.
const arc=(r,z,cls)=>{const pts=[];for(let a=-45;a<=135.01;a+=7.5)pts.push([X+r*cos(a*RAD),Y+r*sin(a*RAD),z]);return wire(pts,cls);};
const streak=(r,a,z0,z1,cls='hi')=>wire([[X+r*cos(a*RAD),Y+r*sin(a*RAD),z0],[X+r*cos(a*RAD),Y+r*sin(a*RAD),z1]],cls);
const R=24,ZT=60,ZB=22,TURNS=1.75,HB=70,HT=100,HR=32,PY=Y+27,PZ=71,CZ=89,SLOT_Y=PY+3.8,CR=HT+5,GW=42,GZ=CR+sqrt(GW*GW-25*25),CAPZ=175;
const DF=svg.querySelector('defs');
// The ground: a soft shadow (the dark stage's lit floor) and a contact shadow under the foot and the cup.
const sh=P(X+9,Y+14,0);for(const c of['shadow stage-floor','stage-contact'])el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]),rx:62,ry:31,class:c});
// The foot: a low casting with a step, a turned ring on each.
const foot=cylinder(X,Y,0,38,5,'z','enamel');circle(foot.face,0,0,35.5,'ring');cylinder(X,Y,5,33,4,'z','enamel');arc(28,9.02,'ring');
// The spiral: two wires round the post, back halves first, then the post, then the front halves; a rolling gumball
// is moved into whichever half it's on. Struts hold the wires every quarter turn.
const SPAN=TURNS*2*PI,LH=hypot(SPAN*R,ZT-ZB),SLOPE_H=(ZT-ZB)/LH;
const RUN0=[X+R,Y,ZB],RUN1=[X+R,Y+43,13],RL=hypot(RUN1[1]-RUN0[1],RUN0[2]-RUN1[2]),SLOPE_R=(RUN0[2]-RUN1[2])/RL;
const helix=(l,dr=0)=>{const s=clamp(l/LH),a=-SPAN*(1-s);return[X+(R+dr)*cos(a),Y+(R+dr)*sin(a),ZT-(ZT-ZB)*s,a];};
const isFront=a=>cos(a)+sin(a)>0;
const L={};for(const k of['bo','bb','bi','post','fi','fb','fo'])L[k]=el('g',{});
function rails(dr,back,front){const segs={b:[],f:[]};let cur=null,side=null;for(let i=0;i<=TURNS*72;i++){const p=helix(i/(TURNS*72)*LH,dr),sd=isFront(p[3])?'f':'b';const q=[p[0],p[1],p[2]];if(sd!==side){if(cur)cur.push(q);cur=[q];segs[sd].push(cur);side=sd;}else cur.push(q);}
cur.push([RUN1[0]+dr,RUN0[1],RUN0[2]],[RUN1[0]+dr,RUN1[1],RUN1[2]]);
for(const[k,g]of[['b',back],['f',front]])for(const cls of['rail-u','rail'])for(const s of segs[k])wire(s,cls,g);}
rails(3.6,L.bo,L.fo);rails(-3.6,L.bi,L.fi);
for(let q=0;q<=TURNS*4;q++){const l=q/(TURNS*4)*LH,o=helix(l,3.6),a=o[3],z=o[2]-1.2,g=isFront(a)?L.fi:L.bo,pts=[[X+4.5*cos(a),Y+4.5*sin(a),z],[o[0],o[1],z]];wire(pts,'strut-u',g);wire(pts,'strut',g);}
into(L.post);const post=cylinder(X,Y,9,4.5,HB-9,'z','chrome');set(post.g.firstChild,'class','face side chrome');streak(4.5,100,11,HB-2);
into(L.fo);cylinder(X,Y+R,ZT+5,6.5,HB-ZT-5,'z','chrome');into(base);
// The door hood over the end of the run: the opening, the flap's hinge rod; then the cup in front of it.
box(X+R-11,Y+22,0,22,18,28,3,'enamel');const HF=group(FRONT(X+R-11,Y+40,28));rect(HF,3,3,16,17,2.5,'face chrome');rect(HF,4,4.5,14,14,2,'mouth');line(HF,3.4,4.5,18.6,4.5);pin(HF,3.4,4.5,1.1);pin(HF,18.6,4.5,1.1);
const trayCtl=ctl(el('g',{}),'Cup: take the gumballs (D)');into(trayCtl);
box(X+R-15,Y+40,0,30,21,7,2.5,'chrome');rect(group(TOP(X+R-15,Y+40,7.02)),2.2,2.2,25.6,16.6,2,'face side chrome');
const trayBalls=el('g',{});
rect(group(FRONT(X+R-15,Y+61,7)),0,0,30,7,2.5,'face chrome');rect(group(SIDE(X+R+15,Y+61,7)),0,0,21,7,2.5,'face side chrome');rect(group(TOP(X+R-15,Y+58.8,7.02)),.4,0,29.2,2.2,1,'face top chrome');
{const g=group(TOP(X+R-15,Y+40,7.2));rect(g,-2,-2,34,25,4,'focus-ring');rect(g,-2,-2,34,25,4,'hit');}
into(base);
const exitG=el('g',{});
const flapG=el('g',{});const FLAP_O=[X+R-7,Y+40.3,23.5];rect(flapG,0,0,14,14,2,'face chrome');line(flapG,2.5,11,11.5,11);
// The housing, its coin plate (slot, crank, maker's plaque), the collar.
cylinder(X,Y,HB,HR,HT-HB,'z','enamel');arc(HR,HB+3,'ring');arc(HR,HT-3,'ring');streak(HR,112,HB+3,HT-3);streak(HR,121,HB+3,HT-3,'hi soft');streak(HR,22,HB+4,HT-4,'hi soft');
box(X-15,PY,PZ,30,7,28,2.5,'chrome');
const PF=group(FRONT(X-15,PY+7,PZ+28));rect(PF,2,2,26,24,1.8,'detail');for(const[u,v]of[[4,4],[26,4],[4,24],[26,24]])pin(PF,u,v,.75);
rect(PF,5,20.4,20,5.2,1.2,'plaque');text(PF,15,24.3,'Twillby','script');
const slotCtl=ctl(el('g',{}),'Coin slot: drop in a coin (C)');{const g=group(TOP(X-15,PY,PZ+28.04),slotCtl);rect(g,7,2.9,16,1.8,.9,'mouth');rect(g,4,.6,22,6,1.6,'focus-ring');rect(g,2,-1,26,9,1.6,'hit');}
// The coin: drawn over the plate, clipped above the slot so it disappears into it.
{const a=P(X-40,SLOT_Y,PZ+28),b=P(X+40,SLOT_Y,PZ+28);el('path',{d:`M${f2(a[0])},${f2(a[1])}L${f2(b[0])},${f2(b[1])}L${f2(b[0])},${f2(b[1]-80)}L${f2(a[0])},${f2(a[1]-80)}Z`},el('clipPath',{id:'coinClip'},DF));}
const coinG=group('',el('g',{'clip-path':'url(#coinClip)'}),{display:'none'});circle(coinG,0,0,6.2,'face coin');circle(coinG,0,0,4.7,'detail');circle(coinG,-1.6,-1.7,1.9,'face top coin');
const hub=cylinder(X,PY+7,CZ,8,3.5,'y','chrome');circle(hub.face,0,0,5.6,'ring');
const crankCtl=ctl(group('',hub.face),'Crank: turn it for a gumball (Space)');set(crankCtl,'class','control crank');
const spins=[0,1,2,3].map(k=>{const g=group('',crankCtl);rect(g,-13.5,-3.6,27,7.2,3.6,k===3?'face top chrome':k===0?'face side chrome':'side chrome');return g;});
const capF=spins[3];line(capF,-10.5,-1.7,10.5,-1.7,'hi');circle(capF,0,0,4.5,'face chrome');pin(capF,0,0,1.6);for(const u of[-10.2,10.2])circle(capF,u,0,1.8,'detail');
circle(crankCtl,-2,2,17,'focus-ring');circle(crankCtl,-2,2,16,'hit');
{const c=cylinder(X,Y,HT,27,CR-HT,'z','chrome');circle(c.face,0,0,24.5,'face chrome');circle(c.face,0,0,9,'face side chrome');}arc(27,HT+2.5,'ring');streak(27,110,HT+1,CR-1);
// The globe: the glass behind, the gumballs (clipped to the inside), the glass in front: a film that whitens only at
// the rim, glints down its left and lower right, a sharp highlight, the rim.
const G=P(X,Y,GZ),GR=GW*K;
el('circle',{cx:f2(G[0]),cy:f2(G[1]),r:f2((GW-1.5)*K)},el('clipPath',{id:'globeClip'},DF));
el('circle',{cx:f2(G[0]),cy:f2(G[1]),r:f2(GR),class:'glass-back'});
const pileG=el('g',{'clip-path':'url(#globeClip)'}),churn=group('',pileG);
let seed=47;const rand=()=>{seed=(seed*16807)%2147483647;return(seed-1)/2147483646;};
function gum(parent){const g=el('g',{},parent);const c=circle(g,0,0,f2(BS),'gum g0');circle(g,0,0,f2(BS),'shade');return{g,c};}
const tint=(b,k)=>{if(b.k!==k){b.k=k;set(b.c,'class','gum g'+k);}};
// The pile: close-packed layers on the collar plate, kept inside the glass; drawn far to near, emptied from the top.
const spots=[];for(let k=0;;k++){const z=CR+BR+k*BR*1.633;if(z>GZ+9)break;const ox=(k%3)*BR,oy=(k%3)*BR/sqrt(3);
for(let i=-8;i<=8;i++)for(let j=-8;j<=8;j++){const x=X+i*2*BR+j*BR+ox,y=Y+j*BR*sqrt(3)+oy;if(hypot(x-X,y-Y,z-GZ)<=GW-1.5-BR-.3)spots.push([x+(rand()-.5)*1.2,y+(rand()-.5)*1.2,z+(rand()-.5)*.8]);}}
spots.sort((a,b)=>a[0]+a[1]+a[2]-(b[0]+b[1]+b[2]));
const pile=spots.map(p=>{const b=gum(churn);b.p=p;b.r=p[2]+rand()*3;tint(b,Math.floor(rand()*8));set(b.g,'transform',at(p));b.vis=true;return b;});
const CAP=pile.length,order=[...pile].sort((a,b)=>b.r-a.r);order.forEach((b,i)=>b.rank=i);
el('circle',{cx:f2(G[0]),cy:f2(G[1]),r:f2(GR),class:'glass-film'});
const gp=(a,r)=>`${f2(G[0]+r*cos(a*RAD))},${f2(G[1]+r*sin(a*RAD))}`,glint=(a0,a1,r,cls)=>el('path',{d:`M${gp(a0,GR*r)}A${f2(GR*r)},${f2(GR*r)} 0 0 1 ${gp(a1,GR*r)}`,class:'glint '+cls});
glint(148,212,.8,'wide');glint(156,196,.87,'thin');glint(14,58,.87,'thin');
{const c=[G[0]+GR*.6*cos(222*RAD),G[1]+GR*.6*sin(222*RAD)].map(f2);el('ellipse',{cx:c[0],cy:c[1],rx:4,ry:2.2,transform:`rotate(-45 ${c[0]} ${c[1]})`,class:'spec'});}
el('circle',{cx:f2(G[0]),cy:f2(G[1]),r:f2(GR-1.4),class:'rim-in'});el('circle',{cx:f2(G[0]),cy:f2(G[1]),r:f2(GR),class:'rim'});
// The cap: lifts to refill.
const capCtl=ctl(el('g',{}),'Cap: lift it to refill the globe (R)');const capLift=group('',capCtl);into(capLift);
cylinder(X,Y,CAPZ,21,5,'z','enamel');arc(18,CAPZ+5.02,'ring');streak(21,116,CAPZ+1,CAPZ+4);cylinder(X,Y,CAPZ+5,15,3.5,'z','enamel');cylinder(X,Y,CAPZ+8.5,2.4,3.5,'z','chrome');
{const k=P(X,Y,CAPZ+15);el('circle',{cx:f2(k[0]),cy:f2(k[1]),r:f2(4*K),class:'knob'});el('ellipse',{cx:f2(k[0]),cy:f2(k[1]+12),rx:30,ry:19,class:'focus-ring'});el('ellipse',{cx:f2(k[0]),cy:f2(k[1]+12),rx:28,ry:17,class:'hit'});}
into(base);
// The gumballs on their way down, and the ones in the cup.
const TRAV=[0,1,2,3].map(()=>{const b=gum(L.fb);set(b.g,'display','none');return b;});
const SLOTS=[[X+R-6.75,Y+54.5],[X+R+6.75,Y+54.5],[X+R,Y+46]],TZ=7+BR*.6;
const cup=SLOTS.map(s=>{const b=gum(trayBalls);set(b.g,'display','none');set(b.g,'transform',at([s[0],s[1],TZ]));return b;});
frame([[X-38,Y-38,0,76,76,9],[X+R-15,Y+40,0,30,21,7],[X-30,Y-30,GZ-GW,60,60,GW*2],[X-5,Y-5,CAPZ,10,10,19]],10);
// State.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const NAMES=['CHERRY','TANGERINE','LEMON','MINT','BLUEBERRY','GRAPE','BUBBLEGUM','VANILLA'];
const eio=t=>t<.5?4*t*t*t:1-(-2*t+2)**3/2,eo=t=>1-(1-t)**3;
const GRAV=1300,DRAG=.55,T_TURN=1000,T_COIN=460,T_TAKE=380,DEMO=7000;
let count=CAP,credit=1,out=0,last='',crank=null,drag=null,ang=0,coin=null,refill=null,take=null,flapA=0,flapV=0,note='',noteT=0,prev=0,outKey='',touched=false,demoT=0,lastPose='',capY=0,shownCount=CAP;
const trav=[],tray=[];
const say=m=>{announcement.textContent=m;},notice=(m,a,ms=1800)=>{note=m;noteT=performance.now()+ms;if(a)say(a);};
let ac=null,nb=null;
function audio(){try{if(!ac){const W=window.AudioContext||window.webkitAudioContext;if(!W)return null;ac=new W();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
function tone(f,dur,v,type='sine',when=0,f1=0){const a=ac;if(!a)return;const t=a.currentTime+when,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+dur);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+dur+.03);}
function hiss(dur,v,f,q=1,when=0){const a=ac;if(!a)return;if(!nb){nb=a.createBuffer(1,a.sampleRate,a.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}const t=a.currentTime+when,s=a.createBufferSource(),b=a.createBiquadFilter(),g=a.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;b.Q.value=q;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+dur);s.connect(b);b.connect(g);g.connect(a.destination);s.start(t,0,dur+.05);}
const clink=()=>{tone(2380,.22,.028);tone(3520,.14,.016,'sine',.01);tone(1960,.3,.012,'triangle',.11);},ratchet=()=>{hiss(.025,.03,2600,4);tone(880,.02,.008,'square');},
lockSound=()=>{tone(150,.09,.04,'square');hiss(.05,.025,700,2);},tap=()=>tone(1250+Math.random()*260,.035,.012,'triangle'),clack=()=>{hiss(.04,.03,1700,2);tone(520,.05,.016,'square');},
plunk=()=>{tone(230,.14,.05,'sine',0,150);hiss(.05,.02,900,1.5);},pour=()=>{for(let i=0;i<14;i++)tone(900+Math.random()*900,.03,.008,'triangle',i*.06+Math.random()*.03);};
const touch=user=>{if(user){touched=true;audio();}};
// One-shot actions: a coin, a turn of the crank, take what's in the cup, refill the globe.
function insertCoin(user=true){touch(user);if(credit+(coin?1:0)>=9){notice('CREDIT FULL · TURN THE CRANK','The coin box is full: turn the crank.');return;}
if(coin){credit++;}if(reduced.matches){credit++;coin=null;set(coinG,'display','none');clink();notice(`COIN IN · CREDIT ${credit}`,`Coin in. Credit ${credit}.`);return;}
coin={t0:performance.now(),clinked:false};}
function release(){const b=order[CAP-count];count--;const k=b.k;if(reduced.matches){arrive(k);return;}
const t=TRAV.find(x=>!x.on)||TRAV[0];if(t.on)arrive(t.k);t.on=true;tint(t,k);t.ph='drop';t.z=HB+BR+2;t.vz=0;t.l=0;t.v=0;t.p=[X,Y+R,t.z];t.layer=null;t.nextTap=0;set(t.g,'display','inline');trav.push(t);}
function arrive(k){take=null;if(tray.length>=3)tray.shift();tray.push(k);out++;last=NAMES[k];cupDraw();plunk();notice(`${last} · IN THE CUP / D TAKES IT`,`A ${last.toLowerCase()} gumball drops into the cup.`,2600);}
function turn(user=true){touch(user);if(crank||drag)return;const red=reduced.matches;
if(refill){notice('REFILLING · ONE MOMENT');return;}
if(count<1){if(!red)crank={t0:performance.now(),dur:520,kind:'lock'};lockSound();notice('GLOBE EMPTY / R REFILLS IT','The globe is empty. Press R to refill it.');return;}
if(credit<1){if(!red)crank={t0:performance.now(),dur:520,kind:'lock'};lockSound();notice('LOCKED / C DROPS IN A COIN','The crank is locked. Drop in a coin first: press C.');return;}
credit--;if(red){release();return;}crank={t0:performance.now(),dur:T_TURN,kind:'turn',released:false};say('The crank turns and a gumball is let out.');}
function takeAll(user=true){touch(user);if(!tray.length){notice('THE CUP IS EMPTY','The cup is empty.');return;}
const n=tray.length;tray.length=0;if(reduced.matches)cupDraw();else take={t0:performance.now(),n};notice('TAKEN · ENJOY',n>1?'You take the gumballs from the cup.':'You take the gumball from the cup.');}
function refillGlobe(user=true){touch(user);if(refill)return;if(count>=CAP){notice('GLOBE FULL','The globe is already full.');return;}
if(reduced.matches){count=CAP;pileDraw();notice('GLOBE FULL · REFILLED','The globe is refilled.');return;}
const list=[];for(let r=CAP-count-1;r>=0;r--)list.push(order[r]);list.forEach((b,i)=>{b.landed=false;b.fly=false;b.t0=i*38;b.from=[X+(rand()-.5)*12,Y+(rand()-.5)*12,CAPZ+16];});
refill={t0:performance.now(),list};pour();say('The cap lifts and the globe is refilled.');}
// Drawing the state: the pile, the cup, the crank, the flap, the coin; only what changed.
function pileDraw(){if(shownCount===count&&!refill)return;shownCount=count;for(const b of pile){const v=b.rank>=CAP-count||(refill&&b.fly);if(v!==b.vis){b.vis=v;set(b.g,'display',v?'inline':'none');}}}
function cupDraw(){cup.forEach((b,i)=>{const on=i<tray.length;if(on)tint(b,tray[i]);if(b.on!==on||b.lift){b.on=on;b.lift=0;set(b.g,'display',on?'inline':'none');set(b.g,'transform',at([SLOTS[i][0],SLOTS[i][1],TZ]));set(b.g,'opacity',1);}});}
function setLayer(t,g){if(t.layer!==g){t.layer=g;g.appendChild(t.g);}}
function crankAt(pe){const m=svg.getScreenCTM?.();if(!m)return 0;const q=new DOMPoint(pe.clientX,pe.clientY).matrixTransform(m.inverse()),c=P(X,PY+10.5,CZ),u=(q.x-c[0])/C;return atan2(q.y-c[1]-S*u,u);}
// A gumball's way down: a short drop onto the wires, the spiral, the straight run, the flap, the cup.
function roll(t,dt){
if(t.ph==='drop'){t.vz-=GRAV*dt;t.z+=t.vz*dt;const z0=ZT+LIFT;if(t.z<=z0){t.z=z0;if(t.vz<-70){t.vz=-t.vz*.28;tap();}else{t.ph='roll';t.v=18;}}t.p=[X,Y+R,t.z];setLayer(t,L.fb);return;}
if(t.ph==='roll'){const onH=t.l<LH,a=GRAV*(5/7)*(onH?SLOPE_H:SLOPE_R)-DRAG*t.v;t.v=max(6,t.v+a*dt);t.l+=t.v*dt;
if(t.l<LH){const ride=min(1.3,t.v*t.v/R/700),p=helix(t.l,ride);t.p=[p[0],p[1],p[2]+LIFT-ride*.4];setLayer(t,isFront(p[3])?L.fb:L.bb);const qn=Math.floor(t.l/LH*TURNS*4);if(qn!==t.nextTap){t.nextTap=qn;tap();}}
else{const u=(t.l-LH)/RL;if(u>=1){t.ph='fly';t.h=[RUN1[0],RUN1[1]];t.hv=[0,t.v*.55];t.z=RUN1[2]+LIFT;t.vz=-t.v*SLOPE_R;t.slot=min(tray.length,2);}
else{t.p=[RUN0[0],RUN0[1]+(RUN1[1]-RUN0[1])*u,RUN0[2]+(RUN1[2]-RUN0[2])*u+LIFT];setLayer(t,t.p[1]>Y+39?exitG:L.fb);}}}
if(t.ph==='fly'){const s=SLOTS[t.slot],w=9,z=.62;for(const i of[0,1]){const d=s[i]-t.h[i];t.hv[i]+=(w*w*d-2*z*w*t.hv[i])*dt;t.h[i]+=t.hv[i]*dt;}
t.vz-=GRAV*dt;t.z+=t.vz*dt;if(t.z<=TZ){t.z=TZ;if(t.vz<-55){t.vz=-t.vz*.32;tap();}else t.vz=0;}
t.p=[t.h[0],t.h[1],t.z];setLayer(t,t.z<15&&t.h[1]>Y+44?trayBalls:exitG);
if(t.vz===0&&t.z===TZ&&hypot(s[0]-t.h[0],s[1]-t.h[1])<.35&&hypot(...t.hv)<4){t.on=false;set(t.g,'display','none');trav.splice(trav.indexOf(t),1);arrive(t.k);}}
}
// The flap: a pendulum on its hinge, pushed open by a gumball passing under it; it only swings outward.
function flapStep(dt){let push=0;for(const t of trav){if(t.ph==='drop')continue;const dy=t.p[1]-FLAP_O[1],dz=FLAP_O[2]-t.p[2],d=hypot(dy,dz);if(d<14.5+BR&&dy>-BR-1&&d>BR)push=max(push,atan2(dy,dz)+asin(BR/d));}
flapV+=(-34*sin(flapA)-3.2*flapV)*dt;flapA+=flapV*dt;if(push>flapA){flapV=max(flapV,(push-flapA)/max(dt,.001)*.5);flapA=push;}if(flapA<0){if(flapV<-1.5)clack();flapA=0;flapV=-flapV*.25;if(abs(flapV)<.4)flapV=0;}if(!push&&flapA<.003&&abs(flapV)<.05){flapA=0;flapV=0;}}
function tick(now){const dt=Math.min(.05,(now-(prev||now))/1000),red=reduced.matches;prev=now;if(!demoT)demoT=now-DEMO+2600;
// The crank: a turn (it lets a gumball out past six tenths), a locked rattle, a spring back after a drag.
let a=ang;if(drag)a=drag.angle;else if(crank){const q=clamp((now-crank.t0)/crank.dur);
if(crank.kind==='turn'){a=360*eio(q);if(!crank.released&&q>=.62){crank.released=true;release();}}else if(crank.kind==='lock')a=20*sin(q*PI*2)*(1-q);else a=crank.from*(1-eio(q));
if(q>=1){crank=null;a=0;}}
if(Math.floor(a/30)!==Math.floor(ang/30))ratchet();ang=a;
// The rolling gumballs, the flap, the coin, the cup being emptied, the refill.
if(red&&trav.length){for(const t of[...trav]){t.on=false;set(t.g,'display','none');arrive(t.k);}trav.length=0;flapA=0;flapV=0;}
for(const t of[...trav]){roll(t,dt);if(t.on)set(t.g,'transform',at(t.p));}
if(trav.length||flapA||flapV)flapStep(dt);
if(coin){const q=(now-coin.t0)/T_COIN;if(red||q>=1){coin=null;credit++;set(coinG,'display','none');if(!red)clink();notice(`COIN IN · CREDIT ${credit}`,`Coin in. Credit ${credit}.`);}
else{const z=PZ+48-27*clamp(q/.85)**2,w=sin(q*PI*3)*4*(1-q);set(coinG,'display','inline');set(coinG,'transform',FRONT(X,SLOT_Y,z)+` rotate(${f2(w)})`);set(coinG,'opacity',f2(clamp(q*6)));if(q>.62&&!coin.clinked){coin.clinked=true;clink();}}}
if(take){const q=(now-take.t0)/T_TAKE;if(red||q>=1){take=null;cupDraw();}else cup.forEach((b,i)=>{if(i<take.n){b.lift=1;set(b.g,'transform',at([SLOTS[i][0],SLOTS[i][1],TZ+16*eo(q)]));set(b.g,'opacity',f2(1-q));}});}
if(refill){const e=now-refill.t0;capY=-10*eo(clamp(e/260));for(const b of refill.list){if(b.landed)continue;const q=(e-300-b.t0)/520;if(q<0)continue;
if(!b.fly){b.fly=true;set(b.g,'display','inline');b.vis=true;}if(q>=1||red){b.landed=true;b.fly=false;set(b.g,'transform',at(b.p));count++;continue;}
const s=q*q;set(b.g,'transform',at([b.from[0]+(b.p[0]-b.from[0])*q,b.from[1]+(b.p[1]-b.from[1])*q,b.from[2]+(b.p[2]-b.from[2])*s]));}
if(refill.list.every(b=>b.landed)){const tail=now-(refill.end??=now);capY=-10*(1-eo(clamp(tail/260)));if(tail>=260||red){refill=null;capY=0;count=CAP;notice('GLOBE FULL · REFILLED','The globe is full again.');}}
if(red){for(const b of refill?.list??[]){b.landed=true;b.fly=false;set(b.g,'transform',at(b.p));}refill=null;capY=0;count=CAP;}}
pileDraw();
// The pile shifts a little while the crank turns.
const jig=crank&&crank.kind==='turn'&&!red?[sin(now/23)*.5,cos(now/31)*.4]:[0,0];
const pose=[ang,flapA,capY,...jig].map(v=>v.toFixed(2)).join('|');
if(pose!==lastPose){lastPose=pose;spins.forEach((g,k)=>set(g,'transform',`translate(${-k} ${k}) rotate(${f2(ang)})`));
set(flapG,'transform',plane(FLAP_O,[1,0,0],[0,sin(flapA),-cos(flapA)]));set(capLift,'transform',`translate(0 ${f2(capY)})`);set(churn,'transform',`translate(${f2(jig[0])} ${f2(jig[1])})`);}
// Left alone it serves itself now and then: a coin, a turn, the cup emptied, a refill.
if(!touched&&!red&&now-demoT>DEMO&&!crank&&!trav.length&&!refill&&!take&&!coin){demoT=now;if(tray.length>=3)takeAll(false);else if(count<1)refillGlobe(false);else if(credit<1){insertCoin(false);demoT=now-DEMO+1100;}else turn(false);}
ui(now);requestAnimationFrame(tick);}
function ui(now){const pct=Math.round(count/CAP*100),r=`CREDIT ${credit} · OUT ${out}${last?' · '+last:''} · GLOBE ${pct}%`;
const st=now<noteT?note:refill?'REFILLING THE GLOBE':crank&&crank.kind==='turn'||drag&&drag.moved>.05?'TURNING THE CRANK':trav.length?'ROLLING DOWN THE SPIRAL':count<1?'GLOBE EMPTY / R REFILLS IT':credit<1?'NO CREDIT / C DROPS IN A COIN':'READY / SPACE TURNS THE CRANK';
if(r+st!==outKey){outKey=r+st;readout.textContent=r;stateLabel.textContent=st;}}
// Input: Space or Enter turns the crank, C drops in a coin, D takes the gumballs, R refills; the parts take clicks.
// The crank drags round: a full turn by hand lets a gumball out (it's locked without credit).
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented||e.repeat)return;const k=e.key.length===1?e.key.toLowerCase():e.key;
const act={' ':turn,Enter:turn,c:insertCoin,d:takeAll,r:refillGlobe}[k];if(act){e.preventDefault();act();}});
crankCtl.addEventListener('pointerdown',e=>{if(e.button>0)return;e.preventDefault();touch(true);if(crank){drag={click:true,moved:0,angle:ang};return;}
drag={a:crankAt(e),moved:0,angle:ang};e.currentTarget.setPointerCapture?.(e.pointerId);svg.classList.add('dragging');});
crankCtl.addEventListener('pointermove',e=>{if(!drag||drag.click)return;const a=crankAt(e);let dl=a-drag.a;if(dl>PI)dl-=2*PI;if(dl<-PI)dl+=2*PI;drag.a=a;drag.moved+=abs(dl);
const free=credit>0&&count>0&&!refill;drag.angle=free?drag.angle+dl/RAD:clamp(drag.angle+dl/RAD,-22,22);
if(abs(drag.angle)>=360){drag.angle-=Math.sign(drag.angle)*360;ang=drag.angle;drag.served=true;credit--;release();}});
function endDrag(tapped){if(!drag)return;const g=drag;drag=null;svg.classList.remove('dragging');if(g.click)return;
if(g.moved<.06){if(tapped)turn();return;}if(!g.served&&!(credit>0&&count>0))notice(count<1?'GLOBE EMPTY / R REFILLS IT':'LOCKED / C DROPS IN A COIN');crank={t0:performance.now(),dur:320,kind:'back',from:ang};}
addEventListener('pointerup',()=>endDrag(true));addEventListener('pointercancel',()=>endDrag(false));window.addEventListener('blur',()=>endDrag(false));
crankCtl.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)turn();}});
bind(slotCtl,()=>insertCoin());bind(trayCtl,()=>takeAll());bind(capCtl,()=>refillGlobe());
set(flapG,'transform',plane(FLAP_O,[1,0,0],[0,0,-1]));spins.forEach((g,k)=>set(g,'transform',`translate(${-k} ${k})`));requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
