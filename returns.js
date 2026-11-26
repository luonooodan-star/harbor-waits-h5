'use strict';

const returnFields = [
  { label: '收件人', value: '许荣生' },
  { label: '班铃', value: '双短铃' },
  { label: '联票剪口', value: '月牙缺口' }
];

const returnPigeonholes = [
  { name: '靠门一格', bell: '双短铃', cut: '斜角缺口' },
  { name: '当中一格', bell: '一声长铃', cut: '月牙缺口' },
  { name: '靠窗一格', bell: '双短铃', cut: '月牙缺口' }
];

function returnAction(id) {
  switch (id) {
    case 'wetLetter':
      openWetLetter();
      break;
    case 'postRack':
      openPostRack();
      break;
    case 'receiptDesk':
      openReceiptDesk();
      break;
  }
}

function openWetLetter() {
  if (state.flags.carbonCopy) {
    openCarbonCopy();
    return;
  }
  sheet('DEAD LETTER OFFICE', '潮湿的退信', `
    <div class="returns-envelope">
      <span class="returns-postmark">海城<br>退件</span>
      <div class="returns-addressee">收件人<span aria-label="墨迹已洇开"></span></div>
      <p>请交当班人亲收</p>
    </div>
    <p class="panel-text">信封还封着。水把面单洗白了，底下的复写联却有些凹痕。斜着摸过去，指腹会在三个地方绊一下。</p>
  `, [['垫上复写纸', openCarbonCopy, true]]);
}

function openCarbonCopy() {
  const segmentCount = 16;
  const rows = returnFields.map(() => new Set());
  const finished = returnFields.map(() => !!state.flags.carbonCopy);
  const fields = returnFields.map((field, i) => `
    <div class="returns-rub-row" data-rub-row="${i}">
      <span class="returns-field-name">${field.label}</span>
      <div class="returns-pressure"><span class="returns-rub-ink" aria-hidden="true">${field.value}</span></div>
    </div>
  `).join('');
  sheet('CARBON DUPLICATE', '复写底联', `
    <div class="returns-carbon">
      <div class="returns-form-title">退件底联<span>亲收件</span></div>
      <div class="returns-rub-surface" id="returns-rub-surface">${fields}</div>
    </div>
    <p class="returns-status" role="status" id="returns-rub-status"></p>
    <div class="returns-tools">
      <button id="returns-rub-next">拓印下一栏</button>
      <button id="returns-fold">收好拓本</button>
    </div>
  `);
  const surface = $('returns-rub-surface');
  const rubNext = $('returns-rub-next');
  const fold = $('returns-fold');
  const fieldNodes = Array.from(surface.querySelectorAll('.returns-rub-row'));
  const lanes = fieldNodes.map(node => node.querySelector('.returns-pressure'));
  let lastStroke = null;
  let pointer = null;

  function paintRow(row) {
    const ink = fieldNodes[row].querySelector('.returns-rub-ink');
    fieldNodes[row].classList.toggle('is-legible', finished[row]);
    ink.setAttribute('aria-hidden', String(!finished[row]));
    if (finished[row]) {
      ink.style.removeProperty('--returns-mask');
      return;
    }
    const stops = [];
    for (let i = 0; i < segmentCount; i++) {
      const color = rows[row].has(i) ? '#000' : 'transparent';
      stops.push(color+' '+(i * 100 / segmentCount)+'% '+((i+1) * 100 / segmentCount)+'%');
    }
    ink.style.setProperty('--returns-mask', 'linear-gradient(90deg,'+stops.join(',')+')');
  }

  function updateControls(latest = '') {
    const count = finished.filter(Boolean).length;
    const complete = count === returnFields.length;
    $('returns-rub-status').textContent = complete
      ? '许荣生。双短铃，月牙缺口。三栏都显出来了。'
      : (latest ? latest+'。' : '')+'沿每一栏的压痕左右擦，也可以逐栏拓印。已辨出 '+count+' / 3 栏。';
    rubNext.disabled = complete;
    fold.disabled = !complete;
    if (complete && !state.flags.carbonCopy) {
      mark('carbonCopy');
      harborSound.cue('page');
      fold.focus({preventScroll:true});
    }
  }

  function finishRow(row) {
    if (finished[row]) return;
    finished[row] = true;
    paintRow(row);
    updateControls(returnFields[row].label+'显出“'+returnFields[row].value+'”');
  }

  function rubPoint(e) {
    const rects = lanes.map(lane => lane.getBoundingClientRect());
    const row = rects.findIndex(rect =>
      e.clientY >= rect.top && e.clientY <= rect.bottom &&
      e.clientX >= rect.left - 8 && e.clientX <= rect.right + 8
    );
    if (row < 0 || finished[row]) {
      lastStroke = null;
      return;
    }
    const bounds = rects[row];
    const cell = Math.max(0, Math.min(segmentCount-1, Math.floor((e.clientX-bounds.left) / bounds.width * segmentCount)));
    const previousCell = lastStroke && lastStroke.row === row ? lastStroke.cell : cell;
    lastStroke = { row, cell };
    for (let i = Math.max(0, Math.min(cell, previousCell)-1); i <= Math.min(segmentCount-1, Math.max(cell, previousCell)+1); i++) {
      rows[row].add(i);
    }
    if (rows[row].size >= 11) finishRow(row);
    else paintRow(row);
  }

  surface.onpointerdown = e => {
    if (pointer !== null || e.button !== 0 || finished.every(Boolean)) return;
    pointer = e.pointerId;
    surface.setPointerCapture(pointer);
    lastStroke = null;
    rubPoint(e);
  };
  surface.onpointermove = e => { if (e.pointerId === pointer) rubPoint(e); };
  surface.onpointerup = e => {
    if (e.pointerId !== pointer) return;
    rubPoint(e);
    pointer = null;
    lastStroke = null;
  };
  surface.onlostpointercapture = surface.onpointercancel = () => {
    pointer = null;
    lastStroke = null;
  };
  rubNext.onclick = () => {
    const row = finished.indexOf(false);
    if (row >= 0) finishRow(row);
  };
  fold.onclick = closePanel;
  fieldNodes.forEach((_, row) => paintRow(row));
  updateControls();
}

function openPostRack() {
  if (!state.flags.carbonCopy) {
    say([['分拣架', '三个格签都写着渡口。窗台上的信封还湿着，得先设法辨出底联上的记号。']]);
    return;
  }
  if (state.flags.routedLetter) {
    showReturnRoutingSlip();
    return;
  }
  sheet('DISPATCH RACK', '渡口分拣架', `
    <div class="returns-pocket-note"><span>随信拓本</span><strong>许荣生</strong><small>双短铃　／　月牙缺口</small></div>
    <p class="caption">三个格子都通渡口。按格签上的班铃和票角剪口，把信送进相符的一格。</p>
    <div class="returns-boxes" id="returns-boxes" role="group" aria-label="三个分拣格"></div>
    <p class="returns-status" role="status" id="returns-rack-status">请选一处分拣格。</p>
    <div class="returns-tools"><button id="returns-file" disabled>送入邮格</button></div>
  `);
  const boxList = $('returns-boxes');
  let selected = -1;
  const selectBox = index => {
    selected = index;
    Array.from(boxList.children).forEach((node, i) => node.setAttribute('aria-pressed', String(i === index)));
    const box = returnPigeonholes[index];
    $('returns-rack-status').textContent = box.name+'。格签写着“'+box.bell+'”，票角是'+box.cut+'。';
    $('returns-file').disabled = false;
  };
  returnPigeonholes.forEach((box, i) => {
    const node = button('', () => selectBox(i), 'returns-box');
    node.id = 'returns-box-'+i;
    node.setAttribute('aria-pressed','false');
    node.innerHTML = '<strong>'+box.name+'</strong><span>'+box.bell+'</span><span class="returns-notch '+(i===0?'is-slant':'is-crescent')+'">'+box.cut+'</span>';
    boxList.append(node);
  });
  $('returns-file').onclick = () => {
    const box = returnPigeonholes[selected];
    if (!box) return;
    if (box.cut !== returnFields[2].value) {
      $('returns-rack-status').textContent = '班铃对上了，但这个格签的右角斜切了一刀。底联上留的是月牙。';
      return;
    }
    if (box.bell !== returnFields[1].value) {
      $('returns-rack-status').textContent = '票角相符。格签只印了一道长线，底联上却是两记短铃。';
      return;
    }
    mark('routedLetter');
    harborSound.cue('bell');
    showReturnRoutingSlip();
  };
}

function showReturnRoutingSlip() {
  sheet('DISPATCH SLIP', '分拣条', `
    <div class="returns-slip">
      <div class="returns-form-title">收信窗口<span>末班船 · 对岸交接</span></div>
      <p>许荣生　亲收</p><small>两记短铃　·　月牙票夹</small>
    </div>
    <p class="panel-text">信滑进邮格。墙后传来滑轮声，旁边的回执窗弹开了一条缝。</p>
  `, [['收好分拣条', closePanel, true]]);
}

function openReceiptDesk() {
  const flags = state.flags;
  if (flags.signedReceipt || flags.keptLetter) {
    showReturnedReceipt();
    return;
  }
  if (!flags.routedLetter) {
    say([['回执窗', '回执夹还是空的。窗口下面有一根绷紧的邮绳，另一头连着分拣架。']]);
    return;
  }
  const erased = !!flags.erased;
  const text = erased
    ? '窗口递回一张空页。末班船的交接名单上，签领人一栏空着。林遥把许荣生的工牌贴在空白处，票根的月牙缺口，正好对上信封上的剪痕。'
    : '转递条上写着“末班船，对岸取件”。邮筒那头响了两声短铃，有人刚踏上栈桥：“是我的信？等我擦一下手。”';
  sheet('DELIVERY RECEIPT', '回执窗口',
    '<div class="returns-desk"><span>海城渡口</span><strong>'+(erased?'交接栏　空白':'签领人　许荣生')+'</strong></div><p class="panel-text">'+text+'</p>',
    [['把信留在窗台，晚些再来', closePanel],
      [erased?'将信按原名留存':'摇铃，等本人签收', () => {
        mark(erased?'keptLetter':'signedReceipt');
        harborSound.cue(erased?'stamp':'bell');
        showReturnedReceipt();
      }, true]]);
}

function showReturnedReceipt() {
  const kept = !!state.flags.keptLetter;
  const slipTitle = kept ? '原名留存联' : '渡口签收联';
  const signature = kept ? '留件人　林遥' : '收件人　许荣生';
  const outcome = kept
    ? '你把姓名端正地写在留件袋上，没有往“签收人”一栏落笔。信封、复写底联和票角一起压进夹子里。小满踮脚摸了摸袋口，轻轻念了一遍那三个字。'
    : '邮绳又送回来半张联票。“生”字最后一横还湿着，旁边有个橘皮留下的弯印。窗洞里传来一句：“收到了。慢点走，石阶滑。”';
  sheet('RECEIPT FILE', '无人签收 · '+(kept?'留件':'回音'),
    '<div class="returns-slip is-final"><div class="returns-form-title">'+slipTitle+'<span>海城通讯局</span></div><p>'+signature+'</p><span class="returns-seal">'+(kept?'原名留存':'本人签收')+'</span></div><p class="panel-text">'+outcome+'</p>',
    [['收好回执', closePanel, true]]);
}
