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
    renderRadarChart(sourceData);
    renderWordFrequency(latArticles);
    renderEntities(latArticles);
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

/* ── Analytics page: area chart + radar + bars + log ─────────── */
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

  // animate stat bars
  const maxVal = Math.max(pos, neg, neu, 1);
  setTimeout(() => {
    const totalBar = document.getElementById("a-total-bar");
    const posBar = document.getElementById("a-pos-bar");
    const negBar = document.getElementById("a-neg-bar");
    const neuBar = document.getElementById("a-neu-bar");
    if (totalBar) totalBar.style.width = "100%";
    if (posBar) posBar.style.width = Math.round((pos / maxVal) * 100) + "%";
    if (negBar) negBar.style.width = Math.round((neg / maxVal) * 100) + "%";
    if (neuBar) neuBar.style.width = Math.round((neu / maxVal) * 100) + "%";
  }, 200);

  // terminal log
  addLog(`// sentiment data loaded — ${total} articles`, "ok");
  addLog(`// positive: ${pos} | negative: ${neg} | neutral: ${neu}`);

  // generate time-series data from sentiment counts
  const timeLabels = [];
  const now = new Date();
  for (let i = 9; i >= 0; i--) {
    const t = new Date(now.getTime() - i * 60000);
    timeLabels.push(
      String(t.getHours()).padStart(2, "0") + ":" +
      String(t.getMinutes()).padStart(2, "0")
    );
  }

  // distribute counts across time with some variation
  const posSeries = timeLabels.map((_, i) => Math.max(1, Math.round(pos * (0.4 + 0.6 * Math.sin(i * 0.7 + 1)))));
  const negSeries = timeLabels.map((_, i) => Math.max(1, Math.round(neg * (0.3 + 0.7 * Math.cos(i * 0.5 + 2)))));
  const neuSeries = timeLabels.map((_, i) => Math.max(0, Math.round(neu * (0.5 + 0.5 * Math.sin(i * 0.3)))));

  if (analyticsChart) analyticsChart.destroy();

  analyticsChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: timeLabels,
      datasets: [
        {
          label: "Positive",
          data: posSeries,
          borderColor: COLORS.positive,
          backgroundColor: COLORS.posAlpha,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: COLORS.positive,
          pointBorderColor: "transparent",
          borderWidth: 2,
        },
        {
          label: "Negative",
          data: negSeries,
          borderColor: COLORS.negative,
          backgroundColor: COLORS.negAlpha,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: COLORS.negative,
          pointBorderColor: "transparent",
          borderWidth: 2,
        },
        {
          label: "Neutral",
          data: neuSeries,
          borderColor: COLORS.neutral,
          backgroundColor: COLORS.neuAlpha,
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointBackgroundColor: COLORS.neutral,
          pointBorderColor: "transparent",
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
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
          grid: { color: COLORS.grid },
          ticks: { color: "#8a8a8a", maxTicksLimit: 6 },
          border: { color: "#1c1c1c" },
        },
        y: {
          grid: { color: COLORS.grid },
          ticks: { color: "#8a8a8a" },
          border: { color: "#1c1c1c" },
          beginAtZero: true,
        },
      },
    },
  });
}

/* ── Radar Chart (source comparison) ─────────────────────────── */
let radarChart = null;

function renderRadarChart(sourceData) {
  const ctx = document.getElementById("sourceRadarChart");
  if (!ctx) return;

  const labels = sourceData.map(d => {
    const name = (d.source || "unknown").replace(/\.\w+$/, "");
    return name.length > 12 ? name.slice(0, 10) + "…" : name;
  });
  const counts = sourceData.map(d => d.count);

  // pad to at least 5 points for a nice radar shape
  while (labels.length < 5) {
    labels.push("source " + (labels.length + 1));
    counts.push(1);
  }

  if (radarChart) radarChart.destroy();

  radarChart = new Chart(ctx, {
    type: "radar",
    data: {
      labels,
      datasets: [{
        label: "Articles",
        data: counts,
        borderColor: COLORS.positive,
        backgroundColor: COLORS.posAlpha,
        borderWidth: 1.5,
        pointRadius: 2,
        pointBackgroundColor: COLORS.positive,
        pointBorderColor: "transparent",
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
        r: {
          grid: { color: "rgba(255,255,255,0.04)" },
          angleLines: { color: "rgba(255,255,255,0.04)" },
          pointLabels: {
            color: "#8a8a8a",
            font: { size: 9, family: "'JetBrains Mono', monospace" },
          },
          ticks: {
            color: "#8a8a8a",
            backdropColor: "transparent",
            font: { size: 8 },
          },
        },
      },
    },
  });
}

/* ── Word Frequency Cloud ────────────────────────────────────── */
const DEFAULT_WORDS = [
  { word: "market", count: 42, size: "lg" },
  { word: "tech", count: 38, size: "lg" },
  { word: "global", count: 31, size: "md" },
  { word: "trade", count: 28, size: "md" },
  { word: "crisis", count: 24, size: "md" },
  { word: "growth", count: 21, size: "md" },
  { word: "policy", count: 18, size: "sm" },
  { word: "energy", count: 15, size: "sm" },
  { word: "inflation", count: 12, size: "sm" },
  { word: "crypto", count: 10, size: "xs" },
  { word: "fed", count: 9, size: "xs" },
  { word: "stocks", count: 8, size: "xs" },
];

function renderWordFrequency(articles) {
  const container = document.getElementById("wordCloud");
  if (!container) return;

  // extract words from article titles/descriptions
  const wordCounts = {};
  const stopWords = new Set(["the","a","an","is","are","was","were","be","been","being","have","has","had","do","does","did","will","would","could","should","may","might","must","shall","can","need","dare","ought","used","to","of","in","for","on","with","at","by","from","as","into","through","during","before","after","above","below","between","under","and","but","or","yet","so","if","because","although","though","while","where","when","that","which","who","whom","whose","what","this","these","those","i","you","he","she","it","we","they","me","him","her","us","them","my","your","his","her","its","our","their","mine","yours","hers","ours","theirs","all","each","every","both","few","more","most","other","some","such","no","nor","not","only","own","same","than","too","very","just","now","then","here","there","up","out","off","over","down","again","once","more","most","other","some","time","way","year","work","government","day","man","world","life","hand","part","child","eye","woman","place","week","case","point","company","number","group","problem","fact","about","than","only","other","new","first","also","after","back","just","own","same","last","long","little","good","great","right","old","different","small","large","next","early","young","important","public","same","able"]); 

  if (articles && articles.length > 0) {
    articles.forEach(article => {
      const text = ((article.title || "") + " " + (article.description || "")).toLowerCase();
      const words = text.match(/[a-z]{3,}/g) || [];
      words.forEach(w => {
        if (!stopWords.has(w)) {
          wordCounts[w] = (wordCounts[w] || 0) + 1;
        }
      });
    });
  }

  // merge with defaults or use defaults if no articles
  const merged = {};
  DEFAULT_WORDS.forEach(d => { merged[d.word] = d.count; });
  Object.entries(wordCounts).forEach(([w, c]) => {
    merged[w] = (merged[w] || 0) + c;
  });

  const sorted = Object.entries(merged)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const maxCount = sorted[0]?.[1] || 1;

  container.innerHTML = sorted.map(([word, count]) => {
    const pct = count / maxCount;
    let sizeClass = "xs";
    if (pct > 0.85) sizeClass = "lg";
    else if (pct > 0.6) sizeClass = "md";
    else if (pct > 0.35) sizeClass = "sm";
    return `<span class="word-tag ${sizeClass}">${word}</span>`;
  }).join("");
}

/* ── Entity Extraction ───────────────────────────────────────── */
const DEFAULT_ENTITIES = [
  { name: "Wall Street Journal", type: "org", count: 12 },
  { name: "Federal Reserve", type: "org", count: 8 },
  { name: "United States", type: "loc", count: 6 },
  { name: "CBS News", type: "org", count: 5 },
  { name: "Politico", type: "org", count: 4 },
  { name: "CNN", type: "org", count: 3 },
  { name: "Jerome Powell", type: "per", count: 3 },
  { name: "China", type: "loc", count: 2 },
  { name: "Bitcoin", type: "msc", count: 2 },
];

function renderEntities(articles) {
  const container = document.getElementById("entityList");
  if (!container) return;

  // try to extract entities from source names
  const sourceEntities = {};
  if (articles && articles.length > 0) {
    articles.forEach(article => {
      const source = article.source || "Unknown";
      sourceEntities[source] = (sourceEntities[source] || 0) + 1;
    });
  }

  const entities = [];
  if (Object.keys(sourceEntities).length > 0) {
    Object.entries(sourceEntities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .forEach(([name, count]) => {
        const type = name.includes("News") || name.includes("Journal") || name.includes("Post") || name.includes("Times")
          ? "org" : "msc";
        entities.push({ name, type, count });
      });
  } else {
    DEFAULT_ENTITIES.forEach(e => entities.push({ ...e }));
  }

  container.innerHTML = entities.map(e => `
    <div class="entity-row">
      <span class="entity-type ${e.type}">${e.type.toUpperCase()}</span>
      <span class="entity-name">${e.name}</span>
      <span class="entity-count">${e.count}</span>
    </div>
  `).join("");
}

/* ── Live Ticker ───────────────────────────────────────────── */
const TICKER_ITEMS = [
  "sentiment: bullish",
  "federal reserve statement pending",
  "global trade volume: +2.3%",
  "energy prices stabilizing",
  "inflation data incoming",
  "crypto market: mixed signals",
  "tech sector earnings: positive",
  "oil prices: volatile",
  "unemployment rate: steady",
  "central bank meeting: tomorrow",
];

function startTicker() {
  const container = document.getElementById("tickerContent");
  if (!container) return;

  const items = [...TICKER_ITEMS, ...TICKER_ITEMS]; // duplicate for seamless loop
  container.innerHTML = items.map(item =>
    `<span>${item}</span>`
  ).join("");
}

/* ── Terminal log helper ─────────────────────────────────────── */
let logEventCount = 0;

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

  logEventCount++;
  const countBadge = document.getElementById("logCount");
  if (countBadge) countBadge.textContent = logEventCount + " events";

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

/* ── FPS Counter ───────────────────────────────────────────── */
function startFpsCounter() {
  const el = document.getElementById("fps-counter");
  if (!el) return;
  let lastTime = performance.now();
  let frames = 0;
  function tick(now) {
    frames++;
    if (now - lastTime >= 1000) {
      el.textContent = frames + " FPS";
      frames = 0;
      lastTime = now;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

/* ── Init ────────────────────────────────────────────────────── */
document.addEventListener("DOMContentLoaded", () => {
  startTicker();
  startFpsCounter();
  fetchAnalytics();
});
