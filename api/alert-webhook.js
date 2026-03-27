// Called by Stripe webhook and payout API when significant events occur
// Sends email alerts to founders via Resend (free tier, no setup needed beyond API key)

const ALERT_EMAIL = 'kyle@intelliflowcommunications.com';
const ALERT_EMAIL_2 = 'brennan@intelliflowcommunications.com';

async function sendAlertEmail(subject, body) {
  const RESEND_KEY = process.env.RESEND_API_KEY;
  if (!RESEND_KEY) {
    console.log('RESEND_API_KEY not set — skipping email alert');
    return;
  }
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'IntelliFlow Ops <alerts@intelliflowcommunications.com>',
        to: [ALERT_EMAIL, ALERT_EMAIL_2],
        subject,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto; background: #07111f; color: #e4e4e7; padding: 32px; border-radius: 16px;">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 24px;">
              <div style="background: rgba(6,182,212,0.15); border: 1px solid rgba(6,182,212,0.3); border-radius: 10px; padding: 8px 14px; font-size: 13px; color: #67e8f9; font-weight: 600;">
                IntelliFlow Ops Alert
              </div>
            </div>
            <h2 style="margin: 0 0 16px; font-size: 20px; color: #ffffff;">${subject}</h2>
            <div style="background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 20px; font-size: 14px; line-height: 1.8; color: #a1a1aa;">
              ${body}
            </div>
            <p style="margin: 20px 0 0; font-size: 12px; color: #52525b;">
              IntelliFlow Operations Dashboard · ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        `,
      }),
    });
    console.log('Alert email sent:', subject);
  } catch (err) {
    console.error('Alert email failed:', err.message);
  }
}

export { sendAlertEmail };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { event, data } = req.body || {};
  if (!event) return res.status(400).json({ error: 'Missing event' });

  const alerts = {
    'client.onboarded': async (d) => {
      await sendAlertEmail(
        `New Client Onboarded — ${d.customerName}`,
        `<strong>${d.customerName}</strong> just signed up on the <strong>${d.plan}</strong> plan for <strong>$${d.amount}/month</strong>.<br><br>
        Revenue collected: $${d.amount}<br>
        Closer: ${d.closer || 'Unassigned'}<br>
        Lead Source: ${d.leadSource || 'Unknown'}<br><br>
        <a href="https://intelliflow-ops.vercel.app/customers" style="color: #67e8f9;">View in dashboard →</a>`
      );
    },
    'client.churned': async (d) => {
      await sendAlertEmail(
        `⚠️ Client Churned — ${d.customerName}`,
        `<strong>${d.customerName}</strong> has cancelled their subscription.<br><br>
        Plan: ${d.plan || 'Unknown'}<br>
        MRR Impact: -$${d.mrr || '?'}/month<br><br>
        Reach out immediately to understand why.<br><br>
        <a href="https://intelliflow-ops.vercel.app/customers" style="color: #67e8f9;">View in dashboard →</a>`
      );
    },
    'client.at_risk': async (d) => {
      await sendAlertEmail(
        `⚠️ Client At Risk — ${d.customerName}`,
        `<strong>${d.customerName}</strong> has been flagged as At Risk.<br><br>
        Reason: ${d.reason || 'Status changed to At Risk'}<br><br>
        Proactive outreach recommended within 24 hours.<br><br>
        <a href="https://intelliflow-ops.vercel.app/customers" style="color: #67e8f9;">View in dashboard →</a>`
      );
    },
    'contractor.threshold': async (d) => {
      await sendAlertEmail(
        `1099 Threshold Hit — ${d.person}`,
        `<strong>${d.person}</strong> has exceeded the $600 IRS reporting threshold for the year.<br><br>
        YTD Total: <strong>$${d.ytdTotal}</strong><br><br>
        A 1099-NEC will be required by January 31st. Make sure you have their W-9 on file.<br><br>
        <a href="https://intelliflow-ops.vercel.app/payroll" style="color: #67e8f9;">View in payroll →</a>`
      );
    },
    'payout.processed': async (d) => {
      await sendAlertEmail(
        `Payout Processed — ${d.person}`,
        `A payout of <strong>$${d.amount}</strong> was processed for <strong>${d.person}</strong>.<br><br>
        Batch ID: ${d.batchId}<br><br>
        <a href="https://intelliflow-ops.vercel.app/payroll" style="color: #67e8f9;">View in payroll →</a>`
      );
    },
  };

  const handler = alerts[event];
  if (!handler) return res.status(400).json({ error: 'Unknown event' });
  await handler(data || {});
  return res.status(200).json({ sent: true, event });
}
