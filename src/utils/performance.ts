/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * Performance Monitoring Utility for CKEditor 5
 * 
 * Provides comprehensive performance monitoring and optimization tools
 * to ensure optimal editor performance.
 */

interface PerformanceMetric {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  memoryUsage?: number;
  metadata?: Record<string, any>;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  summary: {
    totalDuration: number;
    averageDuration: number;
    slowestOperation: string;
    memoryPeak: number;
    operationCount: number;
  };
}

export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private activeMetrics: Map<string, PerformanceMetric> = new Map();
  private memoryPeak: number = 0;
  private enabled: boolean = true;

  constructor(private config: {
    maxMetrics?: number;
    enableMemoryTracking?: boolean;
    enableAutoCleanup?: boolean;
    cleanupInterval?: number;
  } = {}) {
    this.config = {
      maxMetrics: 1000,
      enableMemoryTracking: true,
      enableAutoCleanup: true,
      cleanupInterval: 60000, // 1 minute
      ...config
    };

    if (this.config.enableAutoCleanup) {
      this.startAutoCleanup();
    }
  }

  /**
   * Start measuring a performance metric
   */
  start(name: string, metadata?: Record<string, any>): void {
    if (!this.enabled) return;

    const metric: PerformanceMetric = {
      name,
      startTime: performance.now(),
      metadata
    };

    this.activeMetrics.set(name, metric);
  }

  /**
   * End measuring a performance metric
   */
  end(name: string): PerformanceMetric | null {
    if (!this.enabled) return null;

    const metric = this.activeMetrics.get(name);
    if (!metric) {
      console.warn(`Performance metric "${name}" was not started`);
      return null;
    }

    metric.endTime = performance.now();
    metric.duration = metric.endTime - metric.startTime;

    if (this.config.enableMemoryTracking) {
      metric.memoryUsage = this.getMemoryUsage();
      this.memoryPeak = Math.max(this.memoryPeak, metric.memoryUsage);
    }

    this.metrics.push(metric);
    this.activeMetrics.delete(name);

    // Cleanup if we exceed max metrics
    if (this.metrics.length > this.config.maxMetrics!) {
      this.metrics = this.metrics.slice(-this.config.maxMetrics!);
    }

    return metric;
  }

  /**
   * Measure a function execution time
   */
  measure<T>(name: string, fn: () => T, metadata?: Record<string, any>): T {
    this.start(name, metadata);
    try {
      return fn();
    } finally {
      this.end(name);
    }
  }

  /**
   * Measure an async function execution time
   */
  async measureAsync<T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> {
    this.start(name, metadata);
    try {
      return await fn();
    } finally {
      this.end(name);
    }
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    if (typeof performance !== 'undefined' && performance.memory) {
      return performance.memory.usedJSHeapSize;
    }
    return 0;
  }

  /**
   * Generate performance report
   */
  getReport(): PerformanceReport {
    const completedMetrics = this.metrics.filter(m => m.duration !== undefined);
    
    if (completedMetrics.length === 0) {
      return {
        metrics: [],
        summary: {
          totalDuration: 0,
          averageDuration: 0,
          slowestOperation: '',
          memoryPeak: this.memoryPeak,
          operationCount: 0
        }
      };
    }

    const totalDuration = completedMetrics.reduce((sum, m) => sum + m.duration!, 0);
    const averageDuration = totalDuration / completedMetrics.length;
    const slowestOperation = completedMetrics.reduce((slowest, current) => 
      current.duration! > slowest.duration! ? current : slowest
    );

    return {
      metrics: [...completedMetrics],
      summary: {
        totalDuration,
        averageDuration,
        slowestOperation: slowestOperation.name,
        memoryPeak: this.memoryPeak,
        operationCount: completedMetrics.length
      }
    };
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get slowest operations
   */
  getSlowestOperations(count: number = 10): PerformanceMetric[] {
    return this.metrics
      .filter(m => m.duration !== undefined)
      .sort((a, b) => b.duration! - a.duration!)
      .slice(0, count);
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.activeMetrics.clear();
    this.memoryPeak = 0;
  }

  /**
   * Enable/disable monitoring
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Start auto cleanup
   */
  private startAutoCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      const cutoff = now - (this.config.cleanupInterval! * 2);
      
      this.metrics = this.metrics.filter(metric => {
        return metric.startTime > cutoff;
      });
    }, this.config.cleanupInterval);
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Convenience functions
export const measure = <T>(name: string, fn: () => T, metadata?: Record<string, any>): T => {
  return performanceMonitor.measure(name, fn, metadata);
};

export const measureAsync = <T>(name: string, fn: () => Promise<T>, metadata?: Record<string, any>): Promise<T> => {
  return performanceMonitor.measureAsync(name, fn, metadata);
};

export const startMeasure = (name: string, metadata?: Record<string, any>): void => {
  performanceMonitor.start(name, metadata);
};

export const endMeasure = (name: string): PerformanceMetric | null => {
  return performanceMonitor.end(name);
};

// Performance optimization utilities
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Memory management utilities
export const requestIdleCallback = (callback: () => void, options?: { timeout: number }): number => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback, options);
  } else {
    // Fallback for browsers that don't support requestIdleCallback
    return setTimeout(callback, options?.timeout || 1);
  }
};

export const cancelIdleCallback = (id: number): void => {
  if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
    (window as any).cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}; 