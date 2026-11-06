/* Supabase browser client for the existing static HTML application. */
(function (global) {
  "use strict";

  if (global.QBSupabase) return;
  const config = global.QB_SUPABASE_CONFIG;
  const sdk = global.supabase;
  const configured = Boolean(
    config &&
    /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(config.url || "") &&
    /^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey || "")
  );

  let client = null;
  if (configured && sdk && typeof sdk.createClient === "function") {
    client = sdk.createClient(config.url, config.publishableKey, {
      auth: { flowType: "implicit", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  }

  function requireClient() {
    if (!client) {
      throw new Error("Supabase is not configured. Follow the local setup steps in supabase/README.md.");
    }
    return client;
  }

  async function signIn(email, password) {
    const { data, error } = await requireClient().auth.signInWithPassword({
      email: String(email || "").trim(),
      password: String(password || "")
    });
    if (error) throw error;
    return data;
  }

  async function signUp(email, password, displayName, emailRedirectTo) {
    const cleanEmail = String(email || "").trim();
    const cleanName = String(displayName || "").trim().slice(0, 80);
    if (!cleanName) throw new Error("Enter your name to create an account.");
    if (!cleanEmail) throw new Error("Enter your email address.");
    if (String(password || "").length < 8) throw new Error("Use a password with at least 8 characters.");
    const { data, error } = await requireClient().auth.signUp({
      email: cleanEmail,
      password: String(password),
      options: {
        emailRedirectTo: String(emailRedirectTo || ""),
        // Never accept a role from the browser. The database trigger assigns
        // the least-privileged student role to self-registered accounts.
        data: { display_name: cleanName }
      }
    });
    if (error) throw error;
    return data;
  }

  async function getAuthProviders() {
    requireClient();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(config.url + "/auth/v1/settings", {
        headers: { apikey: config.publishableKey }, signal: controller.signal, cache: "no-store"
      });
      if (!response.ok) throw Object.assign(new Error("Unable to check sign-in settings."), { code: "network" });
      const settings = await response.json();
      return { google: settings.external?.google === true };
    } catch (error) {
      if (error.name === "AbortError") throw Object.assign(new Error("Sign-in check timed out."), { code: "timeout" });
      throw error;
    } finally { clearTimeout(timer); }
  }

  async function signInWithGoogle(redirectTo) {
    const { data, error } = await requireClient().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: (() => { const target = new URL(redirectTo, global.location.origin); if (target.origin !== global.location.origin || target.pathname !== "/auth/callback.html") throw new Error("Invalid sign-in destination."); return target.href; })(), scopes: "openid email profile", queryParams: { prompt: "select_account" } }
    });
    if (error) throw error;
    return data;
  }

  async function requestPasswordReset(email, redirectTo) {
    const cleanEmail = String(email || "").trim();
    if (!cleanEmail) throw new Error("Enter the email address for your account.");
    const { data, error } = await requireClient().auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: String(redirectTo || "")
    });
    if (error) throw error;
    return data;
  }

  async function updatePassword(password) {
    const nextPassword = String(password || "");
    if (nextPassword.length < 8) throw new Error("Use a password with at least 8 characters.");
    const { data, error } = await requireClient().auth.updateUser({ password: nextPassword });
    if (error) throw error;
    return data;
  }

  async function signOut() {
    const { error } = await requireClient().auth.signOut();
    if (error) throw error;
  }

  async function getSession() {
    const { data, error } = await requireClient().auth.getSession();
    if (error) throw error;
    return data.session;
  }

  async function getVerifiedUser() {
    const { data, error } = await requireClient().auth.getUser();
    if (error) throw error;
    return data.user;
  }

  async function updateOwnDisplayName(displayName) {
    const name = String(displayName || "").trim().slice(0, 80);
    if (name.length < 2) throw new Error("Please enter a name with at least two characters.");
    const user = await getVerifiedUser();
    if (!user) throw new Error("Sign in again to finish setting up your profile.");
    const { data, error } = await requireClient().from("profiles").update({ display_name: name }).eq("id", user.id).select("id,display_name,role").single();
    if (error) throw error;
    return data;
  }

  function onAuthStateChange(callback) {
    return requireClient().auth.onAuthStateChange(callback).data.subscription;
  }

  async function getProfile(userId) {
    const { data, error } = await requireClient().from("profiles").select("id, display_name, role").eq("id", userId).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function getAccountSettings() {
    const { data, error } = await requireClient().rpc("get_account_settings");
    if (error) throw error;
    return data;
  }

  async function saveAccountSettings(settings) {
    const { data, error } = await requireClient().rpc("save_account_settings", {
      profile_display_name: String(settings?.displayName || "").trim(),
      profile_language: settings?.language,
      setting_sound_enabled: settings?.soundEnabled === true,
      setting_reduced_motion: settings?.reducedMotion === true,
      setting_high_contrast: settings?.highContrast === true
    });
    if (error) throw error;
    return data;
  }

  async function getLiteracyActivities() {
    const supabase = requireClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session) return { authenticated: false, activities: [] };
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role,preferred_language").eq("id", sessionData.session.user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.role !== "student") return { authenticated: true, authorized: false, activities: [] };
    const { data, error } = await supabase.from("literacy_activities")
      .select("id,slug,title,language,learning_area,learning_objective,instructions,illustration,min_age,max_age,estimated_minutes")
      .eq("published", true).order("language").order("learning_area").order("title");
    if (error) throw error;
    return { authenticated: true, authorized: true, preferredLanguage: profile.preferred_language, activities: data || [] };
  }

  async function getLiteracyQuestions(activityId) {
    const { data, error } = await requireClient().from("literacy_questions")
      .select("id,position,prompt,choices,illustration,audio_path")
      .eq("activity_id", activityId).order("position");
    if (error) throw error;
    return data || [];
  }

  async function getLiteracyAttempts(activityId) {
    let query = requireClient().from("literacy_attempts")
      .select("id,activity_id,status,total_questions,score,started_at,completed_at")
      .order("started_at", { ascending: false }).limit(50);
    if (activityId) query = query.eq("activity_id", activityId);
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  }

  async function getLiteracyAnswers(attemptId) {
    const { data, error } = await requireClient().from("literacy_answers")
      .select("question_id,choice_id,is_correct,answered_at").eq("attempt_id", attemptId);
    if (error) throw error;
    return data || [];
  }

  async function startLiteracyAttempt(activityId) {
    const { data, error } = await requireClient().rpc("start_literacy_attempt", { target_activity: activityId });
    if (error) throw error;
    return data;
  }

  async function submitLiteracyAnswer(attemptId, questionId, choiceId) {
    const { data, error } = await requireClient().rpc("submit_literacy_answer", {
      target_attempt: attemptId, target_question: questionId, submitted_choice: choiceId
    });
    if (error) throw error;
    return data;
  }

  async function getReadingLibrary() {
    const supabase = requireClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session) return { authenticated: false, books: [], worksheets: [], progress: [] };
    const [profileResult, booksResult, worksheetsResult, progressResult] = await Promise.all([
      supabase.from("profiles").select("preferred_language").eq("id", sessionData.session.user.id).maybeSingle(),
      supabase.from("digital_books").select("id,owner_id,title,description,language,reading_level,category,min_age,max_age,cover_path,cover_alt,published,visibility,pages:book_pages(id,page_number,body,illustration_path,illustration_alt,narration_path)").order("title"),
      supabase.from("worksheets").select("id,owner_id,title,description,language,category,min_age,max_age,difficulty,preview_path,file_path,published,visibility").order("title"),
      supabase.from("reading_progress").select("book_id,last_page_number,updated_at")
    ]);
    for (const result of [profileResult, booksResult, worksheetsResult, progressResult]) if (result.error) throw result.error;
    return { authenticated: true, userId: sessionData.session.user.id, preferredLanguage: profileResult.data?.preferred_language || "en", books: booksResult.data || [], worksheets: worksheetsResult.data || [], progress: progressResult.data || [] };
  }

  async function saveReadingProgress(bookId, pageNumber) {
    const { data, error } = await requireClient().rpc("save_reading_progress", { target_book: bookId, target_page: pageNumber });
    if (error) throw error;
    return data;
  }

  async function resolveLibraryMedia(path, download = false) {
    if (typeof path !== "string" || !path.trim() || path.startsWith("/") || /^(https?:|data:|blob:)/i.test(path)) {
      throw new Error("This library file reference is not available.");
    }
    const options = download ? { download: true } : undefined;
    const { data, error } = await requireClient().storage.from("question-set-media").createSignedUrl(path, download ? 300 : 3600, options);
    if (error) throw error;
    return data.signedUrl;
  }

  async function getGameLibrary() {
    const supabase = requireClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session) {
      const { data, error } = await supabase.rpc("get_public_game_library");
      if (error) throw error;
      return { authenticated: false, authorized: true, games: data || [] };
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("role").eq("id", sessionData.session.user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return { authenticated: true, authorized: false, games: [] };
    const { data, error } = await supabase
      .from("activities")
      .select("id, slug, title, short_description, category, language, min_age, max_age, difficulty, duration_minutes, game_type, engine_type, thumbnail_url, route")
      .order("title", { ascending: true });
    if (error) throw error;
    return { authenticated: true, authorized: true, role: profile.role, games: data || [] };
  }

  async function getPlayableActivities() {
    const supabase = requireClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session) return { authenticated: false, activities: [] };
    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("role").eq("id", sessionData.session.user.id).maybeSingle();
    if (profileError) throw profileError;
    if (!profile || profile.role !== "student") return { authenticated: true, authorized: false, activities: [] };
    const { data, error } = await supabase.from("activities")
      .select("id, title, engine_type")
      .not("engine_type", "is", null)
      .eq("active", true).eq("published", true).order("title", { ascending: true });
    if (error) throw error;
    return { authenticated: true, authorized: true, activities: data || [] };
  }

  async function getLatestActiveGameSession(activityIds) {
    if (!Array.isArray(activityIds) || activityIds.length === 0) return null;
    const { data, error } = await requireClient().from("game_sessions")
      .select("id, activity_id, assignment_id")
      .in("activity_id", activityIds).eq("status", "in_progress")
      .order("started_at", { ascending: false }).limit(1).maybeSingle();
    if (error) throw error;
    return data;
  }

  async function startGameSession(activityId, assignmentId) {
    const { data, error } = await requireClient().rpc("start_game_session", {
      target_activity: activityId,
      target_assignment: assignmentId || null
    });
    if (error) throw error;
    return data;
  }

  async function resumeGameSession(sessionId) {
    const { data, error } = await requireClient().rpc("resume_game_session", { target_session: sessionId });
    if (error) throw error;
    return data;
  }

  async function submitGameAnswer(sessionId, position, response) {
    const { data, error } = await requireClient().rpc("submit_game_answer", {
      target_session: sessionId,
      target_position: position,
      submitted: response
    });
    if (error) throw error;
    return data;
  }

  async function finishGameSession(sessionId) {
    const { data, error } = await requireClient().rpc("finish_game_session", { target_session: sessionId });
    if (error) throw error;
    return data;
  }

  async function restartGameSession(sessionId) {
    const { data, error } = await requireClient().rpc("restart_game_session", { target_session: sessionId });
    if (error) throw error;
    return data;
  }

  async function abandonGameSession(sessionId) {
    const { data, error } = await requireClient().rpc("abandon_game_session", { target_session: sessionId });
    if (error) throw error;
    return data;
  }

  async function listQuestionSets() {
    const supabase = requireClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session) return { authenticated: false, sets: [] };
    const { data, error } = await supabase.from("question_sets")
      .select("id,title,description,language,category,difficulty,compatible_games,status,updated_at,published_at")
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return { authenticated: true, sets: data || [] };
  }

  async function getQuestionSet(id) {
    const supabase = requireClient();
    const { data: set, error } = await supabase.from("question_sets")
      .select("id,title,description,language,category,difficulty,compatible_games,status,updated_at,published_at")
      .eq("id", id).maybeSingle();
    if (error) throw error;
    if (!set) return null;
    const { data: questions, error: questionsError } = await supabase.from("question_set_questions")
      .select("id,position,prompt,instructions,image_path,image_alt,audio_path,choices,correct_choice_id,explanation")
      .eq("set_id", id).order("position");
    if (questionsError) throw questionsError;
    return { ...set, questions: questions || [] };
  }

  async function saveQuestionSet(payload) {
    const { data, error } = await requireClient().rpc("save_question_set", { payload });
    if (error) throw error;
    return data;
  }

  async function publishQuestionSet(id) {
    const { data, error } = await requireClient().rpc("publish_question_set", { target_set: id });
    if (error) throw error;
    return data;
  }

  async function createGameFromQuestionSet(id, engineType) {
    const { data, error } = await requireClient().rpc("create_game_from_question_set", { target_set: id, target_engine: engineType });
    if (error) throw error;
    return data;
  }

  async function resolveQuestionMedia(path) {
    if (/^(https?:|data:|blob:|\/)/i.test(path || "")) return path;
    const { data, error } = await requireClient().storage.from("question-set-media").createSignedUrl(path, 3600);
    if (error) throw error;
    return data.signedUrl;
  }

  async function uploadToStorage(path, file, onProgress) {
    const supabase = requireClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const userId = sessionData.session?.user?.id;
    if (!userId) throw new Error("Sign in as a teacher to upload media.");
    if (!path.startsWith(`${userId}/`)) throw new Error("The media path does not belong to this teacher account.");
    const rawMime = (file.type || "application/octet-stream").split(";")[0];
    const mime = rawMime === "audio/x-wav" ? "audio/wav" : rawMime;
    await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${config.url.replace(/\/$/, "")}/storage/v1/object/question-set-media/${path.split("/").map(encodeURIComponent).join("/")}`);
      xhr.setRequestHeader("apikey", config.publishableKey);
      xhr.setRequestHeader("Authorization", `Bearer ${sessionData.session.access_token}`);
      xhr.setRequestHeader("Content-Type", mime);
      xhr.setRequestHeader("x-upsert", "true");
      xhr.setRequestHeader("cache-control", "3600");
      xhr.upload.onprogress = (event) => { if (event.lengthComputable && typeof onProgress === "function") onProgress(Math.round(event.loaded / event.total * 100)); };
      xhr.onerror = () => reject(new Error("Upload was interrupted. Check your connection and retry."));
      xhr.onabort = () => reject(new Error("Upload was cancelled. You can retry it."));
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else { let detail = "Media upload failed."; try { detail = JSON.parse(xhr.responseText).message || JSON.parse(xhr.responseText).error || detail; } catch (_) {} reject(new Error(detail)); }
      };
      xhr.send(file);
    });
    return path;
  }

  async function uploadQuestionMedia(setId, file, onProgress, retryPath) {
    const supabase = requireClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const userId = sessionData.session?.user?.id;
    if (!userId) throw new Error("Sign in as a teacher to upload media.");
    const extension = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "");
    const path = retryPath || `${userId}/${setId}/${crypto.randomUUID()}.${extension}`;
    await uploadToStorage(path, file, onProgress);
    return path;
  }

  async function prepareQuestionMediaUpload(setId, file) {
    const { data, error } = await requireClient().auth.getSession();
    if (error) throw error;
    const userId=data.session?.user?.id;
    if(!userId) throw new Error("Sign in as a teacher to upload media.");
    const extension=(file.name.split(".").pop()||"bin").toLowerCase().replace(/[^a-z0-9]/g,"");
    return `${userId}/${setId}/${crypto.randomUUID()}.${extension}`;
  }

  async function prepareMediaUpload(file) {
    const { data, error } = await requireClient().auth.getSession();
    if (error) throw error;
    const userId = data.session?.user?.id;
    if (!userId) throw new Error("Sign in as a teacher to upload media.");
    const assetId = crypto.randomUUID();
    const extension = (file.name.split(".").pop() || "webm").toLowerCase().replace(/[^a-z0-9]/g, "") || "webm";
    return { id: assetId, path: `${userId}/library/${assetId}.${extension}` };
  }

  async function uploadMediaFile(target, file, onProgress) { return uploadToStorage(target.path, file, onProgress); }

  async function registerMediaAsset(payload) {
    const { data, error } = await requireClient().rpc("register_media_asset", { payload });
    if (error) throw error;
    return data;
  }

  async function listMediaAssets() {
    const supabase = requireClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session) return { authenticated: false, assets: [] };
    const { data, error } = await supabase.from("media_assets")
      .select("id,storage_path,title,media_kind,purpose,language,mime_type,byte_size,alt_text,created_at")
      .order("created_at", { ascending: false }).limit(100);
    if (error) throw error;
    return { authenticated: true, assets: data || [] };
  }

  async function getChildDashboard() {
    const supabase = requireClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    const session = sessionData.session;
    if (!session) return { authenticated: false };

    const userId = session.user.id;
    const [profileResult, membershipResult, assignmentsResult, sessionsResult, literacyAttemptsResult, rewardsResult, activitiesResult, literacyActivitiesResult] = await Promise.all([
      supabase.from("profiles").select("display_name, role, preferred_language, avatar_id, daily_goal_sessions").eq("id", userId).maybeSingle(),
      supabase.from("class_members").select("class_id").eq("student_id", userId),
      supabase.from("assignments").select("id, title, instructions, due_at, created_at, class_id, student_id, activity_id, activity:activities(id, slug, title, category, route, engine_type)").order("created_at", { ascending: false }),
      supabase.from("game_sessions").select("id, student_id, assignment_id, activity_id, started_at, completed_at, duration_seconds, score, stars_earned, status, activity:activities(id, slug, title, category, route, engine_type)").order("started_at", { ascending: false }),
      supabase.from("literacy_attempts").select("id, student_id, activity_id, started_at, completed_at, status, score, activity:literacy_activities(id, slug, title, language, learning_area)").order("started_at", { ascending: false }),
      supabase.from("student_achievements").select("earned_at, achievement:achievements(slug, title, description, icon)").eq("student_id", userId).order("earned_at", { ascending: false }),
      supabase.from("activities").select("id, slug, title, category, route, engine_type").eq("active", true).order("title"),
      supabase.from("literacy_activities").select("id, slug, title, language, learning_area").eq("published", true).order("title")
    ]);
    for (const result of [profileResult, membershipResult, assignmentsResult, sessionsResult, literacyAttemptsResult, rewardsResult, activitiesResult, literacyActivitiesResult]) {
      if (result.error) throw result.error;
    }

    const profile = profileResult.data;
    if (!profile || profile.role !== "student") {
      return { authenticated: true, authorized: false, role: profile?.role || null };
    }
    const { data: rewards, error: rewardsError } = await supabase.rpc("get_student_rewards");
    if (rewardsError) throw rewardsError;

    const classIds = new Set((membershipResult.data || []).map((row) => row.class_id));
    const assignments = (assignmentsResult.data || []).filter((row) => classIds.has(row.class_id) && (!row.student_id || row.student_id === userId)).map((assignment) => {
      const assignmentSessions = (sessionsResult.data || []).filter((session) => session.assignment_id === assignment.id && session.student_id === userId && session.activity_id === assignment.activity_id);
      const completed = assignmentSessions.filter((session) => session.status === "completed").sort((a, b) => new Date(b.completed_at || 0) - new Date(a.completed_at || 0))[0];
      const inProgress = assignmentSessions.some((session) => session.status === "in_progress");
      return { ...assignment, status: completed ? "completed" : inProgress ? "in_progress" : "assigned", score: completed?.score ?? null, completedAt: completed?.completed_at || null };
    });
    const sessions = [
      ...(sessionsResult.data || []).map((session) => ({ ...session, learningType: "game" })),
      ...(literacyAttemptsResult.data || []).map((attempt) => ({
        ...attempt,
        assignment_id: null,
        learningType: "literacy",
        activity: attempt.activity ? {
          ...attempt.activity,
          category: attempt.activity.learning_area,
          route: "/literacy.html",
          activity_type: "literacy"
        } : null
      }))
    ].sort((a, b) => new Date(b.started_at || 0) - new Date(a.started_at || 0));
    const today = new Date();
    const startToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayCompleted = sessions.filter((row) => {
      if (row.status !== "completed" || !row.completed_at) return false;
      const completedAt = new Date(row.completed_at);
      return completedAt >= startToday && completedAt <= today;
    }).length;

    return {
      authenticated: true,
      authorized: true,
      profile,
      assignments,
      activities: activitiesResult.data || [],
      literacyActivities: (literacyActivitiesResult.data || []).map((activity) => ({ ...activity, category: activity.learning_area, route: "/literacy.html", activity_type: "literacy" })),
      sessions,
      achievements: rewardsResult.data || [],
      rewards,
      dailyGoal: profile.daily_goal_sessions,
      todayCompleted,
      hasLearningActivity: sessions.length > 0
    };
  }

  async function getTeacherDashboard(daysBack = 30) {
    const supabase = requireClient();
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) throw sessionError;
    if (!sessionData.session) return { authenticated: false };
    const { data, error } = await supabase.rpc("get_teacher_dashboard", { days_back: daysBack });
    if (error) throw error;
    return { authenticated: true, authorized: true, ...data };
  }

  async function getTeacherClassroom(classId, studentId) {
    const { data, error } = await requireClient().rpc("get_teacher_classroom", {
      target_class: classId || null,
      target_student: studentId || null
    });
    if (error) throw error;
    return data;
  }

  async function createTeacherClass(name, gradeLevel) {
    const { data, error } = await requireClient().rpc("create_teacher_class", {
      class_name: name,
      class_grade: gradeLevel || null
    });
    if (error) throw error;
    return data;
  }

  async function updateTeacherClass(classId, name, gradeLevel) {
    const { data, error } = await requireClient().rpc("update_teacher_class", {
      target_class: classId,
      class_name: name,
      class_grade: gradeLevel || null
    });
    if (error) throw error;
    return data;
  }

  async function removeTeacherClassStudent(classId, studentId) {
    const { data, error } = await requireClient().rpc("remove_teacher_class_student", {
      target_class: classId,
      target_student: studentId
    });
    if (error) throw error;
    return data;
  }

  async function rotateTeacherClassCode(classId) {
    const { data, error } = await requireClient().rpc("rotate_teacher_class_code", { target_class: classId });
    if (error) throw error;
    return data;
  }

  async function joinClassWithCode(code) {
    const { data, error } = await requireClient().rpc("join_class_with_code", { invitation_code: code });
    if (error) throw error;
    return data;
  }

  async function createLiveGameRoom(assignmentId) {
    const { data, error } = await requireClient().rpc("create_live_game_room", { target_assignment: assignmentId });
    if (error) throw error;
    return data;
  }

  async function joinLiveGameRoom(code) {
    const { data, error } = await requireClient().rpc("join_live_game_room", { invitation_code: code });
    if (error) throw error;
    return data;
  }

  async function getLiveGameRoomState(roomId) {
    const { data, error } = await requireClient().rpc("get_live_game_room_state", { target_room: roomId });
    if (error) throw error;
    return data;
  }

  async function startLiveGameRoom(roomId) {
    const { data, error } = await requireClient().rpc("start_live_game_room", { target_room: roomId });
    if (error) throw error;
    return data;
  }

  async function finishLiveGameRoom(roomId) {
    const { data, error } = await requireClient().rpc("finish_live_game_room", { target_room: roomId });
    if (error) throw error;
    return data;
  }

  async function createTeacherAssignment(classId, activityId, title, studentId, dueAt) {
    const { data, error } = await requireClient().rpc("create_teacher_assignment", {
      target_class: classId,
      target_activity: activityId,
      assignment_title: title,
      target_student: studentId || null,
      assignment_due: dueAt || null
    });
    if (error) throw error;
    return data;
  }

  async function publishTeacherAssignment(payload) {
    const { data, error } = await requireClient().rpc("publish_teacher_assignment", {
      target_class: payload.classId,
      target_activity: payload.activityId,
      assignment_title: payload.title,
      assignment_instructions: payload.instructions || "",
      target_students: payload.studentIds || [],
      whole_class: Boolean(payload.wholeClass),
      assignment_due: payload.dueAt || null,
      publish_request: payload.requestKey
    });
    if (error) throw error;
    return data;
  }

  async function getTeacherAssignmentProgress(classId) {
    const { data, error } = await requireClient().rpc("get_teacher_assignment_progress", { target_class: classId });
    if (error) throw error;
    return data || [];
  }

  async function getProgressReportStudents() {
    const { data, error } = await requireClient().rpc("get_progress_report_students");
    if (error) throw error;
    return data || [];
  }

  async function getProgressReport(studentId, fromDate, toDate) {
    const { data, error } = await requireClient().rpc("get_progress_report", {
      target_student: studentId || null,
      period_start: fromDate,
      period_end: toDate
    });
    if (error) throw error;
    return data;
  }

  async function getParentAchievements(studentId, fromDate, toDate) {
    const allowedChildren = await getProgressReportStudents();
    if (!allowedChildren.some((child) => child.id === studentId)) {
      throw new Error("This learner is not linked to your account.");
    }
    const { data, error } = await requireClient().from("student_achievements")
      .select("earned_at, achievement:achievements(title,description,icon)")
      .eq("student_id", studentId).gte("earned_at", fromDate).lt("earned_at", toDate)
      .order("earned_at", { ascending: false }).limit(12);
    if (error) throw error;
    return data || [];
  }

  global.QBSupabase = Object.freeze({
    get configured() { return Boolean(client); },
    signIn,
    signUp,
    signInWithGoogle,
    getAuthProviders,
    requestPasswordReset,
    updatePassword,
    signOut,
    getSession,
    getProfile,
    getVerifiedUser,
    updateOwnDisplayName,
    onAuthStateChange,
    getAccountSettings,
    saveAccountSettings,
    getLiteracyActivities,
    getLiteracyQuestions,
    getLiteracyAttempts,
    getLiteracyAnswers,
    startLiteracyAttempt,
    submitLiteracyAnswer,
    getReadingLibrary,
    saveReadingProgress,
    resolveLibraryMedia,
    getChildDashboard,
    getTeacherDashboard,
    getTeacherClassroom,
    createTeacherClass,
    updateTeacherClass,
    removeTeacherClassStudent,
    rotateTeacherClassCode,
    joinClassWithCode,
    createLiveGameRoom,
    joinLiveGameRoom,
    getLiveGameRoomState,
    startLiveGameRoom,
    finishLiveGameRoom,
    createTeacherAssignment,
    publishTeacherAssignment,
    getTeacherAssignmentProgress,
    getProgressReportStudents,
    getProgressReport,
    getParentAchievements,
    getGameLibrary,
    getPlayableActivities,
    getLatestActiveGameSession,
    startGameSession,
    resumeGameSession,
    submitGameAnswer,
    finishGameSession,
    restartGameSession,
    abandonGameSession,
    listQuestionSets,
    getQuestionSet,
    saveQuestionSet,
    publishQuestionSet,
    createGameFromQuestionSet,
    resolveQuestionMedia,
    uploadQuestionMedia,
    prepareQuestionMediaUpload,
    prepareMediaUpload,
    uploadMediaFile,
    registerMediaAsset,
    listMediaAssets
  });
})(window);
