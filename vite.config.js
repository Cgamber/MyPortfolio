import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative paths are used for assets
  build: {
    outDir: 'dist', // Output directory for the build
    assetsDir: 'assets', // Directory for static assets
    rollupOptions: {
      output: {
        manualChunks: undefined,
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.fileName?.split('.').pop()?.toLowerCase();
          if (['glb', 'mp4', 'jpg', 'png'].includes(extType)) {
            const type = extType === 'glb' ? 'models' :
                        extType === 'mp4' ? 'videos' : 'textures';
            return `assets/${type}/[name][extname]`;
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
  server: {
    port: 4173, // Local development server port
  },
  assetsInclude: ['**/*.glb', '**/*.mp4', '**/*.jpg', '**/*.png'], // Include these file types as assets
});