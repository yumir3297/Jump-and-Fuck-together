class AdService {
  preloadRewardedAd() {
    return Promise.resolve();
  }

  showRewardedAd() {
    return Promise.resolve({ completed: false, rewardGranted: false });
  }

  showInterstitialAd() {
    return Promise.resolve();
  }

  canShowRewardedAd() {
    return false;
  }

  canShowInterstitialAd() {
    return false;
  }
}

module.exports = {
  AdService
};
