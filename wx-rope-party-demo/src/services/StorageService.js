class StorageService {
  constructor() {
    this.memory = {};
  }

  get(key, defaultValue) {
    try {
      if (typeof wx !== 'undefined' && wx.getStorageSync) {
        const value = wx.getStorageSync(key);
        return value === '' || value == null ? defaultValue : value;
      }
    } catch (error) {
      // 忽略存储异常，自动回退到内存。
    }
    return this.memory[key] == null ? defaultValue : this.memory[key];
  }

  set(key, value) {
    this.memory[key] = value;
    try {
      if (typeof wx !== 'undefined' && wx.setStorageSync) {
        wx.setStorageSync(key, value);
      }
    } catch (error) {
      // 静默降级。
    }
  }
}

module.exports = {
  StorageService
};
