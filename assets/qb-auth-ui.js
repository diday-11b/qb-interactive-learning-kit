(function () {
  "use strict";
  const form = document.getElementById("auth-form");
  const status = document.getElementById("auth-status");
  const email = document.getElementById("email");
  const password = document.getElementById("password");
  const confirmPassword = document.getElementById("confirm-password");
  const displayName = document.getElementById("display-name");
  const submit = document.getElementById("auth-submit");
  const submitLabel = document.getElementById("btn-text");
  const params = new URLSearchParams(location.search);
  if (!form || !email || !password || !status) return;

  let mode = params.get("mode") === "signup" ? "signup" : "signin";
  let resetMode = params.get("mode") === "reset-password";
  const byId = (id) => document.getElementById(id);

  function setStatus(message, isError) {
    status.hidden = !message;
    status.textContent = message || "";
    status.dataset.error = String(Boolean(isError));
  }

  function buildUrl(nextMode) {
    const query = new URLSearchParams(location.search);
    if (nextMode === "signin") query.delete("mode");
    else query.set("mode", nextMode);
    const suffix = query.toString();
    return location.pathname + (suffix ? "?" + suffix : "");
  }

  function setMode(nextMode) {
    mode = nextMode;
    resetMode = false;
    byId("auth-heading").dataset.mode = mode;
    submit.dataset.mode = mode;
    byId("auth-title").textContent = mode === "signup" ? "Join the Fun!" : "Welcome Back!";
    byId("auth-subtitle").textContent = mode === "signup" ? "Create your account and start learning!" : "Let's continue the adventure!";
    byId("display-name-field").hidden = mode !== "signup";
    displayName.required = mode === "signup";
    byId("confirm-field").hidden = mode !== "signup";
    confirmPassword.required = mode === "signup";
    byId("forgot-row").hidden = mode !== "signin";
    byId("role-note").hidden = mode !== "signup";
    byId("google-label").textContent = mode === "signup" ? "Sign up with Google" : "Continue with Google";
    byId("switch-copy").textContent = mode === "signup" ? "Already have an account?" : "New here?";
    byId("auth-switch-link").textContent = mode === "signup" ? "Log in!" : "Create an account!";
    byId("auth-switch-link").href = buildUrl(mode === "signup" ? "signin" : "signup");
    submitLabel.textContent = mode === "signup" ? "Create Account" : "Let's Go!";
    password.autocomplete = mode === "signup" ? "new-password" : "current-password";
    password.placeholder = mode === "signup" ? "At least 8 characters" : "Your secret password";
    setStatus("");
  }

  let navigating = false;
  let busy = false;
  async function finishAuthentication() {
    if (navigating) return true;
    const result = await QBAuthFlow.resolve(params.get("next"));
    if (result.login) return false;
    if (navigating) return true;
    navigating = true;
    location.assign(result.path);
    return true;
  }

  function showPasswordReset() {
    resetMode = true;
    mode = "reset-password";
    byId("auth-title").textContent = "New Password";
    byId("auth-subtitle").textContent = "Choose a new password for your account.";
    byId("email-field").hidden = true;
    email.disabled = true;
    byId("display-name-field").hidden = true;
    byId("forgot-row").hidden = true;
    byId("confirm-field").hidden = false;
    confirmPassword.required = true;
    password.autocomplete = "new-password";
    password.placeholder = "At least 8 characters";
    byId("auth-extra").hidden = true;
    submitLabel.textContent = "Save New Password";
    setStatus("");
  }

  byId("auth-switch-link").addEventListener("click", (event) => {
    event.preventDefault();
    location.assign(buildUrl(mode === "signup" ? "signin" : "signup"));
  });

  byId("password-toggle").addEventListener("click", (event) => {
    const button = event.currentTarget;
    const visible = password.type === "password";
    password.type = visible ? "text" : "password";
    button.setAttribute("aria-label", visible ? "Hide password" : "Show password");
    button.setAttribute("aria-pressed", String(visible));
  });

  byId("forgot-link").addEventListener("click", async (event) => {
    event.preventDefault();
    if (!email.value.trim() || !email.checkValidity()) {
      setStatus("Enter your account email first.", true);
      email.focus();
      return;
    }
    try {
      if (!window.QBSupabase?.configured) throw new Error("Connect Supabase first using the steps in supabase/README.md.");
      await QBSupabase.requestPasswordReset(email.value, location.origin + location.pathname + "?mode=reset-password");
      setStatus("If an account exists for that email, password reset instructions will be sent.");
    } catch (error) { setStatus(error.message || "We couldn’t request a reset. Please try again.", true); }
  });

  byId("google-auth").addEventListener("click", async () => {
    if (busy) return;
    busy = true; const google = byId("google-auth");google.disabled = true;submit.disabled = true;
    const oldLabel = byId("google-label").textContent;byId("google-label").textContent = "Connecting to Google…";setStatus("");
    try {
      if (!window.QBSupabase?.configured) throw { code: "configuration" };
      await QBAuthFlow.beginGoogle(params.get("next"));
      setTimeout(() => { if(document.visibilityState === "visible"){busy=false;google.disabled=false;submit.disabled=false;byId("google-label").textContent=oldLabel;setStatus("If Google did not open, try again. Your browser or provider settings may have blocked the redirect.",true);} },10000);
    } catch (error) {
      setStatus(QBAuthFlow.message(error), true);busy = false;google.disabled = false;submit.disabled = false;byId("google-label").textContent = oldLabel;
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    busy = true;byId("google-auth").disabled = true;
    const originalLabel = mode === "signup" ? "Create Account" : "Let's Go!";
    submit.disabled = true;
    submitLabel.textContent = mode === "signup" ? "Creating…" : resetMode ? "Saving…" : "Signing in…";
    setStatus("");
    try {
      if (!window.QBSupabase?.configured) throw new Error("Supabase is not configured. Follow supabase/README.md to connect the project.");
      if (resetMode) {
        if (password.value !== confirmPassword.value) throw new Error("Those passwords don’t match yet.");
        if (!await QBSupabase.getSession()) throw new Error("This reset link has expired. Request a new password reset email.");
        await QBSupabase.updatePassword(password.value);
        form.reset();
        setStatus("Password updated. You can now sign in with your new password.");
        return;
      }
      if (mode === "signup") {
        if (password.value.length < 8) throw new Error("Use a password with at least 8 characters.");
        if (password.value !== confirmPassword.value) throw new Error("Those passwords don’t match yet.");
        const result = await QBSupabase.signUp(email.value, password.value, displayName.value, location.origin + location.pathname + "?next=student");
        if (result.session && await finishAuthentication()) return;
        form.reset();
        setStatus("Your account is ready. Check your email to confirm it, then sign in.");
        return;
      }
      await QBSupabase.signIn(email.value, password.value);
      if (await finishAuthentication()) return;
      setStatus("Check your email to confirm your account, then sign in.", true);
    } catch (error) {
      setStatus(error?.message || "We couldn’t complete that request. Check your details and try again.", true);
    } finally {
      busy = false;byId("google-auth").disabled = false;submit.disabled = false;
      if (!resetMode) submitLabel.textContent = originalLabel;
    }
  });

  if (params.get("mode") === "reset-password") showPasswordReset();
  else setMode(mode);
  const authError = params.get("error_code") || params.get("error");
  if (authError) { setStatus(QBAuthFlow.message({code:authError}), true);const cleanQuery=new URLSearchParams();if(mode==="signup")cleanQuery.set("mode","signup");if(params.has("next"))cleanQuery.set("next",QBAuthFlow.safeNext(params.get("next")));history.replaceState(null,"",location.pathname+(cleanQuery.size?"?"+cleanQuery:"")); }
  else if (!resetMode && window.QBSupabase?.configured) {
    finishAuthentication().catch(error => setStatus(QBAuthFlow.message(error), true));
  }
  if (window.QBSupabase?.configured) {
    const subscription = QBSupabase.onAuthStateChange((event) => {
      // Never await Supabase calls inside this callback: the SDK may hold a lock.
      if (event === "SIGNED_OUT") {
        navigating=false;busy=false;submit.disabled=false;byId("google-auth").disabled=false;
        setStatus("You are signed out. Choose a sign-in method to continue.");
      }
      if (event === "PASSWORD_RECOVERY") setTimeout(showPasswordReset,0);
    });
    window.addEventListener("pagehide", event => { if(!event.persisted)subscription.unsubscribe(); },{once:true});
  }
  window.addEventListener("pageshow", event => { if(event.persisted){busy=false;byId("google-auth").disabled=false;submit.disabled=false;byId("google-label").textContent=mode==="signup"?"Sign up with Google":"Continue with Google";} });
})();
