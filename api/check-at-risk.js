import supabase from '../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 35);
  const cutoffDate = cutoff.toISOString().split('T')[0];

  const { data: atRiskCustomers, error: fetchErr } = await supabase
    .from('customers')
    .select('id, customer_name, last_payment_date')
    .eq('status', 'Active')
    .lt('last_payment_date', cutoffDate);

  if (fetchErr) {
    console.error('[check-at-risk] fetch error:', fetchErr.message);
    return res.status(500).json({ error: fetchErr.message });
  }

  if (!atRiskCustomers || atRiskCustomers.length === 0) {
    return res.status(200).json({ updated: 0, customers: [] });
  }

  const ids = atRiskCustomers.map(c => c.id);
  const names = atRiskCustomers.map(c => c.customer_name);

  const { error: updateErr } = await supabase
    .from('customers')
    .update({ status: 'At Risk', updated_at: new Date().toISOString() })
    .in('id', ids);

  if (updateErr) {
    console.error('[check-at-risk] update error:', updateErr.message);
    return res.status(500).json({ error: updateErr.message });
  }

  return res.status(200).json({ updated: ids.length, customers: names });
}
