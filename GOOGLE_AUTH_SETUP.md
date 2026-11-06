# Google authentication setup — QB Interactive Learning Kits

## Verified values
- Local application origin observed: `http://127.0.0.1:8000`.
- Optional localhost origin, only if used: `http://localhost:8000`.
- Supabase project URL: `https://xsrymntpmenpruitvqqs.supabase.co`.
- Google authorized redirect URI (Supabase): `https://xsrymntpmenpruitvqqs.supabase.co/auth/v1/callback`.
- Application callback: `http://127.0.0.1:8000/auth/callback.html`.
- Optional localhost callback: `http://localhost:8000/auth/callback.html`.
- Production origin: NOT FOUND in repository metadata. Supply your actual HTTPS Vercel/custom domain; do not copy a fictional example into settings.
- Read-only live Supabase settings check: Google disabled, email enabled. No configuration was changed.

## 1. Google Cloud Console
1. Select/create project **QB Interactive Learning Kits** at https://console.cloud.google.com/.
2. In Google Auth Platform → Branding, set the app display name and your actual support/developer email. Use your existing authorized branding/domain where required.
3. Audience: External for ordinary Google accounts. While in Testing, explicitly add each permitted test account.
4. Data Access: request identity only (`openid`, `email`, `profile`). Do not request Gmail, Drive, Calendar or unrelated permissions.
5. Create OAuth client: Web application, name **QB Interactive Learning Kits Web**.
6. Authorized JavaScript origins: `http://127.0.0.1:8000`, and `http://localhost:8000` only if used. Add the actual production HTTPS origin once confirmed. Origins contain no path.
7. Authorized redirect URI: `https://xsrymntpmenpruitvqqs.supabase.co/auth/v1/callback`. Confirm the exact callback shown in Supabase Google provider settings. The app callback is NOT the Google authorized redirect URI.
8. Copy Client ID and Client Secret securely into Supabase provider settings. Never paste the secret into browser code, Git, logs or chat.

## 2. Supabase dashboard
1. Open the existing project → Authentication → Sign In / Providers → Google.
2. Enable Google and enter the OAuth Client ID and Client Secret. Save only after verifying the correct existing project.
3. Authentication → URL Configuration: set Site URL to the actual canonical production HTTPS origin. During local-only development use the local origin deliberately; replace it before production launch.
4. Add exact redirect URLs:
   - `http://127.0.0.1:8000/auth/callback.html`
   - `http://127.0.0.1:8000/16._qb_unified_sign_in_sign_up/code.html` (email confirmations)
   - `http://127.0.0.1:8000/16._qb_unified_sign_in_sign_up/code.html?mode=reset-password` (existing recovery route)
   - Matching localhost URLs only if actually used.
   - Exact corresponding production HTTPS routes after your domain is confirmed.
   - OAuth uses the exact `/auth/callback.html` URL without application query parameters. A short-lived, allowlisted destination hint is stored locally in the initiating browser tab. Do not add broad production `/**` wildcards.
5. Existing email-confirmation/recovery redirects must remain allowed. Do not remove working redirects while adding OAuth.
6. Do not disable RLS, enable unrestricted signup roles, or expose a service-role/secret key.

## 3. Vercel/static hosting
- Deploy existing static project so `/auth/callback.html` and `/auth/onboarding.html` remain real files, not a homepage rewrite.
- No Vercel project link, production domain, `vercel.json`, or deployment metadata was found here. No deployment was performed.
- Verify both routes return 200 on the actual deployment, with HTTPS and no redirect to localhost.
- The ignored local `assets/supabase-config.js` may not ship from Git. Provision it securely at build/deploy time using ONLY the Supabase project URL and publishable key. The browser necessarily receives these public values; RLS provides authorization.
- Private Google client secret belongs only in Supabase provider settings. Service-role credentials must never be bundled into static files.
- No new framework/backend is required. No new database migration is proposed.

## 4. Live acceptance checks after configuration
Use a real test Google account: login, first signup → display-name onboarding, returning signup → existing profile, refresh, logout, cancellation, blocked test account, expired callback and provider error. Exercise mobile and keyboard UI. Confirm student cannot reach teacher/admin data, and existing provisioned teacher/parent/admin accounts retain their authorized role.

Do not share authorization codes, callback token fragments, passwords, OAuth client secrets or session tokens in screenshots/logs.

## References
- https://supabase.com/docs/guides/auth/social-sign-in/auth-google
- https://supabase.com/docs/guides/auth/redirect-urls
- https://supabase.com/docs/guides/auth/sessions/implicit-flow
- https://supabase.com/docs/guides/auth/sessions/pkce-flow
