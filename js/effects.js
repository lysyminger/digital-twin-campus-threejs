/* ============================================================
   粒子效果：白天落叶 + 夜间萤火虫
   - 落叶：Points + PointsMaterial，重力下落 + 风摆 + 落地回收
   - 萤火虫：Points + ShaderMaterial 自发光 + 呼吸闪烁
   - 都跟随相机周围 ±200m 范围循环，玩家走到哪都看到
   依赖：core.js (scene, camera)
   入口：initLeaves() / updateLeaves(dt, hour)
        initFireflies() / updateFireflies(dt, hour)
   ============================================================ */

// ===== 落叶 =====
let leafPoints = null;
let leafVelocities = null;
const LEAF_COUNT = 80;
const LEAF_RANGE = 200;          // 围绕相机的散布半径

function initLeaves() {
  const positions = new Float32Array(LEAF_COUNT * 3);
  leafVelocities = new Array(LEAF_COUNT);

  for (let i = 0; i < LEAF_COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * LEAF_RANGE * 2;
    positions[i * 3 + 1] = Math.random() * 40 + 5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * LEAF_RANGE * 2;
    leafVelocities[i] = {
      vx: (Math.random() - 0.3) * 2,         // 偏向 +X 风向
      vy: -(Math.random() * 1.5 + 0.5),       // 重力向下 0.5~2.0
      phase: Math.random() * Math.PI * 2
    };
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  const mat = new THREE.PointsMaterial({
    size: 0.9,
    color: 0xc08840,         // 暖棕橙，秋叶感
    transparent: true,
    opacity: 0.7,
    sizeAttenuation: true,
    depthWrite: false,
    fog: false
  });

  leafPoints = new THREE.Points(geo, mat);
  leafPoints.frustumCulled = false;   // 跟随相机，避免被错误剔除
  scene.add(leafPoints);
}

function updateLeaves(dt, hour) {
  if (!leafPoints) return;
  // 白天可见（7~18）
  const visible = (hour >= 7 && hour <= 18);
  leafPoints.visible = visible;
  if (!visible) return;

  const pos = leafPoints.geometry.attributes.position;
  const now = performance.now() * 0.001;

  for (let i = 0; i < LEAF_COUNT; i++) {
    const v = leafVelocities[i];
    let x = pos.getX(i) + v.vx * dt;
    let y = pos.getY(i) + v.vy * dt;
    // Z 方向加入 sin 摆动模拟叶片飘
    let z = pos.getZ(i) + Math.sin(now + v.phase) * 0.5 * dt;

    // 落地或飘太远 → 在相机上空随机一个新位置
    if (y < 0 || Math.abs(x - camera.position.x) > LEAF_RANGE * 1.2 ||
                  Math.abs(z - camera.position.z) > LEAF_RANGE * 1.2) {
      x = camera.position.x + (Math.random() - 0.5) * LEAF_RANGE * 2;
      y = 30 + Math.random() * 20;
      z = camera.position.z + (Math.random() - 0.5) * LEAF_RANGE * 2;
    }
    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate = true;
}

// ===== 萤火虫 =====
let fireflyPoints = null;
let fireflyData = null;
const FIREFLY_COUNT = 60;
const FIREFLY_RANGE = 180;

function initFireflies() {
  const positions = new Float32Array(FIREFLY_COUNT * 3);
  const phases = new Float32Array(FIREFLY_COUNT);
  fireflyData = new Array(FIREFLY_COUNT);

  for (let i = 0; i < FIREFLY_COUNT; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * FIREFLY_RANGE * 2;
    positions[i * 3 + 1] = 1.5 + Math.random() * 8;
    positions[i * 3 + 2] = (Math.random() - 0.5) * FIREFLY_RANGE * 2;
    phases[i] = Math.random() * Math.PI * 2;
    fireflyData[i] = {
      vx: (Math.random() - 0.5) * 1.5,
      vz: (Math.random() - 0.5) * 1.5,
      baseY: 1.5 + Math.random() * 8
    };
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 } },
    vertexShader: [
      'attribute float aPhase;',
      'uniform float uTime;',
      'varying float vAlpha;',
      'void main() {',
      // 0~1 之间呼吸，clamp 让大部分时间偏暗，亮起来更突出
      '  vAlpha = clamp(sin(uTime * 2.0 + aPhase * 6.28), 0.0, 1.0);',
      '  vec4 mvPos = modelViewMatrix * vec4(position, 1.0);',
      '  gl_PointSize = 5.0 * (300.0 / -mvPos.z);',
      '  gl_Position = projectionMatrix * mvPos;',
      '}'
    ].join('\n'),
    fragmentShader: [
      'varying float vAlpha;',
      'void main() {',
      '  vec2 c = gl_PointCoord - 0.5;',
      '  float d = length(c) * 2.0;',
      '  if (d > 1.0) discard;',
      '  float glow = pow(1.0 - d, 1.5);',
      '  gl_FragColor = vec4(1.0, 0.95, 0.5, glow * vAlpha * 0.9);',
      '}'
    ].join('\n'),
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    fog: false
  });

  fireflyPoints = new THREE.Points(geo, mat);
  fireflyPoints.frustumCulled = false;
  scene.add(fireflyPoints);
}

function updateFireflies(dt, hour) {
  if (!fireflyPoints) return;
  // 夜间可见
  const visible = (hour < 6 || hour > 19);
  fireflyPoints.visible = visible;
  if (!visible) return;

  fireflyPoints.material.uniforms.uTime.value += dt;

  const pos = fireflyPoints.geometry.attributes.position;
  const now = performance.now() * 0.0005;

  for (let i = 0; i < FIREFLY_COUNT; i++) {
    const fd = fireflyData[i];
    let x = pos.getX(i) + fd.vx * dt;
    // Y 在 baseY 上下 ±2m 缓慢起伏
    let y = fd.baseY + Math.sin(now + i) * 2;
    let z = pos.getZ(i) + fd.vz * dt;

    // 离相机太远 → 拉回相机周围
    if (Math.abs(x - camera.position.x) > FIREFLY_RANGE) {
      x = camera.position.x + (Math.random() - 0.5) * FIREFLY_RANGE * 2;
    }
    if (Math.abs(z - camera.position.z) > FIREFLY_RANGE) {
      z = camera.position.z + (Math.random() - 0.5) * FIREFLY_RANGE * 2;
    }
    pos.setXYZ(i, x, y, z);
  }
  pos.needsUpdate = true;
}
