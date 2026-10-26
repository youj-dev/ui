// @ts-nocheck
/* VAARDEN BK–2 · Drawbridge. Drawn for this package in the lab figures' form: its stylesheet, defs and script, on the
 * engine's kit. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--paint:#eceae4;--paint-top:#fbfaf6;--paint-side:#d2d0c9;--stone:#cdc8bd;--stone-top:#e0dcd2;--stone-side:#b3ada1;--asph:#7a7975;--asph-top:#8a8985;--asph-side:#64635f;--deck:#a49b8d;--deck-top:#bdb5a7;--deck-side:#8b8376;--plank:#9c9385;--walk:#d6d3cb;--walk-top:#e7e5df;--brick:#b8664b;--brick-top:#c97c62;--brick-side:#99523b;--roof:#4d5359;--roof-top:#626970;--roof-side:#3d4247;--iron:#434445;--iron-top:#5c5d5e;--iron-side:#313233;--hull:#2f4b5e;--teak:#c4a06a;--teak-top:#d8b986;--teak-side:#a6834f;--cockpit:#9c7a4c;--water:#d3e3e5;--water-l:#a7c3c8;--sail:#f1ead9;--flag:#d9483b;--pane:#dce7e9;--stripe:#e04034;--mark:#f7f6f1;--wet:#6f7d6a;--warm:#ffcf7a}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--paint:#c6c5c1;--paint-top:#ebeae6;--paint-side:#939390;--stone:#aca8a1;--stone-top:#d2cec4;--stone-side:#7c7975;--asph:#5f5e5b;--asph-top:#7b7a77;--asph-side:#3e3d3b;--deck:#857d70;--deck-top:#aaa293;--deck-side:#544e45;--plank:#857d70;--walk:#b4b2ad;--walk-top:#d8d6d1;--brick:#9b553e;--brick-top:#bc745b;--brick-side:#6b3727;--roof:#414448;--roof-top:#5b6268;--roof-side:#2a2c2e;--iron:#373838;--iron-top:#565657;--iron-side:#202021;--hull:#263e4e;--teak:#a58658;--teak-top:#caad7d;--teak-side:#745b35;--cockpit:#7c6140;--water:#a8b5b7;--water-l:#8ea5aa;--sail:#cbc5b7;--flag:#b73b30;--pane:#e9c27c;--stripe:#bd342a;--mark:#d4d3cf;--wet:#3e463b;--warm:#ffd27f;--line:#444443}svg .lantern{opacity:.6}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.plate{fill:var(--ink);font:600 1.45px Georgia,'Times New Roman',serif;letter-spacing:.2px;text-anchor:middle;stroke:none}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.paint{fill:var(--paint)}.top.paint{fill:var(--paint-top)}.side.paint{fill:var(--paint-side)}.stone{fill:var(--stone)}.top.stone{fill:var(--stone-top)}.side.stone{fill:var(--stone-side)}.asph{fill:var(--asph)}.top.asph{fill:var(--asph-top)}.side.asph{fill:var(--asph-side)}.deck{fill:var(--deck)}.top.deck{fill:var(--deck-top)}.side.deck{fill:var(--deck-side)}.plank{fill:none;stroke:var(--plank);stroke-width:.35}.walk{fill:var(--walk-top)}
.brick{fill:var(--brick)}.top.brick{fill:var(--brick-top)}.side.brick{fill:var(--brick-side)}.roof{fill:var(--roof)}.top.roof{fill:var(--roof-top)}.side.roof{fill:var(--roof-side)}.iron{fill:var(--iron)}.top.iron{fill:var(--iron-top)}.side.iron{fill:var(--iron-side)}
.teak{fill:var(--teak)}.top.teak{fill:var(--teak-top)}.side.teak{fill:var(--teak-side)}.hull{fill:var(--hull)}.stripe{fill:var(--mark)}.cockpit{fill:var(--cockpit)}.pane{fill:var(--pane)}.mark{fill:var(--mark);stroke:none}
.water{fill:var(--water);stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke}.ripple{fill:none;stroke:var(--water-l);stroke-width:.75;stroke-linecap:round;stroke-dasharray:7 3 2 4}.wake{fill:none;stroke:var(--mark);stroke-width:.6;stroke-linecap:round;opacity:0}
.joint{fill:none;stroke:var(--line);stroke-width:.4;vector-effect:non-scaling-stroke;opacity:.3}.wet{fill:var(--wet);stroke:none;opacity:.55}.under{fill:var(--shadow);stroke:none;filter:url(#soft);pointer-events:none}
.rod-o{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.rod{fill:none;stroke:var(--paint-top);stroke-linecap:round;stroke-linejoin:round}.rod.iron{stroke:var(--iron)}.rod.teak{stroke:var(--teak-top)}.rod.sail{stroke:var(--sail)}.dash{fill:none;stroke:var(--stripe);stroke-width:1.3;stroke-dasharray:3 3}
.flag{fill:var(--flag);stroke:var(--line);stroke-width:.3;vector-effect:non-scaling-stroke}.horn{fill:none;stroke:var(--ink);stroke-width:.55;stroke-linecap:round;opacity:0}
.lamp{fill:var(--off);stroke:var(--line);stroke-width:.3;vector-effect:non-scaling-stroke}.lamp.r{fill:var(--fault)}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r,.lamp.g,.lamp.a{filter:url(#glow);stroke:none}.halo,.lantern{opacity:0;filter:url(#lampHalo);pointer-events:none}.lantern{fill:var(--warm)}.halo.r{fill:var(--fault);opacity:.5}.halo.g{fill:var(--ok);opacity:.5}.halo.a{fill:var(--warn);opacity:.55}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<filter id="lampHalo" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation="2.2"/></filter>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* VAARDEN BK–2 over a canal. World: x lower-right (the road), y lower-left (the canal; front faces +y), z up; 1 unit ≈ 10 cm.
Part                          x      y      z      w      d      h
canal                  water between the quays (x 0–60), y −50…81, its open ends smooth curves; ripples, the span's shade, the wake
left quay (stone)           −24     −6      0     24     36     18   road y 0–24 with a walk either side, stop line, bollards, wet foot
right quay (stone)           60    −20      0     24     50     18   the same, the back walk widened for the tower
leaves (2)             hinged at x 0 / 60, deck top z 18; 30 × 24 × 3.5, planked, railings on both edges, span lamps
portals (2)            posts 2.5 × 2.5 × 40 at y −2.5 / 24 on the quay edge, knee braces, lintel z 54–57.6 with a lantern; balance beams outboard
                       (y −4.9…−2.5, 26.5…28.9) pivoted at z 50 over the hinge, 16 back to the ballast box between them and
                       23 forward to the hangers at 22: beam, hanger and leaf make a parallelogram, so the hangers stay plumb
barriers (2)             −20 / 80     27     18   pedestal 3 × 3 × 8.5, road signal on top, arm 26 across the road
tower                        68    −18     18     10     10     18   brick; glazed control room 11.2 square × 9; slate roof to 51, beacon
boat (× 1.2)           centered on x 30, waits at y 56: hull 10.6 × 24.6, cabin, mast to z 40, sail furled on the boom
Painter: shadow, water, boat (behind), left quay and barrier, left portal and leaf, boat (under), right leaf, right quay,
tower, right portal, right barrier, boat (in front). */
let root=document.getElementById('drawing');
const{P,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,box,cylinder,frame}=kit(()=>root);
// Figure helpers: vectors, smooth curves, boxes and rods posed in place, lamps, controls.
const draw=root,into=g=>root=g,RAD=Math.PI/180,VIEW=[1,1,1],f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>t*t*(3-2*t);
const heavy=(t,rock=0)=>(t<.5?4*t*t*t:1-(-2*t+2)**3/2)+rock*Math.sin(Math.PI*clamp((t-.8)/.2))*(t>.8);
const add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],pt=p=>P(...p).map(f2).join(',');
const shade=n=>n[2]>.6?'top ':n[0]>n[1]?'side ':'',seg=list=>list.map(([a,b])=>`M${pt(a)}L${pt(b)}`).join('');
/* A smooth curve through world points (Catmull-Rom as cubic Béziers), closed or open. */
function smooth(pts,close=true){const q=pts.map(p=>P(...p)),n=q.length;let d=`M${q[0].map(f2).join(',')}`;for(let i=0;i<(close?n:n-1);i++){const a=q[close?(i+n-1)%n:Math.max(0,i-1)],b=q[i],c=q[(i+1)%n],e=q[close?(i+2)%n:Math.min(n-1,i+2)];
d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d+(close?'Z':'');}
/* The convex hull of projected world points, as a closed path: a hull side from its deck and waterline outlines. */
function hull(pts){const q=pts.map(p=>P(...p)).sort((a,b)=>a[0]-b[0]||a[1]-b[1]),cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],up=[];
for(const p of q){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(const p of q.reverse()){while(up.length>1&&cr(up[up.length-2],up[up.length-1],p)<=0)up.pop();up.push(p);}
return`M${lo.slice(0,-1).concat(up.slice(0,-1)).map(p=>p.map(f2).join(',')).join('L')}Z`;}
/* An oriented box redrawn in place: three paths for the faces that can face the viewer; mat(axis, sign) names each
 * face's material (null leaves it out). */
function obox(g,mat){const s=[0,1,2].map(()=>el('path',{},g));s.mat=mat;return s;}
function obx(s,c,ax){let k=0;for(let i=0;i<3;i++)for(const sg of[1,-1]){const n=mul(ax[i][0],sg),m=s.mat(i,sg);if(m==null||dot(n,VIEW)<=.001||k>2)continue;const[B,b]=ax[(i+1)%3],[E,e]=ax[(i+2)%3],f=add(c,mul(n,ax[i][1])),q=(u,v)=>add(add(f,mul(B,u*b)),mul(E,v*e));
set(s[k],'d',poly([q(1,1),q(-1,1),q(-1,-1),q(1,-1)],true));set(s[k++],'class','face '+shade(n)+m);}for(;k<3;k++)set(s[k],'d','');}
/* A rod: an outlined stroke, returned as its setter. */
function rod(g,cls,w,d=''){const o=el('path',{d,class:'rod-o','stroke-width':w+.8},g),i=el('path',{d,class:'rod '+cls,'stroke-width':w},g);return v=>{set(o,'d',v);set(i,'d',v);};}
function lamp(g,r,halo=true){return{h:halo?el('circle',{r:f2(r*3.4),class:'halo'},g):null,n:el('circle',{r,class:'lamp'},g),c:''};}
function lit(L,c){if(L.c!==c){L.c=c;set(L.n,'class','lamp'+(c?' '+c:''));if(L.h)set(L.h,'class','halo'+(c?' '+c:''));}}
function place(L,p){const q=P(...p).map(f2);for(const n of[L.n,L.h])if(n){set(n,'cx',q[0]);set(n,'cy',q[1]);}}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
// The floor shadow, then the canal: water to the quays, its open ends rounding off in smooth curves, ripples and the wake.
const sh=P(30,5,0);for(const c of['shadow stage-floor','stage-contact'])el('ellipse',{cx:f2(sh[0]),cy:f2(sh[1]+4),rx:64,ry:23,class:c});
const WATER=[[0,30],[0,52],[3,67],[13,77],[30,80.5],[47,77],[57,67],[60,52],[60,30],[62,10],[62,-12],[60,-22],[60,-32],[55,-42],[44,-48],[30,-50],[16,-48],[5,-42],[0,-32],[0,-18],[-2,-4],[-2,14]].map(([x,y])=>[x,y,0]);
el('path',{d:smooth(WATER),class:'water'});
const RIPPLES=[[[6,40],[13,41.6],[20,40]],[[40,46],[47,47.6],[54,46]],[[8,62],[15,63.6],[22,62]],[[38,68],[44,69.2],[50,68]],[[22,74],[28,75],[34,74]],[[6,-14],[13,-12.4],[20,-14]],[[36,-22],[43,-20.4],[50,-22]],[[14,-36],[21,-34.4],[28,-36]],[[38,-42],[44,-40.8],[50,-42]]].map(l=>el('path',{d:smooth(l.map(([x,y])=>[x,y,0]),false),class:'ripple'}));
const under=el('path',{d:poly([[0,-1,0],[60,-1,0],[60,29,0],[0,29,0]],true),class:'under'});
const BS=1.2,bc=P(30,0,0),bscale=`translate(${f2(bc[0])} ${f2(bc[1])}) scale(${BS}) translate(${f2(-bc[0])} ${f2(-bc[1])})`;
const wakeG=el('g',{class:'wake'}),wakeS=group(bscale,wakeG),wk=pts=>el('path',{d:smooth(pts.map(([x,y])=>[30+x,y,0]),false)},wakeS);
for(const s of[1,-1]){wk([[s*3.9,11.6],[s*6.2,18],[s*9.6,26],[s*12.4,33]]);wk([[s*.7,-13.8],[s*4.8,-9],[s*7,-3],[s*7.8,3]]);}wk([[0,12.6],[.7,19],[-.6,25.5]]);
const BOAT_BACK=el('g',{});
// The quays: stone blocks to the road, their courses and coping, the road and walks on top, a stop line before each barrier.
function quay(x,y,d,ux,walk0){box(x,y,0,24,d,18,1,'stone');const q=group(SIDE(x+24,y+d,18)),f=group(FRONT(x,y+d,18));
for(const[g,w]of[[q,d],[f,24]]){rect(g,0,16.3,w,1.7,0,'wet');line(g,0,2.4,w,2.4,'joint');for(let v=6.2;v<18;v+=3.9)line(g,0,v,w,v,'joint');for(let u=5,r=0;u<w;u+=7,r++)line(g,u+(r%2)*3.5,2.4,u+(r%2)*3.5,6.2,'joint');}
const t=group(TOP(x,y,18.02));rect(t,0,0,24,walk0,0,'face walk');rect(t,0,walk0,24,24,0,'face top asph');rect(t,0,walk0+24,24,6,0,'face walk');rect(t,ux,walk0+1,1.1,22,0,'mark');}
quay(-24,-6,36,2.4,6);
const bollard=(x,y)=>{const c=cylinder(x,y,18,1.1,2.6,'z','iron');circle(c.face,0,0,1.5,'face top iron');};bollard(-3,28.2);bollard(-3,-4.2);
// A barrier: pedestal with its road signal, the striped arm on a pivot at its side (posed by poseBarrier), lamps on the arm.
function barrier(x){const r={x,pv:[x+1.9,27,24.5]};box(x-1.5,25.5,18,3,3,8.5,.6,'paint');{const f=group(FRONT(x-1.5,28.5,26.5));rect(f,0,1.4,3,1.5,0,'face iron');}
box(x-1,26,26.5,2,1.6,4.6,.5,'iron');r.sR=lamp(root,.8);r.sG=lamp(root,.8);place(r.sR,[x,27.62,29.8]);place(r.sG,[x,27.62,27.7]);
const g=el('g',{});r.tail=rod(g,'iron',2.1);r.arm=rod(g,'',1.3);r.dash=el('path',{class:'dash',pathLength:24},g);circle(group(SIDE(x+1.95,27,24.5)),0,0,.95,'face top paint');r.l1=lamp(g,.62,false);r.l2=lamp(g,.62,false);return r;}
const BL=barrier(-20);
// A side of the bridge: its leaf (deck, planks, railings, span lamps), beams with the ballast box and hangers, posts and lintel.
const LS={x0:0,sg:1},RS={x0:60,sg:-1};
function farParts(s){const g=el('g',{});s.fH=rod(g,'',.9);s.fB=obox(g,()=>'paint');}
/* The ballast box: behind the left portal's posts but in front of the right one's (it swings on the land side). */
const ballast=s=>{s.bx=obox(el('g',{}),()=>'iron');};
function nearParts(s){const g=el('g',{});s.nH=rod(g,'',.9);s.nB=obox(g,()=>'paint');circle(group(FRONT(s.x0,28.95,50),g),0,0,1.05,'face top paint');}
function leafParts(s){const g=el('g',{});s.leafG=g;s.rF=el('g',{},g);s.railF=rod(s.rF,'',.65);s.deck=el('g',{},g);s.dk=obox(s.deck,(i,k)=>i===0&&k<0?null:i===2&&k>0?'deck':'paint');s.pl=el('path',{class:'plank'},s.deck);s.ul=el('path',{class:'detail'},s.deck);
s.lampR=lamp(s.deck,1.12);s.lampG=lamp(s.deck,1.12);s.rN=el('g',{},g);s.railN=rod(s.rN,'',.65);s.top=true;}
/* A post on the quay edge with its knee brace up to the lintel (drawn with the post, so the near parts cover it), and the lintel
 * with its lantern (lit at night). */
const post=(x,y)=>{const brace=()=>rod(root,'',.9,seg(y<0?[[[x+1.25,0,47.5],[x+1.25,6,54]]]:[[[x+1.25,24,47.5],[x+1.25,18,54]]]));if(y>0)brace();box(x,y,18,2.5,2.5,40,.5,'paint');if(y<0)brace();},lintel=x=>{box(x-.5,-2.9,54,3.5,29.8,3.6,.5,'paint');rod(root,'iron',.45,seg([[[x+1.25,12,57.6],[x+1.25,12,60.4]]]));box(x+.45,11.2,60.4,1.6,1.6,2.4,.3,'pane');box(x+.25,11,62.8,2,2,.6,.3,'iron');const q=P(x+1.25,12,61.6);el('circle',{cx:f2(q[0]),cy:f2(q[1]),r:4,class:'lantern'});};
farParts(LS);ballast(LS);post(-2.5,-2.5);leafParts(LS);post(-2.5,24);nearParts(LS);lintel(-2.5);
const BOAT_MID=el('g',{});
leafParts(RS);
quay(60,-20,50,20.4,20);bollard(63,28.2);
// The tower: a brick shaft with its door and plate, the glazed control room, a slate roof and the beacon; a click approves.
const TW=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Control tower: approve the passage (Space)'});into(TW);
box(68,-18,18,10,10,18,.8,'brick');{const f=group(FRONT(68,-8,36));rect(f,3.6,10.6,2.8,7.4,.4,'face iron');rect(f,.9,5.5,8.2,2.4,.4,'face paint');text(f,5,7.2,'VAARDEN','plate');
for(const v of[3,9.4])line(f,0,v,10,v,'joint');const s=group(SIDE(78,-8,36));rect(s,3.4,4.4,3.2,4.4,.4,'face pane');line(s,5,4.4,5,8.8,'detail');for(const v of[3,9.4,13.6])line(s,0,v,10,v,'joint');}
box(67.4,-18.6,36,11.2,11.2,9,.8,'paint');for(const g of[group(FRONT(67.4,-7.4,45)),group(SIDE(78.6,-7.4,45))]){rect(g,1,1.4,9.2,5.8,.4,'face pane');for(const u of[4.07,7.13])line(g,u,1.4,u,7.2,'detail');line(g,0,7.9,11.2,7.9,'detail');}
{const A=[73,-13,51],c=[[66.6,-7.4],[79.4,-7.4],[79.4,-19.4]].map(([x,y])=>[x,y,45]);el('path',{d:poly([c[0],c[1],A],true),class:'face roof'});el('path',{d:poly([c[1],c[2],A],true),class:'face side roof'});
el('path',{d:poly([c[0],c[1],[c[1][0],c[1][1],44.3],[c[0][0],c[0][1],44.3]],true),class:'face paint'});el('path',{d:poly([c[1],c[2],[c[2][0],c[2][1],44.3],[c[1][0],c[1][1],44.3]],true),class:'face side paint'});rod(TW,'iron',.45,seg([[A,[73,-13,52.2]]]));}
const beacon=lamp(TW,.95);place(beacon,[73,-13,52.8]);
{const sil=[[66.6,-7.4,18],[79.4,-7.4,18],[79.4,-19.4,18],[79.4,-19.4,54.5],[66.6,-19.4,54.5],[66.6,-7.4,54.5]];el('path',{d:poly(sil,true),class:'hit'});el('path',{d:poly(sil,true),class:'focus-ring'});}
into(draw);
farParts(RS);post(60,-2.5);post(60,24);ballast(RS);nearParts(RS);lintel(60);
const BR=barrier(80),BARRIERS=[BL,BR];
const BOAT_FRONT=el('g',{});
// The boat, drawn once about the canal's axis (x 30) at y 0, scaled up and moved by a translation: the hull side is the
// convex hull of its deck and waterline outlines, then the sheer stripe, teak deck, cockpit, stays, mast, cabin, furled sail.
const boatG=el('g',{});into(group(bscale,boatG));
const half=u=>u<1?5.3*Math.sin(clamp((u+13)/14)*Math.PI/2)**.72:5.3-1.2*((u-1)/10.6)**2;
const outline=(z,k,u0,u1)=>{const s=[...Array(21)].map((_,i)=>u0+(u1-u0)*i/20);return[...s.map(u=>[30+half(u)*k,u,z]),...s.reverse().map(u=>[30-half(u)*k,u,z])];};
const DECK=outline(4.2,1,-13,11.6);
el('path',{d:hull([...DECK,...outline(.4,.88,-11.4,10.8)]),class:'face hull'});el('path',{d:hull([...DECK,...DECK.map(([x,y,z])=>[x,y,z-1.2])]),class:'face stripe'});
el('path',{d:poly(DECK,true),class:'face top teak'});el('path',{d:poly(outline(4.24,.84,-11.2,10.8),true),class:'detail'});el('path',{d:poly([[27.4,4,4.24],[32.6,4,4.24],[32.6,9.8,4.24],[27.4,9.8,4.24]],true),class:'face cockpit'});
el('path',{d:seg([[[30,-5.5,38.6],[30,-12.7,4.6]]]),class:'detail'});rod(root,'',1,seg([[[30,-5.5,4.2],[30,-5.5,40]]]));
box(27.2,-4.6,4.2,5.6,7.6,4,.8,'paint');{const s=group(SIDE(32.8,3,8.2));for(const u of[1.2,4.3])rect(s,u,1.1,2.1,1.4,.4,'face pane');rect(group(FRONT(27.2,3,8.2)),2,1,1.6,3,.3,'face teak');}box(26.9,-4.9,8.2,6.2,8.2,.7,.5,'teak');
rod(root,'teak',.8,seg([[[30,-5.2,10.4],[30,9.6,11]]]));rod(root,'sail',2.1,seg([[[30,-4.8,11.6],[30,8,11.9]]]));el('path',{d:seg([-2,1,4,7].map(y=>[[29.2,y,11.2],[30.8,y,12.6]])),class:'detail'});
el('path',{d:seg([[[30,-5.5,39.6],[30,11.2,4.5]]]),class:'detail'});const flag=el('path',{class:'flag'});
const hornG=el('g',{}),HORN=[2.4,4.4,6.4].map(r=>{const c=P(30,-6,13);return el('path',{d:`M${f2(c[0]+r*.5)},${f2(c[1]-r*.87)}A${r},${r} 0 0 1 ${f2(c[0]+r*.95)},${f2(c[1]+r*.3)}`,class:'horn'},hornG);});
into(draw);
frame([[-24,-6,0,24,36,18],[60,-20,0,24,50,18],[0,60,0,0,0,0],[3,67,0,0,0,0],[13,77,0,0,0,0],[30,80.5,0,0,0,0],[60,-32,0,0,0,0],[44,-48,0,0,0,0],[30,-50,0,0,0,0],[-3,-5,18,6,34,39.6],[57,-5,18,6,34,39.6],[2,-5,68,6,34,5],[52,-5,68,6,34,5],[-16,-5,47,4,34,6],[72,-5,47,4,34,6],[66.6,-19.4,18,12.8,12,36],[24,40,0,12,30,48],[-21.5,25.5,18,4,4,33],[78.5,25.5,18,4,4,33]],8);
// Poses: a side of the bridge at leaf angle th (the beams turn with it), a barrier lowered by b (0 up, 1 across the road).
function poseSide(s,th){const t=th*RAD,c=Math.cos(t),n=Math.sin(t),U=[s.sg*c,0,n],N=[-s.sg*n,0,c],Y=[0,1,0],H=[s.x0,0,18],Q=[s.x0,0,50];
const W=(u,v,k)=>add(add(add(H,mul(U,u)),mul(Y,v)),mul(N,k)),B=(d,y,k)=>add(add(add(Q,mul(U,d)),[0,y,0]),mul(N,k));
obx(s.dk,W(15,12,-1.75),[[U,15],[Y,12],[N,1.75]]);const top=dot(N,VIEW)>0;set(s.pl,'d',top?seg([...Array(14)].map((_,i)=>[W(2+i*2,.2,.02),W(2+i*2,23.8,.02)])):'');set(s.ul,'d',top?'':seg([...[5,10,15,20,25].map(u=>[W(u,.4,-3.52),W(u,23.6,-3.52)]),[W(.4,4,-3.52),W(29.6,4,-3.52)],[W(.4,20,-3.52),W(29.6,20,-3.52)]]));
const rail=v=>seg([...[1.5,8.5,15.5,22.5,29].map(u=>[W(u,v,0),W(u,v,6)]),[W(.8,v,6),W(29.6,v,6)],[W(.8,v,3),W(29.6,v,3)]]);s.railF(rail(1));s.railN(rail(23));
if(top!==s.top){s.top=top;if(top)s.leafG.append(s.deck,s.rF,s.rN);else s.leafG.append(s.rF,s.rN,s.deck);}
place(s.lampR,W(26.8,24.05,-1.75));place(s.lampG,W(23.4,24.05,-1.75));
for(const[y,Bm,Hg,yl]of[[-3.7,s.fB,s.fH,0],[27.7,s.nB,s.nH,24]]){obx(Bm,B(3.5,y,0),[[U,19.5],[Y,1.2],[N,1.5]]);Hg(`M${pt(B(22,y,0))}L${pt(W(22,y,0))}L${pt(W(22,yl,-.7))}`);}
obx(s.bx,B(-14.2,12,0),[[U,1.8],[Y,14.5],[N,2]]);}
function poseBarrier(r,b){const f=(1-b)*88*RAD,A=[0,-Math.cos(f),Math.sin(f)],at=k=>add(r.pv,mul(A,k));r.arm(`M${pt(at(-.6))}L${pt(at(26))}`);set(r.dash,'d',`M${pt(at(2))}L${pt(at(26))}`);r.tail(`M${pt(at(-1.4))}L${pt(at(-4.6))}`);place(r.l1,at(13));place(r.l2,at(23));}
// State: one sequence per approval (barriers down, leaves up, the boat through, leaves down, barriers up), the boat on its
// own clock (arriving, waiting, sailing, gone), a progress mode where the opening follows a share, notes; audio after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const TMAX=70,WAIT=56,ARRIVE=80,GONE=-36,DUR={lower:1.5,raise:3.6,pass:99,drop:3.4,lift:1.5},RD={lower:.7,raise:.9,pass:1.4,drop:.9,lift:.7},DA=3.4;
let phase='wait',pt0=0,b=0,th=0,b0=0,th0=0,denied=false,complete=false,mode='ind',target=0,shown=0,note='',noteT=0,denyT=-1e9,landT=-1e9,clock=0,last=0,outKey='',drawn='',bellT=0,ac=null,hum=null;
const boat={m:'wait',y:WAIT,v:0,t:0};
const say=m=>{announcement.textContent=m;},notice=(m,ms=2000)=>{note=m;noteT=clock+ms;};
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();const o=ac.createOscillator(),fl=ac.createBiquadFilter();o.type='sawtooth';o.frequency.value=46;fl.type='lowpass';fl.frequency.value=220;hum=ac.createGain();hum.gain.value=0;o.connect(fl);fl.connect(hum);hum.connect(ac.destination);o.start();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,d,v,w=0,type='sine',f1=0){if(!ac)return;try{const t=ac.currentTime+w,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.05);}catch(_){}}
function horn(d=.9,w=0){if(!ac)return;try{const t=ac.currentTime+w,fl=ac.createBiquadFilter(),g=ac.createGain();fl.type='lowpass';fl.frequency.value=720;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.03,t+.05);g.gain.setValueAtTime(.03,t+d-.12);g.gain.exponentialRampToValueAtTime(.0001,t+d);fl.connect(g);g.connect(ac.destination);
for(const f of[146,149.4]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=f;o.connect(fl);o.start(t);o.stop(t+d+.05);}}catch(_){}}
const bell=()=>{tone(1480,.55,.011,0,'triangle');tone(2210,.35,.004);},clunk=()=>{tone(68,.45,.06,0,'sine',38);tone(150,.12,.016,0,'triangle');},thud=()=>{tone(58,.5,.07,0,'sine',33);tone(230,.08,.014,0,'square');};
function go(p){phase=p;pt0=0;b0=b;th0=th;}
function arrive(){boat.m='arrive';boat.t=0;boat.y=ARRIVE;boat.v=0;}
function approve(){audio();if(phase==='done'){mode='ind';complete=false;go('wait');arrive();say('A new vessel is coming up the canal.');return;}if(mode==='det'){finish();return;}
if(phase!=='wait')return;denied=false;go('lower');bellT=0;say('Approved. The barriers come down, the road signals turn red and the leaves rise for the vessel.');}
function deny(){audio();const holds=()=>{horn();denyT=clock;};if(mode==='det'&&phase==='det'){holds();target=0;notice('DENIED · LEAVES LOWERING',1600);say('Denied. The leaves come back down.');return;}
if(phase==='lower'||phase==='raise'){holds();denied=true;complete=false;if(mode==='det')target=0;go(phase==='lower'?'lift':'drop');say('Denied. The leaves come back down and the road opens again.');}
else if(phase==='wait'){holds();notice('DENIED · VESSEL HOLDING');say('Denied. The vessel holds and sounds its horn.');}}
function setProgress(p){if(p==null||!isFinite(p)){if(mode==='det'){mode='ind';complete=false;if(phase==='det'||phase==='done')go(th>.05?'drop':b>.01?'lift':'wait');if(boat.m==='gone')arrive();}return;}
if(mode!=='det'||complete){mode='det';complete=false;if(boat.m==='gone')arrive();}target=clamp(+p);
if(phase==='wait'||phase==='done'||phase==='lower'||phase==='raise'){shown=th>.05?.2+.8*th/TMAX:.2*b;go('det');}}
function finish(){audio();mode='det';if(complete||phase==='done')return;complete=true;target=1;go(b<.99?'lower':th<TMAX-.05?'raise':'pass');say('Approved. The bridge finishes opening and the vessel passes.');}
function stepKey(){audio();setProgress(mode==='det'&&!complete?(target>=1?0:Math.min(1,Math.floor(target*4+1e-6)/4+.25)):.25);say(`Progress ${Math.round(target*100)} percent.`);}
window.figure={setProgress,done:finish};
bind(TW,approve);
const act={' ':approve,escape:deny,p:stepKey};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented||e.repeat)return;const k=e.key.toLowerCase();if(k===' '&&e.target.closest&&e.target.closest('button,[role=button]'))return;const fn=act[k];if(fn){e.preventDefault();fn();}});
function ui(){const canal=phase==='pass'?'GREEN':'RED',bar=b<.01?'UP':b>.99?'DOWN':'MOVING',deg=Math.round(th);
const r=mode==='det'?(phase==='done'?'PROGRESS 100% · COMPLETE':`PROGRESS ${Math.round((complete?1:shown)*100)}% · LEAVES ${deg}°`):`LEAVES ${deg}° · BARRIERS ${bar} · CANAL ${canal}`;
const st=clock<noteT?note:phase==='done'?'COMPLETE · VESSEL THROUGH':phase==='lower'?'APPROVED · BARRIERS LOWERING':phase==='raise'?'OPENING · LEAVES RISING':phase==='pass'?'OPEN · VESSEL PASSING':phase==='drop'?(denied?'DENIED · LEAVES LOWERING':'CLOSING · LEAVES LOWERING'):phase==='lift'?(denied?'DENIED · BARRIERS LIFTING':'CLOSING · BARRIERS LIFTING')
:phase==='det'?(shown<.004?'REQUEST · AWAITING PROGRESS':shown<.2?'OPENING · BARRIERS LOWERING':shown<.996?'OPENING · LEAVES RISING':'OPEN · AWAITING DONE'):boat.m==='arrive'?'REQUEST · VESSEL ARRIVING':'REQUEST · AWAITING APPROVAL';
if(r+st!==outKey){outKey=r+st;readout.textContent=r;stateLabel.textContent=st;}}
// One step of the state: the sequence's phase, the progress mode, the boat on its own clock.
function update(dt,red){pt0+=dt;const u=clamp(pt0/((red?RD:DUR)[phase]||1)),e=red?1:ease(u);
if(phase==='lower'){b=b0+(1-b0)*(red?1:heavy(u,.03));if(!red&&(bellT-=dt)<=0){bellT=.55;bell();}if(u>=1)go('raise');}
else if(phase==='raise'){th=th0+(TMAX-th0)*(red?1:heavy(u,.012));if(u>=1){th=TMAX;clunk();go('pass');say('Open. The span lamps are green and the vessel is passing.');}}
else if(phase==='pass'){if(boat.m==='wait'){boat.m='sail';boat.v=0;tone(330,.18,.02,0,'square');tone(330,.18,.02,.28,'square');}if(red?u>=1:boat.m==='gone'||boat.m==='sail'&&boat.y<-20){if(red)boat.m='gone';go('drop');say('The vessel is through. The leaves come down.');}}
else if(phase==='drop'){th=th0*(1-(red?1:heavy(u)));if(u>=1){th=0;thud();landT=clock;go('lift');}}
else if(phase==='lift'){b=b0*(1-e);th=red||clock-landT>450?0:1.2*Math.sin(Math.PI*(clock-landT)/450);if(u>=1){b=0;denied=false;if(complete){go('done');say('Complete. The vessel is through and the road is open.');}else{if(boat.m==='gone')arrive();if(mode==='det'){shown=0;go('det');}else{go('wait');say('Closed. The barriers are up and the road is open.');}}}}
else if(phase==='det'){shown=red?target:shown+(target-shown)*(1-Math.exp(-dt*2.4));if(Math.abs(target-shown)<5e-4)shown=target;b=clamp(shown/.2);th=TMAX*clamp((shown-.2)/.8);}
// The boat: arriving up the canal and slowing to its mark, waiting, sailing through and fading out beyond the bridge.
if(boat.m==='arrive'){boat.t+=dt;const k=clamp(boat.t/(red?.6:DA));boat.y=red?(k>=1?WAIT:ARRIVE):ARRIVE+(WAIT-ARRIVE)*(1-(1-k)**3);boat.v=red?0:(ARRIVE-WAIT)*3*(1-k)**2/DA;if(k>=1){boat.m='wait';boat.y=WAIT;boat.v=0;if(phase==='wait')say('A vessel is waiting for approval.');}}
else if(boat.m==='sail'){if(red)boat.y=12;else{boat.v=Math.min(24,boat.v+14*dt);boat.y-=boat.v*dt;if(boat.y<=GONE){boat.m='gone';boat.y=GONE;boat.v=0;}}}}
// The drawing at time now: the boat (its layer, bob, fade, wake, pennant, horn), the bridge posed only when it moves,
// lamps, signals and the beacon, the ripples drifting.
function paint(now,red){const back=clock-denyT<1800&&!red?3.2*Math.sin(Math.PI*(clock-denyT)/1800):0,bob=red||boat.m==='gone'?0:.32*Math.sin(now/620);
const alpha=boat.m==='gone'?0:boat.m==='arrive'?(red?0:clamp(boat.t/.8)):boat.m==='sail'&&!red?clamp((boat.y-GONE)/15):1;
const by=boat.y+back,bq=P(0,by,bob),wq=P(0,by,0),layer=by>46?BOAT_FRONT:by<-21?BOAT_BACK:BOAT_MID;if(boatG.parentNode!==layer)layer.appendChild(boatG);
set(boatG,'transform',`translate(${f2(bq[0])} ${f2(bq[1])})`);boatG.style.opacity=f2(alpha);set(wakeG,'transform',`translate(${f2(wq[0])} ${f2(wq[1])})`);const wa=red?0:alpha*clamp(boat.v/14)*.7;wakeG.style.opacity=f2(wa);wakeG.style.display=wa>0?'':'none';
const fl=red?0:Math.sin(now/170)*.7,fv=red?0:Math.sin(now/170+1.3)*.5;set(flag,'d',`M${pt([30,-5.5,39.8])}L${pt([30+fl,-.6,38.7+fv])}L${pt([30,-5.5,37.6])}Z`);
const hk=(clock-denyT)/1000;HORN.forEach((h,i)=>{h.style.opacity=f2(hk<1.6?(red?.8:clamp(Math.sin(Math.PI*clamp((hk-i*.14)/.9))*.9)):0);});
const key=[th,b].map(v=>v.toFixed(3)).join('|');if(key!==drawn){drawn=key;under.style.opacity=f2(.16*(1-th/TMAX));poseSide(LS,th);poseSide(RS,th);for(const r of BARRIERS)poseBarrier(r,b);}
const blink=red||Math.floor(now/450)%2===0,roadRed=b>.01||phase==='lower',flash=(phase==='lower'||phase==='lift')&&!red,canalGreen=phase==='pass';
for(const r of BARRIERS){lit(r.sR,roadRed&&(!flash||blink)?'r':'');lit(r.sG,roadRed?'':'g');lit(r.l1,roadRed&&(red||blink)?'r':'');lit(r.l2,roadRed&&(red||!blink)?'r':'');}
for(const s of[LS,RS]){lit(s.lampR,canalGreen?'':'r');lit(s.lampG,canalGreen?'g':'');}
const operating=phase!=='wait'&&phase!=='done'&&!(phase==='det'&&shown<.004&&target<.004);lit(beacon,operating&&(red||Math.floor(now/600)%2===0)?'a':'');
if(!red)RIPPLES.forEach((r,i)=>set(r,'stroke-dashoffset',f2((now/(160+i*23))%16)));}
function tick(now){const dt=last?Math.min(.05,(now-last)/1000):0,red=reduced.matches;last=now;clock=now;update(dt,red);paint(now,red);
if(hum)hum.gain.setTargetAtTime((phase==='raise'||phase==='drop')&&!red?.012:0,ac.currentTime,.15);ui();requestAnimationFrame(tick);}
paint(0,reduced.matches);ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
