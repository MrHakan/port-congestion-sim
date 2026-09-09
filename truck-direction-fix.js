(()=>{
'use strict';
if(!window.HarborRenderer)return;
const original=window.HarborRenderer.prototype.updateTerminalActivity;
if(typeof original!=='function')return;
window.HarborRenderer.prototype.updateTerminalActivity=function(){
  original.call(this);
  if(!this.trucksByBerth)return;
  for(let bi=0;bi<this.trucksByBerth.length;bi++){
    const trucks=this.trucksByBerth[bi]||[];
    for(const tr of trucks){
      if(!tr?.root?.visible||!tr.body)continue;
      const phase=(this.time*.0044+tr.index*.31+bi*.13)%1;
      const towardQuay=phase<.5;
      tr.root.rotation=0;
      const magnitude=Math.abs(tr.body.scale.x)||1;
      tr.body.scale.x=(towardQuay?-1:1)*magnitude;
    }
  }
};
})();
