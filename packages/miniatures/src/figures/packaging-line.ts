// @ts-nocheck
/* PLIÉ P–6 · Packaging line. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--belt:#3a3a39;--belt-l:#575755;--card:#c99d64;--card-top:#dcb57f;--card-side:#b3874f;--card-in:#d8bd93;--tape:#a8743c;--can:#ecebe6;--band:#d9503c;--lbl:#fbfbf8;--pine:#d8c4a0;--pine-top:#e8d8b9;--pine-side:#bfa881;--screen:#1c1d1e;--film:.5;--wrapl:#8d8d87}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--belt:#2f2f2f;--belt-l:#484847;--card:#a98453;--card-top:#cea976;--card-side:#7e5e35;--card-in:#b69f7b;--tape:#8d6131;--can:#c7c6c3;--band:#b74231;--lbl:#d4d4d2;--pine:#b6a586;--pine-top:#d9caad;--pine-side:#867659;--screen:#161717;--wrapl:#767672;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:5px;letter-spacing:1.4px;font-weight:600}.micro{font-size:2.4px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.belt{fill:var(--belt)}.seam{stroke:var(--belt-l);stroke-width:.8;fill:none}.screen{fill:var(--screen)}
.card{fill:var(--card)}.top.card{fill:var(--card-top)}.side.card{fill:var(--card-side)}.card.in,.top.card.in,.side.card.in{fill:var(--card-in)}.tape{fill:var(--tape);stroke:none}.can{fill:var(--can)}.top.can{fill:var(--can)}.band{fill:var(--band);stroke:none}.lbl{fill:var(--lbl)}.ink{stroke:#2a2a2a;stroke-width:.35;fill:none}
.pine{fill:var(--pine)}.top.pine{fill:var(--pine-top)}.side.pine{fill:var(--pine-side)}.film{fill:#fff;fill-opacity:var(--film);stroke:var(--wrapl);stroke-opacity:.6;stroke-width:.5}.wrapl{stroke:var(--wrapl);stroke-width:.45;opacity:.6;fill:none}
.lamp{fill:var(--off);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.r,.lamp.b{filter:url(#glow);stroke:none}
.seg{opacity:.3}.on .seg{opacity:1}.sr{fill:var(--fault)}.sa{fill:var(--warn)}.sg{fill:var(--ok)}.bh{opacity:0;filter:url(#bloom);pointer-events:none}
.beam{stroke:var(--fault);stroke-width:.7;stroke-linecap:round;fill:none;opacity:.85;filter:url(#glow)}
.scr{fill:var(--accent);font:600 3.4px ui-monospace,monospace;letter-spacing:.3px;stroke:none}.scr.s{font-size:2.2px;font-weight:400;letter-spacing:.15px}.halo{fill:var(--accent);opacity:.14;filter:url(#bloom)}.lit .halo{opacity:.4}.lit .scr{fill:var(--warn)}
.estop{fill:var(--fault)}.top.estop{fill:#ff6a5c}.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = ``

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* PLIÉ P–6 packaging line. World: x lower-right (the flow); y lower-left; z up. 1 unit ≈ 1 cm.
Part x y z w d h
control cabinet −78 8 0 26 22 58 (HMI, E-stop at −55.8 30 51.6) · stack light on top −65 19 58 r3.2 – 29
conveyor legs ×6 −24/86/192 33/63 0 4 4 20
conveyor frame −28 32 20 226 36 9.5 (belt top 29.5, idlers on the front face, end drum r4.6 at x 198)
blank magazine: posts ±26 ±34 about −16 50, rails z 58, stack of 4 blanks z 48–52
cartons (box centres, pitch 40): magazine −16 · erect 24 · fill 64 · fold 104 · tape head 124 · label 144 · pick 184; carton 20 18 14, flaps 9
hopper 52 38 72 24 24 26 + chute 59 45 62 10 10 10, post 60 18 0 4 4 100
flap folder post 102 18 0 4 4 72, beam z 68–72, pushers y 45.5/54.5
tape head 116 41 48 16 18 14, roll r7 at 124 59 56, post 122 18 0 4 4 66
label printer 134 74 0 20 18 44 · tamp pad 138 59.6…70 33 12 2.4 8 · label roll r6 on +x
photo-eyes ×3 x 64/158/188: emitters y 24, reflectors y 74, beam z 37
pallet bed 206 32 0 96 48 3 (rollers) · pallet 214 35 4 64 42 7.8 (boards, blocks, stringers, deck) · stack 3 × 2 × 2 from z 12
gantry posts 190/296 18 0 4 4 100 · beam 190 18 98 110 4 6 · arm, slide, rod, vacuum gripper
wrap mast 286 28 0 4 4 64 · film carriage
Print, seams and screws share their parent face. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: vectors, folding card panels, lamps, controls.
const draw=root,into=g=>root=g,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=p=>p*p*(3-2*p),RAD=Math.PI/180;
const sub=(a,b)=>a.map((v,i)=>v-b[i]),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const pd=q=>'M'+q.map(p=>f2(p[0])+','+f2(p[1])).join('L')+'Z',tr=(x,y,z)=>`translate(${P(x,y,z).map(f2).join(' ')})`;
// A card panel: shaded by the side that faces the viewer; the inner side of the board is paler.
function panel(g,pts,out){let n=cross(sub(pts[1],pts[0]),sub(pts[3],pts[0]));if(dot(n,[1,1,1])<0)n=n.map(v=>-v);const a=n.map(Math.abs);el('path',{d:pd(pts.map(p=>P(...p))),class:`face card${a[2]>=a[0]&&a[2]>=a[1]?' top':a[0]>a[1]?' side':''}${dot(n,out)<0?' in':''}`},g);}
function band(x,y,z,r,h){const a=P(x,y,z),rx=f2(r*1.2247),ry=f2(r*.7071);el('path',{d:`M${f2(a[0]-r*1.2247)},${f2(a[1])}A${rx},${ry} 0 0 0 ${f2(a[0]+r*1.2247)},${f2(a[1])}l0,${-h}A${rx},${ry} 0 0 1 ${f2(a[0]-r*1.2247)},${f2(a[1]-h)}Z`,class:'band'});}
function lamp(g,x,y,r=1){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c,base='lamp'){if(n._c!==c){n._c=c;set(n,'class',base+(c?' '+c:''));}}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
const LY=50,BZ=30,XS=[-16,24,64,104,144,184],SLOT=[0,1,2,3,4,5,6,7,8,9,10,11].map(i=>[226+20*(i%3),i%6<3?46:64,12+14*(i>5)]);
// A carton in its own frame (base centre at 0 0 0): erect e, cans, flaps f, tape t, label l.
const CAN=[[-5,-4.5],[5,-4.5],[-5,4.5],[5,4.5]];
function carton(g,b){
g.replaceChildren();into(g);
const be=90*RAD*ease(clamp(b.e/.6)),al=90*RAD*ease(clamp((b.e-.3)/.7)),gb=90*RAD*ease(clamp(b.f/.6)),gf=90*RAD*ease(clamp((b.f-.4)/.6)),ca=Math.cos(al)*14,sa=Math.sin(al)*14,cb=Math.cos(be)*14,sb=Math.sin(be)*14;
panel(g,[[-10,-9,0],[10,-9,0],[10,-9-ca,sa],[-10,-9-ca,sa]],[0,-Math.sin(al),-Math.cos(al)]);
panel(g,[[-10,-9,0],[-10,9,0],[-10-cb,9,sb],[-10-cb,-9,sb]],[-Math.sin(be),0,-Math.cos(be)]);
panel(g,[[-10,-9,0],[10,-9,0],[10,9,0],[-10,9,0]],[0,0,-1]);
for(const c of(b.cans||[]).slice().sort((p,q)=>p.x+p.y-q.x-q.y)){const k=cylinder(c.x,c.y,c.z,3.6,10,'z','can');circle(k.face,0,0,2.7,'detail');band(c.x,c.y,c.z+2.6,3.6,4.2);}
panel(g,[[10,-9,0],[10,9,0],[10+cb,9,sb],[10+cb,-9,sb]],[Math.sin(be),0,-Math.cos(be)]);
panel(g,[[-10,9,0],[10,9,0],[10,9+ca,sa],[-10,9+ca,sa]],[0,Math.sin(al),-Math.cos(al)]);
for(const[s,gg]of[[-1,gb],[1,gf]]){const h=[s*(9+ca),sa],q=al+gg,d=[s*Math.cos(q)*9,Math.sin(q)*9];panel(g,[[-10,h[0],h[1]],[10,h[0],h[1]],[10,h[0]+d[0],h[1]+d[1]],[-10,h[0]+d[0],h[1]+d[1]]],[0,s*Math.sin(q),-Math.cos(q)]);}
if(b.e>=1){const fw=group(FRONT(-9,9.02,13),g);for(const u of[1.6,3.6])el('path',{d:`M${u},6V2.2M${u-.9},3.1L${u},2.2L${u+.9},3.1`,class:'detail'},fw);}
if(b.t>0){const x0=10-20*b.t;el('path',{d:pd([[x0,-2.5,14.06],[10,-2.5,14.06],[10,2.5,14.06],[x0,2.5,14.06]].map(p=>P(...p))),class:'tape'},g);el('path',{d:pd([[10.06,-2.5,14],[10.06,2.5,14],[10.06,2.5,9],[10.06,-2.5,9]].map(p=>P(...p))),class:'tape'},g);wire([[x0+.6,1.4,14.1],[9.4,1.4,14.1]],'detail',g).style.opacity='.35';}
if(b.l>0){const lb=group(FRONT(-5,9.04,12),g);rect(lb,0,0,13,8.6,.6,'face lbl');for(const u of[1.2,1.8,2.2,3.1,3.5,4.4,5.2,5.6,6.5,7.1,7.4])line(lb,u,1.2,u,4.6,'ink');for(const v of[6,7.4])line(lb,1.2,v,v>7?7:11.4,v,'ink');}
into(draw);
}
// Floor shadows; control cabinet with HMI, E-stop and stack light.
const sh=(x,y,rx,ry,a=0)=>{const p=P(x,y,0).map(f2),g=el('g',{transform:`rotate(${a} ${p[0]} ${p[1]})`});el('ellipse',{cx:p[0],cy:p[1],rx,ry,class:'shadow stage-floor'},g);el('ellipse',{cx:p[0],cy:p[1],rx,ry,class:'stage-contact'},g);};
sh(85,50,132,21,30);sh(256,56,60,30);sh(-64,20,26,13);sh(144,84,20,11);sh(-16,50,40,24,30);
box(-78,8,0,26,22,58,2);const cf=group(FRONT(-78,30,58));rect(cf,2.5,2.5,21,53,1.5,'detail');text(cf,3.2,8.2,'PLIÉ','label brand').style.fontSize='4.2px';
rect(cf,4.5,12,17,12,1.2,'face recess');const hmi=group('',cf);rect(hmi,5.5,13,15,10,1,'halo');rect(hmi,5.3,12.8,15.4,10.4,.9,'face screen');const H1=text(hmi,6.6,16.6,'05/12','scr'),H2=text(hmi,6.6,20.3,'RUN 30/MIN','scr s');const HB=rect(hmi,6.6,21.4,0,.9,.3,'scr');
for(const v of[30,38])slits(cf,5,v,16,3,8);rect(cf,5,47,6,3,1,'face recess');
const csd=group(SIDE(-52,30,58));slits(csd,4,6,14,10,7);rect(csd,6,40,10,8,1,'face top');text(csd,11,44.6,'400 V','etch micro center');
const estop=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Emergency stop: stop or run the line (Space)','aria-pressed':'false'});into(estop);
cylinder(-55.8,30,51.6,3.2,1.2,'y','sa');const ek=cylinder(-55.8,31.2,51.6,2.5,2,'y','estop');circle(ek.face,0,0,1.5,'detail');circle(ek.face,0,0,5.2,'focus-ring');circle(ek.face,0,0,5.4,'hit');into(draw);
cylinder(-65,19,58,2.4,1.6,'z','metal');cylinder(-65,19,59.6,1.1,8,'z','metal');
const SL=[['sg',67.6],['sa',72.8],['sr',78]].map(([c,z])=>{const s=cylinder(-65,19,z,3.1,5,'z',c+' seg');const p=P(-65,19,z+2.5);return{s:s.g,h:el('ellipse',{cx:p[0],cy:p[1],rx:13,ry:11,class:'bh '+c}),c};});
cylinder(-65,19,83,3.1,1.8,'z','metal');
// Back layer: station posts, sensor emitters, gantry posts and beam, wrap mast.
for(const[x,h]of[[60,100],[102,72],[122,66]])box(x,18,0,4,4,h,1,'metal');
const EYE=[64,158,188].map(x=>{box(x-1,24,0,2,2,32,.5,'metal');box(x-2.5,23,32,5,4,7,1,'');const f=group(FRONT(x-2.5,27,39));circle(f,2.5,3.5,1.3,'face glass');const le=lamp(group(TOP(x-2.5,23,39.02)),2.5,1.2,.7);return{x,le,beam:el('path',{class:'beam'})};});
for(const x of[190,296])box(x,18,0,4,4,82,1,'metal');box(190,16,82,110,6,6,1.5,'metal');{const bf=group(FRONT(190,22,88));for(let u=6;u<108;u+=12)screw(bf,u,3);}
box(286,28,0,4,4,64,1,'metal');
// Blank magazine rack, back posts.
const XM=-16;for(const x of[XM-27,XM+25])box(x,14,0,2.6,2.6,60,.6,'metal');
// Conveyor: legs, frame with idlers, belt with moving seams, end drum.
for(const x of[-24,86,192])for(const y of[33,63]){box(x,y,0,4,4,20,.8,'metal');}
box(-28,32,20,226,36,9.5,2,'metal');
const ff=group(FRONT(-28,68,29.5));line(ff,0,1.6,226,1.6);line(ff,0,8,226,8);
const IDL=[];for(let x=8;x<220;x+=16){circle(ff,x,4.8,2.3,'face recess');const g=group(`translate(${x} 4.8)`,ff);g._t=`translate(${x} 4.8)`;circle(g,0,0,1.5,'face top');line(g,-1.4,0,1.4,0);IDL.push(g);}
text(ff,201,6.2,'P–6','etch micro');
const bt=group(TOP(-26,33,29.55));rect(bt,0,0,222,34,1.5,'face belt');const SEAMS=[...Array(12)].map(()=>line(bt,0,1,0,33,'seam'));
const drum=cylinder(198,32,25,4.6,36,'y','metal');const dsp=group('',drum.face);circle(drum.face,0,0,1.8,'detail');line(dsp,-3.6,0,3.6,0);line(dsp,0,-3.6,0,3.6);
const beams=el('g',{});EYE.forEach(e=>beams.appendChild(e.beam));
// The cartons on the belt and the drop from the magazine live here.
const LAYER=el('g',{});
// Magazine: blank stack and front posts and rails.
const XMg=el('g',{});into(XMg);
const NET=[[-10,-32],[10,-32],[10,-9],[24,-9],[24,9],[10,9],[10,32],[-10,32],[-10,9],[-24,9],[-24,-9],[-10,-9]];
for(let k=0;k<4;k++){const z=49+k*1.3;el('path',{d:pd(NET.map(([u,v])=>P(XM+u,LY+v,z))),class:'face card top in'});}
{const tg=group(TOP(XM-24,LY-32,53.92));for(const[a,b,c,d]of[[14,23,34,23],[14,41,34,41],[14,23,14,41],[34,23,34,41],[14,9,34,9],[14,55,34,55]])line(tg,a,b,c,d);}
for(const x of[XM-27,XM+25])box(x,84,0,2.6,2.6,60,.6,'metal');for(const y of[14,84])box(XM-27,y,58,54.6,2.6,2.6,.6,'metal');
into(draw);
// Hopper with cans above the fill station; chute and gate.
box(60,22,96,4,24,4,1,'metal');
{const T=[[52,38],[76,38],[76,62],[52,62]].map(([x,y])=>[x,y,98]),B=[[59,45],[69,45],[69,55],[59,55]].map(([x,y])=>[x,y,72]);
el('path',{d:pd(T.map(p=>P(...p))),class:'face recess'});
for(const[x,y]of[[58,44],[65,42],[71,45],[57,51],[64,49],[70,52],[59,57],[66,56],[72,58]]){const c=ellipse(x,y,96.6,3.4,'z','face can');circle(c.parentNode,0,0,2.4,'detail');}
el('path',{d:pd([T[3],T[2],B[2],B[3]].map(p=>P(...p))),class:'face metal'});el('path',{d:pd([T[1],T[2],B[2],B[1]].map(p=>P(...p))),class:'face side metal'});
el('path',{d:pd(T.map(p=>P(...p))),class:'detail'});}
box(59,45,62,10,10,10,1,'metal');const gate=el('path',{class:'face side metal'});
// Flap folder: beam, pneumatic cylinders, pushers.
box(102,22,68,4,40,4,1,'metal');const PUSH=[45.5,54.5].map(y=>{cylinder(104,y,58,2,10,'z','metal');const g=el('g',{});into(g);cylinder(104,y,52,.8,7,'z','metal');box(97,y-2.5,50,14,5,2,.8,'');into(draw);return g;});
// Tape head with its roll and applicator.
box(122,22,62,4,24,4,1,'metal');box(116,41,48,16,18,14,2,'');{const tf=group(FRONT(116,59,62));text(tf,8,5,'TAPE','etch micro center');slits(tf,3,8,10,3,6);}
cylinder(130,43,46.4,2.2,14,'y','metal');const roll=cylinder(124,59,56,7,4,'y','tape');circle(roll.face,0,0,3.4,'face metal');const rsp=group('',roll.face);for(const a of[0,120,240])line(rsp,0,0,3.2*Math.cos(a*RAD),3.2*Math.sin(a*RAD));
wire([[118,61,50],[124,57,46.5],[128,50,44.6]],'detail').style.stroke='var(--tape)';
// Front: sensor reflectors, tamp pad, label printer.
for(const e of EYE){box(e.x-1,74,0,2,2,32,.5,'metal');box(e.x-2.5,72,32,5,2,7,1,'');const f=group(FRONT(e.x-2.5,74,39));rect(f,1,1.4,3,4,.4,'face recess');}
const tamp=el('g',{});into(tamp);cylinder(144,61,37,.9,12,'y','metal');box(138,59.6,33,12,2.4,8,.8,'');into(draw);
const prn=el('g',{});into(prn);box(134,74,0,20,18,44,2);const pf=group(FRONT(134,92,44));
rect(pf,2.5,3,15,8,1,'face recess');rect(pf,3.3,3.8,13.4,6.4,.8,'halo');rect(pf,3.2,3.7,13.6,6.6,.8,'face screen');const PD=text(pf,4.4,7.9,'LBL 0042','scr s');const pl=lamp(pf,16,14.4,1.1);text(pf,4,15,'PRINT','etch micro');
rect(pf,2.5,19,15,2,1,'face recess');slits(pf,3,26,14,12,7);
const pr=cylinder(154,80,30,6,3,'x','');set(pr.face.firstChild,'class','face lbl');circle(pr.face,0,0,2.4,'face metal');into(draw);
const pg=group(SIDE(154,92,44));text(pg,9,40,'PRINT & APPLY','etch micro center');
// Pallet bed (rollers), pallet group (pallet + stack + film), gantry.
box(206,32,0,96,48,3,1,'metal');const RL=[];for(let x=210;x<300;x+=8){const r=cylinder(x,33,2.4,1.6,46,'y','metal');const g=group('',r.face);line(g,-1.3,0,1.3,0);RL.push(g);}
const PAL=el('g',{}),STACK=el('g',{}),FILM=el('g',{});
into(PAL);for(const y of[35,54,73]){box(214,y,4,64,4,1.4,.4,'pine');for(const x of[214,243,272])box(x,y,5.4,6,4,3.6,.8,'pine');box(214,y,9,64,4,1.2,.4,'pine');}for(let i=0;i<7;i++)box(214+i*9.6,35,10.2,6.4,42,1.6,.5,'pine');PAL.appendChild(STACK);PAL.appendChild(FILM);into(draw);
const carry=el('g',{}),GR=el('g',{});into(GR);box(-7,-6,0,14,12,3,1.2,'');for(const[u,v]of[[-4,-3],[4,-3],[-4,3],[4,3]])ellipse(u,v,-.1,1.6,'z','face recess');const vac=lamp(group(TOP(-7,-6,3.02)),2.4,2.4,.8);cylinder(0,0,3,1.4,50,'z','metal');into(draw);
const GS=el('g',{});into(GS);box(-4.5,-4.5,70,9,9,7,1.5,'');into(draw);const GA=el('g',{});into(GA);box(-3.5,18,77,7,56,5,1.5,'metal');{const af=group(FRONT(-3.5,74,82),GA);text(af,3.5,3.6,'P6','etch micro center');}into(draw);
const WC=el('g',{});into(WC);box(283,32,0,8,7,9,1.5,'metal');const fr=cylinder(287,42,-1,2.8,11,'z','');set(fr.g.firstChild,'class','face lbl');circle(fr.face,0,0,1.2,'face metal');into(draw);const web=el('path',{class:'wrapl',style:'opacity:0'});
frame([[-78,8,0,26,22,87],[-43,14,0,55,73,61],[52,18,0,24,44,100],[-28,32,0,226,36,30],[134,74,0,20,18,44],[190,16,0,112,64,88],[180,46,96,10,8,18]],8);
// State: indexing line, stations, gantry, pallet, mode, progress, done, stop; audio after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),keys={};
const MOVE=.7,DWELL=1.3;
let boxes=[],beltBase=0,placed=0,mode='ind',target=0,done=0,stop=false,ph='dwell',pt=0,belt=0,labels=42,gan=null,swap=null,wrap=0,lt=0,lastUI=-1,speed=1,ac=null,msg='',msgT=0,now=0;
const say=m=>{announcement.textContent=m;};
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac)ac=new A();if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,v,d,at=0,type='sine'){if(!ac)return;try{const t=ac.currentTime+at,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.05);}catch(_){}}
const mk=(s,o={})=>{const b={s,x:XS[s+1],z:BZ,e:s>=0?1:0,f:s>=2?1:0,t:s>=3?1:0,l:s>=4?1:0,cans:s>=1?CAN.map(([x,y])=>({x,y,z:0})):[],g:el('g',{},LAYER),k:'',...o};return b;};
const STACKED=[];
function setPlaced(n){placed=n;while(STACKED.length>n)STACKED.pop().remove();while(STACKED.length<n){const g=el('g',{},STACK),s=SLOT[STACKED.length];set(g,'transform',tr(...s));carton(g,{e:1,f:1,t:1,l:1,cans:[]});STACKED.push(g);}}
// A static, mid-process line: every station holds a carton.
pt=.55*DWELL;boxes=[mk(-1),mk(0,{e:.73}),mk(1,{cans:[...CAN.slice(0,2).map(([x,y],i)=>({x,y,z:0,i})),{x:0,y:0,z:20,i:2,t0:.44}]}),mk(2,{f:.69}),mk(3,{l:1}),mk(4)];setPlaced(5);
const goal=()=>done?12:mode==='det'?Math.round(target*12):12;
const feeding=()=>mode==='ind'&&!done?true:placed+boxes.length+(gan&&!gan.put?1:0)<Math.min(12,goal()+5);
function sync(){set(keys.i,'aria-pressed',mode==='ind'&&!done);set(keys.space,'aria-pressed',stop);set(estop,'aria-pressed',stop);lastUI=-1;}
function setProgress(p){done=0;wrap=0;film();web.style.opacity=0;if(p==null||!isFinite(p))mode='ind';else{mode='det';target=clamp(+p);}if(reduced.matches)settle();sync();}
function finish(){audio();if(done)return;done=1;say('Finishing: the pallet is being completed.');if(reduced.matches)settle();sync();}
// Reduced motion: jump straight to the state the progress asks for.
function settle(){const n=goal();if(n<placed||swap)setPlaced(0);setPlaced(n);if(done){wrap=1;done=2;}film();}
function stepKey(){audio();setProgress(mode==='det'&&!done?(target>=1?0:Math.min(1,Math.floor(target*4+1e-6)/4+.25)):.25);say(`Progress ${Math.round(target*100)} percent: ${goal()} of 12 cartons.`);}
function indKey(){audio();if(mode==='ind'&&!done){setProgress(placed/12);say(`Determinate at ${placed} of 12 cartons.`);}else{setProgress(null);say('Indeterminate: the line runs and changes pallets by itself.');}}
function stopKey(){audio();stop=!stop;tone(stop?140:520,.03,.12,0,'triangle');say(stop?'Line stopped.':'Line running.');sync();}
window.figure={setProgress,done:finish};
bind(estop,stopKey);
const act={p:stepKey,i:indKey,enter:finish,space:stopKey,' ':stopKey};
document.querySelectorAll('.hint [data-k]').forEach(b=>{keys[b.dataset.k]=b;b.addEventListener('click',()=>act[b.dataset.k]());});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const k=e.key.toLowerCase();if((k==='enter'||k===' ')&&e.target.closest&&e.target.closest('button,[role=button]'))return;if(act[k]){e.preventDefault();act[k]();}});
// Film: the wrap rises over the stack's two visible faces.
function film(){FILM.replaceChildren();if(wrap<=0)return;const h=12+29*wrap,F=(pts)=>el('path',{d:pd(pts.map(p=>P(...p))),class:'film'},FILM);
F([[215,74,12],[277,74,12],[277,74,h],[215,74,h]]);F([[277,36,12],[277,74,12],[277,74,h],[277,36,h]]);
for(let z=14;z<h-1;z+=4.2){wire([[215,74,z],[277,74,Math.min(h,z+3)],[277,36,Math.min(h,z+5)]],'wrapl',FILM);}}
// Gantry path: home above the pick, down, grip, lift, traverse, lower, release, lift, return.
const HOME=[184,50,62];
function gPath(k,s){const L=[184,50,44],U=[184,50,62],A=[s[0],s[1],62],D=[s[0],s[1],s[2]+14];const seg=[[0,.2,HOME,L],[.2,.3,L,L],[.3,.5,L,U],[.5,1,U,A],[1,1.24,A,D],[1.24,1.32,D,D],[1.32,1.52,D,A],[1.52,2.02,A,HOME]];
for(const[a,b,p,q]of seg)if(k<=b){const u=ease(clamp((k-a)/(b-a)));return p.map((v,i)=>v+(q[i]-v)*u);}return HOME;}
let gpos=HOME.slice();
function tick(t){
const dt=Math.min(.05,(t-(lt||t))/1000),red=reduced.matches;lt=now=t;
const n=goal(),behind=mode==='ind'&&!done?0:Math.max(0,n-placed-1);speed+=((done?3:1+Math.min(2,behind*.5))-speed)*clamp(dt*3);
const d=red||stop?0:dt*speed;
// Pallet change: the full (or surplus) pallet rolls out and an empty one fades in.
if(!red&&!swap&&!gan&&!done&&(placed>=12&&mode==='ind'||placed>n)){swap={t:0};say('Pallet change.');}
if(swap){swap.t+=d;const k=swap.t;const o=ease(clamp(k/1.1));set(PAL,'transform',k<1.1?tr(70*o,0,0):'');PAL.style.opacity=f2(k<1.1?1-clamp((k-.4)/.7):clamp((k-1.15)/.45));if(k>=1.1&&placed){setPlaced(0);wrap=0;film();}if(k>=1.6){swap=null;PAL.style.opacity='';}}
// Indexing: move all cartons one pitch when the dwell is over and the pick station is clear.
pt+=d;const pick=boxes.find(b=>b.s===4);
if(ph==='dwell'&&pt>=DWELL&&!pick&&boxes.length&&!red){ph='move';pt=0;boxes.forEach(b=>b.s0=b.s);}
if(ph==='move'){const u=ease(clamp(pt/MOVE));for(const b of boxes){b.x=XS[b.s0+1]+40*u;}belt=beltBase+40*u;if(pt>=MOVE){for(const b of boxes){b.s=b.s0+1;b.x=XS[b.s+1];}beltBase+=40;belt=beltBase;ph='dwell';pt=0;}}
const mv=ph==='move'?ease(clamp(pt/MOVE)):0;
// Stations during the dwell.
const w=ph==='dwell'?pt/DWELL:0;
for(const b of boxes){
if(b.s===-1&&b.z>BZ)b.z=Math.max(BZ,b.z-d*80);
if(b.s===0&&ph==='dwell')b.e=Math.max(b.e,clamp(w/.75));
if(b.s===1&&ph==='dwell'&&b.cans.length<4){for(let i=b.cans.length;i<4;i++)if(w>.08+i*.18){b.cans.push({x:0,y:0,z:32,i,t0:w});tone(880+i*60,.006,.05);}}
for(const c of b.cans)if(c.z>0){const k=clamp((w-c.t0)/.2);c.z=32*(1-k*k);c.x=CAN[c.i][0]*k;c.y=CAN[c.i][1]*k;if(k>=1){c.z=0;c.x=CAN[c.i][0];c.y=CAN[c.i][1];tone(330,.008,.05,0,'triangle');}}
if(b.s===2&&ph==='dwell')b.f=Math.max(b.f,clamp(w/.8));
if(b.s0===2&&ph==='move')b.t=Math.max(b.t,clamp((b.x-114)/20));
if(b.s===3&&ph==='dwell'&&!b.l&&w>.42){b.l=1;labels++;tone(1200,.01,.04);}
}
// Feed: a flat blank drops from the magazine near the end of the dwell.
if(ph==='dwell'&&w>.62&&feeding()&&!boxes.some(b=>b.s===-1)&&!red&&!stop)boxes.push(mk(-1,{z:49}));
// Gantry: pick at the end of the line when the pallet may take another carton.
if(!gan&&!swap&&pick&&ph==='dwell'&&!red&&placed<Math.min(12,n)){gan={k:0,b:pick,s:SLOT[placed]};}
if(gan){gan.k+=d;if(gan.k>.3&&gan.b.s===4){gan.b.s=5;boxes=boxes.filter(b=>b!==gan.b);carry.appendChild(gan.b.g);tone(260,.01,.06,0,'triangle');}
if(gan.k>=1.32&&!gan.put){gan.put=1;carry.replaceChildren();setPlaced(placed+1);tone(180,.012,.08,0,'triangle');if(placed===12&&done)say('Pallet complete. Wrapping.');}
gpos=gPath(gan.k,gan.s);if(gan.k>=2.02)gan=null;}
// Wrap when done and the last carton is down; then the light goes green.
if(done===1&&placed>=12&&!gan&&!swap){wrap=Math.min(1,wrap+d/2.2);film();set(web,'d',poly([[287,42,8+28*wrap],[277,37,8+28*wrap],[277,74,10+28*wrap]]));web.style.opacity=wrap<1?.8:0;if(wrap>=1){done=2;tone(784,.02,.5);tone(1175,.016,.9,.12);say('Complete: twelve cartons, pallet wrapped.');}}
// Draw: cartons, gantry, belt, idlers, sensors, lamps, readouts.
for(const b of boxes.concat(gan&&gan.b.s===5?[gan.b]:[])){const key=[b.e.toFixed(2),b.f.toFixed(2),b.t.toFixed(2),b.l,b.cans.map(c=>c.z.toFixed(1)).join()].join();if(key!==b.k){b.k=key;carton(b.g,b);}const carried=b.s===5;set(b.g,'transform',carried?tr(gpos[0],gpos[1],gpos[2]-14):tr(b.x,LY,b.z));}
LAYER.replaceChildren(...boxes.slice().sort((p,q)=>p.x-q.x).map(b=>b.g));
set(GR,'transform',tr(...gpos));set(WC,'transform',tr(0,0,6+28*wrap));set(GS,'transform',tr(gpos[0],gpos[1],0));set(GA,'transform',tr(gpos[0],0,0));lit(vac,gan&&gan.k>.24&&gan.k<1.32?'b':'');
SEAMS.forEach((s,i)=>{const x=f2(((i*18.5+belt)%222+222)%222);set(s,'x1',x);set(s,'x2',x);});
IDL.forEach(g=>set(g,'transform',`${g._t} rotate(${f2(belt/2.3/RAD%360)})`));set(dsp,'transform',`rotate(${f2(belt/4.6/RAD%360)})`);
const tp=boxes.find(b=>b.s0===2&&ph==='move'&&b.t>0&&b.t<1);if(tp)set(rsp,'transform',`rotate(${f2(-belt*8%360)})`);
if(swap)RL.forEach(g=>set(g,'transform',`rotate(${f2(swap.t*600%360)})`));
// Hopper gate, pushers, tamp pad.
const fill=boxes.find(b=>b.s===1),gOpen=fill&&ph==='dwell'&&w>.05&&w<.82?1:0;set(gate,'d',pd([[59,55,62],[69,55,62],[69,55-10*Math.cos(gOpen*1.2),62-10*Math.sin(gOpen*1.2)],[59,55-10*Math.cos(gOpen*1.2),62-10*Math.sin(gOpen*1.2)]].map(p=>P(...p))));
const fold=boxes.find(b=>b.s===2),fw=fold&&ph==='dwell'?w/.8:2;PUSH.forEach((g,i)=>{const k=fw<2?Math.sin(clamp((fw-i*.42)/.58)*Math.PI):0;set(g,'transform',tr(0,0,-5.6*k));});
const lab=boxes.find(b=>b.s===3),lk=lab&&ph==='dwell'?Math.sin(clamp((w-.1)/.64)*Math.PI):0;set(tamp,'transform',tr(0,10.4*(1-lk),0));lit(pl,lk>.05?'a':'');prn.classList.toggle('lit',lk>.05);
// Sensors: the beam stops at a carton's back face.
for(const e of EYE){const hit=boxes.some(b=>b.s>=0&&Math.abs(b.x-e.x)<10.5);set(e.beam,'d',poly([[e.x,27,36.5],[e.x,hit?41:72,36.5]]));lit(e.le,hit?'a':'g');}
// Stack light: amber running, slow blink waiting, red stopped, green done.
const wait=mode==='det'&&!done&&placed>=n&&!gan&&!swap,blink=red||Math.floor(t/700)%2===0,on=stop?'sr':done===2?'sg':swap||done===1&&wrap>0?(blink?'sa':''):wait?(Math.floor(t/1100)%2?'sa':''):'sa';
SL.forEach(s=>{const o=s.c===on;s.s.classList.toggle('on',o);s.h.style.opacity=o?(done===2?.75:.5):0;});
if(lastUI<0||t-lastUI>140){lastUI=t;
const pc=String(placed).padStart(2,'0');H1.textContent=`${pc}/12`;set(HB,'width',f2(13.8*placed/12));PD.textContent=`LBL ${String(labels).padStart(4,'0')}`;
H2.textContent=stop?'STOPPED':done===2?'COMPLETE':done?'FINISHING':wait?'WAITING':swap?'PALLET OUT':`RUN ${Math.round(30*speed)}/MIN`;
readout.textContent=mode==='det'||done?`PROGRESS ${done===2?100:Math.round((done?1:target)*100)}% · ${pc}/12`:`PALLET ${pc}/12 · ${stop?0:Math.round(30*speed)} /MIN`;
stateLabel.textContent=stop?'STOPPED · SPACE TO RUN':done===2?'COMPLETE · PALLET WRAPPED':done?(wrap>0?'WRAPPING PALLET':'FINISHING · '+(12-placed)+' TO GO'):swap?'PALLET CHANGE':mode==='ind'?'RUNNING · INDETERMINATE':wait?`WAITING · ${n}/12 FOR ${Math.round(target*100)}%`:speed>1.2?`CATCHING UP · ${speed.toFixed(1)}×`:'RUNNING · TO '+n+'/12';}
requestAnimationFrame(tick);
}
sync();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['p', 'i', 'enter', 'space'], draw }
