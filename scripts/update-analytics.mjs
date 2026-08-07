import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  DOMAIN_ORDER,
  PERSONAL_DOMAIN,
  mergeDailyHistory,
  sumViews,
} from "../analytics-core.js";

const API_BASE = "https://api.cloudflare.com/client/v4";
const TOKEN_ENV = "CLOUDFLARE_ANALYTICS_READ_ONLY_KEY_SCOPED";
const DAY_SECONDS = 86_400;
const FALLBACK_HISTORY_DAYS = 30;
const REFRESH_OVERLAP_DAYS = 7;
const TRAILING_TOTAL_DAYS = 30;

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

function parseDate(date) {
  return new Date(`${date}T00:00:00Z`);
}

function offsetDate(date, days) {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

function createDateRange(start, endExclusive) {
  const dates = [];
  for (let cursor = new Date(start); cursor < endExclusive; cursor = offsetDate(cursor, 1)) {
    dates.push(dateKey(cursor));
  }
  return dates;
}

function splitIntoRuns(dates, maxDays) {
  const runs = [];
  let start = null;
  let previous = null;

  for (const date of dates) {
    const current = parseDate(date);
    const isConsecutive = previous && dateKey(offsetDate(previous, 1)) === date;
    const currentLength = start ? Math.round((current - start) / (DAY_SECONDS * 1000)) + 1 : 0;

    if (!start || !isConsecutive || currentLength > maxDays) {
      if (start && previous) {
        runs.push({ start, endExclusive: offsetDate(previous, 1) });
      }
      start = current;
    }

    previous = current;
  }

  if (start && previous) {
    runs.push({ start, endExclusive: offsetDate(previous, 1) });
  }

  return runs;
}

async function readSnapshot(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
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

async function getDatasetLimits(zoneTags) {
  const query = `
    query DailyPageViewLimits($zoneTags: [string!]) {
      viewer {
        zones(filter: { zoneTag_in: $zoneTags }) {
          zoneTag
          settings {
            httpRequests1dGroups {
              enabled
              maxDuration
              maxPageSize
              notOlderThan
            }
          }
        }
      }
    }
  `;

  const response = await cloudflare("/graphql", {
    method: "POST",
    body: JSON.stringify({ query, variables: { zoneTags } }),
  });

  const limits = response.data.viewer.zones
    .map((zone) => zone.settings?.httpRequests1dGroups)
    .filter((limit) => limit?.enabled);

  if (limits.length !== zoneTags.length) {
    throw new Error("Cloudflare daily HTTP analytics are not enabled for every configured zone");
  }

  return {
    historyDays: Math.max(
      1,
      Math.floor(Math.min(...limits.map((limit) => limit.notOlderThan)) / DAY_SECONDS),
    ),
    maxDaysPerQuery: Math.max(
      1,
      Math.min(
        ...limits.map((limit) => Math.floor(limit.maxDuration / DAY_SECONDS)),
        ...limits.map((limit) => limit.maxPageSize),
      ),
    ),
  };
}

async function getDailyGroups(zoneTags, start, endExclusive, limit) {
  const query = `
    query DailyPageViews($zoneTags: [string!], $start: Date, $end: Date, $limit: Int!) {
      viewer {
        zones(filter: { zoneTag_in: $zoneTags }) {
          zoneTag
          daily: httpRequests1dGroups(
            limit: $limit
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

  const response = await cloudflare("/graphql", {
    method: "POST",
    body: JSON.stringify({
      query,
      variables: {
        zoneTags,
        start: dateKey(start),
        end: dateKey(endExclusive),
        limit,
      },
    }),
  });

  return response.data.viewer.zones;
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(scriptDirectory, "../data/analytics.json");
const existingSnapshot = await readSnapshot(outputPath);

const zonesResponse = await cloudflare("/zones?per_page=100");
const zonesByDomain = new Map(zonesResponse.result.map((zone) => [zone.name, zone.id]));
const missingDomains = DOMAIN_ORDER.filter((domain) => !zonesByDomain.has(domain));

if (missingDomains.length) {
  throw new Error(`Cloudflare zones are missing: ${missingDomains.join(", ")}`);
}

const today = new Date();
const end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
const completeThrough = dateKey(offsetDate(end, -1));
const zoneTags = DOMAIN_ORDER.map((domain) => zonesByDomain.get(domain));
let limits;
try {
  limits = await getDatasetLimits(zoneTags);
} catch (error) {
  console.warn(`Could not read Cloudflare dataset limits; using a ${FALLBACK_HISTORY_DAYS}-day query window.`);
  limits = {
    historyDays: FALLBACK_HISTORY_DAYS,
    maxDaysPerQuery: FALLBACK_HISTORY_DAYS,
  };
}

const availableStart = offsetDate(end, -limits.historyDays);
const availableDates = createDateRange(availableStart, end);
const refreshStart = offsetDate(end, -REFRESH_OVERLAP_DAYS);

const existingByDomain = new Map(
  (existingSnapshot?.sites ?? []).map((site) => [site.domain, site]),
);
const existingDatesByDomain = new Map(
  DOMAIN_ORDER.map((domain) => [
    domain,
    new Set((existingByDomain.get(domain)?.daily ?? []).map((point) => point.date)),
  ]),
);
const datesToQuery = availableDates.filter((date) => {
  if (date >= dateKey(refreshStart)) {
    return true;
  }

  return DOMAIN_ORDER.some((domain) => !existingDatesByDomain.get(domain).has(date));
});

const incomingByDomain = new Map(DOMAIN_ORDER.map((domain) => [domain, []]));
const runs = splitIntoRuns(datesToQuery, limits.maxDaysPerQuery);

for (const run of runs) {
  const runDates = createDateRange(run.start, run.endExclusive);
  const groups = await getDailyGroups(
    zoneTags,
    run.start,
    run.endExclusive,
    Math.min(runDates.length, limits.maxDaysPerQuery),
  );
  const groupsByZone = new Map(groups.map((zone) => [zone.zoneTag, zone.daily]));

  for (const domain of DOMAIN_ORDER) {
    const zoneTag = zonesByDomain.get(domain);
    const viewsByDate = new Map(
      (groupsByZone.get(zoneTag) ?? []).map((group) => [
        group.dimensions.date,
        Number(group.sum.pageViews || 0),
      ]),
    );
    const incoming = incomingByDomain.get(domain);
    incoming.push(
      ...runDates.map((date) => ({ date, views: viewsByDate.get(date) ?? 0 })),
    );
  }
}

const sites = DOMAIN_ORDER.map((domain) => {
  const existingDaily = existingByDomain.get(domain)?.daily ?? [];
  const daily = mergeDailyHistory(existingDaily, incomingByDomain.get(domain));

  return {
    domain,
    label: LABELS.get(domain),
    kind: domain === PERSONAL_DOMAIN ? "personal" : "project",
    historyViews: sumViews(daily),
    trailing30Views: sumViews(daily.slice(-TRAILING_TOTAL_DAYS)),
    daily,
  };
});

const historyStart = sites
  .flatMap((site) => site.daily.map((point) => point.date))
  .sort()
  .at(0);

const snapshot = {
  version: 2,
  generatedAt: new Date().toISOString(),
  source: "Cloudflare GraphQL Analytics API",
  metric: "pageViews",
  retention: "append-only",
  period: {
    days: sites[0]?.daily.length ?? 0,
    start: historyStart,
    endExclusive: dateKey(end),
    completeThrough,
    timezone: "UTC",
  },
  sites,
};

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`, "utf8");

console.log(
  `Updated ${outputPath} through ${snapshot.period.completeThrough}; retained ${snapshot.period.days} daily records per domain`,
);
