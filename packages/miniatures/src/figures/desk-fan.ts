// @ts-nocheck
/* VENTORA 12 · Desk fan. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule).
 * Port review: Math.random only fills the audio noise buffer after interaction;
 * it does not affect drawing or animation. Keep the lab's noise generation. */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--en:#ebe6d8;--en-top:#f7f4eb;--en-side:#d3cdbd;--brass:#d6b05a;--brass-top:#ecd08a;--brass-side:#b08a3c;--b1:#f0d48c;--b2:#b9892f;--wire:#7d8081;--chrome:#d9dcdd;--bake:#3a2a20;--bake-top:#55402f;--felt:#4a4a48;--rib:#e2483a;--rib2:#3b6fd8;--air:#7fa7c2;--jewel:#ffa52e;--off:#b9b9b5}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--en:#c5c2b9;--en-top:#e7e4dc;--en-side:#959085;--brass:#b4944b;--brass-top:#ddc281;--brass-side:#7b6028;--b1:#cab275;--b2:#9b7326;--wire:#696b6b;--chrome:#b7b9ba;--bake:#2f2219;--bake-top:#4f3b2b;--felt:#3d3d3c;--rib:#be3b2f;--rib2:#305cb6;--air:#6a8ca3;--jewel:#ffa52e;--off:#9b9b99;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:4.4px;letter-spacing:1.2px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.en{fill:var(--en)}.top.en{fill:var(--en-top)}.side.en{fill:var(--en-side)}.brass{fill:var(--brass)}.top.brass{fill:var(--brass-top)}.side.brass{fill:var(--brass-side)}.bake{fill:var(--bake)}.top.bake{fill:var(--bake-top)}.felt{fill:var(--felt)}.chrome{fill:var(--chrome)}.dark-ink{fill:#2b2b2b}
.ring{fill:none;stroke:var(--wire);stroke-width:.9;vector-effect:non-scaling-stroke}.rim{fill:none;stroke:var(--wire);stroke-width:1.9;vector-effect:non-scaling-stroke}.rim2{fill:none;stroke:var(--chrome);stroke-width:.8;vector-effect:non-scaling-stroke}.spoke{fill:none;stroke:var(--wire);stroke-width:.6;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.blade{fill:url(#bladeG);stroke:var(--brass-side);stroke-width:.6;vector-effect:non-scaling-stroke}.disc{fill:url(#discG);opacity:0;stroke:none}.hub{fill:var(--brass-top);stroke:var(--line);stroke-width:.8;vector-effect:non-scaling-stroke}
.arm-u{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.arm{fill:none;stroke:var(--en-side);stroke-linecap:round;stroke-linejoin:round}.stem{fill:none;stroke:var(--chrome);stroke-linecap:round}
.rib-u{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round;opacity:.5}.rib{fill:none;stroke:var(--rib);stroke-linecap:round;stroke-linejoin:round}.rib.b{stroke:var(--rib2)}.rib-c{fill:none;stroke:#fff;stroke-linecap:round;opacity:.55;stroke-dasharray:1.2 1.6}
.air{fill:none;stroke:var(--air);stroke-width:.9;stroke-linecap:round;stroke-dasharray:7 13;opacity:0;vector-effect:non-scaling-stroke}
.jewel{fill:#7a5530}.on .jewel{fill:var(--jewel);filter:url(#glow)}.jh{fill:var(--jewel);opacity:0;filter:url(#bloom)}.on .jh{opacity:.55}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<linearGradient id="bladeG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" style="stop-color:var(--b1)"/><stop offset="1" style="stop-color:var(--b2)"/></linearGradient>
<radialGradient id="discG"><stop offset=".2" style="stop-color:var(--b1);stop-opacity:0"/><stop offset=".62" style="stop-color:var(--b1);stop-opacity:.26"/><stop offset=".93" style="stop-color:var(--b2);stop-opacity:.3"/><stop offset="1" style="stop-color:var(--b2);stop-opacity:0"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* VENTORA 12 desk fan. World: x lower-right; y lower-left; z up. 1 unit ≈ 3 mm.
The head is built in its own frame: t along the blowing axis n, s to the right (u), h up (w).
Part x y z w d h
felt ring 60 60 0 r35 – 2
base + step + brass collar 60 60 2 r34/26/8 – 16
speed knob (on the base front) 84 84 6 r5.5 6 –
pilot jewel 60 60 6 r1.8 – – (rim, 25° left of front)
pillar + swivel collar 60 60 18 r3.6 – 48
tilt yoke + wing nut s ±17 t −20 h −16…0
motor rear cap + body (head frame) t −44…−8 r12/16
gearbox + oscillation knob t −24 h 14…27 r7/2.8
rear guard t −2…−5.5 r31…16
blades (4) + hub t 4 r28
front guard (domed, 4 rings, 24 spokes) + badge t 14…19 r31…7
streamers (2) from the front rim, along the airflow
Head origin (t 0) sits 12 above the tilt joint at z 66; yaw 45° ± 38° (facing the viewer). */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Head frame: rotated planes (discs), tubes along the axis, polylines.
const f2=v=>(+v).toFixed(2),rad=d=>d*Math.PI/180,J=[60,60,66];
let n,u,w,O;
function axes(yaw,pitch){const t=rad(yaw),p=rad(pitch);n=[Math.cos(t)*Math.cos(p),Math.sin(t)*Math.cos(p),Math.sin(p)];u=[Math.sin(t),-Math.cos(t),0];w=[-Math.cos(t)*Math.sin(p),-Math.sin(t)*Math.sin(p),Math.cos(p)];O=J.map((v,i)=>v+w[i]*12);}
const hp=(t,s,h)=>[0,1,2].map(i=>O[i]+n[i]*t+u[i]*s+w[i]*h);
const sv=v=>P(...v);
function disc(t,s=0,h=0){const A=sv(u),B=sv(w.map(x=>-x)),o=P(...hp(t,s,h));return`matrix(${f2(A[0])} ${f2(A[1])} ${f2(B[0])} ${f2(B[1])} ${f2(o[0])} ${f2(o[1])})`;}
function tube(t0,t1,r){const A=sv(u),B=sv(w.map(x=>-x)),E=sv(n).map(v=>v*(t1-t0)),det=A[0]*B[1]-A[1]*B[0];
const eu=(B[1]*E[0]-B[0]*E[1])/det,ev=(-A[1]*E[0]+A[0]*E[1])/det,l=Math.hypot(eu,ev)||1,tx=-ev*r/l,ty=eu*r/l;
return`M${f2(tx)},${f2(ty)} A${r},${r} 0 0 1 ${f2(-tx)},${f2(-ty)} L${f2(eu-tx)},${f2(ev-ty)} A${r},${r} 0 0 1 ${f2(eu+tx)},${f2(ev+ty)} Z`;}
const pl=pts=>'M'+pts.map(p=>P(...p).map(f2).join(',')).join('L');
// Base: felt ring, cast base, step with the speed knob, brass collar, pilot jewel, maker's mark.
const draw=root,into=g=>root=g;
const shp=P(66,66,0);el('ellipse',{cx:shp[0],cy:shp[1]+2,rx:78,ry:30,class:'shadow stage-floor'});el('ellipse',{cx:shp[0],cy:shp[1]+2,rx:78,ry:30,class:'stage-contact'});
cylinder(60,60,0,35,2,'z','felt');cylinder(60,60,2,34,8,'z','en');circle(group(TOP(60,60,10)),0,0,30.5,'detail');
cylinder(60,60,10,26,4,'z','en');const st=group(TOP(60,60,14));circle(st,0,0,23.4,'detail');
const KP=[60+17*Math.SQRT1_2,60+17*Math.SQRT1_2];
['OFF','1','2','3'].forEach((s,i)=>{const a=rad(105-i*40);text(st,KP[0]-60+Math.cos(a)*9.4,KP[1]-60+Math.sin(a)*9.4+.9,s,'label micro center');});
cylinder(60,60,14,8.4,4,'z','brass');
const knobG=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Speed knob: next speed (1, 2, 3; 0 for off)'});into(knobG);
const kc=cylinder(KP[0],KP[1],14,4.6,4.4,'z','bake');const kRot=group('',kc.face);rect(kRot,-.9,-.9,5.2,1.8,.9,'face brass');circle(kc.face,0,0,2,'face top bake');circle(kc.face,0,0,6.8,'focus-ring');into(draw);
const nB=[Math.SQRT1_2,Math.SQRT1_2,0],uB=[Math.SQRT1_2,-Math.SQRT1_2,0];
const pB=(r,a,z)=>{const c=Math.cos(rad(a)),s=Math.sin(rad(a));return[60+r*(nB[0]*c+uB[0]*s),60+r*(nB[1]*c+uB[1]*s),z];};
const planeAt=(o,a)=>{const c=Math.cos(rad(a)),s=Math.sin(rad(a)),U=sv([uB[0]*c-nB[0]*s,uB[1]*c-nB[1]*s,0]),p=P(...o);return`matrix(${f2(U[0])} ${f2(U[1])} 0 1 ${f2(p[0])} ${f2(p[1])})`;};
const jw=el('g',{}),jf=group(planeAt(pB(34.1,-22,6),-22),jw);circle(jf,0,0,4,'jh');circle(jf,0,0,2.4,'face brass');circle(jf,0,0,1.6,'jewel');
{const g=group(planeAt(pB(34.1,14,6),14));text(g,0,1,'VENTORA · 12"','label micro center');}
// Pillar and swivel collar.
cylinder(60,60,18,3.6,42,'z','chrome');cylinder(60,60,58,5.6,6,'z','en');ellipse(60,60,64,3.4,'z','detail');
// Head layers (back to front).
const H=el('g',{});
const armBack=el('g',{},H),armB=[el('path',{class:'arm-u','stroke-width':4.6},armBack),el('path',{class:'arm','stroke-width':3.2},armBack)];
const rearCap=el('path',{class:'face side en'},H),body=el('path',{class:'face en'},H);
const capG=el('g',{},H);circle(capG,0,0,15,'face top en');circle(capG,0,0,12.4,'detail');for(let i=0;i<16;i++){const a=i*Math.PI/8;el('path',{d:`M${f2(Math.cos(a)*7.4)},${f2(Math.sin(a)*7.4)}L${f2(Math.cos(a)*11.6)},${f2(Math.sin(a)*11.6)}`,class:'detail','stroke-width':1.4,style:'stroke:var(--recess);stroke-width:1.6'},capG);}circle(capG,0,0,5.2,'face brass');
const gearG=el('g',{},H),gear=el('path',{class:'face en'},gearG),gearTop=el('g',{},gearG);circle(gearTop,0,0,7,'face top en');circle(gearTop,0,0,4.4,'detail');
const oscG=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Oscillation knob: pull to sweep (O)','aria-pressed':'false'},H);
const stem=[el('path',{class:'arm-u','stroke-width':2.4},oscG),el('path',{class:'stem','stroke-width':1.4},oscG)],oscSide=el('path',{class:'face bake'},oscG),oscTop=el('g',{},oscG);circle(oscTop,0,0,3,'face top bake');circle(oscTop,0,0,1.2,'detail');const oscRing=el('ellipse',{rx:8,ry:6,class:'focus-ring'},oscG),oscHit=el('ellipse',{rx:9,ry:9,class:'hit'},oscG);
const armFront=el('g',{},H),armF=[el('path',{class:'arm-u','stroke-width':4.6},armFront),el('path',{class:'arm','stroke-width':3.2},armFront)],wing=el('g',{},armFront);circle(wing,0,0,3,'face brass');rect(wing,-6.4,-1.3,12.8,2.6,1.3,'face brass');circle(wing,0,0,1.1,'detail');
const rear=el('g',{},H),rearRings=[[-2,31],[-3.6,23.5],[-4.8,15.5]].map(([t,r])=>({t,r,n:circle(el('g',{},rear),0,0,r,'ring')})),rearSp=[...Array(12)].map(()=>el('path',{class:'spoke'},rear));
const rimBack=circle(el('g',{},H),0,0,31,'rim');
const bladeP=el('g',{},H),disc0=circle(bladeP,0,0,28.5,'disc'),blades=el('g',{},bladeP);
for(let i=0;i<4;i++)el('path',{d:'M3.4,-3 C8,-11 21,-15 27.6,-9.6 C30.4,-5 28,3.4 21,5.4 C14,7.2 7,5.6 3.4,3Z',class:'blade',transform:`rotate(${i*90})`},blades);
circle(bladeP,0,0,6,'hub');circle(bladeP,0,0,3.4,'detail');circle(bladeP,-1.6,-1.8,1.2,'face top brass');
const hubCap=el('path',{class:'hub'},H);
const sil=[0,1].map(()=>el('path',{class:'rim'},H));
const FR=[[14,31],[16.2,24.5],[17.6,17.5],[18.4,10.5]];
const front=el('g',{},H),frontSp=[...Array(24)].map(()=>el('path',{class:'spoke'},front)),frontRings=FR.map(([t,r],i)=>({t,r,n:circle(el('g',{},front),0,0,r,i?'ring':'rim')}));
const rimHi=circle(el('g',{},front),0,0,31,'rim2');
const badge=el('g',{},front);circle(badge,0,0,7.4,'face brass');circle(badge,0,0,6,'detail');text(badge,0,1.6,'V','label center brand');text(badge,0,4.4,'VENTORA','etch micro center').style.fontSize='1.5px';
const ribs=[0,1].map(i=>({u:el('path',{class:'rib-u','stroke-width':2.5}),r:el('path',{class:'rib'+(i?' b':''),'stroke-width':1.6}),a:i?-40:14,L:i?22:28}));
const airs=[...Array(5)].map((_,i)=>({n:el('path',{class:'air'}),s:(i-2)*11,h:((i*3)%5-2)*8,o:i*3.7}));
// Frame from the head's extremes.
const ext=[];for(const y of[7,45,83])for(const p of[-12,10]){axes(y,p);for(let a=0;a<360;a+=30)ext.push([...hp(16,31*Math.cos(rad(a)),31*Math.sin(rad(a))),0,0,0]);ext.push([...hp(40,0,-14),0,0,0],[...hp(-36,0,15),0,0,0]);}
frame([[24,24,0,72,72,18],...ext],10);
// State: speed and spin, oscillation, tilt, streamers, airflow, audio.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const RPM=[0,620,940,1280],TILTS=[-12,0,10];
let speed=0,k=0,spin=0,osc=false,ph=0,yaw=45,ti=1,pitch=0,pv=0,knobA=105,lastT=0,lastUI=0,ac=null,humG=null,airG=null;
const oscKey=document.querySelector('[data-k="o"]');
function say(m){announcement.textContent=m;}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();const o=ac.createOscillator();o.frequency.value=120;humG=ac.createGain();humG.gain.value=0;o.connect(humG);humG.connect(ac.destination);o.start();
const b=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=ac.createBufferSource(),f=ac.createBiquadFilter();s.buffer=b;s.loop=true;f.type='bandpass';f.frequency.value=700;f.Q.value=.6;airG=ac.createGain();airG.gain.value=0;s.connect(f);f.connect(airG);airG.connect(ac.destination);s.start();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function click(f=1400,v=.025){if(!ac)return;const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.type='square';o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.04);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.05);}
function setSpeed(s){audio();speed=s;click(1100+s*200);svg.classList.toggle('on',s>0);say(s?`Speed ${s}.`:'Off. Blades coasting down.');lastUI=0;}
function oscillate(){audio();osc=!osc;click(600,.03);set(oscG,'aria-pressed',osc);set(oscKey,'aria-pressed',osc);say(osc?'Oscillation on.':'Oscillation off. Head holds its angle.');lastUI=0;}
function tilt(d){audio();ti=clamp(ti+d,0,2);click(900,.02);say(`Tilt ${TILTS[ti]} degrees.`);lastUI=0;}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(knobG,()=>setSpeed((speed+1)%4));bind(oscG,oscillate);
document.querySelectorAll('.hint [data-k]').forEach(b=>b.addEventListener('click',()=>b.dataset.k==='o'?oscillate():setSpeed(0)));
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k2=e.key;
if(k2==='ArrowUp'||k2==='ArrowDown'){e.preventDefault();if(!e.repeat)tilt(k2==='ArrowUp'?1:-1);return;}
if(e.repeat)return;if(/^[0-3]$/.test(k2)){e.preventDefault();setSpeed(+k2);}else if(k2.toLowerCase()==='o'){e.preventDefault();oscillate();}});
function head(now){
axes(yaw,pitch);
const tf=t=>disc(t);
set(rearCap,'d',tube(-36,-29,11));set(rearCap,'transform',tf(-36));set(body,'d',tube(-30,-7,15));set(body,'transform',tf(-30));set(capG,'transform',tf(-7));
const near=(u[0]+u[1])>0?1:-1;
const armPts=sg=>pl([hp(-18,sg*16.5,0),hp(-18,sg*16.5,-10),hp(-16,sg*9,-17),[J[0],J[1],J[2]-1]]);
for(const[g,sg]of[[armB,-near],[armF,near]]){const d=armPts(sg);g.forEach(p=>set(p,'d',d));}
set(wing,'transform',`translate(${P(...hp(-18,near*18,0)).map(f2).join(' ')}) scale(${f2(Math.abs(u[0]-u[1])*.7+.3)} 1)`);
const gb=P(...hp(-19,0,12.5));set(gear,'d',`M${f2(gb[0]-7*1.22)},${f2(gb[1])}V${f2(gb[1]-7)}H${f2(gb[0]+7*1.22)}V${f2(gb[1])}A${f2(7*1.22)},${f2(7*.7)} 0 0 1 ${f2(gb[0]-7*1.22)},${f2(gb[1])}Z`);
set(gearTop,'transform',`translate(${f2(gb[0])} ${f2(gb[1]-7)}) scale(1.22 .7)`);
const kh=osc?9:4.2,kb=[gb[0],gb[1]-7],kt=[gb[0],gb[1]-7-kh];
stem.forEach(p=>set(p,'d',`M${f2(kb[0])},${f2(kb[1])}V${f2(kt[0]===kb[0]?kt[1]+1:kt[1])}`));
set(oscSide,'d',`M${f2(kt[0]-3.6)},${f2(kt[1])}V${f2(kt[1]+2.6)}A3.6,2.2 0 0 0 ${f2(kt[0]+3.6)},${f2(kt[1]+2.6)}V${f2(kt[1])}Z`);set(oscTop,'transform',`translate(${f2(kt[0])} ${f2(kt[1])}) scale(1.2 .72)`);
for(const n2 of[oscRing,oscHit]){set(n2,'cx',f2(kt[0]));set(n2,'cy',f2(kt[1]+2));}
rearRings.forEach(r=>set(r.n.parentNode,'transform',tf(r.t)));
rearSp.forEach((p,i)=>{const a=rad(i*30);set(p,'d',pl(rearRings.map(r=>hp(r.t,r.r*Math.cos(a),r.r*Math.sin(a)))));});
set(rimBack.parentNode,'transform',tf(-2));set(bladeP,'transform',tf(4));
set(hubCap,'d',tube(4,8.5,4.4));set(hubCap,'transform',tf(4));
const A=sv(u),Bv=sv(w.map(x=>-x)),E=sv(n).map(v=>v*16),det=A[0]*Bv[1]-A[1]*Bv[0],eu=(Bv[1]*E[0]-Bv[0]*E[1])/det,ev=(-A[1]*E[0]+A[0]*E[1])/det,l=Math.hypot(eu,ev)||1;
[1,-1].forEach((sg,i)=>{const sa=-ev/l*sg,ha=eu/l*sg;set(sil[i],'d',pl([hp(-2,31*sa,-31*ha),hp(14,31*sa,-31*ha)]));});
frontRings.forEach(r=>set(r.n.parentNode,'transform',tf(r.t)));set(rimHi.parentNode,'transform',tf(14.2));
frontSp.forEach((p,i)=>{const a=rad(i*15);set(p,'d',pl(FR.map(([t,r])=>hp(t,r*Math.cos(a),r*Math.sin(a)))));});
set(badge,'transform',tf(19));
}
function tick(now){
const dt=Math.min(.05,(now-(lastT||now))/1000),red=reduced.matches,ts=now/1000;lastT=now;
const tk=speed/3;k+=(tk-k)*(red?1:clamp(dt/(tk>k?.9:2.2)));
if(!red)spin=(spin+(k*1150+(k>.01?40:0))*dt)%360;
if(osc&&k>.05&&!red)ph+=dt*(2*Math.PI/9)*(.4+.6*k);
const yT=osc?45+38*Math.sin(ph):yaw;yaw=red&&osc?45+38*Math.sin(ph):yT;
const pT=TILTS[ti];if(red){pitch=pT;pv=0;}else{pv+=(90*(pT-pitch)-14*pv)*dt;pitch+=pv*dt;}
head(now);
set(blades,'transform',`rotate(${f2(spin)})`);const bo=clamp((k-.38)/.5);blades.style.opacity=f2(1-bo*.55);disc0.style.opacity=f2(bo);
const kA=105-speed*40;knobA+=(kA-knobA)*(red?1:clamp(dt*16));set(kRot,'transform',`rotate(${f2(knobA)})`);
for(const rb of ribs){const pts=[],anchor=hp(14.5,31*Math.cos(rad(90+rb.a)),31*Math.sin(rad(90+rb.a))),N=9;let p=anchor;pts.push(p);
for(let i=1;i<=N;i++){const f=i/N,lift=clamp(k*1.25),flap=red?0:Math.sin(ts*(6+10*k)-i*.9+rb.a)*(.2+1.6*k)*f;
const dir=[0,1,2].map(j=>n[j]*lift*.95-w[j]*(1-lift*.85)+u[j]*flap*.85+w[j]*flap*.45*lift);const L=rb.L/N;p=p.map((v,j)=>v+dir[j]*L);pts.push(p);}
const d=pl(pts);set(rb.u,'d',d);set(rb.r,'d',d);}
for(const a of airs){set(a.n,'d',pl([hp(22,a.s,a.h),hp(40,a.s*1.1,a.h*1.08),hp(62,a.s*1.25,a.h*1.18-2)]));a.n.style.opacity=f2(clamp(k-.1)*.38);if(!red)a.n.style.strokeDashoffset=f2(-(ts*60*k+a.o)%20);}
if(ac){humG.gain.setTargetAtTime(k*.004,ac.currentTime,.2);airG.gain.setTargetAtTime(k*k*.045,ac.currentTime,.2);}
if(!lastUI||now-lastUI>150){
readout.textContent=`${speed?'SPEED '+speed:'OFF'} · ${Math.round(k*RPM[3])} RPM · OSC ${osc?'ON':'OFF'}`;
const side=yaw-45,dir=Math.abs(side)<3?'CENTER':`${Math.round(Math.abs(side))}° ${side>0?'LEFT':'RIGHT'}`;
stateLabel.textContent=!speed&&k<.02?`STILL · PRESS 1–3 · TILT ${TILTS[ti]}°`:!speed?'COASTING DOWN':Math.abs(k-tk)>.05?`SPINNING UP · TILT ${TILTS[ti]}°`:`${osc?'SWEEPING':'HOLDING'} · ${dir} · TILT ${TILTS[ti]}°`;
lastUI=now;}
requestAnimationFrame(tick);
}
head(0);requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['0', 'o'], draw }
