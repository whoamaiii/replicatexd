import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: [
      'server/**/*.test.ts',
      'shared/**/*.test.ts',
      'src/**/*.test.ts',
      'src/**/*.test.tsx',
    ],
    environment: 'node',
    globals: true,
    environmentMatchGlobs: [
      ['src/**/*.test.{ts,tsx}', 'jsdom'],
    ],
  },
})
