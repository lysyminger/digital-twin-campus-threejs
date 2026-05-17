# 浙江树人学院数字孪生交互系统

> **浙江树人学院信息科技学院《计算机图形学》期中作业**

基于 Three.js 构建的校园三维可视化系统，参考卫星图还原拱宸桥校区 ~44 栋建筑布局。核心亮点是**内置可视化场景编辑器**——无需修改代码，直接在浏览器中拖拽布置建筑、道路和草坪，并导入混元3D 生成的 GLB 模型。**双击 `index.html` 即可运行**，零依赖零构建。

---

## 团队分工与贡献

### 姚志刚（lysyminger）

负责**场景搭建 + 编辑器系统 + GLB 模型集成**：

| 阶段 | 主要工作 |
|------|----------|
| v0.1 | 项目骨架初始化、UI 深色玻璃拟态界面 |
| v0.2 | 基于卫星图搭建地坪、23条道路ribbon mesh、椭圆跑道、运动设施 |
| v0.3 | 44 栋校园建筑数据对齐与建模（三级精度） |
| v0.4 | 植被自动散布、路灯布点、长椅 |
| v0.6 | 小地图（右下角俯视 canvas） |
| v0.7 | **草坪编辑器(G)、建筑编辑器(B)、道路编辑器(R)** |
| v0.7 | GLB 模型导入（混元3D）、存档系统（location.js 导入/导出） |
| 优化 | 路灯 PointLight 精简防卡死、道路 z-fighting 修复、项目结构整理 |

### 涂怀夫（HeWeigui）

负责**日夜循环 + 漫游系统 + 视觉增强渲染**：

| 阶段 | 主要工作 |
|------|----------|
| v0.5 | 日夜循环系统（太阳弧线运动 + 三段色插值 + 路灯亮灭） |
| v0.6 | 自动观光漫游（CatmullRom 曲线）、第一人称自由漫游（WASD + PointerLock） |
| v0.7 | 动态天空穹顶 + 18朵云（ShaderMaterial 渐变 + 太阳光晕） |
| v0.7 | 建筑名称标签（CSS2DRenderer + glassmorphism） |
| v0.7 | 窗户夜间亮灯（65% 随机点亮，暖黄 emissive） |
| v0.7 | Bloom 泛光后处理（UnrealBloomPass，夜间 strength=0.6） |
| v0.7 | 落叶 + 萤火虫粒子效果（自定义 ShaderMaterial） |
| 优化 | 灯光优化、Bloom CDN 加载顺序修复、boot 单步隔离 |

---

## 核心特色：可视化场景编辑器

本项目最大亮点是**无需写代码即可编辑整个校园场景**：

| 快捷键 | 编辑器 | 功能 |
|--------|--------|------|
| **G** | 草坪编辑器 | 新增/删除/拖拽草坪��调整尺寸和颜色 |
| **B** | 建筑编辑器 | 新增/删除/拖拽建筑，调整宽高深，直接加载 GLB 模型替换 |
| **R** | 道路编辑器 | 新增/删除道路，拖拽路径控制点，调整宽度 |

**工作流**：
1. 按 G/B/R 进入对应编辑器，鸟瞰视角自动打开
2. 在场景中拖拽对象、调整属性
3. 点击 **💾 下载存档** 导出 `location.js`
4. 将文件放回 `data/` 目录，刷新页面即生效

这使得建筑位置微调、道路重绘、绿化区域规划全部可视化完成，大幅提升了开发效率。

---

## 快速开始

### 方式一：双击打开（推荐）

```
双击 index.html → Chrome / Edge 自动打开
```

> **GLB 模型说明**：`file://` 协议无法直接加载本地 GLB，需先运行 `tools/build_glb_cache.bat` 将 `assets/*.glb` 转为 base64 缓存。

### 方式二：HTTP 服务器（编辑调试用）

```bash
python -m http.server 8080
# 浏览器打开 http://localhost:8080
```

HTTP 模式下 GLB 模型可直接从 `assets/` 加载，无需缓存。

---

## 功能一览

### 四种视角

| 模式 | 说明 |
|------|------|
| 透视 | 默认轨道相机，鼠标旋转/平移/缩放 |
| 鸟瞰 | 正上方 480m 俯视 |
| 观光 | 沿 18 个关键点环形巡游，路过建筑自动弹信息卡 |
| 自由漫游 | WASD + 鼠标第一人称，Shift 加速，Esc 退出 |

### 日夜循环

- 时间滑块 0~24h 实时控制
- 太阳弧线运动、天空渐变色、晨昏泛光
- 夜间路灯亮起、窗户随机暖黄色亮灯、萤火虫粒子

### 视觉增强

- 动态天空穹顶（Shader 渐变 + 太阳光晕 + 18 朵飘云）
- Bloom 泛光后处理（夜间窗户/路灯产生光晕）
- 建筑名称浮动标签（可一键开关）
- 白天落叶 + 夜间萤火虫粒子

### 交互

| 操作 | 效果 |
|------|------|
| 点击建筑/道路/设施 | 弹出信息卡 |
| 图层开关（6个） | 独立显隐各类对象 |
| 时间滑块 | 控制日夜 |
| 建筑标签开关 | 显示/隐藏建筑名称 |

---

## 项目结构

```
.
├── index.html                 入口页面（双击运行）
├── styles/main.css            UI 样式（深色玻璃拟态）
├── js/
│   ├── core.js                场景初始化 + 全局状态 + 存档加载
│   ├── timeOfDay.js           日夜循环
│   ├── sky.js                 天空穹顶 + 飘云
│   ├── terrain.js             地坪 / 路网 / 绿地
│   ├── sports.js              跑道 / 看台 / 篮球场
│   ├── buildings.js           ~44 栋建筑数据与建模
│   ├── vegetation.js          树木 / 路灯 / 长椅
│   ├── labels.js              建筑名称标签（CSS2DRenderer）
│   ├── bloom.js               Bloom 泛光后处理
│   ├── effects.js             落叶 + 萤火虫粒子
│   ├── ui.js                  交互 / 视角切换 / 信息卡
│   ├── tour.js                自动观光（CatmullRom 曲线）
│   ├── freeRoam.js            自由漫游（PointerLock + WASD）
│   ├── greenEditor.js         草坪编辑器（G 键）
│   ├── buildingEditor.js      建筑编辑器（B 键）+ GLB 导入
│   ├── roadEditor.js          道路编辑器（R 键）
│   ├── minimap.js             右下角小地图
│   └── main.js                主循环 + 启动入口
├── data/
│   ├── location.js            编辑器存档（草坪/建筑/道路坐标）
│   └── glb_cache.js           GLB 模型 base64 缓存
├── assets/                    GLB 模型（混元3D 生成）
├── tools/
│   ├── build_glb_cache.bat    GLB → base64 缓存工具
│   └── build_glb_cache.py     Python 转换脚本
├── vendor/
│   ├── three.min.js           Three.js r128
│   └── OrbitControls.js       轨道控制器
├── reference/                 卫星图参考资料
├── docs/
│   ├── CAMPUS_DATA.md         建筑坐标数据（~44 栋）
│   ├── PROMPTS_CAMPUS.md      开发提示词包
│   ├── DEV_LOG.md             AI 协作开发日志
│   ├── prompts_export.md      提示词导出汇总
│   └── 视觉增强开发指南.md      v0.7 视觉增强实施文档
└── README.md
```

---

## 技术栈

| 技术 | 用途 |
|------|------|
| Three.js r128 | 三维渲染（本地 vendor，全局变量版） |
| ShaderMaterial | 天空穹顶、萤火虫粒子、沥青纹理 |
| CSS2DRenderer | 建筑名称浮动标签 |
| UnrealBloomPass | 夜间泛光后处理 |
| GLTFLoader | GLB 模型加载 |
| PointerLock API | 第一人称自由漫游 |
| Canvas API | 云朵贴图程序化生成 |
| 腾讯混元3D | 地标模型生成 |
| Claude Code | AI 辅助开发 |

---

## 版本历史

| 版本 | 内容 | 负责人 |
|------|------|--------|
| v0.1 | UI 骨架 + 场景初始化 | 姚志刚 |
| v0.2 | 地坪 + 路网 + 运动设施 | 姚志刚 |
| v0.3 | ~44 栋校园建筑 | 姚志刚 |
| v0.4 | 植被 + 设施 | 姚志刚 |
| v0.5 | 日夜循环 | 涂怀夫 |
| v0.6 | 自动观光 + 自由漫游 | 涂怀夫 |
| v0.6 | 小地图 | 姚志刚 |
| v0.7 | 场景编辑器 + GLB 导入 + 存档系统 | 姚志刚 |
| v0.7+ | 天空穹顶 + 标签 + 泛光 + 粒子 + 灯光优化 | 涂怀夫 |

---

## 致谢

- [Three.js](https://threejs.org/) — 三维渲染引擎
- [腾讯混元3D](https://3d.hunyuan.tencent.com/) — GLB 模型生成
- [Claude Code](https://claude.ai/code) — AI 辅助开发
