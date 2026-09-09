(()=>{
'use strict';
const P=window.PIXI,A=window.PixelArt64;
const WORLD_W=2048,WORLD_H=1152,QUAY_X=1632,TUG_BASE={x:1490,y:1050},PILOT_BASE={x:210,y:128};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const lerp=(a,b,t)=>a+(b-a)*t;
class HarborRenderer{
 constructor(host){
  this.host=host;this.assets=A.create();this.world=null;this.shipViews=new Map();this.bubbles=new Map();this.time=0;this.selectedId=null;this.followId=null;this.onShipSelected=null;this.onCameraChanged=null;this.keys=new Set();this.pointers=new Map();this.dragMoved=false;this.pinch=null;this.mini=document.querySelector('#minimap');
  this.app=new P.Application({resizeTo:host,backgroundColor:0x06131d,antialias:false,resolution:1,autoDensity:false,powerPreference:'high-performance'});this.app.renderer.roundPixels=true;this.app.view.style.imageRendering='pixelated';this.app.view.style.touchAction='none';this.app.view.style.cursor='grab';host.prepend(this.app.view);
  this.cameraRoot=new P.Container();this.bg=new P.Container();this.routes=new P.Graphics();this.actorLayer=new P.Container();this.fx=new P.Container();this.cameraRoot.addChild(this.bg,this.routes,this.actorLayer,this.fx);this.app.stage.addChild(this.cameraRoot);
  this.camera={x:WORLD_W/2,y:WORLD_H/2,zoom:.68,min:.28,max:2.8};
  this.buildWorld();this.bindCamera();this.centerPort(false);this.app.ticker.add(d=>this.animate(d));
 }
 makeSprite(texture,x=0,y=0,scale=1,anchor=.5){const s=new P.Sprite(texture);s.texture.baseTexture.scaleMode=P.SCALE_MODES.NEAREST;s.anchor.set(anchor);s.position.set(Math.round(x),Math.round(y));s.scale.set(scale);return s}
 tile(texture,x,y,w,h){const t=new P.TilingSprite(texture,w,h);t.position.set(x,y);t.tileScale.set(2);return t}
 label(text,x,y,size=14,color=0xb7cbd3){const t=new P.Text(text,{fontFamily:'monospace',fontSize:size,fill:color,fontWeight:'700',letterSpacing:1});t.position.set(x,y);t.resolution=1;return t}
 buildWorld(){
  this.bg.removeChildren();
  const water=this.tile(this.assets.water,0,0,WORLD_W,WORLD_H);this.bg.addChild(water);
  const land=this.tile(this.assets.land,QUAY_X+34,0,WORLD_W-QUAY_X-34,WORLD_H);this.bg.addChild(land);
  const quay=this.tile(this.assets.quay,QUAY_X,0,38,WORLD_H);this.bg.addChild(quay);
  const breakwater=this.tile(this.assets.quay,0,72,430,42);this.bg.addChild(breakwater);
  for(let i=0;i<6;i++){const b=this.makeSprite(this.assets.quay,38+i*64,94,.46);b.rotation=Math.PI/2;this.bg.addChild(b)}
  const lighthouse=this.makeSprite(this.assets.lighthouse,395,71,.9);this.bg.addChild(lighthouse);
  const pilotHouse=this.makeSprite(this.assets.vts,PILOT_BASE.x,128,1.15);this.bg.addChild(pilotHouse);this.bg.addChild(this.label('PILOT STATION',120,190,15,0x8fb6c6));
  const tugBase=this.makeSprite(this.assets.tugBase,TUG_BASE.x,1060,1.35);this.bg.addChild(tugBase);this.bg.addChild(this.label('TUG BASE',1432,1102,14,0xd8c27c));
  const vts=this.makeSprite(this.assets.vts,1930,90,1.15);this.bg.addChild(vts);this.bg.addChild(this.label('VTS / PORT CONTROL',1840,150,13,0xb4d6df));
  this.berthY=[.22,.50,.78].map(v=>Math.round(v*WORLD_H));
  this.berthY.forEach((y,i)=>this.drawBerth(i,y));
  for(let r=0;r<3;r++)for(let c=0;c<3;c++){const cs=this.makeSprite(this.assets.containers,1760+c*84,420+r*92,.92);this.bg.addChild(cs)}
  this.bg.addChild(this.label('ANCHORAGE',210,390,17,0x7fa2af));this.bg.addChild(this.label('TURNING BASIN',1195,550,17,0x7899a7));this.bg.addChild(this.label('INNER CHANNEL',760,415,14,0x6f909c));
  this.drawRoutes();
 }
 drawBerth(i,y){
  const apron=this.tile(this.assets.land,QUAY_X+38,y-118,WORLD_W-QUAY_X-38,236);this.bg.addChild(apron);
  const edge=this.tile(this.assets.quay,QUAY_X,y-116,42,232);this.bg.addChild(edge);
  this.bg.addChild(this.label(`BERTH ${String.fromCharCode(65+i)}`,1740,y-100,15,0xd9e4e5));
  const count=[4,2,2][i];for(let c=0;c<count;c++){const crane=this.makeSprite(this.assets.crane,1740+c*82,y-10,1.05);this.bg.addChild(crane)}
  for(let k=0;k<6;k++){const boll=this.makeSprite(this.assets.quay,1652,y-88+k*34,.18);this.bg.addChild(boll)}
 }
 drawRoutes(){this.routes.clear();this.routes.lineStyle(3,0x79d9f4,.18);this.routes.moveTo(40,1040).lineTo(330,780).lineTo(720,610).lineTo(1080,560).lineTo(1370,560);this.routes.lineStyle(2,0xd7edf4,.10);for(const y of this.berthY)this.routes.moveTo(1370,560).lineTo(1510,y).lineTo(QUAY_X-75,y)}
 makeShip(s){
  const root=new P.Container(),sprite=this.makeSprite(this.assets.ship[s.type]||this.assets.ship.general,0,0,clamp(.95+(s.loa-150)/300,.9,1.55));const label=this.label(s.name,-46,-50,12,0xf3f0dc);root.addChild(sprite,label);root._sprite=sprite;root._label=label;root.eventMode='static';root.cursor='pointer';root.hitArea=new P.Rectangle(-58,-45,116,90);root.on('pointertap',()=>{if(this.dragMoved)return;this.focusShip(s.id,true)});this.actorLayer.addChild(root);return root
 }
 makeBoat(texture,scale=.52){return this.makeSprite(texture,0,0,scale)}
 makeWorker(i){const s=this.makeSprite(this.assets.worker[i%2],0,0,.34);s._frame=i%2;return s}
 clearDynamic(){for(const v of this.shipViews.values()){v.root.destroy({children:true});v.pilotBoat.destroy();v.boarder.destroy();v.pilotOnBridge.destroy();v.lines.destroy();for(const x of v.tugs)x.destroy();for(const x of v.workers)x.destroy()}for(const b of this.bubbles.values())b.destroy({children:true});this.shipViews.clear();this.bubbles.clear();this.selectedId=this.followId=null}
 stagePose(s){const p=clamp((this.world.time-s.stageStart)/Math.max(1,s.stageDuration),0,1),by=this.world.berths[s.berthId]?.y?this.world.berths[s.berthId].y*WORLD_H:this.berthY[s.berthId??0],anchorY=270+(s.id%6)*125;let x=280,y=anchorY,rot=0;
  if(s.stage==='ARRIVING'){x=40+240*p;y=1060+(anchorY-1060)*p;rot=-.18}
  if(s.stage==='ANCHORAGE'){x=280;y=anchorY;rot=0}
  if(s.stage==='PILOT_TRANSIT'||s.stage==='PILOT_BOARDING'){x=280;y=anchorY;rot=0}
  if(s.stage==='INBOUND'){x=350+680*p;y=anchorY+(560-anchorY)*p;rot=-.10}
  if(s.stage==='TUG_RENDEZVOUS'){x=1030+120*p;y=560+(by-560)*.12*p;rot=-.05}
  if(s.stage==='TURNING'){x=1150+190*p;y=560+Math.sin(p*Math.PI)*130+(by-560)*.26*p;rot=Math.PI*.62*p}
  if(s.stage==='BERTHING'){x=1340+235*p;y=560+(by-560)*p;rot=1.95-(.38*p)}
  if(s.stage==='MOORING'||s.stage==='CARGO'){x=QUAY_X-78;y=by;rot=Math.PI/2}
  if(s.stage==='UNMOORING'){x=QUAY_X-78-95*p;y=by;rot=Math.PI/2*(1-p*.55)}
  if(s.stage==='OUTBOUND'){x=QUAY_X-170-1450*p;y=by+(1040-by)*p;rot=2.25+1.05*p}
  if(s.stage==='COMPLETE'){x=-200;y=1040}
  return{x,y,rot,p,by}
 }
 ensureView(s){let v=this.shipViews.get(s.id);if(v)return v;v={root:this.makeShip(s),pilotBoat:this.makeBoat(this.assets.pilotBoat,.56),boarder:this.makeBoat(this.assets.pilot,.30),pilotOnBridge:this.makeBoat(this.assets.pilot,.24),lines:new P.Graphics(),tugs:[],workers:[]};this.actorLayer.addChild(v.pilotBoat,v.boarder,v.pilotOnBridge);this.fx.addChild(v.lines);v.pilotBoat.visible=v.boarder.visible=v.pilotOnBridge.visible=v.lines.visible=false;this.shipViews.set(s.id,v);return v}
 render(world){if(this.world&&this.world!==world)this.clearDynamic();this.world=world;const active=new Set();for(const s of world.ships){if(s.stage==='COMPLETE')continue;active.add(s.id);const v=this.ensureView(s);this.updateShipView(s,v)}for(const[id,v]of this.shipViews)if(!active.has(id)){v.root.visible=v.pilotBoat.visible=v.boarder.visible=v.pilotOnBridge.visible=v.lines.visible=false;for(const t of v.tugs)t.visible=false;for(const m of v.workers)m.visible=false}this.updateSelection();this.drawMinimap()}
 updateShipView(s,v){const pose=this.stagePose(s),p=pose.p;v.root.visible=true;v.root.position.set(Math.round(pose.x),Math.round(pose.y));v.root._sprite.rotation=pose.rot;v.root._label.rotation=0;v.root._label.position.set(-46,-52);v.root.zIndex=Math.round(pose.y);this.actorLayer.sortableChildren=true;
  const pb=['PILOT_TRANSIT','PILOT_BOARDING'].includes(s.stage);v.pilotBoat.visible=pb;if(pb){const q=s.stage==='PILOT_TRANSIT'?p:1;v.pilotBoat.position.set(Math.round(lerp(PILOT_BASE.x+36,pose.x-24,q)),Math.round(lerp(PILOT_BASE.y+42,pose.y+35,q)));v.pilotBoat.rotation=Math.atan2(pose.y-PILOT_BASE.y,pose.x-PILOT_BASE.x)}
  v.boarder.visible=s.stage==='PILOT_BOARDING';v.pilotOnBridge.visible=['INBOUND','TUG_RENDEZVOUS','TURNING','BERTHING','MOORING'].includes(s.stage);if(v.boarder.visible){v.boarder.position.set(Math.round(pose.x-15),Math.round(pose.y+34-p*48));v.boarder.rotation=0}if(v.pilotOnBridge.visible){v.pilotOnBridge.position.set(Math.round(pose.x-18*Math.cos(pose.rot)),Math.round(pose.y-18*Math.sin(pose.rot)-8));v.pilotOnBridge.rotation=pose.rot}
  while(v.tugs.length<s.tugs.length){const t=this.makeBoat(this.assets.tug[v.tugs.length%2],.54);this.actorLayer.addChild(t);v.tugs.push(t)}
  const tugStage=['TUG_RENDEZVOUS','TURNING','BERTHING','UNMOORING','OUTBOUND'].includes(s.stage);for(let i=0;i<v.tugs.length;i++){const t=v.tugs[i];t.visible=tugStage&&i<s.tugs.length;if(!t.visible)continue;const side=i%2?1:-1,ang=pose.rot+side*Math.PI/2,targetX=pose.x+Math.cos(ang)*62,targetY=pose.y+Math.sin(ang)*62;if(s.stage==='TUG_RENDEZVOUS'||s.stage==='UNMOORING'){const q=s.stage==='UNMOORING'?clamp(p*2,0,1):p;t.position.set(Math.round(lerp(TUG_BASE.x+i*34,targetX,q)),Math.round(lerp(TUG_BASE.y-i*20,targetY,q)))}else t.position.set(Math.round(targetX),Math.round(targetY));t.rotation=pose.rot+(i?Math.PI:0)}
  const workersOn=['MOORING','CARGO','UNMOORING'].includes(s.stage)&&s.berthId!=null;if(workersOn&&v.workers.length<8){for(let i=v.workers.length;i<8;i++){const m=this.makeWorker(i);this.actorLayer.addChild(m);v.workers.push(m)}}for(let i=0;i<v.workers.length;i++){const m=v.workers[i];m.visible=workersOn;if(!m.visible)continue;const targetX=QUAY_X+54+(i%4)*38,startX=1980,baseY=pose.by-70+(i%4)*42;if(s.stage==='MOORING'){const walk=clamp(p*2.15-i*.045,0,1);m.position.set(Math.round(lerp(startX,targetX,walk)),Math.round(baseY+Math.sin((this.time+i)*.14)*3))}else if(s.stage==='CARGO'){m.position.set(Math.round(targetX+Math.sin((this.time+i)*.035)*28),Math.round(baseY+Math.sin((this.time+i)*.12)*2))}else{const walk=clamp(p*1.6,0,1);m.position.set(Math.round(lerp(targetX,startX,walk)),Math.round(baseY))}const frame=(Math.floor(this.time/8)+i)&1;m.texture=this.assets.worker[frame]}
  v.lines.clear();v.lines.visible=false;if(s.stage==='PILOT_BOARDING'){v.lines.visible=true;v.lines.lineStyle(2,0xd7bf8b,1);const sx=Math.round(pose.x-17),top=Math.round(pose.y+4),bottom=Math.round(pose.y+40);v.lines.moveTo(sx-4,top).lineTo(sx-4,bottom).moveTo(sx+4,top).lineTo(sx+4,bottom);for(let y=top+4;y<bottom;y+=5)v.lines.moveTo(sx-4,y).lineTo(sx+4,y)}
  if(tugStage&&v.tugs.some(t=>t.visible)){v.lines.visible=true;v.lines.lineStyle(2,0xd7d1bc,.85);for(const t of v.tugs)if(t.visible)v.lines.moveTo(Math.round(t.x),Math.round(t.y)).lineTo(Math.round(pose.x),Math.round(pose.y))}
  if(s.berthId!=null&&workersOn){v.lines.visible=true;const qx=QUAY_X+8;v.lines.lineStyle(2,0xe4d3a1,.9);const alpha=s.stage==='MOORING'?clamp(p*1.8,0,1):s.stage==='UNMOORING'?1-p:1;v.lines.alpha=alpha;for(const oy of[-46,-22,22,46])v.lines.moveTo(Math.round(pose.x+7),Math.round(pose.y+oy*.42)).lineTo(qx,Math.round(pose.by+oy));if(s.stage==='MOORING'&&p<.7){const q=p/.7,tx=lerp(pose.x,qx,q),ty=pose.y-52*Math.sin(Math.PI*q);v.lines.lineStyle(1,0xffe8a4,1).moveTo(pose.x,pose.y-8).quadraticCurveTo((pose.x+tx)/2,ty-30,tx,ty).beginFill(0xffe8a4).drawRect(Math.round(tx)-2,Math.round(ty)-2,4,4).endFill()}v.lines.alpha=alpha}else v.lines.alpha=1;
  const latest=this.world.radio.find(r=>r.shipId===s.id&&this.world.time-r.t<11);if(latest)this.showBubble(s.id,v.root,latest.from,latest.text);else this.hideBubble(s.id)
 }
 showBubble(id,ship,from,text){let b=this.bubbles.get(id);if(!b){b=new P.Container();const box=new P.Graphics(),t=new P.Text('',{fontFamily:'monospace',fontSize:12,fill:0x132027,wordWrap:true,wordWrapWidth:230});t.position.set(10,8);b.addChild(box,t);b.box=box;b.text=t;this.fx.addChild(b);this.bubbles.set(id,b)}b.text.text=`${from}: ${text}`;const W=Math.min(250,Math.max(120,b.text.width+20)),H=b.text.height+16;b.box.clear().beginFill(0xfff2c7,.97).lineStyle(2,0x263744,1).drawRect(0,0,W,H).endFill().beginFill(0xfff2c7).drawPolygon([22,H,34,H,27,H+10]).endFill();b.position.set(Math.round(ship.x-W/2),Math.round(ship.y-H-65));b.visible=true}
 hideBubble(id){const b=this.bubbles.get(id);if(b)b.visible=false}
 updateSelection(){for(const[id,v]of this.shipViews){const sel=id===this.selectedId;v.root._label.style.fill=sel?0xffd166:0xf3f0dc;v.root._label.style.fontSize=sel?14:12;v.root.alpha=sel?1:.97}}
 focusShip(id,follow=true){if(!this.shipViews.has(id))return;this.selectedId=id;if(follow)this.followId=id;const s=this.world?.ships.find(x=>x.id===id);if(s){const pose=this.stagePose(s);this.camera.x=pose.x;this.camera.y=pose.y;this.camera.zoom=Math.max(this.camera.zoom,1.0);this.applyCamera()}this.updateSelection();this.onShipSelected?.(id);this.updateFollowButton()}
 toggleFollow(id=this.selectedId){if(id==null)return;if(this.followId===id)this.followId=null;else{this.followId=id;this.selectedId=id}this.updateFollowButton()}
 updateFollowButton(){const b=document.querySelector('#followMapBtn');if(!b)return;b.disabled=this.selectedId==null;b.textContent=this.followId!=null?'Unfollow Vessel':'Follow Vessel'}
 centerPort(notify=true){this.followId=null;const vw=this.app.renderer.width||this.host.clientWidth||800,vh=this.app.renderer.height||this.host.clientHeight||500,fit=Math.min(vw/WORLD_W,vh/WORLD_H);this.camera.min=clamp(fit*.72,.22,.5);this.camera.zoom=clamp(Math.max(.50,fit*1.25),this.camera.min,1.0);this.camera.x=WORLD_W*.51;this.camera.y=WORLD_H*.51;this.applyCamera(notify);this.updateFollowButton()}
 zoomBy(factor,sx=null,sy=null){const vw=this.app.renderer.width,vh=this.app.renderer.height;this.zoomAt(sx??vw/2,sy??vh/2,this.camera.zoom*factor)}
 zoomAt(sx,sy,target){const old=this.camera.zoom,nz=clamp(target,this.camera.min,this.camera.max);const wx=this.camera.x+(sx-this.app.renderer.width/2)/old,wy=this.camera.y+(sy-this.app.renderer.height/2)/old;this.camera.zoom=nz;this.camera.x=wx-(sx-this.app.renderer.width/2)/nz;this.camera.y=wy-(sy-this.app.renderer.height/2)/nz;this.followId=null;this.applyCamera();this.updateFollowButton()}
 clampCamera(){const vw=this.app.renderer.width/this.camera.zoom,vh=this.app.renderer.height/this.camera.zoom;this.camera.x=vw>=WORLD_W?WORLD_W/2:clamp(this.camera.x,vw/2,WORLD_W-vw/2);this.camera.y=vh>=WORLD_H?WORLD_H/2:clamp(this.camera.y,vh/2,WORLD_H-vh/2)}
 applyCamera(notify=true){this.clampCamera();const z=this.camera.zoom;this.cameraRoot.scale.set(z);this.cameraRoot.position.set(Math.round(this.app.renderer.width/2-this.camera.x*z),Math.round(this.app.renderer.height/2-this.camera.y*z));if(notify)this.onCameraChanged?.(this.camera);this.drawMinimap()}
 screenPoint(e){const r=this.app.view.getBoundingClientRect(),sx=this.app.renderer.width/r.width,sy=this.app.renderer.height/r.height;return{x:(e.clientX-r.left)*sx,y:(e.clientY-r.top)*sy}}
 bindCamera(){const v=this.app.view;
  v.addEventListener('wheel',e=>{e.preventDefault();const p=this.screenPoint(e);this.zoomAt(p.x,p.y,this.camera.zoom*Math.exp(-e.deltaY*.0012))},{passive:false});
  v.addEventListener('pointerdown',e=>{const p=this.screenPoint(e);this.pointers.set(e.pointerId,p);v.setPointerCapture?.(e.pointerId);this.dragMoved=false;this.followId=null;this.updateFollowButton();if(this.pointers.size===1){this.dragLast=p;this.dragOrigin=p;v.style.cursor='grabbing'}else if(this.pointers.size===2){const a=[...this.pointers.values()],dx=a[1].x-a[0].x,dy=a[1].y-a[0].y,mid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};this.pinch={dist:Math.hypot(dx,dy),zoom:this.camera.zoom,wx:this.camera.x+(mid.x-this.app.renderer.width/2)/this.camera.zoom,wy:this.camera.y+(mid.y-this.app.renderer.height/2)/this.camera.zoom}}});
  v.addEventListener('pointermove',e=>{if(!this.pointers.has(e.pointerId))return;const p=this.screenPoint(e);this.pointers.set(e.pointerId,p);if(this.pointers.size>=2){const a=[...this.pointers.values()].slice(0,2),dx=a[1].x-a[0].x,dy=a[1].y-a[0].y,dist=Math.max(10,Math.hypot(dx,dy)),mid={x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2};if(!this.pinch)return;this.camera.zoom=clamp(this.pinch.zoom*(dist/this.pinch.dist),this.camera.min,this.camera.max);this.camera.x=this.pinch.wx-(mid.x-this.app.renderer.width/2)/this.camera.zoom;this.camera.y=this.pinch.wy-(mid.y-this.app.renderer.height/2)/this.camera.zoom;this.dragMoved=true;this.applyCamera();return}if(this.dragLast){const dx=p.x-this.dragLast.x,dy=p.y-this.dragLast.y;if(Math.hypot(p.x-this.dragOrigin.x,p.y-this.dragOrigin.y)>4)this.dragMoved=true;this.camera.x-=dx/this.camera.zoom;this.camera.y-=dy/this.camera.zoom;this.dragLast=p;this.applyCamera()}});
  const up=e=>{this.pointers.delete(e.pointerId);if(this.pointers.size<2)this.pinch=null;if(this.pointers.size===1){this.dragLast=[...this.pointers.values()][0];this.dragOrigin=this.dragLast}else{this.dragLast=null;v.style.cursor='grab'}};v.addEventListener('pointerup',up);v.addEventListener('pointercancel',up);v.addEventListener('contextmenu',e=>e.preventDefault());
  window.addEventListener('keydown',e=>{const tag=e.target?.tagName;if(['INPUT','SELECT','TEXTAREA'].includes(tag)||e.target?.isContentEditable)return;const k=e.key.toLowerCase();if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'].includes(k)){this.keys.add(k);e.preventDefault()}});window.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));
  window.addEventListener('resize',()=>{setTimeout(()=>this.applyCamera(),0)});
  if(this.mini)this.mini.addEventListener('pointerdown',e=>{const r=this.mini.getBoundingClientRect();this.camera.x=clamp((e.clientX-r.left)/r.width*WORLD_W,0,WORLD_W);this.camera.y=clamp((e.clientY-r.top)/r.height*WORLD_H,0,WORLD_H);this.followId=null;this.applyCamera();this.updateFollowButton()})
 }
 drawMinimap(){if(!this.mini)return;const c=this.mini,x=c.getContext('2d');if(!x)return;const W=c.width,H=c.height;x.imageSmoothingEnabled=false;x.fillStyle='#08283a';x.fillRect(0,0,W,H);x.fillStyle='#303b38';x.fillRect(QUAY_X/WORLD_W*W,0,W-QUAY_X/WORLD_W*W,H);x.fillStyle='#b7a36d';x.fillRect(QUAY_X/WORLD_W*W-2,0,3,H);x.fillStyle='#9eacaf';for(const y of this.berthY)x.fillRect(QUAY_X/WORLD_W*W-6,y/WORLD_H*H-6,7,12);if(this.world)for(const s of this.world.ships){if(s.stage==='COMPLETE')continue;const p=this.stagePose(s);x.fillStyle=s.id===this.selectedId?'#ffd166':s.stage==='ANCHORAGE'?'#f5b94f':s.stage==='CARGO'?'#62e5a0':'#63d3ff';x.fillRect(Math.round(p.x/WORLD_W*W)-2,Math.round(p.y/WORLD_H*H)-2,4,4)}const vw=this.app.renderer.width/this.camera.zoom,vh=this.app.renderer.height/this.camera.zoom,left=this.camera.x-vw/2,top=this.camera.y-vh/2;x.strokeStyle='#ffffff';x.lineWidth=1;x.strokeRect(left/WORLD_W*W,top/WORLD_H*H,vw/WORLD_W*W,vh/WORLD_H*H)}
 animate(delta){this.time+=delta;let moved=false,speed=13*delta/this.camera.zoom;if(this.keys.has('w')||this.keys.has('arrowup')){this.camera.y-=speed;moved=true}if(this.keys.has('s')||this.keys.has('arrowdown')){this.camera.y+=speed;moved=true}if(this.keys.has('a')||this.keys.has('arrowleft')){this.camera.x-=speed;moved=true}if(this.keys.has('d')||this.keys.has('arrowright')){this.camera.x+=speed;moved=true}if(moved){this.followId=null;this.applyCamera();this.updateFollowButton()}if(this.followId!=null&&this.world){const s=this.world.ships.find(x=>x.id===this.followId&&x.stage!=='COMPLETE');if(s){const p=this.stagePose(s);this.camera.x+=(p.x-this.camera.x)*clamp(delta*.11,0,1);this.camera.y+=(p.y-this.camera.y)*clamp(delta*.11,0,1);this.applyCamera(false)}else{this.followId=null;this.updateFollowButton()}}for(const v of this.shipViews.values()){for(const t of v.tugs)if(t.visible)t.y+=Math.sin(this.time*.09+t.x)*.15;if(v.pilotBoat.visible)v.pilotBoat.y+=Math.sin(this.time*.12)*.25}if((Math.floor(this.time)%8)===0)this.drawMinimap()}
}
HarborRenderer.WORLD_W=WORLD_W;HarborRenderer.WORLD_H=WORLD_H;window.HarborRenderer=HarborRenderer;
})();