# Port Congestion Simulator

A browser-based port operations simulator that combines discrete-event simulation, Operational Research and a high-resolution raster pixel-art harbor.

**Live:** https://mrhakan.github.io/port-congestion-sim/

## What it simulates

- stochastic vessel arrivals using exponential inter-arrival times
- anchorage queues and port-call sequencing
- berth compatibility by vessel type, LOA and draft
- constrained pilots, tugs and crane gangs
- pilot-boat transit and pilot boarding
- pilot ladder climbing animation
- inbound pilotage, tug rendezvous, turning-basin maneuver and final berthing
- quay-side tug geometry: final berthing tugs work from the seaward/opposite-quay side, while unberthing tugs pull outward
- mooring teams, heaving lines, towlines and all-fast sequence
- animated container gantry crane cycles with trolley/spreader motion
- lightweight container-truck loops between the terminal yard and active container berths
- cargo operations with weather-adjusted productivity
- outbound pilotage and resource release
- changing visibility, wind and weather delays
- terminal KPIs and queue history

The shiphandling animation is an educational visualization, not a certified maneuvering, navigation or berth-planning model.

## High-resolution pixel-art renderer

The artwork uses a logical 64x64 pixel grid but is generated on 256x256 backing canvases (4x resolution) and rendered with nearest-neighbor sampling. This keeps the chunky pixel-art style while making labels and sprites noticeably cleaner on high-DPI tablets and desktop displays.

Ships, tugs, pilot boats, dock workers, cranes, terminal trucks, containers, buildings and port scenery share cached textures. The terminal uses fixed crane/truck pools and completed vessel views are destroyed instead of accumulating indefinitely.

## Harbor animation model

Pilot boarding is tied to the vessel's starboard-side boarding geometry: the pilot boat settles alongside, the ladder runs between the launch and ship side, and the pilot disappears into the vessel after boarding rather than floating outside the bridge.

Tug placement is calculated from the ship heading and berth/quay side. During final parallel berthing, tugs remain on the seaward side of the vessel. During unmooring they increase their seaward offset to visually represent pulling the ship off the berth. Towlines attach to fore/aft points rather than the vessel center.

Container terminals animate only while a container ship is in cargo operations. Active crane gangs cycle shared spreader/container sprites and two reusable terminal trucks per berth move containers to or from the yard. This is intentionally lightweight rather than a full container-yard simulation.

## Map navigation

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
- generated 256x256 backing textures based on a 64x64 logical pixel grid
- shared sprite pools for gantry cranes and container trucks
- no external sprite CDN required
- GitHub Pages deployment

## Development

The project is static and does not require a build step. Open `index.html` through a local HTTP server, or deploy it directly to GitHub Pages.

```bash
node tests/geometry.mjs
node tests/smoke.mjs
```

CI verifies maneuver geometry (including opposite-quay tug placement), advances a congested port for seven simulated days, and checks resource, berth and serialization invariants before Pages deployment.

## Disclaimer

For education, simulation and Operational Research experimentation only. Do not use this software for real navigation, pilotage, berth planning, under-keel-clearance decisions or operational control.
