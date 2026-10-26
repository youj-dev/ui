// @ts-nocheck
/* TORVIK K–75 · Mechanical keyboard. Drawn for this project on the shared engine, in the shape the ported figures
 * take: its stylesheet, defs and script. The script runs on the env, which stands in for the page; its types are
 * at the boundary (FigureModule). */
import type { FigureEnv, FigureModule } from '../engine/types'

const css = `:root{color-scheme:light dark;--bg:#f4f3ef;--ink:#323232;--muted:#808080;--top:#fafaf8;--body:#e0e0dc;--side:#c7c7c3;--base:#b6b6b3;--recess:#9d9d99;--glass:#ededeb;--line:#626260;--accent:#3b5bfd;--rule:#d6d6d2;--shadow:#262626;--case:#d3d3cf;--case-top:#e6e6e2;--case-side:#babab6;--wall:#a9a9a5;--well:#2c2c2d;--frost:#eeece6;--etch:#9a9a95;--cr:#e4ddcf;--cr-top:#f5f1e7;--cr-side:#cec6b6;--cr-ink:#4a463f;--gr:#505257;--gr-top:#63666b;--gr-side:#3e4044;--gr-ink:#ece7da;--or:#d9653a;--or-top:#ee7d4f;--or-side:#b9522d;--or-ink:#fff4ea;--mat:#30333a;--mat-top:#3d414a;--mat-side:#26292e;--hem:#6a6f7b;--tag:#e9e4d8;--kn:#d2d3d0;--kn-top:#ececea;--kn-side:#b3b4b1;--collar:#3a3b3d;--coil:#e0693c;--coil-b:#b9532d;--coil-u:#7d3418;--led:#7dffa8;--led-off:#8f8b83}
@media(prefers-color-scheme:dark){:root{--bg:#1a1917;--ink:#e8e8e8;--muted:#929292;--rule:#32312e;--accent:#617cff;--shadow:#000;--top:#eaeae8;--body:#bdbdba;--side:#8c8c8b;--base:#999997;--recess:#6e6e6c;--glass:#c8c8c6;--case:#b2b2af;--case-top:#d7d7d3;--case-side:#838381;--wall:#8e8e8b;--well:#232324;--frost:#c8c7c3;--etch:#8a8a86;--cr:#c0baae;--cr-top:#e5e1d8;--cr-side:#918b80;--cr-ink:#3b3833;--gr:#424447;--gr-top:#5c5f64;--gr-side:#2a2a2c;--gr-ink:#ddd8cc;--or:#b7542f;--or-top:#df7549;--or-side:#82371d;--or-ink:#f6eadf;--mat:#27292e;--mat-top:#383c45;--mat-side:#191a1c;--hem:#5c616c;--tag:#cfcac0;--kn:#b1b2b0;--kn-top:#dddddb;--kn-side:#7e7e7d;--collar:#2b2c2d;--coil:#bd5731;--coil-b:#8f3f22;--coil-u:#4a1d0c;--led-off:#6d6a64;--line:#444443}svg{--ink:#282828;--muted:#6b6b6b}.bloom{mix-blend-mode:screen}}
.face{fill:var(--body);stroke:var(--line);stroke-width:1;vector-effect:non-scaling-stroke;stroke-linejoin:round}.top{fill:var(--top)}.side{fill:var(--side,var(--body))}.detail{fill:none;stroke:var(--line);stroke-width:.65;vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round}.center{text-anchor:middle}.end{text-anchor:end}.shadow{fill:var(--shadow);opacity:.075;filter:url(#soft)}
.case{fill:var(--case)}.top.case{fill:var(--case-top)}.side.case{fill:var(--case-side)}.wall{fill:var(--wall)}.well{fill:var(--well)}.mat{fill:var(--mat)}.top.mat{fill:var(--mat-top)}.side.mat{fill:var(--mat-side)}
.cr{fill:var(--cr)}.top.cr{fill:var(--cr-top)}.side.cr{fill:var(--cr-side)}.gr{fill:var(--gr)}.top.gr{fill:var(--gr-top)}.side.gr{fill:var(--gr-side)}.or{fill:var(--or)}.top.or{fill:var(--or-top)}.side.or{fill:var(--or-side)}
.kn{fill:var(--kn)}.top.kn{fill:var(--kn-top)}.side.kn{fill:var(--kn-side)}.collar{fill:var(--collar)}
.leg{font:600 2.3px system-ui,sans-serif;text-anchor:middle;stroke:none;pointer-events:none}.leg.s{font-size:1.45px;font-weight:500;letter-spacing:.08px}.c-cr .leg{fill:var(--cr-ink)}.c-gr .leg{fill:var(--gr-ink)}.c-or .leg{fill:var(--or-ink)}
.lf,.lt,.bloom ellipse{stroke:none;pointer-events:none;visibility:hidden}.bloom{pointer-events:none;filter:url(#kb)}.frost{fill:var(--frost);stroke:none}.strip{stroke:none;pointer-events:none;filter:url(#glow)}.pool{stroke:none;pointer-events:none;filter:url(#pool)}.pool.ground{fill:#000;opacity:.4}.strip.f,.pool.f{fill:url(#lgF)}.strip.r,.pool.r{fill:url(#lgR)}
.cl{fill:var(--led-off);stroke:none}.cl.on{fill:var(--led);filter:url(#glow)}.knurl{fill:none;stroke:var(--line);stroke-width:.28;opacity:.6}.ind{fill:none;stroke:var(--line);stroke-width:.6;stroke-linecap:round}
.hem{fill:none;stroke:var(--hem);stroke-width:.3;stroke-dasharray:1.3 1}.tag{fill:var(--tag);stroke:none}.tagt{fill:var(--mat);font:700 1.5px system-ui,sans-serif;letter-spacing:.35px;text-anchor:middle}.etch{fill:var(--etch);font:600 1.75px system-ui,sans-serif;letter-spacing:.7px;stroke:none}
.cu{fill:none;stroke:var(--coil-u);stroke-linecap:round;stroke-linejoin:round}.cb{fill:none;stroke:var(--coil);stroke-linecap:round;stroke-linejoin:round}.cbk{fill:none;stroke:var(--coil-b);stroke-linecap:round;stroke-linejoin:round}
.cap{cursor:pointer}.control{cursor:pointer;outline:none}.knob{cursor:grab}.knob.drag{cursor:grabbing}.focus-ring{fill:none;stroke:var(--accent);stroke-width:1.3;vector-effect:non-scaling-stroke;opacity:0}.control:focus-visible .focus-ring{opacity:1}
/* dark v2: night studio */:root{--stage-ink:var(--ink);--stage-muted:var(--muted)}.stage-contact,.stage-pool{display:none}@media(prefers-color-scheme:dark){.stage-floor,.stage-pool{fill:url(#stage-floor-fill);stroke:none;opacity:1;filter:none;transform:scale(1.5);transform-box:fill-box;transform-origin:center}.stage-pool{display:inline}.stage-contact{display:inline;fill:url(#stage-contact-fill);stroke:none;opacity:1;filter:none;transform:scale(.9);transform-box:fill-box;transform-origin:center}}`

const defs = `<filter id="pool" x="-25%" y="-90%" width="150%" height="280%"><feGaussianBlur stdDeviation="2.4"/></filter>
<filter id="kb" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1.6"/></filter>`

function draw(env: FigureEnv): void {
const{document,window,matchMedia,requestAnimationFrame,cancelAnimationFrame,setTimeout,clearTimeout,setInterval,clearInterval,addEventListener,removeEventListener,kit}=env;
/* TORVIK K–75 mechanical keyboard on a desk mat. World: x lower-right; y lower-left (the keys face +y); z up. 1 unit = 2.5 mm; a key is 7.6 (19.05 mm).
Part x y z w d h
desk mat (felt, stitched hem, woven tag) −18 −24 0 168 94 1
underglow pools on the mat, front and right −1.5 54 1 133 10 –
cord (fades out toward the back) −8 −31→−15 1.6–3.2 – – –
aviator plug: locking ring, barrel, strain relief −5.6 −15 3.2 9.4 r1.85 –
coiled cable (16 turns, r1.6) + drop from the case 3.8–24 −15→0 3.2–6 – – –
case (aluminum; frosted diffuser between the halves at z 3.6–4.9; the top falls 3.5 to the front) 0 0 1 130 56.5 10.5→7
well: floor and the two walls that face out 3.7 4.3 4.3–8.6 122.6 48.5 3.4
keys ×82 on six rows (the F-row 0.25 apart; heights 3.1–3.6 by row; travel 1.5) 4.2 4.8 7.7–14.2 121.6 47.5 –
knob: collar + knurled aluminum 122 8.6 10.6 r3.7 – 5.5
Legends, the caps-lock LED, lights and engravings share their parent face. */
const svg=document.getElementById('machine');let root=document.getElementById('drawing');
const{NS,C,S,OX,OY,P,matrix,set,TOP,FRONT,SIDE,el,group,rect,circle,line,text,poly,wire,box,ellipse,cylinder,slits,screw,frame}=kit(()=>root);
// Figure helpers: planes parallel to the sloped top, faces rounded in the drawing, smooth cords, colors.
const draw=root,dfs=svg.querySelector('defs'),into=g=>root=g,f2=v=>(+v).toFixed(2),clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),D2R=Math.PI/180;
const U=7.6,GP=.5,TR=1.7,ZM=1,W=130,D=56.5,HB=10.5,HF=7,K=(HB-HF)/D,X0=4.2,Y0=4.8,WD=3.4,zt=y=>ZM+HB-K*y;
const XW0=X0-.5,XW1=X0+16*U+.5,YW0=Y0-.5,YW1=Y0+6.25*U+.5;
const plane=(o,A,B)=>`matrix(${P(...A).map(f2).join(' ')} ${P(...B).map(f2).join(' ')} ${P(...o).map(f2).join(' ')})`,SL=o=>plane(o,[1,0,0],[0,1,-K]);
const rr=(x,y,w,h,r)=>`M${f2(x+r)},${f2(y)}H${f2(x+w-r)}Q${f2(x+w)},${f2(y)} ${f2(x+w)},${f2(y+r)}V${f2(y+h-r)}Q${f2(x+w)},${f2(y+h)} ${f2(x+w-r)},${f2(y+h)}H${f2(x+r)}Q${f2(x)},${f2(y+h)} ${f2(x)},${f2(y+h-r)}V${f2(y+r)}Q${f2(x)},${f2(y)} ${f2(x+r)},${f2(y)}Z`;
function rpath(pts,r){const p=pts.map(q=>P(...q)),n=p.length;let d='';
for(let i=0;i<n;i++){const b=p[i],R=Array.isArray(r)?r[i]:r,cut=a=>{const L=Math.hypot(a[0]-b[0],a[1]-b[1])||1,k=Math.min(R,L/2)/L;return f2(b[0]+(a[0]-b[0])*k)+','+f2(b[1]+(a[1]-b[1])*k);};
d+=(i?'L':'M')+cut(p[(i+n-1)%n])+'Q'+f2(b[0])+','+f2(b[1])+' '+cut(p[(i+1)%n]);}return d+'Z';}
function smooth(pts){const q=pts.map(p=>P(...p));let d=`M${f2(q[0][0])},${f2(q[0][1])}`;for(let i=0;i<q.length-1;i++){const a=q[i-1]||q[i],b=q[i],c=q[i+1],e=q[i+2]||q[i+1];d+=`C${f2(b[0]+(c[0]-a[0])/6)},${f2(b[1]+(c[1]-a[1])/6)} ${f2(c[0]-(e[0]-b[0])/6)},${f2(c[1]-(e[1]-b[1])/6)} ${f2(c[0])},${f2(c[1])}`;}return d;}
function cord(pts,w,parent=root){const d=smooth(pts);el('path',{d,class:'cu','stroke-width':w+.7},parent);el('path',{d,class:'cb','stroke-width':w},parent);}
function hsl(h,s,l){h=(h%360+360)%360/60;const c=(1-Math.abs(2*l-1))*s,x=c*(1-Math.abs(h%2-1)),m=l-c/2,[r,g,b]=h<1?[c,x,0]:h<2?[x,c,0]:h<3?[0,c,x]:h<4?[0,x,c]:h<5?[x,0,c]:[c,0,x];return[(r+m)*255,(g+m)*255,(b+m)*255];}

// Layout: six rows of tokens, id:legend:tone:width (a bare token is a cream 1u key, _w a gap, KNOB the knob's place).
const ROWS=[
'Escape:esc:o _.25 F1:F1:g F2:F2:g F3:F3:g F4:F4:g _.25 F5:F5 F6:F6 F7:F7 F8:F8 _.25 F9:F9:g F10:F10:g F11:F11:g F12:F12:g _.25 Delete:del:g KNOB',
'` 1 2 3 4 5 6 7 8 9 0 - = Backspace:⌫:g:2 Home:home:g',
'Tab:⇥:g:1.5 q w e r t y u i o p [ ] \\:\\:c:1.5 PageUp:pgup:g',
"CapsLock:⇪:g:1.75 a s d f g h j k l ; ' Enter:⏎:o:2.25 PageDown:pgdn:g",
'ShiftLeft:⇧:g:2.25 z x c v b n m , . / ShiftRight:⇧:g:1.75 ArrowUp:↑:g End:end:g',
'ControlLeft:⌃:g:1.25 AltLeft:⌥:g:1.25 MetaLeft:⌘:g:1.25 Space::c:6.25 MetaRight:⌘:g Fn:fn:g ControlRight:⌃:g ArrowLeft:←:g ArrowDown:↓:g ArrowRight:→:g'];
const RY=[0,1.25,2.25,3.25,4.25,5.25],RH=[3.4,3.6,3.3,3.1,3.3,3.2],TONE={c:'cr',g:'gr',o:'or'},KEYS={},LIST=[],capOf=new WeakMap();let KC=0;
ROWS.forEach((row,r)=>{let c=0;for(const t of row.split(' ')){if(t==='KNOB'){KC=c++;continue;}if(/^_[\d.]+$/.test(t)){c+=+t.slice(1);continue;}
const[id,lab,tone,w]=t.split(':'),k={id,r,w:+(w||1),tone:TONE[tone||'c'],lab:lab??(id.length===1?id.toUpperCase():id),x:X0+c*U,y:Y0+RY[r]*U,h:RH[r],pos:0,vel:0,lo:-1};
k.cx=k.x+k.w*U/2;k.cy=k.y+U/2;KEYS[id]=k;LIST.push(k);c+=k.w;}});
KEYS[' ']=KEYS.Space;for(const m of['Shift','Control','Alt','Meta'])KEYS[m]=KEYS[m+'Left'];KEYS.OS=KEYS.MetaLeft;KEYS.NumpadEnter=KEYS.Enter;
const SHF={'!':'1','@':'2','#':'3','$':'4','%':'5','^':'6','&':'7','*':'8','(':'9',')':'0','_':'-','+':'=','{':'[','}':']','|':'\\',':':';','"':"'",'<':',','>':'.','?':'/','~':'`'};
const CODE={Backquote:'`',Minus:'-',Equal:'=',BracketLeft:'[',BracketRight:']',Backslash:'\\',Semicolon:';',Quote:"'",Comma:',',Period:'.',Slash:'/'};
function keyOf(e){const k=e.key||'',c=e.code||'';if(k===' ')return KEYS.Space;if(k.length===1){const b=SHF[k]||k.toLowerCase();if(b.length===1&&KEYS[b])return KEYS[b];}
return KEYS[c]||KEYS[CODE[c]]||(/^Key[A-Z]$/.test(c)?KEYS[c[3].toLowerCase()]:/^Digit\d$/.test(c)?KEYS[c[5]]:KEYS[k])||null;}

// Shadows; the desk mat with its stitched hem and a woven tag.
{const g=group(TOP(-18,-24,0));rect(g,-3,-2,174,98,12,'shadow stage-floor');rect(g,-3,-2,174,98,12,'stage-contact');}
box(-18,-24,0,168,94,ZM,2.6,'mat');
{const t=group(TOP(-18,-24,ZM));rect(t,1.7,1.7,164.6,90.6,1.8,'hem');rect(t,5,85.4,10.4,4.6,.5,'tag');text(t,10.2,88.2,'TORVIK','tagt');}
// Underglow: two soft pools on the mat, colored by the same gradients as the diffuser (front: along x; right: along −y).
const NF=27,NR=12,grad=(id,len,n)=>{const g=el('linearGradient',{id,gradientUnits:'userSpaceOnUse',x1:0,y1:0,x2:len,y2:0},dfs);return Array.from({length:n},(_,i)=>el('stop',{offset:f2(i/(n-1)),'stop-opacity':0},g));};
const SF=grad('lgF',W,NF),SR=grad('lgR',D,NR);
rect(group(TOP(0,0,ZM)),-1.2,-1.2,W+2.4,D+2.4,3,'pool ground');rect(group(TOP(0,0,ZM)),-1.5,D-2.5,W+3,10,4,'pool f');rect(group(plane([W,D,ZM],[0,-1,0],[1,0,0])),-1.5,-2.5,D+3,10,4,'pool r');
// Cable: the cord away to the back (fading out), the aviator plug, the coil lying on the mat, the drop from the case.
const CR=1.5,CW=1,CZ=ZM+CR+CW/2;
{const a=P(-9.8,-21,ZM),b=P(-10,-30,ZM),fg=el('linearGradient',{id:'fade',gradientUnits:'userSpaceOnUse',x1:f2(a[0]),y1:f2(a[1]),x2:f2(b[0]),y2:f2(b[1])},dfs);el('stop',{offset:0,'stop-color':'#fff'},fg);el('stop',{offset:1,'stop-color':'#000'},fg);
const m=el('mask',{id:'tail',maskUnits:'userSpaceOnUse',x:-80,y:-60,width:160,height:120},dfs);el('rect',{x:-80,y:-60,width:160,height:120,fill:'url(#fade)'},m);
cord([[-7.6,-17,CZ],[-8.8,-17.6,CZ-.9],[-9.8,-20.5,ZM+CW/2],[-10,-25,ZM+CW/2],[-10.1,-31,ZM+CW/2]],CW,el('g',{mask:'url(#tail)'}));}
cylinder(-7.7,-17,CZ,1.8,2.3,'x','kn');cylinder(-5.4,-17,CZ,1.5,5.4,'x','kn');cylinder(0,-17,CZ,1,1.8,'x','collar');
{const A=[24,-9.2],Q=[13,-17.4],B=[1.8,-17],T=10,N=T*16,at=s=>[(1-s)**2*A[0]+2*(1-s)*s*Q[0]+s*s*B[0],(1-s)**2*A[1]+2*(1-s)*s*Q[1]+s*s*B[1]];
const tan=s=>{const x=2*(1-s)*(Q[0]-A[0])+2*s*(B[0]-Q[0]),y=2*(1-s)*(Q[1]-A[1])+2*s*(B[1]-Q[1]),l=Math.hypot(x,y);return[x/l,y/l];};
const pt=s=>{const[ax,ay]=at(s),[tx,ty]=tan(s),th=2*Math.PI*T*s,c=Math.cos(th),sn=Math.sin(th);return{p:P(ax-CR*c*ty,ay+CR*c*tx,CZ+CR*sn),f:CR*c*(tx-ty)+CR*sn>0};};
let back='',front='',prev=pt(0),side=null;
for(let i=1;i<=N;i++){const q=pt(i/N),f=pt((i-.5)/N).f,s=`${f2(q.p[0])},${f2(q.p[1])}`;
if(f!==side){side=f;const m=`M${f2(prev.p[0])},${f2(prev.p[1])}`;if(f)front+=m;else back+=m;}
if(f)front+='L'+s;else back+='L'+s;prev=q;}
el('path',{d:back,class:'cu','stroke-width':CW+.6});el('path',{d:back,class:'cbk','stroke-width':CW-.1});el('path',{d:front,class:'cu','stroke-width':CW+.7});el('path',{d:front,class:'cb','stroke-width':CW});}
cord([[26,1,ZM+5.4],[26,-2.6,ZM+4.8],[25.4,-6.4,ZM+3.1],[24,-9.2,CZ]],CW);

// Case: the right side and the front, each split by the frosted diffuser; the well; the sloped top.
el('path',{d:rpath([[W,D,ZM],[W,0,ZM],[W,0,ZM+HB],[W,D,ZM+HF]],[1,.6,1.2,1.4]),class:'face side case'});
const cf=group(FRONT(0,D,ZM+HF));rect(cf,0,0,W,HF,1.4,'face case');
const cs=group(SIDE(W,D,ZM));
for(const[g,u0,len,v,cls]of[[cf,0,W,HF-4.9,'strip f'],[cs,0,D,-4.9,'strip r']]){rect(g,u0+.9,v,len-1.8,1.3,.4,'frost');rect(g,u0+.9,v,len-1.8,1.3,.4,cls);line(g,u0+.9,v,u0+len-.9,v);line(g,u0+.9,v+1.3,u0+len-.9,v+1.3);}
rect(group(SL([XW0,YW0,zt(YW0)-WD])),0,0,XW1-XW0,YW1-YW0,0,'face well');
rect(group(FRONT(XW0,YW0,zt(YW0))),0,0,XW1-XW0,WD,0,'face wall');
el('path',{d:poly([[XW0,YW0,zt(YW0)],[XW0,YW1,zt(YW1)],[XW0,YW1,zt(YW1)-WD],[XW0,YW0,zt(YW0)-WD]],true),class:'face side wall'});
const TP=SL([0,0,zt(0)]),RIM=rr(0,0,W,D,2.4)+rr(XW0,YW0,XW1-XW0,YW1-YW0,.8);
el('path',{d:RIM,transform:TP,class:'face top case','fill-rule':'evenodd'});

// Keys: a tapered cap on the sloped plate (front and right faces, rounded top, legend), with its light on the skirts.
function cap(k){const g=el('g',{class:'cap c-'+k.tone,'data-yj-key':k.id});into(g);
const zb=y=>zt(y)-.6,x0=k.x+GP/2,x1=k.x+k.w*U-GP/2,y0=k.y+GP/2,y1=k.y+U-GP/2,h=k.h,ta=x0+.95,tb=x1-.95,tc=y0+.55,td=y1-1.35,zz=y=>zb(y)+h;
const B0=[x0,y1,zb(y1)],B1=[x1,y1,zb(y1)],B2=[x1,y0,zb(y0)],T0=[ta,td,zz(td)],T1=[tb,td,zz(td)],T2=[tb,tc,zz(tc)];
el('path',{d:rpath([B0,B1,T1,T0],[.6,.5,.4,.4]),class:'face '+k.tone});
el('path',{d:rpath([B1,B2,T2,T1],[.5,.6,.4,.4]),class:'face side '+k.tone});
k.lf=el('path',{d:rpath([B0,B1,B2,T2,T1,T0],[.6,.5,.6,.4,0,.4]),class:'lf'});
const t=group(SL([ta,tc,zz(tc)])),tw=tb-ta,th=td-tc;rect(t,0,0,tw,th,.9,'face top '+k.tone);k.lt=rect(t,0,0,tw,th,.9,'lt');
if(k.lab){const fk=/^F\d/.test(k.lab),s=k.lab.length>1&&!fk,n=text(t,tw/2,th/2+(s?.5:fk?.55:.8),k.lab,'leg'+(s?' s':''));if(fk)n.style.fontSize='1.6px';}
if(k.id==='CapsLock')k.led=rect(t,.7,th/2-.38,1.25,.76,.38,'cl');
into(draw);k.g=g;capOf.set(g,k);}
// Knob: a dark collar, the knurled aluminum body (its knurls redrawn as it turns), a groove and the pointer on top.
function knob(){const x=X0+(KC+.5)*U,y=Y0+.5*U,z=zt(y)-.6,r=3.7,h=4.3;
const g=el('g',{class:'control knob',role:'slider',tabindex:'0','aria-label':'Volume knob (Up and Down arrows)','aria-valuemin':'0','aria-valuemax':'100','aria-valuenow':'40','aria-valuetext':'40%'});into(g);
cylinder(x,y,z,r+.45,1.2,'z','collar');const c=cylinder(x,y,z+1.2,r,h,'z','kn'),kn=el('path',{class:'knurl'},c.g);c.g.insertBefore(kn,c.face);
circle(c.face,0,0,r*.74,'detail');const rot=group('',c.face);line(rot,0,-.7,0,-r*.62,'ind');circle(c.face,0,0,r+1.3,'focus-ring');
into(draw);return{g,kn,rot,x,y,z0:z+1.2,r,h};}
let KB;for(const k of LIST){cap(k);if(k.id==='Delete')KB=knob();}
// The front and right rims again, over the bottoms of the caps nearest them (the caps sit in the well).
{const cl=el('clipPath',{id:'rim'},dfs);el('path',{d:`M${X0},${f2(YW1-.9)}H${f2(XW1-.9)}V${f2(Y0+U)}H${W+3}V${f2(D+3)}H${X0}Z`,transform:TP},cl);
el('path',{d:RIM,transform:TP,class:'face top case','fill-rule':'evenodd'},el('g',{'clip-path':'url(#rim)'}));
const t=group(TP);text(t,X0+.4,D-1.25,'TORVIK','etch');text(t,W-X0-.4,D-1.25,'K–75','etch end');}
// Bloom: a soft spot of each key's light over the board, screened in the dark.
{const t=group(SL([0,0,zt(0)+.4]),el('g',{class:'bloom'}));for(const k of LIST)k.lb=el('ellipse',{cx:f2(k.cx),cy:f2(k.cy+U*.4),rx:f2(k.w*U*.46),ry:f2(U*.26)},t);}
frame([[-18,-24,0,168,94,ZM],[0,0,0,W,D,16.5],[-9,-31,0,1,1,1]],6);

// State: lights, volume and the knob, caps lock, the typed line, sound and the idle demo.
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),darkQ=matchMedia('(prefers-color-scheme: dark)');
const readout=document.getElementById('readout'),stateLabel=document.getElementById('state'),announcement=document.getElementById('announcement');
const MODES=['RIPPLE','WAVE','BREATHE','OFF'],PHRASES=['hello world','git push','npm run dev','the quick brown fox'],SPD=85,RW=6.2,DEC=.5;
const moving=new Set(),RIP=[],demo={on:false,p:0,c:0,t:0};
const SP=[...SF.map((s,i)=>({s,x:W*i/(NF-1),y:D})),...SR.map((s,i)=>({s,x:W,y:D-D*i/(NR-1)}))];
let vol=40,muted=false,ka=-27,kaT=-27,kaD=null,lmode=0,hue=200,caps=false,echo='',hist=[],msg='',msgT=0,lt=0,lastUI=0,lastIn=performance.now(),meterT=-1e9,wasMeter=false,lDirty=true,ac=null,out=null,nb=null,sayT=0,drag=null;
function say(m){announcement.textContent=m;}
function note(m,a){msg=m;msgT=performance.now()+1400;lastUI=0;if(a)say(a);}
function audio(){try{const A=window.AudioContext||window.webkitAudioContext;if(!A)return;if(!ac){ac=new A();out=ac.createGain();out.connect(ac.destination);nb=ac.createBuffer(1,ac.sampleRate/4,ac.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<d.length;i++)d[i]=Math.random()*2-1;level();}if(ac.state==='suspended')ac.resume().catch(()=>{});}catch(_){ac=null;}}
function level(){if(out)out.gain.value=muted?0:.15+.85*vol/100;}
function nz(at,f,v,d,q=1.2,type='bandpass'){if(!ac)return;const t=ac.currentTime+at,s=ac.createBufferSource(),b=ac.createBiquadFilter(),g=ac.createGain();s.buffer=nb;b.type=type;b.frequency.value=f;b.Q.value=q;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(b);b.connect(g);g.connect(out);s.start(t,Math.random()*.15,d+.03);}
function tn(at,f,v,d,type='sine'){if(!ac)return;const t=ac.currentTime+at,o=ac.createOscillator(),g=ac.createGain();o.type=type;o.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(out);o.start(t);o.stop(t+d+.03);}
// A thock on the way down (deeper for the long keys), a lighter clack on the way up; the space bar's stabilizer rattles.
function thock(k,down){if(!ac)return;const sp=k.id==='Space',big=k.w>=1.75;
if(down){nz(0,sp?700:big?1100:1500,sp?.07:.05,.025,.9);tn(0,sp?105:big?150:185,.06,.05,'triangle');nz(.006,4200,.02,.008,3);}
else{nz(0,sp?1300:2400,.025,.014,1.4);if(sp)for(const a of[.012,.03,.05])nz(a,5200,.012,.006,5);}}
function user(){lastIn=performance.now();if(demo.on){demo.on=false;echo='';lastUI=0;}audio();}
// A key goes down at once and comes back up no sooner than 75 ms later, so a tap through press() still shows; a key
// pressed again before it is back up goes down again (only one that is still held is refused).
function press(k,src,now){if(k.down&&!k.rel)return false;k.down=true;k.src=src;k.t0=now;k.rel=0;k.auto=0;moving.add(k);if(src!=='demo')thock(k,true);flash(k,now);return true;}
function release(k,now){if(k.down&&!k.rel)k.rel=Math.max(now,k.t0+75);}
function flash(k,now){lDirty=true;if(lmode===3)return;k.hc=lmode===0?hsl(hue,.95,darkQ.matches?.6:.56):[255,255,255];if(lmode===0)hue=(hue+13)%360;if(reduced.matches)return;
RIP.push(lmode===0?{x:k.cx,y:k.cy,t0:now,c:k.hc}:{x:k.cx,y:k.cy,t0:now,f:1,c:k.hc});if(RIP.length>10)RIP.shift();}
function setCaps(v,quiet){caps=v;KEYS.CapsLock.led.classList.toggle('on',v);lastUI=0;if(!quiet)note(v?'CAPS LOCK ON':'CAPS LOCK OFF',v?'Caps lock on.':'Caps lock off.');}
function volBy(d,now){const v=clamp(vol+d*5,0,100);muted=false;meterT=now;if(v!==vol){vol=v;kaT=-135+2.7*vol;if(ac)nz(0,5200,.03,.006,4);}level();lastUI=0;
set(KB.g,'aria-valuenow',vol);set(KB.g,'aria-valuetext',`${vol}%`);clearTimeout(sayT);sayT=setTimeout(()=>say(`Volume ${vol}.`),400);}
function mute(now){muted=!muted;meterT=now;level();lastUI=0;set(KB.g,'aria-valuetext',muted?'muted':`${vol}%`);say(muted?'Muted.':`Volume ${vol}.`);}
function cycle(d){lmode=(lmode+d+4)%4;RIP.length=0;lDirty=true;lastUI=0;say(`Lighting: ${MODES[lmode].toLowerCase()}.`);}
function type(ch,now,demoed){echo=(echo+ch).slice(-40);if(!demoed){hist.push(now);while(hist.length>1&&now-hist[0]>8000)hist.shift();}lastUI=0;}
function wpm(now){const n=hist.length;if(n<3||now-hist[n-1]>3000)return 0;const m=(hist[n-1]-hist[0])/60000;return m>0?Math.round((n-1)/5/m):0;}
// What a key does besides going down: the arrows turn the knob (↑ ↓) and switch the lighting (← →), fn too.
function act(k,ch,now){const id=k.id;
if(id==='CapsLock')setCaps(!caps);else if(id==='ArrowUp'||id==='ArrowDown')volBy(id==='ArrowUp'?1:-1,now);else if(id==='ArrowLeft'||id==='ArrowRight')cycle(id==='ArrowRight'?1:-1);else if(id==='Fn')cycle(1);
else if(id==='Backspace'){echo=echo.slice(0,-1);lastUI=0;}else if(id==='Enter'){echo='';hist=[];lastUI=0;}else if(ch)type(ch,now);}
document.addEventListener('keydown',e=>{if(e.defaultPrevented)return;const k=keyOf(e);if(!k)return;const now=performance.now(),id=k.id,mod=e.ctrlKey||e.metaKey||e.altKey,arrow=id.startsWith('Arrow'),onKnob=arrow&&document.activeElement===KB.g;
if(!mod&&(id.length===1||id==='Space'||arrow||id==='Backspace'))e.preventDefault();
user();if(e.isTrusted&&id!=='CapsLock'&&typeof e.getModifierState==='function'&&e.getModifierState('CapsLock')!==caps)setCaps(!caps,true);
if(e.repeat){if(!mod&&(id==='ArrowUp'||id==='ArrowDown'||onKnob))volBy(id==='ArrowUp'||id==='ArrowRight'?1:-1,now);return;}
if(!press(k,'key',now))return;if(e.metaKey&&!id.startsWith('Meta'))k.auto=1;if(id==='Tab')release(k,now);
if(mod)return;if(onKnob)volBy(id==='ArrowRight'?1:-1,now);else act(k,id==='Space'?' ':id.length===1?(e.key.length===1?e.key:id).toUpperCase():'',now);});
document.addEventListener('keyup',e=>{const k=keyOf(e),now=performance.now();
if(e.key==='CapsLock'&&e.isTrusted&&typeof e.getModifierState==='function'){const v=e.getModifierState('CapsLock');if(v!==caps)setCaps(v);if(k&&!k.down&&press(k,'key',now))k.auto=1;}
if(e.key==='Meta')for(const m of LIST)if(m.auto)release(m,now);if(k)release(k,now);});
addEventListener('blur',()=>{const now=performance.now();for(const k of LIST)release(k,now);});
svg.addEventListener('pointerdown',e=>{const g=e.target.closest&&e.target.closest('.cap');if(!g)return;const k=capOf.get(g),now=performance.now();user();if(press(k,'ptr',now))act(k,k.id==='Space'?' ':k.id.length===1?k.lab:'',now);});
const lift=()=>{const now=performance.now();for(const k of LIST)if(k.src==='ptr')release(k,now);};addEventListener('pointerup',lift);addEventListener('pointercancel',lift);
// The knob: ↑ ↓ anywhere (← → too while it has focus), a drag around it, Enter, Space or a click to mute.
function angle(e){const m=svg.getScreenCTM&&svg.getScreenCTM();if(!m)return 0;const q=new DOMPoint(e.clientX,e.clientY).matrixTransform(m.inverse()),o=P(KB.x,KB.y,KB.z0+KB.h),du=q.x-o[0],dv=q.y-o[1];return Math.atan2((dv/S-du/C)/2,(du/C+dv/S)/2)/D2R;}
KB.g.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;e.preventDefault();e.stopPropagation();if(!e.repeat){user();mute(performance.now());}});
KB.g.addEventListener('pointerdown',e=>{e.preventDefault();KB.g.focus({preventScroll:true,focusVisible:false});user();drag={a:angle(e),acc:0,v0:vol,moved:false};try{KB.g.setPointerCapture(e.pointerId);}catch(_){}KB.g.classList.add('drag');});
KB.g.addEventListener('pointermove',e=>{if(!drag)return;const a=angle(e);let da=a-drag.a;if(da>180)da-=360;if(da<-180)da+=360;drag.a=a;drag.acc+=da;if(Math.abs(drag.acc)>5)drag.moved=true;const v=clamp(drag.v0+Math.round(drag.acc/13.5)*5,0,100);if(v!==vol)volBy((v-vol)/5,performance.now());});
const endDrag=()=>{if(!drag)return;if(!drag.moved)mute(performance.now());drag=null;KB.g.classList.remove('drag');};KB.g.addEventListener('pointerup',endDrag);KB.g.addEventListener('pointercancel',endDrag);
function knurl(a){let d='';for(let i=0;i<40;i++){const t=(a+i*9)*D2R,c=Math.cos(t),s=Math.sin(t);if(c+s<.2)continue;const p=P(KB.x+KB.r*c,KB.y+KB.r*s,KB.z0+.35),q=P(KB.x+KB.r*c,KB.y+KB.r*s,KB.z0+KB.h-.35);d+=`M${f2(p[0])},${f2(p[1])}L${f2(q[0])},${f2(q[1])}`;}set(KB.kn,'d',d);}
// Lights: each key's skirts and top, and the diffuser's gradient stops (the pools follow). A ripple is a ring that
// spreads at SPD from the key and fades; WAVE runs a rainbow across, BREATHE swells one color; the F-row shows the volume.
function lamp(px,py,now,t,L,amb){let r=0,g=0,b=0,a=0;const add=(c,f)=>{r+=c[0]*f;g+=c[1]*f;b+=c[2]*f;a+=f;};
if(lmode===1)add(hsl(px*2.1+py*1.3-t*.11,.95,L),.78);else if(lmode===2)add(hsl(262+30*Math.sin(t/9000),.9,L),t?.1+.6*(.5-.5*Math.cos(t/4200*2*Math.PI)):.45);else if(lmode===0&&amb)add(hsl(195+px*.75,.9,L),amb);
for(const q of RIP){const e=(now-q.t0)/1000,d=Math.hypot(px-q.x,py-q.y),f=q.f?Math.exp(-e/.16)*Math.exp(-((d/4.5)**2)):Math.exp(-(((d-e*SPD)/RW)**2))*Math.exp(-e/DEC);if(f>.004&&e>=0)add(q.c,f);}
return a?[r/a,g/a,b/a,Math.min(1,a)]:null;}
function paint(k,v,dk){const a=v?Math.round(v[3]*32)/32:0,key=a+(dk?2:0),mix=(w)=>`rgb(${v[0]+(255-v[0])*w|0},${v[1]+(255-v[1])*w|0},${v[2]+(255-v[2])*w|0})`;
if(key!==k.lo){k.lo=key;k.lf.style.visibility=k.lt.style.visibility=k.lb.style.visibility=a?'visible':'hidden';k.lf.style.opacity=f2(a*(dk?1:.8));k.lt.style.opacity=f2(a*(dk?.12:.32));k.lb.style.opacity=f2(a*(dk?.75:.2));}
if(a){const c=mix(.35*a);if(c!==k.lc){k.lc=c;k.lf.style.fill=c;k.lb.style.fill=mix(0);k.lt.style.fill=dk?mix(0):mix(.55);}}}
function lights(now,rm){const meter=now-meterT<1500;if(meter!==wasMeter){wasMeter=meter;lDirty=true;}
for(let i=RIP.length-1;i>=0;i--)if(now-RIP[i].t0>(RIP[i].f?700:2400))RIP.splice(i,1);
const anim=!rm&&(lmode===1||lmode===2);if(!lDirty&&!meter&&!RIP.length&&!anim)return;lDirty=RIP.length>0;
const dk=darkQ.matches,L=dk?.6:.56,t=rm?0:now,lit=Math.round(vol/100*12);
for(const k of LIST){let v=lamp(k.cx,k.cy,now,t,L,0);if(k.down&&k.hc&&lmode!==3)v=[...k.hc,1];
if(meter&&k.r===0&&/^F\d/.test(k.id)){const i=+k.id.slice(1)-1;v=!muted&&i<lit?[...hsl(150-i*9,.85,L),1]:[255,255,255,.12];}paint(k,v,dk);}
for(const p of SP){const v=lamp(p.x,p.y,now,t,L,.22),a=v?Math.round(v[3]*40)/40:0,c=v?`rgb(${v[0]|0},${v[1]|0},${v[2]|0})`:'#000';if(a!==p.a){p.a=a;set(p.s,'stop-opacity',a);}if(c!==p.c){p.c=c;set(p.s,'stop-color',c);}}}
// Idle demo: after a quiet spell it types a few lines by itself, silently; any input takes over.
function demoStep(now){if(!demo.on){if(reduced.matches||now-lastIn<4800)return;demo.on=true;demo.t=now+300;echo='';lastUI=0;}
if(now<demo.t)return;const s=PHRASES[demo.p];
if(demo.c<s.length){const ch=s[demo.c++],k=ch===' '?KEYS.Space:KEYS[ch];if(press(k,'demo',now))k.rel=now+60+Math.random()*30;type(ch.toUpperCase(),now,true);demo.t=now+85+Math.random()*95+(ch===' '?50:0);}
else{if(press(KEYS.Enter,'demo',now))KEYS.Enter.rel=now+90;echo='';lastUI=0;demo.c=0;demo.p=(demo.p+1)%PHRASES.length;demo.t=now+2600;}}
// Frames: keys spring down and back (a little overshoot up), the space bar rocks on its stabilizer; the knob eases.
function tick(now){const dt=Math.min(.05,(now-(lt||now))/1000),rm=reduced.matches;lt=now;demoStep(now);
for(const k of moving){if(k.down&&k.auto&&!k.rel&&now-k.t0>300)k.rel=now;
if(k.rel&&now>=k.rel){k.down=false;k.rel=0;k.auto=0;lDirty=true;if(k.src!=='demo')thock(k,false);if(k.id==='Space'&&!rm)k.wob=now;}
const tg=k.down?TR:0;if(rm){k.pos=tg;k.vel=0;}else{const w=(k.down?24:12)*2*Math.PI,z=k.down?.9:.4;for(let n=Math.ceil(dt/.004),i=0;i<n;i++){const h=dt/n;k.vel+=(w*w*(tg-k.pos)-2*z*w*k.vel)*h;k.pos+=k.vel*h;}}
let tf=`translate(0 ${f2(k.pos)})`;if(k.wob){const e=(now-k.wob)/1000;if(e>.4)k.wob=0;else{const th=1.8*D2R*Math.exp(-e/.07)*Math.sin(2*Math.PI*26*e),s=-Math.tan(th)/C;tf+=` matrix(1 ${s.toFixed(4)} 0 1 0 ${f2(-s*P(k.cx,k.cy,0)[0])})`;}}
set(k.g,'transform',tf);if(!k.down&&!k.wob&&Math.abs(k.pos)<.004&&Math.abs(k.vel)<.05){k.pos=k.vel=0;k.g.removeAttribute('transform');moving.delete(k);}}
ka=rm?kaT:ka+(kaT-ka)*clamp(dt*16);if(kaD===null||Math.abs(ka-kaD)>.2){kaD=ka;set(KB.rot,'transform',`rotate(${f2(ka)})`);knurl(ka);}
lights(now,rm);
if(!lastUI||now-lastUI>120){lastUI=now;const w=wpm(now),ln=echo.length>16?'…'+echo.slice(-15):echo;
readout.textContent=`VOL ${muted?'MUTED':vol} · ${MODES[lmode]}${caps?' · CAPS':''}`;
stateLabel.textContent=now<msgT?msg:demo.on?(ln?`“${ln}” · DEMO`:'DEMO · TYPE TO TAKE OVER'):ln?`“${ln}”${w?` · ${w} WPM`:''}`:'READY · TYPE ON YOUR KEYBOARD';}
requestAnimationFrame(tick);}
// A power-on ripple from the middle of the board.
if(!reduced.matches)RIP.push({x:KEYS.g.cx,y:KEYS.g.cy,t0:performance.now()+500,c:hsl(hue,.95,darkQ.matches?.6:.56)});
requestAnimationFrame(tick);
}

export const figure: FigureModule = { css, defs, hints: [], draw }
