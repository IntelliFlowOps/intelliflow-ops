import { google } from 'googleapis';

const SHEET_ID = '1TK0c4BxhqSVL09SlC8SnweddOFvP9frEmYIKqdl2jqc';
const CUSTOMERS_TAB = 'Customers';
const LEDGER_TAB = 'Commission_Ledger';

const DIRECT_MARKETERS = ['Emma', 'Wyatt'];
const SALES_REPS = ['ED', 'Micah', 'Justin'];

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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { customerName, closer } = req.body || {};
  if (!customerName || !closer) return res.status(400).json({ error: 'Missing customerName or closer' });

  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // ── 1. Find customer row in Customers tab ──────────────────────────────
    const custRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${CUSTOMERS_TAB}!A:W`,
    });
    const custRows = custRes.data.values || [];

    // Find header row
    let custHeaderIdx = 0;
    for (let i = 0; i < Math.min(5, custRows.length); i++) {
      if (custRows[i] && custRows[i].some(c => (c||'').trim() === 'Customer Name')) {
        custHeaderIdx = i; break;
      }
    }
    const custHeaders = custRows[custHeaderIdx] || [];
    const nameCol = custHeaders.findIndex(h => h.trim() === 'Customer Name');
    const attrCol = custHeaders.findIndex(h => h.trim() === 'Attribution Type');
    const directCol = custHeaders.findIndex(h => h.trim() === 'Direct Marketer');

    // Find the customer row
    let custRowIdx = -1;
    for (let i = custHeaderIdx + 1; i < custRows.length; i++) {
      if ((custRows[i][nameCol] || '').trim() === customerName.trim()) {
        custRowIdx = i; break;
      }
    }

    if (custRowIdx < 0) return res.status(404).json({ error: `Customer not found: ${customerName}` });

    const sheetRowNum = custRowIdx + 1; // 1-indexed for Sheets API
    const isDirect = DIRECT_MARKETERS.includes(closer);
    const isSales = SALES_REPS.includes(closer);
    const isFounder = closer === 'Founder';

    // Update Attribution Type and Direct Marketer on Customers tab
    const attrValue = isDirect ? 'DIRECT' : isSales ? 'SALES' : 'FOUNDER';
    const directValue = isDirect ? closer : '';

    const updates = [];
    if (attrCol >= 0) {
      const colLetter = colToLetter(attrCol);
      updates.push({
        range: `${CUSTOMERS_TAB}!${colLetter}${sheetRowNum}`,
        values: [[attrValue]],
      });
    }
    if (directCol >= 0) {
      const colLetter = colToLetter(directCol);
      updates.push({
        range: `${CUSTOMERS_TAB}!${colLetter}${sheetRowNum}`,
        values: [[directValue]],
      });
    }

    // ── 2. Update Commission_Ledger rows for this customer ─────────────────
    const ledgerRes = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${LEDGER_TAB}!A:U`,
    });
    const ledgerRows = ledgerRes.data.values || [];

    let ledgerHeaderIdx = 0;
    for (let i = 0; i < Math.min(5, ledgerRows.length); i++) {
      if (ledgerRows[i] && ledgerRows[i].some(c => (c||'').trim() === 'Date')) {
        ledgerHeaderIdx = i; break;
      }
    }
    const ledgerHeaders = ledgerRows[ledgerHeaderIdx] || [];
    const lNameCol = ledgerHeaders.findIndex(h => h.trim() === 'Customer Name');
    const lAttrCol = ledgerHeaders.findIndex(h => h.trim() === 'Attribution Type');
    const lDirectCol = ledgerHeaders.findIndex(h => h.trim() === 'Direct Marketer');
    const lSalesCol = ledgerHeaders.findIndex(h => h.trim() === 'Sales Rep');

    for (let i = ledgerHeaderIdx + 1; i < ledgerRows.length; i++) {
      const row = ledgerRows[i];
      if (!row || (row[lNameCol] || '').trim() !== customerName.trim()) continue;
      const rowNum = i + 1;

      // Only update if currently UNASSIGNED
      const currentAttr = (row[lAttrCol] || '').trim();
      if (currentAttr !== 'UNASSIGNED' && currentAttr !== '') continue;

      if (lDirectCol >= 0) {
        updates.push({
          range: `${LEDGER_TAB}!${colToLetter(lDirectCol)}${rowNum}`,
          values: [[isDirect ? closer : '']],
        });
      }
      if (lSalesCol >= 0) {
        updates.push({
          range: `${LEDGER_TAB}!${colToLetter(lSalesCol)}${rowNum}`,
          values: [[isSales ? closer : '']],
        });
      }
    }

    // Batch write all updates
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: SHEET_ID,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: updates,
        },
      });
    }

    await logActivity(sheets, {
      customerName,
      activityType: 'Closer Assigned',
      owner: 'System',
      summary: `${closer} assigned as closer${leadSource ? ` — Lead source: ${leadSource}` : ''}`,
      nextStep: 'Begin onboarding outreach',
      healthImpact: 'Positive',
    });

    return res.status(200).json({ success: true, closer, attribution: attrValue, updatedRows: updates.length });
  } catch (err) {
    console.error('assign-closer error:', err);
    return res.status(500).json({ error: err.message });
  }
}

function colToLetter(colIdx) {
  let letter = '';
  let n = colIdx + 1;
  while (n > 0) {
    const rem = (n - 1) % 26;
    letter = String.fromCharCode(65 + rem) + letter;
    n = Math.floor((n - 1) / 26);
  }
  return letter;
}
