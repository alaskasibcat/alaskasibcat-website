import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {generateKeyPair,SignJWT} from 'jose';
import {authorize,validateReview} from '../lib/reviews.js';
import {onRequest as collection} from '../functions/api/admin/reviews.js';
import {onRequest as item} from '../functions/api/admin/reviews/[id].js';
import {onRequest as published} from '../functions/api/reviews.js';

const {publicKey,privateKey}=await generateKeyPair('RS256');
const issuer='https://test-team.cloudflareaccess.com';
const config={ACCESS_TEAM_URL:issuer,ACCESS_AUD:'reviews-test',ADMIN_EMAIL:'owner@example.test',APP_ORIGIN:'https://alaskasibcat.com'};
async function signed(overrides={}){return new SignJWT({email:config.ADMIN_EMAIL,...overrides}).setProtectedHeader({alg:'RS256'}).setIssuer(issuer).setAudience(config.ACCESS_AUD).setSubject('test-owner').setIssuedAt().setExpirationTime('5m').sign(privateKey);}
function request(token,options={}){return new Request('https://alaskasibcat.com/api/admin/reviews',{...options,headers:{'Cf-Access-Jwt-Assertion':token||'',...(options.headers||{})}});}
test('access is closed until configured and rejects missing or forged credentials',async()=>{
  assert.equal((await authorize(request(),{})).error.status,503);
  assert.equal((await authorize(request(),config,publicKey)).error.status,401);
  assert.equal((await authorize(request('header.payload.signature'),config,publicKey)).error.status,401);
  assert.equal((await authorize(request(await signed({email:'visitor@example.test'})),config,publicKey)).error.status,403);
  assert.equal((await authorize(request(await signed()),{...config,ACCESS_AUD:'other-aud'},publicKey)).error.status,401);
  const expired=await new SignJWT({email:config.ADMIN_EMAIL}).setProtectedHeader({alg:'RS256'}).setIssuer(issuer).setAudience(config.ACCESS_AUD).setSubject('test-owner').setIssuedAt().setExpirationTime(1).sign(privateKey);
  assert.equal((await authorize(request(expired),config,publicKey)).error.status,401);
  const good=await authorize(request(await signed()),config,publicKey);assert.equal(good.email,config.ADMIN_EMAIL);
});
test('authenticated writes require the exact origin and JSON content type',async()=>{
  const token=await signed();
  assert.equal((await authorize(request(token,{method:'POST'}),config,publicKey)).error.status,403);
  assert.equal((await authorize(request(token,{method:'POST',headers:{Origin:'https://other.example','Content-Type':'application/json'}}),config,publicKey)).error.status,403);
  assert.equal((await authorize(request(token,{method:'POST',headers:{Origin:config.APP_ORIGIN,'Content-Type':'application/json'}}),config,publicKey)).email,config.ADMIN_EMAIL);
});
test('validation rejects invalid dates, oversized or absent text',()=>{
  const base={author:'A',kitten:'',body:'A real review.',review_date:'2026-10-25'};
  assert.ok(validateReview(base));assert.equal(validateReview({...base,review_date:'2026-02-31'}),null);
  assert.equal(validateReview({...base,body:'x'.repeat(3001)}),null);assert.equal(validateReview({...base,author:''}),null);
});
function database(){
  const sqlite=new DatabaseSync(':memory:');sqlite.exec(readFileSync(new URL('../migrations/0001_reviews.sql',import.meta.url),'utf8'));
  return {prepare(sql){let args=[];const statement=sqlite.prepare(sql);return {bind(...values){args=values;return this;},async all(){return {results:statement.all(...args)};},async first(){return statement.get(...args)||null;},async run(){return statement.run(...args);}};}};
}
const payload={author:'Test family',kitten:'Test cat',body:'<script>example</script> This is a test, not a customer review.',review_date:'2026-10-25',status:'published'};
function write(method,value){return new Request(config.APP_ORIGIN+'/api/admin/reviews',{method,headers:{'Content-Type':'application/json',Origin:config.APP_ORIGIN},body:JSON.stringify(value)});}
test('review lifecycle: save draft, explicit publication, edit, hide, delete, restore',async()=>{
  const env={REVIEWS_DB:database()};
  let response=await collection({request:write('POST',payload),env});assert.equal(response.status,201);const created=await response.json();assert.equal(created.status,'draft');
  const publicRequest=new Request(config.APP_ORIGIN+'/api/reviews');
  const publicList=async()=>(await(await published({request:publicRequest,env})).json()).reviews;
  const change=async(value)=>item({request:write('PATCH',value),env,params:{id:created.id}});
  assert.deepEqual(await publicList(),[]);
  assert.equal((await change({action:'publish'})).status,200);
  let visible=await publicList();assert.equal(visible.length,1);assert.deepEqual(Object.keys(visible[0]).sort(),['author','body','id','kitten','review_date']);assert.equal(visible[0].body,payload.body);
  assert.equal((await change({...payload,body:'Edited test review.',action:'save'})).status,200);assert.equal((await publicList())[0].body,'Edited test review.');
  await change({action:'hide'});assert.deepEqual(await publicList(),[]);
  await change({action:'publish'});await change({action:'delete'});assert.deepEqual(await publicList(),[]);
  assert.equal((await change({action:'publish'})).status,400);
  await change({action:'restore'});assert.deepEqual(await publicList(),[]);
  assert.equal((await change({action:'__proto__'})).status,400);
  const rows=(await(await collection({request:new Request(config.APP_ORIGIN+'/api/admin/reviews'),env})).json()).reviews;assert.equal(rows[0].status,'draft');
});

// Public intake must remain separate from the Access-protected moderation API.
const {handleReviewRequest}=await import('../functions/api/reviews.js');
const {verifyChallenge}=await import('../lib/review-submission.js');
const {readBody}=await import('../lib/reviews.js');
const publicPayload={author:'A test family',kitten:'Test only',body:'This is a synthetic test review for the moderation queue.',consent:true,token:'valid-test-token',status:'published',review_date:'2000-01-01'};
function publicWrite(value,origin=config.APP_ORIGIN,type='application/json'){return new Request(config.APP_ORIGIN+'/api/reviews',{method:'POST',headers:{Origin:origin,'Content-Type':type},body:JSON.stringify(value)});}
function publicEnv(){return {...config,REVIEWS_SUBMISSIONS_OPEN:'true',REVIEWS_DB:database(),TURNSTILE_SITE_KEY:'test-public-site-key',TURNSTILE_SECRET_KEY:'test-server-secret'};}
test('public intake fails closed; consent, origin and challenge cannot be bypassed',async()=>{
  const env=publicEnv();const accept=async()=>true;
  assert.equal((await handleReviewRequest({request:publicWrite(publicPayload),env:{...env,REVIEWS_SUBMISSIONS_OPEN:'false'}},accept)).status,503);
  assert.equal((await handleReviewRequest({request:publicWrite(publicPayload),env:{}},accept)).status,503);
  assert.equal((await handleReviewRequest({request:publicWrite(publicPayload,'https://other.example'),env},accept)).status,403);
  assert.equal((await handleReviewRequest({request:publicWrite(publicPayload,config.APP_ORIGIN,'text/plain'),env},accept)).status,403);
  assert.equal((await handleReviewRequest({request:publicWrite({...publicPayload,consent:false}),env},accept)).status,400);
  assert.equal((await handleReviewRequest({request:publicWrite({...publicPayload,body:'Short'}),env},accept)).status,400);
  assert.equal((await handleReviewRequest({request:publicWrite(publicPayload),env},async()=>false)).status,400);
  const blocked=await handleReviewRequest({request:publicWrite({...publicPayload,website:'spam'}),env},()=>{throw new Error('must not verify bots');});assert.equal(blocked.status,202);
  assert.equal((await env.REVIEWS_DB.prepare('SELECT * FROM reviews').all()).results.length,0);
});
test('a visitor cannot publish or choose the review date; moderation controls visibility',async()=>{
  const env=publicEnv();const created=await handleReviewRequest({request:publicWrite(publicPayload),env},async()=>true);assert.equal(created.status,201);
  const rows=(await env.REVIEWS_DB.prepare('SELECT * FROM reviews').all()).results;assert.equal(rows.length,1);assert.equal(rows[0].status,'draft');assert.equal(rows[0].review_date,new Date().toISOString().slice(0,10));
  const get=()=>published({request:new Request(config.APP_ORIGIN+'/api/reviews'),env});
  let body=await(await get()).json();assert.deepEqual(body.reviews,[]);assert.equal(body.submission.enabled,true);assert.equal(body.submission.siteKey,env.TURNSTILE_SITE_KEY);assert.ok(!JSON.stringify(body).includes(env.TURNSTILE_SECRET_KEY));assert.ok(!JSON.stringify(body).includes(config.ADMIN_EMAIL));
  await item({request:write('PATCH',{action:'publish'}),env,params:{id:rows[0].id}});assert.equal((await(await get()).json()).reviews.length,1);
  await item({request:write('PATCH',{action:'hide'}),env,params:{id:rows[0].id}});assert.deepEqual((await(await get()).json()).reviews,[]);
});
test('Turnstile verification checks success, action and hostname and handles failures',async()=>{
  const env=publicEnv();const answer=value=>async(url,options)=>{assert.equal(url,'https://challenges.cloudflare.com/turnstile/v0/siteverify');assert.equal(JSON.parse(options.body).secret,env.TURNSTILE_SECRET_KEY);return Response.json(value);};
  const valid={success:true,hostname:'alaskasibcat.com',action:'customer-review'};
  assert.equal(await verifyChallenge('token',env,answer(valid)),true);
  for(const value of [{...valid,success:false},{...valid,hostname:'other.example'},{...valid,action:'login'}])assert.equal(await verifyChallenge('token',env,answer(value)),false);
  assert.equal(await verifyChallenge('',env,answer(valid)),false);assert.equal(await verifyChallenge('x'.repeat(2049),env,answer(valid)),false);
  assert.equal(await verifyChallenge('token',env,async()=>{throw new Error('network');}),false);
});
test('chunked oversized request bodies are rejected even without Content-Length',async()=>{
  const stream=new ReadableStream({start(controller){controller.enqueue(new TextEncoder().encode('x'.repeat(21000)));controller.close();}});
  const req=new Request(config.APP_ORIGIN+'/api/reviews',{method:'POST',duplex:'half',body:stream});assert.equal(await readBody(req),null);
});
