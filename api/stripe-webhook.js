import Stripe from 'stripe';
import supabase from '../lib/supabase.js';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

function today() {
  return new Date().toISOString().split('T')[0];
}

// ── Handle customer.subscription.deleted ─────────────────────────────────────

async function handleSubscriptionDeleted(subscription) {
  const stripeCustomerId = subscription.customer;

  const { data: customer, error } = await supabase
    .from('customers')
    .select('id, customer_name')
    .eq('stripe_customer_id', stripeCustomerId)
    .single();

  if (error || !customer) {
    console.warn(`subscription.deleted: no customer found for ${stripeCustomerId}`);
    return { success: true, action: 'customer_not_found', stripe_customer_id: stripeCustomerId };
  }

  await supabase
    .from('customers')
    .update({ status: 'Churned', updated_at: new Date().toISOString() })
    .eq('id', customer.id);

  return { success: true, action: 'customer_churned', customer_name: customer.customer_name };
}

// ── Handle charge.dispute.created ────────────────────────────────────────────

async function handleDispute(dispute) {
  const invoiceId = dispute.invoice;
  const stripeCustomerId = dispute.customer;
  const disputeDate = today();

  if (invoiceId) {
    await supabase
      .from('commission_ledger')
      .update({ notes: `DISPUTED — charge dispute opened ${disputeDate}` })
      .eq('invoice_id', invoiceId);
  }

  if (stripeCustomerId) {
    await supabase
      .from('customers')
      .update({ status: 'At Risk', updated_at: new Date().toISOString() })
      .eq('stripe_customer_id', stripeCustomerId);
  }

  return { success: true, action: 'dispute_recorded', invoice_id: invoiceId };
}

// ── Handle charge.refunded ──────────────────────────────────────────────────

async function handleRefund(charge) {
  const invoiceId = charge.invoice;
  const stripeCustomerId = charge.customer;
  const refundDate = today();
  const amountRefunded = (charge.amount_refunded || 0) / 100;
  const amountTotal = (charge.amount || 0) / 100;
  const isFullRefund = amountRefunded >= amountTotal;

  if (invoiceId) {
    await supabase
      .from('commission_ledger')
      .update({
        commission_total: 0,
        emma_commission: 0,
        wyatt_commission: 0,
        sales_commission: 0,
        notes: `REFUNDED — commission zeroed out ${refundDate}${isFullRefund ? '' : ` (partial: $${amountRefunded.toFixed(2)} of $${amountTotal.toFixed(2)})`}`,
      })
      .eq('invoice_id', invoiceId);
  }

  if (stripeCustomerId && isFullRefund) {
    await supabase
      .from('customers')
      .update({ status: 'Refunded', updated_at: new Date().toISOString() })
      .eq('stripe_customer_id', stripeCustomerId);
  }

  return { success: true, action: isFullRefund ? 'full_refund' : 'partial_refund', invoice_id: invoiceId };
}

// ── Handle invoice.payment_failed ───────────────────────────────────────────

async function handlePaymentFailed(invoice) {
  const stripeCustomerId = invoice.customer;

  if (stripeCustomerId) {
    await supabase
      .from('customers')
      .update({ status: 'At Risk', updated_at: new Date().toISOString() })
      .eq('stripe_customer_id', stripeCustomerId);
  }

  return { success: true, action: 'payment_failed_recorded', customer: stripeCustomerId };
}

// ── Handle invoice.payment_succeeded ─────────────────────────────────────────

async function handleInvoicePaid(invoice) {
  // Step 3 — Extract invoice data
  const invoiceId = invoice.id;
  const stripeCustomerId = invoice.customer;
  const customerDisplay = invoice.customer_name || invoice.customer_email || 'Unknown';
  const amountPaidCents = invoice.amount_paid || 0;
  const revenueCollected = amountPaidCents / 100;
  const priceId = invoice.lines?.data?.[0]?.price?.id || null;
  const periodStart = invoice.lines?.data?.[0]?.period?.start;
  const ledgerDate = periodStart
    ? new Date(periodStart * 1000).toISOString().split('T')[0]
    : today();

  // Step 4 — Find the plan by Stripe Price ID
  let plan = null;
  if (priceId) {
    const { data } = await supabase
      .from('plans')
      .select('*')
      .or(`stripe_monthly_price_id.eq.${priceId},stripe_annual_price_id.eq.${priceId}`)
      .maybeSingle();
    plan = data || null;
  }
  let commissionBase = plan ? plan.commission_base : revenueCollected;
  if (revenueCollected === 0) commissionBase = 0; // No commission on $0 invoices (trials, coupons)
  const planTier = plan ? plan.name : 'Unknown';

  // Step 5 — Find or create the customer (upsert-safe for concurrent webhooks)
  let customer = null;
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('*')
    .eq('stripe_customer_id', stripeCustomerId)
    .maybeSingle();

  if (existingCustomer) {
    const newMonthsActive = (existingCustomer.months_active || 0) + 1;
    await supabase
      .from('customers')
      .update({
        months_active: newMonthsActive,
        last_payment_date: today(),
        status: 'Active',
        plan_id: plan?.id ?? existingCustomer.plan_id,
        mrr: plan ? plan.monthly_price : existingCustomer.mrr,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingCustomer.id);
    customer = { ...existingCustomer, months_active: newMonthsActive };
  } else {
    const newCustomer = {
      customer_name: customerDisplay,
      stripe_customer_id: stripeCustomerId,
      plan_id: plan?.id || null,
      mrr: plan ? plan.monthly_price : revenueCollected,
      months_active: 1,
      status: 'Active',
      attribution_type: 'FOUNDER',
      onboard_date: today(),
      last_payment_date: today(),
    };
    const { data: inserted, error: insertErr } = await supabase
      .from('customers')
      .insert(newCustomer)
      .select()
      .single();
    if (insertErr) {
      // Handle concurrent insert race — another webhook created this customer first
      if (insertErr.code === '23505') {
        const { data: raceCustomer } = await supabase
          .from('customers')
          .select('*')
          .eq('stripe_customer_id', stripeCustomerId)
          .single();
        if (raceCustomer) {
          const newMonthsActive = (raceCustomer.months_active || 0) + 1;
          await supabase
            .from('customers')
            .update({ months_active: newMonthsActive, last_payment_date: today(), status: 'Active', updated_at: new Date().toISOString() })
            .eq('id', raceCustomer.id);
          customer = { ...raceCustomer, months_active: newMonthsActive };
        } else {
          throw new Error(`Customer race condition: insert conflict but re-query failed for ${stripeCustomerId}`);
        }
      } else {
        throw new Error(`Failed to insert customer: ${insertErr.message}`);
      }
    } else {
      customer = inserted;
    }
  }

  // Step 6 — Calculate commission
  const attributionType = customer.attribution_type || 'FOUNDER';
  let teamMember = null;
  let salesTeamMember = null;

  if (customer.assigned_to) {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', customer.assigned_to)
      .single();
    teamMember = data || null;
  }

  if (customer.sales_rep) {
    const { data } = await supabase
      .from('team_members')
      .select('*')
      .eq('id', customer.sales_rep)
      .single();
    salesTeamMember = data || null;
  }

  let commissionRate = 0;
  let commissionTotal = 0;
  let emmaRate = 0;
  let emmaCommission = 0;
  let wyattRate = 0;
  let wyattCommission = 0;
  let salesRepRate = 0;
  let salesCommission = 0;
  let notes = `Auto-created from Stripe invoice ${invoiceId}`;

  if (attributionType === 'TEAM') {
    notes = `Auto-created from Stripe invoice ${invoiceId} — TEAM path paused`;
  } else if (attributionType === 'DIRECT' && teamMember) {
    commissionRate = teamMember.commission_rate || 0.05;
    commissionTotal = commissionBase * commissionRate;
    const memberName = (teamMember.name || '').trim();
    if (memberName === 'Emma') {
      emmaRate = commissionRate;
      emmaCommission = commissionTotal;
    } else if (memberName === 'Wyatt') {
      wyattRate = commissionRate;
      wyattCommission = commissionTotal;
    }
  } else if (attributionType === 'SALES' && salesTeamMember) {
    if (customer.months_active <= 6) {
      salesRepRate = salesTeamMember.commission_rate || 0.20;
      salesCommission = commissionBase * salesRepRate;
      commissionTotal = commissionBase * salesRepRate;
    }
    // emma/wyatt always 0 on SALES deals
  }
  // FOUNDER — all commission stays 0

  // Step 7 — Write the commission ledger row
  const ledgerRow = {
    date: ledgerDate,
    invoice_id: invoiceId,
    customer_id: customer.id || null,
    customer_name: customer.customer_name || customerDisplay,
    revenue_collected: revenueCollected,
    plan_id: plan?.id || null,
    commission_base: commissionBase,
    attribution_type: attributionType,
    assigned_to: customer.assigned_to || null,
    assigned_to_name: teamMember?.name || null,
    paid_month: customer.months_active,
    commission_rate: commissionRate,
    commission_total: commissionTotal,
    emma_rate: emmaRate,
    emma_commission: emmaCommission,
    wyatt_rate: wyattRate,
    wyatt_commission: wyattCommission,
    sales_rep: customer.sales_rep || null,
    sales_rep_name: salesTeamMember?.name || null,
    sales_rep_rate: salesRepRate,
    sales_commission: salesCommission,
    paid_out: false,
    notes,
  };

  const { error: ledgerErr } = await supabase
    .from('commission_ledger')
    .insert(ledgerRow);

  if (ledgerErr) {
    if (ledgerErr.code === '23505') {
      return { success: true, duplicate_invoice: true, invoice_id: invoiceId };
    }
    console.error('Failed to insert commission ledger row:', ledgerErr.message);
    return { success: false, error: ledgerErr.message };
  }

  // Step 8 — Return success
  return {
    success: true,
    customer_name: customer.customer_name || customerDisplay,
    plan_tier: planTier,
    commission_total: commissionTotal,
    sales_commission: salesCommission,
    months_active: customer.months_active,
  };
}

// ── Main handler ─────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Step 1 — Verify webhook signature
  let event;
  try {
    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];
    event = stripe.webhooks.constructEvent(buf, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'Signature verification failed' });
  }

  try {
    // Step 2 — Idempotency check
    const { data: existingEvent } = await supabase
      .from('stripe_events')
      .select('id')
      .eq('event_id', event.id)
      .maybeSingle();

    if (existingEvent) {
      return res.status(200).json({ already_processed: true, event_id: event.id });
    }

    await supabase
      .from('stripe_events')
      .insert({ event_id: event.id, event_type: event.type, payload: event });

    // Route by event type
    let result;

    if (event.type === 'invoice.payment_succeeded') {
      result = await handleInvoicePaid(event.data.object);
    } else if (event.type === 'customer.subscription.deleted') {
      result = await handleSubscriptionDeleted(event.data.object);
    } else if (event.type === 'charge.dispute.created') {
      result = await handleDispute(event.data.object);
    } else if (event.type === 'charge.refunded') {
      result = await handleRefund(event.data.object);
    } else if (event.type === 'invoice.payment_failed') {
      result = await handlePaymentFailed(event.data.object);
    } else {
      result = { success: true, action: 'ignored', event_type: event.type };
    }

    return res.status(200).json(result);
  } catch (err) {
    console.error('Webhook processing error:', err);
    // Transient errors (DB down, network issues) → 500 so Stripe retries
    // Permanent errors (bad data, logic errors) → 200 so Stripe stops
    const msg = (err.message || '').toLowerCase();
    const isTransient = ['econnrefused', 'timeout', 'etimedout', 'fetch failed', 'network', 'socket', 'connection', 'unavailable'].some(t => msg.includes(t));
    if (isTransient) {
      return res.status(500).json({ error: 'Temporary failure — Stripe will retry', detail: err.message });
    }
    return res.status(200).json({ success: false, error: err.message });
  }
}
