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
  color: "#8a8a8a",
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

  // start/stop real-time analytics loop
  if (sectionId === "analytics-section") {
    startAnalyticsRealtime();
  } else {
    stopAnalyticsRealtime();
  }
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
    renderTrendChart(sentData);
    renderSourceRadarChart(sourceData);
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
          titleColor: "#8a8a8a",
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
          ticks: { color: "#8a8a8a" },
          border: { color: "#1c1c1c" },
        },
        y: {
          grid: { display: false },
          ticks: {
            color: (ctx) => {
              const map = ["#00ff88", "#ff3c3c", "#ffaa00"];
              return map[ctx.index] || "#8a8a8a";
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
          titleColor: "#8a8a8a",
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
            color: "#8a8a8a",
            maxRotation: 30,
            minRotation: 0,
          },
          border: { color: "#1c1c1c" },
        },
        y: {
          grid: { color: COLORS.grid },
          ticks: { color: "#8a8a8a" },
          border: { color: "#1c1c1c" },
        },
      },
    },
  });
}

/* ── Analytics page: stats + sparklines + trend + radar ─────── */
let trendChart = null;
let sourceRadarChart = null;
let analyticsSparkData = { total: [], pos: [], neg: [], neu: [] };

function renderAnalyticsChart(data) {
  // populate stat strip
  let total = 0, pos = 0, neg = 0, neu = 0;
  data.forEach(d => {
    const s = (d.sentiment || "").toLowerCase();
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

  // push to sparkline history
  analyticsSparkData.total.push(total); if (analyticsSparkData.total.length > 20) analyticsSparkData.total.shift();
  analyticsSparkData.pos.push(pos);   if (analyticsSparkData.pos.length > 20)   analyticsSparkData.pos.shift();
  analyticsSparkData.neg.push(neg);   if (analyticsSparkData.neg.length > 20)   analyticsSparkData.neg.shift();
  analyticsSparkData.neu.push(neu);   if (analyticsSparkData.neu.length > 20)   analyticsSparkData.neu.shift();

  drawSparkline("spark-total", analyticsSparkData.total, "#00ff88");
  drawSparkline("spark-pos",   analyticsSparkData.pos,   "#00ff88");
  drawSparkline("spark-neg",   analyticsSparkData.neg,   "#ff3c3c");
  drawSparkline("spark-neu",   analyticsSparkData.neu,   "#ffaa00");

  // terminal log
  addLog(`// sentiment data loaded — ${total} articles`, "ok");
  addLog(`// positive: ${pos} | negative: ${neg} | neutral: ${neu}`);

  // optional bar chart (only if canvas exists — dashboard page)
  const ctx = document.getElementById("analyticsChart");
  if (!ctx) return;

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
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0e0e0e",
          borderColor: "#242424",
          borderWidth: 1,
          titleColor: "#8a8a8a",
          bodyColor: "#e4e4e4",
          padding: 10,
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: (ctx2) => {
              const colorMap = [COLORS.positive, COLORS.negative, COLORS.neutral];
              return colorMap[ctx2.index] || "#8a8a8a";
            },
          },
          border: { color: "#1c1c1c" },
        },
        y: {
          grid: { color: COLORS.grid },
          ticks: { color: "#8a8a8a" },
          border: { color: "#1c1c1c" },
        },
      },
    },
  });
}

/* ── Sparkline renderer (tiny canvas line chart) ─────────────── */
function drawSparkline(canvasId, data, color) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || data.length < 2) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pad = 2;
  const step = (w - pad * 2) / (data.length - 1);

  ctx.beginPath();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  data.forEach((val, i) => {
    const x = pad + i * step;
    const y = h - pad - ((val - min) / range) * (h - pad * 2);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // glow dot at end
  const lastX = pad + (data.length - 1) * step;
  const lastY = h - pad - ((data[data.length - 1] - min) / range) * (h - pad * 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(lastX, lastY, 2, 0, Math.PI * 2);
  ctx.fill();
}

/* ── Sentiment Trends Over Time (line chart) ─────────────────── */
function renderTrendChart(sentimentData) {
  const ctx = document.getElementById("trendChart");
  if (!ctx) return;

  // Build mock time-series from current counts + simulated history
  const labels = [];
  const posData = [], negData = [], neuData = [];
  const now = new Date();
  for (let i = 9; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 60000);
    labels.push(`${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`);
    // simulate historical drift around current values
    const basePos = sentimentData.find(d => (d.sentiment || "").toLowerCase() === "positive")?.count || 5;
    const baseNeg = sentimentData.find(d => (d.sentiment || "").toLowerCase() === "negative")?.count || 5;
    const baseNeu = sentimentData.find(d => (d.sentiment || "").toLowerCase() === "neutral")?.count || 2;
    posData.push(Math.max(0, basePos + Math.floor(Math.random() * 6 - 3)));
    negData.push(Math.max(0, baseNeg + Math.floor(Math.random() * 6 - 3)));
    neuData.push(Math.max(0, baseNeu + Math.floor(Math.random() * 4 - 2)));
  }

  if (trendChart) trendChart.destroy();

  trendChart = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Positive",
          data: posData,
          borderColor: COLORS.positive,
          backgroundColor: "rgba(0,255,136,0.06)",
          borderWidth: 1.5,
          tension: 0.4,
          pointRadius: 2,
          pointBackgroundColor: COLORS.positive,
          fill: true,
        },
        {
          label: "Negative",
          data: negData,
          borderColor: COLORS.negative,
          backgroundColor: "rgba(255,60,60,0.06)",
          borderWidth: 1.5,
          tension: 0.4,
          pointRadius: 2,
          pointBackgroundColor: COLORS.negative,
          fill: true,
        },
        {
          label: "Neutral",
          data: neuData,
          borderColor: COLORS.neutral,
          backgroundColor: "rgba(255,170,0,0.04)",
          borderWidth: 1.5,
          tension: 0.4,
          pointRadius: 2,
          pointBackgroundColor: COLORS.neutral,
          fill: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: {
          display: true,
          labels: { color: "#8a8a8a", font: { size: 9, family: CHART_DEFAULTS.font.family }, boxWidth: 8 },
        },
        tooltip: {
          backgroundColor: "#0e0e0e",
          borderColor: "#242424",
          borderWidth: 1,
          titleColor: "#8a8a8a",
          bodyColor: "#e4e4e4",
          padding: 8,
        },
      },
      scales: {
        x: {
          grid: { color: COLORS.grid },
          ticks: { color: "#8a8a8a", font: { size: 9 } },
          border: { color: "#1c1c1c" },
        },
        y: {
          grid: { color: COLORS.grid },
          ticks: { color: "#8a8a8a", font: { size: 9 } },
          border: { color: "#1c1c1c" },
        },
      },
    },
  });
}

/* ── Source Comparison (radar chart) ─────────────────────────── */
function renderSourceRadarChart(sourceData) {
  const ctx = document.getElementById("sourceRadarChart");
  if (!ctx) return;

  // If fewer than 3 sources, use a horizontal bar instead
  const labels = sourceData.map(d => d.source || "unknown");
  const counts = sourceData.map(d => d.count);

  if (labels.length < 3) {
    // fallback bar chart for few sources
    if (sourceRadarChart) sourceRadarChart.destroy();
    sourceRadarChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels,
        datasets: [{
          data: counts,
          backgroundColor: counts.map((_, i) => {
            const alpha = Math.max(0.1, 0.6 - i * 0.08);
            return `rgba(0,255,136,${alpha})`;
          }),
          borderColor: "rgba(0,255,136,0.3)",
          borderWidth: 1,
          borderRadius: 2,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { color: COLORS.grid }, ticks: { color: "#8a8a8a", font: { size: 9 } }, border: { color: "#1c1c1c" } },
          y: { grid: { display: false }, ticks: { color: "#8a8a8a", font: { size: 9 } }, border: { color: "#1c1c1c" } },
        },
      },
    });
    return;
  }

  // radar chart for 3+ sources
  const maxCount = Math.max(...counts);
  const normalized = counts.map(c => (c / maxCount) * 100);

  if (sourceRadarChart) sourceRadarChart.destroy();

  sourceRadarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [{
        label: "Article Volume",
        data: normalized,
        borderColor: "rgba(0,255,136,0.6)",
        backgroundColor: "rgba(0,255,136,0.08)",
        borderWidth: 1,
        pointBackgroundColor: "#00ff88",
        pointRadius: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#0e0e0e",
          borderColor: "#242424",
          borderWidth: 1,
          callbacks: {
            label: ctx => `  articles: ${counts[ctx.dataIndex]}`,
          },
        },
      },
      scales: {
        r: {
          grid: { color: "rgba(255,255,255,0.04)" },
          angleLines: { color: "rgba(255,255,255,0.04)" },
          pointLabels: { color: "#8a8a8a", font: { size: 9, family: CHART_DEFAULTS.font.family } },
          ticks: { display: false, backdropColor: "transparent" },
          suggestedMin: 0,
          suggestedMax: 100,
        },
      },
    },
  });
}

/* ── Ticker update ───────────────────────────────────────────── */
const TICKER_ITEMS = [
  "market volatility index: 18.4 ▲",
  "tech sector sentiment: bullish",
  "federal reserve statement pending",
  "global trade volume: +2.3%",
  "energy prices stabilizing",
  "inflation data incoming",
  "crypto market: mixed signals",
  "asia-pacific markets: green open",
];

function updateTicker() {
  const container = document.getElementById("ticker-items");
  if (!container) return;
  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]; // duplicate for seamless loop
  container.innerHTML = items.map(t => `<span class="ticker-item">${t}</span>`).join("");
}

/* ── Real-time simulation loop ───────────────────────────────── */
let analyticsInterval = null;

function startAnalyticsRealtime() {
  if (analyticsInterval) clearInterval(analyticsInterval);
  updateTicker();

  let eventCount = 0;
  const logCount = document.getElementById("log-count");

  analyticsInterval = setInterval(() => {
    // update FPS
    const fpsEl = document.getElementById("live-fps");
    if (fpsEl) fpsEl.textContent = Math.round(55 + Math.random() * 10) + " FPS";

    // occasional log event
    if (Math.random() > 0.7) {
      const events = [
        "// scanning feed...",
        "// sentiment model: inference complete",
        "// embedding vector: updated",
        "// new article detected",
        "// clustering: recalculated",
        "// anomaly score: 0.03",
      ];
      addLog(events[Math.floor(Math.random() * events.length)]);
      eventCount++;
      if (logCount) logCount.textContent = `${eventCount} events`;
    }
  }, 800);
}

function stopAnalyticsRealtime() {
  if (analyticsInterval) {
    clearInterval(analyticsInterval);
    analyticsInterval = null;
  }
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
