import { useMemo, useState } from "react";
import { useTabData } from "../hooks/useSheetData.jsx";
import EmptyState from "../components/EmptyState.jsx";
import { useToast } from "../components/Toast.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const FOUNDER_PIN = "2343";

const AVATAR_COLORS = {
  Emma:    { bg: 'linear-gradient(135deg,#0891b2,#06b6d4)', shadow: 'rgba(6,182,212,0.4)' },
  Wyatt:   { bg: 'linear-gradient(135deg,#0e7490,#0891b2)', shadow: 'rgba(6,182,212,0.3)' },
  ED:      { bg: 'linear-gradient(135deg,#4f46e5,#6366f1)', shadow: 'rgba(99,102,241,0.4)' },
  Micah:   { bg: 'linear-gradient(135deg,#6d28d9,#7c3aed)', shadow: 'rgba(124,58,237,0.4)' },
  Justin:  { bg: 'linear-gradient(135deg,#5b21b6,#6d28d9)', shadow: 'rgba(109,40,217,0.4)' },
  Founder: { bg: 'linear-gradient(135deg,#374151,#4b5563)', shadow: 'rgba(75,85,99,0.3)' },
};

function PersonAvatar({ name, size = 10, hasUnpaid = false }) {
  const col = AVATAR_COLORS[name] || AVATAR_COLORS.Founder;
  return (
    <div className="relative shrink-0" style={{ width: size * 4, height: size * 4 }}>
      <div className="flex items-center justify-center rounded-2xl font-bold text-white w-full h-full"
        style={{
          background: col.bg,
          boxShadow: "0 0 16px " + col.shadow,
          fontSize: size * 1.5,
          outline: hasUnpaid ? '2px solid rgba(245,158,11,0.7)' : '2px solid transparent',
          outlineOffset: '2px',
        }}>
        {name[0]}
      </div>
      {hasUnpaid && (
        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-[#07111f]"
          style={{ background: '#f59e0b', boxShadow: '0 0 6px rgba(245,158,11,0.8)' }} />
      )}
    </div>
  );
}

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December"
];

function currentMonthLabel() {
  const d = new Date();
  return MONTH_NAMES[d.getMonth()] + " " + d.getFullYear();
}

function nextMonthLabel() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return MONTH_NAMES[d.getMonth()] + " " + d.getFullYear();
}

function fmt(v) {
  const n = parseFloat(String(v || "0").replace(/[^0-9.-]/g, ""));
  return "$" + (isFinite(n) ? n : 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function money(v) {
  const n = parseFloat(String(v || "0").replace(/[^0-9.-]/g, ""));
  return isFinite(n) ? n : 0;
}

function getUnpaidRetainer(retainerRows, person) {
  return retainerRows.filter(r =>
    r["Person"] === person &&
    (!r["Paid Out?"] || r["Paid Out?"].toLowerCase() !== "yes")
  );
}

function getUnpaidCommissions(ledgerRows, person) {
  if (person === "Emma" || person === "Wyatt") {
    return ledgerRows.filter(r =>
      r["Direct Marketer"] === person && !r["_isPaidOut"]
    );
  }
  if (person === "ED" || person === "Micah" || person === "Justin") {
    return ledgerRows.filter(r =>
      r["Sales Rep"] === person && !r["_isPaidOut"]
    );
  }
  return [];
}

function getPayoutHistory(retainerRows, ledgerRows, person) {
  const paid = [];
  retainerRows
    .filter(r => r["Person"] === person && r["Paid Out?"] && r["Paid Out?"].toLowerCase() === "yes")
    .forEach(r => paid.push({ month: r["Month"] || "", type: "Retainer", amount: money(r["Amount"]), batch: r["Payout Batch"] || "" }));

  const paidLedger = person === "Emma" || person === "Wyatt"
    ? ledgerRows.filter(r => r["Direct Marketer"] === person && r["_isPaidOut"])
    : ledgerRows.filter(r => r["Sales Rep"] === person && r["_isPaidOut"]);

  const batchMap = {};
  paidLedger.forEach(r => {
    const batch = r["Payout Batch / Month"] || "Unknown";
    if (!batchMap[batch]) batchMap[batch] = { month: batch, type: "Commission", amount: 0, batch };
    const comm = person === "Emma" ? money(r["Emma Commission"])
      : person === "Wyatt" ? money(r["Wyatt Commission"])
      : money(r["Sales Commission"]);
    batchMap[batch].amount += comm;
  });
  Object.values(batchMap).forEach(b => paid.push(b));

  return paid.sort((a, b) => a.month.localeCompare(b.month));
}

function getYTD(retainerRows, ledgerRows, person) {
  const year = new Date().getFullYear().toString();
  let total = 0;
  retainerRows
    .filter(r => r["Person"] === person && r["Paid Out?"] && r["Paid Out?"].toLowerCase() === "yes" && (r["Date"] || "").includes(year))
    .forEach(r => { total += money(r["Amount"]); });

  const paidLedger = person === "Emma" || person === "Wyatt"
    ? ledgerRows.filter(r => r["Direct Marketer"] === person && r["_isPaidOut"] && (r["Date"] || "").includes(year))
    : ledgerRows.filter(r => r["Sales Rep"] === person && r["_isPaidOut"] && (r["Date"] || "").includes(year));

  paidLedger.forEach(r => {
    const comm = person === "Emma" ? money(r["Emma Commission"])
      : person === "Wyatt" ? money(r["Wyatt Commission"])
      : money(r["Sales Commission"]);
    total += comm;
  });
  return total;
}

function PersonCard({ person, role, retainerRows, ledgerRows, peopleRows, onPayout }) {
  const isMarketer = person === "Emma" || person === "Wyatt";
  const unpaidRetainer = isMarketer ? getUnpaidRetainer(retainerRows, person) : [];
  const unpaidCommissions = getUnpaidCommissions(ledgerRows, person);
  const history = getPayoutHistory(retainerRows, ledgerRows, person);
  const ytd = getYTD(retainerRows, ledgerRows, person);
  const personInfo = peopleRows.find(r => r["Person"] === person) || {};
  const w9 = personInfo["W9 Collected"] || "No";

  const retainerTotal = unpaidRetainer.reduce((s, r) => s + money(r["Amount"]), 0);
  const commTotal = unpaidCommissions.reduce((s, r) => {
    const c = person === "Emma" ? money(r["Emma Commission"])
      : person === "Wyatt" ? money(r["Wyatt Commission"])
      : money(r["Sales Commission"]);
    return s + c;
  }, 0);
  const grandTotal = retainerTotal + commTotal;
  const ytdWarning = ytd >= 600;

  return (
    <div className="rounded-[24px] border border-white/10 bg-white/[0.05] p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-lg font-semibold text-white">{person}</div>
          <div className="text-xs text-slate-400">{role}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[10px] font-medium border ${w9 === "Yes" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-red-500/15 text-red-400 border-red-500/30"}`}>
            W-9 {w9}
          </span>
        </div>
      </div>

      {ytdWarning && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 px-3 py-2 text-xs text-amber-300">
          ⚠️ {person} has reached ${ytd.toFixed(0)} YTD — 1099-NEC required this tax year
        </div>
      )}

      <div className="space-y-2">
        {isMarketer && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Retainer unpaid</span>
            <span className="text-white font-medium">{fmt(retainerTotal)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-slate-400">Commission unpaid</span>
          <span className="text-white font-medium">{fmt(commTotal)}</span>
        </div>
        <div className="flex justify-between text-sm border-t border-white/10 pt-2">
          <span className="text-slate-300 font-medium">Total owed</span>
          <span className="text-cyan-300 font-semibold">{fmt(grandTotal)}</span>
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>YTD paid</span>
          <span>{fmt(ytd)}</span>
        </div>
      </div>

      <button
        type="button"
        onClick={() => onPayout(person)}
        disabled={grandTotal === 0}
        className="w-full rounded-2xl bg-cyan-400/10 border border-cyan-400/20 px-4 py-2.5 text-sm font-medium text-cyan-100 transition hover:bg-cyan-400/20 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        Pay Out {fmt(grandTotal)}
      </button>

      {history.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Payout History</div>
          {history.map((h, i) => (
            <div key={i} className="flex justify-between text-xs text-slate-400 border-b border-white/[0.04] pb-1">
              <span>#{i + 1} — {h.month} ({h.type})</span>
              <span className="text-slate-300">{fmt(h.amount)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PayrollPage() {
  const { rows: retainerRows = [] } = useTabData("RETAINER_LEDGER");
  const { rows: ledgerRows = [] } = useTabData("COMMISSION_LEDGER");
  const { rows: peopleRows = [] } = useTabData("PAYROLL_PEOPLE");
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [pinError, setPinError] = useState("");
  const [payoutConfirm, setPayoutConfirm] = useState(null);

  function unlock() {
    if (pin === FOUNDER_PIN) {
      setUnlocked(true);
      setPinError("");
    } else {
      setPinError("Incorrect PIN");
    }
  }

  function handlePayout(person) {
    validatePayout(person);
  }

  const [payoutProcessing, setPayoutProcessing] = useState(false);
  const [payoutResult, setPayoutResult] = useState(null);
  const [validationWarnings, setValidationWarnings] = useState([]);
  const [validationPerson, setValidationPerson] = useState(null);
  const showToast = useToast();

  function validatePayout(person) {
    const isSales = ["ED", "Micah", "Justin"].includes(person);
    const isMarketer = ["Emma", "Wyatt"].includes(person);
    const warnings = [];
    const unpaidLedger = isMarketer
      ? ledgerRows.filter(r => r["Direct Marketer"] === person && !r["_isPaidOut"])
      : ledgerRows.filter(r => r["Sales Rep"] === person && !r["_isPaidOut"]);
    unpaidLedger.forEach(r => {
      const attr = (r["Attribution Type"] || "").trim();
      const comm = parseFloat(String(
        person === "Emma" ? r["Emma Commission"] :
        person === "Wyatt" ? r["Wyatt Commission"] :
        r["Sales Commission"] || "0"
      ).replace(/[^0-9.-]/g, "")) || 0;
      const month = parseInt(String(r["Sales Rep Paid Month Count"] || "0").replace(/[^0-9]/g, "")) || 0;
      const customer = r["Customer Name"] || "Unknown";
      if (attr === "UNASSIGNED" || attr === "") warnings.push({ type: "error", msg: customer + " — no closer assigned yet" });
      if (comm === 0) warnings.push({ type: "warning", msg: customer + " — commission is $0.00" });
      if (isSales && month > 6) warnings.push({ type: "error", msg: customer + " — month " + month + " exceeds 6-month SALES window" });
    });
    const ids = unpaidLedger.map(r => (r["Invoice ID"] || "").trim()).filter(Boolean);
    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    if (dupes.length > 0) warnings.push({ type: "error", msg: "Duplicate Invoice IDs: " + [...new Set(dupes)].join(", ") });
    if (warnings.length > 0) { setValidationWarnings(warnings); setValidationPerson(person); }
    else setPayoutConfirm(person);
  }

  async function confirmPayout(person) {
    setPayoutProcessing(true);
    setPayoutConfirm(null);
    try {
      const res = await fetch("/api/sheets-write", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "payout", person }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Payout failed");
      setPayoutResult({ success: true, person, message: data.message, batchId: data.batchId });
      showToast(person + " payout complete", "success");
      showToast(`Payout complete — ${data.batchId}`, 'success');
    } catch (err) {
      setPayoutResult({ success: false, person, message: err.message });
      showToast("Payout failed — check logs", "error");
      showToast('Payout failed — check sheet permissions', 'error');
    } finally {
      setPayoutProcessing(false);
    }
  }

  if (!unlocked) {
    return (
      <div className="space-y-6 fade-in px-6 py-6">
        <div>
          <h1 className="text-2xl font-semibold text-white">Founder Payroll</h1>
          <p className="mt-1 text-sm text-slate-400">Restricted access. Enter founder PIN to continue.</p>
        </div>
        <div className="max-w-sm space-y-3">
          <input
            type="password"
            value={pin}
            onChange={e => setPin(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") unlock(); }}
            placeholder="Enter PIN"
            className="w-full rounded-2xl border border-white/10 bg-black/50 px-4 py-3 text-white outline-none"
          />
          {pinError && <div className="text-xs text-red-400">{pinError}</div>}
          <button
            type="button"
            onClick={unlock}
            className="w-full rounded-2xl py-3 text-sm font-medium transition-all duration-200" style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(6,182,212,0.2)",color:"rgba(6,182,212,0.9)"}}
          >
            Unlock
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 fade-in px-6 py-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Founder Payroll</h1>
          <p className="mt-1 text-sm text-slate-400">All payout data. Founder access only.</p>
        </div>
        <button
          type="button"
          onClick={() => setUnlocked(false)}
          className="rounded-xl bg-white/[0.04] px-3 py-1.5 text-xs text-slate-400 hover:text-white transition"
        >
          Lock
        </button>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-3">Marketers</div>
        <div className="grid gap-4 md:grid-cols-2">
          {["Emma", "Wyatt"].map(person => (
            <PersonCard
              key={person}
              person={person}
              role="Marketer"
              retainerRows={retainerRows}
              ledgerRows={ledgerRows}
              peopleRows={peopleRows}
              onPayout={handlePayout}
            />
          ))}
        </div>
      </div>

      <div>
        <div className="text-xs uppercase tracking-[0.18em] text-slate-500 mb-3">Sales</div>
        <div className="grid gap-4 md:grid-cols-2">
          {["ED", "Micah", "Justin"].map(person => (
            <PersonCard
              key={person}
              person={person}
              role="Sales Rep"
              retainerRows={retainerRows}
              ledgerRows={ledgerRows}
              peopleRows={peopleRows}
              onPayout={handlePayout}
            />
          ))}
        </div>
      </div>

      {validationWarnings.length > 0 && validationPerson && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] p-6 space-y-4"
            style={{background:"linear-gradient(160deg,rgba(10,14,20,0.97),rgba(6,10,16,0.98))",border:"1px solid rgba(255,255,255,0.07)",backdropFilter:"blur(60px)",boxShadow:"0 48px 100px rgba(0,0,0,0.7)"}}>
            <div>
              <h2 className="text-lg font-semibold text-white">Review Before Paying {validationPerson}</h2>
              <p className="text-xs text-zinc-500 mt-1">These issues were found. Fix them first or proceed anyway.</p>
            </div>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {validationWarnings.map((w, i) => (
                <div key={i} className="rounded-xl px-3 py-2.5 text-xs flex items-start gap-2"
                  style={{background:w.type==="error"?"rgba(239,68,68,0.08)":"rgba(245,158,11,0.08)",border:w.type==="error"?"1px solid rgba(239,68,68,0.2)":"1px solid rgba(245,158,11,0.2)",color:w.type==="error"?"#fca5a5":"#fcd34d"}}>
                  <span className="shrink-0">{w.type === "error" ? "✕" : "⚠"}</span>
                  <span>{w.msg}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-zinc-600">Rows with errors may calculate incorrectly if you proceed.</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => { setValidationWarnings([]); setValidationPerson(null); }}
                className="flex-1 rounded-2xl py-2.5 text-sm text-zinc-300 transition hover:text-white"
                style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.08)"}}>
                Fix Issues First
              </button>
              <button type="button" onClick={() => { setValidationWarnings([]); setPayoutConfirm(validationPerson); setValidationPerson(null); }}
                className="flex-1 rounded-2xl py-2.5 text-sm font-medium transition"
                style={{background:"rgba(245,158,11,0.12)",border:"1px solid rgba(245,158,11,0.25)",color:"#fcd34d"}}>
                Pay Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {payoutProcessing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#0b0b0f]/95 p-6 flex flex-col items-center gap-4">
            <div className="h-8 w-8 rounded-full border-2 border-white/10 border-t-cyan-400 animate-spin" />
            <p className="text-sm text-slate-300">Processing payout...</p>
          </div>
        </div>
      )}

      {payoutConfirm && !payoutProcessing && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#0b0b0f]/95 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Confirm Payout</h2>
            <p className="text-sm text-slate-400">
              Mark all unpaid amounts for <strong className="text-white">{payoutConfirm}</strong> as paid for {currentMonthLabel()}.
            </p>
            <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              This will write directly to your Google Sheet. Cannot be undone from the app.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setPayoutConfirm(null)} className="flex-1 rounded-2xl bg-white/[0.06] px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10 transition">Cancel</button>
              <button type="button" onClick={() => confirmPayout(payoutConfirm)} className="flex-1 rounded-2xl bg-cyan-400/15 border border-cyan-400/30 px-4 py-2.5 text-sm font-medium text-cyan-100 hover:bg-cyan-400/25 transition">Confirm Pay Out</button>
            </div>
          </div>
        </div>
      )}

      {payoutResult && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#0b0b0f]/95 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">
              {payoutResult.success ? "Payout Complete" : "Payout Failed"}
            </h2>
            <p className="text-sm text-slate-300">{payoutResult.message}</p>
            {payoutResult.success && (
              <p className="text-xs text-slate-500">Batch ID: {payoutResult.batchId}</p>
            )}
            {!payoutResult.success && (
              <p className="text-xs text-red-400">Check your Google Sheet permissions and try again.</p>
            )}
            <button
              type="button"
              onClick={() => setPayoutResult(null)}
              className="w-full rounded-2xl bg-white/[0.06] px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10 transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
