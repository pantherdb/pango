import { defineConfig } from "vitest/config"
import react from "@vitejs/plugin-react"
import path from 'path';
import tsChecker from 'vite-plugin-checker';

// https://vitejs.dev/config/
export default defineConfig({
  logLevel: 'info',
  plugins: [
    react(),
    tsChecker({ typescript: true }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    open: true,
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "src/setupTests",
    mockReset: true,
  },
})
