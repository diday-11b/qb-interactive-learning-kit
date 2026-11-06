(function(root){
const transitions={INTRO:['CONFIGURATION'],CONFIGURATION:['GAME_READY'],GAME_READY:['QUESTION_ACTIVE'],QUESTION_ACTIVE:['ANSWER_INCORRECT','ANSWER_CORRECT'],ANSWER_INCORRECT:['QUESTION_ACTIVE'],ANSWER_CORRECT:['SUCCESS_FEEDBACK'],SUCCESS_FEEDBACK:['GAME_ACTION'],GAME_ACTION:['GAME_READY','GAME_COMPLETED'],GAME_COMPLETED:[]};
class OceanState{constructor(initial='GAME_READY'){this.state=initial}go(next){if(!transitions[this.state].includes(next))return false;this.state=next;return true;}}
root.OceanState=OceanState;if(typeof module!=='undefined')module.exports=OceanState;
})(typeof window!=='undefined'?window:globalThis);