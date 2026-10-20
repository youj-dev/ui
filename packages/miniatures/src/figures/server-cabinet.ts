// @ts-nocheck
/* NORDLYS C–17 · Server cabinet. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--unit:#d2d2ce;--off:#b3b3af;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--smoke:#2e2e2e;--smoke-a:.12;--c1:#7088ec;--c2:#3eaea3;--c3:#f4f4f0;--cord:#3c3c3a;--fiber:#ddcb86;--core:#fff;--live:0}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--unit:#b1b1ae;--off:#969694;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--smoke:#252525;--smoke-a:.22;--c1:#5d72c7;--c2:#339289;--c3:#cececb;--cord:#313130;--fiber:#baab70;--core:#fff;--live:.25;--line:#444443}:root:not(.night) svg{--ink:#282828;--muted:#6b6b6b}}
:root.night{--bg:#050505;--ink:#cfcfcf;--muted:#5c5c5c;--top:#151515;--body:#101010;--side:#0c0c0c;--base:#0a0a0a;--recess:#070707;--glass:#050505;--line:#242424;--rule:#1a1a1a;--unit:#0d0d0d;--off:#131313;--accent:#6f87ff;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--smoke:#000;--smoke-a:.18;--c1:#141a30;--c2:#0f2b28;--c3:#191919;--cord:#090909;--fiber:#1e190a;--live:.12}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.unit{fill:var(--unit)}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.lens{fill:var(--glass)}.fy{fill:var(--fiber)}.fa{fill:var(--c2)}.fg{fill:var(--c3)}.void{fill:var(--recess);stroke:none}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.end{text-anchor:end}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.control{cursor:pointer;outline:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
.cu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.cb{fill:none;stroke-linecap:round;stroke-linejoin:round}.c1{stroke:var(--c1)}.c2{stroke:var(--c2)}.c3{stroke:var(--c3)}.cd{stroke:var(--cord)}.cf{stroke:var(--fiber)}.cl{fill:none;stroke:var(--accent);stroke-linecap:round;opacity:0;transition:opacity .5s}.cl.live{opacity:var(--live)}
:root:not(.night) .inside{--unit:#343434;--top:#4f4f4f;--side:#2b2b2b;--base:#262626;--recess:#181818;--glass:#0f0f0f;--line:#7d7d7d;--muted:#8a8a8a;--off:#2b2b2b;--cord:#101010;--live:.22}
.cu,.cb,.cl,.pl,.pane,.sheen,.fx,.hx,.fing,.beam,.blur{pointer-events:none}
.pt{fill:none;stroke:var(--accent);stroke-width:2.1;stroke-linecap:round;opacity:.5}.pc{fill:none;stroke:var(--core);stroke-width:.85;stroke-linecap:round}.rr .pt,.rr .pc{stroke:var(--warn)}.amb .pt{opacity:.22}.amb .pc{opacity:.6}.night .pt{opacity:.7;stroke-width:2.6}.night .sheen{opacity:.035}
.led>.core{fill:var(--off)}.led>.halo{opacity:0;filter:url(#soft)}.on>.core{fill:var(--c)}.on>.halo{fill:var(--c);opacity:.55}.night .on>.halo{opacity:1}.night .on>circle.halo{transform:scale(1.6);transform-box:fill-box;transform-origin:center}.night .label{fill:var(--line)}.g{--c:var(--ok)}.b{--c:var(--accent)}.a{--c:var(--warn)}.r{--c:var(--fault)}
.on .lens{fill:var(--c)}.beam{fill:var(--c,transparent);opacity:0;filter:url(#bloom)}.on .beam{opacity:.3}.on.r .beam{opacity:.55}.night .on .beam{opacity:.5}.night .on.r .beam{opacity:.95}
.pane{fill:var(--smoke);fill-opacity:var(--smoke-a)}.night .pane{fill:var(--accent);fill-opacity:.045}.sheen{fill:#fff;opacity:.1}
.mw{fill:none;stroke:var(--line);stroke-width:.35}.mesh{fill:url(#mesh);stroke:none}.trail{fill:none;stroke:var(--line);stroke-width:.8;stroke-linecap:round}
.blade{fill:var(--top);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.blur{fill:var(--line);opacity:0}
.scr{fill:var(--accent);font:4px ui-monospace,monospace;letter-spacing:.2px;stroke:none}.scr.hot{fill:var(--warn)}.pdu{font-size:3.3px}.halo-s{fill:var(--accent);opacity:.1;filter:url(#bloom)}.night .halo-s{opacity:.45}
.fx{fill:var(--fault);opacity:0}.hx{fill:url(#heat);opacity:0}.pool{opacity:0}
.fade,.fade *{transition:fill .9s,stroke .9s,background-color .9s,color .9s,border-color .9s!important}
@media(prefers-reduced-motion:reduce){.cl.live{opacity:.9}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}:root.night .stage-floor,:root.night .stage-contact,:root.night .stage-pool{display:none}}`

const defs = `<pattern id="mesh" width="10" height="4" patternUnits="userSpaceOnUse"><path d="M0,0V4H10" class="mw"/></pattern>
<radialGradient id="poolB"><stop offset="0" style="stop-color:var(--accent);stop-opacity:.55"/><stop offset="1" style="stop-color:var(--accent);stop-opacity:0"/></radialGradient>
<radialGradient id="poolR"><stop offset="0" style="stop-color:var(--fault);stop-opacity:.5"/><stop offset="1" style="stop-color:var(--fault);stop-opacity:0"/></radialGradient>
<radialGradient id="heat"><stop offset="0" style="stop-color:var(--warn);stop-opacity:.85"/><stop offset=".55" style="stop-color:var(--fault);stop-opacity:.35"/><stop offset="1" style="stop-color:var(--fault);stop-opacity:0"/></radialGradient>
<clipPath id="gclip"><rect x="6" y="5" width="136" height="158" rx="1"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* World coordinates: x lower-right; y lower-left; z up.
Part x y z w d h
feet ×4 12/134 10/106 0 r3.6 – 4.5
plinth 3 3 4 144 114 10
cabinet 0 0 14 150 120 190
header (front) 0 120 188 150 0 16
opening 6 120 22 138 0 166
back wall (clipped) -40 92 -20 190 0 220
rails 15/116 108 22 5 5 166
cable channel 6 108 24 9 4 160
blank 1U 20 110 28 96 4 8.4
storage 2U 20 110 37 96 4 17.4
node 6 1U 20 110 55 96 4 8.4
node 5 GPU 3U 20 110 64 96 4 26.4
node 4 2U 20 110 91 96 4 17.4
node 3 2U 20 110 109 96 4 17.4
node 2 1U 20 110 127 96 4 8.4
node 1 1U 20 110 136 96 4 8.4
cable manager 1U 20 110 145 96 4 8.4
switch 1U 20 110 154 96 4 8.4
patch panel 1U 20 110 163 96 4 8.4
ears 15/116 114.3 z 5 0 h
PDU 125 112 28 10 4 150
node cables 7.8–56 114–117.3 51–156 – – –
patch loops 29.8–60.6 114 160 0 5.6 7
door 1 120 16 148 2.5 171 (hinge at x 1, opens to 100°)
hinges 0.6 121.6 30/96/162 r1.5 – 8
beacon 16 106 204 r4.4 – 8.6
tray posts 26/124 52 204 3 4 15
tray -36 40 222 274 32 8
uplink fiber 100 100 204 → 238 66 223
Seams, screws, LEDs and labels share their parent face. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: LEDs, rounded cable routes, pulses.
const draw=root,defs=svg.querySelector('defs'),reduced=matchMedia('(prefers-reduced-motion: reduce)'),darkMQ=matchMedia('(prefers-color-scheme: dark)');
let now=performance.now();
const into=g=>root=g;
function led(g,x,y,r=.7,w=0){
const l=el('g',{class:'led'},g);
if(w){rect(l,x-w/2-.8,y-r*1.4,w+1.6,r*2.8,r,'halo');rect(l,x-w/2,y-r/2,w,r,.3,'core');}
else{circle(l,x,y,r*2.5,'halo');circle(l,x,y,r,'core');}
l.k='';l.f=0;l.base='led';return l;
}
function lit(l,c){if(now<l.f)c=l.fc;if(l.k!==c){l.k=c;set(l,'class',l.base+(c?' on '+c:''));}}
function flash(l,c,ms){l.f=now+ms;l.fc=c;lit(l,c);}
function op(n,v){v=Math.round(v*100)/100;if(n._o!==v){n._o=v;n.style.opacity=v;}}
function route(pts,r=2){
let d='M'+P(...pts[0]);
for(let i=1;i<pts.length-1;i++){
const a=pts[i-1],b=pts[i],c=pts[i+1],la=Math.hypot(...b.map((v,j)=>v-a[j])),lc=Math.hypot(...c.map((v,j)=>v-b[j]));
const p=b.map((v,j)=>v+(a[j]-v)*Math.min(r,la/2)/la),q=b.map((v,j)=>v+(c[j]-v)*Math.min(r,lc/2)/lc);
d+='L'+P(...p)+'Q'+P(...b)+' '+P(...q);
}
return d+'L'+P(...pts[pts.length-1]);
}
function cable(d,cls,w,parent=root){
el('path',{d,class:'cu','stroke-width':w+.9},parent);
const c=el('path',{d,class:'cb '+cls,'stroke-width':w},parent);
c.d=d;c.v=el('path',{d,class:'cl','stroke-width':w*.42},parent);c.len=c.getTotalLength();return c;
}
const live=[],pool=[],ev=[];
const later=(ms,fn)=>ev.push([now+ms,fn]);
function spawn(c,layer,v,rev,cls,done,tail=14,core=4){
if(reduced.matches||live.length>110)return;
let p=pool.pop();
if(!p){p=el('g',{},layer);p.a=el('path',{class:'pt'},p);p.b=el('path',{class:'pc'},p);}else{layer.appendChild(p);p.style.display='';}
set(p,'class','pl '+cls);
for(const[e,n]of[[p.a,tail],[p.b,core]]){set(e,'d',c.d);set(e,'stroke-dasharray',n+' '+(c.len+40));}
const q={p,L:c.len,s:rev?c.len:0,v:rev?-v:v,done,tail,core,hit:0};live.push(q);move(q);
}
function move(q){
if(q.v>0){set(q.p.a,'stroke-dashoffset',q.tail-q.s);set(q.p.b,'stroke-dashoffset',q.core-q.s);}
else{set(q.p.a,'stroke-dashoffset',-q.s);set(q.p.b,'stroke-dashoffset',-q.s);}
}
// Assembly: back to front.
const sh=P(75,60,0);el('ellipse',{cx:sh[0],cy:sh[1]+6,rx:156,ry:54,class:'shadow stage-floor'});el('ellipse',{cx:sh[0],cy:sh[1]+6,rx:156,ry:54,class:'stage-contact'});
const fl=group(TOP(-25,120,0));
const poolB=el('ellipse',{cx:100,cy:10,rx:94,ry:19,fill:'url(#poolB)',class:'pool'},fl),poolR=el('ellipse',{cx:100,cy:10,rx:94,ry:19,fill:'url(#poolR)',class:'pool'},fl);
for(const[x,y]of[[12,10],[134,10],[12,106],[134,106]])cylinder(x,y,0,3.6,4.5,'z','recess');
box(3,3,4,144,114,10,2,'base');slits(group(FRONT(3,117,14)),12,3,120,4,26);slits(group(SIDE(147,117,14)),10,3,94,4,20);
box(0,0,14,150,120,190,3);
const sp=group(SIDE(150,120,204));
for(const u of[4,62]){rect(sp,u,4,54,182,2,'face side');rect(sp,u+17,14,20,5,2.5,'face recess');circle(sp,u+27,25,1.5,'face top');line(sp,u+27,24,u+27,26);slits(sp,u+9,164,36,10,10);}
const roof=group(TOP(0,0,204));
rect(roof,6,6,138,108,3,'detail');slits(roof,16,12,64,22,16);rect(roof,90,95,20,9,4.5,'face recess');
for(let i=0;i<8;i++)line(roof,93+i*2,96.5,93+i*2,102.5);
for(const[x,y]of[[10,10],[140,10],[140,110]]){circle(roof,x,y,2.4,'face recess');circle(roof,x,y,1,'face top');}
const fr=group(FRONT(0,120,204));
text(fr,8,10.4,'NORDLYS','label brand');slits(fr,48,5,30,6,10);rect(fr,6,16,138,166,1.5,'detail');
const lc=group('',fr,{class:'control',role:'button',tabindex:'0'});
rect(lc,82,2.4,60,11.2,3,'focus-ring');rect(lc,84,3.4,56,9.2,2,'face recess');rect(lc,86,4.6,52,6.8,1.5,'halo-s');rect(lc,86,4.6,52,6.8,1.5,'face glass');
const oA=text(lc,88,9.6,'','scr'),oB=text(lc,136,9.6,'','scr end'),oSeg=[0,1,2,3].map(i=>led(lc,103+i*4.4,8,.9,3.4));
// Interior, clipped to the door opening; equipment sits 6 behind the frame.
const cp=el('clipPath',{id:'open'},defs);
el('polygon',{points:[[6,120,188],[144,120,188],[144,120,22],[6,120,22]].map(p=>P(...p)).join(' ')},cp);
into(el('g',{'clip-path':'url(#open)',class:'inside'},draw));
rect(group(FRONT(-40,92,200)),0,0,190,220,0,'void');
rect(group(SIDE(6,120,188)),0,0,28,166,0,'face base');
rect(group(TOP(6,92,22)),0,0,138,28,0,'face base');
for(const x of[15,116]){box(x,108,22,5,5,166,.6,'base');const g=group(FRONT(x,113,188));for(const v of[2,5,8,11,14,158,161])rect(g,1.7,v,1.6,1.6,.3,'face recess');}
box(6,108,24,9,4,160,1,'base');
const ch=group(FRONT(6,112,184));for(let v=4;v<158;v+=7)rect(ch,3,v,3,3.5,.8,'face recess');
function unit(z,h,n){
box(20,110,z,96,4,h,.8,'unit');
for(const x of[15,116]){const e=group(FRONT(x,114.3,z+h));rect(e,0,0,5,h,.8,'face unit');screw(e,2.5,2.3);if(n&&x<20)text(e,2.5,h-1.2,'0'+n,'etch micro center');}
return group(FRONT(20,114,z+h));
}
const nicPort=g=>{rect(g,1.6,1.6,4.6,3.6,.6,'face recess');line(g,2.6,2.6,5.2,2.6);};
slits(unit(28,8.4),6,2,84,4.4,30);
const stg=unit(37,17.4);nicPort(stg);
const ST={n:7,next:0,nic:led(stg,7.6,2.2,.5)},stS=[led(stg,10.6,3.4,.6),led(stg,14,3.4,.6)],bays=[];
slits(stg,2,8,15,7,6);
for(let i=0;i<22;i++){const x=21+i*3.36;rect(stg,x,1.2,2.9,15,.6,'face recess');line(stg,x+1.45,11.5,x+1.45,15);bays.push(led(stg,x+1.45,2.8,.42));}
const SV=[[1,1,136,'flat',.16,.42,3.2,'1U compute'],[2,1,127,'grille',.16,.42,3.2,'1U compute'],[3,2,109,'bays',.24,.68,5,'2U compute with drive bays'],[4,2,91,'bezel',.24,.68,5,'2U compute'],[5,3,64,'gpu',.42,2.1,9.6,'3U GPU node'],[6,1,55,'edge',.16,.42,3.2,'1U edge node']].map(([n,u,z,k,i,m,g,desc])=>({n,u,z,k,i,m,g,desc,h:u*9-.6,st:'off',t:0,next:0,le:0,fan:0,ang:0}));
const G=SV[4];
function server(s){
const h=s.h,g=unit(s.z,h,s.n);s.el=g;set(g,'class','control');set(g,'role','button');set(g,'tabindex','0');
nicPort(g);s.nic=led(g,7.6,2.2,.5);
s.pb=circle(g,11.4,3.4,1.9,'face top');el('path',{d:'M10.6,2.7a1.1,1.1 0 1 0 1.6,0M11.4,2.2v1.3',class:'detail'},g);
s.stL=led(g,15.3,3.4,.6);
const k=s.k;
if(k==='flat'){slits(g,21,1.3,30,4.4,11);for(let i=0;i<4;i++){rect(g,54+i*10,1.2,9.4,4.6,.8,'face recess');line(g,56+i*10,3.5,61.4+i*10,3.5);}}
else if(k==='grille'){rect(g,21,1.2,73,4.6,2.2,'face recess');slits(g,23,1.9,69,3.2,30);}
else if(k==='edge'){slits(g,21,1.3,46,4.4,17);rect(g,70,1.4,24,4.2,1,'face top');line(g,73,3.5,91,3.5);}
else if(k==='bays'){for(let r=0;r<2;r++)for(let c=0;c<7;c++){const x=21+c*10.5,y=1.2+r*6.9;rect(g,x,y,9.9,6.3,.9,'face recess');line(g,x+2,y+3.15,x+7.9,y+3.15);}}
else if(k==='bezel'){rect(g,20.6,1,73.6,13,3,'face top');rect(g,24,2.6,66.8,9.8,2,'face recess');slits(g,26,3.6,63,7.8,24);}
else{
rect(g,1.4,7.6,16.4,7.4,1.4,'face recess');rect(g,2.2,8.4,14.8,5.8,.9,'halo-s');rect(g,2.2,8.4,14.8,5.8,.9,'face glass');s.tx=text(g,9.6,12.7,'','scr center');
text(g,9.6,18.4,'GX–8','etch center');slits(g,2,19.8,15.6,3.4,6);s.rot=[];s.blr=[];
for(let j=0;j<3;j++){
const f=group(`translate(${34+j*24} 12)`,g);circle(f,0,0,10.8,'face recess');const r=group('',f);
for(let b=0;b<7;b++)el('path',{d:'M0,-2.4C3.4,-3.6 6,-5.6 4.4,-9.4C2,-9 .3,-6 0,-2.4Z',class:'blade',transform:`rotate(${b*360/7})`},r);
s.rot.push(r);s.blr.push(circle(f,0,0,9.6,'blur'));for(const q of[10.2,7,3.8])circle(f,0,0,q,'detail');line(f,-10.2,0,10.2,0);line(f,0,-10.2,0,10.2);circle(f,0,0,2.2,'face top');
}
}
s.strip=[];for(let i=0;i<14;i++)s.strip.push(led(g,23.6+i*5.2,h-1.35,1,4.4));
s.hx=rect(g,0,0,96,h,.8,'hx');s.fx=rect(g,0,0,96,h,.8,'fx');rect(g,-1.4,-1.4,98.8,h+2.8,1.6,'focus-ring');
bind(g,()=>power(s.n));
}
for(const s of[...SV].reverse())server(s);
const mg=unit(145,8.4);rect(mg,2,1.2,92,6,1.5,'face recess');
const sw=unit(154,8.4),swT=[],swB=[],sfp=[];
for(let r=0;r<2;r++)for(let c=0;c<12;c++){const x=8+c*4.4,y=.9+r*3.7;rect(sw,x,y,3.6,2.8,.4,'face recess');(r?swB:swT).push(led(sw,x+(r?2.5:1.1),y+(r?2.2:.6),.5,1.3));}
for(let r=0;r<2;r++){rect(sw,62,.9+r*3.7,6,2.8,.4,'face recess');sfp.push(led(sw,69.6,2.3+r*3.7,.5));}
const sys=[0,1,2].map(i=>led(sw,74.4+i*3,2.4,.55));slits(sw,73,4.6,21,2.8,10);text(sw,4,5.6,'SW','etch center');
const pp=unit(163,8.4);rect(pp,6,.6,90,1.4,.3,'face top');
for(let c=0;c<20;c++){const x=8+c*4.4;rect(pp,x,2.6,3.6,3.6,.6,'face recess');line(pp,x+.9,3.5,x+2.7,3.5);}
box(125,112,28,10,4,150,1.5,'base');
const pd=group(FRONT(125,116,178));
rect(pd,1,2.4,8,7,1,'face recess');rect(pd,1.6,3,6.8,5.8,.8,'halo-s');rect(pd,1.6,3,6.8,5.8,.8,'face glass');
const pdT=text(pd,5,7.1,'','scr center pdu');rect(pd,2.6,11.2,4.8,4,1,'face top');line(pd,5,12.2,5,14.2);
const outs={},OZ=[['sw',158.2],[1,140.2],[2,131.2],[3,117.7],[4,99.7],[5,77.2],[6,59.2],['st',45.7]];
for(const[id,zc]of OZ){const v=178-zc;rect(pd,1.2,v-2.3,5.6,4.6,1.2,'face recess');line(pd,2.6,v-.6,2.6,v+.6);line(pd,5.4,v-.6,5.4,v+.6);outs[id]=led(pd,8.3,v,.55);}
for(const[,zc]of OZ)cable(route([[128,116,zc],[128,118.6,zc-.4],[123,118.6,zc-1.4],[121.4,115,zc-1.6]],1.4),'cd',1);
// Node cables: nested L routes up the channel, along the manager, into switch ports 6…0.
for(let k=0;k<7;k++){
const s=SV[k]||ST,top=s===ST?54.4:s.z+s.h,zn=top-3.4,y=116.4+(k%2)*.9,xl=15-k*1.2,zr=146.4+k*1.05,xp=29.8+(6-k)*4.4;
s.cab=cable(route([[23.9,114,zn],[23.9,y,zn],[xl,y,zn],[xl,y,zr],[xp,y,zr],[xp,y,156.4],[xp,114,156.4]],2),k===6?'c3':k===4?'c2':'c1',1.5);
}
const LA=el('g',{});
const fg=group(FRONT(20,119.4,153.6));for(let i=0;i<12;i++)rect(fg,3+i*8,.6,2.4,7.4,1,'face base fing');
for(const z of[46,76,106,136])rect(group(FRONT(5,119.6,z)),0,0,11.4,1.8,.9,'face top fing');
const LP=['c1','c3','c2','c1','c3'],loops=LP.map((c,j)=>{const x=60.6+j*4.4;return cable(`M${P(x,114,160)}C${P(x,119.6,159.2)} ${P(x,119.6,168)} ${P(x,114,167)}`,c,1.3);});
const LB=el('g',{});
into(draw);
// Door: two leaf surfaces 2.5 apart, swung about the hinge line at x 1.
const doorG=el('g',{}),dI=el('g',{},doorG),dO=el('g',{},doorG);
const DF='M2,0H146Q148,0 148,2V169Q148,171 146,171H2Q0,171 0,169V2Q0,0 2,0ZM6,5V163H142V5Z';
el('path',{d:DF,class:'face side','fill-rule':'evenodd'},dI);
const dFace=el('path',{d:DF,class:'face','fill-rule':'evenodd'},dO);
rect(dO,6,5,136,158,1,'pane');el('path',{d:'M44,5h24L28,163H4ZM78,5h7L45,163h-7Z',class:'sheen','clip-path':'url(#gclip)'},dO);rect(dO,6.6,5.6,134.8,156.8,.8,'detail');
const dh=group('',dO,{class:'control',role:'button',tabindex:'0'});
rect(dh,140.4,66,7.2,40,2.6,'focus-ring');rect(dh,142.4,70,3.6,30,1.8,'face recess');rect(dh,143.1,73,2.2,18,1.1,'face top');circle(dh,144.2,96.6,.8,'detail');
for(const z of[30,96,162])cylinder(.6,121.6,z,1.5,8,'z','base');
function doorDraw(a){
const r=a*Math.PI/180,c=Math.cos(r),s=Math.sin(r),m=t=>{const o=P(1-t*s,120+t*c,187);return`matrix(${(c-s)*C} ${(c+s)*S} 0 1 ${o[0]} ${o[1]})`;};
set(dI,'transform',m(0));set(dO,'transform',m(2.5));
const back=a>45;if(doorG.back!==back){doorG.back=back;doorG.appendChild(back?dI:dO);}
}
doorDraw(0);
// Roof: alarm beacon, tray posts, wire basket tray with fiber bundles cut in section.
const bc=into(el('g',{class:'beacon'},draw));bc.base='beacon';bc.k='';bc.f=0;
cylinder(16,106,204,4.4,2.2,'z','base');cylinder(16,106,206.2,3.3,5.6,'z','lens');ellipse(16,106,211.8,3.7,'z','face top');
const bp=P(16,106,209);el('circle',{cx:bp[0],cy:bp[1],r:13,class:'beam'});
into(draw);
for(const x of[26,124]){box(x,52,204,3,4,9,.5,'base');box(x-1,37,213,5,38,3,.5,'base');}
const TX0=-14,TX1=214,TL=TX1-TX0;
const tf=group(FRONT(TX0,40,224));rect(tf,0,0,TL,8,0,'mesh');line(tf,0,0,TL,0,'trail');
const tb=group(TOP(TX0,40,216));rect(tb,0,0,TL,32,0,'mesh');line(tb,0,0,TL,0,'trail');line(tb,0,32,TL,32,'trail');
const bund=[[47,2.8,'cf'],[54,3.2,'c3'],[60,2.2,'c2']].map(([y,w,c])=>cable(poly([[TX0,y,216+w/2],[TX1,y,216+w/2]]),c,w));
const up=cable(route([[100,100,204],[100,100,216],[100,88,228],[100,77,228],[100,70,222],[100,66,218],[108,66,217],[TX1,66,217]],5),'c2',1.8);
const LC=el('g',{});
const tn=group(FRONT(TX0,72,224));rect(tn,0,0,TL,8,0,'mesh');line(tn,0,0,TL,0,'trail');line(tn,0,8,TL,8,'trail');for(let x=0;x<=TL;x+=24)line(tn,x,0,x,8,'trail');
const te=group(SIDE(TX1,72,224));el('path',{d:'M0,0V8H32V0',class:'trail'},te);
const ends=[[25,6.6,1.4,'fy'],[18,6.4,1.6,'fg'],[12,6.9,1.1,'fa'],[6,7,.9,'fa']].map(([u,v,r,c])=>{circle(te,u,v,r,'face '+c);return r<1?[led(te,u,v,.9)]:[0,1,2].map(i=>led(te,u+Math.cos(i*2.1+.4)*r*.45,v+Math.sin(i*2.1+.4)*r*.45,.32));});
frame([[0,0,0,150,120,214],[TX0,40,216,TL,32,8]],22);
// State: loads, nodes, door, lights; audio only after a gesture.
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const LOADS=[.15,.45,.75,.95];
let li=1,lv=.45,night=false,nk=0,doorOpen=false,da=0,dv=0,dl=-1,fover=0,lastC=0,tC=25.5,tG=56,gbs=9,cI=0,lastUI=-1,lastLed=-1,lastAmb=0,lastRe=0,msg='',msgT=0,ac,hum;
for(const n of[1,3,5,6])SV[n-1].st='on';G.fan=.56;
function audio(){
try{
const A=window.AudioContext||window.webkitAudioContext;if(!A)return;
if(!ac){ac=new A();const b=ac.createBuffer(1,ac.sampleRate,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;
const n=ac.createBufferSource(),f=ac.createBiquadFilter();n.buffer=b;n.loop=true;f.type='lowpass';f.frequency.value=420;hum=ac.createGain();hum.gain.value=0;n.connect(f);f.connect(hum);hum.connect(ac.destination);n.start();}
if(ac.state==='suspended')ac.resume().catch(()=>{});
}catch(_){}
}
function chirp(){if(!ac)return;for(const d of[0,.16]){const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+d;o.frequency.value=1320;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.02,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+.11);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.12);}}
function say(m){announcement.textContent=m;}
function note(s,m){msg=s;msgT=now+1800;say(m);lastUI=-1;}
const stName=s=>({on:'online',boot:'booting',fault:'failed',off:'off'})[s.st];
function sync(){
for(const s of SV){set(s.el,'aria-pressed',s.st!=='off');set(s.el,'aria-label',`Node ${s.n}, ${s.desc}, ${stName(s)}. Toggle power (${s.n})`);}
set(lc,'aria-label',`Workload ${Math.round(LOADS[li]*100)} percent. Raise workload (L)`);
set(dh,'aria-pressed',doorOpen);set(dh,'aria-label',(doorOpen?'Close':'Open')+' the door (D)');
set(keys.d,'aria-pressed',doorOpen);set(keys.n,'aria-pressed',night);
for(const s of SV)if(s.cab)set(s.cab.v,'class',s.st==='on'?'cl live':'cl');set(up.v,'class',SV.some(s=>s.st==='on')?'cl live':'cl');
lastUI=-1;
}
function boot(s){s.st=reduced.matches?'on':'boot';s.t=now;s.next=now+2100;}
function power(n){
const s=SV[n-1];audio();set(s.pb,'class','face recess');later(160,()=>set(s.pb,'class','face top'));
if(s.st==='off'){boot(s);say(s.st==='on'?`Node ${n} online.`:`Node ${n} powering on. Self-test running.`);}
else{s.st='off';say(`Node ${n} powered off.`);}
sync();
}
function setLoad(d){audio();li=(li+d+4)%4;say(`Workload ${Math.round(LOADS[li]*100)} percent.`);sync();}
function fail(){
audio();const a=SV.filter(s=>s.st==='on');
if(!a.length){note('NO NODE ONLINE','No online node to fail. Power one on with 1 to 6.');return;}
const s=a[Math.random()*a.length|0],jf=7-s.n;s.st='fault';s.t=now;fover=now+3400;
if(!reduced.matches)for(let j=0;j<12;j++)later(Math.abs(j-jf)*45,()=>{flash(swB[j],'a',120);flash(swT[j],'a',120);});
chirp();say(`Node ${s.n} failed. Traffic rerouted to ${a.length-1} node${a.length===2?'':'s'}. Press R to recover.`);sync();
}
function recover(){
audio();const f=SV.filter(s=>s.st==='fault');
if(!f.length){note('ALL NODES HEALTHY','No failed nodes.');return;}
f.forEach(boot);say(`Recovering node ${f.map(s=>s.n).join(', ')}.`);sync();
}
function door(){audio();doorOpen=!doorOpen;say(doorOpen?'Door open.':'Door closed.');sync();}
function lights(){
audio();night=!night;const h=document.documentElement;
if(!reduced.matches){h.classList.add('fade');clearTimeout(lights.t);lights.t=setTimeout(()=>h.classList.remove('fade'),1000);}
h.classList.toggle('night',night);say(night?'Lights out.':'Lights on.');sync();
}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
const act={l:()=>setLoad(1),f:fail,r:recover,d:door,n:lights},keys={};
document.querySelectorAll('[data-k]').forEach(b=>{keys[b.dataset.k]=b;b.addEventListener('click',()=>act[b.dataset.k]());});
bind(lc,()=>setLoad(1));bind(dh,door);dFace.addEventListener('click',door);bc.addEventListener('click',recover);
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.repeat)return;
const k=e.key.toLowerCase();
if(/^[1-6]$/.test(k)){e.preventDefault();power(+k);}
else if(act[k]){e.preventDefault();k==='l'&&e.shiftKey?setLoad(-1):act[k]();}
});
// Packets: node → switch port → patch loop → (behind the header) → roof fiber → tray end.
function toSwitch(j){flash(swB[j],'b',90);flash(swT[7+j%5],'b',90);spawn(loops[j%5],LB,70,0,'',toPanel,6,2.5);}
function toPanel(){if(now-lastC>55){lastC=now;later(150,()=>{flash(sfp[cI++%2],'b',90);spawn(up,LC,200,0,'',()=>ends[3].forEach(l=>flash(l,'b',160)));});}}
function leds(t,red,nF){
const bk=Math.floor(t/260)%2,anyOn=SV.some(s=>s.st==='on'),act=.03+.55*lv*(anyOn?1:.2);
for(const s of SV){
const e=(t-s.t)/1000,st=s.st,n=st==='on'?Math.round(s.le*14+(red?0:Math.random()*1.2-.6)):0;
lit(s.stL,st==='on'?'g':st==='boot'?'a':st==='fault'&&(bk||red)?'r':'');
lit(s.nic,st==='on'||st==='boot'&&e>1.5?'g':'');
s.strip.forEach((l,i)=>lit(l,st==='on'?(i<n?(i>11?'a':'b'):''):st==='boot'?(e<1.1?(Math.abs(e-.12-i*.068)<.1?'a':''):e<1.5?(e>1.1+i*.026?'b':''):'g'):st==='fault'?'r':''));
lit(outs[s.n],st==='on'?'g':st==='off'?'':'a');lit(swB[7-s.n],st==='on'?'g':'');
}
for(const j of[0,9,10])lit(swB[j],'g');swT.forEach((l,j)=>lit(l,j>6?'g':''));sfp.forEach(l=>lit(l,'g'));
sys.forEach((l,i)=>lit(l,i===2&&nF?'a':'g'));stS.forEach(l=>lit(l,'g'));lit(ST.nic,'g');lit(outs.sw,'g');lit(outs.st,'g');
bays.forEach((l,i)=>lit(l,red?(i<act*22?'b':''):Math.random()<act?'b':''));
lit(bc,nF?(bk||red?'r':''):'g');oSeg.forEach((l,i)=>lit(l,i<=li?'b':''));ends.flat().forEach(l=>lit(l,''));
}
function ui(on,kw,nF,booting){
const r=`${on}/6 ONLINE · ${kw.toFixed(1)} kW · ${Math.round(tC)}°C · ${gbs.toFixed(1)} Gb/s`;if(readout.textContent!==r)readout.textContent=r;
const f=SV.find(s=>s.st==='fault');
stateLabel.textContent=now<msgT?msg:f?`FAULT · NODE ${f.n} · ${on?'TRAFFIC REROUTED':'NO CAPACITY'}`:booting?`POST · NODE ${booting.n}`:`LOAD ${Math.round(LOADS[li]*100)}% · DOOR ${doorOpen?'OPEN':'CLOSED'}${night?' · LIGHTS OUT':''}`;
oA.textContent=`${on}/6`;oB.textContent=gbs.toFixed(1)+'G';pdT.textContent=kw.toFixed(1);G.tx.textContent=Math.round(tG)+'°';set(G.tx,'class',tG>76?'scr center hot':'scr center');
if(hum)hum.gain.setTargetAtTime(on?.0015+.006*G.fan:0,ac.currentTime,.3);
}
function tick(t){
const dt=Math.min(.05,Math.max(0,(t-now)/1000)),red=reduced.matches;now=t;
for(let i=ev.length;i--;)if(ev[i][0]<=t){const f=ev[i][1];ev.splice(i,1);f();}
lv+=(LOADS[li]-lv)*(1-Math.exp(-dt/1.2));nk+=(+night-nk)*(1-Math.exp(-dt/.3));
let on=0,nF=0,booting=null;
for(const s of SV){
if(s.st==='boot'&&t-s.t>1900){s.st='on';say(`Node ${s.n} online.`);sync();}
if(s.st==='on')on++;else if(s.st==='fault')nF++;else if(s.st==='boot')booting=s;
}
const share=on?Math.min(1.7,(on+nF)/on):1;let kw=.34,gb=0,hot=null,hp=0;
for(const s of SV){
s.le=s.st==='on'?Math.min(1,lv*share):0;
const p=s.st==='on'?s.i+(s.m-s.i)*s.le:s.st==='boot'?s.i*1.4:s.st==='fault'?s.i*.5:0;kw+=p;gb+=s.g*s.le;
if(s.st==='on'&&p/s.u>hp){hp=p/s.u;hot=s;}
if(s.st==='on'&&!red&&t>=s.next){s.next=t+(500+900*Math.random())/((.5+3.2*s.le)*Math.sqrt(s.g/4));flash(s.nic,'b',70);spawn(s.cab,LA,165,0,'',()=>toSwitch(7-s.n),10,3);}
op(s.fx,s.st==='fault'?(red?.22:.1+.16*(.5+.5*Math.sin(t/1000*7))):0);
}
if(on&&!red&&t>=ST.next){ST.next=t+(400+800*Math.random())/(.4+2*lv);flash(ST.nic,'b',70);spawn(ST.cab,LA,165,0,'',()=>toSwitch(0),10,3);}
if(t<fover&&!red&&t-lastRe>130){lastRe=t;const a=SV.filter(s=>s.st==='on');if(a.length){const s=a[Math.random()*a.length|0];flash(swB[7-s.n],'a',90);spawn(s.cab,LA,120,1,'rr',()=>flash(s.nic,'a',140),10,3);}}
if(!red&&t>lastAmb){lastAmb=t+500+Math.random()*1100;const b=Math.random()<.5?0:1,rev=Math.random()<.5;spawn(bund[b],LC,190,rev,'amb',rev?null:()=>ends[b].forEach(l=>flash(l,'b',150)));}
tC+=(20.4+2.35*kw-tC)*(1-Math.exp(-dt/3.5));tG+=((G.st==='on'?34+50*G.le:G.st==='boot'?40:24)-tG)*(1-Math.exp(-dt/3));gbs+=(gb-gbs)*(1-Math.exp(-dt/.6));
for(const s of SV)op(s.hx,s===hot?Math.max(0,Math.min(1,(tC-26)/6))*.6:0);
const ft=G.st==='boot'?1:G.st==='on'?.2+.8*G.le:G.st==='fault'?.1:0;G.fan+=(ft-G.fan)*(1-Math.exp(-dt/.9));
if(!red){G.ang=(G.ang+G.fan*1400*dt)%360;G.rot.forEach((r,j)=>set(r,'transform',`rotate(${(G.ang+j*40).toFixed(1)})`));}
const bo=Math.max(0,Math.min(1,((red?ft:G.fan)-.45)/.45));G.rot.forEach(r=>op(r,1-bo*.7));G.blr.forEach(b=>op(b,bo*.5));
const dTo=doorOpen?100:0;if(red){da=dTo;dv=0;}else{dv+=(170*(dTo-da)-23*dv)*dt;da+=dv*dt;}
if(Math.abs(da-dl)>.02){dl=da;doorDraw(da);}
for(let i=live.length;i--;){
const q=live[i];q.s+=q.v*dt;
if(!q.hit&&(q.v>0?q.s>=q.L:q.s<=0)){q.hit=1;if(q.done)q.done();}
if(q.v>0?q.s>q.L+q.tail:q.s<-q.tail){q.p.style.display='none';pool.push(q.p);live.splice(i,1);}else move(q);
}
if(red&&live.length){for(const q of live){q.p.style.display='none';pool.push(q.p);}live.length=0;}
op(poolB,(darkMQ.matches?.08:0)*(1-nk)+nk*(.2+.35*Math.min(1,gbs/26)));
op(poolR,nF?nk*(red?.35:Math.floor(t/260)%2?.5:.1):0);
if(t-lastLed>50){lastLed=t;leds(t,red,nF);}
if(lastUI<0||t-lastUI>150){lastUI=t;ui(on,kw,nF,booting);}
requestAnimationFrame(tick);
}
sync();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['l', 'f', 'r', 'd', 'n'], draw }
