import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      reporter: ['text', 'json-summary'],
    },
    reporters: ['default'],
    isolate: true,
  },
}); 