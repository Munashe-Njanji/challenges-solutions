// src/performance/PerformanceMonitor.js
class PerformanceMonitor {
    constructor() {
      this.metrics = new Map();
      this.baselineMemory = process.memoryUsage().heapUsed;
      this.measurements = [];
    }
  
    start() {
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      this.startTime = performance.now();
      // Take multiple samples to get a more accurate baseline
      this.memoryBaseline = this.getAverageMemoryUsage(5);
      return this;
    }
  
    getAverageMemoryUsage(samples = 5) {
      const measurements = [];
      for (let i = 0; i < samples; i++) {
        measurements.push(process.memoryUsage().heapUsed);
        // Small delay between measurements
        for(let j = 0; j < 1000000; j++) {} // Minor delay
      }
      return measurements.reduce((a, b) => a + b, 0) / measurements.length;
    }
  
    end() {
      const endTime = performance.now();
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      // Take multiple samples at the end
      const endMemory = this.getAverageMemoryUsage(5);
      
      // Calculate the absolute memory usage rather than the difference
      const memoryUsed = Math.max(0, endMemory - this.baselineMemory);
      
      return {
        executionTime: endTime - this.startTime,
        memoryUsed: memoryUsed / 1024 / 1024, // Convert to MB
        peakMemoryUsed: Math.max(0, (process.memoryUsage().heapUsed - this.baselineMemory)) / 1024 / 1024,
        timestamp: new Date(),
      };
    }
  
    async measure(fn) {
      this.start();
      const results = await fn();
      const metrics = this.end();
  
      // Store the measurement
      this.measurements.push({
        timestamp: metrics.timestamp,
        memoryUsed: metrics.memoryUsed,
        executionTime: metrics.executionTime
      });
  
      return {
        results,
        ...metrics
      };
    }
  
    getMemoryProfile() {
      return {
        measurements: this.measurements,
        average: this.measurements.reduce((acc, m) => acc + m.memoryUsed, 0) / this.measurements.length,
        peak: Math.max(...this.measurements.map(m => m.memoryUsed)),
        baseline: this.baselineMemory / 1024 / 1024
      };
    }
  }
  
  module.exports = { PerformanceMonitor };