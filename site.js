import {
  PERSONAL_DOMAIN,
  PROJECT_DOMAINS,
  formatChange,
  formatViews,
  getDailyComparison,
  getRange,
  getSite,
  sumViews,
} from "/analytics-core.js?v=2";

const DATA_URL = "/data/analytics.json";
const FOOTER_RANGE = "30";

async function loadAnalytics() {
  const response = await fetch(DATA_URL, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Analytics snapshot returned ${response.status}`);
  }
  return response.json();
}

function hydrateFooter(data) {
  const link = document.querySelector("[data-site-view-total]");
  const site = getSite(data, PERSONAL_DOMAIN);
  if (!link || !site) {
    return;
  }

  const points = getRange(site, FOOTER_RANGE);
  const total = sumViews(points);
  link.textContent = `${formatViews(total)} page views / ${points.length} days`;
  link.title = `Cloudflare page views from ${points.at(0).date} through ${data.period.completeThrough}`;
}

function hydrateProjectViews(data) {
  PROJECT_DOMAINS.forEach((domain) => {
    const site = getSite(data, domain);
    const comparison = getDailyComparison(site, data.period.completeThrough);
    const root = document.querySelector(`[data-project-views="${domain}"]`);

    if (!root || !comparison) {
      return;
    }

    const count = root.querySelector("[data-view-count]");
    const trend = root.querySelector("[data-view-trend]");

    count.textContent = `${formatViews(comparison.current)} views yesterday`;
    trend.textContent = formatChange(comparison);
    trend.dataset.direction = comparison.direction;
    root.setAttribute(
      "aria-label",
      `${formatViews(comparison.current)} page views yesterday for ${domain}, ${Math.abs(comparison.percent)} percent ${comparison.direction === "up" ? "up" : comparison.direction === "down" ? "down" : "unchanged"} from the prior day. Open analytics.`,
    );
  });
}

loadAnalytics()
  .then((data) => {
    hydrateFooter(data);
    hydrateProjectViews(data);
  })
  .catch(() => {
    document.documentElement.dataset.analytics = "unavailable";
  });
