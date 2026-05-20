# S&P500 Feature Matrix

A lightweight React + Vite dashboard for exploring S&P500 feature data from a local CSV file.

## Stack

- React
- Vite
- TailwindCSS
- PapaParse

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
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run development server:

```bash
npm run dev
```

3. Build production assets:

```bash
npm run build
```

## Features

- Dark themed, quant-style dashboard UI.
- CSV loading via `fetch('/sp500_features.csv')` and PapaParse.
- Sortable columns.
- Ticker search.
- Scrollable data table for large datasets.
- Loading and error states.
- Summary cards (average return, average volatility, worst drawdown, and asset count).
- Numeric formatting for prices and percentages.
- Visual highlighting for negative feature values.
