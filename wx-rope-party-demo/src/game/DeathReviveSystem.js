const { BALANCE_CONFIG } = require('../config/balanceConfig');

class DeathReviveSystem {
  constructor(adService, analyticsService) {
    this.adService = adService;
    this.analyticsService = analyticsService;
    this.resetRun();
  }

  resetRun() {
    this.singleReviveUsed = 0;
    this.teamReviveUsed = 0;
    this.failStreak = 0;
    this.offer = null;
    this.isAwaitingAd = false;
  }

  resetLevel() {
    this.offer = null;
    this.isAwaitingAd = false;
  }

  killPlayer(player, reason, teamState, players) {
    if (!player.isAlive || player.invulnerableMs > 0) {
      return false;
    }

    if (teamState.friendshipCrownCharges > 0) {
      teamState.friendshipCrownCharges -= 1;
      player.invulnerableMs = BALANCE_CONFIG.revive.reviveInvulnerableMs;
      player.velocity.y = -6;
      return false;
    }

    player.isAlive = false;
    player.velocity.x = 0;
    player.velocity.y = 0;
    player.state = 'dead';
    player.deathCount += 1;

    if (this.analyticsService) {
      this.analyticsService.track('player_death', {
        playerId: player.id,
        reason
      });
    }

    const everyoneDead = players.every((item) => !item.isAlive);
    if (everyoneDead && this.analyticsService) {
      this.analyticsService.track('team_death', {
        reason
      });
    }

    this.offer = everyoneDead
      ? this.createTeamOffer(reason)
      : this.createSingleOffer(player.id, reason);
    return true;
  }

  createSingleOffer(playerId, reason) {
    const scene = 'single_player_revive';
    const offer = {
      type: 'single',
      playerId,
      reason,
      title: '队友摔扁了',
      description: '看个 mock 激励视频，原地拉起来继续冲。',
      canUseAd:
        this.singleReviveUsed < BALANCE_CONFIG.revive.singleReviveUsesPerRun &&
        this.adService.canShowRewardedAd(scene),
      rewardScene: scene
    };
    if (this.analyticsService) {
      this.analyticsService.track('reward_ad_offer', {
        scene,
        offerType: 'single'
      });
    }
    return offer;
  }

  createTeamOffer(reason) {
    const scene = 'team_revive';
    const offer = {
      type: 'team',
      playerId: null,
      reason,
      title: '全队一起翻车',
      description: '看个 mock 激励视频，全队回到最近检查点。',
      canUseAd:
        this.teamReviveUsed < BALANCE_CONFIG.revive.teamReviveUsesPerRun &&
        this.adService.canShowRewardedAd(scene),
      rewardScene: scene
    };
    if (this.analyticsService) {
      this.analyticsService.track('reward_ad_offer', {
        scene,
        offerType: 'team'
      });
    }
    return offer;
  }

  async acceptOffer(playerManager, checkpoint) {
    if (!this.offer || this.isAwaitingAd) {
      return false;
    }
    if (!this.offer.canUseAd) {
      return false;
    }

    this.isAwaitingAd = true;
    const result = await this.adService.showRewardedAd(this.offer.rewardScene);
    this.isAwaitingAd = false;

    if (!result || !result.completed) {
      return false;
    }

    if (this.offer.type === 'single') {
      this.singleReviveUsed += 1;
      playerManager.revivePlayers([this.offer.playerId], checkpoint);
    } else {
      this.teamReviveUsed += 1;
      const ids = playerManager.getPlayers().map((player) => player.id);
      playerManager.revivePlayers(ids, checkpoint);
      this.failStreak += 1;
    }

    this.offer = null;
    return true;
  }

  dismissOffer() {
    this.offer = null;
  }

  recordFail() {
    this.failStreak += 1;
  }
}

module.exports = {
  DeathReviveSystem
};
