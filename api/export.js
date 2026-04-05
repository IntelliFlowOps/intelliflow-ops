import supabase from '../lib/supabase.js';
import { validateRequest } from '../lib/api-auth.js';

const TABLE_COLUMNS = {
  commission_ledger: [
    'date', 'invoice_id', 'customer_name', 'revenue_collected', 'commission_base',
    'attribution_type', 'assigned_to_name', 'sales_rep_name', 'paid_month',
    'commission_rate', 'commission_total', 'emma_commission', 'wyatt_commission',
    'sales_commission', 'paid_out', 'payout_batch', 'notes',
  ],
  customers: [
    'customer_name', 'email', 'phone', 'industry', 'status', 'attribution_type',
    'assigned_to_name', 'sales_rep_name', 'mrr', 'months_active', 'close_date',
    'last_payment_date',
  ],
  retainer_ledger: [
    'date', 'person_name', 'amount', 'month_label', 'paid_out', 'payout_batch',
  ],
  payout_batches: [
    'batch_id', 'person_name', 'payout_type', 'payout_date', 'total_paid',
    'rows_processed',
  ],
};

function escapeCsvField(value) {
  if (value == null) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

function toCsv(rows, columns) {
  const header = columns.map(escapeCsvField).join(',');
  const body = rows.map(row =>
    columns.map(col => escapeCsvField(row[col])).join(',')
  );
  return [header, ...body].join('\n');
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const auth = validateRequest(req);
  if (!auth.valid) return res.status(401).json({ error: auth.error });

  const table = req.query?.table;
  const columns = TABLE_COLUMNS[table];

  if (!columns) {
    return res.status(400).json({
      error: `Invalid table. Allowed: ${Object.keys(TABLE_COLUMNS).join(', ')}`,
    });
  }

  const { data, error } = await supabase
    .from(table)
    .select(columns.join(', '))
    .order('created_at', { ascending: false })
    .limit(50000);

  if (error) {
    console.error('[export] Supabase error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  const csv = toCsv(data || [], columns);
  const date = new Date().toISOString().slice(0, 10);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="intelliflow-${table}-${date}.csv"`);
  return res.status(200).send(csv);
}
