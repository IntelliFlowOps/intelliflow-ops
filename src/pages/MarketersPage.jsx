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
  const personBatches = (batches || []).filter((row) => row['Person'] === personName && row['Paid Date']);
  if (!personBatches.length) return null;

  const sorted = [...personBatches].sort((a, b) =>
    String(b['Paid Date']).localeCompare(String(a['Paid Date']))
  );

  return sorted[0];
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

export default function MarketersPage() {
  const { rows: ledgerRows, loading: ledgerLoading, error: ledgerError } = useTabData('COMMISSION_LEDGER');
  const { rows: accessRows, loading: accessLoading, error: accessError } = useTabData('COMMISSION_ACCESS');
  const { rows: payoutRows, loading: payoutLoading, error: payoutError } = useTabData('PAYOUT_BATCHES');

  const [selectedPerson, setSelectedPerson] = useState(null);
  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState('');

  const loading = ledgerLoading || accessLoading || payoutLoading;
  const error = ledgerError || accessError || payoutError;

  const accessMap = useMemo(() => {
    const map = new Map();
    (accessRows || []).forEach((row) => {
      if (row.Person) map.set(row.Person, row);
    });
    return map;
  }, [accessRows]);

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

    const allClients = new Set(
      personRows
        .map((row) => row['Customer Name'])
        .filter(Boolean)
    );

    const unpaidClients = new Set(
      unpaidRows
        .map((row) => row['Customer Name'])
        .filter(Boolean)
    );

    return {
      unpaidInvoices: unpaidRows.length,
      unpaidClients: unpaidClients.size,
      totalClients: allClients.size,
    };
  }, [personRows, unpaidRows, selectedPerson]);

  function openLock(person) {
    setSelectedPerson(person);
    setIsUnlocked(false);
    setPinInput('');
    setPinError('');
  }

  function closeDrawer() {
    setSelectedPerson(null);
    setIsUnlocked(false);
    setPinInput('');
    setPinError('');
  }

  function handleUnlock() {
    if (!selectedPerson) return;
    const accessRow = accessMap.get(selectedPerson.name);
    const correctPin = String(accessRow?.PIN || '').trim();
    const enteredPin = String(pinInput || '').trim();

    if (!correctPin) {
      setPinError('PIN not set in COMMISSION_ACCESS yet.');
      return;
    }

    if (enteredPin !== correctPin) {
      setPinError('Incorrect PIN.');
      return;
    }

    setPinError('');
    setIsUnlocked(true);
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
                Enter the PIN for {selectedPerson.name} to view current unpaid commissions and invoice breakdown.
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
              {pinError ? (
                <p className="text-sm text-red-400">{pinError}</p>
              ) : null}

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
                Unpaid Commission Breakdown
              </h3>

              {unpaidRows.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm text-zinc-400">
                  No unpaid commission rows right now.
                </div>
              ) : (
                <div className="space-y-3">
                  {unpaidRows.map((row, index) => {
                    const commissionAmount = getCommissionAmountForPerson(row, selectedPerson.name);
                    const commissionPercent =
                      selectedPerson.name === 'ED'
                        ? row['Sales Rep Rate']
                        : row['Commission %'];

                    return (
                      <div
                        key={`${row['Customer Name'] || 'row'}-${row['Date'] || index}-${index}`}
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
                              Current Row Commission
                            </div>
                            <div className="text-lg font-semibold text-emerald-400">
                              {formatMoney(commissionAmount)}
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
                          <DetailRow label="Revenue Collected" value={row['Revenue Collected']} />
                          <DetailRow label="Commission Base Amount" value={row['Commission Base Amount']} />
                          <DetailRow label="Commission %" value={commissionPercent} />
                          <DetailRow label="Attribution Type" value={row['Attribution Type']} />
                          <DetailRow label="Months Active / Paid Month" value={row['Months Active / Paid Month']} />
                          <DetailRow label="Payout Batch / Month" value={row['Payout Batch / Month']} />
                          <DetailRow label="Paid Out?" value={row['Paid Out?']} />
                          <DetailRow label="Notes" value={row['Notes']} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </DrawerPanel>
    </div>
  );
}
