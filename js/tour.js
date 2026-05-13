/* ============================================================
   自动观光漫游：沿预设环形曲线巡游校园
   依赖：core.js (camera, controls)，ui.js (showInfoCard/hideInfoCard)
   入口：enterTour() / exitTour() / updateTour(dt)
   ============================================================ */

// ===== 全局状态 =====
let tourMode = false;
let tourT = 0;                       // 0~1，沿曲线归一化进度

// ===== 观光路线关键点（逆时针环游，南门→西→北→东→中央→南门） =====
// 全部 waypoint 落在道路或建筑空隙，不压建筑本体
// 数据源：CAMPUS_ROADS（terrain.js）+ CAMPUS_DATA 中建筑坐标
const TOUR_WAYPOINTS = [
  // —— 南校区起步 ——
  [  -2,  225],   // 南门
  [  -2,  185],   // 南教学楼 A1/A2 中轴（中间空地）
  [ -95,  158],   // 教学区西侧步道
  // —— 西侧 ——
  [-200,   95],   // 南侧校内环路西段
  [-285,   20],   // 西侧外部主路
  [-315,  -80],   // 西外路继续北上
  // —— 北校区（清乐园 / 北侧学院路） ——
  [-310, -230],   // 西北角，清乐园外侧
  [-180, -260],   // 北侧学院路西段（清乐园北边）
  [   0, -260],   // 北侧学院路中段
  [ 200, -250],   // 北侧学院路东段
  // —— 东北运动区 ——
  [ 335, -280],   // 操场北侧绕行
  [ 370, -220],   // 东北宿舍区
  [ 340,  -50],   // 东侧外路南下
  // —— 中央 ——
  [ 245,    5],   // 中央东西主路东段
  [ 115,   -4],   // 中央主路中段（行政区南侧）
  [  45,    5],   // 中央主路中段（树人礼堂北侧）
  [ -30,   55],   // 图书馆与医学院之间
  [ -50,  105]    // 教学区西南（closed 自动接回南门）
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
