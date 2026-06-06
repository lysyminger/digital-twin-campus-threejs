/* ============================================================
   运动设施：操场跑道 / 看台 / 篮球场
   坐标来自 CAMPUS_DATA.md（操场 298,-245 / 体育馆 195,-239 / 篮球场 109,-230）
   依赖：core.js（layerGroups, interactables, overlayMat）
   ============================================================ */

// ===== 操场（椭圆形跑道 + 8道白色分道线 + 方形足球草坪 + 场地标线） =====
function createTrack() {
  const group = new THREE.Group();
  const cx = 298, cz = -245;

  // 椭圆跑道参数
  var outerRx = 40, outerRz = 60;   // 外椭圆半径
  var laneCount = 8;
  var laneWidth = 1.25;
  var trackWidth = laneCount * laneWidth;  // 10m
  var innerRx = outerRx - trackWidth;      // 30
  var innerRz = outerRz - trackWidth;      // 50

  // 跑道环面（淡红色塑胶）
  var trackShape = new THREE.Shape();
  trackShape.absellipse(0, 0, outerRx, outerRz, 0, Math.PI * 2, false, 0);
  var hole = new THREE.Path();
  hole.absellipse(0, 0, innerRx, innerRz, 0, Math.PI * 2, true, 0);
  trackShape.holes.push(hole);
  var trackGeo = new THREE.ShapeGeometry(trackShape, 64);
  trackGeo.rotateX(-Math.PI / 2);
  var trackMesh = new THREE.Mesh(trackGeo, overlayMat(0xd4735e, 3)); // 淡红色
  trackMesh.position.set(cx, 0.10, cz);
  trackMesh.receiveShadow = true;
  group.add(trackMesh);

  // 白色分道线（9条椭圆环线：内沿 + 8道间隔线）
  var lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });
  for (var lane = 0; lane <= laneCount; lane++) {
    var rx = innerRx + lane * laneWidth;
    var rz = innerRz + lane * laneWidth;
    var pts = [];
    for (var i = 0; i <= 96; i++) {
      var a = (i / 96) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * rx, 0, Math.sin(a) * rz));
    }
    var lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
    var line = new THREE.Line(lineGeo, lineMat);
    line.position.set(cx, 0.13, cz);
    group.add(line);
  }

  // 内场方形足球草坪
  var fieldW = 48, fieldH = 72;  // 适配椭圆内部
  var fieldGeo = new THREE.PlaneGeometry(fieldW, fieldH);
  fieldGeo.rotateX(-Math.PI / 2);
  var field = new THREE.Mesh(fieldGeo, overlayMat(0x3d8c3a, 4));
  field.position.set(cx, 0.12, cz);
  field.receiveShadow = true;
  group.add(field);

  // 足球场白色标线
  var markMat = new THREE.LineBasicMaterial({ color: 0xffffff });
  var hw = fieldW / 2, hh = fieldH / 2;

  // 边界线
  var borderPts = [
    new THREE.Vector3(-hw, 0, -hh), new THREE.Vector3(hw, 0, -hh),
    new THREE.Vector3(hw, 0, hh), new THREE.Vector3(-hw, 0, hh),
    new THREE.Vector3(-hw, 0, -hh)
  ];
  group.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(borderPts), markMat).translateX(cx).translateZ(cz).translateY(0.14));

  // 中线
  var midLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints([
    new THREE.Vector3(-hw, 0, 0), new THREE.Vector3(hw, 0, 0)
  ]), markMat);
  midLine.position.set(cx, 0.14, cz);
  group.add(midLine);

  // 中圈
  var circPts = [];
  for (var i = 0; i <= 48; i++) {
    var a = (i / 48) * Math.PI * 2;
    circPts.push(new THREE.Vector3(Math.cos(a) * 7, 0, Math.sin(a) * 7));
  }
  var circLine = new THREE.Line(new THREE.BufferGeometry().setFromPoints(circPts), markMat);
  circLine.position.set(cx, 0.14, cz);
  group.add(circLine);

  // 罚球区（两端）
  [-1, 1].forEach(function(dir) {
    var penPts = [
      new THREE.Vector3(-12, 0, dir * hh),
      new THREE.Vector3(-12, 0, dir * (hh - 10)),
      new THREE.Vector3(12, 0, dir * (hh - 10)),
      new THREE.Vector3(12, 0, dir * hh)
    ];
    var pl = new THREE.Line(new THREE.BufferGeometry().setFromPoints(penPts), markMat);
    pl.position.set(cx, 0.14, cz);
    group.add(pl);
    // 小禁区
    var goalPts = [
      new THREE.Vector3(-4, 0, dir * hh),
      new THREE.Vector3(-4, 0, dir * (hh - 4)),
      new THREE.Vector3(4, 0, dir * (hh - 4)),
      new THREE.Vector3(4, 0, dir * hh)
    ];
    var gl = new THREE.Line(new THREE.BufferGeometry().setFromPoints(goalPts), markMat);
    gl.position.set(cx, 0.14, cz);
    group.add(gl);
  });

  group.userData = {
    name: '操场', type: '运动设施',
    desc: '椭圆形8道塑胶跑道（80m×120m），白色分道线，内设方形足球草坪含完整标线。'
  };
  interactables.push(group);
  layerGroups.facilities.add(group);
}

// ===== 主席台看台（操场西侧，与跑道等长约100m） =====
function createGrandstand() {
  const group = new THREE.Group();
  const baseX = 253, baseZ = -245;
  const standLength = 100; // 与跑道长轴接近
  const mat = new THREE.MeshStandardMaterial({ color: 0xb8b8b0, roughness: 0.85 });

  for (let i = 0; i < 4; i++) {
    const tier = new THREE.Mesh(new THREE.BoxGeometry(3, 1.2, standLength), mat);
    tier.position.set(baseX + 5 - i * 3, 0.6 + i * 1.2, baseZ);
    tier.castShadow = false;
    tier.receiveShadow = true;
    group.add(tier);
  }

  // 顶部遮阳棚
  const roofMat = new THREE.MeshStandardMaterial({ color: 0x556677, roughness: 0.6, metalness: 0.3 });
  const roof = new THREE.Mesh(new THREE.BoxGeometry(12, 0.3, standLength), roofMat);
  roof.position.set(baseX - 2, 5.5, baseZ);
  roof.castShadow = false;
  roof.receiveShadow = true;
  group.add(roof);

  // 支撑柱（每隔20m一根）
  const pillarMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.7 });
  for (let p = -2; p <= 2; p++) {
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5.5, 8), pillarMat);
    pillar.position.set(baseX - 4, 2.75, baseZ + p * 20);
    pillar.castShadow = false;
    group.add(pillar);
  }

  group.userData = {
    name: '主席台看台', type: '运动设施',
    desc: '操场西侧的混凝土阶梯看台（4级100m长），含遮阳顶棚。'
  };
  interactables.push(group);
  layerGroups.facilities.add(group);
}

// ===== 篮球场 / 网球场（×2） =====
function createBasketballCourts() {
  const group = new THREE.Group();
  const positions = [[109, -220], [109, -240]];
  const courtMat = overlayMat(0x3a6f9a, 3);
  const lineMat = new THREE.LineBasicMaterial({ color: 0xffffff });

  positions.forEach(([cx, cz]) => {
    const court = new THREE.Mesh(new THREE.PlaneGeometry(28, 15), courtMat);
    court.rotation.x = -Math.PI / 2;
    court.position.set(cx, 0.06, cz);
    court.receiveShadow = true;
    group.add(court);

    const edge = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.PlaneGeometry(27, 14)), lineMat
    );
    edge.rotation.x = -Math.PI / 2;
    edge.position.set(cx, 0.08, cz);
    group.add(edge);
  });

  group.userData = {
    name: '篮球场/网球场', type: '运动设施',
    desc: '体育馆西侧的运动场地。'
  };
  interactables.push(group);
  layerGroups.facilities.add(group);
}
