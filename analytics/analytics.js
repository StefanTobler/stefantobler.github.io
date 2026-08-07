import {
  DOMAIN_ORDER,
  RANGE_OPTIONS,
  formatChange,
  formatViews,
  getChartGeometry,
  getDailyComparison,
  getRange,
  getSite,
  sumViews,
} from "/analytics-core.js";

const DATA_URL = "/data/analytics.json";
const CHART_WIDTH = 720;
const CHART_HEIGHT = 180;
const PROJECT_START_INDEX = 1;

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

function createChart(site, days) {
  const range = getRange(site, days);
  const geometry = getChartGeometry(range, CHART_WIDTH, CHART_HEIGHT);
  const title = `${site.label} page views for the last ${days} days`;
  const circles = geometry.points
    .map(
      (point) => `
        <circle cx="${point.x.toFixed(2)}" cy="${point.y.toFixed(2)}" r="3" tabindex="0">
          <title>${formatDate(point.date)}: ${formatViews(point.views)} page views</title>
        </circle>`,
    )
    .join("");

  return `
    <div class="chart-frame">
      <div class="chart-y-labels" aria-hidden="true">
        <span>${formatViews(geometry.max)}</span>
        <span>0</span>
      </div>
      <svg class="line-chart" viewBox="0 0 ${CHART_WIDTH} ${CHART_HEIGHT}" role="img" aria-label="${title}">
        <title>${title}</title>
        <line class="chart-guide" x1="8" y1="8" x2="712" y2="8"></line>
        <line class="chart-guide" x1="8" y1="172" x2="712" y2="172"></line>
        <path class="chart-line" d="${geometry.path}"></path>
        ${circles}
      </svg>
      <div class="chart-x-labels" aria-hidden="true">
        <span>${formatDate(range.at(0).date)}</span>
        <span>${formatDate(range.at(-1).date)}</span>
      </div>
    </div>`;
}

function createCard(site, data, days) {
  const comparison = getDailyComparison(site, data.period.completeThrough);
  const range = getRange(site, days);
  const total = sumViews(range);
  const trend = formatChange(comparison);

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
            <dt>${days} day total</dt>
            <dd>${formatViews(total)}</dd>
          </div>
        </dl>
      </header>
      ${createChart(site, days)}
    </article>`;
}

function getState() {
  const params = new URLSearchParams(window.location.search);
  const requestedDays = Number(params.get("range"));
  const requestedDomain = params.get("domain") ?? "all";

  return {
    days: RANGE_OPTIONS.includes(requestedDays) ? requestedDays : 30,
    domain: DOMAIN_ORDER.includes(requestedDomain) ? requestedDomain : "all",
  };
}

function writeState(state) {
  const params = new URLSearchParams();
  if (state.domain !== "all") {
    params.set("domain", state.domain);
  }
  if (state.days !== 30) {
    params.set("range", String(state.days));
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

function render(data, state) {
  const root = document.querySelector("[data-analytics-charts]");
  const sites = DOMAIN_ORDER.map((domain) => getSite(data, domain)).filter(Boolean);
  const visibleSites = state.domain === "all" ? sites : sites.filter((site) => site.domain === state.domain);

  root.innerHTML = visibleSites
    .map((site, index) => {
      const separator = state.domain === "all" && index === PROJECT_START_INDEX ? '<h2 class="analytics-group-title">Projects</h2>' : "";
      return `${separator}${createCard(site, data, state.days)}`;
    })
    .join("");

  document.querySelectorAll("[data-range]").forEach((button) => {
    const active = Number(button.dataset.range) === state.days;
    button.setAttribute("aria-pressed", String(active));
  });

  document.querySelector("[data-domain-filter]").value = state.domain;
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
      state.days = Number(button.dataset.range);
      render(data, state);
    });
  });

  document.querySelector("[data-domain-filter]").addEventListener("change", (event) => {
    state.domain = event.target.value;
    render(data, state);
  });
}

init().catch(() => {
  const root = document.querySelector("[data-analytics-charts]");
  root.innerHTML = '<p class="analytics-error">Analytics are temporarily unavailable. Please try again later.</p>';
});
