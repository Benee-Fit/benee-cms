/// <reference types="vitest" />
import { defineConfig } from 'vitest/config';
// Comment out the react plugin since it might be missing
// import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  // Comment out plugins since we commented out the react import
  plugins: [],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
});
