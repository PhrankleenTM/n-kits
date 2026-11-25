/* ============================================
   N-KITS – Auth (Supabase when configured,
   localStorage fallback otherwise)
   ============================================ */

const USER_KEY = "retrokit_user";
let memoryUser = null;

function userFromSession(user) {
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    name: meta.name || meta.full_name || (user.email || "").split("@")[0],
    email: user.email || ""
  };
}

function authClient() {
  return typeof Store !== "undefined" ? Store.supabase() : null;
}

/* Resolves once the Supabase session (if any) has been hydrated. */
const authReadyPromise = (async () => {
  const sb = authClient();
  if (!sb) return;
  try {
    const { data } = await sb.auth.getSession();
    if (data && data.session) memoryUser = userFromSession(data.session.user);
    else {
      try {
        const raw = localStorage.getItem(USER_KEY);
        if (raw) memoryUser = JSON.parse(raw);
      } catch (e) {}
    }
    sb.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session ? userFromSession(session.user) : null, true);
    });
    updateAuthUI();
  } catch (e) {}
})();

function authReady() {
  return authReadyPromise;
}

function getCurrentUser() {
  if (memoryUser) return memoryUser;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCurrentUser(user, fromSupabase) {
  memoryUser = user;
  try {
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(USER_KEY);
  } catch (e) {}
  updateAuthUI();
}

async function register(name, email, password) {
  const sb = authClient();
  if (sb) {
    try {
      const { data, error } = await sb.auth.signUp({
        email: email.toLowerCase(),
        password,
        options: { data: { name } }
      });
      if (error) return { success: false, message: error.message, code: error.code };
      // With "Confirm email" on, Supabase returns the same user with an
      // empty identities array when the address is already registered.
      if (data && data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
        return { success: false, message: "Email already registered — log in instead", code: "user_already_exists" };
      }
      if (data && data.session) {
        setCurrentUser(userFromSession(data.session.user));
        return { success: true };
      }
      return { success: true, needsVerification: true, email: email.toLowerCase() };
    } catch (e) {
      return { success: false, message: e.message || "Signup failed" };
    }
  }

  const users = readUsers();
  if (users.find((u) => u.email === email.toLowerCase())) {
    return { success: false, message: "Email already registered" };
  }
  const user = { id: Date.now(), name, email: email.toLowerCase(), password };
  users.push(user);
  try { localStorage.setItem("retrokit_users", JSON.stringify(users)); } catch (e) {}
  setCurrentUser({ id: user.id, name: user.name, email: user.email });
  return { success: true };
}

async function login(email, password) {
  const sb = authClient();
  if (sb) {
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email: email.toLowerCase(), password });
      if (error) return { success: false, message: error.message || "Invalid email or password", code: error.code };
      setCurrentUser(userFromSession(data.user));
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message || "Login failed", code: e.code };
    }
  }

  const users = readUsers();
  const user = users.find((u) => u.email === email.toLowerCase() && u.password === password);
  if (!user) return { success: false, message: "Invalid email or password" };
  setCurrentUser({ id: user.id, name: user.name, email: user.email });
  return { success: true };
}

/* ---------- email OTP (verification + password reset) ---------- */

/* type: "signup" (verify.html?type=signup) or "recovery" (reset password) */
async function verifyOtpCode(email, token, type) {
  const sb = authClient();
  if (!sb) return { success: false, message: "Email verification needs Supabase — add your keys in js/config.js" };
  try {
    const { data, error } = await sb.auth.verifyOtp({
      email: String(email || "").toLowerCase(),
      token: String(token || "").replace(/\D/g, ""),
      type: type || "signup"
    });
    if (error) return { success: false, message: error.message || "Invalid or expired code", code: error.code };
    if (data && data.session) setCurrentUser(userFromSession(data.session.user));
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message || "Verification failed" };
  }
}

async function resendOtpCode(email, type) {
  const sb = authClient();
  if (!sb) return { success: false, message: "Email verification needs Supabase" };
  try {
    const { error } = await sb.auth.resend({
      email: String(email || "").toLowerCase(),
      type: type || "signup"
    });
    if (error) return { success: false, message: error.message || "Could not resend code" };
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message || "Could not resend code" };
  }
}

/* Clicked the link in the email instead of typing the code? */
async function exchangeRecoveryCode(code) {
  const sb = authClient();
  if (!sb) return { success: false, message: "Supabase is not configured" };
  try {
    const { data, error } = await sb.auth.exchangeCodeForSession(code);
    if (error) return { success: false, message: error.message || "Invalid link" };
    if (data && data.session) setCurrentUser(userFromSession(data.session.user));
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message || "Invalid link" };
  }
}

async function setNewPassword(password) {
  const sb = authClient();
  if (!sb) return { success: false, message: "Supabase is not configured" };
  try {
    const { error } = await sb.auth.updateUser({ password });
    if (error) return { success: false, message: error.message || "Could not update password" };
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message || "Could not update password" };
  }
}

async function sendPasswordReset(email) {
  const sb = authClient();
  if (!sb) return { success: false, message: "Password reset needs Supabase" };
  try {
    const { error } = await sb.auth.resetPasswordForEmail(String(email || "").toLowerCase(), {
      redirectTo: window.location.origin + "/verify.html?type=recovery"
    });
    if (error) return { success: false, message: error.message || "Could not send reset email" };
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message || "Could not send reset email" };
  }
}

function readUsers() {
  try {
    const raw = localStorage.getItem("retrokit_users");
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

async function logout() {
  const sb = authClient();
  if (sb) {
    try { await sb.auth.signOut(); } catch (e) {}
  }
  setCurrentUser(null);
  if (typeof showToast === "function") showToast("Logged out");
  window.location.href = "index.html";
}

function requireAuth() {
  if (!getCurrentUser()) {
    window.location.href = "login.html";
    return false;
  }
  return true;
}

function updateAuthUI() {
  const user = getCurrentUser();
  document.querySelectorAll("[data-auth]").forEach((el) => {
    el.style.display = user ? "" : "none";
  });
  document.querySelectorAll("[data-guest]").forEach((el) => {
    el.style.display = user ? "none" : "";
  });
  document.querySelectorAll("[data-user-name]").forEach((el) => {
    if (user) el.textContent = user.name.split(" ")[0];
  });
}

document.addEventListener("DOMContentLoaded", updateAuthUI);
