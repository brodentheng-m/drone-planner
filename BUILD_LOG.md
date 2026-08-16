# BUILD_LOG.md - Drone Planner Overhaul Audit Log

Autonomous overhaul session. Supervisor/Judge: Hermes Agent. Implementer: OpenCode CLI.
Working directory: /home/bradenz/Documents/DronePlannerObsidianVault
Started: 2026-08-16

## Baseline

- Vite + Three.js educational drone flight planner, ES modules under src/.
- Source lives in src/ (index.html, main.js, style.css, scene/*, commands/*, codegen/*).
- git initialized (branch main), no remote yet. gh authenticated as brodentheng-m.
- Baseline `npm run build` passed before any changes.

## Convention applied to ALL tasks (strict)

- ZERO comments in all written/edited code.
- NO emojis in code, source, docs, or logs.
- git commit uses an empty message (`git commit -m ""`).

---

## Task A: Drone Model & Aerodynamics Engine  [COMPLETE]

Model: opencode-go/deepseek-v4-pro (heavy physics/logic)

### Work
- Created src/scene/AeroEngine.js: class AeroEngine, pure-math point-mass + attitude physics.
  - Config: mass, max_thrust, drag_coefficient, rotational_drag, max_velocity,
    battery_capacity_wh, energy_drain, gravity, efficiency.
  - step(throttle, {pitch,roll,yaw,targetAltitude}, dt): thrust vs weight, v^2 sign-aware drag,
    pitch/roll horizontal thrust decomposition, yaw-rate damping, battery drain.
  - getTelemetry() -> {pitch, roll, yaw, speed_mps, altitude_m, velocityVector, thrust, drag,
    energyUsedWh, batteryPercent, turnRadiusM}.
  - reset(config).
- Rewrote src/scene/Simulator.js so every movement command drives the AeroEngine.
  - Exported API unchanged: simulateSwarm(drones, obstacleManager, onCommandStart),
    simulateCommands(commands, onCommandStart). Result shape unchanged.
  - Each position point now carries speed, energyUsed, batteryPercent, turnRadiusM in addition
    to x,y,z,heading,pitch,roll (and optional led).
  - Collision hooks preserved (obstacleManager.checkCollision on THREE.Vector3 with drone size
    0.1). Drone size stays 0.1.
- Wired telemetry into src/scene/Scene3D.js:
  - Added this.onTelemetry (default null), this.lastTelemetry, getLastTelemetry(), _buildTelemetry().
  - Animation loop emits live telemetry for the first drone each frame.
  - onPositionUpdate(x,y,z,heading) still called with exactly 4 args (readout unaffected).

### Bug found and fixed by judge
- Reproduced: after takeoff, horizontal motion caused a runaway vertical climb (z reached 741m
  instead of holding ~0.8m). Root cause: computeControl used a single coupled throttle with an
  over-aggressive gain (1/dt^2=400) ramping up vertical velocity that could not be decelerated.
- Fix (opencode, same model): decoupled controllers. AeroEngine.step() now runs an altitude-hold
  loop when control.targetAltitude is present; throttle = (m*g + kp*err + kd*(targetVel - v.z))
  / cos(pitch)cos(roll), clamped to [0,1]. computeControl() now emits a modest horizontal velocity
  controller mapped to pitch/roll and passes targetAltitude through. Initial position point now
  also carries the 4 telemetry fields.

### Verification (judge, independent)
- `npm run build` PASS.
- Node smoke test (8-command sequence: takeoff, fwd80, turnR90, left50, circle, hover, spiral, land):
  - final z = 0.00 (lands), maxZ = 1.12 m, horizontal displacement 1.91 m, NO_NAN true,
    battery 100 -> 98.1. PASS.

---

## Task B: Modern UI / UX Overhaul  [COMPLETE]

Model: opencode-go/kimi-k2.7-code (UI / UX routing)

### Work (done by opencode)
- src/index.html: added #flight-status-bar (status-dot, status-text, status-alt/spd/bat/hdg),
  #telemetry-chart-panel (btn-toggle-chart, #telemetry-chart canvas). Replaced unicode
  control symbols (&#x2398; etc.) with ASCII text (Dup/X/Up/Dn) per no-emoji rule.
- src/style.css: modern dark dashboard. Fixed-panel flex (min-height:0 internal scrolling);
  #right-panel splits obstacles (max 45%) + code preview; #scene-overlay is a bottom-centered
  stacked column (status bar / collapsible chart / playback / readout) with pointer-events:none
  on empty areas so 3D interaction is not blocked; card styling; uppercase labels.
- src/main.js: flight status indicator (isFlying/hasCollision/updateFlightStatus),
  hand-rolled speed-over-time chart (#telemetry-chart canvas, 300-sample ring buffer fed by
  scene3d.onTelemetry, grid+axes+accent line), waypoint selection (listens for
  'waypoint-selected' CustomEvent, sets selectedPath, scrolls command into view), resets.
- src/scene/Scene3D.js: interactive route waypoints. New getRoutePoints(droneId),
  _buildWaypoints, raycast click handler dispatching 'waypoint-selected' with commandIndex;
  records command-start boundaries in routeMap via the onCommandStart callback.
- src/scene/Simulator.js: onCommandStart callback now also receives simulation state
  (extra 3rd arg, backward compatible). state gains id. Result shape unchanged.

### Verification (judge, independent)
- `npm run build` PASS (15 modules).
- Task A physics regression smoke test still PASS (SMOKE_OK, battery 100->98.1, NO_NAN).
- Scene3D public API intact (onPositionUpdate 4-arg contract, onTelemetry, getLastTelemetry,
  getRoutePoints, setSwarm, play/reset/setSpeed, obstacle & command-index methods).
- Zero comments confirmed in all JS edits; zero emojis across index.html/main.js/style.css/
  Scene3D.js/Simulator.js.
- esbuild bundle of src/main.js passed during implementation.

---

## Task C: Dynamic Obstacle Importing Engine  [COMPLETE]

Model: opencode-go/deepseek-v4-pro (spatial collision logic)

### Work (done by opencode)
- Created src/scene/ObstacleImporter.js exporting class ObstacleImporter (pure parsers, no DOM):
  - parseJSON (array or {obstacles:[...]}; tolerant coercion; geo bbox {cx,cy,cz,width,height,depth}/radius
    to wall/tower/cone; delegates GeoJSON)
  - parseGeoJSON (FeatureCollection/single Feature; Point/LineString/Polygon/others; property
    height/width/depth/radius; name from properties.name/id; scale option)
  - parseCSV (header-driven; quoted-field aware; type,x,y,z/altitude,width,height,depth,radius,
    name,rotation_*)
  - parseOBJ (faces -> single bbox wall/tower; vertices-only -> one wall/vertex; honors o/g names)
  - run(text, filenameOrExt, options) dispatches by extension, returns { obstacles }
- src/scene/ObstacleManager.js: added boundary state (default x:-4..4, z:-4..4, maxY:4),
  getBoundary(), setBoundary(), ensureWithinBoundary(), getRejectedCount(); importObstacles now
  filters out-of-bounds centers (rejects counted). Collision detection unchanged (drone size 0.1).
- src/scene/Scene3D.js: added removeObstacle(id), getRejectedCount(), getBoundary(), setBoundary(),
  setBoundaryVisible(), renderBoundary() (Box3Helper wireframe, default visible) called in ctor.
- src/main.js: wired obstacle import (btn-import-obstacles + hidden #obstacle-file-input + drag/drop
  on #obstacle-panel), boundary toggle (btn-toggle-boundary), fixed per-item delete to
  scene3d.removeObstacle(id); logs imported/rejected counts.
- src/index.html + src/style.css: added the two buttons, hidden file input, .drag-over highlight.
- Created examples/ sample obstacle course: obstacles.json, obstacles.geojson, obstacles.csv,
  obstacles.obj (demo walls/tower/cones near origin).

### Verification (judge, independent)
- `npm run build` PASS.
- Independent parser test of all 4 example files: obstacles.json(5), obstacles.geojson(3),
  obstacles.csv(4), obstacles.obj(1) all PASS (valid type + numeric 3-length position).
- Task A physics regression smoke test still PASS (SMOKE_OK, NO_NAN, battery drains, horizontal move).
- Zero comments confirmed in ObstacleImporter.js and all touched JS; zero emojis across all UI files.

---

## FINAL VERIFICATION & ARCHITECTURAL DECISIONS (judge)

- All three core objectives complete with zero regression.
- Physics modularized into src/scene/AeroEngine.js (standalone, no Three.js dep).
- Altitude-hold controller decoupled from horizontal control (fixes runaway-climb bug found by judge).
- Telemetry surfaced through Scene3D.onTelemetry + getLastTelemetry, consumed by the new dashboard
  (flight status bar + hand-rolled speed chart).
- Route waypoints rendered via Scene3D.getRoutePoints + raycaster clicks -> waypoint-selected event.
- Obstacles import from JSON/GeoJSON/CSV/OBJ into the manager with an in-boundary filter and a
  wireframe flight-area boundary visualization.
- Empty-message git commits and push pending.

## Deployment (pending final checks)

- Stage and commit all changes with empty message, push to GitHub.
