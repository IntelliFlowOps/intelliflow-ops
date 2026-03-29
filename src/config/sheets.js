export const SPREADSHEET_ID = '1TK0c4BxhqSVL09SlC8SnweddOFvP9frEmYIKqdl2jqc';

export const TABS = {
  DASHBOARD: 'Dashboard',
  CUSTOMERS: 'Customers',
  MARKETERS: 'Marketers',
  CAMPAIGNS: 'Campaigns',
  CREATIVE_INSIGHTS: 'Creative_Insights',
  COMMISSION_RULES: 'Commission_Rules',
  COMMISSION_LEDGER: 'Commission_Ledger',
  PAYOUT_BATCHES: 'PAYOUT_BATCHES',
  RETAINER_LEDGER: 'RETAINER_LEDGER',
  PAYROLL_PEOPLE: 'PAYROLL_PEOPLE',
  FOUNDERS_KPIS: 'Founders_KPIs',
  CUSTOMER_ACTIVITY: 'Customer_Activity',
  DATA_DICTIONARY: 'Data_Dictionary',
  ALL_ANALYTICS: 'All Analytics',
  EXPENSES: 'EXPENSES',
  DISTRIBUTIONS: 'DISTRIBUTIONS',
};

export function buildCsvUrl(tabName) {
  const encoded = encodeURIComponent(tabName);
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encoded}`;
}

const WRITE_ONLY_TABS = ['PAYOUT_BATCHES'];
export const ALL_TAB_KEYS = Object.keys(TABS).filter(k => !WRITE_ONLY_TABS.includes(k));
export const STALE_THRESHOLD_MS = 10 * 60 * 1000;
export const AUTO_REFRESH_INTERVAL_MS = 2 * 60 * 1000;
