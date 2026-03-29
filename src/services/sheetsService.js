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
    case 'CUSTOMERS': return normalizeByAnchor(rawRows, 'Customer Name');
    case 'MARKETERS': return normalizeMarketers(rawRows);
    case 'CAMPAIGNS': return normalizeByAnchor(rawRows, 'Date');
    case 'CREATIVE_INSIGHTS': return normalizeByAnchor(rawRows, 'Date');
    case 'COMMISSION_RULES': return normalizeCommissionRules(rawRows);
    case 'COMMISSION_LEDGER': return normalizeCommissionLedger(rawRows);
    case 'FOUNDERS_KPIS': return normalizeByAnchor(rawRows, 'Metric');
    case 'CUSTOMER_ACTIVITY': return normalizeByAnchor(rawRows, 'Date');
    case 'DATA_DICTIONARY': return normalizeByAnchor(rawRows, 'Sheet');
    case 'ALL_ANALYTICS': return normalizeByAnchor(rawRows, 'Date');
    case 'EXPENSES': return normalizeByAnchor(rawRows, 'Date');
    case 'DISTRIBUTIONS': return normalizeByAnchor(rawRows, 'Date');
    case 'RETAINER_LEDGER': return normalizeByAnchor(rawRows, 'Date');
    case 'PAYROLL_PEOPLE': return normalizeByAnchor(rawRows, 'Person');
    default: return rawRows;
  }
}

function findHeaderRow(rawRows, anchorValue) {
  for (var i = 0; i < Math.min(5, rawRows.length); i++) {
    var row = rawRows[i] || [];
    for (var j = 0; j < row.length; j++) {
      if ((row[j] || '').toString().trim() === anchorValue) return i;
    }
  }
  return 0;
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

function normalizeByAnchor(rawRows, anchorValue) {
  if (!rawRows || rawRows.length < 1) return [];
  var headerIndex = findHeaderRow(rawRows, anchorValue);
  var headers = (rawRows[headerIndex] || []).map(function(h) { return (h || '').trim(); });
  var firstColHeader = headers[0] || '';
  var dataRows = rawRows.slice(headerIndex + 1);
  return dataRows
    .filter(function(row) {
      var firstVal = (row[0] || '').toString().trim();
      return firstVal !== '' && firstVal !== '0' && firstVal !== '-';
    })
    .map(function(row) {
      var obj = {};
      headers.forEach(function(header, i) { if (header) obj[header] = (row[i] || '').trim(); });
      return obj;
    });
}

function normalizeDashboard(rawRows) {
  if (!rawRows || rawRows.length < 1) return { kpis: {}, marketing: {}, watchlist: [], lastUpdated: '' };

  var lastUpdated = '';
  var kpis = {};
  var marketing = {};
  var watchlistHeaderRow = -1;

  var kpiLabels = ['Total Revenue','Active Customers','MRR','Ad Spend (MTD)','Total Commissions (MTD)','Net Profit (MTD)'];
  var marketingLabels = ['Leads (MTD)','Customers Won (MTD)','CAC','Cost / Lead','Blended CTR','Blended Close Rate'];

  for (var i = 0; i < rawRows.length; i++) {
    var row = rawRows[i] || [];
    var col0 = (row[0] || '').trim();
    var col1 = (row[1] || '').trim();
    var col5 = (row[5] || '').trim();
    var col6 = (row[6] || '').trim();

    if (col0.indexOf('Last Updated') !== -1 && col1) {
      lastUpdated = col1;
    }
    if (col1 && col0.indexOf('Last Updated') === -1 && col0 !== '') {
      if (col0 === 'Last Updated') { lastUpdated = col1; }
    }
    if (col0 === 'Last Updated') { lastUpdated = col1; }

    if (kpiLabels.indexOf(col0) !== -1) {
      kpis[col0] = col1;
    }
    if (marketingLabels.indexOf(col5) !== -1) {
      marketing[col5] = col6;
    }
    if (col0 === 'Customer / Campaign') {
      watchlistHeaderRow = i;
    }
  }

  var row1 = rawRows[0] || [];
  if ((row1[0] || '').indexOf('Last Updated') !== -1) {
    lastUpdated = (row1[1] || '').trim();
  }

  var watchlist = [];
  if (watchlistHeaderRow >= 0) {
    var watchlistHeaders = (rawRows[watchlistHeaderRow] || []).map(function(h) { return (h || '').trim(); });
    watchlist = rawRows.slice(watchlistHeaderRow + 1)
      .filter(function(row) { return row.some(function(cell) { return cell && cell.trim() !== ''; }); })
      .map(function(row) {
        var obj = {};
        watchlistHeaders.forEach(function(h, i) { if (h) obj[h] = (row[i] || '').trim(); });
        return obj;
      });
  }

  return { lastUpdated, kpis, marketing, watchlist };
}

function normalizeMarketers(rawRows) {
  return normalizeByAnchor(rawRows, 'Marketer');
}

function normalizeCommissionLedger(rawRows) {
  if (!rawRows || rawRows.length < 1) return [];
  var headerIndex = 0;
  for (var i = 0; i < Math.min(5, rawRows.length); i++) {
    if (rawRows[i] && rawRows[i][0] && rawRows[i][0].toString().trim() === 'Date') {
      headerIndex = i;
      break;
    }
  }
  var headers = rawRows[headerIndex].map(function(h) { return (h || '').trim(); });
  var customerNameIdx = headers.indexOf('Customer Name');
  return rawRows.slice(headerIndex + 1)
    .filter(function(row) {
      var dateVal = (row[0] || '').toString().trim();
      if (dateVal === '' || dateVal === '0' || dateVal === '-') return false;
      var customerName = customerNameIdx >= 0 ? (row[customerNameIdx] || '').trim() : '';
      return customerName !== '' && customerName !== '0';
    })
    .map(function(row) {
      var obj = {};
      headers.forEach(function(header, i) { if (header) obj[header] = (row[i] || '').trim(); });
      var paidOutRaw = (obj['Paid Out?'] || '').trim().toLowerCase();
      obj._isPaidOut = ['yes', 'true', 'paid', 'y', '1'].includes(paidOutRaw);
      return obj;
    });
}

function normalizeCommissionRules(rawRows) {
  if (!rawRows || rawRows.length < 1) return { rules: [], notes: [] };
  var headerIndex = findHeaderRow(rawRows, 'Attribution Type');
  var headers = (rawRows[headerIndex] || []).map(function(h) { return (h || '').trim(); });
  var rules = rawRows.slice(headerIndex + 1, headerIndex + 9)
    .filter(function(row) { return row.some(function(cell) { return cell && cell.trim() !== ''; }); })
    .map(function(row) {
      var obj = {};
      headers.forEach(function(h, i) { if (h) obj[h] = (row[i] || '').trim(); });
      return obj;
    });
  var notes = rawRows.slice(headerIndex + 6)
    .filter(function(row) { return row[0] && row[0].trim() !== ''; })
    .map(function(row) { return { label: (row[0] || '').trim(), value: (row[1] || '').trim() }; });
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
