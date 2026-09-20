/**
 * ui.js
 * Cached DOM references, toast notifications, and small view helpers.
 */

/** Query one element (throws early if a required node is missing). */
const $ = (selector, required = true) => {
  const el = document.querySelector(selector);
  if (!el && required) console.warn(`[ui] Missing element: ${selector}`);
  return el;
};

/** All DOM nodes the app touches, resolved once. */
export const dom = {
  // Now playing
  nowPlaying: $(".now-playing"),
  trackArt: $(".track-art"),
  trackName: $(".track-name"),
  trackArtist: $(".track-artist"),
  // Controls
  playPauseBtn: $(".playpause-track"),
  nextBtn: $(".next-track"),
  prevBtn: $(".prev-track"),
  reshuffleBtn: $("#reshuffle-btn"),
  // Sliders
  seekSlider: $("#seek_slider"),
  volumeSlider: $("#volume_slider"),
  currentTime: $(".current-time"),
  totalDuration: $(".total-duration"),
  // Search
  searchInput: $("#search-input"),
  searchBtn: $("#search-btn"),
  // Webcam
  webcamBtn: $("#webcam-btn"),
  webcamModal: $("#webcam-modal"),
  closeBtn: $(".close-btn"),
  video: $("#webcam"),
  canvas: $("#canvas"),
  captureBtn: $("#capture-btn"),
  searchExpressionBtn: $("#search-expression-btn"),
  expressionResult: $("#expression-result"),
  // Misc
  toastContainer: $("#toast-container"),
};

const PLAY_ICON = '<i class="fa fa-play-circle fa-5x" aria-hidden="true"></i>';
const PAUSE_ICON = '<i class="fa fa-pause-circle fa-5x" aria-hidden="true"></i>';

/** Format seconds as mm:ss (safe against NaN). */
export function formatTime(seconds) {
  if (!Number.isFinite(seconds)) return "00:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Render the "now playing" card for a track. */
export function renderTrack(track, index, total) {
  dom.trackArt.style.backgroundImage = `url("${track.image}")`;
  dom.trackName.textContent = track.name;
  dom.trackArtist.textContent = track.artist;
  dom.nowPlaying.textContent = `PLAYING ${index + 1} OF ${total}`;
}

export function setPlayIcon() {
  dom.playPauseBtn.innerHTML = PLAY_ICON;
  dom.playPauseBtn.setAttribute("aria-label", "Play");
}

export function setPauseIcon() {
  dom.playPauseBtn.innerHTML = PAUSE_ICON;
  dom.playPauseBtn.setAttribute("aria-label", "Pause");
}

export function updateSeek(percent, current, duration) {
  dom.seekSlider.value = Number.isFinite(percent) ? percent : 0;
  dom.currentTime.textContent = formatTime(current);
  dom.totalDuration.textContent = formatTime(duration);
}

export function resetSeek() {
  dom.seekSlider.value = 0;
  dom.currentTime.textContent = "00:00";
  dom.totalDuration.textContent = "00:00";
}

/**
 * Smoothly transition the page background to a mood-appropriate gradient.
 * @param {string} mood
 */
const MOOD_GRADIENTS = {
  happy: ["#f6d365", "#fda085"],
  calm: ["#a1c4fd", "#c2e9fb"],
  relaxed: ["#a1ffce", "#faffd1"],
};

export function setMoodBackground(mood) {
  const [a, b] = MOOD_GRADIENTS[mood] || MOOD_GRADIENTS.relaxed;
  document.body.style.setProperty("--bg-a", a);
  document.body.style.setProperty("--bg-b", b);
}

/**
 * Show a transient toast. Type "error" styles it red.
 * @param {string} message
 * @param {"info"|"error"} [type]
 */
export function toast(message, type = "info") {
  const el = document.createElement("div");
  el.className = `toast${type === "error" ? " toast--error" : ""}`;
  el.setAttribute("role", type === "error" ? "alert" : "status");
  el.textContent = message;
  el.style.pointerEvents = "auto";
  dom.toastContainer.appendChild(el);

  setTimeout(() => {
    el.classList.add("toast--leaving");
    el.addEventListener("animationend", () => el.remove(), { once: true });
  }, 4000);
}
