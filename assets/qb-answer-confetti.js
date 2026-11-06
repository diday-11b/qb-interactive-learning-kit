(() => {
 'use strict';
 let player=null,layer=null,timer=null;
 function clear(){clearTimeout(timer);if(player){player.destroy();player=null;}if(layer){layer.remove();layer=null;}}
 window.QBCorrectConfetti={play(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches||document.querySelector('.reduce-motion')||!window.lottie)return;
  clear();layer=document.createElement('div');layer.setAttribute('aria-hidden','true');
  Object.assign(layer.style,{position:'fixed',inset:'0',zIndex:'10000',pointerEvents:'none',display:'grid',placeItems:'center'});
  const canvas=document.createElement('div');Object.assign(canvas.style,{width:'min(850px,100vw)',height:'min(850px,100dvh)'});layer.append(canvas);document.body.append(layer);
  player=lottie.loadAnimation({container:canvas,renderer:'svg',loop:false,autoplay:true,path:'/assets/animations/correct-answer-confetti.json'});
  player.addEventListener('complete',clear);player.addEventListener('data_failed',clear);timer=setTimeout(clear,3500);
 },clear};
 window.addEventListener('pagehide',clear);
})();
