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

  // === BODY ===
  // Main body shell
  const bodyGeo = new THREE.BoxGeometry(0.28, 0.07, 0.28);
  const bodyMat = new THREE.MeshStandardMaterial({ color: 0x2d5aa0, roughness: 0.35, metalness: 0.4 });
  const body = new THREE.Mesh(bodyGeo, bodyMat);
  body.castShadow = true;
  body.receiveShadow = true;
  group.add(body);

  // Top plate (flight controller cover)
  const topGeo = new THREE.BoxGeometry(0.22, 0.015, 0.22);
  const topMat = new THREE.MeshStandardMaterial({ color: 0x1a3a6a, roughness: 0.4, metalness: 0.5 });
  const topPlate = new THREE.Mesh(topGeo, topMat);
  topPlate.position.y = 0.042;
  topPlate.castShadow = true;
  group.add(topPlate);

  // Battery bump (center top)
  const battGeo = new THREE.BoxGeometry(0.14, 0.02, 0.1);
  const battMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });
  const battery = new THREE.Mesh(battGeo, battMat);
  battery.position.set(0, 0.058, 0.01);
  battery.castShadow = true;
  group.add(battery);

  // Battery label stripe
  const labelGeo = new THREE.BoxGeometry(0.1, 0.005, 0.06);
  const labelMat = new THREE.MeshStandardMaterial({ color: 0x3fb950, roughness: 0.5 });
  const label = new THREE.Mesh(labelGeo, labelMat);
  label.position.set(0, 0.07, 0.01);
  group.add(label);

  // === ARMS ===
  const armMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.5, metalness: 0.3 });
  const motorMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.4, metalness: 0.6 });

  const armConfigs = [
    { x: 1, z: 1, ledFront: true },
    { x: -1, z: 1, ledFront: true },
    { x: 1, z: -1, ledFront: false },
    { x: -1, z: -1, ledFront: false }
  ];

  armConfigs.forEach(({ x, z }) => {
    // Arm beam
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.025, 0.035),
      armMat
    );
    arm.position.set(x * 0.18, 0, z * 0.18);
    arm.castShadow = true;
    group.add(arm);

    // Arm brace (diagonal support)
    const brace = new THREE.Mesh(
      new THREE.BoxGeometry(0.08, 0.015, 0.02),
      armMat
    );
    brace.position.set(x * 0.12, -0.015, z * 0.12);
    brace.rotation.y = Math.atan2(z, x);
    group.add(brace);

    // Motor housing
    const motorGeo = new THREE.CylinderGeometry(0.045, 0.05, 0.035, 12);
    const motor = new THREE.Mesh(motorGeo, motorMat);
    motor.position.set(x * 0.28, 0.015, z * 0.28);
    motor.castShadow = true;
    group.add(motor);

    // Motor top cap
    const capGeo = new THREE.CylinderGeometry(0.035, 0.045, 0.01, 12);
    const cap = new THREE.Mesh(capGeo, motorMat);
    cap.position.set(x * 0.28, 0.035, z * 0.28);
    group.add(cap);

    // Propeller disc
    const propGeo = new THREE.CircleGeometry(0.13, 20);
    const propMat = new THREE.MeshStandardMaterial({
      color: 0x888888, side: THREE.DoubleSide, transparent: true, opacity: 0.35
    });
    const prop = new THREE.Mesh(propGeo, propMat);
    prop.rotation.x = -Math.PI / 2;
    prop.position.set(x * 0.28, 0.042, z * 0.28);
    prop.userData.isPropeller = true;
    prop.userData.axis = { x, z };
    group.add(prop);

    // Propeller blade hints (2 thin lines)
    for (let b = 0; b < 2; b++) {
      const bladeGeo = new THREE.BoxGeometry(0.24, 0.002, 0.015);
      const bladeMat = new THREE.MeshStandardMaterial({ color: 0x666666, transparent: true, opacity: 0.5 });
      const blade = new THREE.Mesh(bladeGeo, bladeMat);
      blade.position.set(x * 0.28, 0.044, z * 0.28);
      blade.rotation.y = b * Math.PI / 2;
      blade.userData.isPropeller = true;
      group.add(blade);
    }

    // Landing gear feet
    const footGeo = new THREE.CylinderGeometry(0.012, 0.015, 0.025, 6);
    const footMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.7 });
    const foot = new THREE.Mesh(footGeo, footMat);
    foot.position.set(x * 0.22, -0.045, z * 0.22);
    group.add(foot);
  });

  // === LED STRIPS ===
  const ledGeo = new THREE.BoxGeometry(0.03, 0.008, 0.015);
  const defaultLedMat = new THREE.MeshBasicMaterial({ color: 0x000000 });

  // Front LEDs (2 - left and right of front face)
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

  // Back LEDs (2 - left and right of back face)
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

  // Side LEDs (1 per side)
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

  // Bottom LEDs (4 - corners underneath)
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

  // === SENSORS ===
  // Bottom range sensor (ultrasonic - two circles)
  const sensorMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3, metalness: 0.7 });
  const sensorRingMat = new THREE.MeshStandardMaterial({ color: 0x666666, roughness: 0.4, metalness: 0.8 });

  const rangeSensorGroup = new THREE.Group();
  rangeSensorGroup.position.set(0, -0.038, -0.04);

  const rangeBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.06, 0.015, 0.04),
    sensorMat
  );
  rangeSensorGroup.add(rangeBody);

  // Two ultrasonic transducers
  for (let side = -1; side <= 1; side += 2) {
    const transGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.012, 10);
    const trans = new THREE.Mesh(transGeo, sensorRingMat);
    trans.position.set(side * 0.015, -0.01, 0);
    rangeSensorGroup.add(trans);

    const ringGeo = new THREE.TorusGeometry(0.01, 0.002, 6, 12);
    const ring = new THREE.Mesh(ringGeo, sensorRingMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(side * 0.015, -0.017, 0);
    rangeSensorGroup.add(ring);
  }

  rangeSensorGroup.userData.isSensor = true;
  rangeSensorGroup.userData.sensorType = 'range_bottom';
  group.add(rangeSensorGroup);

  // Front range sensor
  const frontSensorGroup = new THREE.Group();
  frontSensorGroup.position.set(0, -0.005, -0.145);

  const frontSensorBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.05, 0.03, 0.015),
    sensorMat
  );
  frontSensorGroup.add(frontSensorBody);

  // Front sensor lens
  const lensGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.01, 8);
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

  // Color sensor (bottom center)
  const colorSensorGroup = new THREE.Group();
  colorSensorGroup.position.set(0, -0.038, 0.04);

  const csBody = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 0.01, 10),
    sensorMat
  );
  colorSensorGroup.add(csBody);

  // Color sensor window (4 small quadrants)
  const windowMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.2, metalness: 0.5 });
  const windowGeo = new THREE.BoxGeometry(0.008, 0.003, 0.008);
  const windowPositions = [
    { x: -0.005, z: -0.005 },
    { x: 0.005, z: -0.005 },
    { x: -0.005, z: 0.005 },
    { x: 0.005, z: 0.005 }
  ];
  windowPositions.forEach(pos => {
    const w = new THREE.Mesh(windowGeo, windowMat);
    w.position.set(pos.x, -0.007, pos.z);
    colorSensorGroup.add(w);
  });

  colorSensorGroup.userData.isSensor = true;
  colorSensorGroup.userData.sensorType = 'color';
  group.add(colorSensorGroup);

  // === CAMERA ===
  const camGroup = new THREE.Group();
  camGroup.position.set(0, 0.01, -0.145);

  const camBody = new THREE.Mesh(
    new THREE.BoxGeometry(0.04, 0.03, 0.02),
    new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.3 })
  );
  camGroup.add(camBody);

  const camLens = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.01, 0.012, 10),
    new THREE.MeshStandardMaterial({ color: 0x111122, roughness: 0.1, metalness: 0.9 })
  );
  camLens.rotation.x = Math.PI / 2;
  camLens.position.z = -0.015;
  camGroup.add(camLens);

  // Camera IR dot
  const irDot = new THREE.Mesh(
    new THREE.SphereGeometry(0.003, 6, 6),
    new THREE.MeshBasicMaterial({ color: 0x440000 })
  );
  irDot.position.set(0.012, 0, -0.015);
  camGroup.add(irDot);

  camGroup.userData.isSensor = true;
  camGroup.userData.sensorType = 'camera';
  group.add(camGroup);

  // === ANTENNA ===
  const antennaMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.6 });

  const antennaPole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.004, 0.004, 0.06, 6),
    antennaMat
  );
  antennaPole.position.set(0.08, 0.09, 0);
  group.add(antennaPole);

  const antennaTip = new THREE.Mesh(
    new THREE.SphereGeometry(0.006, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xf85149, roughness: 0.4 })
  );
  antennaTip.position.set(0.08, 0.12, 0);
  group.add(antennaTip);

  // === FRONT INDICATOR (direction marker) ===
  const frontGeo = new THREE.ConeGeometry(0.025, 0.05, 4);
  const frontMat = new THREE.MeshBasicMaterial({ color: 0x3fb950 });
  const front = new THREE.Mesh(frontGeo, frontMat);
  front.position.set(0, 0.015, -0.155);
  front.rotation.x = Math.PI / 2;
  front.userData.isFrontIndicator = true;
  group.add(front);

  // === SIDE DECALS (Cooling vents) ===
  const ventMat = new THREE.MeshStandardMaterial({ color: 0x1a2a4a, roughness: 0.5 });
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < 3; i++) {
      const vent = new THREE.Mesh(
        new THREE.BoxGeometry(0.002, 0.02, 0.04),
        ventMat
      );
      vent.position.set(side * 0.142, 0.005, -0.04 + i * 0.04);
      group.add(vent);
    }
  }

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
