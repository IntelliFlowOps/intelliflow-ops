import { useMemo, useState } from "react";
import { useTabData } from "../hooks/useSheetData.jsx";
import EmptyState from "../components/EmptyState.jsx";
import LoadingSpinner from "../components/LoadingSpinner.jsx";

const FOUNDER_PIN = "2343";

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
  if (person === "ED" || person === "Micah") {
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
    setPayoutConfirm(person);
  }

  const [payoutInstructions, setPayoutInstructions] = useState(null);
  const [copied, setCopied] = useState(false);

  function confirmPayout(person) {
    const month = currentMonthLabel();
    const next = nextMonthLabel();
    const isMarketer = person === "Emma" || person === "Wyatt";
    const batchId = "PAY-" + new Date().toISOString().slice(0, 7) + "-" + person.toUpperCase();
    const d = new Date();
    const nextFirst = new Date(d.getFullYear(), d.getMonth() + 1, 1).toISOString().slice(0, 10);

    let instructions = "Process payout for " + person + " — Batch ID: " + batchId + "\n\n";

    if (isMarketer) {
      instructions += "STEP 1 — RETAINER_LEDGER\n";
      instructions += "Find all rows where Person = " + person + " and Paid Out? is blank.\n";
      instructions += "Set Paid Out? = Yes\n";
      instructions += "Set Payout Batch = " + batchId + "\n\n";
      instructions += "Then append a new retainer row:\n";
      instructions += "Date: " + nextFirst + "\n";
      instructions += "Person: " + person + "\n";
      instructions += "Amount: 200\n";
      instructions += "Month: " + next + "\n";
      instructions += "Payment Type: Retainer\n";
      instructions += "Payment Method: Check\n";
      instructions += "Paid Out?: (blank)\n";
      instructions += "Notes: Contract Labor – Marketer Retainer\n\n";
    }

    instructions += (isMarketer ? "STEP 2" : "STEP 1") + " — COMMISSION_LEDGER\n";
    if (isMarketer) {
      instructions += "Find all rows where Direct Marketer = " + person + " and Paid Out? is blank.\n";
    } else {
      instructions += "Find all rows where Sales Rep = " + person + " and Paid Out? is blank.\n";
    }
    instructions += "Set Paid Out? = Yes\n";
    instructions += "Set Payout Batch / Month = " + batchId + "\n\n";

    instructions += (isMarketer ? "STEP 3" : "STEP 2") + " — PAYOUT_BATCHES\n";
    instructions += "Append one row:\n";
    instructions += "Batch ID: " + batchId + "\n";
    instructions += "Person: " + person + "\n";
    instructions += "Role: " + (isMarketer ? "Marketer" : "Sales") + "\n";
    instructions += "Paid Date: " + new Date().toISOString().slice(0, 10) + "\n";
    instructions += "Method: Check\n";
    instructions += "Notes: " + month + " payout\n\n";
    instructions += "Complete all steps in one session. Confirm when done.";

    setPayoutInstructions({ person, batchId, month, text: instructions });
    setPayoutConfirm(null);
  }

  function copyInstructions() {
    if (payoutInstructions) {
      navigator.clipboard.writeText(payoutInstructions.text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
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
            className="w-full rounded-2xl bg-white text-black py-3 font-semibold transition hover:opacity-90"
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
          {["ED", "Micah"].map(person => (
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

      {payoutConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#0b0b0f]/95 p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white">Confirm Payout</h2>
            <p className="text-sm text-slate-400">
              Mark all unpaid amounts for <strong className="text-white">{payoutConfirm}</strong> as paid for {currentMonthLabel()}.
            </p>
            <p className="text-xs text-amber-300 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
              After confirming, copy the agent instructions and paste them to your sheet agent.
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setPayoutConfirm(null)} className="flex-1 rounded-2xl bg-white/[0.06] px-4 py-2.5 text-sm text-slate-300 hover:bg-white/10 transition">Cancel</button>
              <button type="button" onClick={() => confirmPayout(payoutConfirm)} className="flex-1 rounded-2xl bg-cyan-400/15 border border-cyan-400/30 px-4 py-2.5 text-sm font-medium text-cyan-100 hover:bg-cyan-400/25 transition">Generate Instructions</button>
            </div>
          </div>
        </div>
      )}

      {payoutInstructions && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-[#0b0b0f]/95 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Agent Instructions — {payoutInstructions.person}</h2>
              <button type="button" onClick={() => setPayoutInstructions(null)} className="text-slate-400 hover:text-white text-sm">✕</button>
            </div>
            <p className="text-xs text-slate-400">Copy everything below and paste it to your sheet agent exactly as written.</p>
            <div className="rounded-xl bg-black/40 border border-white/10 p-4 max-h-64 overflow-y-auto">
              <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono">{payoutInstructions.text}</pre>
            </div>
            <button
              type="button"
              onClick={copyInstructions}
              className="w-full rounded-2xl bg-cyan-400/15 border border-cyan-400/30 px-4 py-3 text-sm font-medium text-cyan-100 hover:bg-cyan-400/25 transition"
            >
              {copied ? "Copied!" : "Copy to Clipboard"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
