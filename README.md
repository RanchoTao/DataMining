# S&P500 Feature Matrix

A static React + Vite + Tailwind dashboard for visualizing S&P500 feature data from a local CSV.

## Live Deployment Target

After GitHub Pages deployment, the site is served at:

- https://ranchotao.github.io/DataMining/

## Tech Stack

- React
- Vite
- TailwindCSS
- PapaParse

## Data Source

- Source CSV: `sp500_features.csv`
- Public CSV used by frontend: `public/sp500_features.csv`
- Data is loaded with `fetch(`${import.meta.env.BASE_URL}sp500_features.csv`)` and parsed with PapaParse.

## Project Structure

```text
src/
  components/
    FeatureTable.jsx
    SummaryCards.jsx
  pages/
    DashboardPage.jsx
  utils/
    formatters.js
  App.jsx
  main.jsx
  index.css
public/
  sp500_features.csv
.github/workflows/
  deploy.yml
```

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Start dev server:

```bash
npm run dev
```

3. Build production bundle:

```bash
npm run build
```

4. Preview production build locally:

```bash
npm run preview
```

## GitHub Pages Deployment

This repository includes `.github/workflows/deploy.yml` to build and deploy the static site to GitHub Pages.

### One-time repository settings

1. In GitHub, open **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.

### How deployment runs

- On each push to `main`, GitHub Actions will:
  - install dependencies with `npm ci`
  - run `npm run build`
  - deploy `dist/` to GitHub Pages

## Dashboard Features

- Dark, quant-style UI.
- Header title: **S&P500 Feature Matrix**.
- Summary cards:
  - number of assets
  - average `return_1y`
  - average `volatility_1y`
  - worst `max_drawdown_1y`
- Search by ticker.
- Sortable columns:
  - `ticker`
  - `latest_price`
  - `return_1y`
  - `volatility_1y`
  - `momentum_6m`
  - `max_drawdown_1y`
- Scrollable table for large datasets.
- Loading and graceful error states.
- Percentage/price formatting and negative value highlighting.

## Constraints Followed

- Static frontend only.
- No backend APIs.
- No databases.
- No authentication.
