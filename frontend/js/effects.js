/* One shared animation loop: cursor spring, capped particle sphere and progress.
   Lenis handles smooth scrolling; GSAP ScrollTrigger handles section reveals. */
document.addEventListener('portfolio-ready', () => {
 'use strict';
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const fine=matchMedia('(hover: hover) and (pointer: fine)');
 const canvas=document.querySelector('#particles'),ctx=canvas.getContext('2d');
 const scene=document.querySelector('.orb-scene');
 const dot=document.querySelector('#cursor-dot'),ring=document.querySelector('#cursor-ring');
 const progress=document.querySelector('.scroll-progress');
 let w=0,h=0,visible=true,frame=0,last=0,time=0;
 let lenis=null;
 const mouse={x:innerWidth/2,y:innerHeight/2,rx:innerWidth/2,ry:innerHeight/2,nx:0,ny:0};
 const points=Array.from({length:420},(_,i)=>{const y=1-2*i/419,r=Math.sqrt(1-y*y),angle=i*2.3999632297;return{x:Math.cos(angle)*r,y,z:Math.sin(angle)*r};});
 function resize(){const r=scene.getBoundingClientRect();w=r.width;h=r.height;const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);ctx?.setTransform(dpr,0,0,dpr,0,0);if(reduced.matches)draw(0);}
 function draw(t){
  if(!ctx)return;ctx.clearRect(0,0,w,h);const radius=Math.min(w*.36,h*.39);const angle=t*.000095+(reduced.matches?0:mouse.nx*.14),ca=Math.cos(angle),sa=Math.sin(angle);const tilt=-.2+(reduced.matches?0:mouse.ny*.12);const ct=Math.cos(tilt),st=Math.sin(tilt);
  const projected=points.map(p=>{const x=p.x*ca-p.z*sa,z=p.x*sa+p.z*ca,y=p.y*ct-z*st,zz=p.y*st+z*ct;const perspective=2.9/(2.9-zz*.3);return{x:w*.52+x*radius*perspective,y:h*.5+y*radius*perspective,z:zz};});
  // Sparse adjacent links are O(n), rather than comparing every particle pair.
  for(let i=0;i<projected.length;i++){const p=projected[i],q=projected[(i+13)%projected.length];if(Math.hypot(p.x-q.x,p.y-q.y)<radius*.27){ctx.strokeStyle=`rgba(157,214,178,${.035+Math.max(0,p.z)*.085})`;ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}}
  projected.sort((a,b)=>a.z-b.z).forEach(p=>{ctx.fillStyle=`rgba(185,248,206,${.17+(p.z+1)*.32})`;ctx.beginPath();ctx.arc(p.x,p.y,.65+(p.z+1)*.48,0,Math.PI*2);ctx.fill();});
  ctx.strokeStyle='rgba(185,248,206,.13)';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(w*.52,h*.5,radius*1.2,radius*.35,-.43,0,Math.PI*2);ctx.stroke();
 }
 const reveals=document.querySelectorAll('.reveal');
 // Progressive enhancement: content remains visible if a library is unavailable.
 if(window.gsap && window.ScrollTrigger){
  gsap.registerPlugin(ScrollTrigger);
  const media=gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)',()=>{
   document.body.classList.add('gsap-motion');
   if(window.Lenis){
    lenis=new Lenis({duration:1.05,smoothWheel:true,syncTouch:false,anchors:true});
    lenis.on('scroll',ScrollTrigger.update);
    document.documentElement.classList.add('smooth-enhanced');
   }
   reveals.forEach(el=>gsap.fromTo(el,{autoAlpha:0,y:24},{autoAlpha:1,y:0,duration:.85,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 94%',once:true}}));
   return ()=>{lenis?.destroy();lenis=null;document.body.classList.remove('gsap-motion');document.documentElement.classList.remove('smooth-enhanced');};
  });
 } else {
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('is-visible');observer.unobserve(e.target);}}),{threshold:.07});
  reveals.forEach(el=>observer.observe(el));document.body.classList.add('motion-ready');
 }
 const dialog=document.querySelector('#project-dialog');
 new MutationObserver(()=>{if(dialog.open)lenis?.stop();else lenis?.start();}).observe(dialog,{attributes:true,attributeFilter:['open']});
 new ResizeObserver(resize).observe(scene);
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;},{threshold:0}).observe(scene);
 function cursorMode(){document.body.classList.toggle('custom-cursor',fine.matches&&!reduced.matches);document.body.classList.add('cursor-hidden');if(reduced.matches)draw(0);}
 fine.addEventListener('change',cursorMode);reduced.addEventListener('change',cursorMode);cursorMode();
 window.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;mouse.x=e.clientX;mouse.y=e.clientY;mouse.nx=e.clientX/innerWidth-.5;mouse.ny=e.clientY/innerHeight-.5;document.body.classList.remove('cursor-hidden');},{passive:true});
 document.addEventListener('pointerover',e=>{const target=e.target.closest('a,button,input,textarea');document.body.classList.toggle('cursor-hover',!!target);const contextual=target?.dataset.cursor;document.body.classList.toggle('cursor-case',!!contextual);ring.querySelector('span').textContent=contextual||'';});
 document.documentElement.addEventListener('pointerleave',()=>document.body.classList.add('cursor-hidden'));
 window.addEventListener('blur',()=>document.body.classList.add('cursor-hidden'));
 document.addEventListener('keydown',e=>{if(e.key==='Tab')document.body.classList.add('cursor-hidden');});
 // Delegate hover position logic so dynamically filtered cards stay interactive.
 document.querySelectorAll('.tilt,.spotlight,.magnetic').forEach(el=>{
  el.addEventListener('pointermove',e=>{if(!fine.matches||reduced.matches)return;const r=el.getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top;el.style.setProperty('--mx',`${x}px`);el.style.setProperty('--my',`${y}px`);
   if(el.classList.contains('tilt')){el.style.transition='transform .12s ease-out';el.style.transform=`perspective(1100px) rotateX(${-(y/r.height-.5)*4}deg) rotateY(${(x/r.width-.5)*5}deg) translateY(-3px)`;}
   if(el.classList.contains('magnetic'))el.style.transform=`translate(${(x-r.width/2)*.12}px,${(y-r.height/2)*.18}px)`;
  });
  el.addEventListener('pointerleave',()=>{el.style.transition='';el.style.transform='';el.style.setProperty('--mx','-300px');el.style.setProperty('--my','-300px');});
 });
 function updateProgress(){const max=document.documentElement.scrollHeight-innerHeight;progress.style.transform=`scaleX(${max>0?scrollY/max:0})`;}
 addEventListener('scroll',updateProgress,{passive:true});addEventListener('resize',updateProgress);
 function tick(now){lenis?.raf(now);const dt=Math.min(now-last||16.67,50);last=now;time+=dt;
  if(!reduced.matches){if(visible)draw(time);if(fine.matches){const follow=1-Math.exp(-dt/75);mouse.rx+=(mouse.x-mouse.rx)*follow;mouse.ry+=(mouse.y-mouse.ry)*follow;dot.style.transform=`translate3d(${mouse.x}px,${mouse.y}px,0)`;ring.style.transform=`translate3d(${mouse.rx}px,${mouse.ry}px,0)`;}}
  frame=requestAnimationFrame(tick);
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame);}else{last=performance.now();frame=requestAnimationFrame(tick);}});
 resize();updateProgress();frame=requestAnimationFrame(tick);
}, {once:true});
