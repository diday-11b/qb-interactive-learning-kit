import {practiceName} from './questions.js?v=11';
import settings from './settings.js?v=11';
// Game identity, introduction and owning-game settings/engine registration.
export default Object.freeze({
  settings,
  practiceLabel:practiceName,
  gameplay:()=>import('./play.js?v=11'),
  "slug": "claw-machine-toy-drop",
  "title": "Claw Machine Toy Drop",
  "description": "Guide the arcade claw to collect plush toys by matching sight words.",
  "category": "vocabulary",
  "language": "en",
  "thumbnail": "/src/games/claw-machine-toy-drop/assets/thumbnail.svg?v=7",
  "hero": "/src/games/claw-machine-toy-drop/assets/thumbnail.svg?v=7",
  "heroAlt": "Claw Machine Toy Drop game illustration",
  "styles": "/src/games/claw-machine-toy-drop/styles.css",
  "focuses": [
    "Sight words",
    "Picture matching",
    "Read & retry"
  ],
  "steps": ["Read the word clue.", "Move the claw above the matching word.", "Drop the claw and collect a toy for a correct match."],
  "introductionTitle": "Claw Machine Toy Drop",
  "introduction": "Guide the arcade claw to collect plush toys by matching sight words.",
  "lead": "A playful way to practice, discover, and grow."
});
