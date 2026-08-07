import {
  PERSONAL_DOMAIN,
  PROJECT_DOMAINS,
  formatChange,
  formatViews,
  getDailyComparison,
  getSite,
  sumViews,
} from "/analytics-core.js?v=3";

const DATA_URL = "/data/analytics.json";

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

  const total = sumViews(site.daily);
  link.textContent = `${formatViews(total)} page views`;

  if (site.daily.length) {
    link.title = `Cloudflare page views captured from ${site.daily.at(0).date} through ${data.period.completeThrough}`;
  }
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
    trend.title = "day / day change";
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
