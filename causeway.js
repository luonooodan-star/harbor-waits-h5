'use strict';

// A blind net-hauler feels moving feet through the tension in its anchor chain.
const nightWatch = (() => {
  const crates=16, shrine=45, winch=73;
  let clock=0, haulerX=57, facing=-1, footDistance=0;
  let childDistance=0, exposure=0, chase=false, quiet=false, noise=0, lure=0, spent=false;
  let plate='clear', loadTime=0;
  let hauler, child, chainBed, chainLinks, tipX, tipY, lastCaption='', lastTurn='', manualSea=false;

  const refuge=()=>state.flags.crossed?winch:state.flags.shrineReached?shrine:crates;
  const homeCover=x=>x<=21?'crates':Math.abs(x-shrine)<=4?'shrine':x>=winch-3?'winch':'';
  const returning=()=>state?.room==='causeway'&&chase;
  const speed=()=>chase?27:state.flags.crossed?27:plate==='flex'?1.8:quiet?10:18;
  const limit=(v,low,high)=>Math.min(high,Math.max(low,v));

  function enter(){
    const on=state.room==='causeway';
    $('watch-actions').hidden=!on||!!state.flags.crossed;
    const world=$('world');
    delete world.dataset.cover;
    delete world.dataset.watch;
    world.classList.remove('watch-quiet','watch-hiding');
    chase=false;
    if(!on)return;
    clock=0;childDistance=0;haulerX=state.flags.crossed?83:57;facing=-1;
    footDistance=0;exposure=0;quiet=false;
    noise=0;lure=0;spent=false;plate='clear';loadTime=0;delete world.dataset.plate;manualSea=false;lastCaption='';lastTurn='';
    hauler=$('anchor-hauler');child=$('watch-child');
    chainBed=$('quay-chain').querySelector('.chain-bed');chainLinks=$('quay-chain').querySelector('.chain-links');
    tipX=haulerX-14;tipY=74;
    $('watch-stop').hidden=true;
    $('watch-stop').onclick=stopWalk;
    $('watch-listen').hidden=!reduceMotion;
    $('watch-lead').hidden=!state.flags.granny;
    $('watch-quiet').setAttribute('aria-pressed','false');
    $('watch-quiet').onclick=()=>{
      quiet=!quiet;
      $('watch-quiet').setAttribute('aria-pressed',String(quiet));
      world.classList.toggle('watch-quiet',quiet);
    };
    $('watch-listen').onclick=()=>{
      manualSea=!manualSea;clock=manualSea?6.1:.75;
      harborSound.cue('chain-away');
    };
    $('watch-lead').onclick=()=>{
      if(spent||(!homeCover(actorX)&&plate!=='flex')||chase)return;
      spent=true;lure=5.8;noise=0;harborSound.cue('weight-splash');
    };
    advance(0,actorX);
  }

  function caption(text){
    if(text!==lastCaption){lastCaption=text;$('watch-sense').textContent=text;}
  }

  function advance(dt,before){
    if(!reduceMotion)clock=(clock+dt)%14;
    lure=Math.max(0,lure-dt);noise=Math.max(0,noise-dt);
    const breaking=coastWeather.inSurf(actorX);
    const washOnPlate=reduceMotion?manualSea:coastWeather.inSurf(58);
    const cover=homeCover(actorX);
    if(!state.flags.crossed&&!chase){
      if(!state.flags.shrineReached&&Math.abs(actorX-shrine)<=2){
        mark('shrineReached');spent=false;
      }
      if(state.flags.shrineReached && actorX>=winch-1){
        mark('crossed');harborSound.cue('chain-away');exposure=0;
        $('watch-actions').hidden=true;
      }
      const onIron=actorX>=52&&actorX<=65, forward=actorX>before+.001;
      // The metal takes weight before it rings. Holding still unloads the shoe;
      // a breaking wave masks the entire crossing once the player commits.
      const masked=lure>0||washOnPlate;
      if(!onIron){plate='clear';loadTime=0;}
      else if(plate==='masked'&&!forward&&!masked){plate='flex';loadTime=0;}
      else if(!chase&&plate!=='masked'&&plate!=='ring'){
        if(masked&&forward){plate='masked';loadTime=0;}
        else if(forward){
          if(plate==='clear')harborSound.cue('plate-flex');
          plate='flex';loadTime+=dt;
          if(loadTime>1.35){plate='ring';noise=2.2;harborSound.cue('loose-iron');rememberEncounter('iron');}
        }else loadTime=0;
      }
      $('world').dataset.plate=plate;
    }
    // When the chain goes slack or surf covers the stones, footsteps are masked.
    const t=clock;
    let nextX=t<4?57-4*t:t<10?41+(t-4)*5:71-(t-10)*3.5;
    let direction=t<4||t>=10?-1:1;
    let sea=(t>=4&&t<8)||(t>=10&&t<12.8);
    if(lure>0){sea=true;nextX=64;direction=1;}
    if(chase||noise>0||plate==='flex'){
      sea=false;nextX=chase?actorX+10:haulerX;
      direction=actorX>=haulerX?1:-1;
    }
    if(state.flags.crossed){sea=true;nextX=25;direction=-1;}
    const previous=haulerX;
    haulerX+=limit(nextX-haulerX,-dt*(chase?21:state.flags.crossed?13:8),dt*(chase?21:state.flags.crossed?13:8));
    if(Math.abs(haulerX-previous)>.015)facing=haulerX>previous?1:-1;
    else facing=direction;
    if(chase||noise>0||plate==='flex')facing=direction;
    footDistance+=Math.abs(haulerX-previous);
    if(Math.floor(footDistance/3)!==Math.floor((footDistance-Math.abs(haulerX-previous))/3)){
      harborSound.cue('anchor-step',haulerX);
    }
    const stepping=Math.abs(haulerX-previous)>.004;
    const pose=stepping?Math.floor(footDistance/1.5)%4:1;
    hauler.style.left=haulerX+'%';
    hauler.style.setProperty('--watch-facing',facing);
    hauler.style.backgroundPosition=(pose*100/3)+'% bottom';
    childDistance+=Math.abs(actorX-before);
    child.classList.toggle('striding',Math.abs(actorX-before)>.001);
    child.style.backgroundPosition=((Math.floor(childDistance/1.5)%4)*100/3)+'% bottom';
    child.style.left=(actorX-4.2)+'%';
    child.style.setProperty('--child-facing',face);
    const underLoad=plate==='flex'||plate==='ring';
    const endX=underLoad?57:haulerX-facing*(sea?12:20);
    tipX+=(endX-tipX)*(dt?1-Math.exp(-dt*4):1);
    tipY+=((sea?69:76)-tipY)*(dt?1-Math.exp(-dt*3.3):1);
    const hook=haulerX-facing*5.9,bend=underLoad?.12:sea?3.7:1.6;
    const curve='M '+hook+' 74.3 Q '+(hook*.5+tipX*.5)+' '+(Math.max(74,tipY)+bend)+' '+tipX+' '+tipY;
    chainBed.setAttribute('d',curve);chainLinks.setAttribute('d',curve);
    const listens=!sea&&!lure&&!breaking&&plate==='clear';
    const heard=noise>0 || (listens&&!quiet&&Math.abs(actorX-before)>.001&&Math.abs(actorX-haulerX)<30);
    const turn=sea?'sea':'road';
    if(lastTurn&&turn!==lastTurn&&!state.flags.crossed)harborSound.cue(sea?'chain-away':'chain-near');
    lastTurn=turn;
    $('world').dataset.cover=cover;
    $('world').classList.toggle('watch-hiding',!!cover&&!state.flags.crossed&&Math.abs(actorX-before)<.001);
    if(!state.flags.crossed&&!chase){
      exposure=cover?0:limit(exposure+dt*(heard?1:-1.8),0,1);
      if(exposure>.34){
        chase=true;stopWalk();harborSound.cue('anchor-scrape');
      }
    }
    if(chase&&Math.abs(actorX-refuge())<.12){
      chase=false;exposure=0;noise=0;plate='clear';loadTime=0;
      stopWalk();
    }
    const mood=chase?'pursuit':exposure>.04?'noticed':sea?'sea':'road';
    $('world').dataset.watch=mood;
    if(state.flags.crossed)return;
    $('watch-stop').hidden=plate!=='flex'||chase;
    $('watch-lead').disabled=spent||(!cover&&plate!=='flex')||chase;
    caption(noise>0?'铁板一响，拖锚客立刻拽紧了链子。':
      chase?'小满拽住你的袖口，往刚才藏身的地方跑。':
      lure>0?'铅坠落进海里。拖锚客探身去捞。':
      plate==='flex'&&washOnPlate?'浪花翻到铁板上了。':
      plate==='flex'?(actorX>before+.001?'铁皮正往下弯，远处的锚链一节节绷紧。':'你收住脚。铁板还绷着，再没响第二声。'):
      plate==='masked'?'浪声压住了铁板的颤音。':
      exposure>.04?'链子抖了一下。它听见了。':
      breaking?'白浪漫上来，盖住了脚步声。':
      cover==='shrine'&&washOnPlate?'浪花翻到铁板上了。':
      cover==='shrine'?'小满按住翘起的铁板。另一头搭在绞盘底下。':
      sea?'链子松了，锚钩垂进浪里。':'铁链绷在石头上。那件潜水衣侧过身听。');
  }
  return {enter,advance,speed,returning,refuge};
})();
