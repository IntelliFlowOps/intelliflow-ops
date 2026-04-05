import supabase from '../lib/supabase.js';
import { validateRequest } from '../lib/api-auth.js';

const ALLOWED_FIELDS = new Set(['notes', 'status', 'industry', 'primary_contact', 'phone', 'email']);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = validateRequest(req);
  if (!auth.valid) return res.status(401).json({ error: auth.error });

  const { customerId, field, value } = req.body || {};

  if (!customerId) return res.status(400).json({ error: 'Missing customerId' });
  if (!field || !ALLOWED_FIELDS.has(field)) {
    return res.status(400).json({ error: `Field not allowed. Allowed: ${[...ALLOWED_FIELDS].join(', ')}` });
  }

  const { data, error } = await supabase
    .from('customers')
    .update({ [field]: value, updated_at: new Date().toISOString() })
    .eq('id', customerId)
    .select()
    .single();

  if (error) {
    console.error('[update-customer] error:', error.message);
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ success: true, customer: data });
}
