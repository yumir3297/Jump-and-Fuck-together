const { AdService } = require('./AdService');
const { BALANCE_CONFIG } = require('../config/balanceConfig');

class MockAdService extends AdService {
  constructor(storageService, analyticsService) {
    super();
    this.storageService = storageService;
    this.analyticsService = analyticsService;
    this.sessionStartedAt = Date.now();
    this.matchesStarted = 0;
    this.lastInterstitialAt = 0;
    this.failStreak = 0;
    this.rewardedReady = false;
    this.preloadRewardedAd();
  }

  preloadRewardedAd() {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.rewardedReady = true;
        resolve();
      }, BALANCE_CONFIG.ads.rewardedPreloadDelayMs);
    });
  }

  onMatchStart() {
    this.matchesStarted += 1;
  }

  onMatchFail() {
    this.failStreak += 1;
  }

  onMatchSuccess() {
    this.failStreak = 0;
  }

  getRewardedCountKey() {
    const date = new Date();
    const stamp =
      date.getFullYear() + '-' + String(date.getMonth() + 1) + '-' + String(date.getDate());
    return 'rewarded_count_' + stamp;
  }

  getRewardedCountToday() {
    return this.storageService.get(this.getRewardedCountKey(), 0);
  }

  incrementRewardedCount() {
    const key = this.getRewardedCountKey();
    const value = this.storageService.get(key, 0) + 1;
    this.storageService.set(key, value);
  }

  canShowRewardedAd(scene) {
    const elapsedMs = Date.now() - this.sessionStartedAt;
    const underGraceTime = elapsedMs < BALANCE_CONFIG.ads.newUserGraceMinutes * 60 * 1000;
    const underGraceMatch = this.matchesStarted <= BALANCE_CONFIG.ads.newUserGraceMatches;

    if (scene === 'single_player_revive' || scene === 'team_revive') {
      return this.rewardedReady && this.getRewardedCountToday() < BALANCE_CONFIG.ads.rewardedDailyLimit;
    }
    if (underGraceTime || underGraceMatch) {
      return false;
    }
    return this.rewardedReady && this.getRewardedCountToday() < BALANCE_CONFIG.ads.rewardedDailyLimit;
  }

  canShowInterstitialAd() {
    if (Date.now() - this.sessionStartedAt < BALANCE_CONFIG.ads.newUserGraceMinutes * 60 * 1000) {
      return false;
    }
    if (this.matchesStarted <= BALANCE_CONFIG.ads.newUserGraceMatches) {
      return false;
    }
    if (this.failStreak >= BALANCE_CONFIG.ads.interstitialBlockFailStreak) {
      return false;
    }
    if (Date.now() - this.lastInterstitialAt < BALANCE_CONFIG.ads.interstitialMinIntervalMs) {
      return false;
    }
    return true;
  }

  showRewardedAd(scene) {
    if (!this.canShowRewardedAd(scene)) {
      return Promise.resolve({ completed: false, rewardGranted: false, reason: 'not_available' });
    }
    if (this.analyticsService) {
      this.analyticsService.track('reward_ad_show', { scene });
    }
    return new Promise((resolve) => {
      setTimeout(() => {
        this.incrementRewardedCount();
        this.rewardedReady = false;
        this.preloadRewardedAd();
        if (this.analyticsService) {
          this.analyticsService.track('reward_ad_complete', { scene });
        }
        resolve({
          completed: true,
          rewardGranted: true
        });
      }, 800);
    });
  }

  showInterstitialAd(scene) {
    if (!this.canShowInterstitialAd(scene)) {
      return Promise.resolve();
    }
    this.lastInterstitialAt = Date.now();
    return Promise.resolve();
  }
}

module.exports = {
  MockAdService
};
