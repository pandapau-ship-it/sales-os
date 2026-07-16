/// <reference types="vitest/config" />
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    // node reicht für die [AUTO]-Tests der Baupläne (Validierung, find_duplicates,
    // Filter-Sprache, Idempotenz) — reine Logik, kein DOM. Für Komponenten-Tests
    // später jsdom + @testing-library/react ergänzen (eigener Slice, nicht hier).
    environment: 'node',
    include: ['src/**/*.{test,spec}.{ts,tsx}', 'scripts/**/*.{test,spec}.ts'],
    // Testdateien dürfen den Produktions-Build nie beeinflussen.
    exclude: ['node_modules/**', 'dist/**'],
  },
})
