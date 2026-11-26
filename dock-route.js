'use strict';

// Place Lin beside the door she just used. The dike's refuge still governs a
// reload or a retreat from the dragger after she is back on the stones.
function dockArrival(from,to){
  const arrivals={
    'causeway/waitingRoom':[21,1], 'waitingRoom/causeway':[17,1],
    'waitingRoom/lostOffice':[19,1], 'lostOffice/waitingRoom':[89.2,-1],
    'lostOffice/exchange':[92,-1], 'exchange/lostOffice':[86,-1]
  };
  return arrivals[from+'/'+to];
}

function speakAtPier(){
  const f=state.flags;
  const line=f.oldRollCorrected?'十六，十八。中间那一下……我刚才一直在等。':
    f.unclaimedName?'她怕女儿白跑一趟，连在哪个门口等都写下来了。':
    f.heardProxy?'我嘴巴闭着呢。刚才那声「到」是窗户那头的。':
    f.kin?'妈妈，你去吧。我给你抵着门，这门一松手就关上了。':'姐姐，我帮你顶着门。你回来的时候轻轻拉一下就开了。';
  say([['小满',line]]);
}

function deliveryHatch(){
  if(state.flags.deliveryStair){moveRoom('exchange');return;}
  sheet('PORT MAIL','投递梯','<p class="panel-text">门底贴着楼下吹上来的小纸屑。送件人的手常摸的地方，铁闩已经磨亮了。</p>',[
    ['松开内闩',()=>{
      mark('deliveryStair');harborSound.cue('dock-bolt');moveRoom('exchange');
    },true],['留在招领间',closePanel]
  ]);
}

// The harbour census in the tower is historical. Correcting a 1998 call must
// not touch tonight's manifest or the evidence for any of the four endings.
function openOldRollSlip(){
  sheet('1998 / 17','值班牌的纸角','<div class="dock-slip-study"><button class="dock-fold" type="button"><span>掀起纸角</span></button></div><p class="caption">旧告示下面压着一层薄纸，边上有两个钉眼。</p>');
  const fold=inner.querySelector('.dock-fold');
  function uncover(){
    if(fold.disabled)return;
    fold.disabled=true;fold.classList.add('lifted');
    fold.innerHTML='<small>汛期末班</small><b>17</b><span>有应声</span><i aria-hidden="true"></i>';
    inner.querySelector('.caption').textContent=clues.dockNotice[1];
    if(!state.flags.dockNotice)mark('dockNotice');
    harborSound.cue('wet-paper');
  }
  if(state.flags.dockNotice)uncover();else fold.onclick=uncover;
}

function appendRollTab(epilogueClose){
  const tab=button(state.flags.oldRollCorrected?'十七号的留岸联':'夹在索引里的点名页',
    ()=>openDockLedger(epilogueClose||towerIndex),'roll-tab');
  const heading=document.createElement('small');heading.textContent='1998 / 17';
  tab.prepend(heading);inner.querySelector('.panel-actions').before(tab);
}

function openDockLedger(back){
  const filed=!!state.flags.oldRollCorrected;
  const body='<div class="dock-book'+(filed?' certified':'')+'">'+
    '<div class="roll-book-title">汛期末班</div><div class="roll-book-date">1998</div>'+
    '<div class="roll-left"><small>点名底册</small><p>17</p><strong>周桂兰</strong><span>有应声</span></div>'+
    '<div class="roll-right"><small>登船核验</small><span>船票未剪</span><button class="roll-seal" type="button"'+(filed?' disabled':'')+'>'+(filed?'留岸':'在留岸栏盖章')+'</button></div></div>'+
    '<p class="panel-text" role="status"></p>';
  sheet('1998 / 17','旧航班点名页',body,[['合上点名页',back,true]],back);
  const note=inner.querySelector('[role=status]'),seal=inner.querySelector('.roll-seal');
  const filedLine='名字还在。旁边多了一方小印：留岸。广播报过十六号，接着就叫了十八号。';
  note.textContent=filed?filedLine:'应声那栏有勾，验票那栏是空的。周桂兰的针线包摊在我手边，她那晚在岸上等女儿。';
  if(filed)return;
  seal.onclick=()=>{
    if(state.flags.oldRollCorrected)return;
    mark('oldRollCorrected');inner.querySelector('.dock-book').classList.add('certified');
    seal.textContent='留岸';seal.disabled=true;note.textContent=filedLine;
    harborSound.cue('stamp');
    // Give the player time to hear the missing call. Leaving the ledger or
    // moving to another room cancels the reminder before it can start.
    const leaf=inner.querySelector('.dock-book');
    for(const [number,delay] of [[16,440],[18,2370]]){
      setTimeout(()=>{if(leaf.isConnected&&panel.open&&!document.hidden)harborSound.cue('dock-call',number);},delay);
    }
  };
}
