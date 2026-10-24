(function(){
  var form=document.getElementById('waitlist-form'); if(!form) return;
  var status=document.getElementById('wl-status');
  var endpoint=(window.SITE_CONFIG||{}).formEndpoint||'';
  var btn=form.querySelector('button[type=submit]');
  if(!endpoint){ btn.disabled=true; status.textContent='The waiting list is not connected yet.'; }
  function err(id,m,fid){document.getElementById(id).textContent=m;var f=document.getElementById(fid);if(m)f.setAttribute('aria-invalid','true');else f.removeAttribute('aria-invalid');return !m;}
  form.addEventListener('submit',function(e){
    e.preventDefault(); if(!endpoint) return;
    var n=form.name.value.trim(), em=form.email.value.trim(), m=form.message.value.trim();
    var ok=err('e-wl-name',n?'':'Please enter your name.','wl-name');
    ok=err('e-wl-email',/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)?'':'Please enter a valid email address.','wl-email')&&ok;
    if(!ok){status.textContent='Please fix the highlighted fields.';return;}
    if(form.website.value) return;
    btn.disabled=true; status.textContent='Sending...';
    fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({_subject:'Waiting list: '+n,type:'waiting list',name:n,email:em,message:m||'(no message)'})})
    .then(function(r){ if(!r.ok) throw new Error('bad status'); status.textContent='Thank you. You are on the list, and we will write when a litter is confirmed.'; form.reset(); })
    .catch(function(){ status.textContent='Sorry, that did not go through. Please try again later or use the contact page.'; })
    .then(function(){btn.disabled=false;});
  });
})();
