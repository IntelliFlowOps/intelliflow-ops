import { google } from 'googleapis';

const SHEET_ID = '1TK0c4BxhqSVL09SlC8SnweddOFvP9frEmYIKqdl2jqc';

async function getAuth() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  return auth;
}

async function getRows(sheets, tab, range) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tab}!${range}`,
  });
  return res.data.values || [];
}

function findHeaderIdx(rows, anchor) {
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    if (rows[i]?.some(c => (c || '').trim() === anchor)) return i;
  }
  return 0;
}

function colLetter(idx) {
  let l = '', n = idx + 1;
  while (n > 0) { const r = (n - 1) % 26; l = String.fromCharCode(65 + r) + l; n = Math.floor((n - 1) / 26); }
  return l;
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function monthLabel() {
  const d = new Date();
  return ['January','February','March','April','May','June','July','August','September','October','November','December'][d.getMonth()] + ' ' + d.getFullYear();
}

function batchId(person) {
  const d = new Date();
  return `PAY-${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${person.toUpperCase()}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action, person } = req.body || {};
  if (action !== 'payout' || !person) return res.status(400).json({ error: 'Missing action or person' });

  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const batch = batchId(person);
    const payoutDate = today();
    const updates = [];
    let totalPaid = 0;
    let rowsProcessed = 0;

    // ── Commission_Ledger ─────────────────────────────────────────────────
    const ledgerRows = await getRows(sheets, 'Commission_Ledger', 'A:U');
    const lhi = findHeaderIdx(ledgerRows, 'Date');
    const lh = ledgerRows[lhi] || [];
    const lCols = {
      directMarketer: lh.findIndex(h => h.trim() === 'Direct Marketer'),
      salesRep: lh.findIndex(h => h.trim() === 'Sales Rep'),
      paidOut: lh.findIndex(h => h.trim() === 'Paid Out?'),
      payoutBatch: lh.findIndex(h => h.trim() === 'Payout Batch / Month'),
      emmaComm: lh.findIndex(h => h.trim() === 'Emma Commission'),
      wyattComm: lh.findIndex(h => h.trim() === 'Wyatt Commission'),
      salesComm: lh.findIndex(h => h.trim() === 'Sales Commission'),
    };

    const isMarketer = person === 'Emma' || person === 'Wyatt';
    const isSales = ['ED', 'Micah', 'Justin'].includes(person);

    for (let i = lhi + 1; i < ledgerRows.length; i++) {
      const row = ledgerRows[i];
      if (!row) continue;
      const paidOutVal = (row[lCols.paidOut] || '').trim().toLowerCase();
      const payoutBatchVal = (row[lCols.payoutBatch] || '').trim();
      const alreadyPaid = ['yes','paid','y','1','true'].includes(paidOutVal) || payoutBatchVal;
      if (alreadyPaid) continue;

      const ownerMatch = isMarketer
        ? (row[lCols.directMarketer] || '').trim() === person
        : (row[lCols.salesRep] || '').trim() === person;
      if (!ownerMatch) continue;

      const commVal = person === 'Emma' ? parseFloat(row[lCols.emmaComm] || 0)
        : person === 'Wyatt' ? parseFloat(row[lCols.wyattComm] || 0)
        : parseFloat(row[lCols.salesComm] || 0);
      totalPaid += isFinite(commVal) ? commVal : 0;

      const sheetRow = i + 1;
      updates.push({ range: `Commission_Ledger!${colLetter(lCols.paidOut)}${sheetRow}`, values: [['Yes']] });
      updates.push({ range: `Commission_Ledger!${colLetter(lCols.payoutBatch)}${sheetRow}`, values: [[batch]] });
      rowsProcessed++;
    }

    // ── RETAINER_LEDGER (Emma + Wyatt only) ───────────────────────────────
    if (isMarketer) {
      const retainerRows = await getRows(sheets, 'RETAINER_LEDGER', 'A:J');
      const rhi = findHeaderIdx(retainerRows, 'Date');
      const rh = retainerRows[rhi] || [];
      const rCols = {
        person: rh.findIndex(h => h.trim() === 'Person'),
        amount: rh.findIndex(h => h.trim() === 'Amount'),
        paidOut: rh.findIndex(h => h.trim() === 'Paid Out?'),
        payoutBatch: rh.findIndex(h => h.trim() === 'Payout Batch'),
      };

      for (let i = rhi + 1; i < retainerRows.length; i++) {
        const row = retainerRows[i];
        if (!row) continue;
        if ((row[rCols.person] || '').trim() !== person) continue;
        const paidOutVal = (row[rCols.paidOut] || '').trim().toLowerCase();
        const payoutBatchVal = (row[rCols.payoutBatch] || '').trim();
        if (['yes','paid','y','1','true'].includes(paidOutVal) || payoutBatchVal) continue;

        const amt = parseFloat(row[rCols.amount] || 0);
        totalPaid += isFinite(amt) ? amt : 0;

        const sheetRow = i + 1;
        updates.push({ range: `RETAINER_LEDGER!${colLetter(rCols.paidOut)}${sheetRow}`, values: [['Yes']] });
        updates.push({ range: `RETAINER_LEDGER!${colLetter(rCols.payoutBatch)}${sheetRow}`, values: [[batch]] });
        rowsProcessed++;

        // Auto-append next month retainer row
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        const nextMonthLabel = ['January','February','March','April','May','June','July','August','September','October','November','December'][nextMonth.getMonth()] + ' ' + nextMonth.getFullYear();
        const nextDate = nextMonth.toISOString().split('T')[0].substring(0, 7) + '-01';
        await sheets.spreadsheets.values.append({
          spreadsheetId: SHEET_ID,
          range: 'RETAINER_LEDGER!A:J',
          valueInputOption: 'USER_ENTERED',
          insertDataOption: 'INSERT_ROWS',
          requestBody: { values: [[nextDate, person, 200, nextMonthLabel, 'Retainer', row[5] || 'Check', '', '', 'Contract Labor – Marketer Retainer', '']] },
        });
      }
    }

    // ── Batch write all payout updates ────────────────────────────────────
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: { valueInputOption: 'USER_ENTERED', data: updates },
      });
    }

    // ── PAYOUT_BATCHES log ────────────────────────────────────────────────
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'PAYOUT_BATCHES!A:F',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [[payoutDate, batch, person, totalPaid.toFixed(2), rowsProcessed, monthLabel()]] },
    });

    return res.status(200).json({
      success: true,
      batchId: batch,
      message: `${person} paid ${totalPaid.toFixed(2)} — ${rowsProcessed} rows marked paid`,
      totalPaid,
      rowsProcessed,
    });

  } catch (err) {
    console.error('sheets-write error:', err);
    return res.status(500).json({ error: err.message });
  }
}
