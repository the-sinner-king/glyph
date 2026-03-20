#!/usr/bin/env bash
# =============================================================================
# GLYPH — Model Configuration Regression Test
# =============================================================================
#
# Guards against the March 2026 incident: gemini-2.0-flash was retired for new
# users, causing a hard crash on launch. These checks prevent the same class of
# bug from shipping silently in future model updates.
#
# Run: bash tests/test-model-config.sh
# Exit 0 = all pass. Exit 1 = failures found.
# =============================================================================

set -euo pipefail

GEMINI_SRC="src/lib/services/gemini.ts"
MODE_TOGGLE_SRC="src/features/generator/mode-toggle.tsx"
PASS=0
FAIL=0

pass() { echo "  ✓ $1"; PASS=$((PASS+1)); }
fail() { echo "  ✗ $1"; FAIL=$((FAIL+1)); }

echo ""
echo "════════════════════════════════════════════"
echo "  GLYPH MODEL CONFIG — REGRESSION TESTS"
echo "════════════════════════════════════════════"
echo ""
echo "── gemini.ts model constants ──"

# 1. Retired model must NOT be active
if grep -q "MODEL_FLASH = 'gemini-2.0-flash'" "$GEMINI_SRC" || \
   grep -q 'MODEL_FLASH = "gemini-2.0-flash"' "$GEMINI_SRC"; then
  fail "MODEL_FLASH still set to retired gemini-2.0-flash"
else
  pass "MODEL_FLASH is not retired gemini-2.0-flash"
fi

# 2. Current Flash model must be set
if grep -q "MODEL_FLASH = 'gemini-3-flash-preview'" "$GEMINI_SRC" || \
   grep -q 'MODEL_FLASH = "gemini-3-flash-preview"' "$GEMINI_SRC"; then
  pass "MODEL_FLASH = gemini-3-flash-preview (Gemini 3 Flash)"
else
  fail "MODEL_FLASH is not gemini-3-flash-preview — may need update"
fi

# 3. Pro model must be present and non-empty
if grep -qE "MODEL_PRO\s*=\s*'gemini-3\.1-pro" "$GEMINI_SRC" || \
   grep -qE 'MODEL_PRO\s*=\s*"gemini-3\.1-pro' "$GEMINI_SRC"; then
  pass "MODEL_PRO is gemini-3.1-pro family"
else
  fail "MODEL_PRO is not a gemini-3.1-pro model"
fi

# 4. MODEL_FLASH must be used in runSlopMode
if grep -q "model: MODEL_FLASH" "$GEMINI_SRC"; then
  pass "MODEL_FLASH is wired into model calls"
else
  fail "MODEL_FLASH is not referenced in model calls — may be orphaned constant"
fi

# 5. MODEL_PRO must be used in runCraftMode
if grep -q "model: MODEL_PRO" "$GEMINI_SRC"; then
  pass "MODEL_PRO is wired into model calls"
else
  fail "MODEL_PRO is not referenced in model calls — may be orphaned constant"
fi

# 6. Constants must be exported (for testability)
if grep -qE "^export (const MODEL_FLASH|const MODEL_PRO)" "$GEMINI_SRC"; then
  pass "MODEL_FLASH and MODEL_PRO are exported"
else
  fail "MODEL constants are not exported — tests cannot import them"
fi

echo ""
echo "── mode-toggle.tsx UI labels ──"

# 7. Flash model label visible in toggle
if grep -q "Flash 3" "$MODE_TOGGLE_SRC"; then
  pass "Flash 3 label present in mode toggle"
else
  fail "Flash 3 label missing from mode toggle — users can't see which model runs"
fi

# 8. Pro model label visible in toggle
if grep -q "Pro 3.1" "$MODE_TOGGLE_SRC"; then
  pass "Pro 3.1 label present in mode toggle"
else
  fail "Pro 3.1 label missing from mode toggle — users can't see which model runs"
fi

echo ""
echo "── thinkingConfig guard (prevents reasoning token pollution) ──"
# Gemini 3.x models are thinking-mandatory. thinkingBudget: 0 throws "Budget 0 is invalid."
# Fix: valid positive budget + includeThoughts: false (thinking runs server-side, not returned).

# 10. SLOP config must have includeThoughts: false
if grep -A3 "SLOP" "$GEMINI_SRC" | grep -q "includeThoughts: false"; then
  pass "SLOP config has includeThoughts: false"
else
  fail "SLOP config missing includeThoughts: false — Flash 3 thought tokens will appear in stream"
fi

# 11. CRAFT_ARCHITECT config must have includeThoughts: false
if grep -A3 "CRAFT_ARCHITECT" "$GEMINI_SRC" | grep -q "includeThoughts: false"; then
  pass "CRAFT_ARCHITECT config has includeThoughts: false"
else
  fail "CRAFT_ARCHITECT config missing includeThoughts: false — Pro 3.1 reasoning will pollute output"
fi

# 12. CRAFT_REFINE config must have includeThoughts: false
if grep -A3 "CRAFT_REFINE" "$GEMINI_SRC" | grep -q "includeThoughts: false"; then
  pass "CRAFT_REFINE config has includeThoughts: false"
else
  fail "CRAFT_REFINE config missing includeThoughts: false — Flash 3 refine reasoning will pollute output"
fi

# 10b. thinkingBudget must NOT be 0 on any config (0 is invalid for thinking-mandatory models)
# grep -v '//' strips comment lines before checking for the value
if grep -v '//' "$GEMINI_SRC" | grep -q "thinkingBudget: 0"; then
  fail "thinkingBudget: 0 in live code — Gemini 3.x throws 'Budget 0 is invalid. This model only works in thinking mode.'"
else
  pass "No thinkingBudget: 0 in live code — models will not throw on generation"
fi

# 13. thinkingConfig must be forwarded in all three API calls
THINKING_CALL_COUNT=$(grep -c "thinkingConfig: .*\.thinkingConfig" "$GEMINI_SRC" || true)
if [ "$THINKING_CALL_COUNT" -ge 3 ]; then
  pass "thinkingConfig forwarded in all 3 API call sites"
else
  fail "thinkingConfig not forwarded in all API calls (found $THINKING_CALL_COUNT/3) — config set but not sent to Gemini"
fi

echo ""
echo "── retired model blocklist ──"

RETIRED_MODELS=(
  "gemini-2.0-flash'"
  'gemini-2.0-flash"'
  "gemini-2.5-flash'"
  'gemini-2.5-flash"'
  "gemini-2.5-pro-preview'"
  'gemini-2.5-pro-preview"'
  "gemini-1.5-flash'"
  'gemini-1.5-flash"'
  "gemini-1.0-pro'"
  'gemini-1.0-pro"'
)

FOUND_RETIRED=false
for m in "${RETIRED_MODELS[@]}"; do
  if grep -q "$m" "$GEMINI_SRC"; then
    fail "Retired model string found in gemini.ts: $m"
    FOUND_RETIRED=true
  fi
done
if [ "$FOUND_RETIRED" = false ]; then
  pass "No retired model strings found in gemini.ts"
fi

echo ""
echo "════════════════════════════════════════════"
echo "  RESULTS: ${PASS} passed · ${FAIL} failed"
echo "════════════════════════════════════════════"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
