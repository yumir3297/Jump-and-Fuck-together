const { BALANCE_CONFIG } = require('../config/balanceConfig');
const { rectIntersects } = require('../utils/math');

class ObstacleSystem {
  constructor() {
    this.level = null;
    this.obstacles = [];
  }

  loadLevel(level) {
    this.level = level;
    this.obstacles = JSON.parse(JSON.stringify(level.obstacles || []));
    for (let i = 0; i < this.obstacles.length; i += 1) {
      const obstacle = this.obstacles[i];
      obstacle.baseX = obstacle.x;
      obstacle.baseY = obstacle.y;
      obstacle.elapsedMs = 0;
      obstacle.deltaX = 0;
      obstacle.deltaY = 0;
      obstacle.active = obstacle.type !== 'SuddenMonster';
      obstacle.cooldownMs = 0;
      obstacle.visibleMs = 0;
    }
  }

  update(deltaMs, players) {
    for (let i = 0; i < this.obstacles.length; i += 1) {
      const obstacle = this.obstacles[i];
      obstacle.elapsedMs += deltaMs;
      obstacle.deltaX = 0;
      obstacle.deltaY = 0;

      if (obstacle.type === 'MovingPlatform' || obstacle.type === 'MovingMonster') {
        const previousX = obstacle.x;
        const previousY = obstacle.y;
        const axis = obstacle.axis || 'x';
        const wave = Math.sin((obstacle.elapsedMs / 1000) * obstacle.speed);
        if (axis === 'x') {
          obstacle.x = obstacle.baseX + wave * obstacle.range;
        } else {
          obstacle.y = obstacle.baseY + wave * obstacle.range;
        }
        obstacle.deltaX = obstacle.x - previousX;
        obstacle.deltaY = obstacle.y - previousY;
      }

      if (obstacle.type === 'SuddenMonster') {
        if (!obstacle.active && obstacle.cooldownMs > 0) {
          obstacle.cooldownMs = Math.max(0, obstacle.cooldownMs - deltaMs);
        }
        if (!obstacle.active) {
          for (let j = 0; j < players.length; j += 1) {
            if (players[j].position.x >= obstacle.triggerX && obstacle.cooldownMs <= 0) {
              obstacle.active = true;
              obstacle.visibleMs = BALANCE_CONFIG.obstacle.suddenMonsterShowMs;
              break;
            }
          }
        } else {
          obstacle.visibleMs -= deltaMs;
          if (obstacle.visibleMs <= 0) {
            obstacle.active = false;
            obstacle.cooldownMs = BALANCE_CONFIG.obstacle.suddenMonsterCooldownMs;
          }
        }
      }
    }
  }

  getSolidRects() {
    const solids = JSON.parse(JSON.stringify(this.level.solids || []));
    for (let i = 0; i < this.obstacles.length; i += 1) {
      const obstacle = this.obstacles[i];
      if (
        obstacle.type === 'LowBarrier' ||
        obstacle.type === 'HighBarrier' ||
        obstacle.type === 'MovingPlatform'
      ) {
        solids.push({
          id: obstacle.id,
          x: obstacle.x,
          y: obstacle.y,
          width: obstacle.width,
          height: obstacle.height
        });
      }
    }
    return solids;
  }

  applyPlatformCarry(players) {
    for (let i = 0; i < this.obstacles.length; i += 1) {
      const obstacle = this.obstacles[i];
      if (obstacle.type !== 'MovingPlatform') {
        continue;
      }
      for (let j = 0; j < players.length; j += 1) {
        const player = players[j];
        if (!player.isAlive || !player.isGrounded || player.carriedByPlayerId) {
          continue;
        }
        const feetX = player.position.x;
        const feetY = player.position.y;
        const onTop =
          feetX >= obstacle.x - 6 &&
          feetX <= obstacle.x + obstacle.width + 6 &&
          Math.abs(feetY - obstacle.y) <= 4;
        if (onTop) {
          player.position.x += obstacle.deltaX * BALANCE_CONFIG.obstacle.movingPlatformCarryStrength;
          player.position.y += obstacle.deltaY * BALANCE_CONFIG.obstacle.movingPlatformCarryStrength;
        }
      }
    }
  }

  checkHazards(player) {
    player.inPit = false;
    player.pitY = 0;
    if (!player.isAlive) {
      return null;
    }

    const rect = {
      x: player.position.x - player.width * 0.5,
      y: player.position.y - player.height,
      width: player.width,
      height: player.height
    };

    for (let i = 0; i < this.obstacles.length; i += 1) {
      const obstacle = this.obstacles[i];
      if (obstacle.type === 'SmallPit' || obstacle.type === 'DeepPit') {
        const overPit =
          player.position.x >= obstacle.x &&
          player.position.x <= obstacle.x + obstacle.width &&
          player.position.y >= obstacle.y - 12;
        if (overPit) {
          const deepPitDanger =
            obstacle.type === 'DeepPit' &&
            (!player.isGrounded || player.position.y > obstacle.y + 72);
          player.inPit = deepPitDanger;
          player.pitY = obstacle.y;
          if (player.position.y > obstacle.y + (obstacle.type === 'DeepPit' ? 150 : 90)) {
            return { reason: obstacle.type };
          }
        }
      }

      if (
        obstacle.type === 'StaticMonster' ||
        obstacle.type === 'MovingMonster' ||
        (obstacle.type === 'SuddenMonster' && obstacle.active)
      ) {
        const monsterRect = {
          x: obstacle.x,
          y: obstacle.y,
          width: obstacle.width,
          height: obstacle.height
        };
        if (rectIntersects(rect, monsterRect)) {
          return { reason: obstacle.type };
        }
      }
    }

    return null;
  }

  getFinishDoor() {
    for (let i = 0; i < this.obstacles.length; i += 1) {
      if (this.obstacles[i].type === 'FinishDoor') {
        return this.obstacles[i];
      }
    }
    return null;
  }

  render(renderer) {
    const ctx = renderer.ctx;
    for (let i = 0; i < this.obstacles.length; i += 1) {
      const obstacle = this.obstacles[i];
      const screen = renderer.worldToScreen({ x: obstacle.x, y: obstacle.y });
      if (obstacle.type === 'SmallPit' || obstacle.type === 'DeepPit') {
        ctx.save();
        ctx.fillStyle = obstacle.type === 'DeepPit' ? '#755641' : '#987457';
        ctx.fillRect(screen.x, screen.y, obstacle.width, obstacle.height);
        ctx.strokeStyle = '#3e2a21';
        ctx.lineWidth = 2;
        ctx.strokeRect(screen.x, screen.y, obstacle.width, obstacle.height);
        ctx.restore();
      }
    }

    for (let i = 0; i < (this.level.solids || []).length; i += 1) {
      const solid = this.level.solids[i];
      const screen = renderer.worldToScreen({ x: solid.x, y: solid.y });
      renderer.drawRoundRect(
        screen.x,
        screen.y,
        solid.width,
        solid.height,
        10,
        solid.color || '#c7b088',
        '#826445',
        2
      );
    }

    for (let i = 0; i < this.obstacles.length; i += 1) {
      const obstacle = this.obstacles[i];
      const screen = renderer.worldToScreen({ x: obstacle.x, y: obstacle.y });
      if (obstacle.type === 'LowBarrier' || obstacle.type === 'HighBarrier') {
        renderer.drawRoundRect(
          screen.x,
          screen.y,
          obstacle.width,
          obstacle.height,
          8,
          obstacle.type === 'HighBarrier' ? '#9b6f49' : '#b5885e',
          '#5f4631',
          2
        );
      } else if (obstacle.type === 'MovingPlatform') {
        renderer.drawRoundRect(screen.x, screen.y, obstacle.width, obstacle.height, 8, '#7f6edb', '#4a3d8c', 2);
      } else if (obstacle.type === 'StaticMonster' || obstacle.type === 'MovingMonster') {
        renderer.drawRoundRect(screen.x, screen.y, obstacle.width, obstacle.height, 12, '#ef6b6b', '#5e1d1d', 2);
        renderer.drawText('!', screen.x + obstacle.width * 0.5, screen.y + 8, {
          align: 'center',
          font: '22px sans-serif',
          color: '#ffffff'
        });
      } else if (obstacle.type === 'SuddenMonster' && obstacle.active) {
        renderer.drawRoundRect(screen.x, screen.y, obstacle.width, obstacle.height, 12, '#ff4d7d', '#65172c', 2);
        renderer.drawText('啪', screen.x + obstacle.width * 0.5, screen.y + 8, {
          align: 'center',
          font: '20px sans-serif',
          color: '#ffffff'
        });
      } else if (obstacle.type === 'FinishDoor') {
        renderer.drawRoundRect(screen.x, screen.y, obstacle.width, obstacle.height, 14, '#9dd897', '#446e42', 3);
        renderer.drawText('终点', screen.x + obstacle.width * 0.5, screen.y + 52, {
          align: 'center',
          font: '18px sans-serif',
          color: '#244522'
        });
      }
    }
  }
}

module.exports = {
  ObstacleSystem
};
