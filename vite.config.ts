import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Gist-V2/', // Base path for GitHub Pages
  build: {
    outDir: 'dist',
    sourcemap: true
  }
});