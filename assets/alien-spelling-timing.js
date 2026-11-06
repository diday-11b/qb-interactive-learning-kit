(function(root){
'use strict';
// One pending mission transition, measured only while the mission is running.
class AlienMissionClock {
 constructor(env={}){this.now=env.now||(()=>performance.now());this.setTimer=env.setTimer||((fn,ms)=>setTimeout(fn,ms));this.clearTimer=env.clearTimer||(id=>clearTimeout(id));this.pending=null;this.paused=false;}
 schedule(ms,fn){this.cancel();this.pending={remaining:ms,fn,id:null,started:0};if(!this.paused)this.arm();}
 arm(){const job=this.pending;if(!job)return;job.started=this.now();job.id=this.setTimer(()=>{if(this.pending!==job||this.paused)return;this.pending=null;job.fn();},job.remaining);}
 pause(){if(this.paused)return;this.paused=true;const job=this.pending;if(job){this.clearTimer(job.id);job.remaining=Math.max(0,job.remaining-(this.now()-job.started));}}
 resume(){if(!this.paused)return;this.paused=false;this.arm();}
 cancel(){if(this.pending)this.clearTimer(this.pending.id);this.pending=null;}
}
root.AlienMissionClock=AlienMissionClock;
if(typeof module!=='undefined')module.exports=AlienMissionClock;
})(typeof window!=='undefined'?window:globalThis);
