# Rabbit Racing

Standalone game in the original QB Interactive Learning Kits project. Open `/games/rabbit-racing/` or choose Rabbit Racing in either Games to Explore listing.

## Files

- `core.js`: authoritative 30-question state machine, validation, score, independent positions and winner calculation.
- `clock.js`: one cancellable timer with exact remaining time across exit confirmation dialogs.
- `app.js`: character selection, dedicated question/track/results views, one-vehicle animation, fullscreen and expanded view, exit confirmation and navigation.
- `styles.css`: scoped game styles, vector race scene, responsive controls and reduced-motion behavior.
- `thumbnail.svg`: canonical listing artwork. Vehicle art is vector markup owned by app.js.

## Exact flow

Character selection -> Start Game -> stationary track for 2 seconds -> question -> one answer -> locked choices and 2 seconds of feedback -> automatic track -> 900 ms single-vehicle animation -> enabled Next Question. After question 30's animation, See Results replaces Next Question. There is no answering timer and no Watch the Race button.

Correct answers award 100 points and move only the player 100 metres. Incorrect answers award nothing and move only Dash 100 metres. Positions are cumulative; both vehicles use the same distance-to-track mapping. Results favor the player on a distance tie. Play Again resets all race statistics and returns to character selection.

Full screen / Normal screen is a persistent control. Native fullscreen is attempted on the game container; a fixed expanded view is used when the request is unavailable or denied. View changes do not rebuild the race. Reduced-motion preferences skip vehicle animation while retaining the two-second start and feedback moments.

Exit Game and outgoing navigation during an active race open a confirmation dialog. The pending transition and vehicle animation pause. Keep Racing resumes the remaining duration. Leave Race cancels the timer/animation, resets the model and introduction, and navigates to the listing. Browser Back after leaving returns to fresh character selection, including when a page is restored from the back/forward cache.

## Question source

Thirty distinct local arithmetic questions: 10 addition, 10 subtraction, 10 multiplication. Four options per question. This source is clearly disclosed. A selected library summary is preserved in navigation but does not supply these questions. No student-account saving is claimed.

## Verification — 4 November 2026

Run from the original project root:

```powershell
node --test tests/rabbit-racing.test.cjs
```

11 automated tests pass: 30 distinct accurate questions; full perfect, all-incorrect, alternating/tie, last-correct and last-incorrect races; duplicate submissions/actions; equal distance steps and final-turn exclusivity; score/accuracy/completion; full reset; pause duration and queued callback cancellation; native timer binding.

A full 30-question browser playthrough alternated correct/incorrect answers, double-clicking each submission. Every turn moved only the permitted vehicle. Final question 30 moved only Dash: player 1500 m, opponent 1500 m. See Results became available after the last animation. Actual results: player wins the tie, 1500 points, 15 correct, 15 incorrect, 50% accuracy, 30 answered and 30 completed.

Browser controls verified:
- Both vehicles stationary at start; the exit dialog held the start countdown beyond its two-second deadline.
- Keep Racing resumed the remaining start/feedback/action duration.
- Feedback and racing animations stayed paused while the exit dialog was open. During paused travel, vehicle positions remained player x=727.600, opponent x=730.350 across observations.
- Native fullscreen worked; switching views mid-question preserved progress.
- A temporary local server with Permissions-Policy fullscreen=() exercised the actual expanded-view fallback without changing game code.
- Leaving during feedback returned to the game listing with questionSet=Space+Explorers. Browser Back returned to character selection.
- Play Again returned to selection. A new race began with zero points/positions and question 1.
- The Rabbit Racing card was verified in the Games to Explore listing and opened the game with its selected-set context.
- Phone 480px and tablet 768px layouts had equal document client/scroll widths (449 and 737 respectively), including intro, question and track. Desktop/fullscreen layout was also exercised. Physical devices and narrower phone sizes were not independently checked.
- No game errors in the complete 30-question browser run. The game page and five local assets returned HTTP 200; the SVG thumbnail parsed.

The only intentional data limitations are the local math bank and unsaved results. No other games or shared game-state modules were changed. The listing registry and its two HTML entry pages were updated to add this game and refresh their script versions.
