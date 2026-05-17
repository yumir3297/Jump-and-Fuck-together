function getSystemInfo() {
  if (typeof wx !== 'undefined' && wx.getSystemInfoSync) {
    return wx.getSystemInfoSync();
  }
  return {
    windowWidth: 1334,
    windowHeight: 750,
    screenWidth: 1334,
    screenHeight: 750,
    pixelRatio: 1,
    platform: 'devtools',
    brand: 'mock'
  };
}

function isDevtools() {
  const info = getSystemInfo();
  return info.platform === 'devtools' || info.platform === 'windows' || info.platform === 'mac';
}

function supportsKeyboard() {
  return typeof wx !== 'undefined' && typeof wx.onKeyDown === 'function';
}

function supportsShareAppMessage() {
  return typeof wx !== 'undefined' && typeof wx.shareAppMessage === 'function';
}

module.exports = {
  getSystemInfo,
  isDevtools,
  supportsKeyboard,
  supportsShareAppMessage
};
