const { generateResultPoster } = require('../services/ShareService');

class ResultScene {
  constructor(app, params) {
    this.app = app;
    this.params = params;
    this.resultData = params.resultData;
    this.poster = null;
    this.buttons = [
      { id: 'replay', label: '再玩一局', x: 170, y: 610, width: 180, height: 68 },
      { id: 'next', label: params.nextParams ? '下一关' : '返回菜单', x: 380, y: 610, width: 180, height: 68 },
      { id: 'share', label: '分享给朋友', x: 590, y: 610, width: 210, height: 68 },
      { id: 'menu', label: '回主菜单', x: 830, y: 610, width: 180, height: 68 }
    ];
  }

  enter() {
    this.app.analyticsService.track('result_view', {
      levelId: this.resultData.levelId,
      bondTier: this.resultData.bondTier
    });
    this.poster = generateResultPoster(this.resultData);
  }

  update() {}

  render(renderer) {
    renderer.clear('#f7ddb8');
    renderer.drawText('通关合照', 140, 110, {
      font: 'bold 50px sans-serif',
      color: '#3d2a1f'
    });
    renderer.drawText(this.resultData.levelName + ' / ' + this.resultData.bondTier, 140, 150, {
      font: '24px sans-serif',
      color: '#6b4e3a'
    });
    renderer.drawRoundRect(140, 190, 500, 320, 24, '#fff8ef', '#5f4b32', 2);
    renderer.drawText('通关时间：' + this.resultData.timeText, 180, 246, {
      font: '24px sans-serif',
      color: '#3d2a1f'
    });
    renderer.drawText('死亡次数：' + this.resultData.deathCount, 180, 290, {
      font: '22px sans-serif',
      color: '#6b4e3a'
    });
    renderer.drawText('救援次数：' + this.resultData.rescueCount, 180, 326, {
      font: '22px sans-serif',
      color: '#6b4e3a'
    });
    renderer.drawText('成功丢出：' + this.resultData.throwSuccessCount, 180, 362, {
      font: '22px sans-serif',
      color: '#6b4e3a'
    });
    renderer.drawText('收集数量：' + this.resultData.collectedCount, 180, 398, {
      font: '22px sans-serif',
      color: '#6b4e3a'
    });
    renderer.drawText('好感度：' + this.resultData.bond, 180, 434, {
      font: '22px sans-serif',
      color: '#6b4e3a'
    });
    renderer.drawText('搞笑称号：' + this.resultData.title, 180, 470, {
      font: '22px sans-serif',
      color: '#6b4e3a'
    });

    renderer.drawRoundRect(700, 170, 460, 370, 24, '#fff8ef', '#5f4b32', 2);
    renderer.drawText('分享海报预览（mock）', 730, 216, {
      font: '24px sans-serif',
      color: '#3d2a1f'
    });
    if (this.poster) {
      renderer.ctx.drawImage(this.poster, 730, 240, 380, 250);
    } else {
      renderer.drawText('当前环境不支持离屏海报', 920, 368, {
        align: 'center',
        font: '20px sans-serif',
        color: '#8b6b52'
      });
    }

    for (let i = 0; i < this.buttons.length; i += 1) {
      const button = this.buttons[i];
      renderer.drawRoundRect(button.x, button.y, button.width, button.height, 18, '#fff8ef', '#5f4b32', 2);
      renderer.drawText(button.label, button.x + button.width * 0.5, button.y + 43, {
        align: 'center',
        font: '22px sans-serif',
        color: '#3d2a1f'
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
    if (buttonId === 'replay') {
      this.app.analyticsService.track('replay_click', {
        levelId: this.resultData.levelId
      });
      this.app.sceneManager.change('game', this.params.replayParams);
      return;
    }
    if (buttonId === 'next') {
      if (this.params.nextParams) {
        this.app.sceneManager.change('game', this.params.nextParams);
      } else {
        this.app.sceneManager.change('menu');
      }
      return;
    }
    if (buttonId === 'share') {
      this.poster = this.app.shareService.shareResult(this.resultData);
      return;
    }
    if (buttonId === 'menu') {
      this.app.sceneManager.change('menu');
    }
  }
}

module.exports = {
  ResultScene
};
