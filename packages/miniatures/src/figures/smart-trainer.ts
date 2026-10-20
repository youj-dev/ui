// @ts-nocheck
/* RAVELO T–1 · Smart trainer. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--rubber:#2e2e2d;--rubber-top:#474745;--dk:#3a3a39;--dk-top:#4a4a48;--dk-side:#2d2d2c;--mat:#575755;--mat-top:#5f5f5d;--mat-line:#6f6f6c;--frame:#fafaf7;--frame-sh:#d3d3cf;--frame-hi:#fff;--screen:#1c1d1e;--chain:#4b4b49;--pin:#b4b4b0;--air:#8f8f8b;--seg:#5e5e5c;--zc:#3b5bfd}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--rubber:#252524;--rubber-top:#424240;--dk:#2f2f2f;--dk-top:#454543;--dk-side:#1d1d1c;--mat:#484847;--mat-top:#585856;--mat-line:#5c5c5a;--frame:#d3d3d1;--frame-sh:#b2b2af;--frame-hi:#d7d7d7;--screen:#161717;--chain:#3e3e3c;--pin:#979795;--air:#787875;--seg:#4e4e4d;--zc:#3b5bfd;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}.side.rubber{fill:var(--rubber)}.dk{fill:var(--dk)}.top.dk{fill:var(--dk-top)}.side.dk{fill:var(--dk-side)}.mat{fill:var(--mat)}.top.mat{fill:var(--mat-top)}.matl{fill:none;stroke:var(--mat-line);stroke-width:.8}.screen{fill:var(--screen)}.hole{fill-rule:evenodd}.frm,.top.frm,.side.frm{fill:var(--frame)}.bottle{fill:var(--glass)}.top.bottle{fill:var(--top)}.side.bottle{fill:var(--side)}.emb{fill:var(--mat-line);font:600 5px ui-monospace,monospace;letter-spacing:2.4px}.dec{fill:var(--ink);font:600 2.3px ui-monospace,monospace;letter-spacing:1px;text-anchor:middle}
.su,.sf,.ss,.sh,.sr,.sm,.ch,.chp{fill:none;stroke-linecap:round;stroke-linejoin:round}.su{stroke:var(--line)}.sf{stroke:var(--frame)}.ss{stroke:var(--frame-sh)}.sh{stroke:var(--frame-hi)}.sr{stroke:var(--rubber)}.sm{stroke:var(--metal)}.ch{stroke:var(--chain)}.chp{stroke:var(--pin);stroke-dasharray:.55 .75;stroke-linecap:butt}
.teeth{fill:none;stroke:var(--line);stroke-dasharray:.3 .5}.spk{stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke;opacity:.85}.tape{fill:none;stroke:var(--rubber-top);stroke-width:.3;stroke-dasharray:.25 1.1}
.lamp{fill:var(--off);stroke:none}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.r,.lamp.b{filter:url(#glow)}
.seg{fill:none;stroke:var(--seg);stroke-width:1.7}.seg.b{stroke:var(--accent)}.seg.g{stroke:var(--ok)}.seg.a{stroke:var(--warn)}.seg.r{stroke:var(--fault)}.seg.b,.seg.g,.seg.a,.seg.r{filter:url(#glow)}.zhalo{fill:none;stroke:var(--zc);stroke-width:4;filter:url(#bloom);opacity:0}.pool{opacity:0}
.scr{fill:var(--accent);font:600 6px ui-monospace,monospace;letter-spacing:.2px;stroke:none}.scr.s{font:2.1px ui-monospace,monospace;letter-spacing:.25px}.scr.m{font:600 2.7px ui-monospace,monospace;letter-spacing:.2px}.dim{opacity:.6}.spark{fill:none;stroke:var(--accent);stroke-width:.5;stroke-linejoin:round}.grid{stroke:var(--accent);stroke-width:.2;opacity:.25}.lvl{fill:var(--accent);opacity:.2}.lvl.on{opacity:1}.halo{fill:var(--accent);opacity:.16;filter:url(#bloom)}.zdot{fill:var(--zc)}
.blade{fill:var(--metal-top);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.blur{fill:var(--line);opacity:0;stroke:none}.grille{fill:none;stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke}.air{fill:none;stroke:var(--air);stroke-width:.6;stroke-linecap:round;stroke-dasharray:3 9;opacity:0}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="poolG"><stop offset="0" style="stop-color:var(--zc);stop-opacity:.55"/><stop offset="1" style="stop-color:var(--zc);stop-opacity:0"/></radialGradient>
<clipPath id="tabClip"><rect x="1.6" y="1.6" width="24.8" height="16.8" rx="1"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* RAVELO T–1. World: x lower-right, y lower-left, z up; 1 unit ≈ 10 mm. The bike sits in the plane x 60 facing −y, drive side (+x) toward the viewer.
Part                        x      y      z      w      d      h
mat                        24     28      0     76    168    1.2   border, embossed brand
fan base + neck + head     34    −18      0     20     20     39   head r 14.4 aimed up at the rider, 3 speed lamps
tablet stand + tablet      75      0      0     22     21    110   tripod r 11, collar, ball head, 28 × 20 tablet facing the rider
riser block                52     40    1.2     16     22    4.2   cupped top under the front tyre
front wheel             r 33.6    60     51     39      –      –   tyre, alloy rim, 24 spokes, hub, disc rotor at x 55.4
trainer front leg        52.4  107.6    1.2    8.6     58    4.6   rubber foot cap
trainer cross foot       21.6  169.4    1.2     77     13    5.4   rubber end caps
cradle                     47    150    4.6     20     34      5   brand plate
axle boss            53.6–62.2   145     30      –     19     14   capsule from the axle 60 150 39
flywheel drum         50–62.4    168   29.6   r 20      –      –   dark face, flywheel window, 36-lamp status ring, 3 lamps
carry handle             56.2    160     47      –     16    5.6
cassette 11–30      62.9–66.6    150     39  r 2.2–6.1  –      –   freehub, dropouts at x 52.9 / 67.1
frame      BB 60 110 32 · seat cluster 60 124.8 81.9 · head tube 60 66.6–71 73.7–88 · rear axle 60 150 39
fork, stem, bar         38–82   50–73  39–95      –      –      –   drops 42 wide, hoods, tape, brake hose
seatpost + saddle        53.2  117.4  98–101   13.6     27      –
bottle                     60  86–101  47–64  r 3.7      –      –   on the down tube
chainrings 50/34    63.8/64.6    110     32 r 6.9/10.1   –      –   cranks 17 at x 53 / 67, pedals 6.4 wide
rear derailleur         63–69 146–153  22–37      –      –      –   two jockeys, follows the selected cog
Painter order: floor, fan, stand, far-side parts, front wheel, trainer, frame, cockpit, drivetrain, near crank. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: vectors, oriented planes, rods on any axis, outlined strokes, extrusions, lamps and controls.
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(Math.hypot(...a)||1)),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),RAD=Math.PI/180,f2=v=>v.toFixed(2);
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`,draw=root,into=g=>root=g;
function rod(a,b,r,cls='',cap=true){const ax=sub(b,a),n=unit(ax),U=unit(Math.abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U),pu=P(...U),pv=P(...V);if(pu[0]*pv[1]-pu[1]*pv[0]<0){V=mul(V,-1);pv=P(...V);}const pd=P(...ax),det=pu[0]*pv[1]-pv[0]*pu[1],u=(pd[0]*pv[1]-pv[0]*pd[1])/det,v=(pu[0]*pd[1]-pd[0]*pu[1])/det,l=Math.hypot(u,v)||1,tx=-v*r/l,ty=u*r/l;
el('path',{d:`M${f2(tx)},${f2(ty)}A${r},${r} 0 0 1 ${f2(-tx)},${f2(-ty)}L${f2(u-tx)},${f2(v-ty)}A${r},${r} 0 0 1 ${f2(u+tx)},${f2(v+ty)}Z`,transform:plane(a,U,V),class:'face '+cls});if(!cap)return null;const g=group(plane(dot(n,[1,1,1])>0?b:a,U,V));circle(g,0,0,r,'face top '+cls);return g;}
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
function sk(d,w,cls,parent=root){el('path',{d,class:'su','stroke-width':w+.7},parent);return el('path',{d,class:cls,'stroke-width':w},parent);}
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const p of pts){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(const p of pts.reverse()){while(hi.length>1&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
function capsule(a,b,r,n=8){const t=Math.atan2(b[1]-a[1],b[0]-a[0]),o=[];for(const[c,s]of[[a,t+Math.PI/2],[b,t-Math.PI/2]])for(let i=0;i<=n;i++)o.push([c[0]+r*Math.cos(s+Math.PI*i/n),c[1]+r*Math.sin(s+Math.PI*i/n)]);return o;}
const closed=p=>'M'+p.map(q=>q.map(f2).join(',')).join('L')+'Z';
function extrude(o,x0,x1,cls=''){const A=o.map(([y,z])=>P(x0,y,z)),B=o.map(([y,z])=>P(x1,y,z));el('path',{d:closed(hull(A.concat(B))),class:'face side '+cls});return el('path',{d:closed(B),class:'face '+cls});}
function ann(g,R,r,cls){return el('path',{d:`M${R},0A${R},${R} 0 1 0 ${-R},0A${R},${R} 0 1 0 ${R},0ZM${r},0A${r},${r} 0 1 1 ${-r},0A${r},${r} 0 1 1 ${r},0Z`,class:'face hole '+cls},g);}
function lamp(g,x,y,r=1){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c,base='lamp'){if(n._c!==c){n._c=c;set(n,'class',base+(c?' '+c:''));}}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
// Floor: shadow, training mat with its brand, the light the status ring throws on it.
const sp=P(62,112,0);el('ellipse',{cx:sp[0],cy:sp[1]+6,rx:116,ry:62,class:'shadow stage-floor'});el('ellipse',{cx:sp[0],cy:sp[1]+6,rx:116,ry:62,class:'stage-contact'});for(const[x,y,rx,ry]of[[44,-8,15,8],[86,10,15,8]]){const q=P(x,y,0);el('ellipse',{cx:q[0],cy:q[1]+1,rx,ry,class:'shadow'});el('ellipse',{cx:q[0],cy:q[1]+1,rx,ry,class:'stage-contact'});}
box(24,28,0,76,168,1.2,5,'mat');const mt=group(TOP(24,28,1.2));rect(mt,4,4,68,160,3,'matl');text(group('rotate(-90 70.6 92)',mt),70.6,92,'RAVELO','emb');
const pool=el('ellipse',{cx:50,cy:138,rx:26,ry:34,fill:'url(#poolG)',class:'pool'},mt);
// Fan: a round air circulator on a disc base, its head aimed up at the rider.
const FH=[44,-8,24.5],fd=unit([16,126,0]),ft=10*RAD,FN=[Math.cos(ft)*fd[0],Math.cos(ft)*fd[1],Math.sin(ft)],FU=[fd[1],-fd[0],0],FV=[Math.sin(ft)*fd[0],Math.sin(ft)*fd[1],-Math.cos(ft)];
cylinder(44,-8,0,10,2.2,'z','');const fb=group(TOP(44,-8,2.2));circle(fb,0,0,8.4,'detail');const fanL=[-2.8,0,2.8].map(u=>lamp(fb,u,6.1,.65));circle(fb,4.6,-1.2,1.7,'face top metal');
rod([44,-8,2.2],[44,-8,9.4],1.6,'metal',false);rod(add([44,-8,9.8],mul(FU,-3.6)),add([44,-8,9.8],mul(FU,3.6)),2.2,'base');
rod(add(FH,mul(FN,-5.6)),add(FH,mul(FN,1.2)),14.4,'',false);
const ff=group(plane(add(FH,mul(FN,1.2)),FU,FV));circle(ff,0,0,14.4,'face top');circle(ff,0,0,12.7,'face recess');
const blades=group('',ff);for(let i=0;i<5;i++)el('path',{d:'M0,-2.6C4,-4.4 8.8,-6.6 7.8,-11.6C4.6,-11.8 1.4,-9.2 -1.4,-2.8Z',class:'blade',transform:`rotate(${i*72})`},blades);
const fblur=circle(ff,0,0,11.9,'blur');for(const r of[5.6,8.8,11.7])circle(ff,0,0,r,'grille');for(let i=0;i<16;i++){const a=i*22.5*RAD;line(ff,3.2*Math.cos(a),3.2*Math.sin(a),12.7*Math.cos(a),12.7*Math.sin(a),'grille');}
circle(ff,0,0,3,'face top metal');circle(ff,0,0,13.55,'detail');
// Tablet stand: tripod, pole with a height collar, ball head, clamp; the tablet faces the rider.
const S0=[86,10],leg=a=>{const f=[S0[0]+11*Math.cos(a*RAD),S0[1]+11*Math.sin(a*RAD)];rod([S0[0],S0[1],5.2],[f[0],f[1],1.4],.75,'metal',false);cylinder(f[0],f[1],0,1.4,1.5,'z','rubber');};
leg(180);leg(300);cylinder(86,10,3.4,2,3.2,'z','dk');rod([86,10,6.6],[86,10,93],.9,'metal');leg(60);
cylinder(86,10,50.6,1.6,2.8,'z','dk');rod([87.4,10,52],[90.2,10,52],.8,'dk');rod([86,10,92.6],[86,10,95.4],1.7,'dk');
const TB=[80,21,100],td=unit([-20,74,0]),tt=14*RAD,TN=[Math.cos(tt)*td[0],Math.cos(tt)*td[1],Math.sin(tt)],TU=[td[1],-td[0],0],TV=[Math.sin(tt)*td[0],Math.sin(tt)*td[1],-Math.cos(tt)];
rod([86,10,94.4],add(TB,mul(TN,-1.6)),.95,'dk',false);
const tO=k=>add(add(TB,mul(TU,-14)),add(mul(TV,-10),mul(TN,k)));
rect(group(plane(tO(-1.2),TU,TV)),0,0,28,20,2.4,'face base');const tf=group(plane(tO(0),TU,TV));
rect(tf,0,0,28,20,2.4,'face rubber');for(const v of[-1.3,19.3])rect(tf,10,v,8,2,1,'face dk');rect(tf,1.2,1.2,25.6,17.6,1.4,'halo');rect(tf,1.6,1.6,24.8,16.8,1,'face screen');
const tui=group('',tf,{'clip-path':'url(#tabClip)'});
const tGear=text(tui,3,4.2,'50×17','scr s'),tTime=text(tui,25,4.2,'00:00','scr s'),tPow=text(tui,3,10.6,'0','scr');text(tui,15.2,10.6,'W','scr m dim');
const tCad=text(tui,25,7.6,'0','scr m'),tSpd=text(tui,25,12.4,'0.0','scr m');text(tui,25,9.5,'RPM','scr s dim');text(tui,25,14.3,'KM/H','scr s dim');for(const n of[tTime,tCad,tSpd])set(n,'text-anchor','end');tui.querySelectorAll('text').forEach(n=>n.getAttribute('x')==='25'&&set(n,'text-anchor','end'));
text(tui,3,12.9,'WATTS','scr s dim');const zdot=circle(tui,10.6,12.25,.55,'zdot'),tZone=text(tui,11.4,12.9,'','scr s');
line(tui,3,17.6,17.2,17.6,'grid');line(tui,3,16.1,17.2,16.1,'grid');const spark=el('path',{class:'spark'},tui);
const lvl=[...Array(10)].map((_,i)=>rect(tui,19.4+i*.58,17.6-(.6+i*.22),.36,.6+i*.22,.1,'lvl'));
// Bike geometry in the plane x 60, front toward −y: bottom bracket, rear axle on the trainer, front axle, head tube.
const BB=[60,110,32],RA=[60,150,39],FA=[60,51,39],HT0=[60,66.6,73.7],HT1=[60,71,88],HA=unit([0,.292,.956]),at=(p,dx)=>[p[0]+dx,p[1],p[2]];
function pedal(x0){const g=into(el('g',{}));box(x0,BB[1]-3.6,BB[2]-.9,6.4,7.2,1.8,1.2,'rubber');rect(group(TOP(x0,BB[1]-3.6,BB[2]+.9)),1.3,1.2,3.8,4.8,1,'face metal');into(draw);return g;}
function crank(x){const r=group('',group(SIDE(x,BB[1],BB[2])));el('path',{d:'M0,-2.1L16.6,-1.25A1.25,1.25 0 0 1 16.6,1.25L0,2.1A2.1,2.1 0 0 1 0,-2.1Z',class:'face metal'},r);circle(r,0,0,1.6,'face top metal');circle(r,16.6,0,.8,'face recess');return r;}
// Riser block, far pedal and crank, far stays, far fork leg, disc rotor and caliper.
box(52,40,1.2,16,22,4.2,2.4,'dk');el('ellipse',{cx:8,cy:11,rx:5.4,ry:7,class:'face recess'},group(TOP(52,40,5.4)));
const pedL=pedal(46),crL=crank(53);
for(const[a,b,w]of[[at(BB,-2.6),[52.9,150,39],2.2],[[58.4,124.2,79.4],[52.9,150,39],1.7]])sk(poly([a,b]),w,'sf');
circle(group(SIDE(52.9,150,39)),0,0,2.5,'face frm');sk(poly([[55.6,66.2,72.4],[55.2,51,39]]),2.4,'sf');
const ro=group(SIDE(55.4,51,39));circle(ro,0,0,8,'face metal');circle(ro,0,0,6.5,'detail');for(let i=0;i<12;i++){const a=i*30*RAD;circle(ro,7.2*Math.cos(a),7.2*Math.sin(a),.42,'face recess');}circle(ro,0,0,2.8,'face dk');box(53.4,54.2,40.2,2.6,4.6,5.4,1,'dk');
// Front wheel: far tyre and rim, far spokes, hub, near spokes, near tyre and rim.
const W0=group(SIDE(58.7,51,39));ann(W0,33.6,30.5,'rubber');ann(W0,30.5,28,'metal');
const spoke=(xf,a,b)=>wire([[xf,51+2.6*Math.cos(a*RAD),39-2.6*Math.sin(a*RAD)],[60,51+28*Math.cos(b*RAD),39-28*Math.sin(b*RAD)]],'spk');
for(let i=0;i<12;i++)spoke(56.6,i*30,i*30+26);
ellipse(56.6,51,39,2.8,'x','face metal');rod([55,51,39],[65,51,39],1.3,'metal');ellipse(63.4,51,39,2.8,'x','face metal');
for(let i=0;i<12;i++)spoke(63.4,i*30+15,i*30-11);
const W1=group(SIDE(61.3,51,39));ann(W1,33.6,30.5,'rubber');ann(W1,30.5,28,'metal');circle(W1,0,0,32.1,'detail');circle(W1,0,0,29.3,'detail');rect(W1,-.6,27.2,1.2,2.6,.4,'face metal');
// Trainer: feet, cradle, power lead, axle boss, flywheel drum with its lit face, carry handle.
box(21.6,169.4,1.2,5,13.2,5.4,2.2,'rubber');box(26,170,1.2,68,12,4.6,2.4,'base');box(93.4,169.4,1.2,5,13.2,5.4,2.2,'rubber');
box(52.4,107.6,1.2,9.2,5,4.6,2,'rubber');box(53,112,1.2,8,54,3.8,1.8,'base');
sk(smooth([[51,183,16],[49,187,7],[45,189.5,1.9],[39.5,193,1.7],[35.5,197.4,.6]]),1.2,'sr');
box(47,150,4.6,20,34,5,2.2,'');const cf=group(SIDE(67,184,9.6));text(cf,17,3.5,'RAVELO · T–1','etch micro center');screw(cf,3.2,2.5);screw(cf,30.8,2.5);
extrude(capsule([150,39],[159,34.6],4.6),53.6,62.2);
const dr=cylinder(50,168,29.6,20,12.4,'x',''),df=dr.face;circle(df,0,0,20,'face');circle(df,0,0,18.9,'detail');circle(df,0,0,16.4,'face dk');
const zh=circle(df,0,0,14.4,'zhalo'),SEG=[...Array(36)].map((_,i)=>{const a0=(-90+i*10+1.4)*RAD,a1=(-90+i*10+8.6)*RAD,s=el('path',{d:`M${f2(14.4*Math.cos(a0))},${f2(14.4*Math.sin(a0))}A14.4,14.4 0 0 1 ${f2(14.4*Math.cos(a1))},${f2(14.4*Math.sin(a1))}`,class:'seg'},df);s._c='';return s;});
circle(df,0,0,12.5,'face recess');const fly=group('',df);circle(fly,0,0,11.7,'face metal');for(let i=0;i<6;i++){const a=i*60*RAD;circle(fly,6.6*Math.cos(a),6.6*Math.sin(a),2.5,'face dk');}for(let i=0;i<24;i++){const a=i*15*RAD;line(fly,9.7*Math.cos(a),9.7*Math.sin(a),11.3*Math.cos(a),11.3*Math.sin(a));}
const flyBlur=circle(df,0,0,11.4,'blur');circle(df,0,0,3.2,'face top metal');circle(df,0,0,1.3,'face recess');
const LMP=[-104,-90,-76].map(a=>lamp(df,17.7*Math.cos(a*RAD),17.7*Math.sin(a*RAD),.6));
sk(smooth([[56.2,160,47.2],[56.2,161.6,51.6],[56.2,166,52.8],[56.2,170,52.8],[56.2,174.4,51.6],[56.2,176,47.2]]),2.3,'sr');
// Frame: every tube outline first, then the fills, so the joints read welded; a shade and a highlight round each tube.
const TUBES=[[[60,70.6,86.4],[60,124.6,81]],[[60,67.4,75.4],BB],[BB,[60,125.3,83.6]],[[60,66.3,72.6],[60,71.4,89.2]]],TW=[2.8,3.8,3.2,4.4];
TUBES.forEach(([a,b],i)=>el('path',{d:poly([a,b]),class:'su','stroke-width':TW[i]+.7}));TUBES.forEach(([a,b],i)=>el('path',{d:poly([a,b]),class:'sf','stroke-width':TW[i]}));
TUBES.forEach(([a,b],i)=>{const p=P(...a),q=P(...b),dx=q[0]-p[0],dy=q[1]-p[1],L=Math.hypot(dx,dy),w=TW[i],k=w*.7/L;let nx=-dy/L,ny=dx/L;if(nx+ny<0){nx=-nx;ny=-ny;}for(const[o,c,ww]of[[w*.27,'ss',w*.3],[-w*.24,'sh',w*.16]])el('path',{d:`M${f2(p[0]+dx*k+nx*o)},${f2(p[1]+dy*k+ny*o)}L${f2(q[0]-dx*k+nx*o)},${f2(q[1]-dy*k+ny*o)}`,class:c,'stroke-width':ww});});
cylinder(56.4,110,32,2.5,7.2,'x','frm');rod(add(HT0,mul(HA,-1.7)),add(HT0,mul(HA,-.1)),2.5,'dk');
text(group('rotate(-45.5)',group(SIDE(61.95,88.7,53.7))),0,.8,'RAVELO','dec');const hb=group(SIDE(62.25,69.2,81));circle(hb,0,0,1.1,'face metal');circle(hb,0,0,.5,'detail');
sk(poly([[64.4,66.2,72.4],[64.8,51,39]]),2.4,'sf');ellipse(65.6,51,39,1.3,'x','face metal');
// Bottle on the down tube.
const bdir=unit([0,42.6,-43.4]),bc=add(add([60,67.4,75.4],mul(bdir,31.8)),mul([0,.715,.698],5.6)),ba=add(bc,mul(bdir,-10)),bt=add(bc,mul(bdir,10));
rod(bt,ba,3.7,'bottle');for(const t of[-6.5,5.5])rod(add(bc,mul(bdir,t)),add(bc,mul(bdir,t+.5)),3.78,'side bottle',false);rod(ba,add(ba,mul(bdir,-2.4)),2.3,'rubber');rod(add(ba,mul(bdir,-2.4)),add(ba,mul(bdir,-3.6)),1.1,'rubber');
// Seatpost, rails, saddle.
sk(poly([[58.5,119.6,99.6],[58.4,130.2,98.7],[57.3,140,99.7]]),.6,'sm');sk(poly([[60,124.9,82.2],[60,130.2,99.2]]),2.3,'sr');sk(poly([[60,124.6,81.4],[60,125.3,83.9]]),3.9,'sm');
sk(poly([[61.5,119.6,99.6],[61.6,130.2,98.7],[62.7,140,99.7]]),.6,'sm');box(58,128.4,97.4,4,3.6,1.6,.8,'dk');
const SADDLE='M-1.7,.6Q0,-.6 1.7,.6L2.7,10C3.6,14 6.3,15.6 6.8,20C7.1,24.6 4.6,27.2 0,27.2C-4.6,27.2 -7.1,24.6 -6.8,20C-6.3,15.6 -3.6,14 -2.7,10Z';
el('path',{d:SADDLE,class:'face rubber'},group(TOP(60,117.4,99.5)));const sd=group(TOP(60,117.4,100.9));el('path',{d:SADDLE,class:'face top rubber'},sd);rect(sd,-.55,12,1.1,10,.55,'face recess');
// Cockpit: stem, bar with taped drops, faceplate, spacers and steerer clamp, hoods and levers, brake hose.
const BC=[60,61.6,93.9];rod(add(HT1,mul(HA,4.9)),BC,1.55,'dk');
const DROP=[[61.6,93.9],[57,94.4],[53.8,93.5],[52,90.4],[52.3,85.6],[54.3,82.7],[58.5,81.6],[62.8,81.8]],bar=DROP.map(([y,z],i)=>[39.6-1.4*i/7,y,z]).reverse().concat(DROP.map(([y,z],i)=>[80.4+1.4*i/7,y,z]));
sk(smooth(bar),2.5,'sr');el('path',{d:smooth(bar),class:'tape'});rod([56.6,61.6,93.9],[63.4,61.6,93.9],2.1,'dk');
rod(add(HT1,mul(HA,-.3)),add(HT1,mul(HA,3.2)),2.15,'dk');rod(add(HT1,mul(HA,3.2)),add(HT1,mul(HA,6.6)),2.35,'dk');
for(const x of[39.2,80.8]){sk(smooth([[x,55.8,94.1],[x,52.6,95.4],[x,50.7,94.4],[x,50.5,91.8]]),2.4,'sr');sk(smooth([[x,51.6,91.8],[x,51.8,88.2],[x,52.9,84.8]]),1,'sr');}
sk(smooth([[80.6,53.6,91.4],[78.5,57.8,86.6],[71,63.8,83.4],[63.2,67.8,80.6],[61.4,69,79.6]]),.75,'sr');
// Drivetrain: cassette 11–30 on the trainer freehub, near stays, chainrings, rear derailleur and chain, front derailleur, dropout, near crank.
const T=[11,12,13,14,15,17,19,21,24,27,30],cogR=t=>t*.202,cogX=g=>66.6-.37*g,rotg=[];
rod([61.8,150,39],[62.9,150,39],3.2,'metal',false);
for(let g=10;g>=0;g--){const c=group(SIDE(cogX(g),150,39));circle(c,0,0,cogR(T[g]),'face metal');if(g===10)for(let i=0;i<5;i++){const a=i*72*RAD;circle(c,3.7*Math.cos(a),3.7*Math.sin(a),.85,'face dk');}const r=group('',c);circle(r,0,0,cogR(T[g])+.2,'teeth');rotg.push(r);}
const lock=group(SIDE(66.9,150,39));circle(lock,0,0,1.9,'face top metal');const lockR=group('',lock);circle(lockR,0,0,1.45,'teeth');rotg.push(lockR);
for(const[a,b,w]of[[at(BB,2.6),[67.1,150,39],2.2],[[61.6,124.2,79.4],[67.1,150,39],1.7]])sk(poly([a,b]),w,'sf');
const rS=group(SIDE(63.8,110,32));circle(rS,0,0,6.9,'face metal');const rSR=group('',rS);circle(rSR,0,0,7.1,'teeth');
const rB=group(SIDE(64.6,110,32));ann(rB,10.1,7.7,'metal');const spider=group('',rB);circle(spider,0,0,10.3,'teeth');
for(let i=0;i<4;i++){const a=(i*90+45)*RAD,q=(r,o)=>`${f2(r*Math.cos(a+o))},${f2(r*Math.sin(a+o))}`;el('path',{d:`M${q(2.4,-.5)}L${q(8.1,-.13)}L${q(8.1,.13)}L${q(2.4,.5)}Z`,class:'face metal'},spider);circle(spider,8.7*Math.cos(a),8.7*Math.sin(a),.55,'face recess');}circle(rB,0,0,2.6,'face dk');
const rdIn=el('g',{}),chainG=el('g',{}),rdOut=el('g',{}),chU=el('path',{class:'su','stroke-width':2.1},chainG),chB=el('path',{class:'ch','stroke-width':1.4},chainG),chP=el('path',{class:'chp','stroke-width':.8},chainG),jw=[];
function rdBuild(g){const i0=Math.floor(g),i1=Math.min(10,i0+1),f=g-i0,rc=cogR(T[i0]+(T[i1]-T[i0])*f),xc=cogX(g),U=[150.6,39-rc-2.4],L=[147.4,U[1]-6.8];
rdIn.replaceChildren();rdOut.replaceChildren();jw.length=0;const plate=(x,cls,p)=>el('path',{d:closed(capsule(U,L,2.3).map(([y,z])=>P(x,y,z))),class:'face '+cls},p);
plate(xc-.9,'dk',rdIn);for(const c of[U,L]){const j=group(SIDE(xc,c[0],c[1]),rdIn);circle(j,0,0,1.5,'face dk');const r=group('',j);circle(r,0,0,1.62,'teeth');jw.push(r);circle(j,0,0,.5,'face metal');}
const D=Math.hypot(40,7),e=[40/D,7/D],sf=(10.1-rc)/D,cf=Math.sqrt(1-sf*sf),aT=Math.atan2(sf*e[1]+cf*e[0],sf*e[0]-cf*e[1])/RAD,pts=[];
const arc=(c,r,a0,a1)=>{const k=Math.max(2,Math.ceil(Math.abs(a1-a0)/12));for(let i=0;i<=k;i++){const a=(a0+(a1-a0)*i/k)*RAD;pts.push([c[0]+r*Math.cos(a),c[1]+r*Math.sin(a)]);}};
arc([150,39],rc,aT,-95);arc(U,1.5,100,260);arc(L,1.5,70,-110);arc([110,32],10.1,-95,aT-360);
const d='M'+pts.map(([y,z])=>P(y<=110?64.6:y>=147?xc:64.6+(xc-64.6)*(y-110)/37,y,z).map(f2).join(',')).join('L')+'Z';for(const p of[chU,chB,chP])set(p,'d',d);
plate(xc+.9,'metal',rdOut);sk(poly([[67.8,151.8,35.2],[xc+1.2,U[0]+1.3,U[1]+1.7]]),2.4,'sm',rdOut);const kn=group(SIDE(68.1,151.8,35.2),rdOut);circle(kn,0,0,1.8,'face top metal');circle(kn,0,0,.7,'face recess');
sk(smooth([[63.4,138,35.4],[67.2,145,32.6],[68.8,151.4,32.4],[68.4,153.6,34.6]]),.75,'sr',rdOut);}
const fdArc=r=>[...Array(9)].map((_,i)=>{const a=(58+i*5)*RAD;return[65.7,110+r*Math.cos(a),32+r*Math.sin(a)];});
el('path',{d:poly(fdArc(10.9).concat(fdArc(12.9).reverse()),true),class:'face metal'});sk(poly([[61.6,113.8,44.6],[65.4,114.6,44.3]]),1.3,'sm');
const dp=group(SIDE(67.1,150,39));el('path',{d:'M-2.6,0A2.6,2.6 0 0 1 2.6,0L1.9,4.8Q0,6 -1.5,4.8Z',class:'face frm'},dp);ellipse(67.8,150,39,1.6,'x','face metal');circle(group(SIDE(67.85,150,39)),0,0,.6,'face recess');
const pedR=pedal(67.6),crR=crank(67);
const AIR=[[-6,-4],[5,-6],[-3,5],[6,3]].map(([a,b],i)=>{const s=add(add(add(FH,mul(FN,2)),mul(FU,a)),mul(FV,b)),e=[52+i*5,92+i*4,88-i*6];return el('path',{d:smooth([s,add(mul(add(s,e),.5),[0,0,14]),e]),class:'air'});});
frame([[24,28,0,76,168,2],[34,-18,0,20,20,40],[66,6,0,30,20,112],[54,40,0,14,110,102]],12);
// State: pedalling, resistance level (a virtual grade), gear, fan; power from cadence, gear and grade. Audio starts on the first gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),hk={};
document.querySelectorAll('.hint [data-k]').forEach(b=>{hk[b.dataset.k]=b;});
const FTP=300,FANS=['OFF','LOW','MID','HIGH'],ZC=['b','b','b','g','a','r'],ZV={b:'var(--accent)',g:'var(--ok)',a:'var(--warn)',r:'var(--fault)'},hist=[];
let pedaling=false,level=4,gear=5,gv=5,fan=0,cad=0,spd=0,pow=0,th=24,flyA=0,cogA=0,chainO=0,fanA=0,fanV=0,rideT=0,lvlAt=-1e9,last=0,lastUI=-1,lastH=0,drawnG=-1,zcol='',note='',noteT=0,ac=null,whirr=null,fanN=null;
const vel=c=>c/60*50/T[gear]*2.1,watts=c=>c>5?78*9.81*(.004+(level-1)*.0065)*vel(c)+.162*Math.pow(vel(c),3):0,zone=p=>p<=0?0:p<.55*FTP?1:p<.75*FTP?2:p<.9*FTP?3:p<1.05*FTP?4:5;
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();const o=ac.createOscillator(),f=ac.createBiquadFilter();o.type='sawtooth';o.frequency.value=40;f.type='lowpass';f.frequency.value=380;whirr=ac.createGain();whirr.gain.value=0;o.connect(f);f.connect(whirr);whirr.connect(ac.destination);o.start();whirr.o=o;
const b=ac.createBuffer(1,ac.sampleRate,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=ac.createBufferSource(),bp=ac.createBiquadFilter();s.buffer=b;s.loop=true;bp.type='bandpass';bp.frequency.value=650;bp.Q.value=.5;fanN=ac.createGain();fanN.gain.value=0;s.connect(bp);bp.connect(fanN);fanN.connect(ac.destination);s.start();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){}}
function click(f,d=.04,v=.012,w=0){if(!ac)return;try{const t=ac.currentTime+w,o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.02);}catch(_){}}
const say=m=>{announcement.textContent=m;},flash=m=>{note=m;noteT=performance.now()+1500;lastUI=-1;};
function pedalToggle(){audio();pedaling=!pedaling;note='';click(pedaling?880:520,.06);say(pedaling?`Pedalling at level ${level} in 50 by ${T[gear]}.`:'Stopped pedalling. The flywheel coasts down.');sync();}
function setLevel(d){audio();const l=clamp(level+d,1,10);if(l===level){flash(`LEVEL ${level} · ${d>0?'MAXIMUM':'MINIMUM'}`);return;}level=l;lvlAt=performance.now();note='';click(600+level*70,.05);say(`Resistance level ${level}, a ${((level-1)*.65).toFixed(1)} percent grade.`);sync();}
function shift(d){audio();const g=clamp(gear+d,0,10);if(g===gear){flash(d<0?'HARDEST GEAR · 50×11':'EASIEST GEAR · 50×30');return;}gear=g;if(reduced.matches)gv=gear;note='';click(1900,.02,.01);click(1500,.03,.008,.05);say(`Gear 50 by ${T[gear]}.`);sync();}
function fanCycle(){audio();fan=(fan+1)%4;click(380+fan*130,.05);say(`Fan ${FANS[fan].toLowerCase()}.`);sync();}
const hitC=(label,c,r,fn,extra={})=>{const g=button(el('g',{}),{'aria-label':label,...extra}),q=P(...c);el('circle',{cx:f2(q[0]),cy:f2(q[1]),r,class:'hit'},g);el('circle',{cx:f2(q[0]),cy:f2(q[1]),r:r+1.4,class:'focus-ring'},g);bind(g,fn);return g;};
const crankBtn=hitC('Pedal or stop (Space)',[64,110,32],19,pedalToggle,{'aria-pressed':'false'}),drumBtn=hitC('Raise the resistance (↑)',[62.4,168,29.6],18,()=>setLevel(level<10?1:-9)),gearBtn=hitC('Shift to a harder gear (→)',[66,150,33],8.5,()=>shift(gear>0?-1:10)),fanBtn=hitC('Fan speed (F)',add(FH,mul(FN,1.2)),15.5,fanCycle,{'aria-pressed':'false'});
button(tf,{'aria-label':'Start or stop the ride (Space)','aria-pressed':'false'});rect(tf,-1.4,-2.2,30.8,24.4,3.2,'focus-ring');bind(tf,pedalToggle);
function sync(){for(const n of[crankBtn,tf,hk[' ']])set(n,'aria-pressed',pedaling);set(fanBtn,'aria-pressed',fan>0);set(hk.f,'aria-pressed',fan>0);set(fanBtn,'aria-label',`Fan ${FANS[fan].toLowerCase()}. Change speed (F)`);set(drumBtn,'aria-label',`Resistance level ${level}. Raise it (↑)`);set(gearBtn,'aria-label',`Gear 50 by ${T[gear]}. Shift harder (→)`);lastUI=-1;}
const act={' ':pedalToggle,f:fanCycle};for(const[k,b]of Object.entries(hk))b.addEventListener('click',()=>act[k]());
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(k===' '&&e.target.closest&&e.target.closest('button,[role=button]'))return;
const fn={' ':pedalToggle,f:fanCycle,ArrowUp:()=>setLevel(1),ArrowDown:()=>setLevel(-1),ArrowRight:()=>shift(-1),ArrowLeft:()=>shift(1)}[k];if(fn){e.preventDefault();if(!e.repeat||k.startsWith('Arrow'))fn();}});
const mmss=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
function ui(now){const z=zone(pow),r=`${Math.round(pow)} W · ${Math.round(cad)} RPM · ${(spd*3.6).toFixed(1)} KM/H`;if(readout.textContent!==r)readout.textContent=r;
stateLabel.textContent=note&&now<noteT?note:`${pedaling?`ZONE ${z} · `:spd>0?'COASTING · ':''}LEVEL ${level} · 50×${T[gear]} · FAN ${FANS[fan]}`;
tPow.textContent=Math.round(pow);tCad.textContent=Math.round(cad);tSpd.textContent=(spd*3.6).toFixed(1);tGear.textContent=`50×${T[gear]}`;tTime.textContent=mmss(rideT);tZone.textContent=z?'Z'+z:'';zdot.style.display=z?'':'none';lvl.forEach((n,i)=>set(n,'class',i<level?'lvl on':'lvl'));lastUI=now;}
function tick(now){const dt=last?Math.min((now-last)/1000,.05):0,red=reduced.matches,k=a=>red?1:1-Math.exp(-dt*a);last=now;
cad+=((pedaling?clamp(92-2.2*(level-1)+1.6*(gear-5),58,104):0)-cad)*k(pedaling?1.8:4.5);if(!pedaling&&cad<.6)cad=0;
spd=pedaling?spd+(vel(cad)-spd)*k(1.3):red?0:spd*Math.exp(-dt/2.6);if(spd<.06)spd=0;pow+=(watts(cad)-pow)*k(2.4);if(pow<.5)pow=0;if(pedaling)rideT+=dt;
gv+=(gear-gv)*k(9);if(Math.abs(gear-gv)<.003)gv=gear;if(gv!==drawnG){drawnG=gv;rdBuild(gv);}
if(!red){th+=cad*6*dt;cogA+=cad*6*dt*50/T[gear];flyA+=spd*170*dt;chainO+=cad/60*63.5*dt;fanV+=(fan*720-fanV)*k(1.5);fanA+=fanV*dt;}else fanV=fan*720;
const a=th*RAD,pv=[P(0,-17*Math.cos(a),-17*Math.sin(a)),P(0,17*Math.cos(a),17*Math.sin(a))];set(crR,'transform',`rotate(${f2(th)})`);set(crL,'transform',`rotate(${f2(th+180)})`);set(pedR,'transform',`translate(${f2(pv[0][0])} ${f2(pv[0][1])})`);set(pedL,'transform',`translate(${f2(pv[1][0])} ${f2(pv[1][1])})`);
set(spider,'transform',`rotate(${f2(th)})`);set(rSR,'transform',`rotate(${f2(th)})`);for(const r of rotg.concat(jw))set(r,'transform',`rotate(${f2(cogA%360)})`);set(chP,'stroke-dashoffset',f2(chainO%13));chP.style.opacity=f2(1-clamp((cad-20)/60)*.7);
set(fly,'transform',`rotate(${f2(flyA%360)})`);const fb=clamp((spd-3)/7);fly.style.opacity=f2(1-fb*.55);flyBlur.style.opacity=f2(fb*.45);
set(blades,'transform',`rotate(${f2(fanA%360)})`);const bb=clamp((fanV-250)/1400);blades.style.opacity=f2(1-bb*.75);fblur.style.opacity=f2(bb*.35);fanL.forEach((l,i)=>lit(l,i<fan?'b':''));
AIR.forEach((p,i)=>{p.style.opacity=f2(clamp(fanV/2160)*.5);set(p,'stroke-dashoffset',f2((-fanA*.035-i*3.5)%14));});
const z=zone(pow),lv=now-lvlAt<1400;let n=0,c='';if(lv){n=Math.round(level*3.6);c='b';}else if(pedaling&&pow>0){n=Math.max(1,Math.round(clamp(pow/600)*36));c=ZC[z];}else if(spd>0){n=Math.round(clamp(spd/12)*36);c='b';}
const chase=pedaling&&!red&&c?Math.floor((flyA%360)/10):-1;SEG.forEach((s,i)=>lit(s,i<n||i===chase?c:!c&&i%9===0?'b':'','seg'));
if((c||'b')!==zcol){zcol=c||'b';svg.style.setProperty('--zc',ZV[zcol]);}const hi=lv?.55:pedaling?.25+.5*clamp(pow/450):spd>0?.35*clamp(spd/10):red?.12:.09+.05*Math.sin(now/700);zh.style.opacity=f2(hi*.8);pool.style.opacity=f2(hi*(matchMedia('(prefers-color-scheme: dark)').matches?.9:.55));
lit(LMP[0],'g');lit(LMP[1],pedaling&&(red||now%900<450)?'b':pedaling?'':'b');lit(LMP[2],pedaling?'b':'');
if(now-lastH>250){lastH=now;hist.push(pow);if(hist.length>40)hist.shift();set(spark,'d','M'+hist.map((v,i)=>`${f2(17.2-(hist.length-1-i)*.36)},${f2(17.6-clamp(v/600)*3)}`).join('L'));}
if(whirr){whirr.gain.setTargetAtTime(Math.min(.012,spd*.0011),ac.currentTime,.1);whirr.o.frequency.setTargetAtTime(30+spd*7,ac.currentTime,.15);fanN.gain.setTargetAtTime(fan*.0035,ac.currentTime,.3);}
if(lastUI<0||now-lastUI>120)ui(now);requestAnimationFrame(tick);}
sync();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [' ', 'f'], draw }
