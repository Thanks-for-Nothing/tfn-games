# TFN Games

All interactive games for **Thanks for Nothing** events, hosted under a single domain.

**Live at:** `game.tfnparty.com` (or your Vercel project URL)

---

## How It Works

This is a monorepo. Each game is a self-contained app that gets built into a shared `dist/` folder. Vercel serves that folder, so every game gets its own URL path:

```
game.tfnparty.com/2025/ghost-chat
game.tfnparty.com/2026/cannon-fire
```

### Folder Structure

```
tfn-games/
├── README.md
├── package.json        ← Root build script (only builds ACTIVE games)
├── vercel.json         ← Vercel config: output dir + SPA rewrites
├── dist/               ← What Vercel actually serves
│   ├── index.html      ← Landing page listing all games
│   ├── 2025/           ← Frozen: committed to git, never rebuilt
│   │   └── ghost-chat/
│   └── 2026/           ← Active: rebuilt on every deploy
│       └── cannon-fire/
└── games/              ← Source code for all games
    ├── 2025/
    │   └── ghost-chat/
    └── 2026/
        └── cannon-fire/
            ├── package.json
            ├── vite.config.ts
            └── src/
```

**Key distinction:**
- `games/` = source code (what you edit)
- `dist/` = built output (what visitors see)

---

## Active vs. Frozen Games

### Active Games (current year)

These are rebuilt from source on every Vercel deploy. They're listed in the `build:active` script in the root `package.json`.

### Frozen Games (past years)

Once an event is over and a game is finalized:

1. The game's built output (`dist/YEAR/GAME/`) gets committed directly to git
2. The game is removed from the `build:active` script
3. The source code in `games/` stays for reference but is never rebuilt

**Why freeze?** Frozen games are just static HTML/JS/CSS files in the repo. They have zero dependencies, zero build step, and zero risk of breaking. A Node.js update, a yanked npm package, or a Vite major version bump will never affect them.

---

## Adding a New Game

Adding a new game folder alone is NOT enough — the game won't build or deploy until the root config files are updated. Here's everything that needs to happen:

### Checklist

> **Root files that MUST be updated (by a repo admin):**
>
> | File | What to add |
> |------|-------------|
> | `package.json` (root) | Build script for the new game + add it to `build:active` |
> | `vercel.json` | SPA rewrite rule for the new game's URL path |
> | `dist/index.html` | Link on the landing page (optional but recommended) |
>
> **Game files to create:**
>
> | File | What it does |
> |------|--------------|
> | `games/YEAR/game-name/` | The game's source code folder |
> | `games/YEAR/game-name/vite.config.ts` | Must set `base` and `outDir` for subdirectory deployment |

### Step-by-step

#### 1. Create the game folder

```
games/YEAR/game-name/
```

The game can use any framework (React, vanilla JS, Svelte, etc.) as long as it has a `package.json` with a `build` script.

#### 2. Configure the build output path (in the game's vite.config.ts)

For Vite games, set `base` and `outDir` so assets load from the correct subdirectory:

```ts
export default defineConfig({
  plugins: [react()],
  base: '/YEAR/game-name/',
  build: {
    outDir: '../../../dist/YEAR/game-name',
    emptyOutDir: true,
  },
})
```

- `base` — sets the URL prefix so asset paths resolve correctly (e.g., images, JS bundles)
- `outDir` — tells Vite to output the build into the shared `dist/` folder (path is relative to the game folder)

**Important:** When referencing static assets in code, always use `` `${import.meta.env.BASE_URL}assets/filename` `` instead of `/assets/filename`. Hardcoded absolute paths will break because the game is served from a subdirectory, not the site root.

#### 3. Add build scripts to root `package.json`

Add two new lines and chain the new game into `build:active`:

```jsonc
{
  "scripts": {
    "build": "npm run build:active",
    "build:active": "npm run build:2026-cannon-fire && npm run build:YEAR-game-name",
    "build:YEAR-game-name": "cd games/YEAR/game-name && npm install && npm run build",
    "freeze:YEAR-game-name": "cd games/YEAR/game-name && npm install && npm run build && echo 'Now commit dist/YEAR/game-name/ and remove this game from build:active'"
  }
}
```

#### 4. Add a rewrite to `vercel.json`

Each single-page app (SPA) needs a rewrite so that direct URL access and browser refresh work:

```jsonc
{
  "rewrites": [
    // ...existing rewrites...
    { "source": "/YEAR/game-name/(.*)", "destination": "/YEAR/game-name/index.html" }
  ]
}
```

**Note:** Static/vanilla JS games that don't use client-side routing don't need a rewrite.

#### 5. Update the landing page

Add a link to `dist/index.html`:

```html
<li><a href="/YEAR/game-name/">Game Name (YEAR)</a></li>
```

#### 6. Push to GitHub

Vercel auto-deploys on push. Your game will be live at `game.tfnparty.com/YEAR/game-name/` within ~30 seconds.

### Example: adding a game called "fish-id" for 2026

1. Create source folder at `games/2026/fish-id/`
2. In the game's `vite.config.ts`, set `base: '/2026/fish-id/'` and `outDir: '../../../dist/2026/fish-id'`
3. In root `package.json`, add `"build:2026-fish-id": "cd games/2026/fish-id && npm install && npm run build"` and chain it into `build:active`
4. In `vercel.json`, add `{ "source": "/2026/fish-id/(.*)", "destination": "/2026/fish-id/index.html" }`
5. In `dist/index.html`, add a link to `/2026/fish-id/`
6. Push to `main`

---

## Adding a New Year

When a new event year starts, you just need to create the year folder and add games into it. There's no year-level config — years are just folders.

### Steps

1. Create the year folder under `games/`:
   ```
   games/2027/
   ```
2. Add games into it following the [Adding a New Game](#adding-a-new-game) steps above
3. That's it — there's no year-level config file or setup

### At the end of the year

When the event is over, freeze all of that year's games (see [Freezing a Game](#freezing-a-game-end-of-event) below). This locks them as static files so they can never break, and removes them from the active build.

### Pre-created years

The following year folders already exist and are ready for games to be added:

| Year | Folder | Status |
|------|--------|--------|
| 2024 | `games/2024/` | Empty (ready for games) |
| 2025 | `games/2025/` | Empty (ready for games) |
| 2026 | `games/2026/` | Active |
| 2027 | `games/2027/` | Empty (ready for games) |

---

## Freezing a Game (End of Event)

When an event is over and you want to lock a game permanently:

```bash
# 1. Build the game one final time
npm run freeze:YEAR-game-name

# 2. Commit the built output to git
git add dist/YEAR/game-name/
git commit -m "Freeze YEAR/game-name"

# 3. Remove it from the active build in package.json
#    Edit build:active to remove the game's build step

# 4. Push
git push
```

From this point on, that game is just static files in the repo. It will never be rebuilt and can never break.

---

## Deployment (Vercel)

### Initial Setup

1. Create a new project on [vercel.com](https://vercel.com)
2. Import the `Thanks-for-Nothing/tfn-games` GitHub repo
3. Vercel auto-detects settings from `vercel.json` — just click Deploy

### Custom Domain

To use `game.tfnparty.com`:

1. In Vercel: Project Settings → Domains → Add `game.tfnparty.com`
2. In your DNS provider: Add a CNAME record
   ```
   game.tfnparty.com → cname.vercel-dns.com
   ```
3. Vercel handles HTTPS automatically

### How Deploys Work

- Every push to `main` triggers a Vercel deploy
- Vercel runs `npm run build` (root `package.json`)
- That only rebuilds **active** games
- Frozen games are already in `dist/` from git — they're served as-is
- Deploy takes ~30 seconds

---

## Embedding in Framer (tfnparty.com)

To embed a game on your Framer site, add an **Embed** element with this iframe:

```html
<iframe
  src="https://game.tfnparty.com/2026/cannon-fire/"
  width="100%"
  height="100%"
  style="border: none; border-radius: 12px;"
  allow="autoplay; vibrate"
></iframe>
```

**Tips:**
- Set the Embed element to fill the section (100% width, fixed height like 700px or 100vh)
- Add `allow="autoplay; vibrate"` for games with sound/haptic effects

### Option 2: Link directly

Instead of embedding, you can link to the game URL from a button or text link in Framer:

```
https://game.tfnparty.com/2026/cannon-fire/
```

This navigates the user away from tfnparty.com to the game on its own page. Better for mobile (full-screen experience) but the user leaves your site.

### Which to use?

| Method | Pros | Cons |
|--------|------|------|
| **Iframe embed** | Game stays within your Framer site | Can feel cramped; may need height tuning |
| **Direct link** | Full-screen game experience, works great on mobile | User leaves tfnparty.com |

---

## Current Games

| Year | Game | Path | Status |
|------|------|------|--------|
| 2026 | Cannon Fire (Battleship) | `/2026/cannon-fire/` | Active |

---

## Local Development

```bash
# Run a specific game locally
cd games/2026/cannon-fire
npm install
npm run dev
# → http://localhost:5173/2026/cannon-fire/

# Build everything (same as what Vercel runs)
cd /path/to/tfn-games
npm run build
```

---

## Tech Notes

- **Why `dist/` and not `public/`?** In Vite projects, `public/` is reserved for unprocessed static assets that get copied into the build. `dist/` (short for "distribution") is the standard output folder name used by Vite, webpack, and Rollup.
- **Why the `games/` subfolder?** Separates source code from build output. Without it, `2026/cannon-fire/` (source) and `dist/2026/cannon-fire/` (output) look confusingly similar.
- **Why not separate Vercel projects per game?** Simpler to manage one project. One domain, one deploy, one config. The frozen-build pattern keeps old games safe from breakage.
