const { GAME_CONFIG } = require('../config/gameConfig');

class MainMenuScene {
  constructor(app) {
    this.app = app;
    this.buttons = [];
    this.showLeaderboard = false;
    this.layout = null;
  }

  enter() {
    this.app.analyticsService.track('main_menu_view');
  }

  updateLayout(renderer) {
    const width = renderer.width;
    const height = renderer.height;
    const layoutKey = width + 'x' + height;
    if (this.layout && this.layout.key === layoutKey) {
      return;
    }

    const compact = height <= 500;
    const paddingX = compact ? 22 : 40;
    const titleFontSize = compact ? 40 : 58;
    const subtitleFontSize = compact ? 18 : 24;
    const descFontSize = compact ? 14 : 20;
    const topY = compact ? 44 : 72;
    const gridTop = compact ? 196 : 250;
    const extraActions = [
      { key: 'leaderboard', label: '排行榜' },
      { key: 'continue', label: '继续上次' }
    ];
    const actions = GAME_CONFIG.modeOptions.concat(extraActions);
    const columns = width >= 820 ? 4 : width >= 620 ? 3 : 2;
    const rows = Math.ceil(actions.length / columns);
    const gapX = compact ? 12 : 18;
    const gapY = compact ? 12 : 18;
    const buttonHeight = compact ? 52 : 72;
    const contentWidth = width - paddingX * 2;
    const buttonWidth = Math.floor((contentWidth - gapX * (columns - 1)) / columns);

    this.buttons = [];
    for (let i = 0; i < actions.length; i += 1) {
      const option = actions[i];
      const column = i % 3;
      const row = Math.floor(i / columns);
      this.buttons.push({
        label: option.label,
        x: paddingX + (i % columns) * (buttonWidth + gapX),
        y: gridTop + row * (buttonHeight + gapY),
        width: buttonWidth,
        height: buttonHeight,
        action: option
      });
    }

    this.layout = {
      key: layoutKey,
      compact,
      paddingX,
      titleY: topY + titleFontSize,
      subtitleY: topY + titleFontSize + 34,
      descY: topY + titleFontSize + 64,
      titleFont: 'bold ' + titleFontSize + 'px sans-serif',
      subtitleFont: subtitleFontSize + 'px sans-serif',
      descFont: descFontSize + 'px sans-serif',
      footerY: Math.min(height - 16, gridTop + rows * (buttonHeight + gapY) + 10),
      modalWidth: Math.min(560, width - 56),
      modalHeight: compact ? 174 : 210
    };
  }

  update() {}

  render(renderer) {
    this.updateLayout(renderer);
    const layout = this.layout;
    renderer.clear('#f7ddb8');
    renderer.drawText('友尽又贴贴', layout.paddingX, layout.titleY, {
      font: layout.titleFont,
      color: '#3d2a1f'
    });
    renderer.drawText('1-4 人强绑定协作跑酷', layout.paddingX + 2, layout.subtitleY, {
      font: layout.subtitleFont,
      color: '#6b4e3a'
    });
    renderer.drawText('牵绳、抱起、丢出、一起翻车再一起复活。', layout.paddingX + 2, layout.descY, {
      font: layout.descFont,
      color: '#8b6b52'
    });

    for (let i = 0; i < this.buttons.length; i += 1) {
      const button = this.buttons[i];
      renderer.drawRoundRect(button.x, button.y, button.width, button.height, 20, '#fff8ef', '#5f4b32', 2);
      renderer.drawText(button.label, button.x + button.width * 0.5, button.y + button.height * 0.62, {
        align: 'center',
        font: (layout.compact ? 18 : 24) + 'px sans-serif',
        color: '#3d2a1f'
      });
    }

    renderer.drawText('先用双人模式测牵绳、抱起、丢出，再看结算分享。', layout.paddingX, Math.min(renderer.height - 10, layout.footerY), {
      font: (layout.compact ? 13 : 16) + 'px sans-serif',
      color: '#8b6b52'
    });

    if (this.showLeaderboard) {
      const rank = this.app.leaderboardService.getTopPlayers();
      const modalX = (renderer.width - layout.modalWidth) * 0.5;
      const modalY = (renderer.height - layout.modalHeight) * 0.5;
      renderer.drawRect(0, 0, renderer.width, renderer.height, 'rgba(61,42,31,0.28)');
      renderer.drawRoundRect(modalX, modalY, layout.modalWidth, layout.modalHeight, 24, 'rgba(255,248,239,0.97)', '#5f4b32', 2);
      renderer.drawText('Mock 排行榜', modalX + 28, modalY + 42, {
        font: (layout.compact ? 20 : 24) + 'px sans-serif',
        color: '#3d2a1f'
      });
      for (let i = 0; i < rank.length; i += 1) {
        renderer.drawText((i + 1) + '. ' + rank[i].name + '  ' + rank[i].score + '分  ' + rank[i].time, modalX + 28, modalY + 78 + i * (layout.compact ? 26 : 32), {
          font: (layout.compact ? 16 : 18) + 'px sans-serif',
          color: '#6b4e3a'
        });
      }
    }
  }

  handleTouch(type, event) {
    if (type !== 'start') {
      return false;
    }
    const touch = (event.changedTouches && event.changedTouches[0]) || (event.touches && event.touches[0]);
    if (!touch) {
      return false;
    }
    const x = touch.clientX;
    const y = touch.clientY;
    for (let i = 0; i < this.buttons.length; i += 1) {
      const button = this.buttons[i];
      if (
        x >= button.x &&
        x <= button.x + button.width &&
        y >= button.y &&
        y <= button.y + button.height
      ) {
        this.handleAction(button.action);
        return true;
      }
    }
    return false;
  }

  handleAction(action) {
    if (action.key === 'leaderboard') {
      this.showLeaderboard = !this.showLeaderboard;
      return;
    }

    if (action.key === 'continue') {
      const saved = this.app.storageService.get('last_mode', { playerCount: 2, modeKey: 'duo' });
      this.app.sceneManager.change('room', saved);
      return;
    }

    this.app.analyticsService.track('mode_selected', {
      modeKey: action.key,
      playerCount: action.playerCount
    });
    const params = {
      modeKey: action.key,
      playerCount: action.playerCount
    };
    this.app.storageService.set('last_mode', params);
    this.app.sceneManager.change('room', params);
  }
}

module.exports = {
  MainMenuScene
};
