(function(){
  var form=document.getElementById('contact-form'); if(!form) return;
  var status=document.getElementById('form-status');
  var endpoint=(window.SITE_CONFIG||{}).formEndpoint||'';
  var btn=form.querySelector('button[type=submit]');
  var q=new URLSearchParams(location.search).get('kitten');
  if(q) document.getElementById('f-msg').value='I am interested in '+q.slice(0,60)+'. ';
  if(!endpoint){ status.textContent='The form is not connected yet, so messages cannot be sent from this draft.'; btn.disabled=true; }
  function err(id,m,fid){document.getElementById(id).textContent=m;var f=document.getElementById(fid);if(m)f.setAttribute('aria-invalid','true');else f.removeAttribute('aria-invalid');return !m;}
  form.addEventListener('submit',function(e){
    e.preventDefault(); if(!endpoint) return;
    var n=form.name.value.trim(), em=form.email.value.trim(), m=form.message.value.trim();
    var ok=err('e-name',n?'':'Please enter your name.','f-name');
    ok=err('e-email',/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)?'':'Please enter a valid email address.','f-email')&&ok;
    ok=err('e-msg',m.length>=10?'':'Please write a short message (at least 10 characters).','f-msg')&&ok;
    if(!ok){status.textContent='Please fix the highlighted fields.';return;}
    if(form.website.value) return; // spam trap
    btn.disabled=true; status.textContent='Sending...';
    fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({name:n,email:em,message:m})})
    .then(function(r){ if(!r.ok) throw new Error('bad status'); status.textContent='Thank you. Your message was received.'; form.reset(); })
    .catch(function(){ status.textContent='Sorry, your message could not be sent. Please try again later.'; })
    .then(function(){btn.disabled=false;});
  });
})();
