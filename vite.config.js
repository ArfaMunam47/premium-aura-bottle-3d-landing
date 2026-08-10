import { defineConfig } from 'vite';

export default defineConfig({
  root: 'path',
  publicDir: '../public',
  server: {
    port: 5173,
    open: true,
    host: true
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true
  },
  resolve: {
    alias: {
      'three': 'three'
    }
  }
});