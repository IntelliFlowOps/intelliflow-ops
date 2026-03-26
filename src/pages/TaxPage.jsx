import { useMemo, useState } from 'react';
import { useTabData } from '../hooks/useSheetData.jsx';
import { useSheetData } from '../hooks/useSheetData.jsx';
import { useToast } from '../components/Toast.jsx';
import EmptyState from '../components/EmptyState.jsx';

const EXPENSE_CATEGORIES = [
  'Advertising','Software / SaaS','Contractor Payment','Equipment',
  'Office Supplies','Travel','Meals & Entertainment','Legal / Professional',
  'Phone / Internet','Other'
];

const TAX_DEADLINES = [
  { date: '2026-01-15', label: 'Q4 2025 Estimated Tax Payment', type: 'quarterly', urgent: false },
  { date: '2026-01-31', label: '1099-NEC Filing Deadline', type: '1099', urgent: false },
  { date: '2026-03-15', label: 'Form 1065 Partnership Return Due', type: 'filing', urgent: false },
  { date: '2026-04-15', label: 'Q1 2026 Estimated Tax Payment', type: 'quarterly', urgent: false },
  { date: '2026-06-15', label: 'Q2 2026 Estimated Tax Payment', type: 'quarterly', urgent: false },
  { date: '2026-09-15', label: 'Q3 2026 Estimated Tax Payment', type: 'quarterly', urgent: false },
  { date: '2027-01-15', label: 'Q4 2026 Estimated Tax Payment', type: 'quarterly', urgent: false },
];

function money(v) {
  const n = parseFloat(String(v || '0').replace(/[^0-9.-]/g, ''));
  return isFinite(n) ? n : 0;
}

function fmt(v) {
  return '$' + Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function getUpcomingDeadlines() {
  const today = new Date();
  const in60 = new Date(today.getTime() + 60 * 24 * 60 * 60 * 1000);
  return TAX_DEADLINES.filter(d => {
    const dt = new Date(d.date);
    return dt >= today;
  }).map(d => ({
    ...d,
    daysAway: Math.ceil((new Date(d.date) - today) / (1000 * 60 * 60 * 24)),
    urgent: Math.ceil((new Date(d.date) - today) / (1000 * 60 * 60 * 24)) <= 30,
  })).slice(0, 4);
}

export default function TaxPage() {
  const { rows: expenses = [] } = useTabData('EXPENSES');
  const { rows: distributions = [] } = useTabData('DISTRIBUTIONS');
  const { rows: ledger = [] } = useTabData('COMMISSION_LEDGER');
  const { rows: retainer = [] } = useTabData('RETAINER_LEDGER');
  const { data } = useSheetData();
  const showToast = useToast();

  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear.toString());
  const [activeTab, setActiveTab] = useState('overview');
  const [expenseModal, setExpenseModal] = useState(false);
  const [distModal, setDistModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [expenseForm, setExpenseForm] = useState({
    date: new Date().toISOString().split('T')[0],
    amount: '', category: 'Software / SaaS', description: '', vendor: '', notes: '',
  });
  const [distForm, setDistForm] = useState({ owner: 'Kyle', amount: '', notes: '' });

  const years = useMemo(() => {
    const ys = new Set([currentYear.toString(), (currentYear - 1).toString()]);
    expenses.forEach(e => { if (e['Tax Year']) ys.add(e['Tax Year']); });
    distributions.forEach(d => { if (d['Tax Year']) ys.add(d['Tax Year']); });
    return [...ys].sort().reverse();
  }, [expenses, distributions, currentYear]);

  const taxData = useMemo(() => {
    const yr = selectedYear;

    // Revenue — from Commission_Ledger Revenue Collected for the year
    const revenue = ledger.filter(r => (r['Date'] || '').startsWith(yr))
      .reduce((s, r) => s + money(r['Revenue Collected']), 0);

    // Expenses
    const yearExpenses = expenses.filter(e => (e['Tax Year'] || e['Date'] || '').includes(yr));
    const expenseTotal = yearExpenses.reduce((s, e) => s + money(e['Amount']), 0);
    const byCategory = yearExpenses.reduce((acc, e) => {
      const cat = e['Category'] || 'Other';
      acc[cat] = (acc[cat] || 0) + money(e['Amount']);
      return acc;
    }, {});

    // Contractor payments from RETAINER_LEDGER + Commission_Ledger
    const contractors = {};
    retainer.filter(r => (r['Date'] || '').startsWith(yr) && r['_isPaidOut'] !== false).forEach(r => {
      const p = r['Person'] || '';
      if (p) contractors[p] = (contractors[p] || 0) + money(r['Amount']);
    });
    ['Emma','Wyatt'].forEach(p => {
      ledger.filter(r => (r['Date'] || '').startsWith(yr) && r['Direct Marketer'] === p && r['_isPaidOut']).forEach(r => {
        contractors[p] = (contractors[p] || 0) + money(r['Emma Commission'] || r['Wyatt Commission']);
      });
    });
    ['ED','Micah','Justin'].forEach(p => {
      ledger.filter(r => (r['Date'] || '').startsWith(yr) && r['Sales Rep'] === p && r['_isPaidOut']).forEach(r => {
        contractors[p] = (contractors[p] || 0) + money(r['Sales Commission']);
      });
    });
    const contractorTotal = Object.values(contractors).reduce((s, v) => s + v, 0);
    const needs1099 = Object.entries(contractors).filter(([, v]) => v >= 600);

    // Distributions
    const yearDist = distributions.filter(d => (d['Tax Year'] || d['Date'] || '').includes(yr));
    const kyleDist = yearDist.filter(d => d['Owner'] === 'Kyle').reduce((s, d) => s + money(d['Amount']), 0);
    const brennanDist = yearDist.filter(d => d['Owner'] === 'Brennan').reduce((s, d) => s + money(d['Amount']), 0);

    // Net profit
    const netProfit = revenue - expenseTotal - contractorTotal;
    const eachShare = netProfit * 0.5;

    // Tax estimates (cash basis LLC, Indiana)
    // Self-employment tax: 15.3% on 92.35% of net SE income
    const seTax = eachShare > 0 ? eachShare * 0.9235 * 0.153 : 0;
    const seDeduction = seTax / 2; // above-the-line deduction
    const federalTaxableIncome = eachShare - seDeduction;
    // Federal income tax estimate — 22% bracket for under $50k (simplified)
    const federalRate = federalTaxableIncome < 41775 ? 0.12 : 0.22;
    const federalTax = federalTaxableIncome > 0 ? federalTaxableIncome * federalRate : 0;
    // Indiana flat 3.05%
    const stateTax = eachShare > 0 ? eachShare * 0.0305 : 0;
    const totalPersonalTax = seTax + federalTax + stateTax;
    const quarterlyPayment = totalPersonalTax / 4;

    return {
      revenue, expenseTotal, byCategory, yearExpenses,
      contractorTotal, contractors, needs1099,
      kyleDist, brennanDist, netProfit, eachShare,
      seTax, federalTax, stateTax, totalPersonalTax, quarterlyPayment,
    };
  }, [selectedYear, expenses, distributions, ledger, retainer]);

  async function saveExpense() {
    if (!expenseForm.amount || !expenseForm.category) return;
    setSaving(true);
    try {
      const res = await fetch('/api/log-expense', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseForm),
      });
      if (!res.ok) throw new Error('Failed');
      showToast('Expense logged', 'success');
      setExpenseModal(false);
      setExpenseForm({ date: new Date().toISOString().split('T')[0], amount: '', category: 'Software / SaaS', description: '', vendor: '', notes: '' });
    } catch { showToast('Failed to save expense', 'error'); }
    finally { setSaving(false); }
  }

  async function saveDist() {
    if (!distForm.amount) return;
    setSaving(true);
    try {
      const res = await fetch('/api/log-distribution', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(distForm),
      });
      if (!res.ok) throw new Error('Failed');
      showToast(`${distForm.owner} distribution logged`, 'success');
      setDistModal(false);
      setDistForm({ owner: 'Kyle', amount: '', notes: '' });
    } catch { showToast('Failed to save distribution', 'error'); }
    finally { setSaving(false); }
  }

  async function generatePDF(type) {
    const { default: jsPDF } = await import('jspdf');
    const doc = new jsPDF();
    const yr = selectedYear;
    const td = taxData;
    const pageW = doc.internal.pageSize.getWidth();

    const drawHeader = (title, subtitle) => {
      doc.setFillColor(2, 6, 12);
      doc.rect(0, 0, pageW, 35, 'F');
      doc.setTextColor(6, 182, 212);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('IntelliFlow Communications', 15, 14);
      doc.setFontSize(11);
      doc.setTextColor(200, 200, 200);
      doc.text(title, 15, 22);
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(subtitle, 15, 29);
      doc.text(`Generated ${new Date().toLocaleDateString()}`, pageW - 15, 29, { align: 'right' });
    };

    const drawDivider = (y) => {
      doc.setDrawColor(30, 40, 60);
      doc.line(15, y, pageW - 15, y);
    };

    const drawSection = (title, y) => {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(6, 182, 212);
      doc.text(title.toUpperCase(), 15, y);
      return y + 6;
    };

    const drawRow = (label, value, y, highlight = false) => {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(highlight ? 255 : 180, highlight ? 255 : 180, highlight ? 255 : 180);
      doc.text(label, 20, y);
      doc.setFont('helvetica', highlight ? 'bold' : 'normal');
      doc.setTextColor(highlight ? 6 : 220, highlight ? 182 : 220, highlight ? 212 : 220);
      doc.text(value, pageW - 15, y, { align: 'right' });
      return y + 6;
    };

    if (type === 'business') {
      drawHeader(`Tax Year ${yr} — Business Summary`, 'IntelliFlow Communications LLC · EIN on file · Partnership Return (Form 1065)');
      let y = 45;

      doc.setFillColor(8, 14, 24);
      doc.roundedRect(15, y, pageW - 30, 28, 3, 3, 'F');
      doc.setFontSize(9); doc.setTextColor(120,120,120); doc.setFont('helvetica','normal');
      doc.text('GROSS REVENUE', 22, y + 9);
      doc.text('TOTAL EXPENSES', pageW/2, y + 9, { align: 'center' });
      doc.text('NET PROFIT', pageW - 22, y + 9, { align: 'right' });
      doc.setFontSize(14); doc.setFont('helvetica','bold');
      doc.setTextColor(6,182,212); doc.text(fmt(td.revenue), 22, y + 20);
      doc.setTextColor(239,68,68); doc.text(fmt(td.expenseTotal + td.contractorTotal), pageW/2, y + 20, { align: 'center' });
      doc.setTextColor(td.netProfit >= 0 ? 16 : 239, td.netProfit >= 0 ? 185 : 68, td.netProfit >= 0 ? 129 : 68);
      doc.text(fmt(td.netProfit), pageW - 22, y + 20, { align: 'right' });
      y += 36;

      drawDivider(y); y += 8;
      y = drawSection('Revenue', y); y += 2;
      y = drawRow('Total Revenue Collected (Cash Basis)', fmt(td.revenue), y);
      y = drawRow('Each Owner\'s Share (50%)', fmt(td.revenue * 0.5), y);
      y += 4; drawDivider(y); y += 8;

      y = drawSection('Business Expenses', y); y += 2;
      Object.entries(td.byCategory).sort((a,b) => b[1]-a[1]).forEach(([cat, amt]) => {
        y = drawRow(cat, fmt(amt), y);
      });
      y = drawRow('Expense Subtotal', fmt(td.expenseTotal), y, true);
      y += 4; drawDivider(y); y += 8;

      y = drawSection('Contractor Payments (1099-NEC)', y); y += 2;
      Object.entries(td.contractors).forEach(([name, amt]) => {
        const flag = amt >= 600 ? '  ← 1099 REQUIRED' : '';
        y = drawRow(name + flag, fmt(amt), y, amt >= 600);
      });
      y = drawRow('Contractor Subtotal', fmt(td.contractorTotal), y, true);
      y += 4; drawDivider(y); y += 8;

      y = drawSection('1099-NEC Summary', y); y += 2;
      if (td.needs1099.length === 0) {
        doc.setFontSize(9); doc.setTextColor(120,120,120);
        doc.text('No contractors have exceeded $600 threshold yet.', 20, y); y += 6;
      } else {
        td.needs1099.forEach(([name, amt]) => {
          y = drawRow(`${name} — 1099-NEC required (due Jan 31)`, fmt(amt), y, true);
        });
      }
      y += 4; drawDivider(y); y += 8;

      y = drawSection('Owner Distributions', y); y += 2;
      y = drawRow('Kyle', fmt(td.kyleDist), y);
      y = drawRow('Brennan', fmt(td.brennanDist), y);
      y += 4; drawDivider(y); y += 8;

      doc.setFontSize(8); doc.setTextColor(80,80,80); doc.setFont('helvetica','italic');
      const disclaimer = 'This report is generated from your IntelliFlow Operations data and is intended as a financial reference tool. It is not tax advice. Please consult a licensed CPA or tax professional before filing.';
      const lines = doc.splitTextToSize(disclaimer, pageW - 30);
      doc.text(lines, 15, y);

      doc.save(`intelliflow-business-tax-${yr}.pdf`);
      showToast('Business tax summary downloaded', 'success');
    }

    if (type === 'kyle' || type === 'brennan') {
      const owner = type === 'kyle' ? 'Kyle' : 'Brennan';
      const ownerDist = type === 'kyle' ? td.kyleDist : td.brennanDist;
      drawHeader(`Tax Year ${yr} — ${owner}'s Personal Tax Summary`, `50% Owner · IntelliFlow Communications LLC · Indiana Resident`);
      let y = 45;

      doc.setFillColor(8, 14, 24);
      doc.roundedRect(15, y, pageW - 30, 28, 3, 3, 'F');
      doc.setFontSize(9); doc.setTextColor(120,120,120); doc.setFont('helvetica','normal');
      doc.text('SHARE OF PROFIT', 22, y + 9);
      doc.text('EST. TOTAL TAX', pageW/2, y + 9, { align: 'center' });
      doc.text('QUARTERLY PAYMENT', pageW - 22, y + 9, { align: 'right' });
      doc.setFontSize(14); doc.setFont('helvetica','bold');
      doc.setTextColor(6,182,212); doc.text(fmt(td.eachShare), 22, y + 20);
      doc.setTextColor(239,68,68); doc.text(fmt(td.totalPersonalTax), pageW/2, y + 20, { align: 'center' });
      doc.setTextColor(245,158,11); doc.text(fmt(td.quarterlyPayment), pageW - 22, y + 20, { align: 'right' });
      y += 36;

      drawDivider(y); y += 8;
      y = drawSection('Income from LLC (Pass-Through)', y); y += 2;
      y = drawRow('Business Net Profit', fmt(td.netProfit), y);
      y = drawRow(`${owner}'s 50% Share`, fmt(td.eachShare), y, true);
      y = drawRow('Owner Distributions Taken', fmt(ownerDist), y);
      y += 4; drawDivider(y); y += 8;

      y = drawSection('Self-Employment Tax (Schedule SE)', y); y += 2;
      y = drawRow('SE Net Earnings (92.35% of share)', fmt(td.eachShare * 0.9235), y);
      y = drawRow('SE Tax Rate', '15.3%', y);
      y = drawRow('SE Tax Owed', fmt(td.seTax), y, true);
      y = drawRow('SE Deduction (50% of SE tax)', fmt(td.seTax / 2), y);
      y += 4; drawDivider(y); y += 8;

      y = drawSection('Federal Income Tax Estimate', y); y += 2;
      y = drawRow('Adjusted Gross Income', fmt(td.eachShare - td.seTax / 2), y);
      y = drawRow('Estimated Rate (12% bracket)', '12%', y);
      y = drawRow('Estimated Federal Tax', fmt(td.federalTax), y, true);
      y += 4; drawDivider(y); y += 8;

      y = drawSection('Indiana State Income Tax', y); y += 2;
      y = drawRow('Indiana Flat Rate', '3.05%', y);
      y = drawRow('Estimated State Tax', fmt(td.stateTax), y, true);
      y += 4; drawDivider(y); y += 8;

      y = drawSection('Quarterly Estimated Payment Schedule', y); y += 2;
      const quarters = [
        { label: 'Q1 (Apr 15)', period: 'Jan 1 – Mar 31' },
        { label: 'Q2 (Jun 15)', period: 'Apr 1 – May 31' },
        { label: 'Q3 (Sep 15)', period: 'Jun 1 – Aug 31' },
        { label: 'Q4 (Jan 15)', period: 'Sep 1 – Dec 31' },
      ];
      quarters.forEach(q => {
        y = drawRow(`${q.label} · ${q.period}`, fmt(td.quarterlyPayment), y);
      });
      y += 4; drawDivider(y); y += 8;

      y = drawSection('Tax Summary', y); y += 2;
      y = drawRow('Self-Employment Tax', fmt(td.seTax), y);
      y = drawRow('Federal Income Tax', fmt(td.federalTax), y);
      y = drawRow('Indiana State Tax', fmt(td.stateTax), y);
      y = drawRow('TOTAL ESTIMATED TAX', fmt(td.totalPersonalTax), y, true);

      y += 8;
      doc.setFontSize(8); doc.setTextColor(80,80,80); doc.setFont('helvetica','italic');
      const disclaimer = 'These are estimates based on current data and simplified tax rates. Your actual tax liability depends on other income, deductions, and credits. Consult a licensed CPA before filing. Indiana county taxes may also apply.';
      const lines = doc.splitTextToSize(disclaimer, pageW - 30);
      doc.text(lines, 15, y);

      doc.save(`intelliflow-${owner.toLowerCase()}-personal-tax-${yr}.pdf`);
      showToast(`${owner}'s personal tax summary downloaded`, 'success');
    }
  }

  const deadlines = getUpcomingDeadlines();

  const glassCard = {
    background: 'linear-gradient(160deg, rgba(255,255,255,0.028) 0%, rgba(255,255,255,0.006) 100%)',
    border: '1px solid rgba(255,255,255,0.07)',
    backdropFilter: 'blur(40px)',
    boxShadow: '0 16px 40px rgba(0,0,0,0.4)',
    borderRadius: 20,
    padding: 20,
  };

  return (
    <div className="space-y-6 px-6 py-6">
      {/* Deadline banner */}
      {deadlines.some(d => d.urgent) && (
        <div className="rounded-[18px] px-4 py-3 flex items-start gap-3"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
          <span className="text-amber-400 text-lg shrink-0">⚠</span>
          <div>
            <div className="text-sm font-medium text-amber-300">Tax Deadline Approaching</div>
            {deadlines.filter(d => d.urgent).map(d => (
              <div key={d.date} className="text-xs text-amber-400/70 mt-0.5">{d.label} — {d.daysAway} days away</div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming deadlines */}
      <div style={glassCard}>
        <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 mb-3">Upcoming Tax Deadlines</div>
        <div className="space-y-2">
          {deadlines.map(d => (
            <div key={d.date} className="flex items-center justify-between rounded-xl px-3 py-2.5"
              style={{
                background: d.urgent ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)',
                border: d.urgent ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.05)',
              }}>
              <div>
                <div className="text-sm text-white">{d.label}</div>
                <div className="text-[10px] text-zinc-500">{new Date(d.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</div>
              </div>
              <div className="text-xs font-medium shrink-0 ml-3"
                style={{ color: d.urgent ? '#fcd34d' : '#71717a' }}>
                {d.daysAway}d
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Year selector + action buttons */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="text-[10px] uppercase tracking-wider text-zinc-500">Tax Year</div>
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}
            className="rounded-xl px-3 py-2 text-sm text-white outline-none"
            style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setExpenseModal(true)}
            className="rounded-xl px-3 py-2 text-xs font-medium transition"
            style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.25)', color: '#67e8f9' }}>
            + Add Expense
          </button>
          <button onClick={() => setDistModal(true)}
            className="rounded-xl px-3 py-2 text-xs font-medium transition"
            style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}>
            + Log Distribution
          </button>
        </div>
      </div>

      {/* Financial overview */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: 'Revenue', value: fmt(taxData.revenue), color: '#67e8f9' },
          { label: 'Expenses', value: fmt(taxData.expenseTotal + taxData.contractorTotal), color: '#f87171' },
          { label: 'Net Profit', value: fmt(taxData.netProfit), color: taxData.netProfit >= 0 ? '#10b981' : '#ef4444' },
          { label: 'Each Owner\'s Share', value: fmt(taxData.eachShare), color: '#a5b4fc' },
        ].map(k => (
          <div key={k.label} className="rounded-[18px] p-4" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <div className="text-[10px] uppercase tracking-wider text-zinc-500">{k.label}</div>
            <div className="mt-1 text-xl font-bold" style={{ color: k.color }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl p-1" style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.06)' }}>
        {['overview','expenses','contractors','distributions'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className="flex-1 rounded-lg py-2 text-xs font-medium capitalize transition"
            style={activeTab === tab ? { background: 'rgba(6,182,212,0.15)', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.25)' } : { color: '#71717a' }}>
            {tab}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div style={glassCard}>
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 mb-4">Expenses by Category</div>
            {Object.keys(taxData.byCategory).length === 0 ? (
              <EmptyState title="No expenses logged yet" description="Click + Add Expense to start tracking deductions." />
            ) : (
              <div className="space-y-2">
                {Object.entries(taxData.byCategory).sort((a,b) => b[1]-a[1]).map(([cat, amt]) => {
                  const pct = taxData.expenseTotal > 0 ? (amt / taxData.expenseTotal) * 100 : 0;
                  return (
                    <div key={cat}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-zinc-300">{cat}</span>
                        <span className="text-zinc-400">{fmt(amt)}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #06b6d4, #0891b2)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div style={glassCard}>
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 mb-4">Personal Tax Estimates (Per Owner)</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Self-Employment Tax', value: fmt(taxData.seTax), note: '15.3% on 92.35% of share' },
                { label: 'Federal Income Tax', value: fmt(taxData.federalTax), note: '12% bracket estimate' },
                { label: 'Indiana State Tax', value: fmt(taxData.stateTax), note: '3.05% flat rate' },
                { label: 'Quarterly Payment', value: fmt(taxData.quarterlyPayment), note: 'Pay 4x per year' },
              ].map(k => (
                <div key={k.label} className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="text-[10px] text-zinc-500">{k.label}</div>
                  <div className="text-lg font-bold text-white mt-1">{k.value}</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">{k.note}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Generate PDFs */}
          <div style={glassCard}>
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 mb-4">Generate Tax Reports — {selectedYear}</div>
            <div className="grid gap-3 md:grid-cols-3">
              <button onClick={() => generatePDF('business')}
                className="rounded-xl p-4 text-left transition hover:opacity-80"
                style={{ background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)' }}>
                <div className="text-2xl mb-2">🏢</div>
                <div className="text-sm font-semibold text-white">Business Summary</div>
                <div className="text-xs text-zinc-500 mt-1">Revenue, expenses, contractor payments, 1099 flags</div>
              </button>
              <button onClick={() => generatePDF('kyle')}
                className="rounded-xl p-4 text-left transition hover:opacity-80"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                <div className="text-2xl mb-2">👤</div>
                <div className="text-sm font-semibold text-white">Kyle's Personal Summary</div>
                <div className="text-xs text-zinc-500 mt-1">SE tax, federal + Indiana estimates, quarterly schedule</div>
              </button>
              <button onClick={() => generatePDF('brennan')}
                className="rounded-xl p-4 text-left transition hover:opacity-80"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
                <div className="text-2xl mb-2">👤</div>
                <div className="text-sm font-semibold text-white">Brennan's Personal Summary</div>
                <div className="text-xs text-zinc-500 mt-1">SE tax, federal + Indiana estimates, quarterly schedule</div>
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        <div style={glassCard}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500">Expense Ledger — {selectedYear}</div>
            <span className="text-xs text-zinc-500">{taxData.yearExpenses?.length || 0} entries · {fmt(taxData.expenseTotal)} total</span>
          </div>
          {!taxData.yearExpenses?.length ? (
            <EmptyState title="No expenses yet" description="Add your first business expense using the button above." />
          ) : (
            <div className="space-y-2">
              {taxData.yearExpenses.map((e, i) => (
                <div key={i} className="rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-white truncate">{e['Description'] || e['Category']}</span>
                      <span className="rounded-full px-2 py-0.5 text-[10px]"
                        style={{ background: 'rgba(6,182,212,0.1)', color: '#67e8f9', border: '1px solid rgba(6,182,212,0.2)' }}>
                        {e['Category']}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-500 mt-0.5">{e['Date']}{e['Vendor'] ? ` · ${e['Vendor']}` : ''}</div>
                  </div>
                  <span className="text-sm font-semibold text-white shrink-0">{fmt(e['Amount'])}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'contractors' && (
        <div style={glassCard}>
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 mb-4">Contractor Payments — {selectedYear}</div>
          {Object.keys(taxData.contractors).length === 0 ? (
            <EmptyState title="No contractor payments yet" description="Paid commissions and retainers will appear here." />
          ) : (
            <div className="space-y-3">
              {Object.entries(taxData.contractors).map(([name, amt]) => (
                <div key={name} className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{
                    background: amt >= 600 ? 'rgba(245,158,11,0.06)' : 'rgba(255,255,255,0.02)',
                    border: amt >= 600 ? '1px solid rgba(245,158,11,0.2)' : '1px solid rgba(255,255,255,0.05)',
                  }}>
                  <div>
                    <div className="text-sm font-medium text-white">{name}</div>
                    {amt >= 600 && <div className="text-[10px] text-amber-400 mt-0.5">1099-NEC required · due Jan 31</div>}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: amt >= 600 ? '#fcd34d' : '#ffffff' }}>{fmt(amt)}</span>
                </div>
              ))}
              <div className="rounded-xl px-4 py-3 flex items-center justify-between mt-2"
                style={{ background: 'rgba(6,182,212,0.06)', border: '1px solid rgba(6,182,212,0.15)' }}>
                <span className="text-sm text-zinc-300">Total Contractor Payments</span>
                <span className="text-sm font-bold text-cyan-300">{fmt(taxData.contractorTotal)}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'distributions' && (
        <div style={glassCard}>
          <div className="text-[10px] uppercase tracking-[0.22em] text-zinc-500 mb-4">Owner Distributions — {selectedYear}</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
              <div className="text-[10px] text-zinc-500">Kyle</div>
              <div className="text-xl font-bold text-indigo-300 mt-1">{fmt(taxData.kyleDist)}</div>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}>
              <div className="text-[10px] text-zinc-500">Brennan</div>
              <div className="text-xl font-bold text-amber-300 mt-1">{fmt(taxData.brennanDist)}</div>
            </div>
          </div>
          {!distributions.filter(d => (d['Tax Year'] || '').includes(selectedYear)).length ? (
            <EmptyState title="No distributions logged" description="Use + Log Distribution when you take money out of the business." />
          ) : (
            <div className="space-y-2">
              {distributions.filter(d => (d['Tax Year'] || d['Date'] || '').includes(selectedYear)).map((d, i) => (
                <div key={i} className="rounded-xl px-4 py-3 flex items-center justify-between"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div>
                    <div className="text-sm font-medium text-white">{d['Owner']}</div>
                    <div className="text-[11px] text-zinc-500">{d['Date']}{d['Notes'] ? ` · ${d['Notes']}` : ''}</div>
                  </div>
                  <span className="text-sm font-semibold text-white">{fmt(d['Amount'])}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Expense Modal */}
      {expenseModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] p-6 space-y-4"
            style={{ background: 'linear-gradient(160deg,rgba(10,14,20,0.97),rgba(6,10,16,0.98))', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(60px)', boxShadow: '0 48px 100px rgba(0,0,0,0.7)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Add Business Expense</h2>
              <button onClick={() => setExpenseModal(false)} className="text-zinc-500 hover:text-white text-xl">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Date</label>
                <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(f => ({...f, date: e.target.value}))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Amount <span className="text-red-400">*</span></label>
                <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(f => ({...f, amount: e.target.value}))}
                  placeholder="0.00" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Category <span className="text-red-400">*</span></label>
                <select value={expenseForm.category} onChange={e => setExpenseForm(f => ({...f, category: e.target.value}))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Description</label>
                <input value={expenseForm.description} onChange={e => setExpenseForm(f => ({...f, description: e.target.value}))}
                  placeholder="What was this for?" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Vendor</label>
                <input value={expenseForm.vendor} onChange={e => setExpenseForm(f => ({...f, vendor: e.target.value}))}
                  placeholder="Company name" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Notes</label>
                <input value={expenseForm.notes} onChange={e => setExpenseForm(f => ({...f, notes: e.target.value}))}
                  placeholder="Optional" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            </div>
            <div className="flex gap-3 pt-1">
              <button onClick={() => setExpenseModal(false)}
                className="flex-1 rounded-2xl py-2.5 text-sm text-zinc-400 transition hover:text-white"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
              <button onClick={saveExpense} disabled={!expenseForm.amount || saving}
                className="flex-1 rounded-2xl py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ background: 'rgba(6,182,212,0.12)', border: '1px solid rgba(6,182,212,0.3)', color: '#67e8f9' }}>
                {saving ? 'Saving...' : 'Save Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Modal */}
      {distModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[28px] p-6 space-y-4"
            style={{ background: 'linear-gradient(160deg,rgba(10,14,20,0.97),rgba(6,10,16,0.98))', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(60px)', boxShadow: '0 48px 100px rgba(0,0,0,0.7)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Log Distribution</h2>
              <button onClick={() => setDistModal(false)} className="text-zinc-500 hover:text-white text-xl">✕</button>
            </div>
            <p className="text-xs text-zinc-500">Record money taken out of the business by an owner. This affects your personal tax estimates.</p>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Owner</label>
                <select value={distForm.owner} onChange={e => setDistForm(f => ({...f, owner: e.target.value}))}
                  className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <option value="Kyle">Kyle</option>
                  <option value="Brennan">Brennan</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Amount <span className="text-red-400">*</span></label>
                <input type="number" value={distForm.amount} onChange={e => setDistForm(f => ({...f, amount: e.target.value}))}
                  placeholder="0.00" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase tracking-wider text-zinc-500">Notes</label>
                <input value={distForm.notes} onChange={e => setDistForm(f => ({...f, notes: e.target.value}))}
                  placeholder="Optional reason" className="w-full rounded-xl px-3 py-2.5 text-sm text-white outline-none"
                  style={{ background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.1)' }} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDistModal(false)}
                className="flex-1 rounded-2xl py-2.5 text-sm text-zinc-400 transition hover:text-white"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>Cancel</button>
              <button onClick={saveDist} disabled={!distForm.amount || saving}
                className="flex-1 rounded-2xl py-2.5 text-sm font-medium transition disabled:opacity-40"
                style={{ background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
                {saving ? 'Saving...' : 'Log Distribution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
