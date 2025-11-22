import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // HashRouter works with any base path, so we can use relative paths
  base: './',
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});

