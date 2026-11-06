# Replace game thumbnails

1. Put your PNG, JPG, WebP, or SVG image in this folder.
2. Open `../qb-game-thumbnails.js` and change the path for the matching game.
3. Refresh Choose a Game. If the old image remains, press Ctrl+F5.

Example:

    "ship-battle": "/assets/game-thumbnails/ship-battle.webp"

Recommended image ratio: 16:10 (for example 960 x 600). Keep important content centered. Paths start at the website root and use forward slashes. Use a new filename when replacing an image to avoid cached copies.

This only changes the thumbnail; the game title, destination, and behavior stay the same. An empty path uses the existing default artwork. Additional published games can be added to the configuration using their game slug.
