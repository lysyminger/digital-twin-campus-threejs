/* ============================================================
   小地图：右下俯视画板（路网骨架 + 建筑点 + 相机位置/朝向）
   依赖：scene.js（layerGroups, camera, controls）
   ============================================================ */

let minimapCtx, minimapCanvas;

function initMinimap() {
  minimapCanvas = document.getElementById('minimap-canvas');
  const dpr = window.devicePixelRatio || 1;
  const size = 160;
  minimapCanvas.width = size * dpr;
  minimapCanvas.height = size * dpr;
  minimapCtx = minimapCanvas.getContext('2d');
  minimapCtx.scale(dpr, dpr);
}

function drawMinimap() {
  if (!minimapCtx) return;
  const W = 160, H = 160;
  // 世界 900 × 650 → 小地图 160 × 160（取较大边居中）
  const worldW = 900, worldH = 650;
  const scale = Math.min(W / worldW, H / worldH);
  const ox = W / 2, oz = H / 2;

  minimapCtx.clearRect(0, 0, W, H);

  // 校园边界
  minimapCtx.strokeStyle = 'rgba(120,200,255,0.35)';
  minimapCtx.lineWidth = 1;
  minimapCtx.strokeRect(ox - worldW * scale / 2, oz - worldH * scale / 2,
                        worldW * scale, worldH * scale);

  // 路网骨架（v0.2 起：从 group.userData.points 直接绘线）
  minimapCtx.strokeStyle = 'rgba(120,200,255,0.55)';
  minimapCtx.lineWidth = 1;
  layerGroups.roads.children.forEach(g => {
    const pts = g.userData?.points;
    if (!pts) return;
    minimapCtx.beginPath();
    pts.forEach(([x, z], i) => {
      const sx = ox + x * scale, sz = oz + z * scale;
      if (i === 0) minimapCtx.moveTo(sx, sz);
      else minimapCtx.lineTo(sx, sz);
    });
    minimapCtx.stroke();
  });

  // 建筑点（v0.3 起会有内容）
  layerGroups.buildings.children.forEach(m => {
    const x = ox + m.position.x * scale;
    const z = oz + m.position.z * scale;
    minimapCtx.fillStyle = '#78c8ff';
    minimapCtx.fillRect(x - 2, z - 2, 4, 4);
  });

  // 相机位置（红点 + 朝向）
  const cx = ox + camera.position.x * scale;
  const cz = oz + camera.position.z * scale;
  minimapCtx.fillStyle = '#ff7a59';
  minimapCtx.beginPath();
  minimapCtx.arc(cx, cz, 4, 0, Math.PI * 2);
  minimapCtx.fill();

  // 朝向线（指向 target）
  const tx = ox + controls.target.x * scale;
  const tz = oz + controls.target.z * scale;
  minimapCtx.strokeStyle = '#ff7a59';
  minimapCtx.beginPath();
  minimapCtx.moveTo(cx, cz);
  minimapCtx.lineTo(tx, tz);
  minimapCtx.stroke();
}
