'use strict';

// The desk only deals with the 1998 crossing. Tonight's ferry manifest is separate.
const lostProperty=(()=>{
  const items=[
    {name:'旧哨子',id:'whistle',x:17,front:'吹嘴瘪了一边，缠过绳子的地方留着白印。',back:'纸边剪得很齐。左上只有一个针眼。',mismatch:'只有左边透光。哨子的吊牌没有被撕过。'},
    {name:'针线包',id:'sewing',x:50,front:'线轴还绕着半圈黑线。里衬有一角缝得格外松。',back:'吊牌的边上撕掉了一个小三角。两处针眼，一高一低。',mismatch:''},
    {name:'钥匙套',id:'keys',x:83,front:'钥匙齿磨得发亮，套口的线已经脱开。',back:'两枚针眼并排扎在同一条线上。纸角缺的是一个方口。',mismatch:'左边的孔透光了，右边还压着纸。钥匙套的两个孔是平的。'}
  ];
  const machineNumbers=()=>state.flags.oldRollCorrected?[16,18]:[16,17,18];
  const nextNumber=n=>{const order=machineNumbers();return order[(order.indexOf(n)+1)%order.length];};

  // This image is mounted behind the real painted glazing, at the same scale
  // in the walkable room and in the view from the chair. CSS clips the mullions.
  function glazing(){
    const glass=document.createElement('div');glass.className='dock-glazing';glass.setAttribute('aria-hidden','true');
    const figure=new Image();figure.src=artUrl('queue-caller');figure.alt='';figure.className='dock-glass-figure';glass.append(figure);
    return glass;
  }
  function setVisitor(element,phase){element.dataset.visitor=phase;}
  function seatNumbers(){
    const marks=document.createElement('div');marks.className='dock-seat-numbers';marks.setAttribute('aria-hidden','true');
    for(const [number,x] of [[16,22.8],[17,37.4],[18,52.3]]){
      const ink=document.createElement('b');ink.textContent=String(number);ink.style.left=x+'%';marks.append(ink);
    }
    return marks;
  }
  let field=null, fieldLast=0, fieldAge=0, fieldNumber=16, fieldAnswered=false,nextLook=0,visibleBenchClock=null;
  document.addEventListener('visibilitychange',()=>{fieldLast=0;visibleBenchClock?.();});
  function scene(){
    field=null;fieldLast=0;fieldAge=0;fieldNumber=16;fieldAnswered=false;nextLook=0;
    if(state.room!=='waitingRoom')return;
    field=glazing();field.classList.add('dock-field-glass');$('figures').append(seatNumbers(),field);
    setVisitor(field,state.flags.oldRollCorrected?'gone':'far');
  }
  function tick(now){
    if(!field||state.room!=='waitingRoom'||!field.isConnected)return;
    if(document.hidden||panel.open||$('chapter-film').open){fieldLast=0;return;}
    if(fieldLast)fieldAge+=Math.max(0,now-fieldLast);
    fieldLast=now;
    if(fieldAge>=8300){
      fieldNumber=nextNumber(fieldNumber);fieldAge=0;fieldAnswered=false;
      harborSound.cue('dock-call',fieldNumber);
      setVisitor(field,fieldNumber===17?'lean':state.flags.oldRollCorrected?'gone':'far');
    }
    if(fieldNumber===17&&!fieldAnswered&&fieldAge>=1350){
      fieldAnswered=true;setVisitor(field,'near');harborSound.cue('dock-answer');
      if(harborSound.enabled&&!state.flags.heardProxy)mark('heardProxy');
    }
    if(field.dataset.visitor==='near'&&!state.flags.sawQueueCaller&&now>=nextLook){
      nextLook=now+120;
      const body=field.querySelector('img').getBoundingClientRect(),view=$('viewport').getBoundingClientRect();
      const faceX=body.left+body.width*.5,faceY=body.top+body.height*.19;
      if(faceX>view.left&&faceX<view.right&&faceY>view.top&&faceY<view.bottom)mark('heardProxy','sawQueueCaller');
    }
    if(fieldNumber===17&&fieldAnswered&&fieldAge>=3850&&field.dataset.visitor==='near')setVisitor(field,'far');
  }

  function paperFace(style,html){
    return '<div class="dock-paper '+style+'"><span class="dock-print">'+html+'</span></div>';
  }
  function bench(){
    let number=16,age=0,last=null,timer=0,answered=false,open=false,gripped=false,drag=null,skipClick=false;
    const corrected=!!state.flags.oldRollCorrected;
    sheet('1998','十七号椅底',
      '<div class="dock-bench-view"><div class="dock-bench-room"></div><div class="dock-seat-edge" aria-hidden="true"><i></i></div>'+
      '<div class="dock-machine"><div class="dock-meter" aria-hidden="true"><i></i><b>16</b></div><button id="dock-lever" aria-label="扳动叫号柄"><i></i></button></div>'+
      '<button class="dock-ticket-tip" id="dock-ticket-tip" aria-label="捏住椅底的纸角"><i>17</i></button></div>'+
      '<p class="dock-feedback" role="status"></p><div class="dock-tools"></div>',[],()=>{stopClock();closePanel();});
    panel.classList.add('dock-dialog');
    const view=inner.querySelector('.dock-bench-view'),glass=glazing(),note=inner.querySelector('.dock-feedback');
    const roomView=view.querySelector('.dock-bench-room');
    roomView.append(seatNumbers(),glass);coastWeather.detail(roomView,'waiting-room');setVisitor(glass,corrected?'gone':'far');
    const tip=$('dock-ticket-tip'),meter=view.querySelector('.dock-meter b'),tools=inner.querySelector('.dock-tools');
    const collected=()=>!!state.flags.benchStub;
    const initialNote=corrected?'十六号过后，滚筒上直接翻出十八号。窗台的水印干了。':collected()?'座面已经空了。叫号柄还连着那根细钢丝。':'椅底夹着一角纸。十七号座面和叫号柄之间，绷着一根细钢丝。';
    note.textContent=initialNote;
    const call=button('扳动叫号柄',ring);
    const pull=button('慢慢抽出票根',drawTicket,'accent');
    const review=button('翻看票根',()=>{stopClock();stub();});
    tools.append(call,pull,review);
    function update(){
      view.dataset.gripped=String(gripped);view.dataset.open=String(open);
      tip.hidden=collected()||corrected;pull.hidden=!gripped||collected();review.hidden=!collected()&&!corrected;
    }
    function ring(){
      if(number===17&&!open){note.textContent=answered?'湿指头还压着玻璃。':'扳手已经到底。喇叭还没叫完。';return;}
      stopClock();number=nextNumber(number);age=0;answered=false;open=false;gripped=false;
      meter.textContent=String(number);view.dataset.call=String(number);
      harborSound.cue('dock-call',number);
      setVisitor(glass,number===17?'lean':corrected?'gone':'far');
      note.textContent=number===17?'十七号。钢丝一松，座面抬了半寸。':number===18?
        (corrected?'十八号。十七号被跳过去了。玻璃那边没有人答。':'十八号。座面压下去，纸边又被夹紧了。'):'十六号。房间里只有喇叭自己的回音。';
      update();
      if(number===17){visibleBenchClock=beat;beat();}
    }
    function grip(){
      if(collected()||corrected)return;
      if(number!==17){note.textContent='椅铰咬住了纸。十七号的号牌和那根钢丝一起颤了颤。';harborSound.cue('plate-flex');return;}
      if(!open){
        note.textContent='纸朝窗子那头扯了一下。你松开手，五个湿指印按上了玻璃。';
        harborSound.cue('dock-glass');view.classList.remove('tugged');void view.offsetWidth;view.classList.add('tugged');
        gripped=false;update();return;
      }
      gripped=true;note.textContent='纸角落进指尖。椅铰已经松了。';harborSound.cue('dock-fabric');update();
    }
    function drawTicket(){
      if(!gripped||!open||collected())return;
      stopClock();mark('benchStub');harborSound.cue('page');stub();
    }
    $('dock-lever').onclick=ring;
    tip.onpointerdown=e=>{
      if(e.button!==0)return;
      drag={id:e.pointerId,y:e.clientY,x:e.clientX,moved:false};skipClick=false;tip.setPointerCapture(e.pointerId);
    };
    tip.onpointermove=e=>{
      if(!drag||drag.id!==e.pointerId)return;
      const travel=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);
      if(travel>6&&!drag.moved){drag.moved=true;grip();}
      if(gripped)tip.style.setProperty('--pull',Math.min(22,travel*.35)+'px');
    };
    tip.onpointerup=e=>{
      if(!drag||drag.id!==e.pointerId)return;
      const moved=drag.moved,travel=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);
      drag=null;tip.style.removeProperty('--pull');skipClick=moved;
      if(moved&&travel>=18&&gripped)drawTicket();
    };
    tip.onlostpointercapture=tip.onpointercancel=()=>{drag=null;tip.style.removeProperty('--pull');};
    tip.onclick=e=>{if(!skipClick||e.detail===0)grip();skipClick=false;};
    function stopClock(){
      clearTimeout(timer);last=null;
      if(visibleBenchClock===beat)visibleBenchClock=null;
    }
    // The voice is real-time audio. Schedule its two visible beats independently
    // of frame rate, pausing the clock whenever the page is put away.
    function beat(){
      clearTimeout(timer);
      if(!view.isConnected||!panel.open||number!==17){stopClock();return;}
      const now=performance.now();
      if(last!==null)age+=Math.max(0,now-last);
      last=document.hidden?null:now;
      if(!document.hidden){
        if(!answered&&age>=1320){
          answered=true;setVisitor(glass,'near');harborSound.cue('dock-answer');
          if(!state.flags.heardProxy||!state.flags.sawQueueCaller)mark('heardProxy','sawQueueCaller');
          note.textContent='喇叭停了。窗外又有一声“到”。湿玻璃贴上了一只袖口。';
        }
        if(!open&&age>=3850){
          open=true;setVisitor(glass,'far');update();
          note.textContent=collected()?'窗后的人又退回暗处。十七号椅仍旧空着。':'窗上的袖口慢慢退开。座面还抬着，票角垂下来了。';
        }
        if(!open)timer=setTimeout(beat,Math.max(4,(answered?3850:1320)-age));
        else stopClock();
      }
    }
    update();
  }
  function stub(){
    const face=paperFace('dock-stub-print dock-tag-sewing','<small>海城轮渡 · 候船联</small><b>17</b><span>1998</span><i class="dock-punch-ring"></i>');
    sheet('1998','旧候船票根','<div class="dock-evidence-stage">'+face+'</div><p class="dock-feedback">十七号，撕边有一高一低两个针眼。该打登船孔的圆圈，还是整的。</p>',[['翻回椅底',bench],['收进笔记',closePanel,true]]);
    panel.classList.add('dock-dialog');
  }

  function shelf(){
    sheet('1998','柜台上的失物','<div class="dock-tray" role="group" aria-label="三件失物"></div><p class="dock-feedback">柜员早下班了。旧哨子、针线包、钥匙套，各拴着一张没写名字的吊牌。</p>');
    panel.classList.add('dock-dialog');
    const tray=inner.querySelector('.dock-tray');
    for(const [i,item] of items.entries()){
      const hit=button('',()=>inspectItem(i),'dock-tray-item');hit.id='dock-item-'+item.id;
      hit.setAttribute('aria-label',item.name);hit.title=item.name;
      const label=document.createElement('span');label.textContent=item.name;hit.append(label);
      hit.style.left=item.x+'%';tray.append(hit);
    }
  }
  function inspectItem(i,flipped=false){
    const item=items[i];
    if(item.id==='sewing'&&state.flags.unclaimedName){receipt();return;}
    if(item.id==='sewing'&&state.flags.pairedDockTag){lining();return;}
    const info=flipped?item.back:item.front;
    const actions=flipped?state.flags.benchStub?[['把票根叠上去',()=>match(i),true],['换一件',shelf]]:[['照一照吊牌',()=>inspectAlone(i)],['换一件',shelf]]:[['翻开吊牌',()=>turn(),true],['换一件',shelf]];
    sheet('1998',item.name,'<div class="dock-item-study dock-item-'+item.id+'">'+(flipped?paperFace('dock-inspected-tag dock-tag-'+item.id,'<small>本岸失物</small><span>1998</span>'):'')+'</div><p class="dock-feedback" role="status">'+info+'</p>',actions);
    panel.classList.add('dock-dialog');
    function turn(){harborSound.cue(item.id==='keys'?'keys':'dock-fabric');inspectItem(i,true);}
    const study=inner.querySelector('.dock-item-study');
    const physical=button('',()=>flipped?(state.flags.benchStub?match(i):inspectAlone(i)):turn(),'dock-turn-tag');
    physical.setAttribute('aria-label',flipped?'照一照吊牌':'翻开吊牌');study.append(physical);
  }
  function inspectAlone(i){
    const item=items[i];
    sheet('1998',item.name,'<div class="dock-evidence-stage">'+paperFace('dock-isolated-tag dock-tag-'+item.id,'<small>本岸失物</small><span>1998</span>')+'</div><p class="dock-feedback">透过薄纸，能看见另一层纸留下的压痕。留在这里的只有这一联。</p>',[['放回柜台',shelf,true]]);
    panel.classList.add('dock-dialog');
  }
  function match(i){
    const item=items[i];
    const tag=paperFace('dock-pair-base dock-tag-'+item.id,'<small>本岸失物</small><span>1998</span>');
    const slip=paperFace('dock-pair-slip dock-tag-sewing','<small>候船联</small><b>17</b>');
    sheet('1998','透光核对','<div class="dock-light-table">'+tag+slip+'</div>'+
      '<label class="dock-align">推齐纸边<input id="dock-align" type="range" min="0" max="100" value="0"></label>'+
      '<p class="dock-feedback" role="status">值班灯从玻璃底下照上来。你把票根放在吊牌旁边。</p>',[['换一件',shelf]]);
    panel.classList.add('dock-dialog');
    const table=inner.querySelector('.dock-light-table'),range=$('dock-align'),front=table.querySelector('.dock-pair-slip'),note=inner.querySelector('.dock-feedback');
    const peel=button('挑开松线',lining,'accent');peel.hidden=true;inner.querySelector('.panel-actions').prepend(peel);
    let pinned=false,drag=null;
    function align(){
      const amount=Number(range.value);table.style.setProperty('--paper-left',(58-39*amount/100)+'%');
      const paired=amount>=98;
      if(paired&&!pinned){
        pinned=true;
        if(item.id==='sewing'){
          range.value=100;table.style.setProperty('--paper-left','19%');
          table.dataset.fit='yes';range.disabled=true;peel.hidden=false;
          if(!state.flags.pairedDockTag)mark('pairedDockTag');harborSound.cue('dock-paper-pair');
          note.textContent='两点光同时穿过来。撕口也严丝合缝。针线包里衬下，纸响了一声。';
        }else{
          harborSound.cue('page');note.textContent=item.mismatch;
        }
      }else if(!paired&&pinned){pinned=false;note.textContent='你把两层纸稍稍错开。';}
    }
    range.oninput=align;
    front.onpointerdown=e=>{
      if(e.button!==0||range.disabled)return;
      const rect=table.getBoundingClientRect();drag={x:e.clientX,width:rect.width,initial:Number(range.value),id:e.pointerId};
      front.setPointerCapture(e.pointerId);
    };
    front.onpointermove=e=>{
      if(!drag||e.pointerId!==drag.id||range.disabled)return;
      range.value=String(Math.round(drag.initial+(drag.x-e.clientX)/(drag.width*.39)*100));align();
    };
    front.onpointerup=front.onlostpointercapture=front.onpointercancel=()=>{drag=null;};
    range.focus({preventScroll:true});
  }
  function lining(){
    if(!state.flags.pairedDockTag&&!state.flags.unclaimedName){shelf();return;}
    sheet('1998','针线包的里衬','<div class="dock-lining">'+paperFace('dock-letter-corner','<span>21:20</span>')+'</div><p class="dock-feedback">线挑开了，里头藏着一张折得比顶针还小的便笺。上面的墨从另一面透了出来。</p>',[['展开便笺',unfold,true],['放回柜台',shelf]]);
    panel.classList.add('dock-dialog');
    const letter=button('',unfold,'dock-unfold');letter.setAttribute('aria-label','展开便笺');inner.querySelector('.dock-lining').append(letter);
    function unfold(){
      if(!state.flags.unclaimedName)mark('unclaimedName');
      harborSound.cue('dock-fabric');receipt();
    }
  }
  function receipt(){
    const letter='<div class="dock-letter"><div class="dock-letter-head"><span>本岸交存</span><span>1998 · 21:20</span></div><p>囡囡，末班九点开走了。我没上去。你下夜班别往码头跑，妈在厂门口等你。</p><footer>周桂兰</footer></div>';
    sheet('1998','没上船的十七号',letter+'<p class="dock-feedback">'+(state.flags.oldRollCorrected?'那一行已经改过来了。现在船上少的那一个，终于和岸上多的那一个对上了。':'船开后二十分钟，周桂兰还在本岸交寄。票没打孔。那晚替十七号应声的，却被点名簿算上了。')+'</p>',[['放回柜台',shelf],['合上笔记',closePanel,true]]);
    panel.classList.add('dock-dialog');
  }
  return {scene,tick,bench,shelf};
})();
