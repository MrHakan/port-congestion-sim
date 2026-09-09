(()=>{
'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;

function heading(rot){return{x:Math.cos(rot),y:Math.sin(rot)}}
function starboard(rot){return{x:-Math.sin(rot),y:Math.cos(rot)}}
function port(rot){const s=starboard(rot);return{x:-s.x,y:-s.y}}

function seawardNormal(pose,quayX){
  const a=starboard(pose.rot),b=port(pose.rot);
  const quayDir=Math.sign(quayX-pose.x)||1;
  return a.x*quayDir< b.x*quayDir?a:b;
}
function quayNormal(pose,quayX){
  const n=seawardNormal(pose,quayX);return{x:-n.x,y:-n.y};
}
function point(pose,longitudinal=0,lateral=0,quayX=1632){
  const h=heading(pose.rot),n=seawardNormal(pose,quayX);
  return{x:pose.x+h.x*longitudinal+n.x*lateral,y:pose.y+h.y*longitudinal+n.y*lateral};
}
function pilotBoarding(pose,quayX=1632){
  const n=starboard(pose.rot),h=heading(pose.rot);
  return{
    boat:{x:pose.x+n.x*48-h.x*6,y:pose.y+n.y*48-h.y*6},
    ladderTop:{x:pose.x+n.x*18-h.x*5,y:pose.y+n.y*18-h.y*5},
    ladderBottom:{x:pose.x+n.x*38-h.x*5,y:pose.y+n.y*38-h.y*5},
    normal:n
  };
}
function tugPlan(pose,stage,count,progress=0,quayX=1632){
  if(count<=0)return[];
  const p=clamp(progress,0,1),h=heading(pose.rot),sea=seawardNormal(pose,quayX);
  const longs=count===1?[0]:count===2?[46,-46]:Array.from({length:count},(_,i)=>lerp(54,-54,i/(count-1)));
  return longs.map((longitudinal,i)=>{
    let offset=68,role='push',line=true;
    if(stage==='TUG_RENDEZVOUS'){offset=88;role='make-fast'}
    else if(stage==='TURNING'){offset=74;role=i%2===0?'push':'check'}
    else if(stage==='BERTHING'){
      offset=58;
      role=i===0?'push':'check';
      if(count===1)role='push';
    }else if(stage==='UNMOORING'){
      offset=58+78*p;
      role='pull';
    }else if(stage==='OUTBOUND'){
      offset=70+70*p;
      role='escort';
      line=p<.28;
    }
    const attach={
      x:pose.x+h.x*longitudinal+sea.x*16,
      y:pose.y+h.y*longitudinal+sea.y*16
    };
    const target={
      x:pose.x+h.x*longitudinal+sea.x*offset,
      y:pose.y+h.y*longitudinal+sea.y*offset
    };
    const towardShip=Math.atan2(attach.y-target.y,attach.x-target.x);
    const awayFromShip=Math.atan2(target.y-attach.y,target.x-attach.x);
    return{target,attach,rotation:role==='pull'?awayFromShip:towardShip,role,line};
  });
}
const api={clamp,lerp,heading,starboard,port,seawardNormal,quayNormal,point,pilotBoarding,tugPlan};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
if(typeof window!=='undefined')window.HarborOpsGeometry=api;
})();
