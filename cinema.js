'use strict';

const chapterFilms = (() => {
  const box=document.getElementById('chapter-film');
  const frame=box.querySelector('.film-frame');
  const player=frame.querySelector('video');
  const caption=box.querySelector('p');
  const skip=box.querySelector('button');
  const frameNote=document.createElement('small');
  frameNote.className='coda-chapter';
  frameNote.setAttribute('aria-hidden','true');
  caption.before(frameNote);

  const photo=(art,detail,text,sound)=>({art,detail,text,sound});
  const movie=(file,text,poster)=>({file,text,poster});
  const shots={
    supper:movie('supper','楼下又添了一副碗筷。','dinner'),
    child:movie('door','走廊里干干的。有个孩子在门背后挪凳子。','dryhall'),
    records:movie('records','水面上悬着一排窗。最边上的那扇亮了。','archive'),
    ferry:movie('crossing','末班船还在等一个人。','ferry'),
    drain:movie('crossing','渡口下面，石阶一直伸到水里。','drain'),
    beds:movie('nursery','门框上的刻线，比肩膀矮了一截。','nursery'),
    switchboard:movie('switch','有人把听筒拿起来了。','exchange'),
    post:movie('receipt','通讯局的墙那边，邮绳还在晃。','returns'),
    watch:movie('watch','潮声退下去，露出了一串脚步。','causeway'),
    tower:[movie('tower0','雾里又亮了一圈。','tower'),movie('tower1','这回，灯在楼梯上。','tower-stairs'),movie('tower2','门后有人等着。','tower')]
  };
  const endingsOut={
    home:['receiver','听筒里，妹妹重复了一遍你报的地址。','那箱书还在等你一起搬。','relay-answer'],
    aunt:['button','围裙上空了一个扣眼。窗口后面，阿姨签了自己的名字。','过了很多年，汤端到桌上还是热的。','keys'],
    names:['register','七张底联留下了。你把总册合上。','留下的那些名字，往后由你来记。','page'],
    city:['wires','小满和测潮婆按住底联。你合上最后一路开关。','楼道的灯一盏接一盏亮过去。','plug-in']
  };
  const destinations={
    supper:['landing','dinner'],threshold:['flood','hall'],child:['hall','archive'],
    ferryPass:['archive','ferry'],drainPass:['archive','drain'],ferryArrival:['ferry','nursery'],drainArrival:['drain','nursery'],
    nursery:['nursery','exchange'],telephonePost:['exchange','returns'],telephoneQuay:['exchange','causeway'],
    post:['returns','exchange'],ontoQuay:['exchange','causeway'],horn:['signalhut','stairs'],tide:['culvert','stairs'],
    home:['tower','after'],aunt:['tower','after'],names:['tower','after'],city:['tower','after']
  };
  function completed(s,key){return s.codas?.includes(key)===true;}
  function recorded(s,from,to){
    const f=s.flags;
    switch(from+'-'+to){
      case 'landing-dinner':return f.parcel?'supper':null;
      case 'flood-hall':return f.threshold?'threshold':null;
      case 'hall-archive':return f.identity?'child':null;
      case 'archive-ferry':case 'archive-drain':
        if(!f.registered||completed(s,'ferryPass')||completed(s,'drainPass'))return null;
        return to==='ferry'?'ferryPass':'drainPass';
      case 'ferry-nursery':return f.boarded?'ferryArrival':null;
      case 'drain-nursery':return f.drained?'drainArrival':null;
      case 'nursery-exchange':return f.auntAsked?'nursery':null;
      case 'exchange-returns':return f.wired&&!completed(s,'telephoneQuay')?'telephonePost':null;
      case 'exchange-causeway':return f.wired?(completed(s,'telephonePost')?'ontoQuay':'telephoneQuay'):null;
      case 'returns-exchange':return f.signedReceipt||f.keptLetter?'post':null;
      case 'signalhut-stairs':case 'culvert-stairs':
        if(completed(s,'horn')||completed(s,'tide'))return null;
        return from==='signalhut'?(f.signalAnswered?'horn':null):(f.viaCulvert?'tide':null);
      case 'tower-after':return Object.hasOwn(endingsOut,s.ending)?s.ending:null;
      default:return null;
    }
  }
  function script(key,s){
    const f=s.flags;
    switch(key){
      case 'supper':return [photo('frameback','frame','包裹里的底座，刚好补上妹妹相框缺的那一块。','tap'),shots.supper];
      case 'threshold':return [photo('deep-water','bus','脚跟一离开门槛，身后的海声就断了。','dry-step'),shots.child];
      case 'child':return [photo('dryhall','stool',f.kin?'小凳子留在门边。小满牵着你的手，叫你妈妈。':'应急灯亮了。小满把凳子留在门边，跟上了你。',f.kin?'stool':'keys'),shots.records];
      case 'ferryPass':case 'drainPass':
        return [photo('ledger',s.registration==='family'?'family':'visitor','印章提起来，新墨还沾在纸上。','stamp'),key==='ferryPass'?shots.ferry:shots.drain];
      case 'ferryArrival':return [photo('erased-entry','ticket','末班船靠了岸。攥在小满手里的，只剩半瓣橘子皮。','deck-step'),shots.beds];
      case 'drainArrival':return [photo('drain','waterline','闸轮停了。你的湿脚印旁边，多了一行小脚印。','sluice-step'),shots.beds];
      case 'nursery':return [photo('nursery','notches','阿姨的手移开了。六岁那道刻痕还在门框上。','curtain'),shots.switchboard];
      case 'telephonePost':case 'telephoneQuay':{
        const text=s.switchboard.response==='tap'?'听筒已经挂好。你敲过的那两下，空孔又还了一遍。':
          s.switchboard.response==='mute'?'你松开送话簧片。那头已经挂了，空孔里却迟了一拍。':'妹妹先挂了。屋里只剩下空孔的一声回铃。';
        const joint=key==='telephonePost'?photo('returns','envelope','隔壁的退信窗下，压着一封湿透的信。','wet-paper'):shots.watch;
        return [photo('exchange','line',text,'relay-answer'),joint];
      }
      case 'post':return [photo('returns',f.signedReceipt?'signed':'kept',f.signedReceipt?'亲收栏多了一个「生」。最后一横是他自己写的。':'你收好留件联。「许荣生」三个字还在，亲收栏空着。','page'),shots.post,
        photo('exchange','outside','侧门外面，堤上传来铁链擦过石头的声音。','chain-near')];
      case 'ontoQuay':return [shots.watch];
      case 'horn':return [photo('signalhut','horn','绳子垂下来。隔着雾，对岸回了两声。','fog-short'),...shots.tower];
      case 'tide':return [photo('culvert','jamb','白线露出来。最后一滴水从你的袖口落到了塔阶上。','dry-step'),...shots.tower];
      default:{
        const [detail,text,next,sound]=endingsOut[key];
        const art=key==='aunt'?'missing-button':key==='names'?'ledger':'tower';
        return [photo(art,detail,text,sound),movie(key,next,endings[key].art)];
      }
    }
  }

  // Old builds wrote numeric flags as soon as a clip started. Only a new
  // explicit departure records a coda in an old save. Scene trials do not.
  function restore(raw,s){
    if(Array.isArray(raw.codas))s.codas=[...new Set(raw.codas.filter(k=>typeof k==='string'&&Object.hasOwn(destinations,k)))];
    const key=raw.pendingCoda;
    if(typeof key!=='string'||!Object.hasOwn(destinations,key))return;
    const [from,to]=destinations[key];
    const shiftClose=key==='post'&&s.room==='returns';
    if((to===s.room||shiftClose)&&(!endingsOut[key]||s.ending===key)&&(!completed(s,key)||to==='after'))s.pendingCoda=key;
  }
  function stage(from,to){
    delete state.pendingCoda;
    const key=recorded(state,from,to);
    if(key&&(to==='after'||!completed(state,key)))state.pendingCoda=key;
  }
  let activeKey=null, queue=[], focusBefore, timer=0, remaining=0, started=0, advance=null, current=null, owner=null;
  let exiting=false, epoch=0, resumeMovie=null;
  function stopClock(){
    clearTimeout(timer);timer=0;advance=null;remaining=0;
  }
  function startClock(){
    if(timer||!advance||document.hidden)return;
    started=performance.now();
    timer=setTimeout(()=>{timer=0;const fn=advance;advance=null;fn?.();},remaining);
  }
  function later(ms,fn){
    stopClock();remaining=ms;advance=fn;startClock();
  }
  function stopPlayback(){
    resumeMovie=null;
    player.onended=player.onerror=player.onloadeddata=player.onseeked=player.onwaiting=player.onplaying=null;
    player.pause();
  }
  function close(){
    if(exiting||!box.open)return;
    exiting=true;epoch++;stopClock();queue=[];
    if(activeKey&&state===owner&&state.pendingCoda===activeKey){
      const [from]=destinations[activeKey];
      state.codas ||= [];
      if(!completed(state,activeKey))state.codas.push(activeKey);
      if(!state.films.includes(locations[from].chapter))state.films.push(locations[from].chapter);
      delete state.pendingCoda;save();
    }
    activeKey=null;current=null;owner=null;
    coastWeather.film(null,player);
    stopPlayback();player.removeAttribute('src');player.load();
    box.close();box.querySelector('.passage-still')?.remove();
    frame.querySelector('.coda-photo')?.remove();
    box.classList.remove('short-passage','chapter-coda','coda-paused');
    delete box.dataset.coda;delete box.dataset.beat;
    harborSound.filmMix(false);playLandingTrip();
    if(panel.open)focusPanel();
    else if(focusBefore?.isConnected&&focusBefore.offsetWidth)focusBefore.focus({preventScroll:true});
    else if(playing)$('viewport').focus({preventScroll:true});
    exiting=false;
  }
  function artNode(shot){
    const scene=document.createElement('div');scene.className='coda-photo';
    scene.dataset.detail=shot.detail||'still';scene.setAttribute('aria-hidden','true');
    const image=new Image();image.alt='';
    image.onload=()=>scene.style.setProperty('--plate-ratio',String(image.naturalWidth/image.naturalHeight));
    image.src=artUrl(shot.art);
    if(image.naturalWidth)scene.style.setProperty('--plate-ratio',String(image.naturalWidth/image.naturalHeight));
    const table=document.createElement('div');table.className='coda-composition';table.append(image);
    const prop=document.createElement('div');prop.className='coda-prop';
    switch(shot.detail){
      case 'frame':
        prop.style.setProperty('--home-wood','url("'+image.src+'")');
        prop.innerHTML='<span class="home-foot-shape"><i></i><i></i><b></b></span>';break;
      case 'bus':{
        const boat=document.createElement('i');boat.className='whole-bus';prop.append(boat);
        const door=new Image();door.className='coda-door';door.src=artUrl('threshold-door');door.alt='';table.append(door);break;
      }
      case 'stool':{
        const stool=new Image();stool.src=artUrl('supper-stool');stool.alt='';prop.append(stool);break;
      }
      case 'family':case 'visitor':
        prop.innerHTML='<b translate="no">林遥</b><i></i><strong></strong>';
        prop.lastChild.textContent=shot.detail==='family'?'本城家人':'外来档案整理员';break;
      case 'signed':case 'kept':
        prop.innerHTML='<small>收件人</small><b translate="no">许荣生</b><span>亲收</span><em translate="no"></em>';
        if(shot.detail==='signed')prop.lastChild.textContent='许荣生';break;
      case 'notches':prop.innerHTML='<i></i><i></i><i></i><b translate="no">六岁</b>';break;
      case 'envelope':prop.innerHTML='<i></i>';break;
      case 'register':prop.innerHTML='<i></i><b translate="no">林遥</b>';break;
      case 'wires':prop.innerHTML='<i></i><i></i><i></i>';break;
    }
    table.append(prop);scene.append(table);
    return scene;
  }
  function showPhoto(shot){
    const scene=artNode(shot);frame.querySelector('.coda-photo')?.remove();frame.append(scene);
    if(shot.sound)harborSound.cue(shot.sound);
  }
  function holdVideo(){
    if(!player.videoWidth||!player.videoHeight)return;
    const still=document.createElement('canvas');still.className='coda-photo coda-held-frame';
    still.setAttribute('aria-hidden','true');still.width=player.videoWidth;still.height=player.videoHeight;
    const paint=still.getContext('2d');
    if(!paint)return;
    paint.drawImage(player,0,0);
    frame.querySelector('.coda-photo')?.remove();frame.append(still);
  }
  function showShot(){
    stopClock();
    if(current?.file&&player.readyState>=2)holdVideo();
    coastWeather.film(null,player);
    stopPlayback();
    const shot=queue.shift();
    if(!shot){close();return;}
    current=shot;
    const turn=++epoch;
    const valid=()=>turn===epoch&&box.open;
    caption.textContent=shot.text;
    box.dataset.beat=shot.detail||shot.file;
    if(shot.art){
      showPhoto(shot);
      later(reduceMotion?1250:2450,showShot);
      return;
    }
    // Keep the previous painted frame on screen until decoding has finished.
    // If the codec is unavailable, the same beat has a local illustrated take.
    const fallback=()=>{
      if(!valid())return;
      stopClock();stopPlayback();coastWeather.film(null,player);
      showPhoto(photo(shot.poster,'still',shot.text));later(reduceMotion?1100:1950,showShot);
    };
    if(!frame.querySelector('.coda-photo'))showPhoto(photo(shot.poster,'still',shot.text));
    const playMovie=()=>{
      if(!valid())return;
      if(document.hidden)return;
      player.play().catch(()=>{
        if(!valid()||document.hidden)return;
        player.muted=true;player.play().catch(fallback);
      });
    };
    player.dataset.shot=shot.file;player.muted=!harborSound.enabled;player.volume=.75;
    player.onloadeddata=()=>{
      if(!valid())return;
      stopClock();
      if(reduceMotion){
        // Keep the soundtrack under a held frame for motion-sensitive players.
        player.onseeked=()=>{
          if(!valid())return;
          player.onseeked=null;holdVideo();
          if(harborSound.enabled){resumeMovie=playMovie;playMovie();}
          later(1320,showShot);
        };
        later(2200,fallback);player.currentTime=Math.min(.42,player.duration*.3);
      }else{
        coastWeather.film(shot.file,player);
        frame.querySelector('.coda-photo')?.classList.add('dissolve');
        player.onwaiting=()=>{if(valid()&&!document.hidden)later(4200,fallback);};
        player.onplaying=()=>{if(valid()&&advance===fallback)stopClock();};
        resumeMovie=playMovie;
        playMovie();
      }
    };
    player.onerror=fallback;
    player.onended=()=>{if(valid())showShot();};
    later(4000,fallback);
    player.src=window.harborFilms?.[shot.file]||'cinema/'+shot.file+'.mp4';player.load();
  }
  function openFilm(){
    focusBefore=document.activeElement;
    box.showModal();skip.focus({preventScroll:true});
  }
  function present(key){
    const saved=state;
    queueMicrotask(()=>{
      if(!playing||state!==saved||state.pendingCoda!==key||box.open)return;
      owner=state;activeKey=key;queue=script(key,state);
      box.dataset.coda=key;box.classList.add('chapter-coda');
      const [from]=destinations[key];
      frameNote.textContent=key==='ontoQuay'?locations.causeway.title:chapters[locations[from].chapter].name+' · 章末';
      openFilm();harborSound.filmMix(true);showShot();
    });
  }
  function passage(from,to,oldImage){
    // Standalone postal shifts finish at their desk without changing rooms.
    if(from==='returns'&&to==='exchange'&&state.room==='returns'){
      stage(from,to);if(state.pendingCoda)save();else return;
    }
    if(state.pendingCoda){present(state.pendingCoda);return;}
    const arrival=$('backdrop').src;
    queueMicrotask(()=>{
      if(!playing||state.room!==to||box.open)return;
      const still=document.createElement('div');still.className='passage-still';
      for(const [src,room] of [[oldImage,from],[arrival,to]]){
        const img=new Image();img.alt='';img.src=src||artUrl(locations[room].art);
        if(room==='dinner'||room==='flood'){
          const shot=document.createElement('div');shot.className='passage-room';
          const interior=document.createElement('div');interior.className='passage-interior';
          const lift=room==='flood'?Math.min(1,(state.flags.window?100:state.windowRise||0)/32):0;
          interior.append(img,supperFurniture(!!state.flags.chair,lift));shot.append(interior);still.append(shot);
        }else still.append(img);
      }
      box.prepend(still);box.classList.add('short-passage');caption.textContent=locations[to].title;
      openFilm();later(reduceMotion?420:1100,close);
    });
  }
  document.addEventListener('visibilitychange',()=>{
    if(!box.open)return;
    box.classList.toggle('coda-paused',document.hidden);
    if(document.hidden){
      if(timer){clearTimeout(timer);timer=0;remaining=Math.max(0,remaining-(performance.now()-started));}
      player.pause();
    }else{
      if(advance)startClock();
      if(resumeMovie&&player.readyState>=2)resumeMovie();
    }
  });
  box.addEventListener('cancel',event=>{event.preventDefault();close();});
  box.addEventListener('keydown',event=>{
    event.stopPropagation();
    if(event.target.closest('select')||event.repeat)return;
    if([' ','Enter','e','E'].includes(event.key)){event.preventDefault();close();}
  });
  skip.onclick=close;
  new ResizeObserver(()=>{if(box.open&&current?.file&&player.readyState>=2)coastWeather.film(current.file,player);}).observe(player);
  function supperArrival(){
    say([['阿姨','鞋合脚吧？来，把椅子搬过来。靠窗给你留了位置。'],['林遥','桌边摆着六副碗筷。没人问我叫什么。']]);
  }
  function resume(){
    const key=state.pendingCoda;
    if(!key)return;
    // Arrival conversations normally open synchronously below the film. Keep
    // them there on a reload too, including the first line of each epilogue.
    if(key==='supper')supperArrival();
    else if(key==='child')prologueEnd();
    else if(key==='ferryArrival'||key==='drainArrival')nurseryArrival(key==='ferryArrival'?'boarded':'drained');
    else if(key==='post'){
      if(state.room==='returns')postalShiftCard();
      else postalArrival();
    }else if(Object.hasOwn(endingsOut,key))epilogueArrival();
    present(key);
  }
  return {restore,stage,passage,resume,supperArrival};
})();
