# Port Congestion Simulator

A browser-based, pixel-art port operations simulator that combines animated ship handling with discrete-event simulation and Operational Research.

**Live:** https://mrhakan.github.io/port-congestion-sim/

## What it simulates

- stochastic vessel arrivals using exponential inter-arrival times
- anchorage queues and port-call sequencing
- berth compatibility by vessel type, LOA and draft
- constrained pilots, tugs and crane gangs
- pilot-boat transit and pilot boarding
- inbound pilotage, tug rendezvous, turning-basin maneuver and final berthing
- mooring teams and all-fast sequence
- cargo operations with weather-adjusted productivity
- outbound pilotage and resource release
- changing visibility, wind and weather delays
- terminal KPIs and queue history

The shiphandling animation is an educational visualization, not a certified maneuvering, navigation or berth-planning model.

## Operational Research features

The dispatch engine includes:

- FCFS — First Come, First Served
- SPT — Shortest Processing Time
- Priority scheduling
- EDD — Earliest Due Date
- Hybrid weighted dispatch scoring
- berth/resource feasibility constraints
- discrete-event simulation
- arrival-rate estimation
- berth, pilot, tug and crane utilization
- average waiting and turnaround time
- throughput
- Little's Law estimate `Lq ≈ λWq`
- weighted multi-criteria objective function
- controlled 48-hour policy benchmark using identical scenario inputs

## Visual stack

- PixiJS for the animated pixel-art harbor
- Chart.js for OR/KPI visualization
- procedural ships, tugs, pilot boat, cranes and dock workers — no sprite CDN required
- GitHub Pages deployment

## Development

The project is static and does not require a build step. Open `index.html` through a local HTTP server, or deploy it directly to GitHub Pages.

The simulation core is intentionally independent from the renderer so it can be tested headlessly with Node.js.

```bash
node tests/smoke.mjs
```

The CI test advances a congested port for seven simulated days and checks resource, berth and serialization invariants before Pages deployment.

## Disclaimer

For education, simulation and Operational Research experimentation only. Do not use this software for real navigation, pilotage, berth planning, under-keel-clearance decisions or operational control.