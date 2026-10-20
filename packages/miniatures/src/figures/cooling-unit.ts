// @ts-nocheck
/* NIVALIS PX–30 · Precision cooling. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b3b3af;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--rack:#3d3f40;--rack-top:#525456;--rack-side:#313334;--tile:#ecebe6;--slab:#c9c8c3;--conc:#a9a8a3;--void:#5f6062;--ped:#8e9092;--screen:#0d1a24;--cold:#3c8dff;--hot:#ff8a2a;--crac:#e9eae7;--crac-top:#f7f7f6;--crac-side:#d0d1ce}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#969694;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--rack:#323334;--rack-top:#4c4e50;--rack-side:#202121;--tile:#c7c6c3;--slab:#a9a8a5;--conc:#8e8d8a;--void:#4f5051;--ped:#77787a;--screen:#09141d;--cold:#5aa2ff;--hot:#ff9a40;--crac:#c4c5c3;--crac-top:#e7e7e6;--crac-side:#939392;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:4.6px;letter-spacing:1.4px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.rack{fill:var(--rack)}.top.rack{fill:var(--rack-top)}.side.rack{fill:var(--rack-side)}.crac{fill:var(--crac)}.top.crac{fill:var(--crac-top)}.side.crac{fill:var(--crac-side)}.tile{fill:var(--tile)}.slab{fill:var(--slab)}.conc{fill:var(--conc)}.void{fill:var(--void)}.ped{fill:var(--ped)}.screen{fill:var(--screen)}
.grid{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.55}.perf{fill:url(#perf)}.mesh{fill:url(#mesh)}
.stream{fill:none;stroke-linecap:round;stroke-dasharray:2.2 5.4;opacity:0;filter:url(#glow)}.cold{stroke:var(--cold)}.hot{stroke:var(--hot)}
.led>.core{fill:var(--off)}.led>.halo{opacity:0;filter:url(#soft)}.on>.core{fill:var(--c)}.on>.halo{fill:var(--c);opacity:.6}.g{--c:var(--ok)}.b{--c:var(--accent)}.a{--c:var(--warn)}.r{--c:var(--fault)}
.sv{fill:var(--off)}.sv.on{fill:var(--accent);filter:url(#glow)}.seg{font:700 3.6px ui-monospace,monospace;stroke:none;fill:var(--ok)}.seg.a{fill:var(--warn)}.seg.r{fill:var(--fault)}
.lt{fill:#9fd4ff;font:2.6px ui-monospace,monospace;letter-spacing:.15px}.lt.big{font-size:4.2px;font-weight:700;fill:#e6f4ff}.lt.warn{fill:var(--warn)}.lt.bad{fill:var(--fault)}.halo-s{fill:#3c8dff;opacity:.16;filter:url(#bloom)}
.blade{fill:var(--top);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.blur{fill:var(--line);opacity:0;stroke:none}
.beam{opacity:0;filter:url(#bloom)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .btn{fill:var(--top)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<pattern id="perf" width="2" height="2" patternUnits="userSpaceOnUse"><rect width="2" height="2" style="fill:var(--tile)"/><circle cx="1" cy="1" r=".48" style="fill:var(--recess)"/></pattern>
<pattern id="mesh" width="1.8" height="1.8" patternUnits="userSpaceOnUse"><rect width="1.8" height="1.8" style="fill:var(--rack)"/><circle cx=".9" cy=".9" r=".5" style="fill:var(--recess)"/></pattern>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* NIVALIS PX–30 cooling. World: x lower-right; y lower-left; z up. 1 unit ≈ 25 mm (tile 600 mm = 24).
Part x y z w d h
subfloor (concrete) 0 0 0 216 96 2
pedestals (visible front row y 96, right column x 216) – – 2 1.6 1.6 20
tile slab (cut away at the front and right) 0 0 22 216 96 2
perforated tiles (cold aisle) 84 48 24 96 24 0
cooling unit 0 12 24 72 36 80 (front y 48: display, LEDs, filter door, 3 EC fans)
return grille + beacon (unit top) 6 16 104 60 28 0
racks (4) 84/108/132/156 0 24 24 48 80 (mesh doors, server LEDs, inlet readouts)
supply streams: plenum (y 88–94) → perforated tiles → rack fronts
return streams: rack tops → over the row → unit top
Temperatures drive stream colour: blue → amber → red. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers.
const draw=root,into=g=>root=g,f2=v=>(+v).toFixed(2);
function led(g,x,y,r=.8){const l=el('g',{class:'led'},g);circle(l,x,y,r*2.4,'halo');circle(l,x,y,r,'core');l.k='';return l;}
function lit(l,c){if(l.k!==c){l.k=c;set(l,'class','led'+(c?' on '+c:''));}}
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
const streams=[];function stream(pts,kind,w=1.4,k=0,rise=false){const n=el('path',{d:smooth(pts),class:'stream '+kind,'stroke-width':w});streams.push({n,kind,k,rise,o:Math.random()*10});return n;}
const RX=[84,108,132,156];
// Raised floor: subfloor, pedestals, plenum streams, tile slab, tiles.
const shp=P(110,48,0);el('ellipse',{cx:shp[0],cy:shp[1]+10,rx:220,ry:74,class:'shadow stage-floor'});el('ellipse',{cx:shp[0],cy:shp[1]+10,rx:220,ry:74,class:'stage-contact'});
box(0,0,0,216,96,2,1,'conc');
rect(group(FRONT(0,6,22)),0,0,214,20,0,'face void');rect(group(SIDE(210,96,22)),0,0,90,20,0,'face side void');
const ped=(x,y)=>{box(x-2,y-2,2,4,4,.8,.3,'ped');box(x-.8,y-.8,2.8,1.6,1.6,17.4,.3,'ped');box(x-2.2,y-2.2,20.2,4.4,4.4,1.8,.3,'ped');};
for(const y of[0,24,48,72])ped(214,y);
for(const x of[0,24,48,72,96,120,144,168,192])ped(x+2,94);
for(let i=0;i<4;i++)stream([[20,90-i*1.6,6+i*4],[60,91,8+i*3.6],[110,89,7+i*4],[160,92,9+i*3],[205,90,6+i*4]],'cold',.9,i);
ped(214,94);
box(0,0,22,216,96,2,.6,'slab');
const fl=group(TOP(0,0,24));rect(fl,0,0,216,96,0,'face tile');
for(let i=0;i<2;i++)for(let j=0;j<4;j++)rect(fl,RX[0]+j*24,48+i*24,24,24,0,i?'face tile':'face perf');
for(let x=0;x<=216;x+=24)line(fl,x,0,x,96,'grid');for(let y=0;y<=96;y+=24)line(fl,0,y,216,y,'grid');
rect(fl,192,72,24,24,0,'face perf');
// Cooling unit: return grille + beacon, display, LEDs, filter door, fan section.
box(0,12,24,72,36,80,2,'crac');
const ct=group(TOP(0,12,104));rect(ct,6,4,60,28,1.6,'face recess');slits(ct,9,7,54,22,18);
const beacon=el('g',{});cylinder(66,16,104,3.2,1.6,'z','base');cylinder(66,16,105.6,2.4,4,'z','glass');const bp=P(66,16,107.6);const beam=el('circle',{cx:bp[0],cy:bp[1],r:9,class:'beam'});const beaconLens=el('circle',{cx:bp[0],cy:bp[1],r:2.2,fill:'transparent'});
const cs=group(SIDE(72,48,104));slits(cs,6,8,24,6,8);rect(cs,8,60,20,10,1,'face top');text(cs,18,64.4,'PX–30','etch micro center');text(cs,18,67.8,'R-410A · 30 kW','etch micro center');
const cf=group(FRONT(0,48,104));
text(cf,6,8,'NIVALIS','label brand');text(cf,66,8,'PX–30','etch').setAttribute('text-anchor','end');line(cf,4,11,68,11);
rect(cf,5,14,32,22,2,'face recess');rect(cf,7,16,28,18,1.2,'halo-s');rect(cf,7,16,28,18,1.2,'face screen');
const LCD=[text(cf,9,21,'','lt'),text(cf,9,26.6,'','lt big'),text(cf,9,32,'','lt')],stBars=[0,1,2].map(i=>rect(cf,27+i*2.6,30-i*2,1.8,2+i*2,.3,'face'));
const UL={};[['RUN','g'],['COOL','b'],['FAN','g'],['FILTER','a'],['ALARM','r']].forEach(([n],i)=>{const u=42+(i%3)*9,v=17+(i/3|0)*10;UL[n]=led(cf,u,v,.85);text(cf,u,v+4.6,n,'etch micro center');});
const filterG=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Filter door: clog or replace the filter (F)','aria-pressed':'false'},cf);rect(filterG,4,39,64,15,1.6,'face crac btn');for(let i=0;i<9;i++)rect(filterG,8,41.4+i*1.3,44,.55,.2,'face recess');rect(filterG,56,43,8,7,1,'face top');text(filterG,60,47.4,'F','label micro center');text(cf,30,56.6,'FILTER · G4','etch micro center');rect(filterG,2.6,37.6,66.8,17.8,2.4,'focus-ring');
rect(cf,4,58,64,20,1.6,'face recess');const FANS=[16,36,56].map(u=>{const g=group(`translate(${u} 68)`,cf);circle(g,0,0,8.6,'face base');circle(g,0,0,7.4,'face recess');const bl=group('',g);for(let i=0;i<7;i++)el('path',{d:'M0,-1.4 Q3.6,-3.6 2.8,-7 Q-.4,-7.2 -.9,-1.5Z',class:'blade',transform:`rotate(${i*51.4})`},bl);const blur=circle(g,0,0,6.8,'blur');for(const r of[7.4,4.6])circle(g,0,0,r,'detail');line(g,-7.4,0,7.4,0);line(g,0,-7.4,0,7.4);circle(g,0,0,1.6,'face base');return{bl,blur,a:Math.random()*360,s:0};});
const pwrG=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Unit power (O)','aria-pressed':'true'},cf);circle(pwrG,62,29,2.6,'face recess');circle(pwrG,62,29,1.8,'face top btn');el('path',{d:'M61.2,28.4a1,1 0 1 0 1.6,0M62,27.8v1',class:'detail'},pwrG);circle(pwrG,62,29,4,'focus-ring');
// Racks: mesh doors with server LEDs, inlet readouts.
const RACKS=RX.map((x,i)=>{box(x,0,24,24,48,80,1.2,'rack');const t=group(TOP(x,0,104));rect(t,4,6,16,8,1,'face recess');rect(t,4,34,16,8,1,'face recess');
const f=group(FRONT(x,48,104));rect(f,2,10,20,66,1,'face mesh');rect(f,2,10,20,66,1,'detail');rect(f,19.4,36,1.6,12,.8,'face base');
rect(f,4,2.4,16,6,1,'face screen');const seg=text(f,12,6.8,'','seg center');
const sv=[];for(let r=0;r<12;r++)for(let c=0;c<3;c++)sv.push(rect(f,4.5+c*3.4,13+r*5.2,1.6,.9,.3,'sv'));
text(group(SIDE(x+24,48,104)),24,4,`R0${i+1}`,'etch micro center');
return{x,seg,sv,inlet:20};});
// Supply streams rising through the perforated tiles, return streams over the row.
RX.forEach((x,i)=>{for(const d of[7,17])stream([[x+d,70,24],[x+d,64,38],[x+d,56,58],[x+d,50,74],[x+d,48.5,80]],'cold',1,i,true);});
RX.forEach((x,i)=>stream([[x+12,6,104],[x+12,8,112+i*3],[x-14,12+i*2,118+i*4],[50-i*4,20+i*2,116+i*2],[44-i*5,24+i,106]],'hot',1.1,i));
frame([[0,0,0,216,96,126],[0,0,0,216,100,24]],8);
// State: load, setpoint, filter, power; temperatures, fan stages, streams, alarms.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const LOADS=[.25,.5,.75,1],SPS=[18,20,22];
let li=1,si=0,clog=false,on=true,sup=18,ret=28,flow=.66,stage=2,lastT=0,lastUI=0,lastLed=0,ac=null,humG=null,nextBeep=0,msg='',msgT=0;
const keyB={};document.querySelectorAll('.hint [data-k]').forEach(b=>keyB[b.dataset.k]=b);
function say(m){announcement.textContent=m;}
function note(m){msg=m;msgT=performance.now()+1700;lastUI=0;}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();const b=ac.createBuffer(1,ac.sampleRate*2,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;const s=ac.createBufferSource(),f=ac.createBiquadFilter();s.buffer=b;s.loop=true;f.type='bandpass';f.frequency.value=420;f.Q.value=.5;humG=ac.createGain();humG.gain.value=0;s.connect(f);f.connect(humG);humG.connect(ac.destination);s.start();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function beep(f,d=.1,v=.02,at=0){if(!ac)return;const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+at;o.type='square';o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.005);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.02);}
function load(){audio();msgT=0;li=(li+1)%4;beep(900,.04,.012);say(`IT load ${LOADS[li]*100} percent.`);lastUI=0;}
function setp(){audio();msgT=0;si=(si+1)%3;beep(1200,.04,.012);say(`Supply setpoint ${SPS[si]} degrees.`);lastUI=0;}
function filter(){audio();msgT=0;clog=!clog;set(filterG,'aria-pressed',clog);set(keyB.f,'aria-pressed',clog);if(clog){say('Filter clogged: airflow down, filter alarm.');}else{note('FILTER REPLACED');say('New filter fitted. Alarm cleared.');beep(1400,.06,.015);}lastUI=0;}
function power(){audio();msgT=0;on=!on;set(pwrG,'aria-pressed',on);set(keyB.o,'aria-pressed',on);say(on?'Cooling unit on.':'Cooling unit off. Rack inlets will heat up.');beep(on?700:300,.15,.02);lastUI=0;}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(filterG,filter);bind(pwrG,power);
const act={l:load,s:setp,f:filter,o:power};Object.entries(keyB).forEach(([k,b])=>b.addEventListener('click',()=>act[k]()));
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const f=act[e.key.toLowerCase()];if(f){e.preventDefault();f();}});
const mix=(a,b,t)=>`color-mix(in srgb,${b} ${Math.round(clamp(t)*100)}%,${a})`;
function tempCol(t){return t<24?'var(--cold)':t<29?mix('var(--cold)','var(--hot)',(t-24)/5):mix('var(--hot)','var(--fault)',(t-29)/5);}
function hotCol(t){return mix('var(--hot)','var(--fault)',(t-30)/9);}
function tick(now){
const dt=Math.min(.05,(now-(lastT||now))/1000),red=reduced.matches,ts=now/1000;lastT=now;
const L=LOADS[li],sp=SPS[si];
const want=on?Math.min(3,1+(L>.4)+(L>.7)+(clog?1:0)):0;if(want!==stage){stage=want;if(on&&ac)beep(600+stage*200,.05,.012);lastUI=0;}
const fT=on?stage/3*(clog?.55:1):0;flow+=(fT-flow)*clamp(dt*(red?60:1.4));
if(on)sup+=(sp-sup)*clamp(dt*(red?60:.8));else sup=Math.min(36,sup+dt*(red?20:.9));
const deficit=Math.max(0,L-flow*1.08);
RACKS.forEach((r,i)=>{const tgt=Math.min(45,sup+deficit*16+i*.5+(on?0:3));r.inlet+=(tgt-r.inlet)*clamp(dt*(red?60:.7));});
const retT=Math.min(52,RACKS.reduce((s,r)=>s+r.inlet,0)/4+5+8*L/Math.max(.5,flow));ret+=(retT-ret)*clamp(dt*(red?60:.6));
const worst=Math.max(...RACKS.map(r=>r.inlet)),hotRack=worst>=32,warmRack=worst>=27;
// Streams: speed and opacity follow airflow; colour follows temperature.
for(const s of streams){const sp2=(s.kind==='cold'?24:18)*(.25+flow*1.1);if(!red)s.o+=dt*sp2;s.n.style.strokeDashoffset=f2(-s.o);
const col=s.kind==='cold'?tempCol(s.rise?RACKS[s.k].inlet:sup):hotCol(ret);if(s._c!==col){s._c=col;s.n.style.stroke=col;}
s.n.style.opacity=f2(s.kind==='cold'?.25+.7*flow:on?.35+.6*Math.min(1,L+.2):.3);}
FANS.forEach((f,i)=>{const run=on&&i<stage;f.s+=((run?flow*1.6:0)-f.s)*clamp(dt*1.2);if(!red){f.a=(f.a+f.s*1100*dt)%360;set(f.bl,'transform',`rotate(${f2(f.a)})`);}f.blur.style.opacity=f2(clamp((f.s-.5)*.5,0,.3));});
const alarm=clog||hotRack||!on,bk=(now/350|0)%2;
const bc=hotRack||!on?'var(--fault)':clog?'var(--warn)':'';beam.style.fill=bc||'none';beam.style.opacity=bc?f2((red?.6:.25+.5*Math.abs(Math.sin(ts*3)))):'0';beaconLens.style.fill=bc||'transparent';
if(ac){humG.gain.setTargetAtTime(flow*.02,ac.currentTime,.3);if(alarm&&now>nextBeep){beep(hotRack?2400:1800,.12,.02);nextBeep=now+(hotRack?900:2600);}}
if(now-lastLed>80){lastLed=now;
lit(UL.RUN,on?'g':'');lit(UL.COOL,on&&sup<=sp+.5?'b':'');lit(UL.FAN,on&&stage?'g':'');lit(UL.FILTER,clog?(bk||red?'a':''):'');lit(UL.ALARM,alarm?(bk||red?'r':''):'');
stBars.forEach((b,i)=>b.style.fill=i<stage?'#9fd4ff':'#1f3344');
RACKS.forEach(r=>{const act=Math.min(1,.2+L*.8);r.sv.forEach(n=>{const o=Math.random()<act*.55;if(n._o!==o){n._o=o;set(n,'class','sv'+(o?' on':''));}});});}
if(!lastUI||now-lastUI>200){
RACKS.forEach(r=>{const t=Math.round(r.inlet);r.seg.textContent=`${t}°`;set(r.seg,'class','seg center'+(t>=32?' r':t>=27?' a':''));});
LCD[0].textContent=on?`SUP ${sup.toFixed(1)}  SET ${sp}`:'UNIT OFF';LCD[1].textContent=`RET ${ret.toFixed(1)}°`;LCD[2].textContent=clog?'FILTER ALARM':hotRack?'HIGH INLET':on?`FAN ${stage}/3  ${Math.round(flow*100)}%`:'NO COOLING';set(LCD[2],'class','lt'+(clog?' warn':hotRack?' bad':''));
readout.textContent=`SUPPLY ${sup.toFixed(1)}°C · RETURN ${ret.toFixed(1)}°C · LOAD ${Math.round(L*100)}%`;
stateLabel.textContent=now<msgT?msg:!on?`UNIT OFF · INLETS RISING · ${Math.round(worst)}°C`:clog?`FILTER ALARM · AIRFLOW ${Math.round(flow*100)}% · F TO REPLACE`:hotRack?`HIGH INLET ${Math.round(worst)}°C · FAN STAGE ${stage}/3`:warmRack?`INLETS WARM ${Math.round(worst)}°C · FAN STAGE ${stage}/3`:`FAN STAGE ${stage}/3 · INLETS OK · SETPOINT ${sp}°C`;
lastUI=now;}
requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['l', 's', 'f', 'o'], draw }
