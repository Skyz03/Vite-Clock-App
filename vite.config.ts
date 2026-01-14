/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api-geocode': {
        target: 'https://geocode.maps.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-geocode/, ''),
        headers: {
          'User-Agent': 'ClockOS/1.0'
        }
      },
      '/api-nominatim': {
        target: 'https://nominatim.openstreetmap.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api-nominatim/, ''),
        headers: {
          'User-Agent': 'ClockOS/1.0'
        }
      }
    }
  },
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