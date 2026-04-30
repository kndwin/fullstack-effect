import { foldkit } from '@foldkit/vite-plugin'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [tailwindcss(), foldkit({ devToolsMcpPort: 9988 })],
  server: {
    proxy: {
      '/rpc': 'http://127.0.0.1:3010',
    },
  },
  optimizeDeps: {
    entries: ['src/main.ts'],
  },
})
