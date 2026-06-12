import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/admin/',
  build: {
    outDir: '../../../dist/admin',
    emptyOutDir: false
  },
  server: {
    port: 3001,
    proxy: {
      '/api': {
        target: 'http://localhost:5002',
        changeOrigin: true
      }
    }
  }
});
