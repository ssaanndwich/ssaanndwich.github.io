
const SCENARIOS = {
  scraper: {
    code: "403",
    icon: "🐶",
    heading: "Sus activity sniffed",
    description: "We detected prohibited actions. Let's return home.",
  },
  bot: {
    code: "403",
    icon: "🦿",
    heading: "Run along now, robot",
    description: "We detected an automated request. Try again from a browser.",
  },
  rate: {
    code: "429",
    icon: "🦥",
    heading: "Slow down, buddy",
    description: "Decelerate the request rate. Wait a moment and try again.",
  },
  notfound: {
    code: "404",
    icon: "🕳️",
    heading: "Page not found",
    description: "We tragically couldn't find that page. Let's return home.",
  },
};

const DEFAULT = SCENARIOS.notfound;

const params = new URLSearchParams(location.search);
const reason = params.get("reason") || "notfound";
const scene = SCENARIOS[reason] || DEFAULT;

document.body.dataset.scenario = reason; // 'scraper' | 'bot' | 'rate' | 'notfound'
document.getElementById("status-code").textContent = scene.code;
document.getElementById("status-heading").textContent = scene.heading;
document.getElementById("status-icon").textContent = scene.icon;
document.getElementById("status-description").textContent = scene.description;

if (params.get("q")) {
  document.getElementById("q").value = params.get("q");
}

function doSearch() {
  const q = document.getElementById("q").value.trim();
  if (q) location.href = "/?search=" + encodeURIComponent(q);
}

document.getElementById("q").addEventListener("keydown", e => {
  if (e.key === "Enter") doSearch();
});
