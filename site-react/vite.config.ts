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
      // Build mode follows tsconfig.json's references, so app code, tests and this file are checked.
      tsChecker({ typescript: { buildMode: true } }),
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
    },
    // Make env variables available
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
  }
})
