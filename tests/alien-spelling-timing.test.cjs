const test=require('node:test');
const assert=require('node:assert/strict');
const Clock=require('../assets/alien-spelling-timing.js');
function setup(){let now=0,id=0;const jobs=new Map(),all=[];const clock=new Clock({now:()=>now,setTimer(fn,ms){const key=++id;jobs.set(key,{fn,at:now+ms});all.push(fn);return key;},clearTimer(key){jobs.delete(key);}});return {clock,all,advance(ms){const end=now+ms;for(;;){const next=[...jobs.entries()].filter(([,j])=>j.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!next)break;now=next[1].at;jobs.delete(next[0]);next[1].fn();}now=end;}};}
for(const duration of [2000,1100])test('Pause preserves remaining '+duration+'ms transition',()=>{const {clock,advance}=setup();let count=0;clock.schedule(duration,()=>count++);advance(300);clock.pause();advance(9000);assert.equal(count,0);clock.resume();advance(duration-301);assert.equal(count,0);advance(1);assert.equal(count,1);advance(5000);assert.equal(count,1);});
test('Repeated pauses retain the exact unpaused duration',()=>{const {clock,advance}=setup();let done=false;clock.schedule(2000,()=>done=true);for(let i=0;i<3;i++){advance(200);clock.pause();clock.pause();advance(3000);clock.resume();clock.resume();}advance(1399);assert.equal(done,false);advance(1);assert.equal(done,true);});
test('Exit invalidates even a callback that was already queued',()=>{const {clock,advance,all}=setup();let count=0;clock.schedule(2000,()=>count++);const stale=all[0];clock.cancel();stale();advance(3000);assert.equal(count,0);clock.schedule(1100,()=>count++);stale();advance(1100);assert.equal(count,1);});
test('One transition can schedule the next exactly once',()=>{const {clock,advance}=setup();const phases=[];clock.schedule(2000,()=>{phases.push('travel');clock.schedule(1100,()=>phases.push('ready'));});advance(3100);assert.deepEqual(phases,['travel','ready']);advance(10000);assert.equal(phases.length,2);});
test('Reduced motion action remains asynchronous and pausable',()=>{const {clock,advance}=setup();let count=0;clock.pause();clock.schedule(0,()=>count++);advance(100);assert.equal(count,0);clock.resume();advance(0);assert.equal(count,1);});

test('Default browser timers are called with their native receiver',()=>{
 const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
 const context=vm.createContext({performance:{now:()=>0}});
 vm.runInContext('var calls=0; function setTimeout(){if(this!==globalThis)throw Error("Illegal invocation");calls++;return 1;} function clearTimeout(){if(this!==globalThis)throw Error("Illegal invocation");}',context);
 vm.runInContext(fs.readFileSync(path.join(__dirname,'../assets/alien-spelling-timing.js'),'utf8'),context);
 vm.runInContext('var clock=new AlienMissionClock();clock.schedule(2000,()=>{});clock.pause();clock.resume();clock.cancel();',context);
 assert.equal(context.calls,2);
});
