import { useMemo, useState } from 'react';
import { useTabData } from '../hooks/useSheetData.jsx';
import DrawerPanel from '../components/DrawerPanel.jsx';
import LoadingSpinner from '../components/LoadingSpinner.jsx';
import ErrorBanner from '../components/ErrorBanner.jsx';
import EmptyState from '../components/EmptyState.jsx';

const PEOPLE = [
  { name: 'Emma', role: 'Marketer' },
  { name: 'Wyatt', role: 'Marketer' },
  { name: 'ED', role: 'Sales' },
  { name: 'Micah', role: 'Sales' },
];

const PIN_MAP = {
  Emma: '3724',
  Wyatt: '2654',
  ED: '1876',
  Micah: '9789',
};

function parseMoney(value) {
  if (value === null || value === undefined || value === '') return 0;
  const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
  return Number.isFinite(num) ? num : 0;
}

function formatMoney(value) {
  return `$${Number(value || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function displayValue(value) {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}

function normalize(value) {
  return String(value ?? '').trim();
}

function normalizeLower(value) {
  return normalize(value).toLowerCase();
}

function pickFirst(row, keys) {
  for (const key of keys) {
    const value = row?.[key];
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      return value;
    }
  }
  return '';
}

function getCommissionAmountForPerson(row, personName) {
  if (personName === 'Emma') {
    return parseMoney(
      pickFirst(row, [
        'Emma Commission',
        'emma_amount',
        'Emma Amount',
        'marketer_a_amount',
        'Marketer A Amount',
      ])
    );
  }

  if (personName === 'Wyatt') {
    return parseMoney(
      pickFirst(row, [
        'Wyatt Commission',
        'wyatt_amount',
        'Wyatt Amount',
        'marketer_b_amount',
        'Marketer B Amount',
      ])
    );
  }

  if (personName === 'ED' || personName === 'Micah') {
    return parseMoney(
      pickFirst(row, [
        'Sales Commission',
        'sales_commission',
        'ed_amount',
        'ED Amount',
        'commission_amount',
        'Commission Amount',
      ])
    );
  }

  return 0;
}

function getRateForPerson(row, personName) {
  if (personName === 'ED' || personName === 'Micah') {
    const raw = parseMoney(
      pickFirst(row, ['Sales Rep Rate', 'sales_rep_rate', 'Sales Rate'])
    );
    return raw <= 1 ? raw * 100 : raw;
  }

  const raw = parseMoney(
    pickFirst(row, ['Commission %', 'commission_rate', 'Commission Rate'])
  );
  return raw <= 1 ? raw * 100 : raw;
}

function rowBelongsToPerson(row, personName) {
  if (personName === 'Emma') {
    return (
      normalizeLower(
        pickFirst(row, [
          'Direct Marketer',
          'direct_marketer',
          'Closer',
          'closer',
          'marketer',
        ])
      ) === 'emma'
    );
  }

  if (personName === 'Wyatt') {
    return (
      normalizeLower(
        pickFirst(row, [
          'Direct Marketer',
          'direct_marketer',
          'Closer',
          'closer',
          'marketer',
        ])
      ) === 'wyatt'
    );
  }

  if (personName === 'ED') {
    return (
      normalizeLower(
        pickFirst(row, [
          'Sales Rep',
          'sales_rep',
          'Salesperson',
          'salesperson',
          'Recipient',
          'recipient',
        ])
      ) === 'ed'
    );
  }

  if (personName === 'Micah') {
    return (
      normalizeLower(
        pickFirst(row, [
          'Sales Rep',
          'sales_rep',
          'Salesperson',
          'salesperson',
          'Recipient',
          'recipient',
        ])
      ) === 'micah'
    );
  }

  return false;
}

function isUnpaidRow(row) {
  const paidOut = normalizeLower(
    pickFirst(row, [
      'Paid Out?',
      'paid_out',
      'status',
      'Status',
      'payout_status',
      'Payout Status',
    ])
  );
  const payoutBatchId = normalize(
    pickFirst(row, [
      'Payout Batch / Month',
      'payout_batch_id',
      'Payout Batch ID',
      'batch_id',
      'Batch ID',
    ])
  );

  if (payoutBatchId) return false;

  return !(
    paidOut === 'yes' ||
    paidOut === 'paid' ||
    paidOut === 'paid_out' ||
    paidOut === 'completed'
  );
}

function getLastPayoutInfo(batches, personName) {
  const personBatches = (batches || []).filter((row) => {
    const owner = normalizeLower(
      pickFirst(row, [
        'Person',
        'person',
        'Marketer',
        'marketer',
        'Recipient',
        'recipient',
        'Payee',
        'payee',
      ])
    );
    return owner === normalizeLower(personName);
  });

  if (!personBatches.length) return null;

  const sorted = [...personBatches].sort((a, b) => {
    const aDate = String(
      pickFirst(a, ['Paid Date', 'paid_at', 'Payout Date', 'payout_date', 'Date', 'date']) || ''
    );
    const bDate = String(
      pickFirst(b, ['Paid Date', 'paid_at', 'Payout Date', 'payout_date', 'Date', 'date']) || ''
    );
    return bDate.localeCompare(aDate);
  });

  const latest = sorted[0];

  return {
    amount: parseMoney(
      pickFirst(latest, [
        'Amount Paid',
        'amount',
        'Payout Amount',
        'payout_amount',
        'Total Paid',
      ])
    ),
    date: pickFirst(latest, [
      'Paid Date',
      'paid_at',
      'Payout Date',
      'payout_date',
      'Date',
      'date',
    ]),
    batch: pickFirst(latest, [
      'Batch Label',
      'batch_label',
      'Payout Batch / Month',
      'payout_batch_id',
      'Batch ID',
    ]),
  };
}

function buildPersonSummary(ledgerRows, payoutRows, personName) {
  const ownedRows = (ledgerRows || []).filter((row) => rowBelongsToPerson(row, personName));

  const unpaidRows = ownedRows
    .filter(isUnpaidRow)
    .map((row) => ({
      ...row,
      __commissionAmount: getCommissionAmountForPerson(row, personName),
      __rate: getRateForPerson(row, personName),
      __customer: pickFirst(row, ['Customer', 'customer_name', 'Customer Name']),
      __plan: pickFirst(row, ['Plan', 'plan', 'Package']),
      __month: pickFirst(row, ['Month #', 'month_number', 'Months Active / Paid Month', 'Commission Month']),
      __invoice: pickFirst(row, ['Invoice ID', 'invoice_id', 'Invoice Number']),
    }))
    .filter((row) => row.__commissionAmount > 0);

  const unpaidTotal = unpaidRows.reduce((sum, row) => sum + row.__commissionAmount, 0);

  const groupedByPlan = unpaidRows.reduce((acc, row) => {
    const key = row.__plan || 'Unknown';
    acc[key] = (acc[key] || 0) + row.__commissionAmount;
    return acc;
  }, {});

  const planGroups = Object.entries(groupedByPlan)
    .map(([plan, total]) => ({ plan, total }))
    .sort((a, b) => b.total - a.total);

  return {
    personName,
    unpaidRows,
    unpaidTotal,
    planGroups,
    lastPayout: getLastPayoutInfo(payoutRows, personName),
  };
}

function LockCard({ person, pin, setPin, onUnlock, error }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#111111] p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{person.name}</h3>
        <p className="text-sm text-gray-400">{person.role} commission access</p>
      </div>

      <div className="space-y-3">
        <input
          type="password"
          inputMode="numeric"
          placeholder="Enter PIN"
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          className="w-full rounded-xl border border-white/10 bg-black px-4 py-3 text-white outline-none"
        />

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          onClick={onUnlock}
          className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
        >
          Unlock
        </button>
      </div>
    </div>
  );
}

function CommissionPanel({ summary, onClose }) {
  return (
    <DrawerPanel
      isOpen
      onClose={onClose}
      title={`${summary.personName} Commission Details`}
      description="Current unpaid commission only. Paid batches should stop counting after payout is logged."
    >
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-[#111111] p-5">
            <p className="text-xs uppercase tracking-wide text-gray-400">Current Unpaid</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {formatMoney(summary.unpaidTotal)}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111111] p-5">
            <p className="text-xs uppercase tracking-wide text-gray-400">Unpaid Items</p>
            <p className="mt-2 text-3xl font-semibold text-white">
              {summary.unpaidRows.length}
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#111111] p-5">
            <p className="text-xs uppercase tracking-wide text-gray-400">Last Payout</p>
            <p className="mt-2 text-2xl font-semibold text-white">
              {summary.lastPayout ? formatMoney(summary.lastPayout.amount) : '—'}
            </p>
            <p className="mt-1 text-sm text-gray-400">
              {summary.lastPayout ? displayValue(summary.lastPayout.date) : 'No payout logged'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111111] p-5">
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-300">
            Unpaid grouped by plan
          </h4>

          {summary.planGroups.length === 0 ? (
            <EmptyState
              title="No unpaid commission"
              description="That usually means payout rows were logged and current unpaid reset correctly."
            />
          ) : (
            <div className="space-y-3">
              {summary.planGroups.map((group) => (
                <div
                  key={group.plan}
                  className="flex items-center justify-between rounded-xl border border-white/10 bg-black px-4 py-3"
                >
                  <span className="text-sm text-gray-300">{group.plan}</span>
                  <span className="text-sm font-semibold text-white">
                    {formatMoney(group.total)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#111111] p-5">
          <h4 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-300">
            Current unpaid items
          </h4>

          {summary.unpaidRows.length === 0 ? (
            <EmptyState
              title="Nothing unpaid right now"
              description="After payout is logged, current unpaid should drop back to zero."
            />
          ) : (
            <div className="space-y-3">
              {summary.unpaidRows.map((row, index) => (
                <div
                  key={`${summary.personName}-${row.__invoice || index}`}
                  className="rounded-xl border border-white/10 bg-black p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-white">{displayValue(row.__customer)}</p>
                      <p className="text-sm text-gray-400">
                        {displayValue(row.__plan)} • Month {displayValue(row.__month)}
                      </p>
                      <p className="text-xs text-gray-500">
                        Invoice: {displayValue(row.__invoice)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="font-semibold text-white">
                        {formatMoney(row.__commissionAmount)}
                      </p>
                      <p className="text-xs text-gray-400">{displayValue(row.__rate)}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DrawerPanel>
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

  const [pins, setPins] = useState({
    Emma: '',
    Wyatt: '',
    ED: '',
    Micah: '',
  });

  const [errors, setErrors] = useState({
    Emma: '',
    Wyatt: '',
    ED: '',
    Micah: '',
  });

  const [openPerson, setOpenPerson] = useState(null);

  const summaries = useMemo(() => {
    return {
      Emma: buildPersonSummary(ledgerRows, payoutRows, 'Emma'),
      Wyatt: buildPersonSummary(ledgerRows, payoutRows, 'Wyatt'),
      ED: buildPersonSummary(ledgerRows, payoutRows, 'ED'),
      Micah: buildPersonSummary(ledgerRows, payoutRows, 'Micah'),
    };
  }, [ledgerRows, payoutRows]);

  const loading = ledgerLoading || payoutLoading;
  const error = ledgerError || payoutError;

  function handleUnlock(personName) {
    if (pins[personName] !== PIN_MAP[personName]) {
      setErrors((prev) => ({ ...prev, [personName]: 'Incorrect PIN' }));
      return;
    }

    setErrors((prev) => ({ ...prev, [personName]: '' }));
    setOpenPerson(personName);
  }

  function handleClosePanel() {
    setOpenPerson(null);
    setPins({
      Emma: '',
      Wyatt: '',
      ED: '',
      Micah: '',
    });
    setErrors({
      Emma: '',
      Wyatt: '',
      ED: '',
      Micah: '',
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Marketer Commissions</h1>
        <p className="mt-2 text-sm text-gray-400">
          Private commission access for Emma, Wyatt, ED, and Micah. Current unpaid resets after payout is logged in the sheet.
        </p>
      </div>

      {loading ? <LoadingSpinner label="Loading commission data..." /> : null}

      {error ? (
        <ErrorBanner message="Failed to load Commission_Ledger or PAYOUT_BATCHES. Check your Google Sheet tab names and publishing." />
      ) : null}

      {!loading && !error ? (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PEOPLE.map((person) => (
            <LockCard
              key={person.name}
              person={person}
              pin={pins[person.name]}
              setPin={(value) => setPins((prev) => ({ ...prev, [person.name]: value }))}
              error={errors[person.name]}
              onUnlock={() => handleUnlock(person.name)}
            />
          ))}
        </div>
      ) : null}

      {openPerson ? (
        <CommissionPanel summary={summaries[openPerson]} onClose={handleClosePanel} />
      ) : null}
    </div>
  );
}
