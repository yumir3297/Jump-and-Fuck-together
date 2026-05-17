const { GAME_CONFIG } = require('../config/gameConfig');
const { BALANCE_CONFIG } = require('../config/balanceConfig');
const { ObjectPool } = require('../utils/objectPool');
const { PlayerManager } = require('../game/PlayerManager');
const { RopeSystem } = require('../game/RopeSystem');
const { CarryThrowSystem } = require('../game/CarryThrowSystem');
const { LevelManager } = require('../game/LevelManager');
const { ObstacleSystem } = require('../game/ObstacleSystem');
const { CollectibleSystem } = require('../game/CollectibleSystem');
const { IntimacySystem } = require('../game/IntimacySystem');
const { DeathReviveSystem } = require('../game/DeathReviveSystem');
const { LocalFrameSyncAdapter } = require('../network/LocalFrameSyncAdapter');
const { HUD } = require('./HUD');

function formatTime(ms) {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return String(min).padStart(2, '0') + ':' + String(sec).padStart(2, '0');
}

class GameScene {
  constructor(app, params) {
    this.app = app;
    this.params = params;
    this.hud = new HUD();
    this.pauseButtons = [];
    this.offerButtons = [];
    this.fixedFrames = 0;
    this.bufferedInputs = {};
    this.lastFrameInputs = [];
    this.paused = false;
    this.levelCompleted = false;
    this.resultTriggered = false;
    this.elapsedMs = 0;
    this.totalDeaths = 0;
    this.totalRescues = 0;
    this.totalThrowSuccess = 0;
    this.totalCollected = 0;
    this.resultPoster = null;
    this.feedbackTexts = new ObjectPool(() => ({
      active: false,
      x: 0,
      y: 0,
      vy: -0.4,
      life: 0,
      text: '',
      color: '#3d2a1f'
    }));
    this.particles = new ObjectPool(() => ({
      active: false,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      size: 4,
      color: '#ffcf6f'
    }));
  }

  enter() {
    this.app.adService.onMatchStart();
    this.app.inputManager.reset();
    this.levelManager = new LevelManager(this.app.analyticsService);
    this.level = this.levelManager.loadLevel(this.params.levelIndex || 0);
    this.playerManager = new PlayerManager(GAME_CONFIG.playerProfiles);
    this.players = this.playerManager.configurePlayers(this.params.playerCount || 2, this.level.spawnPoints);
    this.intimacySystem = new IntimacySystem();
    this.intimacySystem.reset(this.players);
    this.obstacleSystem = new ObstacleSystem();
    this.obstacleSystem.loadLevel(this.level);
    this.collectibleSystem = new CollectibleSystem(this.intimacySystem);
    this.collectibleSystem.loadLevel(this.level);
    this.ropeSystem = new RopeSystem();
    this.carryThrowSystem = new CarryThrowSystem(this.playerManager, this.intimacySystem);
    this.deathSystem = new DeathReviveSystem(this.app.adService, this.app.analyticsService);
    this.frameSync = new LocalFrameSyncAdapter();
    this.frameSync.connect(this.params.room ? this.params.room.roomId : 'local-room', 'p1');
    this.frameSync.setPlayerIds(this.players.map((player) => player.id));
    this.frameSync.onFrame((frameId, inputs) => {
      this.bufferedInputs[frameId] = inputs;
    });
    this.createVirtualButtons();
    this.buildOverlayButtons();
  }

  createVirtualButtons() {
    const width = this.app.renderer.width;
    const height = this.app.renderer.height;
    const buttons = [];
    const p1BaseY = height - 80;
    const p2BaseY = height - 80;
    const size = 56;
    const gap = 8;

    function pushPlayerButtons(inputManager, playerId, startX, baseY) {
      buttons.push(inputManager.createButton({ id: playerId + '-left', playerId, action: 'left', label: '←', x: startX, y: baseY, width: size, height: size }));
      buttons.push(inputManager.createButton({ id: playerId + '-right', playerId, action: 'right', label: '→', x: startX + size + gap, y: baseY, width: size, height: size }));
      buttons.push(inputManager.createButton({ id: playerId + '-jump', playerId, action: 'jump', label: '跳', x: startX + 128, y: baseY, width: size, height: size }));
      buttons.push(inputManager.createButton({ id: playerId + '-carry', playerId, action: 'carry', label: '抱/丢', x: startX + 192, y: baseY, width: 78, height: size }));
      buttons.push(inputManager.createButton({ id: playerId + '-pull', playerId, action: 'pull', label: '拉', x: startX + 278, y: baseY, width: size, height: size }));
    }

    pushPlayerButtons(this.app.inputManager, 'p1', 24, p1BaseY);
    if (this.players.length >= 2) {
      pushPlayerButtons(this.app.inputManager, 'p2', width - 398, p2BaseY);
    }
    this.app.inputManager.setVirtualButtons(buttons);
  }

  buildOverlayButtons() {
    this.pauseButtons = [
      { id: 'resume', label: '继续', x: 510, y: 260, width: 160, height: 64 },
      { id: 'restart', label: '重开本关', x: 510, y: 340, width: 160, height: 64 },
      { id: 'menu', label: '返回菜单', x: 510, y: 420, width: 160, height: 64 }
    ];
    this.offerButtons = [
      { id: 'revive', label: '看 mock 广告复活', x: 430, y: 420, width: 320, height: 68 },
      { id: 'retry', label: '直接重开', x: 520, y: 504, width: 140, height: 62 }
    ];
  }

  update(deltaMs) {
    this.updateEffects(deltaMs);
    if (this.paused || this.resultTriggered || this.deathSystem.isAwaitingAd) {
      return;
    }

    this.elapsedMs += deltaMs;
    this.fixedFrames += 1;
    const inputFrame = this.fixedFrames + GAME_CONFIG.network.inputDelayFrames;
    this.sendLocalInputs(inputFrame);
    this.frameSync.step(this.fixedFrames);
    const frameInputs = this.bufferedInputs[this.fixedFrames] || this.buildNeutralInputs(this.fixedFrames);
    delete this.bufferedInputs[this.fixedFrames];
    this.lastFrameInputs = frameInputs;

    this.playerManager.setFrameInputs(frameInputs);
    this.carryThrowSystem.update(this.fixedFrames, this.spawnFeedback.bind(this));
    this.obstacleSystem.update(deltaMs, this.players);
    this.playerManager.updatePlayers(this.obstacleSystem.getSolidRects());
    this.obstacleSystem.applyPlatformCarry(this.players);
    this.playerManager.syncCarriedPlayers();
    const preRopePositions = this.playerManager.capturePositions();
    this.ropeSystem.update(this.players, deltaMs, this.spawnFeedback.bind(this));
    this.playerManager.resolveExternalMotion(this.obstacleSystem.getSolidRects(), preRopePositions);
    this.playerManager.syncCarriedPlayers();
    this.collectibleSystem.update(this.players, this.spawnFeedback.bind(this));
    this.carryThrowSystem.postUpdate(this.spawnFeedback.bind(this));
    this.intimacySystem.applyToPlayers(this.players);
    this.handleHazards();
    this.checkTutorialProgress();
    this.checkFinishDoor();
    this.playerManager.updateCamera(this.app.renderer, this.level.width);
  }

  sendLocalInputs(targetFrame) {
    const p1Input = this.app.inputManager.buildFrameInput('p1', targetFrame);
    this.frameSync.sendInput(p1Input);

    if (this.players.length >= 2) {
      const p2Input = this.app.inputManager.buildFrameInput('p2', targetFrame);
      this.frameSync.sendInput(p2Input);
      if (this.players.length >= 4) {
        this.frameSync.sendInput(Object.assign({}, p2Input, { playerId: 'p4' }));
      }
    }
    if (this.players.length >= 3) {
      this.frameSync.sendInput(Object.assign({}, p1Input, { playerId: 'p3' }));
    }
  }

  buildNeutralInputs(frameId) {
    const inputs = [];
    for (let i = 0; i < this.players.length; i += 1) {
      inputs.push({
        frameId,
        playerId: this.players[i].id,
        left: false,
        right: false,
        jump: false,
        anchor: false,
        carry: false,
        throwAction: false,
        pull: false
      });
    }
    return inputs;
  }

  handleHazards() {
    const teamState = this.collectibleSystem.getTeamState();
    for (let i = 0; i < this.players.length; i += 1) {
      const player = this.players[i];
      const wasInPit = player.inPit;
      const hazard = this.obstacleSystem.checkHazards(player);
      if (wasInPit && !player.inPit && player.ropeDangerMs > 250) {
        player.rescueCount += 1;
        this.totalRescues += 1;
        this.intimacySystem.addSharedBond(BALANCE_CONFIG.intimacy.ropeRescue, 'rope_rescue', [player.id]);
        this.ropeSystem.onRescued(player);
        this.spawnFeedback({
          type: 'dangerText',
          text: '极限救援 +8',
          x: player.position.x,
          y: player.position.y - player.height - 26,
          color: '#45b36b'
        });
      }

      if (!player.isAlive) {
        continue;
      }
      if (player.pendingRopeDeath) {
        this.totalDeaths += 1;
        player.pendingRopeDeath = false;
        this.deathSystem.killPlayer(player, 'rope_break', teamState, this.players);
        continue;
      }
      if (player.position.y > GAME_CONFIG.world.killY) {
        this.totalDeaths += 1;
        this.deathSystem.killPlayer(player, 'fall_out', teamState, this.players);
        continue;
      }
      if (hazard) {
        this.totalDeaths += 1;
        this.deathSystem.killPlayer(player, hazard.reason, teamState, this.players);
      }
    }
  }

  checkTutorialProgress() {
    const leadX = this.playerManager.getLeadPlayerX();
    if (leadX > 180) {
      this.levelManager.markTutorialStep('move');
    }
    if (leadX > 260) {
      this.levelManager.markTutorialStep('jump');
    }
    for (let i = 0; i < this.ropeSystem.links.length; i += 1) {
      if (this.ropeSystem.links[i].stretchRatio > 0.9) {
        this.levelManager.markTutorialStep('rope');
      }
    }
    if (this.collectibleSystem.getTeamState().hasKey) {
      this.levelManager.markTutorialStep('key');
    }
    for (let i = 0; i < this.players.length; i += 1) {
      if (this.players[i].carryingPlayerId) {
        this.levelManager.markTutorialStep('carry');
      }
      if (this.players[i].successfulThrowCount > 0) {
        this.levelManager.markTutorialStep('throw');
      }
    }
  }

  checkFinishDoor() {
    const door = this.obstacleSystem.getFinishDoor();
    const teamState = this.collectibleSystem.getTeamState();
    if (!door || !teamState.hasKey) {
      return;
    }

    const allReadyAtDoor = this.players.every((player) => player.isAlive && player.position.x >= door.x - 36);
    if (allReadyAtDoor) {
      this.completeLevel();
    }
  }

  completeLevel() {
    if (this.levelCompleted) {
      return;
    }
    this.levelCompleted = true;
    this.resultTriggered = true;
    this.app.adService.onMatchSuccess();
    this.intimacySystem.addSharedBond(BALANCE_CONFIG.intimacy.levelComplete, 'level_complete', []);
    const resultData = this.buildResultData();
    this.app.analyticsService.track('level_complete', {
      levelId: this.level.id,
      playerCount: this.players.length,
      bondTier: resultData.bondTier
    });
    this.app.leaderboardService.submitScore({
      name: this.players.map((player) => player.name).join('&'),
      score: resultData.bond,
      time: resultData.timeText
    });
    this.app.sceneManager.change('result', {
      resultData,
      replayParams: {
        room: this.params.room,
        playerCount: this.params.playerCount,
        levelIndex: this.params.levelIndex || 0
      },
      nextParams: this.levelManager.hasNextLevel()
        ? {
            room: this.params.room,
            playerCount: this.params.playerCount,
            levelIndex: (this.params.levelIndex || 0) + 1
          }
        : null
    });
  }

  buildResultData() {
    let collectedCount = 0;
    let deathCount = 0;
    let rescueCount = 0;
    let throwSuccessCount = 0;
    for (let i = 0; i < this.players.length; i += 1) {
      collectedCount += this.players[i].collectedCount;
      deathCount += this.players[i].deathCount;
      rescueCount += this.players[i].rescueCount;
      throwSuccessCount += this.players[i].successfulThrowCount;
    }
    const bondTier = this.intimacySystem.getBondTier();
    return {
      levelId: this.level.id,
      levelName: this.level.name,
      timeMs: this.elapsedMs,
      timeText: formatTime(this.elapsedMs),
      deathCount,
      rescueCount,
      throwSuccessCount,
      collectedCount,
      bond: this.intimacySystem.teamBond,
      bondTier,
      title: this.getFunnyTitle(bondTier, deathCount, throwSuccessCount),
      players: this.players.map((player) => ({
        name: player.name,
        color: player.color,
        accent: player.accent
      }))
    };
  }

  getFunnyTitle(bondTier, deathCount, throwSuccessCount) {
    if (deathCount >= 6) {
      return '翻车也要贴贴';
    }
    if (throwSuccessCount >= 2) {
      return '高空投送专家';
    }
    if (bondTier === '天选羁绊') {
      return '绳结比心还紧';
    }
    return '今日也在互相拯救';
  }

  spawnFeedback(event) {
    if (event.type === 'dangerText') {
      const text = this.feedbackTexts.acquire();
      text.x = event.x;
      text.y = event.y;
      text.life = 900;
      text.text = event.text;
      text.color = event.color || '#3d2a1f';
      return;
    }

    if (event.type === 'stars') {
      for (let i = 0; i < 6; i += 1) {
        const particle = this.particles.acquire();
        particle.x = event.x;
        particle.y = event.y;
        particle.vx = (i - 2.5) * 0.9;
        particle.vy = -1.6 - (i % 2) * 0.4;
        particle.life = 420;
        particle.size = 4 + (i % 3);
        particle.color = i % 2 === 0 ? '#ffcf6f' : '#ffffff';
      }
    }
  }

  updateEffects(deltaMs) {
    this.feedbackTexts.forEachActive((text) => {
      text.life -= deltaMs;
      text.y += text.vy;
      if (text.life <= 0) {
        this.feedbackTexts.release(text);
      }
    });

    this.particles.forEachActive((particle) => {
      particle.life -= deltaMs;
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vy += 0.04;
      if (particle.life <= 0) {
        this.particles.release(particle);
      }
    });
  }

  render(renderer) {
    renderer.clear(GAME_CONFIG.backgroundColor);
    this.renderBackground(renderer);
    this.obstacleSystem.render(renderer);
    this.renderHints(renderer);
    this.collectibleSystem.render(renderer);
    this.ropeSystem.render(renderer, this.elapsedMs);
    this.playerManager.render(renderer, this.elapsedMs);
    this.renderEffects(renderer);
    this.hud.draw(renderer, {
      levelName: this.level.name,
      levelSubtitle: this.level.subtitle,
      hasKey: this.collectibleSystem.getTeamState().hasKey,
      timeText: formatTime(this.elapsedMs),
      bond: this.intimacySystem.teamBond,
      bondTier: this.intimacySystem.getBondTier(),
      progress: this.levelManager.getProgress(this.playerManager.getLeadPlayerX())
    });
    this.hud.drawButtons(renderer, this.app.inputManager.virtualButtons);
    this.renderTopRightPause(renderer);

    if (this.paused) {
      this.renderPauseOverlay(renderer);
    }
    if (this.deathSystem.offer) {
      this.renderReviveOverlay(renderer);
    }
  }

  renderBackground(renderer) {
    renderer.drawRect(0, 0, renderer.width, renderer.height, '#f7ddb8');
    renderer.drawRect(0, 220, renderer.width, renderer.height - 220, '#f8f8ef');
    for (let i = 0; i < 5; i += 1) {
      renderer.drawCircle(120 + i * 260 - renderer.camera.x * 0.08, 140 + (i % 2) * 26, 68, 'rgba(255,255,255,0.45)');
    }
  }

  renderHints(renderer) {
    for (let i = 0; i < this.level.hints.length; i += 1) {
      const hint = this.level.hints[i];
      if (this.levelManager.completedTutorialSteps[hint.step]) {
        continue;
      }
      const screen = renderer.worldToScreen({ x: hint.x, y: hint.y });
      renderer.drawRoundRect(screen.x - 42, screen.y - 18, 110, 34, 16, 'rgba(255,248,239,0.92)', '#5f4b32', 2);
      renderer.drawText(hint.text, screen.x + 12, screen.y + 5, {
        font: '16px sans-serif',
        color: '#3d2a1f',
        align: 'center'
      });
      renderer.drawText('↓', screen.x + 12, screen.y + 34, {
        font: '24px sans-serif',
        color: '#ff8d5c',
        align: 'center'
      });
    }
  }

  renderEffects(renderer) {
    this.feedbackTexts.forEachActive((text) => {
      const screen = renderer.worldToScreen({ x: text.x, y: text.y });
      renderer.drawText(text.text, screen.x, screen.y, {
        align: 'center',
        font: '18px sans-serif',
        color: text.color,
        shadowColor: 'rgba(255,255,255,0.8)',
        shadowBlur: 4
      });
    });
    this.particles.forEachActive((particle) => {
      const screen = renderer.worldToScreen({ x: particle.x, y: particle.y });
      renderer.drawCircle(screen.x, screen.y, particle.size, particle.color);
    });
  }

  renderTopRightPause(renderer) {
    renderer.drawRoundRect(renderer.width - 108, 118, 76, 40, 12, 'rgba(255,248,239,0.92)', '#5f4b32', 2);
    renderer.drawText('暂停', renderer.width - 70, 144, {
      align: 'center',
      font: '18px sans-serif',
      color: '#3d2a1f'
    });
  }

  renderPauseOverlay(renderer) {
    renderer.drawRect(0, 0, renderer.width, renderer.height, 'rgba(61,42,31,0.52)');
    renderer.drawRoundRect(400, 210, 380, 330, 24, '#fff8ef', '#5f4b32', 2);
    renderer.drawText('暂停中', 590, 270, {
      align: 'center',
      font: 'bold 34px sans-serif',
      color: '#3d2a1f'
    });
    for (let i = 0; i < this.pauseButtons.length; i += 1) {
      const button = this.pauseButtons[i];
      renderer.drawRoundRect(button.x, button.y, button.width, button.height, 18, '#f7ddb8', '#5f4b32', 2);
      renderer.drawText(button.label, button.x + button.width * 0.5, button.y + 42, {
        align: 'center',
        font: '22px sans-serif',
        color: '#3d2a1f'
      });
    }
  }

  renderReviveOverlay(renderer) {
    const offer = this.deathSystem.offer;
    renderer.drawRect(0, 0, renderer.width, renderer.height, 'rgba(61,42,31,0.62)');
    renderer.drawRoundRect(320, 220, 540, 380, 24, '#fff8ef', '#5f4b32', 2);
    renderer.drawText(offer.title, 590, 288, {
      align: 'center',
      font: 'bold 34px sans-serif',
      color: '#3d2a1f'
    });
    renderer.drawText(offer.description, 590, 338, {
      align: 'center',
      font: '20px sans-serif',
      color: '#6b4e3a'
    });
    renderer.drawText(this.deathSystem.isAwaitingAd ? '广告 mock 播放中...' : '复活入口不会阻塞主流程。', 590, 374, {
      align: 'center',
      font: '18px sans-serif',
      color: '#8b6b52'
    });
    for (let i = 0; i < this.offerButtons.length; i += 1) {
      const button = this.offerButtons[i];
      const disabled = button.id === 'revive' && !offer.canUseAd;
      renderer.drawRoundRect(button.x, button.y, button.width, button.height, 18, disabled ? '#ddd6cc' : '#f7ddb8', '#5f4b32', 2);
      renderer.drawText(disabled ? '今日复活广告已满' : button.label, button.x + button.width * 0.5, button.y + 42, {
        align: 'center',
        font: '22px sans-serif',
        color: '#3d2a1f'
      });
    }
  }

  handleTouch(type, event) {
    const touch = (event.changedTouches && event.changedTouches[0]) || (event.touches && event.touches[0]);
    if (!touch) {
      return false;
    }
    if (type === 'move' || type === 'end' || type === 'cancel') {
      return false;
    }
    const x = touch.clientX;
    const y = touch.clientY;

    if (x >= this.app.renderer.width - 108 && x <= this.app.renderer.width - 32 && y >= 118 && y <= 158 && !this.deathSystem.offer) {
      this.paused = !this.paused;
      return true;
    }

    if (this.paused) {
      for (let i = 0; i < this.pauseButtons.length; i += 1) {
        const button = this.pauseButtons[i];
        if (x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height) {
          this.handlePauseAction(button.id);
          return true;
        }
      }
      return true;
    }

    if (this.deathSystem.offer) {
      for (let i = 0; i < this.offerButtons.length; i += 1) {
        const button = this.offerButtons[i];
        if (x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height) {
          this.handleOfferAction(button.id);
          return true;
        }
      }
      return true;
    }

    return false;
  }

  handlePauseAction(buttonId) {
    if (buttonId === 'resume') {
      this.paused = false;
      return;
    }
    if (buttonId === 'restart') {
      this.restartLevel();
      return;
    }
    if (buttonId === 'menu') {
      this.app.sceneManager.change('menu');
    }
  }

  async handleOfferAction(buttonId) {
    if (buttonId === 'revive' && this.deathSystem.offer.canUseAd) {
      const checkpoint = this.levelManager.getCheckpointForX(this.playerManager.getTrailPlayerX());
      const success = await this.deathSystem.acceptOffer(this.playerManager, checkpoint);
      if (!success) {
        this.deathSystem.dismissOffer();
      }
      return;
    }
    if (buttonId === 'retry') {
      this.app.adService.onMatchFail();
      this.deathSystem.recordFail();
      this.restartLevel();
    }
  }

  restartLevel() {
    this.app.analyticsService.track('replay_click', {
      levelId: this.level.id
    });
    this.app.sceneManager.change('game', {
      room: this.params.room,
      playerCount: this.params.playerCount,
      levelIndex: this.params.levelIndex || 0
    });
  }

  onPause() {
    this.paused = true;
  }
}

module.exports = {
  GameScene
};
