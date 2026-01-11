/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // @ts-ignore
  test: {
    globals: true,
    environment: 'jsdom',
    // Change this to use a relative path from the root
    setupFiles: ['./src/setupTests.ts'], 
    // This helps bypass some esbuild issues during testing
    deps: {
      optimizer: {
        web: {
          enabled: true
        }
      }
    }
  },
});