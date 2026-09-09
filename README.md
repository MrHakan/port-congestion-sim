# Port Congestion Simulator

A browser-based port operations simulator that combines discrete-event simulation, Operational Research and a true low-resolution pixel-art harbor.

**Live:** https://mrhakan.github.io/port-congestion-sim/

## What it simulates

- stochastic vessel arrivals using exponential inter-arrival times
- anchorage queues and port-call sequencing
- berth compatibility by vessel type, LOA and draft
- constrained pilots, tugs and crane gangs
- pilot-boat transit and pilot boarding
- pilot ladder climbing animation
- inbound pilotage, tug rendezvous, turning-basin maneuver and final berthing
- mooring teams, heaving lines, towlines and all-fast sequence
- cargo operations with weather-adjusted productivity
- outbound pilotage and resource release
- changing visibility, wind and weather delays
- terminal KPIs and queue history

The shiphandling animation is an educational visualization, not a certified maneuvering, navigation or berth-planning model.

## True pixel-art renderer

The harbor renderer no longer scales vector drawings and calls them pixel art. Ships, tugs, pilot boats, dock workers, cranes, buildings and port scenery are generated as fixed low-resolution raster textures, primarily on 64x64 canvases, then rendered through PixiJS with nearest-neighbor sampling and pixel snapping.

The map itself uses tiled raster water, land and quay textures and a fixed 2048x1152 world coordinate system.

## Map navigation

The harbor is now a movable world rather than a fixed viewport.

- drag with mouse, pen or one finger to pan
- WASD or arrow keys to pan on desktop
- mouse wheel to zoom
- two-finger pinch to zoom on touch devices
- `Center Port` resets the camera
- click a vessel, berth card, radio message or queue row to focus that vessel
- `Follow Vessel` keeps the camera locked to the selected moving ship
- interactive minimap shows traffic, selected vessel and current viewport
- clicking the minimap moves the camera directly to that area

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

- PixiJS for the pixel-art harbor and camera system
- Chart.js for OR/KPI visualization
- generated 64x64 raster sprite pipeline with nearest-neighbor scaling
- no external sprite CDN required
- GitHub Pages deployment

## Development

The project is static and does not require a build step. Open `index.html` through a local HTTP server, or deploy it directly to GitHub Pages.

The simulation core is intentionally independent from the renderer so it can be tested headlessly with Node.js.

```bash
node tests/smoke.mjs
```

CI advances a congested port for seven simulated days and checks resource, berth and serialization invariants before Pages deployment. It also validates the raster asset pipeline and camera/minimap integration.

## Disclaimer

For education, simulation and Operational Research experimentation only. Do not use this software for real navigation, pilotage, berth planning, under-keel-clearance decisions or operational control.
