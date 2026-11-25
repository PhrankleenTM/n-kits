const ADMIN_USER_KEY = "retrokit_admin_user";
let memoryUser = null;

function userFromSession(user) {
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    name: meta.name || meta.full_name || (user.email || "").split("@")[0],
    email: user.email || "",
    isAdmin: Boolean(user.app_metadata && user.app_metadata.is_admin === true)
  };
}

function authClient() {
  return typeof Store !== "undefined" ? Store.supabase() : null;
}

const authReadyPromise = (async () => {
  const sb = authClient();
  if (!sb) return;
  try {
    const { data } = await sb.auth.getSession();
    if (data && data.session) memoryUser = userFromSession(data.session.user);
    sb.auth.onAuthStateChange((_event, session) => {
      setCurrentUser(session ? userFromSession(session.user) : null);
    });
  } catch (e) {}
})();

function authReady() {
  return authReadyPromise;
}

function getCurrentUser() {
  if (memoryUser) return memoryUser;
  try {
    const raw = localStorage.getItem(ADMIN_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function setCurrentUser(user) {
  memoryUser = user;
  try {
    if (user) localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
    else localStorage.removeItem(ADMIN_USER_KEY);
  } catch (e) {}
}

async function login(email, password) {
  const sb = authClient();
  if (!sb) return { success: false, message: "Admin login needs Supabase — add your keys in js/config.js" };
  try {
    const { data, error } = await sb.auth.signInWithPassword({
      email: String(email || "").toLowerCase(),
      password
    });
    if (error) return { success: false, message: error.message || "Invalid email or password", code: error.code };
    setCurrentUser(userFromSession(data.user));
    return { success: true };
  } catch (e) {
    return { success: false, message: e.message || "Login failed", code: e.code };
  }
}
