/* ============================================================
   植被与设施：树木 / 路灯 / 长椅
   依赖：core.js（layerGroups）
   ============================================================ */

// ===== 单棵树 =====
function createTree(x, z, type) {
  const group = new THREE.Group();
  const trunkH = 2 + Math.random() * 2;

  // 树干
  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.35, trunkH, 6),
    new THREE.MeshStandardMaterial({ color: 0x5c3d1f, roughness: 0.9 })
  );
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  group.add(trunk);

  // 树冠颜色（HSL 随机绿色）
  const hue = 0.27 + Math.random() * 0.05;
  const sat = 0.5 + Math.random() * 0.2;
  const lit = 0.3 + Math.random() * 0.15;
  const leafColor = new THREE.Color().setHSL(hue, sat, lit);
  const leafMat = new THREE.MeshStandardMaterial({ color: leafColor, roughness: 0.85 });

  if (type === 'cone') {
    const r = 1.5 + Math.random() * 1;
    const h = 3 + Math.random() * 2;
    const crown = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), leafMat);
    crown.position.y = trunkH + h / 2 - 0.5;
    crown.castShadow = true;
    group.add(crown);
  } else {
    const r = 2 + Math.random() * 1.5;
    const crown = new THREE.Mesh(new THREE.SphereGeometry(r, 8, 6), leafMat);
    crown.position.y = trunkH + r * 0.6;
    crown.castShadow = true;
    group.add(crown);
  }

  group.position.set(x, 0, z);
  return group;
}

// ===== 批量生成树木 =====
function createTrees() {
  const areas = [
    { x: 0, z: 5, r: 20, type: 'circle' },
    { x: -90, z: 50, w: 75, h: 35, type: 'rect' },
    { x: -2, z: 205, w: 65, h: 20, type: 'rect' },
    { x: 170, z: 80, w: 55, h: 25, type: 'rect' },
    { x: 340, z: -220, w: 75, h: 45, type: 'rect' },
    // 道路两侧零散树木
    { x: -200, z: 15, w: 20, h: 50, type: 'rect' },
    { x: 80, z: 50, w: 30, h: 30, type: 'rect' },
    { x: 200, z: 70, w: 40, h: 20, type: 'rect' }
  ];

  let count = 0;
  areas.forEach(area => {
    const n = area.type === 'circle' ? 12 : Math.floor((area.w * area.h) / 200);
    for (let i = 0; i < n && count < 90; i++) {
      let tx, tz;
      if (area.type === 'circle') {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * area.r * 0.85;
        tx = area.x + Math.cos(angle) * dist;
        tz = area.z + Math.sin(angle) * dist;
      } else {
        tx = area.x + (Math.random() - 0.5) * area.w;
        tz = area.z + (Math.random() - 0.5) * area.h;
      }
      const treeType = Math.random() > 0.5 ? 'broad' : 'cone';
      const tree = createTree(tx, tz, treeType);
      layerGroups.vegetation.add(tree);
      count++;
    }
  });
}

// ===== 单盏路灯 =====
function createStreetLamp(x, z) {
  const group = new THREE.Group();

  // 灯杆
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 })
  );
  pole.position.y = 2.25;
  pole.castShadow = true;
  group.add(pole);

  // 灯头
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 8, 6),
    new THREE.MeshStandardMaterial({ color: 0xffcc66, emissive: 0x000000, roughness: 0.5 })
  );
  head.position.y = 4.6;
  head.userData.isLampHead = true;
  group.add(head);

  // PointLight（默认关闭，v0.5 夜晚启用）
  const light = new THREE.PointLight(0xffcc66, 0, 12);
  light.position.y = 4.6;
  group.add(light);

  group.position.set(x, 0, z);
  return group;
}

// ===== 批量生成路灯 =====
function createStreetLamps() {
  const lampPositions = [];

  // 中央东西主路两侧
  for (let x = -200; x <= 280; x += 25) {
    lampPositions.push([x, -12 + 5]);
    lampPositions.push([x, -12 - 5]);
  }

  // 南门中轴路两侧
  for (let z = 80; z <= 220; z += 25) {
    lampPositions.push([-2 + 5, z]);
    lampPositions.push([-2 - 5, z]);
  }

  // 限制总数 ≤ 25
  const limited = lampPositions.slice(0, 25);

  limited.forEach(([x, z]) => {
    const lamp = createStreetLamp(x, z);
    layerGroups.facilities.add(lamp);
  });
}
