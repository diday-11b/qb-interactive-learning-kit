(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const signOutButton = $("sign-out");
  signOutButton.hidden = true;
  signOutButton.style.setProperty("display", "none", "important");
  const copy = {
    en: {
      home:"Home",learn:"Learn",reading:"Reading",progress:"My progress",teacherProgress:"Teacher dashboard",parentProgress:"Family dashboard",settings:"Settings",signOut:"Sign out",yourAccount:"Your account",title:"Your profile & settings",intro:"Choose the language and learning settings that feel right for you. Changes are saved to your account.",loading:"Loading your account…",profileTitle:"Profile",profileHelp:"Keep your name and learning language up to date.",name:"Name",nameHelp:"Use a name your teacher or family will recognize.",language:"Language",languageHelp:"This choice is used for learning content where that language is available.",email:"Account email",emailHelp:"Email and password changes are handled through your account provider.",accessTitle:"Sound & accessibility",accessHelp:"These choices follow your account across supported learning pages.",sound:"Game sound effects",soundHelp:"Turn optional game sounds on or off.",motion:"Reduce motion",motionHelp:"Limit animations across supported pages. Your device’s reduced-motion setting is always respected.",contrast:"Higher contrast",contrastHelp:"Increase contrast for interface text and controls.",childNote:"Your teacher or family manages private account details. You can still choose your language and learning settings.",save:"Save settings",saving:"Saving…",reset:"Use suggested settings",privacyTitle:"Your account stays yours",privacyCopy:"Only your display name, language, and learning preferences can be changed here. Your role, email, password, class access, and family links cannot be changed from this page.",footer:"QB Interactive Learning Kits · Learning together, one small step at a time.",role_student:"Learner account",role_teacher:"Teacher account",role_parent:"Parent account",role_admin:"Administrator account",saved:"Your settings were saved to your account.",unsaved:"You have unsaved changes. Save them before leaving?",configError:"Connect Supabase and apply the account preferences migration to manage saved settings. See supabase/README.md.",loadError:"We couldn’t load your account settings. Please try again.",saveError:"We couldn’t save those changes. Please try again.",resetDone:"Suggested settings selected. Save to keep these changes.",sessionError:"Sign in to manage your account settings.",invalidName:"Enter a name between 1 and 80 characters."
    },
    km: {
      home:"ទំព័រដើម",learn:"រៀន",reading:"អាន",progress:"វឌ្ឍនភាពរបស់ខ្ញុំ",teacherProgress:"ផ្ទាំងគ្រូបង្រៀន",parentProgress:"ផ្ទាំងគ្រួសារ",settings:"ការកំណត់",signOut:"ចាកចេញ",yourAccount:"គណនីរបស់អ្នក",title:"ប្រវត្តិរូប និងការកំណត់",intro:"ជ្រើសរើសភាសា និងការកំណត់ការរៀនដែលសមស្របសម្រាប់អ្នក។ ការផ្លាស់ប្តូរនឹងត្រូវបានរក្សាទុកក្នុងគណនីរបស់អ្នក។",loading:"កំពុងផ្ទុកគណនីរបស់អ្នក…",profileTitle:"ប្រវត្តិរូប",profileHelp:"ធ្វើបច្ចុប្បន្នភាពឈ្មោះ និងភាសារៀនរបស់អ្នក។",name:"ឈ្មោះ",nameHelp:"ប្រើឈ្មោះដែលគ្រូ ឬគ្រួសាររបស់អ្នកស្គាល់។",language:"ភាសា",languageHelp:"ជម្រើសនេះនឹងប្រើសម្រាប់មាតិការៀន នៅពេលមានភាសានោះ។",email:"អ៊ីមែលគណនី",emailHelp:"ការផ្លាស់ប្តូរអ៊ីមែល និងពាក្យសម្ងាត់ត្រូវធ្វើតាមអ្នកផ្តល់សេវាគណនី។",accessTitle:"សំឡេង និងភាពងាយស្រួល",accessHelp:"ជម្រើសទាំងនេះភ្ជាប់ជាមួយគណនីរបស់អ្នកនៅលើទំព័ររៀនដែលគាំទ្រ។",sound:"សំឡេងក្នុងហ្គេម",soundHelp:"បើក ឬបិទសំឡេងជាជម្រើសក្នុងហ្គេម។",motion:"កាត់បន្ថយចលនា",motionHelp:"កាត់បន្ថយចលនានៅលើទំព័រដែលគាំទ្រ។ ការកំណត់កាត់បន្ថយចលនារបស់ឧបករណ៍អ្នកត្រូវបានគោរពជានិច្ច។",contrast:"កម្រិតពណ៌ខ្ពស់",contrastHelp:"បង្កើនកម្រិតពណ៌សម្រាប់អត្ថបទ និងប៊ូតុង។",childNote:"គ្រូ ឬគ្រួសាររបស់អ្នកគ្រប់គ្រងព័ត៌មានគណនីឯកជន។ អ្នកនៅតែអាចជ្រើសរើសភាសា និងការកំណត់ការរៀនបាន។",save:"រក្សាទុកការកំណត់",saving:"កំពុងរក្សាទុក…",reset:"ប្រើការកំណត់ដែលណែនាំ",privacyTitle:"គណនីនេះជារបស់អ្នក",privacyCopy:"នៅទីនេះ អ្នកអាចផ្លាស់ប្តូរតែឈ្មោះ ភាសា និងចំណូលចិត្តការរៀនប៉ុណ្ណោះ។ អ្នកមិនអាចផ្លាស់ប្តូរតួនាទី អ៊ីមែល ពាក្យសម្ងាត់ សិទ្ធិថ្នាក់រៀន ឬទំនាក់ទំនងគ្រួសារបានទេ។",footer:"QB Interactive Learning Kits · រៀនជាមួយគ្នា ម្តងបន្តិចៗ។",role_student:"គណនីសិស្ស",role_teacher:"គណនីគ្រូបង្រៀន",role_parent:"គណនីមាតាបិតា",role_admin:"គណនីអ្នកគ្រប់គ្រង",saved:"ការកំណត់របស់អ្នកត្រូវបានរក្សាទុកក្នុងគណនី។",unsaved:"អ្នកមានការផ្លាស់ប្តូរមិនទាន់រក្សាទុក។ តើអ្នកចង់រក្សាទុកមុនពេលចាកចេញទេ?",configError:"សូមភ្ជាប់ Supabase និងអនុវត្ត migration ចំណូលចិត្តគណនី ដើម្បីគ្រប់គ្រងការកំណត់ដែលបានរក្សាទុក។ សូមមើល supabase/README.md។",loadError:"មិនអាចផ្ទុកការកំណត់គណនីបានទេ។ សូមព្យាយាមម្តងទៀត។",saveError:"មិនអាចរក្សាទុកការផ្លាស់ប្តូរបានទេ។ សូមព្យាយាមម្តងទៀត។",resetDone:"បានជ្រើសរើសការកំណត់ដែលណែនាំ។ សូមរក្សាទុកដើម្បីអនុវត្ត។",sessionError:"សូមចូលគណនីដើម្បីគ្រប់គ្រងការកំណត់។",invalidName:"សូមបញ្ចូលឈ្មោះពី ១ ដល់ ៨០ តួអក្សរ។"
    }
  };
  let profile = null, savedSnapshot = "", ready = false, dirty = false;
  const getValues = () => ({
    displayName: $("display-name").value.trim(),
    language: $("language").value,
    soundEnabled: $("sound-enabled").checked,
    reducedMotion: $("reduced-motion").checked,
    highContrast: $("high-contrast").checked
  });
  const snapshot = (values) => JSON.stringify(values);
  const text = (key) => copy[$("language").value === "km" ? "km" : "en"][key];
  function translate() {
    const language = $("language").value === "km" ? "km" : "en", strings = copy[language];
    document.documentElement.lang = language;
    document.querySelectorAll("[data-i18n]").forEach((node) => { const value = strings[node.dataset.i18n]; if (value) node.textContent = value; });
    const roleKey = profile ? `role_${profile.role}` : "yourAccount";
    $("role-label").textContent = strings[roleKey] || strings.yourAccount;
    $("progress-link").hidden = profile?.role === "admin";
    if (profile?.role === "teacher") { $("progress-link").href = "/04._qb_teacher_dashboard/code.html"; $("progress-link").textContent = strings.teacherProgress; }
    else if (profile?.role === "parent") { $("progress-link").href = "/14._qb_parent_dashboard_weekly_digest/code.html"; $("progress-link").textContent = strings.parentProgress; }
    else { $("progress-link").href = "/15._qb_child_progress_learning_analytics/code.html"; $("progress-link").textContent = strings.progress; }
    document.title = language === "km" ? "ប្រវត្តិរូប និងការកំណត់ | QB Interactive Learning Kits" : "Profile & Settings | QB Interactive Learning Kits";
  }
  function setStatus(message, kind = "info") { $("account-state").textContent = message; $("account-state").dataset.kind = kind; $("account-state").lang = $("language").value; }
  function setEnabled(enabled) { ["display-name", "language", "sound-enabled", "reduced-motion", "high-contrast", "save-settings", "reset-settings"].forEach((id) => { $(id).disabled = !enabled; }); }
  function formChanged() { if (!ready) return; dirty = snapshot(getValues()) !== savedSnapshot; $("save-settings").disabled = !dirty; }
  async function signOut() {
    try { await QBSupabase.signOut(); location.assign("/16._qb_unified_sign_in_sign_up/code.html"); }
    catch (_) { setStatus(text("saveError"), "error"); }
  }
  async function load() {
    translate();
    if (!QBSupabase?.configured) { setStatus(text("configError"), "error"); return; }
    try {
      const session = await QBSupabase.getSession();
      if (!session) { location.replace("/16._qb_unified_sign_in_sign_up/code.html?next=settings"); setStatus(text("sessionError"), "error"); return; }
      const settings = await QBSupabase.getAccountSettings();
      profile = settings.profile;
      if (!profile || !["student", "teacher", "parent", "admin"].includes(profile.role)) throw new Error("Account profile is unavailable.");
      $("display-name").value = profile.displayName || "";
      $("language").value = profile.language === "km" ? "km" : "en";
      $("sound-enabled").checked = settings.preferences?.soundEnabled !== false;
      $("reduced-motion").checked = settings.preferences?.reducedMotion === true;
      $("high-contrast").checked = settings.preferences?.highContrast === true;
      const isStudent = profile.role === "student";
      document.querySelectorAll("[data-adult-only]").forEach((node) => { node.hidden = isStudent; });
      const email = session.user.email || "";
      $("account-email").value = email;
      $("account-email").closest(".account-field").hidden = isStudent || !email;
      $("child-note").hidden = !isStudent;
      signOutButton.hidden = false;
      signOutButton.style.removeProperty("display");
      signOutButton.addEventListener("click", signOut);
      translate(); setEnabled(true); ready = true; savedSnapshot = snapshot(getValues()); dirty = false;
      if (window.QBApplyAccountPreferences) window.QBApplyAccountPreferences(settings.preferences);
      $("save-settings").disabled = true;
      setStatus(copy[$("language").value].saved, "success");
    } catch (_) { setStatus(text("loadError"), "error"); }
  }
  $("settings-form").addEventListener("input", formChanged);
  $("settings-form").addEventListener("change", formChanged);
  $("language").addEventListener("change", () => { translate(); formChanged(); });
  $("reset-settings").addEventListener("click", () => {
    $("sound-enabled").checked = true; $("reduced-motion").checked = false; $("high-contrast").checked = false;
    formChanged(); setStatus(text("resetDone"));
  });
  $("settings-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!ready) return;
    const values = getValues();
    if (!values.displayName || values.displayName.length > 80) { setStatus(text("invalidName"), "error"); $("display-name").focus(); return; }
    const save = $("save-settings"); save.disabled = true; save.textContent = text("saving");
    try {
      const result = await QBSupabase.saveAccountSettings(values);
      profile = result.profile || profile; savedSnapshot = snapshot(values); dirty = false;
      if (window.QBApplyAccountPreferences) window.QBApplyAccountPreferences(result.preferences || values);
      translate(); setStatus(text("saved"), "success");
    } catch (_) { setStatus(text("saveError"), "error"); }
    finally { save.textContent = text("save"); save.disabled = !dirty; }
  });
  window.addEventListener("beforeunload", (event) => { if (dirty) { event.preventDefault(); event.returnValue = ""; } });
  load();
})();
