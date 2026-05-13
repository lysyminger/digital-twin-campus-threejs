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
    points: [[-210,95],[-150,70],[-80,45],[-20,42],[40,42],[100,50],[160,80],[210,105],[285,120],[325,145]] },
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
// polygonOffset factor -4 比沥青 (-2) 更强，避免人眼高度下远处贴地掠射 z-fighting
function createDashedCenterLine(points) {
  const group = new THREE.Group();
  const mat = new THREE.MeshBasicMaterial({
    color: 0xd8c75a,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4
  });

  for (let i = 0; i < points.length - 1; i++) {
    const [x1, z1] = points[i], [x2, z2] = points[i + 1];
    const dx = x2 - x1, dz = z2 - z1;
    const segLen = Math.hypot(dx, dz);
    const ux = dx / segLen, uz = dz / segLen;
    const angle = Math.atan2(dz, dx);
    let d = 1;
    while (d + 2 <= segLen) {
      const dash = new THREE.Mesh(new THREE.BoxGeometry(2, 0.005, 0.2), mat);
      dash.position.set(x1 + ux * (d + 1), 0.05, z1 + uz * (d + 1));
      dash.rotation.y = -angle;
      group.add(dash);
      d += 4;
    }
  }
  return group;
}

// 白色边线（ribbon 条带，更粗更明显）
// polygonOffset factor -4 同中心虚线，避免远处被沥青遮住
function createRoadEdgeLines(points, width) {
  const group = new THREE.Group();
  const edgeMat = new THREE.MeshBasicMaterial({
    color: 0xeeeeee,
    polygonOffset: true,
    polygonOffsetFactor: -4,
    polygonOffsetUnits: -4
  });
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
    const strip = createRoadStrip(edgePts, 0.3, edgeMat, 0.05);
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

// ===== 统一草坪数据（合并 terrain + vegetation 去重后） =====
const GRASS_DATA = [
  { id:2,  name:'南门右侧草坪',         type:'rect', x:46,  z:207, w:70, h:35, color:0x6a9a5a },
  { id:3,  name:'南门左侧草坪',         type:'rect', x:-47, z:209, w:70, h:35, color:0x6a9a5a },
  { id:4,  name:'东侧教学楼内庭草坪',   type:'rect', x:62,  z:161, w:40, h:24, color:0x6a9a5a },
  { id:5,  name:'西侧教学楼内庭草坪',   type:'rect', x:-62, z:161, w:40, h:24, color:0x6a9a5a },
  { id:10, name:'B1北侧草坪',           type:'rect', x:73,  z:85,  w:28, h:10, color:0x6a9a5a },
  { id:11, name:'B2北侧草坪',           type:'rect', x:-71, z:89,  w:28, h:10, color:0x6a9a5a },
  { id:12, name:'教学区东侧边缘绿地',   type:'rect', x:96,  z:160, w:12, h:90, color:0x6a9a5a },
  { id:13, name:'教学区西侧边缘绿地',   type:'rect', x:-96, z:160, w:12, h:90, color:0x6a9a5a },
  { id:14, name:'右侧过渡草坪',         type:'rect', x:70,  z:120, w:30, h:14, color:0x6a9a5a },
  { id:15, name:'左侧过渡草坪',         type:'rect', x:-68, z:120, w:30, h:14, color:0x6a9a5a },
  { id:100, name:'图书馆东侧绿地',      type:'rect', x:132, z:40,  w:80, h:60, color:0x6a9a5a },
  { id:102, name:'体育馆周边绿地',      type:'rect', x:207, z:-159,w:60, h:80, color:0x6a9a5a },
  { id:103, name:'生活区绿地',          type:'rect', x:217, z:44,  w:60, h:60, color:0x6a9a5a },
  { id:104, name:'图书馆前草坪（左）',  type:'rect', x:-18, z:60,  w:30, h:20, color:0x6a9a5a },
  { id:105, name:'图书馆前草坪（右）',  type:'rect', x:17,  z:60,  w:30, h:20, color:0x6a9a5a },
  { id:106, name:'核心区草坪（左）',    type:'rect', x:-18, z:85,  w:30, h:20, color:0x6a9a5a },
  { id:107, name:'核心区草坪（右）',    type:'rect', x:17,  z:85,  w:30, h:20, color:0x6a9a5a },
  { id:108, name:'12号楼西侧绿地',     type:'rect', x:90,  z:-129,w:10, h:20, color:0x6a9a5a },
];
let _grassNextId = 100;
const greenMeshes = [];  // 与 GRASS_DATA 平行，供编辑器操作

// ===== 单块草坪 mesh 构建 =====
function buildGrassMesh(d) {
  var geom = (d.type === 'circle')
    ? new THREE.CircleGeometry(d.r || 20, 32)
    : new THREE.PlaneGeometry(d.w || 20, d.h || 20);
  var mat = new THREE.MeshStandardMaterial({
    color: d.color || 0x6a9a5a, roughness: 0.95,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1
  });
  var mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(d.x, 0.01, d.z);
  mesh.receiveShadow = true;
  mesh.userData = { name: d.name, type: '绿地', desc: '校园绿化区域。', _grassId: d.id };
  return mesh;
}

// ===== 绿地主入口 =====
function createGreenAreas() {
  GRASS_DATA.forEach(function(d) {
    var mesh = buildGrassMesh(d);
    greenMeshes.push(mesh);
    layerGroups.vegetation.add(mesh);
    interactables.push(mesh);
  });
}

// ===== 中央广场国旗杆 =====
function createFlagpole() {
  var group = new THREE.Group();
  var poleH = 18;  // 旗杆高 18m

  // 旗杆（银色金属圆柱）
  var poleMat = new THREE.MeshStandardMaterial({ color: 0xcccccc, roughness: 0.3, metalness: 0.7 });
  var pole = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, poleH, 8), poleMat);
  pole.position.y = poleH / 2;
  pole.castShadow = true;
  group.add(pole);

  // 旗杆底座（灰色圆台）
  var baseMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.6 });
  var base = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.0, 0.6, 12), baseMat);
  base.position.y = 0.3;
  base.castShadow = true;
  group.add(base);

  // 旗杆顶球
  var ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), poleMat);
  ball.position.y = poleH + 0.2;
  group.add(ball);

  // 国旗（红色长方形平面，略微有风飘动感）
  var flagW = 3.6, flagH = 2.4;
  var flagGeo = new THREE.PlaneGeometry(flagW, flagH, 8, 1);
  // 让旗面有轻微波浪
  var posAttr = flagGeo.attributes.position;
  for (var i = 0; i < posAttr.count; i++) {
    var fx = posAttr.getX(i);
    // 越远离旗杆，波浪越大
    var wave = Math.sin((fx / flagW) * Math.PI * 2) * 0.15 * ((fx + flagW / 2) / flagW);
    posAttr.setZ(i, wave);
  }
  posAttr.needsUpdate = true;
  flagGeo.computeVertexNormals();

  var flagMat = new THREE.MeshStandardMaterial({
    color: 0xde2910, roughness: 0.7, side: THREE.DoubleSide
  });
  var flag = new THREE.Mesh(flagGeo, flagMat);
  flag.position.set(flagW / 2 + 0.15, poleH - flagH / 2 - 0.3, 0);
  flag.castShadow = true;
  group.add(flag);

  // 放置在中央广场中心（四块草坪 104-107 的几何中心）
  group.position.set(0, 0, 72);
  group.userData = {
    name: '国旗杆', type: '设施',
    desc: '中央广场国旗杆，位于图书馆南侧广场中心。'
  };
  interactables.push(group);
  layerGroups.facilities.add(group);
}
