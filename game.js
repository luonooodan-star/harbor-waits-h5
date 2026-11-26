'use strict';
const $=id=>document.getElementById(id);
const artUrl=name=>window.harborImages?.[name]||'art/'+name+'.webp';
const icon=id=>'<svg aria-hidden="true"><use href="#i-'+id+'"/></svg>';
const button=(label,fn,cls='')=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.className=cls;b.addEventListener('click',fn);return b;};
const saveKey='harbor.welcome.prologue.v1';
const chapterSaveKey='harbor.welcome.archive.trial.v1';
const finaleSaveKey='harbor.welcome.lighthouse.trial.v1';
const returnSaveKey='harbor.welcome.returns.trial.v1';
const sceneSavePrefix='harbor.welcome.scene.v2.';
const oldPreviewKey='harbor.welcome.scene.preview.v1';
let activeSlot=saveKey;
const flagNames=new Set([...Object.keys(clues),'power','table','fish','window','latch','honest','emergency','kin','boarded','auntAsked','crossed','postConversation','glassTurn','threshold','ticketDown','ticketAsked','foundRail','tripSeen','signalAnswered','viaCulvert','shrineReached','stairFirst','stairSecond','stairTop','chairName','chairEchoPending','chairEcho','sawWaitingRoom','sawLostOffice','deliveryStair','heardProxy','sawQueueCaller','pairedDockTag','oldRollCorrected']);
function fresh(){
  return {version:4,films:[],room:'room',flags:{},finished:false,plates:[2,0,1],registration:null,switchboard:{contact:0,probes:0,jacks:[0,0],beat:0,response:null},ending:null,epStep:0};
}
function restoreSwitchboard(raw, s){
  const board=s.switchboard, saved=raw.switchboard;
  if(raw.version===4 && saved && typeof saved==='object'){
    if([0,1,2,3].includes(saved.contact))board.contact=saved.contact;
    if(board.contact===3){
      if(Number.isInteger(saved.probes)&&saved.probes>=0&&saved.probes<=7)board.probes=saved.probes;
      const j=saved.jacks;
      if(Array.isArray(j)&&j.length===2&&j.every(i=>[0,1,2,3].includes(i))&&(!j[0]||j[0]!==j[1]))board.jacks=j.slice();
      if(board.jacks[0]===3&&board.jacks[1]===1&&Number.isInteger(saved.beat)&&saved.beat>=0&&saved.beat<=8){
        board.beat=saved.beat;
        if(['tap','mute'].includes(saved.response))board.response=saved.response;
      }
    }
  } else if(Array.isArray(raw.cords)&&raw.cords.length===2&&raw.cords.every(i=>[null,0,1].includes(i))&&(raw.cords[0]===null||raw.cords[0]!==raw.cords[1])){
    board.jacks=[0,1].map(color=>[3,1][raw.cords.indexOf(color)]||0);
    if(board.jacks.some(Boolean))board.contact=3;
  }
  if(s.flags.wired||board.beat===8){
    s.flags.wired=true;
    Object.assign(board,{contact:3,jacks:[3,1],beat:8});
  }
}
function readSave(slot=saveKey){
  try {
    const raw=JSON.parse(localStorage.getItem(slot));
    if(![1,2,3,4].includes(raw?.version) || !Object.hasOwn(locations,raw.room) || !raw.flags || typeof raw.flags!=='object')return null;
    const s=fresh();
    s.room=raw.room;
    for(const key of ['doorAngle','windowRise','ticketX']){
      if(Number.isFinite(raw[key]))s[key]=Math.max(0,Math.min(100,raw[key]));
    }
    if(raw.room==='hall'&&raw.flags.window)s.flags.threshold=true;
    if(Array.isArray(raw.films))s.films=raw.films.filter(n=>Number.isInteger(n)&&n>=0&&n<10);
    for(const f of flagNames)if(raw.flags[f]===true)s.flags[f]=true;
    if(raw.lastClue&&Object.hasOwn(clues,raw.lastClue)&&s.flags[raw.lastClue]&&raw.clueRoom===s.room){
      s.lastClue=raw.lastClue;s.clueRoom=s.room;
    }
    if(raw.version===1 && raw.finished && s.flags.identity)s.room='archive';
    if(raw.version>=2){
      if(['family','visitor'].includes(raw.registration))s.registration=raw.registration;
      if(!s.registration)delete s.flags.registered;
      const plates=raw.plates;
      if(Array.isArray(plates) && plates.length===3 && new Set(plates).size===3 && plates.every(i=>[0,1,2].includes(i)))s.plates=plates.slice();
    }
    restoreSwitchboard(raw,s);
    if(raw.version>=3){
      if(s.room==='after'){
        if(Object.hasOwn(endings,raw.ending)){
          s.ending=raw.ending;
          s.epStep=Number.isInteger(raw.epStep)?Math.max(0,Math.min(2,raw.epStep)):0;
          s.finished=raw.finished===true && s.epStep===2;
        }else s.room='tower';
      }
    }
    chapterFilms.restore(raw,s);
    return s;
  }catch{return null;}
}
let state=readSave(),playing=false,actorX=23,face=1,walking=false,destination=null,pending=null,held=0,worldWidth=1,camera=0,lastFocus=null;
let frame=0,lastTime=0,stride=0,lastFoot=0,announceTimer,dialogEscape=null,dialogNext=null,pressedWalk=0;
const reduceMotion=matchMedia('(prefers-reduced-motion:reduce)').matches;
const panel=$('panel'),inner=$('panel-inner');
function save(){try{localStorage.setItem(activeSlot,JSON.stringify(state));}catch{announce('此浏览器无法保存进度，本次仍可继续游玩。');}}
function mark(...flags){
  for(const flag of flags){
    if(!state.flags[flag]&&Object.hasOwn(clues,flag)){state.lastClue=flag;state.clueRoom=state.room;}
    state.flags[flag]=true;
  }
  if(flags.includes('sawQueueCaller'))rememberEncounter('queue-caller');
  save();refreshField();
}
function announce(text){$('announce').textContent=text;clearTimeout(announceTimer);announceTimer=setTimeout(()=>$('announce').textContent='',3000);}
function stopWalk(){destination=null;pending=null;held=0;pressedWalk=0;setWalking(false);}
function setWalking(on){walking=on;$('body').classList.toggle('walking',on);if(!on){$('body').style.backgroundPosition='center bottom';stride=0;}}
function showPanel(cls,html,onEscape){
  coastWeather.clearDetails();
  poseSpeaker();stopWalk();dialogNext=null;dialogEscape=onEscape||closePanel;
  if(!panel.open){lastFocus=document.activeElement;panel.showModal();}
  panel.dataset.mode=cls||'sheet';panel.className=cls;inner.innerHTML=html;panel.scrollTop=0;
  const title=inner.querySelector('h2,.speaker');if(title){title.id='modal-title';panel.setAttribute('aria-labelledby','modal-title');}else panel.setAttribute('aria-label','游戏菜单');
}
function focusPanel(){(inner.querySelector('.next,.choice,.accent,.close,button')||panel).focus({preventScroll:true});}
function closePanel(){coastWeather.clearDetails();if($('threshold-view')&&panel.open){save();syncSupperFurniture();harborSound.endDoorway();}harborSound.stopTape();poseSpeaker();dialogNext=null;dialogEscape=null;if(panel.open)panel.close();if(playing)$('viewport').focus({preventScroll:true});else if(lastFocus?.isConnected&&lastFocus.offsetWidth)lastFocus.focus({preventScroll:true});}
function sheet(code,title,html,actions=[],onClose=closePanel){
  showPanel('sheet','<div class="panel-top"><span class="panel-code">'+code+'</span><button class="close" aria-label="关闭">'+icon('close')+'</button></div><h2 class="panel-title">'+title+'</h2>'+html+'<div class="panel-actions"></div>',onClose);
  inner.querySelector('.close').onclick=onClose;
  const box=inner.querySelector('.panel-actions');for(const [label,fn,accent] of actions)box.append(button(label,fn,accent?'accent':''));
  focusPanel();
}
function say(lines,after=closePanel){
  let idx=0;
  function next(){if(++idx===lines.length){closePanel();after();}else draw();}
  function draw(){
    const [speaker,line,fx]=lines[idx];
    showPanel('talk','<h2 class="speaker"></h2><p class="story-line"></p><div class="talk-footer"><span class="line-count"></span><button class="next"></button></div>',next);
    poseSpeaker(speaker);inner.querySelector('.speaker').textContent=speaker;inner.querySelector('.story-line').textContent=line;
    inner.querySelector('.line-count').textContent=String(idx+1).padStart(2,'0')+' / '+String(lines.length).padStart(2,'0');
    const n=inner.querySelector('.next');n.innerHTML=(idx===lines.length-1?'收起':'继续')+' '+icon('right');n.onclick=next;dialogNext=next;
    if(fx)harborSound.cue(fx);focusPanel();
  }
  draw();
}
function choose(speaker,line,options){
  showPanel('talk','<h2 class="speaker"></h2><p class="story-line"></p><div class="choices"></div>');
  poseSpeaker(speaker);inner.querySelector('.speaker').textContent=speaker;inner.querySelector('.story-line').textContent=line;
  options.forEach(([text,fn],i)=>{const b=button('',()=>{closePanel();fn();},'choice');b.innerHTML='<small>0'+(i+1)+'</small>';b.append(document.createTextNode(text));inner.querySelector('.choices').append(b);});focusPanel();
}
panel.addEventListener('cancel',e=>{e.preventDefault();dialogEscape?.();});
panel.addEventListener('click',e=>{if(e.target===panel&&panel.dataset.mode==='sheet'){const r=panel.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialogEscape?.();}});
function showHelp(){sheet('FIELD GUIDE','操作说明',
  '<div class="help-row"><b>点触调查</b><p>点击发亮的菱形，走近并查看。</p></div><div class="help-row"><b>自由移动</b><p>点击地面，或按住左右按钮。</p></div><div class="help-row"><b>键盘</b><p>A / D 移动，E 调查，J 打开笔记，M 打开地图。</p></div><div class="help-row"><b>继续对白</b><p>点击继续，或按空格、回车。</p></div><p class="caption">每次调查后自动保存。右上角可以开启海潮与环境音。</p>',[['知道了',closePanel,true]]);}
// These are the reader's own encounters, shared by playthroughs. Trial presets
// contain story flags for skipped chapters and must never reveal an unseen face.
const fieldNotesKey='harbor.encounters.v1',encounters=new Set();
try{for(const key of JSON.parse(localStorage.getItem(fieldNotesKey))||[])encounters.add(key);}catch{}
function rememberEncounter(key){
  if(encounters.has(key))return;
  encounters.add(key);
  try{const saved=JSON.parse(localStorage.getItem(fieldNotesKey))||[];for(const item of saved)encounters.add(item);localStorage.setItem(fieldNotesKey,JSON.stringify([...encounters]));}catch{}
}
let nextLook=0;
function noticeFigure(now){
  const art=state.room==='causeway'?'anchor':state.room==='stairs'?'keeper':null;
  if(!art||encounters.has(art)||now<nextLook)return;
  nextLook=now+200;
  const figure=$(art==='anchor'?'anchor-hauler':'stair-keeper').getBoundingClientRect();
  const view=$('viewport').getBoundingClientRect(),x=figure.left+figure.width*.5,y=figure.top+figure.height*.4;
  if(x>=view.left&&x<=view.right&&y>=view.top&&y<=view.bottom)rememberEncounter(art);
}
const closedPortraits={anchor:'纸上的拖痕',keeper:'油烟印','queue-caller':'玻璃上的白气'};
function cast(index=0){
  const [art,realName,role,desc]=people[index],anchor=art==='anchor';
  const unknown=Object.hasOwn(closedPortraits,art)&&!encounters.has(art);
  const name=unknown?closedPortraits[art]:realName;
  let line=desc;
  if(anchor)line=unknown?'纸背破了几道口，斜斜地拖向一边。':'旧潜水衣里看不见脸。右手攥着一截锚链。';
  if(art==='keeper')line=unknown?'纸角一抹黑，闻起来有股煤油味。':'那盏灯晃过来时，我才看清灯后面还有个人。';
  if(unknown&&art==='queue-caller')line='一小片纸卷了边，像从湿玻璃上慢慢揭下来的。';
  if(!unknown&&anchor&&encounters.has('iron'))line+=' 我脚下的铁板刚响，它立刻拽紧了链子。';
  if(!unknown&&art==='keeper'&&encounters.has('sweep'))line+=' 灯光擦过我的衣袖，又贴着扶手扫了回去。';
  if(!unknown&&art==='keeper'&&encounters.has('permit'))line+=' 到了值班室门口，它伸手接过我的通行证。';
  const picture=unknown?'<div class="cast-trace '+art+'" aria-hidden="true"><i></i></div>':'<img src="'+artUrl(art)+'" alt="'+name+'">';
  sheet('CHARACTER NOTES','人物手记','<div class="profile">'+picture+'<div><span class="task-label">'+(unknown?'无署名的残页':role)+'</span><h3>'+name+'</h3><p class="panel-text">'+line+'</p></div></div><div class="cast-strip"></div>');
  people.forEach(([key,label],i)=>{
    if(closedPortraits[key]&&!encounters.has(key))label=closedPortraits[key];
    const b=button(label,()=>cast(i),i===index?'on':'');b.setAttribute('aria-pressed',String(i===index));inner.querySelector('.cast-strip').append(b);
  });
}
function worldMap(){openRouteMap();}
function notebookLine(key, line){
  const f=state.flags;
  if(key==='dockNotice'&&f.unclaimedName)return line+' 我在旧渡口找到了十七号。她那天在岸上等女儿。';
  if(key==='unclaimedName'&&f.oldRollCorrected)return line+' 我在灯塔盖下了留岸章，给她留下了名字。';
  if(key==='identity')return f.kin?'小满叫我妈妈。他把手放进了我的掌心。':'小满叫我姐姐。他在应急灯下等我。';
  if(key==='registered')return registrationLine();
  if(key==='pipeScrapes'&&f.chairEcho)return line+' 我的手已经离开椅背了。头顶又拖了一下，跟管子里那声一样长。';
  if(key==='chair'&&f.chairEcho&&!f.pipeScrapes)line+=' 手松开以后，头顶又响了一声。桌上的筷子跳了一下。';
  if(key==='chair' && f.table)return line+' 我亲手把碗放在那个位置。筷子一松手，窗台就湿了。';
  if(key==='photo' && f.sorted)return line+' 我按相纸背面的次序翻过三张底联。搬过三次家，签字的人始终是我。';
  if(key==='truth' && f.matched && f.boat)return line+' 那张照片里的孩子手上有一只船。原来她也把乳牙藏在船肚子里。';
  if(key==='wired' && state.switchboard.response==='tap')return line+' 我在听筒上敲了两下。响回来的却是接线台上那个空孔。';
  if(key==='wired' && state.switchboard.response==='mute')return line+' 我按住送话簧片，妹妹听不见我。旁边的空孔里，还是有人拿起了听筒。';
  if(key==='passed')return line+(state.registration==='visitor'?' 灯查到我时，测潮婆让它听我的脚步。':f.kin?' 它听见小满喊妈妈，才收起灯。':' 窗边那副碗筷，到这里成了我的见证。');
  return line;
}
function journal(onClose=closePanel){
  const notes=Object.entries(clues).filter(([key])=>state.flags[key]);
  const readings={
    wetTicket:'票面用的是账簿数字。这个字读作二，留意它朝向哪边。',
    ledger:'看名字的末字。最后伸向右下的那一笔，越过了方格。',
    signedReceipt:'看末字底下的横画。签字的人压得很重，纸背也摸得出来。'
  };
  const glyphs={wetTicket:'贰',ledger:'遥',signedReceipt:'生'};
  const rows=notes.map(([key,[title,line]])=>{
    const reading=readings[key]?'<details class="glyph-reading"><summary>辨认原字</summary><figure><b translate="no">'+glyphs[key]+'</b><figcaption>'+readings[key]+'</figcaption></figure></details>':'';
    return '<li><b>'+title+'</b><p>'+notebookLine(key,line)+'</p>'+reading+'</li>';
  }).join('');
  sheet('FIELD NOTES','调查笔记',rows?'<ul class="notelist">'+rows+'</ul>':'<p class="panel-text">纸页还是空的。</p>',[['合上笔记',onClose,true]],onClose);
}
function home(){
  $('brand').setAttribute('aria-label','返回标题画面');
  closePanel();coastWeather.scene(null);stopWalk();playing=false;cancelAnimationFrame(frame);frame=0;
  harborSound.scene?.('title');
  document.body.classList.remove('game-on');$('home').hidden=false;$('game').hidden=true;$('menu-nav').hidden=false;$('game-nav').hidden=true;
  activeSlot=saveKey;
  state=readSave();
  if(state?.flags.sawQueueCaller)rememberEncounter('queue-caller');
  if(state?.flags.crossed)rememberEncounter('anchor');
  if(state?.flags.passed){rememberEncounter('keeper');rememberEncounter('permit');}
  $('start').querySelector('span').textContent=state?(state.finished?'回看尾声':'继续游戏'):'开始游戏';
  $('chapter-start').textContent='选章试玩';
  const active=state?locations[state.room].chapter:0;
  document.querySelectorAll('.chapter').forEach((b,i)=>{
    b.classList.toggle('active',i===active);
    const stored=sceneSave(i),label=b.querySelector('.trial-stop');
    label.hidden=!stored;label.textContent=stored?sceneStop(stored):'';
  });
  document.querySelector('.chapter-count').innerHTML=String(active+1).padStart(2,'0')+' <i>/</i> '+String(chapters.length).padStart(2,'0');
  window.scrollTo(0,0);
}
function start(){
  if(state?.finished){begin(false);return;}
  begin(!state);
}
function begin(isNew){
  $('brand').setAttribute('aria-label','暂停探索');
  closePanel();if(isNew||!state){state=fresh();save();}
  $('home').hidden=true;$('game').hidden=false;$('menu-nav').hidden=true;$('game-nav').hidden=false;playing=true;document.body.classList.add('game-on');window.scrollTo(0,0);
  loadRoom();chapterFilms.resume();if(state.finished){finalCard();return;}if(isNew)say([['林遥','短租合同只有七天。做完这批档案，刚好能赶回去帮妹妹搬家。'],['楼下的女人','小林啊，安顿好了就下来。今天多煮了一碗饭。']]);
}
function sceneSave(index){
  const saved=readSave(sceneSavePrefix+index);
  if(saved)return saved;
  // Earlier builds kept a single preview without its starting index. Offer it
  // on the card for its last known chapter, until that card has its own save.
  const legacy=readSave(oldPreviewKey);
  return legacy&&locations[legacy.room].chapter===index?legacy:null;
}
function sceneStop(s){
  const f=s.flags;
  let detail=s.clueRoom===s.room&&s.lastClue?clues[s.lastClue][0]:'';
  if(s.room==='dinner')detail=f.fish?'鱼已上桌':f.table?'碗筷已摆好':f.chair?'椅子已搬到窗边':f.chairName?'看过椅底的名字':'';
  if(s.room==='stairs')detail=f.stairTop?'上层门廊':f.stairSecond?'第二层背光处':f.stairFirst?'第一层背光处':'';
  if(s.room==='causeway')detail=f.crossed?'旧绞盘':f.shrineReached?'石龛':'';
  if(s.room==='after')return endings[s.ending].title;
  return locations[s.room].title+(detail?' · '+detail:'');
}
function startSceneTrial(index,stored=null){
  const rooms=['room','dinner','hall','archive','ferry','nursery','exchange','returns','causeway','stairs'];
  const milestones=[
    ['luggage','power','voice','parcel'], ['chair','table','fish','window'],
    ['photo','tape','latch','identity','honest','emergency'],
    ['ledger','sorted','registered','granny'], ['gauge','drained'],
    ['matched','boat','heightMark','truth','auntAsked','token'], ['diagram','wired'],
    [], ['crossed']
  ];
  activeSlot=sceneSavePrefix+index;
  if(stored){state=stored;save();begin(false);return;}
  state=fresh();
  state.room=rooms[index];
  for(const flag of milestones.slice(0,index).flat())state.flags[flag]=true;
  if(index>=4){state.registration='visitor';state.plates=[0,1,2];}
  if(state.flags.wired)restoreSwitchboard(state,state);
  save();
  begin(false);
}
function previewChapter(i){
  const c=chapters[i];
  const isReturn=c.art==='returns';
  const entry=isReturn?startReturnTrial:i>=5?startFinaleTrial:i>=3?startChapterTrial:start;
  const label=isReturn?'试玩退信室':i>=5?'进入灯塔篇':i>=3?'试玩档案馆':state?'从存档继续':'从序章开始';
  const stored=sceneSave(i);
  const trialOptions=stored?[['接着试走',()=>startSceneTrial(i,stored),true],['从头试走',()=>startSceneTrial(i)]]:[['试走本场景',()=>startSceneTrial(i),true]];
  const options=[['返回',closePanel],...trialOptions,[label,entry]];
  sheet('SCENE / '+String(i+1).padStart(2,'0'),c.name,'<img class="scene-preview" alt="'+c.name+'" src="'+artUrl(c.art)+'"><p class="panel-text">'+c.intro+'</p>'+(stored?'<p class="caption">'+sceneStop(stored)+'</p>':''),options);
}
function pause(){if(!playing)return;sheet('PAUSED','暂停探索','<p class="panel-text">'+locations[state.room].title+($('hint').open?' · '+objective(state)[0]:'')+'</p>',[['返回标题',home],['海城地图',()=>openRouteMap(pause)],['调查笔记',()=>journal(pause)],['继续探索',closePanel,true]]);}
function moveRoom(name){
  const from=state.room,oldImage=$('backdrop').src;
  closePanel();chapterFilms.stage(from,name);state.room=name;
  if(name==='waitingRoom')state.flags.sawWaitingRoom=true;
  if(name==='lostOffice')state.flags.sawLostOffice=true;
  save();loadRoom(true,from);chapterFilms.passage(from,name,oldImage);
}
function playLandingTrip(){
  if(!playing||!landingIsDark(state)||state.flags.tripSeen)return;
  state.flags.tripSeen=true;save();
  $('world').classList.add('lamp-failing');$('viewport').classList.add('trip-shudder');
  harborSound.cue('breaker-trip');
}
function loadRoom(throughPassage=false,from=null){
  stopWalk();const loc=locations[state.room];
  const after=state.room==='after'?endings[state.ending]:null;
  actorX=state.room==='stairs'?towerStairs.refuge():state.room==='causeway'?(state.flags.crossed?74:state.flags.shrineReached?45:loc.start):loc.start;face=1;
  const arrival=dockArrival(from,state.room);
  if(arrival)[actorX,face]=arrival;
  if(state.room==='after'&&state.ending==='home'&&state.epStep===2&&!state.flags.glassTurn)actorX=39;
  $('world').classList.remove('lamp-failing');
  $('viewport').classList.remove('trip-shudder');
  $('world').dataset.room=state.room;
  $('world').dataset.ending=after?state.ending:'';
  $('keeper-beam').toggleAttribute('hidden',state.room!=='stairs'||!!state.flags.stairTop);
  $('scene-number').textContent=after?'EPILOGUE':'SCENE '+loc.section;
  $('scene-name').textContent=after?after.place:loc.title;
  $('scene-time').textContent=after?after.when:'周六 / '+loc.time;
  document.querySelector('.game-hint > span').textContent=state.ending==='city'
    ?'点亮菱形标记，用楼道里的灯光回应住户。':state.room==='stairs'?'按住上楼，或轻点台阶。点贴墙屏息，再点一次起身。':'点击场景中的菱形标记，林遥会走到物件旁调查。';
  const art=state.room==='flood'&&!state.flags.window?'dinner':after?after.art:loc.art;
  $('backdrop').src=artUrl(art);$('backdrop').alt=after?after.place:loc.title;
  coastWeather.scene(art);
  $('lamp-patch').style.backgroundImage='url("'+$('backdrop').src+'")';
  $('actor').style.height=(after&&state.ending==='home'?43:loc.height)+'%';$('flood').style.opacity='0';$('viewport').classList.toggle('surge',state.room==='flood' && !!state.flags.window);$('scene-flash').hidden=true;
  $('door-latch').classList.remove('knocking');
  $('glass-echo').className=state.room==='after'&&state.ending==='home'&&state.epStep===2&&!state.flags.glassTurn?'waiting':'';
  dressScene();lostProperty.scene();
  nightWatch.enter();towerStairs.enter();
  showCityLight();
  resizeWorld();refreshField();$('viewport').focus({preventScroll:true});lastTime=0;
  if(!throughPassage&&state.room==='dinner'&&state.flags.chairEchoPending)moveSupperChair();
  if(!throughPassage)playLandingTrip();
  if(!frame)frame=requestAnimationFrame(tick);
}
function drawSpots(things){
  const key=state.room+'|'+things.map(t=>t[0]+t[1]).join('|');
  if($('spots').dataset.layout===key)return;
  $('spots').dataset.layout=key;delete $('spots').dataset.near;
  const box=$('spots');box.replaceChildren();
  things.forEach(([id,label,x,y])=>{const b=button('',e=>{e.stopPropagation();approach(id);},'spot');b.id='spot-'+id;const point=state.room==='stairs'?towerStairs.project(x):{x,y};b.style.left=point.x+'%';b.style.top=(state.room==='stairs'?point.y-5:point.y)+'%';b.title=label;b.setAttribute('aria-label','调查'+label);b.innerHTML='<span class="spot-diamond"></span><span class="spot-label">'+label+'</span>';box.append(b);});
}
function refreshField(){
  if(!playing)return;
  syncSupperFurniture();
  harborSound.scene?.(state.room,state.flags,state.ending);
  $('world').classList.toggle('first-tide',state.room==='dinner' && !!state.flags.table);
  if(state.room==='flood')$('scene-name').textContent=state.flags.window?'水下的家宴':'楼下的家宴';
  if(state.room==='ferry')$('shift-board').querySelector('b').textContent=state.flags.erased?'　': '许荣生';
  $('world').classList.toggle('landing-blackout',landingIsDark(state));
  if(!landingIsDark(state))$('world').classList.remove('lamp-failing');
  $('world').classList.toggle('torch-carried',landingIsDark(state)&&!!state.flags.foundRail);
  const dry=state.room==='hall'&&!!state.flags.threshold;
  $('world').classList.toggle('ticket-stuck',dry&&!state.flags.ticketDown);
  $('world').classList.toggle('ticket-down',dry&&!!state.flags.ticketDown);
  $('world').classList.toggle('ticket-kept',dry&&!!state.flags.wetTicket);
  $('floor-ticket').style.left=(state.ticketX||24)+'%';
  const [task,id]=objective(state);$('objective').textContent=task;const t=fieldTargets(state);drawSpots(t);
  t.forEach(([key,,, ,flag])=>{const el=$('spot-'+key);if(el){el.classList.toggle('selected',$('hint').open&&key===id);el.classList.toggle('done',!!state.flags[flag]);}});
  updateInspect();
}
function closeUpScene(){return state?.room==='after' && ['aunt','names'].includes(state.ending);}
function buttonTarget(){
  const targets=fieldTargets(state);
  if(closeUpScene())return targets.find(t=>'spot-'+t[0]===document.activeElement?.id)||targets[0];
  if($('hint').open)return targets.find(t=>t[0]===objective(state)[1]);
  return targets.reduce((best,t)=>Math.abs(t[2]-actorX)<Math.abs(best[2]-actorX)?t:best);
}
function updateInspect(){
  if(!playing)return;
  const t=buttonTarget(),near=closeUpScene()||Math.abs(actorX-t[2])<12;
  const spots=$('spots');
  if(spots.dataset.near!==(near?t[0]:'')){
    spots.querySelector('.within-reach')?.classList.remove('within-reach');
    spots.dataset.near=near?t[0]:'';
    if(near)$('spot-'+t[0])?.classList.add('within-reach');
  }
  $('inspect-label').textContent=near||$('hint').open?t[1]:'靠近看看';
  $('inspect').disabled=!near&&!$('hint').open;
  $('inspect').setAttribute('aria-label',$('inspect').disabled?'附近没有可调查的物件':'调查'+t[1]);
}
$('hint').ontoggle=()=>{if(playing)refreshField();};
function approach(id){
  if(!playing || panel.open)return;
  if(nightWatch.returning()||towerStairs.returning())return;
  const target=fieldTargets(state).find(item=>item[0]===id);
  if(!target)return;
  if(closeUpScene()){interact(id);return;}
  held=0;
  destination=target[2];
  pending=id;
  harborSound.cue('tap');
}
function resizeWorld(){
  if(!playing)return;
  const v=$('viewport'),stairs=state.room==='stairs';
  v.classList.toggle('still-inspection',closeUpScene());
  // Keep the painted furniture and paper figures on the same physical scale.
  // Portrait windows scroll across the plate. Short landscape windows frame it.
  if(stairs||closeUpScene())v.style.removeProperty('max-width');
  else v.style.maxWidth=Math.round(v.clientHeight*16/9)+'px';
  worldWidth=closeUpScene()?v.clientWidth:stairs?Math.max(v.clientWidth,v.clientHeight*1.4):Math.max(v.clientWidth,Math.round(v.clientHeight*16/9));
  $('world').style.width=worldWidth+'px';$('world').style.height=stairs?Math.round(worldWidth*1.25)+'px':'';
  positionActor();
}
const sceneLamps={room:73,dinner:34,waitingRoom:74,lostOffice:27.5};
function positionActor(){
  if(state.room==='stairs'){towerStairs.position();return;}
  const ratio=window.devicePixelRatio || 1;
  const snap=value=>Math.round(value*ratio)/ratio;
  const x=actorX/100*worldWidth;
  harborSound.windowPosition(actorX);
  if(landingIsDark(state))$('world').style.setProperty('--torch-x',(actorX+face*9)+'%');
  const actor=$('actor');
  actor.style.left=snap(x-actor.offsetWidth/2)+'px';
  $('body').style.transform='scaleX('+face+')';
  const view=$('viewport').clientWidth;
  camera=snap(Math.max(0,Math.min(worldWidth-view,x-view*.5)));
  $('world').style.transform='translateX('+(-camera)+'px)';
  const lamp=sceneLamps[state.room];
  if(lamp!==undefined){
    const distance=(actorX-lamp)/19;
    actor.style.setProperty('--actor-light',(.73+.41*Math.exp(-distance*distance/2)).toFixed(3));
  }
}
function tick(now){
  frame=0;if(!playing)return;
  const dt=lastTime?Math.min(.055,(now-lastTime)/1000):0;lastTime=now;
  coastWeather.run(now);
  if(state.room==='waitingRoom')lostProperty.tick(now);
  if(!panel.open&&!$('chapter-film').open&&!document.hidden){
    if(nightWatch.returning()||towerStairs.returning()){held=0;destination=state.room==='stairs'?towerStairs.refuge():nightWatch.refuge();pending=null;}
    const before=actorX,pace=dt*(state.room==='causeway'?nightWatch.speed():state.room==='stairs'?towerStairs.speed():32),maxDelta=destination===null?0:destination-actorX;
    if(held){destination=null;pending=null;actorX=walkLimit(actorX+held*pace);}
    else if(destination!==null){actorX+=Math.sign(maxDelta)*Math.min(pace,Math.abs(maxDelta));}
    const delta=actorX-before;
    if(Math.abs(delta)>.001){
      face=delta>0?1:-1;
      if(state.room==='hall'&&state.flags.threshold&&!state.flags.ticketDown&&Math.abs(actorX-locations.hall.start)>=5)dropShoeTicket();
      if(state.room==='after' && state.ending==='home' && state.epStep===2 && !state.flags.glassTurn){
        state.flags.glassTurn=true;save();
        $('glass-echo').style.setProperty('--turn',face);
        $('glass-echo').className='turning';
        harborSound.cue('curtain');
      }
      if(!walking)setWalking(true);stride+=Math.abs(delta);
      const phase=Math.floor(stride/2.56)%8;if(state.ending!=='names')$('body').style.backgroundPosition=(phase*100/7)+'% bottom';positionActor();updateInspect();
      if(now-lastFoot>320 && state.ending!=='city'){const surface=state.room==='hall'?'dry-step':state.room==='ferry'?'deck-step':state.room==='drain'?'sluice-step':state.room==='stairs'?'stair-tread':'step';
        harborSound.cue(surface);lastFoot=now;}
    }else if(walking)setWalking(false);
    if(state.room==='causeway')nightWatch.advance(dt,before);
    if(state.room==='stairs')towerStairs.advance(dt,before);
    noticeFigure(now);
    if(destination!==null&&Math.abs(destination-actorX)<.06){const action=pending;stopWalk();if(action)interact(action);}
  }
  if(!frame&&playing)frame=requestAnimationFrame(tick);
}
$('viewport').addEventListener('click',e=>{if(panel.open||closeUpScene()||nightWatch.returning()||towerStairs.returning()||e.target.closest('button'))return;const x=state.room==='stairs'?towerStairs.nearest(e.clientX,e.clientY):(e.clientX-$('viewport').getBoundingClientRect().left+camera)/worldWidth*100;destination=walkLimit(x);pending=null;});
window.addEventListener('resize',resizeWorld);
function bindDirection(id,dir){const b=$(id);b.addEventListener('pointerdown',e=>{if(panel.open)return;e.preventDefault();b.setPointerCapture(e.pointerId);pressedWalk=dir;held=dir;destination=null;pending=null;});const up=()=>{if(pressedWalk===dir){held=0;pressedWalk=0;}};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('lostpointercapture',up);}
bindDirection('walk-left',-1);bindDirection('walk-right',1);
window.addEventListener('blur',stopWalk);
document.addEventListener('keydown',e=>{
  if($('chapter-film').open)return;
  if(panel.open){if(e.code==='Space'&&dialogNext&&!e.repeat){e.preventDefault();dialogNext();}return;}
  if(!playing)return;
  const stairs=state.room==='stairs';
  const dir=['ArrowLeft','KeyA'].includes(e.code)||(stairs&&['ArrowDown','KeyS'].includes(e.code))?-1:['ArrowRight','KeyD'].includes(e.code)||(stairs&&['ArrowUp','KeyW'].includes(e.code))?1:0;
  if(dir){if(closeUpScene())return;e.preventDefault();held=dir;destination=null;pending=null;return;}
  if(e.repeat)return;
  if(e.target.closest('summary')&&['Enter','Space'].includes(e.code))return;
  if(e.code==='KeyE'){e.preventDefault();if(!$('inspect').disabled)approach(buttonTarget()[0]);}
  if(stairs&&(e.code==='KeyC'||(e.code==='Space'&&!e.target.closest('button,summary')))){e.preventDefault();$('stair-duck').click();}
  if(e.code==='KeyC'&&state.room==='causeway'&&!state.flags.crossed)$('watch-quiet').click();
  if(e.code==='KeyJ')journal();
  if(e.code==='KeyM')openRouteMap();
  if(e.code==='Escape')pause();
});
document.addEventListener('keyup',e=>{if((held===-1&&['ArrowLeft','KeyA','ArrowDown','KeyS'].includes(e.code))||(held===1&&['ArrowRight','KeyD','ArrowUp','KeyW'].includes(e.code)))held=0;});
$('inspect').onclick=()=>approach(buttonTarget()[0]);$('start').onclick=start;$('help').onclick=showHelp;$('nav-cast').onclick=()=>cast();$('nav-map').onclick=worldMap;$('pause-button').onclick=pause;$('journal-button').onclick=()=>journal();$('brand').onclick=()=>playing?pause():home();$('nav-home').onclick=home;
function showSoundSetting(){
  const on=harborSound.enabled;
  $('sound').setAttribute('aria-pressed',String(on));$('sound').setAttribute('aria-label',on?'关闭游戏声音':'开启游戏声音');
  $('sound-word').textContent=on?'声音开':'声音关';
  const local=inner.querySelector('.case-sound');if(local)local.textContent=on?'声音开':'声音关';
}
async function toggleGameSound(){
  try{await harborSound.set(!harborSound.enabled);}catch{announce('当前浏览器未能开启声音。');}
  showSoundSetting();
}
$('sound').onclick=toggleGameSound;
showSoundSetting();
function restoreSound(event){
  if(!event.isTrusted||event.target.closest?.('#sound,.case-sound'))return;
  try{harborSound.unlockSavedSound();}catch{announce('当前浏览器未能开启声音。');}
}
document.addEventListener('click',restoreSound,true);
document.addEventListener('keydown',restoreSound,true);
$('chapter-start').onclick=selectChapter;
$('field-map').onclick=()=>openRouteMap();
$('nav-endings').onclick=()=>openEndingArchive();
chapters.forEach((c,i)=>{const b=button('',()=>previewChapter(i),'chapter');b.innerHTML='<img src="'+artUrl(c.art)+'" alt=""><span class="chapter-text"><span class="chapter-no">SCENE / '+String(i+1).padStart(2,'0')+'</span><strong>'+c.name+'</strong><small class="trial-stop" hidden></small></span>'+icon('arrow');$('chapter-list').append(b);});
home();
function wallKnocks(){
  const latch=$('door-latch');
  latch.classList.remove('knocking');void latch.offsetWidth;latch.classList.add('knocking');
  harborSound.cue(state.room==='room'?'wall':'knock');
}
function record(speaker,lines,flag,fx){
  say(lines.map((l,i)=>[speaker,l,i===0?fx:undefined]),()=>{mark(flag);if(flag==='power')wallKnocks();});
}
function interact(id){
  if(id==='rollSlip'){openOldRollSlip();return;}
  if(id==='oldPier'){moveRoom('waitingRoom');return;}
  if(id==='deliveryReturn'&&state.flags.deliveryStair){moveRoom('lostOffice');return;}
  if(state.room==='waitingRoom'||state.room==='lostOffice'){
    switch(id){
      case 'pierSteps':moveRoom('causeway');break;
      case 'pierChild':speakAtPier();break;
      case 'claimDoor':moveRoom('lostOffice');break;
      case 'waitingDoor':moveRoom('waitingRoom');break;
      case 'deliveryHatch':if(state.flags.unclaimedName)deliveryHatch();break;
      case 'callBench':lostProperty.bench();break;
      case 'claimShelf':lostProperty.shelf();break;
    }
    return;
  }
  if(id==='torch')return searchDarkLanding();
  if(id==='lookBack')return lookBack();
  if(id==='lampCopy')return lampCopy();
  if(['casing','pipe','doorEar'].includes(id))return listenAtSurface(id);
  const f=state.flags;
  if(state.room==='returns'){
    if(id==='toExchangeHall')leaveReturns();
    else returnAction(id);
    return;
  }
  if(locations[state.room].chapter >= 5){finaleAction(id);return;}
  if(locations[state.room].chapter >= 3){archiveAction(id);return;}
  switch(id){
    case 'case':
      record('行李箱',['两件换洗衣服，车票，还有妹妹的旧相框。底座呢？大概落在家里了。','床下伸出一双拖鞋。三十七码，刚好是你的尺码。'],'luggage');break;
    case 'power':
      if(f.power){say([['电表','表盘缓缓转着。隔壁传来冰箱的嗡声。']]);break;}
      choose('电表','闸刀垂着。电话旁边的充电指示灯也暗着。',[['合上电闸',()=>record('出租屋',['咔哒。冰箱响了。隔壁的冰箱也在同一秒响了。桌边的一盏小红灯亮起来。'],'power','tap')],['先看看别处',closePanel]]);break;
    case 'phone':
      if(!f.power){say([['电话','桌边压着一部没电的手机。沿着充电线看过去，墙上的电表一动不动。']]);break;}
      record('妹妹的留言',['周日别迟到，搬家公司的车八点就来。我把那箱书留在门口了，等你一起抬。','楼下有人拖长声音喊了一句：吃饭啦。\n语音快结束时，妹妹轻轻答了一声：来了。'],'voice','phone');break;
    case 'door':
      if(!f.luggage||!f.voice){say([['林遥',!f.luggage?'先把行李安顿好。玻璃相框还压在衣服下面。':'手机里还有妹妹的留言，听完再下楼。']]);break;}
      moveRoom('landing');break;
    case 'parcel':inspectParcel();break;
    case 'dine':
      if(!f.parcel){say([['楼下的阿姨','小林，顺手拿一下门口的包裹。上头写着你的名字。']]);break;}
      moveRoom('dinner');chapterFilms.supperArrival();break;
    case 'chair':moveSupperChair();break;
    case 'table':setSeventhSeat();break;
    case 'fish':
      if(!f.table){say([['灶台','鱼还焖着。阿姨递过一双筷子，朝桌上的空位点了点头。']]);break;}
      record('灶台',['你把鱼端上桌。没放葱。窗外的公交报站声忽然断了，接着是倒车声。只剩下冰箱。'],'fish');break;
    case 'aunt':
      if(!f.fish){say([['阿姨',!f.chair?'多拿把椅子，今天我们坐七个。':!f.table?'碗筷也摆上吧。靠窗，那里是你的。':'鱼好了，劳驾给端上来。']]);break;}
      choose('阿姨','她把围裙在膝上铺平，回头看了一眼楼梯。\n“你是不是还有谁没叫来？”',[['没有了，坐下来吃饭',()=>say([['阿姨','那就齐了。']],floodSequence)],['再等一会儿',()=>say([['林遥','你看了一眼手机。妹妹最后一条消息还停在“周日见”。']])]]);break;
    case 'window':
      thresholdView(false);break;
    case 'leave':
      if(!f.window){say([['阿姨','先别急着出门，看看水到哪儿了。']]);break;}
      thresholdView(true);break;
    case 'wetTicket':
      sheet('海城客运','鞋底的单程票','<div class="ticket-echo"><span>海城客运<br>单程 · 贰</span><p>干水泥上有一个湿方印。那张纸刚才还贴在车窗上。</p></div>',
        [['留在地上',closePanel],['收起湿车票',()=>{mark('wetTicket');harborSound.cue('wet-paper');closePanel();},true]]);break;
    case 'photo':showPhoto(false);break;
    case 'tape':showTape();break;
    case 'kid':knock();break;
    case 'breaker':
      if(!f.honest){say([['配电箱','铁皮箱上写着“应急照明”。里面的线通向隔壁一扇窄门。']]);break;}
      switchBox(false);break;
  }
}
function floodSequence(){
  const seat=actorX;
  moveRoom('flood');
  actorX=seat;positionActor();
  harborSound.cue('tide');
}
function showPhoto(flipped){
  const art=flipped?'<div class="evidence"><small>槐巷住户 · 留底</small><p>小满和妈妈，搬家前一天。</p><p>槐巷七号 → 柳街三号 → 盐路九号</p></div>':'<div class="photo-proof"><img src="'+artUrl('child')+'" alt="小满"><img src="'+artUrl('lin')+'" alt="与林遥相像的女人"></div><p class="panel-text">女人的眉骨和你很像。她身旁的小孩攥着一只木陀螺。相纸背面有墨迹。</p>';
  sheet('EVIDENCE / PHOTO','门上的合影',art,flipped?[['记入笔记',()=>{mark('photo');closePanel();},true]]:[['翻到背面',()=>showPhoto(true),true]]);
}
function showTape(){
  const bars=Array.from({length:36},(_,i)=>'<i style="height:'+(5+Math.abs(Math.sin(i*2.13)*Math.cos(i*.3))*21)+'px;animation-delay:-'+(i%5)*.1+'s"></i>').join('');
  sheet('EVIDENCE / TAPE','旧录音机','<p class="panel-text">磁带停在一半，透明盖子里夹着两粒盐。</p>',[['按下播放',()=>{
    harborSound.startTape();
    sheet('PLAYBACK / 00:07','旧录音机','<div class="tape-spools" aria-hidden="true"><i></i><i></i></div><div class="recorder" aria-hidden="true">'+bars+'</div><p class="panel-text">沙沙声里，有个女人在门外喊。<br>“小满，插销不用拔。等我回来。”</p>',[['按停录音，记入笔记',()=>{mark('tape');closePanel();wallKnocks();announce('卷盘停了。门栓又跳了两下。');},true]]);
  },true]]);
}
function knock(){
  const f=state.flags;
  if(f.threshold&&!f.ticketAsked){
    const line=f.wetTicket?'门缝里伸出两根手指。“票给我看看。……今天它停在你们那一层啊。”':'“你上来的时候，有没有听见车响？”';
    say([['门后的孩子',line,'stool']],()=>{mark('ticketAsked');knock();});return;
  }
  if(f.honest){say([['小满','姐姐，配电间那扇门没有插销。你能让那里的灯亮起来吗？']]);return;}
  if(!f.photo||!f.tape){say([['门后的孩子','妈妈说不能给陌生人开门。你记得她怎么叫我吗？','knock'],['林遥','门边有一张合影。下面那台录音机里还装着磁带。']]);return;}
  function relation(){
    choose('小满','“你怎么也记得？”\n小凳子又朝门边挪了一点。“你是妈妈吗？”',[
      ['小满，是我。',()=>{say([['小满','妈妈。你的手怎么这么凉？'],['林遥','他把门推开，把手放进你的掌心。楼道尽头的灯扫过来，在你们身上停了停。']],()=>{mark('kin');finish();});}],
      ['我认识你妈妈。你可以叫我姐姐。',()=>{mark('honest');say([['小满','姐姐。我还是不敢开这扇门。配电间还有一扇门……那里的灯亮了，我就过去。']]);}]
    ]);
  }
  if(f.latch){relation();return;}
  choose('门后的孩子','“她回来以前，会让我怎么做？”\n门栓上响了一声。',[['拔开插销',()=>say([['门后的孩子','不是这样的。凳子往里挪了一点，也许该再听一遍录音。']])],['让插销留着，等她回来',()=>{mark('latch');relation();}],['去窗边等她',()=>say([['门后的孩子','不对。她从来不让我站在窗边。']])]]);
}
function switchBox(mainOff,message=''){
  sheet('EMERGENCY CIRCUIT','配电间','<p class="panel-text">铭牌上刻着一行字：先断主线，再合应急。</p><div class="switches"></div><p class="caption">'+(message||'应急灯没有亮。')+'</p>');
  const switches=inner.querySelector('.switches');
  const main=button('',()=>{harborSound.cue('tap');switchBox(!mainOff,!mainOff?'主线已断。墙后的声音停了。':'主线已重新接通。');});
  main.innerHTML='<strong>主线</strong><span>'+(mainOff?'断开 / OFF':'接通 / ON')+'</span>';
  const emergency=button('',()=>{harborSound.cue('tap');if(!mainOff){switchBox(false,'两路同时通电，保护器跳开了。先操作主线。');return;}mark('emergency');say([['配电间','灯管闪了一下，随后亮稳了。窄门另一头，有只小手扶上门框。'],['小满','姐姐，我看得见你了。我们走吧。']],finish);});
  emergency.innerHTML='<strong>应急照明</strong><span>合闸 / ON</span>';switches.append(main,emergency);main.focus({preventScroll:true});
}
function finish(){
  state.flags.identity=true;
  moveRoom('archive');
  prologueEnd();
}
function prologueEnd(){
  const kin=state.flags.kin;
  const text=kin?'小满握紧你的手，叫了你一声妈妈。':'小满从灯下向你跑来，叫了你一声姐姐。';
  sheet('END OF PROLOGUE','序章完 · 门开了','<p class="panel-text">'+text+'<br>档案馆的窗户，在水面上方一格一格亮了起来。</p>',[
    ['调查笔记',()=>journal(prologueEnd)],['进入悬空档案馆',archiveArrival,true]
  ],archiveArrival);
}
