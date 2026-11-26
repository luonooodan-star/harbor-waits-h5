'use strict';

// Both views remain under the player's hand. Leaving the close-up keeps its position.
function thresholdView(door){
  const field=door?'doorAngle':'windowRise';
  const peak=state.flags.window&&!door?100:state[field]||0;
  const view=door
    ? '<div class="supper-side"></div><div class="door-frame"><div class="dry-side"></div><div class="door-leaf"></div></div>'
    : '<div class="dining-eye"><i class="supper-aunt"></i></div><div class="ocean-distance"><div class="ocean-plate"></div><div class="bus-current"><i class="whole-bus"></i></div><i class="ticket-current"></i></div>';
  sheet('居民楼 · 二楼',door?'门槛':'饭桌旁的窗',`<div class="threshold-view ${door?'two-rooms':'bus-window'}" id="threshold-view">${view}</div>
    <label class="passage-control">${door?'扶着门，慢慢推开':'扶住窗框，向上拖动，望向窗外'}<input type="range" id="passage-range" min="0" max="100" value="${peak}"></label>
    <p id="passage-sense" class="caption" aria-live="polite"></p>`,[[door?'跨过门槛':'松开窗框',finish,true]]);
  const stage=$('threshold-view'),control=$('passage-range'),action=inner.querySelector('.panel-actions button');
  const furniture=supperFurniture(!!state.flags.chair,door?1:0);
  stage.querySelector(door?'.supper-side':'.dining-eye').append(furniture);
  if(door){
    furniture.classList.add('adrift');
    coastWeather.detail(stage.querySelector('.supper-side'),'underwater');
    coastWeather.detail(stage.querySelector('.dry-side'),'dryhall');
  }else{
    coastWeather.detail(stage.querySelector('.dining-eye'),'dinner');
    coastWeather.detail(stage.querySelector('.ocean-plate'),'deep-water');
  }
  let previous=peak,hit=peak===100, crossing=false;
  function paint(value,gesture){
    const t=value/100;
    stage.style.setProperty('--p',t);
    stage.style.setProperty('--door-angle',(-80*t)+'deg');
    if(!door){
      furniture.style.setProperty('--lift',Math.min(1,t/.32));
      furniture.classList.toggle('adrift',t>.32);
      const reveal=Math.min(1,t/.52);
      const ease=t*t*(3-2*t);
      const zoom=1+2.72*ease;
      // Project the original window aperture with the camera. Its wood stays in front.
      const dx=(1.8-26.87*3.72)*ease;
      const dy=(95.5-(5.79+33.23)*3.72)*ease;
      const top=Math.max(0,5.79*zoom+dy);
      stage.style.setProperty('--eye-x',dx+'%');
      stage.style.setProperty('--eye-y',dy+'%');
      stage.style.setProperty('--glass-x',(26.87*zoom+dx)+'%');
      stage.style.setProperty('--glass-y',top+'%');
      stage.style.setProperty('--glass-w',(25.34*zoom)+'%');
      stage.style.setProperty('--glass-h',((5.79+33.23)*zoom+dy-top)+'%');
      stage.style.setProperty('--sea-reveal',reveal*reveal*(3-2*reveal));
      stage.style.setProperty('--approach',zoom);
      stage.style.setProperty('--bus-depth',((1-t)*24)+'%');
    }
    stage.style.setProperty('--slip-y',(65-t*115)+'%');
    control.value=value;action.disabled=value!==100;
    const sense=door?(value<22?'门里的低鸣还在，像隔着很深的水。':value<75?'门缝里有扫帚擦过水泥的声音。':'左边的车窗仍浸在水里。门外有人提着菜，钥匙碰了两下。')
      :(value<25?'玻璃外面，一小截白纸边浮起来。':value<65?'车票翻过窗沿。对街的路灯在脚下，一辆末班车慢慢升过屋脊。':value<100?'四只车轮都离开了路面。远处的钟楼在水里，一条街，又一条街。':'抬头，原来放着天空的地方，海面还在起伏。');
    const label=$('passage-sense');
    if(label.dataset.message!==sense){label.dataset.message=sense;label.textContent=sense;}
    if(door){
      harborSound.doorway(t);
      if(gesture && previous<72 && value>=72)harborSound.cue('keys');
    }else if(gesture && !hit && value===100){
      hit=true;stage.classList.add('contact');harborSound.cue('ocean-depth');
    }
    previous=value;state[field]=value;
  }
  function finish(){
    if(+control.value!==100||crossing)return;
    if(!door){
      closePanel();mark('window');$('backdrop').src=artUrl('underwater');coastWeather.scene('underwater');
      say([['阿姨','别站窗边。']]);return;
    }
    crossing=true;action.disabled=true;control.disabled=true;
    stage.classList.add('across');harborSound.cue('dry-step');
    const animation=reduceMotion?null:stage.animate([{transform:'none'},{transform:'scale(1.12) translateX(-3%)'}],{duration:520,fill:'forwards'});
    Promise.resolve(animation?.finished).then(()=>{
      if(!stage.isConnected||!panel.open||state.room!=='flood')return;
      state.flags.threshold=true;moveRoom('hall');
    }).catch(()=>{});
  }
  control.oninput=()=>paint(+control.value,true);
  control.onchange=save;
  let origin=null;
  stage.onpointerdown=e=>{if(crossing)return;origin={x:e.clientX,y:e.clientY,value:+control.value};stage.setPointerCapture(e.pointerId);};
  stage.onpointermove=e=>{
    if(!origin)return;
    const rect=stage.getBoundingClientRect();
    const delta=door?(e.clientX-origin.x)/rect.width:(origin.y-e.clientY)/rect.height;
    paint(Math.round(Math.max(0,Math.min(100,origin.value+delta*170))),true);
  };
  stage.onlostpointercapture=()=>{origin=null;save();};
  paint(peak,false);
}

function dropShoeTicket(){
  state.ticketX=Math.round(actorX);
  mark('ticketDown');
  harborSound.cue('wet-paper');
  announce('鞋底轻轻一响。一张车票粘在干水泥上。');
}

function ticketEcho(text){
  if(!state.flags.wetTicket)return '';
  return '<aside class="ticket-echo"><span>海城客运<br>单程 · 贰</span><p>'+text+'</p></aside>';
}
