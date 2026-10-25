// Public submission is enabled only when moderation and spam protection are configured.
export function submissionConfig(env) {
  const ready=Boolean(env.REVIEWS_SUBMISSIONS_OPEN === 'true' && env.REVIEWS_DB && /^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com\/?$/.test(env.ACCESS_TEAM_URL || '') && env.ACCESS_AUD && env.ADMIN_EMAIL && env.TURNSTILE_SITE_KEY && env.TURNSTILE_SECRET_KEY);
  return {enabled:ready,siteKey:ready?env.TURNSTILE_SITE_KEY:null};
}
export async function verifyChallenge(token,env,fetcher=fetch) {
  if(typeof token!=='string' || !token || token.length>2048) return false;
  try {
    const response=await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({secret:env.TURNSTILE_SECRET_KEY,response:token}),
      signal:AbortSignal.timeout(10000)
    });
    if(!response.ok) return false;
    const result=await response.json();
    return result.success===true && result.hostname===new URL(env.APP_ORIGIN || 'https://alaskasibcat.com').hostname && result.action==='customer-review';
  } catch {return false;}
}
