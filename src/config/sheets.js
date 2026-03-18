/**
 * INTELLIFLOW OPS — GOOGLE SHEETS CONFIG
 *
 * This is the ONLY file where spreadsheet connection details live.
 * To connect your own sheet:
 *   1. Replace SPREADSHEET_ID with your Google Sheets ID
 *   2. Publish the sheet to the web:
 *      File > Share > Publish to web > Entire Document > CSV > Publish
 *   3. Tab names below must EXACTLY match the sheet tab names
 *
 * The app is READ-ONLY. It never writes to Google Sheets.
 */

// =============================================
// SPREADSHEET ID — change this to yours
// =============================================
export const SPREADSHEET_ID = '1eyT6Js7wgDzFgAlBl6F7-F0rsOJeQZIxDFjyipDFQpc';

// =============================================
// TAB NAMES — must match sheet exactly
// =============================================
export const TABS = {
  DASHBOARD:        'Dashboard',
  CUSTOMERS:        'Customers',
  MARKETERS:        'Marketers',
  CAMPAIGNS:        'Campaigns',
  CREATIVE_INSIGHTS:'Creative_Insights',
  COMMISSION_RULES: 'Commission_Rules',
  COMMISSION_LEDGER:'Commission_Ledger',
  FOUNDERS_KPIS:    'Founders_KPIs',
  CUSTOMER_ACTIVITY:'Customer_Activity',
  DATA_DICTIONARY:  'Data_Dictionary',
  ALL_ANALYTICS:    'All Analytics',
};

export function buildCsvUrl(tabName) {
  const encoded = encodeURIComponent(tabName);
  return `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encoded}`;
}

export const ALL_TAB_KEYS = Object.keys(TABS);
export const STALE_THRESHOLD_MS = 10 * 60 * 1000;
export const AUTO_REFRESH_INTERVAL_MS = 2 * 60 * 1000;
