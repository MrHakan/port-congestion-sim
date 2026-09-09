(()=>{
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
function heading(rot){return{x:Math.cos(rot),y:Math.sin(rot)}}
function starboard(rot){return{x:-Math.sin(rot),y:Math.cos(rot)}}
function port(rot){const s=starboard(rot);return{x:-s.x,y:-s.y}}
function dims(pose){return{length:pose.length||160,beam:pose.beam||48}}
function seawardNormal(pose,quayX=1632){
 const s=starboard(pose.rot),p=port(pose.rot),q=Math.sign(quayX-pose.x)||1;
 return s.x*q<p.x*q?s:p;
}
function quayNormal(pose,quayX=1632){const n=seawardNormal(pose,quayX);return{x:-n.x,y:-n.y}}
function point(pose,longitudinal=0,lateral=0,quayX=1632){const h=heading(pose.rot),n=seawardNormal(pose,quayX);return{x:pose.x+h.x*longitudinal+n.x*lateral,y:pose.y+h.y*longitudinal+n.y*lateral}}
function berthCenterX(beam,quayX=1632,gap=9){return quayX-beam/2-gap}
function pilotBoarding(pose){
 const {length,beam}=dims(pose),h=heading(pose.rot),s=starboard(pose.rot),halfB=beam/2;
 const long=-length*.14;
 const ladderTop={x:pose.x+h.x*long+s.x*(halfB-2),y:pose.y+h.y*long+s.y*(halfB-2)};
 const ladderBottom={x:pose.x+h.x*long+s.x*(halfB+13),y:pose.y+h.y*long+s.y*(halfB+13)};
 const boat={x:pose.x+h.x*(long-4)+s.x*(halfB+28),y:pose.y+h.y*(long-4)+s.y*(halfB+28)};
 return{boat,ladderTop,ladderBottom,normal:s,rotation:pose.rot};
}
function turningTugPlan(pose,count){
 const {length,beam}=dims(pose),h=heading(pose.rot),s=starboard(pose.rot),p=port(pose.rot),halfB=beam/2;
 const plans=[];
 if(count<=0)return plans;
 const fore=length*.31,aft=-length*.31;
 const add=(long,side,role)=>{
  const attach={x:pose.x+h.x*long+side.x*(halfB-2),y:pose.y+h.y*long+side.y*(halfB-2)};
  const target={x:pose.x+h.x*long+side.x*(halfB+45),y:pose.y+h.y*long+side.y*(halfB+45)};
  plans.push({target,attach,rotation:Math.atan2(attach.y-target.y,attach.x-target.x),role,line:true});
 };
 add(fore,p,'bow-push-starboard');
 if(count>1)add(aft,s,'stern-check');
 if(count>2)add(0,s,'midships-check');
 return plans.slice(0,count);
}
function tugPlan(pose,stage,count,progress=0,quayX=1632){
 if(count<=0)return[];
 if(stage==='TURNING')return turningTugPlan(pose,count);
 const p=clamp(progress,0,1),{length,beam}=dims(pose),h=heading(pose.rot),sea=seawardNormal(pose,quayX),halfB=beam/2;
 const longs=count===1?[0]:count===2?[length*.31,-length*.31]:Array.from({length:count},(_,i)=>lerp(length*.34,-length*.34,i/(count-1)));
 return longs.map((longitudinal,i)=>{
  let standoff=halfB+46,role='push',line=true;
  if(stage==='TUG_RENDEZVOUS'){standoff=halfB+62;role='make-fast'}
  else if(stage==='BERTHING'){standoff=halfB+38;role=i===0?'forward-push':'aft-push'}
  else if(stage==='UNMOORING'){standoff=halfB+40+92*smooth(p);role='pull'}
  else if(stage==='OUTBOUND'){standoff=halfB+58+55*p;role='escort';line=p<.25}
  const attach={x:pose.x+h.x*longitudinal+sea.x*(halfB-3),y:pose.y+h.y*longitudinal+sea.y*(halfB-3)};
  const target={x:pose.x+h.x*longitudinal+sea.x*standoff,y:pose.y+h.y*longitudinal+sea.y*standoff};
  const toward=Math.atan2(attach.y-target.y,attach.x-target.x),away=Math.atan2(target.y-attach.y,target.x-attach.x);
  return{target,attach,rotation:role==='pull'?away:toward,role,line};
 });
}
function mooringPlan(pose,quayX=1632){
 const {length,beam}=dims(pose),h=heading(pose.rot),q=quayNormal(pose,quayX),halfB=beam/2;
 const longs=[length*.42,length*.24,-length*.24,-length*.42];
 return longs.map((long,i)=>{
  const ship={x:pose.x+h.x*long+q.x*(halfB-2),y:pose.y+h.y*long+q.y*(halfB-2)};
  const bollard={x:quayX+8,y:pose.y+h.y*long*1.12+(i<2?-9:9)};
  return{ship,bollard,long};
 });
}
function distance(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}
const api={clamp,lerp,smooth,heading,starboard,port,dims,seawardNormal,quayNormal,point,berthCenterX,pilotBoarding,tugPlan,mooringPlan,distance};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof window!=='undefined')window.HarborOpsGeometry=api;
})();
