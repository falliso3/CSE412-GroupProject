## Local Development

Run commands from `my-app`:

```bash
cd my-app
npm install
npm run dev
```

Production build:

```bash
cd my-app
npm run build
```

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow at:
`.github/workflows/deploy-github-pages.yml`

### One-time setup

1. Push this repo to GitHub.
2. In GitHub, go to:
   `Settings` -> `Pages`
3. Under **Build and deployment**, set:
   - **Source** = `GitHub Actions`
4. Ensure your default deploy branch is `main` (the workflow triggers on pushes to `main`).

### Deploy

Push to `main`:

```bash
git add .
git commit -m "Set up GitHub Pages deploy"
git push origin main
```

GitHub Actions will build `my-app` and publish `my-app/dist` to GitHub Pages.

### Site URL

Your deployed app URL will be:

`https://<your-github-username>.github.io/<your-repo-name>/`

The Vite config already auto-sets the correct base path in CI using the repo name.
