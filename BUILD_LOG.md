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

---

## Task D: Robolink CoDrone EDU real-drone compatibility  [COMPLETE]

Verified every generated command against the actual `codrone_edu` v2.8 library source
(downloaded from PyPI: codrone_edu-2.8, file codrone_edu/drone.py). Fixed generated Python
so all commands work on a real drone, not just the simulator.

Model: opencode-go/deepseek-v4-pro

### Real-API mismatches found and fixed (in src/commands/Commands.js and src/codegen/CodeGenerator.js)
- Import: `from drone import *` -> `from codrone_edu.drone import *` (single + swarm headers)
- `led`: was `set_led("color")` (no such method) -> `set_drone_LED(r,g,b,100)` with RGB color table
- `led_off`: was `set_led("off")` -> `drone.drone_LED_off()`
- `random_led`: was `random_color()` (no such method) -> `set_drone_LED(...)`
- `buzzer`: was `set_buzzer(freq,dur)` (takes musical note, not Hz) -> `drone_buzzer(<note>, dur)`
  with nearest-note Hz map (261=C4 ... 880=A5)
- `keep_distance`: was `(dist,speed)` -> `keep_distance(2, <dist>)` (real: timeout, distance)
- `avoid_wall`: was `(dist,speed)` -> `avoid_wall(2, <dist>)` (real: timeout, distance)
- `square_turn`: real library has NO square_turn -> emits valid `square(...)` instead
- `spiral`: added explicit `seconds` (was omitted)
- move_forward/backward/left/right: `speed` was a 0-100% but real API is m/s (max 2) ->
  scaled to 0-2 m/s (50 -> 1.0, 100 -> 2.0)
- `sway`: was string directions ("left-right") but real sway takes int direction -1/1 ->
  added `secs` param and map descriptive dirs to integer direction
- `circle_turn`: added explicit `seconds` param

### Verification (judge, independent)
- Generated a script containing every command (35 total): python3 ast.parse PASS;
  no invalid tokens (set_led/random_color/set_buzzer/square_turn(/from drone import);
  correct tokens present.
- Swarm (threaded) script: valid, `from codrone_edu.drone import *` + threading, AST PASS.
- `npm run build` PASS.
- Confirmed real method set from codrone_edu 2.8 source: takeoff, land, hover, go,
  move_forward/backward/left/right, turn_left/right, turn_degree, circle, circle_turn,
  square, triangle, triangle_turn, spiral, sway, flip, keep_distance, avoid_wall,
  detect_wall, emergency_stop, stop_motors, set_drone_LED, drone_LED_off, drone_buzzer,
  get_battery/get_height/get_front_range/get_bottom_range/get_front_color/get_back_color/
  get_temperature, pair, close.

---

## Task E: Camera modes (remove keyboard camera controls)  [COMPLETE]

Model: opencode-go/deepseek-v4-pro (camera/orbit logic)

### Work (done by opencode)
- Removed keyboard camera movement entirely: deleted `_bindKeys()`, `_processCameraKeys()`,
  and the `this.keys` state from src/scene/Scene3D.js; removed the per-frame
  `this._processCameraKeys()` call in `_animLoop`. WASD/Shift/Ctrl no longer move the camera.
- Added two camera modes (default Mode 1 "Map"):
  - Mode 1 "Cam: Map": camera locked onto the map center. Each frame sets
    `controls.target = (0, 0.15, 0)`; user can still mouse-orbit.
  - Mode 2 "Cam: Drone": camera follows the active drone. Locks `camera.position = dronePos + offset`
    and `controls.target = dronePos`; offset is captured once per playback and re-based on
    play()/stop()/reset().
- Added `setCameraMode(mode)` on Scene3D (coerces to 1/2, snaps to center on Mode 1).
- Added `#camera-mode-select` UI (options "Cam: Map" / "Cam: Drone") in the playback bar;
  main.js wires its change event; style.css styles it to match playback controls.
- OrbitControls drag-to-orbit retained in both modes.

### Verification (judge, independent)
- `npm run build` PASS.
- Confirmed absent: `_processCameraKeys`, `_bindKeys`, `this.keys` in Scene3D.js.
- Confirmed present: `setCameraMode`, `cameraMode`, `camera-mode-select`.
- Zero comments and zero emojis across Scene3D.js/main.js/style.css/index.html.

---

## Task F: Realistic drone flip animation  [COMPLETE]

Model: opencode-go/deepseek-v4-pro (physics/kinematics)

### Work (done by opencode, src/scene/Simulator.js only)
- Replaced the old parametric in-place flip (used sin() oscillation of pitch/roll, so the model
  wobbled instead of tumbling) with a realistic staged flip.
- Replaced constants FLIP_RADIUS_H/V and FLIP_PITCH_MAX with FLIP_TRAVEL (0.35) and FLIP_CLIMB (0.45).
- 80-point flip: staged position via fwd = FLIP_TRAVEL*sin(pi*t) (0->A->0: forward then back) and
  alt = FLIP_CLIMB*sin(pi*t) (0->B->0: up then down) along the flip axis, plus a MONOTONIC 360-degree
  attitude sweep (pitch for back/forward, roll for left/right). Results in: move forward a bit ->
  go up -> go back -> flip over (inverted at 180) -> flip back over (upright at 360). Settles back
  at the original position/altitude with level attitude.

### Verification (judge, independent)
- `npm run build` PASS.
- Own node test of a back flip after takeoff: pitch monotonic 0->360, max altitude 1.28m above
  entry 0.00 (climbs), staged trajectory (up, then flip crossing 180 deg inverted, then descend
  back, pitch reaching 360 upright), net horizontal 0.088m (returns near start), all finite.
- Zero comments and zero emojis in Simulator.js.

---

## Task G: Flip path is a clean oval (top directly above flip start)  [COMPLETE]

Model: opencode-go/deepseek-v4-pro

### Work (src/scene/Simulator.js, flip case)
- Replaced the previous sin(t) staged drift with a literal vertical OVAL path the drone follows.
- Oval: center at (hx,hy,hz+Rv), point = (hx + dirX*Rh*cos(phi), hy + dirY*Rh*cos(phi),
  hz + Rv + Rv*sin(phi)), phi from -PI/2 to 3*PI/2. So the drone starts at the bottom of the
  oval, rises, reaches the TOP directly above the flip start (at phi=PI/2, z=hz+2*Rv), comes
  back down, and closes at the start. Rh=FLIP_TRAVEL, Rv=FLIP_CLIMB.
- numPoints 80 -> 300 so the damped AeroEngine tracks the oval tightly (less residual drift at the
  apex and it visibly closes), plus 8 settle frames back to (hx,hy,hz) level.
- Monotonic 360-degree tumble preserved: pitch for back/forward, roll for left/right.

### Verification (judge, independent)
- `npm run build` PASS.
- Own node test (left flip): apex at z=1.72 with horizontal offset 0.056 (top above start, <0.08),
  roll monotonic 359 deg, returns to start (end horiz 0.053, end z diff 0.043), all finite.
- Samples trace the oval: h 0 -> 0.33 -> 0.06 at apex -> 0.33 -> closes near 0.
- Zero comments and zero emojis.

---

## Task H: Flip nose follows the circle + accelerate-fast-decelerate speed profile  [COMPLETE]

Model: opencode-go/deepseek-v4-pro

### Work (src/scene/Simulator.js, flip case)
- The drone's orientation now FOLLOWS the oval path (tangent to the ellipse) instead of a free
  spin: tangent = atan2(Rv*cos(phi), -Rh*sin(phi)), unwrapped to a monotonic 0..360 angle, applied
  as pitch (back/forward) or roll (left/right). The drone's nose/top traces the circle -> it turns
  over at the top (inverted near 180) and comes back upright (360). Other axis stays 0.
- Added a non-uniform speed profile u(s) = (1 - cos(pi*s))/2 so the drone ACCELERATES going in,
  is FASTEST around the top/middle of the oval (the flip), and DECELERATES back to the start.
  Tuned numPoints 300 -> 200 so the mid-flip speed clearly dominates.

### Verification (judge, independent)
- `npm run build` PASS.
- flip band (pitch 2..360) isolated from takeoff/land: pitch monotonic 2->360 (inverts near 180),
  speed start/mid/end = 0.09/0.36/0.04, midMax=0.47 vs edgeAvg=0.11 (ratio 4.32), max in middle
  third, path closes (netH 0.008, dz 0.035). roll stays 0 on a back flip.
- Zero comments and zero emojis.

---

## Mission: Low-End Hardware Optimization (2026-08-26/27)  [COMPLETE]

Supervisor/Judge: Hermes Agent. Implementer: opencode CLI, model opencode-go/deepseek-v4-flash
pinned in every session (verified via `build · deepseek-v4-flash` header in run logs).
Repo: ~/projects/DronePlannerObsidianVault (branch main). 36 opencode sessions total (all
pinned opencode-go/deepseek-v4-flash, verified via `build · deepseek-v4-flash` header in run
logs): 13 review + 13 writer (wave 2) + 3 parity fixers + 4 writers (wave 3) + 2 writers
(wave 4) + 1 SW warm-up fixer. All code changes via opencode.

### Mission brief
- Clean up the JS Drone Planner and make it run on OLD LOW-END hardware (10-year-old school
  laptops, weak GPUs, 2-4GB RAM). Improve in any way possible. Work autonomously.
- Baseline (this machine, software GL): 17 FPS playback, 59.6ms avg frame, 185 longtasks/6s
  (11.7s blocking), single 611.57kB JS chunk, load 183ms, 1 CSP page error, status stuck on
  FLYING after playback (no end state).

### Wave 1 - Review (13 parallel flash agents, report-only)
- One reviewer per file/domain with AGENT_BRIEF + TASK per shard. All 13 reports landed in
  .opencode/swarm_shards/reviews/. Top findings: uncapped DPR + antialias + 2048 shadow map
  (Scene3D), per-frame trail buffer rebuild + GL buffer leak (FlightTrail), per-frame Box3/
  setFromObject collision allocation storm (ObstacleManager), 6 PointLight glow per drone
  (DroneModel), telemetry chart redrawn every frame even when collapsed + 300-array copy
  (main.js), 20 backdrop-filters re-blurring the canvas (style.css), single 611KB chunk with
  no code split + dead Simulator import forcing three into the initial chunk (build/startup),
  CSP-blocked Google Fonts @import as a render-blocking round trip.
- Reviewer claims cross-checked against the live tree before applying (rejected: random_led/
  get_distance "orphaned" claim - parser and codegen reference them).

### Wave 2 - Writers (13 parallel flash agents, one file per owner)
- Scene3D: antialias off, DPR cap 1.5 (1.0 in perf-mode), shadow map 2048->1024, shadows off
  in perf-mode, 4 directional lights -> 1 sun, dirty-flag render loop (idle = no GPU work),
  disposeObject3D + Scene3D.dispose(), scratch Vector3 for trail+collision, propellers
  precomputed via traverse, waypoints MeshBasic + shared geometry.
- FlightTrail: preallocated 2000-point ring buffer + drawRange + needsUpdate (in-place
  bufferSubData, no GL leak), frustumCulled=false, dead setStaticPath removed.
- ObstacleManager: world AABBs precomputed at add/update (zero per-frame allocation), shared
  geometry+material per type, dispose-once clearAll, hoop segments 16/48->8/24.
- DroneModel: 6 PointLights removed, all 29 MeshStandard->MeshLambert (+MeshBasic for
  sub-pixel), shared per-type geometries, castShadow gated on perf-mode, invisible FRONT
  sprite removed, sub-pixel parts deleted, isPropeller moved to blade groups (visible blades
  now actually spin), export disposeDroneMesh(group).
- main.js: 9 hot DOM refs cached, chart gated on expanded + cached size/colors, Float64Array
  ring buffer, debounced resize, BUG FIX apply-code logMessage->log, dead imports removed,
  highlight interval lifecycle managed, codegen debounced 150ms, perf-mode probe
  (hardwareConcurrency/deviceMemory/prefers-reduced-motion -> html.perf-mode).
- style.css: html.perf-mode degradation rules, prefers-reduced-motion block, Google Fonts
  @import removed, dead .card/.cmd-block-close removed, scrollbar rule moved off *.
- index.html: inline data-URI favicon (kills /favicon.ico 404 round trip).
- Simulator.js: maxIter 500->10000 (silent truncation of 500+ command plans), evalExpr
  memoized per expression string, scratch control/telemetry/vector pooling (value-safe).
- AeroEngine.js: trig reuse + rad conversion (see fixers), speed/drag memoized, pooled
  telemetry object.
- CodeGenerator.js: swarm block droneVar substitution fixed, falsy-0-default fixes.
- Commands.js: BUG FIX time_sleep def added (Sleep button did nothing), move_*/shape def
  factories (dedup, identical output).
- ObstacleImporter.js: double JSON.parse removed, full-text copies removed, no-faces OBJ
  bounded.
- ScriptParser.js: blank-line-in-block truncation FIXED, falsy-0 coercion fixed, regex
  dispatch (57 regex/line -> token dispatch): 684us -> 118us per 200-line import (5.8x).

### Wave 3 - Code split + UX (4 flash agents)
- main.js: Scene3D now loaded via dynamic import() after the UI shell; initial JS chunk
  611.57kB -> 61.20kB (10x), three.js in its own cache-stable chunk (489kB, manualChunks),
  chunkSizeWarningLimit 800 (vite.config.js).
- Playback end state: Scene3D emits onPlaybackEnd(z) once when t reaches 1 and stops
  (isPlaying=false); main.js sets status Landed (z<0.15) or Completed. No more eternal FLYING.
- Nits: trailing whitespace + EOF newline fixed.

### Wave 4 - Resilience + offline (2 flash agents)
- Service worker (public/sw.js): versioned caches, network-first document with offline
  fallback page, stale-while-revalidate assets; registered from main.js. Offline capable +
  instant repeat loads on school networks.
- WebGL context-loss resilience: webglcontextlost preventDefault + webglcontextrestored
  needsRender handlers in Scene3D.

### Parity enforcement (judge, independent)
- /tmp/parity_check.cjs bundles OLD (git tag baseline-pre-cleanup-20260826) vs NEW
  Simulator/AeroEngine/CodeGenerator/Commands and deep-compares positions[], totalDuration,
  generated code. Three parity breaks were caught and fixed by surgical fixer sessions:
  (1) DEG2RAD hoisting changed (x*Math.PI/180) association -> 1-ULP drift; restored literal
  forms. (2) _speed memo captured pre-clamp magnitude -> wrong speed field. (3) _speed memo
  went stale when getTelemetry ran without a step (landed point) -> computed fresh;
  _drag kept last-step semantics with reset init 0. Final: PARITY PASS (positions, duration,
  codegen byte-identical; only intended diff: time_sleep def added).

### Measured results (same machine, same harness)
- FPS during playback: 17 -> 42 (2.5x). Avg frame: 59.6ms -> 24ms. p95: 66.7 -> 33.4.
- Longtasks per 6s: 185 (11.7s blocking) -> 6 (0.7s) default; 0 perf-mode.
- Initial JS chunk: 611.57kB -> 61.20kB (three separate, cache-stable). Load: 183ms -> 49ms.
- Page console errors: 1 (CSP font) -> 0.
- Status flow now ends in Landed/Completed (was stuck FLYING forever).
- Sim/codegen parity preserved byte-for-byte; generated drone Python unchanged for all
  existing commands (codrone_edu 2.8 compatible).

### Commits
- 0d53460 (wave 2), d3ffd0d (wave 3), final (waves 4 + build log). All empty-message.
