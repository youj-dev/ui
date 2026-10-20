// @ts-nocheck
/* AVOCET HX–2 · Mirrorless camera. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--chrome:#d9dad8;--chrome-top:#f4f4f2;--chrome-side:#bdbebc;--hov:#fff;--lea:#383735;--lea-s:#2c2b29;--peb:#4b4947;--peb-s:#3d3b39;--lens:#2c2c2c;--lens-top:#3d3d3d;--lens-side:#232323;--rib:#5c5c5c;--eng:#2a2a2a;--wht:#efefed;--org:#e8742a;--lcd:#ffb648;--led:#36d886;--strap:#7b5034;--strap-top:#94623f;--stitch:#ead9b6;--g1:#5a64a0;--g2:#1c2034;--g3:#2f5c48;--g4:#0e1014;--off:#b3b3af}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--chrome:#b7b7b6;--chrome-top:#e4e4e2;--chrome-side:#858585;--hov:#efefef;--lea:#2d2d2b;--lea-s:#1c1b1b;--peb:#3d3c3b;--peb-s:#282726;--lens:#232323;--lens-top:#383838;--lens-side:#151515;--rib:#4c4c4c;--eng:#222222;--wht:#c9c9c8;--org:#c36122;--lcd:#ffb648;--led:#36d886;--strap:#67422a;--strap-top:#8a5b3a;--stitch:#c5b799;--g1:#4b5386;--g2:#16192a;--g3:#264c3b;--g4:#0a0c0e;--off:#969694;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:5px;letter-spacing:1.6px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.end{text-anchor:end}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.lens{fill:var(--lens)}.top.lens{fill:var(--lens-top)}.side.lens{fill:var(--lens-side)}.lea{fill:url(#peb)}.strapc{fill:var(--strap)}.top.strapc{fill:var(--strap-top)}.lea.side{fill:url(#pebS)}
.knurl{fill:none;stroke:var(--line);stroke-width:.35;opacity:.6;pointer-events:none}.rib{fill:none;stroke:var(--rib);stroke-width:.9;pointer-events:none}.idx{fill:none;stroke:var(--wht);stroke-width:.7;stroke-linecap:round}
.eng{fill:var(--eng);font:600 1.8px system-ui,sans-serif;stroke:none}.wht{fill:var(--wht);font:500 2px system-ui,sans-serif;stroke:none}.org{fill:var(--org)}.dot{fill:var(--org);stroke:none}
.lg{fill:url(#coat);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.gring{fill:none;stroke:#8fa0d8;stroke-width:.35;opacity:.35}.glint{fill:none;stroke:#fff;stroke-width:1;stroke-linecap:round;opacity:.55}.glint2{fill:none;stroke:#b07cff;stroke-width:.8;stroke-linecap:round;opacity:.45}.spark{fill:#fff;opacity:.8}
.lcdg{fill:#16130e}.lcdt{fill:var(--lcd);font:600 3.6px ui-monospace,monospace;letter-spacing:.3px;filter:url(#glow);opacity:0}.lhalo{fill:var(--lcd);opacity:0;filter:url(#bloom)}
.hud{fill:#fff;font:600 2.5px ui-monospace,monospace;stroke:none;opacity:.94}.af{fill:none;stroke:#fff;stroke-width:.45;stroke-linecap:round}.af.ok{stroke:#4be08a}.mt{fill:none;stroke:#fff;stroke-width:.3;opacity:.85}.sheen{fill:#fff;opacity:.07;pointer-events:none}
.lamp{fill:#2a1a10}.lamp.on{fill:#ff9b3d;filter:url(#glow)}.halo{opacity:0;filter:url(#bloom);pointer-events:none}.led{fill:var(--off)}.led.on{fill:var(--led);filter:url(#glow)}
.st{fill:none;stroke:var(--stitch);stroke-width:.5;stroke-dasharray:1.4 1.1;opacity:.8}.ring{fill:none;stroke:var(--chrome-top);stroke-width:1.1}.ring-u{fill:none;stroke:var(--line);stroke-width:2.2}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .top.chrome{fill:var(--hov)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<filter id="fgB" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="0"/></filter>
<filter id="bgB" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="0"/></filter>
<filter id="tbB" x="-20%" y="-40%" width="140%" height="180%"><feGaussianBlur stdDeviation="0"/></filter>
<filter id="lb" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation=".22"/></filter>
<pattern id="peb" width="1.7" height="1.5" patternUnits="userSpaceOnUse"><rect width="1.7" height="1.5" style="fill:var(--lea)"/><circle cx=".45" cy=".4" r=".32" style="fill:var(--peb)"/><circle cx="1.3" cy="1.15" r=".28" style="fill:var(--peb)"/></pattern>
<pattern id="pebS" width="1.7" height="1.5" patternUnits="userSpaceOnUse"><rect width="1.7" height="1.5" style="fill:var(--lea-s)"/><circle cx=".45" cy=".4" r=".32" style="fill:var(--peb-s)"/><circle cx="1.3" cy="1.15" r=".28" style="fill:var(--peb-s)"/></pattern>
<radialGradient id="coat" cx=".42" cy=".38" r=".62"><stop offset="0" style="stop-color:var(--g1)"/><stop offset=".45" style="stop-color:var(--g2)"/><stop offset=".82" style="stop-color:var(--g3)"/><stop offset="1" style="stop-color:var(--g4)"/></radialGradient>
<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1a3f"/><stop offset=".38" stop-color="#5b3d78"/><stop offset=".62" stop-color="#c9637a"/><stop offset=".72" stop-color="#f3a165"/><stop offset="1" stop-color="#f6b878"/></linearGradient>
<clipPath id="dclip"><rect width="72" height="48" rx=".8"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* AVOCET HX–2 mirrorless camera. World: x lower-right; y lower-left (the lens faces +y); z up. 1 unit = 1 mm.
Part x y z w d h
base plate 3 3 0 138 34 4
body (leatherette band) 0 0 4 144 40 64
top plate 0 0 68 144 40 16
eyecup (behind the hump) 56 −7 85 32 10 17
prism hump 46–98 3 84 52 31 20 (top 52–92; chamfer y 28–34, z 97–104)
hot shoe 63 7 104 18 16 3
ISO dial + ring 24 19 84 r13/15 – 10.4
shutter-speed dial + ring 113.5 16 84 r13.5/14.5 – 11.6
exposure-comp dial 135.5 9.5 84 r8 – 6
top LCD 102 32 84 19 7 0
power collar + shutter button 132 30 84 r6/4.2 – 2/3
front command dial 125 40 71 12 2 5.5
lens: mount, aperture ring, barrel, distance ring, focus grip, front 70 40–81.5 37 r29.5–31.5 41.5 –
AF lamp, lens release, Fn ×2 108–118 40 15–58 r2–3.2 – –
strap lug + ring 144 17 72 2.5 6 8
lug protector 147.4 15.4–24.6 57.6 0 9.2 11
vari-angle screen (hinge x 140.5 y −4.5) 140.5 −4.5 10 80 4 54 (swings 0–180°)
Leatherette, engravings, screws and labels share their parent face. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: tangent planes, knurled bands, controls.
const draw=root,into=g=>root=g,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),TAU=Math.PI*2;
const plane=(o,U,V)=>`matrix(${P(...U).map(f2).join(' ')} ${P(...V).map(f2).join(' ')} ${P(...o).map(f2).join(' ')})`;
// Ridges on a cylinder (axis y or z) between a0 and a1; only the half that faces the viewer (n·(1,1,1)>0).
function ridges(c,axis,r,a0,a1,n,ph){let d='';for(let i=0;i<n;i++){const t=i/n*TAU+ph,co=Math.cos(t),sn=Math.sin(t);if(co+sn<.08)continue;const p=axis==='y'?[c[0]+r*co,0,c[2]+r*sn]:[c[0]+r*co,c[1]+r*sn,0],k=axis==='y'?1:2,A=[...p],B=[...p];A[k]=a0;B[k]=a1;const u=P(...A),v=P(...B);d+=`M${f2(u[0])},${f2(u[1])}L${f2(v[0])},${f2(v[1])}`;}return d;}
function button(g,label){set(g,'class','control');set(g,'role','button');set(g,'tabindex','0');set(g,'aria-label',label);return g;}
function bind(g,fn){g.addEventListener('click',e=>fn(e.shiftKey?-1:1));g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn(e.shiftKey?-1:1);}});}
const SH=[['B',2],['1',1],['2',1/2],['4',1/4],['8',1/8],['15',1/15],['30',1/30],['60',1/60],['125',1/125],['250',1/250],['500',1/500],['1000',1/1000],['2000',1/2000],['4000',1/4000]];
const ISO=[100,200,400,800,1600,3200,6400],AP=[2,2.8,4,5.6,8,11,16];
const LX=70,LZ=37;
// Shadow; the vari-angle screen sits behind the body, so it is drawn first.
const shp=P(84,34,0);el('ellipse',{cx:shp[0],cy:shp[1]+5,rx:132,ry:42,class:'shadow stage-floor'});el('ellipse',{cx:shp[0],cy:shp[1]+5,rx:132,ry:42,class:'stage-contact'});
const HX=140.5,HY=-4.5,PW=80,PH=54,PT=4,PZ=64;
const flipG=button(el('g'),'Vari-angle screen: flip it in or out (F)');
const panel=el('g',{},flipG),scrG=el('g',{},flipG);
rect(scrG,0,0,PW,PH,3,'face lens');rect(scrG,3.4,2.4,73.2,49.2,1.6,'face recess');
const SC=group('translate(4 3)',scrG);rect(SC,0,0,72,48,.8,'face glass').style.fill='#0b0c0e';
const IMG=el('g',{'clip-path':'url(#dclip)'},SC),LIVE=el('g',{},IMG);
el('rect',{width:72,height:48,fill:'url(#sky)'},LIVE);
const BG=el('g',{filter:'url(#bgB)'},LIVE);
el('ellipse',{cx:40,cy:32,rx:46,ry:8,fill:'#ffc27a',opacity:.4},BG);
[[0,7,13],[6,6,18],[11.5,8,10],[19,5,21],[23.5,9,15],[32,6,24],[37.5,8,12],[45,6,19],[50.5,10,14],[60,5,22],[64.5,8,11]].forEach(([x,w,h],i)=>{
el('rect',{x,y:33.6-h,width:w,height:h+1,fill:i%2?'#2f2549':'#3a2d58'},BG);
for(let k=0;k<h/3;k++)if((i*5+k*3)%4)el('rect',{x:x+1+(k*2.3)%(w-2),y:35.6-h+(k*4.7)%(h-3),width:.8,height:.9,fill:'#ffd387',opacity:.9},BG);});
const LTS=[[3,23.4],[9,26],[15,27.8],[21,29],[27,29.6],[45,29.4],[51,28.6],[57,27.2],[63,25.4],[69,23.2],[17,19],[55,17.5],[67,31.2],[5,30.6],[42,23]].map(([x,y],i)=>el('circle',{cx:x,cy:y,r:.6,fill:['#ffd27a','#ffb35c','#fff0c2','#ff8f6b'][i%4],filter:'url(#lb)'},LIVE));
const TB=el('g',{filter:'url(#tbB)'},LIVE);
el('rect',{y:33.4,width:72,height:15,fill:'#7c5236'},TB);el('rect',{y:33.4,width:72,height:.7,fill:'#b98457'},TB);
for(const[y,w]of[[37,.6],[40.5,-.8],[44.5,.5]])el('path',{d:`M0,${y} C20,${y+w} 50,${y-w} 72,${y+w*.5}`,fill:'none',stroke:'#664129','stroke-width':.35},TB);
const FG=el('g',{filter:'url(#fgB)'},LIVE);
el('ellipse',{cx:33.6,cy:44.3,rx:7.5,ry:1.2,fill:'#000',opacity:.28},FG);
el('path',{d:'M27.2,34 H40 L38.5,43.5 Q38.4,44.1 37.8,44.1 H29.4 Q28.8,44.1 28.7,43.5Z',fill:'#c4653b'},FG);el('path',{d:'M36.4,34 H40 L38.5,43.5 Q38.4,44.1 37.8,44.1 H35.6Z',fill:'#a8532f'},FG);
el('rect',{x:26.2,y:31.4,width:14.8,height:3.2,rx:.8,fill:'#da7b4b'},FG);
el('path',{d:'M30.6,24.6 H27.7 Q26,24.6 26,22.9 V18.6 Q26,17 27.5,17 Q29,17 29,18.6 V21.7 H30.6Z M36,21.5 H38.8 Q40.4,21.5 40.4,19.9 V14.4 Q40.4,12.8 38.9,12.8 Q37.4,12.8 37.4,14.4 V18.6 H36Z',fill:'#4a9454'},FG);
el('rect',{x:30,y:11.6,width:6.8,height:20.6,rx:3.3,fill:'#4e9a58'},FG);
for(const x of[31.8,33.4,35])el('path',{d:`M${x},13.4 V31`,stroke:'#3b7c45','stroke-width':.35},FG);
el('path',{d:'M31.1,14 V30',stroke:'#86c98c','stroke-width':.4},FG);
for(let k=0;k<14;k++)el('path',{d:`M${31.4+(k%4)*1.6},${14+k*1.25} l${k%2?.7:-.7},-.5`,stroke:'#f3f7e3','stroke-width':.2},FG);
circle(FG,33.4,11.1,1.7,'').style.fill='#ff6f9c';circle(FG,33.4,11.1,.6,'').style.fill='#ffd36b';
const EXP=el('rect',{width:72,height:48,opacity:0},IMG);
const HUD=el('g',{},IMG);
const hT=[text(HUD,2.5,4.6,'M','hud'),text(HUD,8,4.6,'','hud'),text(HUD,21,4.6,'','hud'),text(HUD,32,4.6,'','hud'),text(HUD,69.5,4.6,'','hud end')];
const afB=el('path',{d:'M27.5,15 v-2.4 h2.4 M39.2,12.6 h2.4 v2.4 M41.6,28.6 v2.4 h-2.4 M29.9,31 h-2.4 v-2.4',class:'af'},HUD);
rect(HUD,2.5,42.8,5,2.4,.4,'mt');rect(HUD,7.5,43.4,.6,1.2,.2,'mt');const bat=rect(HUD,3.1,43.4,3.4,1.2,.2,'');bat.style.fill='#fff';
const hMF=text(HUD,10,45.2,'','hud');line(HUD,31,44.4,49,44.4,'mt');for(let k=-3;k<=3;k++)line(HUD,40+k*3,k?43.6:42.9,40+k*3,44.4,'mt');
const ptr=el('path',{d:'M-1,-1.4 H1 L0,0Z',fill:'#fff'},HUD);const hLeft=text(HUD,69.5,45.2,'','hud end');
const splash=text(SC,36,26,'AVOCET','hud center');splash.style.cssText='font-size:4.4px;letter-spacing:1.4px;opacity:0';
const flash=el('rect',{width:72,height:48,fill:'#fff',opacity:0},SC),curtain=el('rect',{width:72,height:0,fill:'#050505'},SC);
el('path',{d:'M44,0 H58 L36,48 H22Z',class:'sheen'},SC);
rect(scrG,-1.6,-1.6,PW+3.2,PH+3.2,4,'focus-ring');
function drawFlip(a){
const r=a*Math.PI/180,c=Math.cos(r),s=Math.sin(r),U=[-c,-s,0],N=[s,-c,0];
const pt=(u,v,t)=>[HX+U[0]*u-N[0]*t,HY+U[1]*u-N[1]*t,PZ-v],F=(q,cls)=>el('path',{d:poly(q,true),class:'face '+cls},panel);
panel.textContent='';const disp=s-c>0;
if(!disp)F([pt(0,0,0),pt(PW,0,0),pt(PW,PH,0),pt(0,PH,0)],'lens');
if(-c-s>0)F([pt(PW,0,0),pt(PW,0,PT),pt(PW,PH,PT),pt(PW,PH,0)],'side lens');
if(c+s>0)F([pt(0,0,0),pt(0,0,PT),pt(0,PH,PT),pt(0,PH,0)],'side lens');
if(disp)F([pt(0,0,PT),pt(PW,0,PT),pt(PW,PH,PT),pt(0,PH,PT)],'lens');
F([pt(0,0,0),pt(PW,0,0),pt(PW,0,PT),pt(0,0,PT)],'top lens');
scrG.style.display=disp?'':'none';if(disp)set(scrG,'transform',plane(pt(0,0,0),U,[0,0,-1]));
}
for(const z of[54,14])cylinder(HX,HY,z,2.3,6,'z','lens');
// Body: base plate, leatherette band, side ports, strap lug.
box(3,3,0,138,34,4,1.5,'base');
box(0,0,4,144,40,64,3,'chrome');
const bf=group(FRONT(0,40,68));rect(bf,2.5,3,139,58,2,'face lea');
const bs=group(SIDE(144,40,68));rect(bs,2.5,3,35,58,2,'face side lea');
rect(bs,8,9,21,25,2.2,'face lens');line(bs,8.8,21.5,28.2,21.5);rect(bs,13,13,7,2.6,1,'detail');rect(bs,13.6,26,5.8,2.4,1.2,'detail');circle(bs,24,14.3,1.1,'detail');
for(const[u,v]of[[5,57],[33,57]])screw(bs,u,v);
// Top plate, eyecup, hump, hot shoe.
box(0,0,68,144,40,16,3,'chrome');
const tf=group(FRONT(0,40,84));line(tf,3,1.6,141,1.6);text(tf,9,10.6,'HX–2','eng').style.fontSize='3.2px';
rect(tf,123.5,10.5,15,7.4,1.4,'face recess');box(125,40,71,12,2.2,5.6,1,'chrome');const cd=group(FRONT(125,42.2,76.6));for(let i=1;i<12;i++)line(cd,i,.6,i,5);
const ts=group(SIDE(144,40,84));const acc=circle(ts,30,8,.85,'led');
box(144,17,72,2.5,6,8,1.2,'chrome');circle(group(SIDE(146.5,23,80)),3,4,1.2,'face recess');
const ring=group(FRONT(148.6,20,72));circle(ring,0,0,3.1,'ring-u');circle(ring,0,0,3.1,'ring');
box(56,-7,85,32,10,17,4,'lens');{const e=group(TOP(56,-7,102));for(let i=0;i<5;i++)line(e,4,2+i*1.4,28,2+i*1.4);}
const hx=(z,R)=>R?98-6*(z-84)/20:46+6*(z-84)/20;
el('path',{d:poly([[98,3,84],[98,34,84],[hx(97,1),34,97],[92,28,104],[92,3,104]],true),class:'face side chrome'});
el('path',{d:poly([[46,34,84],[98,34,84],[hx(97,1),34,97],[hx(97,0),34,97]],true),class:'face chrome'});
el('path',{d:poly([[hx(97,0),34,97],[hx(97,1),34,97],[92,28,104],[52,28,104]],true),class:'face top chrome'});
el('path',{d:poly([[52,3,104],[92,3,104],[92,28,104],[52,28,104]],true),class:'face top chrome'});
const hf=group(FRONT(0,34,97));text(hf,72,8.6,'AVOCET','label brand center').style.fill='var(--eng)';
for(const u of[53,89])for(let k=0;k<3;k++)circle(hf,u+(k-1)*1.4,10.6,.35,'face recess');
box(63,7,104,18,16,1.4,.6,'base');box(63,7,105.4,1.8,16,1.4,.3,'chrome');box(79.2,7,105.4,1.8,16,1.4,.3,'chrome');
{const s=group(TOP(63,7,105.4));for(const v of[5,8,11])circle(s,9,v,.55,'face chrome');}
// Dials: chrome cylinders with knurled sides and engraved numbers that turn to the index.
function dial(x,y,z,r,h,labels,step,rn,fs,lock,n,name,orange=''){
const g=button(el('g'),name);into(g);
const c=cylinder(x,y,z,r,h,'z','chrome'),kn=el('path',{class:'knurl'},g),f=c.face;
circle(f,0,0,r-1.3,'detail');const rot=group('',f);
labels.forEach((t,i)=>{if(!t)return;const a=i*step,q=a*Math.PI/180,R=t==='|'?rn+1:rn,tg=group(`translate(${f2(R*Math.sin(q))} ${f2(R*Math.cos(q))}) rotate(${-a})`,rot);
if(t==='|'){line(tg,0,-.4,0,.5);return;}const k=text(tg,0,fs*.36,t,'eng center'+(orange.includes(t)?' org':''));k.style.fontSize=fs+'px';});
if(lock){const b=cylinder(x,y,z+h,lock,1.4,'z','chrome');circle(b.face,0,0,lock-1,'detail');}
circle(f,0,0,r+1.8,'focus-ring');into(draw);
const D={g,rot,kn,x,y,z,r,h,n,step,a:0,to:0,off:0,dir:1};upd(D);return D;}
function upd(D){set(D.rot,'transform',`rotate(${f2(D.a)})`);set(D.kn,'d',ridges([D.x,D.y],'z',D.r,D.z+.5,D.z+D.h-.4,D.n,D.a*Math.PI/180));}
function idx(x,y,z){const g=group(TOP(x,y,z));el('path',{d:'M-.9,.9 H.9 L0,-.5Z',class:'dot'},g);}
cylinder(24,19,84,15,2,'z','base');idx(24,33.2,86);
const isoD=dial(24,19,86,13,7,['L','100','200','400','800','1600','3200','6400','H'],34,9.7,1.85,3.6,48,'ISO dial','LH');
cylinder(113.5,16,84,14.5,2,'z','base');idx(113.5,29.7,86);
const shD=dial(113.5,16,86,13.5,8,[...SH.map(s=>s[0]),'X'],24,10.6,1.55,4,56,'Shutter-speed dial','BX');
{const g=group(TOP(102,32,84));rect(g,0,0,19,7,1.3,'face recess');rect(g,.8,.8,17.4,5.4,.9,'lcdg');}
const lHalo=el('rect',{x:1,y:1,width:17,height:5,rx:1,class:'lhalo'},group(TOP(102,32,84))),lcd=text(group(TOP(102,32,84)),9.5,5.15,'','lcdt center');
idx(135.5,18.8,84);
const cmp=[];for(let i=0;i<19;i++)cmp.push(i%3?'|':['−3','−2','−1','0','+1','+2','+3'][i/3]);
const evD=dial(135.5,9.5,84,8,6,cmp,13,5.2,1.5,0,40,'Exposure compensation dial','');
// Power collar with its lever, then the shutter button with a cable-release thread.
const pwG=button(el('g'),'Power lever (O)');into(pwG);
cylinder(132,30,84,6,2,'z','base');const lev=group('',group(TOP(132,30,86)));rect(lev,4.2,-1.7,5.4,3.4,1.5,'face base');const levDot=circle(lev,8,0,.6,'dot');
circle(group(TOP(132,30,86),pwG),0,0,10,'focus-ring');into(draw);
const btG=button(el('g'),'Shutter release (Space)');into(btG);const btn=el('g',{},btG);into(btn);
const sb=cylinder(132,30,86,4.2,3,'z','chrome');circle(sb.face,0,0,3.1,'detail');circle(sb.face,0,0,1.3,'face recess');el('path',{d:'M.9,0 A.9,.9 0 1 1 0,-.9 M.5,0 A.5,.5 0 1 1 0,-.5',class:'detail'},sb.face);
circle(sb.face,0,0,5.6,'focus-ring');into(draw);
// Front: AF-assist lamp, lens release, Fn buttons.
const fr=group(FRONT(0,40,68));circle(fr,114,10,3,'face chrome');const lamp=circle(fr,114,10,2.1,'lamp');const lampH=circle(fr,114,10,9,'halo');lampH.style.fill='#ff9b3d';
cylinder(110,40,30,3.4,1.6,'y','chrome');for(const x of[109,117.5])cylinder(x,40,15,2.2,1.3,'y','lens');
// Lens: mount ring, aperture ring, fixed barrel, distance ring, focus grip, front barrel and glass.
cylinder(LX,40,LZ,31.5,1.5,'y','chrome');
const apG=button(el('g'),'Aperture ring (A)');into(apG);cylinder(LX,41.5,LZ,31,11,'y','chrome');
const apK=el('path',{class:'knurl'},apG),apN=AP.map(v=>{const n=text(apG,0,.62,String(v),'eng center');return n;});
into(draw);
const fb=cylinder(LX,52.5,LZ,29.6,3,'y','lens');wire([[LX,52.9,LZ+29.62],[LX,55.1,LZ+29.62]],'idx');
for(const k of[-1,1])wire([[LX+29.62*Math.cos(Math.PI/2+k*.16),54.2,LZ+29.62*Math.sin(Math.PI/2+k*.16)],[LX+29.62*Math.cos(Math.PI/2+k*.16),55.1,LZ+29.62*Math.sin(Math.PI/2+k*.16)]],'idx');
const fcG=button(el('g'),'Focus ring: rack focus (Left and Right arrows)');into(fcG);
cylinder(LX,55.5,LZ,30.6,6,'y','lens');const DS=[['∞',0],['5',.2],['3',1/3],['2',.5],['1.5',2/3],['1',1],['.7',1/.7],['.5',2],['.3',1/.3]];
const dsN=DS.map(([t])=>text(fcG,0,.7,t,'wht center'));
cylinder(LX,61.5,LZ,31.6,14,'y','lens');const fcK=el('path',{class:'rib'},fcG);
into(draw);
const fx=cylinder(LX,75.5,LZ,29.6,6,'y','lens').face;
circle(fx,0,0,25.2,'face lens');circle(fx,0,0,23.4,'face recess');circle(fx,0,0,22.2,'lg');for(const r of[16,9.5])circle(fx,0,0,r,'gring');
el('path',{d:'M-16,-8 A17.8,17.8 0 0 1 -5,-17',class:'glint'},fx);circle(fx,-6.5,-8,1.4,'spark');el('path',{d:'M8,14 A16,16 0 0 0 15.5,5',class:'glint2'},fx);
el('path',{id:'nr',d:'M-27.1,0A27.1,27.1 0 1 1 27.1,0A27.1,27.1 0 1 1 -27.1,0',fill:'none'},fx);
{const t=el('text',{class:'wht'},fx);t.style.fontSize='1.9px';const tp=el('textPath',{href:'#nr',startOffset:'25%','text-anchor':'middle'},t);tp.textContent='AVOCET  HX  40 mm  1:2  Ø55';}
const apR=el('ellipse',{class:'focus-ring'});set(apR,'transform',FRONT(LX,52.5,LZ));set(apR,'rx',33);set(apR,'ry',33);apG.appendChild(apR);
const fcR=el('ellipse',{class:'focus-ring'});set(fcR,'transform',FRONT(LX,75.5,LZ));set(fcR,'rx',34);set(fcR,'ry',34);fcG.appendChild(fcR);
// Leather lug protector under the split ring.
{const g=group(SIDE(147.4,24.6,68.6));el('path',{d:'M0,0 H9.2 L6.4,9 Q4.6,11 2.8,9Z',class:'face side strapc'},g);el('path',{d:'M1.4,1.2 H7.8 L5.6,8 Q4.6,9.2 3.6,8Z',class:'st'},g);}
frame([[0,-8.5,0,144,49,106],[140,-9,10,82,9,54],[40,40,5,62,42,64]],8);
// State: exposure triangle, focus, shutter sequence, power, screen.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),keys={};
const E0=Math.log2(1/60);
let on=true,bootT=-1e9,si=7,ii=2,ai=0,ci=9,inv=1/1.2,rack=null,fdir=0,mfT=0,out=true,fa=180,fv=0,fl=-1,apv=0,fcl=-1,apl=-1,shot=null,frames=0,ledT=0,lt=0,lastUI=0,msg='',msgT=0,ac=null,nb=null,mst=null,bl=[-1,-1,-1],lastTw=0;
function say(m){announcement.textContent=m;}
function note(m,a){msg=m;msgT=performance.now()+1600;lastUI=0;if(a)say(a);}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();mst=ac.createGain();mst.gain.value=.8;mst.connect(ac.destination);nb=ac.createBuffer(1,ac.sampleRate/2,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function click(at,f,v,d){if(!ac)return;const t=ac.currentTime+at,s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;b.Q.value=1.2;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(mst);s.start(t,Math.random()*.3,d+.03);}
function tone(at,f,v,d,type='sine'){if(!ac)return;const t=ac.currentTime+at,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(mst);o.start(t);o.stop(t+d+.03);}
const detent=()=>{click(0,4300,.05,.012);tone(0,2600,.006,.02,'triangle');};
const shL=()=>SH[si][0]==='B'?'BULB':SH[si][0]==='1'?'1"':'1/'+SH[si][0];
const comp=()=>(ci-9)/3,cmpS=v=>Math.abs(v)<.01?'±0.0':(v>0?'+':'−')+Math.abs(v).toFixed(1);
const err=()=>Math.log2(SH[si][1]*ISO[ii]/100/AP[ai]**2)-E0+comp();
const coc=d=>9.5*Math.abs(d)*2/AP[ai];
function turn(D,k,d,len,name,val){audio();let n=clamp(k+d*D.dir,0,len-1);if(n===k){D.dir*=-1;n=clamp(k+d*D.dir,0,len-1);tone(0,700,.01,.05,'triangle');}D.to=(n+D.off)*D.step;detent();say(`${name} ${val(n)}.`);lastUI=0;return n;}
const shutterDial=d=>{si=turn(shD,si,d,SH.length,'Shutter',n=>SH[n][0]==='B'?'bulb':SH[n][0]==='1'?'1 second':'1/'+SH[n][0]);};
const isoDial=d=>{ii=turn(isoD,ii,d,ISO.length,'ISO',n=>ISO[n]);};
const evDial=d=>{ci=turn(evD,ci,d,19,'Compensation',n=>cmpS((n-9)/3));};
function aperture(d){audio();ai=(ai+d+AP.length)%AP.length;click(0,3600,.04,.015);say(`Aperture f/${AP[ai]}.`);lastUI=0;}
function nudge(d){audio();rack=null;inv=clamp(inv-d*.07,0,1/.3);mfT=performance.now()+1600;lastUI=0;}
function rackFocus(){audio();rack=inv>.4?0:1/1.2;mfT=performance.now()+1600;tone(0,180,.006,.25,'sawtooth');say(rack?'Focus racked to the cactus.':'Focus racked to infinity.');}
function power(){audio();on=!on;msgT=0;if(on){bootT=performance.now();tone(0,1046,.012,.12);tone(.08,1568,.01,.18);say('Camera on.');}else{shot=null;tone(0,784,.01,.12);say('Camera off.');}sync();}
function flip(){audio();out=!out;click(0,1900,.05,.03);click(.22,1500,.05,.03);note(out?'SCREEN OUT · FACING YOU':'SCREEN STOWED',out?'Screen flipped out.':'Screen stowed against the body.');sync();}
function shoot(){audio();const now=performance.now();if(!on){note('POWER OFF · PRESS O','The camera is off.');return;}if(shot)return;
const e=SH[si][1],ms=Math.max(40,e*1000);shot={t0:now,e:ms};click(0,2700,.12,.03);tone(0,150,.05,.05,'triangle');click(.06+ms/1000,3300,.1,.035);tone(.06+ms/1000,190,.04,.06,'triangle');say(`Shutter released at ${shL()}.`);lastUI=0;}
function sync(){set(pwG,'aria-pressed',on);set(flipG,'aria-pressed',out);set(keys.o,'aria-pressed',on);set(keys.f,'aria-pressed',out);lastUI=0;}
bind(shD.g,shutterDial);bind(isoD.g,isoDial);bind(evD.g,evDial);bind(apG,aperture);bind(fcG,rackFocus);bind(btG,shoot);bind(pwG,power);bind(flipG,flip);
const act={o:power,space:shoot,f:flip};document.querySelectorAll('.hint [data-k]').forEach(b=>{keys[b.dataset.k]=b;b.addEventListener('click',()=>act[b.dataset.k]());});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key,d=e.shiftKey?-1:1;
if(k==='ArrowLeft'||k==='ArrowRight'){e.preventDefault();const s=k==='ArrowLeft'?-1:1;if(!e.repeat)nudge(s);fdir=s;return;}
if(e.repeat)return;const l=k.toLowerCase();
if(k===' '){if(e.target.closest&&e.target.closest('button,[role=button]'))return;e.preventDefault();shoot();}
else if(l==='s'){e.preventDefault();shutterDial(d);}else if(l==='i'){e.preventDefault();isoDial(d);}else if(l==='e'){e.preventDefault();evDial(d);}
else if(l==='a'){e.preventDefault();aperture(d);}else if(l==='o'){e.preventDefault();power();}else if(l==='f'){e.preventDefault();flip();}});
document.addEventListener('keyup',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight')fdir=0;});addEventListener('blur',()=>fdir=0);
function placeRing(nodes,th,r,y){nodes.forEach((n,i)=>{const t=th[i],c=Math.cos(t),s=Math.sin(t),v=c+s;if(v<.25){n.style.display='none';return;}n.style.display='';set(n,'transform',plane([LX+r*c,y,LZ+r*s],[s,0,-c],[0,1,0]));n.style.opacity=f2(clamp((v-.25)/.45));});}
const fB=document.querySelector('#fgB feGaussianBlur'),bB=document.querySelector('#bgB feGaussianBlur'),tB=document.querySelector('#tbB feGaussianBlur');
isoD.off=1;isoD.a=isoD.to=(ii+1)*isoD.step;shD.a=shD.to=si*shD.step;evD.a=evD.to=ci*evD.step;[isoD,shD,evD].forEach(upd);
function tick(now){
const dt=Math.min(.05,(now-(lt||now))/1000),red=reduced.matches;lt=now;
if(fdir){inv=clamp(inv-fdir*.9*dt,0,1/.3);rack=null;mfT=now+1600;}
if(rack!==null){const d=rack-inv;if(red||Math.abs(d)<.004){inv=rack;rack=null;}else inv+=d*clamp(dt*7);lastUI=0;}
for(const D of[isoD,shD,evD])if(Math.abs(D.to-D.a)>.02){D.a=red?D.to:D.a+(D.to-D.a)*clamp(dt*16);upd(D);}
apv=red?ai:apv+(ai-apv)*clamp(dt*14);
if(Math.abs(apv-apl)>.002){apl=apv;placeRing(apN,AP.map((_,i)=>Math.PI/2-(i-apv)*.4),31.05,44.2);set(apK,'d',ridges([LX,0,LZ],'y',31,46.8,52.2,44,apv*.4));}
if(Math.abs(inv-fcl)>.0005){fcl=inv;placeRing(dsN,DS.map(([,v])=>Math.PI/2+.75*(v-inv)),30.65,58.6);set(fcK,'d',ridges([LX,0,LZ],'y',31.6,62.2,75,60,inv*.75));}
const to=out?180:0;if(red){fa=to;fv=0;}else{fv+=(36*(to-fa)-12*fv)*dt;fa+=fv*dt;}fa=clamp(fa,-2,182);if(Math.abs(fa-fl)>.05){fl=fa;drawFlip(fa);}
// Optics: circle of confusion for subject (1.2 m), table and background (infinity); exposure from the three dials.
const cs=coc(inv-1/1.2),cb=coc(inv),ct=coc(inv-.95),bv=[cs*.42,cb*.4,ct*.4].map(v=>+v.toFixed(2));
if(bv[0]!==bl[0]){set(fB,'stdDeviation',bv[0]);}if(bv[1]!==bl[1]){set(bB,'stdDeviation',bv[1]);}if(bv[2]!==bl[2])set(tB,'stdDeviation',bv[2]);
if(bv[1]!==bl[1]||now-lastTw>140){lastTw=now;LTS.forEach((n,i)=>{set(n,'r',f2(.55+cb*.5));n.style.opacity=f2(clamp(1.15/(.7+cb*.38))*(red||cb>1.5?1:.75+.25*Math.sin(now/300+i*1.7)));});}
bl=bv;const ev=err();set(EXP,'fill',ev>0?'#fff':'#000');EXP.style.opacity=f2(Math.min(.86,Math.abs(ev)*.27));
const boot=now-bootT,live=on&&boot>750?clamp((boot-750)/350):0;LIVE.style.opacity=HUD.style.opacity=f2(live);splash.style.opacity=f2(on&&boot<900?clamp(boot/200)*clamp((900-boot)/150):0);
if(lev.on!==on){lev.on=on;lcd.style.opacity=on?1:0;lHalo.style.opacity=on?.28:0;set(levDot,'class',on?'dot':'face base');set(lev,'transform',`rotate(${on?25:75})`);}
let curtainH=0,fo=0;
if(shot){const e=now-shot.t0,E=shot.e;btn.style.transform=e<160?'translate(0,1.1px)':'';
if(e<60)curtainH=red?48:48*e/60;else if(e<60+E)curtainH=48;else if(e<120+E){curtainH=red?0:48*(1-(e-60-E)/60);if(!shot.c){shot.c=1;frames++;ledT=now+1100;}}else if(e<1100+E)fo=red?0:.55*clamp(1-(e-120-E)/320);else{shot=null;}
lamp.classList.toggle('on',e<200);lampH.style.opacity=e<200?.5:0;}else{btn.style.transform='';lamp.classList.remove('on');lampH.style.opacity=0;}
set(curtain,'height',f2(curtainH));flash.style.opacity=f2(fo);
set(acc,'class',now<ledT&&(red||(now/90|0)%2)?'face led on':'face led');
const ok=cs<.7;set(afB,'class',ok?'af ok':'af');
if(!lastUI||now-lastUI>120){lastUI=now;
const ap='F'+AP[ai],dist=inv<.03?'∞':(1/inv).toFixed(1)+' M',evS=(Math.round(ev*3)/3);
hT[1].textContent=shL();hT[2].textContent=ap;hT[3].textContent='ISO'+ISO[ii];hT[4].textContent=cmpS(comp());lcd.textContent=ap;
const rv=shot&&now-shot.t0>120+shot.e;hT[0].textContent=rv?'▶':'M';hMF.textContent=rv?`100-${String(frames).padStart(4,'0')}`:now<mfT?'MF '+dist.replace(' M','m'):'AF-S';hLeft.textContent=`[${999-frames}]`;
set(ptr,'transform',`translate(${f2(40+clamp(evS,-3.4,3.4)*3)} 42.8)`);afB.style.display=rv?'none':'';
readout.textContent=`${shL()} · f/${AP[ai]} · ISO ${ISO[ii]} · ${cmpS(comp())}`;
stateLabel.textContent=now<msgT?msg:!on?'OFF · O TO POWER':boot<900?'STARTING':shot?(rv?`FRAME ${String(frames).padStart(4,'0')} · SAVED`:`EXPOSING ${shL()}`):`${ok?'FOCUSED':'MF'} ${dist} · METER ${evS>0?'+':evS<0?'−':''}${Math.abs(evS).toFixed(1)} · ${frames} SHOT${frames===1?'':'S'}`;}
requestAnimationFrame(tick);
}
sync();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['o', 'space', 'f'], draw }
