// Explicit local-practice approvals documented in VERIFICATION.md.
const approved = new Set([
 'ship-battle', 'alien-spelling',
 'claw-machine-toy-drop', 'potion-lab-alchemy', 'balloon-pop-math-sprint'
]);

export function isAvailable(game) {
 return approved.has(game?.slug) && Boolean(game.settings) && typeof game.gameplay === 'function';
}
