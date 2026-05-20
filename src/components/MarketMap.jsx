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

function distance(a, b) {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) sum += (a[i] - b[i]) ** 2;
  return Math.sqrt(sum);
}

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
        const dist = distance(d.vector, c);
        if (dist < bestDist) {
          best = idx;
          bestDist = dist;
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

    centroids = next.map((c, idx) => {
      if (!counts[idx]) return centroids[idx];
      return c.map((v) => v / counts[idx]);
    });
  }

  return { data, assignments, centroids };
}

export default function MarketMap({ rows, focusedTicker, selectedTicker, onSelect, mode, k }) {
  const computed = useMemo(() => {
    if (!rows.length) return null;
    const { data, assignments } = kMeans(rows, k);

    const momentums = rows.map((r) => Math.abs(r.momentum_6m));
    const minM = Math.min(...momentums);
    const maxM = Math.max(...momentums);

    const withBase = data.map((row, idx) => {
      const angle = (idx / data.length) * Math.PI * 2;
      const ringX = CX + RING_RADIUS * Math.cos(angle);
      const ringY = CY + RING_RADIUS * Math.sin(angle);
      return {
        ...row,
        cluster: assignments[idx],
        ringX,
        ringY,
        radius: scale(Math.abs(row.momentum_6m), minM, maxM, 3.6, 11.5),
        importance: Math.max(Math.abs(row.return_1y), Math.abs(row.momentum_6m)),
      };
    });

    const clusterGroups = Array.from({ length: k }, (_, clusterId) => withBase.filter((r) => r.cluster === clusterId));

    const clusterCenters = Array.from({ length: k }, (_, c) => {
      const theta = (c / k) * Math.PI * 2 - Math.PI / 2;
      const r = 185;
      return { x: CX + r * Math.cos(theta), y: CY + r * Math.sin(theta) };
    });

    const positioned = withBase.map((row) => {
      const members = clusterGroups[row.cluster];
      const idx = members.findIndex((r) => r.ticker === row.ticker);
      const center = clusterCenters[row.cluster];
      const localA = (idx / Math.max(members.length, 1)) * Math.PI * 2;
      const localR = 10 + (idx % 8) * 4 + Math.floor(idx / 8) * 0.9;
      const structX = Math.min(WIDTH - PAD, Math.max(PAD, center.x + localR * Math.cos(localA)));
      const structY = Math.min(HEIGHT - PAD, Math.max(PAD, center.y + localR * Math.sin(localA)));
      return { ...row, structX, structY };
    });

    const topLabels = new Set([...positioned].sort((a, b) => b.importance - a.importance).slice(0, 20).map((r) => r.ticker));

    const clusterLines = [];
    for (let c = 0; c < k; c += 1) {
      const members = positioned.filter((r) => r.cluster === c);
      members.forEach((node) => {
        const nearest = [...members]
          .filter((candidate) => candidate.ticker !== node.ticker)
          .map((candidate) => ({
            candidate,
            d: Math.hypot(node.structX - candidate.structX, node.structY - candidate.structY),
          }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 3);
        nearest.forEach(({ candidate, d }) => {
          const key = [node.ticker, candidate.ticker].sort().join('-');
          clusterLines.push({ key, a: node, b: candidate, d });
        });
      });
    }

    const uniqueLines = Array.from(new Map(clusterLines.map((l) => [l.key, l])).values());

    return { nodes: positioned, lines: uniqueLines, topLabels };
  }, [rows, k]);

  if (!computed) return null;

  const showRing = mode === 'ring';

  return (
    <div className="rounded-3xl border border-dashboard-border bg-dashboard-panel p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Animated Market Structure</h2>
        <p className="text-xs text-dashboard-muted">Ring Mode ↔ Structure Mode (KMeans)</p>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-dashboard-border bg-gradient-to-b from-white to-dashboard-panelAlt">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="h-[580px] w-full">
          <motion.g
            animate={showRing ? { rotate: 360 } : { rotate: 0 }}
            transition={showRing ? { duration: 120, repeat: Infinity, ease: 'linear' } : { duration: 1.5, ease: 'easeInOut' }}
            style={{ transformOrigin: `${CX}px ${CY}px` }}
          >
            {computed.lines.map((line, idx) => {
              const x1 = showRing ? line.a.ringX : line.a.structX;
              const y1 = showRing ? line.a.ringY : line.a.structY;
              const x2 = showRing ? line.b.ringX : line.b.structX;
              const y2 = showRing ? line.b.ringY : line.b.structY;
              return (
                <motion.line
                  key={line.key}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="#b7c7e8"
                  strokeWidth={Math.max(0.3, 1.05 - line.d / 140)}
                  strokeOpacity={0.22}
                  animate={{ strokeOpacity: [0.12, 0.26, 0.12] }}
                  transition={{ duration: 5.5 + (idx % 5), repeat: Infinity, ease: 'easeInOut' }}
                />
              );
            })}

            {computed.nodes.map((row, idx) => {
              const isFocused = focusedTicker && row.ticker === focusedTicker;
              const isSelected = selectedTicker && row.ticker === selectedTicker;
              const color = CLUSTER_PALETTE[row.cluster % CLUSTER_PALETTE.length];
              const showLabel = isFocused || isSelected || computed.topLabels.has(row.ticker);

              return (
                <motion.g
                  key={row.ticker}
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: Math.min(0.7, idx * 0.006) }}
                >
                  <motion.circle
                    animate={{
                      cx: showRing ? row.ringX : row.structX,
                      cy: showRing ? row.ringY : row.structY,
                      r: isFocused || isSelected ? row.radius + 3.8 : row.radius,
                    }}
                    transition={{
                      cx: { duration: 1.4, ease: 'easeInOut' },
                      cy: { duration: 1.4, ease: 'easeInOut' },
                      r: { duration: 0.4, ease: 'easeOut' },
                    }}
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
                      animate={{
                        x: (showRing ? row.ringX : row.structX) + row.radius + 4,
                        y: (showRing ? row.ringY : row.structY) - 2,
                      }}
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
