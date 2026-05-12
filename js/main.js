/* ============================================================
   主循环 + 启动入口
   依赖：scene.js / factories.js / interaction.js / minimap.js
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

  controls.update();
  renderer.render(scene, camera);
}

// ===== 启动 =====
function boot() {
  initScene();
  createGround();
  createRoads();
  createTrack();
  createGrandstand();
  createBasketballCourts();
  createFootballField();
  createGreenAreas();
  bindUI();
  updateTimeDisplay(12);
  requestAnimationFrame(animate);

  // 隐藏加载遮罩
  setTimeout(() => document.getElementById('loader').classList.add('hide'), 300);
}

boot();
