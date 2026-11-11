// Question summaries remain authored once, on the Pick Questions page.
export function selectionFromDocument(doc, name) {
 if (!name) return {status:'none', questionSet:null};
 const card = [...doc.querySelectorAll('.question-card[data-name]')].find(node => node.dataset.name === name);
 if (!card) return {status:'invalid', questionSet:null};
 return {status:'selected', questionSet:{name:card.dataset.name, count:Number(card.dataset.questions), kind:card.dataset.kind, description:card.dataset.description}};
}
export async function loadSelection(search) {
 const name = new URLSearchParams(search).get('questionSet');
 if (!name) return {status:'none', questionSet:null};
 const response = await fetch('/questions/index.html');
 if (!response.ok) throw new Error('Question library unavailable');
 return selectionFromDocument(new DOMParser().parseFromString(await response.text(), 'text/html'), name);
}
export function gameHref(slug, selection, view) {
 const params = new URLSearchParams();
 if (slug) params.set('game', slug);
 if (selection?.questionSet) params.set('questionSet', selection.questionSet.name);
 if (['settings','play'].includes(view) && slug) params.set('view',view);
 return '/games/' + (params.size ? '?' + params.toString() : '');
}
