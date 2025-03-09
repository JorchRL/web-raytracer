// @ts-check
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure the screenshots directory exists
const screenshotsDir = path.join(__dirname, 'screenshots');
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

/**
 * Wait for a specific status message to appear in the UI
 * @param {import('@playwright/test').Page} page - The Playwright page
 * @param {string} statusText - Text to wait for in the status element
 * @param {number} timeout - Maximum time to wait in milliseconds
 */
async function waitForStatus(page, statusText, timeout = 30000) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    const status = await page.locator('#status').textContent();
    if (status && status.includes(statusText)) {
      return true;
    }
    // Small delay between checks
    await page.waitForTimeout(100);
  }
  return false;
}

/**
 * Log screenshot path in a prominent way
 * @param {string} testName - Name of the test
 * @param {string} screenshotPath - Path to the screenshot
 */
function logScreenshotPath(testName, screenshotPath) {
  console.log('\n>>> SCREENSHOT CAPTURED <<<');
  console.log(`Test: ${testName}`);
  console.log(`screenshot saved to: ${screenshotPath}`);
  console.log('>>>>>>>>>>><<<<<<<<<<<<\n');
}

test.describe('Raytracer Visual Tests', () => {
  // Test Preview Mode
  test('Preview mode renders Cornell box correctly', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the initial loading to complete
    await waitForStatus(page, 'Preview loaded');
    
    // Wait a bit for any animations to settle
    await page.waitForTimeout(1000);

    // Take a screenshot of the specific canvas with ID 'canvas'
    const canvas = page.locator('#canvas');
    await expect(canvas).toBeVisible();
    
    // Capture the current date for the filename
    const date = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    const screenshotPath = path.join(screenshotsDir, `preview-cornell-box-${date}-${timestamp}.png`);
    
    // Take the screenshot
    await canvas.screenshot({ path: screenshotPath });
    
    // Log the screenshot path prominently
    logScreenshotPath('Preview mode', screenshotPath);
  });

  // Test Raytracing Mode
  test('Raytracing mode renders Cornell box with lighting and materials', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the preview to load first
    await waitForStatus(page, 'Preview loaded');
    
    // Click the Raytracing button with a more specific selector
    await page.getByRole('button', { name: 'Render with Raytracer' }).click();
    
    // Wait for raytracing to complete (might take some time)
    await waitForStatus(page, 'Raytracing completed', 60000);
    
    // Wait a bit for any final UI updates
    await page.waitForTimeout(1000);
    
    // Take a screenshot of the specific canvas with ID 'canvas'
    const canvas = page.locator('#canvas');
    await expect(canvas).toBeVisible();
    
    // Capture the current date for the filename
    const date = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    const screenshotPath = path.join(screenshotsDir, `raytraced-cornell-box-${date}-${timestamp}.png`);
    
    // Take the screenshot
    await canvas.screenshot({ path: screenshotPath });
    
    // Log the screenshot path prominently
    logScreenshotPath('Raytracing mode', screenshotPath);
  });

  // Test Material Editor
  test('Material editor changes are reflected in preview', async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
    
    // Wait for the preview to load
    await waitForStatus(page, 'Preview loaded');
    
    // Select the reflective sphere in the material editor
    await page.locator('#objectSelector').selectOption('reflective');
    
    // Wait for the material editor to appear
    await expect(page.locator('#materialEditor')).toBeVisible();
    
    // Change the material color to blue
    await page.locator('#materialColor').fill('#0000ff');
    
    // Increase the reflection value using evaluate instead of fill
    // This works for range inputs where fill() isn't supported
    await page.evaluate(() => {
      const slider = document.getElementById('reflectionSlider');
      if (slider && slider instanceof HTMLInputElement) {
        slider.value = '1.0';
        // Trigger a change event to ensure the value is recognized
        slider.dispatchEvent(new Event('change'));
      }
    });
    
    // Apply the changes
    await page.locator('#applyMaterialButton').click();
    
    // Wait for the preview to update
    await page.waitForTimeout(1000);
    
    // Take a screenshot of the specific canvas with ID 'canvas'
    const canvas = page.locator('#canvas');
    await expect(canvas).toBeVisible();
    
    // Capture the current date for the filename
    const date = new Date().toISOString().split('T')[0];
    const timestamp = Date.now();
    const screenshotPath = path.join(screenshotsDir, `blue-reflective-sphere-${date}-${timestamp}.png`);
    
    // Take the screenshot
    await canvas.screenshot({ path: screenshotPath });
    
    // Log the screenshot path prominently
    logScreenshotPath('Material editor', screenshotPath);
  });
}); 