/* ============================================================
   主循环 + 启动入口
   依赖：core.js / terrain.js / sports.js / buildings.js / vegetation.js / ui.js
   ============================================================ */

// ===== 主循环 =====
function animate(now) {
  requestAnimationFrame(animate);

  const dt = (now - lastFrame) / 1000;
  lastFrame = now;

  // FPS
  frameCount++;
  fpsTimer += dt;
  if (fpsTimer >= 0.5) {
    const fps = Math.round(frameCount / fpsTimer);
    document.getElementById('fps').textContent = 'FPS ' + fps;
    frameCount = 0;
    fpsTimer = 0;
  }

  // 自动观光漫游（tourMode 为真时接管相机）
  if (typeof updateTour === 'function') updateTour(dt);
  // 自由漫游（freeRoamMode 为真时接管相机）
  if (typeof updateFreeRoam === 'function') updateFreeRoam(dt);

  // 两种漫游模式下都跳过 OrbitControls.update（避免基于 spherical 反算覆盖相机位置）
  const inRoam = (typeof tourMode !== 'undefined' && tourMode) ||
                 (typeof freeRoamMode !== 'undefined' && freeRoamMode);
  if (!inRoam) controls.update();

  // 天空云朵每帧飘动
  if (typeof updateClouds === 'function') updateClouds(dt);

  // 粒子效果：读取当前时间槽位
  if (typeof updateLeaves === 'function' || typeof updateFireflies === 'function') {
    const slider = document.getElementById('time-slider');
    const curHour = slider ? parseFloat(slider.value) : 12;
    if (typeof updateLeaves === 'function')    updateLeaves(dt, curHour);
    if (typeof updateFireflies === 'function') updateFireflies(dt, curHour);
  }

  // 建筑标签距离过滤
  if (typeof updateLabels === 'function') updateLabels();

  // Bloom：strength > 0 时走 EffectComposer，否则走原生渲染（零开销）
  if (composer && bloomPass && bloomPass.strength > 0) {
    composer.render();
  } else {
    renderer.render(scene, camera);
  }

  // CSS2D 标签层叠加（必须在 webgl 渲染后）
  if (labelRenderer) labelRenderer.render(scene, camera);

  // 小地图每帧刷新
  drawMinimap();
}

// ===== 启动 =====
// 单步包裹：任何一步抛错都记录到控制台并继续，避免整条加载链断在某一步
function _safe(label, fn) {
  try { fn(); }
  catch (e) { console.error('[boot] ' + label + ' 失败:', e); }
}

function boot() {
  _safe('initScene',          () => initScene());
  _safe('initSkyDome',        () => initSkyDome());
  _safe('initBloom',          () => initBloom());
  _safe('editorLoadAll',      () => editorLoadAll());

  // 地形
  _safe('createGround',       () => createGround());
  _safe('createCampusRoads',  () => createCampusRoads());
  _safe('createGreenAreas',   () => createGreenAreas());

  // 运动设施 + 国旗杆
  _safe('createTrack',        () => createTrack());
  _safe('createGrandstand',   () => createGrandstand());
  _safe('createBasketballCourts', () => createBasketballCourts());
  _safe('createFlagpole',     () => createFlagpole());

  // 建筑
  _safe('createBuildings',    () => createBuildings());

  // 植被与设施
  _safe('createTrees',        () => createTrees());
  _safe('createStreetLamps',  () => createStreetLamps());
  _safe('createBenches',      () => createBenches());

  // 标签 / 粒子
  _safe('initBuildingLabels', () => initBuildingLabels());
  _safe('initLeaves',         () => initLeaves());
  _safe('initFireflies',      () => initFireflies());

  // UI
  _safe('bindUI',             () => bindUI());
  _safe('bindFreeRoam',       () => bindFreeRoam());
  _safe('label switch bind',  () => {
    const labelSwitch = document.getElementById('toggle-labels');
    if (labelSwitch) {
      labelSwitch.addEventListener('change', e => toggleLabels(e.target.checked));
    }
  });
  _safe('initMinimap',        () => initMinimap());
  _safe('initGreenEditor',    () => initGreenEditor());
  _safe('initBuildingEditor', () => initBuildingEditor());
  _safe('initRoadEditor',     () => initRoadEditor());
  _safe('_editorInitButtons', () => _editorInitButtons());
  _safe('updateTimeDisplay',  () => updateTimeDisplay(12));
  _safe('updateTimeOfDay',    () => updateTimeOfDay(12));
  _safe('_autoLoadGLBFromData', () => _autoLoadGLBFromData());

  requestAnimationFrame(animate);
  // 无论上面哪步失败，loader 都要藏起来
  setTimeout(() => {
    const el = document.getElementById('loader');
    if (el) el.classList.add('hide');
  }, 300);
}

boot();
