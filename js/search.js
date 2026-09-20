/**
 * search.js
 * Text + mood search that drives the player.
 */

import { dom, toast } from "./ui.js";
import { MOODS } from "./playlist.js";

export class Search {
  /**
   * @param {import("./player.js").Player} player
   */
  constructor(player) {
    this.player = player;
    this._bind();
  }

  _bind() {
    dom.searchBtn.addEventListener("click", () => this.run(dom.searchInput.value));
    dom.searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") this.run(dom.searchInput.value);
    });
  }

  /**
   * Search by mood first, then by track/artist name.
   * @param {string} query
   * @returns {boolean} whether a track was found & played
   */
  run(query) {
    const q = (query || "").toLowerCase().trim();

    if (!q) {
      toast("Please enter a search term.", "error");
      return false;
    }

    // Mood match.
    if (MOODS.includes(q)) {
      const index = this.player.playlist.randomIndexForMood(q);
      if (index !== -1) {
        this.player.playIndex(index);
        return true;
      }
    }

    // Text match.
    const index = this.player.playlist.findIndexByText(q);
    if (index !== -1) {
      this.player.playIndex(index);
      return true;
    }

    toast(`No tracks found for "${query}".`, "error");
    return false;
  }

  /** Convenience used by the webcam flow. */
  byMood(mood) {
    return this.run(mood);
  }
}
