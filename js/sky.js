/* ============================================================
   天空穹顶 + 飘云
   - 半径 900 大球，内表面贴 ShaderMaterial 渐变（顶部色 ← 地平线色）
   - 太阳方向加光晕热点
   - 6 朵 Sprite 云朵沿 +X 缓慢飘动，夜间淡出
   依赖：core.js (scene, camera, sun)，timeOfDay.js (SKY_*)
   入口：initSkyDome() / updateSkyDome(hour) / updateClouds(dt)
   ============================================================ */

// ===== 全局对象 =====
let skyDome = null;
let skyUniforms = null;
const clouds = [];                  // 每项 { sprite, windSpeed }
const CLOUD_COUNT = 18;
const CLOUD_BOUND = 450;            // X 循环边界
let cloudOpacityTarget = 0.8;       // 由 updateSkyDome 改写

// ===== 顶天 / 地平线颜色（与 timeOfDay 三段色对应） =====
const TOP_DAY   = new THREE.Color(0x2c6ba8);  // 白天天顶：深一些的蓝
const TOP_DUSK  = new THREE.Color(0x4a2a55);  // 黄昏天顶：深紫
const TOP_NIGHT = new THREE.Color(0x040818);  // 深夜天顶：近黑
const _tmpTop   = new THREE.Color();
const _tmpHor   = new THREE.Color();

// ===== Sun 起作用的方向（每次 update 重算） =====
const _sunDir = new THREE.Vector3();

// ===== 初始化天空穹顶 =====
function initSkyDome() {
  const geo = new THREE.SphereGeometry(900, 32, 16);

  skyUniforms = {
    uTopColor:     { value: TOP_DAY.clone() },
    uHorizonColor: { value: new THREE.Color(0x87ceeb) },
    uSunDir:       { value: new THREE.Vector3(0, 1, 0) },
    uSunStrength:  { value: 1.0 }   // 太阳低于地平线时为 0
  };

  const mat = new THREE.ShaderMaterial({
    uniforms: skyUniforms,
    side: THREE.BackSide,
    depthWrite: false,
    depthTest: false,
    fog: false,
    vertexShader: `
      varying vec3 vWorldPos;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vWorldPos = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: `
      uniform vec3 uTopColor;
      uniform vec3 uHorizonColor;
      uniform vec3 uSunDir;
      uniform float uSunStrength;
      varying vec3 vWorldPos;
      void main() {
        vec3 dir = normalize(vWorldPos);
        // h: 0 = 地平线, 1 = 顶天
        float h = clamp(dir.y, 0.0, 1.0);
        // 用 pow 让靠近地平线的过渡更窄、更明显
        float t = pow(h, 0.5);
        vec3 col = mix(uHorizonColor, uTopColor, t);

        // 太阳热点：dot(viewDir, sunDir) 越接近 1 越亮
        float d = max(dot(dir, uSunDir), 0.0);
        float halo = pow(d, 32.0) * uSunStrength;
        col += vec3(1.0, 0.85, 0.6) * halo * 0.7;

        gl_FragColor = vec4(col, 1.0);
      }
    `
  });

  skyDome = new THREE.Mesh(geo, mat);
  skyDome.renderOrder = -1;
  skyDome.frustumCulled = false;
  scene.add(skyDome);

  _initClouds();
}

// ===== 每次时间变化时更新颜色与太阳方向 =====
function updateSkyDome(hour) {
  if (!skyUniforms) return;

  // ---- 地平线色（与 scene.fog 一致，沿用 timeOfDay 的三段插值） ----
  let topCol, horCol;
  if (hour >= 7 && hour <= 17) {                       // 白天
    horCol = SKY_DAY;  topCol = TOP_DAY;
  } else if (hour >= 5 && hour < 7) {                  // 日出
    const k = (hour - 5) / 2;
    horCol = _tmpHor.copy(SKY_DUSK).lerp(SKY_DAY, k);
    topCol = _tmpTop.copy(TOP_DUSK).lerp(TOP_DAY, k);
  } else if (hour > 17 && hour <= 19) {                // 日落
    const k = (hour - 17) / 2;
    horCol = _tmpHor.copy(SKY_DAY).lerp(SKY_DUSK, k);
    topCol = _tmpTop.copy(TOP_DAY).lerp(TOP_DUSK, k);
  } else if (hour > 19 && hour <= 21) {                // 入夜
    const k = (hour - 19) / 2;
    horCol = _tmpHor.copy(SKY_DUSK).lerp(SKY_NIGHT, k);
    topCol = _tmpTop.copy(TOP_DUSK).lerp(TOP_NIGHT, k);
  } else if (hour >= 3 && hour < 5) {                  // 黎明前
    const k = (hour - 3) / 2;
    horCol = _tmpHor.copy(SKY_NIGHT).lerp(SKY_DUSK, k);
    topCol = _tmpTop.copy(TOP_NIGHT).lerp(TOP_DUSK, k);
  } else {                                              // 深夜
    horCol = SKY_NIGHT; topCol = TOP_NIGHT;
  }
  skyUniforms.uHorizonColor.value.copy(horCol);
  skyUniforms.uTopColor.value.copy(topCol);

  // ---- 太阳方向 + 强度（地平线以下关掉光晕） ----
  if (typeof sun !== 'undefined' && sun) {
    _sunDir.copy(sun.position).normalize();
    skyUniforms.uSunDir.value.copy(_sunDir);
    // y < 0 → 太阳在地下，光晕渐弱
    skyUniforms.uSunStrength.value = Math.max(0, _sunDir.y) * 1.2;
  }

  // ---- 云朵透明度目标 ----
  if (hour >= 7 && hour <= 17)        cloudOpacityTarget = 0.85;
  else if (hour >= 5 && hour < 7)     cloudOpacityTarget = 0.5 + (hour - 5) / 2 * 0.35;
  else if (hour > 17 && hour <= 19)   cloudOpacityTarget = 0.85 - (hour - 17) / 2 * 0.6;
  else if (hour > 19 && hour <= 21)   cloudOpacityTarget = 0.25 - (hour - 19) / 2 * 0.2;
  else if (hour >= 3 && hour < 5)     cloudOpacityTarget = 0.05 + (hour - 3) / 2 * 0.45;
  else                                cloudOpacityTarget = 0.05;
}

// ===== 云朵：canvas 多团叠加贴图（更自然的团状） =====
function _makeCloudTexture(seed) {
  const size = 256;
  const cv = document.createElement('canvas');
  cv.width = size; cv.height = size * 0.6;
  const ctx = cv.getContext('2d');

  // 用多个随机圆叠加模拟云团不规则外形
  const blobCount = 7 + Math.floor((seed || 0) * 5);
  for (let i = 0; i < blobCount; i++) {
    const bx = size * (0.2 + Math.random() * 0.6);
    const by = cv.height * (0.25 + Math.random() * 0.5);
    const br = 25 + Math.random() * 45;
    const grad = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    const alpha = 0.35 + Math.random() * 0.4;
    grad.addColorStop(0.0, 'rgba(255,255,255,' + (alpha + 0.2).toFixed(2) + ')');
    grad.addColorStop(0.4, 'rgba(255,255,255,' + (alpha * 0.7).toFixed(2) + ')');
    grad.addColorStop(0.7, 'rgba(255,255,255,' + (alpha * 0.25).toFixed(2) + ')');
    grad.addColorStop(1.0, 'rgba(255,255,255,0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, cv.height);
  }
  // 整体加一层大范围柔光让边缘更柔和
  const outerGrad = ctx.createRadialGradient(size/2, cv.height/2, 0, size/2, cv.height/2, size * 0.48);
  outerGrad.addColorStop(0.0, 'rgba(255,255,255,0.3)');
  outerGrad.addColorStop(0.6, 'rgba(255,255,255,0.08)');
  outerGrad.addColorStop(1.0, 'rgba(255,255,255,0.0)');
  ctx.fillStyle = outerGrad;
  ctx.fillRect(0, 0, size, cv.height);

  const tex = new THREE.CanvasTexture(cv);
  tex.minFilter = THREE.LinearFilter;
  return tex;
}

function _initClouds() {
  // 生成 4 种不同形态的云贴图
  const textures = [];
  for (let t = 0; t < 4; t++) {
    textures.push(_makeCloudTexture(t * 0.25 + 0.1));
  }

  // 12 朵主云 + 6 朵远景薄云 = 18 朵
  const totalClouds = 18;
  for (let i = 0; i < totalClouds; i++) {
    const isDistant = (i >= 12);
    const tex = textures[i % textures.length];
    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: isDistant ? 0.45 : 0.8,
      depthWrite: false,
      fog: false
    });
    const sp = new THREE.Sprite(mat);
    // 主云 100~180m，远景薄云 150~280m
    const w = isDistant ? (150 + Math.random() * 130) : (100 + Math.random() * 80);
    const h = w * (0.35 + Math.random() * 0.2);
    sp.scale.set(w, h, 1);
    // 位置：主云 Y 140~220，远景云 Y 200~320（更高更远）
    const y = isDistant ? (200 + Math.random() * 120) : (140 + Math.random() * 80);
    sp.position.set(
      (Math.random() - 0.5) * CLOUD_BOUND * 2,
      y,
      (Math.random() - 0.5) * CLOUD_BOUND * 2
    );
    sp.renderOrder = 1;
    scene.add(sp);
    clouds.push({
      sprite: sp,
      windSpeed: isDistant ? (1.5 + Math.random() * 2) : (3 + Math.random() * 5),
      baseOpacity: isDistant ? 0.45 : 0.8
    });
  }
}

// ===== 每帧推动云朵 + 平滑透明度 =====
function updateClouds(dt) {
  if (clouds.length === 0) return;
  for (let i = 0; i < clouds.length; i++) {
    const c = clouds[i];
    c.sprite.position.x += c.windSpeed * dt;
    if (c.sprite.position.x > CLOUD_BOUND) {
      c.sprite.position.x = -CLOUD_BOUND;
      c.sprite.position.z = (Math.random() - 0.5) * CLOUD_BOUND * 2;
    }
    // 透明度：按每朵云的基础透明度比例缩放目标值
    const ratio = (c.baseOpacity || 0.8) / 0.8;
    const target = cloudOpacityTarget * ratio;
    const op = c.sprite.material.opacity;
    c.sprite.material.opacity = op + (target - op) * Math.min(1, dt * 2);
  }
}
