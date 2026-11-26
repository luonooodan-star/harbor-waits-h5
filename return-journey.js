'use strict';

function startReturnTrial() {
  const saved = readSave(returnSaveKey);
  const resume = () => {
    activeSlot = returnSaveKey;
    state = saved;
    begin(false);
  };
  const enter = erased => {
    activeSlot = returnSaveKey;
    state = fresh();
    state.room = 'returns';
    state.registration = erased ? 'family' : 'visitor';
    Object.assign(state.flags, {
      clerk: true, registered: true, wired: true, truth: true, identity: true,
      ...(erased ? {kin:true, erased:true, boarded:true} : {granny:true, honest:true, drained:true})
    });
    save();
    begin(false);
    say([['退信室', erased
      ? '窗台上那封信的右角，和许荣生工牌背后的半张船票缺在同一处。'
      : '小满循着邮绳看向窗外。“那个给我橘子的叔叔，到对岸了吗？”']]);
  };
  if (saved && !saved.flags.signedReceipt && !saved.flags.keptLetter) {
    resume();
    return;
  }
  const choices = [
    ['注销了他的船位', () => enter(true)],
    ['把船位留给他', () => enter(false), true]
  ];
  if (saved) choices.unshift(['查看上次回执', resume]);
  sheet('DEAD LETTER OFFICE', '支线试玩 · 无人签收',
    '<p class="panel-text">末班船已经离岸。进通讯局以前，你把许荣生的船位怎么处理了？</p><p class="caption">这封信单独存档。选择一种来路，会开始这一份退件。</p>',
    choices);
}

function leaveReturns() {
  if (activeSlot !== returnSaveKey) {
    moveRoom('exchange');
    const f = state.flags;
    if (!f.postConversation && (f.signedReceipt || f.keptLetter)) {
      mark('postConversation');
      postalArrival();
    }
    return;
  }
  const f = state.flags;
  if(f.keptLetter||f.signedReceipt)chapterFilms.passage('returns','exchange');
  postalShiftCard();
}

function postalArrival(){
  say([['小满', state.flags.keptLetter
    ? '小满替你推开通讯局的门。“许荣生。”他又念了一遍，“下回有人来问信，我也知道是哪一封了。”'
    : '通讯局的门槛上有水。小满先跨过去，回头朝你伸出手，也学着那个人说：“慢点走，石阶滑。”']]);
}

function postalShiftCard(){
  const f=state.flags;
  const result = f.signedReceipt ? '渡口签收联' : f.keptLetter ? '原名留存联' : '待办退件';
  const text = f.signedReceipt ? '邮绳停了。回执上有个“生”字，最后一横比上一横长一点。' :
    f.keptLetter ? '留件袋里没有签名。收件人一栏，林遥一笔一划写全了。' :
    '剩下的退件留在桌上。下次可以从这里继续。';
  sheet('CLOSE OF SHIFT', result, '<p class="panel-text">' + text + '</p>',
    [['再看一眼', closePanel], ['收工回到标题', home, true]]);
}

const receiptEchoes = {
  home: {
    label:'相框后面的纸', x:12, y:59,
    signed:'妹妹刚把相框摆上纸箱，就有半张回执从背板后面滑出来。你指给她看那个“生”字：“他自己签的，在对岸。”',
    kept:'妹妹从相框背后抽出一张纸：“许荣生，这张也要留吗？”你点点头，把亲收栏空着的那张回执夹了回去。'
  },
  aunt: {
    label:'窗台上的旧纸', x:64, y:54,
    signed:'一阵风把窗台上的旧回执掀起一角。你拿汤匙柄压住它，当年橘皮按过的地方已经透光，“生”字最后那一横还很清楚。',
    kept:'窗台上，一只空碗压着那张留件联，亲收栏还空着。你端汤经过，把纸往里挪了挪，免得汤汁溅花许荣生的名字。'
  },
  names: {
    label:'柜里的回执', x:64, y:40,
    signed:'窗边的柜子里，那张回执已经翻得起了毛边。你翻过来，摸到“生”字最后一横的凹痕，当年他落笔还挺重。',
    kept:'柜子里压着一张留件联。你的手指沿着纸上的“许荣生”摸过去，三个字底下都是自己当年握笔时留下的凹痕。'
  },
  city: {
    label:'窗边的一张纸', x:87, y:55,
    signed:'小满把褪色的回执举到窗边找光。你让楼道灯多亮了一会儿，他的指尖顺着“生”字的最后一横划过去。',
    kept:'小满把旧留件联摊在窗台上，指尖依次按在“许、荣、生”三个字上。你点亮头顶那盏灯，他的手影从空白的亲收栏上移开了。'
  }
};

function receiptKeepsake(s) {
  if (s?.room !== 'after' || !(s.flags?.signedReceipt || s.flags?.keptLetter) || !Object.hasOwn(receiptEchoes,s.ending)) return null;
  const echo = receiptEchoes[s.ending];
  return ['keepsake', echo.label, echo.x, echo.y];
}

function readReceiptKeepsake() {
  const target = receiptKeepsake(state);
  if (!target) return;
  const echo = receiptEchoes[state.ending];
  say([[echo.label, state.flags.keptLetter ? echo.kept : echo.signed]]);
}
