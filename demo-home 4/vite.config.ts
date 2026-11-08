import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  base: './',
  plugins: [svelte()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
    rollupOptions: { input: process.env.ENTRY ? process.env.ENTRY + '.html' : 'index.html', output: { inlineDynamicImports: true } }
  }
});
