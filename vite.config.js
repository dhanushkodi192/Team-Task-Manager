import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  preview: {
    allowedHosts: ['team-task-manager-production-a6507.up.railway.app']
  }
})
