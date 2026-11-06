# QB Interactive Learning Kits

Static HTML, CSS, and JavaScript learning games and classroom pages. This is the original site. It does not need React, Next.js, or a frontend dependency install.

## Local development

Use Node.js 24 and Python 3.12+ for the navigation audit.

```sh
npm ci --ignore-scripts
npm run check
python tests/verify_navigation.py
npm run build
npm run preview
```

The built-site preview runs at `http://127.0.0.1:8002`. The existing source preview can still be served with `python -m http.server 8000 --bind 127.0.0.1`.

## Hosting

See [DEPLOYMENT.md](DEPLOYMENT.md) for Git and Vercel setup. `vercel.json` uses `npm run build` and serves only `dist/`. Existing `.html` URLs, game folders, and authentication callbacks remain intact.

Only browser-safe Supabase values are generated into the hosted site. The local `assets/supabase-config.js`, environment files, logs, generated output, and Supabase runtime metadata are ignored by Git. SQL migrations remain source-controlled but are not copied to the hosted output.

## Project map

- Numbered page folders: public, teacher, student, parent, and authentication screens.
- `games/rabbit-racing/`: the 30-question racing game.
- `assets/`: shared design, game engines, typography, and artwork.
- `auth/`: OAuth callback and profile onboarding pages.
- `supabase/`: backend migrations and setup documentation; managed separately from hosting.
- `tests/`: game, auth, build configuration, and navigation checks.
- `GAME_SETUP_TEMPLATE.md`: Ship Battle-based shared pre-game design contract.

Local game question banks are not connected to the selected library question set. Local practice scores are not saved to an account; account-backed activities require the configured Supabase project.
