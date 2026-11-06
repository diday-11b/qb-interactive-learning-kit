(function(){
  "use strict";
  const app=document.getElementById("reading-app");if(!app)return;
  const state={books:[],worksheets:[],progress:new Map(),userId:null,language:"all",category:"all",search:"",book:null,pages:[],pageIndex:0,readingStatus:"",readingSaveRevision:0,readingSaveQueue:Promise.resolve(),worksheet:null,previewUrl:"",previewAvailable:new Map(),fileAvailable:new Map()};
  const el=(tag,cls,text)=>{const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node;};
  const button=(text,cls,handler)=>{const node=el("button",`reading-button ${cls||""}`,text);node.type="button";node.addEventListener("click",handler);return node;};
  const empty=(text,error=false)=>el("div",`reading-empty${error?" error":""}`,text);
  const languageLabel={en:"English",km:"Khmer",dual:"English + Khmer"};
  const languageMatches=item=>state.language==="all"||item.language===state.language||item.language==="dual";
  const searchMatches=item=>!state.search||`${item.title} ${item.description} ${item.category} ${item.reading_level||""}`.toLowerCase().includes(state.search);
  const categoryMatches=item=>state.category==="all"||item.category===state.category;
  const inScope=item=>languageMatches(item)&&categoryMatches(item)&&searchMatches(item);
  function setLang(node,language){if(language==="en"||language==="km")node.lang=language;}
  function render(){
    app.replaceChildren();
    if(state.book){renderReader();return;}
    if(state.worksheet){renderWorksheetPreview();return;}
    const hero=el("section","reading-hero");const intro=el("div");intro.append(el("span","reading-pill","QB Reading Library"));intro.append(el("h1","","Stories to read, pages to print"));intro.append(el("p","","Find published books and worksheets in English and Khmer. Books open from their saved pages; narration and downloads appear when real files are available."));const art=el("div","reading-hero-art","📚🖍️");art.setAttribute("aria-hidden","true");hero.append(intro,art);app.append(hero);
    renderFilters();renderBookList();renderWorksheetList();
  }
  function renderFilters(){
    const toolbar=el("div","reading-toolbar");const searchWrap=el("label","reading-field");searchWrap.append(el("span","","Search the library"));const search=document.createElement("input");search.type="search";search.placeholder="Title, description, category";search.value=state.search;search.autocomplete="off";search.addEventListener("input",()=>{state.search=search.value.trim().toLowerCase();updateCatalog();});searchWrap.append(search);
    const languageWrap=el("label","reading-field");languageWrap.append(el("span","","Language"));const language=document.createElement("select");[["all","All languages"],["en","English"],["km","Khmer"]].forEach(([v,t])=>{const o=el("option","",t);o.value=v;language.append(o);});language.value=state.language;language.addEventListener("change",()=>{state.language=language.value;render();});languageWrap.append(language);
    const categoryWrap=el("label","reading-field");categoryWrap.append(el("span","","Category"));const category=document.createElement("select");const categories=[...new Set([...state.books,...state.worksheets].map(x=>x.category).filter(Boolean))].sort();[["all","All categories"],...categories.map(x=>[x,x])].forEach(([v,t])=>{const o=el("option","",t);o.value=v;category.append(o);});category.value=state.category;category.addEventListener("change",()=>{state.category=category.value;render();});categoryWrap.append(category);
    toolbar.append(searchWrap,languageWrap,categoryWrap);app.append(toolbar);
  }
  function section(title,items,kind){const sec=el("section","reading-section");sec.id=kind==="book"?"book-library-list":"worksheet-library-list";const head=el("div","reading-section-head");head.append(el("h2","",title),el("p","",`${items.length} ${items.length===1?kind:kind+"s"}`));sec.append(head);if(!items.length){sec.append(empty(state.books.length||state.worksheets.length?"Nothing matches these filters yet. Change the language, category, or search." : `No published ${kind}s are available to this account yet.`));return sec;}const grid=el("div","reading-grid");items.forEach(item=>grid.append(kind==="book"?bookCard(item):worksheetCard(item)));sec.append(grid);return sec;}
  function renderBookList(){const items=state.books.filter(inScope);app.append(section("Books",items,"book"));}
  function renderWorksheetList(){const items=state.worksheets.filter(inScope);app.append(section("Worksheets",items,"worksheet"));}
  function updateCatalog(){const books=document.getElementById("book-library-list");const worksheets=document.getElementById("worksheet-library-list");if(books)books.replaceWith(section("Books",state.books.filter(inScope),"book"));if(worksheets)worksheets.replaceWith(section("Worksheets",state.worksheets.filter(inScope),"worksheet"));}
  function bookCard(book){
    const card=el("article","reading-card");const cover=el("div","reading-cover","📖");cover.setAttribute("role","img");cover.setAttribute("aria-label",book.cover_alt||"Book cover unavailable");
    QBSupabase.resolveLibraryMedia(book.cover_path).then(url=>{if(!cover.isConnected)return;const image=document.createElement("img");image.src=url;image.alt=book.cover_alt||book.title;image.onerror=()=>{image.remove();cover.textContent="📖";};cover.replaceChildren(image);}).catch(()=>{if(cover.isConnected)cover.textContent="📖";});card.append(cover);
    const title=el("h3","",book.title);setLang(title,book.language);card.append(title);const desc=el("p","",book.description||"");setLang(desc,book.language);card.append(desc);
    const resume=state.progress.get(book.id);const pageCount=(book.pages||[]).length;const level=book.reading_level||"Reading level not listed";card.append(el("div","reading-meta",`${languageLabel[book.language]||book.language} · ${level}${pageCount?` · ${pageCount} pages`:""}${book.min_age||book.max_age?` · Ages ${book.min_age||"?"}–${book.max_age||"?"}`:""}`));
    if(!book.published)card.append(el("span","reading-pill","Draft · only you can see this"));else card.append(el("span","reading-pill",book.category));
    const actions=el("div","reading-actions");const start=button(resume?`Resume · page ${resume.last_page_number}`:"Read book","primary",()=>openBook(book,resume?.last_page_number));start.disabled=!pageCount;actions.append(start);if(!pageCount){const missing=el("span","reading-meta","Pages are not available yet.");actions.append(missing);}card.append(actions);return card;
  }
  function worksheetCard(worksheet){
    const card=el("article","reading-card");const cover=el("div","reading-cover","📝");cover.setAttribute("role","img");cover.setAttribute("aria-label","Worksheet preview");card.append(cover);
    const title=el("h3","",worksheet.title);setLang(title,worksheet.language);card.append(title);const desc=el("p","",worksheet.description||"");setLang(desc,worksheet.language);card.append(desc);
    card.append(el("div","reading-meta",`${languageLabel[worksheet.language]||worksheet.language} · ${worksheet.category}${worksheet.min_age||worksheet.max_age?` · Ages ${worksheet.min_age||"?"}–${worksheet.max_age||"?"}`:""}${worksheet.difficulty?` · ${worksheet.difficulty}`:""}`));
    if(!worksheet.published)card.append(el("span","reading-pill","Draft · only you can see this"));
    const actions=el("div","reading-actions");const previewStatus=el("span","reading-meta","Checking preview…");actions.append(previewStatus);
    const downloadStatus=el("span","reading-meta","Checking PDF…");actions.append(downloadStatus);card.append(actions);
    QBSupabase.resolveLibraryMedia(worksheet.preview_path).then(()=>{state.previewAvailable.set(worksheet.id,true);if(previewStatus.isConnected){const preview=button("Preview & print","",()=>openWorksheet(worksheet));previewStatus.replaceWith(preview);}}).catch(()=>{state.previewAvailable.set(worksheet.id,false);if(previewStatus.isConnected)previewStatus.textContent="Preview file unavailable.";});
    QBSupabase.resolveLibraryMedia(worksheet.file_path).then(()=>{state.fileAvailable.set(worksheet.id,true);if(downloadStatus.isConnected){let download;download=button("Download PDF","primary",()=>downloadWorksheet(worksheet,download));downloadStatus.replaceWith(download);}}).catch(()=>{state.fileAvailable.set(worksheet.id,false);if(downloadStatus.isConnected)downloadStatus.textContent="Download file unavailable.";});
    return card;
  }
  async function openBook(book,resumePage){
    const pages=(book.pages||[]).slice().sort((a,b)=>a.page_number-b.page_number);if(!pages.length)return;
    state.book=book;state.pages=pages;const saved=Number(resumePage||1);const index=pages.findIndex(page=>page.page_number===saved);state.pageIndex=index>=0?index:0;state.readingStatus="";render();await saveCurrentPage();
  }
  async function saveCurrentPage(){if(!state.book||!state.pages[state.pageIndex])return;const bookId=state.book.id,pageNumber=state.pages[state.pageIndex].page_number,revision=++state.readingSaveRevision;state.readingStatus="Saving your page…";const request=state.readingSaveQueue.then(()=>QBSupabase.saveReadingProgress(bookId,pageNumber));state.readingSaveQueue=request.catch(()=>{});try{await request;if(revision===state.readingSaveRevision){state.progress.set(bookId,{last_page_number:pageNumber});state.readingStatus="Reading position saved.";}}catch(error){if(revision===state.readingSaveRevision)state.readingStatus=error.message||"Reading position could not be saved.";}if(state.book?.id===bookId&&state.pages[state.pageIndex]?.page_number===pageNumber){const status=document.getElementById("reading-status");if(status)status.textContent=state.readingStatus;}}
  async function finishReading(buttonNode){buttonNode.disabled=true;await saveCurrentPage();if(state.readingStatus!=="Reading position saved."){buttonNode.disabled=false;return;}state.book=null;state.pages=[];render();}
  function movePage(delta){const next=state.pageIndex+delta;if(next<0||next>=state.pages.length)return;state.pageIndex=next;state.readingStatus="Saving your page…";render();void saveCurrentPage();}
  function renderReader(){
    const book=state.book,page=state.pages[state.pageIndex];if(!page){state.book=null;render();return;}
    const reader=el("article","reader");const top=el("div","reader-top");top.append(button("← Back to library","",()=>{state.book=null;state.pages=[];render();}));top.append(el("span","reading-pill",`Page ${state.pageIndex+1} of ${state.pages.length}`));reader.append(top);
    const title=el("h1","",book.title);setLang(title,book.language);reader.append(title);
    const pageContent=el("div","reader-page");pageContent.lang=book.language==="dual"?"en":book.language;
    if(page.illustration_path){QBSupabase.resolveLibraryMedia(page.illustration_path).then(url=>{if(!pageContent.isConnected)return;const img=document.createElement("img");img.className="reader-illustration";img.src=url;img.alt=page.illustration_alt||"Book illustration";img.onerror=()=>img.remove();pageContent.prepend(img);}).catch(()=>{});}
    pageContent.append(document.createTextNode(page.body));reader.append(pageContent);
    if(page.narration_path){const audio=document.createElement("audio");audio.controls=true;audio.preload="none";audio.setAttribute("aria-label",book.language==="km"?"ស្តាប់សំឡេងអាន":"Play recorded narration");const audioError=empty(book.language==="km"?"មិនអាចចាក់សំឡេងអាននេះបានទេ។":"Narration is not available right now.");audioError.lang=book.language==="km"?"km":"en";audioError.setAttribute("role","status");audioError.setAttribute("aria-live","polite");const showAudioError=()=>{if(audio.isConnected){audio.remove();if(!audioError.isConnected)reader.append(audioError);}};audio.addEventListener("error",showAudioError);QBSupabase.resolveLibraryMedia(page.narration_path).then(url=>{if(audio.isConnected)audio.src=url;}).catch(showAudioError);reader.append(audio);}
    const status=el("p","reader-status",state.readingStatus);status.id="reading-status";status.setAttribute("role","status");reader.append(status);
    const nav=el("nav","reader-nav");nav.setAttribute("aria-label","Book page navigation");const previous=button("← Previous page","",()=>movePage(-1));previous.disabled=state.pageIndex===0;const atLastPage=state.pageIndex===state.pages.length-1;const next=button(atLastPage?"Finished reading":"Next page →","primary",()=>{if(atLastPage)void finishReading(next);else movePage(1);});nav.append(previous,next);reader.append(nav);app.append(reader);
  }
  async function openWorksheet(worksheet){
    if(!state.previewAvailable.get(worksheet.id))return;
    try{state.previewUrl=await QBSupabase.resolveLibraryMedia(worksheet.preview_path);state.worksheet=worksheet;render();}
    catch(error){state.worksheet=null;render();app.append(empty(error.message||"The worksheet preview is no longer available.",true));}
  }
  function renderWorksheetPreview(){
    const worksheet=state.worksheet;const preview=el("section","worksheet-preview");const title=el("h2","",worksheet.title);setLang(title,worksheet.language);preview.append(title);
    const desc=el("p","preview-note",worksheet.description||"");setLang(desc,worksheet.language);preview.append(desc);
    const image=document.createElement("img");image.alt=`Printable worksheet preview: ${worksheet.title}`;const actions=el("div","reading-actions"),print=button("Print worksheet","primary",()=>window.print());print.disabled=true;image.addEventListener("load",()=>{print.disabled=false;},{once:true});image.addEventListener("error",()=>{image.remove();preview.append(empty("The preview image could not be loaded."));},{once:true});image.src=state.previewUrl;preview.append(image);
    const back=button("← Back to library","",()=>{state.worksheet=null;state.previewUrl="";render();});actions.append(back,print);preview.append(actions);app.append(preview);
  }
  async function downloadWorksheet(worksheet,buttonNode){
    if(!state.fileAvailable.get(worksheet.id))return;buttonNode.disabled=true;buttonNode.textContent="Preparing PDF…";
    try{const url=await QBSupabase.resolveLibraryMedia(worksheet.file_path,true);const anchor=document.createElement("a");anchor.href=url;anchor.download="";anchor.rel="noopener";document.body.append(anchor);anchor.click();anchor.remove();buttonNode.textContent="Download started";}
    catch(error){buttonNode.disabled=false;buttonNode.textContent="Try download again";const note=el("p","reading-empty error",error.message||"This PDF is no longer available.");note.setAttribute("role","alert");buttonNode.closest(".reading-card")?.append(note);}
  }
  async function load(){
    try{
      if(!QBSupabase.configured){app.replaceChildren(empty("Connect Supabase to load stored books and worksheets. The library does not display sample books or placeholder download links.",true));return;}
      const result=await QBSupabase.getReadingLibrary();if(!result.authenticated){location.replace("/16._qb_unified_sign_in_sign_up/code.html");return;}
      state.userId=result.userId;state.language=["en","km"].includes(result.preferredLanguage)?result.preferredLanguage:"all";state.books=Array.from(new Map(result.books.map(book=>[book.id,{...book,pages:Array.isArray(book.pages)?book.pages:[]}])).values());state.worksheets=Array.from(new Map(result.worksheets.map(item=>[item.id,item])).values());state.progress=new Map(result.progress.map(item=>[item.book_id,item]));render();
    }catch(error){app.replaceChildren(empty(error.message||"We couldn’t load the reading library. Please try again.",true));const retry=button("Try again","primary",load);app.append(retry);}
  }
  load();
})();
