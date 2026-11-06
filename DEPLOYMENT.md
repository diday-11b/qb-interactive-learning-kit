# Git and Vercel deployment

## 1. Git repository

This folder is the repository root. It contains the original, working static site.

Set an actual commit identity locally before the first commit (a GitHub noreply email is fine):

```sh
git config user.name "YOUR NAME"
git config user.email "YOUR VERIFIED OR NOREPLY EMAIL"
git status --short
git commit -m "Prepare QB learning site for Vercel"
```

Create an empty GitHub repository, copy its exact URL, then:

```sh
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

No repository visibility is assumed. Choose private/public deliberately when creating it. Do not add the ignored `assets/supabase-config.js`, `.env` files, or Supabase `.temp` files.

## 2. Import into Vercel

Import the pushed GitHub repository into the intended Vercel team/project. Use:

| Setting | Value |
| --- | --- |
| Framework Preset | Other |
| Root Directory | repository root |
| Node.js Version | 24.x |
| Install Command | npm ci --ignore-scripts |
| Build Command | npm run build |
| Output Directory | dist |
| Production Branch | main |

These build/output settings are also recorded in `vercel.json`. Git pushes can use Vercel's normal Git deployment integration; the GitHub workflow validates source and the static build.

Before deploying, set both variables for the intended Preview and Production environments:

- `SUPABASE_URL`: the existing project's HTTPS URL.
- `SUPABASE_PUBLISHABLE_KEY`: its `sb_publishable_...` browser key.

Set the same values for Development if using Vercel CLI locally. This build does not automatically read `.env` files. It reads process environment variables; local builds can reuse the existing ignored `assets/supabase-config.js`. A clean local/CI checkout can build local practice with account features disabled. Vercel builds fail clearly if the public configuration is missing, rather than publishing a broken login.

The browser receives these two public values. A service-role key, Supabase secret key, Google OAuth client secret, database password, or Vercel token must never be bundled in `dist/`.

## 3. Configure authentication for the actual domain

After the real Vercel/custom hostname is known, add that exact HTTPS origin as the Supabase Auth Site URL and allow these application callbacks on that origin:

- `/auth/callback.html`
- `/16._qb_unified_sign_in_sign_up/code.html`
- `/16._qb_unified_sign_in_sign_up/code.html?mode=reset-password`

Keep working local callbacks if local development is needed. Google sign-in also needs the Google provider enabled in Supabase, and its OAuth client credentials configured there. Google Cloud uses the Supabase provider callback `https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback`, not the application's callback. Follow `GOOGLE_AUTH_SETUP.md` using the actual domain.

No database migrations or remote auth/provider changes are run by the Vercel build.

## 4. Before promoting the site

Check the preview URL's homepage, catalog, all game setup screens, Rabbit Racing's question/race/results/replay loop, login/signup branding, and the two `/auth/` pages. Use an authorized test account to verify email/Google login, confirmation links, password recovery, role-based access, and logout against the real backend. Check fullscreen and a mobile viewport.

The configured output directory contains public files only. SQL, tests, logs, Markdown reports, Git metadata, and environment files must not be served. Do not add an SPA catch-all rewrite: these pages and callbacks are real static files. Keep `cleanUrls: false` so registered `.html` callback paths retain their exact form.

## References

- https://vercel.com/docs/builds/configure-a-build
- https://vercel.com/docs/project-configuration/vercel-json
- https://vercel.com/docs/git
- https://supabase.com/docs/guides/getting-started/api-keys
- https://supabase.com/docs/guides/auth/redirect-urls
