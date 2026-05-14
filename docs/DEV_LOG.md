# 数字孪生校园项目 · AI 协作开发日志

> 浙江树人学院信息科技学院《计算机图形学》期中作业
> 本文整理与 Claude Code 协作开发的全过程，按对话主题分章节

---

## 0. 项目背景对齐

**仓库**：https://github.com/lysyminger/digital-twin-campus-threejs

**技术栈约束**
- HTML + CSS + JS + Three.js r128（全局变量版，非 ES modules）
- 双击 `index.html` 运行，**不允许**有构建步骤、npm、bundler
- 后期改为本地 `vendor/` 加载（队友重构）
- AI 生成的 GLB 地标模型用 `GLTFLoader` 加载（v0.7 待做）

**代码风格约定**
- 中文注释，模块用 `// ===== 模块名 =====` 分隔
- 变量/函数 camelCase，`userData.name` / `userData.desc` 用中文
- 所有可点击对象进 `interactables[]`
- 场景按图层分组 `layerGroups = { ground, roads, buildings, vegetation, facilities, aiModels }`
- UI 深色玻璃拟态，强调色 `#78c8ff`
- 1 unit = 1 米，原点 = 贺田图书馆，北 = -Z，东 = +X

**作业硬性要求**
1. ≥ 3 类对象（建筑/道路/植被/设施）
2. ≥ 2 种视角
3. ≥ 3 类交互
4. ≥ 3 个核心功能
5. ≥ 1 个混元 3D GLB 模型
6. 5 次以上 git 提交

---

## 1. 卫星图分析与坐标系确认

**第一轮**：读完 `index.html` 骨架 + `reference/卫星图.png` + `CAMPUS_DATA.md`，识别校园布局。

**识别出的主要建筑**
- **中央核心**：贺田图书馆、树人礼堂、树兰国际医学院
- **东北运动区**：体育馆、操场、篮球/网球场
- **东北生活区**：致勤楼西楼、综合宿舍楼
- **东中/东南**：12 号楼、9 号楼、行政中心、查济民大厦、艺术馆
- **南中教学**：教学主楼 A1–A4、裙房 B1/B2、南校区南门
- **西中教学**：15/16/17/23 号楼、树人之家
- **西北生活**：清乐园 2/3/4 号楼
- **西边缘**：致和园 2 号楼

**主干道走向**：外环 + 十字主轴
- 南侧主路（Z≈230）/ 东侧湖州街（X≈370）/ 北侧学院路（Z≈-260）
- 中央东西主路（Z≈0）/ 南门中轴路（X≈-40~0）

**世界坐标系范围**：X ∈ [-450, 450]，Z ∈ [-320, 320]（约 900m × 650m）

---

## 2. v0.5 · 日夜循环（首次实现 → 重构后移植）

### 2.1 任务

让左侧面板的图层开关和时间滑块真正生效，包括夜晚路灯发光。

### 2.2 第一次实现（单文件版）

在原 `index.html` 全局脚本中：
- 新增 `streetLamps` 注册表
- 占位场景里加 8 盏路灯（带 emissive 灯头）
- `updateTimeOfDay(hour)` 函数：太阳沿东-上-西半圆弧、天空/雾三段色插值、光强切换、夜晚路灯
- time-slider input 事件接入 `updateTimeOfDay`
- boot 时初始化为 12:00

**Commit**：`ba2fa05` feat(time): 实现日夜循环与图层开关联动

### 2.3 队友重构 → 必须移植

回来发现队友已把项目重构成模块化结构（`js/core,terrain,sports,buildings,vegetation,ui,minimap,main.js` + `styles/main.css` + `docs/`），且未 commit。我的 v0.5 代码被原 `index.html` 整体覆盖丢失。

**对账与决策**
1. 队友的重构 + v0.2/v0.3/v0.4 内容已被推到 origin/main（4 个新 commit）
2. 本地的工作树是临时未推副本，扔掉
3. `git reset --hard origin/main` 同步 main，feature 分支也对齐
4. 重新基于新地基移植日夜循环

### 2.4 移植到新模块结构

| 改动 | 文件 |
|---|---|
| 新建 `streetLamps` 注册表 + `updateTimeOfDay(hour)` | `js/timeOfDay.js` |
| `createStreetLamp` 创建时 push 到 streetLamps，调整为 emissive 灯头 | `js/vegetation.js` |
| 沿主干道布 14 盏路灯（LAMP_DATA） | `js/vegetation.js` |
| time-slider input 触发 `updateTimeOfDay` | `js/ui.js` |
| boot 调 `updateTimeOfDay(12)` | `js/main.js` |
| 在 core.js 之后加载 timeOfDay.js | `index.html` |

**Commit**：`abb7c90` feat(v0.5): 移植日夜循环至模块化结构

---

## 3. v0.6 讨论 · 自由漫游可行性

用户问：v0.6 校园漫游能不能做成游戏式可自由移动的？

### 3.1 技术路线对比

| 方案 | 控制方式 | 评分 |
|---|---|---|
| **A. PointerLockControls + WASD** | 鼠标锁定看视角 + 键盘走 | ⭐⭐⭐⭐⭐ |
| B. FirstPersonControls | 鼠标移动即转头 | ⭐⭐ |
| C. 自己写 + OrbitControls 改造 | 自由组合 | ⭐⭐⭐ |

### 3.2 取舍清单

- **碰撞**：建议不做（v0.3 建筑齐了后视情况补）
- **跳跃 + 重力**：砍掉
- **保留自动观光**：两个都做 → 视角按钮拆成"自动观光" + "自由漫游"
- **建筑信息触发**：自由漫游下准星 + Esc 退出，点击拾取被屏蔽

### 3.3 拍板方案

PointerLockControls 自写实现 + WASD + Shift 加速 + 边界钳制，不做碰撞、不做跳跃，保留自动观光按钮。

---

## 4. v0.6 · 自动观光漫游

### 4.1 任务

观光路线按钮触发自动漫游校园：基于 roads 数据挑环形游览路线 → `CatmullRomCurve3` → 相机沿曲线巡游 → 路过建筑自动弹卡片。

### 4.2 实现

**新建 `js/tour.js`**
- 全局 `tourMode` / `tourT` 状态
- `TOUR_WAYPOINTS`（16 个关键点）→ `CatmullRomCurve3 (closed)` 平滑插值
- `enterTour()` / `exitTour()` / `updateTour(dt)` 三个入口
- 约 40 秒走一圈，循环不停
- 相机抬到人眼高度 (y+3)，朝向略提前的曲线点
- 路过建筑自动弹卡片：每秒检查相机最近建筑，距离 < 15m 且与上次不同则弹出，3 秒后自动收起（`lastShownBuilding` 去重）

**集成**
- `ui.js`：`setView('tour')` 走 `enterTour()`
- `main.js`：animate 调 `updateTour(dt)`，**漫游模式下跳过 `controls.update()`**（避免基于 spherical 反算覆盖手动设的相机位置）
- `index.html`：加载 tour.js

**Commit**：`27666ea` feat(v0.6): 自动观光漫游沿环形曲线巡游校园

### 4.3 用户反馈 1：路径穿建筑 + 缺北校区

**根因**：旧路线把 `(0,35)` / `(160,-20)` / `(270,-55)` / `(315,-25)` 当 waypoint，那些正是图书馆/9 号楼/体育馆/操场的中心坐标——相机直接钻进建筑里。

**修复**：
- 全部 waypoint 改落在道路或建筑空隙
- 新增 4 个北校区点（清乐园 → 北侧学院路）
- 体育馆/操场从环路外侧绕行
- 图书馆段改为 `(-30, 55)`（图书馆与医学院之间）
- 总计 18 个 waypoint，逆时针环游

**Commit**：`91a59e5` fix(v0.6): 重排观光路线避开建筑本体并覆盖北校区

### 4.4 用户反馈 2：toggle 退出 + 版本号

漫游按钮改为 toggle 语义（第二次点击切回透视），顶栏徽章 v0.2 → v0.6。

**Commit**：`b0c2cfc` feat(v0.6): 漫游按钮支持再次点击退出 + 顶栏版本号更新

---

## 5. v0.6 · 自由漫游

### 5.1 实现要点

**新建 `js/freeRoam.js`** —— 不依赖 vendor，纯原生 PointerLock API：
- `freeRoamMode` / `keys` 状态机
- `yaw` / `pitch` 用 YXZ 欧拉角避免 gimbal lock，pitch 夹在 ±π/2 - 0.1
- WASD 前后左右，Shift 加速（2.5×），Esc 退出
- 前向量在 XZ 平面投影，避免低头反而钻地
- 对角线归一化，避免斜走比直走快
- 边界钳制 X ∈ [-440, 440] / Z ∈ [-310, 310]，y 锁定人眼高度 1.7m
- 不做碰撞，不做跳跃

**UI**
- 新增 `view-roam` 按钮
- 屏幕中央准星 `+`
- 顶部 WASD/Esc 提示条
- 漫游下屏蔽点击拾取（`onPointerDown` 检测 `freeRoamMode`）

**事件绑定**
- `pointerlockchange`：用户按 Esc 解锁 → 自动 exitFreeRoam + setView('persp')
- `mousemove`：更新 yaw/pitch
- `keydown/keyup`：维护按键状态

**集成**
- `setView` 增加 `'roam'` 分支，互斥退出 tour/roam
- `main.js`：boot 调 `bindFreeRoam()`，animate 调 `updateFreeRoam(dt)`，两种漫游下都跳过 `controls.update()`

**Commit**：`f992367` feat(v0.6): 自由漫游 (WASD + 鼠标 PointerLock 第一人称)

---

## 6. v0.6 · 道路标线 z-fighting 修复

### 6.1 问题描述

用户：走过去到脚底下才会显示道路标线（"斑马线"），远处看不见。

### 6.2 诊断

代码里实际没有斑马线，用户指的是 `createDashedCenterLine`（黄色虚线中心线）和 `createRoadEdgeLines`（白色边线）。

**根因 · grazing-angle z-fighting**：
1. 沥青材质 `createAsphaltMaterial` 有 `polygonOffsetFactor: -2`，把沥青在深度缓冲里向相机方向偏移（更靠前）
2. 中心虚线/边线只是 `MeshBasicMaterial`，**没设 polygonOffset**，仅靠 y=0.03 比沥青 y=0.02 高 1cm
3. 人眼高度 1.7m 看远处道路时视角接近贴地掠射角，1cm 真实高差经过透视投影后被深度缓冲精度吃掉
4. 沥青因 polygonOffset 拿到"更靠前"的深度值，反而盖住标线 → 远处不可见
5. 走近后视角变陡，1cm 真实差距重新拉开，虚线又出来

### 6.3 修复

| 改动 | 原因 |
|---|---|
| 中心虚线材质 `polygonOffsetFactor: -4` | 比沥青的 -2 更强，永远赢 |
| 白色边线材质 `polygonOffsetFactor: -4` | 同上 |
| 虚线和边线 y 从 0.03 抬到 0.05 | 加一道实际高差保险 |

**Commit**：`14ff567` fix(v0.6): 修复人眼视角下道路标线远处消失

---

## 7. 合并到 main

### 7.1 合并前的历史复杂度

发现 main 历史里有：
- PR #3 合并 feature/free-roam
- PR #4 把 PR #3 revert 了（`4db07e0` Revert "Feature/free roam"）

所以直接 merge 时 git 会觉得"已经合过且反转了"，需要看是否能正确带回改动。

### 7.2 实际操作

1. `git checkout main && git pull origin main --ff-only`
2. `git merge --no-ff feature/free-roam`
3. **合并成功**：因为 feature 分支上有 revert 之后的新提交（v0.5 移植 + v0.6 三连 + 道路标线修复），3-way merge 把这些改动重新合入
4. push 时撞到队友的并发提交 → `git pull --rebase` → 再 push

**Commit**：`ea162c5` Merge branch 'feature/free-roam' into main（rebase 后）

---

## 8. 关于"如何快速调整建筑位置"的方案讨论

用户问：建筑虽然差不多对了但还需要调整，有什么办法能快速调？

### 8.1 根因

调建筑慢的真正原因不是改坐标麻烦，而是**没有 ground truth**——改完都要切回卫星图肉眼对比，记忆里的偏移量秒糊。

### 8.2 四个方案对比

| 方案 | 工作量 | 评分 |
|---|---|---|
| **A. 卫星图地面叠加层** | 30 min | ⭐⭐⭐⭐⭐ 最推荐 |
| B. 点击建筑 → 弹坐标卡 + 一键复制 | 10 min | ⭐⭐⭐⭐ 最便宜 |
| C. 鸟瞰编辑模式（点选 + 方向键移动 + 缩放/旋转） | 1.5 h | ⭐⭐⭐⭐ 功能强 |
| D. localStorage 实时持久化 + 导出 JSON | — | 作业不推荐（隐藏状态） |

**建议**：A + B 组合做，先上 A 给 ground truth，再上 B 让修改循环加速到每栋 30 秒。

---

## 9. README 更新到 v0.6

把项目简介、功能介绍、视角模式、日夜循环、项目结构、进度表全部刷新到 v0.6 当前状态。

**Commit**：`ea162c5` docs: 更新 README 至 v0.6（rebase 后落到 main）

---

## 10. 提交记录汇总（按时间顺序）

| commit | 内容 |
|---|---|
| `ba2fa05` | feat(time): 实现日夜循环与图层开关联动（单文件版，后被重构覆盖） |
| `abb7c90` | feat(v0.5): 移植日夜循环至模块化结构 |
| `27666ea` | feat(v0.6): 自动观光漫游沿环形曲线巡游校园 |
| `91a59e5` | fix(v0.6): 重排观光路线避开建筑本体并覆盖北校区 |
| `b0c2cfc` | feat(v0.6): 漫游按钮支持再次点击退出 + 顶栏版本号更新 |
| `f992367` | feat(v0.6): 自由漫游 (WASD + 鼠标 PointerLock 第一人称) |
| `14ff567` | fix(v0.6): 修复人眼视角下道路标线远处消失 |
| `eea7602` | Merge branch 'feature/free-roam' into main |
| `ea162c5` | docs: 更新 README 至 v0.6 |

（部分 commit hash 因主分支历史变动会显示为不同值，例如 `c6e6399` 等同于 `14ff567`、`b07bfcb` 等同于 `f992367`）

---

## 11. 当前可继续的方向

| 方向 | 来源 |
|---|---|
| **任务一：动态天空穹顶**（`js/sky.js`，shader 渐变 + 云朵 Sprite） | 用户给出的下一步任务 |
| **方案 A：卫星图地面叠加** | 第 8 节建筑微调方案 |
| **方案 B：点击建筑弹坐标 + 一键复制** | 第 8 节建筑微调方案 |
| **v0.7：混元 3D GLB 集成**（南门 + 中心雕塑） | 原 PROMPTS_CAMPUS 计划 |
| **自由漫游碰撞检测**（建筑 Box3 + 四向 ray） | v0.6 时被推迟 |

---

## 12. 关键经验沉淀

1. **多人协作 + 模块化重构 → 旧分支提前死**：feature 分支只要被重构覆盖过，最快的修复路径是 reset 到新 main 重新移植，比手工 rebase 解冲突省一倍时间
2. **PointerLockControls 可以零依赖自写**：r128 examples 里的版本本身就 ~80 行，写在自己的模块里反而更可控
3. **z-fighting 在掠射角下的优先级 = polygonOffsetFactor 谁更负谁赢**：纯靠 y 偏移在第一人称视角不可靠
4. **自动漫游路径设计要避开建筑中心**：CAMPUS_DATA 里的坐标是**建筑中心**而不是道路点，直接当 waypoint 会穿模
5. **OrbitControls 与手动相机位置互斥**：在自定义视角模式下必须跳过 `controls.update()`，否则它会基于 spherical 反算覆盖你设的 position
