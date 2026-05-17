const BALANCE_CONFIG = {
  rope: {
    ropeMaxLength: 180,
    ropeElasticity: 0.18,
    ropePullForce: 0.35,
    anchorPullMultiplier: 1.8,
    dangerStretchRatio: 0.85,
    breakOrDeathDelayMs: 1200,
    rescuePullUpForce: 0.22,
    pullButtonBoost: 1.55,
    pullMinLengthRatio: 0.38,
    pullShortenSpeed: 220,
    pullRecoverSpeed: 100,
    pullSpringMultiplier: 2.2,
    ropeDamping: 0.16,
    activePullWinchForce: 2.8,
    airPullBonus: 1.2,
    pitPullBonus: 1.5
  },
  throwing: {
    throwBaseVelocityX: 12.5,
    throwBaseVelocityY: -18.5,
    throwRandomAngleMin: -12,
    throwRandomAngleMax: 12,
    skillReduceRandomnessFactor: 0.6,
    landingBounceForce: 3,
    successDistance: 150,
    throwRopeSlackMs: 700
  },
  ropeThrowAssist: {
    thrownSlackLengthBonus: 140,
    thrownPullForceMultiplier: 0.34
  },
  collectibles: {
    keyPickupRadius: 22,
    bondPickupRadius: 20,
    specialPickupRadius: 24
  },
  intimacy: {
    levelComplete: 10,
    sharedCollect: 3,
    successfulThrow: 5,
    ropeRescue: 8,
    friendlyFirePenalty: -1
  },
  revive: {
    singleReviveUsesPerRun: 2,
    teamReviveUsesPerRun: 1,
    reviveInvulnerableMs: 800
  },
  ads: {
    newUserGraceMinutes: 3,
    newUserGraceMatches: 2,
    rewardedDailyLimit: 5,
    interstitialMinIntervalMs: 5 * 60 * 1000,
    interstitialBlockFailStreak: 3,
    rewardedPreloadDelayMs: 250
  },
  obstacle: {
    movingPlatformCarryStrength: 1,
    suddenMonsterShowMs: 1000,
    suddenMonsterCooldownMs: 2600
  }
};

module.exports = {
  BALANCE_CONFIG
};
