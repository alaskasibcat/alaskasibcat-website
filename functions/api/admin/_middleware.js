import {authorize} from '../../../lib/reviews.js';
export async function onRequest(context) {
  const auth=await authorize(context.request,context.env);
  if (auth.error) return auth.error;
  context.data.adminEmail=auth.email;
  const response=await context.next();
  const protectedResponse=new Response(response.body,response);
  protectedResponse.headers.set('Cache-Control','no-store');
  return protectedResponse;
}
