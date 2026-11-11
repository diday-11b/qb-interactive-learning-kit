// Original Alien Spelling mission options and its Picture Spelling restriction.
export default Object.freeze({
 id:'alien-spelling',title:'Choose Your Mission',actionLabel:'Choose Your Mission',sectionTitle:'Mission Settings',
 defaults:{activity:'mixed',difficulty:'easy',mode:'adventure',count:5},
 fields:[
  {key:'activity',label:'Spelling activity',type:'choices',helper:'Picture Spelling supports Easy. The other activities support all three levels.',options:[
   {value:'picture',label:'Picture Spelling'}, {value:'listen',label:'Listen & Spell'},
   {value:'complete',label:'Complete the Word'}, {value:'mixed',label:'Mixed Spelling'}
  ]},
  {key:'mode',label:'Game mode',type:'choices',options:[
   {value:'practice',label:'Practice',description:'Helpful hints.'},
   {value:'adventure',label:'Adventure',description:'Collect energy and launch your shuttle.'},
   {value:'challenge',label:'Challenge',description:'Harder words and an accuracy badge.'}
  ]},
  {key:'difficulty',label:'Difficulty',type:'select',helper:'Age ranges are suggestions. Take your time—there is no timer.',options:[
   {value:'easy',label:'Easy · ages 5–6 · short words'},
   {value:'medium',label:'Medium · ages 7–8 · familiar longer words'},
   {value:'hard',label:'Hard · ages 9–10 · spelling patterns'}
  ]},
  {key:'count',label:'Questions',type:'select',numeric:true,helper:'Longer rounds are not available yet.',options:[
   {value:5,label:'5 questions'}, {value:10,label:'10 · unavailable',disabled:true},
   {value:15,label:'15 · unavailable',disabled:true}, {value:20,label:'20 · unavailable',disabled:true}
  ]}
 ],
 adjust(values,key){if(key==='mode' && values.mode==='challenge') values.difficulty='hard';return values;},
 validate(values){
  const errors=[];
  if(values.activity==='picture' && values.difficulty!=='easy') errors.push({fields:['activity','difficulty'],message:'Picture Spelling supports Easy. Choose Easy or another spelling activity.'});
  if(values.mode==='challenge' && values.difficulty!=='hard') errors.push({fields:['mode','difficulty'],message:'Challenge mode uses Hard difficulty. Choose Hard or another game mode.'});
  return errors;
 }
});
