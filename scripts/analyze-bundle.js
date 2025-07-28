#!/usr/bin/env node

/**
 * @license Copyright (c) 2003-2024, CKSource Holding sp. z o.o. All rights reserved.
 * For licensing, see LICENSE.md or https://ckeditor.com/legal/ckeditor-oss-license
 */

/**
 * Bundle Analyzer for CKEditor 5
 * 
 * Analyzes bundle sizes and provides optimization recommendations
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class BundleAnalyzer {
  constructor() {
    this.buildDir = path.resolve(__dirname, '../build');
    this.reports = [];
  }

  /**
   * Analyze all build configurations
   */
  async analyzeAll() {
    console.log('🔍 Analyzing CKEditor 5 bundles...\n');

    const buildTypes = ['development', 'production', 'lightweight', 'modular'];
    
    for (const buildType of buildTypes) {
      await this.analyzeBuild(buildType);
    }

    this.generateReport();
    this.printRecommendations();
  }

  /**
   * Analyze specific build
   */
  async analyzeBuild(buildType) {
    const buildPath = path.join(this.buildDir, buildType);
    
    if (!fs.existsSync(buildPath)) {
      console.log(`⚠️  Build directory not found: ${buildType}`);
      return;
    }

    console.log(`📦 Analyzing ${buildType} build...`);
    
    const files = this.getBundleFiles(buildPath);
    const analysis = this.analyzeFiles(files, buildType);
    
    this.reports.push(analysis);
    
    console.log(`   Total size: ${this.formatSize(analysis.totalSize)}`);
    console.log(`   File count: ${analysis.fileCount}`);
    console.log(`   Largest file: ${analysis.largestFile.name} (${this.formatSize(analysis.largestFile.size)})`);
    console.log('');
  }

  /**
   * Get bundle files
   */
  getBundleFiles(buildPath) {
    const files = [];
    
    const readDir = (dir) => {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          readDir(itemPath);
        } else if (item.endsWith('.js') || item.endsWith('.css')) {
          files.push({
            name: item,
            path: itemPath,
            size: stat.size,
            relativePath: path.relative(buildPath, itemPath)
          });
        }
      }
    };
    
    readDir(buildPath);
    return files;
  }

  /**
   * Analyze files
   */
  analyzeFiles(files, buildType) {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const largestFile = files.reduce((largest, current) => 
      current.size > largest.size ? current : largest
    );
    
    const sizeDistribution = this.calculateSizeDistribution(files);
    const moduleAnalysis = this.analyzeModules(files);
    
    return {
      buildType,
      totalSize,
      fileCount: files.length,
      largestFile,
      files: files.sort((a, b) => b.size - a.size),
      sizeDistribution,
      moduleAnalysis,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate size distribution
   */
  calculateSizeDistribution(files) {
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    
    return {
      total: totalSize,
      average: totalSize / files.length,
      median: this.calculateMedian(files.map(f => f.size)),
      gzipped: this.estimateGzippedSize(totalSize)
    };
  }

  /**
   * Analyze modules
   */
  analyzeModules(files) {
    const modules = {};
    
    files.forEach(file => {
      const moduleName = this.extractModuleName(file.name);
      if (!modules[moduleName]) {
        modules[moduleName] = {
          size: 0,
          files: []
        };
      }
      
      modules[moduleName].size += file.size;
      modules[moduleName].files.push(file);
    });
    
    return Object.entries(modules)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.size - a.size);
  }

  /**
   * Extract module name from filename
   */
  extractModuleName(filename) {
    if (filename.includes('ckeditor5')) {
      return 'ckeditor5-core';
    } else if (filename.includes('vendor')) {
      return 'vendors';
    } else if (filename.includes('chunk')) {
      return 'chunks';
    } else {
      return 'other';
    }
  }

  /**
   * Calculate median
   */
  calculateMedian(values) {
    const sorted = values.sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    } else {
      return sorted[middle];
    }
  }

  /**
   * Estimate gzipped size
   */
  estimateGzippedSize(size) {
    // Rough estimation: gzip typically reduces size by 60-80%
    return Math.round(size * 0.3);
  }

  /**
   * Format size
   */
  formatSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    const report = {
      summary: {
        totalBuilds: this.reports.length,
        timestamp: new Date().toISOString(),
        totalSize: this.reports.reduce((sum, r) => sum + r.totalSize, 0)
      },
      builds: this.reports,
      recommendations: this.generateRecommendations()
    };
    
    const reportPath = path.join(this.buildDir, 'bundle-analysis.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📊 Bundle analysis report saved to: ${reportPath}`);
  }

  /**
   * Generate optimization recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    // Analyze each build
    this.reports.forEach(report => {
      if (report.totalSize > 1024 * 1024) { // > 1MB
        recommendations.push({
          buildType: report.buildType,
          issue: 'Bundle size is too large',
          suggestion: 'Consider using code splitting or removing unused features',
          priority: 'high'
        });
      }
      
      if (report.fileCount > 10) {
        recommendations.push({
          buildType: report.buildType,
          issue: 'Too many files',
          suggestion: 'Consider bundling related files together',
          priority: 'medium'
        });
      }
      
      const largestFileSize = report.largestFile.size;
      if (largestFileSize > 500 * 1024) { // > 500KB
        recommendations.push({
          buildType: report.buildType,
          issue: 'Largest file is too big',
          suggestion: 'Split large files or use dynamic imports',
          priority: 'high'
        });
      }
    });
    
    return recommendations;
  }

  /**
   * Print recommendations
   */
  printRecommendations() {
    console.log('💡 Optimization Recommendations:');
    console.log('================================');
    
    const recommendations = this.generateRecommendations();
    
    if (recommendations.length === 0) {
      console.log('✅ No optimization issues found!');
      return;
    }
    
    recommendations.forEach((rec, index) => {
      console.log(`${index + 1}. [${rec.buildType}] ${rec.issue}`);
      console.log(`   Suggestion: ${rec.suggestion}`);
      console.log(`   Priority: ${rec.priority.toUpperCase()}`);
      console.log('');
    });
  }

  /**
   * Compare builds
   */
  compareBuilds() {
    console.log('📈 Build Comparison:');
    console.log('===================');
    
    this.reports.forEach(report => {
      console.log(`${report.buildType}:`);
      console.log(`  Size: ${this.formatSize(report.totalSize)}`);
      console.log(`  Gzipped: ~${this.formatSize(this.estimateGzippedSize(report.totalSize))}`);
      console.log(`  Files: ${report.fileCount}`);
      console.log('');
    });
  }

  /**
   * Generate HTML report
   */
  generateHtmlReport() {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>CKEditor 5 Bundle Analysis</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .build { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
        .file { margin: 5px 0; padding: 5px; background: #f5f5f5; }
        .size { color: #666; }
        .recommendation { background: #fff3cd; padding: 10px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>CKEditor 5 Bundle Analysis</h1>
    <p>Generated: ${new Date().toLocaleString()}</p>
    
    ${this.reports.map(report => `
        <div class="build">
            <h2>${report.buildType} Build</h2>
            <p><strong>Total Size:</strong> ${this.formatSize(report.totalSize)}</p>
            <p><strong>Files:</strong> ${report.fileCount}</p>
            
            <h3>Largest Files:</h3>
            ${report.files.slice(0, 5).map(file => `
                <div class="file">
                    ${file.name} <span class="size">(${this.formatSize(file.size)})</span>
                </div>
            `).join('')}
        </div>
    `).join('')}
</body>
</html>`;
    
    const htmlPath = path.join(this.buildDir, 'bundle-analysis.html');
    fs.writeFileSync(htmlPath, html);
    
    console.log(`📄 HTML report saved to: ${htmlPath}`);
  }
}

// Main function
async function main() {
  const analyzer = new BundleAnalyzer();
  
  try {
    await analyzer.analyzeAll();
    analyzer.compareBuilds();
    analyzer.generateHtmlReport();
    
    console.log('✅ Bundle analysis completed!');
  } catch (error) {
    console.error('❌ Bundle analysis failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = BundleAnalyzer; 