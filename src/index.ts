/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * CKEditor 5 - Optimized and Scalable Rich Text Editor
 * 
 * This is the main entry point for CKEditor 5 with optimizations for:
 * - Lazy loading of features
 * - Tree shaking support
 * - Modular architecture
 * - Performance optimizations
 */

// Core exports - always available
export * from '@ckeditor/ckeditor5-core';
export * from '@ckeditor/ckeditor5-engine';
export * from '@ckeditor/ckeditor5-ui';
export * from '@ckeditor/ckeditor5-utils';

// Essential features - loaded by default
export * from '@ckeditor/ckeditor5-essentials';
export * from '@ckeditor/ckeditor5-paragraph';
export * from '@ckeditor/ckeditor5-typing';
export * from '@ckeditor/ckeditor5-undo';
export * from '@ckeditor/ckeditor5-enter';
export * from '@ckeditor/ckeditor5-select-all';
export * from '@ckeditor/ckeditor5-clipboard';
export * from '@ckeditor/ckeditor5-upload';
export * from '@ckeditor/ckeditor5-widget';

// Editor types
export * from '@ckeditor/ckeditor5-editor-classic';
export * from '@ckeditor/ckeditor5-editor-inline';
export * from '@ckeditor/ckeditor5-editor-balloon';
export * from '@ckeditor/ckeditor5-editor-decoupled';

// Lazy loading utilities
export const lazyLoad = {
  // Basic styling features
  basicStyles: () => import('@ckeditor/ckeditor5-basic-styles'),
  heading: () => import('@ckeditor/ckeditor5-heading'),
  list: () => import('@ckeditor/ckeditor5-list'),
  link: () => import('@ckeditor/ckeditor5-link'),
  
  // Media features
  image: () => import('@ckeditor/ckeditor5-image'),
  mediaEmbed: () => import('@ckeditor/ckeditor5-media-embed'),
  table: () => import('@ckeditor/ckeditor5-table'),
  
  // Advanced features
  codeBlock: () => import('@ckeditor/ckeditor5-code-block'),
  blockQuote: () => import('@ckeditor/ckeditor5-block-quote'),
  horizontalLine: () => import('@ckeditor/ckeditor5-horizontal-line'),
  pageBreak: () => import('@ckeditor/ckeditor5-page-break'),
  
  // Formatting features
  alignment: () => import('@ckeditor/ckeditor5-alignment'),
  font: () => import('@ckeditor/ckeditor5-font'),
  highlight: () => import('@ckeditor/ckeditor5-highlight'),
  indent: () => import('@ckeditor/ckeditor5-indent'),
  removeFormat: () => import('@ckeditor/ckeditor5-remove-format'),
  
  // Utility features
  findAndReplace: () => import('@ckeditor/ckeditor5-find-and-replace'),
  sourceEditing: () => import('@ckeditor/ckeditor5-source-editing'),
  specialCharacters: () => import('@ckeditor/ckeditor5-special-characters'),
  wordCount: () => import('@ckeditor/ckeditor5-word-count'),
  
  // Collaboration features
  mention: () => import('@ckeditor/ckeditor5-mention'),
  restrictedEditing: () => import('@ckeditor/ckeditor5-restricted-editing'),
  
  // Cloud services
  cloudServices: () => import('@ckeditor/ckeditor5-cloud-services'),
  easyImage: () => import('@ckeditor/ckeditor5-easy-image'),
  
  // Auto features
  autoformat: () => import('@ckeditor/ckeditor5-autoformat'),
  autosave: () => import('@ckeditor/ckeditor5-autosave'),
  
  // Language and accessibility
  language: () => import('@ckeditor/ckeditor5-language'),
  
  // Office integration
  pasteFromOffice: () => import('@ckeditor/ckeditor5-paste-from-office'),
  
  // HTML support
  htmlSupport: () => import('@ckeditor/ckeditor5-html-support'),
  htmlEmbed: () => import('@ckeditor/ckeditor5-html-embed'),
  
  // Markdown support
  markdownGfm: () => import('@ckeditor/ckeditor5-markdown-gfm'),
  
  // External integrations
  ckfinder: () => import('@ckeditor/ckeditor5-ckfinder'),
  adapterCkfinder: () => import('@ckeditor/ckeditor5-adapter-ckfinder'),
  ckbox: () => import('@ckeditor/ckeditor5-ckbox'),
  
  // Watchdog for stability
  watchdog: () => import('@ckeditor/ckeditor5-watchdog')
};

// Performance monitoring utilities
export const performance = {
  measure: (name: string, fn: () => any) => {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${end - start}ms`);
    return result;
  },
  
  async measureAsync: async (name: string, fn: () => Promise<any>) => {
    const start = performance.now();
    const result = await fn();
    const end = performance.now();
    console.log(`${name} took ${end - start}ms`);
    return result;
  }
};

// Memory management utilities
export const memory = {
  cleanup: () => {
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
  },
  
  getMemoryUsage: () => {
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage();
    }
    return null;
  }
};

// Default configuration for optimal performance
export const defaultConfig = {
  // Performance optimizations
  performance: {
    enableLazyLoading: true,
    enableTreeShaking: true,
    enableCodeSplitting: true,
    enableMinification: true
  },
  
  // Memory management
  memory: {
    enableGarbageCollection: true,
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    cleanupInterval: 30000 // 30 seconds
  },
  
  // Feature loading strategy
  features: {
    loadOnDemand: true,
    preloadEssential: true,
    cacheModules: true
  }
};

// Type definitions for better TypeScript support
export interface CKEditorConfig {
  performance?: {
    enableLazyLoading?: boolean;
    enableTreeShaking?: boolean;
    enableCodeSplitting?: boolean;
    enableMinification?: boolean;
  };
  memory?: {
    enableGarbageCollection?: boolean;
    maxMemoryUsage?: number;
    cleanupInterval?: number;
  };
  features?: {
    loadOnDemand?: boolean;
    preloadEssential?: boolean;
    cacheModules?: boolean;
  };
}

// Version information
export const VERSION = '35.3.0-optimized';
export const BUILD_DATE = new Date().toISOString(); 