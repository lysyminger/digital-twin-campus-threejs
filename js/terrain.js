/* ============================================================
   地形：地坪 / 路网（ribbon mesh + 沥青纹理）/ 绿地
   依赖：core.js（layerGroups, interactables, overlayMat）
   ============================================================ */

// ===== 道路数据（来自 CAMPUS_DATA.md 第 8 节，坐标不可修改） =====
const CAMPUS_ROADS = [
  { id: "ROAD-WEST-OUTER", name: "西侧外部主路", type: "outer", width: 12,
    points: [[-365,-360],[-345,-260],[-330,-170],[-315,-80],[-300,20],[-285,120],[-270,260]] },
  { id: "ROAD-EAST-OUTER", name: "东侧外部主路", type: "outer", width: 12,
    points: [[410,-360],[375,-260],[350,-170],[325,-80],[300,20],[275,120],[250,260]] },
  { id: "ROAD-NORTH-MAIN", name: "北侧横向主路", type: "main", width: 8,
    points: [[-330,-125],[-230,-120],[-150,-118],[-60,-115],[40,-112],[135,-108],[235,-103],[320,-95]] },
  { id: "ROAD-CENTER-EW", name: "校园中央东西向主路", type: "main", width: 7,
    points: [[-245,-12],[-175,-10],[-105,-8],[-35,-6],[45,-5],[115,-4],[190,-2],[260,2],[330,10]] },
  { id: "ROAD-SOUTH-EW", name: "南侧校内环路", type: "main", width: 7,
    points: [[-210,95],[-120,95],[-40,98],[45,100],[125,102],[210,105],[285,120],[325,145]] },
  { id: "ROAD-SOUTH-AXIS", name: "南门中轴道路", type: "main", width: 8,
    points: [[-2,225],[-2,185],[-2,145],[-2,105],[-2,76]] },
  { id: "ROAD-SOUTH-LOOP", name: "南侧教学区环路", type: "loop", width: 6,
    points: [[-85,215],[85,215],[85,120],[40,102],[-40,102],[-85,120],[-85,215]] },
  { id: "ROAD-CENTER-GARDEN-LOOP", name: "中心花园小环路", type: "loop", width: 5,
    points: [[-38,115],[38,115],[48,150],[30,175],[-30,175],[-48,150],[-38,115]] },
  { id: "ROAD-LIBRARY-WEST", name: "图书馆西侧道路", type: "branch", width: 5,
    points: [[-70,90],[-70,40],[-105,15],[-150,10],[-190,15]] },
  { id: "ROAD-WEST-EDU-LOOP", name: "西侧教学楼环路", type: "loop", width: 5,
    points: [[-220,-65],[-135,-65],[-115,-25],[-120,25],[-170,45],[-220,25],[-220,-65]] },
  { id: "ROAD-EAST-TEACHING-LOOP", name: "9号楼与12号楼环路", type: "loop", width: 6,
    points: [[40,-165],[145,-165],[150,-120],[125,-95],[55,-95],[35,-120],[40,-165]] },
  { id: "ROAD-STADIUM-WEST", name: "体育馆西侧南北路", type: "main", width: 7,
    points: [[170,-275],[170,-235],[170,-190],[170,-145],[170,-105],[170,-55],[170,-5]] },
  { id: "ROAD-STADIUM-LOOP", name: "体育馆与操场环路", type: "loop", width: 6,
    points: [[175,-275],[245,-285],[335,-280],[365,-230],[350,-165],[300,-140],[230,-145],[185,-175],[175,-275]] },
  { id: "ROAD-EAST-LIFE-LOOP", name: "东侧生活区环路", type: "loop", width: 6,
    points: [[205,-60],[285,-55],[315,-25],[320,35],[300,75],[250,85],[205,55],[205,-60]] },
  { id: "ROAD-ADMIN-CONNECTOR", name: "行政区连接路", type: "branch", width: 5,
    points: [[105,-30],[115,5],[160,10],[210,8],[250,5]] },
  { id: "ROAD-NORTH-GATE-CONNECTOR", name: "北校区南门连接路", type: "branch", width: 5,
    points: [[148,-80],[148,-105],[150,-135],[160,-165]] },

  // 南校区教学组团补充道路
  { id: "ROAD-SOUTH-ROUNDABOUT", name: "南校区中轴环岛", type: "loop", width: 4,
    points: (function() {
      var cx = -2, cz = 158, rx = 16, rz = 12, pts = [];
      for (var i = 0; i <= 16; i++) {
        var a = (i / 16) * Math.PI * 2;
        pts.push([cx + Math.cos(a) * rx, cz + Math.sin(a) * rz]);
      }
      return pts;
    })() },
  { id: "ROAD-SOUTH-EAST-WALK", name: "教学区东侧步道", type: "branch", width: 3,
    points: [[85,175],[85,155],[85,135],[85,110]] },
  { id: "ROAD-SOUTH-WEST-WALK", name: "教学区西侧步道", type: "branch", width: 3,
    points: [[-85,175],[-85,155],[-85,135],[-85,110]] },
  { id: "ROAD-SOUTH-CROSS-UPPER", name: "教学区北侧横向步道", type: "branch", width: 3,
    points: [[-75,110],[-40,108],[0,105],[40,108],[75,110]] },
  { id: "ROAD-SOUTH-CROSS-MID", name: "教学区中部横向步道", type: "branch", width: 3,
    points: [[-85,158],[-50,158],[-18,158],[14,158],[50,158],[85,158]] },
  { id: "ROAD-GARDEN-INNER-NS", name: "中央花园南北步道", type: "branch", width: 2,
    points: [[-2,175],[-2,155],[-2,135],[-2,118]] },
  { id: "ROAD-GARDEN-INNER-EW", name: "中央花园东西步道", type: "branch", width: 2,
    points: [[-30,145],[0,145],[30,145]] }
];

// ===== 程序化沥青纹理 =====
function createAsphaltTexture() {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  // 深灰沥青底色
  ctx.fillStyle = '#3a3e42';
  ctx.fillRect(0, 0, size, size);

  // 沥青颗粒噪点
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * 30;
    data[i]     = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }
  ctx.putImageData(imgData, 0, 0);

  // 随机小裂纹
  ctx.strokeStyle = 'rgba(30, 30, 30, 0.3)';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < 15; i++) {
    const sx = Math.random() * size, sy = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx + (Math.random() - 0.5) * 40, sy + (Math.random() - 0.5) * 40);
    ctx.stroke();
  }

  // 浅色碎石点
  ctx.fillStyle = 'rgba(100, 100, 95, 0.4)';
  for (let i = 0; i < 80; i++) {
    const r = 0.5 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(Math.random() * size, Math.random() * size, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

// 沥青材质（带纹理）
function createAsphaltMaterial() {
  const tex = createAsphaltTexture();
  return new THREE.MeshStandardMaterial({
    map: tex,
    color: 0x4a4e52,
    roughness: 0.92,
    metalness: 0.0,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    polygonOffsetUnits: -2
  });
}

// ===== 道路工具函数 =====
function roadNormal(p1, p2) {
  const dx = p2[0] - p1[0], dz = p2[1] - p1[1];
  const len = Math.hypot(dx, dz);
  return [-dz / len, dx / len];
}

function cornerNormal(prev, curr, next) {
  const [n1x, n1z] = roadNormal(prev, curr);
  const [n2x, n2z] = roadNormal(curr, next);
  let bx = n1x + n2x, bz = n1z + n2z;
  const bl = Math.hypot(bx, bz);
  if (bl < 0.01) return [n1x, n1z];
  bx /= bl; bz /= bl;
  const dot = n1x * bx + n1z * bz;
  const miter = Math.min(1 / Math.max(dot, 0.3), 2.5);
  return [bx * miter, bz * miter];
}

// 生成道路条带（ribbon mesh + UV 坐标）
function createRoadStrip(points, width, mat, yVal) {
  const hw = width / 2, n = points.length, y = yVal || 0.02;
  const pos = [], uvs = [], idx = [];

  // 累计路程用于 UV.v
  let totalDist = 0;
  const dists = [0];
  for (let i = 1; i < n; i++) {
    totalDist += Math.hypot(points[i][0] - points[i-1][0], points[i][1] - points[i-1][1]);
    dists.push(totalDist);
  }

  for (let i = 0; i < n; i++) {
    let nx, nz;
    if (i === 0) [nx, nz] = roadNormal(points[0], points[1]);
    else if (i === n - 1) [nx, nz] = roadNormal(points[n - 2], points[n - 1]);
    else [nx, nz] = cornerNormal(points[i - 1], points[i], points[i + 1]);
    const [px, pz] = points[i];
    pos.push(px + nx * hw, y, pz + nz * hw);
    pos.push(px - nx * hw, y, pz - nz * hw);

    // UV：u=0 左侧, u=1 右侧; v 按路程比例（每 10m 重复一次纹理）
    const v = dists[i] / 10;
    uvs.push(0, v);
    uvs.push(1, v);
  }
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2, b = a + 1, c = a + 2, d = a + 3;
    idx.push(a, c, b, b, c, d);
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, mat);
  mesh.receiveShadow = true;
  return mesh;
}

// 黄色虚线（道路中心线）
function createDashedCenterLine(points) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({ color: 0xd8c75a });

  for (let i = 0; i < points.length - 1; i++) {
    const [x1, z1] = points[i], [x2, z2] = points[i + 1];
    const dx = x2 - x1, dz = z2 - z1;
    const segLen = Math.hypot(dx, dz);
    const ux = dx / segLen, uz = dz / segLen;
    const angle = Math.atan2(dz, dx);
    let d = 1;
    while (d + 2 <= segLen) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(2, 0.005, 0.2), mat);
      dash.position.set(x1 + ux * (d + 1), 0.03, z1 + uz * (d + 1));
      dash.rotation.y = -angle;
      group.add(dash);
      d += 4;
    }
  }
  return group;
}

// 白色边线（ribbon 条带，更粗更明显）
function createRoadEdgeLines(points, width) {
  const group = new THREE.Group();
  const edgeMat = new THREE.MeshBasicMaterial({ color: 0xeeeeee });
  const n = points.length, hw = width / 2;

  [-1, 1].forEach(side => {
    const edgePts = [];
    for (let i = 0; i < n; i++) {
      let nx, nz;
      if (i === 0) [nx, nz] = roadNormal(points[0], points[1]);
      else if (i === n - 1) [nx, nz] = roadNormal(points[n - 2], points[n - 1]);
      else [nx, nz] = cornerNormal(points[i - 1], points[i], points[i + 1]);
      edgePts.push([points[i][0] + nx * hw * side, points[i][1] + nz * hw * side]);
    }
    const strip = createRoadStrip(edgePts, 0.3, edgeMat, 0.03);
    group.add(strip);
  });
  return group;
}

// ===== 地坪 + 校园边界 =====
function createGround() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(1000, 800),
    new THREE.MeshStandardMaterial({ color: 0x9ab089, roughness: 0.95 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  layerGroups.ground.add(ground);

  const boundary = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(900, 0.1, 750)),
    new THREE.LineBasicMaterial({ color: 0x78c8ff, transparent: true, opacity: 0.35 })
  );
  boundary.position.y = 0.2;
  layerGroups.ground.add(boundary);
}

// ===== 路网主入口 =====
function createCampusRoads() {
  const asphaltMat = createAsphaltMaterial();

  CAMPUS_ROADS.forEach(road => {
    const group = new THREE.Group();
    group.add(createRoadStrip(road.points, road.width, asphaltMat));
    group.add(createDashedCenterLine(road.points));
    group.add(createRoadEdgeLines(road.points, road.width));

    group.userData = {
      name: road.name, type: '道路',
      desc: road.name + '，路宽 ' + road.width + ' m。',
      points: road.points, width: road.width
    };
    layerGroups.roads.add(group);
    interactables.push(group);
  });
}

// ===== 绿地 =====
function createGreenAreas() {
  const mat = overlayMat(0x6a9a5a, 1);
  const gardenMat = overlayMat(0x5d8f4e, 1);
  const list = [
    // 图书馆前广场草坪
    { name: '图书馆前广场草坪', geom: new THREE.PlaneGeometry(60, 25), x: -4, z: 58 },

    // 南门入口右侧大草坪（主轴与A1之间）
    { name: '南门右侧草坪', geom: new THREE.PlaneGeometry(48, 35), x: 35, z: 198 },
    // 南门入口左侧大草坪（主轴与A2之间）
    { name: '南门左侧草坪', geom: new THREE.PlaneGeometry(48, 35), x: -38, z: 198 },

    // A1与A3之间内庭草坪（右侧）
    { name: '东侧教学楼内庭草坪', geom: new THREE.PlaneGeometry(40, 24), x: 67, z: 161 },
    // A2与A4之间内庭草坪（左侧）
    { name: '西侧教学楼内庭草坪', geom: new THREE.PlaneGeometry(40, 24), x: -63, z: 161 },

    // 中央花园草坪（四块对称）
    { name: '中央花园草坪（右上）', geom: new THREE.PlaneGeometry(14, 12), x: 15, z: 138, color: gardenMat },
    { name: '中央花园草坪（左上）', geom: new THREE.PlaneGeometry(14, 12), x: -17, z: 138, color: gardenMat },
    { name: '中央花园草坪（右下）', geom: new THREE.PlaneGeometry(14, 12), x: 15, z: 153, color: gardenMat },
    { name: '中央花园草坪（左下）', geom: new THREE.PlaneGeometry(14, 12), x: -17, z: 153, color: gardenMat },

    // B1周边草坪（右上）
    { name: 'B1北侧草坪', geom: new THREE.PlaneGeometry(28, 10), x: 73, z: 85 },
    // B2周边草坪（左上）
    { name: 'B2北侧草坪', geom: new THREE.PlaneGeometry(28, 10), x: -71, z: 89 },

    // 环路外侧边缘草坪
    { name: '教学区东侧边缘绿地', geom: new THREE.PlaneGeometry(12, 90), x: 96, z: 160 },
    { name: '教学区西侧边缘绿地', geom: new THREE.PlaneGeometry(12, 90), x: -96, z: 160 },

    // A3/A4与B1/B2之间过渡草坪
    { name: '右侧过渡草坪', geom: new THREE.PlaneGeometry(30, 14), x: 70, z: 120 },
    { name: '左侧过渡草坪', geom: new THREE.PlaneGeometry(30, 14), x: -68, z: 120 },
  ];
  list.forEach(({ name, geom, x, z, color }) => {
    const m = new THREE.Mesh(geom, color || mat);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, 0.01, z);
    m.receiveShadow = true;
    m.userData = { name, type: '绿地', desc: '校园绿化区域。' };
    layerGroups.vegetation.add(m);
    interactables.push(m);
  });
}
