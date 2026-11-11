export function practiceSettings(id,title,kind){return {
 id,title,actionLabel:title,sectionTitle:'Game Settings',
 defaults:{difficulty:'easy',mode:'adventure',count:5,randomize:true,sound:true},
 fields:[
 {key:'difficulty',label:'Difficulty',type:'select',options:['easy','medium','hard'].map((value,i)=>({value,label:['Easy','Medium','Hard'][i]+' · '+(kind==='math'?['small additions','larger additions','multiplication'][i]:['short words','longer words','advanced words'][i])}))},
 {key:'mode',label:'Game mode',type:'choices',options:[{value:'practice',label:'Practice',description:'Written hints and unlimited retries.'},{value:'adventure',label:'Adventure',description:'Collect a star for every completed turn.'},{value:'challenge',label:'Challenge',description:'Hard level and a first-try accuracy badge.'}]},
 {key:'count',label:'Questions',type:'select',numeric:true,options:[{value:5,label:'5 questions'}]},
 {key:'randomize',label:'Randomize questions',type:'toggle'},
 {key:'sound',label:'Question audio',type:'toggle'}],
 adjust(values,key){if(key==='mode'&&values.mode==='challenge')values.difficulty='hard';return values;},
 validate(values){return values.mode==='challenge'&&values.difficulty!=='hard'?[{fields:['mode','difficulty'],message:'Challenge uses Hard difficulty.'}]:[];}
};}
