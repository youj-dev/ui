// @ts-nocheck
/* WARDGATE F8 · Firewall. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#b3b3af;--ok:#15a65e;--warn:#e88a00;--fault:#e3372d;--bez:#3d3f40;--bez-top:#525456;--bez-side:#313334;--lcd:#2a55d8;--lcd-alert:#d8392b;--lcd-ink:#f2f6ff;--cord:#e7e8e6;--fiber:#e9c43c;--rub:#4a4a48;--jack:#1d1f20;--paper:#fbfbf7}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#969694;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--bez:#323334;--bez-top:#4c4e50;--bez-side:#202121;--lcd:#2d5cf0;--lcd-alert:#e2402f;--lcd-ink:#f2f6ff;--cord:#c3c3c2;--fiber:#c4a531;--rub:#3d3d3c;--jack:#171819;--paper:#d4d4d1;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:4.4px;letter-spacing:1.3px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.bz{fill:var(--bez)}.top.bz{fill:var(--bez-top)}.side.bz{fill:var(--bez-side)}.jack{fill:var(--jack)}.rub{fill:var(--rub)}.paper{fill:var(--paper)}.light-ink{fill:#e8e8e8}
.lcd{fill:var(--lcd);transition:fill .25s}.alert .lcd{fill:var(--lcd-alert)}.dead .lcd{fill:#101418}.lcdh{fill:var(--lcd);opacity:.35;filter:url(#bloom)}.alert .lcdh{fill:var(--lcd-alert);opacity:.6}.dead .lcdh{opacity:0}.ch{fill:var(--lcd-ink);font:3.9px ui-monospace,monospace;letter-spacing:.4px;stroke:none}.dead .ch{opacity:0}.cells{fill:url(#cells);opacity:.5}
.cu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.cb{fill:none;stroke:var(--cord);stroke-linecap:round;stroke-linejoin:round}.cf{stroke:var(--fiber)}
.led>.core{fill:var(--off)}.led>.halo{opacity:0;filter:url(#soft)}.on>.core{fill:var(--c)}.on>.halo{fill:var(--c);opacity:.6}.g{--c:var(--ok)}.b{--c:var(--accent)}.a{--c:var(--warn)}.r{--c:var(--fault)}
.pk{stroke:none;filter:url(#glow)}.pk.g{fill:var(--ok)}.pk.r{fill:var(--fault)}.pk.a{fill:var(--warn)}.pk.b{fill:var(--accent)}.shield{fill:none;stroke:var(--fault);stroke-width:1.2;opacity:0;filter:url(#glow)}
.bar{fill:var(--c,var(--off))}.barh{fill:var(--c);opacity:0;filter:url(#bloom)}.barh.on{opacity:.55}.blade{fill:var(--top);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.blur{fill:var(--line);opacity:0;stroke:none}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .btn{fill:var(--bez-top)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<pattern id="cells" x="46.3" y="5.6" width="2.74" height="5.6" patternUnits="userSpaceOnUse"><rect x=".2" y=".3" width="2.3" height="4.4" fill="none" stroke="#fff" stroke-width=".12" opacity=".35"/></pattern>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* WARDGATE F8 firewall. World: x lower-right; y lower-left; z up. 1 unit ≈ 2.2 mm.
Part x y z w d h
rubber feet (4) 10/190 10/110 0 r3 – 4
firewall body 0 0 4 200 120 22
front bezel 0 120 4 200 1.6 22 (brand, LEDs, LCD, buttons, 8 ports)
top vents + rating sticker 20 10 26 160 100 0
side fans (2) 200 30/80 15 0 r9 –
ONT (fibre terminal) −74 34 0 26 22 34
fibre in from the left −120 46 1 → −74
WAN cable ONT → port 1 −61 56 12 → 117.6 121.6 15
switch (LAN side) 236 38 0 56 40 10
LAN cable port 3 → switch, clients → right
Pulses ride the cables: allowed (green) pass; blocked (red) bounce at the WAN port. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers.
const draw=root,into=g=>root=g,f2=v=>(+v).toFixed(2);
function led(g,x,y,r=.7,w=0){const l=el('g',{class:'led'},g);if(w){rect(l,x-w/2-.8,y-r*1.4,w+1.6,r*2.8,r,'halo');rect(l,x-w/2,y-r/2,w,r,.3,'core');}else{circle(l,x,y,r*2.4,'halo');circle(l,x,y,r,'core');}l.k='';return l;}
function lit(l,c){if(l.k!==c){l.k=c;set(l,'class','led'+(c?' on '+c:''));}}
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
function cable(pts,w,cls=''){const d=smooth(pts);el('path',{d,class:'cu','stroke-width':w+.9});const c=el('path',{d,class:'cb '+cls,'stroke-width':w});c.len=c.getTotalLength();return c;}
function plug(x,z){box(x-3.2,121.6,z-3,6.4,5,6,1,'');box(x-2.2,126.6,z-2.2,4.4,3.2,4.4,1.2,'');}
// Shadow, fibre and ONT on the WAN side.
const shp=P(100,62,0);el('ellipse',{cx:shp[0]-10,cy:shp[1]+6,rx:230,ry:70,class:'shadow stage-floor'});el('ellipse',{cx:shp[0]-10,cy:shp[1]+6,rx:230,ry:70,class:'stage-contact'});
const fib=cable([[-124,46,1],[-104,48,1],[-90,46,2],[-74,46,6]],1.2,'cf');
box(-74,34,0,26,22,34,2.4,'');const onf=group(FRONT(-74,56,34));text(onf,13,6,'ONT','label center');
const ONT=[['PON','g'],['LOS',''],['LAN','g']].map(([n],i)=>{text(onf,8,13.4+i*5,n,'etch micro');return led(onf,4.6,12.4+i*5,.6);});
rect(onf,8,24,10,6,.6,'face recess');rect(onf,9.2,25.4,7.6,3.8,.4,'face jack');
const ons=group(SIDE(-48,56,34));slits(ons,4,4,14,26,5);
// WAN cable to port 1, LAN cable from port 3 to the switch, clients beyond.
const WAN=cable([[-61,57,6],[-61,64,2],[-40,96,1],[40,146,1],[110,146,1],[117.6,136,7],[117.6,128.6,15]],1.6,'');
box(236,38,0,56,40,10,1.6,'');const swf=group(FRONT(236,78,10));text(swf,5,4.2,'LAN 8','etch micro');const SWL=[];for(let i=0;i<5;i++){rect(swf,20+i*7,2.6,6,4.4,.5,'face recess');SWL.push(led(swf,23+i*7,8.4,.45));}
const swt=group(TOP(236,38,10));slits(swt,8,8,40,8,12);
const LAN=cable([[138.8,128.6,15],[138.8,136,7],[150,148,1],[220,128,1],[243,92,1],[243,84,4.6],[243,79,4.8]],1.6,'');
const CL=[0,1,2].map(i=>cable([[250+i*7,79,4.8],[250+i*7,86,1],[262+i*10,104,1],[300+i*6,118+i*4,1]],1.2,''));
// Firewall body on rubber feet.
for(const[x,y]of[[12,12],[188,12],[12,108],[188,108]])cylinder(x,y,0,3,4,'z','rub');
box(0,0,4,200,120,22,2,'');
const lid=group(TOP(0,0,26));for(const v of[14,104])slits(lid,26,v-4,148,8,40);rect(lid,30,40,50,30,1,'face paper');text(lid,55,47,'WARDGATE F8','label center');text(lid,55,52,'100–240 V · 1.2 A','etch micro center');for(let i=0;i<20;i++)rect(lid,36+i*1.9,56,i%3?.5:1,8,0,'face');text(lid,55,68,'S/N WG8-31-0457','etch micro center');for(const[u,v]of[[5,5],[195,5],[5,115],[195,115]])screw(lid,u,v);rect(lid,18,111,164,5,2.5,'face recess');const barG=el('g',{},lid),barH=rect(barG,20,110,160,7,3.5,'barh'),bar=rect(barG,20,112,160,3,1.5,'bar');
const sd=group(SIDE(200,120,26)),fans=[];for(const u of[30,80]){circle(sd,u,11,8.6,'face recess');const g=group(`translate(${u} 11)`,sd),bl=group('',g);for(let i=0;i<5;i++)el('path',{d:'M0,-1.4 Q3.6,-3.4 2.6,-7.4 Q-.6,-7.6 -1,-1.6Z',class:'blade',transform:`rotate(${i*72})`},bl);const blur=circle(g,0,0,7.6,'blur');for(const r of[8.6,5.6,2.6])circle(g,0,0,r,'detail');line(g,-8.6,0,8.6,0);line(g,0,-8.6,0,8.6);circle(g,0,0,1.6,'face base');fans.push({bl,blur,a:Math.random()*360});}
slits(sd,100,6,14,10,6);
box(0,120,4,200,1.6,22,2,'bz');
const ff=group(FRONT(0,121.6,26));
text(ff,6,8,'WARDGATE','label brand light-ink');text(ff,6,12,'F8 · STATEFUL FIREWALL','etch micro');
const SL={};[['PWR','g'],['ALM','r'],['LOCK','a'],['VPN','b']].forEach(([n,c],i)=>{SL[n]=led(ff,8+i*8,16,.8);text(ff,8+i*8,20.6,n,'etch micro center');});
const lcdG=el('g',{},ff);rect(lcdG,43,2.6,50,16.8,1.6,'face recess');rect(lcdG,45,4.4,46,13.2,1,'lcdh');rect(lcdG,45,4.4,46,13.2,1,'face lcd');rect(lcdG,46,5,44,12,.4,'cells');
const L1=text(lcdG,46.4,10,'','ch'),L2=text(lcdG,46.4,15.6,'','ch');
const BTN=[];['◀','▶','▲','▼'].forEach((s,i)=>{const x=97+(i%2)*7,y=4.6+(i>>1)*7.4;rect(ff,x,y,5.4,5.4,1.2,'face bz btn');text(ff,x+2.7,y+3.8,s,'etch micro center').style.fill='#bbb';});
const PORT=[];const NAMES=['WAN1','WAN2','LAN1','LAN2','LAN3','LAN4','LAN5','LAN6'];
for(let i=0;i<8;i++){const u=113+i*10.6;text(ff,u+4.6,4.2,NAMES[i],'etch micro center').style.fontSize='2.1px';rect(ff,u,5.2,9.2,9.4,.8,'face recess');rect(ff,u+1,6.4,7.2,6.6,.5,'face jack');rect(ff,u+2.8,12.2,3.6,1.6,.3,'face jack');PORT.push({x:u+4.6,ln:led(ff,u+2,17.2,.55,2.2),ac:led(ff,u+7.2,17.2,.55,2.2)});}
plug(117.6,15);plug(138.8,15);
const pwrG=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Power (O)','aria-pressed':'true'},ff);rect(pwrG,36,15.4,4.6,4.6,2.3,'face bz btn');el('path',{d:'M37.4,16.9a1.6,1.6 0 1 0 1.8,0M38.3,16.4v1.5',class:'detail',style:'stroke:#bbb'},pwrG);rect(pwrG,34.6,14,7.4,7.4,2.6,'focus-ring');
const shield=el('g',{});const sp=P(117.6,128,15);const SH=[0,1,2].map(()=>el('circle',{cx:sp[0],cy:sp[1],r:2,class:'shield'},shield));
const PK=el('g',{});
frame([[-124,34,0,440,112,34],[0,0,0,200,128,26]],8);
// State: power, traffic level, lockdown, attack and auto-rule, alerts, counters.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const RATES=[1.2,3,6.5],TN=['LOW','BUSY','PEAK'];
let on=true,ti=1,lock=false,attack=null,alert=null,rules=12,pass=0,drop=0,gbps=0,lastT=0,lastUI=0,lastLed=0,nextIn=0,nextOut=0,sh=0,ac=null,msg='',msgT=0,bootT=-1e9;
const live=[],pool=[];
const keyB={};document.querySelectorAll('.hint [data-k]').forEach(b=>keyB[b.dataset.k]=b);
function say(m){announcement.textContent=m;}
function note(m){msg=m;msgT=performance.now()+1800;lastUI=0;}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac)ac=new A();if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function beep(f,d=.08,v=.02,at=0,type='square'){if(!ac)return;const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime+at;o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.02);}
// Pulses: dots that ride a cable path (forward or backward) between two lengths.
function pulse(path,from,to,cls,speed,done,r=1.5){if(reduced.matches||live.length>90)return;let n=pool.pop();if(!n){n=el('circle',{r},PK);}else{PK.appendChild(n);n.style.display='';}set(n,'r',r);set(n,'class','pk '+cls);live.push({n,path,s:from,to,v:Math.sign(to-from)*speed,done,fade:0});}
const WL=()=>WAN.len,LL=()=>LAN.len;
function inbound(kind){// kind: ok | bad | atk
const blocked=lock||kind==='bad'||(kind==='atk'&&attack&&attack.rule);const cls=kind==='ok'&&!lock?'g':kind==='atk'&&!attack.rule?'a':'r';
pulse(WAN,0,WL()-1,cls,150+Math.random()*40,()=>{
if(blocked){drop++;shieldHit();pulse(WAN,WL()-1,WL()-34,'r',90,null);}
else{pass++;if(kind==='atk'){attack.leak++;}flashPort(0,'a');setTimeout(()=>{flashPort(2,'a');pulse(LAN,0,LL(),cls,160,()=>{const c=CL[Math.random()*3|0];flashSw();pulse(c,0,c.len,cls,150,null,1.3);});},reduced.matches?0:120);}});}
function outbound(){const c=CL[Math.random()*3|0];pulse(c,c.len,0,'b',150,()=>{flashSw();pulse(LAN,LL(),0,'b',160,()=>{flashPort(2,'a');pass++;setTimeout(()=>{flashPort(0,'a');pulse(WAN,WL()-1,0,'b',150,()=>lit(ONT[2],'g'));},reduced.matches?0:120);});},1.3);}
const fl={};function flashPort(i,c){fl[i]=performance.now()+90;}
let swF=0;const flashSw=()=>{swF=performance.now()+90;};
function shieldHit(){const n=SH[sh++%3];n.t0=performance.now();}
function attackBurst(){audio();msgT=0;if(!on){note('POWER ON FIRST · O');return;}attack={t0:performance.now(),rule:false,leak:0,src:`203.0.113.${7+Math.random()*240|0}`};alert=null;say(`Attack burst from ${attack.src}.`);lastUI=0;}
function traffic(){audio();msgT=0;ti=(ti+1)%3;beep(900+ti*200,.04,.012);say(`Traffic ${TN[ti].toLowerCase()}.`);lastUI=0;}
function lockdown(){audio();msgT=0;lock=!lock;set(keyB.l,'aria-pressed',lock);beep(lock?500:800,.12,.02,0,'triangle');say(lock?'Lockdown: all new inbound traffic is dropped.':'Lockdown lifted.');lastUI=0;}
function clearA(){audio();msgT=0;if(!alert){note('NO ACTIVE ALERT');return;}alert=null;svg.classList.remove('alert');beep(1200,.05,.012);say('Alert acknowledged.');lastUI=0;}
function power(){audio();msgT=0;on=!on;set(pwrG,'aria-pressed',on);set(keyB.o,'aria-pressed',on);svg.classList.toggle('dead',!on);if(!on){attack=null;alert=null;svg.classList.remove('alert');for(const q of live){q.n.style.display='none';pool.push(q.n);}live.length=0;say('Firewall off. Traffic stops.');}else{bootT=performance.now();say('Firewall booting.');}beep(on?700:300,.15,.02,0,'triangle');lastUI=0;}
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(pwrG,power);
const act={a:attackBurst,t:traffic,l:lockdown,c:clearA,o:power};Object.entries(keyB).forEach(([k,b])=>b.addEventListener('click',()=>act[k]()));
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const f=act[e.key.toLowerCase()];if(f){e.preventDefault();f();}});
function tick(now){
const dt=Math.min(.05,(now-(lastT||now))/1000),red=reduced.matches;lastT=now;
const ready=on&&now-bootT>(red?0:1400);
if(ready){const rate=RATES[ti];
if(now>nextIn){nextIn=now+1000/rate*(.6+Math.random()*.8);inbound(Math.random()<.18?'bad':'ok');}
if(now>nextOut){nextOut=now+1000/rate*(.8+Math.random()*.9);outbound();}
if(attack){const e=(now-attack.t0)/1000;if(e<4.6){if(Math.random()<dt*22)inbound('atk');}
if(!attack.rule&&e>1.3){attack.rule=true;rules++;alert={src:attack.src,rule:rules};svg.classList.add('alert');for(let i=0;i<3;i++)beep(2200,.1,.025,i*.18);say(`Alert: flood from ${attack.src}. Rule ${rules} added to drop it.`);lastUI=0;}
if(e>5.6){attack=null;lastUI=0;}}}
for(let i=live.length;i--;){const q=live[i];q.s+=q.v*dt;const end=q.v>0?q.s>=q.to:q.s<=q.to;
const p=q.path.getPointAtLength(clamp(q.s,0,q.path.len));set(q.n,'cx',f2(p.x));set(q.n,'cy',f2(p.y));
if(q.done===null&&q.v<0&&q.path===WAN){q.n.style.opacity=f2(clamp((q.s-q.to)/30));}else q.n.style.opacity=1;
if(end){q.n.style.display='none';pool.push(q.n);live.splice(i,1);if(q.done)q.done();}}
SH.forEach(n=>{const t=n.t0?(now-n.t0)/420:1;if(t<1){set(n,'r',f2(2+t*7));n.style.opacity=f2((1-t)*.9);}else n.style.opacity=0;});
for(const f of fans){const sp=on?(attack?1:.55):0;f.s=(f.s||0)+(sp-(f.s||0))*clamp(dt*1.5);if(!red){f.a=(f.a+f.s*1300*dt)%360;set(f.bl,'transform',`rotate(${f2(f.a)})`);}f.blur.style.opacity=f2(clamp((f.s-.45)*.6,0,.3));}
if(now-lastLed>60){lastLed=now;const bk=(now/280|0)%2;
lit(SL.PWR,on?'g':'');lit(SL.ALM,alert?(bk||red?'r':''):'');lit(SL.LOCK,lock&&on?'a':'');lit(SL.VPN,ready?'b':'');
PORT.forEach((p,i)=>{const up=on&&(i===0||i===2);lit(p.ln,up?'g':'');lit(p.ac,up&&now<(fl[i]||0)?'a':'');});
lit(ONT[0],'g');lit(ONT[2],ready&&Math.random()<.5?'g':'');SWL.forEach((l,i)=>lit(l,i<4&&ready?(now<swF&&Math.random()<.7?'':'g'):''));}
{const c=!on?'':alert?(((now/280|0)%2||red)?'r':''):lock?'a':ready?'b':'';if(barG._c!==c){barG._c=c;set(barG,'class',c);barH.classList.toggle('on',!!c);bar.style.fill=c?'':'var(--off)';}}
gbps+=((ready?RATES[ti]*.31+(attack?1.4:0):0)-gbps)*clamp(dt*2);
if(!lastUI||now-lastUI>180){
const a=alert;L1.textContent=!on?'':!ready?'WARDGATE  BOOT  ':a?`!! FLOOD ${a.src.slice(-7)}`.slice(0,16):lock?'LOCKDOWN  ACTIVE':`WARDGATE F8  ${TN[ti].padStart(4)}`.slice(0,16);
L2.textContent=!on?'':!ready?'LOADING RULES...':a?`RULE ${a.rule} DROP /24`.slice(0,16):`P${String(pass).padStart(6)} D${String(drop).padStart(5)}`.slice(0,16);
readout.textContent=`${on?gbps.toFixed(1):'0.0'} Gb/s · ${pass.toLocaleString('en-US')} PASSED · ${drop.toLocaleString('en-US')} DROPPED`;
stateLabel.textContent=now<msgT?msg:!on?'OFF · PRESS O':!ready?`BOOTING · LOADING RULES · ${TN[ti]}`:attack&&!attack.rule?`SUSPICIOUS BURST · ${attack.src}`:a?`ALERT · FLOOD FROM ${a.src} · RULE ${a.rule} ADDED · C TO CLEAR`:lock?`LOCKDOWN · ${rules} RULES · INBOUND DROPPED`:`SECURE · ${rules} RULES · TRAFFIC ${TN[ti]}`;
lastUI=now;}
requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['a', 't', 'l', 'c', 'o'], draw }
