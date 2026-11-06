# Google Authentication Integration — Delivery Report

## Verdict: NOT READY for production OAuth
Application code and local routes are implemented. Live Google sign-in cannot pass yet: the existing project's read-only Auth settings report `google=false`, `email=true`. Google credentials/provider configuration were not changed. Production origin and deployed callback are not available in repository metadata.

## Existing architecture and changes
The static HTML/CSS/JavaScript application already used a single `QBSupabase` wrapper, password sign-in/sign-up, a Google SDK wrapper, and database-trigger profile provisioning. It previously sent Google redirects back to the form and routed using a client session without a separate verified-user check.

The new common `QBAuthFlow` resolves both Google and password-auth destinations using a server-verified user (`getUser`) and the matching RLS-protected profile. It uses finite role/next destination maps, not arbitrary URL redirects. Google sign-in and sign-up share the same OAuth start operation and callback. SDK implicit flow, URL detection, persistence and token refresh remain enabled. Callback waits on SDK initialization; there is no manual second authorization-code exchange. Do not switch to PKCE without revisiting SDK/callback initialization and its tests.

Expected flow: Google button → Supabase → Google → hosted Supabase callback → same-origin `/auth/callback.html` → verified user → database profile → display-name completion if needed → role-appropriate destination. The `next` hint is a finite allowlisted value held in tab-local sessionStorage for 15 minutes; the OAuth app redirect URL itself stays exact. A blocked storage API safely falls back to the role default.

## Created files
- `assets/qb-auth-flow.js`: shared Google start, duplicate-start protection, bounded waits, role destination map, verified profile resolution and safe error messages.
- `assets/qb-auth-callback.js`: callback orchestration, token/query cleanup, single navigation and retry state.
- `assets/qb-auth-onboarding.js`: authenticated existing-profile display-name update and sign-out; no browser profile insertion or role selection.
- `assets/qb-auth-callback.css`: responsive accessible callback/onboarding UI.
- `auth/callback.html`: dedicated OAuth completion route.
- `auth/onboarding.html`: minimal profile completion route.
- `tests/google-auth.test.cjs`: 17 mocked regression/security/lifecycle tests.
- `GOOGLE_AUTH_SETUP.md`: exact safe local/hosted settings and manual dashboard checklist.
- `GOOGLE_AUTH_REPORT.md`: this report.

## Modified files
- `assets/qb-supabase.js`: duplicate-client guard, explicit existing implicit mode, Google same-origin callback restriction/minimum identity scopes, verified-user/profile-update/auth-subscription helpers.
- `assets/qb-auth-ui.js`: centralized post-login routing, shared Google handler, loading/retry states, email/Google concurrency guard, logout/password-recovery events and recovery after blocked navigation.
- `16._qb_unified_sign_in_sign_up/code.html`: shared flow script, pinned verified Supabase browser SDK 2.118.0, mascot, responsive close button and OAuth disabled-state styling; existing email fields, password toggle and reset controls retained.
- The existing HTML consumers listed below only received a shared-client cache-version update; new auth pages are listed separately above.

- `game-player.html`
- `literacy.html`
- `media-library.html`
- `reading-library.html`
- `02._qb_explore_games_catalog/code.html`
- `04._qb_teacher_dashboard/code.html`
- `05._qb_question_sets_manager/code.html`
- `06._qb_create_edit_question_set/code.html`
- `07._qb_game_library_arena_selection/code.html`
- `08._qb_play_game_setup_live_host_lobby/code.html`
- `09._qb_results_progress_analytics/code.html`
- `10._qb_student_welcome_pin_entry/code.html`
- `14._qb_parent_dashboard_weekly_digest/code.html`
- `15._qb_child_progress_learning_analytics/code.html`
- `17._qb_classroom_student_roster_manager/code.html`
- `18._qb_user_profile_system_preferences/code.html`
- `20._qb_teacher_classroom_utility_suite/code.html`
- `qb_student_game_hub_rewards_arena/code.html`

No files were deleted. No production deployment, data mutation, provider modification, secret creation or schema migration was performed.

## Google Cloud and Supabase setup
See `GOOGLE_AUTH_SETUP.md` for the full checklist.

- Google application type: Web application; client name: QB Interactive Learning Kits Web.
- Local JavaScript origin: `http://127.0.0.1:8000` (no path).
- Google authorized redirect URI: `https://xsrymntpmenpruitvqqs.supabase.co/auth/v1/callback`.
- Supabase app redirect allowlist: `http://127.0.0.1:8000/auth/callback.html`, plus existing email-confirmation/password-recovery routes.
- Optional localhost equivalents only when used; production origin must be the actual deployment domain.
- Client ID and Secret are entered in Supabase Google settings, never the browser. No Gmail/Drive/Calendar scopes are requested.

## Database/security audit
Source-reviewed foundation migration `supabase/migrations/20261025000100_qb_learning_foundation.sql` provisions one profile keyed by auth user ID in an auth.users insert trigger. The role is literal `student`, ignoring browser metadata. Profiles have RLS enabled; read policies constrain own/associated users; updates require own auth.uid, unchanged role, and column-level update grants on safe fields only. Onboarding updates only display_name on the verified user's existing profile. No email-based identity merging, client role promotion or client profile upsert was added. Returning profiles are not overwritten automatically.

No migration is necessary for this implementation. Missing profiles fail closed with support instructions instead of bypassing the server trigger. The SQL source review is not proof that every migration/policy is applied remotely.

Live read-only probes: Google provider disabled; email enabled. Anonymous profile select denied with HTTP 401. Full authenticated multi-role RLS/Storage tests were NOT RUN; those require controlled test accounts and database access. Existing application RPC authorization/route guards remain responsible for private data access; static HTML availability alone is not authorization.

Credential-pattern scan: no detected sb_secret, Google OAuth client secret, or decoded service_role JWT in scanned browser JS/HTML/JSON. The existing Supabase publishable key is intentionally public; it is not a privileged credential. Pattern scanning is not a complete secret-audit guarantee.

## Duplicate audit
Exactly one actual Supabase `createClient` implementation remains (`qb-supabase.js`) and one SDK `auth.signInWithOAuth` call. Login/signup use one handler and the same callback. Existing session-aware account/classroom/live/progress handlers were retained; they have different protected data responsibilities and were not blindly deleted. The new verified routing replaces the duplicate role routing previously in auth UI.

## Test evidence
PASS: `node --test tests/google-auth.test.cjs` — 17 mocked tests. Covers same-origin callback, finite redirect map, no metadata-based privilege, verified identity lookup, existing/default/missing profiles, duplicate Google starts, retry after failure, email API contracts, one client, callback cancellation, expired session, URL cleanup and one callback navigation. These tests do NOT authenticate a real account or prove database/deployed/mobile behavior.

PASS: syntax checks for five auth JavaScript files; local callback/onboarding/helper routes return HTTP 200. PASS: current pinned SDK artifact 2.118.0 returned HTTP 200. PASS: live anonymous profile read denied. BLOCKED: live Google flow, because provider is disabled.

| ID | Scenario | Status | Evidence or blocker |
| --- | --- | --- | --- |
| AUTH-01 | Existing email login | NOT RUN | Mocked API contract passes; no real test-account login executed. |
| AUTH-02 | Existing email registration | NOT RUN | Mocked safe signup payload passes; no account created. |
| AUTH-03 | Click Google Login | BLOCKED | Mocked start passes; live provider disabled. |
| AUTH-04 | Select Google account | BLOCKED | Provider/credentials and interactive account access required. |
| AUTH-05 | First-time Google user | BLOCKED | Mocked onboarding routing passes; live provider disabled. |
| AUTH-06 | Returning Google user | BLOCKED | Mocked existing-profile routing passes; live provider disabled. |
| AUTH-07 | Refresh restores session | NOT RUN | SDK settings retained; browser refresh not exercised. |
| AUTH-08 | Logout terminates session | NOT RUN | Existing signOut reused; no live session test. |
| AUTH-09 | Cancel Google login | BLOCKED | Mocked callback cancellation passes; live cancellation not exercised. |
| AUTH-10 | Incorrect OAuth redirect | BLOCKED | External redirect unit test passes; live allowlist mismatch not exercised. |
| AUTH-11 | Unauthorized role | NOT RUN | Mocked role routing denies unknown role; authenticated RLS test not run. |
| AUTH-12 | Duplicate registration | NOT RUN | Existing auth-user trigger/primary key reviewed; no concurrent real signup. |
| AUTH-13 | Direct protected-page access | NOT RUN | Anonymous profiles endpoint denied; full protected page/role flow not exercised. |
| AUTH-14 | Mobile login | BLOCKED | Responsive CSS implemented; local browser use disabled in Work settings. |
| AUTH-15 | Production callback | BLOCKED | Actual production domain/deployment unavailable. Local callback route returns 200. |
| AUTH-16 | Expired session | NOT RUN | Mocked expired callback retry passes; real token expiry not exercised. |

## Remaining manual actions
1. Configure Google Auth Platform branding, audience, test users and the web OAuth client using the setup guide.
2. Securely enter that Client ID/Secret and enable Google in the existing Supabase project.
3. Confirm exact local redirect allowlist; provide the actual production domain and configure Site URL/production redirects.
4. Verify the existing profile trigger/RLS migrations are applied in the intended project using authorized dashboard/database access.
5. Provision only the public Supabase config file during deployment if it is Git-ignored; do not add secrets to static assets.
6. Enable browser access and use test accounts to execute live OAuth, existing password login/recovery, cross-tab logout, role/RLS and responsive acceptance checks. No deployment was performed here.
