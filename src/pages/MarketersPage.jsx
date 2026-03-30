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
  { name: "Justin", role: "Sales" },
  { name: "Dekahri", role: "Tech" },
];

const PIN_MAP = {
  Emma: "3724",
  Wyatt: "2654",
  ED: "1876",
  Micah: "9789",
  Justin: "4535",
  Dekahri: "8567",
};

const PLAN_COLORS = {
  Starter: { bg: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.2)", text: "#67e8f9", dot: "#06b6d4" },
  Pro:     { bg: "rgba(99,102,241,0.08)", border: "rgba(99,102,241,0.2)", text: "#a5b4fc", dot: "#6366f1" },
  Premium: { bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.2)", text: "#fcd34d", dot: "#f59e0b" },
  Enterprise: { bg: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.2)", text: "#6ee7b7", dot: "#10b981" },
};

const money = (v) => parseFloat(String(v ?? "").replace(/[^0-9.-]/g, "")) || 0;

const fmt = (v) =>
  "$" + Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function belongs(row, person) {
  if (person === "Emma" || person === "Wyatt") {
    return String(row["Direct Marketer"] || "").trim() === person;
  }
  if (person === "ED" || person === "Micah" || person === "Justin") {
    return String(row["Sales Rep"] || "").trim() === person;
  }
  return false;
}

function unpaid(row) {
  return !row["_isPaidOut"];
}

function commission(row, person) {
  if (person === "Emma") return money(row["Emma Commission"]);
  if (person === "Wyatt") return money(row["Wyatt Commission"]);
  if (person === "ED" || person === "Micah" || person === "Justin") return money(row["Sales Commission"]);
  return 0;
}

function base(row) { return money(row["Commission Base Amount"]); }

function rate(row, person) {
  if (person === "ED" || person === "Micah" || person === "Justin") {
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

function salesMonth(row) {
  const m = money(row["Sales Rep Paid Month Count"] || row["Months Active / Paid Month"] || "0");
  return Math.max(1, Math.min(6, m || 1));
}

function buildRetainerSummary(retainerRows, person) {
  const unpaid = retainerRows.filter(r =>
    (r["Person"] || "").trim() === person &&
    (!r["Paid Out?"] || r["Paid Out?"].trim().toLowerCase() !== "yes")
  );
  const total = unpaid.reduce((s, r) => s + (parseFloat(String(r["Amount"] || "0").replace(/[^0-9.-]/g, "")) || 0), 0);
  return { total, rows: unpaid };
}

function buildSummary(rows, person) {
  const isSales = ["ED", "Micah", "Justin"].includes(person);
  const owned = rows.filter((r) => belongs(r, person));

  const unpaidRows = owned.filter(unpaid).map((r) => ({
    customer: r["Customer Name"] || "Unknown Customer",
    amount: commission(r, person),
    plan: plan(r),
    base: base(r),
    rate: rate(r, person),
    month: isSales ? salesMonth(r) : null,
    paid: false,
    date: r["Date"] || "",
    batch: "",
  })).filter((r) => r.amount > 0);

  const paidRows = owned.filter((r) => !unpaid(r)).map((r) => ({
    customer: r["Customer Name"] || "Unknown Customer",
    amount: commission(r, person),
    plan: plan(r),
    base: base(r),
    rate: rate(r, person),
    month: isSales ? salesMonth(r) : null,
    paid: true,
    date: r["Date"] || "",
    batch: r["Payout Batch / Month"] || "",
  })).filter((r) => r.amount > 0);

  const total = unpaidRows.reduce((a, b) => a + b.amount, 0);
  const totalPaid = paidRows.reduce((a, b) => a + b.amount, 0);

  const grouped = unpaidRows.reduce((acc, r) => {
    if (!acc[r.plan]) acc[r.plan] = { total: 0, clients: 0 };
    acc[r.plan].total += r.amount;
    acc[r.plan].clients += 1;
    return acc;
  }, {});

  return { total, unpaidRows, paidRows, totalPaid, grouped, isSales };
}

function MonthProgressBar({ month }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5,6].map((m) => (
        <div
          key={m}
          className="h-1.5 flex-1 rounded-full transition-all duration-300"
          style={{
            background: m <= month
              ? "linear-gradient(90deg, #06b6d4, #0891b2)"
              : "rgba(255,255,255,0.08)",
            boxShadow: m <= month ? "0 0 6px rgba(6,182,212,0.4)" : "none",
          }}
        />
      ))}
      <span className="ml-1.5 text-[10px] text-zinc-500 shrink-0">{month}/6</span>
    </div>
  );
}

function SalesClientCard({ row, index }) {
  const [expanded, setExpanded] = useState(false);
  const colors = PLAN_COLORS[row.plan] || PLAN_COLORS.Starter;

  return (
    <div
      className="rounded-[20px] overflow-hidden transition-all duration-200 cursor-pointer"
      style={{
        background: expanded ? colors.bg : "rgba(255,255,255,0.03)",
        border: `1px solid ${expanded ? colors.border : "rgba(255,255,255,0.07)"}`,
      }}
      onClick={() => setExpanded((p) => !p)}
    >
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="h-2 w-2 rounded-full shrink-0"
            style={{ background: colors.dot, boxShadow: `0 0 6px ${colors.dot}` }}
          />
          <div className="min-w-0">
            <div className="text-sm font-medium text-white truncate">{row.customer}</div>
            <div className="mt-0.5 w-full max-w-[160px]">
              <MonthProgressBar month={row.month} />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span
            className="text-sm font-semibold"
            style={{ color: colors.text }}
          >
            {fmt(row.amount)}
          </span>
          <span
            className="text-zinc-500 text-xs transition-transform duration-200"
            style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
          >
            ▾
          </span>
        </div>
      </div>

      {expanded && (
        <div
          className="px-4 pb-3 pt-1 border-t"
          style={{ borderColor: colors.border }}
        >
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(0,0,0,0.2)" }}>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Plan</div>
              <div className="mt-1 text-xs font-semibold" style={{ color: colors.text }}>{row.plan}</div>
            </div>
            <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(0,0,0,0.2)" }}>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Base</div>
              <div className="mt-1 text-xs font-semibold text-white">{fmt(row.base)}</div>
            </div>
            <div className="rounded-xl p-2.5 text-center" style={{ background: "rgba(0,0,0,0.2)" }}>
              <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Rate</div>
              <div className="mt-1 text-xs font-semibold text-white">{row.rate}%</div>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-zinc-500 text-center">
            {fmt(row.base)} × {row.rate}% = {fmt(row.amount)} · month {row.month} of 6
          </div>
        </div>
      )}
    </div>
  );
}

function DirectClientCard({ row }) {
  return (
    <div
      className="rounded-[20px] px-4 py-3 flex items-center justify-between gap-3"
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      <div className="min-w-0">
        <div className="text-sm font-medium text-white truncate">{row.customer}</div>
        <div className="mt-0.5 text-[11px] text-zinc-500">
          {fmt(row.base)} × {row.rate}% · {row.plan}
        </div>
      </div>
      <span className="text-sm font-semibold text-cyan-300 shrink-0">{fmt(row.amount)}</span>
    </div>
  );
}

export default function MarketersPage() {
  const { rows: ledger = [], loading, error } = useTabData("COMMISSION_LEDGER");
  const { rows: retainer = [] } = useTabData("RETAINER_LEDGER");

  const [pins, setPins] = useState({ Emma: "", Wyatt: "", ED: "", Micah: "", Justin: "", Dekahri: "" });
  const [pinErrors, setPinErrors] = useState({ Emma: "", Wyatt: "", ED: "", Micah: "", Justin: "" });
  const [open, setOpen] = useState(null);
  const [showPaid, setShowPaid] = useState(false);

  const retainerUnpaid = useMemo(() => {
    const unpaidByPerson = {};
    retainer.forEach(r => {
      const person = (r["Person"] || "").trim();
      const paid = (r["Paid Out?"] || "").trim().toLowerCase();
      if (!paid || !['yes', 'paid', 'y', '1', 'true'].includes(paid)) {
        const amt = parseFloat(String(r["Amount"] || "0").replace(/[^0-9.-]/g, "")) || 0;
        unpaidByPerson[person] = (unpaidByPerson[person] || 0) + amt;
      }
    });
    return unpaidByPerson;
  }, [retainer]);

  const sums = useMemo(() => ({
    Emma: buildSummary(ledger, "Emma"),
    Wyatt: buildSummary(ledger, "Wyatt"),
    ED: buildSummary(ledger, "ED"),
    Micah: buildSummary(ledger, "Micah"),
    Justin: buildSummary(ledger, "Justin"),
  }), [ledger]);

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
    setPins({ Emma: "", Wyatt: "", ED: "", Micah: "", Justin: "", Dekahri: "" });
    setPinErrors({ Emma: "", Wyatt: "", ED: "", Micah: "", Justin: "" });
  }

  const isSalesOpen = open && ["ED", "Micah", "Justin"].includes(open);

  return (
    <div className="space-y-6 px-6 py-6">
      <div>
        <h1 className="text-3xl font-semibold text-white">My Pay</h1>
        <p className="mt-2 text-sm text-gray-400">
          Personal commission access only. Each person views only their own data after PIN unlock.
        </p>
      </div>

      {loading ? <LoadingSpinner label="Loading commissions..." /> : null}
      {error ? <ErrorBanner message="Commission ledger failed to load." /> : null}

      {/* Marketers group */}
      <div>
        <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-zinc-500">Marketers</div>
        <div className="grid gap-5 sm:grid-cols-2">
          {PEOPLE.filter(p => p.role === "Marketer").map((p) => {
          const isSales = false;
          return (
            <div
              key={p.name}
              className="rounded-[24px] p-7 backdrop-blur-2xl"
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.006) 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(40px) saturate(180%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%)",
                boxShadow: "0 32px 64px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              <div className="mb-5 flex flex-col items-center text-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white"
                  style={{ background: isSales ? 'linear-gradient(135deg,#4f46e5,#6366f1)' : 'linear-gradient(135deg,#0891b2,#06b6d4)', boxShadow: isSales ? '0 0 20px rgba(99,102,241,0.3)' : '0 0 20px rgba(6,182,212,0.3)' }}>
                  {p.name[0]}
                </div>
                <div>
                  <div className="text-base font-semibold text-white">{p.name}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wider font-medium"
                    style={{ color: isSales ? "#a5b4fc" : "#67e8f9" }}>
                    {isSales ? "Sales" : "Marketer"}
                  </div>
                </div>
              </div>

              <input
                type="password"
                value={pins[p.name]}
                onChange={(e) => setPins((x) => ({ ...x, [p.name]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") unlock(p.name); }}
                placeholder="Enter PIN"
                className="w-full rounded-2xl px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600"
                style={{
                  background: "rgba(0,0,0,0.35)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              />

              {pinErrors[p.name] && (
                <div className="mt-1.5 text-xs text-red-400">{pinErrors[p.name]}</div>
              )}

              <button
                onClick={() => unlock(p.name)}
                className="mt-3 w-full rounded-2xl py-2.5 text-sm font-medium transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(6,182,212,0.2)",
                  color: "rgba(6,182,212,0.9)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(6,182,212,0.08)"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.35)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.2)"; }}
              >
                Unlock
              </button>
            </div>
          );
          })}
        </div>
      </div>

      {/* Tech group */}
      <div>
        <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-zinc-500">Tech</div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {PEOPLE.filter(p => p.role === "Tech").map((p) => {
            const isUnlocked = pins[p.name] === PIN_MAP[p.name];
            return (
              <div key={p.name} className="rounded-[24px] p-7 backdrop-blur-2xl"
                style={{
                  background: "linear-gradient(160deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.006) 100%)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  backdropFilter: "blur(40px) saturate(180%)",
                  WebkitBackdropFilter: "blur(40px) saturate(180%)",
                  boxShadow: "0 32px 64px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
                }}>
                <div className="mb-5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-bold shrink-0"
                    style={{ background: "linear-gradient(135deg,rgba(168,85,247,0.2),rgba(99,102,241,0.1))", border: "1px solid rgba(168,85,247,0.25)", boxShadow: "0 0 20px rgba(168,85,247,0.15)", color: "#d8b4fe" }}>
                    {p.name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-semibold text-white">{p.name}</div>
                    <div className="mt-0.5 text-[10px] uppercase tracking-wider font-medium" style={{ color: "#d8b4fe" }}>Tech Lead</div>
                  </div>
                  {isUnlocked && (
                    <button onClick={() => setPins(x => ({ ...x, [p.name]: "" }))}
                      className="text-zinc-500 hover:text-white text-lg leading-none transition-colors">✕</button>
                  )}
                </div>
                {!isUnlocked ? (
                  <div className="space-y-3">
                    <input type="password" value={pins[p.name] || ""}
                      onChange={(e) => setPins((x) => ({ ...x, [p.name]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") unlock(p.name); }}
                      placeholder="Enter PIN"
                      className="w-full rounded-2xl px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600"
                      style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)" }} />
                    {pinErrors[p.name] && <div className="text-xs text-red-400">{pinErrors[p.name]}</div>}
                    <button onClick={() => unlock(p.name)}
                      className="mt-1 w-full rounded-2xl py-2.5 text-sm font-medium transition-all duration-200"
                      style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(168,85,247,0.2)", color: "rgba(168,85,247,0.9)" }}>
                      Unlock
                    </button>
                  </div>
                ) : (
                  <div className="rounded-[18px] px-5 py-6 text-center space-y-3"
                    style={{ background: "rgba(168,85,247,0.06)", border: "1px solid rgba(168,85,247,0.15)" }}>
                    <div className="text-3xl">⚙️</div>
                    <div className="text-base font-semibold text-white">Tech Lead</div>
                    <div className="text-sm text-zinc-400 leading-relaxed">
                      Your compensation is being finalized. Once your contract or rate is confirmed, your pay details will appear here automatically.
                    </div>
                    <div className="text-xs text-zinc-600 mt-1">Contact Kyle or Brennan with any questions.</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sales group */}
      <div>
        <div className="mb-3 text-[10px] uppercase tracking-[0.22em] text-zinc-500">Sales</div>
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {PEOPLE.filter(p => p.role === "Sales").map((p) => {
          const isSales = true;
          return (
            <div
              key={p.name}
              className="rounded-[24px] p-7 backdrop-blur-2xl"
              style={{
                background: "linear-gradient(160deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.006) 100%)",
                border: "1px solid rgba(255,255,255,0.06)",
                backdropFilter: "blur(40px) saturate(180%)",
                WebkitBackdropFilter: "blur(40px) saturate(180%)",
                boxShadow: "0 32px 64px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.07)",
              }}
            >
              <div className="mb-5 flex flex-col items-center text-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#4f46e5,#6366f1)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
                  {p.name[0]}
                </div>
                <div>
                  <div className="text-base font-semibold text-white">{p.name}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-wider font-medium" style={{ color: "#a5b4fc" }}>
                    Sales
                  </div>
                </div>
              </div>
              <input
                type="password"
                value={pins[p.name]}
                onChange={(e) => setPins((x) => ({ ...x, [p.name]: e.target.value }))}
                onKeyDown={(e) => { if (e.key === "Enter") unlock(p.name); }}
                placeholder="Enter PIN"
                className="w-full rounded-2xl px-4 py-2.5 text-sm text-white outline-none placeholder:text-zinc-600"
                style={{ background: "rgba(0,0,0,0.35)", border: "1px solid rgba(255,255,255,0.08)" }}
              />
              {pinErrors[p.name] && (
                <div className="mt-1.5 text-xs text-red-400">{pinErrors[p.name]}</div>
              )}
              <button
                onClick={() => unlock(p.name)}
                className="mt-3 w-full rounded-2xl py-2.5 text-sm font-medium transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(6,182,212,0.2)",
                  color: "rgba(6,182,212,0.9)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(6,182,212,0.08)"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.35)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.borderColor = "rgba(6,182,212,0.2)"; }}
              >
                Unlock
              </button>
            </div>
          );
          })}
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div
            className="relative w-full max-w-2xl rounded-[28px] p-7"
            style={{
              background: "linear-gradient(160deg, rgba(10,14,20,0.97) 0%, rgba(6,10,16,0.98) 100%)",
              border: "1px solid rgba(255,255,255,0.07)",
              backdropFilter: "blur(60px) saturate(200%)",
              WebkitBackdropFilter: "blur(60px) saturate(200%)",
              boxShadow: "0 48px 100px rgba(0,0,0,0.7), 0 16px 40px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.07)",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            {/* Close */}
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-sm text-zinc-400 transition hover:text-white"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}
            >
              ✕
            </button>

            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-bold"
                  style={{
                    background: isSalesOpen
                      ? "linear-gradient(135deg, #4f46e5, #6366f1)"
                      : "linear-gradient(135deg, #0891b2, #06b6d4)",
                    boxShadow: isSalesOpen
                      ? "0 0 20px rgba(99,102,241,0.35)"
                      : "0 0 20px rgba(6,182,212,0.35)",
                  }}
                >
                  {open[0]}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">{open}</h2>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {isSalesOpen ? "Sales · 20% commission · months 1–6 per client" : "Marketer · 5% lifetime commission"}
                  </p>
                </div>
              </div>
            </div>

            {/* Total unpaid hero */}
            <div
              className="rounded-[24px] p-5 mb-5"
              style={{
                background: sums[open].total > 0
                  ? isSalesOpen
                    ? "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.08))"
                    : "linear-gradient(135deg, rgba(6,182,212,0.15), rgba(2,132,199,0.08))"
                  : "rgba(255,255,255,0.03)",
                border: sums[open].total > 0
                  ? isSalesOpen ? "1px solid rgba(99,102,241,0.25)" : "1px solid rgba(6,182,212,0.25)"
                  : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="text-[10px] uppercase tracking-[0.2em] text-zinc-500 mb-1">Current Unpaid</div>
              <div
                className="text-4xl font-bold tracking-tight"
                style={{
                  color: (sums[open].total + (retainerUnpaid[open] || 0)) > 0
                    ? isSalesOpen ? "#a5b4fc" : "#67e8f9"
                    : "#3f3f46",
                }}
              >
                {fmt(sums[open].total + (retainerUnpaid[open] || 0))}
              </div>
              {!isSalesOpen && retainerUnpaid[open] > 0 && (
                <div className="mt-2 flex items-center justify-between rounded-xl px-3 py-2" style={{background:"rgba(6,182,212,0.06)",border:"1px solid rgba(6,182,212,0.12)"}}>
                  <span className="text-xs text-zinc-500">Retainer</span>
                  <span className="text-xs font-medium text-cyan-300">{fmt(retainerUnpaid[open])}</span>
                </div>
              )}
              {!isSalesOpen && (
                <div className="mt-1 flex items-center justify-between rounded-xl px-3 py-2" style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)"}}>
                  <span className="text-xs text-zinc-500">Commission</span>
                  <span className="text-xs font-medium text-zinc-300">{fmt(sums[open].total)}</span>
                </div>
              )}
              {sums[open].unpaidRows.length > 0 && (
                <div className="mt-1 text-xs text-zinc-500">
                  {sums[open].unpaidRows.length} unpaid {sums[open].unpaidRows.length === 1 ? "entry" : "entries"}
                </div>
              )}
            </div>

            {/* Toggle unpaid / paid */}
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs uppercase tracking-[0.18em] text-zinc-500">
                {showPaid ? "Paid History" : isSalesOpen ? "Client Breakdown" : "Commission Breakdown"}
              </div>
              {sums[open].paidRows.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowPaid((p) => !p)}
                  className="text-xs transition"
                  style={{ color: isSalesOpen ? "#a5b4fc" : "#67e8f9" }}
                >
                  {showPaid ? "← Back to unpaid" : `Paid history (${sums[open].paidRows.length})`}
                </button>
              )}
            </div>

            {/* Content */}
            {showPaid ? (
              sums[open].paidRows.length === 0 ? (
                <EmptyState title="No paid history yet" description="Paid commissions will appear here after payout." />
              ) : (
                <div className="space-y-2">
                  <div
                    className="rounded-[18px] px-4 py-3 flex justify-between items-center mb-3"
                    style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}
                  >
                    <span className="text-xs text-zinc-400">Total paid to date</span>
                    <span className="text-sm font-semibold text-emerald-400">{fmt(sums[open].totalPaid)}</span>
                  </div>
                  {sums[open].paidRows.map((r, i) => (
                    <div
                      key={`paid-${i}`}
                      className="rounded-[18px] px-4 py-3"
                      style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="text-sm text-zinc-300 font-medium truncate">{r.customer}</div>
                          <div className="text-xs text-zinc-600 mt-0.5">
                            {fmt(r.base)} × {r.rate}% = {fmt(r.amount)}
                            {r.month ? ` · month ${r.month} of 6` : ""}
                          </div>
                          {r.batch && <div className="text-[10px] text-zinc-600 mt-0.5">Batch: {r.batch}</div>}
                        </div>
                        <span
                          className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                          style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", border: "1px solid rgba(16,185,129,0.2)" }}
                        >
                          Paid
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : sums[open].unpaidRows.length === 0 ? (
              <EmptyState
                title="No unpaid commissions yet"
                description="When Commission_Ledger rows are assigned to you, your breakdown appears here."
              />
            ) : isSalesOpen ? (
              <div className="space-y-2">
                {sums[open].unpaidRows.map((r, i) => (
                  <SalesClientCard key={`${open}-${r.customer}-${i}`} row={r} index={i} />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {sums[open].unpaidRows.map((r, i) => (
                  <DirectClientCard key={`${open}-${r.customer}-${i}`} row={r} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
