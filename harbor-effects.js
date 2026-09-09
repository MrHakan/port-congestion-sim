(()=>{
'use strict';
const H=window.HarborRenderer;if(!H)return;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const original=H.prototype.updateShipView;
function makePilot(){const c=new PIXI.Container(),g=new PIXI.Graphics();g.beginFill(0xf4c08e).drawRect(-2,-8,4,4).endFill();g.beginFill(0xf6d64a).drawRect(-3,-4,6,6).endFill();g.beginFill(0x1b2b34).drawRect(-3,2,2,5).drawRect(1,2,2,5).endFill();g.beginFill(0xf3e15c).drawRect(-3,-10,6,2).endFill();c.addChild(g);return c}
function ensure(v,renderer){if(v.detail)return;const d={ladder:new PIXI.Graphics(),pilot:makePilot(),lines:new PIXI.Graphics(),tow:new PIXI.Graphics(),heaving:new PIXI.Graphics()};renderer.fx.addChild(d.ladder,d.lines,d.tow,d.heaving,d.pilot);v.detail=d}
H.prototype.updateShipView=function(s,v){original.call(this,s,v);ensure(v,this);const d=v.detail,w=this.app.renderer.width,h=this.app.renderer.height,pose=this.stagePose(s,w,h),p=clamp((this.world.time-s.stageStart)/Math.max(1,s.stageDuration),0,1);d.ladder.clear();d.lines.clear();d.tow.clear();d.heaving.clear();d.pilot.visible=false;
  // Pilot ladder: starboard side, pilot climbs from launch to deck before inbound transit.
  if(s.stage==='PILOT_BOARDING'){
    const sx=pose.x+7,deckY=pose.y+3,waterY=pose.y+30;d.ladder.lineStyle(2,0xd8bf8e,1);d.ladder.moveTo(sx-4,deckY).lineTo(sx-4,waterY);d.ladder.moveTo(sx+4,deckY).lineTo(sx+4,waterY);for(let y=deckY+4;y<waterY;y+=5)d.ladder.moveTo(sx-4,y).lineTo(sx+4,y);d.pilot.visible=true;d.pilot.position.set(sx,waterY-(waterY-deckY)*p);d.pilot.rotation=0;
  } else if(['INBOUND','TUG_RENDEZVOUS','TURNING','BERTHING','MOORING'].includes(s.stage)){
    // Pilot remains visible on the bridge wing during manoeuvring.
    d.pilot.visible=true;d.pilot.position.set(pose.x-8*Math.cos(pose.rot),pose.y-8*Math.sin(pose.rot)-8);d.pilot.rotation=pose.rot;
  }
  // Tug towlines from bow/stern tugs to vessel while made fast.
  if(['TUG_RENDEZVOUS','TURNING','BERTHING','UNMOORING'].includes(s.stage)&&v.tugs?.length){d.tow.lineStyle(1,0xd9d0b5,.92);for(const tug of v.tugs){if(!tug.visible)continue;d.tow.moveTo(tug.x,tug.y).lineTo(pose.x,pose.y)}}
  // Mooring ropes and animated heaving line to quay bollards.
  if(s.berthId!=null&&['MOORING','CARGO','UNMOORING'].includes(s.stage)){
    const quayX=w*.805,by=h*this.world.berths[s.berthId].y;d.lines.lineStyle(1,0xe5d4a2,.9);const alpha=s.stage==='MOORING'?clamp(p*1.6,0,1):s.stage==='UNMOORING'?1-p:1;d.lines.alpha=alpha;const offsets=[-30,-16,16,30];for(const oy of offsets){d.lines.moveTo(pose.x+4,pose.y+oy*.42).lineTo(quayX+7,by+oy)}
    if(s.stage==='MOORING'&&p<.65){const tx=pose.x+(quayX-pose.x)*p/0.65,ty=pose.y-18*Math.sin(Math.PI*p/0.65);d.heaving.lineStyle(1,0xffe9a8,1);d.heaving.moveTo(pose.x,pose.y-8).quadraticCurveTo((pose.x+tx)/2,ty-18,tx,ty);d.heaving.beginFill(0xffe9a8).drawCircle(tx,ty,2).endFill()}
  }else d.lines.alpha=1;
  // Mooring gang walks from terminal apron to bollards instead of appearing in place.
  if(v.workers?.length&&s.berthId!=null&&['MOORING','CARGO','UNMOORING'].includes(s.stage)){
    const by=h*this.world.berths[s.berthId].y;for(let i=0;i<v.workers.length;i++){const m=v.workers[i];if(!m.visible)continue;const targetX=w*(.817+.016*(i%3)),startX=w*.965;if(s.stage==='MOORING'){const walk=clamp(p*2.1-i*.06,0,1);m.x=startX+(targetX-startX)*walk;m.y=by-38+(i%3)*23+Math.sin((this.time+i)*.13)*1.3}else if(s.stage==='CARGO'){m.x=targetX;m.y=by-38+(i%3)*23+Math.sin((this.time+i)*.08)*1.2}else{const walk=clamp(p*1.5,0,1);m.x=targetX+(startX-targetX)*walk;m.y=by-38+(i%3)*23}}
  }
};
})();