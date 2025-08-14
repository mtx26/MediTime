import { defineConfig, splitVendorChunkPlugin } from 'vite';
import react from '@vitejs/plugin-react';
import purgeCss from 'vite-plugin-purgecss';

export default defineConfig({
  plugins: [react(), splitVendorChunkPlugin(), purgeCss()],
  publicDir: 'public',
  build: {
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom']
        }
      }
    }
  },
  server: {
    port: 3000
  }
});
