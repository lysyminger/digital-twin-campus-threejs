/* ============================================================
   道路可视化编辑器
   按 R 键打开/关闭，支持：选中道路、拖拽路点、整体平移、调宽度、导出代码
   依赖：core.js, terrain.js（CAMPUS_ROADS, roadMeshes, createRoadStrip 等）
   ============================================================ */

// ===== 状态 =====
var _reActive = false;
var _reSelIdx = -1;         // 当前选中道路索引
var _reSelPt = -1;          // 当前选中路点索引
var _reDragging = false;
var _reDragMode = '';       // 'point' | 'road'
var _rePanel = null;
var _reHighlight = null;
var _reHandles = [];        // 路点把手 mesh 数组
var _rePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
var _reIsect = new THREE.Vector3();
var _reDragStart = new THREE.Vector2();  // 整体拖拽起始点

// ===== 样式注入 =====
function _reInjectCSS() {
  var style = document.createElement('style');
  style.textContent = '\
#re-panel {\
  position:fixed; top:80px; right:16px; width:320px; max-height:calc(100vh - 110px);\
  padding:14px 16px; z-index:50; display:none;\
  overflow-y:auto; font-size:13px;\
  background:rgba(12,22,36,0.88); backdrop-filter:blur(14px) saturate(140%);\
  border:1px solid rgba(80,200,120,0.3); border-radius:12px;\
  box-shadow:0 8px 32px rgba(0,10,25,0.6); color:#cfe8ff;\
}\
#re-panel.show { display:block; }\
#re-panel h2 { font-size:14px; color:#50c878; margin:0 0 10px; font-weight:600; letter-spacing:1px; }\
#re-panel .re-hint { font-size:11px; color:#6a8aa8; margin-bottom:10px; }\
#re-panel .re-toolbar { display:flex; gap:6px; margin-bottom:10px; flex-wrap:wrap; }\
#re-panel .re-btn {\
  flex:1; min-width:55px; padding:6px 0; font-size:11px; text-align:center;\
  color:#cfe8ff; background:rgba(80,200,120,0.1);\
  border:1px solid rgba(80,200,120,0.25); border-radius:6px;\
  cursor:pointer; font-family:inherit; transition:all .15s;\
}\
#re-panel .re-btn:hover { background:rgba(80,200,120,0.25); color:#fff; }\
#re-panel .re-btn.danger { border-color:rgba(255,100,100,0.3); color:#ff9090; }\
#re-panel .re-list { max-height:180px; overflow-y:auto; margin-bottom:10px;\
  border:1px solid rgba(80,200,120,0.15); border-radius:6px; }\
#re-panel .re-item {\
  padding:5px 8px; cursor:pointer; font-size:12px;\
  border-bottom:1px solid rgba(80,200,120,0.08); transition:background .1s;\
}\
#re-panel .re-item:hover { background:rgba(80,200,120,0.1); }\
#re-panel .re-item.sel { background:rgba(80,200,120,0.2); color:#80ffa0; }\
#re-panel .re-item .rtype { font-size:10px; color:#6a8aa8; margin-left:6px; }\
#re-panel .re-props { display:none; }\
#re-panel .re-props.show { display:block; }\
#re-panel .re-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }\
#re-panel .re-row label { width:50px; font-size:11px; color:#8ab8d8; flex-shrink:0; }\
#re-panel .re-row input, #re-panel .re-row select {\
  flex:1; padding:4px 6px; font-size:12px; background:rgba(255,255,255,0.06);\
  border:1px solid rgba(80,200,120,0.2); border-radius:4px; color:#cfe8ff;\
  font-family:inherit; outline:none;\
}\
#re-panel .re-row input:focus { border-color:#50c878; }\
#re-panel .re-section { font-size:12px; color:#50c878; margin:10px 0 6px; font-weight:600; }\
#re-panel .re-pt-list { max-height:150px; overflow-y:auto; margin-bottom:8px; }\
#re-panel .re-pt-item {\
  display:flex; gap:4px; align-items:center; padding:3px 6px; font-size:11px;\
  border-bottom:1px solid rgba(80,200,120,0.08); cursor:pointer;\
}\
#re-panel .re-pt-item.sel { background:rgba(80,200,120,0.15); color:#80ffa0; }\
#re-panel .re-pt-item input {\
  width:55px; padding:2px 4px; font-size:11px;\
}\
#re-export-box {\
  display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);\
  width:520px; max-height:70vh; z-index:100;\
  background:rgba(12,22,36,0.95); backdrop-filter:blur(14px);\
  border:1px solid rgba(80,200,120,0.3); border-radius:12px;\
  padding:16px; box-shadow:0 12px 48px rgba(0,0,0,0.7);\
}\
#re-export-box textarea {\
  width:100%; height:280px; background:rgba(0,0,0,0.4); color:#cfe8ff;\
  border:1px solid rgba(80,200,120,0.2); border-radius:6px; padding:8px;\
  font-family:"Consolas","Monaco",monospace; font-size:11px; resize:vertical;\
}\
#re-export-box .re-toolbar { display:flex; gap:8px; margin-top:8px; justify-content:flex-end; }\
';
  document.head.appendChild(style);
}

// ===== 构建面板 =====
function _reBuildPanel() {
  var panel = document.createElement('div');
  panel.id = 're-panel';
  panel.innerHTML = '\
<h2>🛤️ 道路编辑器</h2>\
<div class="re-hint">R 键关闭 · 点击选中道路 · 拖拽路点移动 · 拖路面整体平移</div>\
<div class="re-toolbar">\
  <button class="re-btn" id="re-add">＋新增道路</button>\
  <button class="re-btn danger" id="re-del">删除道路</button>\
  <button class="re-btn" id="re-save" style="background:rgba(80,200,120,0.2);border-color:rgba(80,200,120,0.4)">💾 保存</button>\
  <button class="re-btn" id="re-export">导出代码</button>\
</div>\
<div class="re-list" id="re-list"></div>\
<div class="re-props" id="re-props">\
  <div class="re-section">道路属性</div>\
  <div class="re-row"><label>名称</label><input id="re-name" type="text"></div>\
  <div class="re-row"><label>类型</label><select id="re-type">\
    <option value="outer">outer 外围</option>\
    <option value="main">main 主路</option>\
    <option value="loop">loop 环路</option>\
    <option value="branch">branch 支路</option>\
  </select></div>\
  <div class="re-row"><label>路宽</label><input id="re-width" type="number" step="1" min="1"></div>\
  <div class="re-section">路点列表</div>\
  <div class="re-toolbar">\
    <button class="re-btn" id="re-pt-add">＋路点</button>\
    <button class="re-btn danger" id="re-pt-del">删除路点</button>\
  </div>\
  <div class="re-pt-list" id="re-pt-list"></div>\
</div>';
  document.body.appendChild(panel);
  _rePanel = panel;

  // 导出框
  var ebox = document.createElement('div');
  ebox.id = 're-export-box';
  ebox.innerHTML = '<textarea id="re-export-text" readonly></textarea>\
<div class="re-toolbar">\
  <button class="re-btn" id="re-export-copy">复制到剪贴板</button>\
  <button class="re-btn" id="re-export-close">关闭</button>\
</div>';
  document.body.appendChild(ebox);

  // 事件
  document.getElementById('re-add').onclick = _reAddRoad;
  document.getElementById('re-del').onclick = _reDeleteRoad;
  document.getElementById('re-save').onclick = function() { editorSaveAll(); };
  document.getElementById('re-export').onclick = _reShowExport;
  document.getElementById('re-pt-add').onclick = _reAddPoint;
  document.getElementById('re-pt-del').onclick = _reDeletePoint;
  document.getElementById('re-export-copy').onclick = function() {
    var ta = document.getElementById('re-export-text');
    ta.select(); document.execCommand('copy');
  };
  document.getElementById('re-export-close').onclick = function() {
    document.getElementById('re-export-box').style.display = 'none';
  };
  ['re-name','re-type','re-width'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', function() { _reApplyProps(); });
  });
}

// ===== 列表 =====
function _reRefreshList() {
  var list = document.getElementById('re-list');
  if (!list) return;
  var html = '';
  CAMPUS_ROADS.forEach(function(road, i) {
    var cls = (i === _reSelIdx) ? 're-item sel' : 're-item';
    html += '<div class="' + cls + '" data-idx="' + i + '">' +
      road.name + '<span class="rtype">' + road.type + '</span></div>';
  });
  list.innerHTML = html;
  list.querySelectorAll('.re-item').forEach(function(el) {
    el.onclick = function() {
      _reSelIdx = parseInt(el.dataset.idx);
      _reSelPt = -1;
      _reRefreshList();
      _reRefreshProps();
      _reShowHandles();
    };
  });
}

// ===== 属性面板 =====
function _reRefreshProps() {
  var props = document.getElementById('re-props');
  if (!props) return;
  if (_reSelIdx < 0 || _reSelIdx >= CAMPUS_ROADS.length) {
    props.classList.remove('show');
    return;
  }
  props.classList.add('show');
  var road = CAMPUS_ROADS[_reSelIdx];
  document.getElementById('re-name').value = road.name;
  document.getElementById('re-type').value = road.type;
  document.getElementById('re-width').value = road.width;
  _reRefreshPtList();
}

// ===== 路点列表 =====
function _reRefreshPtList() {
  var container = document.getElementById('re-pt-list');
  if (!container || _reSelIdx < 0) return;
  var pts = CAMPUS_ROADS[_reSelIdx].points;
  var html = '';
  pts.forEach(function(pt, i) {
    var cls = (i === _reSelPt) ? 're-pt-item sel' : 're-pt-item';
    html += '<div class="' + cls + '" data-pt="' + i + '">' +
      '<span style="width:20px">' + i + '</span>' +
      '<input type="number" value="' + Math.round(pt[0]) + '" data-pt="' + i + '" data-axis="0" step="1">' +
      '<input type="number" value="' + Math.round(pt[1]) + '" data-pt="' + i + '" data-axis="1" step="1">' +
      '</div>';
  });
  container.innerHTML = html;
  // 点击选中路点
  container.querySelectorAll('.re-pt-item').forEach(function(el) {
    el.addEventListener('click', function(e) {
      if (e.target.tagName === 'INPUT') return;
      _reSelPt = parseInt(el.dataset.pt);
      _reRefreshPtList();
      _reUpdateHandleColors();
    });
  });
  // 输入修改坐标
  container.querySelectorAll('input').forEach(function(inp) {
    inp.addEventListener('change', function() {
      var pi = parseInt(inp.dataset.pt);
      var axis = parseInt(inp.dataset.axis);
      CAMPUS_ROADS[_reSelIdx].points[pi][axis] = parseFloat(inp.value) || 0;
      _reSyncMesh(_reSelIdx);
      _reShowHandles();
    });
  });
}

// ===== 属性应用 =====
function _reApplyProps() {
  if (_reSelIdx < 0) return;
  var road = CAMPUS_ROADS[_reSelIdx];
  road.name = document.getElementById('re-name').value;
  road.type = document.getElementById('re-type').value;
  road.width = parseFloat(document.getElementById('re-width').value) || 6;
  _reSyncMesh(_reSelIdx);
  _reRefreshList();
}

// ===== Mesh 同步 =====
function _reSyncMesh(idx) {
  var road = CAMPUS_ROADS[idx];
  var oldGroup = roadMeshes[idx];
  if (oldGroup) {
    layerGroups.roads.remove(oldGroup);
    var iIdx = interactables.indexOf(oldGroup);
    if (iIdx !== -1) interactables.splice(iIdx, 1);
  }

  var asphaltMat = createAsphaltMaterial();
  var group = new THREE.Group();
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
  roadMeshes[idx] = group;
}

// ===== 路点把手 =====
var _reHandleGeo = null;
var _reHandleMatNormal = null;
var _reHandleMatSel = null;

function _reShowHandles() {
  _reClearHandles();
  if (_reSelIdx < 0) return;
  if (!_reHandleGeo) {
    _reHandleGeo = new THREE.SphereGeometry(2, 8, 6);
    _reHandleMatNormal = new THREE.MeshBasicMaterial({ color: 0x4488ff, transparent: true, opacity: 0.7 });
    _reHandleMatSel = new THREE.MeshBasicMaterial({ color: 0xff4444, transparent: true, opacity: 0.8 });
  }
  var pts = CAMPUS_ROADS[_reSelIdx].points;
  pts.forEach(function(pt, i) {
    var mesh = new THREE.Mesh(_reHandleGeo, (i === _reSelPt) ? _reHandleMatSel : _reHandleMatNormal);
    mesh.position.set(pt[0], 2, pt[1]);
    mesh.userData._reIdx = i;
    scene.add(mesh);
    _reHandles.push(mesh);
  });
}

function _reClearHandles() {
  _reHandles.forEach(function(m) { scene.remove(m); });
  _reHandles = [];
}

function _reUpdateHandleColors() {
  _reHandles.forEach(function(m, i) {
    m.material = (i === _reSelPt) ? _reHandleMatSel : _reHandleMatNormal;
  });
}

// ===== 新增/删除路点 =====
function _reAddPoint() {
  if (_reSelIdx < 0) return;
  var pts = CAMPUS_ROADS[_reSelIdx].points;
  // 在最后一个点后延伸 20m
  var last = pts[pts.length - 1];
  var prev = pts.length > 1 ? pts[pts.length - 2] : [last[0] - 20, last[1]];
  var dx = last[0] - prev[0], dz = last[1] - prev[1];
  var len = Math.sqrt(dx * dx + dz * dz) || 1;
  pts.push([Math.round(last[0] + dx / len * 20), Math.round(last[1] + dz / len * 20)]);
  _reSyncMesh(_reSelIdx);
  _reRefreshPtList();
  _reShowHandles();
}

function _reDeletePoint() {
  if (_reSelIdx < 0 || _reSelPt < 0) return;
  var pts = CAMPUS_ROADS[_reSelIdx].points;
  if (pts.length <= 2) return; // 至少 2 个点
  pts.splice(_reSelPt, 1);
  _reSelPt = -1;
  _reSyncMesh(_reSelIdx);
  _reRefreshPtList();
  _reShowHandles();
}

// ===== 新增/删除道路 =====
function _reAddRoad() {
  var cx = Math.round(controls.target.x);
  var cz = Math.round(controls.target.z);
  var road = {
    id: 'CUSTOM-ROAD-' + Date.now(),
    name: '新道路',
    type: 'branch',
    width: 5,
    points: [[cx - 30, cz], [cx, cz], [cx + 30, cz]]
  };
  CAMPUS_ROADS.push(road);
  // 创建 mesh
  var asphaltMat = createAsphaltMaterial();
  var group = new THREE.Group();
  group.add(createRoadStrip(road.points, road.width, asphaltMat));
  group.add(createDashedCenterLine(road.points));
  group.add(createRoadEdgeLines(road.points, road.width));
  group.userData = { name: road.name, type: '道路', desc: road.name + '，路宽 ' + road.width + ' m。', points: road.points, width: road.width };
  layerGroups.roads.add(group);
  interactables.push(group);
  roadMeshes.push(group);
  _reSelIdx = CAMPUS_ROADS.length - 1;
  _reSelPt = -1;
  _reRefreshList();
  _reRefreshProps();
  _reShowHandles();
}

function _reDeleteRoad() {
  if (_reSelIdx < 0) return;
  var group = roadMeshes[_reSelIdx];
  if (group) {
    layerGroups.roads.remove(group);
    var iIdx = interactables.indexOf(group);
    if (iIdx !== -1) interactables.splice(iIdx, 1);
  }
  CAMPUS_ROADS.splice(_reSelIdx, 1);
  roadMeshes.splice(_reSelIdx, 1);
  _reSelIdx = -1;
  _reSelPt = -1;
  _reClearHandles();
  _reRefreshList();
  _reRefreshProps();
}

// ===== 导出 =====
function _reShowExport() {
  var lines = ['const CAMPUS_ROADS = ['];
  CAMPUS_ROADS.forEach(function(road, i) {
    var ptsStr = road.points.map(function(p) { return '[' + Math.round(p[0]) + ',' + Math.round(p[1]) + ']'; }).join(',');
    lines.push('  { id: "' + road.id + '", name: "' + road.name + '", type: "' + road.type +
      '", width: ' + road.width + ',');
    lines.push('    points: [' + ptsStr + '] }' + (i < CAMPUS_ROADS.length - 1 ? ',' : ''));
  });
  lines.push('];');
  document.getElementById('re-export-text').value = lines.join('\n');
  document.getElementById('re-export-box').style.display = 'block';
}

// ===== 场景交互：pointerdown =====
function _reOnDown(e) {
  if (!_reActive) return;
  if (e.target.closest('#re-panel') || e.target.closest('#re-export-box')) return;
  if (e.button !== 0) return;

  var rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  // 1. 先检测路点把手
  if (_reHandles.length > 0) {
    var handleHits = raycaster.intersectObjects(_reHandles);
    if (handleHits.length > 0) {
      e.stopPropagation();
      _reSelPt = handleHits[0].object.userData._reIdx;
      _reUpdateHandleColors();
      _reRefreshPtList();
      // 开始拖拽路点
      raycaster.ray.intersectPlane(_rePlane, _reIsect);
      _reDragging = true;
      _reDragMode = 'point';
      controls.enabled = false;
      return;
    }
  }

  // 2. 检测道路 mesh
  var roadHits = [];
  roadMeshes.forEach(function(m, i) {
    if (!m) return;
    var arr = raycaster.intersectObject(m, true);
    if (arr.length > 0) roadHits.push({ idx: i, dist: arr[0].distance });
  });
  roadHits.sort(function(a, b) { return a.dist - b.dist; });

  if (roadHits.length > 0) {
    e.stopPropagation();
    var newIdx = roadHits[0].idx;
    if (newIdx !== _reSelIdx) {
      _reSelIdx = newIdx;
      _reSelPt = -1;
      _reRefreshList();
      _reRefreshProps();
      _reShowHandles();
    }
    // 整体拖拽
    raycaster.ray.intersectPlane(_rePlane, _reIsect);
    _reDragStart.set(_reIsect.x, _reIsect.z);
    _reDragging = true;
    _reDragMode = 'road';
    controls.enabled = false;
  } else {
    _reSelIdx = -1;
    _reSelPt = -1;
    _reClearHandles();
    _reRefreshList();
    _reRefreshProps();
  }
}

// ===== pointermove =====
function _reOnMove(e) {
  if (!_reActive || !_reDragging || _reSelIdx < 0) return;
  var rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(_rePlane, _reIsect);

  var pts = CAMPUS_ROADS[_reSelIdx].points;

  if (_reDragMode === 'point' && _reSelPt >= 0 && _reSelPt < pts.length) {
    pts[_reSelPt][0] = Math.round(_reIsect.x);
    pts[_reSelPt][1] = Math.round(_reIsect.z);
    // 移动把手可视化
    if (_reHandles[_reSelPt]) {
      _reHandles[_reSelPt].position.set(pts[_reSelPt][0], 2, pts[_reSelPt][1]);
    }
    // 实时重建（路面较简单，实时即可）
    _reSyncMesh(_reSelIdx);
    _reRefreshPtList();
  } else if (_reDragMode === 'road') {
    var dx = Math.round(_reIsect.x - _reDragStart.x);
    var dz = Math.round(_reIsect.z - _reDragStart.y);
    if (dx !== 0 || dz !== 0) {
      pts.forEach(function(pt) { pt[0] += dx; pt[1] += dz; });
      _reDragStart.set(_reIsect.x, _reIsect.z);
      _reSyncMesh(_reSelIdx);
      _reShowHandles();
      _reRefreshPtList();
    }
  }
}

// ===== pointerup =====
function _reOnUp(e) {
  if (_reDragging) {
    _reDragging = false;
    _reDragMode = '';
    controls.enabled = true;
  }
}

// ===== 开关 =====
function toggleRoadEditor() {
  _reActive = !_reActive;
  if (_reActive) {
    if (activeEditor && activeEditor !== 'road') {
      if (activeEditor === 'green' && typeof closeGreenEditor === 'function') closeGreenEditor();
      if (activeEditor === 'building' && typeof closeBuildingEditor === 'function') closeBuildingEditor();
    }
    activeEditor = 'road';
  } else {
    activeEditor = null;
  }
  if (_rePanel) _rePanel.classList.toggle('show', _reActive);
  if (_reActive) {
    _reRefreshList();
    _reRefreshProps();
    if (_reSelIdx >= 0) _reShowHandles();
    var infoCard = document.getElementById('info-card');
    if (infoCard) infoCard.classList.remove('show');
  } else {
    _reSelIdx = -1;
    _reSelPt = -1;
    _reClearHandles();
    document.getElementById('re-export-box').style.display = 'none';
  }
}

// 外部调用：关闭道路编辑器
function closeRoadEditor() {
  if (!_reActive) return;
  _reActive = false;
  activeEditor = null;
  if (_rePanel) _rePanel.classList.remove('show');
  _reSelIdx = -1;
  _reSelPt = -1;
  _reClearHandles();
  document.getElementById('re-export-box').style.display = 'none';
}

// ===== 初始化 =====
function initRoadEditor() {
  _reInjectCSS();
  _reBuildPanel();

  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (typeof freeRoamMode !== 'undefined' && freeRoamMode) return;
    if (e.code === 'KeyR') {
      toggleRoadEditor();
    }
  });

  renderer.domElement.addEventListener('pointerdown', _reOnDown, true);
  window.addEventListener('pointermove', _reOnMove);
  window.addEventListener('pointerup', _reOnUp);
}
