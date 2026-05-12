# 校园数字孪生 · Claude Code 开发提示词包

> 使用前请准备好卫星图：
> - `./reference/satellite.png` —— 校园卫星图（高德/百度地图截图）
> - 截图时把比例尺一起截进去，并量出"长边大约 X 米"标注在图上

---

## 提示词 0：项目初始化（首次必跑）

```
你现在是这个 Three.js 数字孪生项目的开发助手。请先做以下事情：

1. 读取项目根目录的 index.html，理解当前代码结构
2. 读取 ./reference/satellite.png 卫星图，看清楚校园整体布局
3. 阅读下面的项目背景

【项目背景】
- 名称：[填学校名]数字孪生交互系统
- 主题：浙江树人学院校园（或其他校园）
- 用途：浙江树人学院信息科技学院期中作业（两人小组）
- 技术栈:HTML + CSS + JS + Three.js r128（全局变量版本）
- 约束：单文件 index.html，双击就能运行（不依赖本地服务器）
- CDN：jsdelivr 加载 Three.js（https://cdn.jsdelivr.net/npm/three@0.128.0/）

【代码风格约定】
- 中文注释，每个功能模块用 // ===== 模块名 ===== 分隔
- 变量/函数用驼峰英文命名，对象 userData 中的 name/desc 用中文
- 所有可点击对象统一加入 interactables 数组
- 场景中的对象按图层分组，layerGroups = { ground, buildings, roads, vegetation, facilities }
- UI 风格：深色玻璃拟态，青蓝色强调（#78c8ff）
- 世界坐标系：1 单位 ≈ 1 米；校园中心放在 (0, 0, 0)；北 = -Z，东 = +X

【作业必须满足的硬性要求】
1. 至少 3 类对象（建筑/道路/植被/设施）
2. 至少 2 种视角（透视/鸟瞰/漫游）
3. 至少 3 类交互（鼠标控制/点击信息/UI按钮）
4. 至少 3 个核心功能（图文介绍/图层切换/视角变换/日夜/漫游/小地图）
5. 使用混元3D生成 GLB 模型并导入场景（至少 1 个地标建筑）
6. 5 次以上 Git 提交

读完上述内容并查看卫星图后，请告诉我：
- 你从卫星图上识别出了哪些主要建筑（按位置大致命名，比如"东北角的长方形建筑"）
- 主干道的大致走向
- 你建议的世界坐标系范围（如 200m × 200m）

然后等待我的下一条指令，我会确认或修正你识别的内容。
```

---

## 提示词 1：v0.2 校园基础地形 + 路网

```
任务：基于 ./reference/satellite.png 卫星图，搭建校园的基础地坪和路网

【看图作业】
1. 重新查看 ./reference/satellite.png
2. 提取主要道路的走向，输出一个 roads 数组，每条路用一组关键点表示：
   roads = [
     { name: '中央大道', points: [[x1,z1], [x2,z2], ...], width: 6 },
     ...
   ]
   坐标单位是米，校园中心在 (0,0,0)
3. 把识别结果先告诉我，我确认后你再实现

【实现要求】
1. 删除现有的占位地面、网格辅助、5 个彩色立方体
2. 创建 createGround() 函数：
   - 主体地坪：一块 200m × 200m 的 PlaneGeometry，浅灰绿色（0x9ab089），代表草坪/混凝土的混合基底
   - 加入 layerGroups.ground
3. 创建 createRoads() 函数：
   - 对每条道路，用 ExtrudeGeometry 或 ShapeGeometry 沿关键点生成"扁平条带"
   - 道路颜色：沥青深灰（0x4a4a4a）
   - 道路 Y 坐标 = 0.02（略高于地坪，避免 z-fighting）
   - 主干道宽 6m，支路宽 3m
   - 加入 layerGroups.roads
4. 创建 createCampusBoundary() 函数（可选）：
   - 用 LineSegments 在 ±100m 边界画一条浅色围栏线

【约束】
- 不要破坏 UI / Raycaster / 小地图代码
- 道路要 receiveShadow，地坪也要 receiveShadow
- 调整 OrbitControls 的 maxDistance 到 300
- 调整相机初始位置到 (80, 60, 80)，朝向 (0, 0, 0)

【验收】
- 双击运行，能看到浅绿色地坪 + 灰色路网，路网布局大致还原卫星图
- 鸟瞰视角下，路网应与卫星图布局明显对应

完成后给我 git commit message。
```

---

## 提示词 2：v0.3 校园建筑

```
任务：基于卫星图添加校园建筑，每栋建筑可点击查看信息

【看图作业】
1. 再次查看 ./reference/satellite.png，识别 8~12 栋主要建筑
2. 对每栋建筑，估算：
   - 位置（x, z 坐标，单位米）
   - 占地尺寸（宽 w × 深 d，单位米）
   - 大概层数 → 推算高度（每层 4m）
   - 平面形状（矩形 / L形 / U形 / 长条形）
3. 输出 buildings 数组：
   buildings = [
     { name: '图书馆', x: -40, z: 20, w: 30, d: 20, h: 20, shape: 'rect',
       desc: '...' },
     ...
   ]
4. 告诉我你识别的清单，我确认建筑名字和坐标后再实现

【实现要求】
1. 创建 createBuilding(info) 函数，根据 info.shape 生成不同形状：
   - 'rect'：单个 BoxGeometry
   - 'L'：两个 BoxGeometry 组合成 L 形
   - 'U'：三个 BoxGeometry 组合成 U 形
   - 'longstrip'：长条形（用单 Box，宽深比 > 3:1）
2. 建筑外观：
   - 墙体：浅米色（0xe8dcc4）或浅灰（0xc8c8d0），用 info.colorIdx 区分
   - 屋顶：平顶用 BoxGeometry 薄片覆盖，深灰（0x404040）
   - 窗户：用 PlaneGeometry 贴片，深蓝色（0x3a5a7a），按层数和长度均匀分布
3. 每栋建筑创建一个 Group，挂 userData，加入 interactables + layerGroups.buildings
4. 阴影：所有 mesh castShadow + receiveShadow

【desc 描述建议】
如果是真实学校建筑，desc 写真实信息（建成年份、主要功能、特色）；
如果不知道，写"教学/办公/生活类建筑，承担 [推测功能] 等用途"

【约束】
- 建筑数量保持 8~12 栋
- 窗户数量克制，每栋楼面 < 30 个窗户
- 注意建筑别和道路重叠（让位 1~2m）

【验收】
- 校园整体布局从鸟瞰角度看，与卫星图大致呼应
- 点击任意建筑能弹出名字和介绍
- FPS 保持在 50 以上

完成后给我 git commit message。
```

---

## 提示词 3：v0.4 植被 + 设施

```
任务：添加校园植被（树木、草地）和基础设施（路灯、长椅）

【看图作业】
1. 查看卫星图，标记主要绿地区域（操场、花园、林荫道两侧）
2. 输出 greenAreas 数组：
   greenAreas = [
     { name: '中心花园', x: 0, z: 0, r: 25 },
     { name: '操场', x: 50, z: -50, w: 80, d: 50 },
     ...
   ]

【实现要求】

### 植被部分
1. 创建 createTree(x, z, type) 函数：
   - 树干：CylinderGeometry，棕色（0x5c3d1f），高度 2~3m
   - 树冠：50% 球形（阔叶），50% 锥形（针叶/景观树）
   - 颜色 HSL 在绿色范围（hue 0.27~0.32）随机
2. 创建 createGrassPatch(x, z, r) 函数：
   - 在指定区域用 CircleGeometry 铺一块深绿色（0x4a7a3a）草地
   - Y = 0.01
3. 在 greenAreas 区域内随机散布树木：
   - 圆形区域：极坐标采样，约每 25m² 一棵
   - 矩形区域（如操场）：边缘种树，中心留空
   - 避开建筑 5m 范围、道路 2m 范围
   - 总数 60~100 棵，全部加入 layerGroups.vegetation

### 设施部分
4. 创建 createStreetLamp(x, z) 函数：
   - 灯杆：CylinderGeometry（半径 0.1，高 4m），深灰色
   - 灯头：SphereGeometry（半径 0.3），暖白色 0xffcc66
   - 给灯头加一个 PointLight（强度 0.5，距离 8m，颜色 0xffcc66）—— 仅夜晚启用
5. 创建 createBench(x, z, rotation) 函数：
   - 长椅：座板 + 两根支架，木色（0x8b6f47）
6. 在主要道路两侧每 15m 放一盏路灯，在建筑入口放长椅
7. 全部加入 layerGroups.facilities（新建图层组）
8. 在控制面板的图层控制区，新增"设施"开关

【约束】
- 路灯的 PointLight 数量不能超过 30 个
- 树木的几何精度要低（球形 8 段、锥形 6 段）

【验收】
- 校园看起来"有生气"：绿色草地、散落的树木、整齐的路灯
- 切换"植被"和"设施"开关能独立显隐
- FPS 仍保持 50 以上

完成后给我 git commit message。
```

---

## 提示词 4：v0.5 图层切换 + 日夜循环

```
任务：让左侧面板的图层开关和时间滑块真正生效（包括夜晚路灯发光）

【图层切换】
1. 修改图层开关的 change 事件，让它真正控制 layerGroups[name].visible
2. 5 个图层（建筑/道路/植被/设施/地面）独立显隐都正常

【日夜循环】
1. 创建 updateTimeOfDay(hour) 函数，hour 范围 0~24：
   a. 太阳位置：sun.position 沿弧线运动
      - 6:00 东方地平线，12:00 正上方，18:00 西方地平线
   b. 天空和雾的颜色，3 段插值：
      - 5:00~7:00 / 17:00~19:00：晨昏橘红（0xff8855）
      - 7:00~17:00：白天蓝（0x87ceeb）
      - 19:00~5:00：深夜蓝（0x0a1530）
   c. 光照强度：
      - sun.intensity：白天 1.0，晨昏 0.7，夜晚 0.1
      - ambient.intensity：白天 0.45，夜晚 0.15
   d. 【夜晚路灯亮起】
      - hour < 6 || hour > 19：遍历所有路灯的 PointLight，设 intensity = 0.5
      - 其他时间：intensity = 0
      - 灯头球体的材质改为 emissive（夜晚发光）
2. time-slider 的 input 事件接到 updateTimeOfDay
3. 启动时调用 updateTimeOfDay(12)

【验收】
- 拖动时间滑块从 0 到 24，能看到完整日夜循环
- 拖到夜晚（22:00），路灯亮起，校园里有暖黄色光斑
- 阴影方向跟随太阳变化

完成后给我 git commit message。
```

---

## 提示词 5：v0.6 校园漫游动画

```
任务：让"观光路线"按钮触发自动漫游校园

【路径规划】
1. 基于 v0.2 的 roads 数据，挑出一条覆盖主要建筑的"环形游览路线"
2. 用 CatmullRomCurve3 把这条路线的关键点连成平滑曲线，命名 tourCurve

【漫游逻辑】
1. 添加全局变量 tourMode（boolean）和 tourT（0~1）
2. 修改 #tour-btn 点击事件：
   - 切换 tourMode
   - 进入漫游：controls.enabled = false，按钮加 active
   - 退出漫游：恢复 controls.enabled，按钮去 active
3. 在 animate() 主循环里，如果 tourMode == true：
   - tourT += dt * 0.025（约 40 秒走完一圈）
   - 超过 1 自动循环回 0
   - 相机位置 = tourCurve.getPointAt(tourT) + (0, 3, 0)（人眼高度）
   - 看向 lookAt = tourCurve.getPointAt(tourT + 0.02)
4. 修改 #reset-btn：退出漫游 + 切回透视视角

【可选：路过建筑时自动弹卡片】
- 漫游过程中，每秒检查相机距离最近的建筑
- 如果距离 < 15m 且与上次不同，自动显示该建筑信息卡片 3 秒后淡出
- 用 lastShownBuilding 变量去重

【验收】
- 点击"观光路线"，相机自动沿校园主路漫游
- 路过建筑时（可选）自动弹卡片介绍
- 点击"重置视角"能退出漫游

完成后给我 git commit message。
```

---

## 提示词 6：v0.7 混元3D 地标模型集成

```
任务：用腾讯混元3D生成校门或地标建筑的 GLB 模型并集成

【前置准备（你做的）】
我会去腾讯混元3D（https://3d.hunyuan.tencent.com/）用以下提示词生成模型：
- "modern Chinese university gate, two stone pillars with red plaque, low poly"
- "a campus sculpture, abstract metal art piece, low poly"
- 下载 GLB 文件放到 ./assets/

【Claude Code 需要做的】
1. 在 index.html 的 <head> 添加 GLTFLoader CDN：
   <script src="https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js"></script>
2. 创建 loadHunyuanModels() 函数：
   - 用 new THREE.GLTFLoader() 加载 ./assets/gate.glb
   - 加载成功后：
     a. 计算模型 bounding box，归一化 scale 到合适尺寸（校门高度约 8m）
     b. 放在校园南侧入口位置（参考卫星图）
     c. traverse 让所有 mesh castShadow + receiveShadow
     d. userData = { name: '校园南门', type: 'AI生成模型', desc: '由腾讯混元3D生成的低多边形风格校门，作为校园标志性入口' }
     e. scene.add + 加入 interactables
   - 加载失败：console.warn 并继续，不让场景崩溃
3. 同样方式加载 ./assets/sculpture.glb，放在中心广场
4. 创建 layerGroups.aiModels 新分组
5. 在控制面板的"图层控制"区添加"AI模型"开关

【约束】
- 加载失败要降级处理
- 不要把 AI 模型混进 layerGroups.buildings

【验收】
- 场景中有 2 个明显比基础几何体精致的 AI 生成模型
- 点击它们能弹出"AI生成模型"标签的信息卡
- 切换"AI模型"图层能整体显隐
- 即使 assets 缺失，场景仍能正常运行

完成后给我 git commit message。
```

---

## 提示词 7：README + AI 使用记录

```
任务：在项目根目录创建 README.md 和 AI_USAGE.md 两个文档

【1. README.md】

# [学校名]数字孪生交互系统

> **本项目是浙江树人学院信息科技学院期中作业**

## 项目简介
基于 Three.js 构建的校园三维可视化系统，参考卫星图还原校园建筑布局，
提供透视/鸟瞰/漫游三种视角和点击查看建筑信息等交互功能。

## 团队成员
- 成员A：[姓名/学号]，负责 [模块]
- 成员B：[姓名/学号]，负责 [模块]

## 技术栈
- HTML5 / CSS3 / JavaScript (ES6)
- Three.js r128
- 腾讯混元3D（生成 GLB 资产）
- AI 工具：Claude Code

## 功能介绍

### 基础功能
- 三维场景渲染（地坪/建筑/道路/植被/设施 5 类对象）
- 多视角切换（透视/鸟瞰/漫游 3 种视角）
- 鼠标交互（拖动旋转/滚轮缩放/点击对象查信息）
- 图文信息卡（点击任意建筑弹出名称和简介）
- 图层显隐控制（5 个独立图层开关）
- 实时小地图（俯视显示相机位置）

### 加分项
- 日夜循环（时间滑块控制太阳位置和光照颜色）
- 夜间路灯自动亮起
- 自动观光漫游动画
- 混元3D 生成模型集成

## 三维场景对象
- 校园地坪 / 路网 / 8~12 栋建筑 / 60~100 棵树 / 路灯长椅等设施 / 2 个 AI 生成地标

## 交互说明
| 操作 | 效果 |
|---|---|
| 鼠标左键拖动 | 旋转视角 |
| 鼠标右键拖动 | 平移 |
| 滚轮 | 缩放 |
| 点击建筑 | 弹出信息卡 |
| 视角按钮 | 切换透视/鸟瞰/漫游 |
| 图层开关 | 显隐各类对象 |
| 时间滑块 | 切换日夜 |
| 观光路线 | 自动漫游 |

## 运行方式
1. 克隆仓库：`git clone ...`
2. 双击 `index.html` 用 Chrome/Edge 打开（需联网加载 Three.js CDN）

## 项目结构
.
├── index.html         主程序
├── assets/            混元3D 生成的 GLB 模型
│   ├── gate.glb
│   └── sculpture.glb
├── reference/         卫星图参考资料
│   └── satellite.png
├── screenshots/       开发过程截图
├── README.md
└── AI_USAGE.md

## 开发日志
- v0.1：UI 骨架 + 占位场景
- v0.2：基于卫星图的地坪和路网
- v0.3：8~12 栋校园建筑
- v0.4：植被和设施（路灯/长椅）
- v0.5：图层控制 + 日夜循环
- v0.6：观光漫游动画
- v0.7：混元3D 模型集成

## 致谢
- Three.js 三维渲染引擎
- 腾讯混元3D 资产生成
- Claude Code 开发辅助

【2. AI_USAGE.md】

# AI 工具使用记录

## 1. Claude Code（主开发助手）

### 任务 1：项目初始化
**提示词原文**：
（粘贴）
**生成结果**：成功识别卫星图中 N 栋建筑、M 条道路
**修正过程**：手动纠正了 X 建筑的命名

（以此格式记录每个迭代任务）

## 2. 腾讯混元3D（资产生成）

### 模型 1：校门
**英文提示词**：modern Chinese university gate, two stone pillars with red plaque, low poly
**截图**：![校门生成](./screenshots/hunyuan_gate.png)
**实际效果**：成功生成，导入后调整 scale = 2.5

## 3. 反思
（200 字左右：AI 在哪些环节最有效、哪些需要人工把关）

【约束】
- 中文 Markdown
- README 顶部保留"本项目是浙江树人学院期中作业"声明
- 统一表述为"借助 AI 工具辅助开发"

完成后给我两个 git commit message。
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

| # | 提交者 | Commit Message | 对应任务 |
|---|---|---|---|
| 1 | 你 | `init: 初始化项目，添加 v0.1 UI 骨架` | 现有 index.html |
| 2 | 你 | `feat: 基于卫星图实现校园地坪与路网` | 提示词 1 |
| 3 | 组员 | `feat: 添加 N 栋校园建筑` | 提示词 2 |
| 4 | 组员 | `feat: 添加校园植被与设施` | 提示词 3 |
| 5 | 你 | `feat: 实现图层控制与日夜循环` | 提示词 4 |
| 6 | 你 | `feat: 添加校园观光漫游动画` | 提示词 5 |
| 7 | 组员 | `feat: 集成腾讯混元3D生成的地标模型` | 提示词 6 |
| 8 | 你 | `docs: 添加 README 与 AI 使用记录` | 提示词 7 |
