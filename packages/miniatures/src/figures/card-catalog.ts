// @ts-nocheck
/* PELL & ASHBY No. 15 · Card catalog. Drawn for this kit on the shared engine, in the manner of the lab files: its
 * stylesheet, defs and script. The script runs on the env, which stands in for the page; its types are at the
 * boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--warn:#e88a00;--wood:#c29466;--wood-top:#d9b283;--wood-side:#a37548;--in:#dcc39a;--in-top:#e8d4b0;--in-side:#c4a77a;--cav:#3b2a1c;--brass:#d4ae5f;--brass-top:#ecd18f;--brass-side:#ad8842;--paper:#fbf8ef;--paper-2:#f2ecdc;--guide:#e4cf9c;--lcard:#f6efdb;--red:#c8553d;--faux:#a39d90;--card-ink:#2a2622}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--warn:#ffad2b;--wood:#a37c55;--wood-top:#cba67a;--wood-side:#725130;--in:#b9a481;--in-top:#d9c6a4;--in-side:#8a7554;--cav:#241a11;--brass:#b2924f;--brass-top:#ddc385;--brass-side:#795f2c;--paper:#d6d3cb;--paper-2:#ccc7ba;--guide:#c0ae83;--lcard:#cfc9b8;--red:#a8452f;--faux:#8a857a;--card-ink:#24211d;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.wood{fill:var(--wood)}.top.wood{fill:var(--wood-top)}.side.wood{fill:var(--wood-side)}.in{fill:var(--in)}.top.in{fill:var(--in-top)}.side.in{fill:var(--in-side)}.cav{fill:var(--cav)}.brass{fill:var(--brass)}.top.brass{fill:var(--brass-top)}.side.brass{fill:var(--brass-side)}
.grain{fill:none;stroke:var(--wood-side);stroke-width:.5;vector-effect:non-scaling-stroke;opacity:.5;stroke-linecap:round}.lcard{fill:var(--lcard)}.dlabel{fill:var(--card-ink);font:700 3.3px ui-monospace,monospace;letter-spacing:.2px;text-anchor:middle;stroke:none}.plaque{fill:#4a3a1e;font:600 2.3px ui-monospace,monospace;letter-spacing:.7px;text-anchor:middle;stroke:none}.rivet{fill:var(--brass-side);stroke:none}.shine{fill:none;stroke:#fff;stroke-opacity:.6;stroke-width:.8;stroke-linecap:round;vector-effect:non-scaling-stroke}
.card{fill:var(--paper);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke;stroke-linejoin:round}.card.aged{fill:var(--paper-2)}.card.guide{fill:var(--guide)}.tab{fill:var(--card-ink);font:700 2.5px ui-monospace,monospace;text-anchor:middle;stroke:none}.card-h{fill:var(--card-ink);font:700 2.9px ui-monospace,monospace;letter-spacing:.12px;stroke:none}.card-m{fill:var(--faux);font:2px ui-monospace,monospace;stroke:none}.card-rule{stroke:var(--red);stroke-width:.4}.faux{stroke:var(--faux);stroke-width:.5;stroke-linecap:round}.hole{fill:var(--cav);opacity:.5}
.inside{opacity:.5}.cast{fill:url(#cast);stroke:none;pointer-events:none}.leaf{cursor:pointer}.hit .card{stroke:var(--accent);stroke-width:1.2}.hit .card-h{fill:var(--accent)}.hit-glow{fill:var(--accent);opacity:0;filter:url(#bloom);pointer-events:none}
.ghost{pointer-events:none}.ghost .card{fill:var(--paper);fill-opacity:.62;stroke:var(--warn);stroke-width:1;stroke-dasharray:1.6 1.2}.ghost .card-h{fill:var(--warn)}.miss .lcard{fill:color-mix(in srgb,var(--warn) 30%,var(--lcard))}
.control{cursor:pointer;outline:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}.drawer:hover .drawer-face{fill:color-mix(in srgb,var(--wood) 86%,#fff)}.shut .edge{display:none}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<linearGradient id="cast" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".26"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* PELL & ASHBY No. 15 card catalog. World: x lower-right; y lower-left (the drawers face +y); z up. 1 unit ≈ 5 mm.
Part                              x        y        z        w      d      h
legs (4, tapered 7 → 4.4)     −0.5/111.5 −0.5/69.5  2.6       7      7   19.4   brass shoes below, 2.6 high
apron (bead line)              −1.5     −1.5      22      121     79      8
case                              0        0      30      118     76    130   panelled side, maker's plaque on the plinth rail
cove + cap                       −3       −3    158.6     124     82      5   grain on the top
drawer openings (3 × 5)     6 + 36.5c     76   37 + 24(4 − r)  33     0     21   row 0 at the top
drawer front                  xo+0.6    74–76    zb+0.6    31.8      2   19.8   label frame, cup pull, rod knob; pulls out 52 along y
drawer box (walls 1, floor 1) xo+1.6    8–74     zb+1.2    29.8     66    8.8
cards (24 leaves, pitch 2)    xo+3.5   71.6 − 2k  zb+2.2     26      0     15   guides carry 8 × 3 tabs at three cuts
follower block                xo+3.6    21.4     zb+2.2   24.8      3      9
a found card rises 9 and tips back 9°; taken out, it rises 28 more on the top layer, tipped back to read
Inside the case a drawer is clipped to its opening and dimmed; outside it paints over the rows below it. */
const svg=document.getElementById('machine'),draw=document.getElementById('drawing');let root=draw;
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers.
const defsEl=svg.querySelector('defs'),f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),RAD=Math.PI/180,into=g=>root=g;
const shift=(x,y,z)=>{const p=P(x,y,z);return`translate(${f2(p[0])} ${f2(p[1])})`;},smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
const ease=t=>t<=0?0:t>=1?1:t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2,pad2=n=>String(n).padStart(2,'0'),quad=(n,pts)=>set(n,'d',pts?poly(pts,true):'');
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function leg(x,y){const w=7,b=1.3;box(x+b-.3,y+b-.3,0,w-2*b+.6,w-2*b+.6,2.6,.5,'brass');
el('path',{d:poly([[x,y+w,22],[x+w,y+w,22],[x+w-b,y+w-b,2.6],[x+b,y+w-b,2.6]],true),class:'face wood'});
el('path',{d:poly([[x+w,y+w,22],[x+w,y,22],[x+w-b,y+b,2.6],[x+w-b,y+w-b,2.6]],true),class:'face side wood'});}
// The catalogue: fifteen ranges, a guide card per letter and the subject cards behind it (X has none).
const RANGES=['A','B','C','DE','FG','HI','JKL','M','NO','PQ','R','S','TU','VW','XYZ'];
const SUBJECTS={A:'ABACUS ALGEBRA ARCHIVES ASTRONOMY ATLASES',B:'BEES BIRDS BOTANY BRIDGES',C:'CANALS CHEMISTRY CLOCKS COMETS CORAL',D:'DANCE DESERTS DYES',E:'ECLIPSES ENGINES ETYMOLOGY',F:'FERNS FLIGHT FOSSILS',G:'GARDENS GEOLOGY GLASS',H:'HARBORS HERBS HISTORY',I:'ICE INDEXES INKS',J:'JAZZ JOINERY',K:'KITES KNOTS',L:'LANTERNS LIBRARIES LOOMS',M:'MAPS MATHEMATICS METEORS MOSSES MUSIC',N:'NAVIGATION NUMBERS',O:'OCEANS OPTICS ORCHIDS',P:'PAPER PIGMENTS POETRY PRINTING',Q:'QUARRIES QUILTS',R:'RADIO RAILWAYS RIVERS ROPE',S:'SAILS SALT SEEDS SILK STARS',T:'TEA TIDES TYPOGRAPHY',U:'UMBRELLAS URNS',V:'VALVES VIOLINS VOLCANOES',W:'WEATHER WEAVING WHALES WINDMILLS',X:'',Y:'YARN YEAST',Z:'ZINC ZOOLOGY'};
const EXT=52,N=24,PITCH=2,CW=26,CH=15,TAB=3,LIFT=9,OUTZ=28,OUTY=4,AP=76,BACK=-3.5,TYPEAHEAD=1000,IDLE=7000;
const DEMO=['TIDES','OPTICS','QUASAR','BIRDS','XENON','WEAVING','COMETS','GLASS'];
function leavesOf(letters){
// A single-letter drawer also has a guide for each new pair of letters (MA, ME, MO…) after its first card.
const content=[];for(const L of letters){content.push({kind:'guide',key:L,L});let pre='';
for(const h of SUBJECTS[L].split(' ').filter(Boolean)){const p=h.slice(0,2);if(letters.length===1&&pre&&p!==pre)content.push({kind:'guide',key:p,L});pre=p;content.push({kind:'card',key:h,L});}}
// Blank cards fill the drawer, never behind the guide of an empty letter.
const slots=content.map((c,i)=>c.kind==='card'||(content[i+1]&&content[i+1].kind==='card')),n=slots.filter(Boolean).length,blanks=N-content.length,out=[];let s=0;
content.forEach((c,i)=>{out.push(c);if(!slots[i])return;const b=Math.floor((s+1)*blanks/n)-Math.floor(s*blanks/n);s++;for(let j=0;j<b;j++)out.push({kind:'blank',key:c.key,L:c.L});});
return out.map((l,k)=>({...l,k}));
}
// Where a query lands in a drawer: the first card that starts with it, or the place it would be filed and the card nearest it.
function seek(d,q){
const lv=d.leaves,k=lv.findIndex(l=>l.kind==='card'&&l.key>=q);
if(k>=0&&lv[k].key.startsWith(q))return{q,k,hit:true,card:lv[k]};
let m=lv.findIndex(l=>l.kind!=='blank'&&l.key>q);if(m<0)m=lv.length;
const near=lv.slice(m).find(l=>l.kind==='card')||lv.slice(0,m).reverse().find(l=>l.kind==='card')||null;
return{q,k:m,hit:false,near};
}
// Assembly, back to front: shadow, legs, apron, case, face frame and openings, cap; then the drawers, bottom row first.
const sp=P(59,38,0);el('ellipse',{cx:f2(sp[0]),cy:f2(sp[1]+4),rx:104,ry:44,class:'shadow stage-floor'});el('ellipse',{cx:f2(sp[0]),cy:f2(sp[1]+4),rx:104,ry:44,class:'stage-contact'});
leg(-.5,-.5);leg(111.5,-.5);leg(-.5,69.5);leg(111.5,69.5);
box(-1.5,-1.5,22,121,79,8,1.5,'wood');
line(group(FRONT(-1.5,77.5,30)),2,2.4,119,2.4);line(group(SIDE(119.5,77.5,30)),2,2.4,77,2.4);
box(0,0,30,118,76,130,1.5,'wood');
const SD=group(SIDE(118,76,160));rect(SD,6,7,64,116,1.2,'face side wood');rect(SD,9,10,58,110,.8,'detail');
for(let i=0;i<6;i++){const u=14.5+i*9.4,w=i%2?1.4:-1.2;el('path',{d:`M${u},13 C${u+w},44 ${u-w},82 ${u+w*.4},117`,class:'grain'},SD);}
const FF=group(FRONT(0,76,160));
rect(FF,43,123.2,32,4.8,.8,'face brass');text(FF,59,126.45,'PELL & ASHBY','plaque');for(const u of[45,73])circle(FF,u,125.6,.45,'rivet');
box(-1.6,-1.6,158.6,121.2,79.2,1.4,.6,'wood');box(-3,-3,160,124,82,3.6,1.5,'wood');
const TT=group(TOP(-3,-3,163.6));rect(TT,4,4,116,74,2.5,'detail');for(const[v,w]of[[9,1.2],[21,-1],[34,.8],[48,-1.4],[61,1],[73,-.6]])el('path',{d:`M6,${v}C40,${v+w} 82,${v-w} 118,${v+w*.5}`,class:'grain'},TT);
// Drawers: each an inside part (clipped to its opening, dimmed) and an outside part (box, cards, front).
const drawers=[],glow=el('rect',{x:-2.4,y:-2.4,width:CW+4.8,height:CH+4.8,rx:2.4,class:'hit-glow'},draw);
const ORDER=[];for(let r=4;r>=0;r--)for(let c=0;c<3;c++)ORDER.push(r*3+c);
const spoken=s=>s.replace('–',' to ');
for(const i of ORDER){
const r=Math.floor(i/3),c=i%3,xo=6+c*36.5,zb=133-r*24,letters=RANGES[i],label=letters.length>1?`${letters[0]}–${letters[letters.length-1]}`:letters;
const d={i,xo,zb,letters,label,x:0,v:0,mode:null,live:false,leaves:null,gap:-.5,liftK:-1,lift:0,lv:0,liftTo:0,out:0,outTo:0,rod:0,rodD:-1,pend:null,res:null,shake:-1e9,sx:0,wait:0,sig:'',ghost:false,ghostK:0,ga:0,tock:true};
rect(FF,xo,6+r*24,33,21,.6,'face cav');
const cp=el('clipPath',{id:`ap${i}`},defsEl);el('path',{d:poly([[xo,AP,zb],[xo+33,AP,zb],[xo+33,AP,zb+21],[xo,AP,zb+21]],true)},cp);
const parts=g=>({back:el('path',{class:'face in'},g),floor:el('path',{class:'face top in'},g),lw:el('path',{class:'face side in'},g),lwt:el('path',{class:'face top wood'},g),pack:el('g',{},g),rw:el('path',{class:'face side wood'},g),rwt:el('path',{class:'face top wood'},g)});
d.inner=el('g',{'clip-path':`url(#ap${i})`,class:'inside',display:'none'},draw);d.I=parts(d.inner);
d.outer=el('g',{},draw);d.cast=el('path',{class:'cast'},group(FRONT(xo+1.6,AP+.05,zb),d.outer));d.box=el('g',{display:'none'},d.outer);d.O=parts(d.box);d.O.back.remove();
d.panel=el('g',{class:'control drawer shut',role:'button',tabindex:'0','aria-label':`Drawer ${i+1}, ${spoken(label)}: open`,'aria-expanded':'false'},d.outer);
into(d.panel);
rect(group(SIDE(xo+32.4,AP,zb+20.4)),0,0,2,19.8,.5,'face side wood edge');rect(group(TOP(xo+.6,AP-2,zb+20.4)),0,0,31.8,2,.5,'face top wood edge');
const F=group(FRONT(xo+.6,AP,zb+20.4)),cx=15.9;
rect(F,0,0,31.8,19.8,1,'face wood drawer-face');rect(F,1.5,1.5,28.8,16.8,.8,'detail');
el('path',{d:`M${cx-7.4},2.4H${cx+7.4}Q${cx+8},2.4 ${cx+8},3V8.6Q${cx+8},9.2 ${cx+7.4},9.2H${cx-7.4}Q${cx-8},9.2 ${cx-8},8.6V3Q${cx-8},2.4 ${cx-7.4},2.4Z`,class:'face brass'},F);
rect(F,cx-6,3.5,12,4.7,.3,'face lcard');text(F,cx,7.05,label,'dlabel');for(const u of[cx-7.1,cx+7.1])circle(F,u,5.8,.42,'rivet');
el('path',{d:`M${cx-5.6},9.2C${cx-5.6},14.6 ${cx+5.6},14.6 ${cx+5.6},9.2Z`,class:'face brass'},F);el('path',{d:`M${cx-3.8},10.4C${cx-3.2},12.7 ${cx+3.2},12.7 ${cx+3.8},10.4`,class:'shine'},F);
d.knob=group('',d.panel);rect(F,-.9,-.9,33.6,21.6,1.6,'focus-ring');
into(draw);
bind(d.panel,()=>{user();if(cur===d.i)closeAll();else{lastKey=-1e9;find(d.letters[0]);}});
drawers[i]=d;
}
const ghost=el('g',{class:'ghost',display:'none'},draw);rect(ghost,0,0,CW,CH,.5,'card');const ghostT=text(ghost,1.8,4.4,'','card-h');
const float=el('g',{},draw);
frame([[-3,-3,0,124,82,163.6],[6,54,37,33,80,150]],10);
// One drawer's cards, built the first time it opens.
function build(d){
if(d.leaves)return;d.leaves=leavesOf(d.letters);d.th=new Float64Array(N);d.tv=new Float64Array(N);d.fwd=new Uint8Array(N);
d.jit=d.leaves.map(l=>((l.k*37+d.i*11)%9-4)*.3);
into(d.I.pack);d.follower=el('g',{});box(d.xo+3.6,21.4,d.zb+2.2,24.8,3,9,.6,'in');box(d.xo+14,22,d.zb+11.2,4,1.4,1.6,.3,'brass');
let gi=0;for(const l of d.leaves){const g=l.g=el('g',{class:'leaf '+l.kind},d.I.pack);
if(l.kind==='guide'){const tu=[1.4,9,16.6][(gi++)%3];
el('path',{d:`M0,0H${tu}V-2.3Q${tu},-${TAB} ${tu+.7},-${TAB}H${tu+7.3}Q${tu+8},-${TAB} ${tu+8},-2.3V0H${CW}V${CH}H0Z`,class:'card guide'},g);text(g,tu+4,-.72,l.key,'tab');}
else{rect(g,0,0,CW,CH,.5,'card'+(l.kind==='blank'&&(l.k*7+d.i)%3===0?' aged':''));
if(l.kind==='card'){text(g,1.8,4.4,l.key,'card-h');line(g,1.4,5.8,CW-1.4,5.8,'card-rule');text(g,1.8,8.2,`${l.L}${pad2(10+(l.k*37+d.i*13)%89)}.${(l.k*7)%10} · ${1890+(l.k*23+d.i*7)%110}`,'card-m');
for(const[v,w]of[[10.2,17],[11.9,12+(l.k%3)*3]])line(g,1.8,v,1.8+w,v,'faux');}
circle(g,CW/2,CH-1.6,.7,'hole');}
g.addEventListener('click',()=>{user();pick(d,l);});}
into(draw);
}
// State: the open drawer, the query, each drawer's travel, the finger in its cards, the raised card and the rod.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
let cur=-1,query='',lastKey=-1e9,flashMsg='',flashUntil=0,lastIn=performance.now(),last=performance.now(),jolt=-1e9,joltD='',lastR='',lastS='',ac=null,nb=null,tickAt=0;
const demo={on:false,t:0,w:0,c:0};
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();nb=ac.createBuffer(1,ac.sampleRate/2,ac.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function nz(at,f,v,d,q=1,type='bandpass'){if(!ac||demo.on)return;try{const t=ac.currentTime+at,s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;b.type=type;b.frequency.value=f;b.Q.value=q;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(ac.destination);s.start(t,Math.random()*.3,d+.03);}catch(_){}}
function tn(at,f,v,d,type='sine'){if(!ac||demo.on)return;try{const t=ac.currentTime+at,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}catch(_){}}
const sfx={slide:()=>{nz(0,520,.05,.42,.6);nz(0,1500,.012,.3,2);},tock:()=>{tn(0,230,.03,.07,'triangle');nz(0,1100,.03,.04,2);},thunk:k=>{tn(0,88,.11*k,.24);tn(0,150,.035*k,.1,'triangle');nz(0,260,.09*k,.14,.8,'lowpass');},
flick:()=>nz(0,3200+Math.random()*900,.014,.014,3),found:()=>{tn(0,1046,.016,.28);tn(.08,1568,.011,.34);},miss:()=>{tn(0,196,.035,.12,'triangle');tn(.14,165,.035,.15,'triangle');},rod:()=>{nz(0,5200,.03,.02,4);tn(0,2300,.008,.06);},paper:()=>nz(0,6200,.025,.1,.7,'highpass')};
function say(m){announcement.textContent=m;}
function flash(m){flashMsg=m;flashUntil=performance.now()+1600;ui(performance.now());}
function user(){if(demo.on)lastKey=-1e9;lastIn=performance.now();demo.on=false;audio();}
const drawerOf=L=>RANGES.findIndex(r=>r.includes(L));
// Searching: a letter after a pause starts a new query; one typed within a second refines it, as type-ahead does.
function letter(L){const now=performance.now(),q=cur>=0&&query&&now-lastKey<TYPEAHEAD&&query.length<12?query+L:L;lastKey=now;find(q);}
function find(q){
query=q;const di=drawerOf(q[0]),d=drawers[di];
if(cur!==di){const was=cur>=0?drawers[cur]:null;if(was)shut(was);cur=di;build(d);d.live=true;d.mode='open';d.wait=performance.now()+(was&&was.x>2&&!reduced.matches?160:0);d.tock=false;
set(d.panel,'aria-expanded','true');set(d.panel,'aria-label',`Drawer ${d.i+1}, ${spoken(d.label)}: close`);say(`Drawer ${d.i+1}, ${spoken(d.label)}, opening.`);}
d.pend=seek(d,q);clean(d);
}
function clean(d){d.res=null;d.ghost=false;d.outTo=0;d.panel.classList.remove('miss');}
function shut(d){if(d.x>2)sfx.slide();d.mode='close';d.pend=null;clean(d);d.liftTo=0;set(d.panel,'aria-expanded','false');set(d.panel,'aria-label',`Drawer ${d.i+1}, ${spoken(d.label)}: open`);}
function closeAll(){if(cur<0){flash('ALL CLOSED · TYPE A LETTER');return;}const d=drawers[cur];shut(d);cur=-1;query='';say(`Drawer ${d.i+1} closed.`);}
function erase(){if(!query){flash('NOTHING TO ERASE');return;}const q=query.slice(0,-1);if(!q)closeAll();else{lastKey=performance.now();find(q);}}
function browse(dir){
if(cur<0){flash('NO DRAWER OPEN · TYPE A LETTER');return;}
const d=drawers[cur],t=d.pend||d.res,k=t?t.k:-1,cards=d.leaves.filter(l=>l.kind==='card');
const next=dir>0?cards.find(l=>l.k>k||(l.k===k&&t&&!t.hit)):cards.slice().reverse().find(l=>l.k<k);
if(!next){flash(dir>0?'LAST CARD IN THE DRAWER':'FIRST CARD IN THE DRAWER');d.shake=performance.now();return;}
lastKey=-1e9;query=next.key;d.pend={q:next.key,k:next.k,hit:true,card:next};clean(d);
}
function takeOut(){
const d=cur>=0?drawers[cur]:null;
if(!d){flash('NOTHING FOUND YET · TYPE A LETTER');return;}
if(d.pend&&d.pend.hit){d.outTo=1;return;}
if(!(d.res&&d.res.hit)){flash('NO CARD RAISED · TRY ANOTHER LETTER');return;}
d.outTo=d.outTo?0:1;say(d.outTo?`${d.res.card.key.toLowerCase()} taken out.`:`${d.res.card.key.toLowerCase()} put back.`);
}
function pick(d,l){
if(d.i!==cur||d.mode!=='open')return;
if(d.res&&d.res.hit&&l.k===d.res.k){takeOut();return;}
lastKey=-1e9;if(l.kind==='card'){query=l.key;d.pend={q:l.key,k:l.k,hit:true,card:l};clean(d);}else find(l.key);
}
function arrive(d,t){
d.pend=null;d.res=t;
if(t.hit){d.liftK=t.k;d.liftTo=1;sfx.found();say(`Found ${t.card.key.toLowerCase()}.`);}
else{d.liftTo=0;d.ghost=true;d.ghostK=t.k;ghostT.textContent=`“${t.q}”`;d.shake=performance.now();d.panel.classList.add('miss');sfx.miss();say(`No match for ${t.q.toLowerCase()}.${t.near?` Nearest: ${t.near.key.toLowerCase()}.`:''}`);}
}
// Motion: the drawer slides on a spring and is pushed home against its stop; the finger walks the cards.
function step(d,dt,rm,now){
if(d.mode==='open'&&now>=d.wait){
if(rm){d.x=EXT;d.v=0;}else{if(d.x<.01&&d.v===0)sfx.slide();for(let n=Math.ceil(dt/.004),j=0;j<n;j++){const h=dt/n,a=121*(EXT-d.x)-18*d.v;d.v+=a*h;d.x+=d.v*h;}}
if(!d.tock&&Math.abs(EXT-d.x)<.6){d.tock=true;sfx.tock();}
}else if(d.mode==='close'&&d.out<.05&&d.lift<.5){
if(rm){if(d.x>0)impact(d,1);d.x=0;d.v=0;}
else for(let n=Math.ceil(dt/.004),j=0;j<n;j++){const h=dt/n;d.v-=640*h;d.x+=d.v*h;if(d.x<=0){d.x=0;if(d.v<-14){impact(d,clamp(-d.v/250,.25,1));d.v=-d.v*.16;}else{d.v=0;break;}}}
if(d.x<=0&&d.v===0){d.mode=null;d.live=false;d.gap=-.5;d.liftK=-1;d.lift=0;d.out=0;d.rod=0;d.ghost=false;d.dirty=true;}
}
// The finger: toward the target once the drawer is out, back to the front while it closes.
const t=d.pend;let to=-.5;
if(d.mode==='close')to=-.5;else if(t)to=t.k-.5;else if(d.res)to=d.res.k-.5;
let hold=false;
if(t&&d.liftK>=0&&d.liftK!==t.k){d.liftTo=0;if(d.lift>.25&&!rm)hold=true;else{d.liftK=-1;d.lift=0;}}
if(d.mode==='open'&&t&&d.x<EXT*.8)hold=true;
if(!hold){const g=to-d.gap;
if(rm||Math.abs(g)<.02)d.gap=to;else{const v=Math.sign(g)*Math.max(2.4,Math.min(30,Math.abs(g)*(d.mode==='close'?14:7)));d.gap+=Math.sign(g)*Math.min(Math.abs(g),Math.abs(v)*dt);}
if(t&&d.mode==='open'&&d.gap===to)arrive(d,t);}
// Each card leans toward its pose on a quick spring: forward in front of the finger, back against the follower behind it.
for(const l of d.leaves){const k=l.k,dd=k-d.gap,fan=clamp(1-(-dd-.5)/12),s=smooth(-.5,.5,dd);let tt=(12+22*fan)*(1-s)+BACK*s+d.jit[k];
if(k===d.liftK)tt=tt+(-9-tt)*clamp(d.lift);
const fw=s<.5?1:0;if(fw!==d.fwd[k]){d.fwd[k]=fw;if(fw&&d.live&&now-tickAt>24){tickAt=now;sfx.flick();}}
if(rm){d.th[k]=tt;d.tv[k]=0;}else for(let n=Math.ceil(dt/.006),j=0;j<n;j++){const h=dt/n;d.tv[k]+=(520*(tt-d.th[k])-30*d.tv[k])*h;d.th[k]+=d.tv[k]*h;}}
// The raised card pops up on a springy lift; taking it out draws the rod first.
if(d.res&&d.res.hit&&d.liftK===d.res.k&&d.mode==='open')d.liftTo=1;
if(rm){d.lift=d.liftTo;d.lv=0;}else for(let n=Math.ceil(dt/.004),j=0;j<n;j++){const h=dt/n;d.lv+=(260*(d.liftTo-d.lift)-17*d.lv)*h;d.lift+=d.lv*h;}
const ready=d.outTo&&d.res&&d.res.hit&&d.liftK===d.res.k,rodTo=ready||d.out>.02?1:0,outTo=ready&&d.rod>.92&&d.lift>.6?1:0;
const r0=d.rod;d.rod=rm?rodTo:d.rod+clamp(rodTo-d.rod,-dt*5,dt*5);if((r0===0&&d.rod>0)||(r0===1&&d.rod<1))sfx.rod();
const o0=d.out;d.out=rm?outTo:d.out+clamp(outTo-d.out,-dt*2.6,dt*2.2);if(o0===0&&d.out>0)sfx.paper();
d.ga=rm?(d.ghost?1:0):d.ga+clamp((d.ghost?1:0)-d.ga,-dt*6,dt*4);
const p=(now-d.shake)/380;d.sx=rm||p>=1?0:.75*Math.sin(p*Math.PI*6)*(1-p);
let m=Math.abs(d.v)+Math.abs(d.lv)+Math.abs(d.sx);for(let k=0;k<N;k++)m+=Math.abs(d.tv[k]);
const key=`${f2(d.x)}|${d.gap.toFixed(3)}|${d.lift.toFixed(3)}|${d.out.toFixed(3)}|${d.rod.toFixed(3)}|${d.ga.toFixed(3)}|${d.liftK}|${d.ghostK}|${cur}`;
if(m>.02||key!==d.key)d.dirty=true;d.key=key;
}
function impact(d,k){sfx.thunk(k);if(k>.6)jolt=performance.now();}
// Drawing one live drawer: box faces split at the case front, cards on their lean, the raised card, the ghost of a miss.
function render(d){
const e=d.x,sx=d.sx;set(d.panel,'transform',shift(sx,e,0));d.panel.classList.toggle('shut',e<.4);
const show=d.live?'inline':'none';set(d.inner,'display',show);set(d.box,'display',show);
const ch=.34*e,cs=.22*ch;set(d.cast,'d',ch>.3?`M${f2(sx)},0H${f2(29.8+sx)}L${f2(29.8+sx+cs)},${f2(ch)}H${f2(sx+cs)}Z`:'');if(!d.live)return;
const ya=8+e,yb=74+e,xa=d.xo+1.6+sx,xb=d.xo+31.4+sx,z0=d.zb+1.2,z1=d.zb+2.2,zw=d.zb+10;
for(const[inner,Q]of[[true,d.I],[false,d.O]]){const lo=inner?ya:Math.max(ya,AP),hi=inner?Math.min(yb,AP):yb,ok=hi-lo>.01;
quad(Q.floor,ok&&[[xa,lo,z1],[xb,lo,z1],[xb,hi,z1],[xa,hi,z1]]);quad(Q.lw,ok&&[[xa+1,lo,z1],[xa+1,hi,z1],[xa+1,hi,zw],[xa+1,lo,zw]]);
quad(Q.lwt,ok&&[[xa,lo,zw],[xa+1,lo,zw],[xa+1,hi,zw],[xa,hi,zw]]);quad(Q.rw,ok&&[[xb,lo,z0],[xb,hi,z0],[xb,hi,zw],[xb,lo,zw]]);quad(Q.rwt,ok&&[[xb-1,lo,zw],[xb,lo,zw],[xb,hi,zw],[xb-1,hi,zw]]);}
quad(d.I.back,ya<AP&&[[xa+1,ya,z1],[xb-1,ya,z1],[xb-1,ya,zw],[xa+1,ya,zw]]);
set(d.follower,'transform',shift(sx,e,0));
const eo=ease(d.out),x0=d.xo+3.5+sx;
const place=(g,y,th,dz)=>{const s=Math.sin(th*RAD),c=Math.cos(th*RAD),o=P(x0,y+CH*s,z1+dz+CH*c);set(g,'transform',`matrix(${f2(C)} ${f2(S)} ${f2(s*C)} ${f2(c-s*S)} ${f2(o[0])} ${f2(o[1])})`);};
for(const l of d.leaves){const k=l.k;let th=d.th[k],dz=0,dy=0;
if(k===d.liftK){dz=LIFT*d.lift+OUTZ*eo;dy=OUTY*eo;th+=-24*eo;}
place(l.g,71.6-PITCH*k+e+dy,th,dz);l.g.classList.toggle('hit',k===d.liftK&&d.lift>.5);}
const lk=d.liftK>=0?d.leaves[d.liftK]:null,own=d.i===cur;
if(own){if(lk&&d.lift>.02){if(glow.parentNode!==lk.g)lk.g.insertBefore(glow,lk.g.firstChild);glow.style.opacity=f2(.36*clamp(d.lift));}else glow.style.opacity='0';
if(d.ga>.01){set(ghost,'display','inline');ghost.style.opacity=f2(d.ga);place(ghost,71.6-PITCH*(d.ghostK-.5)+e,-7,8*ease(d.ga));}else set(ghost,'display','none');}
// Paint order: the follower and cards back to front, each inside or outside the case; the card being read on top.
const kOut=e<4.4?0:Math.min(N,Math.floor((e-4.4)/PITCH)+1),fOut=24.4+e>=AP,floatK=lk&&eo>.25?lk.k:-1,gk=own&&d.ga>.01?d.ghostK:-9,sig=`${kOut}|${fOut}|${floatK}|${gk}`;
if(sig!==d.sig){d.sig=sig;const I=d.I.pack,O=d.O.pack;(fOut?O:I).appendChild(d.follower);
for(let k=N-1;k>=0;k--){if(k===gk-1)(71.6-PITCH*(gk-.5)+e>=AP?O:I).appendChild(ghost);const l=d.leaves[k];if(k===floatK)float.appendChild(l.g);else(k<kOut?O:I).appendChild(l.g);}
if(gk===N)(d.follower.parentNode).appendChild(ghost);}
if(d.rodD!==d.rod){d.rodD=d.rod;d.knob.textContent='';into(d.knob);const L=4.6*ease(d.rod);if(L>.05)cylinder(d.xo+16.5,AP,d.zb+4,.75,L,'y','brass');const k=cylinder(d.xo+16.5,AP+L,d.zb+4,1.5,1.3,'y','brass');circle(k.face,0,0,.5,'rivet');into(draw);}
}
// Readout and state, from the open drawer and its query.
function ui(now){
const d=cur>=0?drawers[cur]:null,closing=drawers.find(o=>o.mode==='close');
const r=d?`FIND “${query}” · DRAWER ${pad2(d.i+1)} · ${d.label}`:'FIND — · ALL CLOSED';
let s;
if(now<flashUntil)s=flashMsg;
else if(!d)s=closing?`CLOSING DRAWER ${pad2(closing.i+1)}`:'CLOSED · TYPE A LETTER';
else if(d.x<EXT*.8&&!d.res)s=`OPENING DRAWER ${pad2(d.i+1)}`;
else if(d.pend)s=`LOOKING FOR “${d.pend.q}”`;
else if(d.res&&d.res.hit&&(d.outTo||d.out>.02))s=`CARD OUT · ${d.res.card.key}`;
else if(d.res&&d.res.hit)s=`FOUND · ${d.res.card.key}`;
else if(d.res)s=d.res.near?`NO MATCH · NEAREST ${d.res.near.key}`:'NO MATCH';
else s=`OPENING DRAWER ${pad2(d.i+1)}`;
if(demo.on&&now>=flashUntil)s=`DEMO · ${s}`;
if(r!==lastR){lastR=r;readout.textContent=r;}if(s!==lastS){lastS=s;stateLabel.textContent=s;}
}
// Idle demo: after a quiet spell it looks a few words up by itself, silently; any input takes over.
function demoStep(now){
if(!demo.on){if(reduced.matches||now-lastIn<IDLE)return;demo.on=true;demo.t=now+300;demo.c=0;}
if(now<demo.t)return;
const w=DEMO[demo.w%DEMO.length];
if(demo.c<w.length){letter(w[demo.c++]);demo.t=now+(demo.c===1?820:160+Math.random()*80);}else{demo.w++;demo.c=0;demo.t=now+3400;}
}
function tick(now){
const dt=Math.min(.05,Math.max(0,(now-last)/1000)),rm=reduced.matches;last=now;
demoStep(now);
for(const d of drawers)if(d.live||d.dirty){if(d.live)step(d,dt,rm,now);if(d.dirty){d.dirty=false;render(d);}}
if(cur<0&&(glow.style.opacity!=='0'||ghost.getAttribute('display')!=='none')){glow.style.opacity='0';set(ghost,'display','none');}
const p=(now-jolt)/170,j=p<1&&!rm?f2(.55*Math.sin(p*Math.PI*2)*(1-p)):'';if(j!==joltD){joltD=j;if(j)set(draw,'transform',`translate(0 ${j})`);else draw.removeAttribute('transform');}
ui(now);requestAnimationFrame(tick);
}
document.addEventListener('keydown',e=>{
if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;
const k=e.key;
if(/^[a-z]$/i.test(k)){e.preventDefault();if(e.repeat)return;user();letter(k.toUpperCase());}
else if(k==='ArrowDown'||k==='ArrowUp'){e.preventDefault();user();browse(k==='ArrowDown'?1:-1);}
else if(k==='Enter'){e.preventDefault();if(e.repeat)return;user();takeOut();}
else if(k==='Escape'){e.preventDefault();if(e.repeat)return;user();closeAll();}
else if(k==='Backspace'){e.preventDefault();user();erase();}
else return;
ui(performance.now());
});
// It starts with the M drawer out and METEORS raised: the found state, at rest.
{const d=drawers[7];query='METEORS';cur=7;build(d);d.live=true;d.mode='open';d.x=EXT;d.tock=true;const t=seek(d,query);d.gap=t.k-.5;d.res=t;d.liftK=t.k;d.lift=d.liftTo=1;
set(d.panel,'aria-expanded','true');set(d.panel,'aria-label',`Drawer 8, M: close`);
for(const l of d.leaves){const dd=l.k-d.gap,s=smooth(-.5,.5,dd),fan=clamp(1-(-dd-.5)/12);d.th[l.k]=l.k===d.liftK?-9:(12+22*fan)*(1-s)+BACK*s+d.jit[l.k];d.fwd[l.k]=s<.5?1:0;}
render(d);}
ui(performance.now());requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
