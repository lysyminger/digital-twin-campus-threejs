/* ============================================================
   自动观光漫游：沿预设环形曲线巡游校园
   依赖：core.js (camera, controls)，ui.js (showInfoCard/hideInfoCard)
   入口：enterTour() / exitTour() / updateTour(dt)
   ============================================================ */

// ===== 全局状态 =====
let tourMode = false;
let tourT = 0;                       // 0~1，沿曲线归一化进度

// ===== 观光路线关键点（顺时针环游，覆盖主要建筑） =====
// 数据源：CAMPUS_ROADS 的主路 + CAMPUS_DATA 中建筑坐标
const TOUR_WAYPOINTS = [
  [  -2,  225],   // 南门入口
  [  -2,  155],   // 南校区中轴（穿过教学主楼 A1~A4）
  [ -50,  100],   // 教学区西南角
  [   0,   35],   // 贺田图书馆
  [ 115,   -4],   // 中央东西主路东行
  [ 160,  -20],   // 9 号楼 / 交叉科学研究院
  [ 170,  -55],   // 体育馆西侧
  [ 270,  -55],   // 体育馆正前方
  [ 315,  -25],   // 操场东端
  [ 170, -105],   // 12 号楼方向
  [  50,  -95],   // 教学区东北
  [-115,  -25],   // 西侧 16 号楼
  [-220,  -65],   // 西侧教学环路
  [-280,    0],   // 西侧外路
  [-200,   95],   // 南侧校内环路
  [ -45,  100]    // 回到南门附近（曲线 closed 自动闭合）
];

// ===== 平滑曲线 =====
let tourCurve = null;

function buildTourCurve() {
  const pts = TOUR_WAYPOINTS.map(([x, z]) => new THREE.Vector3(x, 0, z));
  // closed=true 自动闭合首尾；catmullrom 张力 0.5（默认）
  tourCurve = new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5);
}

// ===== 进入 / 退出观光 =====
function enterTour() {
  if (!tourCurve) buildTourCurve();
  tourMode = true;
  tourT = 0;
  lastShownBuilding = null;
  autoCardTimer = 0;
  controls.enabled = false;
}

function exitTour() {
  tourMode = false;
  controls.enabled = true;
  // 清掉漫游期间弹出的信息卡
  hideInfoCard();
}

// ===== 每帧更新（由 main.js 的 animate 调用） =====
function updateTour(dt) {
  if (!tourMode || !tourCurve) return;

  // 约 40 秒走完一圈（0.025 / 秒）
  tourT += dt * 0.025;
  if (tourT >= 1) tourT -= 1;

  // 相机位置 = 曲线点 + 人眼高度
  const pos = tourCurve.getPointAt(tourT);
  camera.position.set(pos.x, pos.y + 3, pos.z);

  // 朝向：略微提前一点点的点
  const ahead = tourCurve.getPointAt((tourT + 0.02) % 1);
  camera.lookAt(ahead.x, ahead.y + 1.5, ahead.z);

  // 顺手更新 controls.target，方便退出漫游时视角不会跳
  controls.target.copy(ahead);

  // 路过建筑自动弹卡片
  tryAutoInfoCard(dt);
}

// ===== 路过建筑自动弹卡片 =====
let lastShownBuilding = null;
let autoCardTimer = 0;       // 距离下次检查的累计时间
let autoCardHideTimer = 0;   // 卡片自动收起倒计时

function tryAutoInfoCard(dt) {
  // 卡片显示倒计时
  if (autoCardHideTimer > 0) {
    autoCardHideTimer -= dt;
    if (autoCardHideTimer <= 0) hideInfoCard();
  }

  // 每秒检查一次最近建筑
  autoCardTimer += dt;
  if (autoCardTimer < 1.0) return;
  autoCardTimer = 0;

  const camPos = camera.position;
  let nearest = null, nearestDist = Infinity;

  layerGroups.buildings.children.forEach(b => {
    if (!b.userData?.name) return;
    const dx = b.position.x - camPos.x;
    const dz = b.position.z - camPos.z;
    const d2 = dx * dx + dz * dz;
    if (d2 < nearestDist) {
      nearestDist = d2;
      nearest = b;
    }
  });

  // 距离 < 15m 且与上次不同 → 弹卡片
  if (nearest && nearestDist < 15 * 15 && nearest !== lastShownBuilding) {
    lastShownBuilding = nearest;
    showInfoCard(nearest.userData);
    autoCardHideTimer = 3.0;   // 3 秒后自动收起
  }
}
