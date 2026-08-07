import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { DOMAIN_ORDER, PERSONAL_DOMAIN } from "../analytics-core.js";

const API_BASE = "https://api.cloudflare.com/client/v4";
const TOKEN_ENV = "CLOUDFLARE_ANALYTICS_READ_ONLY_KEY_SCOPED";
const HISTORY_DAYS = 30;

const LABELS = new Map([
  ["stefantobler.com", "Stefan Tobler"],
  ["trphy.dev", "TRPHY"],
  ["apartments.fyi", "apartments.fyi"],
  ["wikiwander.app", "Wiki Wander"],
]);

const token = process.env[TOKEN_ENV];
if (!token) {
  throw new Error(`${TOKEN_ENV} is required`);
}

function dateKey(date) {
  return date.toISOString().slice(0, 10);
}

function offsetDate(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function createDateRange(start, days) {
  return Array.from({ length: days }, (_, index) => dateKey(offsetDate(start, index)));
}

async function cloudflare(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const body = await response.json();
  if (!response.ok || body.success === false || body.errors?.length) {
    const details = JSON.stringify(body.errors ?? body, null, 2);
    throw new Error(`Cloudflare request failed (${response.status}): ${details}`);
  }

  return body;
}

const zonesResponse = await cloudflare("/zones?per_page=100");
const zonesByDomain = new Map(zonesResponse.result.map((zone) => [zone.name, zone.id]));
const missingDomains = DOMAIN_ORDER.filter((domain) => !zonesByDomain.has(domain));

if (missingDomains.length) {
  throw new Error(`Cloudflare zones are missing: ${missingDomains.join(", ")}`);
}

const today = new Date();
const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
const start = offsetDate(end, -HISTORY_DAYS);
const dates = createDateRange(start, HISTORY_DAYS);
const zoneTags = DOMAIN_ORDER.map((domain) => zonesByDomain.get(domain));

const query = `
  query DailyPageViews($zoneTags: [string!], $start: Date, $end: Date) {
    viewer {
      zones(filter: { zoneTag_in: $zoneTags }) {
        zoneTag
        daily: httpRequests1dGroups(
          limit: 40
          orderBy: [date_ASC]
          filter: { date_geq: $start, date_lt: $end }
        ) {
          dimensions { date }
          sum { pageViews }
        }
      }
    }
  }
`;

const analyticsResponse = await cloudflare("/graphql", {
  method: "POST",
  body: JSON.stringify({
    query,
    variables: {
      zoneTags,
      start: dateKey(start),
      end: dateKey(end),
    },
  }),
});

const groupsByZone = new Map(
  analyticsResponse.data.viewer.zones.map((zone) => [zone.zoneTag, zone.daily]),
);

const sites = DOMAIN_ORDER.map((domain) => {
  const zoneTag = zonesByDomain.get(domain);
  const groups = groupsByZone.get(zoneTag) ?? [];
  const viewsByDate = new Map(groups.map((group) => [group.dimensions.date, Number(group.sum.pageViews || 0)]));
  const daily = dates.map((date) => ({ date, views: viewsByDate.get(date) ?? 0 }));

  return {
    domain,
    label: LABELS.get(domain),
    kind: domain === PERSONAL_DOMAIN ? "personal" : "project",
    periodViews: daily.reduce((sum, point) => sum + point.views, 0),
    daily,
  };
});

const snapshot = {
  version: 1,
  generatedAt: new Date().toISOString(),
  source: "Cloudflare GraphQL Analytics API",
  metric: "pageViews",
  period: {
    days: HISTORY_DAYS,
    start: dateKey(start),
    endExclusive: dateKey(end),
    completeThrough: dateKey(offsetDate(end, -1)),
    timezone: "UTC",
  },
  sites,
};

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(scriptDirectory, "../data/analytics.json");
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

console.log(`Updated ${outputPath} through ${snapshot.period.completeThrough}`);
