import {json,validateReview,readBody} from '../../../../lib/reviews.js';
export async function onRequest({request,env,params}) {
  if(!env.REVIEWS_DB) return json({error:'Review storage is not configured yet.'},503);
  if(request.method!=='PATCH') return json({error:'Method not allowed.'},405);
  const id=String(params.id || '');
  if(!/^[a-f0-9-]{36}$/.test(id)) return json({error:'Review not found.'},404);
  const existing=await env.REVIEWS_DB.prepare('SELECT * FROM reviews WHERE id=?').bind(id).first();
  if(!existing) return json({error:'Review not found.'},404);
  const input=await readBody(request), now=new Date().toISOString();
  if(input?.action==='save') {
    const value=validateReview(input);
    if(!value || existing.status==='deleted') return json({error:'Could not save the review.'},400);
    await env.REVIEWS_DB.prepare('UPDATE reviews SET author=?,kitten=?,body=?,review_date=?,updated_at=? WHERE id=?').bind(value.author,value.kitten,value.body,value.review_date,now,id).run();
  } else {
    const transitions={publish:'published',hide:'hidden',delete:'deleted',restore:'draft'};
    const next=Object.hasOwn(transitions,input?.action)?transitions[input.action]:null;
    if(!next || (existing.status==='deleted' && input.action!=='restore') || (input.action==='restore' && existing.status!=='deleted')) return json({error:'Invalid action.'},400);
    await env.REVIEWS_DB.prepare('UPDATE reviews SET status=?,updated_at=? WHERE id=?').bind(next,now,id).run();
  }
  return json({ok:true});
}
