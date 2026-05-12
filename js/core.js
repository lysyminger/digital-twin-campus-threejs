/* ============================================================
   核心：全局状态 + initScene + 共用工具函数
   坐标系：1 unit ≈ 1 m  |  原点 = 贺田图书馆  |  北 = -Z，东 = +X
   依赖：vendor/three.min.js, vendor/OrbitControls.js（先加载）
   ============================================================ */

// ===== 全局状态（跨模块共享） =====
let scene, camera, renderer, controls;
let raycaster, pointer;
let sun, ambient;
let lastFrame = performance.now();
let frameCount = 0, fpsTimer = 0;
let currentView = 'persp';                // 'persp' | 'top' | 'tour'

const interactables = [];                 // 所有可点击对象
const layerGroups = {                     // 图层分组
  ground:     new THREE.Group(),
  roads:      new THREE.Group(),
  buildings:  new THREE.Group(),
  vegetation: new THREE.Group(),
  facilities: new THREE.Group(),
  aiModels:   new THREE.Group()
};

// ===== 共用材质工厂 =====
// 贴地薄片材质：polygonOffset 防止 z-fighting
// priority 越大越靠近相机：1=绿地，2=道路，3=球场/跑道，4=跑道内场
function overlayMat(color, priority) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.9,
    polygonOffset: true,
    polygonOffsetFactor: -priority,
    polygonOffsetUnits: -priority
  });
}

// ===== 场景初始化 =====
function initScene() {
  // 场景 + 雾
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb);
  scene.fog = new THREE.Fog(0x87ceeb, 400, 1200);

  // 相机（透视）near=1 提升远距离深度缓冲精度
  const aspect = window.innerWidth / window.innerHeight;
  camera = new THREE.PerspectiveCamera(55, aspect, 1, 2000);
  camera.position.set(260, 200, 260);
  camera.lookAt(0, 0, 0);

  // 渲染器
  renderer = new THREE.WebGLRenderer({
    canvas: document.getElementById('scene'),
    antialias: true
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputEncoding = THREE.sRGBEncoding;

  // OrbitControls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 20;
  controls.maxDistance = 600;
  controls.maxPolarAngle = Math.PI * 0.48;
  controls.target.set(0, 0, 0);

  // 光照
  ambient = new THREE.AmbientLight(0xffffff, 0.45);
  scene.add(ambient);

  sun = new THREE.DirectionalLight(0xffffff, 1.0);
  sun.position.set(150, 220, 100);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left   = -500;
  sun.shadow.camera.right  =  500;
  sun.shadow.camera.top    =  500;
  sun.shadow.camera.bottom = -500;
  sun.shadow.camera.near = 1;
  sun.shadow.camera.far  = 800;
  scene.add(sun);

  // 图层组挂到场景
  Object.values(layerGroups).forEach(g => scene.add(g));

  // Raycaster
  raycaster = new THREE.Raycaster();
  pointer = new THREE.Vector2();
}
