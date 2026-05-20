# S&P500 Market Map

A static React + Vite + Tailwind dashboard that visualizes S&P500 features as an animated, light-theme market map using local CSV data.

## Live Site

- https://ranchotao.github.io/DataMining/

## Stack

- React
- Vite
- TailwindCSS
- PapaParse
- Framer Motion

## Data Pipeline

- Source file: `sp500_features.csv`
- Frontend-loaded file: `public/sp500_features.csv`
- Fetch path: `fetch(`${import.meta.env.BASE_URL}sp500_features.csv`)`
- Parser: PapaParse (`header: true`, `skipEmptyLines: true`)

## Features

- Light, minimal, VD-style UI with rounded cards, subtle shadows, and thin borders.
- Main two-state animated SVG market map:
  - x-axis: `volatility_1y`
  - y-axis: `return_1y`
  - node size: `abs(momentum_6m)`
  - node color: soft blue (positive return), soft red (negative return)
  - top 15 labels by importance (`max(abs(return_1y), abs(momentum_6m))`)
  - faint animated proximity lines
  - smooth node entry + subtle breathing motion
- Interaction:
  - Hover tooltip with ticker and all feature values
  - Click node to highlight selection
  - Search box focuses/highlights ticker
- Summary cards:
  - number of assets
  - average return
  - average volatility
  - worst drawdown
- Secondary sortable/searchable table below visualization.

## Project Structure

```text
src/
  components/
    FeatureTable.jsx
    MarketMap.jsx
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

## Local Run

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## GitHub Pages Deployment

`vite.config.js` is configured with:

- `base: '/DataMining/'`

Deployment is handled by `.github/workflows/deploy.yml` on pushes to `main`.

## Constraints

- Static frontend only.
- No backend, database, or authentication.
- No predictions or trading advice.


## Two-State Structure Controls

- Toggle button: **Form Market Structure** / **Return to Ring**.
- KMeans cluster count selector: **k = 4..12** (default 8).
