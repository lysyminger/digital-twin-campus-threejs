# 浙江树人学院数字孪生交互系统

> **浙江树人学院信息科技学院《计算机图形学》期中作业**

基于 Three.js 构建的校园三维可视化系统，参考卫星图还原拱宸桥校区 ~44 栋建筑布局，提供透视/鸟瞰/漫游三种视角和可视化编辑器等交互功能。**双击 `index.html` 即可运行**，无需安装任何依赖。

## 团队成员

| 成员 | 负责内容 |
|------|----------|
| 姚志刚 | 校园建筑物摆放、路面摆放 |
| 涂怀夫 | 植被、灯光、自由漫游视角 |

## 快速开始

### 方式一：双击打开（推荐）

```
双击 index.html → Chrome / Edge 自动打开
```

> 如果有 GLB 模型需要加载，先运行一次 `tools/build_glb_cache.bat` 生成缓存。

### 方式二：HTTP 服务器（编辑调试用）

```bash
cd 项目根目录
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

HTTP 模式下 GLB 模型可直接从 `assets/` 加载，无需缓存。

## 操作指南

### 基本操作

| 操作 | 效果 |
|------|------|
| 鼠标左键拖动 | 旋转视角 |
| 鼠标右键拖动 | 平移 |
| 滚轮 | 缩放 |
| 点击建筑/道路/设施 | 弹出信息卡 |

### 视角模式

| 按钮 | 说明 |
|------|------|
| 透视 | 默认 3D 透视视角 |
| 鸟瞰 | 正上方俯视 |
| 观光 | 沿道路自动漫游 |
| 自由漫游 | WASD 移动 + 鼠标转头，Shift 加速，Esc 退出 |

### 可视化编辑器

| 快捷键 | 编辑器 | 功能 |
|--------|--------|------|
| **G** | 草坪编辑器 | 新增/删除/拖拽草坪，调整尺寸和颜色 |
| **B** | 建筑编辑器 | 新增/删除/拖拽建筑，调整参数，加载 GLB 模型 |
| **R** | 道路编辑器 | 新增/删除道路，拖拽路点，调整宽度 |

三个编辑器互斥，同时只能开一个。打开编辑器后左下角出现 **💾 下载存档** / **📂 导入存档** 按钮。

### 存档系统

1. 编辑完成后点 **💾 下载存档** → 浏览器下载 `location.js`
2. 将 `location.js` 放入项目 `data/` 目录（覆盖旧文件）
3. 刷新页面自动加载

### GLB 模型使用

1. 将 `.glb` 文件放入 `assets/` 目录
2. **双击打开**：运行 `tools/build_glb_cache.bat` 生成 base64 缓存 → 刷新页面
3. **HTTP 打开**：直接在建筑编辑器输入文件名加载，无需缓存
4. 在 `data/location.js` 中给建筑添加 `glb`/`glbScale`/`glbRotY` 字段可自动加载

## 项目结构

```
.
├── index.html                 入口页面（双击运行）
├── styles/
│   └── main.css               UI 样式（深色玻璃拟态）
├── js/                        业务脚本（按依赖顺序加载）
│   ├── core.js                全局状态 + 场景初始化 + 存档系统
│   ├── timeOfDay.js           日夜循环（太阳/天空/路灯）
│   ├── terrain.js             地坪 / 路网 / 绿地
│   ├── sports.js              跑道 / 看台 / 篮球场
│   ├── buildings.js           ~44 栋校园建筑数据与建模
│   ├── vegetation.js          树木 / 路灯 / 长椅
│   ├── ui.js                  交互 / 视角切换 / 信息卡
│   ├── tour.js                观光漫游路线
│   ├── freeRoam.js            自由漫游（PointerLock + WASD）
│   ├── greenEditor.js         草坪编辑器（G 键）
│   ├── buildingEditor.js      建筑编辑器（B 键）+ GLB 导入
│   ├── roadEditor.js          道路编辑器（R 键）
│   ├── minimap.js             右下角小地图
│   └── main.js                主循环 + 启动入口
├── data/                      运行时数据（本地生成，不进仓库）
│   ├── location.js            编辑器存档（草坪/建筑/道路坐标）
│   └── glb_cache.js           GLB 模型 base64 缓存
├── assets/                    GLB 模型源文件
│   └── *.glb                  腾讯混元3D 生成的模型
├── tools/                     工具脚本
│   ├── build_glb_cache.bat    双击运行：将 assets/*.glb 转为缓存
│   └── build_glb_cache.py     Python 转换脚本（需 Python 3）
├── vendor/                    第三方库（本地 vendor）
│   ├── three.min.js           Three.js r128
│   └── OrbitControls.js       轨道控制器
├── reference/                 卫星图等建模参考资料
├── docs/
│   ├── CAMPUS_DATA.md         建筑坐标权威数据（~44 栋）
│   └── PROMPTS_CAMPUS.md      开发提示词包（v0.1 ~ v0.7）
└── README.md
```

## 技术栈

- **Three.js r128** — 三维渲染（本地 vendor，全局变量版，非 ES Module）
- **GLTFLoader** — GLB 模型加载（CDN: three@0.128.0）
- **腾讯混元3D** — 地标模型生成
- **Claude Code** — AI 辅助开发

## 坐标系约定

- 1 unit ≈ 1 米，校园总范围约 200m × 200m
- 校园中心 `(0, 0, 0)` = 贺田图书馆
- 东 = `+X`，北 = `-Z`，上 = `+Y`
- 建筑坐标来源：`docs/CAMPUS_DATA.md`

## 版本历史

| 版本 | 内容 | 状态 |
|------|------|------|
| v0.1 | UI 骨架 + 场景初始化 | ✅ |
| v0.2 | 地坪 + 路网（ribbon mesh） | ✅ |
| v0.3 | ~44 栋校园建筑 | ✅ |
| v0.4 | 植被 + 路灯 + 长椅 | ✅ |
| v0.5 | 日夜循环（太阳运动 + 路灯亮灭） | ✅ |
| v0.6 | 观光漫游 + 自由漫游 + 小地图 + 草坪编辑器 | ✅ |
| v0.7 | 建筑/道路编辑器 + GLB 模型导入 + 存档系统 | ✅ |

## 致谢

- [Three.js](https://threejs.org/)
- [腾讯混元3D](https://3d.hunyuan.tencent.com/)
- [Claude Code](https://claude.ai/code)
