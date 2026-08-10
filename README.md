# N5 Pathfinder

A static, beginner-first Japanese learning website designed to move a complete beginner toward JLPT N5 as efficiently as possible.

## What is inside

- 486 vocabulary items
- 111 kanji cards
- 60 grammar points with examples and quizzes
- Hiragana, katakana, dakuten and yoon practice
- Writing canvas
- Flashcards + hard-item tracking
- Reading and listening mini-lessons
- Mixed quizzes + mock exam mode
- 12-week roadmap
- 60-minute daily mission with local completion tracking
- External resource map for official JLPT practice, Japan Foundation lessons, graded reading, audio and optional music study
- Browser/local TTS support
- Offline caching after the first successful load
- Exportable local progress

## Repository structure

```text
n5-pathfinder/
├── index.html
├── README.md
├── manifest.webmanifest
├── service-worker.js
├── assets/
│   ├── favicon.svg
│   └── torii.svg
├── css/
│   └── styles.css
├── data/
│   └── n5-data.js
└── js/
    ├── app.js
    └── resources.js
```

## Run locally

The simplest reliable method is a tiny local HTTP server:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

You can also open `index.html` directly for most functionality, but service workers require HTTP/HTTPS.

## Deploy to GitHub Pages

1. Create a GitHub repository.
2. Upload the contents of this folder to the repository root.
3. Commit and push.
4. In **Settings → Pages**, choose **Deploy from a branch**.
5. Select your default branch (usually `main`) and `/ (root)`.
6. Save. GitHub will provide the Pages URL.

No npm install, build command, framework, database, API key, or backend is required.

## Editing content

- Core curriculum: `data/n5-data.js`
- External resources/music links: `js/resources.js`
- App logic/views: `js/app.js`
- Visual design: `css/styles.css`

## Learning philosophy

The app intentionally pushes a single loop: script → high-frequency words → grammar → easy input → active retrieval. Resource links are supplementary, so beginners do not lose time hopping between websites.

## Notes

JLPT does not publish a fixed official vocabulary/grammar list. This project uses a broad N5-style syllabus and should be combined with official sample questions to understand the real test format.
