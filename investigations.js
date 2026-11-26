'use strict';

function lookBack() {
  const leave = () => {
    harborSound.endDoorway();
    harborSound.cue('keys');
    closePanel();
  };
  sheet('02 / 03','回头看门缝',
    '<div class="case-peek"><div class="dining-eye"></div><div class="ocean-distance"><i class="ocean-plate"></i><i class="whole-bus"></i></div><div class="peek-hall"></div><i class="peek-jamb"></i><i class="peek-edge"></i></div>'+
    '<label class="case-slider">把门推开一线<input id="peek-gap" type="range" min="0" max="100" value="0"></label><p id="peek-note" role="status">门外的菜篮轻轻碰着墙。</p>',
    [['合上门，回到楼道',leave]],leave);
  inner.querySelector('.dining-eye').append(supperFurniture(!!state.flags.chair,1));
  coastWeather.detail(inner.querySelector('.peek-hall'),'dryhall');
  coastWeather.detail(inner.querySelector('.ocean-plate'),'deep-water');
  $('peek-gap').oninput = event => {
    const value = Number(event.target.value);
    inner.querySelector('.case-peek').style.setProperty('--gap',value+'%');
    harborSound.doorway(1-value/100);
    $('peek-note').textContent = value>=55 ? '饭桌还在。窗里的末班车漂过了第二扇窗棂。' : '门外的菜篮轻轻碰着墙。';
    if(value>=55 && !state.flags.lookedBack) mark('lookedBack');
  };
}

function lampCopy() {
  const kin = !!state.flags.kin;
  const controls = '<div class="lamp-copy"><img class="lamp-child" alt="" src="'+artUrl('child')+'"><div class="lamp-slip"></div></div>';
  function draw(stage,message) {
    const clue = clues.rakingLight[1];
    const finish = reverse => {
      if(reverse!==kin){draw(1,'纸面发白。小满换了一只手，等你再试。');return;}
      harborSound.cue('page');mark('rakingLight');draw(2,clue);
    };
    const actions = stage===0 ? [[kin?'站到同侧':'把灯照给他看',()=>draw(1,kin?'小满捏住你的袖口。正面的纸纹把细字盖住了。':'他学着你把灯压低，站到了桌子对面。'),true]] :
      stage===1 ? [['摊平底联正面',()=>finish(false)],['翻到底联背面',()=>finish(true)]] : [['合上笔记',closePanel,true]];
    sheet('1912 / 1956 / 1998','请小满举灯',controls+'<p class="panel-text">'+message+'</p>',actions);
    const scene=inner.querySelector('.lamp-copy');coastWeather.detail(scene,'archive');
    scene.dataset.side=stage===0?'waiting':kin?'near':'far';
    if(stage===2){scene.classList.add('lit');scene.querySelector('.lamp-slip').textContent='明日迁';}
  }
  draw(0,kin?'妈妈，我抓着你。别走到桌子那边。':'姐姐，你先照给我看。我怕把字照没了。');
}

function listenAtSurface(id) {
  const materials={casing:['贴耳听木壳',50,clues.casingEcho[1],'relay-answer'],doorEar:['贴耳听门板',67,'木头后面响起两下敲击。孩子把小凳子拖到了门边。','knock'],pipe:['贴耳听暖气管',32,'椅脚刮过楼下的地面。一下短，一下长。','pipe-scrapes']};
  const [title,source,discovery,cue]=materials[id];
  const leave=()=>{harborSound.endSurfaceContact();closePanel();};
  sheet('FIELD',title,'<div class="case-casing" data-material="'+id+'"><i></i><b></b></div>'+
    '<label class="case-slider">听音位置<input type="range" min="0" max="100" value="12" id="casing-range"></label>'+
    '<p class="caption">按住表面移动，找出震动的源头。也可以用方向键移动，空格复听。</p><p id="casing-note" role="status">远处只有低鸣。</p>',[['合上笔记',leave]],leave);
  const face=inner.querySelector('.case-casing'),range=$('casing-range');
  let last=-1, pressed=false;
  const release=()=>{pressed=false;harborSound.endSurfaceContact();};
  function listen() {
    const x=Number(range.value), distance=Math.abs(x-source);
    const band=distance<7?2:distance<22?1:0;
    face.style.setProperty('--finger',x+'%');
    face.style.setProperty('--strength',String(Math.max(.08,1-distance/48)));
    if(pressed)harborSound.surfaceContact(id,Math.max(0,1-distance/48));
    if(last===band)return;
    last=band;
    $('casing-note').textContent=['远处只有低鸣。','声音近了。手指底下有轻微的震动。',discovery][band];
    harborSound.cue(['page','tap',cue][band]);
    if(id==='casing' && band===2 && !state.flags.casingEcho)mark('casingEcho');
    if(id==='pipe' && band===2 && !state.flags.pipeScrapes)mark('pipeScrapes');
  }
  function touch(event){
    const rect=face.getBoundingClientRect();
    range.value=Math.round(100*(event.clientX-rect.left)/rect.width);
    listen();
  }
  face.onpointerdown=e=>{face.setPointerCapture(e.pointerId);pressed=true;last=-1;touch(e);};
  face.onpointermove=e=>{if(face.hasPointerCapture(e.pointerId))touch(e);};
  face.onlostpointercapture=release;
  range.onpointerdown=()=>{pressed=true;last=-1;listen();};
  range.onpointerup=range.onpointercancel=range.onblur=release;
  range.oninput=listen;
  range.onkeyup=e=>{if(e.code==='Space')release();};
  range.onkeydown=e=>{if(e.code==='Space'){e.preventDefault();if(!e.repeat){pressed=true;last=-1;listen();}}};
}

const caseStore='harbor.casefiles.v1.';
const ports=['甲','乙','丙'];
const evidenceNames=['摸碗底','沿桌沿查水印','伏地听楼下'];
const evidenceText=['碗心是凉的，只有碗底一圈温热。有人刚从灶边把它端来。','水印到桌边就断了。小小的掌印朝着门，指尖没有碰到碗。','楼下响起拖椅声。隔着地板，碗里的水纹才动了一下。'];
const caseMemory={};
function caseData(id) {
  if(caseMemory[id])return caseMemory[id];
  let raw;
  try {raw=JSON.parse(localStorage.getItem(caseStore+id));} catch {}
  const defaults=id==='night'?{phase:0,callBeat:0,port:-1,heard:0,log:[],tool:'cord'}:{seen:0,clips:0};
  return caseMemory[id]=Object.assign(defaults,raw,{done:raw?.done===true});
}
function saveCase(id) {
  try {localStorage.setItem(caseStore+id,JSON.stringify(caseMemory[id]));} catch {}
}
function resetCase(id,open) {
  delete caseMemory[id];
  try {localStorage.removeItem(caseStore+id);} catch {}
  open();
}
function openCaseFiles(){
  harborSound.stopExchange();
  sheet('CASE FILES','独立案件','<div class="case-files"></div>',[['返回',closePanel]]);
  for(const [name,subtitle,art,open] of [
    ['通讯局夜班','已经挂断的人','switchboard',openNightShift],
    ['异闻复勘','第七副碗筷是谁用过的？','dinner',openSupperCase]
  ]){
    const b=button('',open);
    b.innerHTML='<img alt="" src="'+artUrl(art)+'"><span><b>'+name+'</b><small>'+subtitle+'</small></span>';
    inner.querySelector('.case-files').append(b);
  }
}
document.getElementById('case-files').onclick=openCaseFiles;

const shiftEvents={
  cradle:['放回听筒','exchange-Click'], insert:['插线','plug-in'], remove:['拔线','plug-out'], shore:['两声短铃。岸线接通又挂断。','exchange-Shore'],
  tower:['一声长铃。塔台挂断后，桌底又响了一声。','exchange-Tower'], silent:['空线，没有回铃。','exchange-IdleJack'],
  echo:['空线。听筒里却有两下回铃。','relay-answer'], idle:['摇柄空转。','tap'],wrong:['这条线路和交班单不符。','exchange-IdleJack']
};
function openNightShift(){
  const s=caseData('night');
  let timer;
  function stop(){clearTimeout(timer);harborSound.stopExchange();}
  function back(){stop();openCaseFiles();}
  function log(type,port){
    s.log.push([type,port]);
    harborSound.cue(shiftEvents[type][1]);
    saveCase('night');draw(shiftEvents[type][0]);
  }
  function jack(index) {
    if(s.tool==='probe'){
      if(s.port!==-1){draw('线路还连着。先拔线才能排除串音。');return;}
      const echo=s.phase===2 && index===1;
      if(s.phase===2)s.heard |= 1<<index;
      log(echo?'echo':'silent',index);return;
    }
    if(s.port!==-1 && s.port!==index){draw('先拔起原孔上的插头。');return;}
    const remove=s.port===index;
    s.port=remove?-1:index;
    log(remove?'remove':'insert',index);
  }
  function ring(){
    if(s.port<0){log('idle',-1);return;}
    if((s.phase===0 && s.port===2)||(s.phase===1 && s.port===0)){
      s.log.push([s.phase===0?'shore':'tower',s.port]);
      s.callBeat=1;saveCase('night');call();return;
    }
    log('wrong',s.port);
  }
  function call(){
    const shore=s.phase===0;
    const lines=shore ? [
      '两声短铃之间隔了一口气。远处有人推开了窗。',
      '岸边的报时员问，今晚的钟慢了几分。铅笔敲了两下，随后只有海风。'
    ] : [
      '塔台只响一声长铃。值班人报完平安，把听筒搁回了木架。',
      '听筒已经静了。桌板下传来第二声，台面上一圈灰轻轻跳了一下。'
    ];
    const listening=s.callBeat===1;
    const advance=()=>{
      if(listening){s.callBeat=2;saveCase('night');call();return;}
      s.callBeat=0;s.phase++;log('cradle',s.port);
    };
    harborSound.cue(listening?(shore?'exchange-Shore':'exchange-Tower'):(shore?'exchange-Click':'relay-answer'));
    sheet('NIGHT SHIFT',shore?'岸线':'灯塔','<div class="night-face night-line" data-signal="'+(shore?'short':'long')+'"></div><p class="panel-text">'+lines[s.callBeat-1]+'</p>',
      [[listening?'继续听':'放回听筒',advance,true]],back);
  }
  function report(message='断线之后，哪个孔仍有回铃？'){
    sheet('LOG / 02','签值机簿','<p class="panel-text">'+message+'</p>',[
      ...ports.map((p,i)=>[p,()=>{
        if(s.port!==-1 || !(s.heard & 2)){draw('还缺实测记录。拔线后再听一次。');return;}
        if(i!==1){draw('签错栏了。翻回实测记录再听。');return;}
        s.done=true;saveCase('night');archive();
      }]),['返回',()=>draw()]
    ],back);
  }
  function archive(){
    stop();
    sheet('LOG / 02','当班回放','<p>停用孔在断线后回铃。你的操作顺序已附在值机簿背面。</p><ol class="shift-log"></ol>',[
      ['重听当班操作',replay,true],['重开此案',()=>{stop();resetCase('night',openNightShift);}],['返回案件架',back]
    ],back);
    const list=inner.querySelector('.shift-log');
    for(const [type,port] of s.log){
      const li=document.createElement('li');
      li.textContent=(ports[port]?ports[port]+' · ':'')+shiftEvents[type][0];list.append(li);
    }
    function replay(){
      stop();
      let step=0;
      function next(){
        list.querySelector('.current')?.classList.remove('current');
        if(step>=s.log.length)return;
        const row=list.children[step];
        row.classList.add('current');list.scrollTop=row.offsetTop;
        harborSound.cue(shiftEvents[s.log[step++][0]][1]);
        timer=setTimeout(next,1000);
      }
      next();
    }
  }
  function draw(message=''){
    const instructions=['交班单：甲接塔台，一长声。丙接岸线，两短声。乙已停用。先接岸线，记住正常的回铃。','第二通来自塔台。接好后摇铃，等对方挂机。','对方挂了。拔掉最后一根绳，再用试线听筒逐孔复听。'];
    sheet('NIGHT SHIFT','已经挂断的人','<p>'+instructions[s.phase]+'</p><div class="night-face"></div><div class="case-tools"></div><p role="status">'+message+'</p>',s.phase===2?[['签值机簿',()=>report(),true]]:[],back);
    const face=inner.querySelector('.night-face');
    ports.forEach((p,i)=>{
      const b=button(p,()=>jack(i));b.dataset.port=i;b.setAttribute('aria-pressed',s.port===i);
      b.style.left=(switchboardJacks[i].x/640*100)+'%';face.append(b);
      if(s.port===i){
        const lead=document.createElement('canvas');
        lead.width=640;lead.height=360;face.append(lead);
        const ctx=lead.getContext('2d'),x=switchboardJacks[i].x;
        ctx.beginPath();ctx.moveTo(232,284);ctx.bezierCurveTo(261,310,x-34,253,x-16,205);
        ctx.lineCap='round';
        for(const [width,ink] of [[6,'#252525'],[3,'#c6c6c6']]){
          ctx.lineWidth=width;ctx.strokeStyle=ink;ctx.stroke();
        }
        const plug=new Image();plug.src=artUrl('plug-white');plug.alt='';plug.style.left=b.style.left;face.append(plug);
      }
    });
    const tools=inner.querySelector('.case-tools');
    for(const [id,label] of [['cord','白绳插拔'],['probe','逐孔复听']]){
      const b=button(label,()=>{s.tool=id;saveCase('night');draw();});
      b.setAttribute('aria-pressed',s.tool===id);tools.append(b);
    }
    tools.append(button('摇铃',ring));
    const sound=button(harborSound.enabled?'声音开':'声音关',toggleGameSound,'case-sound');
    tools.append(sound);
  }
  if(s.done)archive();else if(s.callBeat)call();else draw();
}

function openSupperCase(){
  const s=caseData('supper');
  function draw(message=''){
    sheet('REOPENED / 02','第七副碗筷是谁用过的？','<div class="supper-inquest"></div><p role="status">'+message+'</p>',s.seen?[['夹入两条证据',()=>file(),true]]:[],openCaseFiles);
    const face=inner.querySelector('.supper-inquest');coastWeather.detail(face,'dinner');
    evidenceNames.forEach((name,i)=>{
      const b=button(name,()=>{
        s.seen |= 1<<i;saveCase('supper');
        harborSound.cue(['tap','wet-paper','stool'][i]);draw(evidenceText[i]);
      });
      b.dataset.evidence=i;b.setAttribute('aria-pressed',!!(s.seen & 1<<i));face.append(b);
    });
  }
  function file(message=''){
    sheet('FIELD NOTES','夹入两条证据','<div class="evidence-list"></div><p role="status">'+message+'</p>',[['返回',()=>draw()],['确认记录',conclude,true]],openCaseFiles);
    const list=inner.querySelector('.evidence-list');
    evidenceText.forEach((line,i)=>{
      if(!(s.seen & 1<<i))return;
      const b=button(line,()=>{
        if(!(s.clips & 1<<i) && [3,5,6].includes(s.clips))return;
        s.clips ^= 1<<i;saveCase('supper');file();
      });
      b.dataset.clip=i;b.setAttribute('aria-pressed',!!(s.clips & 1<<i));list.append(b);
    });
    inner.querySelector('.accent').disabled=![3,5,6].includes(s.clips);
  }
  function conclude(){
    sheet('FIELD NOTES','谁坐过这里？','',[
      ['小满已经吃过了',()=>file('这只能说明有人挪过椅子。再看是谁碰到了碗。')],
      ['无人落座，碗刚摆好',()=>{
        if(s.clips!==3){file('这只能说明有人挪过椅子。再看是谁碰到了碗。');return;}
        s.done=true;saveCase('supper');closed();
      }]
    ],openCaseFiles);
  }
  function closed(){
    sheet('CLOSED / 02','异闻复勘','<p class="panel-text">结案：第七个座位一直空着。有人替还没到的人温着碗。</p><ul class="notelist">'+evidenceText.slice(0,2).map(t=>'<li>'+t+'</li>').join('')+'</ul>',[['重开此案',()=>resetCase('supper',openSupperCase)],['返回案件架',openCaseFiles,true]],openCaseFiles);
  }
  if(s.done)closed();else draw();
}

function landingIsDark(s) {
  return s.room==='landing' && !s.flags.parcel && !s.flags.parcelLight;
}

function searchDarkLanding() {
  const fixed=!!state.flags.foundRail;
  const title=fixed?'应急灯下的吊牌':'手电筒';
  const instruction=fixed?'灯固定在墙上。把吊牌挪进那束斜光里。':'沿着扶手慢慢扫。黑暗里有一截缠着白布的铁栏。';
  sheet('17:56',title,'<div id="light-search" class="'+(fixed?'fixed-lamp':'hand-lamp')+'"><i class="rail-wrap"></i><i class="emergency-cone"></i><b class="luggage-tag"><span>林遥</span></b><i class="torch-dark"></i></div>'+
    '<label class="case-slider">'+(fixed?'移动吊牌':'移动手电光束')+'<input id="light-aim" type="range" min="0" max="100"></label><p class="caption" id="light-hint" aria-live="polite"></p>',
    [[fixed?'记住吊牌的位置':'扶着铁栏往前走',advance,true]]);
  const view=$('light-search'),slider=$('light-aim'),action=inner.querySelector('.accent');
  slider.value=fixed?20:12;
  let aligned=false;
  function paint(){
    const x=Number(slider.value);
    aligned=Math.abs(x-(fixed?70:43))<=8;
    view.style.setProperty('--aim',x+'%');
    view.classList.toggle('in-light',aligned);
    action.disabled=!aligned;
    const text=aligned?(fixed?'光擦过纸面，压痕里浮出你的名字。包裹就在这盏灯下面。':'白布往右垂着。布结下面的铁栏是干的，可以扶。'):instruction;
    if($('light-hint').dataset.line!==text){$('light-hint').dataset.line=text;$('light-hint').textContent=text;}
  }
  function aim(event){const r=view.getBoundingClientRect();slider.value=(event.clientX-r.left)/r.width*100;paint();}
  view.onpointerdown=e=>{view.setPointerCapture(e.pointerId);aim(e);};
  view.onpointermove=e=>{if(view.hasPointerCapture(e.pointerId))aim(e);};
  slider.oninput=paint;paint();slider.focus({preventScroll:true});
  if(fixed){
    harborSound.cue('following-step');
    view.classList.add('passing-shadow');
    $('light-hint').textContent='你停下脚。后面那一步，晚了半拍。'+' '+instruction;
    $('light-hint').dataset.line='';
  }
  function advance(){
    if(!aligned)return;
    if(!fixed){
      mark('foundRail');closePanel();approach('torch');
    }else{
      mark('parcelLight');harborSound.cue('page');closePanel();
    }
  }
}
