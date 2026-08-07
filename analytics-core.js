export const PERSONAL_DOMAIN = "stefantobler.com";

export const PROJECT_DOMAINS = [
  "trphy.dev",
  "apartments.fyi",
  "wikiwander.app",
];

export const DOMAIN_ORDER = [PERSONAL_DOMAIN, ...PROJECT_DOMAINS];

export const RANGE_OPTIONS = [7, 14, 30];

const numberFormatter = new Intl.NumberFormat("en-US");

export function formatViews(value) {
  return numberFormatter.format(Math.max(0, Number(value) || 0));
}

export function getSite(data, domain) {
  return data?.sites?.find((site) => site.domain === domain) ?? null;
}

export function getDailyComparison(site, completeThrough) {
  if (!site?.daily?.length || !completeThrough) {
    return null;
  }

  const currentDate = new Date(`${completeThrough}T00:00:00Z`);
  const previousDate = new Date(currentDate);
  previousDate.setUTCDate(previousDate.getUTCDate() - 1);

  const previousDateKey = previousDate.toISOString().slice(0, 10);
  const byDate = new Map(site.daily.map((point) => [point.date, point.views]));
  const current = Number(byDate.get(completeThrough) ?? 0);
  const previous = Number(byDate.get(previousDateKey) ?? 0);
  const change = current - previous;
  const percent = previous === 0 ? (current > 0 ? 100 : 0) : Math.round((change / previous) * 100);

  return {
    current,
    previous,
    change,
    percent,
    direction: change > 0 ? "up" : change < 0 ? "down" : "flat",
  };
}

export function formatChange(comparison) {
  if (!comparison) {
    return "";
  }

  if (comparison.direction === "up") {
    return `↗ +${comparison.percent}%`;
  }

  if (comparison.direction === "down") {
    return `↘ ${comparison.percent}%`;
  }

  return "0%";
}

export function getRange(site, days) {
  const safeDays = RANGE_OPTIONS.includes(Number(days)) ? Number(days) : 30;
  return site?.daily?.slice(-safeDays) ?? [];
}

export function sumViews(points) {
  return points.reduce((total, point) => total + Number(point.views || 0), 0);
}

export function getChartGeometry(points, width = 720, height = 180, inset = 8) {
  if (!points.length) {
    return { path: "", points: [], max: 0 };
  }

  const values = points.map((point) => Number(point.views || 0));
  const max = Math.max(...values, 1);
  const chartWidth = width - inset * 2;
  const chartHeight = height - inset * 2;
  const denominator = Math.max(points.length - 1, 1);

  const coordinates = points.map((point, index) => {
    const x = inset + (index / denominator) * chartWidth;
    const y = inset + chartHeight - (Number(point.views || 0) / max) * chartHeight;
    return { ...point, x, y };
  });

  const path = coordinates
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`)
    .join(" ");

  return { path, points: coordinates, max };
}
