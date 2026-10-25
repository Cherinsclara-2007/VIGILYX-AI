/* =========================================================
   VIGILYX AI DASHBOARD
   1. CONFIG
   2. SAMPLE DATA
   3. DATA SOURCE
   4. UI, NAVIGATION, CHARTS AND CONTROLS
   5. CAMERA STREAM
   ========================================================= */

/* ---------- 1. CONFIG ---------- */

const CONFIG = {
  API_BASE: "",
};


/* ---------- 2. SAMPLE DATA ---------- */

const SAMPLE_DATA = {
  stats: {
    detections: 1284,
    alerts: 37,
    recordings: 52,
    system: "Idle",
  },

  events: [
    {
      id: 1,
      type: "Restricted zone entry",
      camera: "Camera 01",
      time: "2026-10-18 09:42:15",
      severity: "high",
      zone: true,
    },
    {
      id: 2,
      type: "Person detected",
      camera: "Camera 01",
      time: "2026-10-18 09:31:02",
      severity: "low",
      zone: false,
    },
    {
      id: 3,
      type: "Loitering in zone",
      camera: "Camera 01",
      time: "2026-10-18 08:57:48",
      severity: "medium",
      zone: true,
    },
    {
      id: 4,
      type: "Restricted zone entry",
      camera: "Camera 01",
      time: "2026-10-17 22:14:09",
      severity: "high",
      zone: true,
    },
    {
      id: 5,
      type: "Multiple persons detected",
      camera: "Camera 01",
      time: "2026-10-17 18:03:31",
      severity: "medium",
      zone: false,
    },
    {
      id: 6,
      type: "Person detected",
      camera: "Camera 01",
      time: "2026-10-17 15:26:55",
      severity: "low",
      zone: false,
    },
  ],

  recordings: [
    {
      file: "alert_2026-10-18_094215.mp4",
      date: "18 Oct 2026, 09:42",
      duration: "0:48",
      size: "14.2 MB",
    },
    {
      file: "alert_2026-10-18_085748.mp4",
      date: "18 Oct 2026, 08:57",
      duration: "1:12",
      size: "21.0 MB",
    },
    {
      file: "alert_2026-10-17_221409.mp4",
      date: "17 Oct 2026, 22:14",
      duration: "0:36",
      size: "10.8 MB",
    },
    {
      file: "session_2026-10-17_1500.mp4",
      date: "17 Oct 2026, 15:00",
      duration: "12:05",
      size: "182 MB",
    },
    {
      file: "alert_2026-10-16_113002.mp4",
      date: "16 Oct 2026, 11:30",
      duration: "0:54",
      size: "16.1 MB",
    },
  ],

  hourly: [
    2, 1, 0, 0, 1, 3, 8, 19, 34, 52, 61, 58,
    66, 71, 64, 59, 63, 70, 48, 31, 22, 14, 8, 4,
  ],

  weekly: [
    { d: "Mon", v: 5 },
    { d: "Tue", v: 8 },
    { d: "Wed", v: 4 },
    { d: "Thu", v: 9 },
    { d: "Fri", v: 6 },
    { d: "Sat", v: 2 },
    { d: "Sun", v: 3 },
  ],

  types: [
    { n: "Person detected", v: 61, c: "#4c8dff" },
    { n: "Restricted zone entry", v: 24, c: "#ff5d73" },
    { n: "Loitering", v: 9, c: "#ffb84d" },
    { n: "Multiple persons", v: 6, c: "#22d3ee" },
  ],
};


/* ---------- 3. DATA SOURCE ---------- */

const DataSource = {
  isLive() {
    return Boolean(CONFIG.API_BASE);
  },

  async load() {
   const response = await fetch(`${CONFIG.API_BASE}/api/dashboard`);

    const response = await fetch(
      `${CONFIG.API_BASE}/api/dashboard`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`Dashboard API failed: HTTP ${response.status}`);
    }

    const data = await response.json();

    // Validate the real backend response.
    const requiredArrays = [
      "events",
      "recordings",
      "hourly",
      "weekly",
      "types"
    ];

    for (const key of requiredArrays) {
      if (!Array.isArray(data[key])) {
        throw new Error(`Invalid dashboard response: ${key} must be an array.`);
      }
    }

    if (!data.stats || typeof data.stats !== "object") {
      throw new Error("Invalid dashboard response: stats are missing.");
    }

    console.log("Live backend dashboard data:", data);

    return {
      ...data,
      source: "backend"
    };
  }
};


/* ---------- 4. UI HELPERS ---------- */

const $ = (selector, element = document) =>
  element.querySelector(selector);

const $$ = (selector, element = document) =>
  [...element.querySelectorAll(selector)];


/* ---------- ICONS ---------- */

const FALLBACK_ICONS = {
  "shield-check":
    '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',

  "layout-dashboard":
    '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',

  video:
    '<path d="m22 8-6 4 6 4V8z"/><rect x="2" y="6" width="14" height="12" rx="2"/>',

  "video-off":
    '<path d="M10.7 5H14a2 2 0 0 1 2 2v3.3l6-2.3v8"/><path d="M16 16v1a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h1"/><path d="m2 2 20 20"/>',

  siren:
    '<circle cx="12" cy="12" r="5"/><path d="M12 2v2M4.9 4.9l1.4 1.4M2 12h2M20 12h2M19.1 4.9l-1.4-1.4"/>',

  film:
    '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M7 3v18M17 3v18M3 8h4M3 16h4M17 8h4M17 16h4"/>',

  "bar-chart-3":
    '<path d="M3 3v18h18"/><path d="M8 17v-6M13 17V7M18 17v-3"/>',

  info:
    '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>',

  bell:
    '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21h4"/>',

  clock:
    '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',

  "camera-off":
    '<path d="m2 2 20 20"/><path d="M7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14M9.5 4h5L16 7h2a2 2 0 0 1 2 2v7"/>',

  menu:
    '<path d="M4 6h16M4 12h16M4 18h16"/>',

  play:
    '<path d="m6 3 14 9-14 9V3z"/>',

  square:
    '<rect x="4" y="4" width="16" height="16" rx="2"/>',

  "octagon-alert":
    '<path d="M7.9 2h8.2L22 7.9v8.2L16.1 22H7.9L2 16.1V7.9z"/><path d="M12 8v4M12 16h.01"/>',

  "user-round":
    '<circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 0 0-16 0"/>',

  users:
    '<circle cx="9" cy="7" r="4"/><path d="M2 21v-2a4 4 0 0 1 4-4h6a4 4 0 0 1 4 4v2M16 3a4 4 0 0 1 0 8M22 21v-2a4 4 0 0 0-3-3.9"/>',

  activity:
    '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',

  "flask-conical":
    '<path d="M10 2v7.5L4 20a1 1 0 0 0 .9 1.5h14.2A1 1 0 0 0 20 20l-6-10.5V2M8.5 2h7"/>',
};


function renderIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
    return;
  }

  $$("[data-lucide]").forEach(element => {
    const path =
      FALLBACK_ICONS[element.dataset.lucide] ||
      '<circle cx="12" cy="12" r="9"/>';

    element.outerHTML = `
      <svg
        class="lucide"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        ${path}
      </svg>
    `;
  });
}


/* ---------- NAVIGATION ---------- */

const PAGES = {
  overview: ["Overview", "System summary"],
  live: ["Live Monitoring", "Camera feed and restricted-zone view"],
  events: ["Security Events", "Alerts and detections log"],
  recordings: ["Recordings", "Saved clips and sessions"],
  analytics: ["Analytics", "Detection trends"],
  about: ["About Project", "Goals and technology"],
};


function closeMenu() {
  $("#sidebar")?.classList.remove("open");
  $("#scrim")?.classList.remove("show");
}


function go() {
  const requestedPage = location.hash.slice(1);

  const id = PAGES[requestedPage]
    ? requestedPage
    : "overview";

  $$(".page").forEach(page => {
    page.hidden = page.id !== `page-${id}`;
  });

  $$(".nav a").forEach(link => {
    const active = link.dataset.page === id;

    link.classList.toggle("active", active);

    if (active) {
      link.setAttribute("aria-current", "page");
    } else {
      link.removeAttribute("aria-current");
    }
  });

  if ($("#pageTitle")) {
    $("#pageTitle").textContent = PAGES[id][0];
  }

  if ($("#pageSub")) {
    $("#pageSub").textContent = PAGES[id][1];
  }

  document.title = `${PAGES[id][0]} · VIGILYX AI`;

  closeMenu();
  window.scrollTo(0, 0);
}


/* ---------- SECURITY EVENTS ---------- */

function eventItem(event) {
  const severity = ["high", "medium", "low"].includes(
    String(event.severity || "").toLowerCase()
  )
    ? String(event.severity).toLowerCase()
    : "low";

  const type = String(
    event.message || event.type || "System Event"
  );

  const camera = String(event.camera || "Camera 01");
  const time = String(event.time || "Time unavailable");

  const isAlert = /alert|intrusion|restricted.?zone/i.test(type);

  const icon = isAlert
    ? "octagon-alert"
    : /multiple/i.test(type)
      ? "users"
      : "activity";

  const item = document.createElement("li");
  item.className = `ev sev-${severity}${isAlert ? " zone" : ""}`;

  const iconBox = document.createElement("span");
  iconBox.className = "ev-ico";
  iconBox.innerHTML = `<i data-lucide="${icon}"></i>`;

  const content = document.createElement("span");

  const title = document.createElement("strong");
  title.textContent = type;

  const details = document.createElement("small");
  details.textContent = `${camera} · ${time}`;

  content.append(title, details);

  const badge = document.createElement("span");
  badge.className = "sev";
  badge.textContent =
    severity.charAt(0).toUpperCase() + severity.slice(1);

  item.append(iconBox, content, badge);

  return item.outerHTML;
}


function renderEvents(list, filter = "all") {
  const events = Array.isArray(list) ? list : [];

  const filtered = events.filter(event =>
    filter === "all" || event.severity === filter
  );

  if ($("#eventsAll")) {
    $("#eventsAll").innerHTML =
      filtered.map(eventItem).join("") ||
      '<li class="muted">No events match this filter.</li>';
  }

  renderIcons();
}


/* ---------- STATISTICS ---------- */

function renderStats(data) {
  const stats = data || SAMPLE_DATA.stats;

  const items = [
    [
      "Total detections",
      Number(stats.detections ?? 0).toLocaleString(),
      "activity",
      "76,141,255",
      "Live data",
    ],
    [
      "Security alerts",
      Number(stats.alerts ?? 0).toLocaleString(),
      "octagon-alert",
      "255,93,115",
      "Live data",
    ],
    [
      "Total recordings",
      Number(stats.recordings ?? 0).toLocaleString(),
      "film",
      "34,211,238",
      "Recorded files",
    ],
    [
      "System status",
      stats.system || "Unknown",
      "shield-check",
      "147,161,192",
      "Backend status",
    ],
  ];

  if ($("#stats")) {
    $("#stats").innerHTML = items.map(
      ([label, value, icon, color, note]) => `
        <div class="stat">
          <span class="stat-ico" style="--c:${color}">
            <i data-lucide="${icon}"></i>
          </span>

          <div>
            <span>${label}</span>
            <b>${value}</b>
            <em>${note}</em>
          </div>
        </div>
      `
    ).join("");
  }

  renderIcons();
}


/* ---------- RECORDINGS ---------- */

function renderRecordings(list) {
  const recordings = Array.isArray(list) ? list : [];

  if ($("#recCount")) {
    $("#recCount").textContent =
      `${recordings.length} recording${recordings.length === 1 ? "" : "s"}`;
  }

  if ($("#recRows")) {
    $("#recRows").innerHTML = recordings.map(recording => `
      <div class="tr" role="row">
        <span class="fname">
          <i data-lucide="film"></i>
          ${recording.file}
        </span>

        <span>${recording.date}</span>
        <span>${recording.duration}</span>
        <span>${recording.size}</span>

        <button class="btn play" data-play="${recording.file}">
          <i data-lucide="play"></i>
          Play
        </button>
      </div>
    `).join("") ||
      '<div class="muted">No recordings available.</div>';
  }

  renderIcons();
}


/* ---------- BAR CHARTS ---------- */

/* ---------- BAR CHART ---------- */

function barChart(element, labels, values, width = 640, height = 220) {
  if (!element) return;

  const safeLabels = Array.isArray(labels) ? labels : [];
  const safeValues = Array.isArray(values)
    ? values.map(value => {
        const number = Number(value);
        return Number.isFinite(number) ? Math.max(0, number) : 0;
      })
    : [];

  if (!safeValues.length) {
    element.innerHTML =
      '<p class="muted">No chart data available.</p>';
    return;
  }

  const maxValue = Math.max(...safeValues, 1);
  const max = maxValue <= 20
    ? 20
    : Math.ceil(maxValue * 1.1);

  const padding = { left: 36, right: 8, bottom: 38, top: 16 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.bottom - padding.top;
  const barWidth = chartWidth / safeValues.length;

  let graphics = "";

  [0, 0.5, 1].forEach(level => {
    const y = padding.top + chartHeight * (1 - level);

    graphics += `
      <line
        x1="${padding.left}"
        x2="${width - padding.right}"
        y1="${y}"
        y2="${y}"
        stroke="rgba(120,160,255,.15)"
      />
      <text
        x="${padding.left - 8}"
        y="${y + 4}"
        text-anchor="end"
        class="chart-label"
      >${Math.round(max * level)}</text>
    `;
  });

  safeValues.forEach((value, index) => {
    const barHeight = (value / max) * chartHeight;
    const x = padding.left + index * barWidth + barWidth * 0.18;
    const y = padding.top + chartHeight - barHeight;
    const visibleHeight = value > 0 ? Math.max(2, barHeight) : 0;

    graphics += `
      <rect
        class="bar"
        x="${x}"
        y="${y}"
        width="${Math.max(1, barWidth * 0.64)}"
        height="${visibleHeight}"
        rx="3"
        fill="url(#vigilixBarGradient)"
        stroke="#22d3ee"
        stroke-width="1"
      >
        <title>${safeLabels[index] ?? ""}: ${value}</title>
      </rect>
    `;

    const showLabel =
      safeValues.length <= 12 ||
      index % Math.ceil(safeValues.length / 8) === 0;

    if (showLabel) {
      graphics += `
        <text
          x="${x + barWidth * 0.5}"
          y="${height - 8}"
          text-anchor="middle"
          class="chart-label"
        >${safeLabels[index] ?? ""}</text>
      `;
    }
  });

  element.innerHTML = `
    <svg
      viewBox="0 0 ${width} ${height}"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Security activity bar chart"
    >
      <defs>
        <linearGradient id="vigilixBarGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#22d3ee"/>
          <stop offset="100%" stop-color="#2a6df0"/>
        </linearGradient>
      </defs>
      ${graphics}
    </svg>
  `;
}

/* ---------- DONUT CHART ---------- */

/* ---------- DONUT CHART ---------- */

function donut(element, data) {
  if (!element) return;

  const colors = ["#22d3ee", "#818cf8", "#34d399", "#f59e0b", "#f87171"];

  // Accept backend format: { type: "...", count: 205 }
  // Also supports existing frontend format: { n, v, c }
  const items = (Array.isArray(data) ? data : [])
    .map((item, index) => ({
      n: String(item.type ?? item.n ?? "Other"),
      v: Number(item.count ?? item.v ?? 0),
      c: item.c || colors[index % colors.length]
    }))
    .filter(item => Number.isFinite(item.v) && item.v > 0);

  const total = items.reduce((sum, item) => sum + item.v, 0);

  if (!total) {
    element.innerHTML =
      '<p class="muted">No event type data available.</p>';
    return;
  }

  const radius = 65;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  let arcs = "";

  items.forEach(item => {
    const length = (item.v / total) * circumference;

    arcs += `
      <circle
        r="${radius}"
        cx="90"
        cy="90"
        fill="none"
        stroke="${item.c}"
        stroke-width="20"
        stroke-dasharray="${length} ${circumference - length}"
        stroke-dashoffset="${-offset}"
        transform="rotate(-90 90 90)"
      >
        <title>${item.n}: ${item.v}</title>
      </circle>
    `;

    offset += length;
  });

  element.innerHTML = `
    <svg viewBox="0 0 180 180" role="img" aria-label="Event type distribution">
      ${arcs}
      <text x="90" y="86" text-anchor="middle"
        style="fill:#e8eefc;font-size:25px;font-weight:700">
        ${total}
      </text>
      <text x="90" y="106" text-anchor="middle"
        style="fill:#9aa9c7;font-size:10px">
        logged events
      </text>
    </svg>

    <ul class="legend">
      ${items.map(item => `
        <li>
          <i style="background:${item.c}"></i>
          <span>${item.n}</span>
          <b>${item.v}</b>
        </li>
      `).join("")}
    </ul>
  `;
}


/* ---------- NOTIFICATIONS ---------- */

function toast(message) {
  const element = $("#toast");

  if (!element) return;

  element.textContent = message;
  element.classList.add("show");

  clearTimeout(toast.timer);

  toast.timer = setTimeout(() => {
    element.classList.remove("show");
  }, 3600);
}


/* =========================================================
   5. CAMERA STREAM
   ========================================================= */

/* ---------- CAMERA STATUS ---------- */

function setCameraStatus(connected, message) {
  if ($("#camStatus")) {
    $("#camStatus").innerHTML = connected
      ? '<span class="dot dot-on"></span>Connected'
      : '<span class="dot dot-off"></span>Not connected';
  }

  if ($("#detTag")) {
    $("#detTag").innerHTML = connected
      ? '<span class="dot dot-on"></span>Detection active'
      : '<span class="dot dot-off"></span>Detection idle';
  }
  const topStatus = $("#topCameraStatus");

  if (topStatus) {
    topStatus.classList.toggle("pill-muted", !connected);
    topStatus.classList.toggle("pill-success", connected);

    topStatus.innerHTML = connected
      ? '<i data-lucide="camera"></i><span>Camera connected</span>'
      : '<i data-lucide="camera-off"></i><span>Camera not connected</span>';

    if (window.lucide) {
      window.lucide.createIcons();
    }
  }
  if (message) {
    console.log("[Camera]", message);
  }
}


/* ---------- CREATE CAMERA IMAGE ---------- */

function createCameraImage() {
  const feed = $("#feed");

  if (!feed) {
    throw new Error(
      'Camera feed container "#feed" was not found.'
    );
  }

  let image = $("#cameraStream");

  if (!image) {
    image = document.createElement("img");

    image.id = "cameraStream";
    image.alt = "Live camera feed with YOLO detection";

    image.style.cssText = `
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
      position: absolute;
      inset: 0;
      z-index: 2;
      background: #080c14;
    `;

    feed.prepend(image);
  }

  const emptyMessage = feed.querySelector(".feed-empty");

  if (emptyMessage) {
    emptyMessage.style.display = "none";
  }

  return image;
}


/* ---------- CONNECT CAMERA STREAM ---------- */

function connectCameraStream() {
  const image = createCameraImage();

  // Clear any previous URL and attach stream error handling.
  image.removeAttribute("src");

  image.onload = () => {
    console.log(
      "Camera stream image loaded:",
      image.naturalWidth,
      "x",
      image.naturalHeight
    );
  };

  image.onerror = () => {
    console.error(
      "Camera stream failed to load. Check Flask terminal and /api/camera/stream."
    );

    toast(
      "Camera started, but video stream could not load. Check the backend."
    );
  };

  // Set the URL AFTER creating the image.
  const streamUrl =
    `${CONFIG.API_BASE}/api/camera/stream?t=${Date.now()}`;

  console.log("Connecting camera stream:", streamUrl);

  image.src = streamUrl;

  // Verify that the URL has actually been assigned.
  console.log("Assigned camera image URL:", image.src);

  return image;
}


/* ---------- START CAMERA ---------- */

async function startCamera() {
  const startButton = $("#startBtn");
  const stopButton = $("#stopBtn");

  if (!startButton || !stopButton) {
    console.error("Start or Stop button was not found.");
    return;
  }

  startButton.disabled = true;
  startButton.textContent = "Starting...";

  try {
    const response = await fetch(
      `${CONFIG.API_BASE}/api/camera/start`,
      {
        method: "POST",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Could not start camera."
      );
    }

    console.log("Camera start response:", result);

    // Request the camera stream and assign its URL.
    connectCameraStream();

    setCameraStatus(
      true,
      "Camera monitoring requested."
    );

    startButton.textContent = "Monitoring active";
    stopButton.disabled = false;

    toast("Camera monitoring started.");

  } catch (error) {
    console.error("Camera start failed:", error);

    startButton.disabled = false;
    startButton.textContent = "Start monitoring";

    setCameraStatus(false);

    toast(
      error.message || "Unable to connect to the camera."
    );
  }
}


/* ---------- STOP CAMERA ---------- */

async function stopCamera() {
  const startButton = $("#startBtn");
  const stopButton = $("#stopBtn");

  if (!startButton || !stopButton) return;

  stopButton.disabled = true;
  stopButton.textContent = "Stopping...";

  try {
    const response = await fetch(
      `${CONFIG.API_BASE}/api/camera/stop`,
      {
        method: "POST",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.message || "Could not stop camera."
      );
    }

    console.log("Camera stop response:", result);

    const image = $("#cameraStream");

    if (image) {
      image.onload = null;
      image.onerror = null;
      image.removeAttribute("src");
      image.remove();
    }

    const emptyMessage =
      $("#feed")?.querySelector(".feed-empty");

    if (emptyMessage) {
      emptyMessage.style.display = "";
    }

    setCameraStatus(false, "Camera monitoring stopped.");

    startButton.disabled = false;
    startButton.textContent = "Start monitoring";

    stopButton.textContent = "Stop monitoring";

    toast("Camera monitoring stopped.");

  } catch (error) {
    console.error("Camera stop failed:", error);

    stopButton.disabled = false;
    stopButton.textContent = "Stop monitoring";

    toast(
      error.message || "Unable to stop the camera."
    );
  }
}


/* ---------- CONTROLS ---------- */

function setupControls() {
  $("#startBtn")?.addEventListener("click", startCamera);

  $("#stopBtn")?.addEventListener("click", stopCamera);

  $("#notifBtn")?.addEventListener("click", () => {
    toast(
      "Prototype alerts are available in Security Events."
    );
  });

  $("#recRows")?.addEventListener("click", event => {
    const playButton = event.target.closest("[data-play]");
    if (!playButton) return;

    const filename = playButton.dataset.play;
    if (!filename) {
      toast("Recording filename is missing.");
      return;
    }

    const videoUrl =
      `${CONFIG.API_BASE}/api/recordings/${encodeURIComponent(filename)}`;

    const modal = document.createElement("div");

    modal.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0,0,0,0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

    const video = document.createElement("video");
    video.controls = true;
    video.autoplay = true;
    video.style.cssText =
      "width:100%;max-width:1000px;max-height:85vh;";

    video.src = videoUrl;

    const closeButton = document.createElement("button");
    closeButton.textContent = "✕ Close";
    closeButton.style.cssText =
      "position:absolute;top:20px;right:20px;padding:10px 16px;cursor:pointer;";

    closeButton.addEventListener("click", () => {
      video.pause();
      modal.remove();
    });

    video.addEventListener("error", () => {
      toast("The browser cannot play this video format.");
    });

    modal.append(video, closeButton);
    document.body.appendChild(modal);
  });
  $("#sevFilter")?.addEventListener("click", event => {
    const button = event.target.closest("button");

    if (!button) return;

    $$("#sevFilter button").forEach(item => {
      item.classList.toggle("on", item === button);
    });

    renderEvents(
      state.events || SAMPLE_DATA.events,
      button.dataset.f
    );
  });

  $("#menuBtn")?.addEventListener("click", () => {
    $("#sidebar")?.classList.add("open");
    $("#scrim")?.classList.add("show");
  });

  $("#scrim")?.addEventListener("click", closeMenu);
}


/* ---------- CLOCK ---------- */

function tick() {
  const clock = $("#clock");

  if (!clock) return;

  clock.textContent = new Date().toLocaleString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}


/* ---------- DASHBOARD REFRESH ---------- */
async function refreshDashboard() {
  const banner = document.querySelector("#dataBanner");

  try {
    const response = await fetch(
      `${CONFIG.API_BASE}/api/dashboard`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();

    // Update events
    if (Array.isArray(data.events)) {
      state.events = data.events;

      if ($("#eventsMini")) {
        $("#eventsMini").innerHTML =
          state.events.slice(0, 4).map(eventItem).join("") ||
          '<li class="muted">No recent events.</li>';
      }

      if ($("#eventsLive")) {
        $("#eventsLive").innerHTML =
          state.events.slice(0, 3).map(eventItem).join("") ||
          '<li class="muted">No recent events.</li>';
      }

      const activeFilter =
        $("#sevFilter .on")?.dataset.f || "all";

      renderEvents(state.events, activeFilter);
    }

    // Update statistics
    if (data.stats) {
      renderStats(data.stats);
    }

    // Update recordings
    if (Array.isArray(data.recordings)) {
      renderRecordings(data.recordings);
    }

    // Update hourly charts
    if (Array.isArray(data.hourly)) {
      const hourlyLabels = data.hourly.map(item => item.hour);
      const hourlyValues = data.hourly.map(
        item => Number(item.count) || 0
      );

      barChart(
        $("#chartHourlyMini"),
        hourlyLabels,
        hourlyValues,
        420,
        200
      );

      barChart(
        $("#chartHourly"),
        hourlyLabels,
        hourlyValues,
        760,
        300
      );
    }

    // Update weekly chart
    if (Array.isArray(data.weekly)) {
      barChart(
        $("#chartWeek"),
        data.weekly.map(item => item.day),
        data.weekly.map(item => Number(item.count) || 0),
        900,
        220
      );
    }

    // Update event types donut chart
    if (Array.isArray(data.types)) {
      donut($("#chartDonut"), data.types);
    }

    // Hide warning when backend responds successfully
    if (banner) {
      banner.hidden = true;
    }

    renderIcons();

    console.log(
      "Dashboard refreshed:",
      new Date().toLocaleTimeString()
    );

  } catch (error) {
    console.warn(
      "Dashboard refresh failed:",
      error.message
    );

    if (banner) {
      banner.hidden = false;
      banner.innerHTML = `
        <i data-lucide="alert-triangle"></i>
        <span>
          <strong>Backend disconnected.</strong>
          Dashboard data is temporarily unavailable.
        </span>
      `;

      renderIcons();
    }
  }
}
/* ---------- DASHBOARD INITIALIZATION ---------- */

const state = {};

(async function init() {
  try {
    const data = await DataSource.load();

    console.log("FINAL DASHBOARD DATA:", data);

    state.events = data.events || [];

    renderStats(data.stats || {});

    if ($("#eventsMini")) {
      $("#eventsMini").innerHTML =
        state.events.slice(0, 4).map(eventItem).join("") ||
        '<li class="muted">No recent events.</li>';
    }

    if ($("#eventsLive")) {
      $("#eventsLive").innerHTML =
        state.events.slice(0, 3).map(eventItem).join("") ||
        '<li class="muted">No recent events.</li>';
    }

    renderEvents(state.events);
    renderRecordings(data.recordings || []);

    const hourly = Array.isArray(data.hourly) ? data.hourly : [];
    const weekly = Array.isArray(data.weekly) ? data.weekly : [];
    const types = Array.isArray(data.types) ? data.types : [];

    console.log("Hourly chart data:", hourly);
    console.log("Weekly chart data:", weekly);
    console.log("Event type chart data:", types);

    // Hourly charts
    barChart(
      $("#chartHourlyMini"),
      hourly.map(item => item.hour),
      hourly.map(item => Number(item.count) || 0),
      420,
      200
    );

    barChart(
      $("#chartHourly"),
      hourly.map(item => item.hour),
      hourly.map(item => Number(item.count) || 0),
      760,
      300
    );

    // Weekly chart
    barChart(
      $("#chartWeek"),
      weekly.map(item => item.day),
      weekly.map(item => Number(item.count) || 0),
      900,
      220
    );

    // Event type donut chart
    donut($("#chartDonut"), types);

    // Initialize controls and icons
    setupControls();
    renderIcons();

    // Update clock every second
    tick();
    setInterval(tick, 1000);

    // Refresh dashboard data every 5 seconds
   // Initialize navigation immediately
    window.addEventListener("hashchange", go);
    go();

// Refresh dashboard data without blocking navigation
    refreshDashboard()
    .then(() => {
      console.log("Dashboard refreshed successfully.");
    })
    .catch((error) => {
      console.error("Dashboard refresh failed:", error);
    });

// Refresh dashboard data every 5 seconds
  setInterval(() => {
    refreshDashboard().catch((error) => {
      console.error("Dashboard refresh failed:", error);
    });
  }, 5000);

    // Responsive feed height
    const feed = $("#feed");

    if (feed) {
      const setHeight = () => {
        feed.style.setProperty("--h", `${feed.offsetHeight}px`);
      };

      setHeight();
      window.addEventListener("resize", setHeight);
    }

  } catch (error) {
    console.error("Dashboard initialization failed:", error);

    toast(
      "Dashboard could not load. Please check the browser console."
    );
  }
})();
