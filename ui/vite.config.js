import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  base: './',  // Use relative paths
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/pages/popup.html'),
        options: resolve(__dirname, 'src/pages/options.html'),
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: (assetInfo) => {
          // Keep HTML files at root level
          if (assetInfo.name && assetInfo.name.endsWith('.html')) {
            return '[name].[ext]';
          }
          return 'assets/[name].[ext]';
        }
      }
    },
    // Don't minify for easier debugging
    minify: false,
    // Generate source maps
    sourcemap: true,
    // Copy public files
    copyPublicDir: true,
  },
  // Resolve extensions
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx']
  },
  // Public directory for static assets
  publicDir: 'public'
});
