/* ============================================================
   自由漫游：第一人称 WASD + 鼠标视角（PointerLock API）
   依赖：core.js (camera, controls, renderer)，ui.js (setView)
   ============================================================ */

// ===== 全局状态 =====
let freeRoamMode = false;
const keys = { w: false, a: false, s: false, d: false, shift: false };
let yaw = 0;    // 绕 Y 轴（左右看）
let pitch = 0;  // 绕 X 轴（上下看），夹在 ±π/2 内

// ===== 参数 =====
const ROAM_MOVE_SPEED = 18;            // m/s
const ROAM_RUN_MULT   = 2.5;           // Shift 加速倍数
const ROAM_SENSITIVITY = 0.002;
const ROAM_EYE_HEIGHT = 1.7;
const ROAM_BOUNDS = { minX: -440, maxX: 440, minZ: -310, maxZ: 310 };
const PITCH_LIMIT = Math.PI / 2 - 0.1;

// ===== 进入 / 退出 =====
function enterFreeRoam() {
  // 与观光模式互斥
  if (typeof tourMode !== 'undefined' && tourMode) exitTour();

  freeRoamMode = true;
  controls.enabled = false;

  // 把相机放到南门，朝北看
  camera.position.set(-2, ROAM_EYE_HEIGHT, 220);
  yaw = Math.PI;   // 面朝 -Z
  pitch = 0;
  applyCameraRotation();

  // 请求鼠标锁定（必须由用户输入事件触发，所以在按钮 click 里调）
  renderer.domElement.requestPointerLock();

  showRoamUI(true);
}

function exitFreeRoam() {
  freeRoamMode = false;
  controls.enabled = true;
  // 清空按键防止粘连
  keys.w = keys.a = keys.s = keys.d = keys.shift = false;
  if (document.pointerLockElement) document.exitPointerLock();
  showRoamUI(false);
}

// ===== 相机姿态（用 YXZ Euler 避免 gimbal） =====
function applyCameraRotation() {
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
  camera.rotation.z = 0;
}

// ===== 事件处理 =====
function onPointerLockChange() {
  // 用户按 Esc 解除锁定 → 自动退出漫游并切回透视
  if (document.pointerLockElement !== renderer.domElement && freeRoamMode) {
    exitFreeRoam();
    setView('persp');
  }
}

function onRoamMouseMove(e) {
  if (!freeRoamMode) return;
  yaw   -= e.movementX * ROAM_SENSITIVITY;
  pitch -= e.movementY * ROAM_SENSITIVITY;
  pitch = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch));
  applyCameraRotation();
}

function onRoamKey(e, down) {
  if (!freeRoamMode) return;
  switch (e.code) {
    case 'KeyW': keys.w = down; break;
    case 'KeyA': keys.a = down; break;
    case 'KeyS': keys.s = down; break;
    case 'KeyD': keys.d = down; break;
    case 'ShiftLeft':
    case 'ShiftRight': keys.shift = down; break;
    case 'Escape':
      if (down) {
        exitFreeRoam();
        setView('persp');
      }
      break;
  }
}

// ===== 每帧更新（由 main.js 的 animate 调用） =====
function updateFreeRoam(dt) {
  if (!freeRoamMode) return;

  const speed = ROAM_MOVE_SPEED * (keys.shift ? ROAM_RUN_MULT : 1) * dt;

  // 前向量（XZ 平面投影，忽略 pitch，避免低头时反而往地里走）
  const forwardX = -Math.sin(yaw);
  const forwardZ = -Math.cos(yaw);
  // 右向量 = 前向量绕 Y 顺时针 90°
  const rightX = -forwardZ;
  const rightZ =  forwardX;

  let dx = 0, dz = 0;
  if (keys.w) { dx += forwardX; dz += forwardZ; }
  if (keys.s) { dx -= forwardX; dz -= forwardZ; }
  if (keys.d) { dx += rightX;   dz += rightZ;   }
  if (keys.a) { dx -= rightX;   dz -= rightZ;   }

  // 对角线归一化（避免斜走比直走快）
  const len = Math.hypot(dx, dz);
  if (len > 0) {
    dx = (dx / len) * speed;
    dz = (dz / len) * speed;
  }

  // 边界钳制
  camera.position.x = Math.max(ROAM_BOUNDS.minX, Math.min(ROAM_BOUNDS.maxX, camera.position.x + dx));
  camera.position.z = Math.max(ROAM_BOUNDS.minZ, Math.min(ROAM_BOUNDS.maxZ, camera.position.z + dz));
  camera.position.y = ROAM_EYE_HEIGHT;  // 锁定人眼高度
}

// ===== UI 显隐（准星 + 操作提示） =====
function showRoamUI(show) {
  const crosshair = document.getElementById('roam-crosshair');
  const hint = document.getElementById('roam-hint');
  if (crosshair) crosshair.style.display = show ? 'block' : 'none';
  if (hint) hint.style.display = show ? 'block' : 'none';
}

// ===== 全局事件绑定（由 main.js 的 boot 调用一次） =====
function bindFreeRoam() {
  document.addEventListener('pointerlockchange', onPointerLockChange);
  document.addEventListener('mousemove', onRoamMouseMove);
  document.addEventListener('keydown', e => onRoamKey(e, true));
  document.addEventListener('keyup',   e => onRoamKey(e, false));
}
