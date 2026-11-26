'use strict';
const chapters = [
  {name:'海边出租屋',art:'room',time:'17:42',intro:'到海城的第一天下午，林遥把行李放在床边。楼下有人在切姜，手机里还留着妹妹的声音。'},
  {name:'第七副碗筷',art:'dinner',time:'18:06',intro:'六个人，桌边只有六把椅子。阿姨把一副干净碗筷交给你，像是已经等了很久。'},
  {name:'门后的孩子',art:'dryhall',time:'18:17',intro:'门里水淹过了窗，门外是干的。连廊尽头传来两声敲门声。门里的人问，你还记得他叫什么吗？'},
  {name:'悬空档案馆',art:'archive',time:'18:31',intro:'三份不同年代的住户档案，都有你的签名。馆员把印章推了过来。'},
  {name:'两条水路',art:'ferry',time:'18:49',intro:'末班船只剩一个名额，有人已经买好了票。栈道下的排水闸也通往对岸。'},
  {name:'旧育养所',art:'nursery',time:'19:02',intro:'门框上留下了许多身高刻线。有一道很浅，刚好到你现在的腰。'},
  {name:'海城通讯局',art:'exchange',time:'19:26',intro:'两根线都断了。压在接线台下面的工单上，能认出妹妹的电话号码。'},
  {name:'无人签收',art:'returns',time:'19:32',intro:'退信窗旁压着一封泡湿的信。姓名已经看不清了，纸上还有三道摸得出来的压痕。'},
  {name:'拖锚的海堤',art:'causeway',time:'19:41',intro:'浪打上堤沿。水一退，石头上就多出一道拖痕，一直通到你脚下。'},
  {name:'灯塔内梯',art:'tower-stairs',time:'19:55',intro:'门在楼上。每转过一层，头顶的灯就离你近一截。'}
];
const people = [
  ['lin','林遥','短期档案整理员','二十七岁。来海城做一份短工，行李里有妹妹托她带的旧相框。周日早上八点，她答应回去帮妹妹搬家。'],
  ['sister','妹妹','岸上的家人','搬家公司的车约好了。她把最沉的一箱书留在了门口，想等姐姐回来一起抬。'],
  ['aunt','阿姨','楼下的邻居','蒸鱼时会把葱另外装一碟。林遥才搬来，她就已经知道这个习惯。'],
  ['child','小满','连廊里的孩子','他够不着门栓，得踩在小板凳上。有人来敲门时，他先听对方怎么叫他。'],
  ['granny','测潮婆','海城的引路人','她用铅坠量水深。她认人的办法很慢，要听一个人的脚步，从近处走到远处。'],
  ['anchor','拖锚客','堤边的潜水衣','头盔里的玻璃早就黑了。浪小的时候，它把锚链绷在石面上，听谁的脚先落地。'],
  ['queue-caller','应号客','候船窗后的影子','喇叭报到十七号，窗玻璃先白了一小块。隔了一拍，玻璃后面才有人说「到」。'],
  ['keeper','灯首守夜人','塔内巡夜人','楼梯上先亮起一截扶手，随后才听见铁靴。它把每一层都照过一遍，最后在值班室门外验你的证。']
];
const locations = {
  room:{title:'海边出租屋',art:'room',chapter:0,section:'01',time:'17:42',height:70,start:21},
  landing:{title:'居民楼连廊',art:'hall',chapter:0,section:'01',time:'17:56',height:56,start:24},
  dinner:{title:'楼下的家宴',art:'dinner',chapter:1,section:'02',time:'18:06',height:65,start:18},
  flood:{title:'水下的家宴',art:'underwater',chapter:1,section:'02',time:'18:16',height:65,start:49},
  hall:{title:'门外的连廊',art:'dryhall',chapter:2,section:'03',time:'18:17',height:56,start:17},
  archive:{title:'悬空档案馆',art:'archive',chapter:3,section:'04',time:'18:31',height:52,start:24},
  ferry:{title:'末班渡口',art:'ferry',chapter:4,section:'05',time:'18:49',height:51,start:20},
  drain:{title:'旧排水闸',art:'drain',chapter:4,section:'05',time:'18:49',height:51,start:24},
  nursery:{title:'旧育养所',art:'nursery',chapter:5,section:'06',time:'19:02',height:52,start:20},
  exchange:{title:'海城通讯局',art:'exchange',chapter:6,section:'07',time:'19:26',height:51,start:14},
  returns:{title:'退信室',art:'returns',chapter:7,section:'08',time:'19:32',height:58,start:13},
  causeway:{title:'拖锚的海堤',art:'causeway',chapter:8,section:'09',time:'19:41',height:30,start:16},
  waitingRoom:{title:'废弃候船室',art:'waiting-room',chapter:8,section:'09',time:'19:43',height:52,start:21},
  lostOffice:{title:'失物招领间',art:'lost-office',chapter:8,section:'09',time:'19:45',height:56,start:19},
  stairs:{title:'灯塔内梯',art:'tower-stairs',chapter:9,section:'10',time:'19:55',height:9.8,start:1},
  tower:{title:'灯塔值班室',art:'tower',chapter:9,section:'10',time:'19:58',height:52,start:30},
  signalhut:{title:'旧雾号房',art:'signalhut',chapter:8,section:'09',time:'19:48',height:48,start:13},
  culvert:{title:'塔下涵洞',art:'culvert',chapter:8,section:'09',time:'19:50',height:43,start:12},
  after:{title:'余生',art:'room',chapter:9,section:'尾声',height:56,start:13}
};
const clues = {
  dockNotice:['末班的旧存根','一九九八年的末班点名页。十七号那格只写着“有应声”，验票的圆格没有打孔。'],
  benchStub:['旧候船票根','十七号，三角撕口旁有两个一高一低的针眼。登船孔还是完整的。'],
  unclaimedName:['没上船的十七号','周桂兰留在本岸等女儿下夜班。末班船开后她还在写便笺，点名簿却把应声算成了一个人。'],
  pipeScrapes:['暖气管里的椅脚声','楼下拖了两下椅子，第二下特别长。'],
  wetTicket:['二楼的湿车票','鞋底带出的单程票，背面印着一个倒写的贰。楼道地上只有这一块湿印。'],
  luggage:['旧相框','玻璃裹在衬衣里，底座忘在了岸上。妹妹的新家给它留了位置。'],
  voice:['周日八点','妹妹约了搬家公司。语音末尾，楼下喊开饭，她竟然也答了一声。'],
  parcel:['提前寄出的包裹','收件人是林遥。邮戳比她接到这份工作还早三天，里面正是相框缺的底座。'],
  chair:['第七把椅子','椅面朝下时才能看见，木头背面贴着“林遥”两个字。'],
  photo:['合影背面','靠门的小孩是小满。他身旁的女人，年轻时和林遥几乎一模一样。槐巷七号，迁柳街三号，末迁盐路九号。'],
  tape:['门口的录音','女人喊他“小满”。她说，插销不用拔，等我回来。'],
  identity:['他怎么称呼你','小满记住了你们在门前的约定。'],
  ledger:['三份入城档案','1912、1956、1998。三次签名都写着林遥，末页的离城许可却填着明天。'],
  sorted:['迁居簿','槐巷七号、柳街三号、盐路九号。三次签收，每个“遥”字的最后一捺都越了格。'],
  registered:['通行登记','通行证已盖章。'],
  granny:['测潮婆的见证','她用手杖敲了两下地板，说她记得我走路的声音。'],
  clerk:['值班员许荣生','末班船给值班员留着一个座位。他递给小满半个橘子。'],
  erased:['半张回程船票','值班员的住户页已注销。许荣生的工牌后面，夹着半张回家的船票。'],
  gauge:['旧闸水尺','从高处退过白线时，朝西岸开闸。回涨时即便水面更低，水压也会顶回闸门。'],
  drained:['下行潮','闸门向西退开。我和小满从退水后的检修道上了岸。'],
  heightMark:['门框上的刻线','刻线下面写着林遥。最矮的那一笔，离地还不到一米。'],
  truth:['送她去岸上','等她有想回去的家，再叫她回来。'],
  matched:['六岁的生日照','铁花和窗框都对上了。年幼的林遥坐在窗边下铺，手里捧着一只纸船。'],
  boat:['折了两次的船头','纸船包着一颗乳牙。里面写着：再长一厘米，就一米零八了。纸边有两个针眼。'],
  token:['围裙上的铜扣','阿姨亲手解下铜扣。她同意在交接窗口签自己的名字。'],
  names:['七户底联','七份底联齐全。撤销总册后，必须有人留在这里记住每个名字。'],
  shared:['两份见证','小满记我的声音，测潮婆记我的脚步。他们愿意在分线时替我作证。'],
  diagram:['旧配线工单','塔台一声长，本埠两声短。白绳出岸，黑绳回塔，空号勿占。'],
  wired:['听筒里的声音','线路重新接通。妹妹还记得周日八点。'],
  carbonCopy:['退件复写联','湿信的压痕里有三个记号。许荣生、双短铃、月牙缺口。'],
  routedLetter:['对岸分拣条','双短铃和月牙剪口对应靠窗的邮格。邮绳沿末班航线把信送到了对岸。'],
  signedReceipt:['渡口签收联','许荣生亲自签收。“生”字还没干，旁边有一弯橘皮印。'],
  keptLetter:['原名留存联','亲收栏仍空着。林遥按许荣生的原名收存了这封信。'],
  parcelLight:['应急灯下的吊牌','斜光照出了包裹上的名字。身后多出来的那一步，我没回头看。'],
  lookedBack:['门缝里的末班车','隔着一道干燥的门槛，我又看见那辆车。'],
  casingEcho:['木壳里的回铃','听筒搁好了。第二声回铃从空孔下面传出来。'],
  rakingLight:['侧光下的压痕','斜光照出三个字：明日迁。签字的人，今天还在这里。'],
  passed:['塔内放行','守夜人对过通行证，推开了值班室的门。']
};
const targets = {
  room:[['pipe','贴耳听暖气管',54,26],['case','行李箱',13,83,'luggage'],['power','电表',60,30,'power'],['phone','电话',68,55,'voice'],['door','房门',92,52]],
  landing:[['parcel','包裹',91,63,'parcel'],['dine','下楼赴宴',35,55]],
  dinner:[['chair','折椅',8,65,'chair'],['table','碗筷',33,59,'table'],['fish','灶台',87,48,'fish'],['aunt','阿姨',70,42]],
  flood:[['window','窗外',40,25,'window'],['leave','通往连廊',13,52]],
  hall:[['doorEar','贴耳听门板',55,60],['lookBack','回头看门缝',13,52,'lookedBack'],['photo','墙上合影',90,35,'photo'],['tape','旧录音机',76,69,'tape'],['kid','敲门',61,50],['breaker','配电箱',42,40,'emergency']],
  archive:[['lampCopy','请小满举灯',34,55,'rakingLight'],['ledger','旧档抽屉',13,48,'ledger'],['sort','迁居簿',48,59,'sorted'],['register','通行登记',60,58,'registered'],['granny','测潮婆',72,50,'granny'],['route','外廊岔口',93,55]],
  ferry:[['back','返回档案馆',9,64],['clerk','值班窗口',33,41,'clerk'],['manifest','末班船名册',49,70,'erased'],['rollSlip','值班牌的纸角',64.6,50.2,'dockNotice'],['board','登船',87,52]],
  drain:[['back','返回档案馆',8,64],['gauge','潮位尺',56,49,'gauge'],['wheel','闸轮',30,37,'drained'],['rollSlip','值班牌的纸角',48.8,37.2,'dockNotice']],
  nursery:[['birthday','比对生日照',21,42,'matched'],['tin','床脚铁盒',36,73,'boat'],['heightMark','门框刻线',52,51,'heightMark'],['nurseryAunt','阿姨',70,47],['roster','登记底联',90,52,'names'],['witness','两份见证',32,54,'shared'],['toExchange','去通讯局',60,36]],
  exchange:[['toNursery','返回育养所',8,65],['diagram','配线工单',29,53,'diagram'],['patch','接线台',53,65,'wired'],['toReturns','退信室侧门',69,47],['toBridge','上堤道',88,47]],
  returns:[['toExchangeHall','离开退信室',9,57],['wetLetter','湿信与复写联',29,57,'carbonCopy'],['postRack','分拣架',53,44,'routedLetter'],['receiptDesk','回执窗',79,58]],
  causeway:[['toRadio','返回通讯局',9,55],['oldPier','旧渡口侧门',18,73],['shelter','石龛',45,68,'shrineReached'],['winch','旧绞盘',73,69,'crossed'],['toTower','堤外岔路',91,63]],
  waitingRoom:[['pierSteps','回到海堤',12.3,56],['pierChild','小满',9,66],['callBench','听号长椅',37.4,61,'benchStub'],['claimDoor','招领窗旁的门',92,57.1]],
  lostOffice:[['waitingDoor','回候船室',14.3,53.1],['claimShelf','失物架',65.4,54,'unclaimedName'],['deliveryHatch','投递梯内门',87.3,55.8,'deliveryStair']],
  signalhut:[['backGate','回到铁门',8,68],['signalBoard','值班木牌',32,47],['hornPull','雾号绳',59,56],['towerDoor','塔基小门',89,57]],
  culvert:[['backGate','回到铁门',7,63],['tideMark','水线',48,49],['grille','铁栅',86,59]],
  stairs:[['stairBack','回到塔脚',1,0],['stairFirst','第一层背光处',34,0],['stairSecond','第二层背光处',65,0],['stairTop','上层门廊',98,0],['keeperCheck','出示通行证',98,0,'passed'],['dutyDoor','值班室的门',98,0]],
  tower:[['down','返回塔内楼梯',12,47],['duty','值班索引',24,68],['line','岸线听筒',33,58],['handover','交接窗口',48,54],['ledgerEnd','居民总册',60,71],['relay','分线匣',80,52]]
};
function objective(state) {
  const f=state.flags;
  switch(state.room) {
    case 'room':
      if(!f.luggage)return ['把行李安顿下来','case'];
      if(!f.power)return ['检查墙上的电表','power'];
      if(!f.voice)return ['听完妹妹留下的语音','phone'];
      return ['去门外看看','door'];
    case 'landing':if(landingIsDark(state))return [f.foundRail?'借应急灯辨认吊牌':'跳闸了。拿手电沿扶手找路','torch'];
      return f.parcel?['下楼赴阿姨的家宴','dine']:['收下寄给你的包裹','parcel'];
    case 'dinner':
      if(!f.chair)return ['搬来第七把椅子','chair'];
      if(!f.table)return ['把最后一副碗筷摆上桌','table'];
      if(!f.fish)return ['去灶台把鱼端上桌','fish'];
      return ['问问阿姨，人齐了吗','aunt'];
    case 'flood':return f.window?['循着敲门声去连廊','leave']:['在桌边待一会儿','window'];
    case 'hall':
      if(!f.photo)return ['翻看墙上的合影','photo'];
      if(!f.tape)return ['听听门外留下的录音','tape'];
      if(f.honest)return ['让配电间的应急灯亮起来','breaker'];
      return ['敲门，回应门后的孩子','kid'];
    case 'archive':
      if(!f.ledger)return ['找出三份署着自己名字的旧档','ledger'];
      if(!f.sorted)return ['核对三年的底联，还原门牌','sort'];
      if(!f.registered)return ['决定怎样登记自己的身份','register'];
      if(state.registration==='visitor'&&!f.granny)return ['请测潮婆为外来者作证','granny'];
      return ['去外廊选择前往育养所的水路','route'];
    case 'ferry':
      if(!f.clerk)return ['问问值班员，船上还有座吗','clerk'];
      if(!f.erased)return ['翻开末班船的名册','manifest'];
      return ['带小满登上末班船','board'];
    case 'drain':
      return f.gauge?['在下行潮向西岸开闸','wheel']:['读出潮位尺上的标记','gauge'];
    case 'nursery':
      if(!f.truth){
        if(!f.matched)return ['把旧生日照对回窗边的床栏','birthday'];
        if(!f.boat)return ['翻开床脚铁盒里的纸船','tin'];
        if(!f.heightMark)return ['把纸船的针眼贴回门框','heightMark'];
        return ['问阿姨，谁刻下了你的名字','nurseryAunt'];
      }
      if(!f.auntAsked)return ['听听阿姨还想对你说什么','nurseryAunt'];
      return ['收好要带的东西，去通讯局','toExchange'];
    case 'exchange':
      if(!f.diagram)return ['读接线台下的旧工单','diagram'];
      if(!f.wired)return ['把岸线与塔线接回相应端子','patch'];
      return ['沿扶梯登上堤道','toBridge'];
    case 'returns':
      if(!f.carbonCopy)return ['把湿信上洇掉的字拓下来','wetLetter'];
      if(!f.routedLetter)return ['按班铃和票角剪口分拣','postRack'];
      if(!f.signedReceipt&&!f.keptLetter)return ['到回执窗核对谁能签收','receiptDesk'];
      return ['收好回执，走出退信室','toExchangeHall'];
    case 'causeway':
      if(!f.crossed)return f.shrineReached?['沿铁板轻步走到绞盘','winch']:['借浪声走到石龛','shelter'];
      return ['堤外岔路','toTower'];
    case 'waitingRoom':return f.benchStub?['招领窗旁的门','claimDoor']:['听号长椅','callBench'];
    case 'lostOffice':return f.unclaimedName?['投递梯内门','deliveryHatch']:['失物架','claimShelf'];
    case 'signalhut':return f.signalAnswered?['塔基小门','towerDoor']:['雾号绳','hornPull'];
    case 'culvert':return ['铁栅','grille'];
    case 'stairs':
      if(!f.stairFirst)return ['沿铁梯上到第一处平台','stairFirst'];
      if(!f.stairSecond)return ['循着背光的一侧往上走','stairSecond'];
      if(!f.stairTop)return ['上到值班室外的门廊','stairTop'];
      return f.passed?['推开值班室的门','dutyDoor']:['让守夜人核对通行证','keeperCheck'];
    case 'tower':return ['翻开值班索引，选择一处窗口','duty'];
    case 'after':return [endings[state.ending].steps[state.epStep][0],'memory'];
  }
}
