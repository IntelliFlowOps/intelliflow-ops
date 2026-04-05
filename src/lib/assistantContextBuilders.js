function firstDefined(...values) {
  for (const value of values) {
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
}

function getTab(data = {}, names = []) {
  for (const name of names) {
    if (Array.isArray(data?.[name])) return data[name];
  }
  return [];
}

export function sliceRows(rows, limit = 25) {
  if (!Array.isArray(rows)) return [];
  return rows.slice(0, limit);
}

export function compactRow(row, allowedKeys) {
  if (!row || typeof row !== "object") return {};
  const output = {};

  allowedKeys.forEach((key) => {
    const value = row[key];
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      output[key] = value;
    }
  });

  return output;
}

function toNumber(value) {
  const raw = String(value ?? "").replace(/[^0-9.-]/g, "");
  const num = parseFloat(raw);
  return Number.isFinite(num) ? num : 0;
}

function fmt$(n) {
  return '$' + round2(n).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(n) {
  return round2(n) + '%';
}

function summarizeCampaigns(rows = []) {
  const totals = {
    spend: 0,
    leads: 0,
    qualifiedLeads: 0,
    impressions: 0,
    clicks: 0,
    customersWon: 0,
    revenueWon: 0,
  };

  rows.forEach((row) => {
    totals.spend += toNumber(row["Spend"]);
    totals.leads += toNumber(row["Leads"]);
    totals.qualifiedLeads += toNumber(row["Qualified Leads"]);
    totals.impressions += toNumber(row["Impressions"]);
    totals.clicks += toNumber(row["Clicks"]);
    totals.customersWon += toNumber(row["Customers Won"]);
    totals.revenueWon += toNumber(row["Revenue Won"]);
  });

  const avgCtr =
    totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
  const avgCpl = totals.leads > 0 ? totals.spend / totals.leads : 0;
  const avgCac =
    totals.customersWon > 0 ? totals.spend / totals.customersWon : 0;
  const closeRate =
    totals.leads > 0 ? (totals.customersWon / totals.leads) * 100 : 0;

  return {
    spend: fmt$(totals.spend),
    leads: totals.leads,
    qualifiedLeads: totals.qualifiedLeads,
    impressions: totals.impressions,
    clicks: totals.clicks,
    customersWon: totals.customersWon,
    revenueWon: fmt$(totals.revenueWon),
    avgCtr: fmtPct(avgCtr),
    avgCpl: fmt$(avgCpl),
    avgCac: fmt$(avgCac),
    closeRate: fmtPct(closeRate),
  };
}

function summarizeByKey(rows = [], keyName) {
  const map = new Map();

  rows.forEach((row) => {
    const key = String(row?.[keyName] ?? "").trim() || "Unknown";
    if (!map.has(key)) {
      map.set(key, {
        key,
        spend: 0,
        leads: 0,
        customersWon: 0,
        clicks: 0,
        impressions: 0,
        revenueWon: 0,
      });
    }

    const bucket = map.get(key);
    bucket.spend += toNumber(row["Spend"]);
    bucket.leads += toNumber(row["Leads"]);
    bucket.customersWon += toNumber(row["Customers Won"]);
    bucket.clicks += toNumber(row["Clicks"]);
    bucket.impressions += toNumber(row["Impressions"]);
    bucket.revenueWon += toNumber(row["Revenue Won"]);
  });

  return Array.from(map.values())
    .map((item) => ({
      [keyName]: item.key,
      Spend: fmt$(item.spend),
      Leads: item.leads,
      CustomersWon: item.customersWon,
      RevenueWon: fmt$(item.revenueWon),
      CTR: item.impressions > 0 ? fmtPct((item.clicks / item.impressions) * 100) : "0%",
      CPL: item.leads > 0 ? fmt$(item.spend / item.leads) : "$0",
      CAC: item.customersWon > 0 ? fmt$(item.spend / item.customersWon) : "$0",
      CloseRate: item.leads > 0 ? fmtPct((item.customersWon / item.leads) * 100) : "0%",
    }))
    .sort((a, b) => b.CustomersWon - a.CustomersWon || toNumber(a.CAC) - toNumber(b.CAC))
    .slice(0, 10);
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function emptyNote(label) {
  return `No ${label} data available yet.`;
}

function nowTimestamp() {
  return new Date().toLocaleString("en-US", { timeZone: "America/Indiana/Indianapolis", dateStyle: "medium", timeStyle: "short" });
}

// ═══════════════════════════════════════════════════════════════════════════
// FOUNDER ASSISTANT CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

export function buildFounderAssistantContext(data = {}, extra = {}) {
  const dashboardRows = getTab(data, ["DASHBOARD", "Dashboard"]);
  const campaignRows = getTab(data, ["CAMPAIGNS", "Campaigns"]);
  const customerRows = getTab(data, ["CUSTOMERS", "Customers"]);
  const analyticsRows = getTab(data, ["ALL_ANALYTICS", "All Analytics", "Analytics"]);
  const ledgerRows = getTab(data, ["COMMISSION_LEDGER", "Commission_Ledger"]);
  const retainerRows = getTab(data, ["RETAINER_LEDGER", "Retainer_Ledger"]);
  const teamRows = getTab(data, ["PAYROLL_PEOPLE", "Payroll People", "team_members"]);
  const payoutRows = getTab(data, ["PAYOUT_BATCHES", "Payout Batches"]);

  // ── Customers breakdown ──
  const activeCustomers = customerRows.filter(r => String(r["Status"] || "").trim() === "Active");
  const atRiskCustomers = customerRows.filter(r => String(r["Status"] || "").trim() === "At Risk");
  const churnedCustomers = customerRows.filter(r => String(r["Status"] || "").trim() === "Churned");
  const mrr = activeCustomers.reduce((sum, r) => sum + toNumber(r["MRR / Revenue"]), 0);

  const customerList = customerRows.length > 0
    ? sliceRows(customerRows, 50).map(r => ({
        name: r["Customer Name"] || "Unknown",
        status: r["Status"] || "Unknown",
        mrr: r["MRR / Revenue"] || "0",
        attribution: r["Attribution Type"] || "FOUNDER",
        assignedTo: r["Direct Marketer"] || r["Sales Rep"] || "Founder",
        monthsActive: r["Months Active"] || 0,
        lastPayment: r["Last Payment Date"] || "N/A",
      }))
    : emptyNote("customer");

  const atRiskList = atRiskCustomers.length > 0
    ? atRiskCustomers.map(r => ({
        name: r["Customer Name"] || "Unknown",
        lastPayment: r["Last Payment Date"] || "N/A",
        mrr: r["MRR / Revenue"] || "0",
      }))
    : "No at-risk customers.";

  // ── Revenue ──
  const now = new Date();
  const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  const lastMonth = now.getMonth() === 0
    ? (now.getFullYear() - 1) + '-12'
    : now.getFullYear() + '-' + String(now.getMonth()).padStart(2, '0');

  let revenueMTD = 0;
  let revenueLastMonth = 0;
  ledgerRows.forEach(row => {
    const date = String(row["Date"] || "").slice(0, 7);
    const rev = toNumber(row["Revenue Collected"]);
    if (date === thisMonth) revenueMTD += rev;
    if (date === lastMonth) revenueLastMonth += rev;
  });

  // ── Commission breakdown by person ──
  const unpaidByPerson = {};
  const totalByPerson = {};
  ledgerRows.forEach(row => {
    const paid = ["yes","paid","y","1","true"].includes(String(row["Paid Out?"] || "").toLowerCase().trim());
    const emma = toNumber(row["Emma Commission"]);
    const wyatt = toNumber(row["Wyatt Commission"]);
    const salesAmt = toNumber(row["Sales Commission"]);
    const salesRep = String(row["Sales Rep"] || row["Direct Marketer"] || "").trim();

    if (emma > 0) {
      totalByPerson["Emma"] = (totalByPerson["Emma"] || 0) + emma;
      if (!paid) unpaidByPerson["Emma"] = (unpaidByPerson["Emma"] || 0) + emma;
    }
    if (wyatt > 0) {
      totalByPerson["Wyatt"] = (totalByPerson["Wyatt"] || 0) + wyatt;
      if (!paid) unpaidByPerson["Wyatt"] = (unpaidByPerson["Wyatt"] || 0) + wyatt;
    }
    if (salesAmt > 0 && salesRep) {
      totalByPerson[salesRep] = (totalByPerson[salesRep] || 0) + salesAmt;
      if (!paid) unpaidByPerson[salesRep] = (unpaidByPerson[salesRep] || 0) + salesAmt;
    }
  });

  const unpaidFormatted = Object.keys(unpaidByPerson).length > 0
    ? Object.fromEntries(Object.entries(unpaidByPerson).map(([k, v]) => [k, fmt$(v)]))
    : "No unpaid commissions.";

  const totalUnpaid = Object.values(unpaidByPerson).reduce((a, b) => a + b, 0);

  // ── Team ──
  const team = teamRows.length > 0
    ? teamRows.map(r => ({
        name: r["Person"] || r["name"] || "Unknown",
        role: r["Role"] || r["role"] || "Unknown",
        commissionPath: r["Commission Path"] || r["commission_path"] || "N/A",
        commissionRate: r["commission_rate"] ? fmtPct(toNumber(r["commission_rate"]) * 100) : "N/A",
        retainer: r["Retainer Amount"] || r["retainer_amount"] || "0",
        totalEarned: fmt$(totalByPerson[r["Person"] || r["name"] || ""] || 0),
        unpaidOwed: fmt$(unpaidByPerson[r["Person"] || r["name"] || ""] || 0),
      }))
    : emptyNote("team");

  // ── Payout history ──
  let payoutThisMonth = 0;
  let payoutThisYear = 0;
  let payoutTotal = 0;
  const thisYear = String(now.getFullYear());
  payoutRows.forEach(row => {
    const amt = toNumber(row["Total Paid"]);
    const date = String(row["Date"] || "");
    payoutTotal += amt;
    if (date.slice(0, 4) === thisYear) payoutThisYear += amt;
    if (date.slice(0, 7) === thisMonth) payoutThisMonth += amt;
  });

  const recentPayouts = payoutRows.length > 0
    ? sliceRows(payoutRows, 10).map(r => ({
        date: r["Date"] || "N/A",
        person: r["Person"] || "Unknown",
        type: r["Type"] || "N/A",
        amount: fmt$(toNumber(r["Total Paid"])),
      }))
    : emptyNote("payout");

  // ── Retainer summary ──
  let retainersPaidThisMonth = 0;
  retainerRows.forEach(row => {
    const paid = ["yes","paid","y","1","true"].includes(String(row["Paid Out?"] || "").toLowerCase().trim());
    if (paid) retainersPaidThisMonth += toNumber(row["Amount"]);
  });

  return {
    assistant: "founder",
    dataAsOf: nowTimestamp(),
    northStarGoal: 2000,
    opsDeskProduct: "OpsDesk (second product): AI-powered command center for service businesses. $449/month. Separate app and database. Commission structure uses the same plans table with product = 'OpsDesk'.",
    customerOverview: {
      totalCustomers: customerRows.length,
      active: activeCustomers.length,
      atRisk: atRiskCustomers.length,
      churned: churnedCustomers.length,
      mrr: fmt$(mrr),
    },
    customerList,
    atRiskCustomers: atRiskList,
    revenue: {
      mrr: fmt$(mrr),
      revenueMTD: fmt$(revenueMTD),
      revenueLastMonth: fmt$(revenueLastMonth),
    },
    commissions: {
      totalUnpaid: fmt$(totalUnpaid),
      unpaidByPerson: unpaidFormatted,
      allTimeTotalByPerson: Object.keys(totalByPerson).length > 0
        ? Object.fromEntries(Object.entries(totalByPerson).map(([k, v]) => [k, fmt$(v)]))
        : "No commission data.",
    },
    team,
    payouts: {
      totalAllTime: fmt$(payoutTotal),
      thisYear: fmt$(payoutThisYear),
      thisMonth: fmt$(payoutThisMonth),
      retainersPaid: fmt$(retainersPaidThisMonth),
      recentPayouts,
    },
    campaignSummary: campaignRows.length > 0 ? summarizeCampaigns(campaignRows) : emptyNote("campaign"),
    topPlatforms: campaignRows.length > 0 ? summarizeByKey(campaignRows, "Platform") : emptyNote("platform"),
    topNiches: campaignRows.length > 0 ? summarizeByKey(campaignRows, "Niche") : emptyNote("niche"),
    campaigns: campaignRows.length > 0
      ? sliceRows(campaignRows, 20).map((row) =>
          compactRow(row, ["Platform","Campaign Name","Spend","Leads","Customers Won","Revenue Won","CPL","CAC","Close Rate","Status","Niche","Hook","CTA"])
        )
      : emptyNote("campaign"),
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// MARKETER ASSISTANT CONTEXT
// ═══════════════════════════════════════════════════════════════════════════

export function buildMarketerAssistantContext(data = {}, extra = {}) {
  const dashboardRows = getTab(data, ["DASHBOARD", "Dashboard"]);
  const campaignRows = getTab(data, ["CAMPAIGNS", "Campaigns"]);
  const analyticsRows = getTab(data, ["ALL_ANALYTICS", "All Analytics", "Analytics"]);
  const customerRows = getTab(data, ["CUSTOMERS", "Customers"]);
  const creativeRows = getTab(data, ["CREATIVE_INSIGHTS", "Creative Insights"]);

  const selectedPlatform = extra.platform || null;
  const selectedNiche = extra.niche || null;

  const filteredCampaigns = campaignRows.filter((row) => {
    const platformMatch = selectedPlatform ? String(row?.Platform || "").trim() === selectedPlatform : true;
    const nicheMatch = selectedNiche ? String(row?.Niche || "").trim() === selectedNiche : true;
    return platformMatch && nicheMatch;
  });

  const filteredAnalytics = analyticsRows.filter((row) => {
    return selectedPlatform ? String(row?.Platform || "").trim() === selectedPlatform : true;
  });

  const filteredCustomers = customerRows.filter((row) => {
    const rowNiche = String(firstDefined(row?.Niche, row?.["Industry / Niche"], row?.Industry, row?.Vertical) || "").trim();
    return selectedNiche ? rowNiche === selectedNiche : true;
  });

  const effectiveCampaigns = filteredCampaigns.length ? filteredCampaigns : campaignRows;
  const effectiveAnalytics = filteredAnalytics.length ? filteredAnalytics : analyticsRows;

  // ── Winning hooks and CTAs from campaign data ──
  const winningHooks = campaignRows
    .filter(r => toNumber(r["Customers Won"]) > 0 && r["Hook"])
    .sort((a, b) => toNumber(b["Customers Won"]) - toNumber(a["Customers Won"]))
    .slice(0, 5)
    .map(r => ({ hook: r["Hook"], customersWon: toNumber(r["Customers Won"]), niche: r["Niche"] || "" }));

  const winningCTAs = campaignRows
    .filter(r => toNumber(r["Customers Won"]) > 0 && r["CTA"])
    .sort((a, b) => toNumber(b["Customers Won"]) - toNumber(a["Customers Won"]))
    .slice(0, 5)
    .map(r => ({ cta: r["CTA"], customersWon: toNumber(r["Customers Won"]), niche: r["Niche"] || "" }));

  const topConvertingNiches = summarizeByKey(campaignRows, "Niche")
    .filter(n => n.CustomersWon > 0)
    .slice(0, 5);

  // ── Creative insights ──
  const creativeInsights = creativeRows.length > 0
    ? sliceRows(creativeRows, 15).map(r => compactRow(r, [
        "Date", "Platform", "Niche", "Winning Hook", "Winning CTA",
        "Best Creative Type", "What Is Not Working", "Next Test Idea", "Notes",
      ]))
    : emptyNote("creative insights");

  // ── Customer count by industry ──
  const industryMap = {};
  customerRows.forEach(r => {
    const industry = String(r["Industry / Niche"] || r["Industry"] || "").trim();
    if (industry) industryMap[industry] = (industryMap[industry] || 0) + 1;
  });
  const customersByIndustry = Object.keys(industryMap).length > 0
    ? Object.fromEntries(Object.entries(industryMap).sort((a, b) => b[1] - a[1]))
    : emptyNote("industry");

  // ── Ad spend by platform ──
  const platformSpend = {};
  let totalSpendMTD = 0;
  const now = new Date();
  const thisMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  campaignRows.forEach(r => {
    const date = String(r["Date"] || "").slice(0, 7);
    const spend = toNumber(r["Spend"]);
    const platform = String(r["Platform"] || "").trim() || "Unknown";
    if (date === thisMonth) {
      totalSpendMTD += spend;
      platformSpend[platform] = (platformSpend[platform] || 0) + spend;
    }
  });

  return {
    assistant: "marketer",
    dataAsOf: nowTimestamp(),
    marketerMode: extra.marketerMode || "chat",
    opsDeskProduct: "OpsDesk (second product): AI-powered command center for service businesses. $449/month. Separate app and database. Commission structure uses the same plans table with product = 'OpsDesk'.",
    winningHooks: winningHooks.length > 0 ? winningHooks : emptyNote("winning hooks"),
    winningCTAs: winningCTAs.length > 0 ? winningCTAs : emptyNote("winning CTAs"),
    topConvertingNiches: topConvertingNiches.length > 0 ? topConvertingNiches : emptyNote("niche conversion"),
    creativeInsights,
    customersByIndustry,
    adSpend: {
      totalMTD: fmt$(totalSpendMTD),
      byPlatformMTD: Object.keys(platformSpend).length > 0
        ? Object.fromEntries(Object.entries(platformSpend).map(([k, v]) => [k, fmt$(v)]))
        : emptyNote("platform spend"),
    },
    company: {
      name: "IntelliFlow Communications",
      positioning: "AI communications automation for service businesses that turns missed demand into booked revenue",
      ctaRule: "Never use book a demo or similar CTA language. Prefer start, get started, launch, activate, sign up.",
      icp: [
        "HVAC",
        "Chiropractor",
        "Dentist",
        "Roofer",
        "Med Spa",
        "Plumbing",
        "Auto Repair",
        "Construction",
        "Pest Control",
        "Lawn Care",
        "Vet",
      ],
    },
    platform: selectedPlatform,
    niche: selectedNiche,
    dataAvailability: {
      dashboardRows: dashboardRows.length,
      campaignRows: campaignRows.length,
      analyticsRows: analyticsRows.length,
      customerRows: customerRows.length,
      creativeInsightsRows: creativeRows.length,
      filteredCampaignRows: filteredCampaigns.length,
      filteredAnalyticsRows: filteredAnalytics.length,
    },
    winningMetricsPriority: [
      "Customers Won",
      "Close Rate",
      "CAC",
      "CPL",
    ],
    campaignSummary: campaignRows.length > 0 ? summarizeCampaigns(effectiveCampaigns) : emptyNote("campaign"),
    topPlatforms: campaignRows.length > 0 ? summarizeByKey(campaignRows, "Platform") : emptyNote("platform"),
    topNiches: campaignRows.length > 0 ? summarizeByKey(campaignRows, "Niche") : emptyNote("niche"),
    selectedPlatformSummary: selectedPlatform
      ? summarizeCampaigns(campaignRows.filter((row) => String(row?.Platform || "").trim() === selectedPlatform))
      : null,
    selectedNicheSummary: selectedNiche
      ? summarizeCampaigns(campaignRows.filter((row) => String(row?.Niche || "").trim() === selectedNiche))
      : null,
    dashboard: dashboardRows.length > 0 ? sliceRows(dashboardRows, 15) : emptyNote("dashboard"),
    campaigns: campaignRows.length > 0
      ? sliceRows(effectiveCampaigns, 25).map((row) =>
          compactRow(row, [
            "Platform",
            "Campaign Name",
            "Spend",
            "Leads",
            "Qualified Leads",
            "Impressions",
            "Clicks",
            "CTR",
            "CPC",
            "Customers Won",
            "Revenue Won",
            "CPL",
            "CAC",
            "Close Rate",
            "Status",
            "Niche",
            "Hook",
            "CTA",
            "Creative Type",
            "Offer",
            "Managed By",
            "Campaign ID / Link",
          ])
        )
      : emptyNote("campaign"),
    analytics: analyticsRows.length > 0
      ? sliceRows(effectiveAnalytics, 25).map((row) =>
          compactRow(row, [
            "Platform",
            "Campaign Name",
            "Spend",
            "Impressions",
            "Clicks",
            "CTR",
            "CPC",
            "Leads",
            "CPL",
            "CAC",
            "Close Rate",
            "Customers Won",
            "Revenue Won",
            "Status",
            "Notes",
          ])
        )
      : emptyNote("analytics"),
    customers: customerRows.length > 0 ? sliceRows(filteredCustomers, 15) : emptyNote("customer"),
  };
}


/* ===== IntelliFlow Pricing Knowledge (shared marketing context layer) ===== */

export const INTELLIFLOW_PRICING_CONTEXT = `
Starter Plan:
$299/month
600 texts included
No voice minutes

Pro Plan:
$499/month
1,500 texts included
400 voice minutes included

Premium Plan:
$999/month
4,000 texts included
1,000 voice minutes included

Commission Base Rule:
Commission base for annual clients always uses the monthly equivalent: Starter = $299, Pro = $499, Premium = $999. Never calculate commission from the annual total.

Overages:

Starter
$0.12/text

Pro
$0.10/text
$0.25/voice-minute

Premium
$0.08/text
$0.20/voice-minute

Usage Notifications:

70% usage alert
90% usage alert
100% usage triggers overages

Escalation Policy:

Human escalation is safety net only
Frequent escalation means upgrade tier

Company Stage Context:

Paid ads not launched yet
Close rate unknown
CAC unknown

Instruction:

Do not assume benchmarks
Recommend testing strategy instead
`;

export function buildTaxAssistantContext(data = {}) {
  const expenseRows = getTab(data, ["EXPENSES"]);
  const distributionRows = getTab(data, ["DISTRIBUTIONS"]);
  const ledgerRows = getTab(data, ["COMMISSION_LEDGER", "Commission_Ledger"]);
  const retainerRows = getTab(data, ["RETAINER_LEDGER"]);

  const currentYear = new Date().getFullYear().toString();
  const today = new Date();

  // Summarize expenses by category
  const expensesByCategory = {};
  let totalExpenses = 0;
  expenseRows.forEach(row => {
    const amt = toNumber(row["Amount"]);
    const cat = String(row["Category"] || "Uncategorized").trim();
    const yr = String(row["Tax Year"] || row["Date"] || "").slice(0, 4);
    if (yr === currentYear || yr === "") {
      expensesByCategory[cat] = (expensesByCategory[cat] || 0) + amt;
      totalExpenses += amt;
    }
  });

  // Summarize distributions
  const distributions = { Kyle: 0, Brennan: 0, total: 0 };
  distributionRows.forEach(row => {
    const amt = toNumber(row["Amount"]);
    const owner = String(row["Owner"] || "").trim();
    const yr = String(row["Tax Year"] || row["Date"] || "").slice(0, 4);
    if (yr === currentYear || yr === "") {
      if (owner === "Kyle") distributions.Kyle += amt;
      else if (owner === "Brennan") distributions.Brennan += amt;
      distributions.total += amt;
    }
  });

  // Summarize contractor payments from ledger
  const contractors = {};
  ledgerRows.forEach(row => {
    const paid = String(row["Paid Out?"] || "").toLowerCase();
    if (!["yes","paid","y","1","true"].includes(paid)) return;
    ["Emma", "Wyatt"].forEach(name => {
      const col = name + " Commission";
      const amt = toNumber(row[col]);
      if (amt > 0) contractors[name] = (contractors[name] || 0) + amt;
    });
    const salesRep = String(row["Sales Rep"] || "").trim();
    const salesAmt = toNumber(row["Sales Commission"]);
    if (salesRep && salesAmt > 0) {
      contractors[salesRep] = (contractors[salesRep] || 0) + salesAmt;
    }
  });
  // Add retainer payments
  retainerRows.forEach(row => {
    const paid = String(row["Paid Out?"] || "").toLowerCase();
    if (!["yes","paid","y","1","true"].includes(paid)) return;
    const person = String(row["Person"] || "").trim();
    const amt = toNumber(row["Amount"]);
    if (person && amt > 0) contractors[person] = (contractors[person] || 0) + amt;
  });

  const needs1099 = Object.entries(contractors).filter(([, amt]) => amt >= 600);
  const totalContractorPayments = Object.values(contractors).reduce((a, b) => a + b, 0);

  // Calculate upcoming tax deadlines
  const deadlines = [
    { date: new Date(parseInt(currentYear), 3, 15), label: "Q1 Estimated Tax Payment (Form 1040-ES)" },
    { date: new Date(parseInt(currentYear), 5, 16), label: "Q2 Estimated Tax Payment (Form 1040-ES)" },
    { date: new Date(parseInt(currentYear), 8, 15), label: "Q3 Estimated Tax Payment (Form 1040-ES)" },
    { date: new Date(parseInt(currentYear) + 1, 0, 15), label: "Q4 Estimated Tax Payment (Form 1040-ES)" },
    { date: new Date(parseInt(currentYear) + 1, 0, 31), label: "1099-NEC Filing Deadline (contractors)" },
    { date: new Date(parseInt(currentYear) + 1, 2, 15), label: "Partnership Return Due (Form 1065)" },
    { date: new Date(parseInt(currentYear) + 1, 2, 15), label: "K-1s Due to Partners" },
  ];

  const upcomingDeadlines = deadlines
    .filter(d => d.date >= today)
    .sort((a, b) => a.date - b.date)
    .slice(0, 4)
    .map(d => {
      const daysUntil = Math.ceil((d.date - today) / (1000 * 60 * 60 * 24));
      return {
        label: d.label,
        date: d.date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        daysUntil,
        urgent: daysUntil <= 30,
      };
    });

  return {
    assistant: "tax",
    dataAsOf: nowTimestamp(),
    taxYear: currentYear,
    today: today.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    totalExpenses: round2(totalExpenses),
    expensesByCategory,
    distributions,
    contractors,
    totalContractorPayments: round2(totalContractorPayments),
    needs1099,
    upcomingDeadlines,
    urgentDeadlines: upcomingDeadlines.filter(d => d.urgent),
  };
}
