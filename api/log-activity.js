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

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { customerName, activityType, owner, summary, nextStep, healthImpact, reference } = req.body || {};
  if (!customerName || !summary) return res.status(400).json({ error: 'Missing customerName or summary' });
  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const date = new Date().toISOString().split('T')[0];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Customer_Activity!A:H',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [[date, customerName, activityType || '', owner || '', summary, nextStep || '', healthImpact || '', reference || '']] },
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('log-activity error:', err);
    return res.status(500).json({ error: err.message });
  }
}
