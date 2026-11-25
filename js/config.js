/* ============================================
   N-KITS – Supabase configuration
   ============================================
   1. Create a project at https://supabase.com
   2. Run supabase/schema.sql in the SQL editor
   3. Paste your Project URL + anon key below
      (Project Settings -> API)
   Until the placeholders are replaced the site
   and admin panel run in LOCAL mode (localStorage).
   ============================================ */

const SUPABASE_URL = "YOUR_SUPABASE_URL";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";

/* Public storage bucket used for jersey uploads (created by schema.sql) */
const SUPABASE_STORAGE_BUCKET = "product-images";

/* LOCAL-ONLY admin gate (used when Supabase keys are NOT configured yet).
   Only a SHA-256 HASH is shipped to the browser — never a plaintext
   password — so nothing readable is exposed in the page source. It only
   protects the localStorage data on this machine; real security is
   Supabase auth (profiles.is_admin) once keys are added.

   Generate a new hash for your own password:
     node -e "console.log(require('crypto').createHash('sha256').update('YOUR PASSWORD').digest('hex'))"
   Set to "" to disable local admin login entirely. */
const LOCAL_ADMIN_PASSWORD_HASH = "057ba03d6c44104863dc7361fe4578965d1887360f90a0895882e58a6248fc86";

/* Fallback WhatsApp number used if no value is saved in admin -> Settings */
const DEFAULT_WHATSAPP_NUMBER = "2348012345678";

function isSupabaseConfigured() {
  return Boolean(
    typeof SUPABASE_URL === "string" &&
    typeof SUPABASE_ANON_KEY === "string" &&
    SUPABASE_URL.startsWith("http") &&
    SUPABASE_URL.indexOf("YOUR_SUPABASE_URL") === -1 &&
    SUPABASE_ANON_KEY.indexOf("YOUR_SUPABASE_ANON_KEY") === -1
  );
}
