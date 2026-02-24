import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const configuredBase = process.env.VITE_BASE_PATH

export default defineConfig({
  base: configuredBase || '/',
  plugins: [react()],
})
