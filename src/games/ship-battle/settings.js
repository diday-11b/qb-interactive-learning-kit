// Original Ocean Word Adventure setup options; no gameplay or question bank here.
const fields = [
 {key:'topic',label:'What will we discover?',type:'choices',options:[
  {value:'phonics',label:'Phonics',description:'Practice sounds and letters.'},
  {value:'vocabulary',label:'Vocabulary',description:'Learn and recognize words.'},
  {value:'spelling',label:'Spelling',description:'Build and identify words.'},
  {value:'math',label:'Mathematics',description:'Explore numbers and calculations.'},
  {value:'science',label:'Science',description:'Discover plants, animals, and nature.'}
 ]},
 {key:'mode',label:'Choose your way to play',type:'choices',options:[
  {value:'practice',label:'Practice',description:'Helpful hints from the start. Unlimited retries.'},
  {value:'adventure',label:'Adventure',description:'Sail toward the island and collect stars.'},
  {value:'challenge',label:'Challenge',description:'Hard arithmetic and a first-try accuracy badge. No timer.'}
 ]},
 {key:'difficulty',label:'Difficulty',type:'select',helper:'Levels change arithmetic. Other topics use the same five reviewed practice questions at every level. Four answer choices; ages are suggestions.',options:[
  {value:'easy',label:'Easy · ages 5–6 · 4 choices'},
  {value:'medium',label:'Medium · ages 7–8 · 4 choices'},
  {value:'advanced',label:'Hard · ages 9–10 · 4 choices'}
 ]},
 {key:'count',label:'Questions',type:'select',numeric:true,helper:'Longer rounds are not available yet.',options:[
  {value:5,label:'5 questions'}, {value:10,label:'10 · unavailable',disabled:true},
  {value:15,label:'15 · unavailable',disabled:true}, {value:20,label:'20 · unavailable',disabled:true}
 ]},
 {key:'randomize',label:'Randomize questions',type:'toggle'},
 {key:'sound',label:'Question sound',type:'toggle'},
 {key:'shipColor',label:'Choose your ship!',type:'choices',options:[
  {value:'original',label:'Coral Captain',image:'/src/games/ship-battle/assets/captain-ship.svg'},
  {value:'mint',label:'Mint Explorer',image:'/src/games/ship-battle/assets/captain-ship.svg'},
  {value:'violet',label:'Violet Voyager',image:'/src/games/ship-battle/assets/captain-ship.svg'}
 ]}
];
export default Object.freeze({
 id:'ship-battle',title:'Choose Your Adventure',actionLabel:'Choose Your Adventure',sectionTitle:'Adventure Settings',
 defaults:{topic:'phonics',mode:'adventure',difficulty:'easy',count:5,randomize:false,sound:true,shipColor:'original'},fields,
 adjust(values,key){if(key==='mode' && values.mode==='challenge') values.difficulty='advanced';return values;},
 validate(values){return values.mode==='challenge' && values.difficulty!=='advanced'
  ? [{fields:['mode','difficulty'],message:'Challenge mode uses Hard difficulty. Choose Hard or another game mode.'}] : [];}
});
