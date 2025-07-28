/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * Test Setup for CKEditor 5
 * 
 * Provides optimized test environment setup with performance monitoring
 */

// Performance monitoring for tests
const performance = {
  start: (name) => {
    if (typeof window !== 'undefined') {
      window.performance.mark(`${name}-start`);
    }
  },
  
  end: (name) => {
    if (typeof window !== 'undefined') {
      window.performance.mark(`${name}-end`);
      window.performance.measure(name, `${name}-start`, `${name}-end`);
    }
  },
  
  measure: (name, fn) => {
    const start = Date.now();
    const result = fn();
    const end = Date.now();
    
    if (typeof window !== 'undefined') {
      window.performance.measure(name, {
        startTime: start,
        endTime: end,
        duration: end - start
      });
    }
    
    return result;
  }
};

// Global test utilities
global.testUtils = {
  performance,
  
  // Mock DOM elements
  createMockElement: (tagName = 'div', attributes = {}) => {
    const element = document.createElement(tagName);
    Object.entries(attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
    return element;
  },
  
  // Mock editor instance
  createMockEditor: (config = {}) => {
    return {
      config: {
        get: (key) => config[key],
        set: (key, value) => { config[key] = value; }
      },
      model: {
        document: {
          getRoot: () => ({ name: 'root' })
        }
      },
      editing: {
        view: {
          document: {
            getRoot: () => ({ name: 'root' })
          }
        }
      },
      plugins: {
        get: (name) => null,
        has: (name) => false
      },
      destroy: jest.fn()
    };
  },
  
  // Wait for async operations
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Wait for next tick
  nextTick: () => new Promise(resolve => process.nextTick(resolve)),
  
  // Mock console methods
  mockConsole: () => {
    const originalConsole = { ...console };
    const mockConsole = {
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    };
    
    Object.assign(console, mockConsole);
    
    return {
      mockConsole,
      restore: () => Object.assign(console, originalConsole)
    };
  },
  
  // Create test data
  createTestData: (size = 1000) => {
    return Array.from({ length: size }, (_, i) => ({
      id: i,
      text: `Test content ${i}`,
      timestamp: Date.now() + i
    }));
  },
  
  // Performance test helper
  runPerformanceTest: async (name, testFn, iterations = 1000) => {
    const times = [];
    
    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await testFn();
      const end = performance.now();
      times.push(end - start);
    }
    
    const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
    const min = Math.min(...times);
    const max = Math.max(...times);
    
    console.log(`Performance Test: ${name}`);
    console.log(`  Average: ${avg.toFixed(2)}ms`);
    console.log(`  Min: ${min.toFixed(2)}ms`);
    console.log(`  Max: ${max.toFixed(2)}ms`);
    console.log(`  Iterations: ${iterations}`);
    
    return { avg, min, max, times };
  }
};

// Mock browser APIs
if (typeof window !== 'undefined') {
  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    constructor(callback) {
      this.callback = callback;
    }
    
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  
  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }
    
    observe() {}
    unobserve() {}
    disconnect() {}
  };
  
  // Mock requestAnimationFrame
  global.requestAnimationFrame = (callback) => {
    return setTimeout(callback, 16); // ~60fps
  };
  
  global.cancelAnimationFrame = (id) => {
    clearTimeout(id);
  };
  
  // Mock performance API
  if (!global.performance) {
    global.performance = {
      now: () => Date.now(),
      mark: () => {},
      measure: () => {},
      getEntriesByType: () => [],
      getEntriesByName: () => []
    };
  }
  
  // Mock localStorage
  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };
  
  // Mock sessionStorage
  global.sessionStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  };
}

// Mock Node.js APIs
if (typeof global !== 'undefined') {
  // Mock process
  global.process = {
    ...global.process,
    env: {
      ...global.process.env,
      NODE_ENV: 'test'
    }
  };
  
  // Mock Buffer
  if (!global.Buffer) {
    global.Buffer = require('buffer').Buffer;
  }
}

// Test environment setup
beforeEach(() => {
  // Clear all mocks before each test
  jest.clearAllMocks();
  
  // Reset performance marks
  if (typeof window !== 'undefined' && window.performance) {
    window.performance.clearMarks();
    window.performance.clearMeasures();
  }
  
  // Reset DOM
  if (typeof document !== 'undefined') {
    document.body.innerHTML = '';
  }
});

afterEach(() => {
  // Clean up after each test
  if (typeof window !== 'undefined') {
    // Clear any remaining timeouts
    const highestTimeoutId = setTimeout(() => {}, 0);
    for (let i = 0; i < highestTimeoutId; i++) {
      clearTimeout(i);
    }
    
    // Clear any remaining intervals
    const highestIntervalId = setInterval(() => {}, 0);
    for (let i = 0; i < highestIntervalId; i++) {
      clearInterval(i);
    }
  }
});

// Global test timeout
jest.setTimeout(10000);

// Performance monitoring
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    // Log initial load performance
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
      console.log('Page Load Performance:', {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByType('paint')[0]?.startTime || 0
      });
    }
  });
}

// Export for use in tests
module.exports = {
  performance: global.testUtils.performance,
  testUtils: global.testUtils
}; 