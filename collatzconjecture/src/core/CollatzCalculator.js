// src/core/CollatzCalculator.js
const { LRUCache } = require("./Cache");
const { MemoryManager } = require("./MemoryManager");

class CollatzCalculator {
  constructor(config = {}) {
    this.cache = new LRUCache(config.cacheSize || 40000);
    this.memoryManager = new MemoryManager(config.memoryThreshold || 350);
    this.batchSize = config.batchSize || 20000;
    this.memoryCheckFrequency = config.memoryCheckFrequency || 1000; // Check memory every 1000 iterations
  }

  calculateSequence(n, useCache = true) {
    if (!Number.isInteger(n) || n <= 0) {
      throw new Error("Input must be a positive integer");
    }

    if (useCache) {
      const cached = this.cache.get(n);
      if (cached) return { ...cached, cacheHit: true };
    }

    const sequence = [n];
    let currentNum = n;
    let steps = 0;

    while (currentNum !== 1) {
      if (
        steps % this.memoryCheckFrequency === 0 &&
        !this.memoryManager.checkMemory()
      ) {
        this.cache.clear(); // Clear cache if memory pressure is high
      }

      if (useCache) {
        const intermediateResult = this.cache.get(currentNum);
        if (intermediateResult) {
          steps += intermediateResult.steps;
          return {
            steps,
            sequence: [...sequence, ...intermediateResult.sequence.slice(1)],
            cacheHit: true,
          };
        }
      }

      currentNum =
        currentNum % 2 === 0
          ? currentNum / 2
          : this.safeMultiply(currentNum, 3) + 1;

      sequence.push(currentNum);
      steps++;

      if (steps > Number.MAX_SAFE_INTEGER) {
        throw new Error("Sequence exceeded safe integer limit");
      }
    }

    const result = { steps, sequence, cacheHit: false };
    if (useCache) this.cache.set(n, result);

    return result;
  }

  safeMultiply(a, b) {
    const result = a * b;
    if (!Number.isSafeInteger(result)) {
      throw new Error("Integer overflow detected");
    }
    return result;
  }

  *generateRange(start, end) {
    for (let i = start; i <= end; i += this.batchSize) {
      const batchEnd = Math.min(i + this.batchSize - 1, end);
      yield { start: i, end: batchEnd };
    }
  }

  async processBatch(start, end, useCache = true) {
    const results = [];
    try {
      for (let i = start; i <= end; i++) {
        if (
          i % this.memoryCheckFrequency === 0 &&
          !this.memoryManager.checkMemory()
        ) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
        const result = this.calculateSequence(i, useCache);
        results.push({
          number: i,
          ...result,
        });
      }
      return results;
    } catch (error) {
      console.error(`Error processing batch ${start}-${end}:`, error);
      return results; // Return partial results if there was an error
    }
  }
}

module.exports = { CollatzCalculator };
