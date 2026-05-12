# 校园数字孪生 · Claude Code 开发提示词包

> **项目**：浙江树人学院数字孪生交互系统  
> **技术栈**：HTML + CSS + JS + Three.js r128（本地 vendor/ 目录，全局变量版）  
> **约束**：双击 `index.html` 即可运行（file:// 协议，无需服务器）  
> **建筑坐标**：以 `CAMPUS_DATA.md` 为唯一权威数据源，坐标已人工校准，**不可更改**

---

## 当前进度总览

| 版本 | 内容 | 状态 |
|---|---|---|
| v0.1 | UI 骨架 + 场景初始化 | ✅ 已完成 |
| v0.2 | 地坪 + 路网 + 运动设施 + 绿地 | ⚠️ 基本完成，**路网效果差需重做** |
| v0.3 | 校园建筑（~44 栋） | 🔲 待实现 |
| v0.4 | 植被（树木）+ 设施（路灯/长椅） | 🔲 待实现 |
| v0.5 | 日夜循环（时间滑块生效） | 🔲 待实现 |
| v0.6 | 校园漫游动画 | 🔲 待实现 |
| v0.7 | 混元3D GLB 模型集成 | 🔲 待实现 |

### 已有文件结构

```
index.html                 HTML 壳（加载 CSS + JS）
styles/main.css            所有 UI 样式
js/scene.js                全局状态 + initScene()
js/factories.js            地坪/路网/运动设施/绿地工厂函数
js/interaction.js          点击拾取/UI 事件/视角切换
js/minimap.js              小地图（当前未启用，HTML 元素已移除）
js/main.js                 animate() + boot() 启动入口
vendor/three.min.js        Three.js r128 全局版
vendor/OrbitControls.js    轨道控制器
reference/                 卫星图等参考资料
CAMPUS_DATA.md             建筑坐标权威数据（~44 栋，人工校准）
```

### 关键技术约定

- 世界坐标系：1 unit ≈ 1m，原点 = 贺田图书馆，北=-Z，东=+X
- `layerGroups = { ground, roads, buildings, vegetation, facilities, aiModels }`
- `interactables` 数组：所有可点击对象
- `overlayMat(color, priority)` 材质工厂：用 polygonOffset 防止 z-fighting
- 相机 near=1（不是 0.1），maxDistance=600，初始位置 (260,200,260)
- 所有 mesh 要 `castShadow + receiveShadow`
- UI：深色玻璃拟态，强调色 `#78c8ff`

---

## 提示词 1：v0.2 路网重做（修复当前路面效果）

```
任务：重做 js/factories.js 中的道路渲染，当前效果很差（分段 BoxGeometry + 圆柱拐角有明显接缝和毛刺）

【当前问题】
- createRoads() 用 BoxGeometry 分段 + CylinderGeometry 拐角圆盘拼接
- 折线段之间有明显缝隙、重叠、深度闪烁
- 鸟瞰下看起来不像道路，更像碎片

【改进方案】
用 THREE.Shape + ExtrudeGeometry 或 BufferGeometry 自定义 ribbon mesh：
1. 对每条道路的 points 数组，沿折线方向计算每个点的法线（垂直于行进方向）
2. 在每个关键点两侧各偏移 width/2，生成左右两排顶点
3. 拐角处用角平分线方向（bisector）偏移，保证内外侧平滑过渡
4. 用这些顶点构建一个连续的三角面片带（BufferGeometry + indexed triangles）
5. 或者更简单：用 THREE.Shape 沿折线路径描出一个封闭多边形，再用 ShapeGeometry 渲染

【数据不变】
保留现有的 ROAD_DATA 数组（10 条道路、坐标、宽度），只改渲染逻辑。

【材质】
- 沥青深灰 0x4a4a4a
- 用 overlayMat(0x4a4a4a, 2) 保持 polygonOffset 防 z-fighting
- y = 0.05（已有值，保持不变）
- receiveShadow = true

【约束】
- 不要修改 ROAD_DATA 的坐标数据
- 不要破坏 userData（小地图等功能需要 points 和 width 字段）
- 不要影响其他工厂函数（createTrack, createGrandstand 等）
- 保持 interactables 注册

【验收】
- 鸟瞰视角下道路是连续光滑的灰色条带，无接缝、无深度闪烁
- 拐角处过渡自然，不出现尖角或重叠
- 点击道路仍能弹出信息卡
- FPS ≥ 55

完成后给我 git commit message。
```

---

## 提示词 2：v0.3 校园建筑

```
任务：基于 CAMPUS_DATA.md 中已校准的建筑坐标，添加 ~44 栋校园建筑

【重要约束】
- 所有建筑坐标以 CAMPUS_DATA.md 的 campusBuildings 数组为唯一数据源
- **绝对不要修改或重新估算建筑的 x、z 坐标**
- 坐标已经过人工拖拽校准，精度可信

【实现要求】

1. 在 js/factories.js 中创建 createBuildings() 函数
2. 把 CAMPUS_DATA.md 中的 campusBuildings 数组复制到代码中作为数据源
3. 根据 priority 和 zone 分三级建模：

   **第一批（priority: "high"，~10 栋）—— 精细建模**
   - 贺田图书馆 (-4, 19)：L 形或多体块组合，4~5 层，米色墙体
   - 树人礼堂 (-53, -36)：大跨度单层，弧形或斜屋顶
   - 信息学院第二实验大楼 (50, -33)：长条形 5 层
   - 教学主楼 A1 (65, 185) / A2 (-62, 183)：对称长条形 6 层
   - 教学主楼 A4 (-64, 139)：同上
   - 查济民大厦 (190, -3)：高层塔楼 10~12 层
   - 9号楼 (119, -127)：中等高度实验/教学楼
   - 16号楼 (-117, -21)：实验大楼 5~6 层
   - 体育馆 (195, -239)：大体量弧顶或平顶建筑

   **第二批（priority: "medium"，~15 栋）—— 普通体块**
   - 用单个 BoxGeometry，层高 4m × 估算层数
   - 墙体浅灰或米色，顶部深灰薄片

   **第三批（priority: "low"，~15 栋）—— 简化体块**
   - 单个 BoxGeometry，颜色略透明或偏淡
   - 无窗户细节

4. 每栋建筑构建为 THREE.Group，设置 userData：
   - userData.id = 建筑 ID（如 "C-CORE-01"）
   - userData.name = 建筑名称
   - userData.type = zone（核心区/教学区/行政区/生活区/运动区）
   - userData.desc = 简短描述

5. 所有建筑加入 layerGroups.buildings + interactables
6. zone 为 "AI" 的条目（AI-01、AI-02）**跳过**，留给 v0.7 的 GLB 模型
7. zone 为 "出入口" 的条目可以简化为标牌或小型装饰物

【窗户（仅第一批建筑）】
- 用 PlaneGeometry 贴片，深蓝色 0x3a5a7a
- 每面墙每层 3~6 个窗，间距均匀
- 每栋楼总窗户数 < 30

【约束】
- 建筑不要和已有道路重叠（让位 1~2m）
- 运动区的建筑（体育馆）不要和已有操场/球场几何体重叠
- 不要修改 createGround / createRoads / createTrack 等已有函数

【验收】
- 鸟瞰视角下建筑布局与 reference/卫星图.png 大致吻合
- 点击任意建筑弹出名称和介绍
- 图层开关"建筑"能整体显隐
- FPS ≥ 45（建筑数量多，允许略低）

完成后给我 git commit message。
```

---

## 提示词 3：v0.4 植被 + 设施

```
任务：添加校园植被（树木）和设施（路灯、长椅），让场景有生气

【已有绿地】
js/factories.js 中 createGreenAreas() 已创建 5 块绿地色块：
- 中央广场草坪 (0, 5) r=22
- 教学区中央绿地 (-90, 50) 80×40
- 南门花园 (-30, 200) 80×30
- 行政区绿带 (170, 80) 60×30
- 东北外缘绿地 (340, -200) 100×60
这些保留不动，在其上散布树木。

【实现要求】

### 树木
1. 在 js/factories.js 中创建 createTree(x, z, type) 函数：
   - 树干：CylinderGeometry(0.3, 0.3, h, 6)，棕色 0x5c3d1f，h 在 2~4m 随机
   - 树冠 type='broad'：SphereGeometry(r, 8, 6)，r 在 2~3.5m 随机
   - 树冠 type='cone'：ConeGeometry(r, h, 6)
   - 颜色：HSL hue 0.27~0.32 随机，saturation 0.5~0.7，lightness 0.3~0.45
2. 创建 createTrees() 函数：
   - 在 5 块绿地区域内随机散布树木
   - 圆形区域用极坐标采样；矩形区域边缘密、中心疏
   - 避开建筑 5m、道路 2m 范围（可简单用距离检测）
   - 总数 60~100 棵
   - 全部加入 layerGroups.vegetation

### 路灯
3. 创建 createStreetLamp(x, z) 函数：
   - 灯杆：CylinderGeometry(0.1, 0.1, 4, 6)，深灰色 0x555555
   - 灯头：SphereGeometry(0.3, 8, 6)，暖白 0xffcc66
   - 灯头加 PointLight(0xffcc66, 0, 8)（默认关闭，v0.5 夜晚启用）
4. 创建 createStreetLamps() 函数：
   - 沿中央东西主路、南门中轴路两侧，每 20m 放一盏
   - PointLight 总数 ≤ 25
   - 加入 layerGroups.facilities

### 长椅（可选）
5. 创建 createBench(x, z, rotY) 函数：
   - 座板 + 两根支架，木色 0x8b6f47
   - 在核心区建筑入口附近放 5~8 个
   - 加入 layerGroups.facilities

【约束】
- 树木几何精度要低（球 8 段、锥 6 段），控制总三角面数
- 不要修改已有的 createGreenAreas() 函数
- 路灯 PointLight 数量 ≤ 25

【验收】
- 校园有散落的树木，绿地区域明显更密集
- 路灯沿主要道路整齐排列
- 切换"植被""设施"图层开关能独立显隐
- FPS ≥ 45

完成后给我 git commit message。
```

---

## 提示词 4：v0.5 日夜循环

```
任务：让时间滑块真正控制日夜效果（太阳运动 + 天空变色 + 路灯亮灭）

【当前状态】
- 时间滑块已存在（0~24），目前只更新显示文字
- 路灯 PointLight 已存在但 intensity=0（v0.4 创建）
- 太阳 sun 和环境光 ambient 在 js/scene.js 中

【实现要求】
1. 在 js/interaction.js 中创建 updateTimeOfDay(hour) 函数：

   a. 太阳位置沿弧线运动：
      - 6:00 东方地平线 (+X 方向)
      - 12:00 正上方
      - 18:00 西方地平线 (-X 方向)
      - 夜间降到地平线以下

   b. 天空和雾颜色 3 段插值：
      - 白天 7:00~17:00：蓝天 0x87ceeb
      - 晨昏 5:00~7:00 / 17:00~19:00：橘红 0xff8855
      - 夜晚 19:00~5:00：深蓝 0x0a1530

   c. 光照强度：
      - sun.intensity：白天 1.0，晨昏 0.7，夜晚 0.1
      - ambient.intensity：白天 0.45，晨昏 0.3，夜晚 0.15

   d. 路灯控制：
      - hour < 6 || hour > 19：遍历 layerGroups.facilities 中的路灯 PointLight，intensity = 0.5
      - 其余时间：intensity = 0
      - 灯头材质切换 emissive（夜晚发光效果）

2. 修改时间滑块的 input 事件回调，调用 updateTimeOfDay
3. boot() 启动时调用 updateTimeOfDay(12)

【约束】
- 不要新建文件，在现有 js/interaction.js 中添加
- 不要修改 js/scene.js 中的光源初始参数

【验收】
- 拖动滑块从 0 到 24，天空颜色平滑过渡
- 12:00 阳光正上方，6:00/18:00 低角度暖光
- 22:00 深蓝天空，路灯亮起有暖黄光斑
- 阴影方向跟随太阳变化

完成后给我 git commit message。
```

---

## 提示词 5：v0.6 校园漫游动画

```
任务：让"漫游"按钮触发自动校园游览

【当前状态】
- view-tour 按钮已存在，点击后调用 setView('tour')
- 当前 tour 只是切到一个低空透视位 (-100, 30, 200)

【实现要求】

1. 在 js/interaction.js 中定义漫游路线关键点（从 ROAD_DATA 中挑选覆盖主要建筑的路线）：
   - 建议路线：南门 → 中轴路 → 中央广场 → 东西主路 → 运动区环路 → 回到南门
   - 用 THREE.CatmullRomCurve3 连成平滑曲线

2. 添加全局变量：
   - tourMode = false
   - tourT = 0（0~1 进度）
   - tourCurve = null（CatmullRomCurve3 实例）

3. 修改 setView('tour')：
   - 切换 tourMode
   - 进入漫游：controls.enabled = false，按钮高亮
   - 退出漫游：恢复 controls，按钮取消高亮

4. 在 js/main.js 的 animate() 主循环中：
   - 如果 tourMode == true：
     - tourT += dt * 0.02（约 50 秒一圈）
     - tourT > 1 时循环回 0
     - 相机位置 = tourCurve.getPointAt(tourT) + (0, 8, 0)（人眼高度 + 适当抬高）
     - camera.lookAt(tourCurve.getPointAt(Math.min(tourT + 0.02, 1)))

5. 重置视角按钮退出漫游

【可选加分】
- 漫游路过建筑时自动弹信息卡（距离 < 20m 且与上次不同）

【验收】
- 点击"漫游"按钮，相机自动沿校园主路流畅漫游
- 点击"重置视角"或"透视"能退出漫游
- 漫游速度适中，不会太快或太慢

完成后给我 git commit message。
```

---

## 提示词 6：v0.7 混元3D 地标模型集成

```
任务：集成腾讯混元3D 生成的 GLB 模型到场景中

【前置准备（人工完成）】
去 https://3d.hunyuan.tencent.com/ 生成模型：
- 校门："modern Chinese university gate, two stone pillars with red plaque, low poly"
- 雕塑："a campus sculpture, abstract metal art piece, low poly"
- 下载 GLB 文件放到 ./assets/ 目录

【模型位置（来自 CAMPUS_DATA.md，不可修改）】
- 南校区南门 GLB (AI-01)：x=-1, z=225
- 中心广场雕塑 (AI-02)：x=2, z=76

【实现要求】

1. 在 index.html 中添加 GLTFLoader CDN（r128 匹配版本）：
   <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>

2. 在 js/factories.js 中创建 loadAIModels() 函数：
   - 用 THREE.GLTFLoader 加载 ./assets/gate.glb
   - 加载成功：
     a. 计算 bounding box，归一化 scale（校门高约 8m，雕塑高约 3m）
     b. 放置到 CAMPUS_DATA.md 指定坐标
     c. traverse 所有 mesh：castShadow + receiveShadow
     d. userData = { name, type: 'AI生成模型', desc: '由腾讯混元3D生成...' }
     e. 加入 layerGroups.aiModels + interactables
   - 加载失败：console.warn 并继续，不崩溃

3. 同样方式加载 ./assets/sculpture.glb

4. 在 js/main.js 的 boot() 中调用 loadAIModels()

【约束】
- AI 模型只加入 layerGroups.aiModels，不加入 layerGroups.buildings
- 加载是异步的，失败不能阻塞场景
- "AI 模型"图层开关已在 index.html 中存在

【验收】
- 场景中有 2 个比基础几何体精致的 AI 生成模型
- 点击它们弹出"AI生成模型"标签的信息卡
- 切换"AI 模型"图层能整体显隐
- 即使 assets/ 目录缺失，场景仍正常运行

完成后给我 git commit message。
```

---

## 提示词 7：README + AI 使用记录

```
任务：创建 README.md 和 AI_USAGE.md

【1. README.md】

# 浙江树人学院数字孪生交互系统

> **本项目是浙江树人学院信息科技学院期中作业**

## 项目简介
基于 Three.js 构建的校园三维可视化系统，参考卫星图还原 ~44 栋校园建筑布局，
提供透视/鸟瞰/漫游三种视角和点击查看建筑信息等交互功能。

## 团队成员
- 成员A：[姓名/学号]，负责 [模块]
- 成员B：[姓名/学号]，负责 [模块]

## 技术栈
- HTML5 / CSS3 / JavaScript (ES6)
- Three.js r128（本地 vendor/ 目录）
- 腾讯混元3D（生成 GLB 资产）
- AI 辅助：Claude Code

## 功能介绍

### 基础功能
- 三维场景渲染（地坪/建筑/道路/植被/设施/AI模型 6 类对象）
- 多视角切换（透视/鸟瞰/漫游 3 种视角）
- 鼠标交互（拖动旋转/滚轮缩放/点击查看信息）
- 图文信息卡（点击任意建筑弹出名称和简介）
- 图层显隐控制（6 个独立图层开关）

### 加分项
- 日夜循环（时间滑块控制太阳位置和光照颜色）
- 夜间路灯自动亮起
- 自动观光漫游动画
- 混元3D 生成模型集成

## 运行方式
1. 克隆仓库
2. 双击 `index.html` 用 Chrome/Edge 打开
3. 无需安装依赖，Three.js 已在 vendor/ 目录中

## 项目结构
.
├── index.html              HTML 入口
├── styles/main.css         UI 样式
├── js/
│   ├── scene.js            场景初始化 + 全局状态
│   ├── factories.js        场景对象工厂函数
│   ├── interaction.js      交互/UI/视角/日夜
│   ├── minimap.js          小地图（预留）
│   └── main.js             主循环 + 启动
├── vendor/
│   ├── three.min.js        Three.js r128
│   └── OrbitControls.js    轨道控制器
├── assets/                 混元3D GLB 模型
├── reference/              卫星图参考资料
├── CAMPUS_DATA.md          建筑坐标数据
└── README.md

## 开发日志
- v0.1：UI 骨架 + 场景初始化
- v0.2：基于卫星图的地坪、路网、运动设施、绿地
- v0.3：~44 栋校园建筑
- v0.4：植被和设施（树木/路灯/长椅）
- v0.5：日夜循环
- v0.6：观光漫游动画
- v0.7：混元3D 模型集成

【2. AI_USAGE.md】

# AI 工具使用记录

## 1. Claude Code（主开发助手）

### 任务 1：项目初始化
**提示词原文**：（粘贴提示词 0）
**生成结果**：成功识别校园卫星图中的建筑和道路布局
**修正过程**：手动使用拖拽工具校准全部 ~44 栋建筑坐标

（以此格式记录每个迭代任务）

## 2. 腾讯混元3D（资产生成）

### 模型 1：校门
**英文提示词**：modern Chinese university gate, two stone pillars with red plaque, low poly
**实际效果**：（补充说明）

## 3. 反思
（200 字左右：AI 在哪些环节最有效、哪些需要人工把关）

【约束】
- 中文 Markdown
- README 顶部保留"本项目是浙江树人学院期中作业"声明

完成后给我 git commit message。
```

---

## 辅助提示词：Bug 修复模板

```
【问题】
[描述现象]

【期望行为】
[应该怎样]

【已尝试】
[你已经查过/改过的地方]

【错误信息】
[控制台报错原文]

请先定位问题原因，告诉我你的诊断；我确认后你再修改代码。不要直接改。
```

---

## Git 提交节奏建议

| # | Commit Message | 对应任务 |
|---|---|---|
| 1 | `init: v0.1 UI 骨架 + 场景初始化` | ✅ 已完成 |
| 2 | `feat: v0.2 地坪 + 运动设施 + 绿地` | ✅ 已完成 |
| 3 | `fix: v0.2 重做路网渲染` | 提示词 1 |
| 4 | `feat: v0.3 添加 ~44 栋校园建筑` | 提示词 2 |
| 5 | `feat: v0.4 校园植被与设施` | 提示词 3 |
| 6 | `feat: v0.5 日夜循环` | 提示词 4 |
| 7 | `feat: v0.6 校园漫游动画` | 提示词 5 |
| 8 | `feat: v0.7 混元3D 模型集成` | 提示词 6 |
| 9 | `docs: README + AI 使用记录` | 提示词 7 |
