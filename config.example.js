// Steadfast — browser runtime config (EXAMPLE ONLY)
//
// The prototype has no build step, so browser code reads Supabase settings from
// a global `window.STEADFAST_ENV`. To configure it locally:
//
//   1. Copy this file to `config.local.js` (git-ignored).
//   2. Fill in your project URL and PUBLIC anon key.
//   3. (Later milestone) load it before app.js:
//        <script src="/config.local.js"></script>
//
// Only the browser-safe anon key belongs here. Never put the service_role key
// in this file. This file is NOT loaded by the app yet (foundation only).

window.STEADFAST_ENV = {
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
};
