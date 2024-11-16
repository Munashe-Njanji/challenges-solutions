// src/core/MemoryManager.js
class MemoryManager {
  constructor(warningThreshold = 150) {
    // MB
    this.warningThreshold = warningThreshold * 1024 * 1024;
    this.lastCheck = Date.now();
    this.checkInterval = 1000; // Check every second
  }

  checkMemory() {
    if (Date.now() - this.lastCheck < this.checkInterval) return true;

    this.lastCheck = Date.now();
    const used = process.memoryUsage().heapUsed;

    if (used > this.warningThreshold) {
      global.gc && global.gc(); // Optional garbage collection if available
      return false;
    }
    return true;
  }
}

module.exports = { MemoryManager };
