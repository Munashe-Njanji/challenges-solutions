// src/core/Cache.js
class LRUCache {
  constructor(maxSize = 10000) {
    this.maxSize = maxSize;
    this.cache = new Map();
    this.usage = new Map(); // Track usage frequency
  }

  get(key) {
    if (!this.cache.has(key)) return undefined;
    this.updateUsage(key);
    return this.cache.get(key);
  }

  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      this.evictLeastUsed();
    }
    this.cache.set(key, value);
    this.updateUsage(key);
  }

  updateUsage(key) {
    this.usage.set(key, (this.usage.get(key) || 0) + 1);
  }

  evictLeastUsed() {
    let leastUsedKey = Array.from(this.usage.entries()).sort(
      (a, b) => a[1] - b[1]
    )[0][0];
    this.cache.delete(leastUsedKey);
    this.usage.delete(leastUsedKey);
  }

  clear() {
    this.cache.clear();
    this.usage.clear();
  }

  size() {
    return this.cache.size;
  }
}

module.exports = { LRUCache };
