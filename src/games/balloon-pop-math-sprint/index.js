import {practiceName} from '../shared/content/arithmetic.js?v=11';
import settings from './settings.js?v=11';
// Game identity, introduction and owning-game settings/engine registration.
export default Object.freeze({
  settings,
  practiceLabel:practiceName,
  gameplay:()=>import('./play.js?v=11'),
  "slug": "balloon-pop-math-sprint",
  "title": "Balloon Pop Math Sprint",
  "description": "Pop glowing number balloons by solving sums before they float away.",
  "category": "math",
  "language": "en",
  "thumbnail": "/src/games/balloon-pop-math-sprint/assets/thumbnail.svg?v=7",
  "hero": "/src/games/balloon-pop-math-sprint/assets/thumbnail.svg?v=7",
  "heroAlt": "Balloon Pop Math Sprint game illustration",
  "styles": "/src/games/balloon-pop-math-sprint/styles.css",
  "focuses": [
    "Addition",
    "Number bonds",
    "Quick sums"
  ],
  "steps": [
    "Read the number sentence.",
    "Choose the balloon with the answer.",
    "Keep practicing at your own pace."
  ],
  "introductionTitle": "Balloon Pop Math Sprint",
  "introduction": "Pop glowing number balloons by solving sums before they float away.",
  "lead": "A playful way to practice, discover, and grow."
});
