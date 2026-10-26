// @ts-nocheck
/* PALLO P–8 · Handheld game console. Drawn for this kit on the shared engine, in the manner of the lab files: its
 * stylesheet, defs and script. The script runs on the env, which stands in for the page; its types are at the
 * boundary (FigureModule). The game on its screen, Pip Hop, was made for it. */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--recess:#9d9d99;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--shell:#6f8499;--shell-top:#91a5b8;--shell-side:#55697d;--plate:#ebe4d3;--dish:#dcd3bf;--hole:#45464a;--slot:#1d1e20;--bezel:#2e3035;--bz:#9a9da5;--well:#141516;--pad:#3c3e43;--pad-top:#50535a;--pad-side:#2a2b2f;--mark:#757880;--ka:#d9573b;--ka-top:#ec7254;--ka-side:#ad432c;--kb:#e0a038;--kb-top:#f1bb59;--kb-side:#b47f26;--pill:#8c8e93;--pill-top:#a5a7ac;--pill-side:#6c6e72;--cart:#c9c8c3;--cart-top:#dedcd7;--cart-side:#a7a6a1;--sticker:#e8674c;--sticker-ink:#fff6ea;--stand:#b6b6b3;--stand-top:#cbcbc7;--stand-side:#a4a4a1;--lcd0:#2b1808;--lcd1:#6f3d11;--lcd2:#c8721d;--lcd3:#ffb94d;--gap:#1d0f05;--led:#ffb347;--glow:#ff9f30;--halo:.26}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--recess:#6e6e6c;--line:#444443;--shell:#5c6e80;--shell-top:#879aac;--shell-side:#3a4857;--plate:#c6c0b2;--dish:#b9b2a1;--hole:#2f3033;--slot:#121314;--bezel:#26272b;--bz:#8a8d94;--well:#0e0f10;--pad:#313336;--pad-top:#4a4d54;--pad-side:#1b1b1d;--mark:#686b72;--ka:#b74830;--ka-top:#dd6a4e;--ka-side:#792d1c;--kb:#bd862e;--kb-top:#e1af53;--kb-side:#7e5818;--pill:#76777a;--pill-top:#9a9ca1;--pill-side:#4b4c4d;--cart:#a9a8a5;--cart-top:#d0cec9;--cart-side:#757472;--sticker:#c3563f;--sticker-ink:#f4ebdf;--stand:#999997;--stand-top:#bebeba;--stand-side:#737372;--halo:.5}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.etch{fill:var(--muted);font:600 3.1px ui-monospace,monospace;letter-spacing:.45px;stroke:none}.micro{font-size:2.3px;letter-spacing:.35px}.center{text-anchor:middle}.end{text-anchor:end}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.shell{fill:var(--shell)}.top.shell{fill:var(--shell-top)}.side.shell{fill:var(--shell-side)}.plate{fill:var(--plate)}.dish{fill:var(--dish)}.hole{fill:var(--hole)}.slot{fill:var(--slot)}.bezel{fill:var(--bezel)}.well{fill:var(--well)}
.bz{fill:var(--bz);font:600 2.3px ui-monospace,monospace;letter-spacing:.5px;stroke:none}.brand{fill:var(--bz);font:italic 600 4.4px Georgia,'Times New Roman',serif;letter-spacing:.7px;stroke:none}
.pad{fill:var(--pad)}.top.pad{fill:var(--pad-top)}.side.pad{fill:var(--pad-side)}.mark{fill:var(--mark);stroke:none}.dimple{fill:none;stroke:var(--pad-side);stroke-width:.55}
.ka{fill:var(--ka)}.top.ka{fill:var(--ka-top)}.side.ka{fill:var(--ka-side)}.kb{fill:var(--kb)}.top.kb{fill:var(--kb-top)}.side.kb{fill:var(--kb-side)}.pill{fill:var(--pill)}.top.pill{fill:var(--pill-top)}.side.pill{fill:var(--pill-side)}
.cart{fill:var(--cart)}.top.cart{fill:var(--cart-top)}.side.cart{fill:var(--cart-side)}.sticker{fill:var(--sticker);stroke:none}.st{fill:var(--sticker-ink);font:700 3px ui-monospace,monospace;letter-spacing:.5px;stroke:none}.sp{fill:var(--sticker-ink);stroke:none}.rib{fill:none;stroke:var(--cart-side);stroke-width:.6;stroke-linecap:round}
.stand{fill:var(--stand)}.top.stand{fill:var(--stand-top)}.side.stand{fill:var(--stand-side)}
.l0{fill:var(--lcd0)}.l1{fill:var(--lcd1)}.l2{fill:var(--lcd2)}.l3{fill:var(--lcd3)}.lgrid{fill:url(#px);pointer-events:none}.gap{fill:var(--gap)}
.halo{fill:var(--glow);opacity:var(--halo);filter:url(#bloom);pointer-events:none}.led{fill:var(--led);filter:url(#glow)}.ledh{fill:var(--led);opacity:.4;filter:url(#bloom)}
.unlit{--lcd0:#c3b48f;--lcd1:#a59467;--lcd2:#6e5f3f;--lcd3:#2c2414;--gap:#b2a37d}.unlit .halo{opacity:0}
.glare{fill:#fff;opacity:.07;pointer-events:none}.hi{fill:none;stroke:#fff;stroke-width:.6;stroke-linecap:round;opacity:.5;pointer-events:none}.ring{fill:none;stroke:var(--line);stroke-width:.4;opacity:.45}.grille{fill:var(--hole);stroke:none}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<pattern id="px" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M.84,0H1V1H0V.84H.84Z" class="gap"/></pattern>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,addEventListener,kit}=env;
/* PALLO P–8 handheld game console on its stand. World: x lower-right; y lower-left (front faces +y); z up. 1 unit ≈ 0.9 mm.
The console leans back 35° from upright. On it, u runs across (+x), v down its face from the top edge and w out of it,
from O, the face's top left corner; a lift of w moves a face point by (EU·w, EV·w), so the whole console is drawn in face
coordinates: its silhouette as paths through Q, the parts on its face in one plane group.
Part                     u / x        v / y        w / z        w     h
stand base               38–112      −24–0          0–3         74    24   the console's bottom edge rests on it
stand lip                38–112        0–5.5        0–15        74   5.5   chamfered, in front of the face's bottom edge
body (two-tone shell)     0–150        0–88       −18–0        150    88   r 13: a slate shell, the cream face plate inset 2.6
screen bezel             42–108        6–64          0          66    58   the LCD, 40 × 36 px at 1.2, from (51, 9.5); LED, wordmark
d-pad                    c 21 · 40, span 26.8, arms 9.4, 3.1 proud; it rocks 1.5 toward the arm pressed
B, A                     c 120 · 42.5 and 137.5 · 32.5, r 6.1, 2.6 proud (0.7 pressed)
select, start            c 63 · 73.8 and 87 · 73.8: pills 12.4 × 4.4, 1.5 proud
speaker grille           c 130 · 68.5: rings of holes to r 7.2
cartridge                52.5–97.5   −12–32      −13.5–−5       45    44   out of the slot in the top edge; ejects 18 further
Print, lamps and labels share their parent face. */
const svg=document.getElementById('machine'),root=document.getElementById('drawing');
const{P,set,el,group,rect,circle,line,text}=kit(()=>root);
const f2=v=>(+v).toFixed(2),f4=v=>(+v).toFixed(4),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),RAD=Math.PI/180,ease=t=>(t=clamp(t),t*t*(3-2*t));
// The console's frame: its face plane, the lift along its normal, and face coordinates to the drawing.
const LEAN=35*RAD,SL=Math.sin(LEAN),CL=Math.cos(LEAN),W=150,H=88,T=18,R=13,ZB=3+T*SL;
const add=(a,b,k=1)=>[a[0]+b[0]*k,a[1]+b[1]*k,a[2]+b[2]*k],U=[1,0,0],V=[0,SL,-CL],N=[0,CL,SL],O=add([0,0,ZB],V,-H);
const pO=P(...O),pu=P(...U),pv=P(...V),pn=P(...N),det=pu[0]*pv[1]-pv[0]*pu[1];
const EU=(pn[0]*pv[1]-pv[0]*pn[1])/det,EV=(pu[0]*pn[1]-pn[0]*pu[1])/det,lift=(p,w)=>[p[0]+EU*w,p[1]+EV*w];
const Q=p=>[pO[0]+p[0]*pu[0]+p[1]*pv[0],pO[1]+p[0]*pu[1]+p[1]*pv[1]],qp=(u,v,w=0)=>Q(lift([u,v],w));
const FACE=`matrix(${[...pu,...pv,...pO].map(f4).join(' ')})`;
const dp=(pts,map)=>'M'+pts.map(p=>(map?map(p):p).map(f2).join(',')).join('L')+'Z';
// Outlines in face coordinates (clockwise), the side bands a raised outline shows, rounded corners.
function rrp(x,y,w,h,r,n=10){const p=[];for(const[cx,cy,a0]of[[x+w-r,y+r,-90],[x+w-r,y+h-r,0],[x+r,y+h-r,90],[x+r,y+r,180]])for(let i=0;i<=n;i++){const a=(a0+90*i/n)*RAD;p.push([cx+r*Math.cos(a),cy+r*Math.sin(a)]);}return p;}
function rpts(poly,rad,n=4){const m=poly.length,out=[];for(let i=0;i<m;i++){const a=poly[(i+m-1)%m],b=poly[i],c=poly[(i+1)%m],r=rad[i],la=Math.hypot(a[0]-b[0],a[1]-b[1]),lc=Math.hypot(c[0]-b[0],c[1]-b[1]),s=Math.min(r,la/2)/la,t=Math.min(r,lc/2)/lc,p0=[b[0]+(a[0]-b[0])*s,b[1]+(a[1]-b[1])*s],p2=[b[0]+(c[0]-b[0])*t,b[1]+(c[1]-b[1])*t];
for(let k=0;k<=n;k++){const q=k/n,o=1-q;out.push([o*o*p0[0]+2*o*q*b[0]+q*q*p2[0],o*o*p0[1]+2*o*q*b[1]+q*q*p2[1]]);}}return out;}
// The visible runs of an outline's sides (an edge faces the viewer when its outward normal runs against the lift), split by shade.
function runs(pts,shade){const n=pts.length,nrm=pts.map((a,i)=>{const b=pts[(i+1)%n],nu=b[1]-a[1],nv=a[0]-b[0],l=Math.hypot(nu,nv)||1;return[nu/l,nv/l];});
const vis=nrm.map(([nu,nv])=>nu*EU+nv*EV<-1e-6),cl=nrm.map(n=>shade?shade(n):''),out=[];
for(let i=0;i<n;i++){const h=(i+n-1)%n;if(!vis[i]||(vis[h]&&cl[h]===cl[i]))continue;const ch=[pts[i]];let j=i;do{j=(j+1)%n;ch.push(pts[j]);}while(vis[j]&&cl[j]===cl[i]&&j!==i);out.push({ch,c:cl[i]});}
return out;}
const band=(ch,lo,hi)=>[...ch.map(p=>lift(p,lo(p))),...ch.slice().reverse().map(p=>lift(p,hi(p)))];
const at=k=>()=>k;
// A prism along x through a profile in (y, z), counterclockwise: the faces that face the viewer, then its end at x1.
function prism(pr,x0,x1,cls){const n=pr.length;pr.forEach((a,i)=>{const b=pr[(i+1)%n],ny=b[1]-a[1],nz=a[0]-b[0];if(ny+nz<=0)return;el('path',{d:dp([[x0,...a],[x1,...a],[x1,...b],[x0,...b]].map(q=>P(...q))),class:`face ${nz>.4*Math.hypot(ny,nz)?'top ':''}${cls}`});});el('path',{d:dp(pr.map(([y,z])=>P(x1,y,z))),class:'face side '+cls});}
function ctl(g,label,tab){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:tab?'0':'-1','aria-label':label}))set(g,k,v);return g;}

// Floor: the soft ground shadow (and the dark stage's contact shadow), then the stand's base under the console.
const sc=P(88,-20,0);for(const c of['shadow stage-floor','stage-contact'])el('ellipse',{cx:f2(sc[0]),cy:f2(sc[1]),rx:60,ry:21,class:c});
prism([[-24,0],[0,0],[0,3],[-24,3]],38,112,'stand');
// The body: its shell's visible sides (the top edge lighter), the shell's front rim and the cream face plate.
const BODY=rrp(0,0,W,H,R,12);
for(const r of runs(BODY,n=>n[1]<-.6?'top':'side'))el('path',{d:dp(band(r.ch,at(-T),at(0)),Q),class:`face ${r.c} shell`});
el('path',{d:dp(BODY,Q),class:'face shell'});el('path',{d:dp(rrp(2.6,2.6,W-5.2,H-5.2,R-2.6,12),Q),class:'face plate'});
el('path',{d:dp([[47,0,-3.4],[103,0,-3.4],[103,0,-15],[47,0,-15]].map(([u,v,w])=>lift([u,v],w)),Q),class:'face slot'});
// The face: bezel with the LCD window, the LED and wordmark; seats for the buttons; the speaker grille; print.
const FG=group(FACE);
rect(FG,42,6,66,58,5,'face bezel');
const LX=51,LY=9.5,PITCH=1.2,LW=40,LH=36;
rect(FG,LX-3.2,LY-3.2,LW*PITCH+6.4,LH*PITCH+6.4,6,'halo');rect(FG,LX-1.1,LY-1.1,LW*PITCH+2.2,LH*PITCH+2.2,1.6,'face well');
const LG=group(`translate(${LX} ${LY}) scale(${PITCH})`,FG);el('rect',{width:LW,height:LH,class:'l0'},LG);
const GHOST=[1,2,3].map(t=>el('path',{class:'l'+t,d:''},LG)),PIX=[1,2,3].map(t=>el('path',{class:'l'+t,d:''},LG));
el('rect',{width:LW,height:LH,class:'lgrid'},LG);
el('path',{d:'M44,8H66L52,44L44,52Z',class:'glare'},FG);
circle(FG,46.5,15,2.8,'ledh');circle(FG,46.5,15,1.15,'led');text(FG,46.5,19.6,'PWR','bz center');
text(FG,75,60.5,'Pallo','brand center');text(FG,104.6,60.5,'P–8','bz end');
circle(FG,21,40,15.8,'face dish');
const CROSS=(a,L)=>[[-a,-L],[a,-L],[a,-a],[L,-a],[L,a],[a,a],[a,L],[-a,L],[-a,a],[-L,a],[-L,-a],[-a,-a]],CR=[1.8,1.8,1,1.8,1.8,1,1.8,1.8,1,1.8,1.8,1];
el('path',{d:dp(rpts(CROSS(5.5,14.2),CR)),class:'face hole',transform:'translate(21 40)'},FG);
for(const[x,y]of[[120,42.5],[137.5,32.5]])circle(FG,x,y,7.2,'face hole');
for(const x of[63,87])rect(FG,x-7.1,71,14.2,5.6,2.8,'face hole');
for(const[r,n]of[[0,1],[2.4,6],[4.8,12],[7.2,18]])for(let i=0;i<n;i++){const a=(i/n+(r===4.8?.5/n:0))*2*Math.PI;circle(FG,130+r*Math.cos(a),68.5+r*Math.sin(a),.62,'grille');}
text(FG,63,80.6,'SELECT','etch micro center');text(FG,87,80.6,'START','etch micro center');text(FG,120,53.4,'B','etch center');text(FG,137.5,43.4,'A','etch center');

// The d-pad: a cross on a pivot. Its top tilts toward the arm pressed; the sides and the marks follow the tilt.
const PAD=rpts(CROSS(4.7,13.4),CR),PADR=runs(PAD),padG=group('translate(21 40)',FG);
const PB=PADR.map(()=>el('path',{class:'face side pad'},padG)),PT=el('path',{class:'face top pad'},padG),PD=el('g',{},padG);
circle(PD,0,0,3.4,'dimple');for(const[a,b]of[[0,-1],[1,0],[0,1],[-1,0]])el('path',{d:`M${f2(a*11.6)},${f2(b*11.6)}L${f2(a*8.9-b*1.7)},${f2(b*8.9+a*1.7)}L${f2(a*8.9+b*1.7)},${f2(b*8.9-a*1.7)}Z`,class:'mark'},PD);
const ARM={L:[-1,0],R:[1,0],U:[0,-1],D:[0,1]};
function drawPad(dir){const v=ARM[dir]||[0,0],gx=-1.5*v[0]/13.4,gy=-1.5*v[1]/13.4,h=p=>3.1+gx*p[0]+gy*p[1];
PADR.forEach((r,i)=>set(PB[i],'d',dp(band(r.ch,at(0),h))));set(PT,'d',dp(PAD.map(p=>lift(p,h(p)))));
set(PD,'transform',`matrix(${[1+EU*gx,EV*gx,EU*gy,1+EV*gy,EU*3.1,EV*3.1].map(f4).join(' ')})`);}
// A and B: round caps on short walls, sinking when pressed.
const PEG={B:{c:[120,42.5],k:'kb'},A:{c:[137.5,32.5],k:'ka'}};
for(const p of Object.values(PEG)){p.g=el('g',{},FG);p.wall=el('path',{class:'face side '+p.k},p.g);p.cap=el('g',{},p.g);circle(p.cap,0,0,6.1,'face top '+p.k);circle(p.cap,0,0,4.6,'ring');el('path',{d:'M-4.2,-1.9A4.6,4.6 0 0 1 -1.2,-4.4',class:'hi'},p.cap);}
function drawPeg(p,h){const du=EU*h,dv=EV*h,l=Math.hypot(du,dv)||1,r=6.1,tx=-dv*r/l,ty=du*r/l,[x,y]=p.c;
set(p.wall,'d',`M${f2(x+tx)},${f2(y+ty)}A${r},${r} 0 0 1 ${f2(x-tx)},${f2(y-ty)}L${f2(x+du-tx)},${f2(y+dv-ty)}A${r},${r} 0 0 1 ${f2(x+du+tx)},${f2(y+dv+ty)}Z`);set(p.cap,'transform',`translate(${f2(x+du)} ${f2(y+dv)})`);}
// Select and start: rubber pills.
const PILL={SE:{x:63},ST:{x:87}};
for(const p of Object.values(PILL)){p.pts=rrp(p.x-6.2,71.6,12.4,4.4,2.2,6);p.runs=runs(p.pts);p.g=el('g',{},FG);p.sides=p.runs.map(()=>el('path',{class:'face side pill'},p.g));p.top=el('path',{class:'face top pill'},p.g);}
function drawPill(p,h){p.runs.forEach((r,i)=>set(p.sides[i],'d',dp(band(r.ch,at(0),at(h)))));set(p.top,'d',dp(p.pts.map(q=>lift(q,h))));}
// Their hit areas and focus rings, over the drawn parts.
const HIT={};
for(const[id,label]of[['L','D-pad left: walk left (Left arrow)'],['R','D-pad right: walk right (Right arrow)'],['U','D-pad up: hop (Up arrow)'],['D','D-pad down: drop (Down arrow)']]){const[a,b]=ARM[id],g=ctl(el('g',{},FG),label,false);
el('rect',{x:f2(21+(a?(a>0?0:-14.2):-5.5)),y:f2(40+(b?(b>0?0:-14.2):-5.5)),width:a?14.2:11,height:b?14.2:11,class:'hit'},g);HIT[id]=g;}
for(const[id,label]of[['B','B button: dash (B)'],['A','A button: hop (A or Space)']]){const p=PEG[id],g=ctl(el('g',{},FG),label,true);circle(g,p.c[0]-1,p.c[1],8,'hit');circle(g,p.c[0]-.9,p.c[1]+.2,8,'focus-ring');HIT[id]=g;}
for(const[id,label]of[['SE','Select: switch the backlight (S)'],['ST','Start: start or pause the game (Enter)']]){const p=PILL[id],g=ctl(el('g',{},FG),label,true);rect(g,p.x-8.4,69.6,16.8,8.4,4.2,'hit');rect(g,p.x-8.4,69.6,16.8,8.4,4.2,'focus-ring');HIT[id]=g;}

// The cartridge: a box out of the top edge, its label on the face; ejected, it rises along the face.
const CU0=52.5,CU1=97.5,CW0=-13.5,CW1=-5;
const cartG=ctl(el('g',{}),'Cartridge: eject it and push it back in (E)',true);
const cartR=el('path',{class:'face side cart'},cartG),cartT=el('path',{class:'face top cart'},cartG),cartF=el('path',{class:'face cart'},cartG);
const lab=el('g',{},cartG);for(const v of[-10.9,-9.6])line(lab,CU0+6,v,CU1-6,v,'rib');
const sticker=rect(lab,CU0+4.5,-8.2,36,8.2,.8,'sticker');text(lab,CU0+16,-3.3,'PIP HOP','st');
['..1..','.111.','11101','11111','.1.1.'].forEach((r,j)=>{for(let i=0;i<5;i++)if(r[i]==='1')rect(lab,CU0+7.4+i*1.1,-7.3+j*1.1,1.1,1.1,0,'sp');});
const cartRing=el('path',{class:'focus-ring'},cartG);
function drawCart(d){const vt=-12-d,F=list=>dp(list.map(([u,v,w])=>qp(u,v,w)));
set(cartR,'d',F([[CU1,vt,CW1],[CU1,vt,CW0],[CU1,0,CW0],[CU1,0,CW1]]));set(cartT,'d',F([[CU0,vt,CW0],[CU1,vt,CW0],[CU1,vt,CW1],[CU0,vt,CW1]]));set(cartF,'d',F([[CU0,vt,CW1],[CU1,vt,CW1],[CU1,0,CW1],[CU0,0,CW1]]));
set(lab,'transform',`${FACE} translate(${f4(EU*CW1)} ${f4(EV*CW1-d)})`);set(sticker,'height',f2(8.2+Math.min(d,12)));
set(cartRing,'d',F([[CU0-1.5,vt-1.5,CW1],[CU1+1.5,vt-1.5,CW1],[CU1+1.5,vt-1.5,CW0],[CU1+1.5,1,CW0],[CU0-1.5,1,CW1]]));}
// The stand's lip, chamfered, in front of the face's bottom edge.
prism([[0,0],[5.5,0],[5.5,9],[2.2,15],[0,15]],38,112,'stand');
// Framed on the console, the cartridge at the top of its eject, the stand and the dark stage's wider floor pool.
{const pts=[...BODY.flatMap(p=>[Q(p),Q(lift(p,-T))]),...[[CU0,-30,CW1],[CU1,-30,CW0]].map(([u,v,w])=>qp(u,v,w))];
for(const x of[38,112])for(const y of[-24,5.5])for(const z of[0,15])pts.push(P(x,y,z));pts.push([sc[0]-90,sc[1]-31.5],[sc[0]+90,sc[1]+31.5]);
const xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]),x0=Math.min(...xs)-6,y0=Math.min(...ys)-6;set(svg,'viewBox',[x0,y0,Math.max(...xs)+6-x0,Math.max(...ys)+6-y0].map(v=>+v.toFixed(2)).join(' '));}

// Pip Hop, on a 40 × 36 LCD: a score and hearts on top, then five rows of five-pixel cells over the ground. Coins fall a row
// a step; blocks roll in along the ground. Walk Pip under the coins, hop (2 steps up a row) over the blocks, dash two cells.
const FONT={0:'111101101101111',1:'010110010010111',2:'111001111100111',3:'111001011001111',4:'101101111001001',5:'111100111001111',6:'111100111101111',7:'111001001010010',8:'111101111101111',9:'111101111001111',
A:'010101111101101',D:'110101101101110',E:'111100110100111',G:'011100101101011',H:'101101111101101',I:'111010010010111',L:'100100100100111',M:'101111111101101',N:'110101101101101',O:'010101101101010',P:'110101110100100',R:'110101110101101',S:'011100010001110',T:'111010010010010',U:'101101101101111',V:'101101101101010',W:'101101101111101',Y:'101101010010010'};
const PIP={idle:['..2..','.333.','33303','33333','.3.3.'],step:['..2..','.333.','33303','33333','3...3'],air:['.2...','.333.','33303','33333','3...3']};
const COIN=[['.333.','33233','32333','33333','.333.'],['..3..','.333.','.323.','.333.','..3..'],['..3..','..2..','..2..','..2..','..3..'],['..3..','.333.','.323.','.333.','..3..']];
const BLOCK=[['33333','32113','31213','31123','33333'],['33333','31123','31213','32113','33333']];
const HEART=['.3.3.','33333','.333.','..3..'],HEART0=['.1.1.','11111','.111.','..1..'],SPARK=[['..3..','..3..','33.33','..3..','..3..'],['3...3','.2.2.','.....','.2.2.','3...3']],PLINK=['.....','.....','.....','2...2','.2.2.'];
const fb=new Uint8Array(LW*LH),pxl=(x,y,t)=>{if(x>=0&&x<LW&&y>=0&&y<LH)fb[y*LW+x]=t;};
const spr=(x,y,rows,flip)=>rows.forEach((r,j)=>{for(let i=0;i<r.length;i++){const c=flip?r[r.length-1-i]:r[i];if(c!=='.')pxl(x+i,y+j,+c);}});
const txt=(x,y,s,t=3)=>{for(const c of s){const g=FONT[c];if(g)for(let k=0;k<15;k++)if(g[k]==='1')pxl(x+k%3,y+(k/3|0),t);x+=4;}};
const fill=(x,y,w,h,t)=>{for(let j=0;j<h;j++)for(let i=0;i<w;i++)pxl(x+i,y+j,t);};
function banner(s,inv){const w=s.length*4-1,x=(LW-w)>>1;fill(x-2,9,w+4,7,inv?3:0);txt(x,10,s,inv?0:3);}
function rng(s){return()=>{s=(s+0x6d2b79f5)|0;let t=Math.imul(s^(s>>>15),1|s);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
// A game: Pip's column, hop and facing; the coins and blocks; score, hearts, level; its own dice. The demo plays one too.
let seed=11;
const game=(demo)=>demo?{pip:{c:3,air:0,face:1,inv:0,stp:0},coins:[{c:1,r:3},{c:5,r:2}],blocks:[{c:7,f:0}],score:0,hearts:3,lvl:1,steps:0,nextBlock:6,fx:[],rnd:rng(5),next:0,demo:true}
:{pip:{c:3,air:0,face:1,inv:0,stp:0},coins:[{c:3,r:2},{c:6,r:0}],blocks:[{c:8,f:0}],score:0,hearts:3,lvl:1,steps:0,nextBlock:9,fx:[],rnd:rng(seed++),next:0,demo:false};
const iv=g=>Math.max(170,360*.9**(g.lvl-1));

// State: the screen's mode, the game, the demo behind the title, the cartridge's eject, the backlight; sound on request.
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
let mode='title',G=null,DEMO=game(true),hi=0,light=true,note='',noteT=0,readyT=0,cartT0=0,bootT=0,chimed=false,aiT=0,shown='',ghostT=-1e9,lastPip='',lastUI=0,outKey='',cartD=-1,ac=null,nb=null,rep=null;
const say=m=>{announcement.textContent=m;},notice=(m,a)=>{note=m;noteT=performance.now()+1300;lastUI=0;if(a)say(a);};
function audio(){try{if(!ac){const A=window.AudioContext||window.webkitAudioContext;if(!A)return null;ac=new A();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}return ac;}
function tone(f,d,v=.025,type='square',when=0,f1=0){if(!ac)return;const t=ac.currentTime+when,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(f1)o.frequency.exponentialRampToValueAtTime(f1,t+d);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.004);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.03);}
function noise(d,v,f){if(!ac)return;if(!nb){nb=ac.createBuffer(1,ac.sampleRate>>2,ac.sampleRate);const x=nb.getChannelData(0);for(let i=0;i<x.length;i++)x[i]=Math.random()*2-1;}const t=ac.currentTime,s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;b.type='bandpass';b.frequency.value=f;b.Q.value=1.4;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(ac.destination);s.start(t,0,d+.02);}
// Chiptune blips, all written for it: a tick, a rising hop, a coin's fifth, a buzz, the level-up run, the boot chime.
const SFX={move:()=>tone(990,.025,.01),bump:()=>tone(150,.05,.02),hop:()=>tone(392,.11,.022,'square',0,880),dash:()=>tone(1250,.09,.018,'square',0,330),coin:()=>{tone(1047,.05,.024);tone(1568,.13,.024,'square',.055);},
hopped:()=>tone(698,.05,.016,'triangle'),hurt:()=>tone(196,.24,.035,'square',0,73),level:()=>[523,659,784,1047].forEach((f,i)=>tone(f,.08,.02,'square',i*.075)),end:()=>[523,415,311,262].forEach((f,i)=>tone(f,.2,.026,'triangle',i*.17)),
pause:()=>{tone(1175,.05,.018);tone(880,.07,.018,'square',.07);},light:()=>tone(1480,.03,.012),click:()=>noise(.035,.05,2600),chime:()=>[659,988,1319].forEach((f,i)=>tone(f,i===2?.45:.11,.024,'triangle',i*.09))};
const sfx=(g,k)=>{if(!g||!g.demo)SFX[k]();};
// The rules, step by step: Pip comes down from a hop, coins fall, blocks roll; then whatever meets Pip.
function gain(g,kind,now){g.score=Math.min(9999,g.score+1);const lv=1+Math.floor(g.score/10);if(g.demo)return;if(g.score>hi)hi=g.score;
if(lv>g.lvl){g.lvl=lv;g.flash={s:`LEVEL ${lv}`,t:now,k:g.steps};SFX.level();notice(`LEVEL ${lv} · FASTER`,`Level ${lv}.`);}else{SFX[kind]();notice(kind==='coin'?'COIN +1':'HOP +1');}}
function hurt(g){g.hearts--;g.pip.inv=3;if(g.demo){if(g.hearts<=0)DEMO=game(true);return;}SFX.hurt();
if(g.hearts<=0){mode='over';SFX.end();notice(g.score>g.best?'NEW HI SCORE':'GAME OVER',`Game over. Score ${g.score}.`);}else notice('OUCH · ♥ LOST','Ouch: a heart lost.');}
function resolve(g,now){const p=g.pip,row=p.air?3:4;
for(const k of g.coins)if(k.c===p.c&&k.r===row){k.got=1;g.fx.push({k:'spark',x:k.c*5,y:2+row*5,t:now,s:g.steps});gain(g,'coin',now);}
g.coins=g.coins.filter(k=>!k.got);
for(const b of g.blocks)if(b.c===p.c){if(p.air){if(!b.hop){b.hop=1;gain(g,'hopped',now);}}else if(!p.inv&&!b.hit){b.hit=1;hurt(g);if(g.hearts<=0)return;}}}
function step(g,now){g.steps++;const p=g.pip;if(p.air)p.air--;if(p.inv)p.inv--;
for(const k of g.coins)k.r++;for(const b of g.blocks){b.c--;b.f^=1;}
resolve(g,now);
g.coins=g.coins.filter(k=>{if(k.r<=4)return true;g.fx.push({k:'plink',x:k.c*5,y:27,t:now,s:g.steps});return false;});g.blocks=g.blocks.filter(b=>b.c>=0);
const R=g.rnd;if(g.coins.length<3&&R()<.5){const c=R()*8|0;if(!g.coins.some(k=>k.c===c&&k.r<2))g.coins.push({c,r:0});}
if(g.steps>=g.nextBlock&&g.blocks.length<2){g.blocks.push({c:8,f:0});g.nextBlock=g.steps+Math.max(3,6-g.lvl)+(R()*5|0);}}
function walk(g,d,now){const p=g.pip;p.face=d;const c=clamp(p.c+d,0,7);if(c===p.c){sfx(g,'bump');return;}p.c=c;p.stp^=1;sfx(g,'move');resolve(g,now);}
// What a button does to a game: walk, hop, drop, dash. With reduced motion the world takes one step per move instead of running.
function play(g,id,now){const p=g.pip;
if(id==='L'||id==='R')walk(g,id==='L'?-1:1,now);
else if(id==='U'||id==='A'){if(!p.air){p.air=2;sfx(g,'hop');resolve(g,now);}}
else if(id==='D'){if(p.air){p.air=0;resolve(g,now);}}
else if(id==='B'){sfx(g,'dash');for(let i=0;i<2;i++){walk(g,p.face,now);if(g===G&&mode!=='play')return;}}
if(!g.demo&&reduced.matches&&mode==='play')step(g,now);}
function begin(now){G=game(false);G.best=hi;noteT=0;mode=reduced.matches?'play':'ready';readyT=now+900;G.next=now+900+iv(G);say('New game. Walk Pip under the coins and hop the blocks.');lastUI=0;}
function start(now){sfx(null,'pause');noteT=0;
if(mode==='title'||mode==='over')begin(now);
else if(mode==='play'){mode='pause';say('Paused.');}
else if(mode==='pause'){mode='play';G.next=now+iv(G);say('Playing.');}
else if(mode==='ready'){mode='play';G.next=now+iv(G);}
else notice(mode==='out'?'NO CARTRIDGE':'BOOTING');lastUI=0;}
function backlight(){light=!light;svg.classList.toggle('unlit',!light);sfx(null,'light');notice(light?'BACKLIGHT ON':'BACKLIGHT OFF',light?'Backlight on.':'Backlight off.');}
function eject(now){if(cartT0)return;audio();cartT0=now;mode='out';G=null;chimed=false;noteT=0;SFX.click();say('Cartridge out. It goes back in and the console boots again.');lastUI=0;}
function act(id,now,demo){
if(demo){if(mode==='title')play(DEMO,id,now);return;}
if(id==='ST')return start(now);if(id==='SE')return backlight();
if(mode==='out'||mode==='boot')return notice(mode==='out'?'NO CARTRIDGE':'BOOTING');
if(mode==='over')return notice('GAME OVER · PRESS START');if(mode==='pause')return notice('PAUSED · START RESUMES');
if(mode==='title')begin(now);if(mode==='ready'){mode='play';G.next=now+iv(G);}
play(G,id,now);lastUI=0;}

// Buttons: down at once, back up no sooner than 110 ms later (so a tap through press() still shows; never with reduced
// motion), each drawn again only when it changes. The demo presses them too.
const BT={};for(const id of['L','R','U','D','A','B','SE','ST'])BT[id]={on:false,t0:0,rel:0,drawn:null};
const KEYMAP={ArrowLeft:'L',ArrowRight:'R',ArrowUp:'U',ArrowDown:'D',a:'A',' ':'A',b:'B',Enter:'ST',s:'SE'},held=new Set();
function push(id,now,demo){const b=BT[id];b.on=true;b.t0=now;b.rel=0;if(!demo)audio();if((id==='L'||id==='R')&&!demo)rep={id,t:now+260};act(id,now,demo);}
function release(id,now){const b=BT[id];if(b.on&&!b.rel)b.rel=Math.max(now,b.t0+(reduced.matches?0:110));if(rep&&rep.id===id)rep=null;}
function drawButtons(){const dir=['L','R','U','D'].filter(id=>BT[id].on).sort((a,b)=>BT[b].t0-BT[a].t0)[0]||'';
if(dir!==BT.L.drawn){BT.L.drawn=dir;drawPad(dir);}
for(const id of['A','B']){const on=BT[id].on;if(on!==BT[id].drawn){BT[id].drawn=on;drawPeg(PEG[id],on?.7:2.6);}}
for(const id of['SE','ST']){const on=BT[id].on;if(on!==BT[id].drawn){BT[id].drawn=on;drawPill(PILL[id],on?.4:1.5);}}}
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.length===1?e.key.toLowerCase():e.key,id=KEYMAP[k],now=performance.now();
if(k==='e'){e.preventDefault();if(!e.repeat)eject(now);return;}if(!id)return;e.preventDefault();if(e.repeat)return;held.add(k);push(id,now);});
document.addEventListener('keyup',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key,id=KEYMAP[k];if(!id)return;held.delete(k);if(!Object.entries(KEYMAP).some(([kk,v])=>v===id&&held.has(kk)))release(id,performance.now());});
const ptr=new Set();
for(const[id,g]of Object.entries(HIT)){g.addEventListener('pointerdown',e=>{if(e.button>0)return;e.preventDefault();ptr.add(id);push(id,performance.now());});
g.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();e.stopPropagation();if(e.repeat)return;const now=performance.now();push(id,now);release(id,now);});}
const letGo=()=>{const now=performance.now();for(const id of ptr)release(id,now);ptr.clear();};addEventListener('pointerup',letGo);addEventListener('pointercancel',letGo);addEventListener('blur',()=>{letGo();held.clear();const now=performance.now();for(const id in BT)release(id,now);});
cartG.addEventListener('click',()=>eject(performance.now()));cartG.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();e.stopPropagation();if(!e.repeat)eject(performance.now());});
// The demo behind the title: it hops the block beside it and walks to the lowest coin it can still reach.
function ai(now){if(now<aiT)return;aiT=now+210;const g=DEMO,p=g.pip,hit=c=>g.blocks.some(b=>b.c===c||b.c===c+1);
if(!p.air&&g.blocks.some(b=>b.c===p.c+1)){push('A',now,true);release('A',now);return;}
let best=null;for(const k of g.coins)if(Math.abs(k.c-p.c)<=5-k.r&&(!best||k.r>best.r))best=k;
if(best&&best.c!==p.c){const d=Math.sign(best.c-p.c),id=d>0?'R':'L';if(p.air||!hit(p.c+d)){push(id,now,true);release(id,now);}}}

// The screen, drawn into a frame buffer and out as one path per tone; an LCD's slow pixels leave a trace in full motion.
function compose(now,red){fb.fill(0);
if(mode==='boot'){const e=now-bootT,y=red?14:Math.min(14,-5+Math.floor(e/40));txt(10,y,'PALLO',3);if(y===14)fill(10,21,19,1,1);return;}
if(mode==='out'){if(!red&&now-cartT0<170)for(let y=0;y<LH;y+=3)fill(((y*7+(now/40|0)*13)%30),y,10,1,2);return;}
const g=mode==='title'?DEMO:G,p=g.pip;
for(let x=0;x<LW;x++){pxl(x,32,2);if(x%2===0)pxl(x,33,1);if(x%3===1)pxl(x,34,1);if(x%4===2)pxl(x,35,1);}
for(let x=0;x<LW;x+=2)pxl(x,6,1);
if(mode==='title')txt(1,0,'HI '+String(hi).padStart(4,'0'),3);else{txt(1,0,String(g.score).padStart(4,'0'),3);for(let i=0;i<3;i++)spr(23+i*6,0,i<g.hearts?HEART:HEART0);}
for(const b of g.blocks)spr(b.c*5,27,BLOCK[b.f]);
for(const k of g.coins)spr(k.c*5,7+k.r*5,red?COIN[0]:COIN[((now/110|0)+k.c)%4]);
g.fx=g.fx.filter(f=>now-f.t<360||(red&&f.s===g.steps));
for(const f of g.fx)spr(f.x,f.y,f.k==='plink'?PLINK:SPARK[!red&&now-f.t>180?1:0]);
if(!(p.inv&&!red&&(now/90|0)%2))spr(p.c*5,p.air?22:27,p.air?PIP.air:p.stp?PIP.step:PIP.idle,p.face<0);
if(mode==='title'&&(red||(now/520|0)%2===0))banner('START',false);else if(mode==='ready')banner('READY',true);else if(mode==='pause')banner('PAUSE',true);
else if(mode==='over'){banner('GAME OVER',true);if(g.score>g.best){fill(7,18,26,7,0);txt(9,19,'NEW HI',3);}}else if(g.flash&&(now-g.flash.t<900||(red&&g.flash.k===g.steps)))banner(g.flash.s,true);}
function paths(){const d=['','','',''];for(let y=0;y<LH;y++){let x=0;while(x<LW){const t=fb[y*LW+x];if(!t){x++;continue;}let e=x+1;while(e<LW&&fb[y*LW+e]===t)e++;d[t]+=`M${x},${y}h${e-x}v1h${x-e}z`;x=e;}}return d;}
function screen(now,red){compose(now,red);const d=paths(),key=d.join('|');
if(key!==shown){const old=shown.split('|');shown=key;PIX.forEach((n,i)=>set(n,'d',d[i+1]));if(!red&&old.length===4){GHOST.forEach((n,i)=>set(n,'d',old[i+1]));ghostT=now;}}
const go=red?0:Math.max(0,.42*(1-(now-ghostT)/130));GHOST.forEach(n=>{if(n._o!==go){n._o=go;n.style.opacity=f2(go);if(!go)set(n,'d','');}});
const pip=G&&mode!=='title'?`${G.pip.c}${G.pip.air?' up':''}`:'';if(pip!==lastPip){lastPip=pip;if(pip)set(LG,'data-yj-pip',pip);else LG.removeAttribute('data-yj-pip');}}
function ui(now){const g=G,h=g?g.hearts:3,r=`SCORE ${String(g?g.score:0).padStart(4,'0')} · HI ${String(hi).padStart(4,'0')} · ${'♥'.repeat(Math.max(0,h))}${'♡'.repeat(3-Math.max(0,h))}`;
const st=now<noteT?note:{title:'PIP HOP · PRESS START',ready:`READY · LEVEL ${g&&g.lvl}`,play:`PLAYING · LEVEL ${g&&g.lvl}`,pause:'PAUSED · START RESUMES',over:'GAME OVER · START PLAYS AGAIN',out:'CARTRIDGE OUT',boot:'CARTRIDGE IN · BOOTING'}[mode];
if(r+st!==outKey){outKey=r+st;readout.textContent=r;stateLabel.textContent=st;}}
// Frames: the button releases, the demo or the game's steps, the cartridge's eject and the boot, then the screen.
function tick(now){const red=reduced.matches;
for(const id in BT){const b=BT[id];if(b.on&&b.rel&&now>=b.rel){b.on=false;b.rel=0;}}
if(mode==='title'&&!red){if(!DEMO.next||now-DEMO.next>1000)DEMO.next=now+iv(DEMO);while(now>=DEMO.next){const d=DEMO;step(d,now);if(d!==DEMO){DEMO.next=now+iv(DEMO);break;}DEMO.next+=iv(DEMO);}ai(now);}
if(mode==='ready'&&(red||now>=readyT)){mode='play';G.next=now+iv(G);}
if(mode==='play'&&!red){if(now-G.next>1000)G.next=now;while(mode==='play'&&now>=G.next){step(G,now);G.next+=iv(G);}
if(rep&&now>=rep.t&&mode==='play'){rep.t=now+120;walk(G,rep.id==='L'?-1:1,now);}}
if(cartT0){const e=now-cartT0,d=red?(e<900?18:0):e<280?18*ease(e/280):e<900?18:18*(1-ease((e-900)/260));if(d!==cartD){cartD=d;drawCart(d);}
if(mode==='out'&&e>=(red?900:1160)){mode='boot';bootT=now;noteT=0;SFX.click();say('Cartridge in. Booting.');lastUI=0;}}
if(mode==='boot'){const e=now-bootT;if(!chimed&&(red||e>=760)){chimed=true;SFX.chime();}if(e>=(red?1100:1500)){mode='title';cartT0=0;noteT=0;DEMO=game(true);say('Pip Hop. Press start.');}}
drawButtons();screen(now,red);if(!lastUI||now-lastUI>100){lastUI=now;ui(now);}
requestAnimationFrame(tick);}
drawButtons();drawCart(0);cartD=0;screen(performance.now(),reduced.matches);ui(performance.now());requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
