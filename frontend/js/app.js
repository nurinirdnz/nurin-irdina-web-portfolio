/* UI composition and accessible interactions, intentionally dependency-free. */
(async () => {
 'use strict';
 const escapeHTML = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let projects, loadError=false;
 try {
  const response = await fetch('/api/portfolio');
  if(!response.ok) throw new Error('Portfolio unavailable');
  const data = await response.json();
  projects = data.projects.map(p => Object.fromEntries(Object.entries(p).map(([k,v]) => [k,Array.isArray(v)?v.map(escapeHTML):typeof v==='string'?escapeHTML(v):v])));
  projects.forEach(p=>{if(p.url&&!p.url.startsWith('https://'))delete p.url;});
 } catch {
  projects=[];loadError=true;
 }
 const $ = s => document.querySelector(s);
 // All values below are author-controlled local content, never user input.
 const tags = values => values.map(s=>`<span>${s}</span>`).join('');
 const cat = `<span aria-hidden="true">CNN</span>`;
 const previews = {
 jomdekan: `<div class="preview-title">A little clarity.<br>A lot of possibility.<small>THE STUDENT HUB</small></div><div class="mock-browser"><div class="mock-top"><i></i><i></i><i></i><span>JomDekan / dashboard concept</span></div><div class="mock-body"><div class="mock-side"><div class="mock-logo">JomDekan✳</div><p>⌂ &nbsp; Overview</p><p>▤ &nbsp; Materials</p><p>◎ &nbsp; Discussions</p><p>✦ &nbsp; AI study tools</p><p>♡ &nbsp; Saved</p></div><div class="mock-main"><small>YOUR LEARNING SPACE</small><h4>A good day to learn, Nurin ✦</h4><div class="mock-banner"><div><b>Your next idea starts here.</b><br>Explore. Connect. Keep growing.</div><b>✳</b></div><div class="mock-tiles"><div class="mock-tile"><i>▤</i>Academic materials<small>Find your next resource ↗</small></div><div class="mock-tile"><i>✦</i>Study with AI<small>Make sense of the details ↗</small></div><div class="mock-tile"><i>◎</i>Your community<small>Learn better, together ↗</small></div></div></div></div></div>`,
 fitwus:`<div class="fit-app"><header><b>FitWUs ✦</b><span>YOUR DAILY BALANCE</span></header><h4>Feel good. Keep going.</h4><div class="fit-content"><div class="fitness-ring"></div><div class="fit-chart">${[32,59,45,76,52,82,62].map(h=>`<i style="height:${h}%"></i>`).join('')}</div></div></div>`,
 animals:`<div class="animal-app"><p>VISION LAB / ANIMAL CLASSIFICATION</p><div class="animal-flex"><div class="animal-image">${cat}</div><div class="animal-result">IMAGE ANALYSIS<strong>Hello, feline.</strong><div class="confidence"></div><small>ILLUSTRATIVE PREDICTION</small></div></div></div>`
 };
 $('#featured-grid').innerHTML = projects.filter(p=>p.featured).map((p,i)=>`<button class="project-card tilt reveal" data-project="${p.id}" data-cursor="VIEW CASE" aria-label="View ${p.name} project details"><div class="project-visual"><div class="visual-meta"><span>0${i+1} / ${p.category.toUpperCase()}</span><span>${i===0?'FEATURED PROJECT':'SELECTED WORK'}</span></div><div aria-hidden="true">${previews[p.id]}</div><div class="hover-tags">${tags(p.stack)}</div></div><div class="project-info"><div><h3>${p.name}</h3><p>${p.subtitle}</p></div><span class="round-arrow" aria-hidden="true">↗</span></div></button>`).join('');
 if(loadError) $('#featured-grid').innerHTML='<p role="alert">Projects could not load. Please refresh the page to try again.</p>';
 function renderArchive(filter='all') {
  $('#archive').innerHTML = projects.filter(p=>!p.featured && (filter==='all'||p.type===filter)).map(p=>`<button class="archive-item" data-project="${p.id}" data-cursor="VIEW CASE" aria-label="View ${p.name} project details"><span class="index">0${projects.indexOf(p)+1}</span><div><h4>${p.name}</h4><p>${p.category}</p></div><span class="archive-stack">${p.stack.slice(0,3).join(' / ')}</span><span class="round-arrow" aria-hidden="true">↗</span></button>`).join('');
 }
 renderArchive();
 document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{
  document.querySelectorAll('[data-filter]').forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button));});
  renderArchive(button.dataset.filter);
 }));
 const dialog=$('#project-dialog');let opener;
 document.addEventListener('click',event=>{
  const card=event.target.closest('[data-project]');if(!card)return;
  const p=projects.find(p=>p.id===card.dataset.project);opener=card;
  $('#dialog-content').innerHTML=`<p class="eyebrow">${p.category}</p><h2 id="dialog-title">${p.name}</h2><p>${p.description}</p><div class="tags">${tags(p.stack)}</div><h3>Behind the build</h3><p>${p.detail}</p><h3>Key capabilities</h3><ul>${p.features.map(f=>`<li>${f}</li>`).join('')}</ul><h3>Technology & architecture</h3><p>${p.tools}</p><h3>Skills demonstrated</h3><p>${p.skills}</p>${p.url?`<a class="button primary" href="${p.url}" target="_blank" rel="noopener noreferrer">Explore source code ↗</a>`:''}<p class="small-note" style="margin-top:24px">${p.featured?'Card artwork is an illustrative interface concept, not a production screenshot. ':''}Project information supplied by Nurin Irdina.</p>`;
  document.body.classList.add('modal-open','dialog-open');dialog.showModal();dialog.scrollTop=0;$('.close-dialog').focus();
 });
 $('.close-dialog').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 dialog.addEventListener('close',()=>{document.body.classList.remove('modal-open','dialog-open');opener?.focus();});
 $('#year').textContent=new Date().getFullYear();
 $('#contact-form').addEventListener('submit',async event=>{
  event.preventDefault();const form=event.currentTarget;if(!form.reportValidity())return;
  const data=new FormData(form);const name=String(data.get('name')).trim();const from=String(data.get('email')).trim();const message=String(data.get('message')).trim();
  if(!name||message.length<10){$('#form-status').textContent='Please add your name and a message of at least 10 characters.';return;}
  const submit=form.querySelector('button[type="submit"]');
  submit.disabled=true;submit.firstElementChild.textContent='Sending…';
  $('#form-status').textContent='Sending your message…';
  try {
   const response=await fetch('/api/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,email:from,message})});
   const result=await response.json();
   if(!response.ok)throw new Error(result.error||'Unable to send. Please try again.');
   $('#form-status').textContent=result.message;form.reset();
  } catch(error){$('#form-status').textContent=error.message||'Connection failed. Please try again.';}
  finally{submit.disabled=false;submit.firstElementChild.textContent='Send message';}
 });
 document.dispatchEvent(new Event('portfolio-ready'));
})();
