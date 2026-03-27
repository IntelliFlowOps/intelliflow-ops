import { GoogleAuth } from 'google-auth-library';

const SHEET_ID = '1TK0c4BxhqSVL09SlC8SnweddOFvP9frEmYIKqdl2jqc';

async function checkSheet() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Dashboard`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { ok: false, message: 'Google Sheet is not responding. Tell Claude: Sheet CSV fetch returned ' + res.status };
    const text = await res.text();
    if (!text || text.length < 10) return { ok: false, message: 'Google Sheet returned empty data. Tell Claude: Dashboard tab appears empty or inaccessible.' };
    return { ok: true, message: 'Google Sheet connected and returning data.' };
  } catch (e) {
    return { ok: false, message: 'Google Sheet connection timed out. Tell Claude: Sheet fetch timed out after 8 seconds — may be a network issue on Vercel.' };
  }
}

async function checkServiceAccount() {
  try {
    const auth = new GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    const client = await auth.getClient();
    const token = await client.getAccessToken();
    if (!token?.token) return { ok: false, message: 'Payout API cannot authenticate. Tell Claude: Google Service Account getAccessToken returned null — likely GOOGLE_PRIVATE_KEY is missing or malformed in Vercel env vars.' };
    return { ok: true, message: 'Payout API Service Account authenticated successfully.' };
  } catch (e) {
    return { ok: false, message: 'Payout API auth failed. Tell Claude: ' + e.message.slice(0, 120) };
  }
}

async function checkAllAnalytics() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=All%20Analytics`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length <= 1) return { ok: false, message: 'All Analytics tab is empty — Pipedream has not synced Meta Ads data yet. Tell Claude: All Analytics tab has no data rows. Check Pipedream workflow is active and scheduled.' };

    // Check freshness — parse dates and see if any data is recent
    const rows = lines.slice(1);
    const dates = rows.map(r => r.split(',')[0]?.replace(/"/g, '').trim()).filter(Boolean);
    const latest = dates.sort().reverse()[0];
    if (latest) {
      const latestDate = new Date(latest);
      const daysSince = (Date.now() - latestDate.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 3) return { ok: false, message: `All Analytics last updated ${Math.round(daysSince)} days ago. Tell Claude: Pipedream Meta sync may be paused — last data row is from ${latest}.` };
    }
    return { ok: true, message: `All Analytics has ${rows.length} rows of data. Pipedream sync is working.` };
  } catch (e) {
    return { ok: false, message: 'Could not check All Analytics. Tell Claude: ' + e.message.slice(0, 100) };
  }
}

async function checkCommissionMath() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Commission_Ledger`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    const lines = text.trim().split('\n');
    if (lines.length <= 3) return { ok: true, message: 'Commission Ledger is empty — no data to validate yet.' };

    // Find header row
    let headerIdx = -1;
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      if (lines[i].includes('Revenue Collected') || lines[i].includes('Invoice ID')) { headerIdx = i; break; }
    }
    if (headerIdx === -1) return { ok: false, message: 'Commission Ledger headers not found. Tell Claude: Could not locate header row in Commission_Ledger — anchor detection may have failed.' };

    const headers = lines[headerIdx].split(',').map(h => h.replace(/"/g, '').trim());
    const revenueIdx = headers.indexOf('Revenue Collected');
    const baseIdx = headers.indexOf('Commission Base Amount');

    let issues = 0;
    for (let i = headerIdx + 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.replace(/"/g, '').trim());
      if (!cols[0]) continue;
      const revenue = parseFloat(cols[revenueIdx]) || 0;
      const base = parseFloat(cols[baseIdx]) || 0;
      if (revenue > 0 && base === 0) issues++;
    }

    if (issues > 0) return { ok: false, message: `${issues} Commission Ledger row(s) have revenue but no commission base amount. Tell Claude: Commission Base Amount column is missing values — check sheet formulas in column U.` };
    return { ok: true, message: 'Commission math looks correct — all rows have valid base amounts.' };
  } catch (e) {
    return { ok: false, message: 'Could not validate commission math. Tell Claude: ' + e.message.slice(0, 100) };
  }
}

async function checkStripeWebhook() {
  // Can't directly test Stripe webhook receipt, but we can check env var is set
  const hasKey = !!process.env.STRIPE_WEBHOOK_SECRET;
  const hasStripe = !!process.env.STRIPE_SECRET_KEY;
  if (!hasKey) return { ok: false, message: 'Stripe webhook secret is missing. Tell Claude: STRIPE_WEBHOOK_SECRET env var not set in Vercel — webhook signature validation will fail.' };
  if (!hasStripe) return { ok: false, message: 'Stripe secret key is missing. Tell Claude: STRIPE_SECRET_KEY env var not set in Vercel.' };
  return { ok: true, message: 'Stripe environment variables are configured.' };
}

async function checkAnthropicAPI() {
  const hasKey = !!process.env.ANTHROPIC_API_KEY;
  if (!hasKey) return { ok: false, message: 'Anthropic API key missing. Tell Claude: ANTHROPIC_API_KEY not set in Vercel — all AI assistants will fail.' };
  return { ok: true, message: 'Anthropic API key is configured.' };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const [sheet, serviceAccount, analytics, commissions, stripe, anthropic] = await Promise.all([
    checkSheet(),
    checkServiceAccount(),
    checkAllAnalytics(),
    checkCommissionMath(),
    checkStripeWebhook(),
    checkAnthropicAPI(),
  ]);

  const checks = [
    { name: 'Google Sheet', icon: '📊', ...sheet },
    { name: 'Payout API', icon: '💳', ...serviceAccount },
    { name: 'Meta Ads Sync', icon: '📈', ...analytics },
    { name: 'Commission Math', icon: '🧮', ...commissions },
    { name: 'Stripe Webhook', icon: '⚡', ...stripe },
    { name: 'AI Assistants', icon: '🤖', ...anthropic },
  ];

  const allOk = checks.every(c => c.ok);
  const failures = checks.filter(c => !c.ok);

  return res.status(200).json({
    allOk,
    checkedAt: new Date().toISOString(),
    checks,
    failures,
  });
}
