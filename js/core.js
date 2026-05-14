/* ============================================================
   核心：全局状态 + initScene + 共用工具函数
   坐标系：1 unit ≈ 1 m  |  原点 = 贺田图书馆  |  北 = -Z，东 = +X
   依赖：vendor/three.min.js, vendor/OrbitControls.js（先加载）
   ============================================================ */

// ===== 全局状态（跨模块共享） =====
let scene, camera, renderer, controls;
let raycaster, pointer;
let sun, ambient;
let lastFrame = performance.now();
let frameCount = 0, fpsTimer = 0;
let currentView = 'persp';                // 'persp' | 'top' | 'tour'

var activeEditor = null;                  // 'green' | 'road' | 'building' | null（互斥）
const buildingMeshes = [];                // 与 BUILDING_DATA 平行，编辑器用
const interactables = [];                 // 所有可点击对象
const layerGroups = {                     // 图层分组
  ground:     new THREE.Group(),
  roads:      new THREE.Group(),
  buildings:  new THREE.Group(),
  vegetation: new THREE.Group(),
  facilities: new THREE.Group(),
  aiModels:   new THREE.Group()
};

// ===== 共用材质工厂 =====
// 贴地薄片材质：polygonOffset 防止 z-fighting
// priority 越大越靠近相机：1=绿地，2=道路，3=球场/跑道，4=跑道内场
function overlayMat(color, priority) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    polygonOffset: true,
    polygonOffsetFactor: -priority,
    polygonOffsetUnits: -priority
  });
}

// ===== 场景初始化 =====
function initScene() {
  // 场景 + 雾
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 400, 1200);

  // 相机（透视）near=1 提升远距离深度缓冲精度
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(55, aspect, 1, 2000);
  camera.position.set(260, 200, 260);
  camera.lookAt(0, 0, 0);

  // 渲染器
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('scene'),
    antialias: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;

  // OrbitControls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 20;
  controls.maxDistance = 600;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.target.set(0, 0, 0);

  // 光照
  ambient = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambient);

  sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.position.set(150, 220, 100);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left   = -500;
  sun.shadow.camera.right  =  500;
  sun.shadow.camera.top    =  500;
  sun.shadow.camera.bottom = -500;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far  = 800;
  scene.add(sun);

  // 图层组挂到场景
  Object.values(layerGroups).forEach(g => scene.add(g));

  // Raycaster
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
}

// ===== 编辑器统一保存/加载（JSON 文件下载 + 导入） =====

// 导出为 data/location.js 文件下载（script 标签加载兼容 file://）
function editorSaveAll() {
  var data = {
    _ver: 1,
    _time: new Date().toISOString(),
    grass: GRASS_DATA,
    buildings: BUILDING_DATA,
    roads: CAMPUS_ROADS.map(function(r) {
      return { id:r.id, name:r.name, type:r.type, width:r.width, points:r.points };
    })
  };
  var js = 'var LOCATION_DATA = ' + JSON.stringify(data, null, 2) + ';\n';
  var blob = new Blob([js], { type: 'application/javascript' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'location.js';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  _editorToast('✅ 已下载 location.js，放到 data/ 目录即可');
}

// 手动导入存档文件（支持 .js 和 .json）
function editorImportFile() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.js,.json';
  input.onchange = function() {
    var file = input.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var text = ev.target.result;
        // 兼容 .js 格式：去掉 var LOCATION_DATA = 前缀和末尾分号
        text = text.replace(/^var\s+LOCATION_DATA\s*=\s*/, '').replace(/;\s*$/, '');
        var data = JSON.parse(text);
        _editorApplyData(data);
        _editorToast('✅ 导入成功，正在重建场景…');
        setTimeout(function() { _editorRebuildAll(); }, 100);
      } catch(e) {
        console.error('[Import] 解析失败:', e);
        _editorToast('❌ 文件解析失败');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// 将数据写入全局数组
function _editorApplyData(data) {
  if (data.grass && Array.isArray(data.grass)) {
    GRASS_DATA.length = 0;
    data.grass.forEach(function(d) { GRASS_DATA.push(d); });
  }
  if (data.buildings && Array.isArray(data.buildings)) {
    BUILDING_DATA.length = 0;
    data.buildings.forEach(function(d) { BUILDING_DATA.push(d); });
  }
  if (data.roads && Array.isArray(data.roads)) {
    CAMPUS_ROADS.length = 0;
    data.roads.forEach(function(d) { CAMPUS_ROADS.push(d); });
  }
}

// 重建场景中所有可编辑对象
function _editorRebuildAll() {
  // 清除现有对象
  // 草坪
  while (greenMeshes.length > 0) {
    var m = greenMeshes.pop();
    layerGroups.ground.remove(m);
  }
  // 建筑
  while (buildingMeshes.length > 0) {
    var m = buildingMeshes.pop();
    layerGroups.buildings.remove(m);
    var iIdx = interactables.indexOf(m);
    if (iIdx !== -1) interactables.splice(iIdx, 1);
  }
  // 道路
  while (roadMeshes.length > 0) {
    var m = roadMeshes.pop();
    layerGroups.roads.remove(m);
    var iIdx = interactables.indexOf(m);
    if (iIdx !== -1) interactables.splice(iIdx, 1);
  }
  // 植被
  if (typeof grassVegMeshes !== 'undefined') {
    while (grassVegMeshes.length > 0) {
      var m = grassVegMeshes.pop();
      layerGroups.vegetation.remove(m);
    }
  }

  // 重新生成
  createGreenAreas();
  createBuildings();
  createCampusRoads();
  createTrees();

  // 重建后重跑当前时间，恢复夜间窗户/路灯亮灯状态
  if (typeof updateTimeOfDay === 'function') {
    var slider = document.getElementById('time-slider');
    if (slider) updateTimeOfDay(parseFloat(slider.value));
  }

  _editorToast('✅ 场景重建完成');
}

// 启动时自动加载（location.js 通过 script 标签在 index.html 中加载，
// 如果存在则 LOCATION_DATA 全局变量已有值）
function editorLoadAll() {
  if (typeof LOCATION_DATA !== 'undefined' && LOCATION_DATA) {
    _editorApplyData(LOCATION_DATA);
    console.log('[Load] ✅ 已从 location.js 加载存档');
  }
}

// 保存提示 toast
function _editorToast(msg) {
  var el = document.getElementById('editor-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'editor-toast';
    el.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);' +
      'padding:10px 24px;background:rgba(12,22,36,0.92);color:#80ffa0;font-size:14px;' +
      'border:1px solid rgba(80,200,120,0.4);border-radius:8px;z-index:200;' +
      'backdrop-filter:blur(10px);transition:opacity .3s;pointer-events:none;';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.opacity = '1';
  clearTimeout(el._timer);
  el._timer = setTimeout(function() { el.style.opacity = '0'; }, 1800);
}

// 创建固定的存档按钮组（左下角）
function _editorInitButtons() {
  var wrap = document.createElement('div');
  wrap.id = 'editor-io-btns';
  wrap.style.cssText = 'position:fixed;bottom:50px;left:16px;z-index:60;display:none;gap:8px;';
  wrap.innerHTML = '\
<button id="io-save" style="padding:8px 16px;font-size:13px;cursor:pointer;\
  background:rgba(12,22,36,0.88);color:#80ffa0;border:1px solid rgba(80,200,120,0.4);\
  border-radius:8px;backdrop-filter:blur(10px);font-family:inherit;\
  transition:all .15s;">💾 下载存档</button>\
<button id="io-load" style="padding:8px 16px;font-size:13px;cursor:pointer;\
  background:rgba(12,22,36,0.88);color:#78c8ff;border:1px solid rgba(120,200,255,0.4);\
  border-radius:8px;backdrop-filter:blur(10px);font-family:inherit;\
  transition:all .15s;">📂 导入存档</button>';
  document.body.appendChild(wrap);
  document.getElementById('io-save').onclick = editorSaveAll;
  document.getElementById('io-load').onclick = editorImportFile;
}

// 编辑器打开/关闭时刷新按钮可见性
function _editorUpdateIOBtns() {
  var el = document.getElementById('editor-io-btns');
  if (el) el.style.display = activeEditor ? 'flex' : 'none';
}
