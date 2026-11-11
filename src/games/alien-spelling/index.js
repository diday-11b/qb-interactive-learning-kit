import {practiceName} from './questions.js?v=11';
import settings from './settings.js?v=11';
// Game identity, introduction and owning-game settings/engine registration.
export default Object.freeze({
  settings,
  practiceLabel:practiceName,
  gameplay:()=>import('./play.js?v=11'),
  "slug": "alien-spelling",
  "title": "Alien Spelling Shuttle",
  "description": "Launch rockets into orbit with fuel canisters coded by vowel sounds and syllables.",
  "category": "spelling",
  "language": "dual",
  "thumbnail": "/src/games/alien-spelling/assets/thumbnail.svg?v=7",
  "hero": "/src/games/alien-spelling/assets/thumbnail.svg?v=7",
  "heroAlt": "Alien Spelling Shuttle game illustration",
  "styles": "/src/games/alien-spelling/styles.css",
  "focuses": [
    "Vowel sounds",
    "Word building",
    "Listen & spell"
  ],
  "steps": ["Read the clue or hear the word.", "Build the spelling with letter tiles or your keyboard.", "Check your spelling, then launch the shuttle."],
  "introductionTitle": "Alien Spelling Shuttle",
  "introduction": "Launch rockets into orbit with fuel canisters coded by vowel sounds and syllables.",
  "lead": "A playful way to practice, discover, and grow."
});
