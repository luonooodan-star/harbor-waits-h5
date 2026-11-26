'use strict';

// One composition for the room, the close-up and both sides of the doorway.
// The table is an occluding foreground plate; each chair has its own ground contact.
function supperFurniture(placed, lift=0){
  const layer=document.createElement('div');
  layer.className='supper-furniture'+(placed?' at-window':'');
  layer.setAttribute('aria-hidden','true');
  layer.style.setProperty('--lift',lift);
  layer.innerHTML='<i class="feet-shadow guest-print"></i><i class="feet-shadow stool-print"></i><i class="feet-shadow seventh-print"></i><i class="guest-chair"></i><i class="guest-stool"></i><i class="seventh-chair"></i><i class="table-front"></i>';
  return layer;
}

function syncSupperFurniture(){
  const host=$('room-furniture');
  const atTable=state.room==='dinner'||state.room==='flood';
  host.hidden=!atTable;
  if(!atTable){host.replaceChildren();return;}
  const lift=state.room==='flood'?Math.min(1,(state.flags.window?100:state.windowRise||0)/32):0;
  const placed=!!state.flags.chair;
  let layer=host.firstElementChild;
  if(!layer){layer=supperFurniture(placed,lift);host.append(layer);}
  layer.classList.toggle('at-window',placed);
  layer.style.setProperty('--lift',lift);
  layer.classList.toggle('adrift',lift>.9);
}

function moveSupperChair(){
  if(state.flags.chair){
    if(state.flags.chairEchoPending){hearAnswer();return;}
    say([['窗边的折椅','你搬来的椅子还在这里。伸手摸到座板底下，纸签的角有些翘。']]);
    return;
  }
  function hearAnswer(){
    sheet('02','折椅','<div class="chair-floor chair-still"></div><p class="caption" role="status">手松开了。椅脚稳稳地落在地上。</p>');
    const floor=inner.querySelector('.chair-still'),note=inner.querySelector('[role=status]');
    floor.append(supperFurniture(true));
    const sticks=document.createElement('i');sticks.className='echo-sticks';floor.append(sticks);
    let elapsed=0,last=performance.now(),answered=false;
    function beat(now){
      if(!panel.open||!floor.isConnected)return;
      if(!document.hidden)elapsed+=Math.min(100,now-last);
      last=now;
      if(!answered&&elapsed>=720){
        answered=true;floor.classList.add('answered');
        note.textContent=state.flags.pipeScrapes?'又是那一下长的。这次在头顶。':'头顶的管子里，有人拖了一下椅子。';
        delete state.flags.chairEchoPending;mark('chairEcho');
        harborSound.cue('chair-answer');
      }
      if(elapsed>=2850){
        say([['阿姨','靠窗好。你坐这儿，我一抬眼就能看见你。']]);return;
      }
      requestAnimationFrame(beat);
    }
    requestAnimationFrame(beat);
  }
  function inspect(flipped){
    const body='<button class="chair-closeup'+(flipped?' underside':'')+'" aria-label="翻看折椅"><i>'+
      (flipped?'<b translate="no">林遥</b>':'')+'</i></button>'+
      '<p class="caption">'+(flipped?'胶布下面是你的名字。有人早就替你留好了座。':'铰链后面露出一小角胶布。')+'</p>';
    const turn=()=>{if(!flipped){harborSound.cue('curtain');mark('chairName');inspect(true);}else carry();};
    sheet('02','折椅',body,[[flipped?'把椅子扶起来':'翻过椅面',turn,true]]);
    inner.querySelector('.chair-closeup').onclick=turn;
  }
  function carry(){
    sheet('02','折椅','<div class="chair-floor"><button class="chair-place" aria-label="靠窗的空位"></button><button class="chair-hand" aria-label="握住椅背"></button></div><p class="caption" role="status">拖住椅背，把椅子挪到靠窗的桌边。也可以先点椅背，再点空位。</p>');
    const floor=inner.querySelector('.chair-floor'),hand=floor.querySelector('.chair-hand'),place=floor.querySelector('.chair-place');
    floor.prepend(supperFurniture(false));
    const note=inner.querySelector('[role=status]');
    let selected=false,drag=null;
    function grip(){if(selected)return;selected=true;floor.classList.add('gripped');hand.setAttribute('aria-pressed','true');harborSound.cue('curtain');}
    function land(){
      if(!selected){note.textContent='先握住椅背。';return;}
      if(state.flags.chair)return;
      mark('chair','chairEchoPending');harborSound.cue('stool');hearAnswer();
    }
    hand.onclick=grip;place.onclick=land;
    hand.onpointerdown=e=>{
      grip();drag={x:e.clientX,y:e.clientY,moved:false};hand.setPointerCapture(e.pointerId);
    };
    hand.onpointermove=e=>{
      if(!drag)return;
      if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5&&!drag.moved)return;
      drag.moved=true;
      const rect=floor.getBoundingClientRect();
      hand.style.left=Math.max(3,Math.min(94,100*(e.clientX-rect.left)/rect.width))+'%';
      hand.style.top=Math.max(19,Math.min(87,100*(e.clientY-rect.top)/rect.height))+'%';
    };
    hand.onpointerup=e=>{
      if(!drag)return;
      const moved=drag.moved;drag=null;
      const target=place.getBoundingClientRect();
      if(moved&&e.clientX>=target.left&&e.clientX<=target.right&&e.clientY>=target.top&&e.clientY<=target.bottom){land();return;}
      hand.style.removeProperty('left');hand.style.removeProperty('top');
      if(moved)note.textContent='那扇能看见港灯的窗下，还有一个空位。';
    };
    hand.onlostpointercapture=()=>{drag=null;hand.style.removeProperty('left');hand.style.removeProperty('top');};
    hand.focus({preventScroll:true});
  }
  inspect(!!state.flags.chairName);
}
