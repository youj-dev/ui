// @ts-nocheck
/* ESKER L–87 · Model train. Drawn for this kit on the shared engine, in the manner of the lab files: its stylesheet,
 * defs and script. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--recess:#9d9d99;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--fault:#e3372d;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--wood:#9a6a42;--wood-top:#b9875a;--wood-side:#7b5232;--brass:#cfa95d;--brass-top:#e8c985;--brass-side:#ab8743;--grass:#b4c194;--tuft:#a2b282;--ballast:#cdc6b6;--ballast-s:#ada695;--sleeper:#6e5d4c;--rail:#6f6d67;--rail-top:#d3d2cd;--road:#a19f99;--road-f:#8d8b85;--stone:#cfc9bc;--stone-top:#e2ddd2;--stone-side:#b9b3a6;--coping:#f3f0e8;--cream:#efe6d2;--cream-top:#f8f2e4;--cream-side:#d8cfba;--slate:#5f676e;--slate-top:#717a83;--crimson:#b5392c;--crimson-top:#cc4a3b;--black:#3b3b39;--black-top:#4e4e4b;--roofc:#dcd9d0;--tyre:#2b2b2a;--win:#c3ced0;--lamp:#f3efe2;--steam:#fdfdfb;--steam-l:#c4c4be;--shelter:#4f7a5c;--shelter-top:#5f8c6c;--tree:#6f9a5a;--tree-top:#8cb46f;--tree-d:#5b8449;--trunk:#7b5a3e;--boom:#d8392c;--sig:#d63a2c;--shade:.13}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--recess:#6e6e6c;--off:#9b9b99;--ok:#36d886;--fault:#ff4c41;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--wood:#815836;--wood-top:#ad7e54;--wood-side:#553720;--brass:#ae8e4d;--brass-top:#d9bc7c;--brass-side:#785e2d;--grass:#a8b48a;--tuft:#96a576;--ballast:#c0b9aa;--ballast-s:#918b7d;--sleeper:#665647;--rail:#555450;--rail-top:#c2c1bc;--road:#96948f;--road-f:#767470;--stone:#ada9a1;--stone-top:#d3cfc4;--stone-side:#858179;--coping:#e2dfd6;--cream:#c9c2b1;--cream-top:#e8e2d5;--cream-side:#99927f;--slate:#50555a;--slate-top:#69727a;--crimson:#982e23;--crimson-top:#bf4537;--black:#30302f;--black-top:#484846;--roofc:#cecbc2;--tyre:#222221;--win:#ffcf7a;--lamp:#ffd88a;--steam:#d9d9d5;--steam-l:#d9d9d5;--shelter:#41664c;--shelter-top:#588365;--tree:#5c814b;--tree-top:#83a867;--tree-d:#4a6c3c;--trunk:#674b33;--boom:#b62e23;--sig:#b9311f;--line:#444443;--shade:.3}svg{--ink:#282828;--muted:#6b6b6b}.lamp,.head,.tail{filter:url(#glow)}.board-shadow{display:none}.board-contact{display:inline;fill:#000;opacity:.5;filter:url(#soft)}.puff{stroke:none;fill-opacity:.6}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.micro{font-size:2.3px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.board-contact{display:none}.sh{fill:#000;fill-opacity:var(--shade);stroke:none;pointer-events:none}.hi{fill:none;stroke:#fff;stroke-linecap:round;opacity:.45;pointer-events:none}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.brass{fill:var(--brass)}.top.brass{fill:var(--brass-top)}.side.brass{fill:var(--brass-side)}
.grass{fill:var(--grass)}.tuft{fill:var(--tuft);stroke:none}.ballast{fill:var(--ballast);stroke:none}.ballast-s{fill:var(--ballast-s);stroke:none}.sleepers{fill:var(--sleeper);stroke:none}.rail{fill:none;stroke:var(--rail);stroke-width:1.5;stroke-linejoin:round}.railtop{fill:none;stroke:var(--rail-top);stroke-width:.55;stroke-linejoin:round}.flange{fill:none;stroke:var(--tyre);stroke-width:.5;opacity:.5}
.road{fill:var(--road)}.road-f{fill:var(--road-f)}.stone{fill:var(--stone)}.top.stone{fill:var(--stone-top)}.side.stone{fill:var(--stone-side)}.coping{fill:var(--coping);stroke:none}.joint{stroke:var(--line);stroke-width:.3;opacity:.25}
.cream{fill:var(--cream)}.top.cream{fill:var(--cream-top)}.side.cream{fill:var(--cream-side)}.slate{fill:var(--slate)}.top.slate{fill:var(--slate-top)}.crimson{fill:var(--crimson)}.top.crimson{fill:var(--crimson-top)}.black{fill:var(--black)}.top.black{fill:var(--black-top)}.roofc{fill:var(--roofc)}.shelter{fill:var(--shelter)}.top.shelter{fill:var(--shelter-top)}
.fill-cream{fill:var(--cream);stroke:none}.win{fill:var(--win);stroke:none}.lining{fill:none;stroke:var(--brass-top);stroke-width:.3}.livery{fill:var(--brass-top);font:600 2.6px Georgia,'Times New Roman',serif;letter-spacing:.5px;text-anchor:middle;stroke:none}.plate{fill:#2a2118;font:600 3.2px Georgia,'Times New Roman',serif;letter-spacing:1.1px;stroke:none}.sign{fill:#2a2a28;font:600 2.3px ui-monospace,monospace;letter-spacing:.5px;text-anchor:middle;stroke:none}
.tyre{fill:var(--tyre)}.spoke{stroke:var(--brass-top);stroke-width:.32}.hub{fill:var(--black)}.rod{fill:none;stroke:var(--metal-top);stroke-width:.9;stroke-linecap:round}.rod-u{fill:none;stroke:var(--line);stroke-width:1.5;stroke-linecap:round}
.lamp{fill:var(--lamp);stroke:none}.lamp.g{fill:var(--ok)}.head{fill:var(--lamp);stroke:none}.tail{fill:var(--fault);stroke:none}
.skin{fill:#e8c4a0}.coat-a{fill:#4a6a8c}.top.coat-a{fill:#5b7da0}.coat-b{fill:#b8893a}.top.coat-b{fill:#c99b4c}.coat-c{fill:#55705a}.top.coat-c{fill:#66836b}.tree{fill:var(--tree);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.tree-hi{fill:var(--tree-top);stroke:none}.tree-d{fill:var(--tree-d);stroke:none}.trunk{fill:var(--trunk)}.top.trunk{fill:var(--trunk)}
.boom{fill:#f6f4ee;stroke:none}.boom-r{fill:var(--boom);stroke:none}.xl{fill:var(--off);stroke:none}.xl.on{fill:#ff3b2f;filter:url(#glow)}.xh{fill:#ff3b2f;opacity:0;filter:url(#bloom);pointer-events:none}.cross{fill:#f6f4ee;stroke:var(--boom);stroke-width:.35}
.arm{fill:var(--sig)}.arm-w{fill:#f6f4ee;stroke:none}.sl{fill:var(--off);stroke:none}.sl.r{fill:#ff4c41;filter:url(#glow)}.sl.g{fill:#36d886;filter:url(#glow)}.lens-r{fill:#ff4c41;opacity:.8;stroke:none}.lens-g{fill:#36d886;opacity:.8;stroke:none}
.puff{fill:var(--steam);stroke:var(--steam-l);stroke-width:.35;vector-effect:non-scaling-stroke;pointer-events:none}.ghost{pointer-events:none}
.run{fill:var(--off);stroke:none}.run.on{fill:var(--ok);filter:url(#glow)}.knob{fill:var(--black)}.panel{fill:#2f2f2e}.tick{stroke:var(--coping);stroke-width:.35}.ptr{stroke:var(--coping);stroke-width:.6;stroke-linecap:round}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = ``

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* ESKER L–87 model railway. World: x lower-right; y lower-left (the front straight faces +y); z up from the baseboard's
top. 1 unit ≈ 2 mm at H0, so a unit a second reads as about a scale km/h.
Part                          x      y      z      w      d      h
baseboard (frame, grass)      0      0     −9    207    124      9   fascia: brand plate, throttle knob, run lamp
track: a stadium, centers (54, 64) and (150, 64), R 40; the front straight (y 104) runs east (+x), the back straight
       (y 24) west; ballast ±12.5 → ±10 × 1.6, sleepers 14.8 × 2.2 every 5.2, rails ±3.8, rail top z 3.2
road                         32    124      0     16      –      –   in over the left curve's exit to the forecourt 30–58 × 52–78
TARNLOW platform             56     80      0     90   15.6    7.4   coping, lamps, bench
station building             58     68      0     32     12   17.4   stone plinth, cream walls and sign, slate roof to 22.4
BRAEMOSS halt platform       80    0.6      0     56     15    7.4   shelter, nameboard, lamp
home signal                 140      7      0      2      2     38   arm pivot z 34 on its +x face, 8.4 long toward −y
crossing: barrier pedestals 27.5 115.5 (outer) and 48.5 80 (inner), 2 × 2 × 11; booms 16.4 long pivoting at z 9.5
loco (0-6-0 tank)  u ±17 v ±7.5: drivers r 4.4 at u −10/0/10; footplate z 12–13.2; tanks u −4.4–9 to z 21.4; boiler r 5
                   at z 18.8; smokebox r 5.3 u 11–16.6; chimney to z 30.6; dome; cab u −17 to −4.4 to z 27.6, roof 29.8
coaches            u ±15 v ±7.2: bogies at u ±10, wheels r 2.6; underframe z 8.6–10.6; body to z 23.4; roof to 25.8
The rolling stock is drawn a little stouter than this table (v ×1.07, and ×1.12 up from the rail top) so it reads at
small sizes. A vehicle sits on the track by the chord between its outer axles or bogies, is built facing its heading and
drawn in the order that heading shows its parts; the vehicles and the inner barrier are sorted by footprint every frame. */
const draw=document.getElementById('drawing');let root=draw;
const{P,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,box,cylinder,frame}=kit(()=>root);
// Figure helpers: oriented planes, hulls, controls.
const{cos,sin,PI,sqrt,abs}=Math,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>t*t*(3-2*t),into=g=>(root=g),RAD=PI/180;
const plane=(o,A,B)=>`matrix(${[...P(...A),...P(...B),...P(...o)].map(f2).join(' ')})`,pd=q=>q.length?'M'+q.map(p=>f2(p[0])+','+f2(p[1])).join('L')+'Z':'',tr=(x,y,z)=>`translate(${P(x,y,z).map(f2).join(' ')})`,wp=q=>pd(q.map(p=>P(...p)));
function hull(q){q=q.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const p of q){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(const p of q.reverse()){while(hi.length>1&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
function ctl(g,label){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0','aria-label':label}))set(g,k,v);return g;}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
let seed=7;const rand=()=>(seed=(seed*9301+49297)%233280)/233280;
// The track: a point s along its centerline (east on the front straight, round the right curve, west on the back) and its heading.
const XL=54,XR=150,YC=64,R=40,LS=XR-XL,ARC=PI*R,LOOP=2*(LS+ARC),W=207,D=124,BH=9;
function at(s){s=((s%LOOP)+LOOP)%LOOP;if(s<LS)return[XL+s,YC+R,0];s-=LS;if(s<ARC){const a=s/R;return[XR+R*sin(a),YC+R*cos(a),-a];}s-=ARC;if(s<LS)return[XR-s,YC-R,-PI];s-=LS;const a=s/R;return[XL-R*sin(a),YC-R*cos(a),-PI-a];}
const beside=(s,o,z)=>{const[x,y,h]=at(s);return[x-o*sin(h),y+o*cos(h),z];};
const SS=[];for(let s=0;s<LOOP;s+=2)SS.push(s);
const ring=(o,z,a=0,b=LOOP,close=true)=>'M'+SS.filter(s=>s>=a&&s<=b).concat(close?[]:[b]).map(s=>P(...beside(s,o,z)).map(f2).join(',')).join('L')+(close?'Z':'');
const XS0=2*LS+ARC+R*(PI-Math.asin(22/R)),XS1=2*LS+ARC+R*(PI-Math.asin(6/R));
// The floor shadow and the baseboard: its wooden frame, the grass and tufts scattered clear of the track and buildings.
const fl=wp([[-3,-3,-BH],[W+3,-3,-BH],[W+3,D+3,-BH],[-3,D+3,-BH]]),fc=P(W/2,D/2,-BH);el('path',{d:fl,class:'shadow board-shadow',transform:'translate(0 3)'});el('ellipse',{cx:f2(fc[0]),cy:f2(fc[1]),rx:150,ry:76,class:'stage-pool'});el('path',{d:fl,class:'board-contact',transform:'translate(0 2)'});
const FF=group(FRONT(0,D,0));rect(FF,0,0,W,BH,1.5,'face wood');line(FF,2,1.4,W-2,1.4);
rect(group(SIDE(W,D,0)),0,0,D,BH,1.5,'face side wood');
const TG=group(TOP(0,0,0));rect(TG,0,0,W,D,1.5,'face grass');
const trackD=(x,y)=>x<XL?abs(Math.hypot(x-XL,y-YC)-R):x>XR?abs(Math.hypot(x-XR,y-YC)-R):Math.min(abs(y-YC-R),abs(y-YC+R));
const busy=(x,y)=>trackD(x,y)<16||x>26&&x<94&&y>48&&y<84||x>24&&x<54&&y>84||x>52&&x<150&&y>76&&y<100||x>76&&x<146&&y<20||x<36&&y<22||x>182&&y<28||x<18&&y>102||x>190&&y>104||x>152&&x<176&&y>50&&y<78;
for(let i=0;i<64;i++){const x=4+rand()*(W-8),y=4+rand()*(D-8),a=1+rand()*1.4,b=.5+rand()*.5;if(!busy(x,y))el('ellipse',{cx:f2(x),cy:f2(y),rx:f2(a),ry:f2(b),class:'tuft'},TG);}
// The road and forecourt, the ballast, the crossing deck over it, the sleepers (none on the deck); rails come later.
el('path',{d:`M32,${D}V78H33Q30,78 30,75V55Q30,52 33,52H55Q58,52 58,55V75Q58,78 55,78H48V${D}Z`,class:'face road'},group(TOP(0,0,.05)));
el('path',{d:ring(12.5,0)+ring(-12.5,0),'fill-rule':'evenodd',class:'ballast-s'});el('path',{d:ring(10,1.6)+ring(-10,1.6),'fill-rule':'evenodd',class:'ballast'});
const yr=(x,r)=>YC+sqrt(r*r-(x-XL)**2),XD=[32,35,38,41,44,48];
el('path',{d:`M${XD.map(x=>`${x},${f2(yr(x,52.5))}`).join('L')}L${[...XD].reverse().map(x=>`${x},${f2(yr(x,27.5))}`).join('L')}Z`,class:'face road'},group(TOP(0,0,1.62)));
el('path',{d:wp(XD.map(x=>[x,yr(x,52.5),1.62]).concat([...XD].reverse().map(x=>[x,yr(x,52.5),0]))),class:'face road-f'});
const SLP=[];for(let s=1.3;s<LOOP;s+=5.2){if(s>XS0-1.6&&s<XS1+1.6)continue;SLP.push(wp([beside(s-1.1,-7.4,1.66),beside(s+1.1,-7.4,1.66),beside(s+1.1,7.4,1.66),beside(s-1.1,7.4,1.66)]));}
el('path',{d:SLP.join(''),class:'sleepers'});
// Props: lamp posts, nameboards, trees and bushes.
function lampPost(x,y,z,h){box(x-.5,y-.5,z,1,1,h,.3,'black');box(x-1.3,y-1.3,z+h,2.6,2.6,2.8,.6,'black');const l=circle(group(FRONT(x-1.3,y+1.32,z+h+2.8)),1.3,1.4,.95,'lamp');cylinder(x,y,z+h+2.8,1.7,.5,'z','black');return l;}
function tree(x,y,r,h){cylinder(x,y,0,1.1,h*.45,'z','trunk');const c=P(x,y,h);circle(root,c[0],c[1],r,'tree');circle(root,c[0]-r*.3,c[1]-r*.32,r*.55,'tree-hi');circle(root,c[0]+r*.42,c[1]+r*.34,r*.36,'tree-d');}
function bush(x,y,r){const c=P(x,y,r*.7);circle(root,c[0],c[1],r,'tree');circle(root,c[0]-r*.28,c[1]-r*.3,r*.5,'tree-hi');}
tree(12,14,7.2,21);tree(27,5,5.6,16);tree(190,6,6,17);tree(200,18,7.4,22);
// The back: the halt's platform, shelter, nameboard and lamp, and the home signal (its arm and spectacle turn on the pivot).
box(80,.6,0,56,15,7.4,.6,'stone');{const g=group(TOP(80,.6,7.42));rect(g,0,13.2,56,1.8,0,'coping');for(let u=6;u<56;u+=6)line(g,u,0,u,13.2,'joint');}
box(96,2,7.4,14,6,9.2,.5,'shelter');{const g=group(FRONT(96,8.02,16.6));rect(g,1.6,1.8,10.8,7.4,.6,'face recess');rect(g,2.4,5.8,9.2,1.2,.3,'face top wood');}
el('path',{d:wp([[110,2,16.6],[110,8,16.6],[110,2,17.4]]),class:'face side shelter'});el('path',{d:wp([[95,1.2,17.6],[111,1.2,17.6],[111,9.4,16.6],[95,9.4,16.6]]),class:'face top slate'});el('path',{d:wp([[95,9.4,16.6],[111,9.4,16.6],[111,9.4,16],[95,9.4,16]]),class:'face slate'});
for(const u of[115.6,130.4])box(u-.4,6.6,7.4,.8,.8,6.4,.2,'black');{const g=group(FRONT(114,7.42,17.2));rect(g,0,0,18,3.8,.5,'face top cream');rect(g,.5,.5,17,2.8,.3,'detail');text(g,9,2.7,'BRAEMOSS','sign');}
const L1=lampPost(85,5,7.4,12);
box(140,7,0,2,2,38,.4,'metal');{const g=group(SIDE(142,9,38));for(let v=6;v<36;v+=3)line(g,.3,v,1.7,v,'detail');}box(139.4,6.4,0,3.2,3.2,3,.6,'black');cylinder(141,8,38,1.3,.8,'z','black');cylinder(141,8,38.8,.5,1.6,'z','black');
const sigG=ctl(el('g',{}),'Signal: set it to danger or clear it (S)'),SP=group(SIDE(142.1,8,34),sigG),sigArm=el('g',{},SP);
rect(sigArm,-1,-1,9.4,2,.3,'face arm');rect(sigArm,6,-1,1.2,2,0,'arm-w');rect(sigArm,-3.2,-.7,2.6,3.6,.5,'face black');circle(sigArm,-1.9,.3,.75,'lens-r');circle(sigArm,-1.9,2.1,.75,'lens-g');
circle(SP,0,0,.6,'face metal');const sigLamp=circle(SP,-1.9,1.2,.7,'sl');rect(SP,-4.6,-4,15,9,1,'hit');rect(SP,-4.6,-4,15,9,1,'focus-ring');
// The station: platform with its coping, bench and lamps; the building on its plinth, sign, door, windows, roof and stack.
box(56,80,0,90,15.6,7.4,.5,'stone');{const g=group(TOP(56,80,7.42));rect(g,0,13.8,90,1.8,0,'coping');for(let u=8;u<90;u+=8)line(g,u,0,u,13.8,'joint');}
box(114,81.2,7.4,8,2.2,2.6,.4,'wood');
box(58,68,0,32,12,7.4,.4,'stone');box(58,68,7.4,32,12,10,.4,'cream');
{const g=group(FRONT(58,80.02,17.4));rect(g,6,.8,20,3,.4,'face top cream');rect(g,6.5,1.3,19,2,.3,'detail');text(g,16,2.95,'TARNLOW','sign');for(const u of[3,8.6,20.2,25.8])rect(g,u,4.6,3.2,4.2,.4,'face win');rect(g,13.7,4.2,4.6,5.8,.5,'face wood');
const s=group(SIDE(90.02,80,17.4));rect(s,3.6,4.2,4.8,4.2,.4,'face win');}
el('path',{d:wp([[56.6,66.6,17],[91.4,66.6,17],[91.4,74,22.4],[56.6,74,22.4]]),class:'face top slate'});
el('path',{d:wp([[90.02,68,17.4],[90.02,80,17.4],[90.02,74,21.9]]),class:'face side cream'});
el('path',{d:wp([[56.6,74,22.4],[91.4,74,22.4],[91.4,81.4,17],[56.6,81.4,17]]),class:'face slate'});
box(76,71.4,21.8,3.4,3,3.6,.3,'stone');
const L2=[lampPost(100,88,7.4,13),lampPost(138,88,7.4,13)];
bush(163,56,3.2);bush(170,68,2.5);bush(159,72,2.8);
function person(x,y,m){cylinder(x,y,7.4,1.15,3.4,'z',m);const h=P(x,y,12.1);circle(root,h[0],h[1],1.05,'face skin');}
person(97,84.5,'coat-a');person(99.6,85.8,'coat-b');person(126,84,'coat-c');person(104,9.5,'coat-b');
// The crossing's barriers: a pedestal and mast, the boom on its pivot (striped, with a counterweight), the crossbuck and lights.
function barrier(x,y,out){const g0=el('g',{});into(g0);box(x,y,0,2,2,11,.4,'metal');box(x-.4,y-.4,5.4,2.8,2.8,4.6,.6,'black');box(x+.6,y+.6,11,.8,.8,12,.2,'metal');
const g=group(FRONT(x+1,y+2.6,24));for(const a of[32,-32])rect(g,-4.6,-.8,9.2,1.6,.4,out?'cross':'face metal').setAttribute('transform',`rotate(${a})`);
rect(g,-4.4,5.2,8.8,1.2,.4,'face black');const L=[-2.8,2.8].map(u=>{circle(g,u,7.4,1.7,'face black');return out?circle(g,u,7.4,1.15,'xl'):null;}),H=out?[-2.8,2.8].map(u=>el('ellipse',{cx:u,cy:7.4,rx:5,ry:4.4,class:'xh'},g)):[];
const pv=group(FRONT(x+(out?1.8:.2),y+2.1,9.5)),arm=el('g',{},pv);for(let i=0;i<5;i++)rect(arm,-.8,-1.2-(i+1)*3.2,1.6,3.2,0,i%2?'boom':'boom-r');rect(arm,-.8,-17.2,1.6,16,.6,'detail');rect(arm,-1.1,0,2.2,2.6,.5,'face black');circle(pv,0,0,.5,'face metal');
into(draw);return{g:g0,arm,L,H,s:out?1:-1};}
// The fascia: the brand plate, the throttle knob with its notches and the run lamp.
{const g=group(FRONT(0,D+.02,0));rect(g,10,1.8,42,5.4,1,'face brass');rect(g,10.7,2.5,40.6,4,.6,'detail');text(g,13.4,5.7,'ESKER','plate');text(g,35,5.5,'L–87 · H0','etch micro');}
const knobG=ctl(el('g',{}),'Throttle: open it a notch (Up arrow)'),KF=group(FRONT(0,D+.02,0),knobG);rect(KF,158,1.1,44,6.8,1.2,'face panel');
for(let i=0;i<6;i++){const a=(-120+i*48)*RAD;line(KF,190+2.7*sin(a),4.5-2.7*cos(a),190+3.3*sin(a),4.5-3.3*cos(a),'tick');}
circle(KF,190,4.5,2.2,'face knob');const knobP=line(KF,190,4.5,190,2.6,'ptr');circle(KF,190,4.5,4,'focus-ring');text(KF,173.5,5.2,'THROTTLE','etch micro').style.fontSize='1.8px';
const runL=circle(KF,162.4,4.5,1,'run');text(KF,164.4,5.2,'RUN','etch micro').style.fontSize='1.8px';
// Rails over everything on the ground, flangeways across the deck; then the train's layer (sorted), the front, the steam.
for(const o of[-3.8,3.8])el('path',{d:ring(o,2.5),class:'rail'});for(const o of[-3.8,3.8])el('path',{d:ring(o,3.2),class:'railtop'});
for(const o of[-2.6,2.6])el('path',{d:ring(o,1.64,XS0,XS1,false),class:'flange'});
const trainG=ctl(el('g',{}),'Train: depart, or stop at the next station (Space)');
const XB=[barrier(48.5,80,false),barrier(27.5,115.5,true)];trainG.appendChild(XB[0].g);set(XB[0].g,'class','ghost');
tree(9,112,6.4,19);tree(198,114,5.6,16);
const puffL=el('g',{});
frame([[0,0,-BH,W,D,BH],[5,6,0,14,14,28],[194,12,0,12,12,30],[139,6,0,4,4,40]],10);
// The vehicles, built facing their heading at the origin and moved into place: axes, the faces the viewer sees, parts.
let U=[1,0,0],V=[0,1,0],sU=1,sV=1;const KV=1.07,KW=1.12,RT=3.2;
const LL=(u,v,w)=>[u*U[0]+v*KV*V[0],u*U[1]+v*KV*V[1],RT+(w-RT)*KW],LP=(u,v,w)=>P(...LL(u,v,w)),DN=[0,0,-1],DW=[0,0,-KW],VS=()=>[V[0]*KV,V[1]*KV,0],neg=a=>[-a[0],-a[1],0];
const kOf=n=>clamp((n[0]-n[1]+1)/2),shade=(d,k)=>{if(k>.03)el('path',{d,class:'sh',opacity:f2(k)});};
// A box in the vehicle's frame: the end and side it shows (each decorated, then shaded by how it faces) and its top.
function vbox(u0,u1,v0,v1,w0,w1,m,deco,endDeco){const ue=sU>0?u1:u0,ve=sV>0?v1:v0;
let d=pd([LP(ue,v0,w0),LP(ue,v1,w0),LP(ue,v1,w1),LP(ue,v0,w1)]);el('path',{d,class:'face '+m});if(endDeco)endDeco(group(plane(LL(ue,v0,w1),VS(),DW)),v1-v0,w1-w0);shade(d,kOf(sU>0?U:neg(U)));
d=pd([LP(u0,ve,w0),LP(u1,ve,w0),LP(u1,ve,w1),LP(u0,ve,w1)]);el('path',{d,class:'face '+m});if(deco)deco(group(plane(LL(u0,ve,w1),U,DW)),u1-u0,w1-w0);shade(d,kOf(sV>0?V:neg(V)));
el('path',{d:pd([LP(u0,v0,w1),LP(u1,v0,w1),LP(u1,v1,w1),LP(u0,v1,w1)]),class:'face top '+m});}
// A tube along the vehicle: its silhouette, the end the viewer sees and a highlight along its top.
function tube(u0,u1,v,w,r,m,hi=true){const n=18,rg=u=>Array.from({length:n},(_,i)=>{const a=i/n*2*PI;return LP(u,v+r*cos(a),w+r*sin(a));}),A=rg(u0),B=rg(u1);
el('path',{d:pd(hull([...A,...B])),class:'face '+m});const e=pd(sU>0?B:A);el('path',{d:e,class:'face '+m});shade(e,kOf(sU>0?U:neg(U))*.7);
if(hi)el('path',{d:`M${LP(u0+.6,v-r*.3*sV,w+r*.92).map(f2).join(',')}L${LP(u1-.6,v-r*.3*sV,w+r*.92).map(f2).join(',')}`,class:'hi','stroke-width':.7});}
// An arched roof: the hull of its two end arcs, the half toward the viewer a shade darker, the end it shows.
function roof(u0,u1,vr,w0,rise,m){const n=8,arc=u=>Array.from({length:n+1},(_,i)=>{const v=-vr+2*vr*i/n;return LP(u,v,w0+rise*(1-(v/vr)**2));}),A=arc(u0),B=arc(u1);
el('path',{d:pd(hull([...A,...B])),class:'face top '+m});const h=a=>sV>0?a.slice(n/2):a.slice(0,n/2+1);el('path',{d:pd([...h(A),...h(B).reverse()]),class:'sh',opacity:.5});
const e=pd(sU>0?B:A);el('path',{d:e,class:'face '+m});shade(e,kOf(sU>0?U:neg(U)));}
// An upright cylinder on the vehicle's center line (chimney, dome, valves, vents).
function vcyl(u,z,r,h,m){const p=LL(u,0,z);cylinder(p[0],p[1],p[2],r*KV,h*KW,'z',m);}
// A wheel in the vehicle's side plane; the near ones get spokes (a group that turns) and a hub.
function wheel(u,v,w,r0,near,m){const r=r0*KW,g=group(plane(LL(u,v,w),U,DN));circle(g,0,0,r,'face tyre');if(!near)return null;circle(g,0,0,r*.8,'face '+m);if(r<4){circle(g,0,0,r*.3,'face metal');return null;}const sg=el('g',{},g);
el('path',{d:Array.from({length:10},(_,k)=>{const a=k*PI/5;return`M${f2(r*.24*cos(a))},${f2(r*.24*sin(a))}L${f2(r*.78*cos(a))},${f2(r*.78*sin(a))}`;}).join(''),class:'spoke'},sg);{el('path',{d:`M${f2(-r*.62)},${f2(r*.2)}A${f2(r*.66)},${f2(r*.66)} 0 0 0 ${f2(r*.62)},${f2(r*.2)}Z`,class:'hub'},sg);circle(sg,r*.46,0,.62,'face metal');}
circle(g,0,0,r*.24,'face hub');return sg;}
// Buffers on an end (ue, facing dir), each as long as the coupling's play on a curve allows.
function buffers(ue,dir,len){for(const[i,v]of[[0,-5],[1,5]]){const l=len[i];if(l>=.3)tube(Math.min(ue,ue+dir*l),Math.max(ue,ue+dir*l),v,10.8,1.3,'metal',false);}}
// The tank engine: far wheels, frames, near wheels and rods, footplate and beams, then the body in the order it's seen.
function buildLoco(c){const hid=sU>0?-1:1;
for(const u of[-10,0,10])wheel(u,-4.7*sV,7.6,4.4,false);vbox(-16,16,-3,3,4.6,12,'black');
c.sp=[-10,0,10].map(u=>wheel(u,4.7*sV,7.6,4.4,true,'crimson'));c.rodU=el('path',{class:'rod-u'});c.rod=el('path',{class:'rod'});
buffers(17*hid,hid,c.buf[hid>0?0:1]);vbox(-17,17,-7.5,7.5,12,13.2,'black');for(const s of[hid,-hid])vbox(s>0?15.8:-17,s>0?17:-15.8,-7.5,7.5,8.6,12,'crimson');buffers(-17*hid,-hid,c.buf[hid>0?1:0]);
const cab=()=>{vbox(-17,-4.4,-7.5,7.5,13.2,27.6,'crimson',(g,w)=>{el('path',{d:'M3.2,13V5.4Q3.2,2.6 6,2.6H6.8Q9.6,2.6 9.6,5.4V13Z',class:'face black'},g);rect(g,.8,.8,w-1.6,12.8,.6,'lining');rect(g,10.4,7.6,1.8,1.3,.2,'face brass');},
sU>0?(g,w)=>{for(const v of[3.8,w-3.8])circle(g,v,3.8,1.45,'face win');}:(g,w)=>{for(const v of[2.6,w-5.4])rect(g,v,2.4,2.8,3.4,.6,'face win');});
roof(-17.6,-3.8,8.2,27.6,2.2,'black');},
tank=s=>vbox(-4.4,9,s>0?3.2:-7.5,s>0?7.5:-3.2,13.2,21.4,'crimson',s===sV?(g,w)=>{rect(g,.8,.8,w-1.6,6.6,.5,'lining');text(group(P(...U)[0]>=0?'':`matrix(-1 0 0 1 ${f2(w)} 0)`,g),w/2,5.1,'ESKER','livery');}:null),
boiler=()=>tube(-4.4,11,0,18.8,5,'crimson'),
smoke=()=>{vbox(11,16.6,-4.2,4.2,13.2,16,'black');tube(11,16.6,0,18.8,5.3,'black');if(sU>0){const g=group(plane(LL(16.62,0,18.8),VS(),DW));circle(g,0,0,4.5,'face black');circle(g,0,0,3.7,'detail');line(g,-1.4,0,1.4,0,'detail');line(g,0,-1.4,0,1.4,'detail');}},
tops=()=>{vcyl(2.5,22.4,2.6,2.4,'brass');const c2=LP(2.5,0,24.8),rx=2.6*KV*1.2247,ry=2.6*KV*.7071;el('path',{d:`M${f2(c2[0]-rx)},${f2(c2[1])}A${f2(rx)},${f2(2.6*KW)} 0 0 1 ${f2(c2[0]+rx)},${f2(c2[1])}A${f2(rx)},${f2(ry)} 0 0 1 ${f2(c2[0]-rx)},${f2(c2[1])}Z`,class:'face top brass'});
vcyl(-2.2,23.2,1.1,1.8,'brass');vcyl(-5.2,27.6,.45,2.2,'brass');},
chim=()=>{vcyl(14,23.4,1.9,6,'black');vcyl(14,29.2,2.5,1.4,'black');const t=LP(14,0,30.6);el('ellipse',{cx:f2(t[0]),cy:f2(t[1]),rx:f2(1.7*KV*1.2247),ry:f2(1.7*KV*.7071),class:'face recess'});},
lamp=()=>{vbox(15.4,16.8,-1.1,1.1,13.2,15.8,'black',null,sU>0?g=>circle(g,1.1,1.3,.85,'head'):null);};
if(sU>0){cab();tank(-sV);boiler();tank(sV);tops();smoke();chim();lamp();}else{lamp();smoke();chim();tank(-sV);boiler();tank(sV);tops();cab();}
el('path',{d:pd(hull([LP(-19.4,-7.5,3),LP(19.4,-7.5,3),LP(19.4,7.5,3),LP(-19.4,7.5,3),LP(-17,-7.5,30),LP(17,-7.5,30),LP(-17,7.5,30),LP(17,7.5,30)])),class:'focus-ring'});}
// A coach: far wheels, bogies and underframe, near wheels, then the body (crimson and cream, windows), roof and vents.
function buildCoach(c){const hid=sU>0?-1:1;
for(const b of[-10,10])for(const d of[-3.4,3.4])wheel(b+d,-4.2*sV,5.8,2.6,false);
for(const b of[-10,10])vbox(b-5,b+5,-5.2,5.2,4.6,8.6,'black');for(const b of[-10,10])for(const d of[-3.4,3.4])wheel(b+d,4.2*sV,5.8,2.6,true,'black');
vbox(-15,15,-6,6,8.6,10.6,'black');buffers(15*hid,hid,c.buf[hid>0?0:1]);
vbox(-15,15,-7.2,7.2,10.6,23.4,'crimson',(g,w)=>{rect(g,0,0,w,6.4,0,'fill-cream');el('path',{d:`M0,6.4H${w}M.9,1V12.4M${w-.9},1V12.4`,class:'detail'},g);el('path',{d:[0,1,2,3,4,5].map(i=>`M${f2(1.7+i*4.55)},1.3h3.1v3.9h-3.1Z`).join(''),class:'win'},g);rect(g,.6,7.4,w-1.2,4.6,.4,'lining');},
(g,w)=>{rect(g,0,0,w,6.4,0,'fill-cream');line(g,0,6.4,w,6.4,'detail');rect(g,w/2-1.8,1.3,3.6,3.9,.5,'win');});
if(c.tail&&sU<0){vbox(-15.9,-15,-1,1,10.6,13,'black',null,g=>circle(g,1,1.2,.8,'tail'));}
roof(-15.4,15.4,7.6,23.4,2.4,'roofc');el('path',{d:[-8,0,8].map(u=>{const c=LP(u,0,25.9),rx=.8*KV*1.2247,ry=.8*KV*.7071;return`M${f2(c[0]-rx)},${f2(c[1])}a${f2(rx)},${f2(ry)} 0 1 0 ${f2(2*rx)},0a${f2(rx)},${f2(ry)} 0 1 0 ${f2(-2*rx)},0Z`;}).join(''),class:'face black'});
buffers(-15*hid,-hid,c.buf[hid>0?1:0]);
el('path',{d:pd(hull([LP(-17.4,-7.2,3),LP(17.4,-7.2,3),LP(17.4,7.2,3),LP(-17.4,7.2,3),LP(-15.4,-7.6,25.8),LP(15.4,-7.6,25.8),LP(-15.4,7.6,25.8),LP(15.4,7.6,25.8)])),class:'focus-ring'});}
// The consist: each vehicle's offset from the train's head (the loco's front buffers), its half-length, its pivots' half-spacing.
const CARS=[{k:'loco',off:-19.4,half:17,b:10},{k:'coach',off:-57.4,half:15,b:10},{k:'coach',off:-93.4,half:15,b:10,tail:true}].map(c=>({...c,g:el('g',{},trainG),key:'',buf:[[2.4,2.4],[2.4,2.4]]}));
const TAIL=110.8,QH=1.5*RAD;
function poseCar(c,head){const a=at(head+c.off+c.b),b=at(head+c.off-c.b),h=Math.atan2(a[1]-b[1],a[0]-b[0]);return{x:(a[0]+b[0])/2,y:(a[1]+b[1])/2,h};}
// Buffers compress where two vehicles' ends close up on a curve.
function squeeze(poses){for(let i=0;i<CARS.length-1;i++){const A=poses[i],B=poses[i+1],ha=CARS[i].half,hb=CARS[i+1].half;
for(const[j,v]of[[0,-5*KV],[1,5*KV]]){const ea=[A.x-ha*cos(A.h)-v*sin(A.h),A.y-ha*sin(A.h)+v*cos(A.h)],eb=[B.x+hb*cos(B.h)-v*sin(B.h),B.y+hb*sin(B.h)+v*cos(B.h)],l=clamp((Math.hypot(ea[0]-eb[0],ea[1]-eb[1])-.4)/2,0,2.4);CARS[i].buf[1][j]=l;CARS[i+1].buf[0][j]=l;}}}
function build(c,pose){U=[cos(pose.h),sin(pose.h),0];V=[-sin(pose.h),cos(pose.h),0];sU=U[0]+U[1]>=0?1:-1;sV=V[0]+V[1]>=0?1:-1;c.g.replaceChildren();into(c.g);if(c.k==='loco')buildLoco(c);else buildCoach(c);into(draw);c.U=U;c.V=V;c.sV=sV;}
// Depth: footprints separated by a line are ordered by which side of it faces the viewer; overlapping ones by their centers.
function behind(A,B){for(const Q of[A,B])for(let i=0;i<Q.length;i++){const a=Q[i],b=Q[(i+1)%Q.length],n=[b[1]-a[1],a[0]-b[0]],pa=A.map(p=>p[0]*n[0]+p[1]*n[1]),pb=B.map(p=>p[0]*n[0]+p[1]*n[1]);
if(Math.max(...pa)<=Math.min(...pb)+1e-6)return n[0]+n[1]>0;if(Math.max(...pb)<=Math.min(...pa)+1e-6)return n[0]+n[1]<0;}const c=Q=>Q.reduce((s,p)=>s+p[0]+p[1],0)/Q.length;return c(A)<c(B);}
function sortLayer(items){const out=[],left=[...items];while(left.length){const i=left.findIndex(a=>!left.some(b=>b!==a&&behind(b.fp,a.fp)));out.push(...left.splice(i<0?0:i,1));}let prev=null;for(const it of out){if(it.g.previousSibling!==prev||it.g.parentNode!==trainG)trainG.insertBefore(it.g,prev?prev.nextSibling:trainG.firstChild);prev=it.g;}}
const foot=(p,half)=>{const u=[cos(p.h),sin(p.h)],v=[-u[1],u[0]];return[[1,1],[1,-1],[-1,-1],[-1,1]].map(([a,b])=>[p.x+u[0]*half*a+v[0]*8.2*b,p.y+u[1]*half*a+v[1]*8.2*b]);};
const XBI={g:XB[0].g,fp:[[31,79.5],[51,79.5],[51,82.5],[31,82.5]]};
// Steam: puffs from the chimney with each beat, drifting up and spreading; the whistle's plume; the cylinder cocks.
const PUFFS=[...Array(26)].map(()=>({n:el('circle',{r:0,class:'puff',opacity:0},puffL),t0:-1}));
function puff(p,vel,r0,r1,life,a,now){const q=PUFFS.find(q=>q.t0<0)||PUFFS.reduce((x,y)=>x.t0<y.t0?x:y);Object.assign(q,{p,vel,r0,r1,life,a,t0:now});}
function stepPuffs(now){for(const q of PUFFS){if(q.t0<0)continue;const k=(now-q.t0)/q.life;if(k>=1){q.t0=-1;set(q.n,'opacity',0);continue;}const e=1-(1-k)**2,s=P(q.p[0]+q.vel[0]*e,q.p[1]+q.vel[1]*e,q.p[2]+q.vel[2]*e);set(q.n,'cx',f2(s[0]));set(q.n,'cy',f2(s[1]));set(q.n,'r',f2(q.r0+(q.r1-q.r0)*e));set(q.n,'opacity',f2(q.a*(1-k)**1.4));}}
// State: the stations, the timetable, the throttle, the signal and the crossing; progress; audio after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const NAME=['TARNLOW','BRAEMOSS'],SAY=['Tarnlow','Braemoss'],STOP=[LS+18,LS+ARC+(XR-60)],DWELL=[3200,2400],LAMPS=[L2,[L1]],SIG=LS+ARC,SIGX=LS+ARC+(XR-141),SPEED=[0,18,30,42,54,66],A=22,B=24;
let s=STOP[0],v=0,notch=3,hold=false,phase='dwell',stn=0,next=1,dwellEnd=0,danger=false,sigSkip=false,mode='ind',target=0,done=0,trip=null,xing='open',xT=0,boom=0,flashOn=false,lastFlash=-1,dist=0,beat=0,clack=0,lastPuff=0,cocks=-1e9,whistleT=-1e9,knobA=-999,armA=null,armV=0,lit='',last=0,lastUI=0,note='',noteT=0,ac=null,nb=null;
const ahead=p=>((p-s)%LOOP+LOOP)%LOOP,say=m=>{announcement.textContent=m;},notice=m=>{note=m;noteT=performance.now()+1600;lastUI=0;};
function audio(){try{if(!ac){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ac=new AC();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,d,vol,type='sine',when=0){if(!ac)return;try{const t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(vol,t+.03);g.gain.setValueAtTime(vol,t+Math.max(.03,d-.08));g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.05);}catch(_){}}
function noise(d,vol,f,q=1,when=0){if(!ac)return;try{if(!nb){nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}const t=ac.currentTime+when,src=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();src.buffer=nb;b.type='bandpass';b.frequency.value=f;b.Q.value=q;g.gain.setValueAtTime(vol,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);src.connect(b);b.connect(g);g.connect(ac.destination);src.start(t,Math.random()*.5,d+.05);}catch(_){}}
function whistle(len=.55){whistleT=performance.now();tone(588,len,.018);tone(741,len,.014);noise(len,.006,2600,2);}
// Where the head stops next: the station it calls at (on the timetable, every one), the signal at danger, the end of a trip.
function stopAbs(i){const d=ahead(STOP[i]);return s+(d>LOOP-.5?d-LOOP:d);}
function depart(){if(phase!=='dwell')return;phase='run';next=(stn+1)%2;cocks=performance.now();whistle(.3);say(`Departing ${SAY[stn]} for ${SAY[next]}.`);lastUI=0;}
function arrive(i){phase='dwell';stn=i;next=(i+1)%2;v=0;dwellEnd=mode==='ind'&&!hold?performance.now()+DWELL[i]*(reduced.matches?1.4:1):Infinity;tone(196,.18,.01,'triangle');
if(mode!=='ind'&&trip&&i===trip.to){if(done===1)complete();else say(`Arrived at ${SAY[i]}.`);}else say(hold?`Held at ${SAY[i]}. Space departs.`:`Calling at ${SAY[i]}.`);lastUI=0;}
function complete(){done=2;whistle(.9);say(`Arrived at ${SAY[stn]}. Complete.`);lastUI=0;}
function spaceKey(){audio();if(mode!=='ind'){notice('FOLLOWING THE PROGRESS');return;}if(phase==='dwell'){hold=false;dwellEnd=0;depart();}else if(v<.5&&notch===0){notch=3;notice('THROTTLE 3/5');}else{hold=!hold;say(hold?`Stopping at ${SAY[next]} and holding there.`:`Calling at ${SAY[next]} as timetabled.`);}lastUI=0;}
function throttle(d){audio();const n=clamp(notch+d,0,5);if(n===notch)return;notch=n;tone(320+n*60,.05,.012,'square');say(n?`Throttle ${n} of 5: ${SPEED[n]} kilometers an hour.`:'Throttle closed.');lastUI=0;}
function signalKey(){audio();danger=!danger;tone(danger?150:210,.12,.03,'triangle');noise(.08,.02,900,1.4);const d=ahead(SIG);sigSkip=danger&&!reduced.matches&&d<LOOP/2&&v*v/(2*B*1.6)>d+.5;
say(danger?(sigSkip?'Signal at danger, behind this train.':'Signal at danger: the train will stop at it.'):'Signal cleared.');lastUI=0;}
function whistleKey(){audio();whistle();say('Whistle.');}
// Progress: the trip from the station it stands at (or last left) to the next; a share moves it along, done brings it in.
function startTrip(){const from=phase==='dwell'?stn:(next+1)%2,to=(from+1)%2,s0=phase==='dwell'?s:stopAbs(from)-LOOP;trip={from,to,s0,s1:s0+((STOP[to]-STOP[from])%LOOP+LOOP)%LOOP};}
function setProgress(p){if(p==null||!isFinite(p)){if(mode!=='ind'){mode='ind';done=0;trip=null;hold=false;if(phase==='dwell')dwellEnd=performance.now()+DWELL[stn];}lastUI=0;return;}
if(mode==='ind'||done===2||trip&&s>=trip.s1-.5&&p<1){done=0;startTrip();}mode='det';target=clamp(+p);if(phase==='dwell'&&target>0&&s<trip.s1-.5)depart();lastUI=0;}
function finish(){if(done)return;if(mode==='ind')startTrip();mode='det';target=1;done=1;if(phase==='dwell'&&s<trip.s1-.5)depart();else if(phase==='dwell')complete();lastUI=0;}
window.figure={setProgress,done:finish};
bind(trainG,spaceKey);bind(sigG,signalKey);bind(knobG,()=>throttle(notch===5?-5:1));
const act={' ':spaceKey,arrowup:()=>throttle(1),arrowdown:()=>throttle(-1),s:signalKey,w:whistleKey};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.toLowerCase(),f=act[k];if(!f)return;e.preventDefault();if(!e.repeat||k==='arrowup'||k==='arrowdown')f();});
// The texts: speed and the next stop; the state line says what the train is doing and what's in its way.
function texts(now){const sp=Math.round(v),pct=Math.round((done?clamp((s-trip.s0)/(trip.s1-trip.s0)):target)*100),toSig=ahead(SIG),sig=danger&&!sigSkip&&phase==='run'&&toSig<LOOP/2;
const ro=mode==='ind'?`${sp} KM/H · NEXT: ${NAME[phase==='dwell'?(stn+1)%2:next]}`:done===2?'PROGRESS 100% · ARRIVED':`PROGRESS ${pct}% · NEXT: ${NAME[trip.to]}`;
let st;if(now<noteT)st=note;else if(done===2)st=`COMPLETE · ARRIVED AT ${NAME[stn]}`;else if(sig&&toSig<.6&&v<.5)st='AT THE SIGNAL · S CLEARS IT';else if(sig&&toSig<v*v/(2*B)+8&&v>.5)st='SIGNAL AT DANGER · BRAKING';
else if(phase==='dwell')st=mode!=='ind'?(done?`FINISHING · AT ${NAME[stn]}`:stn===trip.to?`AT ${NAME[stn]} · ${pct}%`:`AT ${NAME[stn]} · WAITING TO START`):dwellEnd===Infinity?`HELD AT ${NAME[stn]} · SPACE TO DEPART`:`AT ${NAME[stn]} · DEPARTS IN ${Math.max(1,Math.ceil((dwellEnd-now)/1000))} S`;
else if(mode!=='ind')st=done?`FINISHING · TO ${NAME[trip.to]}`:v>.5?`RUNNING TO ${pct}% · ${sp} KM/H`:`WAITING AT ${pct}%`;
else if(notch===0)st=v>.5?'THROTTLE CLOSED · BRAKING':'STANDING · THROTTLE CLOSED';
else if(stopAbs(next)-s<v*v/(2*B)+6&&v>.5)st=`STOPPING AT ${NAME[next]}${hold?' · TO HOLD':''}`;else st=`${xing!=='open'&&ahead(XS0)<LOOP/2?'CROSSING CLOSED':'RUNNING'} · THROTTLE ${notch}/5${hold?' · HOLD AT '+NAME[next]:''}`;
return[ro,st];}
function tick(now){const dt=Math.min(.05,(now-(last||now))/1000),red=reduced.matches;last=now;
// The timetable: a dwell ends and the train departs (a held one waits for Space); progress departs on its own.
if(phase==='dwell'&&mode==='ind'&&now>=dwellEnd)depart();
// Authority, how far the head may go: its next stop, the signal at danger, a progress mark, the crossing until it's down.
let goal=phase==='dwell'?s:stopAbs(next);if(mode!=='ind'&&trip)goal=Math.min(goal,done?trip.s1:trip.s0+(trip.s1-trip.s0)*target);
if(danger&&!sigSkip&&ahead(SIG)<LOOP/2)goal=Math.min(goal,s+ahead(SIG));
const toX=ahead(XS0),onX=toX>LOOP-(TAIL+XS1-XS0+3),want=goal-s>toX+.5&&toX<LOOP/2&&toX<v*v/(2*B)+v*3.2+30;
if(!red&&(want||onX)){if(xing==='open'||xing==='raising'){xing='warn';xT=now;}}else if(xing!=='open'&&xing!=='raising'){xing='raising';xT=now;}
if(!red&&xing!=='closed'&&toX<LOOP/2)goal=Math.min(goal,v<.5&&toX<30?s:s+toX-2.5);
// Motion: up to the throttle's speed, easing in; braking so it comes to rest right at the goal.
const vmax=mode==='ind'?SPEED[notch]:Math.max(SPEED[notch],done?42:30);
if(red){if(phase==='run'&&vmax>0&&goal>s+.5)s=goal;v=0;}else{const vb=sqrt(2*B*Math.max(0,goal-s)+6.25)-2.5,lim=Math.min(vmax,vb);
if(v<lim)v=Math.min(lim,v+A*dt*clamp((lim-v)/7,.18,1)*clamp(.4+v/12));else v=Math.max(lim,v-B*1.6*dt);s=Math.min(s+v*dt,goal);if(goal-s<.02&&v<.6)v=0;dist+=v*dt;}
if(phase==='run'&&v===0&&abs(stopAbs(next)-s)<.3)arrive(next);
if(sigSkip&&ahead(SIGX)>LOOP-4)sigSkip=false;
// The crossing: lights, then booms down; up again once the tail has cleared.
if(xing==='warn'&&now-xT>700){xing='lowering';xT=now;}if(xing==='lowering'){boom=red?1:Math.max(boom,clamp((now-xT)/1400));if(boom>=1)xing='closed';}else if(xing==='closed')boom=1;else if(xing==='raising'){boom=red?0:Math.min(boom,1-clamp((now-xT)/1100));if(boom<=0){xing='open';boom=0;}}
const on=xing!=='open',ph=red?0:Math.floor(now/360)%2;if(on!==flashOn||ph!==lastFlash){flashOn=on;lastFlash=ph;const b=XB[1];b.L.forEach((l,i)=>{const lt=on&&(red||i===ph);set(l,'class',lt?'xl on':'xl');b.H[i].style.opacity=lt?.55:0;});if(on&&!red&&ac)tone(ph?1480:1320,.12,.006,'triangle');}
const ang=ease(boom)*90;XB.forEach(b=>set(b.arm,'transform',`rotate(${f2(b.s*ang)})`));
// The vehicles: posed on the track, rebuilt when their heading turns, wheels and rods turned, sorted by depth.
const poses=CARS.map(c=>poseCar(c,s));squeeze(poses);
CARS.forEach((c,i)=>{const p=poses[i],q=Math.round(p.h/QH),key=q+'|'+c.buf.flat().map(l=>Math.round(l/.3)).join();if(key!==c.key){c.key=key;c.buf=c.buf.map(e=>e.map(l=>Math.round(l/.3)*.3));build(c,{h:q*QH});}set(c.g,'transform',tr(p.x,p.y,0));c.fp=foot(p,c.half+2.4);});
sortLayer([...CARS,XBI]);
const wa=dist/4.4,lc=CARS[0];lc.sp.forEach(g=>set(g,'transform',`rotate(${f2(wa/RAD%360)})`));
{U=lc.U;V=lc.V;const c0=LL(-10,4.7*lc.sV+.6,7.6),r=4.4*.46*KW,o=[r*cos(wa)*U[0],r*cos(wa)*U[1],-r*sin(wa)],a=P(c0[0]+o[0],c0[1]+o[1],c0[2]+o[2]),b=P(c0[0]+o[0]+20*U[0],c0[1]+o[1]+20*U[1],c0[2]+o[2]),d=`M${a.map(f2).join(',')}L${b.map(f2).join(',')}`;set(lc.rod,'d',d);set(lc.rodU,'d',d);}
// Steam and sound: a beat four times a wheel turn while the regulator's open, cocks on starting, the whistle, rail joints.
if(!red){const lp=poses[0],hU=[cos(lp.h),sin(lp.h)],working=phase==='run'&&v>.3&&v<vmax+2&&goal-s>v*v/(2*B)+3,bt=Math.floor(wa/(PI/2));
if(bt!==beat){beat=bt;if(working){const k=clamp(v/50);puff([lp.x+14*hU[0],lp.y+14*hU[1],34],[-hU[0]*v*.12+(rand()-.5)*3,-hU[1]*v*.12+(rand()-.5)*3,15-6*k],1.6,6.2-2.4*k,1100-300*k,.85-.3*k,now);if(ac)noise(.09,.012+.01*(1-k),520,1.2);}}
if(phase==='dwell'&&now-lastPuff>1500){lastPuff=now;puff([lp.x-2.2*hU[0],lp.y-2.2*hU[1],28.2],[(rand()-.5)*2,(rand()-.5)*2,10],1,3.6,1400,.5,now);}
if(now-cocks<1400&&v<14&&now-lastPuff>110){lastPuff=now;for(const sd of[-1,1])puff([lp.x+12*hU[0]-sd*9.6*hU[1],lp.y+12*hU[1]+sd*9.6*hU[0],5],[-sd*hU[1]*9+(rand()-.5)*3,sd*hU[0]*9+(rand()-.5)*3,3],1.4,4.6,800,.7,now);}
if(now-whistleT<650&&now-lastPuff>55){lastPuff=now;puff([lp.x-5.2*hU[0],lp.y-5.2*hU[1],33.4],[(rand()-.5)*2,(rand()-.5)*2,18],.9,3.6,800,.85,now);}
const j=Math.floor(dist/18);if(j!==clack){clack=j;if(ac&&v>6){noise(.025,.012*clamp(v/40),2400,3);noise(.025,.01*clamp(v/40),2000,3,Math.min(.2,9/v));}}}
stepPuffs(now);
// The fascia's knob turns to its notch and the run lamp lights while the train moves; the signal's arm drops and lifts.
const ka=-120+notch*48;knobA=red||knobA<-200||abs(ka-knobA)<.05?ka:knobA+(ka-knobA)*clamp(dt*10);set(knobP,'transform',`rotate(${f2(knobA)} 190 4.5)`);set(runL,'class',v>.3?'run on':'run');
const ta=danger?0:-40;if(armA==null||red){armA=ta;armV=0;}else{armV+=((ta-armA)*190-armV*15)*dt;armA+=armV*dt;if(abs(ta-armA)<.05&&abs(armV)<.5){armA=ta;armV=0;}}set(sigArm,'transform',`rotate(${f2(armA)})`);set(sigLamp,'class',danger?'sl r':'sl g');
// On completion the destination's lamps turn green.
const lk=done===2?'g'+stn:'';if(lk!==lit){lit=lk;LAMPS.forEach((ls,i)=>ls.forEach(l=>set(l,'class',done===2&&i===stn?'lamp g':'lamp')));}
if(!lastUI||now-lastUI>120){lastUI=now;const[ro,st]=texts(now);if(readout.textContent!==ro)readout.textContent=ro;if(stateLabel.textContent!==st)stateLabel.textContent=st;}
requestAnimationFrame(tick);}
dwellEnd=performance.now()+2600;requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
