const { GAME_CONFIG } = require('./config/gameConfig');
const { EventBus } = require('./core/EventBus');
const { SceneManager } = require('./core/SceneManager');
const { GameLoop } = require('./core/GameLoop');
const { InputManager } = require('./core/InputManager');
const { Renderer } = require('./core/Renderer');
const { LoadingScene } = require('./ui/LoadingScene');
const { MainMenuScene } = require('./ui/MainMenuScene');
const { RoomScene } = require('./ui/RoomScene');
const { GameScene } = require('./ui/GameScene');
const { ResultScene } = require('./ui/ResultScene');
const { MockAdService } = require('./services/MockAdService');
const { ShareService } = require('./services/ShareService');
const { AnalyticsService } = require('./services/AnalyticsService');
const { StorageService } = require('./services/StorageService');
const { LeaderboardService } = require('./services/LeaderboardService');
const { RoomService } = require('./network/RoomService');

if (typeof wx !== 'undefined' && wx.setPreferredFramesPerSecond) {
  wx.setPreferredFramesPerSecond(60);
}

const canvas = typeof wx !== 'undefined' && wx.createCanvas ? wx.createCanvas() : null;
if (!canvas) {
  throw new Error('当前环境没有 wx.createCanvas，需在微信小游戏环境运行。');
}
const ctx = canvas.getContext('2d');

const analyticsService = new AnalyticsService();
const storageService = new StorageService();
const adService = new MockAdService(storageService, analyticsService);
const leaderboardService = new LeaderboardService(storageService);
const shareService = new ShareService(analyticsService);
const roomService = new RoomService(analyticsService);
const eventBus = new EventBus();
const inputManager = new InputManager();
inputManager.bindWxEvents();

const renderer = new Renderer(canvas, ctx);
const app = {
  canvas,
  renderer,
  eventBus,
  inputManager,
  analyticsService,
  storageService,
  adService,
  leaderboardService,
  shareService,
  roomService
};

const sceneManager = new SceneManager(app);
app.sceneManager = sceneManager;
sceneManager.register('loading', LoadingScene);
sceneManager.register('menu', MainMenuScene);
sceneManager.register('room', RoomScene);
sceneManager.register('game', GameScene);
sceneManager.register('result', ResultScene);
sceneManager.change('loading');

function handleTouch(type, event) {
  const normalizedEvent = renderer.normalizeTouchEvent(event);
  const consumed = sceneManager.handleTouch(type, normalizedEvent);
  if (!consumed) {
    inputManager.handleTouch(type, normalizedEvent);
  }
}

if (typeof wx !== 'undefined') {
  wx.onTouchStart((event) => handleTouch('start', event));
  wx.onTouchMove((event) => handleTouch('move', event));
  wx.onTouchEnd((event) => handleTouch('end', event));
  wx.onTouchCancel((event) => handleTouch('cancel', event));
  if (wx.onWindowResize) {
    wx.onWindowResize(() => {
      renderer.resize();
    });
  }
  if (wx.onHide) {
    wx.onHide(() => sceneManager.pauseCurrent());
  }
  if (wx.onShow) {
    wx.onShow(() => sceneManager.resumeCurrent());
  }
}

const loop = new GameLoop({
  fixedDeltaMs: GAME_CONFIG.fixedDeltaMs,
  update(deltaMs) {
    sceneManager.update(deltaMs);
  },
  render(alpha) {
    sceneManager.render(renderer, alpha);
  },
  raf(callback) {
    if (typeof requestAnimationFrame === 'function') {
      return requestAnimationFrame(callback);
    }
    return setTimeout(() => callback(Date.now()), 16);
  }
});

loop.start();
