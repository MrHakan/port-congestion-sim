import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
global.window=global;
vm.runInThisContext(fs.readFileSync('ops-geometry.js','utf8'),{filename:'ops-geometry.js'});
const G=global.HarborOpsGeometry;
assert.ok(G,'HarborOpsGeometry should be exposed');
const parallel={x:1588,y:576,rot:Math.PI/2,length:180,beam:50};
const berth=G.tugPlan(parallel,'BERTHING',2,.6,1632);
assert.equal(berth.length,2);
for(const t of berth){assert.ok(t.target.x<parallel.x,'berthing tug must remain seaward/opposite the quay');assert.ok(t.attach.x<1632,'tug line must attach to the seaward side of the hull');assert.equal(t.line,true)}
assert.match(berth[0].role,/push/);assert.match(berth[1].role,/push/);
const turn=G.tugPlan({x:1300,y:560,rot:.2,length:180,beam:50},'TURNING',2,.5,1632);
assert.equal(turn.length,2);assert.notEqual(Math.sign(turn[0].target.y-560),Math.sign(turn[1].target.y-560),'turning tugs should create a turning couple on opposite sides');
const near=G.tugPlan(parallel,'UNMOORING',2,0,1632),far=G.tugPlan(parallel,'UNMOORING',2,1,1632);for(let i=0;i<2;i++){assert.ok(far[i].target.x<near[i].target.x,'unmooring tug should open farther seaward while pulling');assert.equal(far[i].role,'pull')}
const pilotPose={x:300,y:400,rot:0,length:170,beam:48},pilot=G.pilotBoarding(pilotPose);assert.ok(pilot.boat.y>pilotPose.y,'eastbound starboard pilot launch must be south of the vessel');assert.ok(G.distance(pilot.boat,pilot.ladderBottom)<35,'pilot launch must sit directly below the ladder, not far away');assert.ok(pilot.ladderBottom.y>pilot.ladderTop.y,'pilot ladder must descend toward the launch');
const moor=G.mooringPlan(parallel,1632);assert.equal(moor.length,4);for(const m of moor){assert.ok(m.ship.x>parallel.x,'mooring fairlead must be on quay-facing side');assert.ok(m.bollard.x>m.ship.x,'bollard must lie ashore of fairlead')}
console.log('Harbor geometry tests passed.');
