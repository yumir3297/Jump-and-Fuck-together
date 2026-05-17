class ObjectPool {
  constructor(factory) {
    this.factory = factory;
    this.items = [];
  }

  acquire() {
    for (let i = 0; i < this.items.length; i += 1) {
      if (!this.items[i].active) {
        this.items[i].active = true;
        return this.items[i];
      }
    }
    const item = this.factory();
    item.active = true;
    this.items.push(item);
    return item;
  }

  release(item) {
    if (item) {
      item.active = false;
    }
  }

  releaseAll() {
    for (let i = 0; i < this.items.length; i += 1) {
      this.items[i].active = false;
    }
  }

  forEachActive(callback) {
    for (let i = 0; i < this.items.length; i += 1) {
      const item = this.items[i];
      if (item.active) {
        callback(item, i);
      }
    }
  }
}

module.exports = {
  ObjectPool
};
