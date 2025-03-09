/**
 * Script to run visual tests and display the results
 */
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  // Number of screenshots to keep per test type (preview, raytracing, material)
  keepPerType: 2,
  // Screenshot directory
  screenshotsDir: path.join(__dirname, '..', 'tests-visual', 'screenshots')
};

// Function to run Playwright tests with captured output
async function runPlaywrightTests() {
  return new Promise((resolve, reject) => {
    // Create a string buffer to store the test output
    let testOutput = '';
    let directTestScreenshots = [];
    
    // Run Playwright in headless mode but capture the output
    const playwright = spawn('npx', ['playwright', 'test', '--config=playwright.config.mjs'], {
      stdio: ['inherit', 'pipe', 'pipe'] // Pipe stdout and stderr
    });

    // Capture the output
    playwright.stdout.on('data', (data) => {
      const chunk = data.toString();
      testOutput += chunk;
      
      // Also output to console in real-time
      process.stdout.write(chunk);
      
      // Extract screenshot paths
      const match = chunk.match(/screenshot saved to: (.+\.png)/g);
      if (match) {
        match.forEach(m => {
          const path = m.replace('screenshot saved to: ', '');
          directTestScreenshots.push(path);
        });
      }
    });
    
    playwright.stderr.on('data', (data) => {
      const chunk = data.toString();
      testOutput += chunk;
      process.stderr.write(chunk);
    });

    playwright.on('close', (code) => {
      resolve({
        success: code === 0,
        code,
        testOutput,
        directTestScreenshots
      });
    });
  });
}

// Function to find screenshots in the Playwright test-results directory
// This is useful when tests fail but still capture screenshots
function findTestResultsScreenshots() {
  try {
    // Find all PNG files in the test-results directory
    const command = 'find test-results -name "*.png"';
    const output = execSync(command).toString().trim();
    
    if (!output) return [];
    
    return output.split('\n').map(file => ({
      path: file,
      name: path.basename(file),
      time: fs.statSync(file).mtime.getTime()
    }));
  } catch (error) {
    console.error('Error searching for test result screenshots:', error.message);
    return [];
  }
}

// Function to find the most recent screenshots
function findVisualTestDirScreenshots() {
  if (!fs.existsSync(config.screenshotsDir)) {
    return [];
  }
  
  const files = fs.readdirSync(config.screenshotsDir);
  const screenshots = files
    .filter(file => file.endsWith('.png'))
    .map(file => ({
      path: path.join(config.screenshotsDir, file),
      name: file,
      time: fs.statSync(path.join(config.screenshotsDir, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time); // Sort by most recent first
  
  return screenshots;
}

// Function to categorize screenshots by test type
function categorizeScreenshots(screenshots) {
  const categories = {
    preview: [],
    raytraced: [],
    material: [],
    other: []
  };
  
  screenshots.forEach(screenshot => {
    if (screenshot.name.includes('preview-cornell-box')) {
      categories.preview.push(screenshot);
    } else if (screenshot.name.includes('raytraced-cornell-box')) {
      categories.raytraced.push(screenshot);
    } else if (screenshot.name.includes('blue-reflective-sphere')) {
      categories.material.push(screenshot);
    } else {
      categories.other.push(screenshot);
    }
  });
  
  return categories;
}

// Function to clean up old screenshots, keeping only the most recent ones
function cleanupOldScreenshots(categories) {
  // Count of deleted files
  let deletedCount = 0;
  
  // For each category, keep only the specified number of most recent screenshots
  for (const [category, screenshots] of Object.entries(categories)) {
    // Skip if there aren't more screenshots than we want to keep
    if (screenshots.length <= config.keepPerType) {
      continue;
    }
    
    // Get the files to delete (all except the most recent N)
    const toDelete = screenshots.slice(config.keepPerType);
    
    // Delete the excess files
    for (const screenshot of toDelete) {
      try {
        fs.unlinkSync(screenshot.path);
        deletedCount++;
      } catch (error) {
        console.error(`Error deleting file ${screenshot.path}:`, error.message);
      }
    }
  }
  
  return deletedCount;
}

// Function to create a simplified report focused on paths
function createSimplifiedReport(directScreenshots, resultScreenshots, visualDirScreenshots) {
  // Categorize all screenshots for better organization
  const allScreenshots = [
    ...directScreenshots.map(path => ({ path, name: path.split('/').pop(), source: 'direct' })),
    ...resultScreenshots.map(s => ({ ...s, source: 'results' })),
    ...visualDirScreenshots.map(s => ({ ...s, source: 'visual-dir' }))
  ];
  
  const categories = categorizeScreenshots(allScreenshots);
  
  // Create a separator for better visibility
  const separator = '\n' + '='.repeat(80) + '\n';
  
  console.log(separator);
  console.log('📷  VISUAL TEST RESULTS - SCREENSHOT LOCATIONS  📷');
  console.log(separator);
  
  // Display the shortcuts for easy access
  if (categories.preview.length > 0) {
    console.log('📊 Preview Mode Test:');
    console.log(`   ${categories.preview[0].path}`);
    console.log('');
  }
  
  if (categories.raytraced.length > 0) {
    console.log('🎯 Raytracing Test:');
    console.log(`   ${categories.raytraced[0].path}`);
    console.log('');
  }
  
  if (categories.material.length > 0) {
    console.log('🔵 Blue Sphere Material Test:');
    console.log(`   ${categories.material[0].path}`);
    console.log('');
  }
  
  // Provide instructions on viewing the images
  console.log(separator);
  console.log('To view these images:');
  console.log('1. Copy one of the paths above');
  console.log('2. Open with your image viewer or paste in browser');
  console.log(separator);
  
  // New: Mention the analyze capability
  console.log('Want AI to describe what\'s in these images?');
  console.log('Run: npm run test:visual:analyze');
  console.log(separator);
  
  return categories;
}

// Main function
async function main() {
  try {
    console.log('🔍 Running visual tests...');
    
    // Run the tests
    const { success, code, testOutput, directTestScreenshots } = await runPlaywrightTests();
    
    // Find screenshots in test-results (for failed tests)
    const resultScreenshots = findTestResultsScreenshots();
    
    // Find screenshots in tests-visual/screenshots (for successful tests)
    const visualDirScreenshots = findVisualTestDirScreenshots();

    // Show simplified report focused on the paths
    const categorizedScreenshots = categorizeScreenshots(visualDirScreenshots);
    
    // Check if we have valid images for each test
    if (categorizedScreenshots.preview.length === 0 && 
        categorizedScreenshots.raytraced.length === 0 && 
        categorizedScreenshots.material.length === 0) {
      console.log('⚠️ Warning: No test images were captured successfully.');
    } else {
      createSimplifiedReport(
        directTestScreenshots,
        resultScreenshots,
        visualDirScreenshots
      );
      
      // Clean up old screenshots after evaluation
      const deletedCount = cleanupOldScreenshots(categorizedScreenshots);
      
      if (deletedCount > 0) {
        console.log(`\n🧹 Cleaned up ${deletedCount} older screenshot(s). Keeping ${config.keepPerType} most recent per test type.`);
      }
    }
    
    // Exit with the same code as the test runner
    if (!success) {
      console.log(`\n⚠️ Note: Tests exited with code ${code}, but screenshots may still be available.`);
      process.exit(1);
    }
    
  } catch (error) {
    console.error('❌ Error running visual tests:', error);
    process.exit(1);
  }
}

// Run the main function
main(); 