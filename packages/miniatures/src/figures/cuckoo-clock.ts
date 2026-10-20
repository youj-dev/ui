// @ts-nocheck
/* WALDEGG K–12 · Cuckoo clock. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--wall:#eeede8;--wall-top:#f7f6f2;--wall-side:#dcdbd4;--carve:#b98f5e;--carve-top:#d3ad7e;--carve-side:#9b7445;--roof:#6f6156;--roof-top:#8a7a6b;--roof-side:#5a4e45;--dial:#f7f2e6;--hand:#2b2825;--iron:#4a4744;--iron-top:#646059;--iron-side:#383532;--chain:#bdb39c;--brass:#d2ad66;--brass-top:#ead08f;--bird:#8c7762;--bird-dk:#6a5847;--beak:#e48a2a;--lamp:#ffb648;--fl1:#e0533c;--fl2:#efae35;--win:#cfd3d6}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--wall:#c8c8c5;--wall-top:#e7e6e2;--wall-side:#9b9a98;--carve:#9b784e;--carve-top:#c5a275;--carve-side:#6c502e;--roof:#5c5147;--roof-top:#817264;--roof-side:#3d352e;--dial:#cfccc4;--hand:#22201e;--iron:#3c3a39;--iron-top:#5d5953;--iron-side:#242322;--chain:#9f9683;--brass:#b19155;--brass-top:#dbc285;--bird:#756351;--bird-dk:#58493a;--beak:#c07322;--lamp:#ffbe55;--fl1:#bd4531;--fl2:#c9922b;--win:#afb1b3;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
.wall{fill:var(--wall)}.top.wall{fill:var(--wall-top)}.side.wall{fill:var(--wall-side)}.plank{fill:none;stroke:var(--line);stroke-width:.5;opacity:.45;vector-effect:non-scaling-stroke}
.carve{fill:var(--carve)}.top.carve{fill:var(--carve-top)}.side.carve{fill:var(--carve-side)}.roof{fill:var(--roof)}.top.roof{fill:var(--roof-top)}.side.roof{fill:var(--roof-side)}.iron{fill:var(--iron)}.top.iron{fill:var(--iron-top)}.side.iron{fill:var(--iron-side)}
.shingle{fill:none;stroke:var(--line);stroke-width:.5;opacity:.75;vector-effect:non-scaling-stroke}.leaf{fill:var(--carve);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.leaf-v{fill:none;stroke:var(--carve-side);stroke-width:.4;vector-effect:non-scaling-stroke}
.dial{fill:var(--dial);stroke:var(--line);stroke-width:.7;vector-effect:non-scaling-stroke}.num{fill:var(--hand);font:600 2.9px Georgia,'Times New Roman',serif;text-anchor:middle;stroke:none}.hand{fill:var(--hand);stroke:var(--hand);stroke-width:.3;stroke-linejoin:round}
.chain-u{fill:none;stroke:var(--line);stroke-width:1.5}.chain{fill:none;stroke:var(--chain);stroke-width:.95;stroke-dasharray:1.5 .7}.cone{fill:none;stroke:var(--iron-top);stroke-width:.55;vector-effect:non-scaling-stroke;stroke-linecap:round}
.brass{fill:var(--brass)}.top.brass{fill:var(--brass-top)}.wshade{fill:var(--shadow);opacity:.12;filter:url(#bloom)}.dark-mode-only{display:none}
.bird{fill:var(--bird);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;stroke-linejoin:round}.bird-dk{fill:var(--bird-dk)}.beak{fill:var(--beak);stroke:var(--line);stroke-width:.4;vector-effect:non-scaling-stroke}.eye{fill:#111}
.inner{fill:var(--lamp);opacity:0;pointer-events:none}.glow{filter:url(#bloom)}.win{fill:var(--win);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.fl1{fill:var(--fl1)}.fl2{fill:var(--fl2)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="disc" cx=".5" cy=".5" r=".6" fx=".35" fy=".3"><stop offset="0" style="stop-color:var(--brass-top)"/><stop offset="1" style="stop-color:var(--brass)"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* WALDEGG K–12 cuckoo clock. World: x lower-right, y lower-left (out of the wall), z up; 1 unit ≈ 5 mm.
Part                        x      y      z      w      d      h
plank wall                −10     −4    −96     80      4    190   shadows of case, pendulum, weights
pendulum (swings in x–z)    30      4     −3    r14      –    −85   flat rod, carved leaf, brass disc
chains (4)          17/21/39/43    13   −1…−46     –      –      –   free ends carry rings
pine-cone weights (2)   21/39     13  −12…−67   8.4    8.4     23   time + cuckoo trains
base trim                  −2     −1     −3     64     29      3
case                        0      0      0     60     26     58
gable                       0     26     58     60      0     20
dial + leaf wreath          30     26     26    r21      –      –   roman ring, spade hands
bird door + doorway         25     26     47     10      0     13   hinged left, lit inside
gable rosette               30     26     66    r3.4     –      –
brand plate (side)          60   5–21  18–24      0     16    5.6
side window + shutters      60   4–22   32–46     0     18     14   flower box 60 7 28.5 · 3.2 12 3.5
sound slits                 60   5–21    6–12     0     16      6
roof slabs (2)          −6/30     −2  54–80   43.3     34    2.5   shingles; ridge r1.8
bargeboards                 −5   31.5  54–78     71      0      4   scalloped fretwork
finial bird                 30     33     81     10      0      8
cuckoo                      30.5  24–33     52     10      –      7   profile, beak, wing, tail, perch
*/
// Isometric engine: affine face planes, solids, round parts, grille and fit.
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers.
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`;
const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],add=(...v)=>v.reduce((s,q)=>[s[0]+q[0],s[1]+q[1],s[2]+q[2]]),mul=(a,k)=>a.map(c=>c*k);
function obox(o,A,B,V,a,b,c,r=2,cls='',parent=root){const g=el('g',{},parent),E=[[A,a],[B,b],[V,c]];for(let i=0;i<3;i++){const[n,l]=E[i],[U,lu]=E[(i+1)%3],[W,lw]=E[(i+2)%3],pos=dot(n,[1,1,1])>0,m=pos?n:mul(n,-1),t=Math.abs(m[2])>=Math.max(Math.abs(m[0]),Math.abs(m[1]))?(m[2]>0?'top':'side'):m[0]>m[1]?'side':'';rect(el('g',{transform:plane(pos?add(o,mul(n,l)):o,U,W)},g),0,0,lu,lw,r,`face ${t} ${cls}`);}return g;}
function cone(x,y,z,r1,r2,h,cls,parent=root){const p=P(x,y,z),q=P(x,y,z+h),k=Math.SQRT2,a1=r1*k*C,b1=r1*k*S,a2=r2*k*C,b2=r2*k*S;return el('path',{d:`M${p[0]-a1},${p[1]} A${a1},${b1} 0 0 0 ${p[0]+a1},${p[1]} L${q[0]+a2},${q[1]} A${a2},${b2} 0 0 1 ${q[0]-a2},${q[1]} Z`,class:'face '+cls},parent);}
function pin(g,x,y,r=.75){circle(g,x,y,r,'face top');line(g,x-r*.5,y+r*.35,x+r*.5,y-r*.35);}
const adopt=(g,n)=>{g.appendChild(n.g||n);return n;};
const LEAF='M0,-3.2 Q2.1,-1 0,3.2 Q-2.1,-1 0,-3.2Z';
// Assembly: wall and its shadows, pendulum, chains and weights, case, faces, roof, door and bird.
box(-10,-4,-96,80,4,190,1.5,'wall');
const WF=group(FRONT(-10,.02,94));for(const u of[14,30,46,62])line(WF,u,1,u,189,'plank');pin(WF,40,4,.7);
const SHW=group(FRONT(0,.05,0));
el('path',{d:'M3,8 L67,8 L67,-49 L71,-49 L35,-75 L-1,-49 L3,-49 Z',class:'wshade'},SHW);
const penShade=el('g',{class:'wshade'},SHW),wShades=[0,1].map(()=>rect(SHW,0,0,9,25,4,'wshade'));
const PEN=group(FRONT(30,4,-3)),penR=el('g',{},PEN);
rect(penR,-.75,-1,1.5,64,.7,'face carve');
el('path',{d:'M0,57 C8,60 8.5,72 0,82 C-8.5,72 -8,60 0,57Z',class:'leaf'},penR);
el('path',{d:'M0,59 V80 M0,64 L4,61.5 M0,64 L-4,61.5 M0,71 L4.6,68 M0,71 L-4.6,68 M0,77 L3,74.5 M0,77 L-3,74.5',class:'leaf-v'},penR);
circle(penR,0,69.5,3.7,'face brass').setAttribute('fill','url(#disc)');circle(penR,0,69.5,2.4,'detail');
const pen=button(el('g',{}),{'aria-label':'Pendulum: stop or start the clock (Space)'});PEN.appendChild(pen);
el('path',{d:'M0,57 C8,60 8.5,72 0,82 C-8.5,72 -8,60 0,57Z',class:'hit'},penR);
const penFocus=circle(penR,0,69.5,10,'focus-ring');
el('path',{d:'M0,57 C8,60 8.5,72 0,82 C-8.5,72 -8,60 0,57Z M-.6,0 h1.2 v58 h-1.2Z'},penShade);
const CH=[17,21,39,43].map(x=>({x,u:el('path',{class:'chain-u'}),c:el('path',{class:'chain'})}));
function cone3(g,x){g.appendChild(cylinder(x,13,-3.6,2.3,1.6,'z','iron').g);const b=cylinder(x,13,-18.6,4.2,15,'z','iron');g.insertBefore(b.g,g.firstChild);g.insertBefore(cone(x,13,-23,.6,4.2,4.4,'iron',el('g')),g.firstChild);
for(let i=0;i<6;i++){const z=-5.2-i*2.5,p=P(x,13,z),a=4.2*1.2247,h=4.2*.7071;el('path',{d:`M${p[0]-a},${p[1]}A${a},${h} 0 0 0 ${p[0]+a},${p[1]}`,class:'cone'},g);for(let k=0;k<5;k++){const t=-.8+k*.4+(i%2)*.2,q=P(x+4.2*Math.cos(Math.PI/4+t),13+4.2*Math.sin(Math.PI/4+t),z);el('path',{d:`M${q[0]},${q[1]} l0,1.6`,class:'cone'},g);}}
const hk=group(FRONT(x,13,0),g);el('path',{d:'M0,-.2 V-1.6 M-1.2,-2.4 A1.2,1.2 0 1 1 1.2,-2.4',class:'detail'},hk);}
const WT=[21,39].map(x=>{const g=el('g',{});cone3(g,x);return g;});
const RINGS=[17,43].map(x=>{const g=el('g',{});const f=group(FRONT(x,13,0),g);circle(f,0,2.4,2.2,'detail');circle(f,0,2.4,1.5,'detail');return g;});
const handles=el('g',{});[RINGS[0],WT[0],WT[1],RINGS[1]].forEach(n=>{handles.appendChild(n);n.style.cursor='pointer';});
const wind=button(el('g',{}),{'aria-label':'Wind the weights (W)'});handles.appendChild(wind);
const windHit=el('rect',{class:'focus-ring',rx:3,style:'pointer-events:none'},wind);
box(-2,-1,-3,64,29,3,1,'carve');
box(0,0,0,60,26,58,1.5);
const GF=group(FRONT(0,26.02,58));el('path',{d:'M0,0 L60,0 L30,-20 Z',class:'face'},GF);
const RS=group(FRONT(30,26.04,65.5));circle(RS,0,0,3.4,'face carve');for(let i=0;i<8;i++)el('path',{d:'M0,-2.6 Q.9,-1.3 0,0 Q-.9,-1.3 0,-2.6Z',class:'leaf',transform:`rotate(${i*45})`},RS);circle(RS,0,0,.8,'face top carve');
const FF=group(FRONT(0,26.04,58));
for(const[u,v]of[[3,3],[57,3],[3,55],[57,55]])pin(FF,u,v,.7);
const DI=group(FRONT(30,26.06,26));
for(let i=0;i<18;i++){const a=i*20;el('path',{d:LEAF,class:'leaf',transform:`rotate(${a}) translate(0 -17.6) rotate(${i%2?28:-28}) scale(1.25 1)`},DI);el('path',{d:'M0,-2.6 V2.6',class:'leaf-v',transform:`rotate(${a}) translate(0 -17.6) rotate(${i%2?28:-28})`},DI);}
circle(DI,0,0,15.6,'face carve');circle(DI,0,0,14.4,'detail');circle(DI,0,0,13.6,'dial');circle(DI,0,0,12.6,'detail');circle(DI,0,0,9.2,'detail');
for(let i=0;i<60;i++){const a=i*Math.PI/30;line(DI,Math.sin(a)*12.6,-Math.cos(a)*12.6,Math.sin(a)*(i%5?12:11.2),-Math.cos(a)*(i%5?12:11.2),'detail');}
['XII','I','II','III','IIII','V','VI','VII','VIII','IX','X','XI'].forEach((n,i)=>{const a=i*Math.PI/6;text(DI,Math.sin(a)*10.4,-Math.cos(a)*10.4+1,n,'num');});
const HH=el('path',{d:'M-.6,1.6 L-.45,-4.2 Q-2.2,-5.4 0,-8.2 Q2.2,-5.4 .45,-4.2 L.6,1.6 Z',class:'hand'},DI),MH=el('path',{d:'M-.45,2.2 L-.35,-8.4 Q-1.5,-9.4 0,-12.3 Q1.5,-9.4 .35,-8.4 L.45,2.2 Z',class:'hand'},DI);
circle(DI,0,0,1.3,'face brass');circle(DI,0,0,.45,'detail');
// Doorway (lit inside), then the side window, flower box and sound slits.
const DW=group(FRONT(25,26.05,60));const ARCH='M0,13 V5 A5,5 0 0 1 10,5 V13 Z';
el('path',{d:'M-1.6,14.2 V5 A6.6,6.6 0 0 1 11.6,5 V14.2 Z',class:'face carve'},DW);el('path',{d:ARCH,class:'face recess'},DW);
const inner=el('ellipse',{cx:5,cy:8,rx:7,ry:7,class:'inner glow'},DW),innerCore=el('path',{d:ARCH,class:'inner'},DW);
const SF=group(SIDE(60.05,26,58));
rect(SF,7.6,11.4,10.8,15.2,1,'face carve');rect(SF,8.6,12.4,8.8,13.2,.6,'win');line(SF,13,12.4,13,25.6,'detail');line(SF,8.6,19,17.4,19,'detail');
for(const u of[3.8,18.6]){rect(SF,u,11.6,3.6,14.8,.6,'face carve');for(let k=0;k<6;k++)line(SF,u+.6,13.6+k*2.1,u+3,13.6+k*2.1,'detail');}
slits(SF,6,46,14,6,9);rect(SF,5,35.4,16,5.6,1,'face carve');text(SF,13,39.4,'WALDEGG','label center');for(const[u,v]of[[2.4,3],[23.6,3],[2.4,55],[23.6,55]])pin(SF,u,v,.7);
box(60,7,28.5,3.2,12,3.5,.6,'carve');
for(let i=0;i<6;i++){const p=P(61.6,8.4+i*1.9,32.6+(i%2)*.8);el('circle',{cx:p[0],cy:p[1],r:.95,class:i%3?'fl2':'fl1',stroke:'var(--line)','stroke-width':.3});}
// Roof: two shingled slabs, ridge, scalloped bargeboards and the finial bird.
const L=Math.hypot(36,24),UL=[36/L,0,24/L],WL=[-24/L,0,36/L],UR=[36/L,0,-24/L],WR=[24/L,0,36/L],Y=[0,1,0];
for(const[o,U,W]of[[[-6,-2,54],UL,WL],[[30,-2,78],UR,WR]]){obox(o,U,Y,W,L,34,2.5,.8,'roof');const sg=group(plane(add(o,mul(W,2.5)),U,Y));
for(let r=1;r<9;r++){const u=r*L/9;let d=`M${u},0`;for(let v=0;v<34;v+=3.4)d+=` Q${u+1.6},${v+1.7} ${u},${v+3.4}`;el('path',{d,class:'shingle'},sg);}}
cylinder(30,-2.4,80.4,1.9,34.8,'y','roof');
const BG=group(FRONT(0,31.6,0));let bd='M-5.4,-54.4';
for(let i=0;i<=10;i++){const x=-5.4+i*3.54,z=58+(x)*2/3;bd+=` L${x.toFixed(2)},${(-z+.2).toFixed(2)}`;}
bd+=' L30,-78.4';for(let i=0;i<=10;i++){const x=30+i*3.54,z=58+(60-x)*2/3;bd+=` L${x.toFixed(2)},${(-z+.2).toFixed(2)}`;}
for(let i=20;i>=0;i--){const x=-5.4+i*3.54,z=x<=30?58+x*2/3:58+(60-x)*2/3,m=x+1.77,mz=m<=30?58+m*2/3:58+(60-m)*2/3;bd+=` Q${(m).toFixed(2)},${(-mz+4.8).toFixed(2)} ${x.toFixed(2)},${(-z+3.2).toFixed(2)}`;}
el('path',{d:bd+'Z',class:'face carve'},BG);
for(let i=1;i<20;i++){const x=-5.4+i*3.54,z=x<=30?58+x*2/3:58+(60-x)*2/3;circle(BG,x,-z+1.6,.55,'face recess');}
const FN=group(FRONT(30,33.2,81));el('path',{d:'M-5.2,0 L5.2,0 L4.6,-1.2 Q3,-1.8 2.6,-3.6 Q4.2,-5 6.6,-5.4 Q4.4,-6.4 2.4,-5.6 Q1.8,-8.4 -.6,-8.2 Q-2.4,-7.6 -2.4,-5.6 L-4.2,-5.4 L-2.6,-4.4 Q-4.4,-2.4 -4.6,-1.2 Z',class:'face carve'},FN);circle(FN,-1.1,-6.4,.4,'eye');
// Door (hinged on its left) and the cuckoo (profile in a side plane), rebuilt as they move.
const doorG=button(el('g',{}),{'aria-label':'Bird door: call the hour now (H)'}),birdG=el('g',{});
frame([[-10,-4,-96,80,4,190],[-6,-2,-3,72,36,92]],8);
// State and timeline. The clock starts at local time; weights run a one-day train.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const say=t=>{announcement.textContent=t;},clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
let ac=null,nb=null;
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
function tone(f,d=.15,v=.02,type='sine',when=0,f2=0){const a=ac;if(!a)return;const t=a.currentTime+when,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.03);}
function breath(d,v,f){const a=ac;if(!a)return;if(!nb){nb=a.createBuffer(1,a.sampleRate,a.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}const t=a.currentTime,s=a.createBufferSource(),b=a.createBiquadFilter(),g=a.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;b.Q.value=4;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(a.destination);s.start(t,Math.random()*.5,d+.05);}
const now0=new Date();let secs=now0.getHours()*3600+now0.getMinutes()*60+now0.getSeconds()+now0.getMilliseconds()/1000;
let running=true,speed=1,amp=1,phase=0,fT=.82,fC=.9,strike=null,jump=null,winding=null,last=performance.now(),lastBeat=0,outKey='';
const hint=k=>document.querySelector(`[data-k="${k}"]`);
function call(){tone(1046,.24,.03,'sine',0,990);breath(.2,.012,1050);tone(880,.34,.03,'sine',.32,820);setTimeout(()=>breath(.3,.012,880),320);}
function startStrike(n){if(strike)return;if(fC<=0){say('The cuckoo weight is down. Wind with W.');return;}audio();strike={n,t0:performance.now(),done:0};say(`Cuckoo, ${n} time${n>1?'s':''}.`);}
function nextHour(){audio();if(jump||strike)return;if(fT<=0){say('Run down. Wind the weights with W.');return;}const to=Math.floor(secs/3600+1e-6)*3600+3600;jump={from:secs,to,t0:performance.now(),dur:reduced.matches?1:1300};if(!running&&fT>0){running=true;sync();}}
function toggleRun(){audio();if(!running&&fT<=0){say('Run down. Wind the weights with W.');return;}running=!running;sync();say(running?'Pendulum started.':'Pendulum stopped. The clock is paused.');}
function windUp(){audio();winding={a:fT,b:fC,t0:performance.now()};for(let i=0;i<8;i++)setTimeout(()=>breath(.05,.01,2600+Math.random()*1200),i*110);say('Weights wound for another day.');}
function fast(){audio();speed=speed>1?1:60;sync();say(speed>1?'Fast: one minute per second.':'Normal speed.');}
// Caption stand-ins record pressed state but have no text nodes; the showroom owns the key labels.
function sync(){set(hint('space'),'aria-pressed',!running);set(hint('f'),'aria-pressed',speed>1);}
const pad=n=>String(Math.floor(n)).padStart(2,'0');
let lastOpen=-1,lastOut=-1,lastCp=-1;
function drawDoor(open){if(Math.abs(open-lastOpen)<1e-4)return;lastOpen=open;doorG.textContent='';const a=open*1.85,U=[Math.cos(a),Math.sin(a),0],g=el('g',{transform:plane([25,26.1,60],U,[0,0,-1])},doorG);
el('path',{d:ARCH,class:open>.55?'face carve side':'face carve'},g);el('path',{d:'M2,12 V6 A3,3 0 0 1 8,6 V12 Z',class:'detail'},g);circle(g,8.4,8.6,.6,'face brass');
const r=group(FRONT(25,26.1,60),doorG);el('path',{d:'M-2.2,15 V5 A7.2,7.2 0 0 1 12.2,5 V15 Z',class:'focus-ring'},r);el('path',{d:'M-2,15 V5 A7,7 0 0 1 12,5 V15 Z',class:'hit'},r);}
function drawBird(out,callP){if(Math.abs(out-lastOut)<1e-4&&Math.abs(callP-lastCp)<1e-4)return;lastOut=out;lastCp=callP;birdG.textContent='';if(out<=.01)return;const y=24.5+out*9.5,tilt=callP*12,g=el('g',{transform:`${SIDE(30.5,y,52)} rotate(${-tilt} -1 0)`},birdG);
line(g,1,2.4,12,2.4,'detail');
el('path',{d:`M4.6,-1.2 L9.4,${-2.6-callP*1.4} L9.8,${-1-callP*.8} L5,.8 Z`,class:'bird bird-dk'},g);
el('ellipse',{cx:1.2,cy:0,rx:4.1,ry:2.6,class:'bird'},g);circle(g,-2.4,-2.3,2,'bird');
el('path',{d:`M-4.2,-2.9 L-6.9,${-2.5-callP*.5} L-4.3,-2 Z`,class:'beak'},g);el('path',{d:`M-4.3,-1.9 L${-6.4+callP*.4},${-1.5+callP*1.3} L-4,-1.4 Z`,class:'beak'},g);
circle(g,-2.9,-2.7,.42,'eye');el('path',{d:`M-.6,-1 Q2.2,${-2.6-callP*2.4} 5.2,${-1-callP*1.6} Q2.4,.6 -.6,-1Z`,class:'bird bird-dk'},g);
line(g,.8,2.3,.3,3.3,'detail');}
function tick(nowT){const dt=Math.min(.05,(nowT-last)/1000);last=nowT;const prev=secs;
let jumpEnded=false;
if(jump){const p=clamp((nowT-jump.t0)/jump.dur);secs=jump.from+(jump.to-jump.from)*ease(p);if(p>=1){secs=jump.to+.01;jump=null;jumpEnded=true;}}
else if(running&&fT>0)secs+=dt*speed;
const used=(secs-prev)/86400;if(used>0)fT=Math.max(0,fT-used);if(fT<=0&&running){running=false;sync();say('The clock has run down. Wind with W.');}
if(winding){const p=clamp((nowT-winding.t0)/(reduced.matches?1:1300));fT=winding.a+(1-winding.a)*ease(p);fC=winding.b+(1-winding.b)*ease(p);if(p>=1){winding=null;if(!running){running=true;sync();}}}
if(jumpEnded)startStrike(Math.floor(secs/3600)%12||12);
else if(!jump&&Math.floor(prev/1800)!==Math.floor(secs/1800)&&secs>prev){const h=Math.floor(secs/3600)%12||12;startStrike(Math.floor(secs/60)%60<30?h:1);}
amp+=((running?1:0)-amp)*Math.min(1,dt*(running?1.4:3.2));if(reduced.matches)amp=running?1:0;
phase+=dt;const th=9*amp*Math.sin(phase*Math.PI*2)*(reduced.matches?0:1);
const beat=Math.floor(phase*2);if(beat!==lastBeat){lastBeat=beat;if(ac&&amp>.3)tone(beat%2?1500:1750,.014,.006,'square');}
set(penR,'transform',`rotate(${th})`);set(penShade,'transform',`translate(31.8 4.8) rotate(${th})`);
const m=(secs/60)%60,h=(secs/3600)%12;set(MH,'transform',`rotate(${m*6})`);set(HH,'transform',`rotate(${h*30})`);
const wz=[-12-32*(1-fT),-12-32*(1-fC)],rz=[-44+32*(1-fT),-44+32*(1-fC)];
WT.forEach((g,i)=>set(g,'transform',`translate(0 ${-wz[i]})`));RINGS.forEach((g,i)=>set(g,'transform',`translate(0 ${-rz[i]})`));
[[17,rz[0]-.2],[21,wz[0]+1.6],[39,wz[1]+1.6],[43,rz[1]-.2]].forEach(([x,z],i)=>{const d=poly([[x,13,-1],[x,13,z]]);set(CH[i].u,'d',d);set(CH[i].c,'d',d);});
wShades.forEach((r,i)=>{set(r,'x',(i?39:21)+.6);set(r,'y',-wz[i]+3);});
const lo=P(14,13,Math.min(...wz)-24),hi=P(46,13,-2);set(windHit,'x',lo[0]-4);set(windHit,'y',hi[1]);set(windHit,'width',P(46,13,0)[0]-lo[0]+8);set(windHit,'height',lo[1]-hi[1]+6);
let open=0,out=0,cp=0,st='';
if(strike){const e=(nowT-strike.t0)/1000,n=strike.n,T=.36+.24+n*.95+.24+.3;
open=clamp(e/.36);out=clamp((e-.36)/.24);const ce=e-.6,k=Math.floor(ce/.95);
if(ce>=0&&k<n){const f=ce-k*.95;cp=f<.32?Math.sin(f/.32*Math.PI/2):f<.7?1-.6*Math.sin((f-.32)/.38*Math.PI):clamp(1-(f-.7)/.2)*.4;if(k>=strike.done){strike.done=k+1;call();fC=Math.max(0,fC-.012);}}
const back=e-(.6+n*.95);if(back>0){out=1-clamp(back/.24);open=1-clamp((back-.24)/.3);}
if(reduced.matches){open=e<T-.3?1:0;out=open;cp=0;}
st=`CUCKOO ${Math.min(n,strike.done)} OF ${n}`;if(e>=T)strike=null;}
drawDoor(open);drawBird(out,cp);set(inner,'style',`opacity:${open*.75}`);set(innerCore,'style',`opacity:${open*.35}`);
const r=`${pad(secs/3600%24)}:${pad(secs/60%60)}:${pad(secs%60)}${speed>1?' · ×60':''}`;
if(!st)st=fT<=0?'RUN DOWN · PRESS W':!running?'STOPPED':jump?'ADVANCING TO THE HOUR':winding?'WINDING':`RUNNING · WEIGHTS ${Math.round(fT*100)}% / ${Math.round(fC*100)}%`;
if(r+st!==outKey){readout.textContent=r;stateLabel.textContent=st;outKey=r+st;}
requestAnimationFrame(tick);}
bind(doorG,nextHour);bind(pen,toggleRun);bind(wind,windUp);[...WT,...RINGS].forEach(g=>g.addEventListener('click',windUp));penR.addEventListener('click',toggleRun);
pen.addEventListener('focus',()=>set(penFocus,'style','opacity:1'));pen.addEventListener('blur',()=>set(penFocus,'style',''));
document.querySelectorAll('.hint [data-k]').forEach(b=>b.addEventListener('click',()=>({h:nextHour,space:toggleRun,w:windUp,f:fast})[b.dataset.k]()));
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented||e.repeat)return;const k=e.key.toLowerCase();
if(k===' '){if(e.target.closest&&e.target.closest('button,[role=button]'))return;e.preventDefault();toggleRun();}
else if(k==='h'){e.preventDefault();nextHour();}else if(k==='w'){e.preventDefault();windUp();}else if(k==='f'){e.preventDefault();fast();}});
sync();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['h', 'space', 'w', 'f'], draw }
