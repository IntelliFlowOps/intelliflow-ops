const SHEET_ID = '1TK0c4BxhqSVL09SlC8SnweddOFvP9frEmYIKqdl2jqc';

async function checkSheet() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Dashboard`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return { ok: false, message: `Google Sheet not responding (status ${res.status}). Tell Claude: Sheet CSV fetch failed.` };
    const text = await res.text();
    if (!text || text.length < 10) return { ok: false, message: 'Google Sheet returned empty data. Tell Claude: Dashboard tab appears empty.' };
    return { ok: true, message: 'Google Sheet connected.' };
  } catch (e) {
    return { ok: false, message: 'Google Sheet timed out. Tell Claude: Sheet fetch timed out — possible Vercel network issue.' };
  }
}

async function checkAllAnalytics() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=All%20Analytics`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    const lines = text.trim().split('\n').filter(l => l.trim());
    if (lines.length <= 1) return { ok: false, message: 'All Analytics is empty — Pipedream has not synced yet. Tell Claude: Check Pipedream Meta workflow is active.' };
    const rows = lines.slice(1);
    const dates = rows.map(r => r.split(',')[0]?.replace(/"/g, '').trim()).filter(Boolean);
    const latest = dates.sort().reverse()[0];
    if (latest) {
      const daysSince = (Date.now() - new Date(latest).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince > 3) return { ok: false, message: `All Analytics last updated ${Math.round(daysSince)} days ago. Tell Claude: Pipedream Meta sync may be paused — last data from ${latest}.` };
    }
    return { ok: true, message: `All Analytics has ${rows.length} rows. Pipedream sync working.` };
  } catch (e) {
    return { ok: false, message: 'Could not check All Analytics. Tell Claude: ' + e.message.slice(0, 100) };
  }
}

async function checkCommissionLedger() {
  try {
    const url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Commission_Ledger`;
    const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const text = await res.text();
    const lines = text.trim().split('\n');
    if (lines.length <= 3) return { ok: true, message: 'Commission Ledger empty — no data to validate yet.' };
    let headerIdx = -1;
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      if (lines[i].includes('Revenue Collected') || lines[i].includes('Invoice ID')) { headerIdx = i; break; }
    }
    if (headerIdx === -1) return { ok: false, message: 'Commission Ledger headers missing. Tell Claude: Anchor detection failed on Commission_Ledger — header row may have shifted.' };
    return { ok: true, message: 'Commission Ledger structure looks correct.' };
  } catch (e) {
    return { ok: false, message: 'Could not check Commission Ledger. Tell Claude: ' + e.message.slice(0, 100) };
  }
}

function checkEnvVars() {
  const missing = [];
  if (!process.env.ANTHROPIC_API_KEY) missing.push('ANTHROPIC_API_KEY');
  if (!process.env.STRIPE_WEBHOOK_SECRET) missing.push('STRIPE_WEBHOOK_SECRET');
  if (!process.env.STRIPE_SECRET_KEY) missing.push('STRIPE_SECRET_KEY');
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) missing.push('GOOGLE_SERVICE_ACCOUNT_EMAIL');
  if (!process.env.GOOGLE_PRIVATE_KEY) missing.push('GOOGLE_PRIVATE_KEY');
  if (!process.env.KV_REST_API_URL) missing.push('KV_REST_API_URL');

  if (missing.length > 0) return { ok: false, message: `Missing env vars: ${missing.join(', ')}. Tell Claude: Add these to Vercel environment variables.` };
  return { ok: true, message: 'All environment variables configured.' };
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const [sheet, analytics, ledger] = await Promise.all([
      checkSheet(),
      checkAllAnalytics(),
      checkCommissionLedger(),
    ]);
    const envCheck = checkEnvVars();

    const checks = [
      { name: 'Google Sheet', icon: '📊', ...sheet },
      { name: 'Meta Ads Sync', icon: '📈', ...analytics },
      { name: 'Commission Ledger', icon: '🧮', ...ledger },
      { name: 'Environment Config', icon: '⚙️', ...envCheck },
    ];

    const failures = checks.filter(c => !c.ok);
    return res.status(200).json({
      allOk: failures.length === 0,
      checkedAt: new Date().toISOString(),
      checks,
      failures,
    });
  } catch (e) {
    return res.status(500).json({
      allOk: false,
      checkedAt: new Date().toISOString(),
      checks: [],
      failures: [{ name: 'Health Check', message: 'Health check crashed. Tell Claude: ' + e.message }],
    });
  }
}
