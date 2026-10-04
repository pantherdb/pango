import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import tsChecker from 'vite-plugin-checker'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode`
  const env = loadEnv(mode, process.cwd(), '')

  return {
    logLevel: 'info',
    plugins: [
      react(),
      tailwindcss(),
      // Dev-server overlay for type errors. Build mode follows tsconfig.json's references, so app code,
      // tests and config are checked; `vite build` skips it because the build scripts run `tsc -b` first.
      tsChecker({ typescript: { buildMode: true }, enableBuild: false }),
      visualizer({
        filename: 'dist/stats-treemap.html',
        template: 'treemap',
        gzipSize: true,
        brotliSize: true,
      }),
      visualizer({
        filename: 'dist/stats-sunburst.html',
        template: 'sunburst',
        gzipSize: true,
        brotliSize: true,
      }),
      visualizer({
        filename: 'dist/stats-network.html',
        template: 'network',
        gzipSize: true,
        brotliSize: true,
      }),
    ],

    build: {
      rollupOptions: {
        output: {
          // Heavy vendors get their own long-cached chunks. React is claimed first so it doesn't
          // land in whichever vendor chunk happens to import it first.
          manualChunks(id) {
            if (!id.includes('node_modules')) return
            if (/\/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
            if (id.includes('@mantine')) return 'mantine'
            if (id.includes('framer-motion')) return 'framer-motion'
            if (id.includes('@apollo') || id.includes('graphql')) return 'graphql'
            if (id.includes('@reduxjs') || id.includes('react-redux')) return 'redux'
            if (id.includes('react-router')) return 'react-router'
          },
        },
      },
    },
    optimizeDeps: {
      include: ['@mantine/core', '@mantine/hooks'],
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@tests': path.resolve(__dirname, './tests'),
      },
    },
    server: {
      open: true,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.ts',
      include: ['tests/**/*.test.{ts,tsx}'],
      mockReset: true,
      // Full-page renders (Mantine + Redux + router in jsdom) can take several seconds under a
      // parallel run; 5s, the default, is too tight for CI machines.
      testTimeout: 15_000,
      coverage: {
        provider: 'v8',
        include: ['src/**/*.{ts,tsx}'],
        exclude: ['src/main.tsx', 'src/vite-env.d.ts', 'src/polyfills/**'],
        reporter: ['text-summary', 'html', 'json-summary'],
        reportsDirectory: 'coverage',
        // Just under the current numbers, so a change that drops tests fails `npm run test:coverage`.
        thresholds: { lines: 98, statements: 98, branches: 90, functions: 90 },
      },
    },
    // Make env variables available
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
  }
})
