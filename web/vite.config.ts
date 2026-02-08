import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // HashRouter works with any base path, so we can use relative paths
  base: './',
  server: {
    port: 5173,
    host: '0.0.0.0', // Allow connections from local network
    strictPort: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});

