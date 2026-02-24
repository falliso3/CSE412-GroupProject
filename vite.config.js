import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
const repoName = process.env.GITHUB_REPOSITORY?.split('/')[1]
const ghPagesBase =
  process.env.GITHUB_ACTIONS === 'true' && repoName ? `/${repoName}/` : '/'

export default defineConfig({
  base: ghPagesBase,
  plugins: [react()],
})
