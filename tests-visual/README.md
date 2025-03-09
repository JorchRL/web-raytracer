# Visual Testing for WebGPU Raytracer

This directory contains visual tests for the WebGPU Raytracer using Playwright. These tests automatically capture screenshots of the application in different states, which can be used to visually verify that the raytracing functionality is working correctly.

## Running the tests

To run the visual tests:

```bash
npm run test:visual
```

This will:
1. Start a local development server
2. Launch the application in a headless browser
3. Capture screenshots of the application in different states
4. Save the screenshots to the `tests-visual/screenshots` directory

## Viewing the results

After running the tests, you can view information about the most recent screenshots:

```bash
npm run test:visual:results
```

This will display a list of the most recent screenshots, including their file paths and creation timestamps.

## Available tests

- **Preview Mode Test**: Captures a screenshot of the Cornell box in preview (rasterization) mode
- **Raytracing Mode Test**: Captures a screenshot of the Cornell box in raytraced mode with full lighting and material effects
- **Material Editor Test**: Applies changes to a material (making the reflective sphere blue) and captures the result

## Screenshots

Screenshots are saved to the `tests-visual/screenshots` directory with filenames that include the test name and timestamp.

## Future enhancements

Possible future enhancements for visual testing:

1. Automated image comparison against known-good reference images
2. Pixel-by-pixel difference visualization
3. Integration with CI/CD pipelines
4. Parametrized tests for different scene configurations
5. Performance benchmarking of rendering time 