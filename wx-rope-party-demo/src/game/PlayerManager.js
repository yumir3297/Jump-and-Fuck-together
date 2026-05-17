const { GAME_CONFIG } = require('../config/gameConfig');
const { applyPlayerIntent } = require('../core/Physics');
const { getEntityRect, resolveEntityVsSolids } = require('../core/Collision');
const { clamp, distance, lerp } = require('../utils/math');
const { Player } = require('./Player');

class PlayerManager {
  constructor(playerProfiles) {
    this.playerProfiles = playerProfiles;
    this.players = [];
  }

  configurePlayers(playerCount, spawnPoints) {
    this.players = [];
    for (let i = 0; i < playerCount; i += 1) {
      const profile = this.playerProfiles[i];
      const spawn = spawnPoints[i] || spawnPoints[0];
      const player = new Player(profile, spawn, i);
      player.width = GAME_CONFIG.player.width;
      player.height = GAME_CONFIG.player.height;
      this.players.push(player);
    }
    return this.players;
  }

  resetForLevel(level) {
    for (let i = 0; i < this.players.length; i += 1) {
      const spawn = level.spawnPoints[i] || level.spawnPoints[0];
      this.players[i].reset(spawn);
      this.players[i].width = GAME_CONFIG.player.width;
      this.players[i].height = GAME_CONFIG.player.height;
    }
  }

  getPlayers() {
    return this.players;
  }

  getPlayer(playerId) {
    for (let i = 0; i < this.players.length; i += 1) {
      if (this.players[i].id === playerId) {
        return this.players[i];
      }
    }
    return null;
  }

  setFrameInputs(frameInputs) {
    const inputMap = {};
    for (let i = 0; i < frameInputs.length; i += 1) {
      inputMap[frameInputs[i].playerId] = frameInputs[i];
    }

    for (let i = 0; i < this.players.length; i += 1) {
      const player = this.players[i];
      const input = inputMap[player.id] || {
        left: false,
        right: false,
        jump: false,
        anchor: false,
        carry: false,
        throwAction: false,
        pull: false
      };
      player.inputState = input;
      if (input.jump) {
        player.jumpBufferFramesLeft = GAME_CONFIG.player.jumpBufferFrames;
      } else if (player.jumpBufferFramesLeft > 0) {
        player.jumpBufferFramesLeft -= 1;
      }
    }
  }

  updatePlayers(solids) {
    for (let i = 0; i < this.players.length; i += 1) {
      const player = this.players[i];
      player.wasGrounded = player.isGrounded;

      if (!player.isAlive) {
        player.velocity.x = 0;
        player.velocity.y = 0;
        player.state = 'dead';
        continue;
      }

      if (player.invulnerableMs > 0) {
        player.invulnerableMs = Math.max(0, player.invulnerableMs - GAME_CONFIG.fixedDeltaMs);
      }

      if (player.throwRopeSlackMs > 0) {
        player.throwRopeSlackMs = Math.max(0, player.throwRopeSlackMs - GAME_CONFIG.fixedDeltaMs);
      }

      if (player.carriedByPlayerId) {
        player.velocity.x = 0;
        player.velocity.y = 0;
        player.state = 'carried';
        continue;
      }

      if (player.isGrounded) {
        player.coyoteFramesLeft = GAME_CONFIG.player.coyoteFrames;
        player.canDoubleJump = true;
      } else if (player.coyoteFramesLeft > 0) {
        player.coyoteFramesLeft -= 1;
      }

      if (player.carryingPlayerId) {
        player.velocity.x *= 0.96;
      }

      const previous = { x: player.position.x, y: player.position.y };
      applyPlayerIntent(
        player,
        {
          left: player.inputState.left,
          right: player.inputState.right,
          anchor: player.inputState.anchor,
          jumpBuffered: player.jumpBufferFramesLeft
        },
        GAME_CONFIG
      );
      resolveEntityVsSolids(player, solids, previous);

      if (player.isGrounded && Math.abs(player.velocity.x) > 0.1) {
        player.state = player.anchorHeld ? 'anchor' : 'run';
      } else if (player.isGrounded) {
        player.state = player.anchorHeld ? 'anchor' : 'idle';
      } else if (player.velocity.y < 0) {
        player.state = 'jump';
      } else {
        player.state = 'fall';
      }
    }
  }

  syncCarriedPlayers() {
    for (let i = 0; i < this.players.length; i += 1) {
      const carrier = this.players[i];
      if (!carrier.carryingPlayerId) {
        continue;
      }
      const carried = this.getPlayer(carrier.carryingPlayerId);
      if (!carried || !carried.isAlive) {
        carrier.carryingPlayerId = null;
        continue;
      }
      carried.position.x = carrier.position.x + carrier.facing * 22;
      carried.position.y = carrier.position.y - carrier.height * 0.55;
      carried.velocity.x = carrier.velocity.x;
      carried.velocity.y = carrier.velocity.y;
      carried.state = 'carried';
      carried.isGrounded = false;
    }
  }

  capturePositions() {
    const snapshot = {};
    for (let i = 0; i < this.players.length; i += 1) {
      snapshot[this.players[i].id] = {
        x: this.players[i].position.x,
        y: this.players[i].position.y
      };
    }
    return snapshot;
  }

  resolveExternalMotion(solids, previousPositions) {
    for (let i = 0; i < this.players.length; i += 1) {
      const player = this.players[i];
      if (!player.isAlive || player.carriedByPlayerId) {
        continue;
      }
      const previous =
        previousPositions && previousPositions[player.id]
          ? previousPositions[player.id]
          : {
              x: player.position.x,
              y: player.position.y
            };
      resolveEntityVsSolids(player, solids, previous, { skipVelocity: true });
    }
  }

  revivePlayers(playerIds, spawnPoint) {
    const ids = {};
    for (let i = 0; i < playerIds.length; i += 1) {
      ids[playerIds[i]] = true;
    }

    let offset = -18 * (playerIds.length - 1) * 0.5;
    for (let i = 0; i < this.players.length; i += 1) {
      const player = this.players[i];
      if (!ids[player.id]) {
        continue;
      }
      player.isAlive = true;
      player.position.x = spawnPoint.x + offset;
      player.position.y = spawnPoint.y;
      player.velocity.x = 0;
      player.velocity.y = 0;
      player.isGrounded = true;
      player.canDoubleJump = true;
      player.anchorHeld = false;
      player.carryingPlayerId = null;
      player.carriedByPlayerId = null;
      player.pendingRopeDeath = false;
      player.inPit = false;
      player.invulnerableMs = 800;
      player.throwRopeSlackMs = 0;
      player.state = 'revive';
      offset += 36;
    }
  }

  releasePlayer(playerId) {
    const player = this.getPlayer(playerId);
    if (!player) {
      return;
    }
    if (player.carriedByPlayerId) {
      const carrier = this.getPlayer(player.carriedByPlayerId);
      if (carrier) {
        carrier.carryingPlayerId = null;
      }
    }
    if (player.carryingPlayerId) {
      const carried = this.getPlayer(player.carryingPlayerId);
      if (carried) {
        carried.carriedByPlayerId = null;
      }
      player.carryingPlayerId = null;
    }
    player.carriedByPlayerId = null;
  }

  getAveragePosition() {
    let count = 0;
    let x = 0;
    let y = 0;
    for (let i = 0; i < this.players.length; i += 1) {
      const player = this.players[i];
      if (!player.isAlive) {
        continue;
      }
      count += 1;
      x += player.position.x;
      y += player.position.y;
    }
    if (!count) {
      return { x: 0, y: 0 };
    }
    return { x: x / count, y: y / count };
  }

  getLeadPlayerX() {
    let lead = 0;
    for (let i = 0; i < this.players.length; i += 1) {
      lead = Math.max(lead, this.players[i].position.x);
    }
    return lead;
  }

  getTrailPlayerX() {
    let trail = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < this.players.length; i += 1) {
      if (!this.players[i].isAlive) {
        continue;
      }
      trail = Math.min(trail, this.players[i].position.x);
    }
    return trail === Number.MAX_SAFE_INTEGER ? 0 : trail;
  }

  allDead() {
    for (let i = 0; i < this.players.length; i += 1) {
      if (this.players[i].isAlive) {
        return false;
      }
    }
    return true;
  }

  allPlayersNearX(targetX, tolerance) {
    for (let i = 0; i < this.players.length; i += 1) {
      const player = this.players[i];
      if (!player.isAlive) {
        return false;
      }
      if (Math.abs(player.position.x - targetX) > tolerance) {
        return false;
      }
    }
    return true;
  }

  render(renderer, timeMs) {
    for (let i = 0; i < this.players.length; i += 1) {
      const player = this.players[i];
      const blink = player.invulnerableMs > 0 && Math.floor(timeMs / 120) % 2 === 0;
      if (!player.isAlive || blink) {
        if (!player.isAlive) {
          const ghost = renderer.worldToScreen({
            x: player.position.x,
            y: player.position.y - player.height * 0.5
          });
          renderer.drawCircle(ghost.x, ghost.y, 14, 'rgba(255,255,255,0.35)', '#6e5a49', 2);
          renderer.drawText('等救援', ghost.x, ghost.y - 28, {
            align: 'center',
            font: '16px sans-serif',
            color: '#6b4e3a'
          });
        }
        continue;
      }

      const feet = renderer.worldToScreen(player.position);
      renderer.drawRoundRect(
        feet.x - player.width * 0.5,
        feet.y - player.height,
        player.width,
        player.height,
        10,
        player.color,
        '#4f3a28',
        2
      );
      renderer.drawCircle(feet.x, feet.y - player.height - 10, 9, player.accent, '#4f3a28', 2);

      if (player.anchorHeld) {
        renderer.drawCircle(feet.x, feet.y + 4, 10, 'rgba(255, 197, 97, 0.35)', '#ffbb58', 2);
      }

      if (player.carryingPlayerId) {
        renderer.drawText('抱', feet.x + 18, feet.y - player.height - 18, {
          font: '16px sans-serif',
          color: '#ffb54a'
        });
      }

      renderer.drawText(player.name, feet.x, feet.y - player.height - 28, {
        align: 'center',
        font: '15px sans-serif',
        color: '#3d2a1f',
        shadowColor: 'rgba(255,255,255,0.8)',
        shadowBlur: 4
      });
    }
  }

  getNearestTeammate(player) {
    let nearest = null;
    let bestDistance = Number.MAX_SAFE_INTEGER;
    for (let i = 0; i < this.players.length; i += 1) {
      const other = this.players[i];
      if (other.id === player.id || !other.isAlive) {
        continue;
      }
      const dist = distance(player.position, other.position);
      if (dist < bestDistance) {
        bestDistance = dist;
        nearest = other;
      }
    }
    return nearest;
  }

  getPlayerRect(player) {
    return getEntityRect(player);
  }

  updateCamera(renderer, levelWidth) {
    const average = this.getAveragePosition();
    const targetX = clamp(average.x - renderer.width * 0.35, 0, Math.max(0, levelWidth - renderer.width));
    const targetY = 0;
    renderer.setCamera(lerp(renderer.camera.x, targetX, GAME_CONFIG.world.cameraLerp), targetY);
  }
}

module.exports = {
  PlayerManager
};
