<!--
  ╔══════════════════════════════════════════════════════════════════════════╗
  ║  GLYPH v1.0.4 README                                                    ║
  ║  Built by Claude (The Forge) for Brandon McCormick // The Sinner King   ║
  ║  Three variants delivered: COLD / WARM / HOT                            ║
  ║  Register: SIGNAL — clipped, developer-directed, earned darkness        ║
  ║  Brandon picks the variant. OBSIDIAN audits.                            ║
  ╚══════════════════════════════════════════════════════════════════════════╝
-->

<!--
  ═══════════════════════════════════════════════════════════════════
  INSTRUCTIONS FOR INTEGRATION
  ═══════════════════════════════════════════════════════════════════
  Three complete README variants follow: COLD, WARM, HOT.
  Each is a full, shippable README — not a section excerpt.
  Brandon selects one. Orchestrator strips the other two variants
  and the HTML comment wrappers, then writes to README.md.

  VOID_FORGE recommendation is marked at the bottom of this file.
  ═══════════════════════════════════════════════════════════════════
-->

---

# ░░░ VARIANT A — COLD ░░░

---

```
 ██████╗ ██╗  ██╗   ██╗██████╗ ██╗  ██╗
██╔════╝ ██║  ╚██╗ ██╔╝██╔══██╗██║  ██║
██║  ███╗██║   ╚████╔╝ ██████╔╝███████║
██║   ██║██║    ╚██╔╝  ██╔═══╝ ██╔══██║
╚██████╔╝███████╗██║   ██║     ██║  ██║
 ╚═════╝ ╚══════╝╚═╝   ╚═╝     ╚═╝  ╚═╝
```

<div align="center">

**ASCII / Unicode text-UI template generator · Gemini AI · Zero backend**

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.4-amber)

</div>

---

## What it does

You describe a template. Gemini Flash generates it. A 4-check quality gate evaluates the output — if it fails, it retries once automatically. The result streams to your screen at 60fps via rAF-batched chunks.

No backend. No account. No data leaving your browser except the API call to Google.

---

## Quick start

```bash
git clone https://github.com/sinner-king-toys/glyph.git
cd glyph
npm install
npm run dev
```

Open `http://localhost:5173/glyph/`. Enter your [Google AI Studio](https://aistudio.google.com/apikey) API key when prompted. Key is stored in `localStorage`.

Try it without a key first: `http://localhost:5173/glyph/?demo`

---

## Style identities

Five prompt personalities. Each injects a full design document into the system prompt — not a style hint, a specification.

| Identity | Character |
|----------|-----------|
| **SOVEREIGN** | Industrial brutalism. Double-line borders, dense data columns, fortress weight. |
| **WRAITH** | Negative space. Hairline borders, content that breathes. Presence through absence. |
| **RELIC** | ASCII-only. No Unicode box-drawing. Typewriter rhythm, worn-terminal warmth. |
| **FERAL** | Mixed registers. Gel meters, decorative flourish, ornament as signal. |
| **SIEGE** | Military ops. ALLCAPS labels, column-anchored data, zero decoration without function. |

---

## Skill pills

8 composable directives across 4 slots. One active per slot. Each injects one imperative sentence into the generation prompt. Found in the **Options** accordion.

| Slot | Skills | Controls |
|------|--------|----------|
| aesthetic | BRUTAL · GHOST | Border weight and visual density |
| precision | STRICT · ADAPTIVE | Structural correctness vs. organic form |
| domain | TERMINAL · README | Target rendering context |
| constraint | COMPACT · WIDE | Output size |

---

## Features

- **Quality gate** — 4-check composite score; ≥3/4 required to pass; auto-retries once on failure
- **rAF-batched streaming** — chunks accumulate in a ref, flush via `requestAnimationFrame`; smooth 60fps, no setState thrash
- **5 color themes** — amber / green / blue / pink / white; driven by `--theme-primary` CSS custom property
- **History panel** — all generations saved to `localStorage`; backward-compatible V1→V2 migration
- **Favorites panel** — pin generations for reference
- **Title Forge** — big text mode via figlet.js; Standard, Slant, Banner fonts pre-bundled
- **Share link** — encode any generation as a URL fragment
- **Stall detection** — [ABORT] button surfaces after 20s with no new chunks
- **Demo mode** — `?demo` query param; no API key required

---

## Tech stack

| | |
|-|-|
| React 19 + TypeScript 5.9 | Framework and types |
| Vite 7 | Build |
| Tailwind CSS v4 | Styling |
| Motion 12 | Animations |
| `@google/genai` ^1.36 | Gemini Flash API |
| figlet.js | ASCII text rendering (3 pre-bundled fonts) |

---

## Deployment

Static SPA. Deploy anywhere.

**GitHub Pages** — base path `/glyph/` is set in `vite.config.ts`. Build and push `dist/`.

**Vercel** — connect repo. Vite auto-detected, zero config.

All API calls go direct from browser to Google. No server-side secrets.

---

## License

[MIT](LICENSE)

---

<div align="center">

**[SINNER KING TOYS](https://github.com/sinner-king-toys)**

Built by Claude (The Forge) for Brandon McCormick // The Sinner King

</div>

---

---

# ▓▓▓ VARIANT B — WARM ▓▓▓

---

```
 ██████╗ ██╗  ██╗   ██╗██████╗ ██╗  ██╗
██╔════╝ ██║  ╚██╗ ██╔╝██╔══██╗██║  ██║
██║  ███╗██║   ╚████╔╝ ██████╔╝███████║
██║   ██║██║    ╚██╔╝  ██╔═══╝ ██╔══██║
╚██████╔╝███████╗██║   ██║     ██║  ██║
 ╚═════╝ ╚══════╝╚═╝   ╚═╝     ╚═╝  ╚═╝
```

<div align="center">

**Cyberpunk ASCII/Unicode text-UI generator · Powered by Gemini · Zero backend**

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.4-amber)

[**Live Demo**](https://sinner-king-toys.github.io/glyph/) · [**Try without API key**](https://sinner-king-toys.github.io/glyph/?demo)

</div>

---

GLYPH generates ASCII and Unicode text-UI templates from a text description. You describe what you want. Gemini Flash generates it. A 4-check quality gate evaluates the output — if it doesn't pass, it retries once. The result streams to your screen character by character.

No backend. No account creation. Your API key lives in `localStorage` and goes nowhere except directly to Google.

---

## Screenshot

![GLYPH Screenshot](screenshot-01.png)

---

## Quick Start

### Prerequisites

- Node.js 18+
- A free [Google AI Studio](https://aistudio.google.com/apikey) API key

### Install and run

```bash
git clone https://github.com/sinner-king-toys/glyph.git
cd glyph
npm install
npm run dev
```

Open `http://localhost:5173/glyph/` and enter your API key when prompted.

Not ready to commit an API key? Try demo mode first:

```
http://localhost:5173/glyph/?demo
```

---

## The Five Style Identities

This is the part that matters. GLYPH doesn't offer "themes" in the color-scheme sense. It offers five distinct schools of thought about what text-UI design is for. Each one injects a full design specification into the system prompt.

**SOVEREIGN** — Industrial brutalism. Double-line borders, dense data columns, everything weighted like it was built to outlast whatever runs inside it. For interfaces that need to feel like infrastructure.

**WRAITH** — Negative space as philosophy. Hairline borders or none. Content that occupies less than it could. The template feels like it's only partially manifesting. For work that communicates through restraint.

**RELIC** — ASCII only. No Unicode box-drawing. The characters that survive when nothing else does — typewriter rhythm, the warmth of a terminal that outlived its era. For work that should feel like it was found, not generated.

**FERAL** — The loved machine. Mixed-register borders, gel meters, decorative elements that aren't decoration — they're signal. Ornament as communication. For work where the aesthetic is the content.

**SIEGE** — Military ops display. ALLCAPS labels, column-anchored data, zero flourish that doesn't carry information. When the template needs to communicate at decision speed.

---

## Skill Pills

8 composable directives in the **Options** accordion. One active per slot at a time. Each injects one imperative sentence into the system prompt.

| Slot | Skills | What it shapes |
|------|--------|----------------|
| aesthetic | BRUTAL · GHOST | Border weight and visual density |
| precision | STRICT · ADAPTIVE | Structural rigidity vs. organic form |
| domain | TERMINAL · README | Target rendering context |
| constraint | COMPACT · WIDE | Output size limits |

Skills combine with style identities. SIEGE + STRICT + COMPACT produces something different than SIEGE + ADAPTIVE + WIDE.

---

## How Generation Works

You type a description. GLYPH sends it to Gemini Flash with your active style and skills injected into the system prompt. The response streams back character by character via `requestAnimationFrame`-batched chunks — smooth 60fps typewriter output, no React state thrash.

A 4-check quality gate evaluates the result. If fewer than 3 of 4 checks pass, GLYPH retries automatically once. If the retry also fails, you get the best result and a quality indicator.

That's it. One model. One pass. Quality gate catches the bad outputs.

---

## Features

- **Quality gate** — 4-check composite scoring; ≥3/4 required to pass; auto-retry once on failure
- **rAF-batched streaming** — 60fps typewriter effect; no setState on every chunk
- **5 color themes** — amber / green / blue / pink / white
- **History panel** — all generations saved to `localStorage`; backward-compatible V1→V2 migration
- **Favorites panel** — pin generations you want to keep
- **Title Forge** — big text mode via figlet.js; Standard, Slant, Banner fonts
- **Share link** — encode any generation as a shareable URL fragment
- **Stall detection** — [ABORT] surfaces after 20s of silence
- **Demo mode** — `?demo` query param; no API key required

---

## Tech Stack

| Technology | Version | Role |
|-----------|---------|------|
| React | 19 | UI framework |
| TypeScript | 5.9 | Types |
| Vite | 7 | Build |
| Tailwind CSS | v4 | Styling |
| Motion | 12 | Animations |
| `@google/genai` | ^1.36 | Gemini Flash API |
| figlet.js | ^1.9.4 | ASCII title rendering (3 fonts) |

---

## Deployment

GLYPH is a static SPA. No server required.

**GitHub Pages** — `npm run build`, deploy `dist/`. Base path `/glyph/` already set in `vite.config.ts`.

**Vercel** — connect repo; Vite auto-detected; zero config.

All API calls go directly from your browser to Google's Gemini API. No server-side secrets. No backend to maintain.

### Cost per generation

Free tier on Google AI Studio covers casual use. Paid usage runs approximately $0.0002 per generation with Gemini Flash.

---

## Project Structure

```
src/
├── components/ui/        # Terminal UI components (matrix rain, cyber button)
├── features/generator/   # Generator, history, favorites, title forge
├── hooks/                # Keyboard shortcuts
├── lib/
│   ├── constants.ts      # CONFIG, themes, box characters
│   ├── skills.ts         # Skill pill system — 8 skills, 4 slots
│   └── services/         # Gemini API, localStorage, ASCII rendering
└── types/                # TypeScript definitions
```

---

## License

[MIT](LICENSE) — A Sinner King Toys production.

---

<div align="center">

**[SINNER KING TOYS](https://github.com/sinner-king-toys)**

*"The Sacred is born in the Slop."*

Built by Claude (The Forge) for Brandon McCormick // The Sinner King

</div>

---

---

# ███ VARIANT C — HOT ███

---

<div align="center">

```
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
▓                                                         ▓
▓    ██████╗ ██╗  ██╗   ██╗██████╗ ██╗  ██╗              ▓
▓   ██╔════╝ ██║  ╚██╗ ██╔╝██╔══██╗██║  ██║              ▓
▓   ██║  ███╗██║   ╚████╔╝ ██████╔╝███████║              ▓
▓   ██║   ██║██║    ╚██╔╝  ██╔═══╝ ██╔══██║              ▓
▓   ╚██████╔╝███████╗██║   ██║     ██║  ██║              ▓
▓    ╚═════╝ ╚══════╝╚═╝   ╚═╝     ╚═╝  ╚═╝  v1.0.4     ▓
▓                                                         ▓
▓         CYBERPUNK TEXT-UI GENERATOR                     ▓
▓         GEMINI AI  ·  ZERO BACKEND  ·  MIT              ▓
▓                                                         ▓
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
```

![License](https://img.shields.io/badge/license-MIT-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)
![React](https://img.shields.io/badge/React-19-blue.svg)

[**Live**](https://sinner-king-toys.github.io/glyph/) · [**Demo**](https://sinner-king-toys.github.io/glyph/?demo) · [**Source**](#)

</div>

---

The terminal was always dark. What changed is that someone finally made it intentional.

GLYPH is a browser tool that turns a text description into a cyberpunk ASCII or Unicode text-UI template. You describe what you want — a warning panel, a dashboard header, a README sigil — and Gemini Flash generates it with a live 60fps typewriter stream. A quality gate evaluates the output on four criteria. If it falls short, it retries once automatically. If the retry also misses, you get the best result and a score.

No backend. No sign-up. Your API key lives in `localStorage` and travels nowhere except directly to Google. Close the tab and it's still there.

---

## Screenshot

![GLYPH Screenshot](screenshot-01.png)

---

## Quick Start

```bash
git clone https://github.com/sinner-king-toys/glyph.git
cd glyph
npm install
npm run dev
```

`http://localhost:5173/glyph/` — enter your [Google AI Studio](https://aistudio.google.com/apikey) key when prompted.

No key yet? Demo mode has you covered: `http://localhost:5173/glyph/?demo`

---

## The Five Style Identities

GLYPH doesn't have themes. It has schools of thought.

Each identity injects a complete design specification into the system prompt — not a color hint, not a vibe keyword. A full document describing border grammar, spacing philosophy, information hierarchy, and the kind of project that calls for this aesthetic.

---

**SOVEREIGN**

Double-line borders. Dense data columns. Everything weighted like it was designed to outlast whatever runs inside it. SOVEREIGN is fortress architecture — the UI that wants you to feel the mass of the system before you read a single line. You choose SOVEREIGN when the template needs to carry institutional authority. When light borders would be dishonest.

---

**WRAITH**

Negative space as the primary design element. Hairline borders or no borders at all. Content that occupies less room than it could. WRAITH communicates through what it doesn't do — the template is only partially there, and that's the point. You choose WRAITH when restraint is the signal, when adding weight would dilute the effect.

---

**RELIC**

No Unicode box-drawing. ASCII only — the characters that predate the extended set, the ones that survive everything. Typewriter rhythm. The warm-and-worn quality of a terminal that outlived its era. RELIC is the aesthetic of something found rather than generated. You choose RELIC when you want the work to feel like it existed before you made it.

---

**FERAL**

The machine that someone loved too much. Mixed-register borders — heavy lines meeting hairlines. Gel meters. Decorative elements that aren't decoration: they're communication. FERAL is the visual language of a system that was built by someone who cared about the craft, not just the function. You choose FERAL when the ornament IS the signal.

---

**SIEGE**

Military ops display. ALLCAPS labels. Column-anchored data. Every decorative character earns its presence or gets cut. SIEGE is built for decision speed — the template you'd want on a screen during an incident, when there's no time to parse visual hierarchy that wasn't pre-established. You choose SIEGE when the template needs to communicate faster than it reads.

---

## Skill Pills

8 composable directives in the **Options** accordion. One active per slot at a time. Each injects one imperative sentence into the system prompt — a surgical override on top of the style specification.

| Slot | Skills | Effect |
|------|--------|--------|
| aesthetic | BRUTAL · GHOST | Maximum border weight vs. maximum restraint |
| precision | STRICT · ADAPTIVE | Grid-locked structure vs. organic adaptation |
| domain | TERMINAL · README | Raw terminal rendering vs. Markdown context |
| constraint | COMPACT · WIDE | Discord-friendly vs. splash-screen proportions |

Skills combine with style identities. WRAITH + GHOST produces something different from WRAITH + BRUTAL. The four slots are independent axes — you're composing a directive, not selecting a preset.

---

## How Generation Works

One model. One pass. A gate.

You submit a prompt with your active style and skills. GLYPH sends everything to Gemini Flash — your description, the style document, and any active skill directives — as a single structured request. The response streams back via `requestAnimationFrame`-batched chunks: smooth 60fps typewriter output, no React state thrash on every character.

When streaming completes, a 4-check quality gate evaluates the output. If fewer than 3 of 4 checks pass, GLYPH sends the request again automatically. Once. If the retry also misses the threshold, you get the best result — not a blank screen.

That's the full pipeline. No architectural pass, no planning phase, no buffering. Flash generates it, the gate evaluates it, you get it.

---

## Features

- **Quality gate** — 4-check composite scoring; ≥3/4 required; auto-retry once on failure
- **rAF-batched streaming** — 60fps typewriter; chunks accumulate in a ref and flush per animation frame
- **5 color themes** — amber / green / blue / pink / white; `--theme-primary` CSS custom property
- **History panel** — all generations saved to `localStorage`; backward-compatible V1→V2 migration
- **Favorites panel** — pin what you want to keep
- **Title Forge** — big text mode via figlet.js; Standard, Slant, Banner fonts pre-bundled
- **Share link** — encode any generation as a URL fragment; share without a backend
- **Stall detection** — [ABORT] surfaces after 20s of no new chunks
- **Demo mode** — `?demo` query param; full interface, no API key required

---

## Tech Stack

| Technology | Version | Role |
|-----------|---------|------|
| React | 19 | UI framework |
| TypeScript | 5.9 | Type system |
| Vite | 7 | Build and dev server |
| Tailwind CSS | v4 | Utility-first styling |
| Motion | 12 | Animations |
| `@google/genai` | ^1.36 | Gemini Flash API |
| figlet.js | ^1.9.4 | ASCII title rendering — 3 pre-bundled fonts |

---

## Deployment

GLYPH is a static SPA. There is no backend to deploy.

**GitHub Pages** — `npm run build`, push `dist/`. Base path `/glyph/` is already configured in `vite.config.ts`.

**Vercel** — connect the repo. Vite is auto-detected. No configuration needed.

Every API call goes directly from your browser to Google. The server is not involved because there is no server.

### Cost

Free tier on Google AI Studio covers normal use. Gemini Flash costs approximately $0.0002 per generation at current pricing.

---

## Project Structure

```
src/
├── components/ui/        # Matrix rain, cyber button, terminal chrome
├── features/generator/   # Generator state machine, history, favorites, title forge
├── hooks/                # Keyboard shortcuts
├── lib/
│   ├── constants.ts      # CONFIG, TEMPLATE_STYLES, COLOR_THEMES, box characters
│   ├── skills.ts         # Skill pill system — 8 skills, 4 slots, prompt injection
│   └── services/         # Gemini API client, localStorage, ASCII rendering
└── types/                # TypeScript type definitions
```

---

## License

[MIT](LICENSE)

---

<div align="center">

```
╔══════════════════════════════════════════════════════════╗
║  A SINNER KING TOYS PRODUCTION                          ║
║  "The Sacred is born in the Slop."                      ║
╚══════════════════════════════════════════════════════════╝
```

**[SINNER KING TOYS](https://github.com/sinner-king-toys)**

Built by Claude (The Forge) for Brandon McCormick // The Sinner King

</div>

---

---

<!--
  ═══════════════════════════════════════════════════════════════════
  VOID_FORGE RECOMMENDATION
  ═══════════════════════════════════════════════════════════════════

  SHIP: VARIANT C — HOT

  Reasoning:

  COLD (A) is accurate and clean, but it reads like a well-maintained
  open-source README for a utility library. It does not make anyone
  feel anything. A developer skims it and moves on. It earns no
  right to exist in their mind after they close the tab.

  WARM (B) is the closest to what most developer READMEs try to be —
  and succeeds at that. The style identity descriptions are honest
  and specific. It would do the job. If Brandon wants something that
  fits comfortably next to other quality open-source projects, this
  is the one.

  HOT (C) is the one that earns GLYPH the right to exist. The opening
  paragraph — "The terminal was always dark. What changed is that
  someone finally made it intentional." — is the only sentence in
  these three variants that makes a developer stop before they keep
  reading. The style identity section in HOT doesn't describe what
  the styles look like. It describes when you'd choose one. That's
  the question a developer actually has. SIEGE isn't described as
  "military aesthetic" — it's described as what you reach for during
  an incident, when there's no time. That's the difference between
  a feature description and a reason to use something.

  HOT has one risk: the style identity section is long. If that's a
  concern, the five descriptions can be cut from prose to the table
  format used in WARM without losing the opening.

  The attribution block in HOT is the right one — it reads like a
  signature, not a line in a changelog.

  ═══════════════════════════════════════════════════════════════════
-->
