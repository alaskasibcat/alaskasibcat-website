import {authorize} from '../../lib/reviews.js';
export async function onRequest(context) {
  const auth=await authorize(context.request,context.env);
  if (auth.error) return auth.error;
  const response=await context.env.ASSETS.fetch(context.request);
  const protectedResponse=new Response(response.body,response);
  protectedResponse.headers.set('Cache-Control','no-store');
  protectedResponse.headers.set('X-Robots-Tag','noindex, nofollow');
  return protectedResponse;
}
