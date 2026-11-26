'use strict';

// Progress measures distance along the continuous three-flight stair, not screen X.
// Feet, footprints of light, input hit tests and the scrolling camera use this path.
const towerStairs=(()=>{
  const path=[
    [0,7,95.5],[5,18.2,95.4],[29.5,75.5,66.8],[34,85,66.8],
    [38,74.4,66.8],[61.5,21,46.1],[65,13.4,46.1],
    [69,23,46.1],[93,74.3,19.4],[100,90,19.4]
  ];
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const refuge=()=>state.flags.stairTop?98:state.flags.stairSecond?65:state.flags.stairFirst?34:1;
  let keeper,beam,ray,light,spot,guardAt=0,clock=0,withdraw=false,duck=false,exposure=0;
  let aimX=0,aimY=0,bootTravel=0,lastSound=-1,lastLine='',manualAway=false;
  function project(p){
    let i=1;while(i<path.length-1&&p>path[i][0])i++;
    const [t,x,y]=path[i-1],[end,x2,y2]=path[i],f=clamp((p-t)/(end-t),0,1);
    return {x:x+(x2-x)*f,y:y+(y2-y)*f,face:Math.sign(x2-x)};
  }
  function nearest(clientX,clientY){
    const box=$('world').getBoundingClientRect();
    const x=clientX-box.left,y=clientY-box.top;
    let best=actorX,shortest=Infinity;
    for(let i=1;i<path.length;i++){
      const [p,a,b]=path[i-1],[q,c,d]=path[i];
      const ax=a*box.width/100,ay=b*box.height/100,dx=(c-a)*box.width/100,dy=(d-b)*box.height/100;
      const fraction=clamp(((x-ax)*dx+(y-ay)*dy)/(dx*dx+dy*dy),0,1);
      const distance=Math.hypot(x-ax-fraction*dx,y-ay-fraction*dy);
      if(distance<shortest){shortest=distance;best=p+(q-p)*fraction;}
    }
    return clamp(best,1,98);
  }
  let doorInReach=false;
  function enter(){
    const on=state.room==='stairs';
    $('stair-controls').hidden=!on;
    doorInReach=false;
    $('rail-glint').toggleAttribute('hidden',!on||!!state.flags.stairFirst);
    if(on)$('stair-grip').prepend($('walk-pad'));
    else $('inspect').before($('walk-pad'));
    $('world').classList.remove('wall-hidden');delete $('world').dataset.search;
    $('actor').style.removeProperty('bottom');
    withdraw=false;duck=false;
    for(const [id,label] of [['walk-left',on?'下楼':'向左走'],['walk-right',on?'上楼':'向右走']]){
      $(id).setAttribute('aria-label',label);$(id).title=label;
    }
    if(!on)return;
    keeper=$('stair-keeper');beam=$('keeper-beam');light=$('lantern-ray');ray=beam.querySelector('path');spot=beam.querySelector('ellipse');
    clock=0;exposure=0;bootTravel=0;lastSound=-1;lastLine='';manualAway=false;
    guardAt=state.flags.stairSecond?95:state.flags.stairFirst?65:34;
    const initial=project(refuge()+13);aimX=initial.x;aimY=initial.y;
    $('stair-listen').hidden=!reduceMotion;
    $('stair-duck').setAttribute('aria-pressed','false');
    $('stair-duck').onclick=()=>{
      if(withdraw||state.flags.stairTop)return;
      duck=!duck;$('world').classList.toggle('wall-hidden',duck);
      $('stair-duck').setAttribute('aria-pressed',String(duck));if(duck)harborSound.cue('curtain');
    };
    $('stair-listen').onclick=()=>{manualAway=!manualAway;harborSound.cue('lamp-gear');};
    advance(0);
  }
  function position(){
    const p=project(actorX),actor=$('actor'),world=$('world'),view=$('viewport');
    harborSound.windowPosition(p.x);
    const h=world.clientHeight;
    const dy=clamp(p.y*h/100-view.clientHeight*.72,0,Math.max(0,h-view.clientHeight));
    camera=Math.round(clamp(p.x*worldWidth/100-view.clientWidth*.5,0,Math.max(0,worldWidth-view.clientWidth)));
    actor.style.left=Math.round(p.x*worldWidth/100-actor.offsetWidth/2)+'px';
    actor.style.bottom=(100-p.y)+'%';
    $('body').style.transform='scaleX('+(p.face*face)+')';
    world.style.transform='translate('+(-camera)+'px,'+(-Math.round(dy))+'px)';
  }
  function advance(dt,before=actorX){
    const f=state.flags;
    const seeDoor=actorX<5&&!withdraw&&(doorInReach||held<0||actorX<before||destination===1);
    if(seeDoor!==doorInReach){doorInReach=seeDoor;refreshField();}
    for(const [threshold,flag] of [[34,'stairFirst'],[65,'stairSecond'],[98,'stairTop']]){
      if(!f[flag]&&!withdraw&&actorX>=threshold-.3){mark(flag);exposure=0;harborSound.cue('stair-rest');}
    }
    if(withdraw&&Math.abs(actorX-refuge())<.12){withdraw=false;exposure=0;stopWalk();}
    clock+=dt;
    const cycle=reduceMotion?(manualAway?5:.95):clock%9.4,rest=refuge(),upper=f.stairSecond?94.5:f.stairFirst?65:34;
    const target=withdraw?actorX+1.9:upper+(reduceMotion?0:1.5*Math.sin(clock*.85));
    const delta=clamp(target-guardAt,-dt*(withdraw?14:10),dt*(withdraw?14:10));
    guardAt+=delta;const oldBoot=bootTravel;bootTravel+=Math.abs(delta);
    if(Math.floor(bootTravel/2.7)!==Math.floor(oldBoot/2.7))harborSound.cue('watch-boot',project(guardAt).x);
    const guard=project(guardAt);
    keeper.style.left=guard.x+'%';keeper.style.bottom=(100-guard.y)+'%';
    const stride=Math.abs(delta)>.002?Math.floor(bootTravel/.85)%4:1;
    keeper.style.backgroundPosition=(stride*100/3)+'% bottom';
    const home=project(Math.min(95,rest+14)), look=guard.x>home.x?-1:1;
    keeper.style.setProperty('--watch-facing',Math.abs(target-guardAt)>2?Math.sign(delta)*guard.face:look);
    const x=guard.x+look*.3,y=guard.y-11.3;
    const away=reduceMotion?manualAway:cycle>3.95;
    const firstSweep=!f.stairFirst&&!withdraw&&cycle<3.95;
    const aim=project(withdraw?actorX:firstSweep?6+12*(.5-.5*Math.cos(cycle*1.54)):rest+9+((Math.sin(cycle*1.17)+1)*6));
    const endX=away&&!withdraw?guard.x-look*27:aim.x;
    const endY=away&&!withdraw?y-2.5:firstSweep?aim.y-4.8:aim.y+1;
    const blend=dt?1-Math.exp(-dt*4.4):1;
    aimX+=(endX-aimX)*blend;aimY+=(endY-aimY)*blend;
    // A fan perpendicular to the actual surface-to-lantern ray. Use the same
    // triangle (at chest height) for detection on all three flights.
    const vx=aimX-x,vy=aimY-y,len=Math.hypot(vx,vy)||1;
    const px=-vy/len*7.5,py=vx/len*4.7;
    ray.setAttribute('d','M '+x+' '+y+' L '+(aimX+px)+' '+(aimY+py)+' Q '+(aimX+vx*.04)+' '+(aimY+vy*.04)+' '+(aimX-px)+' '+(aimY-py)+' Z');
    spot.setAttribute('cx',aimX);spot.setAttribute('cy',aimY);spot.setAttribute('rx',4);spot.setAttribute('ry',.55);spot.style.opacity=away?'0':'.26';
    for(const [k,v] of [['x1',x],['y1',y],['x2',aimX],['y2',aimY]])light.setAttribute(k,v);
    beam.toggleAttribute('hidden',!!f.stairTop);
    const glint=$('rail-glint');
    glint.toggleAttribute('hidden',!firstSweep||away);
    if(firstSweep&&!away)glint.firstElementChild.style.strokeDashoffset=String(6-clamp((aimX-9)/40.5,0,1)*100);
    const pos=project(actorX),rx=pos.x-x,ry=pos.y-4.7-y;
    const det=vx*py-vy*px, along=(rx*py-ry*px)/(det||1),across=(vx*ry-vy*rx)/(det||1);
    const lit=along>.02&&along<=1.08&&Math.abs(across)<along;
    const sheltered=duck||Math.abs(actorX-rest)<3.1||f.stairTop;
    if(lit&&!f.stairTop&&Math.abs(actorX-rest)>=3.1)rememberEncounter('sweep');
    exposure=sheltered?0:clamp(exposure+dt*(lit?1:-2),0,.7);
    if(exposure>.45&&!withdraw){withdraw=true;stopWalk();harborSound.cue('keeper-found');}
    const beat=Math.floor(clock/9.4);
    if(!reduceMotion&&!f.stairTop&&cycle>8.3&&lastSound!==beat){lastSound=beat;harborSound.cue('lamp-gear');}
    $('world').dataset.search=withdraw?'caught':lit&&!sheltered?'lit':away?'away':'sweep';
    $('stair-duck').disabled=$('stair-listen').disabled=!!f.stairTop||withdraw;
    const line=f.stairTop?'门廊尽头，守夜人把灯压低，等你递证。':
      withdraw?'灯追着你下了几级。退回平台，再找机会。':
      duck?'背贴着冰凉的墙。灯光擦过外侧扶手。':
      exposure>.05?'扶手上的光碰到了你的衣袖。':
      away?'上面咔哒一声，灯转向内墙。':'楼上有铁靴声。白光正沿着台阶往下找。';
    if(line!==lastLine){lastLine=line;$('stair-sense').textContent=line;}
  }
  return {enter,position,project,nearest,advance,refuge,doorVisible:()=>doorInReach,returning:()=>state?.room==='stairs'&&withdraw,speed:()=>withdraw?18:duck?0:9};
})();
