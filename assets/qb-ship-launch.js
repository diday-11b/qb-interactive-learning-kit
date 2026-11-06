(() => {
 const route='/qb_student_gameplay_ship_battle_arena/code.html';
 document.querySelectorAll('button,a').forEach(control=>{
  const text=control.textContent.trim().replace(/\s+/g,' ');
  if(/Play Solo Practice|Play Now|Start Learning/.test(text) && !control.closest('qb-site-header')) {
   if(control.tagName==='A') control.href=route;
   else control.addEventListener('click',()=>location.assign(route));
  }
 });
 const title=document.querySelector('main h1');if(title)title.classList.add('qb-shared-game-title');
})();