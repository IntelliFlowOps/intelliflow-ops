import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  X,
  Shield,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock3,
  Receipt,
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import PageHeader from '../components/ui/PageHeader';
import EmptyState from '../components/ui/EmptyState';
import { useTabData } from '../hooks/useSheetData';

const MARKETER_PINS = {
  Emma: '3724',
  Wyatt: '2654',
  ED: '1876',
};

const MARKETER_LABELS = ['Emma', 'Wyatt', 'ED'];

function normalize(value) {
  return String(value ?? '').trim();
}

function normalizeLower(value) {
  return normalize(value).toLowerCase();
}

function money(value) {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(num);
}

function formatDate(value) {
  const raw = normalize(value);
  if (!raw) return '—';

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(parsed);
}

function parseAmount(row, keys) {
  for (const key of keys) {
    if (row[key] == null || row[key] === '') continue;
    const num = Number(String(row[key]).replace(/[^0-9.-]/g, ''));
    if (!Number.isNaN(num)) return num;
  }
  return 0;
}

function pickValue(row, keys) {
  for (const key of keys) {
    const value = row[key];
    if (value != null && String(value).trim() !== '') return String(value).trim();
  }
  return '';
}

function isPaidLedgerRow(row) {
  const status = normalizeLower(
    pickValue(row, ['status', 'Status', 'payout_status', 'Payout Status'])
  );

  const payoutBatchId = normalize(
    pickValue(row, ['payout_batch_id', 'Payout Batch ID', 'batch_id', 'Batch ID'])
  );

  return (
    status === 'paid' ||
    status === 'paid_out' ||
    status === 'payout complete' ||
    status === 'completed' ||
    Boolean(payoutBatchId)
  );
}

function getLedgerOwner(row) {
  const explicitOwner = pickValue(row, [
    'marketer',
    'Marketer',
    'owner',
    'Owner',
    'salesperson',
    'Salesperson',
    'closer',
    'Closer',
    'recipient',
    'Recipient',
    'payee',
    'Payee',
  ]);

  if (explicitOwner) return explicitOwner;

  const marketerName = pickValue(row, [
    'marketer_name',
    'Marketer Name',
    'salesperson_name',
    'Salesperson Name',
    'closer_name',
    'Closer Name',
  ]);

  if (marketerName) return marketerName;

  return '';
}

function getLedgerCommissionAmount(row, marketerName) {
  const owner = getLedgerOwner(row);
  if (normalizeLower(owner) === normalizeLower(marketerName)) {
    return parseAmount(row, [
      'commission_amount',
      'Commission Amount',
      'commission',
      'Commission',
      'amount',
      'Amount',
      'unpaid_commission',
      'Unpaid Commission',
    ]);
  }

  const marketerLower = normalizeLower(marketerName);

  if (marketerLower === 'emma') {
    return parseAmount(row, ['emma_amount', 'Emma Amount', 'marketer_a_amount', 'Marketer A Amount']);
  }

  if (marketerLower === 'wyatt') {
    return parseAmount(row, ['wyatt_amount', 'Wyatt Amount', 'marketer_b_amount', 'Marketer B Amount']);
  }

  if (marketerLower === 'ed') {
    return parseAmount(row, ['ed_amount', 'ED Amount']);
  }

  return 0;
}

function getPayoutOwner(row) {
  return pickValue(row, [
    'marketer',
    'Marketer',
    'recipient',
    'Recipient',
    'payee',
    'Payee',
    'salesperson',
    'Salesperson',
    'closer',
    'Closer',
  ]);
}

function getPayoutAmount(row) {
  return parseAmount(row, [
    'amount',
    'Amount',
    'payout_amount',
    'Payout Amount',
    'total_paid',
    'Total Paid',
    'paid_amount',
    'Paid Amount',
  ]);
}

function getPayoutDate(row) {
  return pickValue(row, [
    'paid_at',
    'Paid At',
    'payout_date',
    'Payout Date',
    'date',
    'Date',
    'created_at',
    'Created At',
  ]);
}

function buildMarketerSummary(ledgerRows, payoutRows, marketerName) {
  const ownedLedgerRows = ledgerRows
    .map((row) => {
      const commissionAmount = getLedgerCommissionAmount(row, marketerName);
      return {
        ...row,
        __commissionAmount: commissionAmount,
      };
    })
    .filter((row) => row.__commissionAmount > 0);

  const unpaidRows = ownedLedgerRows.filter((row) => !isPaidLedgerRow(row));
  const paidRows = ownedLedgerRows.filter((row) => isPaidLedgerRow(row));

  const unpaidTotal = unpaidRows.reduce((sum, row) => sum + row.__commissionAmount, 0);
  const lifetimeTotal = ownedLedgerRows.reduce((sum, row) => sum + row.__commissionAmount, 0);

  const planBuckets = unpaidRows.reduce((acc, row) => {
    const plan = pickValue(row, ['plan', 'Plan', 'package', 'Package', 'tier', 'Tier']) || 'Unknown';
    acc[plan] = (acc[plan] || 0) + row.__commissionAmount;
    return acc;
  }, {});

  const payoutHistory = payoutRows
    .filter((row) => normalizeLower(getPayoutOwner(row)) === normalizeLower(marketerName))
    .map((row, index) => ({
      id:
        pickValue(row, ['batch_id', 'Batch ID', 'id', 'ID']) ||
        `${marketerName}-${index}-${getPayoutDate(row)}`,
      amount: getPayoutAmount(row),
      date: getPayoutDate(row),
      note: pickValue(row, ['note', 'Note', 'description', 'Description']),
    }))
    .filter((row) => row.amount > 0)
    .sort((a, b) => {
      const aTime = new Date(a.date).getTime();
      const bTime = new Date(b.date).getTime();
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    });

  return {
    marketerName,
    unpaidTotal,
    lifetimeTotal,
    unpaidCount: unpaidRows.length,
    paidCount: paidRows.length,
    planBuckets: Object.entries(planBuckets)
      .map(([plan, amount]) => ({ plan, amount }))
      .sort((a, b) => b.amount - a.amount),
    unpaidRows: unpaidRows.sort((a, b) => {
      const aTime = new Date(pickValue(a, ['paid_at', 'Paid At', 'date', 'Date'])).getTime();
      const bTime = new Date(pickValue(b, ['paid_at', 'Paid At', 'date', 'Date'])).getTime();
      return (Number.isNaN(bTime) ? 0 : bTime) - (Number.isNaN(aTime) ? 0 : aTime);
    }),
    payoutHistory,
  };
}

function LockedCard({ marketerName, onUnlock, pinInput, setPinInput, error }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
      <div className="mb-5 flex items-center gap-3">
        <div className="rounded-xl bg-white/10 p-3">
          <Lock className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">{marketerName} Commission Card</h3>
          <p className="text-sm text-slate-400">Locked private payout view</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-200">
          Enter {marketerName}&apos;s PIN to view current unpaid commission and payout history.
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-300">PIN</label>
          <input
            type="password"
            inputMode="numeric"
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value)}
            placeholder="Enter PIN"
            className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-white outline-none transition focus:border-emerald-400"
          />
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          onClick={onUnlock}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
        >
          <Shield className="h-4 w-4" />
          Unlock
        </button>
      </div>
    </div>
  );
}

function UnlockedCard({ summary, onClose }) {
  const latestPayout = summary.payoutHistory[0];

  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 10, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 8, scale: 0.985 }}
        transition={{ duration: 0.2 }}
        className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-slate-900 to-slate-950 p-6 shadow-[0_0_0_1px_rgba(16,185,129,0.08)]"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
              <Shield className="h-3.5 w-3.5" />
              Private commission view
            </div>
            <h3 className="text-xl font-semibold text-white">{summary.marketerName}</h3>
            <p className="mt-1 text-sm text-slate-400">
              Current unpaid total only. Paid items are excluded after payout.
            </p>
          </div>

          <button
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 transition hover:bg-white/10"
          >
            <X className="h-4 w-4" />
            Close
          </button>
        </div>

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <StatCard
            title="Current Unpaid"
            value={money(summary.unpaidTotal)}
            subtitle={`${summary.unpaidCount} unpaid item${summary.unpaidCount === 1 ? '' : 's'}`}
            icon={DollarSign}
            variant="success"
          />
          <StatCard
            title="Paid Items Logged"
            value={String(summary.paidCount)}
            subtitle="Already cleared from current unpaid"
            icon={CheckCircle2}
            variant="info"
          />
          <StatCard
            title="Latest Payout"
            value={latestPayout ? money(latestPayout.amount) : '$0.00'}
            subtitle={latestPayout ? formatDate(latestPayout.date) : 'No payout logged yet'}
            icon={Calendar}
            variant="warning"
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Receipt className="h-4 w-4 text-emerald-300" />
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                  Unpaid by plan
                </h4>
              </div>

              {summary.planBuckets.length ? (
                <div className="space-y-3">
                  {summary.planBuckets.map((item) => (
                    <div
                      key={item.plan}
                      className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/40 px-4 py-3"
                    >
                      <span className="text-sm text-slate-300">{item.plan}</span>
                      <span className="text-sm font-semibold text-white">{money(item.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No unpaid commission"
                  description="Once payout is recorded in the sheet, current unpaid drops back to zero."
                />
              )}
            </section>

            <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-emerald-300" />
                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                  Current unpaid items
                </h4>
              </div>

              {summary.unpaidRows.length ? (
                <div className="space-y-3">
                  {summary.unpaidRows.slice(0, 12).map((row, index) => {
                    const customer = pickValue(row, ['customer_name', 'Customer Name', 'customer', 'Customer']) || 'Unknown Customer';
                    const plan = pickValue(row, ['plan', 'Plan', 'package', 'Package', 'tier', 'Tier']) || 'Unknown';
                    const date = pickValue(row, ['paid_at', 'Paid At', 'date', 'Date']);
                    const invoice = pickValue(row, ['invoice_number', 'Invoice Number', 'invoice', 'Invoice']);

                    return (
                      <div
                        key={`${customer}-${invoice || index}`}
                        className="rounded-xl border border-white/10 bg-slate-950/40 p-4"
                      >
                        <div className="mb-2 flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium text-white">{customer}</p>
                            <p className="text-sm text-slate-400">
                              {plan}
                              {invoice ? ` • Invoice ${invoice}` : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-emerald-300">
                              {money(row.__commissionAmount)}
                            </p>
                            <p className="text-xs text-slate-500">{formatDate(date)}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <EmptyState
                  title="Nothing unpaid right now"
                  description="That is expected after a payout batch is logged and linked to paid items."
                />
              )}
            </section>
          </div>

          <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <div className="mb-4 flex items-center gap-2">
              <Calendar className="h-4 w-4 text-emerald-300" />
              <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-300">
                Payout history
              </h4>
            </div>

            {summary.payoutHistory.length ? (
              <div className="space-y-3">
                {summary.payoutHistory.slice(0, 12).map((payout) => (
                  <div
                    key={payout.id}
                    className="rounded-xl border border-white/10 bg-slate-950/40 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium text-white">{formatDate(payout.date)}</p>
                        <p className="text-sm text-slate-400">
                          {payout.note || 'Payout batch recorded in sheet'}
                        </p>
                      </div>
                      <span className="font-semibold text-emerald-300">
                        {money(payout.amount)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No payout history found"
                description="This card will populate once your payout batch rows are being written correctly."
              />
            )}
          </section>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function MarketersPage() {
  const {
    data: ledgerRows = [],
    loading: ledgerLoading,
    error: ledgerError,
  } = useTabData('COMMISSION_LEDGER');

  const {
    data: payoutRows = [],
    loading: payoutLoading,
    error: payoutError,
  } = useTabData('PAYOUT_BATCHES');

  const [activeUnlocked, setActiveUnlocked] = useState(null);
  const [pinInputs, setPinInputs] = useState({
    Emma: '',
    Wyatt: '',
    ED: '',
  });
  const [pinErrors, setPinErrors] = useState({
    Emma: '',
    Wyatt: '',
    ED: '',
  });

  const summaries = useMemo(() => {
    return {
      Emma: buildMarketerSummary(ledgerRows, payoutRows, 'Emma'),
      Wyatt: buildMarketerSummary(ledgerRows, payoutRows, 'Wyatt'),
      ED: buildMarketerSummary(ledgerRows, payoutRows, 'ED'),
    };
  }, [ledgerRows, payoutRows]);

  useEffect(() => {
    if (!activeUnlocked) return;
    return () => setActiveUnlocked(null);
  }, [activeUnlocked]);

  const isLoading = ledgerLoading || payoutLoading;
  const error = ledgerError || payoutError;

  function handleUnlock(marketerName) {
    const entered = normalize(pinInputs[marketerName]);
    const expected = MARKETER_PINS[marketerName];

    if (entered !== expected) {
      setPinErrors((prev) => ({
        ...prev,
        [marketerName]: 'Incorrect PIN',
      }));
      return;
    }

    setPinErrors((prev) => ({
      ...prev,
      [marketerName]: '',
    }));

    setActiveUnlocked(marketerName);
  }

  function handleClose() {
    setActiveUnlocked(null);
    setPinInputs({
      Emma: '',
      Wyatt: '',
      ED: '',
    });
    setPinErrors({
      Emma: '',
      Wyatt: '',
      ED: '',
    });
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Marketer Commissions"
        description="Private commission cards for Emma, Wyatt, and ED. Current unpaid totals come from commission ledger rows not yet marked as paid."
      />

      <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
        This page assumes your sheet is the source of truth. Unpaid commission is pulled from
        <span className="font-semibold text-amber-100"> Commission_Ledger </span>
        rows that are not marked paid. Payout history is pulled from
        <span className="font-semibold text-amber-100"> PAYOUT_BATCHES</span>.
      </div>

      {isLoading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-slate-300">
          Loading commission data...
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6 text-red-200">
          Failed to load marketer commission data. Check that Commission_Ledger and PAYOUT_BATCHES
          both exist and are published correctly from Google Sheets.
        </div>
      ) : null}

      {!isLoading && !error ? (
        <div className="grid gap-6 xl:grid-cols-3">
          {MARKETER_LABELS.map((marketerName) => {
            const isUnlocked = activeUnlocked === marketerName;
            const summary = summaries[marketerName];

            return (
              <div key={marketerName}>
                {isUnlocked ? (
                  <UnlockedCard summary={summary} onClose={handleClose} />
                ) : (
                  <LockedCard
                    marketerName={marketerName}
                    pinInput={pinInputs[marketerName]}
                    setPinInput={(value) =>
                      setPinInputs((prev) => ({
                        ...prev,
                        [marketerName]: value,
                      }))
                    }
                    error={pinErrors[marketerName]}
                    onUnlock={() => handleUnlock(marketerName)}
                  />
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
