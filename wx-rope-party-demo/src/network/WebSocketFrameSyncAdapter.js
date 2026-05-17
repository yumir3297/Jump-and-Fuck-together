const { FrameSyncAdapter } = require('./FrameSyncAdapter');

class WebSocketFrameSyncAdapter extends FrameSyncAdapter {
  constructor(url) {
    super();
    this.url = url;
  }

  connect(roomId, playerId) {
    this.roomId = roomId;
    this.playerId = playerId;
    return Promise.resolve();
  }

  sendInput() {
    // TODO: 后续替换为真实 WebSocket 帧同步，只同步输入不直接同步位置。
  }

  onFrame() {
    // TODO: 绑定来自真实服务器的帧广播。
  }

  disconnect() {}

  reconnect() {
    return Promise.resolve();
  }
}

module.exports = {
  WebSocketFrameSyncAdapter
};
