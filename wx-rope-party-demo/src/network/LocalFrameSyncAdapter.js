const { FrameSyncAdapter } = require('./FrameSyncAdapter');
const { GAME_CONFIG } = require('../config/gameConfig');
const { pickOne } = require('../utils/random');

class LocalFrameSyncAdapter extends FrameSyncAdapter {
  constructor() {
    super();
    this.roomId = '';
    this.playerId = '';
    this.callback = null;
    this.frameBuffer = {};
    this.connected = false;
    this.currentFrame = 0;
    this.playerIds = [];
  }

  connect(roomId, playerId) {
    this.roomId = roomId;
    this.playerId = playerId;
    this.connected = true;
    return Promise.resolve();
  }

  setPlayerIds(playerIds) {
    this.playerIds = playerIds.slice();
  }

  sendInput(input) {
    if (!this.connected) {
      return;
    }
    const latencyFrames = pickOne(
      input.frameId + input.playerId.length * 17,
      GAME_CONFIG.network.simulatedLatencyFrames
    );
    if (!this.frameBuffer[input.frameId]) {
      this.frameBuffer[input.frameId] = [];
    }
    this.frameBuffer[input.frameId].push(
      Object.assign({}, input, {
        simulatedLatencyFrames: latencyFrames
      })
    );
  }

  onFrame(callback) {
    this.callback = callback;
  }

  step(frameId) {
    this.currentFrame = frameId;
    const inputs = this.frameBuffer[frameId] || [];
    delete this.frameBuffer[frameId];
    if (this.callback) {
      this.callback(frameId, inputs);
    }
  }

  disconnect() {
    this.connected = false;
  }

  reconnect() {
    this.connected = true;
    return Promise.resolve();
  }
}

module.exports = {
  LocalFrameSyncAdapter
};
