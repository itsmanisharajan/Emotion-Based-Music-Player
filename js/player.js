/**
 * player.js
 * Audio engine. Owns the single <audio> element and all playback state.
 *
 * Fixes over the original:
 *  - `ended` listener attached ONCE (no stacking).
 *  - Volume initialised from the slider on load.
 *  - Uses `timeupdate`/`loadedmetadata` events instead of a 1s polling
 *    setInterval → smoother, cheaper, no drift.
 *  - Robust error handling via the audio `error` event.
 */

import { dom, renderTrack, setPlayIcon, setPauseIcon, resetSeek, updateSeek, setMoodBackground, toast } from "./ui.js";

export class Player {
  /** @param {import("./playlist.js").Playlist} playlist */
  constructor(playlist) {
    this.playlist = playlist;
    this.index = 0;
    this.isPlaying = false;

    this.audio = new Audio();
    this.audio.preload = "metadata";

    this._bindAudioEvents();
    this._bindControls();

    // Initial volume from the slider.
    this.setVolumeFromSlider();

    // Load a random starting track.
    this.index = playlist.randomIndex();
    this.load(this.index, { autoplay: false });
  }

  /* ----- wiring -------------------------------------------------------- */

  _bindAudioEvents() {
    // Attached once — advances to next track when the current one finishes.
    this.audio.addEventListener("ended", () => this.next());

    this.audio.addEventListener("timeupdate", () => {
      const { currentTime, duration } = this.audio;
      const percent = duration ? (currentTime / duration) * 100 : 0;
      updateSeek(percent, currentTime, duration);
    });

    this.audio.addEventListener("loadedmetadata", () => {
      updateSeek(0, 0, this.audio.duration);
    });

    this.audio.addEventListener("error", () => {
      // Ignore the empty-src state that occurs before the first load.
      if (!this.audio.src) return;
      console.error("Audio error:", this.audio.error);
      toast("Couldn't play this track. Skipping…", "error");
      this.next();
    });
  }

  _bindControls() {
    dom.playPauseBtn.addEventListener("click", () => this.toggle());
    dom.nextBtn.addEventListener("click", () => this.next());
    dom.prevBtn.addEventListener("click", () => this.prev());
    dom.reshuffleBtn.addEventListener("click", () => this.reshuffle());

    dom.seekSlider.addEventListener("input", () => this.seekTo(dom.seekSlider.value));
    dom.volumeSlider.addEventListener("input", () => this.setVolumeFromSlider());

    // Keyboard: space toggles play/pause when not typing in the search box.
    document.addEventListener("keydown", (e) => {
      if (e.code === "Space" && document.activeElement !== dom.searchInput) {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  /* ----- playback ------------------------------------------------------ */

  /**
   * Load a track by index.
   * @param {number} index
   * @param {{autoplay?: boolean}} [opts]
   */
  load(index, { autoplay = true } = {}) {
    this.index = (index + this.playlist.length) % this.playlist.length;
    const track = this.playlist.at(this.index);

    resetSeek();
    this.audio.src = track.path;
    this.audio.load();

    renderTrack(track, this.index, this.playlist.length);
    setMoodBackground(track.mood);

    if (autoplay) this.play();
  }

  play() {
    this.audio
      .play()
      .then(() => {
        this.isPlaying = true;
        setPauseIcon();
      })
      .catch((err) => {
        // Autoplay policy or missing file.
        this.isPlaying = false;
        setPlayIcon();
        console.warn("Play prevented:", err);
      });
  }

  pause() {
    this.audio.pause();
    this.isPlaying = false;
    setPlayIcon();
  }

  toggle() {
    this.isPlaying ? this.pause() : this.play();
  }

  next() {
    this.load(this.index + 1);
  }

  prev() {
    this.load(this.index - 1);
  }

  /** Jump to a given index and start playing. */
  playIndex(index) {
    this.load(index, { autoplay: true });
  }

  reshuffle() {
    this.playlist.reshuffle();
    this.load(this.playlist.randomIndex(), { autoplay: false });
    toast("Playlist reshuffled");
  }

  /* ----- sliders ------------------------------------------------------- */

  seekTo(percent) {
    if (Number.isFinite(this.audio.duration)) {
      this.audio.currentTime = (percent / 100) * this.audio.duration;
    }
  }

  setVolumeFromSlider() {
    this.audio.volume = dom.volumeSlider.value / 100;
  }
}
