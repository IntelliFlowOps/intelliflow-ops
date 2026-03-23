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
];

const PIN_MAP = {
  Emma: '3724',
  Wyatt: '2654',
  ED: '1876',
};

const PAYOUT_WEBHOOK_URL =
  'https://script.google.com/macros/s/AKfycbwMpHfBcGwjk1doLDuRLRCuLpmlFZyZFdTUc4CHBLSOY-yvtKN2yxGkySEkubnJr6_9/exec';

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

function getCommissionAmountForPerson(row, personName) {
  if (personName === 'Emma') return parseMoney(row['Emma Commission']);
  if (personName === 'Wyatt') return parseMoney(row['Wyatt Commission']);
  if (personName === 'ED') return parseMoney(row['Sales Commission']);
  return 0;
}

function getRateForPerson(row, personName) {
  if (personName === 'ED') return parseMoney(row['Sales Rep Rate']) * 100;
  return parseMoney(row['Commission %']) * 100;
}

function rowBelongsToPerson(row, personName) {
  if (personName === 'Emma') return row['Direct Marketer'] === 'Emma';
  if (personName === 'Wyatt') return row['Direct Marketer'] === 'Wyatt';
  if (personName === 'ED') return row['Sales Rep'] === 'ED';
  return false;
}

function isUnpaidRow(row) {
  return String(row['Paid Out?'] || '').trim().toLowerCase() !== 'yes';
}

function getLastPayoutInfo(batches, personName) {
  const personBatches = (batches || []).filter(
    (row) => String(row['Person'] || '').trim() === personName && row['Paid Date']
  );
  if (!personBatches.length) return null;

  const sorted = [...personBatches].sort((a, b) =>
    String(b['Paid Date']).localeCompare(String(a['Paid Date']))
  );

  return sorted[0];
}

function inferPlanName(row) {
  const base = parseMoney(row['Commission Base Amount']);
  if (base === 299) return 'Starter';
  if (base === 499) return 'Pro';
  if (base === 999) return 'Premium';
  return 'Enterprise / Custom';
}

function buildExplanation(row, personName) {
  const base = parseMoney(row['Commission Base Amount']);
  const rate = getRateForPerson(row, personName);
  const commission = getCommissionAmountForPerson(row, personName);
  const monthNumber = displayValue(row['Months Active / Paid Month']);

  if (personName === 'ED') {
    return `${formatMoney(base)} monthly base × ${rate.toFixed(0)}% = ${formatMoney(commission)} for month ${monthNumber} of 6 eligible months.`;
  }

  return `${formatMoney(base)} monthly base × ${rate.toFixed(0)}% = ${formatMoney(commission)} for month ${monthNumber}.`;
}

function LockedCard({ person, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card w-full p-5 text-left transition hover:border-white/20 hover:bg-white/[0.07]"
    >
      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
        {person.role}
      </div>
      <div className="mt-2 text-2xl font-semibold text-zinc-100">
        {person.name}
      </div>
      <div className="mt-5 flex items-center justify-between">
        <div className="text-sm text-zinc-400">Commission Access</div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-sm text-zinc-300">
          🔒 Locked
        </div>
      </div>
    </button>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="grid grid-cols-[180px_1fr] gap-3 border-b border-white/5 py-2 last:border-b-0">
      <div className="text-sm text-zinc-500">{label}</div>
      <div className="text-sm text-zinc-200">{displayValue(value)}</div>
    </div>
  );
}

function PlanGroup({ planName, rows, selectedPerson }) {
  const total = rows.reduce(
    (sum, row) => sum + getCommissionAmountForPerson(row, selectedPerson.name),
    0
  );

  return (
    <section className="space-y-3">
      <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
              {planName}
            </div>
            <div className="mt-1 text-lg font-semibold text-zinc-100">
              {rows.length} unpaid {rows.length === 1 ? 'client' : 'clients'}
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
              Plan Total
            </div>
            <div className="text-xl font-semibold text-emerald-400">
              {formatMoney(total)}
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row, index) => {
          const commissionAmount = getCommissionAmountForPerson(row, selectedPerson.name);
          const base = parseMoney(row['Commission Base Amount']);
          const rate = getRateForPerson(row, selectedPerson.name);

          return (
            <div
              key={`${planName}-${row['Customer Name'] || 'row'}-${row['Date'] || index}-${index}`}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="text-base font-medium text-zinc-100">
                    {displayValue(row['Customer Name'])}
                  </div>
                  <div className="text-sm text-zinc-500">
                    Invoice Date: {displayValue(row['Date'])}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs uppercase tracking-[0.16em] text-zinc-500">
                    This Client Pays You
                  </div>
                  <div className="text-lg font-semibold text-emerald-400">
                    {formatMoney(commissionAmount)}
                  </div>
                </div>
              </div>

              <div className="mt-4 rounded-xl border border-white/5 bg-black/10 p-3 text-sm text-zinc-300">
                {buildExplanation(row, selectedPerson.name)}
              </div>

              <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                <DetailRow label="Plan" value={`${planName} (${formatMoney(base)})`} />
                <DetailRow label="Your Rate" value={`${rate.toFixed(0)}%`} />
                <DetailRow label="Month Number" value={row['Months Active / Paid Month']} />
                <DetailRow label="Revenue Collected" value={row['Revenue Collected']} />
                <DetailRow label="Payout Status" value={row['Paid Out?'] || 'Included in current unpaid total'} />
                <DetailRow label="Batch / Period" value={row['Payout Batch / Month']} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function MarketersPage() {
  const {
    rows: ledgerRows,
    loading: ledgerLoading,
    error: ledgerError,
  } = useTabData('COMMISSION_LEDGER');

  const {
    rows: payoutRows,
    loading: payoutLoading,
    error: payoutError,
  } = useTabData('PAYOUT_BATCHES');

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState('');
  const [isPayingOut, setIsPayingOut] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState('');

  const loading = ledgerLoading || payoutLoading;
  const error = ledgerError || payoutError;

  const personRows = useMemo(() => {
    if (!selectedPerson || !ledgerRows) return [];
    return ledgerRows.filter((row) => rowBelongsToPerson(row, selectedPerson.name));
  }, [ledgerRows, selectedPerson]);

  const unpaidRows = useMemo(() => {
    return personRows.filter((row) => isUnpaidRow(row));
  }, [personRows]);

  const currentTotal = useMemo(() => {
    if (!selectedPerson) return 0;
    return unpaidRows.reduce(
      (sum, row) => sum + getCommissionAmountForPerson(row, selectedPerson.name),
      0
    );
  }, [unpaidRows, selectedPerson]);

  const lastPayout = useMemo(() => {
    if (!selectedPerson) return null;
    return getLastPayoutInfo(payoutRows, selectedPerson.name);
  }, [payoutRows, selectedPerson]);

  const summaryStats = useMemo(() => {
    if (!selectedPerson) return null;

    const unpaidClients = new Set(
      unpaidRows.map((row) => row['Customer Name']).filter(Boolean)
    );

    return {
      unpaidInvoices: unpaidRows.length,
      unpaidClients: unpaidClients.size,
    };
  }, [unpaidRows, selectedPerson]);

  const groupedRows = useMemo(() => {
    const groups = {
      Starter: [],
      Pro: [],
      Premium: [],
      'Enterprise / Custom': [],
    };

    unpaidRows.forEach((row) => {
      const plan = inferPlanName(row);
      if (!groups[plan]) groups[plan] = [];
      groups[plan].push(row);
    });

    return groups;
  }, [unpaidRows]);

  function openLock(person) {
    setSelectedPerson(person);
    setIsUnlocked(false);
    setPinInput('');
    setPinError('');
    setPayoutMessage('');
  }

  function closeDrawer() {
    setSelectedPerson(null);
    setIsUnlocked(false);
    setPinInput('');
    setPinError('');
    setPayoutMessage('');
  }

  function handleUnlock() {
    if (!selectedPerson) return;

    const correctPin = PIN_MAP[selectedPerson.name];
    const enteredPin = String(pinInput ?? '').trim();

    if (!correctPin) {
      setPinError('PIN not configured.');
      return;
    }

    if (enteredPin !== correctPin) {
      setPinError('Incorrect PIN.');
      return;
    }

    setPinError('');
    setPayoutMessage('');
    setIsUnlocked(true);
  }

  async function handleMarkPaidOut() {
    if (!selectedPerson || unpaidRows.length === 0 || isPayingOut) return;

    const confirmed = window.confirm(
      `Mark all current unpaid ${selectedPerson.name} commission rows as paid out?`
    );

    if (!confirmed) return;

    setIsPayingOut(true);
    setPayoutMessage('');

    try {
      const response = await fetch(PAYOUT_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ person: selectedPerson.name }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Payout failed.');
      }

      setPayoutMessage(
        `Paid out ${selectedPerson.name}: ${formatMoney(result.totalPaid)} across ${result.updatedRows} row(s).`
      );

      // Immediately clear current UI state so totals drop to zero without refresh
      setSelectedPerson((prev) => prev ? { ...prev } : prev);

      // Re-lock after payout so next view re-reads current state naturally
      setTimeout(() => {
        closeDrawer();
        window.location.reload();
      }, 1200);
    } catch (err) {
      setPayoutMessage(`Payout failed: ${err.message}`);
    } finally {
      setIsPayingOut(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorBanner message={error} />;
  if (!ledgerRows || ledgerRows.length === 0) {
    return <EmptyState message="No commission data loaded yet" />;
  }

  return (
    <div className="space-y-6 fade-in">
      <div className="space-y-1">
        <p className="text-sm text-zinc-500">
          Private commission access for Emma, Wyatt, and ED. Cards stay locked until the correct PIN is entered.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {PEOPLE.map((person) => (
          <LockedCard
            key={person.name}
            person={person}
            onClick={() => openLock(person)}
          />
        ))}
      </div>

      <DrawerPanel
        open={!!selectedPerson}
        onClose={closeDrawer}
        title={
          selectedPerson
            ? isUnlocked
              ? `${selectedPerson.name} Commission`
              : `Unlock ${selectedPerson.name}`
            : 'Commission Access'
        }
      >
        {!selectedPerson ? null : !isUnlocked ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-sm text-zinc-400">
                Enter the PIN for {selectedPerson.name} to view current unpaid commissions and payout details.
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-sm text-zinc-400">PIN</label>
              <input
                type="password"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-white/20"
                placeholder="Enter PIN"
              />
              {pinError ? <p className="text-sm text-red-400">{pinError}</p> : null}

              <button
                type="button"
                onClick={handleUnlock}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
              >
                Unlock
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <section className="grid grid-cols-1 gap-3 md:grid-cols-4">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Current Unpaid</div>
                <div className="mt-2 text-2xl font-semibold text-emerald-400">
                  {formatMoney(currentTotal)}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Unpaid Invoices</div>
                <div className="mt-2 text-2xl font-semibold text-zinc-100">
                  {summaryStats?.unpaidInvoices ?? 0}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Unpaid Clients</div>
                <div className="mt-2 text-2xl font-semibold text-zinc-100">
                  {summaryStats?.unpaidClients ?? 0}
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">Last Paid</div>
                <div className="mt-2 text-lg font-semibold text-zinc-100">
                  {displayValue(lastPayout?.['Paid Date'])}
                </div>
              </div>
            </section>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleMarkPaidOut}
                disabled={isPayingOut || unpaidRows.length === 0}
                className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPayingOut ? 'Marking Paid...' : 'Mark Paid Out'}
              </button>

              {payoutMessage ? (
                <p className="text-sm text-zinc-300">{payoutMessage}</p>
              ) : null}
            </div>

            <section className="space-y-2">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                Latest Payout Info
              </h3>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <DetailRow label="Batch ID" value={lastPayout?.['Batch ID']} />
                <DetailRow label="Total Paid" value={lastPayout?.['Total Paid']} />
                <DetailRow label="Period Start" value={lastPayout?.['Period Start']} />
                <DetailRow label="Period End" value={lastPayout?.['Period End']} />
                <DetailRow label="Method" value={lastPayout?.['Method']} />
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-400">
                How Your Current Total Is Calculated
              </h3>

              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-300">
                Your current unpaid total is the sum of all unpaid commission rows assigned to you. They are grouped below by plan so you can quickly verify where your number comes from.
              </div>
            </section>

            <div className="space-y-6">
              {Object.entries(groupedRows)
                .filter(([, rows]) => rows.length > 0)
                .map(([planName, rows]) => (
                  <PlanGroup
                    key={planName}
                    planName={planName}
                    rows={rows}
                    selectedPerson={selectedPerson}
                  />
                ))}

              {unpaidRows.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-400">
                  No unpaid commission rows right now.
                </div>
              ) : null}
            </div>
          </div>
        )}
      </DrawerPanel>
    </div>
  );
}
