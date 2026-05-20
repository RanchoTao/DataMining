import { motion } from 'framer-motion';
import { formatPercent, formatPrice } from '../utils/formatters';

const WIDTH = 1000;
const HEIGHT = 580;
const PAD = 56;

const scale = (value, min, max, low, high) => {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || min === max) {
    return (low + high) / 2;
  }
  return low + ((value - min) / (max - min)) * (high - low);
};

export default function MarketMap({ rows, focusedTicker, selectedTicker, onSelect }) {
  if (!rows.length) return null;

  const volatilities = rows.map((row) => row.volatility_1y);
  const returns = rows.map((row) => row.return_1y);
  const momentums = rows.map((row) => Math.abs(row.momentum_6m));

  const minV = Math.min(...volatilities);
  const maxV = Math.max(...volatilities);
  const minR = Math.min(...returns);
  const maxR = Math.max(...returns);
  const minM = Math.min(...momentums);
  const maxM = Math.max(...momentums);

  const plotted = rows.map((row) => ({
    ...row,
    x: scale(row.volatility_1y, minV, maxV, PAD, WIDTH - PAD),
    y: scale(row.return_1y, minR, maxR, HEIGHT - PAD, PAD),
    radius: scale(Math.abs(row.momentum_6m), minM, maxM, 4, 16),
    importance: Math.max(Math.abs(row.return_1y), Math.abs(row.momentum_6m)),
  }));

  const labelSet = new Set(
    [...plotted].sort((a, b) => b.importance - a.importance).slice(0, 20).map((row) => row.ticker)
  );

  const lines = [];
  for (let i = 0; i < plotted.length; i += 1) {
    for (let j = i + 1; j < plotted.length; j += 1) {
      const a = plotted[i];
      const b = plotted[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 90) {
        lines.push({ a, b, dist });
      }
    }
  }

  return (
    <div className="rounded-3xl border border-dashboard-border bg-dashboard-panel p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Market Structure Map</h2>
        <p className="text-xs text-dashboard-muted">x: volatility · y: return · size: |momentum|</p>
      </div>
      <div className="relative overflow-hidden rounded-2xl border border-dashboard-border bg-gradient-to-b from-white to-dashboard-panelAlt">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[560px] w-full">
          <g className="map-drift">
            {lines.slice(0, 1800).map((line, idx) => (
              <line
                key={`${line.a.ticker}-${line.b.ticker}-${idx}`}
                x1={line.a.x}
                y1={line.a.y}
                x2={line.b.x}
                y2={line.b.y}
                stroke="#b7c7e8"
                strokeWidth={Math.max(0.35, 1.2 - line.dist / 120)}
                className="map-line"
                style={{ animationDelay: `${(idx % 10) * 0.4}s` }}
              />
            ))}
          </g>

          {plotted.map((row, idx) => {
            const isFocused = focusedTicker && row.ticker === focusedTicker;
            const isSelected = selectedTicker && row.ticker === selectedTicker;
            const color = row.return_1y >= 0 ? '#76a8ef' : '#ef9aa5';
            return (
              <motion.g
                key={row.ticker}
                initial={{ opacity: 0, scale: 0.3 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.45, delay: Math.min(idx * 0.008, 0.8) }}
              >
                <motion.circle
                  cx={row.x}
                  cy={row.y}
                  r={isFocused || isSelected ? row.radius + 4 : row.radius}
                  fill={color}
                  fillOpacity={0.82}
                  stroke={isFocused || isSelected ? '#1d4ed8' : '#ffffff'}
                  strokeWidth={isFocused || isSelected ? 2.2 : 1.1}
                  animate={{
                    cy: [row.y, row.y - 2, row.y],
                  }}
                  transition={{
                    repeat: Infinity,
                    duration: 4 + (idx % 6),
                    ease: 'easeInOut',
                  }}
                  onClick={() => onSelect(row.ticker)}
                >
                  <title>{`${row.ticker}
Price: ${formatPrice(row.latest_price)}
Return: ${formatPercent(row.return_1y)}
Volatility: ${formatPercent(row.volatility_1y)}
Momentum: ${formatPercent(row.momentum_6m)}
Drawdown: ${formatPercent(row.max_drawdown_1y)}`}</title>
                </motion.circle>
                {labelSet.has(row.ticker) && (
                  <text x={row.x + row.radius + 3} y={row.y - 2} fontSize="10" fill="#334155">
                    {row.ticker}
                  </text>
                )}
              </motion.g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
