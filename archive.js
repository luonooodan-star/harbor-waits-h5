'use strict';

const addressCards = [
  {year:'1912', plaque:'槐巷七号', title:'轮渡收租底联', date:'民国元年 · 十月初三',
   text:'槐树靠窗的那户交了租。门上钉着七号铁牌。', annotation:'代签人把“遥”字最后一捺写出了格。'},
  {year:'1956', plaque:'柳街三号', title:'修门收条', date:'一九五六年 · 六月十一',
   text:'柳街口第三扇门，换插销一根。旧门背面还刷着一朵槐花。', annotation:'收款栏里，也有那一捺。'},
  {year:'1998', plaque:'盐路九号', title:'连廊停用通知', date:'一九九八年 · 汛期',
   text:'盐库那条路封了。九号住户的东西全搬走，门留在原地。', annotation:'落款处的墨还没干。'}
];

function dressScene() {
  const box = $('figures');
  box.replaceChildren();
  const add = (art, name, x, height, feet) => {
    const img = document.createElement('img');
    img.src = artUrl(art);
    img.dataset.art = art;
    img.dataset.speaker = name;
    img.alt = name;
    img.className = 'resident';
    img.style.left = x + '%';
    img.style.height = height + '%';
    img.style.bottom = feet + '%';
    box.append(img);
    return img;
  };
  switch (state.room) {
    case 'dinner':
    case 'flood':
      add('aunt', '阿姨', 70, 61, 7);
      break;
    case 'archive':
      add('granny', '测潮婆', 72, 46, 8);
      add('child', '小满', 29, 34, 7);
      break;
    case 'ferry':
    case 'drain':
      if(state.room==='drain'){
        const slip=document.createElement('i');slip.className='drain-roll-slip';slip.textContent='1998';
        slip.setAttribute('aria-hidden','true');box.append(slip);
      }
      add('child', '小满', 18, 35, 7);
      if (state.flags.granny) add('granny', '测潮婆', 69, 46, 8);
      break;
    case 'exchange':
      if(state.flags.token)add('aunt','阿姨',72,46,7);
      break;
    case 'causeway':
      const hauler=document.createElement('div');
      hauler.id='anchor-hauler';hauler.setAttribute('role','img');hauler.setAttribute('aria-label','拖锚客');
      box.append(hauler);
      const companion=document.createElement('div');
      companion.id='watch-child';
      companion.append(add('child','小满',50,100,0));
      box.append(companion);
      if(state.flags.granny)add('granny','测潮婆',8,27,25);
      break;
    case 'waitingRoom':
      add('child','小满',9,33.5,14);
      break;
    case 'stairs': {
      const keeper=document.createElement('div');
      keeper.id='stair-keeper';keeper.setAttribute('role','img');keeper.setAttribute('aria-label','灯首守夜人');
      box.append(keeper);break;
    }
    case 'tower':
      if(state.flags.token)add('aunt','阿姨',48,45,8);
      break;
    case 'after':
      if(state.ending==='home')add('sister','妹妹',69,47,8);
      if(state.ending==='city' && state.epStep===1)add('xiaoman-later','长大后的小满',54,55,8);
      if(state.ending==='city' && state.epStep===2)add('aunt','阿姨',77,49,8);
      break;
    case 'nursery':
      add('child', '小满', 34, 34, 7);
      add('aunt', '阿姨', 72, 49, 7);
      break;
  }
}

function archiveArrival() {
  closePanel();
  say([
    ['档案馆', '楼板在脚下晃了一下。窗外没有街，只有海。桌上的旧簿摊在正中间，两页之间夹着一根还湿的头发。'],
    ['小满', state.flags.kin ? '妈妈，那排抽屉上，有一个跟你的箱子写得一样。' : '姐姐，你看左边。那张纸条也写着林遥。']
  ]);
}

function startChapterTrial(restart=false) {
  const trial = readSave(chapterSaveKey);
  if (trial && restart!==true) {
    activeSlot = chapterSaveKey;
    state = trial;
    begin(false);
    return;
  }
  function enter(kin) {
    activeSlot = chapterSaveKey;
    state = fresh();
    state.room = 'archive';
    for (const key of ['luggage','power','voice','parcel','chair','table','fish','window','photo','tape','latch','identity']) {
      state.flags[key] = true;
    }
    if (kin) state.flags.kin = true;
    else Object.assign(state.flags, {honest:true, emergency:true});
    save();
    begin(false);
    archiveArrival();
  }
  sheet('CHAPTER I','单章试玩 · 迁居簿',
    '<p class="panel-text">小满已经从门里出来了。在上楼的路上，他怎么称呼你？</p><p class="caption">这次试玩使用独立存档。</p>',
    [['他叫我姐姐', () => enter(false)], ['他叫我妈妈', () => enter(true), true]]);
}

function registrationLine() {
  if (state.registration === 'visitor') return state.flags.granny ? '外来档案整理员林遥。见证人一栏，有测潮婆的指印。' : '外来档案整理员林遥。见证人一栏还空着。';
  return state.flags.kin ? '本城家人。小满亲口指认林遥是妈妈。' : '本城家人。阿姨留的第七个席位，成了林遥的住址证明。';
}

function openDrawer() {
  const strips = addressCards.map(c => '<div class="file-row"><time>'+c.year+'</time><b>林遥</b><span>准予离城</span></div>').join('');
  sheet('RESIDENT FILES','署名相同的三份档案',
    '<div class="file-paper"><div class="file-heading">海城住户 · 离城记录</div>'+strips+'<p>已具备独立生活能力，准予离城。</p></div><p class="panel-text">三次签收，笔迹一模一样。最后一页的日期写的是明天。</p>'+ticketEcho('把票压在纸边，湿墨蹭过去。离城日期下面多了一个反写的贰。'),
    [['收录笔迹', () => {mark('ledger'); closePanel();}, true]]);
}

function migrationBook() {
  let held = -1;
  let slip = 0;
  let tab = 'plates';
  let feedback = '';
  const isFiled = () => state.flags.sorted;
  function draw() {
    const rows = addressCards.map((card, index) =>
      '<div class="book-row"><time>'+card.year+'</time><button class="plaque" data-slot="'+index+'" aria-pressed="'+(held===index)+'" '+(isFiled()?'disabled':'')+' aria-label="'+card.year+' 年门牌：'+addressCards[state.plates[index]].plaque+'">'+addressCards[state.plates[index]].plaque+'</button></div>'
    ).join('');
    const current = addressCards[slip];
    const body = '<div class="book-tabs"><button data-tab="plates" aria-pressed="'+(tab==='plates')+'">门牌登记</button><button data-tab="slips" aria-pressed="'+(tab==='slips')+'">随卷底联</button></div>'+
      '<div class="book-spread" data-page="'+tab+'"><section class="book-page plate-page"><small>海城 · 居民卷宗</small><h3>历年门牌</h3>'+rows+
      '<p class="book-feedback" role="status">'+(feedback || (isFiled()?'已核验。经办人同属一人。':held<0?'点一块门牌拿起，再点另一行交换。':'已拿起门牌。再点另一行交换。'))+'</p>'+
      (isFiled()?'<span class="ink-stamp">核验相符</span>':'<button id="verify-plates" class="stamp-button">盖章核验</button>')+
      '</section><section class="book-page slip-page"><small>随卷底联　'+(slip+1)+' / 3</small><h3>'+current.title+'</h3><time>'+current.date+'</time><p>'+current.text+'</p><p class="marginalia">'+current.annotation+'</p>'+
      '<button id="next-slip" class="paper-turn">翻下一张　→</button></section></div>';
    sheet('HOUSEHOLD REGISTER','迁居簿',body);
    panel.classList.add('book-dialog');
    for (const b of inner.querySelectorAll('[data-tab]')) {
      b.onclick = () => {tab=b.dataset.tab; draw(); inner.querySelector('[data-tab="'+tab+'"]').focus();};
    }
    for (const b of inner.querySelectorAll('[data-slot]')) {
      b.onclick = () => {
        const i = Number(b.dataset.slot);
        feedback = '';
        if (held < 0) held = i;
        else {
          [state.plates[i],state.plates[held]] = [state.plates[held],state.plates[i]];
          held = -1;
          save();
        }
        harborSound.cue('page');
        draw();
        inner.querySelector('[data-slot="'+i+'"]').focus();
      };
    }
    $('next-slip').onclick = () => {
      slip = (slip+1) % addressCards.length;
      harborSound.cue('page');
      draw();
      $('next-slip').focus();
    };
    if (!isFiled()) $('verify-plates').onclick = verify;
  }
  function verify() {
    if (held >= 0) {
      feedback = '手里还拿着一块门牌，请先放下。';
      draw();
      return;
    }
    const wrong = state.plates.findIndex((value,i) => value !== i);
    if (wrong >= 0) {
      slip = wrong;
      feedback = addressCards[wrong].year+' 年的门牌与底联不符。';
      draw();
      return;
    }
    mark('sorted');
    harborSound.cue('stamp');
    sheet('ARCHIVE SEAL','核验相符',
      '<div class="file-paper"><span class="ink-stamp">核验相符</span><p>纸背透出三次签收的笔迹。每个“遥”字，都越过了格线。</p></div>'+
      '<p class="panel-text">'+(state.flags.kin?'小满贴近看了很久。“妈，你教我写名字的时候，也老写到格子外面。”':'小满用指头比着那一捺。“姐姐，这个字我认识。我妈也总写出去一点。”')+'</p>',
      [['收起迁居簿', closePanel, true]]);
  }
  draw();
}

function registrationDesk() {
  const f = state.flags;
  if (!f.ledger || !f.sorted) {
    say([['登记窗口', '请先取出署名档案，把历年门牌核对好。窗口下面压着一张空白通行证。']]);
    return;
  }
  function issue(kind) {
    state.registration = kind;
    mark('registered');
    harborSound.cue('stamp');
    sheet('TRANSIT PERMIT','通行证',
      '<div class="file-paper"><div class="file-heading">海城 · 通行登记</div><p>'+registrationLine()+'</p><span class="ink-stamp">登记在册</span></div>',
      [['收好通行证', closePanel, true]]);
  }
  choose('登记窗口', f.registered ? '旧章还湿着。要怎样填写这次的通行身份？' :
    '帘后的人递出两张表。\n“办短工填外来，得有人作证。若是回家，请填与本户的关系。”', [
    ['填外来者：来做七天档案整理', () => issue('visitor')],
    ['填本城家人：核对与本户的关系', () => {
      const line = f.kin ? '小满把脸凑到窗口：“是我妈妈。她连插销的事都记得。”\n笔尖停在“母亲”一栏。' :
        '小满摇头：“她是姐姐。”帘后递出第七把椅子的签收条，上面是阿姨的手印。\n“留了席，也算本户家人。认这张条子吗？”';
      choose('亲属登记', line, [
        [f.kin?'在“母亲”栏盖章':'按第七个席位登记', () => issue('family')],
        ['收回表格，重新填写', registrationDesk]
      ]);
    }]
  ]);
}

function meetGranny() {
  if (state.flags.granny) {
    say([['测潮婆',state.registration==='visitor'?'手印在你那张纸上。以后有人查你，只管叫我。':'路我跟你走。真有人问起来，我还记得你头一天的脚步。']]);
    return;
  }
  choose('测潮婆', '老人把铅坠从窗外收回来，在湿地板上敲了两下。\n“一个大人，一个孩子。走路都舍不得把脚抬高。要我陪一程么？”',[
    ['请她同行作证', () => {
      mark('granny');
      say([['测潮婆',state.registration==='visitor'?'来，把见证人那栏给我。我给你按个手印。':'我能挡住那盏灯，挡不住你答应过的事。']]);
    }],
    ['先自己看看',closePanel]
  ]);
}

function chooseWaterway() {
  if (!state.flags.registered || (state.registration==='visitor' && !state.flags.granny)) {
    say([['外廊门卫',state.flags.registered?'外来证上的见证人还是空的。窗边那位老人愿意作证么？':'要过这扇门，先拿到通行登记。']]);
    return;
  }
  choose('外廊岔口','头顶的铁牌指向育养所。左边一根绳牵着末班船，右边有石阶没入水里。',[
    ['沿栈桥去末班渡口', () => moveRoom('ferry')],
    ['沿石阶去旧排水闸', () => moveRoom('drain')]
  ]);
}

function ferryWindow() {
  if (state.flags.erased) {
    say([['搪瓷饭盒','饭盒盖上还留着半圈湿橘子皮。小满说，姐姐，你在看什么？那个窗口一直空着呀。'.replace('姐姐',state.flags.kin?'妈妈':'姐姐')]]);
    return;
  }
  record('值班员许荣生', ['玻璃底下递出两瓣橘子。“上船容易晕，含一口。”小满接了一瓣，另一瓣留在饭盒盖上。','男人把工牌翻过来：许荣生。他往船上望了一眼。“我也下班了，就等这一趟。”'],'clerk');
}

function ferryManifest() {
  if (!state.flags.clerk) {
    say([['末班船名册','最后一个座位留给当班人。签名洇开了，值班窗口里传来剥橘子的声音。']]);
    return;
  }
  if (state.flags.erased) {
    say([['末班船名册','当班人数：零。末班船给你们留了位置。']]);
    return;
  }
  sheet('LAST FERRY','末班船名册',
    '<div class="file-paper"><div class="file-heading">末班轮渡 · 当班回程</div><div class="file-row"><time>末席</time><b>许荣生</b><span>留座</span></div><div class="clerk-effects"><span>海城轮渡 · 工牌 <b>许荣生</b></span><span>搪瓷饭盒 · 半瓣橘子</span></div><p>注销后，空出的船位转给持证人；同户儿童随行。</p></div><p class="panel-text">印章会同时注销他的住户页。窗台上，那半瓣橘子还等着他回来。</p>',
    [['留他的位置，改走排水道', () => moveRoom('drain')],['注销许荣生的住户页', () => {
      mark('erased');
      harborSound.cue('stamp');
      say([['小满','嘴里怎么有橘子味？']]);
    }]]);
}

const tides = [
  ['平潮','水迹停在白线上方。',68],['下行潮','水面刚从白线往下退。',43],
  ['低水位','水面已低，闸后开始回涌。',24],['回涨潮','水正顺着刻度往上爬。',56]
];

function openSluice() {
  if (!state.flags.gauge) {
    say([['闸轮','铸铁轮左右各有一条深痕。先去看看闸旁的水尺。']]);
    return;
  }
  let phase=0, direction=null, feedback='';
  function draw(focusId) {
    const [name,line,level]=tides[phase];
    const body='<div class="sluice"><div class="gauge-column" aria-hidden="true"><i style="height:'+level+'%"></i><b></b></div><div><span class="panel-code">旧闸 · 潮位</span><h3>'+name+'</h3><p>'+line+'</p><button id="wait-tide" class="paper-turn">等下一声潮响　→</button></div></div>'+
      '<div class="sluice-direction"><button id="west" aria-pressed="'+(direction==='west')+'">← 西岸</button><button id="east" aria-pressed="'+(direction==='east')+'">东岸 →</button></div>'+
      '<p class="caption" role="status">'+(feedback||'先选泄水方向，再拉下闸柄。')+'</p>';
    sheet('TIDAL GATE','排水闸轮',body,[['拉下闸柄',pull,true]]);
    $('wait-tide').onclick=()=>{phase=(phase+1)%tides.length;feedback='';harborSound.cue('bell');draw('wait-tide');};
    for (const side of ['west','east']) $(side).onclick=()=>{direction=side;feedback='';draw(side);};
    if (focusId) $(focusId).focus();
  }
  function pull() {
    if (!direction) feedback='闸轮还在中位，先选一岸泄水。';
    else if (direction!=='west') feedback='水压把东侧的闸顶了回来。水尺下方的箭头指向西岸。';
    else if (phase!==1) feedback='闸轮咬不住。要等水刚退过白线的那一声。';
    else {
      harborSound.cue('tide');
      arriveAtNursery('drained');
      return;
    }
    draw();
  }
  draw();
}

function arriveAtNursery(route) {
  state.flags[route]=true;
  moveRoom('nursery');
  nurseryArrival(route);
}

function nurseryArrival(route) {
  const crossing = route==='boarded'?'汽笛响了。末排只有一个空座。小满坐上你的膝头，手里还攥着那片橘子皮。':'闸轮终于松动。水朝西侧退去，露出一条检修道。小满沿着你的湿脚印，一步一步走到对岸。';
  say([['去往对岸',crossing],['旧育养所','门厅里有一股蒸鱼的味道。阿姨拿布擦着门框，一边擦，一边量你的身高。']]);
}

function nurseryConversation() {
  if (!state.flags.heightMark) {
    say([['阿姨','站到门框那儿去。我得看看，当年那道刻线还在不在。']]);
    return;
  }
  say([['阿姨','我多留了你三年。后来他们说，再不开席，大家都得走。'],
    ['林遥','门框背面还有一行字：送她去岸上。等她有想回去的家，再叫她回来。'],
    ['林遥','我摸到口袋里那只相框底座。周日八点，妹妹还在等我。']],()=>{
    mark('truth');
    chapterEnding();
  });
}

function chapterEnding() {
  const f=state.flags;
  const cost=f.erased?'工牌还在你口袋里。船开之后，再没人记得许荣生。':
    f.clerk?'许荣生坐上了自己的末班船。你从检修道出来时，听见他打了最后一声铃。':
    '末班船载着她原本的乘客离港。你和小满走过了潮水让出的路。';
  sheet('END OF CHAPTER I','第一章完 · 门框上的名字',
    '<p class="panel-text">'+cost+'</p><div class="file-paper"><div class="file-heading">本次留档</div><p>'+registrationLine()+'</p><p>入所路径　'+(f.drained?'排水闸 · 西岸':'末班渡船')+'</p></div>',
    [['查看调查笔记',()=>journal(chapterEnding)],['继续 · 岸上的电话',closePanel,true]],closePanel);
}

function archiveAction(id) {
  switch(id) {
    case 'ledger':openDrawer();break;
    case 'sort':migrationBook();break;
    case 'register':registrationDesk();break;
    case 'granny':meetGranny();break;
    case 'route':chooseWaterway();break;
    case 'back':moveRoom('archive');break;
    case 'clerk':ferryWindow();break;
    case 'manifest':ferryManifest();break;
    case 'board':
      if (state.flags.erased) arriveAtNursery('boarded');
      else say([['末班船','船板收了一半。值班员的座位还留着，名册就摊在窗口。']]);
      break;
    case 'gauge':record('潮位尺',['白线下方的箭头指着西岸。旁边的小字是用钉子划的：水往下过线，才开闸。'],'gauge');break;
    case 'wheel':openSluice();break;
  }
}
