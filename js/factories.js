/* ============================================================
   场景工厂：地坪 / 路网 / 操场 / 看台 / 球场 / 绿地
   依赖：scene.js（layerGroups, interactables）
   ============================================================ */

// ===== 地坪 + 校园边界 =====
function createGround() {
  // 主体地坪：1000 × 700 浅灰绿（覆盖整个 900×650 校园再留余量）
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 700),
    new THREE.MeshStandardMaterial({ color: 0x9ab089, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  layerGroups.ground.add(ground);

  // 校园边界框：900×650，浅蓝细线
  const boundary = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(900, 0.1, 650)),
    new THREE.LineBasicMaterial({ color: 0x78c8ff, transparent: true, opacity: 0.35 })
  );
  boundary.position.y = 0.2;
  layerGroups.ground.add(boundary);
}

// ===== 路网（10 条） =====
// 数据与 CAMPUS_DATA.md 第 3 节同步；前 8 条为基础路网，后 2 条 v0.2 新增
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
  const mat = new THREE.MeshStandardMaterial({ color: 0x4a4a4a, roughness: 0.92 });

  ROAD_DATA.forEach(road => {
    const group = new THREE.Group();

    // 每对相邻关键点：扁平 Box 段 + 端点圆盘衔接
    for (let i = 0; i < road.points.length - 1; i++) {
      const [x1, z1] = road.points[i];
      const [x2, z2] = road.points[i + 1];
      const dx = x2 - x1, dz = z2 - z1;
      const len = Math.hypot(dx, dz);

      const seg = new THREE.Mesh(
        new THREE.BoxGeometry(len, 0.04, road.width),
        mat
      );
      seg.position.set((x1 + x2) / 2, 0.02, (z1 + z2) / 2);
      seg.rotation.y = -Math.atan2(dz, dx);
      seg.receiveShadow = true;
      group.add(seg);

      // 拐角圆盘（避免折线段断开缝隙）
      if (i > 0) {
        const join = new THREE.Mesh(
          new THREE.CylinderGeometry(road.width / 2, road.width / 2, 0.04, 16),
          mat
        );
        join.position.set(x1, 0.02, z1);
        join.receiveShadow = true;
        group.add(join);
      }
    }

    group.userData = {
      name: road.name,
      type: '道路',
      desc: `${road.name}，路宽 ${road.width} m。`,
      points: road.points,   // 小地图绘制要用
      width: road.width
    };
    layerGroups.roads.add(group);
    interactables.push(group);
  });
}

// ===== 操场（南北长轴的椭圆跑道 + 内场） =====
function createTrack() {
  const group = new THREE.Group();
  const cx = 315, cz = -25;
  // 长轴沿 Z（南北），短轴沿 X（东西）
  // 外椭圆 X 半轴 40，Z 半轴 60 → 整体 80（东西）× 120（南北）
  // 内椭圆 X 半轴 30，Z 半轴 50 → 整体 60 × 100

  const trackShape = new THREE.Shape();
  trackShape.absellipse(0, 0, 40, 60, 0, Math.PI * 2, false, 0);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, 30, 50, 0, Math.PI * 2, true, 0);
  trackShape.holes.push(hole);
  const trackGeo = new THREE.ExtrudeGeometry(trackShape, { depth: 0.04, bevelEnabled: false });
  trackGeo.rotateX(-Math.PI / 2);
  const track = new THREE.Mesh(
    trackGeo,
    new THREE.MeshStandardMaterial({ color: 0xc94d3a, roughness: 0.85 })
  );
  track.position.set(cx, 0.03, cz);
  track.receiveShadow = true;
  group.add(track);

  // 内场草坪（足球场）：椭圆 30 × 50（X × Z）
  const fieldShape = new THREE.Shape();
  fieldShape.absellipse(0, 0, 30, 50, 0, Math.PI * 2);
  const fieldGeo = new THREE.ShapeGeometry(fieldShape);
  fieldGeo.rotateX(-Math.PI / 2);
  const field = new THREE.Mesh(
    fieldGeo,
    new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.95 })
  );
  field.position.set(cx, 0.035, cz);
  field.receiveShadow = true;
  group.add(field);

  group.userData = {
    name: '操场',
    type: '运动设施',
    desc: '南北走向的椭圆塑胶跑道（80 m × 120 m），内场为足球草坪。东北运动区核心。'
  };
  interactables.push(group);
  layerGroups.facilities.add(group);
}

// ===== 主席台看台（操场西侧，朝东三级阶梯） =====
function createGrandstand() {
  const group = new THREE.Group();
  // 跑道西缘 x=275（操场中心 315 - X 半轴 40）；看台贴跑道往西延伸
  const baseX = 270, baseZ = -25;
  const mat = new THREE.MeshStandardMaterial({ color: 0xb8b8b0, roughness: 0.85 });

  // 3 级阶梯：i=0 最东最低（贴近跑道），i=2 最西最高
  for (let i = 0; i < 3; i++) {
    const tier = new THREE.Mesh(
      new THREE.BoxGeometry(3, 1, 25),
      mat
    );
    tier.position.set(baseX + 4 - i * 3, 0.5 + i * 1.0, baseZ);
    tier.castShadow = true;
    tier.receiveShadow = true;
    group.add(tier);
  }

  group.userData = {
    name: '主席台看台',
    type: '运动设施',
    desc: '操场西侧的混凝土阶梯看台，三级阶梯朝东，正对跑道与内场。'
  };
  interactables.push(group);
  layerGroups.facilities.add(group);
}

// ===== 篮球场（×2） =====
function createBasketballCourts() {
  const group = new THREE.Group();
  const positions = [[210, -95], [210, -75]];
  const courtMat = new THREE.MeshStandardMaterial({ color: 0x3a6f9a, roughness: 0.85 });
  const lineMat  = new THREE.LineBasicMaterial({ color: 0xffffff });

  positions.forEach(([cx, cz]) => {
    const court = new THREE.Mesh(new THREE.PlaneGeometry(28, 15), courtMat);
    court.rotation.x = -Math.PI / 2;
    court.position.set(cx, 0.025, cz);
    court.receiveShadow = true;
    group.add(court);

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(27, 14)),
      lineMat
    );
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(cx, 0.03, cz);
    group.add(edge);
  });

  group.userData = {
    name: '篮球场',
    type: '运动设施',
    desc: '体育馆西侧的两块标准篮球场。'
  };
  interactables.push(group);
  layerGroups.facilities.add(group);
}

// ===== 小足球场（独立） =====
function createFootballField() {
  const group = new THREE.Group();
  const cx = 170, cz = -85;
  const field = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 30),
    new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.95 })
  );
  field.rotation.x = -Math.PI / 2;
  field.position.set(cx, 0.022, cz);
  field.receiveShadow = true;
  group.add(field);

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(50, 30)),
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  edge.rotation.x = -Math.PI / 2;
  edge.position.set(cx, 0.026, cz);
  group.add(edge);

  group.userData = {
    name: '小足球场',
    type: '运动设施',
    desc: '与篮球场连成的运动片区，校园内独立小型足球场。'
  };
  interactables.push(group);
  layerGroups.facilities.add(group);
}

// ===== 简易绿地（v0.4 再补树木） =====
function createGreenAreas() {
  const mat = new THREE.MeshStandardMaterial({ color: 0x6a9a5a, roughness: 0.95 });
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
    m.position.set(x, 0.01, z);
    m.receiveShadow = true;
    m.userData = { name, type: '绿地', desc: '粗粒度绿化区，v0.4 将散布树木与花坛。' };
    layerGroups.vegetation.add(m);
    interactables.push(m);
  });
}
