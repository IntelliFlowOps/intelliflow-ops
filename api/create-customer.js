import supabase from '../lib/supabase.js';
import { validateRequest } from '../lib/api-auth.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = validateRequest(req);
  if (!auth.valid) return res.status(401).json({ error: auth.error });

  const { customerName, email, phone, industry, planId, mrr, attributionType, assignedTo, notes } = req.body || {};

  if (!customerName || !customerName.trim()) {
    return res.status(400).json({ error: 'Customer name is required' });
  }

  const today = new Date().toISOString().split('T')[0];

  const customer = {
    customer_name: customerName.trim(),
    email: email || null,
    phone: phone || null,
    industry: industry || null,
    plan_id: planId || null,
    mrr: parseInt(mrr) || 0,
    status: 'Active',
    attribution_type: attributionType || 'FOUNDER',
    months_active: 0,
    onboard_date: today,
    commission_eligible: true,
    notes: notes || null,
  };

  // Look up team member for name assignment
  if (assignedTo && assignedTo !== 'founder') {
    const { data: tm, error: tmErr } = await supabase
      .from('team_members')
      .select('id, name, commission_path')
      .eq('id', assignedTo)
      .single();

    if (tmErr || !tm) {
      return res.status(400).json({ error: `Team member not found: ${assignedTo}` });
    }

    if (tm.commission_path === 'DIRECT') {
      customer.attribution_type = 'DIRECT';
      customer.assigned_to = tm.id;
      customer.assigned_to_name = tm.name;
    } else if (tm.commission_path === 'SALES') {
      customer.attribution_type = 'SALES';
      customer.sales_rep = tm.id;
      customer.sales_rep_name = tm.name;
    }
  }

  const { data, error } = await supabase
    .from('customers')
    .insert(customer)
    .select()
    .single();

  if (error) {
    console.error('[create-customer] error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true, customer: data });
}
