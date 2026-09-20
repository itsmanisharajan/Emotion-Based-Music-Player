/**
 * playlist.js
 * Track data + playlist state (shuffle, mood indexing).
 * Moods used across the app: "happy" | "calm" | "relaxed".
 */

/** Canonical moods the library supports. */
export const MOODS = Object.freeze(["happy", "calm", "relaxed"]);

/** All available tracks. Add/replace files under assets/. */
const TRACKS = [
  { name: "Night Owl",       artist: "Broke For Free",  image: "assets/images/night_owl.jpg",       path: "assets/music/night_owl.mp3",       mood: "calm" },
  { name: "Enthusiast",      artist: "Tours",           image: "assets/images/enthusiast.jpg",      path: "assets/music/enthusiast.mp3",      mood: "happy" },
  { name: "Shipping Lanes",  artist: "Chad Crouch",     image: "assets/images/shipping_lanes.jpg",  path: "assets/music/shipping_lanes.mp3",  mood: "relaxed" },
  { name: "Carefree",        artist: "Kevin MacLeod",   image: "assets/images/carefree.jpg",        path: "assets/music/carefree.mp3",        mood: "happy" },
  { name: "Dreams",          artist: "Joakim Karud",    image: "assets/images/dreams.jpg",          path: "assets/music/dreams.mp3",          mood: "relaxed" },
  { name: "Chill",           artist: "Sakura Girl",     image: "assets/images/chill.jpg",           path: "assets/music/chill.mp3",           mood: "calm" },
  { name: "Summer Splash",   artist: "Audionautix",     image: "assets/images/summer_splash.jpg",   path: "assets/music/summer_splash.mp3",   mood: "happy" },
  { name: "Acoustic Breeze", artist: "Benjamin Tissot", image: "assets/images/acoustic_breeze.jpg", path: "assets/music/acoustic_breeze.mp3", mood: "relaxed" },
  { name: "Buddy",           artist: "Benjamin Tissot", image: "assets/images/buddy.jpg",           path: "assets/music/buddy.mp3",           mood: "happy" },
];

/** Fisher–Yates shuffle (returns a new array; does not mutate input). */
export function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Holds the current (shuffled) ordering of tracks and provides
 * lookups by index, mood, and free-text search.
 */
export class Playlist {
  constructor(tracks = TRACKS) {
    this._source = tracks;
    this.tracks = [];
    this.reshuffle();
  }

  /** Re-randomise the order and rebuild the mood index. */
  reshuffle() {
    this.tracks = shuffle(this._source);
    this._buildMoodIndex();
    return this;
  }

  get length() {
    return this.tracks.length;
  }

  at(index) {
    return this.tracks[index];
  }

  _buildMoodIndex() {
    this._moodIndex = new Map();
    this.tracks.forEach((track, index) => {
      if (!this._moodIndex.has(track.mood)) this._moodIndex.set(track.mood, []);
      this._moodIndex.get(track.mood).push(index);
    });
  }

  /** A random valid starting index. */
  randomIndex() {
    return Math.floor(Math.random() * this.length);
  }

  /** Random track index for a mood, or -1 if none exist. */
  randomIndexForMood(mood) {
    const indices = this._moodIndex.get(mood);
    if (!indices || indices.length === 0) return -1;
    return indices[Math.floor(Math.random() * indices.length)];
  }

  /** First index whose name/artist contains the query, or -1. */
  findIndexByText(query) {
    const q = query.toLowerCase().trim();
    return this.tracks.findIndex(
      (t) => t.name.toLowerCase().includes(q) || t.artist.toLowerCase().includes(q)
    );
  }
}
