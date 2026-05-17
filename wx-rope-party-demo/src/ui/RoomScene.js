class RoomScene {
  constructor(app, params) {
    this.app = app;
    this.params = params;
    this.buttons = [];
    this.room = null;
    this.layout = null;
  }

  enter() {
    this.room = this.params.modeKey === 'join'
      ? this.app.roomService.joinRoom('888888', this.params.playerCount || 2)
      : this.app.roomService.createRoom(this.params.modeKey || 'duo', this.params.playerCount || 2);
  }

  updateLayout(renderer) {
    const width = renderer.width;
    const height = renderer.height;
    const layoutKey = width + 'x' + height + ':' + this.room.players.length + ':' + this.params.playerCount;
    if (this.layout && this.layout.key === layoutKey) {
      return;
    }

    const playerCount = this.room.players.length;
    const compact = height <= 500;
    const crowded = compact && playerCount >= 4;
    const paddingX = compact ? 22 : 40;
    const topY = crowded ? 26 : compact ? 42 : 64;
    const titleFontSize = crowded ? 34 : compact ? 40 : 46;
    const metaFontSize = crowded ? 16 : compact ? 18 : 24;
    const subMetaFontSize = crowded ? 14 : compact ? 16 : 20;
    const contentWidth = width - paddingX * 2;
    const buttonGap = crowded ? 8 : compact ? 10 : 14;
    const buttonCols = width >= 860 ? 4 : 2;
    const buttonRows = Math.ceil(4 / buttonCols);
    const buttonHeight = crowded ? 46 : compact ? 50 : 68;
    const buttonWidth = Math.floor((contentWidth - buttonGap * (buttonCols - 1)) / buttonCols);
    const buttonStartY = height - 18 - (buttonHeight * buttonRows + buttonGap * (buttonRows - 1));
    const tipHeight = crowded ? 42 : compact ? 58 : 88;
    const tipY = buttonStartY - 14 - tipHeight;
    const listTop = crowded ? 130 : compact ? 164 : 240;
    const listBottom = tipY - 16;
    const cardGap = crowded ? 8 : compact ? 10 : 14;
    const minCardHeight = crowded ? 30 : compact ? 40 : 46;
    const maxCardHeight = crowded ? 36 : compact ? 50 : 60;
    const cardHeight = Math.max(minCardHeight, Math.min(maxCardHeight, Math.floor((listBottom - listTop - cardGap * (playerCount - 1)) / Math.max(1, playerCount))));

    const buttonDefs = [
      { id: 'ready', label: '我准备好了' },
      { id: 'start', label: '开始闯关' },
      { id: 'count', label: '人数 ' + this.params.playerCount },
      { id: 'back', label: '返回' }
    ];

    this.buttons = [];
    for (let i = 0; i < buttonDefs.length; i += 1) {
      const row = Math.floor(i / buttonCols);
      const col = i % buttonCols;
      this.buttons.push({
        id: buttonDefs[i].id,
        label: buttonDefs[i].label,
        x: paddingX + col * (buttonWidth + buttonGap),
        y: buttonStartY + row * (buttonHeight + buttonGap),
        width: buttonWidth,
        height: buttonHeight
      });
    }

    this.layout = {
      key: layoutKey,
      compact,
      crowded,
      paddingX,
      titleY: topY + titleFontSize,
      roomCodeY: topY + titleFontSize + (crowded ? 28 : compact ? 34 : 48),
      modeY: topY + titleFontSize + (crowded ? 54 : compact ? 68 : 84),
      listTop,
      listWidth: contentWidth,
      cardHeight,
      cardGap,
      cardNameX: paddingX + 26,
      cardRoleX: paddingX + Math.floor(contentWidth * 0.42),
      cardStatusX: paddingX + contentWidth - 26,
      tipX: paddingX,
      tipY,
      tipWidth: contentWidth,
      tipHeight,
      titleFont: 'bold ' + titleFontSize + 'px sans-serif',
      roomCodeFont: metaFontSize + 'px sans-serif',
      modeFont: subMetaFontSize + 'px sans-serif'
    };
  }

  update() {}

  render(renderer) {
    this.updateLayout(renderer);
    const layout = this.layout;
    renderer.clear('#f7ddb8');
    renderer.drawText('房间准备页', layout.paddingX, layout.titleY, {
      font: layout.titleFont,
      color: '#3d2a1f'
    });
    renderer.drawText('房间码：' + this.room.roomCode, layout.paddingX, layout.roomCodeY, {
      font: layout.roomCodeFont,
      color: '#6b4e3a'
    });
    renderer.drawText('模式：' + this.params.modeKey + ' / ' + this.params.playerCount + ' 人', layout.paddingX, layout.modeY, {
      font: layout.modeFont,
      color: '#8b6b52'
    });

    for (let i = 0; i < this.room.players.length; i += 1) {
      const player = this.room.players[i];
      const y = layout.listTop + i * (layout.cardHeight + layout.cardGap);
      renderer.drawRoundRect(layout.paddingX, y, layout.listWidth, layout.cardHeight, 16, '#fff8ef', '#5f4b32', 2);
      renderer.drawText(player.name, layout.cardNameX, y + layout.cardHeight * 0.63, {
        font: (layout.compact ? 18 : 22) + 'px sans-serif',
        color: '#3d2a1f'
      });
      renderer.drawText(player.local ? '本地模拟' : '镜像/AI', layout.cardRoleX, y + layout.cardHeight * 0.63, {
        font: (layout.compact ? 15 : 18) + 'px sans-serif',
        color: '#8b6b52'
      });
      renderer.drawText(player.ready ? '已准备' : '未准备', layout.cardStatusX, y + layout.cardHeight * 0.63, {
        font: (layout.compact ? 16 : 18) + 'px sans-serif',
        color: player.ready ? '#45b36b' : '#ff8d5c',
        align: 'right'
      });
    }

    renderer.drawRoundRect(layout.tipX, layout.tipY, layout.tipWidth, layout.tipHeight, 18, 'rgba(255,248,239,0.95)', '#5f4b32', 2);
    renderer.drawText('本地联机模拟', layout.tipX + 20, layout.tipY + (layout.crowded ? 17 : layout.compact ? 24 : 30), {
      font: (layout.crowded ? 15 : layout.compact ? 18 : 24) + 'px sans-serif',
      color: '#3d2a1f'
    });
    renderer.drawText('先点“我准备好了”，再开始。P1/P2 本地控制。', layout.tipX + 20, layout.tipY + (layout.crowded ? 34 : layout.compact ? 46 : 58), {
      font: (layout.crowded ? 11 : layout.compact ? 13 : 16) + 'px sans-serif',
      color: '#6b4e3a'
    });

    for (let i = 0; i < this.buttons.length; i += 1) {
      const button = this.buttons[i];
      renderer.drawRoundRect(button.x, button.y, button.width, button.height, 18, '#fff8ef', '#5f4b32', 2);
      renderer.drawText(button.label, button.x + button.width * 0.5, button.y + button.height * 0.62, {
        align: 'center',
        font: (layout.compact ? 17 : 22) + 'px sans-serif',
        color: '#3d2a1f'
      });
    }

    if (!this.app.roomService.canStart()) {
      renderer.drawText('至少让自己准备一下再开始。', layout.paddingX, this.buttons[0].y - 8, {
        font: (layout.compact ? 14 : 18) + 'px sans-serif',
        color: '#8b6b52'
      });
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
      if (x >= button.x && x <= button.x + button.width && y >= button.y && y <= button.y + button.height) {
        this.handleButton(button.id);
        return true;
      }
    }
    return false;
  }

  handleButton(buttonId) {
    if (buttonId === 'ready') {
      this.room = this.app.roomService.toggleReady('p1');
      return;
    }
    if (buttonId === 'count') {
      const nextCount = this.params.playerCount >= 4 ? 1 : this.params.playerCount + 1;
      this.params.playerCount = nextCount;
      this.room =
        this.params.modeKey === 'join'
          ? this.app.roomService.joinRoom(this.room.roomCode, nextCount)
          : this.app.roomService.createRoom(this.params.modeKey, nextCount);
      this.layout = null;
      return;
    }
    if (buttonId === 'back') {
      this.app.sceneManager.change('menu');
      return;
    }
    if (buttonId === 'start' && this.app.roomService.canStart()) {
      this.app.analyticsService.track('game_start', {
        playerCount: this.params.playerCount,
        modeKey: this.params.modeKey
      });
      this.app.sceneManager.change('game', {
        room: this.app.roomService.startGame(),
        playerCount: this.params.playerCount,
        levelIndex: 0
      });
    }
  }
}

module.exports = {
  RoomScene
};
