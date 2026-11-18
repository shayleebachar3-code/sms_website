(function(){
var ph=document.querySelector('.hero-photo'),cv=document.getElementById('heroFx'),hero=document.getElementById('top');
if(!ph||!cv||!hero)return;
function offs(){try{if(innerWidth>1020){var t=hero.getBoundingClientRect().top+(window.pageYOffset||0);ph.style.setProperty('--hp-top',(-t)+'px')}}catch(e){}}
offs();addEventListener('resize',offs);addEventListener('load',offs);
var H=document.documentElement,W=1672,HT=941;
if(matchMedia('(prefers-reduced-motion:reduce)').matches||H.classList.contains('a11y-still')){cv.style.display='none';return}
var lite=H.classList.contains('lite'),ctx=cv.getContext('2d'),dpr=Math.min(lite?1:2,devicePixelRatio||1),sc=1,ox=0,vis=true,last=0,t0=0;
function fit(){var r=ph.getBoundingClientRect(),cw=r.width,ch=r.height;
 if(innerWidth>1020){sc=cw/W;ox=0}else{sc=ch/HT;ox=-(W*sc-cw)*.18}
 cv.style.width=W*sc+'px';cv.style.height=HT*sc+'px';cv.style.left=ox+'px';
 cv.width=Math.round(W*sc*dpr);cv.height=Math.round(HT*sc*dpr)}
fit();addEventListener('resize',fit);
function rnd(a,b){return a+Math.random()*(b-a)}
var P=[[362,340],[385,366],[420,420],[455,472],[478,505]];
var nb=lite?10:18,nd=lite?24:46,bok=[],dust=[],bub=[],rip=[];
for(var i=0;i<nb;i++)bok.push({x:rnd(80,1500),y:rnd(120,800),r:rnd(6,30),a:rnd(.04,.16),p:rnd(0,6.28),s:rnd(.1,.3)});
for(i=0;i<nd;i++)dust.push({x:rnd(640,960),y:rnd(560,820),r:rnd(.8,2.4),p:rnd(0,6.28),s:rnd(.6,1.8),v:rnd(4,14)});
for(i=0;i<6;i++)bub.push({x:rnd(455,505),y:rnd(664,735),s:rnd(14,30),r:rnd(1,2.4)});
function pt(u){var n=P.length-1,f=u*n,k=Math.min(n-1,Math.floor(f)),l=f-k;return[P[k][0]+(P[k+1][0]-P[k][0])*l,P[k][1]+(P[k+1][1]-P[k][1])*l]}
function glow(x,y,r,c,a){var g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba('+c+','+a+')');g.addColorStop(1,'rgba('+c+',0)');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,r,0,6.2832);ctx.fill()}
function draw(now){
 if(!t0)t0=now;var t=(now-t0)/1000;
 ctx.setTransform(sc*dpr,0,0,sc*dpr,0,0);ctx.clearRect(0,0,W,HT);ctx.globalCompositeOperation='lighter';
 var i,b;
 for(i=0;i<bok.length;i++){b=bok[i];glow(b.x+Math.sin(t*b.s+b.p)*14,b.y+Math.cos(t*b.s*.8+b.p)*10,b.r*2,'255,200,110',b.a*(.7+.3*Math.sin(t*b.s*3+b.p)))}
 for(i=0;i<3;i++){var u=((t*.55+i/3)%1),q=pt(u);glow(q[0],q[1],14,'255,226,160',.5*Math.sin(u*3.14159))}
 glow(478,640,90+8*Math.sin(t*1.6),'255,190,90',.16+.05*Math.sin(t*1.6));
 for(i=0;i<dust.length;i++){b=dust[i];var f=.5+.5*Math.sin(t*b.s+b.p),y=b.y-((t*b.v)%120);if(y<b.y-120)y+=120;glow(b.x+Math.sin(t*.4+b.p)*6,y,b.r*4,'255,226,150',.25+.65*f*f)}
 ctx.lineWidth=1.6;
 for(i=0;i<2;i++){var k=((t/1.1)+i*.5)%2.18/2.18*1;var life=((t+i*1.1)%2.4)/2.4,rx=10+life*60;ctx.strokeStyle='rgba(255,224,160,'+(.45*(1-life))+')';ctx.beginPath();ctx.ellipse(478,658,rx,rx*.22,0,0,6.2832);ctx.stroke()}
 for(i=0;i<bub.length;i++){b=bub[i];b.y-=b.s*(1/30);if(b.y<664){b.y=735;b.x=rnd(455,505)}ctx.fillStyle='rgba(255,236,190,.55)';ctx.beginPath();ctx.arc(b.x+Math.sin(t*2+i)*2,b.y,b.r,0,6.2832);ctx.fill()}
 ctx.globalCompositeOperation='source-over'}
function loop(now){requestAnimationFrame(loop);if(!vis||document.hidden)return;if(now-last<33)return;last=now;draw(now)}
if('IntersectionObserver' in window)new IntersectionObserver(function(e){vis=e[0].isIntersecting}).observe(ph);
requestAnimationFrame(loop);
})();
