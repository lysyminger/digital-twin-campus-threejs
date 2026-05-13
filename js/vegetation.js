/* ============================================================
   植被与设施：树木 / 草地 / 路灯 / 长椅
   依赖：core.js（layerGroups），terrain.js（CAMPUS_ROADS），buildings.js（BUILDING_DATA）
   ============================================================ */

// ===== 绿化区域定义 =====
// 用于树木散布，type: 'circle' | 'rect' | 'loop'
const GREEN_AREAS = [
  // 中央核心区
  { name: '中央大花园',      cx: 0,    cz: -10,  rx: 42, rz: 42,  type: 'circle' },
  { name: '图书馆前草坪',    cx: -4,   cz: 58,   rx: 28, rz: 12,  type: 'rect'   },
  // 南校区入口
  { name: '南门右侧草坪',    cx: 35,   cz: 198,  rx: 22, rz: 16,  type: 'rect'   },
  { name: '南门左侧草坪',    cx: -38,  cz: 198,  rx: 22, rz: 16,  type: 'rect'   },
  // 南校区教学楼内庭
  { name: '东侧教学楼内庭',  cx: 67,   cz: 161,  rx: 18, rz: 10,  type: 'rect'   },
  { name: '西侧教学楼内庭',  cx: -63,  cz: 161,  rx: 18, rz: 10,  type: 'rect'   },
  // 北校区花园
  { name: '北校区花园',      cx: 0,    cz: -200, rx: 55, rz: 50,  type: 'circle' },
  // 图书馆周边绿带
  { name: '图书馆西侧绿带',  cx: -60,  cz: 30,   rx: 8,  rz: 4,   type: 'rect'   },
  { name: '图书馆东侧绿带',  cx: 50,   cz: 30,   rx: 8,  rz: 4,   type: 'rect'   },
];

// ===== 环路道路（沿路边种树） =====
const LOOP_ROADS = [
  'ROAD-SOUTH-LOOP',
  'ROAD-CENTER-GARDEN-LOOP',
  'ROAD-WEST-EDU-LOOP',
  'ROAD-EAST-TEACHING-LOOP',
  'ROAD-STADIUM-LOOP',
  'ROAD-EAST-LIFE-LOOP',
];

function _findRoadPts(id) {
  if (typeof CAMPUS_ROADS === 'undefined') return null;
  for (var i = 0; i < CAMPUS_ROADS.length; i++) {
    if (CAMPUS_ROADS[i].id === id) return CAMPUS_ROADS[i].points;
  }
  return null;
}

// ===== 碰撞检测 =====
function _isOccupied(x, z, dB, dR) {
  dB = dB || 5; dR = dR || 3;
  if (typeof BUILDING_DATA !== 'undefined') {
    for (var i = 0; i < BUILDING_DATA.length; i++) {
      var b = BUILDING_DATA[i];
      var hw = (b.w || 10) / 2 + dB, hd = (b.d || 10) / 2 + dB;
      if (Math.abs(x - b.x) < hw && Math.abs(z - b.z) < hd) return true;
    }
  }
  if (typeof CAMPUS_ROADS !== 'undefined') {
    for (var j = 0; j < CAMPUS_ROADS.length; j++) {
      var rd = CAMPUS_ROADS[j];
      for (var k = 0; k < rd.points.length - 1; k++) {
        var p1 = rd.points[k], p2 = rd.points[k + 1];
        if (_ptSegDist(x, z, p1[0], p1[1], p2[0], p2[1]) < (rd.width || 6) / 2 + dR) return true;
      }
    }
  }
  return false;
}

function _ptSegDist(px, pz, ax, az, bx, bz) {
  var dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz;
  if (l2 < 0.001) return Math.hypot(px - ax, pz - az);
  var t = Math.max(0, Math.min(1, ((px - ax) * dx + (pz - az) * dz) / l2));
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

// ===== 圆形区域极坐标散布 =====
function _scatterCircle(cx, cz, rx, rz, count) {
  var out = [];
  for (var i = 0; i < count; i++) {
    var a = Math.random() * Math.PI * 2;
    var r = Math.sqrt(Math.random()) * Math.min(rx, rz) * 0.9;
    var x = cx + Math.cos(a) * r, z = cz + Math.sin(a) * r;
    if (!_isOccupied(x, z, 4, 2)) out.push([x, z, Math.random() < 0.5 ? 'broad' : 'cone']);
  }
  return out;
}

// ===== 矩形区域沿边缘散布 =====
function _scatterRect(cx, cz, rx, rz, sp) {
  sp = sp || 10; var out = [];
  var edges = [
    [function(t){return[cx-rx+t,cz-rz];}, rx*2],
    [function(t){return[cx-rx+t,cz+rz];}, rx*2],
    [function(t){return[cx+rx,cz-rz+t];}, rz*2],
    [function(t){return[cx-rx,cz-rz+t];}, rz*2],
  ];
  for (var e = 0; e < edges.length; e++) {
    for (var t = sp * 0.3; t < edges[e][1]; t += sp) {
      var p = edges[e][0](t);
      if (!_isOccupied(p[0], p[1], 3, 1.5)) out.push([p[0], p[1], Math.random() < 0.6 ? 'broad' : 'cone']);
    }
  }
  return out;
}

// ===== 环路沿路边种树 =====
function _scatterLoop(roadId, sp) {
  sp = sp || 12; var off = 3; var out = [];
  var pts = _findRoadPts(roadId);
  if (!pts) return out;
  for (var i = 0; i < pts.length - 1; i++) {
    var p1 = pts[i], p2 = pts[i + 1];
    var dx = p2[0] - p1[0], dz = p2[1] - p1[1];
    var sl = Math.hypot(dx, dz);
    var nx = -dz / sl, nz = dx / sl;
    var side = (i % 2 === 0) ? 1 : -1;
    for (var d = sp * 0.4; d < sl; d += sp) {
      var mx = p1[0] + dx * (d / sl) + nx * off * side;
      var mz = p1[1] + dz * (d / sl) + nz * off * side;
      if (!_isOccupied(mx, mz, 4, 2)) out.push([mx, mz, Math.random() < 0.55 ? 'broad' : 'cone']);
    }
  }
  return out;
}

// ===== 生成全部树木数据 =====
function _generateTreeData() {
  var all = [];
  // 圆形区
  for (var i = 0; i < GREEN_AREAS.length; i++) {
    var a = GREEN_AREAS[i];
    if (a.type !== 'circle') continue;
    var cnt = Math.max(5, Math.min(40, Math.floor(Math.PI * a.rx * a.rz / 60)));
    all = all.concat(_scatterCircle(a.cx, a.cz, a.rx, a.rz, cnt));
  }
  // 矩形区
  for (var j = 0; j < GREEN_AREAS.length; j++) {
    var r = GREEN_AREAS[j];
    if (r.type !== 'rect') continue;
    var perim = (r.rx + r.rz) * 2;
    all = all.concat(_scatterRect(r.cx, r.cz, r.rx, r.rz, Math.max(8, Math.floor(perim / 6))));
  }
  // 环路
  for (var k = 0; k < LOOP_ROADS.length; k++) {
    all = all.concat(_scatterLoop(LOOP_ROADS[k], 12));
  }
  // 去重
  var filtered = [];
  for (var m = 0; m < all.length; m++) {
    var t = all[m], dup = false;
    for (var n = 0; n < filtered.length; n++) {
      if (Math.hypot(t[0] - filtered[n][0], t[1] - filtered[n][1]) < 1.5) { dup = true; break; }
    }
    if (!dup) filtered.push(t);
  }
  console.log('[Vegetation] 生成树木 ' + filtered.length + ' 棵');
  return filtered;
}

var TREE_DATA = _generateTreeData();

// ===== 路灯数据 =====
const LAMP_DATA = [
  // 南侧主路
  [-300, 230], [-180, 230], [-60, 230], [60, 230], [180, 230], [300, 230],
  // 中央东西主路
  [-220, 0], [-120, 0], [-30, 0], [45, 0], [115, 0], [190, 0], [260, 0],
  // 北侧主路
  [-200, -110], [-100, -110], [0, -110], [100, -110], [200, -110], [280, -100],
  // 南门中轴
  [-2, 200], [-2, 165], [-2, 130], [-2, 95], [-2, 70],
];

// ===== 长椅数据 [x, z, rotation] =====
const BENCH_DATA = [
  [-6, 48, 0], [6, 48, 0],                 // 图书馆前
  [-58, 30, Math.PI / 2],                   // 图书馆西
  [48, 30, -Math.PI / 2],                   // 图书馆东
  [-10, 220, 0], [6, 220, 0],               // 南门
  [65, 176, 0], [-65, 176, 0],              // A1/A2
  [65, 126, 0], [-65, 126, 0],              // A3/A4
  [-12, -10, Math.PI / 4], [12, -10, -Math.PI / 4], // 中心花园
  [-95, -120, Math.PI / 2], [-105, -25, Math.PI / 2], // 15/16号楼
  [160, -15, -Math.PI / 2],                 // 9号楼
  [262, -55, -Math.PI / 2],                 // 体育馆
  [-15, -200, 0], [15, -200, 0],            // 北校区花园
  [130, 128, 0],                            // 查济民大厦
];

// ===== 单棵树 =====
function createTree(x, z, type) {
  var group = new THREE.Group();
  var trunkH = 2 + Math.random() * 2;

  var trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(0.3, 0.35, trunkH, 6),
    new THREE.MeshStandardMaterial({ color: 0x5c3d1f, roughness: 0.9 })
  );
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  group.add(trunk);

  var hue = 0.27 + Math.random() * 0.05;
  var sat = 0.5 + Math.random() * 0.2;
  var lit = 0.3 + Math.random() * 0.15;
  var leafMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(hue, sat, lit), roughness: 0.85
  });

  if (type === 'cone') {
    var cr = 1.5 + Math.random(), ch = 3 + Math.random() * 2;
    var crown = new THREE.Mesh(new THREE.ConeGeometry(cr, ch, 6), leafMat);
    crown.position.y = trunkH + ch / 2 - 0.5;
    crown.castShadow = true;
    group.add(crown);
  } else {
    var sr = 2 + Math.random() * 1.5;
    var sphere = new THREE.Mesh(new THREE.SphereGeometry(sr, 8, 6), leafMat);
    sphere.position.y = trunkH + sr * 0.6;
    sphere.castShadow = true;
    group.add(sphere);
  }

  group.position.set(x, 0, z);
  group.userData = { name: '树木', type: '植被', desc: '校园绿化树种。' };
  return group;
}

// ===== 批量生成树木 =====
function createTrees() {
  TREE_DATA.forEach(function (e) {
    layerGroups.vegetation.add(createTree(e[0], e[1], e[2]));
  });
}

// ===== 圆形草地补丁 =====
function createGrassPatch(x, z, r) {
  var g = new THREE.Mesh(
    new THREE.CircleGeometry(r, 16),
    new THREE.MeshStandardMaterial({ color: 0x4a7a3a, roughness: 0.95,
      polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })
  );
  g.rotation.x = -Math.PI / 2;
  g.position.set(x, 0.01, z);
  g.receiveShadow = true;
  g.userData = { name: '草地', type: '植被', desc: '校园绿化草地。' };
  layerGroups.vegetation.add(g);
}

// ===== 从 GREEN_AREAS 生成草地补丁 =====
function createGreenAreaPatches() {
  GREEN_AREAS.forEach(function (area) {
    if (area.type === 'circle') {
      createGrassPatch(area.cx, area.cz, Math.min(area.rx, area.rz));
    } else if (area.type === 'rect') {
      var g = new THREE.Mesh(
        new THREE.PlaneGeometry(area.rx * 2, area.rz * 2),
        new THREE.MeshStandardMaterial({ color: 0x5a8a4a, roughness: 0.95,
          polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 })
      );
      g.rotation.x = -Math.PI / 2;
      g.position.set(area.cx, 0.01, area.cz);
      g.receiveShadow = true;
      g.userData = { name: area.name, type: '绿地', desc: area.name + '绿化区域。' };
      layerGroups.vegetation.add(g);
    }
  });
}

// ===== 单盏路灯 =====
function createStreetLamp(x, z) {
  var group = new THREE.Group();

  var pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 })
  );
  pole.position.y = 2.25; pole.castShadow = true;
  group.add(pole);

  var bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff2c8, emissive: 0x000000, emissiveIntensity: 0, roughness: 0.4
  });
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), bulbMat);
  head.position.y = 4.6; head.userData.isLampHead = true;
  group.add(head);

  var light = new THREE.PointLight(0xffcc66, 0, 14, 1.6);
  light.position.y = 4.6;
  group.add(light);

  group.position.set(x, 0, z);

  if (typeof streetLamps !== 'undefined') {
    streetLamps.push({ light: light, bulbMat: bulbMat });
  }
  return group;
}

// ===== 批量生成路灯 =====
function createStreetLamps() {
  LAMP_DATA.forEach(function (e) {
    layerGroups.facilities.add(createStreetLamp(e[0], e[1]));
  });
  console.log('[Vegetation] 路灯 ' + LAMP_DATA.length + ' 盏（PointLight 共 ' + streetLamps.length + ' 个）');
}

// ===== 单个长椅 =====
function createBench(x, z, rot) {
  var group = new THREE.Group();
  var woodMat = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.8 });
  var metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6 });

  // 座板
  var seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.45), woodMat);
  seat.position.y = 0.45; seat.castShadow = true;
  group.add(seat);

  // 靠背
  var back = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.06), woodMat);
  back.position.set(0, 0.75, -0.2); back.rotation.x = 0.1; back.castShadow = true;
  group.add(back);

  // 两根支架
  [-0.55, 0.55].forEach(function (lx) {
    var leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.35), metalMat);
    leg.position.set(lx, 0.22, 0); leg.castShadow = true;
    group.add(leg);
  });

  group.position.set(x, 0, z);
  group.rotation.y = rot || 0;
  group.userData = { name: '长椅', type: '设施', desc: '校园休息长椅。' };
  return group;
}

// ===== 批量生成长椅 =====
function createBenches() {
  BENCH_DATA.forEach(function (e) {
    layerGroups.facilities.add(createBench(e[0], e[1], e[2]));
  });
}
