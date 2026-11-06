(function(root){
 "use strict";
 const bank={
 phonics:[['Which word starts with SH?',['SHIP','CAT','DOG','SUN'],'SHIP'],['Which word rhymes with BOAT?',['GOAT','FISH','MOON','CAT'],'GOAT'],['Which word begins with F?',['FISH','BOAT','SHIP','WAVE'],'FISH'],['Which word ends with T?',['CAT','SEA','SUN','DOG'],'CAT'],['Which word starts with CH?',['CHAIR','SHIP','FISH','TREE'],'CHAIR']],
 vocabulary:[['Which animal swims?',['FISH','CAT','HEN','DOG'],'FISH'],['Choose the fruit.',['APPLE','BOAT','SHOE','BOOK'],'APPLE'],['What do we wear on our feet?',['SHOES','HATS','GLOVES','COATS'],'SHOES'],['Choose the opposite of HOT.',['COLD','RED','BIG','TALL'],'COLD'],['What do we use to read?',['BOOK','CUP','BALL','SPOON'],'BOOK']],
 spelling:[['Complete C _ T.',['A','O','I','U'],'A'],['Complete D _ G.',['O','A','E','I'],'O'],['Complete S _ N.',['U','A','E','O'],'U'],['Complete F _ SH.',['I','A','E','U'],'I'],['Complete B _ AT.',['O','I','U','E'],'O']],
 science:[['What helps a plant grow?',['SUNLIGHT','PLASTIC','SHOES','SAND ONLY'],'SUNLIGHT'],['Which animal lives in the ocean?',['WHALE','LION','HEN','COW'],'WHALE'],['What do we drink to stay hydrated?',['WATER','SAND','PAINT','OIL'],'WATER'],['Which part of a plant takes in water?',['ROOTS','FLOWERS','FRUIT','SEEDS'],'ROOTS'],['Which object gives Earth light?',['SUN','MOON','CLOUD','ROCK'],'SUN']]
 };
 function validate(q){return !!q&&typeof q.prompt==='string'&&Array.isArray(q.choices)&&q.choices.length===4&&new Set(q.choices).size===q.choices.length&&q.choices.includes(q.answer);}
 function create(topic,difficulty='easy'){
  const count=4;
  let rows=bank[topic];
  if(topic==='math')rows=Array.from({length:5},(_,i)=>{const a=i+(difficulty==='advanced'?12:3),b=i+2;const n=difficulty==='advanced'?a*b:a+b;return [`${a} ${difficulty==='advanced'?'×':'+'} ${b} = ?`,[String(n),String(n+1),String(n-1),String(n+2)],String(n)];});
  if(!rows)throw new Error('Unknown learning topic');
  return rows.map(([prompt,choices,answer],i)=>({correctAnswerId:answer,id:`${topic}-${difficulty}-${i}`,topic,prompt,choices:choices.slice(0,count).sort((a,b)=>a.localeCompare(b)),answer,explanation:`The answer is ${answer}.`,type:'text'}));
 }
 root.OceanQuestions={create,validate,topics:['phonics','vocabulary','spelling','math','science']};
 if(typeof module!=='undefined')module.exports=root.OceanQuestions;
})(typeof window!=='undefined'?window:globalThis);
