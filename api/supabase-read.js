import supabase from '../lib/supabase.js';
import { validateRequest } from '../lib/api-auth.js';

const ALLOWED_TABLES = {
  customers:         { orderBy: 'created_at', ascending: false },
  commission_ledger: { orderBy: 'date',       ascending: false },
  retainer_ledger:   { orderBy: 'date',       ascending: false },
  team_members:      { orderBy: 'name',       ascending: true },
  campaigns:         { orderBy: 'date',       ascending: false },
  all_analytics:     { orderBy: 'date',       ascending: false },
  creative_insights: { orderBy: 'date',       ascending: false },
  customer_activity: { orderBy: 'date',       ascending: false },
  plans:             { orderBy: 'created_at', ascending: true },
};

const VIEWS = {
  dashboard:          { view: 'dashboard_kpis',    single: true },
  commission_summary: { view: 'commission_summary', single: false },
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = validateRequest(req);
  if (!auth.valid) return res.status(401).json({ error: auth.error });

  const table = req.query.table;
  if (!table) {
    return res.status(400).json({ error: 'Missing table parameter' });
  }

  try {
    // Handle views
    if (VIEWS[table]) {
      const { view, single } = VIEWS[table];
      let query = supabase.from(view).select('*');
      if (single) query = query.maybeSingle();
      const { data, error } = await query;
      if (error) {
        console.error(`Supabase view error (${view}):`, error.message);
        return res.status(200).json({ data: single ? {} : [], error: error.message });
      }
      return res.status(200).json({ data: single ? data : data || [] });
    }

    // Handle regular tables
    const config = ALLOWED_TABLES[table];
    if (!config) {
      return res.status(400).json({ error: `Table not allowed: ${table}` });
    }

    const selectCols = table === 'team_members'
      ? 'id, name, role, commission_path, commission_rate, commission_term_months, w9_status, payment_method, retainer_amount, active, created_at'
      : '*';

    const { data, error } = await supabase
      .from(table)
      .select(selectCols)
      .order(config.orderBy, { ascending: config.ascending })
      .limit(10000);

    if (error) {
      console.error(`Supabase read error (${table}):`, error.message);
      return res.status(200).json({ data: [], error: error.message });
    }

    return res.status(200).json({ data: data || [] });
  } catch (err) {
    console.error(`Supabase read exception (${table}):`, err);
    return res.status(500).json({ data: [], error: err.message });
  }
}
