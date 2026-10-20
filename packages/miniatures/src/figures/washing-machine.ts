// @ts-nocheck
/* AVELIN W–06 · Washing machine. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--rubber:#2e2e2d;--screen:#1c1d1e;--enamel:#fbfbf9;--wall:#8a8a87;--drum:#cfcfcb;--water:#7fa6e0;--dglass:#22303a;--cloth1:#dda08a;--cloth2:#9cb8b0;--cloth3:#bcb1cd;--towel1:#c9d8cd;--towel2:#e9dcc8;--powder:#f6f3ea;--soft:#a9c4ee;--hose:#d4d4d0;--fold:#7d7d79}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--rubber:#252524;--screen:#161717;--enamel:#d4d4d2;--wall:#737371;--drum:#aeaeac;--water:#6a8bbd;--dglass:#1b272f;--cloth1:#ba8673;--cloth2:#839b94;--cloth3:#9e95ac;--towel1:#acb5ae;--towel2:#c4b9a8;--powder:#cfcdc7;--soft:#8ea5c9;--hose:#b2b2b0;--fold:#686866;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.rubber{fill:var(--rubber)}.screen{fill:var(--screen)}.enamel{fill:var(--enamel)}.wall{fill:var(--wall)}.drum{fill:var(--drum)}.powder{fill:var(--powder)}.soft{fill:var(--soft)}.towel1{fill:var(--towel1)}.towel2{fill:var(--towel2)}.c1{fill:var(--cloth1)}.c2{fill:var(--cloth2)}.c3{fill:var(--cloth3)}.hole{fill-rule:evenodd}
.water{fill:var(--water);opacity:.42;stroke:none}.wline{fill:none;stroke:var(--water);stroke-width:.9}.bubble{fill:#fff;opacity:.55;stroke:none}.dglass{fill:var(--dglass);opacity:.34;stroke:none}.refl{fill:none;stroke:#fff;stroke-width:1.6;stroke-linecap:round;opacity:.45}.dlight{fill:url(#dlight);opacity:0}.fold{fill:none;stroke:var(--fold);stroke-width:.5;opacity:.7}
.cbu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.cbl{fill:none;stroke-linecap:round;stroke-linejoin:round}.k1{stroke:var(--rubber)}.k2{stroke:var(--hose)}
.lamp{fill:var(--off);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.r,.lamp.b{filter:url(#glow);stroke:none}
.ring{fill:none;stroke:var(--off);stroke-width:1.1}.ring.b{stroke:var(--accent);filter:url(#glow)}.ring.a{stroke:var(--warn);filter:url(#glow)}.ring.g{stroke:var(--ok);filter:url(#glow)}
.scr{fill:var(--accent);font:3px ui-monospace,monospace;letter-spacing:.5px;stroke:none}.scr.big{font:600 9px ui-monospace,monospace;letter-spacing:.3px}.done .scr{fill:var(--ok)}.halo{fill:var(--accent);opacity:.13;filter:url(#bloom)}.ico{fill:none;stroke:var(--off);stroke-width:.7;stroke-linecap:round;stroke-linejoin:round}.ico.on{stroke:var(--accent);filter:url(#glow)}.trk{stroke:var(--off);stroke-width:1}.prog{stroke:var(--accent);stroke-width:1.2;stroke-linecap:round}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}.control[aria-disabled=true]{cursor:default}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="dlight" cx=".5" cy=".2" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".9"/><stop offset=".6" stop-color="#fff" stop-opacity=".25"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
<clipPath id="drumClip"><circle r="46"/></clipPath><clipPath id="trayClip"><path id="trayPath"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* AVELIN W–06. World: x lower-right, y lower-left, z up; 1 unit ≈ 3.5 mm.
Part                        x      y      z      w      d      h
feet (4)               28/171 24/160      0     15     15      8
plinth                     18     12      8    174    174     13
cabinet                    18     12     21    174    172    224   side panel, ribs, rating label
worktop                    14      8    245    182    180      8   two folded towels
fascia                     20    184    206    170      3     38   drawer opening, dial + 4 LEDs, display, start, lock
porthole + gasket       r 52   105 184 131     –      –      –   drum: inner wall, perforated back, lifters, light
door                    r 58  hinge 46 187    –      9      –   glass, chrome ring, handle; swings to 105°
detergent drawer           24    144    214     56     46     26   travels 42: powder, prewash, softener
pump hatch                140    184     30     36      0     26
inlet hose + power cord   192  8–40   0–238     –      –      –
laundry basket            206    116      0     58     50     36   slats, rim, three garments
Seams, screws, LEDs, icons and labels share their parent faces. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: vectors, oriented planes, bevelled panels, LEDs, rounded runs, convex hull.
const add=(a,b)=>a.map((v,i)=>v+b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(Math.hypot(...a)||1)),VIEW=[1,1,1],RAD=Math.PI/180;
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function axes(n){const U=unit(Math.abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U);const a=P(...U),b=P(...V);if(a[0]*b[1]-a[1]*b[0]<0)V=mul(V,-1);return[U,V];}
function panel(g,x,y,w,h,b,inset=false){rect(g,x,y,w,h,1,'face');el('path',{d:`M${x},${y}H${x+w}L${x+w-b},${y+b}H${x+b}ZM${x},${y}L${x+b},${y+b}V${y+h-b}L${x},${y+h}Z`,class:`face ${inset?'side':'top'}`},g);el('path',{d:`M${x},${y+h}L${x+b},${y+h-b}H${x+w-b}L${x+w},${y+h}ZM${x+w},${y}V${y+h}L${x+w-b},${y+h-b}V${y+b}Z`,class:`face ${inset?'top':'side'}`},g);}
function lamp(g,x,y,r=1){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c,base='lamp'){if(n._c!==c){n._c=c;set(n,'class',base+(c?' '+c:''));}}
function route(pts,r=4){let d='M'+P(...pts[0]);for(let i=1;i<pts.length-1;i++){const a=pts[i-1],b=pts[i],c=pts[i+1],la=Math.hypot(...b.map((v,j)=>v-a[j])),lc=Math.hypot(...c.map((v,j)=>v-b[j])),p=b.map((v,j)=>v+(a[j]-v)*Math.min(r,la/2)/la),q=b.map((v,j)=>v+(c[j]-v)*Math.min(r,lc/2)/lc);d+='L'+P(...p)+'Q'+P(...b)+' '+P(...q);}return d+'L'+P(...pts[pts.length-1]);}
function hose(pts,cls,w){const d=route(pts);el('path',{d,class:'cbu','stroke-width':w+1});el('path',{d,class:'cbl '+cls,'stroke-width':w});}
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const p of pts){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(const p of pts.reverse()){while(hi.length>1&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}
const cloth=(g,k)=>{const r=el('g',{},g);el('path',{d:['M-15,-8L-8,-15L-3,-12L4,-14L12,-10L15,-2L8,1L9,12L-9,14L-11,2L-17,-1Z','M-15,-8Q-2,-16 13,-9L16,8Q5,15 -11,12Z','M-10,-15L1,-16L4,0L13,5Q18,12 9,14L-4,8L-7,0Z'][k],class:'face c'+(k+1)},r);el('path',{d:['M-6,-8Q-1,-1 -5,9M3,-9L5,8','M-10,-5Q0,-10 10,-4M-9,4Q2,0 12,7','M-5,-10L0,2L10,9'][k],class:'fold'},r);return r;};
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
// Assembly: shadow, back hose and cord, feet, plinth, cabinet, side panel, worktop and towels.
const sp=P(112,104,0);el('ellipse',{cx:sp[0],cy:sp[1]+8,rx:150,ry:70,class:'shadow stage-floor'});el('ellipse',{cx:sp[0],cy:sp[1]+8,rx:150,ry:70,class:'stage-contact'});
hose([[192,30,40],[204,30,30],[214,36,6],[236,50,2],[246,66,2]],'k1',2.6);box(240,62,0,12,9,5,2,'rubber');
for(const[x,y]of[[28,24],[171,24],[28,160],[171,160]]){cylinder(x+7.5,y+7.5,0,6.5,4,'z','rubber');cylinder(x+7.5,y+7.5,4,4,4,'z','metal');}
box(18,12,8,174,174,13,4,'base');const pl=group(FRONT(18,186,21));line(pl,6,8,168,8);for(let i=0;i<14;i++)rect(pl,40+i*7,3,3.2,4.4,1,'face recess');
box(18,12,21,174,172,224,5);
const sd=group(SIDE(192,184,245));panel(sd,14,20,144,170,3,true);for(let i=0;i<3;i++){rect(sd,40+i*36,48,6,116,3,'face top');line(sd,46+i*36,50,46+i*36,162);}
rect(sd,128,198,34,16,1,'face top');text(sd,131,203.6,'AVELIN W–06','etch micro');text(sd,131,207.6,'230 V · 2.1 kW · IPX4','etch micro');text(sd,131,211.4,'6 KG · 1200 RPM','etch micro');for(const[u,v]of[[6,6],[166,6],[6,218],[166,218]])screw(sd,u,v);
hose([[194,18,238],[198,16,232],[198,16,50],[202,16,12],[214,20,3],[234,24,2]],'k2',3.2);
box(14,8,245,182,180,8,5);const tp=group(TOP(14,8,253.1));rect(tp,6,6,170,168,4,'detail');line(tp,8,162,174,162);
for(const[x,y,z,c]of[[124,30,253,'towel1'],[126,33,257.5,'towel2'],[124,31,262,'towel1']]){box(x,y,z,44,34,4.5,2.2,c);line(group(FRONT(x,y+34,z+4.5)),3,2.2,41,2.2,'fold');line(group(SIDE(x+44,y+34,z+4.5)),3,2.2,31,2.2,'fold');}
// Front: brand, porthole with the drum, pump hatch.
const fr=group(FRONT(18,184.2,206));text(fr,8,10,'AVELIN','label brand');text(fr,8.4,15.6,'FABRIC CARE · W–06','etch micro');line(fr,4,180,170,180);line(fr,4,182.6,170,182.6);
const ph=group(FRONT(140,184.3,58));rect(ph,0,0,36,26,4,'face');rect(ph,2.5,2.5,31,21,3,'detail');rect(ph,13,4.5,10,3,1.5,'face recess');screw(ph,6,20);
const dr=group(FRONT(105,184.3,131));circle(dr,0,0,53,'face top');circle(dr,0,0,52,'detail');circle(dr,0,0,49.5,'face rubber');
const inner=el('g',{'clip-path':'url(#drumClip)'},dr);circle(inner,0,0,46,'face wall');
const back=group('translate(12 -12)',inner),spin=group('',back);circle(spin,0,0,46,'face drum');
for(let k=0;k<5;k++){const r=10+k*7.4,n=Math.round(r*.62);for(let i=0;i<n;i++){const t=(i/n+k*.07)*Math.PI*2;circle(spin,Math.cos(t)*r,Math.sin(t)*r,.75,'face wall');}}
for(let i=0;i<3;i++){const g=group(`rotate(${i*120})`,spin);el('path',{d:'M-5,-46L-6,-26Q0,-20 6,-26L5,-46Z',class:'face top'},g);line(g,0,-43,0,-27);}
circle(spin,0,0,8,'face metal');circle(spin,0,0,4,'face wall');
const water=el('path',{class:'water'},inner),wl=el('path',{class:'wline'},inner),clothes=el('g',{},inner),cl=[0,1,2].map(k=>cloth(clothes,k));
const bubbles=[0,1,2,3,4,5].map(()=>circle(inner,0,0,1,'bubble'));const dlight=el('ellipse',{cx:0,cy:-24,rx:46,ry:34,class:'dlight'},inner);
circle(dr,0,0,46,'detail');el('path',{d:'M-44,13A46,46 0 0 0 13,44',class:'detail',style:'stroke-width:2;opacity:.35'},dr);
for(const z of[164,92]){box(40,184,z,8,5,12,2,'metal');}
// Fascia: raised control strip with the drawer opening.
box(20,184,206,170,3,38,3);el('path',{d:'M3,0H167Q170,0 170,3V35Q170,38 167,38H3Q0,38 0,35V3Q0,0 3,0ZM4,3V29H60V3Z',class:'face hole',transform:FRONT(20,187,244)});
const fa=group(FRONT(20,187.1,244));
const trayG=el('g',{'clip-path':'url(#trayClip)'}),drawG=button(el('g',{}),{'aria-label':'Open the detergent drawer (D)','aria-pressed':'false'});
root=trayG;box(25,144,217,54,42,20,2,'base');const tt=group(TOP(25,144,237.05));rect(tt,2,2,50,38,2,'face recess');
[[4,22,'powder','II'],[28,12,'',' I'],[42,8,'soft','✳']].forEach(([u,w,c,l])=>{rect(tt,u,4,w,34,2,'face base');if(c)rect(tt,u+1.5,10,w-3,26,1.5,'face '+c);});for(let i=0;i<12;i++)circle(tt,7+(i%4)*4.5,14+Math.floor(i/4)*6,.6,'face top');
root=drawG;box(24,186,214,56,4,26,3);const df=group(FRONT(24,190,240));rect(df,4,4,48,18,2,'detail');rect(df,14,14,28,5,2.5,'face recess');line(df,16,14,40,14);text(df,28,10.4,'DETERGENT','etch micro center');rect(df,-2,-2,60,30,4,'focus-ring');
root=document.getElementById('drawing');
const dialG=button(group('',fa),{'aria-label':'Next program (1–4)'});circle(dialG,86,19,15.4,'face recess');const PL=[0,1,2,3].map(i=>{const t=(-120+80*i)*RAD;return lamp(dialG,86+Math.sin(t)*13.4,19-Math.cos(t)*13.4,.95);});
const knob=group('',dialG);circle(knob,86,19,10.4,'face top');circle(knob,86,19,8.2,'detail');line(knob,86,11.6,86,15,'detail');set(knob.lastChild,'style','stroke:var(--accent);stroke-width:1.4');circle(dialG,86,19,18,'focus-ring');circle(dialG,86,19,18,'hit');
rect(fa,108,4,44,30,2.5,'face recess');rect(fa,111,7,38,24,2,'halo');const disp=group('',fa);rect(disp,110,5.4,41,27.2,1.8,'face screen');
const dName=text(disp,113,11.6,'COTTON 40°','scr'),dTime=text(disp,113,23,'42:00','scr big');
const ICONS=['M0,-2.2Q1.6,0 0,1.6Q-1.6,0 0,-2.2Z','M-2.2,-.6Q-1.1,-1.6 0,-.6Q1.1,.4 2.2,-.6M-2.2,1.2Q-1.1,.2 0,1.2Q1.1,2.2 2.2,1.2','M-1.2,-2Q-.2,-.6 -1.2,.6Q-2.2,-.6 -1.2,-2ZM1.2,-.8Q2.2,.6 1.2,1.8Q.2,.6 1.2,-.8Z','M1.8,-.2A1.8,1.8 0 1 1 .2,-1.8M.2,-1.8L-.6,-2.6M.2,-1.8L-.6,-1'].map((d,i)=>el('path',{d,class:'ico',transform:`translate(${135.6+i*4.3} 10.4)`},disp));
line(disp,113,28.6,148,28.6,'trk');const bar=line(disp,113,28.6,113,28.6,'prog');
const startG=button(group('',fa),{'aria-label':'Start or pause the wash (Space)','aria-pressed':'false'});circle(startG,161,19,8.6,'face recess');const sRing=circle(startG,161,19,7.4,'ring');sRing._c='';circle(startG,161,19,6,'face top');el('path',{d:'M158.6,16.4V21.6L162,19ZM163,16.4V21.6M165,16.4V21.6',class:'detail'},startG);circle(startG,161,19,11,'focus-ring');circle(startG,161,19,11,'hit');
const lockL=lamp(fa,161,32.8,.9);el('path',{d:'M163.6,32.6V31.6A1,1 0 0 1 165.6,31.6V32.6M163.2,32.6H166V35H163.2Z',class:'detail'},fa);text(fa,161,6.6,'START','etch micro center');
// Door: a 9-deep disc swung about the hinge line at x 46, y 187.
const doorG=button(el('g',{}),{'aria-label':'Open the glass door (O)','aria-pressed':'false'});
function drawDoor(pose){doorG.replaceChildren();const th=pose*105*RAD,U=[Math.cos(th),Math.sin(th),0],N=[-Math.sin(th),Math.cos(th),0],c=[46+58*Math.cos(th),187+58*Math.sin(th),131],b=add(c,mul(N,9)),[A,B]=axes(N),pa=P(...A),pb=P(...B),pd=P(...mul(N,9)),det=pa[0]*pb[1]-pb[0]*pa[1],u=(pd[0]*pb[1]-pb[0]*pd[1])/det,v=(pa[0]*pd[1]-pd[0]*pa[1])/det,l=Math.hypot(u,v)||1,R=58,tx=-v*R/l,ty=u*R/l,f=dot(N,VIEW)>0,hx=f?u:0,hy=f?v:0,G=45;
el('path',{d:`M${tx},${ty}A${R},${R} 0 0 1 ${-tx},${-ty}L${u-tx},${v-ty}A${R},${R} 0 0 1 ${u+tx},${v+ty}ZM${hx+G},${hy}A${G},${G} 0 1 0 ${hx-G},${hy}A${G},${G} 0 1 0 ${hx+G},${hy}Z`,transform:plane(c,A,B),class:'face enamel hole'},doorG);
const cap=group(plane(f?b:c,A,B),doorG);el('path',{d:`M${R},0A${R},${R} 0 1 0 ${-R},0A${R},${R} 0 1 0 ${R},0ZM${G},0A${G},${G} 0 1 1 ${-G},0A${G},${G} 0 1 1 ${G},0Z`,class:`face ${f?'top':'side'} enamel hole`},cap);
if(f){circle(cap,0,0,54,'detail');el('path',{d:`M49.5,0A49.5,49.5 0 1 0 -49.5,0A49.5,49.5 0 1 0 49.5,0ZM${G},0A${G},${G} 0 1 1 ${-G},0A${G},${G} 0 1 1 ${G},0Z`,class:'face metal hole'},cap);circle(cap,0,0,G,'dglass');circle(cap,0,0,G,'detail');}else{circle(cap,0,0,G,'dglass');circle(cap,0,0,38,'detail');}
const rf=group(plane(f?b:c,U,[0,0,-1]),doorG);el('path',{d:'M-30,-24Q-14,-40 10,-38M-28,-17L-24,-23',class:'refl'},rf);el('path',{d:'M-30,30A42,42 0 0 0 22,37',class:'refl',style:'opacity:.15'},rf);
if(f){const h=add(add(c,mul(U,50)),mul(N,9.5)),hg=group(plane(add(h,[0,0,13]),[0,0,-1],U),doorG);rect(hg,0,-3.5,26,7,3.5,'face metal');rect(hg,3,-1.5,20,3,1.5,'face recess');}
const hit=group(plane(f?b:c,A,B),doorG);circle(hit,0,0,R+3,'focus-ring');circle(hit,0,0,R,'hit');}
const flyG=el('g',{'pointer-events':'none',opacity:0}),fly=[0,1,2].map(k=>cloth(flyG,k));
// Laundry basket on the right, against the side panel.
const bask=button(el('g',{}),{'aria-label':'Load laundry from the basket (L)','aria-pressed':'false'});root=bask;
for(const[x,y]of[[208,118],[256,118],[208,160],[256,160]])box(x,y,0,6,6,3,2,'base');box(206,116,3,58,50,32,5);
for(const[g,w]of[[group(FRONT(206,166,35)),58],[group(SIDE(264,166,35)),50]]){for(let x=6;x<w-4;x+=5.2)rect(g,x,6,2.6,20,1.3,'face recess');rect(g,w/2-9,2.2,18,3.4,1.7,'face recess');}
box(204,114,35,62,54,4,4);const bt=group(TOP(208,118,39.1));rect(bt,0,0,54,46,4,'face recess');const heap=group(TOP(235,141,41),bask);[0,1,2].forEach(k=>set(cloth(heap,k),'transform',`translate(${12*(k-1)} ${k===1?-5:3}) rotate(${20*(k-1)})`));rect(bt,-4,-4,62,54,5,'focus-ring');
root=document.getElementById('drawing');root.appendChild(flyG);
frame([[14,8,0,182,180,263],[14,187,73,34,118,116],[204,114,0,62,54,42],[192,8,0,56,66,40]],18);
// State: programs, door, drawer, load, the wash cycle; audio only after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),hk={};
document.querySelectorAll('.hint [data-k]').forEach(b=>{hk[b.dataset.k]=b;});
const PROG=[{name:'COTTON 40°',min:42,water:.48,rpm:1200},{name:'QUICK 30°',min:22,water:.38,rpm:1000},{name:'DELICATE 20°',min:36,water:.62,rpm:600},{name:'SPIN',min:14,water:0,rpm:1200}];
let sel=0,doorOpen=false,drawerOpen=false,loaded=false,doorPose=0,drawerPose=0,dialA=-120,mode='idle',elapsed=0,level=0,angle=0,phase='READY',last=0,lastUI=-1,note='',noteT=0,transferAt=-1,lastDoor=-1,lastDrawer=-1,ac=null,osc=null,gain=null;
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();osc=ac.createOscillator();gain=ac.createGain();const f=ac.createBiquadFilter();f.type='lowpass';f.frequency.value=110;osc.type='sine';osc.frequency.value=52;gain.gain.value=0;osc.connect(f);f.connect(gain);gain.connect(ac.destination);osc.start();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){}}
function beep(f,d=.07,v=.015,when=0){if(!ac)return;try{const t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
function say(m,s=''){announcement.textContent=m;note=s;noteT=performance.now()+1800;lastUI=-1;}
const locked=()=>mode==='running'||level>.045;
function stateText(){if(note&&performance.now()<noteT)return note;if(mode==='running')return`${phase} · DOOR LOCKED`;if(mode==='paused')return level>.045?'PAUSING · DRAINING':'PAUSED · DOOR UNLOCKED';if(mode==='idle'&&level>.045)return'DRAINING · DOOR LOCKED';if(transferAt>=0)return loaded?'LOADING THE DRUM':'UNLOADING THE DRUM';if(mode==='complete')return doorOpen?'CLEAN · L TO UNLOAD':'CYCLE COMPLETE · DOOR UNLOCKED';if(doorOpen)return loaded?'LOADED · CLOSE DOOR':'DOOR OPEN · L TO LOAD';if(drawerOpen)return'DETERGENT DRAWER OPEN';return loaded?'READY · SPACE TO START':'EMPTY · OPEN DOOR TO LOAD';}
function sync(){const lk=locked();set(doorG,'aria-pressed',doorOpen);set(doorG,'aria-disabled',lk);set(doorG,'aria-label',`${doorOpen?'Close':'Open'} the glass door (O)${lk?', locked':''}`);set(drawG,'aria-pressed',drawerOpen);set(drawG,'aria-disabled',mode==='running');set(drawG,'aria-label',(drawerOpen?'Close':'Open')+' the detergent drawer (D)');
set(bask,'aria-pressed',loaded);set(bask,'aria-disabled',!doorOpen||lk);set(bask,'aria-label',(loaded?'Unload the laundry into':'Load the laundry from')+' the basket (L)');set(startG,'aria-pressed',mode==='running');set(startG,'aria-label',(mode==='running'?'Pause':mode==='paused'?'Resume':'Start')+' the wash (Space)');set(dialG,'aria-label',`Next program (1–4). Selected ${sel+1}, ${PROG[sel].name}.`);
set(hk.o,'aria-pressed',doorOpen);set(hk.d,'aria-pressed',drawerOpen);set(hk[' '],'aria-pressed',mode==='running');clothes.style.display=loaded&&transferAt<0?'':'none';heap.style.display=!loaded&&transferAt<0?'':'none';}
function door(){audio();if(locked()){say('Door locked. Pause the cycle with Space; the machine drains before unlocking.','DOOR LOCKED · SPACE TO PAUSE');beep(300,.12);return;}doorOpen=!doorOpen;beep(doorOpen?520:420,.05);say(doorOpen?'Door open. Press L or click the basket to load or unload.':'Door closed.');sync();}
function drawer(){audio();if(mode==='running'){say('Pause the cycle before opening the detergent drawer.','DRAWER LOCKED · SPACE TO PAUSE');beep(300,.12);return;}drawerOpen=!drawerOpen;say(drawerOpen?'Detergent drawer open: powder, prewash and softener compartments.':'Detergent drawer closed.',drawerOpen?'DRAWER OPEN · ADD DETERGENT':'DRAWER CLOSED');sync();}
function load(){audio();if(!doorOpen||locked()){say('Open the unlocked door with O before loading the drum.','OPEN DOOR · O TO LOAD');beep(300,.12);return;}if(transferAt>=0)return;loaded=!loaded;transferAt=reduced.matches?-1:performance.now();if(mode==='complete'||mode==='idle'){mode='idle';elapsed=0;}say(loaded?'Three garments loaded. Close the door with O, then press Space to start.':'Laundry moved back to the basket.');sync();}
function program(i){audio();if(mode==='running'){say('Pause the cycle before changing the program.','PAUSE TO CHANGE PROGRAM');beep(300,.12);return;}sel=i;elapsed=0;mode='idle';beep(880,.04);say(`Program ${i+1}: ${PROG[i].name}. ${PROG[i].min} minutes, ${PROG[i].rpm} RPM.`,`PROGRAM ${i+1} · ${PROG[i].rpm} RPM`);sync();}
function start(){audio();if(mode==='running'){mode='paused';beep(660,.06);say('Wash paused. Water draining; the door unlocks when safe.');sync();return;}
if(doorOpen||doorPose>.015){say('Close the glass door with O before starting.','CLOSE DOOR · O');beep(300,.12);return;}if(drawerOpen||drawerPose>.015){say('Close the detergent drawer with D before starting.','CLOSE DRAWER · D');beep(300,.12);return;}
if(!loaded){say('Open the door with O and load laundry with L first.','EMPTY · O THEN L TO LOAD');beep(300,.12);return;}if(transferAt>=0){say('Wait for the laundry to finish loading.','LOADING THE DRUM');return;}
if(mode==='complete'){elapsed=0;level=0;}mode='running';note='';beep(880,.06);beep(1175,.08,.015,.08);say('Wash started. Door locked. One second stands for one minute.');sync();}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(doorG,door);bind(drawG,drawer);bind(bask,load);bind(dialG,()=>program((sel+1)%4));bind(startG,start);
const act={o:door,d:drawer,l:load,' ':start,'1':()=>program(0),'2':()=>program(1),'3':()=>program(2),'4':()=>program(3)};
for(const[k,b]of Object.entries(hk))b.addEventListener('click',()=>act[k]());
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const k=e.key.toLowerCase();if(k===' '&&e.target.closest&&e.target.closest('button,[role=button]'))return;if(act[k]){e.preventDefault();act[k]();}});
function placeDrawer(p){const t=42*p,tr=`translate(${P(0,t,0).map(v=>v.toFixed(2)).join(' ')})`;set(drawG,'transform',tr);set(trayG,'transform',tr);
const pts=[];for(const x of[25,79])for(const y of[187,Math.max(187.01,186+t)])for(const z of[217,237])pts.push(P(x,y-t,z));const hp=hull(pts),op=[[24,187,240],[80,187,240],[80,187,214],[24,187,214]].map(q=>P(q[0],q[1]-t,q[2]));
set(document.getElementById('trayPath'),'d','M'+hp.join('L')+'ZM'+op.join('L')+'Z');}
function cycle(dt){if(mode==='running'){const p=PROG[sel];elapsed=Math.min(elapsed+60*dt,60*p.min);const t=elapsed/(60*p.min);let w=0;
if(sel===3)phase=t<.15?'DRAINING':'SPINNING';else if(t<.08){phase='FILLING';w=p.water*t/.08;}else if(t<.6){phase='WASHING';w=p.water;}else if(t<.7){phase='DRAINING';w=p.water*(.7-t)/.1;}else if(t<.84){phase='RINSING';w=.75*p.water*Math.min(1,(t-.7)/.04);}else if(t<.9){phase='DRAINING';w=.75*p.water*(.9-t)/.06;}else phase='SPINNING';
level+=(w-level)*Math.min(1,4*dt);if(reduced.matches)angle=48*Math.floor(elapsed/300);else if(phase==='SPINNING')angle+=dt*(sel===2?370:720);else if(phase==='WASHING'||phase==='RINSING')angle+=38*dt*(Math.floor(elapsed/240)%2?-1:1);
if(t>=1){mode='complete';level=0;phase='COMPLETE';beep(988,.1);beep(1318,.14,.015,.12);beep(1568,.2,.015,.26);say('Cycle complete. Door unlocked. Open with O and unload with L.');sync();}}else if(level>0)level=Math.max(0,level-.48*dt);}
function drum(now){set(spin,'transform',`rotate(${angle.toFixed(1)})`);for(let k=0;k<3;k++){const t=(angle*.82+117*k)*RAD,r=18+3*k;set(cl[k],'transform',`translate(${(Math.sin(t)*r).toFixed(2)} ${(10+Math.cos(t)*r*.63).toFixed(2)}) rotate(${(42*Math.sin(t)+25*k).toFixed(1)})`);}
const y=47-94*level,a=mode==='running'&&!reduced.matches?1.4*Math.sin(now*.003):0,d=`M-49,${y.toFixed(2)}Q-24,${(y+2*a).toFixed(2)} 0,${y.toFixed(2)}T49,${(y-a).toFixed(2)}`;set(water,'d',d+'L49,49L-49,49Z');set(wl,'d',d);water.style.display=wl.style.display=level>.012?'':'none';
bubbles.forEach((b,i)=>{set(b,'cx',(13*i-32+2*Math.sin(now*.002+i)).toFixed(1));set(b,'cy',(y+3+1.5*Math.sin(now*.003+i)).toFixed(1));set(b,'r',.7+i%3*.4);b.style.display=level>.12?'':'none';});
if(transferAt>=0){const t=clamp((now-transferAt)/800),r0=P(235,141,44),r1=P(105,184,131);set(flyG,'opacity',1);clothes.style.display=heap.style.display='none';for(let k=0;k<3;k++){const q=clamp(1.35*t-.16*k),o=loaded?q:1-q;set(fly[k],'transform',`translate(${r0[0]+(r1[0]-r0[0])*o+8*(k-1)} ${r0[1]+(r1[1]-r0[1])*o-45*Math.sin(o*Math.PI)}) scale(${.78+.14*o}) rotate(${70*o+20*k})`);}if(t>=1){transferAt=-1;set(flyG,'opacity',0);sync();lastUI=-1;}}}
function lights(now){const run=mode==='running',breath=reduced.matches?1:.5+.5*Math.sin(now/400);PL.forEach((l,i)=>lit(l,i===sel?'b':''));
lit(sRing,run?'b':mode==='paused'?((reduced.matches||Math.floor(now/500)%2)?'a':''):mode==='complete'?'g':loaded&&!doorOpen?'b':'','ring');sRing.style.opacity=run?(.55+.45*breath).toFixed(2):mode==='idle'&&loaded&&!doorOpen?(.3+.5*breath).toFixed(2):'';
lit(lockL,locked()?'a':'');const ph=['FILLING','WASHING','RINSING','SPINNING'].indexOf(phase);ICONS.forEach((n,i)=>set(n,'class','ico'+(run&&(i===ph||phase==='DRAINING'&&i===2)?' on':'')));
dlight.style.opacity=(doorPose>.05?.55:run?.35+.1*breath:0).toFixed(2);disp.classList.toggle('done',mode==='complete');}
function ui(now){const p=PROG[sel],rem=Math.max(0,Math.ceil(60*p.min-elapsed)),t=`${String(Math.floor(rem/60)).padStart(2,'0')}:${String(rem%60).padStart(2,'0')}`;readout.textContent=`${p.name} · ${t}`;stateLabel.textContent=stateText();
dName.textContent=mode==='complete'?'END · CLEAN':mode==='running'?phase:p.name;dTime.textContent=t;set(bar,'x2',(113+35*elapsed/(60*p.min)).toFixed(1));sync();lastUI=now;}
function tick(now){const dt=last?Math.min((now-last)/1000,.1):0;last=now;const k=reduced.matches?1:Math.min(1,9*dt);
doorPose+=(+doorOpen-doorPose)*k;drawerPose+=(+drawerOpen-drawerPose)*k;if(Math.abs(+doorOpen-doorPose)<5e-4)doorPose=+doorOpen;if(Math.abs(+drawerOpen-drawerPose)<5e-4)drawerPose=+drawerOpen;
if(doorPose!==lastDoor){lastDoor=doorPose;drawDoor(doorPose);}if(drawerPose!==lastDrawer){lastDrawer=drawerPose;placeDrawer(drawerPose);}
dialA+=(80*sel-120-dialA)*k;set(knob,'transform',`rotate(${dialA.toFixed(1)} 86 19)`);cycle(dt);drum(reduced.matches?0:now);lights(now);
if(gain)gain.gain.setTargetAtTime(mode==='running'?(phase==='SPINNING'?.004:.002):0,ac.currentTime,.12),osc.frequency.setTargetAtTime(phase==='SPINNING'?72:52,ac.currentTime,.3);
if(lastUI<0||now-lastUI>120)ui(now);requestAnimationFrame(tick);}
sync();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['o', 'd', 'l', ' '], draw }
