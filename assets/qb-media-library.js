(function () {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const fileInput = $("#mediaFile");
  const form = $("#mediaForm");
  const state = { file: null, target: null, previewUrl: null, assets: [], recorder: null, stream: null, chunks: [], busy: false };
  const accepted = new Set(["image/jpeg","image/png","image/webp","image/gif","audio/mpeg","audio/mp4","audio/wav","audio/x-wav","audio/ogg","audio/webm","application/pdf"]);
  const labels = { question:"Question",learning_card:"Learning card",mascot:"Mascot",activity_illustration:"Activity illustration",letter_sound:"Letter sound",pronunciation:"Pronunciation",reading_narration:"Reading narration",sound_effect:"Sound effect",book_cover:"Book cover",book_illustration:"Book illustration",worksheet_preview:"Worksheet preview",worksheet_file:"Worksheet PDF" };
  const esc = (value) => String(value || "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);
  function status(text, kind="info") { const node=$("#mediaStatus"); node.textContent=text; node.dataset.kind=kind; node.hidden=false; }
  function preview(file) {
    if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
    state.previewUrl = URL.createObjectURL(file); const area=$("#preview"); area.replaceChildren();
    if (file.type.startsWith("image/")) { const image=document.createElement("img"); image.src=state.previewUrl; image.alt=$("#mediaAlt").value.trim() || file.name; area.append(image); }
    else if (file.type.startsWith("audio/")) { const audio=document.createElement("audio"); audio.controls=true; audio.preload="metadata"; audio.setAttribute("aria-label",`Preview recording ${$("#mediaTitle").value || file.name}`); audio.src=state.previewUrl; area.append(audio); }
    else { const pdf=document.createElement("iframe"); pdf.title=`Preview PDF ${$("#mediaTitle").value || file.name}`; pdf.src=state.previewUrl; area.append(pdf); }
  }
  function selectFile(file) {
    if (!file) return;
    const rawMime=(file.type||"").split(";")[0]; const mime=rawMime==="audio/x-wav"?"audio/wav":rawMime;
    if (!accepted.has(mime) || file.size<1 || file.size>10*1024*1024) {
      // Clear any previously valid selection too, so a rejected replacement
      // cannot accidentally leave the old file ready to upload.
      state.file=null; state.target=null;
      if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
      state.previewUrl=null; $("#preview").replaceChildren(); $("#preview").textContent="Choose a supported file to preview it";
      $("#uploadButton").textContent="Upload media"; $("#uploadLabel").textContent="";
      status("Choose a supported image, audio recording, or PDF no larger than 10 MB.","error"); fileInput.value=""; return;
    }
    state.file=file; state.target=null;
    if (!$("#mediaTitle").value) $("#mediaTitle").value=file.name.replace(/\.[^.]+$/,"").slice(0,120);
    if (mime.startsWith("audio/") && $("#mediaPurpose").value==="question") $("#mediaPurpose").value="pronunciation";
    if (mime.startsWith("image/") && !["book_cover","book_illustration","worksheet_preview"].includes($("#mediaPurpose").value)) $("#mediaPurpose").value="activity_illustration";
    if (mime==="application/pdf") $("#mediaPurpose").value="worksheet_file";
    preview(file); $("#uploadButton").textContent="Upload media"; $("#uploadLabel").textContent="Ready to upload"; status("Preview your media, choose its purpose and language, then upload.");
  }
  async function refreshAssets() {
    if (!window.QBSupabase?.configured) return;
    const result=await window.QBSupabase.listMediaAssets();
    if (!result.authenticated) { status("Sign in with a teacher account to view your private media.","error"); return; }
    state.assets=result.assets; renderAssets(); status(`${state.assets.length} media ${state.assets.length===1?"asset":"assets"} in your private library.`,"success");
  }
  async function renderAssets() {
    const list=$("#assetList"); list.replaceChildren();
    const needle=$("#mediaSearch").value.trim().toLowerCase();
    const shown=state.assets.filter(item=>`${item.title} ${item.purpose} ${item.language} ${item.media_kind}`.toLowerCase().includes(needle));
    if (!shown.length) { const empty=document.createElement("div"); empty.className="empty"; empty.textContent=state.assets.length?"No media matches that search.":"No media yet. Add a picture or record a sound to start your library."; list.append(empty); return; }
    for (const item of shown) {
      const row=document.createElement("article"); row.className="asset";
      const thumb=document.createElement("div"); thumb.className="thumb"; thumb.textContent=item.media_kind==="image"?"Loading image…":item.media_kind==="document"?"Loading PDF…":"Loading audio…";
      const details=document.createElement("div"); details.innerHTML=`<h3 class="asset-title">${esc(item.title)}</h3><div class="meta">${esc(labels[item.purpose]||item.purpose)} · ${esc(item.language.toUpperCase())} · ${Math.max(1,Math.round(item.byte_size/1024))} KB</div><div class="meta">${esc(item.mime_type)}</div>`;
      const actions=document.createElement("button"); actions.className="btn quiet"; actions.type="button"; actions.textContent="Retry preview"; actions.setAttribute("aria-label",`Retry preview for ${item.title}`); actions.hidden=true;
      row.append(thumb,details,actions); list.append(row);
      const loadPreview=async()=>{
        actions.hidden=true;
        try { const url=await window.QBSupabase.resolveQuestionMedia(item.storage_path); thumb.replaceChildren();
          if (item.media_kind==="image") { const image=document.createElement("img"); image.src=url; image.alt=item.alt_text||item.title; image.onerror=()=>{thumb.textContent="Image file missing or unavailable";actions.hidden=false;}; thumb.append(image); }
          else if(item.media_kind==="audio") { const audio=document.createElement("audio"); audio.controls=true; audio.preload="none"; audio.setAttribute("aria-label",`Play ${item.title}`); audio.src=url; audio.onerror=()=>{thumb.textContent="Audio file missing or unavailable";actions.hidden=false;}; thumb.append(audio); }
          else { const open=document.createElement("a"); open.href=url; open.target="_blank"; open.rel="noopener"; open.textContent="Open PDF"; thumb.append(open); }
        } catch (_) { thumb.textContent="Media file missing or inaccessible"; actions.hidden=false; }
      };
      actions.addEventListener("click",()=>void loadPreview()); void loadPreview();
    }
  }
  async function upload(event) {
    event.preventDefault(); if (state.busy) return;
    if (!window.QBSupabase?.configured) { status("Supabase is not configured. Set up the local project before uploading media.","error"); return; }
    if (!state.file) { status("Choose a file or make a recording first.","error"); return; }
    if (!$("#mediaTitle").value.trim()) { status("Add a title for this media file.","error"); $("#mediaTitle").focus(); return; }
    const isImage=state.file.type.startsWith("image/"); const isAudio=state.file.type.startsWith("audio/"); const isDocument=state.file.type==="application/pdf";
    const imageOnly=["mascot","activity_illustration","book_cover","book_illustration","worksheet_preview"].includes($("#mediaPurpose").value);
    const audioOnly=["letter_sound","pronunciation","reading_narration","sound_effect"].includes($("#mediaPurpose").value);
    const documentOnly=$("#mediaPurpose").value==="worksheet_file";
    if ((isImage&&(audioOnly||documentOnly))||(isAudio&&(imageOnly||documentOnly))||(isDocument&&!documentOnly)||(!isImage&&!isAudio&&!isDocument)) { status("Choose a media file type that matches the selected purpose.","error"); return; }
    state.busy=true; const button=$("#uploadButton"); button.disabled=true;
    $("#progressTrack").hidden=false; $("#progressFill").style.width="0%"; $("#progressTrack").setAttribute("aria-valuenow","0");
    try {
      state.target ||= await window.QBSupabase.prepareMediaUpload(state.file);
      button.textContent="Uploading…"; status("Uploading securely…");
      await window.QBSupabase.uploadMediaFile(state.target,state.file,(percent)=>{ $("#progressFill").style.width=`${percent}%`; $("#progressTrack").setAttribute("aria-valuenow",String(percent)); $("#uploadLabel").textContent=`${percent}%`; });
      const rawMime=(state.file.type||"").split(";")[0]; const mime=rawMime==="audio/x-wav"?"audio/wav":rawMime;
      await window.QBSupabase.registerMediaAsset({id:state.target.id,storage_path:state.target.path,title:$("#mediaTitle").value.trim(),media_kind:isImage?"image":isAudio?"audio":"document",purpose:$("#mediaPurpose").value,language:$("#mediaLanguage").value,mime_type:mime,byte_size:state.file.size,alt_text:$("#mediaAlt").value.trim()});
      $("#progressFill").style.width="100%"; $("#progressTrack").setAttribute("aria-valuenow","100"); $("#uploadLabel").textContent="Uploaded"; button.textContent="Upload another"; status("Upload complete. Your file and its metadata are saved in the private library.","success");
      state.file=null; state.target=null; fileInput.value=""; await refreshAssets();
    } catch (error) { button.textContent=state.target?"Retry upload":"Upload media"; $("#uploadLabel").textContent="Upload failed · retry is safe"; status(error.message||"Upload failed. Check your connection and retry.","error"); }
    finally { state.busy=false; button.disabled=false; }
  }
  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { $("#recordMessage").textContent="Recording is unavailable in this browser. Upload an audio file instead."; return; }
    try {
      state.stream=await navigator.mediaDevices.getUserMedia({audio:true});
      const mimeType=["audio/webm;codecs=opus","audio/mp4","audio/ogg;codecs=opus"].find(type=>MediaRecorder.isTypeSupported(type));
      state.recorder=mimeType?new MediaRecorder(state.stream,{mimeType}):new MediaRecorder(state.stream); state.chunks=[];
      state.recorder.ondataavailable=(event)=>{if(event.data.size)state.chunks.push(event.data);};
      state.recorder.onstop=()=>{const type=(state.recorder.mimeType||"audio/webm").split(";")[0];const extension=type.includes("mp4")?"m4a":type.includes("ogg")?"ogg":"webm";const file=new File(state.chunks,`recording-${Date.now()}.${extension}`,{type});selectFile(file);state.stream?.getTracks().forEach(track=>track.stop());state.stream=null;$("#recordMessage").textContent="Recording ready. Preview it, then upload.";};
      state.recorder.start(); $("#recordStart").disabled=true; $("#recordStop").disabled=false; $("#recordMessage").textContent="Recording… press Stop recording when finished.";
    } catch (error) { $("#recordMessage").textContent=error.name==="NotAllowedError"?"Microphone access was not allowed. You can upload a recording instead.":"Could not start recording. You can upload an audio file instead."; }
  }
  function stopRecording() { if (state.recorder?.state==="recording") { state.recorder.stop(); $("#recordStart").disabled=false; $("#recordStop").disabled=true; } }
  fileInput.addEventListener("change",()=>selectFile(fileInput.files?.[0]));
  $("#mediaAlt").addEventListener("input",()=>{if(state.file?.type.startsWith("image/"))preview(state.file);});
  $("#recordStart").addEventListener("click",()=>void startRecording()); $("#recordStop").addEventListener("click",stopRecording);
  form.addEventListener("submit",(event)=>void upload(event)); $("#refreshMedia").addEventListener("click",()=>void refreshAssets().catch(error=>status(error.message,"error")));
  $("#mediaSearch").addEventListener("input",()=>renderAssets());
  window.addEventListener("DOMContentLoaded",()=>{
    if(!window.QBSupabase?.configured){status("Supabase is not configured. Sign in as a teacher after completing the setup guide to upload and manage private media.","error");return;}
    void refreshAssets().catch(error=>status(error.message,"error"));
  });
  window.addEventListener("beforeunload",()=>{if(state.previewUrl)URL.revokeObjectURL(state.previewUrl);state.stream?.getTracks().forEach(track=>track.stop());});
})();
