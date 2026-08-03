import * as THREE from 'three';

export class FlightTrail {
  constructor(scene) {
    this.scene = scene;
    this.points = [];
    this.maxPoints = 2000;

    this.lineGeo = new THREE.BufferGeometry();
    this.lineMat = new THREE.LineBasicMaterial({
      color: 0x58a6ff,
      linewidth: 2,
      transparent: true,
      opacity: 0.8
    });
    this.line = new THREE.Line(this.lineGeo, this.lineMat);
    scene.add(this.line);

    this.glowGeo = new THREE.SphereGeometry(0.04, 8, 8);
    this.glowMat = new THREE.MeshBasicMaterial({ color: 0x58a6ff, transparent: true, opacity: 0.4 });
    this.glow = new THREE.Mesh(this.glowGeo, this.glowMat);
    this.glow.visible = false;
    scene.add(this.glow);

    this.startMarker = this._createMarker(0x3fb950, 'Start');
    this.startMarker.visible = false;
    scene.add(this.startMarker);
  }

  _createMarker(color) {
    const geo = new THREE.SphereGeometry(0.06, 8, 8);
    const mat = new THREE.MeshBasicMaterial({ color });
    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  addPoint(pos) {
    this.points.push(pos.clone());
    if (this.points.length > this.maxPoints) this.points.shift();

    const positions = new Float32Array(this.points.length * 3);
    for (let i = 0; i < this.points.length; i++) {
      positions[i * 3] = this.points[i].x;
      positions[i * 3 + 1] = this.points[i].y;
      positions[i * 3 + 2] = this.points[i].z;
    }
    this.lineGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    this.lineGeo.computeBoundingSphere();

    this.glow.position.copy(pos);
    this.glow.visible = true;

    if (this.points.length === 1) {
      this.startMarker.position.copy(pos);
      this.startMarker.visible = true;
    }
  }

  setStaticPath(positions) {
    this.clear();
    if (positions.length === 0) return;

    this.startMarker.position.set(positions[0].x, positions[0].z, positions[0].y);
    this.startMarker.visible = true;

    const pts = positions.map(p => new THREE.Vector3(p.x, p.z, p.y));
    this.lineGeo.setFromPoints(pts);

    const end = positions[positions.length - 1];
    this.glow.position.set(end.x, end.z, end.y);
    this.glow.visible = true;
  }

  clear() {
    this.points = [];
    this.lineGeo.deleteAttribute('position');
    this.glow.visible = false;
    this.startMarker.visible = false;
  }
}
