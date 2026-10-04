// vitest/config's defineConfig is Vite's plus the `test` block (Vitest 3 shares the app's Vite).
import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsChecker from 'vite-plugin-checker'
import path from 'node:path'
import { buildsApi } from './server/buildsApi'
import { liveConfigFromEnv } from './server/targets'

const PORT = 4210

export default defineConfig(({ mode }) => {
  // Server-side settings (.env.local or the shell; see .env.example). None is VITE_-prefixed, so
  // none reaches the browser.
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env }
  const buildsDir = path.resolve(process.cwd(), env.PANGO_BUILDS_DIR || '../loader/builds')

  return {
    plugins: [
      react(),
      tailwindcss(),
      // Dev-server overlay for type errors; `npm run build` runs `tsc -b` itself.
      ...(mode === 'test'
        ? []
        : [tsChecker({ typescript: { buildMode: true }, enableBuild: false })]),
      buildsApi({ buildsDir, live: liveConfigFromEnv(env) }),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@tests': path.resolve(__dirname, './tests'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
            if (id.includes('@mantine')) return 'mantine'
            if (id.includes('@reduxjs') || id.includes('react-redux')) return 'redux'
            if (id.includes('react-router')) return 'react-router'
          },
        },
      },
    },
    server: { port: PORT, open: !process.env.CI && process.env.BROWSER !== 'none' },
    preview: { port: PORT },
    // Specs live in tests/ (mirroring src/), Playwright in e2e/. TZ is pinned so local-time
    // formatting is the same on every machine.
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.ts',
      include: ['tests/**/*.test.{ts,tsx}'],
      mockReset: true,
      unstubGlobals: true,
      testTimeout: 15_000,
      env: { TZ: 'UTC' },
    },
  }
})
