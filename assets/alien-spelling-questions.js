(function(root){
'use strict';
const banks={
 easy:[['cat',['kat','cot','cut'],'A cat says meow.','Listen for the short a sound.'],['dog',['bog','dig','dag'],'A dog says woof.','Listen for the short o sound.'],['sun',['san','son','sum'],'The sun shines in the sky.','Listen for the short u sound.'],['fish',['fich','fesh','fis'],'A fish swims in water.','The word ends with the sh sound.'],['boat',['bote','boet','boot'],'A boat sails on water.','Two vowels make the long o sound.']],
 medium:[['apple',['appel','aple','applo'],'An apple is a fruit.','Listen for two syllables and a double letter.'],['rabbit',['rabit','rabbot','rabbet'],'A rabbit has long ears.','The middle consonant is doubled.'],['rocket',['roket','rockit','rokcet'],'A rocket travels into space.','Listen for the ending et.'],['flower',['flouer','flowar','flwer'],'A flower grows on a plant.','The word has two syllables.'],['planet',['planit','plannet','plenet'],'Earth is a planet.','Listen to plan, then et.']],
 hard:[['elephant',['elefant','elephent','ellephant'],'An elephant has a long trunk.','The f sound is written with ph.'],['butterfly',['buterfly','butterfli','butterflye'],'A butterfly has colorful wings.','Think of butter and fly joined together.'],['telescope',['teleskope','telescop','tellascope'],'A telescope helps us see distant stars.','The ending is scope.'],['astronaut',['astronot','astronaught','astronout'],'An astronaut explores space.','The ending naut has au.'],['mountain',['mountan','moutain','mountin'],'A mountain is a very tall landform.','Look for ou and the ending tain.']]
};
const letters={cat:['c_t',['a','o','u','e'],'a'],dog:['d_g',['o','a','i','e'],'o'],sun:['s_n',['u','a','o','e'],'u'],fish:['fi__',['sh','ch','th','ph'],'sh'],boat:['b__t',['oa','oo','ee','ai'],'oa'],apple:['a__le',['pp','p','bb','tt'],'pp'],rabbit:['ra__it',['bb','b','pp','dd'],'bb'],rocket:['ro__et',['ck','k','cc','ch'],'ck'],flower:['fl__er',['ow','ou','oa','oo'],'ow'],planet:['plan_t',['e','i','a','u'],'e'],elephant:['ele__ant',['ph','f','ff','th'],'ph'],butterfly:['bu__erfly',['tt','t','dd','th'],'tt'],telescope:['tele__ope',['sc','sk','ss','ck'],'sc'],astronaut:['astro__t',['nau','no','now','nou'],'nau'],mountain:['moun__',['tain','tan','tin','tane'],'tain']};
function validate(q){return q&&q.choices.length===4&&new Set(q.choices.map(c=>c.id)).size===4&&new Set(q.choices.map(c=>c.text)).size===4&&q.choices.filter(c=>c.id===q.correctId).length===1;}
function build(level,activity){
 if(!banks[level])throw Error('Choose a difficulty.');
 if(activity==='picture'&&level!=='easy')throw Error('Picture missions currently support Easy. Choose Easy or another activity.');
 if(!['picture','listen','complete','mixed'].includes(activity))throw Error('Choose a spelling activity.');
 return banks[level].map(([word,wrong,definition,hint],i)=>{
 const type=activity==='mixed'?['listen','complete',level==='easy'?'picture':'listen'][i%3]:activity;
 const data=letters[word],values=type==='complete'?data[1]:[word,...wrong],answer=type==='complete'?data[2]:word;
 const q={id:level+'-'+type+'-'+word,word,level,type,definition,hint,prompt:type==='complete'?'Complete the word: '+data[0]:type==='picture'?'Which word matches the picture?':'Listen to the word. Choose its spelling.',spoken:word,choices:values.map((text,j)=>({id:word+'-'+j,text})),correctId:word+'-'+values.indexOf(answer),image:type==='picture'?'/assets/game-art/alien-word-'+word+'.svg':null};
 if(!validate(q))throw Error('A question needs content review.');return q;
 });
}
root.AlienSpellingQuestions={build,validate};if(typeof module!=='undefined')module.exports=root.AlienSpellingQuestions;
})(typeof window!=='undefined'?window:globalThis);
