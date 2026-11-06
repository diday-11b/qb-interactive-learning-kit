(function(root){
'use strict';
const LOGIN='/16._qb_unified_sign_in_sign_up/code.html';
const destinations={student:'/qb_student_game_hub_rewards_arena/code.html',teacher:'/04._qb_teacher_dashboard/code.html',parent:'/14._qb_parent_dashboard_weekly_digest/code.html',admin:'/18._qb_user_profile_system_preferences/code.html'};
const routes={student:{'join-class':'/10._qb_student_welcome_pin_entry/code.html','join-room':'/10._qb_student_welcome_pin_entry/code.html',progress:'/15._qb_child_progress_learning_analytics/code.html'},teacher:{classes:'/17._qb_classroom_student_roster_manager/code.html',progress:'/09._qb_results_progress_analytics/code.html','teacher-tools':'/20._qb_teacher_classroom_utility_suite/code.html'}};
const allowed=new Set(['student','join-class','join-room','progress','classes','teacher-tools']);let starting=false,processing=null;
function safeNext(value){return allowed.has(value)?value:'student';}
function destination(profile,next){if(!profile||!Object.hasOwn(destinations,profile.role))throw Object.assign(new Error('Access denied'),{code:'profile_access_denied'});return routes[profile.role]?.[safeNext(next)]||destinations[profile.role];}
function needsOnboarding(profile){return !String(profile?.display_name||'').trim()||profile.display_name==='Learner';}
function message(error){const code=String(error?.code||error?.error_code||'').toLowerCase();if(code==='provider_disabled')return 'Google sign-in is not enabled yet. Please use email for now, or ask the administrator to enable Google in Supabase Authentication → Sign In / Providers.';if(/access_denied|cancel/.test(code))return 'Google sign-in was cancelled. You can try again or use your email.';if(/profile_missing/.test(code))return 'Your account profile is not available yet. Please contact your teacher or administrator.';if(/profile_access_denied/.test(code))return 'This account does not have access to a supported learning space.';if(/timeout|network|fetch/.test(code))return 'We could not reach sign-in services. Check your connection and try again.';if(/expired|flow_state|bad_code|invalid_grant/.test(code))return 'This sign-in link expired. Please start Google sign-in again.';return 'We could not complete sign-in. Please try again or use email. If this continues, ask the administrator to check Google sign-in settings.';}
async function bounded(task,ms=12000){let timer;try{return await Promise.race([task,new Promise((_,reject)=>timer=setTimeout(()=>reject(Object.assign(new Error('Timeout'),{code:'timeout'})),ms))]);}finally{clearTimeout(timer);}}
function takeNext(){try{const raw=root.sessionStorage.getItem('qb.auth.next');root.sessionStorage.removeItem('qb.auth.next');const value=JSON.parse(raw);if(value&&Date.now()-value.at<15*60*1000)return safeNext(value.next);}catch{}return 'student';}
async function beginGoogle(next){if(starting)return false;starting=true;try{const providers=await bounded(root.QBSupabase.getAuthProviders());if(!providers.google)throw {code:'provider_disabled'};const url=new URL('/auth/callback.html',root.location.origin);try{root.sessionStorage.setItem('qb.auth.next',JSON.stringify({next:safeNext(next),at:Date.now()}));}catch{}await bounded(root.QBSupabase.signInWithGoogle(url.href));setTimeout(()=>{starting=false;},10000);return true;}catch(error){starting=false;throw error;}}
async function resolve(next){if(processing)return processing;processing=(async()=>{
 const session=await bounded(root.QBSupabase.getSession());if(!session)return {login:true};
 const user=await bounded(root.QBSupabase.getVerifiedUser());if(!user) return {login:true};
 const profile=await bounded(root.QBSupabase.getProfile(user.id));if(!profile)throw Object.assign(new Error('Missing profile'),{code:'profile_missing'});
 const path=destination(profile,next);
 if(needsOnboarding(profile))return {path:'/auth/onboarding.html?next='+encodeURIComponent(safeNext(next)),profile,user};
 return {path,profile,user};
})();try{return await processing;}finally{processing=null;}}
root.QBAuthFlow={LOGIN,safeNext,destination,needsOnboarding,message,bounded,takeNext,beginGoogle,resolve};if(typeof module!=='undefined')module.exports=root.QBAuthFlow;
})(typeof window!=='undefined'?window:globalThis);
