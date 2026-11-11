export function element(tag, className = '', text) {
 const node = document.createElement(tag);
 if (className) node.className = className;
 if (text !== undefined) node.textContent = text;
 return node;
}
export function link(text, href, className = 'qb-button') {
 const node = element('a', className, text); node.href = href; return node;
}

export function applyGameStyles(game){
 if([...document.querySelectorAll('link[data-game-style]')].some(node=>node.dataset.gameStyle===game.slug))return;
 const style=element('link');style.rel='stylesheet';style.href=game.styles+'?v=11';style.dataset.gameStyle=game.slug;document.head.append(style);
}
