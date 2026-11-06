# QB Interactive Learning Kits — Supabase setup

This repository is a static HTML prototype. Supabase provides Auth and PostgreSQL data; it does not convert the site into a server-rendered app. Browser requests use a project URL and a **publishable** key, while PostgreSQL row-level security (RLS) enforces access. Never put a secret/service-role key in browser code.

## Set up a project

1. Create a Supabase project in the Supabase dashboard. Keep the database password and secret keys private.
2. Install the Supabase CLI using its [official instructions](https://supabase.com/docs/guides/cli), then run `supabase login`.
3. From this repository folder, run `supabase link --project-ref YOUR_PROJECT_REF`.
4. Start the local Supabase stack with `supabase start`, then run `supabase test db` against the local database before applying migrations remotely.
5. Review the SQL migrations, then apply them to the linked project with `supabase db push`.
6. In **Project Settings → API Keys**, copy the Project URL and publishable key. Create `assets/supabase-config.js` by copying `assets/supabase-config.example.js`; replace only the URL and publishable key. This local file is ignored by Git.
7. Ensure the browser can reach `https://unpkg.com/@supabase/supabase-js@2` (the pages load the SDK from the official documented browser distribution). Auth redirect URLs need to match the local and deployed origins in Supabase Auth settings.
8. Serve this directory over HTTP (for example, `python -m http.server 8000`). The auth page supports email/password sign-in, student self-registration, password reset, and Google OAuth when enabled in Supabase Auth. Add the local callback URL shown in the auth page setup to Supabase Auth's redirect allow list.

## Data and roles

- New Auth accounts are assigned `student` by a database trigger, regardless of role metadata submitted by a browser. The sign-up form sends only a display name; role selection is not exposed. Teacher, parent, and admin roles require trusted provisioning.
- The public library currently includes two starter activities: Ship Battle (English compound words) and Alien Spelling (English spelling). Each has a distinct 10-question multiple-choice round and launches the shared server-scored player. Original local SVG illustrations avoid gameplay screenshots with prototype scores. Age, difficulty, and duration stay unset when the project has no verified values; RLS hides unpublished and unassigned-only games from accounts without a matching class assignment. Browsing is public, while starting a scored round requires a student account.
- `profiles.role` cannot be updated by a normal authenticated user; browser update grants cover only display name, language, and avatar.
- Teacher/parent/admin roles and parent-child links must be granted by a trusted provisioning workflow. Self-service role selection is intentionally not included.
- Students join a teacher-owned class with the 16-character hexadecimal invitation code from the student entry page. The code is stored only for the current browser tab while a student signs in, then redeemed by the role-checked `join_class_with_code` RPC. The former six-digit PIN screen was a visual prototype and is not an authentication mechanism.
- The class game setup screen reads the signed-in teacher's own classes and the published playable catalog, reviews and publishes a whole-class assignment, then creates a live room. Students redeem the 16-character room code as assigned class members. The teacher can see joined names, start and close the room; students poll while waiting and open the existing server-scored game when started. Room updates use short polling rather than Supabase Realtime push.
- `game_sessions` are visible only to the student, a teacher responsible for an assigned class, or a linked parent. Students may create a session start row only for themselves. The client cannot write scores, completion, stars, or achievement awards.
- Session completion, verified scores, award generation, parent linking/invitations, child/teacher invitations, and school-level admin provisioning require trusted workflows that are not present in this static prototype. Until those exist, the dashboard must show empty/unavailable progress rather than sample results. The sign-in page now supports requesting a password reset and saving a new password through Supabase Auth; configure the local and deployed callback URLs in Supabase Auth URL settings and configure email delivery before relying on reset emails.
- Row policies restrict a student's assignment rows to classes they belong to, and teachers' reads to classes they own.

## Local project files

- `migrations/20261025000100_qb_learning_foundation.sql` — profile, class, assignment, activity, session, achievement schema, auth profile trigger, grants, and RLS.
- `migrations/20261025000200_published_game_library.sql` — searchable game metadata, published records, and assignment-aware catalog visibility.
- `migrations/20261025000300_reusable_game_engine.sql` — private question answer keys, saved round snapshots and answers, resume/restart flows, and server-computed results for four game types.
- `migrations/20261025000400_teacher_question_sets.sql` — teacher-owned question-set drafts, private media bucket, validation/publish RPCs, and compatible game-activity creation.
- `migrations/20261025000500_learning_media_library.sql` — reusable teacher media metadata, upload validation, owner-only library reads, and learner access limited to media referenced by an activity they can view.
- `tests/child_privacy.test.sql` — database-level checks for student row isolation, self-role changes, and client score writes.
- `tests/game_library_visibility.test.sql` — public/published and assignment-only catalog visibility checks.
- `tests/game_engine.test.sql` — rolled-back fixtures for question validation, the 10-question picture rule, hidden answer keys, duplicate submissions, and server scoring for each player type.
- `tests/question_sets.test.sql` — draft persistence, publishing, teacher isolation, playable-activity creation, and duplicate prevention.
- `tests/media_management.test.sql` — media table/RPC grants, missing storage-reference rejection, and student upload denial.
- `../assets/qb-supabase.js` — small browser client wrapper with sign-in, sign-out, session, and RLS-backed dashboard and catalog read methods.
- `../assets/teacher-dashboard.js` — renders the teacher dashboard only from the `get_teacher_dashboard` database RPC. The RPC scopes every classroom and learner record to the authenticated teacher.
- `migrations/20261025000600_teacher_dashboard.sql` — teacher-only dashboard summary (30-day activity window; configurable up to 90 days). Completion is distinct learner/assignment pairs completed in the window divided by current active assignment learner slots. “Needs practice” lists each learner's latest recorded completed score below 60 in that period.
- `migrations/20261026000700_teacher_dashboard_recipient_scope.sql` — hardens assignment progress and activity summaries to count only current class members who were actual assignment recipients and completed the assigned activity.
- `migrations/20261025000700_teacher_classroom_management.sql` — teacher-owned class create/edit, roster/history reads, removal, rotated invitation codes, and student-only code redemption. Class codes are 16-character random hex values; direct client reads cannot expose them.
- `migrations/20261025000800_student_assignments.sql` — class-wide or student-specific assignments, assignment visibility enforcement, and student-specific game-start authorization.
- `migrations/20261025000900_assignment_workflow.sql` — optional learner instructions, duplicate-safe batch publishing to a class or selected learners, and teacher-scoped assignment progress from saved game sessions.
- `migrations/20261026001200_live_classroom_rooms.sql` — assignment-bound host rooms, assigned-student code redemption, teacher-only participant names and start/close controls, and privacy-scoped room status.
- `migrations/20261026000900_assignment_status_activity_match.sql` — only sessions for the exact assigned activity can change an assignment’s progress status or score.
- `migrations/20261025001000_learning_progress_reports.sql` — role-checked student/parent/teacher report access, saved-session and answer metrics, evidence-threshold skill summaries, and visibility-filtered activity suggestions.
- `migrations/20261026000100_khmer_english_literacy.sql` — separate Khmer and English literacy activities, published question content, private server-only answer keys, student-owned attempts, and score validation through an RPC. Starter content includes English letter recognition, beginning sounds, sight words, word building, spelling, and short reading, plus Khmer consonant recognition, picture vocabulary, and short reading. Recorded audio is optional; attach a real pronunciation recording before presenting an activity as listening practice.
- `migrations/20261026000200_reading_books_worksheets.sql` — private/public book and worksheet records, stored page text, optional page images and narration, resumable reading positions, owner-only drafts, PDF media registration, and content-scoped signed file access.
- `migrations/20261026000300_rewards_achievements.sql` — admin-configurable reward rules, private reward ledger, idempotent stars and points for verified game/literacy completion, and one-time badge/sticker milestones at 1, 5, 10, and 25 completed activities.
- `migrations/20261026000400_account_accessibility_preferences.sql` — authenticated, self-scoped account settings for language, sound, reduced motion, and higher contrast. Profile role and sign-in credentials remain outside the editable settings surface.
- `tests/account_accessibility_preferences.test.sql` — default language, profile and preference persistence across reads, and role/preference ownership checks.
- `../assets/qb-account-settings.js` and `../assets/qb-account-settings.css` — bilingual English/Khmer account settings with responsive, keyboard-accessible controls and an explicit save state.
- `../assets/qb-accessibility.js` — applies saved motion, contrast, and game sound preferences to signed-in routes. The game library and literacy/reading screens continue to use actual published data and account language preferences.
- Progress pages at `../15._qb_child_progress_learning_analytics/code.html`, `../14._qb_parent_dashboard_weekly_digest/code.html`, and `../09._qb_results_progress_analytics/code.html` use the shared live report. Attempts include all sessions started in the selected range; completed activities count completed rounds; answer accuracy includes saved answers even on unfinished rounds; score and time include completed rounds only. Skill labels require five answers, with strengths at 80%+ and practice below 60%. Activity suggestions are separate from completions.
- `../assets/classroom-management.js` and `../assets/qb-child-dashboard.js` — teacher review-before-publish UI, class or multi-learner assignment, due dates and instructions, saved assignment state, result links, and assignment-aware child player links.
- `tests/classroom_management.test.sql` — database checks for private codes, owner-only class access, code joins without duplicate memberships, student-only assignment visibility, and roster removal.
- `migrations/20261026000800_classroom_student_history_scope.sql` — scopes roster stats and history to current class members and matching assignment recipients; serializes per-teacher class-name duplicate checks during create and rename.
- `tests/assignment_workflow.test.sql` — database checks for class/learner publishing, instructions, safe retries, saved progress, and teacher ownership.
- `tests/live_classroom_rooms.test.sql` — room code issuance, duplicate-safe joins, recipient access, peer identity privacy, teacher start/close authorization, and the existing game engine launch.
- `tests/progress_reports.test.sql` — known persisted attempts verify completion, answer accuracy, scores, tracked time, and parent/teacher access boundaries.
- `tests/literacy_activities.test.sql` — catalog language visibility, hidden answer keys, server validation, duplicate answer rejection, and persistence of unfinished attempts.
- `tests/reading_library.test.sql` — content and progress RLS, direct-write restrictions, and authorization for reading position updates.
- `tests/rewards_achievements.test.sql` — completion rewards, rewards after an incorrect answer, persisted milestone progress, client-write denial, and duplicate completion protection.
- `../assets/qb-progress-report.js` and `../assets/qb-progress-report.css` — shared, responsive progress UI with date ranges, category evidence, history, parent/teacher student selection, and learner suggestions.
- The parent route at `../14._qb_parent_dashboard_weekly_digest/code.html` uses the same authorized report pipeline, defaults to a seven-day check-in, supports multiple linked children, and reads only earned rewards allowed by parent-child row policies. The SQL report tests cover linked, unlinked, and no-child parent states.
- `../assets/qb-game-library.js` — database-backed search, filters, cards, loading/empty/error states, and player-route links.
- `../literacy.html` and `../assets/qb-literacy.js` — student literacy activity browser, English/Khmer switch, interactive practice, recorded-audio playback when attached, and saved completion history. The literacy page keeps Luckiest Guy for Latin characters and uses Noto Sans Khmer for Khmer glyphs.
- `../reading-library.html` and `../assets/qb-reading-library.js` — responsive book/worksheet library, page reader with server-saved resume position, optional narration, preview/print support, and download links shown only after an authorized stored PDF can be signed.
- `../assets/qb-question-set-editor.js` and `../assets/qb-question-set-manager.js` — teacher-authorized editor and private question-set list.
- `../media-library.html` and `../assets/qb-media-library.js` — reusable image/audio library with upload progress/retry, previews, browser recording, and Khmer/English metadata.
- The media library also accepts PDF worksheet files and book/worksheet images. Book page text is stored in `digital_books` and `book_pages`; a book or worksheet becomes visible only after its metadata is published and references files owned by that same teacher.
- `../game-player.html` and `../assets/qb-game-engine.js` — one responsive student player for picture guessing, multiple choice, matching pairs, and flashcards.
- `../assets/supabase-config.example.js` — safe local configuration template.

No live Supabase project is currently linked to this checkout. Applying the migration, creating test users, and checking actual cross-account results require the project to be configured first.

## Adding real game content

The game player does not ship with demo questions or scores. Teachers can use `06._qb_create_edit_question_set/code.html`. Save retains incomplete drafts; publish validates prompt text, choices, correct answers, and picture-game rules. Published sets can create multiple-choice or picture-guessing activities. The generated activity is assignment-only and must be assigned to a class before a student can access it. Reusing a set for the same compatible game returns the existing activity rather than creating a duplicate. Picture guessing requires at least 10 questions, each with an image and exactly three choices. Uploaded media stays in the private `question-set-media` bucket under teacher/set paths. Learners receive short-lived signed media URLs only when they can view the assigned activity.

This editor supports reusable multiple-choice and picture-guessing sets. Matching-pairs and flashcard authoring uses different data shapes and is outside this first editor. Published question sets remain teacher-owned; use the class assignment workflow to give learners access to generated game activities.

The Media Library is at `/media-library.html` and reuses the private `question-set-media` Supabase Storage bucket. It stores asset purpose, language, MIME type, file size, title, and image description in `media_assets`. Files are limited to 10 MB and an explicit image/audio allowlist. Teacher-recorded clips use the browser microphone only after the teacher activates recording; Khmer pronunciation should be supplied as recorded audio. A media item can be picked from the question editor and its path is validated against private storage before saving or publishing. Students can obtain signed URLs only for media referenced by a game activity visible to their account.

Question content shapes:

- Picture guessing: `{"prompt":"…","image_url":"/assets/…","image_alt":"…","choices":[{"id":"…","text":"…"},{"id":"…","text":"…"},{"id":"…","text":"…"}]}` with private answer key `{"choice_id":"…"}`.
- Multiple choice: `{"prompt":"…","choices":[{"id":"…","text":"…"},{"id":"…","text":"…"}]}` with private answer key `{"choice_id":"…"}`.
- Matching pairs: `{"prompt":"…","left_items":[{"id":"…","text":"…"},{"id":"…","text":"…"}],"right_items":[{"id":"…","text":"…"},{"id":"…","text":"…"}]}` with private answer key `{"matches":{"left-id":"right-id"}}`.
- Flashcards: `{"front":"…","back":"…"}`. The learner self-rates each revealed card as `know` or `practice`; the server computes the score from those saved choices.

The player links to `/game-player.html?activity_id=<published-activity-uuid>`. Assignment-only activities use the student's matching class assignment. The server stores question snapshots, hides answer keys from browser queries, accepts one answer per question in order, safely handles duplicate answer calls, allows unfinished sessions to resume, and calculates completion only after all round answers are saved. These two starter activities are seeded by `20261027000100_make_two_public_games_playable.sql`; new teacher-authored activities still use the question-set workflow.
