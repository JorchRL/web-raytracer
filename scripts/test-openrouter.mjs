/**
 * Test script for OpenRouter API connectivity with Gemini model
 * This allows you to verify your API key and connection before running the full analysis
 */
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

// Load environment variables from .env file
const result = dotenv.config();
if (result.error) {
  console.error('Error loading .env file:', result.error.message);
}

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  // OpenRouter API endpoint for Gemini model
  endpoint: "https://openrouter.ai/api/v1/chat/completions",
  // Gemini model via OpenRouter
  model: "google/gemini-2.0-flash-exp:free",
  // API key from environment variable
  key: process.env.VISION_API_KEY || "YOUR_API_KEY",
  // Screenshot directory
  screenshotsDir: path.join(__dirname, '..', 'tests-visual', 'screenshots')
};

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
 * Find the most recent screenshot
 * @returns {string|null} - Path to the most recent screenshot or null if none found
 */
function findMostRecentScreenshot() {
  if (!fs.existsSync(config.screenshotsDir)) {
    console.log('No screenshots directory found at:', config.screenshotsDir);
    return null;
  }
  
  const files = fs.readdirSync(config.screenshotsDir);
  const screenshots = files
    .filter(file => file.endsWith('.png'))
    .map(file => ({
      path: path.join(config.screenshotsDir, file),
      time: fs.statSync(path.join(config.screenshotsDir, file)).mtime.getTime()
    }))
    .sort((a, b) => b.time - a.time); // Sort by most recent first
  
  return screenshots.length > 0 ? screenshots[0].path : null;
}

/**
 * Test OpenRouter API connectivity with Gemini model
 * @param {string} imagePath - Path to the image file to analyze
 */
async function testOpenRouterApi(imagePath) {
  console.log(`Testing OpenRouter API with image: ${imagePath}`);
  console.log(`Using model: ${config.model}`);
  
  // Check if env var is set
  console.log('\nEnvironment variable check:');
  console.log(`VISION_API_KEY set: ${process.env.VISION_API_KEY ? 'Yes' : 'No'}`);
  
  if (!process.env.VISION_API_KEY) {
    console.error('ERROR: VISION_API_KEY environment variable not found.');
    console.log('Please make sure:');
    console.log('1. Your .env file exists in the project root');
    console.log('2. It contains a line like: VISION_API_KEY=your_api_key_here');
    console.log('3. There are no extra spaces or quotes around the key');
    process.exit(1);
  }
  
  if (config.key === "YOUR_API_KEY") {
    console.error('ERROR: OpenRouter API key has default value.');
    console.log('Please set the VISION_API_KEY environment variable.');
    process.exit(1);
  }
  
  try {
    // Convert image to base64
    const base64Image = imageToBase64(imagePath);
    console.log('Image converted to base64 successfully.');
    
    console.log('Sending request to OpenRouter API...');
    
    // Prepare request for OpenRouter API
    const payload = {
      model: config.model,
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
    const response = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.key}`,
        'HTTP-Referer': 'https://github.com/', // Required by OpenRouter
        'X-Title': 'WebGPU Raytracer Test' // Optional
      },
      body: JSON.stringify(payload)
    });
    
    // Check for successful response
    if (!response.ok) {
      console.error(`ERROR: API request failed with status ${response.status}`);
      const errorText = await response.text();
      console.error('Response:', errorText);
      process.exit(1);
    }
    
    // Parse the response
    const result = await response.json();
    
    console.log('\n=== API Response ===\n');
    console.log(JSON.stringify(result, null, 2));
    
    // Extract the description
    if (result.choices && result.choices.length > 0 && result.choices[0].message) {
      console.log('\n=== Image Description ===\n');
      console.log(result.choices[0].message.content);
      console.log('\n=== End of Description ===\n');
      
      console.log('✅ Test completed successfully!');
    } else {
      console.error('ERROR: Unexpected response format');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('ERROR:', error.message);
    process.exit(1);
  }
}

// Main function
async function main() {
  // Find the most recent screenshot to test with
  const imagePath = findMostRecentScreenshot();
  
  if (!imagePath) {
    console.error('ERROR: No screenshots found to test with.');
    console.log('Please run visual tests first with: npm run test:visual');
    process.exit(1);
  }
  
  await testOpenRouterApi(imagePath);
}

// Run the main function
main(); 