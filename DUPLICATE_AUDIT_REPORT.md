# Duplicate Audit Report

**Project:** `D:\QB Interactive Learning Kits\QB Interactive Learning Kits`  
**Audit date:** 2026-10-30  
**Scope:** Read-only audit of local project files. No application files, production data, or Supabase settings were changed. This report is the only new file in the project.

## Executive summary

The project contains **173 files across 50 directories**, including **10 ignored local Supabase runtime files** under `supabase/.temp/`. Excluding that generated runtime state, the scan covered 163 files, including 41 HTML pages.

- **Exact duplicate content:** one group of five identical PNG files. No other byte-identical files were found.
- **Near-identical implementations:** the two `qb_responsive_multi_device_learning_platform` pages are functionally the same HTML after whitespace and self-closing-tag normalization. They also contain identical 20,833-character inline application scripts.
- **Overlapping routes:** the `02` and `07` game-library pages both load the same dynamic catalog implementation. The `02` route is linked from the homepage, so it is an active alias and cannot safely be removed without route consolidation.
- **Broken local file references:** none found in scanned HTML, CSS, or JavaScript references.
- **Unresolved same-page fragments:** 32 source-level `href="#…"` references have no matching `id` in their own HTML file. Some may be obsolete prototype navigation or JavaScript hooks; inspect before treating them as user-visible failures.
- No `.bak`, `.old`, `.copy`, numbered-copy, or backup-named files were found. No repository `.git` directory is present, so tracked/ignored status beyond the checked `.gitignore` cannot be confirmed.

There are no Critical findings. Cleanup should be considered only after reviewing the recommendations and confirming which prototype routes and screenshots are still needed.

## Findings

| No. | File/Folder | Issue Type | Duplicate Of | Evidence | Recommendation |
|---:|---|---|---|---|---|
| 1 | `qb_responsive_multi_device_learning_platform_2/code.html` | **High — near-duplicate implementation** | `qb_responsive_multi_device_learning_platform_1/code.html` | Both are 78 KB HTML pages with the same title. After normalizing whitespace and void-element slash style, the complete HTML is identical. Their inline application scripts are byte-identical (20,833 characters), and the inline style blocks match. Neither route is referenced by other scanned source files. | Retain one canonical version after confirming whether these are intentionally separate design iterations. If one is retired, archive it outside the served app or remove it only after approval. The second file contains no distinct behavior based on this comparison. |
| 2 | `02._qb_explore_games_catalog/code.html` | **Medium — duplicate route shell / shared feature** | `07._qb_game_library_arena_selection/code.html` | Both load `assets/qb-game-library.js`, Supabase config/client, and accessibility code; the shared script rebuilds the main catalog. The homepage links to `02` in three places, while teacher/question flows link to `07`. Their HTML shells differ, so they are not identical files. | Choose one canonical game-library route (the project’s current `07` route is the established question-to-game flow). Keep `02` as a redirect/alias or update inbound links before retiring it; preserve `questionSet` query parameters. Do not delete `02` while homepage links still target it. |
| 3 | `01._qb_public_homepage/screen.png`, `04._qb_teacher_dashboard/screen.png`, `10._qb_student_welcome_pin_entry/screen.png`, `11._qb_student_game_selection_arena/screen.png`, `12b._qb_student_learning_moment_gentle_clue_retry/screen.png` | **Medium — exact duplicate image assets** | All five files have the same SHA-256: `6c9a02e2605929162392587c714f045251761b8a72c4bced6d4cbc2e4303ef8b`. | Each file is byte-for-byte identical. No source HTML/CSS/JS reference to these screenshots was found. They appear in otherwise distinct prototype folders. | Confirm whether these are intentional shared placeholders or incorrect screenshots. If the design workspace needs per-page screenshots, replace each with its correct capture. If only one copy is needed, keep a canonical image in a clearly named mockup-assets location and retain copies only where an external design workflow requires them. Removing local copies should not affect the scanned app, but may affect external/manual prototype workflows. |
| 4 | Inline `tailwind.config` blocks in `08._qb_play_game_setup_live_host_lobby/code.html` and `09._qb_results_progress_analytics/code.html` | **Medium — duplicated configuration code** | Each other | Exact same inline script block, 4,535 characters. A second repeated 4,535-character config block is also shared by `qb_interactive_learning_platform/code.html`, `qb_responsive_multi_device_learning_platform_1/code.html`, and `qb_responsive_multi_device_learning_platform_2/code.html`. The two config groups are not byte-identical to each other. | If these pages remain maintained application pages, move common design tokens to a shared config while preserving any page-specific values. If these are frozen design exports, leave them as self-contained snapshots. Consolidation changes should be reviewed per group rather than globally. |
| 5 | `my_design_system/DESIGN.md` and `qb_kids/DESIGN.md` | **Low — overlapping design-system documents / naming ambiguity** | Similar purpose, not duplicate content | Same basename and same directory shape, but different contents and palettes (6,702 and 12,230 bytes; different hashes). No source-code references to either path were found. | Identify the current source of truth. Keep both only if they represent distinct themes or design generations; otherwise merge the unique guidance into the chosen canonical guide and label/archive the other after approval. Do not remove either based on filename alone. |
| 6 | `image.png/` | **Low — inconsistent folder name** | N/A | This is a directory, not an image file; it contains `screen.png`. No source reference to the directory was found. | Rename only if the design workflow does not depend on the path. Prefer a directory name such as `mockup-assets` or the prototype’s descriptive name. This is a naming cleanup, not a verified duplicate. |
| 7 | Root `.qb-http.err.log` and `.qb-http.out.log` | **Low — unreferenced runtime artifacts** | N/A | The files are local server output (33,894 and 0 bytes). No source reference was found. The error log’s last-write time is 2026-10-27. | Once no process needs them, consider removing them and adding the log names/pattern to `.gitignore`. They are not duplicate source files; preserve them if they are still useful for debugging. |
| 8 | Unmatched fragment links in prototype/application HTML | **Medium — possible invalid in-page navigation** | N/A | A static scan of 41 HTML files found 32 fragment hrefs without a matching `id` in that file. Exact list is below. | Validate intended behavior in the relevant page before cleanup. Replace dead fragment links with real targets or buttons/actions; keep fragments that are deliberately handled by JavaScript. The scan does not establish whether a runtime handler exists. |
| 9 | Google Fonts references across 38 HTML pages | **Low — duplicate external font declarations** | `assets/qb-font.css` | 38 pages include `assets/qb-font.css`, whose `@import` requests Luckiest Guy and Noto Sans Khmer; the same 38 HTML pages also include a Google Fonts URL requesting Luckiest Guy and/or Noto Sans Khmer. Browser caching may deduplicate font file transfers, but the stylesheet declarations overlap. | Keep one canonical shared font stylesheet. Remove only redundant direct links after confirming each page does not request a distinct family or weight. Keep Material Symbols as a separate font reference. |
| 10 | Duplicate Material Symbols stylesheet links in 17 HTML pages | **Low — repeated icon-font reference** | Same page | Each listed page contains the exact same Material Symbols Outlined Google Fonts stylesheet link twice: `03._qb_game_details_ship_battle`, `08._qb_play_game_setup_live_host_lobby`, `09._qb_results_progress_analytics`, `10._qb_student_welcome_pin_entry`, `11._qb_student_game_selection_arena`, `12b._qb_student_learning_moment_gentle_clue_retry`, `15._qb_child_progress_learning_analytics`, `21._qb_plans_pricing_district_licensing`, `22._qb_learning_kits_student_avatar_locker_quest_badge_showcase`, `qb_gameplay_action_cannon_blast_splash_impact`, `qb_gameplay_action_victory_treasure_chest_reward`, `qb_interactive_learning_platform`, `qb_live_classroom_game_host_arena`, `qb_master_interactive_demo_prototype_showcase`, `qb_project_presentation_client_showcase`, `qb_student_gameplay_ship_battle_arena`, `qb_teacher_studio_question_engine`. | Retain one identical stylesheet link per page. This should not change icon behavior. |
| 11 | `Nunito Sans` / `Quicksand` font declarations in Tailwind configs and catalog CSS | **Medium — declared fonts are not supplied** | No local font files or Google Fonts import found | The project has no `.woff`, `.woff2`, `.ttf`, `.otf`, or `.eot` files. The `07` page Tailwind config names Nunito Sans and Quicksand, and `assets/qb-game-library.js` requests Nunito Sans for catalog text, but no stylesheet imports either family. Those declarations therefore fall back to `system-ui` / generic sans. The shared `qb-font.css` loads Luckiest Guy and Noto Sans Khmer only. | Either add the intended families to the shared external font import (and keep fallback stacks), or change declarations to fonts that are already loaded. Prefer the font stack that matches the intended visual design. No font changes were made. |

### Unmatched fragment references

These are same-page fragments, not missing file paths:

- `03._qb_game_details_ship_battle/code.html`: `#dashboard`, `#games`, `#play`, `#subjects`, `#quests`, `#badges`
- `07._qb_game_library_arena_selection/code.html`: `#dashboard`, `#question-sets`, `#game-library`, `#classes`, `#reports`, `#tools`
- `10._qb_student_welcome_pin_entry/code.html`: `#teacher-login`, `#rules`, `#help`
- `12b._qb_student_learning_moment_gentle_clue_retry/code.html`: `#dashboard`
- `16._qb_unified_sign_in_sign_up/code.html`: `#forgot`
- `21._qb_plans_pricing_district_licensing/code.html`: `#games`, `#curriculum`
- `22._qb_learning_kits_student_avatar_locker_quest_badge_showcase/code.html`: `#dashboard`, `#games`, `#quests` (twice), `#play`, `#subjects`, `#badges`
- `qb_gameplay_action_victory_treasure_chest_reward/code.html`: `#hub` (twice)
- `qb_live_classroom_game_host_arena/code.html`: `#play`, `#subjects`, `#quests`, `#badges`

## Exact duplicate files

Only the following exact duplicate group was found:

- Canonical candidate: `01._qb_public_homepage/screen.png`
- Identical copies:
  - `04._qb_teacher_dashboard/screen.png`
  - `10._qb_student_welcome_pin_entry/screen.png`
  - `11._qb_student_game_selection_arena/screen.png`
  - `12b._qb_student_learning_moment_gentle_clue_retry/screen.png`

The “canonical candidate” label is for report readability only; all five files are identical, so the audit cannot establish which folder was intended to own the original.

No exact duplicate HTML, CSS, JavaScript, configuration, SQL migration, SQL test, font, SVG, or other file content was found. No local font binaries are present; pages use CSS/Google Fonts references. The image scan found no other byte-identical image files.

## Potentially redundant files and folders

### Near-clone responsive platform pages

- `qb_responsive_multi_device_learning_platform_1/`
- `qb_responsive_multi_device_learning_platform_2/`

These have different folder names, but their HTML is identical after harmless formatting normalization and their application JavaScript is identical. Neither is referenced elsewhere in the scanned source. This is the strongest candidate for safe consolidation, subject to confirming design-history intent.

### Duplicate game-library entry points

- `02._qb_explore_games_catalog/`
- `07._qb_game_library_arena_selection/`

These are two entry points to the same shared catalog code. Both currently have inbound references. Treat `02` as an alias until the homepage links are redirected or preserved through a redirect.

### Repeated two-file prototype layout

The following 34 folders share the same structural shape—one `code.html` and one `screen.png`. This repeated structure is a consistent prototype-export convention; it is **not**, by itself, evidence that the folders or their HTML are duplicates:

`01._qb_public_homepage`, `02._qb_explore_games_catalog`, `03._qb_game_details_ship_battle`, `04._qb_teacher_dashboard`, `05._qb_question_sets_manager`, `06._qb_create_edit_question_set`, `07._qb_game_library_arena_selection`, `08._qb_play_game_setup_live_host_lobby`, `09._qb_results_progress_analytics`, `10._qb_student_welcome_pin_entry`, `11._qb_student_game_selection_arena`, `12b._qb_student_learning_moment_gentle_clue_retry`, `14._qb_parent_dashboard_weekly_digest`, `15._qb_child_progress_learning_analytics`, `16._qb_unified_sign_in_sign_up`, `17._qb_classroom_student_roster_manager`, `18._qb_user_profile_system_preferences`, `19._qb_student_gameplay_alien_spelling_shuttle`, `20._qb_teacher_classroom_utility_suite`, `21._qb_plans_pricing_district_licensing`, `22._qb_learning_kits_student_avatar_locker_quest_badge_showcase`, `qb_gameplay_action_cannon_blast_splash_impact`, `qb_gameplay_action_victory_treasure_chest_reward`, `qb_interactive_learning_kits_logo`, `qb_interactive_learning_platform`, `qb_learning_kits_lion_mascot_logo`, `qb_live_classroom_game_host_arena`, `qb_master_interactive_demo_prototype_showcase`, `qb_project_presentation_client_showcase`, `qb_responsive_multi_device_learning_platform_1`, `qb_student_gameplay_ship_battle_arena`, `qb_student_game_hub_rewards_arena`, `qb_teacher_studio_question_editor`, and `qb_teacher_studio_question_engine`.

The related `qb_responsive_multi_device_learning_platform_2` folder contains only `code.html`, and is the near-clone described above.

### Supabase files and generated runtime state

- `supabase/migrations/` contains 26 sequentially named migrations. No migration files are byte-identical; their sequence and differing schema changes indicate cumulative history, not duplicate copies.
- `supabase/tests/` contains 14 distinct SQL test files. No exact duplicate test files were found.
- `assets/supabase-config.js` and `assets/supabase-config.example.js` are different by design: the first is the locally configured file and is explicitly ignored by `.gitignore`; the second is a template. They are not duplicates. Do not replace/remove the local config as cleanup.
- `supabase/.temp/` contains 10 generated CLI/runtime files and is ignored by `.gitignore`. It is local runtime state, not a source duplicate. Leave it intact during this audit; deleting it can require local Supabase to regenerate state.

## Broken or invalid paths

### Local file references

**No broken local file references found** in the scanned HTML `href/src/poster` attributes, CSS `url()`/local imports, or relative JavaScript imports. The scanner resolved relative paths and root-relative paths against the project, including folder `index.html` and `.html` fallbacks. External CDN and Google Fonts URLs were not fetched or checked for network availability.

### Same-page anchors

The 32 unmatched fragments listed above are the only invalid paths detected by the local static scan. They do not point to missing files. They may be dead anchors or JavaScript-controlled actions; verify in the browser before changing them.

## Shared references and dependency impact

These are intentionally shared assets, not duplicates:

- `assets/qb-font.css` is referenced by 40 HTML pages.
- `assets/supabase-config.js` and `assets/qb-supabase.js` are each referenced by 19 pages.
- `assets/qb-accessibility.js` is referenced by 17 pages.
- `assets/qb-design-system.css` is referenced by 5 pages.
- The game-library script is shared by the `02` and `07` entry points.

Removing or moving any of these shared assets without updating all dependents would break multiple pages. The scan also found no missing relative JS imports.

## Recommended cleanup plan (approval required before execution)

1. **Confirm the two responsive-platform folders represent one design.** If so, choose one source folder and archive/remove the other only after external prototype links are checked.
2. **Consolidate the game-library route.** Make `07` canonical, preserve `02` as a redirect/alias, and update homepage links while preserving any query-string behavior.
3. **Review the five duplicated screenshots.** Replace incorrect placeholders with page-specific screenshots or centralize one shared placeholder after checking the design workflow.
4. **Validate all unmatched fragment links.** Prioritize the sign-in `#forgot` link and the missing navigation targets in pages `03`, `07`, `10`, `21`, `22`, and the two `qb_*` game prototypes.
5. **Choose one documented design-token source of truth.** Keep both design guides only if the palettes/themes are intentionally distinct.
6. **Remove or ignore local logs only when they are no longer needed.** Keep `supabase/.temp/` excluded from source control as it is today.
7. **After approval, perform cleanup as a separate change and verify all inbound references and page routes.**

No cleanup was performed as part of this audit.



## Font verification (follow-up)

- **Bundled fonts:** none found in the project.
- **Shared font source:** `assets/qb-font.css` imports `Luckiest Guy` and `Noto Sans Khmer` from Google Fonts. It applies Luckiest Guy broadly and Noto Sans Khmer to content marked `lang="km"`.
- **Coverage:** 40 of 41 HTML files reference `assets/qb-font.css`; the remaining HTML file is the root `index.html` redirect.
- **Overlap:** 38 HTML pages both reference the shared stylesheet and contain a direct Google Fonts link for Luckiest Guy and/or Noto Sans Khmer. Seventeen pages include the exact Material Symbols Outlined stylesheet twice in the same document. These are redundant references, although browser caching can avoid downloading the same font binary more than once.
- **Unloaded declared families:** Nunito Sans and Quicksand appear in Tailwind font configuration; Nunito Sans is also used by the game-library catalog stylesheet. Neither family is imported or bundled. Where used, those declarations fall back to system fonts.
- **Runtime check (clean headless Chrome on the local `02` page):** the computed body stack is `"Luckiest Guy", "Noto Sans Khmer", system-ui, sans-serif`; catalog content requests `"Nunito Sans", system-ui, sans-serif`. After `document.fonts.ready`, the browser exposed no registered font faces and no Google `gstatic` font-file resource, so the fonts were not confirmed loaded in this environment and rendering used system fallback fonts. The stylesheet declarations alone do not prove a font loaded; network/browser behavior may differ on other devices.

No font files or page styles were changed during this follow-up.

