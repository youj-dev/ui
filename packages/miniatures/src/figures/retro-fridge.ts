// @ts-nocheck
/* ARCTELLA 9 · Refrigerator. Ported from an HTML prototype: its stylesheet, defs and script,
 * verbatim but for the page chrome and the engine prelude (the kit now). The script runs on the env, which
 * stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--en:#efeee8;--en-top:#fbfbf8;--en-side:#d5d4cc;--chrome:#d9dcdd;--chrome-top:#f1f2f2;--chrome-side:#babdbe;--liner:#f2f1ea;--liner-top:#faf9f4;--liner-side:#dedcd2;--ice:#dcecf4;--ice-top:#eef6fa;--ice-side:#c8dce6;--kick:#4a4a48;--lamp:#fff0c4;--run:#ffa52e;--gauge:#f3f6f7;--paper:#fff8dc;--bin:#bfe3ec;--off:#b9b9b5;}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--en:#c9c9c5;--en-top:#ebebe8;--en-side:#969593;--chrome:#b7b9ba;--chrome-top:#e1e2e2;--chrome-side:#848585;--liner:#cccbc7;--liner-top:#eae9e4;--liner-side:#9c9b98;--ice:#b9c7ce;--ice-top:#dfe6ea;--ice-side:#8d9ba3;--kick:#3d3d3c;--lamp:#ffe2a0;--run:#ffa52e;--gauge:#cdcfd0;--paper:#d7d1b9;--bin:#a1bfc7;--off:#9b9b99;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.base{fill:var(--base)}.recess{fill:var(--recess)}.glass{fill:var(--glass)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:3.2px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.label{fill:var(--ink);font:4px ui-monospace,monospace;letter-spacing:.6px;stroke:none}.brand{font-size:5px;letter-spacing:1.4px;font-weight:600}.micro{font-size:2.6px;letter-spacing:.2px}.center{text-anchor:middle}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.en{fill:var(--en)}.top.en{fill:var(--en-top)}.side.en{fill:var(--en-side)}.chrome{fill:var(--chrome)}.top.chrome{fill:var(--chrome-top)}.side.chrome{fill:var(--chrome-side)}.liner{fill:var(--liner)}.top.liner{fill:var(--liner-top)}.side.liner{fill:var(--liner-side)}.ice{fill:var(--ice)}.top.ice{fill:var(--ice-top)}.side.ice{fill:var(--ice-side)}.kick{fill:var(--kick)}.gauge{fill:var(--gauge)}.paper{fill:var(--paper)}.bin{fill:var(--bin);fill-opacity:.55}
.wire{fill:none;stroke:var(--chrome-side);stroke-width:.55;vector-effect:non-scaling-stroke}.dark-ink{fill:#2b2b2b}.script{font:italic 700 6px Georgia,serif;letter-spacing:.4px;fill:#2b2b2b}.hand{font:700 3.4px 'Bradley Hand','Segoe Print','Comic Sans MS',cursive;fill:#2c3e8f}
.lampg{fill:var(--lamp);opacity:0;filter:url(#bloom);pointer-events:none}.bulb{fill:var(--lamp)}.pool{opacity:0;pointer-events:none}.frost{fill:#fff;stroke:none}.drop{fill:#7fc4ea;stroke:none}
.jewel{fill:#7a5530}.run .jewel{fill:var(--run);filter:url(#glow)}.jh{fill:var(--run);opacity:0;filter:url(#bloom)}.run .jh{opacity:.55}.needle{stroke:#d2361c;stroke-width:.7;stroke-linecap:round}.gh{fill:#7fc4ea;opacity:.28;filter:url(#bloom)}
.blade{fill:var(--top);stroke:var(--line);stroke-width:.5;vector-effect:non-scaling-stroke}.blur{fill:var(--line);opacity:0;stroke:none}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}.control:hover .grip{fill:var(--chrome-top)}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<radialGradient id="poolG"><stop offset="0" style="stop-color:var(--lamp);stop-opacity:1"/><stop offset="1" style="stop-color:var(--lamp);stop-opacity:0"/></radialGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* ARCTELLA 9 refrigerator. World: x lower-right; y lower-left; z up. 1 unit ≈ 7 mm.
Part x y z w d h
toe kick + grille 4 8 0 102 84 16
cabinet (side profile, crown R22 front + back) 0 0 16 110 96 214 (top z 230)
condenser vent + fan (side) 110 18 26 0 40 40
fresh-food opening / liner / floor 6 8 20 98 88 122
crisper drawers (2) 8/57 44 20 45 46 22
wire shelves (3) 6 10 54/86/116 98 82 1
shelf items (milk, pie, jello, eggs, sodas, carton) 10–96 50–84 54–136
interior lamp 55 22 140 r3 – –
freezer opening / liner / evaporator 6 8 166 98 88 38
ice trays, ice-cream carton 10–84 26–74 167 – – 14
control band (frost gauge, RUN jewel, cold dial) 3 96 146 104 3 16
main door (hinge x 3 y 101, opens to 105°) 3 96 18 104 5 126
door bins (3) + bottles + egg rack, inner side 8–96 89–84 30–140 88 7 8
freezer door (same hinge) 3 96 164 104 5 42
latch handles (chrome) 95 101–104 40–74 / 172–196 6 3 –
magnet note on the main door 12 101 112 22 0 26
floor light pool 0 100 0 130 90 0
Seams, screws, print and labels share their parent face. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers.
const draw=root,defs=svg.querySelector('defs'),into=g=>root=g,f2=v=>(+v).toFixed(2);
const mixF=(a,k)=>`fill:color-mix(in srgb,var(--en-top) ${Math.round(k*100)}%,var(--${a}))`;
const pathPts=(pts)=>'M'+pts.map(p=>P(...p).map(f2).join(',')).join('L')+'Z';
function bottle(g,r,h,fill,cap){const prev=root,b=el('g',{},g);into(b);const c=cylinder(0,0,0,r,h*.62,'z','');c.g.firstChild.style.fill=fill;c.face.firstChild.style.fill=fill;cylinder(0,0,h*.62,r*.55,h*.3,'z','').g.childNodes.forEach(n=>n.firstChild?n.firstChild.style.fill=fill:n.style.fill=fill);const k=cylinder(0,0,h*.92,r*.6,h*.08,'z','');k.g.firstChild.style.fill=cap;k.face.firstChild.style.fill=cap;into(prev);return b;}
const tint=(g,fill)=>{g.querySelectorAll('.face').forEach(n=>n.style.fill=fill);return g;};
// Floor: shadow, light pool, toe kick.
const shp=P(55,48,0);el('ellipse',{cx:shp[0],cy:shp[1]+3,rx:104,ry:40,class:'shadow stage-floor'});el('ellipse',{cx:shp[0],cy:shp[1]+3,rx:104,ry:40,class:'stage-contact'});
const pool=el('ellipse',{cx:62,cy:44,rx:66,ry:44,fill:'url(#poolG)',class:'pool',transform:TOP(0,100,.2)});
box(4,8,0,102,84,16,2,'kick');const kg=group(FRONT(8,92,14));rect(kg,0,0,94,12,1.4,'face chrome');slits(kg,3,2,88,8,5,false);text(kg,47,7.4,'ARCTELLA','etch micro center');
// Cabinet: side profile with the rounded crown, faceted crown rolls, top, front.
const R=22,H=230,W=110,D=96;
const prof=group(SIDE(W,D,H));
el('path',{d:`M0,${R} A${R},${R} 0 0 1 ${R},0 H${D-R} A${R},${R} 0 0 1 ${D},${R} V${H-3} Q${D},${H} ${D-3},${H} H7 Q4,${H} 4,${H-3} V${H-16} H0 Z`,class:'face side en'},prof);
for(let i=0;i<4;i++){const v=40+i*44;line(prof,8,v,88,v,'detail').style.opacity=.25;}
rect(group(TOP(0,R,H)),0,0,W,D-2*R,0,'face top en');
for(let k=0;k<3;k++){const a0=k*15,a1=(k+1)*15,pt=(x,a)=>[x,R-R*Math.sin(a*Math.PI/180),H-R+R*Math.cos(a*Math.PI/180)];el('path',{d:pathPts([pt(0,a0),pt(W,a0),pt(W,a1),pt(0,a1)]),class:'face',style:mixF('en-side',1-k*.22)+';stroke:none'});}
for(let k=0;k<6;k++){const a0=k*15,a1=(k+1)*15,pt=(x,a)=>[x,D-R+R*Math.sin(a*Math.PI/180),H-R+R*Math.cos(a*Math.PI/180)];el('path',{d:pathPts([pt(0,a0),pt(W,a0),pt(W,a1),pt(0,a1)]),class:'face',style:mixF('en',1-k/6)+';stroke:none'});}
const arc=(x,y0,s)=>{const p=[];for(let a=0;a<=90;a+=10)p.push([x,y0+s*R*Math.sin(a*Math.PI/180),H-R+R*Math.cos(a*Math.PI/180)]);return p;};
wire(arc(0,D-R,1),'detail');wire([[0,D-R,H],[W,D-R,H]],'detail').style.opacity=.35;wire([[0,R,H],[W,R,H]],'detail').style.opacity=.35;{const p=[];for(let a=0;a<=45;a+=9)p.push([0,R-R*Math.sin(a*Math.PI/180),H-R+R*Math.cos(a*Math.PI/180)]);wire(p);}wire([[0,D,H-R],[0,D,16]]);wire([[0,R-R*Math.SQRT1_2,H-R+R*Math.SQRT1_2],[W,R-R*Math.SQRT1_2,H-R+R*Math.SQRT1_2]],'detail');
const ff=group(FRONT(0,D,H-R));rect(ff,0,0,W,H-R-16,2,'face en');
const lidT=group(TOP(0,R,H));text(lidT,55,30,'ARCTELLA','etch center');
// Side: condenser vent with fan, rating plate.
const sd=group(SIDE(W,D,H));
circle(sd,58,184,17,'face recess');const fanG=group('translate(58 184)',sd),blades=group('',fanG);
for(let i=0;i<5;i++)el('path',{d:'M0,-2.4 Q7,-6 5,-14.6 Q-.8,-15 -1.6,-2.6Z',class:'blade',transform:`rotate(${i*72})`},blades);
const fblur=circle(fanG,0,0,14.6,'blur');for(const r of[16,11.5,7])circle(fanG,0,0,r,'detail');for(const a of[0,60,120]){const t=a*Math.PI/180;line(fanG,Math.cos(t)*16,Math.sin(t)*16,-Math.cos(t)*16,-Math.sin(t)*16);}circle(fanG,0,0,2.6,'face base');
for(const[u,v]of[[40,166],[76,166],[40,202],[76,202]])screw(sd,u,v);
rect(sd,16,206,26,9,1,'face paper');text(sd,29,210,'115 V · 60 ~','etch micro center');text(sd,29,213.4,'MODEL 9 · R-12','etch micro center');
// Interiors, clipped to the door openings.
const openC=(id,z0,z1)=>{const c=el('clipPath',{id},defs);el('polygon',{points:[[6,D,z1],[104,D,z1],[104,D,z0],[6,D,z0]].map(p=>P(...p).join(',')).join(' ')},c);return el('g',{'clip-path':`url(#${id})`},draw);};
const FF=into(openC('ffc',20,142));
rect(group(FRONT(6,8,142)),0,0,98,122,0,'face liner');rect(group(SIDE(6,96,142)),0,0,88,122,0,'face side liner');rect(group(TOP(6,8,20)),0,0,98,88,0,'face top liner');
const lampG=el('g',{});const lw=group(SIDE(6.2,96,142));rect(lw,10,15,9,8,2,'face chrome');circle(lw,14.5,19,2.6,'face bulb');const lb=P(6.2,81.5,123);el('circle',{cx:lb[0],cy:lb[1],r:14,class:'lampg'},lampG);
for(const[x,c]of[[8,'#7cbf5a'],[57,'#e2483a']]){box(x,44,20,45,46,22,2,'liner');const fr=group(FRONT(x,90,40));rect(fr,3,3,39,13,2,'face glass');for(let i=0;i<5;i++){const cc=circle(fr,8+i*7.4,12-(i%2)*2,3.6,'face');cc.style.fill=i%2?c:(x<20?'#a9d86e':'#f07a3a');}rect(fr,15,-.6,15,3,1.2,'face chrome');}
function shelf(z){const g=group(TOP(6,10,z));for(let u=4;u<98;u+=6)line(g,u,0,u,82,'wire');rect(g,0,0,98,82,1,'wire');box(6,88,z-1.2,98,2,1.6,.6,'chrome');}
shelf(54);
for(const[x,c]of[[14,'#3f8f53'],[21,'#3f8f53'],[28,'#a33b2c']]){const b=bottle(FF,2.8,18,c,'#d9d9d6');set(b,'transform',`translate(${P(x,76,54.4).map(f2).join(' ')})`);}
tint(box(46,58,54.4,26,20,8,2,''),'#f4f4ef');tint(box(47,59,62.4,24,18,1.6,1.6,''),'#c9562f');box(80,64,54.4,12,12,18,1.2,'');{const g=group(FRONT(80,76,72.4));rect(g,0,0,12,18,1.2,'face').style.fill='#f29a2e';text(g,6,8,'O.J.','label micro center');}
shelf(86);
{const j=cylinder(28,62,86.4,9,10,'z','');j.g.querySelectorAll('.face').forEach(n=>{n.style.fill='#4ccf72';n.style.fillOpacity=.85;});circle(j.face,0,0,4,'detail');}
tint(box(50,60,86.4,30,18,2,1,''),'#d8d4c8');for(let i=0;i<6;i++){const p=P(54+(i%3)*9,64+(i>2?8:0),89.6);el('ellipse',{cx:f2(p[0]),cy:f2(p[1]),rx:3,ry:2.3,class:'face',style:'fill:#f6efe0'});}
{const b=bottle(FF,3,16,'#c7362a','#f1f1ec');set(b,'transform',`translate(${P(90,76,86.4).map(f2).join(' ')})`);}
shelf(116);
for(const[x,y]of[[18,64],[29,72]]){const b=bottle(FF,4,20,'#f6f6f2','#c9a646');set(b,'transform',`translate(${P(x,y,116.4).map(f2).join(' ')})`);}
tint(box(42,64,116.4,18,12,6,1.6,''),'#f3d36b');{const p=cylinder(78,62,116.4,11,4,'z','');tint(p.g,'#d9a35b');circle(p.face,0,0,8,'detail');el('path',{d:'M0,0 L11,0 A11,11 0 0 1 7.8,7.8Z',class:'face',style:'fill:#b8432f'},p.face);}
FF.appendChild(lampG);
into(draw);
const glowF=el('g',{});const gp=P(55,D,82);el('ellipse',{cx:gp[0],cy:gp[1],rx:58,ry:64,class:'lampg'},glowF);
const FZ=into(openC('fzc',166,204));
rect(group(FRONT(6,8,204)),0,0,98,38,0,'face ice');rect(group(SIDE(6,96,204)),0,0,88,38,0,'face side ice');rect(group(TOP(6,8,166)),0,0,98,88,0,'face top ice');
for(const x of[12,40]){box(x,62,166.4,24,30,4,1,'chrome');const t=group(TOP(x,62,170.4));for(let i=1;i<4;i++)line(t,1,i*7.5,23,i*7.5);line(t,12,1,12,29);for(let i=0;i<4;i++)for(const u of[3,15])rect(t,u,1.4+i*7.5,6,5,1,'face ice');}
{const b=box(72,68,166.4,18,16,16,1.4,'');tint(b,'#f5f1e8');const g=group(FRONT(72,84,182.4));for(const[v,c]of[[2,'#e88ba6'],[6.6,'#f5f1e8'],[11.2,'#7a4a33']])rect(g,0,v,18,3.8,0,'face').style.fill=c;text(g,9,6.4,'ICE CREAM','label micro center');}
const frostW=[group(SIDE(6.2,96,204))].map(g=>{const f=el('g',{class:'frost'},g);for(let k=0;k<12;k++)el('ellipse',{cx:2+(k*9.3)%40,cy:(k*7)%11+(k%2?24:3),rx:5+(k%3)*2.4,ry:2.2+(k%2)*1.4},f);return f;});
const ice=group(FRONT(6,95.6,204)),icicles=[];for(let k=0;k<17;k++){const u=3+k*5.6+(k%3),L=3+(k*7%5)*1.4;icicles.push({n:el('path',{d:`M${f2(u-2.2)},0 L${f2(u+2.2)},0 L${f2(u)},${f2(L)}Z`,class:'frost',opacity:0},ice),L});}
const frostL=rect(ice,0,0,98,2.2,0,'frost');
const drops=[0,1,2,3,4].map(i=>({n:el('circle',{r:.9,class:'drop',opacity:0}),x:14+i*19,z:200,t:Math.random()}));
into(draw);
// Control band: frost gauge, RUN jewel, cold dial.
box(3,D,146,104,3,16,3,'chrome');const cb=group(FRONT(3,D+3,162));
rect(cb,3,2,30,12,2.4,'face recess');rect(cb,4,3,28,10,2,'face gauge');circle(cb,18,13.4,9,'gh');
for(let i=0;i<=8;i++){const a=(-70+i*17.5)*Math.PI/180;line(cb,18+Math.sin(a)*7.2,12.4-Math.cos(a)*7.2,18+Math.sin(a)*8.4,12.4-Math.cos(a)*8.4,i>6?'detail red':'detail');}
el('path',{d:`M${18+Math.sin(52*Math.PI/180)*8.4},${12.4-Math.cos(52*Math.PI/180)*8.4} A8.4,8.4 0 0 1 ${18+Math.sin(70*Math.PI/180)*8.4},${12.4-Math.cos(70*Math.PI/180)*8.4}`,stroke:'#d2361c','stroke-width':1.2,fill:'none'},cb);
text(cb,8,12.6,'0','etch micro');text(cb,28,12.6,'MAX','etch micro');text(cb,18,9.4,'FROST','etch micro center');
const needle=group('',cb);line(needle,0,0,0,-7.6,'needle');set(needle,'transform','translate(18 12.4) rotate(-70)');circle(cb,18,12.4,1,'face chrome');
const gHit=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Frost gauge: defrost the freezer (T)'},cb);rect(gHit,2,1,32,14,3,'focus-ring');rect(gHit,2,1,32,14,0,'hit');
const jw=el('g',{},cb);circle(jw,44,8,4,'jh');circle(jw,44,8,2.4,'face chrome');circle(jw,44,8,1.6,'jewel');text(cb,44,14.2,'RUN','etch micro center');
text(cb,64,10.2,'ARCTELLA','label brand center');
for(let i=1;i<=5;i++){const a=(-120+(i-1)*60)*Math.PI/180;text(cb,91+Math.sin(a)*7.2,8.9-Math.cos(a)*7.2,String(i),'label micro center');}
const dialG=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Cold control: colder (C)'});into(dialG);
const dk=cylinder(94,D+3,154,4.6,3,'y','chrome');const dRot=group('',dk.face);rect(dRot,-1,-4.2,2,8.4,1,'face chrome top');circle(dk.face,0,0,6.4,'focus-ring');into(draw);
// Doors: hinged on the left; drawn as planes rotated about the hinge.
const HX=3,HY=101,T=5;
function dp(a,u,n,z){const c=Math.cos(a),s=Math.sin(a);return[HX+u*c-n*s,HY+u*s+n*c,z];}
function plane(a,n,z){const c=Math.cos(a),s=Math.sin(a),o=P(HX-n*s,HY+n*c,z);return`matrix(${f2((c-s)*C)} ${f2((c+s)*S)} 0 1 ${f2(o[0])} ${f2(o[1])})`;}
function door(zb,zt,name,opts){
const g=el('g',{}),h=zt-zb,Wd=104;
const edge=el('path',{class:'face side en'},g),topE=el('path',{class:'face top en'},g);
const inner=el('g',{},g),ip=el('g',{},inner);rect(ip,0,0,Wd,h,5,'face liner');rect(ip,3,3,Wd-6,h-6,4,'detail');rect(ip,1.4,1.4,Wd-2.8,h-2.8,4.6,'wire');
const outer=el('g',{},g);rect(outer,0,0,Wd,h,6,'face en');rect(outer,4,4,Wd-8,h-8,4,'detail');
const grip=el('g',{class:'control',role:'button',tabindex:'0','aria-label':name,'aria-expanded':'false'},g),posts=[0,1].map(()=>el('path',{class:'face chrome',style:'stroke-width:1'},g));
const d={g,zb,zt,h,Wd,edge,topE,inner,ip,outer,grip,posts,a:0,v:0,to:0,last:-1,bins:[],items:[],extra:opts};
return d;}
const MD=door(18,144,'Fresh-food door: open or close (D)'),FD=door(164,206,'Freezer door: open or close (F)');
for(const d of[MD,FD]){const hz=d===MD?[34,74]:[8,34];rect(d.outer,92.6,hz[0]-3,9,hz[1]-hz[0]+6,3,'face chrome');rect(d.outer,94.4,hz[0]-1,5.4,hz[1]-hz[0]+2,2,'detail');d.hz=hz;
const gr=el('g',{},d.grip);rect(gr,95,hz[0],4,hz[1]-hz[0],2,'face chrome grip');line(gr,96.2,hz[0]+3,96.2,hz[1]-3,'detail').style.opacity=.6;rect(gr,93,hz[0]-4,8,hz[1]-hz[0]+8,3,'focus-ring');rect(gr,90,hz[0]-6,14,hz[1]-hz[0]+12,0,'hit');}
rect(MD.outer,32,9,40,9,2,'face chrome');rect(MD.outer,8,104,78,2.2,1.1,'face chrome');rect(MD.outer,8,108,78,1,.5,'face chrome');text(MD.outer,52,15.6,'Arctella','script center');
rect(FD.outer,34,15,36,7,1.6,'face chrome');text(FD.outer,52,19.8,'FROZEN FOOD','label micro center dark-ink');
const noteG=el('g',{},MD.outer),NOTES=[['BUY MILK','& EGGS','— June'],['PIE FOR','SUNDAY','6 PM ♥'],['DEFROST','FRIDAY!',''],['CALL MOM','KL5-0172','']];
const noteR=el('g',{},noteG);rect(noteR,-11,-1,22,26,.6,'face paper');for(let i=0;i<4;i++)line(noteR,-9,6.4+i*5,9,6.4+i*5,'wire');const nt=[0,1,2].map(i=>text(noteR,0,7.6+i*5.6,'','hand center'));
circle(noteG,0,0,3.4,'face').style.fill='#e2483a';el('path',{d:'M-1.6,-3.2 Q0,-5.6 2.2,-4',class:'detail',style:'stroke:#3f8f53;stroke-width:1.4'},noteG);circle(noteG,-1.2,-1.2,.8,'face').style.fill='#ff9d8f';
const noteHit=el('g',{class:'control',role:'button',tabindex:'0','aria-label':'Note on the door: show the next note (N)'},noteG);rect(noteHit,-12,-4,24,30,1,'focus-ring');rect(noteHit,-12,-4,24,30,0,'hit');
set(noteG,'transform','translate(24 30)');
// Inner side of the fresh-food door: three bins with bottles and an egg rack.
for(const[zb,items]of[[30,[['#3f8f53',3,15],['#f29a2e',3.2,14],['#3f8f53',3,15],['#e8e2c8',3.4,12]]],[66,[['#c7362a',2.8,13],['#f3c63a',2.6,12],['#f6f6f2',3.6,16]]],[102,[['#8a5a2b',2.6,12],['#4c8fd1',3,14],['#f6f6f2',3.6,16]]]]){
const its=items.map(([c,r,h],i)=>({n:bottle(MD.inner,r,h,c,'#d9d9d6'),u:16+i*(76/(items.length-1||1))*(items.length>3?.95:1),zb}));MD.items.push(...its);
MD.bins.push({zb,lip:el('path',{class:'face bin'},MD.inner),rail:el('path',{class:'detail'},MD.inner)});}
MD.eggs=[0,1,2,3,4,5].map(i=>({n:el('ellipse',{rx:2.4,ry:3,class:'face',style:'fill:#f6efe0'},MD.inner),u:14+i*12}));MD.bins.push({zb:132,lip:el('path',{class:'face bin'},MD.inner),rail:el('path',{class:'detail'},MD.inner)});
FD.bins.push({zb:172,lip:el('path',{class:'face bin'},FD.inner),rail:el('path',{class:'detail'},FD.inner)});
FD.items=[['#e8f3f8',3.4,10],['#e88ba6',3.4,10],['#f5f1e8',3.4,10]].map(([c,r,h],i)=>({n:bottle(FD.inner,r,h,c,'#c9c9c4'),u:22+i*26,zb:172}));
function placeDoor(d){
const a=d.a*Math.PI/180;if(Math.abs(d.a-d.last)<.01)return;d.last=d.a;
const q=(u,n,z)=>dp(a,u,n,z);
set(d.edge,'d',pathPts([q(d.Wd,-T,d.zt),q(d.Wd,0,d.zt),q(d.Wd,0,d.zb),q(d.Wd,-T,d.zb)]));
set(d.topE,'d',pathPts([q(0,-T,d.zt),q(d.Wd,-T,d.zt),q(d.Wd,0,d.zt),q(0,0,d.zt)]));
set(d.outer,'transform',plane(a,0,d.zt));set(d.ip,'transform',plane(a,-T,d.zt));
set(d.grip,'transform',plane(a,3.4,d.zt));
d.posts.forEach((p,i)=>{const z=d.zt-d.hz[i]-(i?-2:2);set(p,'d',pathPts([q(96,0,z+1.4),q(98,0,z+1.4),q(98,3.4,z+1.4),q(96,3.4,z+1.4)]));});
const back=d.a>45;if(d.back!==back){d.back=back;(back?[d.outer,d.grip,...d.posts,d.edge,d.topE,d.inner]:[d.inner,d.edge,d.topE,d.outer,...d.posts,d.grip]).forEach(n=>d.g.appendChild(n));}
d.inner.style.display=d.a>30?'':'none';
d.items.forEach(it=>set(it.n,'transform',`translate(${P(...q(it.u,-T-3.5,it.zb+.6)).map(f2).join(' ')})`));
d.bins.forEach(b=>{const hgt=b.zb===132?3:7;set(b.lip,'d',pathPts([q(8,-T-7,b.zb+hgt),q(96,-T-7,b.zb+hgt),q(96,-T-7,b.zb),q(8,-T-7,b.zb)]));set(b.rail,'d',poly([q(8,-T-7,b.zb+hgt+2.4),q(96,-T-7,b.zb+hgt+2.4)]));});
if(d.eggs)d.eggs.forEach(e=>{const p=P(...q(e.u,-T-3.6,133.6));set(e.n,'cx',f2(p[0]));set(e.n,'cy',f2(p[1]));});
}
frame([[0,0,0,W,D+8,H]],14);
// State: doors, thermostat and compressor, frost and defrost, note, audio.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),darkMQ=matchMedia('(prefers-color-scheme: dark)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
const SET=[7,5,4,3,1.5];
let cold=3,Tf=4,Tz=-18,run=false,frost=.3,thaw=false,light=0,fan=0,fanA=0,ni=0,nTh=0,nV=0,lastT=0,lastUI=0,ac=null,hum=null,humG=null,msg='',msgT=0;
const keys={};document.querySelectorAll('.hint [data-k]').forEach(b=>keys[b.dataset.k]=b);
function say(m){announcement.textContent=m;}
function note(m){msg=m;msgT=performance.now()+1700;lastUI=0;}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();const o=ac.createOscillator(),o2=ac.createOscillator(),lp=ac.createBiquadFilter();o.type='sawtooth';o.frequency.value=58;o2.type='sine';o2.frequency.value=116;lp.type='lowpass';lp.frequency.value=240;humG=ac.createGain();humG.gain.value=0;o.connect(lp);o2.connect(lp);lp.connect(humG);humG.connect(ac.destination);o.start();o2.start();hum=o;}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function thud(f,d,v){if(!ac)return;const o=ac.createOscillator(),g=ac.createGain(),t=ac.currentTime;o.frequency.setValueAtTime(f,t);o.frequency.exponentialRampToValueAtTime(f*.5,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.02);}
function toggle(d){audio();msgT=0;const open=d.to===0;d.to=open?105:0;set(d.grip,'aria-expanded',open);set(keys[d===MD?'d':'f'],'aria-pressed',open);
if(open){thud(300,.12,.03);say(d===MD?'Fresh-food door open. Light on.':'Freezer door open.');}else{setTimeout(()=>thud(90,.25,.08),reduced.matches?0:260);say(d===MD?'Door closed.':'Freezer closed.');}lastUI=0;}
function colder(){audio();msgT=0;cold=cold%5+1;thud(1800,.03,.02);say(`Cold control ${cold}. Target ${SET[cold-1]} degrees.`);lastUI=0;}
function defrost(){audio();msgT=0;if(thaw){thaw=false;say('Defrost cancelled.');}else if(frost<.04){note('NO FROST TO MELT');say('No frost to melt.');return;}else{thaw=true;say('Defrosting. Compressor paused.');}thud(1200,.04,.02);lastUI=0;}
function nextNote(){audio();ni=(ni+1)%NOTES.length;NOTES[ni].forEach((s,i)=>nt[i].textContent=s);nV+=reduced.matches?0:140;if(ac){const b=ac.createBuffer(1,ac.sampleRate*.12|0,ac.sampleRate),x=b.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=(Math.random()*2-1)*(1-i/x.length);const s=ac.createBufferSource(),g=ac.createGain();g.gain.value=.03;s.buffer=b;s.connect(g);g.connect(ac.destination);s.start();}say(`Note: ${NOTES[ni].join(' ').toLowerCase()}.`);note(`NOTE · ${NOTES[ni][0]} ${NOTES[ni][1]}`);}
NOTES[0].forEach((s,i)=>nt[i].textContent=s);
function bind(g,fn){g.addEventListener('click',e=>{e.stopPropagation();fn();});g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
bind(MD.grip,()=>toggle(MD));bind(FD.grip,()=>toggle(FD));MD.outer.addEventListener('click',()=>toggle(MD));FD.outer.addEventListener('click',()=>toggle(FD));MD.edge.addEventListener('click',()=>toggle(MD));MD.inner.addEventListener('click',()=>toggle(MD));FD.inner.addEventListener('click',()=>toggle(FD));bind(dialG,colder);bind(gHit,defrost);bind(noteHit,nextNote);
const act={d:()=>toggle(MD),f:()=>toggle(FD),c:colder,t:defrost,n:nextNote};
Object.entries(keys).forEach(([k,b])=>b.addEventListener('click',()=>act[k]()));
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.repeat||e.defaultPrevented)return;const f=act[e.key.toLowerCase()];if(f){e.preventDefault();f();}});
function tick(now){
const dt=Math.min(.05,(now-(lastT||now))/1000),red=reduced.matches;lastT=now;
for(const d of[MD,FD]){const pa=d.a;if(red){d.a=d.to;d.v=0;}else{d.v+=(150*(d.to-d.a)-21*d.v)*dt;d.a+=d.v*dt;if(d.a<0){d.a=0;d.v=Math.abs(d.v)*.15;}}placeDoor(d);const vel=dt?(d.a-pa)/dt:0;d.acc=dt?(vel-(d.vel||0))/dt:0;d.vel=vel;}
const mo=MD.a>3,fo=FD.a>3,sp=SET[cold-1];
light+=((mo?1:0)-light)*(red?1:clamp(dt*14));
if(thaw){run=false;frost=Math.max(0,frost-dt*.12);if(frost<=0){thaw=false;say('Defrost complete.');lastUI=0;}}
else if(!run&&(Tf>sp+.6||Tz>-15)){run=true;thud(70,.35,.05);lastUI=0;}else if(run&&Tf<sp-.6&&Tz<-19){run=false;thud(50,.5,.04);lastUI=0;}
Tf+=dt*((mo?.9:0)+.04*(21-Tf)/17-(run?.42:0)+(thaw?.08:0));Tz+=dt*((fo?2.4:0)+.06*(21-Tz)/39-(run?.9:0)+(thaw?.6:0));
if(run&&!thaw)frost=Math.min(1,frost+dt*(.006+(fo?.05:0)+(mo?.01:0)));
fan+=((run?1:0)-fan)*clamp(dt*(run?1.6:.7));if(!red){fanA=(fanA+fan*1300*dt)%360;set(blades,'transform',`rotate(${f2(fanA)})`);}fblur.style.opacity=f2(clamp((fan-.5)*.7,0,.32));
svg.classList.toggle('run',run);
set(needle,'transform',`translate(18 12.4) rotate(${f2(-70+frost*140)})`);
set(frostL,'opacity',f2(frost*.95));frostW.forEach(f=>set(f,'opacity',f2(frost*.9)));icicles.forEach((c,i)=>{const k=clamp(frost*1.6-(i%4)*.18);set(c.n,'opacity',f2(k>0?.95:0));set(c.n,'transform',`scale(1 ${f2(.2+k*.8)})`);});
for(const dr of drops){if(thaw&&!red){dr.t+=dt*1.6;if(dr.t>1)dr.t=0;const p=P(dr.x,92,200-dr.t*30);set(dr.n,'cx',f2(p[0]));set(dr.n,'cy',f2(p[1]));set(dr.n,'opacity',f2(.9*(1-dr.t)));}else set(dr.n,'opacity',0);}
const L=light;glowF.style.opacity=f2(L*.3);lampG.firstChild.style.opacity=f2(L*.9);pool.style.opacity=f2(L*(darkMQ.matches?.34:.16));
const acc=clamp(MD.acc||0,-9000,9000);if(red){nTh=0;nV=0;}else{nV+=(-60*nTh-3.2*nV-acc*.012)*dt;nTh+=nV*dt;nTh=clamp(nTh,-40,40);}set(noteR,'transform',`rotate(${f2(-4+nTh)})`);
if(humG)humG.gain.setTargetAtTime(run?.012:0,ac.currentTime,.25);
if(!lastUI||now-lastUI>160){
readout.textContent=`${Tf.toFixed(1)}°C · FREEZER ${Math.round(Tz)<0?'−'+Math.abs(Math.round(Tz)):Math.round(Tz)}°C · COLD ${cold}`;
stateLabel.textContent=now<msgT?msg:[mo||fo?(mo&&fo?'BOTH DOORS OPEN':mo?'DOOR OPEN · LIGHT ON':'FREEZER OPEN'):'',thaw?'DEFROSTING':run?'COMPRESSOR RUNNING':'IDLE',`FROST ${Math.round(frost*100)}%`].filter(Boolean).join(' · ');
lastUI=now;}
requestAnimationFrame(tick);
}
placeDoor(MD);placeDoor(FD);requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: ['d', 'f', 'c', 't', 'n'], draw }
