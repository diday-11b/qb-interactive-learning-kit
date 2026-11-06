(async()=>{
'use strict';const F=window.QBAuthFlow;const params=new URLSearchParams(location.search),hash=new URLSearchParams(location.hash.slice(1));const next=params.has('next')?F.safeNext(params.get('next')):F.takeNext();let navigated=false;
const retry=document.querySelector('#retry-link');retry.href=F.LOGIN+'?next='+encodeURIComponent(next);
function strip(){history.replaceState(null,'',location.pathname+'?next='+encodeURIComponent(next));}
try{
 const problem=params.get('error_code')||hash.get('error_code')||params.get('error')||hash.get('error');
 if(problem){strip();throw {code:problem};}
 if(!window.QBSupabase?.configured)throw {code:'configuration'};
 // Supabase initializes and processes the implicit callback URL exactly once.
 // getSession waits for that initialization; do not exchange codes again here.
 const result=await F.resolve(next);strip();
 if(result.login)throw {code:'expired_session'};
 if(!navigated){navigated=true;location.replace(result.path);}
}catch(error){strip();document.querySelector('#auth-message').textContent=F.message(error);document.querySelector('#auth-message').dataset.error='true';document.querySelector('#auth-retry').hidden=false;}
})();
