# 友尽又贴贴 - 微信小游戏协作跑酷 Demo

这是一个可直接导入微信开发者工具的原生 Canvas 2D 微信小游戏 demo。  
技术方案采用“可直接运行的模块化 JavaScript”，代码结构保持 TypeScript 风格分层，方便后续平滑迁移到 TypeScript、Cocos 或真实联机方案。

## 项目结构

```text
wx-rope-party-demo/
  game.js
  game.json
  project.config.json
  README.md
  src/
    main.js
    config/
      gameConfig.js
      balanceConfig.js
      levelConfig.js
    core/
      GameLoop.js
      SceneManager.js
      InputManager.js
      Renderer.js
      Physics.js
      Collision.js
      EventBus.js
    game/
      Player.js
      PlayerManager.js
      RopeSystem.js
      CarryThrowSystem.js
      LevelManager.js
      ObstacleSystem.js
      CollectibleSystem.js
      IntimacySystem.js
      DeathReviveSystem.js
    network/
      FrameSyncAdapter.js
      LocalFrameSyncAdapter.js
      WebSocketFrameSyncAdapter.js
      WeChatGameServiceAdapter.js
      RoomService.js
    services/
      AdService.js
      MockAdService.js
      ShareService.js
      AnalyticsService.js
      StorageService.js
      LeaderboardService.js
    ui/
      LoadingScene.js
      MainMenuScene.js
      RoomScene.js
      GameScene.js
      ResultScene.js
      VirtualButton.js
      HUD.js
    utils/
      math.js
      random.js
      objectPool.js
      device.js
```

## 运行方式

1. 打开微信开发者工具。
2. 选择“小游戏”项目导入。
3. 项目目录选择：`D:\桌面\wx-rope-party-demo`
4. `AppID` 可先使用测试号或游客模式。
5. 导入后直接点击“编译”即可运行。

本项目不依赖 npm，不需要额外安装包，也不需要构建步骤。

## 微信开发者工具导入说明

1. 新建或导入小游戏项目。
2. 指向本项目根目录。
3. 运行后会先进入 `Loading` 页，再进入主菜单。
4. 主菜单可进入单人、双人、三人、四人模拟，也可以走“创建房间/加入房间”路径。

## 操作说明

### 桌面调试

- `P1`：`A / D / W / J / K`
  - `A / D` 左右移动
  - `W` 跳跃 / 二段跳
  - `J` 抱起 / 再按一次丢出去，当前已增强高抛与前送距离
  - `K` 收绳拉近，松开后绳子会带弹性回弹

- `P2`：方向键 + `1 / 2`
  - `← / →` 左右移动
  - `↑` 跳跃 / 二段跳
  - `1` 抱起 / 再按一次丢出去，当前已增强高抛与前送距离
  - `2` 收绳拉近，松开后绳子会带弹性回弹

### 真机触控

- 画面底部提供虚拟按钮。
- `P1` 在左侧控制区，`P2` 在右侧控制区。
- 第 3、4 名玩家当前为镜像输入模拟。

## 如何切换 1-4 人模拟

有两种方式：

1. 主菜单直接选择 `单人模拟 / 双人模拟 / 三人模拟 / 四人模拟`
2. 房间页点击 `人数 N` 按钮，会在 `1 -> 2 -> 3 -> 4 -> 1` 之间循环

## 如何调整关卡参数

### 核心调参文件

- 玩法参数：`D:\桌面\wx-rope-party-demo\src\config\balanceConfig.js`
- 全局参数：`D:\桌面\wx-rope-party-demo\src\config\gameConfig.js`
- 关卡内容：`D:\桌面\wx-rope-party-demo\src\config\levelConfig.js`

### 重点可调项

- 绳子长度、弹性、危险阈值：`balanceConfig.js -> rope`
- 抛掷力度和随机角度：`balanceConfig.js -> throwing`
- 复活广告次数和广告节流：`balanceConfig.js -> revive / ads`
- 关卡障碍、坑位、钥匙、高台、怪物：`levelConfig.js`

## 已实现功能

### P0

- 固定帧率主循环
- 微信小游戏原生 Canvas 2D 渲染
- 1-4 人本地模拟
- LocalFrameSyncAdapter 本地帧同步输入架构
- 玩家移动、跳跃、二段跳
- 默认牵绳与拉扯反馈
- 抱起 / 再按一次丢出
- 单独拉绳动作
- 3 个可玩关卡
- 低栏杆 / 高栏杆 / 小坑 / 深坑 / 移动平台 / 静止怪 / 移动怪 / 突发怪 / 高台 / 终点门
- 钥匙收集与终点门
- 单人死亡 / 团灭复活 mock
- 结算页

### P1

- 熟练度 / 好感度
- 彩蛋收集
- 友谊花冠 / 召唤戒指简化接口
- Mock 排行榜
- 分享海报生成
- 埋点系统

## 当前 TODO

- 更强的 AI 控制逻辑，目前第 3/4 名玩家使用镜像输入
- 真实微信联机服务接入
- 真实 WebSocket 帧同步服务器
- 真实激励视频 / 插屏广告 ID 接入
- 开放数据域排行榜子工程
- 音效与正式素材
- 更细的断线重连 / 房主迁移
- 更严格的 deterministic 随机数与回放验证

## 后续接入真实联机

当前本地适配器入口：

- `D:\桌面\wx-rope-party-demo\src\network\LocalFrameSyncAdapter.js`

预留真实替换点：

- `D:\桌面\wx-rope-party-demo\src\network\WebSocketFrameSyncAdapter.js`
- `D:\桌面\wx-rope-party-demo\src\network\WeChatGameServiceAdapter.js`

建议接入步骤：

1. 保持 `FrameInput` 结构不变。
2. 保持“只同步输入，不同步坐标”原则。
3. 客户端继续使用 `fixed timestep` 推进。
4. 将 `GameScene` 中的 `LocalFrameSyncAdapter` 替换为真实适配器实例。
5. 为真实房间服务补齐创建房间、加入房间、ready、重连、房主迁移。

## 后续接入真实激励视频广告

当前 mock 广告入口：

- `D:\桌面\wx-rope-party-demo\src\services\MockAdService.js`

建议接入：

1. 新建真实 `WeChatAdService`，实现与 `AdService.js` 相同接口。
2. 使用 `wx.createRewardedVideoAd` 预加载激励视频。
3. 仅在 `onClose` 返回完整播放时发奖。
4. 如果拉取失败，则隐藏复活入口并静默降级。
5. 保留当前的频控逻辑，避免新手前几分钟被广告打断。

## 后续接入微信开放数据域排行榜

当前统一接口：

- `D:\桌面\wx-rope-party-demo\src\services\LeaderboardService.js`

建议结构：

1. 主包内保留排行榜服务接口。
2. 单独创建 `openDataContext` 子项目。
3. 主域使用 `wx.setUserCloudStorage` 写入分数。
4. 开放数据域使用 `sharedCanvas` 渲染好友排行。
5. 再通过主域 UI 将 `sharedCanvas` 贴到当前游戏界面。

## 验收映射

本 demo 已覆盖以下验收点：

- 主菜单可进入
- 可选双人模拟
- 房间页可开始
- 至少两个玩家同屏
- 移动 / 跳跃 / 二段跳
- 绳子可视化与拉紧反馈
- 抱起 / 丢出
- 钥匙与终点门
- 掉坑死亡
- 复活入口 mock
- 通关结算页
- 好感度等级展示
- 再玩一局
- 分享按钮 mock

## 额外说明

- 这是“核心乐趣验证版”而不是美术完成版。
- 重点已经放在多人牵绳、抱起丢出、坑/高台/钥匙、复活结算闭环上。
- 如果下一步要继续开发，建议先做两件事：
  1. 用真机验证双人虚拟按钮手感
  2. 用真实玩家测试 Level 2 的高栏杆与深坑协作点
