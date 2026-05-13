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
  scene.background = skyColor;
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
  const isNight = (hour < 6 || hour > 19);
  streetLamps.forEach(({ light, bulbMat }) => {
    light.intensity = isNight ? 0.5 : 0;
    bulbMat.emissive.setHex(isNight ? 0xffcc66 : 0x000000);
    bulbMat.emissiveIntensity = isNight ? 1.0 : 0;
  });
}
