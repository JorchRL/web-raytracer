/**
 * Combined script to run visual tests and then analyze the results
 * This provides a complete pipeline for AI-assisted visual testing
 */
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config'; // Load environment variables from .env file

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Function to run a script as a child process
async function runScript(scriptName) {
  return new Promise((resolve, reject) => {
    console.log(`\n📋 Running ${scriptName}...\n`);
    
    const process = spawn('node', [path.join(__dirname, scriptName)], {
      stdio: 'inherit'
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script ${scriptName} exited with code ${code}`));
      }
    });
  });
}

// Main function to run the visual tests and then analyze the results
async function main() {
  const separator = '\n' + '='.repeat(80) + '\n';
  
  console.log(separator);
  console.log('🚀  STARTING COMPLETE VISUAL TEST PIPELINE WITH AI ANALYSIS  🚀');
  console.log(separator);
  
  try {
    // First run the visual tests
    await runScript('run-visual-tests.mjs');
    
    console.log('\n🔄 Tests completed, now analyzing the results...\n');
    
    // Then analyze the results
    await runScript('analyze-screenshots.mjs');
    
    console.log(separator);
    console.log('✅  VISUAL TEST PIPELINE COMPLETE  ✅');
    console.log(separator);
    
  } catch (error) {
    console.error('\n❌ Error in visual test pipeline:', error.message);
    process.exit(1);
  }
}

// Run the main function
main(); 