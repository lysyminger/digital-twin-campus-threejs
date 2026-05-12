/* ============================================================
   运动设施：操场跑道 / 看台 / 篮球场 / 足球场
   依赖：core.js（layerGroups, interactables, overlayMat）
   ============================================================ */

// ===== 操场（南北长轴的椭圆跑道 + 内场） =====
function createTrack() {
  const group = new THREE.Group();
  const cx = 315, cz = -25;

  const trackShape = new THREE.Shape();
  trackShape.absellipse(0, 0, 40, 60, 0, Math.PI * 2, false, 0);
  const hole = new THREE.Path();
  hole.absellipse(0, 0, 30, 50, 0, Math.PI * 2, true, 0);
  trackShape.holes.push(hole);
  const trackGeo = new THREE.ExtrudeGeometry(trackShape, { depth: 0.04, bevelEnabled: false });
  trackGeo.rotateX(-Math.PI / 2);
  const track = new THREE.Mesh(trackGeo, overlayMat(0xc94d3a, 3));
  track.position.set(cx, 0.10, cz);
  track.receiveShadow = true;
  group.add(track);

  const fieldShape = new THREE.Shape();
  fieldShape.absellipse(0, 0, 30, 50, 0, Math.PI * 2);
  const fieldGeo = new THREE.ShapeGeometry(fieldShape);
  fieldGeo.rotateX(-Math.PI / 2);
  const field = new THREE.Mesh(fieldGeo, overlayMat(0x4a7a3a, 4));
  field.position.set(cx, 0.12, cz);
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
  const baseX = 270, baseZ = -25;
  const mat = new THREE.MeshStandardMaterial({ color: 0xb8b8b0, roughness: 0.85 });

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
  const courtMat = overlayMat(0x3a6f9a, 3);
  const lineMat  = new THREE.LineBasicMaterial({ color: 0xffffff });

  positions.forEach(([cx, cz]) => {
    const court = new THREE.Mesh(new THREE.PlaneGeometry(28, 15), courtMat);
    court.rotation.x = -Math.PI / 2;
    court.position.set(cx, 0.06, cz);
    court.receiveShadow = true;
    group.add(court);

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(27, 14)),
      lineMat
    );
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(cx, 0.08, cz);
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
  const field = new THREE.Mesh(new THREE.PlaneGeometry(50, 30), overlayMat(0x4a7a3a, 3));
  field.rotation.x = -Math.PI / 2;
  field.position.set(cx, 0.06, cz);
  field.receiveShadow = true;
  group.add(field);

  const edge = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(50, 30)),
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );
  edge.rotation.x = -Math.PI / 2;
  edge.position.set(cx, 0.08, cz);
  group.add(edge);

  group.userData = {
    name: '小足球场',
    type: '运动设施',
    desc: '与篮球场连成的运动片区，校园内独立小型足球场。'
  };
  interactables.push(group);
  layerGroups.facilities.add(group);
}
