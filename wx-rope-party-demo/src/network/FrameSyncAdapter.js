class FrameSyncAdapter {
  connect() {
    return Promise.resolve();
  }

  sendInput() {}

  onFrame() {}

  disconnect() {}

  reconnect() {
    return Promise.resolve();
  }
}

module.exports = {
  FrameSyncAdapter
};
