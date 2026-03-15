import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const isAdminAssetName = (name = '') => /admin/i.test(name)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        chunkFileNames: (chunkInfo) =>
          isAdminAssetName(chunkInfo.name)
            ? 'assets/admin-[hash].js'
            : 'assets/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const assetName = assetInfo.names?.[0] || assetInfo.name || ''

          if (
            assetName.toLowerCase().endsWith('.css') &&
            isAdminAssetName(assetName)
          ) {
            return 'assets/admin-[hash][extname]'
          }

          return 'assets/[name]-[hash][extname]'
        },
      },
    },
  },
  server: {
    port: 5173,
    watch: {
      usePolling: true,
      interval: 150,
    },
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
