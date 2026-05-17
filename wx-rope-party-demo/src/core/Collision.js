const { rectIntersects } = require('../utils/math');

function getEntityRect(entity) {
  return {
    x: entity.position.x - entity.width * 0.5,
    y: entity.position.y - entity.height,
    width: entity.width,
    height: entity.height
  };
}

function getRectBottom(rect) {
  return rect.y + rect.height;
}

function getRectRight(rect) {
  return rect.x + rect.width;
}

function resolveFallbackOverlap(entity, solid) {
  const rect = getEntityRect(entity);
  const overlapLeft = getRectRight(rect) - solid.x;
  const overlapRight = getRectRight(solid) - rect.x;
  const overlapTop = getRectBottom(rect) - solid.y;
  const overlapBottom = getRectBottom(solid) - rect.y;
  const smallest = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);

  if (smallest === overlapTop) {
    entity.position.y = solid.y;
    entity.velocity.y = 0;
    entity.isGrounded = true;
    entity.canDoubleJump = true;
    return;
  }

  if (smallest === overlapBottom) {
    entity.position.y = getRectBottom(solid) + entity.height;
    entity.velocity.y = 0;
    return;
  }

  if (smallest === overlapLeft) {
    entity.position.x = solid.x - entity.width * 0.5;
    entity.velocity.x = 0;
    return;
  }

  entity.position.x = getRectRight(solid) + entity.width * 0.5;
  entity.velocity.x = 0;
}

function resolveEntityVsSolids(entity, solids, previousPosition, options) {
  const opts = options || {};
  const skipVelocity = !!opts.skipVelocity;
  entity.isGrounded = false;

  if (!skipVelocity) {
    entity.position.x += entity.velocity.x;
  }
  let rect = getEntityRect(entity);
  const prevRectX = {
    x: previousPosition.x - entity.width * 0.5,
    y: previousPosition.y - entity.height,
    width: entity.width,
    height: entity.height
  };

  for (let i = 0; i < solids.length; i += 1) {
    const solid = solids[i];
    if (!rectIntersects(rect, solid)) {
      continue;
    }
    let resolved = false;
    if (getRectRight(prevRectX) <= solid.x) {
      entity.position.x = solid.x - entity.width * 0.5;
      resolved = true;
    } else if (prevRectX.x >= getRectRight(solid)) {
      entity.position.x = getRectRight(solid) + entity.width * 0.5;
      resolved = true;
    }
    if (resolved) {
      entity.velocity.x = 0;
      rect = getEntityRect(entity);
    }
  }

  if (!skipVelocity) {
    entity.position.y += entity.velocity.y;
  }
  rect = getEntityRect(entity);
  const prevRectY = {
    x: entity.position.x - entity.width * 0.5,
    y: previousPosition.y - entity.height,
    width: entity.width,
    height: entity.height
  };

  for (let i = 0; i < solids.length; i += 1) {
    const solid = solids[i];
    if (!rectIntersects(rect, solid)) {
      continue;
    }
    let resolved = false;
    if (getRectBottom(prevRectY) <= solid.y) {
      entity.position.y = solid.y;
      entity.isGrounded = true;
      entity.canDoubleJump = true;
      entity.velocity.y = 0;
      resolved = true;
    } else if (prevRectY.y >= getRectBottom(solid)) {
      entity.position.y = getRectBottom(solid) + entity.height;
      entity.velocity.y = 0;
      resolved = true;
    }
    if (!resolved) {
      resolveFallbackOverlap(entity, solid);
    }
    rect = getEntityRect(entity);
  }
}

module.exports = {
  getEntityRect,
  resolveEntityVsSolids
};
