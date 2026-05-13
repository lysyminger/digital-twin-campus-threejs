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

  // 漫游模式下跳过 OrbitControls.update（避免基于 spherical 反算覆盖相机位置）
  if (!(typeof tourMode !== 'undefined' && tourMode)) {
    controls.update();
  }
  renderer.render(scene, camera);
}

// ===== 启动 =====
function boot() {
  initScene();

  // 地形
  createGround();
  createCampusRoads();
  createGreenAreas();

  // 运动设施
  createTrack();
  createGrandstand();
  createBasketballCourts();

  // 建筑
  createBuildings();

  // 植被与设施
  createTrees();
  createStreetLamps();

  // UI
  bindUI();
  updateTimeDisplay(12);
  updateTimeOfDay(12);   // 初始化为正午

  requestAnimationFrame(animate);
  setTimeout(() => document.getElementById('loader').classList.add('hide'), 300);
}

boot();
