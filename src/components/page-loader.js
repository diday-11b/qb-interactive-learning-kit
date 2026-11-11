(() => {
  'use strict';
  if(window.__qbPageLoader)return;
  window.__qbPageLoader=true;
  const started=performance.now();
  const style=document.createElement('style');
  style.textContent='#qb-page-loader{position:fixed;inset:0;z-index:2147483647;display:grid;place-items:center;background:#eaf8ff;pointer-events:auto}#qb-page-loader .qb-loading-content{text-align:center}#qb-page-loader img{display:block;width:min(520px,80vw,72vh);height:auto;aspect-ratio:1;margin:auto}#qb-page-loader p{font-family:"Luckiest Guy","Noto Sans Khmer",sans-serif;margin:8px 0;color:#20556b;font-size:18px}';
  document.head.append(style);
  const overlay=document.createElement('div');overlay.id='qb-page-loader';overlay.setAttribute('role','status');overlay.setAttribute('aria-label','Loading page');
  const content=document.createElement('div');content.className='qb-loading-content';
  const img=document.createElement('img');img.src=matchMedia('(prefers-reduced-motion: reduce)').matches?'/public/assets/loading/page-loader-still.svg':'/public/assets/loading/page-loader.svg';img.alt='';img.width=520;img.height=520;
  const label=document.createElement('p');label.textContent='Loading…';content.append(img,label);overlay.append(content);document.documentElement.append(overlay);
  const remove=()=>overlay.remove();
  const ready=()=>setTimeout(remove,Math.max(0,1000-(performance.now()-started)));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
  // Fail open even if another page script fails or a remote resource stalls.
  setTimeout(remove,3000);
  window.addEventListener('pageshow',event=>{if(event.persisted)remove();});
})();
