(function(root){
'use strict';
class RaceClock{
 constructor(env={}){this.now=env.now||(()=>performance.now());this.set=env.set||((fn,ms)=>setTimeout(fn,ms));this.clear=env.clear||(id=>clearTimeout(id));this.job=null;this.paused=false;}
 schedule(ms,fn){this.cancel();this.job={remaining:ms,fn,id:null,started:0};if(!this.paused)this.arm();}
 arm(){const job=this.job;if(!job)return;job.started=this.now();job.id=this.set(()=>{if(this.job!==job||this.paused)return;this.job=null;job.fn();},job.remaining);}
 pause(){if(this.paused)return;this.paused=true;if(this.job){this.clear(this.job.id);this.job.remaining=Math.max(0,this.job.remaining-(this.now()-this.job.started));}}
 resume(){if(!this.paused)return;this.paused=false;this.arm();}
 cancel(){if(this.job)this.clear(this.job.id);this.job=null;}
 reset(){this.cancel();this.paused=false;}
}
root.RabbitRaceClock=RaceClock;if(typeof module!=='undefined')module.exports=RaceClock;
})(typeof window!=='undefined'?window:globalThis);
