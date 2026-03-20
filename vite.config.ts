import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vite.dev/config/
// base: '/glyph/' ensures asset paths work on GitHub Pages subdirectory deployment.
// import.meta.env.BASE_URL is statically replaced at build time with this value.
export default defineConfig({
  base: '/glyph/',
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
