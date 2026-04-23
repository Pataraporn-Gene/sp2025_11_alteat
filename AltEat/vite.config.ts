import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/chatbot': {
        target: 'https://n8n-service-alteat.onrender.com',
        changeOrigin: true,
        secure: true,
        rewrite: (pathName) => pathName.replace(/^\/api\/chatbot/, '/webhook/ea91077d-37f4-42c8-853d-55dd2ae3e33e/chat'),
      },
    },
  },
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/test/setup.ts',
    include: ['src/__tests__/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['tests/**', 'playwright/**', 'test-results/**', 'playwright-report/**'],
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        '**/types.ts'
      ]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  
})
