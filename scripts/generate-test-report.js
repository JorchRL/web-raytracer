#!/usr/bin/env node

/**
 * Test Report Generator for WebGPU Interactive Raytracer
 * 
 * Generates a user-friendly HTML report from test results JSON,
 * specifically designed to be concise and informative for AI reviewers.
 */

import fs from 'fs';
import path from 'path';

const TEST_RESULTS_PATH = path.join(process.cwd(), 'test-results.json');
const REPORT_OUTPUT_PATH = path.join(process.cwd(), 'test-report.html');

// Generate an HTML report from test results
function generateReport() {
  // Check if results file exists
  if (!fs.existsSync(TEST_RESULTS_PATH)) {
    console.error('Test results file not found. Run "npm run test:ci" first.');
    process.exit(1);
  }
  
  // Read and parse the results
  const resultsJson = fs.readFileSync(TEST_RESULTS_PATH, 'utf-8');
  const results = JSON.parse(resultsJson);
  
  // Extract key stats
  const { numPassedTests, numFailedTests, numTotalTests, testResults } = results;
  const passRate = Math.round((numPassedTests / numTotalTests) * 100);
  
  // Group test results by module
  const moduleResults = {};
  
  for (const testFile of testResults) {
    const moduleName = path.basename(testFile.name, '.test.js');
    
    if (!moduleResults[moduleName]) {
      moduleResults[moduleName] = {
        passed: 0,
        failed: 0,
        total: 0,
        failures: []
      };
    }
    
    // Count results and collect failures
    for (const assertion of testFile.assertionResults) {
      moduleResults[moduleName].total++;
      
      if (assertion.status === 'passed') {
        moduleResults[moduleName].passed++;
      } else {
        moduleResults[moduleName].failed++;
        moduleResults[moduleName].failures.push({
          title: assertion.title,
          fullName: assertion.fullName,
          message: assertion.failureMessages?.[0] || 'Unknown error'
        });
      }
    }
  }
  
  // Generate HTML content
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>WebGPU Raytracer - Test Report</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      header {
        background-color: #f8f9fa;
        padding: 20px;
        border-radius: 5px;
        margin-bottom: 20px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      h1 {
        margin-top: 0;
        color: #333;
      }
      .summary {
        display: flex;
        gap: 20px;
        margin-bottom: 20px;
      }
      .stat-card {
        background: white;
        padding: 15px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        flex: 1;
      }
      .stat-card h2 {
        margin-top: 0;
        font-size: 16px;
        color: #555;
      }
      .stat-value {
        font-size: 32px;
        font-weight: bold;
      }
      .passed { color: #28a745; }
      .failed { color: #dc3545; }
      .total { color: #007bff; }
      .pass-rate { color: #6f42c1; }
      
      .module-card {
        background: white;
        padding: 20px;
        border-radius: 5px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        margin-bottom: 20px;
      }
      .module-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
      }
      .module-name {
        margin: 0;
        font-size: 20px;
      }
      .module-stats {
        display: flex;
        gap: 10px;
      }
      .module-stat {
        padding: 4px 8px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: bold;
      }
      .module-passed {
        background-color: rgba(40, 167, 69, 0.2);
        color: #28a745;
      }
      .module-failed {
        background-color: rgba(220, 53, 69, 0.2);
        color: #dc3545;
      }
      
      .failure-item {
        background-color: #f8d7da;
        border-left: 4px solid #dc3545;
        padding: 10px 15px;
        margin-bottom: 10px;
        border-radius: 0 4px 4px 0;
      }
      .failure-title {
        font-weight: bold;
        margin-bottom: 5px;
      }
      .failure-message {
        font-family: monospace;
        font-size: 14px;
        white-space: pre-wrap;
        margin: 10px 0;
        padding: 10px;
        background-color: rgba(0,0,0,0.03);
        border-radius: 4px;
        overflow-x: auto;
      }
      
      .no-failures {
        padding: 10px;
        background-color: rgba(40, 167, 69, 0.1);
        border-radius: 4px;
        color: #28a745;
      }
      
      @media (max-width: 768px) {
        .summary {
          flex-direction: column;
        }
      }
    </style>
  </head>
  <body>
    <header>
      <h1>WebGPU Interactive Raytracer - Test Report</h1>
      <p>Test run completed at ${new Date().toLocaleString()}</p>
    </header>
    
    <div class="summary">
      <div class="stat-card">
        <h2>Passed Tests</h2>
        <div class="stat-value passed">${numPassedTests}</div>
      </div>
      <div class="stat-card">
        <h2>Failed Tests</h2>
        <div class="stat-value failed">${numFailedTests}</div>
      </div>
      <div class="stat-card">
        <h2>Total Tests</h2>
        <div class="stat-value total">${numTotalTests}</div>
      </div>
      <div class="stat-card">
        <h2>Pass Rate</h2>
        <div class="stat-value pass-rate">${passRate}%</div>
      </div>
    </div>
    
    <h2>Results by Module</h2>
    
    ${Object.entries(moduleResults).map(([moduleName, moduleData]) => `
      <div class="module-card">
        <div class="module-header">
          <h3 class="module-name">${moduleName}</h3>
          <div class="module-stats">
            <span class="module-stat module-passed">${moduleData.passed} passed</span>
            ${moduleData.failed > 0 ? `<span class="module-stat module-failed">${moduleData.failed} failed</span>` : ''}
          </div>
        </div>
        
        ${moduleData.failures.length > 0 ? `
          <div class="failures">
            <h4>Failures</h4>
            ${moduleData.failures.map(failure => `
              <div class="failure-item">
                <div class="failure-title">${failure.title}</div>
                <div class="failure-message">${formatErrorMessage(failure.message)}</div>
              </div>
            `).join('')}
          </div>
        ` : `
          <div class="no-failures">
            All tests passing!
          </div>
        `}
      </div>
    `).join('')}
    
    <footer>
      <p>Report generated for WebGPU Interactive Raytracer. View detailed JSON results in <code>test-results.json</code>.</p>
    </footer>
  </body>
  </html>
  `;
  
  // Write the HTML report
  fs.writeFileSync(REPORT_OUTPUT_PATH, htmlContent);
  console.log(`Test report generated at: ${REPORT_OUTPUT_PATH}`);
}

// Format error message to be more readable
function formatErrorMessage(message) {
  if (!message) return 'No error details available';
  
  // Clean up the error message
  return message
    .replace(/\x1b\[\d+m/g, '') // Remove ANSI color codes
    .replace(/at .*?:\d+:\d+\)?/g, '') // Remove file references
    .replace(/\n\s*at\s+.*$/gm, '') // Remove stack trace
    .replace(/^\s*Error: /, '') // Remove "Error:" prefix
    .trim();
}

// Run the report generation
generateReport(); 