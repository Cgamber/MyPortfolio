import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative paths are used for assets
  build: {
    outDir: 'dist', // Output directory for the build
    assetsDir: 'assets', // Directory for static assets
  },
  server: {
    port: 4173, // Local development server port
  },
  assetsInclude: ['**/*.glb', '**/*.mp4', '**/*.jpg', '**/*.png'], // Include these file types as assets
});