(()=>{
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const pick=(r,a)=>a[Math.floor(r()*a.length)];
function hashSeed(s){let h=2166136261>>>0;for(const c of String(s)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function seeded(seed){let s=hashSeed(seed)||1;return()=>{s+=0x6D2B79F5;let t=s;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return((t^t>>>14)>>>0)/4294967296}}
function exp(r,mean){return-Math.log(Math.max(1e-9,1-r()))*mean}
function normal(r,mean,sd){let u=1-r(),v=1-r();return Math.max(0.05,mean+sd*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v))}
const TYPES={
 container:{label:'Container Ship',loa:[180,330],draft:[8.5,13.2],cargo:[900,3600],priority:2,cranes:[2,4],baseRate:32,color:0x4cc9f0},
 bulk:{label:'Bulk Carrier',loa:[170,290],draft:[8.5,13],cargo:[12000,52000],priority:1,cranes:[1,2],baseRate:620,color:0xf6bd60},
 tanker:{label:'Product Tanker',loa:[150,250],draft:[7.5,11.8],cargo:[7000,28000],priority:3,cranes:[1,1],baseRate:520,color:0xff7b7b},
 general:{label:'General Cargo',loa:[120,220],draft:[6.5,10.5],cargo:[2500,12000],priority:1,cranes:[1,2],baseRate:160,color:0x90e0a4}
};
const NAMES=['Aurora','Meridian','Ocean Crest','Blue Kestrel','Nordic Vale','Eastern Crown','Atlas Horizon','Pacific Ember','Stellar Mariner','Aegean Star','Iron Gull','Sea Venture','Arctic Falcon','Calypso Dawn','Golden Cape','Marmara Wind','Cobalt Trader','Baltic Swan','Orion Bay','Silver Wake'];
const BERTHS=[
 {id:0,name:'Berth A',kind:'Container',y:.22,maxLoa:340,maxDraft:13.5,types:['container','general'],craneCap:4},
 {id:1,name:'Berth B',kind:'Bulk / General',y:.50,maxLoa:300,maxDraft:12.8,types:['bulk','general'],craneCap:2},
 {id:2,name:'Berth C',kind:'Multipurpose',y:.78,maxLoa:260,maxDraft:11.8,types:['container','bulk','tanker','general'],craneCap:2}
];
const WEATHER={
 fair:{label:'Fair',wind:8,vis:10,crane:1,maneuver:1,color:'#7fd7ff'},
 breeze:{label:'Fresh Breeze',wind:19,vis:10,crane:.88,maneuver:.9,color:'#b9e4ff'},
 fog:{label:'Fog',wind:4,vis:.7,crane:.82,maneuver:.68,color:'#c9d1d9'},
 squall:{label:'Squall',wind:31,vis:4,crane:.48,maneuver:.28,color:'#7c92a5'}
};
const STAGES={ARRIVING:'Arriving',ANCHORAGE:'Anchorage',PILOT_TRANSIT:'Pilot Boat En Route',PILOT_BOARDING:'Pilot Boarding',INBOUND:'Inbound Transit',TUG_RENDEZVOUS:'Tug Rendezvous',TURNING:'Turning Basin',BERTHING:'Final Berthing',MOORING:'Mooring',CARGO:'Cargo Operations',UNMOORING:'Unmooring',OUTBOUND:'Outbound Transit',COMPLETE:'Completed'};
function pushEvent(w,type,text,ship=null){w.events.unshift({id:++w.eventSeq,t:w.time,type,text,shipId:ship?.id??null});if(w.events.length>500)w.events.length=500}
function radio(w,from,text,ship=null){w.radio.unshift({id:++w.radioSeq,t:w.time,from,text,shipId:ship?.id??null});if(w.radio.length>220)w.radio.length=220;pushEvent(w,'radio',`${from}: ${text}`,ship)}
function rand(w){w.rngState=(Math.imul(w.rngState||1,1664525)+1013904223)>>>0;return w.rngState/4294967296}
function rint(w,a,b){return Math.round(a+(b-a)*rand(w))}
function makeShip(w,at){const keys=Object.keys(TYPES),type=pick(()=>rand(w),keys),t=TYPES[type],loa=rint(w,t.loa[0],t.loa[1]),draft=+(t.draft[0]+rand(w)*(t.draft[1]-t.draft[0])).toFixed(1),cargo=rint(w,t.cargo[0],t.cargo[1]);const eta=at;return{id:++w.shipSeq,name:`${pick(()=>rand(w),NAMES)} ${String(w.shipSeq).padStart(2,'0')}`,type,loa,draft,cargo,remainingCargo:cargo,priority:t.priority,due:eta+rint(w,420,980),arrival:eta,anchorAt:null,berthAt:null,departedAt:null,stage:'ARRIVING',stageStart:eta,stageDuration:35+rint(w,0,25),berthId:null,pilotId:null,tugs:[],cranes:0,wait:0,delay:0,speed:10,heading:90,color:t.color,radioStage:null,serviceEstimate:estimateCargoMinutes(type,cargo,Math.min(t.cranes[1],2),1),stats:{maneuver:0,cargo:0}}}
function estimateCargoMinutes(type,cargo,cranes,weatherFactor){const t=TYPES[type];const rate=t.baseRate*Math.max(1,cranes)*weatherFactor;return Math.max(50,cargo/rate*60)}
function compatible(ship,b){return b.types.includes(ship.type)&&ship.loa<=b.maxLoa&&ship.draft<=b.maxDraft}
function queueScore(w,s,policy){const waited=Math.max(0,w.time-(s.anchorAt??s.arrival));const dueSlack=s.due-w.time-s.serviceEstimate;if(policy==='fcfs')return waited;if(policy==='spt')return 10000-s.serviceEstimate;if(policy==='priority')return s.priority*300+waited;if(policy==='edd')return 10000-s.due+waited*.15;return waited*1.25+s.priority*170-Math.max(0,dueSlack)*.08-s.serviceEstimate*.08}
function freeBerths(w){return w.berths.filter(b=>b.shipId==null)}
function findAssignment(w){const q=w.ships.filter(s=>s.stage==='ANCHORAGE');if(!q.length)return null;const policy=w.policy;let best=null;for(const b of freeBerths(w))for(const s of q){if(!compatible(s,b))continue;const sc=queueScore(w,s,policy)+(b.craneCap>=TYPES[s.type].cranes[1]?25:0);if(!best||sc>best.score)best={ship:s,berth:b,score:sc}}return best}
function resourceOkForInbound(w,s){const needTugs=s.loa>280?2:s.loa>190?1:0;return w.resources.pilotsBusy<w.resources.pilots&&w.resources.tugs-w.resources.tugsBusy>=needTugs}
function reserveInbound(w,s,b){const needTugs=s.loa>280?2:s.loa>190?1:0;s.pilotId=++w.pilotSeq;s.tugs=Array.from({length:needTugs},()=>++w.tugSeq);w.resources.pilotsBusy++;w.resources.tugsBusy+=needTugs;b.shipId=s.id;s.berthId=b.id;s.berthAt=w.time;s.cranes=Math.min(b.craneCap,TYPES[s.type].cranes[1],Math.max(1,w.resources.cranes-w.resources.cranesBusy));s.cranes=Math.max(1,s.cranes);w.resources.cranesBusy+=s.cranes;s.stage='PILOT_TRANSIT';s.stageStart=w.time;s.stageDuration=10+rint(w,0,6);pushEvent(w,'dispatch',`${s.name} assigned ${b.name} under ${w.policy.toUpperCase()} scheduling.`,s);radio(w,'PORT CONTROL',`${s.name}, berth allocated ${b.name}. Pilot boat proceeding. Maintain position at pilot station.`,s)}
function releaseManeuver(w,s){if(s.pilotId!=null){w.resources.pilotsBusy=Math.max(0,w.resources.pilotsBusy-1);s.pilotId=null}if(s.tugs.length){w.resources.tugsBusy=Math.max(0,w.resources.tugsBusy-s.tugs.length);s.tugs=[]}}
function releaseAll(w,s){releaseManeuver(w,s);if(s.cranes){w.resources.cranesBusy=Math.max(0,w.resources.cranesBusy-s.cranes);s.cranes=0}if(s.berthId!=null){w.berths[s.berthId].shipId=null;s.berthId=null}}
function setStage(w,s,stage,dur,speed=null,heading=null){s.stage=stage;s.stageStart=w.time;s.stageDuration=Math.max(1,dur);if(speed!=null)s.speed=speed;if(heading!=null)s.heading=heading;stageRadio(w,s,stage)}
function stageRadio(w,s,stage){const messages={PILOT_BOARDING:['PILOT BOAT',`${s.name}, reduce to five knots and make a good lee. Pilot ladder on starboard side.`],INBOUND:['PILOT',`Master, pilot on board. Engines standby. Proceed inbound at six knots.`],TUG_RENDEZVOUS:['PILOT',`Tugs approach. Keep steerage way; reduce to four knots.`],TURNING:['PILOT',`Dead slow ahead. Port ten. Tugs, stand by to assist the turn.`],BERTHING:['PILOT',`Stop engine. Tug aft easy astern; forward tug push half. Closing berth at minimum speed.`],MOORING:['MOORING TEAM',`Forward and aft stations ready. Send headlines and stern lines ashore.`],CARGO:['TERMINAL',`${s.name}, all fast. Cargo team cleared to commence operations.`],UNMOORING:['PILOT',`Single up to one and one. Tugs made fast. Stand by engines.`],OUTBOUND:['PILOT',`Let go all. Dead slow ahead. Proceeding outbound.`]};if(messages[stage])radio(w,messages[stage][0],messages[stage][1],s)}
function weatherStep(w){if(w.time<w.nextWeather)return;const cur=w.weather.key;const r=rand(w);let next=cur;if(cur==='fair')next=r<.7?'fair':r<.88?'breeze':r<.96?'fog':'squall';else if(cur==='breeze')next=r<.36?'fair':r<.76?'breeze':r<.9?'fog':'squall';else if(cur==='fog')next=r<.35?'fair':r<.55?'breeze':r<.9?'fog':'squall';else next=r<.48?'breeze':r<.72?'fair':r<.86?'fog':'squall';w.weather={key:next,...WEATHER[next]};w.nextWeather=w.time+rint(w,90,300);if(next!==cur)pushEvent(w,'weather',`Weather changed: ${w.weather.label}, wind ${w.weather.wind} kn, visibility ${w.weather.vis} nm.`)}
function mayManeuver(w){return rand(w)<w.weather.maneuver}
function advanceShip(w,s,dt){if(s.stage==='ARRIVING'&&w.time>=s.stageStart+s.stageDuration){setStage(w,s,'ANCHORAGE',1,0,90);s.anchorAt=w.time;pushEvent(w,'arrival',`${s.name} anchored in the roadstead.`,s);radio(w,'PORT CONTROL',`${s.name}, anchor at designated anchorage and await pilot instructions.`,s);return}
 if(s.stage==='ANCHORAGE'){s.wait+=dt;return}
 const p=clamp((w.time-s.stageStart)/s.stageDuration,0,1);if(p<1)return;
 switch(s.stage){
  case'PILOT_TRANSIT':setStage(w,s,'PILOT_BOARDING',7+rint(w,0,4),5,90);break;
  case'PILOT_BOARDING':setStage(w,s,'INBOUND',18+rint(w,2,8),6,90);break;
  case'INBOUND':setStage(w,s,'TUG_RENDEZVOUS',8+rint(w,1,5),4,90);break;
  case'TUG_RENDEZVOUS':if(mayManeuver(w))setStage(w,s,'TURNING',10+rint(w,2,7),2.5,45);else{s.stageStart=w.time;radio(w,'PILOT',`Holding in basin. Wind/visibility outside comfortable maneuvering window.`,s)}break;
  case'TURNING':setStage(w,s,'BERTHING',11+rint(w,2,7),1.2,0);break;
  case'BERTHING':setStage(w,s,'MOORING',9+rint(w,2,5),0,0);break;
  case'MOORING':releaseManeuver(w,s);s.stage='CARGO';s.stageStart=w.time;s.stageDuration=estimateCargoMinutes(s.type,s.remainingCargo,s.cranes,w.weather.crane);s.speed=0;stageRadio(w,s,'CARGO');pushEvent(w,'cargo',`${s.name} commenced cargo at ${w.berths[s.berthId].name} with ${s.cranes} crane gang${s.cranes>1?'s':''}.`,s);break;
  case'CARGO':if(resourceOkForInbound(w,s)){const needTugs=s.loa>280?2:s.loa>190?1:0;s.pilotId=++w.pilotSeq;s.tugs=Array.from({length:needTugs},()=>++w.tugSeq);w.resources.pilotsBusy++;w.resources.tugsBusy+=needTugs;setStage(w,s,'UNMOORING',10+rint(w,2,6),0,0)}else{s.stageStart=w.time;s.stageDuration=8;radio(w,'PORT CONTROL',`${s.name}, outbound pilot/tug resources delayed. Remain all fast.`,s)}break;
  case'UNMOORING':if(s.cranes){w.resources.cranesBusy=Math.max(0,w.resources.cranesBusy-s.cranes);s.cranes=0}setStage(w,s,'OUTBOUND',28+rint(w,3,9),7,270);break;
  case'OUTBOUND':releaseAll(w,s);s.stage='COMPLETE';s.departedAt=w.time;s.speed=10;pushEvent(w,'departure',`${s.name} cleared the breakwater and departed port.`,s);radio(w,'PORT CONTROL',`${s.name}, pilot clear. Have a safe voyage.`,s);w.completed.push(s.id);break;
 }
}
function cargoStep(w,s,dt){if(s.stage!=='CARGO')return;const t=TYPES[s.type],rate=t.baseRate*Math.max(1,s.cranes)*w.weather.crane;const done=rate/60*dt;s.remainingCargo=Math.max(0,s.remainingCargo-done);s.stats.cargo+=dt;if(s.remainingCargo<=0){s.stageStart=w.time-s.stageDuration;pushEvent(w,'cargo',`${s.name} completed cargo operations.`,s);radio(w,'TERMINAL',`${s.name}, cargo complete. Final figures agreed. Stand by for departure.`,s)}}
function schedule(w){let guard=0;while(guard++<10){const a=findAssignment(w);if(!a||!resourceOkForInbound(w,a.ship))break;reserveInbound(w,a.ship,a.berth)}}
function spawnStep(w){if(w.time<w.nextArrival)return;const s=makeShip(w,w.time);w.ships.push(s);pushEvent(w,'eta',`${s.name} (${TYPES[s.type].label}, LOA ${s.loa} m, draft ${s.draft} m) entered VTS area.`,s);radio(w,'PORT CONTROL',`${s.name}, report at pilot station. Traffic sequence acknowledged.`,s);w.nextArrival=w.time+Math.max(25,Math.round(exp(()=>rand(w),w.arrivalMean)))}
function objective(w){const done=w.completed.map(id=>w.ships.find(s=>s.id===id)).filter(Boolean);const waiting=w.ships.filter(s=>s.stage==='ANCHORAGE').reduce((a,s)=>a+s.wait,0);const tardy=w.ships.reduce((a,s)=>a+Math.max(0,w.time-s.due),0);const avgTurn=done.length?done.reduce((a,s)=>a+(s.departedAt-s.arrival),0)/done.length:0;const berthIdle=w.berths.reduce((a,b)=>a+(b.shipId==null?1:0),0)/w.berths.length;return waiting*.45+tardy*.2+avgTurn*.25+berthIdle*80*.1}
function stats(w){const elapsed=Math.max(1,w.time),done=w.completed.map(id=>w.ships.find(s=>s.id===id)).filter(Boolean),arrived=w.ships.length,q=w.ships.filter(s=>s.stage==='ANCHORAGE'),busy=w.berths.filter(b=>b.shipId!=null).length,avgWait=done.length?done.reduce((a,s)=>a+s.wait,0)/done.length:0,avgTurn=done.length?done.reduce((a,s)=>a+(s.departedAt-s.arrival),0)/done.length:0,throughput=done.length/(elapsed/1440),lambda=arrived/(elapsed/60),wqHours=avgWait/60,littleL=lambda*wqHours;return{elapsed,arrived,completed:done.length,queue:q.length,avgWait,avgTurn,throughput,berthUtil:busy/w.berths.length,pilotUtil:w.resources.pilotsBusy/w.resources.pilots,tugUtil:w.resources.tugsBusy/w.resources.tugs,craneUtil:w.resources.cranesBusy/w.resources.cranes,lambda,littleL,objective:objective(w),weather:w.weather.label}}
function step(w,minutes=1){for(let i=0;i<minutes;i++){w.time++;weatherStep(w);spawnStep(w);for(const s of w.ships){if(s.stage!=='COMPLETE'){cargoStep(w,s,1);advanceShip(w,s,1)}}schedule(w);if(w.time%15===0)w.history.push({t:w.time,...stats(w)});if(w.history.length>900)w.history.shift()}return w}
function generate(seed='PORT-OPS-01',opts={}){const r=seeded(seed),w={version:1,seed:String(seed),time:0,eventSeq:0,radioSeq:0,shipSeq:0,pilotSeq:0,tugSeq:0,rngState:Math.floor(r()*1e9),policy:opts.policy||'hybrid',arrivalMean:+opts.arrivalMean||105,resources:{pilots:+opts.pilots||2,pilotsBusy:0,tugs:+opts.tugs||3,tugsBusy:0,cranes:+opts.cranes||7,cranesBusy:0},berths:BERTHS.map(b=>({...b,shipId:null})),weather:{key:'fair',...WEATHER.fair},nextWeather:120,nextArrival:25,ships:[],completed:[],events:[],radio:[],history:[]};for(let i=0;i<3;i++){const s=makeShip(w,10+i*18);w.ships.push(s)}return w}
function setPolicy(w,p){if(['fcfs','spt','priority','edd','hybrid'].includes(p)){w.policy=p;pushEvent(w,'or',`Berth scheduling policy changed to ${p.toUpperCase()}.`)}}
function summary(w){return stats(w)}
function serialize(w){return JSON.stringify(w)}
function deserialize(s){return typeof s==='string'?JSON.parse(s):structuredClone(s)}
window.PortSimEngine={generate,step,stats:summary,setPolicy,serialize,deserialize,STAGES,TYPES,WEATHER,compatible,queueScore,objective};
})();