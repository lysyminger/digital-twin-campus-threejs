/* ============================================================
   植被与设施：树木 / 路灯 / 长椅
   树木严格按 GRASS_DATA 草坪范围种植
   依赖：core.js（layerGroups），terrain.js（GRASS_DATA, CAMPUS_ROADS），buildings.js（BUILDING_DATA）
   ============================================================ */

// ===== 中央广场（不种树）的草坪 id =====
var PLAZA_IDS = [104, 105, 106, 107];

// ===== 碰撞检测（建筑 + 道路） =====
function _isOccupied(x, z, dB, dR) {
  dB = dB || 4; dR = dR || 2;
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

// ===== 矩形草坪：沿四条边种树 =====
function _scatterEdge(g, sp) {
  sp = sp || 10;
  var out = [];
  var hw = g.w / 2, hh = g.h / 2;
  var cx = g.x, cz = g.z;
  // 内缩 2m，避免树干超出草坪
  var inset = 2;
  var iw = hw - inset, ih = hh - inset;
  if (iw < 2 || ih < 2) return out;

  // 四条边
  var edges = [
    // 上边 (z - ih)
    function(t) { return [cx - iw + t, cz - ih]; },
    // 下边 (z + ih)
    function(t) { return [cx - iw + t, cz + ih]; },
    // 右边 (x + iw)
    function(t) { return [cx + iw, cz - ih + t]; },
    // 左边 (x - iw)
    function(t) { return [cx - iw, cz - ih + t]; }
  ];
  var lens = [iw * 2, iw * 2, ih * 2, ih * 2];

  for (var e = 0; e < 4; e++) {
    for (var d = sp * 0.4; d < lens[e]; d += sp) {
      var p = edges[e](d);
      var jx = p[0] + (Math.random() - 0.5) * 2;
      var jz = p[1] + (Math.random() - 0.5) * 2;
      out.push([jx, jz, Math.random() < 0.6 ? 'broad' : 'cone']);
    }
  }
  return out;
}

// ===== 矩形草坪：只围一圈（中间留空） =====
function _scatterPerimeter(g, sp) {
  sp = sp || 8;
  var out = [];
  var hw = g.w / 2, hh = g.h / 2;
  var cx = g.x, cz = g.z;
  var inset = 3;
  var iw = hw - inset, ih = hh - inset;
  if (iw < 2 || ih < 2) return out;

  // 沿四条边密集种树
  // 上边
  for (var t = 0; t < iw * 2; t += sp) {
    var x = cx - iw + t + (Math.random() - 0.5) * 2;
    var z = cz - ih + (Math.random() - 0.5) * 1.5;
    out.push([x, z, Math.random() < 0.5 ? 'broad' : 'cone']);
  }
  // 下边
  for (var t = 0; t < iw * 2; t += sp) {
    var x = cx - iw + t + (Math.random() - 0.5) * 2;
    var z = cz + ih + (Math.random() - 0.5) * 1.5;
    out.push([x, z, Math.random() < 0.5 ? 'broad' : 'cone']);
  }
  // 左边（不含角）
  for (var t = sp; t < ih * 2 - sp; t += sp) {
    var x = cx - iw + (Math.random() - 0.5) * 1.5;
    var z = cz - ih + t + (Math.random() - 0.5) * 2;
    out.push([x, z, Math.random() < 0.5 ? 'broad' : 'cone']);
  }
  // 右边（不含角）
  for (var t = sp; t < ih * 2 - sp; t += sp) {
    var x = cx + iw + (Math.random() - 0.5) * 1.5;
    var z = cz - ih + t + (Math.random() - 0.5) * 2;
    out.push([x, z, Math.random() < 0.5 ? 'broad' : 'cone']);
  }
  return out;
}

// ===== 矩形草坪：密集填充（树林） =====
function _scatterDense(g, sp, treeType) {
  sp = sp || 5;
  var out = [];
  var hw = g.w / 2, hh = g.h / 2;
  var cx = g.x, cz = g.z;
  var inset = 2;

  for (var zz = cz - hh + inset; zz <= cz + hh - inset; zz += sp) {
    for (var xx = cx - hw + inset; xx <= cx + hw - inset; xx += sp) {
      var jx = xx + (Math.random() - 0.5) * (sp * 0.6);
      var jz = zz + (Math.random() - 0.5) * (sp * 0.6);
      out.push([jx, jz, treeType || 'broad']);
    }
  }
  return out;
}

// ===== 稀疏内部填充（几棵点缀） =====
function _scatterSparse(g, count) {
  var out = [];
  var hw = g.w / 2 - 3, hh = g.h / 2 - 3;
  for (var i = 0; i < count; i++) {
    var x = g.x + (Math.random() - 0.5) * hw * 2;
    var z = g.z + (Math.random() - 0.5) * hh * 2;
    out.push([x, z, Math.random() < 0.5 ? 'broad' : 'cone']);
  }
  return out;
}

// ===== 基于 GRASS_DATA 生成全部树木数据 =====
function _generateTreeData() {
  var all = [];

  for (var i = 0; i < GRASS_DATA.length; i++) {
    var g = GRASS_DATA[i];

    // 中央广场不种树
    if (PLAZA_IDS.indexOf(g.id) >= 0) continue;

    // 体育馆周边绿地 — 围一圈，中间空
    if (g.id === 102) {
      all = all.concat(_scatterPerimeter(g, 7));
      continue;
    }

    // 图书馆东侧绿地 — 密集高树林
    if (g.id === 100) {
      all = all.concat(_scatterDense(g, 5, 'tall'));
      continue;
    }

    // 其他草坪：根据面积决定种树策略
    if (g.type !== 'rect') continue;
    var area = g.w * g.h;

    if (area > 1500) {
      // 大草坪：边缘种树 + 内部几棵点缀
      all = all.concat(_scatterEdge(g, 10));
      all = all.concat(_scatterSparse(g, Math.floor(area / 500)));
    } else if (area > 400) {
      // 中等草坪：边缘种树
      all = all.concat(_scatterEdge(g, 12));
    } else if (area > 100) {
      // 小草坪：稀疏几棵
      all = all.concat(_scatterSparse(g, Math.max(2, Math.floor(area / 150))));
    }
    // 太小的草坪不种树
  }

  // 过滤：去掉压在建筑/道路上的 + 去重
  var filtered = [];
  for (var m = 0; m < all.length; m++) {
    var t = all[m];
    if (_isOccupied(t[0], t[1], 3, 2)) continue;
    var dup = false;
    for (var n = 0; n < filtered.length; n++) {
      if (Math.hypot(t[0] - filtered[n][0], t[1] - filtered[n][1]) < 2) { dup = true; break; }
    }
    if (!dup) filtered.push(t);
  }

  console.log('[Vegetation] 生成树木 ' + filtered.length + ' 棵');
  return filtered;
}

var TREE_DATA = _generateTreeData();

// ===== 路灯数据（沿实际道路生成） =====
var LAMP_DATA = [];
function _generateLampData() {
  var lamps = [];
  var spacing = 60;
  var offset = 4;
  CAMPUS_ROADS.forEach(function(road) {
    if (road.type === 'outer') return;
    if (road.type === 'loop' && road.width < 5) return;
    var pts = road.points;
    var accumulated = 0;
    for (var i = 1; i < pts.length; i++) {
      var dx = pts[i][0] - pts[i-1][0];
      var dz = pts[i][1] - pts[i-1][1];
      var segLen = Math.sqrt(dx*dx + dz*dz);
      if (segLen < 1) continue;
      var nx = -dz / segLen;
      var nz = dx / segLen;
      var steps = Math.floor((accumulated + segLen) / spacing) - Math.floor(accumulated / spacing);
      for (var s = 0; s < steps; s++) {
        var along = (Math.floor(accumulated / spacing) + s + 1) * spacing - accumulated;
        var t = along / segLen;
        if (t < 0 || t > 1) continue;
        var x = pts[i-1][0] + dx * t + nx * offset;
        var z = pts[i-1][1] + dz * t + nz * offset;
        lamps.push([Math.round(x), Math.round(z)]);
      }
      accumulated += segLen;
    }
  });
  return lamps;
}

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

// ===== 单棵树（支持 broad / cone / tall 三种） =====
function createTree(x, z, type) {
  var group = new THREE.Group();

  // tall 类型：高大乔木（树林用）
  var isTall = (type === 'tall');
  var trunkH = isTall ? (5 + Math.random() * 3) : (2 + Math.random() * 2);

  var trunk = new THREE.Mesh(
    new THREE.CylinderGeometry(
      isTall ? 0.25 : 0.3,
      isTall ? 0.35 : 0.35,
      trunkH, 6
    ),
    new THREE.MeshStandardMaterial({ color: 0x5c3d1f, roughness: 0.9 })
  );
  trunk.position.y = trunkH / 2;
  trunk.castShadow = true;
  group.add(trunk);

  var hue = isTall ? (0.28 + Math.random() * 0.04) : (0.27 + Math.random() * 0.05);
  var sat = isTall ? (0.55 + Math.random() * 0.15) : (0.5 + Math.random() * 0.2);
  var lit = isTall ? (0.22 + Math.random() * 0.1) : (0.3 + Math.random() * 0.15);
  var leafMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color().setHSL(hue, sat, lit), roughness: 0.85
  });

  if (isTall) {
    // 高大的球冠，密集树林效果
    var sr = 3 + Math.random() * 2;
    var sphere = new THREE.Mesh(new THREE.SphereGeometry(sr, 8, 6), leafMat);
    sphere.position.y = trunkH + sr * 0.5;
    sphere.castShadow = true;
    group.add(sphere);
  } else if (type === 'cone') {
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
  group.userData = {
    name: isTall ? '乔木' : '树木',
    type: '植被',
    desc: isTall ? '高大乔木，形成树林。' : '校园绿化树种。'
  };
  return group;
}

// ===== 草丛 =====
function createBush(x, z) {
  var group = new THREE.Group();
  var count = 2 + Math.floor(Math.random() * 3);
  for (var i = 0; i < count; i++) {
    var r = 0.6 + Math.random() * 0.8;
    var hue = 0.27 + Math.random() * 0.06;
    var mat = new THREE.MeshStandardMaterial({
      color: new THREE.Color().setHSL(hue, 0.5 + Math.random() * 0.2, 0.25 + Math.random() * 0.1),
      roughness: 0.9
    });
    var ball = new THREE.Mesh(new THREE.SphereGeometry(r, 6, 5), mat);
    ball.position.set((Math.random() - 0.5) * 1.5, r * 0.6, (Math.random() - 0.5) * 1.5);
    ball.scale.y = 0.6 + Math.random() * 0.3;
    ball.castShadow = true;
    group.add(ball);
  }
  group.position.set(x, 0, z);
  group.userData = { name: '草丛', type: '植被', desc: '装饰性灌木丛。' };
  return group;
}

// ===== 批量生成树木（从 GRASS_DATA 的 trees 字段读取） =====
var grassVegMeshes = [];
function createTrees() {
  GRASS_DATA.forEach(function(gd) {
    if (!gd.trees || !gd.trees.length) return;
    gd.trees.forEach(function(t) {
      var mesh;
      if (t.type === 'bush') {
        mesh = createBush(t.x, t.z);
      } else {
        mesh = createTree(t.x, t.z, t.type || 'broad');
      }
      layerGroups.vegetation.add(mesh);
      grassVegMeshes.push(mesh);
    });
  });
  console.log('[Vegetation] 生成树木 ' + grassVegMeshes.length + ' 棵');
}

// ===== 单盏路灯 =====
function createStreetLamp(x, z) {
  var group = new THREE.Group();

  var pole = new THREE.Mesh(
    new THREE.CylinderGeometry(0.08, 0.1, 4.5, 6),
    new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.7 })
  );
  pole.position.y = 2.25; pole.castShadow = false;
  group.add(pole);

  var bulbMat = new THREE.MeshStandardMaterial({
    color: 0xfff2c8, emissive: 0x000000, emissiveIntensity: 0, roughness: 0.4
  });
  var head = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), bulbMat);
  head.position.y = 4.6; head.userData.isLampHead = true;
  head.castShadow = false;
  group.add(head);

  // 移除 PointLight，只保留 emissive 假发光，彻底避免动态光照开销
  // var light = new THREE.PointLight(0xffcc66, 0, 14, 1.6);
  // light.position.y = 4.6;
  // group.add(light);

  group.position.set(x, 0, z);

  if (typeof streetLamps !== 'undefined') {
    streetLamps.push({ light: null, bulbMat: bulbMat });
  }
  return group;
}

// ===== 批量生成路灯 =====
function createStreetLamps() {
  LAMP_DATA = _generateLampData();
  LAMP_DATA.forEach(function (e) {
    layerGroups.facilities.add(createStreetLamp(e[0], e[1]));
  });
  console.log('[Vegetation] 路灯 ' + LAMP_DATA.length + ' 盏');
}

// ===== 单个长椅 =====
function createBench(x, z, rot) {
  var group = new THREE.Group();
  var woodMat = new THREE.MeshStandardMaterial({ color: 0x8b6f47, roughness: 0.8 });
  var metalMat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.6 });

  var seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.08, 0.45), woodMat);
  seat.position.y = 0.45; seat.castShadow = false;
  group.add(seat);

  var back = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.06), woodMat);
  back.position.set(0, 0.75, -0.2); back.rotation.x = 0.1; back.castShadow = false;
  group.add(back);

  [-0.55, 0.55].forEach(function (lx) {
    var leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.45, 0.35), metalMat);
    leg.position.set(lx, 0.22, 0); leg.castShadow = false;
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
