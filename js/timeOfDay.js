/* ============================================================
   日夜循环：updateTimeOfDay(hour) 驱动太阳、天空、雾、路灯
   依赖：core.js（scene, sun, ambient）
   注：路灯注册表 streetLamps 由 vegetation.js 的 createStreetLamp 填充
   ============================================================ */

// ===== 路灯注册表（vegetation.js 在创建灯时 push 进来） =====
// 每项：{ light: THREE.PointLight, bulbMat: THREE.MeshStandardMaterial }
const streetLamps = [];

// ===== 颜色常量 =====
const SKY_DAY   = new THREE.Color(0x87ceeb);  // 白天蓝
const SKY_DUSK  = new THREE.Color(0xff8855);  // 晨昏橘红
const SKY_NIGHT = new THREE.Color(0x0a1530);  // 深夜蓝
const _tmpColor = new THREE.Color();

// ===== 主函数：按 hour (0~24) 更新整个环境 =====
function updateTimeOfDay(hour) {
  // ---- 1. 太阳位置：沿东-上-西的半圆弧 ----
  // hour=6  → 东方地平线 (+X)
  // hour=12 → 正上方 (+Y)
  // hour=18 → 西方地平线 (-X)
  const t = (hour - 6) / 12;
  const angle = t * Math.PI;
  const R = 300;
  sun.position.set(Math.cos(angle) * R, Math.sin(angle) * R, 80);

  // ---- 2. 天空 / 雾颜色（按时段插值） ----
  let skyColor;
  if (hour >= 7 && hour <= 17) {
    skyColor = SKY_DAY.clone();                                                  // 白天
  } else if (hour >= 5 && hour < 7) {
    skyColor = _tmpColor.copy(SKY_DUSK).lerp(SKY_DAY, (hour - 5) / 2).clone();   // 日出
  } else if (hour > 17 && hour <= 19) {
    skyColor = _tmpColor.copy(SKY_DAY).lerp(SKY_DUSK, (hour - 17) / 2).clone(); // 日落
  } else if (hour > 19 && hour <= 21) {
    skyColor = _tmpColor.copy(SKY_DUSK).lerp(SKY_NIGHT, (hour - 19) / 2).clone();// 入夜
  } else if (hour >= 3 && hour < 5) {
    skyColor = _tmpColor.copy(SKY_NIGHT).lerp(SKY_DUSK, (hour - 3) / 2).clone();// 黎明前
  } else {
    skyColor = SKY_NIGHT.clone();                                                // 深夜
  }
  // 天空：若 sky.js 已初始化则用穹顶，否则回退纯色背景
  if (typeof updateSkyDome === 'function' && skyDome) {
    scene.background = null;
    updateSkyDome(hour);
  } else {
    scene.background = skyColor;
  }
  // 雾色始终跟随地平线色（让远处建筑融入天空底部）
  if (scene.fog) scene.fog.color.copy(skyColor);

  // ---- 3. 光照强度 ----
  let sunI, ambI;
  if (hour >= 7 && hour <= 17) {                                          // 白天
    sunI = 1.0; ambI = 0.45;
  } else if ((hour >= 5 && hour < 7) || (hour > 17 && hour <= 19)) {      // 晨昏
    sunI = 0.7; ambI = 0.3;
  } else {                                                                // 夜晚
    sunI = 0.1; ambI = 0.15;
  }
  sun.intensity = sunI;
  ambient.intensity = ambI;
  // 太阳低于地平线时关阴影避免反向投射
  sun.castShadow = sun.position.y > 5;

  // ---- 4. 夜晚路灯（hour < 6 || hour > 19）----
  // 只开最近相机的 8 盏 PointLight，其余仅用 emissive 假发光
  const isNight = (hour < 6 || hour > 19);
  if (isNight) {
    streetLamps.forEach(s => {
      s._dist = camera.position.distanceToSquared(s.light.parent.position);
    });
    streetLamps.sort((a, b) => a._dist - b._dist);
    streetLamps.forEach((s, i) => {
      s.light.intensity = (i < 8) ? 0.5 : 0;
      s.bulbMat.emissive.setHex(0xffcc66);
      s.bulbMat.emissiveIntensity = 1.0;
    });
  } else {
    streetLamps.forEach(s => {
      s.light.intensity = 0;
      s.bulbMat.emissive.setHex(0x000000);
      s.bulbMat.emissiveIntensity = 0;
    });
  }

  // ---- 5. 窗户夜间亮灯（约 65% 随机点亮，比路灯早半小时打开） ----
  // 用索引做伪随机（同一窗户每次状态一致，无闪烁）
  if (typeof windowMeshes !== 'undefined') {
    const isNightWindow = (hour < 6 || hour > 18.5);
    if (isNightWindow) {
      windowMeshes.forEach((win, i) => {
        win.material = ((i * 7 + 13) % 100 < 65) ? windowMatOn : windowMat;
      });
    } else {
      windowMeshes.forEach(win => { win.material = windowMat; });
    }
  }

  // ---- 6. Bloom 强度（白天 0，夜晚 0.6，晨昏渐变） ----
  if (typeof bloomPass !== 'undefined' && bloomPass) {
    let s;
    if (hour < 5 || hour > 20)            s = 0.6;                      // 深夜
    else if (hour >= 5 && hour < 7)       s = 0.6 * (1 - (hour - 5) / 2);   // 日出渐弱
    else if (hour > 18 && hour <= 20)     s = 0.6 * ((hour - 18) / 2);     // 日落渐强
    else                                  s = 0;                          // 白天
    bloomPass.strength = s;
  }
}
