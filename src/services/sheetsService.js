import Papa from 'papaparse';
import { TABS, buildCsvUrl, ALL_TAB_KEYS } from '../config/sheets.js';

export async function fetchTab(tabKey) {
  const tabName = TABS[tabKey];
  if (!tabName) return { data: [], error: `Unknown tab key: ${tabKey}` };

  const url = buildCsvUrl(tabName);

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${tabName}`);

    const csvText = await response.text();
    if (!csvText || csvText.trim().length === 0) return { data: [], error: null };

    const cleaned = csvText.split('').filter(function(c){ return c !== String.fromCharCode(13); }).join('');
    const parsed = Papa.parse(cleaned, { header: false, skipEmptyLines: false });
    if (parsed.errors?.length > 0) console.warn(`CSV parse warnings for ${tabName}:`, parsed.errors);

    const rawRows = parsed.data || [];
    const normalized = normalizeTab(tabKey, rawRows);
    return { data: normalized, error: null };
  } catch (err) {
    console.error(`Failed to fetch tab ${tabName}:`, err);
    return { data: [], error: err.message };
  }
}

export async function fetchAllTabs() {
  const results = {};
  const promises = ALL_TAB_KEYS.map(async (key) => { results[key] = await fetchTab(key); });
  await Promise.allSettled(promises);
  results._timestamp = Date.now();
  return results;
}

function normalizeTab(tabKey, rawRows) {
  switch (tabKey) {
    case 'DASHBOARD': return normalizeDashboard(rawRows);
    case 'CUSTOMERS': return normalizeCustomers(rawRows);
    case 'MARKETERS': return normalizeMarketers(rawRows);
    case 'CAMPAIGNS': return normalizeWithHeaderRow(rawRows, 1);
    case 'CREATIVE_INSIGHTS': return normalizeWithHeaderRow(rawRows, 1);
    case 'COMMISSION_RULES': return normalizeCommissionRules(rawRows);
    case 'COMMISSION_LEDGER': return normalizeCommissionLedger(rawRows);
    case 'FOUNDERS_KPIS': return normalizeWithHeaderRow(rawRows, 1);
    case 'CUSTOMER_ACTIVITY': return normalizeWithHeaderRow(rawRows, 1);
    case 'DATA_DICTIONARY': return normalizeWithHeaderRow(rawRows, 1);
    case 'ALL_ANALYTICS': return normalizeWithHeaderRow(rawRows, 0);
    default: return rawRows;
  }
}

function normalizeWithHeaderRow(rawRows, headerIndex) {
  if (!rawRows || rawRows.length <= headerIndex) return [];
  const headers = rawRows[headerIndex].map((h) => (h || '').trim());
  const dataRows = rawRows.slice(headerIndex + 1);
  return dataRows
    .filter((row) => row.some((cell) => cell && cell.trim() !== ''))
    .map((row) => {
      const obj = {};
      headers.forEach((header, i) => { if (header) obj[header] = (row[i] || '').trim(); });
      return obj;
    });
}

function normalizeDashboard(rawRows) {
  if (!rawRows || rawRows.length < 2) return { kpis: {}, marketing: {}, watchlist: [], lastUpdated: '' };
  const lastUpdated = (rawRows[1] && rawRows[1][1]) || '';
  const kpis = {};
  for (let i = 4; i <= 9 && i < rawRows.length; i++) {
    const label = (rawRows[i]?.[0] || '').trim();
    const value = (rawRows[i]?.[1] || '').trim();
    if (label) kpis[label] = value;
  }
  const marketing = {};
  for (let i = 4; i <= 9 && i < rawRows.length; i++) {
    const label = (rawRows[i]?.[5] || '').trim();
    const value = (rawRows[i]?.[6] || '').trim();
    if (label) marketing[label] = value;
  }
  const watchlistHeaders = (rawRows[12] || []).map((h) => (h || '').trim());
  const watchlist = rawRows.slice(13)
    .filter((row) => row.some((cell) => cell && cell.trim() !== ''))
    .map((row) => {
      const obj = {};
      watchlistHeaders.forEach((h, i) => { if (h) obj[h] = (row[i] || '').trim(); });
      return obj;
    });
  return { lastUpdated, kpis, marketing, watchlist };
}

function normalizeMarketers(rawRows) {
  if (!rawRows || rawRows.length < 2) return [];
  const headers = rawRows[1].map((h) => (h || '').trim());
  return rawRows.slice(2)
    .filter((row) => row.some((cell) => cell && cell.trim() !== ''))
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[h] = (row[i] || '').trim(); });
      return obj;
    });
}

function normalizeCommissionLedger(rawRows) {
  if (!rawRows || rawRows.length < 2) return [];
  const headers = rawRows[1].map((h) => (h || '').trim());
  const customerNameIdx = headers.indexOf('Customer Name');
  return rawRows.slice(2)
    .filter((row) => {
      const customerName = customerNameIdx >= 0 ? (row[customerNameIdx] || '').trim() : '';
      return customerName !== '' && customerName !== '0';
    })
    .map((row) => {
      const obj = {};
      headers.forEach((header, i) => { if (header) obj[header] = (row[i] || '').trim(); });
      const paidOutRaw = (obj['Paid Out?'] || '').trim().toLowerCase();
      obj._isPaidOut = ['yes', 'true', 'paid', 'y', '1'].includes(paidOutRaw);
      return obj;
    });
}

function normalizeCommissionRules(rawRows) {
  if (!rawRows || rawRows.length < 2) return { rules: [], notes: [] };
  const headers = rawRows[1].map((h) => (h || '').trim());
  const rules = rawRows.slice(2, 6)
    .filter((row) => row.some((cell) => cell && cell.trim() !== ''))
    .map((row) => {
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[h] = (row[i] || '').trim(); });
      return obj;
    });
  const notes = rawRows.slice(7)
    .filter((row) => row[0] && row[0].trim() !== '')
    .map((row) => ({ label: (row[0] || '').trim(), value: (row[1] || '').trim() }));
  return { rules, notes };
}


function normalizeCustomers(rawRows) {
  if (!rawRows || rawRows.length < 1) return [];
  var row0 = rawRows[0] || [];
  var headers = [];
  if (row0[0] && row0[0].indexOf('Customer Master List') !== -1) {
    headers[0] = 'Customer Name';
    for (var i = 1; i < row0.length; i++) { headers[i] = (row0[i] || '').trim(); }
    return rawRows.slice(1)
      .filter(function(row) { return row.some(function(cell) { return cell && cell.trim() !== ''; }); })
      .map(function(row) {
        var obj = {};
        headers.forEach(function(header, i) { if (header) obj[header] = (row[i] || '').trim(); });
        return obj;
      });
  }
  return normalizeWithHeaderRow(rawRows, 1);
}
