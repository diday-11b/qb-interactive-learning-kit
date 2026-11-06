# Ocean Word Adventure: audit and implementation plan

## Existing architecture
- Static HTML/CSS/JavaScript; target route: `03._qb_game_details_ship_battle/code.html`.
- Shared lion-logo header and common learning-flow styles already exist.
- Current detail renderer provides short practice rounds; it does not satisfy the ocean-game specification.
- `qb-supabase.js` already exposes startGameSession, submitGameAnswer, finishGameSession, restartGameSession, and getQuestionSet. Reuse authorized session RPCs; do not write arbitrary client scores to tables.
- Existing game engine demonstrates session question payload and answer submission contracts.

## Implementation
1. Build standalone reusable question module with topic/difficulty banks and validated teacher-question adapters.
2. Replace target route with an original ocean game shell: introduction, gameplay, supportive feedback, completion.
3. Add inline SVG ocean/ship/island scene, responsive controls, pause/sound, reduced motion, English/Khmer labels.
4. Connect compatible authenticated activity sessions through existing RPCs. Explicitly label local fallback and never report it as saved.
5. Test correct/incorrect/retry/double-submit/restart/question validation. Verify responsive visuals and keyboard flow in browser when browser access is enabled.

## Verification status
Pending implementation and runtime checks. Local browser automation currently disabled in Work settings. No production data or database settings changed.
