import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['app/api/**/*.ts', 'lib/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
