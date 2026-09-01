import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    reporters: ['verbose', 'html'],
    outputFile: {
      html: './test-report/index.html'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: './test-report/coverage',
      include: ['src/**/*.ts', 'src/**/*.vue']
    }
  }
})
