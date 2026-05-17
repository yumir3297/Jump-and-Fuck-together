const { BALANCE_CONFIG } = require('../config/balanceConfig');
const { GAME_CONFIG } = require('../config/gameConfig');
const { distance, rectIntersects } = require('../utils/math');
const { deterministicRange } = require('../utils/random');

class CarryThrowSystem {
  constructor(playerManager, intimacySystem) {
    this.playerManager = playerManager;
    this.intimacySystem = intimacySystem;
  }

  update(frameId, feedback) {
    const players = this.playerManager.getPlayers();
    for (let i = 0; i < players.length; i += 1) {
      const player = players[i];
      if (!player.isAlive || player.carriedByPlayerId) {
        continue;
      }
      if (player.inputState.carry) {
        if (player.carryingPlayerId) {
          this.throwPlayer(player, frameId, feedback);
        } else {
          this.tryCarry(player, feedback);
        }
      }
    }
  }

  tryCarry(player, feedback) {
    const players = this.playerManager.getPlayers();
    let bestTarget = null;
    let bestDistance = GAME_CONFIG.player.pickupRange;

    for (let i = 0; i < players.length; i += 1) {
      const target = players[i];
      if (
        target.id === player.id ||
        !target.isAlive ||
        target.carriedByPlayerId ||
        target.carryingPlayerId ||
        target.anchorHeld
      ) {
        continue;
      }
      const gap = distance(player.position, target.position);
      if (gap < bestDistance) {
        bestDistance = gap;
        bestTarget = target;
      }
    }

    if (!bestTarget) {
      return false;
    }

    player.carryingPlayerId = bestTarget.id;
    bestTarget.carriedByPlayerId = player.id;
    bestTarget.state = 'carried';
    if (feedback) {
      feedback({
        type: 'stars',
        x: player.position.x,
        y: player.position.y - player.height - 12
      });
      feedback({
        type: 'dangerText',
        text: '抱起来啦',
        x: player.position.x,
        y: player.position.y - player.height - 26,
        color: '#ffb54a'
      });
    }
    return true;
  }

  throwPlayer(player, frameId, feedback) {
    const target = this.playerManager.getPlayer(player.carryingPlayerId);
    if (!target) {
      player.carryingPlayerId = null;
      return;
    }

    const sharedSkill = Math.min(1, (player.skillLevel + target.skillLevel) / 120);
    const randomnessFactor =
      1 - sharedSkill * BALANCE_CONFIG.throwing.skillReduceRandomnessFactor;
    const angleOffset = deterministicRange(
      frameId + player.index * 97 + target.index * 131,
      BALANCE_CONFIG.throwing.throwRandomAngleMin,
      BALANCE_CONFIG.throwing.throwRandomAngleMax
    ) * randomnessFactor;

    target.carriedByPlayerId = null;
    player.carryingPlayerId = null;
    target.position.x = player.position.x + player.facing * 24;
    target.position.y = player.position.y - 12;
    target.velocity.x =
      player.facing * (BALANCE_CONFIG.throwing.throwBaseVelocityX + Math.abs(angleOffset) * 0.02);
    target.velocity.y = BALANCE_CONFIG.throwing.throwBaseVelocityY + angleOffset * 0.08;
    target.canDoubleJump = true;
    target.state = 'thrown';
    target.throwRopeSlackMs = BALANCE_CONFIG.throwing.throwRopeSlackMs;
    target.thrownMeta = {
      fromPlayerId: player.id,
      frameId,
      startX: player.position.x,
      startY: player.position.y,
      resolved: false
    };

    if (feedback) {
      feedback({
        type: 'dangerText',
        text: '丢你上去！',
        x: target.position.x,
        y: target.position.y - target.height - 28,
        color: '#5ca4ff'
      });
    }
  }

  postUpdate(feedback) {
    const players = this.playerManager.getPlayers();
    for (let i = 0; i < players.length; i += 1) {
      const player = players[i];
      if (!player.thrownMeta || player.thrownMeta.resolved || !player.isAlive) {
        continue;
      }

      if (player.isGrounded && !player.wasGrounded) {
        this.handleLanding(player, feedback);
      }
    }
  }

  handleLanding(player, feedback) {
    const meta = player.thrownMeta;
    if (!meta) {
      return;
    }
    meta.resolved = true;
    player.throwRopeSlackMs = Math.max(player.throwRopeSlackMs, BALANCE_CONFIG.throwing.throwRopeSlackMs * 0.35);

    const carrier = this.playerManager.getPlayer(meta.fromPlayerId);
    const landingDistance = Math.abs(player.position.x - meta.startX);
    if (landingDistance >= BALANCE_CONFIG.throwing.successDistance) {
      this.intimacySystem.addSharedBond(
        BALANCE_CONFIG.intimacy.successfulThrow,
        'successful_throw',
        [player.id, meta.fromPlayerId]
      );
      player.successfulThrowCount += 1;
      if (carrier) {
        carrier.successfulThrowCount += 1;
      }
      if (feedback) {
        feedback({
          type: 'dangerText',
          text: '神之一抛 +5',
          x: player.position.x,
          y: player.position.y - player.height - 26,
          color: '#45b36b'
        });
      }
    }

    const playerRect = this.playerManager.getPlayerRect(player);
    const players = this.playerManager.getPlayers();
    for (let i = 0; i < players.length; i += 1) {
      const other = players[i];
      if (other.id === player.id || !other.isAlive) {
        continue;
      }
      const otherRect = this.playerManager.getPlayerRect(other);
      if (rectIntersects(playerRect, otherRect)) {
        other.velocity.x += player.facing * BALANCE_CONFIG.throwing.landingBounceForce;
        this.intimacySystem.addSharedBond(
          BALANCE_CONFIG.intimacy.friendlyFirePenalty,
          'friendly_fire',
          [player.id, other.id]
        );
        if (feedback) {
          feedback({
            type: 'dangerText',
            text: '误伤 -1',
            x: other.position.x,
            y: other.position.y - other.height - 24,
            color: '#ff8d5c'
          });
        }
      }
    }
  }
}

module.exports = {
  CarryThrowSystem
};
