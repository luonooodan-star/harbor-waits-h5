'use strict';

function homeObjectPosition(node, point) {
  node.style.left = point.x+'%';
  node.style.top = point.y+'%';
}

// Tap-to-carry and native keyboard activation reach the same targets as a drag.
function homeCarryObject(node, board, pick, drop, restore) {
  let drag = null;
  let skipClick = false;
  const clamp = value => Math.min(98, Math.max(2, value));

  node.onpointerdown = event => {
    if (event.button !== 0 || drag || node.disabled) return;
    const rect = node.getBoundingClientRect();
    drag = {
      id: event.pointerId, x: event.clientX, y: event.clientY,
      offsetX: event.clientX - (rect.left + rect.width / 2),
      offsetY: event.clientY - (rect.top + rect.height / 2), moved: false
    };
    skipClick = false;
    node.setPointerCapture(event.pointerId);
  };
  node.onpointermove = event => {
    if (!drag || event.pointerId !== drag.id) return;
    if (!drag.moved) {
      if (Math.hypot(event.clientX-drag.x,event.clientY-drag.y) < 5) return;
      drag.moved = true;
      pick();
      node.classList.add('in-hand');
    }
    const rect = board.getBoundingClientRect();
    homeObjectPosition(node, {
      x: clamp((event.clientX-drag.offsetX-rect.left) / rect.width * 100),
      y: clamp((event.clientY-drag.offsetY-rect.top) / rect.height * 100)
    });
  };
  node.onpointerup = event => {
    if (!drag || event.pointerId !== drag.id) return;
    const moved = drag.moved;
    drag = null;
    node.classList.remove('in-hand');
    if (moved) {
      skipClick = true;
      const rect = board.getBoundingClientRect();
      drop({
        x: (event.clientX-rect.left) / rect.width * 100,
        y: (event.clientY-rect.top) / rect.height * 100
      });
      restore();
    }
  };
  function cancel() {
    if (!drag) return;
    drag = null;
    node.classList.remove('in-hand');
    restore();
  }
  node.onpointercancel = cancel;
  node.onlostpointercapture = cancel;
  node.onclick = event => {
    if (!skipClick || event.detail===0) pick();
    skipClick = false;
  };
}

function inspectParcel() {
  if (state.flags.parcel) {
    sheet('门口 · 收件单','提前寄出的包裹', `
      <div class="home-slip-proof"><span>收件人　林遥</span><strong>收寄　星期二</strong></div>
      <p class="panel-text">你是星期五才接到这份短工的。底座边缘缺掉的小角，和妹妹相框背面的榫口严丝合缝。</p>`,
    [['收起收件单',closePanel,true]]);
    return;
  }
  sheet('连廊 · 取件','绳结底下的面单', `
    <div id="parcel-board" class="home-board home-package-board">
      <div class="parcel-paper"><canvas class="parcel-fibers" width="700" height="470" aria-hidden="true"></canvas><i class="parcel-seal">封</i></div>
      <button id="parcel-slip" class="parcel-slip" aria-label="翻看邮戳" disabled>
        <span class="parcel-slip-front"><small>收件人</small><strong>林遥</strong><i></i></span>
        <span class="parcel-slip-back"><small>收寄邮戳</small><strong>星期二</strong></span>
      </button>
      <canvas class="parcel-twine" id="parcel-twine" aria-hidden="true" width="900" height="600"></canvas>
      <button class="parcel-ropetip fixed-tip" id="parcel-fixed" aria-label="拉左侧紧头" title="拉左侧紧头"></button>
      <button class="parcel-ropetip free-tip" id="parcel-tail" aria-label="抽开右侧绳尾" title="抽开右侧绳尾"><span>↘</span></button>
    </div>
    <p class="home-object-hint" id="parcel-hint" role="status">右下的短绳尾穿过一个活套。把它往外抽，或点一下绳尾。</p>
    <div class="home-object-tools"><button id="parcel-unwrap" hidden>展开包纸</button></div>`);
  panel.classList.add('home-dialog');
  const board = $('parcel-board');
  const tail = $('parcel-tail');
  const fixed = $('parcel-fixed');
  const slip = $('parcel-slip');
  const hint = $('parcel-hint');
  const canvas = $('parcel-twine');
  board.style.setProperty('--home-wood', 'url("'+artUrl('frameback')+'")');
  let tied = true;
  const fibers = board.querySelector('.parcel-fibers');
  const paper = fibers.getContext('2d');
  if (paper) {
    // Fine pulp grain and irregular fibres give the folds one continuous paper surface.
    const grain = paper.createImageData(fibers.width,fibers.height);
    let seed = 711;
    function random() {
      seed = (Math.imul(seed,1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    }
    for (let i=0;i<grain.data.length;i+=4) {
      const shade = random()>.5 ? 38 : 236;
      grain.data[i] = grain.data[i+1] = grain.data[i+2] = shade;
      grain.data[i+3] = 8 + random()*37;
    }
    paper.putImageData(grain,0,0);
    paper.lineWidth=.65;
    for (let i=0;i<1900;i++) {
      const x=random()*fibers.width;
      const y=random()*fibers.height;
      const spread=1.5+random()*7;
      paper.strokeStyle=random()>.5?'#f2f2f224':'#32323220';
      paper.beginPath();paper.moveTo(x,y);
      paper.quadraticCurveTo(x+spread*.6,y+random()*2,x+spread,y+random()*3-1.5);
      paper.stroke();
    }
  }

  // Trace both strands on the package. The loop contracts as the free end slides out.
  function drawTwine(pull) {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dx = pull * 140;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const loop = 1 - pull * .85;
    const paths = [
      'M 420 47 C 417 131 424 233 420 307 C 414 385 425 480 420 540',
      'M 112 308 Q 253 301 418 306 Q 596 311 793 302',
      'M 420 306 C '+(419-82*loop)+' '+(280-38*loop)+' '+(435-112*loop)+' '+(266-29*loop)+' 396 295 Q 406 309 423 307',
      'M 420 305 C '+(465+29*loop)+' '+(299-60*loop)+' '+(493+12*loop)+' '+(301-76*loop)+' 464 276 C 443 291 433 308 420 310',
      'M 419 306 Q 380 337 347 338 Q 324 332 302 345',
      'M 423 308 C 467 325 456 358 497 355 Q '+(540+dx*.6)+' '+(343+dx*.35)+' '+(570+dx)+' '+(385+dx*.35)
    ];
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const line of paths) {
      const curve = new Path2D(line);
      ctx.setLineDash([]);
      ctx.strokeStyle = '#3d3d3d';
      ctx.lineWidth = 7;
      ctx.stroke(curve);
      ctx.strokeStyle = '#aeaeae';
      ctx.lineWidth = 4;
      ctx.stroke(curve);
      ctx.setLineDash([1.4,4]);
      ctx.strokeStyle = '#626262';
      ctx.lineWidth = 3;
      ctx.stroke(curve);
    }
  }

  function untie() {
    if (!tied) return;
    tied = false;
    board.classList.add('is-unbound');
    tail.hidden = fixed.hidden = true;
    slip.disabled = false;
    slip.focus({preventScroll:true});
    hint.textContent = '绳结松了。面单的一角翘着，翻过来看邮戳。';
    harborSound.cue('page');
  }

  let gesture = null;
  let skipClick = false;
  tail.onpointerdown = e => {
    if (e.button !== 0 || !tied || gesture) return;
    gesture = {id:e.pointerId, x:e.clientX, y:e.clientY, moved:false};
    skipClick = false;
    tail.setPointerCapture(e.pointerId);
  };
  tail.onpointermove = e => {
    if (!gesture || gesture.id !== e.pointerId) return;
    const x = e.clientX-gesture.x;
    const y = e.clientY-gesture.y;
    if (Math.hypot(x,y)>5) gesture.moved = true;
    const progress = Math.min(1,Math.max(0,(x + y*.4) / (board.clientWidth*.14)));
    drawTwine(progress);
    if (progress>=1) {gesture=null;untie();}
  };
  tail.onpointerup = () => {
    if (!gesture) return;
    skipClick = gesture.moved;
    if (gesture.moved) hint.textContent = '绳圈松了一点。沿着右下的短尾再向外拉，或者点一下短尾。';
    gesture = null;
    drawTwine(0);
  };
  tail.onlostpointercapture = tail.onpointercancel = () => {gesture=null;if(tied)drawTwine(0);};
  tail.onclick = e => {if(!skipClick || e.detail===0)untie();skipClick=false;};
  fixed.onclick = () => {hint.textContent='这根绳头绕过了盒底，越拉越紧。右下那段短绳尾才是活口。';};
  slip.onclick = () => {
    if (tied) return;
    board.classList.add('slip-turned');
    slip.setAttribute('aria-label','收寄邮戳，星期二');
    hint.textContent = '星期二就寄出了。你是星期五才接到这份短工的。包纸里面，有件硬东西。';
    $('parcel-unwrap').hidden = false;
    $('parcel-unwrap').focus({preventScroll:true});
    harborSound.cue('page');
  };
  $('parcel-unwrap').onclick = fitFrameFoot;
  drawTwine(0);
}

function fitFrameFoot() {
  const socket = {x:50,y:58};
  const rest = {x:64,y:84};
  let carrying = false;
  let reversed = true;
  let fitted = false;
  sheet('行李 · 旧相框','缺角的底座', `
    <div class="home-board home-frame-board" id="parcel-frame-board">
      <img draggable="false" class="home-board-image" src="${artUrl('frameback')}" alt="相框背板倒扣在旧木桌上">
      <button id="parcel-slot" class="home-frame-slot" aria-label="对合相框底缘的榫口" title="对合榫口"><i></i><i></i></button>
      <button id="parcel-foot" class="home-pickable home-frame-foot" aria-label="拿起木底座" title="拿起底座">
        <span class="home-foot-shape" aria-hidden="true"><i></i><i></i><b></b></span>
      </button>
    </div>
    <p class="home-object-hint" id="parcel-fit-hint" role="status">相框底缘的缺角在左。拿起底座，让两道木纹和缺角对上，再放进榫口。</p>
    <div class="home-object-tools"><button id="parcel-turn">调转底座</button><button id="parcel-finish" hidden>收进行李</button></div>`);
  panel.classList.add('home-dialog');
  const board = $('parcel-frame-board');
  const foot = $('parcel-foot');
  const slot = $('parcel-slot');
  const hint = $('parcel-fit-hint');
  board.style.setProperty('--home-wood', 'url("'+artUrl('frameback')+'")');

  function paint() {
    homeObjectPosition(foot,fitted?{x:socket.x,y:61}:rest);
    foot.classList.toggle('is-reversed',reversed);
    foot.classList.toggle('is-carried',carrying);
    slot.classList.toggle('expects-piece',carrying);
    foot.setAttribute('aria-pressed',String(carrying));
    foot.setAttribute('aria-label',fitted?'已经扣回相框的底座':'拿起木底座，缺角朝'+(reversed?'右':'左'));
  }
  function pick() {
    if (fitted) return;
    carrying = true;
    hint.textContent = '底座缺角朝'+(reversed?'右':'左')+'。调好朝向，再拖到框底凹槽，或点一下榫口。';
    paint();
  }
  function seatFoot() {
    if (fitted) return;
    if (!carrying) {hint.textContent='左榫的边缘缺了一角。先拿起桌面那块底座。';return;}
    if (reversed) {
      hint.textContent='右边的木角顶住了。把底座调个头，让缺角朝左再试。';
      return;
    }
    fitted = true;
    carrying = false;
    paint();
    foot.disabled = slot.disabled = true;
    $('parcel-turn').hidden = true;
    $('parcel-finish').hidden = false;
    hint.textContent='咔哒。两段木纹接成了一道。包裹里装着的，正是你落在岸上的相框底座。';
    mark('parcel');
    harborSound.cue('tap');
    $('parcel-finish').focus({preventScroll:true});
  }
  homeObjectPosition(slot,socket);
  homeCarryObject(foot,board,pick,point=>{
    if (Math.abs(point.x-socket.x)<15 && Math.abs(point.y-socket.y)<14) seatFoot();
    else hint.textContent='相框底缘，两道凹槽旁边有个浅色缺口。把底座移到那里。';
  },paint);
  slot.onclick = seatFoot;
  $('parcel-turn').onclick = () => {
    reversed=!reversed;
    carrying=true;
    hint.textContent='调过来了。现在底座的缺角朝'+(reversed?'右':'左')+'。';
    paint();
    slot.focus({preventScroll:true});
    harborSound.cue('page');
  };
  $('parcel-finish').onclick=closePanel;
  paint();
}

function setSeventhSeat() {
  if (!state.flags.chair) {
    say([['餐桌','六把椅子，六副碗筷。墙边还靠着一把折椅。']]);
    return;
  }
  if (state.flags.table) {
    say([['第七副碗筷','空碗里映着窗外的街灯。灯影晃了一下。']]);
    return;
  }
  const seats = {
    window: {x:50,y:36,name:'靠窗的折椅'},
    door: {x:26,y:59,name:'靠门的木凳'},
    aunt: {x:74,y:59,name:'阿姨的座位'}
  };
  const hand = {bowl:{x:40,y:90},sticks:{x:59,y:89}};
  const laid = {bowl:seats.window, sticks:{x:56,y:37}};
  // The six existing place settings follow the perspective of the painted table.
  const others = [[32,42,68,68],[68,42,110,68],[26,59,87,85],[74,59,98,85],[39,74,23,102],[61,74,-25,102]];
  let selected = null;
  let bowlDown = false;
  let inward = false;
  let done = false;
  sheet('家宴 · 摆桌','第七副碗筷', `
    <div class="home-board home-supper-board" id="supper-board">
      <img draggable="false" class="home-board-image" src="${artUrl('supperboard')}" alt="从门边看向圆桌，空折椅靠窗。桌面两侧已有人用的碗筷。">
      ${others.map(([x,y,angle,size])=>`<span class="home-set-place" aria-hidden="true" style="left:${x}%;top:${y}%;--set-size:${size/100};--set-angle:${angle}deg"><i class="home-china"></i><b></b></span>`).join('')}
      <div aria-hidden="true" class="home-supper-tray"></div>
      ${Object.entries(seats).map(([key,seat])=>`<button class="home-seat" id="supper-${key}" aria-label="${seat.name}" title="${seat.name}"><span>${seat.name}</span></button>`).join('')}
      <button class="home-pickable home-bowl" id="supper-bowl" aria-label="拿起瓷碗" title="拿起瓷碗"><span class="home-china" aria-hidden="true"></span></button>
      <button class="home-pickable home-sticks" id="supper-sticks" aria-label="拿起竹筷" title="拿起竹筷"><span aria-hidden="true"><i></i><i></i></span></button>
    </div>
    <p class="home-object-hint" id="supper-hint" role="status">阿姨拍了拍靠窗的折椅。拿起面前的空碗，拖到那张椅子前，也可以先点碗，再点座位。</p>
    <div class="home-object-tools"><button id="supper-turn" hidden>调转筷子</button><button id="supper-finish" hidden>松开手</button></div>`);
  panel.classList.add('home-dialog');
  const board = $('supper-board');
  board.style.setProperty('--home-wood','url("'+artUrl('frameback')+'")');
  const bowl = $('supper-bowl');
  const sticks = $('supper-sticks');
  const hint = $('supper-hint');
  const turn = $('supper-turn');
  const finish = $('supper-finish');
  const targets = Object.keys(seats);
  for (const key of targets) {
    const target = $('supper-'+key);
    homeObjectPosition(target,seats[key]);
    target.onclick = () => place(key);
  }

  function paint() {
    homeObjectPosition(bowl,bowlDown?laid.bowl:hand.bowl);
    homeObjectPosition(sticks,done?laid.sticks:hand.sticks);
    for (const [kind,node] of [['bowl',bowl],['sticks',sticks]]) {
      node.classList.toggle('is-carried',selected===kind);
      node.setAttribute('aria-pressed',String(selected===kind));
    }
    bowl.classList.toggle('is-laid',bowlDown);
    sticks.classList.toggle('is-laid',done);
    sticks.classList.toggle('tips-inward',inward);
    sticks.setAttribute('aria-label',done?'已经摆好的竹筷':'拿起竹筷，筷尖朝'+(inward?'桌心':'窗边'));
    board.classList.toggle('has-handful',!!selected);
    turn.hidden = !bowlDown || done;
  }

  function pick(kind) {
    if (done || (kind==='bowl' && bowlDown)) return;
    if (kind==='sticks' && !bowlDown) {
      hint.textContent='阿姨把空碗往你跟前推了推。先把碗摆好，筷子才有地方搁。';
      return;
    }
    selected = kind;
    hint.textContent = kind==='bowl'
      ? '碗底凉凉的。刚才搬来的那把折椅，挨着窗台。'
      : '阿姨比了比筷子的细头。“筷尖朝桌心，筷头留在手边。”';
    paint();
  }

  function place(key) {
    if (done) return;
    if (!selected) {
      hint.textContent=bowlDown?'碗已经放好了。拿起手边那双竹筷。':'碗和筷子就在手边。先拿起空碗，放在自己的座位前。';
      return;
    }
    if (key!=='window') {
      hint.textContent = key==='door'
        ? '“这里要走菜的。”阿姨指了指另一头，窗帘背后露出折椅的木背。'
        : '“我这里有呢。”阿姨按住自己的碗，望向窗边空着的那把椅子。';
      return;
    }
    if (selected==='bowl') {
      bowlDown = true;
      selected = null;
      bowl.disabled = true;
      bowl.setAttribute('aria-label','窗边摆好的瓷碗');
      hint.textContent='碗放稳了。阿姨递来竹筷。“筷尖朝桌心，筷头留在手边。”';
      paint();
      sticks.focus({preventScroll:true});
      harborSound.cue('tap');
      return;
    }
    if (!inward) {
      hint.textContent='细尖还冲着窗上的人影。调转竹筷，让细尖朝向桌子中央，再放到碗边。';
      return;
    }
    done = true;
    selected = null;
    sticks.disabled = true;
    for (const k of targets) $('supper-'+k).disabled = true;
    paint();
    finish.hidden = false;
    hint.textContent='第七副碗筷落了桌。人都笑了笑，还是没人先动筷子。';
    mark('table');
    harborSound.cue('tap');
    finish.focus({preventScroll:true});
  }

  function drop(point,kind) {
    if (selected!==kind) return;
    const key=targets.find(k=>Math.abs(point.x-seats[k].x)<15 && Math.abs(point.y-seats[k].y)<16);
    if (key) place(key);
    else hint.textContent='碗筷得落在座位跟前。沿着桌边找找刚刚搬来的那张折椅。';
  }
  for (const [kind,node] of [['bowl',bowl],['sticks',sticks]]) {
    homeCarryObject(node,board,()=>pick(kind),point=>drop(point,kind),paint);
  }
  turn.onclick = () => {
    if (!bowlDown || done) return;
    inward = !inward;
    selected = 'sticks';
    hint.textContent='竹筷在手里调了个头。细尖现在朝'+(inward?'桌子的中央。':'窗边。');
    paint();
    $('supper-window').focus({preventScroll:true});
    harborSound.cue('page');
  };
  finish.onclick=closePanel;
  paint();
}
