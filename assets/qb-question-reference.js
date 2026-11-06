(() => {
 const main=document.querySelector('main'),tabs=document.querySelector('.collection-tabs'),community=document.querySelector('.community');
 const panel=document.createElement('section');panel.className='question-library-panel';panel.setAttribute('aria-label','Question library');tabs.after(panel);
 ['.search-row','#category-filters','.list-heading','.question-grid','#empty'].forEach(selector=>{const node=main.querySelector(selector);if(node)panel.append(node);});
 panel.after(community);
 const mine=document.createElement('div');mine.hidden=true;
 mine.innerHTML='<div class="personal-toolbar"><label>DATE CREATED<select aria-label="Date created"><option value="all">Any time</option><option value="week">Last 7 days</option><option value="month">Last 30 days</option></select></label><label>SORT BY<select aria-label="Sort question sets"><option value="recent">Recently updated</option><option value="name">Name A–Z</option></select></label></div><a class="create-question-tile" href="/06._qb_create_edit_question_set/code.html"><span aria-hidden="true">⊕</span><strong>Create New</strong><small>Start a new question set!</small></a><p class="mine-help">Create your own question sets to customize games for your students</p>';
 panel.querySelector('.search-row').after(mine);
 document.querySelectorAll('.collection-tab').forEach(button=>button.addEventListener('click',()=>{
  document.body.dataset.collection=button.dataset.collection;mine.hidden=button.dataset.collection!=='mine';
  const badge=document.querySelector('#tab-selected');badge.hidden=false;button.prepend(badge);
 }));
 const grid=panel.querySelector('.question-grid');
 mine.querySelector('[aria-label="Sort question sets"]').addEventListener('change',event=>{if(event.target.value==='name')[...grid.children].sort((a,b)=>a.dataset.name.localeCompare(b.dataset.name)).forEach(node=>grid.append(node));});
 mine.querySelector('[aria-label="Date created"]').addEventListener('change',event=>{const days=event.target.value==='week'?7:event.target.value==='month'?30:Infinity;grid.querySelectorAll('[data-owner="mine"]').forEach(card=>{const date=Date.parse(card.dataset.created||'');card.hidden=days!==Infinity&&(!Number.isFinite(date)||Date.now()-date>days*86400000);});});
})();