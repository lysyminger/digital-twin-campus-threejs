/* ============================================================
   地形：地坪 / 路网 / 绿地
   依赖：core.js（layerGroups, interactables, overlayMat）
   ============================================================ */

// ===== 地坪 + 校园边界 =====
function createGround() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 700),
    new THREE.MeshStandardMaterial({ color: 0x9ab089, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  layerGroups.ground.add(ground);

  const boundary = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(900, 0.1, 650)),
    new THREE.LineBasicMaterial({ color: 0x78c8ff, transparent: true, opacity: 0.35 })
  );
  boundary.position.y = 0.2;
  layerGroups.ground.add(boundary);
}

// ===== 路网（10 条） =====
const ROAD_DATA = [
  { name: '南侧主路（沈半路/树人街）', points: [[-430, 250], [-160, 245], [80, 235], [320, 230]], width: 10 },
  { name: '东侧湖州街',               points: [[390, -260], [380, -100], [365, 80], [355, 230]], width: 12 },
  { name: '北侧学院路',               points: [[-280, -280], [-40, -270], [180, -265], [370, -250]], width: 10 },
  { name: '中央东西主路',             points: [[-230, 0], [-80, 5], [40, 0], [170, -5], [300, 0]], width: 7 },
  { name: '南门中轴路',               points: [[-40, 230], [-35, 170], [-20, 110], [0, 35]], width: 6 },
  { name: '东部运动区环路',           points: [[150, -90], [310, -90], [330, 40], [280, 120], [180, 90], [150, -20]], width: 6 },
  { name: '西部教学区支路',           points: [[-210, -140], [-180, -60], [-120, -25], [-60, -10]], width: 5 },
  { name: '行政生活区支路',           points: [[110, 40], [140, 120], [220, 170], [285, 170]], width: 5 },
  { name: '体育馆-操场连接小路',      points: [[285, -105], [305, -95], [315, -88]], width: 3 },
  { name: '球场-宿舍通路',            points: [[210, -80], [240, -100], [290, -115], [345, -120], [380, -170]], width: 5 }
];

function createRoads() {
  const mat = overlayMat(0x4a4a4a, 2);

  ROAD_DATA.forEach(road => {
    const group = new THREE.Group();

    for (let i = 0; i < road.points.length - 1; i++) {
      const [x1, z1] = road.points[i];
      const [x2, z2] = road.points[i + 1];
      const dx = x2 - x1, dz = z2 - z1;
      const len = Math.hypot(dx, dz);

      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(len, 0.04, road.width),
        mat
      );
      seg.position.set((x1 + x2) / 2, 0.05, (z1 + z2) / 2);
      seg.rotation.y = -Math.atan2(dz, dx);
      seg.receiveShadow = true;
      group.add(seg);

      if (i > 0) {
        const join = new THREE.Mesh(
          new THREE.CylinderGeometry(road.width / 2, road.width / 2, 0.04, 16),
          mat
        );
        join.position.set(x1, 0.05, z1);
        join.receiveShadow = true;
        group.add(join);
      }
    }

    group.userData = {
      name: road.name,
      type: '道路',
      desc: `${road.name}，路宽 ${road.width} m。`,
      points: road.points,
      width: road.width
    };
    layerGroups.roads.add(group);
    interactables.push(group);
  });
}

// ===== 绿地（v0.4 再补树木） =====
function createGreenAreas() {
  const mat = overlayMat(0x6a9a5a, 1);
  const list = [
    { name: '中央广场草坪',   geom: new THREE.CircleGeometry(22, 32), x:   0, z:    5 },
    { name: '教学区中央绿地', geom: new THREE.PlaneGeometry(80, 40),   x: -90, z:   50 },
    { name: '南门花园',       geom: new THREE.PlaneGeometry(80, 30),   x: -30, z:  200 },
    { name: '行政区绿带',     geom: new THREE.PlaneGeometry(60, 30),   x: 170, z:   80 },
    { name: '东北外缘绿地',   geom: new THREE.PlaneGeometry(100, 60),  x: 340, z: -200 }
  ];
  list.forEach(({ name, geom, x, z }) => {
    const m = new THREE.Mesh(geom, mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.03, z);
    m.receiveShadow = true;
    m.userData = { name, type: '绿地', desc: '粗粒度绿化区，v0.4 将散布树木与花坛。' };
    layerGroups.vegetation.add(m);
    interactables.push(m);
  });
}
