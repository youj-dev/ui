// @ts-nocheck
/* OSTRAN S/8 · Mainframe. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--panel:#2f2f2e;--lens:#4b4a48;--pink:#9c9b96;--lamp:#ffc04a;--ok:#2fbf6a;--warn:#f0a020;--fault:#ec3b2e;--white:#fff4d8;--void:#6c6c69;--post:#cfcfcb;--int:#474745;--col:#5b5b58;--reel:#e3e3df;--hub:#c9c9c5;--pack:#4f3322;--tape:#7a4f33;--hubr:#cf4433;--card:#e9dbb2;--card-top:#f3e9cb;--card-side:#d5c596;--paper:#fbfbf7;--bar:#d6e8d5;--hole:#cfcfca;--ink2:#3b3b3b;--btn-g:#3e9661;--btn-r:#cb4636;--btn-w:#efeee8;--btn-k:#a3a29d;--metal:#cdcdc9;--cable:#2c2c2b;--smoke:#2e2e2e;--smoke-a:.14}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--panel:#262625;--lens:#3e3d3c;--pink:#83827f;--lamp:#ffb63d;--ok:#36d886;--warn:#ffad2b;--fault:#ff4c41;--white:#d7ceb6;--void:#5a5a58;--post:#aeaeac;--int:#3a3a39;--col:#4b4b49;--reel:#bfbfbd;--hub:#a9a9a6;--pack:#41291b;--tape:#664129;--hubr:#ae3829;--card:#c4b895;--card-top:#e3dabe;--card-side:#968b69;--paper:#d4d4d1;--bar:#b7c2b6;--hole:#aeaeab;--ink2:#303030;--btn-g:#337e51;--btn-r:#ab3a2c;--btn-w:#c9c9c5;--btn-k:#888885;--metal:#acacaa;--cable:#232323;--smoke:#252525;--smoke-a:.3;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:4.4px;letter-spacing:1.3px;font-weight:600}.micro{font-size:1.8px;letter-spacing:.2px}.center{text-anchor:middle}.end{text-anchor:end}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.panel{fill:var(--panel)}.void{fill:var(--void);stroke:none}.post{fill:var(--post)}.int{fill:var(--int)}.col{fill:var(--col)}.reel{fill:var(--reel);stroke:var(--line);stroke-width:.6;vector-effect:non-scaling-stroke}.hub{fill:var(--hub)}.hubr{fill:var(--hubr)}.pack{fill:var(--pack);stroke:none}.tape{fill:none;stroke:var(--tape);stroke-width:.75;stroke-linejoin:round}.metal{fill:var(--metal)}.card{fill:var(--card)}.top.card{fill:var(--card-top)}.side.card{fill:var(--card-side)}.paper{fill:var(--paper)}.punch{fill:var(--ink2);opacity:.55;stroke:none}
.pt{fill:var(--pink);font:600 1.9px ui-monospace,monospace;letter-spacing:.3px;stroke:none}.sx{fill:var(--pink);font:600 1.45px ui-monospace,monospace;letter-spacing:.15px;stroke:none;text-anchor:middle}.sx.on{fill:#241a00}.bl{fill:#222;font:600 1.5px ui-monospace,monospace;letter-spacing:.1px;stroke:none;text-anchor:middle}.pr{fill:var(--ink2);font:1.75px ui-monospace,monospace;letter-spacing:.05px;stroke:none;white-space:pre}.cnt{fill:var(--lamp);font:600 3px ui-monospace,monospace;letter-spacing:.5px;stroke:none;text-anchor:middle}
.lp,.lq,.sl{fill:var(--lens);stroke:none}.lp.on{filter:url(#lgs)}.pb{stroke:none}.pb.g{fill:var(--btn-g)}.pb.r{fill:var(--btn-r)}.pb.w{fill:var(--btn-w)}.pb.k{fill:var(--btn-k)}.pb.on{filter:url(#lgs)}.on.y{fill:var(--lamp)}.on.g{fill:var(--ok)}.on.a{fill:var(--warn)}.on.r{fill:var(--fault)}.on.w{fill:var(--white)}
.halo{fill:var(--fault);opacity:0;filter:url(#bloom);pointer-events:none}.pane{fill:var(--smoke);fill-opacity:var(--smoke-a);stroke:none;pointer-events:none}.sheen{fill:#fff;opacity:.1;pointer-events:none}.blur{fill:var(--reel);opacity:0;stroke:none}
.cu{fill:none;stroke:var(--line);stroke-linecap:round;stroke-linejoin:round}.cb{fill:none;stroke:var(--cable);stroke-linecap:round;stroke-linejoin:round}.lev-u{fill:none;stroke:var(--line);stroke-width:2;stroke-linecap:round}.lev{fill:none;stroke:var(--metal);stroke-width:1.1;stroke-linecap:round}.slug{fill:var(--pink);stroke:none}.ham{stroke:var(--lamp);stroke-width:.35;opacity:0}.perf{stroke:var(--hole);stroke-width:.25;stroke-dasharray:.8 .6}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}.control:hover .pb{opacity:.85}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}.stage-contact{fill:#000;opacity:.5;filter:url(#bloom);transform:none}.stage-pool{transform:scale(1.9)}}`

const defs = `<filter id="lg" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation=".55" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="lgs" x="-150%" y="-150%" width="400%" height="400%"><feGaussianBlur stdDeviation=".55" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<pattern id="perf" width="2.4" height="2.4" patternUnits="userSpaceOnUse"><circle cx="1.2" cy="1.2" r=".55" style="fill:var(--line);opacity:.55"/></pattern>
<pattern id="gb" width="52" height="10.4" patternUnits="userSpaceOnUse"><rect width="52" height="10.4" style="fill:var(--paper)"/><rect x="3" width="46" height="5.2" style="fill:var(--bar)"/><path d="M3,0V10.4M49,0V10.4" style="stroke:var(--hole);stroke-width:.2;stroke-dasharray:.5 .5"/><circle cx="1.5" cy="1.3" r=".55" style="fill:var(--hole)"/><circle cx="50.5" cy="1.3" r=".55" style="fill:var(--hole)"/><circle cx="1.5" cy="6.5" r=".55" style="fill:var(--hole)"/><circle cx="50.5" cy="6.5" r=".55" style="fill:var(--hole)"/></pattern>
<clipPath id="tw"><rect x="4" y="8" width="42" height="63.6" rx="1.2"/></clipPath>
<clipPath id="ps"><rect x="0" y="-28.6" width="52" height="28.6"/></clipPath>
<clipPath id="cw"><rect x="6" y="3.6" width="56" height="5.4" rx=".8"/></clipPath>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* OSTRAN S/8 computer room. World: x lower-right; y lower-left (fronts face +y); z up. 1 unit ≈ 2 cm.
Part x y z w d h
subfloor -8 -8 0 216 144 2
pedestals + cable runs (front and right edges) -8–208 -8–136 2 2.4 2.4 10
floor tiles (24 × 24) -8 -8 12 216 144 2
open tile + lifted tile + lifter 88/64.4 88/90.6 2/14 24/23.2 24/23.2 12/1.8
tape unit 1 0 6 14 50 34 93
processor + console 58 4 14 84 36 96
tape unit 2 150 6 14 50 34 93
reels ×2 per tape unit (behind the door glass) x0+14.5/35.5 40 79.5 r9.8 – –
vacuum columns ×2 per tape unit x0+8.4/32.4 40 33.6 9.2 – 25
lamp panel: ADDR INSTR REG A REG B (4 × 16) + 7 status 62 40 56.4 75 – 38
toggle switches ×8 66–109.4 40 49 1.5 3.4 –
console push buttons ×5 63–120.4 40 35 9 1.4 6
card reader 4 84 14 56 32 40
stacker pocket · read station · hopper 7.6/29.2/44 89/87.6/90.3 48.6/54/54 10.4/5.4/8.6 22/24.8/19.4 5.4/6/≤4.3
line printer 138 96 14 68 38 46
fanfold paper + fold bar 146 103.4 60 52 – 28.6
Lamps, labels, seams and screws share their parent face. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: lamps that remember their state, lit push buttons, cabinets, cable runs, clip regions.
const draw=root,defs=svg.querySelector('defs'),into=g=>root=g,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),RAD=Math.PI/180;
function button(g,label){set(g,'class','control');set(g,'role','button');set(g,'tabindex','0');set(g,'aria-label',label);return g;}
function bind(g,fn){g.addEventListener('click',()=>fn());g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function lamp(g,x,y,r,c,b='lp'){const n=circle(g,x,y,r,b+' '+c);n.b=b+' '+c;n.k='';return n;}
function lit(n,v){const c=v?n.b+' on':n.b;if(n.k!==c){n.k=c;set(n,'class',c);if(n.t)set(n.t,'class',v?'sx on':'sx');}}
function pbtn(X,Y,Z,u,v,w,h,c,t,name,fn){const g=name?button(el('g'),t?`${t}: ${name}`:name):el('g');into(g);box(X+u,Y,Z-v-h,w,1.4,h,.5,'');const f=group(FRONT(X+u,Y+1.4,Z-v));
const n=rect(f,.5,.5,w-1,h-1,.4,'pb '+c);n.b='pb '+c;n.k='';if(t)text(f,w/2,h/2+.55,t,'bl');if(name){rect(f,-1.2,-1.2,w+2.4,h+2.4,1,'focus-ring');bind(g,fn);}into(draw);return n;}
function cabinet(x,y,w,d,h){box(x+1,y+1,14,w-2,d-2,3,.6,'base');box(x,y,17,w,d,h-3,1.4,'');box(x-1,y-1,14+h,w+2,d+2,3,1,'');}
function shade(x,y,w,d){const r=rect(group(TOP(x-3,y-2,14)),0,0,w+7,d+6,4,'shadow');r.style.filter='url(#bloom)';r.style.opacity=.13;}
function run(pts,w){const d=poly(pts);el('path',{d,class:'cu','stroke-width':w+.9});el('path',{d,class:'cb','stroke-width':w});}
function clipTo(id,pts){el('polygon',{points:pts.map(p=>P(...p).map(f2).join(',')).join(' ')},el('clipPath',{id},defs));return el('g',{'clip-path':`url(#${id})`});}
// Raised floor: subfloor, the void under the front and right edges with pedestals and cable runs, tiles.
{const g=group(TOP(-8,-8,0));rect(g,0,0,216,144,6,'stage-pool');rect(g,0,0,216,144,6,'stage-contact');}box(-8,-8,0,216,144,2,.6,'base');
rect(group(FRONT(-8,136,12)),0,0,216,10,0,'void');rect(group(SIDE(208,136,12)),0,0,144,10,0,'void');
run([[-8,131,4.2],[203,131,4.2],[203,-8,4.2]],2.2);run([[-8,133.4,7.4],[205.4,133.4,7.4],[205.4,-8,7.4]],1.4);
for(const x of[-6.6,16,40,64,88,112,136,160,184])box(x-1.2,133.6,2,2.4,2.4,9.2,.3,'post');
for(const y of[-6.6,16,40,64,88,112,134.6])box(205.6,y-1.2,2,2.4,2.4,9.2,.3,'post');
box(-8,-8,12,216,144,2,.6,'');
const FT=group(TOP(-8,-8,14.02));
for(let k=1;k<9;k++)line(FT,k*24,0,k*24,144);for(let k=1;k<6;k++)line(FT,0,k*24,216,k*24);
for(const[c,r]of[[1,2],[3,2],[4,2],[5,2],[7,2]]){rect(FT,c*24+2,r*24+2,20,20,1,'detail');rect(FT,c*24+3,r*24+3,18,18,.6,'face').style.fill='url(#perf)';}
// The open tile: subfloor, cut edges, pedestals and two cable bundles in the void.
{const H=clipTo('hole',[[88,88,14],[112,88,14],[112,112,14],[88,112,14]]);into(H);
rect(group(TOP(88,88,2)),0,0,24,24,0,'face void');
const hf=group(FRONT(88,88,14));rect(hf,0,2,24,10,0,'void');rect(hf,0,0,24,2,0,'face');
const hs=group(SIDE(88,112,14));rect(hs,0,2,24,10,0,'void');rect(hs,0,0,24,2,0,'face side');
box(88,88,2,1.6,1.6,10,.3,'post');box(110.4,88,2,1.6,1.6,10,.3,'post');box(88,110.4,2,1.6,1.6,10,.3,'post');
run([[80,97,4.6],[120,97,4.6]],2.6);run([[80,103.6,3.4],[120,103.6,3.4]],2);run([[100,80,7.6],[100,120,7.6]],1.4);into(draw);}
box(64.4,90.6,14,23.2,23.2,1.8,.6,'');{const t=group(TOP(64.4,90.6,15.82));rect(t,2,2,19.2,19.2,.8,'detail');}
for(const x of[72.4,80.6])cylinder(x,102,15.8,2.1,.9,'z','base');box(71.2,101.2,16.7,10.6,1.6,1.8,.7,'base');
// Back row, left to right: tape unit 1, processor, tape unit 2.
shade(0,6,50,34);shade(58,4,84,36);shade(150,6,50,34);
const FL=(()=>{let d='M9.8,0A9.8,9.8 0 1 0 -9.8,0A9.8,9.8 0 1 0 9.8,0Z';for(const a of[0,120,240]){const p=(r,t)=>`${f2(r*Math.cos(t))},${f2(r*Math.sin(t))}`,a0=(a+18)*RAD,a1=(a+102)*RAD;d+=`M${p(8.5,a0)}A8.5,8.5 0 0 1 ${p(8.5,a1)}L${p(4.3,a1)}A4.3,4.3 0 0 0 ${p(4.3,a0)}Z`;}return d;})();
const TAPES=[];
function tapeUnit(x0,k){
cabinet(x0,6,50,34,93);
const sd=group(SIDE(x0+50,40,104));rect(sd,3,4,28,79,1.6,'detail');slits(sd,8,70,18,8,8);text(sd,17,13,'TU '+k,'etch center');
const F=group(FRONT(x0,40,104));rect(F,3,1.4,15,3.6,.8,'face top');text(F,10.5,4,'TAPE  '+k,'etch micro center');text(F,47,4,'OSTRAN 2420','etch micro end');
rect(F,2.2,6.2,45.6,67.6,2.2,'face');rect(F,4,8,42,63.6,1.2,'face int');
const IN=group('',F,{'clip-path':'url(#tw)'});
for(const u of[8.4,32.4])rect(IN,u,45.6,9.2,24.6,1.2,'face col');
const tp=el('path',{class:'tape'},IN);
const reels=[14.5,35.5].map((u,j)=>{const g=group(`translate(${u} 24.5)`,IN),pk=circle(g,0,0,8,'pack'),sp=group('',g);
el('path',{d:FL,class:'reel','fill-rule':'evenodd'},sp);circle(sp,0,0,3.3,'face hub');circle(sp,0,0,2.3,j?'face base':'face hubr');circle(sp,0,0,1,'face recess');for(const a of[30,150,270])line(sp,1.2*Math.cos(a*RAD),1.2*Math.sin(a*RAD),3.1*Math.cos(a*RAD),3.1*Math.sin(a*RAD));
return{pk,sp,bl:circle(g,0,0,9.6,'blur'),a:j*40,r:8};});
rect(IN,20.2,37,9.6,6.4,1,'face base');rect(IN,21.6,38.4,6.8,2.2,.6,'face recess');for(const u of[18.4,31.6])circle(IN,u,42.6,1.15,'face metal');
rect(F,4,8,42,63.6,1.2,'pane');el('path',{d:'M15,8h8L9,71.6H4V45ZM27,8h3L16,71.6h-3Z',class:'sheen','clip-path':'url(#tw)'},F);rect(F,4,8,42,63.6,1.2,'detail');
rect(F,3,75,44,5.6,1,'face top');const rdy=lamp(F,7,77.8,1.05,'g'),sel=lamp(F,11.4,77.8,1.05,'a'),chk=lamp(F,15.8,77.8,1.05,'r');text(F,18.6,78.5,'READY SELECT F.PROT','etch micro').style.fontSize='1.25px';
for(const u of[39.6,43.4])circle(F,u,77.8,1.3,'face base');
TAPES.push({k,tp,reels,rdy,sel,chk,f:k===1?.72:.3,v:0,vt:0,next:0,until:0,dl:58,dr:58,ul:0,ur:0,rew:false});
}
tapeUnit(0,1);
// Processor with the system console: lamp panel, switch register, push buttons.
cabinet(58,4,84,36,96);
{const t=group(TOP(57,3,110));rect(t,13,8,60,20,1.6,'detail');for(let i=1;i<30;i++)line(t,13+i*2,10,13+i*2,26);}
const CF=group(FRONT(58,40,107));
rect(CF,3.4,2.4,39,6.6,1,'face top');text(CF,5.6,7.4,'OSTRAN','label brand');text(CF,40.2,7.4,'S/8','label end');text(CF,80.6,6.9,'SYSTEM CONTROL','etch micro end');
rect(CF,3,10,78,41.4,2,'face base');rect(CF,4.4,11.4,75.2,38.6,1.2,'face panel');
['ADDR','INSTR','REG A','REG B'].forEach((t,r)=>text(CF,6.4,18.1+r*7,t,'pt'));
for(let r=0;r<4;r++)for(const i of[4,8,12])line(CF,21+i*3.5+(i>>2)*1.3-2.8,14.4+r*7,21+i*3.5+(i>>2)*1.3-2.8,20.4+r*7,'detail');
const chkHalo=rect(CF,64,40,18,11.6,3,'halo');const LG=group('',CF,{filter:'url(#lg)'});
const ROWS=[0,1,2,3].map(r=>[...Array(16)].map((_,i)=>lamp(LG,21+i*3.5+(i>>2)*1.3,17.4+r*7,1.2,r===3?'w':'y','lq')));
const STN=['POWER','RUN','WAIT','LOAD','TAPE','PRINT','CHECK'],STC=['w','g','a','w','w','w','r'];
const ST=STN.map((t,j)=>{const n=rect(LG,6+j*10.55,43.8,9.2,3.8,.7,'sl '+STC[j]);n.b='sl '+STC[j];n.k='';return n;});
ST.forEach((n,j)=>n.t=text(CF,10.6+j*10.55,46.3,STN[j],'sx'));
rect(CF,3,53.2,52.6,11.6,1.6,'face top');for(let i=0;i<8;i++)text(CF,8+i*6.2,55.6,i+1,'etch micro center');
line(CF,30.2,54,30.2,64);text(CF,17.3,63.6,'ADDRESS','etch micro center').style.fontSize='1.3px';text(CF,42.7,63.6,'DATA','etch micro center').style.fontSize='1.3px';
rect(CF,58,53.2,23,11.6,1.6,'face top');text(CF,64.4,55.4,'RATE','etch micro center');text(CF,75.6,55.4,'EMERGENCY','etch micro center').style.fontSize='1.2px';
{const k=cylinder(122.4,40,48.6,2.4,2,'y','base').face;line(k,0,-.4,0,-2.2,'detail');}
{const k=cylinder(133.6,40,48.6,2.6,2.6,'y','');k.g.querySelectorAll('path,circle').forEach(n=>n.style.fill='var(--btn-r)');circle(k.face,0,0,1.4,'detail');}
slits(CF,6,79,72,7,24);line(CF,3,76,81,76);rect(CF,0,88,84,2,1,'face base');
const TG=[];
for(let i=0;i<8;i++){const x=66+i*6.2,g=button(el('g'),'');const b=group(FRONT(x,40,49),g);circle(b,0,0,1.5,'face top');circle(b,0,0,.75,'face recess');
const u=el('path',{class:'lev-u'},g),l=el('path',{class:'lev'},g),tip=el('circle',{r:.8,class:'face top'},g);rect(group(FRONT(x-2.6,40,52.6),g),0,0,5.2,8.6,1,'hit');rect(group(FRONT(x-2.6,40,52.6),g),0,0,5.2,8.6,1,'focus-ring');
TG.push({g,u,l,tip,x,o:-2});bind(g,()=>flip(i));}
const KB={load:pbtn(58,40,107,5,66,9,6,'w','LOAD','Load the card deck (L)',()=>load()),start:pbtn(58,40,107,16,66,9,6,'g','START','Run the program (Space)',()=>start()),stop:pbtn(58,40,107,27,66,9,6,'r','STOP','Halt (Space)',()=>halt()),
reset:pbtn(58,40,107,38,66,9,6,'k','RESET','System reset (R)',()=>reset()),test:pbtn(58,40,107,56,66.6,6.4,4.8,'r','TEST','Inject a parity fault (F)',()=>fault())};
text(CF,59.2,74.6,'CHECK TEST','etch micro center').style.fontSize='1.2px';
tapeUnit(150,2);
// Card reader: deck with stacker pocket, read station and hopper; control panel in front.
shade(4,84,56,32);
box(5,85,14,54,30,3,.6,'base');box(4,84,17,56,32,37,1.4,'');
const RS=group(SIDE(60,116,54));rect(RS,3,3,26,30,1.4,'detail');slits(RS,7,22,18,8,8);
const RF=group(FRONT(4,116,54));rect(RF,3,2,50,9.4,1.2,'face top');
const rRdy=lamp(RF,7,5.2,1.1,'g'),rFeed=lamp(RF,11.6,5.2,1.1,'a'),rChk=lamp(RF,16.2,5.2,1.1,'r');text(RF,11.6,9.4,'READY FEED CHECK','etch micro center').style.fontSize='1.1px';
rect(RF,21,3.6,15,5.6,.8,'face panel');const cnt=text(RF,28.5,7.5,'0000','cnt');
pbtn(4,116,54,39,3.2,6,5,'g','','');pbtn(4,116,54,46.6,3.2,6,5,'r','','');
rect(RF,3,13.4,50,19.6,1.4,'detail');text(RF,28,17.6,'OSTRAN 2501 · CARD READER','etch micro center');slits(RF,8,25,40,5.6,16);rect(RF,0,34.4,56,2.6,1,'face base');
{const t=group(TOP(4,84,54.02));rect(t,1.6,1.6,52.8,28.8,1.4,'detail');rect(t,13.6,5.2,27,21.6,.6,'face base');for(const v of[8.4,23.4])line(t,14.4,v,39.8,v);}
const PK=clipTo('pocket',[[7.6,89,54],[18,89,54],[18,111,54],[7.6,111,54]]);into(PK);
rect(group(TOP(7.6,89,48.6)),0,0,10.4,22,0,'face base');rect(group(FRONT(7.6,89,54)),0,0,10.4,5.4,0,'face side');rect(group(SIDE(7.6,111,54)),0,0,22,5.4,0,'face side');
const stkG=el('g',{});into(draw);
const cardL=el('g',{});
box(29.2,87.6,54,5.4,24.8,6,1,'');const rdF=group(FRONT(29.2,112.4,60));const rRead=lamp(rdF,2.7,2.4,1,'y');line(rdF,1,4.7,4.4,4.7);{const t=group(TOP(29.2,87.6,60.02));text(t,2.7,9,'R','etch micro center');text(t,2.7,11.4,'E','etch micro center');text(t,2.7,13.8,'A','etch micro center');text(t,2.7,16.2,'D','etch micro center');}
const hopG=button(el('g'),'Card hopper: load the deck (L)');into(hopG);box(42.8,88.2,54,11.6,1.2,7.4,.4,'');const hopS=el('g',{});
el('path',{d:poly([[42.4,88,54],[55,88,54],[55,112,54],[42.4,112,54]],true),class:'hit'});
el('path',{d:poly([[41.8,87.4,54],[55.6,87.4,54],[55.6,112.6,54],[41.8,112.6,54]],true),class:'focus-ring'});into(draw);
el('path',{d:'M1.4,0H8.6V19.4H0V1.4Z',class:'face top card'},cardL);const punch=el('path',{class:'punch'},cardL);cardL.style.display='none';
function deck(g,x,y,z,n,w=0){g.replaceChildren();if(!n)return;into(g);const h=n*.24;box(x,y,z,8.6,19.4,h,.3,'card');const f=group(FRONT(x,y+19.4,z+h)),s=group(SIDE(x+8.6,y+19.4,z+h));
for(let i=4;i<n;i+=4){line(f,.3,i*.24,8.3,i*.24);line(s,.3,i*.24,19.1,i*.24);}if(w)box(x+1.7,y+4,z+h,5.2,11.4,2.4,.6,'base');into(draw);}
// Line printer: chain window, controls, forms door; fanfold paper rises over the fold bar.
shade(138,96,68,38);
box(139,97,14,66,36,3,.6,'base');box(138,96,17,68,38,41,1.4,'');box(140,98,58,64,32,2,1,'');
const PSd=group(SIDE(206,134,58));rect(PSd,3,3,32,36,1.4,'detail');slits(PSd,7,26,24,9,10);rect(PSd,8,6,22,6,.8,'face top');text(PSd,19,9.9,'1430 · 1100 LPM','etch micro center').style.fontSize='1.3px';
{const t=group(TOP(140,98,60.02));rect(t,4.6,4.4,55,2.2,1,'face recess');line(t,2,14,62,14);}
const PF=group(FRONT(138,134,58));
rect(PF,5,2.6,58,7.8,1.2,'face base');rect(PF,6,3.6,56,5.4,.8,'face panel');
const chainG=group('',group('',PF,{'clip-path':'url(#cw)'}));for(let i=0;i<26;i++)rect(chainG,6+i*2.4,4.3,1.3,2.1,.3,'slug');
const hams=[];for(let i=0;i<22;i++)hams.push(line(PF,8+i*2.4,7.2,8+i*2.4,8.5,'ham'));
rect(PF,3,11.8,62,7.6,1.2,'face top');const pRdy=lamp(PF,7,15.6,1.1,'g'),pPrt=lamp(PF,11.6,15.6,1.1,'a'),pFrm=lamp(PF,16.2,15.6,1.1,'w'),pChk=lamp(PF,20.8,15.6,1.1,'r');
text(PF,13.9,18.6,'READY PRINT FORMS CHECK','etch micro center').style.fontSize='1.05px';
const pStart=pbtn(138,134,58,41,12.8,7,5.6,'g','PRINT','Print the listing (P)',()=>print());pbtn(138,134,58,49.6,12.8,7,5.6,'r','STOP','');pbtn(138,134,58,58.2,12.8,4.4,5.6,'w','','');
rect(PF,3,21.4,62,17,1.4,'detail');rect(PF,8,24.4,22,9,1,'face glass');for(let v=26;v<33;v+=1.3)line(PF,9,v,29,v);text(PF,47,26.6,'OSTRAN 1430 PRINTER','etch micro center');rect(PF,52,29,8,2.4,1.2,'face recess');rect(PF,0,39.4,68,1.6,.8,'face base');
const SH=group(FRONT(146,103.4,60)),SHC=group('',SH,{'clip-path':'url(#ps)'}),paperG=group('',SHC),gbR=rect(paperG,0,-40,52,60,0,'');gbR.style.fill='url(#gb)';gbR.style.stroke='none';const linesG=group('',paperG);line(SH,0,-28.6,0,0);line(SH,52,-28.6,52,0);
{const t=group(TOP(146,97.4,89.5));rect(t,0,0,52,6,0,'face paper');for(const u of[1.5,50.5])for(let v=1;v<6;v+=2.6)circle(t,u,v,.5,'face recess');}
for(const x of[143.4,200.6]){const d=poly([[x,99.6,60],[x,99.6,80],[x,102.6,88.6]]);el('path',{d,class:'lev-u'});el('path',{d,class:'lev'});}cylinder(142.6,102.6,88.6,.95,58.8,'x','metal');
frame([[-8,-8,0,216,144,14],[-1,5,14,52,36,93],[57,3,14,86,38,96],[149,5,14,52,36,93],[138,96,14,68,38,76]],12);
// State: deck, IPL, run, tapes, printer, fault; audio only after a gesture.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement'),hk={};
document.querySelectorAll('.hint [data-k]').forEach(b=>{hk[b.dataset.k]=b;b.addEventListener('click',()=>act[b.dataset.k]());});
const DECK=18,LH=2.6,OPS=['LDA','STA','ADD','SUB','JMP','JNZ','RDC','WRT','CMP','SHL','IOR','HLT'];
let pend=false,pk=0,mode='ready',loaded=false,hop=0,stk=0,total=0,readN=0,card=null,nextFeed=0,drop=1,sr=0o245,A=0,I=0,RA=0xace1,RB=0,lampT=0,lines=0,queue=0,nextLine=0,pOff=0,pT=0,chain=0,job=0,lastUI=-1,msg='',msgT=0,lt=0,ac=null,mg,nz,tg,tf;
function say(m){announcement.textContent=m;}
function note(s,m){msg=s;msgT=performance.now()+1800;if(m)say(m);lastUI=-1;}
function audio(){try{const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;if(!ac){ac=new AC();mg=ac.createGain();mg.gain.value=.6;mg.connect(ac.destination);
const b=ac.createBuffer(1,ac.sampleRate,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;nz=b;
const s=ac.createBufferSource();s.buffer=b;s.loop=true;const lp=ac.createBiquadFilter(),hg=ac.createGain();lp.type='lowpass';lp.frequency.value=260;hg.gain.value=.01;s.connect(lp);lp.connect(hg);hg.connect(mg);
tf=ac.createBiquadFilter();tf.type='bandpass';tf.frequency.value=700;tf.Q.value=1.4;tg=ac.createGain();tg.gain.value=0;s.connect(tf);tf.connect(tg);tg.connect(mg);s.start();}
if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function hiss(f,d,v,q=1,dl=0){if(!ac)return;const t=ac.currentTime+dl,s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nz;b.type='bandpass';b.frequency.value=f;b.Q.value=q;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(mg);s.start(t,Math.random()*.8,d+.05);}
function beep(f,d,v,type='square',dl=0){if(!ac)return;const t=ac.currentTime+dl,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(mg);o.start(t);o.stop(t+d+.03);}
const busy=()=>mode==='check'?(note('MACHINE CHECK · R TO RESET','Machine check. Press R to reset first.'),1):0;
function load(){audio();if(busy())return;if(mode==='ipl'){note('LOADING · CARDS FEEDING');return;}if(mode==='run'){note('RUNNING · SPACE TO HALT','Halt the program before loading cards.');return;}
if(!hop){hop=stk||DECK;stk=0;deck(stkG,8.5,90.3,48.6,0);drop=reduced.matches?1:0;}
deck(hopS,44,90.3,54+(drop<1?12:0),hop,1);total=hop;readN=0;loaded=false;mode='ipl';nextFeed=performance.now()+(reduced.matches?0:520);hiss(500,.25,.03,.6);beep(880,.05,.012);say(`${hop} cards in the hopper. Initial program load.`);sync();}
function start(){audio();if(busy())return;if(mode==='ipl'){pend=!pend;note(pend?'LOADING · RUNS WHEN LOADED':'LOADING · RUN CANCELLED',pend?'The program will run as soon as the deck is loaded.':'Run cancelled.');return;}if(mode==='run'){halt();return;}mode='run';job++;beep(160,.12,.03,'triangle');say(loaded?'Running the loaded program.':'Running the resident program.');sync();}
function halt(){audio();if(mode!=='run'){note(mode==='check'?'MACHINE CHECK · R TO RESET':'NOT RUNNING · SPACE TO RUN');return;}mode='halt';beep(330,.18,.02,'triangle');say('Halted. Switch register shown on REG B.');sync();}
function print(){audio();if(busy())return;queue+=18;nextLine=Math.max(nextLine,performance.now());say('Printing the listing.');sync();}
function fault(){audio();if(mode==='check'){note('MACHINE CHECK · R TO RESET');return;}mode='check';pend=false;queue=0;A=(A|0x8001)&0xffff;for(let i=0;i<3;i++)beep(190,.16,.035,'sawtooth',i*.24);say('Machine check: parity error. The processor stopped. Press R to reset.');sync();}
function reset(){audio();const was=mode;mode='ready';pend=false;A=I=RA=RB=0;queue=0;if(card){hop++;deck(hopS,44,90.3,54,hop,1);}card=null;cardL.style.display='none';PK.after(cardL);if(was==='ipl'){loaded=false;}
TAPES.forEach(t=>{t.rew=Math.abs(t.f-(t.k===1?.72:.3))>.01;});for(let i=0;i<3;i++)beep(1400-i*300,.02,.02,'square',i*.05);hiss(2600,.12,.02);say('System reset. Tapes rewinding.');sync();}
function flip(i){audio();sr^=1<<(7-i);beep(2400,.015,.02);hiss(3500,.02,.02);say(`Switch ${i+1} ${(sr>>(7-i))&1?'up':'down'}. Register ${sr.toString(8)} octal.`);sync();}
const act={l:load,' ':start,p:print,f:fault,r:reset};
bind(hopG,load);
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const k=e.key.toLowerCase();
if(k===' '&&e.target.closest&&e.target.closest('button,[role=button]'))return;
if(/^[1-8]$/.test(k)){e.preventDefault();flip(+k-1);}else if(act[k]){e.preventDefault();act[k]();}});
function sync(){msgT=0;set(hk[' '],'aria-pressed',mode==='run');set(hk.f,'aria-pressed',mode==='check');TG.forEach((t,i)=>{const on=(sr>>(7-i))&1;set(t.g,'aria-pressed',!!on);set(t.g,'aria-label',`Switch ${i+1}, ${i<4?'address':'data'} bit, ${on?'up':'down'} (${i+1})`);});lastUI=-1;}
function bits(row,v){row.forEach((l,i)=>lit(l,(v>>(15-i))&1));}
function printLine(){const k=lines++,y=pk++*LH+LH*.66;if(k%22===0)line(linesG,3,f2(y-LH*.66),49,f2(y-LH*.66),'perf');const n=el('text',{x:4.4,y:f2(y),class:'pr'},linesG);
const a=(0x1200+((job*37+k*6)&0xfff)).toString(16).toUpperCase().padStart(4,'0');
n.textContent=k%22===0?`OSTRAN S/8   JOB ${String(job).padStart(4,'0')}   SR ${sr.toString(8).padStart(3,'0')}   PAGE ${k/22+1|0}`:`${a}  ${OPS[(k*5+job+sr)%OPS.length]}  ${((sr*7+k*13+job)&0xfff).toString(8).padStart(4,'0')}   ${'·'.repeat(1+(k*7+sr)%14)}`;
while(linesG.childNodes.length>20)linesG.firstChild.remove();pT+=LH;hiss(3200,.07,.03,.8);hiss(900,.05,.02,1.4,.02);}
function feed(now){if(card){const t=reduced.matches?1:clamp((now-card.t0)/320),x=44-35.5*(1-Math.pow(1-t,2.2)),dz=t>.85?-(t-.85)/.15*(5.5-stk*.24):0;
if(t>.85&&cardL.parentNode!==PK)PK.appendChild(cardL);set(cardL,'transform',TOP(x,90.3,54.12+dz));lit(rRead,x>20.6&&x<34.6);
if(t>=1){card=null;cardL.style.display='none';PK.after(cardL);stk++;readN++;deck(stkG,8.5,90.3,48.6,stk);A=(readN*80)&0xffff;RA=(RA*75+readN)&0xffff;nextFeed=now+(reduced.matches?40:50);lastUI=-1;}}
else if(mode==='ipl'&&now>=nextFeed&&drop>=1){if(hop){hop--;deck(hopS,44,90.3,54,hop,1);card={t0:now};cardL.style.display='';set(punch,'d',[...Array(12)].map((_,i)=>`M${f2(.8+((i*37+readN*11)%7)*1.1)},${f2(1.6+((i*53+readN*7)%16)*1.1)}h.4v.7h-.4z`).join(''));hiss(1300,.06,.04,.9);beep(70,.06,.03,'triangle');}
else{mode='ready';loaded=true;beep(660,.08,.015);beep(990,.12,.015,'square',.09);say(`Program loaded from ${readN} cards. Press Space to run.`);sync();if(pend){pend=false;start();}}}}
function tapes(dt,now,red){let whir=0;for(const t of TAPES){
if(t.rew){t.vt=t.f<(t.k===1?.72:.3)?-420:420;if(Math.abs(t.f-(t.k===1?.72:.3))<.01){t.rew=false;t.vt=0;}}
else if(mode==='run'){if(now>=t.next){if(t.vt){t.vt=0;t.next=now+100+Math.random()*520;}else{const dir=t.f<.12?-1:t.f>.88?1:Math.random()<.68?1:-1;t.vt=dir*(55+Math.random()*75);t.next=now+130+Math.random()*560;}}}
else t.vt=0;
t.v=red?t.vt:t.v+(t.vt-t.v)*(1-Math.exp(-dt/.05));if(Math.abs(t.v)<.05&&!t.vt)t.v=0;
t.f=clamp(t.f-t.v*dt*(t.rew?.0003:.00018),.02,.98);const rL=Math.sqrt(3.6**2+t.f*(9.2**2-3.6**2)),rR=Math.sqrt(3.6**2+(1-t.f)*(9.2**2-3.6**2));
const [L,Rr]=t.reels;L.r=rL;Rr.r=rR;set(L.pk,'r',f2(rL));set(Rr.pk,'r',f2(rR));
if(!red){L.a=(L.a-t.v/rL*57.3*dt)%360;Rr.a=(Rr.a-t.v/rR*57.3*dt)%360;}set(L.sp,'transform',`rotate(${f2(L.a)})`);set(Rr.sp,'transform',`rotate(${f2(Rr.a)})`);
const bo=clamp((Math.abs(t.v)-50)/90)*.55;L.bl.style.opacity=f2(bo);Rr.bl.style.opacity=f2(bo);
const g=clamp(t.v/120,-1,1),idle=red?0:.5*Math.sin(now/900+t.k*2);
for(const[s,goal]of[['l',58+g*8+idle],['r',58-g*8-idle]]){if(red){t['d'+s]=goal;t['u'+s]=0;}else{t['u'+s]+=(170*(goal-t['d'+s])-11*t['u'+s])*dt;t['d'+s]+=t['u'+s]*dt;}}
set(t.tp,'d',`M${f2(14.5-rL)},24.5L10.2,46V${f2(t.dl)}A2.8,2.8 0 0 0 15.8,${f2(t.dl)}V46L18.4,41.5H31.6L34.2,46V${f2(t.dr)}A2.8,2.8 0 0 0 39.8,${f2(t.dr)}V46L${f2(35.5+rR)},24.5`);
lit(t.rdy,mode!=='check');lit(t.sel,Math.abs(t.v)>2||t.rew&&(red||(now/200|0)%2));lit(t.chk,t.k===2);whir+=Math.abs(t.v);}
if(tg){tg.gain.setTargetAtTime(Math.min(.05,whir*.00025),ac.currentTime,.04);tf.frequency.setTargetAtTime(500+whir*3,ac.currentTime,.05);}return whir;}
function tick(now){
const dt=Math.min(.05,Math.max(0,(now-(lt||now))/1000)),red=reduced.matches;lt=now;
if(drop<1){drop=Math.min(1,drop+dt*3);deck(hopS,44,90.3,54+12*(1-drop)**2,hop,1);}
if(mode!=='check')feed(now);
const whir=tapes(dt,now,red);
if(mode==='run'&&now-lampT>(red?400:62)){lampT=now;A=(A+1+(Math.random()<.18?Math.random()*256|0:0))&0xffff;I=(OPS.length*0x1111+(A*0x9e37>>4))&0xffff;RA=((RA>>1)^(-(RA&1)&0xb400))&0xffff;RB=((RA<<5|RA>>11)&0xffff)^sr;}
else if(mode==='ready'&&now-lampT>600){lampT=now;A^=1;}
if(mode==='run'||mode==='ipl'||lastUI<0||now-lampT<70){bits(ROWS[0],A);bits(ROWS[1],mode==='ipl'?0x0280:I);bits(ROWS[2],RA);bits(ROWS[3],mode==='run'?RB:mode==='check'?RB|1:sr);}
if(queue&&mode!=='check'&&now>=nextLine){queue--;printLine();nextLine=now+(red?20:110);lastUI=-1;}
pOff=red?pT:pOff+(pT-pOff)*(1-Math.exp(-dt/.05));set(paperG,'transform',`translate(0 ${f2(-pOff)})`);set(gbR,'y',f2(pOff-34));
const printing=queue>0||pT-pOff>.3;if(printing&&!red)chain=(chain+dt*160)%2.4;set(chainG,'transform',`translate(${f2(-chain)} 0)`);if(printing||hams.on){hams.on=printing;hams.forEach(h=>h.style.opacity=printing&&(red||Math.random()<.3)?.9:0);}
[true,mode==='run',mode==='ready'||mode==='halt',mode==='ipl',whir>3,printing,mode==='check'].forEach((v,j)=>lit(ST[j],v));
chkHalo.style.opacity=mode==='check'?f2(red?.45:.32+.26*Math.sin(now/170)):0;
lit(KB.start,mode==='run');lit(KB.load,mode==='ipl');lit(KB.stop,mode==='halt');lit(KB.test,mode==='check');
lit(rRdy,hop>0&&mode!=='check');lit(rFeed,!!card);lit(rChk,mode==='check');lit(pRdy,mode!=='check');lit(pPrt,printing);lit(pFrm,printing&&lines%22<2);lit(pChk,mode==='check');lit(pStart,printing);
TG.forEach((t,i)=>{const to=(sr>>(7-i))&1?1:-1;if(t.o===to)return;t.o=red||t.o<-1.5||Math.abs(to-t.o)<.002?to:t.o+(to-t.o)*clamp(dt*24);const a=P(t.x,40.3,49),b=P(t.x,40.3+3.6*Math.cos(.95*t.o),49+3.2*Math.sin(.95*t.o)),d=`M${f2(a[0])},${f2(a[1])}L${f2(b[0])},${f2(b[1])}`;set(t.u,'d',d);set(t.l,'d',d);set(t.tip,'cx',f2(b[0]));set(t.tip,'cy',f2(b[1]));});
if(lastUI<0||now-lastUI>150){lastUI=now;cnt.textContent=String(readN).padStart(4,'0');
readout.textContent=`SR ${sr.toString(8).padStart(3,'0')} · CARDS ${String(readN).padStart(2,'0')}/${String(total).padStart(2,'0')} · LINES ${String(lines).padStart(3,'0')}`;
const busyT=TAPES.find(t=>Math.abs(t.v)>2);
stateLabel.textContent=now<msgT?msg:mode==='check'?'MACHINE CHECK · PARITY · R TO RESET':mode==='ipl'?`LOADING · CARD ${String(Math.min(total,readN+1)).padStart(2,'0')}/${total}`:printing?`PRINTING · LINE ${String(lines).padStart(3,'0')}`:mode==='run'?(busyT?`RUNNING · TAPE ${busyT.k} ${busyT.v>0?'READ':'WRITE'}`:'RUNNING · COMPUTING'):mode==='halt'?'HALTED · SPACE TO RUN':TAPES.some(t=>t.rew)?'RESET · TAPES REWINDING':loaded?'READY · SPACE TO RUN':hop?'DECK IN HOPPER · L TO LOAD':'READY · L TO LOAD CARDS';}
requestAnimationFrame(tick);}
deck(hopS,44,90.3,54,0);deck(stkG,8.5,90.3,48.6,0);for(let i=0;i<9;i++)printLine();lines=0;job=1;pOff=pT;sync();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['l', ' ', 'p', 'f', 'r'], draw }
