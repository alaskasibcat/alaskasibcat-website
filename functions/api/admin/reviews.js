import {json,validateReview,readBody} from '../../../lib/reviews.js';
export async function onRequest({request,env}) {
  if (!env.REVIEWS_DB) return json({error:'Хранилище отзывов ещё не подключено.'},503);
  if(request.method==='GET') {
    const {results}=await env.REVIEWS_DB.prepare('SELECT * FROM reviews ORDER BY updated_at DESC LIMIT 500').all();
    return json({reviews:results});
  }
  if(request.method!=='POST') return json({error:'Метод не поддерживается.'},405);
  const review=validateReview(await readBody(request));
  if(!review) return json({error:'Проверьте имя, дату и текст отзыва.'},400);
  const id=crypto.randomUUID(), now=new Date().toISOString();
  await env.REVIEWS_DB.prepare('INSERT INTO reviews(id,author,kitten,body,review_date,status,created_at,updated_at) VALUES(?,?,?,?,?,\'draft\',?,?)').bind(id,review.author,review.kitten,review.body,review.review_date,now,now).run();
  return json({id,status:'draft'},201);
}
