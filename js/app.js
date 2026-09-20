/**
 * app.js — entry point.
 * Wires the playlist, player, search, and webcam modules together.
 */

import { Playlist } from "./playlist.js";
import { Player } from "./player.js";
import { Search } from "./search.js";
import { Webcam } from "./webcam.js";
import { toast } from "./ui.js";

function bootstrap() {
  if (typeof Audio === "undefined") {
    toast("Your browser doesn't support audio playback.", "error");
    return;
  }

  const playlist = new Playlist();
  const player = new Player(playlist);
  const search = new Search(player);
  new Webcam(search);

  // Expose for debugging in the console (optional).
  window.__player = player;
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", bootstrap);
} else {
  bootstrap();
}
