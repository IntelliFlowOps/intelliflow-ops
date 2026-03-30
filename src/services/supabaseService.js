// ── Supabase table mapping & field name transformers ─────────────────────────
// The frontend pages reference Google Sheets header names ("Customer Name", etc.)
// Supabase uses snake_case. This module bridges the gap.

const SUPABASE_TABLES = {
  CUSTOMERS:         'customers',
  COMMISSION_LEDGER: 'commission_ledger',
  RETAINER_LEDGER:   'retainer_ledger',
  PAYROLL_PEOPLE:    'team_members',
  CAMPAIGNS:         'campaigns',
  ALL_ANALYTICS:     'all_analytics',
  CREATIVE_INSIGHTS: 'creative_insights',
  CUSTOMER_ACTIVITY: 'customer_activity',
};

// Special view/table routes (not standard tab keys)
const SPECIAL_ROUTES = {
  DASHBOARD:          'dashboard',
  COMMISSION_SUMMARY: 'commission_summary',
  PLANS:              'plans',
};

export const SUPABASE_TAB_KEYS = new Set([
  ...Object.keys(SUPABASE_TABLES),
  ...Object.keys(SPECIAL_ROUTES),
]);

// Returns the API table parameter for a given tab key
function resolveTableParam(tabKey) {
  if (SUPABASE_TABLES[tabKey]) return SUPABASE_TABLES[tabKey];
  if (SPECIAL_ROUTES[tabKey]) return SPECIAL_ROUTES[tabKey];
  return null;
}

// ── Field name mappings (Supabase snake_case → Sheets display names) ─────────

const CUSTOMER_MAP = {
  customer_name: 'Customer Name',
  mrr: 'MRR / Revenue',
  lead_source: 'Lead Source',
  months_active: 'Months Active',
  status: 'Status',
  attribution_type: 'Attribution Type',
  assigned_to_name: 'Direct Marketer',
  commission_eligible: 'Commission Eligible?',
  close_date: 'Close Date',
  onboard_date: 'Onboard Date',
  last_payment_date: 'Last Payment Date',
  next_renewal_date: 'Next Renewal Date',
  stripe_customer_id: 'Stripe Customer ID',
  primary_contact: 'Primary Contact',
  phone: 'Phone',
  email: 'Email',
  industry: 'Industry / Niche',
  landing_page: 'Landing Page / Offer',
  notes: 'Notes',
  health_score: 'Health Score',
  churn_risk: 'Churn Risk',
  ltv: 'LTV',
};

const COMMISSION_LEDGER_MAP = {
  date: 'Date',
  invoice_id: 'Invoice ID',
  customer_name: 'Customer Name',
  revenue_collected: 'Revenue Collected',
  attribution_type: 'Attribution Type',
  assigned_to_name: 'Direct Marketer',
  paid_month: 'Months Active / Paid Month',
  paid_out: 'Paid Out?',
  commission_rate: 'Commission %',
  emma_rate: 'Emma %',
  wyatt_rate: 'Wyatt %',
  commission_total: 'Commission Total',
  emma_commission: 'Emma Commission',
  wyatt_commission: 'Wyatt Commission',
  payout_batch: 'Payout Batch / Month',
  notes: 'Notes',
  sales_rep_name: 'Sales Rep',
  sales_rep_rate: 'Sales Rep Rate',
  sales_rep_paid_month_count: 'Sales Rep Paid Month Count',
  sales_commission: 'Sales Commission',
  commission_base: 'Commission Base Amount',
};

const TEAM_MEMBERS_MAP = {
  name: 'Person',
  role: 'Role',
  commission_path: 'Commission Path',
  w9_status: 'W9 Collected',
  payment_method: 'Payment Method',
  retainer_amount: 'Retainer Amount',
};

const RETAINER_LEDGER_MAP = {
  date: 'Date',
  person_name: 'Person',
  amount: 'Amount',
  month_label: 'Month',
  category: 'Category',
  payment_method: 'Payment Method',
  paid_out: 'Paid Out?',
  payout_batch: 'Payout Batch',
  description: 'Description',
};

const CUSTOMER_ACTIVITY_MAP = {
  date: 'Date',
  customer_name: 'Customer Name',
  activity_type: 'Activity Type',
  owner: 'Owner',
  summary: 'Summary',
  next_step: 'Next Step',
  health_impact: 'Health Impact',
  notes: 'Notes',
};

const CAMPAIGNS_MAP = {
  date: 'Date',
  platform: 'Platform',
  campaign_name: 'Campaign Name',
  spend: 'Spend',
  impressions: 'Impressions',
  clicks: 'Clicks',
  ctr: 'CTR',
  cpc: 'CPC',
  status: 'Status',
};

const ALL_ANALYTICS_MAP = {
  date: 'Date',
  platform: 'Platform',
  campaign_name: 'Campaign Name',
  spend: 'Spend',
  impressions: 'Impressions',
  clicks: 'Clicks',
  ctr: 'CTR',
  cpc: 'CPC',
  status: 'Status',
};

const CREATIVE_INSIGHTS_MAP = {
  date: 'Date',
  creative_name: 'Creative Name',
  format: 'Format',
  hook: 'Hook',
  cta: 'CTA',
  impressions: 'Impressions',
  clicks: 'Clicks',
  ctr: 'CTR',
  conversions: 'Conversions',
  cpa: 'CPA',
  notes: 'Notes',
};

const FIELD_MAPS = {
  customers:          CUSTOMER_MAP,
  commission_ledger:  COMMISSION_LEDGER_MAP,
  team_members:       TEAM_MEMBERS_MAP,
  retainer_ledger:    RETAINER_LEDGER_MAP,
  customer_activity:  CUSTOMER_ACTIVITY_MAP,
  campaigns:          CAMPAIGNS_MAP,
  all_analytics:      ALL_ANALYTICS_MAP,
  creative_insights:  CREATIVE_INSIGHTS_MAP,
};

// ── Row transformation ───────────────────────────────────────────────────────

function transformRow(row, fieldMap) {
  if (!row || !fieldMap) return row;
  const mapped = {};
  for (const [snakeKey, displayName] of Object.entries(fieldMap)) {
    if (snakeKey in row) {
      mapped[displayName] = row[snakeKey];
    }
  }
  // Carry over any fields not in the map (id, created_at, etc.)
  for (const [key, value] of Object.entries(row)) {
    if (!fieldMap[key]) {
      mapped[key] = value;
    }
  }
  return mapped;
}

function postProcessCommissionLedger(row) {
  // Convert paid_out boolean → "Yes"/""
  const paidOutRaw = row['Paid Out?'];
  if (typeof paidOutRaw === 'boolean') {
    row['Paid Out?'] = paidOutRaw ? 'Yes' : '';
  }
  const paidStr = String(row['Paid Out?'] || '').trim().toLowerCase();
  row._isPaidOut = ['yes', 'true', 'paid', 'y', '1'].includes(paidStr);
  return row;
}

function postProcessRetainerLedger(row) {
  const paidOutRaw = row['Paid Out?'];
  if (typeof paidOutRaw === 'boolean') {
    row['Paid Out?'] = paidOutRaw ? 'Yes' : '';
  }
  return row;
}

function transformRows(rows, tableName) {
  const fieldMap = FIELD_MAPS[tableName];
  if (!rows || !Array.isArray(rows)) return rows;
  let mapped = fieldMap ? rows.map(r => transformRow(r, fieldMap)) : rows;

  if (tableName === 'commission_ledger') {
    mapped = mapped.map(postProcessCommissionLedger);
  } else if (tableName === 'retainer_ledger') {
    mapped = mapped.map(postProcessRetainerLedger);
  }
  return mapped;
}

// ── Dashboard transformer ────────────────────────────────────────────────────
// Converts the single-row dashboard_kpis view into the { kpis, marketing, watchlist, lastUpdated }
// shape that DashboardPage.jsx expects.

function transformDashboard(row) {
  if (!row || typeof row !== 'object') {
    return { kpis: {}, marketing: {}, watchlist: [], lastUpdated: '' };
  }

  const fmt$ = (v) => {
    const n = parseFloat(v);
    return isFinite(n) ? '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '$0.00';
  };
  const fmtN = (v) => {
    const n = parseFloat(v);
    return isFinite(n) ? String(n) : '0';
  };

  return {
    lastUpdated: new Date().toLocaleString(),
    kpis: {
      'Total Revenue':          fmt$(row.revenue_mtd),
      'Active Customers':       fmtN(row.active_customers),
      'MRR':                    fmt$(row.total_mrr),
      'Ad Spend (MTD)':         fmt$(row.ad_spend_mtd),
      'Total Commissions (MTD)': fmt$(row.commissions_unpaid_mtd),
      'Net Profit (MTD)':       fmt$((parseFloat(row.revenue_mtd) || 0) - (parseFloat(row.ad_spend_mtd) || 0) - (parseFloat(row.commissions_unpaid_mtd) || 0)),
    },
    marketing: {
      'Leads (MTD)':          fmtN(row.leads_mtd),
      'Customers Won (MTD)':  fmtN(row.customers_won_mtd),
      'CAC':                  (parseFloat(row.customers_won_mtd) || 0) > 0 ? fmt$((parseFloat(row.ad_spend_mtd) || 0) / parseFloat(row.customers_won_mtd)) : '—',
      'Cost / Lead':          (parseFloat(row.leads_mtd) || 0) > 0 ? fmt$((parseFloat(row.ad_spend_mtd) || 0) / parseFloat(row.leads_mtd)) : '—',
      'Blended CTR':          '—',
      'Blended Close Rate':   (parseFloat(row.leads_mtd) || 0) > 0 ? ((parseFloat(row.customers_won_mtd) || 0) / parseFloat(row.leads_mtd) * 100).toFixed(1) + '%' : '—',
    },
    watchlist: [],
  };
}

// ── Fetch from the server-side API ───────────────────────────────────────────

export async function fetchSupabaseTab(tabKey) {
  const tableParam = resolveTableParam(tabKey);
  if (!tableParam) return null; // Not a Supabase table — fall back to Sheets

  try {
    const response = await fetch(`/api/supabase-read?table=${encodeURIComponent(tableParam)}`);
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${tableParam}`);
    const json = await response.json();
    if (json.error) return { data: [], error: json.error };

    // Dashboard is a single-row view → transform to the shape DashboardPage expects
    if (tableParam === 'dashboard') {
      return { data: transformDashboard(json.data), error: null };
    }

    const transformed = transformRows(json.data, tableParam);
    return { data: transformed, error: null };
  } catch (err) {
    console.error(`Failed to fetch Supabase table ${tableParam}:`, err);
    return { data: [], error: err.message };
  }
}
