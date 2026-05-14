/* ============================================================
   建筑可视化编辑器
   按 B 键打开/关闭，支持：选中、拖拽移动、面板调参、GLB 导入、导出代码
   依赖：core.js, buildings.js（BUILDING_DATA, buildingMeshes, buildStructure）
   ============================================================ */

// ===== 状态 =====
var _beActive = false;
var _beSelIdx = -1;
var _beDragging = false;
var _bePanel = null;
var _beHighlight = null;
var _bePlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
var _beIsect = new THREE.Vector3();
var _beDragOffset = new THREE.Vector2();
var _beGLBCache = {};   // filename → THREE.Group（克隆源）

// ===== GLTFLoader + DRACOLoader（全局复用） =====
var _beGLTFLoader = null;
function _beGetLoader() {
  if (_beGLTFLoader) return _beGLTFLoader;
  _beGLTFLoader = new THREE.GLTFLoader();
  if (typeof THREE.DRACOLoader !== 'undefined') {
    var draco = new THREE.DRACOLoader();
    draco.setDecoderPath('https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/libs/draco/');
    _beGLTFLoader.setDRACOLoader(draco);
  }
  return _beGLTFLoader;
}

// ===== 样式注入 =====
function _beInjectCSS() {
  var style = document.createElement('style');
  style.textContent = '\
#be-panel {\
  position:fixed; top:80px; right:16px; width:320px; max-height:calc(100vh - 110px);\
  padding:14px 16px; z-index:50; display:none;\
  overflow-y:auto; font-size:13px;\
  background:rgba(12,22,36,0.88); backdrop-filter:blur(14px) saturate(140%);\
  border:1px solid rgba(255,180,80,0.3); border-radius:12px;\
  box-shadow:0 8px 32px rgba(0,10,25,0.6); color:#cfe8ff;\
}\
#be-panel.show { display:block; }\
#be-panel h2 { font-size:14px; color:#ffb050; margin:0 0 10px; font-weight:600; letter-spacing:1px; }\
#be-panel .be-hint { font-size:11px; color:#6a8aa8; margin-bottom:10px; }\
#be-panel .be-toolbar { display:flex; gap:6px; margin-bottom:10px; flex-wrap:wrap; }\
#be-panel .be-btn {\
  flex:1; min-width:60px; padding:6px 0; font-size:11px; text-align:center;\
  color:#cfe8ff; background:rgba(255,180,80,0.1);\
  border:1px solid rgba(255,180,80,0.25); border-radius:6px;\
  cursor:pointer; font-family:inherit; transition:all .15s;\
}\
#be-panel .be-btn:hover { background:rgba(255,180,80,0.25); color:#fff; }\
#be-panel .be-btn.danger { border-color:rgba(255,100,100,0.3); color:#ff9090; }\
#be-panel .be-list { max-height:180px; overflow-y:auto; margin-bottom:10px;\
  border:1px solid rgba(255,180,80,0.15); border-radius:6px; }\
#be-panel .be-item {\
  padding:5px 8px; cursor:pointer; font-size:12px;\
  border-bottom:1px solid rgba(255,180,80,0.08); transition:background .1s;\
}\
#be-panel .be-item:hover { background:rgba(255,180,80,0.1); }\
#be-panel .be-item.sel { background:rgba(255,180,80,0.2); color:#ffcc80; }\
#be-panel .be-item .zone { font-size:10px; color:#6a8aa8; margin-left:6px; }\
#be-panel .be-props { display:none; }\
#be-panel .be-props.show { display:block; }\
#be-panel .be-row { display:flex; align-items:center; gap:8px; margin-bottom:6px; }\
#be-panel .be-row label { width:50px; font-size:11px; color:#8ab8d8; flex-shrink:0; }\
#be-panel .be-row input, #be-panel .be-row select {\
  flex:1; padding:4px 6px; font-size:12px; background:rgba(255,255,255,0.06);\
  border:1px solid rgba(255,180,80,0.2); border-radius:4px; color:#cfe8ff;\
  font-family:inherit; outline:none;\
}\
#be-panel .be-row input:focus, #be-panel .be-row select:focus { border-color:#ffb050; }\
#be-panel .be-section { font-size:12px; color:#ffb050; margin:10px 0 6px; font-weight:600; }\
#be-panel .be-glb-status { font-size:11px; margin:4px 0 8px; }\
#be-panel .be-glb-ok { color:#80ff90; }\
#be-panel .be-glb-err { color:#ff8080; }\
#be-export-box {\
  display:none; position:fixed; top:50%; left:50%; transform:translate(-50%,-50%);\
  width:520px; max-height:70vh; z-index:100;\
  background:rgba(12,22,36,0.95); backdrop-filter:blur(14px);\
  border:1px solid rgba(255,180,80,0.3); border-radius:12px;\
  padding:16px; box-shadow:0 12px 48px rgba(0,0,0,0.7);\
}\
#be-export-box textarea {\
  width:100%; height:280px; background:rgba(0,0,0,0.4); color:#cfe8ff;\
  border:1px solid rgba(255,180,80,0.2); border-radius:6px; padding:8px;\
  font-family:"Consolas","Monaco",monospace; font-size:11px; resize:vertical;\
}\
#be-export-box .be-toolbar { display:flex; gap:8px; margin-top:8px; justify-content:flex-end; }\
';
  document.head.appendChild(style);
}

// ===== 构建面板 =====
function _beBuildPanel() {
  var panel = document.createElement('div');
  panel.id = 'be-panel';
  panel.innerHTML = '\
<h2>🏢 建筑编辑器</h2>\
<div class="be-hint">B 键关闭 · 点击选中建筑 · 拖拽移动</div>\
<div class="be-toolbar">\
  <button class="be-btn" id="be-add">＋新增</button>\
  <button class="be-btn danger" id="be-del">删除</button>\
  <button class="be-btn" id="be-save" style="background:rgba(80,200,120,0.2);border-color:rgba(80,200,120,0.4)">💾 保存</button>\
  <button class="be-btn" id="be-export">导出代码</button>\
  <button class="be-btn" id="be-copy">复制</button>\
</div>\
<div class="be-list" id="be-list"></div>\
<div class="be-props" id="be-props">\
  <div class="be-section">基本属性</div>\
  <div class="be-row"><label>名称</label><input id="be-name" type="text"></div>\
  <div class="be-row"><label>X</label><input id="be-x" type="number" step="1"></div>\
  <div class="be-row"><label>Z</label><input id="be-z" type="number" step="1"></div>\
  <div class="be-row"><label>宽 W</label><input id="be-w" type="number" step="1" min="1"></div>\
  <div class="be-row"><label>深 D</label><input id="be-d" type="number" step="1" min="1"></div>\
  <div class="be-row"><label>高 H</label><input id="be-h" type="number" step="1" min="1"></div>\
  <div class="be-row"><label>形状</label><select id="be-shape">\
    <option value="rect">rect 矩形</option>\
    <option value="library">library 图书馆</option>\
    <option value="L">L 形</option>\
    <option value="gate">gate 校门</option>\
  </select></div>\
  <div class="be-row"><label>颜色</label><input id="be-color" type="text" placeholder="0xe8dcc4"></div>\
  <div class="be-row"><label>区域</label><input id="be-zone" type="text"></div>\
  <div class="be-row"><label>优先</label><select id="be-pri">\
    <option value="high">high</option>\
    <option value="medium">medium</option>\
    <option value="low">low</option>\
  </select></div>\
  <div class="be-section">GLB 模型替换</div>\
  <div class="be-row"><label>文件名</label><input id="be-glb" type="text" placeholder="如 gate.glb"></div>\
  <div class="be-row"><label>缩放</label><input id="be-glb-scale" type="number" step="0.1" min="0.1" value="1"></div>\
  <div class="be-row"><label>旋转°</label><input id="be-glb-roty" type="number" step="15" value="0"></div>\
  <div class="be-toolbar">\
    <button class="be-btn" id="be-glb-load">加载 GLB</button>\
    <button class="be-btn danger" id="be-glb-remove">移除 GLB</button>\
  </div>\
  <div class="be-glb-status" id="be-glb-status"></div>\
</div>';
  document.body.appendChild(panel);
  _bePanel = panel;

  // 导出框
  var ebox = document.createElement('div');
  ebox.id = 'be-export-box';
  ebox.innerHTML = '<textarea id="be-export-text" readonly></textarea>\
<div class="be-toolbar">\
  <button class="be-btn" id="be-export-copy">复制到剪贴板</button>\
  <button class="be-btn" id="be-export-close">关闭</button>\
</div>';
  document.body.appendChild(ebox);

  // ===== 事件绑定 =====
  document.getElementById('be-add').onclick = _beAdd;
  document.getElementById('be-del').onclick = _beDelete;
  document.getElementById('be-save').onclick = function() { editorSaveAll(); };
  document.getElementById('be-export').onclick = _beShowExport;
  document.getElementById('be-copy').onclick = _beCopySel;
  document.getElementById('be-export-copy').onclick = function() {
    var ta = document.getElementById('be-export-text');
    ta.select(); document.execCommand('copy');
  };
  document.getElementById('be-export-close').onclick = function() {
    document.getElementById('be-export-box').style.display = 'none';
  };
  document.getElementById('be-glb-load').onclick = function() { if (_beSelIdx >= 0) _beLoadGLB(_beSelIdx); };
  document.getElementById('be-glb-remove').onclick = function() { if (_beSelIdx >= 0) _beRemoveGLB(_beSelIdx); };

  // 属性输入变化 → 同步
  ['be-name','be-x','be-z','be-w','be-d','be-h','be-shape','be-color','be-zone','be-pri'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', function() { _beApplyProps(); });
  });
  ['be-glb-scale','be-glb-roty'].forEach(function(id) {
    document.getElementById(id).addEventListener('change', function() {
      if (_beSelIdx < 0) return;
      var info = BUILDING_DATA[_beSelIdx];
      if (!info.glb) return;
      info.glbScale = parseFloat(document.getElementById('be-glb-scale').value) || 1;
      info.glbRotY = parseFloat(document.getElementById('be-glb-roty').value) || 0;
      _beSyncMesh(_beSelIdx);
    });
  });
}

// ===== 列表刷新 =====
function _beRefreshList() {
  var list = document.getElementById('be-list');
  if (!list) return;
  var html = '';
  BUILDING_DATA.forEach(function(info, i) {
    var cls = (i === _beSelIdx) ? 'be-item sel' : 'be-item';
    html += '<div class="' + cls + '" data-idx="' + i + '">' +
      info.name + '<span class="zone">' + info.zone + '</span></div>';
  });
  list.innerHTML = html;
  // 绑定点击
  list.querySelectorAll('.be-item').forEach(function(el) {
    el.onclick = function() {
      _beSelIdx = parseInt(el.dataset.idx);
      _beRefreshList();
      _beRefreshProps();
      _beUpdateHighlight();
    };
  });
}

// ===== 属性面板刷新 =====
function _beRefreshProps() {
  var props = document.getElementById('be-props');
  if (!props) return;
  if (_beSelIdx < 0 || _beSelIdx >= BUILDING_DATA.length) {
    props.classList.remove('show');
    return;
  }
  props.classList.add('show');
  var info = BUILDING_DATA[_beSelIdx];
  document.getElementById('be-name').value = info.name;
  document.getElementById('be-x').value = info.x;
  document.getElementById('be-z').value = info.z;
  document.getElementById('be-w').value = info.w;
  document.getElementById('be-d').value = info.d;
  document.getElementById('be-h').value = info.h;
  document.getElementById('be-shape').value = info.shape;
  document.getElementById('be-color').value = '0x' + info.color.toString(16).padStart(6, '0');
  document.getElementById('be-zone').value = info.zone;
  document.getElementById('be-pri').value = info.pri;
  // GLB 字段
  document.getElementById('be-glb').value = info.glb || '';
  document.getElementById('be-glb-scale').value = info.glbScale || 1;
  document.getElementById('be-glb-roty').value = info.glbRotY || 0;
  var status = document.getElementById('be-glb-status');
  if (info.glb) {
    status.innerHTML = '<span class="be-glb-ok">✔ 已加载: ' + info.glb + '</span>';
  } else {
    status.innerHTML = '';
  }
}

// ===== 从面板读取并应用属性 =====
function _beApplyProps() {
  if (_beSelIdx < 0) return;
  var info = BUILDING_DATA[_beSelIdx];
  info.name = document.getElementById('be-name').value;
  info.x = parseFloat(document.getElementById('be-x').value) || 0;
  info.z = parseFloat(document.getElementById('be-z').value) || 0;
  info.w = parseFloat(document.getElementById('be-w').value) || 10;
  info.d = parseFloat(document.getElementById('be-d').value) || 10;
  info.h = parseFloat(document.getElementById('be-h').value) || 10;
  info.shape = document.getElementById('be-shape').value;
  var cStr = document.getElementById('be-color').value.trim();
  info.color = parseInt(cStr, 16) || parseInt(cStr.replace('0x',''), 16) || 0xd0d0d0;
  info.zone = document.getElementById('be-zone').value;
  info.pri = document.getElementById('be-pri').value;
  _beSyncMesh(_beSelIdx);
  _beRefreshList();
}

// ===== Mesh 同步 =====
function _beSyncMesh(idx) {
  var info = BUILDING_DATA[idx];
  var oldGroup = buildingMeshes[idx];

  // 从 layerGroups + interactables 移除旧 mesh
  if (oldGroup) {
    layerGroups.buildings.remove(oldGroup);
    var iIdx = interactables.indexOf(oldGroup);
    if (iIdx !== -1) interactables.splice(iIdx, 1);
  }

  var newGroup;
  if (info.glb && _beGLBCache[info.glb]) {
    // 使用 GLB 模型
    newGroup = _beGLBCache[info.glb].clone();
    // 自动缩放：目标高度 / 原始高度 × 用户缩放
    var origH = _beGLBCache[info.glb].userData._origH || 1;
    var autoScale = info.h / origH;
    var userScale = info.glbScale || 1;
    var finalScale = autoScale * userScale;
    newGroup.scale.set(finalScale, finalScale, finalScale);
    newGroup.rotation.y = (info.glbRotY || 0) * Math.PI / 180;
    newGroup.position.set(info.x, 0, info.z);
  } else {
    // 程序化建筑
    newGroup = buildStructure(info);
  }

  newGroup.userData = { id: info.id, name: info.name, type: info.zone, desc: info.desc || '' };
  layerGroups.buildings.add(newGroup);
  interactables.push(newGroup);
  buildingMeshes[idx] = newGroup;
  _beUpdateHighlight();
}

// ===== base64 → ArrayBuffer =====
function _beBase64ToArrayBuffer(b64) {
  var bin = atob(b64);
  var buf = new ArrayBuffer(bin.length);
  var view = new Uint8Array(buf);
  for (var i = 0; i < bin.length; i++) view[i] = bin.charCodeAt(i);
  return buf;
}

// ===== 处理加载后的 GLTF 结果 =====
function _beProcessGLTF(gltf, filename, idx) {
  var info = BUILDING_DATA[idx];
  var status = document.getElementById('be-glb-status');
  var model = gltf.scene;

  // 计算原始高度（不预缩放，保持原始尺寸缓存）
  var box = new THREE.Box3().setFromObject(model);
  var actualH = box.max.y - box.min.y;

  // 把模型底部对齐 y=0（用原始尺寸的偏移）
  model.position.y = -box.min.y;

  model.traverse(function(c) {
    if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
  });

  var wrapper = new THREE.Group();
  wrapper.add(model);
  // 记录原始高度，供 _beSyncMesh 计算 autoScale
  wrapper.userData._origH = actualH > 0 ? actualH : 1;
  _beGLBCache[filename] = wrapper;

  info.glb = filename;
  info.glbScale = parseFloat(document.getElementById('be-glb-scale').value) || 1;
  info.glbRotY = parseFloat(document.getElementById('be-glb-roty').value) || 0;
  _beSyncMesh(idx);
  if (status) status.innerHTML = '<span class="be-glb-ok">✔ 已加载: ' + filename + '</span>';
  _beRefreshProps();
}

// ===== GLB 加载（优先 glb_cache.js 内存，回退 HTTP 文件） =====
function _beLoadGLB(idx) {
  var filename = document.getElementById('be-glb').value.trim();
  if (!filename) return;
  var info = BUILDING_DATA[idx];
  var status = document.getElementById('be-glb-status');
  status.innerHTML = '<span style="color:#88bbff">加载中…</span>';

  // 1. 已解析缓存
  if (_beGLBCache[filename]) {
    info.glb = filename;
    info.glbScale = parseFloat(document.getElementById('be-glb-scale').value) || 1;
    info.glbRotY = parseFloat(document.getElementById('be-glb-roty').value) || 0;
    _beSyncMesh(idx);
    status.innerHTML = '<span class="be-glb-ok">✔ 已加载: ' + filename + '</span>';
    return;
  }

  var loader = _beGetLoader();

  // 2. glb_cache.js base64 缓存（file:// 也能用）
  if (typeof GLB_CACHE !== 'undefined' && GLB_CACHE[filename]) {
    var buf = _beBase64ToArrayBuffer(GLB_CACHE[filename]);
    loader.parse(buf, '', function(gltf) {
      _beProcessGLTF(gltf, filename, idx);
    }, function(err) {
      console.warn('[BuildingEditor] GLB parse 失败:', filename, err);
      status.innerHTML = '<span class="be-glb-err">✘ 解析失败: ' + filename + '</span>';
    });
    return;
  }

  // 3. HTTP 加载（localhost 下可用）
  loader.load('./assets/' + filename, function(gltf) {
    _beProcessGLTF(gltf, filename, idx);
  }, undefined, function(err) {
    console.warn('[BuildingEditor] GLB 加载失败:', filename, err);
    status.innerHTML = '<span class="be-glb-err">✘ 加载失败: ' + filename + '<br>file:// 需先运行 tools/build_glb_cache.bat</span>';
  });
}

// ===== 移除 GLB =====
function _beRemoveGLB(idx) {
  var info = BUILDING_DATA[idx];
  delete info.glb;
  delete info.glbScale;
  delete info.glbRotY;
  _beSyncMesh(idx);
  _beRefreshProps();
}

// ===== 高亮 =====
function _beUpdateHighlight() {
  if (_beHighlight) { scene.remove(_beHighlight); _beHighlight = null; }
  if (_beSelIdx < 0 || !buildingMeshes[_beSelIdx]) return;
  var mesh = buildingMeshes[_beSelIdx];
  var box = new THREE.Box3().setFromObject(mesh);
  var size = new THREE.Vector3();
  var center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);
  var geo = new THREE.BoxGeometry(size.x + 1, size.y + 1, size.z + 1);
  var edges = new THREE.EdgesGeometry(geo);
  _beHighlight = new THREE.LineSegments(edges,
    new THREE.LineBasicMaterial({ color: 0xffb050, linewidth: 2 }));
  _beHighlight.position.copy(center);
  scene.add(_beHighlight);
}

// ===== 新增建筑 =====
function _beAdd() {
  var cx = controls.target.x;
  var cz = controls.target.z;
  var newId = 'CUSTOM-' + Date.now();
  var info = {
    id: newId, name: '新建筑', x: Math.round(cx), z: Math.round(cz),
    w: 20, d: 14, h: 16, shape: 'rect', color: 0xd8d0c8,
    zone: '自定义', pri: 'medium', desc: '用户新增建筑。'
  };
  BUILDING_DATA.push(info);
  var group = buildStructure(info);
  group.userData = { id: info.id, name: info.name, type: info.zone, desc: info.desc };
  layerGroups.buildings.add(group);
  interactables.push(group);
  buildingMeshes.push(group);
  _beSelIdx = BUILDING_DATA.length - 1;
  _beRefreshList();
  _beRefreshProps();
  _beUpdateHighlight();
}

// ===== 删除建筑 =====
function _beDelete() {
  if (_beSelIdx < 0) return;
  var group = buildingMeshes[_beSelIdx];
  if (group) {
    layerGroups.buildings.remove(group);
    var iIdx = interactables.indexOf(group);
    if (iIdx !== -1) interactables.splice(iIdx, 1);
  }
  BUILDING_DATA.splice(_beSelIdx, 1);
  buildingMeshes.splice(_beSelIdx, 1);
  _beSelIdx = -1;
  _beRefreshList();
  _beRefreshProps();
  _beUpdateHighlight();
}

// ===== 复制选中建筑 =====
function _beCopySel() {
  if (_beSelIdx < 0) return;
  var src = BUILDING_DATA[_beSelIdx];
  var info = JSON.parse(JSON.stringify(src));
  info.id = 'COPY-' + Date.now();
  info.name = src.name + ' (复制)';
  info.x += 15;
  BUILDING_DATA.push(info);
  var group = buildStructure(info);
  group.userData = { id: info.id, name: info.name, type: info.zone, desc: info.desc || '' };
  layerGroups.buildings.add(group);
  interactables.push(group);
  buildingMeshes.push(group);
  _beSelIdx = BUILDING_DATA.length - 1;
  _beRefreshList();
  _beRefreshProps();
  _beUpdateHighlight();
}

// ===== 导出 =====
function _beShowExport() {
  var lines = ['const BUILDING_DATA = ['];
  BUILDING_DATA.forEach(function(info, i) {
    var s = '  { id:"' + info.id + '", name:"' + info.name + '", x:' + info.x + ', z:' + info.z +
      ', w:' + info.w + ', d:' + info.d + ', h:' + info.h +
      ', shape:"' + info.shape + '", color:0x' + info.color.toString(16).padStart(6,'0') +
      ', zone:"' + info.zone + '", pri:"' + info.pri + '"';
    if (info.glb) {
      s += ', glb:"' + info.glb + '", glbScale:' + (info.glbScale || 1) + ', glbRotY:' + (info.glbRotY || 0);
    }
    s += ', desc:"' + (info.desc || '').replace(/"/g, '\\"') + '" }' + (i < BUILDING_DATA.length - 1 ? ',' : '');
    lines.push(s);
  });
  lines.push('];');
  document.getElementById('be-export-text').value = lines.join('\n');
  document.getElementById('be-export-box').style.display = 'block';
}

// ===== 场景交互：pointerdown =====
function _beOnDown(e) {
  if (!_beActive) return;
  // 排除面板内点击
  if (e.target.closest('#be-panel') || e.target.closest('#be-export-box')) return;
  if (e.button !== 0) return;

  var rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  // 射线检测建筑
  var hits = [];
  buildingMeshes.forEach(function(m, i) {
    if (!m) return;
    var arr = raycaster.intersectObject(m, true);
    if (arr.length > 0) hits.push({ idx: i, dist: arr[0].distance });
  });
  hits.sort(function(a, b) { return a.dist - b.dist; });

  if (hits.length > 0) {
    e.stopPropagation();
    _beSelIdx = hits[0].idx;
    _beRefreshList();
    _beRefreshProps();
    _beUpdateHighlight();

    // 准备拖拽
    raycaster.ray.intersectPlane(_bePlane, _beIsect);
    _beDragOffset.set(
      BUILDING_DATA[_beSelIdx].x - _beIsect.x,
      BUILDING_DATA[_beSelIdx].z - _beIsect.z
    );
    _beDragging = true;
    controls.enabled = false;
  } else {
    _beSelIdx = -1;
    _beRefreshList();
    _beRefreshProps();
    _beUpdateHighlight();
  }
}

// ===== pointermove =====
function _beOnMove(e) {
  if (!_beActive || !_beDragging || _beSelIdx < 0) return;
  var rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);
  raycaster.ray.intersectPlane(_bePlane, _beIsect);

  var nx = Math.round(_beIsect.x + _beDragOffset.x);
  var nz = Math.round(_beIsect.z + _beDragOffset.y);
  BUILDING_DATA[_beSelIdx].x = nx;
  BUILDING_DATA[_beSelIdx].z = nz;

  // 直接移动 group（不完整重建，拖拽中更流畅）
  var mesh = buildingMeshes[_beSelIdx];
  if (mesh) mesh.position.set(nx, 0, nz);
  _beUpdateHighlight();

  // 面板同步
  document.getElementById('be-x').value = nx;
  document.getElementById('be-z').value = nz;
}

// ===== pointerup =====
function _beOnUp(e) {
  if (_beDragging) {
    _beDragging = false;
    controls.enabled = true;
  }
}

// ===== 开关 =====
function toggleBuildingEditor() {
  _beActive = !_beActive;
  if (_beActive) {
    // 互斥
    if (activeEditor && activeEditor !== 'building') {
      if (activeEditor === 'green' && typeof closeGreenEditor === 'function') closeGreenEditor();
      if (activeEditor === 'road' && typeof closeRoadEditor === 'function') closeRoadEditor();
    }
    activeEditor = 'building';
  } else {
    activeEditor = null;
  }
  if (_bePanel) _bePanel.classList.toggle('show', _beActive);
  if (_beActive) {
    _beRefreshList();
    _beRefreshProps();
    var infoCard = document.getElementById('info-card');
    if (infoCard) infoCard.classList.remove('show');
  } else {
    _beSelIdx = -1;
    _beUpdateHighlight();
    document.getElementById('be-export-box').style.display = 'none';
  }
  _editorUpdateIOBtns();
}

// 外部调用：关闭建筑编辑器
function closeBuildingEditor() {
  if (!_beActive) return;
  _beActive = false;
  activeEditor = null;
  if (_bePanel) _bePanel.classList.remove('show');
  _beSelIdx = -1;
  _beUpdateHighlight();
  document.getElementById('be-export-box').style.display = 'none';
  _editorUpdateIOBtns();
}

// ===== 初始化 =====
function initBuildingEditor() {
  _beInjectCSS();
  _beBuildPanel();

  // 按键 B 切换
  document.addEventListener('keydown', function(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
    if (typeof freeRoamMode !== 'undefined' && freeRoamMode) return;
    if (e.code === 'KeyB') {
      toggleBuildingEditor();
    }
  });

  // 场景交互
  renderer.domElement.addEventListener('pointerdown', _beOnDown, true);
  window.addEventListener('pointermove', _beOnMove);
  window.addEventListener('pointerup', _beOnUp);
}

// ===== 启动时自动加载 BUILDING_DATA 中已有 glb 字段的模型 =====
function _autoLoadGLBFromData() {
  // 收集需要加载的不重复文件名
  var needed = {};
  BUILDING_DATA.forEach(function(info, idx) {
    if (info.glb && !_beGLBCache[info.glb]) {
      if (!needed[info.glb]) needed[info.glb] = [];
      needed[info.glb].push(idx);
    }
  });
  var filenames = Object.keys(needed);
  if (filenames.length === 0) return;

  var loader = _beGetLoader();
  filenames.forEach(function(filename) {
    var idxList = needed[filename];

    // 优先从 glb_cache.js 的 base64 加载
    if (typeof GLB_CACHE !== 'undefined' && GLB_CACHE[filename]) {
      var buf = _beBase64ToArrayBuffer(GLB_CACHE[filename]);
      loader.parse(buf, '', function(gltf) {
        _beCacheGLTF(gltf, filename);
        idxList.forEach(function(idx) { _beSyncMesh(idx); });
      }, function(err) {
        console.warn('[AutoGLB] parse 失败:', filename, err);
      });
      return;
    }

    // 回退 HTTP
    loader.load('./assets/' + filename, function(gltf) {
      _beCacheGLTF(gltf, filename);
      idxList.forEach(function(idx) { _beSyncMesh(idx); });
    }, undefined, function(err) {
      console.warn('[AutoGLB] 加载失败:', filename, err);
    });
  });
}

// 将 gltf 结果缓存（不带位置信息，克隆时再设）
function _beCacheGLTF(gltf, filename) {
  var model = gltf.scene;
  var box = new THREE.Box3().setFromObject(model);
  var actualH = box.max.y - box.min.y;
  // 不做自动缩放，保留原始大小，_beSyncMesh 里按 glbScale 处理
  model.position.y = -box.min.y;
  model.traverse(function(c) {
    if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
  });
  var wrapper = new THREE.Group();
  wrapper.add(model);
  // 存原始高度供 sync 时计算
  wrapper.userData._origH = actualH > 0 ? actualH : 1;
  _beGLBCache[filename] = wrapper;
}

