import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { formatPercent, formatPrice } from '../utils/formatters';

const WIDTH = 1000;
const HEIGHT = 620;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const RING_RADIUS = 248;
const PAD = 72;

const CLUSTER_PALETTE = ['#7ba8f8', '#f4a3b4', '#b9a6ff', '#88d7b2', '#93c5fd', '#f9b47c', '#a7d8ff', '#c7b8ff', '#80cbc4', '#f29eb2', '#9ec5ff', '#9ad6b3'];
const FEATURES = ['return_1y', 'volatility_1y', 'momentum_6m', 'max_drawdown_1y'];

const scale = (value, min, max, low, high) => {
  if (!Number.isFinite(value) || !Number.isFinite(min) || !Number.isFinite(max) || min === max) return (low + high) / 2;
  return low + ((value - min) / (max - min)) * (high - low);
};

const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

function normalizeRows(rows) {
  const stats = FEATURES.map((key) => {
    const values = rows.map((r) => r[key]);
    return { key, min: Math.min(...values), max: Math.max(...values) };
  });

  return rows.map((row) => ({
    ...row,
    vector: stats.map((s) => scale(row[s.key], s.min, s.max, 0, 1)),
  }));
}

function kMeans(rows, k, maxIter = 18) {
  const data = normalizeRows(rows);
  let centroids = data.slice(0, k).map((d) => [...d.vector]);
  let assignments = new Array(data.length).fill(0);

  for (let iter = 0; iter < maxIter; iter += 1) {
    assignments = data.map((d) => {
      let best = 0;
      let bestDist = Number.POSITIVE_INFINITY;
      centroids.forEach((c, idx) => {
        const d0 = Math.sqrt(c.reduce((acc, val, i) => acc + (d.vector[i] - val) ** 2, 0));
        if (d0 < bestDist) {
          bestDist = d0;
          best = idx;
        }
      });
      return best;
    });

    const next = Array.from({ length: k }, () => Array(FEATURES.length).fill(0));
    const counts = Array(k).fill(0);

    data.forEach((d, idx) => {
      const a = assignments[idx];
      counts[a] += 1;
      d.vector.forEach((v, j) => {
        next[a][j] += v;
      });
    });

    centroids = next.map((c, idx) => (counts[idx] ? c.map((v) => v / counts[idx]) : centroids[idx]));
  }

  return { data, assignments };
}

export default function MarketMap({ rows, focusedTicker, selectedTicker, onSelect, mode, k }) {
  const computed = useMemo(() => {
    if (!rows.length) return null;
    const { data, assignments } = kMeans(rows, k);

    const vol = rows.map((r) => r.volatility_1y);
    const ret = rows.map((r) => r.return_1y);
    const mom = rows.map((r) => Math.abs(r.momentum_6m));

    const minV = Math.min(...vol);
    const maxV = Math.max(...vol);
    const minR = Math.min(...ret);
    const maxR = Math.max(...ret);
    const minM = Math.min(...mom);
    const maxM = Math.max(...mom);

    const nodes = data.map((row, idx) => {
      const angle = (idx / data.length) * Math.PI * 2;
      const ringX = CX + RING_RADIUS * Math.cos(angle);
      const ringY = CY + RING_RADIUS * Math.sin(angle);

      return {
        ...row,
        cluster: assignments[idx],
        ringX,
        ringY,
        scatterX: scale(row.volatility_1y, minV, maxV, PAD, WIDTH - PAD),
        scatterY: scale(row.return_1y, minR, maxR, HEIGHT - PAD, PAD),
        radius: scale(Math.abs(row.momentum_6m), minM, maxM, 3.6, 11.5),
        importance: Math.max(Math.abs(row.return_1y), Math.abs(row.momentum_6m)),
      };
    });

    const topLabels = new Set([...nodes].sort((a, b) => b.importance - a.importance).slice(0, 15).map((r) => r.ticker));

    const clusterLines = [];
    for (let c = 0; c < k; c += 1) {
      const members = nodes.filter((r) => r.cluster === c);
      members.forEach((node) => {
        const nearest = members
          .filter((candidate) => candidate.ticker !== node.ticker)
          .map((candidate) => ({ candidate, d: distance([node.scatterX, node.scatterY], [candidate.scatterX, candidate.scatterY]) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 2);

        nearest.forEach(({ candidate, d }) => {
          const key = [node.ticker, candidate.ticker].sort().join('-');
          clusterLines.push({ key, a: node, b: candidate, d });
        });
      });
    }

    const uniqueLines = Array.from(new Map(clusterLines.map((l) => [l.key, l])).values());
    return { nodes, lines: uniqueLines, topLabels };
  }, [rows, k]);

  if (!computed) return null;
  const inRing = mode === 'ring';

  return (
    <div className="rounded-3xl border border-dashboard-border bg-dashboard-panel p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Animated Market Structure</h2>
        <p className="text-xs text-dashboard-muted">Intro ring → volatility/return market map</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-dashboard-border bg-gradient-to-b from-white to-dashboard-panelAlt">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[580px] w-full">
          <motion.g
            animate={inRing ? { rotate: 360 } : { rotate: 0 }}
            transition={inRing ? { duration: 120, repeat: Infinity, ease: 'linear' } : { duration: 1.3, ease: 'easeInOut' }}
            style={{ transformOrigin: `${CX}px ${CY}px` }}
          >
            {!inRing &&
              computed.lines.map((line, idx) => (
                <motion.line
                  key={line.key}
                  x1={line.a.scatterX}
                  y1={line.a.scatterY}
                  x2={line.b.scatterX}
                  y2={line.b.scatterY}
                  stroke="#b7c7e8"
                  strokeWidth={Math.max(0.3, 1.0 - line.d / 150)}
                  strokeOpacity={0.18}
                  animate={{ strokeOpacity: [0.1, 0.24, 0.1] }}
                  transition={{ duration: 5 + (idx % 4), repeat: Infinity, ease: 'easeInOut' }}
                />
              ))}

            {computed.nodes.map((row, idx) => {
              const isFocused = focusedTicker && row.ticker === focusedTicker;
              const isSelected = selectedTicker && row.ticker === selectedTicker;
              const color = CLUSTER_PALETTE[row.cluster % CLUSTER_PALETTE.length];
              const showLabel = isFocused || isSelected || computed.topLabels.has(row.ticker);

              return (
                <motion.g key={row.ticker} initial={{ opacity: 0, scale: 0.4 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: Math.min(0.7, idx * 0.006) }}>
                  <motion.circle
                    animate={{
                      cx: inRing ? row.ringX : row.scatterX,
                      cy: inRing ? row.ringY : row.scatterY,
                      r: isFocused || isSelected ? row.radius + 3.8 : row.radius,
                    }}
                    transition={{ cx: { duration: 1.4, ease: 'easeInOut' }, cy: { duration: 1.4, ease: 'easeInOut' }, r: { duration: 0.35 } }}
                    fill={color}
                    fillOpacity={0.84}
                    stroke={isFocused || isSelected ? '#1d4ed8' : '#ffffff'}
                    strokeWidth={isFocused || isSelected ? 2.1 : 1}
                    onClick={() => onSelect(row.ticker)}
                  >
                    <title>{`${row.ticker}
Cluster: ${row.cluster + 1}
Price: ${formatPrice(row.latest_price)}
Return: ${formatPercent(row.return_1y)}
Volatility: ${formatPercent(row.volatility_1y)}
Momentum: ${formatPercent(row.momentum_6m)}
Drawdown: ${formatPercent(row.max_drawdown_1y)}`}</title>
                  </motion.circle>

                  {showLabel && (
                    <motion.text
                      animate={{ x: (inRing ? row.ringX : row.scatterX) + row.radius + 4, y: (inRing ? row.ringY : row.scatterY) - 2 }}
                      transition={{ duration: 1.4, ease: 'easeInOut' }}
                      fontSize="10"
                      fill="#334155"
                    >
                      {row.ticker}
                    </motion.text>
                  )}
                </motion.g>
              );
            })}
          </motion.g>
        </svg>
      </div>
    </div>
  );
}
