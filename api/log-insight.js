import { google } from 'googleapis';
import { validateRequest } from '../lib/api-auth.js';

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
  const authCheck = validateRequest(req);
  if (!authCheck.valid) return res.status(401).json({ error: authCheck.error });
  const { platform, niche, winningHook, winningCta, bestCreative, notWorking, nextTest } = req.body || {};
  if (!platform || !winningHook) return res.status(400).json({ error: 'Missing platform or winningHook' });
  try {
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });
    const date = new Date().toISOString().split('T')[0];
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: 'Creative_Insights!A:H',
      valueInputOption: 'USER_ENTERED',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: [[date, platform, niche || '', winningHook, winningCta || '', bestCreative || '', notWorking || '', nextTest || '']] },
    });
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('log-insight error:', err);
    return res.status(500).json({ error: err.message });
  }
}
