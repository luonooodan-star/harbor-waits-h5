'use strict';

const switchboardJacks = [
  {name:'甲', x:225, sound:'Tower', trace:'一声长音，拖得很平。', signal:'long'},
  {name:'乙', x:320, sound:'IdleJack', trace:'只有沙沙声。灯帽一直是暗的。', signal:'idle'},
  {name:'丙', x:416, sound:'Shore', trace:'两声短音，中间停了半拍。', signal:'short'}
];

const switchboardTools = {probe:'试线听筒', white:'白绳', black:'黑绳'};

function openHarborSwitchboard() {
  const board = state.switchboard;
  if (!state.flags.diagram && !state.flags.wired && board.contact < 3) {
    say([['接线台', '台灯底下压着一张试线工单。先看一眼，免得把塔台的电话拨到岸上。']]);
    return;
  }

  let selected = 'probe';
  let lastProbe = 0;
  let activeClip = null;
  let looseCord = null;
  let soundObserver;
  const jackNames = switchboardJacks.map(jack => jack.name);
  const modalBody =
    '<div class="harbor-board" id="switchboard">'+
      '<div class="harbor-board-face" id="switchboard-face">'+
        '<img class="harbor-board-art" alt="人工交换机，左侧是瓷座，中间三个插孔，右侧是摇柄">'+
        '<canvas class="harbor-board-cords" id="switchboard-cords" width="1280" height="720" aria-hidden="true"></canvas>'+
        '<div id="switchboard-lamps" aria-hidden="true"></div>'+
        '<div class="harbor-board-contact-piston" aria-hidden="true"></div>'+
        '<button type="button" id="switchboard-contact" class="harbor-board-hit harbor-board-contact"><span></span></button>'+
        '<div id="switchboard-jacks"></div>'+
        '<button type="button" id="switchboard-ring" class="harbor-board-hit harbor-board-ring"><span>摇铃</span></button>'+
        '<div id="switchboard-cord-ends" aria-hidden="true"></div>'+
      '</div>'+
      '<div class="harbor-board-toolbar" id="switchboard-tools" role="group" aria-label="接线工具"></div>'+
      '<div class="harbor-board-readout" id="switchboard-readout"><i class="harbor-board-trace" aria-hidden="true"></i>'+
        '<p id="switchboard-caption" role="status"></p></div>'+
      '<section id="switchboard-call" class="harbor-board-call" hidden></section>'+
      '<footer class="harbor-board-footer">'+
        '<button type="button" id="switchboard-card" aria-expanded="false" aria-controls="switchboard-orders">查看值班卡</button>'+
        '<button type="button" id="switchboard-audio" aria-pressed="false"></button>'+
      '</footer>'+
      '<p class="harbor-board-orders" id="switchboard-orders" hidden>试线留记　塔台一声长，本埠两声短。白绳出岸，黑绳回塔。空号勿占。</p>'+
    '</div>';

  function stopClip() {
    activeClip = null;
    harborSound.stopExchange?.();
  }

  function cue(clip) {
    stopClip();
    activeClip = clip;
    harborSound.cue('exchange-' + clip);
  }

  function closeBoard() {
    soundObserver?.disconnect();
    stopClip();
    closePanel();
  }

  function isCalling() {
    return board.beat >= 1 && board.beat <= 7;
  }

  function status(text, signal='none') {
    $('switchboard-caption').textContent = text;
    $('switchboard-readout').dataset.signal = signal;
  }

  const plugArt=['white','black'].map(color=>{
    const image=new Image();
    image.onload=()=>{if($('switchboard-cords'))drawCords();};
    image.src=artUrl('plug-'+color);
    return image;
  });

  function drawCords() {
    const paint=$('switchboard-cords').getContext('2d');
    if(!paint)return;
    paint.setTransform(2,0,0,2,0,0);
    paint.clearRect(0,0,640,360);
    board.jacks.forEach((jack,index)=>{
      const loose=looseCord?.index===index;
      const image=plugArt[index];
      if(!image.naturalWidth)return;
      if(!jack&&!loose){
        paint.drawImage(image,197+index*198,264,87,27);
        return;
      }
      const x=loose?looseCord.x:switchboardJacks[jack-1].x;
      const y=loose?looseCord.y:156;
      const angle=loose?-.55:-1.26;
      const scale=loose?.78:.65;
      const tailX=x-80*scale*Math.cos(angle),tailY=y-80*scale*Math.sin(angle);
      const start=index?435:241;
      paint.beginPath();
      paint.moveTo(start,288);
      paint.bezierCurveTo(start+30,305,tailX-15,tailY+60,tailX,tailY);
      paint.lineCap='round';
      for(const [width,color] of [[7,'#181818'],[4,index?'#575757':'#c7c7c7']]){
        paint.lineWidth=width;paint.strokeStyle=color;paint.stroke();
      }
      paint.save();paint.setLineDash([1,3]);paint.lineWidth=2;
      paint.strokeStyle=index?'#898989':'#707070';paint.stroke();paint.restore();
      paint.save();paint.translate(x,y);paint.rotate(angle);paint.scale(scale,scale);
      paint.drawImage(image,-85,-13,87,27);paint.restore();
    });
  }

  function paint() {
    const calling = isCalling();
    const complete = board.beat === 8;
    const face = $('switchboard-face');
    face.dataset.contact = String(board.contact);
    face.dataset.call = String(calling);
    face.dataset.beat = String(board.beat);
    $('switchboard-cord-ends').hidden = calling || complete;
    $('switchboard-tools').hidden = calling;
    $('switchboard-readout').hidden = calling;
    $('switchboard-call').hidden = !calling;
    $('switchboard-card').hidden = calling;
    if (calling) $('switchboard-orders').hidden = true;

    const service = ['抽出瓷座', '擦拭簧片', '推回瓷座', '已合座'][board.contact];
    const contact = $('switchboard-contact');
    contact.querySelector('span').textContent = service;
    contact.setAttribute('aria-label', service);
    contact.hidden = calling;
    const ring = $('switchboard-ring');
    ring.hidden = calling;
    ring.querySelector('span').textContent = complete ? '值机记录' : '摇铃';
    ring.setAttribute('aria-label', complete ? '查看值机记录' : '转动摇柄');

    switchboardJacks.forEach((jack, index) => {
      const number = index + 1;
      const lamp = $('switchboard-lamp-' + number);
      const socket = $('switchboard-jack-' + number);
      const cable = board.jacks.indexOf(number);
      const cordLabel = ['白绳','黑绳'][cable] || '';
      socket.querySelector('span').textContent = jack.name + (cordLabel ? ' · ' + cordLabel[0] : '');
      socket.setAttribute('aria-label', jack.name + '孔，' + (cordLabel || '未插绳'));
      socket.disabled = calling;
      socket.classList.toggle('harbor-board-listened', Boolean(board.probes & (1 << index)));
      lamp.className = 'harbor-board-lamp';
      if (calling) {
        if (number === 1 || (number === 3 && board.beat < 7)) lamp.classList.add('harbor-board-steady');
        if (number === 2 && [3,5,6,7].includes(board.beat)) {
          lamp.classList.add('harbor-board-stray');
          lamp.dataset.beat = String(board.beat);
        }
      } else if (selected === 'probe' && lastProbe === number && jack.signal !== 'idle') {
        // Restart the short flash sequence when the same jack is probed twice.
        void lamp.offsetWidth;
        lamp.classList.add('harbor-board-flash-' + jack.signal);
      }
    });

    Object.keys(switchboardTools).forEach((tool, index) => {
      const node = $('switchboard-tool-' + tool);
      node.setAttribute('aria-pressed', String(tool === selected));
      node.disabled = complete && tool !== 'probe';
      const target = index > 0 ? board.jacks[index - 1] : 0;
      node.querySelector('small').textContent = tool === 'probe'
        ? '试听'
        : target ? '已接' + jackNames[target - 1] + '孔' : '未插入';
    });
    drawCords();
  }

  function serviceContact() {
    if (board.contact === 3) {
      status('瓷座已经扣紧，簧片两端接通。');
      return;
    }
    board.contact++;
    save();
    cue('Click');
    const feedback = [
      '抽出的簧片结着一层盐。用袖口横着擦一擦。',
      '盐霜落在袖口，簧片露出金属。把瓷座向上推到底。',
      '瓷座咔哒一声扣住了，听筒里有了很轻的底噪。'
    ];
    status(feedback[board.contact - 1]);
    paint();
  }

  function pick(tool) {
    selected = tool;
    lastProbe = 0;
    status(tool === 'probe' ? '把试线听筒贴在耳边，点一个插孔试听。' :
      '拿起' + switchboardTools[tool] + '。点孔或拖到孔上插入，再点同一孔就能拔出。');
    paint();
  }

  function touchJack(number) {
    if (board.contact !== 3) {
      status('三个孔都没有电流。先检修左边的瓷座。');
      return;
    }
    const jack = switchboardJacks[number - 1];
    if (selected === 'probe') {
      lastProbe = number;
      board.probes |= 1 << (number - 1);
      save();
      cue(jack.sound);
      status(jack.name + '孔　' + jack.trace, jack.signal);
    } else {
      const cable = selected === 'white' ? 0 : 1;
      if (board.jacks[1 - cable] === number) {
        status('这只孔里已经插着' + (cable ? '白绳' : '黑绳') + '。拿起那根绳，再点一下就能拔出。');
        return;
      }
      const unplug = board.jacks[cable] === number;
      board.jacks[cable] = unplug ? 0 : number;
      lastProbe = 0;
      save();
      stopClip();
      if(!unplug || !looseCord)harborSound.cue(unplug?'plug-out':'plug-in');
      status(switchboardTools[selected] + (unplug ? '从' + jack.name + '孔拔出来了。' : '插进了' + jack.name + '孔。'));
    }
    paint();
  }

  function entryText() {
    if (board.response === 'mute') return '送话簧片已经按住，空孔里仍传来摘机声。周日八点，妹妹等我一起抬书。';
    if (board.response === 'tap') return '我敲了两下。隔了一会儿，空孔那边也敲了两下，间隔一模一样。周日八点去抬书。';
    return '外线已接通。妹妹还记得，周日八点等我一起抬书。';
  }

  function showRecord() {
    closeBoard();
    sheet('EXCHANGE LOG', '值机记录', '<div class="file-paper"><div class="file-heading">海城通讯局 · 岸线</div><p>' +
      entryText() + '</p></div>', [['收起记录', closePanel, true]]);
  }

  function setBeat(beat, response) {
    board.beat = beat;
    if (response) board.response = response;
    if (beat === 8) {
      // mark() saves flags and the telephone checkpoint in the same slot write.
      mark('wired');
      showRecord();
      return;
    }
    save();
    renderCall();
  }

  function ring() {
    if (board.beat === 8) { showRecord(); return; }
    if (board.contact !== 3) { status('摇柄空转了一圈。瓷座还没有扣住。'); return; }
    if (board.jacks.includes(0)) { status('摇柄带不起回铃，还差一端回路。'); return; }
    if (board.jacks[0] !== 3 || board.jacks[1] !== 1) {
      cue('IdleJack');
      status('铃响在自己的耳朵里。再拿起试线听筒，核对两端。', 'idle');
      return;
    }
    setBeat(1);
  }

  function renderCall() {
    const muted = board.response === 'mute';
    const scenes = [
      null,
      ['岸线','摇柄慢慢停下来。第二遍铃还没响完，对面就有人提起了听筒。','Bell'],
      ['妹妹','姐？你听，锅盖又响了。我都塞了两条毛巾了。','Pot'],
      ['妹妹','周日还是八点啊。锅我单独放。你来帮我抬书就行。','Sunday','很轻的两声咔嗒。没有插绳的乙孔闪了一下。'],
      ['妹妹','等一下。你刚才是不是碰了下听筒？我以为你挂了。','Wait'],
      ['听筒',muted ? '你按住送话簧片，连自己袖口擦过桌沿的声音也断了。' : '你敲了两下。妹妹把纸箱放下，她那边的地板吱了一声。',
        muted ? 'Muted' : 'Tap', muted ? '手还按在簧片上。乙孔的灯一亮，听筒里又响了两下。' : '隔了半拍，空孔跟着响了两下，间隔和你敲的一样。'],
      ['妹妹','好，那我先挂了。周日见，姐。','Bye','丙孔的岸线灯暗了下去。乙孔还亮过一瞬。'],
      ['听筒','岸线的灯熄了。你的手还托着听筒。','Tail','空着的乙孔轻轻一闪。很远的地方，锅盖又碰了一下。']
    ];
    const beat = board.beat;
    const [speaker,line,clip,trace] = scenes[beat];
    paint();
    cue(clip);
    const area = $('switchboard-call');
    area.innerHTML =
      '<div class="harbor-board-call-head"><h3 id="switchboard-speaker">' + speaker + '</h3><span id="switchboard-call-step">' +
      beat + ' / 7</span></div><p class="harbor-board-line" id="switchboard-line">' + line + '</p>' +
      (trace ? '<p class="harbor-board-call-trace" id="switchboard-call-trace">' + trace + '</p>' : '') +
      '<div class="harbor-board-call-actions"></div>';
    const actions = area.querySelector('.harbor-board-call-actions');
    if (beat === 4) {
      for (const [id,label] of [['mute','按住送话簧片，屏住呼吸'],['tap','用指节轻敲话筒两下']]) {
        const answer = button(label, () => setBeat(5, id), 'harbor-board-answer');
        answer.id = 'switchboard-call-' + id;
        actions.append(answer);
      }
    } else {
      const next = button(beat === 7 ? '填写值机记录' : '继续听', () => setBeat(beat + 1), 'harbor-board-answer');
      next.id = 'switchboard-call-next';
      actions.append(next);
    }
    for (const action of actions.children) {
      action.setAttribute('aria-describedby', 'switchboard-speaker switchboard-line' + (trace ? ' switchboard-call-trace' : ''));
    }
    actions.firstElementChild.focus();
  }

  // A short tap follows the button's native click path on touch, mouse and keyboard.
  // A deliberate drag consumes its click so one gesture cannot step the contact twice.
  function bindDrag(node, move, drop) {
    let start = null;
    let moved = false;
    node.addEventListener('pointerdown', event => {
      if (!event.isPrimary || event.button !== 0) return;
      start = {x:event.clientX, y:event.clientY, id:event.pointerId};
      moved = false;
      node.setPointerCapture(event.pointerId);
    });
    node.addEventListener('pointermove', event => {
      if (!start || event.pointerId !== start.id) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      if (Math.hypot(dx, dy) < 9 && !moved) return;
      moved = true;
      move?.(event);
    });
    function end(event) {
      if (!start || event.pointerId !== start.id) return;
      const dx = event.clientX - start.x, dy = event.clientY - start.y;
      start = null;
      if (moved && event.type === 'pointerup') drop(event, dx, dy);
      looseCord = null;
      drawCords();
    }
    node.addEventListener('pointerup', end);
    node.addEventListener('pointercancel', end);
    node.addEventListener('lostpointercapture', end);
    node.addEventListener('click', event => {
      if (!moved || !event.detail) return;
      moved = false;
      event.stopImmediatePropagation();
    }, true);
  }

  function enableCordDrag(node, tool, sourceJack=0) {
    bindDrag(node, event => {
      if(board.contact!==3||isCalling()||board.beat===8)return;
      if(sourceJack){
        const cable=board.jacks.indexOf(sourceJack);
        if(cable<0)return;
        tool=cable===0?'white':'black';
      }
      if (selected !== tool) pick(tool);
      if(!looseCord && board.jacks[tool==='white'?0:1]){stopClip();harborSound.cue('plug-out');}
      const area = $('switchboard-cords').getBoundingClientRect();
      looseCord = {
        index:tool === 'white' ? 0 : 1,
        x:(event.clientX - area.left) * 640 / area.width,
        y:(event.clientY - area.top) * 360 / area.height
      };
      drawCords();
    }, event => {
      if(!looseCord)return;
      const jack = document.elementFromPoint(event.clientX, event.clientY)?.closest('.harbor-board-jack');
      if(jack)touchJack(Number(jack.dataset.number));
      else if(sourceJack && event.clientY>$('switchboard-face').getBoundingClientRect().top+$('switchboard-face').clientHeight*.69)touchJack(sourceJack);
    });
  }

  function syncSound() {
    const sound = $('switchboard-audio');
    if (!sound) return;
    sound.setAttribute('aria-pressed', String(harborSound.enabled));
    sound.textContent = harborSound.enabled ? '听筒声音已开' : '听筒声音已关';
  }

  sheet('COASTAL TELEPHONE EXCHANGE', '人工接线台', modalBody, [], closeBoard);
  panel.classList.add('harbor-switchboard-dialog');
  inner.querySelector('.harbor-board-art').src = artUrl('switchboard');
  const lamps = $('switchboard-lamps');
  const sockets = $('switchboard-jacks');
  switchboardJacks.forEach((jack, index) => {
    const number = index + 1;
    const lamp = document.createElement('i');
    lamp.id = 'switchboard-lamp-' + number;
    lamp.style.left = (jack.x / 640 * 100) + '%';
    lamps.append(lamp);
    const jackButton = button('', () => touchJack(number), 'harbor-board-hit harbor-board-jack');
    jackButton.id = 'switchboard-jack-' + number;
    jackButton.dataset.number = String(number);
    jackButton.style.left = lamp.style.left;
    jackButton.innerHTML = '<span></span>';
    sockets.append(jackButton);
    enableCordDrag(jackButton,null,number);
  });
  Object.entries(switchboardTools).forEach(([tool,label]) => {
    const node = button('', () => pick(tool), 'harbor-board-tool');
    node.id = 'switchboard-tool-' + tool;
    node.innerHTML = '<strong>' + label + '</strong><small></small>';
    $('switchboard-tools').append(node);
    if (tool === 'probe') return;
    enableCordDrag(node, tool);
    // Each plug visible in the photo is a second hit target for the same tool button.
    const end = document.createElement('div');
    end.className = 'harbor-board-cord-end ' + tool;
    end.addEventListener('click', () => pick(tool));
    enableCordDrag(end, tool);
    $('switchboard-cord-ends').append(end);
  });
  $('switchboard-contact').onclick = serviceContact;
  bindDrag($('switchboard-contact'), null, (event, dx, dy) => {
    const stage = board.contact;
    if ((stage === 0 && dy > 10) || (stage === 1 && Math.abs(dx) > 10) || (stage === 2 && dy < -10)) {
      serviceContact();
    } else if (stage < 3) {
      status(['抓住瓷座向下抽，或轻点抽出。','用袖口横着擦，或轻点擦亮簧片。','将瓷座向上推到底，或轻点合座。'][stage]);
    }
  });
  $('switchboard-ring').onclick = ring;
  $('switchboard-card').onclick = () => {
    const card = $('switchboard-orders');
    card.hidden = !card.hidden;
    $('switchboard-card').setAttribute('aria-expanded', String(!card.hidden));
    $('switchboard-card').textContent = card.hidden ? '查看值班卡' : '收起值班卡';
  };
  $('switchboard-audio').onclick = () => $('sound').click();
  soundObserver = new MutationObserver(() => {
    syncSound();
    if (harborSound.enabled && activeClip && isCalling()) harborSound.cue('exchange-' + activeClip);
    else if (!harborSound.enabled) harborSound.stopExchange?.();
  });
  soundObserver.observe($('sound'), {attributes:true, attributeFilter:['aria-pressed']});
  syncSound();
  if (isCalling()) {
    renderCall();
  } else {
    const captions = [
      '摇柄没有带起回铃。左边的瓷座退了半格，向下抽出检查。',
      '瓷座已经抽出。簧片上结着盐，用袖口横着擦亮它。',
      '簧片已经擦亮，把瓷座向上推到底。',
      '拿起试线听筒，逐孔试听。值班卡上有前一班留的信号。'
    ];
    status(board.beat === 8 ? '岸线已经接通，摇柄回到了原位。' : captions[board.contact]);
    paint();
  }
}
