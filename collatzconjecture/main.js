/**
 * Advanced Collatz Conjecture calculator with performance comparison
 * between memoized and non-memoized implementations
 */

// Memoization cache singleton
class MemoizationCache {
  constructor() {
    if (!MemoizationCache.instance) {
      MemoizationCache.instance = new Map();
    }
    return MemoizationCache.instance;
  }

  static getInstance() {
    return new MemoizationCache();
  }

  clear() {
    MemoizationCache.instance.clear();
  }
}

/**
 * Calculate Collatz sequence with memoization
 * @param {number} n - Starting number
 * @param {Map} memo - Memoization cache
 * @returns {Object} Performance data and sequence
 */
function calculateCollatzMemoized(n, memo = MemoizationCache.getInstance()) {
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error("Input must be a positive integer");
  }

  const sequence = [n];
  let currentNum = n;
  let steps = 0;

  // Check memoization cache first
  if (memo.has(n)) {
    return {
      steps: memo.get(n),
      sequence: [n],
      cacheHit: true,
    };
  }

  while (currentNum !== 1) {
    // Check cache for intermediate results
    if (memo.has(currentNum)) {
      steps += memo.get(currentNum);
      break;
    }

    currentNum = currentNum % 2 === 0 ? currentNum / 2 : 3 * currentNum + 1;

    sequence.push(currentNum);
    steps++;
  }

  // Store results in cache
  sequence.forEach((num, index) => {
    if (!memo.has(num)) {
      memo.set(num, steps - index);
    }
  });

  return {
    steps,
    sequence,
    cacheHit: false,
  };
}

/**
 * Calculate Collatz sequence without memoization
 * @param {number} n - Starting number
 * @returns {Object} Performance data and sequence
 */
function calculateCollatzNonMemoized(n) {
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error("Input must be a positive integer");
  }

  const sequence = [n];
  let currentNum = n;
  let steps = 0;

  while (currentNum !== 1) {
    currentNum = currentNum % 2 === 0 ? currentNum / 2 : 3 * currentNum + 1;

    sequence.push(currentNum);
    steps++;
  }

  return {
    steps,
    sequence,
  };
}

/**
 * Measure performance metrics for a function
 * @param {Function} fn - Function to measure
 * @param {any[]} args - Arguments for the function
 * @returns {Object} Performance metrics
 */
function measurePerformance(fn, ...args) {
  const startTime = performance.now();
  const startMemory = process.memoryUsage().heapUsed;

  const result = fn(...args);

  const endTime = performance.now();
  const endMemory = process.memoryUsage().heapUsed;

  return {
    ...result,
    executionTime: endTime - startTime,
    memoryUsed: (endMemory - startMemory) / 1024 / 1024, // MB
    timestamp: new Date(),
  };
}

/**
 * Compare performance between memoized and non-memoized implementations
 * @param {number} start - Start of range
 * @param {number} end - End of range
 * @returns {Object} Comparison results
 */
function compareCollatzImplementations(start, end) {
  const memo = MemoizationCache.getInstance();
  memo.clear(); // Start fresh

  const memoizedResults = [];
  const nonMemoizedResults = [];

  // Run both implementations
  for (let i = start; i <= end; i++) {
    const memoizedResult = measurePerformance(
      calculateCollatzMemoized,
      i,
      memo
    );
    const nonMemoizedResult = measurePerformance(
      calculateCollatzNonMemoized,
      i
    );

    memoizedResults.push({
      number: i,
      ...memoizedResult,
    });

    nonMemoizedResults.push({
      number: i,
      ...nonMemoizedResult,
    });
  }

  // Calculate comprehensive statistics
  const stats = {
    memoized: {
      totalTime: 0,
      totalMemory: 0,
      maxSteps: 0,
      cacheHits: 0,
      longestSequence: { number: 0, steps: 0 },
    },
    nonMemoized: {
      totalTime: 0,
      totalMemory: 0,
      maxSteps: 0,
      longestSequence: { number: 0, steps: 0 },
    },
  };

  // Process memoized results
  memoizedResults.forEach((result) => {
    stats.memoized.totalTime += result.executionTime;
    stats.memoized.totalMemory += result.memoryUsed;
    if (result.steps > stats.memoized.maxSteps) {
      stats.memoized.maxSteps = result.steps;
      stats.memoized.longestSequence = {
        number: result.number,
        steps: result.steps,
      };
    }
    if (result.cacheHit) {
      stats.memoized.cacheHits++;
    }
  });

  // Process non-memoized results
  nonMemoizedResults.forEach((result) => {
    stats.nonMemoized.totalTime += result.executionTime;
    stats.nonMemoized.totalMemory += result.memoryUsed;
    if (result.steps > stats.nonMemoized.maxSteps) {
      stats.nonMemoized.maxSteps = result.steps;
      stats.nonMemoized.longestSequence = {
        number: result.number,
        steps: result.steps,
      };
    }
  });

  const count = end - start + 1;
  const comparison = {
    range: { start, end },
    count,
    memoized: {
      ...stats.memoized,
      averageTime: stats.memoized.totalTime / count,
      averageMemory: stats.memoized.totalMemory / count,
      cacheHitRate: (stats.memoized.cacheHits / count) * 100,
    },
    nonMemoized: {
      ...stats.nonMemoized,
      averageTime: stats.nonMemoized.totalTime / count,
      averageMemory: stats.nonMemoized.totalMemory / count,
    },
    improvement: {
      timeSpeedup: stats.nonMemoized.totalTime / stats.memoized.totalTime,
      memoryOverhead:
        stats.memoized.totalMemory - stats.nonMemoized.totalMemory,
    },
  };

  return {
    summary: comparison,
    details: {
      memoized: memoizedResults,
      nonMemoized: nonMemoizedResults,
    },
  };
}

// Example usage with detailed output
const range = { start: 1, end: 1000000 };
const results = compareCollatzImplementations(range.start, range.end);

console.log("\nCollatz Conjecture Performance Comparison");
console.log("========================================");
console.log(`Range: ${range.start} to ${range.end}`);
console.log("\nMemoized Implementation:");
console.log(`Total Time: ${results.summary.memoized.totalTime.toFixed(2)}ms`);
console.log(
  `Average Time per Number: ${results.summary.memoized.averageTime.toFixed(
    3
  )}ms`
);
console.log(
  `Cache Hit Rate: ${results.summary.memoized.cacheHitRate.toFixed(1)}%`
);
console.log(
  `Memory Usage: ${results.summary.memoized.totalMemory.toFixed(2)}MB`
);
console.log(
  `Longest Sequence: ${results.summary.memoized.longestSequence.number} (${results.summary.memoized.longestSequence.steps} steps)`
);

console.log("\nNon-Memoized Implementation:");
console.log(
  `Total Time: ${results.summary.nonMemoized.totalTime.toFixed(2)}ms`
);
console.log(
  `Average Time per Number: ${results.summary.nonMemoized.averageTime.toFixed(
    3
  )}ms`
);
console.log(
  `Memory Usage: ${results.summary.nonMemoized.totalMemory.toFixed(2)}MB`
);
console.log(
  `Longest Sequence: ${results.summary.nonMemoized.longestSequence.number} (${results.summary.nonMemoized.longestSequence.steps} steps)`
);

console.log("\nPerformance Improvement:");
console.log(
  `Speed Improvement: ${results.summary.improvement.timeSpeedup.toFixed(
    2
  )}x faster with memoization`
);
console.log(
  `Memory Overhead: ${results.summary.improvement.memoryOverhead.toFixed(
    2
  )}MB additional memory used`
);
