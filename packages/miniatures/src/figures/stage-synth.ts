// @ts-nocheck
/* VERMIL ST–73 · Stage keyboard. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--gr:#3a3937;--gr-top:#4b4a47;--gr-side:#2d2c2a;--slot:#252423;--cap:#302f2d;--cap-top:#3e3d3a;--cap-side:#272624;--cap-hi:#52514d;--knob:#1f1f1e;--knob-top:#2b2b2a;--knob-side:#181817;--knob-hi:#3a3a38;--knurl:#4d4d4b;--alu:#cac8c1;--print:#d7d3c9;--red:#e2462f;--wal:#7c5337;--wal-top:#976944;--wal-side:#5f3f2a;--grain:#3a2414;--ivory:#e8e4d9;--ivory-top:#f8f6f0;--ivory-side:#d3cec2;--eb:#1d1d1c;--eb-top:#2a2a29;--eb-side:#151514;--eb-hi:#353534;--felt:#1c1b1a;--oled:#0b0b0b;--oled-ink:#e9f1ee;--off:#262523;--off2:#3b3a37;--c1:#ffa938;--c2:#ffe3b8;--c3:#98dcf3;--db-br:#6b4128;--db-w:#ece8dd;--db-k:#141414;--kc:var(--c2)}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--gr:#2f2e2d;--gr-top:#464542;--gr-side:#1c1c1b;--slot:#1d1d1c;--cap:#272625;--cap-top:#393836;--cap-side:#181817;--cap-hi:#4c4b47;--knob:#181818;--knob-top:#282827;--knob-side:#0d0d0d;--knob-hi:#363634;--knurl:#3f3f3e;--alu:#a9a8a4;--print:#b4b2ab;--red:#be3a26;--wal:#68452d;--wal-top:#8d623f;--wal-side:#412a1b;--grain:#2f1d0f;--ivory:#c3c0b9;--ivory-top:#e8e6e1;--ivory-side:#93918d;--eb:#171716;--eb-top:#272726;--eb-side:#0b0b0b;--eb-hi:#2b2b2a;--felt:#161514;--oled:#070707;--oled-ink:#c6cbc9;--off:#1e1d1c;--off2:#302f2d;--c1:#d78e2e;--c2:#d7bf9b;--c3:#7fb9cd;--db-br:#593520;--db-w:#c6c3bd;--db-k:#0f0f0f;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.center{text-anchor:middle}.end{text-anchor:end}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.gr{fill:var(--gr)}.top.gr{fill:var(--gr-top)}.side.gr{fill:var(--gr-side)}.cap{fill:var(--cap)}.top.cap{fill:var(--cap-top)}.side.cap{fill:var(--cap-side)}.knob{fill:var(--knob)}.top.knob{fill:var(--knob-top)}.side.knob{fill:var(--knob-side)}.wal{fill:var(--wal)}.top.wal{fill:var(--wal-top)}.side.wal{fill:var(--wal-side)}.ivory{fill:var(--ivory)}.top.ivory{fill:var(--ivory-top)}.side.ivory{fill:var(--ivory-side)}.eb{fill:var(--eb)}.top.eb{fill:var(--eb-top)}.side.eb{fill:var(--eb-side)}.slot{fill:var(--slot)}.felt{fill:var(--felt)}.oled{fill:var(--oled)}.alu{fill:var(--alu)}
.brush{fill:url(#brush);stroke:none;pointer-events:none}.grain{fill:none;stroke:var(--grain);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.4}.rule{fill:none;stroke:var(--print);stroke-width:.2;opacity:.42}.pin{fill:var(--red);stroke:none}.knurl{fill:none;stroke:var(--knurl);stroke-width:.28}
.pr{fill:var(--print);font:600 1.4px ui-monospace,monospace;letter-spacing:.2px;stroke:none}.hd{fill:var(--red);font:700 1.75px system-ui,sans-serif;letter-spacing:.5px;stroke:none}.brand{font:700 3.5px system-ui,sans-serif;letter-spacing:1.15px}
.ind{fill:none;stroke:var(--print);stroke-width:.42;stroke-linecap:round}.ind-d{fill:none;stroke:var(--knob);stroke-width:.34;stroke-linecap:round}
.lc{fill:var(--off);stroke:none}.lc.on{filter:url(#lg)}.lc.on.c1{fill:var(--c1)}.lc.on.c2{fill:var(--c2)}.lc.on.c3{fill:var(--c3)}.lc.on.dim{opacity:.36;filter:none}.db{fill:var(--off2)}
.lgd{fill:var(--off);stroke:none}.lgd.rg{fill:var(--kc);opacity:.3;animation:breathe 3.6s ease-in-out infinite alternate}.lgd.on{fill:var(--kc);filter:url(#lg)}
.ol{fill:var(--oled-ink);font:600 2.25px ui-monospace,monospace;letter-spacing:.12px;stroke:none}.ol.s{font-size:1.5px;font-weight:400;opacity:.75}.ob{fill:var(--oled-ink);opacity:.7}.oh{fill:var(--oled-ink);opacity:.05;filter:url(#bloom);pointer-events:none}
.key{cursor:pointer;transition:transform 60ms}.key.on{transform:translate(0,.8px)}.kt{fill:url(#kg);opacity:0;pointer-events:none;transition:opacity .45s}.key.on .kt{opacity:1;transition:opacity 40ms}.kl{fill:none;stroke:var(--line);stroke-width:.4;vector-effect:non-scaling-stroke;opacity:.3}.kshade{fill:url(#ks);stroke:none;pointer-events:none}.ebi{fill:var(--eb-hi);stroke:none}.ebf{fill:var(--eb);stroke:none}.gloss{fill:#fff;opacity:.1;stroke:none}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .top.cap{fill:var(--cap-hi)}.control:hover .top.knob{fill:var(--knob-hi)}
@keyframes breathe{from{opacity:.2}to{opacity:.36}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}.stage-floor{filter:none!important;opacity:1!important}.stage-contact{fill:#000;opacity:.5;filter:url(#bloom);transform:none}}`

const defs = `<filter id="lg" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation=".45" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<pattern id="brush" width="31" height="1.3" patternUnits="userSpaceOnUse"><path d="M0,.15H11M14,.15H31" style="stroke:#fff;stroke-opacity:.06;stroke-width:.14"/><path d="M3,.5H24M27,.5H31" style="stroke:#000;stroke-opacity:.1;stroke-width:.12"/><path d="M0,.85H6M9,.85H31" style="stroke:#fff;stroke-opacity:.04;stroke-width:.12"/><path d="M0,1.15H18M21,1.15H29" style="stroke:#000;stroke-opacity:.07;stroke-width:.1"/></pattern>
<linearGradient id="kg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" style="stop-color:var(--kc);stop-opacity:.55"/><stop offset=".55" style="stop-color:var(--kc);stop-opacity:.16"/><stop offset="1" style="stop-color:var(--kc);stop-opacity:0"/></linearGradient>
<linearGradient id="ks" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".24"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`

// The lab's `env` is its synth envelope; keep it verbatim by naming the adapter separately.
function draw(figureEnv: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=figureEnv;
/* VERMIL ST–73 stage keyboard. World: x lower-right; y lower-left (the keys face +y); z up. 1 unit = 5 mm.
Part x y z w d h
feet ×4 12/212 4/52 0 6 6 2
left cheek (walnut) 0 0 0 6 62.5 27 (profile 27 at the back → 13.4 at the front)
key bed (graphite) 6 0 2 224 62 8
control panel (graphite, brushed top) 6 0 10 224 30 12
lip: pinstripe, light guide ×73, felt 6 30 13.6 224 0 8.4
OLED 9.4 2 22 25.6 9.6 0
master knob + LED ring 40.2 6.8 22 r3/4.6 – 2.4
program + octave buttons 9.6–37 14.2 22 5.2 3 1
section buttons ×3 46.8/106.8/154.8 1.7 22 3.6 2.7 1
organ: model ×3 + rotary buttons 47–103.2 6.2 22 6.6 3 1
organ: drawbar LED bars ×9 48.8–100.4 10.6 22 3.6 15 0
piano: type buttons ×4 107–129.2 6.2/10.8 22 10.6 3 1
piano: display + level knob 131.6/143 6/20.4 22 19.6/r3 7.8 –
piano: switches ×3 107–128.8 18.4 22 6.6 3 1
synth: cutoff + resonance knobs, LED rings 166.4/183.6 15.2 22 r5/3.4 – 3/2.6
synth: A D R knobs ×3 197.4–215.4 8.6 22 r2.3 – 2
synth: wave buttons ×3 + LFO LED 194.6–221 17.4/8.6 22 6.6 3 1
wheel block 7 31 10 18.6 31.5 3.4
pitch stick: pivot + walnut stick 9.6/10.6 36.6/40.2 13.4 4.4/2.4 3.6/12.6 2.8/2.1
mod wheel (rubber, rolls about x) 18.6 44 11.2 2.8 r5.6 –
white keys ×43 26.5–228.4 30 10.2 4.45 32.5 3.4
black keys ×30 – 30 13.6 2.7 18 3
right cheek (walnut) 230 0 0 6 62.5 27
Prints, LEDs, grain and knurls share their parent face. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: buttons with an LED in the cap, knurled knobs with LED rings, a hull for the mod wheel tread.
const draw=root,into=g=>root=g,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
let sec=1;
function button(g,label){set(g,'class','control');set(g,'role','button');set(g,'tabindex','0');set(g,'aria-label',label);return g;}
function bind(g,fn){g.addEventListener('click',()=>fn());g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function led(g,x,y,w,h,c,s=0,b='lc'){const n=rect(g,x-w/2,y-h/2,w,h,Math.min(w,h)/2,b);n.c=c;n.s=s;n.b=b;n.k='';return n;}
function lit(n,v){const c=v?`${n.b} on ${n.c}${n.s&&n.s!==sec+1?' dim':''}`:n.b;if(n.k!==c){n.k=c;set(n,'class',c);}}
function pbtn(x,y,w,d,label,name,fn,c,s){const g=button(el('g'),name);into(g);box(x,y,22,w,d,1,.6,'cap');const t=group(TOP(x,y,23));
const l=c?led(t,label?1.3:w/2,d/2,1.2,.6,c,s):null;if(label){const n=text(t,c?(w+2)/2:w/2,d/2+.47,label,'pr center');n.style.fontSize='1.15px';}
rect(t,-.7,-.7,w+1.4,d+1.4,1,'focus-ring');into(draw);bind(g,fn);return{g,l};}
function ring(x,y,R,n,c,s){const L=[];for(let i=0;i<n;i++){const a=(-135+270*i/(n-1))*Math.PI/180;L.push(led(LR,x+R*Math.sin(a),y-R*Math.cos(a),.8,.8,c,s));}return L;}
function knob(x,y,r,h,name,fn){const g=name?button(el('g'),name):el('g');into(g);const k=cylinder(x,y,22,r,h,'z','knob');
if(r>2.5){let d='';for(let a=-30;a<=120;a+=r>4?9:15){const t=a*Math.PI/180,p=P(x+r*Math.cos(t),y+r*Math.sin(t),22.2),q=P(x+r*Math.cos(t),y+r*Math.sin(t),22+h-.2);d+=`M${f2(p[0])},${f2(p[1])}L${f2(q[0])},${f2(q[1])}`;}k.g.insertBefore(el('path',{d,class:'knurl'},k.g),k.face);}
circle(k.face,0,0,r*.56,'face alu');const rot=group('',k.face);line(rot,0,-r*.08,0,-r*.5,'ind-d');line(rot,0,-r*.66,0,-r*.93,'ind');
if(name)circle(k.face,0,0,r+1.4,'focus-ring');into(draw);if(fn)bind(g,fn);return rot;}
const turnK=(rot,v)=>set(rot,'transform',`rotate(${f2(-135+270*v)})`);
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]),lo=[],hi=[];for(const p of pts){while(lo.length>1&&cr(lo[lo.length-2],lo[lo.length-1],p)<=0)lo.pop();lo.push(p);}for(const p of pts.reverse()){while(hi.length>1&&cr(hi[hi.length-2],hi[hi.length-1],p)<=0)hi.pop();hi.push(p);}return lo.slice(0,-1).concat(hi.slice(0,-1));}

// Key layout first: the light guide on the lip follows it.
const KEYS=[],byN={};let wi=0;
for(let n=28;n<=100;n++){const pc=n%12,blk=[1,3,6,8,10].includes(pc);
if(!blk){KEYS.push({n,blk,x:26.5+wi*4.7,w:4.45});wi++;}else KEYS.push({n,blk,x:26.5+wi*4.7-.125-1.35+{1:-.45,3:.45,6:-.55,8:0,10:.55}[pc],w:2.7});}

// Shadow, feet, left cheek (its inner face shows above the panel).
{const g=group(TOP(-3,-1,0)),r=rect(g,0,0,243,67,10,'shadow stage-floor');r.style.filter='url(#bloom)';r.style.opacity=.16;rect(g,0,0,243,67,10,'stage-contact');}
for(const[x,y]of[[12,4],[212,4],[12,52],[212,52]])box(x,y,0,6,6,2,1,'knob');
const PROF=[[0,27],[20,27],[30,24.6],[36,17.4],[41,15.6],[60,15],[62.5,13.4]];
function cheek(x0){const x1=x0+6,sf=group(SIDE(x1,62.5,27)),d='M0,27 V'+(27-13.4)+PROF.slice().reverse().map(([y,z])=>`L${f2(62.5-y)},${f2(27-z)}`).join('')+'V27Z';
el('path',{d,class:'face side wal'},sf);el('path',{d},el('clipPath',{id:'ck'+x0},svg.querySelector('defs')));
const gg=group('',sf,{'clip-path':`url(#ck${x0})`});for(let i=0;i<6;i++){const v=2.6+i*4.5,w=i%2?.8:-.6;el('path',{d:`M-1,${f2(v+1.4)} C18,${f2(v+.7+w)} 40,${f2(v-.3-w)} 64,${f2(v-.9+w*.4)}`,class:'grain'},gg);}
for(let i=0;i<PROF.length-1;i++){const[a,za]=PROF[i],[b,zb]=PROF[i+1];el('path',{d:poly([[x0,a,za],[x1,a,za],[x1,b,zb],[x0,b,zb]],true),class:'face '+((za-zb)/(b-a)>.8?'wal':'top wal')});}
rect(group(FRONT(x0,62.5,13.4)),0,0,6,13.4,1.6,'face wal');return sf;}
cheek(0);

// Key bed and control panel in graphite. The lip carries the pinstripe, the light guide and the felt.
box(6,0,2,224,62,8,1.5,'gr');line(group(FRONT(6,62,10)),2,.9,222,.9);
box(6,0,10,224,30,12,1.5,'gr');
const LP=group(FRONT(6,30,22));
rect(LP,.8,1.25,222.4,.42,.21,'pin');rect(LP,20.2,7.2,202.6,1.2,.3,'face felt');
for(const k of KEYS){const w=k.blk?1.1:1.6;k.lg=rect(LP,k.x+k.w/2-6-w/2,3.3,w,.6,.3,'lgd');k.lc='lgd';}
// Brushed panel: hairline section rules, vermilion headers with select buttons.
const PT=group(TOP(0,0,22));rect(PT,6.6,.6,222.8,28.8,1.2,'brush');
for(const u of[45,105,153])line(PT,u,1.6,u,28.4,'rule');
text(PT,9.6,27.7,'VERMIL','pr brand');text(PT,33.6,27.7,'ST–73','pr');
const LR=group(TOP(0,0,22));
const SEC=['ORGAN','PIANO','SYNTH'],SU=[[45,105],[105,153],[153,228.6]];
const secB=SU.map(([u0,u1],i)=>{text(PT,u0+6.8,3.75,SEC[i],'hd');line(PT,u0+17,3.12,u1-1.6,3.12,'rule');
const b=pbtn(u0+1.8,1.7,3.6,2.7,'',`${SEC[i][0]+SEC[i].slice(1).toLowerCase()} section (${i+1})`,()=>section(i),'c'+(i+1),0);rect(group(TOP(0,0,22),b.g),u0+1,1,15,4.2,0,'hit');return b;});
// Master: OLED, level knob, program and octave.
rect(PT,9.4,2,25.6,9.6,1.2,'face slot');const oh=rect(PT,10,2.6,24.4,8.4,1,'oh');rect(PT,10,2.6,24.4,8.4,.8,'face oled');
const ol1=text(PT,11.4,6.2,'','ol'),ol2=text(PT,11.4,9.6,'','ol s'),ob=[0,1,2,3,4].map(i=>rect(PT,29.4+i*.9,4,.6,6,.15,'ob'));
const masterRot=knob(40.2,6.8,3,2.4),mRing=ring(40.2,6.8,4.6,11,'c2',0);
pbtn(9.6,14.2,5.2,3,'◀','Previous program',()=>prog(-1));pbtn(15.4,14.2,5.2,3,'▶','Next program',()=>prog(1));text(PT,15.1,21.6,'PROGRAM','pr center');
pbtn(26,14.2,5.2,3,'−','Octave down (Z)',()=>octave(-1));pbtn(31.8,14.2,5.2,3,'+','Octave up (X)',()=>octave(1));
const octL=[-2,-1,0,1,2].map(i=>led(LR,31.1+i*1.9,19.2,.85,.85,'c2',0));text(PT,31.1,21.6,'OCTAVE','pr center');
// Organ: model and rotary buttons, nine LED drawbars with coloured tabs.
const orgM=['B3','VOX','FARF'].map((t,i)=>pbtn(47+i*7.4,6.2,6.6,3,t,`Organ model ${t}`,()=>model(0,i),'c1',1));
const rot=pbtn(96.6,6.2,6.6,3,'ROT','Rotary speed',()=>{fast=!fast;say(fast?'Rotary fast.':'Rotary slow.');ui();},'c1',1);
const DBC=['--db-br','--db-br','--db-w','--db-w','--db-k','--db-w','--db-k','--db-k','--db-w'],DB=[];
for(let i=0;i<9;i++){const u=50.6+i*6,g=button(el('g'),`Drawbar ${i+1}`);into(g);const t=group(TOP(0,0,22));rect(t,u-1.8,10.6,3.6,13,.9,'face slot');
DB.push([0,1,2,3,4,5,6,7].map(k=>led(t,u,11.6+k*1.5,2.5,.95,'c1',1,'lc db')));rect(t,u-1.65,24,3.3,1.5,.6,'face').style.fill=`var(${DBC[i]})`;rect(t,u-2.4,10,4.8,16.2,1.1,'focus-ring');
into(draw);bind(g,()=>{lv[i]=(lv[i]+1)%9;say(`Drawbar ${i+1} at ${lv[i]}.`);ui();});}
// Piano: type buttons, display, switches, level knob.
const pnT=['GRAND','UPRT','E.PNO','CLAV'].map((t,i)=>pbtn(107+(i%2)*11.6,6.2+(i>>1)*4.6,10.6,3,t,`Piano type ${t}`,()=>model(1,i),'c2',2));
rect(PT,131.6,6,19.6,7.8,1,'face slot');rect(PT,132.2,6.6,18.4,6.6,.7,'face oled');const pd=text(PT,141.4,11.2,'','ol center');pd.style.fontSize='3.2px';pd.style.fill='var(--c2)';
const pfx=['DYN','SOFT','STR'].map((t,i)=>pbtn(107+i*7.6,18.4,6.6,3,t,`Piano ${t.toLowerCase()} switch`,()=>{pf[i]=!pf[i];say(`${t.toLowerCase()} ${pf[i]?'on':'off'}.`);ui();},'c2',2));
const pnRot=knob(143,20.4,3,2.4),pnRing=ring(143,20.4,4.7,11,'c2',2);
// Synth: cutoff and resonance with LED rings, envelope, waves, LFO.
const cutRing=ring(166.4,15.2,7.4,15,'c3',3),resRing=ring(183.6,15.2,5.3,11,'c3',3);
const cutRot=knob(166.4,15.2,5,3,'Filter cutoff (Up and Down arrows)',()=>filter(cut>=1?-1:.1)),resRot=knob(183.6,15.2,3.4,2.6,'Resonance',()=>{res=res>=1?0:res+.25;ui();});
text(PT,166.4,25.9,'CUTOFF','pr center');text(PT,183.6,23.9,'RES','pr center');
const env=[.08,.45,.35];['A','D','R'].forEach((t,i)=>{turnK(knob(197.4+i*9,8.6,2.3,2),env[i]);text(PT,197.4+i*9,13.3,t,'pr center');});
const synW=['SAW','SQR','PAD'].map((t,i)=>pbtn(194.6+i*8.4,17.4,6.6,3,t,`Synth wave ${t}`,()=>model(2,i),'c3',3));
const lfo=led(LR,221,8.6,1.1,1.1,'c3',0);text(PT,221,11.6,'LFO','pr center');
// Wheel block left of the keys: walnut pitch stick on a pivot, rubber mod wheel in its slot.
box(7,31,10,18.6,31.5,3.4,1.2,'gr');
{const t=group(TOP(7,31,13.4));rect(t,10.8,6.2,4.4,13.6,1.6,'face slot');rect(t,2.2,5,5.2,5.2,1.4,'face slot');text(t,5,27.4,'PITCH','pr center');text(t,13,27.4,'MOD','pr center');}
box(9.6,36.6,13.4,4.4,3.6,2.8,.9,'knob');box(10.6,40.2,13.9,2.4,12.6,2.1,1,'wal');
const WX0=18.6,WX1=21.4,WY=44,WZ=11.2,WR=5.6,wA=Math.acos((13.4-WZ)/WR);
const wheelG=button(el('g'),'Mod wheel: vibrato (M)');
const arc=x=>[...Array(17)].map((_,i)=>{const a=-wA+2*wA*i/16;return P(x,WY+WR*Math.sin(a),WZ+WR*Math.cos(a));});
el('path',{d:'M'+hull([...arc(WX0),...arc(WX1)]).map(p=>p.map(f2).join(',')).join('L')+'Z',class:'face top knob'},wheelG);
const wRidge=el('path',{class:'knurl'},wheelG),wf=group(SIDE(WX1,WY,WZ),wheelG),cut0=WR*Math.sin(wA),seg=`M${f2(-cut0)},${f2(WZ-13.4)} A${WR},${WR} 0 0 1 ${f2(cut0)},${f2(WZ-13.4)}Z`;
el('path',{d:seg,class:'face side knob'},wf);const wMark=el('path',{class:'ind'},wf);el('path',{d:seg,class:'focus-ring'},wf);
function wheelDraw(m){let d='';for(let i=-14;i<=14;i++){const a=-m*.9+i*.16;if(a<-.74||a<=-wA+.05||a>=wA-.05)continue;const y=WY+WR*Math.sin(a),z=WZ+WR*Math.cos(a),p=P(WX0+.3,y,z),q=P(WX1-.3,y,z);d+=`M${f2(p[0])},${f2(p[1])}L${f2(q[0])},${f2(q[1])}`;}set(wRidge,'d',d);
const am=.55-m*1.1;let md='';if(Math.cos(am)*WR*.6>2.4){const u=-WR*Math.sin(am),v=-WR*Math.cos(am);md=`M${f2(u*.6)},${f2(v*.6)}L${f2(u*.92)},${f2(v*.92)}`;}set(wMark,'d',md);}
// Keys: ivory naturals (the lip shades their backs), then ebony sharps with a bevelled cap.
for(const k of KEYS.filter(k=>!k.blk)){const g=el('g',{class:'key','data-n':k.n});into(g);
rect(group(FRONT(k.x,62.5,13.6)),0,0,k.w,3.4,.6,'face ivory');if(k.n===100)rect(group(SIDE(k.x+k.w,62.5,13.6)),0,0,32.5,3.4,.6,'face side ivory');
const t=group(TOP(k.x,30,13.6));rect(t,0,0,k.w,32.5,.7,'face top ivory');line(t,.45,31.3,k.w-.45,31.3,'kl');rect(t,0,0,k.w,32.5,.7,'kt');into(draw);k.g=g;byN[k.n]=k;}
rect(group(TOP(26.5,30,13.6)),0,0,201.9,6.5,0,'kshade');
for(const k of KEYS.filter(k=>k.blk)){const g=el('g',{class:'key','data-n':k.n});into(g);box(k.x,30,13.6,k.w,18,3,.5,'eb');
const t=group(TOP(k.x,30,16.6));rect(t,.32,.3,k.w-.64,16.1,.45,'ebi');rect(t,.3,16.4,k.w-.6,1.3,.4,'ebf');rect(t,k.w/2-.28,.9,.56,14.6,.28,'gloss');rect(t,0,0,k.w,18,.5,'kt');into(draw);k.g=g;byN[k.n]=k;}
cheek(230);
frame([[0,0,0,236,62.5,27]],6);

// State: sections, models, drawbars, filter, octave, mod wheel; voices are built on demand.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),hk={};
const NAMES=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'],nm=m=>NAMES[m%12]+(Math.floor(m/12)-1);
const MODELS=[['B3','VOX','FARF'],['GRAND','UPRIGHT','E.PIANO','CLAV'],['SAW LEAD','SQUARE','POLY PAD']],PD=['GRd','UPr','EP','CLA'];
const REG=['888000000','838000000','886000000','800000888','688600000','008530000','888888888'];
const HM=[.5,1.5,1,2,3,4,5,6,8];
let pf=[true,false,true],mdl=[0,0,0],lv=REG[0].split('').map(Number),shown=lv.slice(),ri=0,cut=.7,cutV=.7,res=.5,oct=0,mod=0,modV=0,wDrawn=-1,fast=false,pnum=7,last='',vu=0,lastStep=0,lt=0,ac=null,bus,lp,master,vib,lfoO,nb;
const held=new Map(),mouse={n:-1};
function say(m){announcement.textContent=m;}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();master=ac.createGain();master.gain.value=.32;const cp=ac.createDynamicsCompressor();lp=ac.createBiquadFilter();lp.type='lowpass';bus=ac.createGain();bus.connect(lp);lp.connect(cp);cp.connect(master);master.connect(ac.destination);
lfoO=ac.createOscillator();lfoO.frequency.value=6;vib=ac.createGain();vib.gain.value=0;lfoO.connect(vib);lfoO.start();nb=ac.createBuffer(1,ac.sampleRate/4,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;tone();}
if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(){if(!ac)return;const t=ac.currentTime;lp.frequency.setTargetAtTime(180*2**(cut*6),t,.03);lp.Q.setTargetAtTime(sec===2?.7+res*9:.7,t,.05);vib.gain.setTargetAtTime(mod*22,t,.1);}
function noise(t,d,v,f,dest){const s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(dest);s.start(t);s.stop(t+d+.02);}
function voice(m){if(!ac)return null;const f=440*2**((m-69)/12),t=ac.currentTime,g=ac.createGain(),os=[],md=mdl[sec];g.gain.value=0;g.connect(bus);
const add=(type,fr,amp,det=0)=>{const o=ac.createOscillator(),a=ac.createGain();o.type=type;o.frequency.value=fr;o.detune.value=det;a.gain.value=amp;o.connect(a);a.connect(g);vib.connect(o.detune);o.start(t);os.push(o);};
let rel=.05;
if(sec===0){const ty=['sine','triangle','square'][md];lv.forEach((v,i)=>{if(v)add(ty,f*HM[i],v/8*(md===2?.022:md?.04:.06));});g.gain.linearRampToValueAtTime(1,t+.006);noise(t,.012,.05,2500,g);}
else if(sec===1){const dec=[2.6,1.7,1.9,.55][md];if(md===3){add('square',f,.12);add('sawtooth',f*2,.05);}else if(md===2){add('sine',f,.42);add('sine',f*4.02,.1);add('triangle',f*2,.05);}else{add('triangle',f,.36);add('sine',f*2.003,.16,md?6:0);add('sine',f*3.01,.06);}
g.gain.linearRampToValueAtTime(1,t+.004);g.gain.setTargetAtTime(0,t+.012,dec/3.2);noise(t,.03,md===3?.03:.06,md===2?1200:3200,g);rel=.18;}
else{const ty=['sawtooth','square','sawtooth'][md];add(ty,f,.13,-8);add(ty,f,.13,8);if(md===2)add('sawtooth',f/2,.08,3);const at=md===2?.35:.012;g.gain.linearRampToValueAtTime(1,t+at);g.gain.setTargetAtTime(.72,t+at,.25);rel=md===2?.9:.22;}
return{g,os,rel};}
function release(v){if(!v||!ac)return;const t=ac.currentTime,p=v.g.gain;if(p.cancelAndHoldAtTime)p.cancelAndHoldAtTime(t);else{p.cancelScheduledValues(t);p.setValueAtTime(p.value,t);}p.setTargetAtTime(0,t,v.rel/3);v.os.forEach(o=>o.stop(t+v.rel*2.5+.05));}
function noteOn(m){if(held.has(m)||held.size>9)return;audio();held.set(m,voice(m));const k=byN[m];if(k)k.g.classList.add('on');last=nm(m);vu=Math.min(1,vu+.5);ui();}
function noteOff(m){if(!held.has(m))return;release(held.get(m));held.delete(m);const k=byN[m];if(k)k.g.classList.remove('on');ui();}
function section(i){audio();if(sec===i){model(i,(mdl[i]+1)%MODELS[i].length);return;}sec=i;document.documentElement.style.setProperty('--kc',`var(--c${i+1})`);tone();say(`${SEC[i].toLowerCase()} section: ${MODELS[i][mdl[i]].toLowerCase()}.`);ui();}
function model(s,i){audio();sec=s;mdl[s]=i;document.documentElement.style.setProperty('--kc',`var(--c${s+1})`);tone();say(`${MODELS[s][i].toLowerCase()}.`);ui();}
function regist(){audio();ri=(ri+1)%REG.length;lv=REG[ri].split('').map(Number);if(sec!==0)section(0);say(`Drawbars ${REG[ri]}.`);ui();}
function filter(d){audio();cut=clamp(Math.round((cut+d)*20)/20);tone();ui();}
function octave(d){audio();oct=clamp(oct+d,-2,2);say(`Octave ${oct}.`);ui();}
function wheel(){audio();mod=mod?0:1;tone();set(hk.m,'aria-pressed',!!mod);set(wheelG,'aria-pressed',!!mod);say(mod?'Vibrato on.':'Vibrato off.');ui();}
function prog(d){audio();pnum=(pnum+d+100)%100;section((sec+(d>0?1:2))%3);}
bind(wheelG,wheel);
document.querySelectorAll('.hint [data-k]').forEach(b=>{hk[b.dataset.k]=b;b.addEventListener('click',()=>b.dataset.k==='r'?regist():wheel());});
const WH={a:0,s:2,d:4,f:5,g:7,h:9,j:11,k:12,l:14,';':16,"'":17,w:1,e:3,t:6,y:8,u:10,o:13,p:15};
const midiOf=k=>60+WH[k]+12*oct,down={};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.toLowerCase();
if(k==='arrowup'||k==='arrowdown'){e.preventDefault();filter(k==='arrowup'?.05:-.05);return;}
if(e.repeat)return;
if(k in WH){e.preventDefault();const m=midiOf(k);down[k]=m;noteOn(m);}
else if(/^[123]$/.test(k)){e.preventDefault();section(+k-1);}
else if(k==='z'||k==='x'){e.preventDefault();octave(k==='z'?-1:1);}
else if(k==='r'){e.preventDefault();regist();}else if(k==='m'){e.preventDefault();wheel();}});
document.addEventListener('keyup',e=>{const k=e.key.toLowerCase();if(k in down){noteOff(down[k]);delete down[k];}});
addEventListener('blur',()=>{for(const k in down){noteOff(down[k]);delete down[k];}if(mouse.n>=0){noteOff(mouse.n);mouse.n=-1;}});
svg.addEventListener('pointerdown',e=>{const g=e.target.closest('.key');if(!g)return;e.preventDefault();audio();mouse.n=+g.dataset.n;noteOn(mouse.n);});
addEventListener('pointerup',()=>{if(mouse.n>=0){noteOff(mouse.n);mouse.n=-1;}});
// UI: LEDs (inactive sections dim), light guide, OLED, knobs; the drawbar bars climb one LED at a time.
function ui(){
secB.forEach((b,i)=>{lit(b.l,i===sec);set(b.g,'aria-pressed',i===sec);});
[[orgM,0],[pnT,1],[synW,2]].forEach(([B,s])=>B.forEach((b,i)=>{lit(b.l,i===mdl[s]);set(b.g,'aria-pressed',i===mdl[s]);}));
pfx.forEach((b,i)=>{lit(b.l,pf[i]);set(b.g,'aria-pressed',pf[i]);});
octL.forEach((l,i)=>lit(l,i-2===oct));cutRing.forEach((l,i)=>lit(l,i<=Math.round(cut*14)));resRing.forEach((l,i)=>lit(l,i<=Math.round(res*10)));mRing.forEach((l,i)=>lit(l,i<8));pnRing.forEach((l,i)=>lit(l,i<7));
DB.forEach((b,i)=>b.forEach((l,k)=>lit(l,k<shown[i])));
const lo=60+12*oct,hi=77+12*oct;for(const k of KEYS){const c=held.has(k.n)?'lgd on':k.n>=lo&&k.n<=hi?'lgd rg':'lgd';if(k.lc!==c){k.lc=c;set(k.lg,'class',c);}}
ol1.textContent=`${String(pnum).padStart(2,'0')} ${MODELS[sec][mdl[sec]]}`;ol2.textContent=held.size?[...held.keys()].slice(0,4).map(nm).join(' '):`OCT ${oct>0?'+':''}${oct} · CUT ${Math.round(cut*100)}`;pd.textContent=PD[mdl[1]];pd.style.opacity=sec===1?1:.45;
const notes=[...held.keys()].sort((a,b)=>a-b).map(nm);
readout.textContent=`${SEC[sec]} · ${MODELS[sec][mdl[sec]]}${sec===0?' · '+lv.join(''):''}`;
stateLabel.textContent=`${notes.length?notes.join(' '):last?'LAST '+last:"PLAY A–'"} · OCT ${oct>0?'+':''}${oct} · CUT ${Math.round(cut*100)}%${mod?' · VIBRATO':''}`;}
function tick(now){
const dt=Math.min(.05,(now-(lt||now))/1000),red=reduced.matches;lt=now;
if(now-lastStep>(red?0:45)){lastStep=now;for(let i=0;i<9;i++){if(shown[i]!==lv[i]){shown[i]+=red?lv[i]-shown[i]:Math.sign(lv[i]-shown[i]);DB[i].forEach((l,k)=>lit(l,k<shown[i]));}}}
cutV=red?cut:cutV+(cut-cutV)*clamp(dt*14);turnK(cutRot,cutV);turnK(resRot,res);turnK(masterRot,.7);turnK(pnRot,.62);
modV=red?mod:modV+(mod-modV)*clamp(dt*5);if(Math.abs(modV-wDrawn)>.002){wDrawn=modV;wheelDraw(modV);}
lit(lfo,sec===2&&(red||(now/(mod?90:260)|0)%2));lit(rot.l,sec===0&&(red||(now/(fast?110:420)|0)%2));
vu=Math.max(0,vu-dt*(held.size?.3:1.4));const lvl=held.size?(red?.8:.55+.45*Math.random()*vu):vu;ob.forEach((b,i)=>{const h=Math.max(.4,6*clamp(lvl*1.4-i*.18));set(b,'y',f2(10-h));set(b,'height',f2(h));});
requestAnimationFrame(tick);}
ui();requestAnimationFrame(tick);

}

export const figure: FigureModule = { css, defs, hints: ['r', 'm'], draw }
