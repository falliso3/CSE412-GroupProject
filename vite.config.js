import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative asset paths are the safest default for GitHub Pages.
  base: './',
  plugins: [react()],
})
