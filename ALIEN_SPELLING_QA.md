# Alien Spelling Shuttle — full verification

4 November 2026. Original project only. Follow-up request: ensure all parts work well.

## Result

All tested game flows passed. Completed all 10 supported activity/difficulty combinations in the browser (50 questions), plus one additional five-question mobile mission with motion off. 24 automated tests passed. No game errors were logged in this fresh verification tab.

## Full browser mission matrix

| Activity | Level | Mode | Actual result |
| --- | --- | --- | --- |
| picture | easy | adventure | 5 energy stars Â· 5 words completed Â· 80% first-attempt accuracy |
| listen | easy | practice | 5 energy stars Â· 5 words completed Â· 80% first-attempt accuracy |
| listen | medium | adventure | 5 energy stars Â· 5 words completed Â· 80% first-attempt accuracy |
| listen | hard | challenge | 5 energy stars Â· 5 words completed Â· 80% first-attempt accuracy |
| complete | easy | practice | 5 energy stars Â· 5 words completed Â· 80% first-attempt accuracy |
| complete | medium | adventure | 5 energy stars Â· 5 words completed Â· 80% first-attempt accuracy |
| complete | hard | challenge | 5 energy stars Â· 5 words completed Â· 80% first-attempt accuracy |
| mixed | easy | adventure | 5 energy stars Â· 5 words completed Â· 80% first-attempt accuracy |
| mixed | medium | practice | 5 energy stars Â· 5 words completed Â· 80% first-attempt accuracy |
| mixed | hard | challenge | 5 energy stars Â· 5 words completed Â· 100% first-attempt accuracy |

The first nine missions included two wrong submissions on the first word, then a correct answer. Those missions reported 80% first-attempt accuracy and exactly five energy stars; repeated mistakes counted as one word needing practice. Every correct answer was double-clicked, and each still produced one reward and one journey action. The final Hard Mixed Challenge was perfect and reported 100%.

## Other checks

- Instructions reveal, settings selection, all four activities, five unique questions and four shuffled answers per word.
- Picture/Medium and Picture/Hard blocked with a clear message; longer rounds disabled. Challenge forces Hard.
- Engine activation, crystals, repaired navigation component, star field and arrival were checked after each answer across the ten missions.
- Practice hints and written listening definitions present.
- Sound enabled the Listen button; muting and pausing disabled it. Speech controls were exercised; physical audio output was not independently assessed.
- Pause at the ready screen blocked Continue. Pause during a question blocked all four answers and audio. Pause during success feedback retained the screen; resume kept correct answers locked.
- During paused travel, shuttle x remained 90.200 across observations and Traveling stayed disabled. Exit from paused travel returned to the introduction with pending transitions cancelled.
- Mobile Mixed/Easy/Practice with motion off completed five additional questions and reported five stars and 100% accuracy.
- Replay reset the rendered HUD to Mission 1 / 5, zero stars and zero progress; Exit returned to the neutral introduction.
- All 13 checked game, celebration and picture assets returned HTTP 200. Animation JSON and all five SVG pictures parsed.
- An isolated temporary local server deliberately returned 404 for CAT's picture. The actual browser showed 'Picture unavailable. Clue: A cat says meow.' and retained four playable answer buttons. The test server was stopped afterward. No game assets were changed for this test.
- Actual Game Library -> Alien -> Game Library navigation retained questionSet=Space+Explorers.
- Mobile introduction, settings, scene, question and results showed no document horizontal overflow at observed 480px CSS viewport width (449px document client/scroll width). Tablet results/replay passed at 768px (737px client/scroll width). Desktop introduction passed at 1244px (1214px client/scroll width). Temporary viewport overrides were reset.

## Issues found and fixed in this audit

1. The Alien library card still described an old fuel-canister mechanic and advertised English + Khmer. Its local metadata now describes choosing one of four spelling answers to power the shuttle and correctly labels the interface English.
2. The library entry used the old ui=20261030-game-screen link, which opened a cached pre-fix game in the browser. The Alien route now uses ui=20261104-alien-mission, and the library script cache version was updated. The complete browser round trip then opened the corrected game with its current disclosures, controls and selected-set context.

Changed files in this audit: assets/qb-game-library.js (Alien entry only), 07._qb_game_library_arena_selection/code.html (library asset cache version), this report, and the implementation report. JavaScript syntax checks pass. Game-controller and reviewed-bank files did not require further changes.

## Reproducible automated checks

```powershell
node --check assets/alien-spelling.js
node --check assets/alien-spelling-timing.js
node --check assets/qb-game-library.js
node --test tests/alien-spelling.test.cjs tests/alien-spelling-timing.test.cjs
```

24 passing tests cover all bank combinations and restrictions, stable answer IDs, guarded phases, pausable timers, cancellation, duplicate transition protection and native browser timer invocation.

## Remaining limitations

Library question records and student-account saving remain unconnected; the game clearly identifies its five-word local practice bank. Picture Spelling is Easy-only, and 10/15/20-question rounds remain unavailable. The interface is English with a shared Khmer font fallback. Physical devices, widths below the browser backend's 480px minimum, and audible speech quality were not independently verified.
