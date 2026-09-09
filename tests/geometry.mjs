import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
global.window=global;
vm.runInThisContext(fs.readFileSync('ops-geometry.js','utf8'),{filename:'ops-geometry.js'});
const G=global.HarborOpsGeometry;
assert.ok(G,'HarborOpsGeometry should be exposed');

const parallel={x:1554,y:576,rot:Math.PI/2};
const berthing=G.tugPlan(parallel,'BERTHING',2,.6,1632);
assert.equal(berthing.length,2);
for(const t of berthing){
  assert.ok(t.target.x<parallel.x,'berthing tug must stay on seaward/opposite-quay side');
  assert.equal(t.line,true,'berthing tug should remain made fast');
}
assert.equal(berthing[0].role,'push');
assert.equal(berthing[1].role,'check');

const unmoorNear=G.tugPlan(parallel,'UNMOORING',2,0,1632);
const unmoorFar=G.tugPlan(parallel,'UNMOORING',2,1,1632);
for(let i=0;i<2;i++){
  assert.ok(unmoorFar[i].target.x<unmoorNear[i].target.x,'unmooring tug should move farther seaward while pulling');
  assert.equal(unmoorFar[i].role,'pull');
}
const pilot=G.pilotBoarding({x:280,y:400,rot:0},1632);
assert.ok(pilot.boat.y>400,'eastbound vessel starboard pilot boat should lie on starboard side');
assert.ok(pilot.ladderBottom.y>pilot.ladderTop.y,'pilot ladder should descend toward launch');
console.log('Harbor geometry tests passed.');
