function node(tag,text,className) {
  const element=document.createElement(tag);
  if(text) element.textContent=text;
  if(className) element.className=className;
  return element;
}
export function renderPublishedReviews(container,reviews,{limit=100,excerpt=false}={}) {
  container.replaceChildren();
  const safe=reviews.filter(r=>r && typeof r.author==='string' && typeof r.body==='string').slice(0,limit);
  for(const review of safe) {
    const article=node('article','','customer-review');
    const body=excerpt && review.body.length>420?review.body.slice(0,420).trimEnd()+'…':review.body;
    article.append(node('p','From our kitten families','eyebrow'),node('blockquote',body),node('h3',review.author));
    const details=[];
    if(review.kitten) details.push(review.kitten);
    if(/^\d{4}-\d{2}-\d{2}$/.test(review.review_date || '')) details.push(new Date(review.review_date+'T12:00:00Z').toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'}));
    if(details.length) article.append(node('p',details.join(' · '),'small'));
    container.append(article);
  }
  return safe.length>0;
}
async function initialize() {
  const container=document.querySelector('[data-published-reviews]');
  if(!container) return;
  const status=document.getElementById('reviews-status');
  let data=null;
  try {
    const response=await fetch('/api/reviews',{cache:'no-store'});
    data=await response.json();
    if(!response.ok) throw new Error('unavailable');
    const hasReviews=renderPublishedReviews(container,Array.isArray(data.reviews)?data.reviews:[],{limit:container.dataset.limit?Number(container.dataset.limit):100,excerpt:container.dataset.excerpt==='true'});
    const section=document.getElementById('family-stories');
    if(section) section.hidden=!hasReviews;
    if(status) {status.hidden=hasReviews;status.textContent='Our family stories will appear here as they are shared and approved. We would love to hear yours.';}
  } catch {
    if(status) status.textContent='Family stories will be available here soon. You can contact us to share yours.';
  }
  const form=document.getElementById('customer-review-form');
  if(!form) return;
  const fields=document.getElementById('customer-review-fields'), message=document.getElementById('review-form-status'), submit=form.querySelector('button[type=submit]');
  if(!data?.submission?.enabled || !data.submission.siteKey) {message.textContent='Online review submissions are not open yet. Please contact us to share your story.';return;}
  let token='',widgetId=null,busy=false;
  function ready(value) {token=value || '';submit.disabled=busy || !token;}
  const unavailable=()=>{ready('');message.textContent='Verification could not load. Please refresh the page or contact us to share your review.';};
  function startWidget() {
    try {
      fields.disabled=false;
      widgetId=window.turnstile.render('#review-verification',{
        sitekey:data.submission.siteKey,action:'customer-review',theme:'light',language:'en',
        size:window.matchMedia('(max-width:400px)').matches?'compact':'flexible',
        callback:value=>{ready(value);if(message.textContent==='Please complete the verification before sending.' || message.textContent==='Please complete verification again before sending.') message.textContent='Your review will be checked before publication.';},
        'expired-callback':()=>{ready('');message.textContent='Please complete verification again before sending.';},
        'error-callback':()=>{unavailable();return true;}
      });
      message.textContent='Please complete the verification before sending.';
    } catch {unavailable();}
  }
  if(window.turnstile) startWidget();
  else {
    const script=document.createElement('script');script.src='https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';script.async=true;script.addEventListener('load',startWidget,{once:true});script.addEventListener('error',unavailable,{once:true});document.head.append(script);
  }
  form.addEventListener('submit',async event=>{
    event.preventDefault();
    if(busy || !token || !form.reportValidity()) return;
    const value=Object.fromEntries(new FormData(form));
    const payload={author:value.author,kitten:value.kitten,body:value.body,website:value.website,consent:form.elements.consent.checked,token};
    busy=true;submit.disabled=true;message.textContent='Sending your review…';
    try {
      const response=await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const result=await response.json();
      if(!response.ok) throw new Error(result.error || 'Your review could not be saved. Please try again.');
      form.reset();message.textContent='Thank you! Your review has been received and is waiting for approval. It is not public yet.';
    } catch(error) {message.textContent=error.message || 'Your review could not be sent. Your text has been kept; please try again.';}
    finally {busy=false;ready('');if(widgetId!==null) window.turnstile.reset(widgetId);}
  });
}
initialize();
