// @ts-nocheck
/* ORVANE R–80 · Refractor telescope. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--dk:#3c3c3b;--dk-top:#4c4c4a;--dk-side:#2f2f2e;--rubber:#2e2e2d;--lens:#20242c;--screen:#1c1d1e;--sky1:#1b2236;--sky2:#04060b;--moon:#e2e0d8;--crater:#b9b6ab;--planet:#d9c49b;--band:#a98f68;--ringc:#cdbb93;--star:#f1f1ee;--lcd:var(--accent);--ret:var(--accent)}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--dk:#313130;--dk-top:#474745;--dk-side:#1e1e1e;--rubber:#252524;--lens:#1a1d22;--screen:#161717;--sky1:#151b2c;--sky2:#030407;--moon:#bebdb8;--crater:#9b9992;--planet:#b7a582;--band:#8e7856;--ringc:#ac9d7b;--star:#cbcbc9;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.red{--lcd:var(--fault);--ret:var(--fault)}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.dk{fill:var(--dk)}.top.dk{fill:var(--dk-top)}.side.dk{fill:var(--dk-side)}.rubber{fill:var(--rubber)}.lens{fill:var(--lens)}.screen{fill:var(--screen)}.hole{fill-rule:evenodd}
.refl{fill:#fff;opacity:.28;stroke:none}.lcd{fill:var(--lcd);font:600 4.2px ui-monospace,monospace;letter-spacing:.4px;text-anchor:middle;stroke:none}.lcd.s{font-size:2.8px;font-weight:400}.lcdh{fill:var(--lcd);opacity:.22;filter:url(#bloom)}.kl{fill:var(--ink);font:600 3.4px ui-monospace,monospace;text-anchor:middle;stroke:none}.ki{fill:none;stroke:var(--ink);stroke-width:.7;stroke-linecap:round;stroke-linejoin:round}.key.on .kf{fill:var(--lcd)}.key.on .kl{fill:#fff}.key.on .ki{stroke:#fff}
.lamp{fill:var(--off);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--lcd)}.lamp.g,.lamp.a,.lamp.r,.lamp.b{filter:url(#glow);stroke:none}
.cbu{fill:none;stroke:var(--line);stroke-width:3;stroke-linecap:round;stroke-linejoin:round}.cbl{fill:none;stroke:var(--rubber);stroke-width:1.9;stroke-linecap:round;stroke-linejoin:round}.mark{fill:none;stroke:var(--accent);stroke-width:1;stroke-linecap:round;vector-effect:non-scaling-stroke}
.sky{fill:url(#sky)}.star{fill:var(--star)}.moon{fill:var(--moon)}.crater{fill:var(--crater);opacity:.55}.term{fill:#000;opacity:.62}.planet{fill:var(--planet)}.pband{fill:var(--band);opacity:.75}.ringc{fill:none;stroke:var(--ringc)}.ret{fill:none;stroke:var(--ret);stroke-width:.8;opacity:.85;vector-effect:non-scaling-stroke}.vig{fill:url(#vig)}.knurl{stroke:var(--line);stroke-width:.6}.otext{fill:var(--muted);font:3.6px ui-monospace,monospace;letter-spacing:.6px;text-anchor:middle}.leader{fill:none;stroke:var(--muted);stroke-width:.6;stroke-dasharray:2 2;vector-effect:non-scaling-stroke}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}.otext{fill:var(--stage-muted)}}`

const defs = `<filter id="optics" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur id="defocus" stdDeviation="3"/></filter>
<radialGradient id="sky" cx=".45" cy=".4" r=".7"><stop offset="0" style="stop-color:var(--sky1)"/><stop offset="1" style="stop-color:var(--sky2)"/></radialGradient>
<radialGradient id="vig"><stop offset=".72" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
<radialGradient id="pshade" cx=".38" cy=".35" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient>
<clipPath id="ocularClip"><circle r="55"/></clipPath><clipPath id="jupiterClip"><circle r="23"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* ORVANE R–80. World: x lower-right, y lower-left, z up; moving parts at RA −78°, DEC +26°.
Part                        x      y      z      w      d      h
feet (3)          71,66 / 118,241 / 246,113   0   r 7      –      6   rubber, legs at 225° / 105° / 345°
legs (3)          crown → feet, two stages     r 6.4/4.6   –      –   clamps at mid-length
spreader tray             117    114     61     56     52      5   three eyepieces in holes, three arms
crown + azimuth       r 18/14 145,140    148      –      –     27   azimuth scale
RA housing        r 16  145,148,174 → 145,126,207 (polar axis 0 −.6 .8)   setting circles
RA motor                  113    128    172     26     25     26   status LED, cable socket
DEC housing       r 12  along d, −34 … +15 from V 145 126 207
counterweight shaft + weight  r 2.6 / 17   along d, 12 … 82
saddle + tube rings       83 × 12 × 6 / r 24.5           along the optical axis a
optical tube              r 22   −86 … 81                 brand band
dew shield + objective    r 24.5 81 … 116                 lens, reflection
focuser, diagonal, eyepiece  r 9/7/8   −93 … −120, then along u
finder + brackets         r 6.3  −44 … 57 at u 39
hand controller           190    130     30     38      8     78   LCD, keypad, hooked on the right leg
eyepiece view (screen)    r 64 right of the telescope                sky, target, reticle, labels
Painter order: tripod back to front, then the mount and every moving part sorted by x + y + z. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: vectors, oriented planes, round parts on any axis, depth-sorted items.
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>mul(a,1/(Math.hypot(...a)||1)),depth=a=>a[0]+a[1]+a[2],VIEW=[1,1,1],RAD=Math.PI/180,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`,shade=n=>n[2]>.6?'top':n[0]>n[1]?'side':'';
const draw=root,into=g=>root=g;
function rotate(v,axis,ang){const c=Math.cos(ang*RAD),s=Math.sin(ang*RAD);return add(add(mul(v,c),mul(cross(axis,v),s)),mul(axis,dot(axis,v)*(1-c)));}
function axes(n){const U=unit(Math.abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U);const a=P(...U),b=P(...V);if(a[0]*b[1]-a[1]*b[0]<0)V=mul(V,-1);return[U,V];}
function tube(g,a,b,r,cls='',inner=0,cap=true){const ax=sub(b,a),n=unit(ax),[U,V]=axes(n),pu=P(...U),pv=P(...V),pd=P(...ax),det=pu[0]*pv[1]-pv[0]*pu[1],u=(pd[0]*pv[1]-pv[0]*pd[1])/det,v=(pu[0]*pd[1]-pd[0]*pu[1])/det,l=Math.hypot(u,v)||1,tx=-v*r/l,ty=u*r/l;
el('path',{d:`M${tx},${ty} A${r},${r} 0 0 1 ${-tx},${-ty} L${u-tx},${v-ty} A${r},${r} 0 0 1 ${u+tx},${v+ty} Z`,transform:plane(a,U,V),class:'face '+cls},g);
const f=dot(n,VIEW)>0,c=group(plane(f?b:a,U,V),g),sc='face '+shade(f?n:mul(n,-1))+' '+cls;c.c=f?b:a;c.front=f;
if(!cap)return c;if(inner)el('path',{d:`M${r},0A${r},${r} 0 1 0 ${-r},0A${r},${r} 0 1 0 ${r},0ZM${inner},0A${inner},${inner} 0 1 1 ${-inner},0A${inner},${inner} 0 1 1 ${inner},0Z`,class:sc+' hole'},c);else circle(c,0,0,r,sc);return c;}
function obox(g,c,U,V,N,w,d,h,cls='',r=1.5){const ax=[[U,w],[V,d],[N,h]];for(let i=0;i<3;i++)for(const s of[1,-1]){const n=mul(ax[i][0],s);if(dot(n,VIEW)<=.01)continue;const[B,lb]=ax[(i+1)%3],[E,le]=ax[(i+2)%3],o=add(add(add(c,mul(n,ax[i][1]/2)),mul(B,-lb/2)),mul(E,-le/2));rect(group(plane(o,B,E),g),0,0,lb,le,r,'face '+shade(n)+' '+cls);}}
function band(g,a,b,R,cls=''){const ax=sub(b,a),n=unit(ax),[U,V]=axes(n),pu=P(...U),pv=P(...V),pd=P(...ax),det=pu[0]*pv[1]-pv[0]*pu[1],u=(pd[0]*pv[1]-pv[0]*pd[1])/det,v=(pu[0]*pd[1]-pd[0]*pu[1])/det,w=sub(VIEW,mul(n,dot(VIEW,n))),t=Math.atan2(dot(w,V),dot(w,U)),s=[R*Math.cos(t-1.5708),R*Math.sin(t-1.5708)],e=[R*Math.cos(t+1.5708),R*Math.sin(t+1.5708)];
el('path',{d:`M${s}A${R},${R} 0 0 1 ${e}L${e[0]+u},${e[1]+v}A${R},${R} 0 0 0 ${s[0]+u},${s[1]+v}Z`,transform:plane(a,U,V),class:'face '+cls},g);}
const items=[];function item(d,node=el('g',{})){const o={node,d};items.push(o);return o;}
function stat(d,fn){const o=item(d);into(o.node);fn();into(draw);return o;}
function part(label){const node=label?el('g',{class:'control',role:'button',tabindex:'0','aria-label':label}):el('g',{});const o=item(0,node);o.shape=el('g',{},node);return o;}
function upd(o,p,fn){o.shape.replaceChildren();fn(o.shape);o.d=depth(p);}
function lamp(g,x,y,r=1){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
// Tripod: rear leg, spreader tray with eyepieces, front legs, crown.
el('ellipse',{cx:P(150,150,0)[0],cy:P(150,150,0)[1]-4,rx:132,ry:50,class:'shadow stage-floor'});el('ellipse',{cx:P(150,150,0)[0],cy:P(150,150,0)[1]-4,rx:132,ry:50,class:'stage-contact'});
function leg(top,foot){const lo=add(foot,[0,0,6]),mid=add(mul(top,.52),mul(lo,.48));cylinder(foot[0],foot[1],0,7,6,'z','rubber');tube(root,lo,add(mid,mul(unit(sub(top,lo)),4)),4.6,'metal');tube(root,mid,add(top,[0,0,-6]),6.4,'');const k=tube(root,add(mid,mul(unit(sub(mid,lo)),-1)),add(mid,mul(unit(sub(top,lo)),7)),7.4,'dk');circle(k,0,0,3,'face recess');return mid;}
leg([139.3,134.3,151],[71,66,0]);tube(root,[145,140,64],[98.3,93.3,64],1.8,'metal');
box(117,114,61,56,52,5,4,'dk');const tr=group(TOP(117,114,66.1));rect(tr,4,4,48,44,3,'detail');
for(const[x,y]of[[131,129],[147,152],[160,128]]){ellipse(x,y,67.15,5.4,'z','face recess');cylinder(x,y,67,4,7,'z','metal');cylinder(x,y,74,4.6,4,'z','rubber');}
for(const e of[[128,203.7,64],[208.7,123,64]])tube(root,[145,140,64],e,1.8,'metal');
leg([142.9,147.7,151],[118,241,0]);leg([152.7,137.9,151],[246,113,0]);
stat(440,()=>{cylinder(145,140,146,18,13,'z','dk');cylinder(145,140,159,14,13,'z','');const az=group(TOP(145,140,172.1));circle(az,0,0,12,'detail');for(let i=0;i<24;i++){const t=i*Math.PI/12,r0=i%3?10.8:9.8;line(az,r0*Math.cos(t),r0*Math.sin(t),12*Math.cos(t),12*Math.sin(t));}});
// Hand controller hangs on the right leg; its LCD and keys are lit.
let lcd1,lcd2,trackLed;const keys={};
for(const c of['cbu','detail'])wire([[178,131.2,112],[184,134,116],[209,134,110]],c);box(190,130,30,38,8,78,6,'dk');const hc=group(FRONT(190,138,108));rect(hc,3,3,32,72,4,'face dk');
rect(hc,7,7,24,15,2,'face recess');el('rect',{x:9,y:9,width:20,height:11,rx:1.4,class:'lcdh'},hc);rect(hc,8.4,8.4,21.2,12.2,1.4,'face screen');lcd1=text(hc,19,14.4,'MOON','lcd');lcd2=text(hc,19,18.6,'MANUAL','lcd s');text(hc,19,5.4,'ORVANE','etch micro center');
function key(id,x,y,label,glyph,w=7,h=6){const g=el('g',{class:'control key',role:'button',tabindex:'0','aria-label':label},hc);rect(g,x-w/2,y-h/2,w,h,1.6,'face top kf');if(glyph.startsWith('M'))el('path',{d:glyph,class:'ki',transform:`translate(${x} ${y})`},g);else text(g,x,y+1.2,glyph,'kl');rect(g,x-w/2-1.2,y-h/2-1.2,w+2.4,h+2.4,2,'focus-ring');rect(g,x-w/2-1.6,y-h/2-1.6,w+3.2,h+3.2,0,'hit');keys[id]=g;return g;}
key('up',19,30,'Slew declination up (↑)','M-1.8,.9L0,-.9L1.8,.9');key('left',10.5,37,'Slew right ascension left (←)','M.9,-1.8L-.9,0L.9,1.8');key('right',27.5,37,'Slew right ascension right (→)','M-.9,-1.8L.9,0L-.9,1.8');key('down',19,44,'Slew declination down (↓)','M-1.8,-.9L0,.9L1.8,-.9');
['MOON','SATURN','JUPITER'].forEach((n,i)=>key('t'+i,9+i*10,54,`${i+1}: go to the ${n.toLowerCase()} (${i+1})`,String(i+1),8));key('track',13,64,'TRK: toggle sidereal tracking (T)','TRK',12);key('red',26,64,'Red night light (L)','RED',10);trackLed=lamp(hc,19,71,.9);
// Mount head (sorted with the moving parts): RA housing, setting circle, latitude scale, RA motor.
const A=[0,-.6,.8],V=[145,126,207];let raLed,cableEnd;
stat(470,()=>{const b0=[145,150,171];tube(root,b0,V,16,'');for(const t of[.22,.78])tube(root,add(b0,mul(sub(V,b0),t-.03)),add(b0,mul(sub(V,b0),t+.03)),16.6,'dk');
box(113,128,172,26,25,26,4,'');const mf=group(FRONT(113,153,198));rect(mf,3,3,20,20,3,'face recess');slits(mf,6,6,14,9,5);raLed=lamp(mf,18,19,1.1);text(mf,9,19.8,'RA','etch micro center');
const lat=group(SIDE(161.2,150,190));circle(lat,0,0,10,'face top');circle(lat,0,0,7.4,'face dk');for(let i=0;i<7;i++){const t=(-95+i*25)*RAD;line(lat,8*Math.cos(t),8*Math.sin(t),9.6*Math.cos(t),9.6*Math.sin(t));}line(lat,0,0,4,-5,'mark');screw(lat,0,0);cableEnd=[126,154,184];});
const cab=[cableEnd,[130,168,166],[150,172,138],[182,152,118],[205,136,108]];stat(520,()=>{for(const c of['cbu','cbl'])wire(cab,c);for(let i=0;i<8;i++){const p=add([150,172,138],mul([32,-20,-20],i/8)),f=group(FRONT(...p));el('path',{d:'M-2.4,-1.6Q-3.6,1.6 0,2.2Q3.6,2.8 2.2,0',class:'cbl',style:'stroke-width:1.4'},f);}});
// Moving assembly: DEC housing, counterweight, saddle, rings, tube, shield, focuser, diagonal, finder.
const M={dec:part(),shaft:part(),cw:part(),saddle:part(),tube:part('ORVANE R–80 · F/6.3: cycle the target by clicking the telescope (1–3)'),rings:[part(),part()],shield:part(),rear:part(),knob:part('Rack the focuser (F)'),diag:part(),finder:part(),brk:[part(),part()]};
let ra=-78,dec=26,selected=0,tracking=false,focus=.55,slew=null,red=false,last=0,lastDraw=-1,manualAt=0,sky=0,flash='',flashT=0,pressed={};
function pose(){const d=rotate([1,0,0],A,ra),a=rotate(rotate([0,.8,.6],A,ra),d,dec),u=unit(cross(d,a));return{d,a,u,T:add(add(V,mul(d,-28)),mul(u,43))};}
function assemble(){const{d,a,u,T}=pose(),q=(l,b=0,h=0)=>add(T,add(mul(a,l),add(mul(d,b),mul(u,h)))),F=(1-focus)*8;
upd(M.dec,add(V,mul(d,-10)),g=>{tube(g,add(V,mul(d,-34)),add(V,mul(d,15)),12,'');tube(g,add(V,mul(d,-27)),add(V,mul(d,-22)),12.6,'dk');});
upd(M.shaft,add(V,mul(d,45)),g=>{tube(g,add(V,mul(d,12)),add(V,mul(d,78)),2.6,'metal');tube(g,add(V,mul(d,78)),add(V,mul(d,82)),5,'rubber');});
upd(M.cw,add(V,mul(d,58)),g=>{const c=tube(g,add(V,mul(d,49)),add(V,mul(d,67)),17,'dk');circle(c,0,0,13,'detail');circle(c,0,0,3.4,'face recess');const lk=add(add(V,mul(d,58)),mul(u,17));tube(g,lk,add(lk,mul(u,6)),3,'metal');});
upd(M.saddle,q(0,0,-28),g=>{tube(g,add(V,mul(d,-28)),q(0,0,-29),7,'dk');obox(g,q(0,0,-28),a,d,u,84,12,5,'dk');});
upd(M.tube,T,g=>{tube(g,q(-86),q(81),22,'');for(const l of[-60,62])band(g,q(l),q(l+1.6),22.2,'dk');const s=unit(sub(VIEW,mul(a,dot(VIEW,a)))),tw=P(...a)[0]>=0?a:mul(a,-1);let w2=unit(cross(tw,s));if(P(...w2)[1]<0)w2=mul(w2,-1);const tg=group(plane(add(add(add(q(-10),mul(s,22.2)),mul(tw,-16)),mul(w2,-1.5)),tw,w2),g);text(tg,0,0,'ORVANE','label brand');tg.append(' ');text(tg,.4,5.6,'R–80 · F/6.3','etch micro');});
M.rings.forEach((r,i)=>{const l=[-34,36][i];upd(r,T,g=>{band(g,q(l-3.5),q(l+3.5),24,'dk');const b=add(q(l),mul(u,23.6));tube(g,b,add(b,mul(u,4.4)),2.6,'metal');});});
upd(M.shield,T,g=>{tube(g,q(80),q(85),23.4,'metal',0,false);const c=tube(g,q(84),q(117),24.6,'dk',0,true);if(c.front){circle(c,0,0,22.4,'face recess');circle(c,0,0,19,'face lens');el('path',{d:'M-11,-9Q-1,-17 9,-10L-8,6Z',class:'refl'},c);circle(c,0,0,15,'detail');}});
upd(M.rear,q(-95-F/2),g=>{tube(g,q(-93),q(-86),16,'dk');tube(g,q(-108-F),q(-93),7.4,'metal');const r=q(-112-F);tube(g,q(-109-F),r,9,'dk');tube(g,r,add(r,mul(u,13)),7,'dk');const e=add(r,mul(u,13));tube(g,e,add(e,mul(u,9)),7.8,'metal');const cup=tube(g,add(e,mul(u,9)),add(e,mul(u,15)),8.6,'rubber');if(cup.front)circle(cup,0,0,5,'face lens');});
upd(M.knob,q(-99,0,-13),g=>{const k=q(-99,0,-13);tube(g,add(k,mul(d,-17)),add(k,mul(d,17)),2,'metal');for(const s of[-1,1]){const c=tube(g,add(k,mul(d,s*14)),add(k,mul(d,s*19)),5.2,'rubber');if(c.front){circle(c,0,0,2.2,'face metal');const m=rotate(u,d,focus*300);el('path',{d:poly([add(c.c,mul(m,2.6)),add(c.c,mul(m,4.6))]),class:'mark'},g);}}const hc2=group(plane(k,a,u),g);circle(hc2,0,0,12,'hit');});
upd(M.finder,q(5,0,39),g=>{tube(g,q(-52,0,39),q(-44,0,39),4.2,'rubber');tube(g,q(-44,0,39),q(48,0,39),6.3,'');const c=tube(g,q(48,0,39),q(58,0,39),7.6,'dk');if(c.front){circle(c,0,0,5.8,'face lens');el('path',{d:'M-3,-3Q0,-5 3,-2',class:'refl'},c);}});
M.brk.forEach((p,i)=>{const l=[-20,30][i];upd(p,q(l,0,30),g=>{tube(g,q(l,0,21),q(l,0,32),2.6,'metal');band(g,q(l-2.2,0,39),q(l+2.2,0,39),8.2,'dk');});});
M.rings.forEach((r,i)=>{r.d+=.5+i*.1;});M.brk.forEach(b=>{b.d=M.finder.d+.4;});M.shield.d=depth(q(100));
const sorted=items.slice().sort((x,y)=>x.d-y.d),focused=document.activeElement;for(const o of sorted)draw.appendChild(o.node);if(focused?.matches?.('.control'))focused.focus({preventScroll:true});
const e=P(...q(117)),ang=Math.atan2(e[1]-IY,e[0]-IX),pin=[IX+64*Math.cos(ang),IY+64*Math.sin(ang)];set(leader,'d',`M${e[0].toFixed(1)},${e[1].toFixed(1)}L${pin[0].toFixed(1)},${pin[1].toFixed(1)}`);draw.insertBefore(leader,draw.firstChild);}
// Eyepiece view: a magnified sky in a knurled bezel, right of the telescope.
let IX=0,IY=0;const envelope=[];for(const[r,e]of[[-78,26],[-70,34],[-46,17],[-94,48]]){ra=r;dec=e;const{T,a,d,u}=pose();for(const l of[-125,118])for(const b of[-26,26])for(const h of[-26,49])envelope.push(P(...add(T,add(mul(a,l),add(mul(d,b),mul(u,h))))));}
for(const p of[[71,66,0],[118,241,0],[246,113,0],[190,138,30],[228,130,30],[118,248,0],[246,120,0]])envelope.push(P(...p));ra=-78;dec=26;
{const xs=envelope.map(p=>p[0]),ys=envelope.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);IX=x1+76;IY=y0+66;set(svg,'viewBox',`${x0-14} ${y0-22} ${IX+70-(x0-14)} ${y1-y0+48}`);}
const leader=el('path',{class:'leader'});
const eye=group(`translate(${IX} ${IY})`,root,{class:'control',role:'button',tabindex:'0','aria-label':'Eyepiece view: click to focus (F)'});circle(eye,0,0,66.5,'focus-ring');
circle(eye,0,0,63,'face metal');for(let i=0;i<48;i++){const t=i*Math.PI/24;line(eye,59.6*Math.cos(t),59.6*Math.sin(t),62.4*Math.cos(t),62.4*Math.sin(t),'knurl');}circle(eye,0,0,58.4,'face dk');
const field=el('g',{'clip-path':'url(#ocularClip)'},eye);circle(field,0,0,56,'sky');const stars=el('g',{},field);
for(let i=0;i<34;i++){const t=i*2.39996,r=8+((i*37)%47);circle(stars,Math.cos(t)*r*1.2,Math.sin(t)*r*1.2,.35+((i*13)%7)/14,'star');}
const image=el('g',{filter:'url(#optics)'},field),moon=el('g',{},image);circle(moon,0,0,30,'moon');
for(const[x,y,r]of[[-10,-11,5],[9,-15,3.5],[-15,8,4],[3,10,6],[13,4,2.7],[-1,-2,2],[14,17,3],[-8,18,2.5],[-20,-2,2.4],[6,-24,2]])circle(moon,x,y,r,'crater');
el('path',{d:'M8,-29.2A30,30 0 0 1 8,29.2A16,30 0 0 0 8,-29.2Z',class:'term'},moon);circle(moon,0,0,30,'detail');
const saturn=el('g',{transform:'rotate(-22)',display:'none'},image);el('path',{d:'M-38,0A38,11 0 0 1 38,0',class:'ringc',style:'stroke-width:4.4'},saturn);circle(saturn,0,0,19,'planet');circle(saturn,0,0,19,'face',).setAttribute('style','fill:url(#pshade);stroke:none');for(const y of[-9,-3,4,10])el('path',{d:`M-17,${y}Q0,${y+3} 17,${y}`,style:'fill:none;stroke:var(--band);stroke-width:1.4;opacity:.55'},saturn);el('path',{d:'M-38,0A38,11 0 0 0 38,0',class:'ringc',style:'stroke-width:4.4'},saturn);el('path',{d:'M-30.4,1A30,7 0 0 0 30.4,1',style:'fill:none;stroke:#000;stroke-width:.8;opacity:.35'},saturn);
const jupiter=el('g',{display:'none'},image);circle(jupiter,0,0,23,'planet');const bands=el('g',{'clip-path':'url(#jupiterClip)'},jupiter);
for(const[y,h]of[[-15,3],[-7,5],[2,4],[10,3]])el('path',{d:`M-24,${y}Q0,${y+3.4} 24,${y}v${h}Q0,${y+h+3.4} -24,${y+h}Z`,class:'pband'},bands);el('ellipse',{cx:9,cy:6.6,rx:4.6,ry:2.4,style:'fill:#b5654a;opacity:.7'},bands);circle(jupiter,0,0,23,'face').setAttribute('style','fill:url(#pshade);stroke:none');
for(const[x,y,r]of[[-38,1,1.1],[33,-3,1.3],[44,-5,.9],[-48,2,1]])circle(jupiter,x,y,r,'moon');
const ret=el('g',{class:'retg'},field);for(const[x1,y1,x2,y2]of[[-50,0,-36,0],[36,0,50,0],[0,-50,0,-36],[0,36,0,50],[-3,0,3,0],[0,-3,0,3]])line(ret,x1,y1,x2,y2,'ret');circle(ret,0,0,33,'ret');
circle(field,0,0,56,'vig');
const eyeText=group(`translate(${IX} ${IY})`,root,{'pointer-events':'none'});text(eyeText,0,-71,'EYEPIECE · 25 MM · 20×','otext');const eyeLabel=text(eyeText,0,77,'01 · MOON','otext'),focusRead=text(eyeText,0,84,'FOCUS 55%','otext');
// State: slews, tracking, focus and the red light; audio only after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),hk={};
document.querySelectorAll('.hint [data-k]').forEach(b=>{hk[b.dataset.k]=b;});
const targets=[{name:'MOON',ra:-70,dec:34},{name:'SATURN',ra:-46,dec:17},{name:'JUPITER',ra:-94,dec:48}];
let ac=null,whine=null;
function audio(){try{if(!ac){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;ac=new AC();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,d=.08,v=.015,type='sine',when=0,f2=0){if(!ac)return;try{const t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
function say(v){announcement.textContent=v;}
function press(id){pressed[id]=performance.now()+180;}
function ui(){const t=targets[selected],err=Math.hypot(ra-t.ra-sky,dec-t.dec),locked=err<.45;
const mode=slew?'SLEWING':tracking?(locked?'TRACKING':'TRACKING / OFFSET'):locked?'ACQUIRED · MANUAL':'MANUAL / OFFSET';
readout.textContent=`RA ${ra.toFixed(1)}° · DEC ${dec>=0?'+':''}${dec.toFixed(1)}°`;stateLabel.textContent=performance.now()<flashT?flash:`${t.name} · ${mode}${red?' · RED LIGHT':''}`;
lcd1.textContent=slew?'GOTO '+t.name:t.name;lcd2.textContent=slew?`${Math.round(Math.max(0,err))}° TO GO`:tracking?'TRACKING':locked?'ON TARGET':'MANUAL';
for(let i=0;i<3;i++){set(keys['t'+i],'aria-pressed',i===selected);}set(keys.track,'aria-pressed',tracking);set(keys.red,'aria-pressed',red);set(hk.t,'aria-pressed',tracking);set(hk.l,'aria-pressed',red);
eyeLabel.textContent=`0${selected+1} · ${t.name}`;focusRead.textContent=`${slew?'SLEWING':locked?'ON TARGET':'FIELD OFFSET'} · FOCUS ${Math.round(focus*100)}%`;
[moon,saturn,jupiter].forEach((g,i)=>set(g,'display',i===selected?'inline':'none'));
set(image,'transform',`translate(${clamp((ra-t.ra-sky)*3,-90,90).toFixed(2)} ${clamp((dec-t.dec)*3,-90,90).toFixed(2)})`);
set(document.getElementById('defocus'),'stdDeviation',((1-focus)*4.8+Math.min(1.6,err*.12)+(slew?1.2:0)).toFixed(2));}
function manual(axis,amount){audio();slew=null;tracking=false;sky=0;manualAt=performance.now();press(amount<0?(axis==='ra'?'left':'down'):(axis==='ra'?'right':'up'));
if(axis==='ra')ra=clamp(ra+amount,-110,-40);else dec=clamp(dec+amount,-5,65);tone(180,.12,.012,'sawtooth',0,240);assemble();ui();say(`Manual slew. Right ascension ${ra.toFixed(1)} degrees, declination ${dec.toFixed(1)} degrees.`);}
function acquire(i){audio();selected=i;sky=0;manualAt=performance.now();press('t'+i);const target=targets[i];tone(660,.06);
if(reduced.matches){ra=target.ra;dec=target.dec;focus=1;slew=null;assemble();}else{slew={start:performance.now(),ra,dec,focus,duration:1500};tone(150,1.4,.012,'sawtooth',0,420);}ui();say(`Slewing to ${target.name.toLowerCase()}.`);}
function trackingToggle(){audio();tracking=!tracking;manualAt=performance.now();press('track');tone(tracking?880:440,.07);ui();say(tracking?'Sidereal tracking engaged.':'Tracking stopped. The sky drifts through the eyepiece.');}
function focusToggle(){audio();slew=null;focus=focus<.9?1:.35;flash=focus>.9?'FOCUS 100% · SHARP':'FOCUS 35% · SOFT';flashT=performance.now()+1300;tone(1200,.03,.01,'square');tone(1400,.03,.01,'square',.07);assemble();ui();say(focus>.9?'Focuser racked in. Image sharp.':'Focuser racked out. Image soft.');}
function redToggle(){audio();red=!red;press('red');svg.classList.toggle('red',red);tone(red?520:700,.06);flash=red?'RED LIGHT · NIGHT VISION':'WHITE LIGHT';flashT=performance.now()+1300;ui();say(red?'Red night light on the controller and reticle.':'Red light off.');}
for(const[id,fn]of[['up',()=>manual('dec',4)],['down',()=>manual('dec',-4)],['left',()=>manual('ra',-4)],['right',()=>manual('ra',4)],['t0',()=>acquire(0)],['t1',()=>acquire(1)],['t2',()=>acquire(2)],['track',trackingToggle],['red',redToggle]])bind(keys[id],fn);
bind(M.tube.node,()=>acquire((selected+1)%3));bind(M.knob.node,focusToggle);bind(eye,focusToggle);
const act={t:trackingToggle,f:focusToggle,l:redToggle};for(const[k,b]of Object.entries(hk))b.addEventListener('click',()=>act[k]());
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;
const fn={ArrowLeft:()=>manual('ra',-4),ArrowRight:()=>manual('ra',4),ArrowUp:()=>manual('dec',4),ArrowDown:()=>manual('dec',-4),'1':()=>acquire(0),'2':()=>acquire(1),'3':()=>acquire(2),t:trackingToggle,f:focusToggle,l:redToggle}[e.key.length===1?e.key.toLowerCase():e.key];
if(fn){e.preventDefault();if(!e.repeat||e.key.startsWith('Arrow'))fn();}});
function tick(now){const dt=Math.min(.1,(now-(last||now))/1000);last=now;let dirty=false;
if(slew){const p=clamp((now-slew.start)/slew.duration),ease=p*p*(3-2*p),t=targets[selected];ra=slew.ra+(t.ra-slew.ra)*ease;dec=slew.dec+(t.dec-slew.dec)*ease;focus=slew.focus+(1-slew.focus)*ease;dirty=true;if(p===1){slew=null;manualAt=now;tone(988,.08);tone(1318,.1,.012,'sine',.1);say(`${t.name.toLowerCase()} acquired. Eyepiece image in focus.`);}}
else if(!reduced.matches&&now-manualAt>1500){sky+=dt*.025;if(tracking){ra=clamp(ra+dt*.025,-110,-40);dirty=true;}}
if(dirty&&now-lastDraw>32){assemble();lastDraw=now;}
if(now%150<34||dirty)ui();
const blink=reduced.matches||Math.floor(now/500)%2===0;lit(raLed,slew?'a':tracking?(blink?'g':''):'g');lit(trackLed,tracking?'b':'');
for(const[id,k]of Object.entries(keys))k.classList.toggle('on',now<(pressed[id]||0)||id==='track'&&tracking||id==='red'&&red||id==='t'+selected&&!!slew);
if(!reduced.matches)set(stars,'transform',`translate(${(-sky*1.4).toFixed(2)} ${(Math.sin(now*.0003)*.4).toFixed(2)})`);
requestAnimationFrame(tick);}
assemble();ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['t', 'f', 'l'], draw }
