const { BALANCE_CONFIG } = require('../config/balanceConfig');
const { distance, normalize } = require('../utils/math');

class RopeSystem {
  constructor() {
    this.links = [];
    this.linkStates = {};
  }

  reset() {
    this.links = [];
    this.linkStates = {};
  }

  getLinkState(linkId, defaultLength) {
    if (!this.linkStates[linkId]) {
      this.linkStates[linkId] = {
        targetLength: defaultLength
      };
    }
    return this.linkStates[linkId];
  }

  update(players, deltaMs, feedback) {
    this.links = [];
    const ropeConfig = BALANCE_CONFIG.rope;
    const throwAssist = BALANCE_CONFIG.ropeThrowAssist;
    const deltaSec = deltaMs / 1000;
    const activeLinkIds = {};

    for (let i = 0; i < players.length - 1; i += 1) {
      const left = players[i];
      const right = players[i + 1];
      if (!left || !right || !left.isAlive || !right.isAlive) {
        continue;
      }

      const linkId = left.id + ':' + right.id;
      const linkState = this.getLinkState(linkId, ropeConfig.ropeMaxLength);
      activeLinkIds[linkId] = true;
      const leftIsPulling = !!left.inputState.pull;
      const rightIsPulling = !!right.inputState.pull;
      const isPulling = leftIsPulling || rightIsPulling;
      const hasThrownSlack = left.throwRopeSlackMs > 0 || right.throwRopeSlackMs > 0;
      const effectiveMaxLength =
        ropeConfig.ropeMaxLength + (hasThrownSlack ? throwAssist.thrownSlackLengthBonus : 0);
      const minTargetLength = ropeConfig.ropeMaxLength * ropeConfig.pullMinLengthRatio;
      if (isPulling) {
        linkState.targetLength = Math.max(
          minTargetLength,
          linkState.targetLength - ropeConfig.pullShortenSpeed * deltaSec
        );
      } else {
        linkState.targetLength = Math.min(
          ropeConfig.ropeMaxLength,
          linkState.targetLength + ropeConfig.pullRecoverSpeed * deltaSec
        );
      }

      const pointA = { x: left.position.x, y: left.position.y - left.height * 0.7 };
      const pointB = { x: right.position.x, y: right.position.y - right.height * 0.7 };
      const ropeDistance = distance(pointA, pointB);
      const targetLength = Math.min(
        effectiveMaxLength,
        linkState.targetLength + (hasThrownSlack ? throwAssist.thrownSlackLengthBonus : 0)
      );
      const stretchRatio = ropeDistance / effectiveMaxLength;
      const tautDistance = Math.max(0, ropeDistance - targetLength);
      const ropeInfo = {
        fromId: left.id,
        toId: right.id,
        from: pointA,
        to: pointB,
        distance: ropeDistance,
        targetLength,
        stretchRatio,
        targetRatio: targetLength / effectiveMaxLength,
        tautRatio: tautDistance / effectiveMaxLength,
        isPulling,
        hasThrownSlack,
        isDanger: false
      };

      if (stretchRatio > ropeConfig.dangerStretchRatio) {
        ropeInfo.isDanger = true;
      }

      if (tautDistance > 0.01) {
        const dir = normalize(pointB.x - pointA.x, pointB.y - pointA.y);
        const boost = isPulling ? ropeConfig.pullButtonBoost : 1;
        const springMultiplier = isPulling ? ropeConfig.pullSpringMultiplier : 1;
        const relativeVelocityAlongRope =
          (right.velocity.x - left.velocity.x) * dir.x +
          (right.velocity.y - left.velocity.y) * dir.y;
        const springForce =
          tautDistance *
          ropeConfig.ropeElasticity *
          ropeConfig.ropePullForce *
          boost *
          springMultiplier;
        const dampingForce = relativeVelocityAlongRope * ropeConfig.ropeDamping;
        const throwForceMultiplier = hasThrownSlack ? throwAssist.thrownPullForceMultiplier : 1;
        const pullStrength = Math.max(0, springForce + dampingForce);
        const positionCorrection = pullStrength * (isPulling ? 0.42 : 0.3) * throwForceMultiplier;
        const velocityCorrection = pullStrength * (isPulling ? 0.25 : 0.18) * throwForceMultiplier;
        const leftActsAsFixed = left.anchorHeld || (leftIsPulling && !rightIsPulling);
        const rightActsAsFixed = right.anchorHeld || (rightIsPulling && !leftIsPulling);

        if (leftActsAsFixed && !rightActsAsFixed) {
          right.position.x -= dir.x * positionCorrection * ropeConfig.anchorPullMultiplier;
          right.position.y -= dir.y * positionCorrection * ropeConfig.anchorPullMultiplier;
          right.velocity.x -= dir.x * velocityCorrection * ropeConfig.anchorPullMultiplier;
          right.velocity.y -= dir.y * velocityCorrection * 0.45;
          this.applyActivePullAssist(right, dir, tautDistance, throwForceMultiplier);
        } else if (!leftActsAsFixed && rightActsAsFixed) {
          left.position.x += dir.x * positionCorrection * ropeConfig.anchorPullMultiplier;
          left.position.y += dir.y * positionCorrection * ropeConfig.anchorPullMultiplier;
          left.velocity.x += dir.x * velocityCorrection * ropeConfig.anchorPullMultiplier;
          left.velocity.y += dir.y * velocityCorrection * 0.45;
          this.applyActivePullAssist(left, { x: -dir.x, y: -dir.y }, tautDistance, throwForceMultiplier);
        } else if (leftActsAsFixed && rightActsAsFixed) {
          // 两边都在主动收绳时，不直接平移角色，避免主动方被反向拖动。
          left.velocity.x *= 0.98;
          right.velocity.x *= 0.98;
        } else {
          left.position.x += dir.x * positionCorrection * 0.5;
          left.position.y += dir.y * positionCorrection * 0.26;
          right.position.x -= dir.x * positionCorrection * 0.5;
          right.position.y -= dir.y * positionCorrection * 0.26;
          left.velocity.x += dir.x * velocityCorrection * 0.5;
          left.velocity.y += dir.y * velocityCorrection * 0.12;
          right.velocity.x -= dir.x * velocityCorrection * 0.5;
          right.velocity.y -= dir.y * velocityCorrection * 0.12;
        }
      }

      this.applyPitRescue(left, right, deltaMs, feedback);
      this.applyPitRescue(right, left, deltaMs, feedback);
      this.links.push(ropeInfo);
    }

    const knownLinkIds = Object.keys(this.linkStates);
    for (let i = 0; i < knownLinkIds.length; i += 1) {
      if (!activeLinkIds[knownLinkIds[i]]) {
        delete this.linkStates[knownLinkIds[i]];
      }
    }
  }

  applyActivePullAssist(targetPlayer, directionToPuller, tautDistance, throwForceMultiplier) {
    const ropeConfig = BALANCE_CONFIG.rope;
    const terrainBonus = targetPlayer.inPit ? ropeConfig.pitPullBonus : 1;
    const airBonus = !targetPlayer.isGrounded ? ropeConfig.airPullBonus : 1;
    const winchForce =
      (ropeConfig.activePullWinchForce + tautDistance * 0.02) *
      terrainBonus *
      airBonus *
      throwForceMultiplier;
    targetPlayer.position.x += directionToPuller.x * winchForce;
    targetPlayer.position.y += directionToPuller.y * winchForce * 0.35;
    targetPlayer.velocity.x += directionToPuller.x * winchForce * 0.32;
    targetPlayer.velocity.y += directionToPuller.y * winchForce * 0.12;
  }

  applyPitRescue(endangered, partner, deltaMs, feedback) {
    const ropeConfig = BALANCE_CONFIG.rope;
    if (!endangered.inPit || !endangered.isAlive || !partner.isAlive) {
      if (endangered.ropeDangerMs > 0 && !endangered.inPit) {
        endangered.ropeDangerMs = 0;
      }
      if (endangered.inPit === false) {
        endangered.pendingRopeDeath = false;
      }
      return;
    }

    if (partner.anchorHeld || partner.isGrounded) {
      endangered.velocity.y -= ropeConfig.rescuePullUpForce;
      endangered.velocity.x += (partner.position.x - endangered.position.x) * 0.0008;
      endangered.ropeDangerMs += deltaMs;
      if (endangered.ropeDangerMs >= ropeConfig.breakOrDeathDelayMs) {
        endangered.pendingRopeDeath = true;
      }
    } else {
      endangered.ropeDangerMs += deltaMs * 0.7;
      if (endangered.ropeDangerMs >= ropeConfig.breakOrDeathDelayMs) {
        endangered.pendingRopeDeath = true;
      }
    }

    if (endangered.pendingRopeDeath && feedback) {
      feedback({
        type: 'dangerText',
        text: '绳子快撑不住了！',
        x: endangered.position.x,
        y: endangered.position.y - endangered.height - 30,
        color: '#ff5f7f'
      });
    }
  }

  onRescued(player) {
    player.pendingRopeDeath = false;
    player.ropeDangerMs = 0;
  }

  render(renderer, timeMs) {
    for (let i = 0; i < this.links.length; i += 1) {
      const link = this.links[i];
      const from = renderer.worldToScreen(link.from);
      const to = renderer.worldToScreen(link.to);
      let color = '#8f724e';
      let width = 3;
      if (link.stretchRatio > BALANCE_CONFIG.rope.dangerStretchRatio) {
        const flash = Math.floor(timeMs / 140) % 2 === 0;
        color = flash ? '#ff5f7f' : '#ffd45d';
        width = 6;
      } else if (link.isPulling && link.tautRatio > 0.02) {
        color = '#61a9ff';
        width = 5;
      } else if (link.stretchRatio > 1) {
        color = '#f7b955';
        width = 5;
      }
      renderer.drawLine(from.x, from.y, to.x, to.y, {
        color,
        lineWidth: width
      });
    }
  }
}

module.exports = {
  RopeSystem
};
