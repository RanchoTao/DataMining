import { useEffect, useMemo, useState } from 'react';
import Papa from 'papaparse';
import FeatureTable from '../components/FeatureTable';
import SummaryCards from '../components/SummaryCards';
import { parseNumber } from '../utils/formatters';

export default function DashboardPage() {
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState('');
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
        if (!response.ok) {
          throw new Error(`Failed to load CSV: ${response.status}`);
        }

        const csvText = await response.text();
        const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });

        if (parsed.errors.length) {
          throw new Error(parsed.errors[0].message);
        }

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

        if (active) {
          setRows(normalized);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Unexpected error while loading CSV.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      active = false;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const needle = search.trim().toUpperCase();
    if (!needle) return rows;
    return rows.filter((row) => row.ticker.includes(needle));
  }, [rows, search]);

  const sortedRows = useMemo(() => {
    const copy = [...filteredRows];
    copy.sort((a, b) => {
      const { key, direction } = sortConfig;
      const order = direction === 'asc' ? 1 : -1;
      const left = a[key];
      const right = b[key];

      if (typeof left === 'string' && typeof right === 'string') {
        return left.localeCompare(right) * order;
      }
      return ((left ?? 0) - (right ?? 0)) * order;
    });

    return copy;
  }, [filteredRows, sortConfig]);

  const onSort = (column) => {
    setSortConfig((prev) => ({
      key: column,
      direction: prev.key === column && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-6 rounded-xl border border-dashboard-border bg-dashboard-panel px-6 py-5">
        <h1 className="text-2xl font-semibold tracking-tight">S&amp;P500 Feature Matrix</h1>
        <p className="mt-1 text-sm text-dashboard-muted">Interactive visualization of S&amp;P500 asset features.</p>
      </header>

      {loading ? (
        <div className="rounded-xl border border-dashboard-border bg-dashboard-panel px-6 py-12 text-center text-dashboard-muted">
          Loading feature matrix...
        </div>
      ) : error ? (
        <div className="rounded-xl border border-dashboard-negative/40 bg-dashboard-panel px-6 py-12 text-center text-dashboard-negative">
          Unable to load data: {error}
        </div>
      ) : (
        <section className="space-y-4">
          <SummaryCards rows={rows} />

          <div className="rounded-xl border border-dashboard-border bg-dashboard-panel px-4 py-3">
            <label htmlFor="ticker-search" className="mb-2 block text-xs uppercase tracking-wide text-dashboard-muted">
              Search by ticker
            </label>
            <input
              id="ticker-search"
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="e.g., AAPL"
              className="w-full rounded-md border border-dashboard-border bg-dashboard-bg px-3 py-2 text-sm text-dashboard-text outline-none ring-dashboard-accent transition focus:ring-2"
            />
          </div>

          <FeatureTable rows={sortedRows} sortConfig={sortConfig} onSort={onSort} />
        </section>
      )}
    </main>
  );
}
