class AnalyticsService {
  constructor() {
    this.events = [];
  }

  track(eventName, payload) {
    const event = {
      eventName,
      payload: payload || {},
      timestamp: Date.now()
    };
    this.events.push(event);
    if (typeof console !== 'undefined') {
      console.log('[Analytics]', eventName, payload || {});
    }
  }

  getEvents() {
    return this.events.slice();
  }
}

module.exports = {
  AnalyticsService
};
