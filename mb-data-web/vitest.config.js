import { defineConfig } from 'vitest/config'

// Unit tests for pure utility/business-logic modules (no React/DOM needed).
// Run with `npm test`. Tests live next to the code as *.test.js.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['lib/**/*.test.js'],
  },
})
