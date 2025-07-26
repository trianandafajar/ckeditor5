/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * Optimized Jest Configuration for CKEditor 5
 * 
 * Provides fast and efficient testing setup with coverage and performance monitoring
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Test file patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,ts}',
    '<rootDir>/src/**/*.{test,spec}.{js,ts}',
    '<rootDir>/packages/**/__tests__/**/*.{js,ts}',
    '<rootDir>/packages/**/*.{test,spec}.{js,ts}'
  ],
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/build/',
    '/dist/',
    '/coverage/'
  ],
  
  // Module file extensions
  moduleFileExtensions: ['js', 'ts', 'json'],
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@packages/(.*)$': '<rootDir>/packages/$1',
    '^@core/(.*)$': '<rootDir>/packages/ckeditor5-core/$1',
    '^@engine/(.*)$': '<rootDir>/packages/ckeditor5-engine/$1',
    '^@ui/(.*)$': '<rootDir>/packages/ckeditor5-ui/$1',
    '^@utils/(.*)$': '<rootDir>/packages/ckeditor5-utils/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest',
    '^.+\\.js$': 'babel-jest'
  },
  
  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tsconfig.optimized.json',
      diagnostics: {
        ignoreCodes: [151001]
      }
    }
  },
  
  // Setup files
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.js'
  ],
  
  // Coverage configuration
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    'packages/**/src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!packages/**/src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!packages/**/src/**/__tests__/**',
    '!src/**/*.{test,spec}.{js,ts}',
    '!packages/**/src/**/*.{test,spec}.{js,ts}'
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  
  // Coverage reporters
  coverageReporters: [
    'text',
    'text-summary',
    'html',
    'lcov',
    'json'
  ],
  
  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',
  
  // Performance monitoring
  reporters: [
    'default',
    ['jest-performance-reporter', {
      outputFile: '<rootDir>/coverage/performance-report.json',
      includeConsoleOutput: true
    }]
  ],
  
  // Test timeout
  testTimeout: 10000,
  
  // Maximum workers
  maxWorkers: '50%',
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Watch configuration
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ],
  
  // Verbose output
  verbose: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks between tests
  restoreMocks: true,
  
  // Reset modules between tests
  resetModules: true,
  
  // Module resolution
  moduleDirectories: ['node_modules', 'src'],
  
  // Test environment setup
  testEnvironmentOptions: {
    url: 'http://localhost'
  },
  
  // Global setup and teardown
  globalSetup: '<rootDir>/tests/global-setup.js',
  globalTeardown: '<rootDir>/tests/global-teardown.js',
  
  // Projects for different test types
  projects: [
    {
      displayName: 'unit',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.unit.{js,ts}',
        '<rootDir>/src/**/*.unit.{test,spec}.{js,ts}'
      ],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup-unit.js'
      ]
    },
    {
      displayName: 'integration',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.integration.{js,ts}',
        '<rootDir>/src/**/*.integration.{test,spec}.{js,ts}'
      ],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup-integration.js'
      ],
      testTimeout: 30000
    },
    {
      displayName: 'performance',
      testMatch: [
        '<rootDir>/src/**/__tests__/**/*.performance.{js,ts}',
        '<rootDir>/src/**/*.performance.{test,spec}.{js,ts}'
      ],
      setupFilesAfterEnv: [
        '<rootDir>/tests/setup-performance.js'
      ],
      testTimeout: 60000
    }
  ],
  
  // Custom test runner
  runner: 'jest-runner',
  
  // Test retry configuration
  retryTimes: 2,
  
  // Snapshot configuration
  snapshotSerializers: [
    'jest-serializer-path'
  ],
  
  // Module extensions
  extensionsToTreatAsEsm: ['.ts'],
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    'node_modules/(?!(ckeditor5|@ckeditor)/)'
  ],
  
  // Module resolution extensions
  resolver: '<rootDir>/tests/resolver.js',
  
  // Test location
  testLocationInResults: true,
  
  // Update snapshots
  updateSnapshot: 'new',
  
  // Watch mode configuration
  watchPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/build/',
    '<rootDir>/coverage/'
  ],
  
  // Notify mode
  notify: true,
  
  // Notify mode configuration
  notifyMode: 'change',
  
  // Error on coverage threshold failure
  errorOnDeprecated: true,
  
  // Force exit
  forceExit: true,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Log heap usage
  logHeapUsage: true,
  
  // Run tests in band
  runInBand: false,
  
  // Use real timers
  timers: 'real',
  
  // Test environment options
  testEnvironmentOptions: {
    customExportConditions: ['node', 'node-addons']
  }
}; 