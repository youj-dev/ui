// @ts-nocheck
/* FENWICK O–6 · Orrery. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b9b9b5;--base-top:#cbcbc7;--base-side:#a4a4a1;--brass:#d2ad66;--brass-top:#ead08f;--brass-side:#b48f48;--brass-dk:#8d6c31;--plate:#3a3a38;--plate-l:#5a5a57;--win:#1b1b1b;--digit:#f2f2ee;--lamp:#ffb648;--glass-off:#f1efe8;--glass-off2:#cfcabf;--knob:#4a4744}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#9b9b99;--base-top:#bebeba;--base-side:#737372;--brass:#b19155;--brass-top:#dbc285;--brass-side:#7e6430;--brass-dk:#765a28;--plate:#2f2f2e;--plate-l:#545451;--win:#151515;--digit:#d9d9d9;--lamp:#ffbe55;--glass-off:#cbc9c5;--glass-off2:#adaaa3;--knob:#3c3a39;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:6px;letter-spacing:1.7px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
.top.base{fill:var(--base-top)}.side.base{fill:var(--base-side)}.brass{fill:var(--brass)}.top.brass{fill:var(--brass-top)}.side.brass{fill:var(--brass-side)}.plate{fill:var(--plate)}.knob{fill:var(--knob)}.top.knob{fill:var(--plate-l)}
.engr{fill:none;stroke:var(--brass-dk);stroke-width:.5;vector-effect:non-scaling-stroke;stroke-linecap:round}.engr-t{fill:var(--brass-dk);font:600 3px ui-monospace,monospace;letter-spacing:.4px;text-anchor:middle}
.gear-s{fill:var(--brass-side);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;stroke-linejoin:round}.gear-t{fill:var(--brass-top);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke;stroke-linejoin:round}
.rod-u{fill:none;stroke:var(--line);stroke-width:1.7;stroke-linecap:round}.rod{fill:none;stroke:var(--brass-top);stroke-width:.85;stroke-linecap:round}.post-u{fill:none;stroke:var(--line);stroke-width:1.4;stroke-linecap:round}.post{fill:none;stroke:var(--brass);stroke-width:.65;stroke-linecap:round}
.planet{stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.dim{fill:#000;opacity:.18;transition:opacity .5s;pointer-events:none}.lit .dim{opacity:0}
.ring-s{fill:none;stroke:#cdb98a;stroke-width:1.7}.ring-o{fill:none;stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.band-j{fill:none;stroke:#8f6c48;stroke-width:.55;opacity:.6}
.sel{fill:none;stroke:var(--accent);stroke-width:1;vector-effect:non-scaling-stroke;opacity:0}.picked .sel{opacity:1}.orbit{fill:none;stroke:var(--accent);stroke-width:.9;vector-effect:non-scaling-stroke;stroke-dasharray:2 2;opacity:0;transition:opacity .25s}.orbit.on{opacity:.85}
.halo{fill:var(--lamp);opacity:0;transition:opacity .5s;pointer-events:none}.lit .halo{opacity:var(--fl,.55);filter:url(#bloom)}.lit .halo.wide{opacity:calc(var(--fl,.55)*.3)}.pool{opacity:0;transition:opacity .6s;pointer-events:none}.lit .pool{opacity:1}
.win{fill:var(--win);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.digit{fill:var(--digit);font:600 6px ui-monospace,monospace;letter-spacing:.6px;text-anchor:middle}
.lever{fill:none;stroke:var(--brass-dk);stroke-width:1.8;stroke-linecap:round}.lever-k{fill:var(--brass-top);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}
.pilot{fill:var(--off)}.lit .pilot{fill:var(--lamp);filter:url(#glow)}.driving .pilot-d{fill:var(--accent);filter:url(#glow)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="pool"><stop offset="0" style="stop-color:var(--lamp)" stop-opacity=".42"/><stop offset=".55" style="stop-color:var(--lamp)" stop-opacity=".12"/><stop offset="1" style="stop-color:var(--lamp)" stop-opacity="0"/></radialGradient>
<radialGradient id="sunOff" cx=".5" cy=".5" r=".55" fx=".36" fy=".3"><stop offset="0" style="stop-color:var(--glass-off)"/><stop offset="1" style="stop-color:var(--glass-off2)"/></radialGradient>
<radialGradient id="sunOn" cx=".5" cy=".5" r=".55" fx=".42" fy=".38"><stop offset="0" stop-color="#fffbea"/><stop offset=".45" stop-color="#ffd77a"/><stop offset="1" stop-color="#ff9d2e"/></radialGradient>
<radialGradient id="cw" cx=".5" cy=".5" r=".6" fx=".35" fy=".3"><stop offset="0" style="stop-color:var(--brass-top)"/><stop offset="1" style="stop-color:var(--brass-dk)"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* FENWICK O–6 orrery. World: x lower-right, y lower-left, z up; 1 unit ≈ 2 mm.
Part                        x      y      z      w      d      h
bracket feet (4)       2/132  2/132      0     16     16      6
plinth                      0      0      6    130    130     28   counter, lamp switch, crank, drive lever
moulding                   −2     −2     34    154    154      3
drum foot ring           r 59   65,65     37      –      –      3
drum                     r 56   65,65     40      –      –     15   engraved bands
calendar ring            r 59   65,65     55      –      –    2.5   months, ticks, Earth pointer
plate                    r 46   65,65   57.5      –      –      –   light pool, gears
gears (4)               r 6–13          57.6      –      –    1.8   turn with the crank
pillar + collars         r 3.2  65,65   57.6      –      –     60
arms (6)            r 14–55   65,65  66–110     –      –      –   counterweights, posts 6
planets (6) + moon     r 1.5–7.4        78–121    –      –      –   lit toward the sun
sun lamp                 r 10   65,65    118      –      –     23   cup, frosted globe, halo
crank                     130     65     20   r 2.6–10    7     –   hub, arm, turned knob
drive lever               130    112     20      –      –     –
lamp switch                14    130     20      –      –     –
Depth: planets, arms and the pillar are re-sorted by x + y every frame. */
// Isometric engine: affine face planes, solids, round parts, grille and fit.
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Family helpers.
function pin(g,x,y,r=.75){circle(g,x,y,r,'face top');line(g,x-r*.5,y+r*.35,x+r*.5,y-r*.35);}
const adopt=(g,n)=>{g.appendChild(n.g||n);return n;};
function panel(g,x,y,w,h,b=2.2){rect(g,x,y,w,h,1,'face');el('path',{d:`M${x},${y}H${x+w}L${x+w-b},${y+b}H${x+b}ZM${x},${y}L${x+b},${y+b}V${y+h-b}L${x},${y+h}Z`,class:'face top'},g);el('path',{d:`M${x},${y+h}L${x+b},${y+h-b}H${x+w-b}L${x+w},${y+h}ZM${x+w},${y}V${y+h}L${x+w-b},${y+h-b}V${y+b}Z`,class:'face side'},g);}
function gearD(r,n,d=1.3){let s='';const pt=(a,rr)=>`${(Math.cos(a)*rr).toFixed(2)},${(Math.sin(a)*rr).toFixed(2)}`;for(let i=0;i<n;i++){const a=i/n*2*Math.PI,k=2*Math.PI/n;s+=(i?'L':'M')+pt(a,r-d)+'L'+pt(a+k*.2,r)+'L'+pt(a+k*.5,r)+'L'+pt(a+k*.7,r-d);}return s+'Z';}
// Assembly: shadow, feet, plinth and its faces, drum, calendar ring, plate, gears; then the depth-sorted mechanism.
const defs=svg.querySelector('defs'),CX=65,CY=65;
const sh=P(66,66,0);el('ellipse',{cx:sh[0],cy:sh[1]+2,rx:122,ry:63,class:'shadow stage-floor'});el('ellipse',{cx:sh[0],cy:sh[1]+2,rx:122,ry:63,class:'stage-contact'});
for(const[x,y]of[[2,2],[112,2],[2,112],[112,112]]){box(x,y,0,16,16,6,1.5,'base');}
box(0,0,6,130,130,28,2.5);
const PF=group(FRONT(0,130,34));panel(PF,6,3.5,118,21,2.4);
rect(PF,24,5.5,82,17,2,'face brass');rect(PF,25.4,6.9,79.2,14.2,1.4,'engr');
const wins=[[32,13,'d'],[50,24,'m'],[79,20,'y']].map(([u,w])=>{rect(PF,u,8.4,w,9.2,1,'win');return u+w/2;});
const digits=wins.map(u=>text(PF,u,15.2,'','digit'));
for(const[u,l]of[[38.5,'DAY'],[62,'MONTH'],[89,'YEAR']])text(PF,u,20.6,l,'engr-t');
for(const u of[27,103])pin(PF,u,9,.7),pin(PF,u,19,.7);
const lampSw=button(group(FRONT(14,130.05,20)),{'aria-label':'Lamp (L)','aria-pressed':'false'});
rect(lampSw,-5,-6,10,12.5,1.6,'face brass');circle(lampSw,0,0,1.6,'face top brass');const lampLever=el('line',{x1:0,y1:0,x2:0,y2:-4.4,class:'lever'},lampSw);const lampKnob=circle(lampSw,0,-4.4,1.2,'lever-k');
circle(lampSw,0,4,.9,'pilot');text(lampSw,0,9.4,'LAMP','etch micro center');rect(lampSw,-6.5,-8,13,19,2,'focus-ring');rect(lampSw,-7,-8,14,19,0,'hit');
const PS=group(SIDE(130,130,34));panel(PS,6,3.5,118,21,2.4);
text(PS,101,12,'FENWICK & CO.','label center');text(PS,101,16.4,'O–6 · NO. 1187','etch micro center');pin(PS,87,14,.7);pin(PS,115,14,.7);
const drive=button(group(SIDE(130.05,112,20)),{'aria-label':'Clockwork drive (Space)','aria-pressed':'false'});
rect(drive,-5,-6,10,12.5,1.6,'face brass');circle(drive,0,0,1.6,'face top brass');const driveLever=el('line',{x1:0,y1:0,x2:0,y2:-4.4,class:'lever'},drive);const driveKnob=circle(drive,0,-4.4,1.2,'lever-k');
circle(drive,0,4,.9,'pilot pilot-d');text(drive,0,9.4,'DRIVE','etch micro center');rect(drive,-6.5,-8,13,19,2,'focus-ring');rect(drive,-7,-8,14,19,0,'hit');
const crankBase=group(SIDE(130.05,65,20));circle(crankBase,0,0,6.4,'face brass');circle(crankBase,0,0,5,'engr');for(let i=0;i<16;i++){const a=i/16*Math.PI*2;line(crankBase,Math.cos(a)*5.3,Math.sin(a)*5.3,Math.cos(a)*6.1,Math.sin(a)*6.1,'engr');}
const crank=button(el('g',{}),{'aria-label':'Crank: drag, or use the arrow keys'});
box(-2,-2,34,134,134,3,1.6);
cylinder(CX,CY,37,59,3,'z','brass');
const drum=cylinder(CX,CY,40,56,15,'z','brass');
for(const z of[43,52])wire([...Array(41).keys()].map(i=>{const a=Math.PI*(-.25+i/40);return[CX+56.05*Math.cos(a),CY+56.05*Math.sin(a),z];}),'engr');
const ring=cylinder(CX,CY,55,59,2.5,'z','brass');
const RG=ring.face,MON=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
circle(RG,0,0,57.6,'engr');circle(RG,0,0,48,'engr');circle(RG,0,0,51,'engr');
for(let i=0;i<72;i++){const a=i/72*Math.PI*2,r0=i%6?49.6:48;line(RG,Math.cos(a)*r0,Math.sin(a)*r0,Math.cos(a)*51,Math.sin(a)*51,'engr');}
MON.forEach((m,i)=>{const a=(i+.5)/12*360;const g=group(`rotate(${a}) translate(0 -53.2) rotate(180)`,RG);text(g,0,1,m,'engr-t');line(RG,...[57.4,51].flatMap(r=>[Math.cos(i/12*Math.PI*2-Math.PI/2)*r,Math.sin(i/12*Math.PI*2-Math.PI/2)*r]),'engr');});
const PT=group(TOP(CX,CY,57.55));circle(PT,0,0,46.5,'face plate');circle(PT,0,0,44,'engr');
for(let i=0;i<8;i++){const a=i/8*Math.PI*2+.2;pin(PT,Math.cos(a)*41.5,Math.sin(a)*41.5,.8);}
circle(group(TOP(CX,CY,57.6)),0,0,46,'pool').setAttribute('fill','url(#pool)');
const GEARS=[[0,0,13,40,1],[19,13.5,9.4,28,-40/28],[-13,21,7.8,24,-40/24],[24,-11,6.4,20,-40/20]].map(([dx,dy,r,n,k])=>{
const lo=group(TOP(CX+dx,CY+dy,57.6)),hi=group(TOP(CX+dx,CY+dy,59.4));const a=el('g',{},lo),b=el('g',{},hi);
el('path',{d:gearD(r,n),class:'gear-s'},a);el('path',{d:gearD(r,n),class:'gear-t'},b);circle(b,0,0,r*.62,'engr');
for(let i=0;i<5;i++){const t=i/5*Math.PI*2;circle(b,Math.cos(t)*r*.36,Math.sin(t)*r*.36,r*.13,'face plate');}circle(b,0,0,r*.15+1,'face top brass');return{a,b,k};});
// Pillar with one collar per arm, then the sun lamp on top.
const PLAN=[
{n:'MERCURY',r:14,za:110,s:2.4,T:87.97,c:['#e6e2da','#a7a299','#55514b'],ph:30},
{n:'VENUS',r:21.5,za:103,s:3.6,T:224.7,c:['#f8ecc8','#dcbd78','#866a37'],ph:140},
{n:'EARTH',r:29,za:95,s:4,T:365.256,c:['#b3d3ff','#3f78d6','#163068'],ph:-1,moon:1},
{n:'MARS',r:37,za:86,s:3,T:686.98,c:['#f8b291','#c85b33','#622510'],ph:300},
{n:'JUPITER',r:46.5,za:76,s:7.4,T:4332.6,c:['#f6e5ce','#c99f74','#634830'],ph:80,bands:1},
{n:'SATURN',r:55,za:66,s:6.2,T:10759,c:['#f8ecca','#d6bc80','#735e33'],ph:250,ring:1}];
const sunC=[CX,CY,131],sunS=P(...sunC);
el('circle',{cx:sunS[0],cy:sunS[1],r:54,class:'halo wide'});
const mech=el('g',{}),pillar=el('g',{},mech);pillar.dataset.d=CX+CY;
adopt(pillar,cylinder(CX,CY,57.6,3.2,60.4,'z','brass'));
for(const p of PLAN){p.col=adopt(pillar,cylinder(CX,CY,p.za-1,3.9,2,'z','brass'));line(p.col.face,1.4,0,3.7,0,'engr');}
adopt(pillar,cylinder(CX,CY,118,5,2.2,'z','brass'));const cup=adopt(pillar,cylinder(CX,CY,120.2,4.2,1.8,'z','brass'));
el('circle',{cx:sunS[0],cy:sunS[1],r:19,class:'halo'},pillar);
const sun=el('circle',{cx:sunS[0],cy:sunS[1],r:10*1.2247,fill:'url(#sunOff)',class:'planet',style:'cursor:pointer'},pillar);
el('path',{d:`M${sunS[0]-7.2},${sunS[1]-3.6} Q${sunS[0]-2.4},${sunS[1]-10.2} ${sunS[0]+4.8},${sunS[1]-8.8}`,class:'detail',opacity:.5},pillar);
const orbitG=el('g',{});root.insertBefore(orbitG,mech);
PLAN.forEach((p,i)=>{
const gr=el('radialGradient',{id:'pg'+i,cx:.5,cy:.5,r:.56},defs);p.c.forEach((c,k)=>el('stop',{offset:[0,.5,1][k],'stop-color':c},gr));p.grad=gr;
p.orbit=circle(group(TOP(CX,CY,p.za+6+p.s),orbitG),0,0,p.r,'orbit');
const g=el('g',{class:'arm'},mech);p.g=g;
p.cwU=el('path',{class:'rod-u'},g);p.cwB=el('path',{class:'rod'},g);p.cw=el('circle',{fill:'url(#cw)',class:'planet'},g);
p.armU=el('path',{class:'rod-u'},g);p.armB=el('path',{class:'rod'},g);p.postU=el('path',{class:'post-u'},g);p.postB=el('path',{class:'post'},g);
p.cupE=el('ellipse',{class:'face top brass'},g);
if(p.ring){p.rb=[el('path',{class:'ring-o'},g),el('path',{class:'ring-s'},g)];}
p.body=el('circle',{fill:`url(#pg${i})`,class:'planet'},g);p.dim=el('circle',{class:'dim'},g);
if(p.bands)p.bd=[el('path',{class:'band-j'},g),el('path',{class:'band-j'},g)];
if(p.ring){p.rf=[el('path',{class:'ring-s'},g),el('path',{class:'ring-o'},g)];}
if(p.moon){const mg=el('radialGradient',{id:'pgm',cx:.5,cy:.5,r:.56},defs);['#f2f1ee','#b8b5ae','#57544f'].forEach((c,k)=>el('stop',{offset:[0,.5,1][k],'stop-color':c},mg));p.mgrad=mg;p.mU=el('path',{class:'post-u'},g);p.mB=el('path',{class:'post'},g);p.moonC=el('circle',{fill:'url(#pgm)',class:'planet'},g);}
p.sel=el('circle',{class:'sel'},g);el('circle',{class:'hit control'},g);
g.addEventListener('click',()=>pick(i));
});
// Crank (rebuilt as it turns), then frame.
mech.parentNode.appendChild(crank);
frame([[0,0,0,130,130,37],[CX-66,CY-66,55,132,132,86]],10);
// State: time in days from today; the crank angle is time, one turn per 30.44 days.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const say=t=>{announcement.textContent=t;},clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
let ac=null;
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
function tone(f,d=.15,v=.02,type='sine',when=0,f2=0){const a=ac;if(!a)return;const t=a.currentTime+when,o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+d+.03);}
const EPOCH=Date.UTC(2026,9,6),MONTH=30.4369,DOY=(Date.UTC(2026,9,6)-Date.UTC(2026,0,1))/864e5;
let t=0,tT=0,lamp=false,driveOn=false,sel=-1,held=0,heldT=0,last=performance.now(),lastTick=0,outKey='',drag=null;
const hintD=document.querySelector('[data-k="space"]'),hintL=document.querySelector('[data-k="l"]');
function setLamp(on){audio();lamp=on;svg.classList.toggle('lit',on);set(sun,'fill',on?'url(#sunOn)':'url(#sunOff)');set(lampSw,'aria-pressed',on);set(hintL,'aria-pressed',on);set(lampLever,'y2',on?4.4:-4.4);set(lampKnob,'cy',on?4.4:-4.4);tone(on?240:180,.04,.02,'square');say(on?'Lamp on. The planets show their day sides.':'Lamp off.');}
function setDrive(on){audio();driveOn=on;svg.classList.toggle('driving',on);set(drive,'aria-pressed',on);set(hintD,'aria-pressed',on);set(driveLever,'y2',on?4.4:-4.4);set(driveKnob,'cy',on?4.4:-4.4);tone(on?330:250,.05,.016,'triangle');say(on?'Clockwork drive engaged: one month per second.':'Drive released.');}
function pick(i){sel=sel===i?-1:i;PLAN.forEach((p,k)=>{p.g.classList.toggle('picked',k===sel);p.orbit.classList.toggle('on',k===sel);});if(sel>=0){const p=PLAN[sel];say(`${p.n}: one orbit takes ${p.T<1000?Math.round(p.T)+' days':(p.T/365.25).toFixed(1)+' years'}.`);}}
function today(){tT=0;driveOn&&setDrive(false);say('Returning to today.');}
const ang=(p,tt)=>p.ph<0?2*Math.PI*(DOY+tt)/365.256-Math.PI/2:2*Math.PI*tt/p.T+p.ph*Math.PI/180;
const seg=(a,b)=>'M'+P(...a).join(',')+'L'+P(...b).join(',');
function drawCrank(a){crank.textContent='';adopt(crank,cylinder(130,65,20,2.6,1.4,'x','brass'));const g=group(SIDE(131.45,65,20),crank);
const ar=group(`rotate(${a*180/Math.PI})`,g);rect(ar,-2,-1.7,13.5,3.4,1.7,'face brass');circle(ar,0,0,1.2,'face top brass');circle(ar,10,0,1.1,'detail');
const u=10*Math.cos(a),v=10*Math.sin(a),k=adopt(crank,cylinder(131.6,65-u,20-v,1.9,6.2,'x','knob'));circle(k.face,0,0,1,'detail');circle(k.face,0,0,4.2,'focus-ring');circle(k.face,0,0,5,'hit');circle(g,0,0,14,'hit');}
function update(){
const s=P(...sunC);
for(const p of PLAN){const a=ang(p,t),cs=Math.cos(a),sn=Math.sin(a),end=[CX+p.r*cs,CY+p.r*sn,p.za],pc=[end[0],end[1],p.za+6+p.s],c=P(...pc),R=p.s*1.2247;
set(p.armU,'d',seg([CX+4.4*cs,CY+4.4*sn,p.za],end));set(p.armB,'d',seg([CX+4.4*cs,CY+4.4*sn,p.za],end));
const cwp=[CX-9*cs,CY-9*sn,p.za];set(p.cwU,'d',seg([CX-4.4*cs,CY-4.4*sn,p.za],cwp));set(p.cwB,'d',seg([CX-4.4*cs,CY-4.4*sn,p.za],cwp));const q=P(...cwp);set(p.cw,'cx',q[0]);set(p.cw,'cy',q[1]-1.2);set(p.cw,'r',1.6+p.s*.22);
set(p.postU,'d',seg(end,[end[0],end[1],p.za+5.2]));set(p.postB,'d',seg(end,[end[0],end[1],p.za+5.2]));const cp=P(end[0],end[1],p.za+5.4);set(p.cupE,'cx',cp[0]);set(p.cupE,'cy',cp[1]);set(p.cupE,'rx',1.7);set(p.cupE,'ry',1);
for(const n of[p.body,p.dim]){set(n,'cx',c[0]);set(n,'cy',c[1]);set(n,'r',R);}set(p.sel,'cx',c[0]);set(p.sel,'cy',c[1]);set(p.sel,'r',R+2.4);const hit=p.g.lastChild;set(hit,'cx',c[0]);set(hit,'cy',c[1]);set(hit,'r',R+3);
const dx=s[0]-c[0],dy=s[1]-c[1],l=Math.hypot(dx,dy)||1;set(p.grad,'fx',lamp?.5+.34*dx/l:.36);set(p.grad,'fy',lamp?.5+.34*dy/l:.3);
if(p.ring){const rx=R*1.9,ry=p.s*1.9*.7071;const back=`M${c[0]-rx},${c[1]}A${rx},${ry} 0 0 1 ${c[0]+rx},${c[1]}`,front=`M${c[0]-rx},${c[1]}A${rx},${ry} 0 0 0 ${c[0]+rx},${c[1]}`;p.rb.forEach(n=>set(n,'d',back));p.rf.forEach(n=>set(n,'d',front));}
if(p.bands)[-.32,.28].forEach((h,k)=>{const rr=Math.sqrt(1-h*h)*R,ry=Math.sqrt(1-h*h)*p.s*.7071,y=c[1]-h*p.s;set(p.bd[k],'d',`M${c[0]-rr},${y}A${rr},${ry} 0 0 0 ${c[0]+rr},${y}`);});
if(p.moon){const ma=2*Math.PI*t/27.32+1,m=[pc[0]+8*Math.cos(ma),pc[1]+8*Math.sin(ma),pc[2]],mc=P(...m);set(p.mU,'d',seg(pc,m));set(p.mB,'d',seg(pc,m));set(p.moonC,'cx',mc[0]);set(p.moonC,'cy',mc[1]);set(p.moonC,'r',1.5*1.2247);
const ex=s[0]-mc[0],ey=s[1]-mc[1],ml=Math.hypot(ex,ey)||1;set(p.mgrad,'fx',lamp?.5+.34*ex/ml:.36);set(p.mgrad,'fy',lamp?.5+.34*ey/ml:.3);}
p.g.dataset.d=pc[0]+pc[1];}
[...mech.children].sort((a,b)=>a.dataset.d-b.dataset.d).forEach(n=>mech.appendChild(n));
const turn=t/MONTH*2*Math.PI;for(const g of GEARS){const r=`rotate(${(turn*g.k*180/Math.PI*.5)%360})`;set(g.a,'transform',r);set(g.b,'transform',r);}
for(const p of PLAN){const r=`rotate(${(ang(p,t)*180/Math.PI)%360})`;set(p.col.face,'transform',(p.col.face.getAttribute('transform')||'').replace(/ rotate\(.*\)$/,'')+' '+r);}
drawCrank(turn);
const d=new Date(EPOCH+t*864e5),dd=String(d.getUTCDate()).padStart(2,'0'),mm=MON[d.getUTCMonth()],yy=String(d.getUTCFullYear());
[dd,mm,yy].forEach((v,i)=>{if(digits[i].textContent!==v)digits[i].textContent=v;});
const days=Math.round(t),r=`${dd} ${mm} ${yy} · ${days>=0?'+':''}${days} D`;
const st=sel>=0?`${PLAN[sel].n} · ${PLAN[sel].T<1000?Math.round(PLAN[sel].T)+' D':(PLAN[sel].T/365.25).toFixed(1)+' YR'} · ${Math.round(((ang(PLAN[sel],t)*180/Math.PI)%360+360)%360)}°`:`LAMP ${lamp?'ON':'OFF'} · ${driveOn?'DRIVE ON':'CRANK '+(t/MONTH).toFixed(1)+' TURNS'}`;
if(r+st!==outKey){readout.textContent=r;stateLabel.textContent=st;outKey=r+st;}}
function tick(now){const dt=Math.min(.05,(now-last)/1000);last=now;
if(driveOn)tT+=MONTH*dt;if(held){heldT+=dt;if(heldT>.25)tT+=held*MONTH*.6*dt;}
const prev=t;t=reduced.matches?tT:t+(tT-t)*Math.min(1,dt*(Math.abs(tT-t)>200?2.5:9));if(Math.abs(tT-t)<.001)t=tT;
const tk=Math.floor(t/MONTH*16);if(tk!==lastTick){if(ac&&Math.abs(t-prev)>.0001)tone(1900,.012,.004,'square');lastTick=tk;}
if(lamp&&!reduced.matches){const f=.5+.05*Math.sin(now/170)+.03*Math.sin(now/53);root.style.setProperty('--fl',f);}
update();requestAnimationFrame(tick);}
// Input: crank drag, arrows (tap = an eighth turn, hold = continuous), Space drive, L lamp, 1–6 planets, R today.
crank.addEventListener('pointerdown',e=>{e.preventDefault();audio();const m=svg.getScreenCTM().inverse(),c=P(131.2,65,20),pt=ev=>{const x=ev.clientX*m.a+ev.clientY*m.c+m.e-c[0],y=ev.clientX*m.b+ev.clientY*m.d+m.f-c[1],u=x/C;return Math.atan2(y+u*S,u);};
drag={a:pt(e)};crank.setPointerCapture(e.pointerId);const mv=ev=>{const a=pt(ev);let d=a-drag.a;if(d>Math.PI)d-=2*Math.PI;if(d<-Math.PI)d+=2*Math.PI;drag.a=a;tT+=d/(2*Math.PI)*MONTH;};
const up=()=>{crank.removeEventListener('pointermove',mv);crank.removeEventListener('pointerup',up);crank.removeEventListener('pointercancel',up);drag=null;};crank.addEventListener('pointermove',mv);crank.addEventListener('pointerup',up);crank.addEventListener('pointercancel',up);});
crank.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();tT+=MONTH/4;}});
bind(lampSw,()=>setLamp(!lamp));sun.addEventListener('click',()=>setLamp(!lamp));bind(drive,()=>setDrive(!driveOn));
document.querySelectorAll('.hint [data-k]').forEach(b=>b.addEventListener('click',()=>({space:()=>setDrive(!driveOn),l:()=>setLamp(!lamp),r:today})[b.dataset.k]()));
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key;
if(k==='ArrowRight'||k==='ArrowLeft'){e.preventDefault();if(!e.repeat){audio();held=k==='ArrowRight'?1:-1;heldT=0;tT+=held*MONTH/8;}return;}
if(e.repeat)return;
if(k===' '){if(e.target.closest&&e.target.closest('button,[role=button]'))return;e.preventDefault();setDrive(!driveOn);}
else if(k==='l'||k==='L'){e.preventDefault();setLamp(!lamp);}else if(k==='r'||k==='R'){e.preventDefault();today();}
else if(k>='1'&&k<='6'){e.preventDefault();pick(+k-1);}});
document.addEventListener('keyup',e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft')held=0;});
window.addEventListener('blur',()=>{held=0;});
update();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['space', 'l', 'r'], draw }
