const {
  CollatzCalculator,
} = require("../collatzconjecture/src/core/CollatzCalculator");
const {
  PerformanceAnalyzer,
} = require("../collatzconjecture/src/performance/PerformanceAnalyzer");

// Enable garbage collection if running with --expose-gc
if (global.gc) {
  console.log("Garbage collection enabled");
}

class CollatzAnalyzer {
  constructor(options = {}) {
    this.calculator = new CollatzCalculator({
      cacheSize: options.cacheSize || 80000,
      memoryThreshold: options.memoryThreshold || 500,
      batchSize: options.batchSize || 40000,
      memoryCheckFrequency: 1000,
    });

    this.analyzer = new PerformanceAnalyzer({
      sampleSize: options.sampleSize || 3,
      warmupRuns: options.warmupRuns || 1,
    });
  }

  async analyze(start, end) {
    console.log("\nStarting Collatz Sequence Analysis");
    console.log("=================================");
    console.log(`Range: ${start} to ${end}`);
    console.log(`Cache Size: ${this.calculator.cache.maxSize} entries`);
    console.log(`Batch Size: ${this.calculator.batchSize}`);
    console.log(
      `Memory Threshold: ${
        this.calculator.memoryManager.warningThreshold / 1024 / 1024
      }MB`
    );
    console.log("=================================\n");

    try {
      const report = await this.analyzer.compareImplementations(
        this.calculator,
        start,
        end
      );
      this.displayResults(report);
      return report;
    } catch (error) {
      console.error("Error during analysis:", error);
      throw error;
    }
  }

  displayResults(report) {
    console.log("\nAnalysis Results:");
    console.log("=================");
    console.log(
      `Processed range: ${report.analysisInfo.processedRange.start} to ${report.analysisInfo.processedRange.end}`
    );
    console.log(`Total numbers processed: ${report.analysisInfo.totalNumbers}`);
    console.log(`Number of batches: ${report.analysisInfo.numberOfBatches}`);
    console.log(`Samples per batch: ${report.analysisInfo.samplesPerBatch}`);

    console.log("\nWith Cache:");
    console.log(`Average Time: ${report.withCache.averageTime.toFixed(3)}ms`);
    console.log(`Cache Hit Rate: ${report.withCache.cacheHitRate.toFixed(2)}%`);
    console.log(
      `Average Memory: ${report.withCache.averageMemory.toFixed(2)}MB`
    );
    console.log(`Peak Memory: ${report.withCache.peakMemory.toFixed(2)}MB`);

    console.log("\nMemory Efficiency (With Cache):");
    console.log(
      `Median Memory Usage: ${report.memoryEfficiency.withCache.median.toFixed(
        2
      )}MB`
    );
    console.log(
      `Memory Stability: ${report.memoryEfficiency.withCache.stability.toFixed(
        2
      )}%`
    );
    console.log(
      `Standard Deviation: ${report.memoryEfficiency.withCache.standardDeviation.toFixed(
        2
      )}MB`
    );

    console.log("\nWithout Cache:");
    console.log(
      `Average Time: ${report.withoutCache.averageTime.toFixed(3)}ms`
    );
    console.log(
      `Average Memory: ${report.withoutCache.averageMemory.toFixed(2)}MB`
    );
    console.log(`Peak Memory: ${report.withoutCache.peakMemory.toFixed(2)}MB`);

    console.log("\nMemory Efficiency (Without Cache):");
    console.log(
      `Median Memory Usage: ${report.memoryEfficiency.withoutCache.median.toFixed(
        2
      )}MB`
    );
    console.log(
      `Memory Stability: ${report.memoryEfficiency.withoutCache.stability.toFixed(
        2
      )}%`
    );
    console.log(
      `Standard Deviation: ${report.memoryEfficiency.withoutCache.standardDeviation.toFixed(
        2
      )}MB`
    );

    console.log("\nImprovements:");
    console.log(
      `Speed Improvement: ${report.improvements.speedup.toFixed(2)}x faster`
    );
    console.log(
      `Memory Reduction: ${report.improvements.memoryReduction.toFixed(2)}MB`
    );
  }
}

// CLI interface
async function main() {
  try {
    const args = process.argv.slice(2);
    const options = {
      start: parseInt(args[0]) || 1,
      end: parseInt(args[1]) || 1000000,
      cacheSize: parseInt(args[2]) || 80000,
      batchSize: parseInt(args[3]) || 40000,
      memoryThreshold: parseInt(args[4]) || 400,
      sampleSize: parseInt(args[5]) || 3,
      warmupRuns: parseInt(args[6]) || 1,
    };

    console.log("Configuration:");
    console.log("==============");
    Object.entries(options).forEach(([key, value]) => {
      console.log(`${key}: ${value}`);
    });

    const analyzer = new CollatzAnalyzer(options);
    await analyzer.analyze(options.start, options.end);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { CollatzAnalyzer };
