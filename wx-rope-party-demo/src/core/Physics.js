const { approach, clamp } = require('../utils/math');

function applyPlayerIntent(player, input, config) {
  const world = config.world;
  const targetSpeed = input.left ? -world.moveSpeed : input.right ? world.moveSpeed : 0;
  const moveSpeed = player.anchorHeld ? world.anchorMoveSpeed : player.isGrounded ? world.moveSpeed : world.airMoveSpeed;

  if (input.left || input.right) {
    player.velocity.x = approach(player.velocity.x, targetSpeed, player.isGrounded ? 1.1 : 0.65);
    player.facing = input.left ? -1 : 1;
    player.state = player.isGrounded ? 'run' : 'air';
  } else if (player.isGrounded) {
    player.velocity.x *= world.friction;
    if (Math.abs(player.velocity.x) < 0.05) {
      player.velocity.x = 0;
      player.state = player.anchorHeld ? 'anchor' : 'idle';
    }
  } else {
    player.velocity.x = clamp(player.velocity.x, -moveSpeed, moveSpeed);
    player.velocity.x *= world.airFriction;
  }

  if (input.anchor) {
    player.anchorHeld = true;
    player.state = 'anchor';
    player.velocity.x *= 0.7;
  } else {
    player.anchorHeld = false;
  }

  if (input.jumpBuffered > 0) {
    if (player.isGrounded || player.coyoteFramesLeft > 0) {
      player.velocity.y = world.jumpVelocity;
      player.isGrounded = false;
      player.state = 'jump';
      player.jumpConsumed = true;
      player.jumpBufferFramesLeft = 0;
      player.coyoteFramesLeft = 0;
    } else if (player.canDoubleJump) {
      player.velocity.y = world.doubleJumpVelocity;
      player.canDoubleJump = false;
      player.state = 'double-jump';
      player.jumpBufferFramesLeft = 0;
    }
  }

  if (!player.isGrounded) {
    player.velocity.y = clamp(player.velocity.y + world.gravity, -20, world.maxFallSpeed);
  }
}

module.exports = {
  applyPlayerIntent
};
