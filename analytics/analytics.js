import {
  DEFAULT_RANGE,
  DOMAIN_ORDER,
  RANGE_OPTIONS,
  formatChange,
  formatViews,
  getChartDateLabels,
  getChartGeometry,
  getDailyComparison,
  getRange,
  getSite,
  normalizeRange,
  sumViews,
} from "/analytics-core.js?v=3";

const DATA_URL = "/data/analytics.json";
const CHART_WIDTH = 720;
const CHART_PLOT_HEIGHT = 180;
const CHART_HEIGHT = 212;
const CHART_INSETS = { top: 8, right: 8, bottom: 8, left: 48 };
const PROJECT_START_INDEX = 1;
const chartSeries = new Map();

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(date) {
  return dateFormatter.format(new Date(`${date}T00:00:00Z`));
}

function describeRange(range, pointCount) {
  return range === "all" ? `all ${pointCount} captured days` : `the last ${range} days`;
}

function createChart(site, rangeKey) {
  const range = getRange(site, rangeKey);
  if (!range.length) {
    return '<p class="analytics-empty">No captured views in this range.</p>';
  }

  const geometry = getChartGeometry(
    range,
    CHART_WIDTH,
    CHART_PLOT_HEIGHT,
    CHART_INSETS,
  );
  chartSeries.set(site.domain, geometry.points);

  const title = `${site.label} page views for ${describeRange(rangeKey, range.length)}`;
  const plotRight = CHART_WIDTH - CHART_INSETS.right;
  const plotBottom = CHART_PLOT_HEIGHT - CHART_INSETS.bottom;
  const dateLabels = getChartDateLabels(range);

  return `
    <div class="chart-frame" data-chart-frame="${site.domain}">
      <svg
        class="line-chart"
        viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}"
        role="img"
        aria-label="${title}"
        tabindex="0"
        data-line-chart="${site.domain}"
      >
        <title>${title}</title>
        <line class="chart-guide" x1="${CHART_INSETS.left}" y1="${CHART_INSETS.top}" x2="${plotRight}" y2="${CHART_INSETS.top}"></line>
        <line class="chart-guide" x1="${CHART_INSETS.left}" y1="${plotBottom}" x2="${plotRight}" y2="${plotBottom}"></line>
        <path class="chart-line" fill="none" stroke="currentColor" d="${geometry.path}"></path>
        <circle class="chart-hover-point" cx="0" cy="0" r="4" visibility="hidden"></circle>
        <text class="chart-axis-label" x="0" y="13">${formatViews(geometry.max)}</text>
        <text class="chart-axis-label" x="0" y="176">0</text>
        <text class="chart-axis-label" x="${CHART_INSETS.left}" y="204">${dateLabels.start}</text>
        <text class="chart-axis-label" x="${plotRight}" y="204" text-anchor="end">${dateLabels.end}</text>
      </svg>
      <div class="chart-tooltip" role="status" hidden></div>
    </div>`;
}

function createCard(site, data, rangeKey) {
  const comparison = getDailyComparison(site, data.period.completeThrough);
  const range = getRange(site, rangeKey);
  const total = sumViews(range);
  const trend = formatChange(comparison);
  const totalLabel = rangeKey === "all" ? "Captured total" : `${rangeKey} day total`;

  return `
    <article class="analytics-card" data-domain-card="${site.domain}">
      <header class="analytics-card-header">
        <div>
          <p class="analytics-eyebrow">${site.kind === "personal" ? "This site" : "Project"}</p>
          <h2>${site.label}</h2>
          <a href="https://${site.domain}" target="_blank" rel="noreferrer">${site.domain}</a>
        </div>
        <dl class="analytics-summary">
          <div>
            <dt>Yesterday</dt>
            <dd>${formatViews(comparison.current)} <span class="analytics-trend" data-direction="${comparison.direction}">${trend}</span></dd>
          </div>
          <div>
            <dt>${totalLabel}</dt>
            <dd>${formatViews(total)}</dd>
          </div>
        </dl>
      </header>
      ${createChart(site, rangeKey)}
    </article>`;
}

function getState() {
  const params = new URLSearchParams(window.location.search);
  const requestedRange = normalizeRange(params.get("range"));
  const requestedDomain = params.get("domain") ?? "all";

  return {
    range: RANGE_OPTIONS.includes(requestedRange) ? requestedRange : DEFAULT_RANGE,
    domain: DOMAIN_ORDER.includes(requestedDomain) ? requestedDomain : "all",
  };
}

function writeState(state) {
  const params = new URLSearchParams();
  if (state.domain !== "all") {
    params.set("domain", state.domain);
  }
  if (state.range !== DEFAULT_RANGE) {
    params.set("range", state.range);
  }
  const query = params.toString();
  window.history.replaceState(null, "", `${window.location.pathname}${query ? `?${query}` : ""}`);
}

function setMetadata(data) {
  const updated = document.querySelector("[data-analytics-updated]");
  const through = document.querySelector("[data-analytics-through]");
  updated.textContent = longDateFormatter.format(new Date(data.generatedAt));
  through.textContent = longDateFormatter.format(new Date(`${data.period.completeThrough}T00:00:00Z`));
}

function showChartPoint(frame, index) {
  const domain = frame.dataset.chartFrame;
  const points = chartSeries.get(domain) ?? [];
  const point = points[Math.max(0, Math.min(index, points.length - 1))];
  if (!point) {
    return;
  }

  const svg = frame.querySelector("[data-line-chart]");
  const marker = frame.querySelector(".chart-hover-point");
  const tooltip = frame.querySelector(".chart-tooltip");
  const svgRect = svg.getBoundingClientRect();
  const frameRect = frame.getBoundingClientRect();
  const left = svgRect.left - frameRect.left + (point.x / CHART_WIDTH) * svgRect.width;
  const top = svgRect.top - frameRect.top + (point.y / CHART_HEIGHT) * svgRect.height;

  marker.setAttribute("cx", point.x.toFixed(2));
  marker.setAttribute("cy", point.y.toFixed(2));
  marker.setAttribute("visibility", "visible");
  tooltip.textContent = `${formatDate(point.date)} · ${formatViews(point.views)} ${point.views === 1 ? "view" : "views"}`;
  tooltip.style.left = `${left}px`;
  tooltip.style.top = `${top}px`;
  tooltip.dataset.align = left > frameRect.width * 0.72 ? "left" : "right";
  tooltip.hidden = false;
  frame.dataset.activePoint = String(points.indexOf(point));
}

function hideChartPoint(frame) {
  frame.querySelector(".chart-hover-point").setAttribute("visibility", "hidden");
  frame.querySelector(".chart-tooltip").hidden = true;
  delete frame.dataset.activePoint;
}

function initChartInteractions(root) {
  root.querySelectorAll("[data-chart-frame]").forEach((frame) => {
    const svg = frame.querySelector("[data-line-chart]");
    const points = chartSeries.get(frame.dataset.chartFrame) ?? [];

    svg.addEventListener("pointermove", (event) => {
      const rect = svg.getBoundingClientRect();
      const svgX = ((event.clientX - rect.left) / rect.width) * CHART_WIDTH;
      const plotWidth = CHART_WIDTH - CHART_INSETS.left - CHART_INSETS.right;
      const ratio = Math.max(0, Math.min(1, (svgX - CHART_INSETS.left) / plotWidth));
      showChartPoint(frame, Math.round(ratio * Math.max(points.length - 1, 0)));
    });

    svg.addEventListener("pointerleave", () => hideChartPoint(frame));
    svg.addEventListener("focus", () => showChartPoint(frame, points.length - 1));
    svg.addEventListener("blur", () => hideChartPoint(frame));
    svg.addEventListener("keydown", (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") {
        return;
      }
      event.preventDefault();
      const current = Number(frame.dataset.activePoint ?? points.length - 1);
      showChartPoint(frame, current + (event.key === "ArrowRight" ? 1 : -1));
    });
  });
}

function render(data, state) {
  const root = document.querySelector("[data-analytics-charts]");
  const sites = DOMAIN_ORDER.map((domain) => getSite(data, domain)).filter(Boolean);
  const visibleSites = state.domain === "all" ? sites : sites.filter((site) => site.domain === state.domain);

  chartSeries.clear();
  root.innerHTML = visibleSites
    .map((site, index) => {
      const separator = state.domain === "all" && index === PROJECT_START_INDEX ? '<h2 class="analytics-group-title">Projects</h2>' : "";
      return `${separator}${createCard(site, data, state.range)}`;
    })
    .join("");

  document.querySelectorAll("[data-range]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.range === state.range));
  });

  document.querySelectorAll("[data-domain]").forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.domain === state.domain));
  });

  initChartInteractions(root);
  writeState(state);
}

async function init() {
  const response = await fetch(DATA_URL, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Analytics snapshot returned ${response.status}`);
  }

  const data = await response.json();
  const state = getState();
  setMetadata(data);
  render(data, state);

  document.querySelectorAll("[data-range]").forEach((button) => {
    button.addEventListener("click", () => {
      state.range = button.dataset.range;
      render(data, state);
    });
  });

  document.querySelectorAll("[data-domain]").forEach((button) => {
    button.addEventListener("click", () => {
      state.domain = button.dataset.domain;
      render(data, state);
    });
  });
}

init().catch(() => {
  const root = document.querySelector("[data-analytics-charts]");
  root.innerHTML = '<p class="analytics-error">Analytics are temporarily unavailable. Please try again later.</p>';
});
