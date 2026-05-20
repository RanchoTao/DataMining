import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import FeatureTable from '../components/FeatureTable';
import MarketMap from '../components/MarketMap';
import SummaryCards from '../components/SummaryCards';
import { parseNumber } from '../utils/formatters';

export default function DashboardPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedTicker, setSelectedTicker] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'ticker', direction: 'asc' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function loadData() {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}sp500_features.csv`);
        if (!response.ok) throw new Error(`Failed to load CSV: ${response.status}`);
        const csvText = await response.text();
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
        if (parsed.errors.length) throw new Error(parsed.errors[0].message);

        const normalized = parsed.data
          .map((row) => ({
            ticker: String(row.ticker ?? '').trim().toUpperCase(),
            latest_price: parseNumber(row.latest_price),
            return_1y: parseNumber(row.return_1y),
            volatility_1y: parseNumber(row.volatility_1y),
            momentum_6m: parseNumber(row.momentum_6m),
            max_drawdown_1y: parseNumber(row.max_drawdown_1y),
          }))
          .filter((row) => row.ticker);

        if (active) setRows(normalized);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : 'Unexpected error while loading CSV.');
      } finally {
        if (active) setLoading(false);
      }
    }
    loadData();
    return () => {
      active = false;
    };
  }, []);

  const focusedTicker = useMemo(() => {
    const candidate = search.trim().toUpperCase();
    if (!candidate) return '';
    const match = rows.find((row) => row.ticker === candidate) || rows.find((row) => row.ticker.includes(candidate));
    return match?.ticker ?? '';
  }, [rows, search]);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toUpperCase();
    if (!needle) return rows;
    return rows.filter((row) => row.ticker.includes(needle));
  }, [rows, search]);

  const sortedRows = useMemo(() => {
    return [...filteredRows].sort((a, b) => {
      const { key, direction } = sortConfig;
      const order = direction === 'asc' ? 1 : -1;
      const left = a[key];
      const right = b[key];
      if (typeof left === 'string' && typeof right === 'string') return left.localeCompare(right) * order;
      return ((left ?? 0) - (right ?? 0)) * order;
    });
  }, [filteredRows, sortConfig]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="rounded-3xl border border-dashboard-border bg-white p-7 shadow-soft">
        <h1 className="text-3xl font-semibold tracking-tight text-slate-800">S&amp;P500 Market Map</h1>
        <p className="mt-2 text-sm text-dashboard-muted">Visual structure of S&amp;P500 assets based on return, risk, momentum and drawdown.</p>
      </header>

      {loading ? (
        <div className="mt-6 rounded-3xl border border-dashboard-border bg-white px-6 py-16 text-center text-dashboard-muted shadow-soft">Loading market structure...</div>
      ) : error ? (
        <div className="mt-6 rounded-3xl border border-dashboard-negative/40 bg-white px-6 py-16 text-center text-dashboard-negative shadow-soft">Unable to load data: {error}</div>
      ) : (
        <section className="mt-6 space-y-6">
          <SummaryCards rows={rows} />

          <div className="rounded-3xl border border-dashboard-border bg-white p-5 shadow-soft">
            <label htmlFor="ticker-search" className="mb-2 block text-xs uppercase tracking-wide text-dashboard-muted">Find ticker</label>
            <input
              id="ticker-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search and focus a ticker (e.g., AAPL)"
              className="w-full rounded-xl border border-dashboard-border bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none ring-dashboard-accent transition focus:ring-2"
            />
          </div>

          <MarketMap
            rows={rows}
            focusedTicker={focusedTicker}
            selectedTicker={selectedTicker}
            onSelect={(ticker) => setSelectedTicker((prev) => (prev === ticker ? '' : ticker))}
          />

          <div className="space-y-3">
            <h3 className="text-sm font-medium uppercase tracking-wide text-dashboard-muted">Feature table (secondary view)</h3>
            <FeatureTable
              rows={sortedRows}
              sortConfig={sortConfig}
              onSort={(column) =>
                setSortConfig((prev) => ({
                  key: column,
                  direction: prev.key === column && prev.direction === 'asc' ? 'desc' : 'asc',
                }))
              }
            />
          </div>
        </section>
      )}
    </main>
  );
}
