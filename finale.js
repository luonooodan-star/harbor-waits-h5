'use strict';

const endings = {
  home: {
    coda:'我数了数，屋里只有我们两个。手伸进筷笼时，我还是多拿了一双。',
    arrival:'我到家了。妹妹一头，我一头，总算把那箱书抬进了屋。',
    title:'周日见', place:'妹妹的新家', when:'周日 / 08:00', art:'end-home',
    object:'岸线听筒', action:'报出妹妹家的地址',
    intent:'回岸上找妹妹',
    price:'你在通讯局接通了妹妹的电话。现在，只要把她家的地址念给灯塔听，她就能接你回去。海城也会听见这个地址。',
    reflection:'我把地址告诉了灯塔。星期天八点，我真的回来了，和妹妹一起搬那箱书。可刚才我明明站在她身边，厨房里却有个和我一样的声音，在叫人多拿一副碗筷。海城也找到了这里。',
    steps:[
      ['搬起妹妹的纸箱',25,76,'书真沉。这箱终于没让她一个人搬。箱底还压着那张从海城回来的车票。'],
      ['挂好新窗帘',30,39,'妹妹举起手机帮你拍照。“站这儿，窗子里也能照见你。”'],
      ['去厨房拿碗',84,56,'“新家怎么有股海腥味？”妹妹问。你还站在纸箱旁，厨房里已经传来你的声音：“多拿一副碗筷。”']
    ]
  },
  aunt: {
    coda:'我都快忘了，上一次问她有没有好好吃饭，是什么时候。',
    arrival:'我离开了海城。住户页上换成阿姨的名字，她替我留在那边。',
    title:'她认得你',place:'很多年后的饭厅',when:'晚饭时分',art:'end-aunt',
    object:'交接窗口',action:'把铜扣交给值班人',
    intent:'让阿姨替你留在海城',
    price:'阿姨亲手解下这枚铜扣，答应替你留下。把它交出去，海城就会把住户页改成她的名字。你可以离开，她得留下。',
    reflection:'我离开了海城。阿姨把自己的名字换进了我的住户页，留下的人是她。这些年，我只在端起那碗汤时听见过她。她还是先问我吃得好不好。',
    steps:[
      ['端起热汤',18,67,'很多年后，你又吃到那道没放葱的鱼。碗还没端稳，汤面先轻轻抖起来。'],
      ['低头听碗里的声音',18,69,'碗里有人问：“今天吃得好不好？”隔了这么多年，她还是认得你。'],
      ['把碗放回桌上',30,76,'你正要答，她已经接了下去。“好。你忙吧。”汤面平了，方才的声音像是从来没有响过。']
    ]
  },
  names: {
    coda:'第七个人的名字，我写不出来了。可端鱼上桌时，我还是会把葱另外盛一碟。',
    arrival:'我留下了。总册已经撤掉，桌上这七户人的名字，从此由我来记。',
    title:'空席',place:'旧档案馆',when:'许多年后的登记日',art:'end-names',
    object:'居民总册',action:'撤销总册，留下七户底联',
    intent:'留下替七户人家记名',
    price:'七户底联都在你手里。撤掉总册，他们的名字就由你保管。你得留在档案馆往下记，没人能替你接班。',
    reflection:'我撤了总册，留在档案馆替七户人家记名字。过了这么多年，我还记得她吃鱼不放葱，却想不起她叫什么了。第七格空着，饭桌上也空了一把椅子。',
    steps:[
      ['翻开名册底联',46,57,'七户人家，你抄了一遍又一遍。手背起了斑。今天写到第七格时，笔尖停住了。'],
      ['念出席间的名字',12,71,'你记得那个人喝汤不吃葱。你记得碗沿有个豁口。她叫什么？'],
      ['走到出租屋门口',89,57,'又到登记日。桌边空出一把椅子。楼下有人问：“这里还有房间出租吗？”你把笔搁下来。']
    ]
  },
  city: {
    coda:'今天小满站在电梯里，让了半步。他给我留了个能站人的位置。',
    arrival:'我留下了。有人摸黑找钥匙，我伸手想帮忙，亮起来的却是他头顶的灯。',
    title:'我们会照顾你',place:'居民楼连廊',when:'多年后 / 入夜',art:'end-city',
    object:'分线匣',action:'把名字分给城里的见证人',
    intent:'留下，用城里的灯照顾大家',
    price:'小满认得你的声音，测潮婆认得你的脚步。他们替你作证，你就能把名字接进全城的线路。以后能替他们开灯、停电梯，却不能再走到他们身边。',
    reflection:'我留了下来。小满已经长大，我还可以替他扶住电梯门。他道谢时，我只能让门多开一会儿。如今楼里的灯和门就是我能伸出去的手。',
    steps:[
      ['点亮楼道灯',18,12,'灯亮了，老人终于把钥匙插进锁孔。“谢谢啊。”他对着灯说。你听见了。'],
      ['替孩子停住电梯',48,45,'小满已经和从前的你一样高。他伸手扶住门，说：“今天也辛苦了。”你让门多等了一下。'],
      ['听阿姨说话',84,38,'阿姨问你想不想看海。你想说今天不要。她已经替你拉开了窗帘。']
    ]
  }
};

const towerOptions = {line:'home', handover:'aunt', ledgerEnd:'names', relay:'city'};

function fieldTargets(s) {
  if(landingIsDark(s))return [['torch',s.flags.foundRail?'应急灯下的吊牌':'手电筒',s.flags.foundRail?61:27,60]];
  const f=s.flags;
  if(s.room==='dinner'&&f.chair)return targets.dinner.map(t=>t[0]==='chair'?['chair','窗边的折椅',42,50,'chair']:t);
  if(s.room==='causeway'){
    const visible=['toRadio','oldPier',f.crossed?'toTower':f.shrineReached?'winch':'shelter'];
    return targets.causeway.filter(([id])=>visible.includes(id));
  }
  if(s.room==='lostOffice'&&!f.unclaimedName)return targets.lostOffice.filter(([id])=>id!=='deliveryHatch');
  if(s.room==='stairs')return targets.stairs.filter(([id])=>(id==='stairBack'&&towerStairs.doorVisible())||id===objective(s)[1]);
  if(s.room==='after'){
    const [label,x,y]=endings[s.ending].steps[s.epStep];
    const keepsake=receiptKeepsake(s);
    return keepsake?[['memory',label,x,y],keepsake]:[['memory',label,x,y]];
  }
  if(s.room==='exchange' && f.wired){
    const spots=[...targets.exchange,['casing','贴耳听木壳',43,47,'casingEcho']];
    if(f.deliveryStair)spots.push(['deliveryReturn','投递梯',94,78]);
    return spots;
  }
  if(s.room==='nursery'){
    const visible=f.truth?['nurseryAunt','roster','witness','toExchange']:['birthday','tin','heightMark','nurseryAunt'];
    return targets.nursery.filter(([id])=>visible.includes(id));
  }
  if(s.room==='hall' && f.ticketDown && !f.wetTicket)
    return [...targets.hall,['wetTicket','地上的车票',s.ticketX||24,91]];
  return targets[s.room];
}

function selectChapter() {
  const menu = [
    [chapterSaveKey,'迁居簿','从档案馆翻开第一份底联',startChapterTrial],
    [finaleSaveKey,'岸上的电话','从育养所床边走到灯塔',startFinaleTrial],
    [returnSaveKey,'无人签收','去通讯局隔壁处理一封湿信',startReturnTrial]
  ];
  sheet('CHAPTER SELECT','选章试玩','<div class="chapter-picker"></div><p class="caption">章节各自存档，主线进度单独保留。</p>');
  for(const [slot,title,subtitle,enter] of menu){
    const stored=readSave(slot);
    const node=button('',enter,'chapter-entry');
    node.innerHTML='<strong>'+title+'</strong><span>'+(stored?(stored.finished?'回看 · '+endings[stored.ending].title:'继续 · '+locations[stored.room].title):subtitle)+'</span>'+icon('arrow');
    inner.querySelector('.chapter-picker').append(node);
  }
}

function startFinaleTrial(restart=false) {
  const trial=readSave(finaleSaveKey);
  if(trial && restart!==true){
    activeSlot=finaleSaveKey;
    state=trial;
    begin(false);
    return;
  }
  function enter(ferry){
    activeSlot=finaleSaveKey;
    state=fresh();
    for(const flag of ['luggage','power','voice','parcel','chair','table','fish','window','photo','tape','latch','identity','ledger','sorted','registered','clerk']){
      state.flags[flag]=true;
    }
    state.plates=[0,1,2];
    state.registration=ferry?'family':'visitor';
    Object.assign(state.flags,ferry?{kin:true,boarded:true,erased:true}:{honest:true,emergency:true,drained:true,granny:true,gauge:true});
    state.room='nursery';
    save();
    begin(false);
    say([['小满',ferry?'妈，我嘴里怎么还有橘子味？':'姐姐，你看，床脚那只铁盒还在。']]);
  }
  sheet('LAST CHAPTER','灯塔篇 · 岸上的电话',
    '<p class="panel-text">从旧育养所开始。你是怎么带小满到岸上的？</p><div class="notelist"><p>走排水道时，测潮婆替你作了证，许荣生保住了船位。</p><p>坐末班船时，小满认你作妈妈，许荣生的工牌留在你手里。</p></div>',
    [['坐末班渡船',()=>enter(true)],['走旧排水道',()=>enter(false),true]]);
}

function matchBirthday() {
  const correct=3.125;
  let x=state.flags.matched?correct:46;
  const body='<div class="photo-match" id="photo-bed"><img class="bed-image" alt="窗边下铺与刻花床栏" src="'+artUrl('nursery')+'"><img class="child-print" id="child-print" alt="六岁生日照，林遥坐在铁花床栏前" src="'+artUrl('birthday')+'"></div>'+
    '<label class="photo-slider">移动相纸 <input id="photo-shift" type="range" min="0" max="60" step=".5" value="'+x+'"></label>'+
    '<p class="caption" id="photo-hint" role="status">把相片里的卷铁花和床头对齐。可拖相纸，也可移动滑杆。</p>';
  sheet('NURSERY / PHOTOGRAPH','把六岁的自己放回房间',body,[['比对床栏',()=>{
    if(Math.abs(x-correct)>2.4){$('photo-hint').textContent='窗上的斜木条断开了。看床头那朵卷铁花，还能再靠近一些。';return;}
    mark('matched');
    say([['旧相框','床头的铁花接上了。六岁生日那天，你坐的就是窗边的这张床。两只手里，捧着一只小纸船。']]);
  },true]]);
  const image=$('child-print'),slider=$('photo-shift'),surface=$('photo-bed');
  function position(next){
    x=Math.max(0,Math.min(60,next));
    image.style.left=x+'%';
    slider.value=x;
  }
  position(x);
  slider.oninput=()=>position(Number(slider.value));
  let offset=0;
  image.onpointerdown=e=>{e.preventDefault();image.setPointerCapture(e.pointerId);offset=e.clientX-image.getBoundingClientRect().left;};
  image.onpointermove=e=>{
    if(image.hasPointerCapture(e.pointerId)){
      const frame=surface.getBoundingClientRect();
      position((e.clientX-frame.left-offset)/frame.width*100);
    }
  };
  image.ondragstart=e=>e.preventDefault();
}

function bedTin(){
  sheet('NURSERY / TIN','床脚的铁盒',
    '<div class="tin-objects"><img src="'+artUrl('tin')+'" alt="盒内由左至右是棉线、纸船、旧纽扣"></div><p class="caption" id="tin-hint" role="status">手指先托住盒底，再掀左边。盖子一下就开了。</p>'+ticketEcho('纸船尾端露出半行铅字。并在车票旁边，刚好拼出“海城客运”。'));
  const box=inner.querySelector('.tin-objects');
  const objects=[
    ['棉线',()=>$('tin-hint').textContent='最细的线头打着活结，绕过手腕正好两圈。'],
    ['纸船',()=>record('折了两次的船头',['船尖一摁就开，里面滚出一颗乳牙。纸上写着“再长一厘米，就一米零八了”。纸边有两个针眼。'],'boat','page')],
    ['旧纽扣',()=>$('tin-hint').textContent='外套上的旧扣。背面粘着浆洗过的布丝，线头还没剪齐。']
  ];
  objects.forEach(([name,fn],i)=>{const b=button(name,fn,'tin-pick');b.style.left=[18,49,79][i]+'%';box.append(b);});
}

function measureHeight(){
  if(state.flags.heightMark){say([['门框','“林遥　六岁　窗边下铺。”上面还有一行，写着“踮脚了，重来”。']]);return;}
  const line=state.flags.boat?'你把纸船摊平。纸边的两个孔，该贴到哪一道刻线上？':'三道铅笔线还在，旧纸只剩两个针眼。床脚铁盒里，也许还留着那张纸。';
  choose('门框刻线',line,[
    ['九十四厘米',()=>say([['铅笔线','旁边画着一颗豆子。木头平平的。']])],
    ['一百零七厘米',()=>{
      if(!state.flags.boat){say([['铅笔线','半个“林”字露在针眼之间。得找回钉过的那张纸。']]);return;}
      record('窗边下铺',['针眼贴上针眼，纸边补全了“林遥　六岁　窗边下铺”。八岁那条写着“踮脚了，重来”。'],'heightMark');
    }],
    ['一百一十九厘米',()=>say([['铅笔线','木头上歪歪扭扭地刻着“穿鞋量的，不算”。后面画了个气鼓鼓的脸。']])]
  ]);
}

function askAunt(){
  if(!state.flags.truth){
    if(!state.flags.matched || !state.flags.heightMark){
      say([['阿姨','你先自己认一认。这间屋子以前属于谁，我想听你来说。']]);return;
    }
    nurseryConversation();
    return;
  }
  choose('阿姨','“我扣了你三年的出所单。现在……还肯让我陪你走么？”她捏着围裙上最后一枚铜扣。',[
    ['把手给她，收下铜扣',()=>{
      mark('auntAsked','token');
      say([['阿姨','真要有人留下，我认。拿着，这颗扣子能在交接窗口换我的签名。']]);
    }],
    [state.flags.token?'把铜扣还她，自己往前走':'让她留下，自己往前走',()=>{
      delete state.flags.token;
      mark('auntAsked');
      say([['阿姨','好。我不跟。你找不到路，就看有灯的地方。']]);
    }]
  ]);
}

function readRoster(){
  if(state.flags.erased){
    say([['居民底联','七户底联只剩六份。你摸到许荣生的工牌，工牌能证明他来过，却补不回他被注销的住户页。']]);return;
  }
  record('居民底联',['你从衬板里抽出七份底联，七户人都在。撤掉总册后，得有人留下来，记住每一个名字。'],'names','page');
}

function collectWitnesses(){
  if(!state.flags.granny){say([['小满','“我记得你的声音。”旁边那一栏还空着，得有另一个人记得你的脚步。']]);return;}
  record('两份见证',['小满闭着眼也认得你的声音，测潮婆隔着墙也认得你的脚步。两人一人按了一次手印。','分线之后，你能听见城里的每一个人。他们却再也听不见你开口。'],'shared');
}

function walkLimit(x){
  if(state.room==='stairs')return Math.min(98,Math.max(1,x));
  const limit=state.room==='causeway'&&!state.flags.crossed?75:96;
  return Math.min(limit,Math.max(4,x));
}

function verifyPermit(){
  if(state.flags.passed){say([['守夜人','铁门开着。你的名字已经送到塔上。']]);return;}
  const visitor=state.registration==='visitor';
  function check(proof){
    const right=visitor?'witness':state.flags.kin?'child':'chair';
    if(proof!==right){
      say([['守夜人','灯束还压在纸上。“这和登记的那一栏对不上。”通行证被慢慢推回来。']]);
      return;
    }
    mark('passed');rememberEncounter('keeper');rememberEncounter('permit');$('keeper-beam').setAttribute('hidden','');
    const speaker=visitor?'测潮婆':state.flags.kin?'小满':'林遥';
    const testimony=visitor?'她是来做事的。听她走两步，这就是我担保的那个人。':state.flags.kin?'是我妈妈。她在门后叫过我的名字。':'阿姨在窗边给我留了椅子。我亲手摆的第七副碗筷。';
    say([[speaker,testimony],['塔内','灯从通行证上一寸一寸移开。门上的铁链自己松了。']]);
  }
  choose('灯首守夜人','灯束落在纸面。上面写着“'+(visitor?'外来档案整理员':'本城家人')+'”。\n“哪一份见证，能和这一栏对上？”',[
    ['请测潮婆认我的脚步',()=>check('witness')],
    ['让小满说出他在门后叫我的称呼',()=>check('child')],
    ['出示阿姨留给我的第七席签收条',()=>check('chair')]
  ]);
}

function endingEvidence(key){
  const f=state.flags;
  if(key==='home'&&!f.wired)return {status:'可回去接线',note:'听筒里还只有潮声。先回通讯局接通岸上的线路。'};
  if(key==='aunt'&&!f.token)return {status:'可回去取铜扣',art:'missing-button',caption:'交接单上缝着围裙的一角，扣眼还空着。',note:'交接需要阿姨自愿留下的围裙扣子。你可以回育养所问她。'};
  if(key==='names'&&f.erased)return {status:'此程已注销',art:'erased-entry',caption:'第七格的纸纤维翻了起来。还能摸到笔痕，已经辨不出名字。',note:'底联只剩六份。许荣生被注销后，总册里留下了一个无法补回的空位。'};
  if(key==='names'&&!f.names)return {status:'可回去取底联',note:'撤销总册需要七户底联。育养所窗边的登记柜还开着。'};
  if(key==='city'&&!f.shared)return f.granny?{status:'可回去请人作证',note:'还缺两份见证。先回育养所，让小满和测潮婆留下手印。'}:{status:'此程缺席',note:'分线需要小满和测潮婆两人作证。这一程，测潮婆没有同行。'};
  return null;
}

function towerIndex(){
  sheet('LIGHTHOUSE / DIRECTORY','灯塔值班索引','<p class="caption">铅笔勾出了你这份通行证能办的手续。</p><div class="duty-list"></div>'+ticketEcho('车票已经干透了。窗边的检票钳张着口，缺的那颗齿和票角一样宽。'));
  if(state.switchboard.response==='tap'){
    const line=document.createElement('p');
    line.className='caption relay-answer';
    line.textContent='索引下面的空线头弹了两下。间隔和你在通讯局敲的一样。';
    inner.querySelector('.duty-list').before(line);
    harborSound.cue('relay-answer');
  }
  for(const [id,key] of Object.entries(towerOptions)){
    const evidence=endingEvidence(key);
    const row=button('',()=>{closePanel();approach(id);},'duty-entry');
    if(evidence?.art)row.classList.add('with-proof');
    const thumb=evidence?.art?'<img class="duty-sample" alt="" src="'+artUrl(evidence.art)+'">':'';
    row.innerHTML=thumb+'<strong>'+endings[key].object+'</strong><span>'+endings[key].intent+'</span><small>'+(evidence?evidence.status:'可办理')+'</small>';
    inner.querySelector('.duty-list').append(row);
  }
  if(state.flags.unclaimedName)appendRollTab();
}

function towerDesk(key){
  const ending=endings[key],missing=endingEvidence(key);
  if(missing){
    const proof=missing.art?'<figure class="duty-proof"><img src="'+artUrl(missing.art)+'" alt=""><figcaption>'+missing.caption+'</figcaption></figure>':'';
    sheet('LIGHTHOUSE / RECORD',ending.object,proof+'<p class="panel-text">'+missing.note+'</p>',[['合上窗口',closePanel,true]]);
    return;
  }
  sheet('LIGHTHOUSE / RECORD',ending.object,'<p class="panel-text">'+ending.price+'</p>',
    [['再想一想',closePanel],[ending.action,()=>{
      delete state.flags.glassTurn;state.ending=key;state.epStep=0;state.finished=false;
      harborSound.cue('stamp');moveRoom('after');
      epilogueArrival();
    },true]]);
}

function epilogueArrival(){
  const ending=endings[state.ending];
  say([['尾声 · '+ending.title,ending.arrival]]);
}

function playMemory(){
  if(state.finished){finalCard();return;}
  const ending=endings[state.ending];
  const line=ending.steps[state.epStep][3];
  if(state.ending==='city')showCityLight(state.epStep);
  say([[ending.title,line]],()=>{
    if(state.epStep===2){
      state.finished=true;save();finalCard();
    }else{
      state.epStep++;
      if(state.ending==='home'&&state.epStep===2)$('glass-echo').className='waiting';
      save();dressScene();refreshField();
    }
  });
}

function finalCard(){
  if(state.finished)rememberEnding(state.ending);
  const ending=endings[state.ending];
  sheet('END / WE MADE YOU WELCOME',ending.title,
    '<div class="ending-still"><img src="'+artUrl(ending.art)+'" alt="'+ending.place+'"><p>'+ending.place+'<br><small>'+ending.when+'</small></p></div><p class="panel-text">'+ending.reflection+'</p><p class="ending-coda">'+ending.coda+'</p>',
    [['回到灯塔选择前',()=>{
      state.ending=null;state.epStep=0;state.finished=false;
      moveRoom('tower');
    }],['调查笔记',()=>journal(finalCard)],['重玩这一程',restartJourney],['返回标题',home,true]],home);
  if(state.flags.oldRollCorrected)appendRollTab(finalCard);
}

function finaleAction(id){
  switch(id){
    case 'birthday':matchBirthday();break;
    case 'tin':bedTin();break;
    case 'heightMark':measureHeight();break;
    case 'nurseryAunt':askAunt();break;
    case 'roster':readRoster();break;
    case 'witness':collectWitnesses();break;
    case 'toExchange':
      if(!state.flags.auntAsked){say([['阿姨','临走前，再听我说一句，好不好？']]);return;}
      moveRoom('exchange');break;
    case 'toNursery':moveRoom('nursery');break;
    case 'diagram':
      record('配线工单',['塔台一声长，本埠两声短。白绳出岸，黑绳回塔。空号勿占。','末尾有一行铅笔小字：报出地址时，海城也能听见。'],'diagram','page');break;
    case 'patch':openHarborSwitchboard();break;
    case 'toReturns':moveRoom('returns');break;
    case 'toBridge':
      if(!state.flags.wired){say([['铁梯','塔门的呼叫灯还暗着。先接通外线。']]);return;}
      moveRoom('causeway');break;
    case 'toRadio':moveRoom('exchange');break;
    case 'shelter':case 'winch':break;
    case 'stairFirst':case 'stairSecond':case 'stairTop':break;
    case 'keeperCheck':verifyPermit();break;
    case 'stairBack':moveRoom(state.flags.viaCulvert?'culvert':'signalhut');break;
    case 'dutyDoor':if(state.flags.stairTop&&state.flags.passed)moveRoom('tower');break;
    case 'toTower':
      if(!state.flags.crossed)return;
      sheet('09', '堤外岔路','<p class="panel-text">沿岸有两条路，木阶通往雾号房，石阶下到涵洞。</p>',[
        ['信号台阶',()=>moveRoom('signalhut')],['涵洞入口',()=>moveRoom('culvert')]
      ]);break;
    case 'backGate':moveRoom('causeway');break;
    case 'signalBoard':say([['值班木牌','一长声报船，两短声报人。对面亮灯，塔门才开。']]);break;
    case 'hornPull':
      sheet('09','雾号绳','',[
        ['拉一声长音',()=>{harborSound.cue('fog-long');say([['雾号绳','海上回了一声长音。塔门仍旧关着。']]);}],
        ['拉两声短音',()=>{harborSound.cue('fog-short');mark('signalAnswered');say([['雾号绳','对岸亮了两下。塔脚的小门松开了。']]);}]
      ]);break;
    case 'towerDoor':
      if(!state.flags.signalAnswered){say([['塔基小门','门闩还扣着。风里有根旧绳在敲墙。']]);break;}
      state.flags.viaCulvert=false;moveRoom('stairs');break;
    case 'tideMark':say([['水线','白线下的石头露出来时，才能钻过铁栅。']]);break;
    case 'grille':tidalGrille();break;
    case 'down':Object.assign(state.flags,{stairFirst:true,stairSecond:true,stairTop:true});moveRoom('stairs');break;
    case 'duty':towerIndex();break;
    case 'line':case 'handover':case 'ledgerEnd':case 'relay':towerDesk(towerOptions[id]);break;
    case 'memory':playMemory();break;
    case 'keepsake':readReceiptKeepsake();break;
  }
}

function restartJourney(){
  sheet('NEW JOURNEY','重玩这一程','<p class="panel-text">重新开始会替换当前这一路的存档。其他入口的进度单独保留。</p>',[
    ['保留这段尾声',finalCard],
    ['重新开始',()=>{
      if(activeSlot===finaleSaveKey)startFinaleTrial(true);
      else if(activeSlot===chapterSaveKey)startChapterTrial(true);
      else if(activeSlot.startsWith(sceneSavePrefix))startSceneTrial(Number(activeSlot.slice(sceneSavePrefix.length)));
      else begin(true);
    },true]
  ],finalCard);
}

function tidalGrille(){
  let waiting=false, lastEbb=null;
  const atLowWater=()=>coastWeather.grilleLevel()<.34;
  function cross(){
    if(!atLowWater()){
      harborSound.cue('wash');feedback.textContent='衣袖湿了一截，只能退回台阶。';return;
    }
    state.flags.viaCulvert=true;moveRoom('stairs');
  }
  function wait(){
    if(atLowWater()){cross();return;}
    waiting=!waiting;
    waitButton.textContent=waiting?'收回扶墙的手':'等浪退了再过';
    feedback.textContent=waiting?'手扶着墙。等白线露出来，就能顺着墙根过去。':'';
  }
  sheet('09','铁栅','<div class="tide-grille" aria-hidden="true"><div class="grille-study"></div><b></b><canvas class="grille-surface"></canvas></div><p class="panel-text" aria-live="polite"></p><p class="tide-feedback" role="status"></p>',[
    ['贴墙钻过',cross,true],['等浪退了再过',wait]
  ]);
  const face=inner.querySelector('.tide-grille'),water=inner.querySelector('.panel-text');
  const surface=face.querySelector('.grille-surface');
  const feedback=inner.querySelector('.tide-feedback'),waitButton=inner.querySelector('.panel-actions button:last-child');
  function showWater(){
    const level=coastWeather.grilleLevel(),ebb=atLowWater();
    const visibleLevel=reduceMotion?(ebb?.12:.95):level;
    face.style.setProperty('--chalk',Math.max(0,Math.min(1,(.385-visibleLevel)*15)).toFixed(2));
    coastWeather.paintGrilleWater(surface,visibleLevel,reduceMotion);
    if(ebb!==lastEbb){
      if(!waiting)feedback.textContent='';
      lastEbb=ebb;face.classList.toggle('ebb',ebb);
      water.textContent=ebb?'浪退了，石头正往下滴水。':'浪盖住了白线。';
      harborSound.grilleWater(ebb);
      if(ebb&&waiting)cross();
    }
  }
  coastWeather.detail(face.querySelector('.grille-study'),'culvert',showWater);
  showWater();
}
