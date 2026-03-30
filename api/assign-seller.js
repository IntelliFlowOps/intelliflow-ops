import supabase from '../lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { customerId, teamMemberId } = req.body || {};
  if (!customerId || !teamMemberId) {
    return res.status(400).json({ error: 'Missing customerId or teamMemberId' });
  }

  try {
    // Look up team member for name and commission path
    let teamMember = null;
    if (teamMemberId !== 'founder') {
      const { data, error } = await supabase
        .from('team_members')
        .select('id, name, commission_path')
        .eq('id', teamMemberId)
        .single();
      if (error || !data) {
        return res.status(400).json({ error: `Team member not found: ${teamMemberId}` });
      }
      teamMember = data;
    }

    // Derive attribution from team member's commission_path — never trust the frontend
    const derivedAttribution = teamMember
      ? (teamMember.commission_path === 'DIRECT' ? 'DIRECT' : teamMember.commission_path === 'SALES' ? 'SALES' : 'FOUNDER')
      : 'FOUNDER';

    let update = { updated_at: new Date().toISOString() };

    if (derivedAttribution === 'DIRECT' && teamMember) {
      update.attribution_type = 'DIRECT';
      update.assigned_to = teamMember.id;
      update.assigned_to_name = teamMember.name;
      update.sales_rep = null;
      update.sales_rep_name = null;
    } else if (derivedAttribution === 'SALES' && teamMember) {
      update.attribution_type = 'SALES';
      update.sales_rep = teamMember.id;
      update.sales_rep_name = teamMember.name;
      update.assigned_to = null;
      update.assigned_to_name = null;
    } else {
      // FOUNDER
      update.attribution_type = 'FOUNDER';
      update.assigned_to = null;
      update.assigned_to_name = null;
      update.sales_rep = null;
      update.sales_rep_name = null;
    }

    const { data: updated, error: updateErr } = await supabase
      .from('customers')
      .update(update)
      .eq('id', customerId)
      .select()
      .single();

    if (updateErr) {
      console.error('assign-seller update error:', updateErr.message);
      return res.status(500).json({ error: updateErr.message });
    }

    // Update ALL unpaid commission_ledger rows for this customer to the new attribution.
    // Paid rows (paid_out = true) are left unchanged — they belong to whoever was assigned at payout time.
    const { error: ledgerErr } = await supabase
      .from('commission_ledger')
      .update({
        attribution_type: update.attribution_type,
        assigned_to: update.assigned_to || null,
        assigned_to_name: update.assigned_to_name || null,
        sales_rep: update.sales_rep || null,
        sales_rep_name: update.sales_rep_name || null,
      })
      .eq('customer_id', customerId)
      .eq('paid_out', false);

    if (ledgerErr) {
      console.warn('Ledger update warning:', ledgerErr.message);
    }

    return res.status(200).json({
      success: true,
      customer: updated,
      attribution: derivedAttribution,
      assignedTo: teamMember?.name || 'Founder',
    });
  } catch (err) {
    console.error('assign-seller error:', err);
    return res.status(500).json({ error: err.message });
  }
}
