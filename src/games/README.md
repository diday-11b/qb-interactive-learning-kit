# Games — maintain here

All game-specific code, styles and assets live in `src/games/<game-slug>/`. The public `games/index.html` is the route shell.

| File | Responsibility |
| --- | --- |
| `index.js` | Game identity, shared thumbnail/hero references, introduction, instructions; registers settings, practice label and lazy engine import |
| `settings.js` | Owning-game configuration and restrictions |
| `questions.js` | Adapt reviewed source content or actual arithmetic to the shared question contract |
| `play.js` | Owning-game interaction and animation; exports `buildQuestions` and `mount(runtime)` |
| `styles.css` | That game's identity and interaction visuals |
| `assets/` | One canonical thumbnail plus game actors/artwork |

## Available mechanics

- Ship Battle: open question → answer → Set sail → ship moves toward the island.
- Alien Spelling: picture/listen/fragment/mixed activities → letter tiles or keyboard → check → launch shuttle. Picture-only requires Easy; higher Mixed levels use written/audio clues for words without source pictures.
- Wheel Spin: arithmetic → unlocked spin → actual sector bonus → next turn.
- Claw Machine: read clue → position claw over matching word → drop → collect toy.
- Potion Lab: choose any unmatched word → choose its meaning → add ingredient. Pair order is unrestricted.
- Balloon Pop: solve arithmetic → pop correct answer balloon → next turn.

All six have five-question rounds, Practice hints, Adventure star collection, Challenge accuracy badges, retry, pause/resume, sound toggle, browser speech, reduced motion, actual results and replay. Challenge selects Hard. Ship's non-math topics retain the same reviewed five questions at every level; the setup explains this limitation. Browser speech depends on available voices; written clues remain available.

## Shared code

- `registry.js`: single six-game registry; `index.js`: route selection; `catalog.js`: search/filter library.
- `shared/dom.js`, `introduction.js`, `navigation.js`, `question-selection.js`: safe rendering and selected-summary context.
- `shared/settings.js`, `settings-state.js`, `practice-settings.js`: common form, validation, storage and the four additional games' shared option definitions.
- `shared/content/topics.js`, `words.js`, `arithmetic.js`, `images/`: selectively migrated original reviewed banks and pictures, plus actual arithmetic. No fabricated library question records.
- `shared/launch.js`: short-lived, single-use session ticket scoped to game and selected summary. Normal starts also work with unavailable sessionStorage. Direct/refresh play URLs require settings review.
- `shared/session.js`: authoritative phase machine, attempts, completion and guarded rewards. Wrong answers cannot award; duplicate events cannot reward or advance twice; pause blocks state changes.
- `shared/play.js`: round lifecycle, HUD, timers, pause, audio, motion, feedback, results and replay. Timers and speech are disposed on exit. Paused animation timers retain remaining time.
- `shared/availability.js`: explicit local-practice approvals and a settings/gameplay check shared by the catalog and launch routes.
- `shared/play.js`: in-memory guest results with completion counts, first-try accuracy, and the actual wheel bonus. Retry opens the current game's settings. Exit returns home.
- `shared/styles.css`, `settings.css`, `play.css`: common layouts. The single font configuration remains in `src/styles/fonts.css`.

## Flow and data boundaries

`/games/?game=<slug>&questionSet=<summary>` → introduction → `&view=settings` → review/confirm local practice bank → `&view=play` → complete round → replay/change settings/library.

The selected summary is preserved in navigation, but its actual questions have not been migrated. Settings, in-game context and results explicitly name the active practice bank. No Supabase, authentication, production data or server-side scores are involved. Correct-answer star feedback is local CSS; the old Lottie runtime was not migrated.

To update a game, edit its owning folder. Replace `assets/thumbnail.svg` to update its single image everywhere; retain `viewBox="0 0 640 400"`, opaque edge-to-edge background and existing full-frame UI. Alien retains the approved 88% thumbnail artwork scale. Its moving `assets/shuttle.svg` is extracted from that same source artwork. To add a game, add its folder and one registry import.

## Checks

Run `node tests/gameplay.test.mjs`, `node tests/ship-playthrough.test.mjs`, `node tests/games.test.mjs` and `node tests/settings.test.mjs` from the project root. The gameplay suite tests 86 valid configurations and nine full controller playthroughs with a DOM harness. Browser evidence and limitations are recorded in `VERIFICATION.md`.
