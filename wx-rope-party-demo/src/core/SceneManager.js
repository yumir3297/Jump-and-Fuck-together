class SceneManager {
  constructor(app) {
    this.app = app;
    this.sceneMap = {};
    this.currentScene = null;
  }

  register(name, SceneClass) {
    this.sceneMap[name] = SceneClass;
  }

  change(name, params) {
    if (!this.sceneMap[name]) {
      throw new Error('Scene not registered: ' + name);
    }
    if (this.currentScene && this.currentScene.exit) {
      this.currentScene.exit();
    }
    const SceneClass = this.sceneMap[name];
    this.currentScene = new SceneClass(this.app, params || {});
    if (this.currentScene.enter) {
      this.currentScene.enter();
    }
  }

  update(deltaMs) {
    if (this.currentScene && this.currentScene.update) {
      this.currentScene.update(deltaMs);
    }
  }

  render(renderer, alpha) {
    if (this.currentScene && this.currentScene.render) {
      this.currentScene.render(renderer, alpha || 0);
    }
  }

  handleTouch(type, event) {
    if (this.currentScene && this.currentScene.handleTouch) {
      return this.currentScene.handleTouch(type, event);
    }
    return false;
  }

  pauseCurrent() {
    if (this.currentScene && this.currentScene.onPause) {
      this.currentScene.onPause();
    }
  }

  resumeCurrent() {
    if (this.currentScene && this.currentScene.onResume) {
      this.currentScene.onResume();
    }
  }
}

module.exports = {
  SceneManager
};
