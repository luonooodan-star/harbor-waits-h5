'use strict';

const harborMapPlaces = {
  rental: {name:'海边出租屋', short:'出租屋', x:77, y:80.8, note:'海城居民楼里的短租房。出门便是连通各户的楼廊。'},
  homes: {name:'居民楼与连廊', short:'居民楼', x:58.2, y:66.1, note:'从家宴所在的楼层沿连廊向上，可以抵达档案馆。'},
  archive: {name:'悬空档案馆', short:'档案馆', x:44.6, y:46.2, note:'档案馆外廊通向两条水路，左边是末班渡口，另一边是旧排水闸。'},
  ferry: {name:'末班渡口', short:'渡口', x:14.5, y:63.5, note:'档案馆下方的水路。沿渡口登船可以去旧育养所。'},
  drain: {name:'旧排水闸', short:'排水闸', x:83.8, y:55.3, note:'另一条通往旧育养所的水路。潮位尺立在闸轮旁边。'},
  nursery: {name:'旧育养所', short:'育养所', x:24.7, y:29.5, note:'两条水路在这片岸上会合。从育养所出去，路通到通讯局。'},
  exchange: {name:'海城通讯局', short:'通讯局', x:78.6, y:26.8, note:'局内有旧接线台。侧门通往退信室，扶梯通向海堤。'},
  returns: {name:'退信室', short:'退信室', x:88, y:36.5, note:'通讯局侧门里的小屋。靠墙是分拣架，投递回执在窗口核对。'},
  causeway: {name:'拖锚的海堤', short:'堤道', x:75, y:19.1, note:'通讯局与灯塔之间的石堤。铁门设在靠近灯塔的一端。'},
  waitingRoom:{name:'废弃候船室',short:'候船室',x:27,y:17.5,note:'老渡口的候船室藏在堤岸下面。临海的窗破了一角，长椅后面还有一扇招领窗。'},
  lostOffice:{name:'失物招领间',short:'招领间',x:43,y:34,note:'渡口以前在这里登记落下的东西。隔墙就是通讯局的投递梯。'},
  signalhut:{name:'旧雾号房', short:'旧雾号房', x:85,y:12,note:'沿岸有两条路，木阶通往雾号房，石阶下到涵洞。'},
  culvert:{name:'塔下涵洞',short:'塔下涵洞',x:51,y:21,note:'栅门后面就是灯塔的石阶。'},
  tower: {name:'灯塔', short:'灯塔', x:63.5, y:13.5, note:'海城最高处，内梯从塔脚通往值班室。'},
  shore: {name:'妹妹的新家', short:'岸上', x:12, y:89, note:'周日早上八点，海城以外的岸上。'}
};
const harborMapEdges = [
  ['rental','homes'], ['homes','archive'], ['archive','ferry'], ['archive','drain'],
  ['ferry','nursery'], ['drain','nursery'], ['nursery','exchange'], ['exchange','returns'],
  ['exchange','causeway'], ['causeway','signalhut'], ['causeway','culvert'], ['signalhut','tower'], ['culvert','tower'],
  ['causeway','waitingRoom'], ['waitingRoom','lostOffice'], ['lostOffice','exchange']
];
const harborMapRooms = {room:'rental', landing:'homes', dinner:'homes', flood:'homes', hall:'homes',stairs:'tower'};

function openRouteMap(onClose=closePanel) {
  const close = typeof onClose === 'function' ? onClose : closePanel;
  const session = playing && state ? state : null;
  const ending = session?.room === 'after' ? endings[session.ending] : null;
  const current = ending ? ({home:'shore', aunt:'homes', names:'archive', city:'homes'})[session.ending]
    : session ? harborMapRooms[session.room] || session.room : null;
  const currentName = ending?.place || (session ? locations[session.room].title : '');
  const letterTrial = session && activeSlot === returnSaveKey;
  const ids = Object.keys(harborMapPlaces).filter(id => id !== 'shore' || current === 'shore');
  let chosen = current || 'rental';
  let dockDetail = current==='waitingRoom'||current==='lostOffice';
  const dockPlaces = new Set(['waitingRoom','lostOffice','exchange','causeway','tower','signalhut','culvert']);

  const layout =
    '<div class="route-toolbar"><span id="route-position"></span>'+
      '<button type="button" id="route-fold" aria-expanded="true" aria-controls="route-chart">折起全图</button></div>'+
    '<div class="route-spread" id="route-spread">'+
      '<figure class="route-chart" id="route-chart"><button type="button" id="route-scale" aria-pressed="false"></button><div class="route-chart-plate">'+
        '<img class="route-art" src="'+artUrl('map')+'" alt="海城港区全图，居民区在下方，灯塔在最高处。">'+
        '<canvas width="600" height="900" id="route-lines" aria-hidden="true"></canvas>'+
        '<div id="route-pins" role="group" aria-label="选择地图上的地点"></div>'+
      '</div><figcaption id="route-legend"></figcaption></figure>'+
      '<section class="route-information" id="route-information" aria-labelledby="route-name">'+
        '<h3 id="route-name" tabindex="-1"></h3><p id="route-detail"></p>'+
        '<p id="route-history" class="route-history" hidden></p>'+
        '<div id="route-local" hidden><p class="route-task" id="route-task"></p><div id="route-targets" aria-label="本场景调查点"></div></div>'+
        '<div id="route-neighbors"></div><button type="button" id="route-locate">在图中定位</button>'+
      '</section>'+
    '</div>';
  sheet('COASTAL SURVEY', '海城地图', layout, [['合上地图',close,true]], close);
  panel.classList.add('route-dialog');
  $('route-position').textContent = session
    ? (letterTrial ? '退信室试阅 · ' : '') + '当前位置　' + currentName : '港区路线总图';
  const flags = session?.flags || {};
  const branch = flags.boarded ? 'ferry' : flags.drained ? 'drain' : '';
  const letterDone = flags.signedReceipt || flags.keptLetter;
  $('route-legend').textContent = session && ((branch && !letterTrial) || (current === 'returns' && !letterTrial) || letterDone || flags.sawWaitingRoom || flags.sawLostOffice)
    ? '虚线为港区通路，实线标出已经走过的支路。' : '沿虚线选择地名。';

  function walked(a,b) {
    if (!session) return false;
    if(a==='lostOffice'&&b==='exchange')return !!flags.deliveryStair;
    if(b==='waitingRoom')return !!flags.sawWaitingRoom;
    if(b==='lostOffice')return !!flags.sawLostOffice;
    if(a==='signalhut'||b==='signalhut')return !!flags.signalAnswered;
    if(a==='culvert'||b==='culvert')return !!flags.viaCulvert;
    if (b === 'returns') return letterDone || (current === 'returns' && !letterTrial);
    return !letterTrial && branch && (a === branch || b === branch);
  }

  // Reframe the same survey plate around the upper quay. Pins and ink share
  // the same projection so the larger chart stays navigable on a narrow phone.
  function project(p){
    return dockDetail?{x:(p.x-12)/.85,y:(p.y-2)/.39}:p;
  }
  function scaleChart(){
    const chart=$('route-chart'),art=chart.querySelector('.route-art'),toggle=$('route-scale');
    chart.classList.toggle('dock-detail',dockDetail);
    art.style.width=dockDetail?100/.85+'%':'100%';art.style.height=dockDetail?100/.39+'%':'100%';
    art.style.left=dockDetail?-12/.85+'%':'0';art.style.top=dockDetail?-2/.39+'%':'0';
    toggle.setAttribute('aria-pressed',String(dockDetail));toggle.textContent=dockDetail?'返回港区全图':'展开堤岸详图';
    for(const pin of $('route-pins').children){
      const place=pin.dataset.place,point=project(harborMapPlaces[place]);
      pin.hidden=dockDetail&&!dockPlaces.has(place);
      pin.style.left=point.x+'%';pin.style.top=point.y+'%';
      pin.classList.toggle('to-left',point.x>64);
    }
    drawLines();placeLabels();
  }

  function placeLabels(){
    const plate=$('route-chart')?.querySelector('.route-chart-plate');
    if(!plate?.offsetWidth)return;
    const width=plate.clientWidth,height=plate.clientHeight;
    const marks=[...$('route-pins').children].filter(pin=>!pin.hidden).map(pin=>{
      const p=project(harborMapPlaces[pin.dataset.place]),label=pin.querySelector('span');
      return {pin,label,x:p.x*width/100,y:p.y*height/100,w:label.offsetWidth,h:label.offsetHeight};
    });
    // Preserve the survey coordinates. Set type beside each pin, with a fine
    // leader when a long place name has to move around another location.
    const occupied=marks.map(({x,y})=>({x:x-6,y:y-6,w:12,h:12}));
    const overlap=(a,b)=>Math.max(0,Math.min(a.x+a.w+2,b.x+b.w)-Math.max(a.x-2,b.x))*
      Math.max(0,Math.min(a.y+a.h+2,b.y+b.h)-Math.max(a.y-2,b.y));
    marks.sort((a,b)=>a.y-b.y);
    for(const {pin,x,y,w,h} of marks){
      let best,score=Infinity;
      const preferred=x>width*.59?-1:1;
      for(let band=0;band<=8;band++){
        const shifts=band?[band*(h+3)/2,-band*(h+3)/2]:[0];
        for(const dy of shifts)for(const side of [preferred,-preferred]){
          const raw=x+(side>0?8:-8-w),left=Math.max(2,Math.min(width-w-2,raw));
          const top=Math.max(2,Math.min(height-h-2,y-h/2+dy));
          const r={x:left,y:top,w,h};
          const ink=occupied.reduce((n,b)=>n+overlap(r,b),0);
          const cost=ink*100+Math.abs(dy)+Math.abs(left-raw)*1.4+(side===preferred?0:4);
          if(cost<score){score=cost;best=r;}
        }
      }
      occupied.push(best);
      const dx=best.x-x,dy=best.y-y;
      pin.style.setProperty('--label-x',dx+'px');pin.style.setProperty('--label-y',dy+'px');
      const tipX=Math.max(best.x,Math.min(best.x+w,x))-x,tipY=Math.max(best.y,Math.min(best.y+h,y))-y;
      pin.style.setProperty('--leader-length',Math.hypot(tipX,tipY)+'px');
      pin.style.setProperty('--leader-angle',Math.atan2(tipY,tipX)+'rad');
      pin.classList.add('typeset');
    }
  }
  function drawLines() {
    const canvas = $('route-lines'), pen = canvas.getContext('2d');
    if (!pen) return;
    pen.clearRect(0,0,canvas.width,canvas.height);
    for (const [a,b] of harborMapEdges) {
      if(dockDetail&&!(dockPlaces.has(a)&&dockPlaces.has(b)))continue;
      if(a==='lostOffice'&&b==='exchange'&&!flags.deliveryStair)continue;
      const start = project(harborMapPlaces[a]), end = project(harborMapPlaces[b]);
      // Ink the route as a shallow bend above the houses, keeping every station visible.
      const x1 = start.x*6, y1 = start.y*9, x2 = end.x*6, y2 = end.y*9;
      const bend = (a === 'archive' && b === 'drain') || b === 'returns' ? 16 : -12;
      pen.beginPath();
      pen.moveTo(x1,y1);
      pen.quadraticCurveTo((x1+x2)/2+bend,(y1+y2)/2,x2,y2);
      pen.setLineDash([]);
      pen.strokeStyle = 'rgba(18,18,18,.72)';
      pen.lineWidth = 5;
      pen.stroke();
      pen.setLineDash(walked(a,b) ? [] : [6,5]);
      pen.strokeStyle = walked(a,b) ? '#e1e1e1' : '#c4c4c4';
      pen.lineWidth = walked(a,b) ? 3 : 2;
      pen.stroke();
    }
  }

  function history(id) {
    if (!session) return '';
    if(id==='lostOffice'&&flags.deliveryStair)return '内闩已经卸下，从招领间可以沿投递梯回通讯局。';
    if (id === 'returns' && flags.signedReceipt) return '回执上留着许荣生自己的签名。';
    if (id === 'returns' && flags.keptLetter) return '林遥按许荣生的原名收下了信。';
    if (letterTrial && (id === 'returns' || id === 'ferry')) return flags.erased
      ? '退信抵达以前，许荣生的船位已经注销。' : '退信抵达以前，许荣生保留了船位。';
    if (id === 'ferry' && flags.erased) return flags.boarded ? '已从这里登上末班船。许荣生的船位被注销了。' : '末班船的名册上，许荣生的船位已经注销。';
    if (id === 'drain' && flags.drained) return '已经开过西岸闸，从这里到了旧育养所。';
    if (id === 'archive' || id === 'nursery') {
      if (branch && !letterTrial) return branch === 'ferry' ? '本次来路经过末班渡口。' : '本次来路经过旧排水闸。';
    }
    return '';
  }

  function localTargets() {
    const local = $('route-local'), targetBox = $('route-targets');
    local.hidden = !session || current !== chosen;
    targetBox.replaceChildren();
    if (local.hidden) return;
    if (session.finished) {
      $('route-task').textContent = '这段余生已经收进结局档案。';
      return;
    }
    const [task, goal] = objective(session);
    $('route-task').textContent = $('hint').open?'当前调查　'+task:'';
    for (const [id,label,,,flag] of fieldTargets(session)) {
      const action = button('', () => {
        if (!playing || state !== session || state.finished || !fieldTargets(state).some(item=>item[0]===id)) return;
        closePanel();
        approach(id);
      }, 'route-target');
      action.id = 'route-target-'+id;
      action.setAttribute('aria-label','前往调查'+label);
      action.classList.toggle('current-target',$('hint').open && id===goal);
      const marker = document.createElement('span');
      marker.setAttribute('aria-hidden','true');
      marker.textContent = $('hint').open && id === goal ? '◆' : flag && flags[flag] ? '✓' : '◇';
      action.append(marker,document.createTextNode(label));
      targetBox.append(action);
    }
  }

  function select(id, reveal=false) {
    chosen = id;
    if(dockDetail&&!dockPlaces.has(id)){dockDetail=false;scaleChart();}
    const place = harborMapPlaces[id];
    for (const pin of $('route-pins').children) {
      pin.setAttribute('aria-pressed',String(pin.dataset.place === id));
    }
    $('route-name').textContent = chosen === current ? currentName : place.name;
    $('route-detail').textContent = place.note;
    const record = history(chosen);
    $('route-history').textContent = record;
    $('route-history').hidden = !record;
    localTargets();
    const nearby = $('route-neighbors');
    nearby.replaceChildren();
    const connected = harborMapEdges.filter(([a,b])=>(a===id||b===id)&&!(a==='lostOffice'&&b==='exchange'&&!flags.deliveryStair)).map(edge => edge[0] === id ? edge[1] : edge[0]);
    if (connected.length) {
      const label = document.createElement('h4');
      label.textContent = '相邻片区';
      nearby.append(label);
      for (const neighbor of connected) {
        const b = button(harborMapPlaces[neighbor].short,() => select(neighbor,true),'route-neighbor');
        b.setAttribute('aria-label','在地图上查看'+harborMapPlaces[neighbor].name);
        nearby.append(b);
      }
    }
    if (reveal) {
      $('route-name').focus({preventScroll:true});
      if (matchMedia('(max-width: 640px)').matches) $('route-information').scrollIntoView({block:'nearest'});
    }
  }

  for (const id of ids) {
    const place = harborMapPlaces[id];
    const pin = button('', () => select(id,true),'route-pin');
    pin.id = 'route-pin-'+id;
    pin.dataset.place = id;
    pin.style.left = place.x + '%';
    pin.style.top = place.y + '%';
    pin.classList.toggle('to-left',place.x > 65);
    pin.classList.toggle('here',id === current);
    const dot = document.createElement('i');
    dot.setAttribute('aria-hidden','true');
    const label = document.createElement('span');
    label.textContent = place.short;
    pin.setAttribute('aria-label',(id === current ? '当前位置，' : '') + place.name);
    pin.append(dot,label);
    $('route-pins').append(pin);
  }

  function fold(folded) {
    $('route-chart').hidden = folded;
    $('route-spread').classList.toggle('folded',folded);
    $('route-fold').setAttribute('aria-expanded',String(!folded));
    $('route-fold').textContent = folded ? '展开全图' : '折起全图';
  }
  $('route-fold').onclick = () => fold(!$('route-chart').hidden);
  $('route-scale').onclick=()=>{
    dockDetail=!dockDetail;
    if(dockDetail&&!dockPlaces.has(chosen))chosen='causeway';
    scaleChart();select(chosen);
  };
  $('route-locate').onclick = () => {
    fold(false);
    $('route-pin-'+chosen).focus();
  };
  const chart=$('route-chart'),observer=new ResizeObserver(()=>{
    if(!chart.isConnected){observer.disconnect();return;}
    placeLabels();
  });
  observer.observe(chart.querySelector('.route-chart-plate'));
  for(const label of chart.querySelectorAll('.route-pin span'))observer.observe(label);
  panel.addEventListener('close',()=>observer.disconnect(),{once:true});
  scaleChart();
  select(chosen);
}
