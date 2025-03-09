/**
 * Script to display the most recent visual test results
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  // Number of screenshots to keep per test type (same as in run-visual-tests.mjs)
  keepPerType: 2
};

// Function to find the most recent screenshots
function findRecentScreenshots() {
  const screenshotsDir = path.join(__dirname, '..', 'tests-visual', 'screenshots');
  
  if (!fs.existsSync(screenshotsDir)) {
    console.log('No screenshots directory found at:', screenshotsDir);
    return [];
  }
  
  const files = fs.readdirSync(screenshotsDir);
  const screenshots = files
    .filter(file => file.endsWith('.png'))
    .map(file => ({
      path: path.join(screenshotsDir, file),
      name: file,
      time: fs.statSync(path.join(screenshotsDir, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time); // Sort by most recent first
  
  return screenshots;
}

// Function to categorize screenshots by type
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

// Count how many screenshots will be kept on next cleanup
function countScreenshotsToKeep(categories) {
  let total = 0;
  for (const [category, screenshots] of Object.entries(categories)) {
    total += Math.min(screenshots.length, config.keepPerType);
  }
  return total;
}

// Main function
function main() {
  console.log('📷 Finding recent screenshots...');
  const screenshots = findRecentScreenshots();
  
  if (screenshots.length === 0) {
    console.log('❌ No screenshots found. Run the visual tests first with: npm run test:visual');
    return;
  }
  
  // Create a separator for better visibility
  const separator = '\n' + '='.repeat(80) + '\n';
  
  console.log(separator);
  console.log('📷  MOST RECENT SCREENSHOTS - QUICK ACCESS  📷');
  console.log(separator);
  
  // Categorize screenshots
  const categories = categorizeScreenshots(screenshots);
  
  // Display the most recent screenshot of each type
  if (categories.preview.length > 0) {
    console.log('📊 Preview Mode (Most Recent):');
    console.log(`   ${categories.preview[0].path}`);
    console.log(`   Created: ${new Date(categories.preview[0].time).toLocaleString()}`);
    console.log('');
  }
  
  if (categories.raytraced.length > 0) {
    console.log('🎯 Raytracing (Most Recent):');
    console.log(`   ${categories.raytraced[0].path}`);
    console.log(`   Created: ${new Date(categories.raytraced[0].time).toLocaleString()}`);
    console.log('');
  }
  
  if (categories.material.length > 0) {
    console.log('🔵 Blue Sphere (Most Recent):');
    console.log(`   ${categories.material[0].path}`);
    console.log(`   Created: ${new Date(categories.material[0].time).toLocaleString()}`);
    console.log('');
  }
  
  console.log(separator);
  console.log('To view these images:');
  console.log('1. Copy one of the paths above');
  console.log('2. Open with your image viewer or paste in browser');
  console.log(separator);
  
  // New: Mention the analyze capability
  console.log('Want AI to describe what\'s in these images?');
  console.log('Run: npm run test:visual:analyze');
  console.log(separator);
  
  const totalScreenshots = screenshots.length;
  const toKeep = countScreenshotsToKeep(categories);
  
  if (totalScreenshots > toKeep) {
    console.log(`\n🧹 Note: Currently have ${totalScreenshots} screenshots. When you run tests again,`);
    console.log(`   only the ${config.keepPerType} most recent of each type will be kept (${toKeep} total).`);
    console.log('   Older screenshots will be deleted automatically.');
  }
  
  console.log('\nRun the visual tests again with: npm run test:visual');
}

// Run the main function
main(); 