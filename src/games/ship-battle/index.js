import {practiceName} from './questions.js?v=11';
import settings from './settings.js?v=11';
// Game identity, introduction and owning-game settings/engine registration.
export default Object.freeze({
  settings,
  practiceLabel:practiceName,
  gameplay:()=>import("./play.js?v=11"),
  "slug": "ship-battle",
  "title": "Ship Battle",
  "description": "Read, listen, and guide your ship through a word challenge.",
  "category": "phonics",
  "language": "dual",
  "thumbnail": "/src/games/ship-battle/assets/thumbnail.svg?v=7",
  "hero": "/src/games/ship-battle/assets/hero.svg",
  "heroAlt": "A rabbit captain sails past a tropical island, dolphin, fish, turtle and coral reef.",
  "styles": "/src/games/ship-battle/styles.css",
  "focuses": [
    "Build confidence",
    "Learn at your pace",
    "Celebrate discoveries"
  ],
  "steps": [
    "Tap to open a question.",
    "Choose an answer and try again whenever you need.",
    "Return to the ocean to sail forward and collect a star."
  ],
  "introductionTitle": "Ocean Word Adventure",
  "introduction": "Guide a friendly ship toward a tropical island. Explore sounds, words, numbers, and nature—one thoughtful answer at a time.",
  "lead": "Small discoveries. A big ocean of possibilities."
});
