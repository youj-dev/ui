// @ts-nocheck
/* MERRAN M–4 · Mixing desk. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323937;--muted:#7a837d;--body:#dfe4dc;--top:#f8f9f5;--side:#c8cfc6;--base:#bcc5bb;--line:#56635b;--recess:#a3aea5;--glass:#e9eee8;--accent:#3b5bfd;--warm:#e2652a;--paper:#f1e8c9;--pad:#5a615c;--pad-top:#747b76;--pad-side:#4a504c;--cap:#3e4541;--cap-top:#59605c;--cap-side:#313734;--cone:#4a514d;--off:#c4cbc5;--index:#fff;--hover:#fff;--rule:#d6dcd5;--shadow:#263830}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--body:#bdc0bb;--top:#e8e9e5;--side:#8f918e;--base:#9fa59f;--recess:#757976;--glass:#c5c8c4;--warm:#ff8a4c;--paper:#cbc3a9;--pad:#4c504d;--pad-top:#6c736e;--pad-side:#333534;--cap:#343836;--cap-top:#535956;--cap-side:#212322;--cone:#3e4340;--off:#a6aaa7;--index:#d7d7d7;--hover:#efefef;--line:#444443}svg{--ink:#282e2d;--muted:#666d68}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.paper{fill:var(--paper)}.pad{fill:var(--pad)}.top.pad{fill:var(--pad-top)}.side.pad{fill:var(--pad-side)}.cap{fill:var(--cap)}.top.cap{fill:var(--cap-top)}.side.cap{fill:var(--cap-side)}.cone{fill:var(--cone)}
.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.accent{fill:var(--accent);stroke:var(--accent)}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.end{text-anchor:end}.shadow{fill:var(--shadow);opacity:.08;filter:url(#soft)}
.hand{fill:var(--ink);font:4.4px 'Marker Felt','Segoe Print','Bradley Hand',cursive;stroke:none;text-anchor:middle;opacity:.85}.seg{fill:var(--off);stroke:none}.seg.on{fill:var(--accent)}.seg.hot.on{fill:var(--warm)}.led{fill:var(--off);stroke:none}.led.on{fill:var(--accent);filter:url(#glow)}.led.warm.on{fill:var(--warm)}.index{stroke:var(--index);stroke-width:.9;opacity:.9}.selected .index{stroke:var(--accent);opacity:1}.master-cap .index{stroke:var(--warm)}.num{fill:var(--muted);transition:fill .2s}.selected .num{fill:var(--accent)}.sel{fill:none;stroke:var(--accent);stroke-width:1.2;vector-effect:non-scaling-stroke;opacity:0;transition:opacity .2s}.selected .sel{opacity:.8}.screen{fill:var(--muted);font:5px ui-monospace,monospace;letter-spacing:.5px;stroke:none}.playing .screen{fill:var(--accent)}.icon{fill:var(--ink);stroke:none}.stitch{stroke-dasharray:1.4 1.3;opacity:.7}.cable-under{fill:none;stroke:var(--line);stroke-width:4.2;stroke-linecap:round;stroke-linejoin:round}.cable{fill:none;stroke:var(--pad);stroke-width:2.8;stroke-linecap:round;stroke-linejoin:round}
.control{cursor:pointer;outline:none}.slider{cursor:grab;outline:none;touch-action:none}.slider.dragging{cursor:grabbing}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring,.slider:focus-visible .focus-ring{opacity:1}.control:hover .press .face.top{fill:var(--hover)}.press{transition:transform .12s}.latched .press{transform:translate(.16px,.85px)}.pressed .press{transform:translate(.3px,1.6px)}.ready .play-led{animation:breathe 1.6s ease-in-out infinite alternate}
@keyframes breathe{from{fill:var(--off)}to{fill:var(--accent)}}
@media(prefers-reduced-motion:reduce){.pressed .press{transform:none}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="stage-floor-fill"><stop offset="0" stop-color="#f4f3ef" stop-opacity=".15"/><stop offset=".5" stop-color="#f4f3ef" stop-opacity=".085"/><stop offset=".8" stop-color="#f4f3ef" stop-opacity=".025"/><stop offset="1" stop-color="#f4f3ef" stop-opacity="0"/></radialGradient><radialGradient id="stage-contact-fill"><stop offset=".55" stop-color="#000" stop-opacity=".62"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
<filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation=".75"/></filter>
<filter id="glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.1" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="bloom" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="5"/></filter>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* MERRAN M–4. World: x lower-right, y lower-left, z up. The control panel rises 32 over 170 toward the back (10.7°);
panel parts use panel coordinates u (along x from x=20) and v (down the slope from y=80, z=58), n along its normal.
Part                         x        y      z      w     d     h
stand base plates (2)     40 / 258   -30     0     52    64     4
stand poles (2)           61 / 279    -3     4     11    11    32
stand top plates (2)      36 / 254   -34    36     60    72     4
isolation pads (2)        34 / 252   -36    40     64    76     3
monitor cabinets (2)      28 / 246   -40    43     76    84   124
woofers r26 (2)           40 / 258    44    63     52     0    52
tweeters r11 (2)          55 / 273    44   126     22     0    22
bass ports (2)            46 / 264    44    48     40     0     6
monitor cable            304..322  -42..76   1..70
desk feet (4)             26 / 262  84 / 254  0     16    12     4
left cheek                  12       76     4      8   196    59   top follows the slope +4
control panel               20       80    26    264   170    32   sloped, 173 along the slope
channel modules (4)       44+46i     80    26     46   170    32   u 24+46i, v 2..171
  knobs gain/hi/mid/lo/pan   r6 × 6 at v 19 / 36 / 51 / 66 / 82
  mute / solo keys          u0+5 / u0+26, v 92: 15 × 9 × 2.6
  scribble tape             u0+3, v 104: 40 × 8
  fader lane + cap          u0+16.5, v 116: 3 × 52; cap 13 × 8 × 6.5, 44 travel
  LED meter (12 segments)   u0+33, v 116: 4 × 52
master module              230       80    26     52   170    32   u 210..262
  phones / monitor knobs    r6 at v 27
  play key                  u 222, v 44: 28 × 14 × 3.2
  tempo display             u 214, v 64: 44 × 15
  master fader              u 229.5, v 116: cap 15 × 9 × 7
meter bridge               230       80    55     52    16    49   sits on the panel's back edge
armrest                     20      250     4    264    22    24
right cheek                284       76     4      8   196    59
side I/O plate             292      262    10      0    40    16
*/
// Isometric engine: affine face planes, solids, round parts, grille and fit.
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Sloped panel plane: any face from an origin and two world vectors; panel solids and cylinders stand on its normal.
const TH=Math.atan2(32,170),cs=Math.cos(TH),sn=Math.sin(TH),X=[1,0,0],F=[0,cs,-sn],N=[0,sn,cs],neg=a=>a.map(c=>-c);
const W=(u,v,n=0)=>[20+u,80+v*cs+n*sn,58-v*sn+n*cs];
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`;
const PANEL=(n=0)=>plane(W(0,0,n),X,F);
const[pa,pb]=P(...X),[pc,pd]=P(...F),[pn,pm]=P(...N),pdet=pa*pd-pb*pc,NU=(pd*pn-pc*pm)/pdet,NV=(pa*pm-pb*pn)/pdet;
function scyl(g,u,v,r,h,cls='',z=0){
u+=NU*z;v+=NV*z;const du=NU*h,dv=NV*h,l=Math.hypot(du,dv)||1,tx=-dv*r/l,ty=du*r/l;
el('path',{d:`M${u+tx},${v+ty}A${r},${r} 0 0 1 ${u-tx},${v-ty}L${u+du-tx},${v+dv-ty}A${r},${r} 0 0 1 ${u+du+tx},${v+dv+ty}Z`,class:'face side '+cls},g);
return circle(g,u+du,v+dv,r,'face top '+cls);
}
function sbox(u,v,w,l,h,r=2,cls='',parent=root){
const g=el('g',{},parent);
rect(el('g',{transform:plane(W(u+w,v+l,h),neg(F),neg(N))},g),0,0,l,h,r,'face side '+cls);
rect(el('g',{transform:plane(W(u,v+l,h),X,neg(N))},g),0,0,w,h,r,'face '+cls);
rect(el('g',{transform:plane(W(u,v,h),X,F)},g),0,0,w,l,r,'face top '+cls);return g;
}
function rpath(pts,r=3){
const p=pts.map(q=>P(...q)),n=p.length;let d='';
for(let i=0;i<n;i++){const b=p[i],cut=a=>{const L=Math.hypot(a[0]-b[0],a[1]-b[1]),k=Math.min(r,L/2)/L;return[b[0]+(a[0]-b[0])*k,b[1]+(a[1]-b[1])*k];};
d+=(i?'L':'M')+cut(p[(i+n-1)%n])+'Q'+b+' '+cut(p[(i+1)%n]);}
return d+'Z';
}
const facePath=(pts,cls='',r=3)=>el('path',{d:rpath(pts,r),class:'face '+cls});
// Assembly, back to front: shadows, stands and monitors, the right monitor's cable, then the desk.
for(const[x,y,rx,ry]of[[152,176,212,74],[66,2,48,22],[284,2,48,22]]){const s=P(x,y,0);el('ellipse',{cx:s[0],cy:s[1]+3,rx,ry,class:'shadow stage-floor'});el('ellipse',{cx:s[0],cy:s[1]+3,rx,ry,class:'stage-contact'});}
const cones=[],monLeds=[],beatLeds=[],strips=[];
function monitor(x,cable){
box(x+12,-30,0,52,64,4,3,'base');
if(cable){const c=[[x+58,-41,66],[x+62,-42,40],[x+64,-43,6],[x+70,-38,1],[x+82,-20,1],[x+86,14,1],[x+80,46,1],[x+62,70,1],[x+40,82,1]];wire(c,'cable-under');wire(c,'cable');}
cylinder(x+38,2,4,5.5,32,'z','base');
box(x+8,-34,36,60,72,4,3,'base');box(x+6,-36,40,64,76,3,2,'pad');box(x,-40,43,76,84,124,8);
const sd=group(SIDE(x+76,44,167));line(sd,7,7,7,117);screw(sd,13,11);screw(sd,13,113);
const f=group(FRONT(x,44,167));rect(f,4,4,68,116,6,'face base');text(f,38,11.6,'MERRAN','etch center');
const tw=group('translate(38 28)',f);circle(tw,0,0,11.5,'face recess');circle(tw,0,0,8.5,'detail');circle(tw,0,0,5.5,'face top');circle(tw,0,0,1.6,'detail');
const wf=group('translate(38 74)',f);circle(wf,0,0,27,'face');circle(wf,0,0,23,'face recess');
for(let k=0;k<4;k++){const a=Math.PI/4+k*Math.PI/2;screw(wf,Math.cos(a)*25,Math.sin(a)*25);}
const cone=el('g',{},wf);circle(cone,0,0,20.5,'face cone');circle(cone,0,0,14,'detail');circle(cone,0,0,7,'face cap top');cones.push(cone);
rect(f,22,106,32,7,3.5,'face recess');monLeds.push(circle(f,62,110,1.4,'led'));
}
monitor(28,false);monitor(246,true);
// Desk: feet, left cheek, sloped panel with five modules, meter bridge, armrest, right cheek.
for(const[x,y]of[[26,84],[262,84],[26,254],[262,254]])box(x,y,0,16,12,4,2,'recess');
const SL=170/cs;
function cheek(x){
facePath([[x+8,272,4],[x+8,272,30],[x+8,250,30],[x+8,76,62.75],[x+8,76,4]],'side',2.5);
rect(group(plane([x,76,62.75],X,F)),0,0,8,174/cs,2,'face top');rect(group(TOP(x,250,30)),0,0,8,22,2,'face top');
const fr=group(FRONT(x,272,30));rect(fr,0,0,8,26,2,'face');return fr;
}
cheek(12);
rect(group(PANEL()),0,0,264,SL,3,'face top');
const lg=group(PANEL());rect(lg,.6,2,22.8,169,2.5,'face top');
['GAIN','HI','MID','LO','PAN'].forEach((t,k)=>text(lg,20.5,[19,36,51,66,82][k]+1.2,t,'etch end'));
el('path',{d:'M11,30 H9 V72 H11',class:'detail'},lg);
text(lg,0,0,'MERRAN','label brand center').setAttribute('transform','translate(13 143) rotate(-90)');text(lg,0,0,'M–4','etch center').setAttribute('transform','translate(18.6 143) rotate(-90)');
const NAMES=['KICK','BASS','PAD','HATS'],ROWS=[19,36,51,66,82],KN=[[.3,-.2,-.5,.45,0],[.5,-.6,0,.25,0],[.1,.3,-.2,-.5,-.35],[.6,.45,0,-.8,.4]];
const FV=116,TR=44,DBT=[[0,-90],[.06,-60],[.2,-40],[.33,-30],[.47,-20],[.6,-10],[.68,-5],[.76,0],[.88,5],[1,10]];
const dbOf=p=>{for(let k=1;k<DBT.length;k++)if(p<=DBT[k][0]){const[a,b]=DBT[k-1],[c,d]=DBT[k];return b+(d-b)*(p-a)/(c-a);}return 10;};
const posOf=db=>{for(let k=1;k<DBT.length;k++)if(db<=DBT[k][1]){const[a,b]=DBT[k-1],[c,d]=DBT[k];return a+(c-a)*(db-b)/(d-b);}return 1;};
const vOf=p=>FV+4+(1-p)*TR;
function knob(g,u,v,val,r=6){
for(let k=0;k<5;k++){const a=(-150+k*75)*Math.PI/180;line(g,u+Math.sin(a)*(r+1.1),v-Math.cos(a)*(r+1.1),u+Math.sin(a)*(r+2.4),v-Math.cos(a)*(r+2.4));}
scyl(g,u,v,r,1.4,'base');const t=scyl(g,u,v,r*.74,4.6,'cap',1.4),x=+t.getAttribute('cx'),y=+t.getAttribute('cy'),a=val*150*Math.PI/180;
line(g,x+Math.sin(a)*1.2,y-Math.cos(a)*1.2,x+Math.sin(a)*r*.66,y-Math.cos(a)*r*.66,'detail index');
}
function key(u,v,w,l,h,label,aria,led){
const g=el('g',{class:'control',role:'button',tabindex:'0','aria-pressed':'false','aria-label':aria});
rect(group(PANEL(),g),u-1.8,v-1.8,w+3.6,l+3.6,2.6,'focus-ring');
const press=el('g',{class:'press'},g);sbox(u,v,w,l,h,1.6,'',press);const top=group(PANEL(h),press);
const lamp=rect(top,u+w/2-3,v+1.3,6,1.7,.6,'led '+led);if(label)text(top,u+w/2,v+l-1.6,label,'label center');
return{g,lamp,top};
}
function fader(i,u,w,l,h){
const g=el('g',{class:'slider',role:'slider',tabindex:'0','aria-orientation':'vertical','aria-valuemin':'0','aria-valuemax':'100','aria-label':i<4?`Channel ${i+1} fader, ${NAMES[i].toLowerCase()}`:'Master fader','data-ch':i});
rect(group(PANEL(),g),u-9,FV-4,18,60,3,'hit');
const cap=el('g',{class:i<4?'':'master-cap'},g);sbox(u-w/2,FV+4-l/2,w,l,h,1.6,'cap',cap);
const t=group(PANEL(h),cap),v=FV+4;line(t,u-w/2+1.4,v,u+w/2-1.4,v,'detail index');line(t,u-w/2+2,v-l/2+1.5,u+w/2-2,v-l/2+1.5);line(t,u-w/2+2,v+l/2-1.5,u+w/2-2,v+l/2-1.5);
rect(group(PANEL(),g),u-w/2-2,FV-2,w+4,56,3,'focus-ring');
return{g,cap};
}
let segL=[],segR=[],playKey;
function bridge(){
const yF=W(0,16)[1],zF=W(0,16)[2];
facePath([[282,yF,zF],[282,yF,104],[282,80,104],[282,80,58]],'side',2);
rect(group(TOP(230,80,104)),0,0,52,yF-80,2.5,'face top');
const b=group(FRONT(230,yF,104));rect(b,0,0,52,104-zF,2.5,'face');
for(const p of[[3.5,3.5],[48.5,3.5],[3.5,45.5],[48.5,45.5]])screw(b,...p);
text(b,26,5.6,'MAIN MIX','etch center micro');rect(b,6,8,40,32,2,'face recess');rect(b,8,10,36,28,1.5,'face glass');
for(let k=0;k<14;k++){const y=12+k*1.78,c=k<2?'seg hot':'seg';segL.unshift(rect(b,13,y,6,1.25,.3,c));segR.unshift(rect(b,33,y,6,1.25,.3,c));}
for(const[k,t]of[[0,'0'],[3,'6'],[5,'12'],[7,'18'],[10,'30'],[13,'48']])text(b,26,12+k*1.78+1.1,t,'etch micro center');
text(b,16,44.5,'L','label center micro');text(b,36,44.5,'R','label center micro');
}
const DEF=[-4,-3,-6,-5,-2];
for(let i=0;i<5;i++){
const m=i===4,u0=m?210:24+46*i,w=m?52:46,lane=m?236:u0+18,sg=group(PANEL(),root,{'data-ch':i});
rect(sg,u0+.6,2,w-1.2,169,2.5,'face top');
for(const[a,b]of[[u0+4,5.5],[u0+w-4,5.5],[u0+4,167.5],[u0+w-4,167.5]])screw(sg,a,b);
rect(sg,u0+2.2,3.2,w-4.4,166.6,2,'sel');
for(const[db,t]of[[10,'10'],[5,'5'],[0,'0'],[-5,'5'],[-10,'10'],[-20,'20'],[-30,'30'],[-40,'40'],[-90,'∞']]){const v=vOf(posOf(db)),z=db===0?1.4:0;line(sg,lane-4.6-z,v,lane-2.4,v);text(sg,lane-5.4-z,v+.9,t,'etch micro end');}
rect(sg,lane-1.5,FV,3,52,1.5,'face recess');line(sg,lane,FV+2,lane,FV+50);
const segs=[];if(!m)for(let k=0;k<12;k++)segs.unshift(rect(sg,u0+33,FV+1+k*4.25,4,3.1,.6,k<2?'seg hot':'seg'));
rect(sg,u0+3,104,w-6,8,1,'face paper');text(sg,u0+w/2,110.2,m?'MIX':NAMES[i],'hand');
const s={i,m,sg,segs,p:posOf(DEF[i]),drawn:-1,mute:false,solo:false,level:-90,hold:-90,holdT:0};s.shown=s.p;
if(!m){
text(sg,u0+23,7.4,i+1,'label num center');ROWS.forEach((v,k)=>knob(sg,u0+23,v,KN[i][k]));
s.mu=key(u0+5,92,15,9,2.6,'M',`Mute channel ${i+1} (M)`,'warm');s.so=key(u0+26,92,15,9,2.6,'S',`Solo channel ${i+1} (S)`,'');
}else{
text(sg,236,100,'MASTER','label center num');text(sg,223,37.8,'PHONES','etch micro center');text(sg,249,37.8,'MON','etch micro center');text(sg,236,62.4,'PLAY / STOP','etch micro center');
rect(sg,214,66,44,14,2.5,'face recess');rect(sg,216,68,40,10,1.5,'face glass');text(sg,219,74.7,'84 BPM','screen');for(let k=0;k<4;k++)beatLeds.push(circle(sg,243.5+k*3.6,73,1,'led'));
circle(sg,254,121,1.1,'led on');text(sg,254,126.2,'PWR','etch micro center');
bridge();const kg=group(PANEL(),root,{'data-ch':4});knob(kg,223,27,.1);knob(kg,249,27,-.25);
playKey=key(222,44,28,14,3.2,'','Play or stop (Space)','play-led');
el('path',{d:'M229.5,49.2 L234.6,52.2 L229.5,55.2 Z',class:'icon'},playKey.top);rect(playKey.top,238,49.4,5.6,5.6,.6,'icon');
}
Object.assign(s,fader(i,lane,m?15:13,m?9:8,m?7:6.5));strips.push(s);
}
box(20,250,4,264,22,24,8,'pad');wire([[28,254.5,28],[276,254.5,28]],'detail stitch');
cheek(284);
const io=group(SIDE(292,266,25));rect(io,0,0,34,12,3,'face recess');circle(io,9,6,3.6,'face base');circle(io,9,6,1.6,'face glass');rect(io,20,3.5,9,5,1.4,'face base');line(io,24.5,4.6,24.5,7.4);
text(io,9,16.6,'PHONES','etch micro center');text(io,24.5,16.6,'DC 12 V','etch micro center');
frame([[12,76,0,280,196,63],[28,-40,0,76,84,167],[246,-40,0,76,84,167],[230,80,55,52,16,49]],26);
// State: selection, faders, mute/solo, transport. Web Audio is created by the first gesture; space starts the mix.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const[fx,fy]=P(...F),TH12=[-42,-36,-30,-26,-22,-18,-15,-12,-9,-6,-3,0],TH14=[-48,-42,-36,-30,-26,-22,-18,-15,-12,-9,-6,-4,-2,0];
const CH=[[146.83,174.61,220,329.63],[116.54,146.83,174.61,220],[174.61,220,261.63,329.63],[130.81,164.81,196,293.66]],ROOT=[73.42,58.27,87.31,65.41];
let sel=0,playing=false,ac=null,master,anL,anR,bufL,bufR,timer=0,nextT=0,step=0,beatQ=[],runs=[],bassEnv,padEnv,padOsc=[],bassOsc=[],noise,hatBus;
const mL={level:-90,hold:-90,holdT:0},mR={level:-90,hold:-90,holdT:0};
const say=t=>{announcement.textContent=t;};
const fmt=p=>{if(p<.015)return'−∞';const d=Math.round(dbOf(p));return(d>0?'+':d<0?'−':'')+Math.abs(d);};
const gainOf=p=>p<.015?0:Math.pow(10,dbOf(p)/20);
const anySolo=()=>strips.some(s=>s.solo);
const audible=s=>!s.mute&&(!anySolo()||s.solo);
function mix(){if(!ac)return;const t=ac.currentTime;strips.forEach(s=>(s.m?master:s.fad).gain.setTargetAtTime(gainOf(s.p)*(s.m||audible(s)?1:0),t,.015));}
function audioInit(){
if(ac)return;const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
try{
ac=new A();const out=ac.createGain();out.gain.value=.35;out.connect(ac.destination);
master=ac.createGain();master.connect(out);const sp=ac.createChannelSplitter(2);master.connect(sp);
anL=ac.createAnalyser();anR=ac.createAnalyser();anL.fftSize=anR.fftSize=512;sp.connect(anL,0);sp.connect(anR,1);bufL=new Float32Array(512);bufR=new Float32Array(512);
strips.forEach((s,i)=>{if(s.m)return;s.inp=ac.createGain();s.fad=ac.createGain();s.an=ac.createAnalyser();s.an.fftSize=512;s.buf=new Float32Array(512);
const pn=ac.createStereoPanner();pn.pan.value=[0,0,-.35,.4][i];s.inp.connect(s.fad);s.fad.connect(s.an);s.an.connect(pn);pn.connect(master);});
const run=i=>{const g=ac.createGain();g.gain.value=0;g.connect(strips[i].inp);runs.push(g);return g;};
bassEnv=ac.createGain();bassEnv.gain.value=.24;const blp=ac.createBiquadFilter();blp.type='lowpass';blp.frequency.value=240;blp.Q.value=3;
for(const[type,mul,lvl]of[['triangle',1,1],['sine',2,.35]]){const o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=ROOT[0]*mul;g.gain.value=lvl;o.connect(g);g.connect(blp);o.start();bassOsc.push([o,mul]);}
blp.connect(bassEnv);bassEnv.connect(run(1));
padEnv=ac.createGain();padEnv.gain.value=.05;const plp=ac.createBiquadFilter();plp.type='lowpass';plp.frequency.value=1300;
for(let k=0;k<4;k++){const o=ac.createOscillator();o.type='triangle';o.frequency.value=CH[0][k];o.detune.value=k%2?5:-5;o.connect(plp);o.start();padOsc.push(o);}
plp.connect(padEnv);padEnv.connect(run(2));
noise=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const d=noise.getChannelData(0);for(let k=0;k<d.length;k++)d[k]=Math.random()*2-1;
hatBus=ac.createBiquadFilter();hatBus.type='highpass';hatBus.frequency.value=7000;hatBus.connect(strips[3].inp);
mix();
}catch(_){ac=null;}
}
function kick(t,v){
const o=ac.createOscillator(),g=ac.createGain();o.frequency.setValueAtTime(118,t);o.frequency.exponentialRampToValueAtTime(44,t+.13);
g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.7*v,t+.004);g.gain.exponentialRampToValueAtTime(.001,t+.42);o.connect(g);g.connect(strips[0].inp);o.start(t);o.stop(t+.45);
bassEnv.gain.setTargetAtTime(.1,t,.012);bassEnv.gain.setTargetAtTime(.24,t+.07,.16);
}
function hat(t,v){
const src=ac.createBufferSource(),g=ac.createGain();src.buffer=noise;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.3*v,t+.002);g.gain.exponentialRampToValueAtTime(.001,t+.055);
src.connect(g);g.connect(hatBus);src.start(t,Math.random()*.8,.08);
}
function schedule(){
while(nextT<ac.currentTime+.12){
const t=nextT,s=step%64,b=s%16;
if(s%4===0){kick(t,b===0?1:.78);beatQ.push([t,(s/4)%4]);}
if(s%2===0)hat(t,s%4===2?.9:.4);else if(b===7||b===15)hat(t,.25);
if(b===0){const c=s/16;padOsc.forEach((o,k)=>o.frequency.setTargetAtTime(CH[c][k],t,.09));bassOsc.forEach(([o,mul])=>o.frequency.setTargetAtTime(ROOT[c]*mul,t,.05));padEnv.gain.setTargetAtTime(.025,t,.04);padEnv.gain.setTargetAtTime(.05,t+.12,.5);}
nextT+=60/84/4;step++;
}
}
function ui(){
const s=strips[sel];
readout.textContent=`${s.m?'MASTER':'CH '+(sel+1)} · ${fmt(s.p)} dB · ${playing?'PLAYING':'STOPPED'}`;
stateLabel.textContent=s.m?`STEREO BUS · ${anySolo()?'SOLO ACTIVE':'84 BPM'}`:[NAMES[sel],s.mute&&'MUTED',s.solo&&'SOLO',!s.mute&&!s.solo&&(anySolo()?'SOLO-MUTED':'LIVE')].filter(Boolean).join(' · ');
for(const t of strips){
t.sg.classList.toggle('selected',t.i===sel);t.g.classList.toggle('selected',t.i===sel);set(t.g,'aria-valuenow',Math.round(t.p*100));set(t.g,'aria-valuetext',fmt(t.p)+' dB');
if(t.m)continue;
for(const[k,on]of[[t.mu,t.mute],[t.so,t.solo]]){k.lamp.classList.toggle('on',on);k.g.classList.toggle('latched',on);set(k.g,'aria-pressed',on);}
}
playKey.lamp.classList.toggle('on',playing);playKey.g.classList.toggle('latched',playing);set(playKey.g,'aria-pressed',playing);
svg.classList.toggle('playing',playing);svg.classList.toggle('ready',!playing);monLeds.forEach(l=>l.classList.toggle('on',!!ac));
}
const blip=k=>{k.g.classList.add('pressed');setTimeout(()=>k.g.classList.remove('pressed'),130);};
function select(i,quiet){audioInit();if(sel!==i){sel=i;if(!quiet)say(i<4?`Channel ${i+1}, ${NAMES[i].toLowerCase()}, ${fmt(strips[i].p)} dB.`:`Master, ${fmt(strips[4].p)} dB.`);}ui();}
function setP(s,p){s.p=Math.max(0,Math.min(1,p));mix();ui();}
function nudge(d){const s=strips[sel];audioInit();setP(s,s.p+d*.025);clearTimeout(nudge.t);nudge.t=setTimeout(()=>say(`${s.m?'Master':'Channel '+(sel+1)} ${fmt(s.p)} dB.`),450);}
function toggle(kind){
const s=strips[sel];if(s.m){say('Pick a channel with 1 to 4 to mute or solo.');return;}
audioInit();s[kind]=!s[kind];blip(kind==='mute'?s.mu:s.so);mix();ui();say(`Channel ${sel+1} ${kind} ${s[kind]?'on':'off'}.`);
}
function togglePlay(){
audioInit();playing=!playing;blip(playKey);
if(ac){const t=ac.currentTime;
if(playing){if(ac.state==='suspended')ac.resume().catch(()=>{});nextT=t+.08;step=0;schedule();clearInterval(timer);timer=setInterval(schedule,25);runs.forEach(g=>g.gain.setTargetAtTime(1,t,.25));}
else{clearInterval(timer);beatQ=[];runs.forEach(g=>{g.gain.cancelScheduledValues(t);g.gain.setTargetAtTime(0,t,.12);});}}
if(!playing)beatLeds.forEach(d=>d.classList.remove('on'));
ui();say(playing?'Playing at 84 BPM.':'Stopped.');
}
function meter(an,buf,o,segs,th,dt,now){
an.getFloatTimeDomainData(buf);let pk=0;for(let k=0;k<buf.length;k+=2)pk=Math.max(pk,Math.abs(buf[k]));
const db=20*Math.log10(pk+1e-6);o.level=Math.max(db,o.level-dt*30);
if(db>=o.hold){o.hold=db;o.holdT=now+900;}else if(now>o.holdT)o.hold=Math.max(o.level,o.hold-dt*40);
const n=th.filter(x=>o.level>=x).length,h=th.filter(x=>o.hold>=x).length;
if(n!==o.n||h!==o.h){o.n=n;o.h=h;segs.forEach((g,k)=>g.classList.toggle('on',k<n||k===h-1));}
return o.level;
}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)fn();}});}
for(const s of strips){
if(!s.m){bind(s.mu.g,()=>{select(s.i,true);toggle('mute');});bind(s.so.g,()=>{select(s.i,true);toggle('solo');});}
const localV=e=>{const q=new DOMPoint(e.clientX,e.clientY).matrixTransform(svg.getScreenCTM().inverse()),o=P(...W(0,0,0));return(pa*(q.y-o[1])-pb*(q.x-o[0]))/pdet;};
s.g.addEventListener('pointerdown',e=>{
e.preventDefault();s.g.focus({preventScroll:true});select(s.i);const v=localV(e);
if(!s.cap.contains(e.target))setP(s,1-(v-FV-4)/TR);
s.drag={v0:v,p0:s.p,live:false};s.g.setPointerCapture(e.pointerId);s.g.classList.add('dragging');
});
s.g.addEventListener('pointermove',e=>{if(s.drag){s.drag.live=true;setP(s,s.drag.p0-(localV(e)-s.drag.v0)/TR);}});
const end=()=>{if(!s.drag)return;s.drag=null;s.g.classList.remove('dragging');say(`${s.m?'Master':'Channel '+(s.i+1)} ${fmt(s.p)} dB.`);};
s.g.addEventListener('pointerup',end);s.g.addEventListener('pointercancel',end);s.g.addEventListener('focus',()=>select(s.i,true));
}
bind(playKey.g,togglePlay);
svg.addEventListener('click',e=>{const t=e.target.closest('[data-ch]');if(t)select(+t.dataset.ch);});
document.addEventListener('keydown',e=>{
if(e.defaultPrevented||e.ctrlKey||e.metaKey||e.altKey)return;
const k=e.key,inSlider=document.activeElement&&document.activeElement.classList&&document.activeElement.classList.contains('slider');
if(k===' '){e.preventDefault();if(!e.repeat)togglePlay();}
else if(/^[1-4]$/.test(k)){e.preventDefault();select(+k-1);if(inSlider)strips[+k-1].g.focus();}
else if(k==='ArrowUp'||k==='ArrowDown'||inSlider&&(k==='ArrowRight'||k==='ArrowLeft')){e.preventDefault();nudge(k==='ArrowUp'||k==='ArrowRight'?1:-1);}
else if(!e.repeat&&(k==='m'||k==='M')){e.preventDefault();toggle('mute');}
else if(!e.repeat&&(k==='s'||k==='S')){e.preventDefault();toggle('solo');}
});
let last=performance.now(),cl=0,cr=0;
function tick(now){
const dt=Math.min(.1,(now-last)/1000);last=now;
for(const s of strips){
if(reduced.matches||s.drag&&s.drag.live)s.shown=s.p;else s.shown+=(s.p-s.shown)*(1-Math.exp(-dt*16));
if(Math.abs(s.shown-s.drawn)>.0004){s.drawn=s.shown;const k=(1-s.shown)*TR;set(s.cap,'transform',`translate(${(fx*k).toFixed(2)} ${(fy*k).toFixed(2)})`);}
}
if(ac){
for(const s of strips)if(!s.m)meter(s.an,s.buf,s,s.segs,TH12,dt,now);
const l=meter(anL,bufL,mL,segL,TH14,dt,now),r=meter(anR,bufR,mR,segR,TH14,dt,now);
if(!reduced.matches){
cl=Math.max(Math.max(0,Math.min(1,(l+30)/26)),cl-dt*5);cr=Math.max(Math.max(0,Math.min(1,(r+30)/26)),cr-dt*5);
[cl,cr].forEach((e,k)=>set(cones[k],'transform',`translate(${(-e*1.4).toFixed(2)} ${(e*1.4).toFixed(2)}) scale(${(1+e*.025).toFixed(3)})`));
}
while(beatQ.length&&beatQ[0][0]<=ac.currentTime){const b=beatQ.shift()[1];beatLeds.forEach((d,k)=>d.classList.toggle('on',k===b));}
}
requestAnimationFrame(tick);
}
ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], sharedDefs: false, draw }
