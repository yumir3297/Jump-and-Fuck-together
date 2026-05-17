class LeaderboardService {
  constructor(storageService) {
    this.storageService = storageService;
    this.cache = this.storageService.get('mock_leaderboard', [
      { name: '桃桃&栗栗', score: 92, time: '02:10' },
      { name: '神投二人组', score: 87, time: '02:45' },
      { name: '绳子快断了', score: 74, time: '03:01' }
    ]);
  }

  getTopPlayers() {
    return this.cache.slice().sort((a, b) => b.score - a.score);
  }

  submitScore(entry) {
    this.cache.push(entry);
    this.cache = this.cache.slice().sort((a, b) => b.score - a.score).slice(0, 10);
    this.storageService.set('mock_leaderboard', this.cache);
  }

  syncToWeChatOpenData(score) {
    if (typeof wx !== 'undefined' && wx.setUserCloudStorage) {
      // TODO: 接入开放数据域后，在这里写入 score、time 等字段。
      return wx.setUserCloudStorage({
        KVDataList: [
          {
            key: 'rope_party_score',
            value: String(score)
          }
        ]
      });
    }
    return Promise.resolve();
  }
}

module.exports = {
  LeaderboardService
};
