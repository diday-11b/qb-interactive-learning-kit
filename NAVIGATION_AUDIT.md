# Header and footer navigation audit

4 November 2026. Original project: `D:\QB Interactive Learning Kits\QB Interactive Learning Kits`.

## Outcome

Audited all 44 HTML files, shared header templates, and generated game-footer links. The final automated audit checked 26 unique normalized local targets, including their HTTP responses and local fragment IDs: zero failures. The initial 42 raw URL variants included equivalent relative paths that normalize to the same destinations.

35 existing Rabbit Racing and Alien Spelling regression tests pass. JavaScript syntax checks pass for the shared shell, Rabbit Racing, and the student-entry script.

## Corrections

- Fixed 16 dead header destinations across seven older screens: report navigation, student dashboard/game return links, plans/curriculum links, victory hub return, and teacher-studio breadcrumbs.
- Added footer styling to the shared design system. Rabbit Racing previously included footer markup but lacked the flow stylesheet that provided its layout. The shared footer now has desktop columns, a phone layout, consistent text spacing, and usable link/button targets.
- Kept Rabbit Racing's footer at the bottom of short normal-view screens.
- Shared header game-library links now preserve the selected questionSet and identify the active game section.
- Shared footer game-library links preserve questionSet as well.
- Updated Rabbit Racing's link normalization so its explicit Games to Explore destination remains consistent with already-contextualized shared links. Its exit confirmation and timer pause are retained.
- Scoped the student-entry page's legacy footer-link rewriting to legacy footers only. It previously replaced the shared Game Library and Question Sets links with a removed form anchor and a sign-in link. The public navigation now remains intact; account/session and class-joining logic were not changed.
- Refreshed shared shell asset versions on pages that use them.

## Browser checks

- Phone header: Menu expands/collapses, Game Library is marked current, and Get Started exposes the expected Log In/Sign Up paths. Escape closes the sign-in menu.
- Rabbit Racing's phone footer shows the shared brand, Explore/Teacher links, Teacher tools/Settings buttons and copyright in a two-column layout. No document horizontal overflow at 480px.
- Verified rendered header/footer destinations with questionSet=Space+Explorers on Explore Questions, both catalog routes, Ship Battle, Alien Spelling, student entry and Rabbit Racing.
- Rechecked student entry after the selector correction: all six shared footer links remain intact, including the selected-set game-library link.
- Clicking Rabbit Racing's header Game Library link during the start countdown opens the exit dialog. Keep Racing resumes to the question. Leaving through the header returns to Games to Explore with Space Explorers preserved.
- A compact mobile shell preview was generated from the actual shared header component, Rabbit Racing footer markup and shared styles for visual QA. The temporary preview server was stopped afterward.

## Repeat the automated audit

```powershell
python tests/verify_navigation.py --http
node --test tests/rabbit-racing.test.cjs tests/alien-spelling.test.cjs tests/alien-spelling-timing.test.cjs
```

## Scope

The check covers existing header/footer navigation and shell presentation. Dedicated teacher workspaces, sign-in/callback screens and some design-reference pages keep their purpose-specific layouts; generic headers or footers were not inserted into those workflows. An HTTP 200 confirms a destination exists, not that protected account features can be used without signing in. No account actions or database changes were performed.

## HTML inventory

Counts describe source markup. Some games hide or replace their legacy header at runtime.

| Page | Header tags | Shared headers | Footer tags |
| --- | ---: | ---: | ---: |
| `01._qb_public_homepage/code.html` | 1 | 0 | 1 |
| `02._qb_explore_games_catalog/code.html` | 0 | 1 | 1 |
| `03._qb_game_details_ship_battle/code.html` | 0 | 1 | 1 |
| `04._qb_teacher_dashboard/code.html` | 1 | 0 | 0 |
| `05._qb_question_sets_manager/code.html` | 1 | 0 | 0 |
| `06._qb_create_edit_question_set/code.html` | 1 | 0 | 0 |
| `07._qb_game_library_arena_selection/code.html` | 0 | 1 | 1 |
| `08._qb_play_game_setup_live_host_lobby/code.html` | 1 | 0 | 1 |
| `09._qb_results_progress_analytics/code.html` | 1 | 0 | 0 |
| `10._qb_student_welcome_pin_entry/code.html` | 1 | 1 | 1 |
| `11._qb_student_game_selection_arena/code.html` | 1 | 0 | 1 |
| `12b._qb_student_learning_moment_gentle_clue_retry/code.html` | 1 | 0 | 0 |
| `14._qb_parent_dashboard_weekly_digest/code.html` | 0 | 0 | 0 |
| `15._qb_child_progress_learning_analytics/code.html` | 1 | 0 | 0 |
| `16._qb_unified_sign_in_sign_up/code.html` | 1 | 0 | 0 |
| `17._qb_classroom_student_roster_manager/code.html` | 1 | 0 | 0 |
| `18._qb_user_profile_system_preferences/code.html` | 1 | 0 | 1 |
| `19._qb_student_gameplay_alien_spelling_shuttle/code.html` | 1 | 0 | 0 |
| `20._qb_teacher_classroom_utility_suite/code.html` | 1 | 0 | 0 |
| `21._qb_plans_pricing_district_licensing/code.html` | 1 | 0 | 0 |
| `22._qb_learning_kits_student_avatar_locker_quest_badge_showcase/code.html` | 1 | 0 | 0 |
| `auth/callback.html` | 0 | 0 | 0 |
| `auth/onboarding.html` | 0 | 0 | 0 |
| `explore-questions.html` | 1 | 1 | 1 |
| `game-player.html` | 1 | 0 | 0 |
| `games/rabbit-racing/index.html` | 0 | 1 | 1 |
| `index.html` | 0 | 0 | 0 |
| `literacy.html` | 1 | 0 | 0 |
| `media-library.html` | 1 | 0 | 0 |
| `qb_gameplay_action_cannon_blast_splash_impact/code.html` | 1 | 0 | 0 |
| `qb_gameplay_action_victory_treasure_chest_reward/code.html` | 1 | 0 | 0 |
| `qb_interactive_learning_kits_logo/code.html` | 0 | 0 | 0 |
| `qb_interactive_learning_platform/code.html` | 1 | 0 | 1 |
| `qb_learning_kits_lion_mascot_logo/code.html` | 0 | 0 | 0 |
| `qb_live_classroom_game_host_arena/code.html` | 1 | 0 | 0 |
| `qb_master_interactive_demo_prototype_showcase/code.html` | 1 | 0 | 0 |
| `qb_project_presentation_client_showcase/code.html` | 1 | 0 | 0 |
| `qb_responsive_multi_device_learning_platform_1/code.html` | 1 | 0 | 1 |
| `qb_responsive_multi_device_learning_platform_2/code.html` | 1 | 0 | 1 |
| `qb_student_game_hub_rewards_arena/code.html` | 0 | 0 | 0 |
| `qb_student_gameplay_ship_battle_arena/code.html` | 1 | 0 | 0 |
| `qb_teacher_studio_question_editor/code.html` | 1 | 0 | 0 |
| `qb_teacher_studio_question_engine/code.html` | 1 | 0 | 0 |
| `reading-library.html` | 1 | 0 | 0 |

## Validated local targets

- `/01._qb_public_homepage/code.html`
- `/16._qb_unified_sign_in_sign_up/code.html?next=student`
- `/16._qb_unified_sign_in_sign_up/code.html?mode=signup`
- `/10._qb_student_welcome_pin_entry/code.html`
- `/literacy.html`
- `/14._qb_parent_dashboard_weekly_digest/code.html`
- `/04._qb_teacher_dashboard/code.html`
- `/16._qb_unified_sign_in_sign_up/code.html`
- `/07._qb_game_library_arena_selection/code.html`
- `/explore-questions.html`
- `/06._qb_create_edit_question_set/code.html`
- `/18._qb_user_profile_system_preferences/code.html`
- `/index.html`
- `/17._qb_classroom_student_roster_manager/code.html`
- `/09._qb_results_progress_analytics/code.html`
- `/05._qb_question_sets_manager/code.html`
- `/media-library.html`
- `/02._qb_explore_games_catalog/code.html`
- `/20._qb_teacher_classroom_utility_suite/code.html`
- `/qb_student_game_hub_rewards_arena/code.html`
- `/reading-library.html`
- `/15._qb_child_progress_learning_analytics/code.html`
- `/21._qb_plans_pricing_district_licensing/code.html`
- `/11._qb_student_game_selection_arena/code.html`
- `/qb_project_presentation_client_showcase/code.html`
- `/assets/qb-design-system.css?v=20261104-shell-links`
