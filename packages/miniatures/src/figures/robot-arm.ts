// @ts-nocheck
/* ORSEN A–06 · Robot arm. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--st:#bdbdb9;--st-top:#d2d2ce;--st-side:#a8a8a5;--screen:#1c1d1e;--belt:#4a4a48;--rubber:#2e2e2d;--kraft:#d6b98c;--kraft-top:#e6cda4;--kraft-side:#c2a273;--tape:#c3a06b;--label:#fbfbf8;--haz:#e7c544;--haz2:#2f2f2e;--lens:#e2e2de;--estop:#e0453a;--plate:#e9c84a;--hose:#d4d4d0}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--st:#9f9f9c;--st-top:#c4c4c1;--st-side:#767675;--screen:#161717;--belt:#3d3d3c;--rubber:#252524;--kraft:#b49b75;--kraft-top:#d7c099;--kraft-side:#88714f;--tape:#a48659;--label:#d4d4d2;--haz:#c3a638;--haz2:#262625;--lens:#bebebc;--estop:#bd392f;--plate:#c4a83d;--hose:#b2b2b0;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.st{fill:var(--st)}.top.st{fill:var(--st-top)}.side.st{fill:var(--st-side)}.rubber{fill:var(--rubber)}.belt{fill:var(--belt)}.screen{fill:var(--screen)}.kraft{fill:var(--kraft)}.top.kraft{fill:var(--kraft-top)}.side.kraft{fill:var(--kraft-side)}.tape{fill:var(--tape);stroke:none}.lbl{fill:var(--label)}.lens{fill:var(--lens)}.estop{fill:var(--estop)}.plate{fill:var(--plate)}.hz{stroke:none}
.cleat{stroke:#8e8e8a;stroke-width:.5;fill:none;vector-effect:non-scaling-stroke}.belt-marks{animation:feed .9s linear infinite;animation-play-state:paused}.belting .belt-marks{animation-play-state:running}@keyframes feed{to{transform:translateX(9px)}}
.cbu{fill:none;stroke:var(--line);stroke-width:3.6;stroke-linecap:round;stroke-linejoin:round}.cbl{fill:none;stroke:var(--hose);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.jring{fill:none;stroke:var(--off);stroke-width:1.2}.band{fill:none;stroke:var(--off);stroke-width:2.2;stroke-linecap:round}.jring.b,.band.b{stroke:var(--accent);filter:url(#glow)}.jring.a,.band.a{stroke:var(--warn);filter:url(#glow)}.jring.r,.band.r{stroke:var(--fault);filter:url(#glow)}.jring.g,.band.g{stroke:var(--ok);filter:url(#glow)}
.lamp{fill:var(--off);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.r,.lamp.b{filter:url(#glow);stroke:none}
.slg.on .lens{fill:var(--ok)}.sla.on .lens{fill:var(--warn)}.slr.on .lens{fill:var(--fault)}.slh{opacity:0;filter:url(#bloom)}.on .slh{opacity:.5}.slg .slh{fill:var(--ok)}.sla .slh{fill:var(--warn)}.slr .slh{fill:var(--fault)}
.beam{fill:none;stroke:var(--fault);stroke-width:.9;stroke-linecap:round;opacity:.75;filter:url(#glow)}.mark{fill:none;stroke:var(--accent);stroke-width:1;stroke-linecap:round;vector-effect:non-scaling-stroke}
.scr{fill:var(--accent);font:600 4.2px ui-monospace,monospace;letter-spacing:.4px;text-anchor:middle;stroke:none}.scr.r{fill:var(--fault)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<pattern id="haz" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" style="fill:var(--haz2)"/><rect width="3" height="6" style="fill:var(--haz)"/></pattern>
<clipPath id="beltClip"><rect width="128" height="42" rx="2"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* ORSEN A–06 cell. World: x lower-right, y lower-left, z up; moving parts list their home pose.
Part                        x      y      z      w      d      h
robot base plate          155     75      0    100    100      3   hazard border, four anchor bolts
plinth                    175     95      3     60     60     40   display, cycle button, e-stop, vents
stack light               229    101     43   r 4      –     57   pole, green / amber / red lenses
base drum              r 26  205 125     43      –      –     15   status light band
J1 turntable + column  r 23/15 205 125   58      –      –     34   yaws with joint 1, LED ring
J2 shoulder            r 17  205 125    105      –      –     34   axis across the arm plane
upper arm              r 11  L 85        –       –      –      –   cable dress with two clamps
J3 elbow               r 14      –       –       –      –     28
forearm                r 8.5 L 98        –       –      –      –
J4 roll / J5 wrist     r 10.5/10         –       –      –  14/22
J6 flange              r 9       –       –       –      –      8
gripper                   50 × 14 × 10   –       –      –      –   fingers 4 × 14 × 22, travel 8, LED
conveyor legs + feet   46/160 206/248    0       6      6     52   braces, drive at 54 250 36
conveyor bed + rails       40    204     52    130     50     14   belt z 62, cleats, end stop
photo-eye             146 200/250     60       8      6     12   red beam across y 206–250
control box               152    254     22     18      8     22   feed selector, run lamp
out table                 266     82      0     92     36     62   three slots, slot lamps
parcels (3)           67–143    229     62     26     26     24   tape, label
Painter order: every part carries a depth (x + y + z of its centre) and the list is re-sorted as the arm moves. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: vectors, oriented planes, round parts on any axis, oriented boxes, LEDs, depth-sorted items.
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>mul(a,1/(Math.hypot(...a)||1)),mid=(a,b)=>mul(add(a,b),.5),depth=a=>a[0]+a[1]+a[2],inset=(a,b,t)=>add(a,mul(unit(sub(b,a)),t)),VIEW=[1,1,1];
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`,shade=n=>n[2]>.6?'top':n[0]>n[1]?'side':'';
const draw=root,into=g=>root=g;
function axes(n){const U=unit(Math.abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U);const a=P(...U),b=P(...V);if(a[0]*b[1]-a[1]*b[0]<0)V=mul(V,-1);return[U,V];}
function tube(g,a,b,r,cls=''){const ax=sub(b,a),n=unit(ax),[U,V]=axes(n),pu=P(...U),pv=P(...V),pd=P(...ax),det=pu[0]*pv[1]-pv[0]*pu[1],u=(pd[0]*pv[1]-pv[0]*pd[1])/det,v=(pu[0]*pd[1]-pd[0]*pu[1])/det,l=Math.hypot(u,v)||1,tx=-v*r/l,ty=u*r/l;
el('path',{d:`M${tx},${ty} A${r},${r} 0 0 1 ${-tx},${-ty} L${u-tx},${v-ty} A${r},${r} 0 0 1 ${u+tx},${v+ty} Z`,transform:plane(a,U,V),class:'face '+cls},g);
const f=dot(n,VIEW)>0,cap=group(plane(f?b:a,U,V),g);circle(cap,0,0,r,'face '+shade(f?n:mul(n,-1))+' '+cls);cap.c=f?b:a;return cap;}
function obox(g,c,U,V,N,w,d,h,cls='',r=1.5){const ax=[[U,w],[V,d],[N,h]],out=[];
for(let i=0;i<3;i++)for(const s of[1,-1]){const n=mul(ax[i][0],s);if(dot(n,VIEW)<=.01)continue;const[B,lb]=ax[(i+1)%3],[E,le]=ax[(i+2)%3],o=add(add(add(c,mul(n,ax[i][1]/2)),mul(B,-lb/2)),mul(E,-le/2)),f=group(plane(o,B,E),g);rect(f,0,0,lb,le,r,'face '+shade(n)+' '+cls);out.push({n,f,i,lb,le});}return out;}
function lamp(g,x,y,r=1){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c,base='lamp'){if(n&&n._c!==c){n._c=c;set(n,'class',base+(c?' '+c:''));}}
const items=[];function item(d,node=el('g',{})){const o={node,d};items.push(o);return o;}
function stat(d,fn){const o=item(d);into(o.node);fn();into(draw);return o;}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
// Ground: shadow, robot base plate with its hazard border and anchor bolts.
const sh=P(206,150,0);el('ellipse',{cx:sh[0],cy:sh[1]-4,rx:236,ry:68,class:'shadow stage-floor'});el('ellipse',{cx:sh[0],cy:sh[1]-4,rx:236,ry:68,class:'stage-contact'});
box(155,75,0,100,100,3,2,'st');const hz=group(TOP(155,75,3.02));el('path',{d:'M5,5H95V95H5ZM13,13V87H87V13Z','fill-rule':'evenodd',fill:'url(#haz)',class:'hz'},hz);
for(const[u,v]of[[9,9],[91,9],[9,91],[91,91]]){circle(hz,u,v,2.6,'face metal');circle(hz,u,v,1.1,'face recess');}
// Conveyor: legs, drive, control box (behind the belt); bed, back rail, belt, photo-eye; front rail last.
let feedSel,runLamp,eyeLamp,beam,belt;
stat(300,()=>{for(const x of[46,160])for(const y of[206,248]){cylinder(x+3,y+3,0,3.6,4,'z','rubber');box(x,y,4,6,6,48,1,'metal');}
for(const y of[206,248])box(52,y+1,18,108,4,4,.6,'metal');
box(54,250,36,14,6,16,1.5,'st');const m=cylinder(61,256,44,7,14,'y','st');slits(m.face,-5,-4.5,10,9,5);circle(m.face,0,0,2,'face top st');
box(152,254,22,18,8,22,2,'st');const cb=group(FRONT(152,262,44));text(cb,9,5,'FEED','etch micro center');runLamp=lamp(cb,14.5,4,.9);
feedSel=button(group('',cb),{'aria-label':'Conveyor feed selector: hold or feed (F)','aria-pressed':'true'});circle(feedSel,9,13,5.6,'face recess');circle(feedSel,9,13,4.4,'face top');feedSel.k=el('path',{d:'M9,13L9,9.4',class:'detail',style:'stroke-width:1.6'},feedSel);circle(feedSel,9,13,7.6,'focus-ring');circle(feedSel,9,13,9,'hit');});
stat(350,()=>{box(40,204,52,130,50,6,2,'metal');box(40,204,58,130,4,8,1,'metal');const rb=group(FRONT(40,208,66));for(const v of[2.4,5.2])line(rb,3,v,127,v);
belt=group(TOP(42,208,62));rect(belt,0,0,128,42,2,'face belt');const mk=el('g',{class:'belt-marks'},el('g',{'clip-path':'url(#beltClip)'},belt));for(let x=-9;x<140;x+=9)line(mk,x,1,x,41,'cleat');
cylinder(170,208,58,4,42,'y','belt');box(163,208,62,3,42,7,.6,'metal');
box(146,202,66,8,6,10,1.2,'st');eyeLamp=lamp(group(FRONT(146,208,76)),4,3.4,1);});
stat(355,()=>{beam=wire([[150,208,70],[150,250,70]],'beam');});
stat(460,()=>{box(40,250,58,130,4,8,1,'metal');const fr=group(FRONT(40,254,66));for(const v of[2.4,5.2])line(fr,3,v,127,v);text(fr,10,7.2,'IN · 01','etch micro');box(146,250,66,8,4,9,1.2,'st');rect(group(FRONT(146,254,75)),2,2,4,4,.8,'face recess');});
// Out table with three slots and their lamps.
const slotLamp=[];
stat(440,()=>{for(const x of[268,352])for(const y of[84,112])box(x,y,0,4,4,58,.8,'st');box(272,113,14,80,2,3,.5,'st');});
stat(450,()=>{box(266,82,58,92,36,4,1.5,'st');const tp=group(TOP(266,82,62.02));for(let i=0;i<3;i++){const u=5+i*28;for(const[a,b,c,d]of[[u,4,u+5,4],[u,4,u,9],[u+26,4,u+21,4],[u+26,4,u+26,9],[u,32,u+5,32],[u,32,u,27],[u+26,32,u+21,32],[u+26,32,u+26,27]])line(tp,a,b,c,d);}
const tf=group(FRONT(266,118,62));for(let i=0;i<3;i++)slotLamp.push(lamp(tf,18+i*28,2,.9));text(tf,88,3.2,'OUT','etch micro');});
// Plinth: display, cycle button, e-stop, vents; base drum with its status band; stack light.
let disp,cycleBtn,eBtn,band;
stat(320,()=>{box(175,95,3,60,60,40,4);const pf=group(FRONT(175,155,43));text(pf,6,8.6,'ORSEN','label brand');text(pf,6.2,13.6,'A–06 · 6 AXIS','etch micro');
rect(pf,6,17,32,11,1.6,'face recess');rect(pf,7.2,18.2,29.6,8.6,1,'face screen');disp=text(pf,22,24,'READY','scr');slits(pf,6,32,48,4.4,16);
cycleBtn=button(group('',pf),{'aria-label':'Run or pause the pick-and-place cycle (Space)','aria-pressed':'false'});circle(cycleBtn,48,22,7.4,'face recess');cycleBtn.r=circle(cycleBtn,48,22,6.2,'jring');circle(cycleBtn,48,22,4.8,'face top');el('path',{d:'M46.4,19.6L50.6,22L46.4,24.4Z',fill:'var(--accent)'},cycleBtn);circle(cycleBtn,48,22,9.4,'focus-ring');
const ps=group(SIDE(235,155,43));slits(ps,6,6,26,24,7,false);rect(ps,38,12,17,17,2,'face plate');text(ps,46.5,27.4,'STOP','etch micro center');for(const[u,v]of[[4,4],[56,4],[4,36],[56,36]])screw(ps,u,v);
eBtn=button(group(SIDE(235,155,43)),{'aria-label':'Emergency stop (E)','aria-pressed':'false'});eBtn.cap=group('',eBtn);circle(eBtn.cap,46.5,20.5,6,'face estop');circle(eBtn.cap,46.5,20.5,4,'detail');circle(eBtn,46.5,20.5,9,'focus-ring');circle(eBtn,46.5,20.5,10,'hit');
cylinder(205,125,43,26,15,'z','');const bt=group(TOP(205,125,47));band=el('path',{d:`M${26*Math.cos(-.785)},${26*Math.sin(-.785)}A26,26 0 0 1 ${26*Math.cos(2.356)},${26*Math.sin(2.356)}`,class:'band'},bt);});
const SL=[];stat(400,()=>{const host=root;cylinder(229,101,43,1.8,36,'z','metal');for(const[c,z]of[['slg',79],['sla',85.4],['slr',91.8]]){const g=into(el('g',{class:c},host));cylinder(229,101,z,4,6,'z','lens');const h=P(229,101,z+3);el('circle',{cx:h[0],cy:h[1],r:9,class:'slh'});into(host);SL.push(g);}cylinder(229,101,98.2,4.4,1.6,'z','metal');});
// Six revolute axes: yaw, shoulder, elbow, forearm roll, wrist pitch, tool roll.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),origin=[205,125,105],L1=85,L2=98,L3=39,RAD=Math.PI/180;
const home=[184,204,139],pick=[143,229,90],slots=[[284,100,90],[312,100,90],[340,100,90]],QUEUE=[143,105,67];
function ik(t){const a=sub(t,origin),r=Math.hypot(a[0],a[1]),v=a[2]+L3,c=Math.max(-.999,Math.min(.999,(r*r+v*v-L1*L1-L2*L2)/(2*L1*L2))),elbow=-Math.acos(c),shoulder=Math.atan2(v,r)-Math.atan2(L2*Math.sin(elbow),L1+L2*Math.cos(elbow)),yaw=Math.atan2(a[1],a[0]);return[yaw,shoulder,elbow,0,-Math.PI/2-shoulder-elbow,yaw+Math.PI/2];}
let q=ik(home),qp=q.slice(),qv=[0,0,0,0,0,0],gap=1,held=null,placed=0,feed=true,sequence=null,paused=false,motion=null,beltMove=null,fall=null,estop=false,jogJ=-1,jogUntil=0,status='SERVOS READY',read='06 axes',last=0;
function part(label,fn){const node=label?button(el('g',{}),{'aria-label':label}):el('g',{});if(fn)bind(node,fn);const o=item(0,node);o.shape=el('g',{},node);return o;}
const J=[0,1,2,3,4,5].map(i=>part(`Jog joint ${i+1} (${i+1})`,()=>jog(i))),A=[0,1].map(()=>part()),F=[0,1].map(()=>part()),grip=part('Open or close the parallel gripper (G)',gripper);set(grip.node,'aria-pressed','false');
const crates=QUEUE.map((x,i)=>Object.assign(part(),{id:i,p:[x,229,74],u:[1,0,0],v:[0,1,0],n:[0,0,1],location:'belt'}));
function fk(){const yaw=q[0],a=q[1],b=a+q[2],radial=[Math.cos(yaw),Math.sin(yaw),0],side=[-Math.sin(yaw),Math.cos(yaw),0],d1=add(mul(radial,Math.cos(a)),[0,0,Math.sin(a)]),d2=add(mul(radial,Math.cos(b)),[0,0,Math.sin(b)]),normal=add(mul(radial,-Math.sin(b)),[0,0,Math.cos(b)]),rolled=add(mul(normal,Math.cos(q[3])),mul(side,Math.sin(q[3]))),axis=unit(add(mul(d2,Math.cos(q[4])),mul(rolled,Math.sin(q[4])))),elbow=add(origin,mul(d1,L1)),wrist=add(elbow,mul(d2,L2)),tip=add(wrist,mul(axis,L3));
const u0=unit(cross(d2,rolled)),v0=unit(cross(axis,u0)),u=add(mul(u0,Math.cos(q[5])),mul(v0,Math.sin(q[5]))),v=unit(cross(axis,u));return{elbow,wrist,tip,axis,u,v,u0,side,d1,d2};}
function upd(o,p,fn){o.shape.replaceChildren();o.ring=null;fn(o.shape);o.d=depth(p);}
function hub(o,g,a,b,r,mark){const cap=tube(g,a,b,r);o.ring=circle(cap,0,0,r*.84,'jring');o.ring._c='';circle(cap,0,0,r*.42,'face recess');if(mark)wire([add(cap.c,mul(mark,r*.48)),add(cap.c,mul(mark,r*.72))],'mark',g);circle(cap,0,0,Math.max(12,r+3),'hit');circle(cap,0,0,r+2,'focus-ring');return cap;}
function drawCrate(c){const g=c.shape;g.replaceChildren();for(const f of obox(g,c.p,c.u,c.v,c.n,26,26,24,'kraft',1)){if(f.i===2)rect(f.f,11.5,0,3,26,0,'tape');else if(f.i===1){rect(f.f,6,5,12,16,.8,'face lbl');for(let k=0;k<6;k++)line(f.f,8,7.5+k*2.2,13+(k*7)%4,7.5+k*2.2);}}c.d=depth(c.p)+(c===held?6:0);}
function render(){const k=fk(),s=dot(k.side,VIEW)>0?k.side:mul(k.side,-1),rad=[Math.cos(q[0]),Math.sin(q[0]),0];
upd(J[0],[205,125,72],g=>{hub(J[0],g,[205,125,58],[205,125,70],23);tube(g,[205,125,70],[205,125,93],15);});
upd(J[1],origin,g=>hub(J[1],g,add(origin,mul(k.side,-17)),add(origin,mul(k.side,17)),17,k.d1));
upd(A[0],mid(origin,k.elbow),g=>{const a=inset(origin,k.elbow,12),b=inset(k.elbow,origin,10);tube(g,a,b,11);const c1=add(a,mul(s,13)),c2=add(b,mul(s,12));for(const cls of['cbu','cbl'])wire([add(origin,mul(s,15)),c1,c2,add(k.elbow,mul(s,13))],cls,g);for(const t of[.3,.7]){const p=add(c1,mul(sub(c2,c1),t));wire([add(p,mul(k.d1,-1.6)),add(p,mul(k.d1,1.6))],'detail',g);}});
upd(J[2],k.elbow,g=>hub(J[2],g,add(k.elbow,mul(k.side,-14)),add(k.elbow,mul(k.side,14)),14,k.d2));
const roll=add(k.wrist,mul(k.d2,-17));
upd(A[1],mid(k.elbow,roll),g=>tube(g,inset(k.elbow,roll,9),add(roll,mul(k.d2,-6)),8.5));
upd(J[3],roll,g=>hub(J[3],g,add(roll,mul(k.d2,-7)),add(roll,mul(k.d2,7)),10.5));
upd(J[4],k.wrist,g=>hub(J[4],g,add(k.wrist,mul(k.u0,-11)),add(k.wrist,mul(k.u0,11)),10,k.axis));
upd(J[5],add(k.wrist,mul(k.axis,13)),g=>hub(J[5],g,add(k.wrist,mul(k.axis,9)),add(k.wrist,mul(k.axis,17)),9));
const palm=add(k.wrist,mul(k.axis,22));
upd(grip,palm,g=>{const fs=obox(g,palm,k.u,k.v,k.axis,50,14,10,'',2);grip.led=null;for(const f of fs)if(f.i===1){grip.led=lamp(f.f,5,42,1.2);rect(f.f,2.5,4,5,10,1,'face recess');}const cap=group(plane(palm,k.u,k.v),g);rect(cap,-27,-9,54,18,4,'hit');rect(cap,-27,-9,54,18,4,'focus-ring');});
F.forEach((f,i)=>{const c=add(add(palm,mul(k.axis,17)),mul(k.u,(i?1:-1)*(15.5+gap*8)));upd(f,c,g=>obox(g,c,k.u,k.v,k.axis,4,14,22,'metal',1));});
if(held){held.p=add(k.tip,mul(k.axis,16));held.n=mul(k.axis,-1);held.u=k.u;held.v=mul(k.v,-1);}
for(const c of crates)drawCrate(c);
const sorted=items.slice().sort((a,b)=>a.d-b.d),focused=document.activeElement;for(const o of sorted)draw.appendChild(o.node);if(focused?.matches?.('.control'))focused.focus({preventScroll:true});}
frame([[40,204,0,130,64,70],[155,75,0,100,100,3],[160,90,58,90,80,150],[266,82,0,92,36,88]],16);
// State: a cycle is a list of joint targets; jogs, the gripper, feed and the e-stop own the rest.
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),keys={};
document.querySelectorAll('.hint [data-k]').forEach(b=>{keys[b.dataset.k]=b;});
let ac=null;
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,d=.1,v=.015,type='sine',when=0){if(!ac)return;try{const t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
function say(s){announcement.textContent=s;}
function ui(){readout.textContent=`${read} · ${String(placed).padStart(2,'0')} placed`;stateLabel.textContent=status;const run=!!sequence&&!paused;
set(cycleBtn,'aria-pressed',run);set(keys[' '],'aria-pressed',run);set(feedSel,'aria-pressed',feed);set(keys.f,'aria-pressed',feed);set(eBtn,'aria-pressed',estop);set(keys.e,'aria-pressed',estop);set(grip.node,'aria-pressed',gap<.5);
set(feedSel.k,'d',feed?'M9,13L9,9.4':'M9,13L5.6,13');set(eBtn.cap,'transform',estop?'translate(46.5 20.5) scale(.84) translate(-46.5 -20.5)':'');}
function halted(){if(!estop)return false;status='E-STOP ACTIVE · E TO RESET';say('Emergency stop is latched. Press E to reset.');tone(220,.12,.02,'square');ui();return true;}
function cancel(){sequence=null;paused=false;motion=null;}
function startMotion(target,duration=500,targetGap=gap,done=null){motion={from:q.slice(),to:target.slice(),start:performance.now(),duration:reduced.matches?60:duration,g0:gap,g1:targetGap,done};}
function jog(i){audio();if(halted())return;cancel();const t=q.slice(),limits=[[-180,180],[15,140],[-150,-10],[-180,180],[-150,45],[-360,360]],deg=t[i]/RAD+12;t[i]=(deg>limits[i][1]?limits[i][0]:deg)*RAD;jogJ=i;jogUntil=performance.now()+900;read=`J${i+1} ${Math.round(t[i]/RAD)}°`;status=held?'JOG · LOAD HELD':'MANUAL · JOINT '+(i+1);say(`Joint ${i+1}, ${Math.round(t[i]/RAD)} degrees.`);tone(520+i*60,.06);startMotion(t,320);ui();}
function attach(){const k=fk(),c=crates.find(c=>c.location==='belt'&&Math.hypot(c.p[0]-k.tip[0],c.p[1]-k.tip[1])<10&&Math.abs(c.p[2]+16-k.tip[2])<12);if(c){held=c;c.location='held';say('Gripper closed. Parcel secured.');}return !!c;}
function surface(p){if(p[0]>266&&p[0]<358&&p[1]>82&&p[1]<118&&p[2]>=72)return 62;if(p[0]>40&&p[0]<170&&p[1]>204&&p[1]<254&&p[2]>=72)return 62;return 0;}
function release(auto=false){if(!held)return;const c=held;held=null;c.location=auto?'shelf':'dropped';fall={c,from:c.p.slice(),to:[c.p[0],c.p[1],surface(c.p)+12],start:performance.now(),duration:reduced.matches?60:300};if(auto){placed++;tone(880,.08);tone(1175,.1,.015,'sine',.09);say(`Parcel placed. ${placed} of three slots filled.`);}}
function gripper(){audio();if(halted())return;cancel();const closing=gap>.5;read=closing?'GRIP CLOSED':'GRIP OPEN';status=closing?'JAWS · CLOSING':'JAWS · OPENING';tone(closing?300:420,.08,.015,'triangle');startMotion(q,250,closing?0:1,()=>{if(closing){attach();status=held?'LOAD SECURED':'JAWS CLOSED';}else{release();status='JAWS OPEN';}ui();});say(closing?'Closing gripper.':'Opening gripper.');ui();}
function feedToggle(){audio();if(halted())return;feed=!feed;status=feed?'CONVEYOR · FEED':'CONVEYOR · HOLD';read=feed?'BELT RUN':'BELT HOLD';tone(feed?660:330,.06);if(feed&&!sequence)indexBelt();say(feed?'Conveyor feed enabled.':'Conveyor held.');ui();}
function indexBelt(){const c=crates.filter(c=>c.location==='belt').sort((a,b)=>b.p[0]-a.p[0]);if(!c.length)return;const delta=143-c[0].p[0];if(delta>1)beltMove={duration:reduced.matches?60:900,crates:c.map(c=>({c,from:c.p[0],to:c.p[0]+delta})),elapsed:0};}
function eStop(){audio();estop=!estop;if(estop){cancel();beltMove=null;status='E-STOP ACTIVE · E TO RESET';read='HALT';say('Emergency stop. All axes and the conveyor halted.');tone(180,.3,.03,'square');}else{status='SERVOS READY';read='06 axes';say('Emergency stop reset. Servos ready.');tone(660,.08);tone(880,.1,.015,'sine',.1);}ui();}
function cycle(){audio();if(halted())return;
if(sequence){paused=!paused;if(paused){sequence.pauseAt=performance.now();status='CYCLE PAUSED';read='HOLD · '+String(sequence.i+1).padStart(2,'0');}else{if(motion)motion.start+=performance.now()-sequence.pauseAt;status=sequence.steps[sequence.i].label;read='STEP '+String(sequence.i+1).padStart(2,'0');}say(paused?'Cycle paused. Press Space to resume.':'Cycle resumed.');ui();return;}
if(placed>=3){placed=0;crates.forEach((c,i)=>Object.assign(c,{p:[QUEUE[i],229,74],u:[1,0,0],v:[0,1,0],n:[0,0,1],location:'belt'}));held=null;status='NEW BATCH · SPACE TO RUN';read='06 axes';say('Table cleared and three new parcels on the conveyor.');render();ui();return;}
const queue=crates.filter(c=>c.location==='belt').sort((a,b)=>b.p[0]-a.p[0]);if(!held&&(!queue.length||Math.abs(queue[0].p[0]-143)>1)){if(!feed){status='FEED HELD · PRESS F';read='NO PARCEL';say('The conveyor is held. Press F to feed.');ui();return;}indexBelt();status='INDEXING · CONVEYOR';read='FEED TO PICK';say('Feeding the next parcel to the photo-eye, then press Space.');ui();return;}
const slot=slots[placed],p=ik(pick),high=ik([143,229,158]),reach=ik([slot[0],slot[1],154]),place=ik(slot),aim=q.slice();aim[0]=p[0];const slew=high.slice();slew[0]=reach[0];slew[5]=q[5];const align=reach.slice();align[5]=place[5];reach[5]=q[5];
const steps=[];if(!held)steps.push({label:'01 · AIM AT PARCEL',q:aim,g:1,t:450},{label:'02 · APPROACH',q:ik([143,229,119]),g:1,t:650},{label:'03 · LOWER TO PICK',q:p,g:1,t:500},{label:'04 · CLAMP PARCEL',q:p,g:0,t:300,done:attach});
steps.push({label:'05 · LIFT CLEAR',q:high,g:0,t:550},{label:'06 · BASE TRANSFER',q:slew,g:0,t:850},{label:'07 · REACH TABLE',q:reach,g:0,t:650},{label:'08 · ALIGN TOOL',q:align,g:0,t:450},{label:'09 · LOWER TO SLOT',q:place,g:0,t:550},{label:'10 · RELEASE PARCEL',q:place,g:1,t:300,done:()=>release(true)},{label:'11 · RETRACT',q:align,g:1,t:450},{label:'12 · RETURN HOME',q:ik(home),g:1,t:950,done:()=>{if(feed)indexBelt();}});
sequence={steps,i:-1};paused=false;tone(880,.06);nextStep();say('Pick-and-place cycle started.');}
function nextStep(){if(!sequence)return;sequence.i++;const s=sequence.steps[sequence.i];if(!s){sequence=null;status=placed===3?'BATCH COMPLETE · SPACE FOR NEW':'CYCLE COMPLETE';read='06 axes';ui();return;}status=s.label;read='STEP '+String(sequence.i+1).padStart(2,'0');startMotion(s.q,s.t,s.g,()=>{s.done?.();nextStep();});ui();}
const act={' ':cycle,g:gripper,f:feedToggle,e:eStop};
for(const[k,b]of Object.entries(keys))b.addEventListener('click',()=>act[k]());
bind(cycleBtn,cycle);bind(feedSel,feedToggle);bind(eBtn,eStop);
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const key=e.key.toLowerCase();if(key===' '&&e.target.closest&&e.target.closest('button,[role=button]'))return;if(act[key]){e.preventDefault();act[key]();}else if(/^[1-6]$/.test(key)){e.preventDefault();jog(+key-1);}});
function lights(now){const red=reduced.matches,run=!!sequence&&!paused&&!estop,jogging=now<jogUntil,blink=red||Math.floor(now/450)%2===0,slow=red||now%2400<1700;
const mode=estop?'r':paused||!feed||jogging?'a':run?'b':'g';
SL[0].classList.toggle('on',!estop&&(run||mode==='g'&&slow));SL[1].classList.toggle('on',mode==='a');SL[2].classList.toggle('on',estop&&blink);
lit(band,estop&&!blink?'':mode,'band');lit(cycleBtn.r,run?'b':paused?'a':'','jring');
J.forEach((j,i)=>lit(j.ring,estop?'r':jogging&&i===jogJ?'a':Math.abs(qv[i])>.25?'b':'','jring'));
lit(grip.led,estop?'r':held?'b':gap<.5?'a':'g');
const atEye=crates.some(c=>c.location==='belt'&&Math.abs(c.p[0]-143)<14);set(beam,'d',poly([[150,208,70],[150,atEye?215.8:250,70]]));beam.style.opacity=estop?.25:'';lit(eyeLamp,atEye?'g':'');
lit(runLamp,estop?'r':!feed?'a':beltMove?(blink?'g':''):'g');slotLamp.forEach((l,i)=>lit(l,i<placed?'g':''));
const dt=estop?'E-STOP':sequence?(paused?'HOLD':'STEP '+String(sequence.i+1).padStart(2,'0')):jogging?`J${jogJ+1} ${String(Math.round(q[jogJ]/RAD)).padStart(4,' ')}°`:'READY';if(disp.textContent!==dt){disp.textContent=dt;set(disp,'class',estop?'scr r':'scr');}
svg.classList.toggle('belting',!!beltMove&&!estop);}
function tick(now){const dt=Math.max(1e-3,Math.min(.05,(now-(last||now))/1000));let dirty=false;
if(motion&&!paused&&!estop){const m=motion,p=Math.min(1,(now-m.start)/m.duration),s=p*p*(3-2*p);q=m.from.map((v,i)=>v+(m.to[i]-v)*s);gap=m.g0+(m.g1-m.g0)*s;dirty=true;if(p>=1){motion=null;m.done?.();}}
if(beltMove&&feed&&!paused&&!estop){const m=beltMove;m.elapsed+=Math.min(40,now-last);const p=Math.min(1,m.elapsed/m.duration),s=p*p*(3-2*p);for(const o of m.crates)o.c.p[0]=o.from+(o.to-o.from)*s;dirty=true;if(p>=1){beltMove=null;tone(1320,.04,.01);}}
if(fall){const f=fall,p=Math.min(1,(now-f.start)/f.duration);f.c.p=f.from.map((v,i)=>v+(f.to[i]-v)*p*p);f.c.u=[1,0,0];f.c.v=[0,1,0];f.c.n=[0,0,1];dirty=true;if(p>=1)fall=null;}
qv=q.map((v,i)=>(v-qp[i])/dt);qp=q.slice();
if(dirty)render();lights(now);last=now;requestAnimationFrame(tick);}
render();ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [' ', 'g', 'f', 'e'], draw }
