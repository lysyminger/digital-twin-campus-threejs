/* ============================================================
   草坪可视化编辑器
   按 G 键打开/关闭，支持：选中、拖拽移动、面板调参、新增/删除、导出代码
   依赖：core.js, terrain.js（GRASS_DATA, greenMeshes, buildGrassMesh）
   ============================================================ */

// ===== 状态 =====
var _geActive = false;
var _geSelIdx = -1;
var _geDragging = false;
var _gePanel = null;
var _geHighlight = null;   // 选中高亮框
var _gePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);  // y=0 地平面
var _geIsect = new THREE.Vector3();
var _geDragOffset = new THREE.Vector2();  // 拖拽偏移

// ===== 样式注入 =====
function _geInjectCSS() {
  var style = document.createElement('style');
  style.textContent = '\
#ge-panel {\
  position:fixed; top:80px; right:16px; width:300px; max-height:calc(100vh - 110px);\
  padding:14px 16px; z-index:50; display:none;\
  overflow-y:auto; font-size:13px;\
  background:rgba(12,22,36,0.88); backdrop-filter:blur(14px) saturate(140%);\
  border:1px solid rgba(120,200,255,0.25); border-radius:12px;\
  box-shadow:0 8px 32px rgba(0,10,25,0.6); color:#cfe8ff;\
}\
#ge-panel.show { display:block; }\
#ge-panel h2 { font-size:14px; color:#78c8ff; margin:0 0 10px; font-weight:600; letter-spacing:1px; }\
#ge-panel .ge-hint { font-size:11px; color:#6a8aa8; margin-bottom:10px; }\
#ge-panel .ge-toolbar { display:flex; gap:6px; margin-bottom:10px; }\
#ge-panel .ge-btn {\
  flex:1; padding:6px 0; font-size:11px; text-align:center;\
  color:#cfe8ff; background:rgba(120,200,255,0.1);\
  border:1px solid rgba(120,200,255,0.25); border-radius:6px;\
  cursor:pointer; font-family:inherit; transition:all .15s;\
}\
#ge-panel .ge-btn:hover { background:rgba(120,200,255,0.25); color:#fff; }\
#ge-panel .ge-btn.danger { border-color:rgba(255,100,100,0.3); color:#ff9090; }\
#ge-panel .ge-btn.danger:hover { background:rgba(255,80,80,0.2); }\
#ge-panel .ge-btn.primary { background:#78c8ff; color:#051628; font-weight:600; border-color:#78c8ff; }\
#ge-list { max-height:180px; overflow-y:auto; margin-bottom:10px; }\
#ge-list .ge-item {\
  padding:5px 8px; cursor:pointer; border-radius:4px;\
  display:flex; justify-content:space-between; align-items:center;\
  font-size:12px; transition:background .1s;\
}\
#ge-list .ge-item:hover { background:rgba(120,200,255,0.1); }\
#ge-list .ge-item.sel { background:rgba(120,200,255,0.2); color:#78c8ff; font-weight:600; }\
#ge-list .ge-item .ge-type-badge {\
  font-size:10px; padding:1px 5px; border-radius:8px;\
  background:rgba(120,200,255,0.12); border:1px solid rgba(120,200,255,0.2);\
}\
#ge-props { border-top:1px solid rgba(120,200,255,0.15); padding-top:10px; }\
#ge-props .ge-row { display:flex; align-items:center; margin-bottom:6px; gap:6px; }\
#ge-props .ge-row label { width:40px; font-size:11px; color:#6a8aa8; flex-shrink:0; }\
#ge-props .ge-row input, #ge-props .ge-row select {\
  flex:1; padding:4px 6px; font-size:12px; color:#cfe8ff;\
  background:rgba(255,255,255,0.06); border:1px solid rgba(120,200,255,0.2);\
  border-radius:4px; outline:none; font-family:inherit;\
}\
#ge-props .ge-row input:focus, #ge-props .ge-row select:focus {\
  border-color:#78c8ff;\
}\
#ge-props .ge-row select { cursor:pointer; }\
#ge-props .ge-row select option { background:#0c1624; color:#cfe8ff; }\
#ge-colors { display:flex; gap:4px; flex-wrap:wrap; }\
#ge-colors .ge-color-swatch {\
  width:22px; height:22px; border-radius:4px; cursor:pointer;\
  border:2px solid transparent; transition:border-color .1s;\
}\
#ge-colors .ge-color-swatch.active { border-color:#fff; }\
#ge-colors .ge-color-swatch:hover { border-color:rgba(255,255,255,0.5); }\
#ge-export-box {\
  display:none; margin-top:10px; padding:8px;\
  background:rgba(0,0,0,0.3); border-radius:6px; font-size:11px;\
  max-height:200px; overflow-y:auto;\
}\
#ge-export-box pre {\
  white-space:pre-wrap; word-break:break-all; color:#8ab8d8; margin:0;\
  font-family:Consolas,"Courier New",monospace; font-size:11px; line-height:1.4;\
}\
';
  document.head.appendChild(style);
}

// ===== 颜色预设 =====
var GE_COLORS = [
  { name:'标准草绿', hex:0x6a9a5a },
  { name:'深绿',     hex:0x4a7a3a },
  { name:'花园绿',   hex:0x5d8f4e },
  { name:'嫩绿',     hex:0x5a8a4a },
  { name:'黄绿',     hex:0x7aaa5a },
  { name:'墨绿',     hex:0x3a6a3a },
];

// ===== 构建 UI 面板 =====
function _geBuildPanel() {
  var p = document.createElement('div');
  p.id = 'ge-panel';
  p.innerHTML = '\
<h2>草坪编辑器</h2>\
<div class="ge-hint">按 G 关闭 · 点击草坪选中 · 拖拽移动 · 右侧调参</div>\
<div class="ge-toolbar">\
  <button class="ge-btn" id="ge-add-rect">+ 矩形</button>\
  <button class="ge-btn" id="ge-add-circle">+ 圆形</button>\
  <button class="ge-btn danger" id="ge-del">删除</button>\
</div>\
<div id="ge-list"></div>\
<div id="ge-props"></div>\
<div class="ge-toolbar" style="margin-top:10px">\
  <button class="ge-btn primary" id="ge-save">💾 保存</button>\
  <button class="ge-btn" id="ge-export">导出代码</button>\
  <button class="ge-btn" id="ge-copy">复制到剪贴板</button>\
</div>\
<div id="ge-export-box"><pre id="ge-export-code"></pre></div>\
';
  document.body.appendChild(p);
  _gePanel = p;

  // 事件
  document.getElementById('ge-add-rect').addEventListener('click', function() { _geAddGrass('rect'); });
  document.getElementById('ge-add-circle').addEventListener('click', function() { _geAddGrass('circle'); });
  document.getElementById('ge-del').addEventListener('click', _geDeleteSelected);
  document.getElementById('ge-save').addEventListener('click', _geSave);
  document.getElementById('ge-export').addEventListener('click', _geExport);
  document.getElementById('ge-copy').addEventListener('click', _geCopyCode);

  // 阻止面板上的 pointer 事件冒泡到 canvas
  p.addEventListener('pointerdown', function(e) { e.stopPropagation(); });
}

// ===== 刷新列表 =====
function _geRefreshList() {
  var el = document.getElementById('ge-list');
  if (!el) return;
  var html = '';
  for (var i = 0; i < GRASS_DATA.length; i++) {
    var d = GRASS_DATA[i];
    var cls = (i === _geSelIdx) ? 'ge-item sel' : 'ge-item';
    html += '<div class="' + cls + '" data-idx="' + i + '">';
    html += '<span>' + d.name + '</span>';
    html += '<span class="ge-type-badge">' + d.type + '</span>';
    html += '</div>';
  }
  el.innerHTML = html;

  // 绑定点击
  el.querySelectorAll('.ge-item').forEach(function(item) {
    item.addEventListener('click', function() {
      _geSelect(parseInt(this.dataset.idx));
    });
  });
}

// ===== 选中 =====
function _geSelect(idx) {
  _geSelIdx = idx;
  _geRefreshList();
  _geRefreshProps();
  _geUpdateHighlight();

  // 滚动列表到选中项
  var el = document.querySelector('#ge-list .ge-item.sel');
  if (el) el.scrollIntoView({ block: 'nearest' });
}

// ===== 刷新属性面板 =====
function _geRefreshProps() {
  var el = document.getElementById('ge-props');
  if (!el) return;
  if (_geSelIdx < 0 || _geSelIdx >= GRASS_DATA.length) {
    el.innerHTML = '<div style="color:#6a8aa8;font-size:12px;text-align:center;padding:10px">点击草坪或列表项选中后编辑</div>';
    return;
  }
  var d = GRASS_DATA[_geSelIdx];
  var isCircle = (d.type === 'circle');

  var html = '';
  html += '<div class="ge-row"><label>名称</label><input id="ge-p-name" value="' + d.name + '"></div>';
  html += '<div class="ge-row"><label>类型</label><select id="ge-p-type"><option value="rect"' + (!isCircle?' selected':'') + '>矩形</option><option value="circle"' + (isCircle?' selected':'') + '>圆形</option></select></div>';
  html += '<div class="ge-row"><label>X</label><input id="ge-p-x" type="number" step="1" value="' + d.x + '"></div>';
  html += '<div class="ge-row"><label>Z</label><input id="ge-p-z" type="number" step="1" value="' + d.z + '"></div>';
  if (isCircle) {
    html += '<div class="ge-row"><label>半径</label><input id="ge-p-r" type="number" step="1" value="' + (d.r||20) + '"></div>';
  } else {
    html += '<div class="ge-row"><label>宽 W</label><input id="ge-p-w" type="number" step="1" value="' + (d.w||20) + '"></div>';
    html += '<div class="ge-row"><label>高 H</label><input id="ge-p-h" type="number" step="1" value="' + (d.h||20) + '"></div>';
  }
  html += '<div class="ge-row"><label>颜色</label><div id="ge-colors"></div></div>';
  el.innerHTML = html;

  // 颜色色板
  var colorsEl = document.getElementById('ge-colors');
  GE_COLORS.forEach(function(c) {
    var swatch = document.createElement('div');
    swatch.className = 'ge-color-swatch' + (d.color === c.hex ? ' active' : '');
    swatch.style.background = '#' + c.hex.toString(16).padStart(6, '0');
    swatch.title = c.name;
    swatch.addEventListener('click', function() {
      d.color = c.hex;
      _geSyncMesh(_geSelIdx);
      _geRefreshProps();
    });
    colorsEl.appendChild(swatch);
  });

  // 输入事件
  _geBind('ge-p-name', function(v) { d.name = v; _geSyncMesh(_geSelIdx); _geRefreshList(); });
  _geBind('ge-p-x', function(v) { d.x = parseFloat(v)||0; _geSyncMesh(_geSelIdx); });
  _geBind('ge-p-z', function(v) { d.z = parseFloat(v)||0; _geSyncMesh(_geSelIdx); });
  _geBind('ge-p-r', function(v) { d.r = parseFloat(v)||20; _geSyncMesh(_geSelIdx); });
  _geBind('ge-p-w', function(v) { d.w = parseFloat(v)||20; _geSyncMesh(_geSelIdx); });
  _geBind('ge-p-h', function(v) { d.h = parseFloat(v)||20; _geSyncMesh(_geSelIdx); });

  // 类型切换
  var typeEl = document.getElementById('ge-p-type');
  if (typeEl) {
    typeEl.addEventListener('change', function() {
      var newType = this.value;
      if (newType === d.type) return;
      d.type = newType;
      if (newType === 'circle') {
        d.r = Math.max(d.w || 20, d.h || 20) / 2;
        delete d.w; delete d.h;
      } else {
        d.w = (d.r || 20) * 2; d.h = (d.r || 20) * 2;
        delete d.r;
      }
      _geSyncMesh(_geSelIdx);
      _geRefreshProps();
    });
  }
}

// 通用输入绑定
function _geBind(id, cb) {
  var el = document.getElementById(id);
  if (!el) return;
  el.addEventListener('input', function() { cb(this.value); });
}

// ===== 同步 mesh（数据→场景） =====
function _geSyncMesh(idx) {
  if (idx < 0 || idx >= GRASS_DATA.length) return;
  var d = GRASS_DATA[idx];
  var oldMesh = greenMeshes[idx];

  // 从场景/interactables 移除旧 mesh
  if (oldMesh) {
    layerGroups.vegetation.remove(oldMesh);
    var iIdx = interactables.indexOf(oldMesh);
    if (iIdx >= 0) interactables.splice(iIdx, 1);
    if (oldMesh.geometry) oldMesh.geometry.dispose();
    if (oldMesh.material) oldMesh.material.dispose();
  }

  // 重建
  var mesh = buildGrassMesh(d);
  greenMeshes[idx] = mesh;
  layerGroups.vegetation.add(mesh);
  interactables.push(mesh);

  _geUpdateHighlight();
}

// ===== 高亮选中框 =====
function _geUpdateHighlight() {
  // 移除旧高亮
  if (_geHighlight) {
    scene.remove(_geHighlight);
    if (_geHighlight.geometry) _geHighlight.geometry.dispose();
    _geHighlight = null;
  }

  if (!_geActive || _geSelIdx < 0 || _geSelIdx >= greenMeshes.length) return;

  var mesh = greenMeshes[_geSelIdx];
  if (!mesh) return;

  var edges = new THREE.EdgesGeometry(mesh.geometry);
  _geHighlight = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({
    color: 0x78c8ff, linewidth: 2, depthTest: false
  }));
  _geHighlight.rotation.copy(mesh.rotation);
  _geHighlight.position.copy(mesh.position);
  _geHighlight.position.y = 0.15;  // 略高于草坪
  _geHighlight.renderOrder = 999;
  scene.add(_geHighlight);
}

// ===== 新增草坪 =====
function _geAddGrass(type) {
  // 放在相机注视点附近
  var tx = Math.round(controls.target.x);
  var tz = Math.round(controls.target.z);
  var d = {
    id: _grassNextId++,
    name: '新草坪_' + (GRASS_DATA.length + 1),
    type: type,
    x: tx, z: tz,
    color: 0x6a9a5a
  };
  if (type === 'circle') { d.r = 15; }
  else { d.w = 30; d.h = 20; }

  GRASS_DATA.push(d);
  var mesh = buildGrassMesh(d);
  greenMeshes.push(mesh);
  layerGroups.vegetation.add(mesh);
  interactables.push(mesh);

  _geSelect(GRASS_DATA.length - 1);
}

// ===== 删除选中 =====
function _geDeleteSelected() {
  if (_geSelIdx < 0 || _geSelIdx >= GRASS_DATA.length) return;

  var mesh = greenMeshes[_geSelIdx];
  if (mesh) {
    layerGroups.vegetation.remove(mesh);
    var iIdx = interactables.indexOf(mesh);
    if (iIdx >= 0) interactables.splice(iIdx, 1);
    if (mesh.geometry) mesh.geometry.dispose();
    if (mesh.material) mesh.material.dispose();
  }

  GRASS_DATA.splice(_geSelIdx, 1);
  greenMeshes.splice(_geSelIdx, 1);
  _geSelIdx = -1;
  _geRefreshList();
  _geRefreshProps();
  _geUpdateHighlight();
}

// ===== 导出代码 =====
// ===== 保存到 localStorage =====
function _geSave() {
  editorSaveAll();
}

function _geExport() {
  var box = document.getElementById('ge-export-box');
  var codeEl = document.getElementById('ge-export-code');
  if (!box || !codeEl) return;

  var lines = ['const GRASS_DATA = ['];
  GRASS_DATA.forEach(function(d, i) {
    var s = '  { id:' + d.id + ', name:\'' + d.name + '\', type:\'' + d.type + '\', ';
    s += 'x:' + d.x + ', z:' + d.z + ', ';
    if (d.type === 'circle') {
      s += 'r:' + (d.r||20) + ', ';
    } else {
      s += 'w:' + (d.w||20) + ', h:' + (d.h||20) + ', ';
    }
    s += 'color:0x' + (d.color||0x6a9a5a).toString(16).padStart(6,'0') + ' }';
    if (i < GRASS_DATA.length - 1) s += ',';
    lines.push(s);
  });
  lines.push('];');

  codeEl.textContent = lines.join('\n');
  box.style.display = 'block';
}

function _geCopyCode() {
  var codeEl = document.getElementById('ge-export-code');
  if (!codeEl) return;
  var text = codeEl.textContent;
  if (!text) { _geExport(); text = codeEl.textContent; }
  navigator.clipboard.writeText(text).then(function() {
    var btn = document.getElementById('ge-copy');
    if (btn) { btn.textContent = '已复制!'; setTimeout(function(){ btn.textContent = '复制到剪贴板'; }, 1500); }
  });
}

// ===== 场景交互：点击选中 + 拖拽移动 =====
function _geOnDown(e) {
  if (!_geActive) return;
  if (e.target !== renderer.domElement) return;

  var px = (e.clientX / window.innerWidth) * 2 - 1;
  var py = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(new THREE.Vector2(px, py), camera);

  // 检测是否点在草坪上
  var hits = raycaster.intersectObjects(greenMeshes, false);
  if (hits.length > 0) {
    var hitMesh = hits[0].object;
    var idx = greenMeshes.indexOf(hitMesh);
    if (idx >= 0) {
      _geSelect(idx);
      _geDragging = true;
      controls.enabled = false;
      // 计算拖拽偏移
      var d = GRASS_DATA[idx];
      raycaster.ray.intersectPlane(_gePlane, _geIsect);
      _geDragOffset.set(d.x - _geIsect.x, d.z - _geIsect.z);
      e.stopPropagation();
      return;
    }
  }

  // 点击空地 → 取消选中
  _geSelect(-1);
}

function _geOnMove(e) {
  if (!_geActive || !_geDragging || _geSelIdx < 0) return;

  var px = (e.clientX / window.innerWidth) * 2 - 1;
  var py = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(new THREE.Vector2(px, py), camera);

  if (raycaster.ray.intersectPlane(_gePlane, _geIsect)) {
    var d = GRASS_DATA[_geSelIdx];
    d.x = Math.round(_geIsect.x + _geDragOffset.x);
    d.z = Math.round(_geIsect.z + _geDragOffset.y);

    // 直接更新位置（不重建 mesh，更流畅）
    var mesh = greenMeshes[_geSelIdx];
    if (mesh) mesh.position.set(d.x, 0.01, d.z);
    if (_geHighlight) _geHighlight.position.set(d.x, 0.15, d.z);

    // 更新属性面板数值
    var xEl = document.getElementById('ge-p-x');
    var zEl = document.getElementById('ge-p-z');
    if (xEl) xEl.value = d.x;
    if (zEl) zEl.value = d.z;
  }
}

function _geOnUp() {
  if (_geDragging) {
    _geDragging = false;
    controls.enabled = true;
  }
}

// ===== 开关编辑器 =====
function toggleGreenEditor() {
  _geActive = !_geActive;
  if (_geActive) {
    // 互斥：关闭其他编辑器
    if (activeEditor && activeEditor !== 'green') {
      if (activeEditor === 'building' && typeof closeBuildingEditor === 'function') closeBuildingEditor();
      if (activeEditor === 'road' && typeof closeRoadEditor === 'function') closeRoadEditor();
    }
    activeEditor = 'green';
  } else {
    activeEditor = null;
  }
  if (_gePanel) _gePanel.classList.toggle('show', _geActive);
  if (_geActive) {
    _geRefreshList();
    _geRefreshProps();
    // 隐藏信息卡避免干扰
    var infoCard = document.getElementById('info-card');
    if (infoCard) infoCard.classList.remove('show');
  } else {
    _geSelIdx = -1;
    _geUpdateHighlight();
    // 隐藏导出框
    var box = document.getElementById('ge-export-box');
    if (box) box.style.display = 'none';
  }
}
// 外部调用：关闭草坪编辑器（被其他编辑器互斥时用）
function closeGreenEditor() {
  if (!_geActive) return;
  _geActive = false;
  activeEditor = null;
  if (_gePanel) _gePanel.classList.remove('show');
  _geSelIdx = -1;
  _geUpdateHighlight();
  var box = document.getElementById('ge-export-box');
  if (box) box.style.display = 'none';
}

// ===== 初始化 =====
function initGreenEditor() {
  _geInjectCSS();
  _geBuildPanel();

  // 全局按键 G 切换（排除输入框中按 G）
  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (typeof freeRoamMode !== 'undefined' && freeRoamMode) return;
    if (e.code === 'KeyG') {
      toggleGreenEditor();
    }
  });

  // 场景交互（capture 阶段优先于 OrbitControls + ui.js 的 pointerdown）
  renderer.domElement.addEventListener('pointerdown', _geOnDown, true);
  window.addEventListener('pointermove', _geOnMove);
  window.addEventListener('pointerup', _geOnUp);
}
