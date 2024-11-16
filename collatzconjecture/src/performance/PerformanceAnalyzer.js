// src/performance/PerformanceAnalyzer.js
const { PerformanceMonitor } = require("./PerformanceMonitor");

class PerformanceAnalyzer {
  constructor(options = {}) {
    this.monitor = new PerformanceMonitor();
    this.sampleSize = options.sampleSize || 3; // Number of times to run each test for averaging
    this.warmupRuns = options.warmupRuns || 1; // Number of warmup runs before actual measurements
  }

  async compareImplementations(calculator, start, end) {
    // Perform warmup runs to stabilize performance
    await this.warmup(calculator, start, Math.min(start + 100, end));

    const batches = Array.from(calculator.generateRange(start, end));

    const results = {
      withCache: {
        totalTime: 0,
        memoryProfile: [],
        cacheHits: 0,
        maxSteps: 0,
        peakMemory: 0,
        averageMemory: 0,
      },
      withoutCache: {
        totalTime: 0,
        memoryProfile: [],
        maxSteps: 0,
        peakMemory: 0,
        averageMemory: 0,
      },
    };

    // Process batches with multiple samples for more accurate measurements
    for (const batch of batches) {
      const batchMetrics = await this.processBatchWithSamples(
        calculator,
        batch
      );

      // Update metrics for cached results
      this.updateMetrics(results.withCache, batchMetrics.withCache);
      this.updateMetrics(results.withoutCache, batchMetrics.withoutCache);

      // Log progress with memory information
      console.log(`Processed batch ${batch.start}-${batch.end}:`, {
        withCache: {
          memory: `${batchMetrics.withCache.memoryUsed.toFixed(2)}MB`,
          time: `${batchMetrics.withCache.executionTime.toFixed(2)}ms`,
        },
        withoutCache: {
          memory: `${batchMetrics.withoutCache.memoryUsed.toFixed(2)}MB`,
          time: `${batchMetrics.withoutCache.executionTime.toFixed(2)}ms`,
        },
      });
    }

    return this.generateDetailedReport(results, start, end);
  }

  async warmup(calculator, start, end) {
    console.log(`Performing ${this.warmupRuns} warmup runs...`);
    for (let i = 0; i < this.warmupRuns; i++) {
      await calculator.processBatch(start, end, true);
      await calculator.processBatch(start, end, false);
      if (global.gc) global.gc();
    }
  }

  async processBatchWithSamples(calculator, batch) {
    const metrics = {
      withCache: { samples: [] },
      withoutCache: { samples: [] },
    };

    for (let i = 0; i < this.sampleSize; i++) {
      // Clear any existing cache before each sample
      calculator.cache.clear();
      if (global.gc) global.gc();

      // Measure with cache
      const withCacheResults = await this.monitor.measure(() =>
        calculator.processBatch(batch.start, batch.end, true)
      );

      // Clear cache and force GC before non-cache test
      calculator.cache.clear();
      if (global.gc) global.gc();

      // Measure without cache
      const withoutCacheResults = await this.monitor.measure(() =>
        calculator.processBatch(batch.start, batch.end, false)
      );

      metrics.withCache.samples.push(withCacheResults);
      metrics.withoutCache.samples.push(withoutCacheResults);
    }

    // Calculate averages
    return {
      withCache: this.calculateAverageMetrics(metrics.withCache.samples),
      withoutCache: this.calculateAverageMetrics(metrics.withoutCache.samples),
    };
  }

  calculateAverageMetrics(samples) {
    const avgExecutionTime =
      samples.reduce((acc, s) => acc + s.executionTime, 0) / samples.length;
    const avgMemoryUsed =
      samples.reduce((acc, s) => acc + s.memoryUsed, 0) / samples.length;
    const peakMemoryUsed = Math.max(...samples.map((s) => s.memoryUsed));

    const cacheHits =
      samples.reduce((acc, s) => {
        return acc + (s.results?.filter((r) => r.cacheHit)?.length || 0);
      }, 0) / samples.length;

    return {
      executionTime: avgExecutionTime,
      memoryUsed: avgMemoryUsed,
      peakMemoryUsed: peakMemoryUsed,
      cacheHits: cacheHits,
      results: samples[0].results, // Use first sample's results for analysis
    };
  }

  updateMetrics(metrics, batchMetrics) {
    metrics.totalTime += batchMetrics.executionTime;
    metrics.memoryProfile.push(batchMetrics.memoryUsed);
    metrics.peakMemory = Math.max(
      metrics.peakMemory,
      batchMetrics.peakMemoryUsed
    );

    if (batchMetrics.results) {
      batchMetrics.results.forEach((result) => {
        if (result && typeof result.steps === "number") {
          metrics.maxSteps = Math.max(metrics.maxSteps, result.steps);
          if (result.cacheHit) {
            metrics.cacheHits = (metrics.cacheHits || 0) + 1;
          }
        }
      });
    }

    // Update average memory
    metrics.averageMemory =
      metrics.memoryProfile.reduce((a, b) => a + b, 0) /
      metrics.memoryProfile.length;
  }

  generateDetailedReport(results, start, end) {
    const count = end - start + 1;
    const numBatches = results.withCache.memoryProfile.length;

    const report = {
      analysisInfo: {
        processedRange: { start, end },
        totalNumbers: count,
        numberOfBatches: numBatches,
        samplesPerBatch: this.sampleSize,
        warmupRuns: this.warmupRuns,
      },
      withCache: {
        averageTime: results.withCache.totalTime / count,
        peakMemory: results.withCache.peakMemory,
        averageMemory: results.withCache.averageMemory,
        cacheHitRate: (results.withCache.cacheHits / count) * 100,
        maxSteps: results.withCache.maxSteps,
        memoryProfile: results.withCache.memoryProfile,
      },
      withoutCache: {
        averageTime: results.withoutCache.totalTime / count,
        peakMemory: results.withoutCache.peakMemory,
        averageMemory: results.withoutCache.averageMemory,
        maxSteps: results.withoutCache.maxSteps,
        memoryProfile: results.withoutCache.memoryProfile,
      },
      improvements: {
        speedup: results.withoutCache.totalTime / results.withCache.totalTime,
        memoryReduction:
          results.withoutCache.averageMemory - results.withCache.averageMemory,
      },
    };

    // Add memory efficiency metrics
    report.memoryEfficiency = {
      withCache: this.calculateMemoryEfficiencyMetrics(
        results.withCache.memoryProfile
      ),
      withoutCache: this.calculateMemoryEfficiencyMetrics(
        results.withoutCache.memoryProfile
      ),
    };

    return report;
  }

  calculateMemoryEfficiencyMetrics(memoryProfile) {
    const sorted = [...memoryProfile].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    const variance =
      memoryProfile.reduce((acc, val) => acc + Math.pow(val - median, 2), 0) /
      memoryProfile.length;

    return {
      median,
      standardDeviation: Math.sqrt(variance),
      min: Math.min(...memoryProfile),
      max: Math.max(...memoryProfile),
      stability: (1 - Math.sqrt(variance) / median) * 100, // Memory stability score as percentage
    };
  }
}

module.exports = { PerformanceAnalyzer };
