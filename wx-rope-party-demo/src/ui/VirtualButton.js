const { pointInRect } = require('../utils/math');

class VirtualButton {
  constructor(options) {
    this.id = options.id;
    this.playerId = options.playerId;
    this.action = options.action;
    this.label = options.label;
    this.x = options.x;
    this.y = options.y;
    this.width = options.width;
    this.height = options.height;
    this.color = options.color;
    this.pressed = false;
    this.touchId = null;
  }

  contains(point) {
    return pointInRect(point, {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height
    });
  }
}

module.exports = {
  VirtualButton
};
