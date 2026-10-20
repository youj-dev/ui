// @ts-nocheck
/* ORBITONE 23–C · Television. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--wood:#a8774c;--wood-top:#c4935f;--wood-side:#88603b;--metal:#d9dad8;--metal-top:#eeeeec;--metal-side:#bcbdbb;--bake:#3b2c22;--bake-top:#54402f;--bake-side:#2c2019;--brass:#cfa95d;--cloth:#d8cfb8;--weave:#b8ad94;--crt:#3a403d;--lead:#9b7b52;--chrome:#e4e5e4;--jewel:#ffa52e}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--wood:#8d633f;--wood-top:#b78958;--wood-side:#5f4227;--metal:#b7b7b6;--metal-top:#dfdfdd;--metal-side:#848584;--bake:#30231b;--bake-top:#4e3b2b;--bake-side:#191412;--brass:#ae8e4d;--cloth:#b6ae9b;--weave:#9b917c;--crt:#303432;--lead:#826744;--chrome:#c0c1c0;--jewel:#ffa52e;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:4.6px;letter-spacing:1.3px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.bake{fill:var(--bake)}.top.bake{fill:var(--bake-top)}.side.bake{fill:var(--bake-side)}.brass{fill:var(--brass)}.crt{fill:var(--crt)}.cloth{fill:url(#weave)}.dark-ink{fill:#2a2118}
.grain{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.26}.trim{fill:none;stroke:var(--brass);stroke-width:1.1;vector-effect:non-scaling-stroke}
.ru{fill:none;stroke:var(--line);stroke-linecap:round}.rc{fill:none;stroke:var(--chrome);stroke-linecap:round}.lead{fill:none;stroke:var(--lead);stroke-linecap:round;stroke-linejoin:round}
.jewel{fill:#6b4a2a}.on .jewel{fill:var(--jewel);filter:url(#glow)}.jh{fill:var(--jewel);opacity:0;filter:url(#bloom)}.on .jh{opacity:.5}
.halo{opacity:0;filter:url(#bloom);pointer-events:none}.pool{opacity:0;pointer-events:none}.snow{image-rendering:pixelated}.dot{fill:#fff;filter:url(#glow)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.knob:hover .top.bake{fill:var(--bake-side)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<pattern id="weave" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="2" height="2" style="fill:var(--cloth)"/><path d="M0,1H2M1,0V2" style="stroke:var(--weave);stroke-width:.4"/></pattern>
<pattern id="scan" width="4" height="1.1" patternUnits="userSpaceOnUse"><rect width="4" height=".42" fill="#000" opacity=".32"/></pattern>
<radialGradient id="vig" cx=".5" cy=".5" r=".62"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".62"/></radialGradient>
<radialGradient id="poolG"><stop offset="0" style="stop-color:var(--pc,#9fc4ff);stop-opacity:.9"/><stop offset="1" style="stop-color:var(--pc,#9fc4ff);stop-opacity:0"/></radialGradient>
<linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b2f6e"/><stop offset=".55" stop-color="#d9485f"/><stop offset=".85" stop-color="#ff9a3c"/></linearGradient>
<linearGradient id="studio" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#173c78"/><stop offset="1" stop-color="#2a63ad"/></linearGradient>
<clipPath id="scr"><rect width="96" height="80" rx="12"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* ORBITONE 23–C television. World: x lower-right; y lower-left; z up. 1 unit ≈ 4 mm.
Part x y z w d h
legs (4, tapered, splayed 7) 5–165 5–105 0 – – 40
cabinet 0 0 40 170 110 120 (front plane y 110; front-local u = x, v = 160 − z)
top vents 20 6 160 130 12 0
antenna base + dome 85 44 160 r10 – 9
rabbit-ear rods (2 × 3 sections) 85 44 169 L84 tilt 36° azimuth −45…75°
twin-lead 85 2–34 160.5
side vents + badge 170 8–44 66 0 36 40
screen surround 8 110 56 112 2.5 96
CRT glass + picture 16 112.5 64 96 0 80
control panel 126 110 48 36 0 104
channel dial 144 110 128 r11 6 –
volume / power knob 144 110 98 r7 5 –
pilot jewel 156 110 108 r1.8 – –
speaker grille 128 110 52 32 0 30
brand plate 40 110 44.5 48 0 9
floor light pool 64 150 0 140 76 0
Grain, screws, print and labels share their parent face. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: flat colored shapes for the picture, tapered legs, rods.
const draw=root,into=g=>root=g,f2=v=>(+v).toFixed(2);
const sh=(g,tag,a,fill)=>{const n=el(tag,a,g);if(fill)set(n,'fill',fill);return n;};
const R=(g,x,y,w,h,fill,rx=0)=>sh(g,'rect',{x,y,width:w,height:h,rx},fill);
const O=(g,cx,cy,r,fill)=>sh(g,'circle',{cx,cy,r},fill);
const E=(g,cx,cy,rx,ry,fill)=>sh(g,'ellipse',{cx,cy,rx,ry},fill);
const Pt=(g,d,fill)=>sh(g,'path',{d},fill);
const T=(g,x,y,s,size,fill,wt=700)=>{const n=sh(g,'text',{x,y,'font-size':size,'font-weight':wt,'font-family':'system-ui,sans-serif','text-anchor':'middle'},fill);n.textContent=s;return n;};
function leg(t,b){const a=P(...t),c=P(...b),dx=c[0]-a[0],dy=c[1]-a[1],l=Math.hypot(dx,dy),nx=-dy/l,ny=dx/l,q=(p,w)=>[p[0]+nx*w,p[1]+ny*w],m=[a[0]+dx*.82,a[1]+dy*.82];
const quad=(p0,w0,p1,w1,cls)=>el('path',{d:'M'+[q(p0,w0),q(p1,w1),q(p1,-w1),q(p0,-w0)].map(p=>p.map(f2).join(',')).join('L')+'Z',class:cls});
quad(a,3.4,m,2.1,'face wood');quad(m,2.1,c,1.7,'face brass');el('path',{d:`M${f2(q(a,1.4)[0])},${f2(q(a,1.4)[1])}L${f2(q(m,.8)[0])},${f2(q(m,.8)[1])}`,class:'grain'});}
// Floor: shadow, light pool, legs (back first).
const shp=P(85,62,0);el('ellipse',{cx:shp[0],cy:shp[1]+3,rx:132,ry:50,class:'shadow stage-floor'});el('ellipse',{cx:shp[0],cy:shp[1]+3,rx:132,ry:50,class:'stage-contact'});
const pool=el('ellipse',{cx:60,cy:26,rx:66,ry:30,fill:'url(#poolG)',class:'pool',transform:TOP(4,104,.2)});
for(const[x,y,sx,sy]of[[14,14,-1,-1],[156,14,1,-1],[14,96,-1,1],[156,96,1,1]])leg([x,y,40],[x+sx*7,y+sy*7,0]);
// Cabinet with grain, top vents, side vents and badge.
box(0,0,40,170,110,120,7,'wood');
const lid=group(TOP(0,0,160));
for(let i=0;i<8;i++){const v=12+i*12.5,w=i%2?2.2:-1.6;el('path',{d:`M6,${v} C50,${v+w} 110,${v-w*1.3} 164,${v+w*.5}`,class:'grain'},lid);}
slits(lid,22,6,126,12,30);rect(lid,3.5,3.5,163,103,6,'detail');
const sideF=group(SIDE(170,110,160));
for(let i=0;i<6;i++){const v=12+i*19,w=i%2?1.6:-1.2;el('path',{d:`M4,${v} C34,${v+w} 70,${v-w} 106,${v+w*.5}`,class:'grain'},sideF);}
slits(sideF,66,20,36,40,12);rect(sideF,14,96,30,10,1.6,'face metal');
'COLOR'.split('').forEach((c,i)=>{const t=text(sideF,19.5+i*4.8,102.6,c,'label brand center');set(t,'style',`fill:${['#e23d3d','#f0a020','#2fb35a','#2f6fe0','#9a4ad8'][i]}`);});
for(const[u,v]of[[5,5],[105,5],[5,115],[105,115]])screw(sideF,u,v);rect(sideF,10,10,90,100,5,'detail');rect(sideF,11.4,11.4,87.2,97.2,4.4,'grain');
// Antenna base and twin-lead on the lid (rods are drawn last).
const tl=smooth([[85,34,160.6],[86,20,160.6],[84,8,160.6],[85,1,160]]);el('path',{d:tl,class:'ru','stroke-width':2.4});el('path',{d:tl,class:'lead','stroke-width':1.5});
const antG=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Rabbit-ear antenna: turn it to clear the picture (A)'});into(antG);
cylinder(85,44,160,10,3,'z','bake');cylinder(85,44,163,7,4,'z','bake');const dome=cylinder(85,44,167,3.6,2,'z','metal');
const antHit=el('ellipse',{class:'hit'});{const p=P(85,44,180);set(antHit,'cx',f2(p[0]));set(antHit,'cy',f2(p[1]));set(antHit,'rx',30);set(antHit,'ry',26);}
const antRing=el('ellipse',{class:'focus-ring'});{const p=P(85,44,164);set(antRing,'cx',f2(p[0]));set(antRing,'cy',f2(p[1]));set(antRing,'rx',16);set(antRing,'ry',9);}
into(draw);
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
// Front: surround, CRT glass and picture, control panel, brand plate.
const ff=group(FRONT(0,110,160));
rect(ff,3,3,164,114,5,'detail');
box(8,110,56,112,2.5,96,8,'metal');
const sf=group(FRONT(8,112.5,152));
rect(sf,2.6,2.6,106.8,90.8,7,'trim');
const halo=rect(sf,4,4,104,88,12,'halo');
rect(sf,6,6,100,84,13,'face recess');
const SG=group('translate(8 8)',sf);
rect(SG,0,0,96,80,12,'face crt');
const PIC=el('g',{'clip-path':'url(#scr)'},SG),pic=el('g',{},PIC);
'COLOR'.split('').forEach((c,i)=>{const t=text(sf,86+i*3.6,93.6,c,'label micro');set(t,'style',`font-weight:700;fill:${['#e23d3d','#f0a020','#2fb35a','#2f6fe0','#9a4ad8'][i]}`);});
text(sf,14,93.6,'23–C','etch micro');
// Picture scenes, in glass-local units 96 × 80.
const SC={},scene=k=>{const g=el('g',{style:'display:none'},pic);SC[k]=g;return g;};
{const g=scene('test');['#e9e9e9','#e8df3c','#3cd6de','#3fcf52','#d43fcf','#e2432f','#3249dc'].forEach((c,i)=>R(g,i*96/7,0,96/7+.3,52,c));
['#3249dc','#111','#d43fcf','#111','#3cd6de','#111','#e9e9e9'].forEach((c,i)=>R(g,i*96/7,52,96/7+.3,7,c));
['#0f2160','#f2f2f2','#3a1675','#0b0b0b','#0b0b0b','#1a1a1a','#0b0b0b'].forEach((c,i)=>R(g,i*96/7,59,96/7+.3,21,c));
const c1=O(g,48,38,25,'none');set(c1,'stroke','#fff');set(c1,'stroke-width',.9);for(const[a,b,c,d]of[[48,10,48,66],[20,38,76,38]]){const l=sh(g,'line',{x1:a,y1:b,x2:c,y2:d});set(l,'stroke','#fff');set(l,'stroke-width',.5);}
R(g,32,33,32,10,'#0b0b0b',1);T(g,48,40.2,'ORBITONE',5.2,'#fff');}
let tick2,anchor,rocket,flame,smoke,ball,bshadow,clouds,weed,sbDot;
{const g=scene('news');R(g,0,0,96,80,'url(#studio)');O(g,72,30,24,'#3474c4');for(const r of[8,16,23]){const e=E(g,72,30,r,24,'none');set(e,'stroke','#5d95d8');set(e,'stroke-width',.5);}for(const[y,h]of[[18,20.8],[30,24],[42,20.8]]){const l=sh(g,'line',{x1:72-h,y1:y,x2:72+h,y2:y});set(l,'stroke','#5d95d8');set(l,'stroke-width',.5);}
R(g,6,6,23,9,'#d8302a',1);T(g,17.5,13,'NEWS',6,'#fff');T(g,17.5,20,'EVENING EDITION',2.6,'#cfe0ff',600);
anchor=el('g',{},g);Pt(anchor,'M27,80 C27,59 37,53 48,53 C59,53 69,59 69,80Z','#1d222c');Pt(anchor,'M43,53 L48,62 L53,53Z','#f2f2f2');Pt(anchor,'M47,56 L49,56 L50,66 L48,68 L46,66Z','#c8302a');
O(anchor,48,42,8.6,'#e3b48c');Pt(anchor,'M39.6,41 C39,31 57,30 56.6,40 C55,35.5 44,34.5 39.6,41Z','#3a281c');
R(g,0,63,96,17,'#6e4a2e');R(g,0,63,96,1.6,'#8d6440');R(g,0,70,96,7,'#f1f1f1');R(g,0,70,14,7,'#d8302a');T(g,7,75.2,'LIVE',3.4,'#fff');
const tc=el('g',{'clip-path':'url(#tick)'},g);tick2=T(tc,0,75.2,'MARKETS STEADY · RAIN BY MORNING · CITY WINS 3–1 · LAUNCH SET FOR 9 PM · ',3.6,'#1d222c',600);set(tick2,'text-anchor','start');}
{const g=scene('space');R(g,0,0,96,80,'#0b1433');let s=7;const rnd=()=>(s=(s*9301+49297)%233280)/233280;for(let i=0;i<34;i++)O(g,rnd()*96,rnd()*62,.25+rnd()*.45,'#fff').setAttribute('opacity',f2(.45+rnd()*.55));
O(g,80,14,6.5,'#ece6cf');O(g,78,12.5,1.3,'#cfc7aa');O(g,82,16.5,1,'#cfc7aa');R(g,0,70,96,10,'#1c2433');
for(const x of[24,32]){R(g,x,26,1.2,44,'#8b93a3');}for(let y=28;y<70;y+=6){const l=sh(g,'path',{d:`M25,${y}L32,${y+6}M32,${y}L25,${y+6}`});set(l,'stroke','#8b93a3');set(l,'stroke-width',.45);}R(g,32,34,8,1.4,'#8b93a3');
smoke=el('g',{},g);for(const[x,r]of[[38,6],[48,8],[58,6],[30,5],[66,5]])O(smoke,x,72,r,'#b9bec8');
rocket=el('g',{},g);flame=el('g',{},rocket);E(flame,46,66,4,7,'#ff8a1f');E(flame,46,64.5,2.2,4.2,'#ffe07a');
Pt(rocket,'M42,62 L41,64 L51,64 L50,62Z','#c8302a');R(rocket,42.5,34,7,28,'#f1f1f1',1);Pt(rocket,'M42.5,34 Q46,22 49.5,34Z','#1d222c');Pt(rocket,'M42.5,54 L38,63 L42.5,61Z M49.5,54 L54,63 L49.5,61Z','#c8302a');O(rocket,46,40,1.6,'#2a63ad');R(rocket,42.5,47,7,1.6,'#c8302a');}
{const g=scene('cartoon');R(g,0,0,96,80,'#86cdf3');O(g,80,14,7,'#ffd23a');for(let i=0;i<10;i++){const a=i*Math.PI/5,l=sh(g,'line',{x1:80+Math.cos(a)*9,y1:14+Math.sin(a)*9,x2:80+Math.cos(a)*12,y2:14+Math.sin(a)*12});set(l,'stroke','#ffd23a');set(l,'stroke-width',1);}
clouds=el('g',{},g);for(const[x,y]of[[18,14],[52,22]]){E(clouds,x,y,9,4.4,'#fff');E(clouds,x+6,y-2.6,6,4,'#fff');E(clouds,x-6,y-1,5,3.4,'#fff');}
E(g,20,86,48,28,'#5cbb57');E(g,80,90,52,30,'#46a046');E(g,48,94,60,26,'#3d9140');
bshadow=E(g,48,70,7,1.6,'#2f6f33');ball=el('g',{},g);O(ball,0,0,6,'#e8432e');Pt(ball,'M-6,0 A6,6 0 0 0 6,0 A6,2.2 0 0 1 -6,0Z','#ffd23a');O(ball,-2,-2.6,1.4,'#fff');}
{const g=scene('western');R(g,0,0,96,80,'url(#dusk)');O(g,48,58,14,'#ffd27a');O(g,48,58,10,'#fff0b8');
Pt(g,'M0,58 L0,42 L8,42 L11,38 L26,38 L29,44 L33,58Z M60,58 L64,46 L69,46 L71,40 L86,40 L89,48 L96,48 L96,58Z','#4a2427');R(g,0,58,96,22,'#7b3c26');R(g,0,58,96,1.2,'#a3522f');
Pt(g,'M18,74 V52 Q18,49 20.5,49 Q23,49 23,52 V74Z M14,64 V58 Q14,56 15.6,56 Q17.2,56 17.2,58 V61 H18 V64Z M23,62 H24.6 V55 Q24.6,53 26.2,53 Q27.8,53 27.8,55 V60 Q27.8,65 23,65Z','#2a1712');
weed=el('g',{},g);const w1=O(weed,0,0,3.4,'none');set(w1,'stroke','#c9a66b');set(w1,'stroke-width',.8);const w2=Pt(weed,'M-2.4,-2.4 L2.4,2.4 M2.4,-2.4 L-2.4,2.4 M-3.4,0 H3.4','none');set(w2,'stroke','#c9a66b');set(w2,'stroke-width',.6);}
{const g=scene('standby');R(g,0,0,96,80,'#13245a');R(g,10,22,76,36,'#0b1638',3);const b=R(g,10,22,76,36,'none',3);set(b,'stroke','#f1f1f1');set(b,'stroke-width',.6);
T(g,48,37,'PLEASE STAND BY',7,'#fff');T(g,48,46,'TECHNICAL DIFFICULTIES',3.4,'#cfe0ff',600);sbDot=O(g,48,52,1.2,'#e2432f');}
el('clipPath',{id:'tick'},svg.querySelector('defs')).appendChild(el('rect',{x:14,y:70,width:82,height:7}));
const snowImgs=[];try{for(let k=0;k<4;k++){const c=document.createElement('canvas');c.width=96;c.height=80;const x=c.getContext('2d'),im=x.createImageData(96,80);for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255|0;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255;}x.putImageData(im,0,0);snowImgs.push(c.toDataURL());}}catch(_){}
const snow=el('image',{x:-6,y:-6,width:108,height:92,preserveAspectRatio:'none',class:'snow',opacity:0},pic);if(snowImgs[0])set(snow,'href',snowImgs[0]);
const dim=R(PIC,0,0,96,80,'#000');set(dim,'opacity',0);
R(PIC,0,0,96,80,'url(#scan)');const flash=R(PIC,0,0,96,80,'#fff');set(flash,'opacity',0);
const dot=circle(SG,48,40,1.6,'dot');set(dot,'opacity',0);
R(SG,0,0,96,80,'url(#vig)',12);el('path',{d:'M14,6 C30,3 58,3 72,5 L60,13 C46,11 30,12 20,15Z',fill:'#fff',opacity:.14},SG);rect(SG,0,0,96,80,12,'detail');
// Control panel: channel dial with printed ring, volume/power knob, pilot jewel, speaker.
rect(ff,126,8,36,104,4,'face metal');rect(ff,128,10,32,100,3,'detail');text(ff,144,13.6,'CHANNEL','etch micro center');
const CH=[2,3,4,5,6,7,8,9,10,11,12,13],angOf=c=>-150+(c-2)*30;
for(const c of CH){const a=angOf(c)*Math.PI/180;text(ff,144+Math.sin(a)*15.2,32-Math.cos(a)*15.2+1,String(c),'label micro center');}
circle(ff,144,32,12.6,'trim');
const knob=(x,z,r,h,name)=>{const g=el('g',{class:'control knob',role:'button',tabindex:'0','aria-label':name});into(g);const k=cylinder(x,110,z,r,h,'y','bake');const rot=group('',k.face);circle(k.face,0,0,r+1.8,'focus-ring');into(draw);return{g,rot,face:k.face};};
const DIAL=knob(144,128,11,6,'Channel dial: next channel (Right arrow)');
rect(DIAL.rot,-10.4,-2.2,20.8,4.4,2.2,'face bake top');line(DIAL.rot,-8,0,8,0,'detail');el('path',{d:'M0,-10.4 L1.6,-7 L-1.6,-7Z',class:'face brass'},DIAL.rot);for(let i=0;i<24;i++){const a=i*Math.PI/12;line(DIAL.rot,Math.cos(a)*9.4,Math.sin(a)*9.4,Math.cos(a)*10.6,Math.sin(a)*10.6);}
const VOL=knob(144,98,7,5,'Volume and power knob: switch on or off (O); Up and Down arrows set the volume');
for(let i=0;i<20;i++){const a=i*Math.PI/10;line(VOL.rot,Math.cos(a)*5.6,Math.sin(a)*5.6,Math.cos(a)*6.8,Math.sin(a)*6.8);}line(VOL.rot,0,-2,0,-5.4);circle(VOL.face,0,0,2,'face metal');
text(ff,144,74.2,'OFF · VOL','etch micro center');
const jew=el('g',{},ff);circle(jew,156,52,4,'jh');circle(jew,156,52,2.6,'face metal');circle(jew,156,52,1.7,'jewel');
rect(ff,128.5,78,31,30,2,'face recess');rect(ff,130,79.5,28,27,1.4,'face cloth');for(let i=0;i<5;i++)rect(ff,130,81.5+i*5.2,28,1.2,.6,'face metal');
rect(ff,40,106.5,48,9,1.8,'face brass');rect(ff,41.4,107.9,45.2,6.2,1.2,'detail');text(ff,64,112.6,'ORBITONE','label brand center dark-ink');
// Rabbit-ear rods: two telescopic rods in a V, rotated about the base.
const rodG=el('g',{},antG),RODS=[0,1].map(()=>{const segs=[1.7,1.25,.85].map(w=>({u:el('path',{class:'ru','stroke-width':w+.9},rodG),c:el('path',{class:'rc','stroke-width':w},rodG)}));const tip=el('circle',{r:1.5,class:'face metal'},rodG);return{segs,tip};});
const HINGE=[85,44,169],L=84,PHI=36*Math.PI/180;
function rods(th){const t=th*Math.PI/180,ends=[1,-1].map(sg=>[Math.sin(PHI)*Math.cos(t)*sg,Math.sin(PHI)*Math.sin(t)*sg,Math.cos(PHI)]);
const order=ends.map((d,i)=>({d,i,k:d[0]+d[1]})).sort((a,b)=>a.k-b.k);
order.forEach(({d},j)=>{const r=RODS[j];[[0,.36],[.36,.68],[.68,1]].forEach(([a,b],s)=>{const p=k=>HINGE.map((v,i)=>v+d[i]*L*k),dd=poly([p(a),p(b)]);set(r.segs[s].u,'d',dd);set(r.segs[s].c,'d',dd);});const e=P(...HINGE.map((v,i)=>v+d[i]*L));set(r.tip,'cx',f2(e[0]));set(r.tip,'cy',f2(e[1]));});}
const tips=[-45,-15,15,45,75].flatMap(th=>[1,-1].map(sg=>{const t=th*Math.PI/180;return[85+Math.sin(PHI)*Math.cos(t)*sg*L,44+Math.sin(PHI)*Math.sin(t)*sg*L,169+Math.cos(PHI)*L,0,0,0];}));
frame([[-3,-3,0,176,116,40],[0,0,40,170,117,120],...tips],12);
// State: power with raster expand/collapse, channels, antenna reception, audio.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),darkMQ=matchMedia('(prefers-color-scheme: dark)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2;
const STN={2:['test','TEST CARD',15,'#d9e2ff'],4:['news','NEWS',-45,'#5d95d8'],7:['space','LAUNCH',45,'#5872c8'],9:['cartoon','CARTOON',15,'#9fd7f5'],11:['western','WESTERN',75,'#ff9a5c'],13:['standby','STAND BY',-15,'#7f95d8']};
const ANG=[-45,-15,15,45,75];
let on=false,tOn=-1e9,tOff=-1e9,ch=2,ai=1,ant=-15,av=0,dialA=angOf(2),dialV=0,vol=5,q=0,lastT=0,lastUI=0,lastSnow=0,si=0,ac=null,master,nG,tG,rG,sceneShown='',lastBounce=0;
function say(m){announcement.textContent=m;}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
if(!ac){ac=new A();master=ac.createGain();master.gain.value=0;master.connect(ac.destination);
const b=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
const mk=(type,f,Q)=>{const s=ac.createBufferSource(),fl=ac.createBiquadFilter(),g=ac.createGain();s.buffer=b;s.loop=true;fl.type=type;fl.frequency.value=f;fl.Q.value=Q;g.gain.value=0;s.connect(fl);fl.connect(g);g.connect(master);s.start(0,Math.random());return g;};
nG=mk('bandpass',2600,.35);rG=mk('lowpass',160,.7);const o=ac.createOscillator();o.frequency.value=1000;tG=ac.createGain();tG.gain.value=0;o.connect(tG);tG.connect(master);o.start();}
if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function blip(f0,f1,d,v,type='sine',dest){if(!ac)return;const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(dest||ac.destination);o.start(t);o.stop(t+d+.02);}
function clunk(){if(!ac)return;blip(180,60,.09,.05,'triangle');blip(2400,900,.03,.012,'square');}
function power(){audio();on=!on;const n=performance.now();if(on){tOn=n;say(`On. Channel ${ch}.`);blip(70,40,.6,.06,'sine');}else{tOff=n;say('Off.');blip(900,200,.15,.01,'sine');}set(VOL.g,'aria-pressed',on);svg.classList.toggle('on',on);lastUI=0;}
function channel(d){audio();ch=(ch-2+d+12)%12+2;clunk();const s=STN[ch];say(`Channel ${ch}${s?', '+s[1].toLowerCase():', no station'}.`);lastUI=0;}
function antenna(d=1){audio();ai=(ai+d+ANG.length)%ANG.length;blip(320,260,.05,.015,'triangle');say(`Antenna ${ANG[ai]} degrees.`);lastUI=0;}
function volume(d){audio();vol=clamp(vol+d,0,10);say(`Volume ${vol}.`);lastUI=0;}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(VOL.g,power);bind(DIAL.g,()=>channel(1));bind(antG,()=>antenna(1));
document.querySelectorAll('.hint [data-k]').forEach(b=>b.addEventListener('click',()=>b.dataset.k==='o'?power():antenna(1)));
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key;
if(k==='ArrowUp'||k==='ArrowDown'){e.preventDefault();volume(k==='ArrowUp'?1:-1);return;}
if(e.repeat)return;
if(k==='ArrowLeft'||k==='ArrowRight'){e.preventDefault();channel(k==='ArrowLeft'?-1:1);}
else if(k.toLowerCase()==='o'){e.preventDefault();power();}else if(k.toLowerCase()==='a'){e.preventDefault();antenna(e.shiftKey?-1:1);}
});
function tick(now){
const dt=Math.min(.05,(now-(lastT||now))/1000),red=reduced.matches,ts=now/1000;lastT=now;
const ta=ANG[ai];if(red){ant=ta;av=0;}else{av+=(60*(ta-ant)-11*av)*dt;ant+=av*dt;}rods(ant);
let tgt=angOf(ch);if(tgt-dialA>180)dialA+=360;if(dialA-tgt>180)dialA-=360;if(red){dialA=tgt;dialV=0;}else{dialV+=(420*(tgt-dialA)-26*dialV)*dt;dialA+=dialV*dt;}set(DIAL.rot,'transform',`rotate(${f2(dialA)})`);set(VOL.rot,'transform',`rotate(${on?-120+vol*24:-150})`);
const st=STN[ch];q=st?Math.max(0,Math.cos(Math.min(Math.PI/2,Math.abs(ant-st[2])*Math.PI/180*1.5)))**2:0;
const name=st?st[0]:'';if(name!==sceneShown){if(SC[sceneShown])SC[sceneShown].style.display='none';if(SC[name])SC[name].style.display='';sceneShown=name;if(ac&&on&&name==='news'){[523,659,784].forEach((f,i)=>setTimeout(()=>blip(f,f,.25,.03*vol/10,'triangle',master),i*140));}}
let sx=1,sy=1,fl=0,dO=0,vis=on;const e1=(now-tOn)/1000,e0=(now-tOff)/1000;
if(on){const t=red?1:clamp(e1/.9);sx=sy=Math.max(.02,ease(t));fl=red?0:(1-t)*.85;}
else if(!red&&e0<2.2){vis=e0<.36;if(e0<.18){sx=1;sy=Math.max(.015,1-e0/.18);fl=.8*e0/.18;}else if(e0<.36){sy=.015;sx=Math.max(.02,1-(e0-.18)/.18);fl=.9;}dO=e0<.36?0:Math.max(0,1-(e0-.36)/1.8);}
const bright=on?(red?1:clamp(.55+e1*.3)):0,jit=on&&!red?(Math.random()-.5)*(1-q)*3:0;
PIC.style.display=vis?'':'none';set(pic,'transform',`translate(${f2(48+jit)} 40) scale(${f2(sx)} ${f2(sy)}) translate(-48 -40)`);
set(flash,'opacity',f2(fl));set(dim,'opacity',f2(1-bright+(red?0:Math.random()*.03)));set(dot,'opacity',f2(dO));
const sn=st?(1-q)*.84+.02:1;set(snow,'opacity',f2(sn));if(snowImgs.length&&(!red&&now-lastSnow>50)){lastSnow=now;si=(si+1)%4;set(snow,'href',snowImgs[si]);set(snow,'x',f2(-6+Math.random()*4));}
const pc=st&&q>.2?st[3]:'#c8ccd2',gl=on?bright*(.35+.65*(st?q:.5)):0;
halo.style.fill=pc;halo.style.opacity=f2(gl*.55);if(svg._pc!==pc){svg._pc=pc;svg.style.setProperty('--pc',pc);}pool.style.opacity=f2(gl*(darkMQ.matches?.2:.08));
if(on&&!red){
if(name==='news'){set(anchor,'transform',`translate(0 ${f2(Math.sin(ts*2.1)*.35)})`);set(tick2,'x',f2(14+82-((ts*9)%170)));}
else if(name==='space'){const c=ts%12,up=c<3?0:c<10?((c-3)/7)**2*96:200;set(rocket,'transform',`translate(0 ${f2(-up)})`);set(flame,'transform',`translate(46 64) scale(${f2((c<3?.35:1)*(.85+Math.random()*.3))}) translate(-46 -64)`);set(smoke,'opacity',f2(c<3?.35:c<10?Math.max(0,.9-(c-3)*.08):0));if(rG)rG.gain.setTargetAtTime(c>=3&&c<10?.5*(1-(c-3)/7):0,ac.currentTime,.1);}
else if(name==='cartoon'){const c=(ts*1.25)%1,h=4*c*(1-c),sq=h<.06?1-(.06-h)*4:1;set(ball,'transform',`translate(48 ${f2(64-h*38+(1-sq)*6)}) scale(${f2(2-sq)} ${f2(sq)})`);set(bshadow,'rx',f2(7-h*3));set(clouds,'transform',`translate(${f2((ts*3)%110-10)} 0)`);if(c<.05&&ts-lastBounce>.5){lastBounce=ts;if(ac)blip(260,520,.12,.04*q,'sine',master);}}
else if(name==='western'){const x=(ts*12)%120-12;set(weed,'transform',`translate(${f2(x)} ${f2(72-Math.abs(Math.sin(ts*4))*2.4)}) rotate(${f2(ts*240)})`);}
else if(name==='standby')set(sbDot,'opacity',(ts*2|0)%2?1:.2);}
if(ac){const t=ac.currentTime,A=on?bright:0;master.gain.setTargetAtTime(vol/10*.12,t,.05);nG.gain.setTargetAtTime(A*sn*.5,t,.05);tG.gain.setTargetAtTime(A*(name==='test'||name==='standby'?q*.05:0),t,.05);if(name!=='space')rG.gain.setTargetAtTime(0,t,.1);}
if(!lastUI||now-lastUI>150){
readout.textContent=`CH ${ch} · ${st?st[1]:'NO STATION'} · VOL ${vol}`;
stateLabel.textContent=!on?(dO>0?'OFF · AFTERGLOW':'OFF · PRESS O'):e1<1.2&&!red?`WARMING UP · ANTENNA ${ANG[ai]}°`:st?(q>.9?`CLEAR · ANTENNA ${ANG[ai]}°`:q>.35?`SNOWY · SIGNAL ${Math.round(q*100)}% · ANTENNA ${ANG[ai]}°`:`LOST · TURN ANTENNA · ${ANG[ai]}°`):`SNOW · ANTENNA ${ANG[ai]}°`;
lastUI=now;}
requestAnimationFrame(tick);
}
rods(ant);requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['o', 'a'], draw }
