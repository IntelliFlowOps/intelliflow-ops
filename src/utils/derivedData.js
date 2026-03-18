export function hasRealValue(value) {
  return !(
    value === undefined ||
    value === null ||
    String(value).trim() === '' ||
    String(value).trim() === '-'
  );
}

export function preferSheetValue(primary, derived, fallback = '—') {
  if (hasRealValue(primary)) return primary;
  if (hasRealValue(derived)) return derived;
  return fallback;
}

export function parseMoney(value) {
  const num = parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

export function parseNumber(value) {
  const num = parseFloat(String(value ?? '').replace(/[^0-9.-]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

export function parsePercent(value) {
  const num = parseFloat(String(value ?? '').replace(/[^0-9.]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

export function formatMoney(num) {
  if (!Number.isFinite(num) || num === 0) return '—';
  return `$${num.toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercent(num) {
  if (!Number.isFinite(num) || num === 0) return '—';
  return `${num.toFixed(1)}%`;
}

export function deriveCampaignHealth(row = {}) {
  const ctr = parsePercent(row['CTR'] || row['Blended CTR']);
  const cpl = parseMoney(row['Cost / Lead'] || row['CPL']);
  const leads = parseNumber(row['Leads']);
  const spend = parseMoney(row['Spend']);

  if (ctr === 0 && cpl === 0 && leads === 0 && spend === 0) return '—';
  if (ctr >= 2 && cpl > 0 && cpl < 100) return 'Healthy';
  if (ctr < 1 || (cpl >= 150 && cpl > 0)) return 'Watch';
  return 'Neutral';
}

export function deriveCampaignSuggestion(row = {}, context = {}) {
  const health = deriveCampaignHealth(row);
  const activeCustomers = parseNumber(context?.dashboard?.kpis?.['Active Customers']);
  const target = 25;

  if (health === 'Watch') {
    return `Tighten this before scaling. Priority is moving from ${activeCustomers} to ${target} paying clients without wasted spend.`;
  }

  if (health === 'Healthy') {
    return `This is a stronger candidate for more budget if lead quality is holding.`;
  }

  return `Compare this against your best converting offer before changing spend.`;
}

export function deriveCustomerSuggestion(customer = {}, context = {}) {
  const status = String(customer['Status'] || '').trim();
  const activeCustomers = parseNumber(context?.dashboard?.kpis?.['Active Customers']);
  const target = 25;

  if (status === 'At Risk') {
    return `Protect retention fast. Every saved client matters while pushing from ${activeCustomers} to ${target} paying clients.`;
  }

  if (status === 'Onboarding') {
    return `Get this client to value quickly. Faster activation protects retention and supports growth to ${target} clients.`;
  }

  if (status === 'Active') {
    return `Keep service quality high and look for expansion or stronger proof points from this account.`;
  }

  return `Review this account against current growth priorities and retention risk.`;
}

export function deriveSimpleMetricSet(row = {}) {
  const spend = parseMoney(row['Spend']);
  const leads = parseNumber(row['Leads']);
  const customers = parseNumber(row['Customers Won'] || row['Customers']);
  const cpl = spend > 0 && leads > 0 ? formatMoney(spend / leads) : '—';
  const closeRate = leads > 0 && customers > 0 ? formatPercent((customers / leads) * 100) : '—';

  return {
    derivedCostPerLead: cpl,
    derivedCloseRate: closeRate,
  };
}
