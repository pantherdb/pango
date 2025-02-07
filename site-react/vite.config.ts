import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import tsChecker from 'vite-plugin-checker'
import { loadEnv } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode`
  const env = loadEnv(mode, process.cwd(), '')

  //console.log('Mode:', mode)
  //console.log('Command:', command)

  return {
    logLevel: 'info',
    plugins: [react(), tsChecker({ typescript: true })],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      open: true,
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: 'src/setupTests',
      mockReset: true,
    },
    // Make env variables available
    define: {
      __APP_ENV__: JSON.stringify(env.APP_ENV),
    },
  }
})
