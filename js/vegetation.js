/* ============================================================
   植被与设施：树木 / 路灯
   依赖：core.js（layerGroups）
   ============================================================ */

// ===== 可编辑树木数据 =====
// 每棵树：[x, z, type]  type: 'broad'(阔叶) / 'cone'(针叶)
const TREE_DATA = [
];

// ===== 可编辑路灯数据 =====
// 每盏灯：[x, z]
// 沿主干道布点：南侧主路 / 中央东西主路 / 北侧学院路 / 南门中轴
const LAMP_DATA = [
  // 南侧主路 (Z ≈ 230)
  [-300, 230], [-100, 230], [ 100, 230], [ 300, 230],
  // 中央东西主路 (Z ≈ 0)
  [-220,   0], [ -90,   0], [  90,   0], [ 220,   0],
  // 北侧学院路 (Z ≈ -260)
  [-200, -260], [   0, -260], [ 200, -260],
  // 南门中轴路 (X ≈ -30 ~ 0)
  [ -30, 180], [ -15, 120], [   0,  60]
];

// ===== 单棵树 =====
function createTree(x, z, type) {
  const group = new THREE.Group();
  const trunkH = 2 + Math.random() * 2;

  const trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.35, trunkH, 6),
    new THREE.MeshStandardMaterial({ color: 0x5c3d1f, roughness: 0.9 })
  );
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  group.add(trunk);

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

// ===== 批量生成树木（从 TREE_DATA 读取） =====
function createTrees() {
  TREE_DATA.forEach(([x, z, type]) => {
    const tree = createTree(x, z, type);
    layerGroups.vegetation.add(tree);
  });
}

// ===== 单盏路灯 =====
function createStreetLamp(x, z) {
  const group = new THREE.Group();

  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 })
  );
  pole.position.y = 2.25;
  pole.castShadow = true;
  group.add(pole);

  // 灯头：发光球（emissive 由 updateTimeOfDay 在夜晚点亮）
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff2c8,
    emissive: 0x000000,
    emissiveIntensity: 0,
    roughness: 0.4
  });
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), bulbMat);
  head.position.y = 4.6;
  head.userData.isLampHead = true;
  group.add(head);

  // PointLight：暖黄色，照射半径 ~14m，白天 intensity=0
  const light = new THREE.PointLight(0xffcc66, 0, 14, 1.6);
  light.position.y = 4.6;
  group.add(light);

  group.position.set(x, 0, z);

  // 注册到日夜循环模块，由 updateTimeOfDay 统一控制
  if (typeof streetLamps !== 'undefined') {
    streetLamps.push({ light, bulbMat });
  }
  return group;
}

// ===== 批量生成路灯（从 LAMP_DATA 读取） =====
function createStreetLamps() {
  LAMP_DATA.forEach(([x, z]) => {
    const lamp = createStreetLamp(x, z);
    layerGroups.facilities.add(lamp);
  });
}
