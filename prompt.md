## Code Generation Prompt

**Build a Progressive Web App (PWA) called "Fest Schedule" using React and TypeScript.**

### Overview

A festival schedule planner that lets users import a festival's lineup, view it as an interactive timeline, and build a personal schedule by selecting acts they want to see.

---

### Data Model

```
Festival
  id, name, website, days: Day[]

Day
  id, label (e.g. "Thursday"), date, stages: Stage[]

Stage
  id, name, acts: Act[]

Act
  id, name, startTime, endTime, stageId, dayId, url?, thumbnailUrl?
```

User selections are stored as a Set of Act IDs per festival, persisted across sessions.

---

### Artist Thumbnails

- Each act block in the timeline and each row in My Schedule view displays a **band/artist thumbnail image**
- **Resolution strategy (in priority order)**:
  1. Image scraped directly from the festival page (e.g. Graspop provides artist images alongside each act)
  2. [MusicBrainz Cover Art Archive](https://musicbrainz.org/) — free, no API key required; query by artist name
  3. [Last.fm API](https://www.last.fm/api) — `artist.getInfo` returns image URLs; requires a free API key stored in `.env`
  4. Fallback: a generic silhouette placeholder SVG
- Images are **cached in IndexedDB** (via Dexie.js) after first fetch to support offline use
- In timeline blocks too small to show the image, it is hidden; shown on hover/focus as a tooltip

---

### Data Import

1. **URL scraping (Graspop parser — first implementation)**
   - Target: `https://www.graspop.be/en/line-up/{day}/schedule`
   - Days: thursday, friday, saturday, sunday
   - Parse stages as `<h2>` headings, acts as links with pattern `BAND NAME HH.MM - HH.MM`, and any `<img>` associated with each act for the thumbnail
   - Use a small Cloudflare Worker / Edge function as a CORS proxy since the site is an SPA
   - The parser module must implement a common `FestivalParser` interface so new parsers can be added in `src/parsers/{site}.ts`
2. **JSON import / export** — schema matches the data model above, including `thumbnailUrl`

---

### Timeline View (main screen)

- **Layout**: horizontal columns = stages, vertical axis = time (scrollable)
- Time range: 11:00 to ~05:00 next day (handles post-midnight acts correctly)
- Acts rendered as blocks proportional to their duration; show artist thumbnail + name inside the block
- **Selected acts**: highlighted with a stage-specific accent color; unselected acts are dimmed
- **Conflict detection**: overlapping selected acts across different stages are highlighted with a warning color (no blocking — user decides freely)
- Day switcher tabs at the top
- Festival switcher (dropdown or sidebar) — multiple festivals can coexist
- Click to toggle selection; long-press or right-click shows act detail panel (thumbnail, name, stage, time, link to artist page)

---

### My Schedule View

- Filters timeline to show **only selected acts** across all stages
- Single-column, sorted by time, with gap indicators between acts
- Each row shows: thumbnail, act name, stage name, start–end time
- Conflict rows are flagged with a warning icon

---

### Export & Share

| Format      | Details                                                                         |
| ----------- | ------------------------------------------------------------------------------- |
| PDF         | Printable My Schedule view including thumbnails                                 |
| PNG         | Screenshot of the timeline or schedule                                          |
| JSON        | Full festival data + selections (including `thumbnailUrl`)                      |
| iCal (.ics) | One calendar event per selected act                                             |
| Share link  | Selected act IDs encoded in the URL hash (`#s=id1,id2,...`) — fully client-side |

---

### Storage & Sync

- **Primary**: IndexedDB via Dexie.js — stores festivals, acts, selections, and cached thumbnails
- **Optional cloud sync**: Google OAuth via Firebase Authentication + Firestore — syncs selections across devices when signed in
- Service Worker for full offline capability (Workbox via `vite-plugin-pwa`)

---

### Festivals Management

- Add festivals (by URL or JSON), rename, and delete them
- A pre-loaded Graspop Metal Meeting 2026 fixture for onboarding

---

### Theme

- User-switchable dark / light theme (toggle in header), preference persisted in localStorage
- Dark theme default (dark background, vibrant per-stage accent colors)

---

### Tech Stack & Architecture

- **React 18 + TypeScript**
- **Vite** + `vite-plugin-pwa` (Workbox)
- **Zustand** — global state
- **Dexie.js** — IndexedDB
- **Firebase** (Auth + Firestore) — optional cloud sync
- **React Query** — async data fetching & thumbnail resolution
- **Tailwind CSS** — styling
- **date-fns** — time parsing & iCal generation
- **`@react-pdf/renderer`** or `html2canvas` + `jsPDF` — PDF export

```
src/
  parsers/        # FestivalParser interface + site-specific implementations
  stores/         # Zustand stores (festival, selections, theme, auth)
  services/
    thumbnails/   # Resolution pipeline: scrape → MusicBrainz → Last.fm → fallback
    sync/         # Firebase cloud sync
  export/         # PDF, PNG, iCal, JSON, share-link
  components/
    timeline/     # Grid timeline view
    schedule/     # My Schedule single-column view
```

### Key Constraints

- Times past midnight (e.g. 00:30–01:30) stored as next-day instants internally, displayed on the same day's timeline
- All thumbnail fetching goes through a service layer; the `Act` object just holds a `thumbnailUrl` string
- Last.fm API key stored in `.env` as `VITE_LASTFM_API_KEY`; never committed
- App must work fully offline after first visit
- No user data sent anywhere unless the user explicitly signs in with Google
