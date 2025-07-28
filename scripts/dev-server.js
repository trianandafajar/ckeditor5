#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * Development Server for CKEditor 5
 * 
 * Provides a fast development server with hot reloading and optimization
 */

const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackHotMiddleware = require('webpack-hot-middleware');
const path = require('path');
const fs = require('fs');
const chokidar = require('chokidar');

class DevServer {
  constructor(options = {}) {
    this.options = {
      port: 9000,
      host: 'localhost',
      open: true,
      hot: true,
      ...options
    };
    
    this.app = express();
    this.compiler = null;
    this.watcher = null;
  }

  /**
   * Start development server
   */
  async start() {
    console.log('🚀 Starting CKEditor 5 Development Server...\n');
    
    try {
      // Setup webpack compiler
      await this.setupWebpack();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup file watching
      this.setupFileWatching();
      
      // Start server
      this.startServer();
      
    } catch (error) {
      console.error('❌ Failed to start development server:', error);
      process.exit(1);
    }
  }

  /**
   * Setup webpack compiler
   */
  async setupWebpack() {
    const webpackConfig = require('../webpack.config.dev.js');
    
    // Add hot reloading if enabled
    if (this.options.hot) {
      webpackConfig.entry = [
        'webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000',
        webpackConfig.entry
      ];
      
      webpackConfig.plugins.push(
        new webpack.HotModuleReplacementPlugin()
      );
    }
    
    this.compiler = webpack(webpackConfig);
    
    // Log compilation status
    this.compiler.hooks.done.tap('DevServer', (stats) => {
      if (stats.hasErrors()) {
        console.error('❌ Build failed with errors:');
        console.error(stats.toString({
          colors: true,
          errorDetails: true
        }));
      } else {
        console.log('✅ Build completed successfully');
        console.log(`⏱️  Build time: ${stats.endTime - stats.startTime}ms`);
      }
    });
  }

  /**
   * Setup middleware
   */
  setupMiddleware() {
    // Webpack dev middleware
    this.app.use(webpackDevMiddleware(this.compiler, {
      publicPath: '/',
      stats: {
        colors: true,
        chunks: false,
        modules: false
      },
      writeToDisk: false
    }));
    
    // Hot reloading middleware
    if (this.options.hot) {
      this.app.use(webpackHotMiddleware(this.compiler));
    }
    
    // Static files
    this.app.use(express.static(path.join(__dirname, '../build/dev')));
    this.app.use(express.static(path.join(__dirname, '../examples')));
    
    // API routes for development
    this.setupApiRoutes();
    
    // Error handling
    this.app.use((err, req, res, next) => {
      console.error('Server error:', err);
      res.status(500).json({ error: err.message });
    });
  }

  /**
   * Setup API routes for development
   */
  setupApiRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });
    
    // Performance metrics
    this.app.get('/api/performance', (req, res) => {
      const usage = process.memoryUsage();
      res.json({
        memory: {
          rss: usage.rss,
          heapTotal: usage.heapTotal,
          heapUsed: usage.heapUsed,
          external: usage.external
        },
        uptime: process.uptime(),
        cpu: process.cpuUsage()
      });
    });
    
    // Build status
    this.app.get('/api/build-status', (req, res) => {
      if (this.compiler) {
        const stats = this.compiler.getStats();
        res.json({
          hasErrors: stats.hasErrors(),
          hasWarnings: stats.hasWarnings(),
          startTime: stats.startTime,
          endTime: stats.endTime
        });
      } else {
        res.json({ error: 'Compiler not available' });
      }
    });
    
    // File system info
    this.app.get('/api/files', (req, res) => {
      const buildDir = path.join(__dirname, '../build/dev');
      const files = this.getDirectoryInfo(buildDir);
      res.json(files);
    });
  }

  /**
   * Setup file watching
   */
  setupFileWatching() {
    const watchPaths = [
      path.join(__dirname, '../src/**/*'),
      path.join(__dirname, '../packages/**/*'),
      path.join(__dirname, '../examples/**/*')
    ];
    
    this.watcher = chokidar.watch(watchPaths, {
      ignored: /node_modules/,
      persistent: true
    });
    
    this.watcher
      .on('ready', () => {
        console.log('👀 File watching ready');
      })
      .on('change', (filePath) => {
        console.log(`📝 File changed: ${path.relative(process.cwd(), filePath)}`);
      })
      .on('add', (filePath) => {
        console.log(`➕ File added: ${path.relative(process.cwd(), filePath)}`);
      })
      .on('unlink', (filePath) => {
        console.log(`➖ File removed: ${path.relative(process.cwd(), filePath)}`);
      });
  }

  /**
   * Start HTTP server
   */
  startServer() {
    const server = this.app.listen(this.options.port, this.options.host, () => {
      const url = `http://${this.options.host}:${this.options.port}`;
      
      console.log('\n🎉 Development server started!');
      console.log(`📍 Local: ${url}`);
      console.log(`🌐 Network: http://${this.getLocalIP()}:${this.options.port}`);
      console.log('\n📁 Available routes:');
      console.log(`   Editor: ${url}/examples/optimized-usage.html`);
      console.log(`   Health: ${url}/api/health`);
      console.log(`   Performance: ${url}/api/performance`);
      console.log(`   Build Status: ${url}/api/build-status`);
      console.log('\n💡 Tips:');
      console.log('   - Press Ctrl+C to stop the server');
      console.log('   - Files are automatically watched for changes');
      console.log('   - Hot reloading is enabled');
      console.log('');
      
      // Open browser if requested
      if (this.options.open) {
        this.openBrowser(url);
      }
    });
    
    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Shutting down development server...');
      server.close(() => {
        if (this.watcher) {
          this.watcher.close();
        }
        process.exit(0);
      });
    });
  }

  /**
   * Get local IP address
   */
  getLocalIP() {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) {
          return net.address;
        }
      }
    }
    
    return 'localhost';
  }

  /**
   * Open browser
   */
  openBrowser(url) {
    const { exec } = require('child_process');
    const platform = process.platform;
    
    let command;
    switch (platform) {
      case 'darwin':
        command = `open "${url}"`;
        break;
      case 'win32':
        command = `start "${url}"`;
        break;
      default:
        command = `xdg-open "${url}"`;
    }
    
    exec(command, (error) => {
      if (error) {
        console.log(`⚠️  Could not open browser automatically. Please visit: ${url}`);
      }
    });
  }

  /**
   * Get directory information
   */
  getDirectoryInfo(dirPath) {
    if (!fs.existsSync(dirPath)) {
      return { error: 'Directory not found' };
    }
    
    const items = fs.readdirSync(dirPath);
    const files = [];
    const directories = [];
    
    items.forEach(item => {
      const itemPath = path.join(dirPath, item);
      const stat = fs.statSync(itemPath);
      
      if (stat.isDirectory()) {
        directories.push({
          name: item,
          path: itemPath,
          size: this.getDirectorySize(itemPath)
        });
      } else {
        files.push({
          name: item,
          path: itemPath,
          size: stat.size,
          modified: stat.mtime
        });
      }
    });
    
    return {
      path: dirPath,
      files: files.sort((a, b) => b.size - a.size),
      directories: directories.sort((a, b) => b.size - a.size),
      totalSize: this.getDirectorySize(dirPath)
    };
  }

  /**
   * Calculate directory size
   */
  getDirectorySize(dirPath) {
    let totalSize = 0;
    
    const calculateSize = (path) => {
      const items = fs.readdirSync(path);
      
      items.forEach(item => {
        const itemPath = path.join(path, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          calculateSize(itemPath);
        } else {
          totalSize += stat.size;
        }
      });
    };
    
    try {
      calculateSize(dirPath);
    } catch (error) {
      // Ignore errors for inaccessible directories
    }
    
    return totalSize;
  }
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const options = {};
  
  // Parse command line arguments
  args.forEach(arg => {
    if (arg.startsWith('--port=')) {
      options.port = parseInt(arg.split('=')[1]);
    } else if (arg.startsWith('--host=')) {
      options.host = arg.split('=')[1];
    } else if (arg === '--no-open') {
      options.open = false;
    } else if (arg === '--no-hot') {
      options.hot = false;
    }
  });
  
  const server = new DevServer(options);
  await server.start();
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = DevServer; 