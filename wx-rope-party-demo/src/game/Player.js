class Player {
  constructor(profile, spawnPoint, index) {
    this.id = profile.id;
    this.name = profile.name;
    this.color = profile.color;
    this.accent = profile.accent;
    this.index = index;
    this.width = 28;
    this.height = 42;
    this.reset(spawnPoint);
  }

  reset(spawnPoint) {
    this.position = { x: spawnPoint.x, y: spawnPoint.y };
    this.velocity = { x: 0, y: 0 };
    this.state = 'idle';
    this.isAlive = true;
    this.isGrounded = true;
    this.canDoubleJump = true;
    this.carryingPlayerId = null;
    this.carriedByPlayerId = null;
    this.intimacyScore = 0;
    this.skillLevel = 0;
    this.inputState = {
      left: false,
      right: false,
      jump: false,
      anchor: false,
      carry: false,
      throwAction: false,
      pull: false
    };
    this.anchorHeld = false;
    this.facing = 1;
    this.jumpBufferFramesLeft = 0;
    this.coyoteFramesLeft = 0;
    this.invulnerableMs = 0;
    this.inPit = false;
    this.pitY = 0;
    this.ropeDangerMs = 0;
    this.pendingRopeDeath = false;
    this.thrownMeta = null;
    this.throwRopeSlackMs = 0;
    this.wasGrounded = true;
    this.jumpConsumed = false;
    this.deathCount = 0;
    this.rescueCount = 0;
    this.successfulThrowCount = 0;
    this.collectedCount = 0;
    this.hasKey = false;
    this.spawnPoint = { x: spawnPoint.x, y: spawnPoint.y };
    this.controllerType = this.index < 2 ? 'human' : 'ai';
  }
}

module.exports = {
  Player
};
