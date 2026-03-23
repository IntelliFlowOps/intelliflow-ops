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
  const analyticsRows = getTab(data, ["ANALYTICS", "All Analytics", "Analytics"]);

  return {
    assistant: "founder",
    northStarGoal: 2000,
    selectedPlatform: extra.platform || null,
    selectedNiche: extra.niche || null,
    dataAvailability: {
      dashboardRows: dashboardRows.length,
      campaignRows: campaignRows.length,
      analyticsRows: analyticsRows.length,
      customerRows: customerRows.length,
    },
    campaignSummary: summarizeCampaigns(campaignRows),
    topPlatforms: summarizeByKey(campaignRows, "Platform"),
    topNiches: summarizeByKey(campaignRows, "Niche"),
    dashboard: sliceRows(dashboardRows, 15),
    campaigns: sliceRows(campaignRows, 20).map((row) =>
      compactRow(row, [
        "Platform",
        "Campaign Name",
        "Spend",
        "Leads",
        "Qualified Leads",
        "Customers Won",
        "Revenue Won",
        "CPL",
        "CAC",
        "Close Rate",
        "Status",
        "Niche",
        "Hook",
        "CTA",
        "Offer",
      ])
    ),
    analytics: sliceRows(analyticsRows, 20).map((row) =>
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
    customers: sliceRows(customerRows, 15),
  };
}

export function buildMarketerAssistantContext(data = {}, extra = {}) {
  const dashboardRows = getTab(data, ["DASHBOARD", "Dashboard"]);
  const campaignRows = getTab(data, ["CAMPAIGNS", "Campaigns"]);
  const analyticsRows = getTab(data, ["ANALYTICS", "All Analytics", "Analytics"]);
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

  return {
    assistant: "marketer",
    marketerMode: extra.marketerMode || "chat",
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
