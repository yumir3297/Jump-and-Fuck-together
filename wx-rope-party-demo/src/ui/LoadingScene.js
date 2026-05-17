class LoadingScene {
  constructor(app) {
    this.app = app;
    this.progress = 0;
  }

  enter() {
    this.app.analyticsService.track('app_launch');
    this.app.adService.preloadRewardedAd();
  }

  update(deltaMs) {
    this.progress = Math.min(1, this.progress + deltaMs / 900);
    if (this.progress >= 1) {
      this.app.analyticsService.track('loading_complete');
      this.app.sceneManager.change('menu');
    }
  }

  render(renderer) {
    renderer.clear('#f7ddb8');
    renderer.drawText('友尽又贴贴', renderer.width * 0.5, renderer.height * 0.38, {
      align: 'center',
      font: 'bold 54px sans-serif',
      color: '#3d2a1f'
    });
    renderer.drawText('多人牵绳协作跑酷 Demo', renderer.width * 0.5, renderer.height * 0.45, {
      align: 'center',
      font: '24px sans-serif',
      color: '#6b4e3a'
    });
    renderer.drawRoundRect(renderer.width * 0.5 - 210, renderer.height * 0.58, 420, 26, 13, '#fff8ef', '#5f4b32', 2);
    renderer.drawRoundRect(renderer.width * 0.5 - 210, renderer.height * 0.58, 420 * this.progress, 26, 13, '#ff87a2', null, 0);
    renderer.drawText('正在把绳子系紧... ' + Math.floor(this.progress * 100) + '%', renderer.width * 0.5, renderer.height * 0.65, {
      align: 'center',
      font: '20px sans-serif',
      color: '#3d2a1f'
    });
  }
}

module.exports = {
  LoadingScene
};
