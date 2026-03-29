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
    spend: round2(totals.spend),
    leads: totals.leads,
    qualifiedLeads: totals.qualifiedLeads,
    impressions: totals.impressions,
    clicks: totals.clicks,
    customersWon: totals.customersWon,
    revenueWon: round2(totals.revenueWon),
    avgCtr: round2(avgCtr),
    avgCpl: round2(avgCpl),
    avgCac: round2(avgCac),
    closeRate: round2(closeRate),
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
      Spend: round2(item.spend),
      Leads: item.leads,
      CustomersWon: item.customersWon,
      RevenueWon: round2(item.revenueWon),
      CTR: item.impressions > 0 ? round2((item.clicks / item.impressions) * 100) : 0,
      CPL: item.leads > 0 ? round2(item.spend / item.leads) : 0,
      CAC: item.customersWon > 0 ? round2(item.spend / item.customersWon) : 0,
      CloseRate: item.leads > 0 ? round2((item.customersWon / item.leads) * 100) : 0,
    }))
    .sort((a, b) => b.CustomersWon - a.CustomersWon || a.CAC - b.CAC)
    .slice(0, 10);
}

function round2(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function buildFounderAssistantContext(data = {}, extra = {}) {
  const dashboardRows = getTab(data, ["DASHBOARD", "Dashboard"]);
  const campaignRows = getTab(data, ["CAMPAIGNS", "Campaigns"]);
  const customerRows = getTab(data, ["CUSTOMERS", "Customers"]);
  const analyticsRows = getTab(data, ["ALL_ANALYTICS", "All Analytics", "Analytics"]);
  const ledgerRows = getTab(data, ["COMMISSION_LEDGER", "Commission_Ledger"]);

  // Commission totals from ledger
  const commissionTotals = { Emma: 0, Wyatt: 0, sales: 0, total: 0 };
  const unpaidCommissions = { Emma: 0, Wyatt: 0, sales: 0 };
  ledgerRows.forEach(row => {
    const paid = ["yes","paid","y","1","true"].includes(String(row["Paid Out?"] || "").toLowerCase().trim());
    const emma = toNumber(row["Emma Commission"]);
    const wyatt = toNumber(row["Wyatt Commission"]);
    const sales = toNumber(row["Sales Commission"]);
    commissionTotals.Emma += emma;
    commissionTotals.Wyatt += wyatt;
    commissionTotals.sales += sales;
    commissionTotals.total += emma + wyatt + sales;
    if (!paid) {
      unpaidCommissions.Emma += emma;
      unpaidCommissions.Wyatt += wyatt;
      unpaidCommissions.sales += sales;
    }
  });

  // MRR and active customers
  const activeCustomers = customerRows.filter(r =>
    String(r["Status"] || "").toLowerCase() === "active"
  );
  const mrr = activeCustomers.reduce((sum, r) => sum + toNumber(r["MRR / Revenue"]), 0);

  return {
    assistant: "founder",
    northStarGoal: 2000,
    liveMetrics: {
      activeCustomers: activeCustomers.length,
      mrr: round2(mrr),
      totalCommissionsPaid: round2(commissionTotals.total),
      unpaidCommissions: {
        Emma: round2(unpaidCommissions.Emma),
        Wyatt: round2(unpaidCommissions.Wyatt),
        sales: round2(unpaidCommissions.sales),
      },
    },
    campaignSummary: summarizeCampaigns(campaignRows),
    topPlatforms: summarizeByKey(campaignRows, "Platform"),
    topNiches: summarizeByKey(campaignRows, "Niche"),
    dashboard: sliceRows(dashboardRows, 15),
    campaigns: sliceRows(campaignRows, 20).map((row) =>
      compactRow(row, ["Platform","Campaign Name","Spend","Leads","Customers Won","Revenue Won","CPL","CAC","Close Rate","Status","Niche","Hook","CTA"])
    ),
    customers: sliceRows(customerRows, 15),
  };
}

export function buildMarketerAssistantContext(data = {}, extra = {}) {
  const dashboardRows = getTab(data, ["DASHBOARD", "Dashboard"]);
  const campaignRows = getTab(data, ["CAMPAIGNS", "Campaigns"]);
  const analyticsRows = getTab(data, ["ALL_ANALYTICS", "All Analytics", "Analytics"]);
  const customerRows = getTab(data, ["CUSTOMERS", "Customers"]);

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
    const rowNiche = String(firstDefined(row?.Niche, row?.Industry, row?.Vertical) || "").trim();
    return selectedNiche ? rowNiche === selectedNiche : true;
  });

  const effectiveCampaigns = filteredCampaigns.length ? filteredCampaigns : campaignRows;
  const effectiveAnalytics = filteredAnalytics.length ? filteredAnalytics : analyticsRows;

  // Surface winning hooks and CTAs from campaign data
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

  return {
    assistant: "marketer",
    marketerMode: extra.marketerMode || "chat",
    winningHooks,
    winningCTAs,
    topConvertingNiches,
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
      filteredCampaignRows: filteredCampaigns.length,
      filteredAnalyticsRows: filteredAnalytics.length,
    },
    winningMetricsPriority: [
      "Customers Won",
      "Close Rate",
      "CAC",
      "CPL",
    ],
    campaignSummary: summarizeCampaigns(effectiveCampaigns),
    topPlatforms: summarizeByKey(campaignRows, "Platform"),
    topNiches: summarizeByKey(campaignRows, "Niche"),
    selectedPlatformSummary: selectedPlatform
      ? summarizeCampaigns(campaignRows.filter((row) => String(row?.Platform || "").trim() === selectedPlatform))
      : null,
    selectedNicheSummary: selectedNiche
      ? summarizeCampaigns(campaignRows.filter((row) => String(row?.Niche || "").trim() === selectedNiche))
      : null,
    dashboard: sliceRows(dashboardRows, 15),
    campaigns: sliceRows(effectiveCampaigns, 25).map((row) =>
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
    ),
    analytics: sliceRows(effectiveAnalytics, 25).map((row) =>
      compactRow(row, [
        "Platform",
        "Campaign Name",
        "Spend",
        "Impressions",
        "Clicks",
        "CTR",
        "CPC",
        "Status",
        "Notes",
      ])
    ),
    customers: sliceRows(filteredCustomers, 15),
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
