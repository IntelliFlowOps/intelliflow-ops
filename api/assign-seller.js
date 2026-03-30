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
        .select('id, name, commission_path, commission_rate')
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

    // Update ALL unpaid commission_ledger rows for this customer: attribution + recalculate commission.
    // Paid rows (paid_out = true) are left unchanged — they belong to whoever was assigned at payout time.
    const { data: unpaidRows, error: fetchErr } = await supabase
      .from('commission_ledger')
      .select('id, commission_base, paid_month')
      .eq('customer_id', customerId)
      .eq('paid_out', false)
      .limit(10000);

    if (fetchErr) {
      console.warn('Ledger fetch warning:', fetchErr.message);
    }

    if (unpaidRows && unpaidRows.length > 0) {
      const rate = teamMember?.commission_rate || 0;
      const memberName = teamMember?.name || '';

      for (const row of unpaidRows) {
        const base = parseFloat(row.commission_base) || 0;
        const rowUpdate = {
          attribution_type: update.attribution_type,
          assigned_to: update.assigned_to || null,
          assigned_to_name: update.assigned_to_name || null,
          sales_rep: update.sales_rep || null,
          sales_rep_name: update.sales_rep_name || null,
          commission_rate: 0,
          commission_total: 0,
          emma_rate: 0,
          emma_commission: 0,
          wyatt_rate: 0,
          wyatt_commission: 0,
          sales_rep_rate: 0,
          sales_commission: 0,
        };

        if (derivedAttribution === 'DIRECT') {
          const total = base * rate;
          rowUpdate.commission_rate = rate;
          rowUpdate.commission_total = total;
          if (memberName === 'Emma') { rowUpdate.emma_rate = rate; rowUpdate.emma_commission = total; }
          else if (memberName === 'Wyatt') { rowUpdate.wyatt_rate = rate; rowUpdate.wyatt_commission = total; }
        } else if (derivedAttribution === 'SALES') {
          const paidMonth = parseInt(row.paid_month) || 0;
          if (paidMonth <= 6) {
            rowUpdate.sales_rep_rate = rate;
            rowUpdate.sales_commission = base * rate;
          }
        }
        // FOUNDER: all commission fields stay 0

        await supabase
          .from('commission_ledger')
          .update(rowUpdate)
          .eq('id', row.id);
      }
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
