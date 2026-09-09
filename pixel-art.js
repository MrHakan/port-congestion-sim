(()=>{
'use strict';
const P=window.PIXI;
const LOGICAL_SIZE=128,UPSCALE=2;
const PAL={ink:'#0c1419',ink2:'#17252c',steel:'#344751',steel2:'#637985',white:'#e9f0ec',glass:'#7bc5d7',yellow:'#f4cf57',orange:'#e98b37',red:'#c6534b',blue:'#3f82aa',green:'#4d9169',sand:'#d0bb85',skin:'#d49a6d',navy:'#1e5375',vest:'#f2b83f',water:'#082b40',water2:'#0e4058',water3:'#15516a',concrete:'#566064',concrete2:'#6d797c',land:'#313b39',darkLand:'#293330',shadow:'rgba(0,0,0,.28)'};
function surface(w=LOGICAL_SIZE,h=LOGICAL_SIZE){const c=document.createElement('canvas');c.width=w*UPSCALE;c.height=h*UPSCALE;const x=c.getContext('2d',{alpha:true});x.imageSmoothingEnabled=false;x.scale(UPSCALE,UPSCALE);return[c,x]}
function tex(draw,w=LOGICAL_SIZE,h=LOGICAL_SIZE){const[c,x]=surface(w,h);draw(x,w,h);const t=P.Texture.from(c);t.baseTexture.scaleMode=P.SCALE_MODES.NEAREST;return t}
function px(x,c,a,b,w,h){x.fillStyle=c;x.fillRect(Math.round(a),Math.round(b),Math.round(w),Math.round(h))}
function linePx(x,c,x0,y0,x1,y1,th=1){x.strokeStyle=c;x.lineWidth=th;x.lineCap='butt';x.beginPath();x.moveTo(Math.round(x0)+.5,Math.round(y0)+.5);x.lineTo(Math.round(x1)+.5,Math.round(y1)+.5);x.stroke()}
function ship(type){return tex((x,w,h)=>{
 const hull=type==='tanker'?'#7f4549':type==='bulk'?'#596970':type==='general'?'#50717a':'#2f7899';
 for(let y=13;y<=58;y++){
  const d=Math.abs(y-35.5),bow=Math.max(0,Math.floor((d-10)*1.55)),stern=Math.max(0,Math.floor((d-15)*.65)),sx=4+stern,ex=188-bow;
  px(x,PAL.ink,sx,y,ex-sx,1);if(y>14&&y<57)px(x,hull,sx+2,y,Math.max(1,ex-sx-5),1)
 }
 px(x,'#8d3b3e',7,17,5,38);px(x,PAL.ink2,7,59,177,4);px(x,'#ddd8c8',18,8,35,50);px(x,'#b8c1be',21,11,29,45);
 px(x,PAL.glass,24,14,22,7);for(let i=0;i<4;i++)px(x,'#2a6277',25+i*5,15,4,5);
 px(x,PAL.white,17,28,37,4);px(x,PAL.orange,43,5,4,17);px(x,'#8d5c2d',41,3,8,3);px(x,'#f1df8a',14,61,19,2);
 px(x,'#c7c4ad',55,20,4,32);px(x,'#222d32',60,20,3,32);
 if(type==='container'){
  const cols=[PAL.red,PAL.blue,'#c99939',PAL.green,'#8e5fb7'];for(let r=0;r<4;r++)for(let c=0;c<9;c++){const xx=66+c*12,yy=15+r*10;px(x,cols[(r+c)%cols.length],xx,yy,10,8);px(x,'rgba(255,255,255,.14)',xx+1,yy+1,1,6);px(x,'#253139',xx,yy+8,10,1)}
 }else if(type==='bulk'){
  for(let c=0;c<5;c++){const xx=68+c*22;px(x,'#242d31',xx,17,18,36);px(x,'#987850',xx+2,20,14,30);px(x,'#b69a68',xx+4,23,10,24);px(x,'#343e41',xx+1,16,16,3)}
 }else if(type==='tanker'){
  px(x,'#d7ddd8',69,34,103,3);px(x,'#879293',69,31,103,2);for(let c=0;c<7;c++){const xx=72+c*14;px(x,'#586467',xx,19,9,10);px(x,'#242d31',xx+2,21,5,6)}px(x,PAL.orange,113,12,4,35);px(x,'#d6c889',110,11,10,3);
 }else{
  for(let c=0;c<4;c++){const xx=72+c*24;px(x,'#d9d6c7',xx,18,20,34);px(x,'#587883',xx+2,20,16,30);px(x,PAL.yellow,xx+5,25,10,9);px(x,'#333d40',xx+1,17,18,3)}
 }
 for(let yy=20;yy<55;yy+=8){px(x,'#eedaa1',58,yy,2,4);px(x,'#eedaa1',178,yy,2,4)}
},192,72)}
function tug(variant=0){return tex((x,w,h)=>{const c=variant?PAL.orange:PAL.red;for(let y=8;y<40;y++){const d=Math.abs(y-24),t=Math.max(0,Math.floor((d-8)*.65)),sx=6+t,ex=91-t;px(x,PAL.ink,sx,y,ex-sx,1);if(y>9&&y<39)px(x,c,sx+2,y,Math.max(1,ex-sx-5),1)}px(x,PAL.white,31,7,35,24);px(x,PAL.glass,36,11,24,7);px(x,'#274d5e',37,12,10,5);px(x,'#274d5e',49,12,10,5);px(x,PAL.ink2,44,1,5,7);px(x,PAL.yellow,12,20,6,6);px(x,PAL.yellow,78,20,6,6);px(x,'#111a1e',28,39,45,4)},96,48)}
function pilotBoat(){return tex((x,w,h)=>{for(let y=8;y<31;y++){const d=Math.abs(y-19),t=Math.max(0,Math.floor((d-6)*.9)),sx=5+t,ex=76-t;px(x,PAL.ink,sx,y,ex-sx,1);if(y>9&&y<30)px(x,PAL.yellow,sx+2,y,Math.max(1,ex-sx-5),1)}px(x,PAL.white,31,3,28,17);px(x,PAL.glass,35,7,19,6);px(x,PAL.orange,13,10,14,5);px(x,PAL.ink2,45,0,3,5);px(x,'#11191d',24,30,41,3)},80,36)}
function person(kind='worker',frame=0){return tex((x,w,h)=>{const cx=16+(frame?1:0),shirt=kind==='pilot'?PAL.navy:(frame?PAL.orange:PAL.vest),hat=kind==='pilot'?PAL.white:PAL.yellow;px(x,hat,cx-6,3,12,3);px(x,PAL.skin,cx-5,6,10,9);px(x,shirt,cx-7,15,14,17);px(x,kind==='pilot'?PAL.white:'#e9efec',cx-1,15,2,14);px(x,PAL.skin,cx-10,17,3,12);px(x,PAL.skin,cx+7,17,3,12);if(frame===0){px(x,PAL.ink2,cx-6,32,5,12);px(x,PAL.ink2,cx+2,32,5,12)}else{px(x,PAL.ink2,cx-8,32,5,11);px(x,PAL.ink2,cx+4,32,5,11)}px(x,'#0b1114',cx-8,43,7,3);px(x,'#0b1114',cx+2,43,8,3)},32,48)}
function gantryCrane(){return tex((x,w,h)=>{px(x,PAL.shadow,8,54,176,16);px(x,'#a45f25',14,34,164,7);px(x,PAL.orange,10,28,170,7);px(x,'#f2a74b',16,24,154,4);for(let i=0;i<14;i++)px(x,i%2?'#ad6727':'#d98431',18+i*11,35,7,5);px(x,'#b96f29',137,29,8,64);px(x,PAL.orange,145,29,8,64);px(x,'#b96f29',169,29,8,64);px(x,PAL.orange,177,29,8,64);px(x,'#283236',132,91,24,6);px(x,'#283236',164,91,24,6);px(x,'#d7d5c7',119,49,17,16);px(x,PAL.glass,122,52,10,7);linePx(x,'#687579',18,22,18,81,1);linePx(x,'#687579',174,22,174,81,1)},192,104)}
function spreader(){return tex((x,w,h)=>{px(x,'#20282c',3,5,58,9);px(x,PAL.yellow,7,7,50,4);px(x,'#9ca8a9',8,2,4,5);px(x,'#9ca8a9',52,2,4,5);px(x,'#111719',5,14,6,3);px(x,'#111719',53,14,6,3)},64,18)}
function containerSingle(color){return tex((x,w,h)=>{px(x,'#1d272d',2,2,60,22);px(x,color,4,3,56,19);px(x,'rgba(255,255,255,.16)',6,5,2,15);for(let i=0;i<6;i++)px(x,'rgba(0,0,0,.24)',12+i*8,5,1,15);px(x,'#11181c',4,20,56,2)},64,24)}
function cargoCrate(){return tex((x,w,h)=>{px(x,'#33281b',2,2,44,28);px(x,'#bb8f53',4,4,40,24);px(x,'#8d6538',7,7,34,3);px(x,'#8d6538',7,20,34,3);linePx(x,'#75512d',6,5,42,27,2);linePx(x,'#75512d',42,5,6,27,2)},48,32)}
function bulkBucket(){return tex((x,w,h)=>{px(x,'#222b2f',4,3,32,8);px(x,'#8d744b',7,10,26,12);for(let i=0;i<5;i++)px(x,'#b3945c',9+i*5,12,3,7);px(x,'#171d20',9,22,22,3)},40,28)}
function truck(variant=0){return tex((x,w,h)=>{const cab=variant?PAL.blue:PAL.orange;px(x,PAL.shadow,8,32,80,5);px(x,'#242e33',5,15,86,18);px(x,'#666f72',9,17,52,14);px(x,cab,61,10,27,21);px(x,PAL.glass,66,14,15,7);px(x,'#0b1114',15,31,13,7);px(x,'#0b1114',68,31,13,7);px(x,'#8b9698',18,33,7,3);px(x,'#8b9698',71,33,7,3);px(x,'#d5c77d',85,18,3,4)},96,40)}
function building(){return tex((x,w,h)=>{px(x,'#d6d0b8',18,31,92,84);px(x,PAL.red,14,24,100,11);px(x,'#1d3b47',26,43,76,29);for(let c=0;c<6;c++)px(x,PAL.glass,31+c*11,49,7,12);px(x,'#48575e',28,82,32,33);px(x,'#1a282d',38,92,10,23);px(x,PAL.yellow,79,89,13,13);px(x,PAL.ink2,62,8,7,16);px(x,PAL.red,57,4,17,6)},128,128)}
function tugBase(){return tex((x,w,h)=>{px(x,'#353f43',10,54,108,60);px(x,'#687579',10,48,108,8);px(x,'#d28a36',21,64,37,29);px(x,PAL.glass,27,70,17,9);px(x,'#28343a',69,64,38,43);px(x,PAL.yellow,76,74,23,7);px(x,'#131c21',84,88,10,19);px(x,'#b5a86f',8,110,112,5)},128,128)}
function tile(kind){return tex((x,w,h)=>{if(kind==='water'){px(x,PAL.water,0,0,w,h);for(let y=10;y<h;y+=16){const off=((y/16)|0)%2?5:0;for(let xx=off;xx<w;xx+=24){px(x,PAL.water2,xx,y,13,2);if((xx+y)%4===0)px(x,PAL.water3,xx+4,y+3,5,1)}}}else if(kind==='land'){px(x,PAL.land,0,0,w,h);for(let y=0;y<h;y+=16){px(x,PAL.darkLand,0,y,w,3);for(let xx=(y%32?8:0);xx<w;xx+=24)px(x,'#3a4643',xx,y+6,14,3)}}else{px(x,PAL.concrete,0,0,w,h);px(x,PAL.concrete2,0,0,w,7);for(let y=16;y<h;y+=16)px(x,'#444d50',0,y,w,2);px(x,'#d1ba79',4,24,13,6);px(x,'#d1ba79',47,24,13,6)}},64,64)}
function containerStack(){return tex((x,w,h)=>{const cols=[PAL.red,PAL.blue,'#c99a38',PAL.green,'#8d5fb3'];for(let r=0;r<6;r++)for(let c=0;c<5;c++){const xx=5+c*23,yy=5+r*16;px(x,cols[(r+c)%cols.length],xx,yy,20,13);px(x,'rgba(255,255,255,.14)',xx+2,yy+2,2,9);px(x,'#273137',xx,yy+13,20,2)}},128,104)}
function lighthouse(){return tex((x,w,h)=>{px(x,'#dcdcd0',54,25,20,80);px(x,PAL.red,54,39,20,14);px(x,PAL.red,54,69,20,14);px(x,'#1e292f',47,104,34,7);px(x,PAL.yellow,49,14,30,13);px(x,'#dcdcd0',58,7,13,8);px(x,'rgba(255,224,116,.45)',79,18,43,5)},128,128)}
function loadingArm(){return tex((x,w,h)=>{px(x,'#2a3438',89,42,15,45);px(x,PAL.orange,93,12,8,34);px(x,PAL.orange,56,16,43,7);px(x,'#c6742b',53,19,8,33);px(x,'#d2c485',18,48,39,5);px(x,'#6d7b7e',17,45,5,11);px(x,'#6d7b7e',52,45,5,11);px(x,'#1b2428',85,84,24,6)},120,96)}
function create(){P.settings.SCALE_MODE=P.SCALE_MODES.NEAREST;P.settings.ROUND_PIXELS=true;const colors=[PAL.red,PAL.blue,'#c99a38',PAL.green,PAL.yellow,'#925db1'];return{logicalSize:LOGICAL_SIZE,upscale:UPSCALE,displayScale:1/UPSCALE,metrics:{ship:{w:192,h:72},tug:{w:96,h:48},pilotBoat:{w:80,h:36},crane:{w:192,h:104}},ship:{container:ship('container'),bulk:ship('bulk'),tanker:ship('tanker'),general:ship('general')},tug:[tug(0),tug(1)],pilotBoat:pilotBoat(),pilot:person('pilot',0),worker:[person('worker',0),person('worker',1)],crane:gantryCrane(),spreader:spreader(),truck:[truck(0),truck(1)],containerSingle:colors.map(containerSingle),cargoCrate:cargoCrate(),bulkBucket:bulkBucket(),loadingArm:loadingArm(),vts:building(),tugBase:tugBase(),water:tile('water'),land:tile('land'),quay:tile('quay'),containers:containerStack(),lighthouse:lighthouse()}}
window.PixelArt64={LOGICAL_SIZE,UPSCALE,create};
})();
