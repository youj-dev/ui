// @ts-nocheck
/* ARC 7 · Home router. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--screen:#1d1f20;--bezel:#2e3031;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b3b3af;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--wood:#e2d7c4;--wood-top:#f0e8da;--wood-side:#cdbfa8;--grain:#d3c6b0;--phone:#2f3133;--fabric:#cfcfca;--fabric-top:#e2e2dd;--jacket:#f4f4f0;--fiber:#e0c24a;--ui:#d9dcdf}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--screen:#171819;--bezel:#252727;--off:#969694;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--wood:#beb5a5;--wood-top:#e1d9cc;--wood-side:#908676;--grain:#b2a794;--phone:#262829;--fabric:#aeaeab;--fabric-top:#d3d3cf;--jacket:#cececb;--fiber:#bda33d;--ui:#b7b9bb;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.screen{fill:var(--screen)}.bz{fill:var(--bezel)}.wood{fill:var(--wood)}.wood.top{fill:var(--wood-top)}.wood.side{fill:var(--wood-side)}.ph{fill:var(--phone)}.fab{fill:var(--fabric)}.fab.top{fill:var(--fabric-top)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.grain{fill:none;stroke:var(--grain);stroke-width:.6;vector-effect:non-scaling-stroke}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:5px;letter-spacing:1.4px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.end{text-anchor:end}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.lamp{fill:var(--off);stroke:none}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.r{fill:var(--fault)}.lamp.b{fill:var(--accent)}.lamp.g,.lamp.a,.lamp.r,.lamp.b{filter:url(#glow)}
.cu{fill:none;stroke:var(--line);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round}.cm{fill:none;stroke:var(--jacket);stroke-width:1.6;stroke-linecap:round;stroke-linejoin:round}.fib .cu{stroke-width:2}.fib .cm{stroke:var(--fiber);stroke-width:1.1}.fibre{fill:var(--fiber)}
.ui{fill:var(--ui);font:3px ui-monospace,monospace;letter-spacing:.3px;stroke:none}.ui.b{font-weight:700;font-size:3.6px}.ui.acc{fill:var(--accent)}.uib{fill:var(--ui);opacity:.18;stroke:none}.uip{fill:var(--accent);stroke:none}.uil{fill:none;stroke:var(--ui);stroke-width:.5;vector-effect:non-scaling-stroke;stroke-linecap:round;opacity:.6}
.ripple{fill:none;stroke:var(--accent);stroke-width:.9;vector-effect:non-scaling-stroke;opacity:0;transform-box:fill-box;transform-origin:center;animation:ripple 3.6s ease-out infinite;animation-play-state:paused}.wifi .ripple{animation-play-state:running}
.sig{fill:none;stroke:var(--accent);stroke-width:1.1;stroke-linecap:round;stroke-dasharray:1.6 6.4;opacity:0;transition:opacity .4s;animation:dash .9s linear infinite}.on .sig{opacity:.85}.on.dead .sig{opacity:.3;animation:none;stroke:var(--muted)}
.gdot{fill:var(--off)}.on .gdot{fill:var(--accent)}.on.dead .gdot{fill:var(--warn)}.arc{fill:none;stroke:var(--off);stroke-width:1.3;stroke-linecap:round;transition:stroke .2s}.on .arc{stroke:var(--accent)}.on.dead .arc{stroke:var(--warn)}.joining .arc{animation:join 1s steps(1) infinite}.joining .a2{animation-delay:.25s}.joining .a3{animation-delay:.5s}
.seg{fill:none;stroke:var(--off);stroke-width:1.5;stroke-linecap:round}.playing .seg{stroke:var(--accent);filter:url(#glow);animation:pulse 1.1s ease-in-out infinite alternate}.spin .segs{animation:spin 1s linear infinite;transform-box:fill-box;transform-origin:center}.spin .seg:nth-child(odd){stroke:var(--accent)}
.wave{fill:none;stroke:var(--accent);stroke-width:.9;stroke-linecap:round;opacity:0}.playing .wave{animation:wave 1.4s ease-out infinite}.playing .w2{animation-delay:.7s}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
@keyframes ripple{0%{opacity:.55;transform:scale(1)}100%{opacity:0;transform:scale(7.5)}}@keyframes dash{to{stroke-dashoffset:-8}}@keyframes join{0%{stroke:var(--accent)}50%{stroke:var(--off)}}@keyframes pulse{to{opacity:.45}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes wave{0%{opacity:.8;transform:translateY(0)}100%{opacity:0;transform:translateY(-6px)}}
@media(prefers-reduced-motion:reduce){.wifi .ripple:first-child{opacity:.4;transform:scale(3)}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = ``

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* World coordinates: x lower-right; y lower-left; z up. Units ≈ 3 mm.
Part x y z w d h
console slab 0 0 -8 244 96 8
laptop base + keyboard 4 30 0 84 56 4
laptop lid (15° back) 4 14.7 4 84 16.3 52
router body + top grille 100 12 0 68 44 12
antennas (4) 104.5 9 9 55 4 45
router ports (side) 168 12 2 0 44 9
ethernet ONT → router 168 26 1.5 14 10 6
fiber ONT on foot 178 8 0 16 40 32.4
fiber + SC connector (front) 184 44 -2.6 62 26 7
smart speaker 204 18 0 32 32 46
phone (flat) 104 64 0 48 24 2.6
signal paths + glyphs 60 10 8 170 80 60
Keys, LEDs, labels, screens and the fabric rings share their parent face. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: draw into a group, free planes, smooth cables, Wi-Fi arcs.
function into(g,fn){const n=root.childNodes.length;fn();while(root.childNodes.length>n)g.appendChild(root.childNodes[n]);return g;}
const proj=(x,y,z)=>[(x-y)*C,(x+y)*S-z];
const plane=(o,u,v)=>{const a=proj(...u),b=proj(...v);return`matrix(${a[0]} ${a[1]} ${b[0]} ${b[1]} ${P(...o).join(' ')})`;};
const f2=v=>v.toFixed(2);
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
const arcD=(r,a=50)=>{const s=Math.sin(a*Math.PI/180)*r,c=Math.cos(a*Math.PI/180)*r;return`M${f2(-s)},${f2(-c)}A${r},${r} 0 0 1 ${f2(s)},${f2(-c)}`;};
function glyph(g,s=1){circle(g,0,0,.9*s,'gdot');['a1','a2','a3'].forEach((k,i)=>el('path',{d:arcD((2.4+i*2.2)*s),class:`arc ${k}`},g));}
const halfRing=(r)=>`M${f2(r*.7071)},${f2(-r*.7071)}A${r},${r} 0 0 1 ${f2(-r*.7071)},${f2(r*.7071)}`;
// Console slab with grain; Wi-Fi ripples spread across it.
const sp=P(122,52,-8);el('ellipse',{cx:sp[0],cy:sp[1]+6,rx:150,ry:52,class:'shadow stage-floor'});el('ellipse',{cx:sp[0],cy:sp[1]+6,rx:150,ry:52,class:'stage-contact'});
box(0,0,-8,244,96,8,4,'wood');
const slab=group(TOP(0,0,0));for(const[v,a,b]of[[8,6,90],[22,30,200],[41,4,120],[58,140,238],[77,10,150],[88,170,236]])el('path',{d:`M${a},${v} Q${(a+b)/2},${v+1.6} ${b},${v}`,class:'grain'},slab);
const rip=group(TOP(134,34,.2));for(let i=0;i<3;i++)el('circle',{cx:0,cy:0,r:10,class:'ripple',style:`animation-delay:${i*1.2}s`},rip);
// Laptop: base, keyboard, trackpad, lid on a 15° free plane.
box(4,30,0,84,56,4,3,'');
const kb=group(TOP(4,30,4));rect(kb,6,4,72,25,2,'face recess');
for(let r=0;r<4;r++)for(let c=0;c<12;c++)rect(kb,7.4+c*5.95,5.4+r*5.6,4.9,4.4,.9,'face top');
rect(kb,28,33,28,18,2,'face glass');
const lapF=group(FRONT(4,86,4));rect(lapF,36,.6,12,1.6,.8,'face recess');const chg=circle(lapF,72,2,.6,'lamp');
const lapS=group(SIDE(88,86,4));rect(lapS,14,1,4.6,1.8,.8,'face recess');rect(lapS,21,1,4.6,1.8,.8,'face recess');
const A=15*Math.PI/180,sa=Math.sin(A),ca=Math.cos(A),TL=[4,31-54*sa,4+54*ca],th=2.4;
wire([[88,31,4],[88,TL[1],TL[2]],[88,TL[1]-th*ca,TL[2]-th*sa],[88,31-th*ca,4-th*sa]],'face side').setAttribute('d',poly([[88,31,4],[88,TL[1],TL[2]],[88,TL[1]-th*ca,TL[2]-th*sa],[88,31-th*ca,4-th*sa]],true));
el('path',{d:poly([[4,TL[1],TL[2]],[88,TL[1],TL[2]],[88,TL[1]-th*ca,TL[2]-th*sa],[4,TL[1]-th*ca,TL[2]-th*sa]],true),class:'face top'});
const lid=group(plane(TL,[1,0,0],[0,sa,-ca]));
rect(lid,0,0,84,54,3,'face bz');rect(lid,3,3.4,78,45,1.4,'face screen');circle(lid,42,1.7,.5,'face recess');text(lid,42,51.6,'ARCBOOK','etch micro center');
rect(lid,3,3.4,78,4.4,0,'uib');for(const x of[6,9,12])circle(lid,x,5.6,.8,'uib');
const lapT1=text(lid,8,15.2,'','ui b'),lapT2=text(lid,8,20.4,'','ui'),lapBarBg=rect(lid,8,25,58,2.2,1.1,'uib'),lapBar=rect(lid,8,25,0,2.2,1.1,'uip');
const lapRows=[0,1,2].map(k=>{const n=text(lid,8,33.6+k*4.4,'','ui');rect(lid,8,35+k*4.4,48,.1,0,'uib');return n;});
const lapG=group('translate(70 18) scale(1.7)',lid);glyph(lapG);
// Router: body, top grille and status bar, front LEDs, side ports, four antennas.
box(102,14,0,64,40,1.4,1,'base');box(100,12,1.4,68,44,10.6,5,'');
const rt=group(TOP(100,12,12));rect(rt,6,5,56,26,4,'face recess');slits(rt,9,7,50,22,18);text(rt,34,37,'ARC 7','etch center');const rbar=rect(rt,22,39.6,24,1.6,.8,'lamp');
const rf=group(FRONT(100,56,12));text(rf,6,7.6,'ARC','label brand');
const rLed=['PWR','WAN','2.4','5','6','LAN'].map((n,k)=>{text(rf,30+k*6.4,9.4,n,'etch micro center');return circle(rf,30+k*6.4,5,.95,'lamp');});
const rs=group(SIDE(168,56,12));circle(rs,6,5.8,1.7,'face recess');circle(rs,10.6,5.8,.6,'face recess');rect(rs,13.6,4.6,5,2.4,.8,'face recess');
for(const[u,c]of[[23,'face base'],[29.6,'face recess'],[35.8,'face recess']]){rect(rs,u,2.4,5.2,6.4,.6,c);rect(rs,u+.8,3.4,3.6,3.6,.4,'face screen');}
text(rs,25.6,10.9,'WAN','etch micro center');text(rs,35.4,10.9,'LAN','etch micro center');text(rs,16,10.9,'USB','etch micro center');
for(const a of[108,124,140,156]){box(a-3.5,9,8,7,4,6,1.6,'base');box(a-3,9.4,14,6,2.8,40,2.8,'');const f=group(FRONT(a-3,12.2,54));line(f,3,4,3,34);}
// Ethernet from the ONT (left side port) to the router WAN port, then the ONT.
const eth=smooth([[181.5,22,7.5],[177,30,2.2],[172.6,31,2],[170.4,30.6,5.6]]);el('path',{d:eth,class:'cu'});el('path',{d:eth,class:'cm'});
box(168,28.8,3.6,2.4,3.4,4,.6,'base');
box(178,8,0,16,40,2.4,1.2,'base');box(181,12,2.4,10,32,30,3,'');
const of=group(FRONT(181,44,32.4));const oLed=['PWR','PON','LOS','LAN'].map((n,k)=>{text(of,3.6,6.2+k*4.6,n,'etch micro');return circle(of,2,5.2+k*4.6,.8,'lamp');});text(of,5,27,'ONT','etch center');
const osd=group(SIDE(191,44,32.4));slits(osd,4,3,20,10,8);text(osd,14,17.4,'GPON · 2.5G','etch micro center');
// Smart speaker: fabric body with rings, top cap with LED ring and waves; the phone in front.
cylinder(220,34,0,16,44,'z','fab');
for(const z of[8,16,24,32,40])el('path',{d:halfRing(16),class:'detail',transform:TOP(220,34,z),opacity:.35});
const cap=group(TOP(220,34,44));circle(cap,0,0,16,'face top');circle(cap,0,0,14.4,'face');
const spk=el('g',{},cap),segs=el('g',{class:'segs'},spk);for(let i=0;i<12;i++){const a=i*30*Math.PI/180,b=(i*30+18)*Math.PI/180;el('path',{d:`M${f2(10.5*Math.cos(a))},${f2(10.5*Math.sin(a))}A10.5,10.5 0 0 1 ${f2(10.5*Math.cos(b))},${f2(10.5*Math.sin(b))}`,class:'seg'},segs);}
for(const[x,y,t]of[[-4.4,0,'−'],[4.4,0,'+']])text(cap,x,y+1.2,t,'label center');circle(cap,0,-4.6,.8,'face recess');
const waves=group('');for(const[k,c]of[[0,'w1'],[1,'w2']])el('path',{d:`M${f2(P(214,28,50+k*5)[0])},${f2(P(214,28,50+k*5)[1])}Q${f2(P(220,34,56+k*5)[0])},${f2(P(220,34,56+k*5)[1]-3)} ${f2(P(226,40,50+k*5)[0])},${f2(P(226,40,50+k*5)[1])}`,class:`wave ${c}`},waves);
const fib=el('g',{class:'fib'});into(fib,()=>{box(184.4,44,3.2,3.4,3.6,3.2,.6,'fibre');const d=smooth([[186.1,47.6,4.8],[187.4,54,1],[200,62,.8],[226,66,.8],[243,69,.8],[245.6,69.6,-2.6]]);el('path',{d,class:'cu'});el('path',{d,class:'cm'});});
box(104,64,0,48,24,2.6,4,'ph');
const ps=group(TOP(105.4,65.4,2.6));rect(ps,0,0,45.2,21.2,2.8,'face screen');
const phT=text(ps,4,9,'9:41','ui b'),phD=text(ps,4,13.2,'MON 6 OCT','ui');rect(ps,36.6,2.4,5,2.2,.5,'uil');rect(ps,37.1,2.9,3.4,1.2,.2,'uip');
const phG=group('translate(31.8 4.4) scale(.55)',ps);glyph(phG);
const card=group('',ps,{opacity:0});rect(card,17,8,25.4,9.4,1.6,'uib');text(card,19,12,'PHOTOS','ui b');text(card,19,15.6,'14 SYNCED','ui acc');
// Signal paths and device glyphs, drawn over the scene.
const SRC=P(124,10.8,55),devs=[];
for(const[k,name,tgt,lift]of[[0,'Laptop',P(70,22,62),18],[1,'Phone',P(128,76,12),-6],[2,'Speaker',P(220,34,62),20]]){
const g=el('g',{class:'dev'}),mx=(SRC[0]+tgt[0])/2,my=Math.min(SRC[1],tgt[1])-lift;
el('path',{d:`M${f2(SRC[0])},${f2(SRC[1])}Q${f2(mx)},${f2(my)} ${f2(tgt[0])},${f2(tgt[1])}`,class:'sig'},g);
const gl=group(`translate(${f2(tgt[0])} ${f2(tgt[1]-2)})`,g);if(k!==1)glyph(gl,1.1);
devs.push({k,name,g,st:'on',t0:0});
}
devs[0].ui=lapG;devs[1].ui=phG;
const ctl=[['Laptop (1)',[4,14,0,84,72,58]],['Phone (2)',[104,64,0,48,24,3]],['Speaker (3)',[204,18,0,32,32,46]]].map(([n,b],k)=>{const g=el('g',{class:'control',role:'button',tabindex:'0','aria-label':`Join or drop ${n}`,'aria-pressed':'true'});const[x,y,z,w,d,h]=b,hx=poly([[x,y,z+h],[x+w,y,z+h],[x+w,y,z],[x+w,y+d,z],[x,y+d,z],[x,y+d,z+h]],true);el('path',{d:hx,class:'hit'},g);el('path',{d:hx,class:'focus-ring'},g);return g;});
frame([[0,0,-8,244,96,8],[4,14,0,84,72,60],[100,9,0,68,47,54],[204,18,0,32,32,60]],18);
// State: devices join/drop, fiber link, router reboot, traffic.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
let rState='up',rT0=0,fiber='up',fT0=0,mbps=0,lastUI=0,flashMsg='',flashUntil=0,dl=.18,audio=null;
function ac(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!audio)audio=new A();if(audio.state==='suspended')audio.resume().catch(()=>{});}catch(_){}}
function chime(f,at=0){if(!audio)return;try{const o=audio.createOscillator(),v=audio.createGain(),t=audio.currentTime+at;o.type='sine';o.frequency.setValueAtTime(f,t);v.gain.setValueAtTime(0,t);v.gain.linearRampToValueAtTime(.025,t+.01);v.gain.exponentialRampToValueAtTime(.0001,t+.35);o.connect(v);v.connect(audio.destination);o.start(t);o.stop(t+.4);}catch(_){}}
function say(m){announcement.textContent=m;}
function flash(m){flashMsg=m;flashUntil=performance.now()+1500;lastUI=0;}
function lamp(n,c){if(n._c!==c){n._c=c;set(n,'class','lamp'+(c?' '+c:''));}}
const wifiUp=now=>rState==='up'||(rState==='boot'&&now-rT0>2800),online=now=>wifiUp(now)&&fiber==='up'&&(rState==='up'||now-rT0>2400);
function toggleDev(k){
ac();const d=devs[k],now=performance.now();
if(d.st==='off'){if(!wifiUp(now)){flash('WI-FI NOT READY');return;}d.st='join';d.t0=now;flash(`${d.name.toUpperCase()} JOINING`);say(`${d.name} joining ARC 7.`);}
else{d.st='off';flash(`${d.name.toUpperCase()} DISCONNECTED`);say(`${d.name} disconnected.`);chime(440);}
set(ctl[k],'aria-pressed',d.st!=='off');lastUI=0;
}
function fiberToggle(){
ac();const now=performance.now();
if(fiber==='up'){fiber='los';flash('FIBER UNPLUGGED');say('Fiber link lost. Internet offline.');chime(300);}
else{fiber='sync';fT0=now;flash('FIBER RECONNECTED');say('Fiber reconnected. Syncing.');}
set(fib,'transform',fiber==='los'?`translate(${f2(-5*C)} ${f2(5*S)})`:'');lastUI=0;
}
function reboot(){ac();if(rState==='boot'){flash('ALREADY REBOOTING');return;}rState='boot';rT0=performance.now();for(const d of devs)if(d.st!=='off'){d.st='lost';}flash('REBOOTING');say('Router rebooting. Devices will reconnect.');lastUI=0;}
function tick(now){
const T=reduced.matches?1e9:now-rT0;
if(rState==='boot'&&T>4200){rState='up';say('Router back online.');}
if(rState==='boot'&&T>2800)devs.forEach((d,i)=>{if(d.st==='lost'&&T>3000+i*500){d.st='join';d.t0=now;}});
if(fiber==='sync'&&(reduced.matches||now-fT0>1600)){fiber='up';chime(880);chime(1320,.12);}
const wf=wifiUp(now),onl=online(now);
devs.forEach((d,i)=>{
if(d.st==='join'&&(reduced.matches||now-d.t0>1200)){d.st='on';chime(660+i*110);say(`${d.name} connected.`);}
const on=d.st==='on'&&wf;d.g.classList.toggle('on',on);d.g.classList.toggle('dead',on&&!onl);d.g.classList.toggle('joining',d.st==='join');
});
svg.classList.toggle('wifi',wf);
const sp=devs[2],playing=sp.st==='on'&&onl;spk.classList.toggle('playing',playing);spk.classList.toggle('spin',sp.st==='join');waves.classList.toggle('playing',playing);
const boot=rState==='boot',blink=p=>reduced.matches||(now/p|0)%2,traffic=onl&&devs.some(d=>d.st==='on');
lamp(rLed[0],boot&&T<2400?(T<400?'':blink(220)?'a':''):'g');
lamp(rLed[1],boot&&T<2400?'':fiber==='up'?'g':fiber==='sync'?(blink(160)?'a':''):'a');
for(const[k,dv]of[[2,2],[3,0],[4,1]])lamp(rLed[k],wf?(devs[dv].st==='on'&&onl&&!reduced.matches&&Math.random()<.25?'':'g'):'');
lamp(rLed[5],boot&&T<2400?'':traffic&&!reduced.matches&&Math.random()<.3?'':'g');
lamp(rbar,boot?(T<400?'':blink(300)?'a':''):!onl?'a':'b');
lamp(oLed[0],'g');lamp(oLed[1],fiber==='up'?'g':fiber==='sync'?(blink(140)?'g':''):'');lamp(oLed[2],fiber==='los'?(blink(500)?'r':''):'');lamp(oLed[3],boot&&T<2400?'':traffic&&!reduced.matches&&Math.random()<.3?'':'g');
lamp(chg,'g');
if(flashUntil&&now>flashUntil){flashUntil=0;lastUI=0;}
if(!lastUI||now-lastUI>200){
const lap=devs[0],ph=devs[1];
const target=onl?(lap.st==='on'?610+Math.random()*60:0)+(ph.st==='on'?35+Math.random()*25:0)+(sp.st==='on'?.32:0):0;mbps+=(target-mbps)*.45;if(!target&&mbps<.5)mbps=0;
const n=devs.filter(d=>d.st==='on'&&wf).length;
readout.textContent=`${n} DEVICE${n===1?'':'S'} · ${mbps>=10?Math.round(mbps):mbps.toFixed(1)} Mb/s`;
const st=boot?(T<2400?'REBOOTING · POWER-ON SELF TEST':T<2800?'REBOOTING · WAN UP':'REBOOTING · WI-FI UP'):fiber==='los'?'FIBER LOS · OFFLINE':fiber==='sync'?'SYNCING FIBER':`ONLINE · ${n?'WI-FI 7 · 3 BANDS':'NO CLIENTS'}`;
stateLabel.textContent=flashUntil?flashMsg:st;
if(lap.st==='on'&&onl){dl=(dl+.012)%1;lapT1.textContent='DOWNLOADING';lapT2.textContent=`${Math.round(mbps*.94)} Mb/s · ${Math.round(dl*100)}%`;set(lapBar,'width',58*dl);set(lapBarBg,'opacity',1);['scene-04.mov  2.1 GB','scene-05.mov  1.8 GB','grade-v3.cube 4 MB'].forEach((t,k)=>lapRows[k].textContent=t);}
else{const msg=lap.st==='join'?['JOINING ARC 7','WPA3 · 6 GHz']:lap.st==='on'||lap.st==='lost'?['NO INTERNET',boot?'ROUTER REBOOTING':'CHECK FIBER']:['NOT CONNECTED','PRESS 1 TO JOIN'];lapT1.textContent=msg[0];lapT2.textContent=msg[1];set(lapBar,'width',0);set(lapBarBg,'opacity',0);lapRows.forEach(r=>r.textContent='');}
set(card,'opacity',ph.st==='on'&&onl&&(now/2600|0)%2?1:0);phD.textContent=ph.st==='on'&&wf?(onl?'ARC 7 · 6 GHz':'NO INTERNET'):ph.st==='join'?'JOINING…':'MON 6 OCT';
for(const d of devs)if(d.ui){d.ui.classList.toggle('on',d.st==='on'&&wf);d.ui.classList.toggle('dead',d.st==='on'&&wf&&!onl);d.ui.classList.toggle('joining',d.st==='join');}
lastUI=now;
}
requestAnimationFrame(tick);
}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();if(!e.repeat)fn();}});}
ctl.forEach((g,k)=>bind(g,()=>toggleDev(k)));
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;
const k=e.key.toLowerCase();
const action={'1':()=>toggleDev(0),'2':()=>toggleDev(1),'3':()=>toggleDev(2),f:fiberToggle,r:reboot}[k];
if(action){e.preventDefault();action();}
});
requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [

], svgClass: 'wifi', draw }
