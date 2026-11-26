'use strict';

// Layers use the coordinates of the illustrated plate so a crop never moves the lamp off its tower.
(() => {
  const canvas=document.querySelector('#harbor-weather'), ctx=canvas.getContext('2d');
  if(!ctx)return;
  const W=1674,H=941, lamp=[1356,82];
  const plate=new Image(), motion=matchMedia('(prefers-reduced-motion: reduce)');
  const water=new Path2D('M0 694 L474 702 580 718 1150 720 1141 759 1046 806 726 853 545 898 325 941 0 941Z');
  const ships=[
    new Path2D('M623 645 L642 638 684 545 693 604 751 606 786 543 782 606 807 626 821 646 806 698 779 711 649 704Z'),
    new Path2D('M825 633 L848 630 894 546 897 607 929 601 980 577 1007 586 1009 604 1055 607 1066 644 1043 697 1016 711 863 710Z')
  ];
  const hero=canvas.closest('.hero');
  const cloudFrame=document.createElement('canvas');
  // In plate coordinates, trace the open sky to the left of the lamp,
  // ridge, aerials and boat masts. The original skyline stays in registration.
  const skyLimit=[[0,1310],[120,1300],[196,1245],[245,1193],[292,1135],
    [345,1080],[371,998],[405,978],[446,825],[493,777],[540,688],
    [578,543],[627,461],[650,360],[681,229],[695,0]];
  cloudFrame.width=W;cloudFrame.height=695;
  const cloudCtx=cloudFrame.getContext('2d');
  const skyMatte=document.createElement('canvas');
  skyMatte.width=W;skyMatte.height=cloudFrame.height;
  let ready=false;
  function drawClouds(){
    if(motion.matches)return;
    // Two overlapping passes of the same print carry the cloud bank downwind.
    // The returning pass is invisible at the loop boundary.
    const phase=(time/13)%1,other=(phase+.5)%1;
    const weight=(1-Math.cos(phase*2*Math.PI))*.5;
    cloudCtx.globalCompositeOperation='source-over';
    cloudCtx.globalAlpha=1;
    cloudCtx.clearRect(0,0,W,cloudFrame.height);
    cloudCtx.drawImage(plate,(other-.5)*78,0,W,H);
    cloudCtx.globalAlpha=weight;
    cloudCtx.drawImage(plate,(phase-.5)*78,0,W,H);
    cloudCtx.globalAlpha=1;
    cloudCtx.globalCompositeOperation='destination-in';
    cloudCtx.drawImage(skyMatte,0,0);
    ctx.drawImage(cloudFrame,0,0);
  }
  const drops=Array.from({length:250},()=>[Math.random(),Math.random(),Math.random()]);
  let frame=0,last=0,time=0,inView=false,nextBolt=4,boltAt=-99,thunderAt=Infinity,bolt;
  function flash(){
    boltAt=time;nextBolt=time+9+Math.random()*7;thunderAt=time+1.6;
    const start=960+Math.random()*160;
    let x=start,y=70;
    bolt=new Path2D();bolt.moveTo(x,y);
    for(let i=0;i<17;i++){
      const prevX=x,prevY=y;
      x+=(Math.random()-.60)*65;y+=12+Math.random()*14;bolt.lineTo(x,y);
      if(i===4||i===8||i===11){
        const dir=i===8?-1:1;
        let bx=prevX,by=prevY;bolt.moveTo(bx,by);
        for(let k=0;k<5;k++){bx+=dir*(8+Math.random()*16);by+=6+Math.random()*14;bolt.lineTo(bx,by);}
        bolt.moveTo(x,y);
      }
    }
  }
  function draw(){
    const w=canvas.width,h=canvas.height,s=Math.max(w/W,h/H);
    const anchor=w/h<1.4?.91:.5;
    ctx.setTransform(s,0,0,s,(w-W*s)*anchor,(h-H*s)*.14);
    ctx.drawImage(plate,0,0,W,H);
    drawClouds();
    ships.forEach((outline,i)=>{
      ctx.save();ctx.clip(outline);
      ctx.drawImage(plate,Math.sin(time*1.25+i)*1.8,Math.sin(time*1.7+i*2)*3.2,W,H);ctx.restore();
    });
    ctx.save();ctx.clip(water);
    for(let y=691;y<H;y+=4){
      const near=(y-690)/251;
      ctx.drawImage(plate,0,y*plate.height/H,plate.width,4*plate.height/H,Math.sin(y*.10+time*2.4)*(1+near*6),y, W,4.2);
    }
    ctx.restore();
    if(!motion.matches){
      ctx.save();ctx.scale(W/100,H/100);ctx.translate(66.8,94.6);ctx.rotate(-.34);
      coastWeather.breaker(ctx,(time+3)%8.2-1,[0,0,18,4.8,4.4],Math.floor((time+3)/8.2));
      ctx.restore();
    }
    // Horizontal rotation seen in projection: foreshortening and fading on the seaward half-turn.
    const a=time*.67+Math.PI*.95,side=Math.cos(a),depth=Math.sin(a);
    const [x,y]=lamp,dx=side*1390,dy=87+depth*140,spread=15+85*Math.abs(side);
    const beam=ctx.createLinearGradient(x,y,x+dx,y+dy);
    beam.addColorStop(0,'rgba(255,255,255,.83)');beam.addColorStop(.45,'rgba(250,250,250,.30)');beam.addColorStop(1,'rgba(245,245,245,0)');
    ctx.save();ctx.globalAlpha=.14+.83*(1+depth)/2;ctx.fillStyle=beam;ctx.beginPath();
    ctx.moveTo(x,y-4);ctx.lineTo(x+dx,y+dy-spread);ctx.lineTo(x+dx,y+dy+spread);ctx.lineTo(x,y+4);ctx.fill();ctx.restore();
    const glow=ctx.createRadialGradient(x,y,1,x,y,26+13*Math.max(0,depth));glow.addColorStop(0,'#ffffff');glow.addColorStop(.2,'#ffffff84');glow.addColorStop(1,'#ffffff00');
    ctx.fillStyle=glow;ctx.fillRect(x-40,y-40,80,80);
    const illumination = angle => motion.matches ? 0 : Math.max(0, Math.sin(angle)) ** 4;
    const exposure = illumination(a);
    hero.style.setProperty('--lens', exposure.toFixed(4));
    // Sample opposite ends of the title at slightly different beam angles.
    const ink = light => {
      const gray = Math.round(238 - 215 * light);
      return `rgb(${gray} ${gray} ${gray})`;
    };
    hero.style.setProperty('--ink-left', ink(illumination(a - .09)));
    hero.style.setProperty('--ink-right', ink(illumination(a + .09)));
    if(exposure>.01){
      ctx.save();ctx.globalAlpha=exposure;
      const bloom=ctx.createRadialGradient(x,y,4,x,y,410);
      bloom.addColorStop(0,'#fff');bloom.addColorStop(.08,'#ffffffc4');bloom.addColorStop(.35,'#ffffff56');bloom.addColorStop(1,'#ffffff00');
      ctx.fillStyle=bloom;ctx.fillRect(x-410,y-410,820,820);
      ctx.restore();
    }
    if(motion.matches)return;
    if(time>=nextBolt)flash();
    const age=time-boltAt;
    if(age<.82){
      const brightness=Math.sin(Math.min(1,age/.12)*Math.PI/2)*Math.exp(-age*4);
      const cloud=ctx.createRadialGradient(930,235,8,930,235,550);
      cloud.addColorStop(0,'rgba(255,255,255,'+(.42*brightness)+')');cloud.addColorStop(1,'#ffffff00');
      ctx.fillStyle=cloud;ctx.fillRect(340,-315,1150,980);
      if(age>.055){
        ctx.save();ctx.lineJoin='round';ctx.globalAlpha=Math.min(1,Math.exp(-Math.max(0,age-.30)*5));
        ctx.strokeStyle='#efefef55';ctx.lineWidth=8;ctx.stroke(bolt);
        ctx.strokeStyle='#ffffff';ctx.lineWidth=2.8;ctx.stroke(bolt);ctx.restore();
      }
    }
    if(time>=thunderAt){thunderAt=Infinity;harborSound.cue('thunder');}
    ctx.beginPath();
    for(const [u,v,z] of drops){
      const yy=(v*H+time*(470+430*z))%(H+45)-45,xx=((u*W-yy*.22-time*31)%W+W)%W;
      ctx.moveTo(xx,yy);ctx.lineTo(xx-4-z*5,yy+15+z*16);
    }
    ctx.strokeStyle='rgba(238,238,238,.25)';ctx.lineWidth=1.2;ctx.stroke();
  }
  function tick(now){
    frame=0;
    if(now-last>=33){time+=last?Math.min(.12,(now-last)/1000):0;last=now;draw();}
    frame=requestAnimationFrame(tick);
  }
  function sync(){
    cancelAnimationFrame(frame);last=0;
    if(!ready||!plate.naturalWidth||document.hidden||!inView)return;
    const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;
    const ratio=Math.min(devicePixelRatio,1.5,1700/r.width);
    canvas.width=Math.round(r.width*ratio);canvas.height=Math.round(r.height*ratio);
    draw();if(!motion.matches)frame=requestAnimationFrame(tick);
  }
  plate.onload=()=>{
    const pen=skyMatte.getContext('2d'),mask=pen.createImageData(W,skyMatte.height);
    let section=0;
    const ease=v=>{v=Math.max(0,Math.min(1,v));return v*v*(3-2*v);};
    for(let y=0;y<mask.height;y++){
      while(skyLimit[section+1][0]<=y)section++;
      const [top,right]=skyLimit[section],[bottom,left]=skyLimit[section+1];
      const edge=right+(left-right)*(y-top)/(bottom-top);
      for(let x=0;x<edge;x++){
        mask.data[(y*W+x)*4+3]=255*ease((edge-x-42)/100)*ease((x-40)/65)*ease((mask.height-y)/75);
      }
    }
    pen.putImageData(mask,0,0);ready=true;
    sync();
  };
  plate.src=artUrl('harbor');
  new IntersectionObserver(([entry])=>{inView=entry.isIntersecting;sync();}).observe(canvas);
  new ResizeObserver(sync).observe(canvas);
  document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);
})();
