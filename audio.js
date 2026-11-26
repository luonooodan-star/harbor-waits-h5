'use strict';

const harborSound = (() => {
  const exchangeClips = new Set(['Click','Tower','IdleJack','Shore','Bell','Pot','Sunday','Wait','Muted','Tap','Bye','Tail']);
  const decoded = new Map();
  const transients = new Set();
  let context, master, ambience, sea, seaFilter, swellDepth, air, airFilter, motor, overtone;
  let rainLevel,weatherSide,bootSide,dockSpeaker,dockReply,listenerX=23,nextHorn=0;
  let noise, motorLevel, overtoneLevel, detailTimer, phoneSource, phoneElement;
  const preferenceKey='harbor.ui.sound.v1';
  let enabled = false, away = false, lifecycle = 0, phoneTake = 0;
  try{enabled=localStorage.getItem(preferenceKey)==='on';}catch{}
  let grilleEbb=null;
  let room = 'title', profile = 'title';

  // Low surf and a narrower band of air can pass through a window, a wall or water.
  // The two motor partials give the kitchen compressor a near and a far perspective.
  const coast = {surf:.19, cutoff:830, air:.012, band:1700, motor:0, pitch:55, detail:null};
  const interior = {...coast, surf:.045, cutoff:340, air:.005, band:1250};
  const profiles = {
    title:{...coast, surf:.155, cutoff:620},
    room:{...interior, detail:'chinaAbove'},
    fridgeNear:{...interior, motor:.061, pitch:54.7, detail:'chinaAbove'},
    fridgeFar:{...interior, motor:.021, pitch:54.7, cutoff:420, detail:'chinaLanding'},
    landing:{...interior, surf:.081, cutoff:460, detail:'chinaLanding'},
    dinner:{...interior, surf:.032, cutoff:280, detail:'china'},
    flood:{...interior, surf:.22, cutoff:210, air:.008, band:360, detail:'drip'},
    hall:{...interior, surf:.012, cutoff:340, air:.008, band:1750, detail:'broom'},
    archive:{...interior, surf:.025, detail:'shelves'},
    ferry:{...coast, surf:.32, cutoff:930, detail:'chain'},
    drain:{...coast, surf:.25, cutoff:490, air:.02, band:650, detail:'drip'},
    nursery:{...interior, surf:.066, cutoff:430, detail:'wood'},
    exchange:{...interior, surf:.014, air:.038, band:2150, motor:.011, pitch:96},
    returns:{...interior, surf:.085, cutoff:550, air:.015, band:1600, detail:'pane'},
    signalhut:{...coast,surf:.22,cutoff:680,air:.035,band:1400,detail:'pane'},
    waitingRoom:{...coast,surf:.14,cutoff:620,air:.018,band:1480,detail:'eaves'},
    lostOffice:{...interior,surf:.034,cutoff:230,air:.007,band:700,motor:.014,pitch:53.4,detail:'drawers'},
    culvert:{...interior,surf:.28,cutoff:320,air:.016,band:550,detail:'drip'},
    stairs:{...interior,surf:.061,cutoff:360,air:.017,band:720,detail:null},
    causeway:{...coast, surf:.29, cutoff:1050, air:.021, band:1900,detail:'chain'},
    tower:{...interior, surf:.13, cutoff:530, motor:.013, pitch:73, detail:'wood'},
    daylight:{...interior, surf:.015, air:.013, band:2100, detail:'daylight'}
  };

  function audible() {
    return enabled && !away && !document.hidden && context?.state === 'running';
  }

  function gain(value, target) {
    const node = context.createGain();
    node.gain.value = value;
    node.connect(target);
    return node;
  }

  function oscillator(frequency, target, type='sine') {
    const node = context.createOscillator();
    node.type = type;
    node.frequency.value = frequency;
    node.connect(target);
    node.start();
    return node;
  }

  function filteredNoise(type, frequency, target, loop) {
    const source = context.createBufferSource();
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = frequency;
    filter.Q.value = type === 'bandpass' ? 1.2 : .6;
    source.buffer = noise;
    source.loop = loop;
    source.connect(filter).connect(target);
    return {source, filter};
  }

  function prepare() {
    if (context) return;
    const Engine = window.AudioContext || window.webkitAudioContext;
    if (!Engine) throw new Error('audio unavailable');
    context = new Engine();
    master = gain(0, context.destination);
    ambience = gain(1, master);
    diningSide=sideOutput(-.58);corridorSide=sideOutput(.58);
    // A short, seamless mono noise bank supplies all weather and paper sounds.
    const rate = 16000, seam = 480;
    noise = context.createBuffer(1, rate * 6, rate);
    const samples = noise.getChannelData(0);
    const random = new Float32Array(samples.length + seam);
    for (let i = 0; i < random.length; i++) random[i] = Math.random() * 2 - 1;
    samples.set(random.subarray(seam));
    for (let i = 0; i < seam; i++) {
      const fade = i / seam;
      samples[samples.length - seam + i] = random[samples.length + i] * (1 - fade) + random[i] * fade;
    }
    sea = gain(0, ambience);
    const shore = filteredNoise('lowpass', 700, sea, true);
    seaFilter = shore.filter;
    shore.source.start();
    swellDepth = gain(0, sea.gain);
    oscillator(.091, swellDepth);

    bootSide=sideOutput(0);
    dockSpeaker=sideOutput(-.4,master);dockReply=sideOutput(.57,master);
    weatherSide=sideOutput(0);
    rainLevel=gain(0,weatherSide);
    const rain=filteredNoise('highpass',2800,rainLevel,true);rain.source.start(0,.93);
    air = gain(0, weatherSide);
    const windowAir = filteredNoise('bandpass', 1500, air, true);
    airFilter = windowAir.filter;
    windowAir.source.start(0, 2.13);
    motorLevel = gain(0, ambience);
    overtoneLevel = gain(0, ambience);
    motor = oscillator(55, motorLevel);
    overtone = oscillator(110.2, overtoneLevel);
    // Slight cycling keeps the fridge motor alive at a constant low volume.
    oscillator(.27, gain(.31, motor.frequency));
  }

  function glide(param, value, seconds=.24) {
    const now = context.currentTime;
    if (param.cancelAndHoldAtTime) param.cancelAndHoldAtTime(now);
    else param.cancelScheduledValues(now);
    param.setTargetAtTime(value, now, seconds);
  }

  function renderProfile() {
    if (!context) return;
    const p = profiles[profile];
    const surf=grilleEbb===true?p.surf*.16:p.surf;
    glide(sea.gain, surf);
    glide(swellDepth.gain, surf * .52);
    glide(seaFilter.frequency, p.cutoff);
    const exposed=['room','landing','ferry','causeway','signalhut','culvert','waitingRoom'].includes(room);
    glide(rainLevel.gain,exposed?(room==='culvert'?.019:.053):.005);
    if(weatherSide.pan)glide(weatherSide.pan,0,.3);
    // In the duty room the announcement comes through the desk, close to Lin.
    if(room==='tower'&&dockSpeaker.pan)glide(dockSpeaker.pan,-.08,.15);
    glide(air.gain, p.air+(exposed?.028:0));
    glide(airFilter.frequency, p.band);
    glide(motorLevel.gain, p.motor);
    glide(overtoneLevel.gain, p.motor * .23);
    glide(motor.frequency, p.pitch);
    glide(overtone.frequency, 2 * p.pitch + .19);
    windowPosition(listenerX);scheduleDetail();
  }

  function windowPosition(x){
    listenerX=x;
    if(!audible() || !['room','dinner','waitingRoom','lostOffice'].includes(room))return;
    if(room==='waitingRoom'&&dockSpeaker.pan){
      // The enamel horn is near the centre. The answering voice is behind
      // the ticket glass, farther right even when the player faces left.
      glide(dockSpeaker.pan,Math.max(-.78,Math.min(.78,(49.2-x)/52)),.14);
      glide(dockReply.pan,Math.max(-.86,Math.min(.86,(74-x)/48)),.14);
    }
    const windowX=room==='waitingRoom'?32:room==='lostOffice'?90:39;
    const delta=(windowX-x)/50,near=Math.max(0,1-Math.abs(delta));
    if(weatherSide.pan)glide(weatherSide.pan,Math.max(-.82,Math.min(.82,delta)),.14);
    const shelter=room==='lostOffice'?.22:room==='waitingRoom'?1.32:1;
    glide(rainLevel.gain,(.014+.065*near)*shelter,.15);
    glide(air.gain,(.018+.034*near)*shelter,.18);
  }
  function lifetime(source, nodes, end) {
    transients.add(source);
    source.onended = () => {
      transients.delete(source);
      for (const node of [source, ...nodes]) node.disconnect();
    };
    source.stop(end);
  }

  function tone(freq, seconds=.12, level=.06, delay=0, type='sine', endFreq=freq, output=master) {
    if (!audible()) return;
    const start = context.currentTime + delay, end = start + seconds;
    const node = context.createOscillator(), envelope = gain(0, output);
    node.type = type;
    node.frequency.setValueAtTime(freq, start);
    node.frequency.exponentialRampToValueAtTime(endFreq, end);
    envelope.gain.setValueAtTime(.00001, start);
    envelope.gain.exponentialRampToValueAtTime(level, start + Math.min(.035, seconds * .18));
    envelope.gain.exponentialRampToValueAtTime(.00001, end);
    node.connect(envelope);
    node.start(start);
    lifetime(node, [envelope], end);
  }

  function rustle(freq, seconds, level, delay=0, output=ambience) {
    if (!audible()) return;
    const start = context.currentTime + delay, end = start + seconds;
    const envelope = gain(0, output);
    const {source, filter} = filteredNoise('bandpass', freq, envelope, false);
    envelope.gain.setValueAtTime(.00001, start);
    envelope.gain.exponentialRampToValueAtTime(level, start + seconds * .22);
    envelope.gain.exponentialRampToValueAtTime(.00001, end);
    source.start(start, Math.random() * 4);
    lifetime(source, [filter, envelope], end);
  }

  function detail(kind) {
    const ambientTone = (start, length, level, delay=0, end=start) => tone(start,length,level,delay,'sine',end,ambience);
    if(kind==='eaves'){
      rustle(1060,.65,.043,0,weatherSide);
      tone(620,.16,.016,.41,'sine',265,weatherSide);tone(543,.13,.011,.73,'sine',239,weatherSide);
    }else if(kind==='drawers'){
      rustle(480,.37,.037,.08,corridorSide);tone(219,.13,.014,.42,'triangle',151,corridorSide);
    }else if (kind === 'shelves' && Math.random() < .65) {
      rustle(1850,.44,.055); rustle(2650,.25,.041,.22);
    } else if (kind === 'wood' || kind === 'shelves') {
      ambientTone(191,.37,.018,0,145); rustle(620,.21,.029,.12);
    } else if (kind === 'pane') {
      ambientTone(826,.13,.027); ambientTone(1190,.09,.013,.087); rustle(2600,.31,.021);
    } else if (kind === 'broom') {rustle(1730,.46,.047);rustle(1220,.38,.037,.55);
    } else if (kind === 'drip') {
      ambientTone(684,.19,.027,0,302); ambientTone(535,.11,.009,.19,269);
    } else if (kind === 'chain') {
      rustle(1330,.23,.047); ambientTone(415,.41,.018,.09);
    } else if (kind === 'chinaAbove' || kind === 'chinaLanding') {
      const near=kind==='chinaLanding';
      ambientTone(near?810:398,.19,near?.019:.012);
      ambientTone(near?946:455,.12,near?.013:.008,.27);
    } else if (kind === 'china') {
      ambientTone(1216,.42,.018); ambientTone(1880,.17,.011,.025);
    } else if (kind === 'daylight') {
      ambientTone(1850,.11,.017,0,2450); ambientTone(2230,.16,.011,.19,1790);
    }
  }

  function scheduleDetail() {
    clearTimeout(detailTimer);
    const kind = profiles[profile].detail;
    if (!kind || !audible() || grilleEbb!==null) return;
    detailTimer = setTimeout(() => {
      if (!audible()) return;
      detail(kind);
      if(['room','dinner','landing','ferry','causeway','signalhut','waitingRoom'].includes(room) && context.currentTime>=nextHorn){
        tone(87,2.1,.038,0,'sine',83,ambience);tone(130,1.8,.019,.13,'triangle',126,ambience);
        nextHorn=context.currentTime+32+Math.random()*38;
      }
      scheduleDetail();
    }, (6 + Math.random() * 10) * 1000);
  }

  let tapeNoise;
  function stopTape(){
    if(!tapeNoise)return;
    const {source,filter,level}=tapeNoise;
    source.stop();source.disconnect();filter.disconnect();level.disconnect();tapeNoise=null;
  }
  function startTape(){
    stopTape();
    if(!audible())return;
    const level=gain(.039,ambience);
    const hiss=filteredNoise('bandpass',1630,level,true);
    hiss.source.start();tapeNoise={...hiss,level};
    cue('tape-start');
  }
  let doorOpen=0, doorActive=false, broomTimer;
  let diningSide, corridorSide;
  function sideOutput(position,target=ambience){
    if(!context.createStereoPanner)return target;
    const pan=context.createStereoPanner();
    pan.pan.value=position;
    pan.connect(target);
    return pan;
  }
  function sweep(){
    if(!doorActive||!audible())return;
    if(doorOpen>.01){
      rustle(1630,.44,.075*doorOpen,0,corridorSide);rustle(1170,.31,.045*doorOpen,.48,corridorSide);
    }
    if(doorOpen<.98){
      const metal=(1-doorOpen)*.042;
      tone(127,.75,metal,0,'triangle',93,diningSide);
      rustle(420,.53,metal,.14,diningSide);
    }
    broomTimer=setTimeout(sweep,1650);
  }
  function doorway(open){
    const first=!doorActive;
    doorActive=true;doorOpen=open;
    if(!audible())return;
    glide(sea.gain,.19*(1-open)+.035,.1);
    glide(seaFilter.frequency,210+320*open,.1);
    if(first)sweep();
  }
  function endDoorway(){
    if(!doorActive)return;
    doorActive=false;clearTimeout(broomTimer);
    if(audible())renderProfile();
  }
  function filmMix(open){if(context)glide(ambience.gain,open?.24:1,.12);}

  let contactSound;
  function surfaceContact(material, proximity) {
    if (!audible()) return;
    if (!contactSound) {
      const level=gain(0,ambience);
      const {source,filter}=filteredNoise('bandpass',240,level,true);
      source.start();
      contactSound={source,filter,level};
    }
    const pitch={pipe:780,doorEar:240,casing:460}[material];
    glide(contactSound.filter.frequency,pitch*(.45+proximity*.75),.055);
    glide(contactSound.level.gain,.012+.16*proximity*proximity,.055);
  }
  function endSurfaceContact() {
    if(!contactSound)return;
    const {source,filter,level}=contactSound;
    contactSound=null;
    glide(level.gain,0,.015);
    source.onended=()=>{source.disconnect();filter.disconnect();level.disconnect();};
    source.stop(context.currentTime+.04);
  }
  function stopTransientSounds() {
    endDoorway();stopTape();endSurfaceContact();
    clearTimeout(detailTimer);
    for (const node of transients) {
      try { node.stop(); } catch {}
      node.disconnect();
    }
    transients.clear();
  }

  function scene(nextRoom, flags={}, ending=null) {
    let nextProfile = nextRoom;
    if (nextRoom === 'room' && flags.power) nextProfile = 'fridgeNear';
    if (nextRoom === 'landing' && flags.power) nextProfile = 'fridgeFar';
    if (nextRoom === 'after') {
      nextProfile = ({home:'daylight', aunt:'dinner', names:'archive', city:'landing'})[ending] || 'daylight';
    }
    if (!Object.hasOwn(profiles, nextProfile)) nextProfile = 'title';
    if (nextRoom === room && nextProfile === profile) return;
    if (nextRoom !== room) {
      stopExchange();
      stopTransientSounds();
    }
    room = nextRoom;
    profile = nextProfile;
    if (context && enabled) renderProfile();
  }

  function stopExchange() {
    phoneTake++;
    if (phoneSource) {
      phoneSource.onended = null;
      phoneSource.stop();
      phoneSource.disconnect();
      phoneSource = null;
    }
    if (phoneElement) {
      phoneElement.onended = null;
      phoneElement.pause();
      phoneElement.removeAttribute('src');
      phoneElement.load();
      phoneElement = null;
    }
    if (context) glide(ambience.gain, 1, .14);
  }

  function readClip(name) {
    if (decoded.has(name)) return decoded.get(name);
    const inline = window.harborAudio?.[name];
    let bytes;
    if (inline) {
      const encoded = inline.slice(inline.indexOf(',') + 1);
      const binary = atob(encoded);
      bytes = Uint8Array.from(binary, c => c.charCodeAt(0)).buffer;
    } else {
      bytes = fetch('sound/' + name + '.mp3').then(response => {
        if (!response.ok) throw new Error('clip unavailable');
        return response.arrayBuffer();
      });
    }
    const result = Promise.resolve(bytes).then(buffer => context.decodeAudioData(buffer))
      .catch(error => { decoded.delete(name); throw error; });
    decoded.set(name,result);
    return result;
  }

  // Directly opened, unpacked HTML cannot fetch its sibling files in some browsers.
  // Native media can play those local MP3 files, and the packed edition decodes inline.
  function playLocalMedia(name,take,duck=.32,delay=0) {
    if (take !== phoneTake || !audible()) return;
    const element = new Audio(window.harborAudio?.[name] || 'sound/' + name + '.mp3');
    phoneElement = element;
    element.volume = .66;
    glide(ambience.gain,duck,.07);
    element.onended = () => { if (take === phoneTake) stopExchange(); };
    const start=()=>{if(take===phoneTake&&audible())element.play().catch(()=>{if(take===phoneTake)stopExchange();});};
    if(delay)setTimeout(start,delay*1000);else start();
  }

  function playRecorded(name,output,duck,delay=0) {
    stopExchange();
    if (!audible()) return;
    const take = phoneTake;
    if (!window.harborAudio?.[name] && location.protocol === 'file:') {
      playLocalMedia(name,take,duck,delay);
      return;
    }
    readClip(name).then(buffer => {
      if (take !== phoneTake || !audible()) return;
      phoneSource = context.createBufferSource();
      phoneSource.buffer = buffer;
      phoneSource.connect(output);
      glide(ambience.gain,duck,.07);
      phoneSource.onended = () => {
        if (take !== phoneTake) return;
        phoneSource.disconnect();
        phoneSource = null;
        glide(ambience.gain, 1, .14);
      };
      phoneSource.start(context.currentTime+delay);
    }).catch(() => playLocalMedia(name,take,duck,delay));
  }
  function playExchange(name){
    if(exchangeClips.has(name))playRecorded(name,master,.32);
    else stopExchange();
  }

  async function applyPlayback() {
    const generation = ++lifecycle;
    if (!context) return enabled;
    if (!enabled || away || document.hidden) {
      stopExchange();
      stopTransientSounds();
      master.gain.cancelScheduledValues(context.currentTime);
      master.gain.setValueAtTime(0, context.currentTime);
      await context.suspend();
    } else {
      await context.resume();
      if (generation === lifecycle && audible()) {
        renderProfile();
        if(document.querySelector('#panel[open] .two-rooms'))doorway(+document.getElementById('passage-range').value/100);
        glide(master.gain, .66, .075);
      }
    }
    return enabled;
  }

  async function set(on) {
    if (on) prepare();
    enabled = Boolean(on);
    try {
      const result=await applyPlayback();
      try{localStorage.setItem(preferenceKey,result?'on':'off');}catch{}
      return result;
    }
    catch (error) { enabled = false; throw error; }
  }
  function unlockSavedSound(){
    if(enabled&&!context){
      prepare();applyPlayback().catch(()=>{});
    }
  }
  function grilleWater(ebb){
    if(grilleEbb===ebb)return;
    grilleEbb=ebb;
    if(!audible())return;
    renderProfile();
    if(ebb===true){
      detail('drip');
      tone(742,.19,.043,.62,'sine',330,corridorSide);tone(532,.13,.023,1.22,'sine',260,corridorSide);
    }else if(ebb===false)cue('tunnel-surge');
  }

  function cue(name, sourceX) {
    if (name.startsWith('exchange-')) { playExchange(name.slice(9)); return; }
    if (!audible()) return;
    if(name==='dock-call'||name==='dock-answer'){
      const lang=({'zh-CN':'cn','zh-TW':'tw',en:'en'})[document.documentElement.lang]||'cn';
      if(name==='dock-call'){
        tone(831,.095,.035,0,'sine',822,dockSpeaker);tone(642,.11,.03,.12,'sine',625,dockSpeaker);
        rustle(1800,.16,.031,.18,dockSpeaker);
        playRecorded('Dock-'+lang+'-'+([16,17,18].includes(sourceX)?sourceX:17),dockSpeaker,.76,.24);
      }else{
        rustle(320,.39,.036,0,dockReply);
        playRecorded('Dock-'+lang+'-reply',dockReply,.72,.06);
      }
      return;
    }
    if(name==='dock-glass'){
      tone(255,.21,.042,.02,'sine',152,dockReply);rustle(862,.28,.065,.08,dockReply);return;
    }
    if(name==='dock-fabric'){rustle(1250,.34,.045);rustle(720,.18,.031,.19);return;}
    if(name==='dock-paper-pair'){rustle(2160,.25,.055);rustle(1320,.18,.039,.24);tone(429,.06,.02,.35,'sine',319);return;}
    if(name==='dock-bolt'){rustle(786,.36,.072);tone(184,.17,.063,.27,'triangle',111);rustle(610,.22,.039,.34);return;}
    if(name==='fog-long'){tone(104,1.45,.088,0,'triangle',99);tone(150,1.2,.028,.08);}
    else if(name==='fog-short'){tone(104,.32,.077,0,'triangle');tone(104,.33,.073,.58,'triangle');}
    else if(name==='surf-impact'||name==='tunnel-surge'){
      const tunnel=name==='tunnel-surge';
      tone(tunnel?54:63,.66,tunnel?.053:.078,0,'sine',35);
      rustle(tunnel?340:720,.92,tunnel?.095:.14,.03);
      rustle(tunnel?520:1900,1.13,tunnel?.033:.057,.39);
      rustle(430,.98,.034,1.25);
    }
    else if(name==='wash')rustle(430,1.3,.14);
    else if(name==='breaker-trip'){rustle(1600,.16,.055);rustle(860,.21,.045,.44);tone(92,.12,.095,.96,'triangle',45);}
    else if(name==='following-step'){tone(100,.09,.058,0,'triangle',65);rustle(520,.19,.085,.63,corridorSide);tone(79,.13,.042,.64,'triangle',51,corridorSide);}
    else if (name === 'phone') [0,.25,.7].forEach(t => tone(714,.17,.07,t));
    else if (name === 'thunder') { rustle(145,2.3,.32); tone(62,1.8,.10,0,'sine',34); }
    else if (name === 'tide') { tone(87.3,3.4,.19); tone(130.8,3,.065,.25); }
    else if (name === 'knock') { tone(118,.13,.14); tone(99,.16,.16,.33); }
    else if(name==='plug-in'){rustle(930,.065,.085);tone(237,.075,.095,.012,'triangle',131);tone(1180,.035,.022,.024);}
    else if(name==='plug-out'){rustle(1540,.095,.067);tone(380,.055,.06,.032,'triangle',187);}
    else if(name==='keys'){tone(1240,.18,.032,0,'sine',1240,corridorSide);tone(1780,.14,.023,.13,'sine',1780,corridorSide);}
    else if(name==='ocean-depth'){tone(59,2.3,.072,0,'sine',46);rustle(280,1.6,.036,.23);}
    else if(name==='canopy'){tone(86,.52,.13,0,'triangle',55);rustle(560,.68,.12,.08);}
    else if(name==='plate-flex'){tone(292,.26,.029,0,'triangle',211);rustle(420,.18,.025);}
    else if(name==='anchor-scrape'){rustle(480,.72,.085);tone(156,.46,.05,.04,'sawtooth',63);}
    else if(name==='lamp-gear'){rustle(1170,.18,.045);tone(291,.25,.045,.08,'triangle',175);}
    else if(name==='stair-tread'){tone(192,.12,.048,0,'triangle',119);rustle(610,.12,.024,.04);}
    else if(name==='stair-rest')tone(96,.21,.033,0,'triangle',65);
    else if(name==='watch-boot'||name==='anchor-step'){
      const distance=(sourceX-listenerX)/35;
      const level=1/(1+Math.abs(distance)*.85);
      if(bootSide.pan)glide(bootSide.pan,Math.max(-.9,Math.min(.9,distance)),.04);
      tone(76,.16,.084*level,0,'triangle',41,bootSide);rustle(340,.18,.061*level,.03,bootSide);
      if(name==='anchor-step'){rustle(1150,.33,.045*level,.08,bootSide);tone(266,.14,.032*level,.25,'triangle',186,bootSide);}
    }
    else if(name==='loose-iron'){tone(274,.32,.075,0,'triangle',174);tone(393,.23,.033,.09);rustle(1100,.21,.052);}
    else if(name==='weight-splash'){tone(308,.13,.055,0,'triangle',168);rustle(690,.55,.095,.22);}
    else if(name==='keeper-found'){tone(93,.42,.082,0,'triangle',49);rustle(840,.36,.055,.12);}
    else if(name==='deck-step'){tone(105,.1,.039,0,'triangle',76);}
    else if(name==='sluice-step'){rustle(560,.12,.033);tone(81,.09,.034);}
    else if(name==='relay-answer'){tone(230,.09,.033,.32);tone(230,.09,.031,.64);}
    else if(name==='dry-step'){rustle(950,.14,.065);tone(96,.09,.05);}
    else if(name==='wet-paper'){rustle(1900,.13,.08);tone(155,.045,.05);}
    else if(name==='stool'){rustle(680,.42,.065);tone(168,.21,.023,0,'triangle',98);}
    else if(name==='pipe-scrapes'||name==='chair-answer'){
      const upstairs=name==='chair-answer',side=upstairs?corridorSide:diningSide,delay=upstairs?0:.52;
      if(!upstairs){rustle(370,.18,.065,0,side);tone(139,.12,.025,0,'triangle',98,side);}
      rustle(upstairs?530:395,.83,upstairs?.092:.074,delay,side);
      tone(153,.71,.036,delay+.035,'triangle',79,side);
      if(upstairs){tone(1330,.14,.033,.07,'sine',802);tone(967,.09,.019,.17);}
    }
    else if(name==='wall'){tone(88,.12,.075);tone(78,.14,.08,.33);}
    else if(name==='tape-start'){rustle(1720,.85,.09);tone(110,.47,.035,0,'triangle',92);}
    else if(name==='curtain'){rustle(1540,.45,.03,.4);}
    else if(name==='shore-claps'){for(const delay of [0,.18,.34,.59,.83])rustle(740,.13,.065,delay);}
    else if(name==='chain-away'||name==='chain-near'){const level=name==='chain-away'?.023:.065;rustle(730,.28,level);tone(223,.4,level,.06,'triangle',143);}
    else if (name === 'stamp') { tone(82,.12,.14,0,'triangle'); tone(151,.085,.055,.025); }
    else if (name === 'page') { tone(488,.06,.021,0,'triangle'); tone(287,.07,.022,.045,'triangle'); }
    else if (name === 'bell') { tone(660,.75,.08); tone(988,.43,.03,.03); }
    else if (name === 'step') tone(72,.07,.038);
    else tone(350,.09,.037);
  }

  // A single entrance gesture belongs to the character. The switchboard already
  // carries the sister's complete recorded performance.
  function presence(character) {
    if (!audible() || phoneSource || phoneElement || room === 'exchange') return;
    const key = ({'妹妹':'sister','阿姨':'aunt','小满':'child','测潮婆':'granny','灯首守夜人':'keeper'})[character] || character;
    if (key === 'sister') {
      rustle(660,.34,.072); rustle(1820,.16,.047,.17);
    } else if (key === 'aunt') {
      tone(1120,.39,.027); tone(1715,.21,.015,.045);
    } else if (key === 'child') {
      rustle(980,.21,.047); tone(143,.17,.023,.12,'triangle',121);
    } else if (key === 'granny') {
      tone(214,.13,.041,0,'triangle',156); tone(195,.16,.035,.38,'triangle',142);
    } else if (key === 'keeper') {
      tone(88,.26,.038,0,'triangle',64); rustle(740,.39,.058,.05);
    }
  }

  document.addEventListener('visibilitychange', () => { applyPlayback().catch(() => {}); });
  window.addEventListener('pagehide', () => { away = true; applyPlayback().catch(() => {}); });
  window.addEventListener('pageshow', () => { away = false; applyPlayback().catch(() => {}); });
  return {set, scene, cue, grilleWater, unlockSavedSound, windowPosition, surfaceContact, endSurfaceContact, doorway, endDoorway, startTape, stopTape, filmMix, stopExchange, presence, get enabled() { return enabled; }};
})();
