/**
 * webcam.js
 * Facial-expression search. The heavy face-api.js library and its models are
 * loaded LAZILY the first time the modal is opened — keeping initial page load
 * fast. Falls back to a random mood if models can't be loaded.
 *
 * Fixes over the original:
 *  - No `let faceapi = null` shadowing bug — we reference the global the CDN
 *    script defines (`window.faceapi`) after loading it on demand.
 *  - Relative model path ("models/") so it works under sub-paths (GitHub Pages).
 *  - Proper camera teardown; modal accessibility (Esc to close, focus).
 */

import { dom, toast } from "./ui.js";

const FACE_API_SRC =
  "https://cdnjs.cloudflare.com/ajax/libs/face-api.js/0.22.2/face-api.min.js";
const MODEL_URI = "models"; // relative → works on any base path

export class Webcam {
  /** @param {import("./search.js").Search} search */
  constructor(search) {
    this.search = search;
    this.stream = null;
    this.captured = false;
    this.modelsReady = false;
    this._faceApiLoading = null;

    this._bind();
    this._checkSupport();
  }

  _bind() {
    dom.webcamBtn.addEventListener("click", () => this.open());
    dom.closeBtn.addEventListener("click", () => this.close());
    dom.captureBtn.addEventListener("click", () => this.capture());
    dom.searchExpressionBtn.addEventListener("click", () => this.analyzeAndSearch());

    // Click backdrop or press Esc to close.
    dom.webcamModal.addEventListener("click", (e) => {
      if (e.target === dom.webcamModal) this.close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !dom.webcamModal.hidden) this.close();
    });
  }

  _checkSupport() {
    if (!navigator.mediaDevices?.getUserMedia) {
      dom.webcamBtn.disabled = true;
      dom.webcamBtn.title = "Webcam not supported in this browser";
      return false;
    }
    return true;
  }

  /* ----- library / model loading (lazy) -------------------------------- */

  _loadFaceApi() {
    if (window.faceapi) return Promise.resolve(window.faceapi);
    if (this._faceApiLoading) return this._faceApiLoading;

    this._faceApiLoading = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = FACE_API_SRC;
      script.async = true;
      script.onload = () => resolve(window.faceapi);
      script.onerror = () => reject(new Error("Failed to load face-api.js"));
      document.head.appendChild(script);
    });
    return this._faceApiLoading;
  }

  async _loadModels() {
    if (this.modelsReady) return true;
    try {
      const faceapi = await this._loadFaceApi();
      dom.expressionResult.textContent = "Loading expression models…";
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URI),
        faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URI),
      ]);
      this.modelsReady = true;
      dom.expressionResult.textContent =
        "Ready! Click 'Capture Expression'.";
      return true;
    } catch (err) {
      console.warn("Face models unavailable, using fallback:", err);
      dom.expressionResult.textContent =
        "Expression models unavailable — a mood will be picked for you.";
      return false;
    }
  }

  /* ----- camera -------------------------------------------------------- */

  async open() {
    if (!this._checkSupport()) return;

    dom.webcamModal.hidden = false;
    dom.expressionResult.textContent = "Accessing webcam…";

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: "user" },
        audio: false,
      });
      dom.video.srcObject = this.stream;
      await dom.video.play();
      dom.expressionResult.textContent = "Webcam ready. Capture your expression.";
      // Warm up models in the background (non-blocking).
      this._loadModels();
    } catch (err) {
      console.error("Webcam error:", err);
      dom.expressionResult.innerHTML = `
        <p class="error">Couldn't access the webcam.</p>
        <ul>
          <li>Check that a camera is connected</li>
          <li>Allow camera permission for this site</li>
          <li>Serve the page over HTTPS or localhost</li>
        </ul>`;
      dom.captureBtn.disabled = true;
    }
  }

  close() {
    dom.webcamModal.hidden = true;
    this._stopStream();
    this._reset();
  }

  _stopStream() {
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    dom.video.srcObject = null;
  }

  _reset() {
    this.captured = false;
    dom.searchExpressionBtn.disabled = true;
    dom.captureBtn.disabled = false;
    dom.expressionResult.textContent = "";
  }

  capture() {
    if (!dom.video.srcObject) {
      dom.expressionResult.textContent = "Webcam not ready.";
      return;
    }
    const ctx = dom.canvas.getContext("2d");
    dom.canvas.width = dom.video.videoWidth;
    dom.canvas.height = dom.video.videoHeight;
    ctx.drawImage(dom.video, 0, 0, dom.canvas.width, dom.canvas.height);

    this.captured = true;
    dom.searchExpressionBtn.disabled = false;
    dom.expressionResult.textContent = "Captured! Click Search to analyse.";
  }

  /* ----- analysis ------------------------------------------------------ */

  async _detectMood() {
    if (this.modelsReady && window.faceapi) {
      try {
        const faceapi = window.faceapi;
        const detection = await faceapi
          .detectSingleFace(dom.canvas, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();
        if (detection?.expressions) {
          return mapExpressionToMood(detection.expressions);
        }
      } catch (err) {
        console.warn("Detection failed, using fallback:", err);
      }
    }
    // Fallback: random mood.
    const moods = ["happy", "calm", "relaxed"];
    return moods[Math.floor(Math.random() * moods.length)];
  }

  async analyzeAndSearch() {
    if (!this.captured) {
      dom.expressionResult.textContent = "Capture an image first.";
      return;
    }
    dom.expressionResult.textContent = "Analysing expression…";

    const mood = await this._detectMood();
    dom.expressionResult.textContent = `Detected mood: ${mood}. Playing ${mood} music.`;

    const found = this.search.byMood(mood);
    if (found) {
      toast(`Playing ${mood} music`);
      setTimeout(() => this.close(), 1200);
    } else {
      dom.expressionResult.textContent = `No ${mood} tracks available. Try again.`;
    }
  }
}

/**
 * Reduce face-api's 7 expression scores to our 3 canonical moods.
 * @param {Record<string, number>} expr
 * @returns {"happy"|"calm"|"relaxed"}
 */
function mapExpressionToMood(expr) {
  // Highest-scoring expression wins, then map into our buckets.
  const dominant = Object.entries(expr).sort((a, b) => b[1] - a[1])[0]?.[0];
  switch (dominant) {
    case "happy":
    case "surprised":
      return "happy";
    case "sad":
    case "angry":
    case "fearful":
    case "disgusted":
      return "calm";
    case "neutral":
    default:
      return "relaxed";
  }
}
