import {element,link,applyGameStyles} from './dom.js?v=11';
import {journey,selectedSet} from './navigation.js?v=11';
import {gameHref} from './question-selection.js?v=11';
export function renderIntroduction(root,game,selection) {
 document.title=game.introductionTitle+' — QB Interactive Learning Kits';
 applyGameStyles(game);
 root.replaceChildren(journey(selection,true));root.classList.add('game-introduction');root.dataset.game=game.slug;
 const hero=element('header','game-intro-heading');hero.id='game-introduction';
 hero.append(element('span','qb-badge','QB Interactive Learning Kits · Learn through play'),element('h1','',game.introductionTitle),element('p','game-intro-lead',game.lead));
 const image=element('img','game-hero-art');image.src=game.hero;image.alt=game.heroAlt;image.width=1000;image.height=450;image.decoding='async';
 const panel=element('section','game-welcome');panel.setAttribute('aria-labelledby','welcome-title');
 const title=element('h2','','Meet your next learning adventure');title.id='welcome-title';panel.append(title,element('p','',game.introduction));
 const skills=element('ul','game-skills');game.focuses.forEach(focus=>skills.append(element('li','',focus)));panel.append(skills);
 const how=element('details','game-how');const summary=element('summary','','How to Play');const steps=element('ol');game.steps.forEach(step=>steps.append(element('li','',step)));how.append(summary,steps);panel.append(how);
 const actions=element('div','game-intro-actions');const play=element('button','qb-button qb-button--mint','Play');play.type='button';play.disabled=true;play.setAttribute('aria-disabled','true');play.setAttribute('aria-describedby','game-play-status');
 const status=element('p','game-play-status',game.settings ? 'Choose your game options, level, and mode before play.' : 'Play is coming soon. You can explore the game and instructions now.');status.id='game-play-status';
 actions.append(link('Back to Game Library',gameHref(null,selection),'qb-button qb-button--blue'),game.settings ? link(game.settings.actionLabel,gameHref(game.slug,selection,'settings'),'qb-button qb-button--mint') : play);
 panel.append(status,actions);root.append(hero,image,selectedSet(selection),panel);
}
