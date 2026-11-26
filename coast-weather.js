'use strict';

// Mattes follow the painted horizon, quay and individual panes. Coordinates are
// percentages of the original plate, independent of camera position and zoom.
const coastWeather = (() => {
  const shape = (...pairs) => 'M'+pairs.join(' ')+'Z';
  const rect = (x,y,r,b) => shape(x,y,r,y,r,b,x,b);
  const panes = (xs,ys) => xs.flatMap(([x,r])=>ys.map(([y,b])=>rect(x,y,r,b))).join(' ');
  const quay = {
    sky:shape(0,0,93,0,91,32,83,40,81,46,75,45,65,49,50,51,36,49,30,45,13,39,0,32),
    water:shape(0,48,16,54,32,53,38,54,38,67,26,68,25,58,23,58,20,65,19,60,9,60,7,68,0,70)+' '+shape(50,52,64,50,76,47,83,46,84,61,81,61,78,60,76,61,72,59,67,61,65,62,62,68,53,66,51,62)+' '+shape(0,95,15,94,26,96,42,96,58,95,74,93,87,96,100,92,100,100,0,100),
    rain:shape(0,0,94,0,92,34,84,42,84,72,100,73,100,100,0,100),
    strikes:[[42,74,35,15,6],[59,74.5,37,18,6],[70,74,32,14,6]],
    puddles:rect(0,75,100,79)
  };
  const pier = {
    sky:shape(74,26,79,20,79,25,82,25,82,17,88,10,97,9,100,15,100,25,95,25,91,30,87,33,82,33,80,44,74,47),
    water:shape(74,56,79,53,81,53,81,60,88,60,88,63,94,63,94,70,100,70,100,77,74,77),
    rain:shape(74,26,79,20,79,25,82,25,82,16,88,10,97,9,100,15,100,80,74,80)+' '+panes([[12,15.4],[20,23.4],[25,28],[29,31]],[[16,23],[35,44]]),
    strikes:[[86,72,18,8,6],[96,73,15,9,6]],puddles:rect(75,75,99.9,79)
  };
  const tunnel = shape(2,94,23,92,50,83,66,77,79,71,84,66,95,66,95,75,89,82,95,91,94,94);
  const bay = panes([[27.2,35.5],[36.2,44.6]],[[12,24],[25.4,49.7]]);
  const kitchen = panes([[27.2,30.7],[31.3,39.1],[39.8,47.1],[47.8,51.8]],[[6.3,15.5],[16.5,38.5]]);
  const gallery = shape(5.6,12,13,19,13,57,5.6,57)+' '+shape(15.4,23,21,32,21,56,15.4,56)+' '+shape(23.5,31,25.1,33,25.1,54,23.5,54)+' '+shape(27.2,34,32,38,32,54,27.2,54);
  const filesWindow=panes([[42,59.1],[61,66.3]],[[17,33.6],[35,51.8]])+' '+rect(35.6,21.5,37.4,35);
  const backOffice=panes([[67.4,78.3],[79.5,93.8],[95,99.5]],[[16,27],[29.8,51.4]]);
  const lightRoom=shape(35,10,47.5,9,47.5,28,35,27)+' '+panes([[50.1,64.2],[66.4,79.6]],[[7,27],[30,51.8]]);
  const profiles = {
    causeway:quay, ferry:pier, signalhut:pier,
    'film-crossing':{sky:shape(0,0,58,0,52,12,47,12,42,25,35,12,24,15,18,3,6,6,0,18),water:shape(0,66,11,62,27,63,32,66,24,71,17,79,17,98,0,98)+' '+shape(66,68,77,66,83,71,99,69,100,100,62,100),rain:rect(0,0,100,100),strikes:[[77,82,18,6,11],[14,74,13,4.5,6]]},
    'film-watch':{sky:shape(0,0,69,0,66,15,62,31,53,43,44,56,33,58,23,72,0,81),water:shape(0,76,25,67,19,84,2,99)+' '+shape(65,76,81,68,100,65,100,99,70,99),rain:rect(0,0,100,100),strikes:[[65,76,13,6,5],[15,87,16,8,5]]},
    'film-tower':{sky:shape(0,0,48,0,46,63,38,81,23,86,11,80,0,58)+' '+shape(54,0,100,0,99,71,90,66,83,71,67,83,55,69),rain:rect(0,0,100,100),water:rect(70,92,88,98)}, 
    drain:{water:tunnel,strikes:[[84,74,18,4.8,16],[66,82,21,5.5,10]],drips:true},
    culvert:{water:tunnel,strikes:[[85,74,18,4,20],[64,83,26,4.8,11]],drips:true},
    room:{sky:panes([[27.4,35.6],[36.4,44.2]],[[12.4,24],[25.4,31]]),water:panes([[27.4,35.6],[36.4,44.2]],[[40,49.5]]),rain:bay,window:true},
    dinner:{sky:panes([[27.4,30.7],[31.4,39],[40,47]],[[6.5,15],[17,23]]),water:panes([[27.4,30.7],[31.4,39],[40,47],[48,51.7]],[[31,38]]),rain:kitchen,window:true},
    underwater:{water:panes([[27.4,30.7],[31.4,39],[40,47],[48,51.7]],[[6.3,11]]),window:true},
    'deep-water':{water:shape(0,0,100,0,100,17,77,23,58,20,41,24,25,21,13,25,0,21)},
    hall:{sky:panes([[6.5,12.7],[15.8,19.4]],[[20,29],[31,35]]),rain:gallery,water:panes([[6,12.8],[16,20.6],[27,31.5]],[[55.8,57.5]]),window:true},
    dryhall:{sky:panes([[6.5,12.7],[15.8,19.4]],[[20,29],[31,35]]),water:panes([[6,12.8],[16,20.6],[27,31.5]],[[55.8,57.5]]),window:true},
    archive:{sky:filesWindow,rain:filesWindow,water:panes([[42.2,59],[61.1,65.8]],[[51.1,54.3]]),window:true},
    exchange:{sky:backOffice,rain:backOffice,window:true},
    nursery:{sky:panes([[8.5,23.1],[25.1,39.3]],[[28.5,35.7]]),rain:panes([[8.5,23.1],[25.1,39.3]],[[29,46.5]]),water:panes([[9,22.8],[32.5,39.2]],[[44.5,47.2]]),window:true},
    returns:{sky:rect(76.2,32,89,39),rain:rect(76.1,33.5,91.2,48.9),water:rect(76.2,50,89,53.8),window:true},
    'waiting-room':{
      sky:panes([[20.3,27.7],[28.8,36.5],[37.6,44.9]],[[17.3,26.6],[28.1,31.1]]),
      rain:panes([[20.3,27.7],[28.8,36.5],[37.6,44.9]],[[17.3,26.6],[28.1,41.7],[43.1,50.8]]),
      water:panes([[20.4,27.6],[28.8,36.5],[37.6,44.9]],[[43.2,50.7]]),window:true
    },
    'lost-office':{
      sky:panes([[80.8,85.1],[86.4,92],[93.1,97.7]],[[10.5,15.4]]),
      rain:panes([[80.8,85.1],[86.4,92],[93.1,97.7]],[[10.5,15.8],[17.2,23.5]]),
      water:panes([[81,82.7],[87.1,89.3],[90.2,91.2]],[[22.6,23.4]]),window:true
    },
    tower:{sky:lightRoom,rain:lightRoom,window:true},
    'tower-stairs':{rain:panes([[51.8,54.5],[55.2,57.3]],[[39.3,41.7],[42.6,46.2]]),window:true},
    'end-home':{rain:panes([[35.2,39.8],[41.1,47.7],[49.6,60.9]],[[13,21.8],[24,51.8]]),water:panes([[35.8,39.8],[41,47.7],[49.8,60.6]],[[43,51.8]]),window:true},
    'end-aunt':{sky:panes([[28.5,56.5],[60.8,72]],[[15.5,26.5]]),rain:panes([[7.9,26.7],[30.4,56.7],[61.1,72.8]],[[18,43.2]]),water:panes([[31,56.7],[61.2,72.8]],[[43.3,52.5]]),window:true},
    'end-city':{rain:panes([[77.3,83.8],[85.5,93]],[[15,29],[32,43]]),window:true}
  };
  // One crest hits, fans out across the actual shore, then thins into rivulets.
  const imgCache=new Map();
  function image(key){
    if(!imgCache.has(key)){const im=new Image();im.src=artUrl(key);imgCache.set(key,im);}
    return imgCache.get(key);
  }
  const clamp=x=>Math.min(1,Math.max(0,x));
  const smooth=x=>{const v=clamp(x);return v*v*(3-2*v);};
  function breaker(ctx,t,site,seed){
    const [x,y,width,rise,reach]=site,phase=t/5.2;
    if(phase<0||phase>=1)return;
    const crest=image('surf-crest'),wash=image('surf-wash');
    if(!crest.naturalWidth||!wash.naturalWidth)return;
    ctx.save();ctx.translate(x,y);
    const impact=Math.sin(Math.PI*clamp(phase/.46))**.83;
    if(impact>.01){
      const w=width*(.54+.52*smooth(phase/.38));
      ctx.save();if(seed%2)ctx.scale(-1,1);
      ctx.globalAlpha=(.65+.26*impact)*smooth(phase/.055)*(1-smooth((phase-.32)/.16));
      ctx.drawImage(crest,-w*.5,-rise*impact,w,rise*impact+.4);ctx.restore();
    }
    if(phase>.10){
      const run=smooth((phase-.1)/.35)*(1-.77*smooth((phase-.52)/.48));
      const depth=reach*run, w=width*(.62+.62*run);
      ctx.globalAlpha=.83*smooth((phase-.10)/.12)*(1-smooth((phase-.65)/.35));
      ctx.drawImage(wash,-w*.5,-.6,w,depth+.8);
    }
    ctx.restore();
  }
  function front(time,sites){
    const cycle=Math.floor((time+4.8)/7.4),age=(time+4.8)%7.4-1.7;
    return {age,cycle,site:sites[cycle%sites.length]};
  }
  function inSurf(time,x){
    const wave=front(time,quay.strikes);
    return wave.age>.25&&wave.age<2.4&&Math.abs(x-wave.site[0])<wave.site[2]*.61;
  }
  function grilleLevel(){
    const {age}=front(time,profiles.culvert.strikes);
    return smooth((age+.55)/1.55)*(1-smooth((age-2)/2.35));
  }
  // The grille close-up is a crop of the actual masonry. Reflect that same
  // crop in the rising water so the lamp and the jamb stay in place.
  function paintGrilleWater(canvas,level,still){
    const scene=image('culvert'),sea=image('harbor');
    if(!scene.naturalWidth||!sea.naturalWidth)return;
    const w=Math.round(canvas.clientWidth*Math.min(devicePixelRatio,1.5)),h=Math.round(w*9/16);
    if(!w||!h)return;
    const key=still?String(level):Math.floor(time*20);
    if(canvas.width===w&&canvas.height===h&&canvas.lastSurface===key)return;
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    canvas.lastSurface=key;
    const ctx=canvas.getContext('2d'),t=still?0:time,waterY=(.76-.18*level)*h;
    ctx.clearRect(0,0,w,h);
    ctx.save();ctx.beginPath();ctx.moveTo(0,h);
    for(let x=0;x<=w+6;x+=6){
      const v=x/w;
      ctx.lineTo(x,waterY+h*(.035*(1-v)-.014*Math.sin(Math.PI*v))+
        h*(.002*Math.sin(v*38+t*2.8)+.0015*Math.sin(v*91-t*1.4)));
    }
    ctx.lineTo(w,h);ctx.closePath();ctx.clip();
    const sw=scene.naturalWidth,sh=scene.naturalHeight,strip=Math.max(2,Math.round(h/95));
    ctx.fillStyle='rgba(12,12,12,.46)';ctx.fillRect(0,0,w,h);
    ctx.globalAlpha=.54;
    for(let y=Math.max(0,Math.floor(waterY-h*.025));y<h;y+=strip){
      const depth=(y-waterY)/h;
      const ripple=Math.sin(depth*93-t*1.8)+.53*Math.sin(depth*143+t*1.2);
      const sy=(.44+(.76-.18*level-depth*.77)*.37)*sh+ripple*.9;
      ctx.drawImage(scene,(.60+ripple*.002)*sw,sy,.37*sw,Math.max(1,strip*.37*sh/h),0,y,w,strip+.3);
    }
    ctx.globalCompositeOperation='screen';ctx.globalAlpha=.34;
    ctx.drawImage(sea,sea.naturalWidth*.045,sea.naturalHeight*(.785+.003*Math.sin(t)),sea.naturalWidth*.44,sea.naturalHeight*.10,0,waterY-h*.03,w,h-waterY+h*.03);
    ctx.restore();
  }
  const drops=Array.from({length:380},(_,i)=>{
    const n=k=>{const f=Math.sin((i+1)*k)*43758.5453;return f-Math.floor(f);};
    return [n(12.8),n(78.2),n(52.7)];
  });
  const compiled=new Map();
  function paths(key){
    if(compiled.has(key))return compiled.get(key);
    const spec=profiles[key],out={};
    for(const name of ['sky','rain','water','puddles'])if(spec[name])out[name]=new Path2D(spec[name]);
    compiled.set(key,out);return out;
  }
  function layer(path,source,w,h,existing){
    const tile=existing||document.createElement('canvas');
    if(!existing){tile.width=w;tile.height=h;}
    const pen=tile.getContext('2d');pen.save();pen.setTransform(w/100,0,0,h/100,0,0);pen.clip(path);
    pen.drawImage(source,0,0,100,100);pen.restore();return tile;
  }
  const slots=new Map();
  function mount(canvas,key,audible=false,film=null){
    if(!canvas)return;
    if(!profiles[key]){canvas.hidden=true;slots.delete(canvas);return;}
    canvas.hidden=false;
    slots.set(canvas,{key,canvas,source:film||image(key),film,spec:profiles[key],masks:paths(key),audible,ctx:canvas.getContext('2d'),lastBeat:-1,w:0,h:0});
  }
  function paint(slot,time){
    const {canvas,source,spec,masks,ctx}=slot;
    if(!ctx||(slot.film?source.readyState<2:!source.complete||!source.naturalWidth))return;
    const w=Math.min(1500,Math.round(canvas.clientWidth*Math.min(devicePixelRatio,1.45))),h=Math.round(w*canvas.clientHeight/(canvas.clientWidth||1));
    if(!w||!h)return;
    if(w!==slot.w||h!==slot.h){
      canvas.width=slot.w=w;canvas.height=slot.h=h;
      slot.sky=masks.sky&&layer(masks.sky,source,w,h);
      slot.water=masks.water&&layer(masks.water,source,w,h);
      const coords=(spec.water||'').match(/[.\d]+/g)||[];
      const ys=coords.filter((_,i)=>i%2).map(Number);
      slot.waterTop=ys.length?Math.max(0,Math.floor(Math.min(...ys)*h/100)-2):0;
      slot.waterBottom=ys.length?Math.min(h,Math.ceil(Math.max(...ys)*h/100)+2):0;
    }else if(slot.film){
      if(slot.sky)layer(masks.sky,source,w,h,slot.sky);
      if(slot.water)layer(masks.water,source,w,h,slot.water);
    }
    ctx.setTransform(w/100,0,0,h/100,0,0);ctx.clearRect(0,0,100,100);
    if(slot.sky){
      ctx.save();ctx.clip(masks.sky);
      const cycle=(time/(spec.window?19:16))%1, drift=spec.window?2.6:7.2;
      // Crossfade two drifting samples one period apart so the bank never jumps back.
      ctx.drawImage(slot.sky,drift*(cycle-1),-.18*Math.sin(time*.21),100,100);
      ctx.globalAlpha=1-smooth(cycle);ctx.drawImage(slot.sky,drift*cycle,0,100,100);ctx.restore();
    }
    if(slot.water){
      ctx.save();ctx.clip(masks.water);
      const strip=Math.max(2,Math.round(h/135));
      for(let y=slot.waterTop;y<slot.waterBottom;y+=strip){
        const v=y/h,offset=Math.sin(time*1.5-v*52)*.5+Math.sin(time*2.2+v*104)*.28;
        const swell=spec.window?.31:1;
        const sy=Math.max(0,Math.min(h-strip,y+(Math.sin(v*30-time*1.4)+.45*Math.sin(v*67-time*2.1))*h*.004*swell));
        ctx.drawImage(slot.water,0,sy,w,Math.min(strip,h-sy),offset*swell,(v*100),100,strip/h*100+.07);
      }
      ctx.restore();
    }
    if(masks.rain){
      ctx.save();ctx.clip(masks.rain);ctx.beginPath();
      const wind=spec.window?.78:1.2+.28*Math.sin(time*.63);
      for(const [u,v,z] of drops){
        const yy=(v*108+time*(64+66*z))%108-4;
        const xx=((u*104-yy*.17*wind-time*3)%104+104)%104-2;
        ctx.moveTo(xx,yy);ctx.lineTo(xx-(.16+.35*z)*wind,yy+.8+1.9*z);
      }
      ctx.strokeStyle=spec.window?'rgba(218,218,218,.30)':'rgba(228,228,228,.36)';ctx.lineWidth=.082;ctx.stroke();ctx.restore();
    }
    if(spec.drips){
      ctx.save();ctx.strokeStyle='#d4d4d480';ctx.lineWidth=.08;
      for(const [x,ceiling,floor,delay] of [[60,13,81,.6],[85,39,73,2.2],[20,36,92,4.1]]){
        const p=(time+delay)%3.8;
        ctx.beginPath();
        if(p<.8){const y=ceiling+(floor-ceiling)*(p/.8)**2;ctx.moveTo(x,y);ctx.lineTo(x,y+.85);}
        else if(p<1.45){const ring=(p-.8)/.65;ctx.globalAlpha=1-ring;ctx.ellipse(x,floor,ring*1.2+.04,ring*.28+.015,0,0,Math.PI*2);}
        ctx.stroke();ctx.globalAlpha=1;
      }ctx.restore();
    }
    if(masks.puddles){
      ctx.save();ctx.clip(masks.puddles);ctx.strokeStyle='#dadada66';ctx.lineWidth=.075;
      for(let i=0;i<34;i++){const [x,y,z]=drops[i];const age=(time*1.7+z*7)%1;
        ctx.globalAlpha=1-age;ctx.beginPath();ctx.ellipse(x*100,74+y*6,.06+.62*age,.035+.12*age,0,0,Math.PI*2);ctx.stroke();}
      ctx.restore();
    }
    if(spec.strikes){
      const wave=front(time,spec.strikes);
      breaker(ctx,wave.age,wave.site,wave.cycle);
      if(slot.audible&&wave.cycle!==slot.lastBeat&&wave.age>.52&&wave.age<1.2){
        harborSound.cue(spec.drips?'tunnel-surge':'surf-impact',wave.site[0]);slot.lastBeat=wave.cycle;
      }
    }
  }
  const motion=matchMedia('(prefers-reduced-motion: reduce)');
  let time=0,last=0;
  function run(now){
    if(document.hidden){last=0;return;}
    const elapsed=last?(now-last)/1000:0;if(last&&elapsed<1/26)return;
    const modal=document.getElementById('chapter-film').open?document.getElementById('chapter-film'):document.getElementById('panel').open?document.getElementById('panel'):null;
    const active=[];
    for(const [canvas,slot] of slots){
      if(!canvas.isConnected){slots.delete(canvas);continue;}
      if((!modal||modal.contains(canvas))&&(!motion.matches||slot.key==='culvert'))active.push(slot);
    }
    if(!active.length){last=0;return;}
    time+=Math.min(elapsed,.08);last=now;
    for(const slot of active){
      if(!motion.matches)paint(slot,time);
      slot.onFrame?.();
    }
  }
  let detailFrame=0;
  function animateArchive(now){
    detailFrame=0;
    if(playing||motion.matches||!document.getElementById('panel').open||!slots.size)return;
    run(now);detailFrame=requestAnimationFrame(animateArchive);
  }
  motion.addEventListener('change',()=>{
    if(motion.matches)for(const {ctx,canvas} of slots.values())ctx?.clearRect(0,0,canvas.width,canvas.height);
    else if(!playing&&!detailFrame&&slots.size)detailFrame=requestAnimationFrame(animateArchive);
    last=0;
  });
  function scene(key){mount(document.getElementById('field-weather'),key,true);last=0;}
  function detail(host,key,onFrame){
    if(!host)return;
    const canvas=document.createElement('canvas');canvas.className='coast-layer';canvas.setAttribute('aria-hidden','true');host.prepend(canvas);mount(canvas,key);
    if(onFrame&&slots.has(canvas))slots.get(canvas).onFrame=onFrame;
    if(!playing&&!detailFrame&&!motion.matches)detailFrame=requestAnimationFrame(animateArchive);
  }
  function film(key,video){
    const c=document.getElementById('film-weather');
    const names={crossing:'film-crossing',watch:'film-watch',tower0:'film-tower',door:'hall',home:'end-home',aunt:'end-aunt',city:'end-city',receipt:'returns'};
    mount(c,names[key],false,video);
    if(c.hidden)return;
    const ratio=Math.min(video.clientWidth/video.videoWidth,video.clientHeight/video.videoHeight);
    c.style.width=(video.videoWidth*ratio)+'px';c.style.height=(video.videoHeight*ratio)+'px';
  }
  function clearDetails(){
    if(document.querySelector('#panel .tide-grille'))harborSound.grilleWater(null);
    cancelAnimationFrame(detailFrame);detailFrame=0;
    for(const c of slots.keys())if(c.id!=='field-weather'&&c.id!=='film-weather')slots.delete(c);
  }
  return {scene,detail,film,clearDetails,run,breaker,grilleLevel,paintGrilleWater,inSurf: x=>!motion.matches&&inSurf(time,x),get time(){return time;}};
})();
