import react from '@vitejs/plugin-react';
import { configDefaults, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  build: {
    // The cafe scene is lazy-loaded, so the Three.js chunk is intentionally larger
    // than the default warning threshold without affecting the first route payload.
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('react-router-dom') || id.includes('react-dom') || id.includes('\\react\\')) {
            return 'react-vendor';
          }

          if (id.includes('firebase/auth')) {
            return 'firebase-auth';
          }

          if (id.includes('firebase/firestore') || id.includes('firebase/functions')) {
            return 'firebase-data';
          }

          if (id.includes('firebase/app')) {
            return 'firebase-core';
          }

          if (id.includes('lucide-react')) {
            return 'icons';
          }

          if (id.includes('\\three\\') || id.includes('/three/')) {
            return 'three-vendor';
          }

          if (id.includes('\\gsap\\') || id.includes('/gsap/')) {
            return 'motion-vendor';
          }

          return undefined;
        },
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    exclude: [...configDefaults.exclude, 'tests/firestore.rules.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
    },
  },
});
