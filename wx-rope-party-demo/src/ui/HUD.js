const { GAME_CONFIG } = require('../config/gameConfig');

class HUD {
  draw(renderer, gameState) {
    const colors = GAME_CONFIG.colors;
    renderer.drawRoundRect(16, 16, renderer.width - 32, 88, 18, 'rgba(255,248,239,0.95)', colors.panelBorder, 2);
    renderer.drawText(gameState.levelName, 36, 48, {
      font: 'bold 24px sans-serif',
      color: colors.text
    });
    renderer.drawText(gameState.levelSubtitle, 36, 78, {
      font: '16px sans-serif',
      color: colors.muted
    });

    renderer.drawText('钥匙：' + (gameState.hasKey ? '已拿到' : '未拿到'), 300, 48, {
      font: '18px sans-serif',
      color: gameState.hasKey ? colors.key : colors.muted
    });
    renderer.drawText('时间：' + gameState.timeText, 300, 76, {
      font: '18px sans-serif',
      color: colors.text
    });

    renderer.drawText('默契：' + gameState.bond + ' / ' + gameState.bondTier, 520, 48, {
      font: '18px sans-serif',
      color: colors.text
    });
    renderer.drawRoundRect(520, 58, 220, 18, 9, '#f0e4d0', '#c7ab88', 2);
    renderer.drawRoundRect(520, 58, Math.max(18, Math.min(220, gameState.bond * 2.2)), 18, 9, '#ff87a2', null, 0);

    renderer.drawText('进度', 800, 48, {
      font: '18px sans-serif',
      color: colors.text
    });
    renderer.drawRoundRect(850, 58, 240, 18, 9, '#f0e4d0', '#c7ab88', 2);
    renderer.drawRoundRect(850, 58, Math.max(14, 240 * gameState.progress), 18, 9, '#69b86d', null, 0);

    renderer.drawText('P1: A/D/W + J抱丢 + K拉', 1120, 44, {
      font: '15px sans-serif',
      color: colors.text,
      align: 'left'
    });
    renderer.drawText('P2: 方向键 + 1抱丢 + 2拉', 1120, 68, {
      font: '15px sans-serif',
      color: colors.text,
      align: 'left'
    });
  }

  drawButtons(renderer, buttons) {
    for (let i = 0; i < buttons.length; i += 1) {
      const button = buttons[i];
      renderer.drawRoundRect(
        button.x,
        button.y,
        button.width,
        button.height,
        18,
        button.pressed ? 'rgba(255,206,121,0.95)' : 'rgba(255,255,255,0.88)',
        '#5f4b32',
        2
      );
      renderer.drawText(button.label, button.x + button.width * 0.5, button.y + button.height * 0.6, {
        align: 'center',
        font: '20px sans-serif',
        color: '#3d2a1f'
      });
    }
  }
}

module.exports = {
  HUD
};
