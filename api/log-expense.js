import { google } from 'googleapis';
const SHEET_ID = '1TK0c4BxhqSVL09SlC8SnweddOFvP9frEmYIKqdl2jqc';
async function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { date, amount, category, description, vendor, notes } = req.body || {};
  if (!amount || !category) return res.status(400).json({ error: 'Missing amount or category' });
  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const d = date || new Date().toISOString().split('T')[0];
    const taxYear = new Date(d).getFullYear().toString();
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'EXPENSES!A:G',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [[d, amount, category, description || '', vendor || '', taxYear, notes || '']] },
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
