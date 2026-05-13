/* ============================================================
   交互与 UI：Raycaster 点击、信息卡、UI 事件、视角切换
   依赖：core.js（camera, controls, renderer, raycaster, pointer, interactables, layerGroups, currentView）
   ============================================================ */

// ===== 点击拾取 =====
function onPointerDown(e) {
  if (e.target.tagName !== 'CANVAS') return;
  // 自由漫游下鼠标被锁定，跳过点击拾取
  if (typeof freeRoamMode !== 'undefined' && freeRoamMode) return;
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactables, true);
  if (hits.length === 0) return;

  let obj = hits[0].object;
  while (obj && !obj.userData?.name) obj = obj.parent;
  if (!obj?.userData?.name) return;

  showInfoCard(obj.userData);
}

function showInfoCard({ name, type, desc }) {
  document.getElementById('info-name').textContent = name || '未知对象';
  document.getElementById('info-tag').textContent  = type || '建筑';
  document.getElementById('info-desc').textContent = desc || '暂无介绍';
  document.getElementById('info-card').classList.add('show');
}

function hideInfoCard() {
  document.getElementById('info-card').classList.remove('show');
}

// ===== UI 事件绑定 =====
function bindUI() {
  // 图层开关
  document.querySelectorAll('.switch[data-layer]').forEach(sw => {
    sw.addEventListener('change', e => {
      const key = e.target.dataset.layer;
      if (layerGroups[key]) layerGroups[key].visible = e.target.checked;
    });
  });

  // 视角按钮
  document.getElementById('view-persp').addEventListener('click', () => setView('persp'));
  document.getElementById('view-top').addEventListener('click',   () => setView('top'));
  // 漫游按钮：再次点击切回透视模式（toggle 语义）
  document.getElementById('view-tour').addEventListener('click',  () => {
    setView(tourMode ? 'persp' : 'tour');
  });
  // 自由漫游按钮：toggle
  document.getElementById('view-roam').addEventListener('click',  () => {
    setView(freeRoamMode ? 'persp' : 'roam');
  });
  document.getElementById('reset-btn').addEventListener('click',  () => setView('persp'));

  // 时间滑块：显示数字 + 触发日夜循环
  document.getElementById('time-slider').addEventListener('input', e => {
    const hour = parseFloat(e.target.value);
    updateTimeDisplay(hour);
    updateTimeOfDay(hour);
  });

  // 信息卡关闭
  document.getElementById('info-close').addEventListener('click', hideInfoCard);

  // 点击场景
  renderer.domElement.addEventListener('pointerdown', onPointerDown);

  // 窗口缩放
  window.addEventListener('resize', onResize);
}

// ===== 视角切换 =====
function setView(mode) {
  currentView = mode;
  ['persp', 'top', 'tour', 'roam'].forEach(m => {
    const btn = document.getElementById('view-' + m);
    if (btn) btn.classList.toggle('active', m === mode);
  });

  // 切到非观光模式 → 退出观光
  if (mode !== 'tour' && typeof tourMode !== 'undefined' && tourMode) {
    exitTour();
  }
  // 切到非自由漫游 → 退出自由漫游
  if (mode !== 'roam' && typeof freeRoamMode !== 'undefined' && freeRoamMode) {
    exitFreeRoam();
  }

  if (mode === 'persp') {
    controls.enabled = true;
    animateCamera({ pos: [320, 240, 220], target: [0, 0, 0] });
  } else if (mode === 'top') {
    controls.enabled = true;
    animateCamera({ pos: [0, 480, 0.1], target: [0, 0, 0] });
  } else if (mode === 'tour') {
    enterTour();
  } else if (mode === 'roam') {
    enterFreeRoam();
  }
}

// ===== 相机平滑过渡（easeInOut） =====
function animateCamera({ pos, target }) {
  const fromPos = camera.position.clone();
  const fromTgt = controls.target.clone();
  const toPos = new THREE.Vector3(...pos);
  const toTgt = new THREE.Vector3(...target);
  const dur = 800, start = performance.now();

  function step(now) {
    const t = Math.min(1, (now - start) / dur);
    const k = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    camera.position.lerpVectors(fromPos, toPos, k);
    controls.target.lerpVectors(fromTgt, toTgt, k);
    controls.update();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

// ===== 时间显示 =====
function updateTimeDisplay(hour) {
  const h = Math.floor(hour);
  const m = Math.floor((hour - h) * 60);
  document.getElementById('time-display').textContent =
    String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}

// ===== 窗口缩放 =====
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
