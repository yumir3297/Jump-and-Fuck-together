class IntimacySystem {
  constructor() {
    this.teamBond = 0;
    this.log = [];
  }

  reset(players) {
    this.teamBond = 0;
    this.log = [];
    for (let i = 0; i < players.length; i += 1) {
      players[i].intimacyScore = 0;
      players[i].skillLevel = 0;
    }
  }

  addSharedBond(amount, reason, playerIds) {
    this.teamBond = Math.max(0, this.teamBond + amount);
    this.log.push({
      amount,
      reason,
      playerIds: playerIds || []
    });
  }

  applyToPlayers(players) {
    for (let i = 0; i < players.length; i += 1) {
      players[i].intimacyScore = this.teamBond;
      players[i].skillLevel = Math.min(100, Math.floor(this.teamBond * 1.25));
    }
  }

  getBondTier() {
    if (this.teamBond <= 20) {
      return '塑料队友';
    }
    if (this.teamBond <= 50) {
      return '开始有默契';
    }
    if (this.teamBond <= 80) {
      return '灵魂搭档';
    }
    return '天选羁绊';
  }
}

module.exports = {
  IntimacySystem
};
