export function formatPrice(value) {
  if (!Number.isFinite(value)) return '—';
  return `$${value.toFixed(2)}`;
}

export function formatPercent(value) {
  if (!Number.isFinite(value)) return '—';
  return `${(value * 100).toFixed(2)}%`;
}

export function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : NaN;
}
