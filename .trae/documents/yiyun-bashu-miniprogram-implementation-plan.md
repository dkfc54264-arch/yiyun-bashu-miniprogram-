# 艺韵巴蜀·非遗剧本研学小程序 — 落地实施方案（v3 增量改造版）

> 原则：**在现有项目结构上做增量修改和完善，不重构架构**。保留现有 8 个页面的 UI 框架与墨绿视觉风格（#1A4735），重写数据层接入微信云开发，内容全面对齐项目书（酉阳非遗五大关卡、三版本剧本），让每个环节真实可用、数据真实流转。
> 定位：大创比赛演示版（模拟支付）｜后端：微信云开发｜AI：真实大模型 API（带降级）

---

## 一、现状与差距（基于逐文件阅读）

主代码在根目录 `miniprogram/`（根 `project.config.json` 已设 `miniprogramRoot`，appid `wx21729cf5bf312f53`），`app.js` 已初始化云环境 `cloud1-d9gh6b85b2c0f6570` 但从未使用，**无 cloudfunctions 目录**。

| 页面 | 现状 | 要改什么 |
|---|---|---|
| `pages/index` | UI 完整，用户信息写死"银牌学员 620 分"，进度写死 | 接云数据库用户真实数据（保留现有布局，仅换数据源） |
| `pages/booking` | 表单+校验可用，场次写死 3 个，提交只 toast | 加版本/场次选择、订单落库、模拟支付、生成核销码电子票 |
| `pages/task` | 4 条写死任务（剪纸内容） | 换成五大关卡"阅读+答题"任务体系，进度/积分/线索联动 |
| `pages/script` | 3 章通用内容写死，章节切换可用 | 换成《酉阳秘境·非遗守护人》三版本剧本+线索解锁态 |
| `pages/ar` | CSS 伪 3D 旋转交互完整（剪纸模型），含展品介绍 | 改造为**数字展示页，三部分**：IP 人设 3D 展示 / 剪纸 3D 展示（保留现有模型）/ 非遗科普视频讲解 |
| `pages/ai` | 聊天 UI 完整，关键词 if-else 模拟回复 | 接真实大模型（云函数代理），原关键词库降级为兜底 |
| `pages/ranking` | UI 完整，20 个假用户 | 接云数据库真实积分排行（保留视觉，等级换成五级守护人） |
| `pages/report` | **完成度最高**：三步式报告+本地草稿，保留 | 概览区接云端真实数据；分享得积分 |
| 缺失 | 无个人中心、无文创商城 | 新增 2 个轻量页面（沿用现有视觉语言） |

**核心问题**：①全部数据硬编码无后端；②任务/剧本内容与项目书的酉阳非遗（西兰卡普、傩戏、苗银、摆手舞、土家美食）错位；③预约→体验→积分→报告→兑换的数据链路不存在。

---

## 二、总体设计（最小可用后端）

### 云函数（3 个，action 路由式，符合学生项目实际维护能力）

| 云函数 | 职责（action） |
|---|---|
| `user` | login（openid 静默注册）、getInfo、addScore（联动会员等级）、updateProfile |
| `biz` | 统一业务入口：getSessions / createOrder / mockPay / myOrders / getMyTasks / submitQuiz（关卡答题判定+发积分+解锁线索）/ saveReport / getRank / getProducts / exchangeProduct |
| `aiChat` | 代理智谱 GLM-4-Flash（key 放环境变量），内置酉阳非遗知识库 System Prompt，10 轮上下文，异常时返回降级标记 |

### 云数据库集合（6 个）

| 集合 | 关键字段 | 说明 |
|---|---|---|
| `users` | openid、nickname、avatar、score、level(1-5)、createTime | 会员阈值 500/2000/5000/10000 |
| `sessions` | scriptVersion(kids/advance/deep)、date、time、capacity、booked、price | 种子数据预置 3 个版本×多场次 |
| `bookings` | openid、sessionId、scriptVersion、name、phone、count、amount、status(pending/paid/used)、checkCode(6位) | 下单减库存、核销改状态 |
| `user_tasks` | openid、gateId(1-5)、status(0未开始/1已完成)、score、clueUnlocked、quizRight(答对题数)、updateTime | 每人 5 行，对应五大关卡 |
| `reports` | openid、date、content(报告文本) | report 页生成结果落库 |
| `products` | name、price、points、image、category、stock | 积分兑换/模拟下单扣 stock |

剧本内容、关卡题库、商品种子均放前端静态文件（学生项目更实际，改文案不用动库）：`data/scripts.js`、`data/gates.js`、`data/videos.js`。

### 五大关卡任务体系（阅读+答题模式，`data/gates.js`）

用户要求：**任务中不含 AR 交互**，通过"阅读体验 + 选择题"完成并获得积分。每关结构：

```
关卡卡片（任务列表展示：进度环、状态、积分奖励）
  └─ 关卡详情页交互（在 task 页内弹层/展开实现）：
     ① 知识阅读卡：该非遗的历史/技艺/文化内涵（200字左右，阅读体验）
     ② 3 道选择题：每题 3 选项，答对 2 题即过关
     ③ 过关奖励：+100 积分、解锁本关"文化线索"（剧本收集要素）
```

1. 西兰卡普纹样密码（织造）— 阅读织造技艺+纹样几何知识答题
2. 傩戏面具绘制与祈福（戏曲）— 阅读傩戏文化+面具角色答题
3. 苗银纹样拓印与制作（锻造）— 阅读锻造工艺+纹样寓意答题
4. 土家族摆手舞（歌舞）— 阅读摆手舞起源+动作含义答题
5. 土家特色美食（民俗）— 阅读油茶/糍粑/米豆腐文化答题

### AR 页改造为「数字展示」三部分（用户要求）

`pages/ar/ar.js` 顶部加三段式切换（复用现有 selectModel/selectExhibit 交互模式），**三种不同形式展示项目非遗**：

1. **IP 人设 3D 展示**：项目双 IP 形象「巴小艺」（数字人讲解员）/「酉小趣」Q 版形象卡，复用现有 3D 旋转/惯性/自动旋转交互做立体展示（形象图先用 CSS 3D 卡片+分层视差呈现，正式版换建模）
2. **剪纸 3D 展示**：保留现有「花开富贵/双蝶戏花/连年有余」模型与全部旋转交互（现有资产直接复用）
3. **非遗科普视频讲解**：`<video>` 组件播放科普短视频（主题：酉阳摆手舞/西兰卡普/傩戏等），视频源配置在 `data/videos.js`（演示用云存储上传的 mp4，暂未录制前先用公开示例视频链接占位，后期替换）

---

## 三、实施步骤（7 个阶段，全部为现有文件的增量修改）

### 阶段一：云开发基础
- 根 `project.config.json` 加 `"cloudfunctionRoot": "cloudfunctions/"`，建 3 个云函数骨架（index.js + package.json）
- `utils/request.js`：封装 `callCloud(name, action, data)`，统一 loading/错误提示
- 云开发控制台建 6 个集合并导入种子数据（sessions/products）
- `data/` 新建 `gates.js`（五大关卡+题库）、`scripts.js`（三版本剧本）、`videos.js`（科普视频源）
- **验证**：云函数上传成功，控制台可查集合数据

### 阶段二：用户体系 + 首页真实化
- 云函数 `user`：login/getInfo/addScore（积分变动自动升五级会员：普通/青铜/白银/黄金/钻石守护人）
- `app.js`：onLaunch 后静默登录，globalData 存用户态
- `pages/index/index.js`：删掉写死的 userInfo/progress，onLoad 拉真实数据（等级名换五级守护人；进度卡由 user_tasks 计算）。UI 不动
- **验证**：清缓存重进，首页显示云端数据；答题后进度变化

### 阶段三：预约购票闭环（booking 页）
- 保留现有表单 UI，新增：顶部三版本选择卡（亲子启蒙 129 / 研学进阶 199 / 深度沉浸 259，B 端团单 139 说明）→ 场次列表（读 sessions，显示余位）→ 提交走 `biz.createOrder`（校验余位、生成 6 位核销码）→ 模拟支付弹层（1.5s 加载→成功）→ `biz.mockPay` 置 paid
- 新增"我的门票"区块（同页底部）：电子票卡片（版本/时间/地点"龚滩古镇 118 号台"/核销码），used 显示已核销
- 预约成功自动初始化该用户 5 条 user_tasks
- **验证**：完整走通选版本→选场次→下单→支付→电子票可见；超卖被拦截

### 阶段四：内容体系（script + task 页）
- `data/scripts.js`：《酉阳秘境·非遗守护人》三版本演示级剧本（kids 5 章 / advance 6 章 / deep 7 章，每章 200-300 字，主线"守护人招募→解锁关卡→收集线索→守护秘境"）
- `pages/script/script.js`：顶部加三版本切换器（沿用现有章节切换交互），底部加"线索收集进度"卡
- `pages/task/task.js`：换成五大关卡卡片列表（沿用现有样式）+ 关卡详情交互：阅读知识卡 → 3 道选择题 → `biz.submitQuiz` 判定 → 过关 +100 积分 + 解锁线索；线索库展示解锁状态
- **验证**：三版本可切换；答题过关积分到账、线索解锁、首页进度同步

### 阶段五：数字展示三部分 + AI 真实化（ar + ai 页）
- `pages/ar/ar.js` 改造（保留 3D 旋转全部交互逻辑）：
  - 顶部三段切换：IP 人设 3D 展示 / 剪纸 3D 展示 / 非遗科普视频
  - IP 人设：新增「巴小艺/酉小趣」展示数据与 3D 卡片样式（视差分层）
  - 剪纸：现有 models/exhibits 直接保留
  - 视频：新增 `<video>` 播放区，源来自 `data/videos.js`
- 云函数 `aiChat`：HTTP 代理智谱 GLM-4-Flash，System Prompt 内置酉阳非遗知识（4 项国家级+25 项市级非遗、五大关卡知识、预约流程、人设"巴小艺"）
- `pages/ai/ai.js`：sendMessage 改调 aiChat（保留 isLoading/滚动逻辑），原关键词逻辑降级兜底；快捷问题换酉阳主题（什么是西兰卡普/傩戏面具有什么讲究/摆手舞怎么跳/苗银怎么锻造）
- **验证**：三部分切换流畅、视频可播；AI 真实回答酉阳非遗问题；无 key/断网降级可用

### 阶段六：报告与排行真实化（report + ranking 页）
- `pages/report/report.js`：overview 数据源从写死改为云端聚合（user_tasks 完成度、booking 场次、积分排名、展示模块浏览数）；6 节写作区保留；生成报告调 `biz.saveReport` 落库；分享成功调 addScore +200
- `pages/ranking/ranking.js`：删 20 个假用户，改调 `biz.getRank`（top50+我的名次）；保留视觉，等级称号换五级守护人；集合为空时回退演示数据（保证演示不冷场）
- **验证**：报告数据与实际操作一致；排行榜反映真实积分变动

### 阶段七：新增个人中心 + 文创商城 + 演示收尾
- 新增 `pages/profile/`（个人中心，沿用现有视觉语言）：头像昵称（chooseAvatar+nickname）、五级会员卡（积分进度条）、我的门票（bookings 列表）、我的证书（完成 5 关 canvas 绘制"非遗守护人证书"可保存）、积分明细
- 新增 `pages/shop/`（文创商城）：商品列表（products：苗银小挂件/西兰卡普饰品/傩戏面具钥匙扣 9.9-39.9 档）、详情、模拟下单 / 积分兑换（`biz.exchangeProduct` 扣积分减库存）
- `app.json` 注册 2 个新页面；`pages/index` 功能网格加"文创商城/个人中心"入口（glyph 沿用"剧观智榜报约"风格加"购/我"）
- 演示收尾：种子数据齐全（3 版本场次、5 商品、3 个不同积分演示用户撑排行榜）；科普视频上传云存储并替换 `videos.js`；编写 5 分钟演示流程脚本；iOS+Android 真机全流程回归
- **验证**：演示脚本完整跑通（见下）

---

## 四、最终演示流程（验收标准）

首页 greeting（真实会员等级）→ 预约亲子版场次+模拟支付 → 任务页阅读西兰卡普知识+答题过关得积分 → 解锁文化线索 → 数字展示页看 IP 人设 3D/剪纸 3D/科普视频 → AI 问"什么是西兰卡普" → 生成研学报告 → 分享得积分 → 排行榜名次上升 → 商城积分兑换文创 → 个人中心领取"非遗守护人"证书

## 五、假设与依赖

1. **API Key**：需注册智谱开放平台（GLM-4-Flash 免费）提供 Key；未提供前 aiChat 自动走降级关键词库，不阻塞开发
2. 云环境 `cloud1-d9gh6b85b2c0f6570` 可用（免费额度足够演示）
3. 演示版不做：真实支付（模拟支付，答辩说明"正式版替换 wx.requestPayment"）、后台管理端（场次/商品控制台维护）
4. 科普视频：先用占位视频源，正式演示前录制/上传酉阳非遗科普短视频至云存储
5. 剧本与题库为演示级原创内容，正式版需非遗传承人共创（项目书已承诺）
6. 现有 UI 仅动数据层与内容文案，不大改视觉；`miniprogram-1`、`miniprogram-2` 废弃不动

## 六、总体验收

按项目书 10.3 的四大核心界面（首页/预约购票/任务进度/个人中心）+ 完整演示流程逐项核对。

---

## 附录：演示收尾清单

### A. 云数据库种子数据（云开发控制台 → 数据库，创建以下集合并导入）

集合 `sessions`（场次，演示导入 6 条；`booked` 建议留 1-2 个接近满员以展示"余位不足"拦截）：

```json
{ "scriptVersion": "kids",    "date": "2026-10-01", "time": "09:00-12:00", "capacity": 30, "booked": 26 }
{ "scriptVersion": "kids",    "date": "2026-10-02", "time": "14:00-17:00", "capacity": 30, "booked": 8 }
{ "scriptVersion": "advance", "date": "2026-10-03", "time": "09:00-12:00", "capacity": 24, "booked": 5 }
{ "scriptVersion": "advance", "date": "2026-10-04", "time": "14:00-17:00", "capacity": 24, "booked": 20 }
{ "scriptVersion": "deep",    "date": "2026-10-05", "time": "09:00-13:00", "capacity": 16, "booked": 3 }
{ "scriptVersion": "deep",    "date": "2026-10-06", "time": "14:00-18:00", "capacity": 16, "booked": 0 }
```

集合 `products`（文创商品，与 shop.js 演示数据一致，导入后商城从"演示模式"变为可真实兑换）：

```json
{ "name": "苗银蝴蝶挂件",     "glyph": "🦋", "desc": "苗银锻造工艺，蝴蝶妈妈图腾，寓意辟邪纳福", "points": 800,  "price": 68, "stock": 9,  "tag": "热销" }
{ "name": "西兰卡普编织手环", "glyph": "🧶", "desc": "四十八勾纹样手工织造，土家族\"无字史书\"", "points": 600,  "price": 49, "stock": 12, "tag": "新品" }
{ "name": "傩戏面具钥匙扣",   "glyph": "🎭", "desc": "迷你开山莽将面具造型，附赠祈福卡一张",     "points": 400,  "price": 29, "stock": 20, "tag": "人气" }
{ "name": "摆手舞徽章套装",   "glyph": "💃", "desc": "单摆/双摆/回旋摆三枚一套，金属烤漆工艺",   "points": 350,  "price": 25, "stock": 15, "tag": "纪念" }
{ "name": "土家油茶汤礼盒",   "glyph": "🍵", "desc": "阴米、花生、茶叶原产配料，在家复刻土家味", "points": 900,  "price": 79, "stock": 8,  "tag": "特产" }
{ "name": "守护人证书相框",   "glyph": "🖼️", "desc": "实木相框，装裱你的专属非遗守护人证书",     "points": 1200, "price": 99, "stock": 5,  "tag": "限定" }
```

自动初始化的集合（无需导入）：`users`（登录时创建）、`user_tasks`（支付后初始化 5 条）、`bookings`、`reports`。

### B. 智谱 AI Key 配置

云开发控制台 → 云函数 → `aiChat` → 配置 → 环境变量：`ZHIPU_API_KEY=你的Key`（GLM-4-Flash 免费）。未配置时 AI 页自动走本地关键词库降级，不阻塞演示。

### C. 科普视频替换

`miniprogram/data/videos.js` 中 3 个 `src` 为占位视频。正式演示前：录制酉阳非遗科普短视频 → 上传云存储 → 把 fileID（`cloud://...`）替换进 `src` 与 `poster`。

### D. 演示前重置

1. 清空 `bookings`、`user_tasks`、`reports` 集合（保持演示干净）
2. 若要重置排行榜：清空 `users` 集合（重新登录自动创建）
3. 编译 → 首页自动静默登录 → 按第四节演示流程跑通

### E. 已实现积分体系一览

| 行为 | 积分 | 入口 |
|---|---|---|
| 过关（答对≥2题） | +100/关 ×5 | 任务进度 |
| 分享研学报告 | +200 | 报告预览页分享 |
| 积分兑换商品 | -对应分值 | 文创商城 |
| 等级阈值 | 0/500/2000/5000/10000 | 普通会员→青铜→白银→黄金→钻石守护人 |
