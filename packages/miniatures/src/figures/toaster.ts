// @ts-nocheck
/* TAVREN T–02 · Two-slot toaster. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#8f8f8b;--glass:#2b2b2b;--line:#626260;--rule:#d6d6d2;--shadow:#262626;--accent:#3b5bfd;--rubber:#2c2c2b;--metal:#d4d6d3;--metal-top:#eef0ee;--metal-side:#b4b7b4;--tray:#ecebe7;--heat:#f58335;--ember:#ffc077;--cold:#4a4a48;--off:#c4c4c0;--ok:#15a65e;--fault:#e3372d;--haze:.5}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#636362;--glass:#232323;--rubber:#232323;--metal:#b3b4b2;--metal-top:#dfe1df;--metal-side:#7f807f;--tray:#c7c6c3;--heat:#ff9047;--ember:#ffc077;--cold:#3d3d3c;--off:#a5a5a2;--ok:#36d886;--fault:#ff4c41;--haze:.75;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.rubber{fill:var(--rubber)}.metal{fill:var(--metal)}.tray-metal{fill:var(--tray)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.accent{fill:var(--accent);stroke:var(--accent)}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6.5px;letter-spacing:1.8px;font-weight:600}.micro{font-size:2.7px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.09;filter:url(#soft)}.control{cursor:pointer;outline:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .button-face{fill:var(--top)}.hit{fill:transparent;stroke:none}.button-icon{fill:none;stroke:var(--line);stroke-width:1;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.active .button-icon{stroke:var(--accent)}.press{transition:transform .12s}.pressed .press{transform:translateY(2px)}.active .button-face{fill:var(--accent);fill-opacity:.16;stroke:var(--accent)}.cord-under{fill:none;stroke:var(--line);stroke-width:4.4;stroke-linecap:round;stroke-linejoin:round}.cord{fill:none;stroke:var(--rubber);stroke-width:3.1;stroke-linecap:round;stroke-linejoin:round}.bread-crust{fill:var(--crust,#c99953);stroke:#926a36;stroke-width:.8;vector-effect:non-scaling-stroke;stroke-linejoin:round}.bread-edge{fill:var(--edge,#bb8948);stroke:#926a36;stroke-width:.8;vector-effect:non-scaling-stroke}.bread-face{fill:var(--crumb,#f2dbac);stroke:var(--toast-line,#d7b979);stroke-width:.65;vector-effect:non-scaling-stroke}.bread-grain{fill:var(--toast-line,#d7b979);stroke:none;opacity:.62}.crumb{fill:#b58a50;stroke:none}.bread-score{fill:none;stroke:var(--toast-line,#d7b979);stroke-width:.8;opacity:.65}.slot-glow{fill:var(--heat);opacity:0;filter:url(#bloom)}.heater{fill:none;stroke:var(--cold);stroke-width:1.25;stroke-linecap:round;stroke-linejoin:round;vector-effect:non-scaling-stroke}.toasting .heater{stroke:var(--ember);filter:url(#glow);animation:heat 1.9s ease-in-out infinite alternate}.toasting .slot-glow{opacity:.3}.toasting.bagel .heater.outer{stroke:var(--cold);filter:none;animation:none}.led{fill:var(--muted);stroke:none}.bagel-led{fill:var(--muted)}.bagel .bagel-led{fill:var(--accent);filter:url(#glow)}.timer-track{fill:none;stroke:var(--line);stroke-width:.6;opacity:.4}.timer-ring{fill:none;stroke:var(--accent);stroke-width:1.7;stroke-linecap:round;vector-effect:non-scaling-stroke;transform:rotate(-90deg);opacity:0}.toasting .timer-ring{opacity:1;filter:url(#glow)}.dial-number{fill:var(--ink);font:9px ui-monospace,monospace;text-anchor:middle}.dial-mark{stroke:var(--ink);stroke-width:1.3;stroke-linecap:round}.ready .ready-dot{fill:var(--accent)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.seg{fill:var(--off);stroke:none}.seg.lv{fill:var(--accent);opacity:.55}.seg.on{fill:var(--heat);filter:url(#glow)}.seg.ok{fill:var(--ok);filter:url(#glow)}.lamp-led{fill:var(--off);stroke:none}.toasting .lamp-led{fill:var(--heat);filter:url(#glow)}.lamp-halo{fill:var(--heat);opacity:0;filter:url(#bloom)}.toasting .lamp-halo{opacity:.55}.cancel-ring{fill:none;stroke:var(--off);stroke-width:1.2}.toasting .cancel-ring{stroke:var(--fault);filter:url(#glow)}.slot-bloom{fill:var(--heat);opacity:0;filter:url(#bloom);transition:opacity .6s;pointer-events:none}.toasting .slot-bloom{opacity:var(--haze)}.toasting.bagel .slot-bloom{opacity:calc(var(--haze)*.6)}.haze{fill:none;stroke:var(--ember);stroke-width:.9;stroke-linecap:round;opacity:0;filter:url(#soft);pointer-events:none}.plug{fill:var(--metal-top);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}
@keyframes breathe{to{opacity:.48}}@keyframes heat{to{opacity:.65}}
@media(prefers-reduced-motion:reduce){.pressed .press{transform:none}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = ``

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* Part table — x y z w d h; x lower-right, y lower-left, z up.
Painter order is rear to front; details stay on their parent face.
cord + strain relief       213 -14  1  71  49  36
rear-left foot              23  19  0  21  18   9
rear-right foot            188  19  0  21  18   9
front-left foot             23 113  0  21  18   9
front-right foot           188 113  0  21  18   9
plinth                       3   3  8 226 142  10
crumb tray                  24 105 10 168  43   4
tray liner + crumbs         29 110 14 158  33   1
tray pull                   24 148  8 168   5   8
shell                        8   8 17 216 132 124
side service inset         224  28 38   0  96  56
side vents                 224  37 45   0  77  17
top deck                    25  21 141 178 105  0
rear slot + coils           34  32 142 148  23   0
rear bread                  42  37 108 128   9  74
rear slot front lip         34  51 142 148   4   0
front slot + coils          34  79 142 148  23   0
front bread                 42  84 108 128   9  74
front slot front lip        34  98 142 148   4   0
top retaining strip        191  29 142   7  89   0
front inset                 19 140 27 194   0 103
brand plate                 29 141 112  77   1  12
lever guide                163 141 48  28   2  80
lever stem                 172 143 108  5  12  10
lever grip                 158 149 106  34  14  13
dial bezel                  45 140 48  44   7  44
dial knob                   50 147 53  34   2  34
bagel button               103 142 65  24   5  24
cancel button              131 142 65  24   5  24
status lamp                123 142 105  10   0  10
lower seam                  19 141 26 194   0   0
Screws, rings, labels, seams and focus outlines share parent planes.
Bread drops 54 in z; lever drops 45 in z; tray pulls 48 in y.
*/
// Isometric engine: affine face planes, solids, round parts, grille and fit.
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Assembly. The drawer is painted before the shell so its rear stays enclosed.
const shadow=P(118,80,0);el('ellipse',{cx:shadow[0],cy:shadow[1]+4,rx:160,ry:60,class:'shadow stage-floor'});el('ellipse',{cx:shadow[0],cy:shadow[1]+4,rx:160,ry:60,class:'stage-contact'});
const f2=v=>v.toFixed(2);
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
const cordPoints=[[226,23,30],[238,22,24],[247,26,6],[256,40,2],[266,64,2],[262,88,2],[250,104,2]];
el('path',{d:smooth(cordPoints),class:'cord-under'});el('path',{d:smooth(cordPoints),class:'cord'});
box(240,104,2,14,12,8,2.4,'rubber');const plugF=group(FRONT(240,116,8));rect(plugF,3,2.4,8,3.2,1,'face recess');
for(const x of[243.5,249.5])box(x,116,4,1.2,7,2.4,.3,'metal');
box(222,17,26,5,12,11,2,'rubber');
for(const[x,y]of[[23,19],[188,19],[23,113],[188,113]])box(x,y,0,21,18,9,3,'rubber');
box(3,3,8,226,142,10,5,'base');
const baseFront=group(FRONT(13,145.2,18));line(baseFront,0,3,205,3);rect(baseFront,9,3,172,6,2,'face recess');
const trayControl=el('g',{id:'trayControl',class:'control',role:'button',tabindex:'0','aria-label':'Pull out crumb tray (T)','aria-expanded':'false'});
trayControl.appendChild(box(24,105,10,168,43,4,3,'base'));
const trayBed=group(TOP(29,110,14.15),trayControl);rect(trayBed,0,0,158,33,3,'face tray-metal');
for(let i=0;i<6;i++)line(trayBed,8,5+i*4.6,150,5+i*4.6);
for(let i=0;i<34;i++){
const x=13+(i*43)%133,y=4+(i*17)%25,r=.6+(i%4)*.22;
el('path',{d:`M${x-r},${y} l${r},${-r} ${r*1.8},${r*.6} ${-r*.4},${r*1.7} Z`,class:'crumb'},trayBed);
}
const trayPull=group(FRONT(24,148,16),trayControl);rect(trayPull,0,0,168,8,3,'face base button-face');
rect(trayPull,62,2,44,4,1.6,'face recess');line(trayPull,67,4,101,4);screw(trayPull,7,4);screw(trayPull,161,4);
rect(trayPull,-1,-5,170,21,4,'hit');rect(trayPull,-2,-2,172,12,4,'focus-ring');
box(8,8,17,216,132,118,12);
rect(group(FRONT(8,140.3,31)),8,0,200,3.6,1.8,'face metal');rect(group(SIDE(224.3,140,31)),8,0,116,3.6,1.8,'face side metal');
const ledge=group(TOP(8,8,135.1));line(ledge,7,129,209,129);
box(14,13,135,204,121,6,9,'metal');
const service=group(SIDE(224.25,124,94));rect(service,0,0,96,56,6,'face base');
rect(service,4,4,88,48,4,'detail');
for(const p of[[7,7],[89,7],[7,49],[89,49]])screw(service,...p);
slits(service,10,31,77,17,5,false);line(service,10,23,87,23);text(service,48,16,'T–02 / 850 W','etch center');
const deck=group(TOP(25,21,141.25));rect(deck,0,0,178,105,8,'face top metal');rect(deck,3,3,172,99,6,'detail');
for(const p of[[6,6],[172,6],[6,99],[172,99]])screw(deck,...p);
const loaves=[],coils=[],hazes=[];
const loafOutline='M8,74 L6,32 Q-1,29 0,18 Q0,1 20,0 L108,0 Q128,1 128,18 Q130,29 122,32 L120,74 Z';
const crumbOutline='M14,68 L13,29 Q5,25 7,17 Q7,7 21,7 L106,7 Q121,7 121,18 Q123,25 115,29 L113,68 Z';
function slot(y,index){
const g=group(TOP(34,y,141.6));rect(g,0,0,148,23,9,'face top');rect(g,2,2,144,19,8,'face recess');
rect(g,5,4,138,15,6,'face glass');rect(g,8,4,132,15,5,'slot-glow');
for(let row=0;row<2;row++){
let d='M9,'+(row?16:7);
for(let k=0;k<30;k++)d+=` l4.3,${k%2===0?1.6:-1.6}`;
coils.push(el('path',{d,class:'heater '+((index===0&&row===0)||(index===1&&row===1)?'outer':'inner')},g));
}
line(g,6,3,141,3);line(g,6,20,141,20);
// A fixed clip at slot height conceals each moving carriage and slice.
const plane=group(FRONT(42,y+14,182));
const clip=el('clipPath',{id:'breadClip'+index},svg.querySelector('defs'));
el('rect',{x:-4,y:-26,width:146,height:66.2},clip);
const viewport=el('g',{'clip-path':`url(#breadClip${index})`},plane);
const loaf=group('translate(0 0)',viewport,{id:'bread'+index});
el('path',{d:loafOutline,transform:'translate(9 -9)',class:'bread-edge'},loaf);
el('path',{d:'M108,0 L117,-9 Q137,-8 137,9 Q139,20 131,23 L129,65 L120,74 L122,32 Q130,29 128,18 Q128,1 108,0 Z',class:'bread-edge'},loaf);
el('path',{d:loafOutline,class:'bread-crust'},loaf);
el('path',{d:crumbOutline,class:'bread-face'},loaf);
for(let i=0;i<41;i++){
const x=16+(i*29)%94,yy=11+(i*19)%52;
ellipseGrain(loaf,x,yy,.55+(i%4)*.24,i%3===0);
}
el('path',{d:'M19,20 Q47,14 75,19 T110,18 M18,54 Q62,61 110,53',class:'bread-score'},loaf);
loaves.push(loaf);
rect(group(TOP(34,y,142)),6,2,136,19,8,'slot-bloom');
const hz=group(FRONT(34,y+11.5,190));for(let k=0;k<4;k++){const u=22+k*34+index*9;let d=`M${u},48`;for(let j=1;j<=8;j++)d+=` Q${u+(j%2?3.2:-3.2)},${48-j*5+2.5} ${u},${48-j*5}`;hazes.push({n:el('path',{d,class:'haze'},hz),o:(k*.27+index*.13)%1});}
const lip=group(TOP(34,y+19,141.9));rect(lip,0,0,148,4,2,'face metal');line(lip,5,.4,142,.4);line(lip,6,3,141,3);
}
function ellipseGrain(g,x,y,r,long){el('ellipse',{cx:x,cy:y,rx:long?r*1.9:r,ry:r,class:'bread-grain'},g);}
slot(32,0);slot(79,1);
const retaining=group(TOP(191,29,141.65));rect(retaining,0,0,7,89,2,'face top');screw(retaining,3.5,5);screw(retaining,3.5,84);line(retaining,3.5,12,3.5,77);
const front=group(FRONT(19,140.35,130));rect(front,0,0,194,103,8,'detail');
for(const p of[[6,6],[188,6],[6,97],[188,97]])screw(front,...p);
const brand=group(FRONT(29,141,124));rect(brand,0,0,77,12,2,'face top');text(brand,38.5,8.5,'TAVREN','label brand center');screw(brand,4,6);screw(brand,73,6);
const guide=group(FRONT(163,141.2,128));rect(guide,0,0,28,80,6,'face base');rect(guide,3,3,22,74,4,'face recess');
rect(guide,10,10,8,60,3,'face glass');line(guide,14,12,14,68);screw(guide,14,6);screw(guide,14,74);
for(let i=0;i<5;i++)line(guide,22,19+i*10,25,19+i*10);
const leverControl=el('g',{id:'leverControl',class:'control',role:'button',tabindex:'0','aria-label':'Lower lever to toast, or lift to cancel (Space)','aria-pressed':'false'});
leverControl.appendChild(box(172,143,108,5,12,10,2,'metal'));
leverControl.appendChild(box(158,149,106,34,14,13,4,'rubber'));
const grip=group(FRONT(158,163.2,119),leverControl);rect(grip,2,2,30,9,3,'face rubber button-face');
line(grip,9,6,25,6);line(grip,10,8,24,8);rect(grip,-4,-5,42,28,5,'hit');rect(grip,-3,-3,40,19,5,'focus-ring');
const bezel=cylinder(67,140.5,70,22,7,'y','base').face;circle(bezel,0,0,20,'face metal');circle(bezel,0,0,18.5,'face recess');
const dialControl=group(FRONT(67,148,70),root,{id:'dialControl',class:'control',role:'button',tabindex:'0','aria-label':'Browning level 3 of 6. Click to turn; use keys 1 to 6.'});
circle(dialControl,0,0,21,'timer-track');const timerRing=circle(dialControl,0,0,21,'timer-ring');
set(timerRing,'stroke-dasharray',2*Math.PI*21);set(timerRing,'stroke-dashoffset',2*Math.PI*21);
for(let i=1;i<=6;i++){
const a=(-130+(i-1)*52)*Math.PI/180;
line(dialControl,Math.sin(a)*23.5,-Math.cos(a)*23.5,Math.sin(a)*25.5,-Math.cos(a)*25.5);
text(dialControl,Math.sin(a)*29,-Math.cos(a)*29+1.2,i,'etch micro center');
}
circle(dialControl,0,0,17,'face top button-face');circle(dialControl,0,0,13.5,'detail');
for(let i=0;i<24;i++){const a=i*Math.PI/12;line(dialControl,15*Math.cos(a),15*Math.sin(a),16.2*Math.cos(a),16.2*Math.sin(a));}
const dialMark=group('rotate(-26)',dialControl);line(dialMark,0,-8.5,0,-12.2,'dial-mark');
const dialNumber=text(dialControl,0,3.2,'3','dial-number');circle(dialControl,0,0,32,'hit');circle(dialControl,0,0,33,'focus-ring');
text(group(FRONT(67,141,32)),0,0,'BROWNING','etch center');
function button(x,id,label,icon){
cylinder(x,141.5,77,12,4.5,'y','base');
const g=group(FRONT(x,147,77),root,{id,class:'control',role:'button',tabindex:'0','aria-label':label});
circle(g,0,0,15,'hit');circle(g,0,0,16,'focus-ring');const press=group('translate(0 0)',g,{class:'press'});
circle(press,0,0,10.5,'face top button-face');circle(press,0,0,8.2,'detail');el('path',{d:icon,class:'button-icon'},press);
text(g,0,20,id==='bagelControl'?'BAGEL':'CANCEL','etch micro center');return{g,press};
}
const bagelControl=button(115,'bagelControl','Toggle bagel mode, heating the inner faces (B)','M-6,0 C-6,-7 6,-7 6,0 C6,7 -6,7 -6,0 Z M-2,0 a2,2 0 1,0 4,0 a2,2 0 1,0 -4,0');
set(bagelControl.g,'aria-pressed','false');circle(bagelControl.press,0,6.8,.8,'bagel-led');
const cancelControl=button(143,'cancelControl','Cancel and pop up toast (C)','M-3,-3 h6 v6 h-6 Z');circle(cancelControl.press,0,0,9.4,'cancel-ring');
const lamp=group(FRONT(118,141,118));circle(lamp,0,0,7,'lamp-halo');circle(lamp,0,0,3.5,'face recess');circle(lamp,0,0,2.3,'lamp-led');text(lamp,6,1,'HEAT','etch micro');
const bar=group(FRONT(88,141,103));rect(bar,0,0,52,8,2.6,'face recess');const SEGS=[];for(let i=0;i<6;i++)SEGS.push(rect(bar,3+i*8,2.6,6,2.8,1,'seg'));text(bar,26,13,'TIME','etch micro center');
line(front,8,91,186,91);text(front,103,98,'T–02','etch micro center');
frame([[3,3,0,226,142,18],[8,8,17,216,132,124],[42,32,108,137,70,89],[158,141,48,34,22,80],[24,105,8,168,96,8],[224,18,0,46,100,32]],12);
// One shared state drives the mechanics, countdown and accessible readout.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const shades=['PALE','LIGHT','GOLDEN','AMBER','DEEP','DARK'];
let level=3,bagel=false,trayOpen=false,cycle=null,done=false,seconds=0;
let breadTravel=0,leverTravel=0,trayTravel=0,popMotion=null,lastFrame=performance.now(),lastUI=0;
let shade=0,toastedLevel=3,note='',noteUntil=0,segKey='';
const palette=[['#f2dbac','#c99953','#bb8948','#d7b979'],['#ebcd92','#bd8a45','#ac7738','#cfab69'],['#deaf66','#a97333','#956329','#bc914e'],['#ca914c','#93602a','#7d5024','#ac783d'],['#b67636','#7d4b22','#683d1c','#965f2d'],['#935421','#663a1a','#542f16','#7b461f'],['#724018','#4f2c14','#422410','#623616']];
function say(message){announcement.textContent=message;}
function notice(message){note=message;noteUntil=performance.now()+1400;}
function toastColor(amount){
shade=clamp(amount,0,6);
loaves.forEach((loaf,index)=>{
const v=bagel&&index===1?shade*.35:shade,i=Math.floor(v),j=Math.min(6,i+1),f=v-i;
const color=(k)=>{const a=palette[i][k],b=palette[j][k];return'#'+[1,3,5].map(p=>Math.round(parseInt(a.slice(p,p+2),16)*(1-f)+parseInt(b.slice(p,p+2),16)*f).toString(16).padStart(2,'0')).join('');};
for(const[k,n]of['--crumb','--crust','--edge','--toast-line'].entries())loaf.style.setProperty(n,color(k));
});
}
function controls(){
svg.classList.toggle('toasting',!!cycle);svg.classList.toggle('bagel',bagel);svg.classList.toggle('ready',done);
set(leverControl,'aria-pressed',!!cycle);set(bagelControl.g,'aria-pressed',bagel);
bagelControl.g.classList.toggle('active',bagel);set(bagelControl.press,'transform',`translate(0 ${bagel?1.8:0})`);
set(trayControl,'aria-expanded',trayOpen);set(trayControl,'aria-label',trayOpen?'Close crumb tray (T)':'Pull out crumb tray (T)');
set(dialControl,'aria-label',`Browning level ${level} of 6, ${shades[level-1].toLowerCase()}. Click to turn; use keys 1 to 6.`);
set(dialMark,'transform',`rotate(${-130+(level-1)*52})`);dialNumber.textContent=level;
}
function ui(now=performance.now()){
if(cycle)seconds=Math.max(0,Math.ceil(cycle.total*(1-clamp((now-cycle.start)/cycle.duration))));
readout.textContent=`${String(level).padStart(2,'0')} / 06 · ${String(seconds).padStart(2,'0')} s`;
stateLabel.textContent=cycle?(bagel?'TOASTING / INNER HEAT':'TOASTING / TWO FACES')+(trayOpen?' · TRAY OPEN':''):now<noteUntil?note:trayOpen?'CRUMB TRAY OPEN':done?`TOAST READY / ${shades[toastedLevel-1]}`:bagel?'BAGEL / INNER HEAT':'READY / TWO SLICES';
set(timerRing,'stroke-dashoffset',2*Math.PI*21*(cycle?clamp((now-cycle.start)/cycle.duration):1));lastUI=now;
}
function start(){
if(trayOpen){notice('CLOSE TRAY / T');say('Close the crumb tray with T before lowering the lever.');ui();return;}
const now=performance.now();done=false;seconds=45+level*15;popMotion=null;noteUntil=0;
cycle={start:now,duration:4500+level*700,total:seconds,from:shade};
if(reduced.matches){breadTravel=54;leverTravel=45;drawMotion();}
controls();ui(now);say(`Lever lowered. Toasting two slices at level ${level}${bagel?', inner faces only':''}.`);
}
function finish(cancelled=false){
const now=performance.now();
if(cycle){
const p=clamp((now-cycle.start)/cycle.duration);toastColor(cancelled?cycle.from+(level-cycle.from)*p:level);
popMotion={at:now,from:breadTravel};cycle=null;seconds=0;done=!cancelled;if(done)toastedLevel=level;
if(reduced.matches){breadTravel=0;leverTravel=0;popMotion=null;drawMotion();}
notice(cancelled?'CANCELLED / TOAST RELEASED':`TOAST READY / ${shades[level-1]}`);
say(cancelled?'Heating cancelled. Bread popped up.':`Toast popped up. Browning level ${level}, ${shades[level-1].toLowerCase()}.`);
}else{notice('CANCEL / READY');say('Heating is already off. Lever released.');}
controls();ui(now);
}
function lever(){cycle?finish(true):start();}
function browning(value){
const now=performance.now();level=value;
if(cycle){const p=clamp((now-cycle.start)/cycle.duration);cycle.duration=4500+level*700;cycle.start=now-p*cycle.duration;cycle.total=45+level*15;}
notice(`LEVEL ${level} / ${shades[level-1]}`);controls();ui(now);say(`Browning level ${level} of six, ${shades[level-1].toLowerCase()}.`);
}
function bagelToggle(){
bagel=!bagel;notice(bagel?'BAGEL / INNER HEAT':'STANDARD / TWO FACES');controls();ui();
say(bagel?'Bagel mode on. Only the inner heating elements are active.':'Bagel mode off. Both faces will toast.');
}
function trayToggle(){
if(!trayOpen&&cycle)finish(true);
trayOpen=!trayOpen;notice(trayOpen?'CRUMB TRAY OPEN':'CRUMB TRAY CLOSED');
if(reduced.matches){trayTravel=trayOpen?48:0;drawMotion();}
controls();ui();say(trayOpen?'Crumb tray pulled out. Crumbs exposed.':'Crumb tray closed.');
}
function cancel(){
cancelControl.g.classList.add('pressed');setTimeout(()=>cancelControl.g.classList.remove('pressed'),180);finish(true);
}
function bind(g,fn){
g.addEventListener('click',fn);
g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});
}
bind(leverControl,lever);bind(dialControl,()=>browning(level%6+1));bind(bagelControl.g,bagelToggle);bind(cancelControl.g,cancel);bind(trayControl,trayToggle);
dialControl.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopPropagation();browning(clamp(level+(e.key==='ArrowRight'?1:-1),1,6));}});
document.addEventListener('keydown',e=>{
if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
const key=e.key.toLowerCase();
const action=/^[1-6]$/.test(key)?()=>browning(+key):{' ':lever,c:cancel,b:bagelToggle,t:trayToggle}[key];
if(action){e.preventDefault();action();}
});
function drawMotion(){
set(leverControl,'transform',`translate(0 ${leverTravel})`);
for(const loaf of loaves)set(loaf,'transform',`translate(0 ${breadTravel})`);
set(trayControl,'transform',`translate(${-trayTravel*C} ${trayTravel*S})`);
}
function tick(now){
const dt=Math.min(60,Math.max(0,now-lastFrame));lastFrame=now;
const approach=(value,target,ms)=>reduced.matches?target:value+(target-value)*(1-Math.exp(-dt/ms));
leverTravel=approach(leverTravel,cycle?45:0,65);
trayTravel=approach(trayTravel,trayOpen?48:0,110);
if(popMotion){const t=(now-popMotion.at)/1000;breadTravel=reduced.matches||t>.8?0:popMotion.from*Math.exp(-7*t)*Math.cos(10*t);if(t>.8||reduced.matches)popMotion=null;}
else breadTravel=approach(breadTravel,cycle?54:0,85);
drawMotion();
if(cycle){
const p=clamp((now-cycle.start)/cycle.duration);toastColor(cycle.from+(level-cycle.from)*p);
if(p>=1)finish();
}
const red=reduced.matches,prog=cycle?clamp((now-cycle.start)/cycle.duration):0,flash=done&&now<noteUntil&&!red&&Math.floor(now/200)%2;
const sk=SEGS.map((_,i)=>cycle?(i<Math.ceil((1-prog)*6)?'seg on':'seg'):done&&now<noteUntil?(flash?'seg':'seg ok'):i<level?'seg lv':'seg').join('|');
if(sk!==segKey){segKey=sk;sk.split('|').forEach((c,i)=>set(SEGS[i],'class',c));}
for(const h of hazes){if(!cycle){if(h.v){h.v=0;h.n.style.opacity=0;}continue;}h.v=1;const ph=red?.5:(now/1700+h.o)%1;h.n.style.opacity=(Math.sin(ph*Math.PI)*(red?.3:.5)).toFixed(2);set(h.n,'transform',`translate(0 ${(-ph*26).toFixed(1)})`);}
if(now-lastUI>90)ui(now);
requestAnimationFrame(tick);
}
toastColor(0);controls();ui();drawMotion();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], draw }
