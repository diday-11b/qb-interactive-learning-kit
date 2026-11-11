import {practiceName} from './questions.js?v=11';
import settings from './settings.js?v=11';
// Game identity, introduction and owning-game settings/engine registration.
export default Object.freeze({
  settings,
  practiceLabel:practiceName,
  gameplay:()=>import('./play.js?v=11'),
  "slug": "potion-lab-alchemy",
  "title": "Potion Lab Alchemy",
  "description": "Mix colorful ingredients by matching science terms, animal habitats, and definitions.",
  "category": "matching",
  "language": "en",
  "thumbnail": "/src/games/potion-lab-alchemy/assets/thumbnail.svg?v=7",
  "hero": "/src/games/potion-lab-alchemy/assets/thumbnail.svg?v=7",
  "heroAlt": "Potion Lab Alchemy game illustration",
  "styles": "/src/games/potion-lab-alchemy/styles.css",
  "focuses": [
    "Word meanings",
    "Matching pairs",
    "Science vocabulary"
  ],
  "steps": ["Choose a word from the left column.", "Match it to its meaning on the right.", "Complete all five pairs to fill your potion."],
  "introductionTitle": "Potion Lab Alchemy",
  "introduction": "Mix colorful ingredients by matching science terms, animal habitats, and definitions.",
  "lead": "A playful way to practice, discover, and grow."
});
