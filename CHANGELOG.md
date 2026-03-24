# CHANGELOG — GLYPH

---

## [2026-03-23] v1.0.4 — README output gallery, AI credit, dead code removal

### Added
- **Output gallery** — 5 hand-crafted examples in README, one per style identity (SOVEREIGN, WRAITH, RELIC, FERAL, SIEGE). Each example is genuine to its aesthetic's design philosophy, not decorative filler.
- **"How We Build" section** — replaced one-line AI credit footnote with honest, prominent section: Brandon directs, Claude builds, every commit carries `Co-Authored-By: Claude Sonnet 4.6`.
- **Neofetch callout** — added to intro paragraph: "Works great for neofetch/fastfetch headers, README banners, terminal dashboards."
- **Claude badge** — `Built with Claude` badge added to shields row.

### Removed
- **`mode-toggle.tsx`** — dead component with no callers. Mode is hardcoded to `'slop'` in generator.tsx; the toggle UI was removed in an earlier session but the file persisted.

---

## [1.0.1] — 2026-03-19

### Fixed

- **AC-1**: CyberButton hover states — added required Tailwind v4 `color:` prefix to `color-mix()` arbitrary values; hover backgrounds now visible across all 5 themes
- **AC-2**: `[REFINE]` button — removed hardcoded `cyan-500` classes; now uses `var(--theme-primary)` consistent with all other buttons
- **AC-3**: Matrix rain — canvas now resizes on window resize (debounced 150ms); rain covers full viewport after any resize
- **AC-4**: Escape key now closes TitleForge and FavoritesPanel (added to handler chain before existing modal checks)
- **AC-5**: History deletion is now ID-based (`removeFromHistory(id: string)`) instead of index-based; no more index drift after mutations
- **AC-6**: Favorites stale state fixed — `favoritesVersion` counter in generator, `useMemo` re-derivation in TemplateDisplay; FavoritesPanel now calls `onFavoritesChanged` on every deletion
- **AC-7**: Share link — replaced unbounded `String.fromCharCode(...spread)` with 8192-byte chunked loop; eliminates stack overflow on large WIDE templates
- **AC-8**: Removed dead `'loading'` member from `AppStatus` union type (was never set; switch had no case for it)
- **AC-9**: API key modal — `[VALIDATING...]` → `[SAVING...]`; error message no longer implies a network validation occurred
- **AC-10**: CRAFT mode — Flash refine output is now buffered internally; `onChunk` is never called during CRAFT generation; result reveals complete on `onComplete` with no mid-stream visual snap
- **AC-11**: SLOP retry — `[QUALITY CHECK FAILED — RETRYING...]` overlay shown for 500ms before stream clears; no more silent content wipe
- **AC-12**: Result header now shows `[SLOP] Q:4/4` / `[CRAFT] Q:3/4` instead of V1 `A — MINIMAL` / `B — DECORATIVE` labels; `qualityScore` and `mode` propagated from generation result through to display

---

## [2026-03-18] v0.3.0 — V2 architecture: SLOP/CRAFT modes, skill pills, quality gate, streaming

### Added
- **SLOP/CRAFT mode system** — two-mode generation architecture. SLOP: single Gemini Flash stream with quality gate + 1 auto-retry (~5–8s). CRAFT: Gemini Pro architect pass (buffered) followed by Flash refinement stream (~15–20s).
- **Skill pills** — 8 composable skills across 4 slots (aesthetic, precision, domain, constraint). One active skill per slot; each injects one imperative sentence into the system prompt. Skills: BRUTAL, GHOST, STRICT, ADAPTIVE, TERMINAL, README, COMPACT, WIDE.
- **Quality gate** — 4-check composite scorer applied after each generation attempt. Score ≥3/4 required to proceed; SLOP mode retries once automatically on failure.
- **rAF-batched streaming output** — chunks accumulate in a buffer ref and flush via `requestAnimationFrame`, producing smooth 60fps typewriter display without per-chunk setState calls.
- **History panel with V1→V2 backward-compatible migration** — on first load, legacy history items (`templates: [...]` format) are detected and migrated to V2 format (`template: {...}`) automatically.
- **5 color themes via CSS custom property system** — theme selection drives `--theme-primary`, `--theme-text`, and `--theme-dim` custom properties throughout the UI. Available themes: amber, green, blue, pink, white.

### Changed
- **Single-output architecture** — replaced V1 dual-template generation with a single focused output per generation request.
- **Theme system cleanup** — all hardcoded amber color values replaced with `--theme-primary` / `color-mix()` references; theme switching now applies globally without component-level overrides.

### Removed
- **Dual-template generation** — `generateTemplates()` function and the two-simultaneous-call architecture removed.
- **`generating-display.tsx`** — dead component removed.
- **Legacy generation constants** — V1 template pair constants and associated configuration removed.

---

## [2026-03-10] v1.1 — Polish pass: favicon, TypeScript clean, audit

### Fixed
- TypeScript compiler fully clean: 0 errors, 0 warnings.
- ESLint clean pass across all source files.
- Favicon added and correctly linked.

### Changed
- All 9 acceptance criteria verified passing.
- Code quality and visual design audits completed.

---

## [2026-02-20] v1.0 — Initial release

### Added
- Glyph rendering engine: generates styled ASCII/Unicode art from text input using configurable font and block presets.
- CRT terminal UI: scanline overlay, amber phosphor glow, cursor blink, monospace layout.
- 2 visual template variations per generation request.
- Clipboard copy: one-keystroke export of rendered glyph to system clipboard.
- Local API key storage: key persisted in `localStorage`, never sent to a server.
- Demo mode: runs without an API key, ships with 8 pre-rendered example glyphs.
- Responsive layout: scales from 1280px down to 800px without breaking the grid.

---
