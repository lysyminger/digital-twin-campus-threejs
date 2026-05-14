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

  renderer.render(scene, camera);

  // 小地图每帧刷新
  drawMinimap();
}

// ===== 启动 =====
function boot() {
  initScene();

  // 天空穹顶（要在 updateTimeOfDay 之前，让 timeOfDay 检测到 skyDome 存在）
  initSkyDome();

  // 从 location.js 恢复编辑器存档（如果有的话）
  editorLoadAll();

  // 地形
  createGround();
  createCampusRoads();
  createGreenAreas();

  // 运动设施 + 国旗杆
  createTrack();
  createGrandstand();
  createBasketballCourts();
  createFlagpole();

  // 建筑
  createBuildings();

  // 植被与设施
  createTrees();
  createStreetLamps();
  createBenches();

  // UI
  bindUI();
  bindFreeRoam();   // 注册 PointerLock / mousemove / keydown 全局事件
  initMinimap();    // 初始化小地图
  initGreenEditor();     // 草坪编辑器（按 G 键打开）
  initBuildingEditor();  // 建筑编辑器（按 B 键打开）
  initRoadEditor();      // 道路编辑器（按 R 键打开）
  _editorInitButtons();  // 左下角存档/导入按钮
  updateTimeDisplay(12);
  updateTimeOfDay(12);   // 初始化为正午

  // 自动加载 location.js 中指定的 GLB 模型
  _autoLoadGLBFromData();

  requestAnimationFrame(animate);
  setTimeout(() => document.getElementById('loader').classList.add('hide'), 300);
}

boot();
