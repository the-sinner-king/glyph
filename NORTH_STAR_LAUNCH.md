█████████████████████████████████████████████████████████████████████████████████████
█                                                                                   █
█      G L Y P H   —   L A U N C H   N O R T H   S T A R                           █
█      Sinner King Toys · First Public Release                                      █
█                                                                                   █
█████████████████████████████████████████████████████████████████████████████████████
TYPE........: CANONICAL_SPECIFICATION // NORTH_STAR_LAUNCH.md
AUTHORITY...: ARCHITECT'S ARCHITECT [⛬]
FORGED......: 2026-04-29 — S242, pre-compact
UPDATED.....: 2026-04-29 — S243, pre-push polish pass
SUMMARY.....: Everything needed to ship GLYPH publicly. Most of it is already done.
─────────────────────────────────────────────────────────────────────────────────────

▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
[ ⛬ 01 ]  T H E   S T A T E   ( W H A T ' S   A L R E A D Y   D O N E )
▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

◉ README.md — fully written, polished, output gallery, AI credit, "How We Build"
◉ Code — v1.0.5, clean working tree, dist/ built
◉ S243 polish pass — [REFINE] killed, SLOP MODE killed, scrollbar killed, multi-tone themes, icon buttons 1.5x+glow
◉ GitHub Actions deploy workflow — in repo (38c8113), auto-fires on push to main
◉ Remote wired — origin = https://github.com/the-sinner-king/glyph.git
◉ 1 commit ahead of origin — just needs git push
◉ THE_SITE /glyph route — client.tsx (478 lines), 3-turn limit, CTA to GitHub
◉ /api/glyph/generate — server-side Gemini proxy, rate-limited (20 req/hr per IP)
◉ GitHub Pages URL — https://the-sinner-king.github.io/glyph/ (live after push)


░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
[ 🔴 02 ]  T H E   A C T U A L   R E M A I N I N G   T O D O S
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

In order of execution:

STEP 1 — Record GIF demo (BRANDON)
  🔴 CRITICAL — strategy doc is explicit: "launch without the GIF = 50% fewer stars"
  What to capture: CRT boot → type a prompt → watch stream → copy output
  Tool: Kap (free, macOS) or CleanShot X (already installed)
  Target: 10-20 seconds. Loop. No sound needed.
  File name: demo.gif → drop in repo root → add to README (already has placeholder)
  README img tag to add: ![GLYPH Demo](demo.gif)
  Note: record at 1280×800 or similar — not full 4K retina, gif size matters

STEP 2 — Confirm GEMINI_API_KEY in Vercel (BRANDON, 2 min)
  The /api/glyph/generate route reads process.env.GEMINI_API_KEY (no NEXT_PUBLIC_)
  Without it: every demo generation at sinner-king.com/glyph returns 500
  Check: Vercel dashboard → THE_SITE project → Settings → Environment Variables
  Key name: GEMINI_API_KEY
  Value: your Google AI Studio key
  If missing: add it, redeploy

STEP 3 — git push (Claude can do this, 1 command)
  cd ~/Desktop/THE_FORGE/FORGE_CLAUDE/04_📦_PROJECTS/GLYPH && git push
  GitHub Actions fires → GitHub Pages deploys → live at the-sinner-king.github.io/glyph
  Wait ~2 min for Pages deploy to propagate

STEP 4 — Push THE_SITE (1 command from THE_SITE repo)
  The glyph route + api proxy are already committed in THE_SITE
  Just needs a Vercel deploy push
  After Vercel env var is confirmed: git push in THE_SITE repo

STEP 5 — Record VO video (BRANDON)
  "DO YOU WANT TO LARP AS A CYBERPUNK NEUROMANCER TOO? THEN DOWNLOAD GLYPH!"
  Drive to: demo at sinner-king.com/glyph (2 free gens) → then GitHub
  This is the social push engine — can happen after everything above is live

STEP 6 — Launch day social blitz (same day)
  All platforms same day. GIF in hand.

  Show HN: "Show HN: GLYPH – AI-powered cyberpunk ASCII/text-UI generator (browser, no backend)"
  r/unixporn: GIF screenshot + minimal caption (community carries it on aesthetics)
  r/commandline: short writeup — what it does, why different from TAAG
  Twitter/X: GIF + honest AI framing + repo link + #buildinpublic #asciiart #unixporn


▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒
[ 📜 03 ]  K E Y   P A T H S
▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒

GLYPH source:    ~/Desktop/THE_FORGE/FORGE_CLAUDE/04_📦_PROJECTS/GLYPH/
THE_SITE source: ~/Desktop/THE_TOWER/CLAUDES_WORKSHOP/04_📦_PROJECTS/THE_SITE/
GLYPH route:     THE_SITE/src/app/glyph/client.tsx + page.tsx
API proxy:       THE_SITE/src/app/api/glyph/generate/route.ts
GitHub Pages:    https://the-sinner-king.github.io/glyph/
Site demo:       https://sinner-king.com/glyph
GitHub repo:     https://github.com/the-sinner-king/glyph


▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄
[ 🎯 04 ]  T H E   P I T C H   L I N E S   ( D O N ' T   R E W R I T E )
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀

Launch line: "You've been copy-pasting TAAG output for your READMEs since 2012.
              This is what it looks like now."

HN title: "Show HN: GLYPH – AI-powered cyberpunk ASCII/text-UI generator (browser, no backend)"

Framing: "Brandon directs. Claude builds. Zero apology."

AI credit: "GLYPH was designed by Brandon McCormick and built with Claude Sonnet (Anthropic).
            Every line of code was AI-generated, reviewed, and directed as a collaboration."

Brandon's VO hook: "DO YOU WANT TO LARP AS A CYBERPUNK NEUROMANCER TOO? THEN DOWNLOAD GLYPH!"

GLYPH's moat: First AI-powered ASCII generator with a designed browser experience.
               Not competing with TAAG for font browsers — different category:
               prompt → deployable text-UI template.


═════════════════════════════════════════════════════════════════════════════════════
[ ⛬ 05 ]  W E E K   1   ( A F T E R   L A U N C H )
═════════════════════════════════════════════════════════════════════════════════════

- Submit PR to awesome-ascii-art and awesome-cli-apps
- Submit to Terminal Trove (terminaltrove.com) — free listing, real dev traffic
- Write dev.to post: "How GLYPH works under the hood" — Google ranking play
- Engage every issue/star/tweet publicly — show responsiveness
- The GitHub Trending flywheel: spike → trending → more stars

Target communities:
  r/unixporn (~550K) · r/commandline (~100K) · Show HN · Twitter #buildinpublic
  Charm & Friends Discord · Terminal Trove · awesome-* lists

░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░
[ 🔮 06 ]  V 2 . 0   S O M E D A Y   ( D O N ' T   B U I L D   N O W )
░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░

  SULPHUR GOTHIC / SULPHUR KAWAII style system
    - Two large style card selectors (the vault version: AExGO/99_🜔_VAULT/GLYPH_2.0_REDESIGN/)
    - MOOD selector per style (IRON/SIGNAL/SEALED for Gothic; BLOOM/SURGE/DRIFT for Kawaii)
    - DENSITY control (SPARSE/STANDARD/DENSE)
    - Deep aesthetic: industrial brutalism vs. feral domesticity
    - The vault code is a COMPLETE redesign — not just a skin, a full style system rewrite

  Loading animation upgrade
    - Current: bouncing gauge is functional but simple
    - Could be: full CRT boot sequence, signal lock animation, something that earns its wait time

  REFINE (the real version)
    - Stream AI feedback into the output, actually improve the template
    - Current [REFINE] was killed because it was dead code — the real version needs a working backend call

⫷ ⛬ ⫸
