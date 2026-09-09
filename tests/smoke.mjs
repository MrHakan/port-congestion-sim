import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

global.window=global;
vm.runInThisContext(fs.readFileSync('sim-engine.js','utf8'),{filename:'sim-engine.js'});
const E=global.PortSimEngine;
assert.ok(E,'PortSimEngine should be exposed');

const w=E.generate('CI-PORT',{policy:'hybrid',arrivalMean:90,pilots:2,tugs:3,cranes:7});
assert.equal(w.berths.length,3);
E.step(w,10080); // seven simulated days
const s=E.stats(w);
assert.ok(w.ships.length>20,'traffic generator should create vessels');
assert.ok(s.completed>4,'terminal should complete vessel calls');
assert.ok(Number.isFinite(s.avgWait));
assert.ok(Number.isFinite(s.avgTurn));
assert.ok(Number.isFinite(s.objective));
assert.ok(w.resources.pilotsBusy>=0&&w.resources.pilotsBusy<=w.resources.pilots,'pilot resource invariant');
assert.ok(w.resources.tugsBusy>=0&&w.resources.tugsBusy<=w.resources.tugs,'tug resource invariant');
assert.ok(w.resources.cranesBusy>=0&&w.resources.cranesBusy<=w.resources.cranes,'crane resource invariant');
for(const b of w.berths){if(b.shipId!=null){const ship=w.ships.find(x=>x.id===b.shipId);assert.ok(ship,'occupied berth must reference a vessel');assert.ok(E.compatible(ship,b),'berth assignment must remain feasible')}}
const restored=E.deserialize(E.serialize(w));
assert.equal(restored.time,w.time);
assert.equal(restored.ships.length,w.ships.length);

const policies=['fcfs','spt','priority','edd','hybrid'];
for(const p of policies){const x=E.generate('CI-POLICY',{policy:p,arrivalMean:105});E.step(x,2880);const k=E.stats(x);assert.ok(Number.isFinite(k.objective));assert.ok(x.events.length>5)}
console.log(`Port smoke test passed: ${w.ships.length} arrivals, ${s.completed} completions, avg wait ${(s.avgWait/60).toFixed(1)}h.`);