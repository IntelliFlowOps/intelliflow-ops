import { useMemo, useState } from "react";
import { useTabData } from "../hooks/useSheetData.jsx";
import DrawerPanel from "../components/DrawerPanel.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";
import ErrorBanner from "../components/ErrorBanner.jsx";
import EmptyState from "../components/EmptyState.jsx";

const PEOPLE = [
  { name: "Emma", role: "Marketer" },
  { name: "Wyatt", role: "Marketer" },
  { name: "ED", role: "Sales" },
  { name: "Micah", role: "Sales" },
];

const PIN_MAP = {
  Emma: "3724",
  Wyatt: "2654",
  ED: "1876",
  Micah: "9789",
};

const money = (v) =>
  parseFloat(String(v ?? "").replace(/[^0-9.-]/g, "")) || 0;

const fmt = (v) =>
  `$${Number(v || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

function belongs(row, person) {
  if (person === "Emma" || person === "Wyatt") {
    return String(row["Direct Marketer"] || "").trim() === person;
  }

  if (person === "ED" || person === "Micah") {
    return String(row["Sales Rep"] || "").trim() === person;
  }

  return false;
}

function unpaid(row) {
  if (row["_isPaidOut"]) return false;
  if (String(row["Payout Batch / Month"] || "").trim()) return false;
  return true;
}

function commission(row, person) {
  if (person === "Emma") return money(row["Emma Commission"]);
  if (person === "Wyatt") return money(row["Wyatt Commission"]);
  if (person === "ED" || person === "Micah") return money(row["Sales Commission"]);
  return 0;
}

function base(row) {
  return money(row["Commission Base Amount"]);
}

function rate(row, person) {
  if (person === "ED" || person === "Micah") {
    const r = money(row["Sales Rep Rate"]);
    return r <= 1 ? r * 100 : r;
  }

  const r = money(row["Commission %"]);
  return r <= 1 ? r * 100 : r;
}

function plan(row) {
  const b = base(row);
  if (b === 299) return "Starter";
  if (b === 499) return "Pro";
  if (b === 999) return "Premium";
  return "Enterprise";
}

function explanation(row, person) {
  const customer = row["Customer Name"] || "Unknown Customer";
  return `${customer} → ${fmt(base(row))} × ${rate(row, person)}% = ${fmt(
    commission(row, person)
  )}`;
}

function summary(rows, person) {
  const owned = rows.filter((r) => belongs(r, person));

  const unpaidRows = owned
    .filter(unpaid)
    .map((r) => ({
      amount: commission(r, person),
      plan: plan(r),
      note: explanation(r, person),
    }))
    .filter((r) => r.amount > 0);

  const total = unpaidRows.reduce((a, b) => a + b.amount, 0);

  const grouped = unpaidRows.reduce((acc, r) => {
    acc[r.plan] = (acc[r.plan] || 0) + r.amount;
    return acc;
  }, {});

  return { total, unpaidRows, grouped };
}

export default function MarketersPage() {
  const {
    rows: ledger = [],
    loading,
    error,
  } = useTabData("COMMISSION_LEDGER");

  const [pins, setPins] = useState({
    Emma: "",
    Wyatt: "",
    ED: "",
    Micah: "",
  });

  const [open, setOpen] = useState(null);

  const sums = useMemo(
    () => ({
      Emma: summary(ledger, "Emma"),
      Wyatt: summary(ledger, "Wyatt"),
      ED: summary(ledger, "ED"),
      Micah: summary(ledger, "Micah"),
    }),
    [ledger]
  );

  function unlock(name) {
    if (pins[name] !== PIN_MAP[name]) return;
    setOpen(name);
  }

  function close() {
    setOpen(null);
    setPins({
      Emma: "",
      Wyatt: "",
      ED: "",
      Micah: "",
    });
  }

  if (loading) return <LoadingSpinner label="Loading commissions..." />;
  if (error) return <ErrorBanner message="Commission ledger failed to load." />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Marketer Commissions</h1>
        <p className="mt-2 text-sm text-gray-400">
          Strict per-person commission view. No TEAM/ad split included.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {PEOPLE.map((p) => (
          <div
            key={p.name}
            className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.25)]"
          >
            <div className="mb-4">
              <div className="text-lg font-semibold text-white">{p.name}</div>
              <div className="text-xs text-gray-400">{p.role} private commission access</div>
            </div>

            <input
              type="password"
              value={pins[p.name]}
              onChange={(e) =>
                setPins((x) => ({
                  ...x,
                  [p.name]: e.target.value,
                }))
              }
              onKeyDown={(e) => {
                if (e.key === "Enter") unlock(p.name);
              }}
              placeholder="Enter PIN"
              className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none"
            />

            <button
              onClick={() => unlock(p.name)}
              className="mt-3 w-full rounded-2xl bg-white text-black py-3 font-semibold transition hover:opacity-90"
            >
              Unlock
            </button>
          </div>
        ))}
      </div>

      {open && (
        <DrawerPanel
          isOpen
          onClose={close}
          title={`${open} Commission Details`}
          description="Only unpaid Commission_Ledger rows are included."
        >
          <div className="space-y-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl p-6">
              <div className="text-xs uppercase text-gray-400">Current Unpaid</div>
              <div className="mt-2 text-3xl font-semibold text-white">
                {fmt(sums[open].total)}
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl p-6">
              <div className="text-xs uppercase text-gray-400 mb-3">Plan Breakdown</div>

              {Object.entries(sums[open].grouped).length === 0 ? (
                <EmptyState
                  title="No unpaid commission rows"
                  description="Commission_Ledger has no matching unpaid rows for this person yet."
                />
              ) : (
                Object.entries(sums[open].grouped).map(([plan, value]) => (
                  <div key={plan} className="flex justify-between text-sm text-white mb-2">
                    <span>{plan}</span>
                    <span>{fmt(value)}</span>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.06] backdrop-blur-2xl p-6">
              <div className="text-xs uppercase text-gray-400 mb-3">Calculation Details</div>

              {sums[open].unpaidRows.length === 0 ? (
                <EmptyState
                  title="Nothing to calculate yet"
                  description="Add real Commission_Ledger rows for this person and the breakdown will appear here."
                />
              ) : (
                sums[open].unpaidRows.map((r, i) => (
                  <div key={i} className="text-sm text-gray-300 mb-2">
                    {r.note}
                  </div>
                ))
              )}
            </div>
          </div>
        </DrawerPanel>
      )}
    </div>
  );
}
