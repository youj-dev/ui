// @ts-nocheck
/* VELLUN R–04 · Receipt printer. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--st:#bdbdb9;--st-top:#d2d2ce;--st-side:#a8a8a5;--void:#4a4a48;--rubber:#2e2e2d;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--screen:#1c1d1e;--scr:#8ea0ff;--key:#f3f3f0;--paper:#efeee8;--paper-top:#fffffc;--print:#2c2c2c;--card:#4a5fd0;--card-edge:#26337e;--chip:#d8b45f;--cord:#3a3a39;--cord2:#f0f0ed;--n1:#a9cbb8;--n2:#e3bcc0;--n3:#b9c8e8;--n4:#ead7a4;--n5:#d3c4e4;--cu:#d29a6b;--br:#ddbf6a;--ag:#dcdcd8;--kr:#e0584b;--ky:#e9bd3f;--kg:#2fae6c}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--st:#9f9f9c;--st-top:#c4c4c1;--st-side:#767675;--void:#3d3d3c;--rubber:#252524;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--screen:#161717;--scr:#7f93ff;--key:#cdcdcb;--paper:#c9c9c5;--paper-top:#d7d7d5;--print:#232323;--card:#3d4faf;--card-edge:#1e2969;--chip:#b6974f;--cord:#2f2f2f;--cord2:#cacac8;--n1:#8eab9b;--n2:#bf9ea1;--n3:#9ba8c3;--n4:#c5b58a;--n5:#b2a5c0;--cu:#b18159;--br:#baa158;--ag:#b9b9b7;--kr:#bd493e;--ky:#c49f34;--kg:#26925a;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.end{text-anchor:end}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.st{fill:var(--st)}.top.st{fill:var(--st-top)}.side.st{fill:var(--st-side)}.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.rubber{fill:var(--rubber)}.void{fill:var(--void)}.screen{fill:var(--screen)}.key{fill:var(--key)}.kr{fill:var(--kr)}.ky{fill:var(--ky)}.kg{fill:var(--kg)}.chip{fill:var(--chip)}.n1{fill:var(--n1)}.n2{fill:var(--n2)}.n3{fill:var(--n3)}.n4{fill:var(--n4)}.n5{fill:var(--n5)}.c-cu{fill:var(--cu)}.c-br{fill:var(--br)}.c-ag{fill:var(--ag)}
.cbu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.cbl{fill:none;stroke-linecap:round;stroke-linejoin:round}.k1{stroke:var(--cord)}.k2{stroke:var(--cord2)}.pulse{fill:none;stroke:var(--accent);stroke-linecap:round;opacity:0;filter:url(#glow)}
.lamp{fill:var(--off);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.r,.lamp.b{filter:url(#glow);stroke:none}
.ring{fill:none;stroke:var(--off);stroke-width:1.3}.ring.on{stroke:var(--accent);filter:url(#glow)}.headglow{fill:var(--accent);opacity:0;filter:url(#glow)}.halo{fill:var(--accent);opacity:.16;filter:url(#bloom)}.ok .halo,.halo.ok{fill:var(--ok)}
.scr{fill:var(--scr);font:3.1px ui-monospace,monospace;letter-spacing:.5px;text-anchor:middle;stroke:none}.scr.big{font-size:7.4px;font-weight:600;letter-spacing:.2px}.scrl{fill:none;stroke:var(--scr);stroke-width:.8;stroke-linecap:round;stroke-linejoin:round}.ok .scr{fill:var(--ok)}.ok .scrl{stroke:var(--ok)}.kl{fill:var(--ink);font:600 3.3px ui-monospace,monospace;text-anchor:middle;stroke:none}
.paper{fill:var(--paper);stroke:none}.pshade{fill:var(--paper-top);stroke:none}.pline{fill:none;stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke;stroke-linejoin:round}.pshadow{fill:var(--shadow);filter:url(#soft2)}
.ink{fill:var(--print);font:3.2px ui-monospace,monospace;letter-spacing:.1px;stroke:none}.ink.b{font-weight:700;font-size:3.9px;letter-spacing:.35px}.ink.c{text-anchor:middle}.ink.e{text-anchor:end}.ink.s{font-size:2.6px}.inkl{fill:none;stroke:var(--print);stroke-width:.35;stroke-dasharray:.9 .7}.bar{fill:var(--print)}.den{fill:var(--print);font:700 6px ui-monospace,monospace;opacity:.5;stroke:none}
.card{fill:var(--card);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.card-e{fill:var(--card-edge);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.ct{fill:#fff;font:600 3.6px ui-monospace,monospace;letter-spacing:.8px;stroke:none;opacity:.92}.ct.s{font-size:3px;font-weight:400;letter-spacing:.4px}.cs{fill:none;stroke:#fff;stroke-width:.5;opacity:.85;stroke-linecap:round}.sheen{fill:#fff;opacity:.1}
.control{cursor:pointer;outline:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:focus-visible .pline{stroke:var(--accent);stroke-width:1.4}.control[aria-disabled=true]{cursor:default}
.press{transform-box:fill-box;transform-origin:center;transition:transform .12s}.pressed .press{transform:scale(.88)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<filter id="soft2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2.2"/></filter>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* VELLUN R–04 counter set. World: x lower-right, y lower-left, z up; 1 unit ≈ 1.6 mm.
Part                         x      y      z      w      d      h
feet (4)                14/232 14/172      0     14     14      6
drawer sleeve                0      0      6    260    200     44   seams, side beads, label, kick port
interior void                2    200      8    256      0     40   seen while the drawer is out
cash tray                    6     40     10    248    160     35   moves +y 80: note bays, clips, coin cups
drawer front                 2    200      8    256      6     40   inset, cheque slot, lock, pull groove
printer skirt               18     26     50    120    124      4
printer body                16     24     54    124    128     58   side vents, rating label, two ports
cover (clamshell)           16     24    112    124    108     38
front block                 16    134    112    124     18     34   slot y 132–134, serrated tear bar
fascia (y 152)              16    152     54    124      0     92   wordmark, PWR / PAPER / ERR, FEED
kick cable             140–261   15–38   29–76      –      –      –   printer port → drawer side port
data cable             140–196   24–46   51–64      –      –      –   terminal dock → printer port
terminal dock              166     30     50     80    110      6   charge LED
terminal wedge             172     36     56     68     98  14–44   sloped face: 4 LEDs, display, keypad
card cradle                168    148     50     78     44      3
payment card               176    150   53.4     62     40    1.3   flies to the display and back
receipt                     42    133    146     72      –    ≤ 76  rises 22, curls back on r 30
torn receipts              280     64      0     72     76      –   unfurl onto the counter, last three kept
Seams, screws, LEDs, keys and legends share their parent faces. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: oriented planes, vectors, bevelled panels, LEDs, rounded cable runs.
const draw=root,into=g=>root=g;
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`;
const sub=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]],norm=a=>{const l=Math.hypot(...a)||1;return a.map(v=>v/l);},f2=p=>p[0].toFixed(2)+','+p[1].toFixed(2);
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),ease=t=>t*t*(3-2*t),pad=(n,k)=>String(n).padStart(k,'0');
function pin(g,x,y,r=.75){circle(g,x,y,r,'face top');line(g,x-r*.5,y+r*.35,x+r*.5,y-r*.35);}
function panel(g,x,y,w,h,b,cls='',inset=false){rect(g,x,y,w,h,1,'face '+cls);el('path',{d:`M${x},${y}H${x+w}L${x+w-b},${y+b}H${x+b}ZM${x},${y}L${x+b},${y+b}V${y+h-b}L${x},${y+h}Z`,class:`face ${inset?'side':'top'} ${cls}`},g);el('path',{d:`M${x},${y+h}L${x+b},${y+h-b}H${x+w-b}L${x+w},${y+h}ZM${x+w},${y}V${y+h}L${x+w-b},${y+h-b}V${y+b}Z`,class:`face ${inset?'top':'side'} ${cls}`},g);}
function lamp(g,x,y,r=1){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
function route(pts,r=2){
let d='M'+P(...pts[0]);
for(let i=1;i<pts.length-1;i++){
const a=pts[i-1],b=pts[i],c=pts[i+1],la=Math.hypot(...b.map((v,j)=>v-a[j])),lc=Math.hypot(...c.map((v,j)=>v-b[j]));
const p=b.map((v,j)=>v+(a[j]-v)*Math.min(r,la/2)/la),q=b.map((v,j)=>v+(c[j]-v)*Math.min(r,lc/2)/lc);
d+='L'+P(...p)+'Q'+P(...b)+' '+P(...q);
}
return d+'L'+P(...pts[pts.length-1]);
}
function cable(pts,cls,w){const d=route(pts,3);el('path',{d,class:'cbu','stroke-width':w+1});el('path',{d,class:'cbl '+cls,'stroke-width':w});const p=el('path',{d,class:'pulse','stroke-width':w*.8});p.L=p.getTotalLength();set(p,'stroke-dasharray',`9 ${p.L+20}`);return p;}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
// Assembly: shadow and feet; the tray first, so the sleeve hides whatever of it is inside.
const sp=P(140,104,0);el('ellipse',{cx:sp[0],cy:sp[1]+4,rx:212,ry:96,class:'shadow stage-floor'});el('ellipse',{cx:sp[0],cy:sp[1]+4,rx:212,ry:96,class:'stage-contact'});
for(const[x,y]of[[14,14],[232,14],[14,172],[232,172]])box(x,y,0,14,14,6,2,'rubber');
rect(group(FRONT(2,200,48)),0,0,256,40,1,'face void');
const trayG=into(el('g',{}));
rect(group(FRONT(8,42,45)),0,0,244,15,0,'face st');rect(group(SIDE(8,200,45)),0,0,158,15,0,'face side st');rect(group(TOP(8,42,30)),0,0,244,158,1,'face recess');
const NOTE=['n1','n2','n3','n4','n5'],DEN=['5','10','20','50','100'];
for(let i=0;i<5;i++){
const bx=8+i*49.2;
for(let j=0;j<3;j++){const g=group(TOP(bx+3.6+j*.9,40+j*1.8,30.4+j*.6));rect(g,0,0,40,104,1.4,'face '+NOTE[i]);rect(g,3,66,34,35,1,'detail');circle(g,27,86,6.5,'detail');text(g,5.5,97,DEN[i],'den');}
rect(group(TOP(bx+17,100,32.8)),0,0,6,40,2,'face top metal');cylinder(bx+11,140,34.2,2,18,'x','metal');
if(i<4)box(bx+47.2,42,30,2,106,10,.4,'st');
}
box(8,148,30,244,2,8,.4,'st');
[['c-cu',4.4,5],['c-cu',5,5],['c-br',5.6,4],['c-ag',6,4],['c-br',6.4,3]].forEach(([c,r,n],i)=>{const bx=8+i*49.2,g=group(TOP(bx+2,152,30.05));rect(g,0,0,43.2,26,6,'face base');rect(g,1.6,1.6,40,22.8,5,'detail');
for(let k=0;k<n;k++){const e=ellipse(bx+10+(k*13.7)%28,158.5+(k*7.3)%13,30.4+k*.5,r,'z','face '+c);circle(e.parentNode,0,0,r*.7,'detail');}});
rect(group(SIDE(254,200,45)),0,0,160,35,1,'face side st');
for(const[x,w,d]of[[6,248,2],[6,2,160],[252,2,160]])rect(group(TOP(x,40,45)),0,0,w,d,0,'face top st');
into(draw);
// Sleeve: side with beads, label and kick port; top; the thin front edges around the opening.
const cs=group(SIDE(260,200,50));rect(cs,0,0,200,44,3,'face side st');
rect(cs,8,9,184,2.4,1.2,'face top st');rect(cs,8,32.6,184,2.4,1.2,'face top st');
rect(cs,110,15.4,38,13,1,'face top');text(cs,113,20.6,'VELLUN CD–410','etch micro');text(cs,113,25.2,'24 V DC · RJ12','etch micro');
rect(cs,180,17,9,7,1.2,'face void');rect(cs,181.6,18.6,5.8,3.8,.6,'face recess');for(const u of[4,196])pin(cs,u,22,.9);
const ctop=group(TOP(0,0,50));rect(ctop,0,0,260,200,3,'face top st');rect(ctop,6,6,248,188,2,'detail');for(const[u,v]of[[11,11],[249,11],[11,189],[249,189]])pin(ctop,u,v,1);
el('path',{d:'M3,0H257Q260,0 260,3V41Q260,44 257,44H3Q0,44 0,41V3Q0,0 3,0ZM2,2V42H258V2Z','fill-rule':'evenodd',class:'face st',transform:FRONT(0,200,50)});
// Drawer front: moves with the tray.
const drw=into(button(el('g',{}),{'aria-label':'Open the cash drawer (D)','aria-pressed':'false'}));
box(2,200,8,256,6,40,2.5,'st');
const df=group(FRONT(2,206,48));panel(df,8,5,206,25,1.6,'st');
rect(df,77,8,68,2.2,1.1,'face void');rect(df,16,13,26,8,1.4,'face metal');text(df,29,18.3,'VELLUN','etch micro center');
circle(df,235,17.5,5.4,'face metal');circle(df,235,17.5,3.9,'face top metal');rect(df,234.4,15,1.2,5,.5,'face void');
rect(df,46,33.6,130,2.6,1.3,'face void');rect(df,-2,-2,260,44,4,'focus-ring');
into(draw);
// Printer: skirt, body, clamshell cover, front block with the slot and tear bar, fascia.
box(18,26,50,120,124,4,1.5,'rubber');box(16,24,54,124,128,58,4);
const bs=group(SIDE(140,152,112));slits(bs,14,14,52,28,8,false);
rect(bs,74,15,32,15,1.2,'face top');text(bs,77,20.4,'VELLUN R–04','etch micro');text(bs,77,25,'24 V DC 2.5 A','etch micro');
rect(bs,110,33,8,6,1.2,'face void');rect(bs,102,45.5,8,5,1.2,'face void');for(const[u,v]of[[5,5],[123,5],[5,53],[123,53]])pin(bs,u,v,.9);
box(16,24,112,124,108,38,6);
const cvs=group(SIDE(140,132,150));rect(cvs,6,8,96,22,4,'detail');rect(cvs,10,12,14,13,3,'face recess');rect(cvs,12,14.5,10,8,2.4,'face top');
const ctp=group(TOP(16,24,150));rect(ctp,6,6,112,94,6,'detail');rect(ctp,12,12,100,82,4,'detail');
rect(ctp,30,22,64,13,6.5,'face recess');rect(ctp,31.6,23.6,60.8,9.8,4.9,'face glass');const roll=rect(ctp,33.6,25.6,56.8,5.8,2.9,'paper');rect(ctp,33,24.4,58,1.6,.8,'sheen');
text(ctp,62,44,'PAPER','etch micro center');text(ctp,62,74,'VELLUN','etch center');
box(16,134,112,124,18,34,3);
rect(group(TOP(16,132,146.02)),8,0,108,2,.6,'face void');const head=rect(group(TOP(16,132,146.1)),14,.5,96,1,.5,'headglow');
box(24,134.2,146,108,2.8,1.4,.3,'metal');let tz='M0,0';for(let i=0;i<54;i++)tz+='l1,1.1l1,-1.1';el('path',{d:tz,class:'detail',transform:TOP(24,134.2,147.4)});
const fr=group(FRONT(16,152,146));rect(fr,0,0,124,92,4,'face');rect(fr,0,33.4,124,1.2,0,'face recess');
text(fr,9,15,'VELLUN','label brand');text(fr,9.4,21.6,'R–04 · 80 MM THERMAL','etch micro');
const LED={pwr:lamp(fr,91,11.6,1.15),paper:lamp(fr,101,11.6,1.15),err:lamp(fr,111,11.6,1.15)};
[['PWR',91],['PAPER',101],['ERR',111]].forEach(([s,u])=>text(fr,u,17.4,s,'etch micro center'));
panel(fr,9,44,58,30,1.6,'',true);slits(fr,14,48.5,48,21,8,false);slits(fr,8,83.5,108,4,30);
const feed=button(group('',fr),{'aria-label':'Print the receipt (P)'});
circle(feed,98,58,14.6,'focus-ring');circle(feed,98,58,12.4,'face recess');const ring=circle(feed,98,58,10.7,'ring');
const press=group('',feed,{class:'press'});circle(press,98,58,9,'face top');
el('path',{d:'M95,61.6V55.6H101V61.6M96.6,57.6H99.4M96.6,59.6H99.4M98,54.2V50.8M96.6,52.2L98,50.8L99.4,52.2',class:'detail'},press);
text(fr,98,77.4,'FEED','etch micro center');
// Receipt: a 72-wide strip; its left edge follows a path from the slot (s = 0) to its free end.
const X0=42,PW=72,SY=133,SZ=146.4,R0=22,RC=30,ROW=5.6,TOPM=6,NR=12,LMAX=TOPM+NR*ROW+3,LREST=4.4;
const curl=s=>s<=R0?[X0,SY,SZ+s]:[X0,SY-RC+RC*Math.cos((s-R0)/RC),SZ+R0+RC*Math.sin((s-R0)/RC)];
const LINES=[['h','VELLUN MARKET'],['c','14 LINDEN ROW · TILL 04'],['r','06.10.26 10:41','TXN 0001'],['rule'],['r','WHOLE GRAIN','3.80'],['r','COFFEE BEANS','8.40'],['r','CITRUS SODA','2.20'],['r','CARRY TOTE','4.00'],['b','TOTAL EUR','18.40'],['r','CARD •••• 0428','APPROVED'],['c','THANK YOU · KEEP THIS SLIP'],['bar']];
function mkStrip(parent){
const g=el('g',{},parent),s={g};s.shd=el('rect',{class:'pshadow',opacity:0,rx:3},g);s.fill=el('path',{class:'paper'},g);s.sh=[.3,.55,.8,1].map(o=>el('path',{class:'pshade',opacity:o},g));s.out=el('path',{class:'pline'},g);
s.rows=LINES.map(([k,a,b])=>{const r=el('g',{visibility:'hidden'},g);
if(k==='h')text(r,36,4.4,a,'ink b c');else if(k==='c')text(r,36,3.8,a,'ink c s');else if(k==='rule')line(r,5,2.6,67,2.6,'inkl');
else if(k==='bar'){let x=13,q=7;const rnd=()=>(q=(q*9301+49297)%233280)/233280;while(x<58){const w=.35+rnd()*.9;if(rnd()>.3)rect(r,x,.5,w,4.4,0,'bar');x+=w+.35+rnd()*.45;}}
else{r.l=text(r,5,3.8,a,'ink'+(k==='b'?' b':''));r.r=text(r,67,3.8,b,'ink e'+(k==='b'?' b':''));}
return r;});return s;}
function zig(a,W,inw,dir){let d='';for(let j=1;j<=36;j++){const u=dir>0?j/36:1-j/36,k=j%2?1.2:0;d+='L'+f2(P(a[0]+W[0]*u+inw[0]*k,a[1]+W[1]*u+inw[1]*k,a[2]+W[2]*u+inw[2]*k));}return d;}
function drawStrip(s,L,at,U,torn){
const n=Math.max(2,Math.ceil(L/2.4)),pts=[];for(let i=0;i<=n;i++)pts.push(at(L*i/n));
const W=U.map(c=>c*PW),lp=pts.map(p=>P(...p)),rp=pts.map(p=>P(p[0]+W[0],p[1]+W[1],p[2]+W[2])),tE=norm(sub(pts[n],pts[n-1])),t0=norm(sub(pts[1],pts[0]));
let d='M'+f2(lp[0]);for(let i=1;i<=n;i++)d+='L'+f2(lp[i]);d+=zig(pts[n],W,tE.map(v=>-v),1);for(let i=n-1;i>=0;i--)d+='L'+f2(rp[i]);if(torn)d+=zig(pts[0],W,t0,-1);d+='Z';
set(s.fill,'d',d);set(s.out,'d',d);
const sd=['','','',''];for(let i=0;i<n;i++){const t=norm(sub(pts[i+1],pts[i])),k=Math.round((t[0]*U[1]-t[1]*U[0])*4)-1;if(k>=0)sd[Math.min(3,k)]+=`M${f2(lp[i])}L${f2(lp[i+1])}L${f2(rp[i+1])}L${f2(rp[i])}Z`;}
s.sh.forEach((p,k)=>set(p,'d',sd[k]));
let shown=0;s.rows.forEach((r,i)=>{const st=L-TOPM-i*ROW,vis=st>=ROW;if(vis){shown++;const o=at(st);set(r,'transform',plane(o,U,norm(sub(at(st-1),o))));}set(r,'visibility',vis?'visible':'hidden');});
return shown;}
const paperG=button(el('g',{}),{'aria-label':'Receipt: print it first with P','aria-disabled':'true'});let live=mkStrip(paperG);
// Cables behind the terminal: drawer kick (printer → drawer) and data (terminal → printer).
const kick=cable([[140,38,76],[146,38,76],[148,34,51.4],[150,15.5,51.4],[258,15.5,51.4],[261.4,15.5,47],[261.4,15.5,29.5]],'k1',1.8);
const data=cable([[140,46,64],[146,46,64],[148,42,51.4],[152,24,51.4],[196,24,51.4],[196,30,53]],'k2',1.6);
// Terminal: dock, wedge, sloped face with LEDs, display and keypad; cradle and card.
box(166,30,50,80,110,6,3,'st');const chg=lamp(group(FRONT(166,140,56)),72,3,.9);
const TL=Math.hypot(98,30),TV=[0,98/TL,-30/TL],TN=[0,30/TL,98/TL];
el('path',{d:poly([[240,36,56],[240,134,56],[240,134,70],[240,36,100]],true),class:'face side'});
const tfr=group(FRONT(172,134,70));rect(tfr,0,0,68,14,2.5,'face');rect(tfr,14,8.6,40,2.4,1.2,'face void');
rect(tfr,20,2.2,28,4,2,'face recess');const RL=[0,1,2,3].map(i=>lamp(tfr,25+i*6,4.2,1.1));
const term=button(el('g',{transform:plane([172,36,100],[1,0,0],TV)}),{'aria-label':'Tap the payment card (C)'});
rect(term,0,0,68,TL,5,'face top');text(term,7,7.4,'VELLUN','etch micro');
el('path',{d:'M54,4.4a2.4,2.4 0 0 1 0,3.6M56,3.4a3.8,3.8 0 0 1 0,5.6M58,2.4a5.2,5.2 0 0 1 0,7.6',class:'detail'},term);
const scr=el('g',{},term);rect(scr,6,11,56,38,3,'face recess');rect(scr,10,15,48,30,2,'halo');rect(scr,8,13,52,34,2,'face screen');const tapGlow=rect(term,4,9,60,42,6,'halo');tapGlow.style.opacity=0;
const sTop=text(scr,34,20.4,'TAP CARD','scr'),sAmt=text(scr,34,31,'€18.40','scr big');
const sIcon=el('path',{d:'M31,38.2a3,3 0 0 1 0,4.4M33.4,36.8a5,5 0 0 1 0,7.2M35.8,35.4a7,7 0 0 1 0,10',class:'scrl'},scr),sOk=el('path',{d:'M30.6,40.8l2.6,2.6l5.4,-5.6',class:'scrl',visibility:'hidden'},scr);
for(let i=0;i<12;i++){const u=10+(i%3)*17,v=54+Math.floor(i/3)*9;rect(term,u,v,14,7,1.6,'face key');text(term,u+7,v+5,'123456789*0#'[i],'kl');}
['kr','ky','kg'].forEach((c,i)=>rect(term,10+i*17,91,14,7,1.6,'face '+c));rect(term,-2,-2,72,TL+4,6,'focus-ring');
box(168,148,50,78,44,3,2,'st');rect(group(TOP(168,148,53)),4,3,70,38,2,'face recess');
const card=button(el('g',{}),{'aria-label':'Tap the payment card (C)'}),cardE=el('g',{},card),cardT=el('g',{},card);
rect(cardE,0,0,62,40,3,'card-e');rect(cardT,0,0,62,40,3,'card');el('path',{d:'M30,0H46L22,40H6Z',class:'sheen'},cardT);
rect(cardT,8,13,10,8,1.6,'face chip');line(cardT,11.4,13,11.4,21);line(cardT,14.6,13,14.6,21);line(cardT,8,17,18,17);
el('path',{d:'M23,15a2.6,2.6 0 0 1 0,4M25,14a4,4 0 0 1 0,6M27,13a5.4,5.4 0 0 1 0,8',class:'cs'},cardT);
text(cardT,8,8.4,'VELLUN','ct');text(cardT,8,32,'•••• 0428','ct s');text(cardT,54,32,'06/29','ct s end');rect(cardT,-2,-2,66,44,4,'focus-ring');
const fallG=el('g',{});
frame([[0,0,0,260,200,50],[2,200,8,256,86,40],[16,24,50,124,128,100],[42,88,146,72,46,54],[274,56,0,94,112,1]],14);
// State: payment, printing, tearing and the drawer; audio only after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const C0=[207,170,53.4],DC=[206,36+30*TV[1],100+30*TV[2]],C1=DC.map((v,i)=>v+9*TN[i]),TA=Math.atan2(30,98);
let L=LREST,lastL=-1,lines=0,printing=null,tap=null,paid=false,queued=false,auth=0,txn=0,torn=0,falls=[],slots=[],errUntil=0,notice='',noticeUntil=0;
let open=false,travel=0,dv=0,lastTr=-1,kickAt=-1,pulses=[],last=performance.now(),lastUI=0,ac=null,nb=null;
const say=m=>{announcement.textContent=m;};
function hint(m,err){notice=m;noticeUntil=performance.now()+1600;if(err){errUntil=performance.now()+700;tone(190,.12,.02,'square');}lastUI=0;}
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
function tone(f,d=.1,v=.02,type='sine',when=0){if(!ac)return;try{const t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
function noise(d=.05,v=.02,f=3000,q=1){if(!ac)return;try{if(!nb){nb=ac.createBuffer(1,ac.sampleRate,ac.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}const t=ac.currentTime,s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;b.Q.value=q;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(ac.destination);s.start(t,Math.random()*.5,d+.02);}catch(_){}}
function poseCard(q,bob){const e=ease(q),c=C0.map((v,i)=>v+(C1[i]-v)*e),a=TA*e,V=[0,Math.cos(a),-Math.sin(a)],N=[0,Math.sin(a),Math.cos(a)];c[2]+=24*Math.sin(Math.PI*e)+bob;
const o=[c[0]-31,c[1]-20*V[1],c[2]-20*V[2]];set(cardT,'transform',plane(o,[1,0,0],V));set(cardE,'transform',plane(o.map((v,i)=>v-1.3*N[i]),[1,0,0],V));}
function pulse(c,dur,rev){if(reduced.matches){c.style.opacity=.9;setTimeout(()=>{c.style.opacity='';},420);return;}pulses.push({c,t0:performance.now(),dur,rev});}
function payCard(){audio();if(tap){hint('CARD · HOLD STILL');return;}notice='';tap={t0:performance.now()};say('Card moving to the reader. Authorising eighteen euros forty.');if(reduced.matches){approve();tap=null;}lastUI=0;}
function approve(){if(tap&&tap.ok)return;if(tap)tap.ok=true;paid=true;queued=true;auth++;tone(1760,.08,.03);tone(1760,.08,.03,'sine',.13);if(reduced.matches)pulse(data);say('Payment approved. Press P to print the receipt.');}
function print(){audio();if(printing){hint('PRINTER · FEEDING');return;}
if(L>LREST+1){hint('TEAR FIRST · T',true);say('Tear off the finished receipt before printing another.');return;}
notice='';txn++;live.rows[2].r.textContent='TXN '+pad(txn,4);live.rows[9].l.textContent=paid?'CARD •••• 0428':'CASH';live.rows[9].r.textContent=paid?'APPROVED':'18.40';
printing={t0:performance.now(),dur:NR*240,k:-1};set(roll,'width',Math.max(8,56.8-txn*3.4).toFixed(1));feed.classList.add('pressed');setTimeout(()=>feed.classList.remove('pressed'),170);say('Printing the receipt line by line.');
if(reduced.matches){L=LMAX;printing=null;queued=false;say('Receipt printed. Tear it off with T.');}lastUI=0;}
function fallTo(k){const th=[-.07,.05,-.02][k],F0=[280+k*5,64+k*8,.4+k*.25],U=[Math.cos(th),Math.sin(th),0],V=[-Math.sin(th),Math.cos(th),0];return{U,V,F0,floor:(s,l)=>[F0[0]+(l-s)*V[0],F0[1]+(l-s)*V[1],F0[2]]};}
function fallFrame(F,q){const e=ease(q),lift=52*Math.sin(Math.PI*Math.min(1,q*1.15)),U=norm([1+(F.U[0]-1)*e,F.U[1]*e,0]);
drawStrip(F.s,F.L,s=>{const a=curl(s),b=F.floor(s,F.L);return[a[0]+(b[0]-a[0])*e,a[1]+(b[1]-a[1])*e,a[2]+(b[2]-a[2])*e+lift+2.4*Math.sin(Math.PI*q)*Math.sin(s/8+q*10)];},U,true);set(F.s.shd,'opacity',(.13*e*e).toFixed(3));}
function tear(){audio();if(printing){hint('WAIT FOR PRINT',true);say('Wait until the receipt has finished printing.');return;}
if(L<=LREST+1){hint('PRINT FIRST · P',true);say('Print a receipt with P first.');return;}
notice='';const k=torn++%3,F={s:live,L,t0:performance.now(),...fallTo(k)};if(slots[k])slots[k].s.g.remove();slots[k]=F;
fallG.appendChild(live.g);live=mkStrip(paperG);L=LREST;lastL=-1;set(F.s.shd,'transform',plane([F.F0[0],F.F0[1],0],F.U,F.V));set(F.s.shd,'width',PW);set(F.s.shd,'height',F.L);
noise(.18,.035,3400,.7);say('Receipt torn off. It drops onto the counter.');falls.push(F);if(reduced.matches){fallFrame(F,1);falls.pop();}lastUI=0;}
function drawer(){audio();open=!open;set(drw,'aria-pressed',open);set(drw,'aria-label',(open?'Close':'Open')+' the cash drawer (D)');set(keys.d,'aria-pressed',open);
if(open){kickAt=performance.now()+(reduced.matches?0:240);pulse(kick,240);tone(90,.05,.03,'square');say('Kick pulse sent. The cash drawer springs open.');}else{kickAt=-1;say('Cash drawer closing.');}lastUI=0;}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
const act={c:payCard,p:print,t:tear,d:drawer},keys={};
document.querySelectorAll('.hint [data-k]').forEach(b=>{keys[b.dataset.k]=b;b.addEventListener('click',()=>act[b.dataset.k]());});
bind(term,payCard);bind(card,payCard);bind(feed,print);bind(paperG,tear);bind(drw,drawer);
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const a=act[e.key.toLowerCase()];if(a){e.preventDefault();a();}});
function tick(now){
const dt=Math.min(.05,(now-last)/1000),red=reduced.matches;last=now;
if(tap){const t=(now-tap.t0)/2100,q=t<.3?t/.3:t<.7?1:1-(t-.7)/.3;poseCard(clamp(q),t>.3&&t<.7?Math.sin((t-.3)*18)*.5:0);
if(t>.6&&!tap.ok)approve();if(t>.64&&!tap.sent){tap.sent=true;pulse(data,560,true);}if(t>=1){tap=null;poseCard(0,0);lastUI=0;}}
if(printing){const p=clamp((now-printing.t0)/printing.dur),f=p*NR,k=Math.min(NR-1,Math.floor(f));if(k!==printing.k){printing.k=k;noise(.08,.03,2600,.9);tone(140,.05,.008,'square');}
L=LREST+(LMAX-LREST)*clamp((Math.floor(f)+ease(f-Math.floor(f)))/NR);if(p>=1){L=LMAX;printing=null;queued=false;say('Receipt printed. Tear it off against the bar with T.');lastUI=0;}}
if(L!==lastL){lastL=L;lines=drawStrip(live,L,curl,[1,0,0],false);const ready=L>LREST+1&&!printing;set(paperG,'aria-disabled',!ready);set(paperG,'aria-label',ready?'Tear off the receipt (T)':'Receipt: print it first with P');}
for(let i=falls.length;i--;){const F=falls[i],q=clamp((now-F.t0)/950);fallFrame(F,q);if(q>=1){falls.splice(i,1);noise(.05,.012,900,.8);}}
if(open&&kickAt>=0&&now>=kickAt){kickAt=-1;dv+=red?0:240;tone(2093,.7,.02);tone(2637,.5,.012,'sine',.01);tone(1046,.3,.01,'triangle');}
const tgt=open&&kickAt<0?80:0;
if(red){travel=tgt;dv=0;}else{const k=open?170:110,c=open?15:21;const was=travel;dv+=(k*(tgt-travel)-c*dv)*dt;travel+=dv*dt;if(Math.abs(tgt-travel)<.02&&Math.abs(dv)<.05){travel=tgt;dv=0;}if(!open&&was>.6&&travel<=.6)tone(110,.06,.03,'square');}
if(Math.abs(travel-lastTr)>.01){lastTr=travel;const tr=`translate(${P(0,travel,0).map(v=>v.toFixed(2)).join(' ')})`;set(trayG,'transform',tr);set(drw,'transform',tr);}
for(let i=pulses.length;i--;){const p=pulses[i],q=(now-p.t0)/p.dur;if(q>=1){p.c.style.opacity='';pulses.splice(i,1);continue;}const s=(p.rev?1-q:q)*(p.c.L+9);set(p.c,'stroke-dashoffset',(9-s).toFixed(1));p.c.style.opacity=1;}
const breath=.5+.5*Math.sin(now/420),ready=L>LREST+1&&!printing;
lit(LED.pwr,'g');lit(LED.paper,ready?'a':'');lit(LED.err,now<errUntil?'r':'');lit(chg,'g');
set(ring,'class',printing||queued?'ring on':'ring');ring.style.opacity=printing?1:queued?(red?1:.35+.65*breath).toFixed(2):'';
head.style.opacity=printing?(red?.8:.55+.45*Math.random()).toFixed(2):0;
const reading=tap&&!tap.ok,done=paid&&!reading;if(tap&&!red){const t=(now-tap.t0)/2100;tapGlow.style.opacity=(clamp((t-.24)/.08)*clamp((.78-t)/.08)*(.55+.25*Math.sin(now/60))).toFixed(2);set(tapGlow,'class',tap.ok?'halo ok':'halo');}else tapGlow.style.opacity=0;
RL.forEach((l,i)=>{if(!tap)lit(l,i===0&&!paid&&(red||Math.floor(now/900)%3===0)?'g':'');});if(tap&&!red){const t=(now-tap.t0)/2100;RL.forEach((l,i)=>lit(l,t>.33+i*.07&&t<.95?'g':''));}
scr.classList.toggle('ok',done);set(sOk,'visibility',done?'visible':'hidden');set(sIcon,'visibility',done?'hidden':'visible');sIcon.style.opacity=reading||red?1:(.35+.65*breath).toFixed(2);
const top=reading?'READING':done?(queued||ready||printing?'APPROVED':'THANK YOU'):'TAP CARD';if(sTop.textContent!==top)sTop.textContent=top;
if(!lastUI||now-lastUI>140){lastUI=now;
const r=`€18.40 · ${pad(lines,2)}/${NR} lines`;if(readout.textContent!==r)readout.textContent=r;
const dr=open?(kickAt>=0||Math.abs(80-travel)>1.5?'OPENING':'OPEN'):travel>.5?'CLOSING':'CLOSED';
const ph=printing?`PRINT ${pad(lines,2)}/${NR}`:tap?(tap.ok?'APPROVED':'CARD READING'):falls.length?'TEARING':ready?'TEAR / T':queued?'PAID · PRINT / P':paid?`PAID ${pad(auth,4)}`:'READY';
const st=notice&&now<noticeUntil?notice:`${ph} · DRAWER ${dr}`;if(stateLabel.textContent!==st)stateLabel.textContent=st;}
requestAnimationFrame(tick);
}
poseCard(0,0);requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['c', 'p', 't', 'd'], draw }
