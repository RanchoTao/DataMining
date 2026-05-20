import { formatPercent } from '../utils/formatters';

export default function SummaryCards({ rows }) {
  if (!rows.length) return null;

  const totals = rows.reduce(
    (acc, row) => {
      acc.returnTotal += row.return_1y;
      acc.volatilityTotal += row.volatility_1y;
      acc.worstDrawdown = Math.min(acc.worstDrawdown, row.max_drawdown_1y);
      return acc;
    },
    { returnTotal: 0, volatilityTotal: 0, worstDrawdown: Number.POSITIVE_INFINITY }
  );

  const cardItems = [
    { label: '资产数量', value: rows.length.toLocaleString() },
    { label: '平均收益率', value: formatPercent(totals.returnTotal / rows.length) },
    { label: '平均波动率', value: formatPercent(totals.volatilityTotal / rows.length) },
    { label: '最大回撤', value: formatPercent(totals.worstDrawdown), negative: true },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cardItems.map((card) => (
        <div key={card.label} className="rounded-2xl border border-dashboard-border bg-dashboard-panel p-5 shadow-soft">
          <p className="text-sm tracking-wide text-dashboard-muted">{card.label}</p>
          <p className={`mt-2 text-2xl font-semibold ${card.negative ? 'text-dashboard-negative' : 'text-dashboard-text'}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
