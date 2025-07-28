/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * Lazy Loader Utility for CKEditor 5
 * 
 * Provides efficient lazy loading and caching of CKEditor modules
 * to improve performance and reduce initial bundle size.
 */

interface ModuleCache {
  [key: string]: {
    module: any;
    timestamp: number;
    size: number;
  };
}

interface LoaderConfig {
  maxCacheSize: number;
  maxCacheAge: number;
  preloadModules: string[];
  enableCompression: boolean;
}

export class LazyLoader {
  private cache: ModuleCache = {};
  private config: LoaderConfig;
  private loadingPromises: Map<string, Promise<any>> = new Map();

  constructor(config: Partial<LoaderConfig> = {}) {
    this.config = {
      maxCacheSize: 50 * 1024 * 1024, // 50MB
      maxCacheAge: 5 * 60 * 1000, // 5 minutes
      preloadModules: [],
      enableCompression: true,
      ...config
    };

    this.initializePreload();
  }

  /**
   * Loads a module lazily with caching
   */
  async loadModule<T = any>(modulePath: string): Promise<T> {
    // Check if already loading
    if (this.loadingPromises.has(modulePath)) {
      return this.loadingPromises.get(modulePath) as Promise<T>;
    }

    // Check cache first
    const cached = this.getFromCache(modulePath);
    if (cached) {
      return cached as T;
    }

    // Create loading promise
    const loadingPromise = this.loadModuleInternal<T>(modulePath);
    this.loadingPromises.set(modulePath, loadingPromise);

    try {
      const module = await loadingPromise;
      this.addToCache(modulePath, module);
      return module;
    } finally {
      this.loadingPromises.delete(modulePath);
    }
  }

  /**
   * Loads multiple modules in parallel
   */
  async loadModules<T = any>(modulePaths: string[]): Promise<T[]> {
    const promises = modulePaths.map(path => this.loadModule<T>(path));
    return Promise.all(promises);
  }

  /**
   * Preloads essential modules
   */
  private async initializePreload(): Promise<void> {
    if (this.config.preloadModules.length > 0) {
      // Preload in background without blocking
      setTimeout(() => {
        this.loadModules(this.config.preloadModules).catch(console.warn);
      }, 100);
    }
  }

  /**
   * Internal module loading with performance monitoring
   */
  private async loadModuleInternal<T>(modulePath: string): Promise<T> {
    const startTime = performance.now();
    
    try {
      // Dynamic import with error handling
      const module = await import(/* webpackChunkName: "[request]" */ modulePath);
      const endTime = performance.now();
      
      console.log(`Module ${modulePath} loaded in ${endTime - startTime}ms`);
      
      return module.default || module;
    } catch (error) {
      console.error(`Failed to load module ${modulePath}:`, error);
      throw error;
    }
  }

  /**
   * Cache management
   */
  private getFromCache(modulePath: string): any | null {
    const cached = this.cache[modulePath];
    
    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.config.maxCacheAge) {
      this.removeFromCache(modulePath);
      return null;
    }

    return cached.module;
  }

  private addToCache(modulePath: string, module: any): void {
    const size = this.estimateModuleSize(module);
    
    // Check if adding this module would exceed cache size
    if (this.getCacheSize() + size > this.config.maxCacheSize) {
      this.cleanupCache();
    }

    this.cache[modulePath] = {
      module,
      timestamp: Date.now(),
      size
    };
  }

  private removeFromCache(modulePath: string): void {
    delete this.cache[modulePath];
  }

  private cleanupCache(): void {
    const entries = Object.entries(this.cache);
    
    // Sort by timestamp (oldest first)
    entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    // Remove oldest entries until we're under the limit
    let currentSize = this.getCacheSize();
    const targetSize = this.config.maxCacheSize * 0.8; // Keep 80% of max size
    
    for (const [path, entry] of entries) {
      if (currentSize <= targetSize) {
        break;
      }
      
      this.removeFromCache(path);
      currentSize -= entry.size;
    }
  }

  private getCacheSize(): number {
    return Object.values(this.cache).reduce((total, entry) => total + entry.size, 0);
  }

  private estimateModuleSize(module: any): number {
    // Rough estimation of module size in bytes
    const jsonString = JSON.stringify(module);
    return new Blob([jsonString]).size;
  }

  /**
   * Cache statistics
   */
  getCacheStats(): {
    size: number;
    entryCount: number;
    hitRate: number;
  } {
    const entries = Object.values(this.cache);
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    
    return {
      size: totalSize,
      entryCount: entries.length,
      hitRate: 0 // TODO: Implement hit rate tracking
    };
  }

  /**
   * Clear all cache
   */
  clearCache(): void {
    this.cache = {};
  }

  /**
   * Preload specific modules
   */
  preload(modulePaths: string[]): void {
    this.config.preloadModules.push(...modulePaths);
    this.initializePreload();
  }
}

// Singleton instance
export const lazyLoader = new LazyLoader();

// Convenience functions
export const loadModule = <T = any>(modulePath: string): Promise<T> => {
  return lazyLoader.loadModule<T>(modulePath);
};

export const loadModules = <T = any>(modulePaths: string[]): Promise<T[]> => {
  return lazyLoader.loadModules<T>(modulePaths);
}; 