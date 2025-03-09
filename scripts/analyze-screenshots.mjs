/**
 * Script to analyze screenshots using image-to-text API
 * This allows the AI to "see" what's in the test images
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import fetch from 'node-fetch';
import 'dotenv/config'; // Load environment variables from .env file

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  // Screenshot directory
  screenshotsDir: path.join(__dirname, '..', 'tests-visual', 'screenshots'),
  // API configuration
  api: {
    // OpenRouter API endpoint for Gemini model
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    // Gemini model via OpenRouter
    model: "google/gemini-2.0-flash-exp:free",
    // API key from environment variable
    key: process.env.VISION_API_KEY || "YOUR_API_KEY",
    // Set to false if API key is not configured
    enabled: process.env.VISION_API_KEY ? true : false
  }
};

// Function to find the most recent screenshots
function findRecentScreenshots() {
  if (!fs.existsSync(config.screenshotsDir)) {
    console.log('No screenshots directory found at:', config.screenshotsDir);
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

/**
 * Convert an image file to base64
 * @param {string} filePath - Path to the image file
 * @returns {string} - Base64 encoded image
 */
function imageToBase64(filePath) {
  const imageData = fs.readFileSync(filePath);
  return Buffer.from(imageData).toString('base64');
}

/**
 * Analyze an image using OpenRouter API with Gemini model
 * @param {string} imagePath - Path to the image file
 * @returns {Promise<string>} - Text description of the image
 */
async function analyzeImage(imagePath) {
  // Check if API is enabled
  if (!config.api.enabled) {
    return "API analysis disabled. Set VISION_API_KEY environment variable to enable.";
  }
  
  try {
    // Convert image to base64
    const base64Image = imageToBase64(imagePath);
    
    // Prepare request for OpenRouter API
    const payload = {
      model: config.api.model,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Describe this image in detail. Focus on explaining the scene, objects, colors, lighting, and rendering quality."
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/png;base64,${base64Image}`
              }
            }
          ]
        }
      ],
      max_tokens: 300
    };
    
    // Call the OpenRouter API
    const response = await fetch(config.api.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.api.key}`,
        'HTTP-Referer': 'https://github.com/', // Required by OpenRouter
        'X-Title': 'WebGPU Raytracer Visual Tests' // Optional
      },
      body: JSON.stringify(payload)
    });
    
    // Parse the response
    const result = await response.json();
    
    // Extract the description from OpenRouter/Gemini response
    if (result && 
        result.choices && 
        result.choices.length > 0 && 
        result.choices[0].message &&
        result.choices[0].message.content) {
      return result.choices[0].message.content;
    } else {
      console.error("Unexpected API response format:", JSON.stringify(result, null, 2));
      return "Could not generate a description for this image. Unexpected API response format.";
    }
  } catch (error) {
    console.error("Error analyzing image:", error);
    return "Error analyzing image. Check API configuration and connectivity.";
  }
}

/**
 * Simulated image analysis for demonstration purposes
 * This function provides hardcoded descriptions based on the filename pattern
 * Use this when the real API is not configured
 * @param {string} imagePath - Path to the image file
 * @returns {string} - Simulated description of the image
 */
function simulateImageAnalysis(imagePath) {
  const filename = path.basename(imagePath);
  
  if (filename.includes('preview-cornell-box')) {
    return "A 3D scene showing a Cornell box with colored walls (red on the left, green on the right) and several geometric objects inside, rendered using WebGPU rasterization.";
  } else if (filename.includes('raytraced-cornell-box')) {
    return "A photorealistic rendering of a Cornell box with soft shadows, reflections, and global illumination. The scene contains spheres on a white floor with red and green walls.";
  } else if (filename.includes('blue-reflective-sphere')) {
    return "A Cornell box scene with a prominent blue reflective sphere in the center, showing mirror-like reflections of the surrounding colored walls.";
  } else {
    return "A 3D rendered scene showing various geometric objects with lighting effects.";
  }
}

// Main function
async function main() {
  console.log('📷 Finding recent screenshots for analysis...');
  const screenshots = findRecentScreenshots();
  
  if (screenshots.length === 0) {
    console.log('❌ No screenshots found. Run the visual tests first with: npm run test:visual');
    return;
  }
  
  // Create a separator for better visibility
  const separator = '\n' + '='.repeat(80) + '\n';
  
  console.log(separator);
  console.log('🔍  VISUAL TEST ANALYSIS - WHAT THE AI SEES  🔍');
  console.log(separator);
  
  // Categorize screenshots
  const categories = categorizeScreenshots(screenshots);
  
  // Check if the environment is properly set up
  const isApiConfigured = config.api.key !== "YOUR_API_KEY";
  
  if (!isApiConfigured) {
    console.log('⚠️  Using simulated image analysis - API not configured.');
    console.log('   To enable real API analysis, set the following environment variable:');
    console.log('   - VISION_API_KEY: Your OpenRouter API key');
    console.log('   This will use the Gemini model to analyze images.');
    console.log(separator);
  } else {
    console.log('✅  Using Gemini model via OpenRouter for image analysis');
    console.log(`   Model: ${config.api.model}`);
    console.log(separator);
  }
  
  // Display analysis for the most recent screenshot of each type
  for (const [category, categoryScreenshots] of Object.entries(categories)) {
    if (categoryScreenshots.length === 0) continue;
    
    const screenshot = categoryScreenshots[0]; // Get most recent
    
    let title;
    switch(category) {
      case 'preview': 
        title = '📊 Preview Mode';
        break;
      case 'raytraced': 
        title = '🎯 Raytracing Mode';
        break;
      case 'material': 
        title = '🔵 Material Editor Test';
        break;
      default: 
        title = '📷 Other Screenshot';
    }
    
    console.log(`${title}:`);
    console.log(`   Path: ${screenshot.path}`);
    
    try {
      // Analyze image - use simulated analysis if API not configured
      let description;
      if (isApiConfigured) {
        console.log('   Analyzing image with Gemini...');
        description = await analyzeImage(screenshot.path);
      } else {
        description = simulateImageAnalysis(screenshot.path);
      }
      
      console.log('   Description: ' + description);
    } catch (error) {
      console.error('   Error analyzing image:', error.message);
    }
    
    console.log('');
  }
  
  console.log(separator);
  console.log('To view these images yourself:');
  console.log('1. Copy one of the paths above');
  console.log('2. Open with your image viewer or paste in browser');
  console.log(separator);
  
  console.log('\nRun the visual tests again with: npm run test:visual');
}

// Run the main function
main().catch(error => {
  console.error('Error running analysis:', error);
  process.exit(1);
}); 