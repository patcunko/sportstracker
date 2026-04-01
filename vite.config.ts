import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/nhl': {
        target: 'https://api-web.nhle.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/nhl/, ''),
      },
      '/espn-rss': {
        target: 'https://www.espn.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/espn-rss/, ''),
      },
    },
  },
})
