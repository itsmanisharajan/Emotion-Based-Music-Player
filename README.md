# 🎵 Emotion-Based Music Player

A fast, modern, **dependency-free** web music player that can pick songs to match
your **mood** — either by typing a mood/song name, or by reading your **facial
expression** through the webcam.

Built with vanilla HTML, modular CSS, and ES modules. No build step, no framework.

---

## ✨ Features

- 🎧 Full audio player — play/pause, next/prev, seek, volume, shuffle.
- 😀 **Mood search** — type `happy`, `calm`, or `relaxed`.
- 🔍 **Text search** — by track name or artist.
- 📸 **Facial-expression search** — webcam → face-api.js → mood → music.
- 🎨 Mood-reactive animated gradient background.
- ⌨️ Keyboard support (Space to play/pause, Enter to search, Esc to close modal).
- ♿ Accessible (ARIA labels, focus rings, reduced-motion support).
- ⚡ **Fast first load** — the heavy face-api.js library loads *only* when you
  open the webcam, not on page load.

---

## 📁 Project structure

```
.
├── index.html          # markup + module entry
├── css/
│   ├── variables.css   # design tokens
│   ├── base.css        # reset + layout
│   └── components.css  # UI components
├── js/
│   ├── app.js          # entry point (wires everything)
│   ├── playlist.js     # track data + shuffle + mood index
│   ├── player.js       # audio engine
│   ├── search.js       # text + mood search
│   ├── webcam.js       # camera + lazy face detection
│   └── ui.js           # DOM refs, toasts, view helpers
├── assets/
│   ├── images/         # album art (.jpg)  ← add your files here
│   └── music/          # audio files (.mp3) ← add your files here
└── models/             # face-api.js model weights ← add here (optional)
```

## 🚀 Running locally

The app uses ES modules and the webcam API, so it **must be served over HTTP**
(not opened as a `file://` URL). Any static server works:

```bash
# Python 3
python3 -m http.server 8000

# or Node
npx serve .
```

Then open <http://localhost:8000>.

## 🎵 Adding your own music

1. Drop `.mp3` files into `assets/music/` and matching cover images into
   `assets/images/`.
2. Update the `TRACKS` array in `js/playlist.js` with the correct
   `name`, `artist`, `image`, `path`, and `mood` (`happy` | `calm` | `relaxed`).

> Free, licensable tracks: [Free Music Archive](https://freemusicarchive.org/),
> [Incompetech](https://incompetech.com/), [Bensound](https://www.bensound.com/).

## 🙂 Enabling real facial-expression detection (optional)

By default, if the models aren't present the app just picks a mood at random.
For real detection, download the face-api.js weights into `models/`:

Required models:
- `tiny_face_detector_model-*`
- `face_expression_model-*`

Get them from the
[face-api.js weights repo](https://github.com/justadudewhohacks/face-api.js/tree/master/weights)
and place all files directly inside `models/`.

## 🧰 Tech notes / decisions

- **Zero build**: pure static site — deploys anywhere (GitHub Pages, Netlify, S3).
- **Lazy loading**: `face-api.min.js` (~600 KB) is injected on demand for a fast
  initial paint.
- **Event-driven audio**: uses `timeupdate` / `loadedmetadata` instead of a
  polling `setInterval` — smoother and cheaper.
- **Relative model path** so it works under any deployment sub-path.

## 📄 License

Provided as-is for educational/demo purposes. Ensure any music/images you add are
appropriately licensed.
