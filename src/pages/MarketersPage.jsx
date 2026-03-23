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

const normalize = (v) => String(v ?? "").trim();
const lower = (v) => normalize(v).toLowerCase();

function pick(row, keys) {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== "")
      return row[k];
  }
  return "";
}

function money(v) {
  if (!v) return 0;
  const n = parseFloat(String(v).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function fmt(v) {
  return `$${Number(v || 0).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function belongs(row, person) {
  if (person === "Emma" || person === "Wyatt") {
    return lower(pick(row, ["Direct Marketer"])) === person.toLowerCase();
  }

  if (person === "ED" || person === "Micah") {
    return lower(pick(row, ["Sales Rep"])) === person.toLowerCase();
  }

  return false;
}

function unpaid(row) {
  const paid = lower(pick(row, ["Paid Out?", "status"]));
  const batch = normalize(pick(row, ["Payout Batch / Month"]));

  if (batch) return false;

  return !(paid === "yes" || paid === "paid");
}

function commission(row, person) {
  if (person === "Emma") return money(pick(row, ["Emma Commission"]));
  if (person === "Wyatt") return money(pick(row, ["Wyatt Commission"]));
  if (person === "ED" || person === "Micah")
    return money(pick(row, ["Sales Commission"]));
  return 0;
}

function base(row) {
  return money(pick(row, ["Commission Base Amount"]));
}

function rate(row, person) {
  if (person === "ED" || person === "Micah") {
    const r = money(pick(row, ["Sales Rep Rate"]));
    return r <= 1 ? r * 100 : r;
  }

  const r = money(pick(row, ["Commission %"]));
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
  const customer = pick(row, ["Customer Name"]);
  const r = rate(row, person);
  const b = base(row);
  const c = commission(row, person);

  return `${customer} → ${fmt(b)} × ${r}% = ${fmt(c)}`;
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

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-semibold text-white">
        Marketer Commissions
      </h1>

      {loading && <LoadingSpinner label="Loading..." />}

      {error && (
        <ErrorBanner message="Commission ledger failed to load." />
      )}

      {!loading && !error && (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {PEOPLE.map((p) => (
            <div
              key={p.name}
              className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6 shadow-lg"
            >
              <div className="text-lg font-semibold text-white">
                {p.name}
              </div>

              <div className="text-xs text-gray-400 mb-3">
                {p.role} commission access
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
                placeholder="Enter PIN"
                className="w-full rounded-xl border border-white/10 bg-black/60 px-4 py-3 text-white"
              />

              <button
                onClick={() => unlock(p.name)}
                className="mt-3 w-full rounded-xl bg-white text-black py-2 font-semibold"
              >
                Unlock
              </button>
            </div>
          ))}
        </div>
      )}

      {open && (
        <DrawerPanel
          isOpen
          onClose={close}
          title={`${open} Commission Details`}
          description="Only unpaid rows included"
        >
          <div className="space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6">
              <div className="text-xs text-gray-400 uppercase">
                Current Unpaid
              </div>

              <div className="text-3xl text-white font-semibold mt-2">
                {fmt(sums[open].total)}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6">
              <div className="text-xs text-gray-400 uppercase mb-3">
                Plan Breakdown
              </div>

              {Object.entries(sums[open].grouped).length === 0 && (
                <EmptyState
                  title="No unpaid commission"
                  description="Everything already paid."
                />
              )}

              {Object.entries(sums[open].grouped).map(
                ([plan, value]) => (
                  <div
                    key={plan}
                    className="flex justify-between text-sm text-white mb-2"
                  >
                    <span>{plan}</span>
                    <span>{fmt(value)}</span>
                  </div>
                )
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-6">
              <div className="text-xs text-gray-400 uppercase mb-3">
                Calculation Details
              </div>

              {sums[open].unpaidRows.map((r, i) => (
                <div
                  key={i}
                  className="text-sm text-gray-300 mb-2"
                >
                  {r.note}
                </div>
              ))}
            </div>
          </div>
        </DrawerPanel>
      )}
    </div>
  );
}
