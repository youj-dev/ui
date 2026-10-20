// @ts-nocheck
/* TALVEN P–04 · Metronome. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#262626;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--ok:#15a65e;--warn:#e88a00;--metal:#d6d6d2;--metal-top:#efefec;--metal-side:#b4b4b1;--brass:#d8b45f;--brass-top:#ead08f;--brass-side:#b48f48;--scale:#d8d8d4;--rubber:#2f2f2e;--pad:#3a3a39;--felt:#5a5a58;--wood:#dcbd8f;--wood-tip:#b99566}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#1e1e1e;--off:#9b9b99;--ok:#36d886;--warn:#ffad2b;--metal:#b4b4b2;--metal-top:#e0e0dd;--metal-side:#7e7e7d;--brass:#b6974f;--brass-top:#dbc285;--brass-side:#7e6430;--scale:#b6b6b3;--rubber:#262625;--pad:#2f2f2f;--felt:#4b4b49;--wood:#b99f78;--wood-tip:#9b7d55;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.metal{fill:var(--metal)}.top.metal{fill:var(--metal-top)}.side.metal{fill:var(--metal-side)}.brass{fill:var(--brass)}.top.brass{fill:var(--brass-top)}.side.brass{fill:var(--brass-side)}.rubber{fill:var(--rubber)}.pad{fill:var(--pad)}.felt{fill:var(--felt)}.wood{fill:var(--wood)}.tip{fill:var(--wood-tip)}
.st{fill:var(--scale);font:4.4px ui-monospace,monospace;letter-spacing:.2px;stroke:none}.st.n{font-size:3px;letter-spacing:.5px;opacity:.75}.sl{stroke:var(--scale);stroke-width:.7;fill:none;vector-effect:non-scaling-stroke}
.lamp{fill:var(--off);stroke:var(--line);stroke-width:.35;vector-effect:non-scaling-stroke}.lamp.b{fill:var(--accent)}.lamp.g{fill:var(--ok)}.lamp.a{fill:var(--warn)}.lamp.b,.lamp.g,.lamp.a{filter:url(#glow);stroke:none}
.seg{fill:none;stroke:var(--off);stroke-width:2.4;stroke-linecap:round}.seg.b{stroke:var(--accent);filter:url(#glow)}.seg.d{stroke:var(--accent);opacity:.35}.seg.g{stroke:var(--ok);filter:url(#glow)}.seg.a{stroke:var(--warn);filter:url(#glow)}
.ripple{fill:none;stroke:var(--accent);stroke-width:1;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.bellglow{fill:var(--warn);opacity:0;filter:url(#bloom);pointer-events:none}.bring{fill:none;stroke:var(--warn);stroke-width:.8;opacity:0;vector-effect:non-scaling-stroke}
.control{cursor:pointer;outline:none}.slider{cursor:ns-resize;touch-action:none;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring,.slider:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="dome" cx=".35" cy=".3" r=".75"><stop offset="0" style="stop-color:var(--metal-top)"/><stop offset="1" style="stop-color:var(--metal-side)"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* TALVEN P–04. World: x lower-right, y lower-left, z up; 1 unit ≈ 1 mm.
Part                        x      y      z      w      d      h
felt feet (4)          14/116 14/106      0     10     10      3
plinth (two tiers)         10     10      3    120    110     21   badge, screws
pyramid case               20     20     24    100     90    208   top 54–86 × 49–81, sloped front and side
scale window          front face, v 20–186                         tempo numbers and names, beat lamps
pendulum + weight     pivot v 196, rod 186, weight 32–142 from pivot
run latch             front face, u 38–58, v 194–204
cap + finial               54     49    232     32     32      8   brass finial to z 252
side: gauge, key, escapement, bell + bar selector   on the sloped side face
practice pad          r 40   192 66      0      –      –     11   ring light (16 segments), rubber r 34
drumsticks (2)       150–236  34–98   11–17     –      –      –   resting across the pad
Sloped faces are true planes: origin, U along the top edge, V down the slope. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers: oriented planes, round parts on any axis, LEDs.
const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),mul=(a,s)=>a.map(v=>v*s),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=a=>mul(a,1/(Math.hypot(...a)||1)),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const plane=(o,U,V)=>`matrix(${P(...U).join(' ')} ${P(...V).join(' ')} ${P(...o).join(' ')})`;
function tube(a,b,r,cls){const ax=sub(b,a),n=unit(ax),U=unit(Math.abs(n[2])>.9?cross(n,[1,0,0]):cross([0,0,1],n));let V=cross(n,U),pu=P(...U),pv=P(...V);if(pu[0]*pv[1]-pu[1]*pv[0]<0){V=mul(V,-1);pv=P(...V);}const pd=P(...ax),det=pu[0]*pv[1]-pv[0]*pu[1],u=(pd[0]*pv[1]-pv[0]*pd[1])/det,v=(pu[0]*pd[1]-pd[0]*pu[1])/det,l=Math.hypot(u,v)||1,tx=-v*r/l,ty=u*r/l;el('path',{d:`M${tx},${ty}A${r},${r} 0 0 1 ${-tx},${-ty}L${u-tx},${v-ty}A${r},${r} 0 0 1 ${u+tx},${v+ty}Z`,transform:plane(a,U,V),class:'face '+cls});}
function lamp(g,x,y,r=1){const n=circle(g,x,y,r,'lamp');n._c='';return n;}
function lit(n,c,base='lamp'){if(n._c!==c){n._c=c;set(n,'class',base+(c?' '+c:''));}}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
// Plinth: felt feet, two tiers, badge.
const s1=P(72,68,0),s2=P(192,66,0);el('ellipse',{cx:s1[0],cy:s1[1]+4,rx:96,ry:36,class:'shadow stage-floor'});el('ellipse',{cx:s1[0],cy:s1[1]+4,rx:96,ry:36,class:'stage-contact'});el('ellipse',{cx:s2[0],cy:s2[1]+3,rx:52,ry:27,class:'shadow stage-floor'});el('ellipse',{cx:s2[0],cy:s2[1]+3,rx:52,ry:27,class:'stage-contact'});
for(const[x,y]of[[14,14],[116,14],[14,106],[116,106]])box(x,y,0,10,10,3,2,'felt');
box(10,10,3,120,110,9,3,'base');box(16,16,12,108,98,12,3);
const bf=group(FRONT(16,114,24));rect(bf,30,2.5,48,8,2,'face top brass');text(bf,54,8.2,'TALVEN','label brand center');for(const u of[6,102])screw(bf,u,6);
const bs=group(SIDE(124,114,24));slits(bs,10,3.5,78,5,22);
// Pyramid: sloped side and front as true planes, edges bevelled by an inner outline.
const LF=Math.hypot(29,208),VF=[0,29/LF,-208/LF],LS=Math.hypot(34,208),VS=[34/LS,0,-208/LS],OF=[54,81,232],OS=[86,81,232];
const sideG=group(plane(OS,[0,-1,0],VS)),frontG=group(plane(OF,[1,0,0],VF));
el('path',{d:`M0,0H32L61,${LS}H-29Z`,class:'face side'},sideG);el('path',{d:`M2.5,7H29.5L53,${LS-8}H-21Z`,class:'detail'},sideG);
el('path',{d:`M0,0H32L66,${LF}H-34Z`,class:'face'},frontG);el('path',{d:`M2.4,6.5H29.6L60.6,${LF-7}H-28.6Z`,class:'detail'},frontG);
// Side: spring gauge, winding key, escapement window, bar bell and selector.
circle(sideG,16,66,11.5,'face base');circle(sideG,16,66,9.4,'face glass');const gf=group('translate(16 66)',sideG);for(let i=0;i<7;i++){const a=(-120+i*40)*Math.PI/180;line(gf,Math.sin(a)*6.2,-Math.cos(a)*6.2,Math.sin(a)*7.8,-Math.cos(a)*7.8,'sl');}const gNeedle=group('',gf);line(gNeedle,0,1.6,0,-6.6,'detail');set(gNeedle.lastChild,'style','stroke:var(--accent);stroke-width:1');circle(gf,0,0,1.3,'face top metal');text(sideG,16,84,'SPRING','etch micro center');
circle(sideG,16,118,6.5,'face base');circle(sideG,16,118,4.2,'face metal');
const windG=button(group('translate(16 118)',sideG),{'aria-label':'Wind the spring (W)'});const key=group('rotate(-15)',windG);
el('path',{d:'M-3.4,-2.6L-10,-9Q-20,-12 -20,-4.5V4.5Q-20,12 -10,9L-3.4,2.6H3.4L10,9Q20,12 20,4.5V-4.5Q20,-12 10,-9L3.4,-2.6Z',class:'face brass'},key);rect(key,-16.5,-3,8,6,3,'face recess');rect(key,8.5,-3,8,6,3,'face recess');circle(key,0,0,3.8,'face top brass');circle(windG,0,0,23,'focus-ring');circle(windG,0,0,24,'hit');
circle(sideG,16,164,9.6,'face base');circle(sideG,16,164,7.6,'face glass');const gear=group('translate(16 164)',sideG);circle(gear,0,0,4.6,'detail');for(let i=0;i<12;i++){const a=i*Math.PI/6;line(gear,4.2*Math.cos(a),4.2*Math.sin(a),6.4*Math.cos(a),6.4*Math.sin(a));}circle(gear,0,0,1.5,'face metal');
const bellG=button(group('',sideG),{'aria-label':'Bar bell: beats per bar (B)'});const bellGlow=circle(bellG,44,182,14,'bellglow');circle(bellG,44,182,9.6,'face base');el('circle',{cx:44,cy:182,r:8.4,fill:'url(#dome)',class:'face'},bellG);circle(bellG,44,182,1.8,'face top metal');const bRing=[1,2].map(i=>circle(bellG,44,182,10+i*3,'bring'));
const BARS=[0,2,3,4,6];BARS.forEach((n,i)=>{const a=(-60+i*30)*Math.PI/180;text(bellG,30+Math.sin(a)*11,192-Math.cos(a)*11+1,String(n),'etch micro center');});const lever=group('',bellG);line(lever,30,192,30,184,'detail');set(lever.lastChild,'style','stroke:var(--accent);stroke-width:1.4');circle(bellG,30,192,1.8,'face top brass');rect(bellG,16,168,42,30,4,'focus-ring');rect(bellG,16,168,42,30,0,'hit');
// Front: scale window with tempo numbers and names, beat lamps, badge screws, run latch.
el('path',{d:`M8.5,18H23.5L35,186H-3Z`,class:'face base'},frontG);el('path',{d:`M10,21H22L32.6,183H-.6Z`,class:'face glass'},frontG);
const MIN=40,MAX=208,PV=196,ROD=186,radiusFor=b=>142-110*Math.log(b/MIN)/Math.log(MAX/MIN),bpmFor=r=>Math.round(MIN*Math.exp((142-clamp(r,32,142))*Math.log(MAX/MIN)/110));
const half=v=>6+(v-21)*(16.6/162);
for(const b of[40,46,52,58,63,69,76,84,92,100,108,116,126,138,152,168,184,200,208]){const v=PV-radiusFor(b),w=half(v),major=[40,52,63,76,92,108,126,152,184,208].includes(b);line(frontG,16-w+1.2,v,16-w+(major?4.4:2.8),v,'sl');line(frontG,16+w-1.2,v,16+w-(major?4.4:2.8),v,'sl');if(major)text(frontG,16-w+5.6,v+1.5,b,'st');}
for(const[n,b]of[['LARGO',48],['ADAGIO',70],['ANDANTE',92],['MODERATO',114],['ALLEGRO',140],['PRESTO',184]]){const v=PV-radiusFor(b);line(frontG,16+half(v)+2.4,v,16+half(v)+4,v);text(frontG,16+half(v)+5,v+1,n,'etch micro');}
const beatL=lamp(frontG,4,186,1.4),beatR=lamp(frontG,28,186,1.4);for(const[u,v]of[[4,10],[28,10],[-24,202],[56,202]])screw(frontG,u,v);
const runG=button(group('',frontG),{'aria-label':'Stop or start the pendulum (Space)','aria-pressed':'true'});rect(runG,38,194,20,10,3,'face recess');const latch=group('',runG);rect(latch,40,195.5,8,7,2,'face top');line(latch,42,197.6,46,197.6);line(latch,42,200.4,46,200.4);text(runG,48,191.4,'RUN','etch micro center');rect(runG,36,192,24,14,4,'focus-ring');rect(runG,34,190,28,20,0,'hit');
// Pendulum: a plane just in front of the face; the weight slides along the rod.
const pendG=group(plane(add(OF,[0,3.5,.5]),[1,0,0],VF)),pend=group('',pendG);
rect(pend,14.6,PV-ROD,2.8,ROD+3,1.4,'face metal');line(pend,16,PV-ROD+4,16,PV-8);circle(pend,16,PV-ROD,2.2,'face top brass');
const weight=group('',pend,{class:'slider',role:'slider',tabindex:'0','aria-label':'Tempo weight. Up arrow is faster, down arrow is slower; drag the weight up to slow down.','aria-orientation':'vertical','aria-valuemin':MIN,'aria-valuemax':MAX,'aria-valuenow':96,'aria-valuetext':'96 beats per minute'});
el('path',{d:'M3,-7H29L31,-4V8L29,11H3L1,8V-4Z',class:'face brass side',transform:'translate(-16 0)'},weight);rect(weight,-14,-8,26,17,2.4,'face brass');el('path',{d:'M-13,-8H11L13,-5H-14Z',class:'face top brass'},weight);for(const u of[-10,-7,6,9])line(weight,u,-2,u,5);rect(weight,-1.1,-6,2.2,13,.8,'face');set(weight.lastChild,'style','fill:var(--accent);stroke:none');rect(weight,-19,-13,38,28,4,'hit');rect(weight,-17,-11,34,24,4,'focus-ring');
circle(pendG,16,PV,7,'face base');circle(pendG,16,PV,4.8,'face top brass');screw(pendG,16,PV);
box(54,49,232,32,32,6,2.5);cylinder(70,65,238,6,3,'z','brass');cylinder(70,65,241,2.4,7,'z','brass');ellipse(70,65,250,3.6,'z','face top brass');
// Practice pad: base, beat ring light (16 segments), rubber surface; two drumsticks.
cylinder(192,66,0,40,7,'z','base');const ring=group(TOP(192,66,7.05));const SEG=[...Array(16)].map((_,i)=>{const a0=(i/16)*Math.PI*2+.06,a1=((i+1)/16)*Math.PI*2-.06;return el('path',{d:`M${37*Math.cos(a0)},${37*Math.sin(a0)}A37,37 0 0 1 ${37*Math.cos(a1)},${37*Math.sin(a1)}`,class:'seg'},ring);});SEG.forEach(s=>{s._c='';});
cylinder(192,66,7,34,4,'z','rubber');const padG=button(group(TOP(192,66,11.05)),{'aria-label':'Tap the practice pad and check your timing (P)'});const padS=group('',padG);circle(padS,0,0,33.8,'face pad');circle(padS,0,0,30,'detail');for(let x=-24;x<=24;x+=6)for(let y=-24;y<=24;y+=6)if(x*x+y*y<620)circle(padS,x,y,.3,'lamp');text(padS,0,27,'TALVEN · PRACTICE','etch micro center');const ripple=circle(padS,0,0,6,'ripple');circle(padG,0,0,40,'focus-ring');circle(padG,0,0,38,'hit');
for(const[a,b]of[[[160,40,13.4],[232,84,13.4]],[[164,96,14.6],[236,36,16.8]]]){const m=add(b,mul(unit(sub(b,a)),-9));tube(a,m,2,'wood');tube(m,b,1.5,'tip');}
frame([[10,10,0,120,110,24],[54,49,232,32,32,20],[22,74,200,10,10,24],[150,26,0,90,82,18],[110,40,60,32,60,90]],16);
// State: tempo, pendulum phase, spring, bell, pad timing; sound starts on a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),hk={};
document.querySelectorAll('.hint [data-k]').forEach(b=>{hk[b.dataset.k]=b;});
let bpm=96,running=true,reserve=.68,phase=0,angle=15,last=performance.now(),dragging=false,bar=0,beatAt=-1e9,beatDown=false,keyA=-15,keyFrom=-15,keyTo=-15,windAt=-1,tapAt=-1,tapCls='',notice='',noticeT=0,lastUI=0,ac=null,buf=null,lastBeat=-1;
const tempoName=b=>b<60?'LARGO':b<66?'LARGHETTO':b<76?'ADAGIO':b<108?'ANDANTE':b<120?'MODERATO':b<168?'ALLEGRO':b<200?'PRESTO':'PRESTISSIMO';
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();buf=ac.createBuffer(1,Math.floor(ac.sampleRate*.028),ac.sampleRate);const d=buf.getChannelData(0);let n=71;for(let i=0;i<d.length;i++){n=(n*16807)%2147483647;d[i]=(n/1073741824-1)*Math.exp(-i/(ac.sampleRate*.006));}}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){}}
function clickSound(pad){if(!ac||ac.state!=='running')return;try{const t=ac.currentTime,g=ac.createGain(),f=ac.createBiquadFilter(),s=ac.createBufferSource();g.gain.setValueAtTime(pad?.085:.055,t);g.gain.exponentialRampToValueAtTime(.0001,t+.045);f.type=pad?'lowpass':'highpass';f.frequency.value=pad?850:1700;s.buffer=buf;s.playbackRate.value=pad?.55:1;s.connect(f);f.connect(g);g.connect(ac.destination);s.start(t);}catch(_){}}
function ding(){if(!ac||ac.state!=='running')return;try{const t=ac.currentTime;for(const[f,v]of[[2400,.02],[3720,.008]]){const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+.6);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+.62);}}catch(_){}}
const say=m=>{announcement.textContent=m;};
function status(m,ms=1100){notice=m;noticeT=performance.now()+ms;ui();}
function ui(){readout.textContent=`${bpm} BPM · ${tempoName(bpm)}`;const sp=Math.ceil(reserve*100)+'% SPRING',bl=bar?` · BELL ${bar}`:'';
stateLabel.textContent=performance.now()<noticeT?notice:dragging?'SETTING TEMPO · '+sp:!running?(reserve<=0?'SPRING EMPTY · W TO WIND':'STOPPED · '+sp+bl):'RUNNING · '+sp+bl;
set(weight,'aria-valuenow',bpm);set(weight,'aria-valuetext',`${bpm} beats per minute, ${tempoName(bpm).toLowerCase()}`);set(runG,'aria-pressed',running);set(hk[' '],'aria-pressed',running);set(latch,'transform',`translate(${running?8:0} 0)`);
set(gNeedle,'transform',`rotate(${(-120+reserve*240).toFixed(1)})`);set(weight,'transform',`translate(16 ${(PV-radiusFor(bpm)).toFixed(2)})`);set(lever,'transform',`rotate(${-60+BARS.indexOf(bar)*30} 30 192)`);}
function toggle(){audio();noticeT=0;if(!running&&reserve<=0){status('WIND THE SPRING · W',1600);say('Spring empty. Press W to wind.');return;}running=!running;last=performance.now();ui();say(running?`Started at ${bpm} beats per minute.`:'Pendulum stopped.');}
function tempo(v){audio();bpm=clamp(Math.round(v),MIN,MAX);noticeT=0;ui();say(`${bpm} beats per minute, ${tempoName(bpm).toLowerCase()}.`);}
function wind(){audio();reserve=clamp(reserve+.24);keyFrom=keyA;keyTo+=150;windAt=performance.now();if(ac)for(let i=0;i<4;i++)setTimeout(()=>clickSound(true),i*90);status(reserve>=1?'FULLY WOUND · 100% SPRING':`WINDING · ${Math.ceil(reserve*100)}% SPRING`,1000);say(`Spring wound to ${Math.ceil(reserve*100)} percent.`);}
function bell(){audio();bar=BARS[(BARS.indexOf(bar)+1)%BARS.length];status(bar?`BELL ON BEAT 1 OF ${bar}`:'BELL OFF',1200);say(bar?`Bell rings on the first of every ${bar} beats.`:'Bell off.');}
function tap(){audio();tapAt=performance.now();clickSound(true);
if(running){const tp=phase+Math.max(0,(tapAt-last)/1000)*bpm/60,ms=Math.round((tp-Math.round(tp))*60000/bpm),lab=Math.abs(ms)<=45?'ON BEAT':ms<0?'EARLY':'LATE';tapCls=lab==='ON BEAT'?'g':'a';status(`${lab} · ${ms>0?'+':''}${ms} ms`,1500);say(`${lab.toLowerCase()}, ${Math.abs(ms)} milliseconds ${ms<0?'early':'late'}.`);}
else{tapCls='b';status('PAD TAP · START WITH SPACE',1300);say('Pad tapped. Start the metronome with Space.');}}
bind(runG,toggle);bind(windG,wind);bind(padG,tap);bind(bellG,bell);
const act={' ':toggle,w:wind,p:tap,b:bell};for(const[k,b]of Object.entries(hk))b.addEventListener('click',()=>act[k]());
weight.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();audio();dragging=true;angle=0;set(pend,'transform','');weight.focus({preventScroll:true});weight.setPointerCapture(e.pointerId);status('SLIDE THE WEIGHT · UP IS SLOWER',3000);});
weight.addEventListener('pointermove',e=>{if(!dragging)return;const pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;tempo(bpmFor(PV-pt.matrixTransform(pend.getScreenCTM().inverse()).y));});
const endDrag=()=>{if(!dragging)return;dragging=false;noticeT=0;ui();};weight.addEventListener('pointerup',endDrag);weight.addEventListener('pointercancel',endDrag);weight.addEventListener('lostpointercapture',endDrag);
weight.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)toggle();}else if(e.key==='Home'||e.key==='End'){e.preventDefault();tempo(e.key==='Home'?MIN:MAX);}});
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.toLowerCase();if(k===' '&&e.target.closest&&e.target.closest('button'))return;const a=k==='arrowup'?()=>tempo(bpm+2):k==='arrowdown'?()=>tempo(bpm-2):act[k];if(a){e.preventDefault();if(!e.repeat||k.startsWith('arrow'))a();}});
document.addEventListener('visibilitychange',()=>{last=performance.now();});
function tick(now){const dt=clamp((now-last)/1000,0,.25),red=reduced.matches;last=now;
if(running&&!dragging){phase+=dt*bpm/60;reserve=Math.max(0,reserve-dt/1500);const bi=Math.floor(phase);if(bi!==lastBeat){lastBeat=bi;beatAt=now;beatDown=bar>0&&bi%bar===0;clickSound();if(beatDown)ding();}if(reserve<=0){running=false;noticeT=0;say('Spring empty. Press W to wind.');ui();}}
const tgt=running&&!dragging?15*Math.cos(phase*Math.PI):0;angle=red||dragging?0:angle+(tgt-angle)*Math.min(1,dt*24);if(!dragging)set(pend,'transform',`rotate(${angle.toFixed(2)} 16 ${PV})`);
const side=Math.floor(phase)%2,since=now-beatAt,flash=running&&since<140;lit(beatL,running&&side===0?'b':'');lit(beatR,running&&side===1?'b':'');
set(gear,'transform',`translate(16 164) rotate(${red?0:(phase*30).toFixed(1)})`);
const ringOn=beatDown&&since<600,bf=ringOn?Math.max(0,1-since/600):0;bellGlow.style.opacity=(bf*.6).toFixed(2);bRing.forEach((r,i)=>{r.style.opacity=(bf*(1-i*.4)).toFixed(2);set(r,'r',(10+i*3+(1-bf)*6).toFixed(1));});
const tp=tapAt<0?1:clamp((now-tapAt)/500),frac=phase%1,tapping=tp<1;
SEG.forEach((s,i)=>lit(s,tapping?tapCls:flash?(beatDown?'g':'b'):running&&!red&&i<frac*16?'d':'','seg'));
const press=red?0:Math.sin(tp*Math.PI)*1.2;set(padS,'transform',`translate(${press.toFixed(2)} ${press.toFixed(2)})`);set(ripple,'r',(red?28:6+tp*30).toFixed(1));ripple.style.opacity=tapping?(red?.5:1-tp).toFixed(2):0;
if(windAt>=0){const t=clamp((now-windAt)/480);keyA=red?keyTo:keyFrom+(keyTo-keyFrom)*(1-Math.pow(1-t,3));set(key,'transform',`rotate(${keyA.toFixed(1)})`);if(t===1)windAt=-1;}
if(now-lastUI>100){ui();lastUI=now;}requestAnimationFrame(tick);}
ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [' ', 'w', 'p', 'b'], draw }
