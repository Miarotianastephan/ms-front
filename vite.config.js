import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { cloudflare } from "@cloudflare/vite-plugin";


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    cloudflare({ viteEnvironment: { name: "worker" } }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
