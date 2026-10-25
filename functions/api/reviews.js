import {json,publicFields,readBody,validateReview} from '../../lib/reviews.js';
import {submissionConfig,verifyChallenge} from '../../lib/review-submission.js';
export async function handleReviewRequest({request,env},verify=verifyChallenge) {
  if(!['GET','POST'].includes(request.method)) return json({error:'Method not allowed'},405);
  if(request.method==='GET') {
    if(!env.REVIEWS_DB) return json({reviews:[],submission:{enabled:false,siteKey:null}},503);
    try {
      const {results}=await env.REVIEWS_DB.prepare("SELECT id,author,kitten,body,review_date FROM reviews WHERE status='published' ORDER BY review_date DESC,created_at DESC LIMIT 100").all();
      return json({reviews:results.map(publicFields),submission:submissionConfig(env)});
    } catch {return json({reviews:[],submission:{enabled:false,siteKey:null}},503);}
  }
  const origin=env.APP_ORIGIN || 'https://alaskasibcat.com';
  if(new URL(request.url).origin!==origin || request.headers.get('Origin')!==origin || !/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') || '')) return json({error:'Please submit the review from our website.'},403);
  if(!submissionConfig(env).enabled) return json({error:'Online reviews are not open yet. Please contact us to share your story.'},503);
  const value=await readBody(request);
  if(!value || typeof value!=='object' || Array.isArray(value)) return json({error:'Please check your review and try again.'},400);
  // Quietly discard a filled honeypot. No customer data is saved or echoed.
  if(value.website) return json({received:true},202);
  const now=new Date().toISOString();
  const review=validateReview({...value,review_date:now.slice(0,10)});
  if(!review || review.body.length<20 || value.consent!==true) return json({error:'Please include your display name, a review of 20–3000 characters, and permission to publish it.'},400);
  if(!await verify(value.token,env)) return json({error:'Verification expired or could not be completed. Please try again.'},400);
  try {
    await env.REVIEWS_DB.prepare("INSERT INTO reviews(id,author,kitten,body,review_date,status,created_at,updated_at) VALUES(?,?,?,?,?,'draft',?,?)").bind(crypto.randomUUID(),review.author,review.kitten,review.body,review.review_date,now,now).run();
    return json({received:true},201);
  } catch {return json({error:'Your review could not be saved. Please try again or contact us.'},503);}
}
export async function onRequest(context) {return handleReviewRequest(context);}
