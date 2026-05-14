/* ============================================================
   建筑名称标签：CSS2DRenderer + 距离过滤
   依赖：core.js (scene, camera, renderer)，buildings.js (BUILDING_DATA)
   入口：initBuildingLabels() / toggleLabels(show) / updateLabels()
   ============================================================ */

let labelRenderer = null;
const buildingLabels = [];       // 每项 { obj, div, pos, name }
let labelsVisible = false;
const LABEL_MAX_DIST = 300;      // 超过此距离自动隐藏，避免远处密集小字

// ===== 初始化（创建 CSS2DRenderer + 给每栋建筑挂一个 CSS2DObject） =====
function initBuildingLabels() {
  // 如果已存在 renderer 就只重建标签集合（编辑器重建场景时调用）
  if (!labelRenderer) {
    if (typeof THREE.CSS2DRenderer === 'undefined') {
      console.warn('[Labels] CSS2DRenderer 未加载，标签功能不可用');
      return;
    }
    labelRenderer = new THREE.CSS2DRenderer();
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
    labelRenderer.domElement.style.position = 'absolute';
    labelRenderer.domElement.style.top = '0';
    labelRenderer.domElement.style.left = '0';
    labelRenderer.domElement.style.pointerEvents = 'none';   // 关键：不拦截鼠标
    document.body.appendChild(labelRenderer.domElement);
  }

  // 清空旧标签（编辑器重建场景时需要）
  buildingLabels.forEach(item => {
    if (item.obj && item.obj.parent) item.obj.parent.remove(item.obj);
  });
  buildingLabels.length = 0;

  if (typeof BUILDING_DATA === 'undefined') return;
  BUILDING_DATA.forEach(info => {
    if (!info || !info.name) return;
    const div = document.createElement('div');
    div.className = 'building-label';
    div.textContent = info.name;
    div.style.display = labelsVisible ? '' : 'none';

    const label = new THREE.CSS2DObject(div);
    // 放在建筑顶端再抬 3m
    const y = (info.h || 12) + 3;
    label.position.set(info.x, y, info.z);
    scene.add(label);

    buildingLabels.push({
      obj: label,
      div: div,
      pos: new THREE.Vector3(info.x, y, info.z),
      name: info.name
    });
  });
}

// ===== 整体开关 =====
function toggleLabels(show) {
  labelsVisible = show;
  if (!show) {
    buildingLabels.forEach(item => { item.div.style.display = 'none'; });
  }
  // 打开状态下显隐由 updateLabels 按距离决定
}

// ===== 每帧根据距离过滤（在 animate 里调用） =====
function updateLabels() {
  if (!labelsVisible || !labelRenderer) return;
  const camPos = camera.position;
  for (let i = 0; i < buildingLabels.length; i++) {
    const item = buildingLabels[i];
    const dist = camPos.distanceTo(item.pos);
    item.div.style.display = (dist < LABEL_MAX_DIST) ? '' : 'none';
  }
}

// ===== Resize（由 ui.js 的 onResize 调用） =====
function resizeLabels() {
  if (labelRenderer) {
    labelRenderer.setSize(window.innerWidth, window.innerHeight);
  }
}
