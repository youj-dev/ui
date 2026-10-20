// @ts-nocheck
/* QELVA DR–5 · Dilution refrigerator. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--dk:#3c3c3b;--dk-top:#4c4c4a;--dk-side:#2f2f2e;--gold:#e2bc5a;--gold-top:#f3da8e;--gold-side:#c39a3b;--coax:#ececE8;--rubber:#2e2e2d;--screen:#17181a;--inner:#c9c9c5;--floor:#a3a39f;--pit:#3a3a39;--drive:#9b5cff;--ret:#0fa3c2;--h0:.03;--h1:.5;--sheen:.38}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--dk:#313130;--dk-top:#474745;--dk-side:#1e1e1e;--gold:#be9e4b;--gold-top:#e3cc84;--gold-side:#896c27;--coax:#c7c7c4;--rubber:#252524;--screen:#121214;--inner:#a9a9a6;--floor:#898986;--pit:#2f2f2f;--drive:#b07dff;--ret:#3fd0ef;--h0:.06;--h1:.85;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:5px;letter-spacing:1.4px;font-weight:600}.micro{font-size:2.4px;letter-spacing:.2px}.center{text-anchor:middle}.end{text-anchor:end}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.dk{fill:var(--dk)}.top.dk{fill:var(--dk-top)}.side.dk{fill:var(--dk-side)}.gold{fill:var(--gold)}.top.gold{fill:var(--gold-top)}.side.gold{fill:var(--gold-side)}.rubber{fill:var(--rubber)}.screen{fill:var(--screen)}.inner{fill:url(#inG)}.floor{fill:var(--floor)}.hole{fill-rule:evenodd}.pit{fill:var(--pit)}.grate{fill:none;stroke:var(--metal-side);stroke-width:7;stroke-dasharray:.7 1.6}
.tu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.tb{fill:none;stroke-linecap:round;stroke-linejoin:round}.cx{stroke:var(--coax)}.dkt{stroke:var(--dk-top)}.mt{stroke:var(--metal)}.rb{stroke:var(--rubber)}.rib{fill:none;stroke:var(--metal-side);stroke-dasharray:.8 1.4}.ribk{fill:none;stroke:var(--line);stroke-dasharray:.5 1.3;opacity:.55}
.cut{fill:none;stroke:var(--metal-side);stroke-width:1.7;stroke-linejoin:round}.sheen{fill:#fff;opacity:var(--sheen);stroke:none}
.halo{stroke:none;filter:url(#bloom);opacity:calc(var(--h0) + var(--h1)*var(--u,0))}.rim{fill:none;stroke-width:1.2;vector-effect:non-scaling-stroke}
.lamp{fill:var(--off);stroke:var(--line);stroke-width:.3;vector-effect:non-scaling-stroke}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.b{fill:var(--accent)}.lamp.v{fill:var(--drive)}.lamp.c{fill:var(--ret)}.lamp.g,.lamp.a,.lamp.b,.lamp.v,.lamp.c,.tled{filter:url(#glow);stroke:none}
.hot{fill:var(--accent)!important;filter:url(#glow)}.scr{fill:var(--accent);font:2.3px ui-monospace,monospace;stroke:none}.scr.end{text-anchor:end}.grid{stroke:var(--accent);stroke-width:.25;opacity:.35;fill:none}.trace{fill:none;stroke-width:.55;stroke-linejoin:round}.shot{stroke:none}.blob{fill:var(--accent);opacity:.13;stroke:none}.halo-s{fill:var(--accent);opacity:.12;filter:url(#bloom)}
.flow{fill:none;stroke:var(--off);stroke-width:.9;stroke-linecap:round;stroke-linejoin:round}.flow.on{stroke:var(--accent);stroke-dasharray:1.6 1.6;animation:fl 1s linear infinite}@keyframes fl{to{stroke-dashoffset:-3.2}}
.needle{stroke:var(--warn);stroke-width:.6;stroke-linecap:round}.qb{fill:var(--off)}.flash{fill:var(--accent);opacity:0;filter:url(#bloom)}
.pt{fill:none;stroke-width:3.6;stroke-linecap:round;opacity:.7;filter:url(#soft)}.pg{fill:none;stroke-width:9;stroke-linecap:round;opacity:.45;filter:url(#bloom)}.pc{fill:none;stroke:#fff;stroke-width:.9;stroke-linecap:round}.pin{stroke:var(--accent)}.pdr{stroke:var(--drive)}.pret{stroke:var(--ret)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
.tu,.tb,.rib,.ribk,.pt,.pc,.halo,.sheen,.cut{pointer-events:none}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<linearGradient id="inG" gradientUnits="userSpaceOnUse" x1="0" x2="0"><stop offset="0" style="stop-color:var(--inner)"/><stop offset="1" style="stop-color:var(--pit)"/></linearGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* QELVA DR–5. World: x lower-right, y lower-left, z up; cryostat axis (0, 0); 1 unit ≈ 1 cm.
Part                          x      y      z      w      d      h
deck (round) + pit       r 72                    0      –      –      4   grating ring, pit r 43 with collar
frame legs (4)          r 54 at 0/90/180/270°     4      6      6    166   foot pads, X brace at the back
frame ring + brackets   r 54                    170      –      –      5   round tube, brackets to the plate
top plate (300 K)       r 42                    170      –      –      8   20 bolts, label, ports
pulse-tube head        −19    −11              178   r 11/7       –     35   motor head, flex hoses to the GHS
coax feedthroughs (4)   r 31 at −38…34°         178   r 4.2      –    3.4   6 SMA each, loom to the rack
stages 50 K/4 K/still/CP/MXC   r 34/31/28/25/22   top z 152/124/98/76/56   gold, 3 thick
coax lines (14)         r = stage − 3.5, θ −38…118°, attenuator on every stage, HEMT at 4 K
heat exchangers         coil still→CP, three steps CP→MXC; still pot, mixing chamber, circulator, TWPA
shield + qubit box      r 9                      26      –      –     22   cut away
vacuum can              r 38       20 up · −146 in the pit   –      –    150   flange r 42, cut away
gas handling + turbo   −42     92      0     40     36   100 + 19   mimic panel, gauges, bellows to the plate port
control rack           100    −40      0     46     36    112   7 instruments, monitor 56 × 30 on top
Painter: hoses, deck + pit, back legs, can inside (clipped at the deck), chandelier bottom up, can shell, front legs, ring, plate, top parts, side units, pulses. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: polar points, iso arcs, Bézier runs, tubes, lamps, cut-away vessels.
const RAD=Math.PI/180,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t,sm=t=>t*t*(3-2*t),draw=root,into=g=>root=g;
const at=(r,a,z,cx=0,cy=0)=>[cx+r*Math.cos(a*RAD),cy+r*Math.sin(a*RAD),z],Q=(...p)=>P(...p).map(v=>+v.toFixed(2));
const arc=(r,a0,a1,z,cx=0,cy=0)=>`A${(r*1.2247).toFixed(2)},${(r*.7071).toFixed(2)} 0 0 ${a1>a0?1:0} ${Q(...at(r,a1,z,cx,cy))}`;
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`,front45=o=>plane(o,[.7071,-.7071,0],[0,0,-1]);
const segD=(g,r)=>g.c1?(r?`M${Q(...g.b)}C${Q(...g.c2)} ${Q(...g.c1)} ${Q(...g.a)}`:`M${Q(...g.a)}C${Q(...g.c1)} ${Q(...g.c2)} ${Q(...g.b)}`):(r?`M${Q(...g.b)}L${Q(...g.a)}`:`M${Q(...g.a)}L${Q(...g.b)}`);
function tube(d,cls,w,parent=root){el('path',{d,class:'tu','stroke-width':w+1.1},parent);return el('path',{d,class:'tb '+cls,'stroke-width':w},parent);}
function route(pts,r=4){let d='M'+P(...pts[0]);for(let i=1;i<pts.length-1;i++){const a=pts[i-1],b=pts[i],c=pts[i+1],la=Math.hypot(...b.map((v,j)=>v-a[j])),lc=Math.hypot(...c.map((v,j)=>v-b[j])),p=b.map((v,j)=>v+(a[j]-v)*Math.min(r,la/2)/la),q=b.map((v,j)=>v+(c[j]-v)*Math.min(r,lc/2)/lc);d+='L'+P(...p)+'Q'+P(...b)+' '+P(...q);}return d+'L'+P(...pts[pts.length-1]);}
function lamp(g,x,y,r=.8){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
const ringD=(r0,r1)=>`M${r1},0A${r1},${r1} 0 1 0 ${-r1},0A${r1},${r1} 0 1 0 ${r1},0ZM${r0},0A${r0},${r0} 0 1 1 ${-r0},0A${r0},${r0} 0 1 1 ${r0},0Z`;
function vessel(gi,go,R,zb,H,w,cls){
gi.replaceChildren();go.replaceChildren();const zt=zb+H,pt=(a,z)=>Q(...at(R,a,z));
el('path',{d:`M${pt(135,zt)}${arc(R,135,315,zt)}L${pt(315,zb)}${arc(R,315,495,zb)}Z`,class:'face inner'},gi);circle(group(TOP(0,0,zb+1),gi),0,0,R-.6,'face floor');
const wd=`M${pt(w[0],w[3])}${arc(R,w[0],w[1],w[3])}L${pt(w[1],w[2])}${arc(R,w[1],w[0],w[2])}Z`,sil=`M${pt(135,zt)}${arc(R,135,-45,zt)}L${pt(-45,zb)}${arc(R,-45,135,zb)}Z`;
el('path',{d:sil+wd,class:'face hole '+cls},go);el('path',{d:wd,class:'cut'},go);
el('path',{d:`M${pt(-33,zt-3)}L${pt(-33,zb+3)}L${pt(-25,zb+3)}L${pt(-25,zt-3)}Z`,class:'sheen'},go);return{sil,zt};
}
// Assembly. Stages, coax angles and the three signal lines (drive, readout in, readout out).
const ST=[{n:'50 K',z:152,r:34,T:42},{n:'4 K',z:124,r:31,T:3.1},{n:'STILL',z:98,r:28,T:.85},{n:'CP',z:76,r:25,T:.095},{n:'MXC',z:56,r:22,T:.0098}],ZT=170;
const TH=[-38,-26,-14,-2,10,22,34,46,58,70,82,94,106,118],KD=2,KI=4,KO=6,att=ST.map(()=>[]),defs=svg.querySelector('defs');
const gapSeg=(i,k)=>{const a=TH[k],za=i?ST[i-1].z-3:ZT,r0=i?ST[i-1].r-3.5:31,r1=ST[i].r-3.5,zb=ST[i].z+3.4,h=za-zb,tw=k%2?7:-7;return{a:at(r0,a,za),c1:at(r0,a+tw,za-h*.5),c2:at(r1,a-tw,zb+h*.5),b:at(r1,a,zb),s:i};};
const underSeg=k=>{const a=TH[k];return{a:at(18.5,a,53),c1:at(18.5,a,50.5),c2:at(8,a,51),b:at(5,a,48)};};
const SEG=TH.map((a,k)=>{const out=[{a:at(31,a,181.4),b:at(31,a,ZT)}];for(let i=0;i<5;i++){const g=gapSeg(i,k);out.push(g,{a:g.b,b:at(ST[i].r-3.5,a,ST[i].z-3)});}const u=underSeg(k);out.push(u,{a:u.b,b:at(2.2,a,38.5)});return out;});
const shade=(x,y,rx,ry,dy=3)=>{const s=P(x,y,0);el('ellipse',{cx:s[0],cy:s[1]+dy,rx,ry,class:'shadow stage-floor'});el('ellipse',{cx:s[0],cy:s[1]+dy,rx,ry,class:'stage-contact'});};
shade(0,0,100,56,5);shade(123,-22,46,24);shade(-22,110,44,24);
// Pulse-tube flex hoses run behind the frame down to the gas handling cabinet.
for(const k of[0,1]){const d=`M${Q(-21+k*4,-13,211)}C${Q(-46+k*3,-50,222)} ${Q(-112,-4+k*6,150)} ${Q(-36+k*6,96,104)}`;tube(d,'mt',2.4);el('path',{d,class:'ribk','stroke-width':2.4});}
// Deck with the pit the vacuum can drops into.
const dk=cylinder(0,0,0,72,4,'z','metal').face;circle(dk,0,0,69.5,'detail');circle(dk,0,0,58.5,'grate');circle(dk,0,0,51,'detail');for(let k=0;k<16;k++){const a=(k*22.5+11.25)*RAD;circle(dk,Math.cos(a)*66,Math.sin(a)*66,.8,'face recess');}
el('path',{d:ringD(43,47),class:'face top metal hole'},dk);circle(dk,0,0,43,'face pit');
{const hr=Q(...at(43,-45,4)),hl=Q(...at(43,135,4));el('path',{d:`M3000,${hr[1]}L${hr}${arc(43,-45,135,4)}L-3000,${hl[1]}L-3000,-3000L3000,-3000Z`},el('clipPath',{id:'above'},defs));}
const LEG=[0,90,180,270].map(a=>at(54,a,0));
function leg([x,y]){cylinder(x,y,4,5,1.5,'z','dk');box(x-3,y-3,5.5,6,6,164.5,1,'dk');const f=group(FRONT(x-3,y+3,168));for(let v=8;v<160;v+=19)circle(f,3,v,.7,'face recess');}
leg(LEG[2]);leg(LEG[3]);
for(const[a,b]of[[LEG[2],LEG[3]],[LEG[1],LEG[2]],[LEG[3],LEG[0]]])tube(`M${Q(a[0],a[1],18)}L${Q(b[0],b[1],18)}`,'dkt',2.2);
tube(`M${Q(LEG[2][0],LEG[2][1],22)}L${Q(LEG[3][0],LEG[3][1],160)}M${Q(LEG[3][0],LEG[3][1],22)}L${Q(LEG[2][0],LEG[2][1],160)}`,'dkt',1.4);
tube(`M${Q(...at(54,135,172.5))}${arc(54,135,315,172.5)}`,'dkt',4.6);
for(const a of[180,270])tube(`M${Q(...at(42,a,172.5))}L${Q(...at(54,a,172.5))}`,'dkt',4.6);
const CI=el('g',{'clip-path':'url(#above)'});
// Chandelier, bottom up: shield and qubit box, then each stage with the parts standing on it and the lines above it.
const SI=el('g',{}),SO=el('g',{});vessel(SI,SO,9,26,22,[-12,102,28,45],'metal');into(SI);
box(-3.5,-3.5,30,7,7,8.5,1,'gold');const die=group(FRONT(-3.5,3.5,38.5));rect(die,1.3,1.6,4.4,4.4,.5,'face screen');const qb=circle(die,3.5,3.8,1.05,'qb');
for(const k of[KD,KI,KO])tube(segD(SEG[k][SEG[k].length-1]),'cx',.7);
into(SO);{const l=group(TOP(0,0,48));circle(l,0,0,9,'face top metal');for(const k of[KD,KI,KO])circle(l,...at(5,TH[k],0).slice(0,2),.8,'face recess');}into(draw);
const qFlash=el('circle',{cx:P(0,0,37)[0],cy:P(0,0,37)[1],r:16,class:'flash'});
cylinder(0,0,48,2.8,5,'z','gold');
for(const k of[KD,KI,KO])tube(segD(underSeg(k)),'cx',k===KO?1.2:.85);
cylinder(...at(11.5,150,47),5,6,'z','metal');
box(...at(15,34,0).slice(0,2).map(v=>v-2.2),48.5,4.4,4.4,3,1,'dk');box(...at(13.5,62,0).slice(0,2).map(v=>v-3),49,6,3,2.4,.8,'gold');
function plateAt(i){const s=ST[i],h=el('ellipse',{cx:P(0,0,s.z-1)[0],cy:P(0,0,s.z-1)[1],rx:(s.r+6)*1.2247,ry:(s.r+6)*.7071,class:'halo'});
const c=cylinder(0,0,s.z-3,s.r,3,'z','gold');circle(c.face,0,0,s.r*.6,'detail');for(let k=0;k<12;k++){const a=(k*30+15)*RAD;circle(c.face,Math.cos(a)*(s.r-1.6),Math.sin(a)*(s.r-1.6),.42,'face recess');}
s.rim=circle(c.face,0,0,s.r-.9,'rim');text(group(front45(at(s.r+.05,45,s.z-.7))),0,0,s.n,'etch micro center');s.halo=h;}
function gap(i){
const lo=ST[i],items=[],za=i?ST[i-1].z-3:ZT;
TH.forEach((a,k)=>{const g=gapSeg(i,k),r1=lo.r-3.5;
items.push([Math.cos(a*RAD)+Math.sin(a*RAD),()=>{
if(i===1&&k===KO){const p=at(r1,a,lo.z);att[i][k]=box(p[0]-2.6,p[1]-2,lo.z,5.2,4,3.4,.8,'metal').lastChild.firstChild;}
else att[i][k]=cylinder(...at(r1,a,lo.z),1.45,3.4,'z','metal').face.firstChild;
tube(segD(g),'cx',k===KO?1.2:.85);}]);});
for(const a of[90,210,330])items.push([Math.cos(a*RAD)+Math.sin(a*RAD)-.05,()=>tube(`M${Q(...at(lo.r-2,a,lo.z))}L${Q(...at(lo.r-2,a,za))}`,'dkt',1.6)]);
if(i===0)items.push([-2,()=>{cylinder(-19,-11,152,8,1.6,'z','gold');cylinder(-19,-11,153.6,6,16.4,'z','metal');}]);
if(i===1)items.push([-2,()=>{cylinder(-19,-11,124,6.2,1.6,'z','gold');cylinder(-19,-11,125.6,4.4,23.4,'z','metal');}]);
if(i===2)items.push([-1.5,()=>box(...at(20,-75,0).slice(0,2).map(v=>v-2.5),98,5,5,2.4,.8,'dk')]);
if(i===3){items.push([-1.9,()=>cylinder(...at(14,-80,89),5,6,'z','metal')]);items.push([-.2,()=>{const c=at(13,-60,0),pts=[];for(let t=0;t<=1.0001;t+=1/40){const f=t*7*Math.PI;pts.push([c[0]+2.8*Math.cos(f),c[1]+2.8*Math.sin(f),78+14*t]);}tube(poly(pts),'mt',.7);}]);}
if(i===4)items.push([-.3,()=>{const c=at(12,-50,0);cylinder(c[0],c[1],56,1.2,17,'z','metal');for(const z of[58,62.5,67])cylinder(c[0],c[1],z,3.4,2.4,'z','metal');}]);
items.sort((p,q)=>p[0]-q[0]).forEach(t=>t[1]());}
for(let i=4;i>=0;i--){plateAt(i);gap(i);}
const CO=el('g',{class:'control',role:'button',tabindex:'0','clip-path':'url(#above)'}),QB=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Drive a π-pulse on the qubit (X)'});{const q=P(0,0,37);el('circle',{cx:q[0],cy:q[1],r:14,class:'hit'},QB);el('circle',{cx:q[0],cy:q[1],r:15,class:'focus-ring'},QB);}
// Front legs, ring, brackets, top plate and what stands on it.
leg(LEG[0]);leg(LEG[1]);
tube(`M${Q(...at(54,-45,172.5))}${arc(54,-45,135,172.5)}`,'dkt',4.6);for(const a of[0,90])tube(`M${Q(...at(42,a,172.5))}L${Q(...at(54,a,172.5))}`,'dkt',4.6);
const TP=el('g',{class:'control',role:'button',tabindex:'0'});into(TP);
const tf=cylinder(0,0,ZT,42,8,'z','metal').face;circle(tf,0,0,36.5,'detail');circle(tf,0,0,14,'detail');
const bolts=[];for(let k=0;k<20;k++){const a=k*18*RAD;bolts.push(lamp(tf,Math.cos(a)*39.4,Math.sin(a)*39.4,.95));}
text(group(front45(at(42.05,45,174.4))),0,1.2,'QELVA · DR–5 · 300 K','etch micro center');
const ptH=el('g',{});into(ptH);cylinder(-19,-11,178,11,4,'z','metal');cylinder(-19,-11,182,7,22,'z','metal');for(const z of[188,196])ellipse(-19,-11,z,7.05,'z','detail');
const mh=el('g',{},ptH);into(mh);box(-27,-19,204,16,16,9,2.5,'');const mf=group(FRONT(-27,-3,213));slits(mf,3,2.4,8,4,5);const ptLed=lamp(mf,13,4.4,.8);into(TP);
cylinder(-15,21,178,7,3.5,'z','metal');
const ft=[-38,-14,10,34].map(a=>{const p=at(31,a,178),c=cylinder(p[0],p[1],178,4.2,3.4,'z','metal');for(let j=0;j<6;j++){const b=j*60*RAD;circle(c.face,Math.cos(b)*2.2,Math.sin(b)*2.2,.55,'face recess');}return p;});
{const q=P(0,0,178);el('ellipse',{cx:q[0],cy:q[1],rx:54,ry:31,class:'hit'});el('ellipse',{cx:q[0],cy:q[1],rx:56,ry:33,class:'focus-ring'});}
into(draw);
// Gas handling cabinet: mimic panel, gauges, turbo pump; then the still pumping line (bellows) from the plate port.
for(const[x,y]of[[-39,95],[-5,95],[-39,125],[-5,125]])cylinder(x,y,0,2.4,6,'z','rubber');
box(-42,92,6,40,36,94,2,'');const gf=group(FRONT(-42,128,100));text(gf,4,5.6,'QELVA GHS','etch micro');rect(gf,3.5,8,33,40,1.6,'face recess');rect(gf,4.5,9,31,38,1.2,'face screen');
const loop=el('path',{d:'M11,15H31V26M31,32V41H24.5M19.5,41H11V36',class:'flow'},gf);el('path',{d:'M8,25H5.8V31H8',class:'flow'},gf);
rect(gf,7.5,13,4.6,25,1,'detail');for(const[x,y]of[[22,41],[17,41]]){circle(gf,x,y,2.3,'detail');el('path',{d:`M${x-1.2},${y+1}L${x},${y-1.3}L${x+1.2},${y+1}Z`,class:'detail'},gf);}rect(gf,28.6,26,4.8,6,1,'detail');
const valves=[[21,15],[31,20],[31,36],[13.5,41],[7,28]].map(([x,y])=>lamp(gf,x,y,1.05));text(gf,6.5,46,'MIX · OVC · LN2 TRAP','scr');
slits(gf,6,56,28,6,12);for(let k=0;k<3;k++)rect(gf,6+k*10,70,7,14,1.4,'face top');
const gs=group(SIDE(-2,128,100)),gauge=[];for(const[u,lb]of[[10,'OVC'],[26,'P1']]){circle(gs,u,16,6.8,'face top');circle(gs,u,16,5.6,'face glass');for(let k=0;k<9;k++){const a=(-135+k*33.75)*RAD;line(gs,u+Math.cos(a-Math.PI/2)*4.4,16+Math.sin(a-Math.PI/2)*4.4,u+Math.cos(a-Math.PI/2)*5.2,16+Math.sin(a-Math.PI/2)*5.2);}gauge.push(line(gs,u,16,u,11.5,'needle'));circle(gs,u,16,.8,'face top');text(gs,u,20.4,lb,'etch micro center');}
const ghsLed=lamp(gs,6,30,.9);text(gs,9,30.9,'PT','etch micro');slits(gs,4,80,28,6,10);
cylinder(-36,96,100,1.8,3.4,'z','metal');cylinder(-30,96,100,1.8,3.4,'z','metal');
cylinder(-22,110,100,9,3,'z','metal');cylinder(-22,110,103,7,13,'z','metal');for(const z of[107,111])ellipse(-22,110,z,7.05,'z','detail');const tLed=lamp(group(front45(at(7.05,45,114,-22,110))),0,0,.8);cylinder(-22,110,116,9,3,'z','metal');
{const d=route([[-15,21,181],[-15,21,196],[-22,110,196],[-22,110,119]],12);tube(d,'mt',7.4);el('path',{d,class:'rib','stroke-width':7.4});
for(const p of[[-15,21,183],[-22,110,121]])cylinder(p[0],p[1],p[2],5.3,2.2,'z','metal');}
// Control rack: seven instruments, a monitor on top, the loom from the feedthroughs.
for(const[x,y]of[[103,-37],[143,-37],[103,-7],[143,-7]])cylinder(x,y,0,2.4,6,'z','rubber');
box(100,-40,6,46,36,106,2,'dk');const rs=group(SIDE(146,-4,112));slits(rs,6,8,24,10,9);slits(rs,6,88,24,10,9);
const fr=group(FRONT(100,-4,112));rect(fr,3,3,40,100,1,'face recess');
function unit(v,h){rect(fr,3.4,v,39.2,h,.8,'face');for(const u of[5.2,40.8])circle(fr,u,v+h/2,.7,'face recess');}
unit(4.5,8.6);text(fr,8,8,'TC–5','etch micro');const tled=ST.map((_,i)=>rect(fr,8+i*4.2,9.6,3,1.2,.4,'tled'));rect(fr,30,6,10,5.4,.8,'face screen');const tcT=text(fr,39,9.8,'','scr end');
unit(14,4.4);const sw=[];for(let k=0;k<10;k++){rect(fr,8+k*3,15,2.4,2.2,.3,'face recess');sw.push(lamp(fr,9.2+k*3,17.6,.42));}
unit(19.4,13);rect(fr,8,21,18,9.6,1,'face screen');const awgW=el('path',{class:'trace',style:'stroke:var(--accent)'},fr);text(fr,8,31.6,'AWG 4CH','etch micro');for(let k=0;k<4;k++)circle(fr,29+k*3.4,27,1.1,'face top');const awgL=lamp(fr,40,22,.75);
unit(33.4,8.6);rect(fr,8,35,15,5,.8,'face screen');text(fr,22,38.9,'6.214 GHz','scr end');circle(fr,30,37.7,2.6,'face top');line(fr,30,37.7,30,35.6);const rfL=lamp(fr,37,36,.75);text(fr,37,40.4,'RF','etch micro center');
unit(43,8.6);text(fr,8,46.6,'DIGITIZER','etch micro');for(let k=0;k<4;k++)circle(fr,9+k*3.4,49,1.1,'face top');slits(fr,24,45,12,5,6);const digL=lamp(fr,40,45.5,.75);
unit(52.6,8.6);text(fr,8,56.2,'DC BIAS','etch micro');const dcL=[];for(let k=0;k<8;k++)dcL.push(lamp(fr,9+k*2.6,58.6,.5));circle(fr,34,57,2.3,'face top');
unit(62.2,8.6);slits(fr,7,64,32,4.6,16);
unit(71.8,17);rect(fr,8,74,13,5.4,.8,'face screen');const upsT=text(fr,20,77.8,'230 V','scr end');slits(fr,24,74,14,12,7);text(fr,8,84.6,'UPS 3 kVA','etch micro');const upsL=lamp(fr,10,87,.6);
const lm={A:[34,-6,190],c1:[84,-16,206],c2:[144,-36,160],B:[138,-34,112]};
for(const p of ft){const d=`M${Q(p[0],p[1],181.4)}C${Q(p[0],p[1],187)} ${Q(lm.A[0]-6,lm.A[1],lm.A[2])} ${Q(...lm.A)}`;tube(d,'cx',.85);}
for(const o of[-1.6,0,1.6])tube(`M${Q(lm.A[0],lm.A[1]+o,lm.A[2])}C${Q(lm.c1[0],lm.c1[1]+o,lm.c1[2])} ${Q(lm.c2[0],lm.c2[1]+o,lm.c2[2])} ${Q(lm.B[0],lm.B[1]+o,lm.B[2])}`,o?'cx':'rb',1.4);
box(114,-38,112,16,10,1.5,1,'dk');box(120,-33,113.5,4,4,9,1,'dk');
const MN=el('g',{class:'control',role:'button',tabindex:'0'});into(MN);box(94,-29,121,56,3.5,30,1.6,'dk');
const ms=group(FRONT(94,-25.5,151));rect(ms,2.4,2.4,51.2,25.2,1.2,'halo-s');rect(ms,2,2,52,26,1.2,'face screen');text(ms,4,5.6,'QELVA LAB · DR–5','scr');const mHead=text(ms,52,5.6,'','scr end');
for(let k=0;k<=4;k++)line(ms,4,8+k*4.25,27,8+k*4.25,'grid');line(ms,4,8,4,25,'grid');const traces=ST.map(()=>el('path',{class:'trace'},ms));
line(ms,30,16.5,52,16.5,'grid');line(ms,41,8,41,25,'grid');circle(ms,36.4,19.6,3.4,'blob');circle(ms,46.4,12.4,3.4,'blob');const shots=el('g',{},ms),tally=text(ms,52,24.6,'','scr end');
rect(ms,0,0,56,30,2,'focus-ring');rect(ms,0,0,56,30,0,'hit');
into(draw);
const PL=el('g',{}),scratch=el('path',{},defs),inG=document.getElementById('inG');
frame([[-72,-72,0,144,144,213],[-100,-40,120,10,10,90],[94,-40,0,56,36,152],[-42,92,0,40,36,120]],14);
// State: can, cool-down, qubit; audio only after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),hk={};
document.querySelectorAll('.hint [data-k]').forEach(b=>{hk[b.dataset.k]=b;});
let canT=0,canH=0,sealed=false,sealT=0,vac=0,p=0,dir=0,prep=0,busy=false,counts=[0,0],note='',noteT=0,lastUI=-1,thumpT=0,now=performance.now(),last=now,drawnCan=-1,ac=null;
const T=ST.map(()=>300),WIN=[[0,.34],[.06,.5],[.42,.74],[.5,.84],[.56,1]],TC=[[0,[236,140,64]],[.22,[255,208,132]],[.42,[150,220,255]],[.68,[72,140,255]],[1,[150,96,255]]];
const uOf=t=>clamp((Math.log(300)-Math.log(t))/Math.log(30000));
function tcol(t){const u=uOf(t);let i=1;while(i<TC.length-1&&u>TC[i][0])i++;const[a,ca]=TC[i-1],[b,cb]=TC[i],f=(u-a)/(b-a);return`rgb(${ca.map((c,j)=>Math.round(c+(cb[j]-c)*f))})`;}
const tAt=(i,q)=>Math.exp(lerp(Math.log(300),Math.log(ST[i].T),sm(clamp((q-WIN[i][0])/(WIN[i][1]-WIN[i][0])))));
const fmtT=t=>t>=1?`${t.toFixed(t<10?1:0)} K`:`${(t*1000).toFixed(t<.1?1:0)} mK`,cold=()=>T[4]<.02;
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,d=.12,v=.012,type='sine',when=0,f2=0){if(!ac)return;try{const t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
const say=m=>{announcement.textContent=m;},warn=(s,m)=>{note=s;noteT=now+1900;say(m);tone(220,.14,.012,'square');lastUI=-1;};
function drawCan(c){const zb=lerp(-146,20,c),v=vessel(CI,CO,38,zb,150,[-8,98,zb+16,zb+132],'metal'),y=P(0,0,v.zt)[1];set(inG,'y1',y-30);set(inG,'y2',y+120);
into(CI);el('path',{d:ringD(38,42),class:'face top metal hole',transform:TOP(0,0,v.zt)});
into(CO);text(group(front45(at(38.05,45,zb+8.5))),0,0,'QELVA · OVC · 10⁻⁶ mbar','etch micro center');{const q=at(37.6,-20,zb+80);cylinder(q[0],q[1],q[2],3.4,5,'x','metal');}
el('path',{d:v.sil,class:'hit'});el('ellipse',{cx:P(0,0,4)[0],cy:P(0,0,4)[1],rx:52.7,ry:30.4,class:'hit'});el('path',{d:v.sil,class:'focus-ring'});into(draw);}
// Signal paths: rack → loom → feedthrough → stages → qubit box, measured once so each stage flashes on time.
function sig(k,toRack){const th=TH[k],pig={a:at(31,th,181.4),c1:at(31,th,187),c2:[lm.A[0]-6,lm.A[1],lm.A[2]],b:lm.A},loom={a:lm.A,c1:lm.c1,c2:lm.c2,b:lm.B};
const segs=toRack?[...SEG[k].slice().reverse().map(g=>[g,1]),[pig,0],[loom,0]]:[[loom,1],[pig,1],...SEG[k].map(g=>[g,0])];let L=0,d='';const ev=[];
segs.forEach(([g,r],i)=>{const s=segD(g,r);set(scratch,'d',s);const l=scratch.getTotalLength();if(g.s!==undefined)ev.push([L+(r?0:l),g.s]);L+=l;d+=i?s.replace('M','L'):s;});return{d,L,ev,k};}
const PATH={dr:sig(KD,0),in:sig(KI,0),out:sig(KO,1)},flying=[];
function comet(path,cls,dur,done){if(reduced.matches){for(const[,s]of path.ev)flick(att[s][path.k]);done();return;}const g=el('path',{d:path.d,class:'pg '+cls},PL),a=el('path',{d:path.d,class:'pt '+cls},PL),b=el('path',{d:path.d,class:'pc'},PL);
set(g,'stroke-dasharray',`10 ${path.L+60}`);set(a,'stroke-dasharray',`18 ${path.L+60}`);set(b,'stroke-dasharray',`5 ${path.L+60}`);flying.push({g,a,b,path,t0:now,dur,done,ev:path.ev.slice()});}
function flick(n){if(!n)return;n.classList.add('hot');setTimeout(()=>n.classList.remove('hot'),170);}
function flashQ(c){qFlash.style.fill=`var(${c})`;qFlash.style.opacity=.75;setTimeout(()=>qFlash.style.opacity=0,220);}
function canToggle(){audio();if(p>0||dir){warn('WARM UP FIRST · W','The stages must be back at room temperature before the vacuum can is vented and lowered. Press W.');return;}
canT=canT?0:1;sealT=0;tone(canT?520:420,.08);say(canT?'Vacuum can rising out of the pit.':'Venting. Vacuum can lowering into the pit.');sync();}
function cool(){audio();if(!sealed||canT!==1){warn('SEAL THE CAN FIRST · O','The vacuum can must be raised and sealed before cooling. Press O.');return;}if(p>=1){note='AT BASE · 9.8 mK';noteT=now+1600;say('Already at base temperature.');lastUI=-1;return;}dir=1;if(reduced.matches){p=1;dir=0;}say('Cooling down. Pulse tube running.');sync();}
function warm(){audio();if(p<=0&&!dir){note='ALREADY AT 300 K';noteT=now+1600;say('Already at room temperature.');lastUI=-1;return;}dir=-1;if(reduced.matches){p=0;dir=0;}say('Warming up to room temperature.');sync();}
function readPulse(){audio();if(busy)return;if(!cold()){warn('TOO WARM FOR READOUT · C','The mixing chamber must be below 20 millikelvin. Press C to cool down.');return;}
busy=true;noteT=0;flick(awgL);tone(2400,.08,.008,'sine',0,3400);say('Readout pulse sent.');comet(PATH.in,'pin',1100,()=>{flashQ('--accent');tone(1600,.05,.008);comet(PATH.out,'pret',1100,result);});lastUI=-1;}
function piPulse(){audio();if(busy)return;if(!cold()){warn('TOO WARM FOR A π-PULSE · C','Cool down before driving the qubit. Press C.');return;}
busy=true;noteT=0;flick(rfL);tone(1800,.1,.008,'triangle');comet(PATH.dr,'pdr',900,()=>{prep^=1;flashQ('--drive');busy=false;note=`π-PULSE · QUBIT |${prep}⟩`;noteT=now+1800;say(prep?'Pi pulse: qubit in state one.':'Pi pulse: qubit back in state zero.');lastUI=-1;});lastUI=-1;}
function result(){busy=false;const m=prep^(Math.random()<.05?1:0);counts[m]++;const c=m?[46.4,12.4]:[36.4,19.6],a=Math.random()*6.28,r=Math.random()*2.6;
circle(shots,c[0]+Math.cos(a)*r,c[1]+Math.sin(a)*r,.5,'shot').style.fill=m?'var(--drive)':'var(--accent)';if(shots.childNodes.length>40)shots.firstChild.remove();flick(digL);tone(m?880:660,.14,.01);note=`MEASURED |${m}⟩ · ${counts[0]+counts[1]} SHOTS`;noteT=now+2200;say(`Measured state ${m}.`);lastUI=-1;}
function sync(){set(CO,'aria-label',`${canT?'Lower':'Raise'} the vacuum can (O)`);set(CO,'aria-pressed',!!canT);set(hk.o,'aria-pressed',!!canT);set(hk.c,'aria-pressed',dir>0||p>=1);
set(TP,'aria-label',dir>0||p>=1?'Warm up (W)':'Cool down (C)');set(MN,'aria-label','Send a readout pulse (Space)');lastUI=-1;}
function stateText(){if(now<noteT)return note;if(busy)return'PULSE IN FLIGHT';
if(canT===1&&canH<1)return'CAN RISING FROM THE PIT';if(canT===1&&!sealed)return'SEALING · 20 BOLTS';if(canT===0&&sealed)return'VENTING · UNBOLTING';if(canT===0&&canH>0)return'CAN LOWERING INTO THE PIT';
if(dir>0){const k=Math.max(0,WIN.findIndex(w=>sm(clamp((p-w[0])/(w[1]-w[0])))<.98));return p<.42?`PULSE TUBE · ${ST[k].n} STAGE`:p<.56?'CONDENSING MIXTURE':`CIRCULATING · ${ST[k].n}`;}
if(dir<0)return'WARMING UP';if(cold())return`BASE TEMPERATURE · QUBIT |${prep}⟩`;if(p>0)return'PART COOLED · C TO CONTINUE';return sealed?(vac<.98?'PUMPING THE CAN':'SEALED · C TO COOL'):'CAN OPEN · O TO SEAL';}
function ui(){readout.textContent=`MXC ${fmtT(T[4])} · STILL ${fmtT(T[2])} · DAY ${(p*1.9).toFixed(1)}`;stateLabel.textContent=stateText();
ST.forEach((s,i)=>{const c=tcol(T[i]);s.halo.style.fill=c;s.halo.style.setProperty('--u',uOf(T[i]).toFixed(3));s.rim.style.stroke=c;tled[i].style.fill=c;
let d='';for(let j=0;j<=40;j++)d+=(j?'L':'M')+(4+23*j/40*p).toFixed(2)+','+(8+17*uOf(tAt(i,j/40*p))).toFixed(2);set(traces[i],'d',p>0?d:'');traces[i].style.stroke=tcol(ST[i].T);});
tcT.textContent=fmtT(T[4]);mHead.textContent=cold()?`BASE ${fmtT(T[4])}`:dir>0?'COOLING':dir<0?'WARMING':sealed?'READY':'CAN OPEN';tally.textContent=`|0⟩ ${counts[0]} · |1⟩ ${counts[1]}`;
const run=p>0||dir!==0,flow=p>.5;lit(ptLed,run?'g':'');lit(ghsLed,run?'g':'');lit(tLed,vac>.05?'g':'');lit(rfL,cold()?'b':'');lit(upsL,'g');
loop.classList.toggle('on',flow);valves.forEach((v,i)=>lit(v,i<4?(flow?'g':''):(sealed&&vac<.98?'a':sealed?'g':'')));
set(gauge[0],'transform',`rotate(${lerp(120,-120,vac)} 10 16)`);set(gauge[1],'transform',`rotate(${flow?-40+30*Math.sin(now/1600):-120} 26 16)`);upsT.textContent=run?'1.8 kW':'230 V';}
const act={o:canToggle,c:cool,w:warm,' ':readPulse,x:piPulse};
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(CO,canToggle);bind(TP,()=>dir>0||p>=1?warm():cool());bind(MN,readPulse);bind(QB,piPulse);
for(const[k,b]of Object.entries(hk))b.addEventListener('click',()=>act[k]());
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const k=e.key.toLowerCase();if(k===' '&&e.target.closest&&e.target.closest('button,[role=button]'))return;if(act[k]){e.preventDefault();act[k]();}});
function tick(t){const dt=Math.min(.05,Math.max(0,(t-last)/1000)),red=reduced.matches;last=now=t;const v=dt/3.4;
if(canT===1){if(canH<1)canH=Math.min(1,canH+v);else if(!sealed){sealT+=dt;if(sealT>.8){sealed=true;sealT=0;tone(880,.06);tone(1175,.08,.01,'sine',.08);say('Vacuum can sealed. Pumping out.');sync();}}}
else if(sealed){sealT+=dt;if(sealT>.6){sealed=false;sealT=0;vac=0;sync();}}else canH=Math.max(0,canH-v);
if(red){canH=canT;sealed=!!canT;}
vac=sealed?Math.min(1,vac+dt/3):0;
bolts.forEach((b,i)=>lit(b,!sealed&&canT===1&&canH>=1&&sealT>i*.035||sealed&&canT===0&&sealT<.6-i*.025?'b':''));
if(dir){p=clamp(p+dir*dt/(dir>0?16:10));if(p>=1&&dir>0){dir=0;tone(523,.3,.012);tone(784,.45,.01,'sine',.14);say('Base temperature reached: 10 millikelvin.');sync();}if(p<=0&&dir<0){dir=0;say('Room temperature. The can can be lowered.');sync();}}
ST.forEach((_,i)=>{T[i]=tAt(i,p);});
const ch=+sm(canH).toFixed(4);if(ch!==drawnCan){drawnCan=ch;drawCan(ch);}
if((p>0||dir)&&!red&&t-thumpT>700){thumpT=t;set(mh,'transform','translate(0 -.8)');setTimeout(()=>set(mh,'transform',''),110);tone(46,.12,.014);}
for(let i=flying.length;i--;){const f=flying[i],s=(t-f.t0)/f.dur*f.path.L;set(f.g,'stroke-dashoffset',10-s);set(f.a,'stroke-dashoffset',18-s);set(f.b,'stroke-dashoffset',5-s);
while(f.ev.length&&f.ev[0][0]<=s){flick(att[f.ev[0][1]][f.path.k]);f.ev.shift();}if(s>=f.path.L+18){f.g.remove();f.a.remove();f.b.remove();flying.splice(i,1);f.done();}}
const cq=cold();qb.style.fill=cq?`var(${prep?'--drive':'--accent'})`:'';qb.style.filter=cq?'url(#glow)':'';qb.style.opacity=cq&&!red?(.65+.35*Math.sin(t/420)).toFixed(2):'';
const blink=Math.floor(t/180);if(blink!==tick.b){tick.b=blink;sw.forEach(l=>lit(l,Math.random()<.5+(busy?.3:0)?'g':''));dcL.forEach((l,i)=>lit(l,i<(cq?6:p>0?3:1)?'g':''));lit(awgL,busy?'b':'');lit(digL,busy?'c':'');
let w='M8.5,26';for(let x=0;x<=17;x+=.5){const e=busy?Math.exp(-Math.pow((x-8.5-Math.sin(t/300)*3)/2.2,2)):0;w+=`L${(8.5+x).toFixed(1)},${(26-Math.sin(x*3.2)*e*3.6-.2).toFixed(2)}`;}set(awgW,'d',w);}
if(lastUI<0||t-lastUI>130){lastUI=t;ui();}
requestAnimationFrame(tick);}
drawCan(0);drawnCan=0;draw.appendChild(PL);sync();ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['o', 'c', 'w', ' ', 'x'], draw }
