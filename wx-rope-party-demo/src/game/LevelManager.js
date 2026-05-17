const { LEVEL_CONFIG } = require('../config/levelConfig');

class LevelManager {
  constructor(analyticsService) {
    this.analyticsService = analyticsService;
    this.currentIndex = 0;
    this.currentLevel = null;
    this.completedTutorialSteps = {};
  }

  loadLevel(index) {
    this.currentIndex = index;
    this.currentLevel = JSON.parse(JSON.stringify(LEVEL_CONFIG[index]));
    this.completedTutorialSteps = {};
    return this.currentLevel;
  }

  restartCurrentLevel() {
    return this.loadLevel(this.currentIndex);
  }

  loadNextLevel() {
    const nextIndex = Math.min(LEVEL_CONFIG.length - 1, this.currentIndex + 1);
    return this.loadLevel(nextIndex);
  }

  hasNextLevel() {
    return this.currentIndex < LEVEL_CONFIG.length - 1;
  }

  getCurrentLevel() {
    return this.currentLevel;
  }

  getProgress(x) {
    if (!this.currentLevel) {
      return 0;
    }
    return Math.max(0, Math.min(1, x / this.currentLevel.width));
  }

  markTutorialStep(step) {
    if (this.completedTutorialSteps[step]) {
      return;
    }
    this.completedTutorialSteps[step] = true;
    if (this.analyticsService) {
      this.analyticsService.track('tutorial_step_complete', {
        levelId: this.currentLevel ? this.currentLevel.id : '',
        step
      });
    }
  }

  getCheckpointForX(x) {
    if (!this.currentLevel || !this.currentLevel.checkpoints) {
      return { x: 120, y: 560 };
    }
    let checkpoint = this.currentLevel.checkpoints[0];
    for (let i = 0; i < this.currentLevel.checkpoints.length; i += 1) {
      if (x >= this.currentLevel.checkpoints[i].x) {
        checkpoint = this.currentLevel.checkpoints[i];
      }
    }
    return checkpoint;
  }
}

module.exports = {
  LevelManager
};
