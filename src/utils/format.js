export function displayValue(val, fallback = '—') {
  if (val === null || val === undefined || val === '' || val === '-') return fallback;
  return val;
}

export function formatCurrency(val) {
  if (!val || val === '-' || val === '') return '—';
  const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
  if (isNaN(num)) return val;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(num);
}

export function formatPercent(val) {
  if (!val || val === '-' || val === '') return '—';
  return val;
}

export function formatDate(val) {
  if (!val || val === '-' || val === '') return '—';
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return val;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch { return val; }
}

export function formatTimestamp(ts) {
  if (!ts) return 'Never';
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
}

export function isRowPopulated(row) {
  if (!row) return false;
  return Object.values(row).some((v) => v && v.trim() !== '' && v.trim() !== '-');
}
