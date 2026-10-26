// @ts-nocheck
/* LEVARO T–5 · Elevator. Drawn for this package on the shared engine, in the lab figures' form: its stylesheet, defs and
 * script. The script runs on the env, which stands in for the page; its types are at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--off:#c9c2b2;--ok:#15a65e;--warn:#e88a00;--wall:#ece5d6;--wall-side:#d3ccbd;--floor:#e2dbcd;--brass:#d0ab5f;--brass-top:#e9c986;--brass-side:#ae8a45;--bronze:#9b7745;--bronze-top:#b8945e;--bronze-side:#7a5a2e;--conc:#d1cdc4;--conc-top:#e3e0d9;--conc-side:#bdb9b0;--shaft:#8f8a81;--shaft-side:#807a72;--pitf:#857f77;--yel:#e2b533;--yel-top:#f0cd60;--yel-side:#b88f1f;--dk:#4a4a48;--dk-top:#62625f;--dk-side:#393938;--steel:#d5d6d2;--steel-top:#ededea;--steel-side:#b4b5b1;--motor:#5f8073;--motor-top:#7d9b8f;--motor-side:#4b665b;--red:#c24a3c;--lit:#f2d6a2;--lit-hi:#fff3d8;--lit-lo:#ddb67a;--lit-side:#e4c088;--cabfloor:#5f574d;--dial:#f8f2e2;--plate:#efe9dc;--rope:#343432;--sill:#b9b2a2;--iron:#a3a4a0;--iron-top:#c9cac6;--iron-side:#82837f;--call:#ffae2b;--up:#1fb866;--dn:#ee4b39;--num:#8a7149;--stencil:#6e6a62}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--off:#a59f92;--ok:#36d886;--warn:#ffad2b;--wall:#c7c1b4;--wall-side:#959085;--floor:#d3cdc0;--brass:#af904f;--brass-top:#dabc7d;--brass-side:#7a602e;--bronze:#826339;--bronze-top:#ac8a57;--bronze-side:#543d1d;--conc:#afada7;--conc-top:#d4d2cb;--conc-side:#84827f;--shaft:#55524d;--shaft-side:#4a4743;--pitf:#4e4b46;--yel:#be9829;--yel-top:#e1c059;--yel-side:#816413;--dk:#3d3d3c;--dk-top:#5b5b58;--dk-side:#252525;--steel:#b3b4b1;--steel-top:#dededb;--steel-side:#7f7f7d;--motor:#4f6b60;--motor-top:#759185;--motor-side:#32463e;--red:#a33d31;--lit:#f6d9a4;--lit-hi:#fff2d6;--lit-lo:#e0b779;--lit-side:#e6bf82;--cabfloor:#585147;--dial:#d9d3c2;--plate:#c8c4bc;--rope:#1e1e1d;--sill:#9a948a;--iron:#81827f;--iron-top:#b1b2ae;--iron-side:#575856;--call:#ffb640;--up:#36d886;--dn:#ff5a45;--num:#6d5833;--stencil:#3f3d3a;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.recess{fill:var(--recess)}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.center{text-anchor:middle}.end{text-anchor:end}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.wall{fill:var(--wall)}.side.wall{fill:var(--wall-side)}.top.floor{fill:var(--floor)}.conc{fill:var(--conc)}.top.conc{fill:var(--conc-top)}.side.conc{fill:var(--conc-side)}.shaft{fill:var(--shaft)}.side.shaft{fill:var(--shaft-side)}.top.pitf{fill:var(--pitf)}.brass{fill:var(--brass)}.top.brass{fill:var(--brass-top)}.side.brass{fill:var(--brass-side)}.bronze{fill:var(--bronze)}.top.bronze{fill:var(--bronze-top)}.side.bronze{fill:var(--bronze-side)}.yel{fill:var(--yel)}.top.yel{fill:var(--yel-top)}.side.yel{fill:var(--yel-side)}.dk{fill:var(--dk)}.top.dk{fill:var(--dk-top)}.side.dk{fill:var(--dk-side)}.steel{fill:var(--steel)}.top.steel{fill:var(--steel-top)}.side.steel{fill:var(--steel-side)}.motor{fill:var(--motor)}.top.motor{fill:var(--motor-top)}.side.motor{fill:var(--motor-side)}.iron{fill:var(--iron)}.top.iron{fill:var(--iron-top)}.side.iron{fill:var(--iron-side)}.red{fill:var(--red)}.top.sill{fill:var(--sill)}.plate{fill:var(--plate)}
.hatch{fill:url(#hatch);stroke:none;pointer-events:none}.hl{stroke:var(--line);stroke-width:.4;opacity:.4}.joint{fill:none;stroke:var(--line);stroke-width:.45;vector-effect:non-scaling-stroke;opacity:.3}.stencil{fill:var(--stencil);font:700 2.8px ui-monospace,monospace;stroke:none}
.lit{fill:url(#litG)}.side.lit{fill:var(--lit-side)}.top.cabfloor{fill:var(--cabfloor)}.seam{fill:none;stroke:#a77d45;stroke-width:.35;opacity:.5}.halo{fill:var(--lit);opacity:.16;filter:url(#bloom);pointer-events:none}.grail{fill:none;stroke:var(--bronze);stroke-width:.75;stroke-linecap:round}
.tcable{fill:none;stroke:#2f2f2e;stroke-width:.9;stroke-linecap:round;opacity:.85}.rope{fill:none;stroke:var(--rope);stroke-width:1.05;stroke-linecap:round}.rope-hi{fill:none;stroke:#8d8c88;stroke-width:.28;opacity:.6}.sheen{fill:none;stroke:#fff6dc;stroke-width:.45;opacity:.6;pointer-events:none}
.flr{fill:var(--num);font:700 6.6px ui-monospace,monospace;text-anchor:middle;stroke:none}.dialface{fill:var(--dial);stroke:none}.dnum{fill:#3a362c;font:700 1.3px ui-monospace,monospace;text-anchor:middle;stroke:none}.needle{fill:none;stroke:#1d1d1c;stroke-width:.6;stroke-linecap:round}
.cb{fill:var(--plate);stroke:var(--bronze-side);stroke-width:.3;vector-effect:non-scaling-stroke}.cb.on{fill:var(--call);stroke:none;filter:url(#glow)}.arrow{fill:var(--bronze-side);stroke:none;pointer-events:none}.cb.on+.arrow{fill:#6a4300}
.lan{fill:var(--off);stroke:none}.lan.up{fill:var(--up);filter:url(#glow)}.lan.dn{fill:var(--dn);filter:url(#glow)}
.cop{fill:var(--plate);stroke:none}.cop.on{fill:var(--call);filter:url(#glow)}.led{fill:var(--off);stroke:none}.led.g{fill:var(--ok);filter:url(#glow)}.led.a{fill:var(--warn);filter:url(#glow)}
.brand{fill:#4a3a1e;font:600 2.1px Georgia,'Times New Roman',serif;letter-spacing:.6px;text-anchor:middle;stroke:none}
.control{cursor:pointer;outline:none}.hit{fill:transparent;stroke:none;pointer-events:all}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0;pointer-events:none}.control:focus-visible .focus-ring{opacity:1}
@media(prefers-color-scheme:dark){.halo{opacity:.4}}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<pattern id="hatch" width="2.2" height="2.2" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0,0V2.2" class="hl"/></pattern>
<linearGradient id="litG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--lit-hi)"/><stop offset=".45" style="stop-color:var(--lit)"/><stop offset="1" style="stop-color:var(--lit-lo)"/></linearGradient>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,kit}=env;
/* LEVARO T–5 traction elevator in a cut building section. World: x lower-right; y lower-left (the landings face +y); z up.
Part                        x      y      z      w      d      h
shaft (inside)              0      0      0     30     30    128.6   cut away on the right (x 30); walls 3 thick behind, left and front
hall face                  −3     33      0     33      –     131    a doorway 13 × 14.5 at x 11.5 on each floor: brass doors and frame, a dial
                                                                     above, the hall lantern, the call plate and the floor's numeral
landings (5)               −3     33    6+25k    33    2.6      –     slab tops at 6, 31, 56, 81, 106; 2.4 thick; cut faces hatched
cab                       8.5    6.6     cz     19     22    19.5    cut open on the right and top: lit walls, handrail, car panel; crosshead
counterweight              12    0.9     wz     13    4.2     15     a yellow frame of iron weights against the back wall; it rides opposite the cab
roof deck                  −3     −3    131     33   38.6      –     a low parapet; bedplate, motor, red brake, traction sheave (r 6.3 at y 9.3, z 141)
Ropes run at x 20: from the sheave's front (y 15.6) to the cab's crosshead, from its back (y 3) to the counterweight.
Painter order: shadow, shaft (back wall, pit, rails, counterweight, ropes), cab, the hall face (reveals, doors, wall, fixtures),
landings, cut ends, the roof deck and its machine. */
const draw=document.getElementById('drawing');let root=draw;
const{P,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,box,cylinder,slits,frame}=kit(()=>root);
const into=g=>root=g,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),{PI,sin,cos,sqrt,abs,round,min,max}=Math;
const N=5,H=25,PIT=6,FL=k=>PIT+k*H,SW=30,SD=30,TW=3,FY=SD+TW,LD=2.6,TS=2.4,TOPZ=FL(N),SB=TOPZ-TS;
const CX0=8.5,CX1=27.5,CY0=6.6,CY1=28.6,CH=19.5,IW=.8,HX=20,HY=15.6,SY=9.3,SZ=TOPZ+10,SR=6.3,WY=3,WX0=12,WX1=25,WD=4.2,WH=15,WZ0=SB-1-WH;
const DX=11.5,DW=13,DH=14.5;
function bind(g,fn){g.addEventListener('click',fn);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();e.stopPropagation();if(!e.repeat)fn();}});}
function button(g,label){for(const[k,v]of Object.entries({class:'control',role:'button',tabindex:'0','aria-label':label}))set(g,k,v);return g;}
function lit(n,c,base){if(n._c!==c){n._c=c;set(n,'class',base+(c?' '+c:''));}}
const hatch=(g,x,y,w,h)=>rect(g,x,y,w,h,0,'hatch');
// Floor: the house ground shadow, a projected path under the footprint (so the frame and thumbnails fit it exactly).
const sp=[];for(let i=0;i<40;i++){const t=i/40*2*PI;sp.push(P(13.5+22*cos(t),17+24*sin(t),0).map(f2).join(','));}
const shd=`M${sp.join('L')}Z`;el('path',{d:shd,class:'shadow stage-floor'});el('path',{d:shd,class:'stage-contact'});
// The shaft through its cut: the back wall with its floor marks, its cut end, the pit and its buffers, the counterweight's rails.
const BW=group(FRONT(0,0,SB));rect(BW,0,0,SW,SB,0,'face shaft');
for(let k=0;k<N;k++){const v=SB-FL(k);line(BW,0,v,SW,v,'joint');text(BW,28.6,v-1.4,String(k+1),'stencil end');}
rect(group(TOP(0,0,.02)),0,0,SW,SD,0,'face top pitf');
for(const x of[10.9,26.1])box(x-.4,0,0,.8,.8,SB,.15,'dk');
for(const[y,r,h]of[[WY,1.2,5.4],[HY,1.7,3.6]]){const b=cylinder(18.5,y,0,r,h,'z','yel');circle(b.face,0,0,r*.45,'detail');}
// The counterweight's ropes and the counterweight: a yellow frame of iron weights that rides opposite the cab.
const wRope=[el('path',{class:'rope'}),el('path',{class:'rope-hi'})];
const wG=el('g',{});into(wG);box(WX0,WY-WD/2,WZ0,WX1-WX0,WD,WH,.5,'dk');
{const g=group(FRONT(WX0,WY+WD/2,WZ0+WH));for(let v=2.4;v<WH-1;v+=1.8)line(g,1.5,v,WX1-WX0-1.5,v,'joint');
for(const[u,w]of[[0,1.5],[WX1-WX0-1.5,1.5]])rect(g,u,0,w,WH,.3,'face yel');rect(g,0,0,WX1-WX0,1.6,.3,'face yel');rect(g,0,WH-1.6,WX1-WX0,1.6,.3,'face yel');}
box(HX-1.4,WY-1,WZ0+WH,2.8,2,.9,.3,'yel');into(draw);
// The traveling cable: from the back wall at mid-shaft down in a loop to the cab's underside; the loop rises at half the cab's speed.
const TCX=28.2,TCA=FL(2)+8,TCR=3.5,TCL=71.2;box(TCX-.6,0,TCA-1,1.2,1.4,2.2,.3,'dk');const tCable=el('path',{class:'tcable'},group(SIDE(TCX,0,0)));
// The cab's ropes, then the cab: its glow, platform, lit walls (cut open on the right and top), handrail, car panel, crosshead.
const cRope=[el('path',{class:'rope'}),el('path',{class:'rope-hi'})];
const cabG=el('g',{});into(cabG);const cz=FL(0),cq=P((CX0+CX1)/2,(CY0+CY1)/2,cz+CH*.55);el('ellipse',{cx:f2(cq[0]),cy:f2(cq[1]),rx:24,ry:20,class:'halo'});
box(CX0-.5,CY0-.5,cz-1.8,CX1-CX0+.5,CY1-CY0+1,1.8,.4,'dk');
rect(group(SIDE(CX0+IW,CY1-IW,cz+CH)),0,0,CY1-CY0-2*IW,CH,0,'face side lit');
const BK=group(FRONT(CX0+IW,CY0+IW,cz+CH)),bw=CX1-CX0-IW;rect(BK,0,0,bw,CH,0,'face lit');
for(const u of[bw/3,bw*2/3])line(BK,u,1,u,CH-.4,'seam');line(BK,0,CH-3.4,bw,CH-3.4,'seam');
el('path',{d:`M1,${CH-8.6}H${bw-.4}`,class:'grail'},BK);for(const u of[2,bw-1.6])line(BK,u,CH-8.6,u,CH-7.4,'grail');
const copG=group(`translate(${bw-5.2} 4.6)`,BK);rect(copG,0,0,2.6,9.6,.5,'face brass');rect(copG,.5,.6,1.6,1.4,.2,'face dk');
const cops=[0,1,2,3,4].map(k=>{const n=circle(copG,1.3,8.4-k*1.42,.48,'cop');n._c='';return n;});
rect(group(TOP(CX0+IW,CY0+IW,cz+.02)),0,0,bw,CY1-CY0-2*IW,0,'face top cabfloor');
el('path',{d:`M0,0H${CX1-CX0}V${CH}H0ZM${DX-CX0},${CH-DH}V${CH}H${DX-CX0+DW}V${CH-DH}Z`,'fill-rule':'evenodd',class:'face bronze'},group(FRONT(CX0,CY1,cz+CH)));
{const g=group(TOP(CX0,CY0,cz+CH));for(const[x,y,w,d]of[[0,0,CX1-CX0,IW],[0,CY1-CY0-IW,CX1-CX0,IW],[0,0,IW,CY1-CY0]])rect(g,x,y,w,d,0,'face top bronze');}
{const g=group(SIDE(CX1,CY1,cz+CH));for(const[u,w]of[[0,IW],[CY1-CY0-IW,IW]])rect(g,u,0,w,CH,0,'face side bronze');}
box(CX1+.2,HY-.6,cz-1.8,.8,1.2,CH+3.4,.2,'dk');box(CX0-.6,HY-.8,cz+CH+.3,CX1-CX0+1.6,1.6,1.4,.3,'dk');
for(const dx of[-.45,.45])cylinder(HX+dx,HY,cz+CH+1.7,.3,.7,'z','steel');
into(draw);
// The hall face, floor by floor: the doorway's reveal and sill, the doors (behind the wall), the wall with its doorways,
// then the frame, the dial above, the hall lantern, the call plate and the floor's numeral.
for(let k=0;k<N;k++){const z=FL(k);rect(group(SIDE(DX,FY,z+DH)),0,0,TW,DH,0,'face side bronze');rect(group(TOP(DX,SD,z+.02)),0,0,DW,TW,0,'face top sill');}
const doors=[];
for(let k=0;k<N;k++){const g=group(FRONT(DX,FY-.6,FL(k)+DH)),L=rect(g,0,0,DW/2,DH,.2,'face brass leaf'),R=rect(g,DW/2,0,DW/2,DH,.2,'face brass leaf');
doors.push({L,R,a:line(g,DW/2-.7,.6,DW/2-.7,DH-.6,'sheen'),b:line(g,DW/2+.7,.6,DW/2+.7,DH-.6,'sheen'),o:-1});}
{let d=`M0,0H${SW+TW}V${TOPZ}H0Z`;for(let k=0;k<N;k++){const v1=TOPZ-FL(k),v0=v1-DH;d+=`M${DX+TW},${v0}V${v1}H${DX+TW+DW}V${v0}Z`;}
el('path',{d,'fill-rule':'evenodd',class:'face wall'},group(FRONT(-TW,FY,TOPZ)));}
const needles=[],lanterns=[],calls=[];
for(let k=0;k<N;k++){const F=group(FRONT(0,FY+.04,FL(k)+H));
el('path',{d:`M${DX-1.1},${H}V${H-DH-1.5}H${DX+DW+1.1}V${H}H${DX+DW}V${H-DH}H${DX}V${H}Z`,class:'face bronze'},F);
// The dial: a half-round over the doors, its needle sweeping 1 to 5 as the cab travels.
const dc=[DX+DW/2,H-DH-1.7];el('path',{d:`M${dc[0]-3.6},${dc[1]}A3.6,3.6 0 0 1 ${dc[0]+3.6},${dc[1]}Z`,class:'face bronze'},F);
el('path',{d:`M${dc[0]-2.9},${dc[1]-.2}A2.9,2.9 0 0 1 ${dc[0]+2.9},${dc[1]-.2}Z`,class:'dialface'},F);
for(let f=0;f<N;f++){const a=(162-f*36)*PI/180;text(F,f2(dc[0]+2.2*cos(a)),f2(dc[1]-.2-2.2*sin(a)+.45),String(f+1),'dnum');}
const nd=el('g',{},group(`translate(${dc[0]} ${dc[1]-.25})`,F));line(nd,0,0,2.3,0,'needle');circle(F,dc[0],dc[1]-.25,.45,'face brass');needles.push(nd);
// The hall lantern beside the doors: up and down arrows that light when the cab arrives.
rect(F,26.3,H-15.4,2.5,5.2,.5,'face bronze');
const lu=el('path',{d:`M27.55,${H-14.8}L28.5,${H-13.3}H26.6Z`,class:'lan'},F),ld=el('path',{d:`M27.55,${H-10.8}L28.5,${H-12.3}H26.6Z`,class:'lan'},F);lu._c=ld._c='';lanterns.push({lu,ld});
// The call plate: an up button (not on the top floor) over a down button (not on the bottom floor).
rect(F,6.3,H-12.6,2.8,5.8,.6,'face bronze');const cs={};
for(const[d,v,ok]of[[1,H-10.8,k<N-1],[-1,H-8.4,k>0]]){if(!ok)continue;const g=button(el('g',{},F),`Floor ${k+1}: call the cab to go ${d>0?'up':'down'}`);
const b=circle(g,7.7,v,.85,'cb');b._c='';el('path',{d:d>0?`M7.7,${v-.42}L8.12,${v+.3}H7.28Z`:`M7.7,${v+.42}L8.12,${v-.3}H7.28Z`,class:'arrow'},g);
rect(g,6.1,v-1.25,3.2,2.5,.5,'hit');rect(g,5.9,v-1.45,3.6,2.9,.7,'focus-ring');cs[d]=b;bind(g,()=>hall(k,d,true));}
calls.push(cs);
text(F,2.2,H-8.4,String(k+1),'flr');if(!k){rect(F,-2.2,H-4.6,11.6,2.6,.4,'face brass');text(F,3.6,H-2.65,'LEVARO','brand');}
const dg=button(el('g',{},F),`Floor ${k+1}: send the cab here (${k+1})`);rect(dg,DX,H-DH,DW,DH,0,'hit');rect(dg,DX-1.5,H-DH-1.9,DW+3,DH+2.3,.8,'focus-ring');bind(dg,()=>send(k,true));}
// The landings, the ground slab and the roof: tops of the hall floor, cut faces hatched; the front wall's cut end.
function slab(z0,z1,y0,y1){const F=group(FRONT(-TW,y1,z1)),R=group(SIDE(SW,y1,z1));rect(group(TOP(-TW,y0,z1)),0,0,SW+TW,y1-y0,0,'face top floor');
rect(F,0,0,SW+TW,z1-z0,0,'face conc');hatch(F,0,0,SW+TW,z1-z0);rect(R,0,0,y1-y0,z1-z0,0,'face side conc');hatch(R,0,0,y1-y0,z1-z0);}
slab(0,PIT,FY,FY+LD);for(let k=1;k<N;k++)slab(FL(k)-TS,FL(k),FY,FY+LD);
{const R=group(SIDE(SW,FY,SB));rect(R,0,0,TW,SB,0,'face side conc');hatch(R,0,0,TW,SB);const B=group(SIDE(SW,0,SB));rect(B,0,0,TW,SB,0,'face side conc');hatch(B,0,0,TW,SB);}
// The roof deck over the shaft, a low parapet behind and to the left, and the machine on its bedplate: motor, red brake,
// traction sheave with the ropes over it, and the controller with the maker's plate.
slab(SB,TOPZ,-TW,FY+LD);{const g=group(TOP(-TW,-TW,TOPZ+.02));for(const v of[13,26])line(g,0,v,SW+TW,v,'joint');}
{const T=group(TOP(-TW,-TW,TOPZ+2.2));box(-TW,-TW,TOPZ,SW+TW,TW,2.2,.3,'conc');box(-TW,0,TOPZ,TW,FY+LD,2.2,.3,'conc');rect(T,0,0,SW+TW,TW,0,'face top conc');
const e=group(SIDE(SW,0,TOPZ+2.2));hatch(e,0,0,TW,2.2);const f=group(FRONT(-TW,FY+LD,TOPZ+2.2));hatch(f,0,0,TW,2.2);}
for(const y of[HY,WY])circle(group(TOP(HX,y,TOPZ+.03)),0,0,1.1,'face recess');
box(22.6,.6,TOPZ,6.4,4,12,.5,'steel');{const g=group(FRONT(22.6,4.6,TOPZ+12));rect(g,.7,.7,5,10.6,.4,'detail');slits(g,1.5,1.8,3.4,2.6,5);}
const cled=circle(group(FRONT(22.6,4.65,TOPZ+12)),3.2,9.6,.5,'led');cled._c='';
box(3.5,SY-4.6,TOPZ,18.5,9.2,2,.5,'dk');box(5.6,SY-3.2,TOPZ+2,5.8,6.4,2.6,.3,'motor');
const mot=cylinder(4.6,SY,SZ,4.6,7.6,'x','motor');circle(mot.face,0,0,3.1,'detail');for(let i=0;i<8;i++){const a=i*PI/4;line(mot.face,f2(1.1*cos(a)),f2(1.1*sin(a)),f2(2.8*cos(a)),f2(2.8*sin(a)));}
const brk=cylinder(12.2,SY,SZ,3.4,2.4,'x','steel');circle(brk.face,0,0,1.1,'face steel');
for(const s of[-1,1])box(12.4,SY+s*3.6-.6,SZ-3,2,1.2,6,.3,'red');
cylinder(14.6,SY,SZ,.9,2.4,'x','steel');box(16.2,SY-1.4,TOPZ+2,4.2,2.8,SZ-TOPZ-2,.3,'dk');
const shv=cylinder(16.6,SY,SZ,SR,3.6,'x','iron');circle(shv.face,0,0,SR-.9,'detail');circle(shv.face,0,0,1.5,'face iron');
const spin=el('g',{},shv.face);for(let i=0;i<6;i++){const a=i*PI/3;line(spin,f2(1.6*cos(a)),f2(1.6*sin(a)),f2((SR-1.1)*cos(a)),f2((SR-1.1)*sin(a)),'detail');}circle(spin,0,-(SR-1.6),.45,'face red');
for(const c of['rope','rope-hi'])el('path',{d:`M${-SR},0A${SR},${SR} 0 0 1 ${SR},0`,class:c},shv.face);
for(const y of[HY,WY])for(const c of['rope','rope-hi']){const a=P(HX,y,TOPZ),b=P(HX,y,SZ);el('path',{d:`M${f2(a[0])},${f2(a[1])}L${f2(b[0])},${f2(b[1])}`,class:c});}
frame([[-TW,-TW,0,SW+TW,FY+LD+TW,SZ+SR],[-8,-6,0,44,46,0]],6);
// State: the cab's travel (planned for smooth acceleration), the doors, and the calls a collective control serves in turn.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const VMAX=1.45,TA=1.05,T_OPEN=820,T_CLOSE=980,DWELL=2600,HOLD=5200,TRIPS=[[2,4],[3,0],[1,3],[4,1],[0,2]];
const car=new Set(),up=new Set(),dn=new Set(),Q={c:car,u:up,w:dn};
let pos=0,vel=0,plan=null,dir=0,lantern=0,door=0,doorPh='closed',closeAt=0,held=false,last=0;
let mode='free',prog=0,goal=0,finishing=false,complete=false,note='',noteT=0,userAt=-1e9,idleSince=-1,trip=null,tripI=0,drawn='',lastUI='';
const say=m=>{announcement.textContent=m;},flag=(m,ms=1600)=>{note=m;noteT=performance.now()+ms;};
let ac=null,hum=null;
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();const o=ac.createOscillator(),fl=ac.createBiquadFilter();o.type='sawtooth';o.frequency.value=62;fl.type='lowpass';fl.frequency.value=260;hum=ac.createGain();hum.gain.value=0;o.connect(fl);fl.connect(hum);hum.connect(ac.destination);o.start();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function tone(f,d,v,w=0,type='sine'){if(!ac)return;try{const t=ac.currentTime+w,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.006);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(ac.destination);o.start(t);o.stop(t+d+.05);}catch(_){}}
function bell(f,w){tone(f,1.6,.035,w);tone(f*2.76,.5,.008,w);tone(f*5.4,.18,.004,w);}
// The hall chime: once going up, twice going down; a rising three for the top on completion.
const chime=d=>{if(d<0){bell(1318.5,0);bell(1046.5,.42);}else bell(1318.5,0);},fanfare=()=>{bell(1318.5,0);bell(1568,.3);bell(2093,.6);},click=()=>tone(1900,.025,.012,0,'square');
// Lift music while the cab travels: an original arpeggio over I–vi–ii–V in C, soft and low, only with sound on.
const MUS=[[261.6,329.6,392,493.9],[220,261.6,329.6,392],[293.7,349.2,440,523.3],[196,246.9,293.7,349.2]],PAT=[0,1,2,3,2,1,2,1];let mus=0,musI=0;
function music(){if(!ac||!plan)return;const t=ac.currentTime;if(mus<t)mus=t+.02;while(mus<t+.12){const ch=MUS[(musI>>3)%4];tone(ch[PAT[musI%8]]*2,.45,.0045,mus-t,'triangle');if(musI%8===0)tone(ch[0],.9,.004,mus-t);mus+=.19;musI++;}}
// Travel: raised-cosine ramps to a cruise and back to rest, re-planned from the current speed when the next stop changes.
function segs(v0,D){if(D<v0*v0*TA/(2*VMAX))return[{T:2*D/max(v0,1e-3),a:v0,b:0}];let v1=sqrt((2*D*VMAX/TA+v0*v0)/2),cr=0;
if(v1>VMAX){v1=VMAX;cr=(D-(v0+v1)/2*TA*(v1-v0)/VMAX-v1*v1*TA/(2*VMAX))/v1;}return[{T:TA*(v1-v0)/VMAX,a:v0,b:v1},{T:cr,a:v1,b:v1},{T:TA*v1/VMAX,a:v1,b:0}].filter(s=>s.T>1e-4);}
function go(to,t){const d=Math.sign(to-pos)||1;plan={t0:t,p0:pos,d,to,s:segs(max(0,vel*d),abs(to-pos))};}
const stopDist=()=>vel*vel*TA/(2*VMAX);
function sample(t){let u=(t-plan.t0)/1000,p=0;for(const s of plan.s){if(u<s.T){const k=u/s.T;return[plan.p0+plan.d*(p+s.a*u+(s.b-s.a)/2*(u-s.T/PI*sin(PI*k))),plan.d*(s.a+(s.b-s.a)*(1-cos(PI*k))/2)];}p+=(s.a+s.b)/2*s.T;u-=s.T;}return null;}
/* Collective control, on a set of calls (the live ones, or a copy for the readout's queue): going one way it stops for car
 * calls and calls that way, then turns round at the farthest call the other way; idle, it goes to the nearest call. */
const has=(s,f)=>s.c.has(f)||s.u.has(f)||s.w.has(f),past=(s,f,d)=>[0,1,2,3,4].some(g=>(d>0?g>f:g<f)&&has(s,g));
function nextIn(s,p,d,m){const same=d>0?s.u:s.w,other=d>0?s.w:s.u,ok=f=>d>0?f>=p+m-1e-3:f<=p-m+1e-3;
for(let i=0;i<N;i++){const f=d>0?i:N-1-i;if(ok(f)&&(s.c.has(f)||same.has(f)))return f;}for(let i=0;i<N;i++){const f=d>0?N-1-i:i;if(ok(f)&&other.has(f))return f;}return null;}
function serveIn(s,f,d){s.c.delete(f);if(d>0&&!(s.u.has(f)||past(s,f,1)))d=s.w.has(f)||past(s,f,-1)?-1:0;else if(d<0&&!(s.w.has(f)||past(s,f,-1)))d=s.u.has(f)||past(s,f,1)?1:0;else if(!d)d=s.u.has(f)?1:s.w.has(f)?-1:0;
if(d>0)s.u.delete(f);else if(d<0)s.w.delete(f);return d;}
function chooseIn(s,f0,d){if(d&&past(s,f0,d))return[nextIn(s,f0+d*.5,d,0),d];if(d&&past(s,f0,-d))return[nextIn(s,f0-d*.5,-d,0),-d];
let best=null;for(let f=0;f<N;f++)if(f!==f0&&has(s,f)&&(best===null||abs(f-f0)<abs(best-f0)))best=f;if(best===null)return[null,0];const nd=Math.sign(best-f0);return[nextIn(s,f0+nd*.5,nd,0),nd];}
function queue(){const s={c:new Set(car),u:new Set(up),w:new Set(dn)},out=[];let f=round(pos),d=dir;
if(plan){f=plan.to;if(has(s,f))out.push(f);d=serveIn(s,f,plan.d);}for(let i=0;i<N;i++){const[n,nd]=chooseIn(s,f,d);if(n===null)break;out.push(n);d=serveIn(s,n,nd);f=n;}return out;}
const any=f=>has(Q,f),at=()=>!plan&&abs(pos-round(pos))<1e-6?round(pos):-1;
function openDoors(){if(doorPh==='open'||doorPh==='opening')return;doorPh='opening';if(ac)tone(220,.5,.006,0,'triangle');}
function arrive(f){pos=f;vel=0;plan=null;if(!any(f))return;const top=finishing&&f===N-1;dir=lantern=serveIn(Q,f,dir);held=false;openDoors();
if(top){finishing=false;complete=true;if(ac)fanfare();say(`Complete: the cab is at floor ${N}, the top.`);return;}
if(ac)chime(lantern);if(performance.now()-userAt<20000)say(`Floor ${f+1}${lantern>0?', going up':lantern<0?', going down':''}.`);}
/* A call at the floor the cab stands at opens its doors, or keeps them open; a call the other way waits if it's going on. */
function here(f,d){if(at()!==f||d&&dir&&d!==dir&&past(Q,f,dir))return false;if(d)dir=d;lantern=d;if(doorPh==='closed'||doorPh==='closing')openDoors();else closeAt=max(closeAt,performance.now()+DWELL);return true;}
function user(){audio();userAt=performance.now();trip=null;click();}
function hall(f,d,by){if(by)user();if(d>0&&f>=N-1||d<0&&f<=0)return;const h=here(f,d);if(!h)(d>0?up:dn).add(f);flag(h?`FLOOR ${f+1} · HERE`:`CALL ${d>0?'▲':'▼'} · FLOOR ${f+1}`);if(by)say(h?`The cab is here, on floor ${f+1}.`:`${d>0?'Up':'Down'} call on floor ${f+1}.`);}
function send(f,by){if(by)user();const h=here(f,0);if(!h)car.add(f);flag(h?`FLOOR ${f+1} · HERE`:`CAR CALL · FLOOR ${f+1}`);if(by)say(h?`The cab is here, on floor ${f+1}.`:`Going to floor ${f+1}.`);}
/* ↑ presses the next up button above the cab (past the top it starts again from the bottom), ↓ the next down button below. */
function callDir(d){const f0=round(pos);for(let i=1;i<=N;i++){const f=((f0+d*i)%N+N)%N;if((d>0?f<N-1:f>0)&&!(d>0?up:dn).has(f)){hall(f,d,true);return;}}user();flag(`EVERY ${d>0?'▲':'▼'} BUTTON LIT`);}
function hold(){user();if(at()<0){flag('IN MOTION · DOORS SHUT');return;}held=true;if(doorPh==='closed'||doorPh==='closing')openDoors();closeAt=performance.now()+HOLD;flag('DOORS HELD');say('Holding the doors open.');}
function shut(){user();if(doorPh==='open'||doorPh==='opening'){doorPh='closing';held=false;flag('CLOSING DOORS');say('Closing the doors.');}else flag(doorPh==='closing'?'DOORS CLOSING':'DOORS SHUT');}
// The page's progress: the floors are its steps (each quarter a floor up); done takes the cab to the top, where it rests.
function takeOver(){if(mode!=='det'){car.clear();up.clear();dn.clear();trip=null;}mode='det';complete=finishing=false;car.clear();}
function setProgress(p){if(p==null||!isFinite(p)){if(mode==='det'){mode='free';complete=finishing=false;car.clear();}return;}
takeOver();prog=clamp(+p);goal=min(N-1,Math.floor(prog*(N-1)+1e-6));if(at()!==goal)depart(goal);}
/* The page moved on: the cab closes its doors now and leaves for the floor. */
function depart(f){car.add(f);if(doorPh==='open'||doorPh==='opening'){doorPh='closing';held=false;}}
function finish(){takeOver();prog=1;goal=N-1;if(at()===N-1){complete=true;openDoors();if(ac)fanfare();say(`Complete: the cab is at floor ${N}, the top.`);}else{finishing=true;depart(N-1);}}
window.figure={setProgress,done:finish};
const act={o:hold,c:shut,ArrowUp:()=>callDir(1),ArrowDown:()=>callDir(-1)};
document.addEventListener('keydown',e=>{if(e.ctrlKey||e.metaKey||e.altKey||e.defaultPrevented)return;const k=e.key.length===1?e.key.toLowerCase():e.key;
if(/^[1-5]$/.test(k)){e.preventDefault();if(!e.repeat)send(+k-1,true);return;}const fn=act[k];if(fn){e.preventDefault();if(!e.repeat)fn();}});
// Drawing the state: the cab and counterweight, ropes, the sheave, every dial's needle, the doors at the cab's floor, lamps.
function render(){const cz0=pos*H,f0=at(),o=(1-cos(PI*door))/2,key=[cz0.toFixed(3),o.toFixed(3),f0].join();if(key===drawn)return;drawn=key;
set(cabG,'transform',`translate(0 ${f2(-cz0)})`);set(wG,'transform',`translate(0 ${f2(cz0)})`);
const seg=(a,b)=>`M${f2(a[0])},${f2(a[1])}L${f2(b[0])},${f2(b[1])}`,cd=seg(P(HX,HY,FL(0)+cz0+CH+2.4),P(HX,HY,SB)),wd=seg(P(HX,WY,WZ0+WH+.9-cz0),P(HX,WY,SB));
for(const n of cRope)set(n,'d',cd);for(const n of wRope)set(n,'d',wd);
{const zc=FL(0)+cz0-1.8,zb=min(zc,max(.4+TCR,(TCA+zc+PI*TCR-TCL)/2));set(tCable,'d',`M-1,${f2(-TCA)}V${f2(-zb)}A${TCR},${TCR} 0 0 1 ${-1-2*TCR},${f2(-zb)}V${f2(-zc)}`);}
set(spin,'transform',`rotate(${f2(cz0/SR*180/PI)})`);const na=`rotate(${f2(-(162-pos*36))})`;for(const n of needles)set(n,'transform',na);
doors.forEach((d,k)=>{const e=k===f0?o:0;if(e===d.o)return;d.o=e;const w=DW/2*(1-e),hide=w<.05?'none':'inline';
set(d.L,'width',f2(w));set(d.R,'x',f2(DW/2+DW/2*e));set(d.R,'width',f2(w));for(const n of[d.L,d.R,d.a,d.b])set(n,'display',hide);
set(d.a,'x1',f2(w-.6));set(d.a,'x2',f2(w-.6));set(d.b,'x1',f2(DW-w+.6));set(d.b,'x2',f2(DW-w+.6));});}
function lamps(){const f0=at(),show=f0>=0&&doorPh!=='closed';
lanterns.forEach((l,k)=>{lit(l.lu,show&&k===f0&&lantern>0?'up':'','lan');lit(l.ld,show&&k===f0&&lantern<0?'dn':'','lan');});
calls.forEach((c,k)=>{if(c[1])lit(c[1],up.has(k)?'on':'','cb');if(c[-1])lit(c[-1],dn.has(k)?'on':'','cb');});
cops.forEach((n,k)=>lit(n,car.has(k)?'on':'','cop'));lit(cled,plan?'a':'g','led');}
function ui(){const t=performance.now(),q=queue(),d=dir||(q.length?Math.sign(q[0]-round(pos)):0),arrow=(plan||q.length)&&d?d>0?' ▲':' ▼':'';
const r=`${round(pos)+1}${arrow} · ${q.length?`NEXT ${q.map(f=>f+1).join(', ')}`:plan?`NEXT ${plan.to+1}`:'IDLE'}`;
const s=t<noteT?note:mode==='det'?(complete?`COMPLETE · STEP ${N} OF ${N}`:finishing?`FINISHING · STEP ${N} OF ${N}`:`PROGRESS ${round(prog*100)}% · STEP ${goal+1} OF ${N}`)
:plan?(plan.d>0?'GOING UP':'GOING DOWN'):doorPh==='opening'?'ARRIVED · DOORS OPENING':doorPh==='open'?(held?'DOORS HELD':'DOORS OPEN'):doorPh==='closing'?'DOORS CLOSING':'IDLE · DOORS CLOSED';
if(r+s!==lastUI){lastUI=r+s;readout.textContent=r;stateLabel.textContent=s;}}
function tick(t){const dt=last?min(50,t-last):16,red=reduced.matches;last=t;
if(plan){if(red)arrive(plan.to);else{const s=sample(t);if(!s)arrive(plan.to);else{[pos,vel]=s;const m=stopDist()*.98,n=nextIn(Q,pos,plan.d,m);
if(any(plan.to)){if(n!==null&&(plan.d>0?n<plan.to:n>plan.to))go(n,t);}else{const r=n!==null?n:clamp(plan.d>0?Math.ceil(pos+m-1e-3):Math.floor(pos-m+1e-3),0,N-1);if(r!==plan.to)go(r,t);}}}}
if(doorPh==='opening'){door=red?1:min(1,door+dt/T_OPEN);if(door>=1){doorPh='open';closeAt=t+(held?HOLD:DWELL);}}
else if(doorPh==='open'){if(t>=closeAt){doorPh='closing';held=false;}}
else if(doorPh==='closing'){door=red?0:max(0,door-dt/T_CLOSE);if(door<=0){doorPh='closed';lantern=0;if(ac)tone(160,.18,.01,0,'triangle');}}
if(!plan&&doorPh==='closed'){const f0=round(pos);if(mode==='det'&&!finishing&&f0!==goal)car.add(goal);
if(any(f0))arrive(f0);else{const[n,nd]=chooseIn(Q,f0,dir);dir=nd;if(n!==null){idleSince=-1;if(ac)tone(90,.12,.02,0,'triangle');if(red)arrive(n);else go(n,t);}else if(idleSince<0)idleSince=t;}}
else idleSince=-1;
// Left alone it serves the building: a call from one floor, then a ride to another.
if(mode==='free'&&!red&&!trip&&idleSince>=0&&t-idleSince>(tripI?2800:1400)&&t-userAt>9000){const[a,b]=TRIPS[tripI++%TRIPS.length];trip={a,b,p:0};hall(a,Math.sign(b-a),false);}
if(trip){const f0=at();if(trip.p===0&&f0===trip.a&&doorPh!=='closed'){trip.p=1;trip.t=t+700;}else if(trip.p===1&&t>=trip.t){trip.p=2;send(trip.b,false);}else if(trip.p===2&&f0===trip.b&&doorPh!=='closed')trip=null;}
if(hum){hum.gain.setTargetAtTime(min(1,abs(vel)/VMAX)*.012,ac.currentTime,.08);if(!red)music();}
render();lamps();ui();requestAnimationFrame(tick);}
render();lamps();ui();requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
