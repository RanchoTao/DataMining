import { formatPercent, formatPrice } from '../utils/formatters';

const percentColumns = new Set(['return_1y', 'volatility_1y', 'momentum_6m', 'max_drawdown_1y']);

export default function FeatureTable({ rows, sortConfig, onSort }) {
  const columns = ['ticker', 'latest_price', 'return_1y', 'volatility_1y', 'momentum_6m', 'max_drawdown_1y'];

  const formatCell = (column, value) => {
    if (column === 'latest_price') return formatPrice(value);
    if (percentColumns.has(column)) return formatPercent(value);
    return value;
  };

  const isNegative = (column, value) => percentColumns.has(column) && Number(value) < 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-dashboard-border bg-white shadow-soft/70">
      <div className="max-h-[420px] overflow-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th key={column} className="border-b border-dashboard-border px-4 py-3 text-left">
                  <button
                    className="flex items-center gap-2 text-xs uppercase tracking-wide text-dashboard-muted hover:text-dashboard-text"
                    onClick={() => onSort(column)}
                    type="button"
                  >
                    {column}
                    <span>{sortConfig.key === column ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.ticker} className="border-b border-slate-100 hover:bg-slate-50/80">
                {columns.map((column) => (
                  <td key={`${row.ticker}-${column}`} className={`px-4 py-2.5 ${isNegative(column, row[column]) ? 'text-dashboard-negative' : 'text-slate-700'}`}>
                    {formatCell(column, row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
