const { clamp } = require('../utils/math');
const { getSystemInfo } = require('../utils/device');
const { GAME_CONFIG } = require('../config/gameConfig');

class Renderer {
  constructor(canvas, ctx) {
    this.canvas = canvas;
    this.ctx = ctx;
    this.camera = { x: 0, y: 0 };
    this.designWidth = GAME_CONFIG.designWidth;
    this.designHeight = GAME_CONFIG.designHeight;
    this.viewportWidth = this.designWidth;
    this.viewportHeight = this.designHeight;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.resize();
  }

  resize() {
    const info = getSystemInfo();
    const rawWidth = info.windowWidth || info.screenWidth || 1334;
    const rawHeight = info.windowHeight || info.screenHeight || 750;
    this.pixelRatio = info.pixelRatio || 1;
    this.viewportWidth = Math.max(rawWidth, rawHeight);
    this.viewportHeight = Math.min(rawWidth, rawHeight);
    this.width = this.designWidth;
    this.height = this.designHeight;
    this.scale = Math.min(this.viewportWidth / this.width, this.viewportHeight / this.height);
    this.offsetX = (this.viewportWidth - this.width * this.scale) * 0.5;
    this.offsetY = (this.viewportHeight - this.height * this.scale) * 0.5;
    this.canvas.width = this.viewportWidth * this.pixelRatio;
    this.canvas.height = this.viewportHeight * this.pixelRatio;
    this.applyStageTransform();
  }

  applyStageTransform() {
    this.ctx.setTransform(
      this.pixelRatio * this.scale,
      0,
      0,
      this.pixelRatio * this.scale,
      this.offsetX * this.pixelRatio,
      this.offsetY * this.pixelRatio
    );
  }

  resetToViewportTransform() {
    this.ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
  }

  setCamera(x, y) {
    this.camera.x = x;
    this.camera.y = y;
  }

  clear(fillStyle) {
    this.resetToViewportTransform();
    this.ctx.clearRect(0, 0, this.viewportWidth, this.viewportHeight);
    this.ctx.fillStyle = fillStyle;
    this.ctx.fillRect(0, 0, this.viewportWidth, this.viewportHeight);
    this.applyStageTransform();
    this.ctx.save();
    this.ctx.fillStyle = fillStyle;
    this.ctx.fillRect(0, 0, this.width, this.height);
    this.ctx.restore();
  }

  worldToScreen(point) {
    return {
      x: point.x - this.camera.x,
      y: point.y - this.camera.y
    };
  }

  drawRect(x, y, width, height, fillStyle, strokeStyle) {
    this.ctx.save();
    if (fillStyle) {
      this.ctx.fillStyle = fillStyle;
      this.ctx.fillRect(x, y, width, height);
    }
    if (strokeStyle) {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.strokeRect(x, y, width, height);
    }
    this.ctx.restore();
  }

  drawRoundRect(x, y, width, height, radius, fillStyle, strokeStyle, lineWidth) {
    const r = clamp(radius, 0, Math.min(width, height) * 0.5);
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + width - r, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    this.ctx.lineTo(x + width, y + height - r);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    this.ctx.lineTo(x + r, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
    if (fillStyle) {
      this.ctx.fillStyle = fillStyle;
      this.ctx.fill();
    }
    if (strokeStyle) {
      this.ctx.lineWidth = lineWidth || 2;
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawText(text, x, y, options) {
    const opts = options || {};
    this.ctx.save();
    this.ctx.font = opts.font || '20px sans-serif';
    this.ctx.textAlign = opts.align || 'left';
    this.ctx.textBaseline = opts.baseline || 'alphabetic';
    this.ctx.fillStyle = opts.color || '#000000';
    if (opts.shadowColor) {
      this.ctx.shadowColor = opts.shadowColor;
      this.ctx.shadowBlur = opts.shadowBlur || 0;
    }
    this.ctx.fillText(text, x, y);
    this.ctx.restore();
  }

  drawCircle(x, y, radius, fillStyle, strokeStyle, lineWidth) {
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.arc(x, y, radius, 0, Math.PI * 2);
    if (fillStyle) {
      this.ctx.fillStyle = fillStyle;
      this.ctx.fill();
    }
    if (strokeStyle) {
      this.ctx.strokeStyle = strokeStyle;
      this.ctx.lineWidth = lineWidth || 2;
      this.ctx.stroke();
    }
    this.ctx.restore();
  }

  drawLine(x1, y1, x2, y2, options) {
    const opts = options || {};
    this.ctx.save();
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.lineWidth = opts.lineWidth || 2;
    this.ctx.strokeStyle = opts.color || '#000000';
    this.ctx.globalAlpha = opts.alpha == null ? 1 : opts.alpha;
    this.ctx.stroke();
    this.ctx.restore();
  }

  screenToCanvas(point) {
    return {
      x: (point.x - this.offsetX) / this.scale,
      y: (point.y - this.offsetY) / this.scale
    };
  }

  normalizeTouchEvent(event) {
    const normalizeList = (list) => {
      const source = list || [];
      const normalized = [];
      for (let i = 0; i < source.length; i += 1) {
        const item = source[i];
        const point = this.screenToCanvas({
          x: item.clientX,
          y: item.clientY
        });
        normalized.push(
          Object.assign({}, item, {
            clientX: point.x,
            clientY: point.y
          })
        );
      }
      return normalized;
    };

    return {
      touches: normalizeList(event.touches),
      changedTouches: normalizeList(event.changedTouches)
    };
  }
}

module.exports = {
  Renderer
};
