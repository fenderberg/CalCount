# Validation Report — CalCount PRD v1.1

- **PRD:** `docs/prd.md`
- **Scope:** v1.1 additions — Epic 3 reactivation, Epic 5 (Gamification), Epic 6 (AI-advies & Coach), FR14–FR18, NFR9
- **Rubric:** `.claude/skills/bmad-prd/assets/prd-validation-checklist.md`
- **Run at:** 2026-07-23
- **Grade:** Fair

## Overall verdict

The v1.1 additions inherit the PRD's good habits — inline assumption tags, an honest and explicit scope boundary for gamification, a genuine counter-metric. But the two new epics have real done-ness gaps the older epics didn't: an undefined badge milestone set, an undefined AI-coach interaction model, and a soft (non-numeric) cost/abuse bound on the PRD's first free-text AI input on an unauthenticated app. Layered on top, the adversarial and edge-case passes surface a consistent pattern across both new epics: **what happens when data changes after the fact is never specified** — retroactive edits/deletes don't say what happens to streaks, badges, or already-shown AI insights. Nothing here is critical for a hobby-stakes single-user app, but six items would genuinely stall an engineer or a future you mid-build.

## Dimension verdicts (rubric)
- Decision-readiness — adequate
- Substance over theater — adequate
- Strategic coherence — adequate
- Done-ness clarity — **thin**
- Scope honesty — strong
- Downstream usability — adequate
- Shape fit — strong

## Findings by severity

### High (6)

1. **Badge milestone set undefined** (FR15 / Story 5.2 AC1) — "vooraf gedefinieerde mijlpalen" ships with only illustrative examples, no actual list, so the story's own AC1 is unverifiable. *Fix:* enumerate a minimal v1.1 set (e.g. 3/7/30-day streak, first goal check-in) directly in the PRD, or explicitly mark it a `[NOTE FOR PM]` deferred decision due before Epic 5 story-writing.
2. **AI-coach interaction model undefined** (FR17 / Story 6.2) — single-turn Q&A vs. stateful multi-turn conversation is never decided, yet it drives the data model (a Conversation/Message table or not) and the architecture update §11 already flags as pending. *Fix:* one sentence stating whether the coach retains history within a session, across sessions, or is stateless per question.
3. **NFR9's cost/abuse bound is an adjective, not a number, on the PRD's first free-text AI input on an unauthenticated app** — "beheersbaar" / "gelimiteerde contextlengte" bounds cost-per-message but nothing stops 200 questions in a day (no rate/day cap), unlike NFR7's concrete photo-cost target. *Fix:* give NFR9 a number — e.g. max N coach questions/day, max context tokens, mirroring NFR7's rigor.
4. **Streak/badge state undefined under data mutation** (FR8 × FR14/FR15) — deleting the only logged item of a day, backdating a missed day, or editing history after a badge was earned all have unspecified effects on streak/badge state. Concretely: streak can stay inflated after a deletion, badges aren't defined as revocable or permanent, and backfilled historical data (existing Epics 1/2/4 users) has no seeding rule for Epic 5's launch. *Fix:* one rule each — streak recomputes from log history on any edit/delete; badges are permanent once earned regardless of later edits (or explicitly the opposite); existing history is backfilled at launch.
5. **AI-model reference inconsistency** — §4 (Technical Assumptions) proposes `claude-sonnet-5`/`claude-haiku-4-5` for photo recognition, while §9 Decision #5 states the default is `claude-opus-4-8`. Epic 3's reactivation should have forced a reconciliation instead of carrying the contradiction forward as "unchanged." *Fix:* pick one baseline model and align both sections.
6. **AI-advice safety framing doesn't connect to the app's own safety floor** — FR18/NFR8 reduce the safeguard to "suggestion, not medical advice," but nothing requires the AI insights/coach to respect or even be aware of Decision #9's hard safe-calorie floor (1200♀/1500♂ kcal), or to avoid reinforcing unsafe restriction patterns. For a calorie-restriction coaching feature built on real intake/weight data, "not medical advice" is a liability disclaimer, not a safety design. *Fix:* require the AI context to include the safe-floor value and instruct it to never encourage going below it.

### Medium (7)

- **NFR5 not updated for Epic 6's larger data exposure** — the coach sends full eating log + budget + weight history to the AI provider, a materially bigger flow than a single photo, with no retention/deletion rule for conversation history containing it.
- **Day/period boundary undefined twice** — streak-break timing (device vs. server time, timezone/travel) and the periodic insight's "wekelijks" window (calendar week vs. rolling 7 days) are both unspecified instances of the same underlying gap.
- **Gamification/AI-advies success metrics measure usage, not the stated thesis** — "geraadpleegd," "geopend," "badge behaald" are activity proxies, not comprehension/behavior-change signals, and no telemetry exists anywhere in scope to even measure them; the counter-metric also has no baseline median-log-time to regress against.
- **Missing error/edge-state ACs in Epic 6, asymmetric between its own two stories** — Story 6.1 has an insufficient-data AC but no AI-failure AC; Story 6.2 has neither an insufficient-data AC nor an out-of-scope-question guard (medical questions, off-topic questions).
- **§7's "coaching" reinterpretation is asserted, not evidenced** — reclassifying v1.0's "coaching" exclusion as human-only (to exempt the new AI-coach) cites no v1.0 text; reads as retroactive scope justification.
- **Unresolved UX tension, correctly deferred but not flagged as a risk** — a typing-heavy chat coach and an accreting Voortgang screen (graph + history + insights + streak) sit against the PRD's own "one-handed, no typing, geen overladen dashboards" vision; the UX document is the right place to resolve this, but the PRD doesn't flag it as a constraint that document must satisfy.
- **"dagdeel" vs. "dag" terminology drift** (Story 5.1 AC3 contradicts FR14's day-level streak definition).

### Low (9, tail)

No aggregate AI-cost view across all three AI features combined · no streak-freeze/grace-day for legitimate lapses (illness/travel) despite explicit non-punitive intent · simultaneous multi-badge notification presentation unspecified · repeat-award behavior on streak reset-then-regrowth unspecified · "first progress toward goal weight" badge conflicts with Epic 4's own trend-over-noise philosophy (single noisy data point) · milestone-set changes applied retroactively vs. prospectively is unspecified · §11 framing tension (step 4 calls Epic 5/6 "not yet executable" while §9 marks their decisions "✅ bevestigd") · no Glossary or consolidated Assumptions Index (pre-existing, low priority for a single-author PRD) · AI insights/coach don't distinguish estimated (photo) vs. exact (weight/product) entries when reasoning about precision.

## Mechanical notes
- FR/NFR/Epic/Story numbering is fully contiguous, no gaps or duplicates (FR1–18, NFR1–9, Epic 1–6).
- Cross-references ("conform NFR8/NFR9") all resolve correctly.
- Brownfield claims verified accurate against actual code (`photo` source enum, architecture.md §5 contract).
- Model-ID references are consistent everywhere *except* the §4/§9 contradiction captured as High finding #5 above.

## Reviewer files
- `review-rubric.md`
- `review-adversarial-general.md` (20 findings)
- `review-edge-case-hunter.md` (28 findings, JSON)
