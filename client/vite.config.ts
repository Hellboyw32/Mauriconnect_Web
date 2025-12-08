import path from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'src': path.resolve(__dirname, './src'),
      '@libs': path.resolve(__dirname, '../libs/src')
    }
  },
  build: {
    outDir: '../dist/client',
    emptyOutDir: true
  },
  server: {
    port: 3000
  }
});
