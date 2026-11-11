import {practiceName} from '../shared/content/arithmetic.js?v=11';
import settings from './settings.js?v=11';
// Game identity, introduction and owning-game settings/engine registration.
export default Object.freeze({
  settings,
  practiceLabel:practiceName,
  gameplay:()=>import('./play.js?v=11'),
  "slug": "wheel-spin-carnival",
  "title": "Wheel Spin Carnival",
  "description": "Solve quick-fire arithmetic puzzles to spin the carnival prize wheel and win treasure chests.",
  "category": "math",
  "language": "en",
  "thumbnail": "/src/games/wheel-spin-carnival/assets/thumbnail.svg?v=7",
  "hero": "/src/games/wheel-spin-carnival/assets/thumbnail.svg?v=7",
  "heroAlt": "Wheel Spin Carnival game illustration",
  "styles": "/src/games/wheel-spin-carnival/styles.css",
  "focuses": [
    "Quick number facts",
    "Multiplication",
    "Prize rounds"
  ],
  "steps": ["Solve a short number challenge.", "Spin the unlocked prize wheel.", "Collect the bonus points shown by the wheel."],
  "introductionTitle": "Wheel Spin Carnival",
  "introduction": "Solve quick-fire arithmetic puzzles to spin the carnival prize wheel and win treasure chests.",
  "lead": "A playful way to practice, discover, and grow."
});
