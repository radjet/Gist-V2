# Deployment Instructions

## GitHub Pages

This project is configured to deploy to `https://[user].github.io/Gist-V2/`.

### 1. Prerequisites
- Ensure your repository is named `Gist-V2`.
- If your repository name is different, update `base: '/Gist-V2/'` in `vite.config.ts`.

### 2. Configure Secrets
To avoid exposing your Mapbox token in the source code during public deployment:
1. Go to your GitHub Repository > Settings > Secrets and variables > Actions.
2. Create a New Repository Secret named `VITE_MAPBOX_TOKEN`.
3. Paste your Mapbox public token.

### 3. Deploy via GitHub Actions
Create a file `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
        env:
          VITE_MAPBOX_TOKEN: ${{ secrets.VITE_MAPBOX_TOKEN }}
      - uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    runs-on: ubuntu-latest
    needs: build
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

## Netlify

1. Connect your repository to Netlify.
2. **Build Command**: `npm run build`
3. **Publish Directory**: `dist`
4. **Environment Variables**: Add `VITE_MAPBOX_TOKEN` in Netlify Site Settings.
5. **SPA Routing**: Vite handles this, but ensure no special redirects are needed for hash routing (default). If using history mode, create a `_redirects` file:
   ```
   /* /index.html 200
   ```

## Note on Routing
This app uses `HashRouter` (`/#/path`), which is fully compatible with GitHub Pages static hosting. No special 404 hacks are required.
