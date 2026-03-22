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

export function buildFounderAssistantContext(data = {}, extra = {}) {
  const dashboardRows = Array.isArray(data?.DASHBOARD) ? data.DASHBOARD : [];
  const campaignRows = Array.isArray(data?.CAMPAIGNS) ? data.CAMPAIGNS : [];
  const customerRows = Array.isArray(data?.CUSTOMERS) ? data.CUSTOMERS : [];
  const analyticsRows = Array.isArray(data?.ANALYTICS) ? data.ANALYTICS : [];

  return {
    assistant: "founder",
    northStarGoal: 2000,
    currentStageNote: "Optimize for the path to 2,000 clients. Current stage changes bottleneck, not destination.",
    selectedPlatform: extra.platform || null,
    selectedNiche: extra.niche || null,
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
  const dashboardRows = Array.isArray(data?.DASHBOARD) ? data.DASHBOARD : [];
  const campaignRows = Array.isArray(data?.CAMPAIGNS) ? data.CAMPAIGNS : [];
  const analyticsRows = Array.isArray(data?.ANALYTICS) ? data.ANALYTICS : [];
  const customerRows = Array.isArray(data?.CUSTOMERS) ? data.CUSTOMERS : [];

  const selectedPlatform = extra.platform || null;
  const selectedNiche = extra.niche || null;

  const filteredCampaigns = campaignRows.filter((row) => {
    const platformMatch = selectedPlatform ? row?.Platform === selectedPlatform : true;
    const nicheMatch = selectedNiche ? row?.Niche === selectedNiche : true;
    return platformMatch && nicheMatch;
  });

  const filteredAnalytics = analyticsRows.filter((row) => {
    return selectedPlatform ? row?.Platform === selectedPlatform : true;
  });

  const filteredCustomers = customerRows.filter((row) => {
    return selectedNiche
      ? String(row?.Niche || row?.Industry || "").trim() === selectedNiche
      : true;
  });

  return {
    assistant: "marketer",
    marketerMode: extra.marketerMode || "chat",
    platform: selectedPlatform,
    niche: selectedNiche,
    winningMetricsPriority: [
      "Customers Won",
      "Close Rate",
      "CAC",
      "CPL",
    ],
    dashboard: sliceRows(dashboardRows, 15),
    campaigns: sliceRows(filteredCampaigns, 25).map((row) =>
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
    analytics: sliceRows(filteredAnalytics, 25).map((row) =>
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
