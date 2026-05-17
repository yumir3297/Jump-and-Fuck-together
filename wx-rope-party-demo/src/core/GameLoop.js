class GameLoop {
  constructor(options) {
    this.fixedDeltaMs = options.fixedDeltaMs;
    this.update = options.update;
    this.render = options.render;
    this.raf =
      options.raf ||
      function fallbackRaf(callback) {
        return setTimeout(function timeoutTick() {
          callback(Date.now());
        }, 16);
      };
    this.running = false;
    this.lastTimestamp = 0;
    this.accumulator = 0;
    this.boundTick = this.tick.bind(this);
  }

  start() {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastTimestamp = 0;
    this.accumulator = 0;
    this.raf(this.boundTick);
  }

  stop() {
    this.running = false;
  }

  tick(timestamp) {
    if (!this.running) {
      return;
    }
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp;
    }
    const deltaMs = Math.min(100, timestamp - this.lastTimestamp);
    this.lastTimestamp = timestamp;
    this.accumulator += deltaMs;

    while (this.accumulator >= this.fixedDeltaMs) {
      this.update(this.fixedDeltaMs);
      this.accumulator -= this.fixedDeltaMs;
    }

    const alpha = this.accumulator / this.fixedDeltaMs;
    this.render(alpha);
    this.raf(this.boundTick);
  }
}

module.exports = {
  GameLoop
};
