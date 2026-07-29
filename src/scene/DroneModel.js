import * as THREE from 'three';

const LED_COLORS = {
  off: 0x000000,
  red: 0xff0000,
  green: 0x00ff00,
  blue: 0x0066ff,
  yellow: 0xffff00,
  cyan: 0x00ffff,
  magenta: 0xff00ff,
  white: 0xffffff,
  purple: 0xaa00ff,
  orange: 0xff8800,
  pink: 0xff44aa
};

export function createDroneMesh() {
  const group = new THREE.Group();
  group.userData.leds = [];
  const SCALE = 0.1 / 0.28; // Scale from 0.28m to 0.1m (100mm = actual CoDrone EDU body width)

  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2d5aa0, roughness: 0.35, metalness: 0.4 });
  const darkMat = new THREE.MeshStandardMaterial({ color: 0x1a3a6a, roughness: 0.4, metalness: 0.5 });
  const blackMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.6 });
  const grayMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.3 });
  const motorMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.6 });
  const sensorMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.7 });
  const sensorRingMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4, metalness: 0.8 });

  const lowerGeo = new THREE.BoxGeometry(0.28, 0.035, 0.28);
  const lower = new THREE.Mesh(lowerGeo, bodyMat);
  lower.castShadow = true;
  lower.receiveShadow = true;
  group.add(lower);

  const upperGeo = new THREE.BoxGeometry(0.26, 0.04, 0.26);
  const upper = new THREE.Mesh(upperGeo, bodyMat);
  upper.position.y = 0.037;
  upper.castShadow = true;
  group.add(upper);

  const topGeo = new THREE.BoxGeometry(0.22, 0.012, 0.22);
  const topPlate = new THREE.Mesh(topGeo, darkMat);
  topPlate.position.y = 0.063;
  topPlate.castShadow = true;
  group.add(topPlate);

  const trimMat = new THREE.MeshStandardMaterial({ color: 0x1a2a4a, roughness: 0.5 });
  const trimGeo = new THREE.BoxGeometry(0.285, 0.004, 0.285);
  const trim = new THREE.Mesh(trimGeo, trimMat);
  trim.position.y = 0.018;
  group.add(trim);

  const lineMat = new THREE.MeshStandardMaterial({ color: 0x1a2a4a, roughness: 0.5 });
  for (let i = -1; i <= 1; i += 2) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.001, 0.002),
      lineMat
    );
    line.position.set(0, 0.064, i * 0.06);
    group.add(line);
    const line2 = new THREE.Mesh(
      new THREE.BoxGeometry(0.002, 0.001, 0.2),
      lineMat
    );
    line2.position.set(i * 0.06, 0.064, 0);
    group.add(line2);
  }

  const battGeo = new THREE.BoxGeometry(0.14, 0.025, 0.1);
  const battery = new THREE.Mesh(battGeo, blackMat);
  battery.position.set(0, 0.072, 0.01);
  battery.castShadow = true;
  group.add(battery);

  const labelGeo = new THREE.BoxGeometry(0.1, 0.003, 0.06);
  const labelMat = new THREE.MeshStandardMaterial({ color: 0x3fb950, roughness: 0.5 });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.set(0, 0.086, 0.01);
  group.add(label);

  const connGeo = new THREE.BoxGeometry(0.03, 0.008, 0.015);
  const conn = new THREE.Mesh(connGeo, new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.8 }));
  conn.position.set(0, 0.078, -0.04);
  group.add(conn);

  const armConfigs = [
    { x: 1, z: 1 },
    { x: -1, z: 1 },
    { x: 1, z: -1 },
    { x: -1, z: -1 }
  ];

  armConfigs.forEach(({ x, z }) => {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.022, 0.032),
      grayMat
    );
    arm.position.set(x * 0.18, 0, z * 0.18);
    arm.castShadow = true;
    group.add(arm);

    const brace = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.012, 0.018),
      grayMat
    );
    brace.position.set(x * 0.13, -0.012, z * 0.13);
    brace.rotation.y = Math.atan2(z, x);
    group.add(brace);

    const wireGeo = new THREE.BoxGeometry(0.16, 0.004, 0.006);
    const wireMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
    const wire = new THREE.Mesh(wireGeo, wireMat);
    wire.position.set(x * 0.17, 0.012, z * 0.17);
    wire.rotation.y = Math.atan2(z, x);
    group.add(wire);

    const mountGeo = new THREE.CylinderGeometry(0.052, 0.052, 0.008, 16);
    const mount = new THREE.Mesh(mountGeo, grayMat);
    mount.position.set(x * 0.28, 0.005, z * 0.28);
    group.add(mount);

    const motorGeo = new THREE.CylinderGeometry(0.042, 0.048, 0.032, 16);
    const motor = new THREE.Mesh(motorGeo, motorMat);
    motor.position.set(x * 0.28, 0.022, z * 0.28);
    motor.castShadow = true;
    group.add(motor);

    const capGeo = new THREE.CylinderGeometry(0.032, 0.042, 0.008, 16);
    const cap = new THREE.Mesh(capGeo, motorMat);
    cap.position.set(x * 0.28, 0.042, z * 0.28);
    group.add(cap);

    const shaftGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.015, 8);
    const shaftMat = new THREE.MeshStandardMaterial({ color: 0x888888, metalness: 0.9 });
    const shaft = new THREE.Mesh(shaftGeo, shaftMat);
    shaft.position.set(x * 0.28, 0.052, z * 0.28);
    group.add(shaft);

    const windingGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.015, 8);
    const windingMat = new THREE.MeshStandardMaterial({ color: 0xcc6600, roughness: 0.6, metalness: 0.4 });
    const winding = new THREE.Mesh(windingGeo, windingMat);
    winding.position.set(x * 0.28, 0.028, z * 0.28);
    group.add(winding);

    const hubGeo = new THREE.CylinderGeometry(0.012, 0.012, 0.008, 8);
    const hubMat = new THREE.MeshStandardMaterial({ color: 0x777777, metalness: 0.8 });
    const hub = new THREE.Mesh(hubGeo, hubMat);
    hub.position.set(x * 0.28, 0.056, z * 0.28);
    hub.userData.isPropeller = true;
    group.add(hub);

    for (let b = 0; b < 2; b++) {
      const bladeGroup = new THREE.Group();
      bladeGroup.position.set(x * 0.28, 0.058, z * 0.28);

      const bladeGeo = new THREE.BoxGeometry(0.22, 0.002, 0.018);
      const bladeMat = new THREE.MeshStandardMaterial({
        color: 0x888888, transparent: true, opacity: 0.45, roughness: 0.3
      });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.rotation.y = b * Math.PI / 2;
      blade.userData.isPropeller = true;
      bladeGroup.add(blade);

      const tipGeo = new THREE.BoxGeometry(0.04, 0.002, 0.012);
      const tip = new THREE.Mesh(tipGeo, bladeMat);
      tip.position.set(x * 0.1, 0, 0);
      tip.rotation.y = b * Math.PI / 2;
      tip.rotation.z = 0.1;
      tip.userData.isPropeller = true;
      bladeGroup.add(tip);

      group.add(bladeGroup);
    }

    const guardGeo = new THREE.TorusGeometry(0.14, 0.003, 6, 24);
    const guardMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5, metalness: 0.3 });
    const guard = new THREE.Mesh(guardGeo, guardMat);
    guard.rotation.x = Math.PI / 2;
    guard.position.set(x * 0.28, 0.05, z * 0.28);
    group.add(guard);

    const strutGeo = new THREE.CylinderGeometry(0.004, 0.004, 0.035, 6);
    const strutMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
    const strut = new THREE.Mesh(strutGeo, strutMat);
    strut.position.set(x * 0.22, -0.03, z * 0.22);
    group.add(strut);

    const footGeo = new THREE.CylinderGeometry(0.01, 0.014, 0.018, 8);
    const footMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.position.set(x * 0.22, -0.052, z * 0.22);
    group.add(foot);

    const skidGeo = new THREE.BoxGeometry(0.04, 0.004, 0.008);
    const skid = new THREE.Mesh(skidGeo, footMat);
    skid.position.set(x * 0.22, -0.062, z * 0.22);
    group.add(skid);
  });

  const ledGeo = new THREE.BoxGeometry(0.03, 0.008, 0.015);
  const defaultLedMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

  const frontLedPositions = [
    { x: -0.06, z: -0.145 },
    { x: 0.06, z: -0.145 }
  ];
  frontLedPositions.forEach(pos => {
    const mat = defaultLedMat.clone();
    const led = new THREE.Mesh(ledGeo, mat);
    led.position.set(pos.x, 0.01, pos.z);
    led.userData.isLed = true;
    led.userData.ledZone = 'front';
    group.add(led);
    group.userData.leds.push(led);

    const glow = new THREE.PointLight(0x000000, 0, 0.3);
    glow.position.set(pos.x, 0.02, pos.z - 0.02);
    led.userData.glow = glow;
    group.add(glow);
  });

  const backLedPositions = [
    { x: -0.06, z: 0.145 },
    { x: 0.06, z: 0.145 }
  ];
  backLedPositions.forEach(pos => {
    const mat = defaultLedMat.clone();
    const led = new THREE.Mesh(ledGeo, mat);
    led.position.set(pos.x, 0.01, pos.z);
    led.userData.isLed = true;
    led.userData.ledZone = 'back';
    group.add(led);
    group.userData.leds.push(led);

    const glow = new THREE.PointLight(0x000000, 0, 0.3);
    glow.position.set(pos.x, 0.02, pos.z + 0.02);
    led.userData.glow = glow;
    group.add(glow);
  });

  const sideLedPositions = [
    { x: -0.145, z: 0, zone: 'left' },
    { x: 0.145, z: 0, zone: 'right' }
  ];
  sideLedPositions.forEach(pos => {
    const mat = defaultLedMat.clone();
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.015, 0.008, 0.03),
      mat
    );
    led.position.set(pos.x, 0.01, pos.z);
    led.userData.isLed = true;
    led.userData.ledZone = pos.zone;
    group.add(led);
    group.userData.leds.push(led);

    const glow = new THREE.PointLight(0x000000, 0, 0.25);
    glow.position.set(pos.x * 1.1, 0.02, pos.z);
    led.userData.glow = glow;
    group.add(glow);
  });

  const bottomLedPositions = [
    { x: -0.08, z: -0.08 },
    { x: 0.08, z: -0.08 },
    { x: -0.08, z: 0.08 },
    { x: 0.08, z: 0.08 }
  ];
  bottomLedPositions.forEach(pos => {
    const mat = defaultLedMat.clone();
    const led = new THREE.Mesh(
      new THREE.BoxGeometry(0.02, 0.006, 0.02),
      mat
    );
    led.position.set(pos.x, -0.038, pos.z);
    led.userData.isLed = true;
    led.userData.ledZone = 'bottom';
    group.add(led);
    group.userData.leds.push(led);
  });

  const statusMat = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const statusLed = new THREE.Mesh(
    new THREE.SphereGeometry(0.005, 8, 8),
    statusMat
  );
  statusLed.position.set(0, 0.09, 0);
  group.add(statusLed);

  const rangeSensorGroup = new THREE.Group();
  rangeSensorGroup.position.set(0, -0.038, -0.04);

  const rangeBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.015, 0.04),
    sensorMat
  );
  rangeSensorGroup.add(rangeBody);

  for (let side = -1; side <= 1; side += 2) {
    const transGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.012, 12);
    const trans = new THREE.Mesh(transGeo, sensorRingMat);
    trans.position.set(side * 0.015, -0.01, 0);
    rangeSensorGroup.add(trans);

    const ringGeo = new THREE.TorusGeometry(0.01, 0.002, 8, 16);
    const ring = new THREE.Mesh(ringGeo, sensorRingMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(side * 0.015, -0.017, 0);
    rangeSensorGroup.add(ring);
  }

  rangeSensorGroup.userData.isSensor = true;
  rangeSensorGroup.userData.sensorType = 'range_bottom';
  group.add(rangeSensorGroup);

  const frontSensorGroup = new THREE.Group();
  frontSensorGroup.position.set(0, -0.005, -0.145);

  const frontSensorBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.03, 0.015),
    sensorMat
  );
  frontSensorGroup.add(frontSensorBody);

  const lensGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.01, 12);
  const lensMat = new THREE.MeshStandardMaterial({ color: 0x111133, roughness: 0.2, metalness: 0.9 });
  for (let side = -1; side <= 1; side += 2) {
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(side * 0.012, 0, -0.01);
    frontSensorGroup.add(lens);
  }

  frontSensorGroup.userData.isSensor = true;
  frontSensorGroup.userData.sensorType = 'range_front';
  group.add(frontSensorGroup);

  const colorSensorGroup = new THREE.Group();
  colorSensorGroup.position.set(0, -0.038, 0.04);

  const csBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.01, 12),
    sensorMat
  );
  colorSensorGroup.add(csBody);

  const windowMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.2, metalness: 0.5 });
  const windowGeo = new THREE.BoxGeometry(0.008, 0.003, 0.008);
  [
    { x: -0.005, z: -0.005 },
    { x: 0.005, z: -0.005 },
    { x: -0.005, z: 0.005 },
    { x: 0.005, z: 0.005 }
  ].forEach(pos => {
    const w = new THREE.Mesh(windowGeo, windowMat);
    w.position.set(pos.x, -0.007, pos.z);
    colorSensorGroup.add(w);
  });

  colorSensorGroup.userData.isSensor = true;
  colorSensorGroup.userData.sensorType = 'color';
  group.add(colorSensorGroup);

  const camGroup = new THREE.Group();
  camGroup.position.set(0, 0.01, -0.145);

  const camBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.03, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 })
  );
  camGroup.add(camBody);

  const camLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.01, 0.012, 12),
    new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.1, metalness: 0.9 })
  );
  camLens.rotation.x = Math.PI / 2;
  camLens.position.z = -0.015;
  camGroup.add(camLens);

  const lensRingGeo = new THREE.TorusGeometry(0.01, 0.002, 8, 16);
  const lensRing = new THREE.Mesh(lensRingGeo, sensorRingMat);
  lensRing.rotation.x = Math.PI / 2;
  lensRing.position.z = -0.015;
  camGroup.add(lensRing);

  const irDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.003, 8, 8),
    new THREE.MeshBasicMaterial({ color: 0x440000 })
  );
  irDot.position.set(0.012, 0, -0.015);
  camGroup.add(irDot);

  camGroup.userData.isSensor = true;
  camGroup.userData.sensorType = 'camera';
  group.add(camGroup);

  const antennaBaseMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
  const antennaMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.5 });

  const antennaBase = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.01, 0.015, 8),
    antennaBaseMat
  );
  antennaBase.position.set(0.08, 0.072, 0);
  group.add(antennaBase);

  const antennaPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.003, 0.004, 0.05, 8),
    antennaMat
  );
  antennaPole.position.set(0.08, 0.1, 0);
  group.add(antennaPole);

  for (let i = 0; i < 3; i++) {
    const seg = new THREE.Mesh(
      new THREE.CylinderGeometry(0.002, 0.003, 0.012, 6),
      antennaMat
    );
    seg.position.set(0.08, 0.108 + i * 0.015, 0);
    group.add(seg);
  }

  const antennaTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.005, 10, 10),
    new THREE.MeshStandardMaterial({ color: 0xf85149, roughness: 0.4 })
  );
  antennaTip.position.set(0.08, 0.135, 0);
  group.add(antennaTip);

  const frontArrowGeo = new THREE.ConeGeometry(0.04, 0.08, 3);
  const frontArrowMat = new THREE.MeshBasicMaterial({ color: 0xff4444 });
  const frontArrow = new THREE.Mesh(frontArrowGeo, frontArrowMat);
  frontArrow.position.set(0, 0.015, -0.17);
  frontArrow.rotation.x = Math.PI / 2;
  frontArrow.userData.isFrontIndicator = true;
  group.add(frontArrow);

  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(0,0,0,0)';
  ctx.fillRect(0, 0, 256, 64);
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ff4444';
  ctx.fillText('FRONT', 128, 32);
   const texture = new THREE.CanvasTexture(canvas);
   const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
   const sprite = new THREE.Sprite(spriteMat);
   sprite.scale.set(0.18 * SCALE, 0.045 * SCALE, 1);
   sprite.position.set(0, 0.08 * SCALE, -0.17 * SCALE);
   sprite.userData.isFrontIndicator = true;
   group.add(sprite);

  const ventMat = new THREE.MeshStandardMaterial({ color: 0x1a2a4a, roughness: 0.5 });
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 4; i++) {
      const vent = new THREE.Mesh(
        new THREE.BoxGeometry(0.002, 0.018, 0.025),
        ventMat
      );
      vent.position.set(side * 0.142, 0.005, -0.05 + i * 0.032);
      group.add(vent);
    }
  }

  const bottomLineMat = new THREE.MeshStandardMaterial({ color: 0x1a2a4a, roughness: 0.5 });
  for (let i = -1; i <= 1; i += 2) {
    const bline = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.001, 0.002),
      bottomLineMat
    );
    bline.position.set(0, -0.036, i * 0.05);
    group.add(bline);
  }

  const screwMat = new THREE.MeshStandardMaterial({ color: 0x666666, metalness: 0.8 });
  [
    { x: -0.1, z: -0.1 },
    { x: 0.1, z: -0.1 },
    { x: -0.1, z: 0.1 },
    { x: 0.1, z: 0.1 }
  ].forEach(pos => {
    const screw = new THREE.Mesh(
      new THREE.CylinderGeometry(0.004, 0.004, 0.002, 8),
      screwMat
    );
    screw.position.set(pos.x, -0.036, pos.z);
    group.add(screw);
   });

  group.scale.set(SCALE, SCALE, SCALE);

  return group;
}

export function setLedColor(group, colorName, zone = 'all') {
  const color = LED_COLORS[colorName] ?? LED_COLORS.off;
  if (!group.userData.leds) return;

  group.userData.leds.forEach(led => {
    if (zone === 'all' || led.userData.ledZone === zone) {
      led.material.color.setHex(color);
      if (led.userData.glow) {
        led.userData.glow.color.setHex(color);
        led.userData.glow.intensity = color === 0x000000 ? 0 : 0.8;
      }
    }
  });
}

export function setAllLeds(group, colorName) {
  setLedColor(group, colorName, 'all');
}
