/* ============================================================
   Bloom 泛光后处理：UnrealBloomPass
   白天 strength=0 走原生渲染零开销，
   晨昏/夜晚 strength 渐变到 0.6，让窗户/路灯产生光晕
   依赖：core.js (renderer, scene, camera)
   入口：initBloom() / resizeBloom()
   ============================================================ */

let composer = null;
let bloomPass = null;

function initBloom() {
  // 依赖检查（CDN 没加载时不爆炸）
  if (typeof THREE.EffectComposer === 'undefined' ||
      typeof THREE.UnrealBloomPass === 'undefined') {
    console.warn('[Bloom] EffectComposer / UnrealBloomPass 未加载，泛光不可用');
    return;
  }

  composer = new THREE.EffectComposer(renderer);
  composer.addPass(new THREE.RenderPass(scene, camera));

  // UnrealBloomPass(resolution, strength, radius, threshold)
  // - strength: 0~3，白天 = 0
  // - radius:   光晕扩散半径，0.4 看起来自然
  // - threshold: 只有亮度 > 此值的像素才参与泛光
  //   设 0.35 让暖黄窗户与街灯在夜里能 bloom 但白天天空不会
  bloomPass = new THREE.UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    0.0,    // 起始 strength=0
    0.5,    // radius
    0.35    // threshold
  );
  composer.addPass(bloomPass);

  // 可选：Gamma 校正修复 r128 EffectComposer 偏亮
  if (typeof THREE.GammaCorrectionShader !== 'undefined') {
    composer.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));
  }
}

function resizeBloom() {
  if (composer) composer.setSize(window.innerWidth, window.innerHeight);
}
