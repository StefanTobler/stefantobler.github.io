import assert from "node:assert/strict";
import test from "node:test";

import {
  DOMAIN_ORDER,
  PROJECT_DOMAINS,
  formatChange,
  getChartGeometry,
  getDailyComparison,
  getRange,
  sumViews,
} from "../analytics-core.js";

const site = {
  daily: [
    { date: "2026-08-03", views: 5 },
    { date: "2026-08-04", views: 10 },
    { date: "2026-08-05", views: 8 },
    { date: "2026-08-06", views: 12 },
  ],
};

test("keeps project domains in the homepage order", () => {
  assert.deepEqual(PROJECT_DOMAINS, ["trphy.dev", "apartments.fyi", "wikiwander.app"]);
  assert.deepEqual(DOMAIN_ORDER.slice(1), PROJECT_DOMAINS);
});

test("compares the last complete day with the prior day", () => {
  const comparison = getDailyComparison(site, "2026-08-06");
  assert.deepEqual(comparison, {
    current: 12,
    previous: 8,
    change: 4,
    percent: 50,
    direction: "up",
  });
  assert.equal(formatChange(comparison), "↗ +50%");
});

test("uses the matching diagonal arrow for each trend direction", () => {
  const comparison = getDailyComparison(site, "2026-08-05");
  assert.equal(comparison.direction, "down");
  assert.equal(formatChange(comparison), "↘ -20%");
  assert.equal(formatChange(comparison).includes("↗"), false);
});

test("filters a range and sums its views", () => {
  assert.deepEqual(getRange(site, 7), site.daily);
  assert.equal(sumViews(getRange(site, 30)), 35);
});

test("creates bounded chart geometry for an empty or populated series", () => {
  assert.deepEqual(getChartGeometry([]), { path: "", points: [], max: 0 });

  const chart = getChartGeometry(site.daily, 100, 50, 5);
  assert.match(chart.path, /^M5\.00,/);
  assert.equal(chart.points.length, 4);
  assert.equal(chart.max, 12);
  assert.ok(chart.points.every((point) => point.x >= 5 && point.x <= 95));
  assert.ok(chart.points.every((point) => point.y >= 5 && point.y <= 45));
});
