import {createRemoteJWKSet, jwtVerify} from 'jose';

export function json(data, status=200) {
  return new Response(JSON.stringify(data), {status, headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
}
const keysByIssuer = new Map();
export async function authorize(request, env, keyOverride) {
  const issuer = String(env.ACCESS_TEAM_URL || '').replace(/\/$/,'');
  if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(issuer) || !env.ACCESS_AUD || !env.ADMIN_EMAIL) return {error:json({error:'Управление ещё не подключено.'},503)};
  const assertion = request.headers.get('Cf-Access-Jwt-Assertion');
  if (!assertion) return {error:json({error:'Войдите через защищённую страницу.'},401)};
  try {
    if (!keysByIssuer.has(issuer)) keysByIssuer.set(issuer,createRemoteJWKSet(new URL(issuer+'/cdn-cgi/access/certs')));
    const {payload} = await jwtVerify(assertion,keyOverride || keysByIssuer.get(issuer),{issuer,audience:env.ACCESS_AUD,algorithms:['RS256'],requiredClaims:['exp','iat','email','sub']});
    if (String(payload.email).toLowerCase() !== String(env.ADMIN_EMAIL).trim().toLowerCase()) return {error:json({error:'Доступ запрещён.'},403)};
    if (!['GET','HEAD'].includes(request.method)) {
      const expected = env.APP_ORIGIN || 'https://alaskasibcat.com';
      if (new URL(request.url).origin !== expected || request.headers.get('Origin') !== expected || !/^application\/json(?:;|$)/i.test(request.headers.get('Content-Type') || '')) return {error:json({error:'Запрос отклонён.'},403)};
    }
    return {email:payload.email};
  } catch {return {error:json({error:'Войдите заново.'},401)};}
}
export function validateReview(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const author=typeof value.author==='string'?value.author.trim():'';
  const kitten=typeof value.kitten==='string'?value.kitten.trim():'';
  const body=typeof value.body==='string'?value.body.trim():'';
  const date=typeof value.review_date==='string'?value.review_date:'';
  if (!author || author.length>100 || kitten.length>100 || body.length<5 || body.length>3000 || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0,10)!==date) return null;
  return {author,kitten,body,review_date:date};
}
export function publicFields(row) {
  return {id:row.id,author:row.author,kitten:row.kitten,body:row.body,review_date:row.review_date};
}
export async function readBody(request) {
  if (Number(request.headers.get('Content-Length'))>20000) return null;
  const reader=request.body?.getReader();
  if(!reader) return null;
  try {
    const chunks=[];let size=0;
    while(true) {
      const {done,value}=await reader.read();if(done) break;
      size+=value.byteLength;
      if(size>20000) {await reader.cancel();return null;}
      chunks.push(value);
    }
    const bytes=new Uint8Array(size);let offset=0;
    for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
    const raw=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
    if(raw.length>10000) return null;
    return JSON.parse(raw);
  } catch {return null;} finally {reader.releaseLock();}
}
