const { VirtualButton } = require('../ui/VirtualButton');

function keyCodeToName(code) {
  const map = {
    37: 'ArrowLeft',
    38: 'ArrowUp',
    39: 'ArrowRight',
    40: 'ArrowDown',
    65: 'a',
    68: 'd',
    74: 'j',
    75: 'k',
    83: 's',
    87: 'w',
    32: 'Space'
  };
  return map[code] || String(code);
}

class InputManager {
  constructor() {
    this.keysDown = {};
    this.virtualButtons = [];
    this.touchBindings = {};
    this.prevSnapshots = {};
  }

  bindWxEvents() {
    if (typeof wx === 'undefined') {
      return;
    }
    if (wx.onKeyDown) {
      wx.onKeyDown((event) => {
        const key = event.key || keyCodeToName(event.keyCode);
        this.keysDown[key] = true;
      });
    }
    if (wx.onKeyUp) {
      wx.onKeyUp((event) => {
        const key = event.key || keyCodeToName(event.keyCode);
        this.keysDown[key] = false;
      });
    }
  }

  reset() {
    this.virtualButtons = [];
    this.touchBindings = {};
    this.prevSnapshots = {};
  }

  setVirtualButtons(buttons) {
    this.virtualButtons = buttons || [];
  }

  createButton(options) {
    return new VirtualButton(options);
  }

  handleTouch(type, event) {
    if (!this.virtualButtons.length) {
      return;
    }
    const touches =
      type === 'end' || type === 'cancel'
        ? event.changedTouches || []
        : event.touches || event.changedTouches || [];

    if (type === 'start') {
      for (let i = 0; i < touches.length; i += 1) {
        const touch = touches[i];
        const point = { x: touch.clientX, y: touch.clientY };
        for (let j = 0; j < this.virtualButtons.length; j += 1) {
          const button = this.virtualButtons[j];
          if (!button.pressed && button.contains(point)) {
            button.pressed = true;
            button.touchId = touch.identifier;
            this.touchBindings[touch.identifier] = button.id;
            break;
          }
        }
      }
      return;
    }

    if (type === 'move') {
      const activeTouchMap = {};
      for (let i = 0; i < touches.length; i += 1) {
        activeTouchMap[touches[i].identifier] = touches[i];
      }
      for (let j = 0; j < this.virtualButtons.length; j += 1) {
        const button = this.virtualButtons[j];
        if (button.touchId == null) {
          continue;
        }
        const touch = activeTouchMap[button.touchId];
        if (!touch) {
          button.pressed = false;
          button.touchId = null;
          continue;
        }
        button.pressed = button.contains({ x: touch.clientX, y: touch.clientY });
      }
      return;
    }

    for (let i = 0; i < touches.length; i += 1) {
      const touch = touches[i];
      const buttonId = this.touchBindings[touch.identifier];
      if (!buttonId) {
        continue;
      }
      for (let j = 0; j < this.virtualButtons.length; j += 1) {
        const button = this.virtualButtons[j];
        if (button.id === buttonId) {
          button.pressed = false;
          button.touchId = null;
        }
      }
      delete this.touchBindings[touch.identifier];
    }
  }

  getPlayerBinding(playerId) {
    if (playerId === 'p1') {
      return {
        left: ['a', 'A'],
        right: ['d', 'D'],
        jump: ['w', 'W', 'Space'],
        carry: ['j', 'J'],
        pull: ['k', 'K']
      };
    }
    if (playerId === 'p2') {
      return {
        left: ['ArrowLeft'],
        right: ['ArrowRight'],
        jump: ['ArrowUp'],
        carry: ['1', 'Numpad1', '/'],
        pull: ['2', 'Numpad2', '.']
      };
    }
    return {
      left: [],
      right: [],
      jump: [],
      carry: [],
      pull: []
    };
  }

  isAnyKeyDown(list) {
    for (let i = 0; i < list.length; i += 1) {
      if (this.keysDown[list[i]]) {
        return true;
      }
    }
    return false;
  }

  getButtonState(playerId, action) {
    for (let i = 0; i < this.virtualButtons.length; i += 1) {
      const button = this.virtualButtons[i];
      if (button.playerId === playerId && button.action === action && button.pressed) {
        return true;
      }
    }
    return false;
  }

  buildFrameInput(playerId, frameId, fallbackInput) {
    const binding = this.getPlayerBinding(playerId);
    const previous = this.prevSnapshots[playerId] || {};
    const current = {
      frameId,
      playerId,
      left: this.isAnyKeyDown(binding.left) || this.getButtonState(playerId, 'left'),
      right: this.isAnyKeyDown(binding.right) || this.getButtonState(playerId, 'right'),
      jumpHold: this.isAnyKeyDown(binding.jump) || this.getButtonState(playerId, 'jump'),
      carryHold: this.isAnyKeyDown(binding.carry) || this.getButtonState(playerId, 'carry'),
      pullHold: this.isAnyKeyDown(binding.pull) || this.getButtonState(playerId, 'pull')
    };

    const snapshot = {
      frameId,
      playerId,
      left: current.left,
      right: current.right,
      jump: current.jumpHold && !previous.jumpHold,
      anchor: false,
      carry: current.carryHold && !previous.carryHold,
      throwAction: false,
      pull: current.pullHold
    };

    this.prevSnapshots[playerId] = current;

    if (fallbackInput) {
      return Object.assign({}, fallbackInput, snapshot);
    }

    return snapshot;
  }
}

module.exports = {
  InputManager
};
