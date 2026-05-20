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

  const sortIndicator = (column) => {
    if (sortConfig.key !== column) return '↕';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  return (
    <div className="overflow-hidden rounded-xl border border-dashboard-border bg-dashboard-panel">
      <div className="max-h-[65vh] overflow-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-dashboard-panelAlt">
            <tr>
              {columns.map((column) => (
                <th key={column} className="border-b border-dashboard-border px-4 py-3 text-left">
                  <button
                    className="flex items-center gap-2 text-xs uppercase tracking-wide text-dashboard-muted hover:text-dashboard-text"
                    onClick={() => onSort(column)}
                    type="button"
                  >
                    {column}
                    <span>{sortIndicator(column)}</span>
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.ticker} className="border-b border-dashboard-border/50 hover:bg-dashboard-panelAlt/60">
                {columns.map((column) => (
                  <td
                    key={`${row.ticker}-${column}`}
                    className={`px-4 py-2.5 ${isNegative(column, row[column]) ? 'text-dashboard-negative' : 'text-dashboard-text'}`}
                  >
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
