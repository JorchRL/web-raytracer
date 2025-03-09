/**
 * Texture module for material textures
 */

/**
 * Base texture class
 */
export class Texture {
  /**
   * Get color at UV coordinates
   * @param {number} u - U coordinate (0-1)
   * @param {number} v - V coordinate (0-1)
   * @returns {Object} RGB color
   */
  getColorAtUV(u, v) {
    throw new Error('Method not implemented');
  }
}

/**
 * Checkerboard texture pattern
 */
export class CheckerboardTexture extends Texture {
  /**
   * Create a checkerboard texture
   * @param {Object} color1 - First RGB color
   * @param {Object} color2 - Second RGB color
   * @param {number} scale - Size of the checkerboard squares (default: 10)
   */
  constructor(color1, color2, scale = 10) {
    super();
    this.color1 = color1;
    this.color2 = color2;
    this.scale = scale;
  }
  
  /**
   * Get color at UV coordinates
   * @param {number} u - U coordinate (0-1)
   * @param {number} v - V coordinate (0-1)
   * @returns {Object} RGB color
   */
  getColorAtUV(u, v) {
    // Scale UV coordinates
    const scaledU = Math.floor(u * this.scale);
    const scaledV = Math.floor(v * this.scale);
    
    // Checkerboard pattern
    const isEven = (scaledU + scaledV) % 2 === 0;
    
    return isEven ? this.color1 : this.color2;
  }
}

/**
 * Gradient texture
 */
export class GradientTexture extends Texture {
  /**
   * Create a gradient texture
   * @param {Object} color1 - Start RGB color
   * @param {Object} color2 - End RGB color
   * @param {string} direction - 'horizontal', 'vertical', or 'radial'
   */
  constructor(color1, color2, direction = 'vertical') {
    super();
    this.color1 = color1;
    this.color2 = color2;
    this.direction = direction;
  }
  
  /**
   * Get color at UV coordinates
   * @param {number} u - U coordinate (0-1)
   * @param {number} v - V coordinate (0-1)
   * @returns {Object} RGB color
   */
  getColorAtUV(u, v) {
    let t;
    
    switch (this.direction) {
      case 'horizontal':
        t = u;
        break;
      case 'vertical':
        t = v;
        break;
      case 'radial':
        // Distance from center (0.5, 0.5)
        const dx = u - 0.5;
        const dy = v - 0.5;
        t = Math.min(1, Math.sqrt(dx * dx + dy * dy) * 2);
        break;
      default:
        t = v;
    }
    
    // Linear interpolation between colors
    return {
      r: this.color1.r * (1 - t) + this.color2.r * t,
      g: this.color1.g * (1 - t) + this.color2.g * t,
      b: this.color1.b * (1 - t) + this.color2.b * t
    };
  }
}

/**
 * Image texture from a loaded image
 */
export class ImageTexture extends Texture {
  /**
   * Create an image texture
   * @param {HTMLImageElement} image - The loaded image
   * @param {boolean} repeat - Whether to repeat the texture (default: true)
   */
  constructor(image, repeat = true) {
    super();
    this.image = image;
    this.repeat = repeat;
    
    // Create a canvas to extract pixel data
    this.canvas = document.createElement('canvas');
    this.canvas.width = image.width;
    this.canvas.height = image.height;
    
    const ctx = this.canvas.getContext('2d');
    ctx.drawImage(image, 0, 0);
    this.imageData = ctx.getImageData(0, 0, image.width, image.height);
  }
  
  /**
   * Get color at UV coordinates
   * @param {number} u - U coordinate (0-1)
   * @param {number} v - V coordinate (0-1)
   * @returns {Object} RGB color
   */
  getColorAtUV(u, v) {
    // If repeating, wrap UV coordinates
    if (this.repeat) {
      u = u - Math.floor(u);
      v = v - Math.floor(v);
    } else {
      u = Math.max(0, Math.min(1, u));
      v = Math.max(0, Math.min(1, v));
    }
    
    // Calculate pixel coordinates
    const x = Math.floor(u * (this.image.width - 1));
    const y = Math.floor(v * (this.image.height - 1));
    
    // Extract RGB from image data (RGBA format)
    const index = (y * this.image.width + x) * 4;
    return {
      r: this.imageData.data[index] / 255,
      g: this.imageData.data[index + 1] / 255,
      b: this.imageData.data[index + 2] / 255
    };
  }
}

/**
 * Load an image texture from a URL
 * @param {string} url - The image URL
 * @returns {Promise<ImageTexture>} A promise that resolves to the loaded texture
 */
export function loadImageTexture(url, repeat = true) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(new ImageTexture(image, repeat));
    image.onerror = () => reject(new Error(`Failed to load texture: ${url}`));
    image.src = url;
  });
}

/**
 * Create a procedural marble texture
 */
export class MarbleTexture extends Texture {
  /**
   * Create a marble texture
   * @param {Object} color1 - First RGB color
   * @param {Object} color2 - Second RGB color
   * @param {number} scale - Scale of the pattern
   * @param {number} turbulence - Turbulence factor
   */
  constructor(color1, color2, scale = 10, turbulence = 5) {
    super();
    this.color1 = color1;
    this.color2 = color2;
    this.scale = scale;
    this.turbulence = turbulence;
  }
  
  /**
   * Simple noise function for marble pattern
   */
  noise(x, y) {
    let n = Math.sin(x * 0.1 + y * 0.1) * 10;
    n = Math.abs(n - Math.floor(n)); // Get fractional part
    return n;
  }
  
  /**
   * Get color at UV coordinates
   * @param {number} u - U coordinate (0-1)
   * @param {number} v - V coordinate (0-1)
   * @returns {Object} RGB color
   */
  getColorAtUV(u, v) {
    const scaledU = u * this.scale;
    const scaledV = v * this.scale;
    
    const noise = this.noise(scaledU, scaledV) * this.turbulence;
    const marble = Math.abs(Math.sin((scaledU + scaledV + noise) * 0.1) * 0.5 + 0.5);
    
    // Linear interpolation between colors
    return {
      r: this.color1.r * (1 - marble) + this.color2.r * marble,
      g: this.color1.g * (1 - marble) + this.color2.g * marble,
      b: this.color1.b * (1 - marble) + this.color2.b * marble
    };
  }
} 