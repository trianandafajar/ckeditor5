#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * Optimized Build Script for CKEditor 5
 * 
 * Provides multiple build configurations for different use cases:
 * - Development build with source maps
 * - Production build with minification
 * - Lightweight build with minimal features
 * - Full build with all features
 */

const webpack = require('webpack');
const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Build configurations
const buildConfigs = {
  development: {
    mode: 'development',
    devtool: 'source-map',
    optimization: {
      minimize: false,
      splitChunks: false
    }
  },
  
  production: {
    mode: 'production',
    devtool: false,
    optimization: {
      minimize: true,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 10
          },
          core: {
            test: /[\\/]packages[\\/]ckeditor5-(core|engine|ui)[\\/]/,
            name: 'core',
            chunks: 'all',
            priority: 20
          }
        }
      }
    }
  },
  
  lightweight: {
    mode: 'production',
    devtool: false,
    optimization: {
      minimize: true,
      splitChunks: false
    },
    externals: {
      '@ckeditor/ckeditor5-basic-styles': 'CKEditor5.basicStyles',
      '@ckeditor/ckeditor5-heading': 'CKEditor5.heading',
      '@ckeditor/ckeditor5-list': 'CKEditor5.list',
      '@ckeditor/ckeditor5-link': 'CKEditor5.link',
      '@ckeditor/ckeditor5-image': 'CKEditor5.image',
      '@ckeditor/ckeditor5-table': 'CKEditor5.table'
    }
  },
  
  modular: {
    mode: 'production',
    devtool: false,
    optimization: {
      minimize: true,
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          core: {
            test: /[\\/]packages[\\/]ckeditor5-(core|engine|ui|utils)[\\/]/,
            name: 'core',
            chunks: 'all',
            priority: 30
          },
          essentials: {
            test: /[\\/]packages[\\/]ckeditor5-(essentials|paragraph|typing|undo|enter|select-all|clipboard|upload|widget)[\\/]/,
            name: 'essentials',
            chunks: 'all',
            priority: 25
          },
          basicFeatures: {
            test: /[\\/]packages[\\/]ckeditor5-(basic-styles|heading|list|link)[\\/]/,
            name: 'basic-features',
            chunks: 'all',
            priority: 20
          },
          mediaFeatures: {
            test: /[\\/]packages[\\/]ckeditor5-(image|media-embed|table)[\\/]/,
            name: 'media-features',
            chunks: 'all',
            priority: 15
          },
          advancedFeatures: {
            test: /[\\/]packages[\\/]ckeditor5-(code-block|block-quote|horizontal-line|page-break|alignment|font|highlight|indent|remove-format)[\\/]/,
            name: 'advanced-features',
            chunks: 'all',
            priority: 10
          },
          utilityFeatures: {
            test: /[\\/]packages[\\/]ckeditor5-(find-and-replace|source-editing|special-characters|word-count)[\\/]/,
            name: 'utility-features',
            chunks: 'all',
            priority: 5
          },
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
            priority: 1
          }
        }
      }
    }
  }
};

// Base webpack configuration
function createWebpackConfig(buildType, options = {}) {
  const config = buildConfigs[buildType];
  
  if (!config) {
    throw new Error(`Unknown build type: ${buildType}`);
  }

  return {
    ...config,
    entry: {
      'ckeditor5': './src/index.ts',
      ...options.additionalEntries
    },
    output: {
      path: path.resolve(__dirname, '../build', buildType),
      filename: '[name].js',
      chunkFilename: '[name].[chunkhash].js',
      library: 'CKEditor5',
      libraryTarget: 'umd',
      globalObject: 'this',
      clean: true
    },
    resolve: {
      extensions: ['.ts', '.js', '.json'],
      alias: {
        '@': path.resolve(__dirname, '../src'),
        '@packages': path.resolve(__dirname, '../packages')
      }
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, '../tsconfig.optimized.json'),
              transpileOnly: buildType === 'development',
              experimentalWatchApi: false
            }
          },
          exclude: /node_modules/
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
                modules: false
              }
            },
            'postcss-loader'
          ]
        },
        {
          test: /\.svg$/,
          use: {
            loader: 'raw-loader',
            options: {
              esModule: false
            }
          }
        }
      ]
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(config.mode),
        'process.env.BUILD_TYPE': JSON.stringify(buildType),
        'process.env.VERSION': JSON.stringify(require('../package.json').version)
      }),
      ...(options.plugins || [])
    ],
    externals: {
      ...config.externals,
      ...options.externals
    },
    performance: {
      hints: buildType === 'production' ? 'warning' : false,
      maxEntrypointSize: 512000,
      maxAssetSize: 512000
    }
  };
}

// Build function
async function build(buildType, options = {}) {
  console.log(`Building CKEditor 5 (${buildType})...`);
  
  const startTime = Date.now();
  const config = createWebpackConfig(buildType, options);
  
  return new Promise((resolve, reject) => {
    webpack(config, (err, stats) => {
      if (err) {
        console.error('Build failed:', err);
        reject(err);
        return;
      }
      
      if (stats.hasErrors()) {
        console.error('Build failed with errors:', stats.toString({
          colors: true,
          errorDetails: true
        }));
        reject(new Error('Build failed with errors'));
        return;
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`Build completed in ${duration}ms`);
      console.log(stats.toString({
        colors: true,
        chunks: false,
        modules: false
      }));
      
      // Generate build report
      generateBuildReport(buildType, stats, duration);
      
      resolve(stats);
    });
  });
}

// Generate build report
function generateBuildReport(buildType, stats, duration) {
  const report = {
    buildType,
    duration,
    timestamp: new Date().toISOString(),
    assets: stats.toJson().assets.map(asset => ({
      name: asset.name,
      size: asset.size,
      chunks: asset.chunks
    })),
    chunks: stats.toJson().chunks.map(chunk => ({
      name: chunk.names[0],
      size: chunk.size,
      modules: chunk.modules.length
    }))
  };
  
  const reportPath = path.resolve(__dirname, '../build', buildType, 'build-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  
  console.log(`Build report saved to: ${reportPath}`);
}

// Analyze bundle size
function analyzeBundle(buildType) {
  const bundlePath = path.resolve(__dirname, '../build', buildType);
  
  if (!fs.existsSync(bundlePath)) {
    console.error(`Build directory not found: ${bundlePath}`);
    return;
  }
  
  console.log(`Analyzing bundle size for ${buildType}...`);
  
  const files = fs.readdirSync(bundlePath)
    .filter(file => file.endsWith('.js'))
    .map(file => {
      const filePath = path.join(bundlePath, file);
      const stats = fs.statSync(filePath);
      return {
        name: file,
        size: stats.size,
        sizeKB: (stats.size / 1024).toFixed(2)
      };
    })
    .sort((a, b) => b.size - a.size);
  
  console.log('\nBundle size analysis:');
  console.log('====================');
  
  files.forEach(file => {
    console.log(`${file.name}: ${file.sizeKB} KB`);
  });
  
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  console.log(`\nTotal size: ${(totalSize / 1024).toFixed(2)} KB`);
}

// Main function
async function main() {
  const args = process.argv.slice(2);
  const buildType = args[0] || 'production';
  const shouldAnalyze = args.includes('--analyze');
  
  try {
    // Clean build directory
    const buildDir = path.resolve(__dirname, '../build');
    if (fs.existsSync(buildDir)) {
      fs.rmSync(buildDir, { recursive: true, force: true });
    }
    
    // Build
    await build(buildType);
    
    // Analyze if requested
    if (shouldAnalyze) {
      analyzeBundle(buildType);
    }
    
    console.log('Build completed successfully!');
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  build,
  createWebpackConfig,
  analyzeBundle,
  buildConfigs
}; 