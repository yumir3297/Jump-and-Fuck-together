class EventBus {
  constructor() {
    this.listeners = {};
  }

  on(eventName, handler) {
    if (!this.listeners[eventName]) {
      this.listeners[eventName] = [];
    }
    this.listeners[eventName].push(handler);
    return () => this.off(eventName, handler);
  }

  off(eventName, handler) {
    const list = this.listeners[eventName];
    if (!list) {
      return;
    }
    this.listeners[eventName] = list.filter((item) => item !== handler);
  }

  emit(eventName, payload) {
    const list = this.listeners[eventName];
    if (!list) {
      return;
    }
    for (let i = 0; i < list.length; i += 1) {
      list[i](payload);
    }
  }
}

module.exports = {
  EventBus
};
