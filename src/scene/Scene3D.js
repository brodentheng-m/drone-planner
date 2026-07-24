import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { createDroneMesh, setAllLeds } from './DroneModel.js';
import { FlightTrail } from './FlightTrail.js';
import { simulateSwarm, simulateCommands } from './Simulator.js';

const DRONE_TINT_COLORS = [0x58a6ff, 0x3fb950, 0xf0883e, 0xbc8cff, 0x39d2c0, 0xf778ba, 0xd29922, 0xf85149];

export class Scene3D {
  constructor(canvas) {
    this.canvas = canvas;
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0d1117);
    this.scene.fog = new THREE.Fog(0x0d1117, 20, 50);

    const rect = canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;

    this.camera = new THREE.PerspectiveCamera(50, this.width / this.height, 0.1, 100);
    this.camera.position.set(5, 6, 8);

    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.target.set(0, 0.5, 0);
    this.controls.maxPolarAngle = Math.PI / 2.1;

    this.keys = {};
    this._bindKeys();

    this._addLights();
    this._addGround();
    this._addAxes();
    this._addCompass();

    this.droneMeshes = {};
    this.droneTrails = {};
    this.droneLeds = {};

    this.swarmResults = null;
    this.simTime = 0;
    this.isPlaying = false;
    this.speed = 1;
    this.onPositionUpdate = null;
    this.onLog = null;

    this._animLoop();
    window.addEventListener('resize', () => this._onResize());
  }

  _bindKeys() {
    const down = (e) => {
      this.keys[e.code] = true;
      if (['ShiftLeft','ShiftRight','ControlLeft','ControlRight'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const up = (e) => { this.keys[e.code] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    this.canvas.addEventListener('blur', () => { this.keys = {}; });
  }

  _processCameraKeys() {
    const k = this.keys;
    const hasWASD = k.KeyW || k.KeyS || k.KeyA || k.KeyD || k.ShiftLeft || k.ShiftRight || k.ControlLeft || k.ControlRight;
    if (!hasWASD) return;

    const speed = 0.08;
    const cam = this.camera;
    const forward = new THREE.Vector3();
    cam.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, cam.up).normalize();

    const move = new THREE.Vector3(0, 0, 0);

    if (k.KeyW) move.add(forward.clone().multiplyScalar(speed));
    if (k.KeyS) move.add(forward.clone().multiplyScalar(-speed));
    if (k.KeyA) move.add(right.clone().multiplyScalar(-speed));
    if (k.KeyD) move.add(right.clone().multiplyScalar(speed));
    if (k.ShiftLeft || k.ShiftRight) move.y += speed;
    if (k.ControlLeft || k.ControlRight) move.y -= speed;

    cam.position.add(move);
    this.controls.target.add(move);
  }

  _addLights() {
    const ambient = new THREE.AmbientLight(0x404060, 0.5);
    this.scene.add(ambient);

    const hemi = new THREE.HemisphereLight(0x87ceeb, 0x362a28, 0.6);
    this.scene.add(hemi);

    const sun = new THREE.DirectionalLight(0xfff4e0, 1.2);
    sun.position.set(8, 15, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 40;
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x6080c0, 0.4);
    fill.position.set(-6, 8, -4);
    this.scene.add(fill);

    const rim = new THREE.DirectionalLight(0xffffff, 0.3);
    rim.position.set(-3, 10, 10);
    this.scene.add(rim);
  }

  _addGround() {
    const FT = 0.3048;
    const size = 20;
    const divisions = Math.round(size / FT);

    const grid = new THREE.GridHelper(size, divisions, 0x30363d, 0x21262d);
    grid.material.opacity = 0.6;
    grid.material.transparent = true;
    this.scene.add(grid);

    const majorGrid = new THREE.GridHelper(size, Math.round(size / (FT * 5)), 0x484f58, 0x30363d);
    majorGrid.material.opacity = 0.8;
    majorGrid.material.transparent = true;
    majorGrid.position.y = 0.001;
    this.scene.add(majorGrid);

    const planeGeo = new THREE.PlaneGeometry(size, size);
    const planeMat = new THREE.MeshStandardMaterial({
      color: 0x0d1117, side: THREE.DoubleSide, roughness: 0.9
    });
    const plane = new THREE.Mesh(planeGeo, planeMat);
    plane.rotation.x = -Math.PI / 2;
    plane.position.y = -0.01;
    plane.receiveShadow = true;
    this.scene.add(plane);

    const makeFtLabel = (text, position) => {
      const c = document.createElement('canvas');
      c.width = 64; c.height = 32;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#484f58';
      ctx.font = 'bold 18px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 32, 16);
      const tex = new THREE.CanvasTexture(c);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.6 }));
      sprite.position.copy(position);
      sprite.scale.set(0.6, 0.3, 1);
      this.scene.add(sprite);
    };

    for (let ft = 5; ft <= Math.round(size / FT); ft += 5) {
      const m = ft * FT;
      if (m > size / 2) break;
      makeFtLabel(`${ft}ft`, new THREE.Vector3(m, 0.02, 0.15));
      makeFtLabel(`${ft}ft`, new THREE.Vector3(-m, 0.02, 0.15));
      makeFtLabel(`${ft}ft`, new THREE.Vector3(0.15, 0.02, m));
      makeFtLabel(`${ft}ft`, new THREE.Vector3(0.15, 0.02, -m));
    }
  }

  _addAxes() {
    const len = 3;
    const dirX = new THREE.Vector3(len, 0, 0);
    const dirY = new THREE.Vector3(0, len, 0);
    const dirZ = new THREE.Vector3(0, 0, len);
    const origin = new THREE.Vector3(0, 0, 0);

    this.scene.add(new THREE.ArrowHelper(dirX, origin, len, 0xf85149, 0.15, 0.08));
    this.scene.add(new THREE.ArrowHelper(dirY, origin, len, 0x3fb950, 0.15, 0.08));
    this.scene.add(new THREE.ArrowHelper(dirZ, origin, len, 0x58a6ff, 0.15, 0.08));

    const makeLabel = (text, pos, color) => {
      const c = document.createElement('canvas');
      c.width = 64; c.height = 32;
      const ctx = c.getContext('2d');
      ctx.fillStyle = color;
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 32, 16);
      const tex = new THREE.CanvasTexture(c);
      const spriteMat = new THREE.SpriteMaterial({ map: tex, transparent: true });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.position.copy(pos);
      sprite.scale.set(0.5, 0.25, 1);
      this.scene.add(sprite);
    };

    makeLabel('X', new THREE.Vector3(len + 0.3, 0, 0), '#f85149');
    makeLabel('Z', new THREE.Vector3(0, 0, len + 0.3), '#58a6ff');
    makeLabel('Y', new THREE.Vector3(0, len + 0.3, 0), '#3fb950');
  }

  _addCompass() {
    const makeLabel = (text, pos) => {
      const c = document.createElement('canvas');
      c.width = 64; c.height = 32;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#8b949e';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 32, 16);
      const tex = new THREE.CanvasTexture(c);
      const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true }));
      sprite.position.copy(pos);
      sprite.scale.set(0.4, 0.2, 1);
      this.scene.add(sprite);
    };

    makeLabel('N', new THREE.Vector3(0, 0.05, -3));
    makeLabel('S', new THREE.Vector3(0, 0.05, 3));
    makeLabel('E', new THREE.Vector3(3, 0.05, 0));
    makeLabel('W', new THREE.Vector3(-3, 0.05, 0));
  }

  _ensureDroneMesh(id, colorHex) {
    if (!this.droneMeshes[id]) {
      const mesh = createDroneMesh();
      mesh.position.set(0, 0.05, 0);
      this.scene.add(mesh);
      this.droneMeshes[id] = mesh;

      const trail = new FlightTrail(this.scene);
      this.droneTrails[id] = trail;

      this.droneLeds[id] = 'off';
    }

    const mesh = this.droneMeshes[id];
    const colorInt = parseInt(colorHex.replace('#', ''), 16);
    mesh.children.forEach(c => {
      if (c.userData.isFrontIndicator) {
        c.material.color.setHex(colorInt);
      }
    });

    return mesh;
  }

  _removeDroneMesh(id) {
    if (this.droneMeshes[id]) {
      this.scene.remove(this.droneMeshes[id]);
      delete this.droneMeshes[id];
    }
    if (this.droneTrails[id]) {
      this.droneTrails[id].clear();
      delete this.droneTrails[id];
    }
    delete this.droneLeds[id];
  }

  setSwarm(drones) {
    const activeIds = new Set(drones.map(d => d.id));

    for (const id of Object.keys(this.droneMeshes)) {
      if (!activeIds.has(id)) this._removeDroneMesh(id);
    }

    for (const drone of drones) {
      this._ensureDroneMesh(drone.id, drone.color);
    }

    this.swarmResults = simulateSwarm(drones);

    for (const drone of drones) {
      const result = this.swarmResults[drone.id];
      const mesh = this.droneMeshes[drone.id];
      if (result.positions.length > 0) {
        const p = result.positions[0];
        mesh.position.set(p.x, p.z, p.y);
        mesh.rotation.order = 'YXZ';
        mesh.rotation.set(0, 0, 0);
      }
      if (this.droneTrails[drone.id]) {
        this.droneTrails[drone.id].clear();
      }
    }
  }

  setCommands(commands) {
    this.setSwarm([{ id: 'default', commands, color: '#58a6ff', offset: [0, 0, 0] }]);
  }

  play() {
    if (!this.swarmResults || Object.keys(this.swarmResults).length === 0) {
      if (this.onLog) this.onLog('No commands to play', 'warn');
      return;
    }
    this.isPlaying = true;
    this.simTime = 0;

    for (const id of Object.keys(this.droneTrails)) {
      this.droneTrails[id].clear();
    }
    for (const id of Object.keys(this.droneMeshes)) {
      setAllLeds(this.droneMeshes[id], 'off');
      this.droneLeds[id] = 'off';
    }

    let totalFrames = 0;
    for (const id of Object.keys(this.swarmResults)) {
      totalFrames = Math.max(totalFrames, this.swarmResults[id].positions.length);
    }
    if (this.onLog) this.onLog(`Playing swarm: ${Object.keys(this.swarmResults).length} drones, ${totalFrames} frames`, 'success');
  }

  stop() {
    this.isPlaying = false;
    this.simTime = 0;
    for (const id of Object.keys(this.droneTrails)) {
      this.droneTrails[id].clear();
    }
    for (const [id, result] of Object.entries(this.swarmResults || {})) {
      if (result.positions.length > 0 && this.droneMeshes[id]) {
        const p = result.positions[0];
        this.droneMeshes[id].position.set(p.x, p.z, p.y);
      }
    }
  }

  reset() { this.stop(); }
  setSpeed(s) { this.speed = s; }

  _animLoop() {
    requestAnimationFrame(() => this._animLoop());

    this._processCameraKeys();
    this.controls.update();

    if (this.isPlaying && this.swarmResults) {
      const dt = 0.033 * this.speed;
      this.simTime += dt;

      let maxDuration = 0;
      for (const result of Object.values(this.swarmResults)) {
        maxDuration = Math.max(maxDuration, result.totalDuration);
      }
      if (maxDuration <= 0) maxDuration = 1;
      const t = Math.min(this.simTime / maxDuration, 1);

      let firstMesh = null;
      let firstPos = null;

      for (const [id, result] of Object.entries(this.swarmResults)) {
        const mesh = this.droneMeshes[id];
        if (!mesh || result.positions.length === 0) continue;

        const positions = result.positions;
        const idx = Math.min(Math.floor(t * (positions.length - 1)), positions.length - 1);
        const p = positions[idx];

        mesh.position.set(p.x, p.z, p.y);

        const yaw = -(p.heading || 0) * Math.PI / 180 - Math.PI / 2;
        const pitch = -(p.pitch || 0) * Math.PI / 180;
        const roll = -(p.roll || 0) * Math.PI / 180;

        mesh.rotation.order = 'YXZ';
        mesh.rotation.set(pitch, yaw, roll);

        mesh.children.forEach(c => {
          if (c.userData.isPropeller) c.rotation.y += 50 * 0.033;
        });

        if (p.led !== undefined && p.led !== this.droneLeds[id]) {
          this.droneLeds[id] = p.led;
          setAllLeds(mesh, p.led);
        }

        if (this.droneTrails[id]) {
          this.droneTrails[id].addPoint(new THREE.Vector3(p.x, p.z, p.y));
        }

        if (!firstMesh) { firstMesh = mesh; firstPos = p; }
      }

      if (this.onPositionUpdate && firstPos) {
        this.onPositionUpdate(firstPos.x, firstPos.y, firstPos.z, firstPos.heading);
      }

      if (t >= 1) this.isPlaying = false;
    }

    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.camera.aspect = this.width / this.height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(this.width, this.height);
  }
}
