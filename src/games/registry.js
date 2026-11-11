import game0 from "./ship-battle/index.js?v=11";
import game1 from "./alien-spelling/index.js?v=11";
import game2 from "./wheel-spin-carnival/index.js?v=11";
import game3 from "./claw-machine-toy-drop/index.js?v=11";
import game4 from "./potion-lab-alchemy/index.js?v=11";
import game5 from "./balloon-pop-math-sprint/index.js?v=11";

export const games = Object.freeze([game0,game1,game2,game3,game4,game5]);
export const findGame = slug => games.find(game => game.slug === slug);
