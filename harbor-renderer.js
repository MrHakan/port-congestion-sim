(()=>{
'use strict';
const P=window.PIXI,A=window.PixelArt64,G=window.HarborOpsGeometry;
const WORLD_W=2048,WORLD_H=1152,QUAY_X=1632,TUG_BASE={x:1490,y:1050},PILOT_BASE={x:210,y:128};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};
class HarborRenderer{
 constructor(host){
  this.host=host;this.assets=A.create();this.world=null;this.shipViews=new Map();this.bubbles=new Map();this.time=0;this.selectedId=null;this.followId=null;this.onShipSelected=null;this.onCameraChanged=null;this.keys=new Set();this.pointers=new Map();this.dragMoved=false;this.pinch=null;this.mini=document.querySelector('#minimap');
  this.app=new P.Application({resizeTo:host,backgroundColor:0x06131d,antialias:false,resolution:1,autoDensity:false,powerPreference:'high-performance'});this.app.renderer.roundPixels=true;this.app.view.style.imageRendering='pixelated';this.app.view.style.touchAction='none';this.app.view.style.cursor='grab';host.prepend(this.app.view);
  this.cameraRoot=new P.Container();this.bg=new P.Container();this.routes=new P.Graphics();this.terminalLayer=new P.Container();this.actorLayer=new P.Container();this.fx=new P.Container();this.cameraRoot.addChild(this.bg,this.routes,this.terminalLayer,this.actorLayer,this.fx);this.app.stage.addChild(this.cameraRoot);
  this.camera={x:WORLD_W/2,y:WORLD_H/2,zoom:.68,min:.28,max:3.4};this.craneRigsByBerth=[[],[],[]];this.trucksByBerth=[[],[],[]];
  this.buildWorld();this.bindCamera();this.centerPort(false);this.app.ticker.add(d=>this.animate(d));
 }
 makeSprite(texture,x=0,y=0,scale=1,anchor=.5){const s=new P.Sprite(texture);s.texture.baseTexture.scaleMode=P.SCALE_MODES.NEAREST;s.anchor.set(anchor);s.position.set(Math.round(x),Math.round(y));s.scale.set(scale*(this.assets.displayScale||1));return s}
 tile(texture,x,y,w,h){const t=new P.TilingSprite(texture,w,h);t.position.set(x,y);t.tileScale.set((this.assets.displayScale||1)*2);return t}
 label(text,x,y,size=17,color=0xb7cbd3){const t=new P.Text(text,{fontFamily:'monospace',fontSize:size,fill:color,fontWeight:'700',letterSpacing:1});t.position.set(x,y);t.resolution=Math.min(4,Math.max(2,(window.devicePixelRatio||1)*2));return t}
 buildWorld(){
  this.bg.removeChildren();this.terminalLayer.removeChildren();this.craneRigsByBerth=[[],[],[]];this.trucksByBerth=[[],[],[]];
  this.bg.addChild(this.tile(this.assets.water,0,0,WORLD_W,WORLD_H));
  this.bg.addChild(this.tile(this.assets.land,QUAY_X+34,0,WORLD_W-QUAY_X-34,WORLD_H));
  this.bg.addChild(this.tile(this.assets.quay,QUAY_X,0,38,WORLD_H));
  this.bg.addChild(this.tile(this.assets.quay,0,72,430,42));
  for(let i=0;i<6;i++){const b=this.makeSprite(this.assets.quay,38+i*64,94,.46);b.rotation=Math.PI/2;this.bg.addChild(b)}
  this.bg.addChild(this.makeSprite(this.assets.lighthouse,395,71,.9));
  this.bg.addChild(this.makeSprite(this.assets.vts,PILOT_BASE.x,128,1.15));this.bg.addChild(this.label('PILOT STATION',120,190,18,0x9ec3d1));
  this.bg.addChild(this.makeSprite(this.assets.tugBase,TUG_BASE.x,1060,1.35));this.bg.addChild(this.label('TUG BASE',1420,1102,17,0xe3cd84));
  this.bg.addChild(this.makeSprite(this.assets.vts,1930,90,1.15));this.bg.addChild(this.label('VTS / PORT CONTROL',1810,150,16,0xc2dfe6));
  this.berthY=[.22,.50,.78].map(v=>Math.round(v*WORLD_H));
  this.berthY.forEach((y,i)=>this.drawBerth(i,y));
  for(let r=0;r<3;r++)for(let c=0;c<3;c++)this.bg.addChild(this.makeSprite(this.assets.containers,1770+c*84,420+r*92,.92));
  this.bg.addChild(this.label('ANCHORAGE',210,390,20,0x8eb1bd));this.bg.addChild(this.label('TURNING BASIN',1180,550,20,0x87a7b3));this.bg.addChild(this.label('INNER CHANNEL',760,415,17,0x7f9eaa));
  this.drawRoutes();
 }
 drawBerth(i,y){
  this.bg.addChild(this.tile(this.assets.land,QUAY_X+38,y-118,WORLD_W-QUAY_X-38,236));
  this.bg.addChild(this.tile(this.assets.quay,QUAY_X,y-116,42,232));
  this.bg.addChild(this.label(`BERTH ${String.fromCharCode(65+i)}`,1732,y-105,19,0xe3eded));
  const count=[4,2,2][i];
  for(let c=0;c<count;c++)this.craneRigsByBerth[i].push(this.createCraneRig(i,c,1745+c*82,y-5));
  for(let k=0;k<6;k++)this.bg.addChild(this.makeSprite(this.assets.quay,1652,y-88+k*34,.18));
  for(let j=0;j<2;j++)this.trucksByBerth[i].push(this.createTruckRig(i,j,1940-j*45,y+(j?66:-66)));
 }
 createCraneRig(berth,index,x,y){
  const root=new P.Container(),base=this.makeSprite(this.assets.crane,0,0,1.05),spreader=this.makeSprite(this.assets.spreader,-32,-18,.72),load=this.makeSprite(this.assets.containerSingle[(berth+index)%this.assets.containerSingle.length],-32,6,.32);
  root.position.set(x,y);root.addChild(base,spreader,load);this.terminalLayer.addChild(root);load.visible=false;
  return{root,base,spreader,load,berth,index};
 }
 createTruckRig(berth,index,x,y){
  const root=new P.Container(),body=this.makeSprite(this.assets.truck[index%2],0,0,.72),load=this.makeSprite(this.assets.containerSingle[(berth*2+index)%this.assets.containerSingle.length],-5,-12,.30);
  root.position.set(x,y);root.addChild(body,load);root.visible=false;this.terminalLayer.addChild(root);return{root,body,load,berth,index};
 }
 drawRoutes(){this.routes.clear();this.routes.lineStyle(3,0x79d9f4,.18);this.routes.moveTo(40,1040).lineTo(330,780).lineTo(720,610).lineTo(1080,560).lineTo(1370,560);this.routes.lineStyle(2,0xd7edf4,.10);for(const y of this.berthY)this.routes.moveTo(1370,560).lineTo(1510,y).lineTo(QUAY_X-75,y)}
 makeShip(s){
  const root=new P.Container(),sprite=this.makeSprite(this.assets.ship[s.type]||this.assets.ship.general,0,0,clamp(.95+(s.loa-150)/300,.9,1.55)),label=this.label(s.name,-48,-54,15,0xf3f0dc);
  root.addChild(sprite,label);root._sprite=sprite;root._label=label;root.eventMode='static';root.cursor='pointer';root.hitArea=new P.Rectangle(-70,-52,140,104);root.on('pointertap',()=>{if(this.dragMoved)return;this.focusShip(s.id,true)});this.actorLayer.addChild(root);return root
 }
 makeBoat(texture,scale=.52){return this.makeSprite(texture,0,0,scale)}
 makeWorker(i){const s=this.makeSprite(this.assets.worker[i%2],0,0,.48);s._frame=i%2;return s}
 destroyShipView(id,v){try{v.root.destroy({children:true});v.pilotBoat.destroy();v.boarder.destroy();v.lines.destroy();for(const x of v.tugs)x.destroy();for(const x of v.workers)x.destroy()}catch{}const b=this.bubbles.get(id);if(b){b.destroy({children:true});this.bubbles.delete(id)}this.shipViews.delete(id);if(this.selectedId===id)this.selectedId=null;if(this.followId===id)this.followId=null}
 clearDynamic(){for(const[id,v]of[...this.shipViews])this.destroyShipView(id,v);for(const b of this.bubbles.values())b.destroy({children:true});this.shipViews.clear();this.bubbles.clear();this.selectedId=this.followId=null}
 stagePose(s){
  const p=clamp((this.world.time-s.stageStart)/Math.max(1,s.stageDuration),0,1),q=smooth(p),by=this.world.berths[s.berthId]?.y?this.world.berths[s.berthId].y*WORLD_H:this.berthY[s.berthId??0],anchorY=270+(s.id%6)*125;let x=280,y=anchorY,rot=0;
  if(s.stage==='ARRIVING'){x=40+240*q;y=1060+(anchorY-1060)*q;rot=-.18}
  if(s.stage==='ANCHORAGE'||s.stage==='PILOT_TRANSIT'||s.stage==='PILOT_BOARDING'){x=280;y=anchorY;rot=0}
  if(s.stage==='INBOUND'){x=350+700*q;y=anchorY+(560-anchorY)*q;rot=-.10+.12*q}
  if(s.stage==='TUG_RENDEZVOUS'){x=1050+110*q;y=560+(by-560)*.18*q;rot=.02+.12*q}
  if(s.stage==='TURNING'){x=1160+180*q;y=lerp(560,by,q);rot=lerp(.14,Math.PI/2,q)}
  if(s.stage==='BERTHING'){x=1340+214*q;y=by;rot=Math.PI/2}
  if(s.stage==='MOORING'||s.stage==='CARGO'){x=QUAY_X-78;y=by;rot=Math.PI/2}
  if(s.stage==='UNMOORING'){x=QUAY_X-78-105*q;y=by;rot=Math.PI/2}
  if(s.stage==='OUTBOUND'){x=QUAY_X-185-1450*q;y=by+(1040-by)*q;rot=lerp(Math.PI/2,3.30,q)}
  if(s.stage==='COMPLETE'){x=-200;y=1040}
  return{x,y,rot,p:q,rawP:p,by}
 }
 ensureView(s){let v=this.shipViews.get(s.id);if(v)return v;v={root:this.makeShip(s),pilotBoat:this.makeBoat(this.assets.pilotBoat,.60),boarder:this.makeBoat(this.assets.pilot,.34),lines:new P.Graphics(),tugs:[],workers:[]};this.actorLayer.addChild(v.pilotBoat,v.boarder);this.fx.addChild(v.lines);v.pilotBoat.visible=v.boarder.visible=v.lines.visible=false;this.shipViews.set(s.id,v);return v}
 render(world){
  if(this.world&&this.world!==world)this.clearDynamic();this.world=world;const active=new Set();
  for(const s of world.ships){if(s.stage==='COMPLETE')continue;active.add(s.id);this.updateShipView(s,this.ensureView(s))}
  for(const[id,v]of[...this.shipViews])if(!active.has(id))this.destroyShipView(id,v);
  this.updateTerminalActivity();this.updateSelection();this.drawMinimap()
 }
 updatePilot(s,v,pose){
  const p=pose.p,boarding=G.pilotBoarding(pose,QUAY_X),pb=['PILOT_TRANSIT','PILOT_BOARDING'].includes(s.stage);
  v.pilotBoat.visible=pb;
  if(pb){const q=s.stage==='PILOT_TRANSIT'?p:1;v.pilotBoat.position.set(Math.round(lerp(PILOT_BASE.x+36,boarding.boat.x,q)),Math.round(lerp(PILOT_BASE.y+42,boarding.boat.y,q)));v.pilotBoat.rotation=s.stage==='PILOT_BOARDING'?pose.rot:Math.atan2(boarding.boat.y-(PILOT_BASE.y+42),boarding.boat.x-(PILOT_BASE.x+36))}
  v.boarder.visible=s.stage==='PILOT_BOARDING'&&p<.94;
  if(v.boarder.visible){const q=clamp((p-.08)/.78,0,1);v.boarder.position.set(Math.round(lerp(boarding.ladderBottom.x,boarding.ladderTop.x,q)),Math.round(lerp(boarding.ladderBottom.y,boarding.ladderTop.y,q)));v.boarder.rotation=0}
  return boarding
 }
 updateTugs(s,v,pose){
  while(v.tugs.length<s.tugs.length){const t=this.makeBoat(this.assets.tug[v.tugs.length%2],.60);this.actorLayer.addChild(t);v.tugs.push(t)}
  const stage=['TUG_RENDEZVOUS','TURNING','BERTHING','UNMOORING','OUTBOUND'].includes(s.stage),plans=G.tugPlan(pose,s.stage,s.tugs.length,pose.p,QUAY_X);
  for(let i=0;i<v.tugs.length;i++){const t=v.tugs[i],plan=plans[i];t.visible=stage&&i<s.tugs.length&&!!plan;if(!t.visible)continue;
   let tx=plan.target.x,ty=plan.target.y;
   if(s.stage==='TUG_RENDEZVOUS'){const q=smooth(pose.p);tx=lerp(TUG_BASE.x+i*42,tx,q);ty=lerp(TUG_BASE.y-i*25,ty,q)}
   else if(s.stage==='OUTBOUND'&&pose.p>.28){const q=smooth((pose.p-.28)/.72);tx=lerp(tx,TUG_BASE.x+i*42,q);ty=lerp(ty,TUG_BASE.y-i*25,q)}
   t.position.set(Math.round(tx),Math.round(ty));t.rotation=plan.rotation;t._plan=plan;
  }
 }
 updateWorkers(s,v,pose){
  const on=['MOORING','CARGO','UNMOORING'].includes(s.stage)&&s.berthId!=null;
  if(on&&v.workers.length<10)for(let i=v.workers.length;i<10;i++){const m=this.makeWorker(i);this.actorLayer.addChild(m);v.workers.push(m)}
  const lineY=[-78,-48,-20,20,48,78];
  for(let i=0;i<v.workers.length;i++){const m=v.workers[i];m.visible=on;if(!on)continue;const startX=1985,startY=pose.by+(i%2?95:-95);
   if(s.stage==='MOORING'){const idx=i%6,targetX=QUAY_X+30+(i>=6?48:0),targetY=pose.by+lineY[idx],walk=clamp(pose.p*2.1-i*.035,0,1);m.position.set(Math.round(lerp(startX,targetX,walk)),Math.round(lerp(startY,targetY,walk)+Math.sin((this.time+i)*.15)*2))}
   else if(s.stage==='CARGO'){const rigs=this.craneRigsByBerth[s.berthId]||[],rig=rigs[i%Math.max(1,rigs.length)],laneX=rig?rig.root.x+20+(i%2)*35:QUAY_X+120,laneY=pose.by-72+(i%5)*34,patrol=Math.sin((this.time+i*19)*.025)*22;m.position.set(Math.round(laneX+patrol),Math.round(laneY+Math.sin((this.time+i)*.12)*2))}
   else{const idx=i%6,fromX=QUAY_X+30+(i>=6?48:0),fromY=pose.by+lineY[idx],walk=clamp(pose.p*1.65,0,1);m.position.set(Math.round(lerp(fromX,startX,walk)),Math.round(lerp(fromY,startY,walk)))}
   const frame=(Math.floor(this.time/7)+i)&1;m.texture=this.assets.worker[frame]
  }
 }
 updateShipView(s,v){
  const pose=this.stagePose(s);v.root.visible=true;v.root.position.set(Math.round(pose.x),Math.round(pose.y));v.root._sprite.rotation=pose.rot;v.root._label.rotation=0;v.root._label.position.set(-48,-56);v.root.zIndex=Math.round(pose.y);this.actorLayer.sortableChildren=true;
  const boarding=this.updatePilot(s,v,pose);this.updateTugs(s,v,pose);this.updateWorkers(s,v,pose);
  v.lines.clear();v.lines.visible=false;v.lines.alpha=1;
  if(s.stage==='PILOT_BOARDING'){v.lines.visible=true;v.lines.lineStyle(2,0xe2c995,1);const a=boarding.ladderTop,b=boarding.ladderBottom;v.lines.moveTo(a.x,a.y).lineTo(b.x,b.y);const n=boarding.normal,rx=-n.y,ry=n.x;v.lines.moveTo(a.x+rx*7,a.y+ry*7).lineTo(b.x+rx*7,b.y+ry*7);for(let q=.12;q<1;q+=.16){const x=lerp(a.x,b.x,q),y=lerp(a.y,b.y,q);v.lines.moveTo(x,y).lineTo(x+rx*7,y+ry*7)}}
  const tugPlans=G.tugPlan(pose,s.stage,s.tugs.length,pose.p,QUAY_X);if(tugPlans.some((plan,i)=>plan?.line&&v.tugs[i]?.visible)){v.lines.visible=true;v.lines.lineStyle(2,0xd7d1bc,.88);for(let i=0;i<tugPlans.length;i++){const plan=tugPlans[i],t=v.tugs[i];if(plan?.line&&t?.visible)v.lines.moveTo(Math.round(t.x),Math.round(t.y)).lineTo(Math.round(plan.attach.x),Math.round(plan.attach.y))}}
  const workersOn=['MOORING','CARGO','UNMOORING'].includes(s.stage)&&s.berthId!=null;if(workersOn){v.lines.visible=true;const h=G.heading(pose.rot),qn=G.quayNormal(pose,QUAY_X),qx=QUAY_X+8,alpha=s.stage==='MOORING'?clamp(pose.p*1.8,0,1):s.stage==='UNMOORING'?1-pose.p:1;v.lines.alpha=alpha;v.lines.lineStyle(2,0xe4d3a1,.9);for(const long of[-48,-24,24,48]){const ax=pose.x+h.x*long+qn.x*16,ay=pose.y+h.y*long+qn.y*16,bollY=pose.by+long*1.45;v.lines.moveTo(Math.round(ax),Math.round(ay)).lineTo(qx,Math.round(bollY))}if(s.stage==='MOORING'&&pose.p<.68){const q=pose.p/.68,ax=pose.x+qn.x*15,ay=pose.y+qn.y*15,tx=lerp(ax,qx,q),ty=pose.y-52*Math.sin(Math.PI*q);v.lines.lineStyle(1,0xffe8a4,1).moveTo(ax,ay).quadraticCurveTo((ax+tx)/2,ty-28,tx,ty).beginFill(0xffe8a4).drawRect(Math.round(tx)-2,Math.round(ty)-2,4,4).endFill()}}
  const latest=this.world.radio.find(r=>r.shipId===s.id&&this.world.time-r.t<11);if(latest)this.showBubble(s.id,v.root,latest.from,latest.text);else this.hideBubble(s.id)
 }
 updateTerminalActivity(){
  if(!this.world)return;
  for(let bi=0;bi<this.berthY.length;bi++){
   const berth=this.world.berths[bi],ship=berth?.shipId!=null?this.world.ships.find(s=>s.id===berth.shipId):null,isContainer=ship?.stage==='CARGO'&&ship.type==='container',rigs=this.craneRigsByBerth[bi]||[],trucks=this.trucksByBerth[bi]||[];
   for(const rig of rigs){const active=isContainer&&rig.index<Math.max(1,Math.min(ship.cranes||1,rigs.length));if(!active){rig.spreader.position.set(-32,-18);rig.load.visible=false;continue}const phase=(this.time*.0065+rig.index*.21+bi*.13)%1,loading=((ship.id+bi+rig.index)&1)===0;let travel,hoist;
    if(phase<.22){travel=0;hoist=0}else if(phase<.46){travel=smooth((phase-.22)/.24);hoist=.25}else if(phase<.62){travel=1;hoist=smooth((phase-.46)/.16)}else if(phase<.78){travel=1;hoist=1-smooth((phase-.62)/.16)}else{travel=1-smooth((phase-.78)/.22);hoist=.18}
    if(!loading)travel=1-travel;const sx=lerp(28,-58,travel),sy=-18+hoist*42;rig.spreader.position.set(Math.round(sx),Math.round(sy-12));rig.load.position.set(Math.round(sx),Math.round(sy+4));rig.load.visible=phase>.18&&phase<.84;const cycle=Math.floor(this.time/154)+rig.index+ship.id;rig.load.texture=this.assets.containerSingle[Math.abs(cycle)%this.assets.containerSingle.length]
   }
   for(const tr of trucks){tr.root.visible=!!isContainer;if(!isContainer)continue;const phase=(this.time*.0038+tr.index*.51+bi*.17)%1,outbound=phase>=.5,q=outbound?(phase-.5)*2:phase*2,startX=1945,endX=1708,x=outbound?lerp(endX,startX,smooth(q)):lerp(startX,endX,smooth(q)),y=this.berthY[bi]+(tr.index?70:-70);tr.root.position.set(Math.round(x),Math.round(y));tr.root.rotation=outbound?Math.PI:0;const loading=((ship.id+bi)&1)===0;tr.load.visible=loading?!outbound:outbound;const cycle=Math.floor(this.time/132)+bi*3+tr.index;tr.load.texture=this.assets.containerSingle[Math.abs(cycle)%this.assets.containerSingle.length]}
  }
 }
 showBubble(id,ship,from,text){let b=this.bubbles.get(id);if(!b){b=new P.Container();const box=new P.Graphics(),t=new P.Text('',{fontFamily:'monospace',fontSize:15,fill:0x132027,wordWrap:true,wordWrapWidth:250});t.position.set(11,9);t.resolution=Math.min(4,Math.max(2,(window.devicePixelRatio||1)*2));b.addChild(box,t);b.box=box;b.text=t;this.fx.addChild(b);this.bubbles.set(id,b)}b.text.text=`${from}: ${text}`;const W=Math.min(276,Math.max(140,b.text.width+22)),H=b.text.height+18;b.box.clear().beginFill(0xfff2c7,.97).lineStyle(2,0x263744,1).drawRect(0,0,W,H).endFill().beginFill(0xfff2c7).drawPolygon([24,H,38,H,30,H+11]).endFill();b.position.set(Math.round(ship.x-W/2),Math.round(ship.y-H-72));b.visible=true}
 hideBubble(id){const b=this.bubbles.get(id);if(b)b.visible=false}
 updateSelection(){for(const[id,v]of this.shipViews){const sel=id===this.selectedId;v.root._label.style.fill=sel?0xffd166:0xf3f0dc;v.root._label.style.fontSize=sel?18:15;v.root.alpha=sel?1:.97}}
 focusShip(id,follow=true){if(!this.shipViews.has(id))return;this.selectedId=id;if(follow)this.followId=id;const s=this.world?.ships.find(x=>x.id===id);if(s){const pose=this.stagePose(s);this.camera.x=pose.x;this.camera.y=pose.y;this.camera.zoom=Math.max(this.camera.zoom,1.05);this.applyCamera()}this.updateSelection();this.onShipSelected?.(id);this.updateFollowButton()}
 toggleFollow(id=this.selectedId){if(id==null)return;if(this.followId===id)this.followId=null;else{this.followId=id;this.selectedId=id}this.updateFollowButton()}
 updateFollowButton(){const b=document.querySelector('#followMapBtn');if(!b)return;b.disabled=this.selectedId==null;b.textContent=this.followId!=null?'Unfollow Vessel':'Follow Vessel'}
 centerPort(notify=true){this.followId=null;const vw=this.app.renderer.width||this.host.clientWidth||800,vh=this.app.renderer.height||this.host.clientHeight||500,fit=Math.min(vw/WORLD_W,vh/WORLD_H);this.camera.min=clamp(fit*.72,.22,.5);this.camera.zoom=clamp(Math.max(.54,fit*1.28),this.camera.min,1.05);this.camera.x=WORLD_W*.51;this.camera.y=WORLD_H*.51;this.applyCamera(notify);this.updateFollowButton()}
 zoomBy(factor,sx=null,sy=null){const vw=this.app.renderer.width,vh=this.app.renderer.height;this.zoomAt(sx??vw/2,sy??vh/2,this.camera.zoom*factor)}
 zoomAt(sx,sy,target){const old=this.camera.zoom,nz=clamp(target,this.camera.min,this.camera.max),wx=this.camera.x+(sx-this.app.renderer.width/2)/old,wy=this.camera.y+(sy-this.app.renderer.height/2)/old;this.camera.zoom=nz;this.camera.x=wx-(sx-this.app.renderer.width/2)/nz;this.camera.y=wy-(sy-this.app.renderer.height/2)/nz;this.followId=null;this.applyCamera();this.updateFollowButton()}
 clampCamera(){const vw=this.app.renderer.width/this.camera.zoom,vh=this.app.renderer.height/this.camera.zoom;this.camera.x=vw>=WORLD_W?WORLD_W/2:clamp(this.camera.x,vw/2,WORLD_W-vw/2);this.camera.y=vh>=WORLD_H?WORLD_H/2:clamp(this.camera.y,vh/2,WORLD_H-vh/2)}
 applyCamera(notify=true){this.clampCamera();const z=this.camera.zoom;this.cameraRoot.scale.set(z);this.cameraRoot.position.set(Math.round(this.app.renderer.width/2-this.camera.x*z),Math.round(this.app.renderer.height/2-this.camera.y*z));if(notify)this.onCameraChanged?.(this.camera);this.drawMinimap()}
 screenPoint(e){const r=this.app.view.getBoundingClientRect(),sx=this.app.renderer.width/r.width,sy=this.app.renderer.height/r.height;return{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy}}
 bindCamera(){const v=this.app.view;
  v.addEventListener('wheel',e=>{e.preventDefault();const p=this.screenPoint(e);this.zoomAt(p.x,p.y,this.camera.zoom*Math.exp(-e.deltaY*.0012))},{passive:false});
  v.addEventListener('pointerdown',e=>{const p=this.screenPoint(e);this.pointers.set(e.pointerId,p);v.setPointerCapture?.(e.pointerId);this.dragMoved=false;this.followId=null;this.updateFollowButton();if(this.pointers.size===1){this.dragLast=p;this.dragOrigin=p;v.style.cursor='grabbing'}else if(this.pointers.size===2){const a=[...this.pointers.values()],dx=a[1].x-a[0].x,dy=a[1].y-a[0].y,mid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};this.pinch={dist:Math.hypot(dx,dy),zoom:this.camera.zoom,wx:this.camera.x+(mid.x-this.app.renderer.width/2)/this.camera.zoom,wy:this.camera.y+(mid.y-this.app.renderer.height/2)/this.camera.zoom}}});
  v.addEventListener('pointermove',e=>{if(!this.pointers.has(e.pointerId))return;const p=this.screenPoint(e);this.pointers.set(e.pointerId,p);if(this.pointers.size>=2){const a=[...this.pointers.values()].slice(0,2),dx=a[1].x-a[0].x,dy=a[1].y-a[0].y,dist=Math.max(10,Math.hypot(dx,dy)),mid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};if(!this.pinch)return;this.camera.zoom=clamp(this.pinch.zoom*(dist/this.pinch.dist),this.camera.min,this.camera.max);this.camera.x=this.pinch.wx-(mid.x-this.app.renderer.width/2)/this.camera.zoom;this.camera.y=this.pinch.wy-(mid.y-this.app.renderer.height/2)/this.camera.zoom;this.dragMoved=true;this.applyCamera();return}if(this.dragLast){const dx=p.x-this.dragLast.x,dy=p.y-this.dragLast.y;if(Math.hypot(p.x-this.dragOrigin.x,p.y-this.dragOrigin.y)>4)this.dragMoved=true;this.camera.x-=dx/this.camera.zoom;this.camera.y-=dy/this.camera.zoom;this.dragLast=p;this.applyCamera()}});
  const up=e=>{this.pointers.delete(e.pointerId);if(this.pointers.size<2)this.pinch=null;if(this.pointers.size===1){this.dragLast=[...this.pointers.values()][0];this.dragOrigin=this.dragLast}else{this.dragLast=null;v.style.cursor='grab'}};v.addEventListener('pointerup',up);v.addEventListener('pointercancel',up);v.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('keydown',e=>{const tag=e.target?.tagName;if(['INPUT','SELECT','TEXTAREA'].includes(tag)||e.target?.isContentEditable)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){this.keys.add(k);e.preventDefault()}});window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
  window.addEventListener('resize',()=>setTimeout(()=>this.applyCamera(),0));
  if(this.mini)this.mini.addEventListener('pointerdown',e=>{const r=this.mini.getBoundingClientRect();this.camera.x=clamp((e.clientX-r.left)/r.width*WORLD_W,0,WORLD_W);this.camera.y=clamp((e.clientY-r.top)/r.height*WORLD_H,0,WORLD_H);this.followId=null;this.applyCamera();this.updateFollowButton()})
 }
 drawMinimap(){if(!this.mini)return;const c=this.mini,x=c.getContext('2d');if(!x)return;const W=c.width,H=c.height;x.imageSmoothingEnabled=false;x.fillStyle='#08283a';x.fillRect(0,0,W,H);x.fillStyle='#303b38';x.fillRect(QUAY_X/WORLD_W*W,0,W-QUAY_X/WORLD_W*W,H);x.fillStyle='#b7a36d';x.fillRect(QUAY_X/WORLD_W*W-2,0,3,H);x.fillStyle='#9eacaf';for(const y of this.berthY)x.fillRect(QUAY_X/WORLD_W*W-6,y/WORLD_H*H-6,7,12);if(this.world)for(const s of this.world.ships){if(s.stage==='COMPLETE')continue;const p=this.stagePose(s);x.fillStyle=s.id===this.selectedId?'#ffd166':s.stage==='ANCHORAGE'?'#f5b94f':s.stage==='CARGO'?'#62e5a0':'#63d3ff';x.fillRect(Math.round(p.x/WORLD_W*W)-2,Math.round(p.y/WORLD_H*H)-2,4,4)}const vw=this.app.renderer.width/this.camera.zoom,vh=this.app.renderer.height/this.camera.zoom,left=this.camera.x-vw/2,top=this.camera.y-vh/2;x.strokeStyle='#ffffff';x.lineWidth=1;x.strokeRect(left/WORLD_W*W,top/WORLD_H*H,vw/WORLD_W*W,vh/WORLD_H*H)}
 animate(delta){this.time+=delta;let moved=false,speed=13*delta/this.camera.zoom;if(this.keys.has('w')||this.keys.has('arrowup')){this.camera.y-=speed;moved=true}if(this.keys.has('s')||this.keys.has('arrowdown')){this.camera.y+=speed;moved=true}if(this.keys.has('a')||this.keys.has('arrowleft')){this.camera.x-=speed;moved=true}if(this.keys.has('d')||this.keys.has('arrowright')){this.camera.x+=speed;moved=true}if(moved){this.followId=null;this.applyCamera();this.updateFollowButton()}if(this.followId!=null&&this.world){const s=this.world.ships.find(x=>x.id===this.followId&&x.stage!=='COMPLETE');if(s){const p=this.stagePose(s);this.camera.x+=(p.x-this.camera.x)*clamp(delta*.11,0,1);this.camera.y+=(p.y-this.camera.y)*clamp(delta*.11,0,1);this.applyCamera(false)}else{this.followId=null;this.updateFollowButton()}}for(const v of this.shipViews.values()){for(const t of v.tugs)if(t.visible)t.y+=Math.sin(this.time*.09+t.x)*.10;if(v.pilotBoat.visible)v.pilotBoat.y+=Math.sin(this.time*.12)*.16}if((Math.floor(this.time)%8)===0)this.drawMinimap()}
}
HarborRenderer.WORLD_W=WORLD_W;HarborRenderer.WORLD_H=WORLD_H;window.HarborRenderer=HarborRenderer;
})();