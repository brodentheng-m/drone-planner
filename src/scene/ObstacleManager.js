import * as THREE from 'three';

const OBSTACLE_TYPES = {
  wall: { width: 0.5, height: 1.0, depth: 2.0, color: 0x4a5568 },
  tower: { width: 0.3, height: 1.5, depth: 0.3, color: 0x2d3748 },
  hoop: { innerRadius: 0.4, outerRadius: 0.5, height: 0.05, color: 0xe53e3e },
  cone: { radius: 0.2, height: 0.4, color: 0xfbb6ce }
};

const BASE_OBSTACLES = [
  { type: 'wall', position: [1.0, 0.5, 0.0], rotation: [0, 0, 0], name: 'Wall 1' },
  { type: 'wall', position: [-1.0, 0.5, 0.0], rotation: [0, 0, 0], name: 'Wall 2' },
  { type: 'wall', position: [0.0, 0.5, 1.0], rotation: [0, Math.PI / 2, 0], name: 'Wall 3' },
  { type: 'wall', position: [0.0, 0.5, -1.0], rotation: [0, Math.PI / 2, 0], name: 'Wall 4' },
  { type: 'tower', position: [0.0, 0.75, 0.0], rotation: [0, 0, 0], name: 'Tower' },
  { type: 'hoop', position: [0.8, 1.2, 0.8], rotation: [Math.PI / 2, 0, 0], name: 'Hoop' },
  { type: 'cone', position: [-0.8, 0.2, 0.8], rotation: [0, 0, 0], name: 'Cone 1' },
  { type: 'cone', position: [0.8, 0.2, -0.8], rotation: [0, 0, 0], name: 'Cone 2' }
];

export class ObstacleManager {
  constructor(scene) {
    this.scene = scene;
    this.obstacles = [];
    this.obstacleMeshes = {};
    this.collisionEnabled = true;
    this.boundary = { minX: -4, maxX: 4, minZ: -4, maxZ: 4, maxY: 4 };
    this.rejectedCount = 0;
    this.loadBaseObstacles();
  }

  loadBaseObstacles() {
    this.clearAll();
    for (const obs of BASE_OBSTACLES) {
      this.addObstacle(obs);
    }
    return this.obstacles;
  }

  addObstacle(def) {
    const obstacle = {
      id: `obs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: def.type || 'wall',
      position: new THREE.Vector3(...(def.position || [0, 0, 0])),
      rotation: new THREE.Euler(...(def.rotation || [0, 0, 0])),
      name: def.name || `${def.type} ${this.obstacles.length + 1}`,
      scale: def.scale ? new THREE.Vector3(...def.scale) : new THREE.Vector3(1, 1, 1)
    };

    this.obstacles.push(obstacle);
    this._createMesh(obstacle);
    return obstacle;
  }

  removeObstacle(id) {
    const idx = this.obstacles.findIndex(o => o.id === id);
    if (idx !== -1) {
      const obs = this.obstacles[idx];
      if (this.obstacleMeshes[obs.id]) {
        this.scene.remove(this.obstacleMeshes[obs.id]);
        delete this.obstacleMeshes[obs.id];
      }
      this.obstacles.splice(idx, 1);
      return true;
    }
    return false;
  }

  clearAll() {
    for (const obs of this.obstacles) {
      if (this.obstacleMeshes[obs.id]) {
        this.scene.remove(this.obstacleMeshes[obs.id]);
        delete this.obstacleMeshes[obs.id];
      }
    }
    this.obstacles = [];
    this.obstacleMeshes = {};
  }

  _createMesh(obstacle) {
    const typeDef = OBSTACLE_TYPES[obstacle.type];
    if (!typeDef) return;

    let geometry, material, mesh;

    switch (obstacle.type) {
      case 'wall':
        geometry = new THREE.BoxGeometry(typeDef.width, typeDef.height, typeDef.depth);
        material = new THREE.MeshStandardMaterial({ color: typeDef.color });
        mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        break;

      case 'tower':
        geometry = new THREE.BoxGeometry(typeDef.width, typeDef.height, typeDef.depth);
        material = new THREE.MeshStandardMaterial({ color: typeDef.color });
        mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        break;

      case 'hoop':
        const torusGeometry = new THREE.TorusGeometry(typeDef.outerRadius, typeDef.innerRadius, 16, 48);
        material = new THREE.MeshStandardMaterial({ color: typeDef.color });
        mesh = new THREE.Mesh(torusGeometry, material);
        mesh.castShadow = true;
        break;

      case 'cone':
        geometry = new THREE.ConeGeometry(typeDef.radius, typeDef.height, 32);
        material = new THREE.MeshStandardMaterial({ color: typeDef.color });
        mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        break;

      default:
        return;
    }

    mesh.position.copy(obstacle.position);
    mesh.rotation.copy(obstacle.rotation);
    mesh.scale.copy(obstacle.scale);

    mesh.userData = {
      type: 'obstacle',
      obstacleId: obstacle.id,
      obstacleType: obstacle.type
    };

    this.scene.add(mesh);
    this.obstacleMeshes[obstacle.id] = mesh;
    return mesh;
  }

  updateObstacle(id, updates) {
    const obstacle = this.obstacles.find(o => o.id === id);
    if (!obstacle) return false;

    if (updates.position) {
      obstacle.position.set(...updates.position);
    }
    if (updates.rotation) {
      obstacle.rotation.set(...updates.rotation);
    }
    if (updates.scale) {
      obstacle.scale.set(...updates.scale);
    }

    const mesh = this.obstacleMeshes[id];
    if (mesh) {
      mesh.position.copy(obstacle.position);
      mesh.rotation.copy(obstacle.rotation);
      mesh.scale.copy(obstacle.scale);
    }

    return true;
  }

  getObstacles() {
    return this.obstacles.map(obs => ({
      ...obs,
      position: [obs.position.x, obs.position.y, obs.position.z],
      rotation: [obs.rotation.x, obs.rotation.y, obs.rotation.z],
      scale: [obs.scale.x, obs.scale.y, obs.scale.z]
    }));
  }

  checkCollision(position, droneSize = 0.1) {
    if (!this.collisionEnabled) return null;

    const droneBox = new THREE.Box3(
      new THREE.Vector3(-droneSize/2, -droneSize/2, -droneSize/2),
      new THREE.Vector3(droneSize/2, droneSize/2, droneSize/2)
    );
    droneBox.translate(position);

    for (const obstacle of this.obstacles) {
      const mesh = this.obstacleMeshes[obstacle.id];
      if (!mesh || !mesh.geometry) continue;

      const obsBox = new THREE.Box3().setFromObject(mesh);
      
      if (droneBox.intersectsBox(obsBox)) {
        return {
          obstacle: obstacle,
          distance: position.distanceTo(obstacle.position),
          normal: position.clone().sub(obstacle.position).normalize()
        };
      }
    }

    return null;
  }

  getObstacleMeshes() {
    return Object.values(this.obstacleMeshes);
  }

  setCollisionEnabled(enabled) {
    this.collisionEnabled = enabled;
  }

  exportObstacles() {
    return this.getObstacles();
  }

  getBoundary() {
    return { ...this.boundary };
  }

  setBoundary(bounds) {
    if (bounds) this.boundary = { ...this.boundary, ...bounds };
    return this.boundary;
  }

  ensureWithinBoundary(defs) {
    const b = this.boundary;
    const accepted = [];
    const rejected = [];
    for (const def of defs || []) {
      let pos = def && def.position;
      let x, y, z;
      if (Array.isArray(pos)) {
        x = Number(pos[0]);
        y = Number(pos[1]);
        z = Number(pos[2]);
      } else if (pos && typeof pos === 'object') {
        x = Number(pos.x);
        y = Number(pos.y);
        z = Number(pos.z);
      } else {
        x = 0;
        y = 0;
        z = 0;
      }
      const inside = Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)
        && x >= b.minX && x <= b.maxX
        && z >= b.minZ && z <= b.maxZ
        && y >= 0 && y <= b.maxY;
      if (inside) accepted.push(def);
      else rejected.push(def);
    }
    return { accepted, rejected };
  }

  getRejectedCount() {
    return this.rejectedCount;
  }

  importObstacles(obstacles) {
    this.clearAll();
    const { accepted, rejected } = this.ensureWithinBoundary(obstacles || []);
    this.rejectedCount = rejected.length;
    for (const def of accepted) {
      this.addObstacle(def);
    }
    return this.obstacles;
  }
}
