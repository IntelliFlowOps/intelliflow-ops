import { useMemo, useState } from "react";
import { useTabData } from "../hooks/useSheetData.jsx";
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
  const month =
    row["Sales Rep Paid Month Count"] ||
    row["Months Active / Paid Month"] ||
    "—";

  if (person === "ED" || person === "Micah") {
    return `${customer} → ${fmt(base(row))} × ${rate(row, person)}% = ${fmt(
      commission(row, person)
    )} (paid month ${month} of 6)`;
  }

  return `${customer} → ${fmt(base(row))} × ${rate(row, person)}% = ${fmt(
    commission(row, person)
  )}`;
}

function buildSummary(rows, person) {
  const owned = rows.filter((r) => belongs(r, person));

  const unpaidRows = owned
    .filter(unpaid)
    .map((r) => ({
      customer: r["Customer Name"] || "Unknown Customer",
      amount: commission(r, person),
      plan: plan(r),
      note: explanation(r, person),
      paid: false,
      date: r["Date"] || "",
    }))
    .filter((r) => r.amount > 0);

  const paidRows = owned
    .filter((r) => !unpaid(r))
    .map((r) => ({
      customer: r["Customer Name"] || "Unknown Customer",
      amount: commission(r, person),
      plan: plan(r),
      note: explanation(r, person),
      paid: true,
      date: r["Date"] || "",
      batch: r["Payout Batch / Month"] || "",
    }))
    .filter((r) => r.amount > 0);

  const total = unpaidRows.reduce((a, b) => a + b.amount, 0);
  const totalPaid = paidRows.reduce((a, b) => a + b.amount, 0);

  const grouped = unpaidRows.reduce((acc, r) => {
    if (!acc[r.plan]) {
      acc[r.plan] = { total: 0, clients: 0 };
    }
    acc[r.plan].total += r.amount;
    acc[r.plan].clients += 1;
    return acc;
  }, {});

  return { total, unpaidRows, paidRows, totalPaid, grouped };
}

function ZeroBreakdown() {
  return (
    <div className="space-y-3">
      {["Starter", "Pro", "Premium"].map((name) => (
        <div
          key={name}
          className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
        >
          <div>
            <div className="text-sm font-medium text-white">{name}</div>
            <div className="text-xs text-gray-400">0 clients</div>
          </div>
          <div className="text-sm font-semibold text-white">{fmt(0)}</div>
        </div>
      ))}
    </div>
  );
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

  const [pinErrors, setPinErrors] = useState({
    Emma: "",
    Wyatt: "",
    ED: "",
    Micah: "",
  });

  const [open, setOpen] = useState(null);
  const [showPaid, setShowPaid] = useState(false);

  const sums = useMemo(
    () => ({
      Emma: buildSummary(ledger, "Emma"),
      Wyatt: buildSummary(ledger, "Wyatt"),
      ED: buildSummary(ledger, "ED"),
      Micah: buildSummary(ledger, "Micah"),
    }),
    [ledger]
  );

  function unlock(name) {
    if (pins[name] !== PIN_MAP[name]) {
      setPinErrors((prev) => ({ ...prev, [name]: "Incorrect PIN" }));
      return;
    }

    setPinErrors((prev) => ({ ...prev, [name]: "" }));
    setOpen(name);
  }

  function closeModal() {
    setOpen(null);
    setShowPaid(false);
    setPins({
      Emma: "",
      Wyatt: "",
      ED: "",
      Micah: "",
    });
    setPinErrors({
      Emma: "",
      Wyatt: "",
      ED: "",
      Micah: "",
    });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">Individual Commissions</h1>
        <p className="mt-2 text-sm text-gray-400">
          Personal commission access only. Each person can view only their own unpaid commission after PIN unlock.
        </p>
      </div>

      {loading ? <LoadingSpinner label="Loading commissions..." /> : null}
      {error ? <ErrorBanner message="Commission ledger failed to load." /> : null}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {PEOPLE.map((p) => (
          <div
            key={p.name}
            className="rounded-[28px] border border-white/10 bg-white/[0.07] backdrop-blur-2xl p-6 shadow-[0_12px_40px_rgba(0,0,0,0.28)]"
          >
            <div className="mb-4">
              <div className="text-lg font-semibold text-white">{p.name}</div>
              <div className="text-xs text-gray-400">{p.role} private KPI</div>
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

            {pinErrors[p.name] ? (
              <div className="mt-2 text-xs text-red-400">{pinErrors[p.name]}</div>
            ) : null}

            <button
              onClick={() => unlock(p.name)}
              className="mt-3 w-full rounded-2xl bg-white text-black py-3 font-semibold transition hover:opacity-90"
            >
              Unlock
            </button>
          </div>
        ))}
      </div>

      {open ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4">
          <div className="relative w-full max-w-3xl rounded-[32px] border border-white/10 bg-[#0b0b0f]/95 backdrop-blur-2xl p-6 shadow-[0_20px_80px_rgba(0,0,0,0.45)]">
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white"
            >
              X
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-semibold text-white">
                {open} Individual Commission
              </h2>
              <p className="mt-1 text-sm text-gray-400">
                Only unpaid Commission_Ledger rows assigned to {open} are included.
              </p>
            </div>

            <div className="space-y-6">
              <div className="rounded-[28px] border border-white/10 bg-white/[0.06] backdrop-blur-2xl p-6">
                <div className="text-xs uppercase text-gray-400">Current Unpaid</div>
                <div className="mt-2 text-3xl font-semibold text-white">
                  {fmt(sums[open].total)}
                </div>
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.06] backdrop-blur-2xl p-6">
                <div className="text-xs uppercase text-gray-400 mb-3">Plan Breakdown</div>

                {Object.entries(sums[open].grouped).length === 0 ? (
                  <ZeroBreakdown />
                ) : (
                  Object.entries(sums[open].grouped).map(([planName, data]) => (
                    <div
                      key={planName}
                      className="mb-3 flex items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-4 py-3"
                    >
                      <div>
                        <div className="text-sm font-medium text-white">{planName}</div>
                        <div className="text-xs text-gray-400">
                          {data.clients} {data.clients === 1 ? "client" : "clients"}
                        </div>
                      </div>
                      <div className="text-sm font-semibold text-white">{fmt(data.total)}</div>
                    </div>
                  ))
                )}
              </div>

              <div className="rounded-[28px] border border-white/10 bg-white/[0.06] backdrop-blur-2xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="text-xs uppercase text-gray-400">
                    {showPaid ? "Paid History" : "Calculation Details"}
                  </div>
                  {sums[open].paidRows.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowPaid(p => !p)}
                      className="text-xs text-cyan-400 hover:text-cyan-200 transition"
                    >
                      {showPaid ? "Show unpaid" : `Show paid history (${sums[open].paidRows.length})`}
                    </button>
                  )}
                </div>

                {showPaid ? (
                  sums[open].paidRows.length === 0 ? (
                    <EmptyState title="No paid history yet" description="Paid commissions will appear here after payout." />
                  ) : (
                    <div className="space-y-2">
                      <div className="mb-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-2 flex justify-between text-xs text-gray-400">
                        <span>Total paid to date</span>
                        <span className="text-emerald-400 font-semibold">{fmt(sums[open].totalPaid)}</span>
                      </div>
                      {sums[open].paidRows.map((r, i) => (
                        <div
                          key={`${open}-paid-${r.customer}-${i}`}
                          className="rounded-2xl border border-white/[0.06] bg-black/10 px-4 py-3 text-sm text-gray-400"
                        >
                          <div className="flex justify-between items-start">
                            <span>{r.note}</span>
                            <span className="ml-3 shrink-0 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-400">Paid</span>
                          </div>
                          {r.batch && <div className="mt-1 text-[10px] text-gray-500">Batch: {r.batch}</div>}
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  sums[open].unpaidRows.length === 0 ? (
                    <EmptyState
                      title="No unpaid commission rows yet"
                      description="This drawer opens at zero. When unpaid Commission_Ledger rows exist for this person, their exact calculation breakdown appears here."
                    />
                  ) : (
                    sums[open].unpaidRows.map((r, i) => (
                      <div
                        key={`${open}-${r.customer}-${i}`}
                        className="mb-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-gray-300"
                      >
                        {r.note}
                      </div>
                    ))
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
