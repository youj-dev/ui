// @ts-nocheck
/* TOLLEN M–08 · Payment terminal. Its stylesheet, defs and script, drawn on the engine in the figures' house style (the
 * kit's projection and helpers, the shared palette, stage and filters). The script runs on the env, which stands in for
 * the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--void:#4a4a48;--gr:#55575a;--gr-top:#6a6c70;--gr-side:#45474a;--key:#f3f3f0;--key-s:#c6c6c1;--kl:#3a3a39;--kr:#e0584b;--ky:#e9bd3f;--kg:#2fae6c;--kr-s:#b5463b;--ky-s:#bf982f;--kg-s:#23874f;--kf:#fffdf8;--screen:#16181b;--disp:#0e1115;--si:#eef1f7;--sd:#8a93a6;--sa:#8ea0ff;--sok:#36d886;--sno:#ff5a4f;--paper:#e9e8e2;--paper-top:#fffffc;--print:#2c2c2c;--card:#2a3f9e;--card2:#3953c4;--card-e:#18266a;--chip:#d8b45f;--chip-l:#a8843a}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--void:#3d3d3c;--gr:#47484a;--gr-top:#636568;--gr-side:#2f2f31;--key:#e3e3e1;--key-s:#8b8b89;--kl:#2c2c2b;--kr:#bd493e;--ky:#c49f34;--kg:#26925a;--kr-s:#7f2f27;--ky-s:#866a1e;--kg-s:#155e35;--kf:#f4f2ec;--screen:#111214;--disp:#0b0d10;--paper:#c3c3bf;--paper-top:#d7d7d5;--print:#232323;--card:#273a94;--card2:#354db7;--card-e:#0d1849;--chip:#b6974f;--chip-l:#8a6f30;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.void{fill:var(--void)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:5.4px;letter-spacing:1.9px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.end{text-anchor:end}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.gr{fill:var(--gr)}.top.gr{fill:var(--gr-top)}.side.gr{fill:var(--gr-side)}.gl{fill:none;stroke:#000;stroke-opacity:.35;stroke-width:.6;vector-effect:non-scaling-stroke}.ge{fill:#fff;opacity:.55;font:3px ui-monospace,monospace;letter-spacing:.9px;stroke:none}
.key{fill:var(--key)}.key-s{fill:var(--key-s)}.kr{fill:var(--kr)}.ky{fill:var(--ky)}.kg{fill:var(--kg)}.kr-s{fill:var(--kr-s)}.ky-s{fill:var(--ky-s)}.kg-s{fill:var(--kg-s)}.kl{fill:var(--kl);font:600 6.2px ui-monospace,monospace;text-anchor:middle;stroke:none}.kl.s{font-size:4.6px}.kf{fill:none;stroke:var(--kf);stroke-width:1.2;stroke-linecap:round;stroke-linejoin:round}
.screen{fill:var(--screen)}.disp{fill:var(--disp)}.halo{fill:var(--sa);opacity:.12;filter:url(#bloom);transition:opacity .3s}.halo.ok{fill:var(--sok);opacity:.32}.halo.no{fill:var(--sno);opacity:.3}.glare{fill:#fff;opacity:.05;stroke:none}.bz{fill:#8b919c;font:600 3.1px ui-monospace,monospace;letter-spacing:1.5px;stroke:none}
.si{fill:var(--si);font:3.4px ui-monospace,monospace;letter-spacing:.35px;text-anchor:middle;stroke:none}.si.big{font-size:11px;font-weight:600;letter-spacing:0}.si.mid{font-size:6.2px;font-weight:600;letter-spacing:.3px}.si.t{font-size:4.1px;font-weight:600;letter-spacing:.8px}.si.s{font-size:2.9px;letter-spacing:.35px}.si.l{text-anchor:start}.si.e{text-anchor:end}.si.d{fill:var(--sd)}.si.a{fill:var(--sa)}.si.ok{fill:var(--sok)}.si.no{fill:var(--sno)}
.sl{fill:none;stroke:var(--si);stroke-width:.75;stroke-linecap:round;stroke-linejoin:round}.sl.a{stroke:var(--sa)}.sl.d{stroke:var(--sd)}.sf{fill:var(--si);stroke:none}.sf.d{fill:var(--sd)}.okd{fill:var(--sok);stroke:none}.nod{fill:var(--sno);stroke:none}.mark{fill:none;stroke:#0d1712;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.dot{fill:none;stroke:var(--sd);stroke-width:.45}.dot.on{fill:var(--sok);stroke:none;filter:url(#glow)}.scrn{transition:opacity .16s}
.wave{fill:none;stroke:var(--accent);stroke-width:1.5;stroke-linecap:round;opacity:0;filter:url(#glow)}.nfc{fill:none;stroke:var(--muted);stroke-width:.9;stroke-linecap:round}.nfch{fill:var(--accent);opacity:0;filter:url(#bloom)}
.lamp{fill:var(--off);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke}.lamp.g{fill:var(--ok);stroke:none;filter:url(#glow)}.lamp.a{fill:var(--warn);stroke:none;filter:url(#glow)}
.paper{fill:var(--paper);stroke:none}.pshade{fill:var(--paper-top);stroke:none}.pline{fill:none;stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.ink{fill:var(--print);font:3.2px ui-monospace,monospace;letter-spacing:.1px;stroke:none}.ink.b{font-weight:700;font-size:3.9px;letter-spacing:.35px}.ink.c{text-anchor:middle}.ink.e{text-anchor:end}.ink.s{font-size:2.6px}.inkl{fill:none;stroke:var(--print);stroke-width:.35;stroke-dasharray:.9 .7}.bar{fill:var(--print)}
.card{fill:var(--card);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.card2{fill:var(--card2);stroke:none}.card-e{fill:var(--card-e);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.ct{fill:#fff;font:600 4.4px ui-monospace,monospace;letter-spacing:.9px;stroke:none;opacity:.92}.ct.s{font-size:3.7px;font-weight:400;letter-spacing:.55px}.ct.e{text-anchor:end}.cs{fill:none;stroke:#fff;stroke-width:.6;opacity:.85;stroke-linecap:round}.chip{fill:var(--chip);stroke:var(--chip-l);stroke-width:.45}.chipl{fill:none;stroke:var(--chip-l);stroke-width:.45}.sheen{fill:#fff;opacity:.09}.cshadow{fill:var(--shadow);filter:url(#soft2)}
.control{cursor:pointer;outline:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<filter id="soft2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* TOLLEN M–08 on its charging cradle. World: x lower-right, y lower-left (front faces look along +y), z up; 1 unit ≈ 0.85 mm.
The terminal lies back at 26°; on it, u runs across (+x), a up its face from the bottom end and d into it, from B0 = (0, 150, 56).
Part                          u / x      a / y      d / z      w      h   –
cradle (graphite)            −8–102     30–151     0–100     110    121  walls hold the sides; its floor is the slope at d 22
terminal body                 0–94       0–212     0–22       94    212  40 deep at the printer (a 150–212)
face: printer lid             4–90      v 4–41       –         –      –  the contactless pad; the receipt leaves behind its top edge
face: display bezel           6–88      v 44–121     –         –      –  glass; a 74 × 64 display with four read lights, the wordmark
face: keypad                  6–88      v 128–198    –         –      –  3 × 4 keys, then cancel / correct / OK; caps 1.8 proud
bottom end: chip slot        14–80        0          9         –      –  the card goes in 34 along the face
card (85.6 × 54 mm)         112–225     72–166     0.9       101     64  1.4 thick; rests askew on the counter, flies to the pad or the slot
receipt (64 wide)            15–79        –          9         –   ≤ 63  leaves the top end along the face, curling back on r 48
Slot lips, legends, lamps and labels share their parent faces. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{P,set,el,group,rect,circle,line,text,FRONT,SIDE}=kit(()=>root);
// Family helpers: vectors, oriented planes, rounded outlines through world points, lamps, controls.
const f2=v=>(+v).toFixed(2);
const add=(a,b,k=1)=>[a[0]+b[0]*k,a[1]+b[1]*k,a[2]+b[2]*k],sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
const norm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);},dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2],cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>(t=clamp(t),t*t*(3-2*t)),pad=(n,k)=>String(n).padStart(k,'0');
const plane=(o,U,V)=>`matrix(${P(...U).map(f2).join(' ')} ${P(...V).map(f2).join(' ')} ${P(...o).map(f2).join(' ')})`;
function rp(pts,r){const q=pts.map(p=>P(...p)),n=q.length;let d='';
for(let i=0;i<n;i++){const a=q[(i+n-1)%n],b=q[i],c=q[(i+1)%n],k=Array.isArray(r)?r[i]:r,la=Math.hypot(b[0]-a[0],b[1]-a[1])||1,lc=Math.hypot(c[0]-b[0],c[1]-b[1])||1,s=Math.min(k,la/2)/la,t=Math.min(k,lc/2)/lc;
d+=(i?'L':'M')+f2(b[0]+(a[0]-b[0])*s)+','+f2(b[1]+(a[1]-b[1])*s)+'Q'+f2(b[0])+','+f2(b[1])+' '+f2(b[0]+(c[0]-b[0])*t)+','+f2(b[1]+(c[1]-b[1])*t);}
return d+'Z';}
const shape=(pts,cls,r=1.5,parent)=>el('path',{d:rp(pts,r),class:'face '+cls},parent);
function lamp(g,x,y,r=1){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
// The terminal's frame.
const TA=26*Math.PI/180,SA=Math.sin(TA),CA=Math.cos(TA);
const UX=[1,0,0],UP=[0,-CA,SA],DN=[0,CA,-SA],NO=[0,SA,CA],BK=[0,-SA,-CA];
const W=94,L=212,B0=[0,150,56],at=(u,a,d=0)=>[u,B0[1]-a*CA-d*SA,B0[2]+a*SA-d*CA],T0=at(0,L);
// Ground: one soft shadow under the cradle and the card.
el('ellipse',{cx:-10,cy:102,rx:152,ry:68,class:'shadow stage-floor'});el('ellipse',{cx:-10,cy:102,rx:152,ry:68,class:'stage-contact'});
const cardShadowG=el('g',{});
// Cradle: the floor the terminal lies on, the left wall, then the front with its lamp and wordmark.
const FA=(151-B0[1]+22*SA)/-CA,ZF=at(0,FA,22)[2],ZW=at(0,-6,10)[2],YB=30,ZB=at(0,120,10)[2];
shape([at(-1,FA,22),at(95,FA,22),at(95,120,22),at(-1,120,22)],'top gr',2);
shape([at(-1,-6,10),at(-1,120,10),at(-1,120,22),at(-1,FA,22)],'side gr',1);
shape([at(-8,-6,10),at(-1,-6,10),at(-1,120,10),[-1,YB,ZB],[-8,YB,ZB],at(-8,120,10)],'top gr',[1.5,1.5,1.5,1.5,1.5,1.5]);
shape([[-8,151,0],[102,151,0],[102,151,ZW],[95,151,ZW],[95,151,ZF],[-1,151,ZF],[-1,151,ZW],[-8,151,ZW]],'gr',[2,2,2,1,1,1,1,2]);
const cf=group(FRONT(-1,151,ZF));rect(cf,6,ZF-4.6,84,2.2,1.1,'gl');text(cf,48,13,'TOLLEN','ge center');const chg=lamp(cf,10,8,1.15);
// Layers that slot between the cradle and the terminal: the inserted card, then the receipt.
const backCard=el('g',{}),paperG=el('g',{class:'receipt'}),flyG=el('g',{});
// Terminal: right side with the printer bulge, the bottom end with its chip slot, then the face.
const SD=[[0,0],[L,0],[L,40],[152,40],[126,22],[0,22]];
shape(SD.map(([a,d])=>at(W,a,d)),'side',[2,2,10,10,10,4]);
const sd=group(plane(at(W,0),UP,BK));line(sd,150,1.2,150,39);rect(sd,176,15,14,4,2,'face base');rect(sd,129,12,9,3.4,1.7,'face void');text(sd,158,31,'M–08','etch micro');
const bottomEnd=button(el('g',{}),{'aria-label':'Chip slot: insert the card (I)'});
shape([at(0,0),at(W,0),at(W,0,22),at(0,0,22)],'',2,bottomEnd);
const be=group(plane(at(0,0),UX,BK),bottomEnd);rect(be,13,6.6,68,4.8,2.4,'face recess');rect(be,15,8,64,2,1,'face void');rect(be,10,3,74,11,3,'focus-ring');
const fc=group(plane(T0,UX,DN));
rect(fc,0,0,W,L,7,'face top');
rect(fc,4,4,86,37,5,'detail');rect(fc,40,37.6,14,2.4,1.2,'face recess');
const tapPad=button(group('',fc),{'aria-label':'Contactless pad: tap the card (T)'});
const nfcGlow=rect(tapPad,22,7,50,30,12,'nfch');rect(tapPad,31,9,32,26,7,'detail');
el('path',{d:'M44,16.6a6,6 0 0 1 0,10.8M47.4,13.8a10,10 0 0 1 0,16.4M50.8,11a14,14 0 0 1 0,22',class:'nfc'},tapPad);rect(tapPad,29,7,36,30,8,'focus-ring');
rect(fc,6,44,82,77,5,'face screen');
const ds=group('translate(10 48)',fc);rect(ds,0,0,74,64,2.5,'disp');const halo=rect(ds,6,8,62,50,8,'halo');
text(fc,47,118.3,'TOLLEN','bz center');
el('path',{d:'M40,202.6h11v6.6h-11zM42.2,204.6h2.8v2.2h-2.8zM55,203v5.4M53.2,206.8l1.8,1.8l1.8,-1.8',class:'detail'},fc);
const waveG=el('g',{},fc),waves=[0,1,2].map(()=>el('path',{class:'wave'},waveG));
el('path',{d:'M10,48.6L84,48.6L84,57L10,92Z',class:'glare'},fc);
// Display: a status row (the four read lights, the battery), then one screen per state, cross-faded.
const dots=[0,1,2,3].map(i=>circle(ds,28+i*6,5.4,1.35,'dot'));const saleT=text(ds,4,6.4,'SALE','si s d l');rect(ds,62,3.6,7,3.6,.8,'sl d');rect(ds,69.4,4.7,.8,1.4,.3,'sf d');rect(ds,63,4.6,4.6,1.6,.3,'sf d');
const SCR={};const scr=n=>(SCR[n]=el('g',{class:'scrn','data-yj-screen':n,opacity:0},ds));
const sR=scr('ready');text(sR,37,17,'TOTAL','si t d');const amtR=text(sR,37,31.5,'$24.80','si big');text(sR,37,40,'TAP OR INSERT CARD','si s d');
const tapIcon=el('path',{d:'M19.6,49.2a2.4,2.4 0 0 1 0,3.6M21.6,47.6a4.6,4.6 0 0 1 0,6.8M23.6,46a6.8,6.8 0 0 1 0,10',class:'sl a'},sR);text(sR,21.6,61,'TAP ▲','si s');
rect(sR,46.6,47,10.8,7.2,1.2,'sl');rect(sR,48.2,49.2,2.6,2,.4,'sf');el('path',{d:'M52,58.4v-1.6',class:'sl'},sR);text(sR,52,61,'INSERT ▼','si s');
const sA=scr('amount');text(sA,37,17,'ENTER AMOUNT','si t d');const amtA=text(sA,37,32,'$0.00','si big');const caret=rect(sA,21,35.2,32,.8,.4,'sf');text(sA,37,47,'OK TO CONFIRM','si s d');text(sA,37,54,'✕ CANCEL · ‹ CORRECT','si s d');
const sG=scr('reading');const holdT=text(sG,37,17,'HOLD CARD','si t');const readIcon=[0,1,2].map(i=>el('path',{d:`M${33+i*3.6},${30.6-i*3.4}a${4+i*3.4},${4+i*3.4} 0 0 1 0,${6.8+i*6.8}`,class:'sl a'},sG));circle(sG,30,34,1.6,'sf');const amtG=text(sG,37,55,'$24.80','si mid');
const sU=scr('auth');circle(sU,37,27,8,'sl d');const spin=el('path',{d:'M37,19a8,8 0 0 1 8,8',class:'sl a','stroke-width':1.3},sU);text(sU,37,46,'PROCESSING','si t');const amtU=text(sU,37,54,'$24.80','si s d');
const sP=scr('pin');text(sP,37,15,'ENTER PIN','si t');const amtP=text(sP,37,26,'$24.80','si mid');const pinDots=[0,1,2,3].map(i=>{rect(sP,13+i*13,31,10,11,1.6,'sl d');return circle(sP,18+i*13,36.5,1.7,'sf');});text(sP,37,53,'OK TO CONFIRM','si s d');
const sV=scr('approved');circle(sV,37,24,11,'okd');const okMark=el('path',{d:'M31.4,24.6l3.9,3.9l7.6,-8.2',class:'mark','stroke-dasharray':'18','stroke-dashoffset':'18'},sV);text(sV,37,45,'APPROVED','si mid ok');const amtV=text(sV,37,52.5,'$24.80','si s');const authV=text(sV,37,59,'AUTH 4F2A91','si s d');
const sX=scr('declined');circle(sX,37,24,11,'nod');el('path',{d:'M33,20l8,8M41,20l-8,8',class:'mark'},sX);text(sX,37,45,'DECLINED','si mid no');text(sX,37,52.5,'NOT AUTHORIZED','si s');text(sX,37,59,'NO CHARGE MADE','si s d');
const sM=scr('remove');rect(sM,26,14,22,14,2,'sl');rect(sM,29.4,18,4.4,3.6,.8,'sf');const arrow=el('path',{d:'M37,31v8M33.6,35.8l3.4,3.4l3.4,-3.4',class:'sl a'},sM);text(sM,37,51,'REMOVE CARD','si t');
const sC=scr('canceled');text(sC,37,30,'CANCELED','si mid');text(sC,37,39,'NO CHARGE MADE','si s d');
const sT=scr('thanks');text(sT,37,26,'THANK YOU','si mid');text(sT,37,35,'TAKE YOUR RECEIPT','si s d');el('path',{d:'M33,52V43.6h8V52l-1.3,-1l-1.4,1l-1.3,-1l-1.3,1l-1.4,-1Z M35,46h4M35,48.2h4M37,41.8v-4M35.4,39.4l1.6,-1.6l1.6,1.6',class:'sl d'},sT);
// Keypad: skirts on the face, caps 1.8 proud on their own planes (pressed, they sink to 0.5).
const KEYS=['1','2','3','4','5','6','7','8','9','*','0','#','Escape','Backspace','Enter'],NAME={Escape:'Cancel',Backspace:'Correct',Enter:'OK'};
const capT=h=>plane(add(T0,NO,h),UX,DN),caps={};
KEYS.forEach((k,i)=>{const j=i%3,r=Math.floor(i/3),u=6.25+j*28.5,v=128+r*14.6,fn=r===4,c=fn?['kr','ky','kg'][j]:'key';rect(fc,u,v,24.5,11.6,2.8,'face '+c+'-s');});
const capsG=el('g',{});
KEYS.forEach((k,i)=>{const j=i%3,r=Math.floor(i/3),u=6.25+j*28.5,v=128+r*14.6,fn=r===4,c=fn?['kr','ky','kg'][j]:'key';
const g=button(el('g',{transform:capT(1.8)},capsG),{'aria-label':fn?`${NAME[k]} (${k==='Backspace'?'Backspace':k==='Escape'?'Esc':'Enter'})`:k==='*'||k==='#'?(k==='*'?'Star':'Hash'):k,tabindex:/[0-9]/.test(k)||!fn?'-1':'0'});
rect(g,u,v,24.5,11.6,2.8,'face '+c);
if(k==='Escape')el('path',{d:`M${u+9.7},${v+3.3}l5.1,5M${u+14.8},${v+3.3}l-5.1,5`,class:'kf'},g);
else if(k==='Backspace')el('path',{d:`M${u+13.6},${v+3}l-3.4,2.8l3.4,2.8`,class:'kf'},g);
else if(k==='Enter')circle(g,u+12.25,v+5.8,2.7,'kf');
else text(g,u+12.25,v+8.3,k,'kl'+(k==='*'||k==='#'?' s':''));
rect(g,u-1.5,v-1.5,27.5,14.6,3.6,'focus-ring');caps[k]={g,h:1.8,down:0};});
// The cradle's right wall: in front of the terminal's side.
shape([at(95,-6,10),at(102,-6,10),at(102,120,10),[102,YB,ZB],[95,YB,ZB],at(95,120,10)],'top gr',1.5);
shape([[102,151,0],[102,151,ZW],at(102,120,10),[102,YB,ZB],[102,YB,0]],'side gr',[2,3,8,6,2]);
const cs=group(SIDE(102,151,ZW));line(cs,4,ZW-3.2,117,ZW-3.2,'gl');rect(cs,22,ZW-17,40,10.4,1.4,'face top');text(cs,25,ZW-12.6,'TOLLEN M–08 BASE','etch micro');text(cs,25,ZW-9,'5 V ⎓ 2 A · CHARGE','etch micro');rect(cs,103,ZW-14,8,5.4,1.4,'face void');
// Receipt: a 64-wide strip; its left edge follows a path from the slot (s = 0) to its free end.
const X0=15,PW=64,R0=14,RC=48,ROW=5.4,TOPM=6,NR=10,LMAX=TOPM+NR*ROW+3,LREST=2.4,S0=at(X0,L,9);
const curl=s=>{if(s<=R0)return add(S0,UP,s);const p=(s-R0)/RC;return add(add(S0,UP,R0+RC*Math.sin(p)),BK,RC*(1-Math.cos(p)));};
const LINES=[['h','NORTH LANE MARKET'],['c','41 HARBOR ST · TILL 2'],['r','10/26/26 14:07','#0001'],['rule'],['b','SALE','$24.80'],['r','CONTACTLESS','•••• 0428'],['r','AUTH 4F2A91','APPROVED'],['rule'],['c','THANK YOU · KEEP THIS SLIP'],['bar']];
function mkStrip(parent){const g=el('g',{},parent),s={g};s.fill=el('path',{class:'paper'},g);s.sh=[.35,.6,.85,1].map(o=>el('path',{class:'pshade',opacity:o},g));s.out=el('path',{class:'pline'},g);
s.rows=LINES.map(([k,a,b])=>{const r=el('g',{visibility:'hidden'},g);
if(k==='h')text(r,32,4.4,a,'ink b c');else if(k==='c')text(r,32,3.8,a,'ink c s');else if(k==='rule')line(r,5,2.6,59,2.6,'inkl');
else if(k==='bar'){let x=12,q=7;const rnd=()=>(q=(q*9301+49297)%233280)/233280;while(x<52){const w=.35+rnd()*.9;if(rnd()>.3)rect(r,x,.5,w,4.4,0,'bar');x+=w+.35+rnd()*.45;}}
else{r.l=text(r,5,3.8,a,'ink'+(k==='b'?' b':''));r.r=text(r,59,3.8,b,'ink e'+(k==='b'?' b':''));}return r;});return s;}
function zig(a,Wv,inw){let d='';for(let j=1;j<=32;j++){const k=j%2?1.1:0;d+='L'+P(...add(add(a,Wv,j/32),inw,k)).map(f2).join(',');}return d;}
function drawStrip(s,Lp){
const n=Math.max(2,Math.ceil(Lp/2.4)),pts=[];for(let i=0;i<=n;i++)pts.push(curl(Lp*i/n));
const Wv=[PW,0,0],lp=pts.map(p=>P(...p)),rp2=pts.map(p=>P(...add(p,Wv))),tE=norm(sub(pts[n],pts[n-1]));
let d='M'+lp[0].map(f2).join(',');for(let i=1;i<=n;i++)d+='L'+lp[i].map(f2).join(',');d+=zig(pts[n],Wv,tE.map(v=>-v));for(let i=n-1;i>=0;i--)d+='L'+rp2[i].map(f2).join(',');
d+='Z';set(s.fill,'d',d);set(s.out,'d',d);
const sd=['','','',''];for(let i=0;i<n;i++){const t=norm(sub(pts[i+1],pts[i])),v=(t[2]-t[1])/Math.sqrt(3),k=Math.min(3,Math.floor((v-.05)/.2));if(k>=0)sd[k]+=`M${lp[i].map(f2)}L${lp[i+1].map(f2)}L${rp2[i+1].map(f2)}L${rp2[i].map(f2)}Z`;}
s.sh.forEach((p,k)=>set(p,'d',sd[k]));
let shown=0;s.rows.forEach((r,i)=>{const st=Lp-TOPM-i*ROW,o=curl(Math.max(0,st)),t=norm(sub(curl(Math.max(0,st-1)),o)),vis=st>=ROW&&(t[1]-t[2])>0.05;if(st>=ROW)shown++;if(vis)set(r,'transform',plane(o,UX,t));set(r,'visibility',vis?'visible':'hidden');});
return shown;}
let live=mkStrip(paperG);
// Card: edge and face, posed by an origin and two axes; its shadow on the counter.
const CW=101,CH=64,CT=1.4,YAW=-.24;
const cardG=button(el('g',{}),{'aria-label':'Payment card: tap it on the pad (T)'}),cardE=el('g',{},cardG),cardT=el('g',{},cardG);
rect(cardE,0,0,CW,CH,4,'card-e');rect(cardT,0,0,CW,CH,4,'card');el('path',{d:'M60,0H97Q101,0 101,4V60Q101,64 97,64H44C64,50 70,22 60,0Z',class:'card2'},cardT);
rect(cardT,12,22,13,10,2,'chip');line(cardT,16.3,22,16.3,32,'chipl');line(cardT,20.6,22,20.6,32,'chipl');line(cardT,12,27,25,27,'chipl');
el('path',{d:'M30,24.4a3,3 0 0 1 0,5.2M32.4,23a5.2,5.2 0 0 1 0,8M34.8,21.6a7.4,7.4 0 0 1 0,10.8',class:'cs'},cardT);
text(cardT,12,13,'DEBIT','ct');text(cardT,12,50,'•••• 0428','ct s');text(cardT,89,50,'06/29','ct s e');
el('path',{d:'M79,8.6l4,4l-4,4M84.4,8.6l4,4l-4,4',class:'cs'},cardT);el('path',{d:'M36,0H50L26,64H12Z',class:'sheen'},cardT);rect(cardT,-2,-2,CW+4,CH+4,5,'focus-ring');
const cardShadow=el('rect',{x:0,y:0,width:CW,height:CH,rx:5,class:'cshadow',opacity:.16},cardShadowG);
const frontCard=el('g',{});frontCard.appendChild(cardG);
const REST={o:[112,96,0.9],U:[Math.cos(YAW),Math.sin(YAW),0],V:[-Math.sin(YAW),Math.cos(YAW),0]};
const TQ=.06,TU=norm(add(UX,DN,TQ)),TV=norm(add(DN,UX,-TQ)),TC=at(47,L-14,-18),TAP={o:add(add(TC,TU,-CW/2),TV,-CH/2),U:TU,V:TV};
const IN=34,SLOT={o:at(47+CH/2,IN,9),U:DN,V:[-1,0,0]},PRE={o:at(47+CH/2,-4,9),U:DN,V:[-1,0,0]};
let pose=REST;
function poseCard(p){pose=p;const N=norm(cross(p.U,p.V));set(cardT,'transform',plane(p.o,p.U,p.V));set(cardE,'transform',plane(add(p.o,N,-CT),p.U,p.V));
const h=Math.max(0,p.o[2]-REST.o[2]);set(cardShadow,'transform',plane([p.o[0]+h*.3,p.o[1]+h*.3,0],[p.U[0],p.U[1],0],[p.V[0],p.V[1],0]));set(cardShadow,'opacity',f2(.16*clamp(1-h/50)));}
function blend(a,b,e,lift=0){const U=norm(mix(a.U,b.U,e)),v0=mix(a.V,b.V,e),V=norm(sub(v0,U.map(x=>x*dot(v0,U))));const o=mix(a.o,b.o,e);o[2]+=lift*Math.sin(Math.PI*e);return{o,U,V};}
// Framed on its widest poses: the card in the slot (left), on the pad (top), the receipt out (right) and the card at rest (bottom).
set(svg,'viewBox','-182 -216 352 409');
// State: the sale (amount, tap or chip and PIN, authorization, receipt) and the card's travel; audio only after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const say=m=>{announcement.textContent=m;};
const money=c=>'$'+Math.floor(c/100).toLocaleString('en-US')+'.'+pad(c%100,2);
let cents=2480,entry=null,pin='',decline=false,phase='ready',t0=performance.now(),method='',txn=0,auth='',screen='',notice='',noticeUntil=0,lastUI=0,lights=0;
let move=null,inSlot=false,L0=LREST,lastL=-1,lines=0,printing=null,printed=false,flying=[],ac=null,nb=null;
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
function tone(f,d=.1,v=.02,type='sine',when=0){if(!ac)return;try{const t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
function noise(d=.05,v=.02,f=3000,q=1){if(!ac)return;try{if(!nb){nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}const t=ac.currentTime,s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;b.Q.value=q;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(ac.destination);s.start(t,Math.random()*.5,d+.02);}catch(_){}}
function hint(m,err){notice=m;noticeUntil=performance.now()+1500;if(err)tone(220,.14,.025,'square');lastUI=0;}
function go(p){phase=p;t0=performance.now();notice='';lastUI=0;}
function travel(to,dur,lift,then){if(reduced.matches){poseCard(to);then&&then();return;}move={from:pose,to,t0:performance.now(),dur,lift,then};}
function press(k){const c=caps[k];if(!c)return;c.down=performance.now()+(reduced.matches?0:110);tone(1500,.03,.012,'square');}
function tear(){if(L0<=LREST+1)return;const s=live;flying.push({s,t0:performance.now()});live=mkStrip(paperG);L0=LREST;lastL=-1;printed=false;noise(.16,.03,3400,.7);if(reduced.matches){s.g.remove();flying.pop();}else flyG.appendChild(s.g);}
function busy(){return phase!=='ready'&&phase!=='amount'&&phase!=='thanks';}
function start(){if(entry!==null){if(+entry===0){hint('ENTER AN AMOUNT',true);say('Enter an amount first.');return false;}cents=+entry;entry=null;}if(phase==='thanks')go('ready');tear();return true;}
function tap(){audio();if(inSlot){hint('CARD IN SLOT · I TO REMOVE',true);return;}if(busy()){hint('PLEASE WAIT');return;}if(!start())return;
method='CONTACTLESS';lights=0;go('tap');say(`Card moving to the contactless pad for ${money(cents)}.`);travel(TAP,700,30,()=>{go('read');});
if(reduced.matches){lights=4;authorize();}}
function insert(){audio();if(inSlot&&(phase==='pin'||phase==='canceled'||phase==='declined'||phase==='approved'||phase==='thanks'||phase==='ready')){if(phase==='pin')cancel('CARD REMOVED');else eject();return;}
if(busy()){hint('PLEASE WAIT');return;}if(!start())return;method='CHIP';go('insert');say(`Inserting the card for ${money(cents)}.`);
travel(PRE,650,26,()=>{backCard.appendChild(cardG);travel(SLOT,340,0,()=>{inSlot=true;noise(.04,.04,1800,1.2);tone(900,.05,.015);pin='';go('pin');say('Card inserted. Enter the PIN, then OK.');});});}
function eject(){if(!inSlot)return;inSlot=false;say('Card removed.');travel(PRE,320,0,()=>{frontCard.appendChild(cardG);travel(REST,650,26);});}
function authorize(){go('auth');txn++;auth=(0x4f2a91+txn*0x1b3d7).toString(16).toUpperCase().slice(-6);tone(2350,.11,.03);if(method==='CONTACTLESS')travel(REST,650,30);
if(reduced.matches)result();}
function result(){if(decline){decline=false;go('declined');tone(330,.16,.03,'square');tone(330,.16,.03,'square',.24);say('Payment declined. No charge was made.');}
else{go('approved');tone(1318,.09,.03);tone(1760,.14,.03,'sine',.11);say(`Payment approved: ${money(cents)}. Printing the receipt.`);
const row=live.rows;row[2].r.textContent='#'+pad(txn,4);row[4].r.textContent=money(cents);row[5].l.textContent=method==='CHIP'?'CHIP + PIN':'CONTACTLESS';row[6].l.textContent='AUTH '+auth;
printing={t0:performance.now()+(reduced.matches?0:380),dur:NR*170,k:-1};if(reduced.matches){L0=LMAX;printing=null;printed=true;}}}
function cancel(why='CANCELED'){if(phase==='tap'||phase==='read'||phase==='auth'){hint('PLEASE WAIT');return;}
if(entry!==null){entry=null;go('ready');say('Amount entry canceled.');return;}
if(phase==='insert'){hint('PLEASE WAIT');return;}
if(phase==='pin'){go('canceled');notice=why;noticeUntil=performance.now()+1300;tone(440,.1,.02,'square');say('Sale canceled. No charge was made.');if(inSlot)eject();return;}
if(phase==='thanks'||phase==='approved'||phase==='declined'){go('ready');return;}hint('NOTHING TO CANCEL');}
function digit(k){audio();press(k);if(phase==='pin'){if(pin.length<4)pin+=k;else hint('PIN IS FOUR DIGITS',true);lastUI=0;return;}
if(busy()){hint('PLEASE WAIT');return;}if(phase==='thanks')go('ready');if(entry===null){entry='';tear();go('amount');}if(entry.length>=7){hint('AMOUNT TOO LONG',true);return;}entry=String(+(entry+k));lastUI=0;}
function correct(){audio();press('Backspace');if(phase==='pin'){pin=pin.slice(0,-1);lastUI=0;return;}if(entry!==null){entry=entry.slice(0,-1);lastUI=0;return;}hint('NOTHING TO CORRECT');}
function ok(){audio();press('Enter');if(phase==='pin'){if(pin.length<4){hint('PIN IS FOUR DIGITS',true);say('Enter four PIN digits.');return;}authorize();return;}
if(entry!==null){if(+entry===0){hint('ENTER AN AMOUNT',true);return;}cents=+entry;entry=null;go('ready');say(`Amount set: ${money(cents)}. Tap or insert the card.`);return;}
if(phase==='ready'){hint('TAP OR INSERT CARD');return;}if(phase==='thanks'){go('ready');return;}hint('PLEASE WAIT');}
function armDecline(){audio();if(busy()){hint('PLEASE WAIT');return;}decline=!decline;say(decline?'The next payment will be declined.':'Decline test canceled.');lastUI=0;}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
const act={t:tap,i:insert,d:armDecline,Enter:ok,Escape:()=>{audio();press('Escape');cancel();},Backspace:correct};
bind(cardG,()=>inSlot?insert():tap());bind(tapPad,tap);bind(bottomEnd,insert);
KEYS.forEach(k=>bind(caps[k].g,()=>{if(/^[0-9]$/.test(k))digit(k);else if(act[k])act[k]();else{audio();press(k);}}));
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const k=e.key.length===1?e.key.toLowerCase():e.key;
if(/^[0-9]$/.test(k)){e.preventDefault();digit(k);}else if(act[k]){e.preventDefault();act[k]();}});
function show(n){if(screen===n)return;if(screen)SCR[screen].style.opacity=0;screen=n;SCR[n].style.opacity=1;}
function tick(now){
const red=reduced.matches;
if(move){const q=clamp((now-move.t0)/move.dur);poseCard(blend(move.from,move.to,ease(q),move.lift));if(q>=1){const m=move;move=null;poseCard(m.to);m.then&&m.then();}}
const el2=now-t0;
if(phase==='read'){lights=Math.min(4,Math.floor(el2/150));if(el2>=640)authorize();}
else if(phase==='auth'&&el2>=(method==='CHIP'?1100:950))result();
else if(phase==='approved'){if(inSlot&&el2>=900&&!move)eject();if(printed&&!inSlot&&!move&&el2>=1700)go('thanks');}
else if(phase==='declined'){if(inSlot&&el2>=900&&!move)eject();if(!inSlot&&!move&&el2>=2400)go('ready');}
else if(phase==='canceled'&&!inSlot&&!move&&el2>=1300)go('ready');
else if(phase==='thanks'&&el2>=4200)go('ready');
if(printing&&now>=printing.t0){const p=clamp((now-printing.t0)/printing.dur),f=p*NR,k=Math.min(NR-1,Math.floor(f));if(k!==printing.k){printing.k=k;noise(.07,.03,2600,.9);tone(140,.04,.008,'square');}
L0=LREST+(LMAX-LREST)*clamp((Math.floor(f)+ease(f-Math.floor(f)))/NR);if(p>=1){L0=LMAX;printing=null;printed=true;lastUI=0;}}
if(L0!==lastL){lastL=L0;lines=drawStrip(live,L0);}
for(let i=flying.length;i--;){const F=flying[i],q=clamp((now-F.t0)/650),e=ease(q);set(F.s.g,'transform',`translate(${f2(18*e)} ${f2(-34*e-10*q*q)})`);F.s.g.style.opacity=f2(1-e);if(q>=1){F.s.g.remove();flying.splice(i,1);}}
for(const k of KEYS){const c=caps[k],h=now<c.down?.5:1.8;if(h!==c.h){c.h=h;set(c.g,'transform',capT(h));}}
// The screen, the read lights, the pad's waves and the cradle lamp.
const reading=phase==='read'||(phase==='tap'&&move&&ease((now-move.t0)/move.dur)>.8);
const n=phase==='ready'?'ready':phase==='amount'?'amount':phase==='tap'?(reading?'reading':'ready'):phase==='read'?'reading':phase==='insert'?'ready':phase==='pin'?'pin':phase==='auth'?'auth':phase==='approved'?(inSlot&&el2>=900?'remove':'approved'):phase==='declined'?(inSlot&&el2>=900?'remove':'declined'):phase==='canceled'?(inSlot?'remove':'canceled'):'thanks';show(n);
const lit4=phase==='read'?lights:phase==='auth'||phase==='approved'?(method==='CONTACTLESS'?4:0):0;dots.forEach((d,i)=>set(d,'class',i<lit4?'dot on':'dot'));
const breath=.5+.5*Math.sin(now/520);tapIcon.style.opacity=red?1:f2(.45+.55*breath);
readIcon.forEach((p,i)=>{p.style.opacity=red?1:f2(.3+.7*clamp(Math.sin(now/140-i*.9)*.5+.5));});
set(spin,'transform',`rotate(${f2((now*.42)%360)} 37 27)`);arrow.style.transform=red?'':`translate(0px,${f2(1.2*Math.sin(now/180))}px)`;
caret.style.opacity=red||Math.floor(now/500)%2?1:.15;
if(phase==='approved'){set(okMark,'stroke-dashoffset',f2(18*(1-(red?1:ease((el2-60)/420)))));}else set(okMark,'stroke-dashoffset','18');
set(halo,'class',phase==='approved'||phase==='thanks'?'halo ok':phase==='declined'?'halo no':'halo');const tag=decline?'DECLINE TEST':'SALE';if(saleT.textContent!==tag){saleT.textContent=tag;set(saleT,'class','si s l '+(decline?'no':'d'));}
const amt=money(entry!==null?+entry:cents);for(const t of[amtR,amtG,amtU,amtP,amtV])if(t.textContent!==amt)t.textContent=amt;const ae=money(+(entry||0));if(amtA.textContent!==ae)amtA.textContent=ae;
pinDots.forEach((d,i)=>set(d,'visibility',i<pin.length?'visible':'hidden'));const av='AUTH '+(auth||'——');if(authV.textContent!==av)authV.textContent=av;
const hold=phase==='read'&&lights>=4?'CARD READ':'HOLD CARD';if(holdT.textContent!==hold)holdT.textContent=hold;set(cardG,'aria-label',inSlot?'Payment card: remove it from the slot (I)':'Payment card: tap it on the pad (T)');
const wv=reading&&!red;waves.forEach((w,i)=>{if(!wv){w.style.opacity=reading?(.5-i*.12).toFixed(2):0;if(reading)set(w,'d',arcs(34+i*12));return;}const p=((now-t0)/700+i/3)%1;set(w,'d',arcs(24+p*48));w.style.opacity=f2((1-p)*.85);});
nfcGlow.style.opacity=reading?(red?.35:f2(.25+.2*Math.sin(now/90))):0;
lit(chg,'g');chg.style.opacity=red?1:f2(.55+.45*breath);
if(!lastUI||now-lastUI>120){lastUI=now;
const tail=phase==='pin'?'PIN '+'•'.repeat(pin.length)+'–'.repeat(4-pin.length):phase==='read'?`READ ${lights}/4`:phase==='approved'||phase==='thanks'?'AUTH '+auth:phase==='declined'?'NOT AUTHORIZED':'SALE '+pad(txn+1,4),r=`${amt} · ${tail}`;
if(readout.textContent!==r)readout.textContent=r;
const ph={ready:'READY · TAP OR INSERT',amount:'ENTER AMOUNT · OK',tap:'CARD TO PAD',read:'READING CARD',insert:'CARD TO SLOT',pin:'CHIP · ENTER PIN',auth:'AUTHORIZING',approved:printing?`APPROVED · PRINTING ${pad(lines,2)}/${pad(NR,2)}`:inSlot?'APPROVED · REMOVE CARD':'APPROVED',declined:inSlot?'DECLINED · REMOVE CARD':'DECLINED',canceled:'CANCELED',thanks:'PAID · TAKE RECEIPT'}[phase];
const st=notice&&now<noticeUntil?notice:ph+(decline&&(phase==='ready'||phase==='amount')?' · DECLINE NEXT':'');if(stateLabel.textContent!==st)stateLabel.textContent=st;}
requestAnimationFrame(tick);}
function arcs(r){const a=.62,c=Math.cos(a)*r,s=Math.sin(a)*r;return `M${f2(47+c)},${f2(22-s)}A${f2(r)},${f2(r)} 0 0 1 ${f2(47+c)},${f2(22+s)}M${f2(47-c)},${f2(22+s)}A${f2(r)},${f2(r)} 0 0 1 ${f2(47-c)},${f2(22-s)}`;}
poseCard(REST);requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
