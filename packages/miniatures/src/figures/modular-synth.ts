// @ts-nocheck
/* CALDERN M–66 · Modular synth. Drawn for this package in the lab figures' form: its stylesheet, defs and script, on
 * the engine's kit. The script runs on the env, which stands in for the page; its types are at the boundary
 * (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--pan:#e8e8e4;--pan-top:#f7f7f4;--pan-side:#cbcbc7;--print:#2c2c2a;--hd:#c4422c;--pad:#353533;--pad-ink:#efeee9;--gr:#3a3937;--gr-top:#4b4a47;--gr-side:#2d2c2a;--slot:#232221;--wal:#7c5337;--wal-mid:#8a5e3d;--wal-top:#976944;--wal-side:#5f3f2a;--grain:#3a2414;--knob:#262625;--knob-top:#383836;--knob-side:#1b1b1a;--ind:#f4f3ee;--chrome:#d9dad8;--chrome-top:#f4f4f2;--chrome-side:#bdbebc;--rubber:#2e2e2d;--rubber-top:#474745;--rubber-side:#282827;--hole:#121212;--cap:#d8d7d1;--cap-top:#ecebe6;--brass:#cfa95d;--brass-top:#e8c985;--brass-ink:#3d2e12;--off:#b4b4af;--g:#22c46c;--a:#ffad24;--r:#ff3b30;--seg:#ff4632;--glow:.4;--c0:#4a4a48;--c0t:#6a6a67;--c0s:#363635;--c1:#f0bf2c;--c1t:#f7d977;--c1s:#c4951a;--c2:#e0483d;--c2t:#ee7b71;--c2s:#b3352c;--c3:#3d70de;--c3t:#7aa0ee;--c3s:#2b55b0;--c4:#8a5ed6;--c4t:#ad8ce6;--c4s:#6a45ad;--c5:#1fa487;--c5t:#5cc6ab;--c5s:#168168;--c6:#ee872b;--c6t:#f5ac69;--c6s:#c26a18;--c7:#e5639a;--c7t:#f093b9;--c7s:#bd4a7b}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--pan:#c3c3c1;--pan-top:#e7e7e4;--pan-side:#8f8f8d;--print:#232322;--hd:#a8301d;--pad:#2b2b2a;--pad-ink:#d6d5d0;--gr:#2f2e2d;--gr-top:#464542;--gr-side:#1c1c1b;--slot:#1a1a19;--wal:#68452d;--wal-mid:#7a5235;--wal-top:#8d623f;--wal-side:#412a1b;--grain:#2f1d0f;--knob:#1c1c1b;--knob-top:#2e2e2d;--knob-side:#101010;--ind:#d9d8d3;--chrome:#b7b7b6;--chrome-top:#e4e4e2;--chrome-side:#858585;--rubber:#252524;--rubber-top:#424240;--rubber-side:#191919;--hole:#0a0a0a;--cap:#b6b5b1;--cap-top:#dddcd7;--brass:#ae8e4d;--brass-top:#d9bc7c;--brass-ink:#2d210c;--off:#8d8d89;--g:#36d886;--a:#ffb53d;--r:#ff4c41;--seg:#ff5440;--glow:.85;--c0:#3d3d3c;--c0t:#636360;--c0s:#232323;--c1:#caa123;--c1t:#e7cb6f;--c1s:#8a680f;--c2:#bd3b32;--c2t:#df7369;--c2s:#7e221c;--c3:#325dbb;--c3t:#7295df;--c3s:#1b3a7b;--c4:#734eb4;--c4t:#a283d7;--c4s:#492e79;--c5:#188a71;--c5t:#56b9a0;--c5s:#0c5947;--c6:#c97123;--c6t:#e5a162;--c6s:#88490d;--c7:#c15281;--c7t:#e189ad;--c7s:#853255;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.pan{fill:var(--pan)}.top.pan{fill:var(--pan-top)}.side.pan{fill:var(--pan-side)}.gr{fill:var(--gr)}.top.gr{fill:var(--gr-top)}.side.gr{fill:var(--gr-side)}.wal{fill:var(--wal)}.mid.wal{fill:var(--wal-mid)}.top.wal{fill:var(--wal-top)}.side.wal{fill:var(--wal-side)}.knob{fill:var(--knob)}.top.knob{fill:var(--knob-top)}.side.knob{fill:var(--knob-side)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.rubber{fill:var(--rubber)}.top.rubber{fill:var(--rubber-top)}.side.rubber{fill:var(--rubber-side)}.brass{fill:var(--brass)}.top.brass{fill:var(--brass-top)}.cap{fill:var(--cap)}.top.cap{fill:var(--cap-top)}
.brush{fill:url(#brush);stroke:none;pointer-events:none}.grain{fill:none;stroke:var(--grain);stroke-width:.6;vector-effect:non-scaling-stroke;opacity:.5}.groove{fill:none;stroke:var(--slot);stroke-width:1.1;opacity:.85}
.ink{fill:none;stroke:var(--print);stroke-width:.32;stroke-linecap:round;stroke-linejoin:round}.pr{fill:var(--print);font:600 2.3px ui-monospace,monospace;letter-spacing:.15px;stroke:none}.pr.pad-ink{fill:var(--pad-ink)}.hd{fill:var(--hd);font:800 4.4px system-ui,sans-serif;letter-spacing:.8px;stroke:none}.padf{fill:var(--pad);stroke:none}.logo{fill:var(--brass-ink);font:italic 600 4.4px Georgia,'Times New Roman',serif;letter-spacing:.25px;stroke:none}.model{fill:var(--brass-ink);font:600 1.9px ui-monospace,monospace;letter-spacing:.3px;stroke:none}
.hole{fill:var(--hole);stroke:none}.sheen{fill:none;stroke:#fff;stroke-width:.7;stroke-linecap:round;opacity:.22}.ind{fill:none;stroke:var(--ind);stroke-width:.8;stroke-linecap:round}.bezel{fill:var(--slot);stroke:none}
.lc{fill:var(--off);stroke:none}.lc.on{filter:url(#lg)}.lc.g{fill:var(--g)}.lc.a{fill:var(--a)}.lc.r{fill:var(--r)}.halo{opacity:0;filter:url(#bloom);pointer-events:none}.halo.g{fill:var(--g);opacity:var(--glow)}.halo.a{fill:var(--a);opacity:var(--glow)}.halo.r{fill:var(--r);opacity:var(--glow)}
.lv{stroke:none;filter:url(#lg)}.lv.g,.hv.g{fill:var(--g)}.lv.a,.hv.a{fill:var(--a)}.hv{filter:url(#bloom);pointer-events:none}
.key{fill:var(--hd)}.glyph{fill:#fff;opacity:.88;stroke:none}.cap.lit{fill:var(--a)}.top.cap.lit{fill:#ffd27e}
.seg{fill:var(--seg);font:700 6.4px ui-monospace,monospace;letter-spacing:.5px;filter:url(#lg);stroke:none}.segh{fill:var(--seg);opacity:.12;filter:url(#bloom);pointer-events:none}.oled{fill:#120d0c;stroke:none}
.k0{--cc:var(--c0);--cct:var(--c0t);--ccs:var(--c0s)}.k1{--cc:var(--c1);--cct:var(--c1t);--ccs:var(--c1s)}.k2{--cc:var(--c2);--cct:var(--c2t);--ccs:var(--c2s)}.k3{--cc:var(--c3);--cct:var(--c3t);--ccs:var(--c3s)}.k4{--cc:var(--c4);--cct:var(--c4t);--ccs:var(--c4s)}.k5{--cc:var(--c5);--cct:var(--c5t);--ccs:var(--c5s)}.k6{--cc:var(--c6);--cct:var(--c6t);--ccs:var(--c6s)}.k7{--cc:var(--c7);--cct:var(--c7t);--ccs:var(--c7s)}
.cab{pointer-events:none}.cu{fill:none;stroke:var(--line);stroke-width:4;stroke-linecap:round}.cc{fill:none;stroke:var(--cc);stroke-width:2.9;stroke-linecap:round}.cs{fill:none;stroke:#fff;stroke-width:.55;stroke-linecap:round;opacity:.4;transform:translate(-.35px,-.45px)}.cp{fill:none;stroke:#fff;stroke-width:1.5;stroke-linecap:butt;stroke-dasharray:11 400;opacity:0;filter:url(#lg)}
.plug{fill:var(--cc)}.top.plug{fill:var(--cct)}.side.plug{fill:var(--ccs)}
.sel{fill:none;stroke:var(--accent);stroke-width:1.2;vector-effect:non-scaling-stroke;pointer-events:none}.selh{fill:var(--accent);opacity:.12;filter:url(#bloom);pointer-events:none}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
.jack{cursor:grab;touch-action:none}.turn{cursor:ns-resize;touch-action:none}.dragging,.dragging .jack{cursor:grabbing}.btn{transition:transform 60ms}.down .btn{transform:translate(.85px,-.47px)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<filter id="lg" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation=".5" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<pattern id="brush" width="37" height="1.4" patternUnits="userSpaceOnUse"><path d="M0,.2H13M16,.2H37" style="stroke:#fff;stroke-opacity:.32;stroke-width:.16"/><path d="M4,.6H27M30,.6H37" style="stroke:#000;stroke-opacity:.05;stroke-width:.14"/><path d="M0,1H8M11,1H37" style="stroke:#fff;stroke-opacity:.22;stroke-width:.14"/></pattern>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,addEventListener,kit}=env;
/* CALDERN M–66, a desktop Eurorack case. World: x lower-right along the row; y lower-left (the row faces +y, reclined
22° from upright); z up. 1 unit = 1 mm; 1 HP = 5.
Part                          x        y        z      w      d      h
feet ×4                  14/310   50/106        0      6     10      3
cheeks ×2 (walnut)        0/320       46        3     10   76.6  146.5   a wedge: 76.6 deep at the foot, 23.5 at the top
deck (walnut)                10       46    147.7    310   18.8      –   behind the top rail
row (reclined 22°)           10  64.8–118  147.7–16  310      –      –   rails 7 above and below the 128 of modules
lip (walnut)                 10      118        3    310      –     13   brass plate 44 × 9 at x 143
modules (u along the row, v down it): SEQ 0–120 · VCO 120–180 · VCF 180–230 · ENV 230–270 · OUT 270–310
Knobs, jacks, buttons and plugs stand on the row's normal from the plate faces (1.6 proud of the rails); cables hang from
the plug tails, 15 out, and sag under gravity. Painter order: shadow, feet, left cheek, deck, rails, plates and their
print, the parts by depth, lip, right cheek, the focus ring, cables by depth, the jacks' controls. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{P,set,FRONT,SIDE,el,group,rect,circle,line,text,poly,box,screw,frame}=kit(()=>root);
const{sin,cos,hypot,min,max,round,abs,exp,PI}=Math,RAD=PI/180,f2=v=>(+v).toFixed(2),clamp=(v,a,b)=>max(a,min(b,v));
// The row's plane: u along it, v down it, n out of it. L gives a point raised n off the plate face in the plate's own 2D frame.
const TH=22*RAD,sn=sin(TH),cs=cos(TH),U=[1,0,0],V=[0,sn,-cs],N=[0,cs,sn],YB=118,ZB=16,YK=46,O=[10,YB-135*sn,ZB+135*cs];
const W=(u,v,n=0)=>[O[0]+u,O[1]+v*sn+n*cs,O[2]-v*cs+n*sn],WP=(u,v,n=0)=>W(u,v,1.6+n);
const pu=P(...U),pv=P(...V),pn=P(...N),DET=pu[0]*pv[1]-pu[1]*pv[0],NU=(pn[0]*pv[1]-pn[1]*pv[0])/DET,NV=(pu[0]*pn[1]-pu[1]*pn[0])/DET;
const frameAt=o=>`matrix(${[...pu,...pv,...P(...o)].map(v=>+v.toFixed(4)).join(' ')})`,ROW=frameAt(W(0,0)),PLATE=frameAt(WP(0,0));
const L=(u,v,n)=>[u+NU*n,v+NV*n];
function stad(u,v,n0,n1,r){const[a,b]=L(u,v,n0),du=NU*(n1-n0),dv=NV*(n1-n0),l=hypot(du,dv)||1,tx=-dv*r/l,ty=du*r/l;
return`M${f2(a+tx)},${f2(b+ty)}A${r},${r} 0 0 1 ${f2(a-tx)},${f2(b-ty)}L${f2(a+du-tx)},${f2(b+dv-ty)}A${r},${r} 0 0 1 ${f2(a+du+tx)},${f2(b+dv+ty)}Z`;}
function post(g,u,v,n0,n1,r,m){el('path',{d:stad(u,v,n0,n1,r),class:'face side '+m},g);const[a,b]=L(u,v,n1);return circle(g,f2(a),f2(b),r,'face top '+m);}
function bind(g,fn){g.addEventListener('click',()=>fn());g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,attrs){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0',...attrs}))set(g,k,v);return g;}
function lit(n,c){if(n._c!==c){n._c=c;set(n,'class','lc'+(c?' on '+c:''));if(n.h)set(n.h,'class','halo'+(c?' '+c:''));}}
const fade=(n,v)=>{const s=v<.02?'0':f2(v);if(n._o!==s){n._o=s;n.style.opacity=s;}};

// Floor: the house ground shadow, a soft ellipse round the case's foot, projected from the floor so it frames true.
const sh=[...Array(48)].map((_,i)=>{const t=i/48*2*PI;return P(165+176*cos(t),84+52*sin(t),0).map(f2).join(',');}),shD=`M${sh.join('L')}Z`;
el('path',{d:shD,class:'shadow stage-floor'});el('path',{d:shD,class:'stage-contact'});
for(const[x,y]of[[14,50],[310,50],[14,106],[310,106]])box(x,y,0,6,10,3,1,'rubber');
// The case: walnut cheeks cut to the row's slope, a walnut deck behind the top rail and a walnut lip under the bottom one.
const yt=W(0,-7)[1],zt=W(0,-7)[2],PROF=[[YK,3],[YB+5*cs,3],[YB+5*cs,ZB+5*sn],[yt+5*cs,zt+5*sn],[YK,zt+5*sn]];
function cheek(x0,grain){const x1=x0+10,y0=PROF[1][0],z0=PROF[3][1],run=y0-PROF[3][0],rise=z0-PROF[2][1];el('path',{d:poly(PROF.map(([y,z])=>[x1,y,z]),true),class:'face side wal'});
// Grain along the outer face (u runs back from its front edge, v down from its top), clear of the sloped front.
if(grain){const sf=group(SIDE(x1,y0,z0)),u1=y0-PROF[0][0]-4;for(let i=0;i<9;i++){const v=8+i*16.5,w=i%2?.9:-.7,u0=(v<rise?run*(1-v/rise):0)+4;
el('path',{d:`M${f2(u0)},${f2(v)}C${f2(u0+(u1-u0)*.35)},${f2(v-1.2+w)} ${f2(u0+(u1-u0)*.7)},${f2(v+1+w)} ${f2(u1)},${f2(v-.6)}`,class:'grain'},sf);}}
for(let i=1;i<4;i++){const[a,za]=PROF[i],[b,zb]=PROF[i+1];el('path',{d:poly([[x0,a,za],[x1,a,za],[x1,b,zb],[x0,b,zb]],true),class:'face wal '+(i===1?'':i===2?'mid':'top')});}}
cheek(0,false);
el('path',{d:poly([[10,YK,zt],[320,YK,zt],[320,yt,zt],[10,yt,zt]],true),class:'face top wal'});
const RW=group(ROW);rect(RW,0,-7,310,7,0,'face gr');rect(RW,0,128,310,7,0,'face gr');line(RW,1,-3.4,309,-3.4,'groove');line(RW,1,131.6,309,131.6,'groove');
// Modules: aluminum plates 1.6 proud of the rails, each with its top edge catching the light.
const MODS=[['seq','SEQ',0,120],['vco','VCO',120,60],['vcf','VCF',180,50],['env','ENV',230,40],['out','OUT',270,40]].map(([id,label,u,w])=>({id,label,u,w,outs:[],fl:[],reach:false}));
const M=Object.fromEntries(MODS.map(m=>[m.id,m]));
for(const m of MODS){const[a,b]=L(m.u,0,1.6),w=m.w-.35;el('path',{d:`M${m.u},0H${f2(m.u+w)}L${f2(a+w)},${f2(b)}H${f2(a)}Z`,class:'face top pan'},RW);}
const PF=group(PLATE);
for(const m of MODS){rect(PF,m.u,0,m.w-.35,128,.5,'face pan');rect(PF,m.u+.4,.4,m.w-1.15,127.2,.4,'brush');text(PF,m.u+m.w/2,10.6,m.label,'hd center');
for(const[x,y]of m.w>50?[[5,3.4],[m.w-5,3.4],[5,124.6],[m.w-5,124.6]]:[[5,3.4],[m.w-5,124.6]])screw(PF,m.u+x,y);}
// Print: knob scales and labels, a dark pad under each output, the step section and its flow down to the outputs.
const ink=(d)=>el('path',{d,class:'ink'},PF);
const label=(u,v,t,on)=>text(PF,u,v,t,'pr center'+(on?' pad-ink':''));
// Jacks: id, module, in or out, panel label, u, v, the name read out, the cable color it gives.
const JACKS=[['seq.cv','seq','out','CV',88,107,'sequencer CV out','k1'],['seq.gate','seq','out','GATE',104,107,'sequencer gate out','k2'],
['vco.voct','vco','in','V/OCT',135,88,'oscillator pitch in'],['vco.fm','vco','in','FM',165,88,'oscillator FM in'],['vco.saw','vco','out','SAW',135,107,'oscillator saw out','k3'],['vco.sqr','vco','out','SQR',165,107,'oscillator square out','k4'],
['vcf.in','vcf','in','IN',192,88,'filter in'],['vcf.cv','vcf','in','CV',218,88,'filter CV in'],['vcf.out','vcf','out','OUT',205,107,'filter out','k5'],
['env.gate','env','in','GATE',250,88,'envelope gate in'],['env.a','env','out','A',241,107,'envelope out A','k6'],['env.b','env','out','B',259,107,'envelope out B','k7'],
['out.in','out','in','IN',281,88,'output in'],['out.cv','out','in','CV',299,88,'output level CV in']].map(([id,m,kind,lab,u,v,name,k])=>({id,m:M[m],kind,lab,u,v,name,k,cab:null}));
const J=Object.fromEntries(JACKS.map(j=>[j.id,j]));
for(const j of JACKS){if(j.kind==='out'){j.m.outs.push(j);rect(PF,j.u-6.2,j.v-6.2,12.4,16,2.2,'padf');}label(j.u,j.kind==='out'?j.v+8.4:j.v-6.4,j.lab,j.kind==='out');}
// Knobs: name, u, v, radius, height, range and step, the value, how it reads.
const pct=k=>v=>`${round((v-k.min)/(k.max-k.min)*100)}%`,ms=s=>s<1?`${round(s*1000)} MS`:`${s.toFixed(2)} S`;
const SCALE=[0,3,5,7,10],NAMES=['A','A♯','B','C','C♯','D','D♯','E','F','F♯','G','G♯'],semi=d=>SCALE[d%5]+12*Math.floor(d/5),noteOf=d=>{const s=semi(d);return NAMES[s%12]+(2+Math.floor((s+9)/12));};
const att=()=>.002+(K.ATTACK.val/20)**2*.9,dec=()=>.05+(K.DECAY.val/20)**2*1.6;
const PAT=[0,0,3,5,2,4,3,1],GATES=[1,0,1,1,1,0,1,1],SU=i=>38+i*10.4;
const KN=[['TEMPO',17,46,7,8,60,200,4,120,v=>`${v} BPM`],...PAT.map((d,i)=>[`STEP ${i+1}`,SU(i),41,3.7,5,0,10,1,d,noteOf]),
['TUNE',150,36,9.5,9,-12,12,1,0,v=>`${v>0?'+':v<0?'−':''}${abs(v)} ST`],['FM',150,66,5,6.5,0,10,1,3,null],['CUTOFF',205,36,9.5,9,0,20,1,11,null],['RES',205,66,5.5,6.5,0,20,1,8,null],
['ATTACK',250,33,5.5,6.5,0,20,1,1,()=>ms(att())],['DECAY',250,60,5.5,6.5,0,20,1,8,()=>ms(dec())],['LEVEL',290,33,6.5,7.5,0,20,1,16,null]]
.map(([name,u,v,r,h,a,b,step,val,fmt])=>{const k={name,u,v,r,h,min:a,max:b,step,val,s:-1,d:-2};k.fmt=fmt||pct(k);return k;});
const K=Object.fromEntries(KN.map(k=>[k.name,k]));
for(const k of KN){const rs=k.r*1.18,big=k.r>6,n=big?11:k.r>4.5?7:0;for(let i=0;i<n;i++){const a=(-135+270*i/(n-1))*RAD,r0=rs+1.1,r1=rs+(i%5===0&&big?2.8:2.1);ink(`M${f2(k.u+r0*sin(a))},${f2(k.v-r0*cos(a))}L${f2(k.u+r1*sin(a))},${f2(k.v-r1*cos(a))}`);}
if(!k.name.startsWith('STEP'))label(k.u,k.v+rs+(n?5.6:4.4),k.name);}
// The sequencer: a red tempo display, the steps in a printed frame (LED, pitch knob, gate button, number), the run key.
rect(PF,5,17,24,10.5,1.2,'face bezel');rect(PF,5.8,17.8,22.4,8.9,.8,'oled');el('rect',{x:6.4,y:18.4,width:21.2,height:7.7,class:'segh'},PF);const seg=text(PF,17,24.8,'120','seg center');
el('rect',{x:33,y:16.5,width:83,height:57.5,rx:2.4,class:'ink'},PF);ink('M35,22.5H114');for(let i=0;i<8;i++){label(SU(i),69.6,String(i+1));ink(`M${f2(SU(i))},21V24`);}
ink('M96,74V93.6M94.6,91.4L96,93.6L97.4,91.4');label(64,80,'STEPS · A MINOR');label(17,117.4,'RUN');
label(290,117.4,'PHONES');
// Raised parts, drawn by depth: jacks, knobs, buttons, LEDs.
const PP=group(PLATE),parts=[];
const part=(u,v,fn)=>parts.push({u,v,fn});
for(const j of JACKS)part(j.u,j.v,()=>{post(PP,j.u,j.v,0,1.6,3.4,'chrome');const[a,b]=L(j.u,j.v,1.6);circle(PP,f2(a),f2(b),2.35,'detail');circle(PP,f2(a),f2(b),1.5,'hole');});
part(290,107,()=>{post(PP,290,107,0,2,4.6,'chrome');const[a,b]=L(290,107,2);circle(PP,f2(a),f2(b),3.4,'detail');circle(PP,f2(a),f2(b),2.3,'hole');});
for(const k of KN)part(k.u,k.v,()=>{const rs=k.r*1.18;post(PP,k.u,k.v,0,1.4,rs,'knob');post(PP,k.u,k.v,1.4,k.h,k.r,'knob');const[a,b]=L(k.u,k.v,k.h),g=group(`translate(${f2(a)} ${f2(b)})`,PP);el('path',{d:`M${f2(-k.r*.72)},${f2(-k.r*.3)}A${k.r*.78},${k.r*.78} 0 0 1 ${f2(-k.r*.18)},${f2(-k.r*.74)}`,class:'sheen'},g);k.ind=group('',g);line(k.ind,0,-k.r*.22,0,-k.r*.88,'ind');});
function sbtn(u,v,w,l,h,label,fn,m='cap'){const g=button(el('g',{},PP),{'aria-label':label}),[a,b]=L(u,v,h);
el('path',{d:`M${u},${v}H${u+w}L${f2(a+w)},${f2(b)}H${f2(a)}Z`,class:'face top gr'},g);el('path',{d:`M${u+w},${v}V${v+l}L${f2(a+w)},${f2(b+l)}V${f2(b)}Z`,class:'face side gr'},g);
const cap=group('',g,{class:'btn'}),top=rect(cap,f2(a),f2(b),w,l,.8,'face '+m);rect(g,f2(a-1.1),f2(b-1.1),w+2.2,l+2.2,1.2,'focus-ring');bind(g,fn);return{g,cap,top,a,b};}
const ST=PAT.map((_,i)=>({on:!!GATES[i],k:KN[i+1]}));
ST.forEach((s,i)=>{part(SU(i),58,()=>{s.b=sbtn(SU(i)-3,55,6,6,2,`Step ${i+1} (${i+1})`,()=>toggleStep(i));});part(SU(i),22.5,()=>{s.led=mkled(SU(i),22.5,1.2);});});
let runB=null,runL=null;part(17,101,()=>{runB=sbtn(8,95,18,13,2.4,'Run or stop the sequencer (Space)',()=>runStop(),'key');const x=runB.a+5.6,y=runB.b+4.3;el('path',{d:`M${f2(x)},${f2(y)}v4.4l3.6,-2.2Z M${f2(x+5.4)},${f2(y+.2)}h1.4v4h-1.4Z M${f2(x+7.6)},${f2(y+.2)}h1.4v4h-1.4Z`,class:'glyph'},runB.cap);});
part(17,86,()=>{runL=mkled(17,86,1.3);});
const ML={};for(const[id,u]of[['vco',172],['vcf',223],['env',263]])part(u,9.2,()=>{ML[id]=mkvled(u,9.2);});
const METER=[];for(let i=0;i<5;i++)part(290,72-i*5,()=>{METER[i]=mkled(290,72-i*5,1.2);});
function mkled(u,v,r){const[a,b]=L(u,v,.4),h=circle(PP,f2(a),f2(b),r*3.4,'halo');circle(PP,f2(a),f2(b),r+.55,'bezel');const n=circle(PP,f2(a),f2(b),r,'lc');n.h=h;n._c='';return n;}
function mkvled(u,v){const[a,b]=L(u,v,.4),h=circle(PP,f2(a),f2(b),4.2,'hv a');circle(PP,f2(a),f2(b),1.8,'bezel');circle(PP,f2(a),f2(b),1.25,'lc');const n=circle(PP,f2(a),f2(b),1.25,'lv a');fade(h,0);fade(n,0);return{n,h};}
parts.sort((p,q)=>(p.u-.553*p.v)-(q.u-.553*q.v)).forEach(p=>p.fn());
// The lip under the row with the brand plate, then the right cheek in front of everything on the row.
el('path',{d:poly([[10,YB,3],[320,YB,3],[320,YB,ZB],[10,YB,ZB]],true),class:'face wal'});
const BP=group(FRONT(143,YB,14));rect(BP,0,0,44,8.6,1.3,'face brass');rect(BP,1.1,1.1,41.8,6.4,.8,'detail');text(BP,16.5,5.9,'Caldern','logo center');text(BP,33.4,5.6,'M–66','model center');
for(const u of[2.7,41.3])screw(BP,u,4.3);
cheek(320,true);
// The focus ring round the knob the arrows turn.
const SEL=group(PLATE),selH=el('circle',{class:'selh'},SEL),selR=el('circle',{class:'sel'},SEL);
// Cables: a fixed pool, each an outline, a colored core, a sheen and the pulse that runs down it, with a plug at each end.
const cabG=el('g',{}),NH=12;
const POOL=[...Array(8)].map(()=>{const g=el('g',{class:'cab',display:'none'},cabG),d={g,used:false,key:'',pv:false};
d.u=el('path',{class:'cu'},g);d.c=el('path',{class:'cc'},g);d.s=el('path',{class:'cs'},g);d.p=el('path',{class:'cp',pathLength:100},g);
d.plugs=[0,1].map(()=>{const pg=group(PLATE,g);return{body:el('path',{class:'face side plug'},pg),cap:el('circle',{r:2.9,class:'face top plug'},pg),rel:el('path',{class:'face plug'},pg),rcap:el('circle',{r:1.9,class:'face top plug'},pg)};});return d;});
// The jacks' controls: drag from one to another to patch, or press Enter on one and then on another.
const JB=el('g',{});
for(const j of JACKS){const q=P(...WP(j.u,j.v,1.6));j.q=q;j.ctl=button(el('g',{},JB),{class:'control jack'});
el('circle',{cx:f2(q[0]),cy:f2(q[1]),r:6,class:'hit'},j.ctl);el('circle',{cx:f2(q[0]),cy:f2(q[1]),r:5.2,class:'focus-ring'},j.ctl);
j.ctl.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)jackKey(j);}});j.ctl.addEventListener('focus',()=>{if(hold&&hold.kb){hold.u=j.u;hold.v=j.v;}});}
for(const k of KN){const q=P(...WP(k.u,k.v,k.h/2));k.q=q;el('circle',{cx:f2(q[0]),cy:f2(q[1]),r:f2(k.r*1.18+1.2),class:'hit turn'},JB);}
frame([[0,46,0,330,76.7,149.6],[90,122,6,230,20,8]],10);

// State: the sequencer, knobs, patch and its signal graph; Web Audio after a gesture, wired like the cables.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const PRESETS=[['BASS',[['seq.cv','vco.voct'],['seq.gate','env.gate'],['vco.saw','vcf.in'],['vcf.out','out.in'],['env.a','out.cv']]],
['PLUCK',[['seq.cv','vco.voct'],['seq.gate','env.gate'],['vco.sqr','vcf.in'],['vcf.out','out.in'],['env.a','vcf.cv'],['env.b','out.cv']]],
['WAH',[['seq.cv','vcf.cv'],['seq.gate','env.gate'],['vco.saw','vcf.in'],['vcf.out','out.in'],['env.a','out.cv']]],
['ZAP',[['seq.cv','vco.voct'],['seq.gate','env.gate'],['env.a','vco.fm'],['vco.sqr','out.in'],['env.b','out.cv']]]];
const HOP=110,cables=[];
let sel=null,run=true,step=0,nextS=0,nextT=0,clk='',kf=K.CUTOFF?KN.indexOf(K.CUTOFF):0,pi=0,pname='BASS',chainS='',hold=null,drag=null,last=0,note='',noteT=0,sayMsg='',sayT=0,outKey='',lvl=0,order='';
const Q=[];
const say=m=>{announcement.textContent=m;},notice=(m,a)=>{note=m;noteT=performance.now()+1600;if(a){sayMsg=a;sayT=performance.now()+350;}};
const nm=j=>`${j.m.label} ${j.lab}`;
let ac=null,A=null;
const live=()=>ac&&ac.state==='running',clock=()=>live()?ac.currentTime:performance.now()/1000;
function audio(){try{const Ctor=window.AudioContext||window.webkitAudioContext;if(!Ctor)return;if(!ac){ac=new Ctor();build();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;A=null;}}
function build(){const g=v=>{const n=ac.createGain();n.gain.value=v;return n;},one=ac.createBuffer(1,64,ac.sampleRate);one.getChannelData(0).fill(1);
const dc=()=>{const s=ac.createBufferSource(),n=g(0);s.buffer=one;s.loop=true;s.connect(n);s.start();return n;};
const saw=ac.createOscillator(),sqr=ac.createOscillator(),lp=ac.createBiquadFilter(),vca=g(1),lv=g(.8),mst=g(.32),cmp=ac.createDynamicsCompressor();
saw.type='sawtooth';sqr.type='square';lp.type='lowpass';
const n={'seq.cv':dc(),'seq.gate':dc(),env:dc(),'vco.voct':g(1200),'vco.fm':g(135),'vco.saw':g(.3),'vco.sqr':g(.2),'vcf.in':g(1),'vcf.cv':g(2400),'vcf.out':g(1),'env.a':g(1),'env.b':g(1),'out.in':g(1),'out.cv':g(1)};
n['vco.voct'].connect(saw.detune);n['vco.voct'].connect(sqr.detune);n['vco.fm'].connect(saw.frequency);n['vco.fm'].connect(sqr.frequency);saw.connect(n['vco.saw']);sqr.connect(n['vco.sqr']);saw.start();sqr.start();
n['vcf.in'].connect(lp);n['vcf.cv'].connect(lp.detune);lp.connect(n['vcf.out']);n.env.connect(n['env.a']);n.env.connect(n['env.b']);n['out.in'].connect(vca);n['out.cv'].connect(vca.gain);vca.connect(lv);lv.connect(mst);mst.connect(cmp);cmp.connect(ac.destination);
A={n,saw,sqr,lp,vca,lv};rewire();tone();}
function rewire(){if(!A)return;for(const j of JACKS)if(j.kind==='out')A.n[j.id].disconnect();for(const c of cables)if(c.a&&c.b&&A.n[c.b.id])A.n[c.a.id].connect(A.n[c.b.id]);A.vca.gain.value=J['out.cv'].cab&&J['out.cv'].cab.a?0:1;}
function tone(){if(!A)return;const t=ac.currentTime,f=110*2**(K.TUNE.val/12);for(const o of[A.saw,A.sqr])o.frequency.setTargetAtTime(f,t,.02);
A.lp.frequency.setTargetAtTime(50*2**(K.CUTOFF.val/20*8.5),t,.03);A.lp.Q.value=.7+K.RES.val/20*13;A.n['vco.fm'].gain.setTargetAtTime(K.FM.val*45,t,.03);A.lv.gain.setTargetAtTime(K.LEVEL.val/20,t,.03);}
const gated=()=>{const c=J['env.gate'].cab;return!!(c&&c.a&&c.a.id==='seq.gate');};
// The sequencer runs on the audio clock once there's sound (notes scheduled a little ahead), else on the page's.
function fire(s,t){if(!A||!live())return;const st=ST[s];A.n['seq.cv'].gain.setValueAtTime(semi(st.k.val)/12,t);if(!st.on)return;const gg=A.n['seq.gate'].gain;gg.setValueAtTime(1,t);gg.setValueAtTime(0,t+15/K.TEMPO.val);
if(gated()){const e=A.n.env.gain,a=att();e.cancelScheduledValues?.(t);e.setTargetAtTime(1,t,a/3);e.setTargetAtTime(0,t+a,dec()/3);}}
function sched(now){const t=clock();if(run){const src=live()?'a':'p';if(src!==clk||nextT<t-.3){clk=src;nextT=t+.04;Q.length=0;}
while(nextT<t+.15){fire(nextS,nextT);Q.push([nextT,nextS]);nextS=(nextS+1)%8;nextT+=30/K.TEMPO.val;}}
while(Q.length&&Q[0][0]<=t){step=Q.shift()[1];arrive(step,now);}}
// A note's wave down the patch: from the sequencer's outputs along each cable to the module it feeds, and on out of it.
function arrive(s,now){if(!ST[s].on)return;const seen=new Set(),q=M.seq.outs.map(o=>[o,now]);
while(q.length){const[o,t]=q.shift();if(seen.has(o))continue;seen.add(o);const c=o.cab;if(!c||!c.b||c.a!==o)continue;const m=c.b.m;if(m.id==='env'&&o.id!=='seq.gate')continue;
c.ps.push(t);const ta=t+HOP;m.fl.push(ta);for(const x of m.outs)q.push([x,ta+40]);}}
function reach(){for(const m of MODS)m.reach=false;M.seq.reach=true;const seen=new Set(),q=[...M.seq.outs];
while(q.length){const o=q.shift();if(seen.has(o))continue;seen.add(o);const c=o.cab;if(!c||!c.b||c.a!==o)continue;const m=c.b.m;if(m.id==='env'&&o.id!=='seq.gate')continue;m.reach=true;q.push(...m.outs);}}
// What reaches the output: traced back from its input through the filter to whatever feeds it.
function chain(){const path=['OUT'],seen=new Set();let j=J['out.in'];
while(j&&j.cab&&j.cab.a&&!seen.has(j)){seen.add(j);const s=j.cab.a;if(s.m.id==='vcf'){path.unshift('VCF');j=J['vcf.in'];}else{path.unshift(s.m.label);break;}}
return path.length>1?path.join(' → '):'NOTHING AT OUT';}
function take(){const s=POOL.find(p=>!p.used);s.used=true;set(s.g,'display','inline');return s;}
function pull(c){const i=cables.indexOf(c);if(i<0)return;for(const e of['a','b'])if(c[e]&&c[e].cab===c)c[e].cab=null;cables.splice(i,1);c.slot.used=false;c.slot.key='';set(c.slot.g,'display','none');}
function plug(o,i){const c={a:o,b:i,k:o.k,slot:take(),t0:last,ps:[]};o.cab=i.cab=c;cables.push(c);set(c.slot.g,'class','cab '+c.k);return c;}
function changed(){reach();rewire();const have=new Set(cables.filter(c=>c.a&&c.b).map(c=>c.a.id+'>'+c.b.id));
pname=!have.size?'EMPTY':(PRESETS.find(([,p])=>p.length===have.size&&p.every(([a,b])=>have.has(a+'>'+b)))||['USER'])[0];chainS=chain();sync();}
function sync(){for(const s of ST)if(s.b){set(s.b.g,'aria-pressed',String(s.on));set(s.b.top,'class','face cap'+(s.on?' lit':''));}
if(runB)set(runB.g,'aria-pressed',String(run));
for(const j of JACKS){const c=j.cab,o=c&&(c.a===j?c.b:c.a);set(j.ctl,'aria-label',`${j.name[0].toUpperCase()+j.name.slice(1)}${o?`, patched to ${o.name}`:''}`);}}
function load(i){hold=null;drag=null;svg.classList.remove('dragging');for(const c of[...cables])pull(c);for(const[a,b]of PRESETS[i][1])plug(J[a],J[b]);changed();}
// Keys and parts.
const pressCap=b=>{if(!b)return;b.g.classList.add('down');b.cap._t=performance.now()+110;};
function runStop(){audio();run=!run;Q.length=0;if(run){nextS=0;clk='';notice('',`Running at ${K.TEMPO.val} BPM.`);}else{step=0;if(A&&live()){const t=ac.currentTime,gg=A.n['seq.gate'].gain;gg.cancelScheduledValues?.(t);gg.setValueAtTime(0,t);}notice('','Stopped.');}noteT=0;pressCap(runB);sync();}
function toggleStep(i){audio();const s=ST[i];s.on=!s.on;pressCap(s.b);notice(`STEP ${i+1} ${s.on?'ON':'OFF'} · ${noteOf(s.k.val)}`,`Step ${i+1} ${s.on?'on':'off'}.`);sync();}
function showKnob(){const k=KN[kf];notice(`${k.name} · ${k.fmt(k.val)}`,`${k.name.toLowerCase()}, ${k.fmt(k.val).toLowerCase()}.`);}
function focusBy(d){audio();kf=(kf+d+KN.length)%KN.length;showKnob();}
function setKnob(i,v){const k=KN[i],w=clamp(v,k.min,k.max);if(w===k.val)return false;k.val=w;if(k.name==='TEMPO')seg.textContent=String(w);tone();return true;}
function turn(d){audio();const k=KN[kf];if(!setKnob(kf,k.val+d*k.step)){notice(`${k.name} · ${k.fmt(k.val)} · ${d>0?'TOP':'BOTTOM'}`);return;}showKnob();}
function preset(){audio();pi=(pi+1)%PRESETS.length;load(pi);notice(`PATCH ${pi+1}/${PRESETS.length} · ${PRESETS[pi][0]}`,`Patch ${pi+1}, ${PRESETS[pi][0].toLowerCase()}: ${chainS.toLowerCase().replace(/ → /g,' to ')}.`);}
function unplugAll(){audio();if(hold)drop(null,true);if(!cables.length){notice('NO CABLES TO PULL');return;}for(const c of[...cables])pull(c);changed();notice('ALL CABLES OUT','Every cable is out. Drag from one jack to another to patch.');}
// Patching: lift the cable at a jack (or start one there), carry its free end, plug it into a free jack of the other kind.
function grab(j){let c=j.cab;if(c){const end=c.a===j?'a':'b';c[end]=null;j.cab=null;hold={c,end,from:j};}else{c={a:null,b:null,k:j.kind==='out'?j.k:'k0',slot:take(),t0:-1,ps:[]};const end=j.kind==='out'?'b':'a';c[end==='a'?'b':'a']=j;j.cab=c;cables.push(c);hold={c,end,from:null};}
hold.u=j.u;hold.v=j.v;set(c.slot.g,'class','cab '+c.k);changed();}
function drop(j,quiet){const h=hold;if(!h)return;hold=null;const c=h.c,end=h.end,want=end==='a'?'out':'in',fixed=c[end==='a'?'b':'a'];
if(j===fixed){pull(c);changed();return;}
if(j&&!j.cab&&j.kind===want){c[end]=j;j.cab=c;c.t0=last;if(c.k==='k0')c.k=c.a.k;set(c.slot.g,'class','cab '+c.k);changed();if(!quiet)notice(`PATCHED · ${nm(c.a)} → ${nm(c.b)}`,`Patched the ${c.a.name} to the ${c.b.name}.`);return;}
pull(c);changed();if(quiet)return;
if(j&&j.kind!==want)notice(`${j.kind==='in'?'INPUT TO INPUT':'OUTPUT TO OUTPUT'} · NOT PATCHED`,`Not patched: an ${want==='in'?'output':'input'} goes to an ${want}.`);
else if(j&&j.cab)notice(`${nm(j)} IS IN USE · CABLE OUT`,`The ${j.name} is in use; the cable is out.`);
else notice(`UNPLUGGED · ${nm(fixed)}`,`Cable unplugged from the ${fixed.name}.`);}
function restore(j){const h=hold;if(!h)return;if(h.from===j){hold=null;h.c[h.end]=j;j.cab=h.c;changed();}else drop(null,true);
const c=j.cab,o=c&&(c.a===j?c.b:c.a);notice(`${nm(j)}${o?` ${j.kind==='in'?'←':'→'} ${nm(o)}`:' · FREE'}`);}
function jackKey(j){audio();if(!hold){grab(j);hold.kb=true;const want=hold.end==='a'?'output':'input';notice(`CABLE FROM ${nm(hold.c[hold.end==='a'?'b':'a'])} · PICK AN ${want.toUpperCase()}`,`Holding a cable from the ${j.name}. Move to an ${want} and press Enter.`);return;}
if(hold.from===j){restore(j);return;}drop(j);}
const act={' ':runStop,ArrowLeft:()=>focusBy(-1),ArrowRight:()=>focusBy(1),ArrowUp:()=>turn(1),ArrowDown:()=>turn(-1),p:preset,Backspace:unplugAll,Escape:()=>{if(hold)hold.from?restore(hold.from):drop(null);}};
for(let i=1;i<=8;i++)act[String(i)]=()=>toggleStep(i-1);
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.length===1?e.key.toLowerCase():e.key;if(k===' '&&e.target.closest&&e.target.closest('[role=button]'))return;
const fn=act[k];if(fn){e.preventDefault();if(!e.repeat||k.startsWith('Arrow'))fn();}});
// The pointer: a drag from a jack carries a cable, a drag on a knob turns it.
function local(e){const m=svg.getScreenCTM?.();if(!m)return null;const d=m.a*m.d-m.b*m.c;if(!d)return null;const x=e.clientX-m.e,y=e.clientY-m.f;return[(m.d*x-m.c*y)/d,(-m.b*x+m.a*y)/d];}
function toUV(x,y,n){const o=P(...WP(0,0)),dx=x-o[0],dy=y-o[1];return[(dx*pv[1]-dy*pv[0])/DET-NU*n,(pu[0]*dy-pu[1]*dx)/DET-NV*n];}
function jackAt(x,y){let best=null,bd=6.5;for(const j of JACKS){let d=hypot(x-j.q[0],y-j.q[1]);if(j.cab&&!(hold&&hold.c===j.cab)){const t=P(...WP(j.u,j.v,15)),vx=t[0]-j.q[0],vy=t[1]-j.q[1],s=clamp(((x-j.q[0])*vx+(y-j.q[1])*vy)/(vx*vx+vy*vy),0,1);d=min(d,hypot(x-j.q[0]-vx*s,y-j.q[1]-vy*s)+1);}if(d<bd){bd=d;best=j;}}return best;}
function knobAt(x,y){return KN.findIndex(k=>hypot(x-k.q[0],y-k.q[1])<k.r*1.18+1.5);}
svg.addEventListener('pointerdown',e=>{if(e.button>0||drag)return;const q=local(e);if(!q)return;const j=jackAt(...q);
if(j){e.preventDefault();audio();if(hold)drop(null,true);drag={j,x:q[0],y:q[1],moved:false};grab(j);hover(q);svg.setPointerCapture?.(e.pointerId);svg.classList.add('dragging');return;}
const k=knobAt(...q);if(k>=0){e.preventDefault();audio();kf=k;drag={k,y:q[1],v0:KN[k].val};svg.setPointerCapture?.(e.pointerId);showKnob();}});
function hover(q){if(!hold)return;const[u,v]=toUV(q[0],q[1],NH);hold.u=clamp(u,-40,350);hold.v=clamp(v,-30,170);}
svg.addEventListener('pointermove',e=>{if(!drag)return;const q=local(e);if(!q)return;if(drag.j){if(hypot(q[0]-drag.x,q[1]-drag.y)>3)drag.moved=true;hover(q);}
else{const k=KN[drag.k];if(setKnob(drag.k,drag.v0+round((drag.y-q[1])/4)*k.step))showKnob();}});
const end=e=>{if(!drag)return;const d=drag;drag=null;svg.classList.remove('dragging');if(!d.j)return;if(!d.moved){restore(d.j);return;}const q=e&&local(e);drop(q?jackAt(...q):null);};
svg.addEventListener('pointerup',end);addEventListener('pointerup',end);addEventListener('pointercancel',()=>end(null));addEventListener('blur',()=>end(null));

// Drawing what moves: cables (sagging, swinging a little after they're plugged, a pulse running down them), LEDs, knobs.
function ends(c,e){const j=c[e];return j?{u:j.u,v:j.v,n:1.6,t:WP(j.u,j.v,15)}:{u:hold.u,v:hold.v,n:NH,t:WP(hold.u,hold.v,NH+13.4)};}
function plugAt(p,x){set(p.body,'d',stad(x.u,x.v,x.n,x.n+9,2.9));let[a,b]=L(x.u,x.v,x.n+9);set(p.cap,'cx',f2(a));set(p.cap,'cy',f2(b));set(p.rel,'d',stad(x.u,x.v,x.n+9,x.n+13.4,1.9));[a,b]=L(x.u,x.v,x.n+13.4);set(p.rcap,'cx',f2(a));set(p.rcap,'cy',f2(b));}
function cables3(now,red){let changedOrder=false;
for(const c of cables){const s=c.slot,ea=ends(c,'a'),eb=ends(c,'b'),A3=ea.t,B3=eb.t;let k=1,sw=0;
if(!red&&c.t0>0){const t=(now-c.t0)/1000;if(t<2.6){const e=exp(-t*2.1);k=1+.24*e*cos(t*9.4);sw=4.5*e*sin(t*7.1);}}
const D=hypot(B3[0]-A3[0],B3[1]-A3[1],B3[2]-A3[2]),sg=min(42,9+D*.2)*k/.75,kk=6+D*.06,f=sg*.3;
const key=[...A3,...B3,sg,sw].map(f2).join();
if(key!==s.key){s.key=key;const c1=[A3[0]+sw,A3[1]+N[1]*kk+f,A3[2]+N[2]*kk-sg],c2=[B3[0]+sw*.7,B3[1]+N[1]*kk+f,B3[2]+N[2]*kk-sg],q=[A3,c1,c2,B3].map(p=>P(...p).map(f2).join(','));
const d=`M${q[0]}C${q[1]} ${q[2]} ${q[3]}`;for(const p of[s.u,s.c,s.s,s.p])set(p,'d',d);plugAt(s.plugs[0],ea);plugAt(s.plugs[1],eb);s.depth=(hold&&hold.c===c)?1e9:(A3[1]+3*c1[1]+3*c2[1]+B3[1])/8+(A3[0]+B3[0])*.004;changedOrder=true;}
const ps=c.ps;while(ps.length&&ps[0]+HOP<now)ps.shift();const p0=!red&&c.a&&c.b?ps.find(t=>t<=now):undefined;
if(p0!==undefined){const p=(now-p0)/HOP;s.p.style.opacity='.95';s.p.style.strokeDashoffset=f2(11-p*111);s.pv=true;}else if(s.pv){s.pv=false;s.p.style.opacity='0';}}
if(changedOrder){const ord=cables.slice().sort((x,y)=>x.slot.depth-y.slot.depth),key=ord.map(c=>POOL.indexOf(c.slot)).join();if(key!==order){order=key;for(const c of ord)cabG.appendChild(c.slot.g);}}}
// A module's light: the last time the wave reached it, decaying (the envelope's follows its own attack and decay).
function flashOf(m,now){const f=m.fl;while(f.length>1&&f[1]<=now)f.shift();return f.length&&f[0]<=now?now-f[0]:Infinity;}
function envAt(t){const a=att()*1000,d=dec()*1000;return t<0||t===Infinity?0:t<a?t/a:exp(-(t-a)/(d/1.6));}
function tick(now){const dt=last?min(.05,(now-last)/1000):0,red=reduced.matches;last=now;sched(now);
for(const k of KN){const t=(k.val-k.min)/(k.max-k.min);k.s=red||k.s<0?t:k.s+(t-k.s)*min(1,dt*18);if(abs(k.s-t)<.002)k.s=t;if(k.s!==k.d){k.d=k.s;set(k.ind,'transform',`rotate(${f2(-135+270*k.s)})`);}}
const pnow=performance.now();for(const b of[runB,...ST.map(s=>s.b)])if(b&&b.cap._t&&pnow>b.cap._t){b.cap._t=0;b.g.classList.remove('down');}
ST.forEach((s,i)=>lit(s.led,run&&i===step?'g':''));lit(runL,run&&(red||step%2===0)?'g':'');
for(const id of['vco','vcf']){const m=M[id],v=red?(run&&m.reach?1:0):exp(-flashOf(m,now)/150);fade(ML[id].n,v);fade(ML[id].h,v*.9);}
const ev=red?(run&&M.env.reach?1:0):envAt(flashOf(M.env,now));fade(ML.env.n,ev);fade(ML.env.h,ev*.9);
const aud=chainS.startsWith('VCO'),cvc=J['out.cv'].cab,src=cvc&&cvc.a,gain=.35+.65*K.LEVEL.val/20;
let target=0;if(aud){if(!src)target=.62*gain;else if(red)target=run&&M.out.reach?.62*gain:0;else{const t=flashOf(M.out,now);target=(src.m.id==='env'?envAt(t):src.id==='seq.gate'?(t<15/K.TEMPO.val*1000?1:0):exp(-t/200))*.95*gain;}}
lvl=red?target:max(target,lvl-dt*2.2);METER.forEach((n,i)=>lit(n,lvl>[.1,.28,.46,.64,.82][i]?['g','g','g','a','r'][i]:''));
const k=KN[kf];if(k!==sel){sel=k;const[a,b]=L(k.u,k.v,1.4),rr=k.r*1.18+1.7;for(const n of[selR,selH]){set(n,'cx',f2(a));set(n,'cy',f2(b));}set(selR,'r',f2(rr));set(selH,'r',f2(rr+2));}
cables3(now,red);
if(sayT&&pnow>sayT){say(sayMsg);sayT=0;}
const r=`${K.TEMPO.val} BPM · STEP ${step+1}/8 · PATCH ${pname}`,st=pnow<noteT&&note?note:`${run?'RUNNING':'STOPPED'} · ${chainS}`;if(r+st!==outKey){outKey=r+st;readout.textContent=r;stateLabel.textContent=st;}
requestAnimationFrame(tick);}
load(0);requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
