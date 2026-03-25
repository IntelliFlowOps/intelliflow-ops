import Stripe from 'stripe';
import { google } from 'googleapis';

const SHEET_ID = '1TK0c4BxhqSVL09SlC8SnweddOFvP9frEmYIKqdl2jqc';
const LEDGER_TAB = 'Commission_Ledger';
const CUSTOMERS_TAB = 'Customers';

const PRICE_MAP = {
  [process.env.STRIPE_PRICE_STARTER_MONTHLY]: { base: 299, plan: 'Starter', interval: 'month' },
  [process.env.STRIPE_PRICE_STARTER_ANNUAL]:  { base: 299, plan: 'Starter', interval: 'year' },
  [process.env.STRIPE_PRICE_PRO_MONTHLY]:     { base: 499, plan: 'Pro',     interval: 'month' },
  [process.env.STRIPE_PRICE_PRO_ANNUAL]:      { base: 499, plan: 'Pro',     interval: 'year' },
  [process.env.STRIPE_PRICE_PREMIUM_MONTHLY]: { base: 999, plan: 'Premium', interval: 'month' },
  [process.env.STRIPE_PRICE_PREMIUM_ANNUAL]:  { base: 999, plan: 'Premium', interval: 'year' },
};

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

async function getSheetRows(sheets, tabName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${tabName}!A:U`,
  });
  return res.data.values || [];
}

async function findHeaderRow(rows, anchor) {
  for (let i = 0; i < Math.min(5, rows.length); i++) {
    if (rows[i] && rows[i].some(c => (c || '').trim() === anchor)) return i;
  }
  return 0;
}

async function invoiceAlreadyExists(sheets, invoiceId) {
  const rows = await getSheetRows(sheets, LEDGER_TAB);
  const headerIdx = await findHeaderRow(rows, 'Date');
  const headers = rows[headerIdx] || [];
  const invoiceCol = headers.findIndex(h => h.trim() === 'Invoice ID');
  if (invoiceCol < 0) return false;
  return rows.slice(headerIdx + 1).some(r => (r[invoiceCol] || '').trim() === invoiceId);
}

async function appendLedgerRows(sheets, rowsToAppend) {
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${LEDGER_TAB}!A:U`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: rowsToAppend },
  });
}

async function upsertCustomer(sheets, { customerName, stripeCustomerId, plan, closeDate }) {
  const rows = await getSheetRows(sheets, CUSTOMERS_TAB);
  const headerIdx = await findHeaderRow(rows, 'Customer Name');
  const headers = rows[headerIdx] || [];
  const nameCol = headers.findIndex(h => h.trim() === 'Customer Name');
  const stripeCol = headers.findIndex(h => h.trim() === 'Stripe Customer ID');

  // Check if customer already exists by Stripe ID
  const existingIdx = rows.findIndex((r, i) =>
    i > headerIdx && stripeCol >= 0 && (r[stripeCol] || '').trim() === stripeCustomerId
  );

  if (existingIdx >= 0) return; // Already exists, don't overwrite

  // Append new customer row — minimal fields, rest filled manually
  const newRow = new Array(Math.max(headers.length, 13)).fill('');
  if (nameCol >= 0) newRow[nameCol] = customerName;
  if (stripeCol >= 0) newRow[stripeCol] = stripeCustomerId;

  // Set Status to Onboarding, Close Date
  const statusCol = headers.findIndex(h => h.trim() === 'Status');
  const closeDateCol = headers.findIndex(h => h.trim() === 'Close Date');
  const planCol = headers.findIndex(h => h.trim() === 'MRR / Revenue');
  if (statusCol >= 0) newRow[statusCol] = 'Onboarding';
  if (closeDateCol >= 0) newRow[closeDateCol] = closeDate;
  if (planCol >= 0) newRow[planCol] = plan === 'Starter' ? 299 : plan === 'Pro' ? 499 : 999;

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${CUSTOMERS_TAB}!A:W`,
    valueInputOption: 'USER_ENTERED',
    insertDataOption: 'INSERT_ROWS',
    requestBody: { values: [newRow] },
  });
}

export const config = { api: { bodyParser: false } };

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  if (event.type !== 'invoice.payment_succeeded') {
    return res.status(200).json({ received: true, skipped: true });
  }

  try {
    const invoice = event.data.object;
    const invoiceId = invoice.id;
    const stripeCustomerId = invoice.customer;
    const customerName = invoice.customer_name || invoice.customer_email || stripeCustomerId;
    const amountPaid = invoice.amount_paid / 100;
    const invoiceDate = new Date(invoice.created * 1000).toISOString().split('T')[0];

    // Get price ID from line items
    const lineItem = invoice.lines?.data?.[0];
    const priceId = lineItem?.price?.id;
    const priceInfo = PRICE_MAP[priceId];

    // If unknown price, still write a row but flag it
    const base = priceInfo?.base || amountPaid;
    const interval = priceInfo?.interval || 'month';

    // Auth + sheets client
    const auth = await getAuth();
    const sheets = google.sheets({ version: 'v4', auth });

    // Deduplicate
    const exists = await invoiceAlreadyExists(sheets, invoiceId);
    if (exists) {
      console.log(`Invoice ${invoiceId} already exists, skipping`);
      return res.status(200).json({ received: true, duplicate: true });
    }

    // Build rows to write
    const rowsToWrite = [];

    if (interval === 'year') {
      // Annual plan — write 12 monthly rows
      for (let month = 1; month <= 12; month++) {
        // Row format: A=Date, B=Invoice ID, C=Customer Name, D=Revenue Collected,
        // E=Attribution Type (formula), F=Direct Marketer, G=Months Active/Paid Month,
        // H=Paid Out?, I=Commission % (formula), J=Emma % (formula), K=Wyatt % (formula),
        // L=Commission Total (formula), M=Emma Commission (formula), N=Wyatt Commission (formula),
        // O=Payout Batch/Month, P=Notes, Q=Sales Rep, R=Sales Rep Rate (formula),
        // S=Sales Rep Paid Month Count (formula), T=Sales Commission (formula),
        // U=Commission Base Amount (formula)
        rowsToWrite.push([
          invoiceDate,                          // A Date
          month === 1 ? invoiceId : `${invoiceId}-m${month}`, // B Invoice ID
          customerName,                          // C Customer Name
          month === 1 ? amountPaid : 0,          // D Revenue Collected
          'UNASSIGNED',                          // E Attribution Type — you assign in app
          '',                                    // F Direct Marketer
          month,                                 // G Months Active / Paid Month
          '',                                    // H Paid Out?
          '',                                    // I Commission % — formula fills
          '',                                    // J Emma % — formula fills
          '',                                    // K Wyatt % — formula fills
          '',                                    // L Commission Total — formula fills
          '',                                    // M Emma Commission — formula fills
          '',                                    // N Wyatt Commission — formula fills
          '',                                    // O Payout Batch
          `Annual plan - month ${month} of 12`, // P Notes
          '',                                    // Q Sales Rep — you assign in app
          '',                                    // R Sales Rep Rate — formula fills
          '',                                    // S Sales Rep Paid Month Count — formula fills
          '',                                    // T Sales Commission — formula fills
          base,                                  // U Commission Base Amount
        ]);
      }
    } else {
      // Monthly plan — single row
      rowsToWrite.push([
        invoiceDate,    // A
        invoiceId,      // B
        customerName,   // C
        amountPaid,     // D
        'UNASSIGNED',   // E
        '',             // F
        1,              // G — will increment via formula once closer assigned
        '',             // H
        '',             // I
        '',             // J
        '',             // K
        '',             // L
        '',             // M
        '',             // N
        '',             // O
        '',             // P
        '',             // Q
        '',             // R
        '',             // S
        '',             // T
        base,           // U
      ]);
    }

    await appendLedgerRows(sheets, rowsToWrite);
    await upsertCustomer(sheets, { customerName, stripeCustomerId, plan: priceInfo?.plan || 'Unknown', closeDate: invoiceDate });

    console.log(`Wrote ${rowsToWrite.length} row(s) for invoice ${invoiceId}`);
    return res.status(200).json({ received: true, rows: rowsToWrite.length });

  } catch (err) {
    console.error('Webhook processing error:', err);
    return res.status(500).json({ error: err.message });
  }
}
