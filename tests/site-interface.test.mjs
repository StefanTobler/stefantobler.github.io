import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const [homeHtml, analyticsHtml, analyticsJavaScript, stylesheet, updater, workflow] = await Promise.all([
  readFile(new URL("../index.html", import.meta.url), "utf8"),
  readFile(new URL("../analytics/index.html", import.meta.url), "utf8"),
  readFile(new URL("../analytics/analytics.js", import.meta.url), "utf8"),
  readFile(new URL("../site.css", import.meta.url), "utf8"),
  readFile(new URL("../scripts/update-analytics.mjs", import.meta.url), "utf8"),
  readFile(new URL("../.github/workflows/update-analytics.yml", import.meta.url), "utf8"),
]);

test("homepage keeps analytics centered and removes the redundant links section", () => {
  assert.doesNotMatch(homeHtml, /id="links"/);
  assert.match(homeHtml, /class="site-footer home-footer"/);
  assert.match(homeHtml, /class="footer-analytics"/);
  assert.match(stylesheet, /\.home-footer\s*{[\s\S]*grid-template-columns:/);
});

test("analytics filters use site-styled buttons and expose all captured history", () => {
  assert.doesNotMatch(analyticsHtml, /<select/);
  assert.match(analyticsHtml, /data-range="all"/);
  assert.match(analyticsHtml, /data-domain="wikiwander\.app"/);
  assert.match(stylesheet, /\.filter-options button/);
});

test("analytics charts are stroke-only with fixed axis labels and a hover tooltip", () => {
  assert.match(analyticsJavaScript, /class="chart-line" fill="none"/);
  assert.doesNotMatch(analyticsJavaScript, /chart-x-labels/);
  assert.match(analyticsJavaScript, /class="chart-tooltip"/);
  assert.match(analyticsJavaScript, /pointermove/);
});

test("scheduled updater discovers history limits and merges append-only data", () => {
  assert.match(updater, /httpRequests1dGroups/);
  assert.match(updater, /notOlderThan/);
  assert.match(updater, /mergeDailyHistory/);
  assert.match(updater, /retention: "append-only"/);
  assert.match(workflow, /cron: "17 08 \* \* \*"/);
  assert.match(workflow, /push:[\s\S]*scripts\/update-analytics\.mjs/);
});

test("mobile project counts stay together instead of wrapping word by word", () => {
  assert.match(stylesheet, /\.project-views\s*{[\s\S]*white-space: nowrap;/);
  assert.match(stylesheet, /@media \(max-width: 80rem\)[\s\S]*\.project-meta\s*{[\s\S]*display: flex;/);
});
