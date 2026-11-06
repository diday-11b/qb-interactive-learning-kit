# Alien Spelling Shuttle — implementation and verification

Updated 4 November 2026. Work was confined to the original project at `D:\QB Interactive Learning Kits\QB Interactive Learning Kits`. The new project at `D:\qb-interactive-learning-kits` was not edited.

## What already worked

The existing implementation supplied the friendly SVG pilot and galaxy, five visual mission actions, four-choice questions, shuffled stable answer IDs, reviewed word banks, definitions and hints, five picture illustrations, retry tracking by distinct word, results, replay, the shared QB header/footer/font, and the existing correct-answer celebration. These were retained.

## Corrections

- Added `assets/alien-spelling-timing.js`: a single pending transition with exact unpaused duration, cancellation, and stale-callback protection. Native browser timers are invoked through wrappers; browser testing caught and corrected an initial native-receiver issue, covered by a regression test.
- Replaced the shuttle's CSS left transition with a pausable Web Animation. Pause also stops ambient CSS animations and speech; resume preserves remaining feedback/travel duration.
- Phase-aware controls keep correct answers locked after pause/resume and keep Continue disabled during travel. Correct answers immediately award and display exactly one energy star.
- Exit cancels pending timers, shuttle movement, speech and celebrations. Introduction artwork uses a fresh preview position after exiting a mission.
- Challenge selects and locks Hard. Picture/Medium and Picture/Hard show a clear message and prevent launch. Longer missions remain disabled.
- Added a visible journey progress bar and five milestone cards alongside the existing exhaust, crystals, repair/shield, starfield and arrival effects.
- Preserved questionSet in game actions and in header/footer game-library links without modifying shared component source.
- Removed the misleading fixed Space Explorers eyebrow. Every screen identifies the active local spelling bank and explains that library records and account saving are not connected.
- Picture alt text uses the reviewed definition; failed images display a readable definition clue.
- Added scoped layout constraints and hid the legacy arena-only mobile bottom bar while Alien Spelling is active.

## Changed files

- `assets/alien-spelling.js`
- `assets/alien-spelling.css`
- `assets/alien-spelling-timing.js` (new)
- `tests/alien-spelling-timing.test.cjs` (new)
- `11._qb_student_game_selection_arena/code.html` (game asset loading/cache versions)
- This report.

The reviewed banks, distractors, definitions, hints and picture SVGs were unchanged. The shared OceanState and other games were unchanged.

## Automated verification

Run from the original project folder:

```powershell
node --check assets/alien-spelling.js
node --test tests/alien-spelling.test.cjs tests/alien-spelling-timing.test.cjs
```

24 tests pass. They cover all 10 supported activity/difficulty combinations, rejection of Picture/Medium and Picture/Hard, five distinct words per mission, unique choices, stable answers after reordering, different difficulty banks, guarded state transitions, exact feedback/travel durations across repeated pauses, cancellation of already queued callbacks, exactly one next transition, zero-duration reduced-motion actions, and the browser timer receiver regression.

All five picture SVGs parse and return HTTP 200 from port 8000.

## Browser verification

Tested the requested route with `game=alien-spelling&questionSet=Space+Explorers`.

- Complete Picture/Easy/Adventure mission: two mistakes on CAT followed by a successful retry. Results: 5 energy stars, 5 words, 80% first-attempt accuracy; CAT appeared once in the retry list.
- Complete Listen/Medium/Practice mission: definitions and practice hints visible, replay-audio control enabled when sound was on and disabled when off; 5 stars and 100% accuracy.
- Complete Missing Letters/Hard/Challenge mission: retry on ELEPHANT; 5 stars, 80% accuracy and Determined Explorer.
- Complete Mixed/Hard/Challenge mission with motion off: 5 stars, 100% accuracy and Stellar Speller. Hard mixed questions used listening/missing parts rather than unavailable pictures.
- All five actions verified: engine activation, crystal restoration, restored navigation component, star field crossing and Blossom Planet arrival. Continue stayed disabled while Traveling; one action followed each correct answer.
- Double-clicking a correct answer produced one energy star.
- Paused feedback stayed on the question beyond its normal duration; choices remained locked after resume.
- Paused shuttle x position stayed at 739.225 across separate observations; Continue remained disabled. Resume completed the remaining travel.
- Replay reset energy and journey to zero.
- Exit during feedback and exit during travel returned to a neutral introduction and stayed there after the old deadline.
- Picture/Medium and Picture/Hard launch restrictions checked in the rendered settings; Challenge locked Hard.
- Header, footer and game-library return links retained the selected-set context.
- No document horizontal overflow at observed CSS widths 480, 768 and 2560. Mobile controls, stacked answers, settings and introduction were inspected. The obsolete mobile bar was confirmed hidden. Browser viewport overrides were reset afterward.
- No new game errors after correcting the timer receiver issue; old pre-correction errors remain in the browser's historical log.

## Remaining limitations

The selected library question set does not supply this game's words. Each mission uses five local reviewed words; Picture Spelling is Easy-only. No student-account saving, cloud progress or mastery claim is implemented. Browser speech depends on installed voices; controls were exercised, but audible output was not independently assessed. Image-load failure was verified in a follow-up browser audit using an isolated local server that returned 404 for one picture; the game displayed its written fallback and retained the answer choices. Physical mobile devices and widths below the browser backend's 480px minimum were not verified. The interface remains English with the shared Khmer font fallback.


## Follow-up full verification

The subsequent all-parts audit completed all 10 supported activity/difficulty combinations in the browser (50 questions), plus a mobile reduced-motion mission (5 questions). All 24 automated tests pass. The audit also corrected the Alien library description/language label and an old versioned link that could open a cached build. See [ALIEN_SPELLING_QA.md](ALIEN_SPELLING_QA.md) for the full matrix, evidence and limitations.
