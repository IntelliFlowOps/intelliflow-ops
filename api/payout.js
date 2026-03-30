import supabase from '../lib/supabase.js';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function today() {
  return new Date().toISOString().split('T')[0];
}

function batchId(person) {
  const d = new Date();
  return `PAY-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${person.toUpperCase()}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { person } = req.body || {};
  if (!person) return res.status(400).json({ error: 'Missing person' });

  try {
    // ── Look up team member ────────────────────────────────────────────────
    const { data: teamMember, error: tmErr } = await supabase
      .from('team_members')
      .select('*')
      .eq('name', person)
      .single();

    if (tmErr || !teamMember) {
      return res.status(400).json({ error: `Team member not found: ${person}` });
    }

    const batch = batchId(person);
    const payoutDate = today();
    const isMarketer = teamMember.commission_path === 'DIRECT';
    const isSales = teamMember.commission_path === 'SALES';
    let totalPaid = 0;
    let rowsProcessed = 0;
    let teamRowsSkipped = 0;

    // ── Commission Ledger payout ───────────────────────────────────────────
    // Build the query based on person type
    let ledgerQuery = supabase
      .from('commission_ledger')
      .select('*')
      .eq('paid_out', false);

    if (isMarketer) {
      ledgerQuery = ledgerQuery.eq('assigned_to', teamMember.id);
    } else if (isSales) {
      ledgerQuery = ledgerQuery.eq('sales_rep', teamMember.id);
    } else {
      // Founder or unknown — no commission rows to process
      ledgerQuery = null;
    }

    if (ledgerQuery) {
      const { data: unpaidRows, error: ledgerErr } = await ledgerQuery;
      if (ledgerErr) {
        console.error('Ledger query error:', ledgerErr.message);
      }

      const rowsToUpdate = [];

      for (const row of (unpaidRows || [])) {
        // Skip TEAM rows (paused)
        if ((row.attribution_type || '').toUpperCase() === 'TEAM') {
          teamRowsSkipped++;
          continue;
        }

        // Sum the correct commission column
        if (isMarketer) {
          const comm = parseFloat(row.commission_total) || 0;
          totalPaid += comm;
        } else if (isSales) {
          const comm = parseFloat(row.sales_commission) || 0;
          totalPaid += comm;
        }

        rowsToUpdate.push(row.id);
        rowsProcessed++;
      }

      // Batch update all rows
      if (rowsToUpdate.length > 0) {
        const { error: updateErr } = await supabase
          .from('commission_ledger')
          .update({ paid_out: true, payout_batch: batch })
          .in('id', rowsToUpdate);

        if (updateErr) {
          console.error('Ledger update error:', updateErr.message);
          return res.status(500).json({ error: 'Failed to update commission ledger: ' + updateErr.message });
        }
      }
    }

    // ── Retainer payout (marketers only) ──────────────────────────────────
    if (isMarketer && teamMember.retainer_amount > 0) {
      const { data: unpaidRetainer, error: retErr } = await supabase
        .from('retainer_ledger')
        .select('*')
        .eq('team_member_id', teamMember.id)
        .eq('paid_out', false);

      if (retErr) {
        console.error('Retainer query error:', retErr.message);
      }

      const retainerIds = [];

      for (const row of (unpaidRetainer || [])) {
        const amt = parseFloat(row.amount) || 0;
        totalPaid += amt;
        retainerIds.push(row.id);
        rowsProcessed++;
      }

      // Batch update retainer rows
      if (retainerIds.length > 0) {
        const { error: retUpdateErr } = await supabase
          .from('retainer_ledger')
          .update({ paid_out: true, payout_batch: batch })
          .in('id', retainerIds);

        if (retUpdateErr) {
          console.error('Retainer update error:', retUpdateErr.message);
        }

        // Append exactly ONE next-month retainer row (if it doesn't already exist)
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextMonthLabel = MONTH_NAMES[nextMonth.getMonth()] + ' ' + nextMonth.getFullYear();
        const nextDate = nextMonth.toISOString().split('T')[0].substring(0, 7) + '-01';

        const { data: existingNext } = await supabase
          .from('retainer_ledger')
          .select('id')
          .eq('team_member_id', teamMember.id)
          .eq('month_label', nextMonthLabel)
          .maybeSingle();

        if (!existingNext) {
          const { error: appendErr } = await supabase
            .from('retainer_ledger')
            .insert({
              date: nextDate,
              team_member_id: teamMember.id,
              person_name: teamMember.name,
              amount: teamMember.retainer_amount,
              month_label: nextMonthLabel,
              category: 'Retainer',
              payment_method: teamMember.payment_method || 'Check',
              paid_out: false,
              description: 'Contract Labor – Marketer Retainer',
            });

          if (appendErr) {
            console.error('Retainer append error:', appendErr.message);
          }
        }
      }
    }

    // ── Record payout batch (only if something was actually paid) ───────
    if (rowsProcessed === 0) {
      return res.status(200).json({
        success: true,
        batchId: null,
        message: `Nothing to pay out for ${person}`,
        totalPaid: 0,
        rowsProcessed: 0,
        teamRowsSkipped,
      });
    }

    const { error: batchErr } = await supabase
      .from('payout_batches')
      .insert({
        batch_id: batch,
        person_name: person,
        team_member_id: teamMember.id,
        payout_type: isMarketer ? 'Marketer' : 'Sales',
        payout_date: payoutDate,
        total_paid: totalPaid,
        rows_processed: rowsProcessed,
      });

    if (batchErr) {
      console.error('Payout batch insert error:', batchErr.message);
    }

    // ── Return response ──────────────────────────────────────────────────
    return res.status(200).json({
      success: true,
      batchId: batch,
      message: `${person} paid ${totalPaid.toFixed(2)} — ${rowsProcessed} rows marked paid` + (teamRowsSkipped > 0 ? ` (${teamRowsSkipped} TEAM rows skipped)` : ''),
      totalPaid,
      rowsProcessed,
      teamRowsSkipped,
    });

  } catch (err) {
    console.error('Payout error:', err);
    return res.status(500).json({ error: err.message });
  }
}
