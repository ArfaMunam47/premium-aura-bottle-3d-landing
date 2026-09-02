import { defineConfig } from 'vite';

export default defineConfig({
  root: 'path',
  publicDir: '../public',
  server: {
    port: 5173,
    open: true,
    host: true
  },
  preview: {
    port: 4173,
    open: true,
    host: true
  },
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: ['es2020', 'firefox115', 'chrome110'],
    assetsInlineLimit: 0
  }
});
