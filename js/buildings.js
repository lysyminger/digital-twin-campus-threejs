/* ============================================================
   建筑：~40 栋校园建筑（坐标来自 CAMPUS_DATA.md，不可修改）
   依赖：core.js（layerGroups, interactables）
   ============================================================ */

// ===== 建筑数据 =====
const BUILDING_DATA = [
  // 核心区
  { id:"C-CORE-01", name:"贺田图书馆/树兰国际医学院", x:-4, z:19,
    w:55, d:35, h:28, shape:"library", color:0xe8dcc4, zone:"核心区", pri:"high",
    desc:"校园核心地标，集图书馆与医学院于一体，底部裙房+中央塔楼。" },
  { id:"C-CORE-02", name:"树人礼堂", x:-53, z:-36,
    w:35, d:22, h:10, shape:"rect", color:0xd8d0c0, zone:"核心区", pri:"high",
    desc:"校园大礼堂，承办大型活动和学术报告。" },
  { id:"C-CORE-03", name:"信息学院第二实验大楼", x:50, z:-33,
    w:50, d:16, h:20, shape:"rect", color:0xe0d8c8, zone:"核心区", pri:"high",
    desc:"信息科技学院实验教学楼，5 层。" },

  // 南侧教学区
  { id:"S-EDU-00", name:"南校区南门", x:-2, z:225,
    w:14, d:4, h:7, shape:"gate", color:0xc8c0b0, zone:"教学区", pri:"high",
    desc:"校园南侧主入口。" },
  { id:"S-EDU-01", name:"教学主楼 A1", x:65, z:185,
    w:50, d:14, h:24, shape:"rect", color:0xe8dcc4, zone:"教学区", pri:"high",
    desc:"南区东侧教学主楼，6 层。" },
  { id:"S-EDU-02", name:"教学主楼 A2", x:-62, z:183,
    w:50, d:14, h:24, shape:"rect", color:0xe8dcc4, zone:"教学区", pri:"high",
    desc:"南区西侧教学主楼，6 层。" },
  { id:"S-EDU-03", name:"教学主楼 A3", x:69, z:138,
    w:50, d:14, h:20, shape:"rect", color:0xdcd4c4, zone:"教学区", pri:"medium",
    desc:"东侧教学楼，5 层。" },
  { id:"S-EDU-04", name:"教学主楼 A4", x:-64, z:139,
    w:50, d:14, h:24, shape:"rect", color:0xe8dcc4, zone:"教学区", pri:"high",
    desc:"西侧教学主楼，6 层。" },
  { id:"S-EDU-05", name:"裙房 B1", x:73, z:97,
    w:30, d:12, h:8, shape:"rect", color:0xd0ccc0, zone:"教学区", pri:"medium",
    desc:"教学区附属裙房，2 层。" },
  { id:"S-EDU-06", name:"裙房 B2", x:-71, z:101,
    w:30, d:12, h:8, shape:"rect", color:0xd0ccc0, zone:"教学区", pri:"medium",
    desc:"教学区附属裙房，2 层。" },

  // 西侧教学区
  { id:"W-EDU-01", name:"树人之家", x:-215, z:-52,
    w:35, d:15, h:16, shape:"rect", color:0xd8d0c8, zone:"教学区", pri:"medium",
    desc:"西侧综合服务建筑，4 层。" },
  { id:"W-EDU-02", name:"15号楼", x:-158, z:-79,
    w:40, d:14, h:20, shape:"rect", color:0xdcd4c4, zone:"教学区", pri:"medium",
    desc:"西侧教学楼，5 层。" },
  { id:"W-EDU-03", name:"17号楼", x:-168, z:-26,
    w:40, d:14, h:20, shape:"rect", color:0xdcd4c4, zone:"教学区", pri:"medium",
    desc:"西侧教学楼，5 层。" },
  { id:"W-EDU-04", name:"23号楼", x:-167, z:6,
    w:40, d:14, h:20, shape:"rect", color:0xdcd4c4, zone:"教学区", pri:"medium",
    desc:"西侧教学楼，5 层。" },
  { id:"W-EDU-05", name:"16号楼/第一实验大楼", x:-117, z:-21,
    w:45, d:16, h:24, shape:"rect", color:0xe0d8c8, zone:"教学区", pri:"high",
    desc:"第一实验大楼，6 层，承担多个学院实验教学。" },
  { id:"W-EDU-06", name:"14号楼/生环实验", x:-129, z:-78,
    w:35, d:14, h:16, shape:"rect", color:0xd0ccc0, zone:"教学区", pri:"medium",
    desc:"生物与环境学院实验楼，4 层。" },
  { id:"W-EDU-07", name:"保卫处", x:-99, z:-75,
    w:12, d:8, h:8, shape:"rect", color:0xc8c4bc, zone:"教学区", pri:"low",
    desc:"校园保卫处，2 层小楼。" },

  // 东部教学区
  { id:"E-EDU-01", name:"12号楼/共享空间", x:47, z:-152,
    w:40, d:16, h:20, shape:"rect", color:0xe0d8c8, zone:"教学区", pri:"high",
    desc:"共享学习空间，5 层。" },
  { id:"E-EDU-02", name:"9号楼/交叉科学研究院", x:119, z:-127,
    w:45, d:16, h:20, shape:"rect", color:0xe0d8c8, zone:"教学区", pri:"high",
    desc:"交叉科学研究院，5 层。" },
  { id:"E-EDU-03", name:"10号楼/实验室", x:48, z:-81,
    w:35, d:14, h:16, shape:"rect", color:0xd0ccc0, zone:"教学区", pri:"medium",
    desc:"实验楼，4 层。" },
  { id:"E-EDU-04", name:"11号楼/青创园", x:48, z:-125,
    w:35, d:14, h:16, shape:"rect", color:0xd0ccc0, zone:"教学区", pri:"medium",
    desc:"创新创业空间，4 层。" },

  // 行政区
  { id:"SE-ADM-01", name:"行政中心2", x:115, z:-28,
    w:30, d:18, h:16, shape:"rect", color:0xc8c8d0, zone:"行政区", pri:"high",
    desc:"校园行政办公楼，4 层。" },
  { id:"SE-ADM-02", name:"查济民大厦", x:190, z:-3,
    w:20, d:20, h:48, shape:"rect", color:0xc0c4cc, zone:"行政区", pri:"high",
    desc:"校园最高建筑，行政地标，12 层塔楼。" },
  { id:"SE-ADM-03", name:"20号楼", x:49, z:-31,
    w:20, d:12, h:12, shape:"rect", color:0xc8c4bc, zone:"行政区", pri:"medium",
    desc:"小型行政办公楼，3 层。" },

  // 东侧生活区
  { id:"E-LIFE-01", name:"2号楼", x:191, z:-27,
    w:30, d:12, h:20, shape:"rect", color:0xd0c8c0, zone:"生活区", pri:"low",
    desc:"东侧生活区宿舍楼，5 层。" },
  { id:"E-LIFE-02", name:"3号楼", x:241, z:-25,
    w:30, d:12, h:20, shape:"rect", color:0xd0c8c0, zone:"生活区", pri:"low",
    desc:"东侧生活区宿舍楼，5 层。" },
  { id:"E-LIFE-03", name:"4号楼", x:239, z:2,
    w:30, d:12, h:20, shape:"rect", color:0xd0c8c0, zone:"生活区", pri:"low",
    desc:"东侧生活区宿舍楼，5 层。" },
  { id:"E-LIFE-04", name:"5号楼", x:277, z:-25,
    w:30, d:12, h:20, shape:"rect", color:0xd0c8c0, zone:"生活区", pri:"low",
    desc:"东侧生活区宿舍楼，5 层。" },
  { id:"E-LIFE-05", name:"6号楼", x:276, z:5,
    w:30, d:12, h:20, shape:"rect", color:0xd0c8c0, zone:"生活区", pri:"low",
    desc:"东侧生活区宿舍楼，5 层。" },
  { id:"E-LIFE-06", name:"7号楼", x:275, z:32,
    w:30, d:12, h:20, shape:"rect", color:0xd0c8c0, zone:"生活区", pri:"low",
    desc:"东侧生活区宿舍楼，5 层。" },
  { id:"E-LIFE-07", name:"8号楼", x:275, z:60,
    w:30, d:12, h:20, shape:"rect", color:0xd0c8c0, zone:"生活区", pri:"low",
    desc:"东侧生活区宿舍楼，5 层。" },

  // 运动区（仅体育馆，操场/球场在 sports.js）
  { id:"NE-SPT-01", name:"体育馆", x:195, z:-239,
    w:55, d:35, h:15, shape:"rect", color:0xc0c8d0, zone:"运动区", pri:"high",
    desc:"校园综合体育馆，大体量建筑。" },

  // 东北生活区
  { id:"NE-LIFE-01", name:"致勤楼西楼", x:200, z:-313,
    w:40, d:14, h:24, shape:"rect", color:0xd0c8c0, zone:"生活区", pri:"medium",
    desc:"东北生活区宿舍楼，6 层。" },
  { id:"NE-LIFE-02", name:"综合宿舍楼", x:202, z:-350,
    w:45, d:16, h:32, shape:"rect", color:0xd0c8c0, zone:"生活区", pri:"medium",
    desc:"东北生活区高层宿舍楼，8 层。" },
  { id:"NE-LIFE-03", name:"26号楼", x:301, z:-166,
    w:35, d:14, h:20, shape:"rect", color:0xd0c8c0, zone:"生活区", pri:"medium",
    desc:"东北生活区建筑，5 层。" },
  { id:"NE-LIFE-04", name:"艺术馆", x:346, z:-176,
    w:30, d:18, h:12, shape:"rect", color:0xd4ccc8, zone:"生活区", pri:"medium",
    desc:"校园艺术展览馆，3 层。" },

  // 西北生活区
  { id:"NW-LIFE-01", name:"清乐园1号楼", x:-325, z:-123,
    w:35, d:12, h:24, shape:"rect", color:0xd0c8c0, zone:"生活区", pri:"low",
    desc:"西北生活区宿舍楼，6 层。" },
  { id:"NW-LIFE-02", name:"清乐园2号楼", x:-292, z:-124,
    w:35, d:12, h:24, shape:"rect", color:0xd0c8c0, zone:"生活区", pri:"low",
    desc:"西北生活区宿舍楼，6 层。" },
  { id:"NW-LIFE-03", name:"清乐园3/4号楼", x:-316, z:-161,
    w:40, d:12, h:24, shape:"rect", color:0xd0c8c0, zone:"生活区", pri:"medium",
    desc:"西北生活区宿舍楼，6 层。" },
  { id:"NW-LIFE-04", name:"致和园2号楼", x:-179, z:249,
    w:35, d:12, h:24, shape:"rect", color:0xd0c8c0, zone:"生活区", pri:"low",
    desc:"西南侧生活区宿舍楼，6 层。" },

  // 出入口
  { id:"GATE-N", name:"北校区南门", x:148, z:-80,
    w:8, d:3, h:4, shape:"gate", color:0xb8b0a8, zone:"出入口", pri:"low",
    desc:"校园北区入口。" }
];

// ===== 墙体材质缓存 =====
const wallMatCache = {};
function getWallMat(color) {
  if (!wallMatCache[color]) {
    wallMatCache[color] = new THREE.MeshStandardMaterial({ color, roughness: 0.8 });
  }
  return wallMatCache[color];
}
const roofMat = new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.7 });
const windowMat = new THREE.MeshStandardMaterial({ color: 0x3a5a7a, roughness: 0.3, metalness: 0.2 });
// 夜间亮灯材质：暖黄发光
const windowMatOn = new THREE.MeshStandardMaterial({
  color: 0xffd080,
  emissive: 0xffa040,
  emissiveIntensity: 0.8,
  roughness: 0.3
});
// 窗户注册表，由 timeOfDay.js 的 updateTimeOfDay 统一控制夜间亮灯
const windowMeshes = [];

// ===== 添加窗户（仅 high priority） =====
function addWindows(group, info) {
  const floors = Math.round(info.h / 4);
  const faces = [
    { axis: 'x', sign: 1,  len: info.d, pos: [info.w / 2 + 0.05, 0, 0], rot: [0, Math.PI / 2, 0] },
    { axis: 'x', sign: -1, len: info.d, pos: [-info.w / 2 - 0.05, 0, 0], rot: [0, -Math.PI / 2, 0] },
    { axis: 'z', sign: 1,  len: info.w, pos: [0, 0, info.d / 2 + 0.05], rot: [0, 0, 0] },
    { axis: 'z', sign: -1, len: info.w, pos: [0, 0, -info.d / 2 - 0.05], rot: [0, Math.PI, 0] }
  ];

  faces.forEach(face => {
    const cols = Math.min(Math.floor(face.len / 4), 6);
    if (cols < 1) return;
    const spacing = face.len / (cols + 1);

    for (let f = 0; f < floors; f++) {
      for (let c = 0; c < cols; c++) {
        const win = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.2), windowMat);
        const offset = spacing * (c + 1) - face.len / 2;
        const wy = 2.5 + f * 4;

        if (face.axis === 'z') {
          win.position.set(offset + face.pos[0], wy, face.pos[2]);
        } else {
          win.position.set(face.pos[0], wy, offset + face.pos[2]);
        }
        win.rotation.set(...face.rot);
        group.add(win);
        windowMeshes.push(win);   // 注册到全局表供日夜循环切换
      }
    }
  });
}

// ===== 建筑工厂 =====
function buildStructure(info) {
  const group = new THREE.Group();
  const mat = getWallMat(info.color);

  if (info.shape === 'library') {
    // 图书馆：扁平裙房 + 中央竖直塔楼
    const baseH = 8;
    const base = new THREE.Mesh(new THREE.BoxGeometry(info.w, baseH, info.d), mat);
    base.position.y = baseH / 2;
    base.castShadow = true; base.receiveShadow = true;
    group.add(base);

    const baseRoof = new THREE.Mesh(new THREE.BoxGeometry(info.w + 1, 0.3, info.d + 1), roofMat);
    baseRoof.position.y = baseH + 0.15;
    group.add(baseRoof);

    const towerW = 18, towerD = 14;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(towerW, info.h, towerD), mat);
    tower.position.y = info.h / 2;
    tower.castShadow = true; tower.receiveShadow = true;
    group.add(tower);

    const towerRoof = new THREE.Mesh(new THREE.BoxGeometry(towerW + 1, 0.3, towerD + 1), roofMat);
    towerRoof.position.y = info.h + 0.15;
    group.add(towerRoof);

    // 塔楼窗户
    const towerInfo = { w: towerW, d: towerD, h: info.h, pri: 'high' };
    addWindows(group, towerInfo);
  } else if (info.shape === 'L') {
    // L 形：主翼 + 侧翼
    const mainW = info.w * 0.6, sideD = info.d * 0.5;
    const main = new THREE.Mesh(new THREE.BoxGeometry(info.w, info.h, info.d * 0.5), mat);
    main.position.y = info.h / 2;
    main.castShadow = true; main.receiveShadow = true;
    group.add(main);

    const side = new THREE.Mesh(new THREE.BoxGeometry(info.w * 0.4, info.h, info.d), mat);
    side.position.set(info.w * 0.3, info.h / 2, info.d * 0.25);
    side.castShadow = true; side.receiveShadow = true;
    group.add(side);

    // 屋顶
    const roof1 = new THREE.Mesh(new THREE.BoxGeometry(info.w + 1, 0.3, info.d * 0.5 + 1), roofMat);
    roof1.position.y = info.h + 0.15;
    group.add(roof1);
    const roof2 = new THREE.Mesh(new THREE.BoxGeometry(info.w * 0.4 + 1, 0.3, info.d + 1), roofMat);
    roof2.position.set(info.w * 0.3, info.h + 0.15, info.d * 0.25);
    group.add(roof2);
  } else if (info.shape === 'gate') {
    // 校门：两个柱子 + 横梁
    const pillarMat = new THREE.MeshStandardMaterial({ color: 0x8a7a6a, roughness: 0.7 });
    [-1, 1].forEach(s => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.5, info.h, 1.5), pillarMat);
      pillar.position.set(s * info.w / 2.5, info.h / 2, 0);
      pillar.castShadow = true;
      group.add(pillar);
    });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(info.w, 1.5, 2), mat);
    beam.position.y = info.h - 0.75;
    beam.castShadow = true;
    group.add(beam);
  } else {
    // 标准矩形体块
    const body = new THREE.Mesh(new THREE.BoxGeometry(info.w, info.h, info.d), mat);
    body.position.y = info.h / 2;
    body.castShadow = true; body.receiveShadow = true;
    group.add(body);

    const roof = new THREE.Mesh(new THREE.BoxGeometry(info.w + 0.5, 0.3, info.d + 0.5), roofMat);
    roof.position.y = info.h + 0.15;
    group.add(roof);
  }

  // 高优先级加窗户
  if (info.pri === 'high' && info.shape === 'rect') {
    addWindows(group, info);
  }

  group.position.set(info.x, 0, info.z);
  return group;
}

// ===== 建筑生成主入口 =====
function createBuildings() {
  windowMeshes.length = 0;   // 编辑器重建场景时清空注册表
  BUILDING_DATA.forEach(info => {
    const group = buildStructure(info);
    group.userData = {
      id: info.id,
      name: info.name,
      type: info.zone,
      desc: info.desc
    };
    layerGroups.buildings.add(group);
    interactables.push(group);
    buildingMeshes.push(group);
  });
}
