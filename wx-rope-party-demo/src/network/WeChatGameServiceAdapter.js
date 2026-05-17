const { FrameSyncAdapter } = require('./FrameSyncAdapter');

class WeChatGameServiceAdapter extends FrameSyncAdapter {
  connect(roomId, playerId) {
    this.roomId = roomId;
    this.playerId = playerId;
    return Promise.resolve();
  }

  sendInput() {
    // TODO: 这里预留接入微信小游戏联机对战服务。
  }

  onFrame() {
    // TODO: 绑定微信联机 SDK 的帧事件。
  }

  disconnect() {}

  reconnect() {
    return Promise.resolve();
  }
}

module.exports = {
  WeChatGameServiceAdapter
};
