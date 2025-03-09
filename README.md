# WebGPU Interactive Raytracer

A web-based raytracing application that uses WebGPU for both rasterization (preview mode) and CPU-based raytracing. The application showcases modern rendering techniques, including:

- Basic rasterization for real-time previews
- Full raytracing with recursive ray bounces
- Realistic lighting with shadows, reflections, and refractions
- Material system with diffuse, specular, reflective, and transparent properties
- Texture mapping support
- Interactive camera controls
- Scene management with the classic Cornell Box test scene

## Features

- **Preview Mode**: Fast rasterization-based preview using WebGPU
- **Raytracing Mode**: High-quality rendering with global illumination effects
- **Interactive Camera**: First-person camera controls for exploring the scene
- **Material Editor**: UI for adjusting material properties and applying textures
- **Object Management**: Add, remove, and modify scene objects
- **Lighting Controls**: Adjust light properties including color and intensity
- **Visual Testing**: Automated screenshot capture for visual verification
- **AI Analysis**: Computer vision integration for automatic image description

## Getting Started

### Prerequisites

- A modern browser with WebGPU support (Chrome 113+, Edge 113+, or browsers with the flag enabled)
- Node.js 16+ and npm

### Installation

```bash
# Clone the repository
git clone [repository-url]
cd web-raytracer

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Usage

1. **Preview Mode**: The application starts in preview mode, showing a rasterized version of the Cornell Box
2. **Raytracing**: Click "Render with Raytracer" to generate a high-quality raytraced image
3. **Camera Controls**: Use WASD to move and arrow keys to rotate the camera
4. **Scene Controls**: Modify the scene with the control panel on the right
5. **Material Editing**: Select objects and adjust their material properties

## Testing

The project includes multiple testing approaches:

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests with minimal output
npm run test:minimal

# Run tests with coverage
npm run test:coverage
```

### Visual Tests

The project includes visual testing using Playwright to capture screenshots for manual verification:

```bash
# Run visual tests and capture screenshots
npm run test:visual

# View information about the most recent screenshots
npm run test:visual:results

# Get AI descriptions of screenshots
npm run test:visual:analyze

# Run tests and automatically analyze results
npm run test:visual:full
```

Screenshots are saved to the `tests-visual/screenshots` directory and automatically cleaned up to retain only the most recent images.

#### AI Image Analysis

The visual test system integrates with image description APIs to provide automatic descriptions of screenshots. The system is configured to use Google's Gemini model via OpenRouter:

```bash
# Configure OpenRouter API 
export VISION_API_ENDPOINT="https://openrouter.ai/api/v1/chat/completions"
export VISION_API_KEY="your-openrouter-api-key"
```

When the API is not configured, the system falls back to simulated descriptions based on the test type.

## Implementation Plan

The project follows a phased implementation approach:

1. **Phase 1-6**: Core raytracer setup with basic functionality
2. **Phase 7**: Auto-loading preview with Cornell box
3. **Phase 8**: Basic lighting and shadows
4. **Phase 9**: Material enhancements (reflection, refraction, textures)
5. **Intermediate Phase**: Visual testing infrastructure
6. **Phase 10**: Performance optimization with spatial data structures
7. **Phase 11**: WebGPU compute shader raytracing
8. **Phase 12-14**: Advanced features (camera models, global illumination, UI)

See [implementation_plan.md](implementation_plan.md) for details.

## License

[MIT License](LICENSE)

## Acknowledgments

- The Cornell Box is a standard test scene in computer graphics research
- This project uses WebGPU, a next-generation graphics API for the web 