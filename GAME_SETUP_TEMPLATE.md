# Main game setup flow

Ship Battle is the reference for every game before play.

All games use `assets/qb-adventure-setup.js` and `assets/qb-adventure-setup.css`, including Ship Battle. Change this shared component instead of adding a separate setup design.

The order is: Choose your adventure; How to Play; Questions for this adventure; Adventure Settings; (1) learning activity; (2) play mode; (3) difficulty and question count; question order and sound; character; live summary; Back to Game Library and Play.

The reference uses Luckiest Guy with Noto Sans Khmer fallback, a 1120px maximum container, 48px desktop title, 28px section headings, 23px accordion headings, 17px controls, and 16px Play/Back controls. Colors, spacing, borders, selected cards, and mobile layouts are shared in the stylesheet.

Each adapter preserves its original event handlers and supported limits. Rabbit Racing always has 30 questions and moves only one vehicle per answer. Fixed options remain fixed. Selected library sets are disclosed when their questions are not connected.

For a new game, call `QBAdventureSetup.mount` with real setting controls, instructions, start actions, and optional character controls. The shared renderer handles structure and presentation; the game owns its rules and question validation.
