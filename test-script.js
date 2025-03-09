#!/usr/bin/env node

/**
 * Custom test runner script for the WebGPU raytracer project
 * 
 * Runs tests and outputs condensed, easy-to-understand results 
 * focused on critical information to keep the context window minimal.
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// ANSI colors for better readability
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m'
};

// Function to extract module name from test file path
function getModuleName(testPath) {
  const filename = path.basename(testPath, '.test.js');
  return filename.charAt(0).toUpperCase() + filename.slice(1);
}

// Run the tests with detailed output to parse
try {
  // Run vitest with JSON output format for better parsing
  const vitestOutput = execSync('npx vitest run --reporter=json', { 
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'] 
  });
  
  // Parse the JSON output
  const results = JSON.parse(vitestOutput);
  
  // Get test statistics
  const { testResults, numPassedTests, numFailedTests, numTotalTests } = results;
  
  // Success case - all tests passed
  if (numFailedTests === 0) {
    console.log(`${colors.green}${colors.bold}✅ All tests passed! (${numPassedTests}/${numTotalTests})${colors.reset}`);
    process.exit(0);
  }

  // Some tests failed - provide condensed, useful output
  console.log(`${colors.red}${colors.bold}❌ ${numFailedTests}/${numTotalTests} tests failed:${colors.reset}\n`);
  
  // Group failures by module for better organization
  const failuresByModule = {};
  
  for (const testFile of testResults) {
    const moduleName = getModuleName(testFile.name);
    
    // Look for failed assertions in this file
    for (const testSuite of testFile.assertionResults) {
      if (testSuite.status === 'failed') {
        if (!failuresByModule[moduleName]) {
          failuresByModule[moduleName] = [];
        }
        
        // Create a condensed summary of the failure
        const failure = {
          name: testSuite.title,
          message: testSuite.failureMessages[0]
        };
        
        // Extract only the most essential part of the error
        const errorMatch = failure.message.match(/Error: (.*?)(\n|$)/);
        const messageMatch = failure.message.match(/AssertionError: (.*?)(\n|$)/);
        if (errorMatch || messageMatch) {
          failure.condensedMessage = (errorMatch && errorMatch[1]) || (messageMatch && messageMatch[1]) || failure.message;
        } else {
          failure.condensedMessage = 'Unknown error';
        }
        
        failuresByModule[moduleName].push(failure);
      }
    }
  }
  
  // Print failures by module
  for (const [moduleName, failures] of Object.entries(failuresByModule)) {
    console.log(`${colors.blue}${colors.bold}${moduleName} Module:${colors.reset}`);
    
    for (const failure of failures) {
      console.log(`  ${colors.red}• ${failure.name}${colors.reset}`);
      console.log(`    ${colors.yellow}${failure.condensedMessage}${colors.reset}`);
      
      // Extract line information if available
      const lineMatch = failure.message.match(/at .*?:(\d+):(\d+)/);
      if (lineMatch) {
        console.log(`    ${colors.magenta}(Line ${lineMatch[1]})${colors.reset}`);
      }
      console.log('');
    }
  }
  
  // Provide a concise summary
  console.log(`${colors.bold}${colors.cyan}Summary:${colors.reset}`);
  console.log(`- ${colors.green}${numPassedTests} tests passed${colors.reset}`);
  console.log(`- ${colors.red}${numFailedTests} tests failed${colors.reset}`);
  
  // Write detailed results to file for reference
  fs.writeFileSync('test-detailed-results.json', JSON.stringify(results, null, 2));
  console.log(`\nDetailed results written to ${colors.cyan}test-detailed-results.json${colors.reset}`);
  
  process.exit(1);
  
} catch (error) {
  // Test runner error (not test failures)
  console.error(`${colors.red}${colors.bold}Error running tests:${colors.reset}`);
  console.error(error.stdout?.toString() || error.message);
  
  // Try to parse any output that might be available
  try {
    const errorOutput = error.stdout?.toString() || '';
    const failedTestsMatch = errorOutput.match(/(\d+) failed/);
    const totalTestsMatch = errorOutput.match(/Tests\s+(\d+)/);
    
    if (failedTestsMatch && totalTestsMatch) {
      const failedTests = parseInt(failedTestsMatch[1]);
      const totalTests = parseInt(totalTestsMatch[1]);
      
      console.log(`\n${colors.red}${colors.bold}❌ ${failedTests}/${totalTests} tests failed:${colors.reset}`);
      
      // Extract and display failed test names if possible
      const failedTestLines = errorOutput
        .split('\n')
        .filter(line => line.includes('FAIL') || line.includes('✗'));
      
      if (failedTestLines.length > 0) {
        console.log(failedTestLines.join('\n'));
      }
    }
  } catch (parseError) {
    // If parsing fails, just output what we have
    console.log('Failed to parse test output');
  }
  
  process.exit(1);
} 