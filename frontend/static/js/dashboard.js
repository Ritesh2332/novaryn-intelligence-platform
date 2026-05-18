/* ================================================================
   NOVARYN AI — Terminal Dark JS
   Full replacement for static/js/dashboard.js
   ================================================================ */

"use strict";

const API_BASE = "http://127.0.0.1:8000";

let sentimentChart  = null;
let sourceChart     = null;
let analyticsChart  = null;

/* ── Terminal Chart Defaults ─────────────────────────────────── */
const CHART_DEFAULTS = {
  font: {
    family: "'JetBrains Mono', monospace",
    size: 10,
  },
  color: "#4a4a4a",
};

Chart.defaults.font.family  = CHART_DEFAULTS.font.family;
Chart.defaults.font.size    = CHART_DEFAULTS.font.size;
Chart.defaults.color        = CHART_DEFAULTS.color;

const COLORS = {
  positive: "#00ff88",
  negative: "#ff3c3c",
  neutral:  "#ffaa00",
  posAlpha: "rgba(0,255,136,0.15)",
  negAlpha: "rgba(255,60,60,0.15)",
  neuAlpha: "rgba(255,170,0,0.15)",
  grid:     "rgba(255,255,255,0.04)",
  border:   "#1c1c1c",
};

/* ── Utilities ───────────────────────────────────────────────── */
function showLoading(id) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = '<span class="loading"></span>';
}

function showError(id, msg) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = `
    <div class="error-message">
      <i class="fas fa-exclamation-triangle"></i>
      <p>${msg}</p>
    </div>`;
}

function showNotification(msg, type = "success") {
  const n = document.createElement("div");
  n.className = `notification ${type}`;
  n.innerHTML = `
    <i class="fas fa-${type === "success" ? "check" : "times"}"></i>
    <span>${msg}</span>`;
  document.body.appendChild(n);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => n.classList.add("show"));
  });
  setTimeout(() => {
    n.classList.remove("show");
    setTimeout(() => n.remove(), 300);
  }, 3000);
}

function sentimentClass(s) {
  if (!s) return "";
  const v = s.toLowerCase();
  if (v === "positive") return "sentiment-positive";
  if (v === "negative") return "sentiment-negative";
  return "sentiment-neutral";
}

/* ── Section navigation ──────────────────────────────────────── */
function showSection(sectionId, clickedEl) {
  document.querySelectorAll(".content-section").forEach(s =>
    s.classList.remove("active-section")
  );
  document.getElementById(sectionId).classList.add("active-section");

  document.querySelectorAll(".nav-item").forEach(i =>
    i.classList.remove("active")
  );
  if (clickedEl) clickedEl.classList.add("active");
}

/* ── Analytics fetch (dashboard data) ───────────────────────── */
async function fetchAnalytics() {
  try {
    ["totalArticles", "positiveCount", "negativeCount", "neutralCount"]
      .forEach(showLoading);

    const [sentRes, srcRes, latRes] = await Promise.all([
      fetch(`${API_BASE}/analytics/sentiment-distribution`),
      fetch(`${API_BASE}/analytics/top-sources`),
      fetch(`${API_BASE}/analytics/latest-articles`),
    ]);

    if (!sentRes.ok) throw new Error("sentiment");
    if (!srcRes.ok)  throw new Error("sources");
    if (!latRes.ok)  throw new Error("articles");

    const sentData    = await sentRes.json();
    const sourceData  = await srcRes.json();
    const latArticles = await latRes.json();

    updateStats(sentData);
    renderSentimentChart(sentData);
    renderSourceChart(sourceData);
    renderAnalyticsChart(sentData);
    renderNews(latArticles);

  } catch (err) {
    console.error("Analytics error:", err);
    ["totalArticles", "positiveCount", "negativeCount", "neutralCount"]
      .forEach(id => showError(id, "err"));
    showNotification("Failed to load dashboard data", "error");
  }
}

/* ── Stats ───────────────────────────────────────────────────── */
function updateStats(data) {
  let total = 0, positive = 0, negative = 0, neutral = 0;

  data.forEach(item => {
    total += item.count;
    const s = (item.sentiment || "").toLowerCase();
    if (s === "positive") positive = item.count;
    else if (s === "negative") negative = item.count;
    else neutral = item.count;
  });

  // animated count-up
  countUp("totalArticles",   total);
  countUp("positiveCount",   positive);
  countUp("negativeCount",   negative);
  countUp("neutralCount",    neutral);
}

function countUp(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const duration = 600;
  const start = performance.now();
  function step(now) {
    const p = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(p * target);
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ── Sentiment Chart (horizontal bar — terminal style) ───────── */
function renderSentimentChart(data) {
  const ctx = document.getElementById("sentimentChart");
  if (!ctx) return;

  const order   = ["positive", "negative", "neutral"];
  const labels  = [];
  const counts  = [];
  const colors  = [];
  const borders = [];

  const map = {};
  data.forEach(d => { map[(d.sentiment || "").toLowerCase()] = d.count; });

  order.forEach(key => {
    labels.push(key.toUpperCase());
    counts.push(map[key] || 0);
    if (key === "positive") { colors.push(COLORS.posAlpha); borders.push(COLORS.positive); }
    else if (key === "negative") { colors.push(COLORS.negAlpha); borders.push(COLORS.negative); }
    else { colors.push(COLORS.neuAlpha); borders.push(COLORS.neutral); }
  });

  if (sentimentChart) sentimentChart.destroy();

  sentimentChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: colors,
        borderColor: borders,
        borderWidth: 1,
        borderRadius: 2,
        borderSkipped: false,
      }],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0e0e0e",
          borderColor: "#242424",
          borderWidth: 1,
          titleColor: "#4a4a4a",
          bodyColor: "#e4e4e4",
          padding: 10,
          callbacks: {
            label: ctx => `  count: ${ctx.raw}`,
          },
        },
      },
      scales: {
        x: {
          grid: { color: COLORS.grid },
          ticks: { color: "#4a4a4a" },
          border: { color: "#1c1c1c" },
        },
        y: {
          grid: { display: false },
          ticks: {
            color: (ctx) => {
              const map = ["#00ff88", "#ff3c3c", "#ffaa00"];
              return map[ctx.index] || "#4a4a4a";
            },
          },
          border: { color: "#1c1c1c" },
        },
      },
    },
  });
}

/* ── Source Chart ────────────────────────────────────────────── */
function renderSourceChart(data) {
  const ctx = document.getElementById("sourceChart");
  if (!ctx) return;

  const labels = data.map(d => d.source || "unknown");
  const counts = data.map(d => d.count);

  // generate shades of green from bright to dim
  const barColors = counts.map((_, i) => {
    const alpha = Math.max(0.08, 0.7 - i * 0.08);
    return `rgba(0,255,136,${alpha})`;
  });

  if (sourceChart) sourceChart.destroy();

  sourceChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        data: counts,
        backgroundColor: barColors,
        borderColor: "rgba(0,255,136,0.3)",
        borderWidth: 1,
        borderRadius: 2,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0e0e0e",
          borderColor: "#242424",
          borderWidth: 1,
          titleColor: "#4a4a4a",
          bodyColor: "#e4e4e4",
          padding: 10,
          callbacks: {
            label: ctx => `  articles: ${ctx.raw}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: "#4a4a4a",
            maxRotation: 30,
            minRotation: 0,
          },
          border: { color: "#1c1c1c" },
        },
        y: {
          grid: { color: COLORS.grid },
          ticks: { color: "#4a4a4a" },
          border: { color: "#1c1c1c" },
        },
      },
    },
  });
}

/* ── Analytics page chart + breakdown + log ──────────── */
function renderAnalyticsChart(data) {
  const ctx = document.getElementById("analyticsChart");
  if (!ctx) return;

  // populate stat strip
  let total = 0, pos = 0, neg = 0, neu = 0;
  const map = {};
  data.forEach(d => {
    const s = (d.sentiment || "").toLowerCase();
    map[s] = d.count;
    total += d.count;
    if (s === "positive") pos = d.count;
    else if (s === "negative") neg = d.count;
    else neu = d.count;
  });

  const setEl = (id, val) => { const e = document.getElementById(id); if (e) e.textContent = val; };
  setEl("a-total", total);
  setEl("a-pos", pos);
  setEl("a-neg", neg);
  setEl("a-neu", neu);

  // percentage breakdown bars
  if (total > 0) {
    const setPct = (barId, pctId, count) => {
      const pct = Math.round((count / total) * 100);
      const bar = document.getElementById(barId);
      const lbl = document.getElementById(pctId);
      if (bar) setTimeout(() => bar.style.width = pct + "%", 100);
      if (lbl) lbl.textContent = pct + "%";
    };
    setPct("bd-pos-bar", "bd-pos-pct", pos);
    setPct("bd-neg-bar", "bd-neg-pct", neg);
    setPct("bd-neu-bar", "bd-neu-pct", neu);
  }

  // terminal log
  addLog(`// sentiment data loaded — ${total} articles`, "ok");
  addLog(`// positive: ${pos} | negative: ${neg} | neutral: ${neu}`);

  // chart
  const labels = data.map(d => (d.sentiment || "unknown").toUpperCase());
  const counts = data.map(d => d.count);
  const colors = data.map(d => {
    const s = (d.sentiment || "").toLowerCase();
    if (s === "positive") return COLORS.positive;
    if (s === "negative") return COLORS.negative;
    return COLORS.neutral;
  });

  if (analyticsChart) analyticsChart.destroy();

  analyticsChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Articles",
        data: counts,
        backgroundColor: colors.map(c => c + "22"),
        borderColor: colors,
        borderWidth: 1,
        borderRadius: 3,
        borderSkipped: false,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,   /* CRITICAL — lets chart fill the flex container */
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0e0e0e",
          borderColor: "#242424",
          borderWidth: 1,
          titleColor: "#4a4a4a",
          bodyColor: "#e4e4e4",
          padding: 10,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: (ctx) => {
              const colorMap = [COLORS.positive, COLORS.negative, COLORS.neutral];
              return colorMap[ctx.index] || "#4a4a4a";
            },
          },
          border: { color: "#1c1c1c" },
        },
        y: {
          grid: { color: COLORS.grid },
          ticks: { color: "#4a4a4a" },
          border: { color: "#1c1c1c" },
        },
      },
    },
  });
}

/* ── Terminal log helper ─────────────────────────────────────── */
function addLog(msg, cls = "") {
  const log = document.getElementById("analytics-log");
  if (!log) return;
  const now = new Date();
  const time = [now.getHours(), now.getMinutes(), now.getSeconds()]
    .map(n => String(n).padStart(2, "0")).join(":");
  const line = document.createElement("div");
  line.className = "log-line";
  line.innerHTML = `<span class="log-time">${time}</span><span class="log-msg ${cls}">${msg}</span>`;
  log.appendChild(line);
  // keep last 6 lines only
  while (log.children.length > 6) log.removeChild(log.firstChild);
}

/* ── News Cards ──────────────────────────────────────────────── */
function renderNews(articles) {
  const grid = document.getElementById("newsGrid");
  if (!grid) return;
  grid.innerHTML = "";

  if (!articles || articles.length === 0) {
    grid.innerHTML = `<div class="error-message"><p>// no articles loaded</p></div>`;
    return;
  }

  articles.forEach((article, i) => {
    const sentiment = (article.sentiment || "neutral").toLowerCase();
    const card = document.createElement("div");
    card.className = "news-card";
    card.dataset.sentiment = sentiment;
    card.style.animationDelay = `${i * 40}ms`;

    card.innerHTML = `
      <h4>${article.title || "Untitled"}</h4>
      <p>${article.description || "No description available."}</p>
      <div class="news-meta">
        <span>${article.source || "Unknown"}</span>
        <span class="${sentimentClass(sentiment)}">${sentiment}</span>
      </div>`;

    grid.appendChild(card);
  });
}

/* ── News Feed Page ──────────────────────────────────────────── */
async function loadNewsFeed() {
  const container = document.getElementById("news-feed-container");
  if (!container) return;

  container.innerHTML = '<div class="error-message"><span class="loading"></span></div>';

  try {
    const res  = await fetch(`${API_BASE}/analytics/latest-articles`);
    const data = await res.json();

    container.innerHTML = "";

    data.forEach((article, i) => {
      const sentiment = (article.sentiment || "neutral").toLowerCase();
      const card = document.createElement("div");
      card.className = "news-card";
      card.dataset.sentiment = sentiment;
      card.style.animationDelay = `${i * 40}ms`;

      card.innerHTML = `
        <h4>${article.title || "Untitled"}</h4>
        <p>${article.description || "No description available."}</p>
        <div class="news-meta">
          <span>${article.source || "Unknown"}</span>
          <span class="${sentimentClass(sentiment)}">${sentiment}</span>
        </div>`;

      container.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = `<div class="error-message"><i class="fas fa-exclamation-triangle"></i><p>// failed to load feed</p></div>`;
  }
}

/* ── AI Ask (dashboard) ──────────────────────────────────────── */
async function askAIDashboard() {
  const question = (document.getElementById("aiQuestion")?.value || "").trim();
  if (!question) return;

  const responseDiv = document.getElementById("aiResponse");
  responseDiv.innerHTML = `<span style="color:var(--green)">// processing query...</span>`;

  try {
    const res  = await fetch(`${API_BASE}/rag/ask?query=${encodeURIComponent(question)}`);
    const data = await res.json();

    responseDiv.innerHTML = `
      <div class="ai-response-content">
        <h3><i class="fas fa-robot"></i>&nbsp; AI Response</h3>
        <div class="ai-answer">${data.answer || "No answer returned."}</div>
        <div class="ai-sources">
          <strong>// sources</strong>
          <p>${data.sources_used || "none"}</p>
        </div>
      </div>`;

  } catch {
    responseDiv.innerHTML = `<span style="color:var(--red)">// error: failed to get AI response</span>`;
  }
}

/* ── AI Ask (assistant page) ─────────────────────────────────── */
async function askAI() {
  const question = (document.getElementById("assistant-query")?.value || "").trim();
  if (!question) {
    showNotification("// enter a query first", "error");
    return;
  }

  const responseDiv = document.getElementById("assistant-response");
  responseDiv.style.display = "block";
  responseDiv.innerHTML = `<span style="color:var(--green)">// processing...</span>`;

  try {
    const res  = await fetch(`${API_BASE}/rag/ask?query=${encodeURIComponent(question)}`);
    if (!res.ok) throw new Error("request failed");
    const data = await res.json();

    responseDiv.innerHTML = `
      <h3><i class="fas fa-terminal"></i>&nbsp; Output</h3>
      <p>${data.answer || "No answer returned."}</p>
      <strong>// sources_used:</strong>
      <p>${data.sources_used || "none"}</p>`;

    showNotification("// response generated");

  } catch {
    showError("assistant-response", "// error: failed to get AI response");
    showNotification("// request failed", "error");
  }
}

/* ── Refresh News ────────────────────────────────────────────── */
async function fetchNews() {
  const btn = document.querySelector(".refresh-btn");
  const icon = btn?.querySelector("i");
  const label = btn?.querySelector("span");

  if (btn) btn.disabled = true;
  if (icon) icon.className = "fas fa-spinner fa-spin";
  if (label) label.textContent = "FETCHING...";

  try {
    const res = await fetch(`${API_BASE}/fetch-news`);
    if (!res.ok) throw new Error("fetch failed");

    // generate embeddings (fire and don't block)
    fetch(`${API_BASE}/rag/generate-embeddings`, { method: "POST" }).catch(() => {});

    await fetchAnalytics();
    showNotification("// news refreshed successfully");

  } catch {
    showNotification("// failed to refresh news", "error");
  } finally {
    if (btn) btn.disabled = false;
    if (icon) icon.className = "fas fa-sync-alt";
    if (label) label.textContent = "REFRESH";
  }
}

/* ── Init ────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  fetchAnalytics();
});
