const { supportsShareAppMessage } = require('../utils/device');

function createPosterCanvas(width, height) {
  if (typeof wx !== 'undefined' && wx.createOffscreenCanvas) {
    return wx.createOffscreenCanvas({ type: '2d', width, height });
  }
  if (typeof wx !== 'undefined' && wx.createCanvas) {
    const canvas = wx.createCanvas();
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }
  return null;
}

function generateResultPoster(resultData) {
  const canvas = createPosterCanvas(900, 1600);
  if (!canvas) {
    return null;
  }
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#f7ddb8';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff8ef';
  ctx.fillRect(60, 80, 780, 1440);
  ctx.strokeStyle = '#5f4b32';
  ctx.lineWidth = 6;
  ctx.strokeRect(60, 80, 780, 1440);

  ctx.fillStyle = '#3d2a1f';
  ctx.font = 'bold 50px sans-serif';
  ctx.fillText('友尽又贴贴', 110, 180);
  ctx.font = '28px sans-serif';
  ctx.fillText('本局合照报告', 110, 230);

  ctx.font = '32px sans-serif';
  ctx.fillText('羁绊等级：' + resultData.bondTier, 110, 320);
  ctx.fillText('通关时间：' + resultData.timeText, 110, 375);
  ctx.fillText('死亡次数：' + resultData.deathCount, 110, 430);
  ctx.fillText('救援次数：' + resultData.rescueCount, 110, 485);
  ctx.fillText('成功丢出：' + resultData.throwSuccessCount, 110, 540);
  ctx.fillText('收集总数：' + resultData.collectedCount, 110, 595);
  ctx.fillText('搞笑称号：' + resultData.title, 110, 650);

  ctx.fillStyle = '#ffefda';
  ctx.fillRect(110, 730, 680, 420);
  ctx.strokeStyle = '#d2b48c';
  ctx.strokeRect(110, 730, 680, 420);
  ctx.fillStyle = '#5f4b32';
  ctx.font = '30px sans-serif';
  ctx.fillText('队友合照', 140, 790);

  const players = resultData.players || [];
  for (let i = 0; i < players.length; i += 1) {
    const player = players[i];
    const x = 210 + i * 150;
    const y = 1040 - (i % 2) * 20;
    ctx.fillStyle = player.color;
    roundRect(ctx, x - 25, y - 70, 50, 70, 16);
    ctx.fill();
    ctx.strokeStyle = '#4f3a28';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(x, y - 88, 16, 0, Math.PI * 2);
    ctx.fillStyle = player.accent;
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#3d2a1f';
    ctx.font = '24px sans-serif';
    ctx.fillText(player.name, x - 28, y + 30);
  }

  ctx.fillStyle = '#3d2a1f';
  ctx.font = '26px sans-serif';
  ctx.fillText('再玩一局，说不定这次不翻车。', 110, 1280);
  ctx.fillText('微信小游戏 demo 海报（mock）', 110, 1330);
  return canvas;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

class ShareService {
  constructor(analyticsService) {
    this.analyticsService = analyticsService;
  }

  shareResult(resultData) {
    const poster = generateResultPoster(resultData);
    if (this.analyticsService) {
      this.analyticsService.track('share_click', {
        bondTier: resultData.bondTier
      });
    }
    if (supportsShareAppMessage()) {
      wx.shareAppMessage({
        title: '我们刚刚打出了「' + resultData.bondTier + '」',
        query: 'bond=' + encodeURIComponent(resultData.bondTier)
      });
    } else if (typeof console !== 'undefined') {
      console.log('[MockShare]', resultData, poster);
    }
    return poster;
  }
}

module.exports = {
  ShareService,
  generateResultPoster
};
